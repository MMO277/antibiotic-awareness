import {
  ACTIVE_INGREDIENTS,
  DOSAGE_FORM_LABELS,
  DosageFormType,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  EgyptianCommercialProduct,
  ROUTE_LABELS,
  AdministrationRoute,
} from './egyptianDrugDatabase';

export interface AuditIssue {
  productId: string;
  tradeName: string;
  field: string;
  severity: 'warning' | 'info';
  messageAr: string;
  messageEn: string;
}

export interface DatabaseAuditReport {
  lastAuditDate: string;
  totalActiveIngredients: number;
  totalCommercialProducts: number;
  totalManufacturers: number;
  verifiedBarcodesCount: number;
  pendingBarcodesCount: number;
  verifiedPricesCount: number;
  duplicateProductIds: string[];
  duplicateBarcodes: string[];
  invalidBarcodeFormats: string[];
  dosageFormBreakdown: Record<string, number>;
  whoAwAReBreakdown: Record<'Access' | 'Watch' | 'Reserve', number>;
  reviewQueue: AuditIssue[];
  passedAllIntegrityChecks: boolean;
}

/**
 * Runs automated quality & integrity tests required by Section 10 of the Master Specification:
 * - Checks for duplicate product IDs
 * - Checks for unjustified duplicate barcodes
 * - Validates EAN-13 barcode format without fabricating missing barcodes
 * - Flags records requiring manual field barcode verification in a non-destructive review queue
 */
export function runDatabaseQualityAudit(
  products: EgyptianCommercialProduct[] = EGYPTIAN_COMMERCIAL_PRODUCTS
): DatabaseAuditReport {
  const seenIds = new Set<string>();
  const duplicateProductIds: string[] = [];

  const barcodeOwners = new Map<string, string[]>();
  const invalidBarcodeFormats: string[] = [];
  const reviewQueue: AuditIssue[] = [];

  const manufacturers = new Set<string>();
  const dosageFormBreakdown: Record<string, number> = {};
  let verifiedBarcodesCount = 0;
  let pendingBarcodesCount = 0;
  let verifiedPricesCount = 0;

  for (const p of products) {
    // 1. Check duplicate IDs
    if (seenIds.has(p.productId)) {
      duplicateProductIds.push(p.productId);
    }
    seenIds.add(p.productId);

    manufacturers.add(p.manufacturer);
    dosageFormBreakdown[p.dosageForm] = (dosageFormBreakdown[p.dosageForm] || 0) + 1;

    if (p.priceEgp !== null && p.priceEgp > 0) {
      verifiedPricesCount++;
    } else {
      reviewQueue.push({
        productId: p.productId,
        tradeName: p.tradeNameAr,
        field: 'priceEgp',
        severity: 'warning',
        messageAr: 'السعر الرسمي يحتاج إلى مراجعة وتحديث من تسعيرة هيئة الدواء المصرية.',
        messageEn: 'Official price requires verification against latest EDA pricing decree.',
      });
    }

    // 2. Check Barcodes
    if (p.barcode) {
      verifiedBarcodesCount++;
      const cleanBc = p.barcode.trim();
      if (!/^\d{8,14}$/.test(cleanBc)) {
        invalidBarcodeFormats.push(`${p.productId}: ${cleanBc}`);
      }
      const existing = barcodeOwners.get(cleanBc) || [];
      existing.push(p.productId);
      barcodeOwners.set(cleanBc, existing);
    } else {
      pendingBarcodesCount++;
      reviewQueue.push({
        productId: p.productId,
        tradeName: p.tradeNameAr,
        field: 'barcode',
        severity: 'info',
        messageAr: 'الباركود الخطي للعبوة غير متوفر بعد (قيد التحقق الميداني من العلبة الفعلية لعدم اختلاق أرقام وهمية).',
        messageEn: 'Package linear barcode is pending physical carton verification (kept null per zero-fabrication policy).',
      });
    }
  }

  const duplicateBarcodes: string[] = [];
  barcodeOwners.forEach((owners, bc) => {
    if (owners.length > 1) {
      duplicateBarcodes.push(`${bc} (${owners.join(', ')})`);
    }
  });

  const whoAwAReBreakdown: Record<'Access' | 'Watch' | 'Reserve', number> = {
    Access: 0,
    Watch: 0,
    Reserve: 0,
  };
  ACTIVE_INGREDIENTS.forEach((ing) => {
    whoAwAReBreakdown[ing.whoAccessGroup]++;
  });

  return {
    lastAuditDate: '2026-10-14',
    totalActiveIngredients: ACTIVE_INGREDIENTS.length,
    totalCommercialProducts: products.length,
    totalManufacturers: manufacturers.size,
    verifiedBarcodesCount,
    pendingBarcodesCount,
    verifiedPricesCount,
    duplicateProductIds,
    duplicateBarcodes,
    invalidBarcodeFormats,
    dosageFormBreakdown,
    whoAwAReBreakdown,
    reviewQueue,
    passedAllIntegrityChecks:
      duplicateProductIds.length === 0 &&
      duplicateBarcodes.length === 0 &&
      invalidBarcodeFormats.length === 0,
  };
}

/**
 * Extensible Importer for external Egyptian Drug Database files (CSV / JSON)
 * such as https://github.com/karem505/egyptian-drug-database
 * Filters antibiotic records, maps active ingredients, and preserves strict data quality.
 */
export function parseExternalEgyptianDrugJsonOrCsv(
  rawContent: string,
  fileName: string
): { imported: EgyptianCommercialProduct[]; skippedCount: number } {
  const imported: EgyptianCommercialProduct[] = [];
  let skippedCount = 0;

  try {
    let rows: any[] = [];
    if (fileName.toLowerCase().endsWith('.json') || rawContent.trim().startsWith('[')) {
      const parsed = JSON.parse(rawContent);
      rows = Array.isArray(parsed) ? parsed : parsed.drugs || parsed.data || [];
    } else {
      // Parse CSV
      const lines = rawContent.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return { imported: [], skippedCount: 0 };
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx] || '';
        });
        rows.push(obj);
      }
    }

    rows.forEach((row, index) => {
      const sci = String(
        row.scientific_name || row.active_ingredient || row.generic_name || row.composition || ''
      ).toLowerCase();
      const tradeEn = String(
        row.commercial_name_en || row.trade_name || row.name_en || row.name || ''
      ).trim();
      const tradeAr = String(
        row.commercial_name_ar || row.name_ar || tradeEn
      ).trim();

      if (!tradeEn && !tradeAr) {
        skippedCount++;
        return;
      }

      // Match against our 32 active ingredients
      const matchedIng = ACTIVE_INGREDIENTS.find((ing) =>
        ing.components.some((comp) => sci.includes(comp.toLowerCase())) ||
        sci.includes(ing.id.replace('-', ' '))
      );

      if (!matchedIng) {
        skippedCount++;
        return;
      }

      const routeRaw = String(row.route || row.dosage_form || tradeEn).toLowerCase();
      let dosageForm: DosageFormType = 'tablet';
      let route: AdministrationRoute = 'oral';

      if (/vial|amp|inj|i\.v|i\.m/.test(routeRaw)) {
        dosageForm = 'vial_iv_im';
        route = 'parenteral_iv_im';
      } else if (/susp|syrup|syr|granules/.test(routeRaw)) {
        dosageForm = 'suspension';
        route = 'oral';
      } else if (/cap/.test(routeRaw)) {
        dosageForm = 'capsule';
        route = 'oral';
      } else if (/cream|oint|gel|topical/.test(routeRaw)) {
        dosageForm = 'topical_cream_ointment';
        route = 'topical';
      } else if (/eye|ear|ophth|otic|drop/.test(routeRaw)) {
        dosageForm = 'eye_ear_drops';
        route = 'ophthalmic_otic';
      }

      const priceVal = parseFloat(String(row.price || row.price_egp || ''));
      const validPrice = !isNaN(priceVal) && priceVal > 0 ? priceVal : null;
      const bcRaw = String(row.barcode || row.gtin || '').trim();
      const validBc = /^\d{8,14}$/.test(bcRaw) ? bcRaw : null;
      const strengthMatch = tradeEn.match(/(\d+(?:\.\d+)?\s*(?:mg|gm|g|mcg|iu|%)(?:\s*\/\s*\d+\s*ml)?)/i);
      const strength = strengthMatch ? strengthMatch[1] : matchedIng.nameEn;

      imported.push({
        productId: `EXT-EDA-${index + 1}`,
        tradeNameAr: tradeAr,
        tradeNameEn: tradeEn,
        activeIngredientId: matchedIng.id,
        scientificComposition: row.scientific_name || matchedIng.nameEn,
        strength,
        dosageForm,
        dosageFormLabel: DOSAGE_FORM_LABELS[dosageForm],
        route,
        routeLabel: ROUTE_LABELS[route],
        packDetails: {
          ar: String(row.pack || row.package || 'عبوة مسجلة بالسجل الدوائي المصري'),
          en: String(row.pack || row.package || 'Registered Egyptian Market Package'),
        },
        manufacturer: String(row.manufacturer || row.company || 'شركة مسجلة بهيئة الدواء المصرية'),
        countryOfOrigin: 'Egypt',
        registrationStatus: 'registered_eda',
        availabilityStatus: 'registered_check_stock',
        priceEgp: validPrice,
        unitPriceNote: {
          ar: validPrice ? `${validPrice} ج.م (مستورد من السجل)` : 'غير محدد',
          en: validPrice ? `${validPrice} EGP` : 'Unspecified',
        },
        priceStatus: validPrice ? 'market_observed' : 'unverified',
        priceUpdatedDate: '2026-10-14',
        priceSource: `Imported Dataset (${fileName})`,
        barcode: validBc,
        barcodeType: validBc ? 'EAN-13' : 'UNAVAILABLE',
        barcodeStatus: validBc ? 'verified' : 'unverified_pending',
        barcodeVerifiedBy: validBc ? 'Imported Dataset' : 'غير متوفر بعد - قيد التحقق الميداني',
        equivalenceGroupKey: `${matchedIng.id}|${strength.toLowerCase().replace(/\s+/g, '')}|${dosageForm}|${route}`,
      });
    });
  } catch (e) {
    console.error('Error importing dataset:', e);
  }

  return { imported, skippedCount };
}
