const repository = require('../../../../app/repositories/application-repository')
const data = require('../../../../app/data')

data.models.application.create = jest.fn()
data.models.application.update = jest.fn()
data.models.application.findAll = jest.fn()
data.models.application.findOne = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Application Repository test', () => {
  const id = 1
  const reference = 'abdcd'

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
    { limit: 10, offset: 0, sbi: undefined },
    { limit: 10, offset: 0, sbi: '444444444' }
  ])('getAll returns pages of 10 ordered by createdAt DESC', async ({ limit, offset, sbi }) => {
    await repository.getAll(limit, offset, sbi)

    expect(data.models.application.findAll).toHaveBeenCalledTimes(1)
    if (sbi) {
      expect(data.models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: offset,
        where: {
          'data.organisation.sbi': '444444444'
        }
      })
    } else {
      expect(data.models.application.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: offset
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
      include: [{ model: data.models.vetVisit }]
    })
  })
})
