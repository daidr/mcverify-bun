import { STARTUP_TEXT } from './constant/logo.constant'
import { migrateDB } from './shared/db'
import { logger } from './utils/consola'

logger.wrapAll()

logger.log(STARTUP_TEXT)

import('./app').then(async ({ start }) => {
  await migrateDB()
  start()
})

export type { MCVerifyBackend } from './app'
