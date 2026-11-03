/**
 * aiConversationContext.ts
 *
 * Shared Conversation State, Synchronized Action Proposals, and Permitted Patient Context
 * Builder for both `ChatWidget.tsx` (floating assistant) and `Assistant.tsx` (full-page view).
 *
 * Ensures that if a patient starts a conversation or uploads a prescription in the floating
 * ChatWidget and clicks "Expand to full page" (`/assistant`), their messages, pending
 * confirmation cards, and context remain 100% synchronized in real time.
 */

import { useEffect, useState, useCallback } from 'react';
import { ChatUiMessage } from './assistantLogic';
import { PendingAiActionProposal } from './aiActionExecutor';
import { UserHealthProfile } from './allergyData';
import { SavedPrescription, TreatmentSchedule } from './trackerData';
import { Lang } from './types';

export interface EnhancedChatUiMessage extends ChatUiMessage {
  id: string;
  attachmentPreviewUrl?: string;
  attachmentFileName?: string;
  actionProposal?: PendingAiActionProposal;
  isSystemActionResult?: boolean;
  actionResultSuccess?: boolean;
}

const CONVERSATION_SYNC_EVENT = 'aa-ai-conversation-sync';

// Module-level shared store scoped by current session UID so switching between ChatWidget and Assistant page is seamless
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
    // Clear in-memory conversation when user switches accounts or logs out for strict privacy
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
 * to pass to Gemini when answering personalized medical questions (e.g., "Can I take Augmentin?" -> knows patient has Penicillin allergy!).
 */
export function buildPermittedPatientContextPrompt(params: {
  profile: UserHealthProfile;
  schedules: TreatmentSchedule[];
  prescriptions: SavedPrescription[];
  lang: Lang;
}): string {
  const { profile, schedules, prescriptions } = params;
  const allergies = profile.allergies.map((a) => `${a.drugName} (${a.severity})`).join(', ');
  const chronics = (profile.chronicConditions || []).map((c) => c.conditionName).join(', ');
  const activeMeds = profile.medications
    .filter((m) => m.status === 'active')
    .map((m) => `${m.drugName} ${m.prescribedDose}`.trim())
    .join(', ');
  const activeSchedules = schedules
    .map((s) => `${s.medicineName} (${s.prescribedDose} at ${s.doseTimes.join('/')})`)
    .join(', ');

  if (!allergies && !chronics && !activeMeds && !activeSchedules && !profile.age && !profile.weightKg) {
    return '';
  }

  return [
    `\n[بيانات الملف الصحي للمريض الحالي (للإرشاد الآمن فقط - لا تخترع أي بيانات غير مذكورة):`,
    profile.age ? `- العمر: ${profile.age}` : '',
    profile.weightKg ? `- الوزن: ${profile.weightKg} كجم` : '',
    allergies ? `- الحساسية الدوائية المسجلة: ${allergies} (حذر المريض فوراً إذا سأل عن دواء يتعارض معها!)` : '- الحساسية الدوائية: لا توجد حساسية مسجلة',
    chronics ? `- الحالات الصحية المزمنة (أبلغ عنها المريض): ${chronics}` : '',
    activeMeds ? `- الأدوية الحالية: ${activeMeds}` : '',
    activeSchedules ? `- جداول الجرعات النشطة: ${activeSchedules}` : '',
    `عدد الروشتات المحفوظة: ${prescriptions.length}]`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Returns context-aware quick-action chips tailored to the patient's current state and language.
 */
export function getSmartAssistantActionChips(lang: Lang): Array<{
  label: string;
  prompt: string;
  isUploadTrigger?: boolean;
}> {
  if (lang === 'ar') {
    return [
      { label: '📸 رفع روشتة أو تحليل', prompt: '__UPLOAD_DOCUMENT__', isUploadTrigger: true },
      { label: '📋 ملخص ملفي الصحي', prompt: 'لخص ملفي الصحي وسجلاتي' },
      { label: '💊 اعرض أدويتي الحالية', prompt: 'اعرض أدويتي الحالية' },
      { label: '🛡️ اعرض سجل حساسيتي', prompt: 'اعرض حساسياتي المسجلة' },
      { label: '⏰ مواعيد جرعاتي وتذكيراتي', prompt: 'اعرض تذكيراتي ومواعيد جرعاتي' },
      { label: '➕ إضافة حساسية بنسلين', prompt: 'أضف حساسية البنسلين إلى ملفي الصحي' },
      { label: '🏥 إضافة مرض السكري لملفي', prompt: 'أضف مرض السكري إلى ملفي الصحي' },
      { label: '🔔 تذكير جرعة 8 ص و 8 م', prompt: 'فكرني آخد أوجمنتين 1 جرام الساعة 8 صباحاً و 8 مساءً' },
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
