import { FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from './i18n';
import {
  BranchStatus,
  EGYPTIAN_GOVERNORATES,
  PartnerBranchRecord,
  PartnerCategoryRecord,
  PartnerFullAdminRecord,
  PartnerMedicationMappingRecord,
  StockVerificationState,
} from './partnerTypes';
import {
  deletePartnerBranch,
  deletePartnerMedicationMapping,
  savePartnerBranch,
  savePartnerCategory,
  savePartnerMedicationMapping,
} from './partnerService';
import { ACTIVE_INGREDIENTS } from './egyptianDrugDatabase';
import { useLiveDrugCatalog } from './liveCatalogSync';

// ============================================================================
// 1. BRANCH MANAGER MODAL (Add, Edit, Publish/Unpublish Unlimited Branches)
// ============================================================================
export function PartnerBranchManagerModal({
  partner,
  branches,
  adminUid,
  adminRole,
  onClose,
}: {
  partner: PartnerFullAdminRecord;
  branches: PartnerBranchRecord[];
  adminUid: string;
  adminRole: string;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const createEmptyBranch = (): PartnerBranchRecord => ({
    id: `branch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    partnerId: partner.id,
    nameAr: '',
    nameEn: '',
    addressAr: '',
    addressEn: '',
    governorateId: partner.supportedGovernorates[0] || 'cairo',
    city: '',
    district: '',
    latitude: null,
    longitude: null,
    phone: partner.phone || partner.hotline || '',
    whatsapp: partner.socialLinks?.whatsapp || '',
    workingHoursAr: partner.workingHoursAr || 'يومياً 9 ص - 11 م',
    workingHoursEn: partner.workingHoursEn || 'Daily 9 AM - 11 PM',
    is24Hours: partner.is24Hours,
    deliveryAvailable: partner.deliveryAvailable,
    deliveryCoverageAr: 'توصيل في نطاق الحي والمدينة',
    deliveryCoverageEn: 'Local city & district delivery',
    serviceGovernorates: [partner.supportedGovernorates[0] || 'cairo'],
    serviceCities: [],
    serviceDistricts: [],
    branchStatus: 'active',
    published: false, // Default unpublished until owner chooses to publish branch
    branchOrderingUrl: partner.externalOrderingUrl || '',
    googleMapsUrl: '',
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
    updatedBy: adminUid,
  });

  const [editingBranch, setEditingBranch] = useState<PartnerBranchRecord | null>(null);
  const [isNewBranch, setIsNewBranch] = useState(true);
  const [latStr, setLatStr] = useState('');
  const [lngStr, setLngStr] = useState('');
  const [serviceCitiesStr, setServiceCitiesStr] = useState('');
  const [busy, setBusy] = useState(false);

  const partnerBranches = branches.filter((b) => b.partnerId === partner.id);

  const startNew = () => {
    const empty = createEmptyBranch();
    setEditingBranch(empty);
    setIsNewBranch(true);
    setLatStr('');
    setLngStr('');
    setServiceCitiesStr('');
  };

  const startEdit = (b: PartnerBranchRecord) => {
    setEditingBranch({ ...b });
    setIsNewBranch(false);
    setLatStr(b.latitude !== null ? String(b.latitude) : '');
    setLngStr(b.longitude !== null ? String(b.longitude) : '');
    setServiceCitiesStr((b.serviceCities || []).join('، '));
  };

  const handleSaveBranch = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    if (!editingBranch.nameAr.trim() && !editingBranch.nameEn.trim()) return;

    setBusy(true);
    try {
      const parsedLat = latStr.trim() ? Number(latStr) : null;
      const parsedLng = lngStr.trim() ? Number(lngStr) : null;
      const sCities = serviceCitiesStr
        .split(/[,،\n]+/)
        .map((c) => c.trim())
        .filter(Boolean);

      const toSave: PartnerBranchRecord = {
        ...editingBranch,
        nameAr: editingBranch.nameAr.trim() || editingBranch.nameEn.trim(),
        nameEn: editingBranch.nameEn.trim() || editingBranch.nameAr.trim(),
        latitude: parsedLat !== null && !Number.isNaN(parsedLat) ? parsedLat : null,
        longitude: parsedLng !== null && !Number.isNaN(parsedLng) ? parsedLng : null,
        serviceGovernorates: Array.from(
          new Set([editingBranch.governorateId, ...(editingBranch.serviceGovernorates || [])])
        ),
        serviceCities: sCities,
      };

      await savePartnerBranch(toSave, adminUid, adminRole, isNewBranch);
      setEditingBranch(null);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleBranchPublish = async (b: PartnerBranchRecord) => {
    setBusy(true);
    try {
      await savePartnerBranch(
        {
          ...b,
          published: !b.published,
          branchStatus: !b.published ? 'active' : b.branchStatus,
        },
        adminUid,
        adminRole,
        false
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (b: PartnerBranchRecord) => {
    if (
      !confirm(
        isAr
          ? `هل أنت متأكد من حذف الفرع (${b.nameAr})؟`
          : `Delete branch (${b.nameEn || b.nameAr})?`
      )
    )
      return;
    setBusy(true);
    try {
      await deletePartnerBranch(b.id, partner.id, b.nameAr || b.nameEn, adminUid, adminRole);
    } finally {
      setBusy(false);
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
        zIndex: 10070,
      }}
      onClick={onClose}
    >
      <div
        className="card stack"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          maxWidth: '880px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '20px',
          background: 'var(--card-bg, #fff)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge" style={{ background: '#ccfbf1', color: '#0f766e', fontWeight: 700 }}>
               {isAr ?'إدارة الفروع والتغطية الجغرافية':'Branch & Geographic Coverage Manager'}
            </span>
            <h2 style={{ margin: '4px 0 0' }}>
              {isAr ? partner.nameAr : partner.nameEn} ({partnerBranches.length}{' '}
              {isAr ? 'فرع' : 'branches'})
            </h2>
          </div>
          <div className="row" style={{ gap: '8px' }}>
            <button type="button" className="btn small" onClick={startNew}>
               {isAr ?'إضافة فرع جديد':'Add Branch'}
            </button>
            <button type="button" className="btn ghost small" onClick={onClose}>
              
            </button>
          </div>
        </div>

        {/* Add/Edit Branch Form */}
        {editingBranch && (
          <form className="subcard stack" onSubmit={handleSaveBranch} style={{ border: '2px solid #0d9488' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <b>
                {isNewBranch
                  ? isAr
                    ?'بيانات الفرع الجديد:'                    :'New Branch Details:'                  : isAr
                  ?`تعديل الفرع (${editingBranch.nameAr}):`                  :`Edit Branch (${editingBranch.nameEn}):`}
              </b>
              <button type="button" className="btn ghost small" onClick={() => setEditingBranch(null)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '10px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'اسم الفرع (عربي) *' : 'Branch Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingBranch.nameAr}
                  onChange={(e) => setEditingBranch({ ...editingBranch, nameAr: e.target.value })}
                  placeholder={isAr ? 'فرع مدينة نصر - عباس العقاد' : ''}
                  required
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'اسم الفرع (إنجليزي)' : 'Branch Name (English)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={editingBranch.nameEn}
                  onChange={(e) => setEditingBranch({ ...editingBranch, nameEn: e.target.value })}
                  placeholder="Nasr City - Abbas El Akkad Branch"
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'المحافظة *' : 'Governorate *'}
                </label>
                <select
                  className="input"
                  value={editingBranch.governorateId}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, governorateId: e.target.value })
                  }
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
                  {isAr ? 'المدينة / المركز *' : 'City *'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingBranch.city}
                  onChange={(e) => setEditingBranch({ ...editingBranch, city: e.target.value })}
                  placeholder={isAr ? 'مثال: المنصورة / مدينة نصر / طنطا' : 'e.g. Mansoura / Nasr City'}
                  required
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'الحي / المنطقة' : 'District'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingBranch.district}
                  onChange={(e) => setEditingBranch({ ...editingBranch, district: e.target.value })}
                  placeholder={isAr ? 'مثال: حي الجامعة / الدقي' : 'e.g. University District'}
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'هاتف الفرع المباشر' : 'Branch Phone'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  className="input"
                  value={editingBranch.phone}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '10px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'العنوان التفصيلي (عربي)':'Detailed Address (Arabic)'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingBranch.addressAr}
                  onChange={(e) => setEditingBranch({ ...editingBranch, addressAr: e.target.value })}
                  placeholder={isAr ? '45 شارع الجمهورية بجوار مستشفى الجامعة' : ''}
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'العنوان التفصيلي (إنجليزي)':'Detailed Address (English)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={editingBranch.addressEn}
                  onChange={(e) => setEditingBranch({ ...editingBranch, addressEn: e.target.value })}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '10px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   Latitude (خط العرض - اختياري)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={latStr}
                  onChange={(e) => setLatStr(e.target.value)}
                  placeholder="30.0444"
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   Longitude (خط الطول - اختياري)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={lngStr}
                  onChange={(e) => setLngStr(e.target.value)}
                  placeholder="31.2357"
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'حالة الفرع' : 'Branch Status'}
                </label>
                <select
                  className="input"
                  value={editingBranch.branchStatus}
                  onChange={(e) =>
                    setEditingBranch({
                      ...editingBranch,
                      branchStatus: e.target.value as BranchStatus,
                    })
                  }
                >
                  <option value="active">{isAr ? 'نشط (Active)' : 'Active'}</option>
                  <option value="inactive">{isAr ? 'غير نشط (Inactive)' : 'Inactive'}</option>
                  <option value="temporarily_closed">{isAr ? 'مغلق مؤقتاً' : 'Temporarily Closed'}</option>
                  <option value="draft">{isAr ? 'مسودة (Draft)' : 'Draft'}</option>
                </select>
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                   {isAr ?'رابط طلب خاص بالفرع (اختياري)':'Branch Ordering URL'}
                </label>
                <input
                  type="url"
                  dir="ltr"
                  className="input"
                  value={editingBranch.branchOrderingUrl}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, branchOrderingUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                 {isAr ?'نطاق التوصيل الإضافي للفرع (مدن/أحياء يخدمها هذا الفرع - مفصولة بفاصلة)':'Additional Cities/Districts Served by this Branch'}
              </label>
              <input
                type="text"
                className="input"
                value={serviceCitiesStr}
                onChange={(e) => setServiceCitiesStr(e.target.value)}
                placeholder={isAr ? 'مثال: طلخا، أجا، نوسا البحر، حي الجامعة' : 'e.g. Talkha, Aga, University District'}
              />
            </div>

            <div className="row wrapRow" style={{ gap: '16px' }}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={editingBranch.published}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, published: e.target.checked })
                  }
                />
                 {isAr ?'نشر هذا الفرع للجمهور على الموقع العام':'Publish this branch publicly'}
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={editingBranch.deliveryAvailable}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, deliveryAvailable: e.target.checked })
                  }
                />
                 {isAr ?'يوفر توصيل للمنازل':'Delivery Available'}
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={editingBranch.is24Hours}
                  onChange={(e) =>
                    setEditingBranch({ ...editingBranch, is24Hours: e.target.checked })
                  }
                />
                 {isAr ?'يعمل 24 ساعة':'Open 24 Hours'}
              </label>
            </div>

            <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button type="submit" className="btn small" disabled={busy}>
                 {isAr ?'حفظ بيانات الفرع':'Save Branch'}
              </button>
            </div>
          </form>
        )}

        {/* Branches List */}
        {partnerBranches.length === 0 ? (
          <p className="muted center" style={{ padding: '20px' }}>
            {isAr
              ? 'لا توجد فروع مضافة لهذا الشريك حتى الآن. اضغط «إضافة فرع جديد» لإضافة الفروع وتحديد تغطيتها الجغرافية.'
              : 'No branches added for this partner yet. Click "Add Branch" to configure branch locations.'}
          </p>
        ) : (
          <div className="stack" style={{ gap: '8px' }}>
            {partnerBranches.map((b) => {
              const govInfo = EGYPTIAN_GOVERNORATES.find((g) => g.id === b.governorateId);
              return (
                <div
                  key={b.id}
                  className="subcard row wrapRow"
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    borderInlineStart: b.published ? '4px solid #16a34a' : '4px solid #94a3b8',
                  }}
                >
                  <div>
                    <div className="row wrapRow" style={{ gap: '6px', alignItems: 'center' }}>
                      <b>{isAr ? b.nameAr : b.nameEn}</b>
                      <span
                        className="badge"
                        style={{
                          background: b.published ? '#dcfce7' : '#f1f5f9',
                          color: b.published ? '#166534' : '#475569',
                          fontSize: '0.72rem',
                        }}
                      >
                        {b.published
                          ? isAr
                            ?'منشور للجمهور'                            :'Published'                          : isAr
                          ? 'مخفي / مسودة'
                          : 'Unpublished'}
                      </span>
                      {b.is24Hours && (
                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem' }}>
                          24/7
                        </span>
                      )}
                    </div>
                    <div className="small muted">
                       {govInfo ? (isAr ? govInfo.nameAr : govInfo.nameEn) : b.governorateId} — 
                      {b.city} {b.district ? `(${b.district})` : ''} · {isAr ? b.addressAr : b.addressEn}
                    </div>
                    {b.phone && (
                      <div className="small" dir="ltr">
                         {b.phone}
                      </div>
                    )}
                  </div>

                  <div className="row wrapRow" style={{ gap: '6px' }}>
                    <button
                      type="button"
                      className="btn small ghost"
                      disabled={busy}
                      onClick={() => handleToggleBranchPublish(b)}
                    >
                      {b.published
                        ? isAr
                          ?'إخفاء الفرع'                          : 'Hide'
                        : isAr
                        ?'نشر الفرع'                        : 'Publish'}
                    </button>
                    <button type="button" className="btn small ghost" onClick={() => startEdit(b)}>
                       {isAr ?'تعديل':'Edit'}
                    </button>
                    <button type="button" className="btn small danger" onClick={() => handleDelete(b)}>
                      
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// 2. DYNAMIC PARTNER CATEGORY MANAGER MODAL
// ============================================================================
export function PartnerCategoryManagerModal({
  categories,
  adminUid,
  adminRole,
  onClose,
}: {
  categories: PartnerCategoryRecord[];
  adminUid: string;
  adminRole: string;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const createEmptyCat = (): PartnerCategoryRecord => ({
    id: `cat_${Date.now().toString(36)}`,
    slug: `cat-${Date.now().toString(36)}`,
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    icon: '🏥',
    color: '#0d9488',
    displayOrder: categories.length + 1,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: true,
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
    updatedBy: adminUid,
  });

  const [editingCat, setEditingCat] = useState<PartnerCategoryRecord | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    if (!editingCat.nameAr.trim() && !editingCat.nameEn.trim()) return;

    setBusy(true);
    try {
      await savePartnerCategory(
        {
          ...editingCat,
          nameAr: editingCat.nameAr.trim() || editingCat.nameEn.trim(),
          nameEn: editingCat.nameEn.trim() || editingCat.nameAr.trim(),
          slug:
            editingCat.slug.trim() ||
            editingCat.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        },
        adminUid,
        adminRole,
        isNew
      );
      setEditingCat(null);
    } finally {
      setBusy(false);
    }
  };

  const handleQuickToggle = async (c: PartnerCategoryRecord) => {
    setBusy(true);
    try {
      await savePartnerCategory({ ...c, active: !c.active }, adminUid, adminRole, false);
    } finally {
      setBusy(false);
    }
  };

  const handleMoveOrder = async (c: PartnerCategoryRecord, delta: number) => {
    setBusy(true);
    try {
      await savePartnerCategory(
        { ...c, displayOrder: Math.max(1, c.displayOrder + delta) },
        adminUid,
        adminRole,
        false
      );
    } finally {
      setBusy(false);
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
        zIndex: 10070,
      }}
      onClick={onClose}
    >
      <div
        className="card stack"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          maxWidth: '820px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px',
          background: 'var(--card-bg, #fff)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2> {isAr ?'إدارة فئات الشركاء الديناميكية (Partner Categories)':'Dynamic Partner Categories Manager'}</h2>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? 'أضف أو عدّل أو أعد ترتيب أو فعّل أي فئة شركاء صحية جديدة (صيدليات، معامل، مراكز أشعة، مستشفيات، إلخ) بدون تعديل الكود.'
                : 'Create, rename, reorder, activate, or deactivate healthcare partner categories dynamically.'}
            </p>
          </div>
          <div className="row" style={{ gap: '8px' }}>
            <button
              type="button"
              className="btn small"
              onClick={() => {
                setEditingCat(createEmptyCat());
                setIsNew(true);
              }}
            >
               {isAr ?'إضافة فئة جديدة':'New Category'}
            </button>
            <button type="button" className="btn ghost small" onClick={onClose}>
              
            </button>
          </div>
        </div>

        {editingCat && (
          <form className="subcard stack" onSubmit={handleSave} style={{ border: '2px solid #0d9488' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
              }}
            >
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'اسم الفئة (عربي) *' : 'Category Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingCat.nameAr}
                  onChange={(e) => setEditingCat({ ...editingCat, nameAr: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'اسم الفئة (إنجليزي) *' : 'Category Name (English) *'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  className="input"
                  value={editingCat.nameEn}
                  onChange={(e) => setEditingCat({ ...editingCat, nameEn: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'الأيقونة (Emoji)' : 'Icon (Emoji)'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={editingCat.icon}
                  onChange={(e) => setEditingCat({ ...editingCat, icon: e.target.value })}
                />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? 'الترتيب الرقمي' : 'Display Order'}
                </label>
                <input
                  type="number"
                  className="input"
                  value={editingCat.displayOrder}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, displayOrder: Number(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <div className="row wrapRow" style={{ gap: '14px' }}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={editingCat.active}
                  onChange={(e) => setEditingCat({ ...editingCat, active: e.target.checked })}
                />
                {isAr ? 'فئة نشطة' : 'Active Category'}
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={editingCat.isPharmacyType}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, isPharmacyType: e.target.checked })
                  }
                />
                {isAr ? 'تُصنف ضمن شبكة الصيدليات' : 'Is Pharmacy Network Category'}
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={editingCat.supportsMedicationMapping}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, supportsMedicationMapping: e.target.checked })
                  }
                />
                {isAr ? 'تدعم ربط الأدوية («اعثر على دوائك»)' : 'Supports Medication Mapping'}
              </label>
            </div>

            <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn ghost small" onClick={() => setEditingCat(null)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="btn small" disabled={busy}>
                 {isAr ?'حفظ الفئة':'Save Category'}
              </button>
            </div>
          </form>
        )}

        <div className="stack" style={{ gap: '8px' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="subcard row wrapRow"
              style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
            >
              <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                <div>
                  <b>
                    {cat.displayOrder}. {isAr ? cat.nameAr : cat.nameEn}
                  </b>{' '}
                  <span
                    className="badge"
                    style={{
                      background: cat.active ? '#dcfce7' : '#f1f5f9',
                      color: cat.active ? '#166534' : '#64748b',
                      fontSize: '0.72rem',
                    }}
                  >
                    {cat.active ? (isAr ? 'نشط' : 'Active') : isAr ? 'معطل' : 'Inactive'}
                  </span>
                  <div className="small muted">{isAr ? cat.nameEn : cat.nameAr}</div>
                </div>
              </div>

              <div className="row wrapRow" style={{ gap: '6px' }}>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => handleMoveOrder(cat, -1)}
                  title={isAr ? 'تحريك لأعلى' : 'Move Up'}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => handleMoveOrder(cat, 1)}
                  title={isAr ? 'تحريك لأسفل' : 'Move Down'}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => handleQuickToggle(cat)}
                >
                  {cat.active ? (isAr ? 'تعطيل' : 'Deactivate') : isAr ? 'تفعيل' : 'Activate'}
                </button>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    setEditingCat({ ...cat });
                    setIsNew(false);
                  }}
                >
                   {isAr ?'تعديل':'Edit'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// 3. MEDICATION-TO-PARTNER MAPPING MANAGER MODAL
// Strict Clinical Matching: Active Ingredient + Strength + Dosage Form
// Zero Fabrication of Stock or Prices
// ============================================================================
export function PartnerMedicationMappingModal({
  partner,
  mappings,
  adminUid,
  adminRole,
  onClose,
}: {
  partner: PartnerFullAdminRecord;
  mappings: PartnerMedicationMappingRecord[];
  adminUid: string;
  adminRole: string;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { products: liveCatalogProducts } = useLiveDrugCatalog();

  const [selectedProdId, setSelectedProdId] = useState<string>(
    liveCatalogProducts[0]?.productId || 'EG-ABX-001'
  );
  const [stockStatus, setStockStatus] = useState<StockVerificationState>('requires_confirmation');
  const [verifiedPriceStr, setVerifiedPriceStr] = useState<string>('');
  const [priceSourceAr, setPriceSourceAr] = useState<string>(
    'تم التحقق من التسعيرة الرسمية وتأكيد الصيدلية'
  );
  const [directOrderUrl, setDirectOrderUrl] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const partnerMappings = mappings.filter((m) => m.partnerId === partner.id);
  const selectedCatalogProduct = liveCatalogProducts.find((p) => p.productId === selectedProdId);

  const handleAddMapping = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogProduct) return;

    setBusy(true);
    try {
      const parsedPrice =
        verifiedPriceStr.trim() !== '' && !Number.isNaN(Number(verifiedPriceStr))
          ? Number(verifiedPriceStr)
          : null;

      const mappingId = `map_${partner.id}_${selectedCatalogProduct.productId}`;
      const record: PartnerMedicationMappingRecord = {
        id: mappingId,
        partnerId: partner.id,
        productId: selectedCatalogProduct.productId,
        activeIngredientId: selectedCatalogProduct.activeIngredientId,
        tradeNameAr: selectedCatalogProduct.tradeNameAr,
        tradeNameEn: selectedCatalogProduct.tradeNameEn,
        strength: selectedCatalogProduct.strength,
        dosageForm: selectedCatalogProduct.dosageForm,
        stockStatus,
        verifiedPriceEgp: parsedPrice,
        priceSourceAr: priceSourceAr.trim() || 'التوفر والسعر يتطلبان تأكيد الصيدلية',
        priceSourceEn: 'Verified price / requires pharmacy confirmation',
        lastVerifiedAtIso:
          stockStatus !== 'requires_confirmation' || parsedPrice !== null
            ? new Date().toISOString()
            : null,
        directProductOrderingUrl: directOrderUrl.trim(),
        requiresPrescription: true,
        pharmacistReviewNoteAr:
          'لا يُصرف المضاد الحيوي ولا يُستبدل إلا بوصفة طبية ومراجعة الصيدلي للتأكد من تطابق المادة الفعالة والتركيز والشكل الصيدلاني.',
        pharmacistReviewNoteEn:
          'Antibiotics require a valid prescription and pharmacist verification of active ingredient, strength, and dosage form.',
        published: true,
        availableBranchIds: [],
        updatedAtIso: new Date().toISOString(),
        updatedBy: adminUid,
      };

      await savePartnerMedicationMapping(record, adminUid, adminRole);
      setVerifiedPriceStr('');
      setDirectOrderUrl('');
    } finally {
      setBusy(false);
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
        zIndex: 10070,
      }}
      onClick={onClose}
    >
      <div
        className="card stack"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          maxWidth: '860px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '20px',
          background: 'var(--card-bg, #fff)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
               {isAr ?'ربط الأدوية بالشريك («اعثر على دوائك»)':'Medication-to-Partner Mapping'}
            </span>
            <h2 style={{ margin: '4px 0 0' }}>
              {isAr ? partner.nameAr : partner.nameEn}
            </h2>
          </div>
          <button type="button" className="btn ghost small" onClick={onClose}>
            
          </button>
        </div>

        <div className="notice small">
           
          {isAr
            ? 'الالتزام الطبي الصارم: يتم الربط بناءً على (المادة الفعالة + التركيز + الشكل الصيدلاني). لا يتم اختلاق أسعار أو كميات مخزون غير مؤكدة؛ عند عدم توفر مزامنة لحظية، يظهر للزائر بوضوح «التوفر يتطلب تأكيد الصيدلية».'
            : 'Strict Clinical Matching: Matches by Active Ingredient + Strength + Dosage Form. Never fabricates stock or pricing.'}
        </div>

        <form className="subcard stack" onSubmit={handleAddMapping}>
          <b> {isAr ?'ربط مستحضر دوائي بهذا الشريك:':'Map a Medication Package to this Partner:'}</b>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '10px',
            }}
          >
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                {isAr ? 'اختر المستحضر من قاعدة البيانات المصرية (206+)' : 'Select Medication Package'}
              </label>
              <select
                className="input"
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(e.target.value)}
              >
                {liveCatalogProducts.map((p) => {
                  const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
                  return (
                    <option key={p.productId} value={p.productId}>
                      {isAr ? p.tradeNameAr : p.tradeNameEn} ({p.strength} - {p.dosageForm}) —{' '}
                      {ing ? (isAr ? ing.nameAr : ing.nameEn) : p.activeIngredientId}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                {isAr ? 'حالة التوفر الموثقة' : 'Verified Stock Status'}
              </label>
              <select
                className="input"
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as StockVerificationState)}
              >
                <option value="requires_confirmation">
                  {isAr
                    ? 'التوفر يتطلب تأكيد الصيدلية (Availability requires confirmation)'
                    : 'Availability requires confirmation'}
                </option>
                <option value="in_stock_verified">
                  {isAr ? 'متوفر حالياً (تم التحقق الفعلي)' : 'In Stock (Verified)'}
                </option>
                <option value="low_stock_verified">
                  {isAr ? 'كمية محدودة (تم التحقق الفعلي)' : 'Low Stock (Verified)'}
                </option>
                <option value="out_of_stock_verified">
                  {isAr ? 'غير متوفر حالياً (مؤكد)' : 'Out of Stock (Verified)'}
                </option>
              </select>
            </div>

            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                {isAr ? 'السعر الموثق بالجنيه (اتركه فارغاً إذا كان يتطلب تأكيد)' : 'Verified Price EGP (Optional)'}
              </label>
              <input
                type="number"
                step="0.01"
                dir="ltr"
                className="input"
                value={verifiedPriceStr}
                onChange={(e) => setVerifiedPriceStr(e.target.value)}
                placeholder={
                  selectedCatalogProduct?.priceEgp
                    ? `${selectedCatalogProduct.priceEgp} (السعر الرسمي)`
                    : 'Optional verified price'
                }
              />
            </div>

            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                {isAr ? 'رابط طلب مباشر لهذا الدواء لدى الشريك (اختياري)' : 'Direct Product Ordering URL'}
              </label>
              <input
                type="url"
                dir="ltr"
                className="input"
                value={directOrderUrl}
                onChange={(e) => setDirectOrderUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn small" disabled={busy}>
               {isAr ?'حفظ ربط الدواء بالشريك':'Save Medication Mapping'}
            </button>
          </div>
        </form>

        {/* Mapped Medications List */}
        {partnerMappings.length === 0 ? (
          <p className="muted center" style={{ padding: '16px' }}>
            {isAr
              ? 'لم يتم تخصيص أدوية بعينها بعد. عند تفعيل ظهور الشريك في صفحات الأدوية، سيظهر كمنفذ صرف عام مع عبارة «التوفر يتطلب تأكيد الصيدلية».'
              : 'No specific medication mappings added yet.'}
          </p>
        ) : (
          <div className="tablewrap">
            <table className="tbl small">
              <thead>
                <tr>
                  <th>{isAr ? 'الدواء والتركيز والشكل' : 'Medication, Strength & Form'}</th>
                  <th>{isAr ? 'المادة الفعالة' : 'Active Ingredient'}</th>
                  <th>{isAr ? 'حالة التوفر' : 'Stock Status'}</th>
                  <th>{isAr ? 'السعر الموثق' : 'Verified Price'}</th>
                  <th>{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {partnerMappings.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <b>{isAr ? m.tradeNameAr : m.tradeNameEn}</b>
                      <div className="small muted" dir="ltr">
                        {m.strength} · {m.dosageForm}
                      </div>
                    </td>
                    <td dir="ltr">{m.activeIngredientId}</td>
                    <td>
                      <span className="badge">{m.stockStatus}</span>
                    </td>
                    <td>
                      {m.verifiedPriceEgp
                        ? `${m.verifiedPriceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}`
                        : isAr
                        ? 'يتطلب تأكيد'
                        : 'Requires confirmation'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn small danger"
                        onClick={() =>
                          deletePartnerMedicationMapping(
                            m.id,
                            partner.id,
                            m.tradeNameAr,
                            adminUid,
                            adminRole
                          )
                        }
                      >
                        
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
