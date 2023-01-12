const server = require('./server')
const messageService = require('./messaging/service')

const init = async () => {
  try {
    console.log('before start message service')
    await messageService.start()
    console.log('before start server')
    await server.start()
    console.log('Server running on %s', server.info.uri)
  } catch (error) {
    console.error(error)
  }
}

process.on('unhandledRejection', async (err) => {
  await messageService.stop()
  console.error(err)
  process.exit(1)
})

init()
