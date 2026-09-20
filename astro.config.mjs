// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// When DOCKER_BUILD=true, use Node.js standalone adapter for containerized deployment.
// Otherwise, use Cloudflare adapter for CF Pages / Workers deployment.
const isDockerBuild = process.env.DOCKER_BUILD === 'true';

let adapter;
if (isDockerBuild) {
  const { default: node } = await import('@astrojs/node');
  adapter = node({ mode: 'standalone' });
} else {
  const { default: cloudflare } = await import('@astrojs/cloudflare');
  adapter = cloudflare();
}

// https://astro.build/config
export default defineConfig({
  output: 'server',
  security: {
    checkOrigin: false,
    allowedDomains: [
      { hostname: '**.telkomuniversity.ac.id' },
      { hostname: 'telkomuniversity.ac.id' },
    ],
  },
  server: {
    port: 3000,
    allowedHosts: true,
  },
  vite: {
    server: {
      allowedHosts: true,
      cors: {
        origin: '*',
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
    },
  },
  integrations: [react()],
  adapter,
});