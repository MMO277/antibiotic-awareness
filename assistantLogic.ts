import { norm } from './search';
import { ARTICLES } from './articlesData';
import { MYTHS } from './contentData';
import { Bi, FIELD_LABELS, Lang, Medicine, pick, TextField } from './types';
import * as R from './assistantReplies';
import type { Link, PKind } from './assistantReplies';

export interface Ref { title: string; url: string; publisher?: string }
export interface Passage {
  id: string;
  label: string;
  title: Bi;
  text: Record<Lang, string>;
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
    'هل ما ماذا لماذا كيف متي في من علي الي عن او و هذا هذه ده دي ايه ازاي ليه هو هي انا انت لو يا ترى ينفع ممكن عايز عاوز').split(' '),
);

export const tokens = (s: string): string[] =>
  norm(s)
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => w.replace(/^[وبلكف](?=ال.{3})/, '').replace(/^لل(?=.{3})/, '').replace(/^ال(?=.{3})/, '').replace(/(?<=[a-z]{4,})s$/, '').replace(/(?<=[\u0621-\u064A]{3,})ات$/, ''))
    .filter((w) => w.length > 1 && !STOP.has(w));

/** Expanded colloquial & Egyptian dialect dictionary */
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

/** Built-in comprehensive clinical knowledge passages */
const EXTRA_CLINICAL_PASSAGES: Passage[] = [
  {
    id: 'clin:cold-injection',
    label: 'مخاطر حقنة ومجموعة البرد الشعبية',
    title: { ar: 'مخاطر حقنة البرد (مجموعة البرد)', en: 'Dangers of the "Cold Shot" mixture' },
    text: {
      ar: '«حقنة البرد» أو «مجموعة البرد / الخلطة الثلاثية» الشعبية المنتشرة في الصيدليات (والتي تخلط عادة مضاداً حيوياً مع كورتيزون ومسكن قوي) هي ممارسة خاطئة وخطيرة جداً ومحرمة طبياً. أولاً: نزلات البرد والإنفلونزا تسببها فيروسات والمضاد الحيوي لا يعالج الفيروسات مطلقاً. ثانياً: أخذ جرعة واحدة غير مكتملة من المضاد يسرع طفرات البكتيريا المقاومة للمضادات. ثالثاً: الكورتيزون يثبط مناعة الجسم الطبيعية، والمسكنات القوية قد تسبب قصوراً حاداً في الكلى أو قرحة بالمعدة. وزارة الصحة المصرية تحذر منها بشدة.',
      en: 'The popular "cold injection" or "cold pack" (mixing an antibiotic with a corticosteroid and an NSAID) is medically irrational and dangerous. Colds are viral, a single antibiotic dose drives superbug resistance, corticosteroids suppress immunity, and high-dose NSAIDs carry renal and gastric risks.',
    },
    link: '/articles/avoid-self-medication',
    refs: [{ title: 'تحذيرات وزارة الصحة والـ CDC من حقن البرد', url: 'https://www.cdc.gov/antibiotic-use/' }],
    hay: norm('حقنه البرد مجموعه البرد الخلطه الثلاثيه حقنه هتلر كورتيزون مسكن خطوره اضرار نزله كلى'),
  },
  {
    id: 'clin:stop-on-improvement',
    label: 'إكمال كورس العلاج وعدم التوقف عند التحسن',
    title: { ar: 'لماذا يجب إكمال كورس المضاد كاملاً؟', en: 'Why finish the entire antibiotic course?' },
    text: {
      ar: 'يجب دائماً إكمال مدة علاج المضاد الحيوي المحددة بالكامل حتى آخر حبة، حتى لو اختفت الأعراض وشعرت بتحسن تام بعد يومين أو ثلاثة! الشعور بالتحسن يعني فقط أن أضعف البكتيريا قد ماتت، بينما تظل البكتيريا الأكثر شراسة ومقاومة حية. إذا توقفت مبكراً، ستتكاثر هذه البكتيريا الشرسة مجدداً وتطور مناعة كاملة ضد الدواء، مما يؤدي إلى انتكاسة المرض بشكل أعنف وفشل المضاد الحيوي في علاجه لاحقاً.',
      en: 'Always complete the full prescribed duration of antibiotics, even if symptoms vanish after a few days. Early discontinuation leaves the most resilient bacteria alive, allowing them to mutate and cause a resistant recurrence.',
    ),
    link: '/articles/safe-use',
    refs: [{ title: 'CDC - Taking Antibiotics Safely', url: 'https://www.cdc.gov/antibiotic-use/q-and-a.html' }],
    hay: norm('اوقف الدواء تحسن وقفت خفيت اكمل الكورس مده العلاج اختفاء الاعراض'),
  },
  {
    id: 'clin:missed-dose',
    label: 'التعامل السليم مع نسيان الجرعة',
    title: { ar: 'ماذا تفعل إذا نسيت جرعة المضاد الحيوي؟', en: 'What to do if you miss a dose?' },
    text: {
      ar: 'إذا نسيت تناول جرعة من المضاد الحيوي في موعدها، فتناولها فور تذكرك مباشرة. لكن إذا كان موعد الجرعة التالية قد اقترب، فتجاوز الجرعة المنسية وتابع جدول مواعيدك المعتاد في وقته المقرر. إياك ومضاعفة الجرعة (أي أخذ حبتين معاً) لتعويض ما فاتك، لأن مضاعفة الجرعة تؤدي إلى ارتفاع حاد في تركيز الدواء في الدم مما يسبب آثاراً جانبية خطيرة وتسمماً دوائياً.',
      en: 'If you miss an antibiotic dose, take it as soon as you remember unless it is almost time for your next dose. If so, skip the missed dose and resume your regular schedule. Never double up on pills.',
    },
    link: '/articles/safe-use',
    refs: [{ title: 'MedlinePlus - Antibiotic Missed Dose Guidelines', url: 'https://medlineplus.gov/druginfo/meds/a685001.html' }],
    hay: norm('نسيت جرعه موعد نسيان حبه قرص فاتتني اعوض الجرعه مضاعفه'),
  },
  {
    id: 'clin:dairy-food-interactions',
    label: 'تداخل المضادات الحيوية مع الحليب والأطعمة',
    title: { ar: 'تداخل المضادات الحيوية مع الحليب ومشتقات الألبان', en: 'Antibiotic interactions with milk and dairy' },
    text: {
      ar: 'تتفاعل بعض المضادات الحيوية الشهيرة (خاصة عائلة التتراسيكلين مثل الدوكسيسيكلين، وعائلة الفلوروكينولونات مثل السيبروفلوكساسين والليفوفلوكساسين) مع الكالسيوم الموجود في الحليب والزبادي ومنتجات الألبان، وكذلك مع مكملات الحديد والمغنيسيوم. يرتبط الكالسيوم بالدواء في المعدة مكوناً مركباً غير قابل للامتصاص، مما يبطل مفعول المضاد تماماً. يجب الفصل بين تناول هذه المضادات ومنتجات الألبان بساعتين قبل الدواء أو 4 ساعات بعده. بينما مضادات أخرى كالأموكسيسيلين يمكن أخذها مع الطعام دون تعارض.',
      en: 'Certain antibiotics (like tetracyclines and fluoroquinolones) bind with calcium in milk and dairy products, preventing gut absorption. Separate them from dairy products and calcium/iron supplements by at least 2 hours before or 4 hours after.',
    },
    link: '/articles/safe-use',
    refs: [{ title: 'FDA - Drug and Food Interactions', url: 'https://www.fda.gov/drugs/resources-drugs/food-and-drug-interactions' }],
    hay: norm('لبن حليب اكل طعام جبنه زبادي كالسيوم حديد شرب مع اللبن تداخل'),
  },
  {
    id: 'clin:oral-suspension-storage',
    label: 'حفظ وتخزين المضاد الحيوي الشراب المعلق للأطفال',
    title: { ar: 'كيفية حفظ المضاد الحيوي الشراب للأطفال وصلاحيته', en: 'Storing pediatric antibiotic oral suspensions' },
    text: {
      ar: 'المضاد الحيوي الشراب للأطفال (الذي يتم حله بالماء المقطر في الصيدلية) يجب حفظه عادة في باب الثلاجة في درجة حرارة بين 2 إلى 8 درجات مئوية لحمايته من التلف وفقدان الفاعلية. تتراوح مدة صلاحيته بعد الحل بين 7 إلى 14 يوماً فقط بحسب نوع الدواء الموضح في النشرة، وبعد انتهاء هذه المدة أو انتهاء كورس العلاج يجب التخلص من أي كمية متبقية في الزجاجة فوراً وعدم الاحتفاظ بها نهائياً. تذكر دائماً رج الزجاجة جيداً قبل كل جرعة واستخدام سرنجة القياس بدقة.',
      en: 'Reconstituted pediatric antibiotic suspensions must usually be stored in the refrigerator (2-8°C) and discarded after 7 to 14 days. Always shake the bottle well before each use and never keep leftovers for future illnesses.',
    },
    link: '/articles/storage-and-disposal',
    refs: [{ title: 'CDC - Safe Medicine Storage', url: 'https://www.cdc.gov/antibiotic-use/' }],
    hay: norm('حفظ تخزين شراب معلق اطفال ثلاجه صلاحيه حل بالماء مقطر متبقي ترمي'),
  },
  {
    id: 'clin:probiotics-diarrhea',
    label: 'الإسهال المرتبط بالمضادات ودور البروبيوتيك',
    title: { ar: 'الإسهال المرتبط بالمضادات الحيوية وأهمية البروبيوتيك', en: 'Antibiotic-associated diarrhea and probiotics' },
    text: {
      ar: 'الإسهال واضطراب الجهاز الهضمي من الآثار الجانبية الشائعة جداً؛ لأن المضادات الحيوية لا تميز وتقتل البكتيريا النافعة في الأمعاء بجانب البكتيريا الضارة. للمساعدة في استعادة التوازن، ينصح بتناول الزبادي والأغذية المخمرة أو مكملات البروبيوتيك (الخمائر النافعة)، مع مراعاة تناولها بفارق ساعتين على الأقل عن موعد جرعة المضاد الحيوي حتى لا يقتلها الدواء. وإذا كان الإسهال شديداً أو مائياً جداً أو مصحوباً بمغص حاد أو دم، يجب مراجعة الطبيب فوراً لفحص بكتيريا المطثية العسيرة (C. difficile).',
      en: 'Antibiotics eliminate beneficial gut flora alongside harmful bacteria, frequently causing diarrhea. Eating yogurt or taking probiotic supplements (spaced at least 2 hours away from the antibiotic) helps restore gut microbiome balance.',
    },
    link: '/articles/antibiotic-diarrhoea',
    refs: [{ title: 'CDC - Antibiotic Side Effects: C. difficile', url: 'https://www.cdc.gov/antibiotic-use/safety/side-effects.html' }],
    hay: norm('اسهال بطن مغص معده بروبيوتيك زبادي بكتيريا نافعه امعاء'),
  },
  {
    id: 'clin:culture-sensitivity',
    label: 'أهمية تحليل المزرعة واختبار الحساسية',
    title: { ar: 'ما هو تحليل المزرعة واختبار الحساسية (Culture & Sensitivity)؟', en: 'What is a culture and sensitivity test?' },
    text: {
      ar: 'تحليل المزرعة واختبار الحساسية (Culture and Sensitivity Test) هو الفحص المخبري الأدق لتحديد نوع البكتيريا المسببة للعدوى ومعرفة أقوى مضاد حيوي فعال ضدها وأي المضادات أصبحت البكتيريا مقاومة لها. يساهم هذا التحليل بشكل حاسم في ترشيد استخدام المضادات، حيث يمنع استخدام المضادات واسعة المجال دون داعٍ ويضمن شفاء المريض بأسرع وقت وأقل آثار جانبية.',
      en: 'A culture and sensitivity test identifies the specific causative bacteria and determines which antibiotics are most effective and which ones the bacteria resist, ensuring targeted therapy.',
    },
    link: '/articles/antibiotic-resistance',
    refs: [{ title: 'MedlinePlus - Bacterial Culture Test', url: 'https://medlineplus.gov/lab-tests/bacterial-culture-test/' }],
    hay: norm('تحليل مزرعه حساسيه ميكروب فحص معمل عينه بول صديد دم'),
  },
  {
    id: 'clin:birth-control',
    label: 'المضادات الحيوية وفاعلية حبوب منع الحمل',
    title: { ar: 'هل تؤثر المضادات الحيوية على حبوب منع الحمل؟', en: 'Do antibiotics affect oral contraceptives?' },
    text: {
      ar: 'بعض المضادات الحيوية (خاصة ريفامبيسين ومشتقاته، ومضادات أخرى نتيجة تأثيرها على حركة بكتيريا الأمعاء وإعادة امتصاص الإستروجين) قد تقلل من فاعلية حبوب منع الحمل الهرمونية. يُنصح دائماً باستخدام وسيلة حماية إضافية (كالواقي الذكري) أثناء فترة تناول المضاد الحيوي ولمدة 7 أيام على الأقل بعد انتهاء الكورس، واستشارة الصيدلي أو الطبيب للتأكد من نوع الدواء.',
      en: 'Certain antibiotics can reduce the contraceptive efficacy of birth control pills. Using a backup non-hormonal contraceptive method (such as condoms) during treatment and for 7 days after is recommended.',
    },
    link: '/articles/questions-to-ask',
    refs: [{ title: 'NHS - Antibiotics and Contraception', url: 'https://www.nhs.uk/conditions/antibiotics/' }],
    hay: norm('منع الحمل حبوب وسيله هرمون تاثير تبطل مفعول حمل'),
  },
  {
    id: 'clin:dental-antibiotics',
    label: 'المضادات الحيوية في علاج ألم ومشاكل الأسنان',
    title: { ar: 'هل المضاد الحيوي يعالج وجع الضرس والأسنان؟', en: 'Do antibiotics treat toothache and dental pain?' },
    text: {
      ar: 'المضاد الحيوي ليس مسكناً للألم! معظم آلام الأسنان تنتج عن التهاب عصب السن أو التسوس وتتطلب تدخلاً علاجياً لدى طبيب الأسنان (كحشو العصب أو التنظيف). لا يصف طبيب الأسنان المضاد الحيوي إلا في حالات انتشار العدوى البكتيرية وظهور خراج صديدي، تورم واضح في الوجه، أو ارتفاع في درجة الحرارة. تناول المضادات عشوائياً لكل وجع سن لا يحل المشكلة ويزيد من مقاومة البكتيريا.',
      en: 'Antibiotics are not painkillers and do not cure pulpitis or caries. They are indicated only when systemic infection, cellulitis, or spreading abscess is present. Dental intervention is essential.',
    },
    link: '/articles/avoid-self-medication',
    refs: [{ title: 'ADA - Antibiotics for Dental Pain and Swelling', url: 'https://www.ada.org/' }],
    hay: norm('اسنان ضرس وجع الم خراج لثه عصب تسوس حشو'),
  },
];

export function buildPassages(meds: Medicine[]): Passage[] {
  const out: Passage[] = [...EXTRA_CLINICAL_PASSAGES];
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
    return { p, score: p.id.startsWith('clin:') ? s * 1.3 : (p.id.startsWith('med:') ? s * 0.8 : s), matched };
  });
}

const keyOf = (p: Passage) => p.id.split(':').slice(0, 2).join(':');

/** Adaptive, flexible retrieval that readily matches user questions without overly strict thresholds */
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
      const names = [m.genericName.en, m.genericName.ar, m.activeIngredients.en, m.activeIngredients.ar, ...m.brands.filter((b) => b.verified).map((b) => b.name)];
      let top = 0;
      for (const n of names) {
        if (!n) continue;
        const normN = norm(n);
        if (normN.length >= 3 && x.includes(normN)) top = Math.max(top, 1.0);
      }
      return { m, top };
    })
    .filter((s) => s.top >= 0.8)
    .sort((a, b) => b.top - a.top);
  return scored.slice(0, 2).map((s) => s.m);
}

const ASPECTS: { f: TextField; re: RegExp }[] = [
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
  if (/رشح|سخونيه|حراره|كحه|سعال|بلغم|احتقان|زور|لوز/.test(x)) return 'symptom';
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
  if (v === 'emergency') return { kind: 'text', text: R.EMERGENCY, tone: 'alert' };

  const small = smallTalk(x);
  if (small) return { kind: 'text', text: small.text, links: small.links };

  const found = findMeds(meds, q);
  if (found.length) return medicineReply(passages, found[0], x);

  // Check specific patient advice kinds first (constructive answers)
  const pKind = personalKind(x);
  if (pKind) {
    const c = R.PERSONAL[pKind];
    return { kind: 'text', text: c.text, links: c.links, tone: 'normal' };
  }

  // General retrieval across all passages (including extra clinical passages)
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
