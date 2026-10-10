import { norm } from './search';
import { ARTICLES } from './articlesData';
import { MYTHS } from './contentData';
import { Lang, Medicine, pick } from './types';

/** A link to a real source page. */
export interface Ref { title: string; url: string; publisher?: string }
/** A piece of site content the assistant may quote. */
export interface Passage {
  id: string;
  label: string; // where it comes from, shown to the user
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
    .map((w) => w.replace(/^لل(?=.{3})/, '').replace(/^ال(?=.{3})/, '').replace(/^[وبلكف](?=ال.{3})/, '').replace(/(?<=[a-z]{4,})s$/, '').replace(/(?<=[\u0621-\u064A]{3,})ات$/, ''))
    .filter((w) => w.length > 1 && !STOP.has(w));

/** Everyday / colloquial words that the site content writes differently (all norm()-ed). */
const SYN: Record<string, string[]> = {
  زكام: ['برد', 'نزله'], كحه: ['سعال'], سعال: ['كحه'], اتجنب: ['وقايه', 'منع', 'تجنب'], امنع: ['وقايه', 'منع'],
  share: ['sharing', 'shared', 'leftover'], stop: ['stopping', 'finish'], وقايه: ['منع'], اشارك: ['مشاركه', 'شارك', 'تشارك'], مضادي: ['مضاد'], شارك: ['مشاركه', 'تشارك'], بقايا: ['متبقي', 'المتبقيه'], حساسيه: ['تحسس'], سخونيه: ['حراره'], اسهال: ['اسهال'], دوا: ['دواء', 'مضاد'], ادويه: ['دواء'],
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
      text: { en: text('en'), ar: text('ar') },
      link: '/myth',
      refs: [{ title: m.source.title, url: m.source.url, publisher: m.source.publisher }],
      hay: norm(`${text('en')} ${text('ar')}`),
    });
  });
  // Medicine records. Dosing / strengths / age-limit fields are left out on purpose.
  const FIELDS = ['approvedUses', 'sideEffects', 'interactions', 'pregnancyBreastfeeding', 'patientEducation'] as const;
  meds.forEach((m) =>
    FIELDS.forEach((f) => {
      if (!m[f].en && !m[f].ar) return;
      const name = `${m.genericName.en} ${m.genericName.ar}`.trim();
      out.push({
        id: `med:${m.id}:${f}`,
        label: `${m.genericName.en || m.genericName.ar} — ${f}`,
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

export interface Hit { p: Passage; score: number }

/** Keyword retrieval with inverse-document-frequency weights. Returns [] when nothing relevant is found. */
export function retrieve(passages: Passage[], q: string, max = 2): Hit[] {
  const base = Array.from(new Set(tokens(q)));
  if (!base.length || !passages.length) return [];
  const docs = passages.map((p) => new Set(tokens(p.hay)));
  const idf = (t: string) => {
    const df = docs.filter((d) => d.has(t)).length;
    return df ? Math.log(1 + passages.length / df) : 0;
  };
  // each query word is a "concept": the word itself plus any synonyms
  const concepts = base.map((t) => [t, ...(SYN[t] ?? [])]);
  const scored = passages
    .map((p, i) => {
      let s = 0;
      let matched = 0;
      for (const alts of concepts) {
        const hit = alts.filter((a) => docs[i].has(a));
        if (hit.length) { s += Math.max(...hit.map(idf)); matched++; }
      }
      if (matched) {
        const title = new Set(tokens(p.label));
        for (const alts of concepts) if (alts.some((a) => title.has(a))) s += 0.5;
      }
      return { p, score: s, matched };
    })
    // one matching word is enough only when the question is a single word and the match is distinctive
    .filter((h) => (h.matched >= 2 && h.matched >= Math.ceil(concepts.length * 0.5) && h.score >= 1.2) || (concepts.length === 1 && h.score >= 2.5))
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const hits: Hit[] = [];
  for (const h of scored) {
    const key = h.p.id.split(':').slice(0, 2).join(':'); // at most one passage per article / myth / medicine
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ p: h.p, score: h.score });
    if (hits.length >= max) break;
  }
  return hits;
}
