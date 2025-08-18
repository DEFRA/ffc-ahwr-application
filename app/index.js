import { appInsightsEnabled, server } from './server.js'
import { startMessagingService, stopMessagingService } from './messaging/service.js'

const init = async () => {
  await startMessagingService(server.logger)
  await server.start()

  server.logger.info(`Application Insights ${appInsightsEnabled ? '' : 'not '}running`)
}

process.on('unhandledRejection', async (err) => {
  await stopMessagingService()
  server.logger.error(err, 'unhandledRejection')
  process.exit(1)
})

init()
