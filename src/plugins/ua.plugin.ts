import { Elysia } from 'elysia'

export const UserAgent = new Elysia({ name: 'User-Agent' })
  .derive(({ request }) => {
    return {
      ua: request.headers.get('user-agent') || '',
    }
  })
  .as('global')
