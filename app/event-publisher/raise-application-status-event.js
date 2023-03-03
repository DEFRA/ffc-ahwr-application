const { PublishEvent } = require('ffc-ahwr-event-publisher')
const config = require('../config')

module.exports = async (event) => {
  await new PublishEvent(config.eventQueue).sendEvent({
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
}
