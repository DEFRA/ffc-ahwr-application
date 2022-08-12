const server = require('../../../../../app/server')
const downloadBlob = require('../../../../../app/lib/download-blob')
const userData = require('../../../../data/users')

jest.mock('../../../../../app/lib/download-blob')

describe('Users test', () => {
  beforeAll(async () => {
    server.start()
    downloadBlob.mockResolvedValue(JSON.stringify(userData))
  })

  afterAll(async () => {
    server.stop()
  })

  const url = '/api/user/search'
  describe(`POST ${url} route`, () => {
    const method = 'POST'

    afterEach(async () => {
      jest.clearAllMocks()
    })

    test.each([
      { payload: { farmerName: 'farmer_1' }, expectedResult: [userData[0]] },
      { payload: { name: 'name_1' }, expectedResult: [userData[0]] },
      { payload: { sbi: 223334444 }, expectedResult: [userData[1]] },
      { payload: { cph: '11/123/4567' }, expectedResult: [userData[2]] },
      { payload: { text: 'farmer_3' }, expectedResult: [userData[2]] },
      { payload: {}, expectedResult: userData }
    ])('individual fields in payloads are valid and relevant search results are returned', async ({ payload, expectedResult }) => {
      const options = {
        method,
        url,
        payload
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(downloadBlob).toHaveBeenCalledTimes(1)

      const data = JSON.parse(res.payload)
      expect(data).toEqual(expectedResult)
    })

    test.each([
      { payload: { farmerName: 'farmer_1', name: 'name_2' }, expectedResult: [userData[0], userData[1]] },
      { payload: { name: 'name_1', sbi: 223334444 }, expectedResult: [userData[0], userData[1]] },
      { payload: { farmerName: 'farmer_1', text: 'name_3' }, expectedResult: [userData[0], userData[2]] }
    ])('returns mutliple users for composite searches', async ({ payload, expectedResult }) => {
      const options = {
        method,
        url,
        payload
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(downloadBlob).toHaveBeenCalledTimes(1)

      const data = JSON.parse(res.payload)
      expect(data).toEqual(expectedResult)
    })

    test.each([
      { payload: { farmerName: '' } },
      { payload: { name: '' } },
      { payload: { cph: '' } },
      { payload: { cph: '22/333/444' } },
      { payload: { sbi: '' } },
      { payload: { text: '' } }
    ])('invalid payload values return status code 400', async ({ payload }) => {
      const options = {
        method,
        url,
        payload
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      expect(downloadBlob).toHaveBeenCalledTimes(0)
    })
  })
})
