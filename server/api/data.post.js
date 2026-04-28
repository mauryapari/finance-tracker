export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.upstashRedisRestUrl || !config.upstashRedisRestToken) {
    throw createError({ statusCode: 503, message: 'Redis not configured' })
  }
  const body = await readBody(event)
  // Upstash REST SET expects the value as a plain string body
  await fetch(`${config.upstashRedisRestUrl}/set/finance_tracker_data`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.upstashRedisRestToken}`,
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(body),
  })
  return { ok: true }
})
