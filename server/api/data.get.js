export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  if (!config.upstashRedisRestUrl || !config.upstashRedisRestToken) {
    return { configured: false }
  }
  const res = await fetch(`${config.upstashRedisRestUrl}/get/finance_tracker_data`, {
    headers: { Authorization: `Bearer ${config.upstashRedisRestToken}` },
  })
  const json = await res.json()
  // Upstash returns { result: "<JSON string>" } or { result: null }
  return { configured: true, data: json.result ? JSON.parse(json.result) : null }
})
