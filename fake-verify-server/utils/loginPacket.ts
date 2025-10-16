import type { ServerClient } from 'minecraft-protocol'
import { getMcDataByVersion } from './mcdata'

export function sendLoginPacket(client: ServerClient) {
  const mcData = getMcDataByVersion(client.protocolVersion)
  const loginPacket = {
    ...mcData.loginPacket,
    difficulty: 0,
    levelType: 'default',
    worldNames: ['minecraft:overworld'],
    dimension: (mcData.supportFeature('dimensionIsAString') || mcData.supportFeature('dimensionIsAWorld')) ? mcData.loginPacket.dimension : 0,
    maxPlayers: 1,
    viewDistance: 1,
    simulationDistance: 1,
    enableRespawnScreen: false,
    entityId: client.id,
    reducedDebugInfo: true,
    previousGameMode: 3,
    gameMode: 1,
    isDebug: false,
  }

  client.write('login', loginPacket)
}
