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
        partitionKey: '123456789'
      },
      when: {
      },
      expect: {
        events: []
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
        events: []
      }
    },
    {
      toString: () => 'No events found',
      given: {
        tableName: 'table_name',
        partitionKey: '123456789'
      },
      when: {
        entities: []
      },
      expect: {
        events: []
      }
    },
    {
      toString: () => 'One event found',
      given: {
        tableName: 'table_name',
        partitionKey: '123456789'
      },
      when: {
        entities: [{}]
      },
      expect: {
        events: [{}]
      }
    }
  ])('%s', async (testCase) => {
    const MOCK_ENTITIES = testCase.when.entities
    const MOCK_PARTITION_KEY = testCase.given.partitionKey

    jest.mock('@azure/data-tables', () => {
      return {
        ...jest.requireActual('@azure/data-tables'),
        TableClient: jest.fn().mockImplementation(() => {
          return {
            createTable: jest.fn(),
            listEntities: jest.fn().mockImplementation((args) => {
              if (args.queryOptions.filter === `PartitionKey ge '${MOCK_PARTITION_KEY}' and PartitionKey lt '${(+MOCK_PARTITION_KEY + 1).toString()}'`) {
                return MOCK_ENTITIES
              } else {
                return []
              }
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
