import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import {
  CAMPAIGN_POSTERS,
  SHORT_VIDEO_REELS,
  SOCIAL_CAMPAIGN_POSTS,
} from './awarenessWeekData';

export default function AwarenessWeek() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [copiedId, setCopiedId] = useState<string>('');

  const siteUrl = `${window.location.origin}${window.location.pathname}`;

  function handleCopy(id: string, text: string) {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  }

  function handleWhatsApp(text: string) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + '\n' + siteUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  return (
    <main className="wrap stack">
      <Link to="/">← {isAr ? 'الرئيسية' : 'Home'}</Link>

      {/* Simple Clean Header */}
      <header className="card" style={{ borderInlineStart: '5px solid #0284c7', padding: '20px' }}>
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', marginBottom: '6px' }}>
              📅 {isAr ? '18 – 24 نوفمبر من كل عام' : '18 – 24 November Annually'}
            </span>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
              🌍 {isAr ? 'الأسبوع العالمي للوعي بالمضادات الحيوية' : 'World Antibiotic Awareness Week'}
            </h1>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'فيديوهات قصيرة وبطاقات توعوية مبسطة جاهزة للمشاهدة والمشاركة السريعة.'
                : 'Simple educational videos and quick awareness cards ready to watch and share.'}
            </p>
          </div>
        </div>
      </header>

      {/* 1. Simple Videos Grid */}
      <section className="stack">
        <h2 style={{ margin: 0 }}>
          🎬 {isAr ? 'فيديوهات توعوية قصيرة' : 'Short Educational Videos'}
        </h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
          {SHORT_VIDEO_REELS.map((reel) => (
            <div key={reel.id} className="card stack" style={{ padding: '14px', gap: '10px' }}>
              <div
                style={{
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#000',
                  aspectRatio: '16 / 9',
                }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${reel.youtubeId}?rel=0`}
                  title={reel.title[lang]}
                  style={{ width: '100%', height: '100%', border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{reel.title[lang]}</h3>
              <p className="small muted" style={{ margin: 0 }}>{reel.keyTakeaway[lang]}</p>
              <div className="row" style={{ gap: '8px' }}>
                <a
                  href={reel.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn small"
                  style={{ flex: 1 }}
                >
                  ▶️ {isAr ? 'مشاهدة على يوتيوب' : 'Watch on YouTube'}
                </a>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => handleWhatsApp(`${reel.title[lang]}\n${reel.youtubeUrl}`)}
                >
                  📲 {isAr ? 'مشاركة' : 'Share'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Simple Visual Cards (Top 4 Key Messages) */}
      <section className="stack">
        <h2 style={{ margin: 0 }}>
          🖼️ {isAr ? 'بطاقات التوعية السريعة' : 'Quick Awareness Cards'}
        </h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '14px' }}>
          {CAMPAIGN_POSTERS.slice(0, 4).map((p) => {
            const text = `${p.title[lang]}\n${p.myth[lang]}\n${p.fact[lang]}`;
            return (
              <div
                key={p.id}
                className="card stack"
                style={{
                  borderTop: `4px solid ${p.accentColor}`,
                  justifyContent: 'space-between',
                }}
              >
                <div className="stack" style={{ gap: '8px' }}>
                  <div className="row" style={{ gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{p.icon}</span>
                    <h3 style={{ margin: 0, fontSize: '1.02rem' }}>{p.title[lang]}</h3>
                  </div>
                  <p className="small" style={{ margin: 0, color: '#b91c1c' }}>{p.myth[lang]}</p>
                  <p className="small" style={{ margin: 0, color: '#15803d', fontWeight: 600 }}>{p.fact[lang]}</p>
                </div>

                <div className="row" style={{ gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn small"
                    style={{ flex: 1 }}
                    onClick={() => handleWhatsApp(text)}
                  >
                    📲 {isAr ? 'نشر واتساب' : 'Share'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => handleCopy(p.id, text)}
                  >
                    {copiedId === p.id ? (isAr ? '✅ تم النسخ' : '✅ Copied') : (isAr ? '📋 نسخ' : '📋 Copy')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Simple Ready-to-Share Messages */}
      <section className="stack">
        <h2 style={{ margin: 0 }}>
          💬 {isAr ? 'رسائل جاهزة للنشر السريع' : 'Ready-to-Share Messages'}
        </h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {SOCIAL_CAMPAIGN_POSTS.map((post) => {
            const fullText = `${post.content[lang]}\n${post.hashtags}`;
            return (
              <div key={post.id} className="card stack" style={{ justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1rem' }}>
                    {post.icon} {post.title[lang]}
                  </h3>
                  <p className="small pre" style={{ margin: 0, lineHeight: 1.65 }}>
                    {post.content[lang]}
                  </p>
                </div>
                <div className="row" style={{ gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn small"
                    style={{ flex: 1 }}
                    onClick={() => handleWhatsApp(fullText)}
                  >
                    📲 {isAr ? 'إرسال واتساب' : 'WhatsApp'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => handleCopy(post.id, fullText)}
                  >
                    {copiedId === post.id ? (isAr ? '✅ تم النسخ' : '✅ Copied') : (isAr ? '📋 نسخ' : '📋 Copy')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
