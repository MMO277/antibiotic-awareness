import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Generates precache-manifest.json at build time containing all compiled JS & CSS chunks
 * so the Service Worker (sw.js) can pre-cache 100% of the application for instant 0ms offline use.
 */
function offlinePrecacheManifestPlugin(): Plugin {
  return {
    name: 'offline-precache-manifest',
    generateBundle(_options, bundle) {
      const coreAssets: string[] = [];
      const deferred3DAssets: string[] = [];

      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith('.js') || fileName.endsWith('.css')) {
          const normalized = './' + fileName.replace(/^\/+/, '');
          if (
            fileName.includes('vendor-three') ||
            fileName.includes('OpenWorld') ||
            fileName.includes('MedicalSimulator') ||
            fileName.includes('Cartoon3D')
          ) {
            deferred3DAssets.push(normalized);
          } else {
            coreAssets.push(normalized);
          }
        }
      }

      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify(
          {
            version: Date.now(),
            coreAssets,
            deferred3DAssets,
          },
          null,
          2
        ),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), offlinePrecacheManifestPlugin()],
  base: './',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('html5-qrcode') || id.includes('qrcode')) return 'vendor-qr';
            if (id.includes('react')) return 'vendor-react';
          }
        },
      },
    },
  },
});
