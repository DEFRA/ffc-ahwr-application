import { server } from '../../../../../app/server'
import { findApplication } from '../../../../../app/repositories/application-repository'
import { createFlag, getFlagByAppRef, getFlagsForApplication, getFlagByFlagId, deleteFlag, getAllFlags } from '../../../../../app/repositories/flag-repository'

jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/flag-repository')

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

      expect(res.statusCode).toBe(400)
      expect(createFlag).not.toHaveBeenCalled()
    })

    test('flagging an application returns a 201 if application exists and same flag does not already exist', async () => {
      getFlagByAppRef.mockResolvedValueOnce(null)

      const options = {
        method: 'POST',
        url: '/api/application/IAHW-F3F4-GGDE/flag',
        payload: { user: 'Tom', note: 'This needs flagging', appliesToMh: false }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(201)
      expect(createFlag).toHaveBeenCalledWith({ applicationReference: 'IAHW-F3F4-GGDE', appliesToMh: false, createdBy: 'Tom', note: 'This needs flagging', sbi: '123456789' })
    })

    test('flagging an application returns a 204 if application exists and same flag already exists', async () => {
      getFlagByAppRef.mockResolvedValueOnce({ dataValues: { applicationReference: 'IAHW-F3F4-GGDE', appliesToMh: false, createdBy: 'Tom', note: 'This needs flagging', sbi: '123456789' } })

      const options = {
        method: 'POST',
        url: '/api/application/IAHW-F3F4-GGDE/flag',
        payload: { user: 'Dave', note: 'This needs more flagging', appliesToMh: false }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(204)
      expect(createFlag).not.toHaveBeenCalled()
    })

    test('flagging an application returns a 404 if application does not exist', async () => {
      findApplication.mockResolvedValueOnce(null)

      const options = {
        method: 'POST',
        url: '/api/application/IAHW-F3F4-GGDE/flag',
        payload: { user: 'Dave', note: 'This needs more flagging', appliesToMh: false }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
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
        }]
      getFlagsForApplication.mockResolvedValueOnce(flags)

      const options = {
        method: 'GET',
        url: '/api/application/IAHW-F3F4-GGDE/flag'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.payload)).toEqual(flags)
    })

    test('returns an empty array if there are no flags', async () => {
      getFlagsForApplication.mockResolvedValueOnce([])

      const options = {
        method: 'GET',
        url: '/api/application/IAHW-F3F4-GGDE/flag'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
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

      expect(res.statusCode).toBe(400)
      expect(getFlagByFlagId).not.toHaveBeenCalled()
      expect(deleteFlag).not.toHaveBeenCalled()
    })

    test('deletes a flag if it exists', async () => {
      deleteFlag.mockResolvedValueOnce([1])
      const flagId = '333c18ef-fb26-4beb-ac87-c483fc886fea'

      const options = {
        method: 'PATCH',
        url: `/api/application/flag/${flagId}/delete`,
        payload: {
          user: 'fred.jones'
        }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(204)
      expect(deleteFlag).toHaveBeenCalledWith(flagId, 'fred.jones')
    })

    test('returns a 404 if the flag does not exist', async () => {
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

      expect(res.statusCode).toBe(404)
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
        }]

      getAllFlags.mockResolvedValueOnce(flags)

      const res = await server.inject({
        method: 'GET',
        url: '/api/flags'
      })

      expect(res.statusCode).toBe(200)
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

      expect(res.statusCode).toBe(200)
      expect(getAllFlags).toHaveBeenCalled()
      expect(JSON.parse(res.payload)).toEqual(flags)
    })
  })
})
