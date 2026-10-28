import { useEffect, useState } from 'react';
import { Bi } from './types';

export interface ClinicalProProfile {
  id: string;
  spectrum: {
    gramPositive: Bi;
    gramNegative: Bi;
    anaerobes: Bi;
    atypicals: Bi;
    clinicalPearl: Bi;
  };
  pkpd: {
    halfLife: string;
    bioavailability: string;
    proteinBinding: string;
    excretion: Bi;
    pkpdDriver: Bi;
  };
  renalCrCl: {
    normal: Bi;       // CrCl > 50 mL/min
    moderate: Bi;     // CrCl 30–50 mL/min
    severe: Bi;       // CrCl 10–29 mL/min
    esrdHd: Bi;       // CrCl < 10 mL/min or Hemodialysis
  };
  ivAndReconstitution: Bi;
  patientSimpleSummary: {
    foodRule: Bi;
    missedDoseRule: Bi;
    keyWarning: Bi;
  };
}

const PRO_STORAGE_KEY = 'aa_clinical_pro_mode';
const PRO_EVENT_NAME = 'aa-clinical-pro-mode-change';

export function useClinicalProMode(): {
  isProMode: boolean;
  setProMode: (val: boolean) => void;
  toggleProMode: () => void;
} {
  const [isProMode, setIsProModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PRO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onCustomChange = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      if (typeof detail === 'boolean') {
        setIsProModeState(detail);
      }
    };
    window.addEventListener(PRO_EVENT_NAME, onCustomChange);
    return () => window.removeEventListener(PRO_EVENT_NAME, onCustomChange);
  }, []);

  const setProMode = (val: boolean) => {
    setIsProModeState(val);
    try {
      localStorage.setItem(PRO_STORAGE_KEY, val ? 'true' : 'false');
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent<boolean>(PRO_EVENT_NAME, { detail: val }));
  };

  return {
    isProMode,
    setProMode,
    toggleProMode: () => setProMode(!isProMode),
  };
}

export const CLINICAL_PRO_PROFILES: Record<string, ClinicalProProfile> = {
  'amoxicillin-clavulanic-acid': {
    id: 'amoxicillin-clavulanic-acid',
    spectrum: {
      gramPositive: {
        ar: 'ممتاز ضد العقديات (Streptococci)، المكورات الرئوية، والمكورات العنقودية المنتجة للبيتا-لاكتاماز الحساسة للميثيسيلين (MSSA)؛ لا يغطي MRSA.',
        en: 'Strong against Streptococci, S. pneumoniae, and beta-lactamase-producing MSSA; no activity against MRSA.',
      },
      gramNegative: {
        ar: 'يغطي H. influenzae، M. catarrhalis، E. coli، Klebsiella، و Proteus المنتجة لبيتا-لاكتاماز؛ لا يغطي Pseudomonas.',
        en: 'Covers beta-lactamase-producing H. influenzae, M. catarrhalis, E. coli, Klebsiella, Proteus; does NOT cover Pseudomonas.',
      },
      anaerobes: {
        ar: 'تغطية ممتازة للاهوائيات الفموية والبطنية شاملة Bacteroides fragilis.',
        en: 'Excellent coverage of oral and intra-abdominal anaerobes including Bacteroides fragilis.',
      },
      atypicals: {
        ar: 'غير فعال ضد البكتيريا غير النمطية (Mycoplasma, Chlamydia, Legionella).',
        en: 'No activity against atypical pathogens (Mycoplasma, Chlamydia, Legionella).',
      },
      clinicalPearl: {
        ar: 'لؤلؤة إكلينيكية: لا تستبدل قرص 1 جم بقرصين من 500/125 مجم لأن ذلك يضاعف جرعة الكلافولانات (250 مجم) ويسبب إسهالاً شديداً.',
        en: 'Clinical Pearl: Never substitute two 500/125mg tablets for one 875/125mg (1g) tablet, as doubling clavulanate causes severe GI diarrhea.',
      },
    },
    pkpd: {
      halfLife: 't½ ≈ 1.0 – 1.3 hr',
      bioavailability: 'F ≈ 70% – 85%',
      proteinBinding: '18% – 25%',
      excretion: {
        ar: 'كلوي (60%–70% دون تغيير في البول خلال 6 ساعات)',
        en: 'Renal (60%–70% excreted unchanged in urine within 6h)',
      },
      pkpdDriver: {
        ar: 'معتمد على الوقت (Time-dependent: %T > MIC ≥ 40–50%)',
        en: 'Time-dependent bactericidal (%T > MIC ≥ 40–50%)',
      },
    },
    renalCrCl: {
      normal: {
        ar: 'CrCl > 30 mL/min: الجرعة المعتادة دون تعديل (مثلاً 1 جم كل 12 ساعة أو 625 مجم كل 8 ساعات).',
        en: 'CrCl > 30 mL/min: Standard dosing without adjustment (e.g., 1g q12h or 625mg q8h).',
      },
      moderate: {
        ar: 'CrCl 10–30 mL/min: 625 مجم كل 12 ساعة؛ ويُمنع استخدام تركيز 1 جم (875/125 مجم) الممتد.',
        en: 'CrCl 10–30 mL/min: 500/125mg (625mg) every 12 hours; avoid 875/125mg (1g) tablets.',
      },
      severe: {
        ar: 'CrCl < 10 mL/min: 625 مجم كل 24 ساعة فقط.',
        en: 'CrCl < 10 mL/min: 500/125mg (625mg) every 24 hours.',
      },
      esrdHd: {
        ar: 'الغسيل الكلوي (HD): 625 مجم كل 24 ساعة مع جرعة تكميلية أثناء وبعد جلسة الغسيل.',
        en: 'Hemodialysis (HD): 625mg q24h, plus an extra dose both during and at the end of dialysis.',
      },
    },
    ivAndReconstitution: {
      ar: 'الفيال الوريدي (1.2 جم): يُحل في 20 مل ماء معقم للحقن ويُعطى وريدياً ببطء على مدى 3–4 دقائق أو بالتسريب في 100 مل محلول ملح 0.9% خلال 30 دقيقة (غير مستقر في محاليل الجلوكوز أو البيكربونات). شراب الأطفال بعد الحل: يُحفظ في الثلاجة (2–8°م) لمدة 7 إلى 10 أيام فقط.',
      en: 'IV 1.2g vial: Reconstitute in 20mL SWFI, inject slowly over 3–4 min or infuse in 100mL NS over 30 min (unstable in Dextrose or Bicarbonate). Reconstituted oral suspension: Refrigerate (2–8°C) and discard after 7–10 days.',
    },
    patientSimpleSummary: {
      foodRule: {
        ar: 'يُفضل تناوله في بداية الوجبة مباشرة لتقليل اضطرابات المعدة والإسهال وزيادة امتصاص الكلافولانات.',
        en: 'Take right at the start of a meal to minimize stomach upset and optimize absorption.',
      },
      missedDoseRule: {
        ar: 'تناول الجرعة فور تذكرها، إلا إذا اقترب موعد الجرعة التالية؛ لا تضاعف الجرعة أبداً.',
        en: 'Take as soon as remembered unless close to the next dose; never double the dose.',
      },
      keyWarning: {
        ar: 'أوقف الدواء وراجع الطبيب فوراً إذا ظهر طفح جلدي أو اصفرار بالعين أو إسهال مائي شديد.',
        en: 'Stop and seek care immediately if skin rash, yellowing of eyes, or severe watery diarrhea occurs.',
      },
    },
  },
  azithromycin: {
    id: 'azithromycin',
    spectrum: {
      gramPositive: {
        ar: 'نشاط متوسط ضد المكورات العقدية والرئوية (معدلات المقاومة في ازدياد)؛ ضعيف ضد المكورات العنقودية.',
        en: 'Moderate activity against Streptococci and S. pneumoniae (rising resistance); limited against Staphylococci.',
      },
      gramNegative: {
        ar: 'فعال ضد H. influenzae، M. catarrhalis، N. gonorrhoeae، و Salmonella/Shigella المعوية.',
        en: 'Active against H. influenzae, M. catarrhalis, N. gonorrhoeae, and enteric Salmonella/Shigella.',
      },
      anaerobes: {
        ar: 'نشاط محدود ضد البكتيريا اللاهوائية.',
        en: 'Limited anaerobic activity.',
      },
      atypicals: {
        ar: 'ممتاز (خيار أول) ضد البكتيريا غير النمطية: Mycoplasma، Chlamydia، و Legionella.',
        en: 'Excellent first-line coverage against atypicals: Mycoplasma, Chlamydia, and Legionella.',
      },
      clinicalPearl: {
        ar: 'لؤلؤة إكلينيكية: يتميز بتركيز نسيجي وخلوي مرتفع جداً وفترة نصف عمر طويلة تسمح بكورس قصير (3–5 أيام)، لكن تركيزه بالدم منخفض فلا يُستخدم في تجرثم الدم (Bacteremia).',
        en: 'Clinical Pearl: High intracellular tissue penetration allows 3–5 day short courses, but low serum levels make it unsuitable for bacteremia.',
      },
    },
    pkpd: {
      halfLife: 't½ ≈ 68 hours (tissue)',
      bioavailability: 'F ≈ 37% – 38%',
      proteinBinding: '7% – 51% (concentration-dependent)',
      excretion: {
        ar: 'كبدي/صفراوي بالأساس (> 50% بدون تغيير في القنوات الصفراوية)، و6% فقط في البول.',
        en: 'Primarily biliary/hepatic (>50% unchanged in bile); only ~6% renal excretion.',
      },
      pkpdDriver: {
        ar: 'معتمد على المساحة تحت المنحنى (AUC24/MIC) مع تأثير طويل ما بعد المضاد (PAE).',
        en: 'AUC24/MIC driven with prolonged post-antibiotic effect (PAE).',
      },
    },
    renalCrCl: {
      normal: {
        ar: 'CrCl > 50 mL/min: لا يحتاج لتعديل الجرعة (500 مجم يومياً لمدة 3 أيام).',
        en: 'CrCl > 50 mL/min: No adjustment needed (500mg once daily for 3 days).',
      },
      moderate: {
        ar: 'CrCl 10–50 mL/min: لا يحتاج لتعديل جرعة.',
        en: 'CrCl 10–50 mL/min: No dosage adjustment required.',
      },
      severe: {
        ar: 'CrCl < 10 mL/min: يُستخدم بحذر (تزداد المساحة تحت المنحنى AUC بنسبة 35%) دون تغيير إلزامي بالجرعة.',
        en: 'CrCl < 10 mL/min: Use with caution (AUC increases ~35%), though no strict dose reduction is mandated.',
      },
      esrdHd: {
        ar: 'الغسيل الكلوي: لا يُزال بالغسيل الكلوي ولا يحتاج لجرعة تكميلية.',
        en: 'Hemodialysis: Not significantly cleared by dialysis; no supplemental dose needed.',
      },
    },
    ivAndReconstitution: {
      ar: 'كبسولات الأزيثرومايسين (بعكس الأقراص) يتأثر امتصاصها بالطعام؛ يُفضل تناول الكبسولات قبل الأكل بساعة أو بعده بساعتين. شراب الأطفال المعلق يُحفظ في درجة حرارة الغرفة (< 30°م) لمدة 5 إلى 10 أيام بعد الحل حسب حجم العبوة.',
      en: 'Capsules should be taken 1h before or 2h after meals; tablets may be taken with or without food. Reconstituted suspension is stable at room temperature for 5–10 days.',
    },
    patientSimpleSummary: {
      foodRule: {
        ar: 'الكبسولات تؤخذ على معدة فارغة (قبل الأكل بساعة أو بعده بساعتين)، بينما الأقراص والشراب يمكن تناولها مع الطعام أو بدونه.',
        en: 'Take capsules on an empty stomach (1h before or 2h after food); tablets/suspension can be taken with or without food.',
      },
      missedDoseRule: {
        ar: 'جرعة واحدة يومياً في نفس الموعد؛ لا تتناول جرعتين في نفس اليوم.',
        en: 'Once-daily dosing at the same time each day; never take two doses in one day.',
      },
      keyWarning: {
        ar: 'احذر إذا كنت تعاني من اضطراب ضربات القلب أو استطالة فترة QT، وافصل بينه وبين مضادات الحموضة بساعتين.',
        en: 'Use caution if you have heart rhythm disorders (QT prolongation), and separate from antacids by 2 hours.',
      },
    },
  },
  ciprofloxacin: {
    id: 'ciprofloxacin',
    spectrum: {
      gramPositive: {
        ar: 'ضعيف ضد المكورات الرئوية (Strep pneumoniae)؛ لا يُعتمد عليه في عدوى الجهاز التنفسي.',
        en: 'Poor activity against S. pneumoniae; NOT recommended for empirical community respiratory infections.',
      },
      gramNegative: {
        ar: 'تغطية فائقة للعصيات سالبة الجرام المعوية (Enterobacterales) شاملة E. coli، Salmonella، Shigella، وأقوى مضاد فموي ضد الزائفة الزنجارية (Pseudomonas aeruginosa).',
        en: 'Potent against Gram-negative bacilli (E. coli, Salmonella, Shigella, Proteus) and the most active oral agent against Pseudomonas aeruginosa.',
      },
      anaerobes: {
        ar: 'لا يغطي البكتيريا اللاهوائية (يُدمج مع ميترونيدازول في عدوى البطن).',
        en: 'No clinically reliable anaerobic coverage (combine with metronidazole for intra-abdominal infections).',
      },
      atypicals: {
        ar: 'فعال ضد Legionella و Mycoplasma و Chlamydia.',
        en: 'Active against Legionella, Mycoplasma, and Chlamydia.',
      },
      clinicalPearl: {
        ar: 'لؤلؤة إكلينيكية: الكاتيونات ثنائية وثلاثية التكافؤ (الحديد، الكالسيوم، المغنيسيوم، الزنك، الألبان) تُكوّن معقدات غير قابلة للامتصاص وتخفض تركيزه بالدم بنسبة تصل إلى 90%!',
        en: 'Clinical Pearl: Divalent/trivalent cations (Ca, Mg, Fe, Zn, dairy) chelate ciprofloxacin in the gut, slashing oral absorption by up to 90%!',
      },
    },
    pkpd: {
      halfLife: 't½ ≈ 4.0 – 5.0 hr',
      bioavailability: 'F ≈ 70% – 80%',
      proteinBinding: '20% – 40%',
      excretion: {
        ar: 'كلوي بالأساس (40%–50% بدون تغيير في البول) + إفراز صفراوي وعبر الأمعاء.',
        en: 'Primarily renal (40%–50% unchanged in urine) plus transintestinal/biliary clearance.',
      },
      pkpdDriver: {
        ar: 'معتمد على التركيز (Concentration-dependent: Cmax/MIC > 10 & AUC24/MIC > 125).',
        en: 'Concentration-dependent bactericidal (Cmax/MIC > 10 and AUC24/MIC > 125).',
      },
    },
    renalCrCl: {
      normal: {
        ar: 'CrCl > 50 mL/min: الجرعة المعتادة (500–750 مجم كل 12 ساعة فموياً، أو 400 مجم وريدياً كل 8–12 ساعة).',
        en: 'CrCl > 50 mL/min: Standard dose (500–750mg PO q12h or 400mg IV q8–12h).',
      },
      moderate: {
        ar: 'CrCl 30–50 mL/min: 250–500 مجم فموياً كل 12 ساعة (تجنب الجرعات القصوى).',
        en: 'CrCl 30–50 mL/min: 250–500mg PO every 12 hours.',
      },
      severe: {
        ar: 'CrCl 10–29 mL/min: 250–500 مجم كل 18–24 ساعة فموياً، أو 200–400 مجم وريدياً كل 24 ساعة.',
        en: 'CrCl 10–29 mL/min: 250–500mg PO q18–24h, or 200–400mg IV q24h.',
      },
      esrdHd: {
        ar: 'CrCl < 10 mL/min أو الغسيل الكلوي: 250–500 مجم كل 24 ساعة تُعطى بعد جلسة الغسيل مباشرة.',
        en: 'CrCl < 10 mL/min or HD: 250–500mg PO q24h, administered after hemodialysis session.',
      },
    },
    ivAndReconstitution: {
      ar: 'محلول التسريب الوريدي (200 مجم/100 مل): يُسرب وريدياً ببطء على مدار 60 دقيقة في وريد كبير لتقليل التهاب الوريد الموضعي؛ يُحفظ بعيداً عن الضوء.',
      en: 'IV infusion (200mg/100mL): Infuse slowly over 60 minutes into a large vein to prevent venous irritation; protect from light.',
    },
    patientSimpleSummary: {
      foodRule: {
        ar: 'اشرب كوب ماء كبير مع القرص، وافصل بينه وبين الحليب والجبن ومضادات الحموضة والحديد والكالسيوم بساعتين قبل أو 6 ساعات بعد الدواء.',
        en: 'Drink plenty of water, and separate from milk, dairy, antacids, iron, or calcium by 2 hours before or 6 hours after.',
      },
      missedDoseRule: {
        ar: 'تناوله فور التذكر ما لم يبقَ أقل من 6 ساعات على الجرعة التالية.',
        en: 'Take as soon as remembered unless less than 6 hours remain until your next scheduled dose.',
      },
      keyWarning: {
        ar: 'تحذير هام: أوقف الدواء فوراً واستشر الطبيب إذا شعرت بألم أو تورم في الأوتار (خاصة وتر العرقوب خلف الكاحل) أو تنميل بالأطراف.',
        en: 'Boxed Warning: Stop immediately and contact a doctor if you feel tendon pain/swelling (especially Achilles tendon) or nerve tingling.',
      },
    },
  },
  ceftriaxone: {
    id: 'ceftriaxone',
    spectrum: {
      gramPositive: {
        ar: 'قوي جداً ضد المكورات الرئوية (S. pneumoniae) شاملة السلالات متوسطة المقاومة للبنسلين، والعقديات؛ لا يغطي MRSA ولا Enterococci.',
        en: 'Potent against S. pneumoniae and Streptococci; no activity against MRSA or Enterococci.',
      },
      gramNegative: {
        ar: 'تغطية ممتازة لـ N. meningitidis، N. gonorrhoeae، H. influenzae، ومعظم Enterobacterales غير المنتجة لـ ESBL؛ لا يغطي Pseudomonas.',
        en: 'Excellent against N. meningitidis, N. gonorrhoeae, H. influenzae, and non-ESBL Enterobacterales; does NOT cover Pseudomonas.',
      },
      anaerobes: {
        ar: 'تغطية محدودة لللاهوائيات الفموية؛ لا يغطي B. fragilis.',
        en: 'Limited oral anaerobic coverage; does NOT cover B. fragilis.',
      },
      atypicals: {
        ar: 'غير فعال ضد الميكروبات غير النمطية.',
        en: 'No activity against atypical pathogens.',
      },
      clinicalPearl: {
        ar: 'لؤلؤة إكلينيكية حاسمة: يُمنع منعاً باتاً خلطه أو إعطاؤه بالتزامن مع محاليل تحتوي على الكالسيوم (مثل Ringer Lactate) لخطر ترسب بلورات كالسيوم-سيفترياكسون القاتلة في الرئة والكلى، ويُفضل السيفوتاكسيم بدلاً منه في حديثي الولادة.',
        en: 'Critical Pearl: Strictly CONTRAINDICATED with calcium-containing IV solutions (e.g., Ringer’s Lactate) due to fatal ceftriaxone-calcium precipitation in lungs/kidneys; prefer cefotaxime in neonates.',
      },
    },
    pkpd: {
      halfLife: 't½ ≈ 6.0 – 9.0 hr (longest among cephalosporins)',
      bioavailability: '100% (IM / IV only)',
      proteinBinding: '85% – 95%',
      excretion: {
        ar: 'إخراج مزدوج متوازن: 50%–60% كلوي في البول، و40%–50% صفراوي في البراز.',
        en: 'Dual elimination: 50%–60% renal unchanged in urine and 40%–50% biliary excretion.',
      },
      pkpdDriver: {
        ar: 'معتمد على الوقت (%T > MIC)؛ نصف عمره الطويل يسمح بجرعة واحدة كل 24 ساعة في معظم العدوى.',
        en: 'Time-dependent (%T > MIC); long half-life supports once-daily (q24h) dosing in most infections.',
      },
    },
    renalCrCl: {
      normal: {
        ar: 'CrCl > 50 mL/min: 1–2 جم كل 24 ساعة (أو 2 جم كل 12 ساعة في الالتهاب السحائي البكتيري).',
        en: 'CrCl > 50 mL/min: 1–2g q24h (or 2g q12h for bacterial meningitis).',
      },
      moderate: {
        ar: 'CrCl 30–50 mL/min: لا يحتاج لتعديل الجرعة بفضل الإخراج المزدوج الكبدي-الكلوي.',
        en: 'CrCl 30–50 mL/min: No dosage adjustment required due to dual hepatic-renal clearance.',
      },
      severe: {
        ar: 'CrCl 10–29 mL/min: لا يحتاج لتعديل ما لم يصاحبه قصور كبدي متزامن (الحد الأقصى 2 جم يومياً).',
        en: 'CrCl 10–29 mL/min: No adjustment unless concomitant hepatic impairment (max 2g/day).',
      },
      esrdHd: {
        ar: 'CrCl < 10 mL/min أو الغسيل الكلوي: لا يُزال بالغسيل؛ الحد الأقصى 2 جم كل 24 ساعة.',
        en: 'CrCl < 10 mL/min or HD: Not dialyzed; maximum 2g/day.',
      },
    },
    ivAndReconstitution: {
      ar: 'ملاحظة هامة للتفريق بين الفيال العضلي والوريدي: أمبول المذيب المرفق للحقن العضلي يحتوي على ليدوكايين (Lidocaine 1%) ويُمنع منعاً باتاً حقنه في الوريد! للحقن الوريدي يُحل فقط في ماء معقم للحقن أو محلول ملح 0.9% أو جلوكوز 5%.',
      en: 'CRITICAL ROUTE WARNING: IM solvent ampoules contain 1% Lidocaine and MUST NEVER be injected IV! For IV administration, reconstitute only with sterile water, NS 0.9%, or D5W.',
    },
    patientSimpleSummary: {
      foodRule: {
        ar: 'يُعطى عن طريق الحقن فقط ولا يتأثر بمواعيد الطعام.',
        en: 'Administered by injection only; not affected by food.',
      },
      missedDoseRule: {
        ar: 'التزم بموعد الحقنة اليومي كل 24 ساعة (أو 12 ساعة حسب وصف الطبيب) لضمان القضاء على البكتيريا.',
        en: 'Keep your scheduled injection every 24h (or 12h as prescribed) to prevent bacterial relapse.',
      },
      keyWarning: {
        ar: 'يُمنع أخذ حقنة السيفترياكسون بدون إشراف طبي أو لعلاج نزلات البرد («حقنة البرد»)، ويجب التأكد من عدم وجود حساسية مفرطة.',
        en: 'Never use Ceftriaxone for viral colds ("cold shots") or outside medical supervision due to anaphylaxis risk.',
      },
    },
  },
};

export function getClinicalProProfile(
  medId: string,
  whoGroup: 'Access' | 'Watch' | 'Reserve' = 'Access',
  drugClassAr = '',
  drugClassEn = ''
): ClinicalProProfile {
  if (CLINICAL_PRO_PROFILES[medId]) {
    return CLINICAL_PRO_PROFILES[medId];
  }

  // Intelligent class-based clinical profile generator for the remaining active ingredients
  const isBetaLactam =
    medId.includes('amox') ||
    medId.includes('ampicillin') ||
    medId.includes('penicillin') ||
    medId.includes('fluclox') ||
    medId.includes('cef') ||
    medId.includes('ceph') ||
    medId.includes('mero') ||
    medId.includes('imipenem') ||
    medId.includes('piperacillin');

  const isFluoroquinolone = medId.includes('floxacin');
  const isMacrolide = medId.includes('mycin') && !medId.includes('vanco') && !medId.includes('clinda') && !medId.includes('genta');
  const isAminoglycoside = medId.includes('genta') || medId.includes('amika');
  const isReserveOrGlyco = whoGroup === 'Reserve' || medId === 'vancomycin' || medId === 'linezolid';

  return {
    id: medId,
    spectrum: {
      gramPositive: {
        ar: isAminoglycoside
          ? 'نشاط تآزري فقط مع البيتا-لاكتام ضد المكورات إيجابية الجرام؛ لا يُستخدم منفرداً للمكورات العقدية.'
          : isReserveOrGlyco
            ? 'تغطية مستهدفة وقوية للبكتيريا إيجابية الجرام المقاومة شاملة MRSA و/أو المكورات المعوية VRE.'
            : 'تغطية فعالة للسلالات إيجابية الجرام الحساسة ضمن نطاق العائلة الدوائية (' + (drugClassAr || 'مضاد بكتيري') + ').',
        en: isAminoglycoside
          ? 'Synergistic activity only with beta-lactams against Gram-positive cocci; do not use as monotherapy for Streptococci.'
          : isReserveOrGlyco
            ? 'Targeted potent coverage against resistant Gram-positive pathogens including MRSA and/or VRE.'
            : `Active against susceptible Gram-positive organisms within ${drugClassEn || 'its pharmacological class'}.`,
      },
      gramNegative: {
        ar: isAminoglycoside || isFluoroquinolone
          ? 'تغطية قوية وواسعة للعصيات سالبة الجرام الهوائية شاملة Enterobacterales و Pseudomonas aeruginosa.'
          : isReserveOrGlyco
            ? 'لا يغطي البكتيريا سالبة الجرام (مخصص لموجبات الجرام المقاومة، باستثناء الكوليستين/التيجيسيكلين).'
            : 'تغطية معتدلة إلى واسعة للبكتيريا سالبة الجرام حسب الجيل الدوائي وحساسية المزرعة.',
        en: isAminoglycoside || isFluoroquinolone
          ? 'Potent coverage against aerobic Gram-negative bacilli including Enterobacterales and Pseudomonas.'
          : isReserveOrGlyco
            ? 'Focused on resistant target pathogens based on culture & sensitivity.'
            : 'Moderate-to-broad Gram-negative activity according to generation and local antibiogram.',
      },
      anaerobes: {
        ar:
          medId === 'metronidazole' || medId === 'clindamycin' || medId === 'meropenem'
            ? 'تغطية ممتازة ومباشرة للبكتيريا اللاهوائية (Anaerobes).'
            : 'نشاط محدود ضد اللاهوائيات ما لم يُدمج مع مضاد لاهوائيات متخصص.',
        en:
          medId === 'metronidazole' || medId === 'clindamycin' || medId === 'meropenem'
            ? 'Excellent direct coverage against obligate anaerobes.'
            : 'Limited anaerobic activity unless combined with a dedicated anti-anaerobic agent.',
      },
      atypicals: {
        ar:
          isMacrolide || isFluoroquinolone || medId === 'doxycycline'
            ? 'فعال ضد البكتيريا غير النمطية داخل الخلوية (Mycoplasma, Chlamydia, Legionella).'
            : 'غير فعال ضد البكتيريا غير النمطية لعدم وجود هدف جداري لها.',
        en:
          isMacrolide || isFluoroquinolone || medId === 'doxycycline'
            ? 'Active against intracellular atypical pathogens (Mycoplasma, Chlamydia, Legionella).'
            : 'Inactive against atypical bacteria lacking a standard peptidoglycan cell wall.',
      },
      clinicalPearl: {
        ar:
          whoGroup === 'Reserve'
            ? 'لؤلؤة إكلينيكية: من أدوية الملاذ الأخير (WHO Reserve) — يُصرف حصرياً بناءً على مزرعة بكتيرية موثقة واستشارة فريق مكافحة العدوى.'
            : isBetaLactam
              ? 'لؤلؤة إكلينيكية: تحقق دائماً من تاريخ الحساسية للبنسلينات والسيفالوسبورينات، والتزم بالفاصل الزمني الدقيق لأن الفعالية تعتمد على بقاء التركيز فوق MIC.'
              : 'لؤلؤة إكلينيكية: راجع وظائف الكلى والكبد والأدوية المتزامنة قبل بدء الكورس العلاجي.',
        en:
          whoGroup === 'Reserve'
            ? 'Clinical Pearl: WHO Reserve agent — restrict strictly to culture-proven multi-drug resistant infections under stewardship review.'
            : isBetaLactam
              ? 'Clinical Pearl: Always screen for beta-lactam allergy history and maintain strict dosing intervals to maximize %T > MIC.'
              : 'Clinical Pearl: Verify baseline renal/hepatic function and concomitant medications prior to initiation.',
      },
    },
    pkpd: {
      halfLife: isBetaLactam ? 't½ ≈ 1.0 – 2.5 hr' : isFluoroquinolone ? 't½ ≈ 6.0 – 12.0 hr' : 't½ ≈ 3.0 – 8.0 hr',
      bioavailability: isAminoglycoside ? 'Parenteral (IV/IM) / Topical' : 'F ≈ 60% – 90%',
      proteinBinding: '20% – 60%',
      excretion: {
        ar: isBetaLactam || isAminoglycoside || isFluoroquinolone
          ? 'إخراج كلوي بالأساس عن طريق الترشيح الكبيبي والإفراز الأنبوبي.'
          : 'أيض كبدي وإخراج مشترك (كلوي / صفراوي).',
        en: isBetaLactam || isAminoglycoside || isFluoroquinolone
          ? 'Predominantly renal elimination via glomerular filtration and tubular secretion.'
          : 'Hepatic metabolism with mixed renal/biliary excretion.',
      },
      pkpdDriver: {
        ar: isBetaLactam
          ? 'معتمد على الوقت (%T > MIC)'
          : isAminoglycoside || isFluoroquinolone
            ? 'معتمد على التركيز الأقصى (Cmax/MIC & AUC/MIC)'
            : 'معتمد على إجمالي التعرض الدوائي (AUC24/MIC)',
        en: isBetaLactam
          ? 'Time-dependent (%T > MIC)'
          : isAminoglycoside || isFluoroquinolone
            ? 'Concentration-dependent (Cmax/MIC & AUC/MIC)'
            : 'Exposure-dependent (AUC24/MIC)',
      },
    },
    renalCrCl: {
      normal: {
        ar: 'CrCl > 50 mL/min: الجرعة القياسية الكاملة حسب شدة العدوى والوزن.',
        en: 'CrCl > 50 mL/min: Full standard dosing regimen based on infection severity.',
      },
      moderate: {
        ar: 'CrCl 30–50 mL/min: يُمدد الفاصل الزمني بين الجرعات أو تُخفض الجرعة بنسبة 25%–50% للأدوية ذات الإخراج الكلوي.',
        en: 'CrCl 30–50 mL/min: Extend dosing interval or reduce dose by 25%–50% for renally cleared agents.',
      },
      severe: {
        ar: 'CrCl 10–29 mL/min: خفض الجرعة إلى 50% أو مضاعفة الفاصل الزمني مع مراقبة وظائف الكلى (Serum Creatinine).',
        en: 'CrCl 10–29 mL/min: Reduce dose by 50% or double the interval; monitor serum creatinine closely.',
      },
      esrdHd: {
        ar: 'CrCl < 10 mL/min أو الغسيل الكلوي: تُعطى الجرعة المعدلة بعد جلسة الغسيل الكلوي مع متابعة المستويات العلاجية إن لزم.',
        en: 'CrCl < 10 mL/min or HD: Administer adjusted maintenance dose post-hemodialysis.',
      },
    },
    ivAndReconstitution: {
      ar: 'للمستحضرات الوريدية: يُحل المسحوق في ماء معقم للحقن أو محلول ملح 0.9% ويُسرب ببطء على مدار 30–60 دقيقة. لشراب الأطفال المعلق: يُرج جيداً قبل كل جرعة ويُتخلص من المتبقي بعد انتهاء مدة الصلاحية المحددة على العبوة (7–14 يوماً).',
      en: 'For IV formulations: Reconstitute with SWFI or NS 0.9% and infuse over 30–60 minutes. For oral suspensions: Shake well before each dose and discard unused portion after 7–14 days.',
    },
    patientSimpleSummary: {
      foodRule: {
        ar: 'اتبع إرشادات الطبيب أو الصيدلي حول تناوله مع الطعام أو على معدة فارغة، واشرب كمية كافية من الماء.',
        en: 'Follow your pharmacist’s instructions regarding meals, and drink a full glass of water with oral doses.',
      },
      missedDoseRule: {
        ar: 'خذ الجرعة الفائتة فور تذكرها، ولا تضاعف الجرعة أبداً لتعويض الجرعة المنسية.',
        en: 'Take a missed dose as soon as you remember, and never double up on the next dose.',
      },
      keyWarning: {
        ar: 'أكمل كورس المضاد الحيوي للنهاية حتى لو اختفت الأعراض، وتوقف فوراً إذا ظهرت أعراض حساسية.',
        en: 'Complete the full prescribed course even if you feel better, and stop immediately if an allergic rash develops.',
      },
    },
  };
}
