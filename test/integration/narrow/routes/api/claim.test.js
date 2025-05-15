import { server } from '../../../../../app/server'
import { getClaimByReference, getByApplicationReference, isURNNumberUnique, setClaim, updateClaimByReference, searchClaims } from '../../../../../app/repositories/claim-repository'
import { getApplication } from '../../../../../app/repositories/application-repository'
import { sendMessage } from '../../../../../app/messaging/send-message'
import { requestClaimConfirmationEmail } from '../../../../../app/lib/request-email.js'
import { claimPricesConfig } from '../../../../data/claim-prices-config'
import { getBlob } from '../../../../../app/storage/getBlob'
import { getAmount } from '../../../../../app/lib/getAmount'
import appInsights from 'applicationinsights'
import { isVisitDateAfterPIHuntAndDairyGoLive, isMultipleHerdsUserJourney } from '../../../../../app/lib/context-helper'
import { config } from '../../../../../app/config/index.js'
import { buildData } from '../../../../../app/data/index.js'
import { createHerd, getHerdById, updateIsCurrentHerd } from '../../../../../app/repositories/herd-repository'

jest.mock('../../../../../app/insights')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/claim-repository')
jest.mock('../../../../../app/repositories/herd-repository')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/lib/request-email.js')
jest.mock('../../../../../app/lib/getAmount')
jest.mock('../../../../../app/storage/getBlob')
jest.mock('../../../../../app/lib/context-helper')

const sheepTestResultsMockData = [
  { diseaseType: 'flystrike', result: 'negative' },
  { diseaseType: 'sheepScab', result: 'positive' }
]

describe('Get claims test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('Get claim by claim reference and return 200', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-reference/AHWR-5602-BAC6'
    }

    getClaimByReference.mockResolvedValueOnce({
      dataValues: { reference: 'AHWR-5602-BAC6' }
    })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(getClaimByReference).toHaveBeenCalledTimes(1)
  })
  test('When claim does not exist, return 404', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-reference/AHWR-5602-BAC6'
    }

    getClaimByReference.mockResolvedValueOnce({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
    expect(getClaimByReference).toHaveBeenCalledTimes(1)
    expect(res.payload).toBe('Not Found')
  })

  test('get-by-application-reference returns claims', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-application-reference/AHWR-0AD3-3322'
    }

    const data = [
      {
        id: '5602bac6-0812-42b6-bfb0-35f7ed2fd16c',
        reference: 'AHWR-5602-BAC6',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'vetsName',
          dateOfVisit: '2024-02-01T07:24:29.224Z',
          testResults: 'testResult',
          typeOfReview: 'typeOfReview',
          dateOfTesting: '2024-02-01T07:24:29.224Z',
          laboratoryURN: '12345566',
          vetRCVSNumber: '12345',
          detailsCorrect: 'yes',
          typeOfLivestock: 'sheep',
          numberAnimalsTested: '12',
          numberOfOralFluidSamples: '23',
          minimumNumberAnimalsRequired: '20'
        },
        statusId: 11,
        type: 'R',
        createdAt: '2024-02-01T07:24:29.224Z',
        updatedAt: '2024-02-01T08:02:30.356Z',
        createdBy: 'admin',
        updatedBy: null,
        status: {
          status: 'ON HOLD'
        }
      },
      {
        id: 'e01a65ef-8c9d-4a1f-92e0-362748c21bd5',
        reference: 'AHWR-E01A-65EF',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'vetsName',
          dateOfVisit: '2024-02-01T07:24:29.224Z',
          testResults: 'testResult',
          typeOfReview: 'typeOfReview',
          dateOfTesting: '2024-02-01T07:24:29.224Z',
          laboratoryURN: '12345566',
          vetRCVSNumber: '12345',
          detailsCorrect: 'yes',
          typeOfLivestock: 'beef',
          numberAnimalsTested: '23',
          numberOfOralFluidSamples: '12',
          minimumNumberAnimalsRequired: '20'
        },
        statusId: 11,
        type: 'R',
        createdAt: '2024-02-01T07:03:18.151Z',
        updatedAt: '2024-02-01T07:15:55.457Z',
        createdBy: 'admin',
        updatedBy: null,
        status: {
          status: 'ON HOLD'
        }
      }
    ]

    getByApplicationReference.mockResolvedValueOnce(data)

    const { result } = await server.inject(options)

    expect(result).toEqual(data)
  })

  test('get-by-application-reference returns empty claims array', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-application-reference/AHWR-5602-BAC6'
    }

    const data = []

    getByApplicationReference.mockResolvedValueOnce(data)

    const { result } = await server.inject(options)

    expect(result).toEqual(data)
  })

  test('get-by-application-reference accepts a valid typeOfLivestock query string', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-application-reference/AHWR-0AD3-3322?typeOfLivestock=pigs'
    }

    const data = []

    getByApplicationReference.mockResolvedValueOnce(data)

    const { result } = await server.inject(options)

    expect(result).toEqual(data)
  })

  test('get-by-application-reference rejects an invalid typeOfLivestock query string', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-application-reference/AHWR-0AD3-3322?typeOfLivestock=cows'
    }

    const { result } = await server.inject(options)

    expect(result).toEqual({ error: 'Bad Request', message: 'Invalid request query input', statusCode: 400 })
  })
})

describe('Post claim test', () => {
  const claim = {
    applicationReference: 'AHWR-0AD3-3322',
    reference: 'TEMP-O9UD-22F6',
    data: {
      typeOfLivestock: 'pigs',
      dateOfVisit: '2024-01-22T00:00:00.000Z',
      dateOfTesting: '2024-01-22T00:00:00.000Z',
      vetsName: 'Afshin',
      vetRCVSNumber: 'AK-2024',
      laboratoryURN: 'AK-2024',
      numberOfOralFluidSamples: 5,
      numberAnimalsTested: 30,
      testResults: 'positive',
      speciesNumbers: 'yes'
    },
    type: 'R',
    createdBy: 'admin'
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.resetAllMocks()
    await server.start()
    jest.mock('../../../../../app/config', () => ({
      storage: {
        storageAccount: 'mockStorageAccount',
        useConnectionString: false,
        endemicsSettingsContainer: 'endemics-settings',
        connectionString: 'connectionString'
      }
    }))
    getBlob.mockReturnValue(claimPricesConfig)
    getAmount.mockReturnValue(100)
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return false })
    isMultipleHerdsUserJourney.mockImplementation(() => { return false })
    config.multiHerds.enabled = false
    jest.spyOn(buildData.sequelize, 'transaction').mockImplementation(async (callback) => {
      return await callback()
    })
  })

  afterEach(async () => {
    await server.stop()
  })

  function expectAppInsightsEventRaised (data, reference, statusId, sbi) {
    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
      name: 'process-claim',
      properties: {
        data,
        reference,
        status: statusId,
        sbi,
        scheme: 'new-world'
      }
    })
  }

  test('Post a new claim with duplicated URN ', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim
      }
    }
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: false })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'Afshin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30
        },
        statusId: 1,
        type: 'E',
        createdBy: 'admin'
      }
    })

    const response = await server.inject(options)

    expect(response.statusCode).toBe(400)
  })

  test.each([
    { type: 'R', typeOfLivestock: 'dairy', numberAnimalsTested: undefined, numberOfOralFluidSamples: undefined, testResults: 'positive' },
    { type: 'R', typeOfLivestock: 'pigs', numberAnimalsTested: 30, numberOfOralFluidSamples: 5, testResults: 'positive' }
  ])('Post claim with Type: $type and Type of Livestock: $typeOfLivestock and return 200', async ({ type, typeOfLivestock, numberOfOralFluidSamples, testResults, numberAnimalsTested }) => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim, ...{ type }, ...{ data: { ...claim.data, typeOfLivestock, numberOfOralFluidSamples, testResults, numberAnimalsTested } } }
    }
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })

    setClaim.mockResolvedValueOnce({
      dataValues: {
        reference: claim.reference,
        applicationReference: claim.applicationReference
      }
    })

    await server.inject(options)

    expect(setClaim).toHaveBeenCalledTimes(1)
    expect(requestClaimConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-0AD3-3322',
        claimReference: 'TEMP-O9UD-22F6',
        claimStatus: 11,
        claimType: 'R',
        typeOfLivestock,
        dateTime: expect.any(Date)
      },
      'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    )
  })

  test.each([
    { type: 'E', typeOfLivestock: 'sheep', numberAnimalsTested: 30, numberOfSamplesTested: undefined, testResults: sheepTestResultsMockData, biosecurity: undefined, sheepEndemicsPackage: 'sheepEndemicsPackage', herdVaccinationStatus: undefined, diseaseStatus: undefined },
    { type: 'E', typeOfLivestock: 'pigs', numberAnimalsTested: 30, numberOfSamplesTested: 6, testResults: undefined, biosecurity: { biosecurity: 'yes', assessmentPercentage: '10' }, sheepEndemicsPackage: undefined, herdVaccinationStatus: 'vaccinated', diseaseStatus: '1', reviewTestResults: 'positive' },
    { type: 'E', typeOfLivestock: 'beef', numberAnimalsTested: undefined, numberOfSamplesTested: undefined, testResults: 'positive', biosecurity: 'yes', sheepEndemicsPackage: undefined, herdVaccinationStatus: undefined, diseaseStatus: undefined, reviewTestResults: 'positive', piHunt: 'yes' }
  ])(
    'Post claim with Type: $type and Type of Livestock: $typeOfLivestock and return 200',
    async ({ type, typeOfLivestock, numberOfSamplesTested, testResults, numberAnimalsTested, biosecurity, sheepEndemicsPackage, herdVaccinationStatus, diseaseStatus, reviewTestResults, piHunt }) => {
      const options = {
        method: 'POST',
        url: '/api/claim',
        payload: { ...claim, type, ...{ data: { ...claim.data, typeOfLivestock, numberOfSamplesTested, testResults, numberAnimalsTested, biosecurity, sheepEndemicsPackage, herdVaccinationStatus, diseaseStatus, numberOfOralFluidSamples: undefined, reviewTestResults, piHunt, ...(typeOfLivestock === 'sheep' && { laboratoryURN: undefined }) } } }
      }

      isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
      getApplication.mockResolvedValueOnce({
        dataValues: {
          createdAt: '2024-02-14T09:59:46.756Z',
          id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
          updatedAt: '2024-02-14T10:43:03.544Z',
          updatedBy: 'admin',
          reference: 'AHWR-0F5D-4A26',
          applicationReference: 'AHWR-0AD3-3322',
          data: {},
          statusId: 1,
          type: 'R',
          createdBy: 'admin'
        }
      })

      await server.inject(options)

      expect(setClaim).toHaveBeenCalledTimes(1)
    }
  )

  test('Post claim with Type: endemics and Type of Livestock: beef that review test result is negative and piHuntRecommended is enabled and return 200', async () => {
    const claimRef = 'TEMP-3FS2-334F'
    const applicationRef = 'IAHW-0AD3-3322'
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        applicationReference: applicationRef,
        reference: claimRef,
        type: 'E',
        createdBy: 'admin',
        data: {
          vetsName: 'Dave',
          biosecurity: 'yes',
          dateOfVisit: '2024-05-13T00:00:00.000Z',
          vetRCVSNumber: '7777777',
          speciesNumbers: 'yes',
          typeOfLivestock: 'beef',
          reviewTestResults: 'negative',
          piHunt: 'yes',
          piHuntRecommended: 'yes',
          piHuntAllAnimals: 'yes',
          laboratoryURN: 'AK-2024',
          testResults: 'negative',
          dateOfTesting: '2024-05-13T00:00:00.000Z'
        }
      }
    }
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
    isMultipleHerdsUserJourney.mockImplementation(() => { return false })
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: applicationRef,
        applicationReference: applicationRef,
        data: {
          organisation: {
            email: 'test@test-unit.com',
            farmerName: 'farmerName',
            name: 'orgName',
            orgEmail: 'test@test-unit.org',
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'E',
        createdBy: 'admin'
      }
    })

    setClaim.mockResolvedValueOnce({
      dataValues: {
        reference: claimRef,
        applicationReference: applicationRef
      }
    })

    await server.inject(options)

    expect(setClaim).toHaveBeenCalledTimes(1)
    expect(requestClaimConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({
      applicationReference: applicationRef,
      reference: claimRef,
      species: 'Beef cattle',
      email: 'test@test-unit.com',
      amount: 100,
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org', crn: '1100014934', sbi: '106705779' }
    }), config.notify.templateIdFarmerEndemicsFollowupComplete)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        sbi: '106705779',
        crn: '1100014934',
        agreementReference: applicationRef,
        claimReference: claimRef,
        claimStatus: 11,
        claimType: 'E',
        typeOfLivestock: 'beef',
        reviewTestResults: 'negative',
        dateTime: expect.any(Date),
        piHuntRecommended: 'yes',
        piHuntAllAnimals: 'yes'
      },
      'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    )
  })

  test('Post claim with non-found application reference return 404', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim,
        applicationReference: 'AHWR-E01A-65EF'
      }
    }

    getApplication.mockResolvedValueOnce({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
  })

  test('Post claim with missing createdBy key and return 400', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim,
        createdBy: undefined
      }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
  })

  test('sent the correct parameters to send sendFarmerEndemicsClaimConfirmationEmail when claim type is review, and raise appInsights event', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim
      }
    }

    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            email: 'test@test-unit.com',
            farmerName: 'farmerName',
            name: 'orgName',
            orgEmail: 'test@test-unit.org',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    setClaim.mockResolvedValueOnce({
      dataValues: {
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024'
        }
      }
    })
    requestClaimConfirmationEmail.mockResolvedValueOnce(true)

    await server.inject(options)

    expect(setClaim).toHaveBeenCalledTimes(1)
    expect(requestClaimConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(requestClaimConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({
      reference: 'AHWR-0F5D-4A26',
      applicationReference: 'AHWR-0AD3-3322',
      email: 'test@test-unit.com',
      amount: 100,
      farmerName: 'farmerName',
      species: 'Pigs',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org', sbi: '106705779' }
    }), config.notify.templateIdFarmerEndemicsReviewComplete)

    expectAppInsightsEventRaised({
      applicationReference: 'AHWR-0AD3-3322',
      typeOfLivestock: 'pigs',
      dateOfVisit: '2024-01-22T00:00:00.000Z',
      claimType: 'R',
      piHunt: undefined
    }, 'AHWR-0F5D-4A26', 11, '106705779')
  })

  test('no appInsights event raised when send email request is false', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim
      }
    }
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        reference: 'AHWR-0F5D-4A26',
        data: {},
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    setClaim.mockResolvedValueOnce({
      dataValues: {
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024'
        }
      }
    })
    requestClaimConfirmationEmail.mockResolvedValueOnce(false)
    await server.inject(options)

    expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledTimes(0)
  })
  test('Check if laboratoryURN is unique ', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim/is-urn-unique',
      payload: {
        sbi: '123456789',
        laboratoryURN: 'AK-2024'
      }
    }

    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })

    const response = await server.inject(options)

    expect(response.statusCode).toBe(200)
  })

  test.each([
    { search: { text: '444444444', type: 'sbi' } },
    { search: { text: 'AHWR-555A-FD6E', type: 'ref' } },
    { search: { text: 'applied', type: 'status' } },
    { search: { text: 'data inputted', type: 'status' } },
    { search: { text: 'claimed', type: 'status' } },
    { search: { text: 'check', type: 'status' } },
    { search: { text: 'accepted', type: 'status' } },
    { search: { text: 'rejected', type: 'status' } },
    { search: { text: 'paid', type: 'status' } },
    { search: { text: 'withdrawn', type: 'status' } },
    { search: { text: 'on hold', type: 'status' } }
  ])('returns success when post %p', async ({ search }) => {
    const options = {
      method: 'POST',
      url: '/api/claim/search',
      payload: { search }
    }

    searchClaims.mockResolvedValueOnce({ claims: ['claim one', 'claim 2'], total: 2, claimStatus: ['claim status one', 'claim status two'] })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(searchClaims).toHaveBeenCalledTimes(1)
  })

  test('returns 400 when posting a bad search request', async () => {
    const search = { xyz: 'xyz' }
    const options = {
      method: 'POST',
      url: '/api/claim/search',
      payload: { search }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    expect(searchClaims).toHaveBeenCalledTimes(0)
  })

  test('Post required payment data to get the amount', async () => {
    const data = {
      type: 'E',
      reviewTestResults: 'positive',
      typeOfLivestock: 'beef',
      piHunt: 'yes',
      piHuntAllAnimals: 'yes',
      amount: 837,
      dateOfVisit: '2025-01-21T07:24:29.224Z'
    }
    const { type, reviewTestResults, typeOfLivestock, piHunt, piHuntAllAnimals, amount, dateOfVisit } = data
    const options = {
      method: 'POST',
      url: '/api/claim/get-amount',
      payload: { type, reviewTestResults, typeOfLivestock, piHunt, piHuntAllAnimals, dateOfVisit }
    }

    getAmount.mockReturnValue(amount)

    const res = await server.inject(options)
    expect(res.statusCode).toBe(200)
    expect(Number(res.payload)).toBe(amount)
  })

  test('Post wrong payment data to elicit a 400 response', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim/get-amount',
      payload: { type: 'E' }
    }

    getAmount.mockReturnValue(100)

    const res = await server.inject(options)
    expect(res.statusCode).toBe(400)
  })

  test('should create a new herd and link it to the claim', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim,
        ...{
          data: {
            ...claim.data,
            dateOfVisit: '2025-05-01T00:00:00.000Z',
            dateOfTesting: '2025-05-01T00:00:00.000Z',
            herd: {
              herdId: 'TEMP-ID',
              herdName: 'Sample herd one',
              cph: '43231',
              herdReasons: ['separateManagementNeeds', 'differentBreed'],
              herdVersion: 1
            }
          }
        }
      }
    }
    isMultipleHerdsUserJourney.mockImplementation(() => { return true })
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2025-05-01T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2025-05-01T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    createHerd.mockResolvedValueOnce({
      dataValues: {
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'AHWR-0AD3-3322',
        species: 'pigs',
        version: 1,
        herdName: 'Sample herd one',
        cph: '43231',
        herdReasons: ['differentBreed', 'separateManagementNeeds'],
        createdBy: 'admin'
      }
    })
    setClaim.mockResolvedValueOnce({
      dataValues: {
        reference: claim.reference,
        applicationReference: claim.applicationReference
      }
    })

    await server.inject(options)

    expect(setClaim).toHaveBeenCalledWith({
      applicationReference: 'AHWR-0AD3-3322',
      createdBy: 'admin',
      data: {
        amount: 100,
        claimType: 'R',
        dateOfTesting: '2025-05-01T00:00:00.000Z',
        dateOfVisit: '2025-05-01T00:00:00.000Z',
        herdAssociatedAt: expect.any(String),
        herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        herdVersion: 1,
        laboratoryURN: 'AK-2024',
        numberAnimalsTested: 30,
        numberOfOralFluidSamples: 5,
        speciesNumbers: 'yes',
        testResults: 'positive',
        typeOfLivestock: 'pigs',
        vetRCVSNumber: 'AK-2024',
        vetsName: 'Afshin'
      },
      reference: 'TEMP-O9UD-22F6',
      sbi: '106705779',
      statusId: 11,
      type: 'R'
    })
    expect(createHerd).toHaveBeenCalledWith({
      version: 1,
      applicationReference: 'AHWR-0AD3-3322',
      species: 'pigs',
      herdName: 'Sample herd one',
      cph: '43231',
      herdReasons: ['differentBreed', 'separateManagementNeeds'],
      createdBy: 'admin'
    })
  })

  test('should create a new version of the herd when updating a herd and the cph has changed', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim, ...{ data: { ...claim.data, herd: { herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', cph: '13232', herdReasons: ['separateManagementNeeds', 'differentBreed'], herdVersion: 2 } } } }
    }
    isMultipleHerdsUserJourney.mockImplementation(() => { return true })
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    getHerdById.mockResolvedValueOnce({
      dataValues: {
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'AHWR-0AD3-3322',
        species: 'pigs',
        version: 1,
        herdName: 'Sample herd one',
        cph: '43200',
        herdReasons: ['differentBreed', 'separateManagementNeeds'],
        isCurrent: true,
        createdBy: 'admin'
      }
    })
    createHerd.mockResolvedValueOnce({
      dataValues: {
        id: '9A9A4a26-6a25-4f5b-882e-e18587ba9f4b',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'AHWR-0AD3-3322',
        species: 'pigs',
        version: 2,
        herdName: 'Sample herd one',
        cph: '13232',
        herdReasons: ['differentBreed', 'separateManagementNeeds'],
        createdBy: 'admin'
      }
    })
    setClaim.mockResolvedValueOnce({
      dataValues: {
        reference: claim.reference,
        applicationReference: claim.applicationReference
      }
    })

    await server.inject(options)

    expect(createHerd).toHaveBeenCalledWith({
      version: 2,
      applicationReference: 'AHWR-0AD3-3322',
      herdName: 'Sample herd one',
      species: 'pigs',
      cph: '13232',
      herdReasons: ['differentBreed', 'separateManagementNeeds'],
      createdBy: 'admin'
    })
    expect(updateIsCurrentHerd).toHaveBeenCalledWith('0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', false)
    expect(setClaim).toHaveBeenCalledWith({
      applicationReference: 'AHWR-0AD3-3322',
      createdBy: 'admin',
      data: {
        amount: 100,
        claimType: 'R',
        dateOfTesting: '2024-01-22T00:00:00.000Z',
        dateOfVisit: '2024-01-22T00:00:00.000Z',
        herdAssociatedAt: expect.any(String),
        herdId: '9A9A4a26-6a25-4f5b-882e-e18587ba9f4b',
        herdVersion: 2,
        laboratoryURN: 'AK-2024',
        numberAnimalsTested: 30,
        numberOfOralFluidSamples: 5,
        speciesNumbers: 'yes',
        testResults: 'positive',
        typeOfLivestock: 'pigs',
        vetRCVSNumber: 'AK-2024',
        vetsName: 'Afshin'
      },
      reference: 'TEMP-O9UD-22F6',
      sbi: '106705779',
      statusId: 11,
      type: 'R'
    })
  })

  test('should create a new version of the herd when updating a herd and the herd reasons has changed', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim, ...{ data: { ...claim.data, herd: { herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', cph: '43200', herdReasons: ['separateManagementNeeds', 'differentBreed'], herdVersion: 2 } } } }
    }
    isMultipleHerdsUserJourney.mockImplementation(() => { return true })
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    getHerdById.mockResolvedValueOnce({
      dataValues: {
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'AHWR-0AD3-3322',
        species: 'pigs',
        version: 1,
        herdName: 'Sample herd one',
        cph: '43200',
        herdReasons: ['differentBreed'],
        createdBy: 'admin',
        isCurrent: true
      }
    })
    createHerd.mockResolvedValueOnce({
      dataValues: {
        id: '9A9A4a26-6a25-4f5b-882e-e18587ba9f4b',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'AHWR-0AD3-3322',
        species: 'pigs',
        version: 2,
        herdName: 'Sample herd one',
        cph: '43200',
        herdReasons: ['differentBreed', 'separateManagementNeeds'],
        createdBy: 'admin'
      }
    })
    setClaim.mockResolvedValueOnce({
      dataValues: {
        reference: claim.reference,
        applicationReference: claim.applicationReference
      }
    })

    await server.inject(options)

    expect(createHerd).toHaveBeenCalledWith({
      version: 2,
      applicationReference: 'AHWR-0AD3-3322',
      species: 'pigs',
      herdName: 'Sample herd one',
      cph: '43200',
      herdReasons: ['differentBreed', 'separateManagementNeeds'],
      createdBy: 'admin'
    })
    expect(updateIsCurrentHerd).toHaveBeenCalledWith('0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', false)
    expect(setClaim).toHaveBeenCalledWith({
      applicationReference: 'AHWR-0AD3-3322',
      createdBy: 'admin',
      data: {
        amount: 100,
        claimType: 'R',
        dateOfTesting: '2024-01-22T00:00:00.000Z',
        dateOfVisit: '2024-01-22T00:00:00.000Z',
        herdAssociatedAt: expect.any(String),
        herdId: '9A9A4a26-6a25-4f5b-882e-e18587ba9f4b',
        herdVersion: 2,
        laboratoryURN: 'AK-2024',
        numberAnimalsTested: 30,
        numberOfOralFluidSamples: 5,
        speciesNumbers: 'yes',
        testResults: 'positive',
        typeOfLivestock: 'pigs',
        vetRCVSNumber: 'AK-2024',
        vetsName: 'Afshin'
      },
      reference: 'TEMP-O9UD-22F6',
      sbi: '106705779',
      statusId: 11,
      type: 'R'
    })
  })

  test('should create a new version of the herd when updating a herd and the herd reasons has changed and still has the same number of reasons', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim, ...{ data: { ...claim.data, herd: { herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', cph: '43200', herdReasons: ['separateManagementNeeds', 'differentBreed'], herdVersion: 2 } } } }
    }
    isMultipleHerdsUserJourney.mockImplementation(() => { return true })
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    getHerdById.mockResolvedValueOnce({
      dataValues: {
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'AHWR-0AD3-3322',
        species: 'pigs',
        version: 1,
        herdName: 'Sample herd one',
        cph: '43200',
        herdReasons: ['anotherOne', 'differentBreed'],
        createdBy: 'admin',
        isCurrent: true
      }
    })
    createHerd.mockResolvedValueOnce({
      dataValues: {
        id: '9A9A4a26-6a25-4f5b-882e-e18587ba9f4b',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'AHWR-0AD3-3322',
        species: 'pigs',
        version: 2,
        herdName: 'Sample herd one',
        cph: '43200',
        herdReasons: ['differentBreed', 'separateManagementNeeds'],
        createdBy: 'admin'
      }
    })
    setClaim.mockResolvedValueOnce({
      dataValues: {
        reference: claim.reference,
        applicationReference: claim.applicationReference
      }
    })

    await server.inject(options)

    expect(createHerd).toHaveBeenCalledWith({
      version: 2,
      applicationReference: 'AHWR-0AD3-3322',
      species: 'pigs',
      herdName: 'Sample herd one',
      cph: '43200',
      herdReasons: ['differentBreed', 'separateManagementNeeds'],
      createdBy: 'admin'
    })
    expect(updateIsCurrentHerd).toHaveBeenCalledWith('0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', false)
    expect(setClaim).toHaveBeenCalledWith({
      applicationReference: 'AHWR-0AD3-3322',
      createdBy: 'admin',
      data: {
        amount: 100,
        claimType: 'R',
        dateOfTesting: '2024-01-22T00:00:00.000Z',
        dateOfVisit: '2024-01-22T00:00:00.000Z',
        herdAssociatedAt: expect.any(String),
        herdId: '9A9A4a26-6a25-4f5b-882e-e18587ba9f4b',
        herdVersion: 2,
        laboratoryURN: 'AK-2024',
        numberAnimalsTested: 30,
        numberOfOralFluidSamples: 5,
        speciesNumbers: 'yes',
        testResults: 'positive',
        typeOfLivestock: 'pigs',
        vetRCVSNumber: 'AK-2024',
        vetsName: 'Afshin'
      },
      reference: 'TEMP-O9UD-22F6',
      sbi: '106705779',
      statusId: 11,
      type: 'R'
    })
  })

  test('should not create a new version of the herd when updating a herd and the herd data has not changed', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim, ...{ data: { ...claim.data, herd: { herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', cph: '43231', herdReasons: ['separateManagementNeeds', 'differentBreed'], herdVersion: 2 } } } }
    }
    isMultipleHerdsUserJourney.mockImplementation(() => { return true })
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    getHerdById.mockResolvedValueOnce({
      dataValues: {
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'AHWR-0AD3-3322',
        species: 'pigs',
        version: 1,
        herdName: 'Sample herd one',
        cph: '43231',
        herdReasons: ['differentBreed', 'separateManagementNeeds'],
        createdBy: 'admin',
        isCurrent: true
      }
    })
    setClaim.mockResolvedValueOnce({
      dataValues: {
        reference: claim.reference,
        applicationReference: claim.applicationReference
      }
    })

    await server.inject(options)

    expect(createHerd).not.toHaveBeenCalled()
    expect(updateIsCurrentHerd).not.toHaveBeenCalled()
    expect(setClaim).toHaveBeenCalledWith({
      applicationReference: 'AHWR-0AD3-3322',
      createdBy: 'admin',
      data: {
        amount: 100,
        claimType: 'R',
        dateOfTesting: '2024-01-22T00:00:00.000Z',
        dateOfVisit: '2024-01-22T00:00:00.000Z',
        herdAssociatedAt: expect.any(String),
        herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        herdVersion: 1,
        laboratoryURN: 'AK-2024',
        numberAnimalsTested: 30,
        numberOfOralFluidSamples: 5,
        speciesNumbers: 'yes',
        testResults: 'positive',
        typeOfLivestock: 'pigs',
        vetRCVSNumber: 'AK-2024',
        vetsName: 'Afshin'
      },
      reference: 'TEMP-O9UD-22F6',
      sbi: '106705779',
      statusId: 11,
      type: 'R'
    })
  })

  test('should return 500 when updating a herd and the herd does not exist', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim, ...{ data: { ...claim.data, herd: { herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', cph: '43231', herdReasons: ['separateManagementNeeds', 'differentBreed'], herdVersion: 2 } } } }
    }
    isMultipleHerdsUserJourney.mockImplementation(() => { return true })
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    getHerdById.mockResolvedValueOnce(null)

    await server.inject(options)

    expect(createHerd).not.toHaveBeenCalled()
    expect(updateIsCurrentHerd).not.toHaveBeenCalled()
    expect(setClaim).not.toHaveBeenCalled()
  })

  test('should return 500 when updating a herd and the herd version already exists', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim, ...{ data: { ...claim.data, herd: { herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', cph: '43232', herdReasons: ['separateManagementNeeds', 'differentBreed'], herdVersion: 2 } } } }
    }
    isMultipleHerdsUserJourney.mockImplementation(() => { return true })
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    getHerdById.mockResolvedValueOnce({
      dataValues: {
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'AHWR-0AD3-3322',
        species: 'pigs',
        version: 2,
        herdName: 'Sample herd one',
        cph: '43231',
        herdReasons: ['differentBreed', 'separateManagementNeeds'],
        createdBy: 'admin',
        isCurrent: true
      }
    })
    await server.inject(options)

    expect(createHerd).not.toHaveBeenCalled()
    expect(updateIsCurrentHerd).not.toHaveBeenCalled()
    expect(setClaim).not.toHaveBeenCalled()
  })

  test('should return 500 when updating a herd that is not the current latest herd', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim, ...{ data: { ...claim.data, herd: { herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', cph: '43231', herdReasons: ['separateManagementNeeds', 'differentBreed'], herdVersion: 3 } } } }
    }
    isMultipleHerdsUserJourney.mockImplementation(() => { return true })
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    getHerdById.mockResolvedValueOnce({
      dataValues: {
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        createdAt: '2024-02-14T09:59:46.756Z',
        applicationReference: 'AHWR-0AD3-3322',
        species: 'pigs',
        version: 1,
        herdName: 'Sample herd one',
        cph: '43231',
        herdReasons: ['differentBreed', 'separateManagementNeeds'],
        createdBy: 'admin',
        isCurrent: false
      }
    })
    await server.inject(options)

    expect(createHerd).not.toHaveBeenCalled()
    expect(updateIsCurrentHerd).not.toHaveBeenCalled()
    expect(setClaim).not.toHaveBeenCalled()
  })

  test('should return 500 when a claim was not created', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim, ...{ data: { ...claim.data, dateOfVisit: '2025-05-01T00:00:00.000Z', dateOfTesting: '2025-05-01T00:00:00.000Z', herd: { herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', cph: '43231', herdReasons: ['separateManagementNeeds', 'differentBreed'], herdVersion: 2 } } } }
    }
    isMultipleHerdsUserJourney.mockImplementation(() => { return true })
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'positive',
          typeOfReview: 'review one',
          dateOfTesting: '2024-01-22T00:00:00.000Z',
          laboratoryURN: 'AK-2024',
          vetRCVSNumber: 'AK-2024',
          speciesNumbers: 'yes',
          typeOfLivestock: 'pigs',
          numberAnimalsTested: 30,
          organisation: {
            crn: '1100014934',
            sbi: '106705779'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    setClaim.mockResolvedValueOnce(null)

    const result = await server.inject(options)

    expect(result.statusCode).toEqual(500)
    expect(createHerd).not.toHaveBeenCalled()
    expect(updateIsCurrentHerd).not.toHaveBeenCalled()
    expect(setClaim).not.toHaveBeenCalled()
  })
})

describe('PUT claim test', () => {
  beforeAll(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  beforeEach(() => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return false })
    isMultipleHerdsUserJourney.mockImplementation(() => { return false })
  })

  afterAll(async () => {
    await server.stop()
  })

  test.each([
    { statusId: 5 },
    { statusId: 9 },
    { statusId: 10 }
  ])('Update claim statusId to statusId $statusId', async ({ statusId }) => {
    const options = {
      method: 'PUT',
      url: '/api/claim/update-by-reference',
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: statusId,
        user: 'admin'
      }
    }

    getClaimByReference.mockResolvedValueOnce({
      dataValues: {
        reference: 'REBC-J9AR-KILQ',
        applicationReference: 'AHWR-KJLI-2678',
        data: {
          typeOfLivestock: 'sheep',
          claimType: 'R',
          reviewTestResults: 'positive'
        }
      }
    })
    updateClaimByReference.mockResolvedValueOnce({
      dataValues: { reference: 'REBC-J9AR-KILQ', statusId }
    })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        data: {
          organisation: {
            sbi: '106705779',
            crn: '1100014934',
            frn: '1102569649'
          }
        }
      }
    })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    if (statusId === 9) {
      expect(sendMessage).toHaveBeenCalledWith(
        {
          reference: 'REBC-J9AR-KILQ',
          sbi: '106705779',
          whichReview: 'sheep',
          isEndemics: true,
          claimType: 'R',
          reviewTestResults: 'positive',
          frn: '1102569649'
        },
        'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
    }
    expect(sendMessage).toHaveBeenCalledWith(
      {
        crn: '1100014934',
        sbi: '106705779',
        agreementReference: 'AHWR-KJLI-2678',
        claimReference: 'REBC-J9AR-KILQ',
        claimStatus: statusId,
        claimType: 'R',
        typeOfLivestock: 'sheep',
        reviewTestResults: 'positive',
        dateTime: expect.any(Date)
      },
      'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    )
  })

  test('should update claim when application does not exist', async () => {
    const options = {
      method: 'PUT',
      url: '/api/claim/update-by-reference',
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 9,
        user: 'admin',
        note: 'updating status'
      }
    }

    getClaimByReference.mockResolvedValueOnce({
      dataValues: {
        reference: 'REBC-J9AR-KILQ',
        applicationReference: 'AHWR-KJLI-2678',
        data: {
          typeOfLivestock: 'sheep',
          claimType: 'R',
          reviewTestResults: 'positive'
        }
      }
    })
    getApplication.mockResolvedValueOnce({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(updateClaimByReference).toHaveBeenCalledWith({
      reference: 'REBC-J9AR-KILQ',
      sbi: undefined,
      statusId: 9,
      updatedBy: 'admin'
    }, 'updating status', expect.any(Object))
    expect(sendMessage).toHaveBeenCalledWith(
      {
        reference: 'REBC-J9AR-KILQ',
        whichReview: 'sheep',
        isEndemics: true,
        claimType: 'R',
        reviewTestResults: 'positive'
      },
      'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'AHWR-KJLI-2678',
        claimReference: 'REBC-J9AR-KILQ',
        claimStatus: 9,
        claimType: 'R',
        typeOfLivestock: 'sheep',
        reviewTestResults: 'positive',
        dateTime: expect.any(Date)
      },
      'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    )
  })

  test('Update claim should failed when claim is not exist', async () => {
    const options = {
      method: 'PUT',
      url: '/api/claim/update-by-reference',
      payload: {
        reference: 'AHWR-0F5D-4A26',
        status: 9,
        user: 'admin'
      }
    }

    getClaimByReference.mockResolvedValueOnce({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
  })

  test('should update claim and submit payment request when piHunt is yes', async () => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
    isMultipleHerdsUserJourney.mockImplementation(() => { return false })
    const options = {
      method: 'PUT',
      url: '/api/claim/update-by-reference',
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 9,
        user: 'admin',
        note: 'updating status'
      }
    }
    getClaimByReference.mockResolvedValue({
      dataValues: {
        reference: 'REBC-J9AR-KILQ',
        applicationReference: 'AHWR-KJLI-2678',
        data: {
          typeOfLivestock: 'sheep',
          claimType: 'R',
          reviewTestResults: 'positive',
          piHunt: 'yes',
          piHuntAllAnimals: 'yes'
        }
      }
    })
    getApplication.mockResolvedValue({
      dataValues: {
        data: {
          organisation: {
            sbi: '106705779',
            crn: '1100014934',
            frn: '1102569649'
          }
        }
      }
    })
    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(updateClaimByReference).toHaveBeenCalledWith({
      reference: 'REBC-J9AR-KILQ',
      sbi: '106705779',
      statusId: 9,
      updatedBy: 'admin'
    }, 'updating status', expect.any(Object))
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'AHWR-KJLI-2678',
        claimReference: 'REBC-J9AR-KILQ',
        claimStatus: 9,
        typeOfLivestock: 'sheep',
        claimType: 'R',
        dateTime: expect.any(Date),
        sbi: '106705779',
        crn: '1100014934',
        reviewTestResults: 'positive'
      },
      'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    )
    expect(sendMessage).toHaveBeenCalledWith(
      {
        reference: 'REBC-J9AR-KILQ',
        whichReview: 'sheep',
        isEndemics: true,
        claimType: 'R',
        reviewTestResults: 'positive',
        optionalPiHuntValue: 'yesPiHunt',
        frn: '1102569649',
        sbi: '106705779'
      },
      'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
  })

  test('should update claim and submit payment request when piHunt is yes and piHuntRecommended is yes', async () => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
    isMultipleHerdsUserJourney.mockImplementation(() => { return false })
    const options = {
      method: 'PUT',
      url: '/api/claim/update-by-reference',
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 9,
        user: 'admin',
        note: 'updating status'
      }
    }
    getClaimByReference.mockResolvedValueOnce({
      dataValues: {
        reference: 'REBC-J9AR-KILQ',
        applicationReference: 'AHWR-KJLI-2678',
        data: {
          typeOfLivestock: 'beef',
          claimType: 'E',
          reviewTestResults: 'negative',
          piHunt: 'yes',
          piHuntAllAnimals: 'yes',
          piHuntRecommended: 'yes',
          testResults: 'negative'
        }
      }
    })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        data: {
          organisation: {
            sbi: '106705779',
            crn: '1100014934',
            frn: '1102569649'
          }
        }
      }
    })
    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(updateClaimByReference).toHaveBeenCalledWith({
      reference: 'REBC-J9AR-KILQ',
      sbi: '106705779',
      statusId: 9,
      updatedBy: 'admin'
    }, 'updating status', expect.any(Object))
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'AHWR-KJLI-2678',
        claimReference: 'REBC-J9AR-KILQ',
        claimStatus: 9,
        typeOfLivestock: 'beef',
        claimType: 'E',
        dateTime: expect.any(Date),
        sbi: '106705779',
        crn: '1100014934',
        piHuntRecommended: 'yes',
        piHuntAllAnimals: 'yes',
        reviewTestResults: 'negative'
      },
      'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    )
    expect(sendMessage).toHaveBeenCalledWith(
      {
        reference: 'REBC-J9AR-KILQ',
        whichReview: 'beef',
        isEndemics: true,
        claimType: 'E',
        reviewTestResults: 'negative',
        optionalPiHuntValue: 'yesPiHunt',
        frn: '1102569649',
        sbi: '106705779'
      },
      'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
  })

  test('should update claim status and send status update message when old world review test results', async () => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
    isMultipleHerdsUserJourney.mockImplementation(() => { return false })
    const options = {
      method: 'PUT',
      url: '/api/claim/update-by-reference',
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 9,
        user: 'admin',
        note: 'updating status'
      }
    }
    getClaimByReference.mockResolvedValueOnce({
      dataValues: {
        reference: 'REBC-J9AR-KILQ',
        applicationReference: 'AHWR-KJLI-2678',
        data: {
          typeOfLivestock: 'beef',
          claimType: 'E',
          vetVisitsReviewTestResults: 'negative',
          piHunt: 'yes',
          piHuntAllAnimals: 'yes',
          piHuntRecommended: 'yes',
          testResults: 'negative'
        }
      }
    })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        data: {
          organisation: {
            sbi: '106705779',
            crn: '1100014934',
            frn: '1102569649'
          }
        }
      }
    })
    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(updateClaimByReference).toHaveBeenCalledWith({
      reference: 'REBC-J9AR-KILQ',
      sbi: '106705779',
      statusId: 9,
      updatedBy: 'admin'
    }, 'updating status', expect.any(Object))
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'AHWR-KJLI-2678',
        claimReference: 'REBC-J9AR-KILQ',
        claimStatus: 9,
        typeOfLivestock: 'beef',
        claimType: 'E',
        dateTime: expect.any(Date),
        sbi: '106705779',
        crn: '1100014934',
        piHuntRecommended: 'yes',
        piHuntAllAnimals: 'yes',
        reviewTestResults: 'negative'
      },
      'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    )
    expect(sendMessage).toHaveBeenCalledWith(
      {
        reference: 'REBC-J9AR-KILQ',
        whichReview: 'beef',
        isEndemics: true,
        claimType: 'E',
        reviewTestResults: 'negative',
        optionalPiHuntValue: 'yesPiHunt',
        frn: '1102569649',
        sbi: '106705779'
      },
      'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
  })

  test('should update claim and submit payment request when optionalPiHunt is enabled and piHunt is no', async () => {
    isVisitDateAfterPIHuntAndDairyGoLive.mockImplementation(() => { return true })
    isMultipleHerdsUserJourney.mockImplementation(() => { return false })
    const options = {
      method: 'PUT',
      url: '/api/claim/update-by-reference',
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 9,
        user: 'admin',
        note: 'updating status'
      }
    }
    getClaimByReference.mockResolvedValueOnce({
      dataValues: {
        reference: 'REBC-J9AR-KILQ',
        applicationReference: 'AHWR-KJLI-2678',
        data: {
          typeOfLivestock: 'sheep',
          claimType: 'R',
          reviewTestResults: 'positive',
          piHunt: 'no',
          piHuntAllAnimals: 'no'
        }
      }
    })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        data: {
          organisation: {
            sbi: '106705779',
            crn: '1100014934',
            frn: '1102569649'
          }
        }
      }
    })
    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(updateClaimByReference).toHaveBeenCalledWith({
      reference: 'REBC-J9AR-KILQ',
      sbi: '106705779',
      statusId: 9,
      updatedBy: 'admin'
    }, 'updating status', expect.any(Object))
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'AHWR-KJLI-2678',
        claimReference: 'REBC-J9AR-KILQ',
        claimStatus: 9,
        typeOfLivestock: 'sheep',
        claimType: 'R',
        dateTime: expect.any(Date),
        sbi: '106705779',
        crn: '1100014934',
        reviewTestResults: 'positive'
      },
      'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    )
    expect(sendMessage).toHaveBeenCalledWith(
      {
        reference: 'REBC-J9AR-KILQ',
        whichReview: 'sheep',
        isEndemics: true,
        claimType: 'R',
        reviewTestResults: 'positive',
        optionalPiHuntValue: 'noPiHunt',
        frn: '1102569649',
        sbi: '106705779'
      },
      'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
  })

  test('should update claim and submit payment request when optionalPiHunt is not enabled', async () => {
    const options = {
      method: 'PUT',
      url: '/api/claim/update-by-reference',
      payload: {
        reference: 'REBC-J9AR-KILQ',
        status: 9,
        user: 'admin',
        note: 'updating status'
      }
    }
    getClaimByReference.mockResolvedValueOnce({
      dataValues: {
        reference: 'REBC-J9AR-KILQ',
        applicationReference: 'AHWR-KJLI-2678',
        data: {
          typeOfLivestock: 'sheep',
          claimType: 'R',
          reviewTestResults: 'positive',
          piHunt: 'yes',
          piHuntAllAnimals: 'yes'
        }
      }
    })
    getApplication.mockResolvedValueOnce({
      dataValues: {
        data: {
          organisation: {
            sbi: '106705779',
            crn: '1100014934',
            frn: '1102569649'
          }
        }
      }
    })
    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(updateClaimByReference).toHaveBeenCalledWith({
      reference: 'REBC-J9AR-KILQ',
      sbi: '106705779',
      statusId: 9,
      updatedBy: 'admin'
    }, 'updating status', expect.any(Object))
    expect(sendMessage).toHaveBeenCalledWith(
      {
        agreementReference: 'AHWR-KJLI-2678',
        claimReference: 'REBC-J9AR-KILQ',
        claimStatus: 9,
        typeOfLivestock: 'sheep',
        claimType: 'R',
        dateTime: expect.any(Date),
        sbi: '106705779',
        crn: '1100014934',
        reviewTestResults: 'positive'
      },
      'uk.gov.ffc.ahwr.claim.status.update', expect.any(Object), { sessionId: expect.any(String) }
    )
    expect(sendMessage).toHaveBeenCalledWith(
      {
        reference: 'REBC-J9AR-KILQ',
        whichReview: 'sheep',
        isEndemics: true,
        claimType: 'R',
        reviewTestResults: 'positive',
        frn: '1102569649',
        sbi: '106705779'
      },
      'uk.gov.ffc.ahwr.submit.payment.request', expect.any(Object), { sessionId: expect.any(String) })
  })

  test('Update claim should failed when reference is not provieded', async () => {
    const options = {
      method: 'PUT',
      url: '/api/claim/update-by-reference',
      payload: {
        status: 9,
        user: 'admin'
      }
    }
    getClaimByReference.mockResolvedValueOnce({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
  })
})
