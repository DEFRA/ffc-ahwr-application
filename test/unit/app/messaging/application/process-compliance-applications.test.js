const processComplianceApplications = require('../../../../../app/messaging/application/process-compliance-applications')
const repository = require('../../../../../app/repositories/compliance-application-repository')
const applicationRepository = require('../../../../../app/repositories/application-repository')
const statusIds = require('../../../../../app/constants/application-status')
const sendMessage = require('../../../../../app/messaging/send-message')
const { submitPaymentRequestMsgType, submitRequestQueue } = require('../../../../../app/config')

jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/compliance-application-repository')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('uuid', () => ({ v4: () => '123456789' }))

const applicationReference = 'AHWR-1234-5678'
const id = 'random-test-id'

describe(('Submit claim tests'), () => {
  const consoleLogSpy = jest.spyOn(console, 'log')
  const consoleErrorSpy = jest.spyOn(console, 'error')
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Skip update when no application to process', async () => {
    repository.getPendingApplications.mockReturnValueOnce(null)
    await processComplianceApplications()
    expect(repository.update).toHaveBeenCalledTimes(0)
    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith('No compliance applications to process')
  })

  test('Skip update when no application found', async () => {
    repository.getPendingApplications.mockReturnValueOnce([{
      applicationReference,
      statusId: statusIds.inCheck,
      id
    }])
    applicationRepository.get.mockReturnValueOnce(null)
    await processComplianceApplications()
    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(applicationReference)
    expect(repository.update).toHaveBeenCalledTimes(0)
    expect(consoleLogSpy).toHaveBeenCalledTimes(2)
    expect(consoleLogSpy).toHaveBeenCalledWith(`application with reference ${applicationReference} not found`)
  })

  test('Skip update when application status is same as compliance check', async () => {
    const application = {
      dataValues: {
        reference: applicationReference,
        statusId: statusIds.inCheck
      }
    }
    repository.getPendingApplications.mockReturnValueOnce([{
      applicationReference,
      statusId: statusIds.inCheck,
      id
    }])
    applicationRepository.get.mockReturnValueOnce(application)
    await processComplianceApplications()
    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(applicationReference)
    expect(repository.update).toHaveBeenCalledTimes(0)
    expect(consoleLogSpy).toHaveBeenCalledTimes(2)
    expect(consoleLogSpy).toHaveBeenCalledWith(`application with reference ${applicationReference} has same status`)
  })

  test('Update when application is rejected, do not send payment ', async () => {
    const application = {
      dataValues: {
        reference: applicationReference,
        statusId: statusIds.inCheck
      }
    }
    repository.getPendingApplications.mockReturnValueOnce([{
      applicationReference,
      statusId: statusIds.rejected,
      id
    }])
    applicationRepository.get.mockReturnValueOnce(application)
    await processComplianceApplications()
    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(0)
    expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(1)
    expect(repository.update).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledTimes(2)
    expect(consoleLogSpy).toHaveBeenCalledWith(`application with reference ${applicationReference} successfully updated`)
  })

  test('Update when application is approved, and also send payment ', async () => {
    const application = {
      dataValues: {
        reference: applicationReference,
        statusId: statusIds.inCheck,
        data: {
          organisation: {
            sbi: '111123333'
          },
          whichReview: 'sheep'
        }
      }
    }
    repository.getPendingApplications.mockReturnValueOnce([{
      applicationReference,
      statusId: statusIds.readyToPay,
      id
    }])
    applicationRepository.get.mockReturnValueOnce(application)
    await processComplianceApplications()
    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference: applicationReference, sbi: '111123333', whichReview: 'sheep' }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId: '123456789' })
    expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(1)
    expect(repository.update).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledTimes(2)
    expect(consoleLogSpy).toHaveBeenCalledWith(`application with reference ${applicationReference} successfully updated`)
  })

  test('handle error', async () => {
    const error = new Error('Test exception')
    repository.getPendingApplications.mockRejectedValueOnce(error)
    await processComplianceApplications()
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith('failed to update applications status', error)
  })
})
