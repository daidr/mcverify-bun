import { int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable(
  'users',
  {
    id: int().primaryKey({ autoIncrement: true }).unique(),
    hduhelpId: text().notNull().unique(),
    uuidMojang: text().unique(),
  },
  table => [
    uniqueIndex('hduhelp_id_idx').on(table.hduhelpId),
    uniqueIndex('uuid_mojang_idx').on(table.uuidMojang),
  ],
)
