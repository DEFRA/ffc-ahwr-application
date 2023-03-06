const { PublishEvent } = require('ffc-ahwr-event-publisher')
const config = require('../config')

const raise = async (event) => {
  const publishEvent = new PublishEvent(config.eventQueue)
  await publishEvent.sendEvent({
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
          statusId: event.application.statusId
        },
        raisedBy: event.raisedBy
      }
    }
  })
  await publishEvent.sendEvent({
    name: 'send-session-event',
    properties: {
      id: `${event.application.id}`,
      sbi: `${event.application.data.organisation.sbi}`,
      cph: 'n/a',
      checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
      status: 'success',
      action: {
        type: 'application:status-updated',
        message: event.message,
        data: {
          reference: event.application.reference,
          statusId: event.application.statusId
        },
        raisedBy: event.raisedBy
      }
    }
  })
}

module.exports = {
  raise
}
