import { useEffect, useState } from 'react';
import { Bi } from './types';

export interface ClinicalProProfile {
  pkpd: {
    halfLife: string;
    bioavailability: string;
    proteinBinding: string;
    pkpdDriver: Bi;
    excretion: Bi;
  };
  spectrum: {
    gramPositive: Bi;
    gramNegative: Bi;
    anaerobes: Bi;
    atypicals: Bi;
    clinicalPearl: Bi;
  };
  renalCrCl: {
    normal: Bi;
    moderate: Bi;
    severe: Bi;
    esrdHd: Bi;
  };
  ivAndReconstitution: Bi;
  patientSimpleSummary: {
    foodRule: Bi;
    missedDoseRule: Bi;
    keyWarning: Bi;
  };
}

const PRO_MODE_KEY = 'aa_clinical_pro_mode';

export function useClinicalProMode() {
  const [isProMode, setIsProModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PRO_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onSync = () => {
      try {
        setIsProModeState(localStorage.getItem(PRO_MODE_KEY) === 'true');
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('aa-pro-mode-changed', onSync);
    return () => window.removeEventListener('aa-pro-mode-changed', onSync);
  }, []);

  const setProMode = (val: boolean) => {
    setIsProModeState(val);
    try {
      localStorage.setItem(PRO_MODE_KEY, val ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('aa-pro-mode-changed'));
    } catch {
      /* ignore */
    }
  };

  return { isProMode, setProMode };
}

const b = (ar: string, en: string, fr: string, es: string, de: string): Bi => ({
  ar,
  en,
  fr,
  es,
  de,
});

export function getClinicalProProfile(
  medId: string,
  _whoAccessGroup: string,
  _drugClassAr: string,
  drugClassEn: string
): ClinicalProProfile {
  const id = (medId || '').toLowerCase();
  const cls = (drugClassEn || '').toLowerCase();

  // 1. Fluoroquinolones (Ciprofloxacin, Levofloxacin, Moxifloxacin)
  if (id.includes('floxacin') || cls.includes('fluoroquinolone') || cls.includes('quinolone')) {
    const isMoxi = id.includes('moxi');
    return {
      pkpd: {
        halfLife: isMoxi ? 't½ ≈ 12 h' : id.includes('levo') ? 't½ ≈ 6–8 h' : 't½ ≈ 4–5 h',
        bioavailability: isMoxi ? 'F ≈ 90% (PO≈IV)' : id.includes('levo') ? 'F ≈ 99% (PO=IV)' : 'F ≈ 70–80%',
        proteinBinding: '20–40%',
        pkpdDriver: b(
          'يعتمد على التركيز والمساحة تحت المنحنى (AUC₂₄/MIC ≥ 125 & Cmax/MIC)',
          'Concentration-dependent (fAUC₂₄/MIC & Cmax/MIC)',
          'Concentration-dépendant (fAUC₂₄/CMI & Cmax/CMI)',
          'Dependiente de la concentración (fAUC₂₄/CMI y Cmax/CMI)',
          'Konzentrationsabhängig (fAUC₂₄/MHK & Cmax/MHK)'
        ),
        excretion: isMoxi
          ? b(
              'إخراج كبدي وصفراوي رئيسي (لا يحتاج تعديل كلوي)',
              'Primarily hepatic/biliary (~20% unchanged in urine; no renal adjustment)',
              'Élimination hépatique/biliaire principale (pas d’ajustement rénal)',
              'Eliminación hepática/biliar principal (sin ajuste renal)',
              'Überwiegend hepatisch/biliär (keine Dosisanpassung bei Niereninsuffizienz)'
            )
          : b(
              'إخراج كلوي رئيسي عبر الترشيح الكبيبي والإفراز الأنبوبي (60–85%)',
              'Primarily renal glomerular filtration & tubular secretion (60–85% unchanged)',
              'Élimination rénale prédominante (60–85 % sous forme inchangée)',
              'Eliminación renal predominante (60–85 % inalterado en orina)',
              'Überwiegend renale Ausscheidung (60–85 % unverändert im Urin)'
            ),
      },
      spectrum: {
        gramPositive: b(
          isMoxi || id.includes('levo') ? 'تغطية قوية للمكورات الرئوية (S. pneumoniae)؛ لا يغطي MRSA.' : 'تغطية ضعيفة للمكورات العقدية الرئوية (لا يستخدم للالتهاب الرئوي المجتمعي).',
          isMoxi || id.includes('levo') ? 'Strong S. pneumoniae coverage (respiratory quinolone); no reliable MRSA activity.' : 'Weak S. pneumoniae activity (do not use empirically for community pneumonia).',
          isMoxi || id.includes('levo') ? 'Bonne activité sur S. pneumoniae (quinolone respiratoire) ; inactif sur SARM.' : 'Faible activité sur S. pneumoniae.',
          isMoxi || id.includes('levo') ? 'Buena cobertura frente a S. pneumoniae; sin actividad fiable frente a SARM.' : 'Actividad débil frente a S. pneumoniae.',
          isMoxi || id.includes('levo') ? 'Gute Wirksamkeit gegen S. pneumoniae (Atemwegs-Chinolon); keine zuverlässige MRSA-Aktivität.' : 'Schwache Aktivität gegen S. pneumoniae (nicht empirisch bei ambulant erworbener Pneumonie).'
        ),
        gramNegative: b(
          'تغطية ممتازة للبكتيريا المعوية (Enterobacterales) شاملة الزائفة الزنجارية (Pseudomonas في سيبروفلوكساسين وليفوفلوكساسين).',
          'Potent activity against Enterobacterales and Pseudomonas aeruginosa (Ciprofloxacin/Levofloxacin).',
          'Forte activité sur les Entérobactéries et Pseudomonas aeruginosa (Ciprofloxacine/Lévofloxacine).',
          'Potente actividad frente a Enterobacterales y Pseudomonas aeruginosa (Ciprofloxacino/Levofloxacino).',
          'Starke Wirksamkeit gegen Enterobacterales und Pseudomonas aeruginosa (Ciprofloxacin/Levofloxacin).'
        ),
        anaerobes: b(
          isMoxi ? 'تغطية جيدة للبكتيريا اللاهوائية.' : 'لا توجد تغطية سريرية للبكتيريا اللاهوائية.',
          isMoxi ? 'Moderate-to-good anaerobic activity.' : 'No clinically reliable anaerobic coverage.',
          isMoxi ? 'Activité anaérobie notable.' : 'Pas de couverture anaérobie cliniquement fiable.',
          isMoxi ? 'Actividad anaerobia moderada-buena.' : 'Sin cobertura anaerobia clínicamente fiable.',
          isMoxi ? 'Gute Wirksamkeit gegen Anaerobier.' : 'Keine klinisch relevante Anaerobier-Abdeckung.'
        ),
        atypicals: b(
          'تغطية ممتازة للبكتيريا غير النمطية (Mycoplasma, Chlamydia, Legionella).',
          'Excellent coverage of atypical pathogens (Legionella, Mycoplasma, Chlamydophila).',
          'Excellente couverture des germes atypiques (Legionella, Mycoplasma, Chlamydia).',
          'Excelente cobertura de patógenos atípicos (Legionella, Mycoplasma, Chlamydia).',
          'Ausgezeichnete Abdeckung atypischer Erreger (Legionellen, Mykoplasmen, Chlamydien).'
        ),
        clinicalPearl: b(
          'افصل الدواء ساعتين قبل أو 6 ساعات بعد الحليب، مضادات الحموضة، الحديد، الزنك، والكالسيوم لمنع الخلب الدوائي (Chelation) وفشل العلاج.',
          'Separate by ≥2h before or 6h after dairy, antacids, iron, calcium, or zinc to prevent divalent cation chelation and >70% loss of absorption.',
          'Espacer de 2h avant ou 6h après les produits laitiers, antiacides, fer, calcium ou zinc (risque de chélation).',
          'Separar ≥2h antes o 6h después de lácteos, antiácidos, hierro, calcio o zinc para evitar quelación.',
          'Mindestens 2 Std. vor oder 6 Std. nach Milchprodukten, Antazida, Eisen, Kalzium oder Zink einnehmen, um Chelatbildung und Wirkverlust zu verhindern.'
        ),
      },
      renalCrCl: {
        normal: b('الجرعة المعتادة كاملة (100% بدون تعديل).', 'Standard full dose (100% without adjustment).', 'Dose standard complète (100 %).', 'Dosis estándar completa (100 %).', 'Volle Standarddosis (100 % ohne Anpassung).'),
        moderate: b(isMoxi ? 'لا يتطلب تعديل كلوي.' : 'خفض الجرعة بنسبة 25–50% أو إطالة الفترة إلى كل 12–24 ساعة.', isMoxi ? 'No renal dose adjustment required.' : 'Reduce dose by 25–50% or extend interval to q12–24h.', isMoxi ? 'Aucun ajustement rénal requis.' : 'Réduire la dose de 25–50 % ou espacer toutes les 12–24h.', isMoxi ? 'No requiere ajuste renal.' : 'Reducir dosis 25–50 % o espaciar cada 12–24h.', isMoxi ? 'Keine renale Dosisanpassung erforderlich.' : 'Dosis um 25–50 % reduzieren oder Intervall auf alle 12–24 Std. verlängern.'),
        severe: b(isMoxi ? 'لا يتطلب تعديل كلوي.' : '50% من الجرعة المعتادة كل 24–48 ساعة مع مراقبة استطالة QT والأوتار.', isMoxi ? 'No renal dose adjustment required.' : '50% of standard dose every 24–48h; monitor QTc and tendon safety.', isMoxi ? 'Aucun ajustement rénal requis.' : '50 % de la dose toutes les 24–48h ; surveiller QT et tendons.', isMoxi ? 'No requiere ajuste renal.' : '50 % de la dosis cada 24–48h; vigilar QT y tendones.', isMoxi ? 'Keine renale Dosisanpassung erforderlich.' : '50 % der Standarddosis alle 24–48 Std.; QTc-Zeit und Sehnen überwachen.'),
        esrdHd: b(isMoxi ? 'الجرعة المعتادة بدون جرعة تكميلية بعد الغسيل.' : 'جرعة مخفضة كل 24–48 ساعة وتُعطى بعد جلسة الغسيل الكلوي.', isMoxi ? 'Standard dose; no supplemental post-HD dose needed.' : 'Reduced dose q24–48h; administer after hemodialysis session.', isMoxi ? 'Dose standard.' : 'Dose réduite toutes les 24–48h, à administrer après l’hémodialyse.', isMoxi ? 'Dosis estándar.' : 'Dosis reducida cada 24–48h, administrar después de hemodiálisis.', isMoxi ? 'Standarddosis; keine Zusatzdosis nach Hämodialyse.' : 'Reduzierte Dosis alle 24–48 Std.; Gabe nach der Hämodialyse.'),
      },
      ivAndReconstitution: b(
        'يُعطى بالتسريب الوريدي البطيء على مدار 60 دقيقة لتجنب التهاب الوريد وهبوط الضغط؛ لا يُخلط في نفس الخط مع الهيبارين أو المحاليل القلوية.',
        'Infuse IV slowly over 60 minutes in NS or D5W to avoid venous irritation and hypotension; do not co-infuse with heparin or divalent cations.',
        'Perfusion IV lente sur 60 minutes dans NaCl 0,9 % ou G5 % ; ne pas mélanger avec l’héparine ou des cations divalents.',
        'Infundir por vía IV lentamente durante 60 minutos en SF o SG5 %; no mezclar con heparina ni cationes divalentes.',
        'Langsame i.v.-Infusion über 60 Minuten in NaCl 0,9 % oder G5 % zur Vermeidung von Venenreizungen; nicht mit Heparin oder zweiwertigen Kationen mischen.'
      ),
      patientSimpleSummary: {
        foodRule: b(
          'يمكن تناوله مع الطعام، لكن ابتعد تماماً عن الحليب والجبن والزبادي ومضادات الحموضة والحديد قبل وبعد الدواء بـ 2 إلى 6 ساعات.',
          'May take with meals, but strictly avoid milk, yogurt, antacids, iron, or calcium within 2 hours before or 6 hours after taking the tablet.',
          'Peut être pris pendant les repas, mais évitez le lait, les produits laitiers, le fer et le calcium 2h avant et 6h après.',
          'Puede tomarse con comida, pero evite leche, lácteos, antiácidos, hierro o calcio 2h antes y 6h después.',
          'Einnahme zu den Mahlzeiten möglich, aber Milchprodukte, Antazida, Eisen und Kalzium 2 Std. davor bis 6 Std. danach strikt meiden.'
        ),
        missedDoseRule: b(
          'تناول الجرعة فور تذكرها إلا إذا تبقى أقل من 6 ساعات على الجرعة التالية؛ لا تضاعف الجرعة أبداً.',
          'Take as soon as remembered unless within 6 hours of the next scheduled dose; never double a dose.',
          'Prenez la dose dès que possible sauf s’il reste moins de 6h avant la suivante ; ne doublez jamais la dose.',
          'Tome la dosis en cuanto lo recuerde salvo que falten menos de 6h para la siguiente; nunca duplique la dosis.',
          'Vergessene Dosis sofort nachholen, außer die nächste ist in weniger als 6 Stunden fällig; niemals die doppelte Dosis einnehmen.'
        ),
        keyWarning: b(
          'توقف فوراً وراجع الطبيب إذا شعرت بألم أو تورم في الأوتار (عرقوب القدم) أو تنميل بالأطراف.',
          'Stop immediately and contact your doctor if you experience tendon pain/swelling (Achilles) or nerve tingling.',
          'Arrêtez immédiatement et consultez un médecin en cas de douleur tendineuse (tendon d’Achille) ou de fourmillements.',
          'Suspenda de inmediato y consulte al médico si presenta dolor o inflamación en los tendones o entumecimiento.',
          'Sofort absetzen und ärztlichen Rat einholen bei Sehnenschmerzen/-schwellungen (Achillessehne) oder Kribbeln/Taubheitsgefühl.'
        ),
      },
    };
  }

  // 2. Macrolides (Azithromycin, Clarithromycin, Erythromycin)
  if (id.includes('mycin') && (cls.includes('macrolide') || id.includes('azithro') || id.includes('clarithro') || id.includes('erythro'))) {
    const isAzithro = id.includes('azithro');
    return {
      pkpd: {
        halfLife: isAzithro ? 't½ ≈ 68 h (tissue)' : 't½ ≈ 3–7 h',
        bioavailability: isAzithro ? 'F ≈ 38%' : 'F ≈ 50–55%',
        proteinBinding: isAzithro ? '7–51% (dose-dependent)' : '40–70%',
        pkpdDriver: b(
          'يعتمد على المساحة تحت المنحنى فوق التركيز المثبط (fAUC₂₄/MIC) مع تأثير ممتد داخل الخلايا',
          'Time- & Exposure-dependent (fAUC₂₄/MIC) with prolonged intracellular post-antibiotic effect',
          'Exposition-dépendant (fAUC₂₄/CMI) avec fort effet post-antibiotique intracellulaire',
          'Dependiente de la exposición (fAUC₂₄/CMI) con efecto postantibiótico intracelular prolongado',
          'Expositionsabhängig (fAUC₂₄/MHK) mit ausgeprägtem intrazellulärem postantibiotischem Effekt'
        ),
        excretion: b(
          'إخراج صفراوي وكبدي رئيسي (أقل من 15% يخرج عبر الكلى)',
          'Primarily biliary and hepatic clearance (<10–15% excreted unchanged in urine)',
          'Élimination biliaire et hépatique prédominante (<15 % rénale)',
          'Eliminación biliar y hepática predominante (<15 % renal)',
          'Überwiegend biliäre und hepatische Elimination (<15 % unverändert renal)'
        ),
      },
      spectrum: {
        gramPositive: b(
          'تغطية للمكورات العقدية والعنقودية الحساسة (مع ملاحظة تزايد مقاومة S. pneumoniae).',
          'Active against susceptible Streptococci and MSSA (note rising S. pneumoniae resistance rates).',
          'Actif sur les Streptocoques et SAMS sensibles (taux de résistance de S. pneumoniae en hausse).',
          'Activo frente a Estreptococos y SASM sensibles (con tasas crecientes de resistencia en S. pneumoniae).',
          'Wirksam gegen empfindliche Streptokokken und MSSA (steigende Resistenzraten bei S. pneumoniae beachten).'
        ),
        gramNegative: b(
          'يغطي المستدمية النزلية (H. influenzae)، الموراكسيلا، السالمونيلا التيفية (أزيثرومايسين)، والنيسرية.',
          'Covers H. influenzae, Moraxella catarrhalis, Bordetella pertussis, and enteric Salmonella/Shigella (Azithromycin).',
          'Couvre H. influenzae, Moraxella catarrhalis, Bordetella pertussis et Salmonella/Shigella (Azithromycine).',
          'Cubre H. influenzae, Moraxella catarrhalis, Bordetella pertussis y Salmonella/Shigella (Azitromicina).',
          'Erfasst H. influenzae, Moraxella catarrhalis, Bordetella pertussis sowie Salmonellen/Shigellen (Azithromycin).'
        ),
        anaerobes: b(
          'تغطية محدودة للاهوائيات الفموية فقط (لا يغطي B. fragilis).',
          'Limited upper-airway anaerobic activity only (no Bacteroides fragilis coverage).',
          'Activité limitée aux anaérobies buccaux uniquement (inactif sur B. fragilis).',
          'Actividad limitada a anaerobios orales (sin cobertura frente a B. fragilis).',
          'Nur begrenzte Aktivität gegen orale Anaerobier (keine Wirksamkeit gegen Bacteroides fragilis).'
        ),
        atypicals: b(
          'خط علاجي متميز للبكتيريا غير النمطية داخل الخلايا (Mycoplasma, Chlamydia, Legionella).',
          'First-line intracellular activity against Mycoplasma, Chlamydophila, and Legionella.',
          'Activité intracellulaire de référence sur Mycoplasma, Chlamydia et Legionella.',
          'Actividad intracelular de elección frente a Mycoplasma, Chlamydia y Legionella.',
          'Exzellente intrazelluläre Wirksamkeit gegen Mykoplasmen, Chlamydien und Legionellen.'
        ),
        clinicalPearl: b(
          'احذر من استطالة فترة QT القلبية والتداخل الدوائي القوي عبر إنزيم CYP3A4 (خصوصاً كلاريثرومايسين وإريثرومايسين مع أدوية الكوليسترول والسيولة).',
          'Monitor QTc interval and screen for potent CYP3A4 inhibition (especially Clarithromycin/Erythromycin with statins, warfarin, and antiarrhythmics).',
          'Surveiller l’intervalle QTc et l’inhibition puissante du CYP3A4 (Clarithromycine/Érythromycine avec statines et warfarine).',
          'Vigilar el intervalo QTc y la potente inhibición de CYP3A4 (Claritromicina/Eritromicina con estatinas y warfarina).',
          'QTc-Verlängerung und starke CYP3A4-Hemmung beachten (insb. Clarithromycin/Erythromycin mit Statinen, Warfarin und Antiarrhythmika).'
        ),
      },
      renalCrCl: {
        normal: b('الجرعة القياسية كاملة (100%).', 'Standard full dose (100%).', 'Dose standard complète (100 %).', 'Dosis estándar completa (100 %).', 'Volle Standarddosis (100 %).'),
        moderate: b(isAzithro ? 'لا يحتاج تعديل جرعة.' : 'خفض جرعة كلاريثرومايسين بنسبة 50% إذا كانت CrCl أقل من 30 مل/دقيقة.', isAzithro ? 'No dose adjustment needed.' : 'No change until CrCl < 30 mL/min.', isAzithro ? 'Aucun ajustement requis.' : 'Pas de modification si CrCl ≥ 30 mL/min.', isAzithro ? 'No requiere ajuste.' : 'Sin cambios si CrCl ≥ 30 mL/min.', isAzithro ? 'Keine Dosisanpassung erforderlich.' : 'Keine Anpassung bei CrCl ≥ 30 ml/min.'),
        severe: b(isAzithro ? 'استخدم بحذر في القصور الكلوي الشديد جداً (CrCl < 10).' : 'خفض جرعة كلاريثرومايسين بنسبة 50% (مثلاً 250 مجم مرة أو مرتين يومياً).', isAzithro ? 'Use with caution if CrCl < 10 mL/min; no routine reduction.' : 'Reduce Clarithromycin dose by 50% when CrCl < 30 mL/min.', isAzithro ? 'Prudence si CrCl < 10 mL/min.' : 'Réduire la dose de Clarithromycine de 50 % si CrCl < 30 mL/min.', isAzithro ? 'Precaución si CrCl < 10 mL/min.' : 'Reducir la dosis de Claritromicina un 50 % si CrCl < 30 mL/min.', isAzithro ? 'Vorsicht bei CrCl < 10 ml/min; keine routinemäßige Reduktion.' : 'Clarithromycin-Dosis bei CrCl < 30 ml/min um 50 % reduzieren.'),
        esrdHd: b(isAzithro ? 'لا يُزال بالغسيل الكلوي؛ الجرعة المعتادة.' : '50% من الجرعة وتُعطى بعد جلسة الغسيل الكلوي.', isAzithro ? 'Not dialyzed; standard dosing.' : '50% dose administered after hemodialysis.', isAzithro ? 'Non dialysé ; dose habituelle.' : '50 % de la dose après la séance d’hémodialyse.', isAzithro ? 'No se dializa; dosis habitual.' : '50 % de la dosis después de hemodiálisis.', isAzithro ? 'Nicht dialysierbar; Standarddosierung.' : '50 % der Dosis, Gabe nach der Hämodialyse.'),
      },
      ivAndReconstitution: b(
        'الأشكال الوريدية تُعطى بالتسريب الوريدي البطيء فقط على مدار 60 دقيقة بتركيز مخفف (1–2 مجم/مل)؛ ممنوع الحقن الوريدي المباشر السريع (IV Push) أو العضلي.',
        'Administer IV formulations by slow infusion over ≥60 minutes at 1–2 mg/mL; NEVER give as IV push or IM injection.',
        'Administrer les formes IV en perfusion lente sur ≥60 minutes (1–2 mg/mL) ; jamais en IV directe ni en IM.',
        'Administrar las formas IV en perfusión lenta durante ≥60 minutos (1–2 mg/mL); nunca en bolo IV ni IM.',
        'i.v.-Formulierungen nur als langsame Infusion über ≥60 Minuten (1–2 mg/ml) verabreichen; NIEMALS als i.v.-Bolus oder i.m.-Injektion.'
      ),
      patientSimpleSummary: {
        foodRule: b(
          'الأقراص المغلفة يمكن تناولها مع الطعام أو بدونه (تناولها مع وجبة خفيفة يقلل تقلصات المعدة). الكبسولات القديمة تُؤخذ قبل الأكل بساعة أو بعده بساعتين.',
          'Film-coated tablets and suspensions can be taken with or without food (taking with food reduces stomach upset). Capsules should be taken 1h before or 2h after meals.',
          'Les comprimés pelliculés peuvent être pris avec ou sans nourriture. Les gélules se prennent 1h avant ou 2h après les repas.',
          'Los comprimidos recubiertos pueden tomarse con o sin alimentos. Las cápsulas se toman 1h antes o 2h después de comer.',
          'Filmtabletten und Suspensionen können unabhängig von den Mahlzeiten eingenommen werden (mit Nahrung besser magenverträglich). Kapseln 1 Std. vor oder 2 Std. nach dem Essen.'
        ),
        missedDoseRule: b(
          'تناول الجرعة فور تذكرها، ولا تجمع جرعتين معاً في نفس اليوم.',
          'Take the missed dose as soon as you remember; do not take two doses on the same day.',
          'Prenez la dose oubliée dès que possible ; ne prenez jamais deux doses le même jour.',
          'Tome la dosis olvidada en cuanto lo recuerde; no tome dos dosis el mismo día.',
          'Vergessene Dosis sobald wie möglich nachholen; niemals zwei Dosen am selben Tag einnehmen.'
        ),
        keyWarning: b(
          'أخبر الطبيب إذا كنت تتناول أدوية الكوليسترول (ستاتين) أو أدوية تنظيم ضربات القلب أو السيولة.',
          'Inform your doctor or pharmacist if you take cholesterol statins, blood thinners, or heart rhythm medications.',
          'Informez votre médecin ou pharmacien si vous prenez des statines, des anticoagulants ou des antiarythmiques.',
          'Informe a su médico o farmacéutico si toma estatinas para el colesterol, anticoagulantes o antiarrítmicos.',
          'Informieren Sie Arzt oder Apotheker, wenn Sie Cholesterinsenker (Statine), Blutverdünner oder Herzrhythmusmedikamente einnehmen.'
        ),
      },
    };
  }

  // 3. Default Beta-Lactams (Penicillins, Cephalosporins, Carbapenems) & General Antibiotics
  const isParentalCeph = id.includes('ceftriaxone') || id.includes('cefotaxime') || id.includes('cefoperazone') || id.includes('cefepime') || id.includes('meropenem');
  const isCeftriaxone = id.includes('ceftriaxone');

  return {
    pkpd: {
      halfLife: isCeftriaxone ? 't½ ≈ 6–9 h (q24h dosing)' : 't½ ≈ 1.0–1.5 h',
      bioavailability: isParentalCeph ? 'Parenteral (100% IV / 90–100% IM)' : 'F ≈ 60–90% (Oral)',
      proteinBinding: isCeftriaxone ? '85–95% (saturable)' : '18–35%',
      pkpdDriver: b(
        'يعتمد على الوقت الذي يبقى فيه التركيز الحر فوق التركيز المثبط الأدنى (fT > MIC ≥ 40–70%)',
        'Time-dependent bactericidal activity (%fT > MIC ≥ 40–70% of dosing interval)',
        'Bactéricidie temps-dépendante (%fT > CMI ≥ 40–70 % de l’intervalle)',
        'Actividad bactericida dependiente del tiempo (%fT > CMI ≥ 40–70 % del intervalo)',
        'Zeitabhängige Bakterizidie (%fT > MHK ≥ 40–70 % des Dosierungsintervalls)'
      ),
      excretion: isCeftriaxone
        ? b(
            'إخراج مزدوج كلوي (55%) وصفراوي (45%) — لا يحتاج تعديل كلوي منفرد',
            'Dual renal (55%) and biliary (45%) clearance — no adjustment in isolated renal impairment',
            'Double élimination rénale (55 %) et biliaire (45 %) — pas d’ajustement rénal isolé',
            'Doble eliminación renal (55 %) y biliar (45 %) — no requiere ajuste renal aislado',
            'Duale renale (55 %) und biliäre (45 %) Elimination — keine Anpassung bei isolierter Niereninsuffizienz'
          )
        : b(
            'إخراج كلوي رئيسي عبر الكلى (70–90% بدون تغيير في البول)',
            'Primarily renal excretion (70–90% excreted unchanged in urine)',
            'Élimination principalement rénale (70–90 % sous forme inchangée dans les urines)',
            'Excreción principalmente renal (70–90 % inalterado en la orina)',
            'Überwiegend renale Ausscheidung (70–90 % unverändert im Urin)'
          ),
    },
    spectrum: {
      gramPositive: b(
        'تغطية قوية للمكورات العقدية (Streptococci) والمكورات العنقودية الحساسة للميثيسيلين (MSSA) حسب الفئة.',
        'Active against Streptococci and methicillin-susceptible Staphylococcus aureus (MSSA) depending on agent.',
        'Actif sur les Streptocoques et Staphylococcus aureus sensible à la méthicilline (SAMS).',
        'Activo frente a Estreptococos y Staphylococcus aureus sensible a meticilina (SASM).',
        'Wirksam gegen Streptokokken und Methicillin-sensible Staphylococcus aureus (MSSA) je nach Wirkstoff.'
      ),
      gramNegative: b(
        'تغطية متدرجة للبكتيريا سالبة الجرام (E. coli, Klebsiella, Proteus, H. influenzae) وتزداد في الجيل الثالث والرابع.',
        'Covers key Gram-negative bacilli (E. coli, Klebsiella, Proteus, H. influenzae), expanding in 3rd/4th generation agents.',
        'Couvre les principaux bacilles à Gram négatif (E. coli, Klebsiella, Proteus, H. influenzae).',
        'Cubre bacilos Gram negativos clave (E. coli, Klebsiella, Proteus, H. influenzae).',
        'Erfasst wichtige gramnegative Stäbchen (E. coli, Klebsiella, Proteus, H. influenzae), erweitert bei Dritt-/Viertgenerations-Präparaten.'
      ),
      anaerobes: b(
        id.includes('clavulan') || id.includes('sulbactam') || id.includes('metronidazole') || id.includes('clindamycin') || id.includes('meropenem')
          ? 'تغطية ممتازة للبكتيريا اللاهوائية (شاملة الفموية والمعوية).'
          : 'تغطية محدودة للبكتيريا اللاهوائية الفموية فقط (لا يغطي B. fragilis).',
        id.includes('clavulan') || id.includes('sulbactam') || id.includes('metronidazole') || id.includes('clindamycin') || id.includes('meropenem')
          ? 'Strong anaerobic coverage including β-lactamase-producing anaerobes.'
          : 'Limited upper-respiratory anaerobic coverage only (does not cover Bacteroides fragilis).',
        id.includes('clavulan') || id.includes('sulbactam') || id.includes('metronidazole') || id.includes('clindamycin') || id.includes('meropenem')
          ? 'Forte couverture des bactéries anaérobies.'
          : 'Couverture limitée aux anaérobies buccaux uniquement.',
        id.includes('clavulan') || id.includes('sulbactam') || id.includes('metronidazole') || id.includes('clindamycin') || id.includes('meropenem')
          ? 'Fuerte cobertura anaerobia.'
          : 'Cobertura limitada solo a anaerobios orales.',
        id.includes('clavulan') || id.includes('sulbactam') || id.includes('metronidazole') || id.includes('clindamycin') || id.includes('meropenem')
          ? 'Starke Anaerobier-Abdeckung einschließlich β-Laktamase-bildender Anaerobier.'
          : 'Nur begrenzte Abdeckung oraler Anaerobier (keine Wirksamkeit gegen Bacteroides fragilis).'
      ),
      atypicals: b(
        'لا يغطي البكتيريا غير النمطية عديمة الجدار الخلوي (Mycoplasma / Chlamydia).',
        'No activity against cell-wall-deficient atypical pathogens (Mycoplasma, Chlamydophila).',
        'Aucune activité sur les germes atypiques dépourvus de paroi cellulaire (Mycoplasma, Chlamydia).',
        'Sin actividad frente a patógenos atípicos sin pared celular (Mycoplasma, Chlamydia).',
        'Keine Wirksamkeit gegen zellwandlose atypische Erreger (Mykoplasmen, Chlamydien).'
      ),
      clinicalPearl: b(
        isCeftriaxone
          ? 'ممنوع خلط السيفترياكسون مع محاليل الكالسيوم (مثل رينجر لاكتات) أو مع الكورتيزون والمسكنات في سرنجة واحدة (حقنة البرد) لخطر الترسيب البلوري القاتل وصدمة الحساسية.'
          : 'الالتزام الدقيق بفاصل الساعات (كل 8 أو 12 ساعة) ضروري جداً للحفاظ على تركيز الدواء فوق MIC ومنع نشاط البكتيريا.',
        isCeftriaxone
          ? 'NEVER co-administer Ceftriaxone with calcium-containing IV solutions (Ringer’s) or mix with corticosteroids/NSAIDs in one syringe ("cold shot") due to fatal precipitation and anaphylaxis risk.'
          : 'Strict adherence to scheduled dosing intervals (q8h or q12h) is essential to maintain %fT > MIC and prevent bacterial regrowth.',
        isCeftriaxone
          ? 'Ne jamais mélanger la Ceftriaxone avec des solutions contenant du calcium (Ringer) ni avec des corticoïdes/AINS dans une même seringue.'
          : 'Le respect strict des intervalles horaires (toutes les 8h ou 12h) est indispensable pour maintenir %fT > CMI.',
        isCeftriaxone
          ? 'Nunca mezclar Ceftriaxona con soluciones con calcio (Ringer) ni con corticoides/AINE en la misma jeringa.'
          : 'El cumplimiento estricto de los intervalos horarios (cada 8h o 12h) es clave para mantener %fT > CMI.',
        isCeftriaxone
          ? 'Ceftriaxon NIEMALS mit kalziumhaltigen Infusionslösungen (Ringer-Laktat) oder in einer Spritze mit Kortikosteroiden/NSAR mischen (Lebensgefahr durch Ausfällung und Anaphylaxie).'
          : 'Die genaue Einhaltung der Dosierungsintervalle (alle 8 oder 12 Std.) ist entscheidend, um %fT > MHK aufrechtzuerhalten und Resistenzen zu vermeiden.'
      ),
    },
    renalCrCl: {
      normal: b('الجرعة المعتادة كاملة كل 8–12 ساعة حسب شدة العدوى.', 'Standard full dose every 8–12 hours based on indication.', 'Dose standard complète toutes les 8 à 12 heures.', 'Dosis estándar completa cada 8–12 horas.', 'Volle Standarddosis alle 8–12 Stunden je nach Indikation.'),
      moderate: b(isCeftriaxone ? 'لا يحتاج تعديل جرعة (إخراج مزدوج).' : 'إطالة الفترة الزمنية إلى كل 12 ساعة أو خفض الجرعة بنسبة 25–50%.', isCeftriaxone ? 'No adjustment required (dual hepatorenal clearance).' : 'Extend dosing interval to q12h or reduce dose by 25–50%.', isCeftriaxone ? 'Aucun ajustement requis.' : 'Espacer les prises toutes les 12h ou réduire la dose de 25–50 %.', isCeftriaxone ? 'No requiere ajuste.' : 'Espaciar cada 12h o reducir la dosis un 25–50 %.', isCeftriaxone ? 'Keine Anpassung erforderlich (duale Elimination).' : 'Dosierungsintervall auf alle 12 Std. verlängern oder Dosis um 25–50 % reduzieren.'),
      severe: b(isCeftriaxone ? 'لا تتجاوز 2 جم يومياً في حال وجود قصور كلوي وكبدي مشترك.' : 'إطالة الفترة إلى كل 24 ساعة (وتجنب أقراص التركيز المزدوج XR/1000).', isCeftriaxone ? 'Max 2 g/day if concurrent severe hepatic and renal dysfunction.' : 'Extend interval to q24h (avoid extended-release or high-ratio formulations).', isCeftriaxone ? 'Max 2 g/jour si insuffisance hépato-rénale combinée.' : 'Espacer toutes les 24h (éviter les formes LP).', isCeftriaxone ? 'Máx. 2 g/día si coexiste insuficiencia hepática y renal.' : 'Espaciar cada 24h (evitar formas de liberación prolongada).', isCeftriaxone ? 'Max. 2 g/Tag bei gleichzeitiger schwerer Leber- und Niereninsuffizienz.' : 'Intervall auf alle 24 Std. verlängern (Retardtabletten vermeiden).'),
      esrdHd: b(isCeftriaxone ? 'لا يُزال بالغسيل الكلوي؛ الجرعة المعتادة.' : 'جرعة كل 24 ساعة مع إعطاء جرعة بعد جلسة الغسيل الكلوي مباشرة.', isCeftriaxone ? 'Not dialyzed; no post-HD supplemental dose needed.' : 'Dose q24h; administer scheduled dose after hemodialysis session.', isCeftriaxone ? 'Non dialysé ; pas de dose supplémentaire après dialyse.' : 'Dose toutes les 24h ; administrer après la séance d’hémodialyse.', isCeftriaxone ? 'No se dializa; sin dosis suplementaria.' : 'Dosis cada 24h; administrar después de la sesión de hemodiálisis.', isCeftriaxone ? 'Nicht dialysierbar; keine Zusatzdosis nach Dialyse nötig.' : 'Dosis alle 24 Std.; Gabe nach der Hämodialyse-Sitzung.'),
    },
    ivAndReconstitution: b(
      'يُحل المسحوق بماء الحقن المعقم أو محلول الملح 0.9% ويُعطى ببطء على مدار 3–5 دقائق أو بالتسريب الوريدي خلال 30 دقيقة؛ تأكد من عدم وجود حساسية للبنسلين أو السيفالوسبورين قبل الإعطاء.',
      'Reconstitute vials with Sterile Water for Injection or 0.9% NaCl and infuse over 30 minutes (or slow IV over 3–5 min); verify beta-lactam allergy history prior to administration.',
      'Reconstituer avec de l’eau PPI ou NaCl 0,9 % et perfuser sur 30 minutes ; vérifier systématiquement l’absence d’allergie aux bêta-lactamines.',
      'Reconstituir con agua estéril para inyección o NaCl 0,9 % e infundir en 30 minutos; verificar siempre antecedentes de alergia a betalactámicos.',
      'Pulver mit sterilem Wasser für Injektionszwecke oder NaCl 0,9 % auflösen und über 30 Minuten infundieren; vorab zwingend Beta-Laktam-Allergie abklären.'
    ),
    patientSimpleSummary: {
      foodRule: b(
        'يفضل تناوله في بداية الوجبة لتقليل اضطراب المعدة وتحسين الامتصاص (خصوصاً أوجمنتين وسيفوروكسيم).',
        'Best taken at the start of a meal to minimize stomach upset and optimize absorption.',
        'À prendre de préférence au début du repas pour améliorer la tolérance digestive.',
        'Mejor tomarlo al inicio de una comida para reducir molestias estomacales.',
        'Am besten zu Beginn einer Mahlzeit einnehmen, um Magenbeschwerden zu minimieren und die Aufnahme zu verbessern.'
      ),
      missedDoseRule: b(
        'تناول الجرعة فور تذكرها، ولكن إذا اقترب موعد الجرعة التالية فتجاوز الفائتة ولا تضاعف الجرعة أبداً.',
        'Take as soon as you remember; if close to the next dose, skip the missed one and never double up.',
        'Prenez la dose dès que vous y pensez ; si la suivante est proche, ne doublez jamais la prise.',
        'Tómela en cuanto lo recuerde; si está cerca la siguiente dosis, no duplique la toma.',
        'Sobald wie möglich nachholen; falls die nächste Dosis kurz bevorsteht, ausgelassene Dosis überspringen und niemals verdoppeln.'
      ),
      keyWarning: b(
        'توقف فوراً واطلب الطوارئ إذا ظهر طفح جلدي أو تورم بالوجه أو الشفتين أو ضيق في التنفس، وأكمل الكورس حتى النهاية.',
        'Stop immediately and seek emergency care if rash, facial swelling, or breathing difficulty occurs, and always finish your full course.',
        'Arrêtez immédiatement et appelez les urgences en cas d’éruption cutanée, de gonflement du visage ou de gêne respiratoire.',
        'Suspenda de inmediato y acuda a urgencias si aparece erupción cutánea, hinchazón facial o dificultad para respirar.',
        'Bei Hautausschlag, Gesichtsschwellung oder Atemnot sofort absetzen und den Notruf wählen; verordneten Kurs immer vollständig beenden.'
      ),
    },
  };
}
