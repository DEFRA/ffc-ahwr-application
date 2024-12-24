import { PublishEventBatch } from 'ffc-ahwr-event-publisher'
import { config } from '../config'

const raise = async (event) => {
  await new PublishEventBatch(config.eventQueue).sendEvents([
    {
      name: 'application-status-event',
      properties: {
        id: `${event.application.id}`,
        sbi: `${event.application.data.organisation.sbi}`,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: 'status-updated',
          message: event.message,
          data: {
            reference: event.application.reference,
            statusId: event.application.statusId,
            subStatus: event.application.subStatus
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    },
    {
      name: 'send-session-event',
      properties: {
        id: `${event.application.id}`,
        sbi: `${event.application.data.organisation.sbi}`,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: `application:status-updated:${event.application.statusId}`,
          message: event.message,
          data: {
            reference: event.application.reference,
            statusId: event.application.statusId,
            subStatus: event.application.subStatus
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    }
  ])
}

const raiseClaimEvents = async (event, sbi = 'none') => {
  await new PublishEventBatch(config.eventQueue).sendEvents([
    {
      name: 'application-status-event',
      properties: {
        id: `${event.claim.id}`,
        sbi,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: 'status-updated',
          message: event.message,
          data: {
            reference: event.claim.reference,
            applicationReference: event.claim.applicationReference,
            statusId: event.claim.statusId
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    },
    {
      name: 'send-session-event',
      properties: {
        id: `${event.claim.id}`,
        sbi,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: `application:status-updated:${event.claim.statusId}`,
          message: event.message,
          data: {
            reference: event.claim.reference,
            applicationReference: event.claim.applicationReference,
            statusId: event.claim.statusId
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    }
  ])
}

export default {
  raise,
  raiseClaimEvents
}
