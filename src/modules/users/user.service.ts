import { eq } from 'drizzle-orm'
import { users } from '@/db/schema'
import { db, redisClient } from '@/shared/db'

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
    return (await db.select().from(users).where(eq(users.id, id)))[0]
  }

  static async findOneByHduhelpId(hduhelpId: string) {
    return (await db.select().from(users).where(eq(users.hduhelpId, hduhelpId)))[0]
  }

  static async findOneByUuidMojang(uuidMojang: string) {
    return (await db.select().from(users).where(eq(users.uuidMojang, uuidMojang)))[0]
  }

  static async create(user: typeof users.$inferInsert) {
    return (await db.insert(users).values(user).returning())[0]
  }

  static async remove(id: number) {
    return (await db.delete(users).where(eq(users.id, id)))
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
