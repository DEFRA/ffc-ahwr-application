import Joi from 'joi'

const buildConfig = () => {
  const schema = Joi.object({
    connectionString: Joi.string().required(),
    usersContainer: Joi.string().required(),
    usersFile: Joi.string().required(),
    endemicsSettingsContainer: Joi.string().default('endemics-settings'),
    endemicsPricesFile: Joi.string().required(),
    storageAccount: Joi.string().required(),
    useConnectionString: Joi.bool().required()
  })

  const config = {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    usersContainer: 'users',
    usersFile: 'users.json',
    endemicsSettingsContainer: process.env.AZURE_STORAGE_ENDEMICS_SETTINGS_CONTAINER,
    endemicsPricesFile: 'endemics-prices-config.json',
    storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    useConnectionString: process.env.AZURE_STORAGE_USE_CONNECTION_STRING === 'true'
  }

  const { error } = schema.validate(config, {
    abortEarly: false
  })

  if (error) {
    throw new Error(`The blob storage config is invalid. ${error.message}`)
  }

  return config
}

export const storageConfig = buildConfig()
