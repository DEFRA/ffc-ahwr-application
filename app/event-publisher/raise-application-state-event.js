const { PublishEvent } = require('ffc-ahwr-event-publisher')
const config = require('../config')

module.exports = (application) => {
  const eventPublisher = new PublishEvent(config.eventQueue)
  return async (type, message) => {
    const event = {
      name: 'application-state-event',
      properties: {
        id: `${application.data.organisation.sbi}_${application.reference}`,
        sbi: `${application.data.organisation.sbi}`,
        cph: 'n/a',
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type,
          message,
          data: {
            statusId: application.statusId
          },
          raisedBy: application.data.organisation.email
        }
      }
    }
    await eventPublisher.sendEvent(event)
  }
}
