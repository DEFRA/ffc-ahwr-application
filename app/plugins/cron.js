const cron = require('node-cron')
const processComplianceApplications = require('../messaging/application/process-compliance-applications')
const { complianceScheduler } = require('../config')

module.exports = {
  plugin: {
    name: 'processComplianceApplications',
    register: async () => {
      cron.schedule(complianceScheduler, async () => {
        await processComplianceApplications()
      })
    }
  }
}
