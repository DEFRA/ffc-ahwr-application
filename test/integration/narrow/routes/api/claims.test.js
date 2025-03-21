import { server } from '../../../../../app/server'
import { buildData } from '../../../../../app/data'
import { raiseClaimEvents } from '../../../../../app/event-publisher'

jest.mock('../../../../../app/event-publisher')

beforeEach(jest.resetAllMocks)

test('patch /claims/{ref}/data update data property', async () => {
  jest.spyOn(buildData.models.claim, 'findOne')
    .mockResolvedValueOnce({
      dataValues: {
        reference: 'FUSH-BAAH-1234',
        data: {
          vetsName: 'Jane Oldman'
        }
      }
    })

  const claim = {
    updatedBy: 'me',
    updatedOn: '2025-03-20T12:12:28.590Z'
  }

  jest.spyOn(buildData.models.claim, 'update')
    .mockResolvedValueOnce([1, [{ dataValues: claim }]])

  const note = "update vet's name"
  const res = await server.inject({
    method: 'patch',
    url: '/api/claims/FUSH-BAAH-1234/data',
    payload: {
      vetsName: 'Barry Newman',
      note
    }
  })

  expect(res.statusCode).toBe(204)
  expect(raiseClaimEvents.mock.calls).toEqual([
    [{
      claim,
      message: 'Claim has been updated',
      note,
      raisedBy: claim.updatedBy,
      raisedOn: claim.updatedOn
    }]
  ])
})

test('patch /claims/{ref}/data data property same as existing', async () => {
  jest.spyOn(buildData.models.claim, 'findOne')
    .mockResolvedValueOnce({
      dataValues: {
        reference: 'FUSH-BAAH-1234',
        data: {
          vetsName: 'Fred Already'
        }
      }
    })

  const res = await server.inject({
    method: 'patch',
    url: '/api/claims/FUSH-BAAH-1234/data',
    payload: {
      vetsName: 'Fred Already',
      note: 'same as before'
    }
  })

  expect(res.statusCode).toBe(204)
  expect(raiseClaimEvents.mock.calls).toEqual([])
})

test('patch /claims/{ref}/data missing claim', async () => {
  jest.spyOn(buildData.models.claim, 'findOne')
    .mockResolvedValueOnce(null)

  const res = await server.inject({
    method: 'patch',
    url: '/api/claims/FUSH-BAAH-1234/data',
    payload: {
      vetRCVSNumber: '1234567',
      note: 'note'
    }
  })

  expect(res.statusCode).toBe(404)
  expect(raiseClaimEvents.mock.calls).toEqual([])
})

test('patch /claims/{ref}/data invalid payload: missing note', async () => {
  const res = await server.inject({
    method: 'patch',
    url: '/api/claims/FUSH-BAAH-1234/data',
    payload: {
      dateOfVisit: '2025-03-20'
    }
  })

  expect(res.statusCode).toBe(400)
  const { err } = JSON.parse(res.payload)
  expect(err.details[0].message).toBe('"note" is required')
})

test('patch /claims/{ref}/data invalid payload: missing data property', async () => {
  const res = await server.inject({
    method: 'patch',
    url: '/api/claims/FUSH-BAAH-1234/data',
    payload: {
      note: 'no data properties'
    }
  })

  expect(res.statusCode).toBe(400)
  const { err } = JSON.parse(res.payload)
  expect(err.details[0].message)
    .toBe('"value" must contain at least one of [vetsName, dateOfVisit, vetRCVSNumber]')
})
