import { server } from './server.js'
import { startMessagingService, stopMessagingService } from './messaging/service.js'
import { setup } from './insights.js'

const init = async () => {
  await startMessagingService()
  await server.start()
  setup()
}

process.on('unhandledRejection', async (err) => {
  await stopMessagingService()
  server.logger.error(err, 'unhandledRejection')
  process.exit(1)
})

init()
