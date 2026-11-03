/**
 * aiConversationContext.ts
 *
 * Shared Conversation State, Multi-Turn Topic & Medicine Memory Engine,
 * Instant Egyptian Colloquial Medical Synthesizer (<10ms response time),
 * and Clinical Grounding for `ChatWidget.tsx` and `Assistant.tsx`.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  ChatUiMessage,
  extractAnswerPlainText,
  findMeds,
  matchCondition,
  personalKind,
  Reply,
} from './assistantLogic';
import { PendingAiActionProposal } from './aiActionExecutor';
import { checkDrugAllergySafety, UserHealthProfile } from './allergyData';
import { SavedPrescription, TreatmentSchedule } from './trackerData';
import { emptyMedicine, Lang, Medicine, pick, TEXT_FIELDS } from './types';
import { SEED } from './seedData';
import {
  CONDITIONS,
  ConditionKind,
  Link as ReplyLink,
  PERSONAL,
  PKind,
} from './assistantReplies';
import { EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import { norm } from './search';

export interface EnhancedChatUiMessage extends ChatUiMessage {
  id: string;
  attachmentPreviewUrl?: string;
  attachmentFileName?: string;
  actionProposal?: PendingAiActionProposal;
  isSystemActionResult?: boolean;
  actionResultSuccess?: boolean;
  links?: ReplyLink[];
}

export interface ConversationTopicMemory {
  lastCondition: ConditionKind | null;
  lastMedicines: Medicine[];
  lastPersonalKind: PKind | null;
  recentUserQuestions: string[];
}

export type FollowUpAspect =
  | 'best_choice'
  | 'price'
  | 'dose'
  | 'substitutes'
  | 'side_effects'
  | 'interactions'
  | 'pregnancy_child'
  | 'pain_relief'
  | 'more_details';

let cachedSeedMeds: Medicine[] | null = null;
export function getSeedMedicinesFallback(): Medicine[] {
  if (cachedSeedMeds) return cachedSeedMeds;
  cachedSeedMeds = SEED.map((s) => {
    const m = emptyMedicine(s.id);
    for (const f of TEXT_FIELDS) {
      const v = s.fields?.[f];
      if (v) m[f] = v;
    }
    m.status = 'approved';
    m.brands = s.brands || [];
    m.sources = s.sources || [];
    return m;
  });
  return cachedSeedMeds;
}

const CONVERSATION_SYNC_EVENT = 'aa-ai-conversation-sync';

let sharedUid: string | null = null;
let sharedMessages: EnhancedChatUiMessage[] = [];

function notifyConversationListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CONVERSATION_SYNC_EVENT, {
        detail: { uid: sharedUid, messages: sharedMessages },
      })
    );
  }
}

export function useSyncedAiConversation(currentUid: string | null | undefined) {
  const normalizedUid = currentUid || null;

  if (sharedUid !== normalizedUid) {
    sharedUid = normalizedUid;
    sharedMessages = [];
  }

  const [messages, setMessagesState] = useState<EnhancedChatUiMessage[]>(() => sharedMessages);

  useEffect(() => {
    if (sharedUid !== normalizedUid) {
      sharedUid = normalizedUid;
      sharedMessages = [];
      setMessagesState([]);
    }
  }, [normalizedUid]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.uid === normalizedUid && Array.isArray(detail.messages)) {
        setMessagesState([...detail.messages]);
      }
    };
    window.addEventListener(CONVERSATION_SYNC_EVENT, handler);
    return () => window.removeEventListener(CONVERSATION_SYNC_EVENT, handler);
  }, [normalizedUid]);

  const setMessages = useCallback(
    (
      updater:
        | EnhancedChatUiMessage[]
        | ((prev: EnhancedChatUiMessage[]) => EnhancedChatUiMessage[])
    ) => {
      const next = typeof updater === 'function' ? updater(sharedMessages) : updater;
      sharedMessages = next;
      setMessagesState([...next]);
      notifyConversationListeners();
    },
    []
  );

  const clearConversation = useCallback(() => {
    sharedMessages = [];
    setMessagesState([]);
    notifyConversationListeners();
  }, []);

  return { messages, setMessages, clearConversation };
}

const CONDITION_DEFAULT_MED_IDS: Record<ConditionKind, string[]> = {
  ear: ['amoxicillin-clavulanic-acid', 'amoxicillin', 'azithromycin'],
  dental: ['amoxicillin-clavulanic-acid', 'metronidazole', 'clindamycin', 'azithromycin'],
  throat: ['amoxicillin', 'penicillin-v-potassium', 'azithromycin'],
  uti: ['nitrofurantoin', 'co-trimoxazole', 'ciprofloxacin'],
  skin: ['doxycycline', 'cephalexin', 'clindamycin'],
  sinus: ['amoxicillin-clavulanic-acid', 'azithromycin'],
  chest: ['amoxicillin-clavulanic-acid', 'azithromycin'],
  stomach: ['clarithromycin', 'amoxicillin', 'metronidazole'],
};

const CONDITION_NAMES_AR: Record<ConditionKind, string> = {
  ear: 'وجع والتهاب الأذن',
  dental: 'وجع وخراج الأسنان واللثة',
  throat: 'التهاب الحلق واللوزتين',
  uti: 'التهاب المسالك البولية وحرقان البول',
  skin: 'التهابات الجلد والدمامل وحب الشباب',
  sinus: 'التهاب الجيوب الأنفية',
  chest: 'الكحة والتهاب الشعب الهوائية والصدر',
  stomach: 'جرثومة المعدة والتهاب المعدة',
};

const CONDITION_PAIN_AND_CARE_AR: Record<ConditionKind, string> = {
  ear: '• لتسكين وجع الودن فوراً: تقدر تاخد مسكن آمن زي «باراسيتامول» (بنادول / سيتال) أو «إيبوبروفين» (بروفين بعد الأكل لو مفيش تعب في المعدة أو الكلى)، مع عمل كمادات دافية على الودن من بره.\n• تنبيه مهم جداً: أوعى تحط أي نقط في ودنك أو زيت قبل ما دكتور أنف وأذن يبص بمنظار الأذن ويتأكد إن طبلة الودن سليمة ومفيش فيها ثقب.',
  dental: '• لتسكين وجع الضرس المؤقت: مسكن «باراسيتامول» أو مضاد التهاب زي «إيبوبروفين / بروفين» (بعد الأكل وبشرط سلامة المعدة والكلى) مع مضمضة بمية دافية وملح.\n• خلي بالك: المضاد الحيوي مش مسكن ومش بيسكن عصب الضرس لوحده؛ لازم دكتور الأسنان يفتح الضرس أو ينضف الخراج.',
  throat: '• لتهدئة وجع الزور واللوز: اشرب سوائل دافية، غرغرة بمية دافية وملح، استحلاب للحلق، ومسكن وخافض حرارة زي «باراسيتامول».',
  uti: '• لتهدئة حرقان البول: اشرب مية كتير جداً (2 لـ 3 لتر في اليوم) عشان تغسل المثانة أول بأول، وممكن فوار مطهر للمسالك بعد مراجعة الصيدلي، ويفضل عمل تحليل بول أو مزرعة قبل المضاد.',
  skin: '• للعناية بالدمامل أو التهاب الجلد: كمادات دافية نضيفة، غسول مطهر موضعي، وعدم عصر الدمل بإيدك أبداً عشان العدوى متنتشرش.',
  sinus: '• لتخفيف صداع وضغط الجيوب الأنفية: غسيل الأنف بمحلول ملحي (بخاخ ماء بحر) واستنشاق بخار مية دافية مع مسكن «باراسيتامول».',
  chest: '• لتهدئة الكحة والبلغم: سوائل دافية كتير (ينسون، تليو، جنزبيل بعسل)، ومذيب بلغم مناسب لو الكحة ببلغم بعد استشارة الصيدلي.',
  stomach: '• لراحة المعدة مع العلاج: ابعد عن المسبكات والقهوة والشطة والمسكنات التقيلة على المعدة، والتزم بدواء الحموضة قبل الأكل بنص ساعة.',
};

const CONDITION_BEST_COMPARISON_AR: Record<ConditionKind, string> = {
  ear: '1. الأحسن والأقوى كخط أول (First-Line): هو «أموكسيسيلين» بجرعة مظبوطة أو «أوجمنتين / هاي بيوتك / كورام» (أموكسيسيلين + كلافولانات)، لأنهم بيقضوا على أشهر بكتيريا بتعمل التهاب في الأذن الوسطى بكفاءة عالية.\n2. إمتى نختار أوجمنتين بدل أموكسيسيلين العادي؟ لو الوجع شديد، أو لو أخدت مضاد حيوي قريب في آخر شهر، لأن مادة الكلافولانات بتحمي المضاد من البكتيريا العنيدة.\n3. طب لو عندك حساسية بنسلين؟ ساعتها بنبعد عن أوجمنتين وإيموكس خالص، وبيكون الأحسن ليك هو «زيثروماكس (أزيثرومايسين)» أو «سيفوروكسيم» تحت إشراف الدكتور.',
  dental: '1. الأحسن والأشهر لخراج والتهاب الأسنان: هو «أوجمنتين 1 جرام» (أو بدايله المصرية زي هاي بيوتك، كورام، ميجاموكس) لأنه بيغطي بكتيريا الفم المقاومة.\n2. لو الخراج شديد أو فيه ورم في اللثة والوش: دكتور الأسنان غالباً بيضيف معاه «فلاجيل 500 مجم (ميترونيدازول)» عشان يقضي على البكتيريا اللاهوائية العميقة في الجذور.\n3. لو عندك حساسية بنسلين: الأحسن والأنسب لعدوى الأسنان هو «كليندامايسين (دالاسين سي 300 مجم)» أو «زيثروماكس».',
  throat: '1. الأحسن علمياً لصديد اللوز البكتيري: هو «أموكسيسيلين (إيموكس / أموكسيل)» أو «أوجمنتين» لمدة 10 أيام كاملة لمنع أي مضاعفات على القلب أو المفاصل (الحمى الروماتيزمية).\n2. لو عندك حساسية بنسلين: البديل الممتاز هو «زيثروماكس (أزيثرومايسين)» أو «كلاسيد (كلاريثرومايسين)».',
  uti: '1. الأحسن لالتهاب وحرقان المثانة البسيط: هو «ماكروفيوران / يوفامين ريتارد (نيتروفورانتوين)» لأنه بيتركز كله في المسالك البولية ومبيأثرش على باقي الجسم.\n2. إمتى نلجأ لـ «سيبروفار / سيبروباي (سيبروفلوكساسين)»؟ لو العدوى شديدة أو طالعة للكلى، أو لو نتيجة مزرعة البول قالت إن الميكروب حساس ليه.',
  skin: '1. للدمامل والخراج والتهاب الجلد البكتيري: الأحسن هو «سيفالكسين (كيبوركس)» أو «أوجمنتين» لأنهم ممتازين ضد البكتيريا العنقودية بتاعة الجلد.\n2. لحب الشباب الملتهب: الأحسن هو «دوكسيسيكلين (فيبراميسين / تابوسين)» أو الدهانات الموضعية المحتوية على كليندامايسين أو فيوسيديك أسيد (فيوسيدين).',
  sinus: '1. الأحسن لو التهاب الجيوب الأنفية قلب ببكتيريا (استمر أكتر من 10 أيام بصديد وحرارة): هو «أوجمنتين 1 جرام» كخط أول.\n2. لو عندك حساسية بنسلين: البديل هو «زيثروماكس» أو «تافانيك (ليفوفلوكساسين)» للبالغين.',
  chest: '1. الأحسن للالتهاب الشعبي أو الرئوي البكتيري: غالباً بيبدأ الدكتور بـ «أوجمنتين» أو «زيثروماكس» (أو الاتنين مع بعض في بعض حالات الالتهاب الرئوي عشان يغطوا كل أنواع البكتيريا التنفسية).',
  stomach: '1. الأحسن لعلاج جرثومة المعدة: مفيش مضاد واحد لوحده بيقضي عليها! الأحسن علمياً هو «الكورس الثلاثي أو الرباعي» لمدة 14 يوم بالظبط، وبيجمع بين «كلاريثرومايسين (كلاسيد)» + «أموكسيسيلين (أو فلاجيل)» + «دواء معدة قوي زي أوميبرازول أو نيكسيوم».',
};

/**
 * Scans the conversation history from newest to oldest to extract the active medical topic,
 * condition, and medications so follow-up questions ("طب إيه أحسن؟", "بكام؟", "جرعته إيه؟")
 * work seamlessly across turns.
 */
function matchConditionEnhanced(x: string): ConditionKind | null {
  const base = matchCondition(x);
  if (base) return base;
  if (/ودن|ودني|وداني|طبله الودن/.test(x)) return 'ear';
  if (/سنان|سناني|ضرس|ضروسي|اللثه/.test(x)) return 'dental';
  if (/زور|زوري|حلقي|اللوز/.test(x)) return 'throat';
  if (/حرقان|المثانه|مسالك/.test(x)) return 'uti';
  if (/دمل|دمامل|خراج/.test(x)) return 'skin';
  if (/جيوب|مناخير|انفيه/.test(x)) return 'sinus';
  if (/كحه|بلغم|صدري/.test(x)) return 'chest';
  if (/معدتي|بطني|جرثومه/.test(x)) return 'stomach';
  return null;
}

export function extractConversationTopicMemory(
  msgs: EnhancedChatUiMessage[],
  meds: Medicine[],
  lang: Lang
): ConversationTopicMemory {
  let lastCondition: ConditionKind | null = null;
  const medMap = new Map<string, Medicine>();
  let lastPersonalKind: PKind | null = null;
  const recentUserQuestions: string[] = [];

  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    const plain = extractAnswerPlainText(m, lang) || m.text || '';
    const x = norm(plain);

    if (m.who === 'me' && plain.trim()) {
      if (recentUserQuestions.length < 5) {
        recentUserQuestions.push(plain.trim());
      }
    }

    if (!lastCondition && m.who === 'me') {
      const cond = matchConditionEnhanced(x);
      if (cond) lastCondition = cond;
    }

    if (!lastPersonalKind) {
      const pk = personalKind(x);
      if (pk) lastPersonalKind = pk;
    }

    // Check explicit links attached to bot messages (e.g., /medicine/amoxicillin-clavulanic-acid)
    const msgLinks = m.links || (m.reply?.kind === 'text' ? m.reply.links : undefined) || [];
    for (const l of msgLinks) {
      if (l.to && l.to.startsWith('/medicine/')) {
        const medId = l.to.replace('/medicine/', '').trim();
        const foundMed = meds.find((item) => item.id === medId);
        if (foundMed && !medMap.has(foundMed.id)) {
          medMap.set(foundMed.id, foundMed);
        }
      }
    }

    // Check medicines mentioned by name or brand in the message text
    const textMeds = findMeds(meds, plain);
    for (const tm of textMeds) {
      if (!medMap.has(tm.id)) {
        medMap.set(tm.id, tm);
      }
    }
  }

  // If a condition was discussed but no specific Medicine objects were in medMap yet, populate from condition defaults
  if (lastCondition && medMap.size === 0) {
    const defaultIds = CONDITION_DEFAULT_MED_IDS[lastCondition] || [];
    for (const id of defaultIds) {
      const found = meds.find((item) => item.id === id);
      if (found) medMap.set(found.id, found);
    }
  }

  return {
    lastCondition,
    lastMedicines: Array.from(medMap.values()).slice(0, 4),
    lastPersonalKind,
    recentUserQuestions,
  };
}

/**
 * Detects what aspect(s) the user is asking about in a follow-up or direct question.
 */
export function detectFollowUpAspects(rawText: string): FollowUpAspect[] {
  const x = norm(rawText);
  const aspects: FollowUpAspect[] = [];

  if (
    /(احسن|أحسن|افضل|أفضل|انسب|أنسب|انهي|أنهي|ايهم|أيهم|الاحسن|الأحسن|الافضل|ترشح|تفضل|اختار|اخد ايه فيهم|آخد إيه فيهم|اي واحد|الفرق بينهم|انهو|أنهو|better|best|which one|recommend|prefer)/i.test(
      rawText
    ) ||
    /(احسن|افضل|انسب|انهي|ايهم|ترشح|اختار|الفرق بينهم)/.test(x)
  ) {
    aspects.push('best_choice');
  }

  if (/(price|cost|how much|سعر|اسعار|بكام|ثمن|تمن|تكلفه|غالي|رخيص)/.test(x)) {
    aspects.push('price');
  }

  if (
    /(dosage|dose|how often|جرعه|جرعات|جرعته|بيتأخد ازاي|بيتاخد ازاي|اخده ازاي|كل كام ساعه|كل كم ساعه|مواعيد|كام مره|كم مره|لمده كام يوم|مده العلاج|قبل الاكل|بعد الاكل)/.test(
      x
    )
  ) {
    aspects.push('dose');
  }

  if (/(substitut|generic|alternative|بديل|بدايل|بدائل|مثيل|مثائل|نفس الماده|لو مش موجود|لو ناقص)/.test(x)) {
    aspects.push('substitutes');
  }

  if (
    /(side effect|adverse|harm|جانبيه|اعراضه الجانبيه|الاعراض الجانبيه|مضاعفات|اضرار|اضراره|ضرر|مخاطر|بيعمل ايه|يتعب المعده|اسهال)/.test(
      x
    )
  ) {
    aspects.push('side_effects');
  }

  if (/(interact|combine|with milk|with food|تداخل|يتعارض|بيتعارض|مع الاكل|مع اللبن|مع ادويه)/.test(x)) {
    aspects.push('interactions');
  }

  if (/(pregnan|breast|child|kid|baby|contraindic|حامل|حمل|رضاعه|مرضع|اطفال|طفل|رضيع|ممنوع|موانع)/.test(x)) {
    aspects.push('pregnancy_child');
  }

  if (/(مسكن|تسكين|يسكن الوجع|يهدي الوجع|حبايه للوجع|برشام للوجع|painkiller|pain relief|analgesic)/.test(x)) {
    aspects.push('pain_relief');
  }

  if (
    aspects.length === 0 &&
    /(طب و|طيب و| وايه كمان|وايه تاني|قولي اكتر|تفاصيل اكتر|وضحلي اكتر|اعمل ايه طيب|طب اعمل ايه|يعني اعمل ايه|what else|tell me more|and what about)/.test(
      x
    )
  ) {
    aspects.push('more_details');
  }

  return aspects;
}

/**
 * Formats commercial products in Egypt for a given active ingredient ID.
 */
function formatEgyptianBrandsForMed(medId: string): string {
  const prods = EGYPTIAN_COMMERCIAL_PRODUCTS.filter((p) => p.activeIngredientId === medId).slice(0, 5);
  if (prods.length === 0) return '';
  return prods
    .map(
      (p) =>
        `• ${p.tradeNameAr} (${p.tradeNameEn}) — التركيز: ${p.strength} — السعر التقريبي: ${p.priceEgp} ج.م (${p.packUnitAr})`
    )
    .join('\n');
}

/**
 * Fast (<10ms), deeply contextual Egyptian Colloquial Conversational Engine that answers:
 * 1) Any condition question (e.g., "ودني بتوجعني وعايز حاجة")
 * 2) Any medicine question (e.g., "أوجمنتين بكام وجرعته إيه؟")
 * 3) Any follow-up question across conversation turns (e.g., "طب إيه أحسن؟", "طب بكام؟", "طب جرعته إيه؟", "آخد معاه مسكن إيه؟", "إيه البديل؟")
 * using ALL data in the platform (`meds`, `EGYPTIAN_COMMERCIAL_PRODUCTS`, `CONDITIONS`, `PERSONAL`, `profile`).
 */
export function generateContextualSiteReply(params: {
  userText: string;
  msgs: EnhancedChatUiMessage[];
  meds: Medicine[];
  profile: UserHealthProfile;
  lang: Lang;
  localReply: Reply;
}): {
  handledFast: boolean;
  replyText: string;
  links?: ReplyLink[];
  topicMemory: ConversationTopicMemory;
} {
  const { userText, msgs, profile, lang, localReply } = params;
  const meds = params.meds && params.meds.length > 0 ? params.meds : getSeedMedicinesFallback();
  const x = norm(userText);
  const topicMemory = extractConversationTopicMemory(msgs, meds, lang);

  // Check if the current message introduces a new condition or new medicine(s)
  const currentCondition = matchConditionEnhanced(x);
  const currentMeds = findMeds(meds, userText);
  const currentPersonal = personalKind(x);
  const followUpAspects = detectFollowUpAspects(userText);

  const activeCondition = currentCondition || topicMemory.lastCondition;
  const activeMeds: Medicine[] =
    currentMeds.length > 0
      ? currentMeds
      : currentCondition
        ? (CONDITION_DEFAULT_MED_IDS[currentCondition] || [])
            .map((id) => meds.find((m) => m.id === id))
            .filter((m): m is Medicine => Boolean(m))
        : topicMemory.lastMedicines;

  const links: ReplyLink[] = activeMeds.map((m) => ({
    to: `/medicine/${m.id}`,
    label: {
      ar: `صفحة ${m.genericName.ar || m.genericName.en}`,
      en: `${m.genericName.en || m.genericName.ar} page`,
    },
  }));

  // Check if patient has any recorded allergies that conflict with activeMeds
  const allergyAlertsAr: string[] = [];
  for (const m of activeMeds) {
    const check = checkDrugAllergySafety(m.genericName.en || m.genericName.ar, profile.allergies);
    if (check.matchLevel === 'exact_match' || check.matchLevel === 'cross_reactivity') {
      allergyAlertsAr.push(
        `🚨 تنبيه خاص بملفك الصحي: إنت مسجل عندك حساسية من (${check.matchedAllergy?.drugName || 'البنسلين'})، عشان كده مينفعش تاخد «${m.genericName.ar}» وخليك في البدايل الآمنة التانية بعد مراجعة الدكتور!`
      );
    }
  }

  // CASE 1: User is asking a follow-up question (or multi-part question) tied to the current or previous turn!
  const isFollowUpOnPriorTurn =
    !currentCondition &&
    currentMeds.length === 0 &&
    followUpAspects.length > 0 &&
    (Boolean(topicMemory.lastCondition) || topicMemory.lastMedicines.length > 0);

  const isMultiAspectOnCurrentTurn =
    (Boolean(currentCondition) || currentMeds.length > 0) && followUpAspects.length > 0;

  if (isFollowUpOnPriorTurn || isMultiAspectOnCurrentTurn) {
    if (lang !== 'ar') {
      // English contextual synthesis
      const sectionsEn: string[] = [];
      if (activeCondition) {
        sectionsEn.push(
          `Regarding ${activeCondition.toUpperCase()} and the medications we discussed (${activeMeds.map((m) => m.genericName.en).join(', ')}):`
        );
      }
      for (const m of activeMeds.slice(0, 3)) {
        if (followUpAspects.includes('best_choice') || followUpAspects.includes('more_details')) {
          sectionsEn.push(`• ${m.genericName.en} (Uses): ${m.approvedUses.en}`);
        }
        if (followUpAspects.includes('dose')) {
          sectionsEn.push(`• ${m.genericName.en} (Dosing): ${m.dosingReference.en}`);
        }
        if (followUpAspects.includes('price')) {
          sectionsEn.push(`• ${m.genericName.en} (Price in Egypt): ${m.priceEgypt.en}`);
        }
        if (followUpAspects.includes('substitutes')) {
          sectionsEn.push(`• ${m.genericName.en} (Alternatives): ${m.substitutes.en}`);
        }
        if (followUpAspects.includes('side_effects')) {
          sectionsEn.push(`• ${m.genericName.en} (Side Effects): ${m.sideEffects.en}`);
        }
        if (followUpAspects.includes('interactions')) {
          sectionsEn.push(`• ${m.genericName.en} (Interactions): ${m.interactions.en}`);
        }
        if (followUpAspects.includes('pregnancy_child')) {
          sectionsEn.push(`• ${m.genericName.en} (Pregnancy & Contraindications): ${m.pregnancyBreastfeeding.en}`);
        }
      }
      if (sectionsEn.length > 0) {
        return {
          handledFast: true,
          replyText: sectionsEn.join('\n\n'),
          links,
          topicMemory: { ...topicMemory, lastCondition: activeCondition, lastMedicines: activeMeds },
        };
      }
    }

    // Egyptian Colloquial Arabic multi-aspect / follow-up synthesis!
    const sectionsAr: string[] = [];
    const medNamesAr = activeMeds.map((m) => m.genericName.ar || m.genericName.en).join('، و');

    if (activeCondition) {
      sectionsAr.push(
        `بص يا سيدي، تكملة لكلامنا عن «${CONDITION_NAMES_AR[activeCondition]}» والأدوية اللي اتكلمنا عنها (${medNamesAr || 'المضادات المعتمدة'}):`
      );
    } else if (activeMeds.length > 0) {
      sectionsAr.push(`بالنسبة لـ «${medNamesAr}» اللي سألتني عليه، دي كل التفاصيل من قاعدة بياناتنا:`);
    }

    if (followUpAspects.includes('best_choice')) {
      if (activeCondition && CONDITION_BEST_COMPARISON_AR[activeCondition]) {
        sectionsAr.push(
          `أنهي أحسن واحد فيهم لحالتك؟\n${CONDITION_BEST_COMPARISON_AR[activeCondition]}`
        );
      } else if (activeMeds.length > 0) {
        const compLines = activeMeds
          .slice(0, 3)
          .map(
            (m, idx) =>
              `${idx + 1}. ${m.genericName.ar}: ${toEgyptianColloquial(m.approvedUses.ar)}`
          );
        sectionsAr.push(`المقارنة بينهم وإمتى بنستخدم كل واحد:\n${compLines.join('\n')}`);
      }
    }

    if (followUpAspects.includes('pain_relief') && activeCondition) {
      sectionsAr.push(
        `طب تاخد إيه يريح الوجع والأعراض معاه؟\n${CONDITION_PAIN_AND_CARE_AR[activeCondition]}`
      );
    } else if (followUpAspects.includes('pain_relief')) {
      sectionsAr.push(
        `لتسكين الألم والحرارة بأمان جنب العلاج:\n• تقدر تستخدم «باراسيتامول» (بنادول / سيتال / أبيمول) كآمن مسكن للمعدة والكلى.\n• أو مضاد التهاب زي «إيبوبروفين / بروفين» بعد الأكل لو مفيش عندك قرحة معدة أو حساسية صدر أو مشاكل في الكلى.`
      );
    }

    if (followUpAspects.includes('dose')) {
      const doseLines = activeMeds.slice(0, 3).map((m) => {
        return `• ${m.genericName.ar}: ${toEgyptianColloquial(m.dosingReference.ar)}`;
      });
      if (doseLines.length > 0) {
        sectionsAr.push(`الجرعات المعتادة ومواعيدها:\n${doseLines.join('\n')}`);
      }
    }

    if (followUpAspects.includes('price')) {
      const priceLines = activeMeds.slice(0, 3).map((m) => {
        const brands = formatEgyptianBrandsForMed(m.id);
        return `• ${m.genericName.ar}: ${m.priceEgypt.ar}${brands ? `\nأشهر الأصناف في الصيدليات المصرية:\n${brands}` : ''}`;
      });
      if (priceLines.length > 0) {
        sectionsAr.push(`الأسعار التقريبية في مصر:\n${priceLines.join('\n\n')}`);
      }
    }

    if (followUpAspects.includes('substitutes')) {
      const subLines = activeMeds.slice(0, 3).map((m) => {
        const brands = formatEgyptianBrandsForMed(m.id);
        return `• بدايل ومثائل ${m.genericName.ar}: ${toEgyptianColloquial(m.substitutes.ar)}${brands ? `\n${brands}` : ''}`;
      });
      if (subLines.length > 0) {
        sectionsAr.push(`البدايل والمثائل المتوفرة في الصيدلية:\n${subLines.join('\n\n')}`);
      }
    }

    if (followUpAspects.includes('side_effects')) {
      const sideLines = activeMeds.slice(0, 3).map((m) => {
        return `• ${m.genericName.ar}: ${toEgyptianColloquial(m.sideEffects.ar)}`;
      });
      if (sideLines.length > 0) {
        sectionsAr.push(`الأعراض الجانبية وإزاي تتجنبها:\n${sideLines.join('\n')}`);
      }
    }

    if (followUpAspects.includes('interactions')) {
      const intLines = activeMeds.slice(0, 3).map((m) => {
        return `• ${m.genericName.ar}: ${toEgyptianColloquial(m.interactions.ar)}`;
      });
      if (intLines.length > 0) {
        sectionsAr.push(`التداخلات مع الأكل واللبن والأدوية التانية:\n${intLines.join('\n')}`);
      }
    }

    if (followUpAspects.includes('pregnancy_child')) {
      const pregLines = activeMeds.slice(0, 3).map((m) => {
        return `• ${m.genericName.ar}:\n- الحمل والرضاعة: ${toEgyptianColloquial(m.pregnancyBreastfeeding.ar)}\n- موانع الاستعمال: ${toEgyptianColloquial(m.contraindications.ar)}`;
      });
      if (pregLines.length > 0) {
        sectionsAr.push(`الأمان في الحمل والرضاعة وموانع الاستعمال:\n${pregLines.join('\n\n')}`);
      }
    }

    if (followUpAspects.includes('more_details')) {
      if (activeCondition && CONDITION_PAIN_AND_CARE_AR[activeCondition]) {
        sectionsAr.push(`نصايح عملية تريحك بسرعة:\n${CONDITION_PAIN_AND_CARE_AR[activeCondition]}`);
      }
      for (const m of activeMeds.slice(0, 2)) {
        sectionsAr.push(
          `• نصايح مهمة عند استخدام ${m.genericName.ar}: ${toEgyptianColloquial(m.patientEducation.ar)}`
        );
      }
    }

    if (allergyAlertsAr.length > 0) {
      sectionsAr.push(allergyAlertsAr.join('\n'));
    }

    sectionsAr.push(
      'لو حابب تسألني عن أي تفصيلة تانية فيهم (زي السعر، الجرعة، البدايل، أو لو عايزني أظبطلك منبه بمواعيد الدوا ده) قولي فوراً وأنا معاك!'
    );

    if (sectionsAr.length > 1) {
      return {
        handledFast: true,
        replyText: sectionsAr.join('\n\n'),
        links,
        topicMemory: { ...topicMemory, lastCondition: activeCondition, lastMedicines: activeMeds },
      };
    }
  }

  // CASE 2: Direct Condition Match on current turn (e.g., "ودني بتوجعني وعايز حاجة")
  if (currentCondition && lang === 'ar') {
    const condData = CONDITIONS[currentCondition];
    const partsAr: string[] = [
      `ألف سلامة عليك من ${CONDITION_NAMES_AR[currentCondition]}! بص يا سيدي، هقولك على الحاجات اللي تريحك فوراً والمضادات الحيوية المعتمدة علمياً للحالة دي:`,
      toEgyptianColloquial(condData.text.ar),
      `طب تعمل إيه يريح الوجع دلوقتي؟\n${CONDITION_PAIN_AND_CARE_AR[currentCondition]}`,
    ];
    if (allergyAlertsAr.length > 0) {
      partsAr.push(allergyAlertsAr.join('\n'));
    }
    partsAr.push(
      '💬 تقدر تسألني دلوقتي: «إيه أحسن واحد فيهم؟» أو «بكام سعره في الصيدلية؟» أو «جرعته كل كام ساعة؟» وهكمل معاك على طول!'
    );

    return {
      handledFast: true,
      replyText: partsAr.join('\n\n'),
      links: condData.links || links,
      topicMemory: {
        ...topicMemory,
        lastCondition: currentCondition,
        lastMedicines: activeMeds,
      },
    };
  }

  // CASE 3: Direct Medicine Match on current turn (e.g., "كلمني عن أوجمنتين")
  if (currentMeds.length > 0 && lang === 'ar') {
    const m = currentMeds[0];
    const brands = formatEgyptianBrandsForMed(m.id);
    const partsAr: string[] = [
      `من عنيا! دي كل المعلومات المعتمدة عن «${m.genericName.ar} (${m.genericName.en})» بطريقة مبسطة:`,
      `• بيستخدم لإيه؟ ${toEgyptianColloquial(m.approvedUses.ar)}`,
      `• الجرعة المعتادة: ${toEgyptianColloquial(m.dosingReference.ar)}`,
      `• السعر والبدايل في مصر: ${m.priceEgypt.ar}${brands ? `\n${brands}` : ''}`,
      `• أهم النصايح والأعراض الجانبية: ${toEgyptianColloquial(m.patientEducation.ar)}`,
    ];
    if (allergyAlertsAr.length > 0) {
      partsAr.push(allergyAlertsAr.join('\n'));
    }
    partsAr.push(
      '💬 تحب تعرف تداخلاته مع الأكل واللبن، أو مدى أمانه في الحمل والأطفال، ولا تحب أظبطلك منبه لمواعيد جرعاته؟'
    );

    return {
      handledFast: true,
      replyText: partsAr.join('\n\n'),
      links,
      topicMemory: {
        ...topicMemory,
        lastMedicines: currentMeds,
      },
    };
  }

  // CASE 4: Direct Personal Advice Match (e.g., حقنة البرد، نسيان الجرعة، اللبن والمضاد)
  if (currentPersonal && lang === 'ar') {
    const pData = PERSONAL[currentPersonal];
    const replyAr = `بص يا سيدي، بخصوص سؤالك:\n\n${toEgyptianColloquial(pData.text.ar)}\n\nلو عندك أي سؤال تاني أو عايز تعرف تفاصيل عن دوا معين قولي وأنا معاك!`;
    return {
      handledFast: true,
      replyText: replyAr,
      links: pData.links,
      topicMemory: {
        ...topicMemory,
        lastPersonalKind: currentPersonal,
      },
    };
  }

  // CASE 5: Direct verified passage match from articles/myths
  if (localReply.kind === 'answer' && lang === 'ar') {
    const passageText = localReply.hits
      .map((h) => `• ${pick(h.title, 'ar')}:\n${toEgyptianColloquial(pick(h.text, 'ar'))}`)
      .join('\n\n');
    const hitLinks = localReply.hits
      .filter((h) => Boolean(h.link))
      .map((h) => ({ to: h.link || '/', label: h.title }));
    return {
      handledFast: true,
      replyText: `بص يا سيدي، دي الخلاصة العلمية الموثقة بخصوص سؤالك:\n\n${passageText}\n\nلو تحب تسأل عن أي تفصيلة تانية أنا معاك!`,
      links: hitLinks,
      topicMemory,
    };
  }

  return {
    handledFast: false,
    replyText: '',
    links: undefined,
    topicMemory,
  };
}

/**
 * Builds a concise, privacy-scoped summary of the authenticated patient's permitted health context
 * AND grounds the AI with both the active multi-turn conversation topic and all relevant site database records.
 */
export function buildPermittedPatientContextPrompt(params: {
  profile: UserHealthProfile;
  schedules: TreatmentSchedule[];
  prescriptions: SavedPrescription[];
  lang: Lang;
  localVerifiedReply?: Reply | null;
  topicMemory?: ConversationTopicMemory;
}): string {
  const { profile, schedules, prescriptions, lang, localVerifiedReply, topicMemory } = params;
  const allergies = profile.allergies.map((a) => `${a.drugName} (${a.severity})`).join('، ');
  const chronics = (profile.chronicConditions || []).map((c) => c.conditionName).join('، ');
  const activeMeds = profile.medications
    .filter((m) => m.status === 'active')
    .map((m) => `${m.drugName} ${m.prescribedDose}`.trim())
    .join('، ');
  const activeSchedules = schedules
    .map((s) => `${s.medicineName} (${s.prescribedDose} في مواعيد ${s.doseTimes.join(' و ')})`)
    .join('، ');

  let clinicalGrounding = '';
  if (localVerifiedReply) {
    if (localVerifiedReply.kind === 'answer') {
      clinicalGrounding = localVerifiedReply.hits
        .map((h) => `${pick(h.title, lang)}: ${pick(h.text, lang)}`)
        .join('\n')
        .slice(0, 700);
    } else if (localVerifiedReply.kind === 'text') {
      clinicalGrounding = pick(localVerifiedReply.text, lang).slice(0, 700);
    }
  }

  const parts: string[] = [];

  parts.push(
    `[بيانات الملف الصحي للمريض الحالي:`,
    `- الاسم: ${profile.displayName || 'غير مسجل'} | السن: ${profile.age || 'غير مسجل'} | الوزن: ${profile.weightKg ? `${profile.weightKg} كجم` : 'غير مسجل'} | فصيلة الدم: ${profile.bloodType || 'غير مسجلة'}`,
    `- الحساسية الدوائية المسجلة: ${allergies || 'لا توجد حساسية مسجلة'}`,
    `- الأمراض المزمنة: ${chronics || 'لا توجد أمراض مزمنة مسجلة'}`,
    `- الأدوية الحالية: ${activeMeds || 'لا توجد أدوية حالية'}`,
    `- منبهات الجرعات الشغالة: ${activeSchedules || 'لا توجد منبهات شغالة'}`,
    `- عدد الروشتات المحفوظة: ${prescriptions.length}]`
  );

  if (topicMemory && (topicMemory.lastCondition || topicMemory.lastMedicines.length > 0)) {
    const condLabel = topicMemory.lastCondition
      ? CONDITION_NAMES_AR[topicMemory.lastCondition]
      : 'غير محدد';
    const medDetails = topicMemory.lastMedicines
      .map(
        (m) =>
          `• ${m.genericName.ar} (${m.genericName.en}): الاستعمال: ${m.approvedUses.ar} | الجرعة: ${m.dosingReference.ar} | السعر في مصر: ${m.priceEgypt.ar} | البدايل: ${m.substitutes.ar} | الآثار الجانبية: ${m.sideEffects.ar}`
      )
      .join('\n');

    parts.push(
      `[سياق المحادثة السابقة من قاعدة بيانات الموقع (اربط سؤال المستخدم الحالي بهذا السياق لو كان سؤال متابعة مثل "إيه أحسن؟" أو "بكام؟" أو "جرعته إيه؟"):`,
      `- الحالة الصحية التي نتحدث عنها: ${condLabel}`,
      ...(medDetails ? [`- الأدوية المطروحة في الحوار من قاعدة بياناتنا:\n${medDetails}`] : []),
      `]`
    );
  }

  if (clinicalGrounding) {
    parts.push(
      `[معلومات طبية موثقة من قاعدة بيانات المنصة للاستعانة بها في الرد (اشرحها للمريض بالعامية المصرية الودودة لو سؤاله بالعربي):`,
      `${clinicalGrounding}]`
    );
  }

  return parts.join('\n');
}

/**
 * Converts formal Arabic medical text into warm Egyptian Colloquial Arabic for offline fallback.
 */
export function toEgyptianColloquial(formalText: string): string {
  if (!formalText) return '';
  return formalText
    .replace(/أفضل وأشهر المضادات الحيوية المستخدمة علمياً كخط أول لعلاج/g, 'أشهر وأحسن المضادات الحيوية اللي الدكاترة بيكتبوها كخط أول لعلاج')
    .replace(/أفضل المضادات الحيوية لعلاج/g, 'أحسن المضادات الحيوية لعلاج')
    .replace(/أفضل المضادات الحيوية المستخدمة لعلاج/g, 'أحسن المضادات الحيوية اللي بتعالج')
    .replace(/المضادات الحيوية لالتهاب الأذن الوسطى الحاد:/g, 'أشهر المضادات الحيوية لالتهاب ووجع الأذن الوسطى:')
    .replace(/يعد الخيار الأول والشائع جداً، لأن/g, 'ده الاختيار الأول والأشهر، عشان')
    .replace(/الخيار الأول لعلاج/g, 'ده الاختيار الأول والأقوى لعلاج')
    .replace(/الخيار الأول الموصى به عالمياً لعلاج/g, 'ده الاختيار الأول عالمياً لعلاج')
    .replace(/يستخدمان كبديل ممتاز وفعال للأشخاص الذين يعانون من/g, 'بديل ممتاز جداً لو عندك')
    .replace(/يستخدمان كبديل لمن لديهم/g, 'بديل ممتاز لو عندك')
    .replace(/بدائل معتمدة في حال وجود/g, 'بدايل ممتازة وآمنة لو عندك')
    .replace(/لا يجب/g, 'مينفعش')
    .replace(/يجب عليك/g, 'لازم')
    .replace(/يجب فحص/g, 'مهم جداً دكتور يفحص')
    .replace(/ينبغي/g, 'الأفضل')
    .replace(/هل ترغب في/g, 'تحب')
    .replace(/يرجى/g, 'يا ريت')
    .replace(/استشر الطبيب أو الصيدلي/g, 'ترجع للدكتور أو الصيدلي بتاعك')
    .replace(/مراجعة الطبيب أو الصيدلي/g, 'مراجعة الدكتور أو الصيدلي')
    .replace(/المضادات الحيوية لا تعالج/g, 'المضادات الحيوية مش بتعالج')
    .replace(/لا تعالج/g, 'مش بتعالج')
    .replace(/لا تضع أي قطرات في الأذن دون فحص/g, 'أوعى تحط أي نقط في ودنك من غير فحص')
    .replace(/بسبب/g, 'عشان')
    .replace(/لأنها/g, 'عشان هي')
    .replace(/لأنه/g, 'عشان هو')
    .replace(/عند الشعور بتحسن/g, 'أول ما تحس إنك بقيت أحسن')
    .replace(/إيقاف المضاد الحيوي/g, 'إنك توقف المضاد الحيوي')
    .replace(/ماذا أفعل/g, 'أعمل إيه');
}

/**
 * Returns context-aware quick-action chips in natural Egyptian Colloquial Arabic or English.
 */
export function getSmartAssistantActionChips(lang: Lang): Array<{
  label: string;
  prompt: string;
  isUploadTrigger?: boolean;
}> {
  if (lang === 'ar') {
    return [
      { label: '📸 صور أو ارفع روشتة / تحليل', prompt: '__UPLOAD_DOCUMENT__', isUploadTrigger: true },
      { label: '📋 لخصلي ملفي الصحي', prompt: 'لخصلي ملفي الصحي وسجلاتي' },
      { label: '💊 إيه الأدوية اللي ماشي عليها؟', prompt: 'وريني أدويتي الحالية' },
      { label: '🛡️ إيه الحساسية المتسجلة عندي؟', prompt: 'وريني حساسياتي المتسجلة' },
      { label: '⏰ مواعيد جرعاتي ومنبهاتي', prompt: 'وريني منبهات الأدوية ومواعيد جرعاتي' },
      { label: '➕ سجل حساسية بنسلين', prompt: 'عندي حساسية من البنسلين ضيفها في ملفي' },
      { label: '🏥 سجل إن عندي سكر', prompt: 'عندي سكر ضيفه في ملفي الصحي' },
      { label: '🔔 ظبط منبه أوجمنتين 8 ص و 8 م', prompt: 'فكرني آخد أوجمنتين 1 جرام الساعة 8 الصبح و 8 بالليل' },
    ];
  }

  return [
    { label: '📸 Upload Prescription / Lab', prompt: '__UPLOAD_DOCUMENT__', isUploadTrigger: true },
    { label: '📋 Summarize Health Records', prompt: 'Summarize my health records' },
    { label: '💊 Show Current Medications', prompt: 'Show me my current medications' },
    { label: '🛡️ Show My Allergies', prompt: 'Show me my current allergies' },
    { label: '⏰ My Medication Reminders', prompt: 'Show me my medication reminders' },
    { label: '➕ Add Penicillin Allergy', prompt: 'Add my penicillin allergy' },
    { label: '🏥 Add Diabetes to Profile', prompt: 'Add diabetes to my health profile' },
    { label: '🔔 Remind 8 AM & 8 PM', prompt: 'Remind me to take Augmentin 1g at 8 AM and 8 PM' },
  ];
}
