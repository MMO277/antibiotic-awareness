import { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n';

interface Stat {
  value: number;
  unit: { ar: string; en: string };
  label: { ar: string; en: string };
  source: { ar: string; en: string };
}

const STATS: Stat[] = [
  {
    value: 1270000,
    unit: { ar: 'حالة', en: 'deaths' },
    label: {
      ar: 'وفاة سنويًا مباشرةً بسبب مقاومة المضادات الحيوية',
      en: 'deaths every year directly caused by antibiotic resistance',
    },
    source: { ar: 'المصدر: The Lancet, 2022', en: 'Source: The Lancet, 2022' },
  },
  {
    value: 4950000,
    unit: { ar: 'حالة', en: 'deaths' },
    label: {
      ar: 'وفاة سنويًا مرتبطة بعدوى مقاومة للمضادات الحيوية',
      en: 'deaths per year associated with antibiotic-resistant infections',
    },
    source: { ar: 'المصدر: The Lancet, 2022', en: 'Source: The Lancet, 2022' },
  },
  {
    value: 70,
    unit: { ar: '%', en: '%' },
    label: {
      ar: 'من الوفيات الناجمة عن المقاومة تحدث في البلدان المنخفضة والمتوسطة الدخل',
      en: 'of resistance-related deaths occur in low- and middle-income countries',
    },
    source: { ar: 'المصدر: منظمة الصحة العالمية', en: 'Source: WHO' },
  },
];

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return count;
}

function Counter({ stat, lang }: { stat: Stat; lang: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(stat.value, 1800, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const formatted = count.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');

  return (
    <div ref={ref} className="rc-stat">
      <div className="rc-number">
        {formatted}
        <span className="rc-unit">{lang === 'ar' ? stat.unit.ar : stat.unit.en}</span>
      </div>
      <p className="rc-label">{lang === 'ar' ? stat.label.ar : stat.label.en}</p>
      <p className="rc-source">{lang === 'ar' ? stat.source.ar : stat.source.en}</p>
    </div>
  );
}

export default function ResistanceCounter() {
  const { lang } = useLang();
  return (
    <section className="rc-section">
      <h2 className="rc-title">
        {lang === 'ar'
          ? '🦠 مقاومة المضادات الحيوية — أرقام حقيقية'
          : '🦠 Antibiotic Resistance — Real Numbers'}
      </h2>
      <p className="rc-sub">
        {lang === 'ar'
          ? 'المقاومة ليست مشكلة مستقبلية — إنها تحدث الآن'
          : 'Resistance is not a future problem — it is happening now'}
      </p>
      <div className="rc-grid">
        {STATS.map((s, i) => (
          <Counter key={i} stat={s} lang={lang} />
        ))}
      </div>
    </section>
  );
}
