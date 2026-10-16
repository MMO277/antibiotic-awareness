import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { buildPassages, respond, ChatUiMessage, extractAnswerPlainText } from './assistantLogic';
import { askGemini, hasApiKey, ChatMessage } from './geminiApi';
import {
  isVoiceRecognitionSupported,
  speakText,
  startVoiceRecognition,
  stopSpeech,
} from './speechService';

const CHIPS = {
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
};

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
  const stopListenRef = useRef<(() => void) | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs, loading]);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (stopListenRef.current) stopListenRef.current();
    };
  }, []);

  async function ask(raw: string, shouldSpeakReply = autoSpeak) {
    const text = raw.trim().slice(0, 300);
    if (!text || loading) return;
    const date = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB');

    setMsgs((m) => [...m, { who: 'me', text }]);
    setQ('');
    setLoading(true);

    if (hasApiKey()) {
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
        console.warn('Gemini request failed, smoothly using enhanced clinical engine:', err);
      }
    }

    const reply = respond(passages, meds, text);
    const botMsg: ChatUiMessage = { who: 'bot', reply, date, isAi: false };
    setMsgs((m) => [...m, botMsg]);
    setLoading(false);

    if (shouldSpeakReply) {
      speakText(extractAnswerPlainText(botMsg, lang), lang);
    }
  }

  function toggleVoiceMic() {
    if (listening) {
      if (stopListenRef.current) stopListenRef.current();
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

    setVoiceNote(isAr ? '🎙️ تحدث الآن... أنا أستمع إليك باللهجة المصرية أو العربية' : '🎙️ Speak now... Listening');
    setListening(true);

    stopListenRef.current = startVoiceRecognition(
      lang,
      (transcript) => {
        setListening(false);
        setVoiceNote('');
        if (transcript.trim()) {
          setQ(transcript);
          // Automatically send and speak back the answer when asked by voice!
          ask(transcript, true);
        }
      },
      (errMsg) => {
        setListening(false);
        setVoiceNote(errMsg);
      },
      () => {
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
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="ai-badge">✨ {isAr ? 'إجابة ذكية وموثقة' : 'Smart Verified Answer'}</div>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => speakText(plainForSpeech, lang)}
                      title={isAr ? 'استمع للإجابة صوتياً' : 'Listen to answer'}
                    >
                      🔊 {isAr ? 'اسمع الإجابة' : 'Listen'}
                    </button>
                  </div>
                  <div className="ai-text">{m.text}</div>
                  <div className="src">{t('asstChecked')} {m.date}</div>
                </div>
              );
            }

            const r = m.reply;
            if (!r) return null;
            if (r.kind === 'answer') {
              return (
                <div key={i} className="msg bot">
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <small className="muted">{r.lead[lang]}</small>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => speakText(plainForSpeech, lang)}
                    >
                      🔊 {isAr ? 'اسمع الإجابة' : 'Listen'}
                    </button>
                  </div>
                  {r.hits.map((p) => (
                    <div key={p.id}>
                      <p>{p.text[lang]}</p>
                      <div className="src">
                        <Link to={p.link ?? '/'}>{p.label}</Link>
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
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span>{r.text[lang]}</span>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => speakText(plainForSpeech, lang)}
                  >
                    🔊
                  </button>
                </div>
                {r.links && r.links.length > 0 && (
                  <div className="src">
                    {r.links.map((l, k) => (
                      <span key={l.to + k}>
                        {k > 0 && ' · '}
                        <Link to={l.to}>{l.label[lang]}</Link>
                      </span>
                    ))}
                  </div>
                )}
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
          {CHIPS[lang].map((c) => (
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
