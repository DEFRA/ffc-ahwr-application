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

export const getApplicationsOlderThan = async (years) => {
  const now = new Date();
  const cutoffDate = new Date(Date.UTC(
    now.getUTCFullYear() - years,
    now.getUTCMonth(),
    now.getUTCDate()
  ));

  return models.application
    .findAll(
      {
        where: { 
          createdAt: {
            [Op.lt]: cutoffDate
          }
        },
        attributes: ['reference',[literal(`data->'organisation'->>'sbi'`), 'sbi']],
        order: [['createdAt', 'ASC']]
      }
    )
}

export const getAgreementsWithNoPaymentOlderThanThreeYears = async () => {
  const applicationsOlderThanThreeYears = await getApplicationsOlderThan(3);

  const agreementsWithNoPayment = await Promise.all(applicationsOlderThanThreeYears.map(async (application) => {
    const appClaims = await getByApplicationReference(application.dataValues.reference);

    // skip if application has paid/rejected claims
    if (!appClaims.some(c => [1, 2].includes(c.statusId))) {
      const claims = appClaims.map(c => ({ reference: c.reference }));
      return { reference: application.dataValues.reference, data: { sbi: application.dataValues.sbi, claims } };
    }
    return null;

  }).filter(Boolean)); // remove nulls

  return agreementsWithNoPayment
};

// TODO IMPL 1070
export const getAgreementsWithRejectedPaymentOlderThanThreeYears = async () => {  
  const agreementsWithRejectedPayment = []
  return agreementsWithRejectedPayment
}

// TODO IMPL 1068
export const getAgreementsWithPaymentOlderThanSevenYears = async () => {  
  const agreementsWithPayment = []
  return agreementsWithPayment
}

export const redactPII = async (reference) => {
  // TODO 1067 move to shared lib
  const REDACT_PII_VALUES = {
    REDACTED_NAME: 'REDACTED_NAME',
    REDACTED_EMAIL: 'redacted.email@example.com',
    REDACTED_ADDRESS: 'REDACTED_ADDRESS',
    REDACTED_ORG_EMAIL: 'redacted.org.email@example.com',
    REDACTED_FARMER_NAME: 'REDACTED_FARMER_NAME',
    REDACTED_URN_RESULT: 'REDACTED_URN_RESULT',
    REDACTED_VET_RCVS: 'REDACTED_VET_RCVS',
    REDACTED_VET_NAME: 'REDACTED_VET_NAME'
  }

  // Redact OW claim info
  const vetRcvs = Sequelize.fn(
    'jsonb_set',
    Sequelize.col('data'),
    Sequelize.literal('\'{vetRcvs}\''),
    Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_VET_RCVS}"'`)
  )
  await buildData.models.application.update(
    { data: vetRcvs },
    {
      where: {
        reference,
        [Op.and]: [Sequelize.where(Sequelize.fn('jsonb_exists', Sequelize.col('data'), 'vetRcvs'), true)]
      },
      returning: true
    }
  )
  const urnResult = Sequelize.fn(
    'jsonb_set',
    Sequelize.col('data'),
    Sequelize.literal('\'{urnResult}\''),
    Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_URN_RESULT}"'`)
  )
  await buildData.models.application.update(
    { data: urnResult },
    {
      where: {
        reference,
        [Op.and]: [Sequelize.where(Sequelize.fn('jsonb_exists', Sequelize.col('data'), 'urnResult'), true)]
      },
      returning: true
    }
  )
  const vetName = Sequelize.fn(
    'jsonb_set',
    Sequelize.col('data'),
    Sequelize.literal('\'{vetName}\''),
    Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_VET_NAME}"'`)
  )
  await buildData.models.application.update(
    { data: vetName },
    {
      where: {
        reference,
        [Op.and]: [Sequelize.where(Sequelize.fn('jsonb_exists', Sequelize.col('data'), 'vetName'), true)]
      },
      returning: true
    }
  )

  // TODO adds field that ok?
  const data = Sequelize.fn(
    'jsonb_set',
    Sequelize.fn(
      'jsonb_set',
      Sequelize.fn(
        'jsonb_set',
        Sequelize.fn(
          'jsonb_set',
          Sequelize.fn(
            'jsonb_set',
            Sequelize.col('data'),
            Sequelize.literal('\'{organisation,name}\''),
            Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_NAME}"'`)
          ),
          Sequelize.literal('\'{organisation,email}\''),
          Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_EMAIL}"'`)
        ),
        Sequelize.literal('\'{organisation,address}\''),
        Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_ADDRESS}"'`)
      ),
      Sequelize.literal('\'{organisation,orgEmail}\''),
      Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_ORG_EMAIL}"'`)
    ),
    Sequelize.literal('\'{organisation,farmerName}\''),
    Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_FARMER_NAME}"'`)
  )

  // eslint-disable-next-line no-unused-vars
  // const [_, updates] = await models.application.update(
  await models.application.update(
    { data },
    {
      where: { reference },
      returning: true
    }
  )

  // TODO 1067 redact OW claim data

  // TODO 1067 add later
  // const [updatedRecord] = updates
  // const { updatedAt, data: { organisation: { sbi } } } = updatedRecord.dataValues

  // const eventData = {
  //   applicationReference: reference,
  //   reference,
  //   updatedProperty,
  //   newValue,
  //   oldValue,
  //   note
  // }
  // const type = `application-${updatedProperty}`
  // await claimDataUpdateEvent(eventData, type, user, updatedAt, sbi)

  // await buildData.models.claim_update_history.create({
  //   applicationReference: reference,
  //   reference,
  //   note,
  //   updatedProperty,
  //   newValue,
  //   oldValue,
  //   eventType: type,
  //   createdBy: user
  // })
}
