/**
 * aiActionSchemas.ts
 *
 * Strict TypeScript & runtime validation schemas for the Antibiotic Awareness
 * Personal Health Assistant Action Engine.
 *
 * Every action tool call produced by NLU or Gemini is validated against these
 * schemas before constructing a confirmation card or executing any state change.
 * The AI can never write arbitrary keys or invent missing clinical instructions.
 */

import {
  AllergySeverity,
  EvidenceStatus,
  MedicalDocumentCategory,
  OrganFunctionStatus,
  PregnancyLactationStatus,
} from './allergyData';
import { PrescriptionCaptureMethod } from './trackerData';

export type AiActionType =
  | 'add_chronic_condition'
  | 'remove_chronic_condition'
  | 'add_allergy'
  | 'remove_allergy'
  | 'update_vitals'
  | 'add_medication'
  | 'remove_medication'
  | 'add_prescription'
  | 'update_prescription_status'
  | 'create_reminder'
  | 'update_reminder'
  | 'stop_reminder'
  | 'save_medical_document'
  | 'show_allergies'
  | 'show_medications'
  | 'show_reminders'
  | 'show_prescriptions'
  | 'show_medical_documents'
  | 'summarize_health_records';

export type AiActionRiskLevel = 'read_only' | 'confirmation_required';

export interface AddChronicConditionArgs {
  conditionName: string;
  evidenceStatus: EvidenceStatus;
  source: 'patient_chat' | 'manual_entry' | 'medical_document' | 'clinician_verified';
  diagnosedDate?: string;
  notes?: string;
}

export interface RemoveChronicConditionArgs {
  conditionName: string;
}

export interface AddAllergyArgs {
  drugName: string;
  allergenKey: string;
  reportedSymptoms: string;
  severity: AllergySeverity;
  evidenceStatus: EvidenceStatus;
  notes?: string;
}

export interface RemoveAllergyArgs {
  drugName: string;
}

export interface UpdateVitalsArgs {
  displayName?: string;
  age?: string;
  weightKg?: string;
  gender?: 'male' | 'female' | '';
  bloodType?: string;
  emergencyContact?: string;
  pregnancyStatus?: PregnancyLactationStatus;
  renalStatus?: OrganFunctionStatus;
  hepaticStatus?: OrganFunctionStatus;
}

export interface AddMedicationArgs {
  drugName: string;
  activeIngredients?: string;
  prescribedDose: string;
  route: 'oral' | 'suspension' | 'injection' | 'topical' | '';
  frequency: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily' | '';
  durationDays?: number | null;
  status: 'active' | 'completed' | 'discontinued';
  evidenceStatus: EvidenceStatus;
  source: 'patient_chat' | 'manual_entry' | 'prescription_ocr' | 'clinician_verified';
  notes?: string;
}

export interface RemoveMedicationArgs {
  drugName: string;
  mode?: 'delete' | 'discontinue';
}

export interface AddPrescriptionItemArgs {
  antibioticId?: string;
  medicineName: string;
  prescribedDose: string;
  route: 'oral' | 'suspension' | 'injection' | 'topical' | '';
  frequency: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily' | '';
  durationDays: number | null;
  firstDoseTime?: string;
  doseTimes?: string[];
  notes?: string;
  coMedications?: string[];
  captureMethod: PrescriptionCaptureMethod;
  isOcrUnverified: boolean;
  rawExtractedText?: string;
  imageFileName?: string;
  unreadableFields?: string[];
  createScheduleAlso?: boolean;
}

export interface AddPrescriptionArgs {
  items: AddPrescriptionItemArgs[];
  linkedDocumentId?: string;
}

export interface UpdatePrescriptionStatusArgs {
  prescriptionId?: string;
  medicineName?: string;
  newStatus: 'verified_by_patient' | 'needs_clarification' | 'completed' | 'discontinued';
  notes?: string;
}

export interface CreateReminderArgs {
  medicineName: string;
  prescribedDose: string;
  route: 'oral' | 'suspension' | 'injection' | 'topical';
  frequency: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily';
  doseTimes: string[]; // HH:mm 24-hour strings
  durationDays: number;
  startDate: string; // YYYY-MM-DD
  notes?: string;
}

export interface UpdateReminderArgs {
  scheduleId?: string;
  medicineName?: string;
  newDoseTimes?: string[];
  newFrequency?: 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily';
  newDurationDays?: number;
  notes?: string;
}

export interface StopReminderArgs {
  scheduleId?: string;
  medicineName?: string;
  reason?: string;
}

export interface SaveMedicalDocumentArgs {
  title: string;
  category: MedicalDocumentCategory;
  fileName: string;
  mimeType: string;
  fileSize: number;
  previewDataUrl?: string;
  storagePath?: string;
  downloadUrl?: string;
  extractedSummary: string;
  extractedFields: Record<string, string>;
  unreadableFields: string[];
  extractedPrescriptions?: AddPrescriptionItemArgs[];
  saveExtractedPrescriptions?: boolean;
}

export interface ReadQueryArgs {
  filterText?: string;
  limit?: number;
}

export type AiActionPayloadMap = {
  add_chronic_condition: AddChronicConditionArgs;
  remove_chronic_condition: RemoveChronicConditionArgs;
  add_allergy: AddAllergyArgs;
  remove_allergy: RemoveAllergyArgs;
  update_vitals: UpdateVitalsArgs;
  add_medication: AddMedicationArgs;
  remove_medication: RemoveMedicationArgs;
  add_prescription: AddPrescriptionArgs;
  update_prescription_status: UpdatePrescriptionStatusArgs;
  create_reminder: CreateReminderArgs;
  update_reminder: UpdateReminderArgs;
  stop_reminder: StopReminderArgs;
  save_medical_document: SaveMedicalDocumentArgs;
  show_allergies: ReadQueryArgs;
  show_medications: ReadQueryArgs;
  show_reminders: ReadQueryArgs;
  show_prescriptions: ReadQueryArgs;
  show_medical_documents: ReadQueryArgs;
  summarize_health_records: ReadQueryArgs;
};

export interface SchemaValidationResult<T> {
  valid: boolean;
  sanitized?: T;
  errorsAr: string[];
  errorsEn: string[];
  missingFields: string[];
}

const MAX_TEXT_LEN = 300;
const VALID_ROUTES = new Set(['oral', 'suspension', 'injection', 'topical', '']);
const VALID_FREQS = new Set([
  'once_daily',
  'twice_daily',
  'thrice_daily',
  'four_times_daily',
  '',
]);
const VALID_SEVERITIES = new Set(['mild', 'moderate', 'severe', 'life_threatening']);
const VALID_EVIDENCE = new Set(['patient_reported', 'suspected', 'clinically_verified']);
const VALID_DOC_CATEGORIES = new Set([
  'prescription',
  'lab_report',
  'medical_report',
  'leaflet',
  'other',
]);

export function sanitizeText(input: unknown, maxLen = MAX_TEXT_LEN): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function normalizeHHMM(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const match24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  const matchAmPm = s.match(
    /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|ص|صباحا|صباحاً|الصبح|م|مساء|مساءً|بالليل|ليلا|ليلاً|ظهرا|ظهراً|عصرا|عصراً)$/i
  );
  if (matchAmPm) {
    let h = parseInt(matchAmPm[1], 10);
    const m = matchAmPm[2] ? parseInt(matchAmPm[2], 10) : 0;
    const period = matchAmPm[3].toLowerCase();
    const isPm =
      period === 'pm' ||
      period.startsWith('م') ||
      period.includes('ليل') ||
      period.includes('عصر') ||
      period.includes('ظهر');
    const isAm = period === 'am' || period.startsWith('ص') || period.includes('صبح');
    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
      if (isPm && h < 12) h += 12;
      if (isAm && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  return null;
}

export function validateActionArguments<K extends AiActionType>(
  actionType: K,
  rawArgs: unknown
): SchemaValidationResult<AiActionPayloadMap[K]> {
  const errorsAr: string[] = [];
  const errorsEn: string[] = [];
  const missingFields: string[] = [];

  if (!rawArgs || typeof rawArgs !== 'object' || Array.isArray(rawArgs)) {
    return {
      valid: false,
      errorsAr: ['معلش، بيانات الطلب مش واضحة أو ناقصة.'],
      errorsEn: ['Action arguments must be a valid object.'],
      missingFields: ['arguments'],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = rawArgs as Record<string, any>;

  switch (actionType) {
    case 'add_chronic_condition': {
      const conditionName = sanitizeText(a.conditionName, 120);
      if (!conditionName) {
        missingFields.push('conditionName');
        errorsAr.push('قولي اسم المرض المزمن أو الحالة الصحية اللي عايز تضيفها.');
        errorsEn.push('Please specify the medical condition name to add.');
      }
      const evidenceStatus: EvidenceStatus = VALID_EVIDENCE.has(a.evidenceStatus)
        ? a.evidenceStatus
        : 'patient_reported';
      const source = ['patient_chat', 'manual_entry', 'medical_document', 'clinician_verified'].includes(
        a.source
      )
        ? a.source
        : 'patient_chat';
      const sanitized: AddChronicConditionArgs = {
        conditionName,
        evidenceStatus,
        source,
        ...(a.diagnosedDate ? { diagnosedDate: sanitizeText(a.diagnosedDate, 30) } : {}),
        ...(a.notes ? { notes: sanitizeText(a.notes, 200) } : {}),
      };
      return {
        valid: errorsAr.length === 0,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'remove_chronic_condition': {
      const conditionName = sanitizeText(a.conditionName, 120);
      if (!conditionName) {
        missingFields.push('conditionName');
        errorsAr.push('إيه اسم الحالة الصحية اللي عايز تشيلها من ملفك؟');
        errorsEn.push('Please specify the condition name to remove.');
      }
      const sanitized: RemoveChronicConditionArgs = { conditionName };
      return {
        valid: errorsAr.length === 0,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'add_allergy': {
      const drugName = sanitizeText(a.drugName, 120);
      if (!drugName) {
        missingFields.push('drugName');
        errorsAr.push('قولي اسم الدوا أو المادة اللي بتعملك حساسية.');
        errorsEn.push('Please specify the allergenic drug or substance name.');
      }
      const allergenKey = sanitizeText(a.allergenKey, 50) || 'other';
      const reportedSymptoms =
        sanitizeText(a.reportedSymptoms, 200) ||
        'تفاعل تحسسي بلّغ عنه المريض / Patient-reported reaction';
      const severity: AllergySeverity = VALID_SEVERITIES.has(a.severity)
        ? a.severity
        : 'severe';
      const evidenceStatus: EvidenceStatus = VALID_EVIDENCE.has(a.evidenceStatus)
        ? a.evidenceStatus
        : 'patient_reported';
      const sanitized: AddAllergyArgs = {
        drugName,
        allergenKey,
        reportedSymptoms,
        severity,
        evidenceStatus,
        ...(a.notes ? { notes: sanitizeText(a.notes, 200) } : {}),
      };
      return {
        valid: errorsAr.length === 0,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'remove_allergy': {
      const drugName = sanitizeText(a.drugName, 120);
      if (!drugName) {
        missingFields.push('drugName');
        errorsAr.push('قولي اسم الدوا اللي عايز تمسح حساسيته من ملفك.');
        errorsEn.push('Please specify the allergy drug name to remove.');
      }
      const sanitized: RemoveAllergyArgs = { drugName };
      return {
        valid: errorsAr.length === 0,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'update_vitals': {
      const sanitized: UpdateVitalsArgs = {};
      if (a.displayName !== undefined && String(a.displayName).trim()) {
        sanitized.displayName = sanitizeText(a.displayName, 80);
      }
      if (a.age !== undefined && String(a.age).trim() !== '') {
        const ageNum = parseInt(String(a.age).replace(/[^\d]/g, ''), 10);
        if (!isNaN(ageNum) && ageNum >= 0 && ageNum <= 125) {
          sanitized.age = String(ageNum);
        } else {
          errorsAr.push('السن لازم يكون رقم صحيح بين 0 و 125 سنة.');
          errorsEn.push('Invalid age (must be between 0 and 125 years).');
        }
      }
      if (a.weightKg !== undefined && String(a.weightKg).trim() !== '') {
        const wNum = parseFloat(String(a.weightKg).replace(/[^\d.]/g, ''));
        if (!isNaN(wNum) && wNum >= 1 && wNum <= 350) {
          sanitized.weightKg = String(Math.round(wNum * 10) / 10);
        } else {
          errorsAr.push('الوزن لازم يكون رقم بين 1 و 350 كيلو.');
          errorsEn.push('Invalid weight (must be between 1 and 350 kg).');
        }
      }
      if (a.gender !== undefined && ['male', 'female', ''].includes(a.gender)) {
        sanitized.gender = a.gender;
      }
      if (a.bloodType !== undefined && String(a.bloodType).trim() !== '') {
        const bt = sanitizeText(a.bloodType, 10).toUpperCase().replace(/\s+/g, '');
        if (['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bt)) {
          sanitized.bloodType = bt;
        } else {
          errorsAr.push('فصيلة الدم مش معروفة (الأنواع المتاحة: A+, A-, B+, B-, AB+, AB-, O+, O-).');
          errorsEn.push('Unrecognized blood type (expected A+, O+, B-, AB+, etc.).');
        }
      }
      if (a.emergencyContact !== undefined && String(a.emergencyContact).trim() !== '') {
        sanitized.emergencyContact = sanitizeText(a.emergencyContact, 40);
      }
      if (
        a.pregnancyStatus !== undefined &&
        ['none', 'pregnant', 'breastfeeding', 'unknown'].includes(a.pregnancyStatus)
      ) {
        sanitized.pregnancyStatus = a.pregnancyStatus;
      }
      if (
        a.renalStatus !== undefined &&
        ['normal', 'impaired', 'unknown'].includes(a.renalStatus)
      ) {
        sanitized.renalStatus = a.renalStatus;
      }
      if (
        a.hepaticStatus !== undefined &&
        ['normal', 'impaired', 'unknown'].includes(a.hepaticStatus)
      ) {
        sanitized.hepaticStatus = a.hepaticStatus;
      }

      if (Object.keys(sanitized).length === 0 && errorsAr.length === 0) {
        missingFields.push('vitals');
        errorsAr.push('مفيش بيان واضح (زي الوزن أو السن أو فصيلة الدم) عشان أحدثه.');
        errorsEn.push('No valid profile field was provided to update.');
      }

      return {
        valid: errorsAr.length === 0,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'add_medication': {
      const drugName = sanitizeText(a.drugName, 120);
      if (!drugName) {
        missingFields.push('drugName');
        errorsAr.push('لازم تقولي اسم الدوا الأول (المساعد مش بيخمن أسماء أدوية من نفسه).');
        errorsEn.push('Medication name is required (never invented by AI).');
      }
      const prescribedDose = sanitizeText(a.prescribedDose, 80);
      if (!prescribedDose) {
        missingFields.push('prescribedDose');
      }
      const route = VALID_ROUTES.has(a.route) ? a.route : '';
      const frequency = VALID_FREQS.has(a.frequency) ? a.frequency : '';
      const durationDays =
        typeof a.durationDays === 'number' && a.durationDays >= 1 && a.durationDays <= 60
          ? Math.round(a.durationDays)
          : null;

      const sanitized: AddMedicationArgs = {
        drugName,
        activeIngredients: sanitizeText(a.activeIngredients, 120),
        prescribedDose,
        route,
        frequency,
        durationDays,
        status: ['active', 'completed', 'discontinued'].includes(a.status) ? a.status : 'active',
        evidenceStatus: VALID_EVIDENCE.has(a.evidenceStatus)
          ? a.evidenceStatus
          : 'patient_reported',
        source: ['patient_chat', 'manual_entry', 'prescription_ocr', 'clinician_verified'].includes(
          a.source
        )
          ? a.source
          : 'patient_chat',
        ...(a.notes ? { notes: sanitizeText(a.notes, 200) } : {}),
      };
      return {
        valid: Boolean(drugName),
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'remove_medication': {
      const drugName = sanitizeText(a.drugName, 120);
      if (!drugName) {
        missingFields.push('drugName');
        errorsAr.push('قولي اسم الدوا اللي عايز تشيله أو توقفه من قايمة أدويتك.');
        errorsEn.push('Please specify the medication name to remove.');
      }
      const sanitized: RemoveMedicationArgs = {
        drugName,
        mode: a.mode === 'discontinue' ? 'discontinue' : 'delete',
      };
      return {
        valid: errorsAr.length === 0,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'add_prescription': {
      const rawItems = Array.isArray(a.items) ? a.items : [];
      if (rawItems.length === 0) {
        missingFields.push('items');
        errorsAr.push('مفيش أدوية واضحة في الروشتة عشان أضيفها.');
        errorsEn.push('No prescription items provided.');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: AddPrescriptionItemArgs[] = rawItems.map((item: any) => {
        const medicineName = sanitizeText(item?.medicineName, 120);
        const prescribedDose = sanitizeText(item?.prescribedDose, 80);
        const route = VALID_ROUTES.has(item?.route) ? item.route : '';
        const frequency = VALID_FREQS.has(item?.frequency) ? item.frequency : '';
        const durationDays =
          typeof item?.durationDays === 'number' &&
          !isNaN(item.durationDays) &&
          item.durationDays >= 1 &&
          item.durationDays <= 60
            ? Math.round(item.durationDays)
            : null;
        const unreadable: string[] = Array.isArray(item?.unreadableFields)
          ? item.unreadableFields.map(String)
          : [];
        if (!medicineName && !unreadable.includes('medicineName')) unreadable.push('medicineName');
        if (!prescribedDose && !unreadable.includes('prescribedDose'))
          unreadable.push('prescribedDose');
        if (!route && !unreadable.includes('route')) unreadable.push('route');
        if (!frequency && !unreadable.includes('frequency')) unreadable.push('frequency');
        if (durationDays === null && !unreadable.includes('durationDays'))
          unreadable.push('durationDays');

        return {
          ...(item?.antibioticId ? { antibioticId: sanitizeText(item.antibioticId, 80) } : {}),
          medicineName,
          prescribedDose,
          route,
          frequency,
          durationDays,
          ...(item?.firstDoseTime ? { firstDoseTime: sanitizeText(item.firstDoseTime, 10) } : {}),
          ...(Array.isArray(item?.doseTimes)
            ? {
                doseTimes: item.doseTimes
                  .map((t: unknown) => normalizeHHMM(t))
                  .filter((t: string | null): t is string => Boolean(t)),
              }
            : {}),
          ...(item?.notes ? { notes: sanitizeText(item.notes, 200) } : {}),
          ...(Array.isArray(item?.coMedications)
            ? { coMedications: item.coMedications.map((c: unknown) => sanitizeText(c, 40)) }
            : {}),
          captureMethod: ['manual_entry', 'ocr_upload', 'camera_capture', 'scanner_import'].includes(
            item?.captureMethod
          )
            ? item.captureMethod
            : 'manual_entry',
          isOcrUnverified: Boolean(item?.isOcrUnverified ?? true),
          ...(item?.rawExtractedText
            ? { rawExtractedText: sanitizeText(item.rawExtractedText, 1200) }
            : {}),
          ...(item?.imageFileName ? { imageFileName: sanitizeText(item.imageFileName, 120) } : {}),
          unreadableFields: unreadable,
          createScheduleAlso: Boolean(item?.createScheduleAlso),
        };
      });

      const sanitized: AddPrescriptionArgs = {
        items,
        ...(a.linkedDocumentId ? { linkedDocumentId: sanitizeText(a.linkedDocumentId, 80) } : {}),
      };
      return {
        valid: items.length > 0,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'update_prescription_status': {
      const prescriptionId = sanitizeText(a.prescriptionId, 80);
      const medicineName = sanitizeText(a.medicineName, 120);
      if (!prescriptionId && !medicineName) {
        missingFields.push('medicineName');
        errorsAr.push('قولي اسم الدوا أو الروشتة اللي عايز تحدث حالتها.');
        errorsEn.push('Please specify the prescription or medicine name to update.');
      }
      const newStatus = [
        'verified_by_patient',
        'needs_clarification',
        'completed',
        'discontinued',
      ].includes(a.newStatus)
        ? a.newStatus
        : 'verified_by_patient';
      const sanitized: UpdatePrescriptionStatusArgs = {
        ...(prescriptionId ? { prescriptionId } : {}),
        ...(medicineName ? { medicineName } : {}),
        newStatus,
        ...(a.notes ? { notes: sanitizeText(a.notes, 200) } : {}),
      };
      return {
        valid: errorsAr.length === 0,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'create_reminder': {
      const medicineName = sanitizeText(a.medicineName, 120);
      if (!medicineName) {
        missingFields.push('medicineName');
        errorsAr.push('قولي اسم الدوا اللي عايز أعملك تذكير ليه.');
        errorsEn.push('Please specify the medicine name for the reminder.');
      }
      const prescribedDose = sanitizeText(a.prescribedDose, 80);
      if (!prescribedDose) {
        missingFields.push('prescribedDose');
      }
      const rawTimes = Array.isArray(a.doseTimes) ? a.doseTimes : [];
      const doseTimes = rawTimes
        .map((t: unknown) => normalizeHHMM(t))
        .filter((t: string | null): t is string => Boolean(t));
      if (doseTimes.length === 0) {
        missingFields.push('doseTimes');
        errorsAr.push('قولي ميعاد الجرعة الساعة كام (مثلاً: 8 الصبح و 8 بالليل).');
        errorsEn.push('Please specify at least one valid dose time (e.g., 08:00 or 20:00).');
      }
      const frequency = ['once_daily', 'twice_daily', 'thrice_daily', 'four_times_daily'].includes(
        a.frequency
      )
        ? a.frequency
        : doseTimes.length === 1
          ? 'once_daily'
          : doseTimes.length === 3
            ? 'thrice_daily'
            : doseTimes.length >= 4
              ? 'four_times_daily'
              : 'twice_daily';
      const route = ['oral', 'suspension', 'injection', 'topical'].includes(a.route)
        ? a.route
        : 'oral';
      const durationDays =
        typeof a.durationDays === 'number' && a.durationDays >= 1 && a.durationDays <= 60
          ? Math.round(a.durationDays)
          : 5;
      const startDate =
        typeof a.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.startDate)
          ? a.startDate
          : new Date().toISOString().split('T')[0];

      const sanitized: CreateReminderArgs = {
        medicineName,
        prescribedDose,
        route,
        frequency,
        doseTimes: doseTimes.length > 0 ? doseTimes : ['08:00'],
        durationDays,
        startDate,
        ...(a.notes ? { notes: sanitizeText(a.notes, 200) } : {}),
      };
      return {
        valid: Boolean(medicineName && doseTimes.length > 0),
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'update_reminder': {
      const scheduleId = sanitizeText(a.scheduleId, 80);
      const medicineName = sanitizeText(a.medicineName, 120);
      if (!scheduleId && !medicineName) {
        missingFields.push('medicineName');
        errorsAr.push('قولي اسم الدوا اللي عايز تعدل ميعاد تذكيره.');
        errorsEn.push('Please specify which medication reminder to modify.');
      }
      const newDoseTimes = Array.isArray(a.newDoseTimes)
        ? a.newDoseTimes
            .map((t: unknown) => normalizeHHMM(t))
            .filter((t: string | null): t is string => Boolean(t))
        : undefined;
      const sanitized: UpdateReminderArgs = {
        ...(scheduleId ? { scheduleId } : {}),
        ...(medicineName ? { medicineName } : {}),
        ...(newDoseTimes && newDoseTimes.length > 0 ? { newDoseTimes } : {}),
        ...(a.newFrequency &&
        ['once_daily', 'twice_daily', 'thrice_daily', 'four_times_daily'].includes(a.newFrequency)
          ? { newFrequency: a.newFrequency }
          : {}),
        ...(typeof a.newDurationDays === 'number' &&
        a.newDurationDays >= 1 &&
        a.newDurationDays <= 60
          ? { newDurationDays: Math.round(a.newDurationDays) }
          : {}),
        ...(a.notes ? { notes: sanitizeText(a.notes, 200) } : {}),
      };
      return {
        valid: errorsAr.length === 0,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'stop_reminder': {
      const scheduleId = sanitizeText(a.scheduleId, 80);
      const medicineName = sanitizeText(a.medicineName, 120);
      if (!scheduleId && !medicineName) {
        missingFields.push('medicineName');
        errorsAr.push('قولي اسم الدوا اللي عايز توقف التذكير بتاعه.');
        errorsEn.push('Please specify which reminder to stop.');
      }
      const sanitized: StopReminderArgs = {
        ...(scheduleId ? { scheduleId } : {}),
        ...(medicineName ? { medicineName } : {}),
        ...(a.reason ? { reason: sanitizeText(a.reason, 200) } : {}),
      };
      return {
        valid: errorsAr.length === 0,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'save_medical_document': {
      const title = sanitizeText(a.title, 120) || 'مستند طبي / Medical Document';
      const category: MedicalDocumentCategory = VALID_DOC_CATEGORIES.has(a.category)
        ? a.category
        : 'other';
      const fileName = sanitizeText(a.fileName, 120) || 'document.jpg';
      const mimeType = sanitizeText(a.mimeType, 60) || 'image/jpeg';
      const fileSize = typeof a.fileSize === 'number' && a.fileSize >= 0 ? a.fileSize : 0;
      const extractedSummary = sanitizeText(a.extractedSummary, 1000);
      const extractedFields: Record<string, string> = {};
      if (a.extractedFields && typeof a.extractedFields === 'object') {
        for (const [k, v] of Object.entries(a.extractedFields)) {
          extractedFields[sanitizeText(k, 60)] = sanitizeText(v, 300);
        }
      }
      const unreadableFields = Array.isArray(a.unreadableFields)
        ? a.unreadableFields.map((f: unknown) => sanitizeText(f, 60)).filter(Boolean)
        : [];
      const sanitized: SaveMedicalDocumentArgs = {
        title,
        category,
        fileName,
        mimeType,
        fileSize,
        ...(typeof a.previewDataUrl === 'string' ? { previewDataUrl: a.previewDataUrl } : {}),
        ...(typeof a.storagePath === 'string' ? { storagePath: sanitizeText(a.storagePath, 250) } : {}),
        ...(typeof a.downloadUrl === 'string' ? { downloadUrl: a.downloadUrl } : {}),
        extractedSummary,
        extractedFields,
        unreadableFields,
        ...(Array.isArray(a.extractedPrescriptions)
          ? { extractedPrescriptions: a.extractedPrescriptions }
          : {}),
        saveExtractedPrescriptions: Boolean(a.saveExtractedPrescriptions ?? true),
      };
      return {
        valid: true,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }

    case 'show_allergies':
    case 'show_medications':
    case 'show_reminders':
    case 'show_prescriptions':
    case 'show_medical_documents':
    case 'summarize_health_records':
    default: {
      const sanitized: ReadQueryArgs = {
        ...(a.filterText ? { filterText: sanitizeText(a.filterText, 100) } : {}),
        ...(typeof a.limit === 'number' && a.limit >= 1 && a.limit <= 50
          ? { limit: Math.round(a.limit) }
          : {}),
      };
      return {
        valid: true,
        sanitized: sanitized as unknown as AiActionPayloadMap[K],
        errorsAr,
        errorsEn,
        missingFields,
      };
    }
  }
}
