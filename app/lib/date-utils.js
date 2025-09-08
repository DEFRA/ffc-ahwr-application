const parseDate = (date) => {
  const [day, month, year] = date.split('/')
  return new Date(year, month - 1, day)
}

export const startandEndDate = (date) => {
  const startDate = parseDate(date)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 1)
  return { startDate, endDate }
}

export const minusHours = (dateStr, hours) => {
  const date = new Date(dateStr)
  date.setHours(date.getHours() - hours)
  return date.toISOString()
}
