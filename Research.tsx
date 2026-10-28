import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, configured } from './firebase';
import { useLang } from './i18n';
import { pick, tr } from './types';
import Disclaimer from './Disclaimer';
import { useAuth } from './authContext';
import {
  saveQuizQuestionsLive,
  saveSurveyConfigLive,
  useLiveQuizQuestions,
} from './liveCatalogSync';
import { QuestionEditorModal } from './SurveyQuizEditor';

interface Cfg {
  enabled: boolean;
  ethicsApprovalRef: string;
}

export default function Research() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const { user, role } = useAuth();
  const canEditLive = role === 'editor' || role === 'reviewer' || role === 'admin';
  const { questions, surveyConfig: liveSurveyCfg } = useLiveQuizQuestions();

  const [cfg, setCfg] = useState<Cfg | null | undefined>(() =>
    liveSurveyCfg
      ? { enabled: liveSurveyCfg.enabled, ethicsApprovalRef: liveSurveyCfg.ethicsApprovalRef }
      : undefined
  );
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'pre' | 'post'>('pre');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Live Editor Modal state on Research page
  const [editingQIdx, setEditingQIdx] = useState<number | null>(null);
  const [addingNewQ, setAddingNewQ] = useState(false);

  // Sync answers array length when questions are added or removed live
  useEffect(() => {
    setAnswers((prev) => {
      if (prev.length === questions.length) return prev;
      return questions.map((_, idx) => (idx < prev.length ? prev[idx] : null));
    });
  }, [questions.length]);

  useEffect(() => {
    if (liveSurveyCfg) {
      setCfg({
        enabled: liveSurveyCfg.enabled,
        ethicsApprovalRef: liveSurveyCfg.ethicsApprovalRef,
      });
      return;
    }
    if (!configured || !db) {
      setCfg({ enabled: true, ethicsApprovalRef: 'AMR-EDU-2026' });
      return;
    }
    getDoc(doc(db, 'surveyConfig', 'main'))
      .then((s) =>
        setCfg(
          s.exists()
            ? {
                enabled: !!s.data().enabled,
                ethicsApprovalRef: String(s.data().ethicsApprovalRef || 'AMR-EDU-2026'),
              }
            : { enabled: true, ethicsApprovalRef: 'AMR-EDU-2026' }
        )
      )
      .catch(() => setCfg({ enabled: true, ethicsApprovalRef: 'AMR-EDU-2026' }));
  }, [liveSurveyCfg]);

  const handleToggleSurveyOpen = async () => {
    const nextEnabled = !(cfg?.enabled ?? true);
    const refStr = cfg?.ethicsApprovalRef || 'AMR-EDU-2026';
    setCfg({ enabled: nextEnabled, ethicsApprovalRef: refStr });
    try {
      await saveSurveyConfigLive({ enabled: nextEnabled, ethicsApprovalRef: refStr }, user?.uid || 'editor');
    } catch {
      /* ignore */
    }
  };

  const handleDeleteQuestionInline = async (qIdx: number) => {
    if (questions.length <= 1) return;
    if (!confirm(tr(lang, `هل أنت متأكد من حذف السؤال رقم ${qIdx + 1} من الاستبيان؟`, `Delete question #${qIdx + 1} from survey?`))) {
      return;
    }
    try {
      const next = questions.filter((_, i) => i !== qIdx);
      await saveQuizQuestionsLive(next, user?.uid || 'editor');
    } catch {
      alert(tr(lang, 'تعذر حذف السؤال.', 'Failed to delete question.'));
    }
  };

  const handleMoveQuestionInline = async (qIdx: number, dir: -1 | 1) => {
    const target = qIdx + dir;
    if (target < 0 || target >= questions.length) return;
    try {
      const next = [...questions];
      const tmp = next[qIdx];
      next[qIdx] = next[target];
      next[target] = tmp;
      await saveQuizQuestionsLive(next, user?.uid || 'editor');
    } catch {
      /* ignore */
    }
  };

  const ageNum = Number(age);
  const ageOk = Number.isInteger(ageNum) && ageNum >= 1 && ageNum <= 120;
  const nameOk = name.trim().length >= 2;
  const ansOk = answers.length === questions.length && answers.every((a) => a !== null);
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

  if ((cfg === null || !cfg.enabled) && !canEditLive) {
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

      {/* LIVE SURVEY EDITOR BAR (Visible to editor, reviewer, or admin) */}
      {canEditLive && (
        <section
          className="card"
          style={{
            border: '2px solid #0284c7',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(22, 163, 74, 0.08))',
            padding: '14px 18px',
          }}
        >
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                <span className="badge" style={{ background: '#0284c7', color: '#fff', fontWeight: 800 }}>
                  ⚡ {isAr ? 'محرر الاستبيان المباشر (Live Survey Editor)' : 'Live Survey Editor'}
                </span>
                <span className="badge" style={{ background: cfg?.enabled ? '#dcfce7' : '#fee2e2', color: cfg?.enabled ? '#166534' : '#991b1b', fontWeight: 700 }}>
                  {cfg?.enabled
                    ? isAr ? '🟢 مفتوح للجمهور' : '🟢 Open to Public'
                    : isAr ? '🔴 مغلق حالياً للجمهور' : '🔴 Closed to Public'}
                </span>
              </div>
              <p className="small" style={{ margin: '6px 0 0' }}>
                {isAr
                  ? `يمكنك إضافة سؤال جديد، أو تعديل أو حذف أو إعادة ترتيب أي من الأسئلة الـ (${questions.length}) مباشرة من الصفحة، وستظهر التعديلات فوراً لجميع المشاركين.`
                  : `Add, edit, reorder, or delete any of the (${questions.length}) survey questions directly—changes sync live to all participants.`}
              </p>
            </div>

            <div className="row wrapRow" style={{ gap: '8px' }}>
              <button
                type="button"
                className="btn small"
                style={{ background: '#15803d', fontWeight: 800 }}
                onClick={() => {
                  setEditingQIdx(null);
                  setAddingNewQ(true);
                }}
              >
                ➕ {isAr ? 'إضافة سؤال جديد للاستبيان' : 'Add Survey Question'}
              </button>
              <button
                type="button"
                className="btn ghost small"
                onClick={handleToggleSurveyOpen}
              >
                {cfg?.enabled
                  ? isAr ? '🔒 إغلاق الاستبيان مؤقتاً' : '🔒 Close Survey'
                  : isAr ? '🔓 فتح الاستبيان للجمهور' : '🔓 Open Survey'}
              </button>
              <Link to="/admin" className="btn ghost small">
                ⚙️ {isAr ? 'لوحة إدارة الاستبيان والنتائج' : 'Admin Survey Manager'}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* بطاقة الموافقة المستنيرة */}
      <div className="card stack">
        <h2 style={{ margin: 0 }}>📋 {t('resConsentTitle')}</h2>
        <p style={{ margin: 0 }}>{t('resConsentText')}</p>
        <p className="small muted" style={{ margin: 0 }}>⚠️ {t('resMinor')}</p>

        {cfg?.ethicsApprovalRef && (
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

      {(consent || canEditLive) && (
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
                {answeredCount} / {questions.length}
              </span>
            </div>
            <div className="progress">
              <span style={{ width: `${questions.length ? Math.round((answeredCount / questions.length) * 100) : 0}%` }} />
            </div>
          </div>

          {/* قائمة الأسئلة */}
          {questions.map((q, qIdx) => {
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
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span className="badge" style={{ background: selected !== null ? 'var(--teal)' : undefined, color: selected !== null ? '#fff' : undefined }}>
                    {t('question')} {qIdx + 1} / {questions.length}
                  </span>

                  {canEditLive && (
                    <div className="row wrapRow" style={{ gap: '6px' }}>
                      <button
                        type="button"
                        className="btn ghost small"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        disabled={qIdx === 0}
                        onClick={() => handleMoveQuestionInline(qIdx, -1)}
                        title={isAr ? 'تحريك لأعلى' : 'Move Up'}
                      >
                        ⬆️
                      </button>
                      <button
                        type="button"
                        className="btn ghost small"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        disabled={qIdx === questions.length - 1}
                        onClick={() => handleMoveQuestionInline(qIdx, 1)}
                        title={isAr ? 'تحريك لأسفل' : 'Move Down'}
                      >
                        ⬇️
                      </button>
                      <button
                        type="button"
                        className="btn ghost small"
                        style={{ padding: '4px 10px', fontSize: '0.78rem', borderColor: '#0284c7', color: '#0284c7', fontWeight: 700 }}
                        onClick={() => {
                          setEditingQIdx(qIdx);
                          setAddingNewQ(false);
                        }}
                      >
                        ✏️ {isAr ? 'تعديل السؤال' : 'Edit Question'}
                      </button>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          className="btn danger small"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleDeleteQuestionInline(qIdx)}
                        >
                          🗑️ {isAr ? 'حذف' : 'Delete'}
                        </button>
                      )}
                    </div>
                  )}
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
            {busy ? t('loading') : `📨 ${t('resSubmit')} (${answeredCount}/${questions.length})`}
          </button>
        </form>
      )}

      {(addingNewQ || editingQIdx !== null) && (
        <QuestionEditorModal
          question={editingQIdx !== null ? questions[editingQIdx] : null}
          questionIndex={editingQIdx}
          uid={user?.uid || 'editor'}
          onClose={() => {
            setEditingQIdx(null);
            setAddingNewQ(false);
          }}
        />
      )}
    </main>
  );
}
