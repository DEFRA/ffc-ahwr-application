import { submitClaim } from '../../../../../app/messaging/application/submit-claim'
import { config } from '../../../../../app/config'
import { messagingStates } from '../../../../../app/constants'
import appInsights from 'applicationinsights'
import { getApplication, updateApplicationByReference } from '../../../../../app/repositories/application-repository'
import { requiresComplianceCheck } from '../../../../../app/lib/requires-compliance-check'
import { sendMessage } from '../../../../../app/messaging/send-message'
import { sendFarmerClaimConfirmationEmail } from '../../../../../app/lib/send-email'

const { alreadyClaimed, failed, error, notFound, success } = messagingStates
const { submitClaimResponseMsgType, applicationResponseQueue, submitPaymentRequestMsgType, submitRequestQueue } = config

jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/lib/requires-compliance-check')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/lib/send-email')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

describe(('Submit claim tests'), () => {
  const reference = 'AHWR-1234-5678'
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const isRestApi = false
  const message = { body: { reference }, sessionId, isRestApi }

  beforeAll(async () => {
    jest.mock('../../../../../app/config', () => ({
      ...jest.requireActual('../../../../../app/config'),
      compliance: {
        applicationCount: 3
      }
    }))
  })

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test.each([
    { desc: 'unclaimed application successfully updated returns success state', updateRes: [1], state: success, statusId: 9, claimed: true },
    { desc: 'unclaimed application compliance check successfully updated returns success state', updateRes: [1], state: success, statusId: 5, claimed: false },
    { desc: 'unclaimed application unsuccessfully updated returns failed state', updateRes: [0], state: failed, statusId: 5, claimed: false }
  ])('$desc', async ({ updateRes, state, statusId, claimed }) => {
    const email = 'an@email.com'
    const orgEmail = 'an@email.com'
    const sbi = '444444444'
    const whichReview = 'beef'
    const applicationMock = { dataValues: { reference, data: { whichReview, organisation: { email, sbi, orgEmail } } } }
    getApplication.mockResolvedValueOnce(applicationMock)
    requiresComplianceCheck.mockResolvedValueOnce({
      statusId,
      claimed
    })

    updateApplicationByReference.mockResolvedValueOnce(updateRes)

    await submitClaim(message)

    expect(requiresComplianceCheck).toHaveBeenCalledTimes(1)
    expect(getApplication).toHaveBeenCalledWith(reference)
    expect(updateApplicationByReference).toHaveBeenCalledTimes(1)
    !isRestApi && expect(sendMessage).toHaveBeenCalledWith({ state }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })

    if (state === success) {
      expectAppInsightsEventRaised(reference, statusId, sbi)
    }

    if (state === success && statusId === 9) {
      // if ready to pay reply message and payment message should be sent
      !isRestApi && expect(sendMessage).toHaveBeenCalledTimes(2)
      expect(sendFarmerClaimConfirmationEmail).toHaveBeenCalledWith(email, reference, orgEmail, sbi)
      !isRestApi && expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichReview }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId })
      expect(updateApplicationByReference).toHaveBeenCalledWith({ reference, claimed: true, statusId, updatedBy: 'admin' })
    } else if (state === success && statusId === 5) {
      // if in check only reply message should be sent
      !isRestApi && expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendFarmerClaimConfirmationEmail).toHaveBeenCalledTimes(1)
      expect(updateApplicationByReference).toHaveBeenCalledWith({ reference, claimed: false, statusId, updatedBy: 'admin' })
    } else {
      !isRestApi && expect(sendMessage).toHaveBeenCalledTimes(1)
      !isRestApi && expect(sendFarmerClaimConfirmationEmail).toHaveBeenCalledTimes(0)
      expect(updateApplicationByReference).toHaveBeenCalledWith({ reference, claimed: false, statusId, updatedBy: 'admin' })
    }
  })

  function expectAppInsightsEventRaised (reference, statusId, sbi) {
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'process-claim',
      properties: {
        data: undefined,
        reference,
        status: statusId,
        sbi,
        scheme: 'old-world'
      }
    })
  }

  test.each([
    { desc: 'no application exists returns notFound state', applicationMock: null, state: notFound },
    { desc: 'application already claimed returns alreadyClaimed state', applicationMock: { claimed: true }, state: alreadyClaimed },
    { desc: 'application already on hold returns alreadyClaimed state', applicationMock: { claimed: false, statusId: 11 }, state: alreadyClaimed },
    { desc: 'application already in check returns alreadyClaimed state', applicationMock: { claimed: false, statusId: 5 }, state: alreadyClaimed },
    { desc: 'application already rejected returns alreadyClaimed state', applicationMock: { claimed: false, statusId: 10 }, state: alreadyClaimed },
    { desc: 'application already Recommended to pay returns alreadyClaimed state', applicationMock: { claimed: false, statusId: 12 }, state: alreadyClaimed },
    { desc: 'application already Recommended to reject returns alreadyClaimed state', applicationMock: { claimed: false, statusId: 13 }, state: alreadyClaimed },
    { desc: 'application already ready to pay returns alreadyClaimed state', applicationMock: { claimed: false, statusId: 9 }, state: alreadyClaimed }
  ])('$desc', async ({ applicationMock, state }) => {
    getApplication.mockResolvedValueOnce({ dataValues: applicationMock })

    await submitClaim(message)

    expect(getApplication).toHaveBeenCalledTimes(1)
    expect(getApplication).toHaveBeenCalledWith(reference)
    !isRestApi && expect(sendMessage).toHaveBeenCalledTimes(1)
    !isRestApi && expect(sendMessage).toHaveBeenCalledWith({ state }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('error occurring return error state', async () => {
    getApplication.mockRejectedValue(new Error('bust'))

    await submitClaim(message)

    expect(getApplication).toHaveBeenCalledTimes(1)
    expect(getApplication).toHaveBeenCalledWith(reference)
    !isRestApi && expect(sendMessage).toHaveBeenCalledTimes(1)
    !isRestApi && expect(sendMessage).toHaveBeenCalledWith({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('submit claim message validation failed', async () => {
    message.body.test = 'test'
    await submitClaim(message)
    !isRestApi && expect(sendMessage).toHaveBeenCalledTimes(1)
    !isRestApi && expect(sendMessage).toHaveBeenCalledWith({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })
  test('submit claim message validation failed', async () => {
    message.body.test = 'test'
    await submitClaim(message)
    !isRestApi && expect(sendMessage).toHaveBeenCalledTimes(1)
    !isRestApi && expect(sendMessage).toHaveBeenCalledWith({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
