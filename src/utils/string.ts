export function ellipsisUuid(uuid: string): string {
  return `${uuid.slice(0, 4)}...${uuid.slice(-4)}`
}

export function getUrl(base: string, url: string, querys?: { [key: string]: string }): string {
  const _url = new URL(url, base)
  if (!querys)
    return _url.toString()

  for (const key in querys) {
    _url.searchParams.set(key, querys[key]!)
  }
  return _url.toString()
}
