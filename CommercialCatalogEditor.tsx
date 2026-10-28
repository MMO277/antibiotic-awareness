import { FormEvent, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { pick, tr } from './types';
import { useAuth } from './authContext';
import {
  AdministrationRoute,
  DOSAGE_FORM_LABELS,
  DosageFormType,
  EgyptianCommercialProduct,
  ROUTE_LABELS,
} from './egyptianDrugDatabase';
import {
  deleteCommercialProductLive,
  generateNextProductId,
  resetCommercialProductToDefault,
  saveCommercialProductLive,
  useLiveDrugCatalog,
} from './liveCatalogSync';
import { norm } from './search';

export function createEmptyCommercialProduct(defaultIngId = 'amoxicillin-clavulanic-acid'): EgyptianCommercialProduct {
  const newId = generateNextProductId();
  return {
    productId: newId,
    tradeNameAr: '',
    tradeNameEn: '',
    activeIngredientId: defaultIngId,
    scientificComposition: '',
    strength: '500 mg',
    dosageForm: 'tablet',
    dosageFormLabel: DOSAGE_FORM_LABELS.tablet,
    route: 'oral',
    routeLabel: ROUTE_LABELS.oral,
    packDetails: { ar: '10 أقراص مغلفة', en: '10 Film-coated tablets' },
    manufacturer: '',
    countryOfOrigin: 'Egypt',
    registrationStatus: 'registered_eda',
    availabilityStatus: 'available',
    priceEgp: 0,
    unitPriceNote: { ar: '', en: '' },
    priceStatus: 'verified_eda',
    priceUpdatedDate: new Date().toISOString().slice(0, 10),
    priceSource: 'تحديث مباشر بواسطة محرر المنصة (Live Editor)',
    barcode: '',
    barcodeType: 'EAN-13',
    barcodeStatus: 'verified',
    barcodeVerifiedBy: 'تم التوثيق بواسطة المحرر',
    equivalenceGroupKey: `${defaultIngId}|500mg|tablet|oral`,
  };
}

export interface QuickProductEditorModalProps {
  product?: EgyptianCommercialProduct | null;
  isNew?: boolean;
  uid?: string;
  defaultIngredientId?: string;
  onClose: () => void;
  onSaved?: (saved: EgyptianCommercialProduct) => void;
}

export function QuickProductEditorModal({
  product,
  isNew: isNewProp,
  uid: uidProp,
  defaultIngredientId = 'amoxicillin-clavulanic-acid',
  onClose,
  onSaved,
}: QuickProductEditorModalProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const uid = uidProp || user?.uid || 'editor';
  const isNew = isNewProp ?? !product;
  const { ingredients, isBaseProduct, isProductModified } = useLiveDrugCatalog();

  const initialTarget = useMemo<EgyptianCommercialProduct>(
    () => product ?? createEmptyCommercialProduct(defaultIngredientId),
    [product, defaultIngredientId]
  );

  const [draft, setDraft] = useState<EgyptianCommercialProduct>(() => ({
    ...initialTarget,
    packDetails: { ...initialTarget.packDetails },
    unitPriceNote: { ...initialTarget.unitPriceNote },
  }));
  const [priceStr, setPriceStr] = useState<string>(
    initialTarget.priceEgp !== null && initialTarget.priceEgp !== undefined ? String(initialTarget.priceEgp) : ''
  );
  const [barcodeStr, setBarcodeStr] = useState<string>(initialTarget.barcode || '');
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const handleIngChange = (newIngId: string) => {
    const ing = ingredients.find((a) => a.id === newIngId);
    setDraft((prev) => ({
      ...prev,
      activeIngredientId: newIngId,
      scientificComposition: prev.scientificComposition || (ing ? `${ing.nameEn} ${prev.strength}` : ''),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    if (!draft.tradeNameAr.trim() && !draft.tradeNameEn.trim()) {
      setErrMsg(tr(lang, 'يرجى إدخال الاسم التجاري للدواء (بالعربية أو الإنجليزية).', 'Please enter the trade name (Arabic or English).'));
      return;
    }

    const parsedPrice = priceStr.trim() !== '' ? Number(priceStr) : null;
    if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      setErrMsg(tr(lang, 'يرجى إدخال سعر صحيح بالأرقام.', 'Please enter a valid numeric price.'));
      return;
    }

    setSaving(true);
    try {
      const normStrength = (draft.strength || '').toLowerCase().replace(/\s+/g, '');
      const eqKey = `${draft.activeIngredientId}|${normStrength}|${draft.dosageForm}|${draft.route}`;
      const cleanBarcode = barcodeStr.trim() || null;

      const toSave: EgyptianCommercialProduct = {
        ...draft,
        tradeNameAr: draft.tradeNameAr.trim() || draft.tradeNameEn.trim(),
        tradeNameEn: draft.tradeNameEn.trim() || draft.tradeNameAr.trim(),
        scientificComposition:
          draft.scientificComposition.trim() ||
          `${ingredients.find((a) => a.id === draft.activeIngredientId)?.nameEn || draft.activeIngredientId} ${draft.strength}`,
        dosageFormLabel: DOSAGE_FORM_LABELS[draft.dosageForm] || DOSAGE_FORM_LABELS.tablet,
        routeLabel: ROUTE_LABELS[draft.route] || ROUTE_LABELS.oral,
        priceEgp: parsedPrice,
        barcode: cleanBarcode,
        barcodeType: cleanBarcode ? 'EAN-13' : 'UNAVAILABLE',
        barcodeStatus: cleanBarcode ? 'verified' : 'unverified_pending',
        equivalenceGroupKey: eqKey,
      };

      const saved = await saveCommercialProductLive(toSave, uid);
      if (onSaved) onSaved(saved);
      onClose();
    } catch {
      setErrMsg(
        tr(
          lang,
          'تعذر الحفظ في السحابة. تأكد من تسجيل دخولك بحساب يمتلك صلاحية (editor أو reviewer أو admin).',
          'Failed to save to cloud. Ensure you are signed in with an editor, reviewer, or admin role.'
        )
      );
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!confirm(tr(lang, 'هل تريد استعادة البيانات الافتراضية الأصلية لهذا الدواء؟', 'Reset this product to its original factory defaults?'))) return;
    setSaving(true);
    try {
      await resetCommercialProductToDefault(draft.productId, uid);
      onClose();
    } catch {
      setErrMsg(tr(lang, 'حدث خطأ أثناء الاستعادة.', 'Failed to reset.'));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(tr(lang, `هل أنت متأكد من حذف المستحضر (${draft.tradeNameAr || draft.tradeNameEn}) من القائمة؟`, `Delete (${draft.tradeNameEn || draft.tradeNameAr})?`))) return;
    setSaving(true);
    try {
      await deleteCommercialProductLive(draft.productId, uid);
      onClose();
    } catch {
      setErrMsg(tr(lang, 'حدث خطأ أثناء الحذف.', 'Failed to delete.'));
      setSaving(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 10050,
      }}
      onClick={onClose}
    >
      <form
        className="card stack"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '22px',
          background: 'var(--card-bg, #ffffff)',
          borderTop: '4px solid #0e9aa7',
        }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, marginBottom: '4px' }}>
              {isNew ? `➕ ${tr(lang, 'إضافة دواء جديد', 'New Commercial Product')}` : `✏️ ${draft.productId}`}
            </span>
            <h2 style={{ margin: '4px 0 0' }}>
              {isNew
                ? tr(lang, 'إضافة مستحضر دوائي تجاري جديد للسوق المصري', 'Add New Commercial Medication Package')
                : tr(lang, `تعديل بيانات وسعر وباركود: ${draft.tradeNameAr || draft.tradeNameEn}`, `Edit Price, Barcode & Details: ${draft.tradeNameEn}`)}
            </h2>
          </div>
          <button type="button" className="btn ghost small" onClick={onClose}>✕</button>
        </div>

        <p className="small muted" style={{ margin: 0 }}>
          ⚡{' '}
          {tr(
            lang,
            'بمجرد الضغط على «حفظ ونشر فوري»، يتم تحديث السعر والباركود والبيانات في قاعدة بيانات Firebase السحابية وتظهر التعديلات فوراً لجميع المستخدمين في كل صفحات الموقع.',
            'Clicking "Save & Publish Live" updates Firebase Firestore immediately and syncs changes in real time to all users across the platform.'
          )}
        </p>

        {/* Row 1: Active Ingredient & Product ID */}
        <div className="grid" style={{ gap: '12px' }}>
          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              🧪 {tr(lang, 'المادة الفعالة التابع لها الدواء:', 'Active Ingredient:')}
            </label>
            <select
              className="input"
              value={draft.activeIngredientId}
              onChange={(e) => handleIngChange(e.target.value)}
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {isAr ? `${ing.nameAr} (${ing.nameEn})` : `${ing.nameEn} (${ing.nameAr})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              🆔 {tr(lang, 'كود العبوة المرجعي (Product ID):', 'Product ID:')}
            </label>
            <input
              type="text"
              dir="ltr"
              className="input"
              value={draft.productId}
              readOnly={!isNew}
              onChange={(e) => setDraft({ ...draft, productId: e.target.value.trim() })}
            />
          </div>
        </div>

        {/* Row 2: Trade Name AR & EN */}
        <div className="grid" style={{ gap: '12px' }}>
          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              🇪🇬 {tr(lang, 'الاسم التجاري بالعربية:', 'Trade Name (Arabic):')}
            </label>
            <input
              type="text"
              dir="rtl"
              className="input"
              required
              placeholder="مثال: أوجمنتين 1 جم أقراص"
              value={draft.tradeNameAr}
              onChange={(e) => setDraft({ ...draft, tradeNameAr: e.target.value })}
            />
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              🇬🇧 {tr(lang, 'الاسم التجاري بالإنجليزية:', 'Trade Name (English):')}
            </label>
            <input
              type="text"
              dir="ltr"
              className="input"
              required
              placeholder="e.g. Augmentin 1g Tablets"
              value={draft.tradeNameEn}
              onChange={(e) => setDraft({ ...draft, tradeNameEn: e.target.value })}
            />
          </div>
        </div>

        {/* Row 3: Price (EGP) & Barcode (EAN-13) — Highlighted */}
        <div
          className="grid"
          style={{
            gap: '12px',
            padding: '14px',
            borderRadius: '12px',
            background: 'var(--tint)',
            border: '1.5px solid #0e9aa7',
          }}
        >
          <div>
            <label className="small" style={{ fontWeight: 800, color: '#15803d', display: 'block', marginBottom: '4px' }}>
              💰 {tr(lang, 'السعر الرسمي للعبوة بالجنيه المصري (EGP):', 'Official Pack Price (EGP):')}
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              dir="ltr"
              className="input"
              placeholder="131.50"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
            />
            <input
              type="text"
              className="input"
              style={{ marginTop: '6px', fontSize: '0.82rem' }}
              placeholder={tr(lang, 'تفصيل سعر الشريط (مثال: الشريط: 65.75 ج.م)', 'Unit/Strip note (e.g., Strip: 65.75 EGP)')}
              value={isAr ? draft.unitPriceNote.ar : draft.unitPriceNote.en}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  unitPriceNote: {
                    ar: isAr ? e.target.value : draft.unitPriceNote.ar || e.target.value,
                    en: !isAr ? e.target.value : draft.unitPriceNote.en || e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <label className="small" style={{ fontWeight: 800, color: '#0369a1', display: 'block', marginBottom: '4px' }}>
              📷 {tr(lang, 'الباركود الخطي للعلبة (EAN-13 / 622...):', 'Linear Carton Barcode (EAN-13):')}
            </label>
            <input
              type="text"
              dir="ltr"
              className="input"
              placeholder="6221127005436"
              value={barcodeStr}
              onChange={(e) => setBarcodeStr(e.target.value)}
            />
            <span className="small muted" style={{ display: 'block', marginTop: '6px' }}>
              {barcodeStr.trim()
                ? `✓ ${tr(lang, 'سيتم اعتماده كباركود موثق وقابل للمسح بالكاميرا فوراً', 'Will be marked as Verified & scannable via camera')}`
                : tr(lang, 'اتركه فارغاً إذا كان الباركود قيد التحقق الميداني', 'Leave blank if barcode is pending physical check')}
            </span>
          </div>
        </div>

        {/* Row 4: Strength, Dosage Form, Route */}
        <div className="grid" style={{ gap: '12px' }}>
          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              ⚖️ {tr(lang, 'التركيز (Strength):', 'Strength:')}
            </label>
            <input
              type="text"
              dir="ltr"
              className="input"
              placeholder="1000 mg / 500 mg / 457 mg/5mL"
              value={draft.strength}
              onChange={(e) => setDraft({ ...draft, strength: e.target.value })}
            />
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              💊 {tr(lang, 'الشكل الصيدلاني:', 'Dosage Form:')}
            </label>
            <select
              className="input"
              value={draft.dosageForm}
              onChange={(e) => setDraft({ ...draft, dosageForm: e.target.value as DosageFormType })}
            >
              {(Object.keys(DOSAGE_FORM_LABELS) as DosageFormType[]).map((df) => (
                <option key={df} value={df}>
                  {pick(DOSAGE_FORM_LABELS[df], lang)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              💉 {tr(lang, 'طريق الإعطاء:', 'Administration Route:')}
            </label>
            <select
              className="input"
              value={draft.route}
              onChange={(e) => setDraft({ ...draft, route: e.target.value as AdministrationRoute })}
            >
              {(Object.keys(ROUTE_LABELS) as AdministrationRoute[]).map((rt) => (
                <option key={rt} value={rt}>
                  {pick(ROUTE_LABELS[rt], lang)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 5: Pack Details, Manufacturer, Country */}
        <div className="grid" style={{ gap: '12px' }}>
          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              📦 {tr(lang, 'وصف العبوة (عدد الأقراص / الحجم):', 'Package Details:')}
            </label>
            <input
              type="text"
              className="input"
              placeholder={isAr ? '14 قرص مغلف (شريطان)' : '14 Film-coated tablets'}
              value={isAr ? draft.packDetails.ar : draft.packDetails.en}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  packDetails: {
                    ar: isAr ? e.target.value : draft.packDetails.ar || e.target.value,
                    en: !isAr ? e.target.value : draft.packDetails.en || e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              🏭 {tr(lang, 'الشركة المصنعة:', 'Manufacturer:')}
            </label>
            <input
              type="text"
              className="input"
              placeholder="GSK / EIPICO / Amoun / Pharco..."
              value={draft.manufacturer}
              onChange={(e) => setDraft({ ...draft, manufacturer: e.target.value })}
            />
          </div>
        </div>

        {errMsg && <p className="alert">{errMsg}</p>}

        {/* Footer Actions */}
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            {!isNew && isBaseProduct(draft.productId) && isProductModified(draft.productId) && (
              <button
                type="button"
                className="btn ghost small"
                onClick={handleResetDefault}
                disabled={saving}
              >
                ↺ {tr(lang, 'استعادة القيم الأصلية', 'Reset to Default')}
              </button>
            )}
            {!isNew && (
              <button
                type="button"
                className="btn danger small"
                onClick={handleDelete}
                disabled={saving}
              >
                🗑️ {tr(lang, 'حذف العبوة', 'Delete')}
              </button>
            )}
          </div>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>
              {tr(lang, 'إلغاء', 'Cancel')}
            </button>
            <button type="submit" className="btn" style={{ background: '#15803d' }} disabled={saving}>
              {saving
                ? tr(lang, 'جارٍ النشر الفوري...', 'Publishing Live...')
                : `💾 ${tr(lang, 'حفظ ونشر فوري لجميع المستخدمين', 'Save & Publish Live')}`}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default function CommercialCatalogTab({ uid }: { uid: string }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { products, ingredients, catalogPayload, isProductModified } = useLiveDrugCatalog();

  const [q, setQ] = useState('');
  const [ingFilter, setIngFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'modified' | 'missing_barcode' | 'verified_barcode'>('all');
  const [editingProd, setEditingProd] = useState<EgyptianCommercialProduct | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Inline quick price/barcode draft state for 1-click row saving
  const [inlineDrafts, setInlineDrafts] = useState<Record<string, { price: string; barcode: string }>>({});
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');

  const modifiedCount = Object.keys(catalogPayload.overrides || {}).length;
  const customAddedCount = (catalogPayload.customProducts || []).length;
  const missingBarcodeCount = products.filter((p) => !p.barcode).length;

  const filtered = useMemo(() => {
    const clean = norm(q);
    return products.filter((p) => {
      if (ingFilter !== 'all' && p.activeIngredientId !== ingFilter) return false;
      if (statusFilter === 'modified' && !isProductModified(p.productId) && !catalogPayload.customProducts.some((c) => c.productId === p.productId)) {
        return false;
      }
      if (statusFilter === 'missing_barcode' && p.barcode) return false;
      if (statusFilter === 'verified_barcode' && !p.barcode) return false;

      if (!clean) return true;
      const hay = norm(
        `${p.productId} ${p.tradeNameAr} ${p.tradeNameEn} ${p.scientificComposition} ${p.manufacturer} ${p.barcode || ''} ${p.strength}`
      );
      return hay.includes(clean);
    });
  }, [products, q, ingFilter, statusFilter, isProductModified, catalogPayload.customProducts]);

  const getInlineDraft = (p: EgyptianCommercialProduct) => {
    return (
      inlineDrafts[p.productId] || {
        price: p.priceEgp !== null && p.priceEgp !== undefined ? String(p.priceEgp) : '',
        barcode: p.barcode || '',
      }
    );
  };

  const handleQuickRowSave = async (p: EgyptianCommercialProduct) => {
    const d = getInlineDraft(p);
    const parsedPrice = d.price.trim() !== '' ? Number(d.price) : null;
    if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      alert(tr(lang, 'يرجى إدخال سعر رقمي صحيح.', 'Please enter a valid numeric price.'));
      return;
    }
    setSavingRowId(p.productId);
    try {
      await saveCommercialProductLive(
        {
          ...p,
          priceEgp: parsedPrice,
          barcode: d.barcode.trim() || null,
        },
        uid
      );
      setToastMsg(
        tr(
          lang,
          `✅ تم تحديث (${isAr ? p.tradeNameAr : p.tradeNameEn}) ونشره فوراً لجميع المستخدمين!`,
          `✅ Updated (${p.tradeNameEn}) and published live to all users!`
        )
      );
      window.setTimeout(() => setToastMsg(''), 3500);
    } catch {
      alert(tr(lang, 'تعذر حفظ التعديل. تأكد من صلاحية حسابك.', 'Failed to save change.'));
    }
    setSavingRowId(null);
  };

  return (
    <div className="stack">
      {/* Live Cloud Sync Banner & KPIs */}
      <section className="card highlight-card">
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 800, marginBottom: '6px' }}>
              ☁️ {tr(lang, 'متصل مباشرة بقاعدة بيانات Firebase للمستخدمين (Real-Time Sync)', 'Live Firestore Sync Active')}
            </span>
            <h2 style={{ margin: '4px 0' }}>
              {tr(
                lang,
                'إدارة الأدوية التجارية والأسعار والباركود بدون تعديل الكود',
                'Live Commercial Drug, Price & Barcode Manager (No-Code CMS)'
              )}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {tr(
                lang,
                'عدّل سعر أي دواء أو أضف باركود العلبة أو أضف مستحضراً جديداً، وسينعكس التحديث في نفس اللحظة عند جميع الزوار في السجل الدوائي وحاسبة التوفير وماسح الباركود.',
                'Edit any drug price, verify/add a barcode, or add a new commercial package—all updates broadcast immediately to all visitors.'
              )}
            </p>
          </div>
          <button
            type="button"
            className="btn"
            style={{ background: '#15803d' }}
            onClick={() => {
              setEditingProd(createEmptyCommercialProduct(ingFilter !== 'all' ? ingFilter : 'amoxicillin-clavulanic-acid'));
              setIsCreatingNew(true);
            }}
          >
            ➕ {tr(lang, 'إضافة دواء / عبوة تجارية جديدة', 'Add New Commercial Drug')}
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
            gap: '10px',
            marginTop: '14px',
          }}
        >
          <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
            <strong style={{ fontSize: '1.35rem', color: '#0284c7' }}>{products.length}</strong>
            <div className="small muted">{tr(lang, 'إجمالي الأدوية النشطة', 'Total Active Packages')}</div>
          </div>
          <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
            <strong style={{ fontSize: '1.35rem', color: '#16a34a' }}>{modifiedCount + customAddedCount}</strong>
            <div className="small muted">{tr(lang, 'تعديلات وإضافات سحابية حية', 'Live Cloud Edits & Additions')}</div>
          </div>
          <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
            <strong style={{ fontSize: '1.35rem', color: '#d97706' }}>{missingBarcodeCount}</strong>
            <div className="small muted">{tr(lang, 'عبوات بانتظار إضافة باركود', 'Pending Barcode Entry')}</div>
          </div>
        </div>
      </section>

      {toastMsg && (
        <div className="notice" style={{ background: '#dcfce7', borderColor: '#16a34a', color: '#166534', fontWeight: 700 }}>
          {toastMsg}
        </div>
      )}

      {/* Search & Filters */}
      <section className="card">
        <div className="grid" style={{ gap: '10px' }}>
          <div>
            <label className="small muted" style={{ fontWeight: 700 }}>
              🔍 {tr(lang, 'بحث سريع بالاسم أو الباركود أو الكود:', 'Quick Search:')}
            </label>
            <input
              type="search"
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tr(lang, 'ابحث عن أوجمنتين، زيثروماكس، 622...', 'Search Augmentin, Zithromax, 622...')}
            />
          </div>

          <div>
            <label className="small muted" style={{ fontWeight: 700 }}>
              🧪 {tr(lang, 'تصفية حسب المادة الفعالة:', 'Filter by Active Ingredient:')}
            </label>
            <select className="input" value={ingFilter} onChange={(e) => setIngFilter(e.target.value)}>
              <option value="all">{tr(lang, 'جميع المواد الفعالة (32)', 'All Active Ingredients (32)')}</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {isAr ? ing.nameAr : ing.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="small muted" style={{ fontWeight: 700 }}>
              🏷️ {tr(lang, 'تصفية حسب حالة الباركود والتعديل:', 'Filter by Status:')}
            </label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="all">{tr(lang, `عرض الكل (${products.length})`, `Show All (${products.length})`)}</option>
              <option value="missing_barcode">{tr(lang, `بدون باركود - لإضافته سريعاً (${missingBarcodeCount})`, `Missing Barcode (${missingBarcodeCount})`)}</option>
              <option value="verified_barcode">{tr(lang, 'موثق الباركود فقط', 'Verified Barcode Only')}</option>
              <option value="modified">{tr(lang, `المعدلة أو المضافة حديثاً (${modifiedCount + customAddedCount})`, `Modified / Custom Only (${modifiedCount + customAddedCount})`)}</option>
            </select>
          </div>
        </div>

        {/* Inline-Editable Table of Commercial Packages */}
        <div className="tablewrap" style={{ marginTop: '14px' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>{tr(lang, 'المستحضر التجاري والمادة', 'Trade Name & Ingredient')}</th>
                <th>{tr(lang, 'التركيز والشركة', 'Strength & Maker')}</th>
                <th>{tr(lang, 'السعر الرسمي (ج.م) [تعديل مباشر]', 'Price (EGP) [Inline Edit]')}</th>
                <th>{tr(lang, 'الباركود الخطي (EAN-13) [تعديل مباشر]', 'Barcode [Inline Edit]')}</th>
                <th>{tr(lang, 'حفظ / تعديل كامل', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const d = getInlineDraft(p);
                const isModified = isProductModified(p.productId);
                const isDirty =
                  d.price !== (p.priceEgp !== null && p.priceEgp !== undefined ? String(p.priceEgp) : '') ||
                  d.barcode !== (p.barcode || '');
                return (
                  <tr
                    key={p.productId}
                    style={{
                      background: isDirty ? 'rgba(22, 163, 74, 0.08)' : isModified ? 'rgba(14, 154, 167, 0.06)' : undefined,
                    }}
                  >
                    <td>
                      <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                        <b>{isAr ? p.tradeNameAr : p.tradeNameEn}</b>
                        {isModified && (
                          <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>
                            {tr(lang, 'معدّل سحابياً ✓', 'Edited ✓')}
                          </span>
                        )}
                      </div>
                      <div className="small muted">{isAr ? p.tradeNameEn : p.tradeNameAr}</div>
                      <div className="small">
                        <Link to={`/medicine/${p.activeIngredientId}`} className="muted">
                          🔗 {p.scientificComposition}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <b dir="ltr">{p.strength}</b>
                      <div className="small muted">{pick(p.dosageFormLabel, lang)}</div>
                      <div className="small muted">{p.manufacturer}</div>
                    </td>
                    <td style={{ minWidth: '130px' }}>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        dir="ltr"
                        className="input"
                        style={{ padding: '6px 8px', fontWeight: 700, color: '#15803d' }}
                        value={d.price}
                        onChange={(e) =>
                          setInlineDrafts((prev) => ({
                            ...prev,
                            [p.productId]: { ...d, price: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td style={{ minWidth: '175px' }}>
                      <input
                        type="text"
                        dir="ltr"
                        className="input"
                        placeholder="622..."
                        style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}
                        value={d.barcode}
                        onChange={(e) =>
                          setInlineDrafts((prev) => ({
                            ...prev,
                            [p.productId]: { ...d, barcode: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <div className="row wrapRow" style={{ gap: '6px' }}>
                        <button
                          type="button"
                          className="btn small"
                          style={{
                            background: isDirty ? '#16a34a' : '#0e9aa7',
                            padding: '6px 10px',
                          }}
                          disabled={savingRowId === p.productId}
                          onClick={() => handleQuickRowSave(p)}
                        >
                          {savingRowId === p.productId
                            ? '...'
                            : isDirty
                              ? `💾 ${tr(lang, 'حفظ الآن', 'Save Now')}`
                              : `💾 ${tr(lang, 'حفظ', 'Save')}`}
                        </button>
                        <button
                          type="button"
                          className="btn ghost small"
                          style={{ padding: '6px 10px' }}
                          onClick={() => {
                            setEditingProd(p);
                            setIsCreatingNew(false);
                          }}
                        >
                          ✏️ {tr(lang, 'كامل البيانات', 'Full Edit')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {editingProd && (
        <QuickProductEditorModal
          product={editingProd}
          isNew={isCreatingNew}
          uid={uid}
          onClose={() => {
            setEditingProd(null);
            setIsCreatingNew(false);
          }}
          onSaved={(saved) => {
            setToastMsg(
              tr(
                lang,
                `✅ تم حفظ ونشر (${isAr ? saved.tradeNameAr : saved.tradeNameEn}) لجميع المستخدمين بنجاح!`,
                `✅ Saved & published (${saved.tradeNameEn}) live to all users!`
              )
            );
            window.setTimeout(() => setToastMsg(''), 4000);
          }}
        />
      )}
    </div>
  );
}
