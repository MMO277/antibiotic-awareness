import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { tr } from './types';
import {
  EGYPTIAN_GOVERNORATES,
  PartnerBranchRecord,
  PartnerCategoryRecord,
  PartnerPublicRecord,
  VERIFICATION_STATUS_LABELS,
} from './partnerTypes';

export function PublicPartnerCard({
  partner,
  category,
  branches = [],
  compact = false,
  isPreview = false,
  onOrderOrInquire,
}: {
  partner: PartnerPublicRecord;
  category?: PartnerCategoryRecord;
  branches?: PartnerBranchRecord[];
  compact?: boolean;
  isPreview?: boolean;
  onOrderOrInquire?: (partner: PartnerPublicRecord) => void;
}) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const disp = partner.display;
  const vis = partner.visibility;

  const displayName = isAr
    ? partner.nameAr || partner.name || partner.nameEn
    : partner.nameEn || partner.name || partner.nameAr;

  const description = isAr
    ? partner.descriptionAr || partner.descriptionEn
    : partner.descriptionEn || partner.descriptionAr;

  const tagline = isAr
    ? disp.customTaglineAr || disp.customTaglineEn
    : disp.customTaglineEn || disp.customTaglineAr;

  const ctaText = isAr
    ? disp.customCtaTextAr || 'اطلب أو استفسر الآن'
    : disp.customCtaTextEn || 'Order or Inquire Now';

  const offerTitle = isAr
    ? disp.specialOfferTitleAr || disp.specialOfferTitleEn
    : disp.specialOfferTitleEn || disp.specialOfferTitleAr;

  // CRITICAL COMPLIANCE: Never show verified badge unless verificationStatus is truly 'verified'
  const showVerifiedBadge =
    disp.showVerificationBadge && partner.verificationStatus === 'verified';

  // Clearly distinguish sponsored/paid placement vs featured vs recommended
  const isSponsored = vis.isSponsoredPlacement;
  const isFeatured = disp.showFeaturedBadge && vis.featuredPlacement;

  const borderTopStyle =
    disp.cardDesign === 'featured_teal'
      ? '4px solid #0d9488'
      : disp.cardDesign === 'highlight_navy'
      ? '4px solid #0284c7'
      : isFeatured
      ? '4px solid #0d9488'
      : '3px solid var(--line, #cbd5e1)';

  const govLabels = partner.supportedGovernorates
    .slice(0, 4)
    .map((gid) => {
      const found = EGYPTIAN_GOVERNORATES.find((g) => g.id === gid);
      return found ? (isAr ? found.nameAr : found.nameEn) : gid;
    });

  const publishedBranches = branches.filter((b) => b.published && b.branchStatus === 'active');

  const hasValidOrderingUrl = Boolean(
    partner.supportsOnlineOrdering &&
      partner.externalOrderingUrl &&
      partner.externalOrderingUrl.trim().startsWith('http')
  );

  const hasValidWebsiteUrl = Boolean(
    partner.websiteUrl && partner.websiteUrl.trim().startsWith('http')
  );

  return (
    <article
      className="card"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        borderTop: borderTopStyle,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '12px',
        padding: compact ? '14px' : '18px',
        background:
          disp.cardDesign === 'highlight_navy'
            ? 'linear-gradient(180deg, rgba(2,132,199,0.05) 0%, var(--card-bg, #fff) 100%)'
            : disp.cardDesign === 'featured_teal'
            ? 'linear-gradient(180deg, rgba(13,148,136,0.06) 0%, var(--card-bg, #fff) 100%)'
            : 'var(--card-bg, #fff)',
      }}
    >
      <div>
        {/* Cover Image if enabled */}
        {disp.showCoverImage && partner.coverImageUrl && (
          <div
            style={{
              height: '110px',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '12px',
              background: '#0f172a',
            }}
          >
            <img
              src={partner.coverImageUrl}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Top Badges Row */}
        <div
          className="row wrapRow"
          style={{ justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '10px' }}
        >
          <div className="row wrapRow" style={{ gap: '6px', alignItems: 'center' }}>
            {category && (
              <span
                className="badge"
                style={{
                  background: `${category.color}18`,
                  color: category.color,
                  border: `1px solid ${category.color}40`,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                {category.icon} {isAr ? category.nameAr : category.nameEn}
              </span>
            )}
            {showVerifiedBadge && (
              <span
                className="badge"
                style={{
                  background: VERIFICATION_STATUS_LABELS.verified.bg,
                  color: VERIFICATION_STATUS_LABELS.verified.color,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                {isAr ? VERIFICATION_STATUS_LABELS.verified.ar : VERIFICATION_STATUS_LABELS.verified.en}
              </span>
            )}
          </div>

          <div className="row wrapRow" style={{ gap: '6px' }}>
            {isSponsored && (
              <span
                className="badge"
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #f59e0b',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
                title={tr(
                  lang,
                  'إعلان تجاري أو رعاية مدفوعة منفصلة عن التوصيات العلمية',
                  'Sponsored commercial placement distinct from clinical guidance'
                )}
              >
                📢 {isAr ? 'رعاية تجارية (Sponsored)' : 'Sponsored Placement'}
              </span>
            )}
            {!isSponsored && isFeatured && (
              <span
                className="badge"
                style={{
                  background: '#ccfbf1',
                  color: '#0f766e',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                ⭐ {isAr ? 'شريك مميز' : 'Featured Partner'}
              </span>
            )}
          </div>
        </div>

        {/* Header: Logo + Partner Name */}
        <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
          {disp.showLogo && (
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                border: '1px solid var(--line, #e2e8f0)',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                fontSize: '1.6rem',
              }}
            >
              {partner.logoUrl ? (
                <img
                  src={partner.logoUrl}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span>{category?.icon || '🏥'}</span>
              )}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.12rem' }}>{displayName}</h3>
            {tagline ? (
              <p className="small" style={{ margin: '2px 0 0', color: '#0d9488', fontWeight: 600 }}>
                {tagline}
              </p>
            ) : (
              <p className="small muted" style={{ margin: '2px 0 0' }}>
                {isAr ? partner.nameEn : partner.nameAr}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {disp.showDescription && description && !compact && (
          <p className="small muted" style={{ margin: '10px 0 0', lineHeight: 1.6 }}>
            {description}
          </p>
        )}

        {/* Campaign Banner or Special Offer */}
        {disp.showSpecialOffers && offerTitle && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px dashed #10b981',
              fontSize: '0.82rem',
            }}
          >
            <strong style={{ color: '#047857' }}>🎁 {offerTitle}</strong>
            {disp.specialOfferCode && (
              <code
                dir="ltr"
                style={{
                  marginInlineStart: '8px',
                  padding: '2px 6px',
                  background: '#fff',
                  borderRadius: '4px',
                  fontWeight: 700,
                }}
              >
                {disp.specialOfferCode}
              </code>
            )}
          </div>
        )}

        {/* Operational Metadata Chips (Delivery, Hours, Coverage, Branches) */}
        <div className="stack" style={{ gap: '6px', marginTop: '12px', fontSize: '0.83rem' }}>
          {disp.showDeliveryIndicator && (
            <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
              <span
                className="badge"
                style={{
                  background: partner.deliveryAvailable ? '#dcfce7' : '#f1f5f9',
                  color: partner.deliveryAvailable ? '#166534' : '#475569',
                  fontWeight: 600,
                }}
              >
                {partner.deliveryAvailable
                  ? isAr
                    ? '🚚 متاح توصيل للمنازل'
                    : '🚚 Home Delivery Available'
                  : isAr
                  ? '🏪 استلام من الفرع'
                  : '🏪 In-Branch Pickup'}
              </span>
              {partner.is24Hours && (
                <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                  🕒 24/7
                </span>
              )}
            </div>
          )}

          {disp.showWorkingHours && (partner.workingHoursAr || partner.workingHoursEn) && !compact && (
            <div>
              <b>{isAr ? 'مواعيد العمل:' : 'Hours:'} </b>
              <span>{isAr ? partner.workingHoursAr : partner.workingHoursEn}</span>
            </div>
          )}

          {govLabels.length > 0 && (
            <div>
              <b>{isAr ? 'النطاق الجغرافي:' : 'Coverage:'} </b>
              <span>
                {govLabels.join(' ، ')}
                {partner.supportedGovernorates.length > 4
                  ? ` (+${partner.supportedGovernorates.length - 4})`
                  : ''}
              </span>
            </div>
          )}

          {disp.showBranchInfo && publishedBranches.length > 0 && (
            <div>
              <b>{isAr ? 'الفروع المنشورة:' : 'Published Branches:'} </b>
              <span>
                {publishedBranches.length} {isAr ? 'فرع معتمد' : 'active branches'}
              </span>
            </div>
          )}

          {disp.showContactInfo && (partner.hotline || partner.phone) && (
            <div>
              <b>{isAr ? 'الخط الساخن / الهاتف:' : 'Phone / Hotline:'} </b>
              <span dir="ltr" style={{ fontWeight: 700 }}>
                {partner.hotline || partner.phone}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div
        className="row wrapRow"
        style={{
          gap: '8px',
          paddingTop: '10px',
          borderTop: '1px solid var(--line, #f1f5f9)',
          marginTop: '4px',
        }}
      >
        {!isPreview && partner.visibility.publishPartnerProfile && (
          <Link
            to={`/partner/${partner.id}`}
            className="btn ghost small"
            style={{ flex: '1 1 auto', textAlign: 'center' }}
          >
            🏥 {isAr ? 'ملف الشريك والفروع' : 'Profile & Branches'}
          </Link>
        )}

        {/* Only show ordering button if valid ordering destination or authorized flow exists */}
        {disp.showExternalOrderingButton && hasValidOrderingUrl && (
          <a
            href={partner.externalOrderingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn small"
            style={{ flex: '1 1 auto', textAlign: 'center', background: '#0d9488' }}
          >
            🛒 {ctaText} ↗
          </a>
        )}

        {disp.showExternalOrderingButton && !hasValidOrderingUrl && partner.supportsOnlineOrdering && onOrderOrInquire && (
          <button
            type="button"
            className="btn small"
            style={{ flex: '1 1 auto', background: '#0d9488' }}
            onClick={() => onOrderOrInquire(partner)}
          >
            📋 {ctaText}
          </button>
        )}

        {disp.showWebsiteButton && hasValidWebsiteUrl && (
          <a
            href={partner.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn ghost small"
          >
            🌐 {isAr ? 'الموقع الرسمي' : 'Website'} ↗
          </a>
        )}

        {disp.showPhoneButton && (partner.hotline || partner.phone) && (
          <a
            href={`tel:${(partner.hotline || partner.phone).replace(/\s+/g, '')}`}
            className="btn ghost small"
          >
            📞 {isAr ? 'اتصال' : 'Call'}
          </a>
        )}
      </div>
    </article>
  );
}
