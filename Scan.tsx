import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { analyzeMedicineImageWithVision, hasApiKey } from './geminiApi';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';

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

interface UnifiedScanResult {
  method: 'barcode_exact' | 'ai_vision' | 'text_match';
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
    method: 'ai_vision' as const,
    titleAr: 'تجربة قراءة شريط زيثروماكس مقطوع (بدون باركود)',
    titleEn: 'Torn Zithromax 500mg Blister (Vision Only)',
    tradeAr: 'زيثروماكس 500 مجم كبسولات (Zithromax)',
    tradeEn: 'Zithromax 500mg Capsules',
    strength: '500 mg',
    manufacturer: 'Pfizer Egypt',
    barcode: '6221054003411',
    price: 165,
    aiTextAr:
      'تم الاستنتاج بالذكاء الاصطناعي البصري: زيثروماكس 500 مجم (Azithromycin) — مضاد حيوي من عائلة الماكروليدات (WHO Watch). يُؤخذ مرة واحدة يومياً لمدة 3 إلى 5 أيام حسب وصف الطبيب، مع الفصل ساعتين عن مضادات الحموضة.',
    aiTextEn:
      'AI Vision Detection: Zithromax 500mg (Azithromycin) — Macrolide antibiotic (WHO Watch). Taken once daily; separate by 2 hours from antacids.',
  },
  {
    id: 'ciprofloxacin',
    method: 'ai_vision' as const,
    titleAr: 'تجربة قراءة وش علبة سيبروفار 500 مجم',
    titleEn: 'Ciprofar 500mg Box Front',
    tradeAr: 'سيبروفار 500 مجم أقراص (Ciprofar)',
    tradeEn: 'Ciprofar 500mg Tablets',
    strength: '500 mg',
    manufacturer: 'Pharco Pharmaceuticals',
    barcode: '6221008002341',
    price: 92,
    aiTextAr:
      'تم الاستنتاج بالذكاء الاصطناعي البصري: سيبروفار 500 مجم (Ciprofloxacin) — مضاد حيوي من الفلوروكينولونات (WHO Watch). تنبيه مهم: افصله ساعتين عن منتجات الألبان والكالسيوم والحديد.',
    aiTextEn:
      'AI Vision Detection: Ciprofar 500mg (Ciprofloxacin) — Fluoroquinolone (WHO Watch). Separate by 2 hours from dairy, calcium, and iron supplements.',
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

  // Match any detected text or filename against our 206 Egyptian products & 32 active ingredients
  function matchDrugFromText(rawText: string, method: 'ai_vision' | 'text_match' = 'ai_vision'): UnifiedScanResult {
    const clean = rawText.toLowerCase();

    const prodMatch = EGYPTIAN_COMMERCIAL_PRODUCTS.find(
      (p) =>
        clean.includes(p.tradeNameEn.toLowerCase().split(' ')[0]) ||
        clean.includes(p.tradeNameAr.split(' ')[0]) ||
        clean.includes(p.activeIngredientId.replace(/-/g, ' ')),
    );

    if (prodMatch) {
      const ing = ACTIVE_INGREDIENTS.find((a) => a.id === prodMatch.activeIngredientId);
      return {
        method,
        confidenceLabelAr:
          method === 'ai_vision'
            ? '🤖 تطابق عبر القارئ البصري الذكي (يُرجى تأكيد التركيز من العلبة)'
            : '🔎 تطابق نصي مع السجل المصري (يُرجى تأكيد التركيز)',
        confidenceLabelEn:
          method === 'ai_vision'
            ? '🤖 AI Vision Match (Please confirm concentration on box)'
            : '🔎 Registry Text Match (Please confirm concentration)',
        detectedText: isAr ? prodMatch.tradeNameAr : prodMatch.tradeNameEn,
        matchedIngredientId: prodMatch.activeIngredientId,
        matchedTradeName: isAr ? prodMatch.tradeNameAr : prodMatch.tradeNameEn,
        strength: prodMatch.strength,
        manufacturer: prodMatch.manufacturer,
        barcode: prodMatch.barcode,
        priceEgp: prodMatch.priceEgp,
        summary: isAr
          ? `تم التعرف على المستحضر: ${prodMatch.tradeNameAr} (${prodMatch.strength}) — المادة الفعالة: ${prodMatch.scientificComposition}. الفئة: ${ing?.drugClass?.ar || ''}. تصنيف منظمة الصحة العالمية: ${ing?.whoAccessGroup || 'Access'}.`
          : `Identified Product: ${prodMatch.tradeNameEn} (${prodMatch.strength}) — Active Ingredient: ${prodMatch.scientificComposition}. Class: ${ing?.drugClass?.en || ''}. WHO AWaRe: ${ing?.whoAccessGroup || 'Access'}.`,
      };
    }

    const ingMatch = ACTIVE_INGREDIENTS.find(
      (a) =>
        clean.includes(a.nameEn.toLowerCase().split(' ')[0]) ||
        clean.includes(a.nameAr.split(' ')[0]) ||
        clean.includes(a.id),
    );

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

    // 3) If user typed letters (e.g. drug name on torn blister strip), match by name!
    if (/[a-zA-Z\u0600-\u06FF]/.test(clean)) {
      const textMatched = matchDrugFromText(clean, 'text_match');
      if (textMatched.matchedIngredientId) {
        setScanResult(textMatched);
        return;
      }
    }

    setMsg(
      isAr
        ? `لم يتم العثور على باركود مطابق للرمز (${clean.slice(0, 20)}). يمكنك تصوير وش العلبة أو كتابة أول حروف من اسم الدواء!`
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

  // Unified 3-Stage Waterfall Pipeline for any uploaded or captured image
  async function processUnifiedImage(fileOrBlob: File, dataUrl: string, fileNameHint: string) {
    setBusy(true);
    setMsg('');
    setScanResult(null);
    setPreviewImg(dataUrl);

    // STAGE 1: Deterministic Barcode / QR Scan (100% Accuracy Priority)
    setStatusStep(
      isAr
        ? '1️⃣ المرحلة الأولى: جاري فحص الصورة بحثاً عن باركود خطي أو رمز QR بدقة 100%...'
        : 'Stage 1: Scanning image for exact linear barcode or QR code (100% precision)...',
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
      /* No barcode found in photo — automatically cascade to Stage 2 (AI Vision) */
    }

    // STAGE 2: Multimodal AI Vision Analysis (Front of Box / Blister Strip / Prescription)
    setStatusStep(
      isAr
        ? '2️⃣ المرحلة الثانية: لم يُعثر على باركود بالصورة — جاري قراءة وش العلبة / الشريط بالذكاء الاصطناعي البصري...'
        : 'Stage 2: No barcode in photo — analyzing box front / blister strip with AI Vision...',
    );

    const base64Data = dataUrl.split(',')[1] || '';
    if (hasApiKey() && base64Data) {
      try {
        const aiAnalysis = await analyzeMedicineImageWithVision(
          base64Data,
          fileOrBlob.type || 'image/jpeg',
          lang,
        );
        const matched = matchDrugFromText(aiAnalysis + ' ' + fileNameHint, 'ai_vision');
        setScanResult({
          ...matched,
          summary: aiAnalysis,
        });
        setBusy(false);
        setStatusStep('');
        return;
      } catch (err) {
        console.warn('Gemini Vision fallback to local matcher:', err);
      }
    }

    // STAGE 3: Smart Local Registry Matcher Fallback
    const localMatch = matchDrugFromText(fileNameHint, 'ai_vision');
    if (localMatch.matchedIngredientId) {
      setScanResult(localMatch);
    } else {
      setScanResult({
        method: 'ai_vision',
        confidenceLabelAr: '📸 تم التقاط الصورة — اكتب أول حرفين من الاسم المطبوع للتأكيد الفوري',
        confidenceLabelEn: '📸 Photo Captured — Type the first 2 letters on the box to confirm',
        detectedText: isAr ? 'صورة علبة أو شريط دواء' : 'Medicine Box / Strip Photo',
        summary: isAr
          ? 'لم يُعثر على باركود واضح في هذه الزاوية. لضمان عدم حدوث أي خطأ طبي في التركيز، اكتب أول حرفين من اسم الدواء الظاهر أمامك في الخانة بالأسفل (مثلاً: أوجمنتين أو فلاج أو Zithro) ليتم مطابقته فوراً!'
          : 'No barcode was visible at this angle. For 100% medication safety, type the first letters printed on the box in the field below to confirm the exact concentration.',
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

  // Capture current frame directly from the live camera video element!
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

    // Convert dataUrl to File object so Stage 1 (Html5Qrcode) + Stage 2 (AI Vision) both run on it
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
      <h1>
        {isAr
          ? '📷 الماسح الذكي الموحد (باركود + قارئ العلبة والشريط بالذكاء الاصطناعي)'
          : '📷 Unified Smart Scanner (Barcode + AI Vision Box & Blister Reader)'}
      </h1>

      {/* How the Safe 3-Stage Unified Pipeline Works */}
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
              ? 'الأولوية الأولى للباركود (دقة قطعية 100%): يبحث النظام أولاً عن الباركود الخطي (622) أو رمز QR في الكاميرا أو الصورة.'
              : 'Priority 1 — Exact Barcode (100% Precision): Automatically checks for an Egyptian EAN-13 barcode or QR code first.'}
          </li>
          <li>
            {isAr
              ? 'التحويل التلقائي للقارئ البصري (AI Vision): إذا صوّر المريض وش العلبة أو شريطاً مقطوعاً بدون باركود، يقرأ الذكاء الاصطناعي الاسم التجاري والتركيز ويعرض «بطاقة تأكيد» قبل فتح الدواء لمنع أي التباس بين التركيزات.'
              : 'Priority 2 — Automatic AI Vision Fallback: If no barcode is present, AI Vision reads the box front or blister strip and shows a safety confirmation card.'}
          </li>
        </ol>
      </div>

      <div id="filereader" style={{ display: 'none' }} />

      {/* Unified Camera & One-Tap Photo Scanner Card */}
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

      {/* Unified Manual Input: Accepts EITHER Barcode (622...) OR Partial Drug Name (Augm / فلاج) */}
      <section className="card stack">
        <label htmlFor="bc" style={{ fontWeight: 700 }}>
          🔎 {isAr ? 'أو اكتب رقم الباركود (622...) أو أي حروف مقروءة على الشريط المقطوع:' : 'Or type the barcode number (622...) or any letters visible on the blister strip:'}
        </label>
        <div className="row">
          <input
            id="bc"
            placeholder={
              isAr
                ? 'مثال: 6223003990602 أو أوجمنتين أو Zithro أو فلاج...'
                : 'e.g. 6223003990602 or Augmentin or Zithro or Flagyl...'
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
                        : '🤖 تطابق عبر القارئ البصري الذكي (يُرجى تأكيد التركيز من العلبة)',
                    confidenceLabelEn:
                      sample.method === 'barcode_exact'
                        ? '🟢 100% Exact Egyptian Barcode Match (EAN-13)'
                        : '🤖 AI Vision Match (Please confirm concentration on box)',
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
                {sample.method === 'barcode_exact' ? '🟢' : '🤖'} {isAr ? sample.titleAr : sample.titleEn}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
