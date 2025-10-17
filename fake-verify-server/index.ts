import type { getVerifyStatusFn } from '../src/app'
import { stringWidth } from 'bun'
import { heapStats } from 'bun:jsc'
import { createServer } from 'minecraft-protocol'
import prettyBytes from 'pretty-bytes'
import nbt from 'prismarine-nbt'
// import loginTags from './loginTags.json' with { type: 'json' }
import {
  sendBossbarPacket,
  sendUniformChatPacket,
} from './utils/chatPacket'
import { sendLoginPacket } from './utils/loginPacket'
import { getMcDataByVersion } from './utils/mcdata'

function padUnicodeRight(str: string, length: number, padStr: string = ' ') {
  return str + padStr.repeat(length - stringWidth(str))
}

function secondsToFriendlyString(seconds: number, units: [string, string] = ['分', '秒']) {
  if (seconds <= 60) {
    return seconds + units[1]
  }
  else {
    return Math.floor(seconds / 60) + units[0] + (seconds % 60) + units[1]
  }
}

const apiEndpoint = process.env.MCV_ENDPOINT

if (!apiEndpoint || !apiEndpoint.startsWith('http') || !apiEndpoint.includes('://')) {
  throw new Error('必须提供有效的 apiEndpoint')
}

export function run(getVerifyStatus: getVerifyStatusFn) {
  const options = {
    motd: '§6§lMC §2§lVerify',
    favicon:
      'data:image/png;base64,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',
  }

  function getProcessInfo() {
    const memoryUsageValue = process.memoryUsage()
    const heapStatsValue = heapStats()
    return {
      memoryUsage: memoryUsageValue,
      heapStats: heapStatsValue,
      pingPacket: [
        {
          name: `当前服务器状态：`,
          id: '00000000-0000-0000-0000-000000000000',
        },
        {
          name: `§e${padUnicodeRight('Bun内存占用', 15)} §r${prettyBytes(memoryUsageValue.rss)}`,
          id: '00000000-0000-0000-0000-000000000000',
        },
        {
          name: `§e${padUnicodeRight('JSC堆内存', 15)} §r${prettyBytes(heapStatsValue.heapSize)}`,
          id: '00000000-0000-0000-0000-000000000000',
        },
        {
          name: `§e${padUnicodeRight('JSC堆容量', 15)} §r${prettyBytes(heapStatsValue.heapCapacity)}`,
          id: '00000000-0000-0000-0000-000000000000',
        },
        {
          name: `§e${padUnicodeRight('JSC额外内存', 15)} §r${prettyBytes(heapStatsValue.extraMemorySize)}`,
          id: '00000000-0000-0000-0000-000000000000',
        },
        {
          name: `§e${padUnicodeRight('JSC对象数', 15)} §r${heapStatsValue.objectCount}`,
          id: '00000000-0000-0000-0000-000000000000',
        },
      ],
    }
  }

  let processInfo = getProcessInfo()

  setInterval(() => {
    processInfo = getProcessInfo()
  }, 1000)

  const server = createServer({
    'online-mode': true,
    'host': '0.0.0.0',
    'enforceSecureProfile': false,
    'enableChatPreview': false,
    'port': 25565,
    'version': false,
    ...options,
    'maxPlayers': 1000,
    'beforePing': function (response, client) {
      response.players.max = 0
      response.players.online = 0
      response.players.sample = processInfo.pingPacket
      response.description.text = '§6§lMC §2§lVerify' + '\n'

      // 不可使用新快照
      if (client.protocolVersion >= 1000000) {
        response.description.text += '§c§l抱歉，不支持使用该快照版本的MC。'
        return
      }

      // 不可使用低于 (107)1.9 的版本
      if (client.protocolVersion < 107) {
        response.description.text += '§c§l抱歉，不支持使用低于 1.9 版本的MC。'
        return
      }

      // 不可使用高于 (763)1.20.1 的版本
      if (client.protocolVersion > 763) {
        response.description.text += '§c§l抱歉，暂时不支持使用高于 1.20.1 版本的MC。'
        return
      }

      response.description.text
        += `§e§l当前时间： §b${new Date().toLocaleString('zh')}`
    },
    'beforeLogin': async (client) => {
      if (client.protocolVersion >= 1000000) {
        // 如果是新快照版本，直接踢出
        client.end('§c§l抱歉，不支持使用该快照版本的MC。')
      }
      else if (client.protocolVersion < 107) {
        // 如果低于 (107)1.9 版本，直接踢出
        client.end('§c§l抱歉，不支持使用低于 1.9 版本的MC。')
      }
      else if (client.protocolVersion > 763) {
        // 如果高于 (763)1.20.1 版本，直接踢出
        client.end('§c§l抱歉，暂时不支持使用高于 1.20.1 版本的MC。')
      }
    },
  })

  // server.on('connection', (client) => {
  //   client.on('state', (now) => {
  //     if (now === 'configuration') {
  //       client.write('feature_flags', { features: ['minecraft:vanilla'] })
  //       client.write('tags', loginTags)
  //       // client.write('tags', {
  //       //   tags: [
  //       //     {
  //       //       tagType: 'minecraft:worldgen/biome',
  //       //       tags: [
  //       //         {
  //       //           tagName: 'minecraft:is_badlands',
  //       //           entries: [],
  //       //         },
  //       //         {
  //       //           tagName: 'minecraft:is_jungle',
  //       //           entries: [],
  //       //         },
  //       //         {
  //       //           tagName: 'minecraft:is_savanna',
  //       //           entries: [],
  //       //         },
  //       //       ],
  //       //     },
  //       //     {
  //       //       tagType: 'minecraft:enchantment',
  //       //       tags: [
  //       //         {
  //       //           tagName: 'minecraft:exclusive_set/bow',
  //       //           entries: [],
  //       //         },
  //       //         {
  //       //           tagName: 'minecraft:exclusive_set/riptide',
  //       //           entries: [],
  //       //         },
  //       //         {
  //       //           tagName: 'minecraft:exclusive_set/damage',
  //       //           entries: [],
  //       //         },
  //       //         {
  //       //           tagName: 'minecraft:exclusive_set/crossbow',
  //       //           entries: [],
  //       //         },
  //       //         {
  //       //           tagName: 'minecraft:exclusive_set/armor',
  //       //           entries: [],
  //       //         },
  //       //         {
  //       //           tagName: 'minecraft:exclusive_set/boots',
  //       //           entries: [],
  //       //         },
  //       //         {
  //       //           tagName: 'minecraft:exclusive_set/mining',
  //       //           entries: [],
  //       //         },
  //       //       ],
  //       //     },
  //       //   ],
  //       // })
  //     }
  //   })
  // })

  server.on('playerJoin', async (client) => {
    const mcData = getMcDataByVersion(client.protocolVersion)
    sendLoginPacket(client)

    let createTime
    let verifyCode
    try {
      const result = await getVerifyStatus(client.uuid)
      if (client.ended) {
        return
      }
      if (result.code === -1) {
        client.end('§a§l该MC正版账号已完成验证。')
        return
      }
      else {
        createTime = result.data.createdAt
        verifyCode = result.data.code
      }
    }
    catch (error) {
      if (client.ended) {
        return
      }
      console.error(error)
      client.end('§c§l抱歉，验证服务器出现错误，请稍后再试。')
      return
    }

    client.write('spawn_position', {
      location: {
        x: 0,
        y: 0,
        z: 0,
      },
      angle: 90.0,
    })

    client.write('rel_entity_move', {
      entityId: client.id,
      dX: 1,
      dY: 0,
      dZ: 0,
      onGround: true,
    })
    client.write('entity_destroy', {
      entityIds: [client.id],
    })
    client.write('game_state_change', {
      reason: 3,
      gameMode: 3,
    })
    client.write('update_time', {
      age: [0, 0],
      time: [0, 16000],
    })

    client.registerChannel(
      client.protocolVersion >= 386 ? 'minecraft:brand' : 'MC|Brand',
      ['string', []],
    )
    client.writeChannel(
      client.protocolVersion >= 386 ? 'minecraft:brand' : 'MC|Brand',
      'MCVerifyServer',
    )

    const nbtMessageEnabled = mcData.supportFeature('chatPacketsUseNbtComponents')

    sendUniformChatPacket(client, !nbtMessageEnabled
      ? JSON.stringify({
          translate: 'chat.type.announcement',
          with: ['§6§lMC §2§lVerify', `§r你好，§e${client.username}§r，你正在通过MC Verify验证杭电学生身份。`],
        })
      : nbt.comp({
          text: nbt.string(`§6§lMC §2§lVerify §r你好，§e${client.username}§r，你正在通过MC Verify验证杭电学生身份。`),
        }))

    sendUniformChatPacket(client, !nbtMessageEnabled
      ? JSON.stringify({
          translate: 'chat.type.announcement',
          with: [
            '§6§lMC §2§lVerify',
            '§r' + '倘若您不知道这是什么，请立即断开连接。',
          ],
        })
      : nbt.comp({
          text: nbt.string('§6§lMC §2§lVerify §r倘若您不知道这是什么，请立即断开连接。'),
        }))

    sendUniformChatPacket(client, JSON.stringify({
      translate: 'chat.type.announcement',
      with: [
        '§6§lMC §2§lVerify',
        [
          {
            text: '按下「',
          },
          {
            keybind: 'key.chat',
          },
          {
            text: '」打开聊天框呼出鼠标后',
          },
        ],
      ],
    }))
    sendUniformChatPacket(client, JSON.stringify({
      translate: 'chat.type.announcement',
      with: [
        '§6§lMC §2§lVerify',
        [
          {
            text: '点击链接完成绑定 → ',
          },
          {
            text: '§a§l§n绑定',
            clickEvent: {
              action: 'open_url',
              value: `${apiEndpoint}/verify/${verifyCode}/${client.uuid}`,
            },
          },
        ],
      ],
    }))

    const getColoredTime = (text: string, progress: number) => {
      // 70% 以上为绿色，30% 以上为黄色，其余为红色
      if (progress >= 0.7) {
        return `§a§l${text}§r`
      }
      else if (progress >= 0.3) {
        return `§e§l${text}§r`
      }
      else {
        return `§c§l${text}§r`
      }
    }

    const timeLimit = 5 * 60 * 1000
    const interval = setInterval(() => {
      if (client.ended) {
        clearInterval(interval)
        return
      }
      if (timeLimit + createTime < Date.now()) {
        clearInterval(interval)
        client.end('§4§l绑定超时\n§6§l请重新加入服务器')
        return
      }
      const remainingMs = timeLimit - (new Date().getTime() - createTime)
      sendBossbarPacket(
        client,
        nbtMessageEnabled
          ? nbt.comp({
              text: nbt.string(
                `请在 ${getColoredTime(
                  secondsToFriendlyString(Math.floor(remainingMs / 1000), [
                    '分',
                    '秒',
                  ]),
                  remainingMs / timeLimit,
                )} 内完成绑定`,
              ),
            })
          : JSON.stringify({
              text:
              `请在 ${getColoredTime(
                secondsToFriendlyString(Math.floor(remainingMs / 1000), [
                  '分',
                  '秒',
                ]),
                remainingMs / timeLimit,
              )} 内完成绑定`,
            }),
        remainingMs / timeLimit,
      )
    }, 1000)

    const verifyInterval = setInterval(async () => {
      if (client.ended) {
        clearInterval(verifyInterval)
        return
      }
      try {
        const result = await getVerifyStatus(client.uuid)
        if (result.code === -1) {
          client.end('§a§l绑定成功！\n你可以前往 §6§lhttps://mcverify.daidr.me §r查看你的绑定信息。')
        }
        else {
          if (verifyCode !== result.data.code) {
            client.end('§c§l绑定请求超时或被拒绝')
          }
        }
      }
      catch (error) {
        console.error(error)
        client.end('§c§l抱歉，验证服务器出现错误，请稍后再试。')
      }
    }, 3000)
  })

  return server
}
