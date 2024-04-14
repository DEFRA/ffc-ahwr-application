const { when, resetAllWhenMocks } = require('jest-when')
const repository = require('../../../../app/repositories/contact-history-repository')
const data = require('../../../../app/data')

jest.mock('../../../../app/data')

data.models.contact_history.create = jest.fn()
data.models.contact_history.findAll = jest.fn()
data.models.contact_history.findOne = jest.fn()

describe('Contact history Repository test', () => {
  const env = process.env

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    resetAllWhenMocks()
    process.env = { ...env }
  })

  test('Should create contact history', async () => {
    const contactHistoryData = {
      applicationReference: 'AHWR-9049-6416',
      sbi: 107204504,
      data: {
        field: 'email',
        oldValue: '4fd3vc4fhvcjjh5@testvest.com',
        newValue: 'vvv@testvest.com'
      },
      createdBy: 'admin',
      createdAt: '2024-04-14T20:43:15.599Z'
    }
    const returnedContactHistoryData = {
      createdAt: '2024-04-14T20:43:15.599Z',
      id: '573d4957-8dc8-4ede-ba5d-e6224d0ff29a',
      claimReference: null,
      updatedAt: '2024-04-14T20:43:15.673Z',
      updatedBy: 'admin',
      applicationReference: 'AHWR-9049-6416',
      sbi: '107204504',
      data: {
        field: 'email',
        newValue: 'vvv@testvest.com',
        oldValue: '4fd3vc4fhvcjjh5@testvest.com'
      },
      createdBy: 'admin'
    }

    when(data.models.contact_history.create)
      .calledWith(contactHistoryData)
      .mockResolvedValue(returnedContactHistoryData)

    await repository.set(contactHistoryData)

    expect(data.models.contact_history.create).toHaveBeenCalledTimes(1)
    expect(data.models.contact_history.create).toHaveBeenCalledWith(contactHistoryData)
  })
  test('Get all contacts history by application reference', async () => {
    const application = {
      id: '0ad33322-c833-40c9-8116-0a293f0850a1',
      reference: 'AHWR-0AD3-3322',
      data: {
        reference: null,
        declaration: true,
        offerStatus: 'accepted',
        whichReview: 'sheep',
        organisation: {
          sbi: '106785889',
          name: 'Mr Jack Whaling',
          email: 'johnallany@nallanhoje.com.test',
          address:
            'Elmtree Farm,Gamlingay,NORTH MILFORD GRANGE,LISKEARD,DL12 9TY,United Kingdom',
          farmerName: 'John Allan'
        },
        eligibleSpecies: 'yes',
        confirmCheckDetails: 'yes'
      },
      claimed: false,
      createdAt: '2023-12-20T15:32:59.262Z',
      updatedAt: '2023-12-20T15:32:59.359Z',
      createdBy: 'admin',
      updatedBy: null,
      statusId: 1,
      type: 'VV',
      status: {
        status: 'AGREED'
      }
    }

    const contactHistory = [
      {
        id: '0ad33322-c833-40c9-8116-0a293f0850a1',
        reference: 'AHWR-0AD3-3322',
        data: {
          reference: null,
          declaration: true,
          offerStatus: 'accepted',
          whichReview: 'sheep',
          organisation: {
            sbi: '106785889',
            name: 'Mr Jack Whaling',
            email: 'johnallany@nallanhoje.com.test',
            address:
              'Elmtree Farm,Gamlingay,NORTH MILFORD GRANGE,LISKEARD,DL12 9TY,United Kingdom',
            farmerName: 'John Allan'
          },
          eligibleSpecies: 'yes',
          confirmCheckDetails: 'yes'
        },
        claimed: false,
        createdAt: '2023-12-20T15:32:59.262Z',
        updatedAt: '2023-12-20T15:32:59.359Z',
        createdBy: 'admin',
        updatedBy: null,
        statusId: 1,
        type: 'VV',
        status: {
          status: 'AGREED'
        }
      }
    ]
    when(data.models.contact_history.findAll)
      .calledWith({
        where: { applicationReference: application.reference.toUpperCase() },
        order: [['createdAt', 'DESC']]
      })
      .mockResolvedValue(contactHistory)

    const result = await repository.getAllByApplicationReference(
      application.reference
    )

    expect(data.models.contact_history.findAll).toHaveBeenCalledTimes(1)
    expect(contactHistory).toEqual(result)
  })
})
