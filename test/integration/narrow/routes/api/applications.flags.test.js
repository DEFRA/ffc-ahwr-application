import { server } from '../../../../../app/server'
import { findApplication } from '../../../../../app/repositories/application-repository'
import {
  createFlag,
  getFlagByAppRef,
  getFlagsForApplication,
  deleteFlag,
  getAllFlags
} from '../../../../../app/repositories/flag-repository'
import {
  raiseApplicationFlaggedEvent,
  raiseApplicationFlagDeletedEvent
} from '../../../../../app/event-publisher'
import HttpStatus from 'http-status-codes'

jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/flag-repository')
jest.mock('../../../../../app/event-publisher')

raiseApplicationFlaggedEvent.mockImplementation(() => {})
raiseApplicationFlagDeletedEvent.mockImplementation(() => {})

findApplication.mockResolvedValue({
  reference: 'IAHW-F3F4-GGDE',
  createdBy: 'admin',
  createdAt: new Date(),
  data: {
    organisation: {
      sbi: '123456789'
    }
  }
})

createFlag.mockResolvedValue({
  dataValues: {
    id: '333c18ef-fb26-4beb-ac87-c483fc886fea',
    applicationReference: 'IAHW-U6ZE-5R5E',
    sbi: '123456789',
    note: 'Flag this please',
    createdBy: 'Tom',
    createdAt: '2025-04-09T11:59:54.075Z',
    appliesToMh: false,
    deletedAt: null,
    deletedBy: null
  }
})

describe('Application Flag tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('POST /api/application/{ref}/flag', () => {
    test('returns a 400 if joi schema catches invalid payload', async () => {
      const options = {
        method: 'POST',
        url: '/api/application/IAHW-F3F4-GGDE/flag',
        payload: { user: 'Tom' }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(createFlag).not.toHaveBeenCalled()
    })

    test('flagging an application returns a 201 if application exists and same flag does not already exist', async () => {
      getFlagByAppRef.mockResolvedValueOnce(null)

      const options = {
        method: 'POST',
        url: '/api/application/IAHW-F3F4-GGDE/flag',
        payload: {
          user: 'Tom',
          note: 'This needs flagging',
          appliesToMh: false
        }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.CREATED)
      expect(createFlag).toHaveBeenCalledWith({
        applicationReference: 'IAHW-F3F4-GGDE',
        appliesToMh: false,
        createdBy: 'Tom',
        note: 'This needs flagging',
        sbi: '123456789'
      })
      expect(raiseApplicationFlaggedEvent).toHaveBeenCalledWith(
        {
          application: { id: 'IAHW-F3F4-GGDE' },
          flag: {
            appliesToMh: false,
            id: '333c18ef-fb26-4beb-ac87-c483fc886fea',
            note: 'Flag this please'
          },
          message: 'Application flagged',
          raisedBy: 'Tom',
          raisedOn: '2025-04-09T11:59:54.075Z'
        },
        '123456789'
      )
    })

    test('flagging an application returns a 204 if application exists and same flag already exists', async () => {
      getFlagByAppRef.mockResolvedValueOnce({
        dataValues: {
          applicationReference: 'IAHW-F3F4-GGDE',
          appliesToMh: false,
          createdBy: 'Tom',
          note: 'This needs flagging',
          sbi: '123456789'
        }
      })

      const options = {
        method: 'POST',
        url: '/api/application/IAHW-F3F4-GGDE/flag',
        payload: {
          user: 'Dave',
          note: 'This needs more flagging',
          appliesToMh: false
        }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.NO_CONTENT)
      expect(createFlag).not.toHaveBeenCalled()
    })

    test('flagging an application returns a 404 if application does not exist', async () => {
      findApplication.mockResolvedValueOnce(null)

      const options = {
        method: 'POST',
        url: '/api/application/IAHW-F3F4-GGDE/flag',
        payload: {
          user: 'Dave',
          note: 'This needs more flagging',
          appliesToMh: false
        }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.NOT_FOUND)
      expect(createFlag).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/application/{ref}/flag', () => {
    test('returns the flags from the database', async () => {
      const flags = [
        {
          id: '333c18ef-fb26-4beb-ac87-c483fc886fea',
          applicationReference: 'IAHW-U6ZE-5R5E',
          sbi: '123456789',
          note: 'Flag this please',
          createdBy: 'Tom',
          createdAt: '2025-04-09T11:59:54.075Z',
          appliesToMh: false,
          deletedAt: null,
          deletedBy: null
        },
        {
          id: '53dbbc6c-dd14-4d01-be11-ad288cb16b08',
          applicationReference: 'IAHW-U6ZE-5R5E',
          sbi: '123456789',
          note: 'Flag this please',
          createdBy: 'Ben',
          createdAt: '2025-04-09T12:01:23.322Z',
          appliesToMh: true,
          deletedAt: null,
          deletedBy: null
        }
      ]
      getFlagsForApplication.mockResolvedValueOnce(flags)

      const options = {
        method: 'GET',
        url: '/api/application/IAHW-F3F4-GGDE/flag'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.OK)
      expect(JSON.parse(res.payload)).toEqual(flags)
    })

    test('returns an empty array if there are no flags', async () => {
      getFlagsForApplication.mockResolvedValueOnce([])

      const options = {
        method: 'GET',
        url: '/api/application/IAHW-F3F4-GGDE/flag'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.OK)
      expect(JSON.parse(res.payload)).toEqual([])
    })
  })

  describe('PATCH /api/application/flag/{flagId}/delete', () => {
    test('returns a 400 if no user in payload', async () => {
      const options = {
        method: 'PATCH',
        url: '/api/application/flag/abc123/delete'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(deleteFlag).not.toHaveBeenCalled()
    })

    test('deletes a flag if it exists', async () => {
      deleteFlag.mockResolvedValue([
        1,
        [
          {
            dataValues: {
              id: '333c18ef-fb26-4beb-ac87-c483fc886fea',
              applicationReference: 'IAHW-U6ZE-5R5E',
              sbi: '123456789',
              note: 'Flag this please',
              createdBy: 'Tom',
              createdAt: '2025-04-09T11:59:54.075Z',
              appliesToMh: false,
              deletedAt: '2025-04-10T11:59:54.075Z',
              deletedBy: 'Dave'
            }
          }
        ]
      ])
      const flagId = '333c18ef-fb26-4beb-ac87-c483fc886fea'

      const options = {
        method: 'PATCH',
        url: `/api/application/flag/${flagId}/delete`,
        payload: {
          user: 'fred.jones',
          deletedNote: 'Flag no longer needed'
        }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.NO_CONTENT)
      expect(deleteFlag).toHaveBeenCalledWith(flagId, 'fred.jones', 'Flag no longer needed')
      expect(raiseApplicationFlagDeletedEvent).toHaveBeenCalledWith({ application: { id: 'IAHW-U6ZE-5R5E' }, flag: { id: '333c18ef-fb26-4beb-ac87-c483fc886fea', deletedNote: 'Flag no longer needed', appliesToMh: false }, message: 'Application flag removed', raisedBy: 'Dave', raisedOn: '2025-04-10T11:59:54.075Z' }, '123456789')
    })

    test('returns a 400 if deletedNote is not provided', async () => {
      deleteFlag.mockResolvedValueOnce([0])
      const flagId = '333c18ef-fb26-4beb-ac87-c483fc886fea'

      const options = {
        method: 'PATCH',
        url: `/api/application/flag/${flagId}/delete`,
        payload: {
          user: 'fred.jones'
        }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.BAD_REQUEST)
      expect(deleteFlag).not.toHaveBeenCalled()
    })

    test('returns a 404 if the flag does not exist', async () => {
      deleteFlag.mockResolvedValueOnce([0])
      const flagId = '333c18ef-fb26-4beb-ac87-c483fc886fea'

      const options = {
        method: 'PATCH',
        url: `/api/application/flag/${flagId}/delete`,
        payload: {
          user: 'fred.jones',
          deletedNote: 'Flag no longer needed'
        }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(HttpStatus.NOT_FOUND)
      expect(deleteFlag).toHaveBeenCalled()
    })
  })

  describe('GET /api/flags', () => {
    test('returns an array of flags', async () => {
      const flags = [
        {
          id: '333c18ef-fb26-4beb-ac87-c483fc886fea',
          applicationReference: 'IAHW-U6ZE-5R5E',
          sbi: '123456789',
          note: 'Flag this please',
          createdBy: 'Tom',
          createdAt: '2025-04-09T11:59:54.075Z',
          appliesToMh: false,
          deletedAt: null,
          deletedBy: null
        },
        {
          id: '53dbbc6c-dd14-4d01-be11-ad288cb16b08',
          applicationReference: 'IAHW-U6ZE-5R5E',
          sbi: '123456789',
          note: 'Flag this please',
          createdBy: 'Ben',
          createdAt: '2025-04-09T12:01:23.322Z',
          appliesToMh: true,
          deletedAt: null,
          deletedBy: null
        }
      ]

      getAllFlags.mockResolvedValueOnce(flags)

      const res = await server.inject({
        method: 'GET',
        url: '/api/flags'
      })

      expect(res.statusCode).toBe(HttpStatus.OK)
      expect(getAllFlags).toHaveBeenCalled()
      expect(JSON.parse(res.payload)).toEqual(flags)
    })

    test('returns an empty array if there are no flags', async () => {
      const flags = []

      getAllFlags.mockResolvedValueOnce(flags)

      const res = await server.inject({
        method: 'GET',
        url: '/api/flags'
      })

      expect(res.statusCode).toBe(HttpStatus.OK)
      expect(getAllFlags).toHaveBeenCalled()
      expect(JSON.parse(res.payload)).toEqual(flags)
    })
  })
})
