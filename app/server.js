import Hapi from '@hapi/hapi'
import { logger } from './logger.js'
import { healthHandlers } from './routes/health.js'
import { applicationHandlers } from './routes/api/applications.js'
import { latestApplicationsHandlers } from './routes/api/latest-applications.js'
import { latestContactDetailsHandlers } from './routes/api/latest-contact-details.js'
import { applicationHistoryHandlers } from './routes/api/application-history.js'
import { stageConfiguationHandlers } from './routes/api/stage-configuration.js'
import { stageExecutionHandlers } from './routes/api/stage-execution.js'
import { applicationEventsHandlers } from './routes/api/application-events.js'
import { claimHandlers } from './routes/api/claim.js'
import { claimsHandlers } from './routes/api/claims.js'
import { holidayHandlers } from './routes/api/holidays.js'
import { contactHistoryHandlers } from './routes/api/contact-history.js'
import { flagHandlers } from './routes/api/flags.js'
import { redactPiiRequestHandlers } from './routes/api/redact-pii.js'

export const server = Hapi.server({
  port: process.env.PORT
})

server.route([
  ...healthHandlers,
  ...applicationHandlers,
  ...latestApplicationsHandlers,
  ...applicationHistoryHandlers,
  ...stageConfiguationHandlers,
  ...stageExecutionHandlers,
  ...applicationEventsHandlers,
  ...claimHandlers,
  ...claimsHandlers,
  ...holidayHandlers,
  ...contactHistoryHandlers,
  ...latestContactDetailsHandlers,
  ...flagHandlers,
  ...redactPiiRequestHandlers
])

server.register(logger)
