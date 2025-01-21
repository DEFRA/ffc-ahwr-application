import { sendFarmerConfirmationEmail, sendFarmerEndemicsClaimConfirmationEmail } from '../../../../app/lib/send-email'
import { config } from '../../../../app/config'
import { sendSFDEmail } from '../../../../app/lib/sfd-client'
import { sendMessage } from '../../../../app/messaging/send-message'

jest.mock('../../../../app/lib/sfd-client')
jest.mock('../../../../app/messaging/send-message')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

const { applicationEmailDocRequestMsgType, applicationDocCreationRequestQueue, notify: { templateIdFarmerEndemicsClaimComplete } } = config

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
  })

  test('sendFarmerConfirmationEmail calls sendMessage via SFD', async () => {
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)

    await sendFarmerConfirmationEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationDocCreationRequestQueue)
  })

  test('sendFarmerConfirmationEmail calls sendMessage to organization email via SFD', async () => {
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)

    await sendFarmerConfirmationEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationDocCreationRequestQueue)
  })

  describe('sendFarmerEndemicsClaimConfirmationEmail', () => {
    const baseInputData = {
      email: 'test@unit-test.com',
      reference: 'RESH-DFEF-6037',
      applicationReference: 'AHWR-B977-4D0D',
      amount: '£[amount]',
      orgData: {}
    }

    beforeEach(() => {
      config.notify.carbonCopyEmailAddress = null
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer and organization via SFD when both set', async () => {
      const data = {
        ...baseInputData,
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
      expect(sendSFDEmail).toHaveBeenCalledTimes(2)
      expect(sendSFDEmail).toHaveBeenCalledWith(templateId, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
      expect(sendSFDEmail).toHaveBeenCalledWith(templateId, data.email, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer and CC address if one specified via SFD', async () => {
      config.notify.carbonCopyEmailAddress = 'test@test.com'

      const data = baseInputData
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
      expect(sendSFDEmail).toHaveBeenCalledTimes(2)
      expect(sendSFDEmail).toHaveBeenCalledWith(templateId, 'test@test.com', { personalisation: expectedPersonalisation })
      expect(sendSFDEmail).toHaveBeenCalledWith(templateId, data.email, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to just farmer email when orgEmail is not provided via SFD', async () => {
      const data = baseInputData

      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        applicationReference: data.applicationReference,
        amount: data.amount || '£[amount]'
      }

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(true)
      expect(sendSFDEmail).toHaveBeenCalledTimes(1)
      expect(sendSFDEmail).toHaveBeenCalledWith(templateId, data.email, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to just farmer email when orgEmail is same address via SFD', async () => {
      const data = {
        ...baseInputData,
        orgData: {
          orgEmail: 'test@unit-test.com',
          crn: '1234567890',
          sbi: '123456789'
        }
      }

      const templateId = 'templateIdFarmerEndemicsClaimComplete'
      const expectedPersonalisation = {
        reference: data.reference,
        crn: '1234567890',
        sbi: '123456789',
        applicationReference: data.applicationReference,
        amount: data.amount || '£[amount]'
      }

      const result = await sendFarmerEndemicsClaimConfirmationEmail(data, templateId)

      expect(result).toBe(true)
      expect(sendSFDEmail).toHaveBeenCalledTimes(1)
      expect(sendSFDEmail).toHaveBeenCalledWith(templateId, data.email, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('use default templateId when not provided via SFD', async () => {
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

    test('if data is empty - no email sent via SFD', async () => {
      await sendFarmerEndemicsClaimConfirmationEmail({})

      expect(sendSFDEmail).toHaveBeenCalledTimes(0)
    })
  })
})
