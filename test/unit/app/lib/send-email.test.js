const sendEmail = require('../../../../app/lib/send-email')
const { serviceUri, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../../../../app/config')
const { templateIdVetApplicationComplete, templateIdFarmerApplicationClaim, templateIdFarmerVetRecordIneligible, templateIdFarmerClaimComplete } = require('../../../../app/config').notify

const error = new Error('Test exception')
error.response = { data: 'failed to send email' }

const email = 'test@unit-test.com'
const reference = 'VV-B977-4D0D'
const sbi = '123456789'
const whichSpecies = 'beef'

jest.mock('../../../../app/lib/notify-client')
const notifyClient = require('../../../../app/lib/notify-client')

const sendMessage = require('../../../../app/messaging/send-message')
jest.mock('../../../../app/messaging/send-message')

describe('Send email test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('sendFarmerConfirmationEmail calls sendMessage', async () => {
    await sendEmail.sendFarmerConfirmationEmail(reference, sbi, whichSpecies)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  })

  test('sendVetConfirmationEmail returns true onsuccessful email', async () => {
    notifyClient.sendEmail.mockResolvedValueOnce(true)

    const response = await sendEmail.sendVetConfirmationEmail(email, reference)

    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdVetApplicationComplete, email, { personalisation: { reference }, reference })
    expect(response).toBe(true)
  })

  test('sendVetConfirmationEmail returns false on error sending email', async () => {
    notifyClient.sendEmail.mockRejectedValueOnce(error)

    const response = await sendEmail.sendVetConfirmationEmail(email, reference)

    expect(response).toBe(false)
  })

  test('sendFarmerClaimInvitationEmail returns true onsuccessful email', async () => {
    notifyClient.sendEmail.mockResolvedValueOnce(true)

    const response = await sendEmail.sendFarmerClaimInvitationEmail(email, reference)

    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerApplicationClaim, email, { personalisation: { reference, claimStartUrl: `${serviceUri}/farmer-claim` }, reference })
    expect(response).toBe(true)
  })

  test('sendFarmerClaimInvitationEmail returns false on error sending email', async () => {
    notifyClient.sendEmail.mockRejectedValueOnce(error)

    const response = await sendEmail.sendFarmerClaimInvitationEmail(email, reference)

    expect(response).toBe(false)
  })

  test('sendFarmerClaimConfirmationEmail returns true onsuccessful email', async () => {
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

  test('sendFarmerVetRecordIneligibleEmail returns true onsuccessful email', async () => {
    notifyClient.sendEmail.mockResolvedValueOnce(true)

    const response = await sendEmail.sendFarmerVetRecordIneligibleEmail(email, reference)

    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerVetRecordIneligible, email, { personalisation: { reference }, reference })
    expect(response).toBe(true)
  })

  test('sendFarmerVetRecordIneligibleEmail returns false on error sending email', async () => {
    notifyClient.sendEmail.mockRejectedValueOnce(error)

    const response = await sendEmail.sendFarmerVetRecordIneligibleEmail(email, reference)

    expect(response).toBe(false)
  })
})
