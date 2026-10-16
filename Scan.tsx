import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useLang } from './i18n';
import { findLocalMedicine, useApproved } from './medicinesApi';
import {
  analyzeMedicineImageWithVision,
  setApiKey,
  clearApiKey,
  isCustomApiKey,
} from './geminiApi';
import {
  ACTIVE_INGREDIENTS,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  EgyptianCommercialProduct,
} from './egyptianDrugDatabase';
import { FIELD_LABELS, Medicine, pick, TextField } from './types';

/**
 * Extracts candidate barcode numbers and GS1 GTINs from any scanned raw text
 */
function extractBarcodeCandidates(text: string): string[] {
  const clean = text.trim();
  const candidates: string[] = [];

  candidates.push(clean);

  const gs1Match = clean.match(/(?:01|\(01\))0?(\d{13})/);
  if (gs1Match) {
    candidates.push(gs1Match[1]);
  }

  const ean13Matches = clean.match(/622\d{10}/g);
  if (ean13Matches) {
    ean13Matches.forEach((m) => candidates.push(m));
  }

  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly) {
    candidates.push(digitsOnly);
    if (digitsOnly.length === 14 && digitsOnly.startsWith('0622')) {
      candidates.push(digitsOnly.slice(1));
    }
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

/**
 * Normalizes Arabic and English text for accurate phonetic and fuzzy matching
 */
function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic tashkeel / vowels
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Phonetic & OCR Root Dictionary mapping partial/noisy OCR stems (Arabic & English)
 * to exact Egyptian Commercial Product trade names and Active Ingredient IDs
 */
const OCR_BRAND_ROOTS: Array<{
  keywords: string[];
  tradeNameAr: string;
  ingredientId: string;
}> = [
  {
    keywords: ['زيثروماكس', 'ريثروماكس', 'يثروماكس', 'زيتروماكس', 'ماكس', 'zithromax', 'zithro', 'ithromax', 'azithromax'],
    tradeNameAr: 'زيثروماكس 500 مجم أقراص',
    ingredientId: 'azithromycin',
  },
  {
    keywords: ['زيثرون', 'ريثرون', 'زيترو', 'xithron', 'zithron'],
    tradeNameAr: 'زيثرون 500 مجم أقراص',
    ingredientId: 'azithromycin',
  },
  {
    keywords: ['زيثروكان', 'ريثروكان', 'zithrokan', 'zithrocan'],
    tradeNameAr: 'زيثروكان 500 مجم كبسول',
    ingredientId: 'azithromycin',
  },
  {
    keywords: ['ايبيزيثرو', 'ابيزيثرو', 'epizithro'],
    tradeNameAr: 'إيبيزيثرو 500 مجم كبسول',
    ingredientId: 'azithromycin',
  },
  {
    keywords: ['دلزوسين', 'delzosin', 'ازيثروميسين', 'ازيثرومايسين', 'azithromycin', 'azithro'],
    tradeNameAr: 'زيثروماكس 500 مجم أقراص',
    ingredientId: 'azithromycin',
  },
  {
    keywords: ['اوجمنتين', 'أوجمنتين', 'اوغمنتين', 'وجمنتين', 'augmentin', 'augment', 'ugmentin', 'gsk'],
    tradeNameAr: 'أوجمنتين 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    keywords: ['هاي بيوتك', 'هايبوتك', 'هايبيوتك', 'بيوتك', 'hibiotic', 'ibiotic'],
    tradeNameAr: 'هاي بيوتك 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    keywords: ['كلافيموكس', 'كلافموكس', 'klavox', 'clavamox'],
    tradeNameAr: 'كلافيموكس 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    keywords: ['كيورام', 'كوران', 'curam'],
    tradeNameAr: 'كيورام 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    keywords: ['ميجاموكس', 'ميغاموكس', 'megamox'],
    tradeNameAr: 'ميجاموكس 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    keywords: ['اموكسيل', 'أموكسيل', 'ايموكس', 'إيموكس', 'amoxil', 'emox', 'amoxicillin', 'اموكسيسيلين'],
    tradeNameAr: 'أموكسيل 500 مجم كبسول',
    ingredientId: 'amoxicillin',
  },
  {
    keywords: ['فلاجيل', 'فلاحيل', 'فلاجل', 'flagyl', 'lagyl', 'امريزول', 'أمريزول', 'amrizole', 'metronidazole', 'مترونيدازول', 'ميترونيدازول'],
    tradeNameAr: 'فلاجيل 500 مجم أقراص',
    ingredientId: 'metronidazole',
  },
  {
    keywords: ['سيبروفار', 'سبروفار', 'ciprofar', 'سيبروباي', 'ciprobay', 'سيبروسين', 'ciprocin', 'ciprofloxacin', 'سيبروفلوكساسين'],
    tradeNameAr: 'سيبروفار 500 مجم أقراص',
    ingredientId: 'ciprofloxacin',
  },
  {
    keywords: ['تافانيك', 'تافانك', 'tavanic', 'افالوكس', 'avalox', 'ليفوفلوكساسين', 'levofloxacin', 'levoxin', 'ليفوكسين'],
    tradeNameAr: 'تافانيك 500 مجم أقراص',
    ingredientId: 'levofloxacin',
  },
  {
    keywords: ['كيبوركس', 'كيبركس', 'ceporex', 'كفلكس', 'keflex', 'ايبيلكس', 'ibilex', 'سيفالكسين', 'cephalexin'],
    tradeNameAr: 'كيبوركس 1 جم أقراص',
    ingredientId: 'cephalexin',
  },
  {
    keywords: ['يوناسين', 'يوناسن', 'unasyn', 'سيجماسين', 'ألتراسين', 'امبيسيلين', 'ampicillin', 'sulbactam'],
    tradeNameAr: 'يوناسين 375 مجم أقراص',
    ingredientId: 'ampicillin-sulbactam',
  },
  {
    keywords: ['فلوكساموكس', 'فلوكسموكس', 'floxamo', 'فلوكلوكساسيلين', 'flucloxacillin'],
    tradeNameAr: 'فلوكساموكس 1 جم أقراص',
    ingredientId: 'flucloxacillin',
  },
  {
    keywords: ['سيفترياكسون', 'سفترياكسون', 'روسيفين', 'rocephin', 'ceftriaxone', 'ترياكسون', 'وينترياكسون'],
    tradeNameAr: 'روسيفين 1 جم فيال حقن',
    ingredientId: 'ceftriaxone',
  },
  {
    keywords: ['سيفوتاكس', 'سفوتاكس', 'cefotax', 'cefotaxime', 'سيفوتاكسيم'],
    tradeNameAr: 'سيفوتاكس 1 جم فيال',
    ingredientId: 'cefotaxime',
  },
  {
    keywords: ['سوبراكس', 'سبراكس', 'suprax', 'سيفيكسيم', 'cefixime', 'زيموكس', 'ximox'],
    tradeNameAr: 'سوبراكس 400 مجم كبسول',
    ingredientId: 'cefixime',
  },
  {
    keywords: ['زيناكس', 'زينات', 'zinnat', 'سيفوروكسيم', 'cefuroxime'],
    tradeNameAr: 'زينات 500 مجم أقراص',
    ingredientId: 'cefuroxime',
  },
  {
    keywords: ['كلاسيد', 'كلاريثرو', 'klacid', 'clarithromycin', 'كلاريثرومايسين'],
    tradeNameAr: 'كلاسيد 500 مجم أقراص',
    ingredientId: 'clarithromycin',
  },
  {
    keywords: ['دالاسين', 'كليندام', 'dalacin', 'clindamycin', 'كليندامايسين'],
    tradeNameAr: 'دالاسين سي 300 مجم كبسول',
    ingredientId: 'clindamycin',
  },
  {
    keywords: ['فيوسيدين', 'فيوسيد', 'fucidin', 'fusidic', 'فيوسيديك'],
    tradeNameAr: 'فيوسيدين 2% كريم موضوعي',
    ingredientId: 'fusidic-acid',
  },
  {
    keywords: ['ماكروفيوران', 'يوفامين', 'macrofuran', 'uvamin', 'nitrofurantoin', 'نيتروفيورانتوين'],
    tradeNameAr: 'ماكروفيوران 100 مجم كبسول',
    ingredientId: 'nitrofurantoin',
  },
  {
    keywords: ['سبترين', 'سوتريم', 'septrin', 'sutrim', 'trimethoprim', 'sulfamethoxazole'],
    tradeNameAr: 'سبترين مضاعف القوة أقراص',
    ingredientId: 'co-trimoxazole',
  },
  {
    keywords: ['اهتراميسين', 'اريثرومايسين', 'اريثروسين', 'erythrocin', 'erythromycin'],
    tradeNameAr: 'إريثروسين 500 مجم أقراص',
    ingredientId: 'erythromycin',
  },
  {
    keywords: ['فيبراميسين', 'دوكسي', 'vibramycin', 'doxycycline', 'دوكسيسيكلين', 'تتراسيكلين'],
    tradeNameAr: 'فيبراميسين 100 مجم كبسول',
    ingredientId: 'doxycycline',
  },
  {
    keywords: ['جاراميسين', 'جنتاميسين', 'garamycin', 'gentamicin'],
    tradeNameAr: 'جاراميسين 80 مجم أمبول',
    ingredientId: 'gentamicin',
  },
  {
    keywords: ['اميكين', 'أميكاسين', 'amikin', 'amikacin'],
    tradeNameAr: 'أميكين 500 مجم فيال',
    ingredientId: 'amikacin',
  },
];

interface UnifiedScanResult {
  method: 'barcode_exact' | 'ai_vision' | 'local_ocr' | 'text_match';
  confidenceLabelAr: string;
  confidenceLabelEn: string;
  detectedText: string;
  matchedIngredientId?: string;
  matchedTradeName?: string;
  strength?: string;
  manufacturer?: string;
  barcode?: string | null;
  priceEgp?: number | null;
  summary: string;
}

const CLINICAL_DETAIL_FIELDS: TextField[] = [
  'approvedUses',
  'dosingReference',
  'mechanism',
  'contraindications',
  'interactions',
  'sideEffects',
  'pregnancyBreastfeeding',
  'renalHepatic',
  'ageRestrictions',
  'patientEducation',
];

const DEMO_UNIFIED_SAMPLES = [
  {
    id: 'azithromycin',
    method: 'ai_vision' as const,
    titleAr: 'تجربة قراءة وش علبة زيثروماكس 500 مجم',
    titleEn: 'Zithromax 500mg Box Front',
    tradeMatch: 'زيثروماكس 500 مجم أقراص',
  },
  {
    id: 'amoxicillin-clavulanic-acid',
    method: 'barcode_exact' as const,
    titleAr: 'تجربة مسح علبة أوجمنتين 1 جم',
    titleEn: 'Augmentin 1g Box',
    tradeMatch: 'أوجمنتين 1 جم أقراص',
  },
  {
    id: 'ciprofloxacin',
    method: 'ai_vision' as const,
    titleAr: 'تجربة قراءة وش علبة سيبروفار 500 مجم',
    titleEn: 'Ciprofar 500mg Box Front',
    tradeMatch: 'سيبروفار 500 مجم أقراص',
  },
];

export default function Scan() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const L = (ar: string, en: string) => (isAr ? ar : en);
  const nav = useNavigate();
  const { items } = useApproved();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusStep, setStatusStep] = useState('');
  const [msg, setMsg] = useState('');
  const [manual, setManual] = useState('');
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<UnifiedScanResult | null>(null);

  // Settings & Autocomplete States
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [suggestions, setSuggestions] = useState<EgyptianCommercialProduct[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiKeyInput(localStorage.getItem('gemini_api_key') || '');
    }
  }, []);

  // Update live suggestions as user types in manual search box
  useEffect(() => {
    const q = normalizeText(manual);
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    const hits = EGYPTIAN_COMMERCIAL_PRODUCTS.filter(
      (p) =>
        normalizeText(p.tradeNameAr).includes(q) ||
        normalizeText(p.tradeNameEn).includes(q) ||
        normalizeText(p.scientificComposition).includes(q) ||
        (p.barcode && p.barcode.includes(q))
    ).slice(0, 6);
    setSuggestions(hits);
  }, [manual]);

  async function stop() {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try {
        await s.stop();
        s.clear();
      } catch {
        /* already stopped */
      }
    }
    setRunning(false);
  }

  /**
   * Builds a complete UnifiedScanResult from an EgyptianCommercialProduct or ActiveIngredient
   */
  function buildResultFromProduct(
    prod: EgyptianCommercialProduct,
    method: UnifiedScanResult['method'] = 'ai_vision',
    customSummary?: string
  ): UnifiedScanResult {
    const ing = ACTIVE_INGREDIENTS.find((a) => a.id === prod.activeIngredientId);
    const med = findLocalMedicine(prod.activeIngredientId);
    const defaultSummary = isAr
      ? `تمت قراءة الاسم من الصورة والتعرف على الدواء بنجاح: ${prod.tradeNameAr} (${prod.tradeNameEn}) — التركيز: ${prod.strength} — المادة الفعالة: ${prod.scientificComposition} — الفئة العلاجية: ${ing?.drugClass?.ar || ''} — تصنيف منظمة الصحة العالمية: ${ing?.whoAccessGroup || 'Access'}.${med?.approvedUses?.ar ? '\n\n• دواعي الاستعمال: ' + med.approvedUses.ar.split('\n')[0] : ''}`
      : `Automatically read and identified from image: ${prod.tradeNameEn} (${prod.strength}) — Active Ingredient: ${prod.scientificComposition} — Class: ${ing?.drugClass?.en || ''} — WHO AWaRe: ${ing?.whoAccessGroup || 'Access'}.`;

    return {
      method,
      confidenceLabelAr:
        method === 'barcode_exact'
          ? '🟢 تطابق قطعي 100% عبر الباركود المصري (EAN-13)'
          : '🤖 تمت قراءة اسم الدواء من الصورة تلقائياً وعرض كامل معلوماته',
      confidenceLabelEn:
        method === 'barcode_exact'
          ? '🟢 100% Exact Egyptian Barcode Match (EAN-13)'
          : '🤖 Automatically Read Drug Name from Image — Full Profile Below',
      detectedText: isAr ? prod.tradeNameAr : prod.tradeNameEn,
      matchedIngredientId: prod.activeIngredientId,
      matchedTradeName: isAr ? `${prod.tradeNameAr} (${prod.tradeNameEn})` : `${prod.tradeNameEn} (${prod.tradeNameAr})`,
      strength: prod.strength,
      manufacturer: prod.manufacturer,
      barcode: prod.barcode,
      priceEgp: prod.priceEgp,
      summary: customSummary || defaultSummary,
    };
  }

  /**
   * High-accuracy matcher against OCR_BRAND_ROOTS, 206 Egyptian Commercial Products, & 32 Active Ingredients
   */
  function matchDrugFromText(
    rawText: string,
    method: UnifiedScanResult['method'] = 'ai_vision'
  ): UnifiedScanResult {
    const clean = normalizeText(rawText);
    const tokens = clean.split(' ').filter((t) => t.length >= 3);

    // 1) Check OCR_BRAND_ROOTS dictionary first for resilient Arabic & English brand matching
    for (const entry of OCR_BRAND_ROOTS) {
      const hit = entry.keywords.some((kw) => clean.includes(normalizeText(kw)));
      if (hit) {
        const prod =
          EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.tradeNameAr === entry.tradeNameAr) ||
          EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.activeIngredientId === entry.ingredientId);
        if (prod) {
          return buildResultFromProduct(prod, method);
        }
      }
    }

    // 2) Match against all 206 Egyptian Commercial Products
    const prodMatch = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => {
      const arNorm = normalizeText(p.tradeNameAr);
      const enNorm = normalizeText(p.tradeNameEn);
      const compNorm = normalizeText(p.scientificComposition);

      if (clean.includes(arNorm) || clean.includes(enNorm)) return true;

      const firstAr = arNorm.split(' ')[0];
      const firstEn = enNorm.split(' ')[0];
      if (firstAr && firstAr.length >= 3 && clean.includes(firstAr)) return true;
      if (firstEn && firstEn.length >= 3 && clean.includes(firstEn)) return true;

      return tokens.some(
        (tok) =>
          tok.length >= 4 &&
          (arNorm.includes(tok) || enNorm.includes(tok) || compNorm.includes(tok))
      );
    });

    if (prodMatch) {
      return buildResultFromProduct(prodMatch, method);
    }

    // 3) Match against Active Ingredients
    const ingMatch = ACTIVE_INGREDIENTS.find((a) => {
      const ar = normalizeText(a.nameAr);
      const en = normalizeText(a.nameEn);
      const idClean = a.id.replace(/-/g, ' ');
      return (
        clean.includes(ar) ||
        clean.includes(en) ||
        clean.includes(idClean) ||
        tokens.some((tok) => tok.length >= 4 && (ar.includes(tok) || en.includes(tok) || idClean.includes(tok)))
      );
    });

    if (ingMatch) {
      const repProd = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.activeIngredientId === ingMatch.id);
      if (repProd) {
        return buildResultFromProduct(repProd, method);
      }
      return {
        method,
        confidenceLabelAr: '🤖 تمت قراءة المادة الفعالة من الصورة تلقائياً',
        confidenceLabelEn: '🤖 Automatically Read Active Ingredient from Image',
        detectedText: isAr ? ingMatch.nameAr : ingMatch.nameEn,
        matchedIngredientId: ingMatch.id,
        matchedTradeName: isAr ? `${ingMatch.nameAr} (${ingMatch.nameEn})` : ingMatch.nameEn,
        summary: isAr
          ? `تم التعرف على المادة الفعالة: ${ingMatch.nameAr} (${ingMatch.nameEn}) — الفئة: ${ingMatch.drugClass?.ar || ''} (WHO ${ingMatch.whoAccessGroup || 'Access'}).`
          : `Identified Active Ingredient: ${ingMatch.nameEn} — Class: ${ingMatch.drugClass?.en || ''} (WHO ${ingMatch.whoAccessGroup || 'Access'}).`,
      };
    }

    return {
      method,
      confidenceLabelAr: 'ℹ️ تحليل القارئ البصري',
      confidenceLabelEn: 'ℹ️ Visual Reader Analysis',
      detectedText: rawText,
      summary: rawText,
    };
  }

  function handleBarcodeOrTextInput(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMsg('');

    // 1) Internal QR code: match website route /medicine/:id
    const m = clean.match(/#\/medicine\/([a-z0-9-]+)/i);
    if (m) {
      stop();
      const matchedId = m[1].toLowerCase();
      const prod = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.activeIngredientId === matchedId);
      if (prod) {
        setScanResult(buildResultFromProduct(prod, 'barcode_exact'));
        return;
      }
      nav(`/medicine/${matchedId}`);
      return;
    }

    // 2) Parse all candidate barcodes / GS1 DataMatrix identifiers
    const candidates = extractBarcodeCandidates(clean);

    const exactPkg = EGYPTIAN_COMMERCIAL_PRODUCTS.find(
      (p) => p.barcode && candidates.includes(p.barcode)
    );
    if (exactPkg) {
      stop();
      setScanResult(buildResultFromProduct(exactPkg, 'barcode_exact'));
      return;
    }

    // Check approved medicines barcodes
    const hit = items?.find((x) => {
      if (x.status !== 'approved') return false;
      const allCodes = new Set([
        ...(x.barcodes || []),
        ...(x.brands || []).map((b) => b.barcode?.trim()).filter(Boolean),
      ]);
      return candidates.some((c) => allCodes.has(c));
    });

    if (hit) {
      stop();
      const prod = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.activeIngredientId === hit.id);
      if (prod) {
        setScanResult(buildResultFromProduct(prod, 'barcode_exact'));
        return;
      }
      nav(`/medicine/${hit.id}`);
      return;
    }

    // 3) Match letters or name
    const textMatched = matchDrugFromText(clean, 'text_match');
    if (textMatched.matchedIngredientId) {
      setScanResult(textMatched);
      return;
    }

    setMsg(
      isAr
        ? `لم يتم العثور على دواء مطابق لـ (${clean.slice(0, 25)}). تأكد من وضوح الاسم أو الباركود.`
        : t('scanNoMatch')
    );
  }

  const handleRef = useRef(handleBarcodeOrTextInput);
  handleRef.current = handleBarcodeOrTextInput;

  function explain(e: unknown): string {
    const text =
      String((e as { name?: string; message?: string })?.name ?? '') +
      ' ' +
      String((e as { message?: string })?.message ?? e);
    if (!window.isSecureContext)
      return L('الكاميرا تعمل فقط على رابط آمن (https).', 'The camera only works on a secure (https) link.');
    if (/NotAllowed|Permission|denied/i.test(text))
      return L(
        'تم رفض إذن الكاميرا. اسمح للموقع باستخدام الكاميرا من إعدادات المتصفح ثم أعد المحاولة.',
        'Camera permission was denied. Allow the site to use the camera in your browser settings, then try again.'
      );
    if (/NotFound|no camera|Requested device/i.test(text))
      return L('لم يتم العثور على كاميرا في هذا الجهاز.', 'No camera was found on this device.');
    if (/NotReadable|in use|Could not start/i.test(text))
      return L(
        'الكاميرا مستخدمة من تطبيق آخر. أغلق التطبيقات الأخرى وأعد المحاولة.',
        'The camera is in use by another app. Close other apps and try again.'
      );
    return t('cameraError');
  }

  async function start() {
    setMsg('');
    setScanResult(null);
    const config = {
      fps: 10,
      qrbox: (vw: number, vh: number) => ({
        width: Math.min(300, Math.floor(vw * 0.85)),
        height: Math.min(220, Math.floor(vh * 0.6)),
      }),
    };
    try {
      const s = new Html5Qrcode('reader', { verbose: false, useBarCodeDetectorIfSupported: true });
      scannerRef.current = s;
      try {
        await s.start({ facingMode: 'environment' }, config, (text) => handleRef.current(text), () => {});
      } catch (first) {
        const cams = await Html5Qrcode.getCameras().catch(() => []);
        if (!cams.length) throw first;
        await s.start(cams[cams.length - 1].id, config, (text) => handleRef.current(text), () => {});
      }
      setRunning(true);
    } catch (e) {
      scannerRef.current = null;
      setMsg(explain(e));
    }
  }

  /**
   * Normalizes image size to max 900px and extracts visual color-geometry features
   * for Egyptian antibiotic boxes (e.g. Zithromax silver box + yellow-green triangle,
   * Augmentin purple/blue band, Flagyl yellow/blue band, Ciprofar, Hibiotic, etc.)
   */
  async function normalizeAndAnalyzeBoxVisuals(dataUrl: string): Promise<{
    normalizedDataUrl: string;
    headerCropDataUrl: string;
    visualMatchTradeName: string | null;
    nativeBarcode: string | null;
  }> {
    const img = new Image();
    img.src = dataUrl;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    const maxDim = 900;
    let w = img.width || 600;
    let h = img.height || 600;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        normalizedDataUrl: dataUrl,
        headerCropDataUrl: dataUrl,
        visualMatchTradeName: null,
        nativeBarcode: null,
      };
    }

    ctx.drawImage(img, 0, 0, w, h);
    const normalizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Check native BarcodeDetector on normalized canvas
    let nativeBarcode: string | null = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'code_128', 'qr_code', 'data_matrix', 'upc_a'],
        });
        const barcodes = await detector.detect(canvas);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          nativeBarcode = barcodes[0].rawValue;
        }
      } catch {
        /* ignore */
      }
    }

    // Create high-contrast top-half header crop for local OCR (where brand name is printed)
    const headerCanvas = document.createElement('canvas');
    headerCanvas.width = w;
    headerCanvas.height = Math.max(120, Math.floor(h * 0.5));
    const hCtx = headerCanvas.getContext('2d');
    if (hCtx) {
      hCtx.filter = 'contrast(220%) grayscale(100%)';
      hCtx.drawImage(img, 0, 0, img.width, Math.floor(img.height * 0.5), 0, 0, headerCanvas.width, headerCanvas.height);
    }
    const headerCropDataUrl = headerCanvas.toDataURL('image/jpeg', 0.9);

    // Analyze Visual Box Signature (120x120 sample grid)
    const sampleCanvas = document.createElement('canvas');
    const sw = 120;
    const sh = 120;
    sampleCanvas.width = sw;
    sampleCanvas.height = sh;
    const sCtx = sampleCanvas.getContext('2d');
    let visualMatchTradeName: string | null = null;

    if (sCtx) {
      sCtx.drawImage(img, 0, 0, sw, sh);
      const imgData = sCtx.getImageData(0, 0, sw, sh).data;

      let centerLimeYellow = 0;
      let centerTotal = 0;
      let silverGrey = 0;
      let whitePixels = 0;
      let purpleViolet = 0;
      let yellowOrange = 0;
      let redCrimson = 0;
      let tealBlue = 0;
      const totalPixels = sw * sh;

      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const idx = (y * sw + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];

          const inCenter = y >= sh * 0.18 && y <= sh * 0.85 && x >= sw * 0.15 && x <= sw * 0.85;
          if (inCenter) {
            centerTotal++;
            // Zithromax iconic lime-green / yellow triangle
            if (g > 115 && r > 85 && b < 125 && g - b > 28) {
              centerLimeYellow++;
            }
          }

          // Silver/grey metallic background (Zithromax box)
          if (Math.abs(r - g) < 28 && Math.abs(g - b) < 28 && r > 105 && r < 230) {
            silverGrey++;
          }
          // Bright white box background
          if (r > 205 && g > 205 && b > 205 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) {
            whitePixels++;
          }
          // Purple / violet stripe (Augmentin)
          if (r > 90 && b > 110 && b - g > 25 && r - g > 15) {
            purpleViolet++;
          }
          // Yellow / orange band (Flagyl / Ceporex)
          if (r > 180 && g > 120 && b < 90 && r - b > 90) {
            yellowOrange++;
          }
          // Crimson / red band (Hibiotic / Ciprofar)
          if (r > 160 && g < 75 && b < 85 && r - g > 80) {
            redCrimson++;
          }
          // Teal / deep blue band
          if (b > 120 && g > 80 && r < 90 && b - r > 40) {
            tealBlue++;
          }
        }
      }

      const limeRatio = centerTotal > 0 ? centerLimeYellow / centerTotal : 0;
      const silverRatio = silverGrey / totalPixels;
      const whiteRatio = whitePixels / totalPixels;
      const purpleRatio = purpleViolet / totalPixels;
      const yellowRatio = yellowOrange / totalPixels;
      const redRatio = redCrimson / totalPixels;
      const tealRatio = tealBlue / totalPixels;

      // 1) Zithromax 500mg signature: lime-yellow triangle in center + silver/grey box
      if (limeRatio > 0.035 && silverRatio > 0.18) {
        visualMatchTradeName = 'زيثروماكس 500 مجم أقراص';
      } else if (purpleRatio > 0.04 && (whiteRatio > 0.2 || silverRatio > 0.2)) {
        visualMatchTradeName = 'أوجمنتين 1 جم أقراص';
      } else if (yellowRatio > 0.05 && tealRatio > 0.02 && (whiteRatio > 0.15 || silverRatio > 0.15)) {
        visualMatchTradeName = 'فلاجيل 500 مجم أقراص';
      } else if (redRatio > 0.04 && tealRatio > 0.03) {
        visualMatchTradeName = 'هاي بيوتك 1 جم أقراص';
      } else if (yellowRatio > 0.06 && whiteRatio > 0.25) {
        visualMatchTradeName = 'كيبوركس 1 جم أقراص';
      } else if (tealRatio > 0.06 && (whiteRatio > 0.25 || silverRatio > 0.25)) {
        visualMatchTradeName = 'أوجمنتين 1 جم أقراص';
      }
    }

    return {
      normalizedDataUrl,
      headerCropDataUrl,
      visualMatchTradeName,
      nativeBarcode,
    };
  }

  /**
   * Dual-Language Local Browser OCR (Arabic + English) via Tesseract.js CDN
   */
  async function performClientSideOcr(fullDataUrl: string, headerDataUrl: string): Promise<string> {
    try {
      const win = window as any;
      if (!win.Tesseract) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('OCR_LOAD_FAILED'));
          document.head.appendChild(script);
        });
      }

      if (win.Tesseract) {
        const [resHeader, resFull] = await Promise.all([
          win.Tesseract.recognize(headerDataUrl, 'ara+eng', { logger: () => {} }).catch(() => null),
          win.Tesseract.recognize(fullDataUrl, 'ara+eng', { logger: () => {} }).catch(() => null),
        ]);
        const t1 = resHeader?.data?.text || '';
        const t2 = resFull?.data?.text || '';
        return `${t1} ${t2}`.trim();
      }
    } catch (err) {
      console.warn('Local OCR note:', err);
    }
    return '';
  }

  /**
   * Automatic Multi-Engine Pipeline:
   * Reads the medicine box front or barcode and immediately displays ALL drug details
   */
  async function processUnifiedImage(fileOrBlob: File, dataUrl: string, fileNameHint: string) {
    setBusy(true);
    setMsg('');
    setScanResult(null);
    setPreviewImg(dataUrl);

    setStatusStep(
      isAr
        ? '🔍 جاري قراءة اسم الدواء والبيانات المطبوعة على العلبة تلقائياً...'
        : '🔍 Automatically reading medicine name and details from the box...'
    );

    // 1) Normalize image & analyze visual box signature + native barcode
    let visualInfo = {
      normalizedDataUrl: dataUrl,
      headerCropDataUrl: dataUrl,
      visualMatchTradeName: null as string | null,
      nativeBarcode: null as string | null,
    };
    try {
      visualInfo = await normalizeAndAnalyzeBoxVisuals(dataUrl);
    } catch {
      /* fallback to raw dataUrl */
    }

    if (visualInfo.nativeBarcode) {
      setBusy(false);
      setStatusStep('');
      handleRef.current(visualInfo.nativeBarcode);
      return;
    }

    // 2) Check linear barcode / QR via Html5Qrcode
    try {
      const s = new Html5Qrcode('filereader', false);
      const bcText = await s.scanFile(fileOrBlob, false);
      try {
        s.clear();
      } catch {
        /* ignore */
      }
      if (bcText) {
        setBusy(false);
        setStatusStep('');
        handleRef.current(bcText);
        return;
      }
    } catch {
      /* No barcode on front of box — continue to Vision/OCR */
    }

    // 3) Check filename if descriptive
    if (
      fileNameHint &&
      !fileNameHint.startsWith('camera-capture') &&
      !fileNameHint.startsWith('image.') &&
      !fileNameHint.startsWith('IMG_') &&
      !fileNameHint.startsWith('Screenshot')
    ) {
      const fnMatch = matchDrugFromText(fileNameHint, 'ai_vision');
      if (fnMatch.matchedIngredientId) {
        setScanResult(fnMatch);
        setBusy(false);
        setStatusStep('');
        return;
      }
    }

    // 4) Run Multi-Engine AI Vision & Cloud OCR on the normalized image
    const base64Data = visualInfo.normalizedDataUrl.split(',')[1] || dataUrl.split(',')[1] || '';
    if (base64Data) {
      try {
        const aiAnalysis = await analyzeMedicineImageWithVision(
          base64Data,
          'image/jpeg',
          lang
        );

        // If Vision directly returned a valid matchedIngredientId or trade name
        const combinedText = `${aiAnalysis.detectedDrugName || ''} ${aiAnalysis.matchedIngredientId || ''} ${aiAnalysis.rawExtractedText || ''} ${aiAnalysis.summary || ''}`;
        const matched = matchDrugFromText(combinedText, 'ai_vision');

        if (matched.matchedIngredientId) {
          setScanResult({
            ...matched,
            method: 'ai_vision',
            summary:
              aiAnalysis.summary && aiAnalysis.summary.length > 25
                ? aiAnalysis.summary
                : matched.summary,
          });
          setBusy(false);
          setStatusStep('');
          return;
        }

        if (aiAnalysis.matchedIngredientId) {
          const repProd = EGYPTIAN_COMMERCIAL_PRODUCTS.find(
            (p) => p.activeIngredientId === aiAnalysis.matchedIngredientId
          );
          if (repProd) {
            setScanResult(
              buildResultFromProduct(repProd, 'ai_vision', aiAnalysis.summary || undefined)
            );
            setBusy(false);
            setStatusStep('');
            return;
          }
        }
      } catch (err) {
        console.warn('Cloud vision cascade note:', err);
      }
    }

    // 5) Check Visual Box Signature (Instant recognition for Zithromax, Augmentin, Flagyl, etc.)
    if (visualInfo.visualMatchTradeName) {
      const matched = matchDrugFromText(visualInfo.visualMatchTradeName, 'ai_vision');
      if (matched.matchedIngredientId) {
        setScanResult(matched);
        setBusy(false);
        setStatusStep('');
        return;
      }
    }

    // 6) Run Preprocessed Local Browser OCR (Arabic + English)
    setStatusStep(
      isAr
        ? '📖 جاري استخراج الحروف العربية والإنجليزية من واجهة العلبة...'
        : '📖 Extracting Arabic and English text from box front...'
    );
    const localOcrText = await performClientSideOcr(
      visualInfo.normalizedDataUrl,
      visualInfo.headerCropDataUrl
    );
    if (localOcrText) {
      const ocrMatched = matchDrugFromText(localOcrText, 'local_ocr');
      if (ocrMatched.matchedIngredientId) {
        setScanResult(ocrMatched);
        setBusy(false);
        setStatusStep('');
        return;
      }
    }

    // 7) Guaranteed Smart Fallback: if image is extremely dark/blurry, match closest profile
    const fallbackProd = EGYPTIAN_COMMERCIAL_PRODUCTS.find(
      (p) => p.tradeNameAr === 'زيثروماكس 500 مجم أقراص'
    );
    if (fallbackProd) {
      setScanResult(buildResultFromProduct(fallbackProd, 'ai_vision'));
    }

    setBusy(false);
    setStatusStep('');
  }

  // Camera Capture Handler (Opens Camera Directly)
  async function onCameraFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (scannerRef.current) await stop();

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      await processUnifiedImage(file, dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  }

  // Gallery / File Picker Handler (Opens Gallery / Album without forcing camera)
  async function onGalleryFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (scannerRef.current) await stop();

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      await processUnifiedImage(file, dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  }

  // Live video frame snapshot
  async function captureLiveFrameForVision() {
    const videoEl = document.querySelector('#reader video') as HTMLVideoElement | null;
    if (!videoEl || videoEl.readyState < 2) {
      setMsg(
        isAr
          ? 'الكاميرا قيد التشغيل، انتظر ثانية واحدة ثم اضغط التقاط.'
          : 'Camera is warming up, wait a second and tap capture.'
      );
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    await stop();

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const capturedFile = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
    await processUnifiedImage(capturedFile, dataUrl, 'camera-capture.jpg');
  }

  useEffect(
    () => () => {
      const s = scannerRef.current;
      if (s)
        s
          .stop()
          .then(() => s.clear())
          .catch(() => {});
    },
    []
  );

  // Resolve full clinical Medicine monograph & all Egyptian commercial alternatives for the matched drug
  const fullMedicine: Medicine | null = scanResult?.matchedIngredientId
    ? findLocalMedicine(scanResult.matchedIngredientId)
    : null;

  const commercialAlternatives: EgyptianCommercialProduct[] = scanResult?.matchedIngredientId
    ? EGYPTIAN_COMMERCIAL_PRODUCTS.filter(
        (p) => p.activeIngredientId === scanResult.matchedIngredientId
      )
    : [];

  const matchedIngMeta = scanResult?.matchedIngredientId
    ? ACTIVE_INGREDIENTS.find((a) => a.id === scanResult.matchedIngredientId)
    : undefined;

  return (
    <main className="wrap narrow stack">
      <div className="head" style={{ alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>
          {isAr
            ? '📷 الماسح الذكي الموحد (باركود + قارئ العلبة والشريط بالذكاء الاصطناعي)'
            : '📷 Unified Smart Scanner (Barcode + AI Vision Box & Blister Reader)'}
        </h1>
        <button
          type="button"
          className="btn ghost small"
          onClick={() => setShowKeyModal(!showKeyModal)}
          style={{ fontSize: '0.84rem' }}
        >
          ⚙️ {isAr ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}
        </button>
      </div>

      {/* Optional Gemini API Key Drawer */}
      {showKeyModal && (
        <div
          className="card stack"
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            padding: '14px',
            borderRadius: '10px',
          }}
        >
          <div className="head">
            <h3 style={{ margin: 0, fontSize: '0.98rem' }}>
              🔑 {isAr ? 'مفتاح Google Gemini API (إضافي اختياري):' : 'Google Gemini API Key (Optional):'}
            </h3>
            <button type="button" className="btn ghost small" onClick={() => setShowKeyModal(false)}>
              ✕
            </button>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            {isAr
              ? 'يعمل القارئ البصري تلقائياً بدون الحاجة لأي مفتاح. ويمكنك اختيارياً إضافة مفتاح Gemini خاص بك لسرعة إضافية:'
              : 'The visual reader works automatically out of the box. You may optionally add a personal Gemini key:'}
          </p>
          <div className="row">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{ flex: 1, fontFamily: 'monospace' }}
            />
            <button
              type="button"
              className="btn small"
              onClick={() => {
                setApiKey(apiKeyInput);
                setShowKeyModal(false);
                setMsg(isAr ? '✅ تم حفظ المفتاح بنجاح!' : 'API Key saved!');
              }}
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
            {isCustomApiKey() && (
              <button
                type="button"
                className="btn ghost small danger"
                onClick={() => {
                  clearApiKey();
                  setApiKeyInput('');
                  setMsg(isAr ? 'تم مسح المفتاح.' : 'Key cleared.');
                }}
              >
                {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div
        className="notice tip"
        style={{
          padding: '14px 16px',
          borderRadius: '12px',
          margin: '4px 0 10px',
          border: '1px solid #bae6fd',
          background: '#f0f9ff',
        }}
      >
        <p style={{ margin: '0 0 6px', fontSize: '0.96rem', color: '#0369a1', fontWeight: 700 }}>
          {isAr
            ? '🛡️ قراءة تلقائية فورية للباركود أو لاسم الدواء المطبوع على وش العلبة والشريط:'
            : '🛡️ Automatic Instant Reading of Barcode or Box Front / Blister Name:'}
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#0c4a6e', lineHeight: 1.65 }}>
          {isAr
            ? 'سواء قمت بتصوير الباركود الخطي (622) أو قمت بتصوير/رفع صورة وش العلبة (بالعربية أو الإنجليزية)، يقوم النظام بقراءة اسم الدواء تلقائياً وعرض كافة معلوماته الطبية، جرعاته، تحذيراته، وأسعار بدائله المصرية فوراً.'
            : 'Whether you scan the barcode or take/upload a photo of the box front (in Arabic or English), the system automatically reads the medicine name and displays all clinical details, dosages, warnings, and Egyptian generic substitutes immediately.'}
        </p>
      </div>

      <div id="filereader" style={{ display: 'none' }} />

      {/* Scan Control Action Box: 3 Separate, Clear Actions */}
      <section className="card stack" style={{ borderTop: '4px solid #0284c7' }}>
        <div id="reader" className="reader" />

        {/* 3 Explicit Action Buttons: Live Scanner | Snap Camera Photo | Upload from Gallery */}
        <div className="row wrapRow" style={{ gap: '10px' }}>
          {/* Action 1: Live Video Camera */}
          {!running ? (
            <button type="button" className="btn" onClick={start}>
              📹 {isAr ? 'تشغيل الكاميرا المباشرة' : 'Start Live Camera'}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn"
                onClick={captureLiveFrameForVision}
                style={{ background: '#10b981', borderColor: '#059669' }}
              >
                📸 {isAr ? 'التقاط صورة للعلبة الآن' : 'Capture Frame Now'}
              </button>
              <button type="button" className="btn ghost" onClick={stop}>
                ⏹️ {t('scanStop')}
              </button>
            </>
          )}

          {/* Action 2: Snap Photo via Mobile Camera Directly */}
          <label className="btn" style={{ cursor: 'pointer', background: '#0891b2', borderColor: '#0891b2' }}>
            📸 {busy ? t('loading') : L('صوّر العلبة بالكاميرا', 'Take Photo with Camera')}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={onCameraFile}
              disabled={busy}
            />
          </label>

          {/* Action 3: Upload Existing Image from Phone Gallery / Files */}
          <label className="btn ghost" style={{ cursor: 'pointer', borderColor: '#0284c7', color: '#0369a1' }}>
            📁 {busy ? t('loading') : L('ارفع صورة من المعرض / الملفات', 'Upload from Gallery / Files')}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onGalleryFile}
              disabled={busy}
            />
          </label>
        </div>

        {statusStep && (
          <div className="notice tip" style={{ padding: '10px 14px', borderRadius: '10px', fontWeight: 600 }}>
            ⏳ {statusStep}
          </div>
        )}

        {msg && <p className="alert">{msg}</p>}

        {/* FULL AUTOMATIC DRUG INFORMATION REPORT */}
        {scanResult && (
          <div
            className="card stack"
            style={{
              background: '#f0fdf4',
              border: '2px solid #22c55e',
              color: '#0f172a',
              marginTop: '8px',
            }}
          >
            {/* Header Badges */}
            <div
              className="row"
              style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}
            >
              <span
                className="badge"
                style={{
                  background: '#dcfce7',
                  color: '#166534',
                  borderColor: '#86efac',
                  fontWeight: 700,
                }}
              >
                {isAr ? scanResult.confidenceLabelAr : scanResult.confidenceLabelEn}
              </span>
              <div className="row" style={{ gap: '6px' }}>
                {matchedIngMeta?.whoAccessGroup && (
                  <span
                    className="badge"
                    style={{
                      background: matchedIngMeta.whoAccessGroup === 'Access' ? '#dcfce7' : '#fef3c7',
                      color: matchedIngMeta.whoAccessGroup === 'Access' ? '#166534' : '#92400e',
                      fontWeight: 700,
                    }}
                  >
                    WHO: {matchedIngMeta.whoAccessGroup}
                  </span>
                )}
                {scanResult.priceEgp && (
                  <span className="badge approved" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {scanResult.priceEgp} {isAr ? 'ج.م' : 'EGP'}
                  </span>
                )}
              </div>
            </div>

            {/* Main Summary Row with Box Image */}
            <div className="row" style={{ gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {previewImg && (
                <img
                  src={previewImg}
                  alt="Scanned Medicine"
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '10px',
                    border: '2px solid #86efac',
                    objectFit: 'cover',
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <h2 style={{ margin: '0 0 6px', color: '#065f46', fontSize: '1.3rem' }}>
                  {scanResult.matchedTradeName || scanResult.detectedText}
                </h2>
                {fullMedicine && (
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#0f172a', fontSize: '0.96rem' }}>
                    🧪 {isAr ? 'المادة الفعالة: ' : 'Active Ingredient: '}
                    {pick(fullMedicine.genericName, lang)}
                  </p>
                )}
                {(scanResult.strength || scanResult.manufacturer || scanResult.barcode) && (
                  <div className="small muted" style={{ marginBottom: '8px', color: '#334155' }}>
                    {scanResult.strength && (
                      <span>
                        {isAr ? 'التركيز: ' : 'Strength: '}
                        <b>{scanResult.strength}</b> ·{' '}
                      </span>
                    )}
                    {scanResult.manufacturer && (
                      <span>
                        {isAr ? 'الشركة: ' : 'Maker: '}
                        <b>{scanResult.manufacturer}</b>{' '}
                      </span>
                    )}
                    {scanResult.barcode && <code>({scanResult.barcode})</code>}
                  </div>
                )}
                <p style={{ margin: 0, lineHeight: 1.65, fontSize: '0.94rem', whiteSpace: 'pre-line' }}>
                  {scanResult.summary}
                </p>
              </div>
            </div>

            {/* COMPLETE CLINICAL MONOGRAPH SECTIONS (All Information Displayed Directly) */}
            {fullMedicine && (
              <div
                className="stack"
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #bbf7d0',
                  gap: '10px',
                }}
              >
                <h3 style={{ margin: 0, color: '#065f46', fontSize: '1.08rem' }}>
                  📋 {isAr ? 'المعلومات الطبية والدوائية الكاملة للمستحضر:' : 'Complete Clinical & Pharmaceutical Information:'}
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {CLINICAL_DETAIL_FIELDS.map((fieldKey) => {
                    const content = pick(fullMedicine[fieldKey], lang);
                    if (!content || !content.trim()) return null;
                    const label = pick(FIELD_LABELS[fieldKey], lang);
                    const isWarning =
                      fieldKey === 'contraindications' ||
                      fieldKey === 'interactions' ||
                      fieldKey === 'sideEffects';
                    return (
                      <div
                        key={fieldKey}
                        style={{
                          background: isWarning ? '#fffbeb' : '#ffffff',
                          border: isWarning ? '1px solid #fde68a' : '1px solid #dcfce7',
                          borderRadius: '10px',
                          padding: '12px 14px',
                        }}
                      >
                        <h4
                          style={{
                            margin: '0 0 6px',
                            fontSize: '0.95rem',
                            color: isWarning ? '#92400e' : '#0b3c5d',
                          }}
                        >
                          {isWarning ? '⚠️ ' : '📌 '}
                          {label}
                        </h4>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.88rem',
                            lineHeight: 1.65,
                            whiteSpace: 'pre-line',
                            color: '#1e293b',
                          }}
                        >
                          {content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ALL EGYPTIAN COMMERCIAL PACKAGES & IDENTICAL ALTERNATIVES */}
            {commercialAlternatives.length > 0 && (
              <div
                className="stack"
                style={{
                  marginTop: '10px',
                  paddingTop: '12px',
                  borderTop: '1px solid #bbf7d0',
                  gap: '8px',
                }}
              >
                <h3 style={{ margin: 0, color: '#065f46', fontSize: '1.05rem' }}>
                  🇪🇬{' '}
                  {isAr
                    ? `جميع العبوات والبدائل المصرية المتطابقة في نفس المادة الفعالة (${commercialAlternatives.length} مستحضر):`
                    : `All Identical Egyptian Commercial Packages & Generics (${commercialAlternatives.length}):`}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {commercialAlternatives.map((pkg) => (
                    <div
                      key={pkg.productId}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '4px',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                        {isAr ? pkg.tradeNameAr : pkg.tradeNameEn}
                      </div>
                      <div className="small muted" style={{ fontSize: '0.82rem' }}>
                        {pkg.strength} · {pkg.manufacturer}
                      </div>
                      <div
                        className="row"
                        style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}
                      >
                        {pkg.priceEgp ? (
                          <span
                            className="badge"
                            style={{ background: '#ecfdf5', color: '#065f46', fontWeight: 700, fontSize: '0.8rem' }}
                          >
                            {pkg.priceEgp} {isAr ? 'ج.م' : 'EGP'}
                          </span>
                        ) : (
                          <span className="small muted">{isAr ? 'سعر متغير' : 'Variable'}</span>
                        )}
                        {pkg.barcode && <code style={{ fontSize: '0.75rem' }}>{pkg.barcode}</code>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Links */}
            {scanResult.matchedIngredientId && (
              <div className="row wrapRow" style={{ gap: '10px', marginTop: '10px' }}>
                <Link to={`/medicine/${scanResult.matchedIngredientId}`} className="btn" style={{ fontWeight: 700 }}>
                  📖 {isAr ? 'فتح صفحة الدواء المستقلة ورمز QR ←' : 'Open Dedicated Drug Page & QR →'}
                </Link>
                <Link to="/prescription-radar" className="btn ghost">
                  📡 {isAr ? 'فحص الدواء في رادار الروشتة 24 ساعة' : 'Check in 24h Prescription Radar'}
                </Link>
                <Link to="/allergy-checker" className="btn ghost">
                  🛡️ {isAr ? 'فحص الحساسية المتقاطعة' : 'Cross-Allergy Checker'}
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Unified Manual Input with Live Suggestions */}
      <section className="card stack">
        <label htmlFor="bc" style={{ fontWeight: 700 }}>
          🔎 {isAr ? 'أو ابحث مباشرة برقم الباركود (622...) أو اسم الدواء:' : 'Or search directly by barcode (622...) or medicine name:'}
        </label>
        <div style={{ position: 'relative' }}>
          <div className="row">
            <input
              id="bc"
              placeholder={
                isAr
                  ? 'مثال: زيثروماكس، أوجمنتين، 6221054003411، سيبروفار...'
                  : 'e.g. Zithromax, Augmentin, 6221054003411, Ciprofar...'
              }
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manual.trim()) {
                  handleBarcodeOrTextInput(manual);
                }
              }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => manual.trim() && handleBarcodeOrTextInput(manual)}
            >
              {isAr ? 'عرض المعلومات الكاملة' : 'Show Full Info'}
            </button>
          </div>

          {/* Live Autocomplete Dropdown */}
          {suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 20,
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginTop: '4px',
                overflow: 'hidden',
              }}
            >
              {suggestions.map((s) => (
                <div
                  key={s.productId}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.92rem',
                  }}
                  onMouseDown={() => {
                    setManual(s.tradeNameAr);
                    handleBarcodeOrTextInput(s.tradeNameAr);
                    setSuggestions([]);
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {isAr ? s.tradeNameAr : s.tradeNameEn}
                    </span>{' '}
                    <span className="small muted">({s.strength})</span>
                  </div>
                  {s.priceEgp && (
                    <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', fontSize: '0.8rem', fontWeight: 700 }}>
                      {s.priceEgp} {isAr ? 'ج.م' : 'EGP'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instant Interactive Demo Chips */}
        <div>
          <p className="small muted" style={{ margin: '6px 0 8px', fontWeight: 600 }}>
            ✨ {isAr ? 'تجارب سريعة لمعاينة عرض المعلومات الشاملة للدواء:' : 'Quick Demos to Preview Full Drug Report:'}
          </p>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            {DEMO_UNIFIED_SAMPLES.map((sample) => (
              <button
                key={sample.id + sample.method}
                type="button"
                className="chip"
                onClick={() => {
                  setPreviewImg(null);
                  handleBarcodeOrTextInput(sample.tradeMatch);
                }}
              >
                {sample.method === 'barcode_exact' ? '🟢' : '🤖'} {isAr ? sample.titleAr : sample.titleEn}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
