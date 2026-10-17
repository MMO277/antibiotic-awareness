import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { ACTIVE_INGREDIENTS } from './egyptianDrugDatabase';

interface CoMedItem {
  id: string;
  nameAr: string;
  nameEn: string;
  examplesAr: string;
  examplesEn: string;
  icon: string;
}

const CO_MEDICATIONS: CoMedItem[] = [
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

  const [selectedAbx, setSelectedAbx] = useState<string>('ciprofloxacin');
  const [frequency, setFrequency] = useState<'q12h' | 'q8h' | 'q24h'>('q12h');
  const [selectedCoMeds, setSelectedCoMeds] = useState<string[]>([
    'calcium_dairy',
    'iron_zinc',
    'probiotics',
    'paracetamol',
  ]);

  const currentAbx = useMemo(
    () => ACTIVE_INGREDIENTS.find((a) => a.id === selectedAbx) || ACTIVE_INGREDIENTS[0],
    [selectedAbx],
  );

  function toggleCoMed(id: string) {
    setSelectedCoMeds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

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
              'الجمع بين الفلوروكينولونات (مثل سيبروفار/تافانيك) والمسكنات المضادة للالتهاب (كتافلام/بروفين) يزيد خطر تنبيه الجهاز العصبي والإجهاد الكلوي. استبدله بالباراسيتامول بعد مراجعة الطبيب.',
            ruleEn:
              'Combining fluoroquinolones with NSAIDs increases CNS excitation and renal strain risk. Prefer Paracetamol after consulting your doctor.',
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
            'الباراسيتامول هو الخيار الأول الآمن لتسكين الألم وخفض الحرارة أثناء كورس المضاد الحيوي (بحد أقصى 4 جم يومياً للبالغين).',
          ruleEn:
            'Paracetamol is the safest analgesic/antipyretic option alongside antibiotics.',
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
              'كلاريثرومايسين وإريثرومايسين يمنعان تكسير أدوية الكوليسترول (أتور/زوكور). يُنصح بإيقاف دواء الكوليسترول مؤقتاً خلال أيام كورس المضاد بعد استشارة الطبيب.',
            ruleEn:
              'Clarithromycin/Erythromycin strongly inhibit statin metabolism. Ask your doctor about temporarily holding the statin during the antibiotic course.',
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
      selectedAbx === 'amoxicillin-clavulanic-acid' || selectedAbx === 'metronidazole' || selectedAbx === 'cefuroxime' || selectedAbx === 'nitrofurantoin'
        ? 'مع بداية وجبة الطعام (لحماية المعدة وزيادة الامتصاص)'
        : selectedAbx === 'azithromycin' || selectedAbx === 'ampicillin-sulbactam'
          ? 'على معدة فارغة أو مع كوب ماء كبير'
          : 'مع كوب ماء كامل (250 مل)';
    const foodRuleEn =
      selectedAbx === 'amoxicillin-clavulanic-acid' || selectedAbx === 'metronidazole' || selectedAbx === 'cefuroxime' || selectedAbx === 'nitrofurantoin'
        ? 'At the start of a meal (to protect stomach & boost absorption)'
        : 'With a full glass of water (250 mL)';

    const slots: Array<{ timeAr: string; timeEn: string; badge: string; itemsAr: string[]; itemsEn: string[] }> = [];

    // 08:00 AM - Morning Antibiotic Dose
    slots.push({
      timeAr: '08:00 صباحاً',
      timeEn: '08:00 AM',
      badge: '💊',
      itemsAr: [
        `جرعة الصباح: ${abxName} — (${foodRuleAr})`,
        ...(selectedCoMeds.includes('paracetamol') ? ['باراسيتامول (عند اللزوم للحرارة أو الألم)'] : []),
      ],
      itemsEn: [
        `Morning Antibiotic Dose: ${abxName} — (${foodRuleEn})`,
        ...(selectedCoMeds.includes('paracetamol') ? ['Paracetamol (if needed for fever/pain)'] : []),
      ],
    });

    // 10:30 AM - Probiotics / Yogurt (2.5h after morning antibiotic)
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

    // 01:30 PM - Iron / Calcium / Antacids (Safe midday separation window)
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

    // 04:00 PM - Afternoon Dose (if Every 8 Hours)
    if (frequency === 'q8h') {
      slots.push({
        timeAr: '04:00 عصراً',
        timeEn: '04:00 PM',
        badge: '💊',
        itemsAr: [`الجرعة الثانية (كل 8 ساعات): ${abxName} — (${foodRuleAr})`],
        itemsEn: [`Afternoon Dose (Every 8h): ${abxName} — (${foodRuleEn})`],
      });
    }

    // 08:00 PM - Evening Antibiotic Dose (if Every 12h)
    if (frequency === 'q12h') {
      slots.push({
        timeAr: '08:00 مساءً',
        timeEn: '08:00 PM',
        badge: '💊',
        itemsAr: [`جرعة المساء (كل 12 ساعة): ${abxName} — (${foodRuleAr})`],
        itemsEn: [`Evening Dose (Every 12h): ${abxName} — (${foodRuleEn})`],
      });
    }

    // 10:30 PM - Evening Chronic Meds / Contraceptives / Statins
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

    // 12:00 AM - Midnight Dose (if Every 8 Hours)
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

  return (
    <main className="wrap stack">
      {/* Header Banner */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          color: '#fff',
          padding: '24px',
          borderRadius: '18px',
        }}
      >
        <span className="badge" style={{ background: '#38bdf825', color: '#7dd3fc', borderColor: '#38bdf850' }}>
          📡 {isAr ? 'أداة الصيدلة الإكلينيكية الذكية' : 'Smart Clinical Pharmacy Tool'}
        </span>
        <h1 style={{ color: '#fff', margin: '8px 0' }}>
          {isAr
            ? 'رادار فحص «الروشتة الكاملة» ومنظم مواعيد اليوم (24 ساعة)'
            : 'Full Prescription Radar & 24-Hour Smart Daily Scheduler'}
        </h1>
        <p style={{ color: '#cbd5e1', margin: 0, maxWidth: '780px', lineHeight: 1.65 }}>
          {isAr
            ? 'الروشتة نادراً ما تحتوي على مضاد حيوي بمفرده! اختر المضاد الحيوي وباقي الأدوية أو المكملات المكتوبة معه في الروشتة، ليقوم الرادار بكشف أي تعارض وبناء جدول زمني يومي يفصل بين الأدوية المتعارضة بالساعة.'
            : 'A prescription rarely contains an antibiotic alone! Select your antibiotic and co-prescribed medications or supplements to detect interactions and generate an optimized 24-hour schedule.'}
        </p>
      </section>

      {/* Step 1: Select Antibiotic & Frequency */}
      <section className="card stack">
        <h2 style={{ margin: 0 }}>
          1️⃣ {isAr ? 'اختر المضاد الحيوي الأساسي ونظام الجرعة:' : '1. Select Primary Antibiotic & Dosing Frequency:'}
        </h2>
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
                  {isAr
                    ? `${ing.nameAr} (${ing.nameEn})`
                    : `${ing.nameEn} (${ing.nameAr})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="radar-freq" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              ⏰ {isAr ? 'تكرار الجرعة اليومي:' : 'Daily Dosing Frequency:'}
            </label>
            <select
              id="radar-freq"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'q12h' | 'q8h' | 'q24h')}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px' }}
            >
              <option value="q12h">{isAr ? 'مرتين يومياً (كل 12 ساعة — 8 ص و 8 م)' : 'Twice Daily (Every 12 hours — 8 AM & 8 PM)'}</option>
              <option value="q8h">{isAr ? '3 مرات يومياً (كل 8 ساعات — 8 ص، 4 م، 12 ص)' : '3 Times Daily (Every 8 hours — 8 AM, 4 PM, 12 AM)'}</option>
              <option value="q24h">{isAr ? 'مرة واحدة يومياً (كل 24 ساعة — 8 ص)' : 'Once Daily (Every 24 hours — 8 AM)'}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Step 2: Select Co-Medications in the Prescription */}
      <section className="card stack">
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
      <section className="card stack">
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
      <section className="card stack" style={{ borderTop: '4px solid #10b981' }}>
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
          <button type="button" className="btn ghost small" onClick={() => window.print()}>
            🖨️ {isAr ? 'طباعة جدول المواعيد' : 'Print Schedule'}
          </button>
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
            ⏱️ {isAr ? 'تسجيل الجرعات في متابع الكورس' : 'Log Doses in Course Tracker'}
          </Link>
        </div>
      </section>
    </main>
  );
}
