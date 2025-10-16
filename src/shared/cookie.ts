import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import { t } from 'elysia'
import { CONFIG } from '@/config'
import { logger } from '@/utils/consola'

export const COOKIE_SCHEMA = t.Cookie({
  hduhelpId: t.Optional(t.String()),
  hduhelpState: t.Optional(t.String()),
  redirectUrl: t.Optional(t.String()),
  verifyCode: t.Optional(t.String()),
  verifyUuid: t.Optional(t.String()),
})

const key = crypto.scryptSync(CONFIG.session.secret, 'salt', 32)
const iv = Buffer.alloc(16, 0)

export function encrypt(str: string) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  return cipher.update(str, 'utf8', 'base64') + cipher.final('base64')
}

export function decrypt(str: string | undefined) {
  if (str === undefined) {
    return undefined
  }
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    return decipher.update(str, 'base64', 'utf8') + decipher.final('utf8')
  }
  catch (error) {
    logger.error('Decrypt cookie failed', error)
    return undefined
  }
}
