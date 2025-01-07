import { sendFarmerClaimConfirmationEmail, sendFarmerConfirmationEmail, sendFarmerEndemicsClaimConfirmationEmail } from '../../../../app/lib/send-email'
import { config } from '../../../../app/config'
import { notifyClient } from '../../../../app/lib/notify-client'
import { sendSFDEmail } from '../../../../app/lib/sfd-client'
import { sendMessage } from '../../../../app/messaging/send-message'

jest.mock('../../../../app/lib/notify-client', () => ({
  notifyClient: { sendEmail: jest.fn() }
}))
jest.mock('../../../../app/lib/sfd-client')
jest.mock('../../../../app/messaging/send-message')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

const { applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue, notify: { templateIdFarmerClaimComplete, templateIdFarmerEndemicsClaimComplete } } = config

const email = 'test@unit-test.com'
const reference = 'AHWR-B977-4D0D'
const sbi = '123456789'
const whichSpecies = 'beef'
const startDate = Date.now()
const farmerName = 'farmer'
const orgName = 'Farmer org'
const orgEmail = 'test@unit-test.org'
const userType = 'newUser'

describe('sendEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    config.sfdMessage.enabled = false
  })

  test('sendFarmerConfirmationEmail calls sendMessage', async () => {
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)

    await sendFarmerConfirmationEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  })

  test('sendFarmerConfirmationEmail calls sendMessage via SFD', async () => {
    config.sfdMessage.enabled = true
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)

    await sendFarmerConfirmationEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  })

  test('sendFarmerConfirmationEmail calls sendMessage to organization email', async () => {
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)

    await sendFarmerConfirmationEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  })

  test('sendFarmerConfirmationEmail calls sendMessage to organization email via SFD', async () => {
    config.sfdMessage.enabled = true
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)

    await sendFarmerConfirmationEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  })

  test('sendFarmerClaimConfirmationEmail returns true on successful email', async () => {
    const response = await sendFarmerClaimConfirmationEmail(email, reference)

    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerClaimComplete, email, { personalisation: { applicationReference: reference }, reference })
    expect(response).toBeTruthy()
  })

  test('sendFarmerClaimConfirmationEmail returns true on successful email via SFD', async () => {
    config.sfdMessage.enabled = true
    const response = await sendFarmerClaimConfirmationEmail(email, reference)

    expect(sendSFDEmail).toHaveBeenCalledWith(templateIdFarmerClaimComplete, email, { personalisation: { applicationReference: reference }, reference })
    expect(response).toBeTruthy()
  })

  test('sendFarmerClaimConfirmationEmail returns false on error sending email', async () => {
    notifyClient.sendEmail.mockRejectedValueOnce(new Error())

    const response = await sendFarmerClaimConfirmationEmail(email, reference)

    expect(response).toBe(false)
  })

  test('sendFarmerClaimConfirmationEmail returns false on error sending email via SFD', async () => {
    config.sfdMessage.enabled = true
    sendSFDEmail.mockRejectedValueOnce(new Error())

    const response = await sendFarmerClaimConfirmationEmail(email, reference)

    expect(response).toBe(false)
  })

  describe('sendFarmerEndemicsClaimConfirmationEmail', () => {
    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer email', async () => {
      const data = {
        reference: 'RESH-DFEF-6037',
        applicationReference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@unit-test.org'
        }
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        applicationReference: data.applicationReference,
        amount: data.amount || '£[amount]'
      }

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(true)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateId, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer email via SFD', async () => {
      config.sfdMessage.enabled = true
      const data = {
        reference: 'RESH-DFEF-6037',
        applicationReference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@unit-test.org',
          crn: '1234567890',
          sbi: '123456789'
        }
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        applicationReference: data.applicationReference,
        amount: data.amount || '£[amount]',
        crn: data.orgData.crn,
        sbi: data.orgData.sbi
      }

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data, templateId)
      expect(result).toBe(true)
      expect(sendSFDEmail).toHaveBeenCalledWith(templateId, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer and organization', async () => {
      const data = {
        email: 'test@unit-test.com',
        reference: 'RESH-DFEF-6037',
        applicationReference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@unit-test.org'
        }
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        applicationReference: data.applicationReference,
        amount: data.amount || '£[amount]'
      }

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(true)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateId, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer and organization via SFD', async () => {
      config.sfdMessage.enabled = true
      const data = {
        email: 'test@unit-test.com',
        reference: 'RESH-DFEF-6037',
        applicationReference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@unit-test.org',
          crn: '1234567890',
          sbi: '123456789'
        }
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        applicationReference: data.applicationReference,
        amount: data.amount || '£[amount]',
        crn: data.orgData.crn,
        sbi: data.orgData.sbi
      }

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(true)
      expect(sendSFDEmail).toHaveBeenCalledWith(templateId, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
      expect(sendSFDEmail).toHaveBeenCalledTimes(2)
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer email when orgEmail is not provided', async () => {
      const data = {
        email: 'test@unit-test.com',
        reference: 'RESH-DFEF-6037',
        applicationReference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {}
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        applicationReference: data.applicationReference,
        amount: data.amount || '£[amount]'
      }

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(true)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateId, data.email, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer email when orgEmail is not provided via SFD', async () => {
      config.sfdMessage.enabled = true
      const data = {
        email: 'test@unit-test.com',
        reference: 'RESH-DFEF-6037',
        applicationReference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {}
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        applicationReference: data.applicationReference,
        amount: data.amount || '£[amount]'
      }

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(true)
      expect(sendSFDEmail).toHaveBeenCalledWith(templateId, data.email, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail returns true for sending emails', async () => {
      const data = {
        email: 'test@unit-test.com',
        reference: 'RESH-DFEF-6037',
        applicationReference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@unit-test.org'
        }
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBeTruthy()
    })

    test('sendFarmerEndemicsClaimConfirmationEmail returns true for sending emails via SFD', async () => {
      config.sfdMessage.enabled = true
      const data = {
        email: 'test@unit-test.com',
        reference: 'RESH-DFEF-6037',
        applicationReference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@unit-test.org',
          crn: '1234567890',
          sbi: '123456789'
        }
      }
      const templateId = 'templateIdFarmerEndemicsClaimComplete'

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBeTruthy()
    })

    test('use default templateId when not provided', async () => {
      const data = {
        email: 'test@test-unit.com',
        reference: 'RESH-DFEF-6037',
        applicationReference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@test-unit.org',
          orgName: 'Farmer'
        }
      }
      const expectedPersonalisation = {
        reference: data.reference,
        applicationReference: data.applicationReference,
        amount: data.amount || '£[amount]'
      }

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data)

      expect(result).toBe(true)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerEndemicsClaimComplete, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('use default templateId when not provided via SFD', async () => {
      config.sfdMessage.enabled = true
      const data = {
        email: 'test@test-unit.com',
        reference: 'RESH-DFEF-6037',
        applicationReference: 'AHWR-B977-4D0D',
        amount: '£[amount]',
        orgData: {
          orgEmail: 'test@test-unit.org',
          orgName: 'Farmer',
          crn: '1234567890',
          sbi: '123456789'
        }
      }
      const expectedPersonalisation = {
        reference: data.reference,
        applicationReference: data.applicationReference,
        amount: data.amount || '£[amount]',
        crn: data.orgData.crn,
        sbi: data.orgData.sbi
      }

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data)

      expect(result).toBe(true)
      expect(sendSFDEmail).toHaveBeenCalledWith(templateIdFarmerEndemicsClaimComplete, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })
    test('if data is empty - no email sent', async () => {
      await sendFarmerEndemicsClaimConfirmationEmail({})

      expect(notifyClient.sendEmail).toHaveBeenCalledTimes(0)
    })

    test('if data is empty - no email sent via SFD', async () => {
      config.sfdMessage.enabled = true

      await sendFarmerEndemicsClaimConfirmationEmail({})

      expect(sendSFDEmail).toHaveBeenCalledTimes(0)
    })
  })
})
