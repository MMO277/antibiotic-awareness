import { useState } from 'react';
import { useLang } from './i18n';
import { QUESTIONS, Question } from './quizData';
import { pick, tr } from './types';

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
        {tr(
          lang,
          'اختبر معلوماتك ووعيك الدوائي حول الاستخدام الآمن للمضادات الحيوية وتصحيح المفاهيم الشائعة.',
          'Test your awareness and clinical knowledge about antibiotic safety and common misconceptions.',
          'Testez vos connaissances sur l’utilisation sûre des antibiotiques et les idées reçues courantes.',
          'Pon a prueba tus conocimientos sobre el uso seguro de los antibióticos y los mitos frecuentes.'
        )}
      </p>

      {finished ? (
        <div className="card stack center" style={{ padding: '32px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
            {score >= Math.ceil(QUESTIONS.length * 0.75) ? '🏆' : '📚'}
          </div>
          <h2>
            {tr(lang, 'اكتمل الاختبار بنجاح!', 'Quiz Completed!', 'Quiz Terminé !', '¡Cuestionario Completado!')}
          </h2>
          <p className="big" style={{ margin: '8px 0' }}>
            {score} / {QUESTIONS.length}
          </p>
          <p className="muted" style={{ maxWidth: '42ch', margin: '0 auto 16px' }}>
            {score >= Math.ceil(QUESTIONS.length * 0.75)
              ? tr(
                  lang,
                  'ممتاز! لديك وعي دوائي عالي يساهم في حماية المجتمع من المقاومة البكتيرية.',
                  'Excellent! You have strong antibiotic awareness helping curb antimicrobial resistance.',
                  'Excellent ! Vous avez une très bonne maîtrise du bon usage des antibiotiques.',
                  '¡Excelente! Tienes una sólida conciencia sobre el uso responsable de los antibióticos.'
                )
              : tr(
                  lang,
                  'جيد جداً! تصفح دليل الأدوية والمقالات بالمنصة لتعزيز معلوماتك الطبية.',
                  'Good effort! Review the platform articles and guidelines to strengthen your antibiotic knowledge.',
                  'Bon effort ! Consultez les articles et guides de la plateforme pour renforcer vos connaissances.',
                  '¡Buen intento! Revisa los artículos y guías de la plataforma para reforzar tus conocimientos.'
                )}
          </p>
          <div className="row" style={{ justifyContent: 'center', gap: '10px' }}>
            <button type="button" className="btn" onClick={handleRestart}>
              🔄 {tr(lang, 'إعادة الاختبار', 'Retake Quiz', 'Recommencer le Quiz', 'Repetir Cuestionario')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card stack" style={{ padding: '20px' }}>
          <div className="head" style={{ marginBottom: '8px' }}>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              {tr(
                lang,
                `السؤال ${currentIdx + 1} من ${QUESTIONS.length}`,
                `Question ${currentIdx + 1} of ${QUESTIONS.length}`,
                `Question ${currentIdx + 1} sur ${QUESTIONS.length}`,
                `Pregunta ${currentIdx + 1} de ${QUESTIONS.length}`
              )}
            </span>
            <span className="small muted">
              {tr(lang, `النتيجة: ${score}`, `Score: ${score}`, `Score : ${score}`, `Puntuación: ${score}`)}
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
                💡 {tr(lang, 'التوضيح الطبي:', 'Clinical Explanation:', 'Explication médicale :', 'Explicación clínica:')}
              </b>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#0c4a6e', lineHeight: 1.6 }}>
                {pick(q.why, lang)}
              </p>
            </div>
          )}

          {selectedOpt !== null && (
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" className="btn" onClick={handleNext}>
                {currentIdx + 1 < QUESTIONS.length
                  ? tr(lang, 'السؤال التالي ←', 'Next Question →', 'Question suivante →', 'Siguiente pregunta →')
                  : tr(lang, 'عرض النتيجة النهائية 🏆', 'View Final Score 🏆', 'Voir le score final 🏆', 'Ver puntuación final 🏆')}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
