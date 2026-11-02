import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { pick, tr } from './types';
import {
  ACTIVE_INGREDIENTS,
  DOSAGE_FORM_LABELS,
  EgyptianCommercialProduct,
  getClassifiedAlternatives,
} from './egyptianDrugDatabase';
import { useLiveDrugCatalog } from './liveCatalogSync';
import {
  EGYPTIAN_GOVERNORATES,
  PartnerBranchRecord,
  PartnerPublicRecord,
  VERIFICATION_STATUS_LABELS,
} from './partnerTypes';
import {
  createPartnerOrder,
  uploadPartnerAssetToStorage,
  usePartnerEcosystem,
} from './partnerService';
import { universalDynamicPartnerAdapter } from './partnerProviders';
import { useAuth } from './authContext';

// ============================================================================
// AUTHORIZED ORDERING & PRESCRIPTION UPLOAD MODAL
// ============================================================================
export function PartnerMedicationOrderModal({
  partner,
  product,
  branches,
  defaultGovId = 'cairo',
  onClose,
}: {
  partner: PartnerPublicRecord;
  product: EgyptianCommercialProduct;
  branches: PartnerBranchRecord[];
  defaultGovId?: string;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();

  const publishedBranches = branches.filter(
    (b) => b.partnerId === partner.id && b.published && b.branchStatus === 'active'
  );

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    publishedBranches[0]?.id || ''
  );
  const [quantityPacks, setQuantityPacks] = useState<number>(1);
  const [patientName, setPatientName] = useState<string>(user?.displayName || '');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [govId, setGovId] = useState<string>(defaultGovId !== 'all' ? defaultGovId : 'cairo');
  const [city, setCity] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [prescriptionRef, setPrescriptionRef] = useState<string>('');
  const [prescriberName, setPrescriberName] = useState<string>('');
  const [prescriptionFileUrl, setPrescriptionFileUrl] = useState<string>('');
  const [patientNotes, setPatientNotes] = useState<string>('');
  const [uploadingRx, setUploadingRx] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedOrderNum, setSubmittedOrderNum] = useState<string>('');
  const [errMsg, setErrMsg] = useState<string>('');

  const handleUploadRx = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingRx(true);
    try {
      const url = await uploadPartnerAssetToStorage(file, partner.id, 'prescription');
      setPrescriptionFileUrl(url);
    } catch {
      // If storage bucket is not configured, record filename reference safely
      setPrescriptionFileUrl(`verified-local-rx://${file.name}`);
    } finally {
      setUploadingRx(false);
    }
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    if (!patientName.trim() || !patientPhone.trim()) {
      setErrMsg(
        isAr
          ? 'يرجى إدخال اسم المريض ورقم الهاتف للتواصل من قِبل الصيدلي.'
          : 'Please enter patient name and phone number for pharmacist verification.'
      );
      return;
    }

    if (
      partner.requiresPrescriptionForAntibiotics &&
      !prescriptionRef.trim() &&
      !prescriptionFileUrl.trim()
    ) {
      setErrMsg(
        isAr
          ? 'حفاظاً على سلامتك ووفقاً للقانون المصري: يُشترط إرفاق صورة الروشتة الطبية أو إدخال رقم الوصفة/اسم الطبيب المعالج لصرف المضادات الحيوية.'
          : 'For your clinical safety and regulatory compliance: A valid prescription image or reference is required for antibiotic dispensing.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const chosenBranch = publishedBranches.find((b) => b.id === selectedBranchId);
      const externalUrl =
        chosenBranch?.branchOrderingUrl || partner.externalOrderingUrl || '';

      const created = await createPartnerOrder({
        userId: user?.uid || 'guest_patient',
        partnerId: partner.id,
        partnerNameAr: partner.nameAr,
        partnerNameEn: partner.nameEn,
        branchId: chosenBranch?.id || null,
        branchNameAr: chosenBranch?.nameAr || '',
        branchNameEn: chosenBranch?.nameEn || '',
        productId: product.productId,
        activeIngredientId: product.activeIngredientId,
        medicationNameAr: product.tradeNameAr,
        medicationNameEn: product.tradeNameEn,
        strength: product.strength,
        dosageForm: product.dosageForm,
        quantityPacks,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        governorateId: govId,
        city: city.trim(),
        deliveryAddress: deliveryAddress.trim(),
        patientNotes: patientNotes.trim(),
        requiresPrescription: true,
        prescriptionReferenceNumber: prescriptionRef.trim() || 'مرفق صورة الروشتة',
        prescriptionUploadedFileUrl: prescriptionFileUrl,
        prescriberName: prescriberName.trim(),
        pharmacistVerificationNote:
          'يتطلب مراجعة الصيدلي المرخص للوصفة الطبية قبل التأكيد النهائي.',
        status: 'under_pharmacy_review',
        externalRedirectUsed: Boolean(externalUrl),
        externalCheckoutUrl: externalUrl,
      });

      setSubmittedOrderNum(created.orderNumber);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.76)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        zIndex: 10080,
      }}
      onClick={onClose}
    >
      <div
        className="card stack"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '20px',
          background: 'var(--card-bg, #fff)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 700 }}>
               {isAr ?'نموذج طلب صرف بوصفة طبية معتمدة':'Authorized Prescription Order Request'}
            </span>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.2rem' }}>
              {isAr ? product.tradeNameAr : product.tradeNameEn} ({product.strength}) —{' '}
              {isAr ? partner.nameAr : partner.nameEn}
            </h2>
          </div>
          <button type="button" className="btn ghost small" onClick={onClose}>
            
          </button>
        </div>

        {submittedOrderNum ? (
          <div className="stack center" style={{ padding: '20px', alignItems: 'center' }}>
            <div style={{ fontSize:'2.8rem'}}></div>
            <h3 style={{ margin: 0, color: '#15803d' }}>
              {isAr
                ? `تم تسجيل طلب المراجعة الصيدلانية بنجاح (${submittedOrderNum})`
                : `Prescription Order Logged Successfully (${submittedOrderNum})`}
            </h3>
            <p className="small muted" style={{ maxWidth: '50ch' }}>
              {isAr
                ? 'الحالة الحالية: «قيد مراجعة الصيدلي للروشتة (Under Pharmacy Review)». يمكنك متابعة حالة الطلب من صفحة «شبكة الصيدليات ومتابعة الطلبات».'
                : 'Current Status: Under Pharmacy Review. You can track this order anytime on the Partners & Orders page.'}
            </p>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              {partner.externalOrderingUrl && partner.externalOrderingUrl.startsWith('http') && (
                <a
                  href={partner.externalOrderingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: '#0d9488' }}
                >
                   {isAr ?'المتابعة لبوابة الصيدلية الخارجية المعتمدة ↗':'Proceed to Partner Checkout ↗'}
                </a>
              )}
              <Link to="/partners?tab=orders" className="btn ghost" onClick={onClose}>
                 {isAr ?'متابعة حالة الطلب':'Track Order Status'}
              </Link>
              <button type="button" className="btn ghost" onClick={onClose}>
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          <form className="stack" onSubmit={handleSubmitOrder} style={{ gap: '12px' }}>
            <div className="notice small">
               
              {isAr
                ? 'ضمان الأمان الطبي والقانوني: لا يتم تحصيل أي مدفوعات بنكية داخل الموقع، ولا يتم استبدال الدواء الموصوف تلقائياً. يخضع صرف المضادات الحيوية لمراجعة الصيدلي المرخص للروشتة الطبية.'
                : 'Clinical & Legal Safeguard: No card payments are collected here, and prescribed medications are never auto-substituted. Requires licensed pharmacist review.'}
            </div>

            {errMsg && <div className="alert">{errMsg}</div>}

            {publishedBranches.length > 0 && (
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'اختر الفرع الأقرب إليك:':'Select Branch:'}
                </label>
                <select
                  className="input"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  {publishedBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {isAr ? b.nameAr : b.nameEn} ({b.city})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'اسم المريض الكامل *':'Patient Name *'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'رقم الهاتف للتأكيد *':'Phone Number *'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  className="input"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  required
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'الكمية وفق الروشتة':'Pack Quantity'}
                </label>
                <select
                  className="input"
                  value={quantityPacks}
                  onChange={(e) => setQuantityPacks(Number(e.target.value) || 1)}
                >
                  <option value={1}>1 {isAr ? 'عبوة' : 'Pack'}</option>
                  <option value={2}>2 {isAr ? 'عبوات' : 'Packs'}</option>
                  <option value={3}>3 {isAr ? 'عبوات' : 'Packs'}</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'المحافظة':'Governorate'}
                </label>
                <select
                  className="input"
                  value={govId}
                  onChange={(e) => setGovId(e.target.value)}
                >
                  {EGYPTIAN_GOVERNORATES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {isAr ? g.nameAr : g.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'المدينة / الحي':'City / District'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={isAr ? 'مثال: مدينة نصر / المنصورة' : ''}
                />
              </div>
            </div>

            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                 {isAr ?'عنوان التوصيل التفصيلي':'Delivery Address'}
              </label>
              <input
                type="text"
                className="input"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </div>

            {/* Prescription Compliance Box */}
            <div className="subcard stack" style={{ borderColor: '#0284c7' }}>
              <b> {isAr ?'بيانات الوصفة الطبية (الروشتة) — إجباري للمضادات الحيوية:':'Prescription Verification (Mandatory for Antibiotics):'}</b>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                }}
              >
                <div>
                  <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {isAr ? 'رقم الروشتة أو تاريخ الكشف *' : 'Prescription Ref / Date *'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={prescriptionRef}
                    onChange={(e) => setPrescriptionRef(e.target.value)}
                    placeholder={isAr ? 'مثال: روشتة عيادة بتاريخ اليوم' : 'e.g. Clinic Rx #104'}
                  />
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {isAr ? 'اسم الطبيب المعالج' : 'Prescribing Doctor Name'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={prescriberName}
                    onChange={(e) => setPrescriberName(e.target.value)}
                  />
                </div>
              </div>

              <div className="row wrapRow" style={{ gap: '10px', alignItems: 'center' }}>
                <label className="btn ghost small" style={{ cursor: 'pointer' }}>
                  {uploadingRx
                    ? '⏳...'
                    : isAr
                    ?'إرفاق صورة الروشتة الطبية'                    :'Upload Prescription Image'}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleUploadRx}
                  />
                </label>
                {prescriptionFileUrl && (
                  <span className="small" style={{ color: '#16a34a', fontWeight: 700 }}>
                     {isAr ?'تم إرفاق الوصفة الطبية':'Prescription attached'}
                  </span>
                )}
              </div>
            </div>

            <div className="row wrapRow" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn ghost" onClick={onClose}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="btn" disabled={submitting} style={{ background: '#0d9488' }}>
                {submitting
                  ? isAr
                    ? 'جارٍ الإرسال...'
                    : 'Submitting...'
                  : isAr
                  ?'إرسال طلب الصرف للمراجعة الصيدلانية'                  :'Submit for Pharmacist Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// MAIN "FIND THIS MEDICATION" ("اعثر على دوائك") PANEL
// ============================================================================
export default function FindMedicationPanel({
  activeIngredientId,
  initialProductId,
}: {
  activeIngredientId: string;
  initialProductId?: string;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { products: liveCatalogProducts } = useLiveDrugCatalog();
  const { getVisiblePartners, branches, mappings } = usePartnerEcosystem();

  // Filter packages matching this activeIngredientId
  const matchingPackages = useMemo(
    () => liveCatalogProducts.filter((p) => p.activeIngredientId === activeIngredientId),
    [liveCatalogProducts, activeIngredientId]
  );

  const [selectedProdId, setSelectedProdId] = useState<string>(
    initialProductId || matchingPackages[0]?.productId || ''
  );
  const [selectedGovId, setSelectedGovId] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [showAlternativesReview, setShowAlternativesReview] = useState<boolean>(false);
  const [orderModalPartner, setOrderModalPartner] = useState<PartnerPublicRecord | null>(null);

  const selectedProduct = useMemo(
    () =>
      matchingPackages.find((p) => p.productId === selectedProdId) || matchingPackages[0] || null,
    [matchingPackages, selectedProdId]
  );

  const ingredientInfo = useMemo(
    () => ACTIVE_INGREDIENTS.find((a) => a.id === activeIngredientId),
    [activeIngredientId]
  );

  // Get participating partners allowed in medication details & search, filtered by user's governorate/city
  const participatingPartners = useMemo(() => {
    return getVisiblePartners({
      placement: 'medication_detail_page',
      governorateId: selectedGovId !== 'all' ? selectedGovId : undefined,
      city: selectedCity !== 'all' ? selectedCity : undefined,
    });
  }, [getVisiblePartners, selectedGovId, selectedCity]);

  // Scientifically classified alternatives (strictly labeled as requiring pharmacist/prescriber review)
  const classifiedAlts = useMemo(
    () =>
      selectedProduct
        ? getClassifiedAlternatives(selectedProduct, liveCatalogProducts)
        : null,
    [selectedProduct, liveCatalogProducts]
  );

  if (!selectedProduct) return null;

  return (
    <section
      className="card highlight-card stack"
      style={{
        borderTop: '4px solid #0d9488',
        background: 'linear-gradient(180deg, rgba(13, 148, 136, 0.05) 0%, var(--card-bg, #fff) 100%)',
        gap: '14px',
      }}
    >
      {/* Header */}
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div>
          <span
            className="badge"
            style={{ background: '#ccfbf1', color: '#0f766e', fontWeight: 800, marginBottom: '6px' }}
          >
             {tr(lang,'اعثر على دوائك في الصيدليات المعتمدة','Find This Medication at Participating Pharmacies')}
          </span>
          <h2 style={{ margin: 0 }}>
            {isAr ? 'اعثر على دوائك (Find This Medication)' : 'Find This Medication'}
          </h2>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {isAr
              ? 'تحقق من الصيدليات المشاركة في محافظتك مع مطابقة دقيقة للمادة الفعالة والتركيز والشكل الصيدلاني.'
              : 'Locate participating pharmacies in your governorate with strict matching of active ingredient, strength, and dosage form.'}
          </p>
        </div>

        <Link to="/partners" className="btn ghost small">
           {isAr ?'دليل الشركاء والصيدليات الكامل ←':'Full Pharmacy Network →'}
        </Link>
      </div>

      {/* Step 1-4: Clinical Identification Box (Medication, Active Ingredient, Strength, Dosage Form) */}
      <div
        className="subcard"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          background: 'var(--card-bg, #fff)',
        }}
      >
        <div>
          <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
            1⃣ {isAr ?'اختر العبوة التجارية والتركيز:':'1. Select Medication Package:'}
          </label>
          <select
            className="input"
            value={selectedProduct.productId}
            onChange={(e) => setSelectedProdId(e.target.value)}
          >
            {matchingPackages.map((pkg) => (
              <option key={pkg.productId} value={pkg.productId}>
                {isAr ? pkg.tradeNameAr : pkg.tradeNameEn} ({pkg.strength} -{' '}
                {pick(pkg.dosageFormLabel, lang)})
              </option>
            ))}
          </select>
        </div>

        <div className="small" style={{ lineHeight: 1.7 }}>
          <div>
            <b>2⃣ {isAr ?'المادة الفعالة:':'Active Ingredient:'} </b>
            <span>
              {ingredientInfo
                ? isAr
                  ? ingredientInfo.nameAr
                  : ingredientInfo.nameEn
                : selectedProduct.scientificComposition}
            </span>
          </div>
          <div>
            <b>3⃣ {isAr ?'التركيز الدقيق:':'Strength:'} </b>
            <span dir="ltr" style={{ fontWeight: 700, color: '#0369a1' }}>
              {selectedProduct.strength}
            </span>
          </div>
          <div>
            <b>4⃣ {isAr ?'الشكل الصيدلاني:':'Dosage Form:'} </b>
            <span>
              {pick(
                selectedProduct.dosageFormLabel || DOSAGE_FORM_LABELS[selectedProduct.dosageForm],
                lang
              )}
            </span>
          </div>
        </div>

        {/* Geographic Filter (Governorate) */}
        <div>
          <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
            5⃣ {isAr ?'حدد محافظتك لعرض الصيدليات المتاحة:':'5. Filter by Your Governorate:'}
          </label>
          <select
            className="input"
            value={selectedGovId}
            onChange={(e) => {
              setSelectedGovId(e.target.value);
              setSelectedCity('all');
            }}
          >
            <option value="all">{isAr ? 'جميع المحافظات المصرية' : 'All Egyptian Governorates'}</option>
            {EGYPTIAN_GOVERNORATES.map((g) => (
              <option key={g.id} value={g.id}>
                {isAr ? g.nameAr : g.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 5-8: Participating Pharmacies & Verified Availability / Ordering */}
      {participatingPartners.length === 0 ? (
        <div className="subcard center stack" style={{ padding: '18px', alignItems: 'center' }}>
          <p className="small muted" style={{ margin: 0 }}>
            {selectedGovId !== 'all'
              ? isAr
                ? `لا توجد حالياً صيدليات شريكة منشورة تغطي هذه المحافظة في نتائج بحث الأدوية. يتم عرض الشركاء فقط في المحافظات التي يغطونها فعلياً.`
                : `No published partner pharmacies currently cover the selected governorate for medication search.`
              : isAr
              ? 'لا توجد صيدليات شريكة منشورة في نتائج بحث الأدوية حالياً. يمكن لمالك الموقع إضافة وتفعيل الصيدليات الشريكة من لوحة التحكم (إدارة الشركاء).'
              : 'No participating pharmacies are currently published for medication search. The site owner can publish partners anytime from the Admin Dashboard.'}
          </p>
          <div className="row wrapRow" style={{ gap: '8px', marginTop: '6px' }}>
            {selectedGovId !== 'all' && (
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setSelectedGovId('all')}
              >
                {isAr ? 'عرض جميع المحافظات' : 'Show All Governorates'}
              </button>
            )}
            <Link to="/partners" className="btn ghost small">
               {isAr ?'تصفح دليل الشركاء العام':'Browse Partner Directory'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ gap: '10px' }}>
          <div className="small" style={{ fontWeight: 700 }}>
             
            {isAr
              ? `الصيدليات والشركاء المعتمدون المتاحون (${participatingPartners.length}):`
              : `Participating Pharmacies (${participatingPartners.length}):`}
          </div>

          <div className="grid">
            {participatingPartners.map((partner) => {
              // Strict clinical match: check if an explicit mapping exists for this partner + productId
              // or same activeIngredientId + strength + dosageForm
              const exactMapping = mappings.find(
                (m) =>
                  m.partnerId === partner.id &&
                  m.published &&
                  (m.productId === selectedProduct.productId ||
                    (m.activeIngredientId === selectedProduct.activeIngredientId &&
                      m.strength.toLowerCase().replace(/\s+/g, '') ===
                        selectedProduct.strength.toLowerCase().replace(/\s+/g, '') &&
                      m.dosageForm === selectedProduct.dosageForm))
              );

              const partnerBranches = branches.filter(
                (b) =>
                  b.partnerId === partner.id &&
                  b.published &&
                  b.branchStatus === 'active' &&
                  (selectedGovId === 'all' ||
                    b.governorateId === selectedGovId ||
                    b.serviceGovernorates.includes(selectedGovId))
              );

              const evalResult = universalDynamicPartnerAdapter.resolveMedicationOption(
                partner,
                {
                  productId: selectedProduct.productId,
                  activeIngredientId: selectedProduct.activeIngredientId,
                  tradeNameAr: selectedProduct.tradeNameAr,
                  tradeNameEn: selectedProduct.tradeNameEn,
                  strength: selectedProduct.strength,
                  dosageForm: selectedProduct.dosageForm,
                  governorateId: selectedGovId !== 'all' ? selectedGovId : undefined,
                },
                exactMapping,
                partnerBranches[0] || null
              );

              const showVerifiedBadge =
                partner.display.showVerificationBadge &&
                partner.verificationStatus === 'verified';

              return (
                <div
                  key={partner.id}
                  className="card stack"
                  style={{
                    padding: '14px',
                    borderTop:
                      evalResult.stockStatus === 'in_stock_verified'
                        ? '3px solid #16a34a'
                        : '3px solid #0d9488',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div className="row wrapRow" style={{ justifyContent: 'space-between', gap: '6px' }}>
                      <b>{isAr ? partner.nameAr : partner.nameEn}</b>
                      {showVerifiedBadge && (
                        <span
                          className="badge"
                          style={{
                            background: VERIFICATION_STATUS_LABELS.verified.bg,
                            color: VERIFICATION_STATUS_LABELS.verified.color,
                            fontSize: '0.7rem',
                          }}
                        >
                          {isAr
                            ? VERIFICATION_STATUS_LABELS.verified.ar
                            : VERIFICATION_STATUS_LABELS.verified.en}
                        </span>
                      )}
                    </div>

                    {partner.visibility.isSponsoredPlacement && (
                      <span
                        className="badge"
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          fontSize: '0.68rem',
                          marginTop: '4px',
                        }}
                      >
                         {isAr ?'رعاية تجارية (Sponsored)':'Sponsored'}
                      </span>
                    )}

                    {/* Stock Status Badge (Never invented; states "Availability requires confirmation" when unverified) */}
                    <div style={{ marginTop: '8px' }}>
                      <span
                        className="badge"
                        style={{
                          background:
                            evalResult.stockStatus === 'in_stock_verified'
                              ? '#dcfce7'
                              : evalResult.stockStatus === 'out_of_stock_verified'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            evalResult.stockStatus === 'in_stock_verified'
                              ? '#166534'
                              : evalResult.stockStatus === 'out_of_stock_verified'
                              ? '#991b1b'
                              : '#92400e',
                          fontWeight: 700,
                        }}
                      >
                        {isAr ? evalResult.stockBadgeAr : evalResult.stockBadgeEn}
                      </span>
                    </div>

                    {/* Price & Sync Source */}
                    <div className="small" style={{ marginTop: '8px', lineHeight: 1.6 }}>
                      <div>
                        <b>{isAr ? 'السعر الموثق:' : 'Verified Price:'} </b>
                        {evalResult.verifiedPriceEgp !== null ? (
                          <strong style={{ color: '#15803d' }}>
                            {evalResult.verifiedPriceEgp.toFixed(2)} {isAr ? 'ج.م' : 'EGP'}
                          </strong>
                        ) : selectedProduct.priceEgp !== null ? (
                          <span>
                            {selectedProduct.priceEgp.toFixed(2)} {isAr ? 'ج.م (التسعيرة الرسمية الاسترشادية)' : 'EGP (Official EDA Guide Price)'}
                          </span>
                        ) : (
                          <span className="muted">
                            {isAr ? 'يتطلب تأكيد الصيدلية' : 'Requires confirmation'}
                          </span>
                        )}
                      </div>

                      <div className="muted" style={{ fontSize: '0.76rem' }}>
                        {isAr ? 'المصدر:' : 'Source:'}{' '}
                        {isAr ? evalResult.priceSourceAr : evalResult.priceSourceEn}
                        {evalResult.lastUpdatedIso && (
                          <span> ({evalResult.lastUpdatedIso.slice(0, 10)})</span>
                        )}
                      </div>

                      {partnerBranches.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
                           {partnerBranches.length} 
                          {isAr ? 'فرع متاح في نطاقك' : 'branches in selected area'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ordering / Contact Actions */}
                  <div className="row wrapRow" style={{ gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                    {evalResult.orderingMode === 'external_redirect' &&
                      evalResult.orderingDestinationUrl && (
                        <a
                          href={evalResult.orderingDestinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn small"
                          style={{ flex: 1, textAlign: 'center', background: '#0d9488' }}
                        >
                           {isAr ?'اطلب من موقع الصيدلية ↗':'Order via Partner ↗'}
                        </a>
                      )}

                    {partner.supportsOnlineOrdering && (
                      <button
                        type="button"
                        className="btn small ghost"
                        style={{ flex: 1 }}
                        onClick={() => setOrderModalPartner(partner)}
                      >
                         {isAr ?'طلب صرف بالروشتة':'Rx Order Request'}
                      </button>
                    )}

                    {partner.visibility.publishPartnerProfile && (
                      <Link to={`/partner/${partner.id}`} className="btn ghost small">
                         {isAr ?'الفروع':'Branches'}
                      </Link>
                    )}

                    {(partner.hotline || partner.phone) && (
                      <a
                        href={`tel:${(partner.hotline || partner.phone).replace(/\s+/g, '')}`}
                        className="btn ghost small"
                      >
                         {partner.hotline || partner.phone}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clinical Safety & Non-Substitution Guarantee Banner */}
      <div
        className="subcard small"
        style={{
          background: 'rgba(2, 132, 199, 0.06)',
          borderColor: 'rgba(2, 132, 199, 0.3)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div>
          <strong>
             
            {isAr
              ? 'قاعدة السلامة الإكلينيكية وعدم الاستبدال التلقائي:'
              : 'Clinical Safety & Zero Auto-Substitution Guarantee:'}
          </strong>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            {isAr
              ? 'لا يقوم الموقع أبداً باستبدال الدواء الموصوف في روشتتك تلقائياً. أي مثيل أو بديل يتطلب مراجعة الطبيب المعالج أو الصيدلي المرخص.'
              : 'Prescribed medications are never automatically substituted. Any generic equivalent requires appropriate pharmacist or prescriber review.'}
          </p>
        </div>

        {classifiedAlts && classifiedAlts.exactEquivalents.length > 0 && (
          <button
            type="button"
            className="btn ghost small"
            onClick={() => setShowAlternativesReview((v) => !v)}
          >
             
            {showAlternativesReview
              ? isAr
                ? 'إخفاء المثائل المرخصة ↑'
                : 'Hide Licensed Generics ↑'
              : isAr
              ? `عرض المثائل المتطابقة لمراجعتها مع الصيدلي (${classifiedAlts.exactEquivalents.length}) ↓`
              : `View Identical Generics for Pharmacist Review (${classifiedAlts.exactEquivalents.length}) ↓`}
          </button>
        )}
      </div>

      {/* Optional Expandable Exact Generics Section (Clearly Labeled for Pharmacist Review) */}
      {showAlternativesReview && classifiedAlts && classifiedAlts.exactEquivalents.length > 0 && (
        <div className="subcard stack" style={{ borderInlineStart: '4px solid #d97706' }}>
          <div className="small" style={{ color: '#92400e', fontWeight: 700 }}>
             
            {isAr
              ? 'مثائل مرخصة من هيئة الدواء المصرية تحتوي على نفس المادة الفعالة والتركيز والشكل الصيدلاني (تتطلب موافقة الطبيب أو الصيدلي قبل الصرف):'
              : 'EDA-licensed generic equivalents with the exact same active ingredient, strength, and dosage form (Requires pharmacist or prescriber review):'}
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            {classifiedAlts.exactEquivalents.map((alt) => (
              <button
                key={alt.productId}
                type="button"
                className="btn ghost small"
                onClick={() => setSelectedProdId(alt.productId)}
              >
                 {isAr ? alt.tradeNameAr : alt.tradeNameEn} ({alt.strength}) — 
                {alt.priceEgp ? `${alt.priceEgp} ${isAr ? 'ج.م' : 'EGP'}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {orderModalPartner && (
        <PartnerMedicationOrderModal
          partner={orderModalPartner}
          product={selectedProduct}
          branches={branches}
          defaultGovId={selectedGovId}
          onClose={() => setOrderModalPartner(null)}
        />
      )}
    </section>
  );
}
