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
  test.each([
    { searchText: undefined, searchType: '' },
    { searchText: '', searchType: '' }
  ])('getApplications for empty search returns call findAll', async ({ searchText, searchType }) => {
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
  test('getApplications for Invalid SBI  call findAll', async () => {
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
  test('getApplications for Invalid application reference call findAll', async () => {
    const searchText = 'VV-555A-FD4D'
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
  test('getApplications for Status call findAll', async () => {
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
  test.each([
    { limit, offset, searchText: undefined, searchType: 'sbi' },
    { limit, offset, searchText: '333333333', searchType: 'sbi' },
    { limit, offset, searchText: '', searchType: 'sbi' },
    { limit, offset, searchText: undefined, searchType: 'ref' },
    { limit, offset, searchText: '333333333', searchType: 'ref' },
    { limit, offset, searchText: '', searchType: 'ref' },
    { limit, offset, searchText: undefined, searchType: 'status' },
    { limit, offset, searchText: '333333333', searchType: 'status' },
    { limit, offset, searchText: '', searchType: 'status' }
  ])('getApplications returns empty array when no application found.', async ({ searchText, searchType }) => {
    data.models.application.count.mockReturnValue(0)
    await repository.searchApplications(searchText, searchType, [], offset, limit)

    expect(data.models.application.count).toHaveBeenCalledTimes(1)
    expect(data.models.application.findAll).not.toHaveBeenCalledTimes(1)
  })
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
