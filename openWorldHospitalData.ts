import { Lang } from './types';

export type BilingualText = { ar: string; en: string };

export type EquipmentId =
  | 'eq-vitals-kit'
  | 'eq-xray-request-chart'
  | 'eq-specimen-container'
  | 'eq-collected-specimen'
  | 'eq-med-amoxicillin-pkg'
  | 'eq-med-azithromycin-pkg'
  | 'eq-sterile-dressing-kit'
  | 'eq-supply-box'
  | 'eq-sbar-handover-binder'
  | 'eq-stethoscope'
  | 'eq-thermometer'
  | 'eq-bp-monitor'
  | 'eq-pulse-oximeter';

export interface HospitalDepartment {
  id: string;
  name: string;
  ar: string;
  en: string;
  subtitleAr: string;
  subtitleEn: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: number;
  roofColor: number;
  icon: string;
  fact: string;
  factEn: string;
  doorSide: 'south' | 'north' | 'east' | 'west';
  isBuildingShell: boolean;
}

export interface WorkstationDef {
  id: string;
  departmentId: string;
  name: BilingualText;
  promptLabel: BilingualText;
  icon: string;
  x: number;
  z: number;
  kind:
    | 'nursing_station'
    | 'triage_desk'
    | 'xray_console'
    | 'lab_analyzer'
    | 'pharmacy_counter'
    | 'supply_shelf'
    | 'treatment_table'
    | 'er_supply_cart';
}

export interface EquipmentItemDef {
  id: EquipmentId;
  name: BilingualText;
  shortLabel: BilingualText;
  description: BilingualText;
  icon: string;
  color: number;
  spawnX: number;
  spawnZ: number;
  spawnWorkstationId: string;
  targetWorkstationId?: string;
  targetPatientId?: string;
}

export interface PatientVitalSigns {
  tempC: number;
  pulseBpm: number;
  respRate: number;
  bpSystolic: number;
  bpDiastolic: number;
  spo2Pct: number;
}

export interface MedicationOrderSpec {
  orderCode: string;
  initialMedication: BilingualText;
  initialDose: string;
  initialRoute: BilingualText;
  scheduledTime: string;
  hasAllergyConflict: boolean;
  allergyNote: BilingualText;
  safeAlternativeMedication: BilingualText;
  safeAlternativeDose: string;
  safeAlternativeItemId: EquipmentId;
}

export interface PatientDef {
  id: string;
  patientCode: string;
  name: BilingualText;
  age: number;
  roomLabel: BilingualText;
  departmentId: string;
  x: number;
  z: number;
  inBed: boolean;
  outfitColor: number;
  initialVisualState: 'resting' | 'sitting' | 'waiting' | 'distress' | 'stabilized';
  presentingComplaint: BilingualText;
  scenarioHistory: BilingualText;
  allergyBanner: BilingualText;
  hasPenicillinAllergy: boolean;
  vitals: PatientVitalSigns;
  assignedMissionId: string;
  requiredEquipmentId?: EquipmentId;
  medicationOrder?: MedicationOrderSpec;
  dialogue: {
    intro: BilingualText;
    symptoms: BilingualText;
    afterCare: BilingualText;
  };
}

export interface PatientSimState {
  id: string;
  visualState: 'resting' | 'sitting' | 'waiting' | 'distress' | 'stabilized';
  identityConfirmed: boolean;
  symptomsAsked: boolean;
  vitalsMeasured: boolean;
  chartRecorded: boolean;
  comfortProvided: boolean;
  escalatedToTeam: boolean;
  specimenCollected: boolean;
  xrayCompleted: boolean;
  medicationVerified: boolean;
  allergyFlagged: boolean;
  medicationAdministered: boolean;
  statusNoteAr: string;
  statusNoteEn: string;
}

export interface StaffNpcDef {
  id: string;
  name: BilingualText;
  roleTitle: BilingualText;
  icon: string;
  x: number;
  z: number;
  color: number;
  greeting: BilingualText;
}

export interface MissionObjectiveDef {
  id: string;
  title: BilingualText;
  hint: BilingualText;
  targetX: number;
  targetZ: number;
  targetLabel: BilingualText;
}

export interface NursingMissionDef {
  id: string;
  order: number;
  icon: string;
  title: BilingualText;
  shortScenario: BilingualText;
  clinicalContext: BilingualText;
  xpReward: number;
  patientId?: string;
  destinationWorkstationId?: string;
  requiredEquipmentId?: EquipmentId;
  objectives: MissionObjectiveDef[];
}

export const HOSPITAL_DEPARTMENTS: HospitalDepartment[] = [
  {
    id: 'dept-hospital',
    name: 'hospital',
    ar: 'المستشفى الرئيسي وأجنحة التنويم ومحطة التمريض',
    en: 'Main Hospital, Inpatient Wards & Nursing Station',
    subtitleAr: 'محطة التمريض المركزية • أجنحة المرضى 101-103 • الاستقبال',
    subtitleEn: 'Central Nursing Station • Patient Wards 101-103 • Reception',
    x: 0,
    z: -24,
    w: 28,
    d: 16,
    h: 7.2,
    color: 0xf8fafc,
    roofColor: 0x0284c7,
    icon: '🏥',
    fact: 'لا نبدأ المضاد الحيوي لمجرد وجود حرارة؛ التقييم التمريضي الشامل وقياس العلامات الحيوية والتشخيص الدقيق يحمي المريض من المقاومة البكتيرية.',
    factEn: 'Never start antibiotics for fever alone; thorough nursing assessment, vital signs, and accurate diagnosis protect patients from resistance.',
    doorSide: 'south',
    isBuildingShell: true,
  },
  {
    id: 'dept-emergency',
    name: 'clinic',
    ar: 'قسم الطوارئ والفرز (Triage) وغرفة الفحص',
    en: 'Emergency Department, Triage & Exam Room',
    subtitleAr: 'فرز الحالات الحرجة • غرفة الفحص والعلاج المعقمة • مدخل الإسعاف',
    subtitleEn: 'Critical Triage • Sterile Exam & Treatment Room • Ambulance Bay',
    x: -24,
    z: -4,
    w: 16,
    d: 14,
    h: 5.8,
    color: 0xfef2f2,
    roofColor: 0xdc2626,
    icon: '🚑',
    fact: 'في قسم الطوارئ والفرز، قياس العلامات الحيوية الخمس (الحرارة، النبض، التنفس، الضغط، الأكسجين SpO2) يكشف التدهور المبكر وإنتان الدم فوراً.',
    factEn: 'In Emergency Triage, measuring all 5 vital signs (Temp, HR, RR, BP, SpO2) detects early clinical deterioration and sepsis immediately.',
    doorSide: 'east',
    isBuildingShell: true,
  },
  {
    id: 'dept-radiology',
    name: 'school',
    ar: 'قسم الأشعة التشخيصية وغرفة أشعة الصدر (X-Ray)',
    en: 'Diagnostic Radiology & Chest X-Ray Suite',
    subtitleAr: 'جهاز التصوير الشعاعي الرقمي • وحدة عرض أشعة الصدر',
    subtitleEn: 'Digital Radiography Scanner • Chest X-Ray Viewing Console',
    x: -24,
    z: 19,
    w: 16,
    d: 13,
    h: 5.6,
    color: 0xeff6ff,
    roofColor: 0x2563eb,
    icon: '🩻',
    fact: 'أشعة الصدر تساعد الفريق الطبي على التفرقة بين التهاب الشعب الفيروسي والالتهاب الرئوي البكتيري الفصي قبل وصف أي مضاد حيوي.',
    factEn: 'Chest X-rays help clinicians differentiate viral bronchitis from lobar bacterial pneumonia before prescribing antibiotics.',
    doorSide: 'east',
    isBuildingShell: true,
  },
  {
    id: 'dept-lab',
    name: 'lab',
    ar: 'المعمل المركزي ووحدة سحب العينات والمزارع',
    en: 'Central Laboratory & Specimen Culture Unit',
    subtitleAr: 'استلام العينات المعقمة • اختبار الحساسية البكتيرية AST',
    subtitleEn: 'Sterile Specimen Receiving • Antibiotic Susceptibility Testing (AST)',
    x: 24,
    z: -4,
    w: 16,
    d: 14,
    h: 5.8,
    color: 0xf3e8ff,
    roofColor: 0x7c3aed,
    icon: '🔬',
    fact: 'سحب العينة المعقمة بدقة قبل بدء المضاد الحيوي يضمن دقة المزرعة البكتيرية واختيار مضاد حيوي موجّه بدلاً من العشوائي.',
    factEn: 'Collecting sterile specimens prior to first antibiotic dose ensures accurate culture & susceptibility results.',
    doorSide: 'west',
    isBuildingShell: true,
  },
  {
    id: 'dept-pharmacy',
    name: 'pharmacy',
    ar: 'صيدلية المستشفى ومخزن الأدوية والمستلزمات',
    en: 'Hospital Pharmacy, Medication & Supply Room',
    subtitleAr: 'صرف الأدوية الموصوفة • مراجعة الحساسية • غرفة المستلزمات الطبية',
    subtitleEn: 'Prescription Dispensing • Allergy Verification • Medical Supply Room',
    x: 24,
    z: 19,
    w: 16,
    d: 13,
    h: 5.6,
    color: 0xecfdf5,
    roofColor: 0x059669,
    icon: '💊',
    fact: 'التحقق من الحقوق الخمسة لإعطاء الدواء (المريض، الدواء، الجرعة، الطريق، الوقت) وفحص الحساسية يمنع الأخطاء الدوائية القاتلة.',
    factEn: 'Verifying the 5 Rights of Medication Administration and checking patient allergies prevents life-threatening adverse drug events.',
    doorSide: 'west',
    isBuildingShell: true,
  },
  {
    id: 'dept-reception-plaza',
    name: 'home',
    ar: 'ساحة الاستقبال والتوعية المجتمعية للمرضى',
    en: 'Patient Reception & Family Education Plaza',
    subtitleAr: 'استراحة الزوار • إرشادات الوقاية وإكمال الجرعات عند الخروج',
    subtitleEn: 'Visitor Waiting Area • Discharge & Prevention Education',
    x: 0,
    z: 24,
    w: 18,
    d: 10,
    h: 4.5,
    color: 0xfffbeb,
    roofColor: 0xd97706,
    icon: '🛋️',
    fact: 'تثقيف المريض وأسرته عند الخروج بعدم مشاركة المضادات الحيوية وإكمال الخطة العلاجية يقلل انتكاسة العدوى في المجتمع.',
    factEn: 'Educating patients and families at discharge never to share leftover antibiotics prevents community infection relapse.',
    doorSide: 'north',
    isBuildingShell: true,
  },
];

export const HOSPITAL_WORKSTATIONS: WorkstationDef[] = [
  {
    id: 'ws-nursing-station',
    departmentId: 'dept-hospital',
    name: { ar: 'محطة التمريض المركزية والتسليم (SBAR)', en: 'Central Nursing Station & SBAR Hub' },
    promptLabel: { ar: 'مراجعة المهام • تسجيل الإمدادات • تسليم المناوبة', en: 'Review Assignments • Log Supplies • Shift Handover' },
    icon: '📋',
    x: 0,
    z: -19.5,
    kind: 'nursing_station',
  },
  {
    id: 'ws-triage-desk',
    departmentId: 'dept-emergency',
    name: { ar: 'محطة فرز الطوارئ وإبلاغ طبيب الطوارئ', en: 'ER Triage Desk & Rapid Response Console' },
    promptLabel: { ar: 'التقاط حقيبة العلامات الحيوية • إبلاغ فريق الطوارئ', en: 'Pick Up Vitals Kit • Alert ER Rapid Response' },
    icon: '🚨',
    x: -20.5,
    z: -6.5,
    kind: 'triage_desk',
  },
  {
    id: 'ws-treatment-table',
    departmentId: 'dept-emergency',
    name: { ar: 'غرفة الفحص والعلاج المعقمة', en: 'Sterile Examination & Treatment Area' },
    promptLabel: { ar: 'تعقيم وتجهيز سرير الفحص • وضع أدوات الضماد', en: 'Sanitize & Prepare Exam Area • Place Sterile Kit' },
    icon: '🧼',
    x: -26.5,
    z: -1.5,
    kind: 'treatment_table',
  },
  {
    id: 'ws-er-supply-cart',
    departmentId: 'dept-emergency',
    name: { ar: 'عربة مستلزمات الطوارئ', en: 'Emergency Department Supply Cart' },
    promptLabel: { ar: 'تسليم وتعبئة صندوق المستلزمات التمريضية', en: 'Deliver & Restock Nursing Supply Box' },
    icon: '🧰',
    x: -21.0,
    z: -1.2,
    kind: 'er_supply_cart',
  },
  {
    id: 'ws-xray-console',
    departmentId: 'dept-radiology',
    name: { ar: 'وحدة التحكم بجهاز الأشعة السينية (X-Ray)', en: 'Digital X-Ray Imaging Workstation' },
    promptLabel: { ar: 'تشغيل تصوير الصدر • عرض دراسة الأشعة المحاكاة', en: 'Run Chest X-Ray • View Simulated Imaging Study' },
    icon: '🩻',
    x: -24.5,
    z: 19.0,
    kind: 'xray_console',
  },
  {
    id: 'ws-lab-analyzer',
    departmentId: 'dept-lab',
    name: { ar: 'محطة استلام العينات وجهاز المزرعة (AST)', en: 'Lab Specimen Receiving & AST Analyzer' },
    promptLabel: { ar: 'استلام عبوة العينة • تسليم العينة وفحص النتيجة', en: 'Collect Container • Submit Specimen & View AST' },
    icon: '🔬',
    x: 24.5,
    z: -4.0,
    kind: 'lab_analyzer',
  },
  {
    id: 'ws-pharmacy-counter',
    departmentId: 'dept-pharmacy',
    name: { ar: 'شباك صرف صيدلية المستشفى', en: 'Hospital Pharmacy Dispensing Counter' },
    promptLabel: { ar: 'استلام عبوات الأدوية الموصوفة • تبديل الدواء الآمن', en: 'Collect Prescribed Medication • Dispense Safe Alternative' },
    icon: '💊',
    x: 21.5,
    z: 16.8,
    kind: 'pharmacy_counter',
  },
  {
    id: 'ws-supply-shelf',
    departmentId: 'dept-pharmacy',
    name: { ar: 'غرفة المعدات والمستلزمات الطبية', en: 'Medical Equipment & Supply Room' },
    promptLabel: { ar: 'التقاط صندوق المستلزمات • طقم التعقيم والضماد', en: 'Pick Up Supply Box • Sterile Dressing Kit' },
    icon: '📦',
    x: 26.8,
    z: 21.2,
    kind: 'supply_shelf',
  },
];

export const HOSPITAL_EQUIPMENT_ITEMS: EquipmentItemDef[] = [
  {
    id: 'eq-vitals-kit',
    name: {
      ar: 'حقيبة العلامات الحيوية (سماعة، ميزان حرارة، ضغط، أكسجين)',
      en: 'Vital Signs Kit (Stethoscope, Thermometer, BP Cuff, Pulse Oximeter)',
    },
    shortLabel: { ar: 'حقيبة العلامات الحيوية', en: 'Vitals Monitor Kit' },
    description: {
      ar: 'تضم سماعة طبية، مقياس حرارة رقمي، جهاز ضغط الدم، ومقياس تشبع الأكسجين النبضي SpO2.',
      en: 'Contains stethoscope, digital thermometer, blood pressure monitor, and pulse oximeter.',
    },
    icon: '🩺',
    color: 0x0ea5e9,
    spawnX: -19.5,
    spawnZ: -6.8,
    spawnWorkstationId: 'ws-triage-desk',
    targetPatientId: 'patient-triage',
  },
  {
    id: 'eq-xray-request-chart',
    name: {
      ar: 'ملف وطلب تصوير أشعة الصدر للمريض (#XR-204)',
      en: 'Patient Chest X-Ray Requisition Chart (#XR-204)',
    },
    shortLabel: { ar: 'طلب أشعة الصدر #XR-204', en: 'X-Ray Order #XR-204' },
    description: {
      ar: 'استمارة إحالة المريض طارق المنصور إلى قسم الأشعة لإجراء تصوير الصدر.',
      en: 'Radiology requisition chart for patient Tariq Al-Mansour for diagnostic chest imaging.',
    },
    icon: '📁',
    color: 0x3b82f6,
    spawnX: -8.2,
    spawnZ: -25.2,
    spawnWorkstationId: 'ws-nursing-station',
    targetWorkstationId: 'ws-xray-console',
    targetPatientId: 'patient-radiology',
  },
  {
    id: 'eq-specimen-container',
    name: {
      ar: 'عبوة عينة معقمة مُرقّمة (#LB-309)',
      en: 'Labeled Sterile Specimen Container (#LB-309)',
    },
    shortLabel: { ar: 'عبوة عينة معقمة #LB-309', en: 'Sterile Container #LB-309' },
    description: {
      ar: 'عبوة معقمة لجمع عينة المريض في جناح التنويم قبل إرسالها للمعمل.',
      en: 'Barcoded sterile container for collecting patient culture specimen before lab submission.',
    },
    icon: '🧪',
    color: 0x8b5cf6,
    spawnX: 22.0,
    spawnZ: -5.5,
    spawnWorkstationId: 'ws-lab-analyzer',
    targetPatientId: 'patient-lab',
  },
  {
    id: 'eq-collected-specimen',
    name: {
      ar: 'عينة مريض مسحوبة ومؤكدة (#LB-309 — سلمى الكيلاني)',
      en: 'Collected Patient Specimen (#LB-309 — Salma Al-Kilani)',
    },
    shortLabel: { ar: 'عينة مسحوبة #LB-309', en: 'Collected Specimen #LB-309' },
    description: {
      ar: 'عينة حيوية موثقة جاهزة للتسليم الفوري في محطة المعمل المركزي.',
      en: 'Verified patient specimen ready for immediate submission at the Central Laboratory.',
    },
    icon: '🧫',
    color: 0xa855f7,
    spawnX: 0,
    spawnZ: -27.5,
    spawnWorkstationId: 'ws-lab-analyzer',
    targetWorkstationId: 'ws-lab-analyzer',
    targetPatientId: 'patient-lab',
  },
  {
    id: 'eq-med-amoxicillin-pkg',
    name: {
      ar: 'عبوة أموكسيسيلين 500 ملجم (فئة البنسلين — تدريب)',
      en: 'Amoxicillin 500mg Sealed Package (Penicillin Class — Training)',
    },
    shortLabel: { ar: 'عبوة أموكسيسيلين (بنسلين)', en: 'Amoxicillin Pkg (Penicillin)' },
    description: {
      ar: 'عبوة دواء تدريبية مختومة؛ يلزم التحقق من سوار حساسية المريض قبل الإعطاء.',
      en: 'Sealed training medication package; verify patient allergy wristband before administration.',
    },
    icon: '💊',
    color: 0xef4444,
    spawnX: 21.0,
    spawnZ: 15.6,
    spawnWorkstationId: 'ws-pharmacy-counter',
    targetPatientId: 'patient-fatigue',
  },
  {
    id: 'eq-med-azithromycin-pkg',
    name: {
      ar: 'عبوة أزيثروميسين 500 ملجم آمنة (بديل لمرضى حساسية البنسلين)',
      en: 'Azithromycin 500mg Safe Package (Penicillin-Allergy Alternative)',
    },
    shortLabel: { ar: 'عبوة أزيثروميسين آمنة', en: 'Safe Azithromycin Pkg' },
    description: {
      ar: 'بديل آمن ومعتمد بعد رصد حساسية البنسلين لدى المريض ومراجعة الصيدلية.',
      en: 'Approved non-penicillin alternative dispensed after reporting patient allergy discrepancy.',
    },
    icon: '💉',
    color: 0x10b981,
    spawnX: 21.0,
    spawnZ: 18.2,
    spawnWorkstationId: 'ws-pharmacy-counter',
    targetPatientId: 'patient-fatigue',
  },
  {
    id: 'eq-sterile-dressing-kit',
    name: {
      ar: 'صينية التعقيم والضماد الجراحي',
      en: 'Sterile Antiseptic & Dressing Tray',
    },
    shortLabel: { ar: 'صينية التعقيم والضماد', en: 'Sterile Dressing Tray' },
    description: {
      ar: 'تُستخدم لتعقيم وتجهيز منطقة العلاج قبل استقبال المريض وتضميد الجرح.',
      en: 'Used to disinfect and prepare the treatment table before wound care.',
    },
    icon: '🩹',
    color: 0x14b8a6,
    spawnX: 25.8,
    spawnZ: 20.5,
    spawnWorkstationId: 'ws-supply-shelf',
    targetWorkstationId: 'ws-treatment-table',
  },
  {
    id: 'eq-supply-box',
    name: {
      ar: 'صندوق مستلزمات تمريضية معقمة (قفازات، محاليل، شاش)',
      en: 'Nursing Medical Supply Box (Gloves, Saline, Sterile Gauze)',
    },
    shortLabel: { ar: 'صندوق مستلزمات تمريضية', en: 'Medical Supply Box' },
    description: {
      ar: 'صندوق إمدادات لإعادة تغذية عربة الطوارئ ومحطة التمريض.',
      en: 'Restocking box for replenishing the Emergency Department supply cart.',
    },
    icon: '📦',
    color: 0xf59e0b,
    spawnX: 26.8,
    spawnZ: 22.0,
    spawnWorkstationId: 'ws-supply-shelf',
    targetWorkstationId: 'ws-er-supply-cart',
  },
  {
    id: 'eq-sbar-handover-binder',
    name: {
      ar: 'سجل تسليم المناوبة التمريضية (SBAR Shift Binder)',
      en: 'Nursing Shift Handover Binder (SBAR Clinical Log)',
    },
    shortLabel: { ar: 'سجل تسليم المناوبة SBAR', en: 'SBAR Handover Binder' },
    description: {
      ar: 'يحتوي على ملخص الحالات، العلامات الحيوية، نتائج الأشعة والمعمل لتسليم المناوبة.',
      en: 'Contains patient summaries, vitals, radiology and lab results for shift handover.',
    },
    icon: '📋',
    color: 0x0284c7,
    spawnX: 3.2,
    spawnZ: -19.5,
    spawnWorkstationId: 'ws-nursing-station',
    targetWorkstationId: 'ws-nursing-station',
  },
  {
    id: 'eq-stethoscope',
    name: { ar: 'سماعة طبية سريرية', en: 'Clinical Acoustic Stethoscope' },
    shortLabel: { ar: 'سماعة طبية', en: 'Stethoscope' },
    description: { ar: 'لفحص أصوات الرئة والقلب.', en: 'For auscultating lung and heart sounds.' },
    icon: '🩺',
    color: 0x06b6d4,
    spawnX: -2.8,
    spawnZ: -19.5,
    spawnWorkstationId: 'ws-nursing-station',
  },
  {
    id: 'eq-thermometer',
    name: { ar: 'ميزان حرارة طبي رقمي', en: 'Digital Clinical Thermometer' },
    shortLabel: { ar: 'ميزان حرارة', en: 'Thermometer' },
    description: { ar: 'لقياس درجة حرارة المريض بدقة.', en: 'For accurate core temperature measurement.' },
    icon: '🌡️',
    color: 0xf97316,
    spawnX: -4.2,
    spawnZ: -19.5,
    spawnWorkstationId: 'ws-nursing-station',
  },
  {
    id: 'eq-bp-monitor',
    name: { ar: 'جهاز قياس ضغط الدم الرقمي', en: 'Automated Blood Pressure Monitor' },
    shortLabel: { ar: 'جهاز ضغط الدم', en: 'BP Monitor' },
    description: { ar: 'لقياس الضغط الانقباضي والانبساطي.', en: 'Measures systolic and diastolic blood pressure.' },
    icon: '📟',
    color: 0x3b82f6,
    spawnX: -18.8,
    spawnZ: -4.5,
    spawnWorkstationId: 'ws-triage-desk',
  },
  {
    id: 'eq-pulse-oximeter',
    name: { ar: 'جهاز قياس تشبع الأكسجين (Pulse Oximeter)', en: 'Finger Pulse Oximeter (SpO2)' },
    shortLabel: { ar: 'مقياس الأكسجين SpO2', en: 'Pulse Oximeter' },
    description: { ar: 'لقياس نسبة تشبع الأكسجين بالدم ومعدل النبض.', en: 'Measures peripheral oxygen saturation and pulse.' },
    icon: '🫀',
    color: 0xec4899,
    spawnX: 2.0,
    spawnZ: -19.5,
    spawnWorkstationId: 'ws-nursing-station',
  },
];

export const HOSPITAL_PATIENTS: PatientDef[] = [
  {
    id: 'patient-triage',
    patientCode: 'PT-101',
    name: { ar: 'أحمد السعيد (فرز الطوارئ)', en: 'Ahmed Al-Saeed (ER Triage)' },
    age: 34,
    roomLabel: { ar: 'قسم الطوارئ والفرز — سرير T1', en: 'Emergency Triage — Bay T1' },
    departmentId: 'dept-emergency',
    x: -23.5,
    z: -7.2,
    inBed: true,
    outfitColor: 0x38bdf8,
    initialVisualState: 'waiting',
    presentingComplaint: {
      ar: 'رشح خفيف وعطاس والتهاب حلق منذ يومين، يطلب مضاداً حيوياً فورياً.',
      en: 'Mild runny nose, sneezing, and sore throat for 2 days; requesting immediate antibiotics.',
    },
    scenarioHistory: {
      ar: 'بيانات تدريبية محاكاة: لا يوجد ضيق تنفس أو أمراض مزمنة. العلامات الحيوية مستقرة وتشير لعدوى فيروسية بسيطة.',
      en: 'Simulated training record: No dyspnea or chronic illness. Stable vitals consistent with a self-limiting viral URI.',
    },
    allergyBanner: { ar: 'لا توجد حساسية دوائية مسجلة (NKDA)', en: 'No Known Drug Allergies (NKDA)' },
    hasPenicillinAllergy: false,
    vitals: {
      tempC: 37.3,
      pulseBpm: 76,
      respRate: 16,
      bpSystolic: 118,
      bpDiastolic: 76,
      spo2Pct: 99,
    },
    assignedMissionId: 'mission-1-triage-vitals',
    requiredEquipmentId: 'eq-vitals-kit',
    dialogue: {
      intro: {
        ar: '«مرحباً يا ممرضة، أنا أحمد السعيد (PT-101). هل يمكنني أخذ مضاد حيوي قوي للزكام؟»',
        en: '"Hello nurse, I am Ahmed Al-Saeed (PT-101). Can I get a strong antibiotic for this cold?"',
      },
      symptoms: {
        ar: '«أشعر فقط باحتقان بسيط في الأنف والحلق بدون كحة شديدة أو ضيق نفس.»',
        en: '"I only have mild nasal stuffiness and throat scratchiness, no chest pain or shortness of breath."',
      },
      afterCare: {
        ar: '«شكراً لقياس علاماتي الحيوية وتوضيح أن الزكام الفيروسي يتحسن بالراحة والسوائل دون مضاد حيوي!»',
        en: '"Thank you for checking my vitals and explaining why viral colds heal with rest and fluids without antibiotics!"',
      },
    },
  },
  {
    id: 'patient-radiology',
    patientCode: 'PT-204',
    name: { ar: 'طارق المنصور (جناح التنويم الغربي)', en: 'Tariq Al-Mansour (West Inpatient Ward)' },
    age: 52,
    roomLabel: { ar: 'المستشفى الرئيسي — جناح 101 (سرير غربي)', en: 'Main Hospital — Ward 101 (West Bed)' },
    departmentId: 'dept-hospital',
    x: -9.5,
    z: -26.5,
    inBed: true,
    outfitColor: 0x0284c7,
    initialVisualState: 'resting',
    presentingComplaint: {
      ar: 'سعال مستمر مع ألم جنبي وحمى، والطبيب طلب أشعة صدر قبل تحديد العلاج.',
      en: 'Persistent productive cough, pleuritic pain, and fever; physician ordered Chest X-Ray before therapy.',
    },
    scenarioHistory: {
      ar: 'بيانات تدريبية محاكاة: يحتاج لمراجعة طلب الأشعة (#XR-204) وإجراء تصوير الصدر في قسم الأشعة.',
      en: 'Simulated training record: Requires Chest X-Ray requisition (#XR-204) processed in Radiology.',
    },
    allergyBanner: { ar: 'لا توجد حساسية دوائية مسجلة (NKDA)', en: 'No Known Drug Allergies (NKDA)' },
    hasPenicillinAllergy: false,
    vitals: {
      tempC: 38.6,
      pulseBpm: 96,
      respRate: 22,
      bpSystolic: 128,
      bpDiastolic: 82,
      spo2Pct: 94,
    },
    assignedMissionId: 'mission-2-radiology-xray',
    requiredEquipmentId: 'eq-xray-request-chart',
    dialogue: {
      intro: {
        ar: '«أنا طارق المنصور (PT-204). الطبيب أخبرني بضرورة عمل أشعة على الصدر أولاً.»',
        en: '"I am Tariq Al-Mansour (PT-204). The doctor said I need a chest X-ray before starting targeted treatment."',
      },
      symptoms: {
        ar: '«كحة مع بلغم منذ 4 أيام وألم في الجانب الأيمن من الصدر عند التنفس العميق.»',
        en: '"Productive cough for 4 days and right-sided chest discomfort when taking a deep breath."',
      },
      afterCare: {
        ar: '«ممتاز! الآن بعد ظهور نتيجة أشعة الصدر وإبلاغ الطبيب، أصبحت الخطة العلاجية واضحة.»',
        en: '"Great! Now that the chest X-ray is completed and reported to the clinician, my care plan is clear."',
      },
    },
  },
  {
    id: 'patient-lab',
    patientCode: 'PT-309',
    name: { ar: 'سلمى الكيلاني (جناح التنويم الأوسط)', en: 'Salma Al-Kilani (Central Inpatient Ward)' },
    age: 41,
    roomLabel: { ar: 'المستشفى الرئيسي — جناح 102 (سرير أوسط)', en: 'Main Hospital — Ward 102 (Central Bed)' },
    departmentId: 'dept-hospital',
    x: 0,
    z: -27.5,
    inBed: true,
    outfitColor: 0x8b5cf6,
    initialVisualState: 'resting',
    presentingComplaint: {
      ar: 'التهاب مسالك بولية متكرر وحمى؛ مطلوب سحب عينة مزرعة معقمة قبل أول جرعة مضاد.',
      en: 'Recurrent febrile UTI; requires sterile specimen collection for culture & sensitivity prior to antibiotic.',
    },
    scenarioHistory: {
      ar: 'بيانات تدريبية محاكاة: استخدم عبوة العينة المرقمة (#LB-309) من المعمل ثم سلمها لجهاز التحليل AST.',
      en: 'Simulated training record: Retrieve labeled sterile container (#LB-309) from Lab, collect sample, and submit to AST analyzer.',
    },
    allergyBanner: { ar: 'حساسية خفيفة من السلفا (Sulfa)', en: 'Mild Sulfonamide Sensitivity' },
    hasPenicillinAllergy: false,
    vitals: {
      tempC: 38.4,
      pulseBpm: 92,
      respRate: 19,
      bpSystolic: 122,
      bpDiastolic: 78,
      spo2Pct: 97,
    },
    assignedMissionId: 'mission-3-lab-specimen',
    requiredEquipmentId: 'eq-specimen-container',
    dialogue: {
      intro: {
        ar: '«مرحباً، أنا سلمى الكيلاني (PT-309). هل أحضرتِ عبوة العينة المعقمة للمعمل؟»',
        en: '"Hello, I am Salma Al-Kilani (PT-309). Did you bring the labeled sterile specimen container?"',
      },
      symptoms: {
        ar: '«أعاني من حرقة شديدة وارتفاع في الحرارة، وتناولت مضادات عشوائية سابقاً دون فائدة.»',
        en: '"I have fever and dysuria; previous unprescribed antibiotics did not work for me."',
      },
      afterCare: {
        ar: '«شكراً لكِ! إرسال العينة للمعمل واختبار الحساسية سيحدد المضاد الدقيق لحالتي.»',
        en: '"Thank you! Submitting the specimen for culture and susceptibility will pinpoint the exact antibiotic I need."',
      },
    },
  },
  {
    id: 'patient-fatigue',
    patientCode: 'PT-412',
    name: { ar: 'محمود درويش (جناح التنويم الشرقي)', en: 'Mahmoud Darwish (East Inpatient Ward)' },
    age: 47,
    roomLabel: { ar: 'المستشفى الرئيسي — جناح 103 (سرير شرقي)', en: 'Main Hospital — Ward 103 (East Bed)' },
    departmentId: 'dept-hospital',
    x: 9.5,
    z: -26.5,
    inBed: true,
    outfitColor: 0x059669,
    initialVisualState: 'sitting',
    presentingComplaint: {
      ar: 'التهاب رئوي مجتمعي؛ مطلوب مراجعة وإعطاء المضاد الحيوي الموصوف مع فحص الحساسية.',
      en: 'Community-acquired bacterial infection; scheduled for medication administration and safety verification.',
    },
    scenarioHistory: {
      ar: 'بيانات تدريبية محاكاة: تنبيه سلامة دوائية! المريض يرتدي سوار حساسية شديدة للبنسلين (أموكسيسيلين).',
      en: 'Simulated training record: MEDICATION SAFETY ALERT! Patient has documented severe Penicillin (Amoxicillin) allergy.',
    },
    allergyBanner: {
      ar: '⚠️ تنبيه خطير: حساسية مفرطة من البنسلين / الأموكسيسيلين (Anaphylaxis)',
      en: '⚠️ CRITICAL ALERT: Severe Penicillin / Amoxicillin Allergy (Anaphylaxis)',
    },
    hasPenicillinAllergy: true,
    vitals: {
      tempC: 38.2,
      pulseBpm: 88,
      respRate: 20,
      bpSystolic: 126,
      bpDiastolic: 80,
      spo2Pct: 96,
    },
    assignedMissionId: 'mission-4-pharmacy-med-safety',
    requiredEquipmentId: 'eq-med-azithromycin-pkg',
    medicationOrder: {
      orderCode: 'RX-412-SIM',
      initialMedication: {
        ar: 'أموكسيسيلين 500 ملجم (فئة البنسلين)',
        en: 'Amoxicillin 500 mg (Penicillin Class)',
      },
      initialDose: '500 mg PO q8h',
      initialRoute: { ar: 'عن طريق الفم (Oral)', en: 'Oral (PO)' },
      scheduledTime: '12:00 Shift Dose',
      hasAllergyConflict: true,
      allergyNote: {
        ar: 'تعارض خطير: المريض لديه حساسية مفرطة من البنسلين! أوقف الإعطاء فوراً واطلب البديل الآمن (أزيثروميسين) من الصيدلية.',
        en: 'CRITICAL CONFLICT: Patient has severe Penicillin allergy! Block administration immediately and retrieve safe Azithromycin from Pharmacy.',
      },
      safeAlternativeMedication: {
        ar: 'أزيثروميسين 500 ملجم (ماكروليد آمن لمرضى حساسية البنسلين)',
        en: 'Azithromycin 500 mg (Safe Macrolide Alternative)',
      },
      safeAlternativeDose: '500 mg PO Daily (Simulated)',
      safeAlternativeItemId: 'eq-med-azithromycin-pkg',
    },
    dialogue: {
      intro: {
        ar: '«أنا محمود درويش (PT-412). انتبهي من فضلكِ، لدي حساسية شديدة جداً من البنسلين مسجلة على سواري!»',
        en: '"I am Mahmoud Darwish (PT-412). Please check my red wristband—I have a severe Penicillin allergy!"',
      },
      symptoms: {
        ar: '«أشعر بتحسن تدريجي، لكن في الماضي أصبت بضيق تنفس حاد عندما أخذت أموكسيسيلين.»',
        en: '"I am recovering slowly, but previously I had severe anaphylaxis when given Amoxicillin."',
      },
      afterCare: {
        ar: '«أشكركِ على يقظتكِ التمريضية! إيقاف البنسلين وإحضار البديل الآمن أنقذ حياتي.»',
        en: '"Thank you for your nursing vigilance! Blocking Penicillin and verifying the safe alternative saved my life."',
      },
    },
  },
  {
    id: 'patient-treatment',
    patientCode: 'PT-518',
    name: { ar: 'نورا حسن (غرفة الفحص والعلاج)', en: 'Noura Hassan (Exam & Treatment Room)' },
    age: 29,
    roomLabel: { ar: 'قسم الطوارئ — غرفة الفحص المعقمة E2', en: 'Emergency Dept — Sterile Exam Room E2' },
    departmentId: 'dept-emergency',
    x: -26.5,
    z: -4.2,
    inBed: false,
    outfitColor: 0x14b8a6,
    initialVisualState: 'sitting',
    presentingComplaint: {
      ar: 'جرح سطحي في الساعد يحتاج لتجهيز منطقة علاج معقمة وتضميد وقائي.',
      en: 'Superficial forearm laceration requiring a prepared sterile treatment area and antiseptic dressing.',
    },
    scenarioHistory: {
      ar: 'بيانات تدريبية محاكاة: التطهير الموضعي والتعقيم يمنع التهاب الجرح دون الحاجة لمضاد حيوي جهازي.',
      en: 'Simulated training record: Proper aseptic wound care prevents local infection without unnecessary systemic antibiotics.',
    },
    allergyBanner: { ar: 'لا توجد حساسية دوائية مسجلة (NKDA)', en: 'No Known Drug Allergies (NKDA)' },
    hasPenicillinAllergy: false,
    vitals: {
      tempC: 36.9,
      pulseBpm: 78,
      respRate: 16,
      bpSystolic: 116,
      bpDiastolic: 74,
      spo2Pct: 99,
    },
    assignedMissionId: 'mission-5-clean-treatment',
    requiredEquipmentId: 'eq-sterile-dressing-kit',
    dialogue: {
      intro: {
        ar: '«مرحباً، أنا نورا حسن (PT-518). أنتظر تجهيز وتعقيم طاولة العلاج لتضميد الجرح.»',
        en: '"Hi, I am Noura Hassan (PT-518). I am waiting for the treatment table to be disinfected for my dressing."',
      },
      symptoms: {
        ar: '«جرح بسيط أثناء الطهي، لا توجد حرارة، وأريد تنظيفه بطريقة معقمة.»',
        en: '"A minor kitchen cut with no fever; I just need sterile cleaning and dressing."',
      },
      afterCare: {
        ar: '«شكراً لتعقيم منطقة العلاج وتضميد الجرح بعناية!»',
        en: '"Thank you for preparing a clean sterile area and dressing my wound carefully!"',
      },
    },
  },
  {
    id: 'patient-deterioration',
    patientCode: 'PT-602',
    name: { ar: 'كريم عبد الله (مراقبة الحالات الحرجة)', en: 'Karim Abdullah (Critical Observation Bay)' },
    age: 64,
    roomLabel: { ar: 'قسم الطوارئ — وحدة المراقبة الحرجة C1', en: 'Emergency Dept — Critical Observation Bay C1' },
    departmentId: 'dept-emergency',
    x: -26.2,
    z: -7.8,
    inBed: true,
    outfitColor: 0xef4444,
    initialVisualState: 'distress',
    presentingComplaint: {
      ar: 'تدهور سريري مفاجئ: حمى شديدة، تسارع نبض وتنفس، وهبوط ضغط وأكسجين (اشتباه إنتان Sepsis).',
      en: 'Simulated acute deterioration: high fever, tachycardia, tachypnea, hypotension & low SpO2 (Sepsis alert).',
    },
    scenarioHistory: {
      ar: 'بيانات تدريبية محاكاة: حالة طوارئ! قِس العلامات الحيوية، قدم الأكسجين الداعم، وصعّد فوراً للفريق الطبي.',
      en: 'Simulated training record: URGENT! Measure vitals, provide supportive oxygen/comfort, and escalate immediately to the clinical team.',
    },
    allergyBanner: { ar: 'لا توجد حساسية دوائية مسجلة (NKDA)', en: 'No Known Drug Allergies (NKDA)' },
    hasPenicillinAllergy: false,
    vitals: {
      tempC: 39.4,
      pulseBpm: 124,
      respRate: 28,
      bpSystolic: 88,
      bpDiastolic: 54,
      spo2Pct: 89,
    },
    assignedMissionId: 'mission-7-patient-deterioration',
    dialogue: {
      intro: {
        ar: '«أنا كريم عبد الله (PT-602)... أشعر بضيق شديد في التنفس ورعشة ودوار...»',
        en: '"I am Karim Abdullah (PT-602)... I feel very short of breath, dizzy, and shivering..."',
      },
      symptoms: {
        ar: '«نبضات قلبي سريعة جداً وأشعر ببرودة في الأطراف منذ نصف ساعة.»',
        en: '"My heart is racing and my hands feel cold since thirty minutes ago."',
      },
      afterCare: {
        ar: '«الحمد لله... بعد تدخل الفريق الطبي السريع والأكسجين أشعر باستقرار أفضل الآن.»',
        en: '"Thank goodness... after your rapid escalation to the clinical team and oxygen support, I feel much more stable."',
      },
    },
  },
];

export const HOSPITAL_STAFF_NPCS: StaffNpcDef[] = [
  {
    id: 'staff-charge-nurse',
    name: { ar: 'الممرضة المسؤولة ليلى (محطة التمريض)', en: 'Charge Nurse Laila (Nursing Station)' },
    roleTitle: { ar: 'رئيسة هيئة التمريض وتسليم المناوبة', en: 'Head Charge Nurse & Shift Coordinator' },
    icon: '👩‍⚕️',
    x: 1.8,
    z: -18.5,
    color: 0x0284c7,
    greeting: {
      ar: '«أهلاً بكِ في مناوبتكِ التمريضية! راجعي لوحة المهام الـ 8، وتأكدي من قياس العلامات الحيوية وفحص الحساسية قبل إعطاء أي دواء.»',
      en: '"Welcome to your nursing shift! Follow the 8 shift missions, always measure vitals, and check allergies before administering any medication."',
    },
  },
  {
    id: 'staff-er-physician',
    name: { ar: 'د. سامح (طبيب الطوارئ والفرز)', en: 'Dr. Sameh (Emergency & Triage Physician)' },
    roleTitle: { ar: 'استشاري طب الطوارئ والاستجابة السريعة', en: 'Emergency Medicine & Rapid Response Lead' },
    icon: '👨‍⚕️',
    x: -19.2,
    z: -5.8,
    color: 0xdc2626,
    greeting: {
      ar: '«في الطوارئ، التفرقة بين العدوى الفيروسية البسيطة وتدهور إنتان الدم (Sepsis) يبدأ من دقة تقييمكِ التمريضي للعلامات الحيوية.»',
      en: '"In the ER, distinguishing a mild viral cold from acute sepsis deterioration starts with your accurate nursing vital signs assessment."',
    },
  },
  {
    id: 'staff-radiologist',
    name: { ar: 'د. رانيا (أخصائية الأشعة التشخيصية)', en: 'Dr. Rania (Diagnostic Radiologist)' },
    roleTitle: { ar: 'مسؤولة وحدة أشعة الصدر X-Ray', en: 'Chest Radiography Specialist' },
    icon: '🩻',
    x: -21.5,
    z: 18.5,
    color: 0x2563eb,
    greeting: {
      ar: '«أحضري طلب الأشعة (#XR-204) إلى جهاز التحكم لتشغيل أشعة الصدر ومراجعة الفص الرئوي قبل إبلاغ الطبيب.»',
      en: '"Bring requisition chart #XR-204 to the imaging console to run the Chest X-Ray study and report the findings."',
    },
  },
  {
    id: 'staff-lab-specialist',
    name: { ar: 'أ. مازن (أخصائي الميكروبيولوجي والمعمل)', en: 'Mazen (Clinical Microbiology Specialist)' },
    roleTitle: { ar: 'مسؤول المزارع البكتيرية واختبار AST', en: 'Bacterial Culture & AST Lab Lead' },
    icon: '🔬',
    x: 21.5,
    z: -3.2,
    color: 0x7c3aed,
    greeting: {
      ar: '«استلمي العبوة المعقمة (#LB-309) واسحبي العينة من المريضة سلمى ثم سلميها هنا لإظهار نتيجة الحساسية البكتيرية.»',
      en: '"Pick up sterile container #LB-309, collect the specimen from patient Salma, and submit it here for AST susceptibility results."',
    },
  },
  {
    id: 'staff-pharmacist',
    name: { ar: 'د. هدى (الصيدلانية الإكلينيكية)', en: 'Dr. Huda (Clinical Pharmacist)' },
    roleTitle: { ar: 'مسؤولة السلامة الدوائية وحوكمة المضادات', en: 'Medication Safety & Antimicrobial Stewardship Pharmacist' },
    icon: '💊',
    x: 20.5,
    z: 17.5,
    color: 0x059669,
    greeting: {
      ar: '«تذكري الحقوق الخمسة لإعطاء الدواء! إذا اكتشفتِ حساسية للبنسلين عند المريض، أوقفي الإعطاء فوراً واصرفي البديل الآمن من الشباك.»',
      en: '"Remember the 5 Rights of Medication Safety! If you detect a Penicillin allergy, block administration immediately and pick up the safe alternative here."',
    },
  },
];

export const NURSING_SHIFT_MISSIONS: NursingMissionDef[] = [
  {
    id: 'mission-1-triage-vitals',
    order: 1,
    icon: '🩺',
    title: {
      ar: 'المهمة 1: التقييم الأولي وقياس العلامات الحيوية في الفرز',
      en: 'Mission 1: Initial Patient Assessment & Vital Signs Collection',
    },
    shortScenario: {
      ar: 'التقط حقيبة العلامات الحيوية من مكتب الفرز، وتأكد من هوية المريض أحمد السعيد (PT-101) وقِس علاماته الحيوية الخمس وسجلها.',
      en: 'Pick up the Vital Signs Kit at Triage, verify identity of patient Ahmed Al-Saeed (PT-101), measure all 5 vital signs, and record the chart.',
    },
    clinicalContext: {
      ar: 'المريض يطلب مضاداً حيوياً لرشح بسيط؛ التقييم التمريضي الكامل يثبت استقرار العلامات الحيوية وكون الحالة فيروسية.',
      en: 'Patient requests antibiotics for a common cold; complete nursing assessment confirms stable vitals and viral etiology.',
    },
    xpReward: 90,
    patientId: 'patient-triage',
    destinationWorkstationId: 'ws-triage-desk',
    requiredEquipmentId: 'eq-vitals-kit',
    objectives: [
      {
        id: 'm1-obj1-pickup-kit',
        title: { ar: 'التقط حقيبة العلامات الحيوية من محطة فرز الطوارئ', en: 'Pick up the Vital Signs Kit from ER Triage Desk' },
        hint: { ar: 'توجه إلى قسم الطوارئ غرباً واضغط تفاعل عند حقيبة العلامات الحيوية.', en: 'Head west to Emergency Triage and pick up the Vital Signs Kit.' },
        targetX: -19.5,
        targetZ: -6.8,
        targetLabel: { ar: 'محطة فرز الطوارئ', en: 'ER Triage Desk' },
      },
      {
        id: 'm1-obj2-confirm-id',
        title: { ar: 'تأكد من هوية المريض أحمد (PT-101) واسأله عن الأعراض', en: 'Verify identity of Ahmed (PT-101) and ask about symptoms' },
        hint: { ar: 'اقترب من سرير المريض أحمد السعيد في الفرز وافتح نافذة الرعاية.', en: 'Approach patient Ahmed Al-Saeed in Triage and open the care interface.' },
        targetX: -23.5,
        targetZ: -7.2,
        targetLabel: { ar: 'المريض أحمد (PT-101)', en: 'Patient Ahmed (PT-101)' },
      },
      {
        id: 'm1-obj3-measure-vitals',
        title: { ar: 'قِس العلامات الحيوية الخمس وسجل النتيجة في السجل التمريضي', en: 'Measure all 5 vital signs and record assessment in patient chart' },
        hint: { ar: 'استخدم حقيبة العلامات الحيوية داخل نافذة المريض ثم اضغط توثيق السجل.', en: 'Use the Vitals Kit in the patient window, then click Record Assessment.' },
        targetX: -23.5,
        targetZ: -7.2,
        targetLabel: { ar: 'توثيق علامات PT-101', en: 'Document PT-101 Vitals' },
      },
    ],
  },
  {
    id: 'mission-2-radiology-xray',
    order: 2,
    icon: '🩻',
    title: {
      ar: 'المهمة 2: نقل طلب الأشعة وإجراء تصوير الصدر (X-Ray)',
      en: 'Mission 2: Radiology Workflow & Chest X-Ray Study',
    },
    shortScenario: {
      ar: 'راجع المريض طارق المنصور (PT-204) في الجناح الغربي، استلم طلب الأشعة (#XR-204)، وتوجه لقسم الأشعة لتشغيل التصوير وإبلاغ الفريق الطبي.',
      en: 'Check patient Tariq Al-Mansour (PT-204), collect X-Ray requisition #XR-204, run the Chest X-Ray in Radiology, and report findings.',
    },
    clinicalContext: {
      ar: 'تصوير الصدر يوضح وجود تكثف فصي بكتيري يستدعي إبلاغ الطبيب المعالج بنتيجة الأشعة.',
      en: 'Chest radiography reveals right lower lobe consolidation requiring clinician notification.',
    },
    xpReward: 110,
    patientId: 'patient-radiology',
    destinationWorkstationId: 'ws-xray-console',
    requiredEquipmentId: 'eq-xray-request-chart',
    objectives: [
      {
        id: 'm2-obj1-patient-prep',
        title: { ar: 'تأكد من هوية المريض طارق (PT-204) واستلم ملف طلب الأشعة #XR-204', en: 'Confirm identity of Tariq (PT-204) and pick up X-Ray Order #XR-204' },
        hint: { ar: 'ادخل المستشفى الرئيسي شمالاً وتفاعل مع المريض طارق أو ملف الأشعة بجواره.', en: 'Enter the Main Hospital north and interact with patient Tariq or his X-Ray chart.' },
        targetX: -9.5,
        targetZ: -26.5,
        targetLabel: { ar: 'المريض طارق (PT-204)', en: 'Patient Tariq (PT-204)' },
      },
      {
        id: 'm2-obj2-run-xray',
        title: { ar: 'انقل طلب الأشعة إلى قسم الأشعة وشغّل جهاز تصوير الصدر', en: 'Transport order #XR-204 to Radiology and run the Chest X-Ray study' },
        hint: { ar: 'اتجه إلى مبنى الأشعة في الجنوب الغربي وتفاعل مع وحدة التحكم X-Ray.', en: 'Go to the Radiology building (southwest) and interact with the X-Ray workstation.' },
        targetX: -24.5,
        targetZ: 19.0,
        targetLabel: { ar: 'جهاز الأشعة السينية', en: 'X-Ray Workstation' },
      },
      {
        id: 'm2-obj3-report-clinician',
        title: { ar: 'أبلغ الفريق الطبي بنتيجة الأشعة في محطة التمريض المركزية', en: 'Report the Chest X-Ray findings at the Central Nursing Station' },
        hint: { ar: 'عد إلى محطة التمريض المركزية في المستشفى الرئيسي لتسجيل نتيجة الأشعة.', en: 'Return to the Central Nursing Station to log and report the X-Ray result.' },
        targetX: 0,
        targetZ: -19.5,
        targetLabel: { ar: 'محطة التمريض المركزية', en: 'Central Nursing Station' },
      },
    ],
  },
  {
    id: 'mission-3-lab-specimen',
    order: 3,
    icon: '🔬',
    title: {
      ar: 'المهمة 3: سحب ونقل عينة المعمل للمزرعة البكتيرية',
      en: 'Mission 3: Laboratory Specimen Collection & AST Submission',
    },
    shortScenario: {
      ar: 'احصل على عبوة العينة المعقمة (#LB-309) من المعمل، اجمع العينة من المريضة سلمى الكيلاني (PT-309)، ثم سلمها لجهاز التحليل بالمعمل.',
      en: 'Retrieve sterile container #LB-309 from the Lab, collect the specimen from patient Salma Al-Kilani (PT-309), and submit it at the Lab workstation.',
    },
    clinicalContext: {
      ar: 'مزرعة البول واختبار الحساسية (AST) يمنعان استخدام مضاد حيوي تقاومه البكتيريا.',
      en: 'Urine culture and susceptibility testing (AST) prevent prescribing ineffective antibiotics.',
    },
    xpReward: 115,
    patientId: 'patient-lab',
    destinationWorkstationId: 'ws-lab-analyzer',
    requiredEquipmentId: 'eq-specimen-container',
    objectives: [
      {
        id: 'm3-obj1-get-container',
        title: { ar: 'التقط عبوة العينة المعقمة (#LB-309) من المعمل المركزي', en: 'Pick up labeled sterile container (#LB-309) from Central Lab' },
        hint: { ar: 'توجه شرقاً إلى مبنى المعمل المركزي والتقط عبوة العينة.', en: 'Head east to the Central Laboratory and pick up the sterile container.' },
        targetX: 22.0,
        targetZ: -5.5,
        targetLabel: { ar: 'المعمل المركزي', en: 'Central Laboratory' },
      },
      {
        id: 'm3-obj2-collect-sample',
        title: { ar: 'تأكد من هوية المريضة سلمى (PT-309) واسحب العينة المعقمة', en: 'Verify patient Salma (PT-309) and collect the sterile specimen' },
        hint: { ar: 'اذهب إلى الجناح الأوسط بالمستشفى الرئيسي وتفاعل مع سلمى لسحب العينة.', en: 'Go to the central ward in the Main Hospital and collect the specimen from Salma.' },
        targetX: 0,
        targetZ: -27.5,
        targetLabel: { ar: 'المريضة سلمى (PT-309)', en: 'Patient Salma (PT-309)' },
      },
      {
        id: 'm3-obj3-submit-lab',
        title: { ar: 'انقل العينة المسحوبة وسلمها في محطة المعمل المركزي لمراجعة النتيجة', en: 'Transport and submit the collected specimen at the Lab Analyzer' },
        hint: { ar: 'عد بالعينة المسحوبة إلى محطة المعمل المركزي واضغط تسليم وفحص النتيجة.', en: 'Return with the collected specimen to the Lab workstation and submit it.' },
        targetX: 24.5,
        targetZ: -4.0,
        targetLabel: { ar: 'جهاز تحليل المزرعة بالمعمل', en: 'Lab AST Analyzer' },
      },
    ],
  },
  {
    id: 'mission-4-pharmacy-med-safety',
    order: 4,
    icon: '💊',
    title: {
      ar: 'المهمة 4: صرف الدواء والتحقق من سلامة وحساسية المريض',
      en: 'Mission 4: Pharmacy Retrieval & Medication Allergy Safety Check',
    },
    shortScenario: {
      ar: 'راجع طلب الدواء للمريض محمود درويش (PT-412)، ارصد تعارض حساسية البنسلين وأوقف الإعطاء، ثم اصرف البديل الآمن (أزيثروميسين) من الصيدلية ووثق الإعطاء.',
      en: 'Review the medication order for Mahmoud Darwish (PT-412), block Penicillin due to severe allergy, retrieve safe Azithromycin from Pharmacy, and document administration.',
    },
    clinicalContext: {
      ar: 'تطبيق الحقوق الخمسة لإعطاء الدواء ورصد حساسية البنسلين يحمي المريض من الصدمة التحسسية.',
      en: 'Applying the 5 Rights of Medication Administration and blocking Penicillin prevents anaphylaxis.',
    },
    xpReward: 130,
    patientId: 'patient-fatigue',
    destinationWorkstationId: 'ws-pharmacy-counter',
    requiredEquipmentId: 'eq-med-azithromycin-pkg',
    objectives: [
      {
        id: 'm4-obj1-pickup-initial-med',
        title: { ar: 'زُر الصيدلية أو راجع المريض محمود (PT-412) لفحص أمر الدواء الأولي', en: 'Visit Pharmacy or inspect patient Mahmoud (PT-412) to review the medication order' },
        hint: { ar: 'توجه إلى الصيدلية في الجنوب الشرقي أو إلى سرير المريض محمود في الجناح الشرقي.', en: 'Visit the Pharmacy (southeast) or patient Mahmoud in the East Ward.' },
        targetX: 21.5,
        targetZ: 16.8,
        targetLabel: { ar: 'شباك الصيدلية', en: 'Pharmacy Counter' },
      },
      {
        id: 'm4-obj2-detect-allergy-block',
        title: { ar: 'افحص سوار حساسية المريض محمود (PT-412) وأوقف إعطاء البنسلين مع الإبلاغ', en: 'Check Mahmoud (PT-412) allergy wristband, block Penicillin, and escalate' },
        hint: { ar: 'افتح نافذة المريض محمود واضغط «إيقاف الإعطاء والإبلاغ عن تعارض الحساسية».', en: 'Open Mahmoud’s modal and click "Block Administration & Report Allergy Discrepancy".' },
        targetX: 9.5,
        targetZ: -26.5,
        targetLabel: { ar: 'المريض محمود (PT-412)', en: 'Patient Mahmoud (PT-412)' },
      },
      {
        id: 'm4-obj3-administer-safe-alt',
        title: { ar: 'احصل على عبوة الأزيثروميسين الآمنة من الصيدلية وأعطها للمريض بعد التحقق الخماسي', en: 'Retrieve safe Azithromycin from Pharmacy and administer after 5-Rights check' },
        hint: { ar: 'التقط عبوة أزيثروميسين الخضراء من الصيدلية ثم عد للمريض محمود لتوثيق الإعطاء.', en: 'Pick up the green Azithromycin package at Pharmacy and administer it to Mahmoud.' },
        targetX: 9.5,
        targetZ: -26.5,
        targetLabel: { ar: 'إعطاء البديل الآمن لـ PT-412', en: 'Administer Safe Med to PT-412' },
      },
    ],
  },
  {
    id: 'mission-5-clean-treatment',
    order: 5,
    icon: '🧼',
    title: {
      ar: 'المهمة 5: تجهيز وتعقيم منطقة العلاج ورعاية الجروح',
      en: 'Mission 5: Preparing a Clean Treatment Area & Aseptic Care',
    },
    shortScenario: {
      ar: 'أحضر صينية التعقيم والضماد من غرفة المستلزمات، جهّز طاولة الفحص المعقمة في الطوارئ، ثم قدم الرعاية للمريضة نورا حسن (PT-518).',
      en: 'Collect the Sterile Dressing Tray from the Supply Room, disinfect the Exam Table in Emergency, and complete care for Noura Hassan (PT-518).',
    },
    clinicalContext: {
      ar: 'مكافحة العدوى وتطهير الأسطح والأدوات يمنع انتقال البكتيريا المقاومة داخل المستشفى.',
      en: 'Infection control and surface disinfection prevent healthcare-associated resistant infections.',
    },
    xpReward: 100,
    patientId: 'patient-treatment',
    destinationWorkstationId: 'ws-treatment-table',
    requiredEquipmentId: 'eq-sterile-dressing-kit',
    objectives: [
      {
        id: 'm5-obj1-pickup-tray',
        title: { ar: 'التقط صينية التعقيم والضماد من غرفة المستلزمات الطبية', en: 'Pick up the Sterile Dressing Tray from the Medical Supply Room' },
        hint: { ar: 'توجد غرفة المستلزمات داخل مبنى الصيدلية والإمدادات بالجنوب الشرقي.', en: 'The Supply Room is located inside the southeast Pharmacy & Supply building.' },
        targetX: 25.8,
        targetZ: 20.5,
        targetLabel: { ar: 'غرفة المستلزمات الطبية', en: 'Medical Supply Room' },
      },
      {
        id: 'm5-obj2-prep-table',
        title: { ar: 'عقم وجهّز طاولة الفحص والعلاج في قسم الطوارئ', en: 'Disinfect and prepare the Examination Table in the Emergency Dept' },
        hint: { ar: 'احمل صينية التعقيم إلى طاولة العلاج في قسم الطوارئ واضغط تجهيز المنطقة.', en: 'Carry the sterile tray to the Exam Table in the Emergency Department and prepare it.' },
        targetX: -26.5,
        targetZ: -1.5,
        targetLabel: { ar: 'طاولة الفحص والعلاج', en: 'Sterile Exam Table' },
      },
      {
        id: 'm5-obj3-care-patient',
        title: { ar: 'افحص المريضة نورا حسن (PT-518) وقدم الرعاية والتضميد المعقم', en: 'Assess patient Noura Hassan (PT-518) and provide aseptic comfort care' },
        hint: { ar: 'تفاعل مع نورا حسن بجوار طاولة العلاج، أكد هويتها وقس علاماتها وقدم الرعاية.', en: 'Interact with Noura Hassan next to the exam table, confirm ID, measure vitals, and provide care.' },
        targetX: -26.5,
        targetZ: -4.2,
        targetLabel: { ar: 'المريضة نورا (PT-518)', en: 'Patient Noura (PT-518)' },
      },
    ],
  },
  {
    id: 'mission-6-restock-supplies',
    order: 6,
    icon: '📦',
    title: {
      ar: 'المهمة 6: إعادة تموين المستلزمات التمريضية لعربة الطوارئ',
      en: 'Mission 6: Restocking Nursing Supplies & Inventory Log',
    },
    shortScenario: {
      ar: 'احمل صندوق المستلزمات التمريضية من غرفة الإمدادات، سلمه إلى عربة مستلزمات الطوارئ، ووثق التموين في محطة التمريض.',
      en: 'Carry the Medical Supply Box from the Supply Room, deliver it to the ER Supply Cart, and log the restock at the Nursing Station.',
    },
    clinicalContext: {
      ar: 'توفر القفازات المعقمة والمحاليل وأدوات الوقاية الشخصية يضمن استمرارية الرعاية الآمنة.',
      en: 'Maintaining stocked sterile gloves, saline, and PPE ensures uninterrupted safe nursing care.',
    },
    xpReward: 95,
    destinationWorkstationId: 'ws-er-supply-cart',
    requiredEquipmentId: 'eq-supply-box',
    objectives: [
      {
        id: 'm6-obj1-pickup-box',
        title: { ar: 'التقط صندوق المستلزمات التمريضية من غرفة المعدات والإمدادات', en: 'Pick up the Nursing Medical Supply Box from the Supply Room' },
        hint: { ar: 'توجه إلى ركن الإمدادات في المبنى الجنوبي الشرقي والتقط الصندوق البرتقالي.', en: 'Go to the Supply Room in the southeast building and pick up the orange supply box.' },
        targetX: 26.8,
        targetZ: 22.0,
        targetLabel: { ar: 'غرفة الإمدادات', en: 'Supply Room' },
      },
      {
        id: 'm6-obj2-deliver-er',
        title: { ar: 'انقل الصندوق وسلمه في عربة مستلزمات الطوارئ', en: 'Deliver the Supply Box to the Emergency Department Supply Cart' },
        hint: { ar: 'اتجه غرباً إلى قسم الطوارئ وتفاعل مع عربة المستلزمات لتفريغ الصندوق.', en: 'Head west to the Emergency Department and interact with the ER Supply Cart.' },
        targetX: -21.0,
        targetZ: -1.2,
        targetLabel: { ar: 'عربة مستلزمات الطوارئ', en: 'ER Supply Cart' },
      },
      {
        id: 'm6-obj3-log-station',
        title: { ar: 'وثّق إتمام التموين في محطة التمريض المركزية', en: 'Log the completed supply restock at the Central Nursing Station' },
        hint: { ar: 'عد إلى محطة التمريض المركزية واضغط تسجيل إتمام التموين.', en: 'Return to the Central Nursing Station and log the supply restock.' },
        targetX: 0,
        targetZ: -19.5,
        targetLabel: { ar: 'محطة التمريض المركزية', en: 'Central Nursing Station' },
      },
    ],
  },
  {
    id: 'mission-7-patient-deterioration',
    order: 7,
    icon: '🚨',
    title: {
      ar: 'المهمة 7: الاستجابة لتدهور حالة مريض وإبلاغ الفريق الطبي',
      en: 'Mission 7: Responding to Simulated Patient Deterioration',
    },
    shortScenario: {
      ar: 'استجب لنداء الطوارئ للمريض كريم عبد الله (PT-602)، قِس علاماته الحيوية الحرجة، قدم الأكسجين المساند، وأبلغ فريق الاستجابة السريعة فوراً.',
      en: 'Respond to critical patient Karim Abdullah (PT-602), measure his deteriorating vitals, provide supportive care, and alert the clinical team immediately.',
    },
    clinicalContext: {
      ar: 'التعرف المبكر على علامات إنتان الدم (ارتفاع الحرارة، تسارع النبض والتنفس، نقص الأكسجين) والتصعيد الفوري ينقذ حياة المريض.',
      en: 'Early recognition of sepsis warning signs (fever, tachycardia, tachypnea, hypoxia) and rapid escalation saves lives.',
    },
    xpReward: 140,
    patientId: 'patient-deterioration',
    destinationWorkstationId: 'ws-triage-desk',
    objectives: [
      {
        id: 'm7-obj1-assess-critical',
        title: { ar: 'توجه فوراً للمريض كريم عبد الله (PT-602) وتأكد من هويته وقِس علاماته الحرجة', en: 'Reach critical patient Karim Abdullah (PT-602), confirm ID, and measure vitals' },
        hint: { ar: 'المريض كريم في وحدة المراقبة الحرجة بقسم الطوارئ (الركن الغربي).', en: 'Patient Karim is in the Critical Observation Bay inside the Emergency Department.' },
        targetX: -26.2,
        targetZ: -7.8,
        targetLabel: { ar: 'المريض الحرج كريم (PT-602)', en: 'Critical Patient Karim (PT-602)' },
      },
      {
        id: 'm7-obj2-comfort-and-escalate',
        title: { ar: 'قدم الأكسجين المساند وصعّد الحالة للفريق الطبي من نافذة المريض', en: 'Provide supportive oxygen care and trigger clinical escalation in the patient panel' },
        hint: { ar: 'اضغط «تقديم الرعاية والأكسجين» ثم «إبلاغ الفريق الطبي وتصعيد الحالة».', en: 'Click "Provide Comfort & Oxygen" then "Notify Clinical Team & Escalate".' },
        targetX: -26.2,
        targetZ: -7.8,
        targetLabel: { ar: 'تصعيد حالة PT-602', en: 'Escalate PT-602' },
      },
      {
        id: 'm7-obj3-brief-er-doc',
        title: { ar: 'أكّد بلاغ الاستجابة السريعة في محطة فرز الطوارئ أو محطة التمريض', en: 'Confirm the Rapid Response escalation at the ER Triage Desk or Nursing Station' },
        hint: { ar: 'تفاعل مع محطة فرز الطوارئ أو محطة التمريض لتوثيق استلام الفريق الطبي للحالة.', en: 'Interact with the ER Triage Desk or Nursing Station to confirm team handover.' },
        targetX: -20.5,
        targetZ: -6.5,
        targetLabel: { ar: 'محطة استجابة الطوارئ', en: 'ER Rapid Response Console' },
      },
    ],
  },
  {
    id: 'mission-8-nursing-handover',
    order: 8,
    icon: '📋',
    title: {
      ar: 'المهمة 8: إتمام تسليم المناوبة التمريضية الشامل (SBAR)',
      en: 'Mission 8: Completing Full Nursing Shift Handover (SBAR)',
    },
    shortScenario: {
      ar: 'التقط سجل تسليم المناوبة (SBAR Binder) ووثّق ملخص حالات المرضى الستة ونتائج الأشعة والمعمل والأدوية في محطة التمريض المركزية.',
      en: 'Pick up the SBAR Shift Handover Binder and complete the structured shift handover at the Central Nursing Station.',
    },
    clinicalContext: {
      ar: 'التواصل التمريضي المنظم بنموذج SBAR (الموقف، الخلفية، التقييم، التوصية) يضمن سلامة المرضى بين المناوبات.',
      en: 'Structured SBAR communication (Situation, Background, Assessment, Recommendation) ensures continuity of safe patient care.',
    },
    xpReward: 150,
    destinationWorkstationId: 'ws-nursing-station',
    requiredEquipmentId: 'eq-sbar-handover-binder',
    objectives: [
      {
        id: 'm8-obj1-pickup-binder',
        title: { ar: 'التقط سجل تسليم المناوبة التمريضية (SBAR Binder) بجوار محطة التمريض', en: 'Pick up the SBAR Shift Handover Binder near the Nursing Station' },
        hint: { ar: 'تجد سجل SBAR الأزرق على طاولة محطة التمريض المركزية.', en: 'Find the blue SBAR binder at the Central Nursing Station.' },
        targetX: 3.2,
        targetZ: -19.5,
        targetLabel: { ar: 'سجل تسليم المناوبة SBAR', en: 'SBAR Binder' },
      },
      {
        id: 'm8-obj2-complete-sbar',
        title: { ar: 'أكمل توثيق وتسليم المناوبة التمريضية في محطة التمريض المركزية', en: 'Complete and sign off the Nursing Shift Handover at the Central Nursing Station' },
        hint: { ar: 'افتح محطة التمريض المركزية واضغط «إتمام تسليم المناوبة التمريضية SBAR».', en: 'Open the Central Nursing Station interface and click "Complete SBAR Shift Handover".' },
        targetX: 0,
        targetZ: -19.5,
        targetLabel: { ar: 'محطة التمريض المركزية', en: 'Central Nursing Station' },
      },
    ],
  },
];

export function createInitialPatientStates(): Record<string, PatientSimState> {
  const map: Record<string, PatientSimState> = {};
  for (const pt of HOSPITAL_PATIENTS) {
    map[pt.id] = {
      id: pt.id,
      visualState: pt.initialVisualState,
      identityConfirmed: false,
      symptomsAsked: false,
      vitalsMeasured: false,
      chartRecorded: false,
      comfortProvided: false,
      escalatedToTeam: false,
      specimenCollected: false,
      xrayCompleted: false,
      medicationVerified: false,
      allergyFlagged: false,
      medicationAdministered: false,
      statusNoteAr: 'بانتظار التقييم التمريضي',
      statusNoteEn: 'Awaiting nursing assessment',
    };
  }
  return map;
}
