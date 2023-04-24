const { PublishEventBatch } = require('ffc-ahwr-event-publisher')
const config = require('../config')

const raise = async (event, eventType) => {
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
          type: `${eventType}`,
          message: event.message,
          data: event.eventData,
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
          type: `application:${eventType}:${event.application.statusId}`,
          message: event.message,
          data: event.eventData,
          raisedBy: event.raisedBy,
          raisedOn: event.raisedOn.toISOString()
        }
      }
    }
  ])
}

module.exports = {
  raise
}
