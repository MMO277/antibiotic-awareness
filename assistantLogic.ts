import { norm } from './search';
import { ARTICLES } from './articlesData';
import { MYTHS } from './contentData';
import { Bi, FIELD_LABELS, Lang, Medicine, pick, TextField } from './types';
import * as R from './assistantReplies';
import type { Link, PKind } from './assistantReplies';

/** A link to a real source page. */
export interface Ref { title: string; url: string; publisher?: string }
/** A piece of site content the assistant may quote. */
export interface Passage {
  id: string;
  label: string; // where it comes from, shown to the user
  title: Bi; // short title in each language (used in the reply sentence and in links)
  text: Record<Lang, string>;
  link?: string; // internal route, e.g. /articles/xyz
  refs: Ref[]; // external sources that belong to this content
  unreviewed?: boolean;
  hay: string; // normalised search text (Arabic + English)
}

export type Verdict = 'injection' | 'emergency' | 'personal' | 'ok';

// Patterns are written for norm()-ed text (no diacritics; alef/yaa/taa-marbuta unified).
const INJECTION =
  /ignore (all|any|previous|above|your|the) |system prompt|developer message|api[ -]?key|secret key|jailbreak|reveal (your|the) (prompt|instructions|key)|you are now|act as |تجاهل|التعليمات السابقه|مفتاح|برومبت/;
const EMERGENCY =
  /can.?t breathe|difficulty breathing|trouble breathing|short(ness)? of breath|swelling of (the )?(face|lips|tongue|throat)|face swell|lips swell|throat swell|anaphyla|faint|passed out|unconscious|seizure|chest pain|bloody diarrh|blood in (my )?stool|can.?t swallow|severe rash|ضيق (في )?(ال)?(تنفس|نفس)|صعوبه (في )?(ال)?(تنفس|بلع)|تورم (ال)?(وجه|شفا|لسان|حلق)|اغماء|اغمي|تشنج|الم (في )?(ال)?صدر|اسهال دموي|دم في (ال)?(براز|اسهال)|طفح شديد|حساسيه شديده/;
const PERSONAL =
  /which antibiotic|what antibiotic|best antibiotic|antibiotic (for|should)|should i (take|use|stop|start|double|skip)|can i (take|stop|skip|double|use)|how (many|much) (pill|tablet|capsule|mg|dose|should)|\bdoses?\b|dosage|\d+ ?mg|prescribe me|for my (child|son|daughter|baby|infant|wife|husband|mother|father)|my (child|baby|son|daughter) has|i have (a |an )?(sore throat|cough|fever|infection|uti|cold|flu)|اي مضاد|ايه المضاد|مضاد حيوي (يناسب|مناسب|لعلاج)|اخد (ايه|اي|مضاد)|اخذ (ايه|اي|مضاد)|اتناول|ينفع (اخد|اخذ|اوقف)|اوقف (ال)?(مضاد|دوا)|جرعه|جرعات|كام (حبه|قرص|كبسوله)|كم (حبه|قرص|كبسوله)|ابني|بنتي|طفلي|عندي (التهاب|زكام|برد|كحه|حراره|سخونيه)/;

export function classify(q: string): Verdict {
  const x = norm(q);
  if (INJECTION.test(x)) return 'injection';
  if (EMERGENCY.test(x)) return 'emergency';
  if (PERSONAL.test(x)) return 'personal';
  return 'ok';
}

const STOP = new Set(
  ('the a an of to in on for and or is are do does can i you my it be how what why when which with from that this about me ' +
    'هل ما ماذا لماذا كيف متي في من علي الي عن او و هذا هذه ده دي ايه ازاي ليه هو هي انا انت لو').split(' '),
);
export const tokens = (s: string): string[] =>
  norm(s)
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => w.replace(/^[وبلكف](?=ال.{3})/, '').replace(/^لل(?=.{3})/, '').replace(/^ال(?=.{3})/, '').replace(/(?<=[a-z]{4,})s$/, '').replace(/(?<=[\u0621-\u064A]{3,})ات$/, ''))
    .filter((w) => w.length > 1 && !STOP.has(w));

/** Everyday / colloquial words that the site content writes differently (all norm()-ed). */
const SYN: Record<string, string[]> = {
  زكام: ['برد', 'نزله', 'نزل'], كحه: ['سعال'], سعال: ['كحه'], اتجنب: ['وقايه', 'منع', 'تجنب'], امنع: ['وقايه', 'منع'],
  share: ['sharing', 'shared', 'leftover'], stop: ['stopping', 'finish'], وقايه: ['منع'], اشارك: ['مشاركه', 'شارك', 'تشارك'], مضادي: ['مضاد'], شارك: ['مشاركه', 'تشارك'], بقايا: ['متبقي', 'المتبقيه'], حساسيه: ['تحسس'], سخونيه: ['حراره'], اسهال: ['اسهال'], دوا: ['دواء', 'مضاد'], ادويه: ['دواء'],
  جراثيم: ['بكتيريا', 'بكتيريه'], جرثومه: ['بكتيريا'], ميكروب: ['بكتيريا'], ميكروبات: ['بكتيريا'], فيروس: ['فيروسيه', 'فيروسات'], انفلونزا: ['زكام', 'فيروس'], نزله: ['زكام', 'برد'], حبوب: ['اقراص'], مقاوم: ['مقاومه'], احمي: ['وقايه', 'منع'], يعالج: ['تعالج', 'علاج', 'عالج'], تعالج: ['يعالج', 'علاج'], دكتور: ['طبيب'], دكتوره: ['طبيب'], غير: ['دون', 'بدون'], بدون: ['دون'], ماينفعش: ['تجنب'], اخد: ['تناول'], اتناول: ['تناول'], حمايه: ['وقايه'], اخزن: ['تخزين', 'حفظ', 'خزن'], اخزنه: ['تخزين', 'حفظ', 'خزن'], احفظ: ['تخزين', 'حفظ', 'خزن'], تخزين: ['خزن'], احتفظ: ['تخزين', 'بقايا'], ارمي: ['ترم', 'تخلص'], اتخلص: ['تخلص', 'ترم'], 
  store: ['storing', 'storage'], storage: ['store'], dispose: ['throw', 'disposal'], throw: ['dispose', 'disposal'], bacteria: ['bacterial'], virus: ['viral'], cold: ['viral'], flu: ['viral'], resist: ['resistance'], resistant: ['resistance'], allergy: ['allergic'], allergic: ['allergy'], germ: ['bacteria'], germs: ['bacteria'], hand: ['hands', 'hygiene'], wash: ['hygiene', 'hands'],
};

/** Build every passage the assistant may use, from content that is already on the site. */
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
  // Medicine records. Dosing / strengths / age-limit fields are left out on purpose.
  const FIELDS = ['approvedUses', 'mechanism', 'sideEffects', 'contraindications', 'interactions', 'pregnancyBreastfeeding', 'patientEducation'] as const;
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

/** Score every passage for the question: each question word ("concept") counts by how rare it is. */
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
      for (const alts of concepts) if (alts.some((a) => title.has(a))) s += 0.5;
      // paragraphs of one article share its title words: prefer the paragraph whose own text matches
      for (const alts of concepts) if (alts.some((a) => bodies[i].has(a))) s += 0.6;
    }
    return { p, score: p.id.startsWith('med:') ? s * 0.75 : s, matched };
  });
}

const keyOf = (p: Passage) => p.id.split(':').slice(0, 2).join(':'); // one article / myth / medicine

/**
 * Keyword retrieval with inverse-document-frequency weights. Returns [] when nothing relevant is found.
 * A hit is "loose" when only one (rare) word matched: the reply then says it is only the closest match.
 */
export function retrieve(passages: Passage[], q: string, max = 2): Hit[] {
  const concepts = conceptsOf(q);
  const strict = (h: Scored) =>
    (h.matched >= 2 && h.matched >= Math.ceil(concepts.length * 0.5) && h.matched >= concepts.length * 0.6 && h.score >= 1.2) ||
    (concepts.length === 1 && h.score >= 2.5);
  const loose = (h: Scored) => h.matched >= 1 && h.score >= 2.4;
  const ranked = scoreAll(passages, concepts)
    .filter((h) => strict(h) || loose(h))
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const hits: Hit[] = [];
  for (const h of ranked) {
    const key = keyOf(h.p);
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ p: h.p, score: h.score, matched: h.matched, loose: !strict(h) });
    if (hits.length >= max) break;
  }
  return hits;
}

/** Topics that share at least one word with the question (used for "maybe you mean..."). */
export function related(passages: Passage[], q: string, max = 3): Passage[] {
  const ranked = scoreAll(passages, conceptsOf(q))
    .filter((h) => h.matched >= 1 && h.score > 0)
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

/** For a long article paragraph: keep only the sentence(s) that answer the question (plus one neighbour). */
export function excerpt(text: string, q: string): string {
  if (text.length <= 260) return text;
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
  const prev = i > 0 ? sc[i - 1] : -1;
  const next = i < sents.length - 1 ? sc[i + 1] : -1;
  if (next >= prev && next >= 0) keep.add(i + 1);
  else if (prev >= 0) keep.add(i - 1);
  return Array.from(keep).sort((a, b) => a - b).map((k) => sents[k]).join(' ');
}

/* ---------- which medicine is the question about? ---------- */

const NAME_STOP = new Set(['acid', 'with', 'and']);
const squash = (s: string) => s.replace(/(.)\1+/gu, '$1');
const medWords = (name: string) =>
  squash(norm(name)).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4 && !NAME_STOP.has(w));

/** Medicines named in the question (generic name, active ingredient or verified brand), best match first. */
export function findMeds(meds: Medicine[], q: string): Medicine[] {
  const x = squash(norm(q));
  const scored = meds
    .map((m) => {
      const names = [m.genericName.en, m.genericName.ar, m.activeIngredients.en, m.activeIngredients.ar, ...m.brands.filter((b) => b.verified).map((b) => b.name)];
      let top = 0;
      for (const n of names) {
        const parts = medWords(n || '');
        if (!parts.length) continue;
        const hit = parts.filter((w) => x.includes(w)).length;
        if (hit) top = Math.max(top, hit / parts.length + hit * 0.01);
      }
      return { m, top };
    })
    .filter((s) => s.top >= 0.5)
    .sort((a, b) => b.top - a.top);
  if (!scored.length) return [];
  return scored.filter((s) => Math.abs(s.top - scored[0].top) < 0.001).slice(0, 2).map((s) => s.m);
}

/** What part of the medicine page is the question about? (patterns are for norm()-ed text) */
const ASPECTS: { f: TextField; re: RegExp }[] = [
  { f: 'sideEffects', re: /side effect|adverse|unwanted|harmful|جانبيه|الاعراض|اعراضه|مضاعفات|اضرار|ضرر|مخاطر|بيعمل ايه|يسبب|بيسبب|causes?\b/ },
  { f: 'interactions', re: /interact|combine|together with|\bmix|alcohol|تداخل|تتداخل|اخلط|كحول|مع (اي |ال)?(دوا|ادويه|مضاد|اكل|لبن)/ },
  { f: 'pregnancyBreastfeeding', re: /pregnan|breast.?feed|lactat|nursing mother|حامل|حمل|رضاعه|ارضاع|مرضع/ },
  { f: 'contraindications', re: /contraindic|who should not|should not (take|use)|avoid if|موانع|ممنوع|محظور|مين (ميخدوش|ما ياخدوش)|لا يجب/ },
  { f: 'mechanism', re: /mechanism|how (does|do|it|they) .{0,25}work|اليه|بيشتغل|يشتغل|يعمل ازاي|بيعمل ازاي|طريقه عمل|كيف يعمل|كيف تعمل/ },
  { f: 'approvedUses', re: /\buses?\b|used for|treat|indicat|for what|what is (it|this) for|استخدام|بيستخدم|يستخدم|بيعالج|يعالج|علاج|بيفيد|فايده|فائده|لايه|ل ايه/ },
  { f: 'patientEducation', re: /how (to )?(take|use|store)|instruction|\btips?\b|advice|counsel|ازاي (اخد|استخدم|اخذ)|كيف (اخذ|استخدم|اتناول)|طريقه (الاستخدام|الاخذ)|نصايح|نصائح|ارشادات|تعليمات/ },
];

/* ---------- personal-advice questions: which kind? ---------- */

export function personalKind(x: string): PKind {
  if (/for my (child|son|daughter|baby|infant|kid)|my (child|baby|son|daughter|kid)|ابني|بنتي|طفلي|ولدي|رضيعي|الطفل|طفل/.test(x)) return 'child';
  if (/i.?m pregnant|i am pregnant|am pregnant|i am breastfeeding|انا حامل|وانا حامل|انا مرضع|وانا مرضع/.test(x)) return 'pregnancy';
  if (/(stop|skip|double|restart)(ping)? (my |the |taking |using )|should i (stop|start|skip)|can i (stop|skip|double)|missed (a |my )?dose|forgot (a |my |to )|اوقف|وقف|اقف|نسيت|فاتتني|اكمل|ابدا|ينفع (اخد|اخذ|ابدا)|ضعف الجرعه/.test(x)) return 'stopstart';
  if (/dose|dosage|\d+ ?mg|how (many|much|often|long)|جرعه|جرعات|كام (حبه|قرص|كبسوله|مره|يوم)|كم (حبه|قرص|كبسوله|مره|يوم)|كل كام|مده (العلاج|الاستخدام)|لمده كام/.test(x)) return 'dose';
  if (/which antibiotic|what antibiotic|best antibiotic|antibiotic (for|should)|prescribe me|اي مضاد|ايه المضاد|ما المضاد|اي نوع|مضاد حيوي (يناسب|مناسب|لعلاج)|اخد (ايه|اي|مضاد)|اخذ (ايه|اي|مضاد)|اتناول|افضل مضاد|احسن مضاد/.test(x)) return 'choose';
  if (/i have|i feel|i am (sick|ill)|my (throat|ear|tooth|wound|skin)|عندي|حاسس|حاسه|بعاني|اعاني|اصبت|تعبان/.test(x)) return 'symptom';
  return 'general';
}

/* ---------- small talk ---------- */

function smallTalk(x: string): R.Canned | null {
  const y = x.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const words = y ? y.split(' ').length : 0;
  if (!y) return null;
  if (words <= 3 && /^(hi+|hello|hey|مرحبا|اهلا|اهلين|هاي|السلام عليكم|سلام عليكم|سلام|صباح الخير|مساء الخير)(?=\s|$)/.test(y)) return R.GREETING;
  if (words <= 6 && /\b(thanks|thank you|thx)\b|شكرا|متشكر|تسلم|يخليك|جزاك/.test(y)) return R.THANKS;
  if (/what can you do|who are you|what are you|how do you work|انت (مين|ايه)|انتا مين|من انت|بتعمل ايه|تقدر (تعمل|تساعد)|ماذا تفعل|ما وظيفتك|عرفني بنفسك/.test(y) || /^(help|مساعده|ساعدني)$/.test(y)) return R.ABOUT;
  return null;
}

/* ---------- the reply ---------- */

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
    const what = asked[0] ? FIELD_LABELS[asked[0]] : null;
    return {
      kind: 'text',
      text: what
        ? { ar: `لا توجد معلومة عن «${what.ar}» في ملف ${n.ar} حتى الآن، ولن أخمّن. يمكنك فتح صفحة الدواء أو سؤال الصيدلي.`, en: `There is no “${what.en}” information in the ${n.en} page yet, and I will not guess. You can open the medicine page or ask a pharmacist.` }
        : { ar: `وجدت ${n.ar} في قائمة الأدوية، لكن لا يوجد ما يجيب عن سؤالك مباشرة. افتح صفحة الدواء لقراءة التفاصيل.`, en: `I found ${n.en} in the medicine list, but nothing answers your question directly. Open the medicine page to read the details.` },
      links: [medLink(m)],
    };
  }
  const labels = asked.length ? wanted.filter((f) => hits.some((h) => h.id.endsWith(`:${f}`))).map((f) => FIELD_LABELS[f]) : [];
  const lead: Bi = asked.length
    ? { ar: `عن ${n.ar} — ${labels.map((l) => l.ar).join(' و')}:`, en: `${n.en} — ${labels.map((l) => l.en).join(' and ')}:` }
    : { ar: `نبذة عن ${n.ar}:`, en: `A short overview of ${n.en}:` };
  return { kind: 'answer', lead, hits, loose: false };
}

function leadFor(x: string, title: Bi, many: boolean, loose: boolean): Bi {
  if (loose) return { ar: `لم أجد إجابة مطابقة تمامًا. أقرب ما وجدته في «${title.ar}»:`, en: `I did not find an exact match. The closest thing is in “${title.en}”:` };
  if (many) return { ar: 'وجدت أكثر من موضع مرتبط بسؤالك:', en: 'I found more than one place related to your question:' };
  if (/^(هل|is |are |can |do |does |should |will )/.test(x)) return { ar: `للإجابة عن سؤالك، ورد في «${title.ar}»:`, en: `To answer your question, “${title.en}” says:` };
  if (/^(لماذا|ليه|كيف|ازاي|why|how)/.test(x)) return { ar: `للتوضيح، هذا ما ورد في «${title.ar}»:`, en: `To explain, here is what “${title.en}” says:` };
  return { ar: `بخصوص سؤالك، هذا ما ورد في «${title.ar}»:`, en: `On your question, here is what “${title.en}” says:` };
}

/** Decide the reply for one question. Every kind of question gets its own wording. */
export function respond(passages: Passage[], meds: Medicine[], raw: string): Reply {
  const q = raw.trim().slice(0, 300);
  const x = norm(q);
  const v = classify(q);
  if (v === 'injection') return { kind: 'text', text: R.INJECTION, tone: 'warn' };
  if (v === 'emergency') return { kind: 'text', text: R.EMERGENCY, tone: 'alert' };
  const small = smallTalk(x);
  if (small) return { kind: 'text', text: small.text, links: small.links };
  const found = findMeds(meds, q);
  const kind = personalKind(x);
  const why = /^(لماذا|ليه|why)/.test(x) && (kind === 'choose' || kind === 'general');
  if ((v === 'personal' && !why) || kind === 'pregnancy') {
    const c = R.PERSONAL[kind];
    return { kind: 'text', text: c.text, links: [...(c.links ?? []), ...found.slice(0, 1).map(medLink)], tone: 'warn' };
  }
  if (found.length) return medicineReply(passages, found[0], x);

  // General questions are answered from articles and myths first; medicine passages only if nothing else fits.
  let hits = retrieve(passages.filter((p) => !p.id.startsWith('med:')), q, 3);
  if (!hits.length) hits = retrieve(passages.filter((p) => p.id.startsWith('med:')), q, 2);
  if (hits.length) {
    const loose = hits.every((h) => h.loose);
    const keep = loose ? hits.slice(0, 1) : hits.filter((h, i) => i === 0 || (h.score >= hits[0].score * 0.85 && h.matched >= hits[0].matched)).slice(0, 2);
    const shown = keep.map((h) => {
      const isArticle = h.p.id.startsWith('art:');
      return isArticle ? { ...h.p, text: { ar: excerpt(h.p.text.ar, q), en: excerpt(h.p.text.en, q) } } : h.p;
    });
    return { kind: 'answer', lead: leadFor(x, shown[0].title, shown.length > 1, loose), hits: shown, loose };
  }
  const rel = related(passages, q, 3);
  return {
    kind: 'text',
    text: rel.length ? R.NONE_RELATED : R.NONE,
    links: rel.length ? rel.map(linkOf) : R.DEFAULT_LINKS,
  };
}
