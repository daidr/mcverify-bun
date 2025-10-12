import { STARTUP_TEXT } from './constant/logo.constant'
import { logger } from './utils/consola'

logger.wrapAll()

logger.log(STARTUP_TEXT)

import('./app').then(async ({ start }) => {
  start()
})

export type { MCVerifyBackend } from './app'
