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
      const precache: string[] = ['/', '/index.html', '/manifest.json', '/icon.svg', '/logo.png', '/logo-192.png', '/logo-512.png'];

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
    ).catch(() => {})
  );
  self.skipWaiting();
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
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    );
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isDocument = request.mode === 'navigate' || request.destination === 'document';

  if (isDocument) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
    })
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
