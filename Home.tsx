import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { ARTICLES } from './articlesData';
import { pick } from './types';
import Disclaimer from './Disclaimer';
import DidYouKnow from './DidYouKnow';
import ResistanceCounter from './ResistanceCounter';

export default function Home() {
  const { t, lang } = useLang();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const go = (e: FormEvent) => {
    e.preventDefault();
    nav(`/medicines?q=${encodeURIComponent(q)}`);
  };
  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <h1>{t('heroTitle')}</h1>
          <p>{t('heroSub')}</p>
          <form className="search" onSubmit={go} role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPh')} aria-label={t('search')} />
            <button className="btn">{t('search')}</button>
          </form>
          <Link to="/scan" className="btn light">
            {t('scanBtn')}
          </Link>
        </div>
      </section>

      <div className="wrap stack">
        <Disclaimer />

        {/* Did you know? — random fact each visit */}
        <DidYouKnow />

        <section>
          <div className="head">
            <h2>{t('articlesTitle')}</h2>
            <Link to="/articles">{t('seeAll')}</Link>
          </div>
          <div className="grid">
            {ARTICLES.slice(0, 3).map((a) => (
              <Link key={a.id} to={`/articles/${a.id}`} className="card link">
                <h3>{pick(a.title, lang)}</h3>
                <p>{pick(a.summary, lang)}</p>
                <span className="more">{t('read')}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Resistance counter — animated stats */}
        <ResistanceCounter />

        <section className="card quizcta">
          <div>
            <h2>{t('quizTitle')}</h2>
            <p>{t('quizIntro')}</p>
          </div>
          <Link to="/quiz" className="btn">
            {t('startQuiz')}
          </Link>
        </section>
      </div>
    </main>
  );
}
