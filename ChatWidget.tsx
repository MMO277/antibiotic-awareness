import { pick, tr } from './types';
import { useEmergencyLocation, pickCountryName } from './emergencyLocation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import {
  buildPassages,
  respond,
  ChatUiMessage,
  extractAnswerPlainText,
  isDirectVerifiedMatch,
} from './assistantLogic';
import { askGemini, ChatMessage, cleanAssistantMarkdown } from './geminiApi';
import {
  isVoiceRecognitionSupported,
  speakText,
  startVoiceRecognition,
  stopSpeech,
  VoiceRecognitionHandle,
} from './speechService';

const WIDGET_CHIPS: Record<string, string[]> = {
  ar: [
    'هل المضاد الحيوي يعالج البرد؟',
    'مخاطر حقنة البرد الشعبية؟',
    'أفضل مضاد حيوي للأسنان؟',
    'ماذا أفعل لو نسيت الجرعة؟',
    'هل الحليب يبطل مفعول المضاد؟',
  ],
  en: [
    'Do antibiotics treat colds?',
    'Dangers of cold shot mixtures?',
    'Best antibiotic for dental pain?',
    'What if I miss a dose?',
    'Does milk interact with antibiotics?',
  ],
  fr: [
    'Les antibiotiques soignent-ils le rhume ?',
    'Dangers des injections contre le rhume ?',
    'Antibiotique et douleur dentaire ?',
    'Que faire en cas d’oubli de dose ?',
    'Le lait bloque-t-il l’antibiotique ?',
  ],
  es: [
    '¿Los antibióticos curan el resfriado?',
    '¿Peligros de la inyección para el resfriado?',
    '¿Antibiótico para el dolor dental?',
    '¿Qué hacer si olvido una dosis?',
    '¿La leche afecta al antibiótico?',
  ],
  de: [
    "Helfen Antibiotika bei Erkältung?",
    "Gefahren der 3-in-1-Erkältungsspritze?",
    "Welches Antibiotikum bei Zahnschmerzen?",
    "Was tun bei vergessener Dosis?",
    "Blockiert Milch das Antibiotikum?",
  ],
};

export default function ChatWidget() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { emergency, countryName, selectedOverride, setCountryOverride, countriesList } = useEmergencyLocation();
  const { items } = useApproved();
  const meds = useMemo(() => items ?? [], [items]);
  const passages = useMemo(() => buildPassages(meds), [meds]);

  const [isOpen, setIsOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatUiMessage[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const stopListenRef = useRef<VoiceRecognitionHandle | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Bacteria Hunter Gaming Mode: close any open panel when gameplay starts (the widget itself is hidden by CSS)
  useEffect(() => {
    const onGaming = (e: Event) => {
      if ((e as CustomEvent<{ active: boolean }>).detail?.active) {
        stopSpeech();
        stopListenRef.current?.stop();
        stopListenRef.current = null;
        setListening(false);
        setIsOpen(false);
        setSosOpen(false);
      }
    };
    window.addEventListener('bh:gaming-mode', onGaming);
    return () => window.removeEventListener('bh:gaming-mode', onGaming);
  }, []);

  useEffect(() => {
    return () => {
      stopSpeech();
      stopListenRef.current?.stop();
      stopListenRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [msgs, loading, isOpen]);

  async function ask(raw: string, speakReply = false) {
    const text = raw.trim().slice(0, 300);
    if (!text || loading) return;
    const date = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB');

    setMsgs((m) => [...m, { who: 'me', text }]);
    setQ('');
    setLoading(true);

    // 1) Check Verified Clinical Database & Condition Protocols FIRST
    const localReply = respond(passages, meds, text);
    if (isDirectVerifiedMatch(localReply)) {
      const botMsg: ChatUiMessage = { who: 'bot', reply: localReply, date, isAi: false };
      setMsgs((m) => [...m, botMsg]);
      setLoading(false);
      if (speakReply) speakText(extractAnswerPlainText(botMsg, lang), lang);
      return;
    }

    // 2) For open-ended questions, use AI Assistant with clean formatting
    try {
      const history: ChatMessage[] = msgs.map((m) => ({
        who: m.who,
        text: extractAnswerPlainText(m, lang),
      }));

      const aiResponse = await askGemini(text, history);
      const botMsg: ChatUiMessage = { who: 'bot', text: aiResponse, date, isAi: true };
      setMsgs((m) => [...m, botMsg]);
      setLoading(false);
      if (speakReply) speakText(aiResponse, lang);
      return;
    } catch (err) {
      console.warn('AI fallback in widget:', err);
    }

    const botMsg: ChatUiMessage = { who: 'bot', reply: localReply, date, isAi: false };
    setMsgs((m) => [...m, botMsg]);
    setLoading(false);
    if (speakReply) speakText(extractAnswerPlainText(botMsg, lang), lang);
  }

  function toggleVoiceMic() {
    if (listening) {
      stopListenRef.current?.stop();
      stopListenRef.current = null;
      setListening(false);
      return;
    }
    if (!isVoiceRecognitionSupported()) return;
    stopListenRef.current?.stop();
    setListening(true);
    stopListenRef.current = startVoiceRecognition(
      lang,
      (transcript) => {
        stopListenRef.current = null;
        setListening(false);
        if (transcript.trim()) {
          setQ(transcript);
          ask(transcript, true);
        }
      },
      () => {
        stopListenRef.current = null;
        setListening(false);
      },
      () => {
        stopListenRef.current = null;
        setListening(false);
      },
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  return (
    <aside className="chat-widget-root" aria-label="Smart Assistant & Emergency Widget">
      {!isOpen && !sosOpen && (
        <div className="floating-fab-stack">
          <button
            type="button"
            className="emergency-fab"
            onClick={() => {
              setSosOpen(true);
              setIsOpen(false);
            }}
            aria-label={tr(
              lang,
              `طوارئ الحساسية والإسعاف (${countryName}: ${emergency.number})`,
              `Emergency SOS (${countryName}: ${emergency.number})`,
              `Urgences SOS (${countryName} : ${emergency.number})`,
              `Emergencias SOS (${countryName}: ${emergency.number})`
            )}
          >
            <span className="fab-icon">🚨</span>
            <span className="fab-label">
              {tr(
                lang,
                `طوارئ ${emergency.number}`,
                `SOS ${emergency.number}`,
                `SOS ${emergency.number}`,
                `SOS ${emergency.number}`
              )}
            </span>
            <span className="sos-pulse-dot"></span>
          </button>

          <Link
            to="/scan"
            className="scan-fab"
            aria-label={isAr ? 'مسح باركود العلبة بالكاميرا' : 'Scan Box Barcode'}
          >
            <span className="fab-icon">📷</span>
            <span className="fab-label">{isAr ? 'مسح باركود العلبة بالكاميرا' : 'Scan Box Barcode'}</span>
          </Link>

          <button
            type="button"
            className="chat-fab"
            onClick={() => {
              setIsOpen(true);
              setSosOpen(false);
            }}
            aria-label={isAr ? 'افتح المساعد الذكي' : 'Open Smart Assistant'}
          >
            <span className="fab-icon">🤖</span>
            <span className="fab-label">{isAr ? 'المساعد الذكي' : 'AI Assistant'}</span>
            <span className="fab-badge"></span>
          </button>
        </div>
      )}

      {sosOpen && (
        <div className="chat-popup sos-popup" role="dialog" aria-modal="true">
          <div className="popup-head sos-head">
            <div className="popup-title">
              <span className="head-avatar">🚨</span>
              <div>
                <b>{isAr ? 'طوارئ الحساسية الدوائية والإسعاف' : 'Drug Allergy & Emergency SOS'}</b>
                <div className="online-status">
                  <small>{isAr ? 'توجيهات الإسعاف العاجل' : 'Urgent Emergency Protocol'}</small>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="close-popup-btn"
              onClick={() => setSosOpen(false)}
              aria-label="Close SOS"
            >
              ✕
            </button>
          </div>

          <div className="popup-body stack" style={{ padding: '16px' }}>
            <div className="alert urgent" style={{ margin: 0 }}>
              <strong>⚠️ {isAr ? 'أعراض الصدمة التحسسية الطارئة (Anaphylaxis):' : 'Emergency Anaphylaxis Signs:'}</strong>
              <ul style={{ margin: '6px 0 0', paddingInlineStart: '18px', fontSize: '0.9rem' }}>
                <li>{isAr ? 'تورم مفاجئ في الوجه أو الشفتين أو اللسان أو الحلق.' : 'Sudden swelling of face, lips, tongue, or throat.'}</li>
                <li>{isAr ? 'ضيق شديد في التنفس أو صفير بالصدر أو صعوبة البلع.' : 'Difficulty breathing, wheezing, or trouble swallowing.'}</li>
                <li>{isAr ? 'دوخة شديدة أو هبوط حاد أو طفح جلدي منتشر.' : 'Severe dizziness, collapse, or widespread hives.'}</li>
              </ul>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                background: 'var(--tint, #f1f5f9)',
                border: '1px solid var(--line, #cbd5e1)',
                borderRadius: '10px',
                padding: '8px 10px',
                fontSize: '0.84rem',
              }}
            >
              <span>
                {emergency.flag}{' '}
                <b>
                  {tr(
                    lang,
                    `الدولة: ${countryName}`,
                    `Country: ${countryName}`,
                    `Pays : ${countryName}`,
                    `País: ${countryName}`
                  )}
                </b>
              </span>
              <select
                value={selectedOverride}
                onChange={(e) => setCountryOverride(e.target.value)}
                aria-label={tr(lang, 'تغيير الدولة لرقم الطوارئ', 'Change emergency country', 'Changer le pays d’urgence', 'Cambiar país de emergencia')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--line, #cbd5e1)',
                  background: 'var(--card-bg, #fff)',
                  color: 'var(--ink, #12303f)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  maxWidth: '185px',
                  cursor: 'pointer',
                }}
              >
                <option value="AUTO">
                  📍 {tr(lang, 'تحديد تلقائي للموقع', 'Auto-detect location', 'Détection auto', 'Detección automática')}
                </option>
                {countriesList.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {pickCountryName(c, lang)} ({c.number})
                  </option>
                ))}
              </select>
            </div>

            <a
              href={`tel:${emergency.number}`}
              className="btn danger"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '1.05rem',
                padding: '12px',
              }}
            >
              📞{' '}
              {tr(
                lang,
                `اتصال فوري بالطوارئ — ${countryName} (${emergency.number})`,
                `Call Emergency Now — ${countryName} (${emergency.number})`,
                `Appeler les urgences — ${countryName} (${emergency.number})`,
                `Llamar a emergencias — ${countryName} (${emergency.number})`
              )}
            </a>

            <Link
              to="/side-effects"
              className="btn ghost"
              onClick={() => setSosOpen(false)}
              style={{ textAlign: 'center' }}
            >
              📋 {isAr ? 'فتح دليل الآثار الجانبية وخطوات الإسعاف الكاملة' : 'Open Full Side Effects & First-Aid Guide'}
            </Link>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="chat-popup" role="dialog" aria-modal="true">
          <div className="popup-head">
            <div className="popup-title">
              <span className="head-avatar">🤖</span>
              <div>
                <b>{isAr ? 'المساعد الصوتي والذكي' : 'Voice & AI Assistant'}</b>
                <div className="online-status">
                  <span className="status-dot"></span>
                  <small>{isAr ? 'يدعم التحدث بالمايك 🎤' : 'Supports Voice Mic 🎤'}</small>
                </div>
              </div>
            </div>
            <div className="popup-actions">
              <Link to="/assistant" className="expand-btn" title={isAr ? 'فتح في صفحة كاملة' : 'Full page'}>
                ↗
              </Link>
              <button
                type="button"
                className="close-popup-btn"
                onClick={() => {
                  stopSpeech();
                  stopListenRef.current?.stop();
                  stopListenRef.current = null;
                  setListening(false);
                  setIsOpen(false);
                }}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="popup-body chat" aria-live="polite">
            {msgs.length === 0 && (
              <div className="msg bot">
                {isAr
                  ? 'أهلاً بك! اضغط على 🎤 للتحدث بصوتك مباشرة، أو اكتب سؤالك عن أي مضاد حيوي أو أسعاره أو بدائله.'
                  : 'Hello! Tap 🎤 to speak your question out loud, or type your question about any antibiotic.'}
              </div>
            )}
            {msgs.map((m, i) => {
              if (m.who === 'me') return <div key={i} className="msg me">{m.text}</div>;

              const plainText = extractAnswerPlainText(m, lang);

              if (m.isAi && m.text) {
                return (
                  <div key={i} className="msg bot ai-reply">
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div className="ai-badge">✨ {isAr ? 'إجابة طبية منظمة' : 'Structured Answer'}</div>
                      <button type="button" className="chip" onClick={() => speakText(plainText, lang)}>
                        🔊
                      </button>
                    </div>
                    <div className="ai-text" style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                      {cleanAssistantMarkdown(m.text)}
                    </div>
                    <div className="src">{m.date}</div>
                  </div>
                );
              }

              const r = m.reply;
              if (!r) return null;
              if (r.kind === 'answer') {
                return (
                  <div key={i} className="msg bot">
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong className="small" style={{ color: '#0b3c5d' }}>{pick(r.lead, lang)}</strong>
                      <button type="button" className="chip" onClick={() => speakText(plainText, lang)}>
                        🔊
                      </button>
                    </div>
                    {r.hits.map((p) => (
                      <div key={p.id} style={{ marginBottom: '6px' }}>
                        <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7, margin: '4px 0' }}>
                          {cleanAssistantMarkdown(pick(p.text, lang))}
                        </p>
                        <div className="src">
                          <Link to={p.link ?? '/'} onClick={() => setIsOpen(false)}>🔗 {p.label}</Link>
                        </div>
                      </div>
                    ))}
                    <div className="src">{m.date}</div>
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className={`msg bot ${r.tone === 'warn' || r.tone === 'alert' ? 'warn' : ''}`}
                  role={r.tone === 'alert' ? 'alert' : undefined}
                >
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                      {cleanAssistantMarkdown(pick(r.text, lang))}
                    </p>
                    <button type="button" className="chip" onClick={() => speakText(plainText, lang)}>
                      🔊
                    </button>
                  </div>
                  {r.links && r.links.length > 0 && (
                    <div className="src" style={{ marginTop: '6px' }}>
                      {r.links.map((l, k) => (
                        <span key={l.to + k}>
                          {k > 0 && ' · '}
                          <Link to={l.to} onClick={() => setIsOpen(false)}>💊 {pick(l.label, lang)}</Link>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="msg bot loading-msg">
                <span className="dot-pulse">● ● ●</span> {isAr ? 'جاري كتابة الرد...' : 'Typing...'}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="popup-chips">
            {(WIDGET_CHIPS[lang] || WIDGET_CHIPS.en).map((c) => (
              <button key={c} type="button" className="chip" onClick={() => ask(c)} disabled={loading}>
                {c}
              </button>
            ))}
          </div>

          <form className="popup-form" onSubmit={submit}>
            <button
              type="button"
              className="btn ghost"
              onClick={toggleVoiceMic}
              title={isAr ? 'تحدث بالمايك' : 'Speak'}
              style={{
                padding: '6px 10px',
                background: listening ? '#fee2e2' : undefined,
                color: listening ? '#dc2626' : undefined,
              }}
            >
              {listening ? '⏹️' : '🎤'}
            </button>
            <input
              value={q}
              maxLength={300}
              onChange={(e) => setQ(e.target.value)}
              placeholder={listening ? (isAr ? 'تحدث الآن...' : 'Listening...') : isAr ? 'اكتب أو اضغط 🎤 للتحدث...' : 'Type or tap 🎤 to speak...'}
              aria-label="Ask assistant"
              disabled={loading}
            />
            <button className="btn" disabled={loading || !q.trim()}>
              {loading ? '...' : isAr ? 'إرسال' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
