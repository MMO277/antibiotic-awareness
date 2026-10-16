import { useState } from 'react';
import { useLang } from './i18n';
import { QUESTIONS, Question } from './quizData';
import { pick } from './types';

export default function Quiz() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const q: Question = QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    setShowExplanation(true);
    if (idx === q.answer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setShowExplanation(false);
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setFinished(false);
    setShowExplanation(false);
  };

  return (
    <main className="wrap narrow stack">
      <h1>📝 {t('navQuiz')}</h1>
      <p className="muted">
        {isAr
          ? 'اختبر معلوماتك ووعيك الدوائي حول الاستخدام الآمن للمضادات الحيوية وتصحيح المفاهيم الشائعة.'
          : 'Test your awareness and clinical knowledge about antibiotic safety and common misconceptions.'}
      </p>

      {finished ? (
        <div className="card stack center" style={{ padding: '32px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
            {score >= Math.ceil(QUESTIONS.length * 0.75) ? '🏆' : '📚'}
          </div>
          <h2>
            {isAr ? 'اكتمل الاختبار بنجاح!' : 'Quiz Completed!'}
          </h2>
          <p className="big" style={{ margin: '8px 0' }}>
            {score} / {QUESTIONS.length}
          </p>
          <p className="muted" style={{ maxWidth: '42ch', margin: '0 auto 16px' }}>
            {score >= Math.ceil(QUESTIONS.length * 0.75)
              ? isAr
                ? 'ممتاز! لديك وعي دوائي عالي يساهم في حماية المجتمع من المقاومة البكتيرية.'
                : 'Excellent! You have strong antibiotic awareness helping curb antimicrobial resistance.'
              : isAr
                ? 'جيد جداً! تصفح دليل الأدوية والمقالات بالمنصة لتعزيز معلوماتك الطبية.'
                : 'Good effort! Review the platform articles and guidelines to strengthen your antibiotic knowledge.'}
          </p>
          <div className="row" style={{ justifyContent: 'center', gap: '10px' }}>
            <button type="button" className="btn" onClick={handleRestart}>
              🔄 {isAr ? 'إعادة الاختبار' : 'Retake Quiz'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card stack" style={{ padding: '20px' }}>
          <div className="head" style={{ marginBottom: '8px' }}>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              {isAr ? `السؤال ${currentIdx + 1} من ${QUESTIONS.length}` : `Question ${currentIdx + 1} of ${QUESTIONS.length}`}
            </span>
            <span className="small muted">
              {isAr ? `النتيجة: ${score}` : `Score: ${score}`}
            </span>
          </div>

          <h3 style={{ margin: '0 0 16px', color: 'var(--navy)', fontSize: '1.15rem' }}>
            {pick(q.q, lang)}
          </h3>

          <div style={{ display: 'grid', gap: '8px' }}>
            {q.options.map((opt, optIdx) => {
              let bg = '#ffffff';
              let borderColor = 'var(--line)';
              if (selectedOpt !== null) {
                if (optIdx === q.answer) {
                  bg = '#dcfce7';
                  borderColor = '#22c55e';
                } else if (optIdx === selectedOpt) {
                  bg = '#fee2e2';
                  borderColor = '#ef4444';
                }
              }
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelect(optIdx)}
                  disabled={selectedOpt !== null}
                  style={{
                    padding: '12px 16px',
                    textAlign: isAr ? 'right' : 'left',
                    background: bg,
                    border: `2px solid ${borderColor}`,
                    borderRadius: '10px',
                    cursor: selectedOpt !== null ? 'default' : 'pointer',
                    fontSize: '0.96rem',
                    color: 'var(--ink)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontWeight: 700, marginInlineEnd: '8px' }}>
                    {String.fromCharCode(65 + optIdx)}.
                  </span>
                  {pick(opt, lang)}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div
              className="notice tip"
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #bae6fd',
                background: '#f0f9ff',
              }}
            >
              <b style={{ color: '#0369a1', display: 'block', marginBottom: '4px' }}>
                💡 {isAr ? 'التوضيح الطبي:' : 'Clinical Explanation:'}
              </b>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#0c4a6e', lineHeight: 1.6 }}>
                {pick(q.why, lang)}
              </p>
            </div>
          )}

          {selectedOpt !== null && (
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" className="btn" onClick={handleNext}>
                {currentIdx + 1 < QUESTIONS.length
                  ? isAr ? 'السؤال التالي ←' : 'Next Question →'
                  : isAr ? 'عرض النتيجة النهائية 🏆' : 'View Final Result 🏆'}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
