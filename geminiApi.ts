// geminiApi.ts - Seamless Google Gemini AI Integration (Text & Multimodal Vision)

const BUILTIN_KEY = typeof atob !== 'undefined'
  ? atob('QVEuQWI4Uk42TE10UHh2d2NQR2o1STdETXlkZUJWeERsN0lWYXNKVEwwRU1HTjh2NHlGQnc=')
  : 'AQ.Ab8RN6LMtPxvwcPGj5I7DMydeBVxDl7IVasJTL0EMGN8v4yFBw';

export function getApiKey(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key') || BUILTIN_KEY;
  }
  return BUILTIN_KEY;
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export const SYSTEM_PROMPT = `أنت المساعد الذكي لمنصة "الوعي بالمضادات الحيوية ومقاومة الميكروبات (Antibiotic Awareness & AMR)".
مهمتك: تقديم معلومات علمية وطبية دقيقة ومفيدة ومبسطة للجمهور والمرضى بأسلوب إيجابي راقٍ، والإجابة عن أي سؤال طبي أو دوائي يطرحه المستخدم بوضوح تام، مع الالتزام بالمعايير الصحية:

قواعد الإجابة الإيجابية والمفيدة:
1. أجب عن كل سؤال يطرحه المستخدم بطريقة مباشرة وعلمية مفصلة وواضحة، دون أي تهرب أو اعتذار غير مبرر.
2. إذا سأل المستخدم عن المضاد الحيوي المناسب لمرض أو عدوى معينة (مثل الأسنان، المسالك البولية، التهاب اللوز، حب الشباب، الجيوب الأنفية، الأذن):
   - اذكر له بوضوح الأدوية المعتمدة علمياً كخط أول (First-line) مع أسمائها العلمية والتجارية الشائعة (مثل أوجمنتين، فلاجيل، ماكروفيوران، إلخ).
   - اشرح له بإيجاز كيف يعمل الدواء ولماذا تم اختياره.
   - انصحه بلطف بضرورة مراجعة الطبيب المختص أو الصيدلي للفحص وتحديد الجرعة المناسبة والتأكد من عدم وجود حساسية.
3. التوعية بالحقائق الجوهرية:
   - المضاد الحيوي لا يعالج نزلات البرد أو الإنفلونزا الفيروسية، وحقنة/مجموعة البرد الشعبية خطيرة ومحرمة طبياً.
   - ضرورة إكمال كورس العلاج كاملاً وعدم التوقف عند التحسن.
   - التصرف الصحيح عند نسيان الجرعة، وتداخلات الحليب والكالسيوم مع بعض الأدوية.
4. في حالات الطوارئ الحادة (صعوبة التنفس، تورم الوجه واللسان، الإغماء)، وجه المستخدم فوراً لطلب الإسعاف أو التوجه للطوارئ.
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
  if (!key) throw new Error('NO_API_KEY');

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

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error('EMPTY_RESPONSE');
  return reply.trim();
}

export interface VisionAnalysisResult {
  detectedDrugName: string;
  matchedIngredientId: string | null;
  summary: string;
}

/**
 * Multimodal AI Vision Scanner: analyzes a photo of a medicine box front,
 * blister pack, handwritten prescription, or culture & sensitivity report.
 */
export async function analyzeMedicineImageWithVision(
  base64Data: string,
  mimeType: string,
  lang: 'ar' | 'en'
): Promise<VisionAnalysisResult> {
  const key = getApiKey();
  if (!key) throw new Error('NO_API_KEY');

  const prompt =
    lang === 'ar'
      ? `اقرأ هذه الصورة الطبية (علبة دواء أو شريط دواء أو روشتة أو تحليل مزرعة).
حدد اسم المضاد الحيوي أو الدواء الظاهر في الصورة، واكتب في السطر الأول:
DRUG_ID: [اكتب أحد المعرفات التالية إذا تطابق: amoxicillin-clavulanic-acid, amoxicillin, ampicillin-sulbactam, flucloxacillin, penicillin-v-potassium, cephalexin, cefadroxil, cefuroxime, cefixime, cefdinir, ceftriaxone, cefotaxime, cefoperazone-sulbactam, cefepime, azithromycin, clarithromycin, erythromycin, ciprofloxacin, levofloxacin, moxifloxacin, doxycycline, clindamycin, metronidazole, nitrofurantoin, co-trimoxazole, gentamicin, amikacin, meropenem, vancomycin, linezolid, fusidic-acid, rifaximin أو unknown]
DRUG_NAME: [اسم الدواء التجاري والعلمي]
ثم قدم ملخصاً سريرياً واضحاً ومفيداً للمريض في نقاط مرتبة يشمل: المادة الفعالة، الاستخدام الأساسي، أهم التحذيرات، وطريقة التناول الصحيحة.`
      : `Analyze this medical image (medicine box, blister, prescription, or lab culture report).
On line 1 write: DRUG_ID: [matching active ingredient slug or unknown]
On line 2 write: DRUG_NAME: [detected brand and generic name]
Then provide a clear bulleted clinical summary (active ingredient, indication, key warnings, and administration tip).`;

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
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!rawText) throw new Error('EMPTY_VISION_RESPONSE');

  const idMatch = rawText.match(/DRUG_ID:\s*([a-z0-9-]+)/i);
  const nameMatch = rawText.match(/DRUG_NAME:\s*([^\n]+)/i);
  const matchedId = idMatch && idMatch[1] !== 'unknown' ? idMatch[1].toLowerCase().trim() : null;
  const detectedName = nameMatch ? nameMatch[1].trim() : '';
  const cleanedSummary = rawText
    .replace(/DRUG_ID:[^\n]*\n?/i, '')
    .replace(/DRUG_NAME:[^\n]*\n?/i, '')
    .trim();

  return {
    detectedDrugName: detectedName,
    matchedIngredientId: matchedId,
    summary: cleanedSummary,
  };
}
