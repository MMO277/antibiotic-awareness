import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { Bi, pick, tr } from './types';
import Disclaimer from './Disclaimer';

interface CocktailComponent {
  id: 'antibiotic' | 'steroid' | 'nsaid';
  icon: string;
  title: Bi;
  typicalDrug: Bi;
  myth: Bi;
  reality: Bi;
  organHarm: Bi;
}

const b = (ar: string, en: string, fr: string, es: string, de: string): Bi => ({
  ar,
  en,
  fr,
  es,
  de,
});

const COCKTAIL_PARTS: CocktailComponent[] = [
  {
    id: 'antibiotic',
    icon: '🧪',
    title: b(
      'المكون الأول: مضاد حيوي وريدي/عضلي (جيل ثالث)',
      'Component 1: Injectable 3rd-Gen Cephalosporin Antibiotic',
      'Composant 1 : Antibiotique Céphalosporine 3G Injectable',
      'Componente 1: Antibiótico Cefalosporina 3G Inyectable',
      'Komponente 1: Injizierbares Drittgenerations-Cephalosporin (Antibiotikum)'
    ),
    typicalDrug: b(
      'سيفترياكسون (Ceftriaxone 1g) أو سيفوتاكسيم (Cefotaxime 1g)',
      'Ceftriaxone 1g or Cefotaxime 1g Vial',
      'Ceftriaxone 1g ou Céfotaxime 1g injectable',
      'Ceftriaxona 1g o Cefotaxima 1g inyectable',
      'Ceftriaxon 1 g oder Cefotaxim 1 g Injektionsflasche'
    ),
    myth: b(
      'الخرافة: «الحقنة هتقضي على دور البرد والإنفلونزا في ساعتين!»',
      'Myth: "A strong antibiotic injection will knock out a severe cold or flu in hours!"',
      'Mythe : « Une injection d’antibiotique fort guérira le rhume ou la grippe en quelques heures ! »',
      'Mito: «¡Una inyección fuerte de antibiótico curará el resfriado o la gripe en horas!»',
      'Mythos: „Eine starke Antibiotika-Spritze beseitigt eine schwere Erkältung oder Grippe in wenigen Stunden!“'
    ),
    reality: b(
      'الحقيقة العلمية: نزلات البرد والإنفلونزا فيروسية 100%، والمضاد الحيوي لا يؤثر في الفيروسات إطلاقاً بل قد يسبب صدمة تحسسية قاتلة (Anaphylaxis) وتوقف القلب في دقائق.',
      'Clinical Reality: Colds and influenza are 100% viral. Ceftriaxone has zero effect on viruses, carries a high risk of fatal anaphylactic shock, and breeds resistant superbugs.',
      'Réalité clinique : Le rhume et la grippe sont 100 % viraux. La ceftriaxone est inutile et expose à un choc anaphylactique mortel.',
      'Realidad clínica: El resfriado y la gripe son 100 % virales. La ceftriaxona no tiene efecto sobre virus y puede causar shock anafiláctico mortal.',
      'Klinische Realität: Erkältungen und Grippe sind zu 100 % viral. Ceftriaxon wirkt nicht gegen Viren, birgt das Risiko eines tödlichen anaphylaktischen Schocks und fördert multiresistente Keime.'
    ),
    organHarm: b(
      'صدمة تحسسية مفرطة قاتلة، ترسبات بلورية في المرارة والكلى، وتدمير البكتيريا النافعة.',
      'Fatal IgE anaphylaxis, biliary sludge/renal calcium precipitation, and severe C. difficile colitis.',
      'Anaphylaxie mortelle, précipitation biliaire/rénale et colite à C. difficile.',
      'Anafilaxia mortal, precipitación biliar/renal y colitis por C. difficile.',
      'Lebensbedrohliche Anaphylaxie, biliäre/renale Ausfällungen und schwere C.-difficile-Kolitis.'
    ),
  },
  {
    id: 'steroid',
    icon: '⚠️',
    title: b(
      'المكون الثاني: كورتيزون حقن قوي المفعول',
      'Component 2: High-Potency Systemic Corticosteroid',
      'Composant 2 : Corticoïde Systémique Puissant Injectable',
      'Componente 2: Corticoesteroide Sistémico Potente Inyectable',
      'Komponente 2: Hochpotentes systemisches Kortikosteroid'
    ),
    typicalDrug: b(
      'ديكساميثازون (Dexamethasone 8mg) أو بيتاميثازون',
      'Dexamethasone 8mg Ampoule',
      'Dexaméthasone 8 mg en ampoule',
      'Dexametasona 8 mg en ampolla',
      'Dexamethason 8 mg Ampulle'
    ),
    myth: b(
      'الخرافة: «الكورتيزون بيصحصح الجسم ويفك التكسير فوراً بدون ضرر!»',
      'Myth: "Steroids give instant energy and relief with no downside!"',
      'Mythe : « La cortisone redonne de l’énergie immédiatement sans danger ! »',
      'Mito: «¡El corticoide quita el malestar al instante sin ningún riesgo!»',
      'Mythos: „Kortison gibt sofort Energie und lindert Gliederschmerzen ohne Nebenwirkungen!“'
    ),
    reality: b(
      'الحقيقة العلمية: الكورتيزون يثبط جهاز المناعة الذي يحارب الفيروس، فيسمح للفيروس بالتكاثر الشرس ويرفع سكر الدم وضغط الدم بشكل خطير.',
      'Clinical Reality: Systemic steroids suppress the immune response needed to clear respiratory viruses, while spiking blood glucose and blood pressure dangerously.',
      'Réalité clinique : Les corticoïdes affaiblissent l’immunité face au virus et provoquent une hausse brutale de la glycémie et de la tension.',
      'Realidad clínica: Los corticoides suprimen la inmunidad frente al virus y disparan peligrosamente la glucosa y la presión arterial.',
      'Klinische Realität: Systemische Kortikosteroide unterdrücken die für die Virusabwehr notwendige Immunantwort und lassen Blutzucker sowie Blutdruck gefährlich ansteigen.'
    ),
    organHarm: b(
      'تثبيط المناعة وتفاقم العدوى، ارتفاع حاد في السكر والضغط، ونزيف أو قرحة المعدة.',
      'Immune suppression, hyperglycemic crisis in diabetics, hypertensive spikes, and GI ulceration.',
      'Immunosuppression, crise d’hyperglycémie, poussée hypertensive et ulcère gastrique.',
      'Inmunosupresión, crisis hiperglucémica, pico hipertensivo y úlcera gástrica.',
      'Immunsuppression, hyperglykämische Entgleisung, Blutdruckkrisen und Magenulzera.'
    ),
  },
  {
    id: 'nsaid',
    icon: '🔥',
    title: b(
      'المكون الثالث: مسكن ومضاد التهاب غير ستيرويدي حقن',
      'Component 3: Injectable Non-Steroidal Anti-Inflammatory (NSAID)',
      'Composant 3 : Anti-Inflammatoire Non Stéroïdien (AINS) Injectable',
      'Componente 3: Antiinflamatorio No Esteroideo (AINE) Inyectable',
      'Komponente 3: Injizierbares nichtsteroidales Antirheumatikum (NSAR)'
    ),
    typicalDrug: b(
      'ديكلوفيناك الصوديوم (Diclofenac 75mg) أو كيتورولاك',
      'Diclofenac 75mg or Ketorolac Ampoule',
      'Diclofénac 75 mg ou Kétorolac en ampoule',
      'Diclofenaco 75 mg o Ketorolaco en ampolla',
      'Diclofenac 75 mg oder Ketorolac Ampulle'
    ),
    myth: b(
      'الخرافة: «خلط المسكن مع الكورتيزون والمضاد في سرنجة واحدة يوفر شكة إبرة!»',
      'Myth: "Mixing the painkiller, steroid, and antibiotic in one syringe saves a needle prick!"',
      'Mythe : « Mélanger l’anti-douleur, le corticoïde et l’antibiotique dans une seule seringue évite plusieurs piqûres ! »',
      'Mito: «¡Mezclar el analgésico, corticoide y antibiótico en una sola jeringa ahorra pinchazos!»',
      'Mythos: „Das Mischen von Schmerzmittel, Kortison und Antibiotikum in einer Spritze spart Einstiche!“'
    ),
    reality: b(
      'الحقيقة العلمية: الجمع بين حقن الديكلوفيناك والكورتيزون مع الجفاف الناتج عن الحمى يضاعف خطر الفشل الكلوي الحاد ونزيف المعدة والتفاعل الكيميائي داخل السرنجة.',
      'Clinical Reality: Combining injectable NSAIDs with steroids in a dehydrated febrile patient drastically increases acute kidney injury (AKI), GI bleeding, and chemical precipitation in the syringe.',
      'Réalité clinique : Associer AINS injectable et corticoïde chez un patient fébrile multiplie le risque d’insuffisance rénale aiguë et d’hémorragie digestive.',
      'Realidad clínica: Combinar AINE inyectable y corticoide en un paciente febril multiplica el riesgo de insuficiencia renal aguda y hemorragia digestiva.',
      'Klinische Realität: Die Kombination von injizierbaren NSAR und Kortikosteroiden bei fieberhaften, dehydrierten Patienten erhöht das Risiko für akutes Nierenversagen, Magenblutungen und chemische Ausfällungen drastisch.'
    ),
    organHarm: b(
      'قصور وفشل كلوي حاد، قرحة ونزيف معدي معوي، وارتفاع خطر الجلطات القلبية.',
      'Acute kidney injury (AKI), severe gastrointestinal hemorrhage, and cardiovascular toxicity.',
      'Insuffisance rénale aiguë, hémorragie gastro-intestinale et risques cardiovasculaires.',
      'Lesión renal aguda, hemorragia gastrointestinal grave y riesgo cardiovascular.',
      'Akutes Nierenversagen (ANV), schwere Magen-Darm-Blutungen und kardiovaskuläre Risiken.'
    ),
  },
];

export default function ColdShotWarning() {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<'antibiotic' | 'steroid' | 'nsaid'>('antibiotic');
  const [isMixed, setIsMixed] = useState(false);

  const currentComp = COCKTAIL_PARTS.find((c) => c.id === activeTab) || COCKTAIL_PARTS[0];

  return (
    <main className="wrap stack">
      <section className="card cold-shot-hero">
        <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 800, marginBottom: '8px' }}>
          🚨 {tr(lang, 'تحذير رسمي من هيئة الدواء المصرية ووزارة الصحة', 'Official Patient Safety Alert • EDA & MoHP Warning')}
        </span>
        <h1 style={{ margin: '0 0 6px', color: '#dc2626' }}>
          💉 {tr(lang, 'حقيقة «حقنة البرد / الخلطة السحرية 3×1» ولماذا قد تكون قاتلة', 'The 3-in-1 "Cold Shot" Cocktail: Why It Can Be Fatal')}
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr(
            lang,
            'تُحذّر هيئة الدواء المصرية ومنظمة الصحة العالمية من خلط المضاد الحيوي + الكورتيزون + المسكن لعلاج نزلات البرد والإنفلونزا الفيروسية.',
            'Clinical breakdown and interactive laboratory simulation explaining why mixing Ceftriaxone, Dexamethasone, and Diclofenac for viral colds is life-threatening.'
          )}
        </p>
      </section>

      <section className="card stack">
        <h2 style={{ margin: 0 }}>
          🔍 {tr(lang, 'تشريح مكونات «حقنة البرد الثلاثية» ومخاطر كل أمبول:', 'Inside the 3-in-1 Cold Shot: Inspect Each Component:')}
        </h2>

        <div className="cold-shot-tabs" role="tablist">
          {COCKTAIL_PARTS.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={activeTab === c.id}
              className={`cold-shot-tab-btn ${activeTab === c.id ? 'active' : ''}`}
              onClick={() => setActiveTab(c.id)}
            >
              <span className="cold-tab-num">{idx + 1}</span>
              <span>{pick(c.title, lang)}</span>
            </button>
          ))}
        </div>

        <div className="cold-shot-detail-panel stack">
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>
              {currentComp.icon} {pick(currentComp.typicalDrug, lang)}
            </h3>
          </div>

          <div className="cold-myth-vs-reality">
            <div className="cold-box myth">
              <b>❌ {pick(currentComp.myth, lang)}</b>
            </div>
            <div className="cold-box reality">
              <b>✅ {pick(currentComp.reality, lang)}</b>
            </div>
          </div>

          <div className="cold-organ-card">
            <span className="cold-organ-icon" aria-hidden="true">🫀</span>
            <div>
              <b>{tr(lang, 'الأثر السريري المباشر على أعضاء الجسم:', 'Direct Clinical Organ Toxicity:')}</b>
              <p className="small" style={{ margin: '4px 0 0' }}>{pick(currentComp.organHarm, lang)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Syringe Mixing Hazard Simulator */}
      <section className="card stack">
        <h2 style={{ margin: 0 }}>
          🧪 {tr(lang, 'مختبر المحاكاة: ماذا يحدث عند خلط الأمبولات الثلاثة في سرنجة واحدة؟', 'Interactive Lab: What Happens When All 3 Vials Are Mixed in One Syringe?')}
        </h2>

        <div className={`cold-syringe-sim ${isMixed ? 'is-mixed' : ''}`}>
          {!isMixed ? (
            <div className="stack" style={{ alignItems: 'center' }}>
              <div className="cold-sim-before" style={{ width: '100%' }}>
                <div className="cold-vial-item">
                  <span style={{ fontSize: '1.8rem' }}>🧪</span>
                  <b>Ceftriaxone 1g</b>
                  <span className="small muted">{tr(lang, 'مضاد حيوي', 'Antibiotic')}</span>
                </div>
                <span className="cold-plus">+</span>
                <div className="cold-vial-item">
                  <span style={{ fontSize: '1.8rem' }}>💉</span>
                  <b>Dexamethasone 8mg</b>
                  <span className="small muted">{tr(lang, 'كورتيزون', 'Corticosteroid')}</span>
                </div>
                <span className="cold-plus">+</span>
                <div className="cold-vial-item">
                  <span style={{ fontSize: '1.8rem' }}>🔥</span>
                  <b>Diclofenac 75mg</b>
                  <span className="small muted">{tr(lang, 'مسكن NSAID', 'NSAID Painkiller')}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn danger"
                onClick={() => setIsMixed(true)}
              >
                ⚠️ {tr(lang, 'شغّل محاكاة الخلط الكيميائي والفسيولوجي', 'Simulate Syringe Mixing & Physiological Reaction')}
              </button>
            </div>
          ) : (
            <div className="stack">
              <div className="cold-sim-alert-head">
                <span style={{ fontSize: '2.2rem' }}>🚨</span>
                <div>
                  <h3 style={{ margin: 0, color: '#dc2626' }}>
                    {tr(lang, 'خطر دوائي جسيم: عدم توافق كيميائي وفيزيائي وتسمم متضاعف!', 'CRITICAL HAZARD: Physical-Chemical Incompatibility & Synergistic Organ Toxicity!')}
                  </h3>
                  <p className="small muted" style={{ margin: 0 }}>
                    {tr(lang, 'نتيجة خلط المواد الثلاث في سرنجة واحدة وإعطائها لمريض مصاب بعدوى فيروسية:', 'Clinical outcome of mixing all three agents in a single syringe for a viral infection:')}
                  </p>
                </div>
              </div>

              <div className="grid">
                <div className="cold-reaction-box">
                  <b>1. {tr(lang, 'ترسّب وتفاعل كيميائي بالسرنجة', 'Chemical Precipitation in Syringe')}</b>
                  <p className="small">
                    {tr(
                      lang,
                      'اختلاف درجة الحموضة (pH) بين ديكلوفيناك وديكساميثازون وسيفترياكسون يؤدي لتكوّن شوائب بلورية غير مرئية قد تسد الشعيرات الدموية.',
                      'Incompatible pH profiles between Diclofenac, Dexamethasone, and Ceftriaxone cause micro-crystalline precipitation and altered drug stability.'
                    )}
                  </p>
                </div>
                <div className="cold-reaction-box">
                  <b>2. {tr(lang, 'صدمة تحسسية قاتلة بدون اختبار', 'Unscreened Fatal Anaphylaxis')}</b>
                  <p className="small">
                    {tr(
                      lang,
                      'حقن السيفترياكسون سريعاً خارج المستشفى قد يسبب توقف التنفس وهبوط الدورة الدموية الحاد في دقائق.',
                      'Administering injectable Ceftriaxone outside a hospital setting can trigger acute airway edema and fatal cardiovascular collapse within minutes.'
                    )}
                  </p>
                </div>
                <div className="cold-reaction-box">
                  <b>3. {tr(lang, 'ضربة مزدوجة للكلى والمعدة والمناعة', 'Triple Hit to Kidneys, Stomach & Immunity')}</b>
                  <p className="small">
                    {tr(
                      lang,
                      'الكورتيزون + المسكن معاً يضاعفان خطر نزيف المعدة والفشل الكلوي الحاد بينما يظل الفيروس نشطاً بلا علاج.',
                      'Co-administering high-dose steroid + injectable NSAID multiplies GI bleeding and acute kidney injury risk while leaving the cold virus untreated.'
                    )}
                  </p>
                </div>
              </div>

              <div className="row wrapRow" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn ghost small" onClick={() => setIsMixed(false)}>
                  🔄 {tr(lang, 'إعادة ضبط المحاكاة', 'Reset Simulation')}
                </button>
                <Link to="/green-prescription" className="btn" style={{ background: '#16a34a' }}>
                  🌿 {tr(lang, 'احصل على الروشتة الخضرا الآمنة للبرد ←', 'Get Safe Green Prescription for Colds →')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Disclaimer />
    </main>
  );
}
