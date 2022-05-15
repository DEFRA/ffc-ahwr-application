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

  test('getAll returns all data from table', async () => {
    await repository.getAll()

    expect(data.models.application.findAll).toHaveBeenCalledTimes(1)
  })

  test('get returns single data by uppercased reference', async () => {
    await repository.get(reference)

    expect(data.models.application.findOne).toHaveBeenCalledTimes(1)
    const expectObj = {
      where: { reference: reference.toUpperCase() },
      include: [{ model: data.models.vetVisit }]
    }
    expect(data.models.application.findOne).toHaveBeenCalledWith(expectObj)
  })
})
