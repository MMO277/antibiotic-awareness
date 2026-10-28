import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { pick, tr } from './types';
import Disclaimer from './Disclaimer';
import {
  ACTIVE_INGREDIENTS,
  EgyptianCommercialProduct,
  getClassifiedAlternatives,
} from './egyptianDrugDatabase';
import { useLiveDrugCatalog } from './liveCatalogSync';
import { norm } from './search';

export default function CostSaver() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { products } = useLiveDrugCatalog();
  const [sp] = useSearchParams();
  const initialIng = sp.get('ing') || '';

  const [query, setQuery] = useState('');
  const [packsNeeded, setPacksNeeded] = useState<number>(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const defaultSelected = useMemo(() => {
    if (initialIng) {
      const byIng = products
        .filter((p) => p.activeIngredientId === initialIng && p.priceEgp != null)
        .sort((a, b) => (b.priceEgp || 0) - (a.priceEgp || 0));
      if (byIng.length > 0) return byIng[0];
    }
    return (
      products.find((p) => p.tradeNameEn.toLowerCase().includes('augmentin 1g')) ||
      products[0] ||
      null
    );
  }, [products, initialIng]);

  const [selected, setSelected] = useState<EgyptianCommercialProduct | null>(defaultSelected);

  const activeProduct = selected || defaultSelected;

  const searchMatches = useMemo(() => {
    const q = norm(query);
    if (!q) return products.slice(0, 12);
    return products
      .filter((p) => {
        const hay = norm(`${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition} ${p.strength} ${p.barcode || ''}`);
        return hay.includes(q);
      })
      .slice(0, 15);
  }, [products, query]);

  const classified = useMemo(() => {
    if (!activeProduct) return { exactMatches: [], sameIngredientDiffForm: [], therapeuticClassAlternatives: [] };
    return getClassifiedAlternatives(activeProduct);
  }, [activeProduct]);

  const cheapestIdentical = useMemo(() => {
    if (!activeProduct) return null;
    const pool = [activeProduct, ...classified.exactMatches].filter((p) => p.priceEgp != null && p.priceEgp > 0);
    if (pool.length === 0) return null;
    return pool.reduce((min, cur) => ((cur.priceEgp ?? 99999) < (min.priceEgp ?? 99999) ? cur : min), pool[0]);
  }, [activeProduct, classified.exactMatches]);

  const prescribedTotal = (activeProduct?.priceEgp || 0) * packsNeeded;
  const cheapestTotal = (cheapestIdentical?.priceEgp || 0) * packsNeeded;
  const savingsEgp = Math.max(0, prescribedTotal - cheapestTotal);
  const savingsPct =
    prescribedTotal > 0 && savingsEgp > 0 ? Math.round((savingsEgp / prescribedTotal) * 100) : 0;

  const popularShortcuts = useMemo(() => {
    const ids = ['amoxicillin-clavulanic-acid', 'azithromycin', 'ceftriaxone', 'ciprofloxacin', 'cefixime', 'metronidazole'];
    return ids
      .map((id) => {
        const list = products
          .filter((p) => p.activeIngredientId === id && p.priceEgp != null)
          .sort((a, b) => (b.priceEgp || 0) - (a.priceEgp || 0));
        return list[0];
      })
      .filter((p): p is EgyptianCommercialProduct => Boolean(p));
  }, [products]);

  const ingMeta = useMemo(
    () => ACTIVE_INGREDIENTS.find((a) => a.id === activeProduct?.activeIngredientId),
    [activeProduct]
  );

  return (
    <main className="wrap stack">
      <section className="card cost-saver-hero">
        <span className="badge approved" style={{ marginBottom: '8px' }}>
          💰 {tr(lang, 'حاسبة التكافؤ الحيوي والتوفير الدوائي • EDA Licensed', 'Bioequivalent Generic Cost Saver • EDA Licensed')}
        </span>
        <h1 style={{ margin: '0 0 6px' }}>
          {tr(
            lang,
            'حاسبة «البديل الأرخص بنفس الكفاءة» والمثائل المتطابقة 100%',
            'Smart Generic Cost Saver & 100% Identical Equivalents'
          )}
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr(
            lang,
            'قارن الدواء الموصوف بجميع المثائل المصرية المرخصة من هيئة الدواء المصرية (EDA) التي تحتوي على نفس المادة الفعالة ونفس التركيز ونفس الشكل الصيدلاني بعد استشارة الطبيب أو الصيدلي.',
            'Compare any prescribed brand with 100% identical EDA-licensed equivalents containing the exact same active ingredient, strength, and dosage form.'
          )}
        </p>

        <div className="cost-saver-controls">
          <div className="cost-search-col" style={{ position: 'relative' }}>
            <label htmlFor="cost-drug-search">
              🔍 {tr(lang, 'ابحث عن الدواء الموصوف في الروشتة:', 'Search Prescribed Brand or Ingredient:')}
            </label>
            <input
              id="cost-drug-search"
              value={query}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
              onChange={(e) => {
                setQuery(e.target.value);
                setDropdownOpen(true);
              }}
              placeholder={tr(lang, 'اكتب اسم الدواء (مثل أوجمنتين، زيثروماكس، روسيفين، سيبروباي)...', 'Type brand name (e.g. Augmentin, Zithromax, Rocephin)...')}
            />
            {dropdownOpen && searchMatches.length > 0 && (
              <div className="cost-search-dropdown">
                {searchMatches.map((item) => (
                  <button
                    key={item.productId}
                    type="button"
                    className="cost-search-option"
                    onClick={() => {
                      setSelected(item);
                      setQuery('');
                      setDropdownOpen(false);
                    }}
                  >
                    <div>
                      <b>{isAr ? item.tradeNameAr : item.tradeNameEn}</b>
                      <div className="small muted">
                        {item.scientificComposition} · {item.strength} · {pick(item.dosageFormLabel, lang)}
                      </div>
                    </div>
                    <span className="cost-search-price">
                      {item.priceEgp ? `${item.priceEgp.toFixed(2)} EGP` : '—'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="cost-pack-col">
            <label htmlFor="cost-packs-count">
              📦 {tr(lang, 'عدد العبوات المطلوبة للكورس:', 'Packs Needed for Course:')}
            </label>
            <select
              id="cost-packs-count"
              value={packsNeeded}
              onChange={(e) => setPacksNeeded(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {tr(lang, n === 1 ? 'عبوة واحدة' : 'عبوات', n === 1 ? 'Pack' : 'Packs')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row wrapRow" style={{ gap: '8px', marginTop: '12px' }}>
          <span className="small muted">{tr(lang, 'أمثلة سريعة:', 'Quick Examples:')}</span>
          {popularShortcuts.map((p) => (
            <button
              key={p.productId}
              type="button"
              className={`cost-quick-chip ${activeProduct?.productId === p.productId ? 'active' : ''}`}
              onClick={() => setSelected(p)}
            >
              💊 {isAr ? p.tradeNameAr : p.tradeNameEn}
            </button>
          ))}
        </div>
      </section>

      {activeProduct && (
        <>
          <div className="cost-comparison-grid">
            <div className="card cost-card-prescribed">
              <span className="badge" style={{ marginBottom: '6px' }}>
                📋 {tr(lang, 'الدواء المختار للمقارنة', 'Selected Reference Drug')}
              </span>
              <h2 style={{ margin: '0 0 4px' }}>
                {isAr ? activeProduct.tradeNameAr : activeProduct.tradeNameEn}
              </h2>
              <p className="small muted" style={{ margin: '0 0 10px' }}>
                {activeProduct.scientificComposition} · <b>{activeProduct.strength}</b> ·{' '}
                {pick(activeProduct.dosageFormLabel, lang)} ({activeProduct.manufacturer})
              </p>
              <div className="cost-price-display">
                <div>
                  <span className="small muted">{tr(lang, 'إجمالي التكلفة:', 'Total Cost:')}</span>
                  <span className="cost-big-num">{prescribedTotal.toFixed(2)} EGP</span>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <span className="small muted">{tr(lang, 'سعر العبوة:', 'Per Pack:')}</span>
                  <span className="cost-sub-num">{(activeProduct.priceEgp || 0).toFixed(2)} EGP</span>
                </div>
              </div>
            </div>

            {cheapestIdentical && (
              <div className="card cost-card-cheapest">
                <span className="badge approved" style={{ marginBottom: '6px' }}>
                  ✅ {tr(lang, 'أرخص مثيل مطابق 100% في المادة والتركيز', 'Lowest-Cost 100% Identical Equivalent')}
                </span>
                <h2 style={{ margin: '0 0 4px', color: '#15803d' }}>
                  {isAr ? cheapestIdentical.tradeNameAr : cheapestIdentical.tradeNameEn}
                </h2>
                <p className="small muted" style={{ margin: '0 0 10px' }}>
                  {cheapestIdentical.scientificComposition} · <b>{cheapestIdentical.strength}</b> ·{' '}
                  {pick(cheapestIdentical.dosageFormLabel, lang)} ({cheapestIdentical.manufacturer})
                </p>
                <div className="cost-price-display">
                  <div>
                    <span className="small muted">{tr(lang, 'التكلفة بعد التوفير:', 'Equivalent Cost:')}</span>
                    <span className="cost-big-num green">{cheapestTotal.toFixed(2)} EGP</span>
                  </div>
                  {savingsEgp > 0 ? (
                    <div className="cost-saving-pill">
                      <span>{tr(lang, 'قيمة التوفير الفوري:', 'Direct Savings:')}</span>
                      <strong>
                        {savingsEgp.toFixed(2)} EGP ({savingsPct}%)
                      </strong>
                    </div>
                  ) : (
                    <span className="badge approved">
                      {tr(lang, 'هذا هو الخيار الأقل سعراً بالفعل', 'Already Lowest Priced Option')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <section className="card stack">
            <div className="head" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ margin: 0 }}>
                  🔬{' '}
                  {tr(
                    lang,
                    `جميع المثائل المتطابقة 100% في المادة الفعالة والتركيز (${classified.exactMatches.length})`,
                    `All 100% Identical Active Ingredient & Strength Equivalents (${classified.exactMatches.length})`
                  )}
                </h2>
                <p className="small muted" style={{ margin: '4px 0 0' }}>
                  {tr(
                    lang,
                    'المثيل الدوائي (Generic Equivalent) يحتوي على نفس المادة الفعالة وبنفس التركيز الدوائي، لكن استشر الصيدلي أو الطبيب دائماً قبل الاستبدال.',
                    'Generic equivalents contain the exact same active molecule and strength. Always confirm with your pharmacist or physician before switching.'
                  )}
                </p>
              </div>
              {ingMeta && (
                <Link to={`/medicine/${ingMeta.id}`} className="btn ghost small">
                  📖 {tr(lang, 'النشرة السريرية للمادة الفعالة ←', 'Clinical Monograph →')}
                </Link>
              )}
            </div>

            {classified.exactMatches.length === 0 ? (
              <p className="muted">
                {tr(lang, 'لا توجد عبوات أخرى مسجلة بنفس التركيز الدقيق حالياً.', 'No other packages registered with this exact strength.')}
              </p>
            ) : (
              <div className="tablewrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{tr(lang, 'الاسم التجاري المثيل', 'Equivalent Brand')}</th>
                      <th>{tr(lang, 'التركيز والشكل', 'Strength & Form')}</th>
                      <th>{tr(lang, 'الشركة والعبوة', 'Manufacturer & Pack')}</th>
                      <th>{tr(lang, 'السعر الرسمي', 'Official Price')}</th>
                      <th>{tr(lang, 'الفرق عن الموصوف', 'Savings vs Selected')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...classified.exactMatches]
                      .sort((a, b) => (a.priceEgp ?? 99999) - (b.priceEgp ?? 99999))
                      .map((alt) => {
                        const diff = ((activeProduct.priceEgp || 0) - (alt.priceEgp || 0)) * packsNeeded;
                        return (
                          <tr key={alt.productId}>
                            <td>
                              <b>{isAr ? alt.tradeNameAr : alt.tradeNameEn}</b>
                              <div className="small muted">{isAr ? alt.tradeNameEn : alt.tradeNameAr}</div>
                            </td>
                            <td>
                              <b>{alt.strength}</b>
                              <div className="small muted">{pick(alt.dosageFormLabel, lang)}</div>
                            </td>
                            <td>
                              <div>{alt.manufacturer}</div>
                              <div className="small muted">{alt.packSize}</div>
                            </td>
                            <td>
                              <b>{alt.priceEgp ? `${(alt.priceEgp * packsNeeded).toFixed(2)} EGP` : '—'}</b>
                            </td>
                            <td>
                              {diff > 0 ? (
                                <span className="badge approved">
                                  -{diff.toFixed(2)} EGP ({tr(lang, 'أرخص', 'Cheaper')})
                                </span>
                              ) : diff < 0 ? (
                                <span className="badge">+{Math.abs(diff).toFixed(2)} EGP</span>
                              ) : (
                                <span className="small muted">{tr(lang, 'نفس السعر', 'Same Price')}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <Disclaimer />
    </main>
  );
}
