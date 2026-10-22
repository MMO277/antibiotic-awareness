# دمج التقييم القبلي والبعدي في Learn.tsx

في ملف `Learn.tsx` الحالي:

### 1. الاستيراد في أعلى الملف:
```tsx
import { PRE_ASSESSMENT_QUESTIONS, POST_ASSESSMENT_QUESTIONS } from './assessmentData';
import {
  markTopicStartedLocally,
  markTopicCompletedLocally,
  recordPreAssessment,
  recordPostAssessment,
  logLearningEvent
} from './assessmentWorkflow';
import { PrePostAssessmentModal } from './PrePostAssessmentModal';
```

### 2. إضافة حالات التقييم داخل المكون `Learn`:
```tsx
const [showPreModal, setShowPreModal] = useState(false);
const [showPostModal, setShowPostModal] = useState(false);
const [currentPreScore, setCurrentPreScore] = useState<number | null>(null);
```

### 3. تسجيل بدء الدرس عند فتح الخطوة:
```tsx
useEffect(() => {
  const currentStep = STEPS[idx];
  if (!currentStep) return;

  // تسجيل بدء الدرس بدون تكرار في الجلسة الحالية
  if (markTopicStartedLocally(currentStep.id)) {
    logLearningEvent('lesson_start', currentStep.id);
    // فتح التقييم القبلي الأولي
    setShowPreModal(true);
  }
}, [idx]);
```

### 4. عند الضغط على إتمام الوحدة التعليمية:
```tsx
const handleStepFinished = () => {
  const currentStep = STEPS[idx];
  if (markTopicCompletedLocally(currentStep.id)) {
    logLearningEvent('lesson_complete', currentStep.id);
  }
  // فتح التقييم البعدي
  setShowPostModal(true);
};
```

### 5. عرض النوافذ التفاعلية في نهاية الـ JSX:
```tsx
{showPreModal && (
  <PrePostAssessmentModal
    mode="pre"
    topicTitle={lang === 'ar' ? STEPS[idx].title.ar : STEPS[idx].title.en}
    questions={PRE_ASSESSMENT_QUESTIONS}
    onComplete={(score, total) => {
      setCurrentPreScore(score);
      recordPreAssessment(STEPS[idx].id, score, total);
      setShowPreModal(false);
    }}
    onCancel={() => setShowPreModal(false)}
  />
)}

{showPostModal && (
  <PrePostAssessmentModal
    mode="post"
    topicTitle={lang === 'ar' ? STEPS[idx].title.ar : STEPS[idx].title.en}
    questions={POST_ASSESSMENT_QUESTIONS}
    onComplete={(score, total) => {
      recordPostAssessment(STEPS[idx].id, score, total, currentPreScore ?? 0);
      setShowPostModal(false);
    }}
    onCancel={() => setShowPostModal(false)}
  />
)}
```
