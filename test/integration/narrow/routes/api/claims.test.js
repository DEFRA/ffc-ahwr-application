import { server } from '../../../../../app/server'
import { buildData } from '../../../../../app/data'
import { findApplication } from '../../../../../app/repositories/application-repository.js'

jest.mock('../../../../../app/repositories/application-repository')

beforeEach(jest.resetAllMocks)

test('put /claims/{ref}/data update data property', async () => {
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
    updatedAt: new Date('2025/03/20')
  }

  findApplication.mockResolvedValueOnce({
    reference: 'FUSH-BAAH-1234',
    data: {
      organisation: {
        sbi: '123456789'
      }
    }
  })

  jest.spyOn(buildData.models.claim, 'update')
    .mockResolvedValueOnce([1, [{ dataValues: claim }]])
  jest.spyOn(buildData.models.claim_update_history, 'create')
    .mockResolvedValueOnce({})

  const note = "update vet's name"
  const res = await server.inject({
    method: 'put',
    url: '/api/claims/FUSH-BAAH-1234/data',
    payload: {
      vetsName: 'Barry Newman',
      note,
      user: 'Tim Test'
    }
  })

  expect(res.statusCode).toBe(204)
})

test('put /claims/{ref}/data data property same as existing', async () => {
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
    method: 'put',
    url: '/api/claims/FUSH-BAAH-1234/data',
    payload: {
      vetsName: 'Fred Already',
      note: 'same as before',
      user: 'B Test'
    }
  })

  expect(res.statusCode).toBe(204)
})

test('put /claims/{ref}/data missing claim', async () => {
  jest.spyOn(buildData.models.claim, 'findOne')
    .mockResolvedValueOnce(null)

  const res = await server.inject({
    method: 'put',
    url: '/api/claims/FUSH-BAAH-1234/data',
    payload: {
      vetRCVSNumber: '1234567',
      note: 'note',
      user: 'A Test'
    }
  })

  expect(res.statusCode).toBe(404)
})

test('put /claims/{ref}/data invalid payload: missing note', async () => {
  const res = await server.inject({
    method: 'put',
    url: '/api/claims/FUSH-BAAH-1234/data',
    payload: {
      dateOfVisit: '2025-03-20'
    }
  })

  expect(res.statusCode).toBe(400)
  const { err } = JSON.parse(res.payload)
  expect(err.details[0].message).toBe('"note" is required')
})

test('put /claims/{ref}/data invalid payload: missing data property', async () => {
  const res = await server.inject({
    method: 'put',
    url: '/api/claims/FUSH-BAAH-1234/data',
    payload: {
      note: 'no data properties',
      user: 'Tim Test'
    }
  })

  expect(res.statusCode).toBe(400)
  const { err } = JSON.parse(res.payload)
  expect(err.details[0].message)
    .toBe('"value" must contain at least one of [vetsName, dateOfVisit, vetRCVSNumber]')
})
