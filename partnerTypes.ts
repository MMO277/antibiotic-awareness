import { Bi } from './types';

// ============================================================================
// ADMINISTRATIVE ROLES & PERMISSIONS
// ============================================================================
export type PartnerAdminRole = 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer';

export interface RolePermissionMatrix {
  canViewDashboard: boolean;
  canCreateDraft: boolean;
  canEditContent: boolean;
  canPublishOrHide: boolean;
  canVerifyPartner: boolean;
  canManageCategories: boolean;
  canManageIntegrations: boolean;
  canManageRoles: boolean;
  canDeleteOrArchive: boolean;
  canViewAuditLogs: boolean;
}

export function getRolePermissions(role: string | null | undefined): RolePermissionMatrix {
  const r = (role || '').toLowerCase();
  if (r === 'owner' || r === 'admin') {
    return {
      canViewDashboard: true,
      canCreateDraft: true,
      canEditContent: true,
      canPublishOrHide: true,
      canVerifyPartner: true,
      canManageCategories: true,
      canManageIntegrations: true,
      canManageRoles: true,
      canDeleteOrArchive: true,
      canViewAuditLogs: true,
    };
  }
  if (r === 'reviewer') {
    return {
      canViewDashboard: true,
      canCreateDraft: true,
      canEditContent: true,
      canPublishOrHide: true,
      canVerifyPartner: true,
      canManageCategories: false,
      canManageIntegrations: false,
      canManageRoles: false,
      canDeleteOrArchive: false,
      canViewAuditLogs: true,
    };
  }
  if (r === 'editor') {
    return {
      canViewDashboard: true,
      canCreateDraft: true,
      canEditContent: true,
      canPublishOrHide: false,
      canVerifyPartner: false,
      canManageCategories: false,
      canManageIntegrations: false,
      canManageRoles: false,
      canDeleteOrArchive: false,
      canViewAuditLogs: false,
    };
  }
  if (r === 'viewer') {
    return {
      canViewDashboard: true,
      canCreateDraft: false,
      canEditContent: false,
      canPublishOrHide: false,
      canVerifyPartner: false,
      canManageCategories: false,
      canManageIntegrations: false,
      canManageRoles: false,
      canDeleteOrArchive: false,
      canViewAuditLogs: false,
    };
  }
  return {
    canViewDashboard: false,
    canCreateDraft: false,
    canEditContent: false,
    canPublishOrHide: false,
    canVerifyPartner: false,
    canManageCategories: false,
    canManageIntegrations: false,
    canManageRoles: false,
    canDeleteOrArchive: false,
    canViewAuditLogs: false,
  };
}

// ============================================================================
// STATUS SEPARATION (STRICTLY INDEPENDENT)
// ============================================================================
export type PartnershipStatus = 'draft' | 'pending' | 'active' | 'inactive' | 'suspended' | 'expired' | 'archived';
export type VerificationStatus = 'unverified' | 'pending_verification' | 'verified' | 'revoked';
export type PublicationStatus = 'draft' | 'scheduled' | 'published' | 'hidden' | 'archived';
export type VisibilityStatus = 'hidden' | 'visible' | 'temporarily_suspended' | 'scheduled_campaign';
export type ApiIntegrationStatus = 'none' | 'manual_only' | 'external_link_only' | 'configured_pending' | 'active_healthy' | 'degraded' | 'disabled';

export type IntegrationMethodType =
  | 'external_website_link'
  | 'external_ordering_link'
  | 'manual_partner_info'
  | 'manual_availability'
  | 'authorized_api'
  | 'authorized_webhook'
  | 'custom_adapter';

export type PlacementLocationId =
  | 'homepage_featured'
  | 'partner_directory'
  | 'pharmacy_directory'
  | 'medication_search_results'
  | 'medication_detail_page'
  | 'medication_purchase_suggestions'
  | 'nearby_pharmacy_results'
  | 'dedicated_partner_page'
  | 'healthcare_service_pages';

export type GeographicScopeType =
  | 'all_egypt'
  | 'specific_governorates'
  | 'specific_cities'
  | 'specific_districts'
  | 'selected_branches_only';

// ============================================================================
// DYNAMIC PARTNER CATEGORIES
// ============================================================================
export interface PartnerCategoryRecord {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  color: string;
  displayOrder: number;
  active: boolean;
  isPharmacyType: boolean;
  supportsBranches: boolean;
  supportsMedicationMapping: boolean;
  supportsOrdering: boolean;
  createdAtIso: string;
  updatedAtIso: string;
  updatedBy: string;
}

// ============================================================================
// VISIBILITY & PLACEMENT MANAGEMENT (OWNER-CONTROLLED)
// ============================================================================
export interface PartnerVisibilitySettings {
  partnerId: string;
  // A. Main Visibility Toggles
  showOnWebsite: boolean;
  publishPartnerProfile: boolean;
  showInPartnerDirectory: boolean;
  showOnHomepage: boolean;
  showInMedicationSearch: boolean;
  showInMedicationDetails: boolean;
  showInNearbyPharmacies: boolean;
  showInRelevantServiceSections: boolean;

  // B. Placement Controls
  allowedPlacements: PlacementLocationId[];

  // C. Geographic Visibility
  geographicScope: GeographicScopeType;
  allowedGovernorates: string[]; // governorate IDs
  allowedCities: string[]; // city names or IDs
  allowedDistricts: string[]; // district names
  selectedBranchIdsOnly: string[];

  // D. Display Priority (Never overrides clinical safety)
  displayOrder: number;
  priorityLevel: 'normal' | 'high' | 'featured' | 'top_partner';
  featuredPlacement: boolean;
  recommendedStatus: boolean;
  homepagePriority: number;
  searchResultPriority: number;
  isSponsoredPlacement: boolean; // Clear distinction between paid/sponsored and ordinary listings

  // E. Temporary & Scheduled Visibility
  scheduledPublishAtIso: string | null;
  scheduledDeactivateAtIso: string | null;
  temporarilySuspended: boolean;
  suspensionReason: string;
  campaignStartDateIso: string | null;
  campaignEndDateIso: string | null;
  campaignBannerAr: string;
  campaignBannerEn: string;

  updatedAtIso: string;
  updatedBy: string;
}

// ============================================================================
// DISPLAY CUSTOMIZATION SETTINGS
// ============================================================================
export type PartnerCardTheme = 'standard_medical' | 'featured_teal' | 'compact_directory' | 'highlight_navy';

export interface PartnerDisplayCustomization {
  cardDesign: PartnerCardTheme;
  showLogo: boolean;
  showCoverImage: boolean;
  showDescription: boolean;
  showContactInfo: boolean;
  showPhoneButton: boolean;
  showWhatsappButton: boolean;
  showBranchInfo: boolean;
  showWorkingHours: boolean;
  showDeliveryIndicator: boolean;
  showExternalOrderingButton: boolean;
  showWebsiteButton: boolean;
  showSpecialOffers: boolean;
  showFeaturedBadge: boolean;
  showVerificationBadge: boolean; // Enforced in code: only renders if verificationStatus === 'verified'
  customCtaTextAr: string;
  customCtaTextEn: string;
  customTaglineAr: string;
  customTaglineEn: string;
  specialOfferTitleAr: string;
  specialOfferTitleEn: string;
  specialOfferCode: string;
}

// ============================================================================
// CORE PUBLIC PARTNER PROFILE & PRIVATE ADMIN RECORD
// ============================================================================
export interface PartnerSocialLinks {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  linkedin?: string;
  tiktok?: string;
  hotline?: string;
}

export interface PartnerPublicRecord {
  id: string;
  // A. Basic Information
  name: string; // Primary display fallback
  nameAr: string;
  nameEn: string;
  logoUrl: string;
  coverImageUrl: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  partnerType: string; // e.g., 'chain_pharmacy', 'independent_pharmacy', 'online_platform', 'laboratory', etc.
  phone: string;
  hotline: string;
  publicEmail: string;
  websiteUrl: string;
  externalOrderingUrl: string;
  socialLinks: PartnerSocialLinks;

  // B. Business & Service Information
  servicesOfferedAr: string[];
  servicesOfferedEn: string[];
  supportedGovernorates: string[];
  supportedCities: string[];
  supportedDistricts: string[];
  deliveryAvailable: boolean;
  deliveryCoverageAr: string;
  deliveryCoverageEn: string;
  workingHoursAr: string;
  workingHoursEn: string;
  is24Hours: boolean;
  supportsOnlineOrdering: boolean;
  requiresPrescriptionForAntibiotics: boolean;

  // C. Public Status Flags (Strictly separated)
  partnershipStatus: PartnershipStatus;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  visibilityStatus: VisibilityStatus;
  apiIntegrationStatus: ApiIntegrationStatus;
  integrationMethod: IntegrationMethodType;

  // Synchronization Metadata (Publicly transparent, never faked)
  availabilitySyncEnabled: boolean;
  priceSyncEnabled: boolean;
  orderSyncEnabled: boolean;
  lastSuccessfulSyncIso: string | null;
  syncSourceLabelAr: string;
  syncSourceLabelEn: string;

  // Embedded Visibility & Display for fast public evaluation
  visibility: PartnerVisibilitySettings;
  display: PartnerDisplayCustomization;

  createdAtIso: string;
  updatedAtIso: string;
}

/**
 * Private administrative data stored in `partnerPrivateAdmin/{partnerId}`
 * NEVER exposed to unauthenticated/ordinary public users.
 */
export interface PartnerPrivateAdminRecord {
  partnerId: string;
  contactPersonName: string;
  contactPersonRole: string;
  administrativePhone: string;
  administrativeEmail: string;
  partnershipStartDateIso: string;
  partnershipExpirationDateIso: string | null;
  contractReference: string;
  internalNotes: string;
  integrationNotes: string;
  providerAdapterId: string;
  webhookEndpointUrl: string;
  // Note: Secret API keys are never stored in public Firestore; only server-side reference IDs
  serverCredentialVaultRef: string;
  createdBy: string;
  updatedBy: string;
  updatedAtIso: string;
}

// Combined object used inside Admin Dashboard
export interface PartnerFullAdminRecord extends PartnerPublicRecord {
  privateAdmin: PartnerPrivateAdminRecord;
}

// ============================================================================
// PHARMACY & PARTNER BRANCHES (`partnerBranches`)
// ============================================================================
export type BranchStatus = 'active' | 'inactive' | 'temporarily_closed' | 'draft';

export interface PartnerBranchRecord {
  id: string;
  partnerId: string;
  nameAr: string;
  nameEn: string;
  addressAr: string;
  addressEn: string;
  governorateId: string;
  city: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  whatsapp: string;
  workingHoursAr: string;
  workingHoursEn: string;
  is24Hours: boolean;
  deliveryAvailable: boolean;
  deliveryCoverageAr: string;
  deliveryCoverageEn: string;
  serviceGovernorates: string[];
  serviceCities: string[];
  serviceDistricts: string[];
  branchStatus: BranchStatus;
  published: boolean; // Selective branch publication
  branchOrderingUrl: string;
  googleMapsUrl: string;
  createdAtIso: string;
  updatedAtIso: string;
  updatedBy: string;
}

// ============================================================================
// MEDICATION-TO-PHARMACY MAPPING (`partnerMedicationMappings`)
// ============================================================================
export type StockVerificationState =
  | 'in_stock_verified'
  | 'low_stock_verified'
  | 'out_of_stock_verified'
  | 'requires_confirmation';

export interface PartnerMedicationMappingRecord {
  id: string;
  partnerId: string;
  // Strict clinical matching fields (never match by vague brand similarity alone)
  productId: string; // e.g. 'EG-ABX-001'
  activeIngredientId: string; // e.g. 'amoxicillin-clavulanic-acid'
  tradeNameAr: string;
  tradeNameEn: string;
  strength: string;
  dosageForm: string;
  // Availability & Pricing (Never invented)
  stockStatus: StockVerificationState;
  verifiedPriceEgp: number | null;
  priceSourceAr: string;
  priceSourceEn: string;
  lastVerifiedAtIso: string | null;
  directProductOrderingUrl: string;
  requiresPrescription: boolean;
  pharmacistReviewNoteAr: string;
  pharmacistReviewNoteEn: string;
  published: boolean;
  availableBranchIds: string[]; // Empty = all active branches of partner
  updatedAtIso: string;
  updatedBy: string;
}

// ============================================================================
// ORDERING & ORDER TRACKING (`partnerOrders`)
// ============================================================================
export type PartnerOrderStatus =
  | 'pending'
  | 'under_pharmacy_review'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface PartnerOrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  partnerId: string;
  partnerNameAr: string;
  partnerNameEn: string;
  branchId: string | null;
  branchNameAr: string;
  branchNameEn: string;
  // Medication Details
  productId: string;
  activeIngredientId: string;
  medicationNameAr: string;
  medicationNameEn: string;
  strength: string;
  dosageForm: string;
  quantityPacks: number;
  // Patient / Delivery Details
  patientName: string;
  patientPhone: string;
  governorateId: string;
  city: string;
  deliveryAddress: string;
  patientNotes: string;
  // Prescription Compliance
  requiresPrescription: boolean;
  prescriptionReferenceNumber: string;
  prescriptionUploadedFileUrl: string;
  prescriberName: string;
  pharmacistVerificationNote: string;
  // Status & Tracking
  status: PartnerOrderStatus;
  statusHistory: Array<{
    status: PartnerOrderStatus;
    timestampIso: string;
    noteAr: string;
    noteEn: string;
    updatedBy: string;
  }>;
  externalRedirectUsed: boolean;
  externalCheckoutUrl: string;
  createdAtIso: string;
  updatedAtIso: string;
}

// ============================================================================
// AUDIT LOG & CHANGE HISTORY (`adminAuditLogs`)
// ============================================================================
export type AuditActionType =
  | 'partner_added'
  | 'partner_edited'
  | 'partner_published'
  | 'partner_hidden'
  | 'partner_suspended'
  | 'partner_activated'
  | 'partner_deactivated'
  | 'partner_archived'
  | 'partner_verified'
  | 'visibility_settings_changed'
  | 'display_settings_changed'
  | 'branch_added'
  | 'branch_edited'
  | 'branch_deleted'
  | 'category_added'
  | 'category_edited'
  | 'medication_mapping_saved'
  | 'medication_mapping_deleted'
  | 'integration_updated'
  | 'order_status_updated';

export interface AdminAuditLogRecord {
  id: string;
  action: AuditActionType;
  partnerId: string;
  partnerName: string;
  adminUid: string;
  adminRole: string;
  timestampIso: string;
  summaryAr: string;
  summaryEn: string;
  changeDetails: Record<string, unknown>;
}

// ============================================================================
// EGYPTIAN GOVERNORATES & CITIES REFERENCE DATA
// ============================================================================
export interface EgyptianGovernorateInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  majorCities: Array<{ id: string; ar: string; en: string; districts: string[] }>;
}

export const EGYPTIAN_GOVERNORATES: EgyptianGovernorateInfo[] = [
  {
    id: 'cairo',
    nameAr: 'القاهرة',
    nameEn: 'Cairo',
    majorCities: [
      { id: 'nasr_city', ar: 'مدينة نصر', en: 'Nasr City', districts: ['الحي الأول', 'الحي السابع', 'الحي العاشر', 'مكرم عبيد', 'عباس العقاد'] },
      { id: 'heliopolis', ar: 'مصر الجديدة', en: 'Heliopolis', districts: ['الكوربة', 'ميدان الحجاز', 'روكسي', 'النزهة الجديدة', 'شيراتون'] },
      { id: 'maadi', ar: 'المعادي', en: 'Maadi', districts: ['المعادي السرايات', 'زهراء المعادي', 'دجلة', 'حدائق المعادي', 'الأوتوستراد'] },
      { id: 'new_cairo', ar: 'القاهرة الجديدة (التجمع)', en: 'New Cairo', districts: ['التجمع الخامس', 'التجمع الأول', 'التجمع الثالث', 'الرحاب', 'مدينتي'] },
      { id: 'downtown_cairo', ar: 'وسط البلد وشبرا', en: 'Downtown & Shubra', districts: ['وسط البلد', 'رمسيس', 'شبرا مصر', 'الزمالك', 'جاردن سيتي', 'المنيل'] },
      { id: 'mokattam_helwan', ar: 'المقطم وحلوان', en: 'Mokattam & Helwan', districts: ['الهضبة الوسطى', 'شارع 9', 'حلوان', 'عين شمس', 'المرج'] },
    ],
  },
  {
    id: 'giza',
    nameAr: 'الجيزة',
    nameEn: 'Giza',
    majorCities: [
      { id: 'dokki_mohandessin', ar: 'الدقي والمهندسين', en: 'Dokki & Mohandessin', districts: ['الدقي', 'المهندسين', 'العجوزة', 'شارع جامعة الدول', 'ميدان المساحة'] },
      { id: 'haram_faisal', ar: 'الهرم وفيصل', en: 'Haram & Faisal', districts: ['شارع الهرم', 'شارع فيصل', 'حدائق الأهرام', 'المريوطية', 'العمرانية'] },
      { id: 'october_zayed', ar: '6 أكتوبر والشيخ زايد', en: '6th of October & Sheikh Zayed', districts: ['الحي الأول', 'الحي السابع', 'الحصري', 'الشيخ زايد', 'حدائق أكتوبر'] },
      { id: 'giza_center', ar: 'ميدان الجيزة وإمبابة', en: 'Giza Square & Imbaba', districts: ['ميدان الجيزة', 'المنيب', 'إمبابة', 'الوراق', 'بولاق الدكرور'] },
    ],
  },
  {
    id: 'alexandria',
    nameAr: 'الإسكندرية',
    nameEn: 'Alexandria',
    majorCities: [
      { id: 'smouha_sidi_gaber', ar: 'سموحة وسيدي جابر', en: 'Smouha & Sidi Gaber', districts: ['سموحة', 'سيدي جابر', 'كليوباترا', 'سبورتنج', 'الإبراهيمية'] },
      { id: 'montaza_miami', ar: 'المنتزه وميامي ولوران', en: 'Montaza, Miami & Louran', districts: ['ميامي', 'سيدي بشر', 'لوران', 'سان ستيفانو', 'العصافرة', 'المندرة'] },
      { id: 'raml_mansheya', ar: 'محطة الرمل والمنشية والعجمي', en: 'Raml Station & Agami', districts: ['محطة الرمل', 'المنشية', 'بحري', 'محرم بك', 'العجمي', 'برج العرب'] },
    ],
  },
  {
    id: 'dakahlia',
    nameAr: 'الدقهلية',
    nameEn: 'Dakahlia',
    majorCities: [
      { id: 'mansoura', ar: 'المنصورة', en: 'Mansoura', districts: ['حي الجامعة', 'المشاية السفلية', 'توريل', 'طلخا', 'جديلة', 'شارع قناة السويس'] },
      { id: 'aga_mit_ghamr', ar: 'أجا وميت غمر والسنبلاوين', en: 'Aga, Mit Ghamr & Sinbillawin', districts: ['نوسا البحر', 'أجا', 'ميت غمر', 'السنبلاوين', 'دكرنس', 'بلقاس', 'شربين', 'المنزلة'] },
    ],
  },
  {
    id: 'gharbia',
    nameAr: 'الغربية',
    nameEn: 'Gharbia',
    majorCities: [
      { id: 'tanta', ar: 'طنطا', en: 'Tanta', districts: ['شارع البحر', 'النادي', 'سيجر', 'محطة طنطا', 'الكورنيش'] },
      { id: 'mahalla', ar: 'المحلة الكبرى وكفر الزيات', en: 'El Mahalla & Kafr El Zayat', districts: ['المحلة الكبرى', 'كفر الزيات', 'زفتى', 'سمنود', 'بسيون'] },
    ],
  },
  {
    id: 'sharkia',
    nameAr: 'الشرقية',
    nameEn: 'Sharkia',
    majorCities: [
      { id: 'zagazig', ar: 'الزقازيق', en: 'Zagazig', districts: ['القومية', 'فلل الجامعة', 'شارع المحافظة', 'المنتزه'] },
      { id: 'tenth_ramadan', ar: 'العاشر من رمضان وبلبيس', en: '10th of Ramadan & Belbeis', districts: ['العاشر من رمضان', 'بلبيس', 'منيا القمح', 'فاقوس', 'أبو كبير'] },
    ],
  },
  {
    id: 'qalyubia',
    nameAr: 'القليوبية',
    nameEn: 'Qalyubia',
    majorCities: [
      { id: 'banha', ar: 'بنها والعبور', en: 'Banha & Obour', districts: ['بنها الجديدة', 'الفلل', 'مدينة العبور', 'طوخ', 'قليوب'] },
      { id: 'shubra_elkheima', ar: 'شبرا الخيمة والخصوص', en: 'Shubra El Kheima', districts: ['شبرا الخيمة', 'بهتيم', 'مسطرد', 'الخصوص', 'القناطر الخيرية'] },
    ],
  },
  {
    id: 'menofia',
    nameAr: 'المنوفية',
    nameEn: 'Menofia',
    majorCities: [
      { id: 'shebin_elkom', ar: 'شبين الكوم ومدينة السادات', en: 'Shebin El Kom & Sadat City', districts: ['شبين الكوم', 'مدينة السادات', 'منوف', 'أشمون', 'قويسنا', 'الباجور'] },
    ],
  },
  {
    id: 'beheira',
    nameAr: 'البحيرة',
    nameEn: 'Beheira',
    majorCities: [
      { id: 'damanhour', ar: 'دمنهور وكفر الدوار', en: 'Damanhour & Kafr El Dawar', districts: ['دمنهور', 'كفر الدوار', 'إيتاي البارود', 'كوم حمادة', 'رشيد'] },
    ],
  },
  {
    id: 'kafr_el_sheikh',
    nameAr: 'كفر الشيخ',
    nameEn: 'Kafr El Sheikh',
    majorCities: [
      { id: 'kfs_city', ar: 'كفر الشيخ ودسوق', en: 'Kafr El Sheikh & Desouk', districts: ['كفر الشيخ', 'دسوق', 'بلطيم', 'بيلا', 'سيدي سالم'] },
    ],
  },
  {
    id: 'damietta',
    nameAr: 'دمياط',
    nameEn: 'Damietta',
    majorCities: [
      { id: 'damietta_city', ar: 'دمياط ودمياط الجديدة', en: 'Damietta & New Damietta', districts: ['دمياط', 'دمياط الجديدة', 'رأس البر', 'فارسكور', 'الزرقا'] },
    ],
  },
  {
    id: 'port_said',
    nameAr: 'بورسعيد',
    nameEn: 'Port Said',
    majorCities: [
      { id: 'portsaid_city', ar: 'بورسعيد وبورفؤاد', en: 'Port Said & Port Fouad', districts: ['حي الشرق', 'حي العرب', 'حي المناخ', 'حي الزهور', 'بورفؤاد'] },
    ],
  },
  {
    id: 'ismailia',
    nameAr: 'الإسماعيلية',
    nameEn: 'Ismailia',
    majorCities: [
      { id: 'ismailia_city', ar: 'الإسماعيلية', en: 'Ismailia', districts: ['الحي الأول', 'الحي الثاني', 'الحي الثالث', 'القنطرة', 'فايد'] },
    ],
  },
  {
    id: 'suez',
    nameAr: 'السويس',
    nameEn: 'Suez',
    majorCities: [
      { id: 'suez_city', ar: 'السويس', en: 'Suez', districts: ['حي السويس', 'حي الأربعين', 'عتاقة', 'فيصل', 'الجناين'] },
    ],
  },
  {
    id: 'fayoum',
    nameAr: 'الفيوم',
    nameEn: 'Fayoum',
    majorCities: [
      { id: 'fayoum_city', ar: 'الفيوم', en: 'Fayoum', districts: ['الفيوم', 'سنورس', 'إطسا', 'طامية', 'أبشواي'] },
    ],
  },
  {
    id: 'beni_suef',
    nameAr: 'بني سويف',
    nameEn: 'Beni Suef',
    majorCities: [
      { id: 'benisuef_city', ar: 'بني سويف وبني سويف الجديدة', en: 'Beni Suef', districts: ['بني سويف', 'بني سويف الجديدة', 'الواسطى', 'ناصر', 'ببا'] },
    ],
  },
  {
    id: 'minya',
    nameAr: 'المنيا',
    nameEn: 'Minya',
    majorCities: [
      { id: 'minya_city', ar: 'المنيا والمنيا الجديدة وملوي', en: 'Minya & Mallawi', districts: ['المنيا', 'المنيا الجديدة', 'ملوي', 'سمالوط', 'مغاغة', 'بني مزار'] },
    ],
  },
  {
    id: 'assiut',
    nameAr: 'أسيوط',
    nameEn: 'Assiut',
    majorCities: [
      { id: 'assiut_city', ar: 'أسيوط وأسيوط الجديدة', en: 'Assiut', districts: ['حي شرق', 'حي غرب', 'أسيوط الجديدة', 'ديروط', 'منفلوط', 'أبو تيج'] },
    ],
  },
  {
    id: 'sohag',
    nameAr: 'سوهاج',
    nameEn: 'Sohag',
    majorCities: [
      { id: 'sohag_city', ar: 'سوهاج وجرجا وطهطا', en: 'Sohag, Girga & Tahta', districts: ['حي شرق', 'حي غرب', 'جرجا', 'طهطا', 'أخميم', 'البلينا'] },
    ],
  },
  {
    id: 'qena',
    nameAr: 'قنا',
    nameEn: 'Qena',
    majorCities: [
      { id: 'qena_city', ar: 'قنا ونجع حمادي', en: 'Qena & Nag Hammadi', districts: ['قنا', 'نجع حمادي', 'قوص', 'دشنا'] },
    ],
  },
  {
    id: 'luxor',
    nameAr: 'الأقصر',
    nameEn: 'Luxor',
    majorCities: [
      { id: 'luxor_city', ar: 'الأقصر وإسنا', en: 'Luxor & Esna', districts: ['الأقصر', 'الكرنك', 'البر الغربي', 'إسنا', 'أرمنت'] },
    ],
  },
  {
    id: 'aswan',
    nameAr: 'أسوان',
    nameEn: 'Aswan',
    majorCities: [
      { id: 'aswan_city', ar: 'أسوان وإدفو وكوم أمبو', en: 'Aswan, Edfu & Kom Ombo', districts: ['أسوان', 'أسوان الجديدة', 'كوم أمبو', 'إدفو'] },
    ],
  },
  {
    id: 'red_sea',
    nameAr: 'البحر الأحمر',
    nameEn: 'Red Sea',
    majorCities: [
      { id: 'hurghada', ar: 'الغردقة والجونة وسفاجا', en: 'Hurghada, El Gouna & Safaga', districts: ['الغردقة', 'الجونة', 'سهل حشيش', 'سفاجا', 'مرسى علم'] },
    ],
  },
  {
    id: 'south_sinai',
    nameAr: 'جنوب سيناء',
    nameEn: 'South Sinai',
    majorCities: [
      { id: 'sharm_el_sheikh', ar: 'شرم الشيخ ودهب والطور', en: 'Sharm El Sheikh, Dahab & El Tor', districts: ['شرم الشيخ', 'دهب', 'الطور', 'نويبع'] },
    ],
  },
  {
    id: 'north_sinai',
    nameAr: 'شمال سيناء',
    nameEn: 'North Sinai',
    majorCities: [
      { id: 'arish', ar: 'العريش', en: 'El Arish', districts: ['العريش', 'بئر العبد', 'الشيخ زويد'] },
    ],
  },
  {
    id: 'matrouh',
    nameAr: 'مطروح والساحل الشمالي',
    nameEn: 'Matrouh & North Coast',
    majorCities: [
      { id: 'marsa_matrouh', ar: 'مرسى مطروح والعلمين الجديدة', en: 'Marsa Matrouh & New Alamein', districts: ['مرسى مطروح', 'العلمين الجديدة', 'الساحل الشمالي', 'الحمام', 'سيوة'] },
    ],
  },
  {
    id: 'new_valley',
    nameAr: 'الوادي الجديد',
    nameEn: 'New Valley',
    majorCities: [
      { id: 'kharga', ar: 'الخارجة والداخلة', en: 'Kharga & Dakhla', districts: ['الخارجة', 'الداخلة', 'الفرافرة'] },
    ],
  },
];

// ============================================================================
// INITIAL 10 DYNAMIC PARTNER CATEGORIES (EXPANDABLE BY OWNER)
// ============================================================================
export const DEFAULT_PARTNER_CATEGORIES: PartnerCategoryRecord[] = [
  {
    id: 'cat_pharmacy_chains',
    slug: 'pharmacy-chains',
    nameAr: 'سلاسل الصيدليات الكبرى',
    nameEn: 'Pharmacy Chains',
    descriptionAr: 'سلاسل الصيدليات المرخصة ذات الفروع المتعددة وخدمات التوصيل المنزلي في المحافظات المصرية.',
    descriptionEn: 'Licensed multi-branch pharmacy chains providing medication dispensing and delivery across Egypt.',
    icon: '🏥',
    color: '#0d9488',
    displayOrder: 1,
    active: true,
    isPharmacyType: true,
    supportsBranches: true,
    supportsMedicationMapping: true,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_independent_pharmacies',
    slug: 'independent-pharmacies',
    nameAr: 'الصيدليات المستقلة والمحلية',
    nameEn: 'Independent Pharmacies',
    descriptionAr: 'صيدليات المجتمع المرخصة التي تخدم الأحياء والمدن والمراكز المحلية بكفاءة صيدلانية مباشرة.',
    descriptionEn: 'Licensed community and neighborhood pharmacies serving local districts and cities.',
    icon: '💊',
    color: '#0284c7',
    displayOrder: 2,
    active: true,
    isPharmacyType: true,
    supportsBranches: true,
    supportsMedicationMapping: true,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_online_pharmacy_platforms',
    slug: 'online-pharmacy-platforms',
    nameAr: 'منصات وتطبيقات الصيدليات الرقمية',
    nameEn: 'Online Pharmacy Platforms',
    descriptionAr: 'منصات رقمية مرخصة تربط المرضى بالصيدليات المعتمدة لصرف الروشتات وتوصيل الأدوية.',
    descriptionEn: 'Authorized digital healthcare platforms connecting patients with licensed pharmacies.',
    icon: '📱',
    color: '#4f46e5',
    displayOrder: 3,
    active: true,
    isPharmacyType: true,
    supportsBranches: false,
    supportsMedicationMapping: true,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_medical_laboratories',
    slug: 'medical-laboratories',
    nameAr: 'معامل التحاليل الطبية والميكروبيولوجي',
    nameEn: 'Medical Laboratories',
    descriptionAr: 'معامل التحاليل الطبية وإجراء المزارع البكتيرية واختبارات الحساسية للمضادات الحيوية (Culture & Sensitivity).',
    descriptionEn: 'Diagnostic laboratories offering bacterial cultures, antibiograms, and clinical pathology.',
    icon: '🔬',
    color: '#7c3aed',
    displayOrder: 4,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_radiology_centers',
    slug: 'radiology-centers',
    nameAr: 'مراكز الأشعة التشخيصية',
    nameEn: 'Radiology Centers',
    descriptionAr: 'مراكز الأشعة المقطعية والرنين المغناطيسي والموجات فوق الصوتية المعتمدة.',
    descriptionEn: 'Diagnostic imaging centers offering X-ray, CT, MRI, and ultrasound services.',
    icon: '🩻',
    color: '#0369a1',
    displayOrder: 5,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_hospitals',
    slug: 'hospitals',
    nameAr: 'المستشفيات والمراكز الطبية المتخصصة',
    nameEn: 'Hospitals',
    descriptionAr: 'المستشفيات الجامعية والخاصة والمراكز المعتمدة للرعاية الحرجة ومكافحة العدوى.',
    descriptionEn: 'Accredited hospitals and tertiary care medical centers.',
    icon: '🏨',
    color: '#dc2626',
    displayOrder: 6,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: false,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_medical_clinics',
    slug: 'medical-clinics',
    nameAr: 'العيادات الطبية التخصصية',
    nameEn: 'Medical Clinics',
    descriptionAr: 'عيادات الأطباء والمراكز التخصصية المعتمدة للكشف السريري ووصف العلاج الدقيق.',
    descriptionEn: 'Outpatient medical clinics and specialist polyclinics.',
    icon: '🩺',
    color: '#15803d',
    displayOrder: 7,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_medical_delivery',
    slug: 'medical-delivery-companies',
    nameAr: 'شركات التوصيل واللوجستيات الطبية',
    nameEn: 'Medical Delivery Companies',
    descriptionAr: 'خدمات النقل المبرد والآمن للأدوية والعينات الطبية وفق معايير سلاسل التبريد.',
    descriptionEn: 'Cold-chain and compliant healthcare logistics and delivery providers.',
    icon: '🚚',
    color: '#d97706',
    displayOrder: 8,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_healthcare_organizations',
    slug: 'healthcare-organizations',
    nameAr: 'الهيئات والجمعيات العلمية والصحية',
    nameEn: 'Healthcare Organizations',
    descriptionAr: 'النقابات الطبية والصيدلانية والجمعيات العلمية ومبادرات ترشيد المضادات الحيوية.',
    descriptionEn: 'Medical syndicates, scientific societies, and AMR stewardship organizations.',
    icon: '🏛️',
    color: '#0f766e',
    displayOrder: 9,
    active: true,
    isPharmacyType: false,
    supportsBranches: false,
    supportsMedicationMapping: false,
    supportsOrdering: false,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_other',
    slug: 'other-partners',
    nameAr: 'شركاء وخدمات صحية أخرى',
    nameEn: 'Other Healthcare Partners',
    descriptionAr: 'مبادرات الرعاية الصحية والتوعية المجتمعية والخدمات المساندة.',
    descriptionEn: 'Other healthcare initiatives, wellness programs, and supporting services.',
    icon: '🤝',
    color: '#64748b',
    displayOrder: 10,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: false,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
];

// ============================================================================
// LABELS & UI HELPERS
// ============================================================================
export const PLACEMENT_LOCATION_LABELS: Record<PlacementLocationId, Bi> = {
  homepage_featured: {
    ar: 'الصفحة الرئيسية (قسم الشركاء المعتمدين)',
    en: 'Homepage (Featured Partners Section)',
  },
  partner_directory: {
    ar: 'دليل الشركاء ومقدمي الرعاية الصحية العام',
    en: 'Main Healthcare Partner Directory',
  },
  pharmacy_directory: {
    ar: 'شبكة الصيدليات المعتمدة',
    en: 'Participating Pharmacy Network',
  },
  medication_search_results: {
    ar: 'نتائج البحث عن الأدوية (السجل الدوائي)',
    en: 'Medication Search Results',
  },
  medication_detail_page: {
    ar: 'صفحات تفاصيل الدواء («اعثر على دوائك»)',
    en: 'Medication Detail Pages ("Find This Medication")',
  },
  medication_purchase_suggestions: {
    ar: 'اقتراحات منافذ الصرف والبدائل (حاسبة التوفير)',
    en: 'Medication Dispensing & Cost Saver Suggestions',
  },
  nearby_pharmacy_results: {
    ar: 'نتائج البحث الجغرافي عن أقرب صيدلية / فرع',
    en: 'Nearby Pharmacy & Branch Discovery Results',
  },
  dedicated_partner_page: {
    ar: 'صفحة الملف التعريفي المستقلة للشريك',
    en: 'Dedicated Public Partner Profile Page',
  },
  healthcare_service_pages: {
    ar: 'صفحات الخدمات والأدوات الصحية ذات الصلة',
    en: 'Relevant Healthcare Service & Clinical Pages',
  },
};

export const PARTNERSHIP_STATUS_LABELS: Record<PartnershipStatus, Bi & { color: string; bg: string }> = {
  draft: { ar: 'مسودة (Draft)', en: 'Draft', color: '#475569', bg: '#f1f5f9' },
  pending: { ar: 'قيد المراجعة (Pending)', en: 'Pending Approval', color: '#b45309', bg: '#fef3c7' },
  active: { ar: 'شريك نشط (Active)', en: 'Active Partner', color: '#166534', bg: '#dcfce7' },
  inactive: { ar: 'غير نشط (Inactive)', en: 'Inactive', color: '#64748b', bg: '#e2e8f0' },
  suspended: { ar: 'موقوف مؤقتاً (Suspended)', en: 'Suspended', color: '#991b1b', bg: '#fee2e2' },
  expired: { ar: 'منتهي الصلاحية (Expired)', en: 'Expired', color: '#9a3412', bg: '#ffedd5' },
  archived: { ar: 'مؤرشف (Archived)', en: 'Archived', color: '#334155', bg: '#cbd5e1' },
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, Bi & { color: string; bg: string }> = {
  unverified: { ar: 'غير موثق بعد', en: 'Unverified', color: '#64748b', bg: '#f1f5f9' },
  pending_verification: { ar: 'قيد التحقق من التراخيص', en: 'Pending Verification', color: '#b45309', bg: '#fef3c7' },
  verified: { ar:'جهة مرخصة وموثقة', en:'Verified Organization', color:'#0369a1', bg:'#e0f2fe'},
  revoked: { ar: 'تم إلغاء التوثيق', en: 'Verification Revoked', color: '#991b1b', bg: '#fee2e2' },
};

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, Bi & { color: string; bg: string }> = {
  draft: { ar: 'مسودة غير منشورة (Draft)', en: 'Unpublished Draft', color: '#475569', bg: '#f1f5f9' },
  scheduled: { ar: 'مجدول للنشر (Scheduled)', en: 'Scheduled Publication', color: '#6d28d9', bg: '#ede9fe' },
  published: { ar: 'منشور للجمهور (Published)', en: 'Published Live', color: '#15803d', bg: '#dcfce7' },
  hidden: { ar: 'مخفي من الموقع العام (Hidden)', en: 'Hidden from Public', color: '#b45309', bg: '#fef3c7' },
  archived: { ar: 'مؤرشف (Archived)', en: 'Archived', color: '#334155', bg: '#e2e8f0' },
};

export const INTEGRATION_METHOD_LABELS: Record<IntegrationMethodType, Bi> = {
  external_website_link: { ar: 'رابط الموقع الرسمي الخارجي فقط', en: 'External Official Website Link' },
  external_ordering_link: { ar: 'رابط طلب خارجي مباشر ومعتمد', en: 'Authorized External Ordering Link' },
  manual_partner_info: { ar: 'إدارة يدوية لبيانات الشريك والفروع', en: 'Manual Partner & Branch Information' },
  manual_availability: { ar: 'إدارة يدوية لحالة التوفر والأسعار الموثقة', en: 'Manually Managed Verified Availability' },
  authorized_api: { ar: 'ربط برمجي معتمد (Authorized REST API)', en: 'Authorized API Integration' },
  authorized_webhook: { ar: 'ربط إشعارات فوري (Authorized Webhook)', en: 'Authorized Webhook Integration' },
  custom_adapter: { ar: 'محول برمجي مخصص (Custom Provider Adapter)', en: 'Custom Provider Integration Adapter' },
};

// ============================================================================
// SAFE DEFAULT FACTORY FOR NEW PARTNERS
// Requirement: "Never automatically make a newly created partner public.
// Default new partners to DRAFT and hidden until I explicitly approve and publish them."
// ============================================================================
export function createDefaultVisibilitySettings(partnerId: string, uid = 'owner'): PartnerVisibilitySettings {
  const now = new Date().toISOString();
  return {
    partnerId,
    showOnWebsite: false,
    publishPartnerProfile: false,
    showInPartnerDirectory: false,
    showOnHomepage: false,
    showInMedicationSearch: false,
    showInMedicationDetails: false,
    showInNearbyPharmacies: false,
    showInRelevantServiceSections: false,
    allowedPlacements: [],
    geographicScope: 'all_egypt',
    allowedGovernorates: [],
    allowedCities: [],
    allowedDistricts: [],
    selectedBranchIdsOnly: [],
    displayOrder: 100,
    priorityLevel: 'normal',
    featuredPlacement: false,
    recommendedStatus: false,
    homepagePriority: 100,
    searchResultPriority: 100,
    isSponsoredPlacement: false,
    scheduledPublishAtIso: null,
    scheduledDeactivateAtIso: null,
    temporarilySuspended: false,
    suspensionReason: '',
    campaignStartDateIso: null,
    campaignEndDateIso: null,
    campaignBannerAr: '',
    campaignBannerEn: '',
    updatedAtIso: now,
    updatedBy: uid,
  };
}

export function createDefaultDisplayCustomization(): PartnerDisplayCustomization {
  return {
    cardDesign: 'standard_medical',
    showLogo: true,
    showCoverImage: false,
    showDescription: true,
    showContactInfo: true,
    showPhoneButton: true,
    showWhatsappButton: false,
    showBranchInfo: true,
    showWorkingHours: true,
    showDeliveryIndicator: true,
    showExternalOrderingButton: true,
    showWebsiteButton: true,
    showSpecialOffers: false,
    showFeaturedBadge: false,
    showVerificationBadge: false,
    customCtaTextAr: 'اطلب أو استفسر الآن',
    customCtaTextEn: 'Order or Inquire Now',
    customTaglineAr: '',
    customTaglineEn: '',
    specialOfferTitleAr: '',
    specialOfferTitleEn: '',
    specialOfferCode: '',
  };
}

export function createEmptyPartnerRecord(uid = 'owner'): PartnerFullAdminRecord {
  const now = new Date().toISOString();
  const id = `partner_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    name: '',
    nameAr: '',
    nameEn: '',
    logoUrl: '',
    coverImageUrl: '',
    descriptionAr: '',
    descriptionEn: '',
    categoryId: 'cat_pharmacy_chains',
    partnerType: 'pharmacy_chain',
    phone: '',
    hotline: '',
    publicEmail: '',
    websiteUrl: '',
    externalOrderingUrl: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      whatsapp: '',
      linkedin: '',
      hotline: '',
    },
    servicesOfferedAr: ['صرف الروشتات الطبية', 'استشارة صيدلانية', 'توصيل للمنازل'],
    servicesOfferedEn: ['Prescription Dispensing', 'Pharmacist Consultation', 'Home Delivery'],
    supportedGovernorates: ['cairo', 'giza'],
    supportedCities: [],
    supportedDistricts: [],
    deliveryAvailable: true,
    deliveryCoverageAr: 'متاح التوصيل في نطاق الفروع والمحافظات المدعومة',
    deliveryCoverageEn: 'Delivery available within supported governorates and branch areas',
    workingHoursAr: 'يومياً من 9:00 صباحاً حتى 11:00 مساءً',
    workingHoursEn: 'Daily 9:00 AM – 11:00 PM',
    is24Hours: false,
    supportsOnlineOrdering: false,
    requiresPrescriptionForAntibiotics: true,
    // Strictly defaults to DRAFT & HIDDEN & UNVERIFIED
    partnershipStatus: 'draft',
    verificationStatus: 'unverified',
    publicationStatus: 'draft',
    visibilityStatus: 'hidden',
    apiIntegrationStatus: 'none',
    integrationMethod: 'manual_partner_info',
    availabilitySyncEnabled: false,
    priceSyncEnabled: false,
    orderSyncEnabled: false,
    lastSuccessfulSyncIso: null,
    syncSourceLabelAr: 'إدارة يدوية عبر لوحة التحكم (التوفر يتطلب تأكيد الصيدلية)',
    syncSourceLabelEn: 'Manually managed via Admin Center (Availability requires confirmation)',
    visibility: createDefaultVisibilitySettings(id, uid),
    display: createDefaultDisplayCustomization(),
    createdAtIso: now,
    updatedAtIso: now,
    privateAdmin: {
      partnerId: id,
      contactPersonName: '',
      contactPersonRole: '',
      administrativePhone: '',
      administrativeEmail: '',
      partnershipStartDateIso: now.slice(0, 10),
      partnershipExpirationDateIso: null,
      contractReference: '',
      internalNotes: '',
      integrationNotes: '',
      providerAdapterId: 'manual_default',
      webhookEndpointUrl: '',
      serverCredentialVaultRef: '',
      createdBy: uid,
      updatedBy: uid,
      updatedAtIso: now,
    },
  };
}
