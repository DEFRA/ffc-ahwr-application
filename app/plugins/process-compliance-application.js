const cron = require('node-cron')
const processComplianceApplications = require('../messaging/application/process-compliance-applications')
const { compliance } = require('../config')

module.exports = {
  plugin: {
    name: 'processComplianceApplications',
    register: async () => {
      cron.schedule(compliance.scheduler, async () => {
        await processComplianceApplications()
      })
    }
  }
}
