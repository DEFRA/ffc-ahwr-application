const server = require('./server')
const messageService = require('./messaging/service')

const init = async () => {
  await messageService.start()
  await server.start()
  console.log('Server running on %s', server.info.uri)

  const db = require('./data')
  const applications = await db.models.application.findAll()
  console.log(`There are ${applications.length} applications`)
  applications.forEach(a => console.log(`Application ${a.id} with reference ${a.reference}`))
}

process.on('unhandledRejection', async (err) => {
  await messageService.stop()
  console.error(err)
  process.exit(1)
})

init()
