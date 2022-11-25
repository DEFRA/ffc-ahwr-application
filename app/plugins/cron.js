const cron = require('node-cron')
const processApplication = require('../messaging/application/process-compliance-applications')

module.exports = {
  plugin: {
    name: 'processComplianceApplications',
    register:  async () => {
      cron.schedule('0 9 * * 2-3', async () => {
        await processApplication([])
      })
    }
  }
}
