import { db, redisClient } from '@/shared/db'

export interface UserEntity {
  id: number
  hduhelpId: string
  uuidMojang: string
}

export interface CreateUserInput {
  hduhelpId: string
  uuidMojang: string
}

function safeJSONParse<T>(str: string | null | undefined): T | undefined {
  if (!str) {
    return undefined
  }
  try {
    return JSON.parse(str)
  }
  catch {
    return undefined
  }
}

export abstract class UserService {
  static async findOneById(id: number) {
    const stmt = db.query(
      'SELECT id, hduhelpId, uuidMojang FROM users WHERE id = $id LIMIT 1',
    )
    return stmt.get({ $id: id }) as UserEntity | undefined
  }

  static async findOneByHduhelpId(hduhelpId: string) {
    const stmt = db.query(
      'SELECT id, hduhelpId, uuidMojang FROM users WHERE hduhelpId = $hduhelpId LIMIT 1',
    )
    return stmt.get({ $hduhelpId: hduhelpId }) as UserEntity | undefined
  }

  static async findOneByUuidMojang(uuidMojang: string) {
    const stmt = db.query(
      'SELECT id, hduhelpId, uuidMojang FROM users WHERE uuidMojang = $uuidMojang LIMIT 1',
    )
    return stmt.get({ $uuidMojang: uuidMojang }) as UserEntity | undefined
  }

  static async create(user: CreateUserInput) {
    const insert = db.query(
      'INSERT INTO users (hduhelpId, uuidMojang) VALUES ($hduhelpId, $uuidMojang) RETURNING id, hduhelpId, uuidMojang',
    )
    return insert.get({ $hduhelpId: user.hduhelpId, $uuidMojang: user.uuidMojang }) as UserEntity
  }

  static async remove(id: number) {
    const del = db.query('DELETE FROM users WHERE id = $id')
    del.run({ $id: id })
  }

  static async removeVerifyCodeByUuidMojang(uuidMojang: string) {
    redisClient.del(`mcv:verify_code:${uuidMojang}`)
  }

  static async findVerifyCodeByUuidMojang(uuidMojang: string): Promise<{
    code: string
    createdAt: number
  } | undefined> {
    const result = await redisClient.get(`mcv:verify_code:${uuidMojang}`)
    return safeJSONParse(result)
  }

  static async setVerifyCodeByUuidMojang(uuidMojang: string, code: string) {
    const data = {
      code,
      createdAt: Date.now(),
    }
    await redisClient.set(`mcv:verify_code:${uuidMojang}`, JSON.stringify(data), 'EX', 60 * 5)
    return data
  }

  static async findNicknameByUuidMojang(uuidMojang: string): Promise<string | undefined> {
    const result = await redisClient.get(`mcv:mojang_nickname:${uuidMojang}`)
    if (!result) {
      const result = await fetch(
        `https://sessionserver.mojang.com/session/minecraft/profile/${uuidMojang.replaceAll(
          '-',
          '',
        )}`,
      )
      const data = await result.json() as { name: string }

      await redisClient.set(
        `mcv:mojang_nickname:${uuidMojang}`,
        data.name,
        'EX',
        12 * 60 * 60,
      )

      return data.name
    }

    return result
  }

  static async getAvatarUrlByUuidMojang(uuidMojang: string): Promise<string> {
    return `https://crafatar.com/avatars/${uuidMojang.replaceAll('-', '')}?size=100&overlay`
  }
}
