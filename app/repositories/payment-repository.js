const { models } = require('../data')

async function get (reference) {
  return models.payment.findOne(
    {
      where: { applicationReference: reference }
    })
}

async function set (reference, data) {
  return models.payment.create({ applicationReference: reference, data })
}

async function updateByReference (reference, status, data) {
  return models.payment.update({ status, data },
    { where: { applicationReference: reference } })
}

module.exports = { get, set, updateByReference }
