/**
 * aiDocumentProcessor.ts
 *
 * Medical Image & Document Upload, Validation, Compression, Multi-Medication OCR Extraction,
 * Culture & Sensitivity (S/R) Lab Analyzer, and Secure Firebase Storage Service
 * for the Antibiotic Awareness Personal Health Assistant.
 *
 * Safety & Security Principles:
 * - Validates MIME types (JPEG, PNG, WEBP, PDF) and enforces an 8 MB ceiling.
 * - Rejects executable/script/HTML files and path-traversal filenames.
 * - Compresses images client-side before OCR and Storage upload.
 * - Extracts single or multiple medications from a prescription without EVER inventing
 *   a missing dose, strength, frequency, route, or duration.
 * - Extracts Culture & Sensitivity (مزرعة وحساسية) organisms, Sensitive (S), and Resistant (R) antibiotics.
 * - Flags unreadable or ambiguous fields in `unreadableFields` for mandatory patient review.
 * - Uploads original/compressed files to `/patient_documents/{uid}/{docId}_{safeName}`
 *   only when authenticated and Firebase Storage is configured, reporting real upload results.
 */

import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { configured, storage } from './firebase';
import { Lang } from './types';
import { MedicalDocumentCategory } from './allergyData';
import {
  analyzePrescriptionImageWithVision,
  getApiKey,
  parsePrescriptionTextDeterministically,
  PrescriptionOcrExtractionResult,
} from './geminiApi';
import { AddPrescriptionItemArgs, sanitizeText } from './aiActionSchemas';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import { norm } from './search';

export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB matches storage.rules
export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export interface FileValidationResult {
  valid: boolean;
  sanitizedFileName: string;
  mimeType: string;
  errorAr?: string;
  errorEn?: string;
}

export interface ProcessedMedicalDocumentAnalysis {
  title: string;
  category: MedicalDocumentCategory;
  fileName: string;
  mimeType: string;
  fileSize: number;
  previewDataUrl?: string;
  base64Data: string;
  extractedSummaryAr: string;
  extractedSummaryEn: string;
  extractedFields: Record<string, string>;
  unreadableFields: string[];
  contradictionWarnings: string[];
  extractedPrescriptions: AddPrescriptionItemArgs[];
  isUnclearOrIncomplete: boolean;
}

export interface StorageUploadOutcome {
  uploadedToCloud: boolean;
  storagePath?: string;
  downloadUrl?: string;
  errorAr?: string;
  errorEn?: string;
}

/**
 * Validates file type, extension, and size before reading or uploading.
 */
export function validateMedicalUploadFile(file: {
  name: string;
  type: string;
  size: number;
}): FileValidationResult {
  const rawName = (file?.name || 'document').trim();
  const safeName = rawName
    .replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(0, 80);

  if (/\.(exe|sh|bat|cmd|js|jsx|ts|tsx|html|htm|php|py|svg)$/i.test(rawName)) {
    return {
      valid: false,
      sanitizedFileName: safeName,
      mimeType: file?.type || '',
      errorAr:
        '⛔ نوع الملف ده مش مسموح بيه عشان أمان حسابك. تقدر ترفع بس صور الروشتات والتحاليل (JPG, PNG, WEBP) أو ملفات PDF.',
      errorEn:
        '⛔ Unsafe file type blocked. Only medical images (JPG, PNG, WEBP) or PDF documents are allowed.',
    };
  }

  const normalizedMime = (file?.type || '').toLowerCase().trim();
  const inferredMime =
    normalizedMime ||
    (/\.pdf$/i.test(rawName)
      ? 'application/pdf'
      : /\.png$/i.test(rawName)
        ? 'image/png'
        : /\.webp$/i.test(rawName)
          ? 'image/webp'
          : /\.(jpe?g)$/i.test(rawName)
            ? 'image/jpeg'
            : '');

  if (!ALLOWED_MIME_TYPES.has(inferredMime)) {
    return {
      valid: false,
      sanitizedFileName: safeName,
      mimeType: inferredMime,
      errorAr: '⚠️ صيغة الملف دي مش مدعومة. يا ريت تختار صورة واضحة (JPG أو PNG أو WEBP) أو ملف PDF.',
      errorEn: '⚠️ Unsupported file format. Please select a clear image (JPG, PNG, WEBP) or PDF document.',
    };
  }

  if (typeof file.size !== 'number' || file.size <= 0) {
    return {
      valid: false,
      sanitizedFileName: safeName,
      mimeType: inferredMime,
      errorAr: '⚠️ الملف اللي اخترته فاضي أو بايظ، جرب ترفع صورة تانية واضحة.',
      errorEn: '⚠️ The selected file is empty or invalid.',
    };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      sanitizedFileName: safeName,
      mimeType: inferredMime,
      errorAr: '⚠️ حجم الملف أكبر من المسموح بيه (8 ميجابايت). يا ريت تختار صورة أصغر شوية.',
      errorEn: '⚠️ File size exceeds the 8 MB limit. Please upload a smaller image or PDF.',
    };
  }

  return {
    valid: true,
    sanitizedFileName: safeName || 'medical_document.jpg',
    mimeType: inferredMime === 'image/jpg' ? 'image/jpeg' : inferredMime,
  };
}

/**
 * Compresses an image file in the browser using HTML5 Canvas, returning base64 data and a preview data URL.
 */
export async function compressMedicalImageFile(
  file: File,
  maxDimension = 1400,
  quality = 0.8
): Promise<{ base64Data: string; previewDataUrl: string; mimeType: string; compressedSize: number }> {
  if (file.type === 'application/pdf' || typeof document === 'undefined') {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = typeof btoa === 'function' ? btoa(binary) : '';
    return {
      base64Data,
      previewDataUrl: '',
      mimeType: file.type || 'application/pdf',
      compressedSize: file.size,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let w = img.width || 800;
      let h = img.height || 600;
      if (w > maxDimension || h > maxDimension) {
        if (w >= h) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64Data = dataUrl.split(',')[1] || '';

      // Create a compact thumbnail (max 360px) for fast UI preview in chat & profile
      const thumbMax = 360;
      let tw = w;
      let th = h;
      if (tw > thumbMax || th > thumbMax) {
        if (tw >= th) {
          th = Math.round((th * thumbMax) / tw);
          tw = thumbMax;
        } else {
          tw = Math.round((tw * thumbMax) / th);
          th = thumbMax;
        }
      }
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = tw;
      thumbCanvas.height = th;
      const tCtx = thumbCanvas.getContext('2d');
      const previewDataUrl = tCtx
        ? (tCtx.drawImage(img, 0, 0, tw, th), thumbCanvas.toDataURL('image/jpeg', 0.68))
        : dataUrl;

      resolve({
        base64Data,
        previewDataUrl,
        mimeType: 'image/jpeg',
        compressedSize: Math.round((base64Data.length * 3) / 4),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode uploaded image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Deterministically extracts one OR multiple medications from raw OCR/Vision text
 * without ever inventing missing doses, routes, frequencies, or durations.
 */
export function extractMultiplePrescriptionItemsFromText(
  rawText: string,
  fileNameHint?: string
): AddPrescriptionItemArgs[] {
  const cleanText = (rawText || '').trim();
  if (!cleanText) return [];

  const candidateSegments: string[] = [];
  const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Check if text contains multiple distinct drug matches across lines
  const lineDrugHits: { line: string; ingId: string; drugName: string }[] = [];
  for (const line of lines) {
    if (/^(RX_DOSE|RX_ROUTE|RX_FREQ|RX_DURATION_DAYS|RX_NOTES|RX_CONTRADICTIONS):/i.test(line)) {
      continue;
    }
    const normLine = norm(line);
    if (!normLine || normLine.length < 3) continue;

    let matchedIng = '';
    let matchedName = '';

    for (const p of EGYPTIAN_COMMERCIAL_PRODUCTS) {
      const tAr = norm(p.tradeNameAr);
      const tEn = norm(p.tradeNameEn);
      const firstAr = tAr.split(/\s+/)[0] || '';
      const firstEn = tEn.split(/\s+/)[0] || '';
      if (
        (firstEn.length >= 4 && normLine.includes(firstEn)) ||
        (firstAr.length >= 3 && normLine.includes(firstAr))
      ) {
        matchedIng = p.activeIngredientId;
        matchedName = `${p.tradeNameAr} (${p.tradeNameEn})`;
        break;
      }
    }

    if (!matchedIng) {
      for (const ing of ACTIVE_INGREDIENTS) {
        const nAr = norm(ing.nameAr);
        const nEn = norm(ing.nameEn);
        if ((nEn.length >= 4 && normLine.includes(nEn)) || (nAr.length >= 3 && normLine.includes(nAr))) {
          matchedIng = ing.id;
          matchedName = `${ing.nameAr} (${ing.nameEn})`;
          break;
        }
      }
    }

    if (matchedIng && !lineDrugHits.some((h) => h.ingId === matchedIng)) {
      lineDrugHits.push({ line, ingId: matchedIng, drugName: matchedName });
    }
  }

  if (lineDrugHits.length > 1) {
    for (const hit of lineDrugHits) {
      candidateSegments.push(`RX_DRUG_ID: ${hit.ingId}\nRX_DRUG_NAME: ${hit.drugName}\n${hit.line}`);
    }
  } else {
    candidateSegments.push(cleanText);
  }

  const results: AddPrescriptionItemArgs[] = [];
  for (const seg of candidateSegments) {
    const parsed: PrescriptionOcrExtractionResult = parsePrescriptionTextDeterministically(seg);
    if (parsed.detectedDrugName || candidateSegments.length === 1) {
      results.push({
        ...(parsed.matchedIngredientId ? { antibioticId: parsed.matchedIngredientId } : {}),
        medicineName: parsed.detectedDrugName || '',
        prescribedDose: parsed.extractedDoseText || '',
        route: parsed.extractedRoute || '',
        frequency: parsed.extractedFrequencyKey || '',
        durationDays: parsed.extractedDurationDays,
        ...(parsed.extractedNotes ? { notes: parsed.extractedNotes } : {}),
        ...(parsed.extractedCoMeds.length > 0 ? { coMedications: parsed.extractedCoMeds } : {}),
        captureMethod: 'ocr_upload',
        isOcrUnverified: true,
        rawExtractedText: parsed.rawExtractedText,
        ...(fileNameHint ? { imageFileName: fileNameHint } : {}),
        unreadableFields: parsed.unreadableFields,
        createScheduleAlso: false,
      });
    }
  }

  return results;
}

/**
 * Extracts Culture & Sensitivity (مزرعة البكتيريا والحساسية S / R) findings from lab text.
 */
export function extractCultureAndSensitivityFindings(rawText: string): {
  isCultureReport: boolean;
  organism?: string;
  sensitiveAntibiotics: string[];
  resistantAntibiotics: string[];
} {
  const text = (rawText || '').trim();
  if (!text) {
    return { isCultureReport: false, sensitiveAntibiotics: [], resistantAntibiotics: [] };
  }

  const isCultureReport =
    /(culture|sensitivity|antibiogram|isolated organism|colony count|مزرعة|حساسية المضادات|ميكروب|بكتيريا)/i.test(
      text
    );

  let organism: string | undefined;
  const orgMatch = text.match(
    /(?:organism|isolated|growth of|bacteria|الميكروب|البكتيريا)[:\s-]*([A-Za-z.\s]{4,35}|e\.?\s*coli|klebsiella|staphylococcus|streptococcus|pseudomonas|proteus|enterococcus|salmonella)/i
  );
  if (orgMatch) {
    organism = orgMatch[1].trim();
  } else {
    const knownOrg = text.match(
      /\b(Escherichia coli|E\.?\s*coli|Klebsiella(?:\s+pneumoniae)?|Staphylococcus(?:\s+aureus)?|MRSA|Streptococcus|Pseudomonas(?:\s+aeruginosa)?|Proteus(?:\s+mirabilis)?|Enterococcus|Acinetobacter)\b/i
    );
    if (knownOrg) organism = knownOrg[1].trim();
  }

  const sensitiveAntibiotics: string[] = [];
  const resistantAntibiotics: string[] = [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Check if any known active ingredient or antibiotic name appears on this line
    let abxLabel = '';
    const normLine = norm(line);
    for (const ing of ACTIVE_INGREDIENTS) {
      const nEn = norm(ing.nameEn);
      const nAr = norm(ing.nameAr);
      if ((nEn.length >= 4 && normLine.includes(nEn)) || (nAr.length >= 3 && normLine.includes(nAr))) {
        abxLabel = `${ing.nameAr} (${ing.nameEn})`;
        break;
      }
    }
    if (!abxLabel) {
      const genericAbx = line.match(
        /\b(Amoxicillin|Clavulanate|Augmentin|Cefotaxime|Ceftriaxone|Cefuroxime|Cefixime|Cefepime|Meropenem|Imipenem|Ertapenem|Ciprofloxacin|Levofloxacin|Moxifloxacin|Nitrofurantoin|Fosfomycin|Amikacin|Gentamicin|Trimethoprim|Sulfamethoxazole|Cotrimoxazole|Azithromycin|Clarithromycin|Doxycycline|Tigecycline|Vancomycin|Linezolid|Colistin|Piperacillin|Tazobactam)\b/i
      );
      if (genericAbx) abxLabel = genericAbx[1];
    }

    if (!abxLabel) continue;

    const isSensitive =
      /\b(sensitive|susceptible)\b/i.test(line) ||
      /[:\s\t(-]+(S|S\+|S\+\+|\+\+\+)[\s\t)]*$/i.test(line) ||
      /(حساس|فعال)/i.test(line);
    const isResistant =
      /\b(resistant|resistance)\b/i.test(line) ||
      /[:\s\t(-]+(R)[\s\t)]*$/i.test(line) ||
      /(مقاوم|غير فعال)/i.test(line);

    if (isResistant && !resistantAntibiotics.includes(abxLabel)) {
      resistantAntibiotics.push(abxLabel);
    } else if (isSensitive && !sensitiveAntibiotics.includes(abxLabel)) {
      sensitiveAntibiotics.push(abxLabel);
    }
  }

  return {
    isCultureReport:
      isCultureReport || sensitiveAntibiotics.length > 0 || resistantAntibiotics.length > 0,
    organism,
    sensitiveAntibiotics,
    resistantAntibiotics,
  };
}

/**
 * Classifies document category from text/filename and extracts structured fields.
 */
export function classifyAndSummarizeDocumentText(
  rawText: string,
  fileName: string,
  ocrResult?: PrescriptionOcrExtractionResult
): {
  category: MedicalDocumentCategory;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  extractedFields: Record<string, string>;
} {
  const combined = `${rawText || ''} ${fileName || ''}`.toLowerCase();

  const cultureFindings = extractCultureAndSensitivityFindings(rawText);

  const isLab =
    cultureFindings.isCultureReport ||
    /(cbc|hemoglobin|wbc|rbc|creatinine|alt|ast|crp|esr|urine analysis|culture|sensitivity|مزرعة|تحليل|معمل|هيموجلوبين|صورة دم|وظائف كلى|وظائف كبد)/i.test(
      combined
    );
  const isLeaflet =
    /(leaflet|package insert|composition|indications|contraindications|نشرة|النشرة الداخلية|دواعي الاستعمال|التركيب)/i.test(
      combined
    );
  const isReport =
    /(diagnosis|discharge|medical report|ultrasound|x-ray|mri|ct scan|تقرير طبي|أشعة|سونار|تشخيص)/i.test(
      combined
    );

  let category: MedicalDocumentCategory = 'prescription';
  if (cultureFindings.isCultureReport || (isLab && !ocrResult?.detectedDrugName)) {
    category = 'lab_report';
  } else if (isLeaflet && !ocrResult?.extractedFrequencyKey) {
    category = 'leaflet';
  } else if (isReport && !ocrResult?.detectedDrugName) {
    category = 'medical_report';
  }

  const extractedFields: Record<string, string> = {};
  if (ocrResult?.detectedDrugName && !cultureFindings.isCultureReport) {
    extractedFields.medicineName = ocrResult.detectedDrugName;
  }
  if (ocrResult?.extractedDoseText) {
    extractedFields.prescribedDose = ocrResult.extractedDoseText;
  }
  if (ocrResult?.extractedRoute) {
    extractedFields.route = ocrResult.extractedRoute;
  }
  if (ocrResult?.extractedFrequencyKey) {
    extractedFields.frequency = ocrResult.extractedFrequencyKey;
  }
  if (ocrResult?.extractedDurationDays !== null && ocrResult?.extractedDurationDays !== undefined) {
    extractedFields.durationDays = `${ocrResult.extractedDurationDays} days`;
  }
  if (ocrResult?.extractedNotes) {
    extractedFields.notes = ocrResult.extractedNotes;
  }

  // Extract common lab values if present in text
  const hbMatch = rawText.match(/(?:hb|hemoglobin|هيموجلوبين)[:\s]*(\d+(?:\.\d+)?)/i);
  if (hbMatch) extractedFields.hemoglobin = hbMatch[1];
  const wbcMatch = rawText.match(/(?:wbc|كرات الدم البيضاء)[:\s]*(\d+(?:[.,]\d+)?)/i);
  if (wbcMatch) extractedFields.wbc = wbcMatch[1];
  const creatMatch = rawText.match(/(?:creatinine|كرياتينين)[:\s]*(\d+(?:\.\d+)?)/i);
  if (creatMatch) extractedFields.serumCreatinine = creatMatch[1];
  const crpMatch = rawText.match(/(?:crp|سي آر بي)[:\s]*(\d+(?:\.\d+)?)/i);
  if (crpMatch) extractedFields.crp = crpMatch[1];

  // Add Culture & Sensitivity fields if detected
  if (cultureFindings.organism) {
    extractedFields.cultureOrganism = cultureFindings.organism;
  }
  if (cultureFindings.sensitiveAntibiotics.length > 0) {
    extractedFields.cultureSensitiveS = cultureFindings.sensitiveAntibiotics.join('، ');
  }
  if (cultureFindings.resistantAntibiotics.length > 0) {
    extractedFields.cultureResistantR = cultureFindings.resistantAntibiotics.join('، ');
  }

  const categoryTitles: Record<MedicalDocumentCategory, { ar: string; en: string }> = {
    prescription: { ar: 'روشتة طبية', en: 'Medical Prescription' },
    lab_report: {
      ar: cultureFindings.isCultureReport ? 'تحليل مزرعة وحساسية مضادات (S/R)' : 'نتيجة تحليل معملي',
      en: cultureFindings.isCultureReport ? 'Culture & Sensitivity Report (S/R)' : 'Laboratory Result',
    },
    medical_report: { ar: 'تقرير طبي', en: 'Medical Report' },
    leaflet: { ar: 'نشرة دوائية', en: 'Medication Leaflet' },
    other: { ar: 'مستند صحي', en: 'Health Document' },
  };

  const titleAr = cultureFindings.isCultureReport
    ? `${categoryTitles.lab_report.ar}${cultureFindings.organism ? ` — ${cultureFindings.organism}` : ''}`
    : ocrResult?.detectedDrugName
      ? `${categoryTitles[category].ar} — ${ocrResult.detectedDrugName}`
      : `${categoryTitles[category].ar} (${sanitizeText(fileName, 40)})`;

  const titleEn = cultureFindings.isCultureReport
    ? `${categoryTitles.lab_report.en}${cultureFindings.organism ? ` — ${cultureFindings.organism}` : ''}`
    : ocrResult?.detectedDrugName
      ? `${categoryTitles[category].en} — ${ocrResult.detectedDrugName}`
      : `${categoryTitles[category].en} (${sanitizeText(fileName, 40)})`;

  const hasDrug = Boolean(ocrResult?.detectedDrugName);
  const unreadableCount = ocrResult?.unreadableFields?.length || 0;

  let summaryAr = '';
  let summaryEn = '';

  if (cultureFindings.isCultureReport) {
    const partsAr: string[] = ['🔬 ده تحليل مزرعة وحساسية للمضادات الحيوية!'];
    const partsEn: string[] = ['🔬 Culture & Sensitivity lab report detected.'];
    if (cultureFindings.organism) {
      partsAr.push(`الميكروب اللي طلع في المزرعة: (${cultureFindings.organism}).`);
      partsEn.push(`Isolated organism: (${cultureFindings.organism}).`);
    }
    if (cultureFindings.sensitiveAntibiotics.length > 0) {
      partsAr.push(
        `✅ المضادات الفعالة (Sensitive - S): ${cultureFindings.sensitiveAntibiotics.join('، ')}.`
      );
      partsEn.push(`✅ Sensitive (S): ${cultureFindings.sensitiveAntibiotics.join(', ')}.`);
    }
    if (cultureFindings.resistantAntibiotics.length > 0) {
      partsAr.push(
        `⛔ المضادات المقاومة اللي مش هتجيب نتيجة (Resistant - R): ${cultureFindings.resistantAntibiotics.join('، ')}.`
      );
      partsEn.push(`⛔ Resistant (R): ${cultureFindings.resistantAntibiotics.join(', ')}.`);
    }
    partsAr.push('اعرض النتيجة دي على دكتورك عشان يختارلك أنسب مضاد من قايمة الـ (S).');
    summaryAr = partsAr.join(' ');
    summaryEn = partsEn.join(' ');
  } else if (hasDrug) {
    summaryAr = `طلعتلك من الروشتة دواء «${ocrResult?.detectedDrugName}»${
      ocrResult?.extractedDoseText ? ` بجرعة/تركيز (${ocrResult.extractedDoseText})` : ' (الجرعة مش واضحة في الصورة)'
    }.${
      unreadableCount > 0
        ? ` في ${unreadableCount} خانات مش واضحة أوي، بص عليها وكملها قبل ما تدوس حفظ.`
        : ' كل البيانات الأساسية مقروءة وجاهزة لمراجعتك.'
    }`;
    summaryEn = `Detected medication "${ocrResult?.detectedDrugName}"${
      ocrResult?.extractedDoseText ? ` (${ocrResult.extractedDoseText})` : ' (dose unclear)'
    }.${
      unreadableCount > 0
        ? ` ${unreadableCount} field(s) are missing or unclear and require your confirmation before saving.`
        : ' All primary fields were extracted and are ready for your review.'
    }`;
  } else if (rawText.trim()) {
    summaryAr = `قرأتلك النص اللي في المستند (${categoryTitles[category].ar}). راجع البيانات المستخرجة وأكدها قبل الحفظ.`;
    summaryEn = `Extracted text from ${categoryTitles[category].en}. Please review and confirm before saving.`;
  } else {
    summaryAr =
      'مقدرتش أقرأ نص واضح تلقائياً من الصورة دي. تقدر تكتب أو تعدل البيانات بإيدك في الكارت تحت قبل ما تحفظ المستند في ملفك.';
    summaryEn =
      'Automated OCR could not read clear text from this image. You can manually fill or edit the fields before saving.';
  }

  return {
    category,
    titleAr,
    titleEn,
    summaryAr,
    summaryEn,
    extractedFields,
  };
}

/**
 * Analyzes an uploaded image or document using Vision/OCR and prepares a structured preview
 * without saving anything until the patient explicitly confirms.
 */
export async function analyzeUploadedMedicalDocument(params: {
  base64Data: string;
  previewDataUrl?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  lang: Lang;
  forcedCategory?: MedicalDocumentCategory;
}): Promise<ProcessedMedicalDocumentAnalysis> {
  const ocrResult = await analyzePrescriptionImageWithVision(
    params.base64Data,
    params.mimeType,
    params.lang,
    params.fileName
  );

  // Also check if Gemini Vision can extract multi-drug lines or Culture S/R tables when an API key is configured
  let multiText = ocrResult.rawExtractedText || '';
  const apiKey = getApiKey();
  if (apiKey && (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.') || apiKey.length > 20) && params.mimeType.startsWith('image/')) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'List every medication, lab value (e.g. Creatinine, WBC, CRP, Hemoglobin), or Culture & Sensitivity result (Organism name, Sensitive S antibiotics, Resistant R antibiotics) visible in this image on separate lines. Never guess or invent unreadable values.',
                },
                {
                  inlineData: {
                    mimeType: params.mimeType,
                    data: params.base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.05, maxOutputTokens: 500 },
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const extra = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (extra) {
          multiText = `${multiText}\n${extra}`.trim();
        }
      }
    } catch {
      // Ignore vision enhancement error and rely on deterministic OCR result
    }
  }

  const docMeta = classifyAndSummarizeDocumentText(multiText, params.fileName, ocrResult);
  const effectiveCategory = params.forcedCategory || docMeta.category;

  const multiItems =
    effectiveCategory === 'lab_report' && docMeta.extractedFields.cultureSensitiveS
      ? []
      : extractMultiplePrescriptionItemsFromText(multiText, params.fileName);

  const extractedPrescriptions: AddPrescriptionItemArgs[] =
    multiItems.length > 0
      ? multiItems
      : effectiveCategory === 'lab_report' && !ocrResult.detectedDrugName
        ? []
        : [
            {
              ...(ocrResult.matchedIngredientId ? { antibioticId: ocrResult.matchedIngredientId } : {}),
              medicineName: ocrResult.detectedDrugName || '',
              prescribedDose: ocrResult.extractedDoseText || '',
              route: ocrResult.extractedRoute || '',
              frequency: ocrResult.extractedFrequencyKey || '',
              durationDays: ocrResult.extractedDurationDays,
              ...(ocrResult.extractedNotes ? { notes: ocrResult.extractedNotes } : {}),
              ...(ocrResult.extractedCoMeds.length > 0
                ? { coMedications: ocrResult.extractedCoMeds }
                : {}),
              captureMethod: 'ocr_upload',
              isOcrUnverified: true,
              rawExtractedText: ocrResult.rawExtractedText,
              imageFileName: params.fileName,
              unreadableFields: ocrResult.unreadableFields,
              createScheduleAlso: false,
            },
          ];

  return {
    title: params.lang === 'ar' ? docMeta.titleAr : docMeta.titleEn,
    category: effectiveCategory,
    fileName: params.fileName,
    mimeType: params.mimeType,
    fileSize: params.fileSize,
    previewDataUrl: params.previewDataUrl,
    base64Data: params.base64Data,
    extractedSummaryAr: docMeta.summaryAr,
    extractedSummaryEn: docMeta.summaryEn,
    extractedFields: docMeta.extractedFields,
    unreadableFields: ocrResult.unreadableFields,
    contradictionWarnings: ocrResult.contradictionWarnings,
    extractedPrescriptions,
    isUnclearOrIncomplete:
      (effectiveCategory === 'prescription' && !ocrResult.detectedDrugName) ||
      ocrResult.unreadableFields.length > 0 ||
      ocrResult.contradictionWarnings.length > 0,
  };
}

/**
 * Uploads the medical document binary/base64 to Firebase Storage under
 * `/patient_documents/{uid}/{docId}_{sanitizedFileName}`.
 * Never fabricates success if Firebase Storage is unconfigured or fails.
 */
export async function uploadMedicalDocumentToStorage(params: {
  uid: string | null;
  docId: string;
  fileName: string;
  mimeType: string;
  base64Data?: string;
  rawFile?: File;
}): Promise<StorageUploadOutcome> {
  if (!params.uid) {
    return {
      uploadedToCloud: false,
      errorAr: 'وضع الزائر (من غير تسجيل دخول): حفظتلك المعاينة والبيانات محلياً على جهازك ده بس.',
      errorEn: 'Guest mode (not signed in): Preview and structured record saved locally on this device only.',
    };
  }

  if (!configured || !storage) {
    return {
      uploadedToCloud: false,
      errorAr:
        'خدمة Firebase Storage مش مفعّلة في الإعدادات حالياً — حفظتلك البيانات المهيكلة والمعاينة المضغوطة في حسابك بـ Firestore.',
      errorEn:
        'Firebase Storage is not configured in environment variables — structured record and compressed preview saved to your Firestore profile.',
    };
  }

  const safeName = (params.fileName || 'document.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `patient_documents/${params.uid}/${params.docId}_${safeName}`;

  try {
    const fileRef = ref(storage, storagePath);
    if (params.rawFile) {
      await uploadBytes(fileRef, params.rawFile, { contentType: params.mimeType });
    } else if (params.base64Data) {
      await uploadString(fileRef, params.base64Data, 'base64', { contentType: params.mimeType });
    } else {
      return {
        uploadedToCloud: false,
        errorAr: 'مفيش بيانات ملف صالحة للرفع على السحابة.',
        errorEn: 'No file binary data available to upload.',
      };
    }
    const downloadUrl = await getDownloadURL(fileRef);
    return {
      uploadedToCloud: true,
      storagePath,
      downloadUrl,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      uploadedToCloud: false,
      errorAr: `معرفتش أرفع الملف الأصلي على Firebase Storage (${errMsg})، بس متقلقش حفظتلك كل البيانات المستخرجة في ملفك.`,
      errorEn: `Failed to upload original file to Firebase Storage (${errMsg}). Extracted structured data is preserved.`,
    };
  }
}
