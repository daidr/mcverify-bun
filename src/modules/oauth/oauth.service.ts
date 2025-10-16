import { CONFIG } from '@/config'
import { getUrl } from '@/utils/string'

export interface HduhelpUserInfo {
  staff_id: string
  staff_name: string
  staff_type: '0' | '1' | '2'
  user_id: string
}

export abstract class OauthService {
  static async getHduhelpUserByCode(
    code: string,
    state: string,
  ): Promise<HduhelpUserInfo> {
    const hduhelpEndpoint = CONFIG.hduhelp.endpoint
    const hduhelpClientId = CONFIG.hduhelp.clientId
    const hduhelpClientSecret = CONFIG.hduhelp.clientSecret

    const authUrl = getUrl(hduhelpEndpoint, '/oauth/token', {
      response_type: 'code',
      client_id: hduhelpClientId,
      client_secret: hduhelpClientSecret,
      grant_type: 'authorization_code',
      code,
      state,
    })

    return await fetch(authUrl.toString())
      .then(res => res.json() as Promise<{
        error?: string
        data: HduhelpUserInfo
      }>)
      .then((json) => {
        if (json.error) {
          throw new Error(json.error)
        }

        return {
          staff_id: json.data.staff_id,
          staff_name: json.data.staff_name,
          staff_type: json.data.staff_type,
          user_id: json.data.user_id,
        } as HduhelpUserInfo
      })
  }
}
