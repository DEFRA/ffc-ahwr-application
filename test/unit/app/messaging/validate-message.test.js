
const validator = require('../../../../app/messaging/validate-message')

describe(('Validate message tests'), () => {
  test('returns false if application not exists', async () => {
    const response = validator.validateApplication(null)
    expect(response).toBe(false)
  })
  test('returns false if application already submitted by vet', async () => {
    const response = validator.validateApplication({ vetVisit: { dataValues: { reference: 'VV-B977-4D0D' } } })
    expect(response).toBe(false)
  })
  test('returns true if application exists and not submitted by vet', async () => {
    const response = validator.validateApplication({ vetVisit: null })
    expect(response).toBe(true)
  })
})
