import { randomUUID } from 'node:crypto'
import { PublishEvent } from 'ffc-ahwr-common-library'
import { config } from '../config/index.js'

export const claimDataUpdateEvent = async (data, type, updatedBy, updatedAt, sbi) => {
  const eventPublisher = new PublishEvent(config.eventQueue)

  const event = {
    name: 'send-session-event',
    properties: {
      id: randomUUID(),
      sbi,
      cph: 'n/a',
      checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
      status: 'success',
      action: {
        type: type.replace('application', 'claim'),
        message: `${type.startsWith('application') ? 'Application ' : ''}Claim data updated`,
        data,
        raisedBy: updatedBy,
        raisedOn: updatedAt.toISOString()
      }
    }
  }

  await eventPublisher.sendEvent(event)
}
