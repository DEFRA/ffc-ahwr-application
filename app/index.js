import { server } from './server.js'
import { start, stop } from './messaging/service.js'
import { setup } from './insights.js'

const init = async () => {
  await start()
  await server.start()
  setup()
}

process.on('unhandledRejection', async (err) => {
  await stop()
  server.logger.error(err, 'unhandledRejection')
  process.exit(1)
})

init()
