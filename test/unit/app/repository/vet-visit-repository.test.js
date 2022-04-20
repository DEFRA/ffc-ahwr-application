const repository = require('../../../../app/repositories/vet-visit-repository')
const data = require('../../../../app/data')

data.models.vetVisit.create = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

const reference = 'abdcd'

describe('Vet Visit Repository test', () => {
  test('Set creates record for data', async () => {
    await repository.set({ id: 1, reference })
    expect(data.models.vetVisit.create).toHaveBeenCalledTimes(1)
    expect(data.models.vetVisit.create).toHaveBeenCalledWith({ id: 1, reference })
  })
})
