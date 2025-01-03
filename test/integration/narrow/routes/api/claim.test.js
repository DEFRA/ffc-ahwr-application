import { server } from '../../../../../app/server'
import { getClaimByReference, getByApplicationReference, isURNNumberUnique, setClaim, updateClaimByReference, searchClaims } from '../../../../../app/repositories/claim-repository'
import { getApplication } from '../../../../../app/repositories/application-repository'
import { sendMessage } from '../../../../../app/messaging/send-message'
import { sendFarmerEndemicsClaimConfirmationEmail } from '../../../../../app/lib/send-email'
import { claimPricesConfig } from '../../../../data/claim-prices-config'
import { getBlob } from '../../../../../app/storage/getBlob'
import { getAmount } from '../../../../../app/lib/getAmount'
import appInsights from 'applicationinsights'

jest.mock('../../../../../app/insights')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/claim-repository')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/lib/send-email')
jest.mock('../../../../../app/lib/getAmount')
jest.mock('../../../../../app/storage/getBlob')

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

    getClaimByReference.mockResolvedValue({
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

    getClaimByReference.mockResolvedValue({})

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

    getByApplicationReference.mockResolvedValue(data)

    const { result } = await server.inject(options)

    expect(result).toEqual(data)
  })

  test('get-by-application-reference returns empty claims array', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-application-reference/AHWR-5602-BAC6'
    }

    const data = []

    getByApplicationReference.mockResolvedValue(data)

    const { result } = await server.inject(options)

    expect(result).toEqual(data)
  })

  test('get-by-application-reference accepts a valid typeOfLivestock query string', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-application-reference/AHWR-0AD3-3322?typeOfLivestock=pigs'
    }

    const data = []

    getByApplicationReference.mockResolvedValue(data)

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
    getApplication.mockResolvedValue({
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
    getApplication.mockResolvedValue({
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
          numberAnimalsTested: 30
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    const mockEmailData = {
      reference: 'AHWR-0F5D-4A26',
      email: 'test@test-unit.com',
      amount: '£[amount]',
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
    }

    await sendFarmerEndemicsClaimConfirmationEmail(mockEmailData)

    await server.inject(options)

    expect(setClaim).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledTimes(1)
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
      getApplication.mockResolvedValue({
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
      const mockEmailData = {
        reference: 'AHWR-0F5D-4A26',
        email: 'test@test-unit.com',
        amount: '£[amount]',
        farmerName: 'farmerName',
        orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
      }

      await sendFarmerEndemicsClaimConfirmationEmail(mockEmailData)

      await server.inject(options)

      expect(setClaim).toHaveBeenCalledTimes(1)
    }
  )
  test('Post claim with Type: endemics and Type of Livestock: beef that review test result is negative and return 200', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        applicationReference: 'AHWR-0AD3-3322',
        reference: 'TEMP-3FS2-334F',
        type: 'E',
        createdBy: 'admin',
        data: {
          vetsName: 'Dave',
          biosecurity: 'yes',
          dateOfVisit: '2024-05-13T00:00:00.000Z',
          vetRCVSNumber: '7777777',
          speciesNumbers: 'yes',
          typeOfLivestock: 'beef',
          reviewTestResults: 'negative'
        }
      }
    }

    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValue({
      dataValues: {
        createdAt: '2024-02-14T09:59:46.756Z',
        id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
        updatedAt: '2024-02-14T10:43:03.544Z',
        updatedBy: 'admin',
        reference: 'AHWR-0F5D-4A26',
        applicationReference: 'AHWR-0AD3-3322',
        data: {},
        statusId: 1,
        type: 'E',
        createdBy: 'admin'
      }
    })
    const mockEmailData = {
      reference: 'AHWR-0F5D-4A26',
      email: 'test@test-unit.com',
      amount: '£[amount]',
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
    }

    await sendFarmerEndemicsClaimConfirmationEmail(mockEmailData, 'template-id-farmer-endemics-followup-complete')

    await server.inject(options)

    expect(setClaim).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalled()
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({
      reference: 'AHWR-0F5D-4A26',
      email: 'test@test-unit.com',
      amount: '£[amount]',
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
    }), 'template-id-farmer-endemics-followup-complete')
  })

  test('Post claim with wrong application reference return 400', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim,
        applicationReference: 'AHWR-E01A-65EF'
      }
    }

    getApplication.mockResolvedValue({})

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

  test('called with the correct arguments ', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim }
    }

    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValue({
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
          numberAnimalsTested: 30
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    const mockEmailData = {
      reference: 'AHWR-0F5D-4A26',
      email: 'test@test-unit.com',
      amount: '£[amount]',
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
    }

    await sendFarmerEndemicsClaimConfirmationEmail(mockEmailData)

    await server.inject(options)

    expect(setClaim).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(Object.keys(mockEmailData)).toEqual(expect.arrayContaining(['reference', 'email', 'amount', 'farmerName', 'orgData']))
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining(mockEmailData))
  })

  test('return empty when no values ', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...claim }
    }
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    const application = getApplication.mockReturnValue({})

    const mockEmailData = {
      reference: 'AHWR-0F5D-4A26',
      amount: '£[amount]',
      email: application?.dataValues?.data?.email,
      farmerName: application?.dataValues?.data?.farmerName,
      orgData: {
        orgName: application?.dataValues?.data?.organisation?.name,
        orgEmail: application?.dataValues?.data?.organisation?.orgEmail
      }
    }

    await sendFarmerEndemicsClaimConfirmationEmail(mockEmailData)

    await server.inject(options)

    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(mockEmailData.email).toBeUndefined()
    expect(mockEmailData.farmerName).toBeUndefined()
    expect(mockEmailData.orgData).toEqual(expect.objectContaining({}))
  })

  test('no email sent ', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim,
        applicationReference: 'AHWR-E01A-65EF'
      }
    }

    getApplication.mockResolvedValue({})

    const claimResponse = setClaim({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
    expect(claimResponse).toBeFalsy()

    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledTimes(0)
  })

  test('send email with values no data  ', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim
      }
    }

    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValue({
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
          numberAnimalsTested: 30
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })

    const sendEmailResult = await sendFarmerEndemicsClaimConfirmationEmail(null)
    await server.inject(options)

    expect(setClaim).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledWith(null)
    expect(sendEmailResult).toBeFalsy()
  })
  test('send email with values available ', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim
      }
    }

    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValue({
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
          numberAnimalsTested: 30
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })

    const mockEmailData = {
      reference: 'AHWR-0F5D-4A26',
      email: 'test@test-unit.com',
      amount: '£[amount]',
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
    }

    await sendFarmerEndemicsClaimConfirmationEmail(mockEmailData, 'template-id-farmer-endemics-followup-complete')

    await server.inject(options)

    expect(setClaim).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({
      reference: 'AHWR-0F5D-4A26',
      email: 'test@test-unit.com',
      amount: '£[amount]',
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
    }), 'template-id-farmer-endemics-followup-complete')
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
    getApplication.mockResolvedValue({
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
            email: 'test@test-unit.com',
            farmerName: 'farmerName',
            name: 'orgName',
            orgEmail: 'test@test-unit.org'
          }
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    setClaim.mockResolvedValueOnce({
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
          vetRCVSNumber: 'AK-2024'
        }
      }
    })
    sendFarmerEndemicsClaimConfirmationEmail.mockResolvedValue(true)

    await server.inject(options)

    expect(setClaim).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({
      reference: 'AHWR-0F5D-4A26',
      applicationReference: 'AHWR-0AD3-3322',
      email: 'test@test-unit.com',
      amount: 100,
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
    }), '183565fc-5684-40c1-a11d-85f55aff4d45')

    expectAppInsightsEventRaised(claim, 'AHWR-0F5D-4A26', 11, 'not-found')
  })

  test('sent the correct parameters to send sendFarmerEndemicsClaimConfirmationEmail when claim type is follow-up', async () => {
    const data = {
      typeOfLivestock: 'beef',
      numberAnimalsTested: undefined,
      biosecurity: 'yes',
      reviewTestResults: 'positive',
      dateOfTesting: '2024-01-22T00:00:00.000Z',
      dateOfVisit: '2024-01-22T00:00:00.000Z',
      vetsName: 'Afshin',
      vetRCVSNumber: 'AK-2024',
      speciesNumbers: 'yes',
      testResults: 'negative',
      piHunt: 'yes',
      numberOfOralFluidSamples: undefined,
      numberOfSamplesTested: undefined
    }
    const modifiedClaim = {
      ...{ ...claim, type: 'E', data: { ...claim.data, ...data } }
    }
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: { ...modifiedClaim }
    }

    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValue({
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
            email: 'test@test-unit.com',
            farmerName: 'farmerName',
            name: 'orgName',
            orgEmail: 'test@test-unit.org'
          }
        },
        statusId: 1,
        type: 'E',
        createdBy: 'admin'
      }
    })
    setClaim.mockResolvedValueOnce({
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
          vetRCVSNumber: 'AK-2024'
        }
      }
    })
    sendFarmerEndemicsClaimConfirmationEmail.mockResolvedValue(true)

    await server.inject(options)

    expect(setClaim).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({
      reference: 'AHWR-0F5D-4A26',
      applicationReference: 'AHWR-0AD3-3322',
      email: 'test@test-unit.com',
      amount: 100,
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
    }), '99dab1c1-ebdb-47dc-a208-daebca873924')

    expectAppInsightsEventRaised(modifiedClaim, 'AHWR-0F5D-4A26', 11, 'not-found')
  })

  test('no Email sent, and no appInsights even raised when claim is false', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim
      }
    }
    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValue({
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
          numberAnimalsTested: 30
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })
    setClaim.mockRejectedValueOnce(false)
    await server.inject(options)

    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledTimes(0)
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

  test('send email when claim is truthy ', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim
      }
    }

    isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
    getApplication.mockResolvedValue({
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
          numberAnimalsTested: 30
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })

    setClaim.mockResolvedValueOnce(true)

    const mockEmailData = {
      reference: 'AHWR-0F5D-4A26',
      email: 'test@test-unit.com',
      amount: '£[amount]',
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
    }

    await sendFarmerEndemicsClaimConfirmationEmail(mockEmailData)

    await server.inject(options)

    expect(setClaim).toBeTruthy()
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({
      reference: 'AHWR-0F5D-4A26',
      email: 'test@test-unit.com',
      amount: '£[amount]',
      farmerName: 'farmerName',
      orgData: { orgName: 'orgName', orgEmail: 'test@test-unit.org' }
    }))
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
  test.each([
    { search: { xyz: 'xyz' } }
  ])('returns 400 when post %p', async ({ search }) => {
    const options = {
      method: 'POST',
      url: '/api/claim/search',
      payload: { search }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
    expect(searchClaims).toHaveBeenCalledTimes(0)
  })
  test.each([
    {
      type: 'E',
      reviewTestResults: 'positive',
      typeOfLivestock: 'beef',
      piHunt: 'yes',
      piHuntAllAnimals: 'yes',
      amount: 837
    }
  ])('Post required payment data to get the amount', async ({ type, reviewTestResults, typeOfLivestock, piHunt, piHuntAllAnimals, amount }) => {
    const options = {
      method: 'POST',
      url: '/api/claim/get-amount',
      payload: { type, reviewTestResults, typeOfLivestock, piHunt, piHuntAllAnimals }
    }

    getAmount.mockReturnValue(amount)

    const res = await server.inject(options)
    expect(res.statusCode).toBe(200)
    expect(Number(res.payload)).toBe(amount)
  })
  test.each([
    {
      type: 'E'
    }
  ])('Post wrong payment data to must return bad request', async ({ type }) => {
    const options = {
      method: 'POST',
      url: '/api/claim/get-amount',
      payload: { type }
    }

    getAmount.mockReturnValue(100)

    const res = await server.inject(options)
    expect(res.statusCode).toBe(400)
  })
})

describe('PUT claim test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
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
        reference: 'AHWR-0F5D-4A26',
        status: statusId,
        user: 'admin'
      }
    }

    getClaimByReference.mockResolvedValue({
      dataValues: { reference: 'AHWR-0F5D-4A26', data: { typeOfLivestock: 'sheep' } }
    })

    updateClaimByReference.mockResolvedValue({
      dataValues: { reference: 'AHWR-0F5D-4A26', statusId }
    })

    getApplication.mockResolvedValue({
      dataValues: {
        data: {
          organisation: {
            sbi: 'sbi'
          }
        }
      }
    })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(sendMessage).toHaveBeenCalledTimes(statusId === 9 ? 1 : 0)
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

    getClaimByReference.mockResolvedValue({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
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
    getClaimByReference.mockResolvedValue({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
  })
})
