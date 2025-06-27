import { setPaymentStatusToPaid } from '../../../../../app/messaging/application/set-payment-status-to-paid'
import {
  getClaimByReference,
  updateClaimByReference
} from '../../../../../app/repositories/claim-repository'
import { sendMessage } from '../../../../../app/messaging/send-message'

jest.mock('../../../../../app/repositories/claim-repository')
jest.mock('../../../../../app/messaging/send-message')

const createLogger = () => ({ error: jest.fn(), info: jest.fn() })

describe('handler function for setting payment status to paid for claims', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('happy path for a claim being updated to paid', async () => {
    updateClaimByReference.mockResolvedValueOnce(null)
    const claimFromDb = {
      dataValues: {
        applicationReference: 'IAHW-RWE2-G8S7',
        reference: 'REBC-ABCD-1234',
        statusId: 11,
        data: { claimType: 'R', typeOfLivestock: 'beef' },
        herd: { herdName: 'Beefers' }
      }
    }
    getClaimByReference.mockResolvedValueOnce(claimFromDb)
    sendMessage.mockResolvedValueOnce(null)

    const mockLogger = createLogger()
    const message = { body: { claimRef: 'REBC-ABCD-1234', sbi: '123456789' } }

    await setPaymentStatusToPaid(message, mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith('Setting payment status to paid for claim REBC-ABCD-1234...')
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: claimFromDb.dataValues.applicationReference,
        claimReference: claimFromDb.dataValues.reference,
        claimStatus: claimFromDb.dataValues.statusId,
        claimType: claimFromDb.dataValues.data.claimType,
        dateTime: expect.any(Date),
        herdName: claimFromDb.dataValues.herd.herdName,
        sbi: message.body.sbi,
        typeOfLivestock: claimFromDb.dataValues.data.typeOfLivestock
      },
      'uk.gov.ffc.ahwr.claim.status.update',
      expect.any(Object),
      { sessionId: expect.any(String) }
    )
    expect(mockLogger.error).toHaveBeenCalledTimes(0)
  })

  test('validation fails because of incorrect message input', async () => {
    const mockLogger = createLogger()
    const message = { body: { claimRef: 'REBC-ABCD-1234', sbi: 123456789 } }

    await setPaymentStatusToPaid(message, mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Claim status to paid validation error:'))
    expect(mockLogger.error).toHaveBeenCalledWith(`Failed to move claim to paid status: Invalid message body in payment status to paid event: claimRef: ${message.body.claimRef} sbi: ${message.body.sbi}`)
    expect(sendMessage).toHaveBeenCalledTimes(0)
  })

  test('happy path for a claim being updated to paid, but its herdless as it was for a preMH visit', async () => {
    updateClaimByReference.mockResolvedValueOnce(null)
    const herdlessClaimFromDb = {
      dataValues: {
        applicationReference: 'IAHW-RWE2-G8S7',
        reference: 'REBC-ABCD-1234',
        statusId: 11,
        data: { claimType: 'R', typeOfLivestock: 'beef' }
      }
    }
    getClaimByReference.mockResolvedValueOnce(herdlessClaimFromDb)
    sendMessage.mockResolvedValueOnce(null)

    const mockLogger = createLogger()
    const message = { body: { claimRef: 'REBC-ABCD-1234', sbi: '123456789' } }

    await setPaymentStatusToPaid(message, mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith('Setting payment status to paid for claim REBC-ABCD-1234...')
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'IAHW-RWE2-G8S7',
        claimReference: 'REBC-ABCD-1234',
        claimStatus: 11,
        claimType: 'R',
        dateTime: expect.any(Date),
        herdName: 'Unnamed herd',
        sbi: '123456789',
        typeOfLivestock: 'beef'
      },
      'uk.gov.ffc.ahwr.claim.status.update',
      expect.any(Object),
      { sessionId: expect.any(String) }
    )
    expect(mockLogger.error).toHaveBeenCalledTimes(0)
  })
})
