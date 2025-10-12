import { getVersionMarco } from '@/macros/version' with { type: 'macro' }
import { FatalError } from '@/shared/error-center.interface'

if (!process.env.MCV_SESSION_SECRET) {
  throw new FatalError('Missing MCV_SESSION_SECRET environment variable')
}
if (!process.env.MCV_SESSION_SALT) {
  throw new FatalError('Missing MCV_SESSION_SALT environment variable')
}
if (!process.env.MCV_REDIS_URL) {
  throw new FatalError('Missing MCV_REDIS_URL environment variable')
}
if (!process.env.MCV_HDUHELP_CLIENT_ID) {
  throw new FatalError('Missing MCV_HDUHELP_CLIENT_ID environment variable')
}
if (!process.env.MCV_HDUHELP_CLIENT_SECRET) {
  throw new FatalError('Missing MCV_HDUHELP_CLIENT_SECRET environment variable')
}
if (!process.env.MCV_HDUHELP_REDIRECT_URI) {
  throw new FatalError('Missing MCV_HDUHELP_REDIRECT_URI environment variable')
}

const { hash, version } = getVersionMarco()

const APP_REDIS_SCOPE = process.env.MCV_APP_REDIS_SCOPE || 'mcv'
const APP_HOST = process.env.MCV_APP_HOST || 'localhost'
const APP_PORT = process.env.MCV_APP_PORT ? Number(process.env.MCV_APP_PORT) : 3000
const APP_BASE_URL = process.env.MCV_APP_BASE_URL || `http://${APP_HOST}:${APP_PORT}`

export const CONFIG = {
  constant: {
    version,
    commit: hash,
    bun: Bun.version,
    environment: process.env.NODE_ENV || 'development',
  },
  app: {
    host: APP_HOST,
    port: APP_PORT,
    baseUrl: APP_BASE_URL,
  },
  hduhelp: {
    endpoint: process.env.MCV_HDUHELP_ENDPOINT || 'https://api.hduhelp.com/',
    clientId: process.env.MCV_HDUHELP_CLIENT_ID || '',
    clientSecret: process.env.MCV_HDUHELP_CLIENT_SECRET || '',
    redirectUri: process.env.MCV_HDUHELP_REDIRECT_URI || '',
  },
  session: {
    secret: process.env.MCV_SESSION_SECRET || '',
    salt: process.env.MCV_SESSION_SALT || '',
  },
  db: {
    sqliteFile: process.env.MCV_SQLITE_FILE || 'mcverify.db',
    redisUrl: process.env.MCV_REDIS_URL || '',
    redisScope: APP_REDIS_SCOPE,
  },
}
