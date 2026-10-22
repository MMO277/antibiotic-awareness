import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, configured } from './firebase';
import { useAuth } from './authContext';
import { useLang } from './i18n';
import { STEPS } from './contentData';
import { pick } from './types';
import Disclaimer from './Disclaimer';
import { PRE_ASSESSMENT_QUESTIONS, POST_ASSESSMENT_QUESTIONS } from './assessmentData';
import {
  markTopicStartedLocally,
  markTopicCompletedLocally,
  recordPreAssessment,
  recordPostAssessment,
  logLearningEvent
} from './assessmentWorkflow';
import { PrePostAssessmentModal } from './PrePostAssessmentModal';

const KEY = 'amr-learn-done';

function getStorageKey(uid?: string | null): string {
  return uid ? `${KEY}_${uid}` : KEY;
}

function loadDone(uid?: string | null): string[] {
  try {
    const raw = localStorage.getItem(getStorageKey(uid)) ?? (uid ? localStorage.getItem(KEY) : null) ?? '[]';
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function Learn() {
  const { lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;

  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<string[]>(() => loadDone(uid));
  const hydratedUidRef = useRef<string | null>(null);
  const step = STEPS[idx];

  const [showPreModal, setShowPreModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [preScore, setPreScore] = useState<number | null>(null);

  useEffect(() => {
    setSel(null);
  }, [idx]);

  useEffect(() => {
    if (!step) return;
    if (markTopicStartedLocally(step.id)) {
      logLearningEvent('lesson_start', step.id);
      setShowPreModal(true);
    }
  }, [step]);

  useEffect(() => {
    if (authLoading) return;
    if (!uid) {
      hydratedUidRef.current = null;
      setDone(loadDone(null));
      return;
    }

    const localList = loadDone(uid);
    setDone(localList);

    if (!configured || !db) {
      hydratedUidRef.current = uid;
      return;
    }

    let cancelled = false;
    const userDocRef = doc(db, 'users', uid);

    getDoc(userDocRef)
      .then(async (snap) => {
        if (cancelled) return;
        const cloudDoneRaw = snap.exists() ? snap.data()?.learnDone : undefined;
        const cloudDone = Array.isArray(cloudDoneRaw)
          ? cloudDoneRaw.filter((x: unknown): x is string => typeof x === 'string')
          : [];
        const merged = Array.from(new Set([...cloudDone, ...localList]));

        try {
          localStorage.setItem(getStorageKey(uid), JSON.stringify(merged));
        } catch {}

        hydratedUidRef.current = uid;
        setDone(merged);

        if (merged.length > cloudDone.length) {
          await setDoc(
            userDocRef,
            { learnDone: merged, updatedAt: serverTimestamp() },
            { merge: true }
          );
        }
      })
      .catch(() => {
        if (!cancelled) hydratedUidRef.current = uid;
      });

    const unsubscribe = onSnapshot(
      userDocRef,
      (snap) => {
        if (cancelled || hydratedUidRef.current !== uid) return;
        if (snap.exists() && Array.isArray(snap.data()?.learnDone)) {
          const remoteDone = snap
            .data()!
            .learnDone.filter((x: unknown): x is string => typeof x === 'string');
          try {
            localStorage.setItem(getStorageKey(uid), JSON.stringify(remoteDone));
          } catch {}
          setDone((prev) => (JSON.stringify(prev) === JSON.stringify(remoteDone) ? prev : remoteDone));
        }
      },
      () => {}
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid, authLoading]);

  const saveProgress = (nextDone: string[]) => {
    setDone(nextDone);
    try {
      localStorage.setItem(getStorageKey(uid), JSON.stringify(nextDone));
    } catch {
      /* storage unavailable */
    }
    if (uid && configured && db) {
      setDoc(
        doc(db, 'users', uid),
        { learnDone: nextDone, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch(() => {});
    }
  };

  const choose = (k: number) => {
    if (sel !== null) return;
    setSel(k);
    if (!done.includes(step.id)) {
      const nd = [...done, step.id];
      saveProgress(nd);
    }
    if (markTopicCompletedLocally(step.id)) {
      logLearningEvent('lesson_complete', step.id);
    }
    setShowPostModal(true);
  };

  const reset = () => {
    setIdx(0);
    saveProgress([]);
    try {
      localStorage.removeItem(getStorageKey(uid));
    } catch {
      /* ignore */
    }
  };
  const pct = Math.round((done.length / STEPS.length) * 100);

  return (
    <main className="wrap narrow stack">
      <h1>{L('رحلة التعلم: مقاومة مضادات الميكروبات', 'Learning journey: antimicrobial resistance')}</h1>
      <p className="muted">
        {L(
          'ست خطوات قصيرة، مع اختبار سريع بعد كل منها. المادة التعليمية صياغة المنصة استناداً للمصادر الرسمية.',
          'Six short steps, each with a quick check. The wording is the project’s own, based on the official sources.'
        )}
      </p>

      <div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Learn progress">
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="small muted">{L('المكتمل', 'Completed')} {done.length} / {STEPS.length}</p>
      </div>

      <div className="chips" role="tablist">
        {STEPS.map((s, k) => (
          <button key={s.id} className={`chip ${k === idx ? 'on' : ''}`} onClick={() => setIdx(k)} aria-current={k === idx}>
            {done.includes(s.id) ? '✓ ' : ''}{k + 1}
          </button>
        ))}
      </div>

      <article className="card">
        <h2>{idx + 1}. {pick(step.title, lang)}</h2>
        {pick(step.body, lang).split('\n\n').map((p, k) => <p key={k}>{p}</p>)}

        <h3>{L('اختبر فهمك', 'Check your understanding')}</h3>
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
              {s.publisher && <span className="muted"> – {s.publisher}{s.date ? `, ${s.date}` : ''}</span>}
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
          <strong>{L('أحسنت! أكملت رحلة التعلم.', 'Well done! You completed the journey. ')}</strong>
          <Link to="/quiz">{L('جرب اختبار المعرفة الآن', 'Try the knowledge quiz')}</Link>
        </div>
      )}
      <button className="btn ghost small" onClick={reset}>{L('إعادة الضبط', 'Reset progress')}</button>
      <Disclaimer />

      {showPreModal && (
        <PrePostAssessmentModal
          mode="pre"
          topicTitle={lang === 'ar' ? step.title.ar : step.title.en}
          questions={PRE_ASSESSMENT_QUESTIONS}
          onComplete={(score, total) => {
            setPreScore(score);
            recordPreAssessment(step.id, score, total);
            setShowPreModal(false);
          }}
          onCancel={() => setShowPreModal(false)}
        />
      )}

      {showPostModal && (
        <PrePostAssessmentModal
          mode="post"
          topicTitle={lang === 'ar' ? step.title.ar : step.title.en}
          questions={POST_ASSESSMENT_QUESTIONS}
          onComplete={(score, total) => {
            recordPostAssessment(step.id, score, total, preScore ?? 0);
            setShowPostModal(false);
          }}
          onCancel={() => setShowPostModal(false)}
        />
      )}
    </main>
  );
}
