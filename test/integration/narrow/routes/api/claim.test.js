import { server } from '../../../../../app/server'
import { getClaimByReference, getByApplicationReference, isURNNumberUnique, updateClaimByReference, searchClaims } from '../../../../../app/repositories/claim-repository'
import { getApplication } from '../../../../../app/repositories/application-repository'
import { sendMessage } from '../../../../../app/messaging/send-message'
import { claimPricesConfig } from '../../../../data/claim-prices-config'
import { getBlob } from '../../../../../app/storage/getBlob'
import { getAmount } from '../../../../../app/lib/getAmount'
import { isVisitDateAfterPIHuntAndDairyGoLive, isMultipleHerdsUserJourney } from '../../../../../app/lib/context-helper'
import { buildData } from '../../../../../app/data/index.js'
import { validateClaim } from '../../../../../app/processing/claim/validation.js'
import { generateEventsAndComms, saveClaimAndRelatedData } from '../../../../../app/processing/claim/ahwr/processor.js'

jest.mock('../../../../../app/insights')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/claim-repository')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/lib/getAmount.js')
jest.mock('../../../../../app/storage/getBlob.js')
jest.mock('../../../../../app/lib/context-helper.js')
jest.mock('../../../../../app/lib/requires-compliance-check.js')
jest.mock('../../../../../app/processing/claim/validation.js')
jest.mock('../../../../../app/processing/claim/ahwr/processor.js')

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
    getBlob.mockReturnValue(claimPricesConfig)
    getAmount.mockReturnValue(100)
    jest.spyOn(buildData.sequelize, 'transaction').mockImplementation(async (callback) => {
      return await callback()
    })
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('POST to /api/claim/', () => {
    test('Post a new claim with duplicated URN returns 400', async () => {
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
          reference: 'AHWR-0F5D-4A26',
          applicationReference: 'AHWR-0AD3-3322',
          data: {
            organisation: {
              sbi: '106705779'
            }
          },
          statusId: 1,
          type: 'E',
          createdBy: 'admin'
        }
      })
      validateClaim.mockReturnValueOnce({})

      const response = await server.inject(options)

      expect(response.statusCode).toBe(400)
      expect(response.payload).toEqual(JSON.stringify({ error: 'URN number is not unique' }))
    })

    test('Post a new claim that fails validation returns 400', async () => {
      const options = {
        method: 'POST',
        url: '/api/claim',
        payload: {
          ...claim
        }
      }
      getApplication.mockResolvedValueOnce({
        dataValues: {
          createdAt: '2024-02-14T09:59:46.756Z',
          id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
          reference: 'AHWR-0F5D-4A26',
          applicationReference: 'AHWR-0AD3-3322',
          data: {
            organisation: {
              sbi: '106705779'
            }
          },
          statusId: 1,
          type: 'E',
          createdBy: 'admin'
        }
      })
      validateClaim.mockReturnValueOnce({ error: 'Missing required field: vetsName' })

      const response = await server.inject(options)

      expect(response.statusCode).toBe(400)
      expect(response.payload).toEqual(JSON.stringify({ error: 'Missing required field: vetsName' }))
    })

    test('Post claim with non-found application reference returns 404', async () => {
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

    test('should return 500 when a claim was not created', async () => {
      const options = {
        method: 'POST',
        url: '/api/claim',
        payload: { ...claim, ...{ data: { ...claim.data, dateOfVisit: '2025-05-01T00:00:00.000Z', dateOfTesting: '2025-05-01T00:00:00.000Z', herd: { herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', cph: '43231', herdReasons: ['separateManagementNeeds', 'differentBreed'], herdVersion: 2 } } } }
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
      validateClaim.mockReturnValueOnce({})
      saveClaimAndRelatedData.mockResolvedValueOnce({})

      const result = await server.inject(options)

      expect(result.statusCode).toEqual(500)
      expect(validateClaim).toHaveBeenCalled()
      expect(saveClaimAndRelatedData).toHaveBeenCalled()
      expect(generateEventsAndComms).not.toHaveBeenCalled()
    })

    test('should return 200 when a claim was created successfully', async () => {
      const options = {
        method: 'POST',
        url: '/api/claim',
        payload: { ...claim, ...{ data: { ...claim.data, dateOfVisit: '2025-05-01T00:00:00.000Z', dateOfTesting: '2025-05-01T00:00:00.000Z', herd: { herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b', cph: '43231', herdReasons: ['separateManagementNeeds', 'differentBreed'], herdVersion: 2 } } } }
      }
      isURNNumberUnique.mockResolvedValueOnce({ isURNUnique: true })
      const application = {
        dataValues: {
          createdAt: '2024-02-14T09:59:46.756Z',
          id: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
          updatedAt: '2024-02-14T10:43:03.544Z',
          updatedBy: 'admin',
          reference: 'AHWR-0F5D-4A26',
          applicationReference: 'AHWR-0AD3-3322',
          data: {
            organisation: {
              crn: '1100014934',
              sbi: '106705779'
            }
          },
          flags: [],
          statusId: 1,
          type: 'R',
          createdBy: 'admin'
        }
      }
      getApplication.mockResolvedValueOnce(application)
      validateClaim.mockReturnValueOnce({})
      saveClaimAndRelatedData.mockResolvedValueOnce({
        claim: {
          reference: 'claim1'
        },
        isMultiHerdsClaim: true,
        herdGotUpdated: true,
        herdData: {
          id: '1234',
          version: 1
        }
      })

      const result = await server.inject(options)

      expect(result.statusCode).toEqual(200)
      expect(validateClaim).toHaveBeenCalled()
      expect(saveClaimAndRelatedData).toHaveBeenCalledWith('106705779', {
        claimReference: 'TEMP-O9UD-22F6',
        incoming: {
          applicationReference: 'AHWR-0AD3-3322',
          createdBy: 'admin',
          data: {
            dateOfTesting: expect.any(String),
            dateOfVisit: expect.any(String),
            herd: {
              cph: '43231',
              herdId: '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b',
              herdReasons: ['separateManagementNeeds', 'differentBreed'],
              herdVersion: 2
            },
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
          type: 'R'
        }
      },
      [],
      expect.anything())
      expect(generateEventsAndComms).toHaveBeenCalledWith(true, {
        reference: 'claim1'
      }, application, { id: '1234', version: 1 }, true, '0f5d4a26-6a25-4f5b-882e-e18587ba9f4b')
    })
  })

  describe('POST to /api/claim/is-urn-unique', () => {
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
  })

  describe('POST to /api/claim/search', () => {
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
  })

  describe('POST to /api/claim/get-amount', () => {
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

      getAmount.mockReturnValueOnce(amount)

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

      getAmount.mockReturnValueOnce(100)

      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
    })
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
        dateTime: expect.any(Date),
        herdName: 'Unnamed flock'
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
        dateTime: expect.any(Date),
        herdName: 'Unnamed flock'
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
        reviewTestResults: 'positive',
        herdName: 'Unnamed flock'
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
        reviewTestResults: 'negative',
        herdName: 'Unnamed herd'
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
        reviewTestResults: 'negative',
        herdName: 'Unnamed herd'
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
        reviewTestResults: 'positive',
        herdName: 'Unnamed flock'
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
        reviewTestResults: 'positive',
        herdName: 'Unnamed flock'
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

  test('should update claim when herd exists', async () => {
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
          piHuntAllAnimals: 'yes',
          piHuntRecommended: 'yes',
          testResults: 'negative'
        },
        herd: {
          id: 'a2e35593-aba9-4732-9da3-2f01ef9be888',
          cph: '22/333/4444',
          species: 'beef',
          version: 1,
          herdName: 'Commercial herd',
          createdAt: '2025-06-12T13:08:27.21397+00:00',
          createdBy: 'admin',
          isCurrent: true,
          updatedAt: null,
          updatedBy: null,
          herdReasons: [
            'differentBreed',
            'uniqueHealthNeeds'
          ],
          applicationReference: 'IAHW-Y2W3-2N2X'
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
        reviewTestResults: 'negative',
        herdName: 'Commercial herd'
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
