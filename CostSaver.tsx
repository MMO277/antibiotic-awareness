import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { pick, tr } from './types';
import {
  ACTIVE_INGREDIENTS,
  EgyptianCommercialProduct,
  getClassifiedAlternatives,
} from './egyptianDrugDatabase';
import { norm } from './search';
import Disclaimer from './Disclaimer';
import { useAuth } from './authContext';
import { useLiveDrugCatalog } from './liveCatalogSync';
import { QuickProductEditorModal } from './CommercialCatalogEditor';

const POPULAR_BRAND_IDS = [
  'EG-ABX-001', // Augmentin 1g
  'EG-ABX-083', // Zithromax 500mg
  'EG-ABX-055', // Rocephin 1g
  'EG-ABX-113', // Tavanic 500mg
  'EG-ABX-093', // Klacid 500mg
  'EG-ABX-039', // Zinnat 500mg
  'EG-ABX-193', // Zyvox 600mg
  'EG-ABX-103', // Ciprobay 500mg
  'EG-ABX-135', // Dalacin C 300mg
];

export default function CostSaver() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { role } = useAuth();
  const canEditLive = role === 'editor' || role === 'reviewer' || role === 'admin';
  const { products: liveProducts, version } = useLiveDrugCatalog();

  const [sp] = useSearchParams();
  const ingParam = sp.get('ing') || '';
  const prodParam = sp.get('prod') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [packCount, setPackCount] = useState<number>(1);
  const [editingProduct, setEditingProduct] = useState<EgyptianCommercialProduct | null>(null);

  const initialProduct = useMemo(() => {
    if (prodParam) {
      const found = liveProducts.find((p) => p.productId === prodParam);
      if (found) return found;
    }
    if (ingParam) {
      const byIng = liveProducts.filter(
        (p) => p.activeIngredientId === ingParam && p.priceEgp !== null
      ).sort((a, b) => (b.priceEgp || 0) - (a.priceEgp || 0));
      if (byIng.length > 0) return byIng[0];
    }
    return liveProducts[0];
  }, [ingParam, prodParam, liveProducts, version]);

  const [selectedProduct, setSelectedProduct] = useState<EgyptianCommercialProduct>(initialProduct);

  useEffect(() => {
    const updated = liveProducts.find((p) => p.productId === selectedProduct?.productId);
    if (updated) setSelectedProduct(updated);
    else if (initialProduct) setSelectedProduct(initialProduct);
  }, [initialProduct, liveProducts, version]);

  const searchResults = useMemo(() => {
    const clean = norm(searchQuery);
    if (!clean) return [];
    return liveProducts.filter((p) => {
      const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
      const hay = norm(
        `${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition} ${p.strength} ${p.manufacturer} ${p.barcode || ''} ${ing?.nameAr || ''} ${ing?.nameEn || ''}`
      );
      return hay.includes(clean);
    }).slice(0, 12);
  }, [searchQuery, liveProducts, version]);

  const popularShortcuts = useMemo(() => {
    return POPULAR_BRAND_IDS.map((id) => liveProducts.find((p) => p.productId === id)).filter(
      (p): p is EgyptianCommercialProduct => Boolean(p)
    );
  }, [liveProducts, version]);

  const alternatives = useMemo(
    () => getClassifiedAlternatives(selectedProduct, liveProducts),
    [selectedProduct, liveProducts, version]
  );

  const currentIng = useMemo(
    () => ACTIVE_INGREDIENTS.find((a) => a.id === selectedProduct.activeIngredientId),
    [selectedProduct]
  );

  // All products in the exact same equivalence group (including selectedProduct), sorted by price ascending
  const equivalenceGroupAll = useMemo(() => {
    const list = [selectedProduct, ...alternatives.exactEquivalents].filter((p) => p.priceEgp !== null);
    return list.sort((a, b) => (a.priceEgp ?? 99999) - (b.priceEgp ?? 99999));
  }, [selectedProduct, alternatives.exactEquivalents]);

  const cheapestIdentical = useMemo(() => {
    if (equivalenceGroupAll.length === 0) return null;
    return equivalenceGroupAll[0];
  }, [equivalenceGroupAll]);

  const selectedPrice = selectedProduct.priceEgp ?? 0;
  const cheapestPrice = cheapestIdentical?.priceEgp ?? selectedPrice;
  const savingPerPack = Math.max(0, selectedPrice - cheapestPrice);
  const totalSavings = savingPerPack * packCount;
  const savingPercent = selectedPrice > 0 ? Math.round((savingPerPack / selectedPrice) * 100) : 0;

  return (
    <main className="wrap stack">
      {/* Hero Banner */}
      <section className="card cost-saver-hero">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
          <div>
            <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 700, marginBottom: '8px' }}>
              💰 {tr(lang, 'مبادرة التوفير الدوائي وتجاوز النواقص • مرخصة من هيئة الدواء المصرية', 'Smart Generic Cost Saver & Shortage Solver • EDA Licensed')}
            </span>
            <h1 style={{ margin: '4px 0 8px' }}>
              {tr(
                lang,
                'حاسبة «البديل الأرخص بنفس الكفاءة» والمثائل المتطابقة',
                'Generic Cost Saver & Identical Equivalent Calculator',
                'Calculateur d’Économies Génériques & Équivalents Exactes',
                'Calculadora de Ahorro en Genéricos y Equivalentes Exactos'
              )}
            </h1>
            <p className="muted" style={{ maxWidth: '72ch', margin: 0 }}>
              {tr(
                lang,
                'ابحث عن الدواء الموصوف لك لعرض المثائل المصرية المتطابقة 100% في المادة الفعالة والتركيز والشكل الصيدلاني، واحسب قيمة التوفير الفوري بالجنيه المصري أو اعثر على البديل المتوفر حال وجود نقص في الصيدليات.',
                'Search your prescribed antibiotic to discover 100% identical Egyptian Drug Authority (EDA) licensed generic equivalents with the exact same active ingredient, strength, and dosage form—and calculate your instant savings in EGP.',
                'Recherchez votre antibiotique pour trouver les génériques homologués 100% identiques (même principe actif, dosage et forme) et calculez vos économies.',
                'Busca tu antibiótico recetado para encontrar genéricos autorizados 100% idénticos (mismo principio activo, concentración y forma) y calcula tu ahorro.'
              )}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/medicines" className="btn ghost small">
              💊 {tr(lang, 'السجل الدوائي الكامل', 'Full Drug Registry')}
            </Link>
            <Link to="/compare" className="btn ghost small">
              ⚖️ {tr(lang, 'مقارنة دواءين', 'Compare 2 Drugs')}
            </Link>
          </div>
        </div>

        {/* Search Input & Pack Count Selector */}
        <div className="cost-saver-controls">
          <div className="cost-search-col" style={{ position: 'relative' }}>
            <label htmlFor="cost-saver-search-input" className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              🔍 {tr(lang, 'ابحث بالاسم التجاري أو المادة الفعالة أو الباركود:', 'Search by trade name, active ingredient, or barcode:')}
            </label>
            <input
              id="cost-saver-search-input"
              type="search"
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr(
                lang,
                'مثال: أوجمنتين، زيثروماكس، روسيفين، تافانيك، كلاسيد، زينات...',
                'e.g., Augmentin, Zithromax, Rocephin, Tavanic, Klacid, Zinnat...'
              )}
            />

            {searchResults.length > 0 && (
              <div className="cost-search-dropdown">
                {searchResults.map((item) => (
                  <button
                    key={item.productId}
                    type="button"
                    className="cost-search-option"
                    onClick={() => {
                      setSelectedProduct(item);
                      setSearchQuery('');
                    }}
                  >
                    <div>
                      <b>{isAr ? item.tradeNameAr : item.tradeNameEn}</b>
                      <span className="small muted" style={{ marginInlineStart: '8px' }}>
                        ({item.scientificComposition})
                      </span>
                    </div>
                    <span className="cost-search-price">
                      {item.priceEgp ? `${item.priceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="cost-pack-col">
            <label htmlFor="cost-pack-select" className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              📦 {tr(lang, 'عدد العبوات المطلوبة للكورس:', 'Number of packs needed:')}
            </label>
            <select
              id="cost-pack-select"
              className="input"
              value={packCount}
              onChange={(e) => setPackCount(Number(e.target.value) || 1)}
            >
              <option value={1}>{tr(lang, 'عبوة واحدة (1 Pack)', '1 Pack')}</option>
              <option value={2}>{tr(lang, 'عبوتان (2 Packs)', '2 Packs')}</option>
              <option value={3}>{tr(lang, '3 عبوات (3 Packs)', '3 Packs')}</option>
              <option value={4}>{tr(lang, '4 عبوات (4 Packs)', '4 Packs')}</option>
            </select>
          </div>
        </div>

        {/* Quick Picks Bar */}
        <div style={{ marginTop: '12px' }}>
          <span className="small muted" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            ⚡ {tr(lang, 'اختر سريعاً من أشهر الأدوية المرتفعة السعر لمقارنة بدائلها:', 'Quick-pick popular high-cost brand medications:')}
          </span>
          <div className="row wrapRow" style={{ gap: '6px' }}>
            {popularShortcuts.map((item) => {
              const active = item.productId === selectedProduct.productId;
              return (
                <button
                  key={item.productId}
                  type="button"
                  onClick={() => setSelectedProduct(item)}
                  className={`chip cost-quick-chip${active ? ' active' : ''}`}
                >
                  <span>💊 {isAr ? item.tradeNameAr : item.tradeNameEn}</span>
                  {item.priceEgp && (
                    <small style={{ opacity: 0.85 }}>({item.priceEgp} {isAr ? 'ج.م' : 'EGP'})</small>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Side-by-Side Comparison: Selected Brand vs Cheapest Exact Generic */}
      <div className="cost-comparison-grid">
        {/* Card A: Selected Prescribed Product */}
        <section className="card cost-card-prescribed">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
              📋 {tr(lang, 'الدواء المختار / الموصوف', 'Selected / Prescribed Brand')}
            </span>
            <span className="small muted">{selectedProduct.manufacturer} ({selectedProduct.countryOfOrigin})</span>
          </div>
          <h2 style={{ margin: '8px 0 4px' }}>
            {isAr ? selectedProduct.tradeNameAr : selectedProduct.tradeNameEn}
          </h2>
          <p className="small muted" style={{ margin: '0 0 10px' }}>
            {selectedProduct.scientificComposition} · {pick(selectedProduct.dosageFormLabel, lang)}
          </p>

          <div className="cost-price-display">
            <div>
              <span className="small muted">{tr(lang, 'سعر العبوة الواحدة:', 'Single Pack Price:')}</span>
              <strong className="cost-big-num">
                {selectedPrice > 0 ? `${selectedPrice.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
              </strong>
            </div>
            {packCount > 1 && (
              <div>
                <span className="small muted">{tr(lang, `إجمالي ${packCount} عبوات:`, `Total (${packCount} packs):`)}</span>
                <strong className="cost-sub-num">
                  {(selectedPrice * packCount).toFixed(2)} {isAr ? 'ج.م' : 'EGP'}
                </strong>
              </div>
            )}
          </div>
          <div className="small muted" style={{ marginTop: '8px' }}>
            📦 {pick(selectedProduct.packDetails, lang)} · {pick(selectedProduct.unitPriceNote, lang)}
          </div>
        </section>

        {/* Card B: Best Value / Cheapest Identical Equivalent */}
        <section className="card cost-card-cheapest">
          {cheapestIdentical && cheapestIdentical.productId !== selectedProduct.productId && savingPerPack > 0 ? (
            <>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 800 }}>
                  ✅ {tr(lang, `المثيل المتطابق الأوفر (توفير ${savingPercent}%)`, `Cheapest Exact Equivalent (Save ${savingPercent}%)`)}
                </span>
                <span className="small muted">{cheapestIdentical.manufacturer} ({cheapestIdentical.countryOfOrigin})</span>
              </div>
              <h2 style={{ margin: '8px 0 4px', color: '#15803d' }}>
                {isAr ? cheapestIdentical.tradeNameAr : cheapestIdentical.tradeNameEn}
              </h2>
              <p className="small muted" style={{ margin: '0 0 10px' }}>
                {cheapestIdentical.scientificComposition} · {pick(cheapestIdentical.dosageFormLabel, lang)}
              </p>

              <div className="cost-price-display savings">
                <div>
                  <span className="small muted">{tr(lang, 'سعر المثيل الأوفر:', 'Generic Pack Price:')}</span>
                  <strong className="cost-big-num green">
                    {cheapestPrice.toFixed(2)} {isAr ? 'ج.م' : 'EGP'}
                  </strong>
                </div>
                <div className="cost-saving-pill">
                  <span>🎉 {tr(lang, 'إجمالي التوفير المباشر:', 'Total Direct Savings:')}</span>
                  <strong>
                    {totalSavings.toFixed(2)} {isAr ? 'ج.م' : 'EGP'} ({savingPercent}%)
                  </strong>
                </div>
              </div>
              <div className="small muted" style={{ marginTop: '8px' }}>
                📦 {pick(cheapestIdentical.packDetails, lang)} · {pick(cheapestIdentical.unitPriceNote, lang)}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '8px' }}>
              <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 800, alignSelf: 'flex-start' }}>
                🏆 {tr(lang, 'أنت بالفعل على الاختيار الأوفر سعراً!', 'Already the Most Cost-Effective Option!')}
              </span>
              <h3 style={{ margin: '4px 0', color: '#15803d' }}>
                {tr(
                  lang,
                  'هذا المستحضر هو بالفعل الأقل سعراً ضمن مجموعته المتطابقة في التركيز والشكل الدوائي.',
                  'This package is already the lowest-priced option within its exact strength and dosage form group.'
                )}
              </h3>
              <p className="small muted" style={{ margin: 0 }}>
                {tr(
                  lang,
                  'يمكنك استعراض باقي المثائل المتطابقة بالأسفل لمعرفة البدائل المتاحة في حال نقص هذا الصنف بالصيدليات.',
                  'Browse the table below to view all other exact generic equivalents in case this brand is out of stock.'
                )}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Table 1: All 100% Identical Generic Equivalents */}
      <section className="card highlight-card">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              🎯{' '}
              {tr(
                lang,
                `جميع المثائل المتطابقة 100% في المادة الفعالة والتركيز (${equivalenceGroupAll.length} مستحضرات)`,
                `All 100% Identical Generic Equivalents (${equivalenceGroupAll.length} Packages)`
              )}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {tr(
                lang,
                `نفس المادة الفعالة (${currentIng ? (isAr ? currentIng.nameAr : currentIng.nameEn) : selectedProduct.scientificComposition}) ونفس التركيز (${selectedProduct.strength}) ونفس الشكل الصيدلاني، مرتبة من الأرخص للأغلى:`,
                `Identical active ingredient (${selectedProduct.scientificComposition}), exact strength (${selectedProduct.strength}), and same dosage form, sorted from lowest to highest price:`
              )}
            </p>
          </div>
          {currentIng && (
            <Link to={`/medicine/${currentIng.id}`} className="btn ghost small">
              📖 {tr(lang, 'النشرة السريرية الكاملة للمادة ←', 'Full Clinical Monograph →')}
            </Link>
          )}
        </div>

        <div className="tablewrap" style={{ marginTop: '12px' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>{tr(lang, 'الترتيب السعري', 'Rank')}</th>
                <th>{tr(lang, 'الاسم التجاري', 'Trade Name')}</th>
                <th>{tr(lang, 'التركيز والعبوة', 'Strength & Pack')}</th>
                <th>{tr(lang, 'الشركة المصنعة', 'Manufacturer')}</th>
                <th>{tr(lang, 'السعر الرسمي', 'Official Price')}</th>
                <th>{tr(lang, `مقارنة التكلفة (${packCount} عبوة)`, `Savings (${packCount}x)`)}</th>
                {canEditLive && <th>{tr(lang, 'تعديل المحرر', 'Live Edit')}</th>}
              </tr>
            </thead>
            <tbody>
              {equivalenceGroupAll.map((pkg, idx) => {
                const isSelected = pkg.productId === selectedProduct.productId;
                const price = pkg.priceEgp ?? 0;
                const diffPerPack = selectedPrice - price;
                const diffTotal = diffPerPack * packCount;
                return (
                  <tr
                    key={pkg.productId}
                    style={{
                      background: isSelected ? 'rgba(14, 154, 167, 0.10)' : idx === 0 ? 'rgba(22, 163, 74, 0.06)' : undefined,
                    }}
                  >
                    <td>
                      {idx === 0 ? (
                        <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 800 }}>
                          🥇 {tr(lang, 'الأوفر سعراً', 'Cheapest')}
                        </span>
                      ) : (
                        <span className="small muted">#{idx + 1}</span>
                      )}
                    </td>
                    <td>
                      <b>{isAr ? pkg.tradeNameAr : pkg.tradeNameEn}</b>
                      {isSelected && (
                        <span className="badge" style={{ marginInlineStart: '6px', background: '#e0f2fe', color: '#0369a1' }}>
                          {tr(lang, 'المختار حالياً', 'Selected')}
                        </span>
                      )}
                      <div className="small muted">{isAr ? pkg.tradeNameEn : pkg.tradeNameAr}</div>
                    </td>
                    <td>
                      <b dir="ltr">{pkg.strength}</b>
                      <div className="small muted">{pick(pkg.packDetails, lang)}</div>
                    </td>
                    <td>
                      <div>{pkg.manufacturer}</div>
                      <div className="small muted">{pkg.countryOfOrigin}</div>
                    </td>
                    <td>
                      <b style={{ color: '#15803d', fontSize: '1rem' }}>
                        {price > 0 ? `${price.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                      </b>
                      <div className="small muted">{pick(pkg.unitPriceNote, lang)}</div>
                    </td>
                    <td>
                      {isSelected ? (
                        <span className="small muted">{tr(lang, 'الدواء الأساسي للمقارنة', 'Baseline selected drug')}</span>
                      ) : diffTotal > 0 ? (
                        <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                          ⬇ {tr(lang, `وفّر ${diffTotal.toFixed(2)} ج.م`, `Save ${diffTotal.toFixed(2)} EGP`)}
                        </span>
                      ) : diffTotal < 0 ? (
                        <span className="small" style={{ color: '#b45309' }}>
                          +{Math.abs(diffTotal).toFixed(2)} {isAr ? 'ج.م أعلى' : 'EGP more'}
                        </span>
                      ) : (
                        <span className="small muted">{tr(lang, 'نفس السعر', 'Same price')}</span>
                      )}
                    </td>
                    {canEditLive && (
                      <td>
                        <button
                          type="button"
                          className="btn ghost small"
                          style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 700 }}
                          onClick={() => setEditingProduct(pkg)}
                        >
                          ✏️ {isAr ? 'تعديل' : 'Edit'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Table 2: Same Active Ingredient in Other Strengths / Dosage Forms (Shortage Solver) */}
      {alternatives.sameIngredientDifferentFormOrStrength.length > 0 && (
        <section className="card">
          <h2 style={{ margin: '0 0 6px' }}>
            🔄{' '}
            {tr(
              lang,
              `نفس المادة الفعالة بتركيزات أو أشكال صيدلانية أخرى (${alternatives.sameIngredientDifferentFormOrStrength.length} عبوة - لحل مشكلة النواقص)`,
              `Same Active Ingredient in Other Strengths or Forms (${alternatives.sameIngredientDifferentFormOrStrength.length} Packages)`
            )}
          </h2>
          <p className="small muted" style={{ margin: '0 0 10px' }}>
            {tr(
              lang,
              '⚠️ تنبيه صيدلاني: هذه العبوات تحتوي على نفس المادة الفعالة ولكن بتركيز أو شكل دوائي مختلف؛ استشر الطبيب أو الصيدلي لضبط الجرعة قبل الاستبدال:',
              '⚠️ Pharmacist Note: These packages contain the exact same active ingredient but differ in strength or dosage form; verify dose conversion with your pharmacist:'
            )}
          </p>
          <div className="tablewrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{tr(lang, 'الاسم التجاري', 'Trade Name')}</th>
                  <th>{tr(lang, 'التركيز والشكل الصيدلاني', 'Strength & Form')}</th>
                  <th>{tr(lang, 'الشركة المصنعة', 'Manufacturer')}</th>
                  <th>{tr(lang, 'السعر الرسمي', 'Price (EGP)')}</th>
                  <th>{tr(lang, 'مقارنة كبديل أساسي', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {alternatives.sameIngredientDifferentFormOrStrength.map((pkg) => (
                  <tr key={pkg.productId}>
                    <td>
                      <b>{isAr ? pkg.tradeNameAr : pkg.tradeNameEn}</b>
                      <div className="small muted">{isAr ? pkg.tradeNameEn : pkg.tradeNameAr}</div>
                    </td>
                    <td>
                      <b dir="ltr">{pkg.strength}</b>
                      <div className="small muted">{pick(pkg.dosageFormLabel, lang)} · {pick(pkg.packDetails, lang)}</div>
                    </td>
                    <td>{pkg.manufacturer}</td>
                    <td>
                      <b style={{ color: '#15803d' }}>
                        {pkg.priceEgp ? `${pkg.priceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}` : '—'}
                      </b>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => {
                          setSelectedProduct(pkg);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        {tr(lang, 'اختر للمقارنة ↑', 'Select & Compare ↑')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Educational Card: Difference between Exact Generic vs Therapeutic Alternative */}
      <section className="card" style={{ borderInlineStart: '4px solid #0e9aa7' }}>
        <h3 style={{ margin: '0 0 8px' }}>
          💡 {tr(lang, 'كيف تفرق بين «المثيل المتطابق» و«البديل العلاجي» في الصيدلية المصرية؟', 'Understanding Exact Generics vs. Therapeutic Alternatives')}
        </h3>
        <div className="grid" style={{ gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--tint)' }}>
            <b>✅ {tr(lang, '1. المثيل الدوائي المتطابق (Generic Equivalent):', '1. Exact Generic Equivalent:')}</b>
            <p className="small" style={{ margin: '6px 0 0' }}>
              {tr(
                lang,
                'يحتوي على نفس المادة الفعالة وبنفس التركيز ونفس الشكل الدوائي تماماً (مثل أوجمنتين 1 جم = هاي بيوتك 1 جم = كورام 1 جم = إيموكسكلاف 1 جم)، وجميعها مرخصة من هيئة الدواء المصرية وتخضع لدراسات التكافؤ الحيوي (Bioequivalence).',
                'Contains the exact same active ingredient, strength, and dosage form (e.g., Augmentin 1g = Hibiotic 1g = Curam 1g), licensed by the Egyptian Drug Authority (EDA) with verified bioequivalence.'
              )}
            </p>
          </div>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--tint)' }}>
            <b>⚠️ {tr(lang, '2. البديل العلاجي (Therapeutic Alternative):', '2. Therapeutic Alternative:')}</b>
            <p className="small" style={{ margin: '6px 0 0' }}>
              {tr(
                lang,
                'يحتوي على مادة فعالة مختلفة تنتمي لنفس العائلة أو تعالج نفس العدوى، ولا يجوز صرفه إلا بعد الرجوع للطبيب المعالج لاختلاف الجرعات والحساسية والتداخلات.',
                'Contains a different active ingredient from a related class and requires physician authorization before substitution.'
              )}
            </p>
          </div>
        </div>
      </section>

      <Disclaimer />

      {editingProduct && (
        <QuickProductEditorModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </main>
  );
}
