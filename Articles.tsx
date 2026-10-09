import { Link, useParams } from 'react-router-dom';
import { useLang } from './i18n';
import { ARTICLES } from './articlesData';
import { pick } from './types';
import Disclaimer from './Disclaimer';

export default function Articles() {
  const { t, lang } = useLang();
  return (
    <main className="wrap stack">
      <h1>{t('articlesTitle')}</h1>
      <p className="muted">{t('articlePending')}</p>
      <div className="grid">
        {ARTICLES.map((a) => (
          <Link key={a.id} to={`/articles/${a.id}`} className="card link">
            <h3>{pick(a.title, lang)}</h3>
            <p>{pick(a.summary, lang)}</p>
            <span className="more">{t('read')}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function ArticlePage() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const a = ARTICLES.find((x) => x.id === id);
  if (!a)
    return (
      <main className="wrap narrow">
        <p>{t('notFound')}</p>
        <Link to="/articles">{t('navArticles')}</Link>
      </main>
    );
  return (
    <main className="wrap narrow stack">
      <Link to="/articles">← {t('navArticles')}</Link>
      <article className="prose">
        <h1>{pick(a.title, lang)}</h1>
        <p className="alert">{t('articlePending')}</p>
        {pick(a.body, lang)
          .split('\n\n')
          .map((p, i) => (
            <p key={i}>{p}</p>
          ))}
      </article>
      <Disclaimer />
    </main>
  );
}
