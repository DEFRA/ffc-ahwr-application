import { queryEntitiesByPartitionKey } from '../../../../app/azure-storage/query-entities'
import { odata } from '@azure/data-tables'
import { createTableClient } from '../../../../app/azure-storage/create-table-client'

jest.mock('../../../../app/azure-storage/create-table-client')

const tableClientMock = {
  createTable: jest.fn(),
  listEntities: jest.fn().mockReturnValue([
    { id: 1, name: 'Event 1' },
    { id: 2, name: 'Event 2' }
  ])
}

describe('queryEntitiesByPartitionKey', () => {
  it('should query entities where partition key starts with search parameter', async () => {
    const tableName = 'myTable'
    const partitionKey = '123456'
    const queryFilter = odata`PartitionKey ge ${partitionKey} and PartitionKey lt ${(+partitionKey + 1).toString()}`
    createTableClient.mockReturnValue(tableClientMock)

    const result = await queryEntitiesByPartitionKey(tableName, partitionKey, queryFilter)

    expect(createTableClient).toHaveBeenCalledWith(tableName)
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
    createTableClient.mockReturnValue(tableClientMock)

    const result = await queryEntitiesByPartitionKey(tableName, partitionKey, queryFilter)

    expect(createTableClient).toHaveBeenCalledWith(tableName)
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
