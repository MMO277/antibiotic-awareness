import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { STEPS } from './contentData';
import { pick } from './types';
import Disclaimer from './Disclaimer';

const KEY = 'amr-learn-done';

function loadDone(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function Learn() {
  const { lang } = useLang();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<string[]>(loadDone);
  const step = STEPS[idx];

  useEffect(() => {
    setSel(null);
  }, [idx]);

  const choose = (k: number) => {
    if (sel !== null) return;
    setSel(k);
    if (!done.includes(step.id)) {
      const nd = [...done, step.id];
      setDone(nd);
      try {
        localStorage.setItem(KEY, JSON.stringify(nd));
      } catch {
        /* storage unavailable: progress just won't be remembered */
      }
    }
  };
  const reset = () => {
    setDone([]);
    setIdx(0);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };
  const pct = Math.round((done.length / STEPS.length) * 100);

  return (
    <main className="wrap narrow stack">
      <h1>{L('رحلة تعلّم: مقاومة المضادات الحيوية', 'Learning journey: antimicrobial resistance')}</h1>
      <p className="muted">
        {L(
          'ست خطوات قصيرة، وبعد كل خطوة سؤال للتأكد من الفهم. المحتوى بصياغة المشروع من مصادر رسمية مذكورة، وينتظر مراجعة مختص مؤهل، والترجمة العربية آلية.',
          'Six short steps, each with a quick check. The wording is the project’s own, based on the official sources listed, and is awaiting review by a qualified professional; the Arabic is an AI translation.',
        )}
      </p>

      <div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={L('نسبة الإكمال', 'Completion')}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="small muted">{L('أكملت', 'Completed')} {done.length} / {STEPS.length}</p>
      </div>

      <div className="chips" role="tablist">
        {STEPS.map((s, k) => (
          <button key={s.id} className={`chip ${k === idx ? 'on' : ''}`} onClick={() => setIdx(k)} aria-current={k === idx ? 'step' : undefined}>
            {done.includes(s.id) ? '✓ ' : ''}{k + 1}
          </button>
        ))}
      </div>

      <article className="card">
        <h2>{idx + 1}. {pick(step.title, lang)}</h2>
        {pick(step.body, lang).split('\n\n').map((p, k) => <p key={k}>{p}</p>)}

        <h3>{L('تأكد من فهمك', 'Check your understanding')}</h3>
        <p>{pick(step.check.q, lang)}</p>
        <div className="options">
          {step.check.options.map((o, k) => {
            const cls = sel === null ? '' : k === step.check.answer ? 'right' : k === sel ? 'bad' : '';
            return (
              <button key={k} className={`opt ${cls}`} disabled={sel !== null} onClick={() => choose(k)}>
                {pick(o, lang)}
              </button>
            );
          })}
        </div>
        {sel !== null && <p className="why">{pick(step.check.why, lang)}</p>}

        <p className="small muted">{L('المصادر:', 'Sources:')}</p>
        <ul className="srclist small">
          {step.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
              {s.publisher && <span className="muted"> — {s.publisher}{s.date ? `, ${s.date}` : ''}</span>}
            </li>
          ))}
        </ul>

        <div className="row wrapRow">
          {idx > 0 && <button className="btn ghost" onClick={() => setIdx(idx - 1)}>{L('السابق', 'Previous')}</button>}
          {idx < STEPS.length - 1 && <button className="btn" onClick={() => setIdx(idx + 1)}>{L('التالي', 'Next')}</button>}
        </div>
      </article>

      {done.length === STEPS.length && (
        <div className="notice">
          <strong>{L('أحسنت! أكملت الرحلة. ', 'Well done! You completed the journey. ')}</strong>
          <Link to="/quiz">{L('جرّب اختبار المعلومات', 'Try the knowledge quiz')}</Link>
        </div>
      )}
      <button className="btn ghost small" onClick={reset}>{L('مسح التقدم', 'Reset progress')}</button>
      <Disclaimer />
    </main>
  );
}
