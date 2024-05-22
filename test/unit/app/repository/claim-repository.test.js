const { when, resetAllWhenMocks } = require('jest-when')
const repository = require('../../../../app/repositories/claim-repository')
const data = require('../../../../app/data')

jest.mock('../../../../app/data')

data.models.claim.create = jest.fn()
data.models.claim.findAll = jest.fn()
data.models.claim.findOne = jest.fn()
data.models.status = jest.fn()

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

    when(data.models.claim.create)
      .calledWith(claimDataRequest)
      .mockResolvedValue(returnedClaimData)

    await repository.set(claimDataRequest)

    expect(data.models.claim.create).toHaveBeenCalledTimes(1)
    expect(data.models.claim.create).toHaveBeenCalledWith(claimDataRequest)
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

    when(data.models.claim.findAll)
      .calledWith({
        where: { applicationReference: application.reference.toUpperCase() },
        include: [
          {
            model: data.models.status,
            attributes: ['status']
          }
        ],
        order: [['createdAt', 'DESC']]
      })
      .mockResolvedValue(claims)

    const result = await repository.getByApplicationReference(
      application.reference
    )

    expect(data.models.claim.findAll).toHaveBeenCalledTimes(1)
    expect(claims).toEqual(result)
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

    when(data.models.claim.findOne)
      .calledWith({
        where: { reference: claim.reference.toUpperCase() },
        include: [
          {
            model: data.models.status,
            attributes: ['status']
          }
        ]
      })
      .mockResolvedValue(claim)

    const result = await repository.getByReference(claim.reference)

    expect(data.models.claim.findOne).toHaveBeenCalledTimes(1)
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
      updatedAt: '2024-02-01T08:02:30.356Z',
      createdBy: 'admin',
      updatedBy: null,
      status: {
        status: 'ON HOLD'
      }
    }

    when(data.models.claim.update).mockResolvedValue(claim)

    const result = await repository.updateByReference(claim)

    expect(data.models.claim.update).toHaveBeenCalledTimes(1)
    expect(claim).toEqual(result)
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
    when(data.models.claim.count).mockResolvedValue(1)

    const result = await repository.getAllClaimedClaims(claim)

    expect(data.models.claim.count).toHaveBeenCalledTimes(1)
    expect(result).toEqual(1)
  })
  test.each([
    { applications: undefined, response: { isURNUnique: true } },
    { applications: [{ dataValues: { data: { urnResult: '12345566' } } }], response: { isURNUnique: false } },
    { applications: [{ dataValues: { data: { urnResult: '123455663434' }, reference: '123456' } }], response: { isURNUnique: false } }
  ])('check if URN number is unique', async ({ applications, response }) => {
    when(data.models.application.findAll).mockResolvedValue(applications)
    when(data.models.claim.findAll).mockResolvedValue(['claim 1', 'claim 2'])

    const result = await repository.isURNNumberUnique('106785889', '12345566')

    expect(data.models.application.findAll).toHaveBeenCalledTimes(1)
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
      const updateResult = [1, [{ dataValues: { ...mockData, updatedAt: new Date(), updatedBy: 'admin' } }]] // Simulate one record updated

      data.models.claim.update.mockResolvedValue(updateResult)
      MOCK_SEND_EVENTS.mockResolvedValue(null)

      const result = await repository.updateByReference(mockData)

      expect(data.models.claim.update).toHaveBeenCalledWith(mockData, {
        where: { reference: mockData.reference },
        returning: true
      })
      expect(MOCK_SEND_EVENTS).toHaveBeenCalledTimes(1)
      expect(result).toEqual(updateResult)
    })

    test('should handle failure to update an application by reference', async () => {
      data.models.claim.update.mockRejectedValue(new Error('Update failed'))

      await expect(repository.updateByReference(mockData)).rejects.toThrow('Update failed')
      expect(MOCK_SEND_EVENTS).not.toHaveBeenCalled()
    })
  })

  describe('updateByReference', () => {
    test('Update record for data by reference - 2 records updated', async () => {
      process.env.APPINSIGHTS_CLOUDROLE = 'cloud_role'
      const mockNow = new Date()
      const reference = 'AHWR-7C72-8871'

      when(data.models.claim.update)
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
          2,
          [
            {
              dataValues: {
                id: '180c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
                reference: 'AHWR-7C72-8871',
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
            },
            {
              dataValues: {
                id: '180c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
                reference: 'AHWR-7C72-8872',
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

      await repository.updateByReference({
        reference,
        statusId: 3,
        updatedBy: 'admin'
      })

      expect(data.models.claim.update).toHaveBeenCalledTimes(1)
      expect(data.models.claim.update).toHaveBeenCalledWith(
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
      expect(MOCK_SEND_EVENTS).toHaveBeenCalledTimes(2)
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
              reference: 'AHWR-7C72-8871',
              statusId: 3
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
              reference: 'AHWR-7C72-8871',
              statusId: 3
            },
            raisedBy: 'admin',
            raisedOn: mockNow.toISOString()
          }
        }
      }])
      expect(MOCK_SEND_EVENTS).toHaveBeenNthCalledWith(2, [
        {
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
                reference: 'AHWR-7C72-8872',
                statusId: 3
              },
              raisedBy: 'admin',
              raisedOn: mockNow.toISOString()
            }
          }
        },
        {
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
                reference: 'AHWR-7C72-8872',
                statusId: 3
              },
              raisedBy: 'admin',
              raisedOn: mockNow.toISOString()
            }
          }
        }
      ])
    })

    test('Update record for data by reference - 0 records updated', async () => {
      process.env.APPINSIGHTS_CLOUDROLE = 'cloud_role'
      const reference = 'AHWR-7C72-8871'

      when(data.models.claim.update)
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
          0,
          []
        ])

      await repository.updateByReference({
        reference,
        statusId: 3,
        updatedBy: 'admin'
      })

      expect(data.models.claim.update).toHaveBeenCalledTimes(1)
      expect(data.models.claim.update).toHaveBeenCalledWith(
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
      expect(MOCK_SEND_EVENTS).toHaveBeenCalledTimes(0)
    })

    test('Update record for data by reference - throw exception', async () => {
      process.env.APPINSIGHTS_CLOUDROLE = 'cloud_role'
      const reference = 'AHWR-7C72-8871'

      when(data.models.claim.update)
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
        .mockResolvedValue(new Error('Something failed'))

      await repository.updateByReference({
        reference,
        statusId: 3,
        updatedBy: 'admin'
      })

      expect(data.models.claim.update).toHaveBeenCalledTimes(1)
      expect(data.models.claim.update).toHaveBeenCalledWith(
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
      expect(MOCK_SEND_EVENTS).toHaveBeenCalledTimes(0)
    })
  })
})
