const sendEmail = require('../../../../app/lib/send-email').default
const { applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../../../../app/config')
const { templateIdFarmerClaimComplete, templateIdFarmerEndemicsClaimComplete } = require('../../../../app/config').notify

const email = 'test@unit-test.com'
const reference = 'AHWR-B977-4D0D'
const sbi = '123456789'
const whichSpecies = 'beef'
const startDate = Date.now()
const farmerName = 'farmer'
const orgName = 'Farmer org'
const orgEmail = 'test@unit-test.org'
const userType = 'newUser'
const conf = require('../../../../app/config')

jest.mock('../../../../app/lib/notify-client')
const notifyClient = require('../../../../app/lib/notify-client').default

jest.mock('../../../../app/lib/sfd-client')
let sendSFDEmail = require('../../../../app/lib/sfd-client')

jest.mock('../../../../app/messaging/send-message')
const sendMessage = require('../../../../app/messaging/send-message')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

describe('sendEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    conf.sfdMessage.enabled = false
  })

  test('sendFarmerConfirmationEmail calls sendMessage', async () => {
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)
    await sendEmail.sendFarmerConfirmationEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  })

  test('sendFarmerConfirmationEmail calls sendMessage via SFD', async () => {
    conf.sfdMessage.enabled = true
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

  test('sendFarmerConfirmationEmail calls sendMessage to organization email via SFD', async () => {
    conf.sfdMessage.enabled = true
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)
    await sendEmail.sendFarmerConfirmationEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  })

  test('sendFarmerClaimConfirmationEmail returns true on successful email', async () => {
    const response = await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)
    expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerClaimComplete, email, { personalisation: { applicationReference: reference }, reference })
    expect(response).toBeTruthy()
  })

  test('sendFarmerClaimConfirmationEmail returns true on successful email via SFD', async () => {
    conf.sfdMessage.enabled = true
    const response = await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)
    expect(sendSFDEmail).toHaveBeenCalledWith(templateIdFarmerClaimComplete, email, { personalisation: { applicationReference: reference }, reference })
    expect(response).toBeTruthy()
  })

  test('sendFarmerClaimConfirmationEmail returns false on error sending email', async () => {
    notifyClient.sendEmail.mockRejectedValueOnce(new Error())
    const response = await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)
    expect(response).toBe(false)
  })

  test('sendFarmerClaimConfirmationEmail returns false on error sending email via SFD', async () => {
    conf.sfdMessage.enabled = true
    sendSFDEmail.mockRejectedValueOnce(new Error())
    const response = await sendEmail.sendFarmerClaimConfirmationEmail(email, reference)
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

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)
      expect(result).toBe(true)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateId, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer email via SFD', async () => {
      conf.sfdMessage.enabled = true
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

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)
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

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)
      expect(result).toBe(true)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateId, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer and organization via SFD', async () => {
      conf.sfdMessage.enabled = true
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

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)
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

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)
      expect(result).toBe(true)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateId, data.email, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('sendFarmerEndemicsClaimConfirmationEmail sends email to farmer email when orgEmail is not provided via SFD', async () => {
      conf.sfdMessage.enabled = true
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

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)
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

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)
      expect(result).toBeTruthy()
    })

    test('sendFarmerEndemicsClaimConfirmationEmail returns true for sending emails via SFD', async () => {
      conf.sfdMessage.enabled = true
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

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data, templateId)
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

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data)
      expect(result).toBe(true)
      expect([data.amount, '£[amount]']).toContain(expectedPersonalisation.amount)
      expect(notifyClient.sendEmail).toHaveBeenCalledWith(templateIdFarmerEndemicsClaimComplete, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })

    test('use default templateId when not provided via SFD', async () => {
      conf.sfdMessage.enabled = true
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

      const result = await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(data)
      expect(result).toBe(true)
      expect([data.amount, '£[amount]']).toContain(expectedPersonalisation.amount)
      expect(sendSFDEmail).toHaveBeenCalledWith(templateIdFarmerEndemicsClaimComplete, data.orgData.orgEmail, { personalisation: expectedPersonalisation, reference: data.reference })
    })
    test('if data is empty - no email sent', async () => {
      const data = {}

      await sendEmail.sendFarmerEndemicsClaimConfirmationEmail({})

      expect(data).toEqual({})
      expect(data.orgData).toBeUndefined()
      expect(notifyClient.sendEmail).toHaveBeenCalledTimes(0)
    })

    test('if data is empty - no email sent via SFD', async () => {
      conf.sfdMessage.enabled = true
      const data = {}

      await sendEmail.sendFarmerEndemicsClaimConfirmationEmail({})

      expect(data).toEqual({})
      expect(data.orgData).toBeUndefined()
      expect(sendSFDEmail).toHaveBeenCalledTimes(0)
    })
    test('sendEmail returns false on error sending email', async () => {
      const templateId = 'templateId'
      const email = 'test@unit-test.com'
      const personalisation = { name: 'farmer' }
      const reference = 'AHWR-B977-4D0D'

      notifyClient.sendEmail = jest.fn().mockRejectedValueOnce(new Error())
      sendEmail.sendEmail = jest.fn().mockReturnValueOnce(false)
      const response = await sendEmail.sendEmail(email, personalisation, reference, templateId)
      expect(response).toBe(false)
    })

    test('sendEmail returns false on error sending email via SFD', async () => {
      conf.sfdMessage.enabled = true
      const templateId = 'templateId'
      const email = 'test@unit-test.com'
      const personalisation = { name: 'farmer' }
      const reference = 'AHWR-B977-4D0D'

      sendSFDEmail = jest.fn().mockRejectedValueOnce(new Error())
      sendEmail.sendEmail = jest.fn().mockReturnValueOnce(false)
      const response = await sendEmail.sendEmail(email, personalisation, reference, templateId)
      expect(response).toBe(false)
    })
  })
  test('fails to sendEmail if values missing or incomplete', async () => {
    const templateId = 'templateId'
    const personalisation = { name: 'farmer' }
    const reference = 'AHWR-B977-4D0D'

    notifyClient.sendEmail = jest.fn().mockRejectedValueOnce(new Error())
    sendEmail.sendEmail = jest.fn().mockReturnValueOnce(false)
    const response = await sendEmail.sendEmail(personalisation, reference, templateId)
    expect(response).toBe(false)
    expect(sendEmail.sendEmail).toHaveBeenCalledWith(personalisation, reference, templateId)
  })

  test('fails to sendEmail if values missing or incomplete via SFD', async () => {
    conf.sfdMessage.enabled = true
    const templateId = 'templateId'
    const personalisation = { name: 'farmer' }
    const reference = 'AHWR-B977-4D0D'

    sendSFDEmail = jest.fn().mockRejectedValueOnce(new Error())
    sendEmail.sendEmail = jest.fn().mockReturnValueOnce(false)
    const response = await sendEmail.sendEmail(personalisation, reference, templateId)
    expect(response).toBe(false)
    expect(sendEmail.sendEmail).toHaveBeenCalledWith(personalisation, reference, templateId)
  })
})
