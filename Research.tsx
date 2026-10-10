import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { useLang } from './i18n';
import { QUESTIONS } from './quizData';
import { pick } from './types';
import Disclaimer from './Disclaimer';

interface Cfg { enabled: boolean; ethicsApprovalRef: string }

export default function Research() {
  const { t, lang } = useLang();
  const [cfg, setCfg] = useState<Cfg | null | undefined>(undefined);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'pre' | 'post'>('pre');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'researchConfig', 'main'))
      .then((s) => setCfg(s.exists() ? { enabled: !!s.data().enabled, ethicsApprovalRef: String(s.data().ethicsApprovalRef ?? '') } : null))
      .catch(() => setCfg(null));
  }, []);

  const ageNum = Number(age);
  const ageOk = Number.isInteger(ageNum) && ageNum >= 1 && ageNum <= 120;

  async function submit() {
    const n = name.trim();
    if (n.length < 2 || n.length > 60 || !ageOk) {
      setMsg(t('resBadInfo'));
      return;
    }
    if (!consent || answers.some((a) => a === null)) {
      setMsg(t('resAnswerAll'));
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, 'researchResponses'), {
        phase, name: n, age: ageNum, answers, consent: true, lang, createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch {
      setMsg(t('resFail'));
    }
    setBusy(false);
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
              <section className="card form">
                <label>{t('resPhase')}</label>
                <div className="row">
                  <button type="button" className={`btn ${phase === 'pre' ? '' : 'ghost'}`} onClick={() => setPhase('pre')}>{t('pre')}</button>
                  <button type="button" className={`btn ${phase === 'post' ? '' : 'ghost'}`} onClick={() => setPhase('post')}>{t('post')}</button>
                </div>
                <label htmlFor="rname">{t('resName')}</label>
                <input id="rname" value={name} maxLength={60} autoComplete="off" onChange={(e) => setName(e.target.value)} />
                <label htmlFor="rage">{t('resAge')}</label>
                <input id="rage" type="number" inputMode="numeric" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} />
                {ageOk && ageNum < 18 && <p className="alert">{t('resMinor')}</p>}
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
              {msg && <p className="alert" role="alert">{msg}</p>}
              <button className="btn" onClick={submit} disabled={busy}>{t('resSubmit')}</button>
            </>
          )}
        </>
      )}
      <Disclaimer />
    </main>
  );
}
