const { PublishEvent } = require('ffc-ahwr-event-publisher')
const config = require('../config')

const raise = async (event) => {
  const publishApplicationStatusEvent = new PublishEvent(config.eventQueue)
  await publishApplicationStatusEvent.sendEvent({
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

  const publishSendSessionEvent = new PublishEvent(config.eventQueue)
  await publishSendSessionEvent.sendEvent({
    name: 'send-session-event',
    properties: {
      id: `${event.application.id}`,
      sbi: `${event.application.data.organisation.sbi}`,
      cph: 'n/a',
      checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
      status: 'success',
      action: {
        type: `application:status-updated(${event.application.statusId})`,
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
