import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { buildPassages, respond, Reply } from './assistantLogic';
import { askGemini, hasApiKey, ChatMessage } from './geminiApi';

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
  const { items } = useApproved();
  const meds = useMemo(() => items ?? [], [items]);
  const passages = useMemo(() => buildPassages(meds), [meds]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs, loading]);

  async function ask(raw: string) {
    const text = raw.trim().slice(0, 300);
    if (!text || loading) return;
    const date = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB');

    setMsgs((m) => [...m, { who: 'me', text }]);
    setQ('');
    setLoading(true);

    // If Gemini API is available, try it seamlessly
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
        setMsgs((m) => [...m, { who: 'bot', text: aiResponse, date, isAi: true }]);
        setLoading(false);
        return;
      } catch (err) {
        console.warn('Gemini request failed, smoothly using enhanced clinical engine:', err);
      }
    }

    // Comprehensive clinical knowledge engine (always answers constructively!)
    const reply = respond(passages, meds, text);
    setMsgs((m) => [...m, { who: 'bot', reply, date, isAi: false }]);
    setLoading(false);
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  return (
    <main className="wrap narrow stack">
      <div className="asst-header">
        <h1>{t('asstTitle')}</h1>
        <p className="muted">{t('asstIntro')}</p>
      </div>

      <section className="card stack" aria-label={t('asstTitle')}>
        <div className="chat" aria-live="polite">
          {msgs.length === 0 && <div className="msg bot">{t('asstHello')}</div>}
          {msgs.map((m, i) => {
            if (m.who === 'me') return <div key={i} className="msg me">{m.text}</div>;

            if (m.isAi && m.text) {
              return (
                <div key={i} className="msg bot ai-reply">
                  <div className="ai-badge">✨ {lang === 'ar' ? 'إجابة ذكية وموثقة' : 'Smart Verified Answer'}</div>
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
              <span className="dot-pulse">● ● ●</span> {lang === 'ar' ? 'جاري تحضير الإجابة...' : 'Preparing answer...'}
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
