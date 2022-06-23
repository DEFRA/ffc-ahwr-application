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

  test.each([
    { limit, offset, sbi: undefined },
    { limit, offset, sbi: '444444444' }
  ])('getAll returns pages of 10 ordered by createdAt DESC', async ({ limit, offset, sbi }) => {
    await repository.getAll(sbi, offset, limit)

    expect(data.models.application.findAll).toHaveBeenCalledTimes(1)
    if (sbi) {
      expect(data.models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        where: {
          'data.organisation.sbi': '444444444'
        }
      })
    } else {
      expect(data.models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit,
        offset
      })
    }
  })
  test.each([
    { limit, offset, searchText: undefined, searchType: '' },
    { limit, offset, searchText: '333333333', searchType: 'sbi' },
    { limit, offset, searchText: '', searchType: '' },
    { limit, offset, searchText: 'VV-555A-FD4D', searchType: 'ref' },
    { limit, offset, searchText: 'In Progress', searchType: 'status' }
  ])('getApplications returns pages of 10 ordered by createdAt DESC', async ({ searchText, searchType, limit, offset }) => {
    await repository.searchApplications(searchText, searchType, offset, limit)

    expect(data.models.application.count).toHaveBeenCalledTimes(1)
    if (searchText) {
      switch (searchType) {
        case 'sbi':
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

          expect(data.models.application.count).toHaveBeenCalledWith({
            where: {
              'data.organisation.sbi': searchText
            }
          })
          break
        case 'ref':
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
            where: {
              reference: searchText
            }
          })
          break
        case 'status':
          expect(data.models.application.findAll).toHaveBeenCalledWith({
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
              {
                model: data.models.status,
                attributes: ['status'],
                where: { status: undefined }
              }]
          })

          expect(data.models.application.count).toHaveBeenCalledWith({
            include: [
              {
                model: data.models.status,
                attributes: ['status'],
                where: { status: undefined }
              }]
          })
          break
      }
    } else {
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
    }
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
  ])('getApplications returns empty array when no application found.', async ({ searchText, searchType, limit, offset }) => {
    data.models.application.count.mockReturnValue(0)
    await repository.searchApplications(searchText, searchType, offset, limit)

    expect(data.models.application.count).toHaveBeenCalledTimes(1)
    expect(data.models.application.findAll).not.toHaveBeenCalled()
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
