import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Only use Sentry plugin in production builds when auth token is available
    const sentryPlugin = mode === 'production' && env.SENTRY_AUTH_TOKEN
      ? sentryVitePlugin({
          org: env.SENTRY_ORG || 'renovatemysite',
          project: env.SENTRY_PROJECT || 'renovatemysite-frontend',
          authToken: env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            filesToDeleteAfterUpload: ['**/*.map'],
          },
          telemetry: false,
        })
      : null;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), sentryPlugin].filter(Boolean),
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Ensure all routes fall back to index.html for SPA
      appType: 'spa',
      build: {
        // Output to dist folder for Firebase Hosting
        outDir: 'dist',
        // Generate sourcemaps for Sentry (always generate for uploads)
        sourcemap: true,
        // Optimize chunks
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
            },
          },
        },
      },
    };
});
