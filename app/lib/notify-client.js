import { NotifyClient } from 'notifications-node-client'
import { config } from '../config'

const { notify: { apiKey } } = config

export const notifyClient = new NotifyClient(apiKey)
