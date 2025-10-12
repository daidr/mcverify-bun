import cors from '@elysiajs/cors'
import serverTiming from '@elysiajs/server-timing'
import { Elysia } from 'elysia'
import { CONFIG } from './config'
import { ErrorHandler } from './plugins/error.plugin'
import { ip } from './plugins/ip.plugin'
import { LogId } from './plugins/log-id.plugin'
import { UserAgent } from './plugins/ua.plugin'
import { gracefulCloseDB, gracefulCloseRedis } from './shared/db'
import { logger } from './utils/consola'

const app = new Elysia({
  serve: {
    id: 'MCVerify Entry',
    idleTimeout: 60,
  },
})
  .use(ErrorHandler)
  .use(LogId)
  .use(ip)
  .use(UserAgent)
  .use(cors())
  .use(serverTiming())
  .get('/', () => `Hello World from MCVerify Backend ${CONFIG.constant.version} (${CONFIG.constant.commit})`)
  .group('/api', (app) => {
    return app
  })

export async function start() {
  app.listen({
    port: CONFIG.app.port,
    hostname: CONFIG.app.host,
  })
  logger.ready(
    `MCVerify is running at ${app.server?.url}`,
  )
}

if (process.env.NODE_ENV !== 'development') {
  process.on('SIGINT', async () => {
    const startTime = Bun.nanoseconds()
    logger.start('Ctrl-C was pressed, shutting down...')
    logger.start('Waiting for all requests to finish...')
    await app.stop()
    logger.success('Elysia server stopped.')
    await Promise.allSettled([gracefulCloseDB(), gracefulCloseRedis()])
    const endTime = Bun.nanoseconds()
    const duration = (endTime - startTime) / 1e6
    logger.success(`MCVerify shutdown gracefully in ${duration} ms.`)
    process.exit(0)
  })
}

export type MCVerifyBackend = typeof app
