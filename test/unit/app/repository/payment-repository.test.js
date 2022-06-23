const repository = require('../../../../app/repositories/payment-repository')
const data = require('../../../../app/data')

data.models.payment.create = jest.fn()
data.models.payment.update = jest.fn()
data.models.payment.findOne = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

const reference = 'VV-1234-567'

describe('Payment Repository test', () => {
  test('Set creates record for data', async () => {
    await repository.set(reference, { agreementNumber: reference })
    expect(data.models.payment.create).toHaveBeenCalledTimes(1)
    expect(data.models.payment.create).toHaveBeenCalledWith({ applicationReference: reference, data: { agreementNumber: reference } })
  })

  test('Update record for data by reference', async () => {
    await repository.updateByReference(reference, 'completed')

    expect(data.models.payment.update).toHaveBeenCalledTimes(1)
    expect(data.models.payment.update).toHaveBeenCalledWith({ status: 'completed' }, { where: { applicationReference: reference } })
  })

  test('get returns single data by reference', async () => {
    await repository.get(reference)

    expect(data.models.payment.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.payment.findOne).toHaveBeenCalledWith({
      where: { applicationReference: reference }
    })
  })
})
