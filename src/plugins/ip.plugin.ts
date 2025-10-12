import { Elysia } from 'elysia'

const headersToCheck: string[] = [
  'x-real-ip', // Nginx proxy/FastCGI
  'x-client-ip', // Apache https://httpd.apache.org/docs/2.4/mod/mod_remoteip.html#page-header
  'cf-connecting-ip', // Cloudflare
  'fastly-client-ip', // Fastly
  'x-cluster-client-ip', // GCP
  'x-forwarded', // General Forwarded
  'forwarded-for', // RFC 7239
  'forwarded', // RFC 7239
  'x-forwarded', // RFC 7239
  'appengine-user-ip', // GCP
  'true-client-ip', // Akamai and Cloudflare
  'cf-pseudo-ipv4', // Cloudflare
  'fly-client-ip', // Fly.io
]

function getIP(headers: Headers, checkHeaders: string[] = headersToCheck) {
  // User provided single header
  if (typeof checkHeaders === 'string' && headers.get(checkHeaders)) {
    return headers.get(checkHeaders)
  }

  // check for x-forwaded-for only when user did not provide headers
  if (checkHeaders && checkHeaders === headersToCheck && headers.get('x-forwarded-for')) {
    return headers.get('x-forwarded-for')?.split(',')[0]
  }

  // User provided / default headers array
  if (Array.isArray(checkHeaders)) {
    let clientIP: string | undefined | null = null
    for (const header of checkHeaders) {
      clientIP = headers.get(header)
      if (clientIP) {
        break
      }
    }
    return clientIP
  }

  if (!checkHeaders) {
    return null
  }
}

export const ip = new Elysia({ name: 'ip' })
  .derive(({ request, server }): { ip: string } => {
    serverIP: {
      if (globalThis.Bun) {
        if (!server) {
          break serverIP
        }

        if (!server.requestIP) {
          break serverIP
        }

        const socketAddress = server.requestIP(request)
        if (!socketAddress) {
          break serverIP
        }
        return { ip: socketAddress.address }
      }
    }
    return {
      ip: getIP(request.headers) || '',
    }
  })
  .as('global')
