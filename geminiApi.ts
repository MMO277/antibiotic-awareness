// geminiApi.ts - Multi-Engine AI Vision & Clinical Assistant (Gemini + Keyless Vision + Cloud OCR)

const BUILTIN_KEY = '';

export function getApiKey(): string {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('gemini_api_key') || BUILTIN_KEY).trim();
  }
  return BUILTIN_KEY;
}

export function hasApiKey(): boolean {
  return true; // Always enabled via multi-engine cascade (Gemini + Keyless Vision + Cloud OCR)
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

  // 1) Try Direct Google Gemini API if user provided a valid key
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

  // 2) Keyless OpenAI-Compatible AI Endpoint (Works automatically without API Key)
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
  rawExtractedText?: string;
}

const VISION_DRUG_IDS =
  'amoxicillin-clavulanic-acid, amoxicillin, ampicillin-sulbactam, flucloxacillin, penicillin-v-potassium, cephalexin, cefadroxil, cefuroxime, cefixime, cefdinir, ceftriaxone, cefotaxime, cefoperazone-sulbactam, cefepime, azithromycin, clarithromycin, erythromycin, ciprofloxacin, levofloxacin, moxifloxacin, doxycycline, clindamycin, metronidazole, nitrofurantoin, co-trimoxazole, gentamicin, amikacin, meropenem, vancomycin, linezolid, fusidic-acid, rifaximin';

function parseVisionText(rawText: string): VisionAnalysisResult {
  const idMatch = rawText.match(/DRUG_ID:\s*([a-z0-9-]+)/i);
  const nameMatch = rawText.match(/DRUG_NAME:\s*([^
]+)/i);
  const matchedId =
    idMatch && idMatch[1] && idMatch[1].toLowerCase() !== 'unknown'
      ? idMatch[1].toLowerCase().trim()
      : null;
  const detectedName = nameMatch ? nameMatch[1].trim() : '';
  const cleanedSummary = rawText
    .replace(/DRUG_ID:[^
]*
?/gi, '')
    .replace(/DRUG_NAME:[^
]*
?/gi, '')
    .trim();

  return {
    detectedDrugName: detectedName,
    matchedIngredientId: matchedId,
    summary: cleanedSummary,
    rawExtractedText: rawText,
  };
}

/**
 * Multi-Engine AI Vision & Cloud OCR Scanner:
 * 1) Google Gemini Vision (if user key configured)
 * 2) Keyless Multimodal OpenAI Vision (Pollinations AI - works out of the box with 0 config)
 * 3) Dual-Language Cloud OCR (OCR.space Arabic + English)
 */
export async function analyzeMedicineImageWithVision(
  base64Data: string,
  mimeType: string,
  lang: 'ar' | 'en'
): Promise<VisionAnalysisResult> {
  const prompt =
    lang === 'ar'
      ? `اقرأ اسم الدواء أو المضاد الحيوي المكتوب على علبة الدواء أو الشريط في هذه الصورة بدقة (سواء بالعربية مثل زيثروماكس، أوجمنتين، فلاجيل، سيبروفار، هاي بيوتك، كيبوركس، يوناسين، كلافيموكس، زيثرون، زيثروكان أو بالإنجليزية مثل Zithromax, Augmentin, Flagyl, Ciprofar, Hibiotic).
اكتب في السطر الأول:
DRUG_ID: [اختر المعرف المطابق من القائمة: ${VISION_DRUG_IDS} أو unknown]
وفي السطر الثاني:
DRUG_NAME: [اسم الدواء التجاري والعلمي والتركيز كما يظهر في الصورة]
ثم اكتب ملخصاً سريرياً شاملاً ومفصلاً عن هذا الدواء يشمل: المادة الفعالة، دواعي الاستعمال، الجرعة المعتادة، وأهم التحذيرات.`
      : `Read the medicine box or blister pack in this image carefully (Arabic or English brand name like Zithromax, Augmentin, Flagyl, Ciprofar, Hibiotic, etc.).
Line 1: DRUG_ID: [matching slug from: ${VISION_DRUG_IDS} or unknown]
Line 2: DRUG_NAME: [detected brand name, generic name, and strength]
Then write a complete clinical summary including active ingredient, indications, dosage, and key warnings.`;

  const key = getApiKey();

  // Engine A: Google Gemini Vision API (if valid key starts with AIza)
  if (key && key.startsWith('AIza')) {
    try {
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
          generationConfig: { temperature: 0.1, maxOutputTokens: 700 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText) {
          return parseVisionText(rawText);
        }
      }
    } catch {
      /* proceed to Engine B */
    }
  }

  // Engine B: Keyless Multimodal Vision AI (OpenAI Vision compatible, zero API key required)
  try {
    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;
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

    if (visionRes.ok) {
      const json = await visionRes.json();
      const rawText: string = json?.choices?.[0]?.message?.content || '';
      if (rawText && rawText.trim().length > 5) {
        return parseVisionText(rawText);
      }
    }
  } catch {
    /* proceed to Engine C */
  }

  // Engine C: Cloud OCR.space (Arabic + English OCR)
  try {
    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;
    const runOcrLang = async (ocrLang: string) => {
      const fd = new FormData();
      fd.append('apikey', 'helloworld');
      fd.append('base64Image', dataUri);
      fd.append('language', ocrLang);
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

    const [araText, engText] = await Promise.all([runOcrLang('ara'), runOcrLang('eng')]);
    const combinedOcr = `${araText} ${engText}`.trim();
    if (combinedOcr) {
      return {
        detectedDrugName: combinedOcr.split('\n')[0] || combinedOcr,
        matchedIngredientId: null,
        summary: combinedOcr,
        rawExtractedText: combinedOcr,
      };
    }
  } catch {
    /* fallback to local OCR & visual matcher */
  }

  throw new Error('VISION_FALLBACK');
}
