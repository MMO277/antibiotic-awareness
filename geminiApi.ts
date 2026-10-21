// geminiApi.ts - Multi-Engine Bilingual AI Vision & Clean Clinical Assistant

const BUILTIN_KEY = '';

export function getApiKey(): string {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('gemini_api_key') || BUILTIN_KEY).trim();
  }
  return BUILTIN_KEY;
}

export function hasApiKey(): boolean {
  return true;
}

export function setApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem('gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }
}

export function clearApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gemini_api_key');
  }
}

export function isCustomApiKey(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('gemini_api_key');
  }
  return false;
}

/**
 * Cleans any raw LLM Markdown (tables, **, ###, ---, < >) into crisp, readable,
 * well-spaced medical text with clean bullet points and numbered sections.
 */
export function cleanAssistantMarkdown(raw: string): string {
  if (!raw) return '';
  const preSplit = raw
    .replace(/\|\s*\|/g, '\n|')
    .replace(/\s*#{2,6}\s*/g, '\n### ')
    .replace(/\s*---+\s*/g, '\n')
    .replace(/\s+-\s+(?=\*\*)/g, '\n• ')
    .replace(/\s+(?=\d+\.\s)/g, '\n');
  const lines = preSplit.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (let line of lines) {
    let s = line.trim();
    if (!s) {
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
        cleanedLines.push('');
      }
      continue;
    }

    // Skip markdown horizontal rules or table separator rows (e.g., |---|---| or ---)
    if (/^[-=_*|:\s]+$/.test(s)) {
      continue;
    }

    // Convert markdown table rows (| col1 | col2 | col3 |) into clean readable bullet lines
    if (s.includes('|')) {
      const cells = s
        .split('|')
        .map((c) => c.replace(/\*\*/g, '').replace(/[<>*#`_]/g, '').trim())
        .filter(Boolean);
      if (cells.length === 0) continue;
      // Skip table header rows that just say "نوع العدوى | المضاد الحيوي..."
      if (
        cells.some(
          (c) =>
            c === 'نوع العدوى' ||
            c === 'الاسم العلمي' ||
            c === 'طريقة العمل المختصرة' ||
            c.toLowerCase() === 'first-line'
        ) &&
        cells.length >= 3
      ) {
        continue;
      }
      s = '• ' + cells.join(' — ');
    }

    // Strip markdown headings (###, ##, #) and add a blank line before section headers
    if (/^#{1,6}\s+/.test(s)) {
      s = s.replace(/^#{1,6}\s+/, '').trim();
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
        cleanedLines.push('');
      }
      if (!s.endsWith(':')) s += ':';
    }

    // Remove raw **, __, `, and stray < > brackets
    s = s
      .replace(/\*\*/g, '')
      .replace(/__/g, '')
      .replace(/`/g, '')
      .replace(/<\s*>/g, '')
      .replace(/[<>]/g, '')
      .trim();

    // Normalize leading bullet markers (- or * at start of line) to •
    s = s.replace(/^[-*]\s+/, '• ');

    // Ensure inline numbered items or bullets that got squished onto one line are split cleanly
    s = s
      .replace(/\s+(?=\d+\.\s)/g, '\n')
      .replace(/\s+(?=•\s)/g, '\n')
      .replace(/\s+(?=⚠️)/g, '\n\n');

    for (const sub of s.split('\n')) {
      const trimmedSub = sub.trim();
      if (trimmedSub) {
        cleanedLines.push(trimmedSub);
      }
    }
  }

  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export const SYSTEM_PROMPT = `أنت المساعد الصيدلاني والطبي الذكي لـ «منصة الوعي بالمضادات الحيوية» (Antibiotic Awareness Platform).
مهمتك: تقديم إجابات طبية ودوائية دقيقة، واضحة، ومرتبة بشكل مريح للعين بدون أي رموز برمجية أو جداول معقدة.

قواعد تنسيق الإجابة (إلزامية جداً):
1. ممنوع منعاً باتاً استخدام جداول Markdown (ممنوع استخدام الرمز | أو |---|---|).
2. ممنوع منعاً باتاً استخدام نجوم التغميق ** أو علامات الشباك ### أو الخطوط --- أو الأقواس < >.
3. اكتب الإجابة في فقرات قصيرة ومفصولة بسطر فارغ، واستخدم الترقيم الواضح (1. ، 2. ، 3.) أو النقاط (•) لترتيب المعلومات.
4. إذا سأل المستخدم عن المضاد الحيوي المناسب لعدوى معينة (مثل الأسنان، المسالك البولية، التهاب اللوز، الجيوب الأنفية، الجلد، الأذن):
   - اذكر الخيارات العلمية المعتمدة كخط أول (First-line) في نقاط مرقمة واضحة (الاسم العلمي والاسم التجاري الشائع في مصر مثل أوجمنتين، فلاجيل، زيثروماكس، دالاسين، ماكروفيوران، كيبوركس).
   - اشرح باختصار سبب اختيار كل دواء.
   - اختم بفقرة تبدأ برمز ⚠️ تحتوي على أهم التنبيهات الطبية وضرورة مراجعة الطبيب أو الصيدلي لتحديد الجرعة والتأكد من عدم وجود حساسية.
5. في حالات الطوارئ الحادة (صعوبة التنفس، تورم الوجه واللسان، الإغماء)، وجه المستخدم فوراً للاتصال بالإسعاف المصري (123).`;

export interface ChatMessage {
  who: 'me' | 'bot';
  text: string;
}

export async function askGemini(
  question: string,
  history: ChatMessage[] = []
): Promise<string> {
  const key = getApiKey();

  if (key && key.startsWith('AIza')) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
      const recentHistory = history.slice(-6);
      const contents = [
        ...recentHistory.map((m) => ({
          role: m.who === 'me' ? 'user' : 'model',
          parts: [{ text: m.text }],
        })),
        {
          role: 'user',
          parts: [{ text: question }],
        },
      ];

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.25, maxOutputTokens: 700 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return cleanAssistantMarkdown(reply);
      }
    } catch {
      /* fallback to keyless endpoint */
    }
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6).map((m) => ({
      role: m.who === 'me' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: question },
  ];

  const res = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai',
      messages,
      temperature: 0.25,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error('EMPTY_RESPONSE');
  return cleanAssistantMarkdown(text);
}

export interface VisionAnalysisResult {
  detectedDrugName: string;
  matchedIngredientId: string | null;
  summary: string;
  rawExtractedText: string;
}

const VISION_DRUG_IDS =
  'amoxicillin-clavulanic-acid, amoxicillin, ampicillin-sulbactam, flucloxacillin, penicillin-v-potassium, cephalexin, cefadroxil, cefuroxime, cefixime, cefdinir, ceftriaxone, cefotaxime, cefoperazone-sulbactam, cefepime, azithromycin, clarithromycin, erythromycin, ciprofloxacin, levofloxacin, moxifloxacin, doxycycline, clindamycin, metronidazole, nitrofurantoin, co-trimoxazole, gentamicin, amikacin, meropenem, vancomycin, linezolid, fusidic-acid, rifaximin';

const KNOWN_INGREDIENT_SLUGS = new Set(
  VISION_DRUG_IDS.split(',').map((s) => s.trim().toLowerCase())
);

const DRUG_KEYWORD_TO_ID: Array<{ pattern: RegExp; id: string; label: string }> = [
  { pattern: /(augmentin|hibiotic|\bcuram\b|megamox|amoxicillin\s*\+?\s*clav|اوجمنتين|أوجمنتين|هاي\s*بيوتك|كيورام|ميجاموكس)/i, id: 'amoxicillin-clavulanic-acid', label: 'Augmentin / Amoxicillin-Clavulanate (أوجمنتين)' },
  { pattern: /(amoxicillin|amoxil|\be-mox\b|\bemox\b|biomox|اموكسيسيلين|أموكسيسيلين|اموكسيل|ايموكس)/i, id: 'amoxicillin', label: 'Amoxicillin (أموكسيسيلين)' },
  { pattern: /(unasyn|ampicillin\s*\+?\s*sulbactam|يوناسين|امبيسيلين)/i, id: 'ampicillin-sulbactam', label: 'Unasyn / Ampicillin-Sulbactam (يوناسين)' },
  { pattern: /(floxamo|flucil|flucloxacillin|فلوكسامو|فلوسيل|فلوكلوكساسيللين)/i, id: 'flucloxacillin', label: 'Flucloxacillin (فلوكسامو)' },
  { pattern: /(\bospen\b|penicillin\s*v|اوسبن|أوسبن|بنسلين)/i, id: 'penicillin-v-potassium', label: 'Penicillin V / Ospen (أوسبن)' },
  { pattern: /(ceporex|ospexin|keflex|cephalexin|كيبوركس|اوسبكسين|سيفالكسين)/i, id: 'cephalexin', label: 'Cephalexin / Ceporex (كيبوركس)' },
  { pattern: /(duricef|biodroxil|cefadroxil|ديوريسيف|بيودروكسيل|سيفادروكسيل)/i, id: 'cefadroxil', label: 'Cefadroxil / Duricef (ديوريسيف)' },
  { pattern: /(zinnat|cefuroxime|زينات|سيفوروكسيم)/i, id: 'cefuroxime', label: 'Cefuroxime / Zinnat (زينات)' },
  { pattern: /(suprax|magnacef|ximacef|cefixime|سوبراكس|ماجناسيف|سيفيكسيم)/i, id: 'cefixime', label: 'Cefixime / Suprax (سوبراكس)' },
  { pattern: /(omnicef|\bdinar\b|cefdinir|اومنيسيف|أومنيسيف|دينار|سيفدينير)/i, id: 'cefdinir', label: 'Cefdinir / Omnicef (أومنيسيف)' },
  { pattern: /(rocephin|epicephin|cefaxone|ceftriaxone|روسيفين|ابيسفين|إبيسفين|سيفاكسون|سيفترياكسون)/i, id: 'ceftriaxone', label: 'Ceftriaxone / Rocephin (روسيفين)' },
  { pattern: /(cefotax|claforan|cefotaxime|سيفوتاكس|كلافوران|سيفوتاكسيم)/i, id: 'cefotaxime', label: 'Cefotaxime / Cefotax (سيفوتاكس)' },
  { pattern: /(sulperazon|cefoperazone|سيلبيرازون|سيفوبيرازون)/i, id: 'cefoperazone-sulbactam', label: 'Cefoperazone-Sulbactam / Sulperazon (سيلبيرازون)' },
  { pattern: /(maxipime|cefepime|ماكسيبيم|سيفيبيم)/i, id: 'cefepime', label: 'Cefepime / Maxipime (ماكسيبيم)' },
  { pattern: /(zithromax|xithrone|azithromycin|delzosin|زيثروماكس|زيثرون|ازيثرومايسين|أزيثرومايسين)/i, id: 'azithromycin', label: 'Azithromycin / Zithromax (زيثروماكس)' },
  { pattern: /(klacid|clarithromycin|كلاسيد|كلاريثرومايسين)/i, id: 'clarithromycin', label: 'Clarithromycin / Klacid (كلاسيد)' },
  { pattern: /(erythrocin|erythromycin|اريثروسين|إريثرومايسين)/i, id: 'erythromycin', label: 'Erythromycin (إريثرومايسين)' },
  { pattern: /(ciprofar|ciprobay|ciprofloxacin|ciprocin|سيبروفار|سيبروباي|سيبروفلوكساسين)/i, id: 'ciprofloxacin', label: 'Ciprofloxacin / Ciprofar (سيبروفار)' },
  { pattern: /(tavanic|levoxin|tarivid|levofloxacin|تافانيك|ليفوكسين|ليفوفلوكساسين)/i, id: 'levofloxacin', label: 'Levofloxacin / Tavanic (تافانيك)' },
  { pattern: /(avelox|moxifloxacin|افيلوكس|أفيلوكس|موكسيفلوكساسين)/i, id: 'moxifloxacin', label: 'Moxifloxacin / Avelox (أفيلوكس)' },
  { pattern: /(vibramycin|tabocin|doxycycline|فيبراميسين|تابوسين|دوكسيسيكلين)/i, id: 'doxycycline', label: 'Doxycycline / Vibramycin (تابوسين)' },
  { pattern: /(dalacin|clindamycin|clindam|دالاسين|كليندامايسين)/i, id: 'clindamycin', label: 'Clindamycin / Dalacin C (دالاسين)' },
  { pattern: /(flagyl|amrizole|metronidazole|فلاجيل|امريزول|أمريزول|ميترونيدازول)/i, id: 'metronidazole', label: 'Metronidazole / Flagyl (فلاجيل)' },
  { pattern: /(macrofuran|uvamin|nitrofurantoin|ماكروفيوران|يوفامين|نيتروفورانتوين)/i, id: 'nitrofurantoin', label: 'Nitrofurantoin / Macrofuran (ماكروفيوران)' },
  { pattern: /(septazole|sutrim|septrin|co-trimoxazole|trimethoprim|سبتازول|سوتريم|كوتريموكسازول)/i, id: 'co-trimoxazole', label: 'Co-trimoxazole / Septazole (سبتازول)' },
  { pattern: /(garamycin|gentamicin|جاراميسين|جنتامايسين)/i, id: 'gentamicin', label: 'Gentamicin / Garamycin (جاراميسين)' },
  { pattern: /(amikin|amikacin|اميكين|أميكاسين)/i, id: 'amikacin', label: 'Amikacin / Amikin (أميكين)' },
  { pattern: /(meronem|meropenem|ميرونيم|ميروبينيم)/i, id: 'meropenem', label: 'Meropenem / Meronem (ميرونيم)' },
  { pattern: /(vancocin|vancomix|vancomycin|فانكوسين|فانكومايسين)/i, id: 'vancomycin', label: 'Vancomycin (فانكومايسين)' },
  { pattern: /(\bzyvox\b|averozolid|linezolid|زيفوكس|افيروزوليد|أفيروزوليد|لينيزوليد)/i, id: 'linezolid', label: 'Linezolid / Averozolid (أفيروزوليد)' },
  { pattern: /(fucidin|fusidic|فيوسيدين|حمض الفيوسيديك)/i, id: 'fusidic-acid', label: 'Fusidic Acid / Fucidin (فيوسيدين)' },
  { pattern: /(\btrcid\b|gastrobiotic|rifaximin|تراسيد|جاستروبيوتك|ريفاكسيمين)/i, id: 'rifaximin', label: 'Rifaximin / Gastrobiotic (تراسيد)' },
];

function parseVisionText(rawText: string): {
  detectedDrugName: string;
  matchedIngredientId: string | null;
  summary: string;
} {
  const lines = rawText.split(/\r?\n/);
  let matchedId: string | null = null;
  let detectedName = '';
  const summaryLines: string[] = [];

  for (const line of lines) {
    const idMatch = line.match(/DRUG_ID:\s*([a-z0-9-]+)/i);
    const nameMatch = line.match(/DRUG_NAME:\s*(.+)/i);
    if (idMatch) {
      const val = idMatch[1].toLowerCase().trim();
      if (val !== 'unknown') matchedId = val;
    } else if (nameMatch) {
      detectedName = nameMatch[1].trim();
    } else {
      summaryLines.push(line);
    }
  }

  return {
    detectedDrugName: detectedName,
    matchedIngredientId: matchedId,
    summary: cleanAssistantMarkdown(summaryLines.join('\n')),
  };
}

/**
 * Parallel Multi-Engine Bilingual Vision & OCR Scanner:
 * Reads both Arabic and English medicine names simultaneously using:
 * 1) Google Gemini Vision (if user key configured)
 * 2) Keyless Multimodal OpenAI Vision (Pollinations AI)
 * 3) Cloud OCR Engine 2 (English / Latin drug names & concentrations)
 * 4) Cloud OCR Engine 1 (Arabic drug names & concentrations)
 */
export async function analyzeMedicineImageWithVision(
  base64Data: string,
  mimeType: string,
  lang: 'ar' | 'en'
): Promise<VisionAnalysisResult> {
  const prompt =
    lang === 'ar'
      ? `اقرأ اسم الدواء أو المضاد الحيوي الظاهر في هذه الصورة بدقة سواء كان مكتوباً باللغة العربية أو الإنجليزية (علبة دواء، شريط دواء، أو اسم دواء مكتوب).
اكتب في السطر الأول:
DRUG_ID: [اختر المعرف المطابق من القائمة: ${VISION_DRUG_IDS} أو unknown]
وفي السطر الثاني:
DRUG_NAME: [اسم الدواء التجاري والعلمي والتركيز كما يظهر في الصورة بالعربية والإنجليزية]
ثم اكتب ملخصاً سريرياً واضحاً عن الدواء بدون جداول وبدون رموز ** أو ###.`
      : `Read the medicine or antibiotic name shown in this image carefully whether written in English or Arabic (medicine box, blister pack, or printed/written text).
Line 1: DRUG_ID: [matching slug from: ${VISION_DRUG_IDS} or unknown]
Line 2: DRUG_NAME: [detected brand name, generic name, and strength in English and Arabic]
Then write a clear clinical summary without markdown tables or ** symbols.`;

  const key = getApiKey();
  const dataUri = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;

  const runGemini = async (): Promise<string> => {
    if (!key || !key.startsWith('AIza')) return '';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 600 },
      }),
    });
    if (!response.ok) return '';
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  };

  const runPollinationsVision = async (): Promise<string> => {
    const visionRes = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: dataUri } },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });
    if (!visionRes.ok) return '';
    const json = await visionRes.json();
    return json?.choices?.[0]?.message?.content || '';
  };

  const runOcrEng = async (): Promise<string> => {
    const fd = new FormData();
    fd.append('apikey', 'helloworld');
    fd.append('base64Image', dataUri);
    fd.append('language', 'eng');
    fd.append('OCREngine', '2');
    fd.append('scale', 'true');
    const r = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: fd,
    });
    if (!r.ok) return '';
    const j = await r.json();
    return j?.ParsedResults?.[0]?.ParsedText || '';
  };

  const runOcrAra = async (): Promise<string> => {
    const fd = new FormData();
    fd.append('apikey', 'helloworld');
    fd.append('base64Image', dataUri);
    fd.append('language', 'ara');
    fd.append('OCREngine', '1');
    fd.append('scale', 'true');
    const r = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: fd,
    });
    if (!r.ok) return '';
    const j = await r.json();
    return j?.ParsedResults?.[0]?.ParsedText || '';
  };

  const results = await Promise.allSettled([
    runGemini(),
    runPollinationsVision(),
    runOcrEng(),
    runOcrAra(),
  ]);

  const geminiText = results[0].status === 'fulfilled' ? results[0].value : '';
  const pollinationsText = results[1].status === 'fulfilled' ? results[1].value : '';
  const engOcrText = results[2].status === 'fulfilled' ? results[2].value : '';
  const araOcrText = results[3].status === 'fulfilled' ? results[3].value : '';

  const visionRaw = geminiText || pollinationsText;
  const parsed = visionRaw
    ? parseVisionText(visionRaw)
    : { detectedDrugName: '', matchedIngredientId: null, summary: '' };

  const allExtracted = [
    parsed.detectedDrugName,
    parsed.matchedIngredientId || '',
    engOcrText,
    araOcrText,
    visionRaw,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!allExtracted) {
    throw new Error('VISION_EMPTY');
  }

  return {
    detectedDrugName:
      parsed.detectedDrugName ||
      engOcrText.split(/\r?\n/)[0] ||
      araOcrText.split(/\r?\n/)[0] ||
      '',
    matchedIngredientId: parsed.matchedIngredientId,
    summary: parsed.summary,
    rawExtractedText: allExtracted,
  };
}

/**
 * Result of Prescription OCR / Camera extraction.
 * Strictly marks extracted data as unverified (`isUnverifiedOcr: true`, `autoApproved: false`)
 * and never invents missing dose, frequency, duration, or route values.
 */
export interface PrescriptionOcrExtractionResult {
  detectedDrugName: string;
  matchedIngredientId: string | null;
  extractedDoseText: string;
  extractedRoute: 'oral' | 'suspension' | 'injection' | 'topical' | '';
  extractedFrequencyKey: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily' | '';
  extractedFrequencyRaw: string;
  extractedDurationDays: number | null;
  extractedNotes: string;
  extractedCoMeds: string[];
  unreadableFields: string[];
  contradictionWarnings: string[];
  rawExtractedText: string;
  isUnverifiedOcr: true;
  autoApproved: false;
}

function isUnreadableToken(val: string): boolean {
  const clean = (val || '').trim().toLowerCase();
  if (!clean) return true;
  return (
    clean === 'unreadable' ||
    clean === 'unknown' ||
    clean === 'missing' ||
    clean === 'none' ||
    clean === 'n/a' ||
    clean === 'null' ||
    clean === '?' ||
    clean === 'غير واضح' ||
    clean === 'غير مقروء' ||
    clean === 'غير مذكور' ||
    clean === 'غير محدد'
  );
}

/**
 * Deterministically parses structured vision output and/or raw OCR text from a prescription
 * without ever inventing a medication dose, frequency, duration, or administration route.
 */
export function parsePrescriptionTextDeterministically(
  rawText: string
): PrescriptionOcrExtractionResult {
  const text = (rawText || '').trim();
  let matchedIngredientId: string | null = null;
  let detectedDrugName = '';
  let extractedDoseText = '';
  let extractedRoute: 'oral' | 'suspension' | 'injection' | 'topical' | '' = '';
  let extractedFrequencyKey: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily' | '' = '';
  let extractedFrequencyRaw = '';
  let extractedDurationDays: number | null = null;
  let extractedNotes = '';
  const extractedCoMeds: string[] = [];
  const contradictionWarnings: string[] = [];

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const idMatch = line.match(/^(?:RX_DRUG_ID|DRUG_ID):\s*(.+)$/i);
    if (idMatch) {
      const candidate = idMatch[1].trim().toLowerCase();
      if (!isUnreadableToken(candidate) && KNOWN_INGREDIENT_SLUGS.has(candidate)) {
        matchedIngredientId = candidate;
      }
      continue;
    }

    const nameMatch = line.match(/^(?:RX_DRUG_NAME|DRUG_NAME):\s*(.+)$/i);
    if (nameMatch) {
      const val = nameMatch[1].trim();
      if (!isUnreadableToken(val)) detectedDrugName = val;
      continue;
    }

    const doseMatch = line.match(/^RX_DOSE:\s*(.+)$/i);
    if (doseMatch) {
      const val = doseMatch[1].trim();
      if (!isUnreadableToken(val)) extractedDoseText = val;
      continue;
    }

    const routeMatch = line.match(/^RX_ROUTE:\s*(.+)$/i);
    if (routeMatch) {
      const val = routeMatch[1].trim().toLowerCase();
      if (val === 'oral' || val === 'suspension' || val === 'injection' || val === 'topical') {
        extractedRoute = val;
      }
      continue;
    }

    const freqMatch = line.match(/^RX_FREQ:\s*(.+)$/i);
    if (freqMatch) {
      const val = freqMatch[1].trim();
      if (!isUnreadableToken(val)) {
        extractedFrequencyRaw = val;
        const lower = val.toLowerCase();
        if (lower === 'once_daily' || lower === 'q24h') extractedFrequencyKey = 'once_daily';
        else if (lower === 'twice_daily' || lower === 'q12h') extractedFrequencyKey = 'twice_daily';
        else if (lower === 'thrice_daily' || lower === 'q8h') extractedFrequencyKey = 'thrice_daily';
        else if (lower === 'four_times_daily' || lower === 'q6h') extractedFrequencyKey = 'four_times_daily';
      }
      continue;
    }

    const durMatch = line.match(/^RX_DURATION_DAYS:\s*(.+)$/i);
    if (durMatch) {
      const val = durMatch[1].trim();
      if (!isUnreadableToken(val)) {
        const num = parseInt(val.replace(/[^\d]/g, ''), 10);
        if (!isNaN(num) && num >= 1 && num <= 60) {
          extractedDurationDays = num;
        }
      }
      continue;
    }

    const notesMatch = line.match(/^RX_NOTES:\s*(.+)$/i);
    if (notesMatch) {
      const val = notesMatch[1].trim();
      if (!isUnreadableToken(val)) extractedNotes = val;
      continue;
    }

    const contradictMatch = line.match(/^RX_CONTRADICTIONS:\s*(.+)$/i);
    if (contradictMatch) {
      const val = contradictMatch[1].trim();
      if (!isUnreadableToken(val)) contradictionWarnings.push(val);
      continue;
    }
  }

  // Fallback deterministic extraction from raw OCR lines (only when explicitly written)
  if (!matchedIngredientId || !detectedDrugName) {
    for (const item of DRUG_KEYWORD_TO_ID) {
      if (item.pattern.test(text)) {
        if (!matchedIngredientId) matchedIngredientId = item.id;
        if (!detectedDrugName) detectedDrugName = item.label;
        break;
      }
    }
  }

  // Extract explicit dose strength/quantity only if written (e.g., "1000 mg", "500 مجم", "5 ml", "قرص 500 مجم")
  if (!extractedDoseText) {
    const doseRegex =
      /(\d+(?:\.\d+)?\s*(?:mg|gm|g|ml|mcg|iu|مجم|جم|مل|قرص|أقراص|كبسولة|كبسولات|سم)(?:\s*\/\s*\d+\s*(?:mg|ml|مجم|مل))?)/i;
    const m = text.match(doseRegex);
    if (m) {
      extractedDoseText = m[1].trim();
    }
  }

  // Detect explicit route keywords and check for route contradictions
  const hasOralTabKeyword = /(tablet|tablets|\btab\b|capsule|capsules|\bcap\b|\boral\b|قرص|أقراص|اقراص|كبسول|كبسولة|فموي)/i.test(text);
  const hasSuspensionKeyword = /(suspension|\bsyrup\b|شراب|معلق)/i.test(text);
  const hasInjectionKeyword = /(\bvial\b|ampoule|\bamp\b|injection|\biv\b|\bim\b|حقن|حقنة|أمبول|امبول|فيال|وريد|عضل)/i.test(text);
  const hasTopicalKeyword = /(\bcream\b|ointment|topical|\bgel\b|كريم|مرهم|موضعي|دهان)/i.test(text);

  const detectedRoutesCount = [
    hasOralTabKeyword,
    hasSuspensionKeyword,
    hasInjectionKeyword,
    hasTopicalKeyword,
  ].filter(Boolean).length;

  if (detectedRoutesCount > 1 && hasInjectionKeyword && (hasOralTabKeyword || hasSuspensionKeyword)) {
    contradictionWarnings.push(
      'تعارض في طريقة الإعطاء المستخرجة (ذُكر شكل فموي وحقن معاً في نفس النص) — يرجى التحقق من الروشتة.'
    );
  } else if (!extractedRoute) {
    if (hasInjectionKeyword) extractedRoute = 'injection';
    else if (hasSuspensionKeyword) extractedRoute = 'suspension';
    else if (hasTopicalKeyword) extractedRoute = 'topical';
    else if (hasOralTabKeyword) extractedRoute = 'oral';
  }

  // Detect explicit frequency patterns and check for conflicting frequencies
  const matchedFreqs = new Set<'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily'>();
  if (/(once\s*daily|every\s*24\s*(?:h|hr|hours)|\bq\s*24\s*h\b|\bod\b|1\s*x\s*1|مرة\s*يوميا|مرة\s*واحدة\s*يوميا|كل\s*24\s*ساع)/i.test(text)) {
    matchedFreqs.add('once_daily');
  }
  if (/(twice\s*daily|every\s*12\s*(?:h|hr|hours)|\bq\s*12\s*h\b|\bbid\b|b\.i\.d|1\s*x\s*2|2\s*times\s*daily|مرتين\s*يوميا|كل\s*12\s*ساع)/i.test(text)) {
    matchedFreqs.add('twice_daily');
  }
  if (/(thrice\s*daily|three\s*times\s*daily|every\s*8\s*(?:h|hr|hours)|\bq\s*8\s*h\b|\btid\b|t\.i\.d|1\s*x\s*3|3\s*times\s*daily|3\s*مرات\s*يوميا|ثلاث\s*مرات\s*يوميا|كل\s*8\s*ساع)/i.test(text)) {
    matchedFreqs.add('thrice_daily');
  }
  if (/(four\s*times\s*daily|every\s*6\s*(?:h|hr|hours)|\bq\s*6\s*h\b|\bqid\b|q\.i\.d|1\s*x\s*4|4\s*times\s*daily|4\s*مرات\s*يوميا|أربع\s*مرات\s*يوميا|كل\s*6\s*ساع)/i.test(text)) {
    matchedFreqs.add('four_times_daily');
  }

  if (matchedFreqs.size > 1) {
    contradictionWarnings.push(
      'تعارض في عدد الجرعات اليومية المستخرجة (وُجد أكثر من تكرار زمني مختلف في النص) — يرجى المراجعة مع الطبيب أو الصيدلي.'
    );
    extractedFrequencyKey = '';
  } else if (!extractedFrequencyKey && matchedFreqs.size === 1) {
    extractedFrequencyKey = Array.from(matchedFreqs)[0];
  }

  // Detect explicit duration in days (e.g., "for 7 days", "x 5 days", "لمدة 7 أيام", "لمده 5 ايام")
  if (extractedDurationDays === null) {
    const durationMatches = Array.from(
      text.matchAll(
        /(?:for|x|duration|لمدة|لمده|مدة|كورس)\s*(\d{1,2})\s*(?:days?|d|أيام|ايام|يوم)|(\d{1,2})\s*(?:days?\s*course|أيام\s*كورس)/gi
      )
    );
    const distinctDays = new Set<number>();
    for (const dm of durationMatches) {
      const rawNum = dm[1] || dm[2];
      const n = parseInt(rawNum, 10);
      if (!isNaN(n) && n >= 1 && n <= 60) {
        distinctDays.add(n);
      }
    }
    if (distinctDays.size > 1) {
      contradictionWarnings.push(
        `تعارض في مدة العلاج المستخرجة (${Array.from(distinctDays).join(' مقابل ')} أيام) — يرجى التأكد من الطبيب أو الصيدلي.`
      );
    } else if (distinctDays.size === 1) {
      extractedDurationDays = Array.from(distinctDays)[0];
    }
  }

  // Detect co-medications if mentioned in prescription text
  if (/(panadol|paracetamol|\bcetal\b|abimol|باراسيتامول|بانادول|سيتال|أبيمول)/i.test(text)) {
    extractedCoMeds.push('paracetamol');
  }
  if (/(cataflam|brufen|voltaren|ketofan|ibuprofen|diclofenac|كتافلام|بروفين|فولتارين|كيتوفان)/i.test(text)) {
    extractedCoMeds.push('nsaids');
  }
  if (/(omeprazole|antodine|maalox|gaviscon|أوميبرازول|أنتودين|مالوكس|جافيسكون)/i.test(text)) {
    extractedCoMeds.push('antacids');
  }
  if (/(ferrotron|feroglobin|\biron\b|\bzinc\b|zinctron|فيروترون|حديد|زنك)/i.test(text)) {
    extractedCoMeds.push('iron_zinc');
  }
  if (/(osteocare|calcium|calcitron|أوستيوكير|كالسيوم)/i.test(text)) {
    extractedCoMeds.push('calcium_dairy');
  }
  if (/(lacteol|\blinex\b|probiotic|لاكتيول|لينكس|بروبيوتيك)/i.test(text)) {
    extractedCoMeds.push('probiotics');
  }
  if (/(marevan|warfarin|ماريفان|وارفارين)/i.test(text)) {
    extractedCoMeds.push('warfarin');
  }
  if (/(\bator\b|lipitor|\bzocor\b|statin|أتور|ليبيتور|زوكور)/i.test(text)) {
    extractedCoMeds.push('statins');
  }

  const unreadableFields: string[] = [];
  if (!detectedDrugName) unreadableFields.push('medicineName');
  if (!extractedDoseText) unreadableFields.push('prescribedDose');
  if (!extractedRoute) unreadableFields.push('route');
  if (!extractedFrequencyKey) unreadableFields.push('frequency');
  if (extractedDurationDays === null) unreadableFields.push('durationDays');

  return {
    detectedDrugName,
    matchedIngredientId,
    extractedDoseText,
    extractedRoute,
    extractedFrequencyKey,
    extractedFrequencyRaw,
    extractedDurationDays,
    extractedNotes,
    extractedCoMeds: Array.from(new Set(extractedCoMeds)),
    unreadableFields,
    contradictionWarnings,
    rawExtractedText: text,
    isUnverifiedOcr: true,
    autoApproved: false,
  };
}

/**
 * Extracts readable prescription details from an uploaded or camera-captured prescription image.
 * Strictly marks output as unverified (`isUnverifiedOcr: true`) and never invents missing instructions.
 */
export async function analyzePrescriptionImageWithVision(
  base64Data: string,
  mimeType: string,
  lang: 'ar' | 'en'
): Promise<PrescriptionOcrExtractionResult> {
  const prompt =
    lang === 'ar'
      ? `اقرأ تفاصيل الروشتة أو الدواء المكتوب في هذه الصورة بدقة شديدة. لا تخترع أو تخمّن أي معلومة غير مكتوبة بوضوح؛ إذا كان أي حقل غير واضح أو غير مكتوب، اكتب UNREADABLE.
اكتب النتيجة في الأسطر التالية بالضبط:
RX_DRUG_ID: [المعرف المطابق من: ${VISION_DRUG_IDS} أو UNREADABLE]
RX_DRUG_NAME: [اسم المضاد الحيوي كما هو مكتوب في الروشتة أو UNREADABLE]
RX_DOSE: [الجرعة والتركيز كما هي مكتوبة بالضبط مثل 500mg أو 1 قرص أو UNREADABLE]
RX_ROUTE: [oral أو suspension أو injection أو topical أو UNREADABLE]
RX_FREQ: [once_daily أو twice_daily أو thrice_daily أو four_times_daily أو UNREADABLE]
RX_DURATION_DAYS: [عدد أيام الكورس بالأرقام فقط إذا كان مكتوباً بصراحة أو UNREADABLE]
RX_NOTES: [أي تعليمات إضافية مقروءة مثل بعد الأكل أو UNREADABLE]
RX_CONTRADICTIONS: [اذكر أي تعارض أو غموض في التعليمات المكتوبة أو NONE]`
      : `Read the prescription details in this image with strict accuracy. NEVER invent or guess any missing or unclear instruction; if any field is not clearly written, output UNREADABLE.
Output the exact lines below:
RX_DRUG_ID: [matching slug from: ${VISION_DRUG_IDS} or UNREADABLE]
RX_DRUG_NAME: [antibiotic name as written or UNREADABLE]
RX_DOSE: [exact dose/strength written on prescription or UNREADABLE]
RX_ROUTE: [oral or suspension or injection or topical or UNREADABLE]
RX_FREQ: [once_daily or twice_daily or thrice_daily or four_times_daily or UNREADABLE]
RX_DURATION_DAYS: [integer number of days ONLY if explicitly written, else UNREADABLE]
RX_NOTES: [any readable administration instructions or UNREADABLE]
RX_CONTRADICTIONS: [any contradictory or ambiguous instructions noticed, or NONE]`;

  const key = getApiKey();
  const dataUri = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;

  const runGemini = async (): Promise<string> => {
    if (!key || !key.startsWith('AIza')) return '';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.05, maxOutputTokens: 500 },
      }),
    });
    if (!response.ok) return '';
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  };

  const runPollinationsVision = async (): Promise<string> => {
    const visionRes = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: dataUri } },
            ],
          },
        ],
        temperature: 0.05,
      }),
    });
    if (!visionRes.ok) return '';
    const json = await visionRes.json();
    return json?.choices?.[0]?.message?.content || '';
  };

  const runOcrEng = async (): Promise<string> => {
    const fd = new FormData();
    fd.append('apikey', 'helloworld');
    fd.append('base64Image', dataUri);
    fd.append('language', 'eng');
    fd.append('OCREngine', '2');
    fd.append('scale', 'true');
    const r = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: fd,
    });
    if (!r.ok) return '';
    const j = await r.json();
    return j?.ParsedResults?.[0]?.ParsedText || '';
  };

  const runOcrAra = async (): Promise<string> => {
    const fd = new FormData();
    fd.append('apikey', 'helloworld');
    fd.append('base64Image', dataUri);
    fd.append('language', 'ara');
    fd.append('OCREngine', '1');
    fd.append('scale', 'true');
    const r = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: fd,
    });
    if (!r.ok) return '';
    const j = await r.json();
    return j?.ParsedResults?.[0]?.ParsedText || '';
  };

  const results = await Promise.allSettled([
    runGemini(),
    runPollinationsVision(),
    runOcrEng(),
    runOcrAra(),
  ]);

  const geminiText = results[0].status === 'fulfilled' ? results[0].value : '';
  const pollinationsText = results[1].status === 'fulfilled' ? results[1].value : '';
  const engOcrText = results[2].status === 'fulfilled' ? results[2].value : '';
  const araOcrText = results[3].status === 'fulfilled' ? results[3].value : '';

  const combinedRaw = [geminiText, pollinationsText, engOcrText, araOcrText]
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!combinedRaw) {
    throw new Error('PRESCRIPTION_OCR_EMPTY');
  }

  return parsePrescriptionTextDeterministically(combinedRaw);
}
