import Hapi from '@hapi/hapi'
import { logger } from './logger'
import { healthHandlers } from './routes/health'
import { applicationHandlers } from './routes/api/applications'
import { latestApplicationsHandlers } from './routes/api/latest-applications'
import { applicationHistoryHandlers } from './routes/api/application-history'
import { stageConfiguationHandlers } from './routes/api/stage-configuration'
import { stageExecutionHandlers } from './routes/api/stage-execution'
import { applicationEventsHandlers } from './routes/api/application-events'
import { claimHandlers } from './routes/api/claim'
import { holidayHandlers } from './routes/api/holidays'
import { contactHistoryHandlers } from './routes/api/contact-history'

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
  ...holidayHandlers,
  ...contactHistoryHandlers
])

server.register(logger)
