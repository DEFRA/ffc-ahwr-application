import { PublishEventBatch } from 'ffc-ahwr-common-library'
import {
  SEND_SESSION_EVENT,
  raiseApplicationFlagDeletedEvent,
  raiseApplicationFlaggedEvent,
  raiseApplicationStatusEvent, APPLICATION_STATUS_EVENT, raiseClaimEvents
} from '../../../../app/event-publisher/index.js'
import { config } from '../../../../app/config/index.js'
import { createStatusHistory } from '../../../../app/repositories/status-history-repository.js'

jest.mock('ffc-ahwr-common-library', () => {
  return {
    PublishEventBatch: jest.fn().mockImplementation(() => ({
      sendEvents: jest.fn()
    }))
  }
})
jest.mock('../../../../app/repositories/status-history-repository.js')

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
    id: expect.any(String),
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
            type: 'application-flagged',
            message: 'Flag processed',
            data: {
              applicationReference: baseEvent.application.id,
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
            type: 'application-flag-deleted',
            message: 'Flag processed',
            data: {
              applicationReference: baseEvent.application.id,
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

  describe('raiseApplicationStatusEvent', () => {
    const baseStatusEvent = {
      application: {
        id: 'app-123',
        reference: 'APP-001',
        statusId: '11',
        data: {
          organisation: {
            sbi: '123456789'
          }
        }
      },
      message: 'Application has been updated',
      raisedBy: 'test-user',
      raisedOn: new Date('2025-01-01T12:00:00Z'),
      note: 'status change'
    }

    const expectedAppCommonProps = {
      id: expect.any(String),
      sbi: '123456789',
      cph: 'n/a',
      checkpoint: 'test-role',
      status: 'success'
    }

    afterEach(() => {
      config.storeHistoryInDb.enabled = false
    })

    it('when storeHistoryInDb flag disabled raises application status changed event and send session event correctly', async () => {
      await raiseApplicationStatusEvent(baseStatusEvent)
      expect(mockSendEvents).toHaveBeenCalledWith([
        {
          name: APPLICATION_STATUS_EVENT,
          properties: {
            ...expectedAppCommonProps,
            action: {
              type: 'status-updated',
              message: 'Application has been updated',
              data: {
                reference: baseStatusEvent.application.reference,
                note: 'status change',
                statusId: '11'
              },
              raisedBy: 'test-user',
              raisedOn: '2025-01-01T12:00:00.000Z'
            }
          }
        },
        {
          name: SEND_SESSION_EVENT,
          properties: {
            ...expectedAppCommonProps,
            action: {
              type: 'application:status-updated:11',
              message: 'Application has been updated',
              data: {
                reference: baseStatusEvent.application.reference,
                statusId: '11'
              },
              raisedBy: 'test-user',
              raisedOn: '2025-01-01T12:00:00.000Z'
            }
          }
        }
      ])
    })

    it('when storeHistoryInDb flag enabled raises send session event, and calls through to store status change in DB correctly', async () => {
      config.storeHistoryInDb.enabled = true
      await raiseApplicationStatusEvent(baseStatusEvent)
      expect(mockSendEvents).toHaveBeenCalledWith([
        {
          name: SEND_SESSION_EVENT,
          properties: {
            ...expectedAppCommonProps,
            action: {
              type: 'application:status-updated:11',
              message: 'Application has been updated',
              data: {
                reference: baseStatusEvent.application.reference,
                statusId: '11'
              },
              raisedBy: 'test-user',
              raisedOn: '2025-01-01T12:00:00.000Z'
            }
          }
        }
      ])

      expect(createStatusHistory).toHaveBeenCalledWith({
        createdAt: '2025-01-01T12:00:00.000Z',
        createdBy: 'test-user',
        note: 'status change',
        reference: 'APP-001',
        statusId: '11'
      })
    })
  })

  describe('raiseClaimEvents', () => {
    const baseClaimEvent = {
      claim: {
        id: 'c123',
        reference: 'CLA-001',
        statusId: '11',
        applicationReference: 'APP-001'
      },
      message: 'Claim has been updated',
      raisedBy: 'test-user',
      raisedOn: new Date('2025-01-01T12:00:00Z'),
      note: 'status change'
    }

    const expectedAppCommonProps = {
      id: 'c123',
      sbi: '123456789',
      cph: 'n/a',
      checkpoint: 'test-role',
      status: 'success'
    }

    afterEach(() => {
      config.storeHistoryInDb.enabled = false
    })

    it('when storeHistoryInDb flag disabled raises application status changed event and send session event correctly', async () => {
      await raiseClaimEvents(baseClaimEvent, '123456789')
      expect(mockSendEvents).toHaveBeenCalledWith([
        {
          name: APPLICATION_STATUS_EVENT,
          properties: {
            ...expectedAppCommonProps,
            action: {
              type: 'status-updated',
              message: 'Claim has been updated',
              data: {
                reference: baseClaimEvent.claim.reference,
                applicationReference: baseClaimEvent.claim.applicationReference,
                note: 'status change',
                statusId: '11'
              },
              raisedBy: 'test-user',
              raisedOn: '2025-01-01T12:00:00.000Z'
            }
          }
        },
        {
          name: SEND_SESSION_EVENT,
          properties: {
            ...expectedAppCommonProps,
            action: {
              type: 'application:status-updated:11',
              message: 'Claim has been updated',
              data: {
                reference: baseClaimEvent.claim.reference,
                applicationReference: baseClaimEvent.claim.applicationReference,
                statusId: '11'
              },
              raisedBy: 'test-user',
              raisedOn: '2025-01-01T12:00:00.000Z'
            }
          }
        }
      ])
    })

    it('when storeHistoryInDb flag enabled raises send session event, and calls through to store status change in DB correctly', async () => {
      config.storeHistoryInDb.enabled = true
      await raiseClaimEvents(baseClaimEvent, '123456789')
      expect(mockSendEvents).toHaveBeenCalledWith([
        {
          name: SEND_SESSION_EVENT,
          properties: {
            ...expectedAppCommonProps,
            action: {
              type: 'application:status-updated:11',
              message: 'Claim has been updated',
              data: {
                reference: baseClaimEvent.claim.reference,
                applicationReference: baseClaimEvent.claim.applicationReference,
                statusId: '11'
              },
              raisedBy: 'test-user',
              raisedOn: '2025-01-01T12:00:00.000Z'
            }
          }
        }
      ])

      expect(createStatusHistory).toHaveBeenCalledWith({
        createdAt: '2025-01-01T12:00:00.000Z',
        createdBy: 'test-user',
        note: 'status change',
        reference: 'CLA-001',
        statusId: '11'
      })
    })
  })
})
