import path from 'path';
import { readdirSync, writeFileSync, existsSync } from 'fs';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

const getCommitInfo = () => {
  try {
    return {
      hash: execSync('git log -1 --format=%h').toString().trim(),
      msg: execSync('git log -1 --format=%s').toString().trim(),
      date: execSync('git log -1 --format=%cI').toString().trim(),
    };
  } catch {
    return { hash: 'unknown', msg: 'unknown', date: new Date().toISOString() };
  }
};

const commit = getCommitInfo();

function generateSWPlugin(cacheName: string): Plugin {
  return {
    name: 'generate-sw',
    apply: 'build',
    closeBundle() {
      const distDir = path.join(process.cwd(), 'dist');
      const precache: string[] = ['/', '/index.html', '/manifest.json', '/icon.svg'];

      const assetsDir = path.join(distDir, 'assets');
      if (existsSync(assetsDir)) {
        readdirSync(assetsDir).forEach((file) => {
          if (/\.(js|css)$/.test(file)) precache.push(`/assets/${file}`);
        });
      }

      const sw = `const CACHE_NAME = '${cacheName}';
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(PRECACHE.map((url) =>
        fetch(url, { cache: 'reload' })
          .then((r) => r.ok ? cache.put(url, r) : null)
          .catch(() => null)
      ))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate';
  const isAsset = url.pathname.startsWith('/assets/');

  if (isAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((r) => {
          if (r.ok) caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone()));
          return r;
        });
      })
    );
    return;
  }

  if (isNavigation) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const net = fetch(event.request)
          .then((r) => {
            if (r.ok) caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone()));
            return r;
          })
          .catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((r) => {
        if (r.ok) caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone()));
        return r;
      })
      .catch(() => caches.match(event.request))
  );
});
`;

      writeFileSync(path.join(distDir, 'sw.js'), sw);
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        generateSWPlugin(`sprint-${commit.hash}`),
      ],
      build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-charts': ['recharts'],
              'vendor-ai': ['@google/genai'],
            },
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__BUILD_COMMIT_HASH__': JSON.stringify(commit.hash),
        '__BUILD_COMMIT_MSG__': JSON.stringify(commit.msg),
        '__BUILD_COMMIT_DATE__': JSON.stringify(commit.date),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
