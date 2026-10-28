import { pick } from './types';
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

const CHIPS: Record<string, string[]> = {
  ar: [
    'هل المضاد الحيوي يعالج البرد والزكام؟',
    'ما هي مخاطر حقنة البرد (مجموعة البرد)؟',
    'هل ينفع أوقف المضاد لما أحس بتحسن؟',
    'ماذا أفعل لو نسيت جرعة المضاد؟',
    'هل شرب الحليب يبطل مفعول المضاد؟',
    'كيف أخزّن المضاد الحيوي الشراب للأطفال؟',
    'هل المضاد يسبب إسهال وما فائدة الزبادي؟',
    'هل المضاد يؤثر على حبوب منع الحمل؟',
    'هل المضاد يعالج وجع الضرس والأسنان؟',
  ],
  en: [
    'Do antibiotics treat colds or flu?',
    'What are the dangers of cold shot mixtures?',
    'Can I stop taking antibiotics when I feel better?',
    'What should I do if I miss a dose?',
    'Does milk interact with antibiotics?',
    'How do I store pediatric antibiotic suspensions?',
    'Do antibiotics cause diarrhea, and how does yogurt help?',
    'Do antibiotics reduce birth control pill efficacy?',
    'Do antibiotics cure toothaches and dental pain?',
  ],
  fr: [
    'Les antibiotiques soignent-ils le rhume ou la grippe ?',
    'Quels sont les dangers des injections miracles contre le rhume ?',
    'Puis-je arrêter l’antibiotique dès que je me sens mieux ?',
    'Que faire si j’oublie une dose d’antibiotique ?',
    'Le lait interagit-il avec certains antibiotiques ?',
    'Comment conserver un sirop antibiotique pédiatrique ?',
    'Les antibiotiques causent-ils la diarrhée ?',
    'Les antibiotiques diminuent-ils l’effet de la pilule contraceptive ?',
    'Les antibiotiques guérissent-ils les maux de dents ?',
  ],
  es: [
    '¿Los antibióticos curan el resfriado o la gripe?',
    '¿Cuáles son los peligros de las inyecciones mezcladas para el resfriado?',
    '¿Puedo suspender el antibiótico cuando me sienta mejor?',
    '¿Qué debo hacer si olvido una dosis?',
    '¿La leche interactúa con los antibióticos?',
    '¿Cómo almacenar las suspensiones pediátricas de antibióticos?',
    '¿Los antibióticos causan diarrea y cómo ayuda el yogur?',
    '¿Los antibióticos reducen la eficacia de los anticonceptivos?',
    '¿Los antibióticos curan el dolor de muelas?',
  ],
  de: [
    "Helfen Antibiotika bei Erkältung oder Grippe?",
    "Welche Gefahren birgt die 3-in-1-Erkältungsspritze?",
    "Kann ich das Antibiotikum absetzen, sobald es mir besser geht?",
    "Was soll ich tun, wenn ich eine Dosis vergessen habe?",
    "Beeinflusst Milch die Wirkung von Antibiotika?",
    "Wie bewahre ich Antibiotika-Saft für Kinder richtig auf?",
    "Verursachen Antibiotika Durchfall und wie hilft Joghurt?",
    "Beeinträchtigen Antibiotika die Wirkung der Antibabypille?",
    "Helfen Antibiotika bei Zahnschmerzen?",
  ],
};

/**
 * Renders structured clinical reply text into clean paragraphs, numbered cards,
 * bullet lists, and highlighted warning boxes without any raw markdown clutter.
 */
function FormattedClinicalText({ text }: { text: string }) {
  const cleaned = cleanAssistantMarkdown(text);
  const blocks = cleaned.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div style={{ display: 'grid', gap: '8px', lineHeight: 1.75, fontSize: '0.95rem', marginTop: '4px' }}>
      {blocks.map((block, bIdx) => {
        const isWarnBlock = block.startsWith('⚠️') || block.startsWith('🚨');
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

        if (isWarnBlock) {
          return (
            <div
              key={bIdx}
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderInlineStart: '4px solid #f59e0b',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#78350f',
              }}
            >
              {lines.map((line, lIdx) => (
                <div
                  key={lIdx}
                  style={{
                    fontWeight: lIdx === 0 ? 700 : 400,
                    marginBottom: lIdx < lines.length - 1 ? '4px' : 0,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          );
        }

        return (
          <div key={bIdx} style={{ display: 'grid', gap: '4px' }}>
            {lines.map((line, lIdx) => {
              const isNumbered = /^\d+\.\s/.test(line);
              const isBullet = line.startsWith('•') || line.startsWith('-');
              const colonIdx = line.indexOf(':');

              if (isNumbered) {
                return (
                  <div
                    key={lIdx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #d3e4ea',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#0f172a',
                    }}
                  >
                    {colonIdx > 0 && colonIdx < 65 ? (
                      <>
                        <strong style={{ color: '#0b3c5d' }}>{line.slice(0, colonIdx + 1)}</strong>
                        <span>{line.slice(colonIdx + 1)}</span>
                      </>
                    ) : (
                      <strong style={{ color: '#0b3c5d' }}>{line}</strong>
                    )}
                  </div>
                );
              }

              if (isBullet) {
                return (
                  <div key={lIdx} style={{ paddingInlineStart: '8px', color: '#1e293b' }}>
                    {colonIdx > 0 && colonIdx < 50 ? (
                      <>
                        <strong style={{ color: '#0b3c5d' }}>{line.slice(0, colonIdx + 1)}</strong>
                        <span>{line.slice(colonIdx + 1)}</span>
                      </>
                    ) : (
                      line
                    )}
                  </div>
                );
              }

              return (
                <p
                  key={lIdx}
                  style={{
                    margin: 0,
                    fontWeight: lIdx === 0 && lines.length > 1 && line.endsWith(':') ? 700 : 400,
                    color: lIdx === 0 && line.endsWith(':') ? '#0b3c5d' : '#12303f',
                  }}
                >
                  {line}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function Assistant() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const { items } = useApproved();
  const meds = useMemo(() => items ?? [], [items]);
  const passages = useMemo(() => buildPassages(meds), [meds]);
  const [msgs, setMsgs] = useState<ChatUiMessage[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const stopListenRef = useRef<VoiceRecognitionHandle | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs, loading]);

  useEffect(() => {
    return () => {
      stopSpeech();
      stopListenRef.current?.stop();
      stopListenRef.current = null;
    };
  }, []);

  async function ask(raw: string, shouldSpeakReply = autoSpeak) {
    const text = raw.trim().slice(0, 300);
    if (!text || loading) return;
    const date = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB');

    setMsgs((m) => [...m, { who: 'me', text }]);
    setQ('');
    setLoading(true);

    // 1) Check Verified Clinical Database & Condition Protocols FIRST (Instant, Curated, with Drug Links)
    const localReply = respond(passages, meds, text);
    if (isDirectVerifiedMatch(localReply)) {
      const botMsg: ChatUiMessage = { who: 'bot', reply: localReply, date, isAi: false };
      setMsgs((m) => [...m, botMsg]);
      setLoading(false);
      if (shouldSpeakReply) {
        speakText(extractAnswerPlainText(botMsg, lang), lang);
      }
      return;
    }

    // 2) For open-ended questions outside local passages, use AI Assistant with clean formatting
    try {
      const history: ChatMessage[] = msgs.map((m) => ({
        who: m.who,
        text: extractAnswerPlainText(m, lang),
      }));

      const aiResponse = await askGemini(text, history);
      const botMsg: ChatUiMessage = { who: 'bot', text: aiResponse, date, isAi: true };
      setMsgs((m) => [...m, botMsg]);
      setLoading(false);
      if (shouldSpeakReply) {
        speakText(aiResponse, lang);
      }
      return;
    } catch (err) {
      console.warn('AI fallback to local reply:', err);
    }

    const botMsg: ChatUiMessage = { who: 'bot', reply: localReply, date, isAi: false };
    setMsgs((m) => [...m, botMsg]);
    setLoading(false);

    if (shouldSpeakReply) {
      speakText(extractAnswerPlainText(botMsg, lang), lang);
    }
  }

  function toggleVoiceMic() {
    if (listening) {
      stopListenRef.current?.stop();
      stopListenRef.current = null;
      setListening(false);
      return;
    }

    if (!isVoiceRecognitionSupported()) {
      setVoiceNote(
        isAr
          ? 'متصفحك الحالي لا يدعم الإملاء الصوتي المباشر. يُرجى استخدام متصفح Chrome أو Edge أو Safari.'
          : 'Your browser does not support Web Speech Recognition. Please use Chrome, Edge, or Safari.',
      );
      return;
    }

    stopListenRef.current?.stop();
    setVoiceNote(isAr ? '🎙️ تحدث الآن... أنا أستمع إليك باللهجة المصرية أو العربية' : '🎙️ Speak now... Listening');
    setListening(true);

    stopListenRef.current = startVoiceRecognition(
      lang,
      (transcript) => {
        stopListenRef.current = null;
        setListening(false);
        setVoiceNote('');
        if (transcript.trim()) {
          setQ(transcript);
          ask(transcript, true);
        }
      },
      (errMsg) => {
        stopListenRef.current = null;
        setListening(false);
        setVoiceNote(errMsg);
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
    <main className="wrap narrow stack">
      <div className="asst-header">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1>🎙️ {t('asstTitle')}</h1>
            <p className="muted" style={{ margin: 0 }}>{t('asstIntro')}</p>
          </div>
          <div className="row" style={{ gap: '8px' }}>
            <button
              type="button"
              className={`btn small ${autoSpeak ? '' : 'ghost'}`}
              onClick={() => {
                if (autoSpeak) stopSpeech();
                setAutoSpeak((v) => !v);
              }}
            >
              🔊 {isAr ? (autoSpeak ? 'النطق التلقائي: مفعّل' : 'تفعيل نطق الإجابات صوتياً') : autoSpeak ? 'Auto-Voice: ON' : 'Enable Voice Readout'}
            </button>
          </div>
        </div>
      </div>

      {/* Voice-to-Voice Callout Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
          color: '#fff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <b style={{ fontSize: '1.05rem', display: 'block', marginBottom: '4px' }}>
            🗣️ {isAr ? 'ميزة التحدث الصوتي المباشر (اسأل بصوتك بالمايك)' : 'Live Voice-to-Voice Medical Assistant'}
          </b>
          <span className="small" style={{ color: '#e0f2fe' }}>
            {isAr
              ? 'اضغط على زر المايك وتحدث بالعامية المصرية (مثلاً: "ابني وزن 12 كيلو وعنده سخونية")، وسيرد عليك المساعد كتابةً وصوتاً!'
              : 'Press the microphone button, ask your question out loud, and hear the clinical answer spoken back to you!'}
          </span>
        </div>
        <button
          type="button"
          className="btn"
          onClick={toggleVoiceMic}
          style={{
            background: listening ? '#dc2626' : '#10b981',
            color: '#fff',
            fontWeight: 700,
            padding: '10px 18px',
            borderRadius: '999px',
          }}
        >
          {listening
            ? isAr
              ? '⏹️ إيقاف الاستماع...'
              : '⏹️ Stop Listening...'
            : isAr
              ? '🎤 اضغط وتحدث بالمايك الآن'
              : '🎤 Tap & Speak Now'}
        </button>
      </div>

      {voiceNote && (
        <div className="notice tip" style={{ padding: '10px 14px', borderRadius: '10px' }}>
          {voiceNote}
        </div>
      )}

      <section className="card stack" aria-label={t('asstTitle')}>
        <div className="chat" aria-live="polite">
          {msgs.length === 0 && <div className="msg bot">{t('asstHello')}</div>}
          {msgs.map((m, i) => {
            if (m.who === 'me') return <div key={i} className="msg me">{m.text}</div>;

            const plainForSpeech = extractAnswerPlainText(m, lang);

            if (m.isAi && m.text) {
              return (
                <div key={i} className="msg bot ai-reply">
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span
                      className="badge"
                      style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '0.82rem' }}
                    >
                      ✨ {isAr ? 'إجابة طبية منظمة وموثقة' : 'Structured Medical Answer'}
                    </span>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => speakText(plainForSpeech, lang)}
                      title={isAr ? 'استمع للإجابة صوتياً' : 'Listen to answer'}
                    >
                      🔊 {isAr ? 'اسمع الإجابة' : 'Listen'}
                    </button>
                  </div>
                  <FormattedClinicalText text={m.text} />
                  <div className="src" style={{ marginTop: '8px' }}>{t('asstChecked')} {m.date}</div>
                </div>
              );
            }

            const r = m.reply;
            if (!r) return null;
            if (r.kind === 'answer') {
              return (
                <div key={i} className="msg bot">
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: '#0b3c5d', fontSize: '0.95rem' }}>{pick(r.lead, lang)}</strong>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => speakText(plainForSpeech, lang)}
                    >
                      🔊 {isAr ? 'اسمع الإجابة' : 'Listen'}
                    </button>
                  </div>
                  {r.hits.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #d3e4ea',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        marginBottom: '8px',
                      }}
                    >
                      <FormattedClinicalText text={pick(p.text, lang)} />
                      <div className="src" style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #eef6f8' }}>
                        <Link to={p.link ?? '/'} style={{ fontWeight: 700 }}>🔗 {p.label}</Link>
                        {p.unreviewed && <> · {t('unreviewed')}</>}
                        {p.refs.map((x) => (
                          <span key={x.url}>
                            {' · '}
                            <a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}</a>
                            {x.publisher ? ` (${x.publisher})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="src">{t('asstChecked')} {m.date}</div>
                </div>
              );
            }
            return (
              <div
                key={i}
                className={`msg bot ${r.tone === 'warn' || r.tone === 'alert' ? 'warn' : ''}`}
                role={r.tone === 'alert' ? 'alert' : undefined}
              >
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span
                    className="badge"
                    style={{ background: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.82rem' }}
                  >
                    ✅ {isAr ? 'دليل سريري معتمد من المنصة' : 'Verified Clinical Protocol'}
                  </span>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => speakText(plainForSpeech, lang)}
                  >
                    🔊 {isAr ? 'اسمع الإجابة' : 'Listen'}
                  </button>
                </div>
                <FormattedClinicalText text={pick(r.text, lang)} />
                {r.links && r.links.length > 0 && (
                  <div
                    className="row wrapRow"
                    style={{
                      gap: '6px',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid #d3e4ea',
                    }}
                  >
                    {r.links.map((l, k) => (
                      <Link
                        key={l.to + k}
                        to={l.to}
                        className="chip"
                        style={{
                          textDecoration: 'none',
                          background: '#ffffff',
                          borderColor: '#0e9aa7',
                          color: '#0a7c87',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                        }}
                      >
                        💊 {pick(l.label, lang)}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="src" style={{ marginTop: '6px' }}>{t('asstChecked')} {m.date}</div>
              </div>
            );
          })}
          {loading && (
            <div className="msg bot loading-msg">
              <span className="dot-pulse">● ● ●</span> {isAr ? 'جاري تحضير الإجابة...' : 'Preparing answer...'}
            </div>
          )}
          <div ref={end} />
        </div>
        <div className="chips">
          {(CHIPS[lang] || CHIPS.en).map((c) => (
            <button key={c} type="button" className="chip" onClick={() => ask(c)} disabled={loading}>
              {c}
            </button>
          ))}
        </div>
        <form className="chatform" onSubmit={submit}>
          <button
            type="button"
            className="btn ghost"
            onClick={toggleVoiceMic}
            title={isAr ? 'اسأل بصوتك بالمايك' : 'Speak with microphone'}
            style={{
              background: listening ? '#fee2e2' : undefined,
              borderColor: listening ? '#dc2626' : undefined,
              color: listening ? '#dc2626' : undefined,
            }}
          >
            {listening ? '⏹️' : '🎤'}
          </button>
          <input
            value={q}
            maxLength={300}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('asstPlaceholder')}
            aria-label={t('asstPlaceholder')}
            disabled={loading}
          />
          <button className="btn" disabled={loading || !q.trim()}>
            {loading ? '...' : t('asstSend')}
          </button>
        </form>
      </section>
      <p className="alert">{t('asstScope')}</p>
    </main>
  );
}
