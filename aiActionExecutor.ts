/**
 * aiActionExecutor.ts
 *
 * Action Preview Builder, Live Medication Safety Evaluator, Duplicate Detector,
 * and Validated Action Executor for the Antibiotic Awareness Personal Health Assistant.
 *
 * Architectural Guarantees:
 * - Never writes arbitrary unvalidated objects to Firebase.
 * - Integrates directly with `evaluateMedicationSafety` (`medicationSafetyEngine.ts`),
 *   `checkDrugAllergySafety` (`allergyData.ts`), and `validatePrescriptionInstructions` (`trackerData.ts`).
 * - Generates a rich `PendingAiActionProposal` with live safety warnings, duplicate detection alerts,
 *   and highlighted uncertain/missing fields before any write occurs.
 * - Executes writes only after `confirmedByPatient === true` and `verifyActionAuthorization` passes.
 */

import { Lang } from './types';
import {
  AllergyRecord,
  ALLERGEN_CATEGORIES,
  checkDrugAllergySafety,
  ChronicConditionRecord,
  loadProfile,
  MedicalDocumentRecord,
  MedicationRecord,
  saveProfile,
  syncNotesWithChronicConditions,
  UserHealthProfile,
} from './allergyData';
import {
  calculateAutoDoseTimes,
  computeEndDate,
  formatFrequencyLabel,
  formatLocalDateYYYYMMDD,
  formatRouteLabel,
  formatTime12Hour,
  generateScheduleDoses,
  loadPrescriptions,
  loadSchedules,
  SavedPrescription,
  saveSchedules,
  TreatmentSchedule,
  validatePrescriptionInstructions,
} from './trackerData';
import { evaluateMedicationSafety, SafetyAssessmentResult } from './medicationSafetyEngine';
import {
  AddAllergyArgs,
  AddChronicConditionArgs,
  AddMedicationArgs,
  AddPrescriptionArgs,
  AiActionPayloadMap,
  AiActionType,
  CreateReminderArgs,
  SaveMedicalDocumentArgs,
  StopReminderArgs,
  UpdatePrescriptionStatusArgs,
  UpdateReminderArgs,
  UpdateVitalsArgs,
  validateActionArguments,
} from './aiActionSchemas';
import {
  markIdempotencyKeyExecuted,
  recordPatientAuditLog,
  verifyActionAuthorization,
} from './aiActionPermissions';
import { AI_ACTION_REGISTRY } from './aiActionRegistry';
import { uploadMedicalDocumentToStorage } from './aiDocumentProcessor';

export interface ActionPreviewField {
  key: string;
  labelAr: string;
  labelEn: string;
  value: string;
  editable: boolean;
  inputType?: 'text' | 'number' | 'select';
  options?: Array<{ value: string; labelAr: string; labelEn: string }>;
  uncertainOrMissing?: boolean;
}

export interface ActionSafetyPreview {
  status: 'safe' | 'caution' | 'warning' | 'urgent';
  headlineAr: string;
  headlineEn: string;
  detailsAr: string[];
  detailsEn: string[];
  duplicateDetected: boolean;
  duplicateMessageAr?: string;
  duplicateMessageEn?: string;
  rawSafetyReport?: SafetyAssessmentResult;
}

export interface PendingAiActionProposal<K extends AiActionType = AiActionType> {
  id: string;
  idempotencyKey: string;
  actionType: K;
  titleAr: string;
  titleEn: string;
  icon: string;
  args: AiActionPayloadMap[K];
  fields: ActionPreviewField[];
  safetyPreview: ActionSafetyPreview;
  sourceLabelAr: string;
  sourceLabelEn: string;
  verificationBadgeAr: string;
  verificationBadgeEn: string;
  previewImageUrl?: string;
  rawFileForUpload?: File;
  base64DataForUpload?: string;
  status: 'pending_confirmation' | 'confirmed_saved' | 'cancelled' | 'failed';
  resultMessageAr?: string;
  resultMessageEn?: string;
  createdAt: string;
}

export interface ActionExecutionResult {
  success: boolean;
  actionType: AiActionType;
  messageAr: string;
  messageEn: string;
  updatedProfile?: UserHealthProfile;
  updatedSchedules?: TreatmentSchedule[];
  updatedPrescriptions?: SavedPrescription[];
  auditLogId?: string;
  errorCode?: string;
}

/**
 * Evaluates live medication safety and checks for duplicates against the patient's existing profile
 * before displaying the confirmation card.
 */
export function evaluateActionSafetyPreview<K extends AiActionType>(
  actionType: K,
  args: AiActionPayloadMap[K],
  profile: UserHealthProfile,
  schedules: TreatmentSchedule[],
  prescriptions: SavedPrescription[]
): ActionSafetyPreview {
  const detailsAr: string[] = [];
  const detailsEn: string[] = [];
  let status: ActionSafetyPreview['status'] = 'safe';
  let duplicateDetected = false;
  let duplicateMessageAr: string | undefined;
  let duplicateMessageEn: string | undefined;
  let rawSafetyReport: SafetyAssessmentResult | undefined;

  if (actionType === 'add_chronic_condition') {
    const a = args as AddChronicConditionArgs;
    const exists = (profile.chronicConditions || []).some(
      (c) => c.conditionName.trim().toLowerCase() === a.conditionName.trim().toLowerCase()
    );
    if (exists) {
      duplicateDetected = true;
      status = 'caution';
      duplicateMessageAr = `⚠️ هذه الحالة الصحية (${a.conditionName}) مسجلة بالفعل في ملفك الصحي — لن يتم تكرارها عند الحفظ.`;
      duplicateMessageEn = `⚠️ This condition (${a.conditionName}) is already recorded in your Health Profile — duplicates will be prevented.`;
    }
  }

  if (actionType === 'add_allergy') {
    const a = args as AddAllergyArgs;
    const exists = profile.allergies.some(
      (existing) =>
        existing.drugName.trim().toLowerCase() === a.drugName.trim().toLowerCase() ||
        (existing.allergenKey !== 'other' && existing.allergenKey === a.allergenKey)
    );
    if (exists) {
      duplicateDetected = true;
      status = 'caution';
      duplicateMessageAr = `⚠️ توجد حساسية مسجلة بالفعل لنفس الدواء أو العائلة (${a.drugName}) في ملفك الصحي.`;
      duplicateMessageEn = `⚠️ An allergy for this drug or family (${a.drugName}) is already documented in your profile.`;
    }
  }

  const checkDrugWithSafetyEngine = (drugName: string, doseText?: string) => {
    if (!drugName.trim()) return;
    const safetyReport = evaluateMedicationSafety({
      medications: [{ name: drugName, prescribedDose: doseText || '', sourceType: 'prescription' }],
      healthProfile: profile,
      includeProfileActiveMedications: true,
    });
    rawSafetyReport = safetyReport;

    const allergyCheck = checkDrugAllergySafety(drugName, profile.allergies);
    if (allergyCheck.matchLevel === 'exact_match') {
      status = 'urgent';
      detailsAr.push(`🚨 ${allergyCheck.title.ar}: ${allergyCheck.explanation.ar}`);
      detailsEn.push(`🚨 ${allergyCheck.title.en}: ${allergyCheck.explanation.en}`);
    } else if (allergyCheck.matchLevel === 'cross_reactivity') {
      if (status !== 'urgent') status = 'warning';
      detailsAr.push(`⚠️ ${allergyCheck.title.ar}: ${allergyCheck.explanation.ar}`);
      detailsEn.push(`⚠️ ${allergyCheck.title.en}: ${allergyCheck.explanation.en}`);
    }

    for (const f of safetyReport.findings) {
      if (f.type === 'allergy_match') {
        status = 'urgent';
      } else if (f.severity === 'urgent' && status !== 'urgent') {
        status = 'urgent';
      } else if (f.severity === 'warning' && status === 'safe') {
        status = 'warning';
      } else if (f.severity === 'caution' && status === 'safe') {
        status = 'caution';
      }
      const lineAr = `${f.title.ar} — ${f.reason.ar}`;
      const lineEn = `${f.title.en} — ${f.reason.en}`;
      if (!detailsAr.includes(lineAr)) detailsAr.push(lineAr);
      if (!detailsEn.includes(lineEn)) detailsEn.push(lineEn);
    }
  };

  if (actionType === 'add_medication') {
    const a = args as AddMedicationArgs;
    const dupMed = profile.medications.some(
      (m) =>
        m.status === 'active' &&
        m.drugName.trim().toLowerCase() === a.drugName.trim().toLowerCase()
    );
    if (dupMed) {
      duplicateDetected = true;
      if (status === 'safe') status = 'caution';
      duplicateMessageAr = `⚠️ الدواء (${a.drugName}) موجود بالفعل في قائمة أدويتك النشطة.`;
      duplicateMessageEn = `⚠️ Medication (${a.drugName}) is already in your active medications list.`;
    }
    checkDrugWithSafetyEngine(a.drugName, a.prescribedDose);
  }

  if (actionType === 'add_prescription' || actionType === 'save_medical_document') {
    const items =
      actionType === 'add_prescription'
        ? (args as AddPrescriptionArgs).items
        : (args as SaveMedicalDocumentArgs).extractedPrescriptions || [];
    for (const item of items) {
      if (item.medicineName) {
        const dupRx = prescriptions.some(
          (p) =>
            p.medicineName.trim().toLowerCase() === item.medicineName.trim().toLowerCase() &&
            p.prescribedDose.trim().toLowerCase() === (item.prescribedDose || '').trim().toLowerCase()
        );
        if (dupRx) {
          duplicateDetected = true;
          duplicateMessageAr = `ℹ️ توجد روشتة محفوظة مسبقاً لنفس الدواء (${item.medicineName}).`;
          duplicateMessageEn = `ℹ️ A saved prescription already exists for (${item.medicineName}).`;
        }
        checkDrugWithSafetyEngine(item.medicineName, item.prescribedDose);
      }
      if (item.unreadableFields && item.unreadableFields.length > 0 && status === 'safe') {
        status = 'caution';
        detailsAr.push(
          `⚠️ توجد حقول غير مكتملة أو غير مقروءة (${item.unreadableFields.join('، ')}) — لا يتم افتراض الجرعات تلقائياً؛ يرجى استكمالها أو مراجعة الصيدلي.`
        );
        detailsEn.push(
          `⚠️ Missing or unreadable fields (${item.unreadableFields.join(', ')}) — doses are never invented; please fill or verify with your pharmacist.`
        );
      }
    }
  }

  if (actionType === 'create_reminder') {
    const a = args as CreateReminderArgs;
    const dupSch = schedules.some(
      (s) => s.medicineName.trim().toLowerCase() === a.medicineName.trim().toLowerCase()
    );
    if (dupSch) {
      duplicateDetected = true;
      if (status === 'safe') status = 'caution';
      duplicateMessageAr = `⚠️ يوجد جدول تذكير نشط بالفعل للدواء (${a.medicineName}).`;
      duplicateMessageEn = `⚠️ An active reminder schedule already exists for (${a.medicineName}).`;
    }
    checkDrugWithSafetyEngine(a.medicineName, a.prescribedDose);
  }

  const headlines: Record<ActionSafetyPreview['status'], { ar: string; en: string }> = {
    safe: {
      ar: '✅ فحص الأمان الأولي: لا توجد تعارضات مسجلة مع ملفك الصحي الحالي',
      en: '✅ Live Safety Check: No documented conflicts with your current profile',
    },
    caution: {
      ar: 'ℹ️ يتطلب المراجعة والتدقيق قبل الحفظ',
      en: 'ℹ️ Requires Review & Verification Before Saving',
    },
    warning: {
      ar: '⚠️ تنبيه أمان دوائي: يُرجى قراءة الملاحظات السريرية قبل الحفظ',
      en: '⚠️ Medication Safety Warning: Please review clinical notes before saving',
    },
    urgent: {
      ar: '🚨 تحذير حرج من محرك الأمان الدوائي (تعارض حساسية أو تداخل خطير)!',
      en: '🚨 Critical Medication Safety Alert (Allergy Conflict or Severe Interaction)!',
    },
  };

  return {
    status,
    headlineAr: headlines[status].ar,
    headlineEn: headlines[status].en,
    detailsAr,
    detailsEn,
    duplicateDetected,
    ...(duplicateMessageAr ? { duplicateMessageAr } : {}),
    ...(duplicateMessageEn ? { duplicateMessageEn } : {}),
    ...(rawSafetyReport ? { rawSafetyReport } : {}),
  };
}

/**
 * Builds the editable fields list for a confirmation card so the patient can review or edit
 * any value before clicking "Confirm and Save".
 */
export function buildActionPreviewFields<K extends AiActionType>(
  actionType: K,
  args: AiActionPayloadMap[K]
): ActionPreviewField[] {
  switch (actionType) {
    case 'add_chronic_condition': {
      const a = args as AddChronicConditionArgs;
      return [
        {
          key: 'conditionName',
          labelAr: 'الحالة الصحية / المرض المزمن',
          labelEn: 'Medical Condition',
          value: a.conditionName,
          editable: true,
          inputType: 'text',
        },
        {
          key: 'notes',
          labelAr: 'ملاحظات إضافية',
          labelEn: 'Additional Notes',
          value: a.notes || '',
          editable: true,
          inputType: 'text',
        },
      ];
    }

    case 'add_allergy': {
      const a = args as AddAllergyArgs;
      return [
        {
          key: 'drugName',
          labelAr: 'الدواء أو المادة المسببة للحساسية',
          labelEn: 'Allergenic Drug / Substance',
          value: a.drugName,
          editable: true,
          inputType: 'text',
        },
        {
          key: 'allergenKey',
          labelAr: 'العائلة الدوائية',
          labelEn: 'Drug Family',
          value: a.allergenKey,
          editable: true,
          inputType: 'select',
          options: ALLERGEN_CATEGORIES.map((c) => ({
            value: c.id,
            labelAr: c.name.ar,
            labelEn: c.name.en,
          })),
        },
        {
          key: 'reportedSymptoms',
          labelAr: 'الأعراض التي ظهرت',
          labelEn: 'Reported Symptoms',
          value: a.reportedSymptoms,
          editable: true,
          inputType: 'text',
        },
        {
          key: 'severity',
          labelAr: 'درجة الخطورة',
          labelEn: 'Reaction Severity',
          value: a.severity,
          editable: true,
          inputType: 'select',
          options: [
            { value: 'life_threatening', labelAr: 'مهددة للحياة (صدمة تحسسية)', labelEn: 'Life-Threatening (Anaphylaxis)' },
            { value: 'severe', labelAr: 'شديدة (تورم / ضيق تنفس)', labelEn: 'Severe' },
            { value: 'moderate', labelAr: 'متوسطة (طفح جلدي)', labelEn: 'Moderate' },
            { value: 'mild', labelAr: 'خفيفة (حكة بسيطة)', labelEn: 'Mild' },
          ],
        },
      ];
    }

    case 'update_vitals': {
      const a = args as UpdateVitalsArgs;
      const fields: ActionPreviewField[] = [];
      if (a.weightKg !== undefined) {
        fields.push({
          key: 'weightKg',
          labelAr: 'الوزن (كجم)',
          labelEn: 'Weight (kg)',
          value: a.weightKg,
          editable: true,
          inputType: 'number',
        });
      }
      if (a.age !== undefined) {
        fields.push({
          key: 'age',
          labelAr: 'العمر (سنة)',
          labelEn: 'Age (years)',
          value: a.age,
          editable: true,
          inputType: 'number',
        });
      }
      if (a.bloodType !== undefined) {
        fields.push({
          key: 'bloodType',
          labelAr: 'فصيلة الدم',
          labelEn: 'Blood Type',
          value: a.bloodType,
          editable: true,
          inputType: 'text',
        });
      }
      return fields;
    }

    case 'add_medication': {
      const a = args as AddMedicationArgs;
      return [
        {
          key: 'drugName',
          labelAr: 'اسم الدواء',
          labelEn: 'Medication Name',
          value: a.drugName,
          editable: true,
          inputType: 'text',
          uncertainOrMissing: !a.drugName,
        },
        {
          key: 'prescribedDose',
          labelAr: 'الجرعة / التركيز الموصوف',
          labelEn: 'Prescribed Dose / Strength',
          value: a.prescribedDose,
          editable: true,
          inputType: 'text',
          uncertainOrMissing: !a.prescribedDose,
        },
        {
          key: 'route',
          labelAr: 'طريقة الاستعمال',
          labelEn: 'Route',
          value: a.route || 'oral',
          editable: true,
          inputType: 'select',
          options: [
            { value: 'oral', labelAr: 'أقراص / كبسول فموي', labelEn: 'Oral Tablet/Capsule' },
            { value: 'suspension', labelAr: 'شراب معلق', labelEn: 'Oral Suspension' },
            { value: 'injection', labelAr: 'حقن', labelEn: 'Injection' },
            { value: 'topical', labelAr: 'موضعي', labelEn: 'Topical' },
          ],
        },
        {
          key: 'frequency',
          labelAr: 'عدد المرات يومياً',
          labelEn: 'Frequency',
          value: a.frequency || 'twice_daily',
          editable: true,
          inputType: 'select',
          options: [
            { value: 'once_daily', labelAr: 'مرة واحدة يومياً (كل 24 ساعة)', labelEn: 'Once daily (q24h)' },
            { value: 'twice_daily', labelAr: 'مرتين يومياً (كل 12 ساعة)', labelEn: 'Twice daily (q12h)' },
            { value: 'thrice_daily', labelAr: '3 مرات يومياً (كل 8 ساعات)', labelEn: '3 times daily (q8h)' },
            { value: 'four_times_daily', labelAr: '4 مرات يومياً (كل 6 ساعات)', labelEn: '4 times daily (q6h)' },
          ],
        },
      ];
    }

    case 'add_prescription': {
      const a = args as AddPrescriptionArgs;
      const first = a.items[0] || {
        medicineName: '',
        prescribedDose: '',
        route: '',
        frequency: '',
        durationDays: null,
        captureMethod: 'manual_entry',
        isOcrUnverified: true,
      };
      return [
        {
          key: 'medicineName',
          labelAr: 'اسم الدواء بالروشتة',
          labelEn: 'Prescribed Medicine',
          value: first.medicineName,
          editable: true,
          inputType: 'text',
          uncertainOrMissing: !first.medicineName,
        },
        {
          key: 'prescribedDose',
          labelAr: 'الجرعة والتركيز (كما بالروشتة)',
          labelEn: 'Prescribed Dose & Strength',
          value: first.prescribedDose,
          editable: true,
          inputType: 'text',
          uncertainOrMissing: !first.prescribedDose,
        },
        {
          key: 'route',
          labelAr: 'طريقة الإعطاء',
          labelEn: 'Administration Route',
          value: first.route,
          editable: true,
          inputType: 'select',
          uncertainOrMissing: !first.route,
          options: [
            { value: '', labelAr: '— غير محدد (اختر للتأكيد) —', labelEn: '— Unspecified (Select) —' },
            { value: 'oral', labelAr: 'أقراص / كبسول فموي', labelEn: 'Oral Tablet/Capsule' },
            { value: 'suspension', labelAr: 'شراب معلق', labelEn: 'Oral Suspension' },
            { value: 'injection', labelAr: 'حقن', labelEn: 'Injection' },
            { value: 'topical', labelAr: 'موضعي', labelEn: 'Topical' },
          ],
        },
        {
          key: 'frequency',
          labelAr: 'تكرار الجرعة اليومي',
          labelEn: 'Daily Frequency',
          value: first.frequency,
          editable: true,
          inputType: 'select',
          uncertainOrMissing: !first.frequency,
          options: [
            { value: '', labelAr: '— غير محدد (اختر للتأكيد) —', labelEn: '— Unspecified (Select) —' },
            { value: 'once_daily', labelAr: 'مرة واحدة يومياً (كل 24 ساعة)', labelEn: 'Once daily (q24h)' },
            { value: 'twice_daily', labelAr: 'مرتين يومياً (كل 12 ساعة)', labelEn: 'Twice daily (q12h)' },
            { value: 'thrice_daily', labelAr: '3 مرات يومياً (كل 8 ساعات)', labelEn: '3 times daily (q8h)' },
            { value: 'four_times_daily', labelAr: '4 مرات يومياً (كل 6 ساعات)', labelEn: '4 times daily (q6h)' },
          ],
        },
        {
          key: 'durationDays',
          labelAr: 'مدة الكورس (بالأيام)',
          labelEn: 'Course Duration (Days)',
          value: first.durationDays !== null && first.durationDays !== undefined ? String(first.durationDays) : '',
          editable: true,
          inputType: 'number',
          uncertainOrMissing: first.durationDays === null || first.durationDays === undefined,
        },
      ];
    }

    case 'create_reminder': {
      const a = args as CreateReminderArgs;
      return [
        {
          key: 'medicineName',
          labelAr: 'اسم الدواء',
          labelEn: 'Medicine Name',
          value: a.medicineName,
          editable: true,
          inputType: 'text',
        },
        {
          key: 'prescribedDose',
          labelAr: 'الجرعة الموصوفة',
          labelEn: 'Prescribed Dose',
          value: a.prescribedDose,
          editable: true,
          inputType: 'text',
          uncertainOrMissing: a.prescribedDose.includes('حسب الوصفة') || a.prescribedDose.includes('Per prescription'),
        },
        {
          key: 'doseTimes',
          labelAr: 'مواعيد التذكير اليومية (HH:mm مفصولة بفاصلة)',
          labelEn: 'Daily Reminder Times (HH:mm comma-separated)',
          value: a.doseTimes.join(', '),
          editable: true,
          inputType: 'text',
        },
        {
          key: 'durationDays',
          labelAr: 'مدة التذكير (بالأيام)',
          labelEn: 'Duration (Days)',
          value: String(a.durationDays),
          editable: true,
          inputType: 'number',
        },
      ];
    }

    case 'update_reminder': {
      const a = args as UpdateReminderArgs;
      return [
        {
          key: 'medicineName',
          labelAr: 'اسم الدواء',
          labelEn: 'Medicine Name',
          value: a.medicineName || '',
          editable: true,
          inputType: 'text',
        },
        {
          key: 'newDoseTimes',
          labelAr: 'المواعيد الجديدة (HH:mm)',
          labelEn: 'New Dose Times (HH:mm)',
          value: (a.newDoseTimes || []).join(', '),
          editable: true,
          inputType: 'text',
        },
      ];
    }

    case 'stop_reminder': {
      const a = args as StopReminderArgs;
      return [
        {
          key: 'medicineName',
          labelAr: 'إيقاف تذكير الدواء',
          labelEn: 'Stop Reminder For Medicine',
          value: a.medicineName || '',
          editable: false,
        },
      ];
    }

    case 'update_prescription_status': {
      const a = args as UpdatePrescriptionStatusArgs;
      return [
        {
          key: 'medicineName',
          labelAr: 'الروشتة / الدواء',
          labelEn: 'Prescription / Medicine',
          value: a.medicineName || a.prescriptionId || 'آخر روشتة محفوظة / Latest Prescription',
          editable: true,
          inputType: 'text',
        },
        {
          key: 'newStatus',
          labelAr: 'الحالة الجديدة',
          labelEn: 'New Status',
          value: a.newStatus,
          editable: true,
          inputType: 'select',
          options: [
            { value: 'verified_by_patient', labelAr: 'موثّقة ومؤكدة من الروشتة الورقية ✅', labelEn: 'Verified by Patient ✅' },
            { value: 'needs_clarification', labelAr: 'تحتاج توضيحاً من الطبيب/الصيدلي 🚨', labelEn: 'Needs Clinician Clarification 🚨' },
          ],
        },
      ];
    }

    case 'save_medical_document': {
      const a = args as SaveMedicalDocumentArgs;
      const rx = a.extractedPrescriptions?.[0];
      const fields: ActionPreviewField[] = [
        {
          key: 'title',
          labelAr: 'عنوان المستند',
          labelEn: 'Document Title',
          value: a.title,
          editable: true,
          inputType: 'text',
        },
        {
          key: 'category',
          labelAr: 'تصنيف المستند',
          labelEn: 'Document Category',
          value: a.category,
          editable: true,
          inputType: 'select',
          options: [
            { value: 'prescription', labelAr: 'روشتة طبية 📋', labelEn: 'Prescription 📋' },
            { value: 'lab_report', labelAr: 'تحليل معملي 🧪', labelEn: 'Laboratory Result 🧪' },
            { value: 'medical_report', labelAr: 'تقرير طبي 📄', labelEn: 'Medical Report 📄' },
            { value: 'leaflet', labelAr: 'نشرة دوائية 💊', labelEn: 'Medication Leaflet 💊' },
            { value: 'other', labelAr: 'مستند صحي آخر 📁', labelEn: 'Other Health Document 📁' },
          ],
        },
      ];
      if (rx) {
        fields.push(
          {
            key: 'medicineName',
            labelAr: 'الدواء المستخرج بالـ OCR',
            labelEn: 'OCR-Extracted Medicine',
            value: rx.medicineName || '',
            editable: true,
            inputType: 'text',
            uncertainOrMissing: !rx.medicineName,
          },
          {
            key: 'prescribedDose',
            labelAr: 'الجرعة والتركيز المستخرج',
            labelEn: 'Extracted Dose / Strength',
            value: rx.prescribedDose || '',
            editable: true,
            inputType: 'text',
            uncertainOrMissing: !rx.prescribedDose,
          },
          {
            key: 'frequency',
            labelAr: 'تكرار الجرعة المستخرج',
            labelEn: 'Extracted Frequency',
            value: rx.frequency || '',
            editable: true,
            inputType: 'select',
            uncertainOrMissing: !rx.frequency,
            options: [
              { value: '', labelAr: '— غير واضح بالصورة (حدد يدوياً) —', labelEn: '— Unclear in Image (Select) —' },
              { value: 'once_daily', labelAr: 'مرة واحدة يومياً', labelEn: 'Once daily' },
              { value: 'twice_daily', labelAr: 'مرتين يومياً', labelEn: 'Twice daily' },
              { value: 'thrice_daily', labelAr: '3 مرات يومياً', labelEn: '3 times daily' },
              { value: 'four_times_daily', labelAr: '4 مرات يومياً', labelEn: '4 times daily' },
            ],
          },
          {
            key: 'durationDays',
            labelAr: 'مدة العلاج بالأيام',
            labelEn: 'Duration (Days)',
            value: rx.durationDays !== null && rx.durationDays !== undefined ? String(rx.durationDays) : '',
            editable: true,
            inputType: 'number',
            uncertainOrMissing: rx.durationDays === null || rx.durationDays === undefined,
          }
        );
      }
      return fields;
    }

    default:
      return [];
  }
}

/**
 * Creates a `PendingAiActionProposal` ready to be rendered as an interactive Confirmation Card.
 */
export function createPendingActionProposal<K extends AiActionType>(params: {
  actionType: K;
  args: AiActionPayloadMap[K];
  profile: UserHealthProfile;
  schedules: TreatmentSchedule[];
  prescriptions: SavedPrescription[];
  previewImageUrl?: string;
  rawFileForUpload?: File;
  base64DataForUpload?: string;
}): PendingAiActionProposal<K> {
  const def = AI_ACTION_REGISTRY[params.actionType];
  const safetyPreview = evaluateActionSafetyPreview(
    params.actionType,
    params.args,
    params.profile,
    params.schedules,
    params.prescriptions
  );
  const fields = buildActionPreviewFields(params.actionType, params.args);
  const nowIso = new Date().toISOString();
  const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const isOcrAction =
    params.actionType === 'save_medical_document' ||
    (params.actionType === 'add_prescription' &&
      (params.args as AddPrescriptionArgs).items?.some((i) => i.captureMethod !== 'manual_entry'));

  return {
    id,
    idempotencyKey: `${params.actionType}:${JSON.stringify(params.args).slice(0, 180)}`,
    actionType: params.actionType,
    titleAr: def.titleAr,
    titleEn: def.titleEn,
    icon: def.icon,
    args: params.args,
    fields,
    safetyPreview,
    sourceLabelAr: isOcrAction
      ? 'استخراج ضوئي (OCR / Vision) — يتطلب مراجعة المريض'
      : 'إدخال بواسطة المريض عبر المساعد الذكي (Patient-Reported)',
    sourceLabelEn: isOcrAction
      ? 'Vision / OCR Extraction — Requires Patient Review'
      : 'Patient-Reported via AI Health Assistant',
    verificationBadgeAr: 'غير موثق سريرياً بعد (في انتظار تأكيدك)',
    verificationBadgeEn: 'Not Clinically Verified (Awaiting Your Confirmation)',
    ...(params.previewImageUrl ? { previewImageUrl: params.previewImageUrl } : {}),
    ...(params.rawFileForUpload ? { rawFileForUpload: params.rawFileForUpload } : {}),
    ...(params.base64DataForUpload ? { base64DataForUpload: params.base64DataForUpload } : {}),
    status: 'pending_confirmation',
    createdAt: nowIso,
  };
}

/**
 * Applies edited field values from the Confirmation Card back onto the proposal's structured arguments
 * and re-runs schema & safety checks.
 */
export function applyEditedFieldsToProposal<K extends AiActionType>(
  proposal: PendingAiActionProposal<K>,
  editedValues: Record<string, string>,
  profile: UserHealthProfile,
  schedules: TreatmentSchedule[],
  prescriptions: SavedPrescription[]
): PendingAiActionProposal<K> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextArgs: any = JSON.parse(JSON.stringify(proposal.args));

  if (proposal.actionType === 'add_prescription') {
    const first = nextArgs.items?.[0] || {};
    if (editedValues.medicineName !== undefined) first.medicineName = editedValues.medicineName;
    if (editedValues.prescribedDose !== undefined) first.prescribedDose = editedValues.prescribedDose;
    if (editedValues.route !== undefined) first.route = editedValues.route;
    if (editedValues.frequency !== undefined) first.frequency = editedValues.frequency;
    if (editedValues.durationDays !== undefined) {
      const n = parseInt(editedValues.durationDays, 10);
      first.durationDays = !isNaN(n) && n >= 1 ? n : null;
    }
    first.unreadableFields = [
      ...(!first.medicineName ? ['medicineName'] : []),
      ...(!first.prescribedDose ? ['prescribedDose'] : []),
      ...(!first.route ? ['route'] : []),
      ...(!first.frequency ? ['frequency'] : []),
      ...(first.durationDays === null ? ['durationDays'] : []),
    ];
    nextArgs.items = [first, ...(nextArgs.items?.slice(1) || [])];
  } else if (proposal.actionType === 'save_medical_document') {
    if (editedValues.title !== undefined) nextArgs.title = editedValues.title;
    if (editedValues.category !== undefined) nextArgs.category = editedValues.category;
    if (Array.isArray(nextArgs.extractedPrescriptions) && nextArgs.extractedPrescriptions[0]) {
      const rx = nextArgs.extractedPrescriptions[0];
      if (editedValues.medicineName !== undefined) rx.medicineName = editedValues.medicineName;
      if (editedValues.prescribedDose !== undefined) rx.prescribedDose = editedValues.prescribedDose;
      if (editedValues.frequency !== undefined) rx.frequency = editedValues.frequency;
      if (editedValues.durationDays !== undefined) {
        const n = parseInt(editedValues.durationDays, 10);
        rx.durationDays = !isNaN(n) && n >= 1 ? n : null;
      }
      rx.unreadableFields = [
        ...(!rx.medicineName ? ['medicineName'] : []),
        ...(!rx.prescribedDose ? ['prescribedDose'] : []),
        ...(!rx.frequency ? ['frequency'] : []),
        ...(rx.durationDays === null ? ['durationDays'] : []),
      ];
      nextArgs.unreadableFields = rx.unreadableFields;
    }
  } else if (proposal.actionType === 'create_reminder') {
    if (editedValues.medicineName !== undefined) nextArgs.medicineName = editedValues.medicineName;
    if (editedValues.prescribedDose !== undefined) nextArgs.prescribedDose = editedValues.prescribedDose;
    if (editedValues.doseTimes !== undefined) {
      nextArgs.doseTimes = editedValues.doseTimes
        .split(/[,\u060C]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    if (editedValues.durationDays !== undefined) {
      const n = parseInt(editedValues.durationDays, 10);
      if (!isNaN(n) && n >= 1) nextArgs.durationDays = n;
    }
  } else if (proposal.actionType === 'update_reminder') {
    if (editedValues.medicineName !== undefined) nextArgs.medicineName = editedValues.medicineName;
    if (editedValues.newDoseTimes !== undefined) {
      nextArgs.newDoseTimes = editedValues.newDoseTimes
        .split(/[,\u060C]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
  } else {
    for (const [k, v] of Object.entries(editedValues)) {
      nextArgs[k] = v;
    }
  }

  const validated = validateActionArguments(proposal.actionType, nextArgs);
  const cleanArgs = (validated.sanitized || nextArgs) as AiActionPayloadMap[K];
  const updatedSafety = evaluateActionSafetyPreview(
    proposal.actionType,
    cleanArgs,
    profile,
    schedules,
    prescriptions
  );
  const updatedFields = buildActionPreviewFields(proposal.actionType, cleanArgs);

  return {
    ...proposal,
    args: cleanArgs,
    fields: updatedFields,
    safetyPreview: updatedSafety,
    idempotencyKey: `${proposal.actionType}:${JSON.stringify(cleanArgs).slice(0, 180)}`,
  };
}

/**
 * Executes a confirmed mutating patient action after verifying authorization,
 * consent, schema validity, and idempotency.
 */
export async function executeConfirmedAiAction<K extends AiActionType>(params: {
  proposal: PendingAiActionProposal<K>;
  authenticatedUid: string | null | undefined;
  requestedTargetUid?: string | null;
  confirmedByPatient: boolean;
  currentProfile?: UserHealthProfile;
  currentSchedules?: TreatmentSchedule[];
  currentPrescriptions?: SavedPrescription[];
  onProfileUpdated?: (next: UserHealthProfile) => void;
  onSchedulesUpdated?: (next: TreatmentSchedule[]) => void;
  onPrescriptionsUpdated?: (next: SavedPrescription[]) => void;
}): Promise<ActionExecutionResult> {
  const { proposal } = params;

  // 1. Authorization & Cross-User Security Verification
  const authCheck = verifyActionAuthorization({
    actionType: proposal.actionType,
    authenticatedUid: params.authenticatedUid,
    requestedTargetUid: params.requestedTargetUid,
    confirmedByPatient: params.confirmedByPatient,
    idempotencyKey: proposal.idempotencyKey,
  });

  if (!authCheck.allowed) {
    return {
      success: false,
      actionType: proposal.actionType,
      messageAr: authCheck.messageAr || 'تم رفض العملية.',
      messageEn: authCheck.messageEn || 'Operation denied.',
      errorCode: authCheck.reasonCode,
    };
  }

  // 2. Strict Schema Validation
  const validation = validateActionArguments(proposal.actionType, proposal.args);
  if (!validation.valid || !validation.sanitized) {
    return {
      success: false,
      actionType: proposal.actionType,
      messageAr: validation.errorsAr.join(' ') || 'بيانات الأمر غير مكتملة.',
      messageEn: validation.errorsEn.join(' ') || 'Invalid action arguments.',
      errorCode: 'schema_validation_failed',
    };
  }

  const uid = authCheck.verifiedUid;
  const profile = params.currentProfile ? { ...params.currentProfile } : loadProfile(uid);
  const schedules = params.currentSchedules ? [...params.currentSchedules] : loadSchedules(uid);
  const prescriptions = params.currentPrescriptions
    ? [...params.currentPrescriptions]
    : loadPrescriptions(uid);
  const nowIso = new Date().toISOString();

  const commitProfileWithAudit = async (
    nextProfile: UserHealthProfile,
    summaryAr: string,
    summaryEn: string,
    beforeSnap?: unknown,
    afterSnap?: unknown
  ) => {
    const auditEntry = await recordPatientAuditLog({
      uid,
      actionType: proposal.actionType,
      actor: 'patient_confirmed_ai_action',
      summaryAr,
      summaryEn,
      beforeSnapshot: beforeSnap,
      afterSnapshot: afterSnap,
    });
    const withAudit: UserHealthProfile = {
      ...nextProfile,
      patientAuditLogs: [auditEntry, ...(nextProfile.patientAuditLogs || [])].slice(0, 150),
    };
    saveProfile(withAudit, uid);
    params.onProfileUpdated?.(withAudit);
    markIdempotencyKeyExecuted(proposal.idempotencyKey);
    return { withAudit, auditEntry };
  };

  switch (proposal.actionType) {
    case 'add_chronic_condition': {
      const a = validation.sanitized as AddChronicConditionArgs;
      const existingList = [...(profile.chronicConditions || [])];
      const dup = existingList.find(
        (c) => c.conditionName.trim().toLowerCase() === a.conditionName.trim().toLowerCase()
      );
      if (dup) {
        return {
          success: false,
          actionType: 'add_chronic_condition',
          messageAr: `ℹ️ الحالة الصحية «${a.conditionName}» مسجلة بالفعل في ملفك الصحي منذ ${dup.createdAt.slice(0, 10)} — تم منع التكرار.`,
          messageEn: `ℹ️ Condition "${a.conditionName}" is already recorded in your Health Profile — duplicate entry prevented.`,
          errorCode: 'duplicate_record',
        };
      }
      const newCond: ChronicConditionRecord = {
        id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conditionName: a.conditionName,
        evidenceStatus: a.evidenceStatus,
        source: a.source,
        ...(a.diagnosedDate ? { diagnosedDate: a.diagnosedDate } : {}),
        ...(a.notes ? { notes: a.notes } : {}),
        createdAt: nowIso,
      };
      const updatedConditions = [newCond, ...existingList];
      const updatedNotes = syncNotesWithChronicConditions(profile.notes || '', updatedConditions);
      const nextProfile: UserHealthProfile = {
        ...profile,
        chronicConditions: updatedConditions,
        notes: updatedNotes,
      };
      const { withAudit, auditEntry } = await commitProfileWithAudit(
        nextProfile,
        `تمت إضافة الحالة الصحية «${a.conditionName}» (أبلغ عنها المريض) إلى الملف الصحي.`,
        `Added patient-reported condition "${a.conditionName}" to Health Profile.`,
        null,
        newCond
      );
      return {
        success: true,
        actionType: 'add_chronic_condition',
        messageAr: `✅ تم حفظ الحالة الصحية «${a.conditionName}» في ملفك الصحي بنجاح (الحالة: أبلغ عنها المريض — غير موثقة سريرياً).`,
        messageEn: `✅ Saved condition "${a.conditionName}" to your Health Profile (Status: Patient-reported, not clinically verified).`,
        updatedProfile: withAudit,
        auditLogId: auditEntry.id,
      };
    }

    case 'add_allergy': {
      const a = validation.sanitized as AddAllergyArgs;
      const dup = profile.allergies.find(
        (existing) =>
          existing.drugName.trim().toLowerCase() === a.drugName.trim().toLowerCase() &&
          existing.allergenKey === a.allergenKey
      );
      if (dup) {
        return {
          success: false,
          actionType: 'add_allergy',
          messageAr: `ℹ️ الحساسية من «${a.drugName}» مسجلة بالفعل في ملفك الصحي — تم منع التكرار.`,
          messageEn: `ℹ️ Allergy to "${a.drugName}" is already recorded in your Health Profile — duplicate prevented.`,
          errorCode: 'duplicate_record',
        };
      }
      const newAllergy: AllergyRecord = {
        id: `all-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        drugName: a.drugName,
        allergenKey: a.allergenKey,
        reportedSymptoms: a.reportedSymptoms,
        severity: a.severity,
        evidenceStatus: a.evidenceStatus,
        source: 'patient_chat',
        ...(a.notes ? { notes: a.notes } : {}),
        createdAt: nowIso,
      };
      const nextProfile: UserHealthProfile = {
        ...profile,
        allergies: [newAllergy, ...profile.allergies],
      };
      const { withAudit, auditEntry } = await commitProfileWithAudit(
        nextProfile,
        `تم تسجيل حساسية دوائية تجاه «${a.drugName}» (${a.severity}) في الملف الصحي.`,
        `Recorded drug allergy to "${a.drugName}" (${a.severity}) in Health Profile.`,
        null,
        newAllergy
      );
      return {
        success: true,
        actionType: 'add_allergy',
        messageAr: `✅ تم تسجيل حساسيتك من «${a.drugName}» في ملفك الصحي بنجاح. سيقوم محرك الأمان الدوائي بتحذيرك تلقائياً من أي مضاد حيوي ينتمي لنفس العائلة أو يسبب حساسية متصالبة.`,
        messageEn: `✅ Saved your "${a.drugName}" allergy to your Health Profile. The Medication Safety Engine will automatically screen future medications against this allergy.`,
        updatedProfile: withAudit,
        auditLogId: auditEntry.id,
      };
    }

    case 'update_vitals': {
      const a = validation.sanitized as UpdateVitalsArgs;
      const beforeVitals = {
        age: profile.age,
        weightKg: profile.weightKg,
        bloodType: profile.bloodType,
        gender: profile.gender,
      };
      const nextProfile: UserHealthProfile = {
        ...profile,
        ...(a.displayName !== undefined ? { displayName: a.displayName } : {}),
        ...(a.age !== undefined ? { age: a.age } : {}),
        ...(a.weightKg !== undefined ? { weightKg: a.weightKg } : {}),
        ...(a.bloodType !== undefined ? { bloodType: a.bloodType } : {}),
        ...(a.gender !== undefined ? { gender: a.gender } : {}),
        ...(a.emergencyContact !== undefined ? { emergencyContact: a.emergencyContact } : {}),
        ...(a.pregnancyStatus !== undefined ? { pregnancyStatus: a.pregnancyStatus } : {}),
        ...(a.renalStatus !== undefined ? { renalStatus: a.renalStatus } : {}),
        ...(a.hepaticStatus !== undefined ? { hepaticStatus: a.hepaticStatus } : {}),
      };
      const changedLabelsAr: string[] = [];
      const changedLabelsEn: string[] = [];
      if (a.weightKg !== undefined) {
        changedLabelsAr.push(`الوزن: ${a.weightKg} كجم`);
        changedLabelsEn.push(`Weight: ${a.weightKg} kg`);
      }
      if (a.age !== undefined) {
        changedLabelsAr.push(`العمر: ${a.age} سنة`);
        changedLabelsEn.push(`Age: ${a.age} yrs`);
      }
      if (a.bloodType !== undefined) {
        changedLabelsAr.push(`فصيلة الدم: ${a.bloodType}`);
        changedLabelsEn.push(`Blood Type: ${a.bloodType}`);
      }
      const { withAudit, auditEntry } = await commitProfileWithAudit(
        nextProfile,
        `تم تحديث البيانات الحيوية في الملف الصحي (${changedLabelsAr.join('، ')}).`,
        `Updated Health Profile vitals (${changedLabelsEn.join(', ')}).`,
        beforeVitals,
        a
      );
      return {
        success: true,
        actionType: 'update_vitals',
        messageAr: `✅ تم تحديث بياناتك في الملف الصحي بنجاح (${changedLabelsAr.join(' · ')}).`,
        messageEn: `✅ Updated your Health Profile successfully (${changedLabelsEn.join(' · ')}).`,
        updatedProfile: withAudit,
        auditLogId: auditEntry.id,
      };
    }

    case 'add_medication': {
      const a = validation.sanitized as AddMedicationArgs;
      const dup = profile.medications.find(
        (m) =>
          m.status === 'active' &&
          m.drugName.trim().toLowerCase() === a.drugName.trim().toLowerCase() &&
          m.prescribedDose.trim().toLowerCase() === a.prescribedDose.trim().toLowerCase()
      );
      if (dup) {
        return {
          success: false,
          actionType: 'add_medication',
          messageAr: `ℹ️ الدواء «${a.drugName}» مسجل بالفعل في قائمة أدويتك الحالية — تم منع التكرار.`,
          messageEn: `ℹ️ Medication "${a.drugName}" is already in your active medications list — duplicate prevented.`,
          errorCode: 'duplicate_record',
        };
      }
      const newMed: MedicationRecord = {
        id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        drugName: a.drugName,
        activeIngredients: a.activeIngredients || '',
        prescribedDose: a.prescribedDose || 'غير محدد / Unspecified',
        route: a.route || 'oral',
        frequency: a.frequency || 'twice_daily',
        startDate: nowIso.split('T')[0],
        status: a.status || 'active',
        evidenceStatus: a.evidenceStatus || 'patient_reported',
        source: a.source || 'patient_chat',
        ...(a.notes ? { notes: a.notes } : {}),
      };
      const nextProfile: UserHealthProfile = {
        ...profile,
        medications: [newMed, ...profile.medications],
      };
      const { withAudit, auditEntry } = await commitProfileWithAudit(
        nextProfile,
        `تمت إضافة الدواء «${a.drugName}» (${newMed.prescribedDose}) إلى قائمة الأدوية الحالية.`,
        `Added medication "${a.drugName}" (${newMed.prescribedDose}) to current medication list.`,
        null,
        newMed
      );
      return {
        success: true,
        actionType: 'add_medication',
        messageAr: `✅ تمت إضافة «${a.drugName}» (${newMed.prescribedDose}) إلى قائمة أدويتك الحالية في الملف الصحي.`,
        messageEn: `✅ Added "${a.drugName}" (${newMed.prescribedDose}) to your active medication list in your Health Profile.`,
        updatedProfile: withAudit,
        auditLogId: auditEntry.id,
      };
    }

    case 'add_prescription': {
      const a = validation.sanitized as AddPrescriptionArgs;
      const addedRxList: SavedPrescription[] = [];
      for (const item of a.items) {
        const valRes = validatePrescriptionInstructions(
          {
            antibioticId: item.antibioticId,
            medicineName: item.medicineName,
            prescribedDose: item.prescribedDose,
            route: item.route,
            frequency: item.frequency,
            durationDays: item.durationDays,
            notes: item.notes,
            coMedications: item.coMedications,
            rawExtractedText: item.rawExtractedText,
            isOcrUnverified: item.isOcrUnverified,
            verifiedByPatient: !item.unreadableFields || item.unreadableFields.length === 0,
          },
          schedules,
          profile.allergies
        );

        const newRx: SavedPrescription = {
          id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ...(item.antibioticId ? { antibioticId: item.antibioticId } : {}),
          medicineName: item.medicineName || 'دواء غير محدد الاسم (يتطلب مراجعة)',
          prescribedDose: item.prescribedDose,
          route: item.route,
          frequency: item.frequency,
          durationDays: item.durationDays,
          ...(item.notes ? { notes: item.notes } : {}),
          ...(item.coMedications ? { coMedications: item.coMedications } : {}),
          captureMethod: item.captureMethod,
          ...(item.rawExtractedText ? { rawExtractedText: item.rawExtractedText } : {}),
          ...(item.imageFileName ? { imageFileName: item.imageFileName } : {}),
          isOcrUnverified: item.isOcrUnverified,
          verificationStatus: valRes.verificationStatus,
          verifiedByPatient: valRes.verificationStatus === 'verified_by_patient',
          ...(valRes.verificationStatus === 'verified_by_patient' ? { verifiedAt: nowIso } : {}),
          clarificationFlags: valRes.flags,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        addedRxList.push(newRx);
      }

      const nextPrescriptions = [...addedRxList, ...prescriptions];
      params.onPrescriptionsUpdated?.(nextPrescriptions);

      const { withAudit, auditEntry } = await commitProfileWithAudit(
        profile,
        `تم حفظ ${addedRxList.length} دواء/روشتة في سجل رادار الروشتة (${addedRxList.map((r) => r.medicineName).join('، ')}).`,
        `Saved ${addedRxList.length} prescription record(s) to Prescription Radar (${addedRxList.map((r) => r.medicineName).join(', ')}).`,
        null,
        addedRxList
      );

      return {
        success: true,
        actionType: 'add_prescription',
        messageAr: `✅ تم حفظ الروشتة (${addedRxList.map((r) => r.medicineName).join('، ')}) في حسابك برادار الروشتة.`,
        messageEn: `✅ Saved prescription (${addedRxList.map((r) => r.medicineName).join(', ')}) to your Prescription Radar account.`,
        updatedProfile: withAudit,
        updatedPrescriptions: nextPrescriptions,
        auditLogId: auditEntry.id,
      };
    }

    case 'update_prescription_status': {
      const a = validation.sanitized as UpdatePrescriptionStatusArgs;
      if (prescriptions.length === 0) {
        return {
          success: false,
          actionType: 'update_prescription_status',
          messageAr: 'لا توجد روشتات محفوظة حالياً في حسابك لتحديث حالتها.',
          messageEn: 'No saved prescriptions found in your account to update.',
          errorCode: 'not_found',
        };
      }
      let matchedRx = prescriptions[0];
      if (a.prescriptionId) {
        const byId = prescriptions.find((p) => p.id === a.prescriptionId);
        if (byId) matchedRx = byId;
      } else if (a.medicineName) {
        const byName = prescriptions.find((p) =>
          p.medicineName.toLowerCase().includes(a.medicineName!.toLowerCase())
        );
        if (byName) matchedRx = byName;
      }

      const nextRxList = prescriptions.map((p) => {
        if (p.id !== matchedRx.id) return p;
        return {
          ...p,
          verificationStatus:
            a.newStatus === 'needs_clarification'
              ? ('needs_clarification' as const)
              : ('verified_by_patient' as const),
          verifiedByPatient: a.newStatus === 'verified_by_patient',
          ...(a.newStatus === 'verified_by_patient' ? { verifiedAt: nowIso } : {}),
          updatedAt: nowIso,
        };
      });

      params.onPrescriptionsUpdated?.(nextRxList);
      const { withAudit, auditEntry } = await commitProfileWithAudit(
        profile,
        `تم تحديث حالة روشتة «${matchedRx.medicineName}» إلى (${a.newStatus}).`,
        `Updated prescription status for "${matchedRx.medicineName}" to (${a.newStatus}).`,
        { status: matchedRx.verificationStatus },
        { status: a.newStatus }
      );

      return {
        success: true,
        actionType: 'update_prescription_status',
        messageAr: `✅ تم تحديث حالة روشتة «${matchedRx.medicineName}» بنجاح.`,
        messageEn: `✅ Updated status for prescription "${matchedRx.medicineName}" successfully.`,
        updatedProfile: withAudit,
        updatedPrescriptions: nextRxList,
        auditLogId: auditEntry.id,
      };
    }

    case 'create_reminder': {
      const a = validation.sanitized as CreateReminderArgs;
      const dupSch = schedules.find(
        (s) =>
          s.medicineName.trim().toLowerCase() === a.medicineName.trim().toLowerCase() &&
          JSON.stringify(s.doseTimes) === JSON.stringify(a.doseTimes)
      );
      if (dupSch) {
        return {
          success: false,
          actionType: 'create_reminder',
          messageAr: `ℹ️ يوجد تذكير نشط بالفعل للدواء «${a.medicineName}» في نفس المواعيد (${a.doseTimes.join('، ')}) — تم منع التكرار.`,
          messageEn: `ℹ️ An active reminder for "${a.medicineName}" at (${a.doseTimes.join(', ')}) already exists — duplicate prevented.`,
          errorCode: 'duplicate_record',
        };
      }

      const scheduleId = `sch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const startDate = a.startDate || formatLocalDateYYYYMMDD();
      const endDate = computeEndDate(startDate, a.durationDays);
      const doses = generateScheduleDoses(scheduleId, startDate, a.doseTimes, a.durationDays);

      const newSchedule: TreatmentSchedule = {
        id: scheduleId,
        medicineName: a.medicineName,
        prescribedDose: a.prescribedDose,
        route: a.route,
        frequency: a.frequency,
        firstDoseTime: a.doseTimes[0] || '08:00',
        doseTimes: a.doseTimes,
        startDate,
        durationDays: a.durationDays,
        endDate,
        ...(a.notes ? { notes: a.notes } : {}),
        captureMethod: 'manual_entry',
        verificationStatus: 'verified_by_patient',
        verifiedAt: nowIso,
        verifiedByPatient: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        doses,
      };

      const nextSchedules = [newSchedule, ...schedules];
      saveSchedules(nextSchedules, uid);
      params.onSchedulesUpdated?.(nextSchedules);

      const notifSupported = typeof window !== 'undefined' && 'Notification' in window;
      const notifGranted = notifSupported && Notification.permission === 'granted';
      const notifNoteAr = notifGranted
        ? 'التنبيهات مفعّلة في المتصفح.'
        : 'ملاحظة: إشعارات النظام تعتمد على صلاحيات المتصفح/الجهاز؛ يمكنك أيضاً تنزيل ملف المنبهات (.ics) من المتابع العلاجي لضمان رنين الهاتف.';
      const notifNoteEn = notifGranted
        ? 'Browser notifications are active.'
        : 'Note: System push notifications depend on browser/device support; you can also export phone alarms (.ics) in the Tracker.';

      const { withAudit, auditEntry } = await commitProfileWithAudit(
        profile,
        `تم إنشاء جدول تذكير للدواء «${a.medicineName}» في المواعيد (${a.doseTimes.join('، ')}) لمدة ${a.durationDays} أيام.`,
        `Created medication reminder schedule for "${a.medicineName}" at (${a.doseTimes.join(', ')}) for ${a.durationDays} days.`,
        null,
        { scheduleId, medicineName: a.medicineName, doseTimes: a.doseTimes }
      );

      return {
        success: true,
        actionType: 'create_reminder',
        messageAr: `✅ تم إنشاء تذكير الدواء «${a.medicineName}» في المواعيد (${a.doseTimes
          .map((t) => formatTime12Hour(t, true))
          .join(' و ')}) لمدة ${a.durationDays} أيام. ${notifNoteAr}`,
        messageEn: `✅ Created dose reminder for "${a.medicineName}" at (${a.doseTimes
          .map((t) => formatTime12Hour(t, false))
          .join(' & ')}) for ${a.durationDays} days. ${notifNoteEn}`,
        updatedProfile: withAudit,
        updatedSchedules: nextSchedules,
        auditLogId: auditEntry.id,
      };
    }

    case 'update_reminder': {
      const a = validation.sanitized as UpdateReminderArgs;
      const target = schedules.find(
        (s) =>
          (a.scheduleId && s.id === a.scheduleId) ||
          (a.medicineName && s.medicineName.toLowerCase().includes(a.medicineName.toLowerCase()))
      );
      if (!target) {
        return {
          success: false,
          actionType: 'update_reminder',
          messageAr: `لم يتم العثور على جدول تذكير نشط للدواء «${a.medicineName || ''}».`,
          messageEn: `No active reminder schedule found for "${a.medicineName || ''}".`,
          errorCode: 'not_found',
        };
      }

      const nextTimes =
        a.newDoseTimes && a.newDoseTimes.length > 0
          ? a.newDoseTimes
          : a.newFrequency
            ? calculateAutoDoseTimes(target.firstDoseTime || '08:00', a.newFrequency)
            : target.doseTimes;
      const nextDuration = a.newDurationDays || target.durationDays;
      const nextEndDate = computeEndDate(target.startDate, nextDuration);
      const nextDoses = generateScheduleDoses(
        target.id,
        target.startDate,
        nextTimes,
        nextDuration,
        target.doses
      );

      const updatedSchedule: TreatmentSchedule = {
        ...target,
        doseTimes: nextTimes,
        firstDoseTime: nextTimes[0] || target.firstDoseTime,
        durationDays: nextDuration,
        endDate: nextEndDate,
        updatedAt: nowIso,
        doses: nextDoses,
      };

      const nextSchedules = schedules.map((s) => (s.id === target.id ? updatedSchedule : s));
      saveSchedules(nextSchedules, uid);
      params.onSchedulesUpdated?.(nextSchedules);

      const { withAudit, auditEntry } = await commitProfileWithAudit(
        profile,
        `تم تعديل مواعيد تذكير الدواء «${target.medicineName}» إلى (${nextTimes.join('، ')}).`,
        `Modified reminder schedule for "${target.medicineName}" to (${nextTimes.join(', ')}).`,
        { doseTimes: target.doseTimes },
        { doseTimes: nextTimes }
      );

      return {
        success: true,
        actionType: 'update_reminder',
        messageAr: `✅ تم تعديل تذكير «${target.medicineName}» بنجاح لتصبح المواعيد (${nextTimes
          .map((t) => formatTime12Hour(t, true))
          .join(' و ')}).`,
        messageEn: `✅ Updated reminder for "${target.medicineName}" to (${nextTimes
          .map((t) => formatTime12Hour(t, false))
          .join(' & ')}).`,
        updatedProfile: withAudit,
        updatedSchedules: nextSchedules,
        auditLogId: auditEntry.id,
      };
    }

    case 'stop_reminder': {
      const a = validation.sanitized as StopReminderArgs;
      const target = schedules.find(
        (s) =>
          (a.scheduleId && s.id === a.scheduleId) ||
          (a.medicineName && s.medicineName.toLowerCase().includes(a.medicineName.toLowerCase()))
      );
      if (!target) {
        return {
          success: false,
          actionType: 'stop_reminder',
          messageAr: `لا يوجد تذكير نشط حالياً للدواء «${a.medicineName || ''}».`,
          messageEn: `No active reminder found for "${a.medicineName || ''}".`,
          errorCode: 'not_found',
        };
      }

      const nextSchedules = schedules.filter((s) => s.id !== target.id);
      saveSchedules(nextSchedules, uid);
      params.onSchedulesUpdated?.(nextSchedules);

      const { withAudit, auditEntry } = await commitProfileWithAudit(
        profile,
        `تم إيقاف وحذف جدول التذكير للدواء «${target.medicineName}».`,
        `Stopped and removed reminder schedule for "${target.medicineName}".`,
        { scheduleId: target.id, medicineName: target.medicineName },
        null
      );

      return {
        success: true,
        actionType: 'stop_reminder',
        messageAr: `✅ تم إيقاف تذكير الدواء «${target.medicineName}» بنجاح.`,
        messageEn: `✅ Stopped medication reminder for "${target.medicineName}".`,
        updatedProfile: withAudit,
        updatedSchedules: nextSchedules,
        auditLogId: auditEntry.id,
      };
    }

    case 'save_medical_document': {
      const a = validation.sanitized as SaveMedicalDocumentArgs;
      const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const uploadOutcome = await uploadMedicalDocumentToStorage({
        uid,
        docId,
        fileName: a.fileName,
        mimeType: a.mimeType,
        base64Data: proposal.base64DataForUpload,
        rawFile: proposal.rawFileForUpload,
      });

      const rxList = a.extractedPrescriptions || [];
      let linkedRxId: string | undefined;
      let nextPrescriptions = [...prescriptions];

      if (a.category === 'prescription' && rxList.length > 0 && a.saveExtractedPrescriptions !== false) {
        for (const item of rxList) {
          if (!item.medicineName) continue;
          const valRes = validatePrescriptionInstructions(
            {
              antibioticId: item.antibioticId,
              medicineName: item.medicineName,
              prescribedDose: item.prescribedDose,
              route: item.route,
              frequency: item.frequency,
              durationDays: item.durationDays,
              notes: item.notes,
              isOcrUnverified: true,
              verifiedByPatient: !item.unreadableFields || item.unreadableFields.length === 0,
            },
            schedules,
            profile.allergies
          );
          const rxRecord: SavedPrescription = {
            id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ...(item.antibioticId ? { antibioticId: item.antibioticId } : {}),
            medicineName: item.medicineName,
            prescribedDose: item.prescribedDose,
            route: item.route,
            frequency: item.frequency,
            durationDays: item.durationDays,
            ...(item.notes ? { notes: item.notes } : {}),
            captureMethod: 'ocr_upload',
            imageFileName: a.fileName,
            isOcrUnverified: valRes.verificationStatus !== 'verified_by_patient',
            verificationStatus: valRes.verificationStatus,
            verifiedByPatient: valRes.verificationStatus === 'verified_by_patient',
            clarificationFlags: valRes.flags,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          if (!linkedRxId) linkedRxId = rxRecord.id;
          nextPrescriptions = [rxRecord, ...nextPrescriptions];
        }
        params.onPrescriptionsUpdated?.(nextPrescriptions);
      }

      const newDoc: MedicalDocumentRecord = {
        id: docId,
        title: a.title,
        category: a.category,
        fileName: a.fileName,
        mimeType: a.mimeType,
        fileSize: a.fileSize,
        ...(uploadOutcome.storagePath ? { storagePath: uploadOutcome.storagePath } : {}),
        ...(uploadOutcome.downloadUrl ? { downloadUrl: uploadOutcome.downloadUrl } : {}),
        ...(a.previewDataUrl ? { previewDataUrl: a.previewDataUrl } : {}),
        extractedSummary: a.extractedSummary,
        extractedFields: a.extractedFields,
        unreadableFields: a.unreadableFields,
        ...(linkedRxId ? { linkedPrescriptionId: linkedRxId } : {}),
        verificationStatus:
          a.unreadableFields.length > 0 ? 'needs_clarification' : 'patient_confirmed',
        source: 'patient_upload',
        createdAt: nowIso,
      };

      const nextProfile: UserHealthProfile = {
        ...profile,
        medicalDocuments: [newDoc, ...(profile.medicalDocuments || [])],
      };

      const { withAudit, auditEntry } = await commitProfileWithAudit(
        nextProfile,
        `تم حفظ المستند الطبي «${a.title}» (${a.category}) في حساب المريض.`,
        `Saved medical document "${a.title}" (${a.category}) to patient account.`,
        null,
        { id: newDoc.id, title: newDoc.title, category: newDoc.category, uploadedToCloud: uploadOutcome.uploadedToCloud }
      );

      const storageNoteAr = uploadOutcome.uploadedToCloud
        ? 'تم رفع الملف الأصلي بأمان إلى Firebase Storage.'
        : uploadOutcome.errorAr || '';
      const storageNoteEn = uploadOutcome.uploadedToCloud
        ? 'Original file securely uploaded to Firebase Storage.'
        : uploadOutcome.errorEn || '';

      return {
        success: true,
        actionType: 'save_medical_document',
        messageAr: `✅ تم حفظ المستند الطبي «${a.title}» في ملفك الصحي${
          linkedRxId ? ' وربطه برادار الروشتة' : ''
        }. ${storageNoteAr}`,
        messageEn: `✅ Saved medical document "${a.title}" to your Health Profile${
          linkedRxId ? ' and linked it to Prescription Radar' : ''
        }. ${storageNoteEn}`,
        updatedProfile: withAudit,
        updatedPrescriptions: nextPrescriptions,
        auditLogId: auditEntry.id,
      };
    }

    default:
      return {
        success: false,
        actionType: proposal.actionType,
        messageAr: 'نوع العملية غير مدعوم كعملية حفظ.',
        messageEn: 'Unsupported write action type.',
      };
  }
}

/**
 * Executes a read-only query against the authenticated patient's own health profile,
 * prescriptions, reminders, and medical documents.
 */
export function executeReadOnlyAiAction(params: {
  actionType: AiActionType;
  authenticatedUid: string | null | undefined;
  requestedTargetUid?: string | null;
  profile: UserHealthProfile;
  schedules: TreatmentSchedule[];
  prescriptions: SavedPrescription[];
  lang: Lang;
}): ActionExecutionResult {
  const authCheck = verifyActionAuthorization({
    actionType: params.actionType,
    authenticatedUid: params.authenticatedUid,
    requestedTargetUid: params.requestedTargetUid,
    confirmedByPatient: true,
  });

  if (!authCheck.allowed) {
    return {
      success: false,
      actionType: params.actionType,
      messageAr: authCheck.messageAr || 'تم رفض الوصول.',
      messageEn: authCheck.messageEn || 'Access denied.',
      errorCode: authCheck.reasonCode,
    };
  }

  const { profile, schedules, prescriptions } = params;

  switch (params.actionType) {
    case 'show_allergies': {
      if (profile.allergies.length === 0) {
        return {
          success: true,
          actionType: 'show_allergies',
          messageAr:
            '🛡️ لا توجد حساسيات دوائية مسجلة حالياً في ملفك الصحي.\n\nيمكنك قول مثلاً: «أضف حساسية البنسلين» لتسجيلها فوراً.',
          messageEn:
            '🛡️ You currently have no drug allergies documented in your Health Profile.\n\nYou can say, for example: "Add my penicillin allergy" to record one.',
        };
      }
      const linesAr = profile.allergies.map(
        (a, i) =>
          `${i + 1}. ${a.drugName}: الخطورة (${a.severity}) — الأعراض: ${
            a.reportedSymptoms || 'غير محددة'
          } — التوثيق: ${
            a.evidenceStatus === 'clinically_verified' ? 'مؤكدة طبياً ✅' : 'أبلغ عنها المريض'
          }`
      );
      const linesEn = profile.allergies.map(
        (a, i) =>
          `${i + 1}. ${a.drugName}: Severity (${a.severity}) — Symptoms: ${
            a.reportedSymptoms || 'Unspecified'
          } — Status: ${
            a.evidenceStatus === 'clinically_verified' ? 'Clinically Verified ✅' : 'Patient-Reported'
          }`
      );
      return {
        success: true,
        actionType: 'show_allergies',
        messageAr: `🚨 سجل الحساسية الدوائية في ملفك الصحي (${profile.allergies.length}):\n\n${linesAr.join('\n')}`,
        messageEn: `🚨 Your Documented Drug Allergies (${profile.allergies.length}):\n\n${linesEn.join('\n')}`,
      };
    }

    case 'show_medications': {
      const activeMeds = profile.medications.filter((m) => m.status === 'active');
      if (activeMeds.length === 0 && schedules.length === 0) {
        return {
          success: true,
          actionType: 'show_medications',
          messageAr:
            '💊 لا توجد أدوية نشطة مسجلة حالياً في ملفك الصحي أو متابع الجرعات.\n\nيمكنك إضافة دواء بقول: «أضف أوجمنتين 1 جرام لقائمة أدويتي» أو رفع صورة الروشتة عبر زر 📎.',
          messageEn:
            '💊 You have no active medications recorded in your Health Profile or Dose Tracker.\n\nYou can add one by saying "Add Augmentin 1g to my medication list" or by uploading a prescription image via 📎.',
        };
      }
      const linesAr: string[] = [];
      const linesEn: string[] = [];
      activeMeds.forEach((m, i) => {
        linesAr.push(
          `${i + 1}. ${m.drugName}: الجرعة (${m.prescribedDose || 'غير محددة'}) — ${formatFrequencyLabel(
            m.frequency,
            true
          )} — المصدر: ${m.evidenceStatus === 'clinically_verified' ? 'موثق طبياً' : 'أبلغ عنه المريض'}`
        );
        linesEn.push(
          `${i + 1}. ${m.drugName}: Dose (${m.prescribedDose || 'Unspecified'}) — ${formatFrequencyLabel(
            m.frequency,
            false
          )} — Source: ${m.evidenceStatus === 'clinically_verified' ? 'Clinically Verified' : 'Patient-Reported'}`
        );
      });
      schedules.forEach((s) => {
        linesAr.push(
          `• جدول نشط: ${s.medicineName} (${s.prescribedDose}) — مواعيد الجرعات: ${s.doseTimes
            .map((t) => formatTime12Hour(t, true))
            .join(' و ')}`
        );
        linesEn.push(
          `• Active Schedule: ${s.medicineName} (${s.prescribedDose}) — Dose times: ${s.doseTimes
            .map((t) => formatTime12Hour(t, false))
            .join(' & ')}`
        );
      });
      return {
        success: true,
        actionType: 'show_medications',
        messageAr: `💊 قائمة أدويتك الحالية المسجلة بحسابك:\n\n${linesAr.join('\n')}`,
        messageEn: `💊 Your Current Recorded Medications:\n\n${linesEn.join('\n')}`,
      };
    }

    case 'show_reminders': {
      if (schedules.length === 0) {
        return {
          success: true,
          actionType: 'show_reminders',
          messageAr:
            '⏰ لا توجد تذكيرات أدوية مفعّلة حالياً في حسابك.\n\nيمكنك إنشاء تذكير بقول: «فكرني آخد أوجمنتين الساعة 8 صباحاً و 8 مساءً».',
          messageEn:
            '⏰ You have no active medication reminders.\n\nYou can create one by saying: "Remind me to take Augmentin at 8 AM and 8 PM".',
        };
      }
      const linesAr = schedules.map(
        (s, i) =>
          `${i + 1}. ${s.medicineName} (${s.prescribedDose}): المواعيد اليومية (${s.doseTimes
            .map((t) => formatTime12Hour(t, true))
            .join('، ')}) — المدة: ${s.durationDays} أيام (من ${s.startDate} إلى ${s.endDate})`
      );
      const linesEn = schedules.map(
        (s, i) =>
          `${i + 1}. ${s.medicineName} (${s.prescribedDose}): Daily at (${s.doseTimes
            .map((t) => formatTime12Hour(t, false))
            .join(', ')}) — Duration: ${s.durationDays} days (${s.startDate} to ${s.endDate})`
      );
      return {
        success: true,
        actionType: 'show_reminders',
        messageAr: `⏰ تذكيرات وجداول الجرعات المفعّلة في حسابك (${schedules.length}):\n\n${linesAr.join('\n')}`,
        messageEn: `⏰ Your Active Medication Reminders (${schedules.length}):\n\n${linesEn.join('\n')}`,
      };
    }

    case 'show_prescriptions': {
      if (prescriptions.length === 0) {
        return {
          success: true,
          actionType: 'show_prescriptions',
          messageAr:
            '📋 لا توجد روشتات محفوظة حالياً في حسابك. يمكنك رفع صورة روشتتك عبر زر 📎 لتحليلها وحفظها.',
          messageEn:
            '📋 You have no saved prescriptions yet. You can attach a prescription image using the 📎 button to analyze and save it.',
        };
      }
      const linesAr = prescriptions.slice(0, 5).map(
        (rx, i) =>
          `${i + 1}. ${rx.medicineName}: ${rx.prescribedDose || 'بدون جرعة محددة'} · ${formatRouteLabel(
            rx.route,
            true
          )} · ${formatFrequencyLabel(rx.frequency, true)} (${
            rx.verificationStatus === 'verified_by_patient'
              ? 'موثقة ✅'
              : rx.verificationStatus === 'needs_clarification'
                ? 'تحتاج توضيحاً 🚨'
                : 'غير موثقة ⚠️'
          })`
      );
      const linesEn = prescriptions.slice(0, 5).map(
        (rx, i) =>
          `${i + 1}. ${rx.medicineName}: ${rx.prescribedDose || 'Dose unspecified'} · ${formatRouteLabel(
            rx.route,
            false
          )} · ${formatFrequencyLabel(rx.frequency, false)} (${
            rx.verificationStatus === 'verified_by_patient'
              ? 'Verified ✅'
              : rx.verificationStatus === 'needs_clarification'
                ? 'Needs Clarification 🚨'
                : 'Unverified OCR ⚠️'
          })`
      );
      return {
        success: true,
        actionType: 'show_prescriptions',
        messageAr: `📋 الروشتات المحفوظة في حسابك (${prescriptions.length}):\n\n${linesAr.join('\n')}`,
        messageEn: `📋 Your Saved Prescriptions (${prescriptions.length}):\n\n${linesEn.join('\n')}`,
      };
    }

    case 'show_medical_documents': {
      const docs = profile.medicalDocuments || [];
      if (docs.length === 0) {
        return {
          success: true,
          actionType: 'show_medical_documents',
          messageAr:
            '📂 لا توجد تقارير طبية أو نتائج تحاليل مرفوعة في حسابك بعد. اضغط على زر 📎 لرفع صورة تقرير أو تحليل أو روشتة.',
          messageEn:
            '📂 No medical reports or lab results uploaded to your account yet. Use the 📎 button to upload a report, lab result, or prescription.',
        };
      }
      const linesAr = docs.slice(0, 5).map(
        (d, i) =>
          `${i + 1}. ${d.title} (${d.createdAt.slice(0, 10)}): ${d.extractedSummary || 'مستند محفوظ'}`
      );
      const linesEn = docs.slice(0, 5).map(
        (d, i) =>
          `${i + 1}. ${d.title} (${d.createdAt.slice(0, 10)}): ${d.extractedSummary || 'Saved document'}`
      );
      return {
        success: true,
        actionType: 'show_medical_documents',
        messageAr: `📂 أحدث المستندات والتقارير الطبية في حسابك (${docs.length}):\n\n${linesAr.join('\n')}`,
        messageEn: `📂 Your Latest Medical Documents & Reports (${docs.length}):\n\n${linesEn.join('\n')}`,
      };
    }

    case 'summarize_health_records':
    default: {
      const chronics = (profile.chronicConditions || []).map((c) => c.conditionName);
      const activeMeds = profile.medications.filter((m) => m.status === 'active');
      const docsCount = (profile.medicalDocuments || []).length;

      const summaryAr = [
        `📊 ملخص ملفك الصحي وسجلاتك المحفوظة:`,
        `• البيانات الأساسية: الاسم (${profile.displayName || 'غير مسجل'}) · العمر (${profile.age || '—'}) · الوزن (${
          profile.weightKg ? `${profile.weightKg} كجم` : '—'
        }) · فصيلة الدم (${profile.bloodType || '—'})`,
        `• الحالات الصحية المزمنة (${chronics.length}): ${
          chronics.length > 0 ? chronics.join('، ') + ' (أبلغ عنها المريض)' : 'لا يوجد'
        }`,
        `• الحساسية الدوائية المسجلة (${profile.allergies.length}): ${
          profile.allergies.length > 0
            ? profile.allergies.map((a) => `${a.drugName} [${a.severity}]`).join('، ')
            : 'لا توجد حساسية مسجلة'
        }`,
        `• الأدوية الحالية بالملف (${activeMeds.length}): ${
          activeMeds.length > 0
            ? activeMeds.map((m) => `${m.drugName} (${m.prescribedDose})`).join('، ')
            : 'لا يوجد'
        }`,
        `• الروشتات المحفوظة (${prescriptions.length}) وجداول التذكير النشطة (${schedules.length}) والمستندات المرفوعة (${docsCount}).`,
      ].join('\n');

      const summaryEn = [
        `📊 Your Complete Health Profile Summary:`,
        `• Vitals & Identity: Name (${profile.displayName || 'Not set'}) · Age (${profile.age || '—'}) · Weight (${
          profile.weightKg ? `${profile.weightKg} kg` : '—'
        }) · Blood Type (${profile.bloodType || '—'})`,
        `• Chronic Conditions (${chronics.length}): ${
          chronics.length > 0 ? chronics.join(', ') + ' (Patient-reported)' : 'None recorded'
        }`,
        `• Documented Allergies (${profile.allergies.length}): ${
          profile.allergies.length > 0
            ? profile.allergies.map((a) => `${a.drugName} [${a.severity}]`).join(', ')
            : 'None documented'
        }`,
        `• Active Profile Medications (${activeMeds.length}): ${
          activeMeds.length > 0
            ? activeMeds.map((m) => `${m.drugName} (${m.prescribedDose})`).join(', ')
            : 'None'
        }`,
        `• Saved Prescriptions (${prescriptions.length}), Active Reminders (${schedules.length}), Uploaded Documents (${docsCount}).`,
      ].join('\n');

      return {
        success: true,
        actionType: 'summarize_health_records',
        messageAr: summaryAr,
        messageEn: summaryEn,
      };
    }
  }
}
