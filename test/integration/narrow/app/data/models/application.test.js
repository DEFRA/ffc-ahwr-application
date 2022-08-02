const dbHelper = require('../../../../../db-helper')
const { models } = require('../../../../../../app/data')
const sendEvent = require('../../../../../../app/events')
jest.mock('../../../../../../app/events')

const initialDataSet = {
  id: '12345678-1234-1234-1234-1234567890AB',
  reference: '', // On creation of an instance reference is required. It however gets changed on save.
  claimed: false,
  data: {
    key1: 'value1',
    key2: 'value2'
  }
}

describe('Application model test', () => {
  beforeEach(async () => {
    await dbHelper.truncate()
    jest.clearAllMocks()
  })

  test('Should only send message if an application record was updated', async () => {
    await models.application.create(initialDataSet)

    expect(sendEvent).toHaveBeenCalledTimes(0)
  })

  test('Updating application record should send update message', async () => {
    const applicationRecord = await models.application.create(initialDataSet)

    expect(sendEvent).toHaveBeenCalledTimes(0)

    applicationRecord.claimed = true
    applicationRecord.data = {
      key1: 'value3',
      key2: 'value4'
    }

    await applicationRecord.save()

    expect(sendEvent).toHaveBeenCalledTimes(1)
  })
})
