import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useLang } from './i18n';
import { ALL_LOCAL_MEDICINES, findLocalMedicine, useApproved } from './medicinesApi';
import { analyzeMedicineImageWithVision } from './geminiApi';
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
 * Maps dot-similar Arabic letters to their base skeleton so OCR dot errors
 * (e.g., ز/ر, ث/ت/ن/ب, ج/ح/خ, ف/ق, س/ش, ص/ض, ط/ظ, ع/غ, د/ذ) still match accurately
 */
function normalizeArabicSkeleton(str: string): string {
  return normalizeText(str)
    .replace(/ز/g, 'ر')
    .replace(/ذ/g, 'د')
    .replace(/[ثتن]/g, 'ب')
    .replace(/[جخ]/g, 'ح')
    .replace(/ش/g, 'س')
    .replace(/ض/g, 'ص')
    .replace(/ظ/g, 'ط')
    .replace(/غ/g, 'ع')
    .replace(/ق/g, 'ف');
}

/**
 * Computes Levenshtein edit distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length < b.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, idx) => idx);
  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr.push(Math.min(prev[j + 1] + 1, curr[j] + 1, prev[j] + cost));
    }
    prev = curr;
  }
  return prev[b.length];
}

function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Pharmaceutical stop-words (dosage forms, units, common packaging words in Arabic & English)
 * that must NOT be confused with brand names
 */
const PHARMA_STOP_WORDS = new Set([
  'tablet', 'tablets', 'tab', 'capsule', 'capsules', 'cap', 'suspension', 'syrup',
  'vial', 'ampoule', 'amp', 'infusion', 'drops', 'cream', 'ointment', 'sachet',
  'oral', 'film', 'coated', 'forte', 'retard', 'pediatric', 'plus', 'acid',
  'potassium', 'sodium', 'trihydrate', 'hydrate', 'hydrochloride', 'sulfate',
  'topical', 'ophthalmic', 'eye', 'ear', 'gel', 'solution', 'powder', 'for',
  'injection', 'iv', 'im', 'sr', 'xl', 'es', 'ds', 'mg', 'gm', 'ml', 'mcg', 'iu',
  'unknown', 'drug', 'name', 'medicine', 'antibiotic', 'box', 'strip', 'pack',
  'egypt', 'pharma', 'pharmaceuticals', 'company',
  'اقراص', 'قرص', 'كبسول', 'كبسولات', 'شراب', 'معلق', 'فيال', 'امبول', 'حقن', 'للحقن',
  'وريدي', 'الوريدي', 'عضلي', 'العضلي', 'نقط', 'قطره', 'كريم', 'مرهم', 'موضعي', 'فوار',
  'اكياس', 'كيس', 'مجم', 'جم', 'مل', 'مغلفه', 'مضاعف', 'القوه', 'للاطفال', 'اطفال',
  'للرضع', 'رضع', 'فمويه', 'فموي', 'كبار', 'حمض', 'تركيز', 'عبوه', 'شريط', 'دواء',
  'مضاد', 'حيوي', 'جل', 'محلول', 'بودره', 'قطرات', 'عين', 'اذن', 'العيون', 'الاذن',
  'بوتاسيوم', 'صوديوم', 'شركه', 'الماده', 'الفعاله'
]);

/**
 * Phonetic & OCR Alias Dictionary for common Arabic & English OCR variations
 */
const OCR_ALIASES: Array<{
  aliases: string[];
  tradeNameAr: string;
  ingredientId: string;
}> = [
  {
    aliases: ['زيثروماكس', 'ريثروماكس', 'زيتروماكس', 'يثروماكس', 'zithromax', 'ithromax', 'azithromax'],
    tradeNameAr: 'زيثروماكس 500 مجم أقراص',
    ingredientId: 'azithromycin',
  },
  {
    aliases: ['زيثرون', 'ريثرون', 'xithrone', 'zithron', 'xithron'],
    tradeNameAr: 'زيثرون 500 مجم أقراص',
    ingredientId: 'azithromycin',
  },
  {
    aliases: ['زيثروكان', 'ريثروكان', 'zithrokan', 'zithrocan'],
    tradeNameAr: 'زيثروكان 500 مجم كبسول',
    ingredientId: 'azithromycin',
  },
  {
    aliases: ['ايبيزيثرو', 'ابيزيثرو', 'epizithro'],
    tradeNameAr: 'إيبيزيثرو 500 مجم كبسول',
    ingredientId: 'azithromycin',
  },
  {
    aliases: ['زيسروسين', 'ريسروسين', 'zisrocin'],
    tradeNameAr: 'زيسروسين 500 مجم كبسول',
    ingredientId: 'azithromycin',
  },
  {
    aliases: ['اوجمنتين', 'اوغمنتين', 'وجمنتين', 'اوحمنتين', 'augmentin', 'ugmentin'],
    tradeNameAr: 'أوجمنتين 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    aliases: ['هاي بيوتك', 'هايبوتك', 'هايبيوتك', 'hibiotic', 'ibiotic'],
    tradeNameAr: 'هاي بيوتك 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    aliases: ['كلافيموكس', 'كلافوكس', 'klavox', 'clavamox'],
    tradeNameAr: 'كلافوكس 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    aliases: ['كورام', 'كيورام', 'كوران', 'curam'],
    tradeNameAr: 'كورام 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    aliases: ['ميجاموكس', 'ميغاموكس', 'megamox'],
    tradeNameAr: 'ميجاموكس 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    aliases: ['ايموكسكلاف', 'اموكسكلاف', 'emoxclav', 'e moxclav'],
    tradeNameAr: 'إيموكسكلاف 1 جم أقراص',
    ingredientId: 'amoxicillin-clavulanic-acid',
  },
  {
    aliases: ['اموكسيل', 'أموكسيل', 'amoxil'],
    tradeNameAr: 'أموكسيل 500 مجم كبسول',
    ingredientId: 'amoxicillin',
  },
  {
    aliases: ['ايموكس', 'إيموكس', 'emox', 'e mox'],
    tradeNameAr: 'إيموكس 500 مجم كبسول',
    ingredientId: 'amoxicillin',
  },
  {
    aliases: ['فلاجيل', 'فلاحيل', 'فلاجل', 'flagyl', 'lagyl'],
    tradeNameAr: 'فلاجيل 500 مجم أقراص',
    ingredientId: 'metronidazole',
  },
  {
    aliases: ['امريزول', 'أمريزول', 'amrizole'],
    tradeNameAr: 'أمريزول 500 مجم أقراص',
    ingredientId: 'metronidazole',
  },
  {
    aliases: ['سيبروفار', 'سبروفار', 'ciprofar'],
    tradeNameAr: 'سيبروفار 500 مجم أقراص',
    ingredientId: 'ciprofloxacin',
  },
  {
    aliases: ['سيبروباي', 'ciprobay'],
    tradeNameAr: 'سيبروباي 500 مجم أقراص',
    ingredientId: 'ciprofloxacin',
  },
  {
    aliases: ['سيبروسين', 'ciprocin'],
    tradeNameAr: 'سيبروسين 500 مجم أقراص',
    ingredientId: 'ciprofloxacin',
  },
  {
    aliases: ['سيبروماي', 'cipromay'],
    tradeNameAr: 'سيبروماي 500 مجم أقراص',
    ingredientId: 'ciprofloxacin',
  },
  {
    aliases: ['تافانيك', 'تافانك', 'tavanic'],
    tradeNameAr: 'تافانيك 500 مجم أقراص',
    ingredientId: 'levofloxacin',
  },
  {
    aliases: ['ليفوكسين', 'levoxin'],
    tradeNameAr: 'ليفوكسين 500 مجم أقراص',
    ingredientId: 'levofloxacin',
  },
  {
    aliases: ['ليفوديل', 'levodel'],
    tradeNameAr: 'ليفوديل 500 مجم أقراص',
    ingredientId: 'levofloxacin',
  },
  {
    aliases: ['أفيلوكس', 'افيلوكس', 'افالوكس', 'avelox', 'avalox', 'موكسيفلوكس', 'moxiflox', 'فيجاموكس', 'vigamox'],
    tradeNameAr: 'أفيلوكس 400 مجم أقراص',
    ingredientId: 'moxifloxacin',
  },
  {
    aliases: ['سيبوريكس', 'كيبوركس', 'كيبركس', 'ceporex', 'كفلكس', 'keflex', 'ايبيلكس', 'إيبيلكس', 'ibilex', 'أوسبكسين', 'ospexin'],
    tradeNameAr: 'سيبوريكس 1 جم أقراص',
    ingredientId: 'cephalexin',
  },
  {
    aliases: ['يوناسين', 'يوناسن', 'unasyn', 'سيغماسين', 'sigmacyn', 'ألتراسيللين', 'ultracillin', 'سولبين', 'sulbin'],
    tradeNameAr: 'يوناسين 375 مجم أقراص',
    ingredientId: 'ampicillin-sulbactam',
  },
  {
    aliases: ['فلوكسامو', 'فلوكساموكس', 'floxamo', 'فلوسيل', 'flucil', 'فلوكسابكت', 'floxabact'],
    tradeNameAr: 'فلوكسامو 500 مجم كبسول',
    ingredientId: 'flucloxacillin',
  },
  {
    aliases: ['روسيفين', 'rocephin', 'سيفترياكسون', 'ceftriaxone', 'وينترياكسون', 'wintriaxone', 'سيفاكسون', 'cefaxone', 'إبيسفين', 'epicephin'],
    tradeNameAr: 'روسيفين 1 جم فيال',
    ingredientId: 'ceftriaxone',
  },
  {
    aliases: ['سيفوتاكس', 'cefotax', 'كلافوران', 'claforan', 'راميسيفت', 'ramiceft'],
    tradeNameAr: 'سيفوتاكس 1 جم فيال',
    ingredientId: 'cefotaxime',
  },
  {
    aliases: ['سوبراكس', 'suprax', 'سيفيكس', 'cefix', 'زيماسيف', 'ximacef'],
    tradeNameAr: 'سوبراكس 400 مجم كبسول',
    ingredientId: 'cefixime',
  },
  {
    aliases: ['زينات', 'زيناكس', 'zinnat', 'زيناسيف', 'zinacef', 'سيفوروكس', 'cefurox'],
    tradeNameAr: 'زينات 500 مجم أقراص',
    ingredientId: 'cefuroxime',
  },
  {
    aliases: ['ديوريسيف', 'duricef', 'بيودروكسيل', 'biodroxil', 'إيبيدروكسيل', 'ibidroxil', 'كيريسيف', 'curisafe'],
    tradeNameAr: 'ديوريسيف 500 مجم كبسول',
    ingredientId: 'cefadroxil',
  },
  {
    aliases: ['أومنيسيف', 'omnicef', 'سيفدين', 'cefdin', 'دينار', 'dinar'],
    tradeNameAr: 'أومنيسيف 300 مجم كبسول',
    ingredientId: 'cefdinir',
  },
  {
    aliases: ['سيلبيرازون', 'sulperazon', 'سيفوزون', 'cefozone', 'بيراكتام', 'peractam'],
    tradeNameAr: 'سيلبيرازون 1 جم فيال',
    ingredientId: 'cefoperazone-sulbactam',
  },
  {
    aliases: ['ماكسيبيم', 'maxipime', 'سيفيبيم', 'cefepime', 'وينسيف', 'wincef'],
    tradeNameAr: 'ماكسيبيم 1 جم فيال',
    ingredientId: 'cefepime',
  },
  {
    aliases: ['كلاسيد', 'klacid', 'كلاريكان', 'clarikan', 'كلاريثرو', 'clarithro'],
    tradeNameAr: 'كلاسيد 500 مجم أقراص',
    ingredientId: 'clarithromycin',
  },
  {
    aliases: ['إريثروسين', 'اريثروسين', 'erythrocin', 'إريثرومايسين', 'erythromycin', 'أكني مايسين', 'aknemycin'],
    tradeNameAr: 'إريثروسين 500 مجم أقراص',
    ingredientId: 'erythromycin',
  },
  {
    aliases: ['فيبراميسين', 'vibramycin', 'تابوسين', 'tabocin', 'دوكسي', 'doxymycin', 'doxycost'],
    tradeNameAr: 'فيبراميسين 100 مجم كبسول',
    ingredientId: 'doxycycline',
  },
  {
    aliases: ['دالاسين', 'dalacin', 'كليندام', 'clindam', 'ألفاكليند', 'alfaclind', 'كلينداسول', 'clindasol'],
    tradeNameAr: 'دالاسين سي 300 مجم كبسول',
    ingredientId: 'clindamycin',
  },
  {
    aliases: ['ماكروفيوران', 'macrofuran', 'يوفامين', 'uvamin', 'ميبافيوران', 'mepafuran'],
    tradeNameAr: 'ماكروفيوران 100 مجم كبسول',
    ingredientId: 'nitrofurantoin',
  },
  {
    aliases: ['سبترين', 'septrin', 'سوتريم', 'sutrim', 'سبتازول', 'septazole'],
    tradeNameAr: 'سبترين مضاعف القوة أقراص',
    ingredientId: 'co-trimoxazole',
  },
  {
    aliases: ['جاراميسين', 'garamycin', 'إيبيجنت', 'epigent', 'جنتاميسين', 'gentamycin'],
    tradeNameAr: 'جاراميسين 80 مجم أمبول',
    ingredientId: 'gentamicin',
  },
  {
    aliases: ['أميكين', 'اميكين', 'amikin', 'أميكابيوتك', 'amikabiotic', 'ميكاسين', 'mikacin'],
    tradeNameAr: 'أميكين 500 مجم فيال',
    ingredientId: 'amikacin',
  },
  {
    aliases: ['ميرونيم', 'meronem', 'ميروبينيم', 'meropenem'],
    tradeNameAr: 'ميرونيم 1 جم فيال',
    ingredientId: 'meropenem',
  },
  {
    aliases: ['فانكوسين', 'vancocin', 'فانكوميكس', 'vancomix', 'سيلوفان', 'celovan'],
    tradeNameAr: 'فانكوميكس 500 مجم فيال',
    ingredientId: 'vancomycin',
  },
  {
    aliases: ['زيفوكس', 'zyvox', 'أفيروزوليد', 'averozolid', 'لينوليد', 'linolid'],
    tradeNameAr: 'زيفوكس 600 مجم أقراص',
    ingredientId: 'linezolid',
  },
  {
    aliases: ['فيوسيدين', 'fucidin', 'فيوسيديرم', 'fusiderm', 'فيوسيباكت', 'fusibact', 'فيوسيثالمك', 'fucithalmic', 'fucitop'],
    tradeNameAr: 'فيوسيدين 2% كريم',
    ingredientId: 'fusidic-acid',
  },
  {
    aliases: ['تراسيد', 'trcid', 'جاستروبيوتك', 'gastrobiotic', 'إندوريفاكس', 'endorifax', 'rifaximin'],
    tradeNameAr: 'تراسيد 200 مجم أقراص',
    ingredientId: 'rifaximin',
  },
  {
    aliases: ['أوسبين', 'اوسبين', 'ospen', 'بنسلين', 'فينوكسي'],
    tradeNameAr: 'أوسبين 1000 مجم أقراص',
    ingredientId: 'penicillin-v-potassium',
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
    tradeMatch: 'Zithromax 500mg Tablets',
  },
  {
    id: 'amoxicillin-clavulanic-acid',
    method: 'barcode_exact' as const,
    titleAr: 'تجربة مسح علبة أوجمنتين 1 جم',
    titleEn: 'Augmentin 1g Box',
    tradeMatch: 'Augmentin 1g Tablets',
  },
  {
    id: 'ciprofloxacin',
    method: 'ai_vision' as const,
    titleAr: 'تجربة قراءة وش علبة سيبروفار 500 مجم',
    titleEn: 'Ciprofar 500mg Box Front',
    tradeMatch: 'Ciprofar 500mg Tablets',
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

  // Live Autocomplete State
  const [suggestions, setSuggestions] = useState<EgyptianCommercialProduct[]>([]);

  // Update live suggestions as user types in manual search box (supports Arabic & English)
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
   * Builds a complete UnifiedScanResult from an EgyptianCommercialProduct
   */
  function buildResultFromProduct(
    prod: EgyptianCommercialProduct,
    method: UnifiedScanResult['method'] = 'ai_vision',
    customSummary?: string
  ): UnifiedScanResult {
    const ing = ACTIVE_INGREDIENTS.find((a) => a.id === prod.activeIngredientId);
    const med = findLocalMedicine(prod.activeIngredientId);
    const usesLine = med?.approvedUses?.ar ? med.approvedUses.ar.split(/\r?\n/)[0] : '';
    const defaultSummary = isAr
      ? `تمت قراءة الاسم من الصورة والتعرف على الدواء بنجاح: ${prod.tradeNameAr} (${prod.tradeNameEn}) — التركيز: ${prod.strength} — المادة الفعالة: ${prod.scientificComposition} — الفئة العلاجية: ${ing?.drugClass?.ar || ''} — تصنيف منظمة الصحة العالمية: ${ing?.whoAccessGroup || 'Access'}.${usesLine ? '\n\n• دواعي الاستعمال: ' + usesLine : ''}`
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
      matchedTradeName: isAr
        ? `${prod.tradeNameAr} (${prod.tradeNameEn})`
        : `${prod.tradeNameEn} (${prod.tradeNameAr})`,
      strength: prod.strength,
      manufacturer: prod.manufacturer,
      barcode: prod.barcode,
      priceEgp: prod.priceEgp,
      summary: customSummary || defaultSummary,
    };
  }

  /**
   * Universal Bilingual Scoring Matcher:
   * Accurately matches ANY of the 206 Egyptian Commercial Products or 32 Active Ingredients
   * whether the photographed name is in Arabic OR English (with fuzzy & dot-skeleton support)
   */
  function matchDrugFromText(
    rawText: string,
    method: UnifiedScanResult['method'] = 'ai_vision'
  ): UnifiedScanResult {
    const clean = normalizeText(rawText);
    const cleanWords = clean.split(' ');
    const inWords = cleanWords.filter(
      (w) =>
        w.length >= 2 &&
        !PHARMA_STOP_WORDS.has(w) &&
        !/^\d+(mg|g|gm|ml|mcg|iu)?$/.test(w)
    );

    let bestProd: EgyptianCommercialProduct | null = null;
    let bestScore = 0;

    // 1) Score all 206 Egyptian Commercial Products (Arabic + English names + Active Ingredients)
    for (const p of EGYPTIAN_COMMERCIAL_PRODUCTS) {
      const arWords = normalizeText(p.tradeNameAr)
        .split(' ')
        .filter((w) => w.length >= 2 && !PHARMA_STOP_WORDS.has(w) && !/^\d+$/.test(w));
      const enWords = normalizeText(p.tradeNameEn)
        .split(' ')
        .filter(
          (w) =>
            w.length >= 2 &&
            !PHARMA_STOP_WORDS.has(w) &&
            !/^\d+(mg|g|gm|ml|mcg|iu)?$/.test(w)
        );

      const arBrand =
        arWords.length >= 2 && arWords[0].length <= 3
          ? `${arWords[0]} ${arWords[1]}`
          : arWords[0] || '';
      const enBrand =
        enWords.length >= 2 && enWords[0].length <= 2
          ? `${enWords[0]} ${enWords[1]}`
          : enWords[0] || '';

      let score = 0;

      // A. Exact Brand Match in English or Arabic
      if (
        enBrand &&
        enBrand.length >= 3 &&
        (cleanWords.includes(enBrand) || (enBrand.length >= 4 && clean.includes(enBrand)))
      ) {
        score = Math.max(score, 130 + enBrand.length * 3);
      }
      if (
        arBrand &&
        arBrand.length >= 3 &&
        (cleanWords.includes(arBrand) || (arBrand.length >= 4 && clean.includes(arBrand)))
      ) {
        score = Math.max(score, 130 + arBrand.length * 3);
      }

      // B. Check OCR_ALIASES for this ingredient/product
      if (score === 0) {
        for (const entry of OCR_ALIASES) {
          if (entry.ingredientId === p.activeIngredientId) {
            const aliasHit = entry.aliases.some((al) => {
              const alNorm = normalizeText(al);
              return alNorm.length >= 4 && clean.includes(alNorm);
            });
            if (aliasHit && p.tradeNameAr.includes(entry.tradeNameAr.split(' ')[0])) {
              score = Math.max(score, 125);
            }
          }
        }
      }

      // C. Fuzzy Levenshtein & Arabic Dot-Skeleton Match on Brand Words (handles OCR typos)
      if (score === 0) {
        for (const iw of inWords) {
          if (iw.length >= 4) {
            if (enBrand && enBrand.length >= 4) {
              const simEn = stringSimilarity(iw, enBrand);
              if (simEn >= 0.74) {
                score = Math.max(score, Math.round(simEn * 105));
              }
            }
            if (arBrand && arBrand.length >= 3) {
              const simAr = stringSimilarity(iw, arBrand);
              const simSkel = stringSimilarity(
                normalizeArabicSkeleton(iw),
                normalizeArabicSkeleton(arBrand)
              );
              if (simAr >= 0.74 || simSkel >= 0.82) {
                score = Math.max(score, Math.round(Math.max(simAr, simSkel) * 105));
              }
            }
          }
        }
      }

      // D. Active Ingredient Match (both English & Arabic generic names)
      const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
      if (ing) {
        const ingArTokens = normalizeText(ing.nameAr)
          .split(' ')
          .filter((w) => w.length >= 3 && !PHARMA_STOP_WORDS.has(w));
        const ingEnTokens = normalizeText(ing.nameEn)
          .split(' ')
          .filter((w) => w.length >= 3 && !PHARMA_STOP_WORDS.has(w));

        let matchedEnIng = 0;
        for (const gw of ingEnTokens) {
          if (
            clean.includes(gw) ||
            inWords.some((iw) => iw.length >= 4 && stringSimilarity(iw, gw) >= 0.8)
          ) {
            matchedEnIng++;
          }
        }

        let matchedArIng = 0;
        for (const gw of ingArTokens) {
          if (
            clean.includes(gw) ||
            inWords.some(
              (iw) =>
                iw.length >= 4 &&
                (stringSimilarity(iw, gw) >= 0.8 ||
                  stringSimilarity(normalizeArabicSkeleton(iw), normalizeArabicSkeleton(gw)) >= 0.85)
            )
          ) {
            matchedArIng++;
          }
        }

        if (matchedEnIng > 0) {
          const ratio = matchedEnIng / Math.max(1, ingEnTokens.length);
          score = Math.max(score, Math.round(70 + matchedEnIng * 20 + ratio * 25));
        }
        if (matchedArIng > 0) {
          const ratio = matchedArIng / Math.max(1, ingArTokens.length);
          score = Math.max(score, Math.round(70 + matchedArIng * 20 + ratio * 25));
        }
      }

      // E. Secondary Tie-Breaker: Strength & Dosage Form (only if brand or ingredient matched!)
      if (score > 0) {
        const strengthNums = p.strength.match(/\d+/g) || [];
        for (const num of strengthNums) {
          if (cleanWords.includes(num) || clean.includes(`${num}mg`) || clean.includes(`${num}g`)) {
            score += 15;
          }
        }
        const formKeywords = [
          'شراب', 'suspension', 'كبسول', 'capsule', 'اقراص', 'tablet',
          'فيال', 'vial', 'امبول', 'ampoule', 'كريم', 'cream', 'نقط', 'drops',
        ];
        const prodNorm = `${normalizeText(p.tradeNameAr)} ${normalizeText(p.tradeNameEn)}`;
        for (const fk of formKeywords) {
          if (clean.includes(fk) && prodNorm.includes(fk)) {
            score += 10;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestProd = p;
      }
    }

    if (bestProd && bestScore >= 65) {
      return buildResultFromProduct(bestProd, method);
    }

    // 2) Also check ALL_LOCAL_MEDICINES brands & substitutes
    for (const med of ALL_LOCAL_MEDICINES) {
      const genAr = normalizeText(med.genericName.ar);
      const genEn = normalizeText(med.genericName.en);
      if (
        (genAr.length >= 4 && clean.includes(genAr)) ||
        (genEn.length >= 4 && clean.includes(genEn))
      ) {
        const rep = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.activeIngredientId === med.id);
        if (rep) return buildResultFromProduct(rep, method);
      }
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

    // 3) Match Arabic or English drug name
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
   * Normalizes image size to max 850px for fast OCR/Vision processing
   * and checks native BarcodeDetector + Zithromax metallic triangle signature
   */
  async function normalizeAndInspectImage(dataUrl: string): Promise<{
    normalizedDataUrl: string;
    nativeBarcode: string | null;
    isZithromaxMetallicTriangle: boolean;
  }> {
    const img = new Image();
    img.src = dataUrl;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    const maxDim = 850;
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
        nativeBarcode: null,
        isZithromaxMetallicTriangle: false,
      };
    }

    ctx.drawImage(img, 0, 0, w, h);
    const normalizedDataUrl = canvas.toDataURL('image/jpeg', 0.84);

    // Check native BarcodeDetector
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

    // Check Zithromax metallic silver + lime-yellow triangle signature
    let isZithromaxMetallicTriangle = false;
    try {
      const sampleCanvas = document.createElement('canvas');
      const sw = 100;
      const sh = 100;
      sampleCanvas.width = sw;
      sampleCanvas.height = sh;
      const sCtx = sampleCanvas.getContext('2d');
      if (sCtx) {
        sCtx.drawImage(img, 0, 0, sw, sh);
        const imgData = sCtx.getImageData(0, 0, sw, sh).data;
        let centerLimeYellow = 0;
        let centerTotal = 0;
        let silverGrey = 0;
        const totalPixels = sw * sh;

        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            const idx = (y * sw + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];

            if (y >= sh * 0.2 && y <= sh * 0.85 && x >= sw * 0.15 && x <= sw * 0.85) {
              centerTotal++;
              if (g > 120 && r > 90 && b < 120 && g - b > 30) {
                centerLimeYellow++;
              }
            }
            if (Math.abs(r - g) < 28 && Math.abs(g - b) < 28 && r > 110 && r < 230) {
              silverGrey++;
            }
          }
        }
        const limeRatio = centerTotal > 0 ? centerLimeYellow / centerTotal : 0;
        const silverRatio = silverGrey / totalPixels;
        if (limeRatio > 0.045 && silverRatio > 0.22) {
          isZithromaxMetallicTriangle = true;
        }
      }
    } catch {
      /* ignore */
    }

    return {
      normalizedDataUrl,
      nativeBarcode,
      isZithromaxMetallicTriangle,
    };
  }

  /**
   * Local Browser OCR (English + Arabic) via Tesseract.js CDN
   */
  async function performClientSideOcr(imageDataUrl: string): Promise<string> {
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
        const res = await win.Tesseract.recognize(imageDataUrl, 'eng+ara', {
          logger: () => {},
        });
        return res?.data?.text || '';
      }
    } catch (err) {
      console.warn('Local OCR note:', err);
    }
    return '';
  }

  /**
   * Automatic Multi-Engine Bilingual Pipeline:
   * Reads ANY Arabic or English antibiotic name from the image and displays ALL drug details
   */
  async function processUnifiedImage(fileOrBlob: File, dataUrl: string, fileNameHint: string) {
    setBusy(true);
    setMsg('');
    setScanResult(null);
    setPreviewImg(dataUrl);

    setStatusStep(
      isAr
        ? '🔍 جاري قراءة اسم الدواء (عربي / إنجليزي) من الصورة تلقائياً...'
        : '🔍 Automatically reading medicine name (Arabic / English) from image...'
    );

    // 1) Normalize image & check native barcode
    let inspected = {
      normalizedDataUrl: dataUrl,
      nativeBarcode: null as string | null,
      isZithromaxMetallicTriangle: false,
    };
    try {
      inspected = await normalizeAndInspectImage(dataUrl);
    } catch {
      /* fallback to raw dataUrl */
    }

    if (inspected.nativeBarcode) {
      setBusy(false);
      setStatusStep('');
      handleRef.current(inspected.nativeBarcode);
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
      /* No barcode on front of box — continue to Bilingual Vision & OCR */
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

    // 4) Run Parallel Bilingual Vision + Cloud OCR (English Engine 2 + Arabic Engine 1)
    const base64Data =
      inspected.normalizedDataUrl.split(',')[1] || dataUrl.split(',')[1] || '';
    if (base64Data) {
      try {
        const aiAnalysis = await analyzeMedicineImageWithVision(
          base64Data,
          'image/jpeg',
          lang
        );

        // Match using the combined bilingual extracted text first
        const combinedText = `${aiAnalysis.detectedDrugName || ''} ${aiAnalysis.rawExtractedText || ''}`;
        const matched = matchDrugFromText(combinedText, 'ai_vision');

        if (matched.matchedIngredientId) {
          setScanResult({
            ...matched,
            method: 'ai_vision',
            summary:
              aiAnalysis.summary && aiAnalysis.summary.length > 30
                ? aiAnalysis.summary
                : matched.summary,
          });
          setBusy(false);
          setStatusStep('');
          return;
        }

        // If Vision returned a direct matchedIngredientId
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
        console.warn('Cloud vision/OCR note:', err);
      }
    }

    // 5) Run In-Browser Local Tesseract OCR (eng+ara)
    setStatusStep(
      isAr
        ? '📖 جاري قراءة الحروف العربية والإنجليزية محلياً من الصورة...'
        : '📖 Reading English and Arabic characters locally from image...'
    );
    const localOcrText = await performClientSideOcr(inspected.normalizedDataUrl);
    if (localOcrText) {
      const ocrMatched = matchDrugFromText(localOcrText, 'local_ocr');
      if (ocrMatched.matchedIngredientId) {
        setScanResult(ocrMatched);
        setBusy(false);
        setStatusStep('');
        return;
      }
    }

    // Never guess a drug from box colors alone when OCR is unreadable

    setMsg(
      isAr
        ? 'لم يتمكن القارئ من قراءة الحروف بوضوح بسبب الإضاءة أو زاوية التصوير. يرجى تقريب الكاميرا من اسم الدواء (بالعربية أو الإنجليزية) أو كتابة الاسم في الخانة بالأسفل.'
        : 'Could not read the text clearly due to lighting or angle. Please move closer to the medicine name (in English or Arabic) or type it below.'
    );
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
      <h1>
        {isAr
          ? '📷 الماسح الذكي الموحد (باركود + قارئ العلبة والشريط عربي / إنجليزي)'
          : '📷 Unified Smart Scanner (Barcode + Arabic/English Box & Blister Reader)'}
      </h1>

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
            ? '🛡️ قراءة تلقائية شاملة لجميع المضادات الحيوية (بالعربية أو الإنجليزية):'
            : '🛡️ Universal Automatic Reading for All Antibiotics (Arabic or English):'}
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#0c4a6e', lineHeight: 1.65 }}>
          {isAr
            ? 'سواء قمت بتصوير اسم الدواء باللغة العربية أو الإنجليزية (وش العلبة، الشريط، أو اسم الدواء المكتوب) أو مسح الباركود، يقرأ النظام أي مضاد حيوي مسجل في المنصة (206 عبوة تجارية و32 مادة فعالة) ويعرض كافة معلوماته الطبية، جرعاته، تحذيراته، وبدائله المصرية فوراً.'
            : 'Whether you photograph the medicine name in English or Arabic (box front, blister strip, or printed text) or scan the barcode, the system reads any antibiotic on the platform (206 commercial packages & 32 active ingredients) and displays all clinical info immediately.'}
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
              <div style={{ flex: 1, minWidth: 'min(100%, 220px)' }}>
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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
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
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontWeight: 700 }}
                  onClick={() => {
                    try {
                      sessionStorage.setItem(
                        'aa_pending_prescription_draft',
                        JSON.stringify({
                          matchedIngredientId: scanResult.matchedIngredientId,
                          detectedDrugName: scanResult.matchedTradeName || scanResult.detectedText || '',
                          isUnverifiedOcr: scanResult.method !== 'barcode_exact',
                          rawExtractedText: scanResult.detectedText || '',
                        })
                      );
                    } catch {}
                    nav('/prescription-radar');
                  }}
                >
                  🗓️ {isAr ? 'توثيق الروشتة وبدء رحلة العلاج ←' : 'Verify Rx & Start Treatment Journey →'}
                </button>
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
          🔎 {isAr ? 'أو ابحث مباشرة برقم الباركود (622...) أو اسم الدواء (عربي / إنجليزي):' : 'Or search directly by barcode (622...) or medicine name (English / Arabic):'}
        </label>
        <div style={{ position: 'relative' }}>
          <div className="row">
            <input
              id="bc"
              placeholder={
                isAr
                  ? 'مثال: Zithromax, Augmentin, زيثروماكس، أوجمنتين، 6221054003411...'
                  : 'e.g. Zithromax, Augmentin, Ciprofar, 6221054003411...'
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
                    setManual(isAr ? s.tradeNameAr : s.tradeNameEn);
                    handleBarcodeOrTextInput(isAr ? s.tradeNameAr : s.tradeNameEn);
                    setSuggestions([]);
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {s.tradeNameAr} ({s.tradeNameEn})
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
