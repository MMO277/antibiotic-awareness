/**
 * aiDocumentProcessor.ts
 *
 * Medical Image & Document Upload, Validation, Compression, Multi-Medication OCR Extraction,
 * and Secure Firebase Storage Service for the Antibiotic Awareness Personal Health Assistant.
 *
 * Safety & Security Principles:
 * - Validates MIME types (JPEG, PNG, WEBP, PDF) and enforces an 8 MB ceiling.
 * - Rejects executable/script/HTML files and path-traversal filenames.
 * - Compresses images client-side before OCR and Storage upload.
 * - Extracts single or multiple medications from a prescription without EVER inventing
 *   a missing dose, strength, frequency, route, or duration.
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
      errorAr: '⛔ نوع الملف غير مسموح به أمنياً. يُسمح فقط بصور الروشتات والتقارير (JPG, PNG, WEBP) أو ملفات PDF.',
      errorEn: '⛔ Unsafe file type blocked. Only medical images (JPG, PNG, WEBP) or PDF documents are allowed.',
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
      errorAr: '⚠️ صيغة الملف غير مدعومة. يرجى اختيار صورة واضحة (JPG أو PNG أو WEBP) أو مستند PDF.',
      errorEn: '⚠️ Unsupported file format. Please select a clear image (JPG, PNG, WEBP) or PDF document.',
    };
  }

  if (typeof file.size !== 'number' || file.size <= 0) {
    return {
      valid: false,
      sanitizedFileName: safeName,
      mimeType: inferredMime,
      errorAr: '⚠️ الملف المرفق فارغ أو غير صالح.',
      errorEn: '⚠️ The selected file is empty or invalid.',
    };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      sanitizedFileName: safeName,
      mimeType: inferredMime,
      errorAr: '⚠️ حجم الملف يتجاوز الحد الأقصى المسموح به (8 ميجابايت). يرجى اختيار صورة أصغر حجماً.',
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

  // Split by explicit RX blocks or numbered lines if multiple medications exist
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

  const isLab =
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
  if (isLab && !ocrResult?.detectedDrugName) category = 'lab_report';
  else if (isLeaflet && !ocrResult?.extractedFrequencyKey) category = 'leaflet';
  else if (isReport && !ocrResult?.detectedDrugName) category = 'medical_report';

  const extractedFields: Record<string, string> = {};
  if (ocrResult?.detectedDrugName) {
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

  const categoryTitles: Record<MedicalDocumentCategory, { ar: string; en: string }> = {
    prescription: { ar: 'روشتة طبية', en: 'Medical Prescription' },
    lab_report: { ar: 'نتيجة تحليل معملي', en: 'Laboratory Result' },
    medical_report: { ar: 'تقرير طبي', en: 'Medical Report' },
    leaflet: { ar: 'نشرة دوائية', en: 'Medication Leaflet' },
    other: { ar: 'مستند صحي', en: 'Health Document' },
  };

  const titleAr = ocrResult?.detectedDrugName
    ? `${categoryTitles[category].ar} — ${ocrResult.detectedDrugName}`
    : `${categoryTitles[category].ar} (${sanitizeText(fileName, 40)})`;
  const titleEn = ocrResult?.detectedDrugName
    ? `${categoryTitles[category].en} — ${ocrResult.detectedDrugName}`
    : `${categoryTitles[category].en} (${sanitizeText(fileName, 40)})`;

  const hasDrug = Boolean(ocrResult?.detectedDrugName);
  const unreadableCount = ocrResult?.unreadableFields?.length || 0;

  const summaryAr = hasDrug
    ? `تم رصد دواء «${ocrResult?.detectedDrugName}»${
        ocrResult?.extractedDoseText ? ` بتركيز/جرعة (${ocrResult.extractedDoseText})` : ' (الجرعة غير واضحة)'
      }.${
        unreadableCount > 0
          ? ` توجد ${unreadableCount} حقول غير مكتملة أو غير واضحة تتطلب مراجعتك وتأكيدك قبل الحفظ.`
          : ' جميع الحقول الأساسية مقروءة وجاهزة لمراجعتك.'
      }`
    : rawText.trim()
      ? `تم استخراج نص من المستند (${categoryTitles[category].ar}). يرجى مراجعة البيانات المستخرجة وتأكيدها قبل الحفظ.`
      : `لم يتمكن الـ OCR من قراءة نص واضح تلقائياً من هذه الصورة. يمكنك إدخال أو تعديل البيانات يدوياً قبل حفظ المستند في حسابك.`;

  const summaryEn = hasDrug
    ? `Detected medication "${ocrResult?.detectedDrugName}"${
        ocrResult?.extractedDoseText ? ` (${ocrResult.extractedDoseText})` : ' (dose unclear)'
      }.${
        unreadableCount > 0
          ? ` ${unreadableCount} field(s) are missing or unclear and require your confirmation before saving.`
          : ' All primary fields were extracted and are ready for your review.'
      }`
    : rawText.trim()
      ? `Extracted text from ${categoryTitles[category].en}. Please review and confirm before saving.`
      : `Automated OCR could not read clear text from this image. You can manually fill or edit the fields before saving.`;

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

  // Also check if Gemini Vision can extract multi-drug lines when an API key is configured
  let multiText = ocrResult.rawExtractedText || '';
  const apiKey = getApiKey();
  if (apiKey && apiKey.startsWith('AIza') && params.mimeType.startsWith('image/')) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'List every medication, lab value, or medical finding visible in this image on separate lines. Never guess or invent unreadable values.',
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
          generationConfig: { temperature: 0.05, maxOutputTokens: 400 },
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

  const multiItems = extractMultiplePrescriptionItemsFromText(multiText, params.fileName);
  const extractedPrescriptions: AddPrescriptionItemArgs[] =
    multiItems.length > 0
      ? multiItems
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

  const docMeta = classifyAndSummarizeDocumentText(multiText, params.fileName, ocrResult);
  const effectiveCategory = params.forcedCategory || docMeta.category;

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
      !ocrResult.detectedDrugName ||
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
      errorAr: 'وضع الزائر (بدون تسجيل دخول): تم حفظ المعاينة والبيانات محلياً على هذا الجهاز فقط.',
      errorEn: 'Guest mode (not signed in): Preview and structured record saved locally on this device only.',
    };
  }

  if (!configured || !storage) {
    return {
      uploadedToCloud: false,
      errorAr:
        'خدمة Firebase Storage غير مفعّلة في متغيرات البيئة الحالية — تم حفظ البيانات المهيكلة والمعاينة المضغوطة في حسابك بـ Firestore.',
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
        errorAr: 'لا توجد بيانات ملف صالحة للرفع إلى السحابة.',
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
      errorAr: `تعذر رفع الملف الأصلي إلى Firebase Storage (${errMsg}). لم يتم فقدان البيانات المستخرجة.`,
      errorEn: `Failed to upload original file to Firebase Storage (${errMsg}). Extracted structured data is preserved.`,
    };
  }
}
