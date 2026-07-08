/// <reference types="vitest/config" />
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'node:url'

/**
 * Dev-only middleware that serves the same JSON API the Vercel `/api` functions
 * serve in production — by calling the real compute layer over the real DataSource.
 * Lets `pnpm dev` (and the Preview tool) exercise the true API contract locally
 * without `vercel dev`. Production is unaffected (Vercel runs `api/*.ts`).
 */
function devApi(): Plugin {
  return {
    name: 'tessera-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/')) return next()
        const path = url.split('?')[0]
        const json = (code: number, body: unknown) => {
          res.statusCode = code
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(body))
        }
        try {
          const dsMod = (await server.ssrLoadModule('/src/data/getDataSource.ts')) as typeof import('./src/data/getDataSource')
          const compute = (await server.ssrLoadModule('/src/lib/compute.ts')) as typeof import('./src/lib/compute')
          const source = dsMod.getDataSource()
          const now = Date.now()
          if (path === '/api/overview') return json(200, await compute.buildOverview(source, now))
          if (path === '/api/categories') return json(200, { categories: (await compute.buildOverview(source, now)).categories })
          if (path === '/api/health') return json(200, await source.health())
          const mCat = path.match(/^\/api\/categories\/([^/]+)$/)
          if (mCat) {
            try {
              return json(200, await compute.buildCategoryAnalytics(source, decodeURIComponent(mCat[1]), now))
            } catch {
              return json(404, { error: 'unknown category', id: decodeURIComponent(mCat[1]) })
            }
          }
          const mIdx = path.match(/^\/api\/index\/([^/]+)$/)
          if (mIdx) {
            try {
              const a = await compute.buildCategoryAnalytics(source, decodeURIComponent(mIdx[1]), now)
              return json(200, { id: a.id, base: a.base, indexSeries: a.indexSeries })
            } catch {
              return json(404, { error: 'unknown category', id: decodeURIComponent(mIdx[1]) })
            }
          }
          return next()
        } catch (e) {
          return json(500, { error: e instanceof Error ? e.message : 'dev api error' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApi()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/data/**'],
    },
  },
})
