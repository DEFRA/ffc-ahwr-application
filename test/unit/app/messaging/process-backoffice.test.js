const processBackOffice = require('../../../../app/messaging/back-office/process-backoffice')
const { backOfficeResponseMsgType, backOfficeResponseQueue } = require('../../../../app/config')

jest.mock('../../../../app/lib/send-email')
const sendMessage = require('../../../../app/messaging/send-message')
jest.mock('../../../../app/messaging/send-message')
const applicationRepository = require('../../../../app/repositories/application-repository')
jest.mock('../../../../app/repositories/application-repository')

describe('processing backOffice request message', () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const searchText = '444444444'
  const searchType = 'sbi'
  const reference = 'ABCDEFG'
  const searchMessage = {
    body: {
      search: {
        searchText,
        searchType
      }
    },
    sessionId
  }
  const email = 'email@domain.com'
  const name = 'name-on-org'
  const message = {
    body: {
      organisation: {
        email,
        name
      }
    },
    sessionId
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })
  test('successfully submits backOffice search request', async () => {
    applicationRepository.getAll.mockResolvedValue(
      [{ reference, createdBy: 'admin', createdAt: new Date(), data: message.body }]
    )

    applicationRepository.getApplicationCount.mockResolvedValue(1)
    await processBackOffice(searchMessage)

    expect(applicationRepository.getAll).toHaveBeenCalledTimes(1)
    expect(applicationRepository.getApplicationCount).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({
      applications: [
        {
          createdAt: expect.any(Date),
          createdBy: 'admin',
          data: message.body,
          reference: 'ABCDEFG'
        }
      ],
      total: 1
    }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
  })

  test('Sends failed state on db error not data found for search', async () => {
    applicationRepository.getAll.mockResolvedValue(new Error('bust'))

    await processBackOffice(searchMessage)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applications: new Error('bust'), total: 1 }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
  })
})
