const { when, resetAllWhenMocks } = require('jest-when')
const repository = require('../../../../app/repositories/application-repository')
const data = require('../../../../app/data')
const { Op } = require('sequelize')

jest.mock('../../../../app/data')

data.models.application.create = jest.fn()
data.models.application.update = jest.fn()
data.models.application.findAll = jest.fn()
data.models.application.count.mockReturnValue(10)
data.models.application.findOne = jest.fn()
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

const limit = 10
const offset = 0

describe('Application Repository test', () => {
  const env = process.env
  const id = '7c728871-28a4-4f1d-a114-0256e1b684ed'
  const reference = 'abdcd'

  afterEach(() => {
    jest.clearAllMocks()
    process.env = { ...env }
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  test('Application Repository returns Function', () => {
    expect(repository).toBeDefined()
  })

  test('Set creates record for data', async () => {
    const mockNow = new Date()
    process.env.APPINSIGHTS_CLOUDROLE = 'cloud_role'

    when(data.models.application.create)
      .calledWith({
        id,
        reference,
        data: {
          organisation: {
            sbi: '123456789',
            email: 'business@email.com'
          }
        },
        createdBy: 'test'
      })
      .mockResolvedValue({
        dataValues: {
          id: '3da2454b-326b-44e9-9b6e-63289dd18ca7',
          reference: 'AHWR-7C72-8871',
          statusId: 1,
          data: {
            organisation: {
              sbi: '123456789',
              email: 'business@email.com'
            }
          },
          createdBy: 'test',
          createdAt: mockNow
        }
      })

    await repository.set({
      id,
      reference,
      data: {
        organisation: {
          sbi: '123456789',
          email: 'business@email.com'
        }
      },
      createdBy: 'test'
    })

    expect(data.models.application.create).toHaveBeenCalledTimes(1)
    expect(data.models.application.create).toHaveBeenCalledWith({
      id,
      reference,
      data: {
        organisation: {
          sbi: '123456789',
          email: 'business@email.com'
        }
      },
      createdBy: 'test'
    })
    expect(MOCK_SEND_EVENTS).toHaveBeenCalledTimes(1)
    expect(MOCK_SEND_EVENTS).toHaveBeenCalledWith([
      {
        name: 'application-status-event',
        properties: {
          id: '3da2454b-326b-44e9-9b6e-63289dd18ca7',
          sbi: '123456789',
          cph: 'n/a',
          checkpoint: 'cloud_role',
          status: 'success',
          action: {
            type: 'status-updated',
            message: 'New application has been created',
            data: {
              reference: 'AHWR-7C72-8871',
              statusId: 1
            },
            raisedBy: 'test',
            raisedOn: mockNow.toISOString()
          }
        }
      },
      {
        name: 'send-session-event',
        properties: {
          id: '3da2454b-326b-44e9-9b6e-63289dd18ca7',
          sbi: '123456789',
          cph: 'n/a',
          checkpoint: 'cloud_role',
          status: 'success',
          action: {
            type: 'application:status-updated:1',
            message: 'New application has been created',
            data: {
              reference: 'AHWR-7C72-8871',
              statusId: 1
            },
            raisedBy: 'test',
            raisedOn: mockNow.toISOString()
          }
        }
      }
    ])
  })

  test.each(
    [
      { sortField: 'apply date', orderField: 'createdAt' },
      { sortField: 'sbi', orderField: 'data.organisation.sbi' },
      { sortField: 'createdAt', orderField: 'createdAt' }
    ])('searchApplications and sort by %s', async ({ sortField, orderField }) => {
    const searchText = '333333333'
    const sort = { field: sortField, direction: 'DESC' }
    await repository.searchApplications(searchText, 'sbi', [], offset, limit, sort)

    expect(data.models.application.count).toHaveBeenCalledTimes(1)
    expect(data.models.application.findAll).toHaveBeenCalledWith({
      order: [[orderField, 'DESC']],
      limit,
      offset,
      include: [
        {
          model: data.models.status,
          attributes: ['status']
        }],
      where: {
        'data.organisation.sbi': searchText
      }
    })
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

      data.models.application.update.mockResolvedValue(updateResult)
      MOCK_SEND_EVENTS.mockResolvedValue(null)

      const result = await repository.updateByReference(mockData)

      expect(data.models.application.update).toHaveBeenCalledWith(mockData, {
        where: { reference: mockData.reference },
        returning: true
      })
      expect(MOCK_SEND_EVENTS).toHaveBeenCalledTimes(1)
      expect(result).toEqual(updateResult)
    })

    test('should handle failure to update an application by reference', async () => {
      data.models.application.update.mockRejectedValue(new Error('Update failed'))

      await expect(repository.updateByReference(mockData)).rejects.toThrow('Update failed')
      expect(MOCK_SEND_EVENTS).not.toHaveBeenCalled()
    })
  })

  describe('updateByReference', () => {
    test('Update record for data by reference - 2 records updated', async () => {
      process.env.APPINSIGHTS_CLOUDROLE = 'cloud_role'
      const mockNow = new Date()
      const reference = 'AHWR-7C72-8871'

      when(data.models.application.update)
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
                    sbi: '123456789',
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
                    sbi: '123456789',
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

      expect(data.models.application.update).toHaveBeenCalledTimes(1)
      expect(data.models.application.update).toHaveBeenCalledWith(
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
          sbi: '123456789',
          cph: 'n/a',
          checkpoint: 'cloud_role',
          status: 'success',
          action: {
            type: 'status-updated',
            message: 'Application has been updated',
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
          sbi: '123456789',
          cph: 'n/a',
          checkpoint: 'cloud_role',
          status: 'success',
          action: {
            type: 'application:status-updated:3',
            message: 'Application has been updated',
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
            sbi: '123456789',
            cph: 'n/a',
            checkpoint: 'cloud_role',
            status: 'success',
            action: {
              type: 'status-updated',
              message: 'Application has been updated',
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
            sbi: '123456789',
            cph: 'n/a',
            checkpoint: 'cloud_role',
            status: 'success',
            action: {
              type: 'application:status-updated:3',
              message: 'Application has been updated',
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

      when(data.models.application.update)
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

      expect(data.models.application.update).toHaveBeenCalledTimes(1)
      expect(data.models.application.update).toHaveBeenCalledWith(
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

      when(data.models.application.update)
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

      expect(data.models.application.update).toHaveBeenCalledTimes(1)
      expect(data.models.application.update).toHaveBeenCalledWith(
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

  test('getAll returns pages of 10 ordered by createdAt DESC', async () => {
    await repository.getAll()

    expect(data.models.application.findAll).toHaveBeenCalledTimes(1)
    expect(data.models.application.findAll).toHaveBeenCalledWith({
      order: [['createdAt', 'DESC']]
    })
  })

  test('getAllClaimedApplications returns a count', async () => {
    await repository.getAllClaimedApplications([5, 9, 10])

    expect(data.models.application.count).toHaveBeenCalledTimes(1)
    expect(data.models.application.count).toHaveBeenCalledWith({
      where: {
        statusId: [5, 9, 10]
      }
    })
  })

  describe('searchApplications', () => {
    test.each([
      { searchText: undefined, searchType: '' },
      { searchText: '', searchType: '' }
    ])('searchApplications for empty search returns call findAll', async ({ searchText, searchType }) => {
      await repository.searchApplications(searchText, searchType, [], offset, limit)

      expect(data.models.application.count).toHaveBeenCalledTimes(1)

      expect(data.models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: data.models.status,
            attributes: ['status']
          }]
      })
    })

    test('searchApplications for Invalid SBI  call findAll', async () => {
      const searchText = '333333333'
      await repository.searchApplications(searchText, 'sbi', [], offset, limit)

      expect(data.models.application.count).toHaveBeenCalledTimes(1)
      expect(data.models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: data.models.status,
            attributes: ['status']
          }],
        where: {
          'data.organisation.sbi': searchText
        }
      })
    })

    test('searchApplications for Invalid application reference call findAll', async () => {
      const searchText = 'AHWR-555A-FD4D'
      await repository.searchApplications(searchText, 'ref', [], offset, limit)

      expect(data.models.application.count).toHaveBeenCalledTimes(1)
      expect(data.models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: data.models.status,
            attributes: ['status']
          }],
        where: {
          reference: searchText
        }
      })

      expect(data.models.application.count).toHaveBeenCalledWith({
        include: [
          {
            model: data.models.status,
            attributes: ['status']
          }],
        where: {
          reference: searchText
        }
      })
    })

    test('searchApplications for Status call findAll', async () => {
      const searchText = 'IN PROGRESS'
      await repository.searchApplications(searchText, 'status')

      expect(data.models.application.count).toHaveBeenCalledTimes(1)
      expect(data.models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: data.models.status,
            attributes: ['status'],
            where: { status: { [Op.iLike]: '%IN PROGRESS%' } }
          }]
      })

      expect(data.models.application.count).toHaveBeenCalledWith({
        include: [
          {
            model: data.models.status,
            attributes: ['status'],
            where: { status: { [Op.iLike]: '%IN PROGRESS%' } }
          }]
      })
    })

    test('searchApplications for organisation calls findAll', async () => {
      const searchText = 'Test Farm'
      await repository.searchApplications(searchText, 'organisation')

      expect(data.models.application.count).toHaveBeenCalledTimes(1)
      expect(data.models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: data.models.status,
            attributes: ['status']
          }],
        where: { 'data.organisation.name': { [Op.iLike]: `%${searchText}%` } }
      })

      expect(data.models.application.count).toHaveBeenCalledWith({
        include: [
          {
            model: data.models.status,
            attributes: ['status']
          }],
        where: { 'data.organisation.name': { [Op.iLike]: `%${searchText}%` } }
      })
    })

    test.each([
      { limit, offset, searchText: undefined, searchType: 'sbi' },
      { limit, offset, searchText: '333333333', searchType: 'sbi' },
      { limit, offset, searchText: '', searchType: 'sbi' },
      { limit, offset, searchText: undefined, searchType: 'ref' },
      { limit, offset, searchText: '333333333', searchType: 'ref' },
      { limit, offset, searchText: '', searchType: 'ref' },
      { limit, offset, searchText: undefined, searchType: 'status' },
      { limit, offset, searchText: '333333333', searchType: 'status' },
      { limit, offset, searchText: '17/01/2023', searchType: 'date' },
      { limit, offset, searchText: '', searchType: 'status' },
      { limit, offset, searchText: 'dodgyorganisation', searchType: 'organisation' },
      { limit, offset, searchText: '', searchType: 'organisation' }
    ])('searchApplications returns empty array when no application found.', async ({ searchText, searchType }) => {
      data.models.application.count.mockReturnValue(0)
      await repository.searchApplications(searchText, searchType, [], offset, limit)

      expect(data.models.application.count).toHaveBeenCalledTimes(1)
      expect(data.models.application.findAll).not.toHaveBeenCalledTimes(1)
    })
  })
  describe('getLatestApplicationsBySbi', () => {
    test.each([
      {
        toString: () => 'no applications found',
        given: {
          sbi: 105110298
        },
        when: {
          foundApplications: []
        },
        expect: {
          result: []
        }
      },
      {
        toString: () => 'one application found',
        given: {
          sbi: 105110298
        },
        when: {
          foundApplications: [
            {
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-DD6A',
              data: {
                reference: 'string',
                declaration: true,
                offerStatus: 'accepted',
                whichReview: 'sheep',
                organisation: {
                  crn: 2222222222,
                  sbi: 111111111,
                  name: 'My Amazing Farm',
                  email: 'business@email.com',
                  address: '1 Example Road',
                  farmerName: 'Mr Farmer'
                },
                eligibleSpecies: 'yes',
                confirmCheckDetails: 'yes'
              },
              claimed: false,
              createdAt: '2023-01-17 13:55:20',
              updatedAt: '2023-01-17 13:55:20',
              createdBy: 'David Jones',
              updatedBy: 'David Jones',
              statusId: 1
            }
          ]
        },
        expect: {
          result: [
            {
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-DD6A',
              data: {
                reference: 'string',
                declaration: true,
                offerStatus: 'accepted',
                whichReview: 'sheep',
                organisation: {
                  crn: 2222222222,
                  sbi: 111111111,
                  name: 'My Amazing Farm',
                  email: 'business@email.com',
                  address: '1 Example Road',
                  farmerName: 'Mr Farmer'
                },
                eligibleSpecies: 'yes',
                confirmCheckDetails: 'yes'
              },
              claimed: false,
              createdAt: '2023-01-17 13:55:20',
              updatedAt: '2023-01-17 13:55:20',
              createdBy: 'David Jones',
              updatedBy: 'David Jones',
              statusId: 1
            }
          ]
        }
      },
      {
        toString: () => 'many application found',
        given: {
          sbi: 105110298
        },
        when: {
          foundApplications: [
            {
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-AAAA',
              data: {
                reference: 'string',
                declaration: true,
                offerStatus: 'accepted',
                whichReview: 'sheep',
                organisation: {
                  crn: 1111111111,
                  sbi: 111111111,
                  name: 'My Amazing Farm',
                  email: 'business@email.com',
                  address: '1 Example Road',
                  farmerName: 'Mr Farmer'
                },
                eligibleSpecies: 'yes',
                confirmCheckDetails: 'yes'
              },
              claimed: false,
              createdAt: '2023-01-17 14:55:20',
              updatedAt: '2023-01-17 14:55:20',
              createdBy: 'David Jones',
              updatedBy: 'David Jones',
              statusId: 1
            },
            {
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-BBBB',
              data: {
                reference: 'string',
                declaration: true,
                offerStatus: 'accepted',
                whichReview: 'sheep',
                organisation: {
                  crn: 1111111111,
                  sbi: 111111111,
                  name: 'My Amazing Farm',
                  email: 'business@email.com',
                  address: '1 Example Road',
                  farmerName: 'Mr Farmer'
                },
                eligibleSpecies: 'yes',
                confirmCheckDetails: 'yes'
              },
              claimed: false,
              createdAt: '2023-01-17 13:55:20',
              updatedAt: '2023-01-17 13:55:20',
              createdBy: 'David Jones',
              updatedBy: 'David Jones',
              statusId: 1
            },
            {
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-CCCC',
              data: {
                reference: 'string',
                declaration: true,
                offerStatus: 'accepted',
                whichReview: 'sheep',
                organisation: {
                  crn: 2222222222,
                  sbi: 222222222,
                  name: 'My Amazing Farm',
                  email: 'business@email.com',
                  address: '1 Example Road',
                  farmerName: 'Mr Farmer'
                },
                eligibleSpecies: 'yes',
                confirmCheckDetails: 'yes'
              },
              claimed: false,
              createdAt: '2023-01-17 15:55:20',
              updatedAt: '2023-01-17 13:55:20',
              createdBy: 'David Jones',
              updatedBy: 'David Jones',
              statusId: 1
            },
            {
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-DDDD',
              data: {
                reference: 'string',
                declaration: true,
                offerStatus: 'accepted',
                whichReview: 'sheep',
                organisation: {
                  crn: 2222222222,
                  sbi: 222222222,
                  name: 'My Amazing Farm',
                  email: 'business@email.com',
                  address: '1 Example Road',
                  farmerName: 'Mr Farmer'
                },
                eligibleSpecies: 'yes',
                confirmCheckDetails: 'yes'
              },
              claimed: false,
              createdAt: '2023-01-17 16:55:20',
              updatedAt: '2023-01-17 13:55:20',
              createdBy: 'David Jones',
              updatedBy: 'David Jones',
              statusId: 1
            },
            {
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-EEEE',
              data: {
                reference: 'string',
                declaration: true,
                offerStatus: 'accepted',
                whichReview: 'sheep',
                organisation: {
                  crn: 2222222222,
                  sbi: 222222222,
                  name: 'My Amazing Farm',
                  email: 'business@email.com',
                  address: '1 Example Road',
                  farmerName: 'Mr Farmer'
                },
                eligibleSpecies: 'yes',
                confirmCheckDetails: 'yes'
              },
              claimed: false,
              createdAt: '2023-01-17 13:55:20',
              updatedAt: '2023-01-17 13:55:20',
              createdBy: 'David Jones',
              updatedBy: 'David Jones',
              statusId: 1
            }
          ]
        },
        expect: {
          result: [
            {
              claimed: false,
              createdAt: '2023-01-17 14:55:20',
              createdBy: 'David Jones',
              data: {
                confirmCheckDetails: 'yes',
                declaration: true,
                eligibleSpecies: 'yes',
                offerStatus: 'accepted',
                organisation: {
                  address: '1 Example Road',
                  crn: 1111111111,
                  email: 'business@email.com',
                  farmerName: 'Mr Farmer',
                  name: 'My Amazing Farm',
                  sbi: 111111111
                },
                reference: 'string',
                whichReview: 'sheep'
              },
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-AAAA',
              statusId: 1,
              updatedAt: '2023-01-17 14:55:20',
              updatedBy: 'David Jones'
            },
            {
              claimed: false,
              createdAt: '2023-01-17 13:55:20',
              createdBy: 'David Jones',
              data: {
                confirmCheckDetails: 'yes',
                declaration: true,
                eligibleSpecies: 'yes',
                offerStatus: 'accepted',
                organisation: {
                  address: '1 Example Road',
                  crn: 1111111111,
                  email: 'business@email.com',
                  farmerName: 'Mr Farmer',
                  name: 'My Amazing Farm',
                  sbi: 111111111
                },
                reference: 'string',
                whichReview: 'sheep'
              },
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-BBBB',
              statusId: 1,
              updatedAt: '2023-01-17 13:55:20',
              updatedBy: 'David Jones'
            },
            {
              claimed: false,
              createdAt: '2023-01-17 15:55:20',
              createdBy: 'David Jones',
              data: {
                confirmCheckDetails: 'yes',
                declaration: true,
                eligibleSpecies: 'yes',
                offerStatus: 'accepted',
                organisation: {
                  address: '1 Example Road',
                  crn: 2222222222,
                  email: 'business@email.com',
                  farmerName: 'Mr Farmer',
                  name: 'My Amazing Farm',
                  sbi: 222222222
                },
                reference: 'string',
                whichReview: 'sheep'
              },
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-CCCC',
              statusId: 1,
              updatedAt: '2023-01-17 13:55:20',
              updatedBy: 'David Jones'
            },
            {
              claimed: false,
              createdAt: '2023-01-17 16:55:20',
              createdBy: 'David Jones',
              data: {
                confirmCheckDetails: 'yes',
                declaration: true,
                eligibleSpecies: 'yes',
                offerStatus: 'accepted',
                organisation: {
                  address: '1 Example Road',
                  crn: 2222222222,
                  email: 'business@email.com',
                  farmerName: 'Mr Farmer',
                  name: 'My Amazing Farm',
                  sbi: 222222222
                },
                reference: 'string',
                whichReview: 'sheep'
              },
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-DDDD',
              statusId: 1,
              updatedAt: '2023-01-17 13:55:20',
              updatedBy: 'David Jones'
            },
            {
              claimed: false,
              createdAt: '2023-01-17 13:55:20',
              createdBy: 'David Jones',
              data: {
                confirmCheckDetails: 'yes',
                declaration: true,
                eligibleSpecies: 'yes',
                offerStatus: 'accepted',
                organisation: {
                  address: '1 Example Road',
                  crn: 2222222222,
                  email: 'business@email.com',
                  farmerName: 'Mr Farmer',
                  name: 'My Amazing Farm',
                  sbi: 222222222
                },
                reference: 'string',
                whichReview: 'sheep'
              },
              id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
              reference: 'AHWR-5C1C-EEEE',
              statusId: 1,
              updatedAt: '2023-01-17 13:55:20',
              updatedBy: 'David Jones'
            }
          ]
        }
      }
    ])('%s', async (testCase) => {
      when(data.models.application.findAll)
        .calledWith({
          where: {
            'data.organisation.sbi': testCase.given.sbi
          },
          order: [['createdAt', 'DESC']],
          raw: true
        })
        .mockResolvedValue(testCase.when.foundApplications)

      const result = await repository.getLatestApplicationsBySbi(testCase.given.sbi)

      expect(data.models.application.findAll).toHaveBeenCalledTimes(1)
      expect(data.models.application.findAll).toHaveBeenCalledWith({
        where: {
          'data.organisation.sbi': testCase.given.sbi
        },
        order: [['createdAt', 'DESC']],
        raw: true
      })
      expect(result).toEqual(testCase.expect.result)
    })
  })

  test('getBySbi', async () => {
    const sbi = 123456789

    when(data.models.application.findOne)
      .calledWith({
        where: {
          'data.organisation.sbi': sbi
        },
        order: [['createdAt', 'DESC']]
      })
      .mockResolvedValue({
        application: 'MockApplication'
      })

    const result = await repository.getBySbi(sbi)

    expect(result).toEqual({
      application: 'MockApplication'
    })

    expect(data.models.application.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.application.findOne).toHaveBeenCalledWith({
      where: {
        'data.organisation.sbi': sbi
      },
      order: [['createdAt', 'DESC']]
    })
  })

  test('get', async () => {
    const reference = 'AHWR-5C1C-CCCC'

    when(data.models.application.findOne)
      .calledWith({
        where: {
          reference: reference.toUpperCase()
        },
        include: [
          {
            model: data.models.status,
            attributes: ['status']
          }
        ]
      })
      .mockResolvedValue({
        application: 'MockApplication'
      })

    const result = await repository.get(reference)

    expect(result).toEqual({
      application: 'MockApplication'
    })

    expect(data.models.application.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.application.findOne).toHaveBeenCalledWith({
      where: {
        reference
      },
      include: [
        {
          model: data.models.status,
          attributes: ['status']
        }]
    })
  })

  test('getByEmail', async () => {
    const email = 'email@test.com'

    when(data.models.application.findOne)
      .calledWith({
        where: {
          'data.organisation.email': email.toLowerCase()
        },
        order: [['createdAt', 'DESC']]
      })
      .mockResolvedValue({
        application: 'MockApplication'
      })

    const result = await repository.getByEmail(email)

    expect(result).toEqual({
      application: 'MockApplication'
    })

    expect(data.models.application.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.application.findOne).toHaveBeenCalledWith({
      where: {
        'data.organisation.email': email
      },
      order: [['createdAt', 'DESC']]
    })
  })
})
