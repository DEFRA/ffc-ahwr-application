require('./insights').setup()
const Hapi = require('@hapi/hapi')

const server = Hapi.server({
  port: process.env.PORT
})

const routes = [].concat(
  require('./routes/healthy'),
  require('./routes/healthz'),
  require('./routes/api/applications'),
  require('./routes/api/users'),
  require('./routes/api/latest-applications'),
  require('./routes/api/application-history')
)

server.route(routes)

server.register(require('./plugins/process-compliance-application'))

module.exports = server
