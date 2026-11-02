import { ChangeEvent, FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from './i18n';
import { tr } from './types';
import {
  ApiIntegrationStatus,
  createEmptyPartnerRecord,
  EGYPTIAN_GOVERNORATES,
  GeographicScopeType,
  INTEGRATION_METHOD_LABELS,
  IntegrationMethodType,
  PartnerCardTheme,
  PartnerCategoryRecord,
  PartnerFullAdminRecord,
  PARTNERSHIP_STATUS_LABELS,
  PartnershipStatus,
  PLACEMENT_LOCATION_LABELS,
  PlacementLocationId,
  PUBLICATION_STATUS_LABELS,
  PublicationStatus,
  RolePermissionMatrix,
  VERIFICATION_STATUS_LABELS,
  VerificationStatus,
  VisibilityStatus,
} from './partnerTypes';
import { EGYPTIAN_HEALTHCARE_INTEGRATION_BLUEPRINTS } from './partnerProviders';
import { savePartnerFullRecord, uploadPartnerAssetToStorage } from './partnerService';
import { PublicPartnerCard } from './PublicPartnerCard';

type EditorTabId =
  | 'basic'
  | 'business'
  | 'partnership'
  | 'visibility'
  | 'display'
  | 'integration'
  | 'preview';

export function PartnerFormModal({
  initialPartner,
  categories,
  permissions,
  adminUid,
  adminRole,
  onClose,
  onSaved,
}: {
  initialPartner?: PartnerFullAdminRecord | null;
  categories: PartnerCategoryRecord[];
  permissions: RolePermissionMatrix;
  adminUid: string;
  adminRole: string;
  onClose: () => void;
  onSaved: (saved: PartnerFullAdminRecord) => void;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const isNew = !initialPartner;

  const [draft, setDraft] = useState<PartnerFullAdminRecord>(() =>
    initialPartner
      ? JSON.parse(JSON.stringify(initialPartner))
      : createEmptyPartnerRecord(adminUid)
  );
  const [activeTab, setActiveTab] = useState<EditorTabId>('basic');
  const [servicesArInput, setServicesArInput] = useState<string>(() =>
    (initialPartner?.servicesOfferedAr || draft.servicesOfferedAr).join('، ')
  );
  const [servicesEnInput, setServicesEnInput] = useState<string>(() =>
    (initialPartner?.servicesOfferedEn || draft.servicesOfferedEn).join(', ')
  );
  const [citiesInput, setCitiesInput] = useState<string>(() =>
    (initialPartner?.supportedCities || draft.supportedCities).join('، ')
  );
  const [districtsInput, setDistrictsInput] = useState<string>(() =>
    (initialPartner?.supportedDistricts || draft.supportedDistricts).join('، ')
  );

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const selectedCategory = categories.find((c) => c.id === draft.categoryId) || categories[0];

  const handleToggleGov = (govId: string, inVisibilityList = false) => {
    if (inVisibilityList) {
      setDraft((prev) => {
        const list = prev.visibility.allowedGovernorates || [];
        const exists = list.includes(govId);
        return {
          ...prev,
          visibility: {
            ...prev.visibility,
            allowedGovernorates: exists ? list.filter((g) => g !== govId) : [...list, govId],
          },
        };
      });
    } else {
      setDraft((prev) => {
        const list = prev.supportedGovernorates || [];
        const exists = list.includes(govId);
        return {
          ...prev,
          supportedGovernorates: exists ? list.filter((g) => g !== govId) : [...list, govId],
        };
      });
    }
  };

  const handleTogglePlacement = (locId: PlacementLocationId) => {
    setDraft((prev) => {
      const list = prev.visibility.allowedPlacements || [];
      const exists = list.includes(locId);
      return {
        ...prev,
        visibility: {
          ...prev.visibility,
          allowedPlacements: exists ? list.filter((l) => l !== locId) : [...list, locId],
        },
      };
    });
  };

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    assetType: 'logo' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (assetType === 'logo') setUploadingLogo(true);
    else setUploadingCover(true);
    setUploadMsg('');

    try {
      const downloadUrl = await uploadPartnerAssetToStorage(file, draft.id, assetType);
      setDraft((prev) => ({
        ...prev,
        ...(assetType === 'logo' ? { logoUrl: downloadUrl } : { coverImageUrl: downloadUrl }),
      }));
      setUploadMsg(
        isAr
          ?'تم رفع الصورة بنجاح إلى Firebase Storage وحفظ الرابط.'          :'Image uploaded to Firebase Storage successfully.'      );
    } catch {
      setUploadMsg(
        isAr
          ?'ℹ خدمة Firebase Storage غير مفعلة حالياً أو تتطلب إعداد Bucket. يمكنك لصق رابط مباشر للصورة (HTTPS URL) في الحقل أدناه.'          :'ℹ Firebase Storage bucket is not active; please paste a direct HTTPS image URL in the field below.'      );
    } finally {
      setUploadingLogo(false);
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: FormEvent, saveAsDraftOverride?: boolean) => {
    e.preventDefault();
    setErrMsg('');

    if (!draft.nameAr.trim() && !draft.nameEn.trim() && !draft.name.trim()) {
      setErrMsg(
        isAr
          ? 'يرجى إدخال اسم الشريك (بالعربية أو الإنجليزية على الأقل).'
          : 'Please enter the partner name (Arabic or English).'
      );
      setActiveTab('basic');
      return;
    }

    setSaving(true);
    try {
      const cleanServicesAr = servicesArInput
        .split(/[,،\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanServicesEn = servicesEnInput
        .split(/[,،\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanCities = citiesInput
        .split(/[,،\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanDistricts = districtsInput
        .split(/[,،\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      // If user clicked "Save as Draft" or lacks publish permissions, force draft & hidden
      const forceDraft = saveAsDraftOverride === true || !permissions.canPublishOrHide;

      const finalRecord: PartnerFullAdminRecord = {
        ...draft,
        name: draft.nameAr.trim() || draft.nameEn.trim() || draft.name.trim(),
        nameAr: draft.nameAr.trim() || draft.nameEn.trim() || draft.name.trim(),
        nameEn: draft.nameEn.trim() || draft.nameAr.trim() || draft.name.trim(),
        servicesOfferedAr: cleanServicesAr,
        servicesOfferedEn: cleanServicesEn,
        supportedCities: cleanCities,
        supportedDistricts: cleanDistricts,
        publicationStatus: forceDraft ? 'draft' : draft.publicationStatus,
        visibilityStatus: forceDraft ? 'hidden' : draft.visibilityStatus,
        visibility: {
          ...draft.visibility,
          showOnWebsite: forceDraft ? false : draft.visibility.showOnWebsite,
        },
      };

      const saved = await savePartnerFullRecord(finalRecord, adminUid, adminRole, isNew);
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || '';
      setErrMsg(
        isAr
          ? `تعذر حفظ بيانات الشريك: ${msg || 'تحقق من صلاحيات الحساب.'}`
          : `Failed to save partner: ${msg || 'Check your account permissions.'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const tabs: Array<{ id: EditorTabId; icon: string; ar: string; en: string }> = [
    { id: 'basic', icon: '🏥', ar: '1. البيانات الأساسية', en: '1. Basic Info' },
    { id: 'business', icon: '📍', ar: '2. الخدمات والتغطية', en: '2. Services & Coverage' },
    { id: 'partnership', icon: '🤝', ar: '3. حالة الشراكة والتوثيق', en: '3. Partnership & Verification' },
    { id: 'visibility', icon: '👁️', ar: '4. التحكم في الظهور والمواضع', en: '4. Visibility & Placement' },
    { id: 'display', icon: '🎨', ar: '5. تخصيص العرض للجمهور', en: '5. Public Card Display' },
    { id: 'integration', icon: '🔌', ar: '6. الربط البرمجي والطلب', en: '6. Integration & Ordering' },
    { id: 'preview', icon: '🔍', ar: '7. معاينة حية قبل النشر', en: '7. Live Public Preview' },
  ];

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
        zIndex: 10060,
      }}
      onClick={onClose}
    >
      <form
        className="card stack"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          maxWidth: '940px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '20px',
          background: 'var(--card-bg, #fff)',
          borderRadius: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => handleSubmit(e, false)}
      >
        {/* Modal Header */}
        <div
          className="row wrapRow"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--line, #e2e8f0)',
            paddingBottom: '12px',
          }}
        >
          <div>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
              {isNew
                ? isAr
                  ?'إضافة شريك جديد (يُحفظ افتراضياً كمسودة مخفية)'                  :'Add New Partner (Defaults to Hidden Draft)'                :`${draft.id}`}
            </span>
            <h2 style={{ margin: '6px 0 0', fontSize: '1.25rem' }}>
              {isNew
                ? tr(lang, 'إضافة شريك أو صيدلية جديدة للمنصة', 'Add New Healthcare Partner or Pharmacy')
                : `${tr(lang, 'تعديل بيانات الشريك:', 'Edit Partner:')} ${
                    isAr ? draft.nameAr || draft.nameEn : draft.nameEn || draft.nameAr
                  }`}
            </h2>
          </div>
          <button type="button" className="btn ghost small" onClick={onClose}>
             {tr(lang,'إغلاق','Close')}
          </button>
        </div>

        {/* Step Navigation Tabs (Scrollable on Android phones) */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--line, #e2e8f0)',
          }}
        >
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setActiveTab(tb.id)}
              style={{
                whiteSpace: 'nowrap',
                padding: '8px 12px',
                borderRadius: '10px',
                fontWeight: activeTab === tb.id ? 700 : 500,
                fontSize: '0.85rem',
                border: activeTab === tb.id ? '2px solid #0d9488' : '1px solid var(--line, #cbd5e1)',
                background: activeTab === tb.id ? 'rgba(13, 148, 136, 0.12)' : 'var(--card-bg, #fff)',
                color: activeTab === tb.id ? '#0f766e' : 'inherit',
                cursor: 'pointer',
              }}
            >
              {tb.icon} {isAr ? tb.ar : tb.en}
            </button>
          ))}
        </div>

        {errMsg && <div className="alert">{errMsg}</div>}
        {uploadMsg && <div className="notice">{uploadMsg}</div>}

        {/* ================================================================ */}
        {/* TAB 1: BASIC INFORMATION */}
        {/* ================================================================ */}
        {activeTab === 'basic' && (
          <div className="stack" style={{ gap: '14px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'الاسم بالعربية *' : 'Arabic Name *'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={draft.nameAr}
                  onChange={(e) => setDraft({ ...draft, nameAr: e.target.value, name: e.target.value })}
                  placeholder={isAr ? 'مثال: صيدليات الشفاء الحديثة' : 'Arabic Partner Name'}
                  required
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'الاسم بالإنجليزية *' : 'English Name *'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={draft.nameEn}
                  onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
                  placeholder="e.g. Al-Shifaa Modern Pharmacies"
                  required
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'فئة الشريك (Partner Category) *' : 'Partner Category *'}
                </label>
                <select
                  className="input"
                  value={draft.categoryId}
                  onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {isAr ? cat.nameAr : cat.nameEn} {!cat.active ? '(غير نشط)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'نوع الكيان (Partner Type)' : 'Partner Type'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={draft.partnerType}
                  onChange={(e) => setDraft({ ...draft, partnerType: e.target.value })}
                  placeholder={isAr ? 'مثال: سلسلة صيدليات / صيدلية مستقلة / معمل' : 'e.g. pharmacy_chain, independent_pharmacy'}
                />
              </div>
            </div>

            {/* Descriptions */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'وصف الشريك ونبذة عنه (عربي)' : 'Description (Arabic)'}
                </label>
                <textarea
                  rows={3}
                  className="input"
                  value={draft.descriptionAr}
                  onChange={(e) => setDraft({ ...draft, descriptionAr: e.target.value })}
                  placeholder={isAr ? 'وصف مختصر للخدمات الطبية والصيدلانية المقدمة...' : 'Arabic description...'}
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'وصف الشريك (إنجليزي)' : 'Description (English)'}
                </label>
                <textarea
                  rows={3}
                  dir="ltr"
                  className="input"
                  value={draft.descriptionEn}
                  onChange={(e) => setDraft({ ...draft, descriptionEn: e.target.value })}
                  placeholder="Concise description of healthcare and pharmacy services..."
                />
              </div>
            </div>

            {/* Logo & Cover Image (Firebase Storage Upload + URL input) */}
            <div
              className="subcard"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'شعار الشريك (Partner Logo URL / Upload)':'Partner Logo (URL or Firebase Storage Upload)'}
                </label>
                <div className="row" style={{ gap: '8px' }}>
                  <input
                    type="url"
                    dir="ltr"
                    className="input"
                    style={{ flex: 1 }}
                    value={draft.logoUrl}
                    onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  <label className="btn ghost small" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {uploadingLogo ?'⏳...': isAr ?'رفع شعار':'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'صورة الغلاف (Cover Image URL / Upload)':'Cover Image (URL or Upload)'}
                </label>
                <div className="row" style={{ gap: '8px' }}>
                  <input
                    type="url"
                    dir="ltr"
                    className="input"
                    style={{ flex: 1 }}
                    value={draft.coverImageUrl}
                    onChange={(e) => setDraft({ ...draft, coverImageUrl: e.target.value })}
                    placeholder="https://example.com/cover.jpg"
                  />
                  <label className="btn ghost small" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {uploadingCover ?'⏳...': isAr ?'رفع غلاف':'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'cover')}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Public Contact & Social Links */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'رقم الهاتف العام':'Public Phone Number'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  className="input"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  placeholder="+20 100 000 0000"
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'الخط الساخن المختصر (Hotline)':'Hotline Number'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  className="input"
                  value={draft.hotline}
                  onChange={(e) => setDraft({ ...draft, hotline: e.target.value })}
                  placeholder="19xxx"
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'البريد الإلكتروني العام':'Public Email'}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  className="input"
                  value={draft.publicEmail}
                  onChange={(e) => setDraft({ ...draft, publicEmail: e.target.value })}
                  placeholder="info@partner.com"
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'الموقع الرسمي (Website)':'Official Website URL'}
                </label>
                <input
                  type="url"
                  dir="ltr"
                  className="input"
                  value={draft.websiteUrl}
                  onChange={(e) => setDraft({ ...draft, websiteUrl: e.target.value })}
                  placeholder="https://www.example.com"
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'رقم أو رابط واتساب':'WhatsApp Number / Link'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={draft.socialLinks.whatsapp || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      socialLinks: { ...draft.socialLinks, whatsapp: e.target.value },
                    })
                  }
                  placeholder="+201000000000"
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'صفحة فيسبوك (Facebook)':'Facebook URL'}
                </label>
                <input
                  type="url"
                  dir="ltr"
                  className="input"
                  value={draft.socialLinks.facebook || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      socialLinks: { ...draft.socialLinks, facebook: e.target.value },
                    })
                  }
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: BUSINESS & GEOGRAPHIC COVERAGE */}
        {/* ================================================================ */}
        {activeTab === 'business' && (
          <div className="stack" style={{ gap: '14px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'الخدمات المقدمة (بالعربية - مفصولة بفاصلة)' : 'Services Offered (Arabic, comma-separated)'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={servicesArInput}
                  onChange={(e) => setServicesArInput(e.target.value)}
                  placeholder="صرف الروشتات، استشارة صيدلانية، توصيل 24 ساعة"
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'الخدمات المقدمة (بالإنجليزية - مفصولة بفاصلة)' : 'Services Offered (English, comma-separated)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={servicesEnInput}
                  onChange={(e) => setServicesEnInput(e.target.value)}
                  placeholder="Prescription dispensing, Pharmacist review, Home delivery"
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'مواعيد العمل (عربي)':'Working Hours (Arabic)'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={draft.workingHoursAr}
                  onChange={(e) => setDraft({ ...draft, workingHoursAr: e.target.value })}
                  placeholder="يومياً من 9 ص حتى 11 م"
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'مواعيد العمل (إنجليزي)':'Working Hours (English)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={draft.workingHoursEn}
                  onChange={(e) => setDraft({ ...draft, workingHoursEn: e.target.value })}
                  placeholder="Daily 9:00 AM - 11:00 PM"
                />
              </div>
            </div>

            <div className="row wrapRow" style={{ gap: '16px' }}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.deliveryAvailable}
                  onChange={(e) => setDraft({ ...draft, deliveryAvailable: e.target.checked })}
                />
                 {isAr ?'يوفر خدمة التوصيل للمنازل (Home Delivery)':'Provides Home Delivery'}
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.is24Hours}
                  onChange={(e) => setDraft({ ...draft, is24Hours: e.target.checked })}
                />
                 {isAr ?'يعمل على مدار 24 ساعة (24/7)':'Operates 24/7'}
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.requiresPrescriptionForAntibiotics}
                  onChange={(e) =>
                    setDraft({ ...draft, requiresPrescriptionForAntibiotics: e.target.checked })
                  }
                />
                 {isAr ?'يشترط روشتة طبية لصرف المضادات الحيوية':'Requires Valid Prescription for Antibiotics'}
              </label>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'تفاصيل تغطية التوصيل (عربي)' : 'Delivery Coverage Details (Arabic)'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={draft.deliveryCoverageAr}
                  onChange={(e) => setDraft({ ...draft, deliveryCoverageAr: e.target.value })}
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'تفاصيل تغطية التوصيل (إنجليزي)' : 'Delivery Coverage Details (English)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={draft.deliveryCoverageEn}
                  onChange={(e) => setDraft({ ...draft, deliveryCoverageEn: e.target.value })}
                />
              </div>
            </div>

            {/* Supported Governorates Multi-Select */}
            <div className="subcard stack">
              <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <b> {isAr ?'المحافظات المدعومة (Supported Governorates):':'Supported Governorates:'}</b>
                <div className="row" style={{ gap: '6px' }}>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        supportedGovernorates: EGYPTIAN_GOVERNORATES.map((g) => g.id),
                      })
                    }
                  >
                    {isAr ? 'تحديد كل المحافظات' : 'Select All Egypt'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => setDraft({ ...draft, supportedGovernorates: [] })}
                  >
                    {isAr ? 'إلغاء التحديد' : 'Clear'}
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
                  gap: '8px',
                  marginTop: '6px',
                }}
              >
                {EGYPTIAN_GOVERNORATES.map((gov) => {
                  const checked = draft.supportedGovernorates.includes(gov.id);
                  return (
                    <label
                      key={gov.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: checked ? '1.5px solid #0d9488' : '1px solid var(--line, #cbd5e1)',
                        background: checked ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleGov(gov.id, false)}
                      />
                      <span>{isAr ? gov.nameAr : gov.nameEn}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'المدن المدعومة (اختياري - مفصولة بفاصلة)':'Supported Cities (comma-separated)'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={citiesInput}
                  onChange={(e) => setCitiesInput(e.target.value)}
                  placeholder={isAr ? 'مثال: المنصورة، مدينة نصر، طنطا، المهندسين' : 'e.g. Mansoura, Nasr City, Tanta'}
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'الأحياء / المراكز المدعومة (اختياري)':'Supported Districts (comma-separated)'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={districtsInput}
                  onChange={(e) => setDistrictsInput(e.target.value)}
                  placeholder={isAr ? 'مثال: حي الجامعة، الدقي، سموحة' : 'e.g. University District, Dokki, Smouha'}
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: PARTNERSHIP & ADMINISTRATIVE INFO (PRIVATE ADMIN SEPARATION) */}
        {/* ================================================================ */}
        {activeTab === 'partnership' && (
          <div className="stack" style={{ gap: '14px' }}>
            <div className="notice">
               
              {isAr
                ? 'تنبيه الأمان والخصوصية: بيانات التواصل الإداري والملاحظات الداخلية تُحفظ في مجموعة إدارية محمية ومنفصلة (partnerPrivateAdmin) ولا تظهر أبداً لزوار الموقع العام.'
                : 'Security Notice: Administrative contacts and internal notes are stored in a restricted private collection (partnerPrivateAdmin) and are never exposed publicly.'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'حالة الشراكة (Partnership Status)' : 'Partnership Status'}
                </label>
                <select
                  className="input"
                  value={draft.partnershipStatus}
                  disabled={!permissions.canPublishOrHide}
                  onChange={(e) =>
                    setDraft({ ...draft, partnershipStatus: e.target.value as PartnershipStatus })
                  }
                >
                  {(Object.keys(PARTNERSHIP_STATUS_LABELS) as PartnershipStatus[]).map((st) => (
                    <option key={st} value={st}>
                      {isAr ? PARTNERSHIP_STATUS_LABELS[st].ar : PARTNERSHIP_STATUS_LABELS[st].en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'حالة التوثيق والتراخيص (Verification Status)' : 'Verification Status'}
                </label>
                <select
                  className="input"
                  value={draft.verificationStatus}
                  disabled={!permissions.canVerifyPartner}
                  onChange={(e) =>
                    setDraft({ ...draft, verificationStatus: e.target.value as VerificationStatus })
                  }
                >
                  {(Object.keys(VERIFICATION_STATUS_LABELS) as VerificationStatus[]).map((vst) => (
                    <option key={vst} value={vst}>
                      {isAr ? VERIFICATION_STATUS_LABELS[vst].ar : VERIFICATION_STATUS_LABELS[vst].en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'تاريخ بدء الشراكة':'Partnership Start Date'}
                </label>
                <input
                  type="date"
                  dir="ltr"
                  className="input"
                  value={draft.privateAdmin.partnershipStartDateIso || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      privateAdmin: { ...draft.privateAdmin, partnershipStartDateIso: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'تاريخ انتهاء الشراكة (اختياري)':'Expiration Date (Optional)'}
                </label>
                <input
                  type="date"
                  dir="ltr"
                  className="input"
                  value={draft.privateAdmin.partnershipExpirationDateIso || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      privateAdmin: {
                        ...draft.privateAdmin,
                        partnershipExpirationDateIso: e.target.value || null,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'اسم مسؤول التواصل (Contact Person)':'Contact Person Name'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={draft.privateAdmin.contactPersonName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      privateAdmin: { ...draft.privateAdmin, contactPersonName: e.target.value },
                    })
                  }
                  placeholder={isAr ? 'د. أحمد محمود (مدير التعاقدات)' : 'Dr. Ahmed Mahmoud'}
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'هاتف التواصل الإداري السري':'Administrative Phone'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  className="input"
                  value={draft.privateAdmin.administrativePhone}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      privateAdmin: { ...draft.privateAdmin, administrativePhone: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'البريد الإداري السري':'Administrative Email'}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  className="input"
                  value={draft.privateAdmin.administrativeEmail}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      privateAdmin: { ...draft.privateAdmin, administrativeEmail: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                 {isAr ?'ملاحظات إدارية داخلية (لا تظهر للجمهور أبداً)':'Internal Administrative Notes (Private)'}
              </label>
              <textarea
                rows={3}
                className="input"
                value={draft.privateAdmin.internalNotes}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    privateAdmin: { ...draft.privateAdmin, internalNotes: e.target.value },
                  })
                }
                placeholder={
                  isAr
                    ? 'اكتب أي ملاحظات خاصة بالتعاقد، التراخيص، أو المراجعة الداخلية...'
                    : 'Private contract or verification notes...'
                }
              />
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 4: OWNER-CONTROLLED VISIBILITY & PLACEMENT MANAGEMENT */}
        {/* ================================================================ */}
        {activeTab === 'visibility' && (
          <div className="stack" style={{ gap: '14px' }}>
            <div className="subcard" style={{ background: 'rgba(13, 148, 136, 0.06)', borderColor: '#0d9488' }}>
              <b> {isAr ?'لوحة التحكم الكاملة للمالك في النشر والظهور (Owner Visibility Control)':'Owner-Controlled Publication & Visibility Panel'}</b>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'تحكم بدقة في مكان وتوقيت ونطاق ظهور هذا الشريك على الموقع العام. لن يظهر الشريك للجمهور إلا إذا كانت حالة الشراكة (Active) وحالة النشر (Published) ومفتاح الظهور العام مفعلاً.'
                  : 'Control exactly where, when, and in which governorates this partner appears publicly.'}
              </p>
            </div>

            {/* Publication & Visibility Status Selectors */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'حالة النشر (Publication Status)':'Publication Status'}
                </label>
                <select
                  className="input"
                  value={draft.publicationStatus}
                  disabled={!permissions.canPublishOrHide}
                  onChange={(e) => {
                    const nextPub = e.target.value as PublicationStatus;
                    setDraft((prev) => ({
                      ...prev,
                      publicationStatus: nextPub,
                      visibilityStatus: nextPub === 'published' ? 'visible' : 'hidden',
                    }));
                  }}
                >
                  {(Object.keys(PUBLICATION_STATUS_LABELS) as PublicationStatus[]).map((pst) => (
                    <option key={pst} value={pst}>
                      {isAr ? PUBLICATION_STATUS_LABELS[pst].ar : PUBLICATION_STATUS_LABELS[pst].en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'حالة الظهور (Visibility Status)':'Visibility Status'}
                </label>
                <select
                  className="input"
                  value={draft.visibilityStatus}
                  disabled={!permissions.canPublishOrHide}
                  onChange={(e) =>
                    setDraft({ ...draft, visibilityStatus: e.target.value as VisibilityStatus })
                  }
                >
                  <option value="hidden">{isAr ? 'مخفي (Hidden)' : 'Hidden'}</option>
                  <option value="visible">{isAr ? 'مرئي للجمهور (Visible)' : 'Visible'}</option>
                  <option value="temporarily_suspended">{isAr ? 'موقوف مؤقتاً (Temporarily Suspended)' : 'Temporarily Suspended'}</option>
                  <option value="scheduled_campaign">{isAr ? 'مرتبط بجدول زمني (Scheduled)' : 'Scheduled Campaign'}</option>
                </select>
              </div>
            </div>

            {/* A. 8 Main Visibility Toggles */}
            <div className="subcard stack">
              <b>A. {isAr ? 'مفاتيح الظهور الرئيسية (Main Visibility Switches ON/OFF):' : 'Main Visibility Switches (ON/OFF):'}</b>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '10px',
                  marginTop: '6px',
                }}
              >
                {[
                  {
                    key: 'showOnWebsite' as const,
                    ar: '1. إظهار الشريك على الموقع العام (المفتاح الرئيسي)',
                    en: '1. Show partner on website (Master ON/OFF)',
                  },
                  {
                    key: 'publishPartnerProfile' as const,
                    ar: '2. نشر صفحة الملف التعريفي المستقلة للشريك',
                    en: '2. Publish dedicated partner profile page',
                  },
                  {
                    key: 'showInPartnerDirectory' as const,
                    ar: '3. إظهار في دليل الشركاء والصيدليات العام',
                    en: '3. Show in public partner & pharmacy directory',
                  },
                  {
                    key: 'showOnHomepage' as const,
                    ar: '4. إظهار في الصفحة الرئيسية (Homepage)',
                    en: '4. Show on Homepage',
                  },
                  {
                    key: 'showInMedicationSearch' as const,
                    ar: '5. إظهار في نتائج البحث عن الأدوية (Medication Search)',
                    en: '5. Show in medication search results',
                  },
                  {
                    key: 'showInMedicationDetails' as const,
                    ar: '6. إظهار في صفحات تفاصيل الدواء («اعثر على دوائك»)',
                    en: '6. Show in medication detail pages ("Find This Medication")',
                  },
                  {
                    key: 'showInNearbyPharmacies' as const,
                    ar: '7. إظهار في نتائج الصيدليات القريبة جغرافياً',
                    en: '7. Show in nearby pharmacies discovery',
                  },
                  {
                    key: 'showInRelevantServiceSections' as const,
                    ar: '8. إظهار في أقسام الخدمات والأدوات السريرية ذات الصلة',
                    en: '8. Show in relevant service & cost-saver sections',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: draft.visibility[item.key]
                        ? '1.5px solid #16a34a'
                        : '1px solid var(--line, #cbd5e1)',
                      background: draft.visibility[item.key]
                        ? 'rgba(22, 163, 74, 0.08)'
                        : 'transparent',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={draft.visibility[item.key]}
                      disabled={!permissions.canPublishOrHide}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          visibility: { ...draft.visibility, [item.key]: e.target.checked },
                        })
                      }
                    />
                    <span>{isAr ? item.ar : item.en}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* B. Specific Placement Controls */}
            <div className="subcard stack">
              <b>B. {isAr ? 'مواضع الظهور المحددة (Placement Locations):' : 'Specific Website Placements:'}</b>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '8px',
                }}
              >
                {(Object.keys(PLACEMENT_LOCATION_LABELS) as PlacementLocationId[]).map((locId) => {
                  const checked = draft.visibility.allowedPlacements.includes(locId);
                  return (
                    <label
                      key={locId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleTogglePlacement(locId)}
                      />
                      <span>
                        {isAr
                          ? PLACEMENT_LOCATION_LABELS[locId].ar
                          : PLACEMENT_LOCATION_LABELS[locId].en}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* C. Geographic Visibility */}
            <div className="subcard stack">
              <b>C. {isAr ? 'نطاق الظهور الجغرافي (Geographic Visibility Rule):' : 'Geographic Visibility Scope:'}</b>
              <p className="small muted" style={{ margin: 0 }}>
                {isAr
                  ? 'الشريك الذي يخدم القاهرة لن يظهر كمتاح في طنطا إلا إذا كانت تغطيته الجغرافية أو فروعه تدعم تلك المنطقة.'
                  : 'A partner serving Cairo will not appear as available in Tanta unless its coverage supports that area.'}
              </p>
              <select
                className="input"
                value={draft.visibility.geographicScope}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    visibility: {
                      ...draft.visibility,
                      geographicScope: e.target.value as GeographicScopeType,
                    },
                  })
                }
              >
                <option value="all_egypt">{isAr ? 'حسب جميع المحافظات المدعومة للشريك (أو كل مصر)' : 'All Supported Partner Governorates / All Egypt'}</option>
                <option value="specific_governorates">{isAr ? 'تخصيص محافظات محددة فقط للظهور' : 'Specific Selected Governorates Only'}</option>
                <option value="specific_cities">{isAr ? 'تخصيص مدن محددة فقط' : 'Specific Cities Only'}</option>
                <option value="selected_branches_only">{isAr ? 'حسب نطاق الفروع المنشورة فقط' : 'Published Branches Coverage Only'}</option>
              </select>

              {draft.visibility.geographicScope === 'specific_governorates' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '6px',
                    marginTop: '8px',
                  }}
                >
                  {EGYPTIAN_GOVERNORATES.map((gov) => {
                    const checked = draft.visibility.allowedGovernorates.includes(gov.id);
                    return (
                      <label
                        key={gov.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.8rem',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--line, #cbd5e1)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleGov(gov.id, true)}
                        />
                        <span>{isAr ? gov.nameAr : gov.nameEn}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* D. Display Priority & Sponsored Disclosure */}
            <div className="subcard stack">
              <b>D. {isAr ? 'أولوية الترتيب والظهور (Display Priority):' : 'Display Priority & Sorting Controls:'}</b>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {isAr ? 'ترتيب العرض العام (الأصغر يظهر أولاً)' : 'Display Order (1 = First)'}
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={draft.visibility.displayOrder}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visibility: { ...draft.visibility, displayOrder: Number(e.target.value) || 100 },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {isAr ? 'أولوية الصفحة الرئيسية' : 'Homepage Priority'}
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={draft.visibility.homepagePriority}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visibility: {
                          ...draft.visibility,
                          homepagePriority: Number(e.target.value) || 100,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {isAr ? 'أولوية نتائج البحث الدوائي' : 'Medication Search Priority'}
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={draft.visibility.searchResultPriority}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visibility: {
                          ...draft.visibility,
                          searchResultPriority: Number(e.target.value) || 100,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="row wrapRow" style={{ gap: '16px', marginTop: '6px' }}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={draft.visibility.featuredPlacement}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visibility: { ...draft.visibility, featuredPlacement: e.target.checked },
                      })
                    }
                  />
                  ⭐ {isAr ? 'وضع مميز (Featured Placement)' : 'Featured Placement'}
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={draft.visibility.isSponsoredPlacement}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visibility: { ...draft.visibility, isSponsoredPlacement: e.target.checked },
                      })
                    }
                  />
                   {isAr ?'تصنيف كإعلان/رعاية مدفوعة (Sponsored Disclosure)':'Mark as Paid / Sponsored Placement'}
                </label>
              </div>
            </div>

            {/* E. Scheduled & Temporary Visibility */}
            <div className="subcard stack">
              <b>E. {isAr ? 'الجدولة الزمنية والإيقاف المؤقت (Scheduled & Temporary Visibility):' : 'Scheduled Publication & Temporary Suspension:'}</b>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                     {isAr ?'تاريخ ووقت النشر المجدول (اختياري)':'Scheduled Publish Time (Optional)'}
                  </label>
                  <input
                    type="datetime-local"
                    dir="ltr"
                    className="input"
                    value={
                      draft.visibility.scheduledPublishAtIso
                        ? draft.visibility.scheduledPublishAtIso.slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visibility: {
                          ...draft.visibility,
                          scheduledPublishAtIso: e.target.value ? new Date(e.target.value).toISOString() : null,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                     {isAr ?'تاريخ ووقت الإخفاء التلقائي (اختياري)':'Scheduled Auto-Deactivate Time'}
                  </label>
                  <input
                    type="datetime-local"
                    dir="ltr"
                    className="input"
                    value={
                      draft.visibility.scheduledDeactivateAtIso
                        ? draft.visibility.scheduledDeactivateAtIso.slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visibility: {
                          ...draft.visibility,
                          scheduledDeactivateAtIso: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <label className="check" style={{ marginTop: '6px', color: '#dc2626', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={draft.visibility.temporarilySuspended}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      visibility: { ...draft.visibility, temporarilySuspended: e.target.checked },
                    })
                  }
                />
                ⏸ {isAr ?'إيقاف ظهور الشريك مؤقتاً مع الاحتفاظ بكامل سجلاته وفروعه (Temporary Suspension)':'Temporarily Suspend Public Visibility (Keep All Records)'}
              </label>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 5: PUBLIC DISPLAY CUSTOMIZATION */}
        {/* ================================================================ */}
        {activeTab === 'display' && (
          <div className="stack" style={{ gap: '14px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'تصميم بطاقة الشريك (Card Theme)':'Partner Card Theme'}
                </label>
                <select
                  className="input"
                  value={draft.display.cardDesign}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      display: { ...draft.display, cardDesign: e.target.value as PartnerCardTheme },
                    })
                  }
                >
                  <option value="standard_medical">{isAr ? 'قياسي طبي نظيف (Standard Medical)' : 'Standard Medical'}</option>
                  <option value="featured_teal">{isAr ? 'مميز فيروزي (Featured Teal)' : 'Featured Teal'}</option>
                  <option value="highlight_navy">{isAr ? 'كحلي بارز (Highlight Navy)' : 'Highlight Navy'}</option>
                  <option value="compact_directory">{isAr ? 'مدمج للدليل السريع (Compact)' : 'Compact Directory'}</option>
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'شعار فرعي قصير (Tagline - عربي)' : 'Custom Tagline (Arabic)'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={draft.display.customTaglineAr}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      display: { ...draft.display, customTaglineAr: e.target.value },
                    })
                  }
                  placeholder={isAr ? 'مثال: خدمة صيدلانية 24 ساعة في القاهرة والجيزة' : ''}
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'شعار فرعي قصير (Tagline - إنجليزي)' : 'Custom Tagline (English)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={draft.display.customTaglineEn}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      display: { ...draft.display, customTaglineEn: e.target.value },
                    })
                  }
                  placeholder="e.g. 24/7 Pharmacy Care in Cairo & Giza"
                />
              </div>
            </div>

            <div className="subcard stack">
              <b>{isAr ? 'عناصر البطاقة المرئية للزوار:' : 'Visible Card Elements:'}</b>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '8px',
                }}
              >
                {[
                  { k: 'showLogo' as const, ar: 'إظهار شعار الشريك (Logo)', en: 'Show Partner Logo' },
                  { k: 'showCoverImage' as const, ar: 'إظهار صورة الغلاف (Cover)', en: 'Show Cover Image' },
                  { k: 'showDescription' as const, ar: 'إظهار الوصف التعريفي', en: 'Show Description' },
                  { k: 'showContactInfo' as const, ar: 'إظهار أرقام التواصل والخط الساخن', en: 'Show Contact Info' },
                  { k: 'showPhoneButton' as const, ar: 'إظهار زر الاتصال المباشر', en: 'Show Call Button' },
                  { k: 'showBranchInfo' as const, ar: 'إظهار عدد الفروع المنشورة', en: 'Show Branch Count' },
                  { k: 'showWorkingHours' as const, ar: 'إظهار مواعيد العمل', en: 'Show Working Hours' },
                  { k: 'showDeliveryIndicator' as const, ar: 'إظهار شارة التوصيل للمنازل', en: 'Show Delivery Indicator' },
                  { k: 'showExternalOrderingButton' as const, ar: 'إظهار زر الطلب الخارجي (إن وجد)', en: 'Show Ordering Button' },
                  { k: 'showWebsiteButton' as const, ar: 'إظهار زر الموقع الرسمي', en: 'Show Website Button' },
                  { k: 'showFeaturedBadge' as const, ar: 'إظهار شارة «شريك مميز»', en: 'Show Featured Badge' },
                  { k: 'showVerificationBadge' as const, ar: 'إظهار شارة التوثيق (فقط إذا كان موثقاً)', en: 'Show Verification Badge (if verified)' },
                  { k: 'showSpecialOffers' as const, ar: 'إظهار قسم العروض/المبادرات الخاصة', en: 'Show Special Offers Box' },
                ].map((el) => (
                  <label key={el.k} className="check" style={{ fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={draft.display[el.k]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          display: { ...draft.display, [el.k]: e.target.checked },
                        })
                      }
                    />
                    <span>{isAr ? el.ar : el.en}</span>
                  </label>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'نص زر الطلب (عربي)' : 'Order CTA Button Text (Arabic)'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={draft.display.customCtaTextAr}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      display: { ...draft.display, customCtaTextAr: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'نص زر الطلب (إنجليزي)' : 'Order CTA Button Text (English)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={draft.display.customCtaTextEn}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      display: { ...draft.display, customCtaTextEn: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 6: INTEGRATION & ORDERING CONFIGURATION */}
        {/* ================================================================ */}
        {activeTab === 'integration' && (
          <div className="stack" style={{ gap: '14px' }}>
            <div className="notice">
               
              {isAr
                ? 'بنية الربط القياسية: يدعم النظام الروابط الخارجية المعتمدة، الإدارة اليدوية للتوفر والأسعار، أو الربط عبر API/Webhook مستقبلي دون الحاجة لتعديل الكود أو ادعاء توفر غير حقيقي.'
                : 'Modular Integration Architecture: Supports external ordering links, manual verified availability, or future authorized API/webhook providers without faking stock or prices.'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'طريقة الربط والتكامل (Integration Method)' : 'Integration Method'}
                </label>
                <select
                  className="input"
                  value={draft.integrationMethod}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      integrationMethod: e.target.value as IntegrationMethodType,
                    })
                  }
                >
                  {(Object.keys(INTEGRATION_METHOD_LABELS) as IntegrationMethodType[]).map((m) => (
                    <option key={m} value={m}>
                      {isAr ? INTEGRATION_METHOD_LABELS[m].ar : INTEGRATION_METHOD_LABELS[m].en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'حالة الربط البرمجي (API Integration Status)' : 'API Integration Status'}
                </label>
                <select
                  className="input"
                  value={draft.apiIntegrationStatus}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      apiIntegrationStatus: e.target.value as ApiIntegrationStatus,
                    })
                  }
                >
                  <option value="none">{isAr ? 'بدون ربط API (None)' : 'None'}</option>
                  <option value="manual_only">{isAr ? 'إدارة يدوية فقط (Manual Only)' : 'Manual Only'}</option>
                  <option value="external_link_only">{isAr ? 'رابط خارجي معتمد فقط (External Link)' : 'External Link Only'}</option>
                  <option value="configured_pending">{isAr ? 'مُعد وبانتظار التفعيل (Pending)' : 'Configured / Pending'}</option>
                  <option value="active_healthy">{isAr ? 'ربط برمجي نشط (Active API)' : 'Active & Healthy'}</option>
                  <option value="disabled">{isAr ? 'معطل (Disabled)' : 'Disabled'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                 {isAr ?'رابط الطلب الخارجي المعتمد (External Ordering URL)':'Authorized External Ordering URL'}
              </label>
              <input
                type="url"
                dir="ltr"
                className="input"
                value={draft.externalOrderingUrl}
                onChange={(e) => setDraft({ ...draft, externalOrderingUrl: e.target.value })}
                placeholder="https://partner-pharmacy.com/order"
              />
              <span className="small muted">
                {isAr
                  ? 'ملاحظة: لن يظهر زر شراء/طلب فعال للزوار إذا لم يكن هناك رابط طلب صالح أو تفعيل لخدمة الطلب.'
                  : 'Note: A functional purchase/order button will only appear if a valid ordering destination exists.'}
              </span>
            </div>

            <div className="row wrapRow" style={{ gap: '16px' }}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.supportsOnlineOrdering}
                  onChange={(e) => setDraft({ ...draft, supportsOnlineOrdering: e.target.checked })}
                />
                 {isAr ?'تفعيل إمكانية الطلب الإلكتروني لهذا الشريك':'Enable Online Ordering for this Partner'}
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.availabilitySyncEnabled}
                  onChange={(e) =>
                    setDraft({ ...draft, availabilitySyncEnabled: e.target.checked })
                  }
                />
                 {isAr ?'تفعيل مزامنة التوفر (Availability Sync)':'Availability Synchronization Enabled'}
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.priceSyncEnabled}
                  onChange={(e) => setDraft({ ...draft, priceSyncEnabled: e.target.checked })}
                />
                 {isAr ?'تفعيل مزامنة الأسعار الموثقة (Price Sync)':'Price Synchronization Enabled'}
              </label>
            </div>

            <div className="subcard stack">
              <b> {isAr ?'قوالب المحولات البرمجية الجاهزة (Modular Provider Blueprints):':'Modular Provider Adapter Blueprints:'}</b>
              <select
                className="input"
                value={draft.privateAdmin.providerAdapterId}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    privateAdmin: { ...draft.privateAdmin, providerAdapterId: e.target.value },
                  })
                }
              >
                {EGYPTIAN_HEALTHCARE_INTEGRATION_BLUEPRINTS.map((bp) => (
                  <option key={bp.adapterId} value={bp.adapterId}>
                    {isAr ? bp.organizationNameAr : bp.organizationNameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 7: LIVE PREVIEW BEFORE PUBLISHING */}
        {/* ================================================================ */}
        {activeTab === 'preview' && (
          <div className="stack" style={{ gap: '14px' }}>
            <div className="notice">
               
              {isAr
                ? 'معاينة حية (Live Preview): هكذا ستظهر بطاقة الشريك للزوار على الموقع العام بناءً على إعدادات التخصيص الحالية.'
                : 'Live Preview: This is how the partner card will appear to public visitors once approved and published.'}
            </div>

            <div style={{ maxWidth: '460px', margin: '0 auto', width: '100%' }}>
              <PublicPartnerCard
                partner={draft}
                category={selectedCategory}
                isPreview={true}
              />
            </div>

            <div className="subcard small" style={{ lineHeight: 1.8 }}>
              <div>
                <b>{isAr ? 'ملخص حالة الظهور الحالية:' : 'Current Visibility Summary:'}</b>
              </div>
              <div>
                • {isAr ? 'حالة الشراكة:' : 'Partnership Status:'}{' '}
                <b>{draft.partnershipStatus}</b>
              </div>
              <div>
                • {isAr ? 'حالة التوثيق:' : 'Verification Status:'}{' '}
                <b>{draft.verificationStatus}</b>
              </div>
              <div>
                • {isAr ? 'حالة النشر:' : 'Publication Status:'}{' '}
                <b>{draft.publicationStatus}</b>
              </div>
              <div>
                • {isAr ? 'هل يظهر حالياً للجمهور العام؟' : 'Currently Visible on Public Website?'}{' '}
                <strong
                  style={{
                    color:
                      draft.partnershipStatus === 'active' &&
                      draft.publicationStatus === 'published' &&
                      draft.visibility.showOnWebsite &&
                      !draft.visibility.temporarilySuspended
                        ? '#16a34a'
                        : '#dc2626',
                  }}
                >
                  {draft.partnershipStatus === 'active' &&
                  draft.publicationStatus === 'published' &&
                  draft.visibility.showOnWebsite &&
                  !draft.visibility.temporarilySuspended
                    ? isAr
                      ?'نعم — منشور ومرئي للجمهور'                      :'YES — Live & Publicly Visible'                    : isAr
                    ? 'لا — محفوظ كمسودة أو مخفي عن الجمهور (آمن قبل النشر)'
                    : 'NO — Draft / Hidden from Public'}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div
          className="row wrapRow"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--line, #e2e8f0)',
            paddingTop: '14px',
            marginTop: '8px',
            gap: '10px',
          }}
        >
          <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button
              type="button"
              className="btn ghost"
              disabled={saving}
              onClick={(e) => handleSubmit(e as unknown as FormEvent, true)}
            >
               {isAr ?'حفظ كمسودة مخفية (Save as Draft)':'Save as Hidden Draft'}
            </button>

            <button type="submit" className="btn" disabled={saving} style={{ background: '#0d9488' }}>
              {saving
                ? isAr
                  ? 'جارٍ الحفظ في Firestore...'
                  : 'Saving to Firestore...'
                : isAr
                ?'حفظ التعديلات والإعدادات الحالية'                :'Save Partner Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}
