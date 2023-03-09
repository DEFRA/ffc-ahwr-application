const MOCK_NOW = new Date()

describe('queryEntitiesByPartitionKey', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(MOCK_NOW)

    jest.mock('../../../../app/config', () => ({
      storage: {
        useConnectionString: false
      }
    }))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  test.each([
    {
      toString: () => 'Empty table name',
      given: {
        tableName: '',
        partitionKey: 'partition_key'
      },
      when: {
      },
      expect: {
        events: [],
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Listing events by: ${JSON.stringify({
            tableName: '',
            partitionKey: 'partition_key'
          })}`
        ]
      }
    },
    {
      toString: () => 'Empty partitionKey name',
      given: {
        tableName: 'table_name',
        partitionKey: ''
      },
      when: {
      },
      expect: {
        events: [],
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Listing events by: ${JSON.stringify({
            tableName: 'table_name',
            partitionKey: ''
          })}`
        ]
      }
    },
    {
      toString: () => 'No events found',
      given: {
        tableName: 'table_name',
        partitionKey: 'partition_key'
      },
      when: {
        entities: []
      },
      expect: {
        events: [],
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Listing events by: ${JSON.stringify({
            tableName: 'table_name',
            partitionKey: 'partition_key'
          })}`,
          `${MOCK_NOW.toISOString()} Creating the table client using the DefaultAzureCredential: ${JSON.stringify({
            tableName: 'table_name'
          })}`
        ]
      }
    },
    {
      toString: () => 'One event found',
      given: {
        tableName: 'table_name',
        partitionKey: 'partition_key'
      },
      when: {
        entities: [{}]
      },
      expect: {
        events: [{}],
        consoleLogs: [
            `${MOCK_NOW.toISOString()} Listing events by: ${JSON.stringify({
              tableName: 'table_name',
              partitionKey: 'partition_key'
            })}`,
            `${MOCK_NOW.toISOString()} Creating the table client using the DefaultAzureCredential: ${JSON.stringify({
              tableName: 'table_name'
            })}`
        ]
      }
    }
  ])('%s', async (testCase) => {
    const MOCK_ENTITIES = testCase.when.entities

    jest.mock('@azure/data-tables', () => {
      return {
        odata: jest.fn(),
        TableClient: jest.fn().mockImplementation(() => {
          return {
            createTable: jest.fn(),
            listEntities: jest.fn().mockImplementation(() => {
              return MOCK_ENTITIES
            })
          }
        })
      }
    })

    const queryEntitiesByPartitionKey = require('../../../../app/azure-storage/query-entities')
    const events = await queryEntitiesByPartitionKey(
      testCase.given.tableName,
      testCase.given.partitionKey
    )

    expect(events).toEqual(testCase.expect.events)
  })
})
