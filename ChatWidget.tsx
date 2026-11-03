import { pick, tr } from './types';
import { useEmergencyLocation, pickCountryName } from './emergencyLocation';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { useApproved } from './medicinesApi';
import { useSyncedHealthProfile } from './allergyData';
import { useSyncedSchedules } from './trackerData';
import {
  buildPassages,
  classify,
  respond,
  extractAnswerPlainText,
  isDirectVerifiedMatch,
} from './assistantLogic';
import { askGemini, ChatMessage, cleanAssistantMarkdown, isCustomApiKey } from './geminiApi';
import {
  isVoiceRecognitionSupported,
  speakText,
  startVoiceRecognition,
  stopSpeech,
  VoiceRecognitionHandle,
} from './speechService';
import {
  detectPatientActionIntent,
  extractAiToolCallFromResponse,
  DetectedActionIntent,
} from './aiActionRegistry';
import {
  applyEditedFieldsToProposal,
  createPendingActionProposal,
  executeConfirmedAiAction,
  executeReadOnlyAiAction,
} from './aiActionExecutor';
import {
  analyzeUploadedMedicalDocument,
  compressMedicalImageFile,
  validateMedicalUploadFile,
} from './aiDocumentProcessor';
import {
  buildPermittedPatientContextPrompt,
  EnhancedChatUiMessage,
  generateContextualSiteReply,
  getSmartAssistantActionChips,
  toEgyptianColloquial,
  useSyncedAiConversation,
} from './aiConversationContext';
import AiActionConfirmationCard from './AiActionConfirmationCard';

const WIDGET_CHIPS: Record<string, string[]> = {
  ar: [
    'هو المضاد الحيوي بيعالج البرد؟',
    'إيه خطورة حقنة البرد الشعبية؟',
    'إيه أحسن مضاد حيوي لوجع الضرس؟',
    'أعمل إيه لو نسيت ميعاد الجرعة؟',
    'هو اللبن بيبطل مفعول المضاد الحيوي؟',
  ],
  en: [
    'Do antibiotics treat colds?',
    'Dangers of cold shot mixtures?',
    'Best antibiotic for dental pain?',
    'What if I miss a dose?',
    'Does milk interact with antibiotics?',
  ],
  de: [
    'Helfen Antibiotika bei Erkältung?',
    'Gefahren von Erkältungsspritzen-Mischungen?',
    'Antibiotika bei Zahnschmerzen?',
    'Was tun bei vergessener Dosis?',
    'Wechselwirkung zwischen Milch und Antibiotika?',
  ],
  fr: [
    'Les antibiotiques soignent-ils le rhume ?',
    'Dangers des injections contre le rhume ?',
    'Antibiotique et douleur dentaire ?',
    'Que faire en cas d’oubli de dose ?',
    'Le lait bloque-t-il l’antibiotique ?',
  ],
  es: [
    '¿Los antibióticos curan el resfriado?',
    '¿Peligros de la inyección para el resfriado?',
    '¿Antibiótico para el dolor dental?',
    '¿Qué hacer si olvido una dosis?',
    '¿La leche afecta al antibiótico?',
  ],
};

export default function ChatWidget() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const { profile, setProfile } = useSyncedHealthProfile();
  const { schedules, setSchedules, prescriptions, setPrescriptions } = useSyncedSchedules();
  const { emergency, countryName, selectedOverride, setCountryOverride, countriesList } =
    useEmergencyLocation();
  const { items } = useApproved();
  const meds = useMemo(() => items ?? [], [items]);
  const passages = useMemo(() => buildPassages(meds), [meds]);

  const { messages: msgs, setMessages: setMsgs } = useSyncedAiConversation(user?.uid);

  const [isOpen, setIsOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const stopListenRef = useRef<VoiceRecognitionHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const smartActionChips = useMemo(() => getSmartAssistantActionChips(lang), [lang]);

  useEffect(() => {
    const onGaming = (e: Event) => {
      if ((e as CustomEvent<{ active: boolean }>).detail?.active) {
        stopSpeech();
        stopListenRef.current?.stop();
        stopListenRef.current = null;
        setListening(false);
        setIsOpen(false);
        setSosOpen(false);
      }
    };
    window.addEventListener('bh:gaming-mode', onGaming);
    return () => window.removeEventListener('bh:gaming-mode', onGaming);
  }, []);

  useEffect(() => {
    return () => {
      stopSpeech();
      stopListenRef.current?.stop();
      stopListenRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [msgs, loading, uploadProgress, isOpen]);

  function dispatchDetectedAction(
    actionIntent: DetectedActionIntent,
    date: string,
    speakReply: boolean,
    customLeadText?: string
  ): boolean {
    if (!actionIntent.matched) return false;

    if (actionIntent.safetyRefusal) {
      const refusalText = isAr
        ? actionIntent.safetyRefusal.messageAr
        : actionIntent.safetyRefusal.messageEn;
      setMsgs((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-refusal`,
          who: 'bot',
          text: refusalText,
          date,
          isAi: true,
        },
      ]);
      setLoading(false);
      if (speakReply) speakText(refusalText, lang);
      return true;
    }

    if (actionIntent.needsClarification) {
      const clarifyText = isAr
        ? actionIntent.clarificationQuestionAr || 'قولي بس التفاصيل الناقصة وأنا أعملهالك فوراً.'
        : actionIntent.clarificationQuestionEn || 'Please clarify the required details.';
      setMsgs((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-clarify`,
          who: 'bot',
          text: clarifyText,
          date,
          isAi: true,
        },
      ]);
      setLoading(false);
      if (speakReply) speakText(clarifyText, lang);
      return true;
    }

    if (actionIntent.actionType && actionIntent.riskLevel === 'read_only') {
      const readResult = executeReadOnlyAiAction({
        actionType: actionIntent.actionType,
        authenticatedUid: user?.uid,
        profile,
        schedules,
        prescriptions,
        lang,
      });
      const replyText = isAr ? readResult.messageAr : readResult.messageEn;
      setMsgs((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-read`,
          who: 'bot',
          text: replyText,
          date,
          isAi: true,
          isSystemActionResult: true,
          actionResultSuccess: readResult.success,
        },
      ]);
      setLoading(false);
      if (speakReply) speakText(replyText, lang);
      return true;
    }

    if (actionIntent.actionType && actionIntent.args) {
      const proposal = createPendingActionProposal({
        actionType: actionIntent.actionType,
        args: actionIntent.args,
        profile,
        schedules,
        prescriptions,
      });
      const leadText =
        customLeadText ||
        (isAr
          ? actionIntent.conversationalLeadAr ||
            'من عنيا ليك! جهزتلك الطلب ده عشان تراجعه، بص عليه ودوس «أيوه، أكد واحفظ» عشان يتسجل في ملفك:'
          : actionIntent.conversationalLeadEn ||
            'I have prepared this action for your review. Please verify the details below and click "Confirm and Save":');
      setMsgs((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-proposal`,
          who: 'bot',
          text: leadText,
          date,
          isAi: true,
          actionProposal: proposal,
        },
      ]);
      setLoading(false);
      if (speakReply) speakText(leadText, lang);
      return true;
    }

    return false;
  }

  async function ask(raw: string, speakReply = false) {
    const text = raw.trim().slice(0, 2000);
    if (!text || loading) return;

    if (text === '__UPLOAD_DOCUMENT__') {
      fileInputRef.current?.click();
      return;
    }

    const date = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB');
    const userMsgId = `msg-${Date.now()}-u`;

    setMsgs((m) => [...m, { id: userMsgId, who: 'me', text, date }]);
    setQ('');
    setLoading(true);

    // 1) Check Fast Local Egyptian Colloquial + English Action Engine FIRST
    const lastMedContext =
      prescriptions[0]?.medicineName ||
      schedules[0]?.medicineName ||
      profile.medications[0]?.drugName;
    const actionIntent = detectPatientActionIntent(text, lang, lastMedContext);
    if (actionIntent.matched && dispatchDetectedAction(actionIntent, date, speakReply)) {
      return;
    }

    // 2) Check Immediate Life-Threatening Emergency or Prompt Injection Guard
    const safetyVerdict = classify(text);
    const localReply = respond(passages, meds, text);
    if (safetyVerdict === 'emergency') {
      const botMsg: EnhancedChatUiMessage = {
        id: `msg-${Date.now()}-emerg`,
        who: 'bot',
        reply: localReply,
        date,
        isAi: false,
      };
      setMsgs((m) => [...m, botMsg]);
      setLoading(false);
      if (speakReply) speakText(extractAnswerPlainText(botMsg, lang), lang);
      return;
    }

    // 2.5) Run Instant Multi-Turn Contextual Engine (<10ms) across site data & conversation history
    const contextualResult = generateContextualSiteReply({
      userText: text,
      msgs,
      meds,
      profile,
      lang,
      localReply,
    });

    const matchedLinks =
      contextualResult.links && contextualResult.links.length > 0
        ? contextualResult.links
        : localReply.kind === 'text' && localReply.links
          ? localReply.links
          : localReply.kind === 'answer'
            ? localReply.hits
                .filter((h) => Boolean(h.link))
                .map((h) => ({ to: h.link || '/', label: h.title }))
            : undefined;

    // If our contextual engine matched a medical condition, medicine, or follow-up question from site data,
    // reply IMMEDIATELY (<10ms) unless the user configured a custom Gemini API key!
    if (contextualResult.handledFast && !isCustomApiKey()) {
      const fastMsg: EnhancedChatUiMessage = {
        id: `msg-${Date.now()}-fast`,
        who: 'bot',
        text: contextualResult.replyText,
        date,
        isAi: true,
        ...(matchedLinks && matchedLinks.length > 0 ? { links: matchedLinks } : {}),
      };
      setMsgs((m) => [...m, fastMsg]);
      setLoading(false);
      if (speakReply) speakText(contextualResult.replyText, lang);
      return;
    }

    // 3) Call Conversational AI (speaks Egyptian Colloquial Arabic + can emit [[ACTION_CALL: ...]] for any free-form request!)
    try {
      const history: ChatMessage[] = msgs.map((m) => ({
        who: m.who,
        text: extractAnswerPlainText(m, lang),
      }));
      const patientContext = buildPermittedPatientContextPrompt({
        profile,
        schedules,
        prescriptions,
        lang,
        localVerifiedReply: isDirectVerifiedMatch(localReply) ? localReply : null,
        topicMemory: contextualResult.topicMemory,
      });
      const enrichedQuestion = patientContext ? `${text}\n\n${patientContext}` : text;

      const rawAiResponse = await askGemini(enrichedQuestion, history);
      const { cleanReplyText, detectedIntent } = extractAiToolCallFromResponse(rawAiResponse);

      if (
        detectedIntent &&
        detectedIntent.matched &&
        dispatchDetectedAction(detectedIntent, date, speakReply, cleanReplyText)
      ) {
        return;
      }

      const finalText = cleanReplyText || rawAiResponse;
      const botMsg: EnhancedChatUiMessage = {
        id: `msg-${Date.now()}-ai`,
        who: 'bot',
        text: finalText,
        date,
        isAi: true,
        ...(matchedLinks && matchedLinks.length > 0 ? { links: matchedLinks } : {}),
      };
      setMsgs((m) => [...m, botMsg]);
      setLoading(false);
      if (speakReply) speakText(finalText, lang);
      return;
    } catch (err) {
      console.warn('AI fallback in widget:', err);
    }

    // 4) Offline Fallback (uses contextualResult if available, or converts localReply to Egyptian Colloquial Arabic)
    const fallbackPlain = contextualResult.handledFast
      ? contextualResult.replyText
      : extractAnswerPlainText({ who: 'bot', reply: localReply }, lang);
    const colloquialFallback = isAr ? toEgyptianColloquial(fallbackPlain) : fallbackPlain;
    const botMsg: EnhancedChatUiMessage = {
      id: `msg-${Date.now()}-fallback`,
      who: 'bot',
      text: colloquialFallback,
      date,
      isAi: true,
      ...(matchedLinks && matchedLinks.length > 0 ? { links: matchedLinks } : {}),
    };
    setMsgs((m) => [...m, botMsg]);
    setLoading(false);
    if (speakReply) speakText(colloquialFallback, lang);
  }

  async function handleFileAttachment(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || loading) return;

    const date = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB');
    const validation = validateMedicalUploadFile(file);
    if (!validation.valid) {
      setMsgs((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-file-err`,
          who: 'bot',
          text: isAr ? validation.errorAr : validation.errorEn,
          date,
          isAi: true,
        },
      ]);
      return;
    }

    setLoading(true);
    setUploadProgress(20);

    try {
      const compressed = await compressMedicalImageFile(file);
      setUploadProgress(55);

      setMsgs((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-file-user`,
          who: 'me',
          text: isAr
            ? `📎 رفعت صورة/مستند: ${validation.sanitizedFileName}`
            : `📎 Attached medical document: ${validation.sanitizedFileName}`,
          attachmentPreviewUrl: compressed.previewDataUrl,
          attachmentFileName: validation.sanitizedFileName,
          date,
        },
      ]);

      const analysis = await analyzeUploadedMedicalDocument({
        base64Data: compressed.base64Data,
        previewDataUrl: compressed.previewDataUrl,
        fileName: validation.sanitizedFileName,
        mimeType: compressed.mimeType,
        fileSize: compressed.compressedSize,
        lang,
      });
      setUploadProgress(90);

      const proposal = createPendingActionProposal({
        actionType: 'save_medical_document',
        args: {
          title: analysis.title,
          category: analysis.category,
          fileName: analysis.fileName,
          mimeType: analysis.mimeType,
          fileSize: analysis.fileSize,
          previewDataUrl: analysis.previewDataUrl,
          extractedSummary: isAr ? analysis.extractedSummaryAr : analysis.extractedSummaryEn,
          extractedFields: analysis.extractedFields,
          unreadableFields: analysis.unreadableFields,
          extractedPrescriptions: analysis.extractedPrescriptions,
          saveExtractedPrescriptions: true,
        },
        profile,
        schedules,
        prescriptions,
        previewImageUrl: compressed.previewDataUrl,
        rawFileForUpload: file,
        base64DataForUpload: compressed.base64Data,
      });

      const leadMsg = isAr
        ? `قرأتلك الصورة اللي رفعتها! ${analysis.extractedSummaryAr}`
        : analysis.extractedSummaryEn;

      setMsgs((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-doc-proposal`,
          who: 'bot',
          text: leadMsg,
          date,
          isAi: true,
          actionProposal: proposal,
        },
      ]);
    } catch (err) {
      console.error('Document analysis error:', err);
      setMsgs((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-doc-fail`,
          who: 'bot',
          text: isAr
            ? '⚠️ معلش، معرفتش أقرأ الصورة دي كويس. جرب تصورها تاني في إضاءة أوضح.'
            : '⚠️ Could not analyze the attached image. Please try again with a clearer image.',
          date,
          isAi: true,
        },
      ]);
    } finally {
      setUploadProgress(null);
      setLoading(false);
    }
  }

  async function handleConfirmProposal(
    proposalId: string,
    editedFields?: Record<string, string>
  ) {
    const targetMsg = msgs.find((m) => m.actionProposal?.id === proposalId);
    if (!targetMsg || !targetMsg.actionProposal) return;

    const effectiveProposal = editedFields
      ? applyEditedFieldsToProposal(
          targetMsg.actionProposal,
          editedFields,
          profile,
          schedules,
          prescriptions
        )
      : targetMsg.actionProposal;

    const execResult = await executeConfirmedAiAction({
      proposal: effectiveProposal,
      authenticatedUid: user?.uid,
      confirmedByPatient: true,
      currentProfile: profile,
      currentSchedules: schedules,
      currentPrescriptions: prescriptions,
      onProfileUpdated: (nextP) => setProfile(nextP),
      onSchedulesUpdated: (nextS) => setSchedules(nextS),
      onPrescriptionsUpdated: (nextRx) => setPrescriptions(nextRx),
    });

    setMsgs((prev) =>
      prev.map((m) => {
        if (m.actionProposal?.id !== proposalId) return m;
        return {
          ...m,
          actionProposal: {
            ...effectiveProposal,
            status: execResult.success ? 'confirmed_saved' : 'failed',
            resultMessageAr: execResult.messageAr,
            resultMessageEn: execResult.messageEn,
          },
        };
      })
    );
  }

  function handleCancelProposal(proposalId: string) {
    setMsgs((prev) =>
      prev.map((m) => {
        if (m.actionProposal?.id !== proposalId || !m.actionProposal) return m;
        return {
          ...m,
          actionProposal: {
            ...m.actionProposal,
            status: 'cancelled',
            resultMessageAr: 'خلاص تمام، لغيت العملية ومتحفظش أي تغيير.',
            resultMessageEn: 'Action cancelled. No changes were saved to your account.',
          },
        };
      })
    );
  }

  function toggleVoiceMic() {
    if (listening) {
      stopListenRef.current?.stop();
      stopListenRef.current = null;
      setListening(false);
      return;
    }
    if (!isVoiceRecognitionSupported()) return;
    stopListenRef.current?.stop();
    setListening(true);
    stopListenRef.current = startVoiceRecognition(
      lang,
      (transcript) => {
        stopListenRef.current = null;
        setListening(false);
        if (transcript.trim()) {
          setQ(transcript);
          ask(transcript, true);
        }
      },
      () => {
        stopListenRef.current = null;
        setListening(false);
      },
      () => {
        stopListenRef.current = null;
        setListening(false);
      }
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  return (
    <aside className="chat-widget-root" aria-label="Smart Assistant & Emergency Widget">
      {!isOpen && !sosOpen && (
        <div className="floating-fab-stack">
          <button
            type="button"
            className="emergency-fab"
            onClick={() => {
              setSosOpen(true);
              setIsOpen(false);
            }}
            aria-label={tr(
              lang,
              `طوارئ الحساسية والإسعاف (${countryName}: ${emergency.number})`,
              `Emergency SOS (${countryName}: ${emergency.number})`,
              `Urgences SOS (${countryName} : ${emergency.number})`,
              `Emergencias SOS (${countryName}: ${emergency.number})`
            )}
          >
            <span className="fab-icon">🚨</span>
            <span className="fab-label">
              {tr(
                lang,
                `طوارئ ${emergency.number}`,
                `SOS ${emergency.number}`,
                `SOS ${emergency.number}`,
                `SOS ${emergency.number}`
              )}
            </span>
            <span className="sos-pulse-dot"></span>
          </button>

          <Link
            to="/scan"
            className="scan-fab"
            aria-label={isAr ? 'مسح باركود العلبة بالكاميرا' : 'Scan Box Barcode'}
          >
            <span className="fab-icon">📷</span>
            <span className="fab-label">
              {isAr ? 'مسح باركود العلبة بالكاميرا' : 'Scan Box Barcode'}
            </span>
          </Link>

          <button
            type="button"
            className="chat-fab"
            onClick={() => {
              setIsOpen(true);
              setSosOpen(false);
            }}
            aria-label={isAr ? 'افتح المساعد الصحي الذكي' : 'Open Personal Health Assistant'}
          >
            <span className="fab-icon">🤖</span>
            <span className="fab-label">
              {isAr ? 'المساعد الصحي الذكي' : 'AI Health Assistant'}
            </span>
            <span className="fab-badge"></span>
          </button>
        </div>
      )}

      {sosOpen && (
        <div className="chat-popup sos-popup" role="dialog" aria-modal="true">
          <div className="popup-head sos-head">
            <div className="popup-title">
              <span className="head-avatar">🚨</span>
              <div>
                <b>{isAr ? 'طوارئ الحساسية الدوائية والإسعاف' : 'Drug Allergy & Emergency SOS'}</b>
                <div className="online-status">
                  <small>{isAr ? 'توجيهات الإسعاف العاجل' : 'Urgent Emergency Protocol'}</small>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="close-popup-btn"
              onClick={() => setSosOpen(false)}
              aria-label="Close SOS"
            >
              ✕
            </button>
          </div>

          <div className="popup-body stack" style={{ padding: '16px' }}>
            <div className="alert urgent" style={{ margin: 0 }}>
              <strong>
                ⚠️ {isAr ? 'أعراض الصدمة التحسسية الطارئة (Anaphylaxis):' : 'Emergency Anaphylaxis Signs:'}
              </strong>
              <ul style={{ margin: '6px 0 0', paddingInlineStart: '18px', fontSize: '0.9rem' }}>
                <li>
                  {isAr
                    ? 'تورم مفاجئ في الوش أو الشفايف أو اللسان أو الزور.'
                    : 'Sudden swelling of face, lips, tongue, or throat.'}
                </li>
                <li>
                  {isAr
                    ? 'ضيق شديد في النفس أو تزييق في الصدر أو صعوبة في البلع.'
                    : 'Difficulty breathing, wheezing, or trouble swallowing.'}
                </li>
                <li>
                  {isAr
                    ? 'دوخة شديدة أو هبوط حاد أو طفح جلدي في الجسم كله.'
                    : 'Severe dizziness, collapse, or widespread hives.'}
                </li>
              </ul>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                background: 'var(--tint, #f1f5f9)',
                border: '1px solid var(--line, #cbd5e1)',
                borderRadius: '10px',
                padding: '8px 10px',
                fontSize: '0.84rem',
              }}
            >
              <span>
                {emergency.flag}{' '}
                <b>
                  {tr(
                    lang,
                    `الدولة: ${countryName}`,
                    `Country: ${countryName}`,
                    `Pays : ${countryName}`,
                    `País: ${countryName}`
                  )}
                </b>
              </span>
              <select
                value={selectedOverride}
                onChange={(e) => setCountryOverride(e.target.value)}
                aria-label={tr(
                  lang,
                  'تغيير الدولة لرقم الطوارئ',
                  'Change emergency country',
                  'Changer le pays d’urgence',
                  'Cambiar país de emergencia'
                )}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--line, #cbd5e1)',
                  background: 'var(--card-bg, #fff)',
                  color: 'var(--ink, #12303f)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  maxWidth: '185px',
                  cursor: 'pointer',
                }}
              >
                <option value="AUTO">
                  📍{' '}
                  {tr(
                    lang,
                    'تحديد تلقائي للموقع',
                    'Auto-detect location',
                    'Détection auto',
                    'Detección automática'
                  )}
                </option>
                {countriesList.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {pickCountryName(c, lang)} ({c.number})
                  </option>
                ))}
              </select>
            </div>

            <a
              href={`tel:${emergency.number}`}
              className="btn danger"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '1.05rem',
                padding: '12px',
              }}
            >
              📞{' '}
              {tr(
                lang,
                `كلم الإسعاف فوراً — ${countryName} (${emergency.number})`,
                `Call Emergency Now — ${countryName} (${emergency.number})`,
                `Appeler les urgences — ${countryName} (${emergency.number})`,
                `Llamar a emergencias — ${countryName} (${emergency.number})`
              )}
            </a>

            <Link
              to="/side-effects"
              className="btn ghost"
              onClick={() => setSosOpen(false)}
              style={{ textAlign: 'center' }}
            >
              📋{' '}
              {isAr
                ? 'افتح دليل الآثار الجانبية وخطوات الإسعاف الكاملة'
                : 'Open Full Side Effects & First-Aid Guide'}
            </Link>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="chat-popup" role="dialog" aria-modal="true">
          <div className="popup-head">
            <div className="popup-title">
              <span className="head-avatar">🤖</span>
              <div>
                <b>{isAr ? 'مساعدك الصحي الشخصي (بالمصري)' : 'AI Personal Health Assistant'}</b>
                <div className="online-status">
                  <span className="status-dot"></span>
                  <small>
                    {isAr
                      ? 'بينفذ طلباتك، بيقرأ الروشتات 📎، وبيسمعك بالمايك 🎤'
                      : 'Supports Actions, Uploads 📎 & Voice 🎤'}
                  </small>
                </div>
              </div>
            </div>
            <div className="popup-actions">
              <Link
                to="/health-profile"
                className="expand-btn"
                title={isAr ? 'ملفي الصحي' : 'My Health Profile'}
                onClick={() => setIsOpen(false)}
              >
                👤
              </Link>
              <Link
                to="/assistant"
                className="expand-btn"
                title={isAr ? 'فتح في صفحة كاملة' : 'Full page'}
                onClick={() => setIsOpen(false)}
              >
                ↗
              </Link>
              <button
                type="button"
                className="close-popup-btn"
                onClick={() => {
                  stopSpeech();
                  stopListenRef.current?.stop();
                  stopListenRef.current = null;
                  setListening(false);
                  setIsOpen(false);
                }}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="popup-body chat" aria-live="polite">
            {msgs.length === 0 && (
              <div className="msg bot">
                {isAr
                  ? 'يا هلا بيك! أنا مساعدك الصحي الشخصي. كلمني بالمصري براحتك خالص؛ قولي مثلاً: «عندي حساسية من البنسلين»، «عندي سكر ضيفه في ملفي»، «وزني 75 كيلو»، «فكرني آخد أوجمنتين الساعة 8»، أو ارفع صورة روشتتك من زرار 📎 وأنا هظبطلك كل حاجة!'
                  : 'Hello! I am your Personal Health Assistant. Ask me about any antibiotic, upload a prescription/lab image via 📎, or give commands like "Add my penicillin allergy", "Add diabetes to my health profile", or "Remind me to take Augmentin at 8 AM".'}
              </div>
            )}

            {msgs.map((m, i) => {
              if (m.who === 'me') {
                return (
                  <div key={m.id || i} className="msg me">
                    {m.attachmentPreviewUrl && (
                      <div style={{ marginBottom: '6px' }}>
                        <img
                          src={m.attachmentPreviewUrl}
                          alt={m.attachmentFileName || 'Attachment'}
                          style={{
                            maxWidth: '180px',
                            maxHeight: '130px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.4)',
                            display: 'block',
                          }}
                        />
                      </div>
                    )}
                    <div>{m.text}</div>
                  </div>
                );
              }

              const plainText = extractAnswerPlainText(m, lang);

              if (m.isAi && (m.text || m.actionProposal)) {
                return (
                  <div key={m.id || i} className="msg bot ai-reply">
                    <div
                      className="row"
                      style={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px',
                      }}
                    >
                      <div className="ai-badge">
                        {m.actionProposal
                          ? isAr
                            ? '⚡ إجراء جاهز للتأكيد في حسابك'
                            : '⚡ Proposed Health Action'
                          : m.isSystemActionResult
                            ? isAr
                              ? '📋 من ملفك الصحي'
                              : '📋 Saved Patient Record'
                            : isAr
                              ? '✨ مساعدك الصيدلاني الذكي'
                              : '✨ AI Health Assistant'}
                      </div>
                      {plainText && (
                        <button
                          type="button"
                          className="chip"
                          onClick={() => speakText(plainText, lang)}
                        >
                          🔊
                        </button>
                      )}
                    </div>
                    {m.text && (
                      <div className="ai-text" style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                        {cleanAssistantMarkdown(m.text)}
                      </div>
                    )}
                    {m.actionProposal && (
                      <AiActionConfirmationCard
                        proposal={m.actionProposal}
                        lang={lang}
                        onConfirm={handleConfirmProposal}
                        onCancel={handleCancelProposal}
                        onCloseWidget={() => setIsOpen(false)}
                      />
                    )}
                    {m.links && m.links.length > 0 && (
                      <div className="src" style={{ marginTop: '6px' }}>
                        {m.links.map((l, k) => (
                          <span key={l.to + k}>
                            {k > 0 && ' · '}
                            <Link to={l.to} onClick={() => setIsOpen(false)}>
                              💊 {pick(l.label, lang)}
                            </Link>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="src">{m.date}</div>
                  </div>
                );
              }

              const r = m.reply;
              if (!r) return null;
              return (
                <div
                  key={m.id || i}
                  className={`msg bot ${r.kind === 'text' && (r.tone === 'warn' || r.tone === 'alert') ? 'warn' : ''}`}
                  role={r.kind === 'text' && r.tone === 'alert' ? 'alert' : undefined}
                >
                  <div
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '6px',
                    }}
                  >
                    <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                      {cleanAssistantMarkdown(plainText)}
                    </p>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => speakText(plainText, lang)}
                    >
                      🔊
                    </button>
                  </div>
                </div>
              );
            })}

            {uploadProgress !== null && (
              <div className="msg bot loading-msg">
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                  🔍{' '}
                  {isAr
                    ? `بقرألك الصورة وبجهز البيانات (${uploadProgress}%)...`
                    : `Analyzing medical document (${uploadProgress}%)...`}
                </div>
                <div
                  style={{
                    height: '6px',
                    background: '#e2e8f0',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: '#0284c7',
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {loading && uploadProgress === null && (
              <div className="msg bot loading-msg">
                <span className="dot-pulse">● ● ●</span>{' '}
                {isAr ? 'ثانية واحدة بجهزلك الرد...' : 'Processing...'}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Smart Action Chips + Classic Awareness Chips */}
          <div className="popup-chips">
            {smartActionChips.slice(0, 5).map((sc) => (
              <button
                key={sc.label}
                type="button"
                className="chip"
                onClick={() => ask(sc.prompt)}
                disabled={loading}
                style={{
                  background: sc.isUploadTrigger ? '#e0f2fe' : '#f0fdf4',
                  borderColor: sc.isUploadTrigger ? '#0284c7' : '#16a34a',
                  color: sc.isUploadTrigger ? '#0369a1' : '#15803d',
                  fontWeight: 600,
                }}
              >
                {sc.label}
              </button>
            ))}
            {(WIDGET_CHIPS[lang] || WIDGET_CHIPS.en).slice(0, 3).map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                onClick={() => ask(c)}
                disabled={loading}
              >
                {c}
              </button>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileAttachment}
          />

          <form className="popup-form" onSubmit={submit}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => fileInputRef.current?.click()}
              title={
                isAr
                  ? 'ارفع صورة روشتة أو تحليل أو تقرير طبي'
                  : 'Attach prescription, lab result, or medical report'
              }
              disabled={loading}
              style={{ padding: '6px 10px' }}
            >
              📎
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={toggleVoiceMic}
              title={isAr ? 'اتكلم بالمايك' : 'Speak'}
              style={{
                padding: '6px 10px',
                background: listening ? '#fee2e2' : undefined,
                color: listening ? '#dc2626' : undefined,
              }}
            >
              {listening ? '⏹️' : '🎤'}
            </button>
            <input
              value={q}
              maxLength={2000}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                listening
                  ? isAr
                    ? 'سامعك... اتكلم دلوقتي'
                    : 'Listening...'
                  : isAr
                    ? 'اسألني في أي حاجة أو اطلب أي أمر بالمصري (أدوية، تحاليل، صحة عامة، منبه، حساسية)...'
                    : 'Ask or command (e.g., Add penicillin allergy)...'
              }
              aria-label="Ask assistant"
              disabled={loading}
            />
            <button className="btn" disabled={loading || !q.trim()}>
              {loading ? '...' : isAr ? 'ابعت' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
