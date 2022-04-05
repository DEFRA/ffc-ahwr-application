const sendEmail = require('../../../../app/lib/send-email')
const notifyClient = require('../../../../app/lib/notify-client')
const error = new Error('Test exception')
error.response = { data: 'failed to send email' }

notifyClient.sendEmail = jest.fn().mockResolvedValueOnce(true).mockRejectedValueOnce(error)

const templateId = 'test-template'
const email = 'test@unit-test.com'
const options = { reference: 'EJ134S' }

describe('Send email test', () => {
  test('Returns true successful email', async () => {
    const response = await sendEmail(templateId, email, options)
    expect(response).toBe(true)
  })
  test('Returns false on error sending email', async () => {
    const response = await sendEmail(templateId, email, options)
    expect(response).toBe(false)
  })
})
