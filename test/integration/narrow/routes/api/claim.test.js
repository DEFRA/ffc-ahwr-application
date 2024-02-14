const claimRepository = require('../../../../../app/repositories/claim-repository')
const applicationRepository = require('../../../../../app/repositories/application-repository')

jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/claim-repository')

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
    reference: 'AHWR-E01A-65EF',
    applicationReference: 'AHWR-0AD3-3322',
    data: {
      typeOfLivestock: 'pigs',
      typeOfReview: 'review one',
      dateOfVisit: '2024-01-22T00:00:00.000Z',
      dateOfTesting: '2024-01-22T00:00:00.000Z',
      vetsName: 'Afshin',
      vetRCVSNumber: 'AK-2024',
      laboratoryURN: 'AK-2024',
      numberOfOralFluidSamples: 5,
      numberAnimalsTested: 30,
      minimumNumberAnimalsRequired: 10,
      testResults: 'positive',
      speciesNumbers: 'yes'
    },
    statusId: 11,
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

  test('Post claim and return 200', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: claim
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
          numberOfOralFluidSamples: 5,
          minimumNumberAnimalsRequired: 10
        },
        statusId: 1,
        type: 'R',
        createdBy: 'admin'
      }
    })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(claimRepository.set).toHaveBeenCalledTimes(1)
  })
  test('Post claim with wrong application reference return 404', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
        ...claim,
        reference: 'AHWR-E01A-65EF'
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
