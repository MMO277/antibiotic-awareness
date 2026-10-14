import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import {
  CAMPAIGN_POSTERS,
  getNovemberCampaignStatus,
  SHORT_VIDEO_REELS,
  SOCIAL_CAMPAIGN_POSTS,
} from './awarenessWeekData';
import { speakText, stopSpeech } from './speechService';

type CampaignTab = 'posters' | 'videos' | 'social_kit' | 'pledge';

export default function AwarenessWeek() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<CampaignTab>('posters');
  const [simulateNovemberLive, setSimulateNovemberLive] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string>('');
  const [speakingReelId, setSpeakingReelId] = useState<string | null>(null);
  const [pledged, setPledged] = useState<boolean>(false);
  const [pledgeCount, setPledgeCount] = useState<number>(1428);

  const status = useMemo(() => getNovemberCampaignStatus(new Date()), []);
  const isCampaignLive = status.isNovember || simulateNovemberLive;

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const siteUrl = `${window.location.origin}${window.location.pathname}`;

  function handleCopyText(id: string, text: string) {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2500);
  }

  function handleShareWhatsApp(text: string) {
    const full = `${text}\n${siteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, '_blank', 'noopener,noreferrer');
  }

  function toggleReelAudio(reelId: string, scriptText: string) {
    if (speakingReelId === reelId) {
      stopSpeech();
      setSpeakingReelId(null);
    } else {
      stopSpeech();
      setSpeakingReelId(reelId);
      speakText(scriptText, lang, 1.0, () => setSpeakingReelId(null));
    }
  }

  return (
    <main className="wrap stack">
      <div className="row wrapRow no-print" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/">← {isAr ? 'الرئيسية' : 'Home'}</Link>
        <button
          type="button"
          className={`btn small ${simulateNovemberLive ? '' : 'ghost'}`}
          onClick={() => setSimulateNovemberLive((v) => !v)}
        >
          {simulateNovemberLive
            ? isAr
              ? '🔵 وضع شهر نوفمبر النشط مفعّل (إيقاف المعاينة)'
              : '🔵 November Live Mode Active (Exit Preview)'
            : isAr
            ? '👁️ معاينة شكل القسم أثناء التفعيل السنوي في نوفمبر'
            : '👁️ Preview November Annual Live Activation'}
        </button>
      </div>

      {/* Go Blue Hero Banner with Smart November Countdown / Live Status */}
      <header
        className="card"
        style={{
          background: isCampaignLive
            ? 'radial-gradient(circle at 85% 20%, rgba(56, 189, 248, 0.35), transparent 45%), linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #0284c7 100%)'
            : 'linear-gradient(135deg, #0b3c5d 0%, #1565a8 60%, #0e9aa7 100%)',
          color: '#fff',
          padding: '28px 24px',
          border: isCampaignLive ? '3px solid #38bdf8' : 'none',
        }}
      >
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ maxWidth: '64ch' }}>
            <div className="row wrapRow" style={{ gap: '8px', marginBottom: '10px' }}>
              <span
                className="badge"
                style={{
                  background: isCampaignLive ? '#ef4444' : 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.35)',
                  padding: '4px 12px',
                  fontWeight: 700,
                }}
              >
                {isCampaignLive
                  ? isAr
                    ? '🔴 الحملة السنوية مفعّلة الآن — شهر نوفمبر (WAAW LIVE)'
                    : '🔴 ANNUAL NOVEMBER CAMPAIGN LIVE NOW'
                  : isAr
                  ? '📅 فعالية سنوية: 18 – 24 نوفمبر من كل عام'
                  : '📅 Annual Event: 18 – 24 November'}
              </span>
              <span
                className="badge"
                style={{
                  background: 'rgba(56, 189, 248, 0.25)',
                  color: '#e0f2fe',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  padding: '4px 12px',
                }}
              >
                💙 #GoBlueForAMR
              </span>
            </div>

            <h1 style={{ color: '#fff', margin: '0 0 8px', fontSize: 'clamp(1.5rem, 4vw, 2.15rem)' }}>
              🌍 {isAr ? 'الأسبوع العالمي للتوعية بالمضادات الحيوية (WAAW)' : 'World AMR Awareness Week (WAAW) Hub'}
            </h1>
            <p style={{ color: '#e0f2fe', margin: 0, lineHeight: 1.7 }}>
              {isAr
                ? 'مركز الحملات التوعوية الجاهزة للنشر والتداول: بوسترات إنفوجرافيك مصممة، فيديوهات قصيرة وريلز مع تعليق صوتي، ومنشورات جاهزة للنسخ والمشاركة عبر واتساب والسوشيال ميديا لنشر ثقافة الاستخدام الواعي للمضادات الحيوية.'
                : 'Ready-to-share awareness hub: visual infographic posters, 60-second short video scripts with audio narration, and one-click social media campaign kits.'}
            </p>
          </div>

          {/* Countdown Box or Live Badge */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '14px',
              padding: '14px 18px',
              textAlign: 'center',
              minWidth: '220px',
              backdropFilter: 'blur(8px)',
            }}
          >
            {isCampaignLive ? (
              <div>
                <div style={{ fontSize: '2rem' }}>💙</div>
                <b style={{ color: '#38bdf8', display: 'block', fontSize: '1.05rem' }}>
                  {isAr ? 'حملة نوفمبر الزرقاء نشطة الآن!' : 'November Blue Campaign Active!'}
                </b>
                <small style={{ color: '#cbd5e1' }}>
                  {isAr ? 'شارك البوسترات والرسائل مع عائلتك اليوم' : 'Share posters & messages today'}
                </small>
              </div>
            ) : (
              <div>
                <div className="small" style={{ color: '#bae6fd', marginBottom: '6px', fontWeight: 600 }}>
                  ⏳ {isAr ? `العد التنازلي لانطلاق حملة 18 نوفمبر ${status.targetYear}:` : `Countdown to 18 Nov ${status.targetYear}:`}
                </div>
                <div className="row" style={{ justifyContent: 'center', gap: '12px' }}>
                  <div>
                    <b style={{ fontSize: '1.5rem', color: '#38bdf8', display: 'block', lineHeight: 1.1 }}>{status.days}</b>
                    <small style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{isAr ? 'يوم' : 'Days'}</small>
                  </div>
                  <span>:</span>
                  <div>
                    <b style={{ fontSize: '1.5rem', color: '#38bdf8', display: 'block', lineHeight: 1.1 }}>{status.hours}</b>
                    <small style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{isAr ? 'ساعة' : 'Hours'}</small>
                  </div>
                  <span>:</span>
                  <div>
                    <b style={{ fontSize: '1.5rem', color: '#38bdf8', display: 'block', lineHeight: 1.1 }}>{status.minutes}</b>
                    <small style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{isAr ? 'دقيقة' : 'Mins'}</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Campaign Navigation Tabs */}
      <div className="row wrapRow no-print" style={{ gap: '8px', borderBottom: '2px solid var(--line)', paddingBottom: '12px' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'posters' ? '' : 'ghost'}`}
          onClick={() => setActiveTab('posters')}
        >
          🖼️ {isAr ? `بوسترات وصور الإنفوجرافيك (${CAMPAIGN_POSTERS.length})` : `Infographic Posters (${CAMPAIGN_POSTERS.length})`}
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'videos' ? '' : 'ghost'}`}
          onClick={() => setActiveTab('videos')}
        >
          🎬 {isAr ? `الفيديوهات القصيرة والريلز (${SHORT_VIDEO_REELS.length})` : `Short Videos & Reels (${SHORT_VIDEO_REELS.length})`}
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'social_kit' ? '' : 'ghost'}`}
          onClick={() => setActiveTab('social_kit')}
        >
          📲 {isAr ? `حملات ومنشورات جاهزة للنسخ (${SOCIAL_CAMPAIGN_POSTS.length})` : `Ready-to-Share Posts (${SOCIAL_CAMPAIGN_POSTS.length})`}
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'pledge' ? '' : 'ghost'}`}
          onClick={() => setActiveTab('pledge')}
        >
          💙 {isAr ? 'تعهد سفير الوعي' : 'Ambassador Pledge'}
        </button>
      </div>

      {/* TAB 1: VISUAL INFOGRAPHIC POSTERS */}
      {activeTab === 'posters' && (
        <section className="stack">
          <div className="head">
            <div>
              <h2>🖼️ {isAr ? 'بطاقات وبوسترات الإنفوجرافيك الجاهزة للمشاركة والطباعة' : 'Visual Infographic Posters Ready to Share & Print'}</h2>
              <p className="small muted" style={{ margin: 0 }}>
                {isAr
                  ? 'بوسترات بصرية مصممة لتصحيح المفاهيم الشائعة؛ يمكنك نسخ محتواها أو إرسالها مباشرة عبر واتساب أو طباعتها كملصقات توعوية:'
                  : 'Visual campaign cards ready to share via WhatsApp, copy, or print as educational posters:'}
              </p>
            </div>
            <button type="button" className="btn ghost small no-print" onClick={() => window.print()}>
              🖨️ {isAr ? 'طباعة جميع البوسترات PDF' : 'Print All Posters PDF'}
            </button>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '18px' }}>
            {CAMPAIGN_POSTERS.map((poster) => {
              const shareText = `${poster.title[lang]}\n\n${poster.myth[lang]}\n\n${poster.fact[lang]}\n\n${poster.actionTip[lang]}`;
              return (
                <article
                  key={poster.id}
                  className="card stack"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: `2px solid ${poster.accentColor}40`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Visual Poster Top Header */}
                  <div
                    style={{
                      background: poster.gradient,
                      color: '#fff',
                      padding: '20px',
                    }}
                  >
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.35)',
                        }}
                      >
                        {poster.badge[lang]}
                      </span>
                      <span style={{ fontSize: '2.2rem' }}>{poster.icon}</span>
                    </div>
                    <h3 style={{ color: '#fff', margin: 0, fontSize: '1.15rem', lineHeight: 1.45 }}>
                      {poster.title[lang]}
                    </h3>
                  </div>

                  {/* Poster Body */}
                  <div className="stack" style={{ padding: '18px', gap: '10px', flex: 1 }}>
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        color: '#991b1b',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      {poster.myth[lang]}
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#f0fdf4',
                        color: '#166534',
                        fontSize: '0.92rem',
                        lineHeight: 1.65,
                      }}
                    >
                      {poster.fact[lang]}
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--tint)',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                      }}
                    >
                      {poster.actionTip[lang]}
                    </div>
                  </div>

                  {/* Poster Share Footer */}
                  <div
                    className="row wrapRow no-print"
                    style={{
                      padding: '12px 18px',
                      borderTop: '1px solid var(--line)',
                      gap: '8px',
                      background: 'var(--bg-subtle, #f8fafc)',
                    }}
                  >
                    <button
                      type="button"
                      className="btn small"
                      style={{ flex: 1, background: poster.accentColor, borderColor: poster.accentColor }}
                      onClick={() => handleShareWhatsApp(shareText)}
                    >
                      📲 {isAr ? 'نشر على واتساب' : 'Share on WhatsApp'}
                    </button>
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => handleCopyText(poster.id, shareText)}
                    >
                      {copiedId === poster.id
                        ? isAr
                          ? '✅ تم النسخ'
                          : '✅ Copied'
                        : isAr
                        ? '📋 نسخ البوستر'
                        : '📋 Copy Text'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: SHORT VIDEOS & 60-SECOND REELS */}
      {activeTab === 'videos' && (
        <section className="stack">
          <h2>🎬 {isAr ? 'مكتبة الفيديوهات التوعوية القصيرة والريلز (60 ثانية)' : 'Short Educational Videos & 60-Second Reels'}</h2>
          <p className="small muted">
            {isAr
              ? 'مقاطع توعوية قصيرة مركزة مع إمكانية الاستماع الفوري للتعليق الصوتي باللغة العربية أو الإنجليزية أو نسخ السيناريو لنشره كـ Reel أو TikTok أو Shorts:'
              : 'Short-form video scripts with built-in voice narration and one-click script copying for Reels/Shorts:'}
          </p>

          <div className="stack" style={{ gap: '16px' }}>
            {SHORT_VIDEO_REELS.map((reel) => {
              const isPlaying = speakingReelId === reel.id;
              return (
                <article
                  key={reel.id}
                  className="card stack"
                  style={{ borderInlineStart: '5px solid #0284c7' }}
                >
                  <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="row" style={{ gap: '10px' }}>
                      <span style={{ fontSize: '2rem' }}>{reel.icon}</span>
                      <div>
                        <h3 style={{ margin: 0 }}>{reel.title[lang]}</h3>
                        <small className="muted">{reel.summary[lang]}</small>
                      </div>
                    </div>
                    <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                      ⏱️ {reel.duration}
                    </span>
                  </div>

                  {/* Visual Storyboard & Narration Script Box */}
                  <div
                    className="card"
                    style={{
                      background: 'var(--bg-subtle, #f8fafc)',
                      border: '1px solid var(--line)',
                      lineHeight: 1.8,
                    }}
                  >
                    <div className="small muted" style={{ marginBottom: '4px', fontWeight: 700 }}>
                      🎙️ {isAr ? 'النص الصوتي والسيناريو الكامل للفيديو:' : 'Full Voiceover & Reel Script:'}
                    </div>
                    <p style={{ margin: 0, fontSize: '1rem' }}>«{reel.narrationScript[lang]}»</p>
                    <div style={{ marginTop: '8px', color: '#0d9488', fontWeight: 700, fontSize: '0.9rem' }}>
                      🎯 {isAr ? 'الرسالة الأساسية:' : 'Key Takeaway:'} {reel.keyTakeaway[lang]}
                    </div>
                  </div>

                  <div className="row wrapRow" style={{ gap: '10px' }}>
                    <button
                      type="button"
                      className={`btn small ${isPlaying ? 'danger' : ''}`}
                      onClick={() => toggleReelAudio(reel.id, reel.narrationScript[lang])}
                    >
                      {isPlaying
                        ? isAr
                          ? '⏹️ إيقاف التعليق الصوتي'
                          : '⏹️ Stop Audio'
                        : isAr
                        ? '🔊 استمع للتعليق الصوتي للفيديو الآن'
                        : '🔊 Listen to Voiceover Narration'}
                    </button>

                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => handleCopyText(reel.id, `${reel.title[lang]}\n\n${reel.narrationScript[lang]}`)}
                    >
                      {copiedId === reel.id
                        ? isAr
                          ? '✅ تم نسخ السيناريو'
                          : '✅ Script Copied'
                        : isAr
                        ? '📋 نسخ سيناريو الـ Reel'
                        : '📋 Copy Reel Script'}
                    </button>

                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => handleShareWhatsApp(`${reel.title[lang]}\n\n${reel.narrationScript[lang]}`)}
                    >
                      📲 {isAr ? 'مشاركة على واتساب' : 'Share on WhatsApp'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: READY-TO-SHARE SOCIAL MEDIA & WHATSAPP CAMPAIGN KIT */}
      {activeTab === 'social_kit' && (
        <section className="stack">
          <h2>📲 {isAr ? 'حملات ومنشورات جاهزة للنسخ والنشر الفوري' : 'Ready-to-Copy Social Media & WhatsApp Campaigns'}</h2>
          <p className="small muted">
            {isAr
              ? 'منشورات معدة مسبقاً بالهاشتاجات الرسمية للأسبوع العالمي للوعي بالمضادات الحيوية، جاهزة للنسخ أو الإرسال المباشر بضغطة واحدة:'
              : 'Pre-written posts with official WAAW hashtags ready for instant copying or sharing:'}
          </p>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {SOCIAL_CAMPAIGN_POSTS.map((post) => {
              const fullPost = `${post.content[lang]}\n${siteUrl}\n\n${post.hashtags}`;
              return (
                <div key={post.id} className="card stack" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge approved">{post.icon} {post.platform[lang]}</span>
                    </div>
                    <h3 style={{ margin: '0 0 8px' }}>{post.title[lang]}</h3>
                    <pre
                      className="pre small"
                      style={{
                        background: 'var(--bg-subtle, #f8fafc)',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        fontFamily: 'inherit',
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {post.content[lang]}
                      {'\n\n'}
                      <span style={{ color: '#0284c7', fontWeight: 600 }}>{post.hashtags}</span>
                    </pre>
                  </div>

                  <div className="row wrapRow" style={{ gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn small"
                      style={{ flex: 1 }}
                      onClick={() => handleShareWhatsApp(fullPost)}
                    >
                      📲 {isAr ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}
                    </button>
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => handleCopyText(post.id, fullPost)}
                    >
                      {copiedId === post.id
                        ? isAr
                          ? '✅ تم النسخ!'
                          : '✅ Copied!'
                        : isAr
                        ? '📋 نسخ المنشور'
                        : '📋 Copy Post'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: DIGITAL STEWARDSHIP AMBASSADOR PLEDGE */}
      {activeTab === 'pledge' && (
        <section className="card highlight-card stack" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: '3rem' }}>💙</div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
            {isAr ? 'ميثاق وتعهد الأسبوع العالمي للوعي بالمضادات الحيوية' : 'World AMR Awareness Week Stewardship Pledge'}
          </h2>
          <p className="muted" style={{ maxWidth: '62ch', marginInline: 'auto' }}>
            {isAr
              ? 'انضم إلى حملة «ارتدِ الأزرق #GoBlue» وتعهد بحماية فعالية المضادات الحيوية لك ولأسرتك وللأجيال القادمة:'
              : 'Join the #GoBlue campaign and pledge to protect the effectiveness of life-saving antibiotics:'}
          </p>

          <div
            className="card"
            style={{
              maxWidth: '620px',
              marginInline: 'auto',
              textAlign: 'start',
              border: '2px solid #0284c7',
              background: 'var(--card-bg, #fff)',
            }}
          >
            <h3 style={{ color: '#0284c7', margin: '0 0 10px' }}>
              📜 {isAr ? 'بنود التعهد الصحي الأربع:' : 'The 4 Stewardship Commitments:'}
            </h3>
            <ul style={{ margin: 0, paddingInlineStart: '20px', lineHeight: 1.9 }}>
              <li>{isAr ? 'أتعهد بعدم تناول أو شراء أي مضاد حيوي دون وصفة طبية معتمدة.' : 'I will never take antibiotics without a medical prescription.'}</li>
              <li>{isAr ? 'أتعهد بعدم استخدام المضادات الحيوية أو «حقنة البرد» لعلاج نزلات البرد والإنفلونزا الفيروسية.' : 'I will not use antibiotics or mixed cold shots for viral colds or flu.'}</li>
              <li>{isAr ? 'أتعهد بإكمال كورس المضاد الحيوي الموصوف للنهاية وعدم مشاركته مع الآخرين.' : 'I will complete my prescribed course and never share antibiotics with others.'}</li>
              <li>{isAr ? 'أتعهد بنشر الوعي الصحي والتخلص الآمن من بقايا الأدوية لحماية البيئة.' : 'I will share awareness and dispose of leftover medicines safely.'}</li>
            </ul>
          </div>

          <div style={{ marginTop: '10px' }}>
            {!pledged ? (
              <button
                type="button"
                className="btn"
                style={{ fontSize: '1.1rem', padding: '12px 28px', background: '#0284c7', borderColor: '#0284c7' }}
                onClick={() => {
                  setPledged(true);
                  setPledgeCount((c) => c + 1);
                }}
              >
                ✋ {isAr ? 'أعلن تعهدي الآن وأشارك في الحملة' : 'Take the Stewardship Pledge Now'}
              </button>
            ) : (
              <div className="stack" style={{ alignItems: 'center' }}>
                <div className="badge approved" style={{ fontSize: '1rem', padding: '8px 18px' }}>
                  🎉 {isAr ? 'شكراً لك! أنت الآن سفير للوعي بالمضادات الحيوية' : 'Thank You! You Are Now an Antibiotic Stewardship Ambassador'}
                </div>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() =>
                    handleShareWhatsApp(
                      isAr
                        ? '💙 لقد شاركت في تعهد الأسبوع العالمي للوعي بالمضادات الحيوية لحماية صحتنا من السلالات البكتيرية المقاومة! شارك معنا عبر المنصة:'
                        : '💙 I just took the World AMR Awareness Week Pledge! Join us on the platform:'
                    )
                  }
                >
                  📲 {isAr ? 'شارك تعهدك مع أصدقائك على واتساب' : 'Share Your Pledge on WhatsApp'}
                </button>
              </div>
            )}
            <div className="small muted" style={{ marginTop: '10px' }}>
              👥 {isAr ? `إجمالي المشاركين في التعهد التوعوي: ${pledgeCount.toLocaleString()} مشارك` : `Total community pledges: ${pledgeCount.toLocaleString()}`}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
