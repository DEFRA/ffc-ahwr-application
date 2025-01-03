import { when, resetAllWhenMocks } from 'jest-when'
import { getAllByApplicationReference, set } from '../../../../app/repositories/contact-history-repository'
import { buildData } from '../../../../app/data'

jest.mock('../../../../app/data', () => {
  return {
    buildData: {
      models: {
        contact_history: {
          findAll: jest.fn(),
          create: jest.fn()
        }
      }
    }
  }
})

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

    when(buildData.models.contact_history.create)
      .calledWith(contactHistoryData)
      .mockResolvedValue(returnedContactHistoryData)

    await set(contactHistoryData)

    expect(buildData.models.contact_history.create).toHaveBeenCalledTimes(1)
    expect(buildData.models.contact_history.create).toHaveBeenCalledWith(contactHistoryData)
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
        id: 'ce758b2c-5e2c-4957-9864-ebc4451f6b1f',
        applicationReference: 'AHWR-9049-6416',
        claimReference: null,
        data: {
          field: 'email',
          newValue: '4fd3vc4fhvcjjh5@testvest.com',
          oldValue: '4fdfhvcjjh5@testvest.com'
        },
        sbi: '107204504',
        createdAt: '2024-04-14T20:00:46.045Z',
        updatedAt: '2024-04-14T20:00:46.399Z',
        createdBy: 'admin',
        updatedBy: null
      },
      {
        id: 'c528abb9-7d1a-4617-ae00-9db08d072e86',
        applicationReference: 'AHWR-9049-6416',
        claimReference: null,
        data: {
          field: 'email',
          newValue: '4fdfhvcjjh5@testvest.com',
          oldValue: '4fdfh5vvcjjh5@testvest.com',
          createdBy: 'Admin',
          createdOn: '2024-04-12T14:54:55.727Z'
        },
        sbi: '107204504',
        createdAt: '2024-04-12T14:54:55.893Z',
        updatedAt: '2024-04-12T14:54:55.950Z',
        createdBy: 'admin',
        updatedBy: null
      }]

    when(buildData.models.contact_history.findAll)
      .calledWith({
        where: { applicationReference: application.reference.toUpperCase() },
        order: [['createdAt', 'DESC']]
      })
      .mockResolvedValue(contactHistory)

    const result = await getAllByApplicationReference(
      application.reference
    )

    const sortedContactHistory = contactHistory.sort((a, b) =>
      new Date(a.createdAt) > new Date(b.createdAt) ? a : b
    )

    expect(buildData.models.contact_history.findAll).toHaveBeenCalledTimes(1)
    expect(contactHistory).toEqual(result)
    expect(result).toStrictEqual(sortedContactHistory)
  })

  test('should sort contact history by createdAt date descending', async () => {
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
        id: 'ce758b2c-5e2c-4957-9864-ebc4451f6b1f',
        applicationReference: 'AHWR-9049-6416',
        claimReference: null,
        data: {
          field: 'email',
          newValue: '4fd3vc4fhvcjjh5@testvest.com',
          oldValue: '4fdfhvcjjh5@testvest.com'
        },
        sbi: '107204504',
        createdAt: '2024-04-14T20:00:46.045Z',
        updatedAt: '2024-04-14T20:00:46.399Z',
        createdBy: 'admin',
        updatedBy: null
      },
      {
        id: 'c528abb9-7d1a-4617-ae00-9db08d072e86',
        applicationReference: 'AHWR-9049-6416',
        claimReference: null,
        data: {
          field: 'email',
          newValue: '4fdfhvcjjh5@testvest.com',
          oldValue: '4fdfh5vvcjjh5@testvest.com',
          createdBy: 'Admin',
          createdOn: '2024-04-12T14:54:55.727Z'
        },
        sbi: '107204504',
        createdAt: '2024-04-12T14:54:55.893Z',
        updatedAt: '2024-04-12T14:54:55.950Z',
        createdBy: 'admin',
        updatedBy: null
      }]

    when(buildData.models.contact_history.findAll)
      .calledWith({
        where: { applicationReference: application.reference.toUpperCase() },
        order: [['createdAt', 'DESC']]
      })
      .mockResolvedValue(contactHistory)

    const result = await getAllByApplicationReference(
      application.reference
    )

    expect(buildData.models.contact_history.findAll).toHaveBeenCalledTimes(1)
    expect(new Date(result[0].createdAt)).toEqual(new Date('2024-04-14T20:00:46.045Z'))
    expect(new Date(result[1].createdAt)).toEqual(new Date('2024-04-12T14:54:55.893Z'))
  })
})
