const { models } = require('../data')

/**
 * Check today is Holiday
 * @returns true if today is holiday
 */
async function IsTodayHoliday () {
  const today = new Date()

  const holiday = await models.Holiday.findOne({
    where: {
      date: today
    }
  })

  return !!holiday
}

models.Holiday.prototype.setHoliday = async function (date, description) {
  await this.update({
    date,
    description
  })
}

module.exports = {
  IsTodayHoliday
}
