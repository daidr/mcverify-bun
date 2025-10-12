import { randomUUIDv7 } from 'bun'
import { Elysia } from 'elysia'

export const LogId = new Elysia({ name: 'LogId' })
  .on('request', ({ set, request: { headers } }) => {
    set.headers['X-Log-ID'] = headers.get('X-Log-ID') || randomUUIDv7()
  })
  .derive(({ set }) => {
    return {
      traceID: set.headers['X-Log-ID'],
    }
  })
  .as('global')
