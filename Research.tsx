import { useEffect, useState } from 'react';
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
  const ansOk = answers.every((a) => a !== null);
  const canSubmit = consent && ageOk && ansOk && !busy;

  async function submit() {
    if (!canSubmit || !db) return;
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

  if (cfg === undefined) return <div className="card text-center p-8">{t('loading')}</div>;

  if (cfg === null || !cfg.enabled) {
    return (
      <div className="card text-center p-8">
        <p className="text-gray-500">{t('resDisabled')}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card text-center p-8">
        <h2 className="text-2xl font-bold text-emerald-600 mb-2">{t('resThanks')}</h2>
        <p className="text-gray-600">{t('resRecorded')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold mb-2">{t('resTitle')}</h2>
        <p className="text-gray-600 text-sm mb-4">{t('resIntro')}</p>

        {cfg.ethicsApprovalRef && (
          <div className="text-xs bg-gray-50 p-3 rounded-lg border text-gray-600 mb-4">
            <b>{t('resEthicsRef')}:</b> {cfg.ethicsApprovalRef}
          </div>
        )}

        <Disclaimer />

        <label className="flex items-center gap-2 mt-4 cursor-pointer text-sm font-medium">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="rounded text-emerald-600" />
          {t('resConsent')}
        </label>
      </div>

      {consent && (
        <div className="card space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('resName')}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder={t('optional')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('resAge')} *</label>
              <input type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('resPhase')} *</label>
              <select value={phase} onChange={(e) => setPhase(e.target.value as 'pre' | 'post')} className="input-field">
                <option value="pre">{t('resPre')}</option>
                <option value="post">{t('resPost')}</option>
              </select>
            </div>
          </div>

          <hr className="my-4" />

          <h3 className="font-bold text-lg mb-2">{t('resQuestions')}</h3>
          <div className="space-y-6">
            {QUESTIONS.map((q, qIdx) => {
              const text = pick(q, lang, 'q');
              const opts = [pick(q, lang, 'opt0'), pick(q, lang, 'opt1'), pick(q, lang, 'opt2')];
              return (
                <div key={q.id} className="border-b pb-4 last:border-b-0">
                  <p className="font-medium text-sm mb-2">{qIdx + 1}. {text}</p>
                  <div className="space-y-1 pl-2">
                    {opts.map((opt, oIdx) => (
                      <label key={oIdx} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[qIdx] === oIdx}
                          onChange={() => {
                            const next = [...answers];
                            next[qIdx] = oIdx;
                            setAnswers(next);
                          }}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {msg && <p className="text-sm text-red-600">{msg}</p>}

          <button onClick={submit} disabled={!canSubmit} className="btn-primary w-full py-3 text-base">
            {busy ? t('saving') : t('submit')}
          </button>
        </div>
      )}
    </div>
  );
}
