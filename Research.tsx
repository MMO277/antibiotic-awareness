import { FormEvent, useEffect, useState } from 'react';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, configured } from './firebase';
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
    if (!configured || !db) {
      setCfg(null);
      return;
    }
    getDoc(doc(db, 'surveyConfig', 'main'))
      .then((s) =>
        setCfg(
          s.exists()
            ? {
                enabled: !!s.data().enabled,
                ethicsApprovalRef: String(s.data().ethicsApprovalRef || '')
              }
            : { enabled: false, ethicsApprovalRef: '' }
        )
      )
      .catch(() => setCfg(null));
  }, []);

  const ageNum = Number(age);
  const ageOk = Number.isInteger(ageNum) && ageNum >= 1 && ageNum <= 120;
  const nameOk = name.trim().length >= 2;
  const ansOk = answers.every((a) => a !== null);
  const answeredCount = answers.filter((a) => a !== null).length;
  const canSubmit = consent && nameOk && ageOk && ansOk && !busy;

  async function submit(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!consent || !ansOk) {
      setMsg(t('resAnswerAll'));
      return;
    }
    if (!nameOk || !ageOk) {
      setMsg(t('resBadInfo'));
      return;
    }
    if (!db || busy) return;
    setBusy(true);
    setMsg('');
    try {
      const answersMap: Record<string, number> = {};
      answers.forEach((a, idx) => {
        if (a !== null) answersMap[String(idx)] = a;
      });

      await addDoc(collection(db, 'surveyResponses'), {
        createdMs: Date.now(),
        name: name.trim(),
        age: ageNum,
        phase,
        answers: answersMap,
        lang,
        createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch {
      setMsg(t('resFail'));
    } finally {
      setBusy(false);
    }
  }

  if (cfg === undefined) {
    return (
      <main className="wrap narrow stack">
        <div className="card center"><p>{t('loading')}</p></div>
      </main>
    );
  }

  if (cfg === null || !cfg.enabled) {
    return (
      <main className="wrap narrow stack">
        <h1>📊 {t('resTitle')}</h1>
        <div className="card notice">
          <p style={{ margin: 0 }}>{t('resClosed')}</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="wrap narrow stack">
        <div className="card center stack" style={{ padding: '32px 20px', border: '2px solid var(--ok)' }}>
          <div style={{ fontSize: '3rem' }}>✅</div>
          <h2 style={{ color: 'var(--ok)', margin: 0 }}>{t('resThanks')}</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap narrow stack" style={{ paddingBottom: '120px' }}>
      <h1>📊 {t('resTitle')}</h1>

      {/* بطاقة الموافقة المستنيرة */}
      <div className="card stack">
        <h2 style={{ margin: 0 }}>📋 {t('resConsentTitle')}</h2>
        <p style={{ margin: 0 }}>{t('resConsentText')}</p>
        <p className="small muted" style={{ margin: 0 }}>⚠️ {t('resMinor')}</p>

        {cfg.ethicsApprovalRef && (
          <div className="notice compact">
            <b>{t('resEthics')}:</b> <span dir="ltr">{cfg.ethicsApprovalRef}</span>
          </div>
        )}

        <Disclaimer compact />

        <label
          className="check"
          style={{
            padding: '12px 14px',
            background: consent ? 'var(--tint)' : 'transparent',
            border: `2px solid ${consent ? 'var(--teal)' : 'var(--line)'}`,
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
            alignItems: 'center',
            marginTop: '4px',
          }}
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ width: '20px', height: '20px', margin: 0, flexShrink: 0, accentColor: 'var(--teal)' }}
          />
          <span>{t('resConsentCheck')}</span>
        </label>
      </div>

      {consent && (
        <form className="stack" onSubmit={submit}>
          {/* بيانات المشارك */}
          <div className="card form">
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
              <div className="form">
                <label htmlFor="res-name">{t('resName')} *</label>
                <input
                  id="res-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="form">
                <label htmlFor="res-age">{t('resAge')} *</label>
                <input
                  id="res-age"
                  type="number"
                  min={1}
                  max={120}
                  dir="ltr"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div className="form">
                <label htmlFor="res-phase">{t('resPhase')} *</label>
                <select
                  id="res-phase"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as 'pre' | 'post')}
                >
                  <option value="pre">{t('pre')}</option>
                  <option value="post">{t('post')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* شريط التقدم */}
          <div className="card" style={{ padding: '12px 16px' }}>
            <div className="head" style={{ marginBottom: '6px' }}>
              <b>{t('question')}</b>
              <span className="badge approved">
                {answeredCount} / {QUESTIONS.length}
              </span>
            </div>
            <div className="progress">
              <span style={{ width: `${Math.round((answeredCount / QUESTIONS.length) * 100)}%` }} />
            </div>
          </div>

          {/* قائمة الأسئلة */}
          {QUESTIONS.map((q, qIdx) => {
            const text = pick(q.q, lang);
            const opts = q.options.map((opt) => pick(opt, lang));
            const selected = answers[qIdx];
            return (
              <fieldset
                key={qIdx}
                className="card stack"
                style={{
                  margin: 0,
                  borderColor: selected !== null ? 'var(--teal)' : 'var(--line)',
                }}
              >
                <div className="head" style={{ gap: '8px' }}>
                  <span className="badge" style={{ background: selected !== null ? 'var(--teal)' : undefined, color: selected !== null ? '#fff' : undefined }}>
                    {t('question')} {qIdx + 1} / {QUESTIONS.length}
                  </span>
                </div>
                <p style={{ fontWeight: 700, margin: '4px 0 8px', color: 'var(--navy)', fontSize: '1.02rem' }}>
                  {qIdx + 1}. {text}
                </p>
                <div className="options" style={{ margin: 0 }}>
                  {opts.map((opt, oIdx) => {
                    const isChecked = selected === oIdx;
                    return (
                      <label
                        key={oIdx}
                        className="opt"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          margin: 0,
                          borderColor: isChecked ? 'var(--teal)' : 'var(--line)',
                          background: isChecked ? 'var(--tint)' : 'var(--card-bg)',
                          fontWeight: isChecked ? 600 : 400,
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${qIdx}`}
                          checked={isChecked}
                          onChange={() => {
                            const next = [...answers];
                            next[qIdx] = oIdx;
                            setAnswers(next);
                          }}
                          style={{
                            width: '20px',
                            height: '20px',
                            margin: 0,
                            flexShrink: 0,
                            accentColor: 'var(--teal)',
                          }}
                        />
                        <span style={{ flex: 1 }}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {msg && <div className="alert">{msg}</div>}
          {(!nameOk || !ageOk) && (name.length > 0 || age.length > 0) && (
            <div className="alert">{t('resBadInfo')}</div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn"
            style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}
          >
            {busy ? t('loading') : `📨 ${t('resSubmit')} (${answeredCount}/${QUESTIONS.length})`}
          </button>
        </form>
      )}
    </main>
  );
}
