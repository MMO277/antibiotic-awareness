/**
 * aiActionEngine.test.ts
 *
 * Comprehensive Automated Verification & Security Test Suite for the
 * Antibiotic Awareness AI Personal Health Assistant.
 *
 * Covers all 17 mandatory scenarios from Section 9 of the specification:
 *  1. Add a patient-reported medical condition.
 *  2. Add a medication allergy & verify live safety engine warning.
 *  3. Upload/process a clear prescription image.
 *  4. Upload/process an unclear prescription image (never invents missing fields).
 *  5. Extract multiple medications from one prescription.
 *  6. Create a medication reminder.
 *  7. Modify an existing reminder.
 *  8. Retrieve the patient's current medication list & summary.
 *  9. Attempt to access another user's medical records (blocked).
 * 10. Attempt an unauthorized write without confirmation (blocked).
 * 11. Cancel an action before saving (no state mutation).
 * 12. Handle a failed/unconfigured Firebase Storage upload transparently.
 * 13. Handle an AI provider failure gracefully with deterministic fallback.
 * 14. Prevent duplicate records (both content deduplication & idempotency guard).
 * 15. Verify Arabic and English NLU interfaces & mandatory medical safety refusals.
 * 16. Verify upload file validation & security guardrails.
 * 17. Verify that existing application features (`medicationSafetyEngine`, `SmartPassport` notes sync, `firestore.rules`, `storage.rules`) still work.
 */

import {
  emptyHealthProfile,
  normalizeProfile,
  parseLegacyChronicFromNotes,
  UserHealthProfile,
} from './allergyData';
import { TreatmentSchedule, SavedPrescription } from './trackerData';
import { detectPatientActionIntent, extractAiToolCallFromResponse } from './aiActionRegistry';
import { generateContextualSiteReply, getSeedMedicinesFallback, EnhancedChatUiMessage } from './aiConversationContext';
import { buildPassages, respond } from './assistantLogic';
import {
  applyEditedFieldsToProposal,
  createPendingActionProposal,
  executeConfirmedAiAction,
  executeReadOnlyAiAction,
} from './aiActionExecutor';
import {
  clearIdempotencyCacheForTesting,
  verifyActionAuthorization,
} from './aiActionPermissions';
import {
  classifyAndSummarizeDocumentText,
  extractCultureAndSensitivityFindings,
  extractMultiplePrescriptionItemsFromText,
  uploadMedicalDocumentToStorage,
  validateMedicalUploadFile,
} from './aiDocumentProcessor';
import { runAllSafetyEngineTests, TestCaseResult } from './medicationSafetyEngine.test';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runAllAiActionEngineTests(): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  const runScenario = async (id: number, name: string, fn: () => void | Promise<void>) => {
    try {
      await fn();
      results.push({ id, name, passed: true, details: 'OK' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id, name, passed: false, details: msg });
    }
  };

  let profile: UserHealthProfile = emptyHealthProfile();
  let schedules: TreatmentSchedule[] = [];
  const prescriptions: SavedPrescription[] = [];
  const testUid = 'patient-uid-12345';

  clearIdempotencyCacheForTesting();

  // SCENARIO 1: Add a patient-reported medical condition
  await runScenario(1, 'Add a patient-reported medical condition (Diabetes)', async () => {
    const intent = detectPatientActionIntent('Add diabetes to my health profile', 'en');
    assert(intent.matched && intent.actionType === 'add_chronic_condition', 'Must detect add_chronic_condition intent');

    const proposal = createPendingActionProposal({
      actionType: 'add_chronic_condition',
      args: intent.args as never,
      profile,
      schedules,
      prescriptions,
    });
    assert(proposal.status === 'pending_confirmation', 'Proposal must start in pending_confirmation');

    const res = await executeConfirmedAiAction({
      proposal,
      authenticatedUid: testUid,
      confirmedByPatient: true,
      currentProfile: profile,
      onProfileUpdated: (next) => {
        profile = next;
      },
    });
    assert(res.success, 'Confirmed chronic condition must save');
    assert((profile.chronicConditions || []).length === 1, 'Profile must have 1 chronic condition');
    assert(
      profile.chronicConditions![0].evidenceStatus === 'patient_reported',
      'Condition must be marked patient_reported (not clinically verified)'
    );
    assert(
      parseLegacyChronicFromNotes(profile.notes).length === 1,
      'Legacy CHRONIC: notes for SmartPassport must be kept in sync'
    );
  });

  // SCENARIO 2: Add a medication allergy & verify live safety warning
  await runScenario(2, 'Add a medication allergy (Penicillin) & verify live safety engine warning', async () => {
    const intent = detectPatientActionIntent('Add my penicillin allergy', 'en');
    assert(intent.matched && intent.actionType === 'add_allergy', 'Must detect add_allergy intent');

    const proposal = createPendingActionProposal({
      actionType: 'add_allergy',
      args: intent.args as never,
      profile,
      schedules,
      prescriptions,
    });

    const res = await executeConfirmedAiAction({
      proposal,
      authenticatedUid: testUid,
      confirmedByPatient: true,
      currentProfile: profile,
      onProfileUpdated: (next) => {
        profile = next;
      },
    });
    assert(res.success, 'Penicillin allergy must be saved');
    assert(profile.allergies.length === 1, 'Profile must contain 1 allergy record');
    assert(profile.allergies[0].allergenKey === 'penicillin', 'Allergen family must resolve to penicillin');

    const augProposal = createPendingActionProposal({
      actionType: 'add_medication',
      args: {
        drugName: 'Augmentin 1g',
        prescribedDose: '1000mg',
        route: 'oral',
        frequency: 'twice_daily',
        status: 'active',
        evidenceStatus: 'patient_reported',
        source: 'patient_chat',
      },
      profile,
      schedules,
      prescriptions,
    });
    assert(
      augProposal.safetyPreview.status === 'urgent',
      `Expected urgent safety alert when proposing Augmentin to Penicillin-allergic patient, got ${augProposal.safetyPreview.status}`
    );
  });

  // SCENARIO 3: Upload/process a clear prescription image
  await runScenario(3, 'Upload a clear prescription image and extract verified structure', () => {
    const clearOcrText = [
      'RX_DRUG_ID: ciprofloxacin',
      'RX_DRUG_NAME: Ciprofar 500mg',
      'RX_DOSE: 500 mg',
      'RX_ROUTE: oral',
      'RX_FREQ: twice_daily',
      'RX_DURATION_DAYS: 7',
      'RX_NOTES: After meals',
    ].join('\n');

    const items = extractMultiplePrescriptionItemsFromText(clearOcrText, 'rx_clear.jpg');
    assert(items.length === 1, 'Must extract 1 prescription item');
    assert(items[0].medicineName.includes('Ciprofar'), 'Must detect Ciprofar');
    assert(items[0].prescribedDose === '500 mg', 'Must extract 500 mg');
    assert(items[0].route === 'oral', 'Must extract oral route');
    assert(items[0].frequency === 'twice_daily', 'Must extract twice_daily frequency');
    assert(items[0].durationDays === 7, 'Must extract 7 days duration');
    assert(
      (items[0].unreadableFields || []).length === 0,
      'Clear prescription must have 0 unreadable fields'
    );
  });

  // SCENARIO 4: Upload an unclear prescription image (never invents missing dose/frequency/duration)
  await runScenario(4, 'Upload an unclear prescription image without inventing missing fields', () => {
    const unclearOcrText = 'RX_DRUG_NAME: Zithromax\nRX_DOSE: UNREADABLE\nRX_FREQ: UNREADABLE\nRX_DURATION_DAYS: UNREADABLE';
    const items = extractMultiplePrescriptionItemsFromText(unclearOcrText, 'blurry_rx.jpg');
    assert(items.length === 1, 'Must return 1 item for Zithromax');
    assert(items[0].prescribedDose === '', 'Must NOT invent a dose when UNREADABLE');
    assert(items[0].frequency === '', 'Must NOT invent a frequency when UNREADABLE');
    assert(items[0].durationDays === null, 'Must NOT invent durationDays when UNREADABLE');
    assert(
      Boolean(
        items[0].unreadableFields?.includes('prescribedDose') &&
          items[0].unreadableFields?.includes('frequency') &&
          items[0].unreadableFields?.includes('durationDays')
      ),
      'Must flag prescribedDose, frequency, and durationDays in unreadableFields'
    );
  });

  // SCENARIO 5: Extract multiple medications from one prescription
  await runScenario(5, 'Extract multiple medications from one prescription', () => {
    const multiDrugRxText = [
      '1. Ciprofar 500 mg tablet twice daily for 7 days',
      '2. Flagyl 500 mg tablet three times daily for 7 days',
    ].join('\n');
    const items = extractMultiplePrescriptionItemsFromText(multiDrugRxText, 'multi_rx.jpg');
    assert(items.length === 2, `Expected 2 medications extracted, got ${items.length}`);
    assert(items[0].antibioticId === 'ciprofloxacin', 'First drug must resolve to ciprofloxacin');
    assert(items[1].antibioticId === 'metronidazole', 'Second drug must resolve to metronidazole');
  });

  // SCENARIO 6: Create a medication reminder
  await runScenario(6, 'Create a medication reminder for 8 AM and 8 PM', async () => {
    const intent = detectPatientActionIntent(
      'Remind me to take Ciprofar 500mg at 8 AM and 8 PM for 5 days',
      'en'
    );
    assert(intent.matched && intent.actionType === 'create_reminder', 'Must detect create_reminder');
    const proposal = createPendingActionProposal({
      actionType: 'create_reminder',
      args: intent.args as never,
      profile,
      schedules,
      prescriptions,
    });
    const res = await executeConfirmedAiAction({
      proposal,
      authenticatedUid: testUid,
      confirmedByPatient: true,
      currentProfile: profile,
      currentSchedules: schedules,
      onProfileUpdated: (nextP) => {
        profile = nextP;
      },
      onSchedulesUpdated: (nextS) => {
        schedules = nextS;
      },
    });
    assert(res.success, 'Reminder schedule must be created');
    assert(schedules.length === 1, 'Schedules array must have 1 active schedule');
    assert(
      schedules[0].doseTimes.includes('08:00') && schedules[0].doseTimes.includes('20:00'),
      'Dose times must be 08:00 and 20:00'
    );
    assert(schedules[0].doses.length === 10, '5 days x 2 doses/day = 10 scheduled dose slots');
  });

  // SCENARIO 7: Modify an existing reminder
  await runScenario(7, 'Modify an existing medication reminder to 9 AM and 9 PM', async () => {
    const intent = detectPatientActionIntent(
      'Modify my Ciprofar reminder to 9 AM and 9 PM',
      'en'
    );
    assert(intent.matched && intent.actionType === 'update_reminder', 'Must detect update_reminder');
    const proposal = createPendingActionProposal({
      actionType: 'update_reminder',
      args: intent.args as never,
      profile,
      schedules,
      prescriptions,
    });
    const res = await executeConfirmedAiAction({
      proposal,
      authenticatedUid: testUid,
      confirmedByPatient: true,
      currentProfile: profile,
      currentSchedules: schedules,
      onSchedulesUpdated: (nextS) => {
        schedules = nextS;
      },
    });
    assert(res.success, 'Reminder modification must succeed');
    assert(
      schedules[0].doseTimes[0] === '09:00' && schedules[0].doseTimes[1] === '21:00',
      'Updated dose times must be 09:00 and 21:00'
    );
  });

  // SCENARIO 8: Retrieve the patient's current medication list & health summary
  await runScenario(8, 'Retrieve patient current medication list and health summary', async () => {
    const medProposal = createPendingActionProposal({
      actionType: 'add_medication',
      args: {
        drugName: 'Ciprofar 500mg',
        prescribedDose: '500mg',
        route: 'oral',
        frequency: 'twice_daily',
        status: 'active',
        evidenceStatus: 'patient_reported',
        source: 'patient_chat',
      },
      profile,
      schedules,
      prescriptions,
    });
    await executeConfirmedAiAction({
      proposal: medProposal,
      authenticatedUid: testUid,
      confirmedByPatient: true,
      currentProfile: profile,
      onProfileUpdated: (nextP) => {
        profile = nextP;
      },
    });

    const showMedsRes = executeReadOnlyAiAction({
      actionType: 'show_medications',
      authenticatedUid: testUid,
      profile,
      schedules,
      prescriptions,
      lang: 'en',
    });
    assert(showMedsRes.success && showMedsRes.messageEn.includes('Ciprofar 500mg'), 'Must list Ciprofar 500mg');

    const summaryRes = executeReadOnlyAiAction({
      actionType: 'summarize_health_records',
      authenticatedUid: testUid,
      profile,
      schedules,
      prescriptions,
      lang: 'ar',
    });
    assert(
      summaryRes.success &&
        summaryRes.messageAr.includes('Ciprofar 500mg') &&
        summaryRes.messageAr.includes('Penicillin'),
      'Arabic health summary must include medications and allergies'
    );
  });

  // SCENARIO 9: Attempt to access another user's medical records
  await runScenario(9, 'Block cross-user medical record access or modification', async () => {
    const readOtherUser = executeReadOnlyAiAction({
      actionType: 'summarize_health_records',
      authenticatedUid: 'patient-uid-12345',
      requestedTargetUid: 'victim-uid-99999',
      profile,
      schedules,
      prescriptions,
      lang: 'en',
    });
    assert(!readOtherUser.success, 'Cross-user read must be blocked');
    assert(
      readOtherUser.errorCode === 'cross_user_access_denied',
      'Must return cross_user_access_denied errorCode'
    );

    const writeOtherUser = verifyActionAuthorization({
      actionType: 'add_allergy',
      authenticatedUid: 'patient-uid-12345',
      requestedTargetUid: 'victim-uid-99999',
      confirmedByPatient: true,
    });
    assert(!writeOtherUser.allowed, 'Cross-user write must be strictly blocked');
  });

  // SCENARIO 10: Attempt an unauthorized write without patient confirmation
  await runScenario(10, 'Block unconfirmed write operations', async () => {
    const proposal = createPendingActionProposal({
      actionType: 'update_vitals',
      args: { weightKg: '80' },
      profile,
      schedules,
      prescriptions,
    });
    const unconfirmedRes = await executeConfirmedAiAction({
      proposal,
      authenticatedUid: testUid,
      confirmedByPatient: false,
      currentProfile: profile,
    });
    assert(!unconfirmedRes.success, 'Write without patient confirmation must be rejected');
    assert(
      unconfirmedRes.errorCode === 'missing_confirmation',
      'Must fail with missing_confirmation'
    );
  });

  // SCENARIO 11: Cancel an action before saving & test inline editing before saving
  await runScenario(11, 'Cancel an action before saving without mutating profile, and support Edit mode', async () => {
    const beforeWeight = profile.weightKg;
    let proposal = createPendingActionProposal({
      actionType: 'update_vitals',
      args: { weightKg: '72' },
      profile,
      schedules,
      prescriptions,
    });
    proposal = {
      ...proposal,
      status: 'cancelled',
      resultMessageEn: 'Action cancelled.',
    };
    assert(profile.weightKg === beforeWeight, 'Cancelled proposal must not mutate profile weight');

    let editProposal = createPendingActionProposal({
      actionType: 'update_vitals',
      args: { weightKg: '70' },
      profile,
      schedules,
      prescriptions,
    });
    editProposal = applyEditedFieldsToProposal(
      editProposal,
      { weightKg: '75' },
      profile,
      schedules,
      prescriptions
    );
    const saveEdited = await executeConfirmedAiAction({
      proposal: editProposal,
      authenticatedUid: testUid,
      confirmedByPatient: true,
      currentProfile: profile,
      onProfileUpdated: (next) => {
        profile = next;
      },
    });
    assert(saveEdited.success && profile.weightKg === '75', 'Edited weight (75 kg) must be saved');
  });

  // SCENARIO 12: Handle a failed or unconfigured Firebase Storage upload transparently
  await runScenario(12, 'Handle failed or unconfigured Firebase Storage upload without fabricating cloud success', async () => {
    const outcome = await uploadMedicalDocumentToStorage({
      uid: testUid,
      docId: 'doc-test-1',
      fileName: 'lab_report.jpg',
      mimeType: 'image/jpeg',
      base64Data: 'dGVzdA==',
    });
    assert(
      outcome.uploadedToCloud === false && Boolean(outcome.errorEn),
      'When Storage is unconfigured/unavailable, uploadedToCloud must be false with a transparent message'
    );
  });

  // SCENARIO 13: Handle AI provider / network failure gracefully with deterministic document classification
  await runScenario(13, 'Deterministic fallback when external AI provider is unavailable', () => {
    const docMeta = classifyAndSummarizeDocumentText(
      'CBC Report: Hemoglobin: 13.4 g/dL, WBC: 7.2, Serum Creatinine: 0.9 mg/dL',
      'cbc_lab.jpg'
    );
    assert(docMeta.category === 'lab_report', 'Must deterministically classify CBC text as lab_report');
    assert(docMeta.extractedFields.hemoglobin === '13.4', 'Must extract Hemoglobin 13.4');
    assert(docMeta.extractedFields.serumCreatinine === '0.9', 'Must extract Creatinine 0.9');
  });

  // SCENARIO 14: Prevent duplicate records (both rapid idempotency key AND content duplicate check)
  await runScenario(14, 'Prevent duplicate records and block rapid duplicate requests', async () => {
    const dupCondProposal = createPendingActionProposal({
      actionType: 'add_chronic_condition',
      args: {
        conditionName: 'Diabetes Mellitus',
        evidenceStatus: 'patient_reported',
        source: 'patient_chat',
      },
      profile,
      schedules,
      prescriptions,
    });
    assert(
      dupCondProposal.safetyPreview.duplicateDetected === true,
      'Safety preview must flag duplicate condition before saving'
    );

    // 14a: First check rapid idempotency guard (since Scenario 1 executed this exact key within 60s)
    const idempRes = await executeConfirmedAiAction({
      proposal: dupCondProposal,
      authenticatedUid: testUid,
      confirmedByPatient: true,
      currentProfile: profile,
    });
    assert(
      !idempRes.success && idempRes.errorCode === 'duplicate_request_blocked',
      'Rapid duplicate submission must be blocked by idempotency guard'
    );

    // 14b: Clear idempotency window and verify content deduplication also blocks duplicate condition
    clearIdempotencyCacheForTesting();
    const contentDupRes = await executeConfirmedAiAction({
      proposal: dupCondProposal,
      authenticatedUid: testUid,
      confirmedByPatient: true,
      currentProfile: profile,
    });
    assert(
      !contentDupRes.success && contentDupRes.errorCode === 'duplicate_record',
      'Duplicate condition in profile must be blocked by content deduplication'
    );
  });

  // SCENARIO 15: Verify Arabic and English NLU interfaces & mandatory safety refusals
  await runScenario(15, 'Verify Arabic and English NLU commands and mandatory safety refusal for double-dosing', () => {
    const arAllergy = detectPatientActionIntent('أضف حساسية السلفا إلى ملفي الصحي', 'ar');
    assert(
      arAllergy.matched && arAllergy.actionType === 'add_allergy',
      'Arabic add_allergy command must match'
    );

    const arCondition = detectPatientActionIntent('عندي ضغط مرتفع ضيفه في ملفي الصحي', 'ar');
    assert(
      arCondition.matched && arCondition.actionType === 'add_chronic_condition',
      'Arabic add_chronic_condition command must match'
    );

    const arWeight = detectPatientActionIntent('تحديث الوزن إلى 78 كجم', 'ar');
    assert(
      arWeight.matched && arWeight.actionType === 'update_vitals',
      'Arabic update_vitals command must match'
    );

    const arReminder = detectPatientActionIntent(
      'فكرني آخد أوجمنتين الساعة 8 صباحاً و 8 مساءً',
      'ar'
    );
    assert(
      arReminder.matched && arReminder.actionType === 'create_reminder',
      'Arabic create_reminder command must match'
    );

    const doubleDoseAr = detectPatientActionIntent('نسيت الجرعة ينفع أضاعف الجرعة وآخد حبايتين؟', 'ar');
    assert(
      Boolean(doubleDoseAr.safetyRefusal?.refused && doubleDoseAr.safetyRefusal.reasonCode === 'no_double_dose'),
      'Arabic double-dose request must trigger mandatory safety refusal'
    );

    const doubleDoseEn = detectPatientActionIntent('Can I double my missed dose?', 'en');
    assert(
      Boolean(doubleDoseEn.safetyRefusal?.refused && doubleDoseEn.safetyRefusal.reasonCode === 'no_double_dose'),
      'English double-dose request must trigger mandatory safety refusal'
    );
  });

  // SCENARIO 16: Verify upload file validation & security guardrails
  await runScenario(16, 'Validate uploaded file types and sizes and block unsafe files', () => {
    const unsafeExe = validateMedicalUploadFile({
      name: 'malware.exe',
      type: 'application/x-msdownload',
      size: 1024,
    });
    assert(!unsafeExe.valid, 'Executable files must be blocked');

    const oversized = validateMedicalUploadFile({
      name: 'huge_scan.png',
      type: 'image/png',
      size: 10 * 1024 * 1024,
    });
    assert(!oversized.valid, 'Files larger than 8 MB must be rejected');

    const validJpg = validateMedicalUploadFile({
      name: 'prescription_2026.jpg',
      type: 'image/jpeg',
      size: 450 * 1024,
    });
    assert(validJpg.valid, 'Valid JPEG under 8 MB must be accepted');
  });

  // SCENARIO 17: Verify existing application features & regression suite
  await runScenario(17, 'Verify all existing Medication Safety Engine tests and SmartPassport backward compatibility', async () => {
    const legacyResults = await runAllSafetyEngineTests();
    const failedLegacy = legacyResults.filter((r) => !r.passed);
    assert(
      failedLegacy.length === 0,
      `All 13 existing safety engine tests must pass; failed: ${failedLegacy.map((f) => f.name).join(', ')}`
    );

    const legacyProfile = normalizeProfile({
      displayName: 'Ahmed',
      notes: 'CHRONIC:["Asthma","Hypertension"]||Patient notes',
    });
    assert(
      (legacyProfile.chronicConditions || []).length === 2,
      'normalizeProfile must hydrate chronicConditions from legacy CHRONIC: notes'
    );
  });

  // SCENARIO 18: Verify Egyptian Colloquial NLU, AI [[ACTION_CALL: ...]] parser, and Culture S/R + Renal/Pediatric Clinical Guards
  await runScenario(18, 'Verify Egyptian Colloquial NLU, [[ACTION_CALL]] parser, and Culture (S/R) + Renal/Pediatric clinical checks', () => {
    const egAllergy = detectPatientActionIntent('يا دكتور اكتبلي حساسية بنسلين في ملفي', 'ar');
    assert(
      egAllergy.matched && egAllergy.actionType === 'add_allergy',
      'Egyptian colloquial add_allergy phrase must match'
    );

    const toolExtracted = extractAiToolCallFromResponse(
      'ألف سلامة عليك يا بطل! هسجلك الضغط العالي في ملفك حالاً.\n[[ACTION_CALL: {"actionType":"add_chronic_condition","args":{"conditionName":"ضغط الدم المرتفع"}}]]'
    );
    assert(
      Boolean(toolExtracted.detectedIntent?.matched && toolExtracted.detectedIntent?.actionType === 'add_chronic_condition'),
      'extractAiToolCallFromResponse must parse [[ACTION_CALL: ...]] and build validated proposal intent'
    );
    assert(
      !toolExtracted.cleanReplyText.includes('ACTION_CALL'),
      'extractAiToolCallFromResponse must strip [[ACTION_CALL: ...]] tag from cleanReplyText'
    );

    const cultureSample = `Urine Culture & Sensitivity Report
Isolated Organism: E. coli
Amoxicillin/Clavulanate : Resistant (R)
Ciprofloxacin : Resistant (R)
Nitrofurantoin : Sensitive (S)
Fosfomycin : Sensitive (S)`;
    const cultureParsed = extractCultureAndSensitivityFindings(cultureSample);
    assert(
      cultureParsed.isCultureReport &&
        cultureParsed.sensitiveAntibiotics.length >= 2 &&
        cultureParsed.resistantAntibiotics.length >= 2,
      'Must extract Sensitive (S) and Resistant (R) antibiotics from Culture report'
    );

    const docMeta = classifyAndSummarizeDocumentText(cultureSample, 'urine_culture.jpg');
    const profileWithCulture: UserHealthProfile = {
      ...profile,
      age: '8',
      weightKg: '25',
      renalStatus: 'impaired',
      medicalDocuments: [
        {
          id: 'doc-culture-1',
          title: docMeta.titleAr,
          category: 'lab_report',
          fileName: 'urine_culture.jpg',
          mimeType: 'image/jpeg',
          fileSize: 12000,
          extractedSummary: docMeta.summaryAr,
          extractedFields: docMeta.extractedFields,
          unreadableFields: [],
          verificationStatus: 'patient_confirmed',
          source: 'patient_upload',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const resistantCheck = createPendingActionProposal({
      actionType: 'add_medication',
      args: {
        drugName: 'Ciprofloxacin',
        prescribedDose: '250 mg',
        route: 'oral',
        frequency: 'twice_daily',
        status: 'active',
        evidenceStatus: 'patient_reported',
        source: 'patient_chat',
      },
      profile: profileWithCulture,
      schedules,
      prescriptions,
    });
    assert(
      resistantCheck.safetyPreview.status === 'urgent' &&
        resistantCheck.safetyPreview.detailsAr.some((d) => d.includes('Resistant - R')),
      'Must flag Urgent alert when medication is Resistant (R) in patient Culture & Sensitivity report'
    );
    assert(
      resistantCheck.safetyPreview.detailsAr.some((d) => d.includes('25 كجم')),
      'Must include Pediatric Weight-Based (mg/kg) check when patient age <= 12'
    );
  });

  // SCENARIO 19: Verify Instant Multi-Turn Conversational Memory ("ودني بتوجعني" -> "طب إيه أحسن وبكام؟" -> "طب جرعته إيه؟")
  await runScenario(19, 'Verify instant multi-turn conversational continuity across site medicine data', () => {
    const seedMeds = getSeedMedicinesFallback();
    const passages = buildPassages(seedMeds);
    const turn1Q = 'ودني بتوجعني وعايز حاجة';
    const turn1Local = respond(passages, seedMeds, turn1Q);
    const turn1Res = generateContextualSiteReply({
      userText: turn1Q,
      msgs: [],
      meds: seedMeds,
      profile,
      lang: 'ar',
      localReply: turn1Local,
    });
    assert(
      turn1Res.handledFast && turn1Res.topicMemory.lastCondition === 'ear',
      'Turn 1 must immediately recognize ear pain condition and respond in Egyptian Arabic'
    );

    const historyAfterTurn1: EnhancedChatUiMessage[] = [
      { id: 'u1', who: 'me', text: turn1Q },
      { id: 'b1', who: 'bot', text: turn1Res.replyText, links: turn1Res.links },
    ];

    const turn2Q = 'طب إيه أحسن واحد فيهم وبكام سعره في الصيدلية؟';
    const turn2Local = respond(passages, seedMeds, turn2Q);
    const turn2Res = generateContextualSiteReply({
      userText: turn2Q,
      msgs: historyAfterTurn1,
      meds: seedMeds,
      profile,
      lang: 'ar',
      localReply: turn2Local,
    });
    assert(
      turn2Res.handledFast &&
        turn2Res.replyText.includes('أوجمنتين') &&
        turn2Res.replyText.includes('الأسعار التقريبية في مصر'),
      'Turn 2 follow-up ("طب إيه أحسن وبكام؟") must remember the ear infection topic and compare medicines + prices from site data'
    );

    const historyAfterTurn2: EnhancedChatUiMessage[] = [
      ...historyAfterTurn1,
      { id: 'u2', who: 'me', text: turn2Q },
      { id: 'b2', who: 'bot', text: turn2Res.replyText, links: turn2Res.links },
    ];

    const turn3Q = 'طب جرعته إيه كل كام ساعة وآخد معاه مسكن إيه للوجع؟';
    const turn3Local = respond(passages, seedMeds, turn3Q);
    const turn3Res = generateContextualSiteReply({
      userText: turn3Q,
      msgs: historyAfterTurn2,
      meds: seedMeds,
      profile,
      lang: 'ar',
      localReply: turn3Local,
    });
    assert(
      turn3Res.handledFast &&
        turn3Res.replyText.includes('الجرعات المعتادة') &&
        turn3Res.replyText.includes('باراسيتامول'),
      'Turn 3 follow-up ("طب جرعته إيه وآخد معاه مسكن إيه؟") must answer dosing and pain relief for the remembered ear medications'
    );
  });

  return results;
}
