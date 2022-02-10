const createMessage = (body, type, options) => {
  return {
    body,
    type,
    source: 'ffc-ahwr-application',
    ...options
  }
}

module.exports = createMessage
