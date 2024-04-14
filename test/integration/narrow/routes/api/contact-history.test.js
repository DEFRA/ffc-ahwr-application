const contactHistory = require('../../../../../app/repositories/contact-history-repository')
const applicationRepository = require('../../../../../app/repositories/application-repository')

jest.mock('../../../../../app/insights')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/contact-history-repository.js')

describe('Update contact history test', () => {
  const server = require('../../../../../app/server')
  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('Update email and address fields in application and add the changes fields to contact history table', async () => {
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
    expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(1)
    expect(contactHistory.set).toHaveBeenCalledTimes(2)
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
    expect(contactHistory.set).toHaveBeenCalledTimes(0)
  })

  test('Will not call set contact history and updateByReference if there is no change in email and the address', async () => {
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
    expect(contactHistory.set).toHaveBeenCalledTimes(0)
  })
})
