require('./insights').setup()
const Hapi = require('@hapi/hapi')

const server = Hapi.server({
  port: process.env.PORT
})

const routes = [].concat(
  require('./routes/healthy'),
  require('./routes/healthz'),
  require('./routes/api/applications'),
  require('./routes/api/latest-applications'),
  require('./routes/api/application-history'),
  require('./routes/api/stage-configuration'),
  require('./routes/api/stage-execution'),
  require('./routes/api/application-events'),
  require('./routes/api/claim'),
  require('./routes/api/holidays'),
  require('./routes/api/contact-history')
)

server.route(routes)

module.exports = server
