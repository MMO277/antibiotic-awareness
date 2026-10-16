import { createPortal } from 'react-dom';
import { FormEvent, useEffect, useState } from 'react';
import { useLang } from './i18n';
import { useApproved } from './medicinesApi';
import { pick } from './types';
import {
  TreatmentSchedule,
  ScheduledDose,
  loadSchedules,
  saveSchedules,
  generateScheduleDoses,
  getDoseStatus,
} from './trackerData';

export default function Tracker() {
  const { lang } = useLang();
  const { items } = useApproved();
  const meds = items ?? [];

  const [schedules, setSchedules] = useState<TreatmentSchedule[]>(() => loadSchedules());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Form states
  const [medName, setMedName] = useState('');
  const [prescribedDose, setPrescribedDose] = useState('');
  const [route, setRoute] = useState('oral');
  const [frequency, setFrequency] = useState('twice_daily');
  const [doseTimes, setDoseTimes] = useState<string[]>(['08:00', '20:00']);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Notification state
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    saveSchedules(schedules);
  }, [schedules]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifSupported(true);
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotifPermission = async () => {
    if (!notifSupported) return;
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        new Notification(lang === 'ar' ? 'تم تفعيل التنبيهات بنجاح 🔔' : 'Reminders Enabled Successfully 🔔', {
          body: lang === 'ar' ? 'سيتم تنبيهك عند حلول مواعيد جرعات المضاد الحيوي أثناء فتح المتصفح.' : 'You will be alerted at scheduled dose times while your browser is active.',
        });
      }
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  const handleFrequencyChange = (freq: string) => {
    setFrequency(freq);
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) {
      setFormError(lang === 'ar' ? 'يرجى كتابة أو اختيار اسم الدواء الموصوف.' : 'Please enter or select the prescribed medicine name.');
      return;
    }
    if (!prescribedDose.trim()) {
      setFormError(lang === 'ar' ? 'يرجى كتابة الجرعة كما هي مكتوبة في الروشتة (مثال: قرص 1000 مجم).' : 'Please enter the prescribed dose as written on your prescription.');
      return;
    }
    if (durationDays < 1 || durationDays > 30) {
      setFormError(lang === 'ar' ? 'يرجى تحديد مدة الكورس بالأيام (بين 1 و 30 يوماً).' : 'Please enter a valid course duration (1-30 days).');
      return;
    }

    setFormError('');
    const id = editingScheduleId || `sch-${Date.now()}`;
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const endObj = new Date(startYear, startMonth - 1, startDay + durationDays - 1);
    const endDateStr = endObj.toISOString().split('T')[0];

    const generatedDoses = generateScheduleDoses(id, startDate, doseTimes, durationDays);

    // If editing, preserve taken doses
    let finalDoses = generatedDoses;
    if (editingScheduleId) {
      const existing = schedules.find((s) => s.id === editingScheduleId);
      if (existing) {
        finalDoses = generatedDoses.map((d) => {
          const match = existing.doses.find((ed) => ed.dayNumber === d.dayNumber && ed.doseNumberInDay === d.doseNumberInDay);
          return match && match.status === 'taken' ? match : d;
        });
      }
    }

    const newSchedule: TreatmentSchedule = {
      id,
      medicineName: medName.trim(),
      prescribedDose: prescribedDose.trim(),
      route,
      frequency,
      doseTimes,
      startDate,
      durationDays,
      endDate: endDateStr,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
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
    setFrequency('twice_daily');
    setDoseTimes(['08:00', '20:00']);
    setStartDate(new Date().toISOString().split('T')[0]);
    setDurationDays(7);
    setNotes('');
    setFormError('');
  };

  const openEdit = (sch: TreatmentSchedule) => {
    setEditingScheduleId(sch.id);
    setMedName(sch.medicineName);
    setPrescribedDose(sch.prescribedDose);
    setRoute(sch.route);
    setFrequency(sch.frequency);
    setDoseTimes(sch.doseTimes);
    setStartDate(sch.startDate);
    setDurationDays(sch.durationDays);
    setNotes(sch.notes || '');
    setShowAddModal(true);
  };

  const deleteSchedule = (id: string) => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الجدول العلاجي؟' : 'Are you sure you want to delete this schedule?')) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const markDoseTaken = (schId: string, doseId: string) => {
    setSchedules((prev) =>
      prev.map((sch) => {
        if (sch.id !== schId) return sch;
        const updatedDoses = sch.doses.map((d) => {
          if (d.id === doseId) {
            return { ...d, status: 'taken' as const, takenAt: new Date().toISOString() };
          }
          return d;
        });
        return { ...sch, doses: updatedDoses };
      }),
    );
  };

  const undoDoseTaken = (schId: string, doseId: string) => {
    setSchedules((prev) =>
      prev.map((sch) => {
        if (sch.id !== schId) return sch;
        const updatedDoses = sch.doses.map((d) => {
          if (d.id === doseId) {
            return { ...d, status: 'upcoming' as const, takenAt: undefined };
          }
          return d;
        });
        return { ...sch, doses: updatedDoses };
      }),
    );
  };

  return (
    <main className="wrap stack">
      <header className="page-head">
        <h1>{lang === 'ar' ? 'متابع كورس العلاج بالمضادات الحيوية' : 'My Antibiotic Treatment Tracker'}</h1>
        <p className="muted">
          {lang === 'ar'
            ? 'أداة شخصية لمساعدتك في تنظيم ومتابعة مواعيد جرعات المضاد الحيوي الموصوفة لك، وإكمال الكورس العلاجي بالكامل لمنع مقاومة البكتيريا.'
            : 'A personal patient-friendly tool to help you organize and track your prescribed antibiotic doses and finish your full course.'}
        </p>
      </header>

      {/* Clinical safety disclaimer */}
      <section className="notice quick">
        <strong>⚠️ {lang === 'ar' ? 'تنبيه سريري مهم:' : 'Clinical Safety Note:'} </strong>
        {lang === 'ar'
          ? 'هذه الأداة لتنظيم الجرعات الموصوفة لك فقط ولا تحدد جرعات أو مدة علاج بشكل مستقل. أي تعديل في الدواء أو الجرعة يجب أن يتم بمعرفة الطبيب المعالج أو الصيدلي.'
          : 'This tool is for tracking prescribed regimens only. It does not prescribe medicines or determine doses. Any changes must be confirmed with your doctor.'}
      </section>

      {/* Controls & Notifs */}
      <div className="tracker-top-bar">
        <button
          type="button"
          className="btn"
          onClick={() => {
            resetForm();
            setEditingScheduleId(null);
            setShowAddModal(true);
          }}
        >
          ➕ {lang === 'ar' ? 'إضافة جدول علاج جديد' : 'New Treatment Schedule'}
        </button>

        {notifSupported && (
          <div className="notif-bar">
            {notifPermission === 'granted' ? (
              <span className="notif-pill active">
                🔔 {lang === 'ar' ? 'التنبيهات مفعلة على هذا المتصفح' : 'Browser Notifications Active'}
              </span>
            ) : (
              <button type="button" className="btn-secondary" onClick={requestNotifPermission}>
                🔔 {lang === 'ar' ? 'تفعيل تنبيهات المتصفح' : 'Enable Reminders'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <section className="card stack empty-tracker">
          <span className="empty-icon">💊</span>
          <h3>{lang === 'ar' ? 'لا توجد جداول علاجية نشطة حالياً' : 'No Active Treatment Schedules'}</h3>
          <p className="muted">
            {lang === 'ar'
              ? 'اضغط على زر «إضافة جدول علاج جديد» لإدخال بيانات الوصفة الطبية وتتبع جرعاتك اليومية بسهولة.'
              : 'Click "New Treatment Schedule" to enter your prescription details and begin tracking doses.'}
          </p>
        </section>
      ) : (
        schedules.map((sch) => {
          const totalDoses = sch.doses.length;
          const takenCount = sch.doses.filter((d) => d.status === 'taken').length;
          const unconfirmedCount = sch.doses.filter((d) => getDoseStatus(d) === 'unconfirmed').length;
          const upcomingCount = totalDoses - takenCount - unconfirmedCount;
          const progressPercent = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 0;

          // Group doses by day
          const dayGroups: Record<number, ScheduledDose[]> = {};
          sch.doses.forEach((d) => {
            if (!dayGroups[d.dayNumber]) dayGroups[d.dayNumber] = [];
            dayGroups[d.dayNumber].push(d);
          });

          return (
            <section key={sch.id} className="card stack schedule-card">
              <div className="schedule-header">
                <div>
                  <h2 className="sch-title">💊 {sch.medicineName}</h2>
                  <p className="sch-meta">
                    <b>{lang === 'ar' ? 'الجرعة:' : 'Dose:'}</b> {sch.prescribedDose} ·{' '}
                    <b>{lang === 'ar' ? 'المدة:' : 'Duration:'}</b> {sch.durationDays} {lang === 'ar' ? 'أيام' : 'days'} ({sch.startDate} → {sch.endDate})
                  </p>
                  {sch.notes && <p className="sch-notes">📝 <i>{sch.notes}</i></p>}
                </div>
                <div className="sch-actions">
                  <button type="button" className="btn-secondary" onClick={() => openEdit(sch)}>
                    ✏️ {lang === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  <button type="button" className="btn-secondary danger" onClick={() => deleteSchedule(sch.id)}>
                    🗑️ {lang === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Progress Bar & KPI Stats */}
              <div className="kpi-grid">
                <div className="kpi-item">
                  <span className="kpi-num">{totalDoses}</span>
                  <span className="kpi-label">{lang === 'ar' ? 'إجمالي الجرعات' : 'Total Doses'}</span>
                </div>
                <div className="kpi-item taken">
                  <span className="kpi-num">{takenCount}</span>
                  <span className="kpi-label">{lang === 'ar' ? 'جرعات تم أخذها ✅' : 'Recorded Taken'}</span>
                </div>
                <div className="kpi-item upcoming">
                  <span className="kpi-num">{upcomingCount}</span>
                  <span className="kpi-label">{lang === 'ar' ? 'جرعات قادمة ⏳' : 'Upcoming'}</span>
                </div>
                <div className="kpi-item unconfirmed">
                  <span className="kpi-num">{unconfirmedCount}</span>
                  <span className="kpi-label">{lang === 'ar' ? 'غير مؤكدة ⚠️' : 'Unconfirmed'}</span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="progress-bar-wrap">
                <div className="progress-info">
                  <span>{lang === 'ar' ? 'نسبة الالتزام بالجدول:' : 'Course Adherence Progress:'}</span>
                  <b>{progressPercent}%</b>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <small className="muted progress-note">
                  {lang === 'ar'
                    ? '⚠️ تنبيه: نسبة الالتزام لا تعني الشفاء السريري التام. يجب إكمال الكورس حتى آخر جرعة لمنع انتكاس العدوى.'
                    : 'Note: Progress percentage reflects schedule completion only, not clinical cure. Always finish the entire prescribed duration.'}
                </small>
              </div>

              {/* Unconfirmed Dose Guidance Banner */}
              {unconfirmedCount > 0 && (
                <div className="unconfirmed-banner">
                  <strong>⚠️ {lang === 'ar' ? 'تنبيه بخصوص الجرعات غير المؤكدة:' : 'Notice for Unconfirmed Doses:'} </strong>
                  {lang === 'ar'
                    ? 'لديك جرعة مر موعدها ولم يتم تأكيدها. إذا نسيت الجرعة: تناولها فور تذكرك إلا إذا اقترب موعد الجرعة التالية فتجاوزها وتابع جدولك المعتاد. ممنوع مضاعفة الجرعة نهائياً.'
                    : 'A scheduled dose time has passed. If you missed a dose, take it when remembered unless the next dose is near. Never double up on doses.'}
                </div>
              )}

              {/* Daily Dose Timeline */}
              <div className="timeline-section">
                <h3>📅 {lang === 'ar' ? 'جدول الجرعات اليومي:' : 'Daily Dose Timeline:'}</h3>
                <div className="timeline-grid">
                  {Object.entries(dayGroups).map(([dayNum, dayDoses]) => (
                    <div key={dayNum} className="day-card">
                      <div className="day-header">
                        <b>{lang === 'ar' ? `اليوم ${dayNum}` : `Day ${dayNum}`}</b>
                        <span className="day-date">{dayDoses[0]?.scheduledTime.split('T')[0]}</span>
                      </div>
                      <div className="doses-stack">
                        {dayDoses.map((dose) => {
                          const status = getDoseStatus(dose);
                          const timeDisplay = dose.scheduledTime.split('T')[1].slice(0, 5);
                          return (
                            <div key={dose.id} className={`dose-item ${status}`}>
                              <div className="dose-left">
                                <span className="dose-time">⏰ {timeDisplay}</span>
                                <span className={`status-pill ${status}`}>
                                  {status === 'taken' && (lang === 'ar' ? 'تم أخذها ✅' : 'Taken')}
                                  {status === 'upcoming' && (lang === 'ar' ? 'قادمة' : 'Upcoming')}
                                  {status === 'unconfirmed' && (lang === 'ar' ? 'غير مؤكدة ⚠️' : 'Unconfirmed')}
                                </span>
                              </div>
                              <div className="dose-right">
                                {status === 'taken' ? (
                                  <button
                                    type="button"
                                    className="undo-btn"
                                    onClick={() => undoDoseTaken(sch.id, dose.id)}
                                    title={lang === 'ar' ? 'تراجع عن التسجيل' : 'Undo'}
                                  >
                                    ↩ {lang === 'ar' ? 'تراجع' : 'Undo'}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn-take"
                                    onClick={() => markDoseTaken(sch.id, dose.id)}
                                  >
                                    ✓ {lang === 'ar' ? 'أخذت الجرعة' : 'Mark Taken'}
                                  </button>
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

      {/* Add / Edit Schedule Modal */}
      {showAddModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                {editingScheduleId
                  ? (lang === 'ar' ? 'تعديل جدول العلاج' : 'Edit Treatment Schedule')
                  : (lang === 'ar' ? 'إضافة جدول علاج جديد' : 'New Treatment Schedule')}
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {formError && <p className="alert danger-alert">{formError}</p>}

            <form onSubmit={handleSubmit} className="stack modal-form">
              <div className="form-group">
                <label>
                  <b>{lang === 'ar' ? 'اسم المضاد الحيوي:' : 'Antibiotic Name:'} *</b>
                </label>
                <input
                  list="med-suggestions"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب أو اختر (مثال: أوجمنتين، فلاجيل...)' : 'Type or select (e.g. Augmentin, Flagyl)'}
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
                    <b>{lang === 'ar' ? 'الجرعة الموصوفة بالروشتة:' : 'Prescribed Dose:'} *</b>
                  </label>
                  <input
                    value={prescribedDose}
                    onChange={(e) => setPrescribedDose(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: قرص 1000 مجم أو 5 مل' : 'e.g. 1 tablet (1000mg) or 5ml'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <b>{lang === 'ar' ? 'طريقة الاستعمال:' : 'Administration Route:'}</b>
                  </label>
                  <select value={route} onChange={(e) => setRoute(e.target.value)}>
                    <option value="oral">{lang === 'ar' ? 'أقراص / كبسول فموي' : 'Oral Tablet/Capsule'}</option>
                    <option value="suspension">{lang === 'ar' ? 'شراب معلق للأطفال' : 'Oral Suspension'}</option>
                    <option value="injection">{lang === 'ar' ? 'حقن (وريد/عضل)' : 'Injection'}</option>
                    <option value="topical">{lang === 'ar' ? 'موضعي (كريم/جل)' : 'Topical'}</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <b>{lang === 'ar' ? 'عدد مرات الجرعة يومياً:' : 'Frequency:'}</b>
                  </label>
                  <select value={frequency} onChange={(e) => handleFrequencyChange(e.target.value)}>
                    <option value="once_daily">{lang === 'ar' ? 'مرة واحدة يومياً (كل 24 ساعة)' : 'Once daily (every 24h)'}</option>
                    <option value="twice_daily">{lang === 'ar' ? 'مرتان يومياً (كل 12 ساعة)' : 'Twice daily (every 12h)'}</option>
                    <option value="thrice_daily">{lang === 'ar' ? '3 مرات يومياً (كل 8 ساعات)' : 'Three times daily (every 8h)'}</option>
                    <option value="four_times_daily">{lang === 'ar' ? '4 مرات يومياً (كل 6 ساعات)' : 'Four times daily (every 6h)'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <b>{lang === 'ar' ? 'مدة الكورس بالأيام:' : 'Duration (Days):'} *</b>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Dose times inputs */}
              <div className="form-group">
                <label>
                  <b>{lang === 'ar' ? 'مواعيد الجرعات خلال اليوم:' : 'Scheduled Dose Times:'}</b>
                </label>
                <div className="dose-times-grid">
                  {doseTimes.map((time, idx) => (
                    <div key={idx} className="time-input-group">
                      <small>{lang === 'ar' ? `الجرعة ${idx + 1}` : `Dose ${idx + 1}`}:</small>
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
                    <b>{lang === 'ar' ? 'تاريخ بدء العلاج:' : 'Start Date:'}</b>
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
                    <b>{lang === 'ar' ? 'تعليمات إضافية (اختياري):' : 'Notes / Instructions (Optional):'}</b>
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: بعد الأكل، يحفظ في الثلاجة' : 'e.g. Take with food, keep refrigerated'}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn">
                  💾 {editingScheduleId ? (lang === 'ar' ? 'تحديث الجدول' : 'Update Schedule') : (lang === 'ar' ? 'حفظ الجدول العلاجي' : 'Save Schedule')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
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
