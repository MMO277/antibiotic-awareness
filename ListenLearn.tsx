import { pick } from './types';
import { useEmergencyLocation, formatEmergencyText } from './emergencyLocation';
import { useEffect, useRef, useState } from 'react';
import { useLang, SUPPORTED_LANGS } from './i18n';
import { LISTEN_TOPICS, ListenTopic } from './listenData';
import {
  isSpeechSupported,
  getVoices,
  findVoiceForLang,
  SpeechPlayer,
} from './speechService';

export default function ListenLearn() {
  const { lang, setLang } = useLang();
  const { emergency } = useEmergencyLocation();
  const [selectedTopicId, setSelectedTopicId] = useState<string>('what-are-antibiotics');
  const [selectedTopic, setSelectedTopic] = useState<ListenTopic>(LISTEN_TOPICS[0]);
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState<number>(-1);

  // Playback state
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [supported, setSupported] = useState(true);
  const [hasVoice, setHasVoice] = useState(true);

  const playerRef = useRef<SpeechPlayer | null>(null);

  useEffect(() => {
    const isSup = isSpeechSupported();
    setSupported(isSup);

    const player = new SpeechPlayer();
    playerRef.current = player;

    player.onStateChange = (state) => {
      setPlaying(state.playing);
      setPaused(state.paused);
    };

    // Check available voices
    if (isSup) {
      getVoices().then((voices) => {
        const v = findVoiceForLang(voices, lang);
        setHasVoice(!!v);
      });
    }

    return () => {
      player.stop();
    };
  }, []);

  // Update voice check on language change
  useEffect(() => {
    if (supported) {
      getVoices().then((voices) => {
        const v = findVoiceForLang(voices, lang);
        setHasVoice(!!v);
      });
    }
    stopPlayback();
  }, [lang]);

  // Update selected topic object
  useEffect(() => {
    const t = LISTEN_TOPICS.find((item) => item.id === selectedTopicId) || LISTEN_TOPICS[0];
    setSelectedTopic(t);
    stopPlayback();
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
    await playerRef.current?.speakText(formatEmergencyText(pick(p.text, lang), emergency, lang), lang, rate, () => {
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
      await playerRef.current?.speakText(formatEmergencyText(pick(p.text, lang), emergency, lang), lang, rate, () => {
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

      {/* Topic selection chips */}
      <section className="card stack">
        <h2>📑 {lang === 'ar' ? 'اختر موضوع التوعية للاستماع:' : 'Select an Educational Topic to Listen:'}</h2>
        <div className="listen-topic-chips">
          {LISTEN_TOPICS.map((top) => (
            <button
              key={top.id}
              type="button"
              className={`listen-chip ${selectedTopicId === top.id ? 'active' : ''}`}
              onClick={() => setSelectedTopicId(top.id)}
            >
              <span className="chip-icon">{top.icon}</span>
              <span className="chip-text">{pick(top.title, lang)}</span>
              <small className="chip-dur">⏱️ {pick(top.durationEst, lang)}</small>
            </button>
          ))}
        </div>
      </section>

      {/* Main Interactive Audio Player Box */}
      <section className="card stack audio-player-card" aria-label="Audio Player">
        <div className="player-header">
          <div className="topic-badge-row">
            <span className="topic-icon">{selectedTopic.icon}</span>
            <div>
              <h2>{pick(selectedTopic.title, lang)}</h2>
              <p className="small muted">{formatEmergencyText(pick(selectedTopic.summary, lang), emergency, lang)}</p>
            </div>
          </div>
          <div className="status-pill-wrap">
            {playing && !paused && <span className="status-pill safe">▶️ {lang === 'ar' ? 'جاري الاستماع...' : 'Playing...'}</span>}
            {paused && <span className="status-pill unconfirmed">⏸️ {lang === 'ar' ? 'متوقف مؤقتاً' : 'Paused'}</span>}
            {!playing && !paused && <span className="status-pill upcoming">⏹️ {lang === 'ar' ? 'جاهز للاستماع' : 'Ready'}</span>}
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="player-controls-row">
          <div className="main-audio-btns">
            {!playing ? (
              <button
                type="button"
                className="btn btn-listen-all"
                onClick={playEntireTopic}
                disabled={!supported}
              >
                ▶️ {lang === 'ar' ? 'قراءة الموضوع كاملاً' : 'Listen to All'}
              </button>
            ) : paused ? (
              <button type="button" className="btn btn-resume" onClick={resumePlayback}>
                ▶️ {lang === 'ar' ? 'استئناف' : 'Resume'}
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={pausePlayback}>
                ⏸️ {lang === 'ar' ? 'إيقاف مؤقت' : 'Pause'}
              </button>
            )}

            {(playing || paused) && (
              <button type="button" className="btn-secondary danger" onClick={stopPlayback}>
                ⏹️ {lang === 'ar' ? 'إيقاف' : 'Stop'}
              </button>
            )}
          </div>

          {/* Speed & Language Controls */}
          <div className="player-settings-row">
            <div className="speed-control">
              <small><b>{lang === 'ar' ? 'السرعة:' : 'Speed:'}</b></small>
              <div className="speed-buttons">
                {[0.75, 1.0, 1.25].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`speed-btn ${rate === r ? 'active' : ''}`}
                    onClick={() => {
                      setRate(r);
                      if (playing) {
                        stopPlayback();
                      }
                    }}
                  >
                    {r}×
                  </button>
                ))}
              </div>
            </div>

            <div className="lang-toggle-player" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {SUPPORTED_LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={`speed-btn ${lang === l.code ? 'active' : ''}`}
                  onClick={() => setLang(l.code)}
                  title={l.nativeLabel}
                >
                  {l.flag} {l.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Alert Box if topic has one */}
        {selectedTopic.emergencyNote && (
          <div className="alert urgent" style={{ marginTop: '14px' }}>
            <strong>🚨 {lang === 'ar' ? 'تنبيه طوارئ فوري:' : 'Urgent Emergency Notice:'} </strong>
            {formatEmergencyText(pick(selectedTopic.emergencyNote, lang), emergency, lang)}
          </div>
        )}

        {/* Synchronized Text View with Paragraph Highlight */}
        <div className="paragraphs-view stack">
          <h3>📖 {lang === 'ar' ? 'نص الموضوع (متاح للقراءة والاستماع):' : 'Written Content (Read along):'}</h3>
          {selectedTopic.paragraphs.map((p, idx) => {
            const isCurrent = currentParagraphIdx === idx;
            return (
              <div
                key={p.id}
                className={`paragraph-card ${isCurrent ? 'active-reading' : ''}`}
              >
                <div className="p-header">
                  <span className="p-number">#{idx + 1}</span>
                  <button
                    type="button"
                    className="p-listen-btn"
                    onClick={() => playParagraph(idx)}
                    title={lang === 'ar' ? 'استمع لهذه الفقرة فقط' : 'Listen to this paragraph'}
                  >
                    🔊 {lang === 'ar' ? 'استمع للفقرة' : 'Listen'}
                  </button>
                </div>
                <p className="p-text">{formatEmergencyText(pick(p.text, lang), emergency, lang)}</p>
              </div>
            );
          })}
        </div>

        {/* Documented Sources Footer */}
        <div className="player-sources-footer">
          <small className="muted">
            <b>{lang === 'ar' ? 'المصادر المعتمدة لهذا المحتوى:' : 'Clinical Sources:'}</b>{' '}
            {selectedTopic.sources.map((s, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.publisher || s.title}</a>
              </span>
            ))}
          </small>
        </div>
      </section>
    </main>
  );
}
