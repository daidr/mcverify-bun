import minecraftData from 'minecraft-data'

export function getMcDataByVersion(version: string | number) {
  return minecraftData(version)
}

export function getMajorVersionByProtocol(protocol: number) {
  return minecraftData.versions.pc.find(v => v.version === protocol)!.majorVersion
}
