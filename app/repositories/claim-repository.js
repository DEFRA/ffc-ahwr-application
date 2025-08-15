import { REDACT_PII_VALUES, APPLICATION_REFERENCE_PREFIX_OLD_WORLD } from 'ffc-ahwr-common-library'
import { buildData } from '../data/index.js'
import { raiseClaimEvents, raiseHerdEvent } from '../event-publisher/index.js'
import { startandEndDate } from '../lib/date-utils.js'
import { claimDataUpdateEvent } from '../event-publisher/claim-data-update-event.js'
import { Op, QueryTypes, Sequelize } from 'sequelize'
import { findApplication } from './application-repository.js'

const { models, sequelize } = buildData

export const getClaimByReference = async (reference) => {
  const results = await sequelize.query(
    `
    SELECT
      claim.*,
      to_jsonb(herd) AS herd,
      status.status AS "status"
    FROM claim
    LEFT JOIN herd
      ON claim.data->>'herdId' = herd.id::text
      AND (claim.data->>'herdVersion')::int = herd.version
      AND claim."applicationReference" = herd."applicationReference"
    LEFT JOIN status
      ON claim."statusId" = status."statusId"
    WHERE claim."reference" = :reference
    ORDER BY claim."createdAt" DESC
    LIMIT 1
    `,
    {
      replacements: { reference: reference.toUpperCase() },
      type: QueryTypes.SELECT
    }
  )

  return { dataValues: results[0] }
}

export const getByApplicationReference = async (applicationReference, typeOfLivestock) => {
  const replacements = {
    applicationReference: applicationReference.toUpperCase()
  }

  let typeFilter = ''

  if (typeOfLivestock) {
    typeFilter = 'AND claim.data->>\'typeOfLivestock\' = :typeOfLivestock'
    replacements.typeOfLivestock = typeOfLivestock
  }

  const results = await sequelize.query(
    `
    SELECT claim.*, to_jsonb(herd) AS herd
    FROM claim
    LEFT JOIN herd 
      ON claim.data->>'herdId' = herd.id::text
      AND herd."isCurrent" = true
    WHERE claim."applicationReference" = :applicationReference
    ${typeFilter}
    ORDER BY claim."createdAt" DESC
    `,
    {
      replacements,
      type: QueryTypes.SELECT
    }
  )

  return results
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

    if (claim?.dataValues?.statusId === data.statusId) {
      logger.info(`Claim ${data.reference} already has status ${data.statusId}, no update needed.`)
      return
    }

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

  if (applications.find((application) => application.dataValues.data.urnResult?.toLowerCase() === laboratoryURN.toLowerCase())) {
    return { isURNUnique: false }
  }

  const applicationReferences = applications.map((application) => application.dataValues.reference)
  const claims = await models.claim.findAll({ where: { applicationReference: applicationReferences } })

  const isUnique = !claims.find((claim) => claim.dataValues.data.laboratoryURN?.toLowerCase() === laboratoryURN.toLowerCase())

  return { isURNUnique: isUnique }
}

const evalSortField = (sort) => {
  const direction = sort?.direction ?? 'ASC'
  const field = sort?.field?.toLowerCase()

  if (!field) {
    return ['createdAt', direction]
  }

  const orderBySortField = {
    status: [models.status, field, direction],
    'claim date': ['createdAt', direction],
    sbi: ['data.organisation.sbi', direction],
    'claim number': ['reference', direction],
    'type of visit': ['type', direction],
    species: ['data.typeOfLivestock', direction]
  }

  return orderBySortField[field] || ['createdAt', direction]
}

const applySearchConditions = (query, search) => {
  if (!search?.text || !search?.type) {
    return
  }

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
    default:
      break
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

  const claims = await models.claim.findAll({
    ...query,
    order: [evalSortField(sort)],
    limit,
    offset
  })

  const total = await models.claim.count(query)

  const herdKeys = claims
    .map((claim) => {
      const { herdId, herdVersion } = claim.dataValues.data || {}
      return herdId && herdVersion ? `${herdId}::${herdVersion}` : null
    })
    .filter(Boolean)

  const uniqueKeys = [...new Set(herdKeys)]

  const herdWhere = {
    [Op.or]: uniqueKeys.map((key) => {
      const [id, version] = key.split('::')

      return {
        id,
        version
      }
    })
  }

  const herds = await models.herd.findAll({ where: herdWhere })

  const herdMap = new Map(
    herds.map((herd) => [`${herd.dataValues.id}::${herd.dataValues.version}`, herd.toJSON()])
  )

  const claimsWithHerd = claims.map((claim) => {
    const { herdId, herdVersion } = claim.dataValues.data || {}
    const herdKey = `${herdId}::${herdVersion}`
    const herd = herdMap.get(herdKey)

    return {
      ...claim.toJSON(),
      herd
    }
  })

  return {
    total,
    claims: claimsWithHerd
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

  await claimDataUpdateEvent(eventData, `claim-${convertUpdatedPropertyToStandardType(updatedProperty)}`, user, updatedAt, application.data.organisation.sbi)

  await buildData.models.claim_update_history.create({
    applicationReference,
    reference,
    note,
    updatedProperty,
    newValue,
    oldValue,
    eventType: `claim-${updatedProperty}`,
    createdBy: user
  })
}

export const addHerdToClaimData = async ({ claimRef, herdClaimData, createdBy, applicationReference, sbi }) => {
  const { herdId, herdVersion, herdAssociatedAt, herdName } = herdClaimData
  const data = Sequelize.fn(
    'jsonb_set',
    Sequelize.fn(
      'jsonb_set',
      Sequelize.fn(
        'jsonb_set',
        Sequelize.col('data'),
        Sequelize.literal('\'{herdId}\''),
        Sequelize.literal(`'${JSON.stringify(herdId)}'`)
      ),
      Sequelize.literal('\'{herdVersion}\''),
      Sequelize.literal(`'${JSON.stringify(herdVersion)}'`)
    ),
    Sequelize.literal('\'{herdAssociatedAt}\''),
    Sequelize.literal(`'${JSON.stringify(herdAssociatedAt)}'`)
  )

  // eslint-disable-next-line no-unused-vars
  const [_, _updates] = await buildData.models.claim.update(
    {
      data,
      updatedBy: createdBy
    },
    {
      where: { reference: claimRef },
      returning: true
    }
  )

  await buildData.models.claim_update_history.create({
    applicationReference,
    reference: claimRef,
    note: 'Herd details were retroactively applied to this pre-multiple herds claim',
    updatedProperty: 'herdName',
    newValue: herdName,
    oldValue: 'Unnamed herd',
    eventType: 'claim-herdAssociated',
    createdBy
  })

  await raiseHerdEvent({
    sbi,
    message: 'Herd associated with claim',
    type: 'claim-herdAssociated',
    data: {
      herdId,
      herdVersion,
      reference: claimRef,
      applicationReference
    }
  })
}

export const findAllClaimUpdateHistory = (reference) =>
  buildData.models.claim_update_history.findAll({
    where: { reference }
  })

export const redactPII = async (applicationReference, logger) => {
  const redactedValueByField = {
    vetsName: `${REDACT_PII_VALUES.REDACTED_VETS_NAME}`,
    vetRCVSNumber: `${REDACT_PII_VALUES.REDACTED_VET_RCVS_NUMBER}`,
    laboratoryURN: `${REDACT_PII_VALUES.REDACTED_LABORATORY_URN}`
  }

  for (const [field, redactedValue] of Object.entries(redactedValueByField)) {
    const [affectedCount] = await models.claim.update(
      {
        data: Sequelize.fn(
          'jsonb_set',
          Sequelize.col('data'),
          Sequelize.literal(`'{${field}}'`),
          Sequelize.literal(`'"${redactedValue}"'`)
        ),
        updatedBy: 'admin',
        updatedAt: Date.now()
      },
      {
        where: {
          applicationReference,
          [Op.and]: Sequelize.literal(`data->>'${field}' IS NOT NULL`)
        }
      }
    )
    logger.info(`Redacted field '${field}' in ${affectedCount} message(s) for applicationReference: ${applicationReference}`)
  }

  if (applicationReference.startsWith(APPLICATION_REFERENCE_PREFIX_OLD_WORLD)) {
    await redactOWClaimData(applicationReference, logger)
  }

  await buildData.models.claim_update_history.update(
    {
      note: `${REDACT_PII_VALUES.REDACTED_NOTE}`
    },
    {
      where: {
        applicationReference,
        note: { [Op.not]: null }
      }
    }
  )

  await buildData.models.claim_update_history.update(
    {
      newValue: `${REDACT_PII_VALUES.REDACTED_VETS_NAME}`,
      oldValue: `${REDACT_PII_VALUES.REDACTED_VETS_NAME}`
    },
    {
      where: {
        applicationReference,
        updatedProperty: 'vetName'
      }
    }
  )
}

const redactOWClaimData = async (applicationReference, logger) => {
  const redactedValueByOWField = {
    vetName: REDACT_PII_VALUES.REDACTED_VETS_NAME,
    vetRcvs: REDACT_PII_VALUES.REDACTED_VET_RCVS_NUMBER,
    urnResult: REDACT_PII_VALUES.REDACTED_LABORATORY_URN
  }

  for (const [field, redactedValue] of Object.entries(redactedValueByOWField)) {
    const [affectedCount] = await models.application.update(
      {
        data: Sequelize.fn(
          'jsonb_set',
          Sequelize.col('data'),
          Sequelize.literal(`'{${field}}'`),
          Sequelize.literal(`'"${redactedValue}"'`)
        ),
        updatedBy: 'admin',
        updatedAt: Date.now()
      },
      {
        where: {
          reference: applicationReference,
          [Op.and]: Sequelize.literal(`data->>'${field}' IS NOT NULL`)
        }
      }
    )
    logger.info(`Redacted field '${field}' in ${affectedCount} message(s) for applicationReference: ${applicationReference}`)
  }
}

const convertUpdatedPropertyToStandardType = (updatedProperty) => {
  switch (updatedProperty) {
    case 'vetsName':
      return 'vetName'
    case 'vetRCVSNumber':
      return 'vetRcvs'
    case 'dateOfVisit':
      return 'visitDate'
    default:
      return updatedProperty
  }
}
