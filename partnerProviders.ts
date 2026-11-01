import {
  IntegrationMethodType,
  PartnerBranchRecord,
  PartnerMedicationMappingRecord,
  PartnerPublicRecord,
  StockVerificationState,
} from './partnerTypes';

/**
 * ============================================================================
 * MODULAR HEALTHCARE & PHARMACY INTEGRATION ARCHITECTURE
 * ============================================================================
 * Designed for future cooperation with Egyptian healthcare businesses (e.g.,
 * El Ezaby, Seif, 19011, Roshdy, Yodawy, Chefaa, and independent pharmacies).
 *
 * STRICT COMPLIANCE GUARANTEES:
 * 1. Never assumes any company provides a public API or has approved a partnership.
 * 2. Never fabricates API connections, stock availability, prices, delivery fees, or times.
 * 3. API credentials are NEVER stored or exposed in frontend code or public Firestore docs.
 * 4. Adding a new partner through the Admin Dashboard requires ZERO code changes.
 */

export interface MedicationLookupQuery {
  productId: string;
  activeIngredientId: string;
  tradeNameAr: string;
  tradeNameEn: string;
  strength: string;
  dosageForm: string;
  governorateId?: string;
  city?: string;
}

export interface ProviderEvaluationResult {
  partnerId: string;
  integrationMethod: IntegrationMethodType;
  stockStatus: StockVerificationState;
  stockBadgeAr: string;
  stockBadgeEn: string;
  verifiedPriceEgp: number | null;
  priceSourceAr: string;
  priceSourceEn: string;
  lastUpdatedIso: string | null;
  canOrderOnline: boolean;
  orderingDestinationUrl: string | null;
  orderingMode: 'external_redirect' | 'authorized_internal_order' | 'contact_only' | 'disabled';
  requiresPrescriptionAlert: boolean;
  disclaimerAr: string;
  disclaimerEn: string;
}

export interface HealthcareProviderAdapter {
  id: string;
  nameAr: string;
  nameEn: string;
  supportedMethods: IntegrationMethodType[];
  requiresServerBackend: boolean;
  descriptionAr: string;
  descriptionEn: string;
  resolveMedicationOption: (
    partner: PartnerPublicRecord,
    query: MedicationLookupQuery,
    mapping?: PartnerMedicationMappingRecord | null,
    selectedBranch?: PartnerBranchRecord | null
  ) => ProviderEvaluationResult;
}

function sanitizeExternalUrl(rawUrl: string | undefined | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function resolveStockBadges(status: StockVerificationState): { ar: string; en: string } {
  switch (status) {
    case 'in_stock_verified':
      return {
        ar: 'متوفر (تم التحقق)',
        en: 'In Stock (Verified)',
      };
    case 'low_stock_verified':
      return {
        ar: 'كمية محدودة (تم التحقق)',
        en: 'Low Stock (Verified)',
      };
    case 'out_of_stock_verified':
      return {
        ar: 'غير متوفر حالياً (مؤكد)',
        en: 'Out of Stock (Verified)',
      };
    case 'requires_confirmation':
    default:
      return {
        ar: 'التوفر يتطلب تأكيد الصيدلية (Availability requires confirmation)',
        en: 'Availability requires confirmation',
      };
  }
}

/**
 * Universal Dynamic Provider Adapter
 * Works for ANY partner added via the Admin Dashboard without needing custom code.
 */
export const universalDynamicPartnerAdapter: HealthcareProviderAdapter = {
  id: 'universal_dynamic_adapter',
  nameAr: 'المحول القياسي المرن لجميع الشركاء والصيدليات',
  nameEn: 'Universal Dynamic Partner & Pharmacy Adapter',
  supportedMethods: [
    'external_website_link',
    'external_ordering_link',
    'manual_partner_info',
    'manual_availability',
    'authorized_api',
    'authorized_webhook',
    'custom_adapter',
  ],
  requiresServerBackend: false,
  descriptionAr:
    'يعالج جميع الشركاء المضافين من لوحة التحكم ديناميكياً، مع التحقق الصارم من حالة التوفر والسعر وعدم اختلاق أي بيانات غير موثقة.',
  descriptionEn:
    'Dynamically evaluates any partner created in the Admin Dashboard while enforcing strict verification of stock, pricing, and ordering URLs.',
  resolveMedicationOption(partner, _query, mapping, selectedBranch) {
    const hasReliableSync =
      partner.availabilitySyncEnabled &&
      Boolean(partner.lastSuccessfulSyncIso) &&
      (partner.apiIntegrationStatus === 'active_healthy' || partner.integrationMethod === 'manual_availability');

    const effectiveStockStatus: StockVerificationState =
      mapping && (hasReliableSync || mapping.stockStatus !== 'requires_confirmation')
        ? mapping.stockStatus
        : 'requires_confirmation';

    const badges = resolveStockBadges(effectiveStockStatus);

    const verifiedPrice =
      mapping && mapping.verifiedPriceEgp !== null && mapping.verifiedPriceEgp > 0
        ? mapping.verifiedPriceEgp
        : null;

    // Determine valid ordering URL priority:
    // 1. Direct mapped product URL
    // 2. Branch-specific ordering URL
    // 3. Partner external ordering URL
    // 4. Partner official website URL (only if external_website_link)
    const directUrl = sanitizeExternalUrl(mapping?.directProductOrderingUrl);
    const branchUrl = sanitizeExternalUrl(selectedBranch?.branchOrderingUrl);
    const partnerOrderUrl = sanitizeExternalUrl(partner.externalOrderingUrl);
    const websiteUrl = sanitizeExternalUrl(partner.websiteUrl);

    const bestOrderUrl = directUrl || branchUrl || partnerOrderUrl;

    let orderingMode: ProviderEvaluationResult['orderingMode'] = 'disabled';
    let finalDestinationUrl: string | null = null;

    if (partner.supportsOnlineOrdering && effectiveStockStatus !== 'out_of_stock_verified') {
      if (bestOrderUrl) {
        orderingMode = 'external_redirect';
        finalDestinationUrl = bestOrderUrl;
      } else if (
        (partner.integrationMethod === 'authorized_api' || partner.integrationMethod === 'authorized_webhook') &&
        partner.apiIntegrationStatus === 'active_healthy'
      ) {
        orderingMode = 'authorized_internal_order';
        finalDestinationUrl = null;
      } else if (websiteUrl && partner.integrationMethod === 'external_website_link') {
        orderingMode = 'external_redirect';
        finalDestinationUrl = websiteUrl;
      } else if (partner.phone || partner.hotline || selectedBranch?.phone) {
        orderingMode = 'contact_only';
      }
    } else if (websiteUrl && partner.display.showWebsiteButton) {
      orderingMode = 'contact_only';
      finalDestinationUrl = websiteUrl;
    }

    return {
      partnerId: partner.id,
      integrationMethod: partner.integrationMethod,
      stockStatus: effectiveStockStatus,
      stockBadgeAr: badges.ar,
      stockBadgeEn: badges.en,
      verifiedPriceEgp: verifiedPrice,
      priceSourceAr:
        mapping?.priceSourceAr ||
        partner.syncSourceLabelAr ||
        'التوفر والسعر يتطلبان تأكيد الصيدلية قبل الصرف',
      priceSourceEn:
        mapping?.priceSourceEn ||
        partner.syncSourceLabelEn ||
        'Availability and pricing require confirmation with the pharmacy',
      lastUpdatedIso: mapping?.lastVerifiedAtIso || partner.lastSuccessfulSyncIso || null,
      canOrderOnline:
        orderingMode === 'external_redirect' || orderingMode === 'authorized_internal_order',
      orderingDestinationUrl: finalDestinationUrl,
      orderingMode,
      requiresPrescriptionAlert:
        partner.requiresPrescriptionForAntibiotics || (mapping?.requiresPrescription ?? true),
      disclaimerAr:
        'تنبيه طبي وقانوني: المضادات الحيوية لا تُصرف ولا تُستبدل إلا بوصفة طبية معتمدة ومراجعة الصيدلي المرخص.',
      disclaimerEn:
        'Medical & Legal Notice: Antibiotics require a valid prescription and licensed pharmacist review. Never self-medicate or auto-substitute.',
    };
  },
};

/**
 * Registry of Potential Egyptian Healthcare Integration Profiles
 * Note: None of these are assumed active or hardcoded as public partners.
 * They serve as architectural templates when the owner establishes an official partnership.
 */
export interface EgyptianHealthcareIntegrationBlueprint {
  adapterId: string;
  organizationNameAr: string;
  organizationNameEn: string;
  categorySlug: string;
  publicApiStatusNoteAr: string;
  publicApiStatusNoteEn: string;
  recommendedIntegrationMethod: IntegrationMethodType;
}

export const EGYPTIAN_HEALTHCARE_INTEGRATION_BLUEPRINTS: EgyptianHealthcareIntegrationBlueprint[] = [
  {
    adapterId: 'universal_dynamic_adapter',
    organizationNameAr: 'محول عام لأي صيدلية أو شريك صحي مستقبلي',
    organizationNameEn: 'Universal Adapter for Any Pharmacy or Healthcare Partner',
    categorySlug: 'pharmacy-chains',
    publicApiStatusNoteAr: 'يدعم الروابط الخارجية المعتمدة، الإدخال اليدوي الموثق، أو الربط البرمجي المستقبلي بدون تعديل الكود.',
    publicApiStatusNoteEn: 'Supports authorized external links, verified manual availability, or future API/Webhook bindings without code changes.',
    recommendedIntegrationMethod: 'external_ordering_link',
  },
  {
    adapterId: 'blueprint_chain_pharmacy',
    organizationNameAr: 'قالب ربط سلاسل الصيدليات الكبرى (مثل العزبي / سيف / 19011 / رشدي)',
    organizationNameEn: 'Egyptian Pharmacy Chain Blueprint (e.g., El Ezaby, Seif, 19011, Roshdy)',
    categorySlug: 'pharmacy-chains',
    publicApiStatusNoteAr: 'لا تفترض وجود API عام مفتوح؛ يتطلب اتفاقية شراكة رسمية أو استخدام الروابط الرسمية والفروع المعتمدة.',
    publicApiStatusNoteEn: 'Does not assume an open public API; requires formal B2B partnership credentials on a secure backend or official external links.',
    recommendedIntegrationMethod: 'manual_partner_info',
  },
  {
    adapterId: 'blueprint_digital_platform',
    organizationNameAr: 'قالب ربط منصات الصيدليات الرقمية (مثل يداوي Yodawy / شفاء Chefaa)',
    organizationNameEn: 'Digital Pharmacy Platform Blueprint (e.g., Yodawy, Chefaa)',
    categorySlug: 'online-pharmacy-platforms',
    publicApiStatusNoteAr: 'يدعم التوجيه المباشر لصفحة الدواء المعتمدة (External Ordering Link) أو الربط عبر Webhook بعد التعاقد الرسمي.',
    publicApiStatusNoteEn: 'Supports direct authorized product checkout links or server-side B2B webhook integration upon formal agreement.',
    recommendedIntegrationMethod: 'external_ordering_link',
  },
];
