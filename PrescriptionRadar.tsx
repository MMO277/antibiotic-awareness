import { createPortal } from 'react-dom';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { ACTIVE_INGREDIENTS } from './egyptianDrugDatabase';
import {
  useSyncedHealthProfile,
  checkDrugAllergySafety,
  DrugProfileCheckResult,
} from './allergyData';
import {
  TreatmentSchedule,
  ScheduledDose,
  DoseStatus,
  useSyncedSchedules,
  generateScheduleDoses,
  getDoseStatus,
  calculateScheduleProgress,
  formatLocalDateYYYYMMDD,
  computeEndDate,
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

const NOTIF_FIRED_STORAGE_KEY = 'aa_fired_dose_notifications';

function formatTimestampReadable(iso?: string, isAr = true): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso.replace('T', ' ').slice(0, 16);
  }
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
    radarWorkspace,
    updateRadarWorkspace,
    initialLoading,
    syncStatus,
    syncError,
    lastSyncedAt,
    retrySync,
    isAuthenticated,
  } = useSyncedSchedules();

  const selectedAbx = radarWorkspace.selectedAbx;
  const frequency = radarWorkspace.frequency;
  const selectedCoMeds = radarWorkspace.selectedCoMeds;

  const setSelectedAbx = (val: string) => updateRadarWorkspace({ selectedAbx: val });
  const setFrequency = (val: 'q12h' | 'q8h' | 'q24h') => updateRadarWorkspace({ frequency: val });

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

  // Modal & Form states for saving/editing a prescription into the cross-device tracker
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [medName, setMedName] = useState('');
  const [prescribedDose, setPrescribedDose] = useState('');
  const [route, setRoute] = useState('oral');
  const [scheduleFreq, setScheduleFreq] = useState('twice_daily');
  const [doseTimes, setDoseTimes] = useState<string[]>(['08:00', '20:00']);
  const [startDate, setStartDate] = useState(() => formatLocalDateYYYYMMDD());
  const [durationDays, setDurationDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string>(() => new Date().toISOString());

  // Browser notification state & in-tab reminder check
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifSupported(true);
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Active in-tab reminder check while the browser is open
  useEffect(() => {
    if (!notifSupported || notifPermission !== 'granted' || schedules.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentYYYYMMDD = formatLocalDateYYYYMMDD(now);
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      let firedMap: Record<string, boolean> = {};
      try {
        const raw = localStorage.getItem(NOTIF_FIRED_STORAGE_KEY);
        if (raw) firedMap = JSON.parse(raw);
      } catch {}

      let updated = false;
      schedules.forEach((sch) => {
        sch.doses.forEach((d) => {
          if (d.status !== 'upcoming') return;
          const [dDate, dTimeFull] = d.scheduledTime.split('T');
          const dHHMM = (dTimeFull || '').slice(0, 5);
          if (dDate === currentYYYYMMDD && dHHMM === currentHHMM && !firedMap[d.id]) {
            firedMap[d.id] = true;
            updated = true;
            try {
              new Notification(
                isAr ? `⏰ موعد جرعة الدواء: ${sch.medicineName}` : `⏰ Dose Reminder: ${sch.medicineName}`,
                {
                  body: isAr
                    ? `الجرعة الموصوفة: ${sch.prescribedDose} (${dHHMM}). يرجى تأكيد الجرعة في رادار الروشتة.`
                    : `Prescribed dose: ${sch.prescribedDose} (${dHHMM}). Please confirm in Prescription Radar.`,
                }
              );
            } catch {}
          }
        });
      });

      if (updated) {
        try {
          localStorage.setItem(NOTIF_FIRED_STORAGE_KEY, JSON.stringify(firedMap));
        } catch {}
      }
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 30000);
    return () => window.clearInterval(timer);
  }, [notifSupported, notifPermission, schedules, isAr]);

  const requestNotifPermission = async () => {
    if (!notifSupported) return;
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        new Notification(
          isAr ? 'تم تفعيل تنبيهات المتصفح 🔔' : 'Browser Reminders Enabled 🔔',
          {
            body: isAr
              ? 'سيتم تنبيهك بمواعيد الجرعات طالما أن المتصفح مفتوح ونشط على هذا الجهاز.'
              : 'You will be alerted at scheduled dose times while this browser remains open and active.',
          }
        );
      }
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

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
              'أقراص الحديد والزنك تُبطل امتصاص هذا المضاد الحيوي إذا أُخذت في نفس الوقت. خذ الحديد في منتصف النهار (مثلاً 1:30 ظهراً) بعيداً عن جرعة المضاد.',
            ruleEn:
              'Iron and zinc supplements strongly chelate this antibiotic. Take iron at midday (e.g. 1:30 PM) at least 2 hours apart.',
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
        if (isMetro || isMacrolide || isQuinolone || selectedAbx === 'sulfamethoxazole-trimethoprim') {
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

  // Build 24-Hour Smart Daily Schedule slots
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
      timeAr: string;
      timeEn: string;
      badge: string;
      itemsAr: string[];
      itemsEn: string[];
    }> = [];

    slots.push({
      timeAr: '08:00 صباحاً',
      timeEn: '08:00 AM',
      badge: '💊',
      itemsAr: [
        `جرعة الصباح: ${abxName} — (${foodRuleAr})`,
        ...(selectedCoMeds.includes('paracetamol') ? ['باراسيتامول (عند اللزوم وفق إرشادات الطبيب)'] : []),
      ],
      itemsEn: [
        `Morning Antibiotic Dose: ${abxName} — (${foodRuleEn})`,
        ...(selectedCoMeds.includes('paracetamol') ? ['Paracetamol (if needed as directed by doctor)'] : []),
      ],
    });

    if (selectedCoMeds.includes('probiotics')) {
      slots.push({
        timeAr: '10:30 صباحاً',
        timeEn: '10:30 AM',
        badge: '🥣',
        itemsAr: [
          'البروبيوتيك أو كوب الزبادي الطبيعي (بعد المضاد بساعتين ونصف لضمان عدم قتل الخمائر النافعة)',
        ],
        itemsEn: [
          'Probiotic or Natural Yogurt (2.5 hours after antibiotic so beneficial flora survive)',
        ],
      });
    }

    const middayMedsAr: string[] = [];
    const middayMedsEn: string[] = [];
    if (selectedCoMeds.includes('iron_zinc')) {
      middayMedsAr.push('كبسولة الحديد / الزنك (بعد الغداء بعيداً عن المضاد الحيوي بـ 5 ساعات)');
      middayMedsEn.push('Iron / Zinc supplement (with lunch, safely separated from morning & evening antibiotic)');
    }
    if (selectedCoMeds.includes('calcium_dairy')) {
      middayMedsAr.push('مكمل الكالسيوم أو منتجات الألبان (مفصول زمنياً عن جرعة المضاد)');
      middayMedsEn.push('Calcium supplement or dairy meal (safely separated from antibiotic)');
    }
    if (selectedCoMeds.includes('antacids')) {
      middayMedsAr.push('دواء الحموضة / المعدة (عند اللزوم ظهراً بعيداً عن موعد المضاد بساعتين)');
      middayMedsEn.push('Antacid / Stomach protector (spaced at least 2 hours from antibiotic)');
    }
    if (middayMedsAr.length > 0) {
      slots.push({
        timeAr: '01:30 ظهراً',
        timeEn: '01:30 PM',
        badge: '🛡️',
        itemsAr: middayMedsAr,
        itemsEn: middayMedsEn,
      });
    }

    if (frequency === 'q8h') {
      slots.push({
        timeAr: '04:00 عصراً',
        timeEn: '04:00 PM',
        badge: '💊',
        itemsAr: [`الجرعة الثانية (كل 8 ساعات): ${abxName} — (${foodRuleAr})`],
        itemsEn: [`Afternoon Dose (Every 8h): ${abxName} — (${foodRuleEn})`],
      });
    }

    if (frequency === 'q12h') {
      slots.push({
        timeAr: '08:00 مساءً',
        timeEn: '08:00 PM',
        badge: '💊',
        itemsAr: [`جرعة المساء (كل 12 ساعة): ${abxName} — (${foodRuleAr})`],
        itemsEn: [`Evening Dose (Every 12h): ${abxName} — (${foodRuleEn})`],
      });
    }

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
      slots.push({
        timeAr: '10:30 مساءً',
        timeEn: '10:30 PM',
        badge: '🌙',
        itemsAr: nightAr,
        itemsEn: nightEn,
      });
    }

    if (frequency === 'q8h') {
      slots.push({
        timeAr: '12:00 منتصف الليل',
        timeEn: '12:00 Midnight',
        badge: '💊',
        itemsAr: [`الجرعة الثالثة (كل 8 ساعات): ${abxName} — (${foodRuleAr})`],
        itemsEn: [`Night Dose (Every 8h): ${abxName} — (${foodRuleEn})`],
      });
    }

    return slots;
  }, [currentAbx, selectedAbx, frequency, selectedCoMeds, isAr]);

  // Open Save Prescription Modal pre-populated from current Radar analysis
  const openSaveFromRadar = () => {
    setEditingScheduleId(null);
    const defaultName = currentAbx
      ? isAr
        ? `${currentAbx.nameAr} (${currentAbx.nameEn})`
        : `${currentAbx.nameEn} (${currentAbx.nameAr})`
      : '';
    setMedName(defaultName);
    setPrescribedDose('');
    setRoute('oral');
    if (frequency === 'q24h') {
      setScheduleFreq('once_daily');
      setDoseTimes(['08:00']);
    } else if (frequency === 'q8h') {
      setScheduleFreq('thrice_daily');
      setDoseTimes(['08:00', '16:00', '00:00']);
    } else {
      setScheduleFreq('twice_daily');
      setDoseTimes(['08:00', '20:00']);
    }
    setStartDate(formatLocalDateYYYYMMDD());
    setDurationDays(7);
    setNotes('');
    setFormError('');
    setShowSaveModal(true);
  };

  const openEditSchedule = (sch: TreatmentSchedule) => {
    setEditingScheduleId(sch.id);
    setMedName(sch.medicineName);
    setPrescribedDose(sch.prescribedDose);
    setRoute(sch.route);
    setScheduleFreq(sch.frequency);
    setDoseTimes(sch.doseTimes);
    setStartDate(sch.startDate);
    setDurationDays(sch.durationDays);
    setNotes(sch.notes || '');
    setFormError('');
    setShowSaveModal(true);
  };

  const loadScheduleIntoRadar = (sch: TreatmentSchedule) => {
    const partial: {
      selectedAbx?: string;
      frequency?: 'q12h' | 'q8h' | 'q24h';
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
    else partial.frequency = 'q12h';

    if (Array.isArray(sch.coMedications)) {
      partial.selectedCoMeds = sch.coMedications;
    }
    updateRadarWorkspace(partial);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScheduleFreqChange = (freq: string) => {
    setScheduleFreq(freq);
    if (freq === 'once_daily') setDoseTimes(['08:00']);
    else if (freq === 'twice_daily') setDoseTimes(['08:00', '20:00']);
    else if (freq === 'thrice_daily') setDoseTimes(['08:00', '16:00', '00:00']);
    else if (freq === 'four_times_daily') setDoseTimes(['06:00', '12:00', '18:00', '00:00']);
  };

  const handleTimeChange = (index: number, val: string) => {
    const updated = [...doseTimes];
    updated[index] = val;
    setDoseTimes(updated);
  };

  const handleSavePrescription = (e: FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) {
      setFormError(
        isAr
          ? 'يرجى كتابة أو تأكيد اسم المضاد الحيوي الموصوف في الروشتة.'
          : 'Please enter or confirm the prescribed antibiotic name.'
      );
      return;
    }
    if (!prescribedDose.trim()) {
      setFormError(
        isAr
          ? 'يرجى إدخال الجرعة كما هي مكتوبة في الروشتة تماماً (مثال: قرص 500 مجم). التطبيق لا يخترع جرعات.'
          : 'Please enter the exact dose written on your prescription (e.g., 1 tablet 500 mg). Never guess a dose.'
      );
      return;
    }
    if (durationDays < 1 || durationDays > 60) {
      setFormError(
        isAr
          ? 'يرجى تحديد مدة الكورس الموصوفة بالأيام (بين 1 و 60 يوماً).'
          : 'Please enter a valid prescribed duration (1–60 days).'
      );
      return;
    }

    setFormError('');
    const nowIso = new Date().toISOString();
    const id = editingScheduleId || `sch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const endDateStr = computeEndDate(startDate, durationDays);

    const existing = editingScheduleId ? schedules.find((s) => s.id === editingScheduleId) : undefined;
    const generatedDoses = generateScheduleDoses(
      id,
      startDate,
      doseTimes,
      durationDays,
      existing?.doses
    );

    const newSchedule: TreatmentSchedule = {
      id,
      antibioticId: selectedAbx,
      medicineName: medName.trim(),
      prescribedDose: prescribedDose.trim(),
      route,
      frequency: scheduleFreq,
      doseTimes,
      startDate,
      durationDays,
      endDate: endDateStr,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      coMedications: [...selectedCoMeds],
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      doses: generatedDoses,
    };

    if (editingScheduleId) {
      setSchedules((prev) => prev.map((s) => (s.id === editingScheduleId ? newSchedule : s)));
    } else {
      setSchedules((prev) => [newSchedule, ...prev]);
    }

    setShowSaveModal(false);
    setEditingScheduleId(null);
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
          📡 {isAr ? 'أداة الصيدلة الإكلينيكية الذكية + المزامنة السحابية' : 'Smart Clinical Pharmacy Tool + Cloud Sync'}
        </span>
        <h1 style={{ color: '#fff', margin: '8px 0' }}>
          {isAr
            ? 'رادار فحص «الروشتة الكاملة» ومتابع رحلة العلاج عبر الأجهزة'
            : 'Full Prescription Radar & Cross-Device Treatment Journey'}
        </h1>
        <p style={{ color: '#cbd5e1', margin: 0, maxWidth: '820px', lineHeight: 1.65 }}>
          {isAr
            ? 'افحص التداخلات الدوائية والغذائية لروشتتك، ونظّم مواعيد الـ 24 ساعة، واحفظ الروشتة وسجل جرعاتك (المأخوذة، القادمة، المتأخرة غير المؤكدة، والفائتة) لتظهر تلقائياً على جميع أجهزتك عند تسجيل الدخول.'
            : 'Screen your prescription for multi-drug and food interactions, generate an optimized 24-hour schedule, and save your treatment course so your schedule and dose history stay synchronized across all your signed-in devices.'}
        </p>
      </section>

      {/* Cloud Sync Status Bar */}
      <section className="no-print">{renderSyncBadge()}</section>

      {/* Clinical Safety Disclaimer */}
      <section className="notice quick no-print">
        <strong>⚕️ {isAr ? 'ضوابط السلامة الدوائية:' : 'Clinical Safety Boundaries:'} </strong>
        {isAr
          ? 'هذا الرادار أداة تنظيمية وتثقيفية مساندة؛ لا يخترع تعليمات للروشتة، ولا يقترح بدائل للمضادات الحيوية تلقائياً، ولا يحسب جرعات تعويضية. عند الشك في أي تفصيلة بالروشتة أو عند نسيان جرعة، راجع الطبيب المعالج أو الصيدلي دائماً.'
          : 'This tool supports prescription organization and safety education; it never invents prescription instructions, recommends antibiotic alternatives automatically, or calculates replacement doses. Always verify uncertain instructions or missed doses with your prescribing doctor or pharmacist.'}
      </section>

      {/* Step 1: Select Antibiotic & Frequency */}
      <section className="card stack no-print">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ margin: 0 }}>
            1️⃣ {isAr ? 'اختر المضاد الحيوي الأساسي ونظام الجرعة:' : '1. Select Primary Antibiotic & Dosing Frequency:'}
          </h2>
          <button type="button" className="btn small" onClick={openSaveFromRadar}>
            💾 {isAr ? 'حفظ هذه الروشتة لمتابعة الجرعات عبر أجهزتك' : 'Save Prescription to Track Across Devices'}
          </button>
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
            <label htmlFor="radar-freq" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              ⏰ {isAr ? 'تكرار الجرعة اليومي بالروشتة:' : 'Prescribed Daily Frequency:'}
            </label>
            <select
              id="radar-freq"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'q12h' | 'q8h' | 'q24h')}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px' }}
            >
              <option value="q12h">
                {isAr
                  ? 'مرتين يومياً (كل 12 ساعة — 8 ص و 8 م)'
                  : 'Twice Daily (Every 12 hours — 8 AM & 8 PM)'}
              </option>
              <option value="q8h">
                {isAr
                  ? '3 مرات يومياً (كل 8 ساعات — 8 ص، 4 م، 12 ص)'
                  : '3 Times Daily (Every 8 hours — 8 AM, 4 PM, 12 AM)'}
              </option>
              <option value="q24h">
                {isAr
                  ? 'مرة واحدة يومياً (كل 24 ساعة — 8 ص)'
                  : 'Once Daily (Every 24 hours — 8 AM)'}
              </option>
            </select>
          </div>
        </div>

        {/* Allergy Safety Check Banner from Synced Health Profile */}
        <div
          style={{
            marginTop: '6px',
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
              🗓️ {isAr ? 'جدول تنظيم مواعيد اليوم الذكي (بدون تعارض)' : 'Optimized 24-Hour Smart Medication Schedule'}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'تم ترتيب مواعيد المضاد الحيوي والمكملات تلقائياً لضمان أعلى امتصاص وأمان للمعدة:'
                : 'Your antibiotic and co-medications are automatically spaced across the day to prevent absorption conflicts:'}
            </p>
          </div>
          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn small" onClick={openSaveFromRadar}>
              ➕ {isAr ? 'تأكيد وحفظ الروشتة في رحلة العلاج' : 'Confirm & Save to Treatment Journey'}
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
                ? 'سجّل جرعاتك اليومية وتابع تقدمك العلاجي؛ جميع التحديثات تُحفظ وتتزامن فورياً مع أجهزتك الأخرى المسجلة بنفس الحساب.'
                : 'Record your daily doses and track treatment adherence; updates synchronize in real time across all devices signed in with your account.'}
            </p>
          </div>

          <div className="row wrapRow" style={{ gap: '8px' }}>
            <button type="button" className="btn small" onClick={openSaveFromRadar}>
              ➕ {isAr ? 'إضافة روشتة جديدة' : 'Add New Prescription'}
            </button>
            {schedules.length > 0 && (
              <button type="button" className="btn-secondary small" onClick={handlePrintReport}>
                🖨️ {isAr ? 'تقرير المتابعة العلاجية (طباعة / PDF)' : 'Treatment Report (Print / Save PDF)'}
              </button>
            )}
          </div>
        </div>

        {/* Browser Reminders & Honest Limitations Banner (Priority 5) */}
        <div className="reminder-limitations-box">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong>
                🔔 {isAr ? 'منبهات الجرعات وقيود متصفح الويب:' : 'Dose Reminders & Browser Limitations:'}
              </strong>
              <p className="small" style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
                {isAr
                  ? 'تعمل تنبيهات المتصفح أثناء بقاء هذه الصفحة أو المتصفح مفتوحاً ونشطاً على جهازك، ولا يمكن ضمان انطلاقها في الخلفية عند إغلاق المتصفح بالكامل أو قفل الهاتف. للالتزام الدقيق بمواعيد المضاد الحيوي، يُرجى ضبط منبه الهاتف الأساسي (Alarm) بجانب هذا المتابع.'
                  : 'Browser notifications work while this tab or browser remains open and active on your device, and cannot be guaranteed when the browser is completely closed. For critical antibiotic doses, please also set your phone’s native alarm clock.'}
              </p>
            </div>
            {notifSupported && (
              <div>
                {notifPermission === 'granted' ? (
                  <span className="notif-pill active">
                    🔔 {isAr ? 'تنبيهات المتصفح مفعّلة أثناء فتح الموقع' : 'In-Browser Reminders Active'}
                  </span>
                ) : (
                  <button type="button" className="btn-secondary small" onClick={requestNotifPermission}>
                    🔔 {isAr ? 'تفعيل تنبيهات المتصفح' : 'Enable Browser Reminders'}
                  </button>
                )}
              </div>
            )}
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
                ? 'مرور موعد الجرعة المجدول يضعها في حالة «متأخرة غير مؤكدة» (Overdue — Unconfirmed) ولا يعتبرها فائتة تلقائياً حتى تؤكد أنت ما حدث.'
                : 'Passing a scheduled time marks the dose as "Overdue (Unconfirmed)" rather than automatically missed until you confirm its status.'}
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

        {/* Initial Cloud Loading Guard — Never show empty state while cloud data is still loading */}
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
                ? 'لا توجد روشتات أو جداول علاجية محفوظة حالياً'
                : 'No Saved Prescriptions or Active Treatment Schedules'}
            </h3>
            <p className="muted">
              {isAr
                ? 'اضغط على «حفظ هذه الروشتة لمتابعة الجرعات عبر أجهزتك» لإدخال الجرعة المكتوبة في الروشتة وبدء تتبع الجرعات عبر جميع أجهزتك.'
                : 'Click "Save Prescription to Track Across Devices" to enter your prescribed dose details and track your course across devices.'}
            </p>
            <div style={{ marginTop: '8px' }}>
              <button type="button" className="btn" onClick={openSaveFromRadar}>
                ➕ {isAr ? 'حفظ الروشتة الحالية وبدء المتابعة' : 'Save Current Prescription & Start Tracking'}
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

              // Recorded dose history (taken or explicitly missed) sorted most recent first
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
                      <h3 className="sch-title" style={{ margin: '0 0 6px' }}>
                        💊 {sch.medicineName}
                      </h3>
                      <p className="sch-meta">
                        <b>{isAr ? 'الجرعة الموصوفة:' : 'Prescribed Dose:'}</b> {sch.prescribedDose} ·{' '}
                        <b>{isAr ? 'طريقة الاستعمال:' : 'Route:'}</b> {sch.route} ·{' '}
                        <b>{isAr ? 'المدة:' : 'Duration:'}</b> {sch.durationDays}{' '}
                        {isAr ? 'أيام' : 'days'} ({sch.startDate} → {sch.endDate})
                      </p>
                      <p className="sch-meta" style={{ marginTop: '4px' }}>
                        <b>{isAr ? 'مواعيد الجرعات اليومية:' : 'Scheduled Times:'}</b>{' '}
                        {sch.doseTimes.join(' ، ')}
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

                  {/* 5-KPI Grid: Total, Taken, Upcoming, Overdue-Unconfirmed, Explicitly Missed */}
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
                        {isAr ? 'متأخرة غير مؤكدة ⚠️' : 'Overdue (Unconfirmed) ⚠️'}
                      </span>
                    </div>
                    <div className="kpi-item missed">
                      <span className="kpi-num">{missedCount}</span>
                      <span className="kpi-label">
                        {isAr ? 'فائتة صراحةً ❌' : 'Explicitly Missed ❌'}
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
                          ? 'تنبيه أمان للجرعات المتأخرة أو الفائتة:'
                          : 'Safety Notice for Overdue or Missed Doses:'}{' '}
                      </strong>
                      {isAr
                        ? 'إذا كنت قد أخذت الجرعة بالفعل، اضغط «✓ أخذت الجرعة» لتحديث سجلك. أما إذا نسيت الجرعة فعلاً، فلا تضاعف الجرعة أبداً، ولا تأخذ جرعة إضافية، ولا تقم بتخطي أو تعويض الجرعة من تلقاء نفسك — استشر الطبيب المعالج أو الصيدلي للحصول على التوجيه الآمن المخصص لدوائك.'
                        : 'If you already took the dose, click "Mark Taken" to update your record. If you missed a dose, never double a dose, take an extra dose, or automatically skip or replace it on your own — consult your prescribing doctor or pharmacist for medicine-specific instructions.'}
                    </div>
                  )}

                  {/* Daily Dose Schedule & Accidental Entry Correction */}
                  <div className="timeline-section">
                    <h4>📅 {isAr ? 'جدول الجرعات اليومي وتصحيح الحالات:' : 'Daily Dose Schedule & Status Controls:'}</h4>
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
                                    <span className="dose-time">⏰ {timeDisplay}</span>
                                    <span className={`status-pill ${status}`}>
                                      {status === 'taken' && (isAr ? 'تم أخذها ✅' : 'Taken ✅')}
                                      {status === 'upcoming' && (isAr ? 'قادمة ⏳' : 'Upcoming ⏳')}
                                      {status === 'unconfirmed' &&
                                        (isAr ? 'متأخرة غير مؤكدة ⚠️' : 'Overdue (Unconfirmed) ⚠️')}
                                      {status === 'missed' &&
                                        (isAr ? 'فائتة صراحةً ❌' : 'Explicitly Missed ❌')}
                                    </span>
                                    {dose.status === 'taken' && dose.takenAt && (
                                      <small className="muted" style={{ display: 'block', width: '100%', fontSize: '0.74rem' }}>
                                        {isAr ? 'سُجلت:' : 'Logged:'}{' '}
                                        {formatTimestampReadable(dose.takenAt, isAr)}
                                      </small>
                                    )}
                                    {dose.status === 'missed' && dose.missedAt && (
                                      <small className="muted" style={{ display: 'block', width: '100%', fontSize: '0.74rem' }}>
                                        {isAr ? 'سُجلت فائتة:' : 'Marked missed:'}{' '}
                                        {formatTimestampReadable(dose.missedAt, isAr)}
                                      </small>
                                    )}
                                  </div>

                                  <div className="dose-right" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {status === 'taken' ? (
                                      <>
                                        <button
                                          type="button"
                                          className="undo-btn"
                                          onClick={() => updateDoseStatus(sch.id, dose.id, 'upcoming')}
                                          title={isAr ? 'تراجع لتصحيح التسجيل بالخطأ' : 'Undo accidental entry'}
                                        >
                                          ↩ {isAr ? 'تراجع' : 'Undo'}
                                        </button>
                                        <button
                                          type="button"
                                          className="undo-btn"
                                          onClick={() => updateDoseStatus(sch.id, dose.id, 'missed')}
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
                                          onClick={() => updateDoseStatus(sch.id, dose.id, 'taken')}
                                          title={isAr ? 'تصحيح إلى تم أخذها' : 'Correct to Taken'}
                                        >
                                          ✓ {isAr ? 'أخذتها' : 'Taken'}
                                        </button>
                                        <button
                                          type="button"
                                          className="undo-btn"
                                          onClick={() => updateDoseStatus(sch.id, dose.id, 'upcoming')}
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
                                          onClick={() => updateDoseStatus(sch.id, dose.id, 'taken')}
                                        >
                                          ✓ {isAr ? 'أخذت الجرعة' : 'Mark Taken'}
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-missed"
                                          onClick={() => updateDoseStatus(sch.id, dose.id, 'missed')}
                                        >
                                          ✕ {isAr ? 'فائتة' : 'Mark Missed'}
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
                        🕒 {isAr ? 'سجل تاريخ الجرعات المسجلة (يتزامن عبر أجهزتك):' : 'Recorded Dose History Log (Synced Across Devices):'}
                      </h4>
                      <div className="tablewrap">
                        <table className="tbl">
                          <thead>
                            <tr>
                              <th>{isAr ? 'اليوم والجرعة' : 'Day & Dose'}</th>
                              <th>{isAr ? 'الموعد المجدول' : 'Scheduled Time'}</th>
                              <th>{isAr ? 'الحالة المسجلة' : 'Recorded Status'}</th>
                              <th>{isAr ? 'توقيت التسجيل الفعلي' : 'Recorded Timestamp'}</th>
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
                                  {hd.status === 'taken'
                                    ? isAr
                                      ? '✅ تم أخذها'
                                      : '✅ Taken'
                                    : isAr
                                      ? '❌ فائتة صراحةً'
                                      : '❌ Explicitly Missed'}
                                </td>
                                <td>
                                  {formatTimestampReadable(
                                    hd.status === 'taken' ? hd.takenAt : hd.missedAt,
                                    isAr
                                  )}
                                </td>
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
      </section>

      {/* Printable Treatment Summary Report (Priority 4 — Visible on screen & formatted for Print / Save as PDF) */}
      <section className="card stack printable-treatment-report">
        <div className="row no-print" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              📄 {isAr ? 'تقرير ملخص المتابعة العلاجية (للطباعة أو الحفظ PDF)' : 'Printable Treatment Summary Report (Print / Save as PDF)'}
            </h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'يمكنك طباعة هذا التقرير أو حفظه كملف PDF من متصفحك لعرضه على الطبيب المعالج أو الصيدلي عند المراجعة.'
                : 'You can print this summary or save it as a PDF through your browser to share with your prescribing doctor or pharmacist.'}
            </p>
          </div>
          <button type="button" className="btn" onClick={handlePrintReport}>
            🖨️ {isAr ? 'طباعة / حفظ كملف PDF' : 'Print / Save as PDF'}
          </button>
        </div>

        <div className="report-print-header">
          <h2 style={{ margin: '0 0 4px' }}>
            {isAr
              ? 'تقرير متابعة الروشتة والجرعات — منصة التوعية بالمضادات الحيوية'
              : 'Prescription & Dose Tracking Summary Report — Antibiotic Awareness'}
          </h2>
          <p className="small" style={{ margin: '0 0 6px' }}>
            <b>{isAr ? 'تاريخ ووقت إصدار التقرير:' : 'Report Generation Date:'}</b>{' '}
            {formatTimestampReadable(reportGeneratedAt, isAr)}
            {profile.displayName ? ` · ${isAr ? 'اسم المريض:' : 'Patient:'} ${profile.displayName}` : ''}
          </p>
          <div className="report-disclaimer-box">
            <strong>
              ⚠️ {isAr ? 'إخلاء مسؤولية مهم:' : 'Important Disclaimer:'}{' '}
            </strong>
            {isAr
              ? 'هذا التقرير مُعدّ ومُدار ذاتياً بواسطة المريض لأغراض التنظيم والمتابعة الشخصية، ولا يُعد سجلاً طبياً أو سريرياً موثقاً. لا يتم إرسال أي بيانات صحية تلقائياً لأي جهة. يرجى مراجعة الطبيب المعالج أو الصيدلي للتحقق من جميع التفاصيل العلاجية.'
              : 'This report is self-maintained by the patient for personal tracking and is NOT a verified clinical record. No private health data is transmitted automatically. Always verify treatment instructions with your prescribing doctor or pharmacist.'}
          </div>
        </div>

        {/* Active Radar Analysis Summary in Report */}
        <div className="report-block">
          <h3 style={{ margin: '0 0 6px' }}>
            🔬 {isAr ? 'ملخص فحص رادار الروشتة الحالي (24 ساعة):' : 'Current 24-Hour Prescription Radar Analysis:'}
          </h3>
          <p className="small" style={{ margin: '0 0 6px' }}>
            <b>{isAr ? 'المضاد الحيوي المحدد:' : 'Selected Antibiotic:'}</b>{' '}
            {isAr ? `${currentAbx.nameAr} (${currentAbx.nameEn})` : `${currentAbx.nameEn} (${currentAbx.nameAr})`} ·{' '}
            <b>{isAr ? 'نظام التكرار:' : 'Frequency:'}</b>{' '}
            {frequency === 'q12h'
              ? isAr
                ? 'كل 12 ساعة'
                : 'Every 12 hours'
              : frequency === 'q8h'
                ? isAr
                  ? 'كل 8 ساعات'
                  : 'Every 8 hours'
                : isAr
                  ? 'كل 24 ساعة'
                  : 'Every 24 hours'}
          </p>
          <ul className="small" style={{ margin: 0, paddingInlineStart: '20px', lineHeight: 1.6 }}>
            {dailySlots.map((s, i) => (
              <li key={i}>
                <b>{isAr ? s.timeAr : s.timeEn}:</b> {(isAr ? s.itemsAr : s.itemsEn).join(' + ')}
              </li>
            ))}
          </ul>
        </div>

        {/* Saved Prescriptions & Recorded Doses in Report */}
        {schedules.length > 0 && (
          <div className="report-block">
            <h3 style={{ margin: '0 0 8px' }}>
              💊 {isAr ? 'سجل الروشتات والجرعات المسجلة:' : 'Saved Prescriptions & Recorded Dose History:'}
            </h3>
            {schedules.map((sch) => {
              const stats = calculateScheduleProgress(sch);
              return (
                <div key={sch.id} className="report-schedule-item">
                  <h4 style={{ margin: '0 0 4px' }}>
                    {sch.medicineName} — {sch.prescribedDose} ({sch.startDate} → {sch.endDate})
                  </h4>
                  <p className="small" style={{ margin: '0 0 6px' }}>
                    <b>{isAr ? 'إجمالي الجرعات:' : 'Total:'}</b> {stats.totalDoses} ·{' '}
                    <b>{isAr ? 'تم أخذها:' : 'Taken:'}</b> {stats.takenCount} ·{' '}
                    <b>{isAr ? 'فائتة صراحةً:' : 'Explicitly Missed:'}</b> {stats.missedCount} ·{' '}
                    <b>{isAr ? 'متأخرة غير مؤكدة:' : 'Overdue Unconfirmed:'}</b> {stats.unconfirmedCount} ·{' '}
                    <b>{isAr ? 'قادمة:' : 'Upcoming:'}</b> {stats.upcomingCount} ·{' '}
                    <b>{isAr ? 'نسبة الالتزام المسجلة:' : 'Recorded Progress:'}</b> {stats.progressPercent}%
                  </p>
                  {sch.notes && (
                    <p className="small" style={{ margin: '0 0 6px' }}>
                      <b>{isAr ? 'التعليمات المدخلة:' : 'Entered Instructions:'}</b> {sch.notes}
                    </p>
                  )}
                  <div className="tablewrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>{isAr ? 'اليوم' : 'Day'}</th>
                          <th>{isAr ? 'الموعد المجدول' : 'Scheduled Time'}</th>
                          <th>{isAr ? 'الحالة' : 'Status'}</th>
                          <th>{isAr ? 'وقت التسجيل' : 'Recorded Timestamp'}</th>
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
                                {st === 'taken' && (isAr ? 'تم أخذها ✅' : 'Taken ✅')}
                                {st === 'missed' && (isAr ? 'فائتة صراحةً ❌' : 'Explicitly Missed ❌')}
                                {st === 'unconfirmed' && (isAr ? 'متأخرة غير مؤكدة ⚠️' : 'Overdue (Unconfirmed) ⚠️')}
                                {st === 'upcoming' && (isAr ? 'قادمة ⏳' : 'Upcoming ⏳')}
                              </td>
                              <td>
                                {st === 'taken'
                                  ? formatTimestampReadable(d.takenAt, isAr)
                                  : st === 'missed'
                                    ? formatTimestampReadable(d.missedAt, isAr)
                                    : '—'}
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

      {/* Save / Edit Prescription Modal */}
      {showSaveModal &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setShowSaveModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>
                  {editingScheduleId
                    ? isAr
                      ? 'تعديل بيانات الروشتة والجدول العلاجي'
                      : 'Edit Prescription & Treatment Schedule'
                    : isAr
                      ? 'حفظ الروشتة لمتابعة الجرعات عبر أجهزتك'
                      : 'Save Prescription for Cross-Device Tracking'}
                </h3>
                <button type="button" className="close-btn" onClick={() => setShowSaveModal(false)}>
                  ✕
                </button>
              </div>

              {formError && <p className="alert danger-alert">{formError}</p>}

              <form onSubmit={handleSavePrescription} className="stack modal-form">
                <div className="form-group">
                  <label>
                    <b>{isAr ? 'اسم المضاد الحيوي كما في الروشتة:' : 'Prescribed Antibiotic Name:'} *</b>
                  </label>
                  <input
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder={isAr ? 'مثال: سيبروفلوكساسين / أوجمنتين' : 'e.g. Ciprofloxacin / Augmentin'}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'الجرعة الموصوفة بالروشتة:' : 'Prescribed Dose (as written):'} *</b>
                    </label>
                    <input
                      value={prescribedDose}
                      onChange={(e) => setPrescribedDose(e.target.value)}
                      placeholder={isAr ? 'مثال: قرص 500 مجم أو 5 مل' : 'e.g. 1 tablet (500mg) or 5ml'}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'طريقة الاستعمال:' : 'Administration Route:'}</b>
                    </label>
                    <select value={route} onChange={(e) => setRoute(e.target.value)}>
                      <option value="oral">{isAr ? 'أقراص / كبسول فموي' : 'Oral Tablet/Capsule'}</option>
                      <option value="suspension">{isAr ? 'شراب معلق' : 'Oral Suspension'}</option>
                      <option value="injection">{isAr ? 'حقن (وريد/عضل)' : 'Injection'}</option>
                      <option value="topical">{isAr ? 'موضعي (كريم/مرهم)' : 'Topical'}</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'تكرار الجرعة اليومي:' : 'Daily Frequency:'}</b>
                    </label>
                    <select value={scheduleFreq} onChange={(e) => handleScheduleFreqChange(e.target.value)}>
                      <option value="once_daily">{isAr ? 'مرة واحدة يومياً (كل 24 ساعة)' : 'Once daily (every 24h)'}</option>
                      <option value="twice_daily">{isAr ? 'مرتان يومياً (كل 12 ساعة)' : 'Twice daily (every 12h)'}</option>
                      <option value="thrice_daily">{isAr ? '3 مرات يومياً (كل 8 ساعات)' : 'Three times daily (every 8h)'}</option>
                      <option value="four_times_daily">{isAr ? '4 مرات يومياً (كل 6 ساعات)' : 'Four times daily (every 6h)'}</option>
                    </select>
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
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <b>{isAr ? 'مواعيد الجرعات خلال اليوم:' : 'Scheduled Dose Times:'}</b>
                  </label>
                  <div className="dose-times-grid">
                    {doseTimes.map((time, idx) => (
                      <div key={idx} className="time-input-group">
                        <small>{isAr ? `الجرعة ${idx + 1}` : `Dose ${idx + 1}`}:</small>
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
                      <b>{isAr ? 'تعليمات الطبيب أو الصيدلي في الروشتة:' : 'Prescribed Instructions / Notes:'}</b>
                    </label>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={isAr ? 'مثال: بعد الأكل، مع كوب ماء كامل' : 'e.g. Take after meals with a full glass of water'}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn">
                    💾{' '}
                    {editingScheduleId
                      ? isAr
                        ? 'تحديث الروشتة والمزامنة'
                        : 'Update & Sync Prescription'
                      : isAr
                        ? 'حفظ الروشتة والمزامنة السحابية'
                        : 'Save & Sync Prescription'}
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
    </main>
  );
}
