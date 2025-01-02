import { server } from './server'
import { start, stop } from './messaging/service'
import { setup } from './insights'

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
