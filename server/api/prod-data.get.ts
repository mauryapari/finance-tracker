import { validateAuth } from '../utils/validateAuth'

export default defineEventHandler(async (event) => {
  validateAuth(event)
  const config = useRuntimeConfig()

  if (!config.prodStorageKey)
    throw createError({ statusCode: 503, message: 'NUXT_PROD_STORAGE_KEY is not set on the server' })

  if (!config.upstashRedisRestUrl || !config.upstashRedisRestToken)
    throw createError({ statusCode: 503, message: 'Redis not configured' })

  const res = await fetch(`${config.upstashRedisRestUrl}/get/${config.prodStorageKey}`, {
    headers: { Authorization: `Bearer ${config.upstashRedisRestToken}` },
  })
  const json: { result: string | null } = await res.json()

  if (!json.result)
    throw createError({ statusCode: 404, message: `No data found at prod key "${config.prodStorageKey}"` })

  return JSON.parse(json.result)
})
