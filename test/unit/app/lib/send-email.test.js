const sendEmail = require('../../../../app/lib/send-email')
const { serviceUri, notify: { templateIdVetApplicationComplete, templateIdFarmerApplicationClaim, templateIdFarmerApplicationComplete, templateIdFarmerClaimComplete } } = require('../../../../app/config')

const error = new Error('Test exception')
error.response = { data: 'failed to send email' }

const email = 'test@unit-test.com'
const name = 'farmer'
const reference = 'VV-B977-4D0D'

jest.mock('../../../../app/lib/notify-client')
const notifyClient = require('../../../../app/lib/notify-client')

describe('Send email test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('sendFarmerConfirmationEmail returns true onsuccessful email', async () => {
    notifyClient.sendEmail.mockResolvedValueOnce(true)

    const response = await sendEmail.sendFarmerConfirmationEmail(email, name, reference)

    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerApplicationComplete, email, { personalisation: { name, reference }, reference })
    expect(response).toBe(true)
  })

  test('sendFarmerConfirmationEmail returns false on error sending email', async () => {
    notifyClient.sendEmail.mockRejectedValueOnce(error)

    const response = await sendEmail.sendFarmerConfirmationEmail(email, name, reference)

    expect(response).toBe(false)
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
})
