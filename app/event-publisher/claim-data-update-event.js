import { randomUUID } from 'node:crypto'
import { PublishEvent } from 'ffc-ahwr-event-publisher'
import { config } from '../config/index.js'

export const claimDataUpdateEvent = async (data, type, updatedBy, updatedAt) => {
  const eventPublisher = new PublishEvent(config.eventQueue)

  const event = {
    name: 'send-session-event',
    properties: {
      id: randomUUID(),
      sbi: 'none',
      cph: 'n/a',
      checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
      status: 'success',
      action: {
        type,
        message: 'claim data updated',
        data,
        raisedBy: updatedBy,
        raisedOn: updatedAt.toISOString()
      }
    }
  }

  eventPublisher.sendEvent(event)
}
