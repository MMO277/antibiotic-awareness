import { pick } from './types';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { useApproved } from './medicinesApi';
import { useSyncedHealthProfile } from './allergyData';
import { useSyncedSchedules } from './trackerData';
import {
  buildPassages,
  respond,
  extractAnswerPlainText,
  isDirectVerifiedMatch,
} from './assistantLogic';
import { askGemini, ChatMessage, cleanAssistantMarkdown } from './geminiApi';
import {
  isVoiceRecognitionSupported,
  speakText,
  startVoiceRecognition,
  stopSpeech,
  VoiceRecognitionHandle,
} from './speechService';
import { detectPatientActionIntent } from './aiActionRegistry';
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
  getSmartAssistantActionChips,
  useSyncedAiConversation,
} from './aiConversationContext';
import AiActionConfirmationCard from './AiActionConfirmationCard';

const CHIPS: Record<string, string[]> = {
  ar: [
    'هل المضاد الحيوي يعالج البرد والزكام؟',
    'ما هي مخاطر حقنة البرد (مجموعة البرد)؟',
    'هل ينفع أوقف المضاد لما أحس بتحسن؟',
    'ماذا أفعل لو نسيت جرعة المضاد؟',
    'هل شرب الحليب يبطل مفعول المضاد؟',
    'كيف أخزّن المضاد الحيوي الشراب للأطفال؟',
    'هل المضاد يسبب إسهال وما فائدة الزبادي؟',
    'هل المضاد يؤثر على حبوب منع الحمل؟',
    'هل المضاد يعالج وجع الضرس والأسنان؟',
  ],
  en: [
    'Do antibiotics treat colds or flu?',
    'What are the dangers of cold shot mixtures?',
    'Can I stop taking antibiotics when I feel better?',
    'What should I do if I miss a dose?',
    'Does milk interact with antibiotics?',
    'How do I store pediatric antibiotic suspensions?',
    'Do antibiotics cause diarrhea, and how does yogurt help?',
    'Do antibiotics reduce birth control pill efficacy?',
    'Do antibiotics cure toothaches and dental pain?',
  ],
  de: [
    'Helfen Antibiotika bei Erkältung oder Grippe?',
    'Welche Gefahren bergen Erkältungsspritzen-Mischungen?',
    'Darf ich das Antibiotikum absetzen, sobald es mir besser geht?',
    'Was tun, wenn ich eine Einnahme vergessen habe?',
    'Gibt es Wechselwirkungen zwischen Milch und Antibiotika?',
    'Wie lagere ich Antibiotika-Suspensionen für Kinder richtig?',
    'Verursachen Antibiotika Durchfall und hilft Joghurt?',
    'Beeinträchtigen Antibiotika die Wirkung der Antibabypille?',
    'Helfen Antibiotika gegen Zahnschmerzen?',
  ],
  fr: [
    'Les antibiotiques soignent-ils le rhume ou la grippe ?',
    'Quels sont les dangers des injections miracles contre le rhume ?',
    'Puis-je arrêter l’antibiotique dès que je me sens mieux ?',
    'Que faire si j’oublie une dose d’antibiotique ?',
    'Le lait interagit-il avec certains antibiotiques ?',
    'Comment conserver un sirop antibiotique pédiatrique ?',
    'Les antibiotiques causent-ils la diarrhée ?',
    'Les antibiotiques diminuent-ils l’effet de la pilule contraceptive ?',
    'Les antibiotiques guérissent-ils les maux de dents ?',
  ],
  es: [
    '¿Los antibióticos curan el resfriado o la gripe?',
    '¿Cuáles son los peligros de las inyecciones mezcladas para el resfriado?',
    '¿Puedo suspender el antibiótico cuando me sienta mejor?',
    '¿Qué debo hacer si olvido una dosis?',
    '¿La leche interactúa con los antibióticos?',
    '¿Cómo almacenar las suspensiones pediatrics de antibióticos?',
    '¿Los antibióticos causan diarrea y cómo ayuda el yogur?',
    '¿Los antibióticos reducen la eficacia de los anticonceptivos?',
    '¿Los antibióticos curan el dolor de muelas?',
  ],
};

function FormattedClinicalText({ text }: { text: string }) {
  const cleaned = cleanAssistantMarkdown(text);
  const blocks = cleaned.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div style={{ display: 'grid', gap: '8px', lineHeight: 1.75, fontSize: '0.95rem', marginTop: '4px' }}>
      {blocks.map((block, bIdx) => {
        const isWarnBlock = block.startsWith('⚠️') || block.startsWith('🚨');
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

        if (isWarnBlock) {
          return (
            <div
              key={bIdx}
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderInlineStart: '4px solid #f59e0b',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#78350f',
              }}
            >
              {lines.map((line, lIdx) => (
                <div
                  key={lIdx}
                  style={{
                    fontWeight: lIdx === 0 ? 700 : 400,
                    marginBottom: lIdx < lines.length - 1 ? '4px' : 0,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          );
        }

        return (
          <div key={bIdx} style={{ display: 'grid', gap: '4px' }}>
            {lines.map((line, lIdx) => {
              const isNumbered = /^\d+\.\s/.test(line);
              const isBullet = line.startsWith('•') || line.startsWith('-');
              const colonIdx = line.indexOf(':');

              if (isNumbered) {
                return (
                  <div
                    key={lIdx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #d3e4ea',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#0f172a',
                    }}
                  >
                    {colonIdx > 0 && colonIdx < 65 ? (
                      <>
                        <strong style={{ color: '#0b3c5d' }}>{line.slice(0, colonIdx + 1)}</strong>
                        <span>{line.slice(colonIdx + 1)}</span>
                      </>
                    ) : (
                      <strong style={{ color: '#0b3c5d' }}>{line}</strong>
                    )}
                  </div>
                );
              }

              if (isBullet) {
                return (
                  <div key={lIdx} style={{ paddingInlineStart: '8px', color: '#1e293b' }}>
                    {colonIdx > 0 && colonIdx < 50 ? (
                      <>
                        <strong style={{ color: '#0b3c5d' }}>{line.slice(0, colonIdx + 1)}</strong>
                        <span>{line.slice(colonIdx + 1)}</span>
                      </>
                    ) : (
                      line
                    )}
                  </div>
                );
              }

              return (
                <p
                  key={lIdx}
                  style={{
                    margin: 0,
                    fontWeight: lIdx === 0 && lines.length > 1 && line.endsWith(':') ? 700 : 400,
                    color: lIdx === 0 && line.endsWith(':') ? '#0b3c5d' : '#12303f',
                  }}
                >
                  {line}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function Assistant() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const { profile, setProfile } = useSyncedHealthProfile();
  const { schedules, setSchedules, prescriptions, setPrescriptions } = useSyncedSchedules();
  const { items } = useApproved();
  const meds = useMemo(() => items ?? [], [items]);
  const passages = useMemo(() => buildPassages(meds), [meds]);

  const { messages: msgs, setMessages: setMsgs } = useSyncedAiConversation(user?.uid);

  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const stopListenRef = useRef<VoiceRecognitionHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const smartActionChips = useMemo(() => getSmartAssistantActionChips(lang), [lang]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs, loading, uploadProgress]);

  useEffect(() => {
    return () => {
      stopSpeech();
      stopListenRef.current?.stop();
      stopListenRef.current = null;
    };
  }, []);

  async function ask(raw: string, shouldSpeakReply = autoSpeak) {
    const text = raw.trim().slice(0, 300);
    if (!text || loading) return;

    if (text === '__UPLOAD_DOCUMENT__') {
      fileInputRef.current?.click();
      return;
    }

    const date = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB');
    setMsgs((m) => [...m, { id: `msg-${Date.now()}-u`, who: 'me', text, date }]);
    setQ('');
    setLoading(true);

    // 1) Check Personal Health Assistant Action Engine FIRST
    const lastMedContext =
      prescriptions[0]?.medicineName ||
      schedules[0]?.medicineName ||
      profile.medications[0]?.drugName;
    const actionIntent = detectPatientActionIntent(text, lang, lastMedContext);

    if (actionIntent.matched) {
      if (actionIntent.safetyRefusal) {
        const refusalText = isAr
          ? actionIntent.safetyRefusal.messageAr
          : actionIntent.safetyRefusal.messageEn;
        setMsgs((m) => [
          ...m,
          { id: `msg-${Date.now()}-refusal`, who: 'bot', text: refusalText, date, isAi: true },
        ]);
        setLoading(false);
        if (shouldSpeakReply) speakText(refusalText, lang);
        return;
      }

      if (actionIntent.needsClarification) {
        const clarifyText = isAr
          ? actionIntent.clarificationQuestionAr || 'يرجى توضيح التفاصيل المطلوبة.'
          : actionIntent.clarificationQuestionEn || 'Please clarify the required details.';
        setMsgs((m) => [
          ...m,
          { id: `msg-${Date.now()}-clarify`, who: 'bot', text: clarifyText, date, isAi: true },
        ]);
        setLoading(false);
        if (shouldSpeakReply) speakText(clarifyText, lang);
        return;
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
        if (shouldSpeakReply) speakText(replyText, lang);
        return;
      }

      if (actionIntent.actionType && actionIntent.args) {
        const proposal = createPendingActionProposal({
          actionType: actionIntent.actionType,
          args: actionIntent.args,
          profile,
          schedules,
          prescriptions,
        });
        const leadText = isAr
          ? 'قمت بتجهيز هذا الإجراء لمراجعتك. يرجى التحقق من البيانات بالأسفل والضغط على «تأكيد وحفظ» لاعتماده في ملفك الصحي:'
          : 'I have prepared this action for your review. Please verify the details below and click "Confirm and Save" to apply it to your account:';
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
        if (shouldSpeakReply) speakText(leadText, lang);
        return;
      }
    }

    // 2) Check Verified Clinical Database & Condition Protocols
    const localReply = respond(passages, meds, text);
    if (isDirectVerifiedMatch(localReply)) {
      const botMsg: EnhancedChatUiMessage = {
        id: `msg-${Date.now()}-local`,
        who: 'bot',
        reply: localReply,
        date,
        isAi: false,
      };
      setMsgs((m) => [...m, botMsg]);
      setLoading(false);
      if (shouldSpeakReply) {
        speakText(extractAnswerPlainText(botMsg, lang), lang);
      }
      return;
    }

    // 3) For open-ended questions outside local passages, use AI Assistant with permitted patient context
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
      });
      const enrichedQuestion = patientContext ? `${text}\n${patientContext}` : text;

      const aiResponse = await askGemini(enrichedQuestion, history);
      const botMsg: EnhancedChatUiMessage = {
        id: `msg-${Date.now()}-ai`,
        who: 'bot',
        text: aiResponse,
        date,
        isAi: true,
      };
      setMsgs((m) => [...m, botMsg]);
      setLoading(false);
      if (shouldSpeakReply) {
        speakText(aiResponse, lang);
      }
      return;
    } catch (err) {
      console.warn('AI fallback to local reply:', err);
    }

    const botMsg: EnhancedChatUiMessage = {
      id: `msg-${Date.now()}-fallback`,
      who: 'bot',
      reply: localReply,
      date,
      isAi: false,
    };
    setMsgs((m) => [...m, botMsg]);
    setLoading(false);

    if (shouldSpeakReply) {
      speakText(extractAnswerPlainText(botMsg, lang), lang);
    }
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
            ? `📎 تم إرفاق مستند طبي: ${validation.sanitizedFileName}`
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

      setMsgs((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-doc-proposal`,
          who: 'bot',
          text: isAr ? analysis.extractedSummaryAr : analysis.extractedSummaryEn,
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
            ? '⚠️ حدث خطأ أثناء تحليل الصورة المرفقة. يرجى المحاولة بصورة أوضح.'
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
            resultMessageAr: 'تم إلغاء العملية بناءً على طلبك ولم يتم حفظ أي تغيير.',
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

    if (!isVoiceRecognitionSupported()) {
      setVoiceNote(
        isAr
          ? 'متصفحك الحالي لا يدعم الإملاء الصوتي المباشر. يُرجى استخدام متصفح Chrome أو Edge أو Safari.'
          : 'Your browser does not support Web Speech Recognition. Please use Chrome, Edge, or Safari.'
      );
      return;
    }

    stopListenRef.current?.stop();
    setVoiceNote(
      isAr
        ? '🎙️ تحدث الآن... أنا أستمع إليك (يمكنك طلب إضافة حساسية أو تذكير أو سؤال طبي)'
        : '🎙️ Speak now... Listening for questions or health profile commands'
    );
    setListening(true);

    stopListenRef.current = startVoiceRecognition(
      lang,
      (transcript) => {
        stopListenRef.current = null;
        setListening(false);
        setVoiceNote('');
        if (transcript.trim()) {
          setQ(transcript);
          ask(transcript, true);
        }
      },
      (errMsg) => {
        stopListenRef.current = null;
        setListening(false);
        setVoiceNote(errMsg);
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
    <main className="wrap narrow stack">
      <div className="asst-header">
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h1>🤖 {isAr ? 'مساعدك الصحي الشخصي الذكي' : t('asstTitle')}</h1>
            <p className="muted" style={{ margin: 0 }}>
              {isAr
                ? 'اسأل عن أي دواء، أو أدر ملفك الصحي وروشتاتك وتذكيراتك بالأوامر المباشرة أو برفع الصور.'
                : 'Ask clinical questions or manage your Health Profile, prescriptions, and reminders via natural commands or uploads.'}
            </p>
          </div>
          <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/health-profile" className="btn small ghost">
              👤 {isAr ? 'ملفي الصحي' : 'Health Profile'}
            </Link>
            <button
              type="button"
              className="btn small"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              📎 {isAr ? 'رفع روشتة / تحليل' : 'Upload Rx / Lab'}
            </button>
            <button
              type="button"
              className={`btn small ${autoSpeak ? '' : 'ghost'}`}
              onClick={() => {
                if (autoSpeak) stopSpeech();
                setAutoSpeak((v) => !v);
              }}
            >
              🔊{' '}
              {isAr
                ? autoSpeak
                  ? 'النطق التلقائي: مفعّل'
                  : 'تفعيل نطق الإجابات صوتياً'
                : autoSpeak
                  ? 'Auto-Voice: ON'
                  : 'Enable Voice Readout'}
            </button>
          </div>
        </div>
      </div>

      {/* Voice & Action Callout Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
          color: '#fff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <b style={{ fontSize: '1.05rem', display: 'block', marginBottom: '4px' }}>
            🗣️{' '}
            {isAr
              ? 'الأوامر الصوتية وتحليل الروشتات والملف الصحي'
              : 'Live Voice Commands, Prescription OCR & Health Record Actions'}
          </b>
          <span className="small" style={{ color: '#e0f2fe' }}>
            {isAr
              ? 'جرب قول: "أضف حساسية البنسلين"، "حدث وزني إلى 75 كجم"، "فكرني آخد أوجمنتين الساعة 8 صباحاً"، أو ارفع صورة روشتة!'
              : 'Try saying: "Add my penicillin allergy", "Update my weight to 75 kg", "Remind me to take Augmentin at 8 AM", or upload a prescription image!'}
          </span>
        </div>
        <button
          type="button"
          className="btn"
          onClick={toggleVoiceMic}
          style={{
            background: listening ? '#dc2626' : '#10b981',
            color: '#fff',
            fontWeight: 700,
            padding: '10px 18px',
            borderRadius: '999px',
          }}
        >
          {listening
            ? isAr
              ? '⏹️ إيقاف الاستماع...'
              : '⏹️ Stop Listening...'
            : isAr
              ? '🎤 اضغط وتحدث بالمايك الآن'
              : '🎤 Tap & Speak Now'}
        </button>
      </div>

      {voiceNote && (
        <div className="notice tip" style={{ padding: '10px 14px', borderRadius: '10px' }}>
          {voiceNote}
        </div>
      )}

      <section className="card stack" aria-label={t('asstTitle')}>
        <div className="chat" aria-live="polite">
          {msgs.length === 0 && (
            <div className="msg bot">
              {isAr
                ? 'أهلاً بك في مساعدك الصحي الشخصي! يمكنك اختيار أحد الإجراءات السريعة بالأسفل، أو كتابة أمر مباشر، أو إرفاق صورة روشتة/تحليل عبر زر 📎.'
                : 'Welcome to your AI Personal Health Assistant! Choose a quick action below, type a command, or attach a prescription/lab image using 📎.'}
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
                          maxWidth: '220px',
                          maxHeight: '160px',
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

            const plainForSpeech = extractAnswerPlainText(m, lang);

            if (m.isAi && (m.text || m.actionProposal)) {
              return (
                <div key={m.id || i} className="msg bot ai-reply">
                  <div
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        background: m.actionProposal
                          ? '#fef3c7'
                          : m.isSystemActionResult
                            ? '#dcfce7'
                            : '#e0f2fe',
                        color: m.actionProposal
                          ? '#92400e'
                          : m.isSystemActionResult
                            ? '#166534'
                            : '#0369a1',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                      }}
                    >
                      {m.actionProposal
                        ? isAr
                          ? '⚡ إجراء صحي مقترح — يتطلب تأكيدك'
                          : '⚡ Proposed Health Action — Confirmation Required'
                        : m.isSystemActionResult
                          ? isAr
                            ? '📋 بيانات سجلك الصحي المحفوظة'
                            : '📋 Saved Patient Health Record'
                          : isAr
                            ? '✨ إجابة طبية منظمة وموثقة'
                            : '✨ Structured Medical Answer'}
                    </span>
                    {plainForSpeech && (
                      <button
                        type="button"
                        className="chip"
                        onClick={() => speakText(plainForSpeech, lang)}
                        title={isAr ? 'استمع للإجابة صوتياً' : 'Listen to answer'}
                      >
                        🔊 {isAr ? 'اسمع الإجابة' : 'Listen'}
                      </button>
                    )}
                  </div>
                  {m.text && <FormattedClinicalText text={m.text} />}
                  {m.actionProposal && (
                    <AiActionConfirmationCard
                      proposal={m.actionProposal}
                      lang={lang}
                      onConfirm={handleConfirmProposal}
                      onCancel={handleCancelProposal}
                    />
                  )}
                  <div className="src" style={{ marginTop: '8px' }}>
                    {t('asstChecked')} {m.date}
                  </div>
                </div>
              );
            }

            const r = m.reply;
            if (!r) return null;
            if (r.kind === 'answer') {
              return (
                <div key={m.id || i} className="msg bot">
                  <div
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <strong style={{ color: '#0b3c5d', fontSize: '0.95rem' }}>
                      {pick(r.lead, lang)}
                    </strong>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => speakText(plainForSpeech, lang)}
                    >
                      🔊 {isAr ? 'اسمع الإجابة' : 'Listen'}
                    </button>
                  </div>
                  {r.hits.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #d3e4ea',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        marginBottom: '8px',
                      }}
                    >
                      <FormattedClinicalText text={pick(p.text, lang)} />
                      <div
                        className="src"
                        style={{
                          marginTop: '8px',
                          paddingTop: '6px',
                          borderTop: '1px solid #eef6f8',
                        }}
                      >
                        <Link to={p.link ?? '/'} style={{ fontWeight: 700 }}>
                          🔗 {p.label}
                        </Link>
                        {p.unreviewed && <> · {t('unreviewed')}</>}
                        {p.refs.map((x) => (
                          <span key={x.url}>
                            {' · '}
                            <a href={x.url} target="_blank" rel="noopener noreferrer">
                              {x.title}
                            </a>
                            {x.publisher ? ` (${x.publisher})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="src">
                    {t('asstChecked')} {m.date}
                  </div>
                </div>
              );
            }
            return (
              <div
                key={m.id || i}
                className={`msg bot ${r.tone === 'warn' || r.tone === 'alert' ? 'warn' : ''}`}
                role={r.tone === 'alert' ? 'alert' : undefined}
              >
                <div
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      background: '#dcfce7',
                      color: '#166534',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                    }}
                  >
                    ✅ {isAr ? 'دليل سريري معتمد من المنصة' : 'Verified Clinical Protocol'}
                  </span>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => speakText(plainForSpeech, lang)}
                  >
                    🔊 {isAr ? 'اسمع الإجابة' : 'Listen'}
                  </button>
                </div>
                <FormattedClinicalText text={pick(r.text, lang)} />
                {r.links && r.links.length > 0 && (
                  <div
                    className="row wrapRow"
                    style={{
                      gap: '6px',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid #d3e4ea',
                    }}
                  >
                    {r.links.map((l, k) => (
                      <Link
                        key={l.to + k}
                        to={l.to}
                        className="chip"
                        style={{
                          textDecoration: 'none',
                          background: '#ffffff',
                          borderColor: '#0e9aa7',
                          color: '#0a7c87',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                        }}
                      >
                        💊 {pick(l.label, lang)}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="src" style={{ marginTop: '6px' }}>
                  {t('asstChecked')} {m.date}
                </div>
              </div>
            );
          })}

          {uploadProgress !== null && (
            <div className="msg bot loading-msg">
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                🔍{' '}
                {isAr
                  ? `جاري ضغط وتحليل المستند الطبي (${uploadProgress}%)...`
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
              {isAr ? 'جاري تحضير الإجابة أو الإجراء...' : 'Preparing response...'}
            </div>
          )}
          <div ref={end} />
        </div>

        {/* Smart Personal Health Action Chips */}
        <div className="chips" style={{ marginBottom: '4px' }}>
          {smartActionChips.map((sc) => (
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
                fontWeight: 700,
              }}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* General Awareness Question Chips */}
        <div className="chips">
          {(CHIPS[lang] || CHIPS.en).map((c) => (
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

        <form className="chatform" onSubmit={submit}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => fileInputRef.current?.click()}
            title={
              isAr
                ? 'إرفاق صورة روشتة أو تحليل أو تقرير طبي'
                : 'Attach prescription, lab result, or medical report'
            }
            disabled={loading}
          >
            📎
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={toggleVoiceMic}
            title={isAr ? 'اسأل بصوتك بالمايك' : 'Speak with microphone'}
            style={{
              background: listening ? '#fee2e2' : undefined,
              borderColor: listening ? '#dc2626' : undefined,
              color: listening ? '#dc2626' : undefined,
            }}
          >
            {listening ? '⏹️' : '🎤'}
          </button>
          <input
            value={q}
            maxLength={300}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              isAr
                ? 'اكتب سؤالك أو أمرك الصحي (مثال: أضف حساسية البنسلين، فكرني بجرعة 8 صباحاً)...'
                : 'Ask a question or give a command (e.g., Add penicillin allergy, Remind me at 8 AM)...'
            }
            aria-label={t('asstPlaceholder')}
            disabled={loading}
          />
          <button className="btn" disabled={loading || !q.trim()}>
            {loading ? '...' : t('asstSend')}
          </button>
        </form>
      </section>
      <p className="alert">{t('asstScope')}</p>
    </main>
  );
}
