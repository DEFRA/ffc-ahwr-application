import appInsights from 'applicationinsights'

export const setup = (logger) => {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    appInsights.setup().start()
    logger.info('App Insights Running')
    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole
    const appName = process.env.APPINSIGHTS_CLOUDROLE
    appInsights.defaultClient.context.tags[cloudRoleTag] = appName
  } else {
    logger.info('App Insights Not Running!')
  }
}
