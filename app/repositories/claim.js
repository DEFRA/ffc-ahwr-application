import { Sequelize } from 'sequelize'
import { buildData } from '../data/index.js'
import { raiseClaimEvents } from '../event-publisher/index.js'

export const getClaim = async (reference) => {
  const claim = await buildData.models.claim.findOne({ where: { reference } })
  return claim === null ? claim : claim.dataValues
}

export const patchClaimData = async (reference, key, value, note) => {
  const data = Sequelize.fn(
    'jsonb_set',
    Sequelize.col('data'),
    Sequelize.literal(`'{${key}}'`),
    Sequelize.literal(`'${JSON.stringify(value)}'`)
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

  await raiseClaimEvents({
    message: 'Claim has been updated',
    claim: updatedRecord.dataValues,
    note,
    raisedBy: updatedRecord.dataValues.updatedBy,
    raisedOn: updatedRecord.dataValues.updatedOn
  })
}
