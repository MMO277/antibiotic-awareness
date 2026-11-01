import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import {
  EGYPTIAN_GOVERNORATES,
  getRolePermissions,
  PartnerFullAdminRecord,
  PartnerOrderStatus,
  PARTNERSHIP_STATUS_LABELS,
  PartnershipStatus,
  PUBLICATION_STATUS_LABELS,
  PublicationStatus,
  VERIFICATION_STATUS_LABELS,
} from './partnerTypes';
import {
  fetchAdminAuditLogs,
  fetchAllPartnersForAdmin,
  isPartnerVisiblePublicly,
  updatePartnerOrderStatus,
  updatePartnerQuickState,
  usePartnerEcosystem,
} from './partnerService';
import { PartnerFormModal } from './PartnerFormModal';
import {
  PartnerBranchManagerModal,
  PartnerCategoryManagerModal,
  PartnerMedicationMappingModal,
} from './PartnerBranchAndCategoryModals';

type CenterSubTab = 'partners_list' | 'orders_queue' | 'audit_history';
type SortKey = 'recent' | 'priority' | 'name' | 'branches';

export default function PartnerManagementCenter({
  adminUid,
  adminRole,
}: {
  adminUid: string;
  adminRole: string;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const permissions = useMemo(() => getRolePermissions(adminRole), [adminRole]);
  const { categories, branches, mappings, orders, auditLogs } = usePartnerEcosystem();

  const [adminPartners, setAdminPartners] = useState<PartnerFullAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<CenterSubTab>('partners_list');

  // Search, Filters & Pagination
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnershipStatus | 'all'>('all');
  const [pubFilter, setPubFilter] = useState<PublicationStatus | 'all'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [govFilter, setGovFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Modals State
  const [editingPartner, setEditingPartner] = useState<PartnerFullAdminRecord | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [branchModalPartner, setBranchModalPartner] = useState<PartnerFullAdminRecord | null>(null);
  const [mappingModalPartner, setMappingModalPartner] = useState<PartnerFullAdminRecord | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [actionToast, setActionToast] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const list = await fetchAllPartnersForAdmin();
      setAdminPartners(list);
      if (permissions.canViewAuditLogs) {
        await fetchAdminAuditLogs();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(''), 4000);
  };

  // ==========================================================================
  // 8 REQUIRED DASHBOARD KPI METRICS
  // ==========================================================================
  const kpis = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return {
      total: adminPartners.length,
      active: adminPartners.filter((p) => p.partnershipStatus === 'active').length,
      inactive: adminPartners.filter((p) => p.partnershipStatus === 'inactive').length,
      pending: adminPartners.filter(
        (p) => p.partnershipStatus === 'pending' || p.partnershipStatus === 'draft'
      ).length,
      verified: adminPartners.filter((p) => p.verificationStatus === 'verified').length,
      suspended: adminPartners.filter(
        (p) => p.partnershipStatus === 'suspended' || p.visibility?.temporarilySuspended
      ).length,
      activeIntegrations: adminPartners.filter(
        (p) =>
          p.apiIntegrationStatus === 'active_healthy' ||
          p.apiIntegrationStatus === 'external_link_only' ||
          Boolean(p.externalOrderingUrl)
      ).length,
      recentlyAdded: adminPartners.filter((p) => {
        const created = new Date(p.createdAtIso).getTime();
        return !Number.isNaN(created) && now - created <= sevenDaysMs;
      }).length,
    };
  }, [adminPartners]);

  // ==========================================================================
  // FILTERED & SORTED PARTNERS
  // ==========================================================================
  const filteredPartners = useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    const list = adminPartners.filter((p) => {
      if (statusFilter !== 'all' && p.partnershipStatus !== statusFilter) return false;
      if (pubFilter !== 'all' && p.publicationStatus !== pubFilter) return false;
      if (catFilter !== 'all' && p.categoryId !== catFilter) return false;
      if (
        govFilter !== 'all' &&
        !p.supportedGovernorates.includes(govFilter) &&
        !branches.some((b) => b.partnerId === p.id && b.governorateId === govFilter)
      ) {
        return false;
      }

      if (!q) return true;
      const hay = [
        p.nameAr,
        p.nameEn,
        p.id,
        p.phone,
        p.hotline,
        p.descriptionAr,
        p.descriptionEn,
        p.privateAdmin?.contactPersonName || '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });

    return list.sort((a, b) => {
      if (sortBy === 'priority') {
        return (a.visibility?.displayOrder ?? 100) - (b.visibility?.displayOrder ?? 100);
      }
      if (sortBy === 'name') {
        return isAr
          ? a.nameAr.localeCompare(b.nameAr, 'ar')
          : a.nameEn.localeCompare(b.nameEn);
      }
      if (sortBy === 'branches') {
        const bCountA = branches.filter((br) => br.partnerId === a.id).length;
        const bCountB = branches.filter((br) => br.partnerId === b.id).length;
        return bCountB - bCountA;
      }
      // 'recent'
      return b.updatedAtIso.localeCompare(a.updatedAtIso);
    });
  }, [
    adminPartners,
    searchQ,
    statusFilter,
    pubFilter,
    catFilter,
    govFilter,
    sortBy,
    branches,
    isAr,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / PAGE_SIZE));
  const paginatedPartners = useMemo(
    () => filteredPartners.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPartners, page]
  );

  // ==========================================================================
  // QUICK ADMIN ACTIONS (MOBILE-FRIENDLY 1-TAP CONTROLS)
  // ==========================================================================
  const handleQuickPublishToggle = async (p: PartnerFullAdminRecord) => {
    if (!permissions.canPublishOrHide) return;
    const isCurrentlyPublished =
      p.publicationStatus === 'published' && p.visibility.showOnWebsite;

    if (!isCurrentlyPublished) {
      // Publish & Make Visible
      await updatePartnerQuickState(
        p.id,
        {
          partnershipStatus: 'active',
          publicationStatus: 'published',
          visibilityStatus: 'visible',
          visibilityPatch: {
            showOnWebsite: true,
            publishPartnerProfile: true,
            showInPartnerDirectory: true,
            temporarilySuspended: false,
          },
        },
        adminUid,
        adminRole,
        'partner_published',
        `تم نشر الشريك (${p.nameAr}) وتفعيل ظهوره على الموقع العام`,
        `Published partner (${p.nameEn}) to public website`
      );
      showToast(
        isAr
          ? `✅ تم نشر (${p.nameAr}) وأصبح مرئياً للجمهور فوراً.`
          : `✅ Published (${p.nameEn}) live.`
      );
    } else {
      // Hide from Public Website
      await updatePartnerQuickState(
        p.id,
        {
          publicationStatus: 'hidden',
          visibilityStatus: 'hidden',
          visibilityPatch: {
            showOnWebsite: false,
          },
        },
        adminUid,
        adminRole,
        'partner_hidden',
        `تم إخفاء الشريك (${p.nameAr}) من الموقع العام`,
        `Hidden partner (${p.nameEn}) from public website`
      );
      showToast(
        isAr
          ? `🙈 تم إخفاء (${p.nameAr}) من الموقع العام مع الاحتفاظ ببياناته.`
          : `🙈 Hidden (${p.nameEn}) from public view.`
      );
    }
    await loadAll();
  };

  const handleQuickActivateToggle = async (p: PartnerFullAdminRecord) => {
    if (!permissions.canPublishOrHide) return;
    const isAct = p.partnershipStatus === 'active';
    const nextStatus: PartnershipStatus = isAct ? 'inactive' : 'active';
    await updatePartnerQuickState(
      p.id,
      {
        partnershipStatus: nextStatus,
        ...(isAct ? { visibilityStatus: 'hidden', visibilityPatch: { showOnWebsite: false } } : {}),
      },
      adminUid,
      adminRole,
      isAct ? 'partner_deactivated' : 'partner_activated',
      isAct
        ? `تم تعطيل الشريك (${p.nameAr}) مؤقتاً دون حذف سجلاته`
        : `تم تنشيط حالة الشراكة لـ (${p.nameAr})`,
      isAct ? `Deactivated partner (${p.nameEn})` : `Activated partner (${p.nameEn})`
    );
    showToast(
      isAr
        ? `تم تحديث حالة (${p.nameAr}) إلى: ${PARTNERSHIP_STATUS_LABELS[nextStatus].ar}`
        : `Updated (${p.nameEn}) status to: ${nextStatus}`
    );
    await loadAll();
  };

  const handleQuickMedicationSearchToggle = async (p: PartnerFullAdminRecord) => {
    if (!permissions.canPublishOrHide) return;
    const nextVal = !p.visibility.showInMedicationSearch;
    await updatePartnerQuickState(
      p.id,
      {
        visibilityPatch: {
          showInMedicationSearch: nextVal,
          showInMedicationDetails: nextVal,
        },
      },
      adminUid,
      adminRole,
      'visibility_settings_changed',
      nextVal
        ? `تفعيل ظهور (${p.nameAr}) في نتائج بحث الأدوية («اعثر على دوائك»)`
        : `إخفاء (${p.nameAr}) من نتائج بحث الأدوية مع إبقاء ملفه العام`,
      nextVal
        ? `Enabled medication search visibility for (${p.nameEn})`
        : `Hidden (${p.nameEn}) from medication search while keeping profile settings`
    );
    showToast(
      nextVal
        ? isAr
          ? `💊 يظهر (${p.nameAr}) الآن في نتائج بحث الأدوية.`
          : `💊 Shown in medication search.`
        : isAr
        ? `💊 تم إخفاء (${p.nameAr}) من بحث الأدوية مع الحفاظ على ملفه العام.`
        : `💊 Hidden from medication search.`
    );
    await loadAll();
  };

  const handleQuickPriorityChange = async (p: PartnerFullAdminRecord, newOrder: number) => {
    if (!permissions.canEditContent) return;
    await updatePartnerQuickState(
      p.id,
      {
        visibilityPatch: {
          displayOrder: newOrder,
          homepagePriority: newOrder,
          searchResultPriority: newOrder,
        },
      },
      adminUid,
      adminRole,
      'visibility_settings_changed',
      `تغيير أولوية العرض لـ (${p.nameAr}) إلى ${newOrder}`,
      `Changed display priority for (${p.nameEn}) to ${newOrder}`
    );
    await loadAll();
  };

  const handleArchivePartner = async (p: PartnerFullAdminRecord) => {
    if (!permissions.canDeleteOrArchive) return;
    if (
      !confirm(
        isAr
          ? `هل تريد أرشفة الشريك (${p.nameAr}) وإخفاءه من الموقع العام مع الاحتفاظ بسجلاته؟`
          : `Archive partner (${p.nameEn}) and hide from public website?`
      )
    )
      return;

    await updatePartnerQuickState(
      p.id,
      {
        partnershipStatus: 'archived',
        publicationStatus: 'archived',
        visibilityStatus: 'hidden',
        visibilityPatch: { showOnWebsite: false },
      },
      adminUid,
      adminRole,
      'partner_archived',
      `تمت أرشفة الشريك (${p.nameAr})`,
      `Archived partner (${p.nameEn})`
    );
    showToast(isAr ? `📦 تمت أرشفة (${p.nameAr}).` : `📦 Archived (${p.nameEn}).`);
    await loadAll();
  };

  return (
    <section className="stack" style={{ gap: '16px', marginTop: '8px' }}>
      {/* Top Banner & Action Bar */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
          color: '#ffffff',
          padding: '20px',
          borderRadius: '16px',
        }}
      >
        <div
          className="row wrapRow"
          style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
        >
          <div>
            <span
              className="badge"
              style={{
                background: 'rgba(20, 184, 166, 0.25)',
                color: '#5eead4',
                border: '1px solid rgba(94, 234, 212, 0.4)',
                fontWeight: 700,
              }}
            >
              🏥 {tr(lang, 'مركز إدارة الشركاء وشبكة الصيدليات الموحد', 'Partner Management & Pharmacy Network Center')}
            </span>
            <h2 style={{ margin: '6px 0 4px', color: '#ffffff', fontSize: '1.4rem' }}>
              {tr(lang, 'إدارة الشركاء (Partner Management)', 'Partner Management')}
            </h2>
            <p className="small" style={{ margin: 0, color: '#cbd5e1', maxWidth: '68ch' }}>
              {isAr
                ? 'أضف وعدّل وانشر أو أخفِ أي صيدلية أو شريك صحي مباشرة من هاتفك الأندرويد أو المتصفح مع تحديث لحظي في Firebase Firestore دون الحاجة لتعديل الكود أو إعادة النشر.'
                : 'Dynamically add, edit, publish, hide, or configure partners, branches, and medication mappings in real time via Firestore—no code changes or redeployment required.'}
            </p>
          </div>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            {permissions.canCreateDraft && (
              <button
                type="button"
                className="btn"
                style={{ background: '#14b8a6', color: '#042f2e', fontWeight: 800 }}
                onClick={() => {
                  setEditingPartner(null);
                  setIsCreatingNew(true);
                }}
              >
                ➕ {isAr ? 'إضافة شريك / صيدلية جديدة' : 'Add New Partner'}
              </button>
            )}

            {permissions.canManageCategories && (
              <button
                type="button"
                className="btn ghost"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}
                onClick={() => setShowCategoryManager(true)}
              >
                🗂️ {isAr ? `فئات الشركاء (${categories.length})` : `Categories (${categories.length})`}
              </button>
            )}

            <Link
              to="/partners"
              className="btn ghost"
              style={{ color: '#5eead4', borderColor: 'rgba(94, 234, 212, 0.4)' }}
            >
              🌐 {isAr ? 'فتح دليل الشركاء العام ↗' : 'Public Directory ↗'}
            </Link>
          </div>
        </div>
      </div>

      {actionToast && (
        <div
          className="notice"
          style={{
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #16a34a',
            fontWeight: 700,
          }}
        >
          {actionToast}
        </div>
      )}

      {/* 8 KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
          gap: '10px',
        }}
      >
        {[
          {
            labelAr: 'إجمالي الشركاء',
            labelEn: 'Total Partners',
            val: kpis.total,
            color: '#0284c7',
            icon: '🤝',
          },
          {
            labelAr: 'الشركاء النشطون',
            labelEn: 'Active Partners',
            val: kpis.active,
            color: '#16a34a',
            icon: '✅',
          },
          {
            labelAr: 'غير النشطين',
            labelEn: 'Inactive Partners',
            val: kpis.inactive,
            color: '#64748b',
            icon: '⏸️',
          },
          {
            labelAr: 'قيد المراجعة / مسودة',
            labelEn: 'Pending / Draft',
            val: kpis.pending,
            color: '#d97706',
            icon: '📝',
          },
          {
            labelAr: 'شركاء موثقون ✓',
            labelEn: 'Verified Partners',
            val: kpis.verified,
            color: '#0d9488',
            icon: '🛡️',
          },
          {
            labelAr: 'موقوفون مؤقتاً',
            labelEn: 'Suspended Partners',
            val: kpis.suspended,
            color: '#dc2626',
            icon: '🚫',
          },
          {
            labelAr: 'تكامل / روابط طلب نشطة',
            labelEn: 'Active Integrations',
            val: kpis.activeIntegrations,
            color: '#4f46e5',
            icon: '🔌',
          },
          {
            labelAr: 'أضيفوا مؤخراً (7 أيام)',
            labelEn: 'Recently Added',
            val: kpis.recentlyAdded,
            color: '#7c3aed',
            icon: '🆕',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              padding: '12px',
              borderTop: `3px solid ${item.color}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: item.color }}>
              {item.icon} {item.val}
            </div>
            <div className="small muted" style={{ marginTop: '2px', fontWeight: 600 }}>
              {isAr ? item.labelAr : item.labelEn}
            </div>
          </div>
        ))}
      </div>

      {/* Sub-navigation Tabs: Partners List | Orders Queue | Audit Log */}
      <div className="row wrapRow" style={{ gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
        <button
          type="button"
          className={`btn small ${subTab === 'partners_list' ? '' : 'ghost'}`}
          onClick={() => setSubTab('partners_list')}
        >
          🏥 {isAr ? `قائمة الشركاء والتحكم السريع (${adminPartners.length})` : `Partners & Quick Controls (${adminPartners.length})`}
        </button>

        <button
          type="button"
          className={`btn small ${subTab === 'orders_queue' ? '' : 'ghost'}`}
          onClick={() => setSubTab('orders_queue')}
        >
          📦 {isAr ? `طلبات الصرف والمتابعة (${orders.length})` : `Orders & Tracking (${orders.length})`}
        </button>

        {permissions.canViewAuditLogs && (
          <button
            type="button"
            className={`btn small ${subTab === 'audit_history' ? '' : 'ghost'}`}
            onClick={() => setSubTab('audit_history')}
          >
            📜 {isAr ? `سجل التدقيق والتغييرات (${auditLogs.length})` : `Audit Log (${auditLogs.length})`}
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* SUB-TAB 1: PARTNERS LIST, FILTERS & QUICK CONTROLS */}
      {/* ==================================================================== */}
      {subTab === 'partners_list' && (
        <div className="stack" style={{ gap: '14px' }}>
          {/* Search & Filters Card */}
          <div className="card stack" style={{ padding: '14px', gap: '10px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
              }}
            >
              <div style={{ gridColumn: '1 / -1' }}>
                <input
                  type="search"
                  className="input"
                  value={searchQ}
                  onChange={(e) => {
                    setSearchQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder={
                    isAr
                      ? '🔍 ابحث باسم الشريك (عربي/إنجليزي)، الهاتف، الخط الساخن، أو مسؤول التواصل...'
                      : '🔍 Search by partner name, phone, hotline, or contact person...'
                  }
                />
              </div>

              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: '2px' }}>
                  {isAr ? 'حالة الشراكة:' : 'Partnership Status:'}
                </label>
                <select
                  className="input"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as PartnershipStatus | 'all');
                    setPage(1);
                  }}
                >
                  <option value="all">{isAr ? 'الكل' : 'All Statuses'}</option>
                  {(Object.keys(PARTNERSHIP_STATUS_LABELS) as PartnershipStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {isAr ? PARTNERSHIP_STATUS_LABELS[s].ar : PARTNERSHIP_STATUS_LABELS[s].en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: '2px' }}>
                  {isAr ? 'حالة النشر للجمهور:' : 'Publication Status:'}
                </label>
                <select
                  className="input"
                  value={pubFilter}
                  onChange={(e) => {
                    setPubFilter(e.target.value as PublicationStatus | 'all');
                    setPage(1);
                  }}
                >
                  <option value="all">{isAr ? 'الكل' : 'All'}</option>
                  {(Object.keys(PUBLICATION_STATUS_LABELS) as PublicationStatus[]).map((ps) => (
                    <option key={ps} value={ps}>
                      {isAr ? PUBLICATION_STATUS_LABELS[ps].ar : PUBLICATION_STATUS_LABELS[ps].en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: '2px' }}>
                  {isAr ? 'الفئة:' : 'Category:'}
                </label>
                <select
                  className="input"
                  value={catFilter}
                  onChange={(e) => {
                    setCatFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">{isAr ? 'كل الفئات' : 'All Categories'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {isAr ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: '2px' }}>
                  {isAr ? 'المحافظة:' : 'Governorate:'}
                </label>
                <select
                  className="input"
                  value={govFilter}
                  onChange={(e) => {
                    setGovFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">{isAr ? 'كل المحافظات' : 'All Governorates'}</option>
                  {EGYPTIAN_GOVERNORATES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {isAr ? g.nameAr : g.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: '2px' }}>
                  {isAr ? 'ترتيب حسب:' : 'Sort By:'}
                </label>
                <select
                  className="input"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                >
                  <option value="recent">{isAr ? 'الأحدث تعديلاً' : 'Recently Updated'}</option>
                  <option value="priority">{isAr ? 'أولوية العرض الرقمية' : 'Display Priority'}</option>
                  <option value="name">{isAr ? 'الاسم أبجدياً' : 'Name (A-Z)'}</option>
                  <option value="branches">{isAr ? 'عدد الفروع' : 'Branch Count'}</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="card center" style={{ padding: '24px' }}>
              {isAr ? 'جارٍ تحميل بيانات الشركاء...' : 'Loading partners...'}
            </div>
          ) : paginatedPartners.length === 0 ? (
            <div className="card center stack" style={{ padding: '32px 20px', alignItems: 'center' }}>
              <div style={{ fontSize: '2.4rem' }}>🏥</div>
              <h3 style={{ margin: 0 }}>
                {isAr
                  ? 'لا يوجد شركاء مسجلون يطابقون البحث الحالي'
                  : 'No partners match the current filter'}
              </h3>
              <p className="small muted" style={{ maxWidth: '52ch', margin: 0 }}>
                {isAr
                  ? 'التزاماً بمعاييرك: لم نقم بوضع أي شركات أو صيدليات وهمية مدمجة في الكود. يمكنك الآن إضافة أول شريك أو صيدلية لك مباشرة بالضغط على الزر أدناه.'
                  : 'Zero hardcoded partners: Click the button below to add your first pharmacy or healthcare partner dynamically.'}
              </p>
              {permissions.canCreateDraft && (
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: '8px', background: '#0d9488' }}
                  onClick={() => {
                    setEditingPartner(null);
                    setIsCreatingNew(true);
                  }}
                >
                  ➕ {isAr ? 'إضافة أول شريك / صيدلية الآن' : 'Add Your First Partner Now'}
                </button>
              )}
            </div>
          ) : (
            <div className="stack" style={{ gap: '12px' }}>
              {paginatedPartners.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                const pBranches = branches.filter((b) => b.partnerId === p.id);
                const pubBranchesCount = pBranches.filter(
                  (b) => b.published && b.branchStatus === 'active'
                ).length;
                const pMappings = mappings.filter((m) => m.partnerId === p.id);
                const isLiveVisible = isPartnerVisiblePublicly(p, {}, branches);
                const pStatusInfo =
                  PARTNERSHIP_STATUS_LABELS[p.partnershipStatus] || PARTNERSHIP_STATUS_LABELS.draft;
                const pubStatusInfo =
                  PUBLICATION_STATUS_LABELS[p.publicationStatus] || PUBLICATION_STATUS_LABELS.draft;
                const verStatusInfo =
                  VERIFICATION_STATUS_LABELS[p.verificationStatus] ||
                  VERIFICATION_STATUS_LABELS.unverified;

                return (
                  <div
                    key={p.id}
                    className="card stack"
                    style={{
                      padding: '16px',
                      borderInlineStart: isLiveVisible
                        ? '5px solid #16a34a'
                        : '5px solid #94a3b8',
                      gap: '12px',
                    }}
                  >
                    {/* Top Row: Partner Info + Status Badges */}
                    <div
                      className="row wrapRow"
                      style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}
                    >
                      <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            border: '1px solid var(--line)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            fontSize: '1.5rem',
                            flexShrink: 0,
                          }}
                        >
                          {p.logoUrl ? (
                            <img
                              src={p.logoUrl}
                              alt={p.nameAr}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <span>{cat?.icon || '🏥'}</span>
                          )}
                        </div>
                        <div>
                          <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                              {isAr ? p.nameAr : p.nameEn}
                            </h3>
                            <span
                              className="badge"
                              style={{
                                background: isLiveVisible ? '#dcfce7' : '#f1f5f9',
                                color: isLiveVisible ? '#166534' : '#475569',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                              }}
                            >
                              {isLiveVisible
                                ? isAr
                                  ? '🟢 ظاهر للجمهور الآن'
                                  : '🟢 Live on Website'
                                : isAr
                                ? '🔒 مخفي / مسودة غير منشورة'
                                : '🔒 Hidden / Draft'}
                            </span>
                          </div>
                          <div className="small muted">
                            {isAr ? p.nameEn : p.nameAr} ·{' '}
                            {cat ? (isAr ? cat.nameAr : cat.nameEn) : p.categoryId}
                          </div>
                        </div>
                      </div>

                      {/* Independent Status Pills */}
                      <div className="row wrapRow" style={{ gap: '6px' }}>
                        <span
                          className="badge"
                          style={{
                            background: pStatusInfo.bg,
                            color: pStatusInfo.color,
                            fontSize: '0.74rem',
                          }}
                        >
                          {isAr ? pStatusInfo.ar : pStatusInfo.en}
                        </span>
                        <span
                          className="badge"
                          style={{
                            background: pubStatusInfo.bg,
                            color: pubStatusInfo.color,
                            fontSize: '0.74rem',
                          }}
                        >
                          {isAr ? pubStatusInfo.ar : pubStatusInfo.en}
                        </span>
                        <span
                          className="badge"
                          style={{
                            background: verStatusInfo.bg,
                            color: verStatusInfo.color,
                            fontSize: '0.74rem',
                          }}
                        >
                          {isAr ? verStatusInfo.ar : verStatusInfo.en}
                        </span>
                      </div>
                    </div>

                    {/* Middle Summary Row: Coverage, Branches, Placements, Priority */}
                    <div
                      className="subcard"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '10px',
                        padding: '10px 12px',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <b>📍 {isAr ? 'التغطية الجغرافية:' : 'Coverage:'} </b>
                        <span>
                          {p.supportedGovernorates.length > 0
                            ? `${p.supportedGovernorates.length} ${isAr ? 'محافظات' : 'governorates'}`
                            : isAr
                            ? 'غير محدد'
                            : 'None'}
                        </span>
                      </div>

                      <div>
                        <b>🏪 {isAr ? 'الفروع:' : 'Branches:'} </b>
                        <span>
                          {pubBranchesCount} {isAr ? 'منشور من إجمالي' : 'published of'}{' '}
                          {pBranches.length}
                        </span>
                      </div>

                      <div>
                        <b>💊 {isAr ? 'بحث الأدوية:' : 'Med Search:'} </b>
                        <span
                          style={{
                            color: p.visibility.showInMedicationSearch ? '#15803d' : '#b45309',
                            fontWeight: 700,
                          }}
                        >
                          {p.visibility.showInMedicationSearch
                            ? isAr
                              ? `مفعّل (${pMappings.length} دواء مربوط)`
                              : `Shown (${pMappings.length} mapped)`
                            : isAr
                            ? 'مخفي من بحث الأدوية'
                            : 'Hidden from med search'}
                        </span>
                      </div>

                      <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                        <b>🔢 {isAr ? 'الأولوية:' : 'Priority:'}</b>
                        <input
                          type="number"
                          dir="ltr"
                          value={p.visibility.displayOrder}
                          onChange={(e) =>
                            handleQuickPriorityChange(p, Number(e.target.value) || 100)
                          }
                          style={{
                            width: '68px',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                          }}
                          title={isAr ? 'الأصغر يظهر أولاً' : 'Lower number appears first'}
                        />
                      </div>
                    </div>

                    {/* Bottom Action Buttons (Mobile-Friendly Touch Targets) */}
                    <div
                      className="row wrapRow"
                      style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}
                    >
                      <div className="row wrapRow" style={{ gap: '6px' }}>
                        {permissions.canPublishOrHide && (
                          <button
                            type="button"
                            className="btn small"
                            style={{
                              background: isLiveVisible ? '#f59e0b' : '#16a34a',
                              color: '#fff',
                            }}
                            onClick={() => handleQuickPublishToggle(p)}
                          >
                            {isLiveVisible
                              ? isAr
                                ? '🙈 إخفاء من الموقع العام'
                                : '🙈 Hide from Public'
                              : isAr
                              ? '📢 نشر وإظهار للجمهور الآن'
                              : '📢 Publish Live Now'}
                          </button>
                        )}

                        {permissions.canPublishOrHide && (
                          <button
                            type="button"
                            className="btn ghost small"
                            onClick={() => handleQuickMedicationSearchToggle(p)}
                          >
                            {p.visibility.showInMedicationSearch
                              ? isAr
                                ? '💊 إخفاء من بحث الأدوية فقط'
                                : '💊 Hide from Med Search'
                              : isAr
                              ? '💊 إظهار في بحث الأدوية'
                              : '💊 Show in Med Search'}
                          </button>
                        )}

                        {permissions.canPublishOrHide && (
                          <button
                            type="button"
                            className="btn ghost small"
                            onClick={() => handleQuickActivateToggle(p)}
                          >
                            {p.partnershipStatus === 'active'
                              ? isAr
                                ? '⏸️ تعطيل مؤقت'
                                : '⏸️ Deactivate'
                              : isAr
                              ? '▶️ تنشيط الشراكة'
                              : '▶️ Activate'}
                          </button>
                        )}
                      </div>

                      <div className="row wrapRow" style={{ gap: '6px' }}>
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => setBranchModalPartner(p)}
                        >
                          🏪 {isAr ? `الفروع (${pBranches.length})` : `Branches (${pBranches.length})`}
                        </button>

                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => setMappingModalPartner(p)}
                        >
                          💊 {isAr ? `ربط الأدوية (${pMappings.length})` : `Medications (${pMappings.length})`}
                        </button>

                        {permissions.canEditContent && (
                          <button
                            type="button"
                            className="btn small"
                            style={{ background: '#0284c7' }}
                            onClick={() => {
                              setEditingPartner(p);
                              setIsCreatingNew(false);
                            }}
                          >
                            ✏️ {isAr ? 'تعديل شامل والظهور' : 'Edit & Visibility'}
                          </button>
                        )}

                        {permissions.canDeleteOrArchive && p.partnershipStatus !== 'archived' && (
                          <button
                            type="button"
                            className="btn small danger"
                            onClick={() => handleArchivePartner(p)}
                          >
                            📦 {isAr ? 'أرشفة' : 'Archive'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="row" style={{ justifyContent: 'center', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn ghost small"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {isAr ? '→ السابق' : '← Previous'}
                  </button>
                  <span className="small" style={{ alignSelf: 'center', fontWeight: 700 }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn ghost small"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    {isAr ? 'التالي ←' : 'Next →'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: ORDERS & PRESCRIPTION REVIEW QUEUE */}
      {/* ==================================================================== */}
      {subTab === 'orders_queue' && (
        <div className="card stack">
          <h3>📦 {isAr ? 'متابعة طلبات الصرف ومراجعة الوصفات الطبية' : 'Partner Orders & Prescription Tracking'}</h3>
          {orders.length === 0 ? (
            <p className="muted">
              {isAr
                ? 'لا توجد طلبات مسجلة حتى الآن.'
                : 'No partner orders recorded yet.'}
            </p>
          ) : (
            <div className="tablewrap">
              <table className="tbl small">
                <thead>
                  <tr>
                    <th>{isAr ? 'رقم الطلب' : 'Order #'}</th>
                    <th>{isAr ? 'الدواء' : 'Medication'}</th>
                    <th>{isAr ? 'الصيدلية / الشريك' : 'Partner'}</th>
                    <th>{isAr ? 'بيانات المريض والروشتة' : 'Patient & Rx'}</th>
                    <th>{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td dir="ltr">
                        <b>{ord.orderNumber}</b>
                        <div className="small muted">{ord.createdAtIso.slice(0, 10)}</div>
                      </td>
                      <td>
                        <b>{isAr ? ord.medicationNameAr : ord.medicationNameEn}</b>
                        <div className="small muted" dir="ltr">
                          {ord.strength} · x{ord.quantityPacks}
                        </div>
                      </td>
                      <td>
                        <div>{isAr ? ord.partnerNameAr : ord.partnerNameEn}</div>
                        {ord.branchNameAr && (
                          <div className="small muted">{isAr ? ord.branchNameAr : ord.branchNameEn}</div>
                        )}
                      </td>
                      <td>
                        <div>{ord.patientName} ({ord.patientPhone})</div>
                        <div className="small muted">
                          {ord.governorateId} - {ord.city}
                        </div>
                        {ord.prescriptionReferenceNumber && (
                          <div className="small" style={{ color: '#0369a1' }}>
                            🩺 Rx: {ord.prescriptionReferenceNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          className="input"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          value={ord.status}
                          disabled={!permissions.canEditContent}
                          onChange={(e) =>
                            updatePartnerOrderStatus(
                              ord.id,
                              e.target.value as PartnerOrderStatus,
                              'تحديث من لوحة الإدارة',
                              'Updated by Admin',
                              adminUid,
                              adminRole
                            )
                          }
                        >
                          <option value="pending">{isAr ? 'قيد الانتظار (Pending)' : 'Pending'}</option>
                          <option value="under_pharmacy_review">
                            {isAr ? 'قيد مراجعة الصيدلي للروشتة' : 'Under Pharmacy Review'}
                          </option>
                          <option value="confirmed">{isAr ? 'تم التأكيد (Confirmed)' : 'Confirmed'}</option>
                          <option value="preparing">{isAr ? 'قيد التجهيز (Preparing)' : 'Preparing'}</option>
                          <option value="out_for_delivery">
                            {isAr ? 'خرج للتوصيل (Out for Delivery)' : 'Out for Delivery'}
                          </option>
                          <option value="delivered">{isAr ? 'تم التسليم (Delivered)' : 'Delivered'}</option>
                          <option value="cancelled">{isAr ? 'ملغى (Cancelled)' : 'Cancelled'}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 3: ADMIN AUDIT LOG & CHANGE HISTORY */}
      {/* ==================================================================== */}
      {subTab === 'audit_history' && permissions.canViewAuditLogs && (
        <div className="card stack">
          <h3>📜 {isAr ? 'سجل التدقيق الإداري وتاريخ التعديلات (Audit Log)' : 'Administrative Audit Log & Change History'}</h3>
          <p className="small muted" style={{ margin: 0 }}>
            {isAr
              ? 'يُسجل هذا الجدول كافة العمليات الإدارية (إضافة شريك، تعديل، نشر، إخفاء، تغيير الظهور، إضافة فروع) مع معرف المسؤول والتوقيت الزمني. هذا السجل محمي ولا يظهر للمستخدمين العاديين.'
              : 'Records all administrative actions with administrator UID and timestamp. Strictly restricted from ordinary users.'}
          </p>
          {auditLogs.length === 0 ? (
            <p className="muted">{isAr ? 'لا توجد سجلات تدقيق بعد.' : 'No audit logs recorded yet.'}</p>
          ) : (
            <div className="tablewrap">
              <table className="tbl small">
                <thead>
                  <tr>
                    <th>{isAr ? 'التوقيت' : 'Timestamp'}</th>
                    <th>{isAr ? 'الإجراء' : 'Action'}</th>
                    <th>{isAr ? 'الشريك / العنصر' : 'Target'}</th>
                    <th>{isAr ? 'التفاصيل' : 'Summary'}</th>
                    <th>{isAr ? 'المسؤول' : 'Admin UID'}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.slice(0, 100).map((log) => (
                    <tr key={log.id}>
                      <td dir="ltr" className="small muted">
                        {log.timestampIso.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td>
                        <code style={{ fontSize: '0.75rem' }}>{log.action}</code>
                      </td>
                      <td>
                        <b>{log.partnerName}</b>
                      </td>
                      <td>{isAr ? log.summaryAr : log.summaryEn}</td>
                      <td dir="ltr" className="small muted">
                        {log.adminUid.slice(0, 10)} ({log.adminRole})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {(isCreatingNew || editingPartner !== null) && (
        <PartnerFormModal
          initialPartner={editingPartner}
          categories={categories}
          permissions={permissions}
          adminUid={adminUid}
          adminRole={adminRole}
          onClose={() => {
            setIsCreatingNew(false);
            setEditingPartner(null);
          }}
          onSaved={async (saved) => {
            await loadAll();
            showToast(
              isAr
                ? `✅ تم حفظ بيانات الشريك (${saved.nameAr}) بنجاح في Firestore.`
                : `✅ Saved partner (${saved.nameEn}) to Firestore.`
            );
          }}
        />
      )}

      {branchModalPartner && (
        <PartnerBranchManagerModal
          partner={branchModalPartner}
          branches={branches}
          adminUid={adminUid}
          adminRole={adminRole}
          onClose={() => setBranchModalPartner(null)}
        />
      )}

      {mappingModalPartner && (
        <PartnerMedicationMappingModal
          partner={mappingModalPartner}
          mappings={mappings}
          adminUid={adminUid}
          adminRole={adminRole}
          onClose={() => setMappingModalPartner(null)}
        />
      )}

      {showCategoryManager && (
        <PartnerCategoryManagerModal
          categories={categories}
          adminUid={adminUid}
          adminRole={adminRole}
          onClose={() => setShowCategoryManager(false)}
        />
      )}
    </section>
  );
}
