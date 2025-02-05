import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity'

function isProd () {
  return process.env.NODE_ENV === 'production'
}

const hooks = {
  beforeConnect: async (cfg) => {
    if (isProd()) {
      const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID })
      cfg.password = getBearerTokenProvider(
        credential,
        'https://ossrdbms-aad.database.windows.net/.default'
      )
    }
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

export const dbConfig = {
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
