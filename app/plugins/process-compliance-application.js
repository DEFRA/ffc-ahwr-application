const cron = require('node-cron')
const processComplianceApplications = require('../messaging/application/process-compliance-applications')
const { compliance } = require('../config')

module.exports = {
  plugin: {
    name: 'processComplianceApplications',
    register: async () => {
      console.log('before cron schedule')
      cron.schedule(compliance.scheduler, async () => {
        console.log('before process application')
        await processComplianceApplications()
        console.log('after process application')
      })
    }
  }
}
