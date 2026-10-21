import { createPortal } from 'react-dom';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import {
  useSyncedHealthProfile,
  checkDrugAllergySafety,
  DrugProfileCheckResult,
} from './allergyData';
import {
  analyzePrescriptionImageWithVision,
  PrescriptionOcrExtractionResult,
} from './geminiApi';
import {
  TreatmentSchedule,
  ScheduledDose,
  SavedPrescription,
  DoseStatus,
  DoseDocumentedOutcome,
  PrescriptionCaptureMethod,
  RadarFrequency,
  useSyncedSchedules,
  useDoseReminderNotifications,
  validatePrescriptionInstructions,
  generateScheduleDoses,
  getDoseStatus,
  calculateScheduleProgress,
  formatLocalDateYYYYMMDD,
  computeEndDate,
  calculateAutoDoseTimes,
  addMinutesToTime,
  formatTime12Hour,
  formatTimestampReadable,
  formatRouteLabel,
  formatFrequencyLabel,
  formatVerificationStatusLabel,
  formatCaptureMethodLabel,
  formatDocumentedOutcomeLabel,
  downloadScheduleIcs,
  downloadTreatmentReportJson,
} from './trackerData';

export interface CoMedItem {
  id: string;
  nameAr: string;
  nameEn: string;
  examplesAr: string;
  examplesEn: string;
  icon: string;
}

export const CO_MEDICATIONS: CoMedItem[] = [
  {
    id: 'calcium_dairy',
    nameAr: 'منتجات الألبان ومكملات الكالسيوم',
    nameEn: 'Dairy Products & Calcium Supplements',
    examplesAr: 'الحليب، الجبن، أوستيوكير (Osteocare)، كالسيترون',
    examplesEn: 'Milk, cheese, Osteocare, Calcitron',
    icon: '🥛',
  },
  {
    id: 'iron_zinc',
    nameAr: 'فيتامينات الحديد والزنك',
    nameEn: 'Iron & Zinc Supplements',
    examplesAr: 'فيروترون (Ferrotron)، فيروجلوبين، زنكترون',
    examplesEn: 'Ferrotron, Feroglobin, Zinctron',
    icon: '🩸',
  },
  {
    id: 'antacids',
    nameAr: 'أدوية الحموضة والمعدة',
    nameEn: 'Antacids & Stomach Protectors',
    examplesAr: 'مالوكس، جافيسكون، أنتودين، أوميبرازول',
    examplesEn: 'Maalox, Gaviscon, Antodine, Omeprazole',
    icon: '🛡️',
  },
  {
    id: 'nsaids',
    nameAr: 'المسكنات ومضادات الالتهاب (NSAIDs)',
    nameEn: 'NSAID Painkillers',
    examplesAr: 'كتافلام، بروفين، كيتوفان، فولتارين',
    examplesEn: 'Cataflam, Brufen, Ketofan, Voltaren',
    icon: '💊',
  },
  {
    id: 'paracetamol',
    nameAr: 'باراسيتامول (خافض حرارة ومسكن آمن)',
    nameEn: 'Paracetamol / Acetaminophen',
    examplesAr: 'بانادول، سيتال، أبيمول، أدول',
    examplesEn: 'Panadol, Cetal, Abimol, Adol',
    icon: '🌡️',
  },
  {
    id: 'probiotics',
    nameAr: 'البروبيوتيك والزبادي (الخمائر النافعة)',
    nameEn: 'Probiotics & Yogurt',
    examplesAr: 'لاكتيول فورت (Lacteol Fort)، لينكس، زبادي طبيعي',
    examplesEn: 'Lacteol Fort, Linex, Natural Yogurt',
    icon: '🥣',
  },
  {
    id: 'warfarin',
    nameAr: 'أدوية السيولة ومنع التجلط',
    nameEn: 'Blood Thinners (Warfarin)',
    examplesAr: 'ماريفان (Marevan)، وارفارين',
    examplesEn: 'Marevan, Warfarin',
    icon: '❤️',
  },
  {
    id: 'statins',
    nameAr: 'أدوية الكوليسترول والدهون',
    nameEn: 'Cholesterol Statins',
    examplesAr: 'أتور (Ator)، ليبيتور (Lipitor)، زوكور',
    examplesEn: 'Ator, Lipitor, Simvastatin',
    icon: '🫀',
  },
  {
    id: 'contraceptives',
    nameAr: 'أقراص منع الحمل الهرمونية',
    nameEn: 'Oral Contraceptive Pills',
    examplesAr: 'ياسمين، جينيرا، ميكروجينون',
    examplesEn: 'Yasmin, Gynera, Microgynon',
    icon: '🌸',
  },
];

interface RadarFinding {
  coMedId: string;
  coMedName: string;
  level: 'danger' | 'separate' | 'safe';
  titleAr: string;
  titleEn: string;
  ruleAr: string;
  ruleEn: string;
}

export default function PrescriptionRadar() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user, openAuthModal } = useAuth();
  const { profile } = useSyncedHealthProfile();

  const {
    schedules,
    setSchedules,
    deleteScheduleById,
    updateDoseStatus,
    prescriptions,
    setPrescriptions,
    deletePrescriptionById,
    treatmentEvents,
    recordTreatmentEvents,
    radarWorkspace,
    updateRadarWorkspace,
    initialLoading,
    syncStatus,
    syncError,
    lastSyncedAt,
    retrySync,
    isAuthenticated,
  } = useSyncedSchedules();

  const {
    notifSupported,
    notifPermission,
    notifError,
    activeDueBanner,
    setActiveDueBanner,
    requestNotifPermission,
    sendTestNotification,
  } = useDoseReminderNotifications(schedules, isAr);

  const selectedAbx = radarWorkspace.selectedAbx;
  const frequency = radarWorkspace.frequency;
  const firstDoseTime = radarWorkspace.firstDoseTime || '08:00';
  const selectedCoMeds = radarWorkspace.selectedCoMeds;

  const setSelectedAbx = (val: string) => updateRadarWorkspace({ selectedAbx: val });
  const setFrequency = (val: RadarFrequency) => updateRadarWorkspace({ frequency: val });
  const setFirstDoseTime = (val: string) => updateRadarWorkspace({ firstDoseTime: val });

  // Automatically calculated daily dose times from `firstDoseTime` + `frequency`
  const autoRadarDoseTimes = useMemo(
    () => calculateAutoDoseTimes(firstDoseTime, frequency),
    [firstDoseTime, frequency]
  );

  function toggleCoMed(id: string) {
    const next = selectedCoMeds.includes(id)
      ? selectedCoMeds.filter((x) => x !== id)
      : [...selectedCoMeds, id];
    updateRadarWorkspace({ selectedCoMeds: next });
  }

  const currentAbx = useMemo(
    () => ACTIVE_INGREDIENTS.find((a) => a.id === selectedAbx) || ACTIVE_INGREDIENTS[0],
    [selectedAbx]
  );

  // Allergy safety check against patient's synced Health Profile
  const allergyCheck = useMemo<DrugProfileCheckResult>(
    () => checkDrugAllergySafety(selectedAbx, profile.allergies),
    [selectedAbx, profile.allergies]
  );

  // Modal & Form states for capturing/verifying/saving a prescription into the cross-device tracker
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);
  const [medName, setMedName] = useState('');
  const [prescribedDose, setPrescribedDose] = useState('');
  const [route, setRoute] = useState<string>('oral');
  const [scheduleFreq, setScheduleFreq] = useState<string>('twice_daily');
  const [modalFirstDoseTime, setModalFirstDoseTime] = useState('08:00');
  const [doseTimes, setDoseTimes] = useState<string[]>(['08:00', '20:00']);
  const [startDate, setStartDate] = useState(() => formatLocalDateYYYYMMDD());
  const [durationDays, setDurationDays] = useState<number | ''>(7);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string>(() => new Date().toISOString());

  // Prescription Capture & OCR / Verification states
  const [captureMethod, setCaptureMethod] = useState<PrescriptionCaptureMethod>('manual_entry');
  const [isOcrUnverified, setIsOcrUnverified] = useState(false);
  const [verifiedByPatient, setVerifiedByPatient] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [ocrFileName, setOcrFileName] = useState<string>('');
  const [ocrExtraction, setOcrExtraction] = useState<PrescriptionOcrExtractionResult | null>(null);
  const [rawExtractedText, setRawExtractedText] = useState<string>('');

  // Dose documentation modal & duplicate guard feedback banner
  const [doseFeedbackBanner, setDoseFeedbackBanner] = useState<{
    type: 'warning' | 'success';
    text: string;
  } | null>(null);
  const [docModalTarget, setDocModalTarget] = useState<{
    scheduleId: string;
    dose: ScheduledDose;
    medicineName: string;
  } | null>(null);
  const [docModalStatus, setDocModalStatus] = useState<'taken' | 'missed'>('taken');
  const [docModalOutcome, setDocModalOutcome] = useState<DoseDocumentedOutcome>('taken_on_time');
  const [docModalNote, setDocModalNote] = useState('');

  // Check if Scan.tsx passed a pending scanned drug draft via sessionStorage
  useEffect(() => {
    try {
      const pendingRaw = sessionStorage.getItem('aa_pending_prescription_draft');
      if (pendingRaw) {
        sessionStorage.removeItem('aa_pending_prescription_draft');
        const parsed = JSON.parse(pendingRaw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.matchedIngredientId && ACTIVE_INGREDIENTS.some((a) => a.id === parsed.matchedIngredientId)) {
            updateRadarWorkspace({ selectedAbx: parsed.matchedIngredientId });
          }
          setEditingScheduleId(null);
          setEditingPrescriptionId(null);
          setMedName(parsed.detectedDrugName || '');
          setPrescribedDose(''); // Never invent a dose from a package scan
          setRoute('');
          setScheduleFreq('');
          setDoseTimes([]);
          setDurationDays('');
          setNotes('');
          setCaptureMethod('scanner_import');
          setIsOcrUnverified(Boolean(parsed.isUnverifiedOcr));
          setVerifiedByPatient(false);
          setRawExtractedText(parsed.rawExtractedText || '');
          setOcrExtraction(null);
          setOcrError(null);
          setFormError('');
          setShowSaveModal(true);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live validation of prescription instructions in the modal
  const liveValidation = useMemo(
    () =>
      validatePrescriptionInstructions(
        {
          antibioticId: selectedAbx,
          medicineName: medName,
          prescribedDose,
          route,
          frequency: scheduleFreq,
          doseTimes,
          durationDays: durationDays === '' ? null : Number(durationDays),
          notes,
          coMedications: selectedCoMeds,
          rawExtractedText,
          isOcrUnverified,
          verifiedByPatient,
          editingScheduleId,
        },
        schedules,
        profile.allergies
      ),
    [
      selectedAbx,
      medName,
      prescribedDose,
      route,
      scheduleFreq,
      doseTimes,
      durationDays,
      notes,
      selectedCoMeds,
      rawExtractedText,
      isOcrUnverified,
      verifiedByPatient,
      editingScheduleId,
      schedules,
      profile.allergies,
    ]
  );

  // Analyze multi-drug prescription interactions & timing rules
  const findings = useMemo<RadarFinding[]>(() => {
    const list: RadarFinding[] = [];
    const isQuinolone = ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'ofloxacin'].includes(selectedAbx);
    const isTetracycline = ['doxycycline', 'tetracycline'].includes(selectedAbx);
    const isMacrolide = ['azithromycin', 'clarithromycin', 'erythromycin', 'spiramycin'].includes(selectedAbx);
    const isMetro = ['metronidazole', 'tinidazole'].includes(selectedAbx);

    selectedCoMeds.forEach((cid) => {
      const item = CO_MEDICATIONS.find((c) => c.id === cid);
      if (!item) return;
      const name = isAr ? item.nameAr : item.nameEn;

      if (cid === 'calcium_dairy') {
        if (isQuinolone || isTetracycline) {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'separate',
            titleAr: '⚠️ تعارض امتصاص قوي (مخلبة كيميائية Chelation)',
            titleEn: '⚠️ Major Absorption Chelation — Separate by 2 Hours',
            ruleAr:
              'الكالسيوم والحليب يرتبطان بالمضاد الحيوي في المعدة ويمنعان امتصاصه بنسبة تصل إلى 50%. افصل بينهما ساعتين على الأقل.',
            ruleEn:
              'Calcium and dairy bind to this antibiotic in the gut, reducing absorption by up to 50%. Separate by at least 2 hours.',
          });
        } else {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'safe',
            titleAr: '✅ لا يوجد تعارض في الامتصاص مع الألبان',
            titleEn: '✅ No Absorption Conflict with Dairy',
            ruleAr: 'يمكن تناول منتجات الألبان بأمان مع هذا المضاد الحيوي دون تأثر مفعوله.',
            ruleEn: 'Dairy products do not block the absorption of this antibiotic.',
          });
        }
      } else if (cid === 'iron_zinc') {
        if (isQuinolone || isTetracycline || selectedAbx === 'cefdinir') {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'separate',
            titleAr: '⚠️ فصل زمني إلزامي (ساعتين إلى 3 ساعات)',
            titleEn: '⚠️ Mandatory 2–3 Hour Separation',
            ruleAr:
              'أقراص الحديد والزنك تُبطل امتصاص هذا المضاد الحيوي إذا أُخذت في نفس الوقت. خذ الحديد بعد جرعة المضاد بـ 3 إلى 4 ساعات على الأقل.',
            ruleEn:
              'Iron and zinc supplements strongly chelate this antibiotic. Take iron at least 3–4 hours apart from your antibiotic dose.',
          });
        } else {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'safe',
            titleAr: '✅ آمن ويفضل الفصل ساعة لراحة المعدة',
            titleEn: '✅ Safe (1-hour spacing recommended for stomach comfort)',
            ruleAr: 'لا يوجد تفاعل كيميائي مباشر، ويفضل أخذ الحديد بعد الغداء لتقليل ثقل المعدة.',
            ruleEn: 'No direct chemical chelation; taking iron after lunch minimizes stomach upset.',
          });
        }
      } else if (cid === 'antacids') {
        if (isQuinolone || isTetracycline || isMacrolide || selectedAbx === 'cefuroxime') {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'separate',
            titleAr: '⚠️ مضادات الحموضة تقلل امتصاص المضاد الحيوي',
            titleEn: '⚠️ Antacids Reduce Antibiotic Absorption',
            ruleAr:
              'أملاح الألومنيوم والماغنيسيوم تقلل امتصاص الدواء. يجب الفصل ساعتين على الأقل قبل أو بعد جرعة المضاد الحيوي.',
            ruleEn:
              'Aluminum/magnesium antacids reduce bioavailability. Separate by at least 2 hours before or after the antibiotic.',
          });
        } else {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'safe',
            titleAr: '✅ آمن عند الفصل البسيط',
            titleEn: '✅ Safe with Standard Spacing',
            ruleAr: 'لا يؤثر بشكل جوهري على امتصاص هذا المضاد الحيوي.',
            ruleEn: 'Does not significantly alter absorption of this antibiotic.',
          });
        }
      } else if (cid === 'nsaids') {
        if (isQuinolone) {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'danger',
            titleAr: '🚫 تحذير: تجنب الجمع مع المسكنات القوية (NSAIDs)',
            titleEn: '🚫 Warning: Avoid Combining Quinolones with NSAIDs',
            ruleAr:
              'الجمع بين الفلوروكينولونات (مثل سيبروفار/تافانيك) والمسكنات المضادة للالتهاب (كتافلام/بروفين) يزيد خطر تنبيه الجهاز العصبي والإجهاد الكلوي. راجع الطبيب المعالج أو الصيدلي قبل الجمع بينهما.',
            ruleEn:
              'Combining fluoroquinolones with NSAIDs increases CNS excitation and renal strain risk. Consult your prescribing doctor or pharmacist before combining them.',
          });
        } else {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'separate',
            titleAr: '⚠️ يُؤخذ بعد الأكل فقط مع شرب كوب ماء كامل',
            titleEn: '⚠️ Take Strictly After Meals with Water',
            ruleAr:
              'لتجنب التهاب جدار المعدة أو إجهاد الكلى، لا تأخذ المسكن على معدة فارغة أبداً.',
            ruleEn: 'Never take NSAIDs on an empty stomach to protect gastric mucosa and kidneys.',
          });
        }
      } else if (cid === 'paracetamol') {
        list.push({
          coMedId: cid,
          coMedName: name,
          level: 'safe',
          titleAr: '✅ آمن تماماً ولا يتعارض مع المضاد الحيوي',
          titleEn: '✅ Completely Safe — No Interaction',
          ruleAr:
            'الباراسيتامول لا يتعارض كيميائياً مع المضاد الحيوي عند استخدامه وفق تعليمات الطبيب أو الصيدلي.',
          ruleEn:
            'Paracetamol has no direct absorption or metabolic conflict with this antibiotic when used as directed by your doctor or pharmacist.',
        });
      } else if (cid === 'probiotics') {
        list.push({
          coMedId: cid,
          coMedName: name,
          level: 'separate',
          titleAr: '💡 ممتاز لحماية الأمعاء — بشرط الفصل ساعتين!',
          titleEn: '💡 Great for Gut Protection — Must Separate by 2 Hours!',
          ruleAr:
            'إذا أخذت البروبيوتيك أو الزبادي في نفس لحظة المضاد الحيوي، سيقتل المضاد البكتيريا النافعة فوراً! خذه بعد جرعة المضاد بساعتين.',
          ruleEn:
            'Taking probiotics at the exact same time as the antibiotic kills the beneficial bacteria. Take 2 hours after your antibiotic dose.',
        });
      } else if (cid === 'warfarin') {
        if (isMetro || isMacrolide || isQuinolone || (selectedAbx === 'co-trimoxazole' || selectedAbx === 'sulfamethoxazole-trimethoprim')) {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'danger',
            titleAr: '🚨 تفاعل خطير: يرفع سيولة الدم (INR) وخطر النزيف',
            titleEn: '🚨 High-Risk Interaction: Elevates INR & Bleeding Risk',
            ruleAr:
              'هذا المضاد الحيوي يثبط تكسير الوارفارين في الكبد مما يضاعف خطر النزيف. يجب مراجعة الطبيب فوراً لقياس سيولة الدم (INR) أو تعديل الجرعة.',
            ruleEn:
              'This antibiotic inhibits Warfarin metabolism, sharply increasing bleeding risk. Consult your physician for INR monitoring.',
          });
        } else {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'separate',
            titleAr: '⚠️ راقب تحليل السيولة (INR) عند استخدام أي مضاد حيوي',
            titleEn: '⚠️ Monitor INR During Any Antibiotic Course',
            ruleAr: 'أي مضاد حيوي قد يقلل بكتيريا الأمعاء المنتجة لفيتامين K؛ أبلغ طبيبك دائماً.',
            ruleEn: 'All antibiotics can alter gut vitamin K flora; inform your physician.',
          });
        }
      } else if (cid === 'statins') {
        if (selectedAbx === 'clarithromycin' || selectedAbx === 'erythromycin') {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'danger',
            titleAr: '🚨 تفاعل خطير (CYP3A4): خطر انحلال العضلات',
            titleEn: '🚨 Severe CYP3A4 Interaction: Myopathy Risk',
            ruleAr:
              'كلاريثرومايسين وإريثرومايسين يمنعان تكسير أدوية الكوليسترول (أتور/زوكور). يجب استشارة الطبيب المعالج أو الصيدلي قبل تناولهما معاً.',
            ruleEn:
              'Clarithromycin/Erythromycin strongly inhibit statin metabolism. Consult your prescribing doctor or pharmacist before taking them together.',
          });
        } else {
          list.push({
            coMedId: cid,
            coMedName: name,
            level: 'safe',
            titleAr: '✅ آمن مع جرعة المساء المعتادة',
            titleEn: '✅ Safe with Standard Evening Dose',
            ruleAr: 'لا يوجد تثبيط إنزيمي مباشر مع هذا المضاد الحيوي؛ استمر على جرعة الكوليسترول مساءً.',
            ruleEn: 'No direct CYP3A4 inhibition with this antibiotic; continue evening statin dose.',
          });
        }
      } else if (cid === 'contraceptives') {
        list.push({
          coMedId: cid,
          coMedName: name,
          level: 'separate',
          titleAr: 'ℹ️ تنبيه في حال حدوث قيء أو إسهال شديد',
          titleEn: 'ℹ️ Backup Advice Only if Severe Vomiting/Diarrhea Occurs',
          ruleAr:
            'المضادات الحيوية العادية (غير الريفامبيسين) لا تُبطل مفعول حبوب منع الحمل مباشرة، إلا إذا تسبب المضاد في قيء أو إسهال شديد يمنع امتصاص القرص.',
          ruleEn:
            'Non-rifamycin antibiotics do not directly reduce pill efficacy unless severe vomiting or diarrhea prevents pill absorption.',
        });
      }
    });

    return list;
  }, [selectedAbx, selectedCoMeds, isAr]);

  // Build 24-Hour Smart Daily Schedule slots dynamically from `firstDoseTime` & `autoRadarDoseTimes`
  const dailySlots = useMemo(() => {
    const abxName = isAr ? currentAbx?.nameAr || '' : currentAbx?.nameEn || '';
    const foodRuleAr =
      selectedAbx === 'amoxicillin-clavulanic-acid' ||
      selectedAbx === 'metronidazole' ||
      selectedAbx === 'cefuroxime' ||
      selectedAbx === 'nitrofurantoin'
        ? 'مع بداية وجبة الطعام (لحماية المعدة وزيادة الامتصاص)'
        : selectedAbx === 'azithromycin' || selectedAbx === 'ampicillin-sulbactam'
          ? 'على معدة فارغة أو مع كوب ماء كبير'
          : 'مع كوب ماء كامل (250 مل)';
    const foodRuleEn =
      selectedAbx === 'amoxicillin-clavulanic-acid' ||
      selectedAbx === 'metronidazole' ||
      selectedAbx === 'cefuroxime' ||
      selectedAbx === 'nitrofurantoin'
        ? 'At the start of a meal (to protect stomach & boost absorption)'
        : 'With a full glass of water (250 mL)';

    const slots: Array<{
      hhmm: string;
      timeAr: string;
      timeEn: string;
      badge: string;
      itemsAr: string[];
      itemsEn: string[];
    }> = [];

    const intervalLabelAr =
      frequency === 'q24h'
        ? 'كل 24 ساعة'
        : frequency === 'q12h'
          ? 'كل 12 ساعة'
          : frequency === 'q8h'
            ? 'كل 8 ساعات'
            : 'كل 6 ساعات';
    const intervalLabelEn =
      frequency === 'q24h'
        ? 'Every 24h'
        : frequency === 'q12h'
          ? 'Every 12h'
          : frequency === 'q8h'
            ? 'Every 8h'
            : 'Every 6h';

    // 1. Add all auto-calculated antibiotic doses
    autoRadarDoseTimes.forEach((t, idx) => {
      slots.push({
        hhmm: t,
        timeAr: formatTime12Hour(t, true),
        timeEn: formatTime12Hour(t, false),
        badge: '💊',
        itemsAr: [
          `الجرعة ${idx + 1} (${intervalLabelAr}): ${abxName} — (${foodRuleAr})`,
          ...(idx === 0 && selectedCoMeds.includes('paracetamol')
            ? ['باراسيتامول (عند اللزوم وفق إرشادات الطبيب)']
            : []),
        ],
        itemsEn: [
          `Antibiotic Dose ${idx + 1} (${intervalLabelEn}): ${abxName} — (${foodRuleEn})`,
          ...(idx === 0 && selectedCoMeds.includes('paracetamol')
            ? ['Paracetamol (if needed as directed by doctor)']
            : []),
        ],
      });
    });

    // 2. Probiotics / Yogurt: +2 hours 30 minutes after Dose 1
    if (selectedCoMeds.includes('probiotics')) {
      const probTime = addMinutesToTime(firstDoseTime, 150);
      slots.push({
        hhmm: probTime,
        timeAr: formatTime12Hour(probTime, true),
        timeEn: formatTime12Hour(probTime, false),
        badge: '🥣',
        itemsAr: [
          'البروبيوتيك أو كوب الزبادي الطبيعي (بعد الجرعة الأولى بساعتين ونصف لضمان عدم قتل الخمائر النافعة)',
        ],
        itemsEn: [
          'Probiotic or Natural Yogurt (2.5 hours after Dose 1 so beneficial flora survive)',
        ],
      });
    }

    // 3. Iron / Calcium / Antacids: +3.5 hours after Dose 1 (safely separated from all antibiotic doses)
    const middayMedsAr: string[] = [];
    const middayMedsEn: string[] = [];
    if (selectedCoMeds.includes('iron_zinc')) {
      middayMedsAr.push('كبسولة الحديد / الزنك (مفصولة بـ 3 ساعات ونصف عن جرعة المضاد لمنع تعارض الامتصاص)');
      middayMedsEn.push('Iron / Zinc supplement (safely spaced 3.5 hours after antibiotic dose)');
    }
    if (selectedCoMeds.includes('calcium_dairy')) {
      middayMedsAr.push('مكمل الكالسيوم أو منتجات الألبان (في نافذة الأمان بعيداً عن جرعة المضاد)');
      middayMedsEn.push('Calcium supplement or dairy meal (safely separated from antibiotic)');
    }
    if (selectedCoMeds.includes('antacids')) {
      middayMedsAr.push('دواء الحموضة / المعدة (عند اللزوم بعيداً عن موعد المضاد بساعتين على الأقل)');
      middayMedsEn.push('Antacid / Stomach protector (spaced at least 2 hours from antibiotic)');
    }
    if (middayMedsAr.length > 0) {
      const sepTime = addMinutesToTime(firstDoseTime, 210);
      slots.push({
        hhmm: sepTime,
        timeAr: formatTime12Hour(sepTime, true),
        timeEn: formatTime12Hour(sepTime, false),
        badge: '🛡️',
        itemsAr: middayMedsAr,
        itemsEn: middayMedsEn,
      });
    }

    // 4. Evening Chronic Meds / Contraceptives / Statins
    const nightAr: string[] = [];
    const nightEn: string[] = [];
    if (selectedCoMeds.includes('statins')) {
      nightAr.push('قرص الكوليسترول المسائي (مع مراجعة تنبيه التداخل أعلاه إن وُجد)');
      nightEn.push('Evening Cholesterol Statin (check interaction alert above)');
    }
    if (selectedCoMeds.includes('contraceptives')) {
      nightAr.push('قرص منع الحمل اليومي في موعده الثابت');
      nightEn.push('Daily Oral Contraceptive Pill at its fixed time');
    }
    if (nightAr.length > 0) {
      const nightTime = '22:30';
      slots.push({
        hhmm: nightTime,
        timeAr: formatTime12Hour(nightTime, true),
        timeEn: formatTime12Hour(nightTime, false),
        badge: '🌙',
        itemsAr: nightAr,
        itemsEn: nightEn,
      });
    }

    return slots.sort((a, b) => a.hhmm.localeCompare(b.hhmm));
  }, [currentAbx, selectedAbx, frequency, firstDoseTime, autoRadarDoseTimes, selectedCoMeds, isAr]);

  // Open Save Prescription Modal pre-populated from current Radar analysis + auto-calculated times
  const openSaveFromRadar = (initialMethod: PrescriptionCaptureMethod = 'manual_entry') => {
    setEditingScheduleId(null);
    setEditingPrescriptionId(null);
    setCaptureMethod(initialMethod);
    setOcrError(null);
    setOcrExtraction(null);
    setOcrPreviewUrl(null);
    setOcrFileName('');
    setRawExtractedText('');

    if (initialMethod === 'ocr_upload' || initialMethod === 'camera_capture') {
      // Never pre-fill or invent fields before OCR runs
      setMedName('');
      setPrescribedDose('');
      setRoute('');
      setScheduleFreq('');
      setModalFirstDoseTime(firstDoseTime);
      setDoseTimes([]);
      setStartDate(formatLocalDateYYYYMMDD());
      setDurationDays('');
      setNotes('');
      setIsOcrUnverified(true);
      setVerifiedByPatient(false);
    } else {
      const defaultName = currentAbx
        ? isAr
          ? `${currentAbx.nameAr} (${currentAbx.nameEn})`
          : `${currentAbx.nameEn} (${currentAbx.nameAr})`
        : '';
      setMedName(defaultName);
      setPrescribedDose('');
      setRoute('oral');

      const freqKey =
        frequency === 'q24h'
          ? 'once_daily'
          : frequency === 'q8h'
            ? 'thrice_daily'
            : frequency === 'q6h'
              ? 'four_times_daily'
              : 'twice_daily';
      setScheduleFreq(freqKey);
      setModalFirstDoseTime(firstDoseTime);
      setDoseTimes(calculateAutoDoseTimes(firstDoseTime, freqKey));
      setStartDate(formatLocalDateYYYYMMDD());
      setDurationDays(7);
      setNotes('');
      setIsOcrUnverified(false);
      setVerifiedByPatient(false);
    }

    setFormError('');
    setShowSaveModal(true);
  };

  // Handle Prescription Image Upload or Camera Capture + OCR Extraction
  const handlePrescriptionImageChange = async (
    e: ChangeEvent<HTMLInputElement>,
    method: 'ocr_upload' | 'camera_capture'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCaptureMethod(method);
    setIsOcrUnverified(true);
    setVerifiedByPatient(false); // Never auto-approve an OCR prescription
    setOcrError(null);
    setOcrFileName(file.name);
    setOcrLoading(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
        reader.readAsDataURL(file);
      });

      setOcrPreviewUrl(dataUrl);
      const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const mimeType = file.type || 'image/jpeg';

      const extracted = await analyzePrescriptionImageWithVision(base64Data, mimeType, lang, file.name);
      setOcrExtraction(extracted);
      setRawExtractedText(extracted.rawExtractedText);

      // Populate ONLY readable fields; leave unreadable fields empty so nothing is ever invented!
      if (extracted.matchedIngredientId && ACTIVE_INGREDIENTS.some((a) => a.id === extracted.matchedIngredientId)) {
        setSelectedAbx(extracted.matchedIngredientId);
      }
      setMedName(extracted.detectedDrugName || '');
      setPrescribedDose(extracted.extractedDoseText || '');
      setRoute(extracted.extractedRoute || '');
      setScheduleFreq(extracted.extractedFrequencyKey || '');
      if (extracted.extractedFrequencyKey) {
        setDoseTimes(calculateAutoDoseTimes(modalFirstDoseTime, extracted.extractedFrequencyKey));
      } else {
        setDoseTimes([]);
      }
      setDurationDays(extracted.extractedDurationDays !== null ? extracted.extractedDurationDays : '');
      setNotes(extracted.extractedNotes || '');

      if (extracted.extractedCoMeds.length > 0) {
        const mergedCoMeds = Array.from(new Set([...selectedCoMeds, ...extracted.extractedCoMeds]));
        updateRadarWorkspace({ selectedCoMeds: mergedCoMeds });
      }

      recordTreatmentEvents([
        {
          type: 'ocr_extracted_unverified',
          medicineName: extracted.detectedDrugName || (isAr ? 'روشتة مصورة' : 'Captured Prescription'),
          summaryAr: `📷 تم استخراج بيانات أولية غير موثّقة من صورة الروشتة (${file.name}) — بانتظار المراجعة والتوثيق اليدوي قبل الجدولة.`,
          summaryEn: `📷 Extracted unverified prescription details from image (${file.name}) — awaiting patient/clinician verification before scheduling.`,
        },
      ]);
    } catch {
      setOcrError(
        isAr
          ? 'تعذّر قراءة النص تلقائياً من صورة الروشتة (قد تكون الصورة غير واضحة أو الاتصال غير متاح). تم تفعيل الإدخال اليدوي البديل — يرجى إدخال التعليمات المكتوبة في الروشتة ومراجعتها مع الصيدلي.'
          : 'Could not automatically extract readable text from the prescription image. Manual entry fallback is active — please enter the written instructions and verify with your pharmacist.'
      );
      setMedName('');
      setPrescribedDose('');
      setRoute('');
      setScheduleFreq('');
      setDoseTimes([]);
      setDurationDays('');
    } finally {
      setOcrLoading(false);
      e.target.value = '';
    }
  };

  const openVerifySavedPrescription = (rx: SavedPrescription) => {
    setEditingPrescriptionId(rx.id);
    setEditingScheduleId(rx.linkedScheduleId || null);
    if (rx.antibioticId && ACTIVE_INGREDIENTS.some((a) => a.id === rx.antibioticId)) {
      setSelectedAbx(rx.antibioticId);
    }
    setMedName(rx.medicineName);
    setPrescribedDose(rx.prescribedDose);
    setRoute(rx.route || '');
    setScheduleFreq(rx.frequency || '');
    const startT = rx.firstDoseTime || rx.doseTimes?.[0] || firstDoseTime || '08:00';
    setModalFirstDoseTime(startT);
    setDoseTimes(
      rx.doseTimes && rx.doseTimes.length > 0
        ? rx.doseTimes
        : rx.frequency
          ? calculateAutoDoseTimes(startT, rx.frequency)
          : []
    );
    setStartDate(rx.startDate || formatLocalDateYYYYMMDD());
    setDurationDays(rx.durationDays !== null ? rx.durationDays : '');
    setNotes(rx.notes || '');
    setCaptureMethod(rx.captureMethod);
    setIsOcrUnverified(rx.isOcrUnverified);
    setVerifiedByPatient(Boolean(rx.verifiedByPatient));
    setRawExtractedText(rx.rawExtractedText || '');
    setOcrFileName(rx.imageFileName || '');
    setOcrExtraction(null);
    setOcrError(null);
    setFormError('');
    setShowSaveModal(true);
  };

  const openEditSchedule = (sch: TreatmentSchedule) => {
    setEditingScheduleId(sch.id);
    setEditingPrescriptionId(sch.prescriptionId || null);
    setMedName(sch.medicineName);
    setPrescribedDose(sch.prescribedDose);
    setRoute(sch.route);
    setScheduleFreq(sch.frequency);
    const startT = sch.firstDoseTime || sch.doseTimes[0] || '08:00';
    setModalFirstDoseTime(startT);
    setDoseTimes(sch.doseTimes);
    setStartDate(sch.startDate);
    setDurationDays(sch.durationDays);
    setNotes(sch.notes || '');
    setCaptureMethod(sch.captureMethod || 'manual_entry');
    setIsOcrUnverified(sch.verificationStatus === 'unverified_ocr');
    setVerifiedByPatient(sch.verificationStatus === 'verified_by_patient' || Boolean(sch.verifiedByPatient));
    setRawExtractedText(sch.rawExtractedText || '');
    setOcrExtraction(null);
    setOcrError(null);
    setFormError('');
    setShowSaveModal(true);
  };

  const loadScheduleIntoRadar = (sch: TreatmentSchedule) => {
    const partial: {
      selectedAbx?: string;
      frequency?: RadarFrequency;
      firstDoseTime?: string;
      selectedCoMeds?: string[];
    } = {};
    if (sch.antibioticId && ACTIVE_INGREDIENTS.some((a) => a.id === sch.antibioticId)) {
      partial.selectedAbx = sch.antibioticId;
    } else {
      const matched = ACTIVE_INGREDIENTS.find(
        (a) =>
          sch.medicineName.toLowerCase().includes(a.nameEn.toLowerCase()) ||
          sch.medicineName.includes(a.nameAr)
      );
      if (matched) partial.selectedAbx = matched.id;
    }
    if (sch.frequency === 'once_daily' || sch.frequency === 'q24h') partial.frequency = 'q24h';
    else if (sch.frequency === 'thrice_daily' || sch.frequency === 'q8h') partial.frequency = 'q8h';
    else if (sch.frequency === 'four_times_daily' || sch.frequency === 'q6h') partial.frequency = 'q6h';
    else partial.frequency = 'q12h';

    if (sch.firstDoseTime || sch.doseTimes[0]) {
      partial.firstDoseTime = sch.firstDoseTime || sch.doseTimes[0];
    }
    if (Array.isArray(sch.coMedications)) {
      partial.selectedCoMeds = sch.coMedications;
    }
    updateRadarWorkspace(partial);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When patient changes the number of daily doses in the modal, auto-calculate all dose times from `modalFirstDoseTime`
  const handleScheduleFreqChange = (freq: string) => {
    setScheduleFreq(freq);
    if (freq) {
      setDoseTimes(calculateAutoDoseTimes(modalFirstDoseTime, freq));
    } else {
      setDoseTimes([]);
    }
  };

  // When patient changes the first dose start time in the modal, auto-calculate all remaining dose times!
  const handleModalFirstDoseTimeChange = (newStartTime: string) => {
    setModalFirstDoseTime(newStartTime);
    if (scheduleFreq) {
      setDoseTimes(calculateAutoDoseTimes(newStartTime, scheduleFreq));
    }
  };

  const handleTimeChange = (index: number, val: string) => {
    const updated = [...doseTimes];
    updated[index] = val;
    if (index === 0) {
      setModalFirstDoseTime(val);
    }
    setDoseTimes(updated);
  };

  /**
   * Saves a prescription as an Unverified / Needs-Clarification record in the user's account
   * WITHOUT creating a treatment schedule (for prescriptions that are incomplete, contradictory, or unverified OCR).
   */
  const handleSaveUnverifiedPrescriptionOnly = () => {
    const nowIso = new Date().toISOString();
    const rxId =
      editingPrescriptionId || `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const status = liveValidation.hasBlockingFlags
      ? 'needs_clarification'
      : isOcrUnverified
        ? 'unverified_ocr'
        : 'needs_clarification';

    const savedRx: SavedPrescription = {
      id: rxId,
      antibioticId: selectedAbx,
      medicineName: medName.trim() || (isAr ? 'روشتة غير مكتملة البيانات' : 'Incomplete Prescription'),
      prescribedDose: prescribedDose.trim(),
      route,
      frequency: scheduleFreq,
      firstDoseTime: modalFirstDoseTime,
      doseTimes,
      startDate,
      durationDays: durationDays === '' ? null : Number(durationDays),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      coMedications: [...selectedCoMeds],
      captureMethod,
      ...(rawExtractedText.trim() ? { rawExtractedText: rawExtractedText.trim() } : {}),
      ...(ocrFileName ? { imageFileName: ocrFileName } : {}),
      isOcrUnverified,
      verificationStatus: status,
      verifiedByPatient: false,
      clarificationFlags: liveValidation.flags,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setPrescriptions(
      (prev) => {
        const exists = prev.some((p) => p.id === rxId);
        return exists ? prev.map((p) => (p.id === rxId ? savedRx : p)) : [savedRx, ...prev];
      },
      {
        type: liveValidation.hasBlockingFlags ? 'clarification_flagged' : 'prescription_captured',
        prescriptionId: rxId,
        medicineName: savedRx.medicineName,
        summaryAr: liveValidation.hasBlockingFlags
          ? `🚨 تم حفظ الروشتة (${savedRx.medicineName}) بحالة «تحتاج لتوضيح من الطبيب/الصيدلي» بدون تفعيل جدول جرعات.`
          : `📋 تم حفظ الروشتة (${savedRx.medicineName}) كمسودة غير موثّقة لمراجعتها قبل الجدولة.`,
        summaryEn: liveValidation.hasBlockingFlags
          ? `🚨 Saved prescription (${savedRx.medicineName}) as "Flagged for Professional Clarification" without scheduling doses.`
          : `📋 Saved prescription (${savedRx.medicineName}) as unverified draft pending verification.`,
      }
    );

    setShowSaveModal(false);
    setEditingPrescriptionId(null);
    setEditingScheduleId(null);
  };

  /**
   * Verifies the prescription and activates/updates the Treatment Schedule.
   * Strictly blocked if any required instruction is missing, contradictory, or unverified by the patient.
   */
  const handleSavePrescription = (e: FormEvent) => {
    e.preventDefault();
    if (liveValidation.hasBlockingFlags) {
      const firstFlag = liveValidation.blockingFlags[0];
      setFormError(
        isAr
          ? `لا يمكن تفعيل جدول الجرعات قبل معالجة الملاحظات السريرية: ${firstFlag.messageAr}`
          : `Cannot activate treatment schedule until blocking issues are resolved: ${firstFlag.messageEn}`
      );
      return;
    }

    if (!verifiedByPatient) {
      setFormError(
        isAr
          ? 'يرجى وضع علامة التأكيد بأنك راجعت التعليمات والجرعة من الروشتة الورقية أو مع الطبيب/الصيدلي قبل تفعيل الجدول.'
          : 'Please check the verification box confirming that you have verified these instructions against your physical prescription before scheduling.'
      );
      return;
    }

    setFormError('');
    const nowIso = new Date().toISOString();
    const numericDuration = Number(durationDays);
    const id = editingScheduleId || `sch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const rxId =
      editingPrescriptionId || `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const endDateStr = computeEndDate(startDate, numericDuration);

    const existing = editingScheduleId ? schedules.find((s) => s.id === editingScheduleId) : undefined;
    const generatedDoses = generateScheduleDoses(
      id,
      startDate,
      doseTimes,
      numericDuration,
      existing?.doses
    );

    const verifiedRx: SavedPrescription = {
      id: rxId,
      antibioticId: selectedAbx,
      medicineName: medName.trim(),
      prescribedDose: prescribedDose.trim(),
      route,
      frequency: scheduleFreq,
      firstDoseTime: modalFirstDoseTime,
      doseTimes,
      startDate,
      durationDays: numericDuration,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      coMedications: [...selectedCoMeds],
      captureMethod,
      ...(rawExtractedText.trim() ? { rawExtractedText: rawExtractedText.trim() } : {}),
      ...(ocrFileName ? { imageFileName: ocrFileName } : {}),
      isOcrUnverified: false,
      verificationStatus: 'verified_by_patient',
      verifiedAt: nowIso,
      verifiedByPatient: true,
      clarificationFlags: liveValidation.warningFlags,
      linkedScheduleId: id,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    const newSchedule: TreatmentSchedule = {
      id,
      prescriptionId: rxId,
      antibioticId: selectedAbx,
      medicineName: medName.trim(),
      prescribedDose: prescribedDose.trim(),
      route,
      frequency: scheduleFreq,
      firstDoseTime: modalFirstDoseTime,
      doseTimes,
      startDate,
      durationDays: numericDuration,
      endDate: endDateStr,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      coMedications: [...selectedCoMeds],
      captureMethod,
      verificationStatus: 'verified_by_patient',
      verifiedAt: nowIso,
      verifiedByPatient: true,
      clarificationFlags: liveValidation.warningFlags,
      ...(rawExtractedText.trim() ? { rawExtractedText: rawExtractedText.trim() } : {}),
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      doses: generatedDoses,
    };

    setPrescriptions((prev) => {
      const exists = prev.some((p) => p.id === rxId);
      return exists ? prev.map((p) => (p.id === rxId ? verifiedRx : p)) : [verifiedRx, ...prev];
    });

    const eventsToLog = [
      {
        type: 'prescription_verified' as const,
        prescriptionId: rxId,
        scheduleId: id,
        medicineName: newSchedule.medicineName,
        summaryAr: `✅ تم التحقق من تعليمات الروشتة للدواء (${newSchedule.medicineName} — ${newSchedule.prescribedDose}) وتوثيقها بواسطة المريض.`,
        summaryEn: `✅ Verified prescription instructions for (${newSchedule.medicineName} — ${newSchedule.prescribedDose}).`,
      },
      {
        type: editingScheduleId ? ('schedule_updated' as const) : ('schedule_created' as const),
        prescriptionId: rxId,
        scheduleId: id,
        medicineName: newSchedule.medicineName,
        summaryAr: editingScheduleId
          ? `🗓️ تم تحديث جدول الجرعات للدواء (${newSchedule.medicineName}) لمدة ${newSchedule.durationDays} أيام.`
          : `🗓️ تم إنشاء وتفعيل جدول الجرعات للدواء (${newSchedule.medicineName}) لمدة ${newSchedule.durationDays} أيام (${generatedDoses.length} جرعة).`,
        summaryEn: editingScheduleId
          ? `🗓️ Updated treatment schedule for (${newSchedule.medicineName}) for ${newSchedule.durationDays} days.`
          : `🗓️ Created active treatment schedule for (${newSchedule.medicineName}) for ${newSchedule.durationDays} days (${generatedDoses.length} doses).`,
      },
    ];

    if (editingScheduleId) {
      setSchedules(
        (prev) => prev.map((s) => (s.id === editingScheduleId ? newSchedule : s)),
        eventsToLog
      );
    } else {
      setSchedules((prev) => [newSchedule, ...prev], eventsToLog);
    }

    setShowSaveModal(false);
    setEditingScheduleId(null);
    setEditingPrescriptionId(null);
  };

  const handleDoseAction = (
    scheduleId: string,
    doseId: string,
    newStatus: DoseStatus,
    options?: {
      note?: string;
      documentedOutcome?: DoseDocumentedOutcome;
    }
  ) => {
    const res = updateDoseStatus(scheduleId, doseId, newStatus, options);
    if (!res.updated && (res.messageAr || res.messageEn)) {
      setDoseFeedbackBanner({
        type: 'warning',
        text: isAr ? res.messageAr || '' : res.messageEn || '',
      });
    } else if (res.updated) {
      setDoseFeedbackBanner(null);
    }
  };

  const openDocumentDoseModal = (
    scheduleId: string,
    dose: ScheduledDose,
    medicineName: string
  ) => {
    setDocModalTarget({ scheduleId, dose, medicineName });
    const currentSt = dose.status === 'missed' ? 'missed' : 'taken';
    setDocModalStatus(currentSt);
    setDocModalOutcome(
      dose.documentedOutcome ||
        (currentSt === 'missed' ? 'held_for_clarification' : 'taken_on_time')
    );
    setDocModalNote(dose.note || '');
  };

  const handleSaveDocumentedDose = (e: FormEvent) => {
    e.preventDefault();
    if (!docModalTarget) return;
    handleDoseAction(docModalTarget.scheduleId, docModalTarget.dose.id, docModalStatus, {
      documentedOutcome: docModalOutcome,
      note: docModalNote,
    });
    setDocModalTarget(null);
  };

  const handleDeleteSchedule = (id: string) => {
    if (
      window.confirm(
        isAr
          ? 'هل أنت متأكد من حذف هذه الروشتة وسجل جرعاتها من حسابك؟'
          : 'Are you sure you want to delete this prescription and its dose history?'
      )
    ) {
      deleteScheduleById(id);
    }
  };

  const handlePrintReport = () => {
    setReportGeneratedAt(new Date().toISOString());
    window.setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleExportReportJson = () => {
    downloadTreatmentReportJson({
      patientName: profile.displayName || user?.displayName || undefined,
      userEmail: user?.email,
      syncStatus,
      prescriptions,
      schedules,
      treatmentEvents,
    });
  };

  const unscheduledPrescriptions = useMemo(
    () =>
      prescriptions.filter(
        (rx) =>
          rx.verificationStatus !== 'verified_by_patient' ||
          !rx.linkedScheduleId ||
          !schedules.some((s) => s.id === rx.linkedScheduleId)
      ),
    [prescriptions, schedules]
  );

  const renderSyncBadge = () => {
    if (!isAuthenticated) {
      return (
        <div className="radar-sync-bar local">
          <div>
            <strong>
              👤{' '}
              {isAr
                ? 'وضع الزائر — البيانات محفوظة محلياً على هذا الجهاز فقط'
                : 'Guest Mode — Data Saved Locally on This Device Only'}
            </strong>
            <p className="small" style={{ margin: '2px 0 0' }}>
              {isAr
                ? 'سجّل الدخول بحسابك لحفظ روشتاتك ومواعيد جرعاتك سحابياً وفتحها من أي هاتف أو كمبيوتر آخر.'
                : 'Sign in with your account to synchronize your prescriptions and dose records across all your devices.'}
            </p>
          </div>
          <button type="button" className="btn small" onClick={() => openAuthModal('login')}>
            🔐 {isAr ? 'تسجيل الدخول للمزامنة السحابية' : 'Sign In for Cloud Sync'}
          </button>
        </div>
      );
    }

    if (syncStatus === 'loading') {
      return (
        <div className="radar-sync-bar loading">
          <strong>
            🔄{' '}
            {isAr
              ? 'جارٍ تحميل ومزامنة روشتاتك السحابية من حسابك...'
              : 'Loading and synchronizing your cloud prescriptions...'}
          </strong>
        </div>
      );
    }

    if (syncStatus === 'saving') {
      return (
        <div className="radar-sync-bar saving">
          <strong>
            ⏳{' '}
            {isAr
              ? 'جارٍ حفظ التعديلات في السحابة (Cloud Firestore)...'
              : 'Saving changes to Cloud Firestore...'}
          </strong>
        </div>
      );
    }

    if (syncStatus === 'offline_pending') {
      return (
        <div className="radar-sync-bar offline">
          <div>
            <strong>
              📡{' '}
              {isAr
                ? 'محفوظ محلياً على هذا الجهاز — في انتظار الاتصال بالإنترنت للتأكيد السحابي'
                : 'Saved Locally on This Device — Waiting for Internet Connection to Confirm Cloud Sync'}
            </strong>
            <p className="small" style={{ margin: '2px 0 0' }}>
              {isAr
                ? 'لم يتم تأكيد الحفظ في السحابة بعد بسبب انقطاع الاتصال. سيتم رفع التعديلات تلقائياً فور عودة الإنترنت.'
                : 'Cloud synchronization is not confirmed yet while offline. Changes will sync automatically once reconnected.'}
            </p>
          </div>
          <button type="button" className="btn-secondary small" onClick={retrySync}>
            🔄 {isAr ? 'إعادة المحاولة' : 'Retry Sync'}
          </button>
        </div>
      );
    }

    if (syncStatus === 'error') {
      return (
        <div className="radar-sync-bar error">
          <div>
            <strong>
              ⚠️{' '}
              {isAr
                ? 'تعذر تأكيد الحفظ السحابي (التعديلات محفوظة محلياً على هذا الجهاز فقط حالياً)'
                : 'Cloud Sync Failed (Changes Are Saved Locally on This Device Only)'}
            </strong>
            {syncError && (
              <p className="small" style={{ margin: '2px 0 0' }}>
                {syncError}
              </p>
            )}
          </div>
          <button type="button" className="btn-secondary small" onClick={retrySync}>
            🔄 {isAr ? 'إعادة المحاولة الآن' : 'Retry Cloud Sync'}
          </button>
        </div>
      );
    }

    return (
      <div className="radar-sync-bar synced">
        <div>
          <strong>
            ☁️{' '}
            {isAr
              ? 'تم تأكيد الحفظ والمزامنة السحابية عبر أجهزتك ✓'
              : 'Confirmed Saved & Synced Across Your Devices ✓'}
          </strong>
          <span className="small" style={{ marginInlineStart: '10px', opacity: 0.9 }}>
            ({user?.email || user?.displayName || (isAr ? 'حساب موثق' : 'Authenticated Account')}
            {lastSyncedAt
              ? ` · ${isAr ? 'آخر تأكيد:' : 'Last confirmed:'} ${formatTimestampReadable(lastSyncedAt, isAr)}`
              : ''}
            )
          </span>
        </div>
      </div>
    );
  };

  return (
    <main className="wrap stack">
      {/* Header Banner */}
      <section
        className="card no-print"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          color: '#fff',
          padding: '24px',
          borderRadius: '18px',
        }}
      >
        <span className="badge" style={{ background: '#38bdf825', color: '#7dd3fc', borderColor: '#38bdf850' }}>
          📡 {isAr ? 'أداة الصيدلة الإكلينيكية الذكية + رحلة علاج المريض المتكاملة' : 'Smart Clinical Pharmacy Tool + Complete Patient Treatment Journey'}
        </span>
        <h1 style={{ color: '#fff', margin: '8px 0' }}>
          {isAr
            ? 'رادار فحص «الروشتة الكاملة» ومتابع رحلة العلاج المحفوظة بحسابك'
            : 'Full Prescription Radar & Saved Patient Treatment Journey'}
        </h1>
        <p style={{ color: '#cbd5e1', margin: 0, maxWidth: '820px', lineHeight: 1.65 }}>
          {isAr
            ? 'التقط صورة الروشتة أو ارفعها أو أدخلها يدوياً، وتحقق من اكتمال التعليمات وعدم تعارضها، ثم فعّل جدول جرعاتك اليومي مع حفظ ومزامنة كامل رحلتك العلاجية وتقاريرك عبر أجهزتك.'
            : 'Capture or upload your prescription (or enter it manually), verify instructions for completeness and safety, and track your scheduled doses with full cross-device account synchronization.'}
        </p>
        <div className="row wrapRow" style={{ gap: '10px', marginTop: '14px' }}>
          <button
            type="button"
            className="btn"
            onClick={() => openSaveFromRadar('ocr_upload')}
          >
            📷 {isAr ? 'تصوير / رفع صورة روشتة (OCR)' : 'Upload / Capture Prescription (OCR)'}
          </button>
          <button
            type="button"
            className="btn ghost"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
            onClick={() => openSaveFromRadar('manual_entry')}
          >
            ✍️ {isAr ? 'إدخال الروشتة يدوياً وتفعيل المتابعة' : 'Manual Prescription Entry'}
          </button>
        </div>
      </section>

      {/* Active Due Dose Alert Banner (if triggered while open) */}
      {activeDueBanner && (
        <section className="card no-print" style={{ background: '#ecfdf5', border: '2px solid #10b981', color: '#065f46' }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <strong>🔔 {activeDueBanner}</strong>
            <button type="button" className="btn-secondary small" onClick={() => setActiveDueBanner(null)}>
              {isAr ? 'إغلاق التنبيه' : 'Dismiss'}
            </button>
          </div>
        </section>
      )}

      {/* Duplicate Dose Event / Safety Feedback Banner */}
      {doseFeedbackBanner && (
        <section
          className="card no-print"
          style={{
            background: doseFeedbackBanner.type === 'warning' ? '#fffbeb' : '#ecfdf5',
            border: `2px solid ${doseFeedbackBanner.type === 'warning' ? '#f59e0b' : '#10b981'}`,
            color: doseFeedbackBanner.type === 'warning' ? '#92400e' : '#065f46',
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <strong>{doseFeedbackBanner.text}</strong>
            <button type="button" className="btn-secondary small" onClick={() => setDoseFeedbackBanner(null)}>
              {isAr ? 'حسناً' : 'OK'}
            </button>
          </div>
        </section>
      )}

      {/* Cloud Sync Status Bar */}
      <section className="no-print">{renderSyncBadge()}</section>

      {/* Clinical Safety Disclaimer */}
      <section className="notice quick no-print">
        <strong>⚕️ {isAr ? 'ضوابط السلامة الدوائية:' : 'Clinical Safety Boundaries:'} </strong>
        {isAr
          ? 'هذا الرادار أداة تنظيمية وتثقيفية مساندة؛ لا يعتمد نتائج الـ OCR تلقائياً أبداً، ولا يخترع جرعة أو تكراراً أو مدة علاج أو طريقة إعطاء، ولا يضاعف الجرعات أو يصف جرعة تعويضية. عند وجود أي نقص أو تعارض في الروشتة أو عند نسيان جرعة، راجع الطبيب المعالج أو الصيدلي دائماً.'
          : 'This tool supports prescription organization and safety education; it never auto-approves OCR extractions, never invents a dose, frequency, duration, or route, and never doubles a dose or prescribes a replacement dose. Always clarify missing or contradictory instructions with your prescribing doctor or pharmacist.'}
      </section>

      {/* Step 1: Select Antibiotic, First Dose Start Time & Number of Daily Doses */}
      <section className="card stack no-print">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ margin: 0 }}>
            1️⃣{' '}
            {isAr
              ? 'اختر المضاد الحيوي، ووقت بدء أول جرعة، وعدد الجرعات اليومية:'
              : '1. Select Antibiotic, First Dose Start Time & Daily Dose Count:'}
          </h2>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn-secondary small" onClick={() => openSaveFromRadar('ocr_upload')}>
              📷 {isAr ? 'التقاط/رفع روشتة (OCR)' : 'Capture/Upload Rx (OCR)'}
            </button>
            <button type="button" className="btn small" onClick={() => openSaveFromRadar('manual_entry')}>
              💾 {isAr ? 'توثيق وحفظ هذه الروشتة لمتابعة الجرعات' : 'Verify & Save Prescription to Track'}
            </button>
          </div>
        </div>

        <div className="grid">
          <div>
            <label htmlFor="radar-abx" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              💊 {isAr ? 'المضاد الحيوي في الروشتة:' : 'Prescribed Antibiotic:'}
            </label>
            <select
              id="radar-abx"
              value={selectedAbx}
              onChange={(e) => setSelectedAbx(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px' }}
            >
              {ACTIVE_INGREDIENTS.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {isAr ? `${ing.nameAr} (${ing.nameEn})` : `${ing.nameEn} (${ing.nameAr})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="radar-first-time" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              🕒 {isAr ? 'وقت بدء أول جرعة:' : 'First Dose Start Time:'}
            </label>
            <input
              id="radar-first-time"
              type="time"
              value={firstDoseTime}
              onChange={(e) => setFirstDoseTime(e.target.value || '08:00')}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', fontWeight: 700 }}
            />
          </div>

          <div>
            <label htmlFor="radar-freq" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              🔢 {isAr ? 'عدد الجرعات في اليوم (يحسب باقي المواعيد تلقائياً):' : 'Doses Per Day (Auto-Calculates Schedule):'}
            </label>
            <select
              id="radar-freq"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RadarFrequency)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px' }}
            >
              <option value="q24h">
                {isAr ? 'جرعة واحدة يومياً (كل 24 ساعة)' : '1 Dose Daily (Every 24 hours)'}
              </option>
              <option value="q12h">
                {isAr ? 'جرعتان يومياً (كل 12 ساعة)' : '2 Doses Daily (Every 12 hours)'}
              </option>
              <option value="q8h">
                {isAr ? '3 جرعات يومياً (كل 8 ساعات)' : '3 Doses Daily (Every 8 hours)'}
              </option>
              <option value="q6h">
                {isAr ? '4 جرعات يومياً (كل 6 ساعات)' : '4 Doses Daily (Every 6 hours)'}
              </option>
            </select>
          </div>
        </div>

        {/* Auto-Calculated Dose Times Strip */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'var(--tint)',
            border: '1.5px solid var(--teal)',
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong>
                ✨{' '}
                {isAr
                  ? 'مواعيد الجرعات المحسوبة تلقائياً بناءً على وقت البدء:'
                  : 'Auto-Calculated Daily Dose Times from Your Start Time:'}
              </strong>
              <div className="row wrapRow" style={{ gap: '8px', marginTop: '8px' }}>
                {autoRadarDoseTimes.map((t, i) => (
                  <span
                    key={i}
                    className="badge"
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      padding: '6px 12px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                    }}
                  >
                    💊 {isAr ? `الجرعة ${i + 1}:` : `Dose ${i + 1}:`} {formatTime12Hour(t, isAr)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Allergy Safety Check Banner from Synced Health Profile */}
        <div
          style={{
            marginTop: '4px',
            padding: '12px 16px',
            borderRadius: '12px',
            border:
              allergyCheck.matchLevel === 'exact_match'
                ? '2px solid #ef4444'
                : allergyCheck.matchLevel === 'cross_reactivity'
                  ? '2px solid #f59e0b'
                  : '1px solid var(--line)',
            background:
              allergyCheck.matchLevel === 'exact_match'
                ? '#fef2f2'
                : allergyCheck.matchLevel === 'cross_reactivity'
                  ? '#fffbeb'
                  : 'var(--tint)',
            color:
              allergyCheck.matchLevel === 'exact_match'
                ? '#991b1b'
                : allergyCheck.matchLevel === 'cross_reactivity'
                  ? '#92400e'
                  : 'var(--text)',
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong>
                🛡️ {isAr ? 'فحص سجل الحساسية الدوائية:' : 'Patient Allergy Safety Check:'}{' '}
                {allergyCheck.title[lang]}
              </strong>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {allergyCheck.explanation[lang]}{' '}
                <b>{allergyCheck.clinicalAction[lang]}</b>
              </p>
            </div>
            <Link to="/allergy-checker" className="btn-secondary small">
              {isAr ? 'فاحص الحساسية ←' : 'Allergy Checker →'}
            </Link>
          </div>
        </div>
      </section>

      {/* Step 2: Select Co-Medications in the Prescription */}
      <section className="card stack no-print">
        <h2 style={{ margin: 0 }}>
          2️⃣ {isAr ? 'حدد باقي الأدوية أو المكملات الموجودة معك في الروشتة:' : '2. Select Co-Medications & Supplements in Your Prescription:'}
        </h2>
        <div className="grid">
          {CO_MEDICATIONS.map((cm) => {
            const active = selectedCoMeds.includes(cm.id);
            return (
              <div
                key={cm.id}
                onClick={() => toggleCoMed(cm.id)}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: active ? '2px solid #0284c7' : '1px solid var(--line)',
                  background: active ? 'rgba(2, 132, 199, 0.06)' : undefined,
                  transition: 'all 0.15s ease',
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>{cm.icon}</span>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => {}}
                    style={{ width: '18px', height: '18px' }}
                    aria-label={isAr ? cm.nameAr : cm.nameEn}
                  />
                </div>
                <h3 style={{ margin: '8px 0 4px', fontSize: '1rem' }}>
                  {isAr ? cm.nameAr : cm.nameEn}
                </h3>
                <p className="small muted" style={{ margin: 0 }}>
                  {isAr ? cm.examplesAr : cm.examplesEn}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 3: Radar Findings */}
      <section className="card stack no-print">
        <h2 style={{ margin: 0 }}>
          3️⃣ {isAr ? 'نتيجة فحص رادار الروشتة الكاملة:' : '3. Multi-Drug Prescription Radar Findings:'}
        </h2>
        <div className="stack" style={{ gap: '10px' }}>
          {findings.map((f) => {
            const bg =
              f.level === 'danger' ? '#fef2f2' : f.level === 'separate' ? '#fffbeb' : '#f0fdf4';
            const border =
              f.level === 'danger' ? '#f87171' : f.level === 'separate' ? '#fbbf24' : '#86efac';
            const color =
              f.level === 'danger' ? '#991b1b' : f.level === 'separate' ? '#92400e' : '#065f46';

            return (
              <div
                key={f.coMedId}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  color,
                  borderRadius: '12px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '4px' }}>
                  {f.coMedName} — {isAr ? f.titleAr : f.titleEn}
                </div>
                <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>
                  {isAr ? f.ruleAr : f.ruleEn}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 4: 24-Hour Smart Daily Timeline */}
      <section className="card stack no-print" style={{ borderTop: '4px solid #10b981' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              🗓️ {isAr ? 'جدول تنظيم مواعيد اليوم الذكي (مرتب تلقائياً حسب وقت البدء)' : 'Optimized 24-Hour Smart Medication Schedule'}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? `تم حساب مواعيد المضاد الحيوي (${autoRadarDoseTimes.length} جرعات يومياً بدءاً من ${formatTime12Hour(firstDoseTime, true)}) وفصل المكملات تلقائياً لمنع التعارض:`
                : `Automatically calculated ${autoRadarDoseTimes.length} daily doses starting at ${formatTime12Hour(firstDoseTime, false)} with safe co-medication spacing:`}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn small" onClick={() => openSaveFromRadar('manual_entry')}>
              ➕ {isAr ? 'توثيق وحفظ الروشتة بهذه المواعيد' : 'Verify & Save With These Times'}
            </button>
            <button type="button" className="btn ghost small" onClick={handlePrintReport}>
              🖨️ {isAr ? 'طباعة الجدول والتقرير (PDF)' : 'Print Schedule & Report (PDF)'}
            </button>
          </div>
        </div>

        <div className="stack" style={{ gap: '12px', marginTop: '8px' }}>
          {dailySlots.map((slot, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '14px',
                alignItems: 'flex-start',
                borderInlineStart: '4px solid #0284c7',
                background: 'var(--bg-subtle, #f8fafc)',
              }}
            >
              <div
                style={{
                  minWidth: '115px',
                  padding: '8px 10px',
                  background: '#0284c7',
                  color: '#fff',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                }}
              >
                <div>{slot.badge}</div>
                <div>{isAr ? slot.timeAr : slot.timeEn}</div>
              </div>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <ul style={{ margin: 0, paddingInlineStart: '18px', lineHeight: 1.7 }}>
                  {(isAr ? slot.itemsAr : slot.itemsEn).map((line, k) => (
                    <li key={k} style={{ fontWeight: k === 0 ? 700 : 500 }}>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="row wrapRow" style={{ gap: '10px', marginTop: '8px' }}>
          <Link to={`/medicine/${selectedAbx}`} className="btn">
            💊 {isAr ? 'فتح النشرة السريرية الكاملة للمضاد الحيوي ←' : 'Open Full Antibiotic Monograph →'}
          </Link>
          <Link to="/tracker" className="btn ghost">
            ⏱️ {isAr ? 'فتح صفحة متابع الكورس المستقلة' : 'Open Standalone Course Tracker'}
          </Link>
        </div>
      </section>

      {/* Step 5: Integrated Cross-Device Saved Prescriptions & Treatment Journey */}
      <section className="card stack no-print" style={{ borderTop: '4px solid #0284c7' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              5️⃣{' '}
              {isAr
                ? 'روشتاتي المحفوظة ومتابعة رحلة العلاج عبر الأجهزة'
                : '5. My Saved Prescriptions & Cross-Device Treatment Journey'}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'سجّل جرعاتك اليومية وتابع تقدمك العلاجي؛ جميع الروشتات والجداول وسجلات الجرعات تُحفظ وتتزامن فورياً مع حسابك عبر أجهزتك.'
                : 'Record your daily doses and track treatment adherence; prescriptions, schedules, and dose records synchronize in real time across your signed-in devices.'}
            </p>
          </div>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn-secondary small" onClick={() => openSaveFromRadar('ocr_upload')}>
              📷 {isAr ? 'تصوير / رفع روشتة (OCR)' : 'Capture / Upload Rx (OCR)'}
            </button>
            <button type="button" className="btn small" onClick={() => openSaveFromRadar('manual_entry')}>
              ➕ {isAr ? 'إضافة روشتة وتوثيقها' : 'Add & Verify Prescription'}
            </button>
            {(schedules.length > 0 || prescriptions.length > 0) && (
              <>
                <button type="button" className="btn-secondary small" onClick={handlePrintReport}>
                  🖨️ {isAr ? 'طباعة التقرير / PDF' : 'Print Report / PDF'}
                </button>
                <button type="button" className="btn-secondary small" onClick={handleExportReportJson}>
                  📥 {isAr ? 'تصدير التقرير (JSON)' : 'Export Report (JSON)'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Unverified / Needs-Clarification Saved Prescriptions Queue */}
        {unscheduledPrescriptions.length > 0 && (
          <div className="rx-verification-queue-box">
            <h3 style={{ margin: '0 0 6px' }}>
              📋{' '}
              {isAr
                ? 'روشتات محفوظة بانتظار المراجعة أو استكمال التوضيح الطبي (قبل تفعيل الجدول):'
                : 'Saved Prescriptions Pending Verification or Professional Clarification (Unscheduled):'}
            </h3>
            <p className="small muted" style={{ margin: '0 0 10px' }}>
              {isAr
                ? 'هذه الروشتات تم التقاطها بالـ OCR أو حفظها لوجود نقص/تعارض في التعليمات، ولم يتم تفعيل جدول جرعات لها تلقائياً حفاظاً على سلامتك.'
                : 'These prescriptions were captured via OCR or flagged for missing/contradictory instructions. They are never auto-scheduled until verified.'}
            </p>
            <div className="stack" style={{ gap: '10px' }}>
              {unscheduledPrescriptions.map((rx) => (
                <div key={rx.id} className="rx-queue-card">
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
                        <strong>💊 {rx.medicineName || (isAr ? 'دواء غير محدد' : 'Unspecified Medicine')}</strong>
                        <span
                          className={`verification-badge ${
                            rx.verificationStatus === 'needs_clarification' ? 'clarify' : 'unverified'
                          }`}
                        >
                          {formatVerificationStatusLabel(rx.verificationStatus, isAr)}
                        </span>
                        <span className="badge">{formatCaptureMethodLabel(rx.captureMethod, isAr)}</span>
                      </div>
                      <p className="small" style={{ margin: '4px 0 0' }}>
                        <b>{isAr ? 'الجرعة:' : 'Dose:'}</b>{' '}
                        {rx.prescribedDose || (isAr ? 'غير مقروءة/غير محددة' : 'Missing/Unreadable')} ·{' '}
                        <b>{isAr ? 'الطريقة:' : 'Route:'}</b> {formatRouteLabel(rx.route, isAr)} ·{' '}
                        <b>{isAr ? 'التكرار:' : 'Frequency:'}</b> {formatFrequencyLabel(rx.frequency, isAr)} ·{' '}
                        <b>{isAr ? 'المدة:' : 'Duration:'}</b>{' '}
                        {rx.durationDays ? `${rx.durationDays} ${isAr ? 'أيام' : 'days'}` : isAr ? 'غير محددة' : 'Missing'}
                      </p>
                      {rx.clarificationFlags.length > 0 && (
                        <ul className="small" style={{ margin: '6px 0 0', paddingInlineStart: '18px', color: '#991b1b' }}>
                          {rx.clarificationFlags.map((fl, idx) => (
                            <li key={idx}>{isAr ? fl.messageAr : fl.messageEn}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="row wrapRow" style={{ gap: '6px' }}>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => openVerifySavedPrescription(rx)}
                      >
                        🔍 {isAr ? 'مراجعة وتوثيق وتفعيل الجدول' : 'Review, Verify & Schedule'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary danger small"
                        onClick={() => deletePrescriptionById(rx.id)}
                      >
                        🗑️ {isAr ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Browser Reminders & Honest Limitations Banner (Priority 5) */}
        <div className="reminder-limitations-box">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong>
                🔔 {isAr ? 'كيف تعمل إشعارات مواعيد الجرعات؟' : 'How Do Dose Notifications Work?'}
              </strong>
              <p className="small" style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
                {isAr
                  ? 'عند تفعيل إشعارات المتصفح، يظهر لك إشعار منبثق خارجي على شاشة الهاتف أو الكمبيوتر (System Notification) بالإضافة إلى تنبيه داخل الصفحة طالما أن المتصفح مفتوح. أما إذا أغلقت المتصفح تماماً، فلا تعمل إشعارات الويب الخلفية؛ لذلك وفرنا لك أيضاً زر «📅 تحميل منبهات الموبايل (.ics)» داخل كل روشتة لإضافة مواعيد الجرعات لمنبه وتقويم هاتفك مباشرةً!'
                  : 'When browser notifications are enabled, a system notification pops up on your screen (along with an in-page banner) while the browser remains open. Web notifications cannot fire when the browser is completely closed; click "📅 Phone Alarms (.ics)" on any saved prescription for native calendar alarms.'}
              </p>
              {notifError && (
                <p className="small" style={{ margin: '6px 0 0', color: '#b45309', fontWeight: 700 }}>
                  ⚠️ {notifError}
                </p>
              )}
            </div>
            <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
              {!notifSupported || notifPermission === 'unsupported' ? (
                <span className="notif-pill">
                  ℹ️ {isAr ? 'إشعارات المتصفح غير مدعومة (استخدم منبهات .ics)' : 'Browser Notifications Unsupported (Use .ics Alarms)'}
                </span>
              ) : notifPermission === 'granted' ? (
                <>
                  <span className="notif-pill active">
                    🔔 {isAr ? 'تنبيهات المتصفح مفعّلة أثناء فتح الموقع' : 'In-Browser Reminders Active'}
                  </span>
                  <button type="button" className="btn-secondary small" onClick={sendTestNotification}>
                    🔔 {isAr ? 'تجربة التنبيه' : 'Test Alert'}
                  </button>
                </>
              ) : notifPermission === 'denied' ? (
                <span className="notif-pill" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#f87171' }}>
                  🔕 {isAr ? 'الإشعارات محظورة من المتصفح (استخدم منبهات .ics)' : 'Notifications Blocked in Browser (Use .ics Alarms)'}
                </span>
              ) : (
                <button type="button" className="btn-secondary small" onClick={requestNotifPermission}>
                  🔔 {isAr ? 'تفعيل تنبيهات المتصفح' : 'Enable Browser Reminders'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Safe Missed-Dose Clinical Guidance (Priority 3) */}
        <div className="safe-missed-dose-box">
          <strong>
            ⚕️{' '}
            {isAr
              ? 'إرشادات السلامة عند تأخر أو نسيان الجرعة (مهم جداً):'
              : 'Safe Clinical Guidance for Overdue or Missed Doses:'}
          </strong>
          <ul className="small" style={{ margin: '6px 0 0', paddingInlineStart: '20px', lineHeight: 1.65 }}>
            <li>
              {isAr
                ? 'مرور موعد الجرعة المجدول يضعها في حالة «متأخرة غير مؤكدة» (Overdue — Unconfirmed / لم يُسجّل قرارها) ولا يعتبرها فائتة تلقائياً حتى تؤكد أنت ما حدث.'
                : 'Passing a scheduled time marks the dose as "Overdue (Unconfirmed — Missing Record)" rather than automatically missed until you confirm its status.'}
            </li>
            <li>
              {isAr
                ? 'ممنوع تماماً مضاعفة الجرعة، أو أخذ جرعة إضافية، أو اتخاذ قرار تلقائي بتخطي الجرعة أو تعويضها من تلقاء نفسك.'
                : 'Never double a dose, never take an extra dose, and do not automatically skip or replace a dose on your own.'}
            </li>
            <li>
              {isAr
                ? 'تواصل مع الطبيب المعالج أو الصيدلي فوراً لمعرفة التصرف الصحيح والمخصص لنوع المضاد الحيوي وحالتك الصحية.'
                : 'Contact your prescribing doctor or pharmacist for medicine-specific instructions tailored to your prescription.'}
            </li>
          </ul>
        </div>

        {/* Initial Cloud Loading Guard */}
        {initialLoading ? (
          <div className="card center" style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '10px' }} aria-hidden="true">
              ☁️
            </div>
            <h3 style={{ margin: '0 0 6px' }}>
              {isAr
                ? 'جارٍ استرجاع روشتاتك وسجل جرعاتك من السحابة...'
                : 'Loading your saved prescriptions and dose history from the cloud...'}
            </h3>
            <p className="small muted" style={{ margin: 0 }}>
              {isAr
                ? 'يرجى الانتظار لحظات بينما نقوم بمزامنة بياناتك العلاجية الخاصة بحسابك.'
                : 'Please wait a moment while we synchronize your account’s treatment records.'}
            </p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="card stack empty-tracker" style={{ margin: 0 }}>
            <span className="empty-icon">💊</span>
            <h3>
              {isAr
                ? 'لا توجد جداول علاجية مفعّلة حالياً'
                : 'No Active Verified Treatment Schedules'}
            </h3>
            <p className="muted">
              {isAr
                ? 'اضغط على «تصوير / رفع روشتة (OCR)» أو «إضافة روشتة وتوثيقها» للتحقق من تعليمات الروشتة وبدء تتبع الجرعات عبر أجهزتك.'
                : 'Click "Capture / Upload Rx (OCR)" or "Add & Verify Prescription" to verify your prescription instructions and start tracking doses across devices.'}
            </p>
            <div className="row wrapRow" style={{ marginTop: '8px', gap: '8px', justifyContent: 'center' }}>
              <button type="button" className="btn" onClick={() => openSaveFromRadar('ocr_upload')}>
                📷 {isAr ? 'رفع صورة روشتة أو التقاطها بالكاميرا' : 'Upload or Capture Prescription Image'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => openSaveFromRadar('manual_entry')}>
                ✍️ {isAr ? 'إدخال الروشتة يدوياً وتفعيل المتابعة' : 'Enter Prescription Manually'}
              </button>
            </div>
          </div>
        ) : (
          <div className="stack" style={{ gap: '18px' }}>
            {schedules.map((sch) => {
              const {
                totalDoses,
                takenCount,
                missedCount,
                unconfirmedCount,
                upcomingCount,
                progressPercent,
              } = calculateScheduleProgress(sch);

              // Group doses by day
              const dayGroups: Record<number, ScheduledDose[]> = {};
              sch.doses.forEach((d) => {
                if (!dayGroups[d.dayNumber]) dayGroups[d.dayNumber] = [];
                dayGroups[d.dayNumber].push(d);
              });

              const recordedHistory = sch.doses
                .filter((d) => d.status === 'taken' || d.status === 'missed')
                .sort((a, b) => {
                  const tA = a.statusUpdatedAt || a.takenAt || a.missedAt || a.scheduledTime;
                  const tB = b.statusUpdatedAt || b.takenAt || b.missedAt || b.scheduledTime;
                  return tB.localeCompare(tA);
                });

              const coMedLabels = (sch.coMedications || [])
                .map((cid) => {
                  const found = CO_MEDICATIONS.find((c) => c.id === cid);
                  return found ? (isAr ? found.nameAr : found.nameEn) : cid;
                })
                .filter(Boolean);

              return (
                <div key={sch.id} className="card stack schedule-card" style={{ margin: 0 }}>
                  <div className="schedule-header">
                    <div>
                      <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <h3 className="sch-title" style={{ margin: 0 }}>
                          💊 {sch.medicineName}
                        </h3>
                        <span className="verification-badge verified">
                          {formatVerificationStatusLabel(sch.verificationStatus, isAr)}
                        </span>
                        {sch.captureMethod && (
                          <span className="badge">
                            {formatCaptureMethodLabel(sch.captureMethod, isAr)}
                          </span>
                        )}
                      </div>
                      <p className="sch-meta">
                        <b>{isAr ? 'الجرعة الموصوفة:' : 'Prescribed Dose:'}</b> {sch.prescribedDose} ·{' '}
                        <b>{isAr ? 'طريقة الاستعمال:' : 'Route:'}</b> {formatRouteLabel(sch.route, isAr)} ·{' '}
                        <b>{isAr ? 'المدة:' : 'Duration:'}</b> {sch.durationDays}{' '}
                        {isAr ? 'أيام' : 'days'} ({sch.startDate} → {sch.endDate})
                      </p>
                      <p className="sch-meta" style={{ marginTop: '4px' }}>
                        <b>{isAr ? 'مواعيد الجرعات اليومية:' : 'Scheduled Times:'}</b>{' '}
                        {sch.doseTimes.map((t) => formatTime12Hour(t, isAr)).join(' ، ')}
                      </p>
                      {coMedLabels.length > 0 && (
                        <p className="sch-meta" style={{ marginTop: '4px' }}>
                          <b>{isAr ? 'الأدوية والمكملات المصاحبة بالروشتة:' : 'Co-Medications in Prescription:'}</b>{' '}
                          {coMedLabels.join(isAr ? ' ، ' : ', ')}
                        </p>
                      )}
                      {sch.notes && (
                        <p className="sch-notes">
                          📝 <b>{isAr ? 'تعليمات الطبيب/الصيدلي:' : 'Prescribed Instructions:'}</b>{' '}
                          <i>{sch.notes}</i>
                        </p>
                      )}
                    </div>

                    <div className="sch-actions" style={{ flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-secondary small"
                        onClick={() => downloadScheduleIcs(sch, isAr)}
                        title={isAr ? 'إضافة مواعيد الجرعات لتقويم ومنبه الهاتف' : 'Add dose alarms to phone calendar'}
                      >
                        📅 {isAr ? 'منبهات الموبايل (.ics)' : 'Phone Alarms (.ics)'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary small"
                        onClick={() => loadScheduleIntoRadar(sch)}
                      >
                        📡 {isAr ? 'عرض في الرادار' : 'Load in Radar'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary small"
                        onClick={() => openEditSchedule(sch)}
                      >
                        ✏️ {isAr ? 'تعديل' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary danger small"
                        onClick={() => handleDeleteSchedule(sch.id)}
                      >
                        🗑️ {isAr ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {/* 5-KPI Grid Explicitly Separating Missing Records vs Confirmed Missed Doses */}
                  <div className="kpi-grid">
                    <div className="kpi-item">
                      <span className="kpi-num">{totalDoses}</span>
                      <span className="kpi-label">{isAr ? 'إجمالي الجرعات' : 'Total Doses'}</span>
                    </div>
                    <div className="kpi-item taken">
                      <span className="kpi-num">{takenCount}</span>
                      <span className="kpi-label">{isAr ? 'تم أخذها ✅' : 'Taken ✅'}</span>
                    </div>
                    <div className="kpi-item upcoming">
                      <span className="kpi-num">{upcomingCount}</span>
                      <span className="kpi-label">{isAr ? 'قادمة ⏳' : 'Upcoming ⏳'}</span>
                    </div>
                    <div className="kpi-item unconfirmed">
                      <span className="kpi-num">{unconfirmedCount}</span>
                      <span className="kpi-label">
                        {isAr ? 'غير مسجلة (متأخرة غير مؤكدة) ⚠️' : 'Missing Record (Overdue Unconfirmed) ⚠️'}
                      </span>
                    </div>
                    <div className="kpi-item missed">
                      <span className="kpi-num">{missedCount}</span>
                      <span className="kpi-label">
                        {isAr ? 'فائتة مؤكدة صراحةً ❌' : 'Confirmed Missed ❌'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-bar-wrap">
                    <div className="progress-info">
                      <span>{isAr ? 'تقدم الكورس المسجل (بناءً على الجرعات المؤكدة):' : 'Recorded Treatment Progress:'}</span>
                      <b>
                        {progressPercent}% ({takenCount}/{totalDoses})
                      </b>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <small className="muted progress-note">
                      {isAr
                        ? '⚠️ تنبيه: يعكس هذا المؤشر الجرعات التي سجلتها فقط ولا يعني الشفاء السريري التام. أكمل الكورس كاملاً حسب توجيه الطبيب.'
                        : 'Note: Progress reflects recorded doses only and does not indicate clinical cure. Always complete the full prescribed course.'}
                    </small>
                  </div>

                  {/* Safe Alert if any dose is Overdue-Unconfirmed or Explicitly Missed */}
                  {(unconfirmedCount > 0 || missedCount > 0) && (
                    <div className="unconfirmed-banner">
                      <strong>
                        ⚠️{' '}
                        {isAr
                          ? 'تنبيه أمان للجرعات غير المسجلة أو الفائتة:'
                          : 'Safety Notice for Missing Records or Confirmed Missed Doses:'}{' '}
                      </strong>
                      {isAr
                        ? 'الجرعات «المتأخرة غير المؤكدة» هي مواعيد مضت ولم تسجل قرارها بعد (وليست فائتة مؤكدة). إذا كنت قد أخذتها، اضغط «✓ أخذت الجرعة». أما إذا نسيتها فعلاً، فلا تضاعف الجرعة أبداً ولا تأخذ جرعة تعويضية — استشر الطبيب أو الصيدلي.'
                        : '"Overdue (Unconfirmed)" doses are past scheduled times with no recorded entry yet (distinct from Confirmed Missed doses). If you took the dose, click "Mark Taken". If you missed it, never double a dose or take a replacement dose — consult your doctor or pharmacist.'}
                    </div>
                  )}

                  {/* Daily Dose Schedule & Accidental Entry Correction */}
                  <div className="timeline-section">
                    <h4>📅 {isAr ? 'جدول الجرعات اليومي وتوثيق الحالات:' : 'Daily Dose Schedule & Documentation Controls:'}</h4>
                    <div className="timeline-grid">
                      {Object.entries(dayGroups).map(([dayNum, dayDoses]) => (
                        <div key={dayNum} className="day-card">
                          <div className="day-header">
                            <b>{isAr ? `اليوم ${dayNum}` : `Day ${dayNum}`}</b>
                            <span className="day-date">{dayDoses[0]?.scheduledTime.split('T')[0]}</span>
                          </div>
                          <div className="doses-stack">
                            {dayDoses.map((dose) => {
                              const status: DoseStatus = getDoseStatus(dose);
                              const timeDisplay = (dose.scheduledTime.split('T')[1] || '').slice(0, 5);
                              return (
                                <div key={dose.id} className={`dose-item ${status}`}>
                                  <div className="dose-left">
                                    <span className="dose-time">⏰ {formatTime12Hour(timeDisplay, isAr)}</span>
                                    <span className={`status-pill ${status}`}>
                                      {status === 'taken' && (isAr ? 'تم أخذها ✅' : 'Taken ✅')}
                                      {status === 'upcoming' && (isAr ? 'قادمة ⏳' : 'Upcoming ⏳')}
                                      {status === 'unconfirmed' &&
                                        (isAr ? 'لم تُسجّل (متأخرة غير مؤكدة) ⚠️' : 'Missing Record (Unconfirmed) ⚠️')}
                                      {status === 'missed' &&
                                        (isAr ? 'فائتة مؤكدة ❌' : 'Confirmed Missed ❌')}
                                    </span>
                                    {dose.documentedOutcome && (
                                      <small className="muted" style={{ display: 'block', width: '100%', fontSize: '0.74rem' }}>
                                        📌 {formatDocumentedOutcomeLabel(dose.documentedOutcome, isAr)}
                                      </small>
                                    )}
                                    {dose.status === 'taken' && dose.takenAt && (
                                      <small className="muted" style={{ display: 'block', width: '100%', fontSize: '0.74rem' }}>
                                        {isAr ? 'وقت الأخذ الفعلي:' : 'Actual taken time:'}{' '}
                                        {formatTimestampReadable(dose.takenAt, isAr)}
                                      </small>
                                    )}
                                    {dose.status === 'missed' && dose.missedAt && (
                                      <small className="muted" style={{ display: 'block', width: '100%', fontSize: '0.74rem' }}>
                                        {isAr ? 'وقت التوثيق الفعلي:' : 'Recorded timestamp:'}{' '}
                                        {formatTimestampReadable(dose.missedAt, isAr)}
                                      </small>
                                    )}
                                    {dose.note && (
                                      <small className="muted" style={{ display: 'block', width: '100%', fontSize: '0.74rem' }}>
                                        📝 {dose.note}
                                      </small>
                                    )}
                                  </div>

                                  <div className="dose-right" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {status === 'taken' ? (
                                      <>
                                        <button
                                          type="button"
                                          className="undo-btn"
                                          onClick={() => openDocumentDoseModal(sch.id, dose, sch.medicineName)}
                                          title={isAr ? 'إضافة أو تعديل ملاحظة التوثيق' : 'Edit dose note/outcome'}
                                        >
                                          📝 {isAr ? 'ملاحظة' : 'Note'}
                                        </button>
                                        <button
                                          type="button"
                                          className="undo-btn"
                                          onClick={() => handleDoseAction(sch.id, dose.id, 'upcoming')}
                                          title={isAr ? 'تراجع لتصحيح التسجيل بالخطأ' : 'Undo accidental entry'}
                                        >
                                          ↩ {isAr ? 'تراجع' : 'Undo'}
                                        </button>
                                        <button
                                          type="button"
                                          className="undo-btn"
                                          onClick={() => handleDoseAction(sch.id, dose.id, 'missed')}
                                          title={isAr ? 'تصحيح إلى فائتة' : 'Change to Missed'}
                                        >
                                          ✕ {isAr ? 'فائتة' : 'Missed'}
                                        </button>
                                      </>
                                    ) : status === 'missed' ? (
                                      <>
                                        <button
                                          type="button"
                                          className="btn-take"
                                          onClick={() => handleDoseAction(sch.id, dose.id, 'taken')}
                                          title={isAr ? 'تصحيح إلى تم أخذها' : 'Correct to Taken'}
                                        >
                                          ✓ {isAr ? 'أخذتها' : 'Taken'}
                                        </button>
                                        <button
                                          type="button"
                                          className="undo-btn"
                                          onClick={() => openDocumentDoseModal(sch.id, dose, sch.medicineName)}
                                        >
                                          📝 {isAr ? 'ملاحظة' : 'Note'}
                                        </button>
                                        <button
                                          type="button"
                                          className="undo-btn"
                                          onClick={() => handleDoseAction(sch.id, dose.id, 'upcoming')}
                                          title={isAr ? 'إلغاء تحديدها كفائتة' : 'Undo Missed status'}
                                        >
                                          ↩ {isAr ? 'تراجع' : 'Undo'}
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className="btn-take"
                                          onClick={() => handleDoseAction(sch.id, dose.id, 'taken')}
                                        >
                                          ✓ {isAr ? 'أخذت الجرعة' : 'Mark Taken'}
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-missed"
                                          onClick={() => handleDoseAction(sch.id, dose.id, 'missed')}
                                        >
                                          ✕ {isAr ? 'فائتة' : 'Mark Missed'}
                                        </button>
                                        <button
                                          type="button"
                                          className="undo-btn"
                                          onClick={() => openDocumentDoseModal(sch.id, dose, sch.medicineName)}
                                          title={isAr ? 'توثيق سبب تأجيل أو ملاحظة للجرعة' : 'Document note or clinical hold'}
                                        >
                                          📝 {isAr ? 'توثيق' : 'Document'}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Readable Cross-Device Dose History Log */}
                  {recordedHistory.length > 0 && (
                    <div className="dose-history-log">
                      <h4 style={{ margin: '0 0 8px' }}>
                        🕒 {isAr ? 'سجل تاريخ الجرعات الموثّقة (الموعد المجدول مقابل الفعلي):' : 'Recorded Dose History Log (Scheduled vs Actual Timestamp):'}
                      </h4>
                      <div className="tablewrap">
                        <table className="tbl">
                          <thead>
                            <tr>
                              <th>{isAr ? 'اليوم والجرعة' : 'Day & Dose'}</th>
                              <th>{isAr ? 'الموعد المجدول' : 'Scheduled Time'}</th>
                              <th>{isAr ? 'الحالة والتوثيق' : 'Recorded Status'}</th>
                              <th>{isAr ? 'توقيت التسجيل الفعلي' : 'Actual Timestamp'}</th>
                              <th>{isAr ? 'ملاحظات' : 'Notes'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recordedHistory.map((hd) => (
                              <tr key={hd.id}>
                                <td>
                                  {isAr
                                    ? `اليوم ${hd.dayNumber} (الجرعة ${hd.doseNumberInDay})`
                                    : `Day ${hd.dayNumber} (Dose ${hd.doseNumberInDay})`}
                                </td>
                                <td>{hd.scheduledTime.replace('T', ' ').slice(0, 16)}</td>
                                <td>
                                  <div>
                                    {hd.status === 'taken'
                                      ? isAr
                                        ? '✅ تم أخذها'
                                        : '✅ Taken'
                                      : isAr
                                        ? '❌ فائتة مؤكدة'
                                        : '❌ Confirmed Missed'}
                                  </div>
                                  {hd.documentedOutcome && (
                                    <small className="muted">
                                      {formatDocumentedOutcomeLabel(hd.documentedOutcome, isAr)}
                                    </small>
                                  )}
                                </td>
                                <td>
                                  {formatTimestampReadable(
                                    hd.status === 'taken' ? hd.takenAt : hd.missedAt,
                                    isAr
                                  )}
                                </td>
                                <td>{hd.note || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Synced Treatment Journey Audit Events Log */}
        {treatmentEvents.length > 0 && (
          <div className="dose-history-log" style={{ marginTop: '10px' }}>
            <h4 style={{ margin: '0 0 8px' }}>
              📜{' '}
              {isAr
                ? 'سجل أحداث رحلة العلاج المحفوظ في حسابك (يتزامن عبر أجهزتك):'
                : 'Saved Patient Treatment Journey Event Log (Synced Across Devices):'}
            </h4>
            <div className="tablewrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{isAr ? 'الوقت' : 'Timestamp'}</th>
                    <th>{isAr ? 'الدواء' : 'Medication'}</th>
                    <th>{isAr ? 'تفاصيل الحدث' : 'Event Summary'}</th>
                  </tr>
                </thead>
                <tbody>
                  {treatmentEvents.slice(0, 15).map((ev) => (
                    <tr key={ev.id}>
                      <td>{formatTimestampReadable(ev.timestamp, isAr)}</td>
                      <td>{ev.medicineName || '—'}</td>
                      <td>{isAr ? ev.summaryAr : ev.summaryEn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Printable & Exportable Treatment Summary Report (Priority 4) */}
      <section className="card stack printable-treatment-report">
        <div className="row no-print" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              📄 {isAr ? 'تقرير رحلة علاج المريض الشامل (للطباعة أو التصدير)' : 'Complete Patient Treatment Journey Report (Print / Export)'}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'يوضح الخطة العلاجية، حالة توثيق الروشتة، سجل الجرعات بالمواعيد المجدولة والفعلية، مع التمييز الدقيق بين الجرعات غير المسجلة والجرعات الفائتة المؤكدة.'
                : 'Displays the treatment plan, prescription verification status, scheduled vs. actual dose history, and relevant warnings, clearly distinguishing missing records from confirmed missed doses.'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn" onClick={handlePrintReport}>
              🖨️ {isAr ? 'طباعة / حفظ كملف PDF' : 'Print / Save as PDF'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleExportReportJson}>
              📥 {isAr ? 'تصدير التقرير (JSON)' : 'Export Report (JSON)'}
            </button>
          </div>
        </div>

        <div className="report-print-header">
          <h2 style={{ margin: '0 0 4px' }}>
            {isAr
              ? 'تقرير رحلة علاج المريض ومتابعة الروشتة — منصة الوعي بالمضادات الحيوية'
              : 'Patient Treatment Journey & Prescription Report — Antibiotic Awareness'}
          </h2>
          <p className="small" style={{ margin: '0 0 6px' }}>
            <b>{isAr ? 'تاريخ ووقت إصدار التقرير:' : 'Report Generation Date:'}</b>{' '}
            {formatTimestampReadable(reportGeneratedAt, isAr)}
            {profile.displayName ? ` · ${isAr ? 'اسم المريض:' : 'Patient:'} ${profile.displayName}` : ''}
            {user?.email ? ` · ${isAr ? 'الحساب:' : 'Account:'} ${user.email}` : ''}
          </p>
          <div className="report-disclaimer-box">
            <strong>
              ⚠️ {isAr ? 'إخلاء مسؤولية وضوابط السلامة:' : 'Safety & Clinical Disclaimer:'}{' '}
            </strong>
            {isAr
              ? 'هذا التقرير مُدار بواسطة المريض للمتابعة الشخصية ولا يُعد سجلاً سريرياً موثقاً. الجرعات «غير المسجلة (متأخرة غير مؤكدة)» تعني مواعيد مضت ولم يُسجل المريض حالتها بعد، وهي تختلف عن «الجرعات الفائتة المؤكدة صراحةً». لا تضاعف أي جرعة ولا تأخذ جرعة تعويضية دون استشارة الطبيب أو الصيدلي.'
              : 'This report is self-maintained by the patient. "Missing Records (Overdue Unconfirmed)" indicate past dose times with no status recorded yet, and are distinct from "Confirmed Missed Doses". Never double a dose or take an unprescribed replacement dose.'}
          </div>
        </div>

        {prescriptions.length > 0 && (
          <div className="report-block">
            <h3 style={{ margin: '0 0 6px' }}>
              📋 {isAr ? 'حالة توثيق الروشتات المحفوظة:' : 'Saved Prescriptions & Verification Status:'}
            </h3>
            <ul className="small" style={{ margin: 0, paddingInlineStart: '20px', lineHeight: 1.65 }}>
              {prescriptions.map((rx) => (
                <li key={rx.id}>
                  <b>{rx.medicineName}</b> ({rx.prescribedDose || (isAr ? 'جرعة غير محددة' : 'Dose missing')}) —{' '}
                  {formatVerificationStatusLabel(rx.verificationStatus, isAr)} ·{' '}
                  {formatCaptureMethodLabel(rx.captureMethod, isAr)}
                  {rx.verifiedAt ? ` (${formatTimestampReadable(rx.verifiedAt, isAr)})` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="report-block">
          <h3 style={{ margin: '0 0 6px' }}>
            🔬 {isAr ? 'ملخص فحص رادار الروشتة والتنبيهات الدوائية (24 ساعة):' : 'Current 24-Hour Prescription Radar & Safety Warnings:'}
          </h3>
          <p className="small" style={{ margin: '0 0 6px' }}>
            <b>{isAr ? 'المضاد الحيوي المحدد:' : 'Selected Antibiotic:'}</b>{' '}
            {isAr ? `${currentAbx.nameAr} (${currentAbx.nameEn})` : `${currentAbx.nameEn} (${currentAbx.nameAr})`} ·{' '}
            <b>{isAr ? 'وقت بدء أول جرعة:' : 'First Dose Start:'}</b> {formatTime12Hour(firstDoseTime, isAr)} ·{' '}
            <b>{isAr ? 'فحص الحساسية:' : 'Allergy Check:'}</b> {allergyCheck.title[lang]}
          </p>
          <ul className="small" style={{ margin: 0, paddingInlineStart: '20px', lineHeight: 1.6 }}>
            {dailySlots.map((s, i) => (
              <li key={i}>
                <b>{isAr ? s.timeAr : s.timeEn}:</b> {(isAr ? s.itemsAr : s.itemsEn).join(' + ')}
              </li>
            ))}
          </ul>
        </div>

        {schedules.length > 0 && (
          <div className="report-block">
            <h3 style={{ margin: '0 0 8px' }}>
              💊 {isAr ? 'الخطط العلاجية وسجل الجرعات التفصيلي:' : 'Treatment Plans & Detailed Dose History:'}
            </h3>
            {schedules.map((sch) => {
              const stats = calculateScheduleProgress(sch);
              return (
                <div key={sch.id} className="report-schedule-item">
                  <h4 style={{ margin: '0 0 4px' }}>
                    {sch.medicineName} — {sch.prescribedDose} ({sch.startDate} → {sch.endDate})
                  </h4>
                  <p className="small" style={{ margin: '0 0 4px' }}>
                    <b>{isAr ? 'حالة التوثيق:' : 'Verification Status:'}</b>{' '}
                    {formatVerificationStatusLabel(sch.verificationStatus, isAr)} ·{' '}
                    <b>{isAr ? 'طريقة الإدخال:' : 'Capture Method:'}</b>{' '}
                    {formatCaptureMethodLabel(sch.captureMethod, isAr)} ·{' '}
                    <b>{isAr ? 'طريقة الإعطاء:' : 'Route:'}</b> {formatRouteLabel(sch.route, isAr)}
                  </p>
                  <p className="small" style={{ margin: '0 0 6px' }}>
                    <b>{isAr ? 'إجمالي الجرعات:' : 'Total:'}</b> {stats.totalDoses} ·{' '}
                    <b>{isAr ? 'تم أخذها (مؤكدة):' : 'Confirmed Taken:'}</b> {stats.takenCount} ·{' '}
                    <b>{isAr ? 'فائتة مؤكدة صراحةً:' : 'Confirmed Missed:'}</b> {stats.missedCount} ·{' '}
                    <b>{isAr ? 'غير مسجلة (متأخرة غير مؤكدة):' : 'Missing Records (Overdue Unconfirmed):'}</b> {stats.unconfirmedCount} ·{' '}
                    <b>{isAr ? 'قادمة:' : 'Upcoming:'}</b> {stats.upcomingCount} ·{' '}
                    <b>{isAr ? 'نسبة الالتزام المسجلة:' : 'Recorded Progress:'}</b> {stats.progressPercent}%
                  </p>
                  {sch.notes && (
                    <p className="small" style={{ margin: '0 0 6px' }}>
                      <b>{isAr ? 'التعليمات الموصوفة:' : 'Prescribed Instructions:'}</b> {sch.notes}
                    </p>
                  )}
                  <div className="tablewrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>{isAr ? 'اليوم والجرعة' : 'Day & Dose'}</th>
                          <th>{isAr ? 'الموعد المجدول' : 'Scheduled Time'}</th>
                          <th>{isAr ? 'الحالة (مؤكدة / غير مسجلة)' : 'Status (Confirmed vs Missing Record)'}</th>
                          <th>{isAr ? 'توقيت التسجيل الفعلي' : 'Actual Timestamp'}</th>
                          <th>{isAr ? 'ملاحظات' : 'Notes'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sch.doses.map((d) => {
                          const st = getDoseStatus(d);
                          return (
                            <tr key={d.id}>
                              <td>{isAr ? `اليوم ${d.dayNumber} (#${d.doseNumberInDay})` : `Day ${d.dayNumber} (#${d.doseNumberInDay})`}</td>
                              <td>{d.scheduledTime.replace('T', ' ').slice(0, 16)}</td>
                              <td>
                                {st === 'taken' && (isAr ? 'تم أخذها (مؤكدة) ✅' : 'Confirmed Taken ✅')}
                                {st === 'missed' && (isAr ? 'جرعة فائتة مؤكدة صراحةً ❌' : 'Confirmed Missed Dose ❌')}
                                {st === 'unconfirmed' &&
                                  (isAr
                                    ? 'سجل مفقود — متأخرة غير مؤكدة ⚠️'
                                    : 'Missing Record — Overdue Unconfirmed ⚠️')}
                                {st === 'upcoming' && (isAr ? 'قادمة في الجدول ⏳' : 'Upcoming Scheduled ⏳')}
                              </td>
                              <td>
                                {st === 'taken'
                                  ? formatTimestampReadable(d.takenAt, isAr)
                                  : st === 'missed'
                                    ? formatTimestampReadable(d.missedAt, isAr)
                                    : '—'}
                              </td>
                              <td>
                                {[
                                  d.documentedOutcome
                                    ? formatDocumentedOutcomeLabel(d.documentedOutcome, isAr)
                                    : '',
                                  d.note || '',
                                ]
                                  .filter(Boolean)
                                  .join(' — ') || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Save / Capture / Verify Prescription Modal */}
      {showSaveModal &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setShowSaveModal(false)}>
            <div className="modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>
                  {editingScheduleId
                    ? isAr
                      ? 'تعديل وتوثيق بيانات الروشتة والجدول العلاجي'
                      : 'Edit & Verify Prescription Schedule'
                    : isAr
                      ? 'التقاط وتوثيق الروشتة لمتابعة رحلة العلاج عبر أجهزتك'
                      : 'Capture & Verify Prescription for Cross-Device Journey'}
                </h3>
                <button type="button" className="close-btn" onClick={() => setShowSaveModal(false)}>
                  ✕
                </button>
              </div>

              {/* Prescription Capture Controls: Upload Image, Camera Capture, or Manual Fallback */}
              <div className="rx-capture-box">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <strong>
                      📷{' '}
                      {isAr
                        ? 'التقاط صورة الروشتة (OCR) أو الإدخال اليدوي:'
                        : 'Prescription Image Capture (OCR) or Manual Entry:'}
                    </strong>
                    <p className="small muted" style={{ margin: '2px 0 0' }}>
                      {isAr
                        ? 'يمكنك رفع صورة الروشتة أو تصويرها بالكاميرا لاستخراج التفاصيل المقروءة فقط، أو إدخالها يدوياً. لا يتم اعتماد بيانات الـ OCR تلقائياً أبداً.'
                        : 'Upload a prescription photo or capture via camera to extract readable details, or enter manually. OCR data is never auto-approved.'}
                    </p>
                  </div>
                  <div className="row wrapRow" style={{ gap: '8px' }}>
                    <label className="btn-secondary small" style={{ cursor: 'pointer', margin: 0 }}>
                      📁 {isAr ? 'رفع صورة روشتة' : 'Upload Rx Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePrescriptionImageChange(e, 'ocr_upload')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <label className="btn-secondary small" style={{ cursor: 'pointer', margin: 0 }}>
                      📸 {isAr ? 'كاميرا الموبايل' : 'Camera Capture'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePrescriptionImageChange(e, 'camera_capture')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {isOcrUnverified && (
                      <button
                        type="button"
                        className="btn-secondary small"
                        onClick={() => {
                          setCaptureMethod('manual_entry');
                          setIsOcrUnverified(false);
                          setOcrError(null);
                        }}
                      >
                        ✍️ {isAr ? 'تحويل لإدخال يدوي' : 'Switch to Manual Entry'}
                      </button>
                    )}
                  </div>
                </div>

                {ocrLoading && (
                  <div className="ocr-status-banner loading" style={{ marginTop: '10px' }}>
                    ⏳{' '}
                    {isAr
                      ? 'جارٍ قراءة صورة الروشتة واستخراج التفاصيل المقروءة فقط دون تخمين...'
                      : 'Analyzing prescription image and extracting readable details without guessing...'}
                  </div>
                )}

                {ocrError && (
                  <div className="ocr-status-banner error" style={{ marginTop: '10px' }}>
                    ⚠️ {ocrError}
                  </div>
                )}

                {isOcrUnverified && (
                  <div className="ocr-unverified-banner" style={{ marginTop: '10px' }}>
                    <strong>
                      ⚠️{' '}
                      {isAr
                        ? 'بيانات مستخرجة بالـ OCR (غير موثّقة — لا تُعتمد تلقائياً):'
                        : 'Unverified OCR-Extracted Information (Never Auto-Approved):'}
                    </strong>
                    <p className="small" style={{ margin: '4px 0 0' }}>
                      {isAr
                        ? 'تم استخراج الحقول المقروءة فقط وترك الحقول غير الواضحة فارغة (بدون افتراض أي جرعة أو تكرار أو مدة). يرجى مراجعة كل حقل ومطابقته مع الروشتة الورقية أو الصيدلي قبل التوثيق.'
                        : 'Only clearly readable fields were extracted; unreadable fields were left blank (never invented). Please verify every field against your physical prescription before scheduling.'}
                    </p>
                    {ocrPreviewUrl && (
                      <div style={{ marginTop: '8px' }}>
                        <img
                          src={ocrPreviewUrl}
                          alt={isAr ? 'معاينة صورة الروشتة' : 'Prescription preview'}
                          style={{ maxHeight: '110px', borderRadius: '8px', border: '1px solid var(--line)' }}
                        />
                      </div>
                    )}
                    {ocrExtraction && ocrExtraction.unreadableFields.length > 0 && (
                      <p className="small" style={{ margin: '6px 0 0', fontWeight: 700, color: '#991b1b' }}>
                        🔍{' '}
                        {isAr
                          ? `حقول غير مقروءة في الصورة وتحتاج لإدخال/تأكيد يدوي: ${ocrExtraction.unreadableFields.join(' ، ')}`
                          : `Unreadable fields requiring manual entry/clarification: ${ocrExtraction.unreadableFields.join(', ')}`}
                      </p>
                    )}
                    {ocrExtraction && ocrExtraction.contradictionWarnings.length > 0 && (
                      <ul className="small" style={{ margin: '6px 0 0', paddingInlineStart: '18px', color: '#991b1b' }}>
                        {ocrExtraction.contradictionWarnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {formError && <p className="alert danger-alert">{formError}</p>}

              <form onSubmit={handleSavePrescription} className="stack modal-form">
                <div className="form-group">
                  <label>
                    <b>{isAr ? 'اسم المضاد الحيوي كما في الروشتة:' : 'Prescribed Antibiotic Name:'} *</b>
                    {isOcrUnverified && medName && (
                      <span className="ocr-field-tag">
                        {isAr ? '⚠️ مستخرج غير موثّق' : '⚠️ Unverified OCR'}
                      </span>
                    )}
                  </label>
                  <input
                    list="radar-med-suggestions"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder={isAr ? 'مثال: سيبروفلوكساسين / أوجمنتين / زيثروماكس' : 'e.g. Ciprofloxacin / Augmentin / Zithromax'}
                  />
                  <datalist id="radar-med-suggestions">
                    {ACTIVE_INGREDIENTS.map((ing) => (
                      <option
                        key={ing.id}
                        value={isAr ? `${ing.nameAr} (${ing.nameEn})` : `${ing.nameEn} (${ing.nameAr})`}
                      />
                    ))}
                    {EGYPTIAN_COMMERCIAL_PRODUCTS.map((prod) => (
                      <option
                        key={prod.productId}
                        value={isAr ? `${prod.tradeNameAr} (${prod.tradeNameEn})` : `${prod.tradeNameEn} (${prod.tradeNameAr})`}
                      />
                    ))}
                  </datalist>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'الجرعة والتركيز كما في الروشتة:' : 'Prescribed Dose & Strength:'} *</b>
                      {isOcrUnverified && prescribedDose && (
                        <span className="ocr-field-tag">
                          {isAr ? '⚠️ مستخرج غير موثّق' : '⚠️ Unverified OCR'}
                        </span>
                      )}
                    </label>
                    <input
                      value={prescribedDose}
                      onChange={(e) => setPrescribedDose(e.target.value)}
                      placeholder={isAr ? 'مثال: قرص 500 مجم أو 5 مل' : 'e.g. 1 tablet (500mg) or 5ml'}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'طريقة الاستعمال:' : 'Administration Route:'} *</b>
                    </label>
                    <select value={route} onChange={(e) => setRoute(e.target.value)}>
                      <option value="">
                        {isAr ? '— اختر طريقة الاستعمال من الروشتة —' : '— Select Route from Prescription —'}
                      </option>
                      <option value="oral">{isAr ? 'أقراص / كبسول فموي' : 'Oral Tablet/Capsule'}</option>
                      <option value="suspension">{isAr ? 'شراب معلق' : 'Oral Suspension'}</option>
                      <option value="injection">{isAr ? 'حقن (وريد/عضل)' : 'Injection'}</option>
                      <option value="topical">{isAr ? 'موضعي (كريم/مرهم)' : 'Topical'}</option>
                    </select>
                  </div>
                </div>

                {/* First Dose Start Time + Daily Dose Count -> Auto Calculates All Dose Times */}
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>🕒 {isAr ? 'وقت بدء أول جرعة:' : 'First Dose Start Time:'} *</b>
                    </label>
                    <input
                      type="time"
                      value={modalFirstDoseTime}
                      onChange={(e) => handleModalFirstDoseTimeChange(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <b>🔢 {isAr ? 'التكرار اليومي بالروشتة (يحسب الأوقات تلقائياً):' : 'Prescribed Daily Frequency:'} *</b>
                    </label>
                    <select value={scheduleFreq} onChange={(e) => handleScheduleFreqChange(e.target.value)}>
                      <option value="">
                        {isAr ? '— اختر عدد الجرعات يومياً من الروشتة —' : '— Select Doses Per Day —'}
                      </option>
                      <option value="once_daily">{isAr ? 'جرعة واحدة يومياً (كل 24 ساعة)' : '1 dose daily (every 24h)'}</option>
                      <option value="twice_daily">{isAr ? 'جرعتان يومياً (كل 12 ساعة)' : '2 doses daily (every 12h)'}</option>
                      <option value="thrice_daily">{isAr ? '3 جرعات يومياً (كل 8 ساعات)' : '3 doses daily (every 8h)'}</option>
                      <option value="four_times_daily">{isAr ? '4 جرعات يومياً (كل 6 ساعات)' : '4 doses daily (every 6h)'}</option>
                    </select>
                  </div>
                </div>

                {doseTimes.length > 0 && (
                  <div className="form-group">
                    <label>
                      <b>
                        ✨{' '}
                        {isAr
                          ? 'مواعيد الجرعات المحسوبة تلقائياً خلال اليوم (يمكنك تعديل أي موعد عند الحاجة):'
                          : 'Auto-Calculated Scheduled Dose Times (Editable if needed):'}
                      </b>
                    </label>
                    <div className="dose-times-grid">
                      {doseTimes.map((time, idx) => (
                        <div key={idx} className="time-input-group">
                          <small>
                            {isAr ? `الجرعة ${idx + 1}` : `Dose ${idx + 1}`} ({formatTime12Hour(time, isAr)}):
                          </small>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => handleTimeChange(idx, e.target.value)}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'تاريخ بدء العلاج:' : 'Treatment Start Date:'}</b>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'مدة الكورس الموصوفة (بالأيام):' : 'Prescribed Duration (Days):'} *</b>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={durationDays}
                      placeholder={isAr ? 'عدد الأيام بالروشتة' : 'Days on Rx'}
                      onChange={(e) =>
                        setDurationDays(e.target.value === '' ? '' : Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <b>{isAr ? 'تعليمات الطبيب أو الصيدلي في الروشتة:' : 'Prescribed Instructions / Notes:'}</b>
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isAr ? 'مثال: بعد الأكل، مع كوب ماء كامل' : 'e.g. Take after meals with a full glass of water'}
                  />
                </div>

                {/* Live Contradiction & Missing Instruction Clarification Gate */}
                {liveValidation.blockingFlags.length > 0 && (
                  <div className="clarification-gate-box blocking">
                    <strong>
                      🚨{' '}
                      {isAr
                        ? 'تعليمات ناقصة أو متعارضة تتطلب توضيحاً مهنياً (لا يمكن جدولة الجرعات قبل تصحيحها):'
                        : 'Missing or Contradictory Instructions Flagged for Professional Clarification (Scheduling Blocked):'}
                    </strong>
                    <ul className="small" style={{ margin: '6px 0 0', paddingInlineStart: '20px', lineHeight: 1.6 }}>
                      {liveValidation.blockingFlags.map((fl, idx) => (
                        <li key={idx}>{isAr ? fl.messageAr : fl.messageEn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {liveValidation.warningFlags.length > 0 && (
                  <div className="clarification-gate-box warning">
                    <strong>
                      ⚠️{' '}
                      {isAr
                        ? 'تنبيهات الأمان الدوائي والتداخلات:'
                        : 'Medication Safety & Interaction Warnings:'}
                    </strong>
                    <ul className="small" style={{ margin: '6px 0 0', paddingInlineStart: '20px', lineHeight: 1.6 }}>
                      {liveValidation.warningFlags.map((fl, idx) => (
                        <li key={idx}>{isAr ? fl.messageAr : fl.messageEn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mandatory Patient Verification Checkbox before schedule creation */}
                <label className="verification-checkbox-row">
                  <input
                    type="checkbox"
                    checked={verifiedByPatient}
                    onChange={(e) => setVerifiedByPatient(e.target.checked)}
                    disabled={liveValidation.hasBlockingFlags}
                  />
                  <span className="small">
                    <b>
                      {isAr
                        ? 'تأكيد التحقق من الروشتة (إلزامي قبل الجدولة):'
                        : 'Mandatory Prescription Verification:'}
                    </b>{' '}
                    {isAr
                      ? 'أؤكد أنني راجعت اسم الدواء والجرعة وطريقة الاستعمال والتكرار والمدة من الروشتة الورقية الموصوفة لي (أو مع الطبيب/الصيدلي) وأنها صحيحة وغير مخمّنة.'
                      : 'I confirm that I have verified the medicine name, dose, route, frequency, and duration against my physical prescription (or with my doctor/pharmacist) and none of these fields were guessed.'}
                  </span>
                </label>

                <div className="modal-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="submit"
                    className="btn"
                    disabled={!liveValidation.canCreateSchedule}
                    title={
                      !liveValidation.canCreateSchedule
                        ? isAr
                          ? 'أكمل الحقول الناقصة وتأكد من عدم وجود تعارض ثم ضع علامة التحقق لتفعيل الجدول'
                          : 'Resolve missing/contradictory fields and check the verification box to schedule'
                        : undefined
                    }
                  >
                    ✅{' '}
                    {editingScheduleId
                      ? isAr
                        ? 'توثيق وتحديث الجدول العلاجي'
                        : 'Verify & Update Schedule'
                      : isAr
                        ? 'توثيق الروشتة وتفعيل جدول الجرعات'
                        : 'Verify Prescription & Activate Schedule'}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleSaveUnverifiedPrescriptionOnly}
                  >
                    📋{' '}
                    {isAr
                      ? 'حفظ الروشتة للاستشارة الطبية (بدون تفعيل جدول)'
                      : 'Save for Professional Clarification (Without Schedule)'}
                  </button>

                  <button type="button" className="btn-secondary" onClick={() => setShowSaveModal(false)}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Document Dose Note / Outcome Modal */}
      {docModalTarget &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setDocModalTarget(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>
                  📝{' '}
                  {isAr
                    ? `توثيق تفاصيل الجرعة — ${docModalTarget.medicineName}`
                    : `Document Dose Details — ${docModalTarget.medicineName}`}
                </h3>
                <button type="button" className="close-btn" onClick={() => setDocModalTarget(null)}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveDocumentedDose} className="stack modal-form">
                <p className="small muted" style={{ margin: 0 }}>
                  <b>{isAr ? 'الموعد المجدول:' : 'Scheduled Slot:'}</b>{' '}
                  {isAr
                    ? `اليوم ${docModalTarget.dose.dayNumber} — الجرعة ${docModalTarget.dose.doseNumberInDay}`
                    : `Day ${docModalTarget.dose.dayNumber} — Dose #${docModalTarget.dose.doseNumberInDay}`}{' '}
                  ({docModalTarget.dose.scheduledTime.replace('T', ' ').slice(0, 16)})
                </p>

                <div className="form-group">
                  <label>
                    <b>{isAr ? 'حالة الجرعة:' : 'Dose Status:'}</b>
                  </label>
                  <select
                    value={docModalStatus}
                    onChange={(e) => {
                      const st = e.target.value as 'taken' | 'missed';
                      setDocModalStatus(st);
                      setDocModalOutcome(
                        st === 'taken' ? 'taken_on_time' : 'held_for_clarification'
                      );
                    }}
                  >
                    <option value="taken">{isAr ? '✅ تم أخذ الجرعة' : '✅ Dose Taken'}</option>
                    <option value="missed">
                      {isAr ? '❌ لم تُؤخذ (فائتة / مؤجلة طبياً)' : '❌ Not Taken (Missed / Clinician Hold)'}
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <b>{isAr ? 'تصنيف التوثيق:' : 'Documentation Category:'}</b>
                  </label>
                  <select
                    value={docModalOutcome}
                    onChange={(e) => setDocModalOutcome(e.target.value as DoseDocumentedOutcome)}
                  >
                    {docModalStatus === 'taken' ? (
                      <>
                        <option value="taken_on_time">
                          {isAr ? 'أُخذت في موعدها المجدول' : 'Taken on schedule'}
                        </option>
                        <option value="taken_late">
                          {isAr ? 'أُخذت متأخرة (وفق توجيه الطبيب/الصيدلي)' : 'Taken late (per clinician guidance)'}
                        </option>
                      </>
                    ) : (
                      <>
                        <option value="missed_confirmed">
                          {isAr ? 'جرعة فائتة مؤكدة (نسيان الجرعة)' : 'Confirmed missed dose'}
                        </option>
                        <option value="held_for_clarification">
                          {isAr
                            ? 'مؤجلة مؤقتاً لحين استشارة الطبيب أو الصيدلي'
                            : 'Held pending doctor/pharmacist clarification'}
                        </option>
                        <option value="skipped_clinician_advice">
                          {isAr
                            ? 'تم إيقافها/تخطيها بتوجيه مباشر من الطبيب'
                            : 'Skipped per direct clinician advice'}
                        </option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <b>{isAr ? 'ملاحظة المريض (اختياري):' : 'Patient Note (Optional):'}</b>
                  </label>
                  <input
                    value={docModalNote}
                    onChange={(e) => setDocModalNote(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال: أخذتها بعد الوجبة، أو تم الاتصال بالصيدلي...'
                        : 'e.g. Taken after meal, or called pharmacist for guidance...'
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn">
                    💾 {isAr ? 'حفظ توثيق الجرعة' : 'Save Dose Documentation'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setDocModalTarget(null)}
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}
