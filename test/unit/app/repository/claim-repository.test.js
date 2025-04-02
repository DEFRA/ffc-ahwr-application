import { when, resetAllWhenMocks } from 'jest-when'
import {
  findAllClaimUpdateHistory,
  getAllClaimedClaims,
  getByApplicationReference,
  getClaimByReference,
  isURNNumberUnique,
  searchClaims,
  setClaim,
  updateClaimByReference
} from '../../../../app/repositories/claim-repository'
import { buildData } from '../../../../app/data'
import { livestockTypes } from '../../../../app/constants'
import { Op } from 'sequelize'

jest.mock('../../../../app/data', () => {
  return {
    buildData: {
      models: {
        claim: {
          findAll: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          findOne: jest.fn(),
          count: jest.fn()
        },
        application: {
          findAll: jest.fn()
        },
        claim_update_history: {
          findAll: jest.fn()
        },
        status: 'mock-status'
      }
    }
  }
})

jest.mock('../../../../app/repositories/application-repository', () => {})

const MOCK_SEND_EVENTS = jest.fn()

jest.mock('ffc-ahwr-event-publisher', () => {
  return {
    PublishEventBatch: jest.fn().mockImplementation(() => {
      return {
        sendEvents: MOCK_SEND_EVENTS
      }
    })
  }
})

describe('Claim repository test', () => {
  const env = process.env

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    resetAllWhenMocks()
    process.env = { ...env }
  })

  test('Should create claim', async () => {
    const claimDataRequest = {
      reference: 'AHWR-C2EA-C730',
      applicationReference: 'AHWR-0AD3-3322',
      data: {
        vetsName: 'vetsName',
        testResults: 'testResult',
        dateOfVisit: '2024-01-22T00:00:00.000Z'
      },
      statusId: 11,
      type: 'R',
      createdBy: 'admin',
      createdAt: new Date()
    }

    const returnedClaimData = {
      dataValues: {
        id: '5602bac6-0812-42b6-bfb0-35f7ed2fd16c',
        updatedAt: '2024-02-01T08:02:30.356Z',
        updatedBy: 'admin',
        reference: 'AHWR-5602-BAC6',
        applicationReference: 'AHWR-0AD3-3322',
        data: {
          vetsName: 'vetsName',
          dateOfVisit: '2024-01-22T00:00:00.000Z',
          testResults: 'testResult'
        },
        statusId: 11,
        type: 'R',
        createdBy: 'admin',
        createdAt: new Date()
      }
    }

    when(buildData.models.claim.create)
      .calledWith(claimDataRequest)
      .mockResolvedValue(returnedClaimData)

    await setClaim(claimDataRequest)

    expect(buildData.models.claim.create).toHaveBeenCalledTimes(1)
    expect(buildData.models.claim.create).toHaveBeenCalledWith(claimDataRequest)
  })
  test('Get all claims by application reference', async () => {
    const application = {
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
    const claims = [
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

    when(buildData.models.claim.findAll)
      .calledWith({
        where: { applicationReference: application.reference.toUpperCase() },
        include: [
          {
            model: buildData.models.status,
            attributes: ['status']
          }
        ],
        order: [['createdAt', 'DESC']]
      })
      .mockResolvedValue(claims)

    const result = await getByApplicationReference(
      application.reference, undefined
    )

    expect(buildData.models.claim.findAll).toHaveBeenCalledTimes(1)
    expect(claims).toEqual(result)
  })
  test('Get all claims by application reference when a query string is passed to the function', async () => {
    const application = {
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

    buildData.models.claim.findAll.mockResolvedValueOnce([])

    const result = await getByApplicationReference(
      application.reference, livestockTypes.beef
    )

    expect(buildData.models.claim.findAll).toHaveBeenCalledWith({
      include: [{
        attributes: ['status'],
        model: 'mock-status'
      }],
      order: [['createdAt', 'DESC']],
      where: {
        applicationReference: 'AHWR-0AD3-3322',
        'data.typeOfLivestock': livestockTypes.beef
      }
    })
    expect(result).toEqual([])
  })
  test('Get claim by reference', async () => {
    const claim = {
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
    }

    when(buildData.models.claim.findOne)
      .calledWith({
        where: { reference: claim.reference.toUpperCase() },
        include: [
          {
            model: buildData.models.status,
            attributes: ['status']
          }
        ]
      })
      .mockResolvedValue(claim)

    const result = await getClaimByReference(claim.reference)

    expect(buildData.models.claim.findOne).toHaveBeenCalledTimes(1)
    expect(claim).toEqual(result)
  })
  test('Update claim by reference', async () => {
    const claim = {
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
      updatedAt: new Date(),
      createdBy: 'admin',
      updatedBy: null,
      status: {
        status: 'ON HOLD'
      }
    }

    when(buildData.models.claim.update).mockResolvedValue([0, [{ dataValues: claim }]])

    const note = 'note'
    const logger = { setBindings: jest.fn() }
    await updateClaimByReference(claim, note, logger)

    expect(buildData.models.claim.update).toHaveBeenCalledTimes(1)
  })
  test('Get all claimed claims', async () => {
    const claim = {
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
    }
    when(buildData.models.claim.count).mockResolvedValue(1)

    const result = await getAllClaimedClaims(claim)

    expect(buildData.models.claim.count).toHaveBeenCalledTimes(1)
    expect(result).toEqual(1)
  })

  test.each([
    { urnNumber: '123456', applications: [], claims: [], response: { isURNUnique: true } },

    { urnNumber: '123456', applications: [{ dataValues: { data: { urnResult: '123456' } } }], claims: [], response: { isURNUnique: false } },
    { urnNumber: '123456', applications: [{ dataValues: { data: { urnResult: '654321' } } }], claims: [], response: { isURNUnique: true } },
    { urnNumber: 'urn123', applications: [{ dataValues: { data: { urnResult: 'urn123' } } }], claims: [], response: { isURNUnique: false } },
    { urnNumber: 'URN123', applications: [{ dataValues: { data: { urnResult: 'urn123' } } }], claims: [], response: { isURNUnique: false } },
    { urnNumber: 'urn123', applications: [{ dataValues: { data: { urnResult: 'URN123' } } }], claims: [], response: { isURNUnique: false } },
    { urnNumber: 'urn123', applications: [{ dataValues: { data: { urnResult: 'URN1234' } } }], claims: [], response: { isURNUnique: true } },

    { urnNumber: '123456', applications: [], claims: [{ dataValues: { data: { laboratoryURN: '123456' } } }], response: { isURNUnique: false } },
    { urnNumber: '123456', applications: [], claims: [{ dataValues: { data: { laboratoryURN: '654321' } } }], response: { isURNUnique: true } },
    { urnNumber: 'urn123', applications: [], claims: [{ dataValues: { data: { laboratoryURN: 'urn123' } } }], response: { isURNUnique: false } },
    { urnNumber: 'URN123', applications: [], claims: [{ dataValues: { data: { laboratoryURN: 'urn123' } } }], response: { isURNUnique: false } },
    { urnNumber: 'urn123', applications: [], claims: [{ dataValues: { data: { laboratoryURN: 'URN123' } } }], response: { isURNUnique: false } },
    { urnNumber: 'urn123', applications: [], claims: [{ dataValues: { data: { laboratoryURN: 'URN1234' } } }], response: { isURNUnique: true } }
  ])('check if URN is unique for all previous claims made by same SBI', async ({ urnNumber, applications, claims, response }) => {
    when(buildData.models.application.findAll).mockResolvedValue(applications)
    when(buildData.models.claim.findAll).mockResolvedValue(claims)

    const result = await isURNNumberUnique('sbi', urnNumber)

    expect(result).toEqual(response)
  })

  describe('updateByReference function', () => {
    const mockData = {
      reference: 'REF-UPDATE',
      statusId: 2,
      updatedBy: 'admin',
      data: {
        organisation: {
          sbi: '123456789',
          email: 'business@email.com'
        }
      }
    }

    test('should update an application by reference successfully', async () => {
      const updateResult = [
        1,
        [{ dataValues: { ...mockData, updatedAt: new Date(), updatedBy: 'admin' } }]
      ]

      buildData.models.claim.update.mockResolvedValue(updateResult)
      MOCK_SEND_EVENTS.mockResolvedValue(null)

      const note = null
      const logger = { setBindings: jest.fn() }
      await updateClaimByReference(mockData, note, logger)

      expect(buildData.models.claim.update).toHaveBeenCalledWith(mockData, {
        where: { reference: mockData.reference },
        returning: true
      })
      expect(MOCK_SEND_EVENTS).toHaveBeenCalledTimes(1)
    })

    test('should handle failure to update an application by reference', async () => {
      buildData.models.claim.update.mockRejectedValueOnce('Update failed')
      const logger = { setBindings: jest.fn() }
      const note = null
      await expect(updateClaimByReference(mockData, note, logger)).rejects.toBe('Update failed')
      expect(MOCK_SEND_EVENTS).not.toHaveBeenCalled()
    })
  })

  describe('updateByReference', () => {
    test('Update record for data by reference - record updated', async () => {
      process.env.APPINSIGHTS_CLOUDROLE = 'cloud_role'
      const mockNow = new Date()
      const reference = 'AHWR-7C72-8871'
      when(buildData.models.claim.update)
        .calledWith(
          {
            reference,
            statusId: 3,
            updatedBy: 'admin'
          },
          {
            where: {
              reference
            },
            returning: true
          })
        .mockResolvedValue([
          1,
          [
            {
              dataValues: {
                id: '180c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
                reference,
                statusId: 3,
                data: {
                  organisation: {
                    sbi: 'none',
                    email: 'business@email.com'
                  }
                },
                updatedBy: 'admin',
                updatedAt: mockNow
              }
            }
          ]
        ])

      const note = 'admin override'
      const logger = { setBindings: jest.fn() }
      await updateClaimByReference({
        reference,
        statusId: 3,
        updatedBy: 'admin'
      }, note, logger)

      expect(buildData.models.claim.update).toHaveBeenCalledTimes(1)
      expect(buildData.models.claim.update).toHaveBeenCalledWith(
        {
          reference,
          statusId: 3,
          updatedBy: 'admin'
        },
        {
          where: {
            reference
          },
          returning: true
        }
      )
      expect(MOCK_SEND_EVENTS).toHaveBeenCalledTimes(1)
      expect(MOCK_SEND_EVENTS).toHaveBeenNthCalledWith(1, [{
        name: 'application-status-event',
        properties: {
          id: '180c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
          sbi: 'none',
          cph: 'n/a',
          checkpoint: 'cloud_role',
          status: 'success',
          action: {
            type: 'status-updated',
            message: 'Claim has been updated',
            data: {
              reference,
              statusId: 3,
              note
            },
            raisedBy: 'admin',
            raisedOn: mockNow.toISOString()
          }
        }
      }, {
        name: 'send-session-event',
        properties: {
          id: '180c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
          sbi: 'none',
          cph: 'n/a',
          checkpoint: 'cloud_role',
          status: 'success',
          action: {
            type: 'application:status-updated:3',
            message: 'Claim has been updated',
            data: {
              reference,
              statusId: 3
            },
            raisedBy: 'admin',
            raisedOn: mockNow.toISOString()
          }
        }
      }])
    })

    test('Update status of a claim which is holding same status', async () => {
      const reference = 'AHWR-7C72-8871'

      when(buildData.models.claim.findOne)
        .calledWith({
          where: {
            reference
          },
          returning: true
        })
        .mockResolvedValue([
          1,
          [{ dataValues: { statusId: 3, updatedAt: new Date() } }]
        ])

      const note = null
      const logger = { setBindings: jest.fn() }
      await updateClaimByReference({
        reference,
        statusId: 3,
        updatedBy: 'admin'
      }, note, logger)

      expect(buildData.models.claim.findOne).toHaveBeenCalledTimes(1)
    })

    test('Update record for data by reference - throw exception', async () => {
      process.env.APPINSIGHTS_CLOUDROLE = 'cloud_role'
      const reference = 'AHWR-7C72-8871'

      when(buildData.models.claim.update)
        .calledWith(
          {
            reference,
            statusId: 3,
            updatedBy: 'admin'
          },
          {
            where: {
              reference
            },
            returning: true
          })
        .mockRejectedValue('Something failed')

      const note = null
      const logger = { setBindings: jest.fn() }
      await expect(updateClaimByReference({
        reference,
        statusId: 3,
        updatedBy: 'admin'
      }, note, logger)).rejects.toBe('Something failed')
    })
  })
  describe('Search Claim', () => {
    test.each([
      { searchText: 'AHWR-7C72-8871', searchType: 'ref', sort: { field: 'claim number', direction: undefined } },
      { searchText: 'AHWR-7C72-8871', searchType: 'ref', sort: { field: 'claim number', direction: 'DESC' } },
      { searchText: '12/07/2024', searchType: 'date', sort: { field: 'claim date', direction: undefined } },
      { searchText: '12/07/2024', searchType: 'date', sort: { field: 'claim date', direction: 'DESC' } },
      { searchText: 'R', searchType: 'type', sort: { field: 'type of visit', direction: undefined } },
      { searchText: 'R', searchType: 'type', sort: { field: 'type of visit', direction: 'DESC' } },
      { searchText: 'Sheep', searchType: 'species', sort: { field: 'species', direction: undefined } },
      { searchText: 'Sheep', searchType: 'species', sort: { field: 'species', direction: 'DESC' } },
      { searchText: 'Agreed', searchType: 'status', sort: { field: 'status', direction: undefined } },
      { searchText: 'Agreed', searchType: 'status', sort: { field: 'status', direction: 'DESC' } },
      { searchText: '113494460', searchType: 'sbi', sort: { field: 'sbi', direction: undefined } },
      { searchText: '113494460', searchType: 'sbi', sort: { field: 'sbi', direction: 'DECS' } },
      { searchText: '113494460', searchType: 'sbi', sort: undefined },
      { searchText: 'AHWR-TEST-TEST', searchType: 'appRef' },
      { searchType: 'adsdf' },
      { searchText: 'dfdf', searchType: 'adsdf', sort: undefined }
    ])('Search claim by search text $searchText, search type $searchType ', async ({ searchText, searchType, sort }) => {
      const callTimes = searchType !== 'adsdf' ? 1 : 0
      when(buildData.models.claim.count).mockResolvedValue(2)
      when(buildData.models.claim.findAll).mockResolvedValue(['claims1', 'claims2'])
      const search = {
        text: searchText,
        type: searchType
      }
      const filter = searchType === 'status' ? {} : undefined
      await searchClaims(search, filter, undefined, undefined, sort)

      expect(buildData.models.claim.count).toHaveBeenCalledTimes(callTimes)
      expect(buildData.models.claim.findAll).toHaveBeenCalledTimes(callTimes)
    })
  })

  test('adds filter to query', async () => {
    const search = {
      text: 'ON HOLD',
      type: 'status'
    }
    const filter = {
      field: 'updatedAt',
      op: 'lte',
      value: '2025-01-16'
    }
    const offset = 20
    const limit = 50
    await searchClaims(search, filter, offset, limit)

    const expected = {
      include: [{
        attributes: ['data'],
        model: {
          findAll: expect.any(Function)
        }
      }, {
        attributes: ['status'],
        model: 'mock-status',
        where: {
          status: {
            [Op.iLike]: '%ON HOLD%'
          }
        }
      }],
      offset,
      limit,
      order: [
        ['createdAt', 'DESC']
      ],
      where: {
        updatedAt: {
          [Op.lte]: '2025-01-16'
        }
      }
    }

    expect(buildData.models.claim.findAll.mock.calls).toEqual([
      [expected]
    ])
  })

  test('findAllClaimUpdateHistory calls through to findAll', async () => {
    const aClaimHistory = [{ reference: 'some-claim', applicationReference: 'some-app', updatedProperty: 'vetsName', newValue: 'Ken', oldValue: 'Tim' }]
    when(buildData.models.claim_update_history.findAll).mockResolvedValue(aClaimHistory)

    const result = await findAllClaimUpdateHistory('some-claim')

    expect(buildData.models.claim_update_history.findAll).toHaveBeenCalledWith({
      where: { reference: 'some-claim' }
    })
    expect(result).toEqual(aClaimHistory)
  })
})
