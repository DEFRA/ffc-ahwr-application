import { buildData } from '../data/index.js'
import { raiseApplicationStatusEvent } from '../event-publisher/index.js'
import { Op, Sequelize } from 'sequelize'
import { startandEndDate } from '../lib/date-utils.js'
import { claimDataUpdateEvent } from '../event-publisher/claim-data-update-event.js'

const { models, sequelize } = buildData

export const getApplication = async (reference) => {
  return models.application.findOne(
    {
      where: { reference: reference.toUpperCase() },
      include: [
        {
          model: models.status,
          attributes: ['status']
        },
        {
          model: models.flag,
          as: 'flags',
          attributes: ['appliesToMh'],
          where: {
            deletedBy: null
          },
          required: false
        }
      ]
    })
}

export const getLatestApplicationsBySbi = async (sbi) => {
  return models.application
    .findAll(
      {
        where: { 'data.organisation.sbi': sbi },
        include: [
          {
            model: models.flag,
            as: 'flags',
            attributes: ['appliesToMh'],
            where: {
              deletedBy: null
            },
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      }
    )
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

export const evalSortField = (sort) => {
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

const buildSearchQuery = (searchText, searchType, filter) => {
  const query = {
    include: [
      {
        model: models.status,
        attributes: ['status']
      },
      {
        model: models.flag,
        as: 'flags',
        attributes: ['appliesToMh'],
        where: {
          deletedBy: null
        },
        required: false
      }
    ]
  }

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
        query.include[0] =
          {
            model: models.status,
            attributes: ['status'],
            where: { status: { [Op.iLike]: `%${searchText}%` } }
          }
        break
    }
  }

  if (filter && filter.length > 0) {
    query.include[0] =
      {
        model: models.status,
        attributes: ['status'],
        where: { status: filter }
      }
  }

  return query
}

export const searchApplications = async (searchText, searchType, filter, offset = 0, limit = 10, sort = { field: 'createdAt', direction: 'DESC' }) => {
  let query = buildSearchQuery(searchText, searchType, filter)

  let total = 0
  let applications = []
  let applicationStatus = []

  total = await models.application.count(query)

  if (total > 0) {
    applicationStatus = await models.application.findAll({
      attributes: ['status.status', [sequelize.fn('COUNT', 'application.id'), 'total']],
      ...query,
      group: ['status.status', 'flags.id'],
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
  return models.application.findAll(query)
}

export const setApplication = async (data) => {
  const result = await models.application.create(data)
  await raiseApplicationStatusEvent({
    message: 'New application has been created',
    application: result.dataValues,
    raisedBy: result.dataValues.createdBy,
    raisedOn: result.dataValues.createdAt
  })
  return result
}

export const updateApplicationByReference = async (dataWithNote, publishEvent = true) => {
  const { note, ...data } = dataWithNote

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
        await raiseApplicationStatusEvent({
          message: 'Application has been updated',
          application: updatedRecord.dataValues,
          raisedBy: updatedRecord.dataValues.updatedBy,
          raisedOn: updatedRecord.dataValues.updatedAt,
          note
        })
      }
    }

    return result
  } catch (error) {
    console.error('Error updating application by reference:', error)
    throw error
  }
}

export const findApplication = async (reference) => {
  const application = await models.application.findOne({ where: { reference } })

  return application === null ? application : application.dataValues
}

export const updateApplicationData = async (reference, updatedProperty, newValue, oldValue, note, user) => {
  const data = Sequelize.fn(
    'jsonb_set',
    Sequelize.col('data'),
    Sequelize.literal(`'{${updatedProperty}}'`),
    Sequelize.literal(`'${JSON.stringify(newValue)}'`)
  )

  // eslint-disable-next-line no-unused-vars
  const [_, updates] = await models.application.update(
    { data },
    {
      where: { reference },
      returning: true
    }
  )

  const [updatedRecord] = updates
  const { updatedAt, data: { organisation: { sbi } } } = updatedRecord.dataValues

  const eventData = {
    applicationReference: reference,
    reference,
    updatedProperty,
    newValue,
    oldValue,
    note
  }
  const type = `application-${updatedProperty}`
  await claimDataUpdateEvent(eventData, type, user, updatedAt, sbi)

  await buildData.models.claim_update_history.create({
    applicationReference: reference,
    reference,
    note,
    updatedProperty,
    newValue,
    oldValue,
    eventType: type,
    createdBy: user
  })
}
