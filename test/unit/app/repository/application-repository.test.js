const { when, resetAllWhenMocks } = require('jest-when')
const repository = require('../../../../app/repositories/application-repository')
const data = require('../../../../app/data')
jest.mock('../../../../app/data')

data.models.application.create = jest.fn()
data.models.application.update = jest.fn()
data.models.application.findAll = jest.fn()
data.models.application.count.mockReturnValue(10)
data.models.application.findOne = jest.fn()
data.models.status = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  resetAllWhenMocks()
})
const limit = 10
const offset = 0
describe('Application Repository test', () => {
  const id = 1
  const reference = 'abdcd'

  test('Application Repository returns Function', () => {
    expect(repository).toBeDefined()
  })

  test('Set creates record for data', async () => {
    await repository.set({ id, reference })

    expect(data.models.application.create).toHaveBeenCalledTimes(1)
    expect(data.models.application.create).toHaveBeenCalledWith({ id, reference })
  })

  test('Update record for data by reference', async () => {
    await repository.updateByReference({ id: 1, reference })

    expect(data.models.application.update).toHaveBeenCalledTimes(1)
    expect(data.models.application.update).toHaveBeenCalledWith({ id, reference }, { where: { reference } })
  })

  test('Update record for data by id', async () => {
    await repository.updateById({ id, reference })

    expect(data.models.application.update).toHaveBeenCalledTimes(1)
    expect(data.models.application.update).toHaveBeenCalledWith({ id, reference }, { where: { id } })
  })

  test('getAll returns pages of 10 ordered by createdAt DESC', async () => {
    await repository.getAll()

    expect(data.models.application.findAll).toHaveBeenCalledTimes(1)
    expect(data.models.application.findAll).toHaveBeenCalledWith({
      order: [['createdAt', 'DESC']]
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
      const searchText = 'In Progress'
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
            where: { status: 'IN PROGRESS' }
          }]
      })

      expect(data.models.application.count).toHaveBeenCalledWith({
        include: [
          {
            model: data.models.status,
            attributes: ['status'],
            where: { status: 'IN PROGRESS' }
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
        where: { 'data.organisation.name': searchText }
      })

      expect(data.models.application.count).toHaveBeenCalledWith({
        include: [
          {
            model: data.models.status,
            attributes: ['status']
          }],
        where: { 'data.organisation.name': searchText }
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

  describe('getApplicationCount', () => {
    test.each([
      { sbi: undefined },
      { sbi: '444444444' },
      { sbi: '   444444444    ' }
    ])('getApplicationCount successfully called with SBI', async ({ sbi }) => {
      await repository.getApplicationCount(sbi)

      expect(data.models.application.count).toHaveBeenCalledTimes(1)
      if (sbi) {
        expect(data.models.application.count).toHaveBeenCalledWith({
          where: {
            'data.organisation.sbi': sbi
          }
        })
      } else {
        expect(data.models.application.count).toHaveBeenCalledWith({
        })
      }
    })

    test('getApplicationsCount return number of applications count ', async () => {
      await repository.getApplicationsCount()
      expect(data.models.application.count).toHaveBeenCalledTimes(1)
    })
  })

  describe('getLatestApplicationsBy', () => {
    test.each([
      {
        toString: () => 'no applications found',
        given: {
          businessEmail: 'Business@email.com'
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
          businessEmail: 'business@email.com'
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
          businessEmail: 'business@email.com'
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
            }
          ]
        }
      }
    ])('%s', async (testCase) => {
      when(data.models.application.findAll)
        .calledWith({
          where: {
            'data.organisation.email': testCase.given.businessEmail.toLowerCase()
          },
          order: [['createdAt', 'DESC']],
          raw: true
        })
        .mockResolvedValue(testCase.when.foundApplications)

      const result = await repository.getLatestApplicationsBy(testCase.given.businessEmail)

      expect(data.models.application.findAll).toHaveBeenCalledTimes(1)
      expect(data.models.application.findAll).toHaveBeenCalledWith({
        where: {
          'data.organisation.email': testCase.given.businessEmail.toLowerCase()
        },
        order: [['createdAt', 'DESC']],
        raw: true
      })
      expect(result).toEqual(testCase.expect.result)
    })
  })

  test('getBySbi', async () => {
    const sbi = 123456789

    await repository.getBySbi(sbi)

    expect(data.models.application.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.application.findOne).toHaveBeenCalledWith({
      where: {
        'data.organisation.sbi': sbi
      }
    })
  })

  test('getByEmail queries based on lowercased email and orders by createdAt DESC', async () => {
    const email = 'TEST@email.com'

    await repository.getByEmail(email)

    expect(data.models.application.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.application.findOne).toHaveBeenCalledWith({
      order: [['createdAt', 'DESC']],
      where: { 'data.organisation.email': email.toLowerCase() },
      include: [{
        model: data.models.vetVisit
      }]
    })
  })

  test('get returns single data by uppercased reference', async () => {
    await repository.get(reference)

    expect(data.models.application.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.application.findOne).toHaveBeenCalledWith({
      where: { reference: reference.toUpperCase() },
      include: [{ model: data.models.vetVisit }, { attributes: ['status'], model: data.models.status }]
    })
  })
})
