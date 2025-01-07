import { sendSFDEmail } from '../../../../app/lib/sfd-client'
import { sendMessage } from '../../../../app/messaging/send-message'

jest.mock('../../../../app/messaging/send-message')

describe('sendSFDEmail', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('send SFD request successfully', async () => {
    await sendSFDEmail('99ef9794-67eb-4f18-bb38-541f30f955f8', 'hi@bye.com', {
      personalisation: {
        applicationReference: 'agreementRef',
        reference: 'someRef',
        crn: '1110000000',
        sbi: '123456789'
      }
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({
      agreementReference: 'agreementRef',
      claimReference: 'someRef',
      crn: '1110000000',
      customParams: {
        reference: 'someRef',
        applicationReference: 'agreementRef'
      },
      dateTime: expect.anything(),
      emailAddress: 'hi@bye.com',
      notifyTemplateId: '99ef9794-67eb-4f18-bb38-541f30f955f8',
      sbi: '123456789'
    },
    'uk.gov.ffc.ahwr.sfd.request', expect.anything())
  })

  test('send SFD request fails due to schema validation failing', async () => {
    await sendSFDEmail('99ef9794-67eb-4f18-bb38-541f30f955f8', 'hi@bye.com', {
      personalisation: {
        applicationReference: 'agreementRef',
        reference: 'someRef',
        crn: 'invalid',
        sbi: '123456789'
      }
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({
      sfdMessage: 'failed'
    },
    'uk.gov.ffc.ahwr.sfd.request', expect.anything(), { templateId: '99ef9794-67eb-4f18-bb38-541f30f955f8' })
  })
})
