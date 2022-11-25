require('./insights').setup()
const Hapi = require('@hapi/hapi')

const server = Hapi.server({
  port: process.env.PORT
})

const routes = [].concat(
  require('./routes/healthy'),
  require('./routes/healthz'),
  require('./routes/api/applications'),
  require('./routes/api/users')
)

server.route(routes)

await server.register(require('./plugins/cron'))

module.exports = server
