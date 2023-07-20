const queryEntitiesByPartitionKey = require('../../../../app/azure-storage/query-entities')
const { odata } = require('@azure/data-tables')

jest.mock('../../../../app/azure-storage/create-table-client', () => jest.fn())

describe('queryEntitiesByPartitionKey', () => {
  it('should query entities where partition key starts with search parameter', async () => {
    const tableName = 'myTable'
    const partitionKey = '123456'
    const queryFilter = odata`PartitionKey ge ${partitionKey} and PartitionKey lt ${(+partitionKey + 1).toString()}`
    const tableClientMock = {
      createTable: jest.fn(),
      listEntities: jest.fn().mockReturnValue([
        { id: 1, name: 'Event 1' },
        { id: 2, name: 'Event 2' }
      ])
    }
    const createTableClientMock = require('../../../../app/azure-storage/create-table-client')
    createTableClientMock.mockReturnValue(tableClientMock)

    const result = await queryEntitiesByPartitionKey(tableName, partitionKey, queryFilter)

    expect(createTableClientMock).toHaveBeenCalledWith(tableName)
    expect(tableClientMock.createTable).toHaveBeenCalledWith(tableName)
    expect(tableClientMock.listEntities).toHaveBeenCalledWith({
      queryOptions: {
        filter: "PartitionKey ge '123456' and PartitionKey lt '123457'"
      }
    })
    expect(result).toEqual([
      { id: 1, name: 'Event 1' },
      { id: 2, name: 'Event 2' }
    ])
  })

  it('should query entities where partition key equals search parameter', async () => {
    const tableName = 'myTable'
    const partitionKey = '123456'
    const queryFilter = odata`PartitionKey eq ${partitionKey}`
    const tableClientMock = {
      createTable: jest.fn(),
      listEntities: jest.fn().mockReturnValue([
        { id: 1, name: 'Event 1' },
        { id: 2, name: 'Event 2' }
      ])
    }
    const createTableClientMock = require('../../../../app/azure-storage/create-table-client')
    createTableClientMock.mockReturnValue(tableClientMock)

    const result = await queryEntitiesByPartitionKey(tableName, partitionKey, queryFilter)

    expect(createTableClientMock).toHaveBeenCalledWith(tableName)
    expect(tableClientMock.createTable).toHaveBeenCalledWith(tableName)
    expect(tableClientMock.listEntities).toHaveBeenCalledWith({
      queryOptions: {
        filter: "PartitionKey eq '123456'"
      }
    })
    expect(result).toEqual([
      { id: 1, name: 'Event 1' },
      { id: 2, name: 'Event 2' }
    ])
  })

  it('should return an empty array if either tableName or partitionKey is missing', async () => {
    const tableName = 'myTable'
    const partitionKey = null

    const result = await queryEntitiesByPartitionKey(tableName, partitionKey)

    expect(result).toEqual([])
  })
})
