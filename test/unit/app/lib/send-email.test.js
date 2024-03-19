const sendEmail = require('../../../../app/lib/send-email')
const { applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../../../../app/config')
const { templateIdFarmerClaimComplete } = require('../../../../app/config').notify

const error = new Error('Test exception')
error.response = { data: 'failed to send email' }

const email = 'test@unit-test.com'
const reference = 'AHWR-B977-4D0D'
const sbi = '123456789'
const whichSpecies = 'beef'
const startDate = Date.now()
const farmerName = 'farmer'
const orgName = 'Farmer org'
const orgEmail = 'test@unit-test.org'

jest.mock('../../../../app/lib/notify-client')
const notifyClient = require('../../../../app/lib/notify-client')

jest.mock('../../../../app/messaging/send-message')
const sendMessage = require('../../../../app/messaging/send-message')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

describe('Send email test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('sendFarmerConfirmationEmail calls sendMessage', async () => {
    sendMessage.mockResolvedValueOnce(true)
    await sendEmail.sendFarmerConfirmationEmail(reference, sbi, whichSpecies, startDate, email, farmerName, orgName)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, email, farmerName, orgName }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
    // await sendEmail.sendFarmerConfirmationEmail(reference, sbi, whichSpecies, startDate, email, farmerName, orgName, orgEmail)
    // expect(sendMessage).toHaveBeenCalledTimes(2)
  })

  test('sendFarmerConfirmationEmail calls sendMessage to organization email', async () => {
    sendMessage.mockResolvedValueOnce(true)
    await sendEmail.sendFarmerConfirmationEmail(reference, sbi, whichSpecies, startDate, email, farmerName, orgName, orgEmail)
    expect(sendMessage).toHaveBeenCalledTimes(2)
  })

  test('sendFarmerClaimConfirmationEmail returns true on successful email', async () => {
    notifyClient.sendEmail.mockResolvedValueOnce(true)

    const response = await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)

    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerClaimComplete, email, { personalisation: { reference }, reference })
    expect(response).toBe(true)
  })

  test('sendFarmerClaimConfirmationEmail returns false on error sending email', async () => {
    notifyClient.sendEmail.mockRejectedValueOnce(error)

    const response = await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)

    expect(response).toBe(false)
  })
})
