import crypto from 'node:crypto'

export function validateAuth(event) {
  const secret = process.env.AUTH_SECRET
  if (!secret) return
  const auth = getHeader(event, 'authorization') || ''
  const expiresAt = Number(getHeader(event, 'x-expires-at') || '0')
  const token = auth.replace('Bearer ', '')
  if (!token || !expiresAt || expiresAt < Date.now())
    throw createError({ statusCode: 401, message: 'unauthorized' })
  const expected = crypto.createHmac('sha256', secret).update(String(expiresAt)).digest('hex')
  if (token !== expected) throw createError({ statusCode: 401, message: 'unauthorized' })
}
