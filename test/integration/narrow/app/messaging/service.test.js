describe('Service test', () => {
  test('Service returns Function', () => {
    const service = require('../../../../../app/messaging/service')
    expect(service).toBeDefined()
  })
})
