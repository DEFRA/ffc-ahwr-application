const parseDate = (date) => {
  const [day, month, year] = date.split('/')
  return new Date(year, month - 1, day)
}

const startandEndDate = (date) => {
  const startDate = parseDate(date)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 1)
  console.log(`Start Date: ${startDate} End Date: ${endDate}`)
  return { startDate, endDate }
}

module.exports = { startandEndDate }
