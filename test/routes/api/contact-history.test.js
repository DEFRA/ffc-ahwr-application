const { expect } = require('chai')
const sinon = require('sinon')
const contactHistoryRepository = require('../../../app/repositories/contact-history-repository')
const applicationRepository = require('../../../app/repositories/application-repository')
const contactHistoryRoutes = require('../../../app/routes/api/contact-history')

describe('Contact History Routes', () => {
  describe('GET /api/application/contact-history/{ref}', () => {
    it('should return 200 and contact history when history exists', async () => {
      const ref = 'ABC123'
      const history = [
        {
          field: 'email',
          oldValue: 'old@email.com',
          newValue: 'new@email.com'
        }
      ]
      const getAllByApplicationReferenceSpy = sinon.spy(
        contactHistoryRepository,
        'getAllByApplicationReference'
      )
      getAllByApplicationReferenceSpy.withArgs(ref).returns(history)

      const res = await contactHistoryRoutes[0].options.handler(
        { params: { ref } },
        { response: () => ({ code: (code) => ({ code }) }) }
      )

      expect(res.code).to.equal(200)
      expect(res.source).to.deep.equal(history)
      getAllByApplicationReferenceSpy.restore()
    })

    it('should return 404 when no history found', async () => {
      const ref = 'ABC123'
      const getAllByApplicationReferenceSpy = sinon.spy(
        contactHistoryRepository,
        'getAllByApplicationReference'
      )
      getAllByApplicationReferenceSpy.withArgs(ref).returns([])

      const res = await contactHistoryRoutes[0].options.handler(
        { params: { ref } },
        {
          response: () => ({
            code: (code) => ({ code, takeover: () => ({ code }) })
          })
        }
      )

      expect(res.code).to.equal(404)
      getAllByApplicationReferenceSpy.restore()
    })
  })

  describe('PUT /api/application/contact-history', () => {
    it('should return 200 and update contact history when applications found', async () => {
      const payload = {
        user: 'user@email.com',
        farmerName: 'John Doe',
        orgEmail: 'org@email.com',
        email: 'new@email.com',
        address: '123 Main St',
        sbi: '123456789'
      }
      const applications = [
        {
          reference: 'ABC123',
          data: {
            organisation: {
              email: 'old@email.com',
              orgEmail: 'oldorg@email.com',
              address: '456 Oak St',
              farmerName: 'Jane Smith'
            }
          }
        }
      ]
      const getLatestApplicationsBySbiSpy = sinon.spy(
        applicationRepository,
        'getLatestApplicationsBySbi'
      )
      getLatestApplicationsBySbiSpy.withArgs(payload.sbi).returns(applications)
      const updateByReferenceSpy = sinon.spy(
        applicationRepository,
        'updateByReference'
      )
      const setContactHistorySpy = sinon.spy(contactHistoryRepository, 'set')

      const res = await contactHistoryRoutes[1].options.handler(
        { payload },
        { response: () => ({ code: (code) => ({ code }) }) }
      )

      expect(res.code).to.equal(200)
      expect(updateByReferenceSpy.calledOnce)
      expect(setContactHistorySpy.callCount).to.equal(4)
      getLatestApplicationsBySbiSpy.restore()
      updateByReferenceSpy.restore()
      setContactHistorySpy.restore()
    })

    it('should return 200 and not update when no applications found', async () => {
      const payload = {
        user: 'user@email.com',
        farmerName: 'John Doe',
        orgEmail: 'org@email.com',
        email: 'new@email.com',
        address: '123 Main St',
        sbi: '123456789'
      }
      const getLatestApplicationsBySbiSpy = sinon.spy(
        applicationRepository,
        'getLatestApplicationsBySbi'
      )
      getLatestApplicationsBySbiSpy.withArgs(payload.sbi).returns([])

      const res = await contactHistoryRoutes[1].options.handler(
        { payload },
        {
          response: () => ({
            code: (code) => ({ code, takeover: () => ({ code }) })
          })
        }
      )

      expect(res.code).to.equal(200)
      expect(res.source).to.equal('No applications found to update')
      getLatestApplicationsBySbiSpy.restore()
    })

    it('should return 400 when payload validation fails', async () => {
      const payload = {
        user: 'user@email.com',
        farmerName: 'John Doe',
        orgEmail: 'org@email.com',
        email: 'invalidemail',
        address: '123 Main St',
        sbi: '123456789'
      }
      const error = new Error('Invalid email')

      const res = await contactHistoryRoutes[1].options.validate.failAction(
        { payload },
        {
          response: () => ({
            code: (code) => ({ code, takeover: () => ({ code }) })
          })
        },
        error
      )

      expect(res.code).to.equal(400)
      expect(res.source.err).to.equal(error)
    })
  })
})
