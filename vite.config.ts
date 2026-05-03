import path from 'path';
import { defineConfig, loadEnv } from 'vite';
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

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
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
