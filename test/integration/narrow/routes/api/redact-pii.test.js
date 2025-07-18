import { server } from '../../../../../app/server'
import HttpStatus from 'http-status-codes'
import { sendMessage } from '../../../../../app/messaging/send-message.js'

jest.mock('../../../../../app/config/index', () => ({
  config: {
    multiHerds: {
      releaseDate: new Date()
    },
    notify: {
      templateIdFarmerEndemicsReviewComplete: ''
    },
    redactPiiRequestMsgType: 'mock.redact.pii.request',
    applicationRequestQueue: 'mock.queue'
  }
}))
jest.mock('../../../../../app/messaging/send-message')

describe('redact-pii', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('POST /api/redact/pii', () => {
    it('should return ACCEPTED status and queue redact PII message when called with empty payload', async () => {
      const res = await server.inject({ method: 'POST', url: '/api/redact/pii', payload: {} })

      expect(res.statusCode).toBe(HttpStatus.ACCEPTED)
      expect(sendMessage).toHaveBeenCalledWith({ requestDate: expect.any(Date) }, 'mock.redact.pii.request', 'mock.queue')
    })
  })
})
