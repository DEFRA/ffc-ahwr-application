const server = require('./server')

const init = async () => {
  await server.start()
  console.log('Server running on %s', server.info.uri)

  const db = require('./data')
  const applications = await db.models.application.findAll()
  console.log(`There are ${applications.length} applications in the database`)
  applications.forEach(a => console.log(`Application ${a.applicationId} with reference ${a.reference}`))
}

process.on('unhandledRejection', (err) => {
  console.error(err)
  process.exit(1)
})

init()
