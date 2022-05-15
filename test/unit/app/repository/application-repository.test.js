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
    { page: undefined },
    { page: 1 }
  ])('getAll returns pages of 20 ordered by createdAt DESC', async ({ page }) => {
    await repository.getAll(page)

    expect(data.models.application.findAll).toHaveBeenCalledTimes(1)
    expect(data.models.application.findAll).toHaveBeenCalledWith({
      order: [['createdAt', 'DESC']], limit: 20, offset: page === undefined ? 0 : page
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
      include: [{ model: data.models.vetVisit }]
    })
  })
})
