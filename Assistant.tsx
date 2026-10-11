import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { buildPassages, respond, Reply } from './assistantLogic';

interface Msg {
  who: 'me' | 'bot';
  text?: string;
  reply?: Reply;
  date?: string;
}

const CHIPS = {
  ar: [
    'هل المضاد الحيوي يعالج الزكام؟',
    'ما هي مقاومة المضادات الحيوية؟',
    'هل أشارك مضادي الحيوي مع غيري؟',
    'كيف أحمي نفسي من العدوى؟',
    'ما الفرق بين العدوى البكتيرية والفيروسية؟',
    'كيف أخزّن الأدوية وأتخلص من بقاياها؟',
  ],
  en: [
    'Do antibiotics treat colds?',
    'What is antibiotic resistance?',
    'Can I share my antibiotic?',
    'How can I prevent infections?',
    'What is the difference between bacterial and viral infections?',
    'How do I store medicines and get rid of leftovers?',
  ],
};

export default function Assistant() {
  const { t, lang } = useLang();
  const { items } = useApproved();
  const meds = useMemo(() => items ?? [], [items]);
  const passages = useMemo(() => buildPassages(meds), [meds]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs]);

  function ask(raw: string) {
    const text = raw.trim().slice(0, 300);
    if (!text) return;
    const reply = respond(passages, meds, text);
    const date = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB');
    setMsgs((m) => [...m, { who: 'me', text }, { who: 'bot', reply, date }]);
    setQ('');
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  return (
    <main className="wrap narrow stack">
      <h1>{t('asstTitle')}</h1>
      <p className="muted">{t('asstIntro')}</p>
      <section className="card stack" aria-label={t('asstTitle')}>
        <div className="chat" aria-live="polite">
          {msgs.length === 0 && <div className="msg bot">{t('asstHello')}</div>}
          {msgs.map((m, i) => {
            if (m.who === 'me') return <div key={i} className="msg me">{m.text}</div>;
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
              <div key={i} className={`msg bot ${r.tone === 'warn' || r.tone === 'alert' ? 'warn' : ''}`} role={r.tone === 'alert' ? 'alert' : undefined}>
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
          <div ref={end} />
        </div>
        <div className="chips">
          {CHIPS[lang].map((c) => (
            <button key={c} type="button" className="chip" onClick={() => ask(c)}>{c}</button>
          ))}
        </div>
        <form className="chatform" onSubmit={submit}>
          <input value={q} maxLength={300} onChange={(e) => setQ(e.target.value)} placeholder={t('asstPlaceholder')} aria-label={t('asstPlaceholder')} />
          <button className="btn">{t('asstSend')}</button>
        </form>
      </section>
      <p className="alert">{t('asstScope')}</p>
    </main>
  );
}
