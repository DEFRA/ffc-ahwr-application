const server = require('./server')

const init = async () => {
  await server.start()
  console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
  console.error(err)
  process.exit(1)
})

init()
