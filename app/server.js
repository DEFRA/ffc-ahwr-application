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
  require('./routes/api/application-history'),
  require('./routes/api/stage-configuration'),
  require('./routes/api/stage-execution')
)

server.route(routes)

module.exports = server
