import { PublishEventBatch } from 'ffc-ahwr-event-publisher'
import { config } from '../config/index.js'

export const raise = async (event) => {
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
            note: event.note
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
            statusId: event.application.statusId
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    }
  ])
}

export const raiseClaimEvents = async (event, sbi = 'none') => {
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
            statusId: event.claim.statusId,
            note: event.note
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

export const raiseApplicationFlaggedEvent = async (event, sbi) => {
  await new PublishEventBatch(config.eventQueue).sendEvents([
    {
      name: 'application-flagged',
      properties: {
        id: event.application.id,
        sbi,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: 'application:flagged',
          message: event.message,
          data: {
            flagId: event.flag.id,
            flagDetail: event.flag.note,
            flagAppliesToMh: event.flag.appliesToMh
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    }
  ])
}

export const raiseApplicationFlagDeletedEvent = async (event, sbi) => {
  await new PublishEventBatch(config.eventQueue).sendEvents([
    {
      name: 'application-flag-deleted',
      properties: {
        id: event.application.id,
        sbi,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: 'application:unflagged',
          message: event.message,
          data: {
            flagId: event.flag.id
          },
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    }
  ])
}
