import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { ALL_LOCAL_MEDICINES } from './medicinesApi';
import { pick, TextField } from './types';
import {
  ACTIVE_INGREDIENTS,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
} from './egyptianDrugDatabase';

type CompareMode = 'packages' | 'ingredients';

const CLINICAL_ROWS: { field: TextField; icon: string; labelAr: string; labelEn: string }[] = [
  { field: 'drugClass', icon: '🏷️', labelAr: 'الفئة الدوائية', labelEn: 'Pharmacological Class' },
  { field: 'activeIngredients', icon: '🧪', labelAr: 'المادة الفعالة', labelEn: 'Active Ingredient' },
  { field: 'priceEgypt', icon: '💰', labelAr: 'الأسعار في مصر', labelEn: 'Prices in Egypt (EGP)' },
  { field: 'substitutes', icon: '🔄', labelAr: 'البدائل المتاحة', labelEn: 'Available Substitutes' },
  { field: 'approvedUses', icon: '✅', labelAr: 'دواعي الاستعمال المعتمدة', labelEn: 'Approved Indications' },
  { field: 'strengths', icon: '💊', labelAr: 'التراكيز والأشكال الصيدلانية', labelEn: 'Strengths & Forms' },
  { field: 'dosingReference', icon: '📏', labelAr: 'مرجع الجرعات', labelEn: 'Dosing Reference' },
  { field: 'pregnancyBreastfeeding', icon: '🤰', labelAr: 'الحمل والرضاعة', labelEn: 'Pregnancy & Lactation' },
  { field: 'renalHepatic', icon: '🫘', labelAr: 'تعديل الكلى والكبد', labelEn: 'Renal & Hepatic Adjustment' },
  { field: 'contraindications', icon: '🚫', labelAr: 'موانع الاستعمال', labelEn: 'Contraindications' },
  { field: 'sideEffects', icon: '⚠️', labelAr: 'الآثار الجانبية', labelEn: 'Side Effects' },
  { field: 'interactions', icon: '⚡', labelAr: 'التداخلات الدوائية والغذائية', labelEn: 'Interactions' },
];

export default function CompareDrugs() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const [mode, setMode] = useState<CompareMode>('packages');

  // Commercial Package comparison state
  const [pkgIdA, setPkgIdA] = useState<string>('EG-ABX-001'); // Augmentin 1g
  const [pkgIdB, setPkgIdB] = useState<string>('EG-ABX-008'); // Hibiotic 1g

  // Clinical Active Ingredient comparison state
  const [medIdA, setMedIdA] = useState<string>('amoxicillin-clavulanic-acid');
  const [medIdB, setMedIdB] = useState<string>('azithromycin');

  const pkgA = useMemo(
    () => EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.productId === pkgIdA) || EGYPTIAN_COMMERCIAL_PRODUCTS[0],
    [pkgIdA]
  );
  const pkgB = useMemo(
    () => EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.productId === pkgIdB) || EGYPTIAN_COMMERCIAL_PRODUCTS[7],
    [pkgIdB]
  );

  const medA = useMemo(
    () => ALL_LOCAL_MEDICINES.find((m) => m.id === medIdA) || ALL_LOCAL_MEDICINES[0],
    [medIdA]
  );
  const medB = useMemo(
    () => ALL_LOCAL_MEDICINES.find((m) => m.id === medIdB) || ALL_LOCAL_MEDICINES[2],
    [medIdB]
  );

  const ingMetaA = useMemo(() => ACTIVE_INGREDIENTS.find((a) => a.id === medA.id), [medA]);
  const ingMetaB = useMemo(() => ACTIVE_INGREDIENTS.find((a) => a.id === medB.id), [medB]);

  // Evaluate equivalence & price savings between Package A and Package B
  const packageVerdict = useMemo(() => {
    const exactMatch = pkgA.equivalenceGroupKey === pkgB.equivalenceGroupKey;
    const sameIng = pkgA.activeIngredientId === pkgB.activeIngredientId;
    const priceDiff =
      pkgA.priceEgp !== null && pkgB.priceEgp !== null
        ? Math.abs(pkgA.priceEgp - pkgB.priceEgp)
        : null;
    const cheaperPkg =
      pkgA.priceEgp !== null && pkgB.priceEgp !== null
        ? pkgA.priceEgp < pkgB.priceEgp
          ? pkgA
          : pkgB.priceEgp < pkgA.priceEgp
          ? pkgB
          : null
        : null;

    return { exactMatch, sameIng, priceDiff, cheaperPkg };
  }, [pkgA, pkgB]);

  const quickPackagePresets = [
    {
      labelAr: 'أوجمنتين 1 جم 🆚 هاي بيوتك 1 جم',
      labelEn: 'Augmentin 1g vs Hibiotic 1g',
      a: 'EG-ABX-001',
      b: 'EG-ABX-008',
    },
    {
      labelAr: 'زيثروماكس 500 🆚 زيثرون 500',
      labelEn: 'Zithromax 500 vs Xithrone 500',
      a: 'EG-ABX-031',
      b: 'EG-ABX-034',
    },
    {
      labelAr: 'فلاجيل 500 🆚 أمريزول 500',
      labelEn: 'Flagyl 500 vs Amrizole 500',
      a: 'EG-ABX-021',
      b: 'EG-ABX-026',
    },
    {
      labelAr: 'سوبراكس 400 🆚 ماجناسيف 400',
      labelEn: 'Suprax 400 vs Magnacef 400',
      a: 'EG-ABX-113',
      b: 'EG-ABX-116',
    },
  ];

  const quickClinicalPresets = [
    {
      labelAr: 'أوجمنتين (بنسلين) 🆚 زيثروماكس (ماكروليد)',
      labelEn: 'Amoxicillin/Clavulanate vs Azithromycin',
      a: 'amoxicillin-clavulanic-acid',
      b: 'azithromycin',
    },
    {
      labelAr: 'سيفترياكسون 🆚 سيفوتاكسيم',
      labelEn: 'Ceftriaxone vs Cefotaxime',
      a: 'ceftriaxone',
      b: 'cefotaxime',
    },
    {
      labelAr: 'سيبروفلوكساسين 🆚 ليفوفلوكساسين',
      labelEn: 'Ciprofloxacin vs Levofloxacin',
      a: 'ciprofloxacin',
      b: 'levofloxacin',
    },
    {
      labelAr: 'فانكومايسين 🆚 لينيزوليد (مضادات MRSA)',
      labelEn: 'Vancomycin vs Linezolid (Anti-MRSA)',
      a: 'vancomycin',
      b: 'linezolid',
    },
  ];

  return (
    <main className="wrap stack">
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/">← {isAr ? 'الرئيسية' : 'Home'}</Link>
        <Link to="/medicines" className="btn ghost small">
          💊 {isAr ? 'تصفح السجل الكامل (206 عبوات)' : 'Browse Full Registry (206)'}
        </Link>
      </div>

      <header className="med-head">
        <h1>
          ⚖️{' '}
          {isAr
            ? 'المقارنة السريرية والدوائية بين المضادات الحيوية جنباً إلى جنب'
            : 'Side-by-Side Antibiotic Clinical & Package Comparison'}
        </h1>
        <p className="muted">
          {isAr
            ? 'قارن بين أي عبوتين تجاريتين في السوق المصري لمعرفة التكافؤ وفارق السعر، أو قارن بين مادتين فعالتين من حيث الطيف والجرعات والأمان في الحمل والكلى.'
            : 'Compare commercial packages for generic equivalence and cost savings, or compare active ingredients across clinical dimensions.'}
        </p>
      </header>

      {/* Mode Switcher */}
      <div className="row wrapRow" style={{ gap: '10px' }}>
        <button
          className={`btn ${mode === 'packages' ? '' : 'ghost'}`}
          onClick={() => setMode('packages')}
        >
          📦 {isAr ? 'مقارنة عبوتين تجاريتين بالسوق المصري (التكافؤ والسعر)' : 'Compare 2 Commercial Packages (Equivalence & Price)'}
        </button>
        <button
          className={`btn ${mode === 'ingredients' ? '' : 'ghost'}`}
          onClick={() => setMode('ingredients')}
        >
          🧬 {isAr ? 'مقارنة مادتين فعالتين سريرياً (الجرعات والحمل والكلى)' : 'Compare 2 Active Ingredients Clinically'}
        </button>
      </div>

      {/* MODE 1: COMMERCIAL PACKAGES SIDE-BY-SIDE COMPARISON */}
      {mode === 'packages' && (
        <section className="stack">
          {/* Quick Presets */}
          <div className="card">
            <div className="small muted" style={{ marginBottom: '8px', fontWeight: 600 }}>
              ⚡ {isAr ? 'مقارنات سريعة شائعة بضغطة واحدة:' : 'Quick Popular Comparisons:'}
            </div>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              {quickPackagePresets.map((pr, idx) => (
                <button
                  key={idx}
                  className="chip"
                  onClick={() => {
                    setPkgIdA(pr.a);
                    setPkgIdB(pr.b);
                  }}
                >
                  {isAr ? pr.labelAr : pr.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Selectors */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))' }}>
            <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px', color: '#0284c7' }}>
                1️⃣ {isAr ? 'المستحضر التجاري الأول:' : 'First Commercial Package:'}
              </label>
              <select value={pkgIdA} onChange={(e) => setPkgIdA(e.target.value)}>
                {EGYPTIAN_COMMERCIAL_PRODUCTS.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {isAr
                      ? `${p.tradeNameAr} (${p.tradeNameEn}) — ${p.priceEgp} ج.م`
                      : `${p.tradeNameEn} (${p.tradeNameAr}) — ${p.priceEgp} EGP`}
                  </option>
                ))}
              </select>
            </div>

            <div className="card" style={{ borderTop: '4px solid #0d9488' }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px', color: '#0d9488' }}>
                2️⃣ {isAr ? 'المستحضر التجاري الثاني:' : 'Second Commercial Package:'}
              </label>
              <select value={pkgIdB} onChange={(e) => setPkgIdB(e.target.value)}>
                {EGYPTIAN_COMMERCIAL_PRODUCTS.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {isAr
                      ? `${p.tradeNameAr} (${p.tradeNameEn}) — ${p.priceEgp} ج.م`
                      : `${p.tradeNameEn} (${p.tradeNameAr}) — ${p.priceEgp} EGP`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Equivalence & Savings Verdict Banner */}
          <div
            className="card highlight-card"
            style={{
              borderLeft: packageVerdict.exactMatch
                ? '5px solid #16a34a'
                : packageVerdict.sameIng
                ? '5px solid #0284c7'
                : '5px solid #d97706',
            }}
          >
            <h3 style={{ margin: '0 0 6px' }}>
              {packageVerdict.exactMatch
                ? isAr
                  ? '✅ حكم التكافؤ الصيدلاني: مثيلان متطابقان تماماً (نفس المادة الفعالة والتركيز والشكل الصيدلاني)'
                  : '✅ Equivalence Verdict: Exact Generic Equivalents (Identical Ingredient, Strength & Dosage Form)'
                : packageVerdict.sameIng
                ? isAr
                  ? 'ℹ️ حكم التكافؤ: نفس المادة الفعالة ولكن يختلفان في التركيز أو الشكل الصيدلاني'
                  : 'ℹ️ Equivalence Verdict: Same Active Ingredient, Different Strength or Dosage Form'
                : isAr
                ? '⚠️ تنبيه سريري: هذان المستحضران يحتويان على مادتين فعالتين مختلفتين — لا يُستبدل أحدهما بالآخر إلا بقرار الطبيب'
                : '⚠️ Clinical Alert: Different Active Ingredients — Do Not Substitute Without Physician Approval'}
            </h3>
            {packageVerdict.priceDiff !== null && packageVerdict.priceDiff > 0 && packageVerdict.cheaperPkg && (
              <p style={{ margin: 0, color: '#15803d', fontWeight: 700 }}>
                💰{' '}
                {isAr
                  ? `فارق السعر: اختيار «${packageVerdict.cheaperPkg.tradeNameAr}» يوفر ${packageVerdict.priceDiff.toFixed(2)} جنيه مصري في العبوة الواحدة.`
                  : `Cost Difference: Choosing "${packageVerdict.cheaperPkg.tradeNameEn}" saves ${packageVerdict.priceDiff.toFixed(2)} EGP per pack.`}
              </p>
            )}
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="card tablewrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: '24%' }}>{isAr ? 'وجه المقارنة' : 'Attribute'}</th>
                  <th style={{ width: '38%', color: '#0284c7' }}>
                    {isAr ? pkgA.tradeNameAr : pkgA.tradeNameEn}
                  </th>
                  <th style={{ width: '38%', color: '#0d9488' }}>
                    {isAr ? pkgB.tradeNameAr : pkgB.tradeNameEn}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>{isAr ? 'الاسم الإنجليزي والعربي' : 'Trade Names'}</b></td>
                  <td><b>{pkgA.tradeNameEn}</b> ({pkgA.tradeNameAr})</td>
                  <td><b>{pkgB.tradeNameEn}</b> ({pkgB.tradeNameAr})</td>
                </tr>
                <tr>
                  <td><b>{isAr ? 'المادة الفعالة والتركيب' : 'Active Composition'}</b></td>
                  <td>
                    <Link to={`/medicine/${pkgA.activeIngredientId}`}>
                      {pkgA.scientificComposition}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/medicine/${pkgB.activeIngredientId}`}>
                      {pkgB.scientificComposition}
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td><b>{isAr ? 'التركيز' : 'Strength'}</b></td>
                  <td><b dir="ltr">{pkgA.strength}</b></td>
                  <td><b dir="ltr">{pkgB.strength}</b></td>
                </tr>
                <tr>
                  <td><b>{isAr ? 'الشكل الصيدلاني وطريق الإعطاء' : 'Dosage Form & Route'}</b></td>
                  <td>{pick(pkgA.dosageFormLabel, lang)} — {pick(pkgA.routeLabel, lang)}</td>
                  <td>{pick(pkgB.dosageFormLabel, lang)} — {pick(pkgB.routeLabel, lang)}</td>
                </tr>
                <tr>
                  <td><b>{isAr ? 'حجم وتفاصيل العبوة' : 'Package Details'}</b></td>
                  <td>{pick(pkgA.packDetails, lang)}</td>
                  <td>{pick(pkgB.packDetails, lang)}</td>
                </tr>
                <tr>
                  <td><b>{isAr ? 'الشركة المصنعة وبلد المنشأ' : 'Manufacturer'}</b></td>
                  <td>{pkgA.manufacturer} ({pkgA.countryOfOrigin})</td>
                  <td>{pkgB.manufacturer} ({pkgB.countryOfOrigin})</td>
                </tr>
                <tr>
                  <td><b>{isAr ? 'السعر الرسمي المعتمد' : 'Official Price (EGP)'}</b></td>
                  <td>
                    <span className="badge approved" style={{ fontSize: '0.95rem' }}>
                      {pkgA.priceEgp ? `${pkgA.priceEgp.toFixed(2)} ج.م` : '—'}
                    </span>
                    <div className="small muted">{pick(pkgA.unitPriceNote, lang)}</div>
                  </td>
                  <td>
                    <span className="badge approved" style={{ fontSize: '0.95rem' }}>
                      {pkgB.priceEgp ? `${pkgB.priceEgp.toFixed(2)} ج.م` : '—'}
                    </span>
                    <div className="small muted">{pick(pkgB.unitPriceNote, lang)}</div>
                  </td>
                </tr>
                <tr>
                  <td><b>{isAr ? 'الباركود الخطي (EAN-13)' : 'Linear Barcode'}</b></td>
                  <td dir="ltr">
                    {pkgA.barcode ? (
                      <code>{pkgA.barcode} ✓</code>
                    ) : (
                      <span className="small muted" dir="rtl">
                        {isAr ? 'قيد التحقق الميداني' : 'Pending field check'}
                      </span>
                    )}
                  </td>
                  <td dir="ltr">
                    {pkgB.barcode ? (
                      <code>{pkgB.barcode} ✓</code>
                    ) : (
                      <span className="small muted" dir="rtl">
                        {isAr ? 'قيد التحقق الميداني' : 'Pending field check'}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td><b>{isAr ? 'المرجع السريري الكامل' : 'Clinical Monograph'}</b></td>
                  <td>
                    <Link to={`/medicine/${pkgA.activeIngredientId}`} className="btn ghost small">
                      📖 {isAr ? 'فتح النشرة السريرية' : 'Open Monograph'}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/medicine/${pkgB.activeIngredientId}`} className="btn ghost small">
                      📖 {isAr ? 'فتح النشرة السريرية' : 'Open Monograph'}
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODE 2: CLINICAL ACTIVE INGREDIENTS SIDE-BY-SIDE COMPARISON */}
      {mode === 'ingredients' && (
        <section className="stack">
          {/* Quick Clinical Presets */}
          <div className="card">
            <div className="small muted" style={{ marginBottom: '8px', fontWeight: 600 }}>
              ⚡ {isAr ? 'مقارنات سريرية سريعة:' : 'Quick Clinical Comparisons:'}
            </div>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              {quickClinicalPresets.map((pr, idx) => (
                <button
                  key={idx}
                  className="chip"
                  onClick={() => {
                    setMedIdA(pr.a);
                    setMedIdB(pr.b);
                  }}
                >
                  {isAr ? pr.labelAr : pr.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Selectors */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))' }}>
            <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px', color: '#0284c7' }}>
                1️⃣ {isAr ? 'المادة الفعالة الأولى:' : 'First Active Ingredient:'}
              </label>
              <select value={medIdA} onChange={(e) => setMedIdA(e.target.value)}>
                {ALL_LOCAL_MEDICINES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {pick(m.genericName, lang)} ({m.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="card" style={{ borderTop: '4px solid #0d9488' }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px', color: '#0d9488' }}>
                2️⃣ {isAr ? 'المادة الفعالة الثانية:' : 'Second Active Ingredient:'}
              </label>
              <select value={medIdB} onChange={(e) => setMedIdB(e.target.value)}>
                {ALL_LOCAL_MEDICINES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {pick(m.genericName, lang)} ({m.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-Side Clinical Matrix */}
          <div className="card tablewrap">
            <table className="tbl" style={{ whiteSpace: 'normal' }}>
              <thead>
                <tr>
                  <th style={{ width: '20%', minWidth: '140px' }}>{isAr ? 'المعيار السريري' : 'Clinical Dimension'}</th>
                  <th style={{ width: '40%', minWidth: '240px', color: '#0284c7' }}>
                    <div style={{ fontSize: '1.05rem' }}>{pick(medA.genericName, lang)}</div>
                    {ingMetaA && (
                      <span className="badge" style={{ marginTop: '4px' }}>
                        WHO {ingMetaA.whoAccessGroup} · {ingMetaA.atcCode}
                      </span>
                    )}
                  </th>
                  <th style={{ width: '40%', minWidth: '240px', color: '#0d9488' }}>
                    <div style={{ fontSize: '1.05rem' }}>{pick(medB.genericName, lang)}</div>
                    {ingMetaB && (
                      <span className="badge" style={{ marginTop: '4px' }}>
                        WHO {ingMetaB.whoAccessGroup} · {ingMetaB.atcCode}
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {CLINICAL_ROWS.map((row) => (
                  <tr key={row.field}>
                    <td style={{ verticalAlign: 'top', fontWeight: 700, background: 'var(--bg-subtle, #f8fafc)' }}>
                      {row.icon} {isAr ? row.labelAr : row.labelEn}
                    </td>
                    <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                      {pick(medA[row.field], lang) || '—'}
                    </td>
                    <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                      {pick(medB[row.field], lang) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
