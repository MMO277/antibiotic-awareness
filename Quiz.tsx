import { useEffect, useState } from 'react';
import { useLang } from './i18n';
import { QUESTIONS, Question, getQuestionsByLevel } from './quizData';
import { pick, tr } from './types';
import { useAuth } from './authContext';
import { db, configured } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type Level = 'easy' | 'medium' | 'hard';
type Screen = 'pick' | 'quiz' | 'result';

interface WrongAnswer {
  question: Question;
  chosen: number;
}

const LEVEL_INFO = {
  easy: {
    emoji: '🌱',
    color: '#16a34a',
    bg: '#dcfce7',
    border: '#86efac',
    labelAr: 'مبتدئ',
    labelEn: 'Beginner',
    labelFr: 'Débutant',
    labelEs: 'Principiante',
    descAr: 'أساسيات الوعي بالمضادات الحيوية',
    descEn: 'Antibiotic awareness basics',
    descFr: 'Les bases de la sensibilisation aux antibiotiques',
    descEs: 'Conceptos básicos de conciencia sobre antibióticos',
    count: 8,
  },
  medium: {
    emoji: '⚗️',
    color: '#d97706',
    bg: '#fef3c7',
    border: '#fcd34d',
    labelAr: 'متوسط',
    labelEn: 'Intermediate',
    labelFr: 'Intermédiaire',
    labelEs: 'Intermedio',
    descAr: 'مفاهيم أعمق عن المقاومة والاستخدام الصحيح',
    descEn: 'Deeper concepts on resistance & correct use',
    descFr: 'Concepts approfondis sur la résistance et bon usage',
    descEs: 'Conceptos más profundos sobre resistencia y uso correcto',
    count: 8,
  },
  hard: {
    emoji: '🔬',
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fca5a5',
    labelAr: 'متقدم',
    labelEn: 'Advanced',
    labelFr: 'Avancé',
    labelEs: 'Avanzado',
    descAr: 'معرفة سريرية وعلمية متخصصة',
    descEn: 'Specialist clinical & scientific knowledge',
    descFr: 'Connaissances cliniques et scientifiques spécialisées',
    descEs: 'Conocimiento clínico y científico especializado',
    count: 8,
  },
};

function getBestScore(level: Level): number {
  try {
    return parseInt(localStorage.getItem(`quiz_best_${level}`) || '0', 10);
  } catch {
    return 0;
  }
}

function saveBestScoreLocal(level: Level, score: number, total: number) {
  try {
    const prev = getBestScore(level);
    if (score > prev) {
      localStorage.setItem(`quiz_best_${level}`, String(score));
    }
  } catch {}
}

// ── Save result to Firestore ──
async function saveResultToFirebase(
  uid: string,
  isAnonymous: boolean,
  displayName: string | null,
  level: Level,
  score: number,
  total: number
) {
  if (!configured || !db) return;
  try {
    await addDoc(collection(db, 'quizResults'), {
      uid,
      isAnonymous,
      displayName: displayName || null,
      level,
      score,
      total,
      percentage: Math.round((score / total) * 100),
      passed: score / total >= 0.75,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('Quiz save error:', e);
  }
}

export default function Quiz() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();

  const [screen, setScreen] = useState<Screen>('pick');
  const [level, setLevel] = useState<Level>('easy');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [saved, setSaved] = useState(false);

  const startQuiz = (lvl: Level) => {
    setLevel(lvl);
    const qs = getQuestionsByLevel(lvl);
    setQuestions(qs);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setShowExplanation(false);
    setWrongAnswers([]);
    setShowReview(false);
    setSaved(false);
    setScreen('quiz');
  };

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    setShowExplanation(true);
    const q = questions[currentIdx];
    if (idx === q.answer) {
      setScore((s) => s + 1);
    } else {
      setWrongAnswers((prev) => [...prev, { question: q, chosen: idx }]);
    }
  };

  const handleNext = () => {
    const q = questions[currentIdx];
    const isCorrect = selectedOpt === q.answer;
    const newScore = score + (isCorrect ? 0 : 0); // score already updated in handleSelect

    setSelectedOpt(null);
    setShowExplanation(false);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setScreen('result');
    }
  };

  // Save to Firebase when result screen appears
  useEffect(() => {
    if (screen !== 'result' || saved) return;
    const total = questions.length;
    if (total === 0) return;

    // Save locally
    saveBestScoreLocal(level, score, total);

    // Save to Firestore
    if (user) {
      saveResultToFirebase(
        user.uid,
        user.isAnonymous,
        user.displayName,
        level,
        score,
        total
      );
    } else {
      // زائر بدون حساب — نحفظ بـ anonymous ID من localStorage
      try {
        let anonId = localStorage.getItem('aa_anon_id');
        if (!anonId) {
          anonId = 'anon_' + Math.random().toString(36).slice(2, 10) + Date.now();
          localStorage.setItem('aa_anon_id', anonId);
        }
        saveResultToFirebase(anonId, true, null, level, score, total);
      } catch {}
    }

    setSaved(true);
  }, [screen]);

  const handleRestart = () => startQuiz(level);
  const handleBackToPick = () => setScreen('pick');

  const info = LEVEL_INFO[level];
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = pct >= 75;

  // ── LEVEL PICKER ──
  if (screen === 'pick') {
    return (
      <main className="wrap narrow stack">
        <h1>📝 {t('navQuiz')}</h1>
        <p className="muted">
          {tr(lang, 'اختر مستوى الاختبار الذي يناسبك.', 'Choose the quiz level that suits you.', 'Choisissez le niveau de quiz qui vous convient.', 'Elige el nivel de cuestionario que más te convenga.')}
        </p>

        <div style={{ display: 'grid', gap: '14px' }}>
          {(['easy', 'medium', 'hard'] as Level[]).map((lvl) => {
            const d = LEVEL_INFO[lvl];
            const best = getBestScore(lvl);
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => startQuiz(lvl)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '18px 20px', background: d.bg,
                  border: `2px solid ${d.border}`, borderRadius: '14px',
                  cursor: 'pointer', textAlign: isAr ? 'right' : 'left',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span style={{ fontSize: '2.2rem', flexShrink: 0 }}>{d.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ color: d.color, fontSize: '1.1rem' }}>
                      {lang === 'ar' ? d.labelAr : lang === 'fr' ? d.labelFr : lang === 'es' ? d.labelEs : d.labelEn}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      ({d.count} {tr(lang, 'سؤال', 'questions', 'questions', 'preguntas')})
                    </span>
                    {best > 0 && (
                      <span style={{ fontSize: '0.75rem', background: d.color, color: '#fff', borderRadius: '20px', padding: '2px 8px' }}>
                        🏅 {tr(lang, 'أفضل:', 'Best:', 'Meilleur :', 'Mejor:')} {best}/{d.count}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#475569' }}>
                    {lang === 'ar' ? d.descAr : lang === 'fr' ? d.descFr : lang === 'es' ? d.descEs : d.descEn}
                  </p>
                </div>
                <span style={{ color: d.color, fontSize: '1.4rem', flexShrink: 0 }}>{isAr ? '←' : '→'}</span>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  const q = questions[currentIdx];
  const progress = (currentIdx / total) * 100;

  // ── RESULT SCREEN ──
  if (screen === 'result') {
    return (
      <main className="wrap narrow stack">
        <div className="card stack center" style={{
          padding: '32px 20px',
          background: passed ? '#f0fdf4' : '#fefce8',
          border: `2px solid ${passed ? '#86efac' : '#fcd34d'}`,
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>
            {pct === 100 ? '🏆' : passed ? '🎉' : '📚'}
          </div>
          <h2 style={{ margin: '0 0 8px', color: passed ? '#15803d' : '#92400e' }}>
            {passed
              ? tr(lang, 'أحسنت! اجتزت الاختبار', 'Well done! You passed', 'Bravo ! Vous avez réussi', '¡Bien hecho! Aprobaste')
              : tr(lang, 'حاول مرة أخرى', 'Try again', 'Réessayez', 'Inténtalo de nuevo')}
          </h2>

          {/* Score circle */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: passed ? '#dcfce7' : '#fef3c7',
            border: `4px solid ${passed ? '#22c55e' : '#f59e0b'}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', margin: '12px auto',
          }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: passed ? '#15803d' : '#92400e' }}>
              {score}/{total}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{pct}%</span>
          </div>

          <span style={{
            background: info.color, color: '#fff', borderRadius: '20px',
            padding: '3px 12px', fontSize: '0.82rem', marginBottom: '8px',
          }}>
            {info.emoji} {lang === 'ar' ? info.labelAr : lang === 'fr' ? info.labelFr : lang === 'es' ? info.labelEs : info.labelEn}
          </span>

          {/* Saved indicator */}
          {saved && configured && (
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 8px' }}>
              ☁️ {tr(lang, 'تم حفظ نتيجتك', 'Result saved', 'Résultat enregistré', 'Resultado guardado')}
              {user && !user.isAnonymous && user.displayName ? ` (${user.displayName})` : ''}
            </p>
          )}

          <p className="muted" style={{ maxWidth: '40ch', margin: '0 auto 16px', textAlign: 'center' }}>
            {passed
              ? tr(lang, 'لديك وعي دوائي ممتاز يساهم في حماية المجتمع من المقاومة البكتيرية.', 'You have excellent antibiotic awareness that helps protect your community from resistance.', 'Vous avez une excellente sensibilisation antibiotique.', 'Tienes excelente conciencia antibiótica.')
              : tr(lang, 'راجع التوضيحات أدناه لتقوية معلوماتك ثم أعد المحاولة.', 'Review the explanations below to strengthen your knowledge, then try again.', 'Révisez les explications ci-dessous puis réessayez.', 'Revisa las explicaciones a continuación.')}
          </p>

          <div className="row" style={{ justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={handleRestart}
              style={{ background: info.color, color: '#fff', border: 'none' }}>
              🔄 {tr(lang, 'إعادة الاختبار', 'Retake Quiz', 'Recommencer', 'Repetir')}
            </button>
            <button type="button" className="btn" onClick={handleBackToPick}
              style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
              🏠 {tr(lang, 'اختر مستوى آخر', 'Choose Another Level', 'Choisir un autre niveau', 'Elegir otro nivel')}
            </button>
          </div>

          {/* Wrong answers review */}
          {wrongAnswers.length > 0 && (
            <div style={{ width: '100%', marginTop: '24px' }}>
              <button type="button" onClick={() => setShowReview((v) => !v)}
                style={{
                  width: '100%', padding: '10px', background: '#fff7ed',
                  border: '1px solid #fed7aa', borderRadius: '10px',
                  cursor: 'pointer', fontWeight: 600, color: '#c2410c', fontSize: '0.95rem',
                }}>
                {showReview ? '▲' : '▼'}{' '}
                {tr(lang, `مراجعة ${wrongAnswers.length} إجابة خاطئة`, `Review ${wrongAnswers.length} wrong answer${wrongAnswers.length > 1 ? 's' : ''}`, `Revoir ${wrongAnswers.length} mauvaise${wrongAnswers.length > 1 ? 's' : ''} réponse${wrongAnswers.length > 1 ? 's' : ''}`, `Revisar ${wrongAnswers.length} respuesta${wrongAnswers.length > 1 ? 's' : ''} incorrecta${wrongAnswers.length > 1 ? 's' : ''}`)}
              </button>
              {showReview && (
                <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                  {wrongAnswers.map((w, i) => (
                    <div key={i} style={{ padding: '14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', textAlign: isAr ? 'right' : 'left' }}>
                      <p style={{ fontWeight: 700, margin: '0 0 8px', color: '#1e293b', fontSize: '0.95rem' }}>
                        ❓ {pick(w.question.q, lang)}
                      </p>
                      <p style={{ margin: '0 0 4px', color: '#dc2626', fontSize: '0.88rem' }}>
                        ✗ {tr(lang, 'إجابتك:', 'Your answer:', 'Votre réponse :', 'Tu respuesta:')} {pick(w.question.options[w.chosen], lang)}
                      </p>
                      <p style={{ margin: '0 0 8px', color: '#16a34a', fontSize: '0.88rem' }}>
                        ✓ {tr(lang, 'الصواب:', 'Correct:', 'Correct :', 'Correcto:')} {pick(w.question.options[w.question.answer], lang)}
                      </p>
                      <div style={{ padding: '10px 12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                        <b style={{ color: '#0369a1', fontSize: '0.82rem' }}>
                          💡 {tr(lang, 'التوضيح الطبي:', 'Clinical Explanation:', 'Explication médicale :', 'Explicación clínica:')}
                        </b>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#0c4a6e', lineHeight: 1.6 }}>
                          {pick(w.question.why, lang)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── QUIZ SCREEN ──
  return (
    <main className="wrap narrow stack">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button type="button" onClick={handleBackToPick}
          style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}>
          {isAr ? '← رجوع' : '← Back'}
        </button>
        <span style={{ background: info.bg, color: info.color, border: `1px solid ${info.border}`, borderRadius: '20px', padding: '3px 12px', fontSize: '0.82rem', fontWeight: 600 }}>
          {info.emoji} {lang === 'ar' ? info.labelAr : lang === 'fr' ? info.labelFr : lang === 'es' ? info.labelEs : info.labelEn}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#e2e8f0', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: info.color, borderRadius: '99px', transition: 'width 0.3s ease' }} />
      </div>

      <div className="card stack" style={{ padding: '20px' }}>
        <div className="head" style={{ marginBottom: '8px' }}>
          <span className="badge" style={{ background: info.bg, color: info.color }}>
            {tr(lang, `السؤال ${currentIdx + 1} من ${total}`, `Question ${currentIdx + 1} of ${total}`, `Question ${currentIdx + 1} sur ${total}`, `Pregunta ${currentIdx + 1} de ${total}`)}
          </span>
          <span className="small muted">✅ {tr(lang, `النتيجة: ${score}`, `Score: ${score}`, `Score : ${score}`, `Puntuación: ${score}`)}</span>
        </div>

        <h3 style={{ margin: '0 0 16px', color: 'var(--navy)', fontSize: '1.1rem', lineHeight: 1.5 }}>
          {pick(q.q, lang)}
        </h3>

        <div style={{ display: 'grid', gap: '8px' }}>
          {q.options.map((opt, optIdx) => {
            let bg = '#ffffff';
            let borderColor = 'var(--line)';
            let icon = '';
            if (selectedOpt !== null) {
              if (optIdx === q.answer) { bg = '#dcfce7'; borderColor = '#22c55e'; icon = '✓ '; }
              else if (optIdx === selectedOpt) { bg = '#fee2e2'; borderColor = '#ef4444'; icon = '✗ '; }
            }
            return (
              <button key={optIdx} type="button" onClick={() => handleSelect(optIdx)}
                disabled={selectedOpt !== null}
                style={{
                  padding: '12px 16px', textAlign: isAr ? 'right' : 'left',
                  background: bg, border: `2px solid ${borderColor}`, borderRadius: '10px',
                  cursor: selectedOpt !== null ? 'default' : 'pointer',
                  fontSize: '0.95rem', color: 'var(--ink)', transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                <span style={{ fontWeight: 700, color: borderColor === 'var(--line)' ? '#94a3b8' : borderColor, flexShrink: 0 }}>
                  {icon || String.fromCharCode(65 + optIdx) + '.'}
                </span>
                {pick(opt, lang)}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '10px', border: '1px solid #bae6fd', background: '#f0f9ff' }}>
            <b style={{ color: '#0369a1', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>
              💡 {tr(lang, 'التوضيح الطبي:', 'Clinical Explanation:', 'Explication médicale :', 'Explicación clínica:')}
            </b>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a6e', lineHeight: 1.65 }}>
              {pick(q.why, lang)}
            </p>
          </div>
        )}

        {selectedOpt !== null && (
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn" onClick={handleNext}
              style={{ background: info.color, color: '#fff', border: 'none' }}>
              {currentIdx + 1 < total
                ? tr(lang, 'السؤال التالي ←', 'Next Question →', 'Question suivante →', 'Siguiente →')
                : tr(lang, 'عرض النتيجة 🏆', 'View Result 🏆', 'Voir le résultat 🏆', 'Ver resultado 🏆')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
