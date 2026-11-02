import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from './i18n';
import { ARTICLES, Article } from './articlesData';
import { pick, tr } from './types';

export default function Articles() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';

  return (
    <main className="wrap narrow stack">
      <h1>📰 {t('navArticles')}</h1>
      <p className="muted">
        {tr(
          lang,
          'مقالات وإرشادات توعوية مبسطة حول الاستخدام الرشيد للمضادات الحيوية والوقاية من المقاومة البكتيرية.',
          'Educational articles and clinical guides on responsible antibiotic use and antimicrobial resistance prevention.',
          'Articles éducatifs et guides cliniques sur le bon usage des antibiotiques et la prévention de l’antibiorésistance.',
          'Artículos educativos y guías clínicas sobre el uso responsable de los antibióticos y la prevención de la resistencia antimicrobiana.'
        )}
      </p>

      <div className="stack" style={{ gap: '12px', marginTop: '8px' }}>
        {ARTICLES.map((art: Article) => (
          <Link
            key={art.id}
            to={`/articles/${art.id}`}
            className="card link"
            style={{ textDecoration: 'none' }}
          >
            <h3 style={{ margin: '0 0 6px', color: 'var(--navy)' }}>
              {pick(art.title, lang)}
            </h3>
            <p className="small muted" style={{ margin: 0 }}>
              {pick(art.summary, lang)}
            </p>
            <span className="more" style={{ display: 'inline-block', marginTop: '6px' }}>
              {tr(lang, 'اقرأ المقال كاملاً ←', 'Read Full Article →', 'Lire l’article complet →', 'Leer el artículo completo →')}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function ArticlePage() {
  const { id = '' } = useParams();
  const { t, lang } = useLang();
  const isAr = lang === 'ar';

  const article = useMemo(() => ARTICLES.find((a) => a.id === id), [id]);

  if (!article) {
    return (
      <main className="wrap narrow stack">
        <p className="alert">{t('notFound')}</p>
        <Link to="/articles" className="btn ghost">{isAr ? '→' : '←'} {t('navArticles')}</Link>
      </main>
    );
  }

  const paragraphs = pick(article.body, lang).split(/\n\s*\n/).filter(Boolean);

  return (
    <main className="wrap narrow stack">
      <Link to="/articles" className="small muted" style={{ textDecoration: 'none', marginBottom: '6px' }}>
        {isAr ? '→' : '←'} {t('navArticles')}
      </Link>

      <article className="card stack" style={{ padding: '24px' }}>
        <h1 style={{ color: 'var(--navy)', margin: '0 0 8px' }}>
          {pick(article.title, lang)}
        </h1>
        <p className="lead" style={{ fontSize: '1.05rem', color: 'var(--teal-dark)', fontWeight: 600, margin: '0 0 16px' }}>
          {pick(article.summary, lang)}
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0 0 16px' }} />

        <div style={{ display: 'grid', gap: '12px', lineHeight: 1.8 }}>
          {paragraphs.map((para, idx) => (
            <p key={idx} style={{ margin: 0 }}>
              {para}
            </p>
          ))}
        </div>
      </article>

      <div className="row" style={{ marginTop: '12px' }}>
        <Link to="/articles" className="btn ghost">
          {isAr ? '→' : '←'} {tr(lang, 'العودة لجميع المقالات', 'Back to All Articles', 'Retour à tous les articles', 'Volver a todos los artículos')}
        </Link>
      </div>
    </main>
  );
}
