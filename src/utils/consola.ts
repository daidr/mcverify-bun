import type { ConsolaOptions } from 'consola'

import { createConsola, LogLevels } from 'consola'

function createLoggerConsola(options?: ConsolaOptions) {
  const consola = createConsola({
    formatOptions: {
      date: true,
    },

    level: process.env.NODE_ENV === 'development' ? LogLevels.trace : LogLevels.info,
    ...options,
  })

  return consola
}

export const logger = createLoggerConsola()
