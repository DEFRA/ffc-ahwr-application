import { processReminderEmailRequest, getNextNotClaimedReminderToSend, reminderTypes } from '../../../../../app/messaging/application/process-reminder-email.js'
import { sendMessage } from '../../../../../app/messaging/send-message.js'
import { getRemindersToSend, updateReminders } from '../../../../../app/repositories/application-repository.js'

const { notClaimed } = reminderTypes

const mockSendEvent = jest.fn()
jest.mock('ffc-ahwr-common-library', () => ({
  PublishEvent: jest.fn().mockImplementation(() => ({
    sendEvent: mockSendEvent
  }))
}))
jest.mock('../../../../../app/config/index.js')
jest.mock('../../../../../app/repositories/application-repository.js')
jest.mock('../../../../../app/messaging/send-message.js', () => ({
  sendMessage: jest.fn()
}))

describe('processReminderEmailRequest', () => {
  const fakeMaxBatchSize = 5000

  const mockLogger = {
    setBindings: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
  const message = {
    body: {
      requestedDate: '2025-11-05T00:00:00.000Z',
      maxBatchSize: fakeMaxBatchSize
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should log and exit when there are no applications due reminders', async () => {
    // requestedDate in message is '2025-11-05T00:00:00.000Z'
    const threeMonthsBeforeRequestedDate = new Date('2025-08-05T00:00:00.000Z')
    const sixMonthsBeforeRequestedDate = new Date('2025-05-05T00:00:00.000Z')
    const nineMonthsBeforeRequestedDate = new Date('2025-02-05T00:00:00.000Z')

    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(getRemindersToSend).toHaveBeenCalledWith('notClaimed_nineMonths', nineMonthsBeforeRequestedDate, undefined, [], fakeMaxBatchSize, mockLogger)
    expect(getRemindersToSend).toHaveBeenCalledWith('notClaimed_sixMonths', sixMonthsBeforeRequestedDate, nineMonthsBeforeRequestedDate, ['notClaimed_nineMonths'], fakeMaxBatchSize, mockLogger)
    expect(getRemindersToSend).toHaveBeenCalledWith('notClaimed_threeMonths', threeMonthsBeforeRequestedDate, sixMonthsBeforeRequestedDate, ['notClaimed_sixMonths', 'notClaimed_nineMonths'], fakeMaxBatchSize, mockLogger)
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    expect(mockLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(mockLogger.info).toHaveBeenCalledWith('No new applications due reminders')
    expect(sendMessage).toHaveBeenCalledTimes(0)
    expect(mockSendEvent).toHaveBeenCalledTimes(0)
    expect(updateReminders).toHaveBeenCalledTimes(0)
  })

  it('should send to message-generator and update reminders for application when first reminder due', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      { dataValues: { reference: 'IAHW-BEKR-AWIU', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: undefined, reminderType: 'notClaimed_threeMonths', createdAt: new Date('2025-08-05T00:00:00.000Z') } }
    ])

    await processReminderEmailRequest(message, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    expect(mockLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(mockLogger.info).toHaveBeenCalledWith('Successfully processed reminders request')
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        emailAddresses: ['dummy@example.com'],
        reminderType: 'notClaimed_threeMonths'
      },
      'uk.gov.ffc.ahwr.agreement.reminder.email',
      expect.any(Object),
      { sessionId: expect.any(String) }
    )
    expect(mockSendEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith('IAHW-BEKR-AWIU', 'notClaimed_threeMonths', undefined, mockLogger)
  })

  it('should send notClaimed_sixMonths to two addresses when two email addresses and notClaimed_threeMonths already sent', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      { dataValues: { reference: 'IAHW-BEKR-AWIU', crn: '1100407200', sbi: '106282723', email: 'dummy1@example.com', orgEmail: 'dummy2@example.com', reminders: 'notClaimed_threeMonths', reminderType: 'notClaimed_sixMonths', createdAt: new Date('2025-05-05T00:00:00.000Z') } }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    expect(mockLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(mockLogger.info).toHaveBeenCalledWith('Successfully processed reminders request')
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        emailAddresses: ['dummy1@example.com', 'dummy2@example.com'],
        reminderType: 'notClaimed_sixMonths'
      },
      'uk.gov.ffc.ahwr.agreement.reminder.email',
      expect.any(Object),
      { sessionId: expect.any(String) }
    )
    expect(mockSendEvent).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith('IAHW-BEKR-AWIU', 'notClaimed_sixMonths', 'notClaimed_threeMonths', mockLogger)
  })

  it('should promote to notClaimed_nineMonths when 8months old and no reminders previously sent', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([{
      dataValues: {
        reference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy1@example.com',
        orgEmail: 'dummy2@example.com',
        reminders: '',
        reminderType: 'notClaimed_sixMonths',
        createdAt: new Date('2025-03-05T00:00:00.000Z')
      }
    }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockLogger)

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        emailAddresses: ['dummy1@example.com', 'dummy2@example.com'],
        reminderType: 'notClaimed_nineMonths'
      },
      'uk.gov.ffc.ahwr.agreement.reminder.email',
      expect.any(Object),
      { sessionId: expect.any(String) }
    )
  })

  it('should not promote to notClaimed_nineMonths when 8months old but has reminders previously sent', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([{
      dataValues: {
        reference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy1@example.com',
        orgEmail: 'dummy2@example.com',
        reminders: 'notClaimed_threeMonths',
        reminderType: 'notClaimed_sixMonths',
        createdAt: new Date('2025-03-05T00:00:00.000Z')
      }
    }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockLogger)

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        emailAddresses: ['dummy1@example.com', 'dummy2@example.com'],
        reminderType: 'notClaimed_sixMonths'
      },
      'uk.gov.ffc.ahwr.agreement.reminder.email',
      expect.any(Object),
      { sessionId: expect.any(String) }
    )
  })

  it('should only send to one address when email and orgEmail are the same', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([{
      dataValues: {
        reference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        email: 'dummy@example.com',
        orgEmail: 'dummy@example.com',
        reminders: 'notClaimed_threeMonths',
        reminderType: 'notClaimed_sixMonths',
        createdAt: new Date('2025-03-05T00:00:00.000Z')
      }
    }
    ])
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockLogger)

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'IAHW-BEKR-AWIU',
        crn: '1100407200',
        sbi: '106282723',
        emailAddresses: ['dummy@example.com'],
        reminderType: 'notClaimed_sixMonths'
      },
      'uk.gov.ffc.ahwr.agreement.reminder.email',
      expect.any(Object),
      { sessionId: expect.any(String) }
    )
  })

  it('should send to message-generator and update reminders for multiple applications when multiple reminders due', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      { reference: 'IAHW-BEKR-AWI1', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: 'dummy@example.com', reminders: 'notClaimed_threeMonths', createdAt: new Date('2025-08-05T00:00:00.000Z') },
      { reference: 'IAHW-BEKR-AWI2', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: 'dummy@example.com', reminders: 'notClaimed_threeMonths', createdAt: new Date('2025-08-05T00:00:00.000Z') },
      { reference: 'IAHW-BEKR-AWI3', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: 'dummy@example.com', reminders: 'notClaimed_threeMonths', createdAt: new Date('2025-08-05T00:00:00.000Z') },
      { reference: 'IAHW-BEKR-AWI4', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: 'dummy@example.com', reminders: 'notClaimed_threeMonths', createdAt: new Date('2025-08-05T00:00:00.000Z') },
      { reference: 'IAHW-BEKR-AWI5', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: 'dummy@example.com', reminders: 'notClaimed_threeMonths', createdAt: new Date('2025-08-05T00:00:00.000Z') }
    ])

    await processReminderEmailRequest(message, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    expect(sendMessage).toHaveBeenCalledTimes(5)
    expect(mockSendEvent).toHaveBeenCalledTimes(5)
    expect(updateReminders).toHaveBeenCalledTimes(5)
  })

  it('should log error and exit processing to allow message retry when fail send message-generator', async () => {
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([])
    getRemindersToSend.mockResolvedValueOnce([
      { reference: 'IAHW-BEKR-AWIU', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: undefined, createdAt: new Date('2025-08-05T00:00:00.000Z') }
    ])
    sendMessage.mockRejectedValueOnce(new Error('Faild to send message!'))

    await expect(processReminderEmailRequest(message, mockLogger)).rejects.toThrow()

    expect(getRemindersToSend).toHaveBeenCalledTimes(3)
    expect(mockLogger.info).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Object), 'Failed to processed reminders request')
    expect(mockSendEvent).toHaveBeenCalledTimes(0)
    expect(updateReminders).toHaveBeenCalledTimes(0)
  })
})

// START copied from common-lib@3.0.2
describe('getNextNotClaimedReminderToSend', () => {
  test('First NotClaimed reminder should be threeMonths', () => {
    const previousReminderSent = undefined

    const nextReminder = getNextNotClaimedReminderToSend(previousReminderSent)

    expect(nextReminder).toBe(notClaimed.threeMonths)
  })

  test('After threeMonths, the next reminder should be sixMonths', () => {
    const previousReminderSent = notClaimed.threeMonths

    const nextReminder = getNextNotClaimedReminderToSend(previousReminderSent)

    expect(nextReminder).toBe(notClaimed.sixMonths)
  })

  test('After sixMonths, the next reminder should be nineMonths', () => {
    const previousReminderSent = notClaimed.sixMonths

    const nextReminder = getNextNotClaimedReminderToSend(previousReminderSent)

    expect(nextReminder).toBe(notClaimed.nineMonths)
  })

  test('After nineMonths, undefined should be returned', () => {
    const previousReminderSent = notClaimed.nineMonths

    const nextReminder = getNextNotClaimedReminderToSend(previousReminderSent)

    expect(nextReminder).toBeUndefined()
  })
})
// END copied from common-lib@3.0.2
