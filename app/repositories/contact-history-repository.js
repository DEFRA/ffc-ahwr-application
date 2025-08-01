import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { buildData } from '../data/index.js'
import { Sequelize } from 'sequelize'

const { models } = buildData

export const getAllByApplicationReference = async (applicationReference) => {
  const result = await models.contact_history.findAll({
    where: {
      applicationReference: applicationReference.toUpperCase()
    },
    order: [['createdAt', 'DESC']]
  })
  return result
}

export const set = async (data) => {
  const result = await models.contact_history.create(data)
  return result
}

export const redactPII = async (applicationReference) => {
  // TODO 1067 ?update to figure out what is updated.. name, email, etc
  const data = Sequelize.fn(
    'jsonb_set',
    Sequelize.fn(
      'jsonb_set',
      Sequelize.col('data'),
      Sequelize.literal('\'{newValue}\''),
      Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_MULTI_TYPE_VALUE}"'`)),
    Sequelize.literal('\'{oldValue}\''),
    Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_MULTI_TYPE_VALUE}"'`)
  )
  await buildData.models.contact_history.update(
    {
      data,
      updatedBy: 'admin',
      updatedAt: Date.now()
    },
    {
      where: {
        applicationReference
      },
      returning: true
    }
  )

  // TODO 1067 send event? add history row?
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
