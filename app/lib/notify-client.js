import { NotifyClient } from 'notifications-node-client'
import { config } from '../config/index.js'

const { notify: { apiKey } } = config

export const notifyClient = new NotifyClient(apiKey)
