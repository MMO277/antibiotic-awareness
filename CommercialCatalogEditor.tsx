import { FormEvent, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { pick, tr } from './types';
import {
  ACTIVE_INGREDIENTS,
  AdministrationRoute,
  DOSAGE_FORM_LABELS,
  DosageFormType,
  EgyptianCommercialProduct,
  ROUTE_LABELS,
} from './egyptianDrugDatabase';
import {
  deleteCommercialProductLive,
  resetCommercialCatalogToDefault,
  upsertCommercialProductLive,
  useLiveDrugCatalog,
} from './liveCatalogSync';
import { norm } from './search';

export function QuickProductEditorModal({
  product,
  defaultIngredientId,
  onClose,
  uid,
}: {
  product: EgyptianCommercialProduct | null;
  defaultIngredientId?: string;
  onClose: () => void;
  uid?: string;
}) {
  const { lang } = useLang();
  const { user } = useAuth();
  const isNew = !product;

  const [tradeNameAr, setTradeNameAr] = useState(product?.tradeNameAr || '');
  const [tradeNameEn, setTradeNameEn] = useState(product?.tradeNameEn || '');
  const [activeIngredientId, setActiveIngredientId] = useState(
    product?.activeIngredientId || defaultIngredientId || ACTIVE_INGREDIENTS[0].id
  );
  const [strength, setStrength] = useState(product?.strength || '500 mg');
  const [dosageForm, setDosageForm] = useState<DosageFormType>(product?.dosageForm || 'tablet');
  const [route, setRoute] = useState<AdministrationRoute>(product?.route || 'oral');
  const [packSize, setPackSize] = useState(product?.packSize || '20 Tablets');
  const [manufacturer, setManufacturer] = useState(product?.manufacturer || '');
  const [priceEgp, setPriceEgp] = useState(product?.priceEgp != null ? String(product.priceEgp) : '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!tradeNameEn.trim() && !tradeNameAr.trim()) return;
    setSaving(true);
    try {
      const ing = ACTIVE_INGREDIENTS.find((a) => a.id === activeIngredientId) || ACTIVE_INGREDIENTS[0];
      const numPrice = parseFloat(priceEgp);
      const cleanBarcode = barcode.trim() || null;
      const newProd: EgyptianCommercialProduct = {
        productId: product?.productId || `EG-ABX-CUSTOM-${Date.now()}`,
        tradeNameAr: tradeNameAr.trim() || tradeNameEn.trim(),
        tradeNameEn: tradeNameEn.trim() || tradeNameAr.trim(),
        activeIngredientId: ing.id,
        scientificComposition: ing.nameEn,
        dosageForm,
        dosageFormLabel: DOSAGE_FORM_LABELS[dosageForm] || DOSAGE_FORM_LABELS.tablet,
        route,
        strength: strength.trim() || '500 mg',
        packSize: packSize.trim() || '1 Pack',
        manufacturer: manufacturer.trim() || 'EDA Licensed Pharma',
        countryOfOrigin: product?.countryOfOrigin || 'Egypt',
        registrationStatus: product?.registrationStatus || 'registered_eda',
        availabilityStatus: product?.availabilityStatus || 'available',
        priceEgp: Number.isFinite(numPrice) && numPrice > 0 ? numPrice : null,
        unitPriceNote: product?.unitPriceNote || {
          ar: 'سعر العبوة الكاملة وفق تسعيرة هيئة الدواء المصرية',
          en: 'Full pack official EDA retail price',
        },
        priceStatus: 'verified_eda',
        priceUpdatedDate: new Date().toISOString().slice(0, 10),
        priceSource: 'Egyptian Drug Authority (EDA)',
        barcode: cleanBarcode,
        barcodeType: cleanBarcode ? 'EAN-13' : 'UNAVAILABLE',
        barcodeStatus: cleanBarcode ? 'verified' : 'unverified_pending',
        barcodeVerifiedBy: user?.email || 'Clinical Editor',
        equivalenceGroupKey: `${ing.id}_${strength.trim().toLowerCase().replace(/\s+/g, '')}_${dosageForm}`,
      };
      await upsertCommercialProductLive(newProd, uid || user?.uid || 'editor');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <form
        className="card form"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        style={{
          maxWidth: '620px',
          width: '100%',
          maxHeight: '92dvh',
          overflowY: 'auto',
          border: '2px solid #0284c7',
        }}
      >
        <div className="head">
          <h3 style={{ margin: 0 }}>
            💊{' '}
            {isNew
              ? tr(lang, 'إضافة مستحضر تجاري جديد للسجل', 'Add New Commercial Drug Package')
              : tr(lang, `تعديل بيانات المستحضر: ${product.tradeNameEn}`, `Edit Commercial Package: ${product.tradeNameEn}`)}
          </h3>
          <button type="button" className="btn ghost small" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div>
            <label>{tr(lang, 'الاسم التجاري (بالعربية) *', 'Trade Name (Arabic) *')}</label>
            <input
              dir="rtl"
              required
              value={tradeNameAr}
              onChange={(e) => setTradeNameAr(e.target.value)}
              placeholder="مثال: أوجمنتين 1 جم"
            />
          </div>
          <div>
            <label>{tr(lang, 'الاسم التجاري (بالإنجليزية) *', 'Trade Name (English) *')}</label>
            <input
              dir="ltr"
              required
              value={tradeNameEn}
              onChange={(e) => setTradeNameEn(e.target.value)}
              placeholder="e.g. Augmentin 1g"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div>
            <label>{tr(lang, 'المادة الفعالة العلمية', 'Active Ingredient')}</label>
            <select value={activeIngredientId} onChange={(e) => setActiveIngredientId(e.target.value)}>
              {ACTIVE_INGREDIENTS.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.nameEn} ({ing.nameAr})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>{tr(lang, 'التركيز الدوائي', 'Strength')}</label>
            <input
              dir="ltr"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              placeholder="e.g. 1000 mg or 457 mg / 5 mL"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div>
            <label>{tr(lang, 'الشكل الصيدلاني', 'Dosage Form')}</label>
            <select value={dosageForm} onChange={(e) => setDosageForm(e.target.value as DosageFormType)}>
              {(Object.keys(DOSAGE_FORM_LABELS) as DosageFormType[]).map((df) => (
                <option key={df} value={df}>
                  {pick(DOSAGE_FORM_LABELS[df], lang)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>{tr(lang, 'طريق الإعطاء', 'Route')}</label>
            <select value={route} onChange={(e) => setRoute(e.target.value as AdministrationRoute)}>
              {(Object.keys(ROUTE_LABELS) as AdministrationRoute[]).map((rt) => (
                <option key={rt} value={rt}>
                  {pick(ROUTE_LABELS[rt], lang)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>{tr(lang, 'حجم العبوة', 'Pack Size')}</label>
            <input dir="ltr" value={packSize} onChange={(e) => setPackSize(e.target.value)} placeholder="e.g. 14 Film-coated tablets" />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div>
            <label>{tr(lang, 'السعر الرسمي (ج.م / EGP)', 'Official Price (EGP)')}</label>
            <input
              type="number"
              step="0.25"
              dir="ltr"
              value={priceEgp}
              onChange={(e) => setPriceEgp(e.target.value)}
              placeholder="e.g. 190.00"
            />
          </div>
          <div>
            <label>{tr(lang, 'الباركود الخطي (EAN-13)', 'Linear Barcode (EAN-13)')}</label>
            <input
              dir="ltr"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 6221127005436"
            />
          </div>
          <div>
            <label>{tr(lang, 'الشركة المصنعة', 'Manufacturer')}</label>
            <input
              dir="ltr"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. GSK / EIPICO / Pharco"
            />
          </div>
        </div>

        <div className="row wrapRow" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <button type="button" className="btn ghost" onClick={onClose}>
            {tr(lang, 'إلغاء', 'Cancel')}
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving
              ? tr(lang, 'جارٍ الحفظ...', 'Saving...')
              : tr(lang, '💾 حفظ ونشر التعديل فوراً', '💾 Save & Publish Live')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default function CommercialCatalogTab({ uid }: { uid: string }) {
  const { lang } = useLang();
  const { products } = useLiveDrugCatalog();
  const [search, setSearch] = useState('');
  const [ingFilter, setIngFilter] = useState('all');
  const [editing, setEditing] = useState<EgyptianCommercialProduct | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = norm(search);
    return products.filter((p) => {
      if (ingFilter !== 'all' && p.activeIngredientId !== ingFilter) return false;
      if (!q) return true;
      const hay = norm(`${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition} ${p.manufacturer} ${p.barcode || ''}`);
      return hay.includes(q);
    });
  }, [products, search, ingFilter]);

  const handleDelete = async (p: EgyptianCommercialProduct) => {
    if (!window.confirm(tr(lang, `حذف المستحضر ${p.tradeNameEn}؟`, `Delete ${p.tradeNameEn}?`))) return;
    await deleteCommercialProductLive(p.productId, uid);
  };

  const handleReset = async () => {
    if (!window.confirm(tr(lang, 'استعادة القائمة الافتراضية المعتمدة (206 عبوات)؟', 'Restore default verified catalog (206 packages)?'))) return;
    await resetCommercialCatalogToDefault(uid);
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              💊 {tr(lang, `إدارة السجل التجاري والأسعار والباركود (${products.length} عبوة)`, `Commercial Drug Catalog, Prices & Barcodes (${products.length})`)}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {tr(
                lang,
                'عدّل الأسعار الرسمية والباركود أو أضف مستحضرات جديدة لتظهر فوراً في البحث وحاسبة البديل الأرخص.',
                'Edit official EGP prices, barcodes, or add new commercial packages live.'
              )}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn" onClick={() => setAdding(true)}>
              ➕ {tr(lang, 'إضافة دواء تجاري جديد', 'Add Commercial Drug')}
            </button>
            <button type="button" className="btn ghost small" onClick={handleReset}>
              🔄 {tr(lang, 'استعادة الافتراضي', 'Reset Default')}
            </button>
          </div>
        </div>

        <div className="row wrapRow" style={{ gap: '10px', marginTop: '12px' }}>
          <input
            style={{ flex: '2 1 240px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr(lang, 'ابحث بالاسم التجاري أو الباركود أو الشركة...', 'Search by trade name, barcode, or manufacturer...')}
          />
          <select style={{ flex: '1 1 200px' }} value={ingFilter} onChange={(e) => setIngFilter(e.target.value)}>
            <option value="all">{tr(lang, 'كل المواد الفعالة (32)', 'All Active Ingredients (32)')}</option>
            {ACTIVE_INGREDIENTS.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.nameEn} ({ing.nameAr})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tablewrap card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>{tr(lang, 'الاسم التجاري', 'Trade Name')}</th>
              <th>{tr(lang, 'المادة الفعالة والتركيز', 'Active Ingredient & Strength')}</th>
              <th>{tr(lang, 'الشركة والعبوة', 'Maker & Pack')}</th>
              <th>{tr(lang, 'السعر (EGP)', 'Price (EGP)')}</th>
              <th>{tr(lang, 'الباركود', 'Barcode')}</th>
              <th>{tr(lang, 'إجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 80).map((p) => (
              <tr key={p.productId}>
                <td>
                  <b>{lang === 'ar' ? p.tradeNameAr : p.tradeNameEn}</b>
                  <div className="small muted">{lang === 'ar' ? p.tradeNameEn : p.tradeNameAr}</div>
                </td>
                <td>
                  <div>{p.scientificComposition}</div>
                  <span className="small muted">{p.strength} · {pick(p.dosageFormLabel, lang)}</span>
                </td>
                <td>
                  <div>{p.manufacturer}</div>
                  <span className="small muted">{p.packSize}</span>
                </td>
                <td>
                  <b>{p.priceEgp ? `${p.priceEgp.toFixed(2)} EGP` : '—'}</b>
                </td>
                <td>
                  <code dir="ltr">{p.barcode || '—'}</code>
                </td>
                <td>
                  <div className="row" style={{ gap: '6px' }}>
                    <button type="button" className="btn small ghost" onClick={() => setEditing(p)}>
                      ✏️ {tr(lang, 'تعديل', 'Edit')}
                    </button>
                    <button type="button" className="btn small danger" onClick={() => handleDelete(p)}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || adding) && (
        <QuickProductEditorModal
          product={editing}
          uid={uid}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}
