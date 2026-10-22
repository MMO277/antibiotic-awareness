import React, { useState } from 'react';
import { useLang } from './i18n';
import { AssessmentQuestion } from './assessmentData';

interface Props {
  mode: 'pre' | 'post';
  topicTitle: string;
  questions: AssessmentQuestion[];
  onComplete: (score: number, total: number) => void;
  onCancel?: () => void;
}

export function PrePostAssessmentModal({ mode, topicTitle, questions, onComplete, onCancel }: Props) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  const q = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    setShowFeedback(true);
  };

  const handleNext = () => {
    const updated = [...userAnswers, selectedOpt!];
    setUserAnswers(updated);
    setSelectedOpt(null);
    setShowFeedback(false);

    if (isLast) {
      let finalScore = 0;
      updated.forEach((ans, i) => {
        if (ans === questions[i].correctAnswer) {
          finalScore++;
        }
      });
      onComplete(finalScore, questions.length);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--card-bg, #fff)',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          direction: isAr ? 'rtl' : 'ltr'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: mode === 'pre' ? 'rgba(0,137,123,0.12)' : 'rgba(46,125,50,0.12)',
              color: mode === 'pre' ? 'var(--brand, #00897b)' : '#2e7d32'
            }}
          >
            {mode === 'pre'
              ? isAr ? '📝 التقييم القبلي الأولي' : '📝 Initial Pre-Assessment'
              : isAr ? '🎯 التقييم البعدي النهائي' : '🎯 Final Post-Assessment'}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #777)' }}>
            {currentIdx + 1} / {questions.length}
          </span>
        </div>

        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem' }}>
          {isAr ? q.question.ar : q.question.en}
        </h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>
          {isAr ? `الموضوع: ${topicTitle}` : `Topic: ${topicTitle}`}
        </p>

        {/* خيارات الإجابة */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {q.options.map((opt, idx) => {
            let bg = 'var(--bg, #f5f5f5)';
            let border = '1px solid var(--border, #ddd)';
            let color = 'inherit';

            if (selectedOpt !== null) {
              if (idx === q.correctAnswer) {
                bg = 'rgba(46,125,50,0.15)';
                border = '1px solid #2e7d32';
                color = '#1b5e20';
              } else if (idx === selectedOpt) {
                bg = 'rgba(211,47,47,0.12)';
                border = '1px solid #d32f2f';
                color = '#b71c1c';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                disabled={selectedOpt !== null}
                style={{
                  textAlign: isAr ? 'right' : 'left',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: bg,
                  border,
                  color,
                  fontSize: '0.9rem',
                  cursor: selectedOpt === null ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{String.fromCharCode(65 + idx)}.</span>
                <span>{isAr ? opt.ar : opt.en}</span>
              </button>
            );
          })}
        </div>

        {/* الشرح التوضيحي السريري الفوري */}
        {showFeedback && (
          <div
            style={{
              padding: '0.85rem',
              borderRadius: '8px',
              backgroundColor: selectedOpt === q.correctAnswer ? 'rgba(46,125,50,0.08)' : 'rgba(211,47,47,0.08)',
              border: `1px solid ${selectedOpt === q.correctAnswer ? '#2e7d32' : '#d32f2f'}`,
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              lineHeight: 1.5
            }}
          >
            <strong>
              {selectedOpt === q.correctAnswer
                ? isAr ? '✓ إجابة صحيحة:' : '✓ Correct:'
                : isAr ? '✗ التوضيح السريري السليم:' : '✗ Clinical Explanation:'}
            </strong>{' '}
            {isAr ? q.explanation.ar : q.explanation.en}
          </div>
        )}

        {/* أزرار التحكم والتقدم */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              style={{ fontSize: '0.85rem' }}
            >
              {isAr ? 'تخطي المتابعة' : 'Skip & Continue'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
            disabled={selectedOpt === null}
            style={{
              marginRight: isAr ? 'auto' : 0,
              marginLeft: isAr ? 0 : 'auto',
              padding: '0.6rem 1.4rem',
              fontSize: '0.9rem'
            }}
          >
            {isLast
              ? isAr ? 'إنهاء التقييم' : 'Finish Assessment'
              : isAr ? 'السؤال التالي ←' : 'Next Question →'}
          </button>
        </div>
      </div>
    </div>
  );
}
