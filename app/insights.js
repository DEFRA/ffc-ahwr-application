import appInsights from 'applicationinsights'

export const setup = () => {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    appInsights.setup().start()
    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole
    appInsights.defaultClient.context.tags[cloudRoleTag] = process.env.APPINSIGHTS_CLOUDROLE ?? 'ffc-ahwr-application'
    return true
  }

  return false
}
