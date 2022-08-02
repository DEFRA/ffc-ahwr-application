const dbHelper = require('../../../../db-helper')
const { models } = require('../../../../../app/data')
const getApplicationStateChanges = require('../../../../../app/lib/application-changed-state')
jest.mock('../../../../../app/events')

const initialDataSet = {
  id: '12345678-1234-1234-1234-1234567890AB',
  reference: '', // On creation of an instance reference is required. It however gets changed on save.
  claimed: false,
  data: {
    key1: 'value1',
    key2: 'value2'
  }
}

describe('Application state changed lib test', () => {
  beforeEach(async () => {
    await dbHelper.truncate()
    jest.clearAllMocks()
  })

  test('Detect a change in application state', async () => {
    const applicationRecord = await models.application.create(initialDataSet)

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
  })

  test('Detect if a data change has not occurred', async () => {
    const applicationRecord = await models.application.create(initialDataSet)

    const { originalState, newState } = getApplicationStateChanges(applicationRecord)

    expect(originalState).toEqual(null)
    expect(newState).toEqual(null)
  })

  test('Correctly handle being passed an invalid (null) application record', async () => {
    const { originalState, newState } = getApplicationStateChanges(null)

    expect(originalState).toEqual(null)
    expect(newState).toEqual(null)
  })
})
