import { buildData } from '../data/index.js'
import { raiseClaimEvents } from '../event-publisher/index.js'
import { startandEndDate } from '../lib/date-utils.js'
import { claimDataUpdateEvent } from '../event-publisher/claim-data-update-event.js'
import { Op, Sequelize } from 'sequelize'
import { findApplication } from './application-repository.js'

const { models } = buildData

export const getClaimByReference = (reference) => {
  return models.claim.findOne({
    where: { reference: reference.toUpperCase() },
    include: [
      {
        model: models.status,
        attributes: ['status']
      }
    ]
  })
}

export const getByApplicationReference = async (applicationReference, typeOfLivestock) => {
  let where = { applicationReference: applicationReference.toUpperCase() }

  if (typeOfLivestock) {
    where = { ...where, 'data.typeOfLivestock': typeOfLivestock }
  }

  const result = await models.claim.findAll({
    where,
    include: [
      {
        model: models.status,
        attributes: ['status']
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  return result
}

export const setClaim = async (data) => {
  const sbi = data.sbi
  const result = await models.claim.create(data)
  await raiseClaimEvents({
    message: 'New claim has been created',
    claim: result.dataValues,
    raisedBy: result.dataValues.createdBy,
    raisedOn: result.dataValues.createdAt
  }, sbi)
  return result
}

export const updateClaimByReference = async (data, note, logger) => {
  try {
    const claim = await models.claim.findOne({
      where: {
        reference: data.reference
      }
    })

    if (claim?.dataValues?.statusId === data.statusId) return claim

    const result = await models.claim.update(data, {
      where: {
        reference: data.reference
      },
      returning: true
    })

    const updatedRecord = result[1][0]

    await raiseClaimEvents({
      message: 'Claim has been updated',
      claim: updatedRecord.dataValues,
      note,
      raisedBy: updatedRecord.dataValues.updatedBy,
      raisedOn: updatedRecord.dataValues.updatedAt
    }, data.sbi)
  } catch (err) {
    logger.setBindings({ err })
    throw err
  }
}

export const getAllClaimedClaims = async (claimStatusIds) => {
  return models.claim.count({
    where: {
      statusId: claimStatusIds // shorthand for IN operator
    }
  })
}

export const isURNNumberUnique = async (sbi, laboratoryURN) => {
  const applications = await models.application.findAll({ where: { 'data.organisation.sbi': sbi } })

  if (applications.find((application) => application.dataValues?.data?.urnResult?.toLowerCase() === laboratoryURN.toLowerCase())) return { isURNUnique: false }

  const applicationsReferences = applications.map((application) => application.dataValues.reference)
  const claims = await models.claim.findAll({ where: { applicationReference: applicationsReferences } })
  if (claims.find((claim) => claim.dataValues?.data?.laboratoryURN?.toLowerCase() === laboratoryURN.toLowerCase())) return { isURNUnique: false }

  return { isURNUnique: true }
}

const evalSortField = (sort) => {
  if (sort !== null && sort !== undefined && sort.field !== undefined) {
    switch (sort.field.toLowerCase()) {
      case 'status':
        return [models.status, sort.field.toLowerCase(), sort.direction ?? 'ASC']
      case 'claim date':
        return ['createdAt', sort.direction ?? 'ASC']
      case 'sbi':
        return ['data.organisation.sbi', sort.direction ?? 'ASC']
      case 'claim number':
        return ['reference', sort.direction ?? 'ASC']
      case 'type of visit':
        return ['type', sort.direction ?? 'ASC']
      case 'species':
        return ['data.typeOfLivestock', sort.direction ?? 'ASC']
    }
  }
  return ['createdAt', sort.direction ?? 'ASC']
}

const applySearchConditions = (query, search) => {
  if (!search?.text || !search?.type) return

  const { text, type } = search

  switch (type) {
    case 'ref':
      query.where = { reference: text }
      break
    case 'appRef':
      query.where = { applicationReference: text }
      break
    case 'type':
      query.where = { type: text }
      break
    case 'species':
      query.where = { 'data.typeOfLivestock': text }
      break
    case 'status':
      query.include = [
        {
          model: models.application,
          attributes: ['data']
        },
        {
          model: models.status,
          attributes: ['status'],
          where: { status: { [Op.iLike]: `%${text}%` } }
        },
        {
          model: models.flag,
          as: 'flags',
          attributes: ['appliesToMh'],
          where: { deletedBy: null },
          required: false
        }
      ]
      break
    case 'sbi': {
      query.include = [
        {
          model: models.status,
          attributes: ['status']
        },
        {
          model: models.application,
          attributes: ['data'],
          where: { 'data.organisation.sbi': text }
        },
        {
          model: models.flag,
          as: 'flags',
          attributes: ['appliesToMh'],
          where: { deletedBy: null },
          required: false
        }
      ]
      break
    }
    case 'date': {
      const { startDate, endDate } = startandEndDate(text)
      query.where = {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        }
      }
      break
    }
  }
}

export const searchClaims = async (search, filter, offset, limit, sort = { field: 'createdAt', direction: 'DESC' }) => {
  if (search?.type && !['ref', 'appRef', 'type', 'species', 'status', 'sbi', 'date', 'reset'].includes(search.type)) {
    return { total: 0, claims: [] }
  }

  const query = {
    include: [
      {
        model: models.status,
        attributes: ['status']
      },
      {
        model: models.application,
        attributes: ['data']
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

  applySearchConditions(query, search)

  if (filter) {
    query.where = {
      ...query.where,
      [filter.field]: {
        [Op[filter.op]]: filter.value
      }
    }
  }

  return {
    total: await models.claim.count(query),
    claims: await models.claim.findAll({ ...query, order: [evalSortField(sort)], limit, offset })
  }
}

export const findClaim = async (reference) => {
  const claim = await buildData.models.claim.findOne({ where: { reference } })
  return claim === null ? claim : claim.dataValues
}

export const updateClaimData = async (reference, updatedProperty, newValue, oldValue, note, user) => {
  const data = Sequelize.fn(
    'jsonb_set',
    Sequelize.col('data'),
    Sequelize.literal(`'{${updatedProperty}}'`),
    Sequelize.literal(`'${JSON.stringify(newValue)}'`)
  )

  // eslint-disable-next-line no-unused-vars
  const [_, updates] = await buildData.models.claim.update(
    { data },
    {
      where: { reference },
      returning: true
    }
  )

  const [updatedRecord] = updates
  const { applicationReference, updatedAt } = updatedRecord.dataValues

  const application = await findApplication(applicationReference)

  const eventData = {
    applicationReference,
    reference,
    updatedProperty,
    newValue,
    oldValue,
    note
  }
  const type = `claim-${updatedProperty}`
  await claimDataUpdateEvent(eventData, type, user, updatedAt, application.data.organisation.sbi)

  await buildData.models.claim_update_history.create({
    applicationReference,
    reference,
    note,
    updatedProperty,
    newValue,
    oldValue,
    eventType: type,
    createdBy: user
  })
}

export const findAllClaimUpdateHistory = (reference) =>
  buildData.models.claim_update_history.findAll({
    where: { reference }
  })
