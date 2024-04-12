const contactHistory = require('../../../../../app/repositories/contact-history-repository')
const applicationRepository = require('../../../../../app/repositories/application-repository')

jest.mock('../../../../../app/insights')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/contact-history-repository.js')

describe('Update contact history test', () => {
  const server = require('../../../../../app/server')
  // const claim = {
  //   applicationReference: 'AHWR-0AD3-3322',
  //   data: {
  //     typeOfLivestock: 'pigs',
  //     dateOfVisit: '2024-01-22T00:00:00.000Z',
  //     dateOfTesting: '2024-01-22T00:00:00.000Z',
  //     vetsName: 'Afshin',
  //     vetRCVSNumber: 'AK-2024',
  //     laboratoryURN: 'AK-2024',
  //     numberOfOralFluidSamples: 5,
  //     numberAnimalsTested: 30,
  //     testResults: 'positive',
  //     speciesNumbers: 'yes'
  //   },
  //   type: 'R',
  //   createdBy: 'admin'
  // }

  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })

  test.only('Update email and address fields in application and add the changes fields to contact history table', async () => {
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

  // test.each([
  //   { type: 'E', typeOfLivestock: 'sheep', numberAnimalsTested: 30, numberOfSamplesTested: undefined, testResults: sheepTestResultsMockData, biosecurity: undefined, sheepEndemicsPackage: 'sheepEndemicsPackage', herdVaccinationStatus: undefined, diseaseStatus: undefined },
  //   { type: 'E', typeOfLivestock: 'pigs', numberAnimalsTested: 30, numberOfSamplesTested: 6, testResults: undefined, biosecurity: { biosecurity: 'yes', assessmentPercentage: '10' }, sheepEndemicsPackage: undefined, herdVaccinationStatus: 'vaccinated', diseaseStatus: '1' },
  //   { type: 'E', typeOfLivestock: 'beef', numberAnimalsTested: 30, numberOfSamplesTested: undefined, testResults: 'positive', biosecurity: 'yes', sheepEndemicsPackage: undefined, herdVaccinationStatus: undefined, diseaseStatus: undefined }
  // ])(
  //   'Post claim with Type: $type and Type of Livestock: $typeOfLivestock and return 200',
  //   async ({ type, typeOfLivestock, numberOfSamplesTested, testResults, numberAnimalsTested, biosecurity, sheepEndemicsPackage, herdVaccinationStatus, diseaseStatus }) => {
  //     const options = {
  //       method: 'POST',
  //       url: '/api/claim',
  //       payload: { ...claim, type, ...{ data: { ...claim.data, typeOfLivestock, numberOfSamplesTested, testResults, numberAnimalsTested, biosecurity, sheepEndemicsPackage, herdVaccinationStatus, diseaseStatus, numberOfOralFluidSamples: undefined, ...(typeOfLivestock === 'sheep' && { laboratoryURN: undefined }) } } }
  //     }

  //     applicationRepository.get.mockResolvedValue({
  //       dataValues: {
  //         createdAt: '2024-02-14T09:59:46.756Z',
  //         id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
  //         updatedAt: '2024-02-14T10:43:03.544Z',
  //         updatedBy: 'admin',
  //         reference: 'AHWR-0F5D-4A26',
  //         applicationReference: 'AHWR-0AD3-3322',
  //         data: {},
  //         statusId: 1,
  //         type: 'R',
  //         createdBy: 'admin'
  //       }
  //     })

  //     const res = await server.inject(options)

  //     expect(res.statusCode).toBe(200)
  //     expect(contactHistory.set).toHaveBeenCalledTimes(1)
  //   }
  // )

  // test('Post claim with wrong application reference return 404', async () => {
  //   const options = {
  //     method: 'POST',
  //     url: '/api/claim',
  //     payload: {
  //       ...claim,
  //       applicationReference: 'AHWR-E01A-65EF'
  //     }
  //   }

  //   applicationRepository.get.mockResolvedValue({})

  //   const res = await server.inject(options)

  //   expect(res.statusCode).toBe(404)
  // })

  // test('Post claim with missing createdBy key and return 400', async () => {
  //   const options = {
  //     method: 'POST',
  //     url: '/api/claim',
  //     payload: {
  //       ...claim,
  //       createdBy: undefined
  //     }
  //   }

  //   const res = await server.inject(options)

  //   expect(res.statusCode).toBe(400)
  // })
})
