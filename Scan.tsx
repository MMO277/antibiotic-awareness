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

interface VisionMatchResult {
  detectedText: string;
  matchedIngredientId?: string;
  matchedTradeName?: string;
  priceEgp?: number | null;
  summary: string;
}

const DEMO_VISION_SAMPLES = [
  {
    id: 'amoxicillin-clavulanic-acid',
    titleAr: 'صورة علبة أوجمنتين 1 جم (Augmentin 1g)',
    titleEn: 'Augmentin 1g Box Sample',
    tradeAr: 'أوجمنتين 1 جم أقراص (Augmentin 1g)',
    tradeEn: 'Augmentin 1g Film-Coated Tablets',
    price: 190,
    aiTextAr:
      'تم التعرف على المستحضر: أوجمنتين 1 جم (Augmentin 1000mg) — المادة الفعالة: أموكسيسيلين + حمض كلافولانيك. مضاد حيوي واسع المجال من فئة البنسلينات المحمية (WHO Access). يُؤخذ مع بداية الوجبة لتقليل اضطرابات المعدة، ويُمنع تماماً لمرضى حساسية البنسلين.',
    aiTextEn:
      'Detected Product: Augmentin 1g Tablets — Active Ingredient: Amoxicillin + Clavulanic Acid (WHO Access). Take at the start of a meal to reduce GI upset. Contraindicated in penicillin allergy.',
  },
  {
    id: 'azithromycin',
    titleAr: 'صورة شريط زيثروماكس 500 مجم (Zithromax)',
    titleEn: 'Zithromax 500mg Blister Sample',
    tradeAr: 'زيثروماكس 500 مجم كبسولات (Zithromax)',
    tradeEn: 'Zithromax 500mg Capsules',
    price: 165,
    aiTextAr:
      'تم التعرف على المستحضر: زيثروماكس 500 مجم (Azithromycin) — مضاد حيوي من عائلة الماكروليدات (WHO Watch). يُؤخذ مرة واحدة يومياً لمدة 3 إلى 5 أيام حسب وصف الطبيب، مع الفصل ساعتين عن مضادات الحموضة.',
    aiTextEn:
      'Detected Product: Zithromax 500mg (Azithromycin) — Macrolide antibiotic (WHO Watch). Taken once daily; separate by 2 hours from aluminum/magnesium antacids.',
  },
  {
    id: 'ciprofloxacin',
    titleAr: 'صورة علبة سيبروفار 500 مجم (Ciprofar)',
    titleEn: 'Ciprofar 500mg Box Sample',
    tradeAr: 'سيبروفار 500 مجم أقراص (Ciprofar)',
    tradeEn: 'Ciprofar 500mg Tablets',
    price: 92,
    aiTextAr:
      'تم التعرف على المستحضر: سيبروفار 500 مجم (Ciprofloxacin) — مضاد حيوي من الفلوروكينولونات (WHO Watch). تنبيه مهم: يجب فصله ساعتين عن منتجات الألبان والكالسيوم والحديد، والتوقف فوراً حال الشعور بألم في الأوتار.',
    aiTextEn:
      'Detected Product: Ciprofar 500mg (Ciprofloxacin) — Fluoroquinolone (WHO Watch). Separate by 2 hours from dairy, calcium, and iron supplements.',
  },
  {
    id: 'metronidazole',
    titleAr: 'صورة علبة فلاجيل 500 مجم (Flagyl)',
    titleEn: 'Flagyl 500mg Box Sample',
    tradeAr: 'فلاجيل 500 مجم أقراص (Flagyl)',
    tradeEn: 'Flagyl 500mg Tablets',
    price: 47,
    aiTextAr:
      'تم التعرف على المستحضر: فلاجيل 500 مجم (Metronidazole) — مضاد للبكتيريا اللاهوائية والطفيليات (WHO Access). يُؤخذ مع الطعام لتقليل الطعم المعدني والغثيان.',
    aiTextEn:
      'Detected Product: Flagyl 500mg (Metronidazole) — Antianaerobic & antiprotozoal (WHO Access). Take with food to minimize metallic taste and nausea.',
  },
];

export default function Scan() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const L = (ar: string, en: string) => (isAr ? ar : en);
  const nav = useNavigate();
  const { items } = useApproved();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [activeTab, setActiveTab] = useState<'barcode' | 'vision'>('barcode');
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [manual, setManual] = useState('');

  // AI Vision state
  const [visionBusy, setVisionBusy] = useState(false);
  const [visionPreview, setVisionPreview] = useState<string | null>(null);
  const [visionResult, setVisionResult] = useState<VisionMatchResult | null>(null);
  const [visionQuery, setVisionQuery] = useState('');

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

  function handle(text: string) {
    const clean = text.trim();

    const m = clean.match(/#\/medicine\/([a-z0-9-]+)/i);
    if (m) {
      stop();
      nav(`/medicine/${m[1].toLowerCase()}`);
      return;
    }

    const candidates = extractBarcodeCandidates(clean);

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
    } else {
      setMsg(
        isAr
          ? `لم يتم العثور على دواء مطابق للرمز (${clean.slice(0, 20)}${clean.length > 20 ? '...' : ''}). يمكنك تجربة تبويب «قارئ صورة العلبة بالذكاء الاصطناعي» بالاعلى!`
          : t('scanNoMatch'),
      );
    }
  }

  const handleRef = useRef(handle);
  handleRef.current = handle;

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

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg('');
    setBusy(true);
    try {
      if (scannerRef.current) await stop();
      const s = new Html5Qrcode('filereader', false);
      const text = await s.scanFile(file, false);
      try {
        s.clear();
      } catch {
        /* nothing to clear */
      }
      handleRef.current(text);
    } catch {
      setMsg(
        L(
          'لم أجد باركود واضحاً في الصورة. جرب تبويب «قارئ صورة العلبة بالذكاء الاصطناعي» لقراءة اسم الدواء من وش العلبة أو الشريط مباشرة!',
          'No barcode was found in the photo. Try the “AI Vision Box & Prescription Reader” tab to read the front of the box or blister strip!',
        ),
      );
    }
    setBusy(false);
  }

  // Match any detected text or filename against our 206 Egyptian products & 32 active ingredients
  function matchDrugFromText(rawText: string): VisionMatchResult {
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
        detectedText: isAr ? prodMatch.tradeNameAr : prodMatch.tradeNameEn,
        matchedIngredientId: prodMatch.activeIngredientId,
        matchedTradeName: isAr ? prodMatch.tradeNameAr : prodMatch.tradeNameEn,
        priceEgp: prodMatch.priceEgp,
        summary: isAr
          ? `تم التعرف على: ${prodMatch.tradeNameAr} (${prodMatch.strength}) — المادة الفعالة: ${prodMatch.scientificComposition}. الفئة: ${ing?.classLabel.ar || ''}. تصنيف منظمة الصحة العالمية: ${ing?.whoAware || 'Access'}.`
          : `Identified: ${prodMatch.tradeNameEn} (${prodMatch.strength}) — Active Ingredient: ${prodMatch.scientificComposition}. Class: ${ing?.classLabel.en || ''}. WHO AWaRe: ${ing?.whoAware || 'Access'}.`,
      };
    }

    const ingMatch = ACTIVE_INGREDIENTS.find(
      (a) =>
        clean.includes(a.genericName.en.toLowerCase().split(' ')[0]) ||
        clean.includes(a.genericName.ar.split(' ')[0]) ||
        clean.includes(a.id),
    );

    if (ingMatch) {
      return {
        detectedText: isAr ? ingMatch.genericName.ar : ingMatch.genericName.en,
        matchedIngredientId: ingMatch.id,
        matchedTradeName: isAr ? ingMatch.genericName.ar : ingMatch.genericName.en,
        summary: isAr
          ? `تم التعرف على المادة الفعالة: ${ingMatch.genericName.ar} (${ingMatch.genericName.en}) — الفئة: ${ingMatch.classLabel.ar} (WHO ${ingMatch.whoAware}).`
          : `Identified Active Ingredient: ${ingMatch.genericName.en} — Class: ${ingMatch.classLabel.en} (WHO ${ingMatch.whoAware}).`,
      };
    }

    return {
      detectedText: rawText,
      summary: rawText,
    };
  }

  async function onVisionFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setVisionBusy(true);
    setVisionResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      setVisionPreview(dataUrl);
      const base64Data = dataUrl.split(',')[1] || '';

      // 1) Try reading barcode first just in case the image also has a barcode
      try {
        const s = new Html5Qrcode('filereader', false);
        const bcText = await s.scanFile(file, false);
        s.clear();
        if (bcText) {
          const candidates = extractBarcodeCandidates(bcText);
          const hit = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.barcode && candidates.includes(p.barcode));
          if (hit) {
            setVisionResult({
              detectedText: isAr ? hit.tradeNameAr : hit.tradeNameEn,
              matchedIngredientId: hit.activeIngredientId,
              matchedTradeName: isAr ? hit.tradeNameAr : hit.tradeNameEn,
              priceEgp: hit.priceEgp,
              summary: isAr
                ? `تم قراءة الباركود والعلبة بنجاح: ${hit.tradeNameAr} — السعر الرسمي: ${hit.priceEgp || '—'} ج.م — الشركة: ${hit.manufacturer}.`
                : `Successfully identified box & barcode: ${hit.tradeNameEn} — Official Price: ${hit.priceEgp || '—'} EGP — Maker: ${hit.manufacturer}.`,
            });
            setVisionBusy(false);
            return;
          }
        }
      } catch {
        /* Proceed to AI Vision */
      }

      // 2) If Gemini Vision API is configured, analyze the box/prescription photo directly
      if (hasApiKey() && base64Data) {
        try {
          const aiAnalysis = await analyzeMedicineImageWithVision(base64Data, file.type || 'image/jpeg', lang);
          const matched = matchDrugFromText(aiAnalysis + ' ' + file.name);
          setVisionResult({
            ...matched,
            summary: aiAnalysis,
          });
          setVisionBusy(false);
          return;
        } catch (err) {
          console.warn('Gemini Vision fallback to smart matcher:', err);
        }
      }

      // 3) Smart local filename / OCR hint matcher fallback
      const localMatch = matchDrugFromText(file.name);
      if (localMatch.matchedIngredientId) {
        setVisionResult(localMatch);
      } else {
        setVisionResult({
          detectedText: file.name,
          summary: isAr
            ? 'تم رفع صورة العلبة بنجاح! نظراً لأنك في الوضع المحلي (Offline)، يمكنك كتابة أول حرفين من الاسم المطبوع على العلبة أو اختيار نموذج من الأسفل لمطابقته فوراً مع الـ 206 عبوات المصرية.'
            : 'Box photo uploaded! In offline mode, type the first letters printed on the box below or pick a sample to match against all 206 Egyptian packages.',
        });
      }
      setVisionBusy(false);
    };
    reader.readAsDataURL(file);
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
          ? '📷 الماسح الذكي وقارئ العلبة بالذكاء الاصطناعي'
          : '📷 Smart Barcode & AI Vision Box Scanner'}
      </h1>

      {/* Mode Switcher Tabs */}
      <div className="row wrapRow" style={{ gap: '10px', marginBottom: '8px' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'barcode' ? '' : 'ghost'}`}
          onClick={() => setActiveTab('barcode')}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          📷 {isAr ? 'مسح الباركود الخطي ورموز QR' : 'Linear Barcode & QR Scanner'}
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'vision' ? '' : 'ghost'}`}
          onClick={() => {
            if (running) stop();
            setActiveTab('vision');
          }}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          🤖 {isAr ? 'قارئ وش العلبة والروشتة (AI Vision)' : 'AI Vision Box & Rx Reader'}
        </button>
      </div>

      <div id="filereader" style={{ display: 'none' }} />

      {activeTab === 'barcode' ? (
        <>
          <div
            className="notice tip"
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              margin: '6px 0 12px',
              border: '1px solid #bae6fd',
              background: '#f0f9ff',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.96rem', color: '#0369a1', fontWeight: 600 }}>
              {isAr
                ? '💡 إرشاد للمريض: وجّه الكاميرا نحو «الباركود الخطي» (الخطوط الطولية على ظهر العلبة)، أو انتقل إلى تبويب «قارئ وش العلبة بالذكاء الاصطناعي» لتصوير اسم الدواء مباشرة!'
                : '💡 Tip: Point your camera at the linear barcode on the box, or switch to the “AI Vision Box Reader” tab to photograph the front of the box or blister strip!'}
            </p>
          </div>

          <div id="reader" className="reader" />

          <div className="row wrapRow">
            {!running ? (
              <button className="btn" onClick={start}>
                {t('scanStart')}
              </button>
            ) : (
              <button className="btn ghost" onClick={stop}>
                {t('scanStop')}
              </button>
            )}
            <label className="btn ghost" style={{ cursor: 'pointer' }}>
              {busy ? t('loading') : L('مسح باركود من صورة', 'Scan barcode from photo')}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} disabled={busy} />
            </label>
          </div>

          {msg && <p className="alert">{msg}</p>}

          <div className="card">
            <label htmlFor="bc">{isAr ? 'أو أدخل رقم الباركود / كود العلبة يدوياً:' : t('scanManual')}</label>
            <div className="row">
              <input
                id="bc"
                dir="ltr"
                placeholder={isAr ? 'مثال: 6223003990602' : 'e.g. 6223003990602'}
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manual.trim()) {
                    handle(manual);
                  }
                }}
              />
              <button className="btn" onClick={() => manual.trim() && handle(manual)}>
                {t('scanGo')}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* TAB 2: AI VISION BOX & PRESCRIPTION SCANNER */
        <section className="card stack" style={{ borderTop: '4px solid #0284c7' }}>
          <div>
            <span className="badge approved" style={{ marginBottom: '6px', display: 'inline-block' }}>
              🤖 {isAr ? 'الذكاء الاصطناعي البصري (Gemini Vision)' : 'Multimodal AI Vision'}
            </span>
            <h2 style={{ margin: '4px 0 6px' }}>
              {isAr
                ? 'صوّر وش علبة الدواء أو الشريط المقطوع أو الروشتة'
                : 'Photograph the Medicine Box Front, Blister Strip, or Prescription'}
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? 'حتى لو العلبة مقطوعة أو معاك شريط واحد بدون كرتونة أو روشتة، ارفع صورتها أو التقط صورة بالكاميرا ليتعرف الذكاء الاصطناعي على الاسم التجاري والمادة الفعالة والجرعة.'
                : 'Even if you only have a single blister strip without a box or a prescription, take a photo and our AI Vision engine will identify the trade name, active ingredient, and safety rules.'}
            </p>
          </div>

          {/* Upload / Camera Capture Box */}
          <div
            style={{
              border: '2px dashed #0284c7',
              borderRadius: '14px',
              padding: '22px',
              textAlign: 'center',
              background: 'var(--bg-subtle, #f8fafc)',
            }}
          >
            <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>📸💊</div>
            <p style={{ fontWeight: 700, margin: '0 0 12px' }}>
              {isAr
                ? 'التقط صورة لوش العلبة / الشريط أو اختر صورة من هاتفك'
                : 'Take a photo of the box/blister or upload an image from your phone'}
            </p>
            <label className="btn" style={{ cursor: 'pointer', display: 'inline-flex', gap: '8px' }}>
              <span>📷 {visionBusy ? (isAr ? 'جاري تحليل الصورة...' : 'Analyzing image...') : isAr ? 'تصوير العلبة / رفع صورة الآن' : 'Capture / Upload Photo Now'}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={onVisionFile}
                disabled={visionBusy}
              />
            </label>
          </div>

          {/* Instant Text / Partial Blister Name Matcher */}
          <div className="card" style={{ background: 'var(--bg-subtle, #f8fafc)' }}>
            <label htmlFor="vision-text" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              🔎 {isAr ? 'أو اكتب أي حروف مقروءة على الشريط المقطوع أو الروشتة:' : 'Or type any visible letters on the torn blister strip or prescription:'}
            </label>
            <div className="row">
              <input
                id="vision-text"
                value={visionQuery}
                onChange={(e) => setVisionQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: Augm أو Zithro أو فلاج أو سيبرو...'
                    : 'e.g. Augm, Zithro, Flagyl, Cipro...'
                }
              />
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (visionQuery.trim()) {
                    setVisionResult(matchDrugFromText(visionQuery.trim()));
                  }
                }}
              >
                {isAr ? 'تحليل فوري' : 'Analyze Now'}
              </button>
            </div>
          </div>

          {/* Quick Interactive Demo Samples */}
          <div>
            <p className="small muted" style={{ marginBottom: '8px', fontWeight: 600 }}>
              ✨ {isAr ? 'أو جرّب محاكاة القارئ البصري فوراً على نماذج العلب المصرية:' : 'Or test the AI Vision Reader instantly on sample Egyptian boxes:'}
            </p>
            <div className="row wrapRow" style={{ gap: '8px' }}>
              {DEMO_VISION_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setVisionPreview(null);
                    setVisionResult({
                      detectedText: isAr ? sample.tradeAr : sample.tradeEn,
                      matchedIngredientId: sample.id,
                      matchedTradeName: isAr ? sample.tradeAr : sample.tradeEn,
                      priceEgp: sample.price,
                      summary: isAr ? sample.aiTextAr : sample.aiTextEn,
                    });
                  }}
                >
                  📦 {isAr ? sample.titleAr : sample.titleEn}
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview & AI Vision Output Card */}
          {(visionPreview || visionResult) && (
            <div
              className="card stack"
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                color: '#064e3b',
              }}
            >
              {visionPreview && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={visionPreview}
                    alt="Scanned Medicine"
                    style={{
                      maxHeight: '180px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              )}

              {visionResult && (
                <>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, color: '#065f46' }}>
                      ✅ {visionResult.matchedTradeName || visionResult.detectedText}
                    </h3>
                    {visionResult.priceEgp && (
                      <span className="badge approved">
                        {visionResult.priceEgp} {isAr ? 'ج.م' : 'EGP'}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '6px 0', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{visionResult.summary}</p>
                  {visionResult.matchedIngredientId && (
                    <div className="row wrapRow" style={{ gap: '10px', marginTop: '6px' }}>
                      <Link to={`/medicine/${visionResult.matchedIngredientId}`} className="btn">
                        💊 {isAr ? 'فتح النشرة الكاملة والبدائل الأرخص ←' : 'Open Full Monograph & Cheaper Generics →'}
                      </Link>
                      <Link to="/prescription-radar" className="btn ghost">
                        📡 {isAr ? 'تنظيم مواعيد هذا الدواء في رادار الروشتة' : 'Schedule in Prescription Radar'}
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
