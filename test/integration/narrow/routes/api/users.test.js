const server = require('../../../../../app/server')
const downloadBlob = require('../../../../../app/lib/download-blob')
// const users = require('../../../../../app/lib/get-users')

jest.mock('../../../../../app/lib/download-blob')

const jsonData = [
  {
    farmerName: '__FARMER_1__',
    name: '__NAME_1__',
    sbi: '__SBI_1__',
    cph: '__CPH_1__',
    address: '__ADDRESS_1__',
    email: 'TEST_EMAIL_1@aol.com'
  },
  {
    farmerName: '__farmer_2__',
    name: '__name_2__',
    sbi: '__SBI_2__',
    cph: '__CPH_2__',
    address: '__ADDRESS_2__',
    email: 'TEST_EMAIL_2@aol.com'
  },
  {
    farmerName: '__Farmer_3__',
    name: '__Name_3__',
    sbi: '__SBI_3__',
    cph: '__CPH_3__',
    address: '__ADDRESS_3__',
    email: 'TEST_EMAIL_3@aol.com'
  }
]

describe('Users test', () => {
  beforeAll(async () => {
    server.start()
    downloadBlob.mockResolvedValue(JSON.stringify(jsonData))
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
      { payload: { farmerName: 'farmer_1' }, expectedResult: [jsonData[0]] },
      { payload: { name: 'name_1' }, expectedResult: [jsonData[0]] },
      { payload: { sbi: '__SBI_2__' }, expectedResult: [jsonData[1]] },
      { payload: { cph: '__CPH_3__' }, expectedResult: [jsonData[2]] },
      { payload: { text: 'farmer_3' }, expectedResult: [jsonData[2]] },
      { payload: {}, expectedResult: jsonData }
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
      { payload: { farmerName: 'farmer_1', name: 'name_2' }, expectedResult: [jsonData[0], jsonData[1]] },
      { payload: { name: 'name_1', sbi: '__SBI_2__' }, expectedResult: [jsonData[0], jsonData[1]] },
      { payload: { farmerName: 'farmer_1', text: 'name_3' }, expectedResult: [jsonData[0], jsonData[2]] }
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
      { payload: { sbi: '' } },
      { payload: { text: '' } }
    ])('empty strings are treated as invalid payload', async ({ payload }) => {
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
