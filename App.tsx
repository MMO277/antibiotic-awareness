import { lazy, Suspense } from 'react';
import PrescriptionRadar from "./PrescriptionRadar";
import AwarenessWeek from './AwarenessWeek';
import GreenPrescription from './GreenPrescription';
import CompareDrugs from './CompareDrugs';
import SafeDisposal from './SafeDisposal';
import PediatricHelper from './PediatricHelper';
import HealthProfile from './HealthProfile';
import AllergyChecker from './AllergyChecker';
import ListenLearn from './ListenLearn';
import Tracker from './Tracker';
import SideEffectsGuide from './SideEffectsGuide';
import Interactions from './Interactions';
import { Route, Routes, Link } from 'react-router-dom';
import { configured } from './firebase';
import { useLang } from './i18n';
import Layout from './Layout';
import { AuthProvider } from './authContext';
import AuthModal from './AuthModal';
import LogoutModal from './LogoutModal';
import Home from './Home';
import Medicines from './Medicines';
import MedicinePage from './MedicinePage';
import Articles, { ArticlePage } from './Articles';
import Quiz from './Quiz';
import Scan from './Scan';
import Learn from './Learn';
import Assistant from './Assistant';
import MythFact from './MythFact';
import Methodology from './Methodology';
import Research from './Research';
import Dashboard from './Dashboard';
import BacteriaHunter from './BacteriaHunter';
import GameCenter from './GameCenter';
import Editor from './Editor';

// Lazy-load 3D WebGL games so Three.js / WebGL code stays out of the initial application bundle
const MedicalSimulator = lazy(() => import('./MedicalSimulator'));
const BacteriaLab = lazy(() => import('./BacteriaLab'));
const EmergencyShift = lazy(() => import('./EmergencyShift'));
const EscapeTheLab = lazy(() => import('./EscapeTheLab'));

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
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/green-prescription" element={<GreenPrescription />} />
          <Route path="/awareness-week" element={<AwarenessWeek />} />
          <Route path="/compare" element={<CompareDrugs />} />
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
            path="/medical-simulator"
            element={
              <Suspense fallback={<SimulatorLoadingFallback />}>
                <MedicalSimulator />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <AuthModal />
      <LogoutModal />
    </AuthProvider>
  );
}
