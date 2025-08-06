import { CLAIM_STATUS, REDACT_PII_VALUES, APPLICATION_REFERENCE_PREFIX_OLD_WORLD } from 'ffc-ahwr-common-library'
import { buildData } from '../data/index.js'
import { raiseApplicationStatusEvent } from '../event-publisher/index.js'
import { Op, Sequelize, literal } from 'sequelize'
import { startandEndDate } from '../lib/date-utils.js'
import { claimDataUpdateEvent } from '../event-publisher/claim-data-update-event.js'
import { getByApplicationReference } from './claim-repository.js'

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

export const getApplicationsToRedactOlderThan = async (years) => {
  const now = new Date()
  const cutoffDate = new Date(Date.UTC(
    now.getUTCFullYear() - years,
    now.getUTCMonth(),
    now.getUTCDate()
  ))

  return models.application
    .findAll(
      {
        where: {
          reference: {
            [Op.notIn]: Sequelize.literal('(SELECT reference FROM application_redact)')
          },
          createdAt: {
            [Op.lt]: cutoffDate
          }
        },
        attributes: ['reference', [literal('data->\'organisation\'->>\'sbi\''), 'sbi']],
        order: [['createdAt', 'ASC']]
      }
    )
}

export const getApplicationsToRedactWithNoPaymentOlderThanThreeYears = async () => {
  const claimStatusPaidAndRejected = [CLAIM_STATUS.PAID, CLAIM_STATUS.READY_TO_PAY, CLAIM_STATUS.REJECTED, CLAIM_STATUS.WITHDRAWN]
  const applicationsOlderThanThreeYears = await getApplicationsToRedactOlderThan(3)

  const agreementsToRedactWithNoPayment = await Promise.all(
    applicationsOlderThanThreeYears
      .map(async (application) => {
        if (application.dataValues.reference.startsWith(APPLICATION_REFERENCE_PREFIX_OLD_WORLD)) {
          return owApplicationRedactDataIfNoPaymentClaimElseNull(application, claimStatusPaidAndRejected)
        } else {
          return await nwApplicationRedactDataIfNoPaymentClaimsElseNull(application, claimStatusPaidAndRejected)
        }
      })
      .filter(Boolean) // remove nulls
  )

  return agreementsToRedactWithNoPayment
}

const owApplicationRedactDataIfNoPaymentClaimElseNull = (oldWorldApplication, claimStatusPaidAndRejected) => {
  // skip if application has paid/rejected claims
  return claimStatusPaidAndRejected.includes(oldWorldApplication.dataValues.statusId)
    ? null
    : { reference: oldWorldApplication.dataValues.reference, data: { sbi: oldWorldApplication.dataValues.sbi, claims: [{ reference: oldWorldApplication.dataValues.reference }] } }
}

const nwApplicationRedactDataIfNoPaymentClaimsElseNull = async (newWorldApplication, claimStatusPaidAndRejected) => {
  const appClaims = await getByApplicationReference(newWorldApplication.dataValues.reference)

  // skip if application has paid/rejected claims
  if (appClaims.some(c => claimStatusPaidAndRejected.includes(c.statusId))) {
    return null
  }

  const claims = appClaims.map(c => ({ reference: c.reference }))
  return { reference: newWorldApplication.dataValues.reference, data: { sbi: newWorldApplication.dataValues.sbi, claims } }
}

// TODO 1070 IMPL
export const getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears = async () => {
  const agreementsWithRejectedPayment = []
  return agreementsWithRejectedPayment
}

// TODO 1068 IMPL
export const getApplicationsToRedactWithPaymentOlderThanSevenYears = async () => {
  const agreementsWithPayment = []
  return agreementsWithPayment
}

export const redactPII = async (agreementReference, logger) => {
  const redactedValueByJSONPath = {
    'organisation,name': REDACT_PII_VALUES.REDACTED_NAME,
    'organisation,email': REDACT_PII_VALUES.REDACTED_EMAIL,
    'organisation,orgEmail': REDACT_PII_VALUES.REDACTED_ORG_EMAIL,
    'organisation,farmerName': REDACT_PII_VALUES.REDACTED_FARMER_NAME,
    'organisation,address': REDACT_PII_VALUES.REDACTED_ADDRESS
  }

  let totalUpdates = 0

  for (const [jsonPath, redactedValue] of Object.entries(redactedValueByJSONPath)) {
    const jsonPathSql = jsonPath.split(',').map(key => `->'${key}'`).join('')

    const [affectedCount] = await models.application.update(
      {
        data: Sequelize.fn(
          'jsonb_set',
          Sequelize.col('data'),
          Sequelize.literal(`'{${jsonPath}}'`),
          Sequelize.literal(`'"${redactedValue}"'`),
          true
        ),
        updatedBy: 'admin',
        updatedAt: Sequelize.fn('NOW')
      },
      {
        where: {
          reference: agreementReference,
          [Op.and]: Sequelize.literal(`data${jsonPathSql} IS NOT NULL`)
        }
      }
    )

    totalUpdates += affectedCount
    logger.info(
      `Redacted field '${jsonPath}' in ${affectedCount} record(s) for agreementReference: ${agreementReference}`
    )
  }

  if (totalUpdates > 0) {
    logger.info(`Total redacted fields across records: ${totalUpdates} for agreementReference: ${agreementReference}`)
  } else {
    logger.info(`No records updated for agreementReference: ${agreementReference}`)
  }
}
