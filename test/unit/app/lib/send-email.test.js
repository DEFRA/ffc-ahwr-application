const sendEmail = require('../../../../app/lib/send-email')
const { applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../../../../app/config')
const { templateIdFarmerClaimComplete, templateIdFarmerEndemicsClaimComplete } = require('../../../../app/config').notify
// const appInsights = require('applicationinsights')

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
const userType = 'newUser'

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
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)
    await sendEmail.sendFarmerConfirmationEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  })

  test('sendFarmerConfirmationEmail calls sendMessage to organization email', async () => {
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)
    await sendEmail.sendFarmerConfirmationEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  })

  test('sendFarmerClaimConfirmationEmail returns true on successful email', async () => {
    notifyClient.sendEmail.mockResolvedValueOnce(true)

    const response = await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)

    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerClaimComplete, email, { personalisation: { reference }, reference })
    expect(response).toBeTruthy()
  })

  test('sendFarmerClaimConfirmationEmail returns false on error sending email', async () => {
    notifyClient.sendEmail.mockRejectedValueOnce(error)

    const response = await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)

    expect(response).toBe(false)
  })
  describe('sendFarmerEndemicsClaimConfirmationEmail', () => {
    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer email', async () => {
      const data = {
        reference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@unit-test.org'
        }
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        amount: data.amount
      }

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(true)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateId, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends carbon copy email to organization email', async () => {
      const data = {
        email: 'test@unit-test.com',
        reference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@unit-test.org'
        }
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        amount: data.amount
      }

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(true)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateId, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer email when orgEmail is not provided', async () => {
      const data = {
        email: 'test@unit-test.com',
        reference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {}
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        amount: data.amount
      }

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(true)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateId, data.email, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail returns false on error sending email', async () => {
      const data = {
        email: 'test@unit-test.com',
        reference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@unit-test.org'
        }
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'

      const error = new Error('Test exception')
      error.response = { data: 'failed to send email' }
      notifyClient.sendEmail.mockRejectedValueOnce(error)

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(false)
    })

    test('use default templateId when not provided', async () => {
      const data = {
        email: 'test@test-unit.com',
        reference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@test-unit.org',
          orgName: 'Farmer'
        }
      }
      const expectedPersonalisation = {
        reference: data.reference,
        amount: data.amount || '£[amount]'
      }

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data)
      expect(result).toBe(true)
      expect([data.amount, '£[amount]']).toContain(expectedPersonalisation.amount)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerEndemicsClaimComplete, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })
    test('sendEmail returns false on error sending email', async () => {
      const templateId = 'templateId'
      const email = 'test@unit-test.com'
      const personalisation = { name: 'farmer' }
      const reference = 'AHWR-B977-4D0D'

      notifyClient.sendEmail = jest.fn().mockRejectedValueOnce(error)
      sendEmail.sendEmail = jest.fn().mockReturnValueOnce(false)

      const response = await sendEmail.sendEmail(email, personalisation, reference, templateId)
      expect(response).toBe(false)
    })
  })
  test(' fail to sendEmail  if values  missing or incomplete  ', async () => {
    const templateId = 'templateId'
    const personalisation = { name: 'farmer' }
    const reference = 'AHWR-B977-4D0D'

    notifyClient.sendEmail = jest.fn().mockRejectedValueOnce(error)
    sendEmail.sendEmail = jest.fn().mockReturnValueOnce(false)

    const response = await sendEmail.sendEmail(personalisation, reference, templateId)

    expect(response).toBe(false)
    expect(sendEmail.sendEmail).toHaveBeenCalledWith(personalisation, reference, templateId)
  })
})
