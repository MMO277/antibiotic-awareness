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

const WIDGET_CHIPS = {
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
};

export default function ChatWidget() {
  const { t, lang } = useLang();
  const { items } = useApproved();
  const meds = useMemo(() => items ?? [], [items]);
  const passages = useMemo(() => buildPassages(meds), [meds]);

  const [isOpen, setIsOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [msgs, loading, isOpen]);

  async function ask(raw: string) {
    const text = raw.trim().slice(0, 300);
    if (!text || loading) return;
    const date = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB');

    setMsgs((m) => [...m, { who: 'me', text }]);
    setQ('');
    setLoading(true);

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
        console.warn('Gemini request failed in widget, falling back to local engine:', err);
      }
    }

    const reply = respond(passages, meds, text);
    setMsgs((m) => [...m, { who: 'bot', reply, date, isAi: false }]);
    setLoading(false);
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  return (
    <aside className="chat-widget-root" aria-label="Smart Assistant Widget">
      {/* Floating Action Bubble */}
      {!isOpen && (
        <button
          type="button"
          className="chat-fab"
          onClick={() => setIsOpen(true)}
          aria-label={lang === 'ar' ? 'افتح المساعد الذكي' : 'Open Smart Assistant'}
        >
          <span className="fab-icon">🤖</span>
          <span className="fab-label">{lang === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}</span>
          <span className="fab-badge"></span>
        </button>
      )}

      {/* Slide-up Chat Window */}
      {isOpen && (
        <div className="chat-popup" role="dialog" aria-modal="true">
          <div className="popup-head">
            <div className="popup-title">
              <span className="head-avatar">🤖</span>
              <div>
                <b>{lang === 'ar' ? 'المساعد الذكي' : 'Antibiotic AI Assistant'}</b>
                <div className="online-status">
                  <span className="status-dot"></span>
                  <small>{lang === 'ar' ? 'متصل وجاهز للرد' : 'Online & ready'}</small>
                </div>
              </div>
            </div>
            <div className="popup-actions">
              <Link to="/assistant" className="expand-btn" title={lang === 'ar' ? 'فتح في صفحة كاملة' : 'Full page'}>
                ↗
              </Link>
              <button
                type="button"
                className="close-popup-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="popup-body chat" aria-live="polite">
            {msgs.length === 0 && (
              <div className="msg bot">
                {lang === 'ar'
                  ? 'أهلاً بك! أنا المساعد الذكي، اسألني عن أي مضاد حيوي، أسعاره، بدائله، أو تداخلاته مع الأطعمة والأدوية.'
                  : 'Hello! I am your Smart Assistant. Ask me about any antibiotic, pricing, alternatives, or interactions.'}
              </div>
            )}
            {msgs.map((m, i) => {
              if (m.who === 'me') return <div key={i} className="msg me">{m.text}</div>;

              if (m.isAi && m.text) {
                return (
                  <div key={i} className="msg bot ai-reply">
                    <div className="ai-badge">✨ {lang === 'ar' ? 'رد الذكاء الاصطناعي' : 'AI Response'}</div>
                    <div className="ai-text">{m.text}</div>
                    <div className="src">{m.date}</div>
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
                  <p>{r.text[lang]}</p>
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
                <span className="dot-pulse">● ● ●</span> {lang === 'ar' ? 'جاري كتابة الرد...' : 'Typing...'}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="popup-chips">
            {WIDGET_CHIPS[lang].map((c) => (
              <button key={c} type="button" className="chip" onClick={() => ask(c)} disabled={loading}>
                {c}
              </button>
            ))}
          </div>

          <form className="popup-form" onSubmit={submit}>
            <input
              value={q}
              maxLength={300}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question...'}
              aria-label="Ask assistant"
              disabled={loading}
            />
            <button className="btn" disabled={loading || !q.trim()}>
              {loading ? '...' : (lang === 'ar' ? 'إرسال' : 'Send')}
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
