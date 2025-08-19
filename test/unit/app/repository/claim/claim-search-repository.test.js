import { searchClaims } from '../../../../../app/repositories/claim/claim-search-repository'
import { buildData } from '../../../../../app/data'
import { Op } from 'sequelize'
import { when, resetAllWhenMocks } from 'jest-when'

jest.mock('../../../../../app/data', () => {
  return {
    buildData: {
      models: {
        claim: {
          findAll: jest.fn(),
          findOne: jest.fn(),
          count: jest.fn()
        },
        application: {
          findAll: jest.fn(),
          update: jest.fn()
        },
        status: 'mock-status',
        flag: 'mock-flag',
        herd: {
          findAll: jest.fn(),
          findOne: jest.fn()
        }
      },
      sequelize: {
        query: jest.fn()
      }
    }
  }
})

describe('Claim repository: Search Claim', () => {
  const env = process.env

  afterEach(() => {
    resetAllWhenMocks()
    process.env = { ...env }
    jest.clearAllMocks()
  })

  buildData.models.herd.findAll.mockResolvedValue([
    {
      dataValues: {
        id: 'aaa111',
        version: 1,
        herdName: 'My first herd'
      },
      toJSON: () => ({
        id: 'aaa111',
        version: 1,
        herdName: 'My first herd'
      })
    },
    {
      dataValues: {
        id: 'aaa222',
        version: 1,
        herdName: 'My second herd'
      },
      toJSON: () => ({
        id: 'aaa222',
        version: 1,
        herdName: 'My second herd'
      })
    }
  ])

  buildData.models.claim.findAll.mockResolvedValue([
    {
      dataValues: { data: { herdId: 'aaa111', herdVersion: 1 } },
      toJSON: () => ({ data: { herdId: 'aaa111', herdVersion: 1 } })
    },
    {
      dataValues: { data: { herdId: 'aaa222', herdVersion: 1 } },
      toJSON: () => ({ data: { herdId: 'aaa222', herdVersion: 1 } })
    }
  ])

  buildData.models.claim.count.mockResolvedValue(2)

  test('it returns nothing if the search type doesnt match one of the allowed values', async () => {
    const search = { type: 'incorrectValue' }
    const filter = undefined
    const offset = 10
    const limit = 20
    const sort = { field: 'createdAt', direction: 'DESC' }

    expect(await searchClaims(search, filter, offset, limit, sort)).toEqual({
      total: 0,
      claims: []
    })
  })

  test('it applies the filter to the query if provided', async () => {
    const search = { type: 'appRef' }
    const filter = { field: 'X', op: 'lte', value: 'Z' }
    const offset = 10
    const limit = 20
    const sort = { field: 'createdAt', direction: 'DESC' }

    const result = await searchClaims(search, filter, offset, limit, sort)

    expect(buildData.models.claim.findAll).toHaveBeenCalledWith({
      include: [
        { attributes: ['status'], model: 'mock-status' },
        { attributes: ['data'], model: { findAll: expect.anything(), update: expect.anything() } },
        {
          as: 'flags',
          attributes: ['appliesToMh'],
          model: 'mock-flag',
          required: false,
          where: { deletedBy: null }
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: { [filter.field]: expect.any(Object) }
    })

    expect(result).toEqual({
      claims: [
        {
          data: { herdId: 'aaa111', herdVersion: 1 },
          herd: { id: 'aaa111', version: 1, herdName: 'My first herd' }
        },
        {
          data: { herdId: 'aaa222', herdVersion: 1 },
          herd: { id: 'aaa222', version: 1, herdName: 'My second herd' }
        }
      ],
      total: 2
    })
  })

  test('it applies the search for appRef if provided', async () => {
    const search = { type: 'appRef', text: 'IAHW-1111-2222' }
    const filter = { field: 'X', op: 'lte', value: 'Z' }
    const offset = 10
    const limit = 20
    const sort = { field: 'createdAt', direction: 'DESC' }

    const result = await searchClaims(search, filter, offset, limit, sort)

    expect(buildData.models.claim.findAll).toHaveBeenCalledWith({
      include: [
        { attributes: ['status'], model: 'mock-status' },
        { attributes: ['data'], model: { findAll: expect.anything(), update: expect.anything() } },
        {
          as: 'flags',
          attributes: ['appliesToMh'],
          model: 'mock-flag',
          required: false,
          where: { deletedBy: null }
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: { [filter.field]: expect.any(Object), applicationReference: search.text }
    })

    expect(result).toEqual({
      claims: [
        {
          data: { herdId: 'aaa111', herdVersion: 1 },
          herd: { id: 'aaa111', version: 1, herdName: 'My first herd' }
        },
        {
          data: { herdId: 'aaa222', herdVersion: 1 },
          herd: { id: 'aaa222', version: 1, herdName: 'My second herd' }
        }
      ],
      total: 2
    })
  })

  test('it applies a default sort if there is no field providedd', async () => {
    const search = { type: 'ref', text: 'REBC-1212-FSFW' }
    const filter = { field: 'X', op: 'lte', value: 'Z' }
    const offset = 10
    const limit = 20
    const sort = {}

    const result = await searchClaims(search, filter, offset, limit, sort)

    expect(buildData.models.claim.findAll).toHaveBeenCalledWith({
      include: [
        { attributes: ['status'], model: 'mock-status' },
        { attributes: ['data'], model: { findAll: expect.anything(), update: expect.anything() } },
        {
          as: 'flags',
          attributes: ['appliesToMh'],
          model: 'mock-flag',
          required: false,
          where: { deletedBy: null }
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'ASC']],
      where: { [filter.field]: expect.any(Object), reference: search.text }
    })

    expect(result).toEqual({
      claims: [
        {
          data: { herdId: 'aaa111', herdVersion: 1 },
          herd: { id: 'aaa111', version: 1, herdName: 'My first herd' }
        },
        {
          data: { herdId: 'aaa222', herdVersion: 1 },
          herd: { id: 'aaa222', version: 1, herdName: 'My second herd' }
        }
      ],
      total: 2
    })
  })

  test('it applies the search for species if provided', async () => {
    const search = { type: 'species', text: 'sheep' }
    const filter = { field: 'X', op: 'lte', value: 'Z' }
    const offset = 10
    const limit = 20
    const sort = { field: 'createdAt', direction: 'DESC' }

    const result = await searchClaims(search, filter, offset, limit, sort)

    expect(buildData.models.claim.findAll).toHaveBeenCalledWith({
      include: [
        { attributes: ['status'], model: 'mock-status' },
        { attributes: ['data'], model: { findAll: expect.anything(), update: expect.anything() } },
        {
          as: 'flags',
          attributes: ['appliesToMh'],
          model: 'mock-flag',
          required: false,
          where: { deletedBy: null }
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: { [filter.field]: expect.any(Object), 'data.typeOfLivestock': search.text }
    })

    expect(result).toEqual({
      claims: [
        {
          data: { herdId: 'aaa111', herdVersion: 1 },
          herd: { id: 'aaa111', version: 1, herdName: 'My first herd' }
        },
        {
          data: { herdId: 'aaa222', herdVersion: 1 },
          herd: { id: 'aaa222', version: 1, herdName: 'My second herd' }
        }
      ],
      total: 2
    })
  })

  test('it applies the search for type if provided', async () => {
    const search = { type: 'type', text: 'R' }
    const filter = { field: 'X', op: 'lte', value: 'Z' }
    const offset = 10
    const limit = 20
    const sort = { field: 'createdAt', direction: 'DESC' }

    const result = await searchClaims(search, filter, offset, limit, sort)

    expect(buildData.models.claim.findAll).toHaveBeenCalledWith({
      include: [
        { attributes: ['status'], model: 'mock-status' },
        { attributes: ['data'], model: { findAll: expect.anything(), update: expect.anything() } },
        {
          as: 'flags',
          attributes: ['appliesToMh'],
          model: 'mock-flag',
          required: false,
          where: { deletedBy: null }
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: { [filter.field]: expect.any(Object), type: search.text }
    })

    expect(result).toEqual({
      claims: [
        {
          data: { herdId: 'aaa111', herdVersion: 1 },
          herd: { id: 'aaa111', version: 1, herdName: 'My first herd' }
        },
        {
          data: { herdId: 'aaa222', herdVersion: 1 },
          herd: { id: 'aaa222', version: 1, herdName: 'My second herd' }
        }
      ],
      total: 2
    })
  })

  test('it applies the search for type if provided', async () => {
    const search = { type: 'sbi', text: '121334432' }
    const filter = { field: 'X', op: 'lte', value: 'Z' }
    const offset = 10
    const limit = 20
    const sort = { field: 'createdAt', direction: 'DESC' }

    const result = await searchClaims(search, filter, offset, limit, sort)

    expect(buildData.models.claim.findAll).toHaveBeenCalledWith({
      include: [
        { attributes: ['status'], model: 'mock-status' },
        { attributes: ['data'], model: { findAll: expect.anything(), update: expect.anything() }, where: { 'data.organisation.sbi': search.text } },
        {
          as: 'flags',
          attributes: ['appliesToMh'],
          model: 'mock-flag',
          required: false,
          where: { deletedBy: null }
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: { [filter.field]: expect.any(Object) }
    })

    expect(result).toEqual({
      claims: [
        {
          data: { herdId: 'aaa111', herdVersion: 1 },
          herd: { id: 'aaa111', version: 1, herdName: 'My first herd' }
        },
        {
          data: { herdId: 'aaa222', herdVersion: 1 },
          herd: { id: 'aaa222', version: 1, herdName: 'My second herd' }
        }
      ],
      total: 2
    })
  })

  test('adds filter to query', async () => {
    buildData.models.herd.findAll.mockResolvedValue([
      {
        dataValues: {
          id: 'aaa111',
          version: 1
        },
        toJSON: () => ({
          id: 'aaa111',
          version: 1
        })
      }
    ])
    when(buildData.models.claim.findAll).mockResolvedValue([
      {
        dataValues: { data: { herdId: 'aaa111', herdVersion: 1 } },
        toJSON: () => ({ data: { herdId: 'aaa111', herdVersion: 1 } })
      }
    ])
    const search = {
      text: 'ON HOLD',
      type: 'status'
    }
    const filter = {
      field: 'updatedAt',
      op: 'lte',
      value: '2025-01-16'
    }
    const offset = 20
    const limit = 50
    await searchClaims(search, filter, offset, limit)

    const expected = {
      include: [
        {
          attributes: ['data'],
          model: {
            findAll: expect.any(Function),
            update: expect.anything()
          }
        },
        {
          attributes: ['status'],
          model: 'mock-status',
          where: {
            status: {
              [Op.iLike]: '%ON HOLD%'
            }
          }
        },
        {
          as: 'flags',
          attributes: ['appliesToMh'],
          where: {
            deletedBy: null
          },
          required: false,
          model: 'mock-flag'
        }
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      where: {
        updatedAt: {
          [Op.lte]: '2025-01-16'
        }
      }
    }

    expect(buildData.models.claim.findAll.mock.calls).toEqual([[expected]])
  })
})
