import { server } from '../../../../../app/server'
import { getApplication } from '../../../../../app/repositories/application-repository'

jest.mock('../../../../../app/repositories/application-repository')

describe('latest-contact-details', () => {

  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('GET /api/application/latest-contact-details', () => {

    test('should return contact details when reference matches an application with contact details', async () => {
      getApplication.mockResolvedValueOnce({
        dataValues: {
          reference: "TEMP-MFV1-AAAA",
          createdBy: 'admin',
          createdAt: new Date("2025-01-01"),
          data: {
            type: "EE",
            reference: "TEMP-MFV1-AAAA",
            declaration: true,
            offerStatus: "accepted",
            organisation: {
              "sbi": "106642000",
              "name": "Willow Farm",
              "email": "john.doe@gmail.com",
              "address": "Sunnybrook Farm, 123 Harvest Lane, Meadowville, Oxfordshire, OX12 3AB, UK",
              "orgEmail": "willowfarm@gmail.com",
              "userType": "newUser",
              "farmerName": "John Jim Doe"
            },
            confirmCheckDetails: "yes"
          }
        }
      })

      const options = {
        method: 'GET',
        url: '/api/application/latest-contact-details/TEMP-MFV1-AAAA'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.payload)).toEqual({
        name: "Willow Farm",
        orgEmail: "willowfarm@gmail.com",
        farmerName: "John Jim Doe",
        email: "john.doe@gmail.com"
      })
    })

    test('should return empty contact details when reference matches an application without contact details', async () => {
      getApplication.mockResolvedValueOnce({
        dataValues: {
          reference: "TEMP-MFV1-AAAA",
          createdBy: 'admin',
          createdAt: new Date("2025-01-01"),
          data: {
            type: "EE",
            reference: "TEMP-MFV1-AAAA",
            declaration: true,
            offerStatus: "accepted",
            organisation: {
              "sbi": "106642000",
              "address": "Sunnybrook Farm, 123 Harvest Lane, Meadowville, Oxfordshire, OX12 3AB, UK",
              "userType": "newUser",
            },
            confirmCheckDetails: "yes"
          }
        }
      })

      const options = {
        method: 'GET',
        url: '/api/application/latest-contact-details/TEMP-MFV1-AAAA'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.payload)).toEqual({})
    })

    test('should return 404 when reference does not match an application', async () => {
      getApplication.mockResolvedValue(null)

      const options = {
        method: 'GET',
        url: '/api/application/latest-contact-details/TEMP-MFV1-AAAA'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      expect(getApplication).toHaveBeenCalledWith('TEMP-MFV1-AAAA')
    })

    test('should return 404 when reference does not match an application', async () => {
      getApplication.mockResolvedValue(null)

      const options = {
        method: 'GET',
        url: '/api/application/latest-contact-details/'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      expect(getApplication).toHaveBeenCalledWith('TEMP-MFV1-AAAA')
    })
  })
})
