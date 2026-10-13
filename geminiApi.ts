// geminiApi.ts - Seamless Google Gemini Integration with Fallback

// Optional built-in API key. If empty, the enhanced internal clinical engine is used seamlessly.
const DEFAULT_KEY = '';

const STORAGE_KEY = 'gemini_api_key';
const ENV_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || '';

export function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return DEFAULT_KEY || localStorage.getItem(STORAGE_KEY) || ENV_KEY || '';
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export const SYSTEM_PROMPT = `أنت المساعد الذكي لمشروع تخرج في كلية التمريض حول "الوعي بالمضادات الحيوية ومقاومة الميكروبات (Antibiotic Awareness & AMR)".
مهمتك: تقديم معلومات علمية وطبية دقيقة ومبسطة للمرضى والجمهور، بأسلوب تثقيفي راقٍ ومفيد دون تهرب أو ردود سلبية، مع الالتزام التام بالمعايير الصحية:

قواعد الإجابة الإيجابية والسريرية:
1. أجب عن كل سؤال بطريقة علمية وبناءة؛ اشرح الحقائق الدوائية والبيولوجية والوقائية بوضوح.
2. إذا سأل المريض عن أعراض (مثل البرد أو احتقان الحلق أو السعال)، اشرح له أن معظمها فيروسي ولا يحتاج لمضاد حيوي، ووضح له سبل الرعاية المنزلية الآمنة وخافضات الحرارة ومتى تجب زيارة الطبيب.
3. إذا سأل عن جرعة أو اختيار دواء، اشرح له علمياً كيف تُحسب الجرعات بناءً على الوزن والوظائف الحيوية، وأكد على الالتزام بتعليمات الطبيب والصيدلي دون تحديد جرعة رقمية لحالة شخصية.
4. وضح دائماً خطورة "مجموعة البرد / حقنة هتلر"، وأهمية إكمال كورس المضاد حتى النهاية، وكيفية التعامل مع نسيان الجرعة، وتداخلات الألبان والأغذية، وحفظ المضاد الشراب بالثلاجة.
5. في حالات الطوارئ (ضيق التنفس، تورم الوجه، صدمة تحسسية)، نبه فوراً بالتوجه للطوارئ أو الاتصال بالإسعاف.
6. الأسلوب: لغة عربية فصحى مبسطة وقريبة للمواطن، منسقة في نقاط واضحة ومباشرة.`;

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
    }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error('EMPTY_RESPONSE');
  return reply.trim();
}
