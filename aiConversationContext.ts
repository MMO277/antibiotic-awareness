/**
 * aiConversationContext.ts
 *
 * Shared Conversation State, Synchronized Action Proposals, Clinical Grounding,
 * and Egyptian Colloquial Arabic Context Builder for `ChatWidget.tsx` and `Assistant.tsx`.
 */

import { useEffect, useState, useCallback } from 'react';
import { ChatUiMessage, Reply } from './assistantLogic';
import { PendingAiActionProposal } from './aiActionExecutor';
import { UserHealthProfile } from './allergyData';
import { SavedPrescription, TreatmentSchedule } from './trackerData';
import { Lang, pick } from './types';
import type { Link as ReplyLink } from './assistantReplies';

export interface EnhancedChatUiMessage extends ChatUiMessage {
  id: string;
  attachmentPreviewUrl?: string;
  attachmentFileName?: string;
  actionProposal?: PendingAiActionProposal;
  isSystemActionResult?: boolean;
  actionResultSuccess?: boolean;
  links?: ReplyLink[];
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

/**
 * Builds a concise, privacy-scoped summary of the authenticated patient's permitted health context
 * AND grounds the AI with any verified clinical protocol matched locally.
 */
export function buildPermittedPatientContextPrompt(params: {
  profile: UserHealthProfile;
  schedules: TreatmentSchedule[];
  prescriptions: SavedPrescription[];
  lang: Lang;
  localVerifiedReply?: Reply | null;
}): string {
  const { profile, schedules, prescriptions, lang, localVerifiedReply } = params;
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
    .replace(/لا يجب/g, 'مينفعش')
    .replace(/يجب عليك/g, 'لازم')
    .replace(/ينبغي/g, 'الأفضل')
    .replace(/هل ترغب في/g, 'تحب')
    .replace(/يرجى/g, 'يا ريت')
    .replace(/استشر الطبيب أو الصيدلي/g, 'ترجع للدكتور أو الصيدلي بتاعك')
    .replace(/مراجعة الطبيب أو الصيدلي/g, 'مراجعة الدكتور أو الصيدلي')
    .replace(/المضادات الحيوية لا تعالج/g, 'المضادات الحيوية مش بتعالج')
    .replace(/لا تعالج/g, 'مش بتعالج')
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
