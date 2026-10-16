// geminiApi.ts - Multi-Engine Bilingual AI Vision & OCR (Arabic + English)

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

export const SYSTEM_PROMPT = `أنت المساعد الذكي لمنصة "الوعي بالمضادات الحيوية" (Antibiotic Awareness Platform).
مهمتك: تقديم معلومات علمية وطبية دقيقة ومفيدة ومبسطة للجمهور والمرضى بأسلوب إيجابي راقٍ، والإجابة عن أي سؤال طبي أو دوائي يطرحه المستخدم بوضوح تام، مع الالتزام بالمعايير الصحية:

قواعد الإجابة الإيجابية والمفيدة:
1. أجب عن كل سؤال يطرحه المستخدم بطريقة مباشرة وعلمية مفصلة وواضحة، دون أي تهرب أو اعتذار غير مبرر.
2. إذا سأل المستخدم عن المضاد الحيوي المناسب لمرض أو عدوى معينة (مثل الأسنان، المسالك البولية، التهاب اللوز، حب الشباب، الجيوب الأنفية، الأذن):
   - اذكر له بوضوح الأدوية المعتمدة علمياً كخط أول (First-line) مع أسمائها العلمية والتجارية الشائعة (مثل أوجمنتين، زيثروماكس، فلاجيل، ماكروفيوران، إلخ).
   - اشرح له بإيجاز كيف يعمل الدواء ولماذا تم اختياره.
   - انصحه بلطف بضرورة مراجعة الطبيب المختص أو الصيدلي للفحص وتحديد الجرعة المناسبة والتأكد من عدم وجود حساسية.
3. التوعية بالحقائق الجوهرية:
   - المضاد الحيوي لا يعالج نزلات البرد أو الإنفلونزا الفيروسية، وحقنة/مجموعة البرد الشعبية خطيرة ومحرمة طبياً.
   - ضرورة إكمال كورس العلاج كاملاً وعدم التوقف عند التحسن.
   - التصرف الصحيح عند نسيان الجرعة، وتداخلات الحليب والكالسيوم مع بعض الأدوية.
4. في حالات الطوارئ الحادة (صعوبة التنفس، تورم الوجه واللسان، الإغماء)، وجه المستخدم فوراً لطلب الإسعاف 123 أو التوجه للطوارئ.
5. الأسلوب: لغة عربية فصحى بسيطة وواضحة، منسقة في نقاط مرتبة وسهلة القراءة.`;

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
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply.trim();
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
      temperature: 0.3,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error('EMPTY_RESPONSE');
  return text.trim();
}

export interface VisionAnalysisResult {
  detectedDrugName: string;
  matchedIngredientId: string | null;
  summary: string;
  rawExtractedText: string;
}

const VISION_DRUG_IDS =
  'amoxicillin-clavulanic-acid, amoxicillin, ampicillin-sulbactam, flucloxacillin, penicillin-v-potassium, cephalexin, cefadroxil, cefuroxime, cefixime, cefdinir, ceftriaxone, cefotaxime, cefoperazone-sulbactam, cefepime, azithromycin, clarithromycin, erythromycin, ciprofloxacin, levofloxacin, moxifloxacin, doxycycline, clindamycin, metronidazole, nitrofurantoin, co-trimoxazole, gentamicin, amikacin, meropenem, vancomycin, linezolid, fusidic-acid, rifaximin';

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
    summary: summaryLines.join('\n').trim(),
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
ثم اكتب ملخصاً سريرياً واضحاً عن الدواء.`
      : `Read the medicine or antibiotic name shown in this image carefully whether written in English or Arabic (medicine box, blister pack, or printed/written text).
Line 1: DRUG_ID: [matching slug from: ${VISION_DRUG_IDS} or unknown]
Line 2: DRUG_NAME: [detected brand name, generic name, and strength in English and Arabic]
Then write a clear clinical summary.`;

  const key = getApiKey();
  const dataUri = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;

  // Task 1: Gemini API (if custom key starts with AIza)
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

  // Task 2: Keyless Multimodal Vision AI (reads Arabic & English boxes/text)
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

  // Task 3: Cloud OCR for English (OCREngine 2 is best for Latin/English pharmaceutical text)
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

  // Task 4: Cloud OCR for Arabic (OCREngine 1 is required for Arabic script)
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
