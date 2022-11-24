const cron = require('node-cron')
const processApplication = require('../messaging/application/process-compliance-applications')

const registerScheduler = async () => {
  cron.schedule('0 9 * * 2-3', async () => {
    await processApplication([])
  })
}

const plugin = {
  name: 'processComplianceApplications',
  register: registerScheduler
}

module.exports = {
  plugin
}