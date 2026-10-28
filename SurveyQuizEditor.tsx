import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, configured } from './firebase';
import { useLang } from './i18n';
import { pick, tr } from './types';
import { useAuth } from './authContext';
import { Question } from './quizData';
import {
  resetQuizQuestionsToDefault,
  saveQuizQuestionsLive,
  saveSurveyConfigLive,
  useLiveQuizQuestions,
} from './liveCatalogSync';

export function createEmptyQuestion(defaultLevel: 'easy' | 'medium' | 'hard' = 'easy'): Question {
  return {
    level: defaultLevel,
    q: { ar: '', en: '' },
    options: [
      { ar: '', en: '' },
      { ar: '', en: '' },
      { ar: '', en: '' },
    ],
    answer: 0,
    why: { ar: '', en: '' },
  };
}

export interface QuestionEditorModalProps {
  question?: Question | null;
  questionIndex?: number | null;
  defaultLevel?: 'easy' | 'medium' | 'hard';
  uid?: string;
  onClose: () => void;
  onSaved?: (updatedList: Question[]) => void;
}

export function QuestionEditorModal({
  question,
  questionIndex = null,
  defaultLevel = 'easy',
  uid: uidProp,
  onClose,
  onSaved,
}: QuestionEditorModalProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const uid = uidProp || user?.uid || 'editor';
  const { questions } = useLiveQuizQuestions();

  const isEditing = questionIndex !== null && questionIndex >= 0 && questionIndex < questions.length;
  const initialQ = useMemo<Question>(
    () =>
      question
        ? {
            level: question.level,
            q: { ...question.q },
            options: question.options.map((o) => ({ ...o })),
            answer: question.answer,
            why: { ...question.why },
          }
        : createEmptyQuestion(defaultLevel),
    [question, defaultLevel]
  );

  const [draft, setDraft] = useState<Question>(initialQ);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const handleOptionChange = (idx: number, field: 'ar' | 'en', val: string) => {
    setDraft((prev) => {
      const nextOpts = prev.options.map((o, i) => (i === idx ? { ...o, [field]: val } : o));
      return { ...prev, options: nextOpts };
    });
  };

  const handleAddOption = () => {
    if (draft.options.length >= 6) return;
    setDraft((prev) => ({
      ...prev,
      options: [...prev.options, { ar: '', en: '' }],
    }));
  };

  const handleRemoveOption = (idx: number) => {
    if (draft.options.length <= 2) return;
    setDraft((prev) => {
      const nextOpts = prev.options.filter((_, i) => i !== idx);
      const nextAns =
        prev.answer === idx
          ? 0
          : prev.answer > idx
            ? prev.answer - 1
            : prev.answer;
      return {
        ...prev,
        options: nextOpts,
        answer: Math.min(nextAns, nextOpts.length - 1),
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrMsg('');

    const qAr = draft.q.ar.trim() || draft.q.en.trim();
    const qEn = draft.q.en.trim() || draft.q.ar.trim();
    if (!qAr) {
      setErrMsg(tr(lang, 'يرجى كتابة نص السؤال.', 'Please enter the question text.'));
      return;
    }

    const validOptions = draft.options.map((o) => ({
      ar: o.ar.trim() || o.en.trim(),
      en: o.en.trim() || o.ar.trim(),
      ...(o.fr ? { fr: o.fr } : {}),
      ...(o.es ? { es: o.es } : {}),
    }));

    if (validOptions.some((o) => !o.ar)) {
      setErrMsg(tr(lang, 'يرجى ملء جميع الاختيارات أو حذف الاختيار الفارغ.', 'Please fill in all options or remove empty ones.'));
      return;
    }

    const whyAr =
      draft.why.ar.trim() ||
      draft.why.en.trim() ||
      'إجابة موثقة وفق إرشادات الاستخدام الرشيد للمضادات الحيوية.';
    const whyEn =
      draft.why.en.trim() ||
      draft.why.ar.trim() ||
      'Verified answer according to antimicrobial stewardship guidelines.';

    const cleanQuestion: Question = {
      level: draft.level,
      q: {
        ...draft.q,
        ar: qAr,
        en: qEn,
      },
      options: validOptions,
      answer: Math.max(0, Math.min(draft.answer, validOptions.length - 1)),
      why: {
        ...draft.why,
        ar: whyAr,
        en: whyEn,
      },
    };

    setSaving(true);
    try {
      const nextList = [...questions];
      if (isEditing && questionIndex !== null) {
        nextList[questionIndex] = cleanQuestion;
      } else {
        nextList.push(cleanQuestion);
      }
      const saved = await saveQuizQuestionsLive(nextList, uid);
      if (onSaved) onSaved(saved);
      onClose();
    } catch {
      setErrMsg(
        tr(
          lang,
          'تعذر الحفظ في السحابة. تأكد من تسجيل الدخول بحساب محرر (editor) أو مراجع (reviewer) أو مدير (admin).',
          'Failed to save to cloud. Ensure you are signed in as editor, reviewer, or admin.'
        )
      );
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || questionIndex === null) return;
    if (questions.length <= 1) {
      alert(tr(lang, 'لا يمكن حذف السؤال الوحيد المتبقي.', 'Cannot delete the only remaining question.'));
      return;
    }
    if (!confirm(tr(lang, 'هل أنت متأكد من حذف هذا السؤال من الاستبيان والاختبار؟', 'Delete this question from the survey and quiz?'))) {
      return;
    }
    setSaving(true);
    try {
      const nextList = questions.filter((_, i) => i !== questionIndex);
      const saved = await saveQuizQuestionsLive(nextList, uid);
      if (onSaved) onSaved(saved);
      onClose();
    } catch {
      setErrMsg(tr(lang, 'حدث خطأ أثناء حذف السؤال.', 'Failed to delete question.'));
      setSaving(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 10060,
      }}
      onClick={onClose}
    >
      <form
        className="card stack"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '22px',
          background: 'var(--card-bg, #ffffff)',
          borderTop: '4px solid #0284c7',
        }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, marginBottom: '4px' }}>
              {isEditing
                ? `✏️ ${tr(lang, `تعديل السؤال رقم ${(questionIndex ?? 0) + 1}`, `Edit Question #${(questionIndex ?? 0) + 1}`)}`
                : `➕ ${tr(lang, 'إضافة سؤال جديد للاستبيان والاختبار', 'Add New Survey & Quiz Question')}`}
            </span>
            <h2 style={{ margin: '4px 0 0' }}>
              {isEditing
                ? tr(lang, 'تعديل نص السؤال والاختيارات والإجابة الصحيحة', 'Edit Question, Options & Correct Answer')
                : tr(lang, 'إضافة سؤال جديد في الاستبيان والاختبار التفاعلي', 'Add New Question to Survey & Quiz')}
            </h2>
          </div>
          <button type="button" className="btn ghost small" onClick={onClose}>✕</button>
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            🎯 {tr(lang, 'مستوى السؤال (يظهر في الاستبيان وفي مستوى الاختبار المقابل):', 'Question Level:')}
          </label>
          <select
            className="input"
            value={draft.level}
            onChange={(e) => setDraft({ ...draft, level: e.target.value as 'easy' | 'medium' | 'hard' })}
          >
            <option value="easy">🌱 {tr(lang, 'مبتدئ (Easy - أساسيات الوعي)', 'Beginner (Easy)')}</option>
            <option value="medium">⚗️ {tr(lang, 'متوسط (Medium - مفاهيم المقاومة والاستخدام)', 'Intermediate (Medium)')}</option>
            <option value="hard">🔬 {tr(lang, 'متقدم (Hard - معرفة سريرية وعلمية)', 'Advanced (Hard)')}</option>
          </select>
        </div>

        {/* Question Text AR & EN */}
        <div className="grid" style={{ gap: '12px' }}>
          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              🇪🇬 {tr(lang, 'نص السؤال بالعربية *:', 'Question Text (Arabic) *:')}
            </label>
            <textarea
              rows={2}
              dir="rtl"
              className="input"
              required
              placeholder="مثال: هل المضادات الحيوية تعالج نزلات البرد والإنفلونزا الفيروسية؟"
              value={draft.q.ar}
              onChange={(e) => setDraft({ ...draft, q: { ...draft.q, ar: e.target.value } })}
            />
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              🇬🇧 {tr(lang, 'نص السؤال بالإنجليزية (اختياري - يُنسخ تلقائياً إن تُرك فارغاً):', 'Question Text (English - optional):')}
            </label>
            <textarea
              rows={2}
              dir="ltr"
              className="input"
              placeholder="e.g. Do antibiotics treat viral colds and flu?"
              value={draft.q.en}
              onChange={(e) => setDraft({ ...draft, q: { ...draft.q, en: e.target.value } })}
            />
          </div>
        </div>

        {/* Options & Correct Answer Radio */}
        <div
          className="stack"
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'var(--tint)',
            border: '1.5px solid #0e9aa7',
            gap: '10px',
          }}
        >
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <b style={{ color: '#0369a1' }}>
                📋 {tr(lang, 'الاختيارات المتاحة (حدّد الدائرة بجانب الإجابة الصحيحة):', 'Options (Select the radio button next to the correct answer):')}
              </b>
            </div>
            {draft.options.length < 6 && (
              <button type="button" className="btn ghost small" onClick={handleAddOption}>
                ➕ {tr(lang, 'إضافة اختيار آخر', 'Add Option')}
              </button>
            )}
          </div>

          {draft.options.map((opt, idx) => {
            const isCorrect = draft.answer === idx;
            return (
              <div
                key={idx}
                className="card"
                style={{
                  padding: '10px 12px',
                  border: isCorrect ? '2px solid #16a34a' : '1px solid var(--line)',
                  background: isCorrect ? '#f0fdf4' : 'var(--card-bg)',
                }}
              >
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="row" style={{ gap: '8px', alignItems: 'center', cursor: 'pointer', fontWeight: 700, color: isCorrect ? '#15803d' : undefined }}>
                    <input
                      type="radio"
                      name="correct-answer-idx"
                      checked={isCorrect}
                      onChange={() => setDraft({ ...draft, answer: idx })}
                      style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                    />
                    <span>
                      {isCorrect
                        ? `✅ ${tr(lang, `الاختيار ${idx + 1} (الإجابة الصحيحة)`, `Option ${idx + 1} (Correct Answer)`)}`
                        : tr(lang, `الاختيار ${idx + 1} (اضغط لتعيينه كإجابة صحيحة)`, `Option ${idx + 1} (Click to mark correct)`)}
                    </span>
                  </label>
                  {draft.options.length > 2 && (
                    <button
                      type="button"
                      className="btn danger small"
                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                      onClick={() => handleRemoveOption(idx)}
                    >
                      🗑️ {tr(lang, 'حذف الاختيار', 'Remove')}
                    </button>
                  )}
                </div>

                <div className="grid" style={{ gap: '8px' }}>
                  <input
                    type="text"
                    dir="rtl"
                    className="input"
                    required
                    placeholder={`نص الاختيار ${idx + 1} بالعربية...`}
                    value={opt.ar}
                    onChange={(e) => handleOptionChange(idx, 'ar', e.target.value)}
                  />
                  <input
                    type="text"
                    dir="ltr"
                    className="input"
                    placeholder={`Option ${idx + 1} in English (optional)...`}
                    value={opt.en}
                    onChange={(e) => handleOptionChange(idx, 'en', e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Clinical Explanation (Why) */}
        <div className="grid" style={{ gap: '12px' }}>
          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              💡 {tr(lang, 'التفسير العلمي والتوضيح الطبي (يظهر للمستخدم بعد الإجابة):', 'Clinical Explanation (Arabic):')}
            </label>
            <textarea
              rows={2}
              dir="rtl"
              className="input"
              placeholder="مثال: المضادات الحيوية تقتل البكتيريا فقط ولا تؤثر على الفيروسات..."
              value={draft.why.ar}
              onChange={(e) => setDraft({ ...draft, why: { ...draft.why, ar: e.target.value } })}
            />
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              🇬🇧 {tr(lang, 'التفسير العلمي بالإنجليزية (اختياري):', 'Clinical Explanation (English - optional):')}
            </label>
            <textarea
              rows={2}
              dir="ltr"
              className="input"
              placeholder="e.g. Antibiotics only target bacteria and have no effect on respiratory viruses..."
              value={draft.why.en}
              onChange={(e) => setDraft({ ...draft, why: { ...draft.why, en: e.target.value } })}
            />
          </div>
        </div>

        {errMsg && <p className="alert">{errMsg}</p>}

        {/* Footer Actions */}
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
          <div>
            {isEditing && (
              <button
                type="button"
                className="btn danger small"
                onClick={handleDelete}
                disabled={saving}
              >
                🗑️ {tr(lang, 'حذف هذا السؤال نهائياً', 'Delete Question')}
              </button>
            )}
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>
              {tr(lang, 'إلغاء', 'Cancel')}
            </button>
            <button type="submit" className="btn" style={{ background: '#15803d' }} disabled={saving}>
              {saving
                ? tr(lang, 'جارٍ الحفظ والنشر الفوري...', 'Saving Live...')
                : `💾 ${tr(lang, 'حفظ ونشر السؤال فوراً للمستخدمين', 'Save & Publish Question Live')}`}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default function SurveyQuizManagerTab({ uid }: { uid?: string }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const effectiveUid = uid || user?.uid || 'editor';
  const { questions, surveyConfig, isCustomized } = useLiveQuizQuestions();

  const [levelFilter, setLevelFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Survey availability state (synced with both liveCatalogSync and surveyConfig/main)
  const [surveyEnabled, setSurveyEnabled] = useState<boolean>(surveyConfig?.enabled ?? true);
  const [ethicsRef, setEthicsRef] = useState<string>(surveyConfig?.ethicsApprovalRef || 'AMR-EDU-2026');

  useEffect(() => {
    if (surveyConfig) {
      setSurveyEnabled(surveyConfig.enabled);
      setEthicsRef(surveyConfig.ethicsApprovalRef || 'AMR-EDU-2026');
      return;
    }
    if (configured && db) {
      getDoc(doc(db, 'surveyConfig', 'main'))
        .then((s) => {
          if (s.exists()) {
            setSurveyEnabled(Boolean(s.data().enabled));
            setEthicsRef(String(s.data().ethicsApprovalRef || 'AMR-EDU-2026'));
          }
        })
        .catch(() => {});
    }
  }, [surveyConfig]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(''), 3800);
  };

  const handleSaveSurveyStatus = async () => {
    setBusyAction(true);
    try {
      await saveSurveyConfigLive(
        { enabled: surveyEnabled, ethicsApprovalRef: ethicsRef.trim() || 'AMR-EDU-2026' },
        effectiveUid
      );
      showToast(
        tr(
          lang,
          '✅ تم تحديث حالة الاستبيان البحثي ورقم الموافقة الأخلاقية لجميع الزوار فوراً!',
          '✅ Updated Research Survey status & ethics reference live!'
        )
      );
    } catch {
      alert(tr(lang, 'تعذر حفظ إعدادات الاستبيان.', 'Failed to save survey settings.'));
    }
    setBusyAction(false);
  };

  const handleMoveQuestion = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    setBusyAction(true);
    try {
      const next = [...questions];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      await saveQuizQuestionsLive(next, effectiveUid);
      showToast(tr(lang, '✅ تم تحديث ترتيب الأسئلة وحفظه فوراً.', '✅ Question order updated live.'));
    } catch {
      alert(tr(lang, 'تعذر تغيير الترتيب.', 'Failed to reorder.'));
    }
    setBusyAction(false);
  };

  const handleDeleteQuestion = async (index: number) => {
    if (questions.length <= 1) return;
    const qTitle = pick(questions[index].q, lang);
    if (!confirm(tr(lang, `هل تريد حذف السؤال رقم ${index + 1}:\n«${qTitle}»؟`, `Delete question #${index + 1}:\n"${qTitle}"?`))) {
      return;
    }
    setBusyAction(true);
    try {
      const next = questions.filter((_, i) => i !== index);
      await saveQuizQuestionsLive(next, effectiveUid);
      showToast(tr(lang, '🗑️ تم حذف السؤال وتحديث الاستبيان والاختبار عند المستخدمين.', '🗑️ Question deleted live.'));
    } catch {
      alert(tr(lang, 'تعذر حذف السؤال.', 'Failed to delete question.'));
    }
    setBusyAction(false);
  };

  const handleResetAllQuestions = async () => {
    if (!confirm(tr(lang, 'هل تريد استعادة الأسئلة الافتراضية الأصلية (24 سؤالاً)؟', 'Restore the original 24 default questions?'))) {
      return;
    }
    setBusyAction(true);
    try {
      await resetQuizQuestionsToDefault(effectiveUid);
      showToast(tr(lang, '↺ تمت استعادة الأسئلة الافتراضية الأصلية بنجاح.', '↺ Default questions restored.'));
    } catch {
      alert(tr(lang, 'تعذر الاستعادة.', 'Failed to restore defaults.'));
    }
    setBusyAction(false);
  };

  const filteredWithIndex = useMemo(() => {
    const clean = searchQ.trim().toLowerCase();
    return questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => {
        if (levelFilter !== 'all' && q.level !== levelFilter) return false;
        if (!clean) return true;
        const hay = `${q.q.ar} ${q.q.en} ${q.options.map((o) => `${o.ar} ${o.en}`).join(' ')} ${q.why.ar} ${q.why.en}`.toLowerCase();
        return hay.includes(clean);
      });
  }, [questions, levelFilter, searchQ]);

  const easyCount = questions.filter((q) => q.level === 'easy').length;
  const mediumCount = questions.filter((q) => q.level === 'medium').length;
  const hardCount = questions.filter((q) => q.level === 'hard').length;

  return (
    <div className="stack">
      {/* Header & Live Survey Toggle Card */}
      <section className="card highlight-card">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 800, marginBottom: '6px' }}>
              📋 {tr(lang, 'إدارة أسئلة الاستبيان البحثي والاختبار التفاعلي (تزامن لحظي)', 'Live Survey & Quiz Questions CMS')}
            </span>
            <h2 style={{ margin: '4px 0' }}>
              {tr(
                lang,
                `بنك أسئلة الاستبيان والاختبار (${questions.length} سؤالاً نشطاً)`,
                `Survey & Quiz Question Bank (${questions.length} Active Questions)`
              )}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {tr(
                lang,
                'أي سؤال تضيفه أو تعدله أو تحذفه هنا ينعكس في نفس اللحظة في صفحة «الاستبيان البحثي» (/research) وصفحة «الاختبار التفاعلي» (/quiz) لجميع الزوار.',
                'Any question added, edited, reordered, or deleted here updates both the Research Survey (/research) and Interactive Quiz (/quiz) in real time.'
              )}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button
              type="button"
              className="btn"
              style={{ background: '#15803d', fontWeight: 800 }}
              onClick={() => {
                setEditingIndex(null);
                setAddingNew(true);
              }}
            >
              ➕ {tr(lang, 'إضافة سؤال جديد', 'Add New Question')}
            </button>
            <Link to="/research" className="btn ghost small">
              👁️ {tr(lang, 'معاينة الاستبيان', 'View Survey')}
            </Link>
            <Link to="/quiz" className="btn ghost small">
              📝 {tr(lang, 'معاينة الاختبار', 'View Quiz')}
            </Link>
          </div>
        </div>

        {/* Survey Open/Close Controls */}
        <div
          className="card"
          style={{
            marginTop: '14px',
            padding: '12px 16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--line)',
          }}
        >
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <label className="row" style={{ gap: '10px', alignItems: 'center', cursor: 'pointer', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={surveyEnabled}
                onChange={(e) => setSurveyEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#16a34a' }}
              />
              <span>
                {surveyEnabled
                  ? `🟢 ${tr(lang, 'الاستبيان البحثي مفتوح حالياً لاستقبال إجابات المشاركين', 'Research Survey is currently OPEN for responses')}`
                  : `🔴 ${tr(lang, 'الاستبيان البحثي مغلق حالياً (فعّل المربع لفتحه للجمهور)', 'Research Survey is currently CLOSED')}`}
              </span>
            </label>

            <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                dir="ltr"
                className="input"
                style={{ width: '190px', padding: '6px 10px' }}
                placeholder="AMR-EDU-2026"
                value={ethicsRef}
                onChange={(e) => setEthicsRef(e.target.value)}
              />
              <button
                type="button"
                className="btn small"
                disabled={busyAction}
                onClick={handleSaveSurveyStatus}
              >
                💾 {tr(lang, 'حفظ حالة الاستبيان', 'Save Survey Status')}
              </button>
              {isCustomized && (
                <button
                  type="button"
                  className="btn ghost small"
                  disabled={busyAction}
                  onClick={handleResetAllQuestions}
                >
                  ↺ {tr(lang, 'استعادة الـ 24 سؤالاً الأصلية', 'Reset to Default 24 Questions')}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {toastMsg && (
        <div className="notice" style={{ background: '#dcfce7', borderColor: '#16a34a', color: '#166534', fontWeight: 700 }}>
          {toastMsg}
        </div>
      )}

      {/* Filter & Search Bar */}
      <section className="card">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div className="row wrapRow" style={{ gap: '6px' }}>
            <button
              type="button"
              className={`btn small ${levelFilter === 'all' ? '' : 'ghost'}`}
              onClick={() => setLevelFilter('all')}
            >
              📋 {tr(lang, `كل الأسئلة (${questions.length})`, `All (${questions.length})`)}
            </button>
            <button
              type="button"
              className={`btn small ${levelFilter === 'easy' ? '' : 'ghost'}`}
              onClick={() => setLevelFilter('easy')}
            >
              🌱 {tr(lang, `مبتدئ (${easyCount})`, `Easy (${easyCount})`)}
            </button>
            <button
              type="button"
              className={`btn small ${levelFilter === 'medium' ? '' : 'ghost'}`}
              onClick={() => setLevelFilter('medium')}
            >
              ⚗️ {tr(lang, `متوسط (${mediumCount})`, `Medium (${mediumCount})`)}
            </button>
            <button
              type="button"
              className={`btn small ${levelFilter === 'hard' ? '' : 'ghost'}`}
              onClick={() => setLevelFilter('hard')}
            >
              🔬 {tr(lang, `متقدم (${hardCount})`, `Hard (${hardCount})`)}
            </button>
          </div>

          <input
            type="search"
            className="input"
            style={{ maxWidth: '300px' }}
            placeholder={tr(lang, 'ابحث في نص الأسئلة أو الاختيارات...', 'Search questions or options...')}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>

        {/* Questions List */}
        <div className="stack" style={{ gap: '12px' }}>
          {filteredWithIndex.map(({ q, idx }) => {
            const lvlBadge =
              q.level === 'easy'
                ? { label: isAr ? '🌱 مبتدئ' : '🌱 Easy', bg: '#dcfce7', color: '#166534' }
                : q.level === 'medium'
                  ? { label: isAr ? '⚗️ متوسط' : '⚗️ Medium', bg: '#fef3c7', color: '#92400e' }
                  : { label: isAr ? '🔬 متقدم' : '🔬 Hard', bg: '#fee2e2', color: '#991b1b' };

            return (
              <div
                key={idx}
                className="card"
                style={{
                  borderInlineStart: `4px solid ${lvlBadge.color}`,
                  padding: '14px 16px',
                }}
              >
                <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="badge" style={{ fontWeight: 800 }}>
                        #{idx + 1}
                      </span>
                      <span
                        className="badge"
                        style={{ background: lvlBadge.bg, color: lvlBadge.color, fontWeight: 700 }}
                      >
                        {lvlBadge.label}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.02rem' }}>
                      {pick(q.q, lang)}
                    </h3>

                    <div className="stack" style={{ gap: '4px' }}>
                      {q.options.map((opt, oIdx) => {
                        const isAns = oIdx === q.answer;
                        return (
                          <div
                            key={oIdx}
                            className="small"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: isAns ? '#dcfce7' : 'var(--bg-subtle, #f8fafc)',
                              color: isAns ? '#166534' : undefined,
                              fontWeight: isAns ? 700 : 400,
                            }}
                          >
                            {isAns ? '✓ ' : `${oIdx + 1}. `}
                            {pick(opt, lang)}
                          </div>
                        );
                      })}
                    </div>

                    {pick(q.why, lang) && (
                      <p className="small muted" style={{ margin: '8px 0 0' }}>
                        💡 <b>{tr(lang, 'التوضيح:', 'Explanation:')}</b> {pick(q.why, lang)}
                      </p>
                    )}
                  </div>

                  <div className="row wrapRow" style={{ gap: '6px' }}>
                    <button
                      type="button"
                      className="btn ghost small"
                      title={tr(lang, 'تحريك لأعلى', 'Move Up')}
                      disabled={idx === 0 || busyAction}
                      onClick={() => handleMoveQuestion(idx, -1)}
                    >
                      ⬆️
                    </button>
                    <button
                      type="button"
                      className="btn ghost small"
                      title={tr(lang, 'تحريك لأسفل', 'Move Down')}
                      disabled={idx === questions.length - 1 || busyAction}
                      onClick={() => handleMoveQuestion(idx, 1)}
                    >
                      ⬇️
                    </button>
                    <button
                      type="button"
                      className="btn small"
                      style={{ background: '#0284c7' }}
                      onClick={() => {
                        setEditingIndex(idx);
                        setAddingNew(false);
                      }}
                    >
                      ✏️ {tr(lang, 'تعديل', 'Edit')}
                    </button>
                    <button
                      type="button"
                      className="btn danger small"
                      disabled={questions.length <= 1 || busyAction}
                      onClick={() => handleDeleteQuestion(idx)}
                    >
                      🗑️ {tr(lang, 'حذف', 'Delete')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {(addingNew || editingIndex !== null) && (
        <QuestionEditorModal
          question={editingIndex !== null ? questions[editingIndex] : null}
          questionIndex={editingIndex}
          defaultLevel={levelFilter !== 'all' ? levelFilter : 'easy'}
          uid={effectiveUid}
          onClose={() => {
            setEditingIndex(null);
            setAddingNew(false);
          }}
          onSaved={() => {
            showToast(
              tr(
                lang,
                '✅ تم حفظ وتحديث أسئلة الاستبيان والاختبار لجميع الزوار بنجاح!',
                '✅ Saved & published survey/quiz questions live!'
              )
            );
          }}
        />
      )}
    </div>
  );
}
