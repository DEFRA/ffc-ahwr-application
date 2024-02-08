const claimRepository = require('../../../../../app/repositories/claim-repository')
const applicationRepository = require('../../../../../app/repositories/application-repository')

jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/claim-repository')

describe('Applications test', () => {
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
  test('Post claim and return 200', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
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
        createdBy: 'admin'
      }
    }

    applicationRepository.get.mockResolvedValue({
      dataValues: {
        id: '0ad33322-c833-40c9-8116-0a293f0850a1',
        reference: 'AHWR-0AD3-3322',
        data: {
          reference: null,
          declaration: true,
          offerStatus: 'accepted',
          whichReview: 'sheep',
          organisation: {
            sbi: '106785889',
            name: 'Mr Jack Whaling',
            email: 'johnallany@nallanhoje.com.test',
            address:
              'Elmtree Farm,Gamlingay,NORTH MILFORD GRANGE,LISKEARD,DL12 9TY,United Kingdom',
            farmerName: 'John Allan'
          },
          eligibleSpecies: 'yes',
          confirmCheckDetails: 'yes'
        },
        claimed: false,
        createdAt: '2023-12-20T15:32:59.262Z',
        updatedAt: '2023-12-20T15:32:59.359Z',
        createdBy: 'admin',
        updatedBy: null,
        statusId: 1,
        type: 'VV',
        status: {
          status: 'AGREED'
        }
      }
    })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    expect(claimRepository.set).toHaveBeenCalledTimes(1)
  })
  test('Post claim with missing createdBy key and return 400', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
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
        type: 'R'
      }
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(400)
  })
  test('Post claim with wrong application reference return 404', async () => {
    const options = {
      method: 'POST',
      url: '/api/claim',
      payload: {
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
        createdBy: 'admin'
      }
    }

    applicationRepository.get.mockResolvedValue({})

    const res = await server.inject(options)

    expect(res.statusCode).toBe(404)
  })
})
