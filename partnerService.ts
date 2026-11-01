import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, configured, storage } from './firebase';
import {
  AdminAuditLogRecord,
  AuditActionType,
  createDefaultDisplayCustomization,
  createDefaultVisibilitySettings,
  DEFAULT_PARTNER_CATEGORIES,
  PartnerBranchRecord,
  PartnerCategoryRecord,
  PartnerFullAdminRecord,
  PartnerMedicationMappingRecord,
  PartnerOrderRecord,
  PartnerOrderStatus,
  PartnerPrivateAdminRecord,
  PartnerPublicRecord,
  PartnerVisibilitySettings,
  PlacementLocationId,
} from './partnerTypes';

// ============================================================================
// COLLECTION NAMES & CACHE KEYS
// ============================================================================
export const COL_PARTNERS = 'partners';
export const COL_PARTNER_PRIVATE = 'partnerPrivateAdmin';
export const COL_PARTNER_CATEGORIES = 'partnerCategories';
export const COL_PARTNER_BRANCHES = 'partnerBranches';
export const COL_PARTNER_MAPPINGS = 'partnerMedicationMappings';
export const COL_PARTNER_ORDERS = 'partnerOrders';
export const COL_ADMIN_AUDIT_LOGS = 'adminAuditLogs';

const CACHE_PARTNERS_KEY = 'aa_partners_public_v1';
const CACHE_PRIVATE_KEY = 'aa_partners_private_v1';
const CACHE_CATEGORIES_KEY = 'aa_partner_categories_v1';
const CACHE_BRANCHES_KEY = 'aa_partner_branches_v1';
const CACHE_MAPPINGS_KEY = 'aa_partner_mappings_v1';
const CACHE_ORDERS_KEY = 'aa_partner_orders_v1';
const CACHE_AUDIT_KEY = 'aa_partner_audit_logs_v1';
const PARTNER_SYNC_EVENT = 'aa-partner-ecosystem-updated';

// ============================================================================
// IN-MEMORY REACTIVE STORE WITH LOCALSTORAGE FALLBACK
// ============================================================================
let memPartners: PartnerPublicRecord[] = [];
let memPrivateMap: Record<string, PartnerPrivateAdminRecord> = {};
let memCategories: PartnerCategoryRecord[] = [...DEFAULT_PARTNER_CATEGORIES];
let memBranches: PartnerBranchRecord[] = [];
let memMappings: PartnerMedicationMappingRecord[] = [];
let memOrders: PartnerOrderRecord[] = [];
let memAuditLogs: AdminAuditLogRecord[] = [];
let listenersInitialized = false;
let storeVersion = 1;

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore quota errors */
  }
}

function emitPartnerUpdate(): void {
  storeVersion += 1;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PARTNER_SYNC_EVENT, { detail: storeVersion }));
  }
}

// Hydrate from localStorage on module load
if (typeof window !== 'undefined') {
  memPartners = safeReadJson<PartnerPublicRecord[]>(CACHE_PARTNERS_KEY, []);
  memPrivateMap = safeReadJson<Record<string, PartnerPrivateAdminRecord>>(CACHE_PRIVATE_KEY, {});
  const cachedCats = safeReadJson<PartnerCategoryRecord[]>(CACHE_CATEGORIES_KEY, []);
  if (Array.isArray(cachedCats) && cachedCats.length > 0) {
    // Merge default categories with any custom or modified categories
    const catMap = new Map<string, PartnerCategoryRecord>();
    DEFAULT_PARTNER_CATEGORIES.forEach((c) => catMap.set(c.id, c));
    cachedCats.forEach((c) => {
      if (c && c.id) catMap.set(c.id, c);
    });
    memCategories = Array.from(catMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  } else {
    memCategories = [...DEFAULT_PARTNER_CATEGORIES];
  }
  memBranches = safeReadJson<PartnerBranchRecord[]>(CACHE_BRANCHES_KEY, []);
  memMappings = safeReadJson<PartnerMedicationMappingRecord[]>(CACHE_MAPPINGS_KEY, []);
  memOrders = safeReadJson<PartnerOrderRecord[]>(CACHE_ORDERS_KEY, []);
  memAuditLogs = safeReadJson<AdminAuditLogRecord[]>(CACHE_AUDIT_KEY, []);
}

/**
 * Start real-time Firestore listeners for public collections so any change made by the
 * website owner on their Android phone reflects on the public website immediately
 * without rebuilding or redeploying.
 */
export function startPartnerEcosystemSync(): void {
  if (listenersInitialized || typeof window === 'undefined' || !configured || !db) return;
  listenersInitialized = true;

  // 1. Partners collection listener
  try {
    onSnapshot(
      collection(db, COL_PARTNERS),
      (snap) => {
        const list: PartnerPublicRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as PartnerPublicRecord;
          if (data && d.id) {
            list.push(sanitizePublicPartner({ ...data, id: d.id }));
          }
        });
        memPartners = list;
        safeWriteJson(CACHE_PARTNERS_KEY, memPartners);
        emitPartnerUpdate();
      },
      () => {
        /* fallback to cached data if offline or restricted */
      }
    );
  } catch {
    /* ignore */
  }

  // 2. Categories collection listener
  try {
    onSnapshot(
      collection(db, COL_PARTNER_CATEGORIES),
      (snap) => {
        const catMap = new Map<string, PartnerCategoryRecord>();
        DEFAULT_PARTNER_CATEGORIES.forEach((c) => catMap.set(c.id, c));
        snap.forEach((d) => {
          const data = d.data() as PartnerCategoryRecord;
          if (data && d.id) {
            catMap.set(d.id, { ...data, id: d.id });
          }
        });
        memCategories = Array.from(catMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
        safeWriteJson(CACHE_CATEGORIES_KEY, memCategories);
        emitPartnerUpdate();
      },
      () => {}
    );
  } catch {
    /* ignore */
  }

  // 3. Branches collection listener
  try {
    onSnapshot(
      collection(db, COL_PARTNER_BRANCHES),
      (snap) => {
        const list: PartnerBranchRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as PartnerBranchRecord;
          if (data && d.id) {
            list.push({ ...data, id: d.id });
          }
        });
        memBranches = list;
        safeWriteJson(CACHE_BRANCHES_KEY, memBranches);
        emitPartnerUpdate();
      },
      () => {}
    );
  } catch {
    /* ignore */
  }

  // 4. Medication Mappings listener
  try {
    onSnapshot(
      collection(db, COL_PARTNER_MAPPINGS),
      (snap) => {
        const list: PartnerMedicationMappingRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as PartnerMedicationMappingRecord;
          if (data && d.id) {
            list.push({ ...data, id: d.id });
          }
        });
        memMappings = list;
        safeWriteJson(CACHE_MAPPINGS_KEY, memMappings);
        emitPartnerUpdate();
      },
      () => {}
    );
  } catch {
    /* ignore */
  }
}

export function sanitizePublicPartner(raw: PartnerPublicRecord): PartnerPublicRecord {
  const id = raw.id || `partner_${Date.now()}`;
  const defaultVis = createDefaultVisibilitySettings(id);
  const defaultDisp = createDefaultDisplayCustomization();
  return {
    ...raw,
    id,
    name: raw.name || raw.nameAr || raw.nameEn || id,
    nameAr: raw.nameAr || raw.name || raw.nameEn || '',
    nameEn: raw.nameEn || raw.name || raw.nameAr || '',
    servicesOfferedAr: Array.isArray(raw.servicesOfferedAr) ? raw.servicesOfferedAr : [],
    servicesOfferedEn: Array.isArray(raw.servicesOfferedEn) ? raw.servicesOfferedEn : [],
    supportedGovernorates: Array.isArray(raw.supportedGovernorates) ? raw.supportedGovernorates : [],
    supportedCities: Array.isArray(raw.supportedCities) ? raw.supportedCities : [],
    supportedDistricts: Array.isArray(raw.supportedDistricts) ? raw.supportedDistricts : [],
    visibility: {
      ...defaultVis,
      ...(raw.visibility || {}),
      partnerId: id,
      allowedPlacements: Array.isArray(raw.visibility?.allowedPlacements)
        ? raw.visibility.allowedPlacements
        : [],
      allowedGovernorates: Array.isArray(raw.visibility?.allowedGovernorates)
        ? raw.visibility.allowedGovernorates
        : [],
      allowedCities: Array.isArray(raw.visibility?.allowedCities)
        ? raw.visibility.allowedCities
        : [],
      allowedDistricts: Array.isArray(raw.visibility?.allowedDistricts)
        ? raw.visibility.allowedDistricts
        : [],
      selectedBranchIdsOnly: Array.isArray(raw.visibility?.selectedBranchIdsOnly)
        ? raw.visibility.selectedBranchIdsOnly
        : [],
    },
    display: {
      ...defaultDisp,
      ...(raw.display || {}),
    },
  };
}

// ============================================================================
// OWNER-CONTROLLED VISIBILITY & GEOGRAPHIC EVALUATION ENGINE
// ============================================================================
export interface PublicVisibilityContext {
  placement?: PlacementLocationId;
  governorateId?: string;
  city?: string;
  district?: string;
  nowIso?: string;
  onlyPharmacies?: boolean;
}

/**
 * Evaluates whether a partner is currently eligible to appear on the public website
 * given the owner's visibility toggles, publication status, schedule windows, and
 * geographic coverage rules.
 *
 * CRITICAL GUARANTEE:
 * A partner serving Cairo will NEVER automatically appear as available in Tanta
 * unless its geographic coverage or branches explicitly support that area.
 */
export function isPartnerVisiblePublicly(
  partner: PartnerPublicRecord,
  ctx: PublicVisibilityContext = {},
  partnerBranches: PartnerBranchRecord[] = memBranches
): boolean {
  // 1. Check partnership & publication status
  if (partner.partnershipStatus !== 'active') return false;
  if (partner.publicationStatus !== 'published' && partner.publicationStatus !== 'scheduled') {
    return false;
  }
  if (partner.visibilityStatus === 'hidden' || partner.visibilityStatus === 'temporarily_suspended') {
    return false;
  }

  const vis = partner.visibility;
  if (!vis) return false;

  // 2. Check master switches
  if (!vis.showOnWebsite) return false;
  if (vis.temporarilySuspended) return false;

  // 3. Check scheduled publication & deactivation windows
  const now = ctx.nowIso ? new Date(ctx.nowIso).getTime() : Date.now();
  if (vis.scheduledPublishAtIso) {
    const pubTime = new Date(vis.scheduledPublishAtIso).getTime();
    if (!Number.isNaN(pubTime) && now < pubTime) return false;
  }
  if (vis.scheduledDeactivateAtIso) {
    const deactTime = new Date(vis.scheduledDeactivateAtIso).getTime();
    if (!Number.isNaN(deactTime) && now >= deactTime) return false;
  }

  // 4. Check specific placement location switches
  if (ctx.placement) {
    switch (ctx.placement) {
      case 'homepage_featured':
        if (!vis.showOnHomepage) return false;
        break;
      case 'partner_directory':
      case 'pharmacy_directory':
        if (!vis.showInPartnerDirectory) return false;
        break;
      case 'medication_search_results':
        if (!vis.showInMedicationSearch) return false;
        break;
      case 'medication_detail_page':
      case 'medication_purchase_suggestions':
        if (!vis.showInMedicationDetails) return false;
        break;
      case 'nearby_pharmacy_results':
        if (!vis.showInNearbyPharmacies) return false;
        break;
      case 'dedicated_partner_page':
        if (!vis.publishPartnerProfile) return false;
        break;
      case 'healthcare_service_pages':
        if (!vis.showInRelevantServiceSections) return false;
        break;
    }

    // Also if the owner configured explicit allowedPlacements, enforce it when non-empty
    if (vis.allowedPlacements.length > 0 && !vis.allowedPlacements.includes(ctx.placement)) {
      return false;
    }
  }

  // 5. Check Geographic Visibility (Strict governorate/city/district/branch matching)
  if (ctx.governorateId && ctx.governorateId !== 'all') {
    const targetGov = ctx.governorateId.toLowerCase().trim();
    const activeBranchesForPartner = partnerBranches.filter(
      (b) => b.partnerId === partner.id && b.published && b.branchStatus === 'active'
    );

    if (vis.geographicScope === 'selected_branches_only') {
      const allowedBranchIds = new Set(vis.selectedBranchIdsOnly);
      const matchingBranches = activeBranchesForPartner.filter(
        (b) =>
          (allowedBranchIds.size === 0 || allowedBranchIds.has(b.id)) &&
          (b.governorateId.toLowerCase() === targetGov ||
            b.serviceGovernorates.some((g) => g.toLowerCase() === targetGov))
      );
      if (matchingBranches.length === 0) return false;
    } else if (vis.geographicScope === 'specific_governorates') {
      const govPool =
        vis.allowedGovernorates.length > 0
          ? vis.allowedGovernorates
          : partner.supportedGovernorates;
      const matchesGov = govPool.some((g) => g.toLowerCase() === targetGov);
      const hasBranchInGov = activeBranchesForPartner.some(
        (b) =>
          b.governorateId.toLowerCase() === targetGov ||
          b.serviceGovernorates.some((g) => g.toLowerCase() === targetGov)
      );
      if (!matchesGov && !hasBranchInGov) return false;
    } else if (vis.geographicScope === 'specific_cities' && ctx.city && ctx.city !== 'all') {
      const targetCity = ctx.city.toLowerCase().trim();
      const cityPool =
        vis.allowedCities.length > 0 ? vis.allowedCities : partner.supportedCities;
      const matchesCity = cityPool.some((c) => c.toLowerCase().includes(targetCity));
      const hasBranchInCity = activeBranchesForPartner.some(
        (b) =>
          b.city.toLowerCase().includes(targetCity) ||
          b.serviceCities.some((c) => c.toLowerCase().includes(targetCity))
      );
      if (!matchesCity && !hasBranchInCity) return false;
    } else if (vis.geographicScope === 'all_egypt') {
      // Even when scope is 'all_egypt', if the partner explicitly listed supportedGovernorates
      // and did NOT include 'all_egypt', verify coverage so a Cairo-only pharmacy doesn't appear in Tanta
      if (
        partner.supportedGovernorates.length > 0 &&
        !partner.supportedGovernorates.includes('all_egypt')
      ) {
        const supportsGov = partner.supportedGovernorates.some(
          (g) => g.toLowerCase() === targetGov
        );
        const hasBranchInGov = activeBranchesForPartner.some(
          (b) =>
            b.governorateId.toLowerCase() === targetGov ||
            b.serviceGovernorates.some((g) => g.toLowerCase() === targetGov)
        );
        if (!supportsGov && !hasBranchInGov) return false;
      }
    }
  }

  if (ctx.city && ctx.city !== 'all') {
    const targetCity = ctx.city.toLowerCase().trim();
    const activeBranchesForPartner = partnerBranches.filter(
      (b) => b.partnerId === partner.id && b.published && b.branchStatus === 'active'
    );
    const cityPool = [
      ...(partner.supportedCities || []),
      ...(vis.allowedCities || []),
      ...activeBranchesForPartner.map((b) => b.city),
      ...activeBranchesForPartner.flatMap((b) => b.serviceCities || []),
    ].filter(Boolean);

    // If specific cities are configured for this partner/branches, check city match
    if (cityPool.length > 0) {
      const cityMatches = cityPool.some((c) => c.toLowerCase().includes(targetCity));
      if (!cityMatches && vis.geographicScope === 'specific_cities') return false;
    }
  }

  return true;
}

/**
 * Sorts public partners according to owner-configured priority for the given context.
 */
export function sortPublicPartners(
  partners: PartnerPublicRecord[],
  placement?: PlacementLocationId
): PartnerPublicRecord[] {
  return [...partners].sort((a, b) => {
    const visA = a.visibility;
    const visB = b.visibility;

    // Featured placement first
    if (visA.featuredPlacement !== visB.featuredPlacement) {
      return visA.featuredPlacement ? -1 : 1;
    }

    if (placement === 'homepage_featured') {
      if (visA.homepagePriority !== visB.homepagePriority) {
        return visA.homepagePriority - visB.homepagePriority;
      }
    }

    if (
      placement === 'medication_search_results' ||
      placement === 'medication_detail_page'
    ) {
      if (visA.searchResultPriority !== visB.searchResultPriority) {
        return visA.searchResultPriority - visB.searchResultPriority;
      }
    }

    if (visA.displayOrder !== visB.displayOrder) {
      return visA.displayOrder - visB.displayOrder;
    }

    return a.nameAr.localeCompare(b.nameAr, 'ar');
  });
}

// ============================================================================
// AUDIT LOGGING SERVICE
// ============================================================================
export async function recordAdminAuditLog(params: {
  action: AuditActionType;
  partnerId: string;
  partnerName: string;
  adminUid: string;
  adminRole: string;
  summaryAr: string;
  summaryEn: string;
  changeDetails?: Record<string, unknown>;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const entry: AdminAuditLogRecord = {
    id,
    action: params.action,
    partnerId: params.partnerId,
    partnerName: params.partnerName,
    adminUid: params.adminUid || 'admin',
    adminRole: params.adminRole || 'admin',
    timestampIso: nowIso,
    summaryAr: params.summaryAr,
    summaryEn: params.summaryEn,
    changeDetails: params.changeDetails || {},
  };

  memAuditLogs = [entry, ...memAuditLogs].slice(0, 500);
  safeWriteJson(CACHE_AUDIT_KEY, memAuditLogs);
  emitPartnerUpdate();

  if (configured && db) {
    try {
      await setDoc(doc(db, COL_ADMIN_AUDIT_LOGS, id), entry);
    } catch {
      /* keep local log if offline */
    }
  }
}

export async function fetchAdminAuditLogs(): Promise<AdminAuditLogRecord[]> {
  if (configured && db) {
    try {
      const snap = await getDocs(collection(db, COL_ADMIN_AUDIT_LOGS));
      const list: AdminAuditLogRecord[] = [];
      snap.forEach((d) => {
        const data = d.data() as AdminAuditLogRecord;
        if (data) list.push({ ...data, id: d.id });
      });
      if (list.length > 0) {
        memAuditLogs = list.sort((a, b) => b.timestampIso.localeCompare(a.timestampIso));
        safeWriteJson(CACHE_AUDIT_KEY, memAuditLogs);
      }
    } catch {
      /* fallback to memAuditLogs */
    }
  }
  return memAuditLogs;
}

// ============================================================================
// ADMIN CRUD OPERATIONS FOR PARTNERS (PUBLIC + PRIVATE SEPARATION)
// ============================================================================
export async function fetchAllPartnersForAdmin(): Promise<PartnerFullAdminRecord[]> {
  if (configured && db) {
    try {
      const [pubSnap, privSnap] = await Promise.all([
        getDocs(collection(db, COL_PARTNERS)),
        getDocs(collection(db, COL_PARTNER_PRIVATE)).catch(() => null),
      ]);

      const pubList: PartnerPublicRecord[] = [];
      pubSnap.forEach((d) => {
        const data = d.data() as PartnerPublicRecord;
        if (data) pubList.push(sanitizePublicPartner({ ...data, id: d.id }));
      });

      if (privSnap) {
        privSnap.forEach((d) => {
          const pData = d.data() as PartnerPrivateAdminRecord;
          if (pData) memPrivateMap[d.id] = { ...pData, partnerId: d.id };
        });
        safeWriteJson(CACHE_PRIVATE_KEY, memPrivateMap);
      }

      if (pubList.length > 0 || memPartners.length === 0) {
        memPartners = pubList;
        safeWriteJson(CACHE_PARTNERS_KEY, memPartners);
      }
    } catch {
      /* fallback to memory/localStorage */
    }
  }

  return memPartners.map((pub) => ({
    ...pub,
    privateAdmin: memPrivateMap[pub.id] || {
      partnerId: pub.id,
      contactPersonName: '',
      contactPersonRole: '',
      administrativePhone: '',
      administrativeEmail: '',
      partnershipStartDateIso: pub.createdAtIso.slice(0, 10),
      partnershipExpirationDateIso: null,
      contractReference: '',
      internalNotes: '',
      integrationNotes: '',
      providerAdapterId: 'universal_dynamic_adapter',
      webhookEndpointUrl: '',
      serverCredentialVaultRef: '',
      createdBy: 'admin',
      updatedBy: 'admin',
      updatedAtIso: pub.updatedAtIso,
    },
  }));
}

export async function savePartnerFullRecord(
  record: PartnerFullAdminRecord,
  adminUid: string,
  adminRole: string,
  isNew = false
): Promise<PartnerFullAdminRecord> {
  const nowIso = new Date().toISOString();
  const { privateAdmin, ...publicPart } = record;

  // Enforce strict rule: Never falsely display verification badge if not verified
  const cleanPublic: PartnerPublicRecord = sanitizePublicPartner({
    ...publicPart,
    name: publicPart.nameAr.trim() || publicPart.nameEn.trim() || publicPart.name.trim(),
    nameAr: publicPart.nameAr.trim() || publicPart.nameEn.trim(),
    nameEn: publicPart.nameEn.trim() || publicPart.nameAr.trim(),
    updatedAtIso: nowIso,
    visibility: {
      ...publicPart.visibility,
      partnerId: publicPart.id,
      updatedAtIso: nowIso,
      updatedBy: adminUid,
    },
  });

  const cleanPrivate: PartnerPrivateAdminRecord = {
    ...privateAdmin,
    partnerId: cleanPublic.id,
    updatedBy: adminUid,
    updatedAtIso: nowIso,
  };

  // Update in-memory & localStorage immediately
  const existingIdx = memPartners.findIndex((p) => p.id === cleanPublic.id);
  if (existingIdx >= 0) {
    memPartners[existingIdx] = cleanPublic;
  } else {
    memPartners = [cleanPublic, ...memPartners];
  }
  memPrivateMap[cleanPublic.id] = cleanPrivate;
  safeWriteJson(CACHE_PARTNERS_KEY, memPartners);
  safeWriteJson(CACHE_PRIVATE_KEY, memPrivateMap);
  emitPartnerUpdate();

  // Save to Firestore (Public data in `partners/{id}`, sensitive admin notes in `partnerPrivateAdmin/{id}`)
  if (configured && db) {
    await Promise.all([
      setDoc(doc(db, COL_PARTNERS, cleanPublic.id), cleanPublic),
      setDoc(doc(db, COL_PARTNER_PRIVATE, cleanPublic.id), cleanPrivate),
    ]);
  }

  await recordAdminAuditLog({
    action: isNew ? 'partner_added' : 'partner_edited',
    partnerId: cleanPublic.id,
    partnerName: cleanPublic.nameAr || cleanPublic.nameEn,
    adminUid,
    adminRole,
    summaryAr: isNew
      ? `تمت إضافة شريك جديد (${cleanPublic.nameAr}) بحالة: ${cleanPublic.publicationStatus}`
      : `تم تحديث بيانات الشريك (${cleanPublic.nameAr})`,
    summaryEn: isNew
      ? `Added new partner (${cleanPublic.nameEn}) with status: ${cleanPublic.publicationStatus}`
      : `Updated partner profile (${cleanPublic.nameEn})`,
    changeDetails: {
      partnershipStatus: cleanPublic.partnershipStatus,
      publicationStatus: cleanPublic.publicationStatus,
      verificationStatus: cleanPublic.verificationStatus,
      showOnWebsite: cleanPublic.visibility.showOnWebsite,
    },
  });

  return { ...cleanPublic, privateAdmin: cleanPrivate };
}

/**
 * Quick status/visibility mutation from the Admin Dashboard table/cards
 */
export async function updatePartnerQuickState(
  partnerId: string,
  patch: Partial<PartnerPublicRecord> & { visibilityPatch?: Partial<PartnerVisibilitySettings> },
  adminUid: string,
  adminRole: string,
  auditAction: AuditActionType,
  summaryAr: string,
  summaryEn: string
): Promise<void> {
  const existing = memPartners.find((p) => p.id === partnerId);
  if (!existing) return;

  const nowIso = new Date().toISOString();
  const { visibilityPatch, ...restPatch } = patch;

  const updated: PartnerPublicRecord = sanitizePublicPartner({
    ...existing,
    ...restPatch,
    updatedAtIso: nowIso,
    visibility: {
      ...existing.visibility,
      ...(visibilityPatch || {}),
      updatedAtIso: nowIso,
      updatedBy: adminUid,
    },
  });

  memPartners = memPartners.map((p) => (p.id === partnerId ? updated : p));
  safeWriteJson(CACHE_PARTNERS_KEY, memPartners);
  emitPartnerUpdate();

  if (configured && db) {
    await setDoc(doc(db, COL_PARTNERS, partnerId), updated);
  }

  await recordAdminAuditLog({
    action: auditAction,
    partnerId,
    partnerName: updated.nameAr || updated.nameEn,
    adminUid,
    adminRole,
    summaryAr,
    summaryEn,
    changeDetails: { ...restPatch, ...(visibilityPatch || {}) },
  });
}

// ============================================================================
// FIREBASE STORAGE IMAGE UPLOAD (NEVER STORES BINARIES IN FIRESTORE)
// ============================================================================
export async function uploadPartnerAssetToStorage(
  file: File,
  partnerId: string,
  assetType: 'logo' | 'cover' | 'prescription'
): Promise<string> {
  if (!configured || !storage) {
    throw new Error('STORAGE_NOT_CONFIGURED');
  }
  const safeExt = (file.name.split('.').pop() || 'png').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const storagePath = `partner_assets/${partnerId}/${assetType}_${Date.now()}.${safeExt}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/png' });
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

// ============================================================================
// DYNAMIC PARTNER CATEGORIES MANAGEMENT
// ============================================================================
export async function savePartnerCategory(
  category: PartnerCategoryRecord,
  adminUid: string,
  adminRole: string,
  isNew = false
): Promise<PartnerCategoryRecord> {
  const nowIso = new Date().toISOString();
  const clean: PartnerCategoryRecord = {
    ...category,
    updatedAtIso: nowIso,
    updatedBy: adminUid,
  };

  const idx = memCategories.findIndex((c) => c.id === clean.id);
  if (idx >= 0) {
    memCategories[idx] = clean;
  } else {
    memCategories.push(clean);
  }
  memCategories = [...memCategories].sort((a, b) => a.displayOrder - b.displayOrder);
  safeWriteJson(CACHE_CATEGORIES_KEY, memCategories);
  emitPartnerUpdate();

  if (configured && db) {
    await setDoc(doc(db, COL_PARTNER_CATEGORIES, clean.id), clean);
  }

  await recordAdminAuditLog({
    action: isNew ? 'category_added' : 'category_edited',
    partnerId: clean.id,
    partnerName: clean.nameAr || clean.nameEn,
    adminUid,
    adminRole,
    summaryAr: isNew
      ? `تم إنشاء فئة شركاء جديدة: ${clean.nameAr}`
      : `تم تعديل فئة الشركاء: ${clean.nameAr}`,
    summaryEn: isNew
      ? `Created partner category: ${clean.nameEn}`
      : `Updated partner category: ${clean.nameEn}`,
  });

  return clean;
}

// ============================================================================
// PARTNER BRANCHES MANAGEMENT
// ============================================================================
export async function savePartnerBranch(
  branch: PartnerBranchRecord,
  adminUid: string,
  adminRole: string,
  isNew = false
): Promise<PartnerBranchRecord> {
  const nowIso = new Date().toISOString();
  const clean: PartnerBranchRecord = {
    ...branch,
    updatedAtIso: nowIso,
    updatedBy: adminUid,
  };

  const idx = memBranches.findIndex((b) => b.id === clean.id);
  if (idx >= 0) {
    memBranches[idx] = clean;
  } else {
    memBranches = [clean, ...memBranches];
  }
  safeWriteJson(CACHE_BRANCHES_KEY, memBranches);
  emitPartnerUpdate();

  if (configured && db) {
    await setDoc(doc(db, COL_PARTNER_BRANCHES, clean.id), clean);
  }

  await recordAdminAuditLog({
    action: isNew ? 'branch_added' : 'branch_edited',
    partnerId: clean.partnerId,
    partnerName: clean.nameAr || clean.nameEn,
    adminUid,
    adminRole,
    summaryAr: isNew
      ? `تمت إضافة فرع جديد (${clean.nameAr}) في محافظة ${clean.governorateId}`
      : `تم تحديث بيانات الفرع (${clean.nameAr})`,
    summaryEn: isNew
      ? `Added new branch (${clean.nameEn}) in ${clean.governorateId}`
      : `Updated branch (${clean.nameEn})`,
  });

  return clean;
}

export async function deletePartnerBranch(
  branchId: string,
  partnerId: string,
  branchName: string,
  adminUid: string,
  adminRole: string
): Promise<void> {
  memBranches = memBranches.filter((b) => b.id !== branchId);
  safeWriteJson(CACHE_BRANCHES_KEY, memBranches);
  emitPartnerUpdate();

  if (configured && db) {
    await deleteDoc(doc(db, COL_PARTNER_BRANCHES, branchId));
  }

  await recordAdminAuditLog({
    action: 'branch_deleted',
    partnerId,
    partnerName: branchName,
    adminUid,
    adminRole,
    summaryAr: `تم حذف الفرع (${branchName})`,
    summaryEn: `Deleted branch (${branchName})`,
  });
}

// ============================================================================
// PARTNER-TO-MEDICATION MAPPING MANAGEMENT
// ============================================================================
export async function savePartnerMedicationMapping(
  mapping: PartnerMedicationMappingRecord,
  adminUid: string,
  adminRole: string
): Promise<PartnerMedicationMappingRecord> {
  const nowIso = new Date().toISOString();
  const clean: PartnerMedicationMappingRecord = {
    ...mapping,
    updatedAtIso: nowIso,
    updatedBy: adminUid,
  };

  const idx = memMappings.findIndex((m) => m.id === clean.id);
  if (idx >= 0) {
    memMappings[idx] = clean;
  } else {
    memMappings = [clean, ...memMappings];
  }
  safeWriteJson(CACHE_MAPPINGS_KEY, memMappings);
  emitPartnerUpdate();

  if (configured && db) {
    await setDoc(doc(db, COL_PARTNER_MAPPINGS, clean.id), clean);
  }

  await recordAdminAuditLog({
    action: 'medication_mapping_saved',
    partnerId: clean.partnerId,
    partnerName: `${clean.tradeNameAr} (${clean.strength})`,
    adminUid,
    adminRole,
    summaryAr: `تم ربط الدواء (${clean.tradeNameAr} ${clean.strength}) بالشريك بحالة توفر: ${clean.stockStatus}`,
    summaryEn: `Mapped medication (${clean.tradeNameEn} ${clean.strength}) to partner with status: ${clean.stockStatus}`,
  });

  return clean;
}

export async function deletePartnerMedicationMapping(
  mappingId: string,
  partnerId: string,
  medName: string,
  adminUid: string,
  adminRole: string
): Promise<void> {
  memMappings = memMappings.filter((m) => m.id !== mappingId);
  safeWriteJson(CACHE_MAPPINGS_KEY, memMappings);
  emitPartnerUpdate();

  if (configured && db) {
    await deleteDoc(doc(db, COL_PARTNER_MAPPINGS, mappingId));
  }

  await recordAdminAuditLog({
    action: 'medication_mapping_deleted',
    partnerId,
    partnerName: medName,
    adminUid,
    adminRole,
    summaryAr: `تم إلغاء ربط الدواء (${medName})`,
    summaryEn: `Removed medication mapping (${medName})`,
  });
}

// ============================================================================
// ORDER SUBMISSION & TRACKING SERVICE
// ============================================================================
export async function createPartnerOrder(
  orderDraft: Omit<PartnerOrderRecord, 'id' | 'orderNumber' | 'createdAtIso' | 'updatedAtIso' | 'statusHistory'>
): Promise<PartnerOrderRecord> {
  const nowIso = new Date().toISOString();
  const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const orderNumber = `AA-RX-${Date.now().toString().slice(-6)}`;

  const fullOrder: PartnerOrderRecord = {
    ...orderDraft,
    id,
    orderNumber,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    statusHistory: [
      {
        status: orderDraft.status,
        timestampIso: nowIso,
        noteAr: orderDraft.externalRedirectUsed
          ? 'تم توجيه الطلب إلى صفحة الطلب المعتمدة الخاصة بالصيدلية'
          : 'تم إرسال طلب الصرف المبدئي وبانتظار مراجعة الصيدلي للوصفة الطبية',
        noteEn: orderDraft.externalRedirectUsed
          ? 'Redirected to the pharmacy’s authorized external checkout page'
          : 'Submitted for licensed pharmacist prescription review',
        updatedBy: orderDraft.userId || 'patient',
      },
    ],
  };

  memOrders = [fullOrder, ...memOrders];
  safeWriteJson(CACHE_ORDERS_KEY, memOrders);
  emitPartnerUpdate();

  if (configured && db) {
    try {
      await setDoc(doc(db, COL_PARTNER_ORDERS, id), fullOrder);
    } catch {
      /* keep in local storage if guest/offline */
    }
  }

  return fullOrder;
}

export async function updatePartnerOrderStatus(
  orderId: string,
  newStatus: PartnerOrderStatus,
  noteAr: string,
  noteEn: string,
  adminUid: string,
  adminRole: string
): Promise<void> {
  const idx = memOrders.findIndex((o) => o.id === orderId);
  if (idx < 0) return;

  const nowIso = new Date().toISOString();
  const current = memOrders[idx];
  const updated: PartnerOrderRecord = {
    ...current,
    status: newStatus,
    updatedAtIso: nowIso,
    statusHistory: [
      ...current.statusHistory,
      {
        status: newStatus,
        timestampIso: nowIso,
        noteAr,
        noteEn,
        updatedBy: adminUid,
      },
    ],
  };

  memOrders[idx] = updated;
  safeWriteJson(CACHE_ORDERS_KEY, memOrders);
  emitPartnerUpdate();

  if (configured && db) {
    await setDoc(doc(db, COL_PARTNER_ORDERS, orderId), updated);
  }

  await recordAdminAuditLog({
    action: 'order_status_updated',
    partnerId: updated.partnerId,
    partnerName: updated.orderNumber,
    adminUid,
    adminRole,
    summaryAr: `تحديث حالة الطلب (${updated.orderNumber}) إلى ${newStatus}`,
    summaryEn: `Updated order (${updated.orderNumber}) status to ${newStatus}`,
  });
}

// ============================================================================
// REACT HOOK FOR REAL-TIME PARTNER ECOSYSTEM ACCESS
// ============================================================================
export function usePartnerEcosystem() {
  const [, setTick] = useState(storeVersion);

  useEffect(() => {
    startPartnerEcosystemSync();
    const onUpdate = () => setTick((v) => v + 1);
    window.addEventListener(PARTNER_SYNC_EVENT, onUpdate);
    return () => window.removeEventListener(PARTNER_SYNC_EVENT, onUpdate);
  }, []);

  return {
    partners: memPartners,
    categories: memCategories,
    branches: memBranches,
    mappings: memMappings,
    orders: memOrders,
    auditLogs: memAuditLogs,
    getVisiblePartners: (ctx?: PublicVisibilityContext) =>
      sortPublicPartners(
        memPartners.filter((p) => isPartnerVisiblePublicly(p, ctx, memBranches)),
        ctx?.placement
      ),
    getPartnerBranches: (partnerId: string, onlyPublished = true) =>
      memBranches.filter(
        (b) =>
          b.partnerId === partnerId &&
          (!onlyPublished || (b.published && b.branchStatus === 'active'))
      ),
    getMedicationMappings: (productId?: string, activeIngredientId?: string, strength?: string, dosageForm?: string) =>
      memMappings.filter((m) => {
        if (!m.published) return false;
        if (productId && m.productId === productId) return true;
        // Strict matching: must match activeIngredientId AND strength AND dosageForm
        if (
          activeIngredientId &&
          m.activeIngredientId === activeIngredientId &&
          (!strength || m.strength.toLowerCase().replace(/\s+/g, '') === strength.toLowerCase().replace(/\s+/g, '')) &&
          (!dosageForm || m.dosageForm === dosageForm)
        ) {
          return true;
        }
        return false;
      }),
  };
}
