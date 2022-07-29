require('../../../../../db-helper')
const { models } = require('../../../../../../app/data')
const sendEvent = require('../../../../../../app/events')
const getApplicationStateChanges = require('../../../../../../app/lib/application-changed-state')
jest.mock('../../../../../../app/events')

describe('Application model test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Updating application record should send update message', async () => {
    const initialDataSet = {
      id: '12345678-1234-1234-1234-1234567890AB',
      claimed: false,
      data: {
        key1: 'value1',
        key2: 'value2'
      }
    }

    const applicationRecord = await models.application.create(initialDataSet)

    expect(applicationRecord.reference).toEqual('VV-1234-5678')

    expect(sendEvent).toHaveBeenCalledTimes(0)

    applicationRecord.claimed = true
    applicationRecord.data = {
      key1: 'value3',
      key2: 'value4'
    }

    const { originalState, newState } = getApplicationStateChanges(applicationRecord)

    expect(originalState).toEqual({
      claimed: false,
      data: {
        key1: 'value1',
        key2: 'value2'
      }
    })

    expect(newState).toEqual({
      claimed: true,
      data: {
        key1: 'value3',
        key2: 'value4'
      }
    })

    await applicationRecord.save()

    expect(sendEvent).toHaveBeenCalledTimes(1)
  })

  test('Should be able to specify application record reference value', async () => {
    const reference = 'VV-5678-90AB'
    const initialDataSet = {
      id: '12345678-1234-1234-1234-1234567890AB',
      reference,
      claimed: false,
      data: {
        key1: 'value1',
        key2: 'value2'
      }
    }

    const applicationRecord = await models.application.create(initialDataSet)

    expect(applicationRecord.reference).toEqual(reference)
  })
})
