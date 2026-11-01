import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import {
  EGYPTIAN_GOVERNORATES,
  PartnerBranchRecord,
  PartnerPublicRecord,
  VERIFICATION_STATUS_LABELS,
} from './partnerTypes';
import { isPartnerVisiblePublicly, usePartnerEcosystem } from './partnerService';
import { PublicPartnerCard } from './PublicPartnerCard';
import Disclaimer from './Disclaimer';
import { useLiveDrugCatalog } from './liveCatalogSync';
import { PartnerMedicationOrderModal } from './FindMedicationPanel';

// Haversine distance in km
function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================================
// 1. PUBLIC PARTNER DIRECTORY, NEARBY PHARMACY DISCOVERY & ORDER TRACKING
// ============================================================================
export default function PartnersDirectoryPage() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [sp, setSp] = useSearchParams();
  const activeTab = (sp.get('tab') as 'directory' | 'nearby' | 'orders') || 'directory';

  const { categories, branches, orders, getVisiblePartners } = usePartnerEcosystem();
  const { products: liveCatalogProducts } = useLiveDrugCatalog();

  const [searchQ, setSearchQ] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedGovId, setSelectedGovId] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [onlyDelivery, setOnlyDelivery] = useState<boolean>(false);
  const [only24h, setOnly24h] = useState<boolean>(false);

  // Geolocation state (ONLY triggered when user explicitly clicks button)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('');
  const [orderPartner, setOrderPartner] = useState<PartnerPublicRecord | null>(null);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.active),
    [categories]
  );

  const visiblePartners = useMemo(() => {
    const placement =
      activeTab === 'nearby' ? 'nearby_pharmacy_results' : 'partner_directory';
    const base = getVisiblePartners({
      placement,
      governorateId: selectedGovId !== 'all' ? selectedGovId : undefined,
      city: selectedCity !== 'all' ? selectedCity : undefined,
    });

    const q = searchQ.toLowerCase().trim();
    return base.filter((p) => {
      if (selectedCatId !== 'all' && p.categoryId !== selectedCatId) return false;
      if (onlyDelivery && !p.deliveryAvailable) return false;
      if (only24h && !p.is24Hours) return false;
      if (!q) return true;
      const hay = [
        p.nameAr,
        p.nameEn,
        p.descriptionAr,
        p.descriptionEn,
        ...(p.servicesOfferedAr || []),
        ...(p.servicesOfferedEn || []),
        ...(p.supportedCities || []),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [
    getVisiblePartners,
    activeTab,
    selectedGovId,
    selectedCity,
    selectedCatId,
    onlyDelivery,
    only24h,
    searchQ,
  ]);

  // Published branches belonging to currently visible partners
  const visiblePublishedBranches = useMemo(() => {
    const allowedPartnerIds = new Set(visiblePartners.map((p) => p.id));
    const list = branches.filter(
      (b) =>
        allowedPartnerIds.has(b.partnerId) &&
        b.published &&
        b.branchStatus === 'active' &&
        (selectedGovId === 'all' ||
          b.governorateId === selectedGovId ||
          b.serviceGovernorates.includes(selectedGovId)) &&
        (selectedCity === 'all' ||
          b.city.toLowerCase().includes(selectedCity.toLowerCase()) ||
          b.serviceCities.some((c) => c.toLowerCase().includes(selectedCity.toLowerCase())))
    );

    if (userCoords) {
      return [...list].sort((a, b) => {
        const distA =
          a.latitude !== null && a.longitude !== null
            ? haversineDistanceKm(userCoords.lat, userCoords.lng, a.latitude, a.longitude)
            : 99999;
        const distB =
          b.latitude !== null && b.longitude !== null
            ? haversineDistanceKm(userCoords.lat, userCoords.lng, b.latitude, b.longitude)
            : 99999;
        return distA - distB;
      });
    }
    return list;
  }, [visiblePartners, branches, selectedGovId, selectedCity, userCoords]);

  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus(
        isAr
          ? 'المتصفح الحالي لا يدعم تحديد الموقع الجغرافي. يرجى اختيار محافظتك ومدينتك يدوياً من القائمة.'
          : 'Geolocation is not supported by your browser. Please select your governorate manually.'
      );
      return;
    }
    setGeoStatus(isAr ? 'جارٍ تحديد موقعك الجغرافي بإذنك...' : 'Locating with your permission...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus(
          isAr
            ? '✅ تم تحديد موقعك وترتيب الفروع الأقرب إليك جغرافياً.'
            : '✅ Location detected. Branches are now sorted by proximity.'
        );
      },
      () => {
        setGeoStatus(
          isAr
            ? 'ℹ️ لم يتم منح إذن الموقع الجغرافي. يمكنك اختيار المحافظة والمدينة يدوياً بكل سهولة.'
            : 'ℹ️ Location permission declined. You can select your governorate and city manually.'
        );
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const selectedGovMeta = EGYPTIAN_GOVERNORATES.find((g) => g.id === selectedGovId);

  return (
    <main className="wrap stack" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero Header */}
      <header
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #115e59 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '18px',
        }}
      >
        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
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
              🇪🇬 {tr(lang, 'دليل الشركاء وشبكة الصيدليات ومقدمي الرعاية الصحية', 'Healthcare Partners & Pharmacy Network')}
            </span>
            <h1 style={{ margin: '8px 0 6px', color: '#ffffff' }}>
              {tr(
                lang,
                'شبكة الصيدليات المعتمدة والشركاء الصحيين',
                'Participating Pharmacy Network & Healthcare Partners'
              )}
            </h1>
            <p className="small" style={{ margin: 0, color: '#cbd5e1', maxWidth: '70ch' }}>
              {isAr
                ? 'استكشف الصيدليات المعتمدة ومعامل التحاليل والمراكز الصحية المشاركة في محافظتك، وتحقق من الفروع القريبة وخدمات التوصيل المنزلي وفق معايير السلامة الدوائية.'
                : 'Discover participating pharmacies, laboratories, and healthcare providers covering your governorate and city.'}
            </p>
          </div>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            <Link to="/medicines" className="btn" style={{ background: '#14b8a6', color: '#042f2e', fontWeight: 800 }}>
              💊 {isAr ? 'ابحث عن دواء (206+)' : 'Find Medication (206+)'}
            </Link>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="row wrapRow" style={{ gap: '8px', marginTop: '18px' }}>
          <button
            type="button"
            className="btn small"
            style={{
              background: activeTab === 'directory' ? '#ffffff' : 'rgba(255,255,255,0.12)',
              color: activeTab === 'directory' ? '#0f172a' : '#ffffff',
              fontWeight: 700,
            }}
            onClick={() => setSp({ tab: 'directory' })}
          >
            🏥 {isAr ? 'دليل الشركاء والصيدليات' : 'Partner Directory'}
          </button>

          <button
            type="button"
            className="btn small"
            style={{
              background: activeTab === 'nearby' ? '#ffffff' : 'rgba(255,255,255,0.12)',
              color: activeTab === 'nearby' ? '#0f172a' : '#ffffff',
              fontWeight: 700,
            }}
            onClick={() => setSp({ tab: 'nearby' })}
          >
            📍 {isAr ? 'أقرب صيدلية / فرع في منطقتك' : 'Nearby Pharmacies & Branches'}
          </button>

          <button
            type="button"
            className="btn small"
            style={{
              background: activeTab === 'orders' ? '#ffffff' : 'rgba(255,255,255,0.12)',
              color: activeTab === 'orders' ? '#0f172a' : '#ffffff',
              fontWeight: 700,
            }}
            onClick={() => setSp({ tab: 'orders' })}
          >
            📦 {isAr ? `متابعة طلباتي (${orders.length})` : `My Orders (${orders.length})`}
          </button>
        </div>
      </header>

      {/* Filters Bar (for Directory & Nearby tabs) */}
      {activeTab !== 'orders' && (
        <section className="card stack" style={{ gap: '12px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '10px',
            }}
          >
            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                🔍 {isAr ? 'بحث بالاسم أو الخدمة:' : 'Search Partner or Service:'}
              </label>
              <input
                type="search"
                className="input"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={isAr ? 'ابحث عن صيدلية، معمل، أو مدينة...' : 'Search pharmacy, lab, or city...'}
              />
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                🗂️ {isAr ? 'فئة الشريك الصحي:' : 'Partner Category:'}
              </label>
              <select
                className="input"
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
              >
                <option value="all">{isAr ? 'جميع الفئات الصحية' : 'All Healthcare Categories'}</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {isAr ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                🇪🇬 {isAr ? 'المحافظة:' : 'Governorate:'}
              </label>
              <select
                className="input"
                value={selectedGovId}
                onChange={(e) => {
                  setSelectedGovId(e.target.value);
                  setSelectedCity('all');
                }}
              >
                <option value="all">{isAr ? 'كل المحافظات المصرية' : 'All Egyptian Governorates'}</option>
                {EGYPTIAN_GOVERNORATES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {isAr ? g.nameAr : g.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {selectedGovMeta && (
              <div>
                <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
                  🏙️ {isAr ? 'المدينة / المنطقة:' : 'City / Area:'}
                </label>
                <select
                  className="input"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="all">{isAr ? 'كل مدن المحافظة' : 'All Cities'}</option>
                  {selectedGovMeta.majorCities.map((mc) => (
                    <option key={mc.id} value={isAr ? mc.ar : mc.en}>
                      {isAr ? mc.ar : mc.en}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div
            className="row wrapRow"
            style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
          >
            <div className="row wrapRow" style={{ gap: '14px' }}>
              <label className="check small">
                <input
                  type="checkbox"
                  checked={onlyDelivery}
                  onChange={(e) => setOnlyDelivery(e.target.checked)}
                />
                🚚 {isAr ? 'يوفر توصيل للمنازل فقط' : 'Home Delivery Only'}
              </label>
              <label className="check small">
                <input
                  type="checkbox"
                  checked={only24h}
                  onChange={(e) => setOnly24h(e.target.checked)}
                />
                🕒 {isAr ? 'خدمة 24 ساعة فقط' : '24/7 Service Only'}
              </label>
            </div>

            <button
              type="button"
              className="btn ghost small"
              onClick={handleRequestGeolocation}
            >
              📍 {isAr ? 'استخدم موقعي الحالي لعرض الأقرب (بإذنك)' : 'Use My Location (With Permission)'}
            </button>
          </div>

          {geoStatus && <div className="notice small">{geoStatus}</div>}
        </section>
      )}

      {/* TAB 1: PARTNER DIRECTORY */}
      {activeTab === 'directory' && (
        <section className="stack">
          {visiblePartners.length === 0 ? (
            <div className="card center stack" style={{ padding: '32px 20px', alignItems: 'center' }}>
              <div style={{ fontSize: '2.4rem' }}>🏥</div>
              <h3 style={{ margin: 0 }}>
                {isAr
                  ? 'لا يوجد شركاء منشورون يطابقون معايير التصفية الحالية'
                  : 'No published partners match the selected filters'}
              </h3>
              <p className="small muted" style={{ maxWidth: '54ch', margin: 0 }}>
                {selectedGovId !== 'all'
                  ? isAr
                    ? 'يتم إظهار الشركاء فقط في المحافظات التي يغطونها فعلياً. جرّب اختيار محافظة أخرى أو عرض كل المحافظات.'
                    : 'Partners only appear in governorates they actively cover. Try selecting All Governorates.'
                  : isAr
                  ? 'يتم تحديث هذه القائمة ديناميكياً فور قيام إدارة المنصة بنشر وتفعيل الشركاء المعتمدين.'
                  : 'This directory updates dynamically whenever the platform owner publishes verified partners.'}
              </p>
            </div>
          ) : (
            <div className="grid">
              {visiblePartners.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                const pBranches = branches.filter((b) => b.partnerId === p.id);
                return (
                  <PublicPartnerCard
                    key={p.id}
                    partner={p}
                    category={cat}
                    branches={pBranches}
                    onOrderOrInquire={(chosen) => setOrderPartner(chosen)}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: NEARBY PHARMACY & BRANCH DISCOVERY */}
      {activeTab === 'nearby' && (
        <section className="stack">
          <div className="card">
            <h2 style={{ margin: '0 0 6px' }}>
              📍 {isAr ? 'الفروع المعتمدة والمنشورة حسب النطاق الجغرافي' : 'Published Partner Branches by Area'}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? 'اختر محافظتك أو اضغط «استخدم موقعي الحالي» لعرض أقرب الفروع المعتمدة وأرقام التواصل المباشر ومواعيد العمل.'
                : 'Select your governorate or use your location to find the nearest published branches.'}
            </p>
          </div>

          {visiblePublishedBranches.length === 0 ? (
            <div className="card center" style={{ padding: '24px' }}>
              <p className="muted">
                {isAr
                  ? 'لا توجد فروع منشورة في هذا النطاق الجغرافي حالياً.'
                  : 'No published branches found in this geographic area.'}
              </p>
            </div>
          ) : (
            <div className="grid">
              {visiblePublishedBranches.map((b) => {
                const parentPartner = visiblePartners.find((p) => p.id === b.partnerId);
                const govMeta = EGYPTIAN_GOVERNORATES.find((g) => g.id === b.governorateId);
                const distKm =
                  userCoords && b.latitude !== null && b.longitude !== null
                    ? haversineDistanceKm(userCoords.lat, userCoords.lng, b.latitude, b.longitude)
                    : null;

                return (
                  <div key={b.id} className="card stack" style={{ justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div className="row wrapRow" style={{ justifyContent: 'space-between', gap: '6px' }}>
                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                          {govMeta ? (isAr ? govMeta.nameAr : govMeta.nameEn) : b.governorateId} — {b.city}
                        </span>
                        {distKm !== null && (
                          <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 700 }}>
                            📍 {distKm.toFixed(1)} km
                          </span>
                        )}
                      </div>

                      <h3 style={{ margin: '8px 0 2px', fontSize: '1.08rem' }}>
                        {isAr ? b.nameAr : b.nameEn}
                      </h3>
                      {parentPartner && (
                        <div className="small" style={{ color: '#0d9488', fontWeight: 700 }}>
                          {isAr ? parentPartner.nameAr : parentPartner.nameEn}
                        </div>
                      )}

                      <div className="small muted" style={{ marginTop: '6px', lineHeight: 1.7 }}>
                        <div>📍 {isAr ? b.addressAr : b.addressEn}</div>
                        <div>🕒 {isAr ? b.workingHoursAr : b.workingHoursEn}</div>
                        {b.deliveryAvailable && (
                          <div style={{ color: '#15803d', fontWeight: 600 }}>
                            🚚 {isAr ? b.deliveryCoverageAr || 'متاح التوصيل للمنازل' : b.deliveryCoverageEn || 'Home delivery available'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="row wrapRow" style={{ gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                      {b.phone && (
                        <a href={`tel:${b.phone.replace(/\s+/g, '')}`} className="btn small" style={{ flex: 1, textAlign: 'center' }}>
                          📞 {b.phone}
                        </a>
                      )}
                      {b.branchOrderingUrl && b.branchOrderingUrl.startsWith('http') && (
                        <a
                          href={b.branchOrderingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn ghost small"
                        >
                          🛒 {isAr ? 'طلب أونلاين ↗' : 'Order ↗'}
                        </a>
                      )}
                      {parentPartner && (
                        <Link to={`/partner/${parentPartner.id}`} className="btn ghost small">
                          🏥 {isAr ? 'ملف الصيدلية' : 'Profile'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: PATIENT ORDER TRACKING & HISTORY */}
      {activeTab === 'orders' && (
        <section className="card stack">
          <h2>📦 {isAr ? 'متابعة حالة طلبات الصرف والروشتات' : 'Order Status & Prescription Review Tracking'}</h2>
          {orders.length === 0 ? (
            <p className="muted">
              {isAr
                ? 'لا توجد طلبات مسجلة في جلستك الحالية. يمكنك فتح أي دواء من السجل الدوائي واستخدام ميزة «اعثر على دوائك» لطلب الصرف بوصفة طبية.'
                : 'No orders found in your current session. Open any medication page and use "Find This Medication" to submit a prescription order.'}
            </p>
          ) : (
            <div className="stack" style={{ gap: '12px' }}>
              {orders.map((ord) => (
                <div key={ord.id} className="subcard stack" style={{ borderInlineStart: '4px solid #0d9488' }}>
                  <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <b dir="ltr">{ord.orderNumber}</b> —{' '}
                      <strong>{isAr ? ord.medicationNameAr : ord.medicationNameEn}</strong> ({ord.strength})
                    </div>
                    <span className="badge approved">{ord.status}</span>
                  </div>
                  <div className="small muted">
                    🏥 {isAr ? ord.partnerNameAr : ord.partnerNameEn}{' '}
                    {ord.branchNameAr ? `(${isAr ? ord.branchNameAr : ord.branchNameEn})` : ''} · 📅{' '}
                    {ord.createdAtIso.slice(0, 10)}
                  </div>
                  <div className="small">
                    <b>{isAr ? 'سجل التتبع:' : 'Status History:'}</b>
                    <ul style={{ margin: '4px 0 0', paddingInlineStart: '18px' }}>
                      {ord.statusHistory.map((h, i) => (
                        <li key={i}>
                          <code dir="ltr">{h.timestampIso.slice(0, 16).replace('T', ' ')}</code> —{' '}
                          <b>{h.status}</b>: {isAr ? h.noteAr : h.noteEn}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {orderPartner && liveCatalogProducts[0] && (
        <PartnerMedicationOrderModal
          partner={orderPartner}
          product={liveCatalogProducts[0]}
          branches={branches}
          defaultGovId={selectedGovId}
          onClose={() => setOrderPartner(null)}
        />
      )}

      <Disclaimer />
    </main>
  );
}

// ============================================================================
// 2. DEDICATED PUBLIC PARTNER PROFILE PAGE (`/partner/:id`)
// ============================================================================
export function PartnerPublicProfilePage() {
  const { id = '' } = useParams();
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { partners, categories, branches, mappings } = usePartnerEcosystem();
  const { products: liveCatalogProducts } = useLiveDrugCatalog();
  const [orderModalProduct, setOrderModalProduct] = useState<typeof liveCatalogProducts[0] | null>(
    null
  );

  const partner = partners.find((p) => p.id === id);

  // Enforce strict public visibility rule: never expose unpublished or hidden partner profiles
  if (
    !partner ||
    !isPartnerVisiblePublicly(partner, { placement: 'dedicated_partner_page' }, branches)
  ) {
    return (
      <main className="wrap narrow stack" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="card center stack" style={{ padding: '32px 20px', alignItems: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>🔒</div>
          <h2>
            {isAr
              ? 'ملف الشريك غير متاح أو غير منشور حالياً'
              : 'Partner Profile Unavailable or Unpublished'}
          </h2>
          <p className="small muted">
            {isAr
              ? 'هذا الملف غير منشور للجمهور العام أو تم إيقاف ظهوره مؤقتاً بواسطة إدارة المنصة.'
              : 'This partner profile is not currently published for public access.'}
          </p>
          <Link to="/partners" className="btn">
            {isAr ? 'العودة لدليل الشركاء' : 'Back to Partner Directory'}
          </Link>
        </div>
      </main>
    );
  }

  const category = categories.find((c) => c.id === partner.categoryId);
  const publishedBranches = branches.filter(
    (b) => b.partnerId === partner.id && b.published && b.branchStatus === 'active'
  );
  const publishedMappings = mappings.filter((m) => m.partnerId === partner.id && m.published);

  const showVerifiedBadge =
    partner.display.showVerificationBadge && partner.verificationStatus === 'verified';

  const govNames = partner.supportedGovernorates.map((gid) => {
    const g = EGYPTIAN_GOVERNORATES.find((x) => x.id === gid);
    return g ? (isAr ? g.nameAr : g.nameEn) : gid;
  });

  return (
    <main className="wrap stack" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <Link to="/partners" className="btn ghost small">
          {isAr ? '→ العودة إلى دليل الشركاء والصيدليات' : '← Back to Partner Directory'}
        </Link>
      </div>

      {/* Partner Profile Hero Card */}
      <section className="card stack" style={{ borderTop: '4px solid #0d9488', gap: '16px' }}>
        {partner.display.showCoverImage && partner.coverImageUrl && (
          <div
            style={{
              height: '180px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#0f172a',
            }}
          >
            <img
              src={partner.coverImageUrl}
              alt={isAr ? partner.nameAr : partner.nameEn}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
          <div className="row" style={{ gap: '14px', alignItems: 'center' }}>
            {partner.display.showLogo && (
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '14px',
                  border: '1px solid var(--line)',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  overflow: 'hidden',
                }}
              >
                {partner.logoUrl ? (
                  <img
                    src={partner.logoUrl}
                    alt={partner.nameAr}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span>{category?.icon || '🏥'}</span>
                )}
              </div>
            )}

            <div>
              <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                <h1 style={{ margin: 0 }}>{isAr ? partner.nameAr : partner.nameEn}</h1>
                {showVerifiedBadge && (
                  <span
                    className="badge"
                    style={{
                      background: VERIFICATION_STATUS_LABELS.verified.bg,
                      color: VERIFICATION_STATUS_LABELS.verified.color,
                      fontWeight: 700,
                    }}
                  >
                    {isAr ? VERIFICATION_STATUS_LABELS.verified.ar : VERIFICATION_STATUS_LABELS.verified.en}
                  </span>
                )}
                {partner.visibility.isSponsoredPlacement && (
                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                    📢 {isAr ? 'رعاية تجارية (Sponsored)' : 'Sponsored'}
                  </span>
                )}
              </div>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                {isAr ? partner.nameEn : partner.nameAr} ·{' '}
                {category ? (isAr ? category.nameAr : category.nameEn) : ''}
              </p>
            </div>
          </div>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            {partner.display.showExternalOrderingButton &&
              partner.supportsOnlineOrdering &&
              partner.externalOrderingUrl &&
              partner.externalOrderingUrl.startsWith('http') && (
                <a
                  href={partner.externalOrderingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: '#0d9488' }}
                >
                  🛒{' '}
                  {isAr
                    ? partner.display.customCtaTextAr || 'اطلب الآن'
                    : partner.display.customCtaTextEn || 'Order Now'}{' '}
                  ↗
                </a>
              )}

            {partner.display.showWebsiteButton &&
              partner.websiteUrl &&
              partner.websiteUrl.startsWith('http') && (
                <a
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn ghost"
                >
                  🌐 {isAr ? 'الموقع الرسمي' : 'Official Website'} ↗
                </a>
              )}

            {partner.display.showPhoneButton && (partner.hotline || partner.phone) && (
              <a
                href={`tel:${(partner.hotline || partner.phone).replace(/\s+/g, '')}`}
                className="btn ghost"
              >
                📞 {partner.hotline || partner.phone}
              </a>
            )}
          </div>
        </div>

        {partner.display.showDescription && (partner.descriptionAr || partner.descriptionEn) && (
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            {isAr ? partner.descriptionAr : partner.descriptionEn}
          </p>
        )}

        {/* Services & Coverage Grid */}
        <div
          className="subcard"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          <div>
            <b>🩺 {isAr ? 'الخدمات المقدمة:' : 'Services Offered:'}</b>
            <div className="row wrapRow" style={{ gap: '6px', marginTop: '6px' }}>
              {(isAr ? partner.servicesOfferedAr : partner.servicesOfferedEn).map((srv, i) => (
                <span key={i} className="badge">
                  {srv}
                </span>
              ))}
            </div>
          </div>

          <div>
            <b>🇪🇬 {isAr ? 'المحافظات المدعومة:' : 'Supported Governorates:'}</b>
            <p className="small" style={{ margin: '4px 0 0' }}>
              {govNames.join(' ، ')}
            </p>
          </div>

          <div>
            <b>🕒 {isAr ? 'مواعيد العمل والتوصيل:' : 'Working Hours & Delivery:'}</b>
            <p className="small" style={{ margin: '4px 0 0' }}>
              {isAr ? partner.workingHoursAr : partner.workingHoursEn}
              <br />
              {partner.deliveryAvailable
                ? isAr
                  ? `🚚 ${partner.deliveryCoverageAr}`
                  : `🚚 ${partner.deliveryCoverageEn}`
                : isAr
                ? '🏪 استلام من الفرع'
                : '🏪 Branch Pickup'}
            </p>
          </div>
        </div>
      </section>

      {/* Published Branches Section */}
      {partner.display.showBranchInfo && publishedBranches.length > 0 && (
        <section className="card stack">
          <h2>
            🏪 {isAr ? `الفروع المعتمدة والمنشورة (${publishedBranches.length})` : `Published Branches (${publishedBranches.length})`}
          </h2>
          <div className="grid">
            {publishedBranches.map((b) => {
              const g = EGYPTIAN_GOVERNORATES.find((x) => x.id === b.governorateId);
              return (
                <div key={b.id} className="subcard stack" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <b>{isAr ? b.nameAr : b.nameEn}</b>
                    <div className="small muted">
                      📍 {g ? (isAr ? g.nameAr : g.nameEn) : b.governorateId} — {b.city}{' '}
                      {b.district ? `(${b.district})` : ''}
                    </div>
                    <div className="small" style={{ marginTop: '4px' }}>
                      {isAr ? b.addressAr : b.addressEn}
                    </div>
                    <div className="small muted" style={{ marginTop: '4px' }}>
                      🕒 {isAr ? b.workingHoursAr : b.workingHoursEn}
                    </div>
                  </div>
                  {b.phone && (
                    <div style={{ marginTop: '8px' }}>
                      <a href={`tel:${b.phone.replace(/\s+/g, '')}`} className="btn ghost small">
                        📞 {b.phone}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Mapped Medications Section */}
      {publishedMappings.length > 0 && (
        <section className="card stack">
          <h2>
            💊 {isAr ? 'الأدوية المربوطة وحالة التوفر الموثقة' : 'Mapped Medications & Verified Availability'}
          </h2>
          <p className="small muted" style={{ margin: 0 }}>
            {isAr
              ? 'جميع المضادات الحيوية تتطلب وصفة طبية معتمدة ومراجعة الصيدلي. لا يتم استبدال الدواء الموصوف تلقائياً.'
              : 'All antibiotics require a valid prescription and pharmacist review.'}
          </p>
          <div className="tablewrap">
            <table className="tbl small">
              <thead>
                <tr>
                  <th>{isAr ? 'الاسم التجاري والتركيز' : 'Trade Name & Strength'}</th>
                  <th>{isAr ? 'حالة التوفر' : 'Availability'}</th>
                  <th>{isAr ? 'السعر الموثق' : 'Verified Price'}</th>
                  <th>{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {publishedMappings.map((m) => {
                  const prod = liveCatalogProducts.find((p) => p.productId === m.productId);
                  return (
                    <tr key={m.id}>
                      <td>
                        <Link to={`/medicine/${m.activeIngredientId}`}>
                          <b>{isAr ? m.tradeNameAr : m.tradeNameEn}</b>
                        </Link>
                        <div className="small muted" dir="ltr">
                          {m.strength} · {m.dosageForm}
                        </div>
                      </td>
                      <td>
                        <span className="badge">
                          {m.stockStatus === 'in_stock_verified'
                            ? isAr
                              ? 'متوفر (تم التحقق)'
                              : 'In Stock (Verified)'
                            : isAr
                            ? 'التوفر يتطلب تأكيد الصيدلية'
                            : 'Availability requires confirmation'}
                        </span>
                      </td>
                      <td>
                        {m.verifiedPriceEgp
                          ? `${m.verifiedPriceEgp.toFixed(2)} ${isAr ? 'ج.م' : 'EGP'}`
                          : isAr
                          ? 'يتطلب تأكيد'
                          : 'Requires confirmation'}
                      </td>
                      <td>
                        {partner.supportsOnlineOrdering && prod && (
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => setOrderModalProduct(prod)}
                          >
                            🩺 {isAr ? 'طلب بالروشتة' : 'Rx Order'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {orderModalProduct && (
        <PartnerMedicationOrderModal
          partner={partner}
          product={orderModalProduct}
          branches={publishedBranches}
          onClose={() => setOrderModalProduct(null)}
        />
      )}

      <Disclaimer />
    </main>
  );
}

// ============================================================================
// 3. HOMEPAGE & SERVICE PLACEMENT DYNAMIC PARTNER SHOWCASE WIDGET
// Only renders when the owner has published at least 1 partner with
// `showOnHomepage: true` (or `showInRelevantServiceSections: true`)
// ============================================================================
export function PublicPartnerPlacementSection({
  placement = 'homepage_featured',
}: {
  placement?: 'homepage_featured' | 'healthcare_service_pages' | 'medication_purchase_suggestions';
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { categories, branches, getVisiblePartners } = usePartnerEcosystem();

  const matchingPartners = useMemo(
    () => getVisiblePartners({ placement }).slice(0, 6),
    [getVisiblePartners, placement]
  );

  // If no partners are published for this placement, render a clean, unobtrusive gateway card
  // linking to the Partner & Pharmacy Network Directory without any fake/hardcoded companies.
  if (matchingPartners.length === 0) {
    return (
      <section className="card highlight-card" style={{ borderTop: '3px solid #0d9488' }}>
        <div
          className="row wrapRow"
          style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
        >
          <div>
            <span className="badge" style={{ background: '#ccfbf1', color: '#0f766e', fontWeight: 700 }}>
              🏥 {tr(lang, 'شبكة الصيدليات والشركاء الصحيين', 'Pharmacy & Healthcare Partner Network')}
            </span>
            <h2 style={{ margin: '6px 0 4px' }}>
              {tr(
                lang,
                'دليل الصيدليات المعتمدة ومنافذ الرعاية الصحية في مصر',
                'Participating Pharmacies & Healthcare Providers Directory'
              )}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? 'استكشف الصيدليات الشريكة، الفروع القريبة منك في محافظتك، وخدمة «اعثر على دوائك» المتكاملة مع السجل الدوائي المصري.'
                : 'Explore participating pharmacies, nearby branches in your governorate, and our "Find This Medication" network.'}
            </p>
          </div>
          <Link to="/partners" className="btn" style={{ background: '#0d9488' }}>
            🏥 {tr(lang, 'افتح دليل الشركاء والصيدليات ←', 'Open Partner Directory →')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card highlight-card stack" style={{ borderTop: '4px solid #0d9488', gap: '14px' }}>
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div>
          <span className="badge" style={{ background: '#ccfbf1', color: '#0f766e', fontWeight: 700 }}>
            🤝 {tr(lang, 'الشركاء الصحيون وشبكة الصيدليات المعتمدة', 'Approved Healthcare Partners & Pharmacies')}
          </span>
          <h2 style={{ margin: '4px 0 0' }}>
            {tr(
              lang,
              'الشركاء ومنافذ الصرف المعتمدة على المنصة',
              'Participating Pharmacies & Healthcare Partners'
            )}
          </h2>
        </div>
        <Link to="/partners" className="btn ghost small">
          {tr(lang, 'عرض كل الشركاء والفروع ←', 'View All Partners & Branches →')}
        </Link>
      </div>

      <div className="grid">
        {matchingPartners.map((p) => {
          const cat = categories.find((c) => c.id === p.categoryId);
          const pBranches = branches.filter((b) => b.partnerId === p.id);
          return (
            <PublicPartnerCard
              key={p.id}
              partner={p}
              category={cat}
              branches={pBranches}
              compact={true}
            />
          );
        })}
      </div>
    </section>
  );
}
