const { PublishEvent } = require('ffc-ahwr-event-publisher')
const { eventQueue } = require('../config')
const util = require('util')

const raiseEvent = async (event, status = 'success') => {
  const eventPublisher = new PublishEvent(eventQueue)

  const eventMessage = {
    name: event.name,
    properties: {
      id: event.id,
      sbi: event.sbi,
      cph: event.cph,
      checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
      status,
      action: {
        type: event.type,
        message: event.message,
        data: event.data,
        raisedBy: event.email
      }
    }
  }

  console.log('Event data:', util.inspect(eventMessage, false, null, true))

  await eventPublisher.sendEvent(eventMessage)
}

module.exports = raiseEvent
