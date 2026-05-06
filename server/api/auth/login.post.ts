import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const { password } = await readBody<{ password?: string }>(event)
  if (!password) throw createError({ statusCode: 400, message: 'password required' })
  const { AUTH_PASSWORD, AUTH_SECRET } = process.env
  if (!AUTH_PASSWORD || !AUTH_SECRET) throw createError({ statusCode: 500, message: 'server misconfigured' })
  if (password !== AUTH_PASSWORD) throw createError({ statusCode: 401, message: 'invalid password' })
  const expiresAt = Date.now() + 86_400_000
  const token = crypto.createHmac('sha256', AUTH_SECRET).update(String(expiresAt)).digest('hex')
  return { token, expiresAt }
})
