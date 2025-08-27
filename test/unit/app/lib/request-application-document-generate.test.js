import { requestApplicationDocumentGenerateAndEmail } from '../../../../app/lib/request-application-document-generate.js'
import { config } from '../../../../app/config'
import { sendMessage } from '../../../../app/messaging/send-message'

jest.mock('../../../../app/messaging/send-message')

const { applicationEmailDocRequestMsgType, applicationDocCreationRequestQueue } = config

const email = 'test@unit-test.com'
const reference = 'AHWR-B977-4D0D'
const sbi = '123456789'
const whichSpecies = 'beef'
const startDate = Date.now()
const farmerName = 'farmer'
const orgName = 'Farmer org'
const orgEmail = 'test@unit-test.org'
const userType = 'newUser'

describe('send request for document generation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('requestApplicationDocumentGenerateAndEmail calls sendMessage to request document generation', async () => {
    const orgData = { orgName, orgEmail }
    sendMessage.mockResolvedValueOnce(true)

    await requestApplicationDocumentGenerateAndEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName, orgEmail }, applicationEmailDocRequestMsgType, applicationDocCreationRequestQueue)
  })

  test('requestApplicationDocumentGenerateAndEmail calls sendMessage  to request document generation with no orgEmail set', async () => {
    const orgData = { orgName }
    sendMessage.mockResolvedValueOnce(true)

    await requestApplicationDocumentGenerateAndEmail({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgData.orgName }, applicationEmailDocRequestMsgType, applicationDocCreationRequestQueue)
  })
})
