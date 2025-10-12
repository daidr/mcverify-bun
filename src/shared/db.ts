import { RedisClient } from 'bun'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { CONFIG } from '@/config'
import { logger } from '@/utils/consola'

const dbClient = new Database(CONFIG.db.sqliteFile)

export const db = drizzle({ client: dbClient, casing: 'snake_case' })

export async function gracefulCloseDB() {
  logger.start('Waiting for database connection to close...')
  await dbClient.close()
  logger.success('Database connection closed.')
}

export const redisClient = new RedisClient(CONFIG.db.redisUrl)

export async function gracefulCloseRedis() {
  logger.start('Waiting for Redis connection to close...')
  redisClient.close()
  logger.success('Redis connection closed.')
}

export function buildRedisKey(...args: string[]) {
  const globalScope = CONFIG.db.redisScope
  const key = args.join(':')
  return `${globalScope}:${key}`
}
