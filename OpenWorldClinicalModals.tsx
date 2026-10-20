import React, { useState } from 'react';
import { Lang, pick } from './types';
import {
  EquipmentId,
  HOSPITAL_EQUIPMENT_ITEMS,
  HOSPITAL_PATIENTS,
  PatientDef,
  PatientSimState,
  StaffNpcDef,
  WorkstationDef,
} from './openWorldHospitalData';
import { OpenWorldWorkflowFlags } from './openWorldCloudPersistence';

interface PatientModalProps {
  lang: Lang;
  patient: PatientDef;
  patientState: PatientSimState;
  carriedItemId: EquipmentId | null;
  inventory: EquipmentId[];
  workflowFlags: OpenWorldWorkflowFlags;
  onClose: () => void;
  onPatientAction: (
    patientId: string,
    action:
      | 'confirm_id'
      | 'ask_symptoms'
      | 'measure_vitals'
      | 'record_chart'
      | 'provide_comfort'
      | 'escalate_team'
      | 'pickup_xray_order'
      | 'collect_specimen'
      | 'block_allergy_med'
      | 'administer_safe_med',
  ) => void;
}

export function OpenWorldPatientModal({
  lang,
  patient,
  patientState,
  carriedItemId,
  inventory,
  workflowFlags,
  onClose,
  onPatientAction,
}: PatientModalProps) {
  const isAr = lang === 'ar';
  const [fiveRightsChecked, setFiveRightsChecked] = useState<Record<string, boolean>>({
    rightPatient: false,
    rightDrug: false,
    rightDose: false,
    rightRoute: false,
    rightTime: false,
  });
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const hasVitalsTool =
    carriedItemId === 'eq-vitals-kit' ||
    inventory.includes('eq-vitals-kit') ||
    carriedItemId === 'eq-stethoscope' ||
    carriedItemId === 'eq-thermometer' ||
    carriedItemId === 'eq-bp-monitor' ||
    carriedItemId === 'eq-pulse-oximeter';

  const hasSterileContainer =
    carriedItemId === 'eq-specimen-container' || inventory.includes('eq-specimen-container');

  const hasSafeMed =
    carriedItemId === 'eq-med-azithromycin-pkg' ||
    inventory.includes('eq-med-azithromycin-pkg');

  const allFiveRightsVerified =
    fiveRightsChecked.rightPatient &&
    fiveRightsChecked.rightDrug &&
    fiveRightsChecked.rightDose &&
    fiveRightsChecked.rightRoute &&
    fiveRightsChecked.rightTime;

  const toggleRight = (key: string) => {
    setFiveRightsChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="ow-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ow-clinical-modal" dir={isAr ? 'rtl' : 'ltr'}>
        <header className="ow-modal-head">
          <div>
            <span className="ow-sim-badge">
              {isAr
                ? '⚠️ بيانات تدريبية محاكاة — ليست للتشخيص الحقيقي'
                : '⚠️ SIMULATED TRAINING RECORD — NOT REAL PATIENT DATA'}
            </span>
            <h2>
              🛏️ {pick(patient.name, lang)}{' '}
              <small className="ow-code-pill">{patient.patientCode}</small>
            </h2>
            <p className="ow-room-sub">
              {pick(patient.roomLabel, lang)} • {isAr ? `العمر: ${patient.age} سنة` : `Age: ${patient.age} yrs`}
            </p>
          </div>
          <button type="button" className="ow-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div
          className={`ow-allergy-banner ${
            patient.hasPenicillinAllergy ? 'ow-allergy-danger' : 'ow-allergy-safe'
          }`}
        >
          <strong>{pick(patient.allergyBanner, lang)}</strong>
          <span>
            {isAr ? `الحالة الحالية: ${patientState.statusNoteAr}` : `Status: ${patientState.statusNoteEn}`}
          </span>
        </div>

        <div className="ow-modal-grid">
          <section className="ow-modal-card">
            <h3>📋 {isAr ? 'الشكوى الرئيسية والقصة المرضية' : 'Presenting Complaint & History'}</h3>
            <p>
              <b>{isAr ? 'الشكوى:' : 'Complaint:'}</b> {pick(patient.presentingComplaint, lang)}
            </p>
            <p className="ow-muted-text">{pick(patient.scenarioHistory, lang)}</p>

            <div className="ow-dialogue-box">
              <b>💬 {isAr ? 'حوار المريض:' : 'Patient Dialogue:'}</b>
              <p>
                {patientState.chartRecorded || patientState.medicationAdministered || patientState.escalatedToTeam
                  ? pick(patient.dialogue.afterCare, lang)
                  : patientState.symptomsAsked
                    ? pick(patient.dialogue.symptoms, lang)
                    : pick(patient.dialogue.intro, lang)}
              </p>
            </div>
          </section>

          <section className="ow-modal-card">
            <h3>🌡️ {isAr ? 'العلامات الحيوية الخمس (Vital Signs)' : 'Simulated Vital Signs (5 Parameters)'}</h3>
            {patientState.vitalsMeasured ? (
              <div className="ow-vitals-grid">
                <div className="ow-vital-chip">
                  <small>{isAr ? 'الحرارة Temp' : 'Temp'}</small>
                  <b>{patient.vitals.tempC} °C</b>
                </div>
                <div className="ow-vital-chip">
                  <small>{isAr ? 'النبض HR' : 'Heart Rate'}</small>
                  <b>{patient.vitals.pulseBpm} bpm</b>
                </div>
                <div className="ow-vital-chip">
                  <small>{isAr ? 'التنفس RR' : 'Resp Rate'}</small>
                  <b>{patient.vitals.respRate} /min</b>
                </div>
                <div className="ow-vital-chip">
                  <small>{isAr ? 'الضغط BP' : 'Blood Pressure'}</small>
                  <b>
                    {patient.vitals.bpSystolic}/{patient.vitals.bpDiastolic}
                  </b>
                </div>
                <div className="ow-vital-chip">
                  <small>{isAr ? 'الأكسجين SpO2' : 'SpO2'}</small>
                  <b>{patient.vitals.spo2Pct}%</b>
                </div>
              </div>
            ) : (
              <div className="ow-vitals-locked">
                {isAr
                  ? 'لم يتم قياس العلامات الحيوية بعد. تأكد من الهوية ثم استخدم حقيبة العلامات الحيوية للقياس.'
                  : 'Vital signs not measured yet. Confirm patient identity first, then measure vitals.'}
              </div>
            )}

            <div className="ow-action-btn-group">
              <button
                type="button"
                className={`ow-step-btn ${patientState.identityConfirmed ? 'done' : ''}`}
                onClick={() => {
                  onPatientAction(patient.id, 'confirm_id');
                  setFeedbackMsg(
                    isAr
                      ? '✓ تم تقديم نفسك والتأكد من اسم المريض ورقم السوار الطبي.'
                      : '✓ Introduced yourself and verified patient name & wristband ID.',
                  );
                }}
              >
                {patientState.identityConfirmed ? '✅ ' : '1️⃣ '}
                {isAr ? 'تقديم النفس وتأكيد هوية المريض' : 'Introduce & Confirm Identity'}
              </button>

              <button
                type="button"
                className={`ow-step-btn ${patientState.symptomsAsked ? 'done' : ''}`}
                onClick={() => {
                  onPatientAction(patient.id, 'ask_symptoms');
                  setFeedbackMsg(
                    isAr
                      ? '✓ تم سؤال المريض عن الأعراض وتفاصيل الشكوى.'
                      : '✓ Asked patient about symptoms and clinical history.',
                  );
                }}
              >
                {patientState.symptomsAsked ? '✅ ' : '2️⃣ '}
                {isAr ? 'سؤال المريض عن الأعراض' : 'Ask About Symptoms'}
              </button>

              <button
                type="button"
                className={`ow-step-btn ${patientState.vitalsMeasured ? 'done' : ''}`}
                onClick={() => {
                  if (!patientState.identityConfirmed) {
                    setFeedbackMsg(
                      isAr
                        ? '⚠️ يرجى تأكيد هوية المريض أولاً قبل قياس العلامات الحيوية!'
                        : '⚠️ Please confirm patient identity first before measuring vitals!',
                    );
                    return;
                  }
                  if (!hasVitalsTool && patient.id === 'patient-triage') {
                    setFeedbackMsg(
                      isAr
                        ? '⚠️ التقط حقيبة العلامات الحيوية من مكتب الفرز أولاً لقياس علامات هذا المريض!'
                        : '⚠️ Pick up the Vital Signs Kit from the Triage Desk first!',
                    );
                    return;
                  }
                  onPatientAction(patient.id, 'measure_vitals');
                  setFeedbackMsg(
                    isAr
                      ? '✓ تم قياس الحرارة والنبض والتنفس والضغط وتشبع الأكسجين SpO2.'
                      : '✓ Measured Temperature, Pulse, Respiratory Rate, BP, and SpO2.',
                  );
                }}
              >
                {patientState.vitalsMeasured ? '✅ ' : '3️⃣ '}
                {isAr ? 'قياس العلامات الحيوية الخمس' : 'Measure 5 Vital Signs'}
              </button>

              <button
                type="button"
                className={`ow-step-btn ${patientState.chartRecorded ? 'done' : ''}`}
                onClick={() => {
                  if (!patientState.vitalsMeasured) {
                    setFeedbackMsg(
                      isAr
                        ? '⚠️ قِس العلامات الحيوية أولاً قبل توثيق السجل التمريضي!'
                        : '⚠️ Measure vital signs first before recording in the nursing chart!',
                    );
                    return;
                  }
                  onPatientAction(patient.id, 'record_chart');
                  setFeedbackMsg(
                    isAr
                      ? '✓ تم توثيق نتائج التقييم في السجل التمريضي للمريض.'
                      : '✓ Assessment results documented in the patient nursing record.',
                  );
                }}
              >
                {patientState.chartRecorded ? '✅ ' : '4️⃣ '}
                {isAr ? 'توثيق نتائج التقييم بالسجل' : 'Record Assessment in Chart'}
              </button>

              <button
                type="button"
                className={`ow-step-btn ${patientState.comfortProvided ? 'done' : ''}`}
                onClick={() => {
                  onPatientAction(patient.id, 'provide_comfort');
                  setFeedbackMsg(
                    isAr
                      ? '✓ تم تقديم الرعاية التمريضية المساندة وطمأنة المريض.'
                      : '✓ Provided supportive nursing comfort and positioning.',
                  );
                }}
              >
                {patientState.comfortProvided ? '✅ ' : '5️⃣ '}
                {isAr
                  ? patient.id === 'patient-deterioration'
                    ? 'تقديم الأكسجين المساند والوضعية الآمنة'
                    : 'تقديم الرعاية والمساندة التمريضية'
                  : patient.id === 'patient-deterioration'
                    ? 'Provide Supportive Oxygen & Positioning'
                    : 'Provide Comfort & Basic Assistance'}
              </button>

              <button
                type="button"
                className={`ow-step-btn ow-escalate-btn ${patientState.escalatedToTeam ? 'done' : ''}`}
                onClick={() => {
                  if (!patientState.vitalsMeasured) {
                    setFeedbackMsg(
                      isAr
                        ? '⚠️ قِس العلامات الحيوية أولاً لتقديم بلاغ سريري دقيق للفريق الطبي!'
                        : '⚠️ Measure vital signs first to provide an accurate escalation report!',
                    );
                    return;
                  }
                  onPatientAction(patient.id, 'escalate_team');
                  setFeedbackMsg(
                    isAr
                      ? '🚨 تم إبلاغ الممرضة المسؤولة والطبيب المناوب بتطورات حالة المريض!'
                      : '🚨 Notified Charge Nurse and Physician of patient clinical status!',
                  );
                }}
              >
                {patientState.escalatedToTeam ? '✅ ' : '🚨 '}
                {isAr ? 'إبلاغ الفريق الطبي / تصعيد الحالة' : 'Notify Clinical Team / Escalate'}
              </button>
            </div>
          </section>
        </div>

        {/* Specialized Mission Actions for Radiology, Lab Specimen, or Medication Safety */}
        {patient.id === 'patient-radiology' && (
          <section className="ow-workflow-banner">
            <div>
              <b>🩻 {isAr ? 'سير عمل الأشعة السينية (X-Ray Workflow):' : 'Radiology X-Ray Workflow:'}</b>
              <p>
                {isAr
                  ? 'استلم ملف طلب الأشعة (#XR-204) الخاص بالمريض طارق وتوجه به إلى قسم الأشعة لتشغيل التصوير.'
                  : 'Collect Tariq’s Chest X-Ray Requisition Chart (#XR-204) and take it to the Radiology workstation.'}
              </p>
            </div>
            <button
              type="button"
              className="ow-primary"
              onClick={() => {
                onPatientAction(patient.id, 'pickup_xray_order');
                setFeedbackMsg(
                  isAr
                    ? '📁 استلمت ملف طلب الأشعة #XR-204! توجه الآن إلى قسم الأشعة.'
                    : '📁 Collected X-Ray Requisition #XR-204! Head to Radiology now.',
                );
              }}
            >
              📁 {isAr ? 'استلام وحمل طلب الأشعة #XR-204' : 'Pick Up X-Ray Order #XR-204'}
            </button>
          </section>
        )}

        {patient.id === 'patient-lab' && (
          <section className="ow-workflow-banner">
            <div>
              <b>🧪 {isAr ? 'سير عمل سحب العينة المعقمة للمعمل:' : 'Laboratory Specimen Collection:'}</b>
              <p>
                {isAr
                  ? 'تأكد من حمل عبوة العينة المعقمة (#LB-309) وتأكيد هوية المريضة سلمى قبل سحب العينة.'
                  : 'Ensure you have Sterile Container #LB-309 and confirmed Salma’s identity before collecting the specimen.'}
              </p>
            </div>
            <button
              type="button"
              className="ow-primary"
              onClick={() => {
                if (!patientState.identityConfirmed) {
                  setFeedbackMsg(
                    isAr
                      ? '⚠️ أكد هوية المريضة سلمى أولاً قبل سحب العينة!'
                      : '⚠️ Confirm patient Salma’s identity before collecting the specimen!',
                  );
                  return;
                }
                if (!hasSterileContainer && !patientState.specimenCollected) {
                  setFeedbackMsg(
                    isAr
                      ? '⚠️ يجب إحضار عبوة العينة المعقمة (#LB-309) من المعمل المركزي أولاً!'
                      : '⚠️ You must bring Labeled Sterile Container #LB-309 from the Central Lab first!',
                  );
                  return;
                }
                onPatientAction(patient.id, 'collect_specimen');
                setFeedbackMsg(
                  isAr
                    ? '🧫 تم سحب العينة المعقمة #LB-309 بنجاح! انقلها الآن إلى جهاز التحليل بالمعمل.'
                    : '🧫 Collected sterile specimen #LB-309! Transport it to the Central Lab workstation.',
                );
              }}
            >
              {patientState.specimenCollected
                ? isAr
                  ? '✅ تم سحب العينة (#LB-309)'
                  : '✅ Specimen Collected (#LB-309)'
                : isAr
                  ? '🧫 سحب وتأكيد العينة المعقمة #LB-309'
                  : '🧫 Collect Sterile Specimen #LB-309'}
            </button>
          </section>
        )}

        {patient.medicationOrder && (
          <section className="ow-med-safety-box">
            <h3>
              💊{' '}
              {isAr
                ? 'التحقق من سلامة الدواء والحقوق الخمسة (Medication Safety Check)'
                : 'Medication Administration & 5-Rights Safety Verification'}
            </h3>
            <div className="ow-med-order-summary">
              <span>
                <b>{isAr ? 'الأمر الأولي:' : 'Initial Order:'}</b>{' '}
                {pick(patient.medicationOrder.initialMedication, lang)} ({patient.medicationOrder.initialDose})
              </span>
              <span>
                <b>{isAr ? 'الطريق والوقت:' : 'Route & Time:'}</b>{' '}
                {pick(patient.medicationOrder.initialRoute, lang)} • {patient.medicationOrder.scheduledTime}
              </span>
            </div>

            {!workflowFlags.allergyDiscrepancyBlocked ? (
              <div className="ow-allergy-stop-card">
                <p>{pick(patient.medicationOrder.allergyNote, lang)}</p>
                <button
                  type="button"
                  className="ow-danger-btn"
                  onClick={() => {
                    onPatientAction(patient.id, 'block_allergy_med');
                    setFeedbackMsg(
                      isAr
                        ? '🛑 أحسنت! تم حظر إعطاء الأموكسيسيلين بسبب حساسية البنسلين وإبلاغ الصيدلية لصرف البديل الآمن (أزيثروميسين).'
                        : '🛑 Excellent! Blocked Amoxicillin due to Penicillin allergy and notified Pharmacy to dispense safe Azithromycin.',
                    );
                  }}
                >
                  🛑{' '}
                  {isAr
                    ? 'إيقاف إعطاء البنسلين والإبلاغ عن تعارض الحساسية'
                    : 'Block Penicillin Administration & Report Allergy Discrepancy'}
                </button>
              </div>
            ) : (
              <div className="ow-safe-med-panel">
                <p className="ow-safe-order-line">
                  ✅{' '}
                  <b>
                    {isAr ? 'الأمر البديل المعتمد:' : 'Approved Safe Alternative:'}{' '}
                    {pick(patient.medicationOrder.safeAlternativeMedication, lang)}
                  </b>{' '}
                  ({patient.medicationOrder.safeAlternativeDose})
                </p>
                <div className="ow-rights-checklist">
                  <label>
                    <input
                      type="checkbox"
                      checked={fiveRightsChecked.rightPatient}
                      onChange={() => toggleRight('rightPatient')}
                    />
                    {isAr ? 'المريض الصحيح (PT-412 محمود درويش)' : 'Right Patient (PT-412 Mahmoud Darwish)'}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={fiveRightsChecked.rightDrug}
                      onChange={() => toggleRight('rightDrug')}
                    />
                    {isAr ? 'الدواء الآمن الصحيح (أزيثروميسين — خالٍ من البنسلين)' : 'Right Drug (Azithromycin — Non-Penicillin)'}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={fiveRightsChecked.rightDose}
                      onChange={() => toggleRight('rightDose')}
                    />
                    {isAr ? 'الجرعة الصحيحة (500 ملجم)' : 'Right Dose (500 mg)'}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={fiveRightsChecked.rightRoute}
                      onChange={() => toggleRight('rightRoute')}
                    />
                    {isAr ? 'طريق الإعطاء الصحيح (فموي PO)' : 'Right Route (Oral PO)'}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={fiveRightsChecked.rightTime}
                      onChange={() => toggleRight('rightTime')}
                    />
                    {isAr ? 'الوقت والتوثيق الصحيح' : 'Right Time & Documentation'}
                  </label>
                </div>

                <button
                  type="button"
                  className="ow-primary"
                  disabled={patientState.medicationAdministered}
                  onClick={() => {
                    if (!hasSafeMed) {
                      setFeedbackMsg(
                        isAr
                          ? '⚠️ توجه إلى الصيدلية أولاً واستلم عبوة الأزيثروميسين الآمنة!'
                          : '⚠️ Visit the Hospital Pharmacy first and pick up the safe Azithromycin package!',
                      );
                      return;
                    }
                    if (!allFiveRightsVerified) {
                      setFeedbackMsg(
                        isAr
                          ? '⚠️ يرجى التأشير على جميع بنود الحقوق الخمسة (5 Rights) قبل تسجيل الإعطاء!'
                          : '⚠️ Please check all 5 Rights verification boxes before recording administration!',
                      );
                      return;
                    }
                    onPatientAction(patient.id, 'administer_safe_med');
                    setFeedbackMsg(
                      isAr
                        ? '✅ تم إعطاء الدواء البديل الآمن وتوثيقه في ملف المريض بنجاح!'
                        : '✅ Safe alternative medication administered and documented in patient chart!',
                    );
                  }}
                >
                  {patientState.medicationAdministered
                    ? isAr
                      ? '✅ تم إعطاء وتوثيق الدواء الآمن'
                      : '✅ Safe Medication Administered & Logged'
                    : isAr
                      ? '💊 تأكيد الحقوق الخمسة وتسجيل إعطاء الأزيثروميسين'
                      : '💊 Confirm 5 Rights & Record Safe Administration'}
                </button>
              </div>
            )}
          </section>
        )}

        {feedbackMsg && <div className="ow-modal-feedback">{feedbackMsg}</div>}
      </div>
    </div>
  );
}

interface WorkstationModalProps {
  lang: Lang;
  workstation: WorkstationDef;
  carriedItemId: EquipmentId | null;
  inventory: EquipmentId[];
  placedItems: Record<string, EquipmentId[]>;
  patientStates: Record<string, PatientSimState>;
  workflowFlags: OpenWorldWorkflowFlags;
  onClose: () => void;
  onPickUpEquipment: (eqId: EquipmentId) => void;
  onPlaceCarriedItem: (workstationId: string) => void;
  onCompleteWorkstationAction: (
    action:
      | 'run_xray_study'
      | 'report_xray_at_station'
      | 'submit_lab_specimen'
      | 'prep_treatment_area'
      | 'restock_er_supplies'
      | 'log_restock_at_station'
      | 'alert_deterioration_er'
      | 'complete_sbar_handover',
  ) => void;
}

export function OpenWorldWorkstationModal({
  lang,
  workstation,
  carriedItemId,
  inventory,
  placedItems,
  patientStates,
  workflowFlags,
  onClose,
  onPickUpEquipment,
  onPlaceCarriedItem,
  onCompleteWorkstationAction,
}: WorkstationModalProps) {
  const isAr = lang === 'ar';
  const [wsNotice, setWsNotice] = useState<string>('');

  const availableEquipmentHere = HOSPITAL_EQUIPMENT_ITEMS.filter(
    (item) =>
      item.spawnWorkstationId === workstation.id &&
      item.id !== 'eq-collected-specimen',
  );

  const carriedDef = HOSPITAL_EQUIPMENT_ITEMS.find((e) => e.id === carriedItemId) || null;
  const placedHere = (placedItems[workstation.id] || [])
    .map((id) => HOSPITAL_EQUIPMENT_ITEMS.find((e) => e.id === id))
    .filter(Boolean);

  return (
    <div className="ow-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ow-clinical-modal" dir={isAr ? 'rtl' : 'ltr'}>
        <header className="ow-modal-head">
          <div>
            <span className="ow-sim-badge">
              {isAr
                ? '⚠️ محطة عمل تدريبية محاكاة — لأغراض التعلم فقط'
                : '⚠️ SIMULATED CLINICAL WORKSTATION — EDUCATIONAL USE ONLY'}
            </span>
            <h2>
              {workstation.icon} {pick(workstation.name, lang)}
            </h2>
            <p className="ow-room-sub">{pick(workstation.promptLabel, lang)}</p>
          </div>
          <button type="button" className="ow-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {/* Equipment Pickup & Placement Bar */}
        <section className="ow-modal-card">
          <h3>🧰 {isAr ? 'المعدات والمستلزمات المتاحة في هذه المحطة' : 'Equipment & Supplies at This Station'}</h3>
          <div className="ow-eq-list">
            {availableEquipmentHere.map((eq) => {
              const isCarried = carriedItemId === eq.id;
              return (
                <div key={eq.id} className="ow-eq-row">
                  <div>
                    <b>
                      {eq.icon} {pick(eq.name, lang)}
                    </b>
                    <small>{pick(eq.description, lang)}</small>
                  </div>
                  <button
                    type="button"
                    className={`ow-step-btn ${isCarried ? 'done' : ''}`}
                    onClick={() => {
                      onPickUpEquipment(eq.id);
                      setWsNotice(
                        isAr
                          ? `🤲 أنت تحمل الآن: ${eq.shortLabel.ar}`
                          : `🤲 You are now carrying: ${eq.shortLabel.en}`,
                      );
                    }}
                  >
                    {isCarried
                      ? isAr
                        ? '✓ في يدك الآن'
                        : '✓ Carrying Now'
                      : isAr
                        ? '🤲 التقاط وحمل'
                        : '🤲 Pick Up & Carry'}
                  </button>
                </div>
              );
            })}
          </div>

          {carriedDef && (
            <div className="ow-place-strip">
              <span>
                {isAr ? 'المعدة المحمولة حالياً:' : 'Currently carrying:'}{' '}
                <b>
                  {carriedDef.icon} {pick(carriedDef.shortLabel, lang)}
                </b>
              </span>
              <button
                type="button"
                className="ow-step-btn"
                onClick={() => {
                  onPlaceCarriedItem(workstation.id);
                  setWsNotice(
                    isAr
                      ? `📥 تم وضع «${carriedDef.shortLabel.ar}» في هذه المحطة.`
                      : `📥 Placed "${carriedDef.shortLabel.en}" at this workstation.`,
                  );
                }}
              >
                📥 {isAr ? 'وضع المعدة هنا' : 'Place Item Here'}
              </button>
            </div>
          )}

          {placedHere.length > 0 && (
            <div className="ow-placed-tags">
              <small>{isAr ? 'معدات موضوعة هنا:' : 'Items placed here:'}</small>
              {placedHere.map((eq) =>
                eq ? (
                  <span key={eq.id} className="ow-tag-pill">
                    {eq.icon} {pick(eq.shortLabel, lang)}
                  </span>
                ) : null,
              )}
            </div>
          )}
        </section>

        {/* Specialized Department Workflows */}
        {workstation.kind === 'xray_console' && (
          <section className="ow-modal-card">
            <h3>🩻 {isAr ? 'عارض أشعة الصدر المحاكى (Simulated Chest X-Ray Viewer)' : 'Simulated Chest Radiography Console'}</h3>
            <p>
              {isAr
                ? 'المريض المطلوب: طارق المنصور (PT-204) • رقم الطلب: #XR-204'
                : 'Target Patient: Tariq Al-Mansour (PT-204) • Requisition: #XR-204'}
            </p>
            <button
              type="button"
              className="ow-primary"
              onClick={() => {
                const hasOrder =
                  carriedItemId === 'eq-xray-request-chart' ||
                  inventory.includes('eq-xray-request-chart') ||
                  (placedItems['ws-xray-console'] || []).includes('eq-xray-request-chart');
                if (!hasOrder && !workflowFlags.xrayStudyReady) {
                  setWsNotice(
                    isAr
                      ? '⚠️ خطأ في التحقق: يجب استلام وإحضار ملف طلب الأشعة (#XR-204) الخاص بالمريض طارق المنصور أولاً!'
                      : '⚠️ Validation Error: You must bring Patient Tariq’s X-Ray Requisition Chart (#XR-204) first!',
                  );
                  return;
                }
                onCompleteWorkstationAction('run_xray_study');
                setWsNotice(
                  isAr
                    ? '✅ اكتملت دراسة أشعة الصدر المحاكاة! راجع الصورة التشخيصية بالأسفل ثم أبلغ الفريق الطبي في محطة التمريض.'
                    : '✅ Simulated Chest X-Ray study completed! Review the mock image below, then report findings at the Nursing Station.',
                );
              }}
            >
              {workflowFlags.xrayStudyReady
                ? isAr
                  ? '✅ تم إجراء أشعة الصدر (#XR-204)'
                  : '✅ Chest X-Ray Study Ready (#XR-204)'
                : isAr
                  ? '🩻 التحقق من الطلب #XR-204 وتشغيل أشعة الصدر'
                  : '🩻 Verify Order #XR-204 & Run Chest X-Ray'}
            </button>

            {workflowFlags.xrayStudyReady && (
              <div className="ow-xray-viewer">
                <svg viewBox="0 0 360 220" className="ow-xray-svg" role="img" aria-label="Educational Mock Chest X-Ray">
                  <rect width="360" height="220" rx="12" fill="#090d16" />
                  <text x="14" y="22" fill="#38bdf8" fontSize="10" fontWeight="bold">
                    EDUCATIONAL SIMULATION ONLY • NOT FOR CLINICAL DIAGNOSIS • PT-204 (#XR-204)
                  </text>
                  {/* Simulated Thoracic Cage & Lungs */}
                  <ellipse cx="140" cy="115" rx="46" ry="68" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                  <ellipse cx="220" cy="115" rx="46" ry="68" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                  <rect x="175" y="45" width="10" height="145" rx="4" fill="#94a3b8" opacity="0.65" />
                  {/* Rib arcs */}
                  {[68, 88, 108, 128, 148].map((ry, idx) => (
                    <g key={idx} stroke="#94a3b8" strokeWidth="2" opacity="0.45" fill="none">
                      <path d={`M 98 ${ry} Q 140 ${ry - 10} 175 ${ry}`} />
                      <path d={`M 185 ${ry} Q 220 ${ry - 10} 262 ${ry}`} />
                    </g>
                  ))}
                  {/* Simulated Right Lower Lobe Consolidation */}
                  <ellipse cx="132" cy="148" rx="32" ry="24" fill="#f8fafc" opacity="0.58" />
                  <circle cx="132" cy="148" r="28" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" />
                  <text x="18" y="204" fill="#fbbf24" fontSize="11" fontWeight="bold">
                    {isAr
                      ? 'النتيجة المحاكاة: تكثف بالفص السفلي الأيمن (التهاب رئوي بكتيري فصي)'
                      : 'SIMULATED FINDING: Right Lower Lobe Consolidation (Bacterial Pneumonia)'}
                  </text>
                </svg>
              </div>
            )}
          </section>
        )}

        {workstation.kind === 'lab_analyzer' && (
          <section className="ow-modal-card">
            <h3>🔬 {isAr ? 'وحدة تحليل العينات والمزرعة البكتيرية (AST)' : 'Specimen Receiving & Bacterial Susceptibility (AST)'}</h3>
            <p>
              {isAr
                ? 'المريضة المطلوبة: سلمى الكيلاني (PT-309) • كود العينة: #LB-309'
                : 'Target Patient: Salma Al-Kilani (PT-309) • Specimen Code: #LB-309'}
            </p>
            <button
              type="button"
              className="ow-primary"
              onClick={() => {
                const hasCollectedSample =
                  carriedItemId === 'eq-collected-specimen' ||
                  inventory.includes('eq-collected-specimen') ||
                  Boolean(patientStates['patient-lab']?.specimenCollected);

                if (!hasCollectedSample) {
                  setWsNotice(
                    isAr
                      ? '⚠️ رفض استلام: يجب سحب العينة المعقمة (#LB-309) من المريضة سلمى الكيلاني (PT-309) أولاً قبل تسليمها للمعمل!'
                      : '⚠️ Validation Rejected: You must collect Specimen #LB-309 from patient Salma Al-Kilani (PT-309) first!',
                  );
                  return;
                }
                onCompleteWorkstationAction('submit_lab_specimen');
                setWsNotice(
                  isAr
                    ? '✅ تم التحقق من تطابق العينة #LB-309 وإصدار نتيجة اختبار الحساسية للمضادات (AST)!'
                    : '✅ Verified Specimen #LB-309 match and generated Antibiotic Susceptibility (AST) report!',
                );
              }}
            >
              {workflowFlags.labResultReviewed
                ? isAr
                  ? '✅ تم تسليم العينة (#LB-309) وإصدار نتيجة المزرعة'
                  : '✅ Specimen #LB-309 Verified & AST Result Ready'
                : isAr
                  ? '🧪 تسليم العينة المسحوبة #LB-309 وتشغيل المزرعة'
                  : '🧪 Submit Collected Specimen #LB-309 & Run AST'}
            </button>

            {workflowFlags.labResultReviewed && (
              <div className="ow-lab-report">
                <b>📊 {isAr ? 'تقرير الحساسية البكتيرية المحاكى (AST — PT-309):' : 'Simulated AST Culture Report (PT-309):'}</b>
                <ul>
                  <li>
                    <span>Amoxicillin / Ampicillin:</span>{' '}
                    <b className="ow-res-r">{isAr ? 'مقاوم (Resistant - R)' : 'Resistant (R)'}</b>
                  </li>
                  <li>
                    <span>Nitrofurantoin / Fosfomycin:</span>{' '}
                    <b className="ow-res-s">{isAr ? 'حساس وموجّه (Susceptible - S ✓)' : 'Susceptible (S ✓)'}</b>
                  </li>
                </ul>
              </div>
            )}
          </section>
        )}

        {workstation.kind === 'treatment_table' && (
          <section className="ow-modal-card">
            <h3>🧼 {isAr ? 'تجهيز وتعقيم منطقة العلاج' : 'Prepare & Disinfect Sterile Treatment Area'}</h3>
            <button
              type="button"
              className="ow-primary"
              onClick={() => {
                const hasTray =
                  carriedItemId === 'eq-sterile-dressing-kit' ||
                  inventory.includes('eq-sterile-dressing-kit') ||
                  (placedItems['ws-treatment-table'] || []).includes('eq-sterile-dressing-kit');
                if (!hasTray && !workflowFlags.treatmentAreaDisinfected) {
                  setWsNotice(
                    isAr
                      ? '⚠️ أحضر صينية التعقيم والضماد من غرفة المستلزمات الطبية أولاً!'
                      : '⚠️ Bring the Sterile Antiseptic & Dressing Tray from the Medical Supply Room first!',
                  );
                  return;
                }
                onCompleteWorkstationAction('prep_treatment_area');
                setWsNotice(
                  isAr
                    ? '✅ تم تطهير وتعقيم طاولة الفحص! يمكنك الآن تضميد ورعاية المريضة نورا حسن (PT-518).'
                    : '✅ Treatment area disinfected and prepared! You can now care for patient Noura Hassan (PT-518).',
                );
              }}
            >
              {workflowFlags.treatmentAreaDisinfected
                ? isAr
                  ? '✅ منطقة العلاج معقمة وجاهزة'
                  : '✅ Treatment Area Sterilized & Ready'
                : isAr
                  ? '🧼 تعقيم وتجهيز سرير الفحص بصينية الضماد'
                  : '🧼 Disinfect & Prepare Treatment Table'}
            </button>
          </section>
        )}

        {workstation.kind === 'er_supply_cart' && (
          <section className="ow-modal-card">
            <h3>📦 {isAr ? 'إعادة تموين عربة مستلزمات الطوارئ' : 'Restock Emergency Department Supply Cart'}</h3>
            <button
              type="button"
              className="ow-primary"
              onClick={() => {
                const hasBox =
                  carriedItemId === 'eq-supply-box' ||
                  inventory.includes('eq-supply-box') ||
                  (placedItems['ws-er-supply-cart'] || []).includes('eq-supply-box');
                if (!hasBox && !workflowFlags.erSuppliesRestocked) {
                  setWsNotice(
                    isAr
                      ? '⚠️ التقط صندوق المستلزمات التمريضية من غرفة الإمدادات أولاً!'
                      : '⚠️ Pick up the Nursing Medical Supply Box from the Supply Room first!',
                  );
                  return;
                }
                onCompleteWorkstationAction('restock_er_supplies');
                setWsNotice(
                  isAr
                    ? '✅ تم تفريغ صندوق المستلزمات وتزويد قسم الطوارئ بالقفازات والمحاليل والشاش المعقم!'
                    : '✅ Restocked ER Supply Cart with sterile gloves, saline, and gauze!',
                );
              }}
            >
              {workflowFlags.erSuppliesRestocked
                ? isAr
                  ? '✅ تم تموين عربة الطوارئ بالكامل'
                  : '✅ ER Supply Cart Fully Restocked'
                : isAr
                  ? '📦 تسليم وتفريغ صندوق المستلزمات التمريضية'
                  : '📦 Deliver & Restock Nursing Supply Box'}
            </button>
          </section>
        )}

        {workstation.kind === 'triage_desk' && (
          <section className="ow-modal-card">
            <h3>🚨 {isAr ? 'تأكيد استجابة فريق الطوارئ السريعة' : 'Emergency Rapid Response Team Console'}</h3>
            <button
              type="button"
              className="ow-primary"
              onClick={() => {
                const ptCrit = patientStates['patient-deterioration'];
                if (!ptCrit?.vitalsMeasured || !ptCrit?.escalatedToTeam) {
                  setWsNotice(
                    isAr
                      ? '⚠️ افحص المريض الحرج كريم عبد الله (PT-602) وقس علاماته وصعّد الحالة من سريره أولاً!'
                      : '⚠️ Assess critical patient Karim Abdullah (PT-602) and escalate from his bedside first!',
                  );
                  return;
                }
                onCompleteWorkstationAction('alert_deterioration_er');
                setWsNotice(
                  isAr
                    ? '✅ تم توثيق استلام فريق الاستجابة السريعة لحالة المريض كريم عبد الله (PT-602)!'
                    : '✅ Confirmed Rapid Response Team intervention for critical patient Karim Abdullah (PT-602)!',
                );
              }}
            >
              {workflowFlags.deteriorationAlertedAtStation
                ? isAr
                  ? '✅ تم توثيق استجابة الطوارئ للحالة الحرجة'
                  : '✅ Rapid Response Escalation Logged'
                : isAr
                  ? '🚨 تأكيد بلاغ التدهور الحرج (PT-602) لفريق الطوارئ'
                  : '🚨 Confirm Critical Deterioration Alert (PT-602)'}
            </button>
          </section>
        )}

        {workstation.kind === 'nursing_station' && (
          <section className="ow-modal-card">
            <h3>📋 {isAr ? 'عمليات محطة التمريض المركزية وتسليم المناوبة (SBAR)' : 'Central Nursing Station & SBAR Shift Handover'}</h3>
            <div className="ow-action-btn-group">
              <button
                type="button"
                className={`ow-step-btn ${workflowFlags.xrayReportedToClinician ? 'done' : ''}`}
                onClick={() => {
                  if (!workflowFlags.xrayStudyReady) {
                    setWsNotice(
                      isAr
                        ? '⚠️ يجب إتمام تصوير أشعة الصدر (#XR-204) في قسم الأشعة أولاً قبل إبلاغ الطبيب!'
                        : '⚠️ Complete the Chest X-Ray study (#XR-204) in Radiology first!',
                    );
                    return;
                  }
                  onCompleteWorkstationAction('report_xray_at_station');
                  setWsNotice(
                    isAr
                      ? '✓ تم إبلاغ الطبيب المعالج بنتيجة أشعة الصدر للمريض طارق المنصور (PT-204).'
                      : '✓ Reported Chest X-Ray findings for patient Tariq Al-Mansour (PT-204) to clinician.',
                  );
                }}
              >
                {workflowFlags.xrayReportedToClinician ? '✅ ' : '🩻 '}
                {isAr ? 'إبلاغ الطبيب بنتيجة أشعة الصدر (#XR-204)' : 'Report Chest X-Ray Result (#XR-204) to Clinician'}
              </button>

              <button
                type="button"
                className={`ow-step-btn ${workflowFlags.restockLoggedAtStation ? 'done' : ''}`}
                onClick={() => {
                  if (!workflowFlags.erSuppliesRestocked) {
                    setWsNotice(
                      isAr
                        ? '⚠️ سلّم صندوق المستلزمات إلى عربة الطوارئ أولاً قبل التوثيق!'
                        : '⚠️ Deliver the Supply Box to the ER Supply Cart first before logging!',
                    );
                    return;
                  }
                  onCompleteWorkstationAction('log_restock_at_station');
                  setWsNotice(
                    isAr
                      ? '✓ تم تسجيل إتمام تموين المستلزمات التمريضية في سجل المحطة.'
                      : '✓ Logged completed ER supply restock in the central station register.',
                  );
                }}
              >
                {workflowFlags.restockLoggedAtStation ? '✅ ' : '📦 '}
                {isAr ? 'توثيق إعادة تموين المستلزمات التمريضية' : 'Log Nursing Supply Restock Completion'}
              </button>

              <button
                type="button"
                className={`ow-step-btn ${workflowFlags.deteriorationAlertedAtStation ? 'done' : ''}`}
                onClick={() => {
                  const ptCrit = patientStates['patient-deterioration'];
                  if (!ptCrit?.vitalsMeasured || !ptCrit?.escalatedToTeam) {
                    setWsNotice(
                      isAr
                        ? '⚠️ قيّم المريض كريم عبد الله (PT-602) وصعّد حالته من سريره أولاً!'
                        : '⚠️ Assess patient Karim Abdullah (PT-602) and escalate at bedside first!',
                    );
                    return;
                  }
                  onCompleteWorkstationAction('alert_deterioration_er');
                  setWsNotice(
                    isAr
                      ? '✓ تم تسجيل بلاغ التدهور الحرج واستجابة الفريق الطبي.'
                      : '✓ Logged critical deterioration alert and rapid clinical team response.',
                  );
                }}
              >
                {workflowFlags.deteriorationAlertedAtStation ? '✅ ' : '🚨 '}
                {isAr ? 'توثيق تصعيد الحالة الحرجة (PT-602)' : 'Document Critical Escalation (PT-602)'}
              </button>

              <button
                type="button"
                className={`ow-step-btn ${workflowFlags.sbarHandoverCompleted ? 'done' : ''}`}
                onClick={() => {
                  const hasBinder =
                    carriedItemId === 'eq-sbar-handover-binder' ||
                    inventory.includes('eq-sbar-handover-binder');
                  if (!hasBinder) {
                    setWsNotice(
                      isAr
                        ? '⚠️ التقط سجل تسليم المناوبة التمريضية (SBAR Binder) من المحطة أولاً!'
                        : '⚠️ Pick up the SBAR Shift Handover Binder at the station first!',
                    );
                    return;
                  }
                  onCompleteWorkstationAction('complete_sbar_handover');
                  setWsNotice(
                    isAr
                      ? '🎉 تم إتمام وتوقيع تسليم المناوبة التمريضية الشامل بنموذج SBAR بنجاح!'
                      : '🎉 Successfully completed and signed off the full SBAR Nursing Shift Handover!',
                  );
                }}
              >
                {workflowFlags.sbarHandoverCompleted ? '✅ ' : '📋 '}
                {isAr ? 'إتمام تسليم المناوبة التمريضية الشامل (SBAR)' : 'Complete Full SBAR Nursing Shift Handover'}
              </button>
            </div>

            <div className="ow-sbar-summary">
              <b>📊 {isAr ? 'ملخص حالات المرضى بالمناوبة:' : 'Shift Patient Status Overview:'}</b>
              <div className="ow-sbar-grid">
                {HOSPITAL_PATIENTS.map((p) => {
                  const st = patientStates[p.id];
                  return (
                    <div key={p.id} className="ow-sbar-item">
                      <span>
                        <b>{p.patientCode}</b> {pick(p.name, lang)}
                      </span>
                      <small>{isAr ? st?.statusNoteAr : st?.statusNoteEn}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {wsNotice && <div className="ow-modal-feedback">{wsNotice}</div>}
      </div>
    </div>
  );
}

export function OpenWorldStaffModal({
  lang,
  staff,
  onClose,
}: {
  lang: Lang;
  staff: StaffNpcDef;
  onClose: () => void;
}) {
  const isAr = lang === 'ar';
  return (
    <div className="ow-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ow-clinical-modal ow-staff-modal" dir={isAr ? 'rtl' : 'ltr'}>
        <header className="ow-modal-head">
          <div>
            <span className="ow-sim-badge">{pick(staff.roleTitle, lang)}</span>
            <h2>
              {staff.icon} {pick(staff.name, lang)}
            </h2>
          </div>
          <button type="button" className="ow-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <p className="ow-staff-quote">{pick(staff.greeting, lang)}</p>
        <button type="button" className="ow-primary" onClick={onClose}>
          {isAr ? 'متابعة المناوبة' : 'Continue Shift'}
        </button>
      </div>
    </div>
  );
}
