import { ChangeEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { norm, searchMeds } from './search';
import { pick } from './types';
import SkeletonCard from './SkeletonCard';
import {
  ACTIVE_INGREDIENTS,
  AdministrationRoute,
  DOSAGE_FORM_LABELS,
  DosageFormType,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  EgyptianCommercialProduct,
  getClassifiedAlternatives,
  ROUTE_LABELS,
} from './egyptianDrugDatabase';
import {
  parseExternalEgyptianDrugJsonOrCsv,
  runDatabaseQualityAudit,
} from './dataAuditEngine';

type ViewTab = 'commercial_registry' | 'clinical_monographs' | 'audit_importer';
type SortOption = 'name' | 'price_asc' | 'price_desc' | 'verified_first';

export default function Medicines() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const { items, error } = useApproved();

  const [activeTab, setActiveTab] = useState<ViewTab>('commercial_registry');
  const [selectedIngFilter, setSelectedIngFilter] = useState<string>('all');
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('all');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');
  const [selectedBarcodeFilter, setSelectedBarcodeFilter] = useState<string>('all');
  const [selectedComboFilter, setSelectedComboFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('verified_first');
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 24;

  // Custom imported records from external CSV/JSON (e.g. karem505/egyptian-drug-database)
  const [importedProducts, setImportedProducts] = useState<EgyptianCommercialProduct[]>([]);
  const [importMsg, setImportMsg] = useState<string>('');

  // Modal state for commercial package details & alternatives
  const [selectedProduct, setSelectedProduct] = useState<EgyptianCommercialProduct | null>(null);

  const allCommercialProducts = useMemo(
    () => [...EGYPTIAN_COMMERCIAL_PRODUCTS, ...importedProducts],
    [importedProducts]
  );

  const auditReport = useMemo(
    () => runDatabaseQualityAudit(allCommercialProducts),
    [allCommercialProducts]
  );

  // Filter & sort commercial products
  const filteredProducts = useMemo(() => {
    const tokens = norm(q).split(/\s+/).filter(Boolean);
    const list = allCommercialProducts.filter((p) => {
      if (selectedIngFilter !== 'all' && p.activeIngredientId !== selectedIngFilter) return false;
      if (selectedFormFilter !== 'all' && p.dosageForm !== selectedFormFilter) return false;
      if (selectedRouteFilter !== 'all' && p.route !== selectedRouteFilter) return false;
      if (selectedBarcodeFilter === 'verified' && p.barcodeStatus !== 'verified') return false;
      if (selectedBarcodeFilter === 'pending' && p.barcodeStatus !== 'unverified_pending') return false;

      if (selectedComboFilter !== 'all') {
        const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
        if (selectedComboFilter === 'combo' && !ing?.isCombination) return false;
        if (selectedComboFilter === 'single' && ing?.isCombination) return false;
      }

      if (!tokens.length) return true;
      const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
      const hay = norm(
        [
          p.tradeNameAr,
          p.tradeNameEn,
          p.scientificComposition,
          p.strength,
          p.manufacturer,
          p.barcode || '',
          p.dosageFormLabel.ar,
          p.dosageFormLabel.en,
          ing?.nameAr || '',
          ing?.nameEn || '',
          ing?.drugClass.ar || '',
          ing?.drugClass.en || '',
          p.priceEgp ? String(p.priceEgp) : '',
        ].join(' ')
      );
      return tokens.every((tk) => hay.includes(tk));
    });

    return list.sort((a, b) => {
      if (sortBy === 'price_asc') {
        return (a.priceEgp ?? 99999) - (b.priceEgp ?? 99999);
      }
      if (sortBy === 'price_desc') {
        return (b.priceEgp ?? 0) - (a.priceEgp ?? 0);
      }
      if (sortBy === 'verified_first') {
        if (a.barcodeStatus !== b.barcodeStatus) {
          return a.barcodeStatus === 'verified' ? -1 : 1;
        }
        return a.tradeNameEn.localeCompare(b.tradeNameEn);
      }
      return isAr
        ? a.tradeNameAr.localeCompare(b.tradeNameAr, 'ar')
        : a.tradeNameEn.localeCompare(b.tradeNameEn);
    });
  }, [
    allCommercialProducts,
    q,
    selectedIngFilter,
    selectedFormFilter,
    selectedRouteFilter,
    selectedBarcodeFilter,
    selectedComboFilter,
    sortBy,
    isAr,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(
    () => filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredProducts, page]
  );

  const clinicalResults = useMemo(() => (items ? searchMeds(items, q) : []), [items, q]);

  const selectedAlternatives = useMemo(
    () => (selectedProduct ? getClassifiedAlternatives(selectedProduct, allCommercialProducts) : null),
    [selectedProduct, allCommercialProducts]
  );

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const { imported, skippedCount } = parseExternalEgyptianDrugJsonOrCsv(content, file.name);
      if (imported.length > 0) {
        setImportedProducts((prev) => [...prev, ...imported]);
        setImportMsg(
          isAr
            ? `✅ تم استيراد ودمج ${imported.length} مستحضر مضاد حيوي بنجاح من ملف (${file.name})، وتم استبعاد ${skippedCount} صنف غير مضاد للبكتيريا.`
            : `✅ Successfully imported ${imported.length} antibiotic products from ${file.name} (filtered out ${skippedCount} non-antibiotic records).`
        );
      } else {
        setImportMsg(
          isAr
            ? '⚠️ لم يتم العثور على سجلات مضادات حيوية مطابقة في الملف المرفوع. تأكد من رفع ملف CSV أو JSON من قاعدة بيانات الأدوية المصرية.'
            : '⚠️ No matching antibiotic records found in the uploaded file.'
        );
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="wrap stack">
      {/* Header & National Database KPIs */}
      <header className="med-head">
        <h1>
          {isAr
            ? 'قاعدة البيانات المصرية الشاملة للمضادات الحيوية والبدائل والباركود'
            : 'Complete Egyptian Antibiotics, Alternatives & Barcode Database'}
        </h1>
        <p className="muted">
          {isAr
            ? 'سجل دوائي منظم ومفحوص للمستحضرات المسجلة في السوق المصري، مع فصل دقيق بين المواد الفعالة والعبوات التجارية والأسعار والباركودات الخطية.'
            : 'Structured registry of antibiotic preparations in the Egyptian market with verified pricing, barcode status, and generic equivalence.'}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            marginTop: '14px',
          }}
        >
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid #0284c7' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7' }}>
              {auditReport.totalActiveIngredients}
            </div>
            <div className="small muted">
              {isAr ? 'مادة فعالة وموسوعة سريرية' : 'Active Ingredients'}
            </div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid #0d9488' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0d9488' }}>
              {auditReport.totalCommercialProducts}
            </div>
            <div className="small muted">
              {isAr ? 'مستحضر وعبوة تجارية بمصر' : 'Egyptian Market Packages'}
            </div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid #16a34a' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a' }}>
              {auditReport.verifiedBarcodesCount}
            </div>
            <div className="small muted">
              {isAr ? 'باركود خطي موثق (622)' : 'Verified EAN-13 Barcodes'}
            </div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid #7c3aed' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed' }}>
              {auditReport.totalManufacturers}
            </div>
            <div className="small muted">
              {isAr ? 'شركة ومصنع دوائي' : 'Pharma Manufacturers'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Mode Switcher Tabs */}
      <div className="row wrapRow" style={{ gap: '8px', borderBottom: '2px solid var(--border, #e2e8f0)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'commercial_registry' ? '' : 'ghost'}`}
          onClick={() => setActiveTab('commercial_registry')}
        >
          📦 {isAr ? `السجل التجاري للعبوات والبدائل (${allCommercialProducts.length})` : `Commercial Packages Registry (${allCommercialProducts.length})`}
        </button>
        <button
          className={`btn ${activeTab === 'clinical_monographs' ? '' : 'ghost'}`}
          onClick={() => setActiveTab('clinical_monographs')}
        >
          📚 {isAr ? `الموسوعة السريرية للمواد الفعالة (${items?.length || 32})` : `Clinical Active Ingredients (${items?.length || 32})`}
        </button>
        <button
          className={`btn ${activeTab === 'audit_importer' ? '' : 'ghost'}`}
          onClick={() => setActiveTab('audit_importer')}
        >
          🛡️ {isAr ? 'تقرير الجودة واستيراد البيانات' : 'Data Audit & CSV/JSON Importer'}
        </button>
        <Link to='/compare' className='btn ghost'>
          ⚖️ {isAr ? 'مقارنة دواءين جنباً إلى جنب' : 'Compare 2 Drugs'}
        </Link>
      </div>

      {/* Unified Search Bar */}
      <div className="card" style={{ padding: '16px' }}>
        <div className="search light-search" style={{ marginBottom: activeTab === 'commercial_registry' ? '14px' : '0' }}>
          <input
            value={q}
            onChange={(e) => {
              setSp(e.target.value ? { q: e.target.value } : {}, { replace: true });
              setPage(1);
            }}
            placeholder={
              isAr
                ? 'ابحث بالاسم التجاري (عربي/إنجليزي)، المادة الفعالة، الباركود الخطي (622...)، الشركة، أو التركيز...'
                : 'Search by trade name, active ingredient, barcode (622...), manufacturer, or strength...'
            }
            aria-label={t('search')}
          />
        </div>

        {/* Advanced Filters for Commercial Registry */}
        {activeTab === 'commercial_registry' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
            }}
          >
            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'المادة الفعالة:' : 'Active Ingredient:'}
              </label>
              <select
                value={selectedIngFilter}
                onChange={(e) => {
                  setSelectedIngFilter(e.target.value);
                  setPage(1);
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '8px' }}
              >
                <option value="all">{isAr ? 'كل المواد الفعالة (32)' : 'All Ingredients (32)'}</option>
                {ACTIVE_INGREDIENTS.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {isAr ? `${ing.nameAr} (${ing.nameEn})` : `${ing.nameEn} (${ing.nameAr})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'الشكل الصيدلاني:' : 'Dosage Form:'}
              </label>
              <select
                value={selectedFormFilter}
                onChange={(e) => {
                  setSelectedFormFilter(e.target.value);
                  setPage(1);
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '8px' }}
              >
                <option value="all">{isAr ? 'جميع الأشكال الدوائية' : 'All Dosage Forms'}</option>
                {(Object.keys(DOSAGE_FORM_LABELS) as DosageFormType[]).map((k) => (
                  <option key={k} value={k}>
                    {DOSAGE_FORM_LABELS[k][lang]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'طريق الإعطاء:' : 'Route of Administration:'}
              </label>
              <select
                value={selectedRouteFilter}
                onChange={(e) => {
                  setSelectedRouteFilter(e.target.value);
                  setPage(1);
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '8px' }}
              >
                <option value="all">{isAr ? 'كل طرق الإعطاء' : 'All Routes'}</option>
                {(Object.keys(ROUTE_LABELS) as AdministrationRoute[]).map((r) => (
                  <option key={r} value={r}>
                    {ROUTE_LABELS[r][lang]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'حالة توثيق الباركود:' : 'Barcode Verification:'}
              </label>
              <select
                value={selectedBarcodeFilter}
                onChange={(e) => {
                  setSelectedBarcodeFilter(e.target.value);
                  setPage(1);
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '8px' }}
              >
                <option value="all">{isAr ? 'الكل (موثق + قيد التحقق)' : 'All Packages'}</option>
                <option value="verified">{isAr ? '✅ باركود خطي موثق فقط (622)' : '✅ Verified Barcode Only'}</option>
                <option value="pending">{isAr ? '⏳ قيد التحقق الميداني (بدون باركود)' : '⏳ Pending Barcode Check'}</option>
              </select>
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'نوع التركيبة:' : 'Composition Type:'}
              </label>
              <select
                value={selectedComboFilter}
                onChange={(e) => {
                  setSelectedComboFilter(e.target.value);
                  setPage(1);
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '8px' }}
              >
                <option value="all">{isAr ? 'الكل (منفرد + مركب)' : 'All (Single + Combo)'}</option>
                <option value="single">{isAr ? 'مادة فعالة منفردة' : 'Single Active Ingredient'}</option>
                <option value="combo">{isAr ? 'مضاد حيوي مركب (مادتان)' : 'Combination Antibiotic'}</option>
              </select>
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                {isAr ? 'ترتيب النتائج حسب:' : 'Sort By:'}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px' }}
              >
                <option value="verified_first">{isAr ? 'الباركود الموثق أولاً' : 'Verified Barcodes First'}</option>
                <option value="name">{isAr ? 'الاسم التجاري (أبجدياً)' : 'Trade Name (A-Z)'}</option>
                <option value="price_asc">{isAr ? 'السعر: من الأقل إلى الأعلى' : 'Price: Low to High'}</option>
                <option value="price_desc">{isAr ? 'السعر: من الأعلى إلى الأقل' : 'Price: High to Low'}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: EGYPTIAN COMMERCIAL PREPARATIONS REGISTRY */}
      {activeTab === 'commercial_registry' && (
        <section className="stack">
          <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? `إجمالي المستحضرات المطابقة للبحث: ${filteredProducts.length} مستحضر (صفحة ${page} من ${totalPages})`
                : `Matching commercial packages: ${filteredProducts.length} (Page ${page} of ${totalPages})`}
            </p>
            {(selectedIngFilter !== 'all' ||
              selectedFormFilter !== 'all' ||
              selectedRouteFilter !== 'all' ||
              selectedBarcodeFilter !== 'all' ||
              selectedComboFilter !== 'all' ||
              q) && (
              <button
                className="btn ghost"
                style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                onClick={() => {
                  setSelectedIngFilter('all');
                  setSelectedFormFilter('all');
                  setSelectedRouteFilter('all');
                  setSelectedBarcodeFilter('all');
                  setSelectedComboFilter('all');
                  setSp({}, { replace: true });
                  setPage(1);
                }}
              >
                ↺ {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            )}
          </div>

          <div className="grid">
            {paginatedProducts.map((p) => {
              const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
              return (
                <div
                  key={p.productId}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderTop: p.barcodeStatus === 'verified' ? '3px solid #16a34a' : '3px solid #94a3b8',
                  }}
                >
                  <div>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                        {isAr ? p.tradeNameAr : p.tradeNameEn}
                      </h3>
                      {p.priceEgp !== null && (
                        <span
                          className="badge"
                          style={{
                            background: '#dcfce7',
                            color: '#166534',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.priceEgp.toFixed(2)} {isAr ? 'ج.م' : 'EGP'}
                        </span>
                      )}
                    </div>
                    <p className="small muted" style={{ margin: '2px 0 8px' }}>
                      {isAr ? p.tradeNameEn : p.tradeNameAr}
                    </p>

                    <div className="small" style={{ lineHeight: 1.7 }}>
                      <div>
                        <b>{isAr ? 'المادة الفعالة:' : 'Active Ingredient:'} </b>
                        <Link to={`/medicine/${p.activeIngredientId}`}>
                          {ing ? (isAr ? ing.nameAr : ing.nameEn) : p.scientificComposition}
                        </Link>
                      </div>
                      <div>
                        <b>{isAr ? 'التركيز والشكل:' : 'Strength & Form:'} </b>
                        <span dir="ltr">{p.strength}</span> — {p.dosageFormLabel[lang]}
                      </div>
                      <div>
                        <b>{isAr ? 'العبوة:' : 'Package:'} </b>
                        {p.packDetails[lang]}
                      </div>
                      <div>
                        <b>{isAr ? 'الشركة المصنعة:' : 'Manufacturer:'} </b>
                        {p.manufacturer} ({p.countryOfOrigin})
                      </div>
                      <div style={{ marginTop: '6px' }}>
                        <b>{isAr ? 'الباركود الخطي:' : 'Linear Barcode:'} </b>
                        {p.barcode ? (
                          <code
                            dir="ltr"
                            style={{
                              background: '#f0fdf4',
                              color: '#15803d',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                            }}
                          >
                            {p.barcode} ✓
                          </code>
                        ) : (
                          <span className="small muted">
                            {isAr ? 'غير متوفر بعد (قيد التحقق الميداني)' : 'Not available yet (pending field check)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row wrapRow" style={{ gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border, #f1f5f9)' }}>
                    <button
                      className="btn"
                      style={{ flex: 1, padding: '7px 10px', fontSize: '0.88rem' }}
                      onClick={() => setSelectedProduct(p)}
                    >
                      🔍 {isAr ? 'البدائل والباركود والتفاصيل' : 'Alternatives & Details'}
                    </button>
                    <Link
                      to={`/medicine/${p.activeIngredientId}`}
                      className="btn ghost"
                      style={{ padding: '7px 10px', fontSize: '0.88rem' }}
                    >
                      📖 {isAr ? 'المرجع السريري' : 'Clinical Guide'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="row" style={{ justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
              <button
                className="btn ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {isAr ? '→ السابق' : '← Previous'}
              </button>
              <span style={{ alignSelf: 'center', fontWeight: 600 }}>
                {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <button
                className="btn ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {isAr ? 'التالي ←' : 'Next →'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: CLINICAL ACTIVE INGREDIENT MONOGRAPHS */}
      {activeTab === 'clinical_monographs' && (
        <section className="stack">
          {error && <p className="alert">{t('loadError')}</p>}
          {items === null && !error && (
            <div className="grid">
              <SkeletonCard count={6} />
            </div>
          )}
          {items && items.length > 0 && clinicalResults.length === 0 && (
            <p className="muted">{t('noResults')}</p>
          )}
          <div className="grid">
            {clinicalResults.map((m) => {
              const ingMeta = ACTIVE_INGREDIENTS.find((a) => a.id === m.id);
              const awareColor =
                ingMeta?.whoAccessGroup === 'Access'
                  ? '#16a34a'
                  : ingMeta?.whoAccessGroup === 'Reserve'
                  ? '#dc2626'
                  : '#d97706';
              return (
                <Link key={m.id} to={`/medicine/${m.id}`} className="card link">
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{pick(m.genericName, lang)}</h3>
                    {ingMeta && (
                      <span
                        className="badge"
                        style={{
                          background: `${awareColor}18`,
                          color: awareColor,
                          border: `1px solid ${awareColor}`,
                          fontSize: '0.75rem',
                        }}
                      >
                        WHO {ingMeta.whoAccessGroup}
                      </span>
                    )}
                  </div>
                  <p className="muted" style={{ margin: '6px 0' }}>{pick(m.drugClass, lang)}</p>
                  {m.priceEgypt?.ar && (
                    <p className="small" style={{ color: '#15803d', fontWeight: 600, margin: '4px 0' }}>
                      💰 {pick(m.priceEgypt, lang).split('\n')[0]}
                    </p>
                  )}
                  {m.brands.length > 0 && (
                    <p className="small muted" style={{ marginTop: '6px' }}>
                      📦 {m.brands.slice(0, 4).map((b) => b.name.split(' (')[0]).join(' · ')}
                      {m.brands.length > 4 ? ` (+${m.brands.length - 4})` : ''}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: DATA QUALITY AUDIT & EXTERNAL DATASET IMPORTER */}
      {activeTab === 'audit_importer' && (
        <section className="stack">
          <div className="card highlight-card">
            <h2>📥 {isAr ? 'مستورد قاعدة بيانات الأدوية المصرية المفتوحة (CSV / JSON)' : 'Egyptian Drug Database Importer (CSV / JSON)'}</h2>
            <p className="small muted">
              {isAr
                ? 'يمكنك استيراد ملفات CSV أو JSON مباشرة من السجل المفتوح (مثل karem505/egyptian-drug-database) ليقوم النظام بتصفية المضادات الحيوية آلياً، وفحص جودتها، ودمجها في محرك البحث فوراً دون اختلاق أي باركود وهمي.'
                : 'Upload CSV or JSON datasets from open Egyptian drug registries (e.g. karem505/egyptian-drug-database) to automatically filter, validate, and merge antibiotic records.'}
            </p>
            <div className="row wrapRow" style={{ gap: '12px', alignItems: 'center', marginTop: '10px' }}>
              <label className="btn" style={{ cursor: 'pointer' }}>
                📂 {isAr ? 'اختر ملف CSV أو JSON للاستيراد الفوري' : 'Upload CSV or JSON Dataset'}
                <input
                  type="file"
                  accept=".csv,.json"
                  style={{ display: 'none' }}
                  onChange={handleImportFile}
                />
              </label>
              <a
                href="https://github.com/karem505/egyptian-drug-database"
                target="_blank"
                rel="noopener noreferrer"
                className="btn ghost"
              >
                🔗 {isAr ? 'فتح مستودع قاعدة بيانات الأدوية المصرية (GitHub)' : 'View Open Egyptian Drug Database on GitHub'}
              </a>
            </div>
            {importMsg && (
              <p className="notice" style={{ marginTop: '12px' }}>
                {importMsg}
              </p>
            )}
          </div>

          <div className="card">
            <h2>🛡️ {isAr ? 'تقرير التحقق الآلي من جودة البيانات والتغطية (Data Quality Audit)' : 'Automated Data Quality & Coverage Report'}</h2>
            <p className="small muted">
              {isAr
                ? 'تطبيقاً لمعايير الدقة العلمية: لا يتم ادعاء وجود باركود لأي عبوة ما لم يتم التحقق منه، وتُحفظ السجلات قيد المراجعة الميدانية بشفافية كاملة.'
                : 'Strict adherence to zero-fabrication standards: unverified package barcodes are explicitly kept null and queued for physical carton check.'}
            </p>
            <div className="tablewrap" style={{ marginTop: '12px' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{isAr ? 'معيار الفحص والتدقيق' : 'Audit Metric'}</th>
                    <th>{isAr ? 'النتيجة الفعلية' : 'Result'}</th>
                    <th>{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{isAr ? 'إجمالي المواد الفعالة المضادة للعدوى' : 'Total Active Ingredients'}</td>
                    <td><b>{auditReport.totalActiveIngredients}</b></td>
                    <td><span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>مكتمل ✓</span></td>
                  </tr>
                  <tr>
                    <td>{isAr ? 'إجمالي المستحضرات والعبوات التجارية المسجلة' : 'Total Commercial Preparations'}</td>
                    <td><b>{auditReport.totalCommercialProducts}</b></td>
                    <td><span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>مفحوص ✓</span></td>
                  </tr>
                  <tr>
                    <td>{isAr ? 'العبوات ذات الباركود الخطي الموثق (EAN-13 / 622)' : 'Packages with Verified EAN-13 Barcode'}</td>
                    <td><b>{auditReport.verifiedBarcodesCount}</b> ({Math.round((auditReport.verifiedBarcodesCount / auditReport.totalCommercialProducts) * 100)}%)</td>
                    <td><span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>موثق ✓</span></td>
                  </tr>
                  <tr>
                    <td>{isAr ? 'العبوات قيد التحقق الميداني للباركود (بدون باركود وهمي)' : 'Packages Pending Physical Barcode Check (null)'}</td>
                    <td><b>{auditReport.pendingBarcodesCount}</b></td>
                    <td><span className="badge draft">{isAr ? 'قائمة المراجعة الميدانية' : 'Field Review Queue'}</span></td>
                  </tr>
                  <tr>
                    <td>{isAr ? 'اختبار عدم تكرار المعرفات أو الباركودات الخاطئة' : 'Duplicate ID & Barcode Format Check'}</td>
                    <td>
                      {auditReport.duplicateProductIds.length === 0 && auditReport.invalidBarcodeFormats.length === 0
                        ? isAr ? 'صفر أخطاء أو تكرار' : '0 Errors / 0 Invalid Formats'
                        : isAr ? 'يوجد ملاحظات' : 'Issues found'}
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>
                        {auditReport.passedAllIntegrityChecks ? 'اجتاز الفحص 100% ✓' : 'تحتاج مراجعة'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* DETAILED PACKAGE, BARCODE & ALTERNATIVES MODAL */}
      {selectedProduct && selectedAlternatives && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999,
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="card stack"
            style={{
              maxWidth: '760px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              background: 'var(--card-bg, #fff)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge" style={{ marginBottom: '6px' }}>{selectedProduct.productId}</span>
                <h2 style={{ margin: 0 }}>{isAr ? selectedProduct.tradeNameAr : selectedProduct.tradeNameEn}</h2>
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  {isAr ? selectedProduct.tradeNameEn : selectedProduct.tradeNameAr} — {selectedProduct.scientificComposition}
                </p>
              </div>
              <button className="btn ghost" onClick={() => setSelectedProduct(null)}>✕</button>
            </div>

            {/* Package, Price & Barcode Verification Box */}
            <div
              className="card"
              style={{
                background: 'var(--bg-subtle, #f8fafc)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
              }}
            >
              <div className="small" style={{ lineHeight: 1.8 }}>
                <div><b>{isAr ? 'التركيز:' : 'Strength:'}</b> <span dir="ltr">{selectedProduct.strength}</span></div>
                <div><b>{isAr ? 'الشكل الصيدلاني:' : 'Dosage Form:'}</b> {selectedProduct.dosageFormLabel[lang]}</div>
                <div><b>{isAr ? 'طريق الإعطاء:' : 'Route:'}</b> {selectedProduct.routeLabel[lang]}</div>
                <div><b>{isAr ? 'تفاصيل العبوة:' : 'Package:'}</b> {selectedProduct.packDetails[lang]}</div>
                <div><b>{isAr ? 'الشركة المصنعة:' : 'Manufacturer:'}</b> {selectedProduct.manufacturer} ({selectedProduct.countryOfOrigin})</div>
              </div>

              <div className="small" style={{ lineHeight: 1.8 }}>
                <div>
                  <b>{isAr ? 'السعر الرسمي المعتمد:' : 'Official Price:'} </b>
                  <span style={{ color: '#15803d', fontWeight: 700, fontSize: '1.05rem' }}>
                    {selectedProduct.priceEgp ? `${selectedProduct.priceEgp.toFixed(2)} ج.م` : 'غير متاح'}
                  </span>{' '}
                  ({selectedProduct.unitPriceNote[lang]})
                </div>
                <div><b>{isAr ? 'تاريخ ومصدر السعر:' : 'Price Source:'}</b> {selectedProduct.priceUpdatedDate} — {selectedProduct.priceSource}</div>
                <div style={{ marginTop: '8px' }}>
                  <b>{isAr ? 'الباركود الخطي للعلبة (EAN-13):' : 'Carton Linear Barcode:'}</b>
                  {selectedProduct.barcode ? (
                    <div
                      dir="ltr"
                      style={{
                        marginTop: '6px',
                        padding: '8px 12px',
                        background: '#fff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          height: '28px',
                          background:
                            'repeating-linear-gradient(90deg, #0f172a 0px, #0f172a 2px, transparent 2px, transparent 4px, #0f172a 4px, #0f172a 5px, transparent 5px, transparent 8px)',
                          marginBottom: '4px',
                        }}
                      />
                      <code style={{ fontWeight: 700, letterSpacing: '3px', fontSize: '1rem' }}>
                        {selectedProduct.barcode}
                      </code>
                      <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>
                        ✓ {selectedProduct.barcodeVerifiedBy}
                      </div>
                    </div>
                  ) : (
                    <div className="notice" style={{ marginTop: '6px', padding: '8px' }}>
                      {isAr
                        ? '⏳ غير متوفر بعد (قيد التحقق الميداني للعبوة) — التزاماً بعدم توليد أي باركود غير مؤكد.'
                        : '⏳ Barcode pending physical carton verification (no fabricated codes).'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3-Tier Alternatives Classification */}
            <div className="stack">
              <h3 style={{ margin: '4px 0 0' }}>
                🔄 {isAr ? 'نظام البدائل الدوائية المقسم علمياً' : 'Scientifically Classified Alternatives'}
              </h3>
              <p className="small muted" style={{ margin: 0 }}>
                {isAr
                  ? 'تنبيه سريري: لا تقم بتغيير المضاد الحيوي أو الجرعة دون مراجعة الطبيب أو الصيدلي.'
                  : 'Clinical Note: Never switch antibiotics or alter dosing without consulting your physician or pharmacist.'}
              </p>

              {/* Tier 1: Exact Equivalents */}
              <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
                <h4 style={{ margin: '0 0 8px', color: '#15803d' }}>
                  1️⃣ {isAr
                    ? `المثائل المتطابقة تماماً (نفس المادة الفعالة والتركيز والشكل الصيدلاني) (${selectedAlternatives.exactEquivalents.length})`
                    : `Exact Generic Equivalents (Same Ingredient, Strength & Dosage Form) (${selectedAlternatives.exactEquivalents.length})`}
                </h4>
                {selectedAlternatives.exactEquivalents.length === 0 ? (
                  <p className="small muted" style={{ margin: 0 }}>
                    {isAr ? 'لا توجد مثائل أخرى مسجلة بنفس التركيز والشكل حالياً.' : 'No other packages with identical strength and form.'}
                  </p>
                ) : (
                  <div className="tablewrap">
                    <table className="tbl small">
                      <thead>
                        <tr>
                          <th>{isAr ? 'الاسم التجاري' : 'Trade Name'}</th>
                          <th>{isAr ? 'الشركة' : 'Company'}</th>
                          <th>{isAr ? 'العبوة' : 'Pack'}</th>
                          <th>{isAr ? 'السعر وفارق التوفير' : 'Price & Difference'}</th>
                          <th>{isAr ? 'الباركود' : 'Barcode'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAlternatives.exactEquivalents.map((alt) => {
                          const diff =
                            selectedProduct.priceEgp && alt.priceEgp
                              ? selectedProduct.priceEgp - alt.priceEgp
                              : 0;
                          return (
                            <tr key={alt.productId}>
                              <td>
                                <b
                                  style={{ cursor: 'pointer', color: '#0284c7' }}
                                  onClick={() => setSelectedProduct(alt)}
                                >
                                  {isAr ? alt.tradeNameAr : alt.tradeNameEn}
                                </b>
                              </td>
                              <td>{alt.manufacturer}</td>
                              <td>{alt.packDetails[lang]}</td>
                              <td>
                                <b>{alt.priceEgp ? `${alt.priceEgp.toFixed(2)} ج.م` : '—'}</b>
                                {diff > 0 && (
                                  <span style={{ display: 'block', color: '#16a34a', fontSize: '0.78rem' }}>
                                    ({isAr ? `يوفر ${diff.toFixed(2)} ج.م` : `Saves ${diff.toFixed(2)} EGP`})
                                  </span>
                                )}
                              </td>
                              <td dir="ltr"><code>{alt.barcode || '—'}</code></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tier 2: Same Ingredient, Different Strength or Form */}
              <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
                <h4 style={{ margin: '0 0 8px', color: '#0369a1' }}>
                  2️⃣ {isAr
                    ? `مستحضرات بنفس المادة الفعالة ولكن بتركيز أو شكل دوائي مختلف (${selectedAlternatives.sameIngredientDifferentFormOrStrength.length})`
                    : `Same Active Ingredient, Different Strength or Dosage Form (${selectedAlternatives.sameIngredientDifferentFormOrStrength.length})`}
                </h4>
                {selectedAlternatives.sameIngredientDifferentFormOrStrength.length === 0 ? (
                  <p className="small muted" style={{ margin: 0 }}>—</p>
                ) : (
                  <div className="row wrapRow" style={{ gap: '8px' }}>
                    {selectedAlternatives.sameIngredientDifferentFormOrStrength.map((alt) => (
                      <button
                        key={alt.productId}
                        className="btn ghost small"
                        style={{ textAlign: isAr ? 'right' : 'left' }}
                        onClick={() => setSelectedProduct(alt)}
                      >
                        {isAr ? alt.tradeNameAr : alt.tradeNameEn} ({alt.strength} - {alt.dosageFormLabel[lang]}) —{' '}
                        {alt.priceEgp ? `${alt.priceEgp} ج.م` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="row wrapRow" style={{ gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Link
                to={`/medicine/${selectedProduct.activeIngredientId}`}
                className="btn"
                onClick={() => setSelectedProduct(null)}
              >
                📖 {isAr ? 'فتح المرجع السريري الكامل والجرعات والتحذيرات' : 'Open Full Clinical Monograph'}
              </Link>
              <Link
                to="/allergy-checker"
                className="btn ghost"
                onClick={() => setSelectedProduct(null)}
              >
                🛡️ {isAr ? 'فحص الحساسية الدوائية لهذا المستحضر' : 'Check Drug Allergy Safety'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
