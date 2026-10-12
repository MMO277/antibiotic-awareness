import { useState } from 'react';
import { useLang } from './i18n';

const FACTS: { ar: string; en: string }[] = [
  {
    ar: 'المضادات الحيوية لا تقتل الفيروسات. استخدامها لنزلات البرد أو الإنفلونزا لا يفيد وقد يضر.',
    en: 'Antibiotics do not kill viruses. Using them for colds or flu is ineffective and can cause harm.',
  },
  {
    ar: 'اكتشف ألكسندر فليمنج البنسلين عام 1928 بالصدفة، وهو أول مضاد حيوي في التاريخ.',
    en: 'Alexander Fleming discovered penicillin in 1928 by accident — it was the world\'s first antibiotic.',
  },
  {
    ar: 'إكمال دورة المضاد الحيوي كاملاً يمنع نمو بكتيريا مقاومة، حتى لو شعرت بالتحسن مبكرًا.',
    en: 'Completing a full antibiotic course prevents resistant bacteria from growing, even if you feel better early.',
  },
  {
    ar: 'الاستخدام المفرط للمضادات الحيوية في تربية الحيوانات يساهم في مشكلة المقاومة عالميًا.',
    en: 'Overuse of antibiotics in livestock farming contributes significantly to the global resistance problem.',
  },
  {
    ar: 'لا تحفظ المضادات الحيوية في الحمام أو بجانب مصدر حرارة — الرطوبة والحرارة تتلفها.',
    en: 'Do not store antibiotics in the bathroom or near heat — humidity and heat can break them down.',
  },
  {
    ar: 'بعض المضادات الحيوية تتفاعل مع منتجات الألبان أو الأطعمة وقد تقل فاعليتها. اقرأ التعليمات دائمًا.',
    en: 'Some antibiotics interact with dairy products or food and may lose effectiveness. Always read the instructions.',
  },
  {
    ar: 'مشاركة المضادات الحيوية مع شخص آخر ممارسة خطيرة — الجرعة ونوع البكتيريا يختلفان من شخص لآخر.',
    en: 'Sharing antibiotics with someone else is dangerous — the dose and type of bacteria differ from person to person.',
  },
  {
    ar: 'تُقدَّر وفيات المقاومة للمضادات الحيوية بأكثر من مليون حالة سنويًا حول العالم.',
    en: 'Deaths from antibiotic resistance are estimated at over one million cases annually worldwide.',
  },
  {
    ar: 'غسل اليدين بالصابون يقلل انتشار العدوى ويُقلل الحاجة للمضادات الحيوية.',
    en: 'Washing hands with soap reduces the spread of infection and lowers the need for antibiotics.',
  },
  {
    ar: 'يجب التخلص من بقايا المضادات الحيوية بإعادتها للصيدلية، لا برميها في القمامة أو صرف المياه.',
    en: 'Leftover antibiotics should be returned to a pharmacy for safe disposal, not thrown in the trash or flushed.',
  },
];

export default function DidYouKnow() {
  const { lang } = useLang();
  // Pick a random fact on first render, stays stable during the visit
  const [fact] = useState(() => FACTS[Math.floor(Math.random() * FACTS.length)]);

  return (
    <div className="dyk-card">
      <div className="dyk-icon" aria-hidden="true">💡</div>
      <div>
        <p className="dyk-label">{lang === 'ar' ? 'هل تعلم؟' : 'Did you know?'}</p>
        <p className="dyk-text">{lang === 'ar' ? fact.ar : fact.en}</p>
      </div>
    </div>
  );
}
