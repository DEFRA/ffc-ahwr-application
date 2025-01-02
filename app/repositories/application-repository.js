import { buildData } from '../data'
import eventPublisher from '../event-publisher'
import { Op } from 'sequelize'
import { startandEndDate } from '../lib/date-utils'

const { models, sequelize } = buildData

export const getApplication = async (reference) => {
  return models.application.findOne(
    {
      where: { reference: reference.toUpperCase() },
      include: [
        {
          model: models.status,
          attributes: ['status']
        }
      ]
    })
}

export const getLatestApplicationsBySbi = async (sbi) => {
  const result = await models.application
    .findAll(
      {
        where: { 'data.organisation.sbi': sbi },
        order: [['createdAt', 'DESC']],
        raw: true
      })
  return result
}

export const getBySbi = async (sbi) => {
  return models.application.findOne({
    where: {
      'data.organisation.sbi': sbi
    },
    order: [['createdAt', 'DESC']]
  })
}

export const getByEmail = async (email) => {
  return models.application.findOne(
    {
      order: [['createdAt', 'DESC']],
      where: { 'data.organisation.email': email.toLowerCase() }
    })
}

const evalSortField = (sort) => {
  if (sort?.field) {
    switch (sort.field.toLowerCase()) {
      case 'status':
        return [models.status, sort.field.toLowerCase(), sort.direction ?? 'ASC']
      case 'apply date':
        return ['createdAt', sort.direction ?? 'ASC']
      case 'reference':
        return ['reference', sort.direction ?? 'ASC']
      case 'sbi':
        return ['data.organisation.sbi', sort.direction ?? 'ASC']
      case 'organisation':
        return ['data.organisation.name', sort.direction ?? 'ASC']
    }
  }
  return ['createdAt', sort?.direction ?? 'ASC']
}

export const searchApplications = async (searchText, searchType, filter, offset = 0, limit = 10, sort = { field: 'createdAt', direction: 'DESC' }) => {
  let query = {
    include: [
      {
        model: models.status,
        attributes: ['status']
      }
    ]
  }
  let total = 0
  let applications = []
  let applicationStatus = []
  if (searchText) {
    switch (searchType) {
      case 'sbi':
        query.where = { 'data.organisation.sbi': searchText }
        break
      case 'organisation':
        query.where = { 'data.organisation.name': { [Op.iLike]: `%${searchText}%` } }
        break
      case 'ref':
        query.where = { reference: searchText }
        break
      case 'date':
        query.where = {
          createdAt: {
            [Op.gte]: startandEndDate(searchText).startDate,
            [Op.lt]: startandEndDate(searchText).endDate
          }
        }
        break
      case 'status':
        query.include = [
          {
            model: models.status,
            attributes: ['status'],
            where: { status: { [Op.iLike]: `%${searchText}%` } }
          }]
        break
    }
  }

  if (filter && filter.length > 0) {
    query.include = [
      {
        model: models.status,
        attributes: ['status'],
        where: { status: filter }
      }
    ]
  }
  total = await models.application.count(query)

  if (total > 0) {
    applicationStatus = await models.application.findAll({
      attributes: ['status.status', [sequelize.fn('COUNT', 'application.id'), 'total']],
      ...query,
      group: ['status.status'],
      raw: true
    })
    sort = evalSortField(sort)
    query = {
      ...query,
      order: [sort],
      limit,
      offset
    }
    applications = await models.application.findAll(query)
  }
  return {
    applications, total, applicationStatus
  }
}

export const getAllApplications = async () => {
  const query = {
    order: [['createdAt', 'DESC']]
  }
  return await models.application.findAll(query)
}

export const getAllClaimedApplications = async (claimStatusIds) => {
  return await models.application.count({
    where: {
      statusId: claimStatusIds // shorthand for IN operator
    }
  })
}

export const setApplication = async (data) => {
  const result = await models.application.create(data)
  eventPublisher.raise({
    message: 'New application has been created',
    application: result.dataValues,
    raisedBy: result.dataValues.createdBy,
    raisedOn: result.dataValues.createdAt
  })
  return result
}

export const updateApplicationByReference = async (data, publishEvent = true) => {
  try {
    const application = await models.application.findOne({
      where: {
        reference: data.reference
      },
      returning: true
    })

    if (application?.dataValues?.statusId === data?.statusId) return application

    const result = await models.application.update(data, {
      where: {
        reference: data.reference
      },
      returning: true
    })

    const updatedRows = result[0] // Number of affected rows
    const updatedRecords = result[1] // Assuming this is the array of updated records

    if (publishEvent) {
      for (let i = 0; i < updatedRows; i++) {
        const updatedRecord = updatedRecords[i]
        eventPublisher.raise({
          message: 'Application has been updated',
          application: updatedRecord.dataValues,
          raisedBy: updatedRecord.dataValues.updatedBy,
          raisedOn: updatedRecord.dataValues.updatedAt
        })
      }
    }

    return result
  } catch (error) {
    console.error('Error updating application by reference:', error)
    throw error
  }
}
