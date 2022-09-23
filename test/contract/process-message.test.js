const path = require('path')
const { MessageConsumerPact, Matchers } = require('@pact-foundation/pact')
const { set } = require('../../app/repositories/application-repository')
const dbHelper = require('../db-helper')

describe('receiving a new claim', () => {
  let messagePact

  beforeAll(async () => {
    await dbHelper.truncate()

    messagePact = new MessageConsumerPact({
      consumer: 'ffc-ahwr-application',
      provider: 'ffc-ahwr-frontend',
      log: path.resolve(process.cwd(), 'test-output', 'pact.log'),
      dir: path.resolve(process.cwd(), 'test-output')
    })
  }, 30000)

  afterAll(async () => {
    await dbHelper.close()
  }, 30000)

  test('new farmer application is received, saved', async () => {
    await messagePact
      .given('valid message')
      .expectsToReceive('a request for new farmer application')
      .withContent({
        email: Matchers.email(),
        reference: Matchers.like('AHWR-'),
        data: Matchers.like('{pigs: yes}'),
        createdBy: Matchers.like('admin'),
        updatedBy: Matchers.like('admin')
      })
      .withMetadata({
        'content-type': 'application/json'
      })
      .verify(message => {
        set(message.contents)
      })
  })
})
