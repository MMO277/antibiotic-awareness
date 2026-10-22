import { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n';
import { Bi, Lang, pick, tr } from './types';

interface Stat {
  value: number;
  unit: Bi;
  label: Bi;
  source: Bi;
}

const STATS: Stat[] = [
  {
    value: 1270000,
    unit: { ar: 'حالة', en: 'deaths', fr: 'décès', es: 'muertes' },
    label: {
      ar: 'وفاة سنويًا مباشرةً بسبب مقاومة المضادات الحيوية',
      en: 'deaths every year directly caused by antibiotic resistance',
      fr: 'décès par an directement causés par l’antibiorésistance',
      es: 'muertes al año causadas directamente por la resistencia a los antibióticos',
    },
    source: {
      ar: 'المصدر: The Lancet, 2022',
      en: 'Source: The Lancet, 2022',
      fr: 'Source : The Lancet, 2022',
      es: 'Fuente: The Lancet, 2022',
    },
  },
  {
    value: 4950000,
    unit: { ar: 'حالة', en: 'deaths', fr: 'décès', es: 'muertes' },
    label: {
      ar: 'وفاة سنويًا مرتبطة بعدوى مقاومة للمضادات الحيوية',
      en: 'deaths per year associated with antibiotic-resistant infections',
      fr: 'décès par an associés à des infections résistantes aux antibiotiques',
      es: 'muertes al año asociadas con infecciones resistentes a los antibióticos',
    },
    source: {
      ar: 'المصدر: The Lancet, 2022',
      en: 'Source: The Lancet, 2022',
      fr: 'Source : The Lancet, 2022',
      es: 'Fuente: The Lancet, 2022',
    },
  },
  {
    value: 70,
    unit: { ar: '%', en: '%', fr: '%', es: '%' },
    label: {
      ar: 'من الوفيات الناجمة عن المقاومة تحدث في البلدان المنخفضة والمتوسطة الدخل',
      en: 'of resistance-related deaths occur in low- and middle-income countries',
      fr: 'des décès liés à la résistance surviennent dans les pays à revenu faible ou intermédiaire',
      es: 'de las muertes relacionadas con la resistencia ocurren en países de ingresos bajos y medios',
    },
    source: {
      ar: 'المصدر: منظمة الصحة العالمية',
      en: 'Source: WHO',
      fr: 'Source : OMS (WHO)',
      es: 'Fuente: OMS (WHO)',
    },
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
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return count;
}

function Counter({ stat, lang }: { stat: Stat; lang: Lang }) {
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

  const localeMap: Record<Lang, string> = {
    ar: 'ar-EG',
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
  };
  const formatted = count.toLocaleString(localeMap[lang] || 'en-US');

  return (
    <div ref={ref} className="rc-stat">
      <div className="rc-number">
        {formatted}
        <span className="rc-unit">{pick(stat.unit, lang)}</span>
      </div>
      <p className="rc-label">{pick(stat.label, lang)}</p>
      <p className="rc-source">{pick(stat.source, lang)}</p>
    </div>
  );
}

export default function ResistanceCounter() {
  const { lang } = useLang();
  return (
    <section className="rc-section">
      <h2 className="rc-title">
        {tr(
          lang,
          '🦠 مقاومة المضادات الحيوية — أرقام حقيقية',
          '🦠 Antibiotic Resistance — Real Numbers',
          '🦠 Antibiorésistance — Chiffres Mondiaux Réels',
          '🦠 Resistencia a los Antibióticos — Cifras Reales'
        )}
      </h2>
      <p className="rc-sub">
        {tr(
          lang,
          'المقاومة ليست مشكلة مستقبلية — إنها تحدث الآن',
          'Resistance is not a future problem — it is happening now',
          'La résistance n’est pas un problème futur — elle agit dès maintenant',
          'La resistencia no es un problema del futuro: está ocurriendo ahora'
        )}
      </p>
      <div className="rc-grid">
        {STATS.map((s, i) => (
          <Counter key={i} stat={s} lang={lang} />
        ))}
      </div>
    </section>
  );
}
