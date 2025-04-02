import { randomUUID } from 'node:crypto'
import { PublishEvent } from 'ffc-ahwr-event-publisher'
import { config } from '../config/index.js'

export const claimDataUpdateEvent = async (data, type, updatedBy, updatedAt, sbi) => {
  // Note this is disabled for now, and we will need to play ticket to enable it later when the handling of these events
  // has been added in the MI reporting layer

  // eslint-disable-next-line no-unused-vars
  const eventPublisher = new PublishEvent(config.eventQueue)

  // eslint-disable-next-line no-unused-vars
  const event = {
    name: 'send-session-event',
    properties: {
      id: randomUUID(),
      sbi,
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

  // eventPublisher.sendEvent(event)
}
