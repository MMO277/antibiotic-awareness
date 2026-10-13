import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { buildPassages, respond, Reply } from './assistantLogic';
import { askGemini, getStoredApiKey, setStoredApiKey, hasApiKey, ChatMessage } from './geminiApi';

interface Msg {
  who: 'me' | 'bot';
  text?: string;
  reply?: Reply;
  date?: string;
  isAi?: boolean;
}

const CHIPS = {
  ar: [
    'هل المضاد الحيوي يعالج البرد والزكام؟',
    'ما هي مخاطر حقنة البرد (مجموعة البرد)؟',
    'ما هي مقاومة المضادات الحيوية؟',
    'هل ينفع أوقف المضاد لما أحس بتحسن؟',
    'ما الفرق بين العدوى البكتيرية والفيروسية؟',
    'هل الحليب يبطل مفعول المضاد الحيوي؟',
    'ماذا أفعل لو نسيت جرعة المضاد؟',
    'كيف أخزّن الأدوية والشراب المعلق؟',
  ],
  en: [
    'Do antibiotics treat colds or flu?',
    'What is antibiotic resistance?',
    'Can I stop taking antibiotics when I feel better?',
    'What is the difference between bacterial and viral infections?',
    'Does milk interact with antibiotics?',
    'What should I do if I miss a dose?',
    'How do I store reconstituted antibiotic suspensions?',
  ],
};

export default function Assistant() {
  const { t, lang } = useLang();
  const { items } = useApproved();
  const meds = useMemo(() => items ?? [], [items]);
  const passages = useMemo(() => buildPassages(meds), [meds]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyActive, setKeyActive] = useState(hasApiKey());
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs, loading]);

  async function ask(raw: string) {
    const text = raw.trim().slice(0, 300);
    if (!text || loading) return;
    const date = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB');

    // Add user message
    setMsgs((m) => [...m, { who: 'me', text }]);
    setQ('');
    setLoading(true);

    // Try Gemini API if key is present
    if (hasApiKey()) {
      try {
        const history: ChatMessage[] = msgs.map((m) => ({
          who: m.who,
          text:
            m.text ||
            (m.reply?.kind === 'answer'
              ? m.reply.hits.map((h) => h.text[lang]).join(' ')
              : m.reply?.text?.[lang] || ''),
        }));

        const aiResponse = await askGemini(text, history);
        setMsgs((m) => [
          ...m,
          {
            who: 'bot',
            text: aiResponse,
            date,
            isAi: true,
          },
        ]);
        setLoading(false);
        return;
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to local engine:', err);
      }
    }

    // Local engine fallback
    const reply = respond(passages, meds, text);
    setMsgs((m) => [...m, { who: 'bot', reply, date, isAi: false }]);
    setLoading(false);
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  const handleSaveKey = () => {
    setStoredApiKey(keyInput);
    setKeyActive(hasApiKey());
    setShowKeyModal(false);
  };

  const handleClearKey = () => {
    setStoredApiKey('');
    setKeyInput('');
    setKeyActive(false);
    setShowKeyModal(false);
  };

  return (
    <main className="wrap narrow stack">
      <div className="asst-header">
        <div>
          <h1>{t('asstTitle')}</h1>
          <p className="muted">{t('asstIntro')}</p>
        </div>
        <button
          type="button"
          className={`key-btn ${keyActive ? 'active' : ''}`}
          onClick={() => {
            setKeyInput(getStoredApiKey());
            setShowKeyModal(true);
          }}
          title={lang === 'ar' ? 'إعدادات الذكاء الاصطناعي (Gemini)' : 'Gemini AI Settings'}
        >
          {keyActive ? (lang === 'ar' ? '✨ ذكاء اصطناعي (Gemini نشط)' : '✨ Gemini Active') : (lang === 'ar' ? '⚙️ ربط Gemini AI مجاناً' : '⚙️ Connect Gemini AI')}
        </button>
      </div>

      {showKeyModal && (
        <section className="card stack key-modal" aria-label="Gemini API Key Modal">
          <div className="modal-header">
            <h3>{lang === 'ar' ? 'ربط المساعد بنموذج Google Gemini (مجاناً)' : 'Connect Google Gemini AI (Free)'}</h3>
            <button type="button" className="close-btn" onClick={() => setShowKeyModal(false)}>✕</button>
          </div>
          <p className="small muted">
            {lang === 'ar'
              ? 'احصل على مفتاح مجاني 100% من Google AI Studio لتمكين المساعد من الإجابة بطلاقة وذكاء على أي سؤال، دون أي تكلفة وبدون كارت بنكي.'
              : 'Get a 100% free API key from Google AI Studio to let the assistant answer any question intelligently without costs.'}
          </p>
          <div className="key-input-row">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={lang === 'ar' ? 'الصق مفتاح API هنا (AIzaSy...)' : 'Paste API Key here (AIzaSy...)'}
              aria-label="Gemini API Key"
            />
            <button type="button" className="btn" onClick={handleSaveKey}>
              {lang === 'ar' ? 'حفظ المفتاح' : 'Save'}
            </button>
            {keyActive && (
              <button type="button" className="btn-secondary" onClick={handleClearKey}>
                {lang === 'ar' ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>
          <p className="small">
            🔗 <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">
              {lang === 'ar' ? 'اضغط هنا لفتح Google AI Studio واستخراج المفتاح في دقيقة واحدة' : 'Open Google AI Studio to get your free key'}
            </a>
          </p>
        </section>
      )}

      <section className="card stack" aria-label={t('asstTitle')}>
        <div className="chat" aria-live="polite">
          {msgs.length === 0 && <div className="msg bot">{t('asstHello')}</div>}
          {msgs.map((m, i) => {
            if (m.who === 'me') return <div key={i} className="msg me">{m.text}</div>;

            // AI Generated response
            if (m.isAi && m.text) {
              return (
                <div key={i} className="msg bot ai-reply">
                  <div className="ai-badge">✨ {lang === 'ar' ? 'رد الذكاء الاصطناعي (Gemini)' : 'AI Response (Gemini)'}</div>
                  <div className="ai-text">{m.text}</div>
                  <div className="src">{t('asstChecked')} {m.date}</div>
                </div>
              );
            }

            // Local Engine response
            const r = m.reply;
            if (!r) return null;
            if (r.kind === 'answer') {
              return (
                <div key={i} className="msg bot">
                  <small className="muted">{r.lead[lang]}</small>
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
                {r.text[lang]}
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
              <span className="dot-pulse">● ● ●</span> {lang === 'ar' ? 'جاري كتابة الرد بالذكاء الاصطناعي...' : 'AI is thinking...'}
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
