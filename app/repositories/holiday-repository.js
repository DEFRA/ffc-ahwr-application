const { models } = require('../data')
const dateLocate = 'en-us'
const dateOptions = { year: 'numeric', month: 'numeric', day: 'numeric' }

/**
 * Check today is Holiday
 * @returns true if today is holiday
 */
async function IsTodayHoliday () {
  const today = new Date().toLocaleDateString(dateLocate, dateOptions)

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
