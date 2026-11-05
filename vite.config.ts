import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Set to true whenever you want the next deployed update to be MANDATORY (إجباري) for all users
const IS_MANDATORY_UPDATE = false;
const APP_VERSION = '2.5.0';

/**
 * Generates both:
 * 1) precache-manifest.json (all compiled JS/CSS chunks for 0ms offline mode)
 * 2) app-version.json (unique buildId + version + mandatory flag so installed apps automatically
 *    detect new deployments and show the In-App Update prompt!)
 */
function offlineAndInAppUpdatePlugin(): Plugin {
  return {
    name: 'offline-and-in-app-update-manifest',
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

      const nowTs = Date.now();

      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify(
          {
            version: nowTs,
            coreAssets,
            deferred3DAssets,
          },
          null,
          2
        ),
      });

      this.emitFile({
        type: 'asset',
        fileName: 'app-version.json',
        source: JSON.stringify(
          {
            buildId: `build-${APP_VERSION}-${nowTs}`,
            version: APP_VERSION,
            mandatory: IS_MANDATORY_UPDATE,
            requiresNewApk: false,
            titleAr: IS_MANDATORY_UPDATE
              ? `⚠️ تحديث هام وإجباري لمنصة المضادات الحيوية (v${APP_VERSION})`
              : `🚀 تحديث شامل جديد متاح للتطبيق (v${APP_VERSION})`,
            titleEn: IS_MANDATORY_UPDATE
              ? `⚠️ Critical Mandatory App Update (v${APP_VERSION})`
              : `🚀 Comprehensive New App Update (v${APP_VERSION})`,
            notesAr: [
              '⚡ تشغيل فوري 100% أوفلاين لجميع الأدوات وقاعدة الأدوية (206 دواء مصري).',
              '🔐 تسجيل دخول سريع بحساب Google بضغطة واحدة بدون الحاجة لكتابة كلمة مرور.',
              '🧭 جولة تعريفية ذكية للمستخدمين الجدد ونظام تحديث مباشر من داخل التطبيق.',
              '⏰ منبه جرعات ذكي يرن بصوت عالي في مواعيد الأدوية حتى والتطبيق مغلق.',
            ],
            notesEn: [
              '⚡ Instant 100% offline execution across all clinical tools and 206 Egyptian medicines.',
              '🔐 1-Tap Google Account sign-in without typing passwords.',
              '🧭 First-time interactive onboarding tour & live in-app update system.',
              '⏰ Hardware phone alarm clock that rings even when the app is closed.',
            ],
            publishedAt: new Date().toISOString().slice(0, 10),
          },
          null,
          2
        ),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), offlineAndInAppUpdatePlugin()],
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
