/**
 * Thin, credential-optional HTTP client for the Renaiss Index API.
 * Fixed allowlisted base URL (no user-controlled host → no SSRF), optional
 * partner-tier headers from env, an AbortController timeout, a 429/Retry-After
 * branch, and a small in-memory TTL cache. Secrets are read from env only and
 * never logged.
 */
const BASE = 'https://api.renaissos.com'
const TTL_MS = 5 * 60_000
const TIMEOUT_MS = 8_000

export class RateLimitError extends Error {
  constructor(public retryAfter: number | null) {
    super('renaiss rate limited')
    this.name = 'RateLimitError'
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

function readEnv(key: string): string | undefined {
  return typeof process !== 'undefined' ? process.env?.[key] : undefined
}

interface CacheEntry {
  at: number
  value: unknown
}
const cache = new Map<string, CacheEntry>()

/** For tests: reset the module-level cache. */
export function clearRenaissCache(): void {
  cache.clear()
}

export async function renaissGet(path: string, opts: { now?: number; ttlMs?: number } = {}): Promise<unknown> {
  const now = opts.now ?? Date.now()
  const ttl = opts.ttlMs ?? TTL_MS
  const hit = cache.get(path)
  if (hit && now - hit.at < ttl) return hit.value

  const headers: Record<string, string> = { accept: 'application/json' }
  const key = readEnv('RENAISS_API_KEY')
  const secret = readEnv('RENAISS_API_SECRET')
  if (key && secret) {
    headers['X-Api-Key'] = key
    headers['X-Api-Secret'] = secret
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}${path}`, { headers, signal: controller.signal })
    if (res.status === 429) {
      const ra = res.headers.get('Retry-After')
      throw new RateLimitError(ra ? Number(ra) : null)
    }
    if (!res.ok) throw new ApiError(res.status, `renaiss ${res.status} for ${path}`)
    const json = await res.json()
    cache.set(path, { at: now, value: json })
    return json
  } finally {
    clearTimeout(timer)
  }
}
