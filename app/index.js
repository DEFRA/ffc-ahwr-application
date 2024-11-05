const server = require('./server')
const messageService = require('./messaging/service')

const init = async () => {
  await messageService.start()
  await server.start()
}

process.on('unhandledRejection', async (err) => {
  await messageService.stop()
  server.logger.error(err, 'unhandledRejection')
  process.exit(1)
})

init()
