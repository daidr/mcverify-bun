import pack from '../../package.json'

export function getVersionMarco() {
  const { stdout } = Bun.spawnSync({
    cmd: ['git', 'rev-parse', '--short', 'HEAD'],
    stdout: 'pipe',
  })

  return {
    hash: stdout.toString().trim(),
    version: pack.version,
  }
}
