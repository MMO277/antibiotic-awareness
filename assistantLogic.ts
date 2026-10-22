import { norm } from './search';
import { ARTICLES } from './articlesData';
import { MYTHS } from './contentData';
import { Bi, FIELD_LABELS, Lang, Medicine, pick, TextField } from './types';
import { EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import * as R from './assistantReplies';
import { getCurrentEmergencyInfo, formatEmergencyText } from './emergencyLocation';
import type { Link, PKind, ConditionKind } from './assistantReplies';

export interface Ref { title: string; url: string; publisher?: string }
export interface Passage {
  id: string;
  label: string;
  title: Bi;
  text: Bi;
  link?: string;
  refs: Ref[];
  unreviewed?: boolean;
  hay: string;
}

export type Verdict = 'injection' | 'emergency' | 'personal' | 'ok';

const INJECTION =
  /ignore (all|any|previous|above|your|the) |system prompt|developer message|api[ -]?key|secret key|jailbreak|reveal (your|the) (prompt|instructions|key)|you are now|act as |تجاهل|التعليمات السابقه|مفتاح|برومبت/;
const EMERGENCY =
  /can.?t breathe|difficulty breathing|trouble breathing|short(ness)? of breath|swelling of (the )?(face|lips|tongue|throat)|face swell|lips swell|throat swell|anaphyla|faint|passed out|unconscious|seizure|chest pain|bloody diarrh|blood in (my )?stool|can.?t swallow|severe rash|ضيق (في )?(ال)?(تنفس|نفس)|صعوبه (في )?(ال)?(تنفس|بلع)|تورم (ال)?(وجه|شفا|لسان|حلق)|اغماء|اغمي|تشنج|الم (في )?(ال)?صدر|اسهال دموي|دم في (ال)?(براز|اسهال)|طفح شديد|حساسيه شديده/;

export function classify(q: string): Verdict {
  const x = norm(q);
  if (INJECTION.test(x)) return 'injection';
  if (EMERGENCY.test(x)) return 'emergency';
  return 'ok';
}

const STOP = new Set(
  ('the a an of to in on for and or is are do does can i you my it be how what why when which with from that this about me ' +
    'هل ما ماذا لماذا كيف متي في من علي الي عن او و هذا هذه ده دي ايه ازاي ليه هو هي انا انت لو يا ترى ينفع ممكن عايز عاوز احسن افضل').split(' '),
);

export const tokens = (s: string): string[] =>
  norm(s)
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => w.replace(/^[وبلكف](?=ال.{3})/, '').replace(/^لل(?=.{3})/, '').replace(/^ال(?=.{3})/, '').replace(/(?<=[a-z]{4,})s$/, '').replace(/(?<=[\u0621-\u064A]{3,})ات$/, ''))
    .filter((w) => w.length > 1 && !STOP.has(w));

const SYN: Record<string, string[]> = {
  برد: ['زكام', 'انفلونزا', 'نزله', 'سعال', 'كحه', 'فيروس', 'فيروسي'],
  زكام: ['برد', 'انفلونزا', 'رشح'],
  كحه: ['سعال', 'صدر'],
  سعال: ['كحه'],
  حقنه: ['مجموعه', 'خلطه', 'هتلر', 'شعبيه', 'امبول'],
  مجموعه: ['حقنه', 'خلطه', 'هتلر', 'شعبيه'],
  خلطه: ['مجموعه', 'حقنه', 'هتلر'],
  هتلر: ['حقنه', 'مجموعه', 'خلطه'],
  اوقف: ['توقف', 'قطع', 'وقف', 'تحسن'],
  تحسن: ['اوقف', 'توقف', 'كورس', 'شفاء'],
  لبن: ['حليب', 'كالسيوم', 'اكل', 'طعام', 'زبادي', 'تداخل'],
  حليب: ['لبن', 'كالسيوم', 'اكل', 'تداخل'],
  نسيت: ['فائته', 'نسيان', 'جرعه', 'موعد'],
  نسيان: ['نسيت', 'فائته', 'جرعه'],
  اطفال: ['طفل', 'ابني', 'بنتي', 'شراب', 'معلق'],
  شراب: ['معلق', 'ثلاجه', 'حفظ', 'تخزين', 'اطفال'],
  ثلاجه: ['حفظ', 'تخزين', 'شراب', 'معلق'],
  اسهال: ['معده', 'بطن', 'بروبيوتيك', 'زبادي', 'امعاء'],
  بروبيوتيك: ['زبادي', 'اسهال', 'بكتيريا نافعه', 'معده'],
  زبادي: ['بروبيوتيك', 'اسهال', 'لبن'],
  منع: ['حمل', 'حبوب', 'وسيله'],
  حمل: ['حامل', 'جنين', 'رضاعه', 'مرضع', 'منع'],
  اسنان: ['ضرس', 'لثه', 'وجع', 'الم', 'اسنان'],
  ضرس: ['اسنان', 'لثه', 'الم'],
  بول: ['مسالك', 'بوليه', 'حرقان'],
  مزرعه: ['تحليل', 'حساسيه', 'ميكروب'],
  تحليل: ['مزرعه', 'حساسيه'],
  بنسلين: ['حساسيه', 'اختبار'],
  مناعه: ['تضعف', 'مقاومه', 'جسم'],
};

/** Match common conditions when user asks for the best antibiotic for a specific body part / disease */
export function matchCondition(x: string): ConditionKind | null {
  if (/اسنان|ضرس|لثه|خراج|وجع السنان|الم الاسنان|خراج الاسنان|عصب|خلع|dental|tooth|teeth/.test(x)) return 'dental';
  if (/مسالك|بول|بوليه|حرقان البول|التهاب البول|المثانه|حرقان في البول|uti|urine/.test(x)) return 'uti';
  if (/لوز|حلق|احتقان الحلق|صديد اللوز|التهاب الحلق|زور|وجع الحلق|throat|tonsil/.test(x)) return 'throat';
  if (/جلد|حب شباب|دمامل|خراج جلدي|حب الشباب|التهاب جلدي|جرح|جروح|acne|skin/.test(x)) return 'skin';
  if (/جيوب|انفيه|الجيوب الانفيه|صداع الجيوب|sinus/.test(x)) return 'sinus';
  if (/صدر|شعبي|شعب هوائيه|كحه ببلغم|التهاب رئوي|cough|chest|bronchitis/.test(x)) return 'chest';
  if (/جرثومه|معده|جرثومه المعده|حلزونيه|pylori|stomach/.test(x)) return 'stomach';
  if (/اذن|الاذن|ودن|التهاب الاذن|وجع الودن|ear|otitis/.test(x)) return 'ear';
  return null;
}

export function buildPassages(meds: Medicine[]): Passage[] {
  const out: Passage[] = [];
  ARTICLES.forEach((a) => {
    const title = pick(a.title, 'en') + ' ' + pick(a.title, 'ar');
    const en = a.body.en.split(/\n\s*\n/);
    const ar = a.body.ar.split(/\n\s*\n/);
    en.forEach((p, i) =>
      out.push({
        id: `art:${a.id}:${i}`,
        label: `${a.title.en} / ${a.title.ar}`,
        title: a.title,
        text: { en: p, ar: ar[i] || p },
        link: `/articles/${a.id}`,
        refs: [],
        unreviewed: true,
        hay: norm(`${title} ${p} ${ar[i] || ''}`),
      }),
    );
  });
  MYTHS.forEach((m, i) => {
    const verdict = (l: Lang) =>
      l === 'ar' ? (m.isFact ? 'حقيقة' : 'خرافة') : m.isFact ? 'Fact' : 'Myth';
    const text = (l: Lang) => `${pick(m.statement, l)} — ${verdict(l)}. ${pick(m.why, l)}`;
    out.push({
      id: `myth:${i}`,
      label: 'Myth or fact / خرافة أم حقيقة',
      title: { ar: 'خرافة أم حقيقة', en: 'Myth or fact' },
      text: { en: text('en'), ar: text('ar') },
      link: '/myth',
      refs: [{ title: m.source.title, url: m.source.url, publisher: m.source.publisher }],
      hay: norm(`${text('en')} ${text('ar')}`),
    });
  });
  const FIELDS = ['approvedUses', 'priceEgypt', 'substitutes', 'dosingReference', 'mechanism', 'sideEffects', 'contraindications', 'interactions', 'pregnancyBreastfeeding', 'patientEducation'] as const;
  meds.forEach((m) =>
    FIELDS.forEach((f) => {
      if (!m[f].en && !m[f].ar) return;
      const name = `${m.genericName.en} ${m.genericName.ar}`.trim();
      out.push({
        id: `med:${m.id}:${f}`,
        label: `${m.genericName.en || m.genericName.ar} — ${f}`,
        title: {
          en: `${m.genericName.en || m.genericName.ar} — ${FIELD_LABELS[f].en}`,
          ar: `${m.genericName.ar || m.genericName.en} — ${FIELD_LABELS[f].ar}`,
        },
        text: { en: m[f].en || m[f].ar, ar: m[f].ar || m[f].en },
        link: `/medicine/${m.id}`,
        refs: m.sources.map((s) => ({ title: s.title, url: s.url })),
        unreviewed: m.status !== 'approved',
        hay: norm(`${name} ${m.activeIngredients.en} ${m.activeIngredients.ar} ${m.drugClass.en} ${m.drugClass.ar} ${m[f].en} ${m[f].ar}`),
      });
    }),
  );
  return out;
}

export interface Hit { p: Passage; score: number; matched: number; loose?: boolean }

const conceptsOf = (q: string): string[][] =>
  Array.from(new Set(tokens(q))).map((t) => [t, ...(SYN[t] ?? [])]);

interface Scored { p: Passage; score: number; matched: number }

function scoreAll(passages: Passage[], concepts: string[][]): Scored[] {
  if (!concepts.length || !passages.length) return [];
  const docs = passages.map((p) => new Set(tokens(p.hay)));
  const bodies = passages.map((p) => new Set(tokens(`${p.text.ar} ${p.text.en}`)));
  const idf = (t: string) => {
    const df = docs.filter((d) => d.has(t)).length;
    return df ? Math.log(1 + passages.length / df) : 0;
  };
  return passages.map((p, i) => {
    let s = 0;
    let matched = 0;
    for (const alts of concepts) {
      const hit = alts.filter((a) => docs[i].has(a));
      if (hit.length) { s += Math.max(...hit.map(idf)); matched++; }
    }
    if (matched) {
      const title = new Set(tokens(p.label));
      for (const alts of concepts) if (alts.some((a) => title.has(a))) s += 0.8;
      for (const alts of concepts) if (alts.some((a) => bodies[i].has(a))) s += 0.6;
    }
    return { p, score: p.id.startsWith('med:') ? s * 0.8 : s, matched };
  });
}

const keyOf = (p: Passage) => p.id.split(':').slice(0, 2).join(':');

export function retrieve(passages: Passage[], q: string, max = 2): Hit[] {
  const concepts = conceptsOf(q);
  const ranked = scoreAll(passages, concepts)
    .filter((h) => h.matched >= 1 && h.score >= 0.8)
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const hits: Hit[] = [];
  for (const h of ranked) {
    const key = keyOf(h.p);
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ p: h.p, score: h.score, matched: h.matched, loose: h.matched <= 1 });
    if (hits.length >= max) break;
  }
  return hits;
}

export function related(passages: Passage[], q: string, max = 3): Passage[] {
  const ranked = scoreAll(passages, conceptsOf(q))
    .filter((h) => h.matched >= 1)
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: Passage[] = [];
  for (const h of ranked) {
    const key = keyOf(h.p);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h.p);
    if (out.length >= max) break;
  }
  return out;
}

export function excerpt(text: string, q: string): string {
  if (text.length <= 320) return text;
  const concepts = conceptsOf(q);
  const sents = text.split(/(?<=[.!?؟…])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  if (sents.length <= 2) return text;
  const sc = sents.map((s) => {
    const w = new Set(tokens(s));
    return concepts.filter((alts) => alts.some((a) => w.has(a))).length;
  });
  const best = Math.max(...sc);
  if (best === 0) return sents.slice(0, 2).join(' ');
  const i = sc.indexOf(best);
  const keep = new Set([i]);
  if (i > 0) keep.add(i - 1);
  if (i < sents.length - 1) keep.add(i + 1);
  return Array.from(keep).sort((a, b) => a - b).map((k) => sents[k]).join(' ');
}

export function findMeds(meds: Medicine[], q: string): Medicine[] {
  const x = norm(q);
  const scored = meds
    .map((m) => {
      const commProds = EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => p.activeIngredientId === m.id);
      const commBrandWords: string[] = [];
      for (const p of commProds) {
        const arFirst = p.tradeNameAr.split(' ')[0];
        const enFirst = p.tradeNameEn.split(' ')[0];
        if (arFirst && arFirst.length >= 3) commBrandWords.push(arFirst);
        if (enFirst && enFirst.length >= 3) commBrandWords.push(enFirst);
        commBrandWords.push(p.tradeNameAr, p.tradeNameEn);
      }
      const names = [
        m.genericName.en,
        m.genericName.ar,
        m.activeIngredients.en,
        m.activeIngredients.ar,
        ...commBrandWords,
        ...m.brands.filter((b) => b.verified).map((b) => b.name.split('(')[0].trim()),
      ];
      let top = 0;
      for (const n of names) {
        if (!n) continue;
        const normN = norm(n);
        if (normN.length >= 3 && x.includes(normN)) {
          top = Math.max(top, 1.0 + normN.length * 0.02);
        }
      }
      return { m, top };
    })
    .filter((s) => s.top >= 0.8)
    .sort((a, b) => b.top - a.top);
  return scored.slice(0, 2).map((s) => s.m);
}

const ASPECTS: { f: TextField; re: RegExp }[] = [
  { f: 'priceEgypt', re: /price|cost|how much|سعر|اسعار|بكام|ثمن|تمن|تكلفه/ },
  { f: 'substitutes', re: /substitut|generic|alternative|بديل|بدائل|مثيل|مثائل|نفس الماده/ },
  { f: 'dosingReference', re: /dosage|dose|جرعه|جرعات|كل كم ساعه|مواعيد/ },
  { f: 'sideEffects', re: /side effect|adverse|unwanted|harmful|جانبيه|الاعراض|اعراضه|مضاعفات|اضرار|ضرر|مخاطر|بيعمل ايه|يسبب|بيسبب/ },
  { f: 'interactions', re: /interact|combine|together with|mix|alcohol|تداخل|تتداخل|اخلط|كحول|مع (اي |ال)?(دوا|ادويه|مضاد|اكل|لبن)/ },
  { f: 'pregnancyBreastfeeding', re: /pregnan|breast.?feed|lactat|nursing mother|حامل|حمل|رضاعه|ارضاع|مرضع/ },
  { f: 'contraindications', re: /contraindic|who should not|should not|avoid if|موانع|ممنوع|محظور|مين (ميخدوش|ما ياخدوش)|لا يجب/ },
  { f: 'mechanism', re: /mechanism|how (does|do|it|they) work|اليه|بيشتغل|يشتغل|يعمل ازاي|بيعمل ازاي|طريقه عمل|كيف يعمل|كيف تعمل/ },
  { f: 'approvedUses', re: /uses?|used for|treat|indicat|for what|what is (it|this) for|استخدام|بيستخدم|يستخدم|بيعالج|يعالج|علاج|بيفيد|فايده|فائده|لايه|ل ايه/ },
  { f: 'patientEducation', re: /how to (take|use|store)|instruction|tips?|advice|counsel|ازاي (اخد|استخدم|اخذ)|كيف (اخذ|استخدم|اتناول)|طريقه (الاستخدام|الاخذ)|نصايح|نصائح|ارشادات|تعليمات/ },
];

export function personalKind(x: string): PKind | null {
  if (/حقنه البرد|مجموعه البرد|الخلطه الثلاثيه|حقنه هتلر|امبول البرد/.test(x)) return 'cold_shot';
  if (/نسيت|فائته|نسيان الجرعه|نسيت حبه|نسيت قرص|موعد الجرعه/.test(x)) return 'missed_dose';
  if (/لبن|حليب|اكل|طعام|كالسيوم|زبادي|حديد|شرب اللبن/.test(x)) return 'milk_food';
  if (/حبوب منع الحمل|منع الحمل|الوسيله/.test(x)) return 'birth_control';
  if (/اسهال|معده|مغص|بروبيوتيك|بكتيريا نافعه/.test(x)) return 'probiotics';
  if (/ابني|بنتي|طفلي|ولدي|رضيعي|الاطفال|اطفال|شراب معلق/.test(x)) return 'child';
  if (/حامل|حمل|مرضع|رضاعه/.test(x)) return 'pregnancy';
  if (/اوقف|اوئف|وقف الدوا|توقف|بطلت|خفيت|تحسنت|اكمل/.test(x)) return 'stopstart';
  if (/جرعه|جرعات|كم حبه|كام حبه|كم قرص|كام قرص|كم ملغ|كم ملي/.test(x)) return 'dose';
  if (/رشح|سخونيه|حراره|بلغم/.test(x)) return 'symptom';
  return null;
}

function smallTalk(x: string): R.Canned | null {
  const y = x.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const words = y ? y.split(' ').length : 0;
  if (!y) return null;
  if (words <= 3 && /^(hi+|hello|hey|مرحبا|اهلا|اهلين|هاي|السلام عليكم|سلام عليكم|سلام|صباح الخير|مساء الخير)(?=\s|$)/.test(y)) return R.GREETING;
  if (words <= 6 && /\b(thanks|thank you|thx)\b|شكرا|متشكر|تسلم|يخليك|جزاك/.test(y)) return R.THANKS;
  if (/what can you do|who are you|what are you|how do you work|انت (مين|ايه)|انتا مين|من انت|بتعمل ايه|تقدر (تعمل|تساعد)|ماذا تفعل|ما وظيفتك|عرفني بنفسك/.test(y) || /^(help|مساعده|ساعدني)$/.test(y)) return R.ABOUT;
  return null;
}

export type Reply =
  | { kind: 'text'; text: Bi; links?: Link[]; tone?: 'normal' | 'warn' | 'alert' }
  | { kind: 'answer'; lead: Bi; hits: Passage[]; loose: boolean };

const medName = (m: Medicine): Bi => ({
  ar: m.genericName.ar || m.genericName.en,
  en: m.genericName.en || m.genericName.ar,
});
const medLink = (m: Medicine): Link => ({
  to: `/medicine/${m.id}`,
  label: { ar: `صفحة ${medName(m).ar}`, en: `${medName(m).en} page` },
});
const linkOf = (p: Passage): Link => ({ to: p.link ?? '/', label: p.title });

function medicineReply(passages: Passage[], m: Medicine, x: string): Reply {
  const n = medName(m);
  const asked = ASPECTS.filter((a) => a.re.test(x)).map((a) => a.f);
  const wanted: TextField[] = asked.length ? asked.slice(0, 2) : ['approvedUses', 'mechanism'];
  const hits = wanted
    .map((f) => passages.find((p) => p.id === `med:${m.id}:${f}`))
    .filter((p): p is Passage => !!p);
  if (!hits.length) {
    return {
      kind: 'text',
      text: {
        ar: `وجدت ${n.ar} في قاعدة أدوية الموقع. يمكنك فتح صفحة الدواء للاطلاع على دواعي الاستعمال والآثار الجانبية والتداخلات المعتمدة كاملة.`,
        en: `I found ${n.en} in the site database. Open the medicine page to read the complete verified clinical details.`,
      },
      links: [medLink(m)],
    };
  }
  const labels = asked.length ? wanted.filter((f) => hits.some((h) => h.id.endsWith(`:${f}`))).map((f) => FIELD_LABELS[f]) : [];
  const lead: Bi = asked.length
    ? { ar: `عن ${n.ar} — ${labels.map((l) => l.ar).join(' و')}:`, en: `${n.en} — ${labels.map((l) => l.en).join(' and ')}:` }
    : { ar: `دليل ومعلومات عن ${n.ar}:`, en: `Clinical guide for ${n.en}:` };
  return { kind: 'answer', lead, hits, loose: false };
}

function leadFor(title: Bi, many: boolean): Bi {
  if (many) return { ar: 'إليك أهم الإرشادات والمعلومات المعتمدة بخصوص سؤالك:', en: 'Here are key clinical guidelines regarding your question:' };
  return { ar: `بخصوص سؤالك، إليك ما توضحه الأدلة العلمية في «${title.ar}»:`, en: `Regarding your question, here is what “${title.en}” explains:` };
}

export function respond(passages: Passage[], meds: Medicine[], raw: string): Reply {
  const q = raw.trim().slice(0, 300);
  const x = norm(q);
  const v = classify(q);
  if (v === 'injection') return { kind: 'text', text: R.INJECTION, tone: 'warn' };
  if (v === 'emergency') {
    const info = getCurrentEmergencyInfo();
    return {
      kind: 'text',
      text: {
        ar: formatEmergencyText(R.EMERGENCY.ar, info, 'ar'),
        en: `This could indicate severe anaphylaxis or an acute emergency. Stop chatting and seek emergency care immediately: call emergency services (${info.number} in ${info.name.en}) or go to the nearest ER.`,
        fr: `Cela pourrait indiquer une urgence allergique grave. Arrêtez la discussion et appelez immédiatement les secours (${info.number} — ${info.name.fr}) ou rendez-vous aux urgences.`,
        es: `Esto podría indicar una emergencia alérgica grave. Detenga el chat y llame de inmediato a emergencias (${info.number} — ${info.name.es}) o acuda a urgencias.`,
      },
      tone: 'alert',
    };
  }

  const small = smallTalk(x);
  if (small) return { kind: 'text', text: small.text, links: small.links };

  // 1. Direct Condition Match (e.g. dental, throat, UTI, skin, sinus, etc.)
  // Answers with best first-line antibiotics + doctor consult!
  const condition = matchCondition(x);
  if (condition) {
    const c = R.CONDITIONS[condition];
    return { kind: 'text', text: c.text, links: c.links, tone: 'normal' };
  }

  // 2. Specific Medicine Named
  const found = findMeds(meds, q);
  if (found.length) return medicineReply(passages, found[0], x);

  // 3. Specific Patient Advice Kind (e.g. cold injection, missed dose, dairy, etc.)
  const pKind = personalKind(x);
  if (pKind) {
    const c = R.PERSONAL[pKind];
    return { kind: 'text', text: c.text, links: c.links, tone: 'normal' };
  }

  // 4. General Passage Retrieval
  let hits = retrieve(passages, q, 2);
  if (hits.length) {
    const shown = hits.map((h) => {
      const isArticle = h.p.id.startsWith('art:');
      return isArticle ? { ...h.p, text: { ar: excerpt(h.p.text.ar, q), en: excerpt(h.p.text.en, q) } } : h.p;
    });
    return { kind: 'answer', lead: leadFor(shown[0].title, shown.length > 1), hits: shown, loose: false };
  }

  const rel = related(passages, q, 3);
  return {
    kind: 'text',
    text: rel.length ? R.NONE_RELATED : R.NONE,
    links: rel.length ? rel.map(linkOf) : R.DEFAULT_LINKS,
  };
}

export interface ChatUiMessage {
  who: 'me' | 'bot';
  text?: string;
  reply?: Reply;
  date?: string;
  isAi?: boolean;
}

export function extractAnswerPlainText(m: ChatUiMessage, lang: Lang): string {
  if (m.text) return m.text;
  const r = m.reply;
  if (!r) return '';
  if (r.kind === 'answer') {
    return `${pick(r.lead, lang)} ${r.hits.map((h) => pick(h.text, lang)).join(' ')}`;
  }
  return pick(r.text, lang);
}


export function isDirectVerifiedMatch(r: Reply): boolean {
  if (r.kind === 'answer') return true;
  if (r.text === R.NONE || r.text === R.NONE_RELATED) return false;
  return true;
}
