import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { buildPassages, classify, Passage, retrieve, Verdict } from './assistantLogic';

interface Msg {
  who: 'me' | 'bot';
  kind?: Verdict | 'answer' | 'none';
  text?: string;
  hits?: Passage[];
  date?: string;
}

const CHIPS = {
  ar: ['هل المضاد الحيوي يعالج الزكام؟', 'ما هي مقاومة المضادات الحيوية؟', 'هل أشارك مضادي الحيوي مع غيري؟', 'كيف أحمي نفسي من العدوى؟'],
  en: ['Do antibiotics treat colds?', 'What is antibiotic resistance?', 'Can I share my antibiotic?', 'How can I prevent infections?'],
};

export default function Assistant() {
  const { t, lang } = useLang();
  const { items } = useApproved();
  const passages = useMemo(() => buildPassages(items ?? []), [items]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs]);

  function ask(raw: string) {
    const text = raw.trim().slice(0, 300);
    if (!text) return;
    const v = classify(text);
    const date = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB');
    let bot: Msg;
    if (v !== 'ok') bot = { who: 'bot', kind: v };
    else {
      const hits = retrieve(passages, text).map((h) => h.p);
      bot = hits.length ? { who: 'bot', kind: 'answer', hits, date } : { who: 'bot', kind: 'none' };
    }
    setMsgs((m) => [...m, { who: 'me', text }, bot]);
    setQ('');
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  const fixed: Record<string, string> = {
    emergency: 'asstEmergency',
    personal: 'asstPersonal',
    injection: 'asstInjection',
    none: 'asstNone',
  };

  return (
    <main className="wrap narrow stack">
      <h1>{t('asstTitle')}</h1>
      <p className="muted">{t('asstIntro')}</p>
      <section className="card stack" aria-label={t('asstTitle')}>
        <div className="chat" aria-live="polite">
          {msgs.length === 0 && <div className="msg bot">{t('asstHello')}</div>}
          {msgs.map((m, i) =>
            m.who === 'me' ? (
              <div key={i} className="msg me">{m.text}</div>
            ) : m.kind === 'answer' && m.hits ? (
              <div key={i} className="msg bot">
                <small className="muted">{t('asstFromSite')}</small>
                {m.hits.map((p) => (
                  <div key={p.id}>
                    <p>{p.text[lang]}</p>
                    <div className="src">
                      <Link to={p.link ?? '/'}>{p.label}</Link>
                      {p.unreviewed && <> · {t('unreviewed')}</>}
                      {p.refs.map((r) => (
                        <span key={r.url}>
                          {' · '}
                          <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>
                          {r.publisher ? ` (${r.publisher})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="src">{t('asstChecked')} {m.date}</div>
              </div>
            ) : (
              <div key={i} className={`msg bot ${m.kind === 'none' ? '' : 'warn'}`} role={m.kind === 'emergency' ? 'alert' : undefined}>
                {t(fixed[m.kind ?? 'none'])}
              </div>
            ),
          )}
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
