const downloadBlob = require('../lib/download-blob')
const { storage: { usersContainer, usersFile } } = require('../config')

async function getUsers () {
  const contents = await downloadBlob(usersContainer, usersFile) ?? '[]'
  return JSON.parse(contents)
}

async function getByEmail (email) {
  return (await getUsers()).find(x => x.email.toLowerCase() === email.toLowerCase())
}

module.exports = {
  getByEmail
}
