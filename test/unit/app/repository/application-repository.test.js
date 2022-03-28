const repository = require('../../../../app/repositories/application-repository')
const data = require('../../../../app/data')

data.models.application.create = jest.fn()
data.models.application.findAll = jest.fn()
data.models.application.findOne = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

const reference = 'abdcd'

describe('Application Repository test', () => {
  test('Set creates record for data', async () => {
    await repository.set({ id: 1, reference })
    expect(data.models.application.create).toHaveBeenCalledTimes(1)
    expect(data.models.application.create).toHaveBeenCalledWith({ id: 1, reference })
  })
  test('getAll returns all data from table', async () => {
    await repository.getAll()
    expect(data.models.application.findAll).toHaveBeenCalledTimes(1)
  })
  test('get returns single data by refereencee', async () => {
    await repository.get(reference)
    expect(data.models.application.findOne).toHaveBeenCalledTimes(1)
    const expectObj = {
      attributes: ['id', 'reference', 'type', 'data', 'createdAt'],
      where: { reference },
      order: [['created_at', 'DESC']]
    }
    expect(data.models.application.findOne).toHaveBeenCalledWith(expectObj)
  })
})
