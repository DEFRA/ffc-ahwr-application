const { DefaultAzureCredential } = require('@azure/identity')

function isProd () {
  return process.env.NODE_ENV === 'production'
}

const hooks = {
  beforeConnect: async (cfg) => {
    console.time('[Performance] [db] connect')
    if (isProd()) {
      const credential = new DefaultAzureCredential()
      const accessToken = await credential.getToken('https://ossrdbms-aad.database.windows.net')
      cfg.password = accessToken.token
    }
  },
  afterConnect: async (cfg) => {
    console.timeEnd('[Performance] [db] connect')
  }
}

const retry = {
  backoffBase: 500,
  backoffExponent: 1.1,
  match: [/SequelizeConnectionError/],
  max: 10,
  name: 'connection',
  timeout: 60000
}

const dbConfig = {
  database: process.env.POSTGRES_DB,
  define: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  dialect: 'postgres',
  dialectOptions: {
    ssl: isProd()
  },
  hooks,
  host: process.env.POSTGRES_HOST,
  logging: process.env.POSTGRES_LOGGING || false,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  retry,
  schema: process.env.POSTGRES_SCHEMA_NAME,
  username: process.env.POSTGRES_USERNAME,
  pool: {
    max: 20,
    min: 5
  }
}

module.exports = {
  development: dbConfig,
  production: dbConfig,
  test: dbConfig
}
