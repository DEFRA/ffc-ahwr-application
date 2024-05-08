const claimRepository = require('../../../../../app/repositories/claim-repository')
const applicationRepository = require('../../../../../app/repositories/application-repository')
const sendMessage = require('../../../../../app/messaging/send-message')
const sendEmail = require('../../../../../app/lib/send-email')

jest.mock('../../../../../app/insights')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/claim-repository')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/lib/send-email')

const sheepTestResultsMockData = [
  { diseaseType: 'flystrike', result: 'negative' },
  { diseaseType: 'sheepScab', result: 'positive' }
]

describe('Get claims test', () => {
  const server = require('../../../../../app/server')
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

    claimRepository.getByReference.mockResolvedValue({
      dataValues: { reference: 'AHWR-5602-BAC6' }
    })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(claimRepository.getByReference).toHaveBeenCalledTimes(1)
  })
  test('When claim is not exist and return 404', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-reference/AHWR-5602-BAC6'
    }

    claimRepository.getByReference.mockResolvedValue({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
    expect(claimRepository.getByReference).toHaveBeenCalledTimes(1)
    expect(res.payload).toBe('Not Found')
  })
  test('Get claims by application reference and return 200', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-application-reference/AHWR-0AD3-3322'
    }

    claimRepository.getByApplicationReference.mockResolvedValue([
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
    ])

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(claimRepository.getByApplicationReference).toHaveBeenCalledTimes(1)
  })
  test('When application does not have any claims return 404', async () => {
    const options = {
      method: 'GET',
      url: '/api/claim/get-by-application-reference/AHWR-5602-BAC6'
    }

    claimRepository.getByApplicationReference.mockResolvedValue([])

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
    expect(claimRepository.getByApplicationReference).toHaveBeenCalledTimes(1)
    expect(res.payload).toBe('Not Found')
  })
})

describe('Post claim test', () => {
  const server = require('../../../../../app/server')
  const claim = {
    applicationReference: 'AHWR-0AD3-3322',
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
  })

  afterEach(async () => {
    await server.stop()
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

    applicationRepository.get.mockResolvedValue({
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
          amount: '£[amount]'
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

    await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(mockEmailData)

    await server.inject(options)

    expect(claimRepository.set).toHaveBeenCalledTimes(1)
    expect(sendEmail.sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining(mockEmailData))
  })

  test.each([
    { type: 'E', typeOfLivestock: 'sheep', numberAnimalsTested: 30, numberOfSamplesTested: undefined, testResults: sheepTestResultsMockData, biosecurity: undefined, sheepEndemicsPackage: 'sheepEndemicsPackage', herdVaccinationStatus: undefined, diseaseStatus: undefined },
    { type: 'E', typeOfLivestock: 'pigs', numberAnimalsTested: 30, numberOfSamplesTested: 6, testResults: undefined, biosecurity: { biosecurity: 'yes', assessmentPercentage: '10' }, sheepEndemicsPackage: undefined, herdVaccinationStatus: 'vaccinated', diseaseStatus: '1' },
    { type: 'E', typeOfLivestock: 'beef', numberAnimalsTested: 30, numberOfSamplesTested: undefined, testResults: 'positive', biosecurity: 'yes', sheepEndemicsPackage: undefined, herdVaccinationStatus: undefined, diseaseStatus: undefined }
  ])(
    'Post claim with Type: $type and Type of Livestock: $typeOfLivestock and return 200',
    async ({ type, typeOfLivestock, numberOfSamplesTested, testResults, numberAnimalsTested, biosecurity, sheepEndemicsPackage, herdVaccinationStatus, diseaseStatus }) => {
      const options = {
        method: 'POST',
        url: '/api/claim',
        payload: { ...claim, type, ...{ data: { ...claim.data, typeOfLivestock, numberOfSamplesTested, testResults, numberAnimalsTested, biosecurity, sheepEndemicsPackage, herdVaccinationStatus, diseaseStatus, numberOfOralFluidSamples: undefined, ...(typeOfLivestock === 'sheep' && { laboratoryURN: undefined }) } } }
      }

      applicationRepository.get.mockResolvedValue({
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

      await sendEmail.sendFarmerEndemicsClaimConfirmationEmail(mockEmailData)

      await server.inject(options)

      expect(claimRepository.set).toHaveBeenCalledTimes(1)
      expect(sendEmail.sendFarmerEndemicsClaimConfirmationEmail).toHaveBeenCalled()
    }
  )
  test('Post claim with wrong application reference return 400', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim,
        applicationReference: 'AHWR-E01A-65EF'
      }
    }

    applicationRepository.get.mockResolvedValue({})

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
})

describe('PUT claim test', () => {
  const server = require('../../../../../app/server')

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

    claimRepository.getByReference.mockResolvedValue({
      dataValues: { reference: 'AHWR-0F5D-4A26', data: { typeOfLivestock: 'sheep' } }
    })

    claimRepository.updateByReference.mockResolvedValue({
      dataValues: { reference: 'AHWR-0F5D-4A26', statusId }
    })

    applicationRepository.get.mockResolvedValue({
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

    claimRepository.getByReference.mockResolvedValue({})

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

    claimRepository.getByReference.mockResolvedValue({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
  })
})
