const { applicationEventMsgType, applicationEventQueue } = require('../config')
const { sendMessage } = require('../messaging')

const sendChangedApplicationEvent = (reference, originalState, newState) => {
  sendMessage(
    {
      name: 'Application changed',
      properties: {
        id: reference,
        checkpoint: 'ffc-ahwr-application',
        status: 'success',
        action: {
          type: 'change',
          message: 'editing',
          data: {
            state: {
              original: originalState,
              new: newState
            }
          },
          raisedOn: new Date().toISOString(),
          raisedBy: 'Currently logged in user'
        }
      }
    },
    applicationEventMsgType,
    applicationEventQueue
  )
}

module.exports = sendChangedApplicationEvent
