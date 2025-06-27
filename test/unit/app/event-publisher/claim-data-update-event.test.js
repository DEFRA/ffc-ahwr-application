import { claimDataUpdateEvent } from '../../../../app/event-publisher/claim-data-update-event.js'
import { PublishEvent } from 'ffc-ahwr-common-library'

jest.mock('ffc-ahwr-common-library')

describe('Claim Data Update Event', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  test('Should send expected event for updated application data', async () => {
    const eventDate = new Date()
    const eventData = {
      applicationReference: 'AHWR-1234-ABCD',
      reference: 'AHWR-1234-ABCD',
      newValue: 'updated',
      oldValue: 'original',
      updatedProperty: 'vetRCVSNumber',
      note: 'changed vetRCVSNumber'
    }
    await claimDataUpdateEvent(eventData, 'application-vetName', 'admin', eventDate, '123456789')
    const mockPublishEventInstance = PublishEvent.mock.instances[0]
    const mockSendEvent = mockPublishEventInstance.sendEvent
    expect(mockSendEvent).toHaveBeenCalledWith({
      name: 'send-session-event',
      properties: {
        action: {
          data: eventData,
          message: 'Application Claim data updated',
          raisedBy: 'admin',
          raisedOn: eventDate.toISOString(),
          type: 'claim-vetName'
        },
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        cph: 'n/a',
        id: expect.anything(),
        sbi: '123456789',
        status: 'success'
      }
    })
  })

  test('Should send expected event for updated claim data', async () => {
    const eventDate = new Date()
    const eventData = {
      applicationReference: 'IAHW-1234-ABCD',
      reference: 'REBC-1234-WXYZ',
      newValue: 'updated',
      oldValue: 'original',
      updatedProperty: 'vetRCVSNumber',
      note: 'changed vetRCVSNumber'
    }
    await claimDataUpdateEvent(eventData, 'claim-vetRcvs', 'admin', eventDate, '123456789')
    const mockPublishEventInstance = PublishEvent.mock.instances[0]
    const mockSendEvent = mockPublishEventInstance.sendEvent
    expect(mockSendEvent).toHaveBeenCalledWith({
      name: 'send-session-event',
      properties: {
        action: {
          data: eventData,
          message: 'Claim data updated',
          raisedBy: 'admin',
          raisedOn: eventDate.toISOString(),
          type: 'claim-vetRcvs'
        },
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        cph: 'n/a',
        id: expect.anything(),
        sbi: '123456789',
        status: 'success'
      }
    })
  })
})
