const { models } = require('../data')

/**
 * Check today is Holiday
 * @returns true if today is holiday
 */
async function IsTodayHoliday () {
  const today = new Date().toISOString().split('T')[0]

  const holiday = await models.holiday.findOne({
    where: {
      date: today
    }
  })

  return !!holiday
}

async function set (date, description) {
  return await models.holiday.upsert({
    date,
    description
  })
}

module.exports = {
  IsTodayHoliday,
  set
}
