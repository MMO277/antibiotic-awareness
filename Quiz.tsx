import { useState } from 'react';
import { useLang } from './i18n';
import { QUESTIONS } from './quizData';
import { pick } from './types';

export default function Quiz() {
  const { t, lang } = useLang();
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUESTIONS[i];

  const choose = (k: number) => {
    if (sel !== null) return;
    setSel(k);
    if (k === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (i + 1 >= QUESTIONS.length) setDone(true);
    else {
      setI(i + 1);
      setSel(null);
    }
  };
  const restart = () => {
    setI(0);
    setSel(null);
    setScore(0);
    setDone(false);
  };

  if (done)
    return (
      <main className="wrap narrow stack">
        <div className="card center">
          <h1>{t('score')}</h1>
          <p className="big">
            {score} / {QUESTIONS.length}
          </p>
          <button className="btn" onClick={restart}>
            {t('restart')}
          </button>
        </div>
      </main>
    );

  return (
    <main className="wrap narrow stack">
      <h1>{t('quizTitle')}</h1>
      <div className="card">
        <p className="muted">
          {t('question')} {i + 1} {t('of')} {QUESTIONS.length}
        </p>
        <h2>{pick(q.q, lang)}</h2>
        <div className="options">
          {q.options.map((o, k) => {
            const cls = sel === null ? '' : k === q.answer ? 'right' : k === sel ? 'bad' : '';
            return (
              <button key={k} className={`opt ${cls}`} onClick={() => choose(k)} disabled={sel !== null}>
                {pick(o, lang)}
              </button>
            );
          })}
        </div>
        {sel !== null && (
          <>
            <p className="why">{pick(q.why, lang)}</p>
            <button className="btn" onClick={next}>
              {i + 1 >= QUESTIONS.length ? t('finish') : t('next')}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
