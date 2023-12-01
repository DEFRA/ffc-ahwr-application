const sendEmail = require('../../../../app/lib/send-email')
const { applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../../../../app/config')
const { templateIdFarmerClaimComplete } = require('../../../../app/config').notify
const appInsights = require('applicationinsights')

const error = new Error('Test exception')
error.response = { data: 'failed to send email' }

const email = 'test@unit-test.com'
const reference = 'AHWR-B977-4D0D'
const sbi = '123456789'
const whichSpecies = 'beef'
const startDate = Date.now()
const farmerName = 'farmer'

jest.mock('../../../../app/lib/notify-client')
const notifyClient = require('../../../../app/lib/notify-client')

jest.mock('../../../../app/messaging/send-message')
const sendMessage = require('../../../../app/messaging/send-message')

jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

describe('Send email test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('sendFarmerConfirmationEmail', () => {
    test('sendFarmerConfirmationEmail calls sendMessage', async () => {
      sendMessage.mockResolvedValueOnce(true)
      await sendEmail.sendFarmerConfirmationEmail(reference, sbi, whichSpecies, startDate, email, farmerName)

      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, email, farmerName }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
    })
  })

  describe('sendFarmerClaimConfirmationEmail', () => {
    test('sendFarmerClaimConfirmationEmail returns true on successful email', async () => {
      notifyClient.sendEmail.mockResolvedValueOnce(true)
      const response = await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)

      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerClaimComplete, email, { personalisation: { reference }, reference })
      expect(response).toBe(true)
    })

    test('sendFarmerClaimConfirmationEmail tracks an event on successful email', async () => {
      notifyClient.sendEmail.mockResolvedValueOnce(true)
      await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)

      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(1)
    })

    test('sendFarmerClaimConfirmationEmail returns false on error sending email', async () => {
      notifyClient.sendEmail.mockRejectedValueOnce(error)
      const response = await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)

      expect(response).toBe(false)
    })

    test('sendFarmerClaimConfirmationEmail tracks an error on error sending email', async () => {
      notifyClient.sendEmail.mockRejectedValueOnce(error)
      await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)

      expect(appInsights.defaultClient.trackException).toHaveBeenCalledTimes(1)
      expect(appInsights.defaultClient.trackException).toHaveBeenCalledWith({ exception: error })
    })
  })
})
