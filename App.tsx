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
import Editor from './Editor';

function ConfigMissing() {
  return (
    <main className="wrap narrow">
      <div className="card">
        <h1>Firebase is not configured</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code>, paste your Firebase web app values, then restart{' '}
          <code>npm run dev</code>. See README.md, step 3.
        </p>
        <p dir="rtl">انسخ الملف <code>.env.example</code> إلى <code>.env.local</code> وأدخل قيم Firebase ثم أعد تشغيل المشروع.</p>
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
  if (!configured) return <ConfigMissing />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/medicines" element={<Medicines />} />
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
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/new" element={<Editor />} />
        <Route path="/admin/medicine/:id" element={<Editor />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
