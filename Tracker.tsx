import { createPortal } from 'react-dom';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { useApproved } from './medicinesApi';
import { pick } from './types';
import {
  TreatmentSchedule,
  ScheduledDose,
  DoseStatus,
  useSyncedSchedules,
  useDoseReminderNotifications,
  generateScheduleDoses,
  getDoseStatus,
  calculateScheduleProgress,
  formatLocalDateYYYYMMDD,
  computeEndDate,
  calculateAutoDoseTimes,
  formatTime12Hour,
  formatTimestampReadable,
  formatRouteLabel,
  downloadScheduleIcs,
} from './trackerData';

export default function Tracker() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user, openAuthModal } = useAuth();
  const { items } = useApproved();
  const meds = items ?? [];

  const {
    schedules,
    setSchedules,
    deleteScheduleById,
    updateDoseStatus,
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
    activeDueBanner,
    setActiveDueBanner,
    requestNotifPermission,
  } = useDoseReminderNotifications(schedules, isAr);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string>(() => new Date().toISOString());

  // Form states
  const [medName, setMedName] = useState('');
  const [prescribedDose, setPrescribedDose] = useState('');
  const [route, setRoute] = useState('oral');
  const [firstDoseTime, setFirstDoseTime] = useState('08:00');
  const [frequency, setFrequency] = useState('twice_daily');
  const [doseTimes, setDoseTimes] = useState<string[]>(['08:00', '20:00']);
  const [startDate, setStartDate] = useState(() => formatLocalDateYYYYMMDD());
  const [durationDays, setDurationDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Auto-calculate all dose times when either First Dose Start Time or Frequency (dose count) changes
  const handleFirstDoseTimeChange = (newStart: string) => {
    setFirstDoseTime(newStart);
    setDoseTimes(calculateAutoDoseTimes(newStart, frequency));
  };

  const handleFrequencyChange = (freq: string) => {
    setFrequency(freq);
    setDoseTimes(calculateAutoDoseTimes(firstDoseTime, freq));
  };

  const handleTimeChange = (index: number, val: string) => {
    const updated = [...doseTimes];
    updated[index] = val;
    if (index === 0) {
      setFirstDoseTime(val);
    }
    setDoseTimes(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) {
      setFormError(
        isAr
          ? 'يرجى كتابة أو اختيار اسم الدواء الموصوف.'
          : 'Please enter or select the prescribed medicine name.'
      );
      return;
    }
    if (!prescribedDose.trim()) {
      setFormError(
        isAr
          ? 'يرجى كتابة الجرعة كما هي مكتوبة في الروشتة (مثال: قرص 1000 مجم).'
          : 'Please enter the prescribed dose as written on your prescription.'
      );
      return;
    }
    if (durationDays < 1 || durationDays > 60) {
      setFormError(
        isAr
          ? 'يرجى تحديد مدة الكورس بالأيام (بين 1 و 60 يوماً).'
          : 'Please enter a valid course duration (1–60 days).'
      );
      return;
    }

    setFormError('');
    const nowIso = new Date().toISOString();
    const id = editingScheduleId || `sch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const endDateStr = computeEndDate(startDate, durationDays);

    const existing = editingScheduleId ? schedules.find((s) => s.id === editingScheduleId) : undefined;
    const finalDoses = generateScheduleDoses(
      id,
      startDate,
      doseTimes,
      durationDays,
      existing?.doses
    );

    const newSchedule: TreatmentSchedule = {
      id,
      ...(existing?.antibioticId ? { antibioticId: existing.antibioticId } : {}),
      medicineName: medName.trim(),
      prescribedDose: prescribedDose.trim(),
      route,
      frequency,
      firstDoseTime,
      doseTimes,
      startDate,
      durationDays,
      endDate: endDateStr,
      notes: notes.trim(),
      ...(existing?.coMedications ? { coMedications: existing.coMedications } : {}),
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      doses: finalDoses,
    };

    if (editingScheduleId) {
      setSchedules((prev) => prev.map((s) => (s.id === editingScheduleId ? newSchedule : s)));
    } else {
      setSchedules((prev) => [newSchedule, ...prev]);
    }

    setShowAddModal(false);
    setEditingScheduleId(null);
    resetForm();
  };

  const resetForm = () => {
    setMedName('');
    setPrescribedDose('');
    setRoute('oral');
    setFirstDoseTime('08:00');
    setFrequency('twice_daily');
    setDoseTimes(['08:00', '20:00']);
    setStartDate(formatLocalDateYYYYMMDD());
    setDurationDays(7);
    setNotes('');
    setFormError('');
  };

  const openEdit = (sch: TreatmentSchedule) => {
    setEditingScheduleId(sch.id);
    setMedName(sch.medicineName);
    setPrescribedDose(sch.prescribedDose);
    setRoute(sch.route);
    setFirstDoseTime(sch.firstDoseTime || sch.doseTimes[0] || '08:00');
    setFrequency(sch.frequency);
    setDoseTimes(sch.doseTimes);
    setStartDate(sch.startDate);
    setDurationDays(sch.durationDays);
    setNotes(sch.notes || '');
    setShowAddModal(true);
  };

  const deleteSchedule = (id: string) => {
    if (
      window.confirm(
        isAr
          ? 'هل أنت متأكد من حذف هذا الجدول العلاجي؟'
          : 'Are you sure you want to delete this schedule?'
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

  return (
    <main className="wrap stack">
      <header className="page-head no-print">
        <h1>{isAr ? 'متابع كورس العلاج بالمضادات الحيوية' : 'My Antibiotic Treatment Tracker'}</h1>
        <p className="muted">
          {isAr
            ? 'أداة شخصية لمساعدتك في تنظيم ومتابعة مواعيد جرعات المضاد الحيوي الموصوفة لك ومزامنتها عبر جميع أجهزتك، وإكمال الكورس العلاجي بالكامل لمنع مقاومة البكتيريا.'
            : 'A personal patient-friendly tool to help you organize, track, and synchronize your prescribed antibiotic doses across all your devices.'}
        </p>
      </header>

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

      {/* Cloud Sync Status Bar */}
      <section className="no-print">
        {!isAuthenticated ? (
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
                  ? 'سجّل الدخول بحسابك لمزامنة جداولك العلاجية وسجل جرعاتك عبر جميع أجهزتك.'
                  : 'Sign in with your account to synchronize your schedules and dose history across devices.'}
              </p>
            </div>
            <button type="button" className="btn small" onClick={() => openAuthModal('login')}>
              🔐 {isAr ? 'تسجيل الدخول للمزامنة' : 'Sign In to Sync'}
            </button>
          </div>
        ) : syncStatus === 'loading' ? (
          <div className="radar-sync-bar loading">
            <strong>
              🔄{' '}
              {isAr
                ? 'جارٍ مزامنة وتحميل جداولك العلاجية من السحابة...'
                : 'Loading and syncing your cloud treatment schedules...'}
            </strong>
          </div>
        ) : syncStatus === 'saving' ? (
          <div className="radar-sync-bar saving">
            <strong>
              ⏳{' '}
              {isAr
                ? 'جارٍ حفظ التعديلات في السحابة...'
                : 'Saving changes to Cloud Firestore...'}
            </strong>
          </div>
        ) : syncStatus === 'offline_pending' ? (
          <div className="radar-sync-bar offline">
            <div>
              <strong>
                📡{' '}
                {isAr
                  ? 'محفوظ محلياً على هذا الجهاز — في انتظار الإنترنت لتأكيد الحفظ السحابي'
                  : 'Saved Locally — Waiting for Internet to Confirm Cloud Sync'}
              </strong>
            </div>
            <button type="button" className="btn-secondary small" onClick={retrySync}>
              🔄 {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : syncStatus === 'error' ? (
          <div className="radar-sync-bar error">
            <div>
              <strong>
                ⚠️{' '}
                {isAr
                  ? 'تعذر تأكيد الحفظ السحابي (محفوظ محلياً على هذا الجهاز فقط)'
                  : 'Cloud Sync Unconfirmed (Saved Locally on This Device Only)'}
              </strong>
              {syncError && <p className="small" style={{ margin: '2px 0 0' }}>{syncError}</p>}
            </div>
            <button type="button" className="btn-secondary small" onClick={retrySync}>
              🔄 {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : (
          <div className="radar-sync-bar synced">
            <strong>
              ☁️{' '}
              {isAr
                ? 'تم تأكيد المزامنة السحابية عبر أجهزتك ✓'
                : 'Confirmed Synced Across Your Devices ✓'}
            </strong>
            <span className="small" style={{ marginInlineStart: '10px' }}>
              ({user?.email || user?.displayName || (isAr ? 'حساب موثق' : 'Authenticated')}
              {lastSyncedAt ? ` · ${formatTimestampReadable(lastSyncedAt, isAr)}` : ''})
            </span>
          </div>
        )}
      </section>

      {/* Clinical safety disclaimer */}
      <section className="notice quick no-print">
        <strong>⚠️ {isAr ? 'تنبيه سريري مهم:' : 'Clinical Safety Note:'} </strong>
        {isAr
          ? 'هذه الأداة لتنظيم الجرعات الموصوفة لك فقط ولا تحدد جرعات أو مدة علاج أو بدائل دوائية بشكل مستقل. أي تعديل في الدواء أو الجرعة أو التعامل مع الجرعات الفائتة يجب أن يتم بمعرفة الطبيب المعالج أو الصيدلي.'
          : 'This tool tracks prescribed regimens only and never prescribes medicines, suggests antibiotic alternatives, or calculates replacement doses. Always consult your prescribing doctor or pharmacist.'}
      </section>

      {/* Controls & Notifs */}
      <div className="tracker-top-bar no-print">
        <div className="row wrapRow" style={{ gap: '8px' }}>
          <button
            type="button"
            className="btn"
            onClick={() => {
              resetForm();
              setEditingScheduleId(null);
              setShowAddModal(true);
            }}
          >
            ➕ {isAr ? 'إضافة جدول علاج جديد' : 'New Treatment Schedule'}
          </button>
          <Link to="/prescription-radar" className="btn-secondary">
            📡 {isAr ? 'فحص الروشتة الكاملة في الرادار' : 'Open Full Prescription Radar'}
          </Link>
          {schedules.length > 0 && (
            <button type="button" className="btn-secondary" onClick={handlePrintReport}>
              🖨️ {isAr ? 'طباعة التقرير العلاجي / PDF' : 'Print Treatment Report / PDF'}
            </button>
          )}
        </div>

        {notifSupported && (
          <div className="notif-bar">
            {notifPermission === 'granted' ? (
              <span className="notif-pill active">
                🔔 {isAr ? 'التنبيهات مفعلة أثناء فتح المتصفح' : 'Browser Notifications Active'}
              </span>
            ) : (
              <button type="button" className="btn-secondary" onClick={requestNotifPermission}>
                🔔 {isAr ? 'تفعيل تنبيهات المتصفح' : 'Enable Reminders'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reminder Limitations Notice (Priority 5) */}
      <section className="reminder-limitations-box no-print">
        <strong>
          ℹ️ {isAr ? 'توضيح طريقة عمل الإشعارات:' : 'How Dose Notifications Work:'}{' '}
        </strong>
        <span className="small">
          {isAr
            ? 'عند تفعيل الإشعارات، يظهر إشعار منبثق على الشاشة طالما أن المتصفح مفتوح في الخلفية. ولضمان التنبيه حتى عند إغلاق المتصفح، اضغط «📅 منبهات الموبايل (.ics)» في أي جدول لإضافة المواعيد لتقويم ومنبه هاتفك.'
            : 'When enabled, a system notification pops up while the browser remains open in the background. For alarms when the browser is closed, click "📅 Phone Alarms (.ics)" on any schedule.'}
        </span>
      </section>

      {/* Schedules List with Initial Loading Protection */}
      {initialLoading ? (
        <section className="card stack empty-tracker no-print">
          <span className="empty-icon">☁️</span>
          <h3>
            {isAr
              ? 'جارٍ تحميل جداولك العلاجية من حسابك السحابي...'
              : 'Loading your cloud treatment schedules...'}
          </h3>
          <p className="muted">
            {isAr
              ? 'يرجى الانتظار لحظات بينما نسترجع روشتاتك وسجل الجرعات المسجلة.'
              : 'Please wait while we retrieve your saved prescriptions and dose history.'}
          </p>
        </section>
      ) : schedules.length === 0 ? (
        <section className="card stack empty-tracker no-print">
          <span className="empty-icon">💊</span>
          <h3>{isAr ? 'لا توجد جداول علاجية نشطة حالياً' : 'No Active Treatment Schedules'}</h3>
          <p className="muted">
            {isAr
              ? 'اضغط على زر «إضافة جدول علاج جديد» وحدد وقت أول جرعة وعدد الجرعات ليقوم الموقع بحساب المواعيد تلقائياً.'
              : 'Click "New Treatment Schedule", set your first dose start time and daily count, and the tracker will calculate all dose times automatically.'}
          </p>
        </section>
      ) : (
        schedules.map((sch) => {
          const {
            totalDoses,
            takenCount,
            missedCount,
            unconfirmedCount,
            upcomingCount,
            progressPercent,
          } = calculateScheduleProgress(sch);

          const dayGroups: Record<number, ScheduledDose[]> = {};
          sch.doses.forEach((d) => {
            if (!dayGroups[d.dayNumber]) dayGroups[d.dayNumber] = [];
            dayGroups[d.dayNumber].push(d);
          });

          return (
            <section key={sch.id} className="card stack schedule-card no-print">
              <div className="schedule-header">
                <div>
                  <h2 className="sch-title">💊 {sch.medicineName}</h2>
                  <p className="sch-meta">
                    <b>{isAr ? 'الجرعة:' : 'Dose:'}</b> {sch.prescribedDose} ·{' '}
                    <b>{isAr ? 'طريقة الاستعمال:' : 'Route:'}</b> {formatRouteLabel(sch.route, isAr)} ·{' '}
                    <b>{isAr ? 'المدة:' : 'Duration:'}</b> {sch.durationDays}{' '}
                    {isAr ? 'أيام' : 'days'} ({sch.startDate} → {sch.endDate})
                  </p>
                  <p className="sch-meta" style={{ marginTop: '4px' }}>
                    <b>{isAr ? 'مواعيد الجرعات اليومية:' : 'Scheduled Times:'}</b>{' '}
                    {sch.doseTimes.map((t) => formatTime12Hour(t, isAr)).join(' ، ')}
                  </p>
                  {sch.notes && (
                    <p className="sch-notes">
                      📝 <i>{sch.notes}</i>
                    </p>
                  )}
                </div>
                <div className="sch-actions" style={{ flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary small"
                    onClick={() => downloadScheduleIcs(sch, isAr)}
                  >
                    📅 {isAr ? 'منبهات الموبايل (.ics)' : 'Phone Alarms (.ics)'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => openEdit(sch)}>
                    ✏️ {isAr ? 'تعديل' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary danger"
                    onClick={() => deleteSchedule(sch.id)}
                  >
                    🗑️ {isAr ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Progress Bar & KPI Stats */}
              <div className="kpi-grid">
                <div className="kpi-item">
                  <span className="kpi-num">{totalDoses}</span>
                  <span className="kpi-label">{isAr ? 'إجمالي الجرعات' : 'Total Doses'}</span>
                </div>
                <div className="kpi-item taken">
                  <span className="kpi-num">{takenCount}</span>
                  <span className="kpi-label">{isAr ? 'جرعات تم أخذها ✅' : 'Recorded Taken ✅'}</span>
                </div>
                <div className="kpi-item upcoming">
                  <span className="kpi-num">{upcomingCount}</span>
                  <span className="kpi-label">{isAr ? 'جرعات قادمة ⏳' : 'Upcoming ⏳'}</span>
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

              {/* Visual Progress Bar */}
              <div className="progress-bar-wrap">
                <div className="progress-info">
                  <span>{isAr ? 'نسبة الالتزام المسجلة بالجدول:' : 'Recorded Course Adherence Progress:'}</span>
                  <b>{progressPercent}%</b>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <small className="muted progress-note">
                  {isAr
                    ? '⚠️ تنبيه: نسبة الالتزام تعكس الجرعات المسجلة ولا تعني الشفاء السريري التام. يجب إكمال الكورس حتى آخر جرعة حسب توجيه الطبيب.'
                    : 'Note: Progress percentage reflects recorded doses only, not clinical cure. Always finish the entire prescribed duration.'}
                </small>
              </div>

              {/* Safe Missed / Overdue Dose Guidance Banner (Priority 3) */}
              {(unconfirmedCount > 0 || missedCount > 0) && (
                <div className="unconfirmed-banner">
                  <strong>
                    ⚠️{' '}
                    {isAr
                      ? 'إرشادات السلامة للجرعات المتأخرة أو الفائتة:'
                      : 'Safe Guidance for Overdue or Missed Doses:'}{' '}
                  </strong>
                  {isAr
                    ? 'مرور موعد الجرعة يجعلها «متأخرة غير مؤكدة» ولا يعتبرها فائتة تلقائياً. لا تضاعف الجرعة أبداً، ولا تأخذ جرعة إضافية، ولا تقم بتخطي الجرعة أو تعويضها من تلقاء نفسك. راجع الطبيب المعالج أو الصيدلي للحصول على التعليمات الخاصة بدوائك.'
                    : 'A passed scheduled time marks a dose as "Overdue (Unconfirmed)" rather than automatically missed. Never double a dose, take an extra dose, or automatically skip or replace a dose on your own. Contact your prescribing doctor or pharmacist for medicine-specific instructions.'}
                </div>
              )}

              {/* Daily Dose Timeline */}
              <div className="timeline-section">
                <h3>📅 {isAr ? 'جدول الجرعات اليومي:' : 'Daily Dose Timeline:'}</h3>
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
                                    (isAr ? 'متأخرة غير مؤكدة ⚠️' : 'Overdue (Unconfirmed) ⚠️')}
                                  {status === 'missed' &&
                                    (isAr ? 'فائتة صراحةً ❌' : 'Explicitly Missed ❌')}
                                </span>
                              </div>
                              <div className="dose-right" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {status === 'taken' ? (
                                  <>
                                    <button
                                      type="button"
                                      className="undo-btn"
                                      onClick={() => updateDoseStatus(sch.id, dose.id, 'upcoming')}
                                      title={isAr ? 'تراجع عن التسجيل' : 'Undo'}
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
                                    >
                                      ✓ {isAr ? 'أخذتها' : 'Taken'}
                                    </button>
                                    <button
                                      type="button"
                                      className="undo-btn"
                                      onClick={() => updateDoseStatus(sch.id, dose.id, 'upcoming')}
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
            </section>
          );
        })
      )}

      {/* Printable Treatment Summary Report */}
      {schedules.length > 0 && (
        <section className="card stack printable-treatment-report">
          <div className="row no-print" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                📄 {isAr ? 'تقرير المتابعة العلاجية للطباعة أو الحفظ PDF' : 'Printable Treatment Summary Report (Save as PDF)'}
              </h2>
            </div>
            <button type="button" className="btn" onClick={handlePrintReport}>
              🖨️ {isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}
            </button>
          </div>

          <div className="report-print-header">
            <h3 style={{ margin: '0 0 4px' }}>
              {isAr
                ? 'ملخص متابعة الكورس العلاجي بالمضادات الحيوية'
                : 'Antibiotic Treatment Course Summary Report'}
            </h3>
            <p className="small" style={{ margin: '0 0 6px' }}>
              <b>{isAr ? 'تاريخ الإصدار:' : 'Generated on:'}</b>{' '}
              {formatTimestampReadable(reportGeneratedAt, isAr)}
            </p>
            <div className="report-disclaimer-box">
              <strong>⚠️ {isAr ? 'إخلاء مسؤولية:' : 'Disclaimer:'} </strong>
              {isAr
                ? 'هذا التقرير مُدار بواسطة المريض للمتابعة الشخصية ولا يُعد سجلاً سريرياً موثقاً. راجع الطبيب أو الصيدلي دائماً.'
                : 'This report is maintained by the patient and is not a verified clinical record. Always verify with your doctor or pharmacist.'}
            </div>
          </div>

          {schedules.map((sch) => {
            const stats = calculateScheduleProgress(sch);
            return (
              <div key={sch.id} className="report-schedule-item">
                <h4 style={{ margin: '0 0 4px' }}>
                  {sch.medicineName} — {sch.prescribedDose} ({sch.startDate} → {sch.endDate})
                </h4>
                <p className="small" style={{ margin: '0 0 6px' }}>
                  {isAr ? 'تم أخذها:' : 'Taken:'} {stats.takenCount}/{stats.totalDoses} ({stats.progressPercent}%) ·{' '}
                  {isAr ? 'فائتة صراحةً:' : 'Missed:'} {stats.missedCount} ·{' '}
                  {isAr ? 'متأخرة غير مؤكدة:' : 'Overdue Unconfirmed:'} {stats.unconfirmedCount}
                </p>
              </div>
            );
          })}
        </section>
      )}

      {/* Add / Edit Schedule Modal */}
      {showAddModal &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>
                  {editingScheduleId
                    ? isAr
                      ? 'تعديل جدول العلاج'
                      : 'Edit Treatment Schedule'
                    : isAr
                      ? 'إضافة جدول علاج جديد'
                      : 'New Treatment Schedule'}
                </h3>
                <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}>
                  ✕
                </button>
              </div>

              {formError && <p className="alert danger-alert">{formError}</p>}

              <form onSubmit={handleSubmit} className="stack modal-form">
                <div className="form-group">
                  <label>
                    <b>{isAr ? 'اسم المضاد الحيوي:' : 'Antibiotic Name:'} *</b>
                  </label>
                  <input
                    list="med-suggestions"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اكتب أو اختر (مثال: أوجمنتين، فلاجيل...)'
                        : 'Type or select (e.g. Augmentin, Flagyl)'
                    }
                    required
                  />
                  <datalist id="med-suggestions">
                    {meds.map((m) => (
                      <option key={m.id} value={pick(m.genericName, lang)} />
                    ))}
                  </datalist>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'الجرعة الموصوفة بالروشتة:' : 'Prescribed Dose:'} *</b>
                    </label>
                    <input
                      value={prescribedDose}
                      onChange={(e) => setPrescribedDose(e.target.value)}
                      placeholder={
                        isAr ? 'مثال: قرص 1000 مجم أو 5 مل' : 'e.g. 1 tablet (1000mg) or 5ml'
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'طريقة الاستعمال:' : 'Administration Route:'}</b>
                    </label>
                    <select value={route} onChange={(e) => setRoute(e.target.value)}>
                      <option value="oral">{isAr ? 'أقراص / كبسول فموي' : 'Oral Tablet/Capsule'}</option>
                      <option value="suspension">{isAr ? 'شراب معلق للأطفال' : 'Oral Suspension'}</option>
                      <option value="injection">{isAr ? 'حقن (وريد/عضل)' : 'Injection'}</option>
                      <option value="topical">{isAr ? 'موضعي (كريم/جل)' : 'Topical'}</option>
                    </select>
                  </div>
                </div>

                {/* First Dose Time + Number of Daily Doses -> Auto-calculates all times */}
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>🕒 {isAr ? 'وقت بدء أول جرعة:' : 'First Dose Start Time:'} *</b>
                    </label>
                    <input
                      type="time"
                      value={firstDoseTime}
                      onChange={(e) => handleFirstDoseTimeChange(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <b>🔢 {isAr ? 'عدد الجرعات يومياً (يحسب المواعيد تلقائياً):' : 'Doses Per Day (Auto-Calculates Times):'}</b>
                    </label>
                    <select value={frequency} onChange={(e) => handleFrequencyChange(e.target.value)}>
                      <option value="once_daily">{isAr ? 'جرعة واحدة يومياً (كل 24 ساعة)' : '1 dose daily (every 24h)'}</option>
                      <option value="twice_daily">{isAr ? 'جرعتان يومياً (كل 12 ساعة)' : '2 doses daily (every 12h)'}</option>
                      <option value="thrice_daily">{isAr ? '3 جرعات يومياً (كل 8 ساعات)' : '3 doses daily (every 8h)'}</option>
                      <option value="four_times_daily">{isAr ? '4 جرعات يومياً (كل 6 ساعات)' : '4 doses daily (every 6h)'}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <b>
                      ✨{' '}
                      {isAr
                        ? 'مواعيد الجرعات المحسوبة تلقائياً خلال اليوم:'
                        : 'Auto-Calculated Scheduled Dose Times:'}
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

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <b>{isAr ? 'تاريخ بدء العلاج:' : 'Start Date:'}</b>
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
                      <b>{isAr ? 'مدة الكورس بالأيام:' : 'Duration (Days):'} *</b>
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
                    <b>{isAr ? 'تعليمات إضافية (اختياري):' : 'Notes / Instructions (Optional):'}</b>
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      isAr ? 'مثال: بعد الأكل، يحفظ في الثلاجة' : 'e.g. Take with food, keep refrigerated'
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn">
                    💾{' '}
                    {editingScheduleId
                      ? isAr
                        ? 'تحديث الجدول'
                        : 'Update Schedule'
                      : isAr
                        ? 'حفظ الجدول العلاجي'
                        : 'Save Schedule'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
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
