import { FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from './i18n';
import { pick, tr } from './types';
import { Question } from './quizData';
import {
  resetQuizQuestionsToDefault,
  saveQuizQuestionsLive,
  useLiveQuizQuestions,
} from './liveCatalogSync';

export function QuestionEditorModal({
  question,
  questionIndex,
  defaultLevel = 'easy',
  uid,
  onClose,
}: {
  question: Question | null;
  questionIndex: number | null;
  defaultLevel?: 'easy' | 'medium' | 'hard';
  uid: string;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const { questions } = useLiveQuizQuestions();
  const isNew = question === null || questionIndex === null;

  const [level, setLevel] = useState<'easy' | 'medium' | 'hard'>(question?.level || defaultLevel);
  const [qAr, setQAr] = useState(question?.q.ar || '');
  const [qEn, setQEn] = useState(question?.q.en || '');
  const [opts, setOpts] = useState<{ ar: string; en: string }[]>(() =>
    question?.options?.length
      ? question.options.map((o) => ({ ar: o.ar, en: o.en }))
      : [
          { ar: '', en: '' },
          { ar: '', en: '' },
          { ar: '', en: '' },
        ]
  );
  const [answer, setAnswer] = useState<number>(question?.answer ?? 0);
  const [whyAr, setWhyAr] = useState(question?.why.ar || '');
  const [whyEn, setWhyEn] = useState(question?.why.en || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!qAr.trim() && !qEn.trim()) return;
    setSaving(true);
    try {
      const built: Question = {
        level,
        q: {
          ar: qAr.trim() || qEn.trim(),
          en: qEn.trim() || qAr.trim(),
          fr: question?.q.fr,
          es: question?.q.es,
        },
        options: opts.map((o, idx) => ({
          ar: o.ar.trim() || o.en.trim() || `خيار ${idx + 1}`,
          en: o.en.trim() || o.ar.trim() || `Option ${idx + 1}`,
          fr: question?.options?.[idx]?.fr,
          es: question?.options?.[idx]?.es,
        })),
        answer: Math.min(Math.max(0, answer), opts.length - 1),
        why: {
          ar: whyAr.trim() || whyEn.trim(),
          en: whyEn.trim() || whyAr.trim(),
          fr: question?.why.fr,
          es: question?.why.es,
        },
      };

      const next = isNew
        ? [...questions, built]
        : questions.map((item, idx) => (idx === questionIndex ? built : item));

      await saveQuizQuestionsLive(next, uid);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <form
        className="card form"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: '92dvh',
          overflowY: 'auto',
          border: '2px solid #0284c7',
        }}
      >
        <div className="head">
          <h3 style={{ margin: 0 }}>
            📋{' '}
            {isNew
              ? tr(lang, 'إضافة سؤال جديد للاختبار والاستبيان', 'Add New Quiz / Survey Question')
              : tr(lang, `تعديل السؤال رقم ${(questionIndex ?? 0) + 1}`, `Edit Question #${(questionIndex ?? 0) + 1}`)}
          </h3>
          <button type="button" className="btn ghost small" onClick={onClose}>
            ✕
          </button>
        </div>

        <div>
          <label>{tr(lang, 'مستوى الصعوبة', 'Difficulty Level')}</label>
          <select value={level} onChange={(e) => setLevel(e.target.value as 'easy' | 'medium' | 'hard')}>
            <option value="easy">{tr(lang, '🌱 مبتدئ (Easy)', '🌱 Beginner (Easy)')}</option>
            <option value="medium">{tr(lang, '⚗️ متوسط (Medium)', '⚗️ Intermediate (Medium)')}</option>
            <option value="hard">{tr(lang, '🔬 متقدم (Hard)', '🔬 Advanced (Hard)')}</option>
          </select>
        </div>

        <div>
          <label>{tr(lang, 'نص السؤال (بالعربية) *', 'Question Text (Arabic) *')}</label>
          <textarea dir="rtl" rows={2} required value={qAr} onChange={(e) => setQAr(e.target.value)} />
        </div>

        <div>
          <label>{tr(lang, 'نص السؤال (بالإنجليزية) *', 'Question Text (English) *')}</label>
          <textarea dir="ltr" rows={2} required value={qEn} onChange={(e) => setQEn(e.target.value)} />
        </div>

        <div className="stack">
          <b>{tr(lang, 'الخيارات المتاحة (حدد الإجابة الصحيحة):', 'Options (Select the correct answer):')}</b>
          {opts.map((opt, idx) => (
            <div key={idx} className="subcard" style={{ display: 'grid', gap: '8px' }}>
              <label className="check">
                <input
                  type="radio"
                  name="correct-opt"
                  checked={answer === idx}
                  onChange={() => setAnswer(idx)}
                />
                <b>
                  {tr(lang, `الخيار ${idx + 1}`, `Option ${idx + 1}`)}{' '}
                  {answer === idx ? `✅ (${tr(lang, 'الإجابة الصحيحة', 'Correct Answer')})` : ''}
                </b>
              </label>
              <input
                dir="rtl"
                placeholder={tr(lang, 'الخيار بالعربية', 'Option in Arabic')}
                value={opt.ar}
                onChange={(e) => setOpts(opts.map((o, i) => (i === idx ? { ...o, ar: e.target.value } : o)))}
              />
              <input
                dir="ltr"
                placeholder={tr(lang, 'الخيار بالإنجليزية', 'Option in English')}
                value={opt.en}
                onChange={(e) => setOpts(opts.map((o, i) => (i === idx ? { ...o, en: e.target.value } : o)))}
              />
            </div>
          ))}
        </div>

        <div>
          <label>{tr(lang, 'التفسير العلمي للإجابة (بالعربية)', 'Clinical Explanation (Arabic)')}</label>
          <textarea dir="rtl" rows={2} value={whyAr} onChange={(e) => setWhyAr(e.target.value)} />
        </div>

        <div>
          <label>{tr(lang, 'التفسير العلمي للإجابة (بالإنجليزية)', 'Clinical Explanation (English)')}</label>
          <textarea dir="ltr" rows={2} value={whyEn} onChange={(e) => setWhyEn(e.target.value)} />
        </div>

        <div className="row wrapRow" style={{ justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="btn ghost" onClick={onClose}>
            {tr(lang, 'إلغاء', 'Cancel')}
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? tr(lang, 'جارٍ الحفظ...', 'Saving...') : tr(lang, '💾 حفظ السؤال', '💾 Save Question')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default function SurveyQuizManagerTab({ uid }: { uid: string }) {
  const { lang } = useLang();
  const { questions } = useLiveQuizQuestions();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const handleDelete = async (idx: number) => {
    if (questions.length <= 1) return;
    if (!window.confirm(tr(lang, `حذف السؤال رقم ${idx + 1}؟`, `Delete question #${idx + 1}?`))) return;
    const next = questions.filter((_, i) => i !== idx);
    await saveQuizQuestionsLive(next, uid);
  };

  const handleReset = async () => {
    if (!window.confirm(tr(lang, 'استعادة بنك الأسئلة الافتراضي (24 سؤالاً)؟', 'Restore default 24 questions?'))) return;
    await resetQuizQuestionsToDefault(uid);
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              📋 {tr(lang, `بنك أسئلة الاستبيان والاختبار التفاعلي (${questions.length} سؤالاً)`, `Survey & Quiz Question Bank (${questions.length} questions)`)}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {tr(
                lang,
                'يمكنك تعديل الأسئلة أو إضافة أسئلة جديدة لتنعكس فوراً في صفحة الاختبارات واستبيان البحث.',
                'Add or edit questions live for both the interactive quiz and research survey.'
              )}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn" onClick={() => setAdding(true)}>
              ➕ {tr(lang, 'إضافة سؤال جديد', 'Add Question')}
            </button>
            <button type="button" className="btn ghost small" onClick={handleReset}>
              🔄 {tr(lang, 'استعادة الافتراضي', 'Reset Default')}
            </button>
          </div>
        </div>
      </div>

      <div className="stack">
        {questions.map((q, idx) => (
          <div key={idx} className="card">
            <div className="head" style={{ marginBottom: '6px' }}>
              <span className="badge approved">
                #{idx + 1} · {q.level.toUpperCase()}
              </span>
              <div className="row" style={{ gap: '6px' }}>
                <button type="button" className="btn small ghost" onClick={() => setEditingIdx(idx)}>
                  ✏️ {tr(lang, 'تعديل', 'Edit')}
                </button>
                <button type="button" className="btn small danger" onClick={() => handleDelete(idx)}>
                  🗑️ {tr(lang, 'حذف', 'Delete')}
                </button>
              </div>
            </div>
            <b style={{ display: 'block', marginBottom: '6px' }}>{pick(q.q, lang)}</b>
            <ul className="small" style={{ margin: '0 0 6px', paddingInlineStart: '20px' }}>
              {q.options.map((o, oIdx) => (
                <li key={oIdx} style={{ fontWeight: oIdx === q.answer ? 700 : 400, color: oIdx === q.answer ? '#15803d' : undefined }}>
                  {pick(o, lang)} {oIdx === q.answer ? '✓' : ''}
                </li>
              ))}
            </ul>
            <p className="small muted" style={{ margin: 0 }}>
              💡 {pick(q.why, lang)}
            </p>
          </div>
        ))}
      </div>

      {(adding || editingIdx !== null) && (
        <QuestionEditorModal
          question={editingIdx !== null ? questions[editingIdx] : null}
          questionIndex={editingIdx}
          uid={uid}
          onClose={() => {
            setEditingIdx(null);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}
