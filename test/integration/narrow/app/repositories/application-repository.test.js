describe('Application Repository test', () => {
  test('Application Repository returns Function', () => {
    const applicationRepository = require('../../../../../app/messaging/application-repository')
    expect(applicationRepository).toBeDefined()
  })
})
