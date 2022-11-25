const repository = require('../../../../app/repositories/compliance-application-repository')
const data = require('../../../../app/data')
jest.mock('../../../../app/data')

data.models.complianceApplication.update = jest.fn()
data.models.complianceApplication.findAll = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

const reference = 'abdcd'

describe('Compliance Repository test', () => {
  test('getPendingApplications call findAll ', async () => {
    await repository.getPendingApplications()
    expect(data.models.complianceApplication.findAll).toHaveBeenCalledTimes(1)
    expect(data.models.complianceApplication.findAll).toHaveBeenCalledWith({
      where: {
        processed: false
      }
    })
  })
  test('update calls model update with id ', async () => {
    await repository.update({ processed: true, reference}, 'random-id')
    expect(data.models.complianceApplication.update).toHaveBeenCalledTimes(1)
    expect(data.models.complianceApplication.update).toHaveBeenCalledWith({ processed: true, reference }, {
      where: { id: 'random-id' }
    })
  })
})
