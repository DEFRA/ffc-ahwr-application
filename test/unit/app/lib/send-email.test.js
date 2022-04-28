const sendEmail = require('../../../../app/lib/send-email')
const notifyClient = require('../../../../app/lib/notify-client')
const { notify: { templateIdVetApplicationComplete, templateIdFarmerApplicationClaim, templateIdFarmerApplicationComplete } } = require('../../../../app/config')
const { serviceUri } = require('../../../../app/config')

const error = new Error('Test exception')
error.response = { data: 'failed to send email' }

notifyClient.sendEmail = jest.fn()
  .mockResolvedValueOnce(true)
  .mockRejectedValueOnce(error)
  .mockResolvedValueOnce(true)
  .mockRejectedValueOnce(error)
  .mockResolvedValueOnce(true)
  .mockRejectedValueOnce(error)

const email = 'test@unit-test.com'
const name = 'farmer'
const reference = 'VV-B977-4D0D'

beforeEach(async () => {
  jest.clearAllMocks()
})

describe('Send email test', () => {
  test('sendFarmerConfirmationEmail returns true onsuccessful email', async () => {
    const response = await sendEmail.sendFarmerConfirmationEmail(email, name, reference)
    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerApplicationComplete, email, { personalisation: { name, reference }, reference })
    expect(response).toBe(true)
  })
  test('sendFarmerConfirmationEmail returns false on error sending email', async () => {
    const response = await sendEmail.sendFarmerConfirmationEmail(email, name, reference)
    expect(response).toBe(false)
  })

  test('sendVetConfirmationEmail returns true onsuccessful email', async () => {
    const response = await sendEmail.sendVetConfirmationEmail(email, reference)
    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdVetApplicationComplete, email, { personalisation: { reference }, reference })
    expect(response).toBe(true)
  })
  test('sendVetConfirmationEmail returns false on error sending email', async () => {
    const response = await sendEmail.sendVetConfirmationEmail(email, reference)
    expect(response).toBe(false)
  })

  test('sendFarmerClaimInvitationEmail returns true onsuccessful email', async () => {
    const response = await sendEmail.sendFarmerClaimInvitationEmail(email, reference)
    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerApplicationClaim, email, { personalisation: { reference, claimStartUrl: `${serviceUri}/farmer-claim` }, reference })
    expect(response).toBe(true)
  })
  test('sendFarmerClaimInvitationEmail returns false on error sending email', async () => {
    const response = await sendEmail.sendFarmerClaimInvitationEmail(email, reference)
    expect(response).toBe(false)
  })
})
