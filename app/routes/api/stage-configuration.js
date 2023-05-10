const { getAll } = require('../../repositories/stage-configuration-repository')

module.exports = [{
  method: 'GET',
  path: '/api/stageconfiguration',
  options: {
    handler: async (request, h) => {
      const stageConfiguration = await getAll()
      if (stageConfiguration) {
        return h.response(stageConfiguration).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}]
