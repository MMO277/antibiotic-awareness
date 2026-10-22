# دمج تبويب لوحة الأثر في Dashboard.tsx

في ملف `Dashboard.tsx` الحالي:

### 1. استيراد المكون الجديد في أعلى الملف:
```tsx
import { LearningImpactDashboard } from './LearningImpactDashboard';
```

### 2. تعديل نوع الحالة (Tab state) لإضافة تبويب 'impact':
```tsx
// استبدل السطر:
// const [tab, setTab] = useState<'meds' | 'research' | 'users'>('meds');
// بالسطر التالي:
const [tab, setTab] = useState<'meds' | 'research' | 'users' | 'impact'>('meds');
```

### 3. إضافة زر التبويب للمديرين في شريط `<div className="tabs" role="tablist">`:
```tsx
{role === 'admin' && (
  <button
    role="tab"
    aria-selected={tab === 'impact'}
    className={tab === 'impact' ? 'tab-btn active' : 'tab-btn'}
    onClick={() => setTab('impact')}
  >
    📊 {lang === 'ar' ? 'قياس الأثر والتعلم' : 'Learning Impact'}
  </button>
)}
```

### 4. عرض المكون في منطقة المحتوى:
```tsx
{tab === 'impact' && role === 'admin' && <LearningImpactDashboard />}
```
