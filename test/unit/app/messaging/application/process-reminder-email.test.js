import { processReminderEmailRequest, getNextNotClaimedReminderToSend, reminders } from '../../../../../app/messaging/application/process-reminder-email.js'
import { sendMessage } from '../../../../../app/messaging/send-message.js'
import { getRemindersToSend, updateReminders } from '../../../../../app/repositories/application-repository.js'

const { notClaimed } = reminders

jest.mock('../../../../../app/config/index.js')
jest.mock('../../../../../app/repositories/application-repository.js')
jest.mock('../../../../../app/messaging/send-message.js', () => ({
  sendMessage: jest.fn()
}))

describe('processReminderEmailRequest', () => {
  const mockLogger = {
    setBindings: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
  const message = {
    body: {
      requestedDate: '2025-11-05T00:00:00.000Z'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should log and exit when there are no applications due reminders', async () => {
    getRemindersToSend.mockResolvedValueOnce([])

    await processReminderEmailRequest(message, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(1)
    expect(getRemindersToSend).toHaveBeenCalledWith('2025-11-05T00:00:00.000Z', 'notClaimed_threeMonths', mockLogger)
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    expect(mockLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(mockLogger.info).toHaveBeenCalledWith('No new applications due reminders')
    expect(sendMessage).toHaveBeenCalledTimes(0)
    expect(updateReminders).toHaveBeenCalledTimes(0)
  })

  it('should send to message-generator and update reminders for application when first reminder due', async () => {
    getRemindersToSend.mockResolvedValueOnce([
      { reference: 'IAHW-BEKR-AWIU', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: undefined }
    ])

    await processReminderEmailRequest(message, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(1)
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
      'reminderEmail',
      expect.any(Object),
      { sessionId: expect.any(String) }
    )
    expect(updateReminders).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith('IAHW-BEKR-AWIU', 'notClaimed_threeMonths', mockLogger)
  })

  it('should send notClaimed_sixMonths to two address when two email addresses and notClaimed_threeMonths already sent', async () => {
    getRemindersToSend.mockResolvedValueOnce([
      { reference: 'IAHW-BEKR-AWIU', crn: '1100407200', sbi: '106282723', email: 'dummy1@example.com', orgEmail: 'dummy2@example.com', reminders: 'notClaimed_threeMonths' }
    ])

    await processReminderEmailRequest(message, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(1)
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
      'reminderEmail',
      expect.any(Object),
      { sessionId: expect.any(String) }
    )
    expect(updateReminders).toHaveBeenCalledTimes(1)
    expect(updateReminders).toHaveBeenCalledWith('IAHW-BEKR-AWIU', 'notClaimed_sixMonths', mockLogger)
  })

  it('should send to message-generator and update reminders for multiple applications when multiple reminders due', async () => {
    getRemindersToSend.mockResolvedValueOnce([
      { reference: 'IAHW-BEKR-AWI1', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: 'dummy@example.com', reminders: 'notClaimed_threeMonths' },
      { reference: 'IAHW-BEKR-AWI2', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: 'dummy@example.com', reminders: 'notClaimed_threeMonths' },
      { reference: 'IAHW-BEKR-AWI3', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: 'dummy@example.com', reminders: 'notClaimed_threeMonths' },
      { reference: 'IAHW-BEKR-AWI4', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: 'dummy@example.com', reminders: 'notClaimed_threeMonths' },
      { reference: 'IAHW-BEKR-AWI5', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: 'dummy@example.com', reminders: 'notClaimed_threeMonths' }
    ])

    await processReminderEmailRequest(message, mockLogger)

    expect(getRemindersToSend).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledTimes(2)
    expect(sendMessage).toHaveBeenCalledTimes(5)
    expect(updateReminders).toHaveBeenCalledTimes(5)
  })

  it('should log error and exit processing to allow message retry when fail send message-generator', async () => {
    getRemindersToSend.mockResolvedValueOnce([
      { reference: 'IAHW-BEKR-AWIU', crn: '1100407200', sbi: '106282723', email: 'dummy@example.com', orgEmail: undefined }
    ])
    sendMessage.mockRejectedValueOnce(new Error('Faild to send message!'))

    await expect(processReminderEmailRequest(message, mockLogger)).rejects.toThrow()

    expect(getRemindersToSend).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith('Processing reminders request started..')
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Object), 'Failed to processed reminders request')
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
