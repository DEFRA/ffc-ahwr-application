describe('Application Repository test', () => {
  test('Application Repository returns Function', () => {
    const applicationRepository = require('../../../../../app/repositories/application-repository')
    expect(applicationRepository).toBeDefined()
  })
})
