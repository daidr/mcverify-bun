import { RedisClient } from 'bun'
import { Database } from 'bun:sqlite'
import { CONFIG } from '@/config'
import { logger } from '@/utils/consola'

export const db = new Database(CONFIG.db.sqliteFile)

db.run('PRAGMA journal_mode = WAL;')

export async function gracefulCloseDB() {
  logger.start('Waiting for database connection to close...')
  db.close()
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

export async function migrateDB() {
  logger.start('Running SQLite migration...')

  const existsRow = db
    .query('SELECT COUNT(1) AS cnt FROM sqlite_master WHERE type=\'table\' AND name=\'users\'')
    .get() as { cnt: number } | undefined

  const hasUsersTable = !!existsRow && Number(existsRow.cnt) > 0

  if (!hasUsersTable) {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hduhelpId TEXT NOT NULL,
        uuidMojang TEXT NOT NULL
      );
    `)
    logger.info('Created table: users')
  }
  else {
    logger.info('Table exists: users')
  }

  db.run('CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);')
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_hduhelp_id ON users(hduhelpId);')
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uuid_mojang ON users(uuidMojang);')

  logger.success('SQLite migration completed.')
}
