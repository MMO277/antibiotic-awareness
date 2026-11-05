import { ComponentType, lazy, Suspense, useEffect } from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import { configured } from './firebase';
import { useLang } from './i18n';
import Layout from './Layout';
import { AuthProvider } from './authContext';
import { EmergencyLocationProvider } from './emergencyLocation';
import AuthModal from './AuthModal';
import Home from './Home';
import { startPartnerEcosystemSync } from './partnerService';

/**
 * Offline-safe & OTA-safe lazy loader.
 * Splits the bundle into small chunks for 5x faster initial startup while avoiding infinite reload loops when offline.
 */
function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((err) => {
      // Only reload once if online and a newly deployed chunk hash changed
      if (typeof navigator !== 'undefined' && navigator.onLine !== false) {
        const key = 'aa_chunk_retry_reloaded';
        const hasReloaded = sessionStorage.getItem(key) === '1';
        if (!hasReloaded) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        sessionStorage.removeItem(key);
      }
      throw err;
    })
  );
}

// Lazy-loaded clinical tools, directories & pages
const OneClickCheckup = lazyWithRetry(() => import('./OneClickCheckup'));
const PrescriptionRadar = lazyWithRetry(() => import('./PrescriptionRadar'));
const AwarenessWeek = lazyWithRetry(() => import('./AwarenessWeek'));
const GreenPrescription = lazyWithRetry(() => import('./GreenPrescription'));
const CompareDrugs = lazyWithRetry(() => import('./CompareDrugs'));
const SafeDisposal = lazyWithRetry(() => import('./SafeDisposal'));
const PediatricHelper = lazyWithRetry(() => import('./PediatricHelper'));
const HealthProfile = lazyWithRetry(() => import('./HealthProfile'));
const AllergyChecker = lazyWithRetry(() => import('./AllergyChecker'));
const ListenLearn = lazyWithRetry(() => import('./ListenLearn'));
const Tracker = lazyWithRetry(() => import('./Tracker'));
const SideEffectsGuide = lazyWithRetry(() => import('./SideEffectsGuide'));
const Interactions = lazyWithRetry(() => import('./Interactions'));
const CostSaver = lazyWithRetry(() => import('./CostSaver'));
const ColdShotWarning = lazyWithRetry(() => import('./ColdShotWarning'));
const DailyScheduleGenerator = lazyWithRetry(() => import('./DailyScheduleGenerator'));
const PassportView = lazyWithRetry(() => import('./PassportView'));
const Medicines = lazyWithRetry(() => import('./Medicines'));
const MedicinePage = lazyWithRetry(() => import('./MedicinePage'));
const Articles = lazyWithRetry(() => import('./Articles'));
const ArticlePage = lazyWithRetry(() =>
  import('./Articles').then((m) => ({ default: m.ArticlePage }))
);
const Quiz = lazyWithRetry(() => import('./Quiz'));
const Scan = lazyWithRetry(() => import('./Scan'));
const Learn = lazyWithRetry(() => import('./Learn'));
const Assistant = lazyWithRetry(() => import('./Assistant'));
const MythFact = lazyWithRetry(() => import('./MythFact'));
const Methodology = lazyWithRetry(() => import('./Methodology'));
const Research = lazyWithRetry(() => import('./Research'));
const Dashboard = lazyWithRetry(() => import('./Dashboard'));
const Editor = lazyWithRetry(() => import('./Editor'));
const PartnersDirectoryPage = lazyWithRetry(() => import('./PartnersDirectory'));
const PartnerPublicProfilePage = lazyWithRetry(() =>
  import('./PartnersDirectory').then((m) => ({ default: m.PartnerPublicProfilePage }))
);

// Lazy-loaded 2D & 3D WebGL Games (keeps Three.js 650KB out of the initial startup bundle)
const GameCenter = lazyWithRetry(() => import('./GameCenter'));
const BacteriaHunter = lazyWithRetry(() => import('./BacteriaHunter'));
const OpenWorldGame = lazyWithRetry(() => import('./OpenWorldGame'));
const MedicalSimulator = lazyWithRetry(() => import('./MedicalSimulator'));
const NurseAcademy = lazyWithRetry(() => import('./NurseAcademy'));
const MedicalMystery = lazyWithRetry(() => import('./MedicalMystery'));
const BacteriaLab = lazyWithRetry(() => import('./BacteriaLab'));
const EmergencyShift = lazyWithRetry(() => import('./EmergencyShift'));
const EscapeTheLab = lazyWithRetry(() => import('./EscapeTheLab'));

function ConfigMissing() {
  const { t } = useLang();
  return (
    <main className="wrap narrow">
      <div className="card">
        <h1>Firebase is not configured</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code>, paste your Firebase web app values, then restart{' '}
          <code>npm run dev</code>.
        </p>
        <p dir="rtl">
          لوحة الإدارة تتطلب إعدادات Firebase. انسخ الملف <code>.env.example</code> إلى <code>.env.local</code> وأدخل القيم ثم أعد التشغيل.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/" className="btn">{t('navHome')}</Link>
        </p>
      </div>
    </main>
  );
}

function PageLoadingFallback() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  return (
    <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="card center" style={{ padding: '32px 20px', opacity: 0.9 }}>
        <div style={{ fontSize: '1.9rem', marginBottom: '8px' }} aria-hidden="true">⚡</div>
        <b style={{ display: 'block', marginBottom: '4px' }}>
          {isAr ? 'جارٍ فتح الصفحة...' : 'Loading page...'}
        </b>
      </div>
    </main>
  );
}

function SimulatorLoadingFallback() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  return (
    <main className="wrap narrow" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="card center" style={{ padding: '42px 20px' }}>
        <div style={{ fontSize: '2.4rem', marginBottom: '10px' }} aria-hidden="true">🏥</div>
        <h2 style={{ marginBottom: '6px' }}>
          {isAr ? 'جارٍ تجهيز المشهد التفاعلي ثلاثي الأبعاد (3D)...' : 'Loading 3D Interactive Game Scene...'}
        </h2>
        <p className="small muted" style={{ margin: 0 }}>
          {isAr
            ? 'يتم الآن تحميل المشهد ثلاثي الأبعاد والشخصيات والمحطات التفاعلية.'
            : 'Initializing WebGL 3D scene, cartoon avatars, and interactive stations.'}
        </p>
      </div>
    </main>
  );
}

function NotFound() {
  const { t } = useLang();
  return (
    <main className="wrap narrow">
      <p>{t('notFound')}</p>
      <Link to="/">{t('navHome')}</Link>
    </main>
  );
}

export default function App() {
  useEffect(() => {
    // Stage 1 (1.2s after paint): Pre-warm primary clinical tools & Service Worker full-offline cache
    const timer1 = window.setTimeout(() => {
      startPartnerEcosystemSync();
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'WARMUP_OFFLINE_CACHE' });
        }
      } catch {
        /* ignore */
      }
      void import('./Medicines');
      void import('./MedicinePage');
      void import('./Tracker');
      void import('./OneClickCheckup');
      void import('./CostSaver');
      void import('./GreenPrescription');
      void import('./DailyScheduleGenerator');
      void import('./PrescriptionRadar');
      void import('./Assistant');
    }, 1200);

    // Stage 2 (3.2s after paint): Pre-warm remaining clinical & educational pages into memory for 0ms offline navigation
    const timer2 = window.setTimeout(() => {
      void import('./Interactions');
      void import('./AllergyChecker');
      void import('./PediatricHelper');
      void import('./HealthProfile');
      void import('./CompareDrugs');
      void import('./ColdShotWarning');
      void import('./SideEffectsGuide');
      void import('./SafeDisposal');
      void import('./Scan');
      void import('./Quiz');
      void import('./Articles');
      void import('./Learn');
      void import('./MythFact');
      void import('./ListenLearn');
      void import('./PartnersDirectory');
    }, 3200);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
    };
  }, []);

  return (
    <AuthProvider>
      <EmergencyLocationProvider>
        <Layout>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/medicines" element={<Medicines />} />
              <Route path="/partners" element={<PartnersDirectoryPage />} />
              <Route path="/pharmacies" element={<PartnersDirectoryPage />} />
              <Route path="/partner/:id" element={<PartnerPublicProfilePage />} />
              <Route path="/cost-saver" element={<CostSaver />} />
              <Route path="/cold-shot-warning" element={<ColdShotWarning />} />
              <Route path="/daily-schedule" element={<DailyScheduleGenerator />} />
              <Route path="/green-prescription" element={<GreenPrescription />} />
              <Route path="/awareness-week" element={<AwarenessWeek />} />
              <Route path="/compare" element={<CompareDrugs />} />
              <Route path="/complete-checkup" element={<OneClickCheckup />} />
              <Route path="/prescription-radar" element={<PrescriptionRadar />} />
              <Route path="/interactions" element={<Interactions />} />
              <Route path="/safe-disposal" element={<SafeDisposal />} />
              <Route path="/tracker" element={<Tracker />} />
              <Route path="/side-effects" element={<SideEffectsGuide />} />
              <Route path="/listen" element={<ListenLearn />} />
              <Route path="/health-profile" element={<HealthProfile />} />
              <Route path="/allergy-checker" element={<AllergyChecker />} />
              <Route path="/pediatric-helper" element={<PediatricHelper />} />
              <Route path="/medicine/:id" element={<MedicinePage />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:id" element={<ArticlePage />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/myth" element={<MythFact />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="/research" element={<Research />} />
              <Route path="/games" element={<GameCenter />} />
              <Route
                path="/open-world"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <OpenWorldGame />
                  </Suspense>
                }
              />
              <Route
                path="/medical-simulator"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <MedicalSimulator />
                  </Suspense>
                }
              />
              <Route
                path="/nurse-academy"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <NurseAcademy />
                  </Suspense>
                }
              />
              <Route
                path="/medical-mystery"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <MedicalMystery />
                  </Suspense>
                }
              />
              <Route
                path="/bacteria-lab"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <BacteriaLab />
                  </Suspense>
                }
              />
              <Route
                path="/emergency-shift"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <EmergencyShift />
                  </Suspense>
                }
              />
              <Route
                path="/escape-the-lab"
                element={
                  <Suspense fallback={<SimulatorLoadingFallback />}>
                    <EscapeTheLab />
                  </Suspense>
                }
              />
              <Route path="/game" element={<BacteriaHunter />} />
              <Route path="/admin" element={configured ? <Dashboard /> : <ConfigMissing />} />
              <Route path="/admin/new" element={configured ? <Editor /> : <ConfigMissing />} />
              <Route path="/admin/medicine/:id" element={configured ? <Editor /> : <ConfigMissing />} />
              <Route path="/passport/:uid" element={<PassportView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
        <AuthModal />
      </EmergencyLocationProvider>
    </AuthProvider>
  );
}
