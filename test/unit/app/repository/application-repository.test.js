import { when, resetAllWhenMocks } from 'jest-when'
import {
  evalSortField, findApplication,
  getAllApplications,
  getApplication,
  getApplicationsBySbi,
  getApplicationsToRedactOlderThan,
  getByEmail,
  getBySbi,
  getLatestApplicationsBySbi,
  getOWApplicationsToRedactLastUpdatedBefore,
  redactPII,
  searchApplications,
  setApplication,
  updateApplicationByReference, updateApplicationData,
  updateEligiblePiiRedaction
} from '../../../../app/repositories/application-repository'
import { buildData } from '../../../../app/data'
import { Op, Sequelize } from 'sequelize'
import { claimDataUpdateEvent } from '../../../../app/event-publisher/claim-data-update-event.js'
import { SEND_SESSION_EVENT } from '../../../../app/event-publisher'

const { models } = buildData

jest.mock('../../../../app/data')
jest.mock('../../../../app/event-publisher/claim-data-update-event')
jest.mock('../../../../app/repositories/flag-repository')

models.application.create = jest.fn()
models.application.update = jest.fn()
models.application.findAll = jest.fn()
models.application.count.mockReturnValue(10)
models.application.findOne = jest.fn()
models.status = jest.fn()

const MOCK_SEND_EVENTS = jest.fn()

jest.mock('ffc-ahwr-common-library', () => {
  return {
    ...jest.requireActual('ffc-ahwr-common-library'),
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

  test('Set creates record for data', async () => {
    const mockNow = new Date()
    process.env.APPINSIGHTS_CLOUDROLE = 'cloud_role'

    when(models.application.create)
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

    await setApplication({
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

    expect(models.application.create).toHaveBeenCalledTimes(1)
    expect(models.application.create).toHaveBeenCalledWith({
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
        name: SEND_SESSION_EVENT,
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

  test.each([
    { sortField: 'apply date', orderField: 'createdAt' },
    { sortField: 'sbi', orderField: 'data.organisation.sbi' },
    { sortField: 'createdAt', orderField: 'createdAt' }
  ])('searchApplications and sort by %s', async ({ sortField, orderField }) => {
    const searchText = '333333333'
    const sort = { field: sortField, direction: 'DESC' }
    await searchApplications(searchText, 'sbi', [], offset, limit, sort)

    expect(models.application.count).toHaveBeenCalledTimes(1)
    expect(models.application.findAll).toHaveBeenCalledWith({
      order: [[orderField, 'DESC']],
      limit,
      offset,
      include: [
        {
          model: models.status,
          attributes: ['status']
        },
        {
          model: models.flag,
          as: 'flags',
          attributes: ['appliesToMh'],
          where: {
            deletedBy: null
          },
          required: false
        }
      ],
      where: {
        'data.organisation.sbi': searchText
      }
    })
  })

  describe('updateApplicationByReference function', () => {
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
        [
          {
            dataValues: {
              ...mockData,
              updatedAt: new Date(),
              updatedBy: 'admin'
            }
          }
        ]
      ] // Simulate one record updated

      models.application.update.mockResolvedValue(updateResult)
      MOCK_SEND_EVENTS.mockResolvedValue(null)

      const result = await updateApplicationByReference(mockData)

      expect(models.application.update).toHaveBeenCalledWith(mockData, {
        where: { reference: mockData.reference },
        returning: true
      })
      expect(MOCK_SEND_EVENTS).toHaveBeenCalledTimes(1)
      expect(result).toEqual(updateResult)
    })
    test('should not update an application by reference that current status and prev status are same', async () => {
      models.application.findOne.mockResolvedValue({
        dataValues: { ...mockData }
      })
      MOCK_SEND_EVENTS.mockResolvedValue(null)

      const result = await updateApplicationByReference(mockData)

      expect(models.application.update).not.toHaveBeenCalled()
      expect(MOCK_SEND_EVENTS).toHaveBeenCalledTimes(0)
      expect(result).toEqual({ dataValues: { ...mockData } })
    })

    test('should handle failure to update an application by reference', async () => {
      models.application.findOne.mockResolvedValue()
      models.application.update.mockRejectedValue(new Error('Update failed'))

      await expect(updateApplicationByReference(mockData)).rejects.toThrow(
        'Update failed'
      )
      expect(MOCK_SEND_EVENTS).not.toHaveBeenCalled()
    })
  })

  describe('updateApplicationByReference', () => {
    test('Update record for data by reference - 2 records updated', async () => {
      process.env.APPINSIGHTS_CLOUDROLE = 'cloud_role'
      const mockNow = new Date()
      const reference = 'AHWR-7C72-8871'

      when(models.application.update)
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
          }
        )
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

      await updateApplicationByReference({
        reference,
        statusId: 3,
        updatedBy: 'admin'
      })

      expect(models.application.update).toHaveBeenCalledTimes(1)
      expect(models.application.update).toHaveBeenCalledWith(
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
      expect(MOCK_SEND_EVENTS).toHaveBeenNthCalledWith(1, [
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
                reference: 'AHWR-7C72-8871',
                statusId: 3
              },
              raisedBy: 'admin',
              raisedOn: mockNow.toISOString()
            }
          }
        },
        {
          name: SEND_SESSION_EVENT,
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
        }
      ])
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
          name: SEND_SESSION_EVENT,
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

      when(models.application.update)
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
          }
        )
        .mockResolvedValue([0, []])

      await updateApplicationByReference({
        reference,
        statusId: 3,
        updatedBy: 'admin'
      })

      expect(models.application.update).toHaveBeenCalledTimes(1)
      expect(models.application.update).toHaveBeenCalledWith(
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

      when(models.application.update)
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
          }
        )
        .mockResolvedValue(new Error('Something failed'))

      await updateApplicationByReference({
        reference,
        statusId: 3,
        updatedBy: 'admin'
      })

      expect(models.application.update).toHaveBeenCalledTimes(1)
      expect(models.application.update).toHaveBeenCalledWith(
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
    await getAllApplications()

    expect(models.application.findAll).toHaveBeenCalledTimes(1)
    expect(models.application.findAll).toHaveBeenCalledWith({
      order: [['createdAt', 'DESC']]
    })
  })

  describe('searchApplications', () => {
    test.each([
      { searchText: undefined, searchType: '' },
      { searchText: '', searchType: '' }
    ])(
      'searchApplications for empty search returns call findAll',
      async ({ searchText, searchType }) => {
        await searchApplications(searchText, searchType, [], offset, limit)

        expect(models.application.count).toHaveBeenCalledTimes(1)

        expect(models.application.findAll).toHaveBeenCalledWith({
          order: [['createdAt', 'DESC']],
          limit,
          offset,
          include: [
            {
              model: models.status,
              attributes: ['status']
            },
            {
              model: models.flag,
              as: 'flags',
              attributes: ['appliesToMh'],
              where: {
                deletedBy: null
              },
              required: false
            }
          ]
        })
      }
    )

    test('searchApplications for Invalid SBI  call findAll', async () => {
      const searchText = '333333333'
      await searchApplications(searchText, 'sbi', [], offset, limit)

      expect(models.application.count).toHaveBeenCalledTimes(1)
      expect(models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: models.status,
            attributes: ['status']
          },
          {
            model: models.flag,
            as: 'flags',
            attributes: ['appliesToMh'],
            where: {
              deletedBy: null
            },
            required: false
          }
        ],
        where: {
          'data.organisation.sbi': searchText
        }
      })
    })

    test('searchApplications for Invalid application reference call findAll', async () => {
      const searchText = 'AHWR-555A-FD4D'
      await searchApplications(searchText, 'ref', [], offset, limit)

      expect(models.application.count).toHaveBeenCalledTimes(1)
      expect(models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: models.status,
            attributes: ['status']
          },
          {
            model: models.flag,
            as: 'flags',
            attributes: ['appliesToMh'],
            where: {
              deletedBy: null
            },
            required: false
          }
        ],
        where: {
          reference: searchText
        }
      })

      expect(models.application.count).toHaveBeenCalledWith({
        include: [
          {
            model: models.status,
            attributes: ['status']
          },
          {
            model: models.flag,
            as: 'flags',
            attributes: ['appliesToMh'],
            where: {
              deletedBy: null
            },
            required: false
          }
        ],
        where: {
          reference: searchText
        }
      })
    })

    test('searchApplications for Status call findAll', async () => {
      const searchText = 'IN PROGRESS'
      await searchApplications(searchText, 'status')

      expect(models.application.count).toHaveBeenCalledTimes(1)
      expect(models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: models.status,
            attributes: ['status'],
            where: { status: { [Op.iLike]: '%IN PROGRESS%' } }
          },
          {
            model: models.flag,
            as: 'flags',
            attributes: ['appliesToMh'],
            where: {
              deletedBy: null
            },
            required: false
          }
        ]
      })

      expect(models.application.count).toHaveBeenCalledWith({
        include: [
          {
            model: models.status,
            attributes: ['status'],
            where: { status: { [Op.iLike]: '%IN PROGRESS%' } }
          },
          {
            model: models.flag,
            as: 'flags',
            attributes: ['appliesToMh'],
            where: {
              deletedBy: null
            },
            required: false
          }
        ]
      })
    })

    test('searchApplications for organisation calls findAll', async () => {
      const searchText = 'Test Farm'
      await searchApplications(searchText, 'organisation')

      expect(models.application.count).toHaveBeenCalledTimes(1)
      expect(models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: models.status,
            attributes: ['status']
          },
          {
            model: models.flag,
            as: 'flags',
            attributes: ['appliesToMh'],
            where: {
              deletedBy: null
            },
            required: false
          }
        ],
        where: { 'data.organisation.name': { [Op.iLike]: `%${searchText}%` } }
      })

      expect(models.application.count).toHaveBeenCalledWith({
        include: [
          {
            model: models.status,
            attributes: ['status']
          },
          {
            model: models.flag,
            as: 'flags',
            attributes: ['appliesToMh'],
            where: {
              deletedBy: null
            },
            required: false
          }
        ],
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
      {
        limit,
        offset,
        searchText: 'dodgyorganisation',
        searchType: 'organisation'
      },
      { limit, offset, searchText: '', searchType: 'organisation' }
    ])(
      'searchApplications returns empty array when no application found.',
      async ({ searchText, searchType }) => {
        models.application.count.mockReturnValue(0)
        await searchApplications(searchText, searchType, [], offset, limit)

        expect(models.application.count).toHaveBeenCalledTimes(1)
        expect(models.application.findAll).not.toHaveBeenCalledTimes(1)
      }
    )
  })
  describe('getLatestApplicationsBySbi', () => {
    test.each([
      {
        toString: () => 'no applications found',
        given: {
          sbi: 105110298,
          getFlagsForApplicationResult: undefined
        },
        when: {
          foundApplications: []
        },
        expect: {
          result: [],
          numGetFlagsForApplicationCalls: 0
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
              flags: [{ appliesToMh: false }, { appliesToMh: true }, { appliesToMh: false }],
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
              statusId: 1,
              flags: [{ appliesToMh: false }, { appliesToMh: true }, { appliesToMh: false }]
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
              flags: [],
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
              flags: [],
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
              flags: [],
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
              flags: [],
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
              flags: [],
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
              updatedBy: 'David Jones',
              flags: []
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
              updatedBy: 'David Jones',
              flags: []
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
              updatedBy: 'David Jones',
              flags: []
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
              updatedBy: 'David Jones',
              flags: []
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
              updatedBy: 'David Jones',
              flags: []
            }
          ]
        }
      }
    ])('%s', async (testCase) => {
      when(models.application.findAll)
        .calledWith({
          where: {
            'data.organisation.sbi': testCase.given.sbi
          },
          include: [
            {
              model: models.flag,
              as: 'flags',
              attributes: ['appliesToMh'],
              where: {
                deletedBy: null
              },
              required: false
            },
            {
              model: models.application_redact,
              as: 'applicationRedacts',
              attributes: ['success'],
              where: {
                success: 'Y'
              },
              required: false
            }
          ],
          order: [['createdAt', 'DESC']]
        })
        .mockResolvedValue(testCase.when.foundApplications)

      const result = await getLatestApplicationsBySbi(testCase.given.sbi)

      expect(models.application.findAll).toHaveBeenCalledTimes(1)
      expect(models.application.findAll).toHaveBeenCalledWith({
        where: {
          'data.organisation.sbi': testCase.given.sbi
        },
        include: [
          {
            model: models.flag,
            as: 'flags',
            attributes: ['appliesToMh'],
            where: {
              deletedBy: null
            },
            required: false
          },
          {
            model: models.application_redact,
            as: 'applicationRedacts',
            attributes: ['success'],
            where: {
              success: 'Y'
            },
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      })
      expect(result).toEqual(testCase.expect.result)
    })
  })

  test('getBySbi', async () => {
    const sbi = 123456789

    when(models.application.findOne)
      .calledWith({
        where: {
          'data.organisation.sbi': sbi
        },
        order: [['createdAt', 'DESC']]
      })
      .mockResolvedValue({
        application: 'MockApplication'
      })

    const result = await getBySbi(sbi)

    expect(result).toEqual({
      application: 'MockApplication'
    })

    expect(models.application.findOne).toHaveBeenCalledTimes(1)
    expect(models.application.findOne).toHaveBeenCalledWith({
      where: {
        'data.organisation.sbi': sbi
      },
      order: [['createdAt', 'DESC']]
    })
  })

  test('getApplication', async () => {
    const reference = 'AHWR-5C1C-CCCC'

    when(models.application.findOne)
      .calledWith({
        where: {
          reference: reference.toUpperCase()
        },
        include: [
          {
            model: models.status,
            attributes: ['status']
          },
          {
            model: models.flag,
            as: 'flags',
            attributes: ['appliesToMh'],
            where: {
              deletedBy: null
            },
            required: false
          },
          {
            model: models.application_redact,
            as: 'applicationRedacts',
            attributes: ['success'],
            where: {
              success: 'Y'
            },
            required: false
          }
        ]
      })
      .mockResolvedValue({
        application: 'MockApplication'
      })

    const result = await getApplication(reference)

    expect(result).toEqual({
      application: 'MockApplication'
    })

    expect(models.application.findOne).toHaveBeenCalledTimes(1)
    expect(models.application.findOne).toHaveBeenCalledWith({
      where: {
        reference
      },
      include: [
        {
          model: models.status,
          attributes: ['status']
        },
        {
          model: models.flag,
          as: 'flags',
          attributes: ['appliesToMh'],
          where: {
            deletedBy: null
          },
          required: false
        },
        {
          model: models.application_redact,
          as: 'applicationRedacts',
          attributes: ['success'],
          where: {
            success: 'Y'
          },
          required: false
        }
      ]
    })
  })

  test('getByEmail', async () => {
    const email = 'email@test.com'

    when(models.application.findOne)
      .calledWith({
        where: {
          'data.organisation.email': email.toLowerCase()
        },
        order: [['createdAt', 'DESC']]
      })
      .mockResolvedValue({
        application: 'MockApplication'
      })

    const result = await getByEmail(email)

    expect(result).toEqual({
      application: 'MockApplication'
    })

    expect(models.application.findOne).toHaveBeenCalledTimes(1)
    expect(models.application.findOne).toHaveBeenCalledWith({
      where: {
        'data.organisation.email': email
      },
      order: [['createdAt', 'DESC']]
    })
  })

  test('findApplication finds application', async () => {
    const ref = 'AHWR-OLD1-REF1'

    when(models.application.findOne)
      .calledWith({
        where: {
          reference: ref
        },
        include: [
          {
            model: models.application_redact,
            as: 'applicationRedacts',
            attributes: ['success'],
            where: {
              success: 'Y'
            },
            required: false
          }
        ]
      })
      .mockResolvedValue({
        dataValues: {
          value: 'something'
        }
      })

    const result = await findApplication(ref)

    expect(result).toEqual({
      value: 'something'
    })

    expect(models.application.findOne).toHaveBeenCalledTimes(1)
    expect(models.application.findOne).toHaveBeenCalledWith({
      where: {
        reference: ref
      },
      include: [
        {
          model: models.application_redact,
          as: 'applicationRedacts',
          attributes: ['success'],
          where: {
            success: 'Y'
          },
          required: false
        }
      ]
    })
  })

  test('findApplication finds nothing', async () => {
    const ref = 'AHWR-OLD1-REF1'

    when(models.application.findOne)
      .calledWith({
        where: {
          reference: ref
        },
        include: [
          {
            model: models.application_redact,
            as: 'applicationRedacts',
            attributes: ['success'],
            where: {
              success: 'Y'
            },
            required: false
          }
        ]
      })
      .mockResolvedValue(null)

    const result = await findApplication(ref)

    expect(result).toBeNull()

    expect(models.application.findOne).toHaveBeenCalledTimes(1)
    expect(models.application.findOne).toHaveBeenCalledWith({
      where: {
        reference: ref
      },
      include: [
        {
          model: models.application_redact,
          as: 'applicationRedacts',
          attributes: ['success'],
          where: {
            success: 'Y'
          },
          required: false
        }
      ]
    })
  })

  describe('updateApplicationData', () => {
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

    test('should update application data successfully', async () => {
      const updateResult = [
        1,
        [
          {
            dataValues: {
              ...mockData,
              updatedAt: new Date(),
              updatedBy: 'admin'
            }
          }
        ]
      ] // Simulate one record updated

      models.application.update.mockResolvedValueOnce(updateResult)
      MOCK_SEND_EVENTS.mockResolvedValue(null)

      await updateApplicationData('REF-UPDATE', 'vetName', 'Geoff', 'Bill', 'note here', 'Admin')

      expect(models.application.update).toHaveBeenCalledWith({
        data: Sequelize.fn(
          'jsonb_set',
          Sequelize.col('data'),
          Sequelize.literal('\'{vetName}\''),
          Sequelize.literal('\'"Geoff"\'')
        )
      }, {
        where: { reference: 'REF-UPDATE' },
        returning: true
      })
      expect(models.claim_update_history.create).toHaveBeenCalledWith({
        applicationReference: 'REF-UPDATE',
        reference: 'REF-UPDATE',
        createdBy: 'Admin',
        eventType: 'application-vetName',
        updatedProperty: 'vetName',
        oldValue: 'Bill',
        newValue: 'Geoff',
        note: 'note here'
      })
      expect(claimDataUpdateEvent).toHaveBeenCalledWith({
        applicationReference: 'REF-UPDATE',
        reference: 'REF-UPDATE',
        updatedProperty: 'vetName',
        oldValue: 'Bill',
        newValue: 'Geoff',
        note: 'note here'
      }, 'application-vetName', 'Admin', expect.any(Date), '123456789')
    })
  })
})

describe('evalSortField function', () => {
  test('returns default sort when sort is null', () => {
    const result = evalSortField(null)
    expect(result).toEqual(['createdAt', 'ASC'])
  })

  test('returns default sort when sort is undefined', () => {
    const result = evalSortField(undefined)
    expect(result).toEqual(['createdAt', 'ASC'])
  })

  test('returns default sort when sort field is undefined', () => {
    const result = evalSortField({ direction: 'DESC' })
    expect(result).toEqual(['createdAt', 'DESC'])
  })

  test('returns correct sort for status field', () => {
    const result = evalSortField({ field: 'status', direction: 'DESC' })
    expect(result).toEqual([models.status, 'status', 'DESC'])
  })

  test('returns correct sort for status field when no direction is provided', () => {
    const result = evalSortField({ field: 'status' })
    expect(result).toEqual([models.status, 'status', 'ASC'])
  })

  test('returns correct sort for reference field', () => {
    const result = evalSortField({ field: 'reference', direction: 'DESC' })
    expect(result).toEqual(['reference', 'DESC'])
  })

  test('returns correct sort for reference field when no direction is provided', () => {
    const result = evalSortField({ field: 'reference' })
    expect(result).toEqual(['reference', 'ASC'])
  })

  test('returns correct sort for organisation field', () => {
    const result = evalSortField({ field: 'organisation', direction: 'DESC' })
    expect(result).toEqual(['data.organisation.name', 'DESC'])
  })

  test('returns correct sort for organisation field when no direction is provided', () => {
    const result = evalSortField({ field: 'organisation' })
    expect(result).toEqual(['data.organisation.name', 'ASC'])
  })

  test('returns correct sort when direction is not specified', () => {
    const result = evalSortField({ field: 'sbi' })
    expect(result).toEqual(['data.organisation.sbi', 'ASC'])
  })

  test('is case insensitive for field names', () => {
    const result = evalSortField({ field: 'APPLY DATE', direction: 'DESC' })
    expect(result).toEqual(['createdAt', 'DESC'])
  })

  test('returns default direction for apply date when no direction provided', () => {
    const result = evalSortField({ field: 'apply date' })
    expect(result).toEqual(['createdAt', 'ASC'])
  })

  test('returns default sort for unrecognized field', () => {
    const result = evalSortField({ field: 'unknownField', direction: 'ASC' })
    expect(result).toEqual(['createdAt', 'ASC'])
  })

  test('returns default sort for no specified field', () => {
    const result = evalSortField({})
    expect(result).toEqual(['createdAt', 'ASC'])
  })
})

describe('redactPII', () => {
  const mockLogger = {
    info: jest.fn()
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('should update fields to redacted values for agreement', async () => {
    models.application.update.mockResolvedValue([10], mockLogger)

    await redactPII('IAWR-1234', mockLogger)

    expect(models.application.update).toHaveBeenCalledWith(
      {
        data: Sequelize.fn(
          'jsonb_set',
          Sequelize.col('data'),
          Sequelize.literal('\'{organisation,name}\''),
          Sequelize.literal('\'"REDACTED_NAME"\''),
          true
        ),
        updatedBy: 'admin',
        updatedAt: Sequelize.fn('NOW')
      },
      {
        where: {
          reference: 'IAWR-1234',
          [Op.and]: Sequelize.literal('data->\'organisation\'->\'name\' IS NOT NULL')
        }
      }
    )
    expect(models.application.update).toHaveBeenCalledWith(
      {
        data: Sequelize.fn(
          'jsonb_set',
          Sequelize.col('data'),
          Sequelize.literal('\'{organisation,email}\''),
          Sequelize.literal('\'"redacted.email@example.com"\''),
          true
        ),
        updatedBy: 'admin',
        updatedAt: Sequelize.fn('NOW')
      },
      {
        where: {
          reference: 'IAWR-1234',
          [Op.and]: Sequelize.literal('data->\'organisation\'->\'email\' IS NOT NULL')
        }
      }
    )
    expect(models.application.update).toHaveBeenCalledWith(
      {
        data: Sequelize.fn(
          'jsonb_set',
          Sequelize.col('data'),
          Sequelize.literal('\'{organisation,orgEmail}\''),
          Sequelize.literal('\'"redacted.org.email@example.com"\''),
          true
        ),
        updatedBy: 'admin',
        updatedAt: Sequelize.fn('NOW')
      },
      {
        where: {
          reference: 'IAWR-1234',
          [Op.and]: Sequelize.literal('data->\'organisation\'->\'orgEmail\' IS NOT NULL')
        }
      }
    )
    expect(models.application.update).toHaveBeenCalledWith(
      {
        data: Sequelize.fn(
          'jsonb_set',
          Sequelize.col('data'),
          Sequelize.literal('\'{organisation,farmerName}\''),
          Sequelize.literal('\'"REDACTED_FARMER_NAME"\''),
          true
        ),
        updatedBy: 'admin',
        updatedAt: Sequelize.fn('NOW')
      },
      {
        where: {
          reference: 'IAWR-1234',
          [Op.and]: Sequelize.literal('data->\'organisation\'->\'farmerName\' IS NOT NULL')
        }
      }
    )
    expect(models.application.update).toHaveBeenCalledWith(
      {
        data: Sequelize.fn(
          'jsonb_set',
          Sequelize.col('data'),
          Sequelize.literal('\'{organisation,address}\''),
          Sequelize.literal('\'"REDACTED_ADDRESS"\''),
          true
        ),
        updatedBy: 'admin',
        updatedAt: Sequelize.fn('NOW')
      },
      {
        where: {
          reference: 'IAWR-1234',
          [Op.and]: Sequelize.literal('data->\'organisation\'->\'address\' IS NOT NULL')
        }
      }
    )
  })

  test('should log no updates when updating agreement with null fields', async () => {
    models.application.update.mockResolvedValue([0], mockLogger)

    await redactPII('IAWR-1234', mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith('No records updated for agreementReference: IAWR-1234')
  })
})

describe('getApplicationsToRedactOlderThan', () => {
  const mockApplication = {
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
      createdBy: 'test'
    }
  }

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(Date.UTC(2025, 7, 8)))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('returns applications that were created over three years ago when years is 3', async () => {
    const years = 3
    models.application.findAll.mockResolvedValueOnce([mockApplication])

    const applications = await getApplicationsToRedactOlderThan(years)

    expect(applications).toEqual([mockApplication])
    expect(models.application.findAll).toHaveBeenCalledWith({
      where: {
        reference: {
          [Op.notIn]: Sequelize.literal('(SELECT reference FROM application_redact)')
        },
        createdAt: {
          [Op.lt]: new Date('2022-08-08T00:00:00.000Z')
        },
        eligiblePiiRedaction: {
          [Op.eq]: true
        }
      },
      attributes: ['reference', [Sequelize.literal("data->'organisation'->>'sbi'"), 'sbi'], 'statusId'],
      order: [['createdAt', 'ASC']]
    })
  })
})

describe('getOWApplicationsToRedactOlderThan', () => {
  const mockApplication = {
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
      createdBy: 'test'
    }
  }

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(Date.UTC(2025, 7, 8)))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('returns old world applications that were last updated over seven years ago when years is 7', async () => {
    const years = 7
    models.application.findAll.mockResolvedValueOnce([mockApplication])

    const applications = await getOWApplicationsToRedactLastUpdatedBefore(years)

    expect(applications).toEqual([mockApplication])
    expect(models.application.findAll).toHaveBeenCalledWith({
      where: {
        reference: {
          [Op.notIn]: Sequelize.literal('(SELECT reference FROM application_redact)')
        },
        updatedAt: {
          [Op.lt]: new Date('2018-08-08T00:00:00.000Z')
        },
        eligiblePiiRedaction: {
          [Op.eq]: true
        },
        type: 'VV'
      },
      attributes: ['reference', [Sequelize.literal("data->'organisation'->>'sbi'"), 'sbi']],
      order: [['updatedAt', 'ASC']]
    })
  })
})

describe('updatePiiRedactionEligible', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('updates pii redaction eligible on application and creates application update history record when value has changed', async () => {
    models.application.update.mockResolvedValueOnce([3])

    await updateEligiblePiiRedaction('IAHW-5BA2-6DFD', false, 'admin', 'Investigating issue')

    expect(models.application.update).toHaveBeenCalledWith(
      { eligiblePiiRedaction: false },
      {
        where: {
          reference: 'IAHW-5BA2-6DFD',
          eligiblePiiRedaction: { [Op.ne]: false }
        },
        returning: true
      }
    )
    expect(models.application_update_history.create).toHaveBeenCalledWith({
      applicationReference: 'IAHW-5BA2-6DFD',
      note: 'Investigating issue',
      updatedProperty: 'eligiblePiiRedaction',
      newValue: false,
      oldValue: true,
      eventType: 'application-eligiblePiiRedaction',
      createdBy: 'admin'
    })
  })

  it('does not create new application update history record when the value has not changed', async () => {
    models.application.update.mockResolvedValueOnce([0])

    await updateEligiblePiiRedaction('IAHW-5BA2-6DFD', false, 'admin', 'Investigating issue')

    expect(models.application.update).toHaveBeenCalledWith(
      { eligiblePiiRedaction: false },
      {
        where: {
          reference: 'IAHW-5BA2-6DFD',
          eligiblePiiRedaction: { [Op.ne]: false }
        },
        returning: true
      }
    )
    expect(models.application_update_history.create).not.toHaveBeenCalled()
  })
})

describe('getApplicationsBySbi', () => {
  const mockSbi = '758937489'
  const mockApps = [
    { id: 1, reference: 'IAHW-G3CL-V59P', data: { organisation: { sbi: mockSbi } }, createdAt: '2024-04-05T00:00:00.000Z' },
    { id: 2, reference: 'IAHW-G3CL-V59P', data: { organisation: { sbi: mockSbi } }, createdAt: '2024-04-05T00:00:00.000Z' }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call findAll with correct params and return results', async () => {
    models.application.findAll.mockResolvedValue(mockApps)

    const result = await getApplicationsBySbi(mockSbi)

    expect(models.application.findAll).toHaveBeenCalledWith({
      where: expect.any(Object),
      order: [['createdAt', 'ASC']]
    })
    expect(result).toEqual(mockApps)
  })

  it('returns an empty array when no applications found', async () => {
    models.application.findAll.mockResolvedValue([])

    const result = await getApplicationsBySbi(mockSbi)

    expect(result).toEqual([])
  })
})
