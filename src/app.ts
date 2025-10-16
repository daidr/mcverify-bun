import { randomUUIDv7 } from 'bun'
import { randomBytes } from 'node:crypto'
import cors from '@elysiajs/cors'
import serverTiming from '@elysiajs/server-timing'
import staticPlugin from '@elysiajs/static'
import { Elysia, redirect, t } from 'elysia'
import { run } from 'fake-verify-server'
import { CONFIG } from './config'
import { OauthService } from './modules/oauth/oauth.service'
import { UserService } from './modules/users/user.service'
import { ErrorHandler } from './plugins/error.plugin'
import { ip } from './plugins/ip.plugin'
import { LogId } from './plugins/log-id.plugin'
import { UserAgent } from './plugins/ua.plugin'
import { COOKIE_SCHEMA, decrypt, encrypt } from './shared/cookie'
import { gracefulCloseDB, gracefulCloseRedis } from './shared/db'
import { template } from './shared/template'
import { logger } from './utils/consola'
import { ellipsisUuid, getUrl } from './utils/string'

const app = new Elysia({
  serve: {
    id: 'MCVerify Entry',
    idleTimeout: 60,
  },
  cookie: {
    sign: true,
    secure: true,
    httpOnly: true,
    secrets: [CONFIG.session.secret],
    sameSite: 'lax',
  },
})
  .use(ErrorHandler)
  .use(LogId)
  .use(ip)
  .use(UserAgent)
  .use(cors())
  .use(serverTiming())
  .use(staticPlugin())
  .get('/privacy', ({ set }) => {
    set.headers['Content-Type'] = 'text/html; charset=utf-8'
    return template.privacy({
      CURRENT_YEAR: new Date().getFullYear(),
    })
  })
  .get('/whatis', ({ set }) => {
    set.headers['Content-Type'] = 'text/html; charset=utf-8'
    return template.whatIs({
      CURRENT_YEAR: new Date().getFullYear(),
    })
  })
  .get('/unbind', async ({ cookie }) => {
    const hduhelpId = decrypt(cookie.hduhelpId.value)
    const isLoggedIn = !!hduhelpId
    if (!isLoggedIn) {
      return redirect('/', 302)
    }
    else {
      const userData = await UserService.findOneByHduhelpId(hduhelpId)
      if (userData && userData.uuidMojang) {
        await UserService.remove(userData.id)
      }
      return redirect('/', 302)
    }
  }, {
    cookie: COOKIE_SCHEMA,
  })
  .get('/', async ({ cookie, set }) => {
    set.headers['Content-Type'] = 'text/html; charset=utf-8'
    const hduhelpId = decrypt(cookie.hduhelpId.value)
    const isLoggedIn = !!hduhelpId
    if (!isLoggedIn) {
      return template.index({
        isLoggedIn,
        CURRENT_YEAR: new Date().getFullYear(),
      })
    }
    else {
      const userData = await UserService.findOneByHduhelpId(hduhelpId)
      let nickname: string | undefined, avatar: string | undefined
      if (userData && userData.uuidMojang) {
        [nickname, avatar] = await Promise.all([
          UserService.findNicknameByUuidMojang(userData.uuidMojang),
          UserService.getAvatarUrlByUuidMojang(userData.uuidMojang),
        ])
      }
      return template.index({
        isLoggedIn,
        hduhelpId: ellipsisUuid(hduhelpId),
        mojangUuid: userData && userData.uuidMojang,
        mojangName: nickname,
        mojangAvatar: avatar,
        CURRENT_YEAR: new Date().getFullYear(),
      })
    }
  }, {
    cookie: COOKIE_SCHEMA,
  })
  .get('/logout', ({ cookie }) => {
    cookie.hduhelpId.remove()
    cookie.hduhelpState.remove()
    cookie.redirectUrl.remove()
    cookie.verifyCode.remove()
    cookie.verifyUuid.remove()
    return redirect('/', 302)
  }, {
    cookie: COOKIE_SCHEMA,
  })
  .get('/jump', ({ cookie }) => {
    const hduhelpEndpoint = CONFIG.hduhelp.endpoint
    const hduhelpClientId = CONFIG.hduhelp.clientId
    const hduhelpRedirectUri = CONFIG.hduhelp.redirectUri
    const tempState = randomUUIDv7()
    cookie.hduhelpState.set({
      value: encrypt(tempState),
      maxAge: 60 * 5,
    })

    // 生成 oauth 跳转链接
    const oauthUrl = getUrl(hduhelpEndpoint, '/oauth/authorize', {
      response_type: 'code',
      client_id: hduhelpClientId,
      redirect_uri: hduhelpRedirectUri,
      state: tempState,
    })

    // 重定向
    return redirect(oauthUrl.toString(), 302)
  }, {
    cookie: COOKIE_SCHEMA,
  })
  .get('/callback', async ({ cookie, query }) => {
    const { code, state } = query
    // state 不一致，请求无效
    const tempState = decrypt(cookie.hduhelpState.value)
    if (!tempState || !state || state !== tempState) {
      return redirect('/', 302)
    }

    // 重置 state cookie
    cookie.hduhelpState.remove()

    // 获取 token
    try {
      const userInfo = await OauthService.getHduhelpUserByCode(code, state)
      // 保存 session
      cookie.hduhelpId.set({
        value: encrypt(userInfo.user_id),
        maxAge: 60 * 60,
      })
      // 获取重定向目标
      const redirectUrl = decrypt(cookie.redirectUrl.value)
      cookie.redirectUrl.remove()
      return redirect(redirectUrl || '/', 302)
    }
    catch (error) {
      logger.error(error)
      return redirect('/', 302)
    }
  }, {
    cookie: COOKIE_SCHEMA,
    query: t.Object({
      code: t.String(),
      state: t.String(),
    }),
  })
  .get('/verify/:code/:uuid', async ({ params, set, cookie }) => {
    const { code, uuid } = params
    set.headers['Content-Type'] = 'text/html; charset=utf-8'
    const verifyCode = await UserService.findVerifyCodeByUuidMojang(uuid)
    if (!verifyCode || verifyCode.code !== code) {
      return template.verify({
        error: true,
        msg: '链接无效',
        CURRENT_YEAR: new Date().getFullYear(),
      })
    }
    const hduhelpId = decrypt(cookie.hduhelpId.value)
    const isLoggedIn = !!hduhelpId
    if (!isLoggedIn) {
      cookie.redirectUrl.set({
        value: encrypt(`/verify/${code}/${uuid}`),
        maxAge: 60 * 5,
      })
      return redirect('/', 302)
    }
    else {
      cookie.verifyCode.set({
        value: encrypt(code),
        maxAge: 60 * 5,
      })
      cookie.verifyUuid.set({
        value: encrypt(uuid),
        maxAge: 60 * 5,
      })
      const [nickname, avatar] = await Promise.all([
        UserService.findNicknameByUuidMojang(uuid),
        UserService.getAvatarUrlByUuidMojang(uuid),
      ])
      return template.verify({
        error: false,
        isLoggedIn,
        hduhelpId: ellipsisUuid(hduhelpId),
        mojangUuid: uuid,
        mojangName: nickname,
        mojangAvatar: avatar,
        verifyCode: code,
        CURRENT_YEAR: new Date().getFullYear(),
      })
    }
  }, {
    cookie: COOKIE_SCHEMA,
  })
  .get('/verify/:code/:uuid/deny', async ({ cookie, params, set }) => {
    const { code, uuid } = params
    set.headers['Content-Type'] = 'text/html; charset=utf-8'
    const prevCode = decrypt(cookie.verifyCode.value)
    const prevUuid = decrypt(cookie.verifyUuid.value)
    if (prevCode !== code || prevUuid !== uuid) {
      return redirect(`/verify/${code}/${uuid}`, 302)
    }
    const verifyCode = await UserService.findVerifyCodeByUuidMojang(uuid)
    if (!verifyCode || verifyCode.code !== code) {
      return template.verify({
        error: true,
        msg: '链接无效',
        CURRENT_YEAR: new Date().getFullYear(),
      })
    }
    const hduhelpId = decrypt(cookie.hduhelpId.value)
    const isLoggedIn = !!hduhelpId
    if (!isLoggedIn) {
      return template.verify({
        error: true,
        msg: '会话过期，请重新登录',
        CURRENT_YEAR: new Date().getFullYear(),
      })
    }
    else {
      cookie.verifyCode.remove()
      cookie.verifyUuid.remove()
      await UserService.removeVerifyCodeByUuidMojang(uuid)
      return redirect('/', 302)
    }
  }, {
    cookie: COOKIE_SCHEMA,
  })
  .get('/verify/:code/:uuid/confirm', async ({ cookie, params, set }) => {
    const { code, uuid } = params
    set.headers['Content-Type'] = 'text/html; charset=utf-8'
    const prevCode = decrypt(cookie.verifyCode.value)
    const prevUuid = decrypt(cookie.verifyUuid.value)
    if (prevCode !== code || prevUuid !== uuid) {
      return redirect(`/verify/${code}/${uuid}`, 302)
    }
    const verifyCode = await UserService.findVerifyCodeByUuidMojang(uuid)
    if (!verifyCode || verifyCode.code !== code) {
      return template.verify({
        error: true,
        msg: '链接无效',
        CURRENT_YEAR: new Date().getFullYear(),
      })
    }
    const hduhelpId = decrypt(cookie.hduhelpId.value)
    const isLoggedIn = !!hduhelpId
    if (!isLoggedIn) {
      return template.verify({
        error: true,
        msg: '会话过期，请重新登录',
        CURRENT_YEAR: new Date().getFullYear(),
      })
    }
    else {
      cookie.verifyCode.remove()
      cookie.verifyUuid.remove()
      await UserService.removeVerifyCodeByUuidMojang(uuid)
      await UserService.create({
        hduhelpId,
        uuidMojang: uuid,
      })
      return redirect('/', 302)
    }
  }, {
    cookie: COOKIE_SCHEMA,
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

async function getVerifyStatus(uuid: string): Promise<{
  code: -1
} | {
  code: 0 | 1
  data: {
    createdAt: number
    code: string
  }
}> {
  const user = await UserService.findOneByUuidMojang(uuid)
  if (user) {
    return {
      code: -1,
    }
  }

  const verifyCode = await UserService.findVerifyCodeByUuidMojang(uuid)

  if (!verifyCode) {
    const code = randomBytes(8).toString('hex')
    const result = await UserService.setVerifyCodeByUuidMojang(
      uuid,
      code,
    )
    return {
      code: 0,
      data: result,
    }
  }
  else {
    // 已存在验证码
    return {
      code: 1,
      data: verifyCode,
    }
  }
}

export type getVerifyStatusFn = typeof getVerifyStatus

const fakeVerifyServer = run(getVerifyStatus)

fakeVerifyServer.once('listening', () => {
  logger.success(`fake-verify-server is runing at localhost:25565`)
})

process.on('SIGINT', async () => {
  await stop()
})

async function stop() {
  const startTime = Bun.nanoseconds()
  logger.start('Ctrl-C was pressed, shutting down...')
  logger.start('Shutting down fake-verify-server...')
  fakeVerifyServer.close()
  logger.success('fake-verify-server stopped.')
  logger.start('Waiting for all requests to finish...')
  await app.stop()
  logger.success('Elysia server stopped.')
  await Promise.allSettled([gracefulCloseDB(), gracefulCloseRedis()])
  const endTime = Bun.nanoseconds()
  const duration = (endTime - startTime) / 1e6
  logger.success(`MCVerify shutdown gracefully in ${duration} ms.`)
  process.exit(0)
}

export type MCVerifyBackend = typeof app
