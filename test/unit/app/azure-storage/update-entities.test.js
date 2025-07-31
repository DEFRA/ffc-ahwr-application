import { createTableClient } from '../../../../app/azure-storage/create-table-client'
import { updateEntitiesByPartitionKey } from '../../../../app/azure-storage/update-entities'

jest.mock('../../../../app/azure-storage/create-table-client')

const tableClientMock = {
  createTable: jest.fn(),
  listEntities: jest.fn(),
  updateEntity: jest.fn().mockResolvedValue(true)
}

const tableName = 'myTable'
const partitionKey = '123456'

describe('updateEntitiesByPartitionKey', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createTableClient.mockReturnValue(tableClientMock)
  })

  test('should redact values when entities has payload with nested fields', async () => {
    tableClientMock.listEntities.mockReturnValue((async function * () {
      yield {
        rowKey: 'row-1',
        partitionKey: '107292794',
        ChangedBy: 'jamesdentt@tnedsemajd.com.test',
        EventType: 'claim-organisation',
        Payload: JSON.stringify({
          type: 'claim-organisation',
          message: 'Session set for claim and organisation.',
          data: {
            reference: 'TEMP-CLAIM-WRWV-ZCJT',
            applicationReference: 'IAHW-Q1CE-B4QN',
            organisation: {
              sbi: '107292794',
              farmerName: 'James H Dent',
              name: 'Adrian Clark',
              email: 'jamesdentt@tnedsemajd.com.test',
              orgEmail: 'adrianclarkc@kralcnairdap.com.test',
              address: 'HARLESTON,TD15 2UL,United Kingdom',
              crn: '1100707557',
              frn: '1102718130'
            }
          },
          raisedBy: 'jamesdentt@tnedsemajd.com.test',
          raisedOn: '2025-02-14T10:31:02.201Z'
        })
      }
      ,
      yield {
        rowKey: 'row-2',
        partitionKey: '107292794',
        ChangedBy: 'jamesdentt@tnedsemajd.com.test',
        EventType: 'claim-organisation',
        Payload: JSON.stringify({
          type: 'claim-vetName',
          message: 'Session set for claim and vetName.',
          data: {
            reference: 'TEMP-CLAIM-BWVI-BRTF',
            applicationReference: 'IAHW-9WWK-GBBR',
            vetName: 'Hope'
          },
          raisedBy: 'jamesdentt@tnedsemajd.com.test',
          raisedOn: '2025-02-14T14:00:39.720Z'
        })
      }
    })())

    const replacements = {
      ChangedBy: 'REDACTED_CHANGED_BY',
      Payload: {
        cph: 'REDACTED_CPH',
        exception: 'REDACTED_EXCEPTION',
        farmerName: 'REDACTED_FARMER_NAME',
        organisationName: 'REDACTED_ORGANISATION_NAME',
        orgEmail: 'REDACTED_ORG_EMAIL',
        email: 'REDACTED_EMAIL',
        name: 'REDACTED_NAME',
        address: 'REDACTED_ADDRESS',
        vetName: 'REDACTED_VET_NAME',
        vetRcvs: 'REDACTED_VET_RCVS',
        vetsName: 'REDACTED_VETS_NAME',
        vetRcvsNumber: 'REDACTED_VET_RCVS_NUMBER',
        urnResult: 'REDACTED_URN_RESULT',
        latestEndemicsApplication: 'REDACTED_LATEST_ENDEMICS_APPLICATION',
        latestVetVisitApplication: 'REDACTED_LATEST_VET_VISIT_APPLICATION',
        relevantReviewForEndemics: 'REDACTED_RELEVANT_REVIEW_FOR_ENDEMICS',
        previousClaims: 'REDACTED_PREVIOUS_CLAIMS',
        herdName: 'REDACTED_HERD_NAME',
        herdCph: 'REDACTED_HERD_CPH',
        herds: 'REDACTED_HERDS',
        flagDetail: 'REDACTED_FLAG_DETAIL',
        deletedNote: 'REDACTED_DELETED_NOTE',
        note: 'REDACTED_NOTE',
        invalidClaimData: 'REDACTED_INVALID_CLAIM_DATA',
        raisedBy: 'REDACTED_RAISED_BY',
        message: 'REDACTED_MESSAGE'
      }
    }

    await updateEntitiesByPartitionKey(tableName, partitionKey, "PartitionKey eq '12345'", replacements)

    expect(tableClientMock.updateEntity).toHaveBeenCalledWith(
      {
        partitionKey: '107292794',
        rowKey: 'row-1',
        ChangedBy: 'REDACTED_CHANGED_BY',
        Payload: JSON.stringify({
          type: 'claim-organisation',
          message: 'REDACTED_MESSAGE',
          data: {
            reference: 'TEMP-CLAIM-WRWV-ZCJT',
            applicationReference: 'IAHW-Q1CE-B4QN',
            organisation: {
              sbi: '107292794',
              farmerName: 'REDACTED_FARMER_NAME',
              name: 'REDACTED_NAME',
              email: 'REDACTED_EMAIL',
              orgEmail: 'REDACTED_ORG_EMAIL',
              address: 'REDACTED_ADDRESS',
              crn: '1100707557',
              frn: '1102718130'
            }
          },
          raisedBy: 'REDACTED_RAISED_BY',
          raisedOn: '2025-02-14T10:31:02.201Z'
        })
      },
      'Merge'
    )
    expect(tableClientMock.updateEntity).toHaveBeenCalledWith(
      {
        rowKey: 'row-2',
        partitionKey: '107292794',
        ChangedBy: 'REDACTED_CHANGED_BY',
        Payload: JSON.stringify({
          type: 'claim-vetName',
          message: 'REDACTED_MESSAGE',
          data: {
            reference: 'TEMP-CLAIM-BWVI-BRTF',
            applicationReference: 'IAHW-9WWK-GBBR',
            vetName: 'REDACTED_VET_NAME'
          },
          raisedBy: 'REDACTED_RAISED_BY',
          raisedOn: '2025-02-14T14:00:39.720Z'
        })
      },
      'Merge'
    )
  })

  test('should not call updateEntity when no entities match filter', async () => {
    tableClientMock.listEntities.mockReturnValue((async function * () { })())

    await updateEntitiesByPartitionKey(tableName, partitionKey, "PartitionKey eq '99999'", {
      ChangedBy: 'REDACTED_CHANGED_BY'
    })

    expect(tableClientMock.updateEntity).not.toHaveBeenCalled()
  })

  test('should update only non-payload fields when no Payload replacement provided', async () => {
    tableClientMock.listEntities.mockReturnValue((async function * () {
      yield { partitionKey: 'pk1', rowKey: 'row-2', ChangedBy: 'johndoe', Payload: '{"some":"data"}' }
    })())

    await updateEntitiesByPartitionKey(tableName, partitionKey, null, { ChangedBy: 'REDACTED_CHANGED_BY' })

    expect(tableClientMock.updateEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        partitionKey: 'pk1',
        rowKey: 'row-2',
        ChangedBy: 'REDACTED_CHANGED_BY'
      }),
      'Merge'
    )
  })

  test('should throw error when listEntities fails', async () => {
    tableClientMock.listEntities.mockImplementation(() => { throw new Error('Storage failure') })

    await expect(updateEntitiesByPartitionKey(tableName, partitionKey, null, { ChangedBy: 'X' }))
      .rejects
      .toThrow('Storage failure')
  })
})
