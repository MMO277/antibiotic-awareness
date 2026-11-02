import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from './i18n';
import { pick } from './types';
import { AUDIO_TOPICS, AudioTopic } from './audioData';
import {
  isSpeechSupported,
  SpeechPlayer,
  getVoices,
  findVoiceForLang,
} from './speechService';
import { useEmergencyLocation, formatEmergencyText } from './emergencyLocation';

export default function ListenLearn() {
  const { lang } = useLang();
  const { emergency } = useEmergencyLocation();
  const [selectedTopicId, setSelectedTopicId] = useState<string>(AUDIO_TOPICS[0].id);
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState<number>(-1);
  const [rate, setRate] = useState<number>(1.0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [supported, setSupported] = useState<boolean>(true);
  const [hasVoice, setHasVoice] = useState<boolean>(true);

  const playerRef = useRef<SpeechPlayer | null>(null);

  const selectedTopic: AudioTopic = useMemo(
    () => AUDIO_TOPICS.find((t) => t.id === selectedTopicId) || AUDIO_TOPICS[0],
    [selectedTopicId]
  );

  useEffect(() => {
    const isSupp = isSpeechSupported();
    setSupported(isSupp);
    if (!isSupp) return;

    const player = new SpeechPlayer();
    player.onStateChange = (state) => {
      setPlaying(state.playing);
      setPaused(state.paused);
    };
    playerRef.current = player;

    getVoices().then((voices) => {
      const v = findVoiceForLang(voices, lang);
      setHasVoice(Boolean(v));
    });

    return () => {
      player.stop();
    };
  }, [lang]);

  useEffect(() => {
    // Stop any ongoing speech if user changes topic
    stopPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopicId]);

  const stopPlayback = () => {
    playerRef.current?.stop();
    setPlaying(false);
    setPaused(false);
    setCurrentParagraphIdx(-1);
  };

  const pausePlayback = () => {
    playerRef.current?.pause();
  };

  const resumePlayback = () => {
    playerRef.current?.resume();
  };

  const playParagraph = async (index: number) => {
    const p = selectedTopic.paragraphs[index];
    if (!p) return;
    setCurrentParagraphIdx(index);
    const player = playerRef.current;
    if (!player) return;
    const textToSpeak = formatEmergencyText(pick(p.text, lang), emergency, lang);
    await player.speak(textToSpeak, lang, rate, () => {
      setCurrentParagraphIdx(-1);
    });
  };

  const playEntireTopic = async () => {
    stopPlayback();
    // Chain play paragraphs sequentially
    const total = selectedTopic.paragraphs.length;
    let idx = 0;

    const speakNext = async () => {
      if (idx >= total) {
        setCurrentParagraphIdx(-1);
        return;
      }
      setCurrentParagraphIdx(idx);
      const p = selectedTopic.paragraphs[idx];
      idx++;
      const player = playerRef.current;
      if (!player) return;
      const textToSpeak = formatEmergencyText(pick(p.text, lang), emergency, lang);
      await player.speak(textToSpeak, lang, rate, () => {
        speakNext();
      });
    };

    speakNext();
  };

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>🎧 {lang === 'ar' ? 'استمع وتعلّم: التثقيف الصحي الصوتي' : 'Listen & Learn: Audio Patient Education'}</h1>
        <p className="muted">
          {lang === 'ar'
            ? 'ميزة تمريضية مخصصة للاستماع إلى المحتوى التوعوي بصوت واضح باللغة العربية والإنجليزية، لخدمة كبار السن وجميع فئات المجتمع بسهولة.'
            : 'An accessible patient education feature allowing you to listen to verified antibiotic guidance instead of reading.'}
        </p>
      </header>

      {/* Browser Support / Voice Fallback Warning */}
      {!supported ? (
        <section className="notice alert">
          ⚠️ {lang === 'ar'
            ? 'ملاحظة: متصفحك الحالي لا يدعم محرك قراءة الصوت التلقائي (Web Speech API). يمكنك قراءة كافة النصوص المكتوبة بالكامل بالأسفل.'
            : 'Notice: Your browser does not support the Web Speech API. All written content remains fully available below.'}
        </section>
      ) : !hasVoice ? (
        <section className="notice quick">
          ℹ️ {lang === 'ar'
            ? `تنبيه: جهازك لا يحتوي حالياً على حزمة صوت ناطق باللغة (${lang === 'ar' ? 'العربية' : 'الإنجليزية'}). يمكنك قراءة النص المكتوب أو تجربة متصفح آخر كـ Chrome.`
            : 'Notice: Your device currently lacks a voice for this language. You can read the full text below or try Google Chrome.'}
        </section>
      ) : null}

      {/* Topic Selector Tabs */}
      <section className="card stack">
        <label style={{ fontWeight: 700, fontSize: '0.95rem' }}>
          {lang === 'ar' ? 'اختر الموضوع التوعوي للاستماع:' : 'Select an educational topic to listen to:'}
        </label>
        <div className="row wrapRow" style={{ gap: '8px' }}>
          {AUDIO_TOPICS.map((topic) => {
            const active = topic.id === selectedTopic.id;
            return (
              <button
                key={topic.id}
                type="button"
                className={`btn ${active ? '' : 'ghost'}`}
                style={{ padding: '8px 14px', fontSize: '0.92rem' }}
                onClick={() => setSelectedTopicId(topic.id)}
              >
                {topic.icon} {pick(topic.title, lang)}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Audio Player Controller */}
      <section className="card stack highlight-card" style={{ padding: '20px' }}>
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge" style={{ marginBottom: '6px' }}>{selectedTopic.icon} {pick(selectedTopic.title, lang)}</span>
            <h2 style={{ margin: 0 }}>{pick(selectedTopic.title, lang)}</h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>{pick(selectedTopic.summary, lang)}</p>
          </div>

          {/* Master Playback Controls */}
          <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
            {!playing ? (
              <button
                type="button"
                className="btn"
                style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff', fontWeight: 700 }}
                disabled={!supported}
                onClick={playEntireTopic}
              >
                ▶ {lang === 'ar' ? 'تشغيل الموضوع كاملاً' : 'Play Entire Topic'}
              </button>
            ) : paused ? (
              <button
                type="button"
                className="btn"
                style={{ background: '#0284c7', borderColor: '#0284c7', color: '#fff' }}
                onClick={resumePlayback}
              >
                ▶ {lang === 'ar' ? 'استئناف' : 'Resume'}
              </button>
            ) : (
              <button
                type="button"
                className="btn"
                style={{ background: '#d97706', borderColor: '#d97706', color: '#fff' }}
                onClick={pausePlayback}
              >
                ⏸ {lang === 'ar' ? 'إيقاف مؤقت' : 'Pause'}
              </button>
            )}

            {(playing || paused) && (
              <button
                type="button"
                className="btn ghost danger"
                onClick={stopPlayback}
              >
                ⏹ {lang === 'ar' ? 'إيقاف تام' : 'Stop'}
              </button>
            )}

            {/* Reading Speed Selector */}
            <div className="row" style={{ alignItems: 'center', gap: '4px', marginInlineStart: '6px' }}>
              <span className="small muted">{lang === 'ar' ? 'السرعة:' : 'Speed:'}</span>
              <select
                className="input"
                style={{ width: 'auto', padding: '4px 8px', fontSize: '0.85rem' }}
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
              >
                <option value="0.8">0.8x ({lang === 'ar' ? 'هادئ' : 'Slow'})</option>
                <option value="1.0">1.0x ({lang === 'ar' ? 'طبيعي' : 'Normal'})</option>
                <option value="1.2">1.2x ({lang === 'ar' ? 'سريع' : 'Fast'})</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Paragraph-by-Paragraph Interactive Reader Card */}
      <section className="card stack">
        <h3 style={{ margin: '0 0 4px' }}>
          📖 {lang === 'ar' ? 'النص التوعوي المقروء مع زر نطق لكل فقرة:' : 'Written script with individual paragraph playback:'}
        </h3>
        <p className="small muted" style={{ margin: '0 0 12px' }}>
          {lang === 'ar'
            ? 'يمكنك الضغط على زر 🔊 بجوار أي فقرة للاستماع إليها بمفردها أو تكرارها:'
            : 'Click the speaker icon next to any paragraph to listen to it individually:'}
        </p>

        <div className="stack" style={{ gap: '12px' }}>
          {selectedTopic.paragraphs.map((para, idx) => {
            const isCurrent = currentParagraphIdx === idx;
            return (
              <div
                key={idx}
                className="card"
                style={{
                  padding: '16px',
                  background: isCurrent ? 'var(--tint)' : 'var(--card-bg)',
                  borderColor: isCurrent ? 'var(--teal)' : 'var(--line)',
                  borderWidth: isCurrent ? '2px' : '1px',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <p style={{ margin: 0, fontSize: '1.02rem', lineHeight: 1.75, flex: 1 }}>
                    {formatEmergencyText(pick(para.text, lang), emergency, lang)}
                  </p>
                  <button
                    type="button"
                    className="btn ghost small"
                    style={{
                      flexShrink: 0,
                      padding: '6px 10px',
                      background: isCurrent ? 'var(--teal)' : undefined,
                      color: isCurrent ? '#fff' : undefined,
                    }}
                    disabled={!supported}
                    onClick={() => playParagraph(idx)}
                    title={lang === 'ar' ? 'استمع لهذه الفقرة' : 'Listen to this paragraph'}
                  >
                    🔊 {isCurrent ? (lang === 'ar' ? 'جارٍ النطق...' : 'Playing...') : (lang === 'ar' ? 'استمع' : 'Listen')}
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
