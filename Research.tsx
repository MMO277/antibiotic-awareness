import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { useLang } from './i18n';
import { QUESTIONS } from './quizData';
import { pick } from './types';
import Disclaimer from './Disclaimer';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function genCode(): string {
  const a = new Uint32Array(6);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => ALPHABET[n % ALPHABET.length]).join('');
}

interface Cfg { enabled: boolean; ethicsApprovalRef: string }

export default function Research() {
  const { t, lang } = useLang();
  const [cfg, setCfg] = useState<Cfg | null | undefined>(undefined);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'pre' | 'post'>('pre');
  const [code, setCode] = useState('');
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'researchConfig', 'main'))
      .then((s) => setCfg(s.exists() ? { enabled: !!s.data().enabled, ethicsApprovalRef: String(s.data().ethicsApprovalRef ?? '') } : null))
      .catch(() => setCfg(null));
  }, []);

  async function submit() {
    const c = code.trim().toUpperCase();
    if (!consent || c.length < 4 || answers.some((a) => a === null)) {
      setMsg(t('resAnswerAll'));
      return;
    }
    try {
      await addDoc(collection(db, 'researchResponses'), {
        phase, code: c, answers, consent: true, lang, createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch {
      setMsg(t('resFail'));
    }
  }

  if (cfg === undefined) return <main className="wrap"><p>{t('loading')}</p></main>;

  return (
    <main className="wrap narrow stack">
      <h1>{t('resTitle')}</h1>
      {!cfg || !cfg.enabled ? (
        <p className="alert">{t('resClosed')}</p>
      ) : done ? (
        <p className="notice">{t('resThanks')}</p>
      ) : (
        <>
          <p className="muted">{t('resEthics')}: <b>{cfg.ethicsApprovalRef}</b></p>
          <section className="card">
            <h2>{t('resConsentTitle')}</h2>
            <p>{t('resConsentText')}</p>
            <label className="check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              {t('resConsentCheck')}
            </label>
          </section>

          {consent && (
            <>
              <section className="card">
                <label>{t('resPhase')}</label>
                <div className="row">
                  <button className={`btn ${phase === 'pre' ? '' : 'ghost'}`} onClick={() => setPhase('pre')}>{t('pre')}</button>
                  <button className={`btn ${phase === 'post' ? '' : 'ghost'}`} onClick={() => setPhase('post')}>{t('post')}</button>
                </div>
                <label htmlFor="code">{t('resCode')}</label>
                <div className="row">
                  <input id="code" dir="ltr" maxLength={12} value={code} onChange={(e) => setCode(e.target.value)} />
                  {phase === 'pre' && <button className="btn ghost" onClick={() => setCode(genCode())}>{t('resGen')}</button>}
                </div>
              </section>

              {QUESTIONS.map((q, qi) => (
                <fieldset key={qi} className="card">
                  <legend>{qi + 1}. {pick(q.q, lang)}</legend>
                  {q.options.map((o, oi) => (
                    <label key={oi} className="check">
                      <input
                        type="radio"
                        name={`q${qi}`}
                        checked={answers[qi] === oi}
                        onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                      />
                      {pick(o, lang)}
                    </label>
                  ))}
                </fieldset>
              ))}
              {msg && <p className="alert">{msg}</p>}
              <button className="btn" onClick={submit}>{t('resSubmit')}</button>
            </>
          )}
        </>
      )}
      <Disclaimer />
    </main>
  );
}
