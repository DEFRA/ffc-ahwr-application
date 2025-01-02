import { buildData } from '../data'

const { models } = buildData

export const isTodayHoliday = async () => {
  const today = new Date().toISOString().split('T')[0]

  const holiday = await models.holiday.findOne({
    where: {
      date: today
    }
  })

  return !!holiday
}

export const set = async (date, description) => {
  return await models.holiday.upsert({
    date,
    description
  })
}
