module.exports.validateApplication = (application) => {
  if (!application || application?.vetVisit?.dataValues) return false
  return true
}
