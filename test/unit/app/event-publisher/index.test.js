import { PublishEventBatch } from 'ffc-ahwr-event-publisher'
import { SEND_SESSION_EVENT, raiseApplicationFlagDeletedEvent, raiseApplicationFlaggedEvent } from '../../../../app/event-publisher/index.js'
import { config } from '../../../../app/config/index.js'

jest.mock('ffc-ahwr-event-publisher', () => {
  return {
    PublishEventBatch: jest.fn().mockImplementation(() => ({
      sendEvents: jest.fn()
    }))
  }
})

describe('Event Raisers', () => {
  const mockSendEvents = jest.fn()
  const mockQueue = 'mock-event-queue'

  beforeEach(() => {
    process.env.APPINSIGHTS_CLOUDROLE = 'test-role'
    PublishEventBatch.mockImplementation(() => ({
      sendEvents: mockSendEvents
    }))
    config.eventQueue = mockQueue
    mockSendEvents.mockClear()
  })

  const baseEvent = {
    application: { id: 'app-123' },
    message: 'Flag processed',
    raisedBy: 'test-user',
    raisedOn: new Date('2025-01-01T12:00:00Z'),
    flag: {
      id: 'flag-001',
      note: 'Missing paperwork',
      appliesToMh: true
    }
  }
  const expectedCommonProps = {
    id: 'app-123',
    sbi: '123456789',
    cph: 'n/a',
    checkpoint: 'test-role',
    status: 'success'
  }
  it('raises application flagged event correctly', async () => {
    await raiseApplicationFlaggedEvent(baseEvent, '123456789')
    expect(mockSendEvents).toHaveBeenCalledWith([
      {
        name: SEND_SESSION_EVENT,
        properties: {
          ...expectedCommonProps,
          action: {
            type: 'application:flagged',
            message: 'Flag processed',
            data: {
              flagId: 'flag-001',
              flagDetail: 'Missing paperwork',
              flagAppliesToMh: true
            },
            raisedBy: 'test-user',
            raisedOn: '2025-01-01T12:00:00.000Z'
          }
        }
      }
    ])
  })
  it('raises application flag deleted event correctly', async () => {
    await raiseApplicationFlagDeletedEvent({ ...baseEvent, flag: { ...baseEvent.flag, deletedNote: 'Remove the flag' } }, '123456789')
    expect(mockSendEvents).toHaveBeenCalledWith([
      {
        name: SEND_SESSION_EVENT,
        properties: {
          ...expectedCommonProps,
          action: {
            type: 'application:unflagged',
            message: 'Flag processed',
            data: {
              flagId: 'flag-001',
              flagAppliesToMh: true,
              deletedNote: 'Remove the flag'
            },
            raisedBy: 'test-user',
            raisedOn: '2025-01-01T12:00:00.000Z'
          }
        }
      }
    ])
  })
})
