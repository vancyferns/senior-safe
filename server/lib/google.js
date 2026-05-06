import { Buffer } from 'node:buffer'
import { OAuth2Client } from 'google-auth-library'

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const oauthClient = googleClientId ? new OAuth2Client(googleClientId) : null

const decodeJwtPayload = (credential) => {
  const payloadPart = credential?.split('.')?.[1]

  if (!payloadPart) {
    throw new Error('Invalid Google credential')
  }

  const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const payloadJson = Buffer.from(padded, 'base64').toString('utf8')

  return JSON.parse(payloadJson)
}

export const mapGooglePayload = (payload = {}) => ({
  googleId: payload.sub || payload.id || null,
  email: payload.email?.toLowerCase() || null,
  name: payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' ').trim() || null,
  givenName: payload.given_name || payload.givenName || null,
  familyName: payload.family_name || payload.familyName || null,
  picture: payload.picture || null,
})

export const verifyGoogleCredential = async ({ credential, fallbackUser = null }) => {
  if (!credential) {
    throw new Error('Google credential is required')
  }

  if (oauthClient && googleClientId) {
    const ticket = await oauthClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    })

    const payload = ticket.getPayload()

    if (!payload?.sub) {
      throw new Error('Invalid Google credential payload')
    }

    return {
      verified: true,
      payload,
      user: mapGooglePayload(payload),
    }
  }

  const payload = decodeJwtPayload(credential)

  return {
    verified: false,
    payload,
    user: mapGooglePayload({ ...payload, ...fallbackUser }),
  }
}
