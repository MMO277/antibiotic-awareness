import type { Lang } from './types';
import { getCurrentEmergencyInfo } from './emergencyLocation';
// geminiApi.ts - Multi-Engine Bilingual AI Vision, Deterministic Prescription OCR & Clinical Assistant

import {
  ACTIVE_INGREDIENTS,
  EGYPTIAN_COMMERCIAL_PRODUCTS,
  EgyptianCommercialProduct,
} from './egyptianDrugDatabase';

import { db, configured as firebaseConfigured } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const ENV_GEMINI_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.VITE_FIREBASE_API_KEY)) ||
  '';

let cachedCloudAiKey = '';
let cloudKeyLoaded = false;

export async function loadSharedCloudAiKey(): Promise<string> {
  if (cloudKeyLoaded && cachedCloudAiKey) return cachedCloudAiKey;
  if (!firebaseConfigured || !db) return '';
  try {
    const snap = await getDoc(doc(db, 'settings', 'ai_config'));
    if (snap.exists()) {
      const data = snap.data();
      const k = typeof data?.apiKey === 'string' ? data.apiKey.trim() : '';
      if (k) {
        cachedCloudAiKey = k;
        cloudKeyLoaded = true;
        if (typeof window !== 'undefined' && !localStorage.getItem('gemini_api_key')) {
          localStorage.setItem('gemini_api_key', k);
        }
        return k;
      }
    }
    cloudKeyLoaded = true;
  } catch {
    /* ignore */
  }
  return '';
}

// Kick off background load on module init
if (typeof window !== 'undefined') {
  loadSharedCloudAiKey().catch(() => {});
}

export function getApiKey(): string {
  if (typeof window !== 'undefined') {
    return (
      localStorage.getItem('gemini_api_key') ||
      cachedCloudAiKey ||
      ENV_GEMINI_KEY
    ).trim();
  }
  return (cachedCloudAiKey || ENV_GEMINI_KEY).trim();
}

export function hasApiKey(): boolean {
  return true;
}

export function setApiKey(key: string): void {
  const trimmed = key.trim();
  cachedCloudAiKey = trimmed;
  if (typeof window !== 'undefined') {
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }
  if (firebaseConfigured && db) {
    setDoc(
      doc(db, 'settings', 'ai_config'),
      { apiKey: trimmed, updatedAt: new Date().toISOString() },
      { merge: true }
    ).catch(() => {});
  }
}

export function clearApiKey(): void {
  cachedCloudAiKey = '';
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gemini_api_key');
  }
}

export function isCustomApiKey(): boolean {
  const k = getApiKey();
  return Boolean(
    k &&
      (k.startsWith('AIza') ||
        k.startsWith('gsk_') ||
        k.startsWith('sk-or-') ||
        k.startsWith('sk-'))
  );
}

/**
 * Cleans any raw LLM Markdown (tables, **, ###, ---, < >) into crisp, readable,
 * well-spaced medical text with clean bullet points and numbered sections.
 */
export function cleanAssistantMarkdown(raw: string): string {
  if (!raw) return '';
  let preservedActionTag = '';
  let workingRaw = raw;
  const actionMatch = workingRaw.match(/\[\[ACTION_CALL:\s*\{[\s\S]*?\}\s*\]\]/i);
  if (actionMatch) {
    preservedActionTag = actionMatch[0];
    workingRaw = workingRaw.replace(actionMatch[0], '').trim();
  }

  const preSplit = workingRaw
    .replace(/\|\s*\|/g, '\n|')
    .replace(/\s*#{2,6}\s*/g, '\n### ')
    .replace(/\s*---+\s*/g, '\n')
    .replace(/\s+-\s+(?=\*\*)/g, '\n• ')
    .replace(/\s+(?=\d+\.\s)/g, '\n');
  const lines = preSplit.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (const line of lines) {
    let s = line.trim();
    if (!s) {
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
        cleanedLines.push('');
      }
      continue;
    }

    if (/^[-=_*|:\s]+$/.test(s)) {
      continue;
    }

    if (s.includes('|')) {
      const cells = s
        .split('|')
        .map((c) => c.replace(/\*\*/g, '').replace(/[<>*#`_]/g, '').trim())
        .filter(Boolean);
      if (cells.length === 0) continue;
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

    if (/^#{1,6}\s+/.test(s)) {
      s = s.replace(/^#{1,6}\s+/, '').trim();
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
        cleanedLines.push('');
      }
      if (!s.endsWith(':')) s += ':';
    }

    s = s
      .replace(/\*\*/g, '')
      .replace(/__/g, '')
      .replace(/`/g, '')
      .replace(/<\s*>/g, '')
      .replace(/[<>]/g, '')
      .trim();

    s = s.replace(/^[-*]\s+/, '• ');

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

  const finalClean = cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return preservedActionTag ? `${finalClean}\n${preservedActionTag}` : finalClean;
}

export const SYSTEM_PROMPT = `أنت المساعد الذكي الشامل والمفتوح (AI Personal Health & General Assistant) لـ «منصة الوعي بالمضادات الحيوية».

أهم قواعد شخصيتك وطريقة كلامك:
1. **مفتوح لكل الأسئلة بدون قيود:** جاوب على **أي سؤال** يسأله المستخدم في أي مجال! سواء كان سؤال طبي عام، أي دواء (مسكنات، فيتامينات، أدوية برد، ضغط، سكر، معدة، مضادات حيوية)، قراءة تحاليل ومزارع بكتيرية (Culture & Sensitivity S/R)، تغذية، أعراض، أسلوب حياة، أو حتى دردشة عامة وأسئلة ثقافية أو يومية خارج الطب. لا ترفض أي سؤال عام أبداً، وخليك دايماً متعاون ومفيد.
2. **اللهجة المصرية العامية الودودة:** لما المستخدم يكلمك بالعربي، اتكلم معاه دايماً **بالمصري العامي الطبيعي الودود جداً** (زي دكتور أو صيدلي مصري شاطر وصاحبك بيكلمك ببساطة: "يا هلا بيك"، "بص يا سيدي"، "ألف سلامة عليك"، "من عنيا ليك"، "خلي بالك"، "طمني عليك") مع شرح المعلومة العلمية بطريقة سهلة ومبسطة يفهمها أي حد. لو المستخدم سأل بالإنجليزي أو الألماني أو الفرنسي أو الإسباني، رد بنفس لغته.
3. **الذكاء الإكلينيكي المتقدم (في الأسئلة الطبية):**
   - لو المريض سأل عن تحليل مزرعة (Culture & Sensitivity)، وضحله الفرق بين المضادات الحساسة (S - Sensitive) اللي بتجيب نتيجة، والمضادات المقاومة (R - Resistant) اللي مينفعش ياخدها لأن البكتيريا منيعة ضدها.
   - لو المريض عنده قصور في الكلى أو الكبد أو طفل صغير أو حامل (حسب ملفه الصحي المرفق)، نبهه دايماً لو الدوا محتاج تظبيط جرعة مع الكلى أو الوزن.
   - لو المريض بيسأل بعد يومين أو 3 أيام من أخذ المضاد الحيوي (متابعة الـ 72 ساعة)، اطمن على تحسن السخونية والأعراض وحذره من علامات الخطر زي الإسهال المدمم أو الطفح الجلدي.
4. **تنفيذ الأوامر في حساب المريض (Action Calling):**
   لو المستخدم طلب منك تنفيذ أي إجراء في ملفه الصحي أو أدويته أو منبهاته بأي طريقة كلام، اكتبله رد مصري عامي لطيف، وفي **آخر سطر في ردك بالضبط** حط كود الإجراء بالشكل ده:
   [[ACTION_CALL: {"actionType": "نوع_الإجراء", "args": {...}}]]

   أنواع الإجراءات المتاحة (actionType):
   - "add_chronic_condition": {"conditionName": "اسم المرض", "evidenceStatus": "patient_reported", "source": "patient_chat"}
   - "remove_chronic_condition": {"conditionName": "اسم المرض"}
   - "add_allergy": {"drugName": "اسم الدواء", "allergenKey": "penicillin|cephalosporin|sulfa|macrolide|fluoroquinolone|tetracycline|other", "reportedSymptoms": "الأعراض", "severity": "severe|moderate|mild|life_threatening", "evidenceStatus": "patient_reported"}
   - "remove_allergy": {"drugName": "اسم الدواء"}
   - "update_vitals": {"displayName": "...", "age": "...", "weightKg": "...", "bloodType": "A+|O+|...", "emergencyContact": "...", "pregnancyStatus": "pregnant|breastfeeding|none", "renalStatus": "normal|impaired", "hepaticStatus": "normal|impaired"}
   - "add_medication": {"drugName": "اسم الدواء", "prescribedDose": "التركيز/الجرعة", "route": "oral|suspension|injection|topical", "frequency": "once_daily|twice_daily|thrice_daily|four_times_daily", "status": "active", "evidenceStatus": "patient_reported", "source": "patient_chat"}
   - "remove_medication": {"drugName": "اسم الدواء"}
   - "create_reminder": {"medicineName": "اسم الدواء", "prescribedDose": "الجرعة", "route": "oral", "frequency": "twice_daily", "doseTimes": ["08:00", "20:00"], "durationDays": 5}
   - "update_reminder": {"medicineName": "اسم الدواء", "newDoseTimes": ["09:00", "21:00"]}
   - "stop_reminder": {"medicineName": "اسم الدواء"}
   - أوامر العرض المباشر: "show_allergies" أو "show_medications" أو "show_reminders" أو "show_prescriptions" أو "show_medical_documents" أو "summarize_health_records" مع "args": {}.

5. **قواعد التنسيق والسلامة الطبية:**
   - ممنوع استخدام جداول Markdown (|) أو نجوم التغميق ** أو علامات الشباك ### أو الخطوط ---.
   - رتب كلامك في فقرات قصيرة مريحة للعين واستخدم الترقيم (1. ، 2.) أو النقاط (•).
   - أوعى تقول لمريض يضاعف جرعة دوا نسيها، وفي الأسئلة الطبية والأدوية اختم بنصيحة ودودة بمراجعة الدكتور أو الصيدلي لتأكيد الجرعة.
   - في الطوارئ الحادة (ضيق تنفس شديد، تورم الوش واللسان، إغماء)، وجهه فوراً يكلم الإسعاف المصري (123).`;

export const COMPACT_CLOUD_SYSTEM_PROMPT = `أنت مساعد ذكي شامل ومتصل بالإنترنت (Live Web & Health AI Assistant).
قواعد هامة جداً:
1. جاوب على سؤال المستخدم بدقة ومباشرة باللهجة المصرية الودودة بناءً على سؤاله وبناءً على [البيانات الحية من الإنترنت] المرفقة مع السؤال.
2. إياك أن ترد بردود محفوظة أو عامة أو تتكلم عن موضوع مختلف عن سؤال المستخدم! لو سأل عن نتيجة ماتش أو موعد ماتش أو سعر أو خبر أو معلومة عامة أو طبية، جاوب على سؤاله بالظبط من المعلومات الحية المرفقة وبمعرفتك الدقيقة.
3. رتب الإجابة في نقاط واضحة ومباشرة بدون جداول Markdown (|) وبدون نجوم ** أو علامات ###.`;

function isValidCloudReply(text: string | undefined | null): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 4) return false;
  if (
    /^(<!DOCTYPE|<html|<head|\{"error"|502 Bad Gateway|504 Gateway|429 Too Many|Error:|Rate limit|Internal Server Error|Notice:|IMPORTANT NOTICE)/i.test(
      t
    )
  ) {
    return false;
  }
  return true;
}

/**
 * Strips any Pollinations ad/footer notices if present while preserving the AI's actual answer.
 */
function stripPollinationsFooter(text: string): string {
  return text
    .replace(/---\s*\n\s*\*\*Support Pollinations\.AI[\s\S]*$/i, '')
    .replace(/Support Pollinations\.AI[\s\S]*$/i, '')
    .replace(/🌸\s*Ad\s*🌸[\s\S]*$/i, '')
    .trim();
}

async function gtxTranslate(text: string, sl: string, tl: string): Promise<string> {
  if (!text || !text.trim()) return '';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3500);
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(
      text.slice(0, 1200)
    )}`;
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return text;
    const data = await res.json();
    if (Array.isArray(data?.[0])) {
      return data[0].map((seg: unknown[]) => (typeof seg?.[0] === 'string' ? seg[0] : '')).join('');
    }
  } catch {
    clearTimeout(timer);
  }
  return text;
}

/**
 * Fetches LIVE Arabic/Global news & web search snippets from Google News RSS (`news.google.com/rss/search`)
 * using browser-compatible CORS endpoints (`api.rss2json.com` and `api.allorigins.win/raw`).
 * This gives real-time scores (e.g. "ماتش الاهلي الاخير خلص كام"), upcoming fixtures, prices, and current events!
 */
async function fetchLiveGoogleNewsSnippets(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];

  // Improve search query for match scores / schedules so Google News returns exact score headlines
  let searchQ = q
    .replace(/خلص كام/g, 'نتيجة مباراة')
    .replace(/الجاي امتي|الجاي إمتى/g, 'موعد مباراة القادمة')
    .replace(/امتي|إمتى/g, 'موعد');

  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
    searchQ
  )}&hl=ar&gl=EG&ceid=EG:ar`;

  // 1) Try rss2json (fast JSON parser with CORS *)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.items) && data.items.length > 0) {
        return data.items.slice(0, 6).map((item: any) => {
          const title = (item.title || '').replace(/\s+/g, ' ').trim();
          const pubDate = item.pubDate ? item.pubDate.split(' ')[0] : '';
          const desc = (item.description || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          return `• [${pubDate}] ${title}${desc && desc !== title ? ` — ${desc.slice(0, 160)}` : ''}`;
        });
      }
    }
  } catch {
    /* fallback to allorigins XML parse */
  }

  // 2) Try allorigins.win/raw XML parsing
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    const res = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (res.ok) {
      const xml = await res.text();
      const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, 6);
      const snippets: string[] = [];
      for (const m of itemMatches) {
        const block = m[1];
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
        const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const title = (titleMatch?.[1] || '')
          .replace(/<!\[CDATA\[|\]\]>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .trim();
        const dateStr = dateMatch?.[1] ? new Date(dateMatch[1]).toLocaleDateString('ar-EG') : '';
        if (title) {
          snippets.push(`• ${dateStr ? `[${dateStr}] ` : ''}${title}`);
        }
      }
      if (snippets.length > 0) return snippets;
    }
  } catch {
    /* ignore */
  }

  return [];
}

interface FootballTeamMapping {
  nameAr: string;
  nameEn: string;
  espnId?: string;
  espnLeague?: string;
  patterns: RegExp;
}

const FOOTBALL_TEAMS: FootballTeamMapping[] = [
  {
    nameAr: 'ريال مدريد',
    nameEn: 'Real Madrid',
    espnId: '86',
    espnLeague: 'esp.1',
    patterns: /(ريال مدريد|الريال|ملكي|ميرينجي|real madrid)/i,
  },
  {
    nameAr: 'برشلونة',
    nameEn: 'Barcelona',
    espnId: '83',
    espnLeague: 'esp.1',
    patterns: /(برشلونه|برشلونة|البارسا|البرسا|كتالوني|barcelona|barca)/i,
  },
  {
    nameAr: 'الأهلي المصري',
    nameEn: 'Al Ahly',
    patterns: /(الاهلي|الأهلي|اهلي|أهلي|al ahly)/i,
  },
  {
    nameAr: 'الزمالك',
    nameEn: 'Zamalek',
    patterns: /(الزمالك|زمالك|zamalek)/i,
  },
  {
    nameAr: 'ليفربول',
    nameEn: 'Liverpool',
    espnId: '364',
    espnLeague: 'eng.1',
    patterns: /(ليفربول|ليفر|الريدز|ماتش صلاح|ماتش محمد صلاح|liverpool)/i,
  },
  {
    nameAr: 'مانشستر سيتي',
    nameEn: 'Manchester City',
    espnId: '382',
    espnLeague: 'eng.1',
    patterns: /(مانشستر سيتي|السيتي|مان سيتي|ماتش مرموش|manchester city|man city)/i,
  },
  {
    nameAr: 'أرسنال',
    nameEn: 'Arsenal',
    espnId: '359',
    espnLeague: 'eng.1',
    patterns: /(ارسنال|أرسنال|الجانرز|arsenal)/i,
  },
  {
    nameAr: 'تشيلسي',
    nameEn: 'Chelsea',
    espnId: '363',
    espnLeague: 'eng.1',
    patterns: /(تشيلسي|البلوز|chelsea)/i,
  },
  {
    nameAr: 'مانشستر يونايتد',
    nameEn: 'Manchester United',
    espnId: '360',
    espnLeague: 'eng.1',
    patterns: /(مانشستر يونايتد|اليونايتد|مان يونايتد|manchester united|man utd)/i,
  },
  {
    nameAr: 'بايرن ميونخ',
    nameEn: 'Bayern Munich',
    espnId: '132',
    espnLeague: 'ger.1',
    patterns: /(بايرن|بايرن ميونخ|البافاري|bayern)/i,
  },
  {
    nameAr: 'باريس سان جيرمان',
    nameEn: 'Paris Saint-Germain',
    espnId: '160',
    espnLeague: 'fra.1',
    patterns: /(باريس سان جيرمان|باريس|بي اس جي|\bpsg\b)/i,
  },
  {
    nameAr: 'إنتر ميلان',
    nameEn: 'Inter Milan',
    espnId: '110',
    espnLeague: 'ita.1',
    patterns: /(انتر ميلان|إنتر ميلان|الانتر|الإنتر|\binter milan\b)/i,
  },
  {
    nameAr: 'إي سي ميلان',
    nameEn: 'AC Milan',
    espnId: '103',
    espnLeague: 'ita.1',
    patterns: /(اي سي ميلان|ميلان|\bac milan\b)/i,
  },
  {
    nameAr: 'يوفنتوس',
    nameEn: 'Juventus',
    espnId: '111',
    espnLeague: 'ita.1',
    patterns: /(يوفنتوس|اليوفي|juventus)/i,
  },
  {
    nameAr: 'أتلتيكو مدريد',
    nameEn: 'Atletico Madrid',
    espnId: '1068',
    espnLeague: 'esp.1',
    patterns: /(اتلتيكو|أتلتيكو|atletico)/i,
  },
  {
    nameAr: 'منتخب مصر',
    nameEn: 'Egypt',
    espnId: '656',
    patterns: /(منتخب مصر|المنتخب المصري|ماتش مصر|مباراه مصر|مباراة مصر)/i,
  },
];

function formatCairoDateTime(isoDateStr: string): { dateAr: string; timeAr: string; relativeAr: string } {
  const dt = new Date(isoDateStr);
  if (Number.isNaN(dt.getTime())) {
    return { dateAr: isoDateStr, timeAr: '', relativeAr: '' };
  }
  const dateAr = dt.toLocaleDateString('ar-EG', {
    timeZone: 'Africa/Cairo',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeAr = dt.toLocaleTimeString('ar-EG', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
  });

  const now = new Date();
  const diffMs = dt.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let relativeAr = '';
  if (diffMs > 0) {
    if (diffHours < 24) relativeAr = `(خلال ${diffHours} ساعة من الآن 🔥)`;
    else if (diffDays === 1) relativeAr = '(غداً إن شاء الله 🔥)';
    else if (diffDays > 1 && diffDays <= 14) relativeAr = `(بعد ${diffDays} أيام)`;
  } else if (diffMs > -3 * 60 * 60 * 1000) {
    relativeAr = '(جارية الآن / اليوم 🔴)';
  }
  return { dateAr, timeAr, relativeAr };
}

/**
 * Fetches live football schedule & past scores from ESPN API + TheSportsDB searchevents + Google News Egypt RSS
 */
async function fetchLiveFootballData(rawQuestion: string): Promise<string | null> {
  const q = rawQuestion.trim();
  const isMatchQuery =
    /(ماتش|ماتشات|مباراه|مباراة|مباريات|يلعب امتي|هيلعب امتي|الجاي امتي|القادمه|القادمة|نتيجه|نتيجة|خلص كام|جدول مباريات|\bnext match\b|\bmatch\b|\bscore\b)/i.test(
      q
    );
  const matchedTeam = FOOTBALL_TEAMS.find((t) => t.patterns.test(q));
  if (!isMatchQuery && !matchedTeam) return null;

  const infoParts: string[] = [];

  // 1) If team has ESPN ID, fetch both upcoming and last completed match from ESPN Schedule API
  if (matchedTeam?.espnId) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4500);
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${matchedTeam.espnLeague || 'esp.1'}/teams/${matchedTeam.espnId}/schedule`;
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const events: Array<Record<string, any>> = Array.isArray(data?.events) ? data.events : [];
        const nowMs = Date.now();
        const upcoming = events
          .filter((e) => new Date(e.date).getTime() >= nowMs - 2 * 60 * 60 * 1000)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const past = events
          .filter((e) => new Date(e.date).getTime() < nowMs - 2 * 60 * 60 * 1000)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (upcoming.length > 0) {
          const nxt = upcoming[0];
          const { dateAr, timeAr, relativeAr } = formatCairoDateTime(nxt.date);
          const matchTitleAr = await gtxTranslate((nxt.name || '').replace(' at ', ' ضد '), 'en', 'ar');
          infoParts.push(
            `• المباراة القادمة لـ ${matchedTeam.nameAr}: ${matchTitleAr} — يوم ${dateAr} ${relativeAr} الساعة ${timeAr} بتوقيت مصر 🇪🇬`
          );
        }
        if (past.length > 0) {
          const lst = past[0];
          const comp = lst.competitions?.[0];
          const c1 = comp?.competitors?.[0];
          const c2 = comp?.competitors?.[1];
          const { dateAr } = formatCairoDateTime(lst.date);
          const scoreStr =
            c1 && c2
              ? `${c1.team?.displayName || ''} (${c1.score?.displayValue ?? ''}) - (${c2.score?.displayValue ?? ''}) ${c2.team?.displayName || ''}`
              : lst.name || '';
          const scoreAr = await gtxTranslate(scoreStr, 'en', 'ar');
          infoParts.push(`• نتيجة آخر مباراة لـ ${matchedTeam.nameAr} (${dateAr}): ${scoreAr} (${scoreStr})`);
        }
      }
    } catch {
      /* continue */
    }

    // Also check ESPN team nextEvent in case next match is in Champions League (`uefa.champions`)
    if (infoParts.length === 0) {
      for (const lg of ['uefa.champions', matchedTeam.espnLeague || 'esp.1']) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 4000);
          const res = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/${lg}/teams/${matchedTeam.espnId}`,
            { signal: ctrl.signal }
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            const ev = data?.team?.nextEvent?.[0];
            if (ev) {
              const { dateAr, timeAr, relativeAr } = formatCairoDateTime(ev.date);
              const evNameAr = await gtxTranslate((ev.name || '').replace(' at ', ' ضد '), 'en', 'ar');
              infoParts.push(
                `• المباراة القادمة لـ ${matchedTeam.nameAr}: ${evNameAr} — يوم ${dateAr} ${relativeAr} الساعة ${timeAr} بتوقيت مصر 🇪🇬`
              );
              break;
            }
          }
        } catch {
          /* continue */
        }
      }
    }
  }

  // 2) Always fetch live Google News Egypt sports headlines for the query (especially crucial for Al Ahly, Zamalek, Egyptian League, or latest match scores!)
  const sportNewsQuery = matchedTeam
    ? `${matchedTeam.nameAr} نتيجة موعد مباراة`
    : q;
  const newsSnippets = await fetchLiveGoogleNewsSnippets(sportNewsQuery);
  if (newsSnippets.length > 0) {
    infoParts.push(`أحدث الأخبار والنتائج المباشرة من جوجل نيوز مصر:\n${newsSnippets.slice(0, 4).join('\n')}`);
  }

  if (infoParts.length > 0) {
    return infoParts.join('\n\n');
  }
  return null;
}

/**
 * Gathers real-time facts from the internet (Sports, Google News RSS, Weather, Currency, Prayer Times)
 * so the AI LLM can answer with 100% up-to-date live internet information!
 */
async function gatherLiveInternetContext(rawQuestion: string): Promise<{
  directFormattedReply: string | null;
  webContextForAi: string;
}> {
  const q = rawQuestion.trim();
  if (!q) return { directFormattedReply: null, webContextForAi: '' };

  // 1) Football & Match Queries
  if (
    /(ماتش|ماتشات|مباراه|مباراة|مباريات|خلص كام|نتيجه ماتش|نتيجة ماتش|الريال|ريال مدريد|برشلونه|برشلونة|الاهلي|الأهلي|الزمالك|ليفربول|مانشستر|سيتي|ارسنال|أرسنال|تشيلسي|بايرن|باريس|انتر|ميلان|يوفنتوس|منتخب مصر|الهلال|النصر|بيراميدز|\bmatch\b|\bscore\b)/i.test(
      q
    )
  ) {
    const footballData = await fetchLiveFootballData(q);
    if (footballData) {
      return {
        directFormattedReply: `⚽ **تحديث رياضي مباشر من الإنترنت:**\n\n${footballData}`,
        webContextForAi: `[بيانات المباريات والنتائج الحية من الإنترنت الآن:\n${footballData}]`,
      };
    }
  }

  // 2) Live Weather
  if (/(الطقس|الجو عامل ايه|درجه الحراره|درجة الحرارة|حراره الجو|المطر النهارده|\bweather\b)/i.test(q)) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=30.0444&longitude=31.2357&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Africa%2FCairo',
        { signal: ctrl.signal }
      );
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        const curr = data?.current?.temperature_2m;
        const maxT = data?.daily?.temperature_2m_max?.[0];
        const minT = data?.daily?.temperature_2m_min?.[0];
        const hum = data?.current?.relative_humidity_2m;
        const wind = data?.current?.wind_speed_10m;
        if (curr !== undefined) {
          const wText =
            `حالة الطقس المباشرة الآن في مصر (القاهرة): 🌤️\n` +
            `• درجة الحرارة الحالية: ${curr}° مئوية (العظمى: ${maxT ?? curr}° | الصغرى: ${minT ?? curr}°)\n` +
            `• الرطوبة: ${hum ?? 50}% | سرعة الرياح: ${wind ?? 12} كم/ساعة`;
          return {
            directFormattedReply: wText,
            webContextForAi: `[${wText}]`,
          };
        }
      }
    } catch {
      /* continue */
    }
  }

  // 3) Live Currency Exchange Rates
  if (/(سعر الدولار|الدولار بكام|سعر الريال|الريال بكام|سعر اليورو|اليورو بكام|سعر الدرهم|سعر الدينار|اسعار العملات|أسعار العملات|\bexchange rate\b|\busd to egp\b)/i.test(q)) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        const egp = data?.rates?.EGP;
        const sar = data?.rates?.SAR;
        const eur = data?.rates?.EUR;
        const aed = data?.rates?.AED;
        const kwd = data?.rates?.KWD;
        if (egp) {
          const cText =
            `أسعار صرف العملات مقابل الجنيه المصري (تحديث مباشر): 💵\n` +
            `• الدولار الأمريكي: ${Number(egp).toFixed(2)} ج.م\n` +
            `• اليورو: ${eur ? (egp / eur).toFixed(2) : '—'} ج.م\n` +
            `• الريال السعودي: ${sar ? (egp / sar).toFixed(2) : '—'} ج.م\n` +
            `• الدرهم الإماراتي: ${aed ? (egp / aed).toFixed(2) : '—'} ج.م\n` +
            `• الدينار الكويتي: ${kwd ? (egp / kwd).toFixed(2) : '—'} ج.م`;
          return {
            directFormattedReply: cText,
            webContextForAi: `[${cText}]`,
          };
        }
      }
    } catch {
      /* continue */
    }
  }

  // 4) Live Prayer Times
  if (/(مواعيد الصلاه|مواعيد الصلاة|مواقيت الصلاه|مواقيت الصلاة|اذان الفجر|أذان الفجر|اذان المغرب|أذان المغرب|اذان الظهر|اذان العصر|اذان العشاء|الصلاه امتي|الصلاة امتى|\bprayer times\b)/i.test(q)) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch(
        'https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5',
        { signal: ctrl.signal }
      );
      clearTimeout(t);
      if (res.ok) {
        const json = await res.json();
        const timings = json?.data?.timings;
        if (timings) {
          const pText =
            `مواقيت الصلاة اليوم في مصر: 🕌\n` +
            `• الفجر: ${timings.Fajr} | الشروق: ${timings.Sunrise} | الظهر: ${timings.Dhuhr} | العصر: ${timings.Asr} | المغرب: ${timings.Maghrib} | العشاء: ${timings.Isha}`;
          return {
            directFormattedReply: pText,
            webContextForAi: `[${pText}]`,
          };
        }
      }
    } catch {
      /* continue */
    }
  }

  // 5) For current events / news / prices (e.g. gold, news, recent events), fetch Google News snippets
  if (/(اخبار|أخبار|سعر الدهب|سعر الذهب|الدهب بكام|الذهب بكام|حدث|النهارده|امبارح|امس|اليوم|الجديد)/i.test(q)) {
    const news = await fetchLiveGoogleNewsSnippets(q);
    if (news.length > 0) {
      const newsBlock = `أحدث النتائج والأخبار المباشرة من الإنترنت اليوم:\n${news.slice(0, 5).join('\n')}`;
      return {
        directFormattedReply: newsBlock,
        webContextForAi: `[${newsBlock}]`,
      };
    }
  }

  return { directFormattedReply: null, webContextForAi: '' };
}

export interface ChatMessage {
  who: 'me' | 'bot';
  text: string;
}

export async function askGemini(
  question: string,
  history: ChatMessage[] = [],
  rawUserQuestion?: string
): Promise<string> {
  let key = getApiKey();
  if (!key) {
    key = await loadSharedCloudAiKey();
  }
  const emerg = getCurrentEmergencyInfo();
  const dynamicSystemPrompt = SYSTEM_PROMPT.replace(
    'الإسعاف المصري (123)',
    `طوارئ ${emerg.name.ar} (${emerg.number})`
  );

  const cleanUserQ = (
    rawUserQuestion ||
    question.split('\n\n[ملف المريض:')[0] ||
    question
  ).trim();

  // Gather real-time internet data (ESPN, Google News Egypt RSS, Weather, Currency, Prayer)
  const { directFormattedReply, webContextForAi } = await gatherLiveInternetContext(cleanUserQ);

  const questionWithLiveWeb = webContextForAi
    ? `${cleanUserQ}\n\n${webContextForAi}`
    : cleanUserQ;

  const fullPromptForKeyedModels = webContextForAi
    ? `${question}\n\n${webContextForAi}`
    : question;

  // 1) Official Google Gemini API (when a valid AIza... key is present)
  if (key && key.startsWith('AIza')) {
    for (const geminiModel of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 11000);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`;
        const recentHistory = history.slice(-8);
        const contents = [
          ...recentHistory.map((m) => ({
            role: m.who === 'me' ? 'user' : 'model',
            parts: [{ text: (m.text || '').slice(0, 600) }],
          })),
          {
            role: 'user',
            parts: [{ text: fullPromptForKeyedModels }],
          },
        ];

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: dynamicSystemPrompt }] },
            contents,
            generationConfig: { temperature: 0.35, maxOutputTokens: 850 },
          }),
        });
        clearTimeout(timer);

        if (response.ok) {
          const data = await response.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (isValidCloudReply(reply)) return cleanAssistantMarkdown(reply);
        }
      } catch {
        clearTimeout(timer);
      }
    }
  }

  // 1B) Groq Cloud API (if `gsk_...` key is present)
  if (key && key.startsWith('gsk_')) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const groqMessages = [
        { role: 'system', content: dynamicSystemPrompt },
        ...history.slice(-6).map((m) => ({
          role: m.who === 'me' ? 'user' : 'assistant',
          content: (m.text || '').slice(0, 500),
        })),
        { role: 'user', content: fullPromptForKeyedModels },
      ];
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          temperature: 0.35,
          max_tokens: 850,
        }),
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (isValidCloudReply(reply)) return cleanAssistantMarkdown(reply);
      }
    } catch {
      clearTimeout(timer);
    }
  }

  // 2) Keyless Cloud AI Models (`searchgpt`, `openai`, `mistral`) grounded with Live Internet Context!
  const compactHistory = history
    .slice(-4)
    .filter((m) => Boolean(m.text && m.text.trim()))
    .map((m) => ({
      role: m.who === 'me' ? 'user' : 'assistant',
      content: m.text.slice(0, 300),
    }));

  const isMedicalOrActionQuery =
    /(دوا|دواء|مضاد|جرعه|جرعة|مرض|حساسيه|حساسية|سجل|ضيف|منبه|روشته|روشتة|تحليل|ملفي|الم|وجع|سعر|بديل)/i.test(
      cleanUserQ
    );
  const effectiveUserContent = isMedicalOrActionQuery
    ? `${question.slice(0, 800)}${webContextForAi ? `\n${webContextForAi}` : ''}`
    : questionWithLiveWeb;

  const compactMessages = [
    { role: 'system', content: COMPACT_CLOUD_SYSTEM_PROMPT },
    ...compactHistory,
    { role: 'user', content: effectiveUserContent },
  ];

  // Try searchgpt first when asking about live events/matches/news, then openai, then mistral
  const modelsOrder = webContextForAi
    ? ['openai', 'searchgpt', 'mistral']
    : ['openai', 'searchgpt', 'mistral'];

  for (const modelName of modelsOrder) {
    const pollController = new AbortController();
    const pollTimer = setTimeout(() => pollController.abort(), 10000);
    try {
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: pollController.signal,
        body: JSON.stringify({
          model: modelName,
          messages: compactMessages,
          temperature: 0.3,
        }),
      });
      clearTimeout(pollTimer);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          const text = stripPollinationsFooter(
            json?.choices?.[0]?.message?.content || json?.response || ''
          );
          if (isValidCloudReply(text)) {
            return cleanAssistantMarkdown(text);
          }
        } else {
          const rawTxt = stripPollinationsFooter(await res.text());
          if (isValidCloudReply(rawTxt)) {
            return cleanAssistantMarkdown(rawTxt);
          }
        }
      }
    } catch {
      clearTimeout(pollTimer);
    }
  }

  // 3) Pollinations GET endpoint (with short prompt)
  {
    const getController = new AbortController();
    const getTimer = setTimeout(() => getController.abort(), 8000);
    try {
      const shortPrompt = `رد بالمصري العامي بدقة ومباشرة على السؤال ده: ${cleanUserQ.slice(0, 160)}`;
      const res = await fetch(
        `https://text.pollinations.ai/${encodeURIComponent(shortPrompt)}`,
        { signal: getController.signal }
      );
      clearTimeout(getTimer);
      if (res.ok) {
        const txt = stripPollinationsFooter(await res.text());
        if (isValidCloudReply(txt)) return cleanAssistantMarkdown(txt);
      }
    } catch {
      clearTimeout(getTimer);
    }
  }

  // 4) If Cloud LLM generation timed out but we already fetched verified live internet data (ESPN / Google News / Weather / Currency / Prayer), return it directly!
  if (directFormattedReply) {
    return cleanAssistantMarkdown(directFormattedReply);
  }

  // 5) Final fallback: Fetch live Google News Egypt snippets for ANY open question so it still brings real results from the internet!
  const fallbackNews = await fetchLiveGoogleNewsSnippets(cleanUserQ);
  if (fallbackNews.length > 0) {
    return cleanAssistantMarkdown(
      `إليك أحدث النتائج المباشرة من الإنترنت بخصوص «${cleanUserQ}»:\n\n${fallbackNews.join('\n')}`
    );
  }

  throw new Error('ALL_AI_ENDPOINTS_UNAVAILABLE');
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

/**
 * Normalizes Arabic and English text for phonetic & fuzzy matching
 */
export function normalizePharmaText(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
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
 * (e.g., زيثروماكس vs ريثروماكس / زيتروماكس / يثروماكس) still match accurately
 */
export function normalizeArabicSkeleton(str: string): string {
  return normalizePharmaText(str)
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

const PHARMA_STOP_WORDS = new Set([
  'tablet', 'tablets', 'tab', 'capsule', 'capsules', 'cap', 'suspension', 'syrup',
  'vial', 'ampoule', 'amp', 'infusion', 'drops', 'cream', 'ointment', 'sachet',
  'oral', 'film', 'coated', 'forte', 'retard', 'pediatric', 'plus', 'acid',
  'potassium', 'sodium', 'trihydrate', 'hydrate', 'hydrochloride', 'sulfate',
  'topical', 'ophthalmic', 'eye', 'ear', 'gel', 'solution', 'powder', 'for',
  'injection', 'iv', 'im', 'sr', 'xl', 'es', 'ds', 'mg', 'gm', 'ml', 'mcg', 'iu',
  'unknown', 'unreadable', 'drug', 'name', 'medicine', 'antibiotic', 'box', 'strip', 'pack',
  'egypt', 'pharma', 'pharmaceuticals', 'company', 'pfizer', 'gsk', 'sanofi', 'novartis',
  'اقراص', 'قرص', 'كبسول', 'كبسولات', 'شراب', 'معلق', 'فيال', 'امبول', 'حقن', 'للحقن',
  'وريدي', 'الوريدي', 'عضلي', 'العضلي', 'نقط', 'قطره', 'كريم', 'مرهم', 'موضعي', 'فوار',
  'اكياس', 'كيس', 'مجم', 'جم', 'مل', 'مغلفه', 'مضاعف', 'القوه', 'للاطفال', 'اطفال',
  'للرضع', 'رضع', 'فمويه', 'فموي', 'كبار', 'حمض', 'تركيز', 'عبوه', 'شريط', 'دواء',
  'مضاد', 'حيوي', 'جل', 'محلول', 'بودره', 'قطرات', 'عين', 'اذن', 'العيون', 'الاذن',
  'بوتاسيوم', 'صوديوم', 'شركه', 'الماده', 'الفعاله', 'روشته', 'طبيب', 'صيدلي',
]);

export const OCR_ALIASES: Array<{
  aliases: string[];
  tradeNameAr: string;
  ingredientId: string;
}> = [
  {
    aliases: ['زيثروماكس', 'ريثروماكس', 'زيتروماكس', 'يثروماكس', 'زيترومكس', 'ريثرومكس', 'zithromax', 'ithromax', 'azithromax'],
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
    aliases: ['ديلزوسين', 'delzosin'],
    tradeNameAr: 'ديلزوسين 500 مجم كبسول',
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
    aliases: ['ايموكس', 'إيموكس', 'emox', 'e mox', 'biomox', 'بيوموكس'],
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
    aliases: ['سوبراكس', 'suprax', 'سيفيكس', 'cefix', 'زيماسيف', 'ximacef', 'ماجناسيف', 'magnacef'],
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

const DRUG_KEYWORD_TO_ID: Array<{ pattern: RegExp; id: string; label: string }> = [
  { pattern: /(augmentin|hibiotic|\bcuram\b|megamox|klavox|emoxclav|amoxicillin\s*\+?\s*clav|اوجمنتين|أوجمنتين|اوغمنتين|هاي\s*بيوتك|كيورام|كورام|ميجاموكس|كلافوكس|ايموكسكلاف)/i, id: 'amoxicillin-clavulanic-acid', label: 'Augmentin / Amoxicillin-Clavulanate (أوجمنتين)' },
  { pattern: /(amoxicillin|amoxil|\be-mox\b|\bemox\b|biomox|اموكسيسيلين|أموكسيسيلين|اموكسيل|ايموكس)/i, id: 'amoxicillin', label: 'Amoxicillin (أموكسيسيلين)' },
  { pattern: /(unasyn|sigmacyn|ultracillin|ampicillin\s*\+?\s*sulbactam|يوناسين|امبيسيلين)/i, id: 'ampicillin-sulbactam', label: 'Unasyn / Ampicillin-Sulbactam (يوناسين)' },
  { pattern: /(floxamo|flucil|flucloxacillin|فلوكسامو|فلوسيل|فلوكلوكساسيللين)/i, id: 'flucloxacillin', label: 'Flucloxacillin (فلوكسامو)' },
  { pattern: /(\bospen\b|penicillin\s*v|اوسبن|أوسبن|اوسبين|أوسبين|بنسلين)/i, id: 'penicillin-v-potassium', label: 'Penicillin V / Ospen (أوسبن)' },
  { pattern: /(ceporex|ospexin|keflex|ibilex|cephalexin|سيبوريكس|كيبوركس|اوسبكسين|سيفالكسين)/i, id: 'cephalexin', label: 'Cephalexin / Ceporex (كيبوركس)' },
  { pattern: /(duricef|biodroxil|ibidroxil|cefadroxil|ديوريسيف|بيودروكسيل|سيفادروكسيل)/i, id: 'cefadroxil', label: 'Cefadroxil / Duricef (ديوريسيف)' },
  { pattern: /(zinnat|zinacef|cefuroxime|زينات|سيفوروكسيم)/i, id: 'cefuroxime', label: 'Cefuroxime / Zinnat (زينات)' },
  { pattern: /(suprax|magnacef|ximacef|cefixime|سوبراكس|ماجناسيف|سيفيكسيم)/i, id: 'cefixime', label: 'Cefixime / Suprax (سوبراكس)' },
  { pattern: /(omnicef|\bdinar\b|cefdinir|اومنيسيف|أومنيسيف|دينار|سيفدينير)/i, id: 'cefdinir', label: 'Cefdinir / Omnicef (أومنيسيف)' },
  { pattern: /(rocephin|epicephin|cefaxone|wintriaxone|ceftriaxone|روسيفين|ابيسفين|إبيسفين|سيفاكسون|وينترياكسون|سيفترياكسون)/i, id: 'ceftriaxone', label: 'Ceftriaxone / Rocephin (روسيفين)' },
  { pattern: /(cefotax|claforan|cefotaxime|سيفوتاكس|كلافوران|سيفوتاكسيم)/i, id: 'cefotaxime', label: 'Cefotaxime / Cefotax (سيفوتاكس)' },
  { pattern: /(sulperazon|cefozone|cefoperazone|سيلبيرازون|سيفوبيرازون)/i, id: 'cefoperazone-sulbactam', label: 'Cefoperazone-Sulbactam / Sulperazon (سيلبيرازون)' },
  { pattern: /(maxipime|wincef|cefepime|ماكسيبيم|سيفيبيم)/i, id: 'cefepime', label: 'Cefepime / Maxipime (ماكسيبيم)' },
  { pattern: /(zithromax|ithromax|xithrone|zithrokan|epizithro|zisrocin|azithromycin|delzosin|زيثروماكس|ريثروماكس|زيتروماكس|يثروماكس|زيثرون|زيثروكان|ايبيزيثرو|زيسروسين|ازيثرومايسين|أزيثرومايسين)/i, id: 'azithromycin', label: 'Azithromycin / Zithromax (زيثروماكس)' },
  { pattern: /(klacid|clarikan|clarithromycin|كلاسيد|كلاريكان|كلاريثرومايسين)/i, id: 'clarithromycin', label: 'Clarithromycin / Klacid (كلاسيد)' },
  { pattern: /(erythrocin|erythromycin|اريثروسين|إريثرومايسين)/i, id: 'erythromycin', label: 'Erythromycin (إريثرومايسين)' },
  { pattern: /(ciprofar|ciprobay|ciprofloxacin|ciprocin|cipromay|سيبروفار|سبروفار|سيبروباي|سيبروسين|سيبروفلوكساسين)/i, id: 'ciprofloxacin', label: 'Ciprofloxacin / Ciprofar (سيبروفار)' },
  { pattern: /(tavanic|levoxin|levodel|tarivid|levofloxacin|تافانيك|تافانك|ليفوكسين|ليفوديل|ليفوفلوكساسين)/i, id: 'levofloxacin', label: 'Levofloxacin / Tavanic (تافانيك)' },
  { pattern: /(avelox|avalox|moxiflox|vigamox|moxifloxacin|افيلوكس|أفيلوكس|موكسيفلوكساسين)/i, id: 'moxifloxacin', label: 'Moxifloxacin / Avelox (أفيلوكس)' },
  { pattern: /(vibramycin|tabocin|doxymycin|doxycycline|فيبراميسين|تابوسين|دوكسيسيكلين)/i, id: 'doxycycline', label: 'Doxycycline / Vibramycin (تابوسين)' },
  { pattern: /(dalacin|clindamycin|clindam|alfaclind|دالاسين|كليندام|كليندامايسين)/i, id: 'clindamycin', label: 'Clindamycin / Dalacin C (دالاسين)' },
  { pattern: /(flagyl|amrizole|metronidazole|فلاجيل|فلاحيل|امريزول|أمريزول|ميترونيدازول)/i, id: 'metronidazole', label: 'Metronidazole / Flagyl (فلاجيل)' },
  { pattern: /(macrofuran|uvamin|mepafuran|nitrofurantoin|ماكروفيوران|يوفامين|نيتروفورانتوين)/i, id: 'nitrofurantoin', label: 'Nitrofurantoin / Macrofuran (ماكروفيوران)' },
  { pattern: /(septazole|sutrim|septrin|co-trimoxazole|trimethoprim|سبتازول|سبترين|سوتريم|كوتريموكسازول)/i, id: 'co-trimoxazole', label: 'Co-trimoxazole / Septazole (سبتازول)' },
  { pattern: /(garamycin|epigent|gentamicin|جاراميسين|جنتامايسين)/i, id: 'gentamicin', label: 'Gentamicin / Garamycin (جاراميسين)' },
  { pattern: /(amikin|amikabiotic|mikacin|amikacin|اميكين|أميكين|أميكاسين)/i, id: 'amikacin', label: 'Amikacin / Amikin (أميكين)' },
  { pattern: /(meronem|meropenem|ميرونيم|ميروبينيم)/i, id: 'meropenem', label: 'Meropenem / Meronem (ميرونيم)' },
  { pattern: /(vancocin|vancomix|vancomycin|فانكوسين|فانكومايسين)/i, id: 'vancomycin', label: 'Vancomycin (فانكومايسين)' },
  { pattern: /(\bzyvox\b|averozolid|linolid|linezolid|زيفوكس|افيروزوليد|أفيروزوليد|لينيزوليد)/i, id: 'linezolid', label: 'Linezolid / Averozolid (أفيروزوليد)' },
  { pattern: /(fucidin|fusiderm|fusibact|fusidic|فيوسيدين|فيوسيديرم|حمض الفيوسيديك)/i, id: 'fusidic-acid', label: 'Fusidic Acid / Fucidin (فيوسيدين)' },
  { pattern: /(\btrcid\b|gastrobiotic|endorifax|rifaximin|تراسيد|جاستروبيوتك|ريفاكسيمين)/i, id: 'rifaximin', label: 'Rifaximin / Gastrobiotic (تراسيد)' },
];

/**
 * Universal Bilingual Scoring Matcher across all 206 Egyptian Commercial Products,
 * 32 Active Ingredients, and OCR Phonetic/Dot-Skeleton Aliases.
 */
export function matchEgyptianDrugFromText(rawText: string): {
  matchedProduct: EgyptianCommercialProduct | null;
  matchedIngredientId: string | null;
  detectedDrugName: string;
  score: number;
} {
  const raw = (rawText || '').trim();
  if (!raw) {
    return { matchedProduct: null, matchedIngredientId: null, detectedDrugName: '', score: 0 };
  }

  // 1) Check exact barcode (622...) in raw text
  const eanMatches = raw.match(/622\d{10}/g);
  if (eanMatches) {
    for (const bc of eanMatches) {
      const exactBc = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.barcode === bc);
      if (exactBc) {
        return {
          matchedProduct: exactBc,
          matchedIngredientId: exactBc.activeIngredientId,
          detectedDrugName: `${exactBc.tradeNameAr} (${exactBc.tradeNameEn})`,
          score: 250,
        };
      }
    }
  }

  const clean = normalizePharmaText(raw);
  const cleanWords = clean.split(' ').filter(Boolean);
  const inWords = cleanWords.filter(
    (w) =>
      w.length >= 2 &&
      !PHARMA_STOP_WORDS.has(w) &&
      !/^\d+(mg|g|gm|ml|mcg|iu)?$/.test(w)
  );

  let bestProd: EgyptianCommercialProduct | null = null;
  let bestScore = 0;

  for (const p of EGYPTIAN_COMMERCIAL_PRODUCTS) {
    const arWords = normalizePharmaText(p.tradeNameAr)
      .split(' ')
      .filter((w) => w.length >= 2 && !PHARMA_STOP_WORDS.has(w) && !/^\d+$/.test(w));
    const enWords = normalizePharmaText(p.tradeNameEn)
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

    // B. OCR_ALIASES check
    if (score === 0) {
      for (const entry of OCR_ALIASES) {
        if (entry.ingredientId === p.activeIngredientId) {
          const aliasHit = entry.aliases.some((al) => {
            const alNorm = normalizePharmaText(al);
            return alNorm.length >= 4 && clean.includes(alNorm);
          });
          if (aliasHit && p.tradeNameAr.includes(entry.tradeNameAr.split(' ')[0])) {
            score = Math.max(score, 128);
          }
        }
      }
    }

    // C. Fuzzy Levenshtein & Arabic Dot-Skeleton Match on Brand Words
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

    // D. Active Ingredient Match (English & Arabic generic names)
    const ing = ACTIVE_INGREDIENTS.find((a) => a.id === p.activeIngredientId);
    if (ing) {
      const ingArTokens = normalizePharmaText(ing.nameAr)
        .split(' ')
        .filter((w) => w.length >= 3 && !PHARMA_STOP_WORDS.has(w));
      const ingEnTokens = normalizePharmaText(ing.nameEn)
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

    // E. Secondary Tie-Breaker: Strength & Dosage Form
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
      const prodNorm = `${normalizePharmaText(p.tradeNameAr)} ${normalizePharmaText(p.tradeNameEn)}`;
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
    return {
      matchedProduct: bestProd,
      matchedIngredientId: bestProd.activeIngredientId,
      detectedDrugName: `${bestProd.tradeNameAr} (${bestProd.tradeNameEn})`,
      score: bestScore,
    };
  }

  for (const item of DRUG_KEYWORD_TO_ID) {
    if (item.pattern.test(raw)) {
      const rep = EGYPTIAN_COMMERCIAL_PRODUCTS.find((p) => p.activeIngredientId === item.id) || null;
      return {
        matchedProduct: rep,
        matchedIngredientId: item.id,
        detectedDrugName: rep ? `${rep.tradeNameAr} (${rep.tradeNameEn})` : item.label,
        score: 90,
      };
    }
  }

  return { matchedProduct: null, matchedIngredientId: null, detectedDrugName: '', score: 0 };
}

/**
 * Downscales large camera/gallery images in the browser to <=800px JPEG (<95 KB)
 * so Cloud OCR (`api.ocr.space` 1024 KB limit) and Vision endpoints never reject phone photos,
 * and checks native BarcodeDetector.
 */
export async function prepareImageForOcrAndVision(
  base64OrDataUrl: string,
  mimeType = 'image/jpeg'
): Promise<{
  dataUri: string;
  base64Data: string;
  mimeType: string;
  nativeBarcode: string | null;
}> {
  const rawDataUri = base64OrDataUrl.startsWith('data:')
    ? base64OrDataUrl
    : `data:${mimeType || 'image/jpeg'};base64,${base64OrDataUrl}`;
  const rawBase64 = rawDataUri.includes(',') ? rawDataUri.split(',')[1] : base64OrDataUrl;

  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return {
      dataUri: rawDataUri,
      base64Data: rawBase64,
      mimeType: mimeType || 'image/jpeg',
      nativeBarcode: null,
    };
  }

  try {
    const img = new Image();
    img.src = rawDataUri;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    const maxDim = 800;
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
        dataUri: rawDataUri,
        base64Data: rawBase64,
        mimeType: mimeType || 'image/jpeg',
        nativeBarcode: null,
      };
    }

    ctx.drawImage(img, 0, 0, w, h);
    const normalizedDataUri = canvas.toDataURL('image/jpeg', 0.82);
    const normalizedBase64 = normalizedDataUri.split(',')[1] || rawBase64;

    let nativeBarcode: string | null = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new (window as unknown as {
          BarcodeDetector: new (opts: { formats: string[] }) => {
            detect: (el: HTMLCanvasElement) => Promise<Array<{ rawValue?: string }>>;
          };
        }).BarcodeDetector({
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

    return {
      dataUri: normalizedDataUri,
      base64Data: normalizedBase64,
      mimeType: 'image/jpeg',
      nativeBarcode,
    };
  } catch {
    return {
      dataUri: rawDataUri,
      base64Data: rawBase64,
      mimeType: mimeType || 'image/jpeg',
      nativeBarcode: null,
    };
  }
}

/**
 * Local in-browser OCR fallback via Tesseract.js (eng+ara)
 */
export async function performBrowserTesseractOcr(imageDataUrl: string): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '';
  try {
    const win = window as unknown as {
      Tesseract?: {
        recognize: (
          img: string,
          langs: string,
          opts?: { logger?: () => void }
        ) => Promise<{ data?: { text?: string } }>;
      };
    };
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
  } catch {
    /* ignore */
  }
  return '';
}

/**
 * Zero-Hint Vision Text Transcriber:
 * Uses a prompt with ZERO medicine names or examples so the model can never echo
 * or hallucinate a drug name from the prompt. Filters out refusals or conversational replies.
 */
async function runZeroHintVisionOcr(dataUri: string): Promise<string> {
  try {
    const visionPrompt =
      'Transcribe ONLY the exact visible text and numbers (Arabic and English) printed on the package or written on the paper in this image. Do NOT guess, do NOT add examples, and do NOT write sentences. If no text is readable, reply with the single word: NONE';
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: visionPrompt },
              { type: 'image_url', image_url: { url: dataUri } },
            ],
          },
        ],
        temperature: 0.0,
      }),
    });
    if (!res.ok) return '';
    const json = await res.json();
    const raw = (json?.choices?.[0]?.message?.content || '').trim();
    if (!raw || /^none$/i.test(raw)) return '';
    if (
      /sorry|cannot|unable|can't|assist|provide|image_url|base64|عذراً|لا يمكنني/i.test(raw)
    ) {
      return '';
    }
    return raw;
  } catch {
    return '';
  }
}

/**
 * Sequential Cloud OCR helper (`api.ocr.space`) that avoids firing 2 simultaneous requests
 * with the same public `helloworld` key (which triggers concurrent rate-limiting).
 * Engine 1 (`ara`) reads BOTH Arabic and English/Latin characters in a single request!
 */
async function runCloudOcrNonColliding(dataUri: string): Promise<string> {
  const texts: string[] = [];

  // 1) Engine 1 with 'ara' reads both Arabic and English/Latin characters
  try {
    const fdAra = new FormData();
    fdAra.append('apikey', 'helloworld');
    fdAra.append('base64Image', dataUri);
    fdAra.append('language', 'ara');
    fdAra.append('OCREngine', '1');
    fdAra.append('scale', 'true');
    const rAra = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: fdAra,
    });
    if (rAra.ok) {
      const jAra = await rAra.json();
      const parsedAra = jAra?.ParsedResults?.[0]?.ParsedText || '';
      if (parsedAra.trim()) {
        texts.push(parsedAra.trim());
      }
    }
  } catch {
    /* ignore */
  }

  // 2) If Engine 1 did not match a drug yet, run Engine 2 ('eng') sequentially
  const currentMatch = matchEgyptianDrugFromText(texts.join('\n'));
  if (!currentMatch.matchedIngredientId) {
    try {
      const fdEng = new FormData();
      fdEng.append('apikey', 'helloworld');
      fdEng.append('base64Image', dataUri);
      fdEng.append('language', 'eng');
      fdEng.append('OCREngine', '2');
      fdEng.append('scale', 'true');
      const rEng = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: fdEng,
      });
      if (rEng.ok) {
        const jEng = await rEng.json();
        const parsedEng = jEng?.ParsedResults?.[0]?.ParsedText || '';
        if (parsedEng.trim()) {
          texts.push(parsedEng.trim());
        }
      }
    } catch {
      /* ignore */
    }
  }

  return texts.join('\n').trim();
}

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
      if (val !== 'unknown' && KNOWN_INGREDIENT_SLUGS.has(val)) matchedId = val;
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
 * Multi-Engine Bilingual Vision & OCR Scanner:
 * Reads both Arabic and English medicine names accurately using:
 * 1) Native BarcodeDetector
 * 2) Non-colliding Cloud OCR (`api.ocr.space` Engine 1 Arabic+Latin, then Engine 2 English)
 * 3) Google Gemini Vision (if user API key `AIza...` is configured)
 * 4) Zero-hint Vision OCR transcription (no drug names in prompt so it never hallucinates)
 * 5) Local in-browser Tesseract.js OCR (`eng+ara`) fallback
 */
export async function analyzeMedicineImageWithVision(
  base64Data: string,
  mimeType: string,
  lang: Lang
): Promise<VisionAnalysisResult> {
  const prepared = await prepareImageForOcrAndVision(base64Data, mimeType);
  const dataUri = prepared.dataUri;
  const key = getApiKey();

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

  const runGemini = async (): Promise<string> => {
    if (!key || !key.startsWith('AIza')) return '';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: prepared.mimeType || 'image/jpeg',
                  data: prepared.base64Data,
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

  const [geminiRes, cloudOcrRes, zeroHintRes] = await Promise.allSettled([
    runGemini(),
    runCloudOcrNonColliding(dataUri),
    runZeroHintVisionOcr(dataUri),
  ]);

  const geminiText = geminiRes.status === 'fulfilled' ? geminiRes.value : '';
  const cloudOcrText = cloudOcrRes.status === 'fulfilled' ? cloudOcrRes.value : '';
  const zeroHintText = zeroHintRes.status === 'fulfilled' ? zeroHintRes.value : '';

  const parsedGemini = geminiText
    ? parseVisionText(geminiText)
    : { detectedDrugName: '', matchedIngredientId: null, summary: '' };

  // Prioritize deterministic OCR + barcode first, then zero-hint vision transcription
  const primaryText = [
    prepared.nativeBarcode || '',
    cloudOcrText,
    parsedGemini.detectedDrugName,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

  let matched = matchEgyptianDrugFromText(primaryText);
  if (!matched.matchedIngredientId && zeroHintText) {
    matched = matchEgyptianDrugFromText(`${primaryText}\n${zeroHintText}`);
  }

  let localTesseractText = '';
  if (!matched.matchedIngredientId) {
    localTesseractText = await performBrowserTesseractOcr(dataUri);
    if (localTesseractText) {
      matched = matchEgyptianDrugFromText(`${primaryText}\n${zeroHintText}\n${localTesseractText}`);
    }
  }

  const allExtracted = [
    matched.detectedDrugName,
    parsedGemini.detectedDrugName,
    cloudOcrText,
    zeroHintText,
    localTesseractText,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

  return {
    detectedDrugName:
      matched.detectedDrugName ||
      parsedGemini.detectedDrugName ||
      cloudOcrText.split(/\r?\n/)[0] ||
      zeroHintText.split(/\r?\n/)[0] ||
      '',
    matchedIngredientId: matched.matchedIngredientId || parsedGemini.matchedIngredientId,
    summary: parsedGemini.summary,
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

  // Deterministic matching against all 206 Egyptian Commercial Products, 32 Active Ingredients & OCR Aliases
  if (!matchedIngredientId || !detectedDrugName) {
    const matched = matchEgyptianDrugFromText(text);
    if (matched.matchedIngredientId) {
      if (!matchedIngredientId) matchedIngredientId = matched.matchedIngredientId;
      if (!detectedDrugName) detectedDrugName = matched.detectedDrugName;
    }
  }

  // Extract explicit dose strength/quantity ONLY if written in the text (never invented from DB!)
  if (!extractedDoseText) {
    const normalizedDigitsText = text.replace(/[٠-٩]/g, (d) =>
      String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    );
    const doseRegex =
      /(\d+(?:\.\d+)?\s*(?:mg|gm|g|ml|mcg|iu|مجم|ملجم|جم|جرام|مل|قرص|أقراص|اقراص|كبسولة|كبسولات|كبسول|سم)(?:\s*\/\s*\d+\s*(?:mg|ml|مجم|مل))?)/i;
    const m = normalizedDigitsText.match(doseRegex);
    if (m) {
      extractedDoseText = m[1].trim();
    }
  }

  // Detect explicit route keywords and check for route contradictions
  const hasOralTabKeyword = /(tablet|tablets|\btab\b|capsule|capsules|\bcap\b|\boral\b|قرص|أقراص|اقراص|كبسول|كبسولة|كبسولات|فموي)/i.test(text);
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
  if (/(once\s*daily|every\s*24\s*(?:h|hr|hours)|\bq\s*24\s*h\b|\bod\b|1\s*x\s*1|مرة\s*يوميا|مره\s*يوميا|مرة\s*واحدة\s*يوميا|كل\s*24\s*ساع)/i.test(text)) {
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
    const normalizedDigitsText = text.replace(/[٠-٩]/g, (d) =>
      String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    );
    const durationMatches = Array.from(
      normalizedDigitsText.matchAll(
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
 * Extracts readable prescription details from an uploaded or camera-captured prescription/medicine image.
 * Downscales oversized images automatically for reliable Cloud & Local OCR, checks barcode,
 * strictly marks output as unverified (`isUnverifiedOcr: true`), never invents missing instructions,
 * and gracefully returns `unreadableFields` instead of throwing if OCR cannot read handwritten text.
 */
export async function analyzePrescriptionImageWithVision(
  base64Data: string,
  mimeType: string,
  lang: Lang,
  fileNameHint?: string
): Promise<PrescriptionOcrExtractionResult> {
  const prepared = await prepareImageForOcrAndVision(base64Data, mimeType);
  const dataUri = prepared.dataUri;
  const key = getApiKey();

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

  const runGemini = async (): Promise<string> => {
    if (!key || !key.startsWith('AIza')) return '';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: prepared.mimeType || 'image/jpeg',
                  data: prepared.base64Data,
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

  const [geminiRes, cloudOcrRes, zeroHintRes] = await Promise.allSettled([
    runGemini(),
    runCloudOcrNonColliding(dataUri),
    runZeroHintVisionOcr(dataUri),
  ]);

  const geminiText = geminiRes.status === 'fulfilled' ? geminiRes.value : '';
  const cloudOcrText = cloudOcrRes.status === 'fulfilled' ? cloudOcrRes.value : '';
  const zeroHintText = zeroHintRes.status === 'fulfilled' ? zeroHintRes.value : '';

  const descriptiveFileName =
    fileNameHint &&
    !/^(camera-capture|image\.|img_|dsc_|screenshot|photo|whatsapp|pxl_|\d+)/i.test(fileNameHint.trim())
      ? fileNameHint.replace(/\.[a-z0-9]+$/i, '')
      : '';

  let combinedRaw = [
    prepared.nativeBarcode || '',
    cloudOcrText,
    geminiText,
    zeroHintText,
    descriptiveFileName,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

  let parsedResult = parsePrescriptionTextDeterministically(combinedRaw);

  if (!parsedResult.detectedDrugName) {
    const localTesseract = await performBrowserTesseractOcr(dataUri);
    if (localTesseract) {
      combinedRaw = [combinedRaw, localTesseract].filter(Boolean).join('\n').trim();
      parsedResult = parsePrescriptionTextDeterministically(combinedRaw);
    }
  }

  return parsedResult;
}
