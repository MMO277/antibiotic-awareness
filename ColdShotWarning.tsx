import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { Bi, pick, tr } from './types';
import Disclaimer from './Disclaimer';

interface ComponentBreakdown {
  id: 'antibiotic' | 'cortisone' | 'nsaid';
  icon: string;
  badgeColor: string;
  badgeBg: string;
  title: Bi;
  examples: Bi;
  whyPeopleTakeIt: Bi;
  whatActuallyHappens: Bi;
  organRisks: { icon: string; organ: Bi; impact: Bi }[];
}

const COLD_SHOT_COMPONENTS: ComponentBreakdown[] = [
  {
    id: 'antibiotic',
    icon: '💉',
    badgeColor: '#991b1b',
    badgeBg: '#fee2e2',
    title: {
      ar: 'المكون الأول: المضاد الحيوي (سيفترياكسون / سيفوتاكسيم 1 جم)',
      en: 'Component 1: Injectable Antibiotic (Ceftriaxone / Cefotaxime 1g)',
    },
    examples: {
      ar: 'مثل: سيفترياكسون، سيفاكسون، روسيفين، سيفوتاكس',
      en: 'e.g., Ceftriaxone, Cefaxone, Rocephin, Cefotax',
    },
    whyPeopleTakeIt: {
      ar: 'الاعتقاد الخاطئ أن المضاد الحيوي «يقضي على دور البرد بسرعة ويمنع نزوله على الصدر».',
      en: 'The misconception that an antibiotic injection "kills the cold fast and prevents chest infection."',
    },
    whatActuallyHappens: {
      ar: 'نزلات البرد والإنفلونزا عدوى فيروسية 100%، والمضاد الحيوي مصمم لقتل البكتيريا فقط ولا يؤثر إطلاقاً على الفيروسات! أخذ حقنة السيفترياكسون يعرض المريض لخطر الصدمة التحسسية القاتلة (Anaphylactic Shock) وتوقف عضلة القلب والتنفس خلال دقائق.',
      en: 'Colds and flu are 100% viral; antibiotics have ZERO effect on viruses! Injecting Ceftriaxone exposes the patient to fatal anaphylactic shock and cardiopulmonary arrest within minutes.',
    },
    organRisks: [
      {
        icon: '🫀',
        organ: { ar: 'القلب والجهاز التنفسي (صدمة تحسسية قاتلة)', en: 'Heart & Airway (Fatal Anaphylaxis)' },
        impact: {
          ar: 'انخفاض حاد ومفاجئ في ضغط الدم، اختناق وتورم الحنجرة، وقد يؤدي للوفاة الفورية حتى لو سبق للمريض أخذ الحقنة من قبل!',
          en: 'Sudden severe drop in blood pressure, laryngeal edema, and potential cardiac arrest within minutes—even if tolerated previously!',
        },
      },
      {
        icon: '🦠',
        organ: { ar: 'مناعة الجسم والبكتيريا المقاومة', en: 'Microbiome & Superbug Resistance' },
        impact: {
          ar: 'يقتل البكتيريا النافعة في الأمعاء ويخلق سلالات بكتيرية شرسة لا يستجيب لها المضاد الحيوي عندما يحتاجه المريض فعلاً في عدوى حقيقية.',
          en: 'Wipes out protective gut flora and breeds resistant bacteria that won’t respond when you truly need an antibiotic.',
        },
      },
    ],
  },
  {
    id: 'cortisone',
    icon: '⚠️',
    badgeColor: '#92400e',
    badgeBg: '#fef3c7',
    title: {
      ar: 'المكون الثاني: الكورتيزون (ديكساميثازون / بيتاميثازون أمبول)',
      en: 'Component 2: Corticosteroid (Dexamethasone / Betamethasone)',
    },
    examples: {
      ar: 'مثل: ديكساميثازون 8 مجم، ديكسافين، بيتافوس',
      en: 'e.g., Dexamethasone 8mg, Dexaphen, Betafos',
    },
    whyPeopleTakeIt: {
      ar: 'يعطي شعوراً خادعاً وسريعاً بـ«النشاط واختفاء التكسير» خلال ساعتين فيظن المريض أنه شُفي!',
      en: 'Gives a deceptive, temporary burst of energy and masks body aches for a few hours, tricking the patient into feeling cured!',
    },
    whatActuallyHappens: {
      ar: 'الكورتيزون يُثبط جهاز المناعة (Immunosuppression) في اللحظة التي يحتاج فيها جسمك لكل خلية مناعية لمحاربة فيروس البرد! النتيجة: يتكاثر الفيروس بشراسة أكبر وتطول مدة المرض أو تحدث مضاعفات رئوية حقيقية.',
      en: 'Corticosteroids suppress your immune response at the exact moment your body needs it to fight off the respiratory virus, prolonging viral shedding and increasing secondary infection risk.',
    },
    organRisks: [
      {
        icon: '🩸',
        organ: { ar: 'ارتفاع خطير في سكر الدم وضغط الدم', en: 'Severe Blood Sugar & Blood Pressure Spike' },
        impact: {
          ar: 'يرفع مستوى السكر في الدم بشكل حاد (قد يدخل مريض السكري في غيبوبة كيتونية) ويحبس الصوديوم والسوائل فيرفع ضغط الدم.',
          en: 'Triggers acute hyperglycemia (risking diabetic ketoacidosis in diabetics) and sodium/fluid retention that spikes blood pressure.',
        },
      },
      {
        icon: '🛡️',
        organ: { ar: 'إضعاف خط الدفاع المناعي', en: 'Immune System Suppression' },
        impact: {
          ar: 'يخفي أعراض الالتهاب مؤقتاً بينما ينتشر الفيروس أو الميكروب دون مقاومة طبيعية من الجسم.',
          en: 'Masks fever and inflammation while allowing the underlying infection to progress unchecked.',
        },
      },
    ],
  },
  {
    id: 'nsaid',
    icon: '🔥',
    badgeColor: '#7c2d12',
    badgeBg: '#ffedd5',
    title: {
      ar: 'المكون الثالث: المسكن القوي (ديكلوفيناك / كيتورولاك أمبول)',
      en: 'Component 3: Potent Injectable NSAID (Diclofenac / Ketorolac)',
    },
    examples: {
      ar: 'مثل: فولتارين، أولفين، ديكلوفين، كيتولاك',
      en: 'e.g., Voltaren, Olfen, Declophen, Ketolac',
    },
    whyPeopleTakeIt: {
      ar: 'لخفض الحرارة وتسكين صداع وتكسير الجسم بسرعة.',
      en: 'To rapidly drop fever and relieve severe headache and muscle aches.',
    },
    whatActuallyHappens: {
      ar: 'إعطاء مسكن غير ستيرويدي قوي بالحقن لمريض يعاني من الحمى وقلة شرب السوائل (جفاف نسبي) يقلل تدفق الدم للكلى بشكل حاد، ومع وجود الكورتيزون يرتفع خطر قرحة ونزيف المعدة الحاد إلى أضعاف مضاعفة!',
      en: 'Injecting potent NSAIDs in a febrile, mildly dehydrated patient constricts renal blood flow, and combining an NSAID with a corticosteroid multiplies the risk of acute gastrointestinal bleeding!',
    },
    organRisks: [
      {
        icon: '🫘',
        organ: { ar: 'الكلى (قصور وفشل كلوي حاد)', en: 'Kidneys (Acute Kidney Injury - AKI)' },
        impact: {
          ar: 'يغلق الشريان المغذي لكبيبات الكلى خاصة مع الجفاف والسخونة، وقد يسبب فشلاً كلوياً حاداً.',
          en: 'Inhibits renal prostaglandins, causing acute renal ischemia and potential kidney failure in dehydrated febrile patients.',
        },
      },
      {
        icon: '🫁',
        organ: { ar: 'المعدة والشعب الهوائية', en: 'Stomach & Bronchi (Ulcers & Asthma Attack)' },
        impact: {
          ar: 'الجمع بين المسكن والكورتيزون يدمر جدار المعدة ويسبب نزيفاً هضمياً، كما قد يسبب أزمة ربو حادة لمرضى حساسية الصدر.',
          en: 'Combining NSAIDs + Corticosteroids dramatically increases peptic ulcer bleeding and can trigger severe bronchospasm in asthmatics.',
        },
      },
    ],
  },
];

export default function ColdShotWarning() {
  const { lang } = useLang();
  const [activeCompId, setActiveCompId] = useState<'antibiotic' | 'cortisone' | 'nsaid'>('antibiotic');
  const [syringeMixed, setSyringeMixed] = useState<boolean>(false);

  const activeComp = COLD_SHOT_COMPONENTS.find((c) => c.id === activeCompId) || COLD_SHOT_COMPONENTS[0];

  return (
    <main className="wrap stack">
      {/* Urgent Warning Hero */}
      <section className="card cold-shot-hero">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <span className="badge" style={{ background: '#dc2626', color: '#ffffff', fontWeight: 800, marginBottom: '8px' }}>
              🚨 {tr(lang, 'تحذير رسمي عاجل من وزارة الصحة وهيئة الدواء المصرية', 'Urgent Official Warning • Egyptian Ministry of Health & EDA')}
            </span>
            <h1 style={{ margin: '4px 0 8px', color: '#991b1b' }}>
              {tr(
                lang,
                'حقيقة «حقنة البرد / الخلطة السحرية 3×1»: لماذا قد تتحول إلى حقنة قاتلة؟',
                'The 3-in-1 "Cold Shot" Mythbuster: Why the Cocktail Injection Can Be Fatal',
                'Le Mythe de « l’Injection Miracle 3-en-1 » contre le Rhume : Pourquoi est-elle Dangereuse ?',
                'El Mito de la «Inyección Mágica 3 en 1» para el Resfriado: ¿Por qué puede ser mortal?'
              )}
            </h1>
            <p className="muted" style={{ maxWidth: '75ch', margin: 0 }}>
              {tr(
                lang,
                'يطلب الكثيرون في مصر ما يُعرف شعبياً بـ«حقنة البرد» أو «الخلطة السحرية» (خليط من مضاد حيوي + كورتيزون + مسكن قوي) لعلاج نزلات البرد والإنفلونزا. استكشف علمياً وسريرياً ماذا يفعل كل مكون في جسمك ولماذا تسببت هذه الخلطة في حالات وفاة حقيقية.',
                'Across Egypt, many people ask pharmacies for the infamous "3-in-1 Cold Shot" (Antibiotic + Corticosteroid + Injectable NSAID) to treat viral colds. Explore the clinical science behind why each ingredient is harmful and why mixing them in one syringe can be fatal.',
                'Découvrez pourquoi le mélange d’un antibiotique, d’un corticoïde et d’un anti-inflammatoire injectable contre le rhume viral est une erreur médicale grave.',
                'Descubre por qué mezclar un antibiótico, un corticoide y un analgésico inyectable para un resfriado viral representa un grave peligro médico.'
              )}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/green-prescription" className="btn small" style={{ background: '#15803d' }}>
              🌿 {tr(lang, 'افتح بديل الروشتة الخضراء الآمنة', 'Open Safe Green Prescription')}
            </Link>
            <Link to="/allergy-checker" className="btn ghost small">
              🛡️ {tr(lang, 'فاحص الحساسية', 'Allergy Checker')}
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive 3-in-1 Component Explorer */}
      <section className="card">
        <h2 style={{ margin: '0 0 6px' }}>
          🔬 {tr(lang, 'تشريح «حقنة البرد 3×1»: اضغط على كل مكون لكشف خطورته', 'Deconstructing the 3-in-1 Cocktail: Click Each Component to Inspect')}
        </h2>
        <p className="small muted" style={{ margin: '0 0 14px' }}>
          {tr(
            lang,
            'تتكون الخلطة المتداولة عشوائياً من 3 أمبولات/فيالات دوائية خطيرة عند استخدامها بدون داعٍ طبي:',
            'The unapproved cold cocktail combines three potent injectable medications that carry severe risks when used for viral colds:'
          )}
        </p>

        {/* 3 Component Tabs */}
        <div className="cold-shot-tabs" role="tablist">
          {COLD_SHOT_COMPONENTS.map((comp, idx) => {
            const active = comp.id === activeCompId;
            return (
              <button
                key={comp.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`cold-shot-tab-btn${active ? ' active' : ''}`}
                onClick={() => setActiveCompId(comp.id)}
              >
                <span className="cold-tab-num">{idx + 1}</span>
                <span className="cold-tab-icon" aria-hidden="true">{comp.icon}</span>
                <span className="cold-tab-text">{pick(comp.title, lang)}</span>
              </button>
            );
          })}
        </div>

        {/* Active Component Detail Panel */}
        <div className="cold-shot-detail-panel" role="tabpanel">
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: activeComp.badgeColor }}>
              {activeComp.icon} {pick(activeComp.title, lang)}
            </h3>
            <span
              className="badge"
              style={{ background: activeComp.badgeBg, color: activeComp.badgeColor, fontWeight: 700 }}
            >
              {pick(activeComp.examples, lang)}
            </span>
          </div>

          <div className="cold-myth-vs-reality">
            <div className="cold-box myth">
              <b>❌ {tr(lang, 'الوهم الشائع (لماذا يطلبه الناس؟):', 'The Common Myth (Why People Ask For It):')}</b>
              <p className="small" style={{ margin: '6px 0 0' }}>{pick(activeComp.whyPeopleTakeIt, lang)}</p>
            </div>
            <div className="cold-box reality">
              <b>✅ {tr(lang, 'الحقيقة الطبية السريرية:', 'The Clinical Reality:')}</b>
              <p className="small" style={{ margin: '6px 0 0' }}>{pick(activeComp.whatActuallyHappens, lang)}</p>
            </div>
          </div>

          <h4 style={{ margin: '14px 0 8px' }}>
            🚨 {tr(lang, 'الأعضاء الحيوية المتضررة في جسمك:', 'Direct Organ Systems Put at Risk:')}
          </h4>
          <div className="grid" style={{ gap: '10px' }}>
            {activeComp.organRisks.map((risk, rIdx) => (
              <div key={rIdx} className="cold-organ-card">
                <span className="cold-organ-icon" aria-hidden="true">{risk.icon}</span>
                <div>
                  <b>{pick(risk.organ, lang)}</b>
                  <p className="small muted" style={{ margin: '4px 0 0' }}>{pick(risk.impact, lang)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Syringe Chemical Incompatibility Lab */}
      <section className="card highlight-card">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px' }}>
              🧪 {tr(lang, 'مختبر التنافر الكيميائي: ماذا يحدث عند خلط الـ 3 حقن في سرنجة واحدة؟', 'Pharmaceutical Incompatibility Lab: What Happens Inside the Mixed Syringe?')}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {tr(
                lang,
                'حتى لو افترضنا جدلاً حاجة مريض لأكثر من دواء، فإن سحبها وخلطها معاً في سرنجة واحدة يُعد خطأً صيدلانياً قاتلاً:',
                'Drawing Ceftriaxone, Dexamethasone, and Diclofenac into a single syringe causes dangerous physical and chemical incompatibility:'
              )}
            </p>
          </div>
          <button
            type="button"
            className="btn"
            style={{ background: syringeMixed ? '#475569' : '#dc2626' }}
            onClick={() => setSyringeMixed((v) => !v)}
          >
            {syringeMixed
              ? tr(lang, 'إعادة ضبط المحاكاة ↺', 'Reset Simulation ↺')
              : tr(lang, '🔬 اختبر ماذا يحدث عند خلط السرنجة!', '🔬 Simulate Mixing in One Syringe!')}
          </button>
        </div>

        <div className={`cold-syringe-sim ${syringeMixed ? 'is-mixed' : ''}`}>
          {!syringeMixed ? (
            <div className="cold-sim-before">
              <div className="cold-vial-item">
                <span>🧪 الفيال 1</span>
                <b>سيفترياكسون + مذيب ليدوكايين</b>
                <small>pH 6.0 – 8.0</small>
              </div>
              <span className="cold-plus">+</span>
              <div className="cold-vial-item">
                <span>🧪 الأمبول 2</span>
                <b>ديكساميثازون فوسفات</b>
                <small>pH 7.0 – 8.5</small>
              </div>
              <span className="cold-plus">+</span>
              <div className="cold-vial-item">
                <span>🧪 الأمبول 3</span>
                <b>ديكلوفيناك الصوديوم</b>
                <small>يحتوي بروبيلين جليكول</small>
              </div>
            </div>
          ) : (
            <div className="cold-sim-after">
              <div className="cold-sim-alert-head">
                <span style={{ fontSize: '1.8rem' }} aria-hidden="true">☣️</span>
                <div>
                  <b style={{ color: '#991b1b', fontSize: '1.05rem' }}>
                    {tr(lang, 'نتيجة الخلط الكيميائي داخل السرنجة: تنافر وترسيب وخطر سمية حادة!', 'Chemical Reaction Result: Precipitation, pH Shift & Acute Toxicity!')}
                  </b>
                  <p className="small" style={{ margin: '2px 0 0' }}>
                    {tr(
                      lang,
                      'هذا ما يحدث فور سحب الأدوية الثلاثة في سرنجة واحدة قبل حقنها في جسم المريض:',
                      'Here is what happens the moment these three compounds meet inside a single barrel:'
                    )}
                  </p>
                </div>
              </div>

              <div className="grid" style={{ gap: '10px', marginTop: '10px' }}>
                <div className="cold-reaction-box">
                  <b>1. 💎 ترسب بلورات مجهرية غير مرئية (Micro-Precipitation)</b>
                  <p className="small">
                    {tr(
                      lang,
                      'اختلاف درجة الحموضة (pH) والمواد الحافظة بين الديكلوفيناك والسيفترياكسون والديكساميثازون يؤدي لتكون راسب بلوري دقيق يسد الشعيرات الدموية ويسبب تلفاً نسيجياً أو جلطة ميكروبية.',
                      'Incompatible pH and cosolvents (propylene glycol/benzyl alcohol) trigger microscopic crystal precipitation that damages tissue and capillaries.'
                    )}
                  </p>
                </div>
                <div className="cold-reaction-box">
                  <b>2. ❤️‍🔥 سمية الليدوكايين الوريدية (Lidocaine Cardiotoxicity)</b>
                  <p className="small">
                    {tr(
                      lang,
                      'مذيب السيفترياكسون العضلي يحتوي على مخدر «ليدوكايين»؛ وعند خلطه وإعطائه بالخطأ في الوريد يسبب اضطراباً قاتلاً في كهرباء القلب وتوقف النبض فوراً!',
                      'IM Ceftriaxone solvent contains Lidocaine; if the mixed cocktail is injected IV or enters a blood vessel, it causes fatal cardiac arrhythmias!'
                    )}
                  </p>
                </div>
                <div className="cold-reaction-box">
                  <b>3. ⚡ صدمة تحسسية مركبة (Compound Anaphylaxis)</b>
                  <p className="small">
                    {tr(
                      lang,
                      'وجود المسكن (ديكلوفيناك) مع المضاد الحيوي (سيفترياكسون) يضاعف إفراز الهستامين واللوكوترايينات، ولا يستطيع أمبول الكورتيزون المخلوط منع الصدمة لأن مفعوله يحتاج ساعات ليبدأ بينما الصدمة تقتل في 5 دقائق!',
                      'Co-injecting an NSAID + Cephalosporin amplifies histamine/leukotriene release, and Dexamethasone takes hours to work—so it CANNOT stop an acute 5-minute anaphylactic shock!'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Safe Alternatives & What to Do Instead */}
      <section className="card" style={{ borderTop: '4px solid #15803d' }}>
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#15803d' }}>
              🌿 {tr(lang, 'البديل الطبي الآمن والمعتمد لعلاج نزلات البرد والإنفلونزا', 'Safe, Evidence-Based Protocol for Colds & Flu')}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {tr(
                lang,
                'بدلاً من المغامرة بحياتك بـ«حقنة البرد»، إليك البروتوكول الآمن المعتمد من منظمة الصحة العالمية وهيئة الدواء المصرية:',
                'Instead of risking your life with an unapproved injection cocktail, follow the WHO & EDA safe symptomatic protocol:'
              )}
            </p>
          </div>
          <Link to="/green-prescription" className="btn small" style={{ background: '#15803d' }}>
            🌿 {tr(lang, 'اصنع روشتتك الخضراء الآمنة الآن ←', 'Generate Your Green Prescription →')}
          </Link>
        </div>

        <div className="grid" style={{ gap: '12px' }}>
          <div className="safe-cold-step">
            <span className="safe-step-icon" aria-hidden="true">💊</span>
            <div>
              <b>{tr(lang, '1. خافض حرارة ومسكن آمن (باراسيتامول)', '1. Safe Antipyretic (Paracetamol)')}</b>
              <p className="small muted">
                {tr(
                  lang,
                  'أقراص الباراسيتامول الفموية كافية تماماً وآمنة على المعدة والكلى لخفض الحرارة وتسكين الصداع وتكسير الجسم.',
                  'Oral Paracetamol safely relieves fever, headache, and body aches without harming your kidneys or stomach.'
                )}
              </p>
            </div>
          </div>

          <div className="safe-cold-step">
            <span className="safe-step-icon" aria-hidden="true">💧</span>
            <div>
              <b>{tr(lang, '2. بخاخ محلول ملحي للأنف وسوائل دافئة', '2. Saline Nasal Spray & Warm Hydration')}</b>
              <p className="small muted">
                {tr(
                  lang,
                  'غسيل الأنف بمحلول الملح يفتح مجرى التنفس ويطرد الفيروسات، مع شرب اليانسون والنعناع والليمون الدافئ بالعسل (لمن هم فوق سنة).',
                  'Isotonic saline spray clears nasal congestion naturally, paired with warm fluids and honey (for ages > 1 year).'
                )}
              </p>
            </div>
          </div>

          <div className="safe-cold-step">
            <span className="safe-step-icon" aria-hidden="true">🩺</span>
            <div>
              <b>{tr(lang, '3. متى تزور الطبيب فعلاً؟ (علامات الخطر)', '3. When Should You See a Doctor? (Red Flags)')}</b>
              <p className="small muted">
                {tr(
                  lang,
                  'إذا استمرت الحرارة المرتفعة لأكثر من 3–4 أيام دون تحسن، أو حدث ضيق في التنفس، أو نهجان، أو ألم شديد بالأذن؛ حينها يفحصك الطبيب ويكتب العلاج المناسب.',
                  'Seek medical evaluation if high fever persists >3–4 days, or if shortness of breath, chest pain, or severe earache develops.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
