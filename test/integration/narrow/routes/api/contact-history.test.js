const contactHistoryRepository = require('../../../../../app/repositories/contact-history-repository')
const applicationRepository = require('../../../../../app/repositories/application-repository')

jest.mock('../../../../../app/insights')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/contact-history-repository.js')

describe('Update contact history test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })
  const server = require('../../../../../app/server')
  describe('GET contact history route', () => {
    const reference = 'ABC-1234'
    const url = `/api/application/contact-history/${reference}`

    test('returns contact history', async () => {
      const options = {
        method: 'GET',
        url
      }
      const data = [
        {
          dataValues: {
            id: '67f8930f-a674-4fff-998a-3e11317aa2be',
            applicationReference: 'AHWR-9A80-954E',
            claimReference: null,
            data: {},
            sbi: '106699327',
            createdAt: '2024-04-15T15:01:15.634Z',
            updatedAt: '2024-04-15T15:01:15.665Z',
            createdBy: 'admin',
            updatedBy: null
          }
        }
      ]
      contactHistoryRepository.getAllByApplicationReference.mockResolvedValueOnce(data)

      const { result } = await server.inject(options)

      expect(result).toEqual(data)
    })

    test('returns empty history array', async () => {
      const options = {
        method: 'GET',
        url
      }
      const data = []
      contactHistoryRepository.getAllByApplicationReference.mockResolvedValueOnce(data)

      const { result } = await server.inject(options)

      expect(result).toEqual(data)
    })
  })

  describe('PUT route', () => {
    test('Update email, orgEmail, farmerName and address fields in application and add the changed fields to contact history table', async () => {
      const options = {
        method: 'PUT',
        url: '/api/application/contact-history',
        payload: {
          user: 'admin',
          farmerName: 'John Doe',
          orgEmail: 'westsomersetadvicebureaux@uaerubecivdatesremostsewo.com.test',
          email: 'test@example.com',
          address: '20 Everest Road,Rectory Road,BRICKHILL HOUSE,BLACKTON,TOTNES,CH64 6RT,United Kingdom',
          sbi: 107544286
        }
      }

      applicationRepository.getLatestApplicationsBySbi.mockResolvedValue([
        {
          id: '90496416-0c95-46e5-a79b-5d29ef8ebc39',
          reference: 'AHWR-9049-6416',
          data: {
            reference: null,
            declaration: true,
            offerStatus: 'accepted',
            whichReview: 'dairy',
            organisation: {
              sbi: 107204504,
              name: 'West Somerset Advice Bureau',
              email: '4fdfhvcjjh5@testvest.com',
              address: 'Oaklands Office Park,Offchurch Lane,CROWLE GRANGE,MOORHOUSE ROAD,COVENTRY,WA14 3RJ,United Kingdom',
              orgEmail: 'myorg@test.com',
              farmerName: 'Hayley Penrose-Body'
            },
            eligibleSpecies: 'yes',
            confirmCheckDetails: 'yes'
          },
          claimed: false,
          createdAt: '2024-04-12T11:21:56.187Z',
          updatedAt: '2024-04-12T14:54:55.736Z',
          createdBy: 'admin',
          updatedBy: 'admin',
          statusId: 1,
          type: 'VV'
        }])

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(1)
      expect(contactHistoryRepository.set).toHaveBeenCalledTimes(4)
    })

    test('accepts null orgEmail', async () => {
      const options = {
        method: 'PUT',
        url: '/api/application/contact-history',
        payload: {
          orgEmail: null,
          email: 'test@example.com',
          sbi: 107544286
        }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
    })

    test('Return 200 without updating contact history if no application found for the sbi', async () => {
      const options = {
        method: 'PUT',
        url: '/api/application/contact-history',
        payload: {
          user: 'admin',
          email: 'test@example.com',
          address: '20 Everest Road,Rectory Road,BRICKHILL HOUSE,BLACKTON,TOTNES,CH64 6RT,United Kingdom',
          sbi: 107544286
        }
      }

      applicationRepository.getLatestApplicationsBySbi.mockResolvedValue([])

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(0)
      expect(res.payload).toBe('No applications found to update')
      expect(contactHistoryRepository.set).toHaveBeenCalledTimes(0)
    })

    test('does not update when email, orgEmail & address are unchanged', async () => {
      const options = {
        method: 'PUT',
        url: '/api/application/contact-history',
        payload: {
          user: 'admin',
          email: 'test@example.com',
          orgEmail: 'westsomersetadvicebureaux@uaerubecivdatesremostsewo.com.test',
          address: '20 Everest Road,Rectory Road,BRICKHILL HOUSE,BLACKTON,TOTNES,CH64 6RT,United Kingdom',
          sbi: 107544286,
          farmerName: 'Hayley Penrose-Body'
        }
      }

      applicationRepository.getLatestApplicationsBySbi.mockResolvedValue([
        {
          id: '90496416-0c95-46e5-a79b-5d29ef8ebc39',
          reference: 'AHWR-9049-6416',
          data: {
            reference: null,
            declaration: true,
            offerStatus: 'accepted',
            whichReview: 'dairy',
            organisation: {
              sbi: 107204504,
              name: 'West Somerset Advice Bureau',
              email: 'test@example.com',
              address: '20 Everest Road,Rectory Road,BRICKHILL HOUSE,BLACKTON,TOTNES,CH64 6RT,United Kingdom',
              orgEmail: 'westsomersetadvicebureaux@uaerubecivdatesremostsewo.com.test',
              farmerName: 'Hayley Penrose-Body'
            },
            eligibleSpecies: 'yes',
            confirmCheckDetails: 'yes'
          },
          claimed: false,
          createdAt: '2024-04-12T11:21:56.187Z',
          updatedAt: '2024-04-12T14:54:55.736Z',
          createdBy: 'admin',
          updatedBy: 'admin',
          statusId: 1,
          type: 'VV'
        }])

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(0)
      expect(contactHistoryRepository.set).toHaveBeenCalledTimes(0)
    })

    test('returns 400 when sbi is missing', async () => {
      const options = {
        method: 'PUT',
        url: '/api/application/contact-history',
        payload: {
          user: 'admin',
          email: 'test@example.com',
          address: '20 Everest Road,Rectory Road,BRICKHILL HOUSE,BLACKTON,TOTNES,CH64 6RT,United Kingdom',
          sbi: ''
        }
      }

      applicationRepository.getLatestApplicationsBySbi.mockResolvedValue([
        {
          id: '90496416-0c95-46e5-a79b-5d29ef8ebc39',
          reference: 'AHWR-9049-6416',
          data: {
            reference: null,
            declaration: true,
            offerStatus: 'accepted',
            whichReview: 'dairy',
            organisation: {
              sbi: 107204504,
              name: 'West Somerset Advice Bureau',
              email: 'test@example.com',
              address: '20 Everest Road,Rectory Road,BRICKHILL HOUSE,BLACKTON,TOTNES,CH64 6RT,United Kingdom',
              orgEmail: 'westsomersetadvicebureaux@uaerubecivdatesremostsewo.com.test',
              farmerName: 'Hayley Penrose-Body'
            },
            eligibleSpecies: 'yes',
            confirmCheckDetails: 'yes'
          },
          claimed: false,
          createdAt: '2024-04-12T11:21:56.187Z',
          updatedAt: '2024-04-12T14:54:55.736Z',
          createdBy: 'admin',
          updatedBy: 'admin',
          statusId: 1,
          type: 'VV'
        }])

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(0)
      expect(contactHistoryRepository.set).toHaveBeenCalledTimes(0)
    })
  })
})
