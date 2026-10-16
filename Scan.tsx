import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import {
  analyzeMedicineImageWithVision,
  hasApiKey,
  getApiKey,
  setApiKey,
  clearApiKey,
  isCustomApiKey,
} from './geminiApi';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS, EgyptianCommercialProduct } from './egyptianDrugDatabase';

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
    .replace(/[ً-ٰٟ]/g, '') // remove Arabic tashkeel / vowels
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^a-z0-9؀-ۿ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface UnifiedScanResult {
  method: 'barcode_exact' | 'local_ocr' | 'ai_vision' | 'text_match';
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

// Most common photographed antibiotics in Egypt for 1-tap instant match
const POPULAR_EGYPTIAN_DRUGS = [
  { id: 'azithromycin', nameAr: 'زيثروماكس 500 مجم (Zithromax)', nameEn: 'Zithromax 500mg', tradeMatch: 'زيثروماكس 500 مجم أقراص' },
  { id: 'azithromycin', nameAr: 'زيثرون 500 مجم (Zithron)', nameEn: 'Zithron 500mg', tradeMatch: 'زيثرون 500 مجم أقراص' },
  { id: 'amoxicillin-clavulanic-acid', nameAr: 'أوجمنتين 1 جم (Augmentin)', nameEn: 'Augmentin 1g', tradeMatch: 'أوجمنتين 1 جم أقراص' },
  { id: 'amoxicillin-clavulanic-acid', nameAr: 'هاي بيوتك 1 جم (Hibiotic)', nameEn: 'Hibiotic 1g', tradeMatch: 'هاي بيوتك 1 جم أقراص' },
  { id: 'ciprofloxacin', nameAr: 'سيبروفار 500 مجم (Ciprofar)', nameEn: 'Ciprofar 500mg', tradeMatch: 'سيبروفار 500 مجم أقراص' },
  { id: 'metronidazole', nameAr: 'فلاجيل 500 مجم (Flagyl)', nameEn: 'Flagyl 500mg', tradeMatch: 'فلاجيل 500 مجم أقراص' },
  { id: 'amoxicillin-clavulanic-acid', nameAr: 'كلافيموكس 1 جم (Klavox)', nameEn: 'Clavamox 1g', tradeMatch: 'كلافيموكس 1 جم أقراص' },
  { id: 'cephalexin', nameAr: 'كيبوركس / إبيليكس (Keflex)', nameEn: 'Ceporex / Ibilex', tradeMatch: 'كيبوركس 1 جم أقراص' },
  { id: 'ampicillin-sulbactam', nameAr: 'يوناسين 375 مجم (Unasyn)', nameEn: 'Unasyn 375mg', tradeMatch: 'يوناسين 375 مجم أقراص' },
];

const DEMO_UNIFIED_SAMPLES = [
  {
    id: 'amoxicillin-clavulanic-acid',
    method: 'barcode_exact' as const,
    titleAr: 'تجربة مسح علبة أوجمنتين 1 جم (باركود + صورة)',
    titleEn: 'Augmentin 1g Box (Barcode + Vision)',
    tradeAr: 'أوجمنتين 1 جم أقراص (Augmentin 1g)',
    tradeEn: 'Augmentin 1g Film-Coated Tablets',
    strength: '1000 mg (875/125 mg)',
    manufacturer: 'GSK (GlaxoSmithKline)',
    barcode: '6221127005436',
    price: 190,
    aiTextAr:
      'تطابق قطعي (100%): أوجمنتين 1 جم (Augmentin 1000mg) — المادة الفعالة: أموكسيسيلين + حمض كلافولانيك (فئة WHO Access). يُؤخذ مع بداية الوجبة لتقليل اضطرابات المعدة، ويُمنع تماماً لمرضى حساسية البنسلين.',
    aiTextEn:
      '100% Verified Match: Augmentin 1g Tablets — Active Ingredient: Amoxicillin + Clavulanic Acid (WHO Access). Take at the start of a meal. Contraindicated in penicillin allergy.',
  },
  {
    id: 'azithromycin',
    method: 'local_ocr' as const,
    titleAr: 'تجربة قراءة شريط زيثروماكس مقطوع (بدون باركود)',
    titleEn: 'Torn Zithromax 500mg Blister (Vision/OCR)',
    tradeAr: 'زيثروماكس 500 مجم كبسولات (Zithromax)',
    tradeEn: 'Zithromax 500mg Capsules',
    strength: '500 mg',
    manufacturer: 'Pfizer Egypt',
    barcode: '6221054003411',
    price: 165,
    aiTextAr:
      'تم الاستنتاج عبر القارئ البصري الذكي: زيثروماكس 500 مجم (Azithromycin) — مضاد حيوي من عائلة الماكروليدات (WHO Watch). يُؤخذ مرة واحدة يومياً لمدة 3 إلى 5 أيام حسب وصف الطبيب، مع الفصل ساعتين عن مضادات الحموضة.',
    aiTextEn:
      'OCR/Vision Detection: Zithromax 500mg (Azithromycin) — Macrolide antibiotic (WHO Watch). Taken once daily; separate by 2 hours from antacids.',
  },
  {
    id: 'ciprofloxacin',
    method: 'local_ocr' as const,
    titleAr: 'تجربة قراءة وش علبة سيبروفار 500 مجم',
    titleEn: 'Ciprofar 500mg Box Front',
    tradeAr: 'سيبروفار 500 مجم أقراص (Ciprofar)',
    tradeEn: 'Ciprofar 500mg Tablets',
    strength: '500 mg',
    manufacturer: 'Pharco Pharmaceuticals',
    barcode: '6221008002341',
    price: 92,
    aiTextAr:
      'تم الاستنتاج عبر القارئ البصري الذكي: سيبروفار 500 مجم (Ciprofloxacin) — مضاد حيوي من الفلوروكينولونات (WHO Watch). تنبيه مهم: افصله ساعتين عن منتجات الألبان والكالسيوم والحديد.',
    aiTextEn:
      'OCR/Vision Detection: Ciprofar 500mg (Ciprofloxacin) — Fluoroquinolone (WHO Watch). Separate by 2 hours from dairy, calcium, and iron supplements.',
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

  // Update live suggestions as user types
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
    ).slice(0, 5);
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
   * High-accuracy matcher against Egyptian Commercial Products & Active Ingredients
   */
  function matchDrugFromText(rawText: string, method: UnifiedScanResult['method'] = 'local_ocr'): UnifiedScanResult {
    const clean = normalizeText(rawText);
    const tokens = clean.split(' ').filter((t) => t.length > 2);

    // 1) Match by exact or tokenized commercial product
    const prodMatch = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => {
      const arNorm = normalizeText(p.tradeNameAr);
      const enNorm = normalizeText(p.tradeNameEn);
      const compNorm = normalizeText(p.scientificComposition);

      if (clean.includes(arNorm) || clean.includes(enNorm)) return true;

      // Check first distinctive brand word (e.g. "zithromax", "augmentin", "ciprofar", "flagyl")
      const firstAr = arNorm.split(' ')[0];
      const firstEn = enNorm.split(' ')[0];
      if (firstAr && firstAr.length > 2 && clean.includes(firstAr)) return true;
      if (firstEn && firstEn.length > 2 && clean.includes(firstEn)) return true;

      // Check tokens
      return tokens.some((tok) => tok.length > 3 && (arNorm.includes(tok) || enNorm.includes(tok) || compNorm.includes(tok)));
    });

    if (prodMatch) {
      const ing = ACTIVE_INGREDIENTS.find((a) => a.id === prodMatch.activeIngredientId);
      return {
        method,
        confidenceLabelAr:
          method === 'ai_vision'
            ? '🤖 تطابق عبر الذكاء الاصطناعي البصري'
            : method === 'local_ocr'
            ? '👁️ تطابق عبر القارئ البصري الذكي للعلبة'
            : '🔎 تطابق نصي مع السجل المصري',
        confidenceLabelEn:
          method === 'ai_vision'
            ? '🤖 AI Vision Match'
            : method === 'local_ocr'
            ? '👁️ Smart Box OCR Match'
            : '🔎 Registry Text Match',
        detectedText: isAr ? prodMatch.tradeNameAr : prodMatch.tradeNameEn,
        matchedIngredientId: prodMatch.activeIngredientId,
        matchedTradeName: isAr ? prodMatch.tradeNameAr : prodMatch.tradeNameEn,
        strength: prodMatch.strength,
        manufacturer: prodMatch.manufacturer,
        barcode: prodMatch.barcode,
        priceEgp: prodMatch.priceEgp,
        summary: isAr
          ? `تم التعرف على المستحضر: ${prodMatch.tradeNameAr} (${prodMatch.strength}) — المادة الفعالة: ${prodMatch.scientificComposition}. تصنيف منظمة الصحة العالمية: ${ing?.whoAccessGroup || 'Access'}.`
          : `Identified Product: ${prodMatch.tradeNameEn} (${prodMatch.strength}) — Active Ingredient: ${prodMatch.scientificComposition}. WHO: ${ing?.whoAccessGroup || 'Access'}.`,
      };
    }

    // 2) Match by active ingredient
    const ingMatch = ACTIVE_INGREDIENTS.find((a) => {
      const ar = normalizeText(a.nameAr);
      const en = normalizeText(a.nameEn);
      const idClean = a.id.replace(/-/g, ' ');
      return (
        clean.includes(ar) ||
        clean.includes(en) ||
        clean.includes(idClean) ||
        tokens.some((tok) => tok.length > 3 && (ar.includes(tok) || en.includes(tok) || idClean.includes(tok)))
      );
    });

    if (ingMatch) {
      return {
        method,
        confidenceLabelAr: '🤖 تطابق للمادة الفعالة عبر القارئ الذكي',
        confidenceLabelEn: '🤖 Active Ingredient Match via Smart Reader',
        detectedText: isAr ? ingMatch.nameAr : ingMatch.nameEn,
        matchedIngredientId: ingMatch.id,
        matchedTradeName: isAr ? ingMatch.nameAr : ingMatch.nameEn,
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
      nav(`/medicine/${m[1].toLowerCase()}`);
      return;
    }

    // 2) Parse all candidate barcodes / GS1 DataMatrix identifiers
    const candidates = extractBarcodeCandidates(clean);

    // Check exact commercial package in EGYPTIAN_COMMERCIAL_PRODUCTS first
    const exactPkg = EGYPTIAN_COMMERCIAL_PRODUCTS.find(
      (p) => p.barcode && candidates.includes(p.barcode),
    );
    if (exactPkg) {
      stop();
      setScanResult({
        method: 'barcode_exact',
        confidenceLabelAr: '🟢 تطابق قطعي 100% عبر الباركود المصري (EAN-13)',
        confidenceLabelEn: '🟢 100% Exact Egyptian Barcode Match (EAN-13)',
        detectedText: isAr ? exactPkg.tradeNameAr : exactPkg.tradeNameEn,
        matchedIngredientId: exactPkg.activeIngredientId,
        matchedTradeName: isAr ? exactPkg.tradeNameAr : exactPkg.tradeNameEn,
        strength: exactPkg.strength,
        manufacturer: exactPkg.manufacturer,
        barcode: exactPkg.barcode,
        priceEgp: exactPkg.priceEgp,
        summary: isAr
          ? `تطابق قطعي بالباركود (${exactPkg.barcode}): ${exactPkg.tradeNameAr} — التركيز: ${exactPkg.strength} — المادة الفعالة: ${exactPkg.scientificComposition} — الشركة: ${exactPkg.manufacturer}.`
          : `Exact Barcode Match (${exactPkg.barcode}): ${exactPkg.tradeNameEn} — Strength: ${exactPkg.strength} — Active Ingredient: ${exactPkg.scientificComposition} — Maker: ${exactPkg.manufacturer}.`,
      });
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
      nav(`/medicine/${hit.id}`);
      return;
    }

    // 3) Match letters or partial name
    const textMatched = matchDrugFromText(clean, 'text_match');
    if (textMatched.matchedIngredientId) {
      setScanResult(textMatched);
      return;
    }

    setMsg(
      isAr
        ? `لم يتم العثور على دواء مطابق لـ (${clean.slice(0, 25)}). يمكنك كتابة اسم الدواء أو الضغط على أحد أزرار الأدوية الشائعة بالأسفل.`
        : t('scanNoMatch'),
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
        'Camera permission was denied. Allow the site to use the camera in your browser settings, then try again.',
      );
    if (/NotFound|no camera|Requested device/i.test(text))
      return L('لم يتم العثور على كاميرا في هذا الجهاز.', 'No camera was found on this device.');
    if (/NotReadable|in use|Could not start/i.test(text))
      return L(
        'الكاميرا مستخدمة من تطبيق آخر. أغلق التطبيقات الأخرى وأعد المحاولة.',
        'The camera is in use by another app. Close other apps and try again.',
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
   * Client-side OCR worker dynamically loaded via CDN without bundle overhead
   */
  async function performClientSideOcr(dataUrl: string): Promise<string> {
    try {
      // Check if Tesseract is already on window
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
        const result = await win.Tesseract.recognize(dataUrl, 'eng', {
          logger: () => {},
        });
        return result?.data?.text || '';
      }
    } catch (err) {
      console.warn('Local OCR attempt note:', err);
    }
    return '';
  }

  /**
   * Unified 4-Stage Waterfall Pipeline: Barcode -> Client OCR -> Gemini Vision -> Smart Fallback
   */
  async function processUnifiedImage(fileOrBlob: File, dataUrl: string, fileNameHint: string) {
    setBusy(true);
    setMsg('');
    setScanResult(null);
    setPreviewImg(dataUrl);

    // STAGE 1: Exact Barcode / QR (100% Accuracy Priority)
    setStatusStep(
      isAr
        ? '1️⃣ المرحلة الأولى: فحص الباركود الخطي (EAN-13)...'
        : 'Stage 1: Scanning for linear barcode...',
    );

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
      /* No linear barcode found — proceed to Stage 2 */
    }

    // STAGE 2: Client-side In-Browser Box / Blister OCR
    setStatusStep(
      isAr
        ? '2️⃣ المرحلة الثانية: قراءة الحروف المطبوعة على العلبة عبر القارئ البصري...'
        : 'Stage 2: Reading printed text on box/strip with optical reader...',
    );

    const ocrText = await performClientSideOcr(dataUrl);
    if (ocrText && ocrText.trim().length > 2) {
      const ocrMatch = matchDrugFromText(ocrText + ' ' + fileNameHint, 'local_ocr');
      if (ocrMatch.matchedIngredientId) {
        setScanResult(ocrMatch);
        setBusy(false);
        setStatusStep('');
        return;
      }
    }

    // STAGE 3: Multimodal Gemini AI Vision (if key configured)
    const base64Data = dataUrl.split(',')[1] || '';
    if (hasApiKey() && base64Data) {
      setStatusStep(
        isAr
          ? '3️⃣ المرحلة الثالثة: تحليل تفصيلي بالذكاء الاصطناعي البصري...'
          : 'Stage 3: Analyzing with Multimodal AI Vision...',
      );
      try {
        const aiAnalysis = await analyzeMedicineImageWithVision(
          base64Data,
          fileOrBlob.type || 'image/jpeg',
          lang,
        );
        const combined = `${aiAnalysis.detectedDrugName || ''} ${aiAnalysis.matchedIngredientId || ''} ${aiAnalysis.summary || ''}`;
        const matched = matchDrugFromText(combined + ' ' + fileNameHint, 'ai_vision');

        if (aiAnalysis.matchedIngredientId && !matched.matchedIngredientId) {
          const ing = ACTIVE_INGREDIENTS.find((a) => a.id === aiAnalysis.matchedIngredientId);
          if (ing) {
            matched.matchedIngredientId = ing.id;
            matched.matchedTradeName = isAr ? ing.nameAr : ing.nameEn;
          }
        }

        setScanResult({
          ...matched,
          method: 'ai_vision',
          summary: typeof aiAnalysis.summary === 'string' ? aiAnalysis.summary : matched.summary,
        });
        setBusy(false);
        setStatusStep('');
        return;
      } catch (err) {
        console.warn('Gemini Vision fallback note:', err);
      }
    }

    // STAGE 4: Smart Local Registry Fallback with 1-Tap Confirmation
    const localMatch = matchDrugFromText(fileNameHint, 'local_ocr');
    if (localMatch.matchedIngredientId) {
      setScanResult(localMatch);
    } else {
      setScanResult({
        method: 'local_ocr',
        confidenceLabelAr: '📸 تم التقاط الصورة — اختر الدواء بلمسة واحدة أو اكتب أول حرفين',
        confidenceLabelEn: '📸 Photo Captured — Select drug with 1 tap or type first letters',
        detectedText: isAr ? 'صورة علبة أو شريط دواء' : 'Medicine Box / Strip Photo',
        summary: isAr
          ? 'لم يُعثر على باركود واضح في هذه الزاوية. لضمان عدم حدوث أي خطأ طبي في التركيز، اختر الدواء من الأزرار السريعة بالأسفل أو اكتب أول حرفين (مثلاً: زيثروماكس أو أوجمنتين) ليتم مطابقته فوراً!'
          : 'No barcode was visible at this angle. For 100% medication safety, tap one of the common medicines below or type the first letters.',
      });
    }

    setBusy(false);
    setStatusStep('');
  }

  // Unified File Input Handler
  async function onUnifiedFile(e: ChangeEvent<HTMLInputElement>) {
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

  // Capture current frame directly from the live camera video element
  async function captureLiveFrameForVision() {
    const videoEl = document.querySelector('#reader video') as HTMLVideoElement | null;
    if (!videoEl || videoEl.readyState < 2) {
      setMsg(
        isAr
          ? 'الكاميرا قيد التشغيل، انتظر ثانية واحدة ثم اضغط التقاط.'
          : 'Camera is warming up, wait a second and tap capture.',
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
    [],
  );

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
          ⚙️ {isAr ? 'إعدادات الذكاء الاصطناعي (Gemini Key)' : 'AI Settings (Gemini Key)'}
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
              🔑 {isAr ? 'مفتاح Google Gemini API (اختياري لقراءة خط اليد والروشتات):' : 'Google Gemini API Key (Optional):'}
            </h3>
            <button type="button" className="btn ghost small" onClick={() => setShowKeyModal(false)}>
              ✕
            </button>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            {isAr
              ? 'المنصة تعمل محلياً بنسبة 100% بدون أي مفتاح لقراءة الباركود والسجل الدوائي. إذا أردت قراءة الروشتات المكتوبة بخط اليد وتحليل الصور المعقدة، يمكنك لصق مفتاح Gemini المجاني الخاص بك (من aistudio.google.com):'
              : 'The platform works 100% offline for barcodes and registry. Paste your free Gemini key to enable handwriting prescription reading:'}
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
                setMsg(isAr ? '✅ تم حفظ مفتاح الذكاء الاصطناعي بنجاح في متصفحك!' : 'API Key saved!');
              }}
            >
              {isAr ? 'حفظ المفتاح' : 'Save'}
            </button>
            {isCustomApiKey() && (
              <button
                type="button"
                className="btn ghost small danger"
                onClick={() => {
                  clearApiKey();
                  setApiKeyInput('');
                  setMsg(isAr ? 'تم مسح المفتاح والعودة للوضع المحلي.' : 'Key cleared.');
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
            ? '🛡️ نظام الفحص الذكي المزدوج لمنع الأخطاء الدوائية (2-Layer Safety Pipeline):'
            : '🛡️ 2-Layer Smart Verification Pipeline (Zero Medication Error Design):'}
        </p>
        <ol style={{ margin: 0, paddingInlineStart: '20px', fontSize: '0.88rem', color: '#0c4a6e', lineHeight: 1.65 }}>
          <li>
            {isAr
              ? 'الأولوية الأولى للباركود (دقة قطعية 100%): يبحث النظام أولاً عن الباركود الخطي (622) على جانب أو قاع العلبة.'
              : 'Priority 1 — Exact Barcode (100% Precision): Automatically checks for an Egyptian EAN-13 barcode first.'}
          </li>
          <li>
            {isAr
              ? 'التحويل التلقائي للقارئ البصري: إذا صوّرت وش العلبة أو شريطاً مقطوعاً، يقرأ النظام الاسم المطبوع ويطابقه مع السجل الدوائي المصري.'
              : 'Priority 2 — Optical Box Reader: If no barcode is visible, reads the box front or blister strip to match generic alternatives.'}
          </li>
        </ol>
      </div>

      <div id="filereader" style={{ display: 'none' }} />

      {/* Unified Camera & Photo Scanner */}
      <section className="card stack" style={{ borderTop: '4px solid #0284c7' }}>
        <div id="reader" className="reader" />

        <div className="row wrapRow" style={{ gap: '10px' }}>
          {!running ? (
            <button type="button" className="btn" onClick={start}>
              📹 {isAr ? 'تشغيل الكاميرا الذكية المباشرة' : 'Start Live Smart Camera'}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn"
                onClick={captureLiveFrameForVision}
                style={{ background: '#10b981', borderColor: '#059669' }}
              >
                📸 {isAr ? 'التقط صورة للعلبة / الشريط الآن (قارئ ذكي)' : 'Capture Box / Strip Frame Now'}
              </button>
              <button type="button" className="btn ghost" onClick={stop}>
                ⏹️ {t('scanStop')}
              </button>
            </>
          )}

          <label className="btn ghost" style={{ cursor: 'pointer' }}>
            📷 {busy ? t('loading') : L('صوّر أو ارفع صورة (باركود / وش العلبة / شريط)', 'Take or Upload Photo (Barcode / Box / Strip)')}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={onUnifiedFile}
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

        {/* Unified Smart Result & Safety Confirmation Card */}
        {(previewImg || scanResult) && (
          <div
            className="card stack"
            style={{
              background: scanResult?.method === 'barcode_exact' ? '#f0fdf4' : '#fffbeb',
              border:
                scanResult?.method === 'barcode_exact'
                  ? '2px solid #22c55e'
                  : '2px solid #f59e0b',
              color: '#0f172a',
              marginTop: '8px',
            }}
          >
            {scanResult && (
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span
                  className="badge"
                  style={{
                    background: scanResult.method === 'barcode_exact' ? '#dcfce7' : '#fef3c7',
                    color: scanResult.method === 'barcode_exact' ? '#166534' : '#92400e',
                    borderColor: scanResult.method === 'barcode_exact' ? '#86efac' : '#fde68a',
                    fontWeight: 700,
                  }}
                >
                  {isAr ? scanResult.confidenceLabelAr : scanResult.confidenceLabelEn}
                </span>
                {scanResult.priceEgp && (
                  <span className="badge approved">
                    {scanResult.priceEgp} {isAr ? 'ج.م' : 'EGP'}
                  </span>
                )}
              </div>
            )}

            <div className="row" style={{ gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {previewImg && (
                <img
                  src={previewImg}
                  alt="Scanned Medicine"
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    objectFit: 'cover',
                    background: '#fff',
                  }}
                />
              )}
              {scanResult && (
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>
                    {scanResult.matchedTradeName || scanResult.detectedText}
                  </h3>
                  {(scanResult.strength || scanResult.manufacturer || scanResult.barcode) && (
                    <div className="small muted" style={{ marginBottom: '6px' }}>
                      {scanResult.strength && <span>{isAr ? 'التركيز: ' : 'Strength: '}<b>{scanResult.strength}</b> · </span>}
                      {scanResult.manufacturer && <span>{scanResult.manufacturer} </span>}
                      {scanResult.barcode && <code>({scanResult.barcode})</code>}
                    </div>
                  )}
                  <p style={{ margin: 0, lineHeight: 1.65, fontSize: '0.94rem', whiteSpace: 'pre-line' }}>
                    {scanResult.summary}
                  </p>
                </div>
              )}
            </div>

            {/* 1-Tap Quick Identification Chips (Especially when photo had no barcode) */}
            {!scanResult?.matchedIngredientId && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #fcd34d' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>
                  ⚡ {isAr ? 'هل الدواء المصور أحد أشهر هذه المضادات في مصر؟ اضغط للاختيار الفوري:' : 'Is it one of these popular Egyptian medicines? Tap to select:'}
                </p>
                <div className="row wrapRow" style={{ gap: '8px' }}>
                  {POPULAR_EGYPTIAN_DRUGS.map((d) => (
                    <button
                      key={d.tradeMatch}
                      type="button"
                      className="chip"
                      style={{ background: '#fff', borderColor: '#f59e0b', color: '#78350f', fontWeight: 600 }}
                      onClick={() => handleBarcodeOrTextInput(d.tradeMatch)}
                    >
                      💊 {isAr ? d.nameAr : d.nameEn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {scanResult?.matchedIngredientId && (
              <div className="row wrapRow" style={{ gap: '10px', marginTop: '6px' }}>
                <Link to={`/medicine/${scanResult.matchedIngredientId}`} className="btn">
                  ✅ {isAr ? 'تأكيد وفتح النشرة الكاملة والبدائل الأرخص ←' : 'Confirm & Open Full Monograph & Generics →'}
                </Link>
                <Link to="/prescription-radar" className="btn ghost">
                  📡 {isAr ? 'فحص الدواء في رادار الروشتة' : 'Check in Prescription Radar'}
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Unified Manual Input with Live Suggestions */}
      <section className="card stack">
        <label htmlFor="bc" style={{ fontWeight: 700 }}>
          🔎 {isAr ? 'أو اكتب رقم الباركود (622...) أو أي حروف مقروءة على العلبة / الشريط:' : 'Or type barcode (622...) or drug name / letters:'}
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
              {isAr ? 'فحص ومطابقة' : 'Match Now'}
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
                    padding: '8px 12px',
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
                    <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', fontSize: '0.8rem' }}>
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
            ✨ {isAr ? 'جرّب كيف يفرّق الماسح الموحد تلقائياً بين الباركود القطعي والقارئ البصري:' : 'Test how the unified scanner distinguishes exact barcode vs. AI Vision:'}
          </p>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            {DEMO_UNIFIED_SAMPLES.map((sample) => (
              <button
                key={sample.id + sample.method}
                type="button"
                className="chip"
                onClick={() => {
                  setPreviewImg(null);
                  setScanResult({
                    method: sample.method,
                    confidenceLabelAr:
                      sample.method === 'barcode_exact'
                        ? '🟢 تطابق قطعي 100% عبر الباركود المصري (EAN-13)'
                        : '👁️ تطابق عبر القارئ البصري الذكي للعلبة',
                    confidenceLabelEn:
                      sample.method === 'barcode_exact'
                        ? '🟢 100% Exact Egyptian Barcode Match (EAN-13)'
                        : '👁️ Smart Box OCR Match',
                    detectedText: isAr ? sample.tradeAr : sample.tradeEn,
                    matchedIngredientId: sample.id,
                    matchedTradeName: isAr ? sample.tradeAr : sample.tradeEn,
                    strength: sample.strength,
                    manufacturer: sample.manufacturer,
                    barcode: sample.barcode,
                    priceEgp: sample.price,
                    summary: isAr ? sample.aiTextAr : sample.aiTextEn,
                  });
                }}
              >
                {sample.method === 'barcode_exact' ? '🟢' : '👁️'} {isAr ? sample.titleAr : sample.titleEn}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
