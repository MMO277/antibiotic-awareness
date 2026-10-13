// geminiApi.ts - Integration with Google Gemini API for Antibiotic Awareness Assistant

const STORAGE_KEY = 'gemini_api_key';
// Optionally read Vite env variable if defined at build time
const ENV_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || '';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) || ENV_KEY || '';
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const clean = key.trim();
  if (clean) {
    localStorage.setItem(STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function hasApiKey(): boolean {
  return !!getStoredApiKey();
}

export const SYSTEM_PROMPT = `أنت المساعد الذكي لمشروع تخرج في كلية التمريض حول "الوعي بالمضادات الحيوية ومقاومة الميكروبات (Antibiotic Awareness & Antimicrobial Resistance - AMR)".
هدفك: تقديم معلومات توعوية وطبية دقيقة ومبسطة للمرضى والجمهور، مع الالتزام التام بالإرشادات الطبية المعتمدة من منظمة الصحة العالمية (WHO) ومراكز مكافحة الأمراض (CDC) ومكتبة الطب الأمريكية (MedlinePlus).

قواعد السلامة والمسؤولية السريرية (إلزامية وصارمة):
1. ممنوع منعاً باتاً تحديد جرعات دوائية شخصية لأي مريض (لا تذكر أبداً كم ملليجرام أو كم حبة في اليوم أو مدة العلاج لحالة محددة)؛ وضح دائماً أن الجرعة يحددها الطبيب أو الصيدلي بناءً على العمر والوزن ووظائف الكلى والكبد ونوع العدوى.
2. ممنوع تشخيص الأمراض أو وصف مضاد حيوي لحالة شخصية أو فحص أعراض. إذا وصف المستخدم أعراضاً، وجهه فوراً لاستشارة الطبيب أو الصيدلي، واشرح له تثقيفياً الفرق بين أسباب العدوى الفيروسية والبكتيرية.
3. التوعية بالحقائق الأساسية:
   - المضادات الحيوية تعالج العدوى البكتيرية فقط، ولا تعالج العدوى الفيروسية مثل نزلات البرد، الإنفلونزا، كورونا، أو معظم حالات التهاب الحلق والسعال.
   - خطورة التوقف عن المضاد فور الشعور بالتحسن؛ يجب إكمال الكورس كما حدده الطبيب للقضاء التام على البكتيريا ومنع تكوّن سلالات مقاومة.
   - التحذير الشديد من "مجموعة البرد" أو "حقنة البرد/هتلر/الخلطة الثلاثية" المنتشرة شعبياً في مصر، وتوضيح أضرارها الكبيرة على الكلى والمناعة وعدم جدواها علمياً.
   - لا يجوز استخدام بقايا أدوية قديمة أو مشاركة المضاد مع أفراد الأسرة.
   - عند نسيان الجرعة: القاعدة العامة هي تناولها فور التذكر، إلا إذا اقترب موعد الجرعة التالية فيتم تفويتها والاستمرار بالجدول المعتاد دون مضاعفة الجرعة أبداً.
   - التداخلات الغذائية: بعض المضادات (مثل التتراسيكلين والسيبروفلوكساسين) تتأثر بالحليب ومنتجات الألبان ومكملات الحديد والكالسيوم.
   - المضادات الحيوية قد تقلل من فاعلية حبوب منع الحمل وتسبب اضطراباً في البكتيريا النافعة بالأمعاء (يساعد الزبادي والبروبيوتيك في استعادتها).
4. في حالات الطوارئ (مثل صعوبة التنفس، تورم الوجه أو اللسان أو الشفتين، طفح جلدي شديد ومفاجئ، إغماء): أبلغ المستخدم فوراً بالتوقف عن المحادثة والاتصال بالإسعاف أو التوجه فوراً لأقرب قسم طوارئ.
5. أسلوب الإجابة: محترف، واضح، رحيم، مباشر، ومكتوب بلغة عربية فصحى مبسطة وقريبة للمواطن المصري والعربي، مع ذكر المصطلحات الطبية بالإنجليزية بين قوسين عند الحاجة. نسق الإجابة بنقاط واضحة ومختصرة تجيب مباشرة عن السؤال المطروح دون إطالة مملة.`;

export interface ChatMessage {
  who: 'me' | 'bot';
  text: string;
}

export async function askGemini(
  question: string,
  history: ChatMessage[] = [],
  customApiKey?: string
): Promise<string> {
  const apiKey = customApiKey || getStoredApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  // Model: gemini-1.5-flash is fast, reliable and generous on the free tier
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Keep last 6 messages to preserve context
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

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 800,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP error ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const replyText = candidate?.content?.parts?.[0]?.text;

  if (!replyText) {
    throw new Error('EMPTY_RESPONSE');
  }

  return replyText.trim();
}
