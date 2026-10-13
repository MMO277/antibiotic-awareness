export interface ScheduledDose {
  id: string;
  scheduleId: string;
  dayNumber: number;
  doseNumberInDay: number;
  scheduledTime: string; // ISO string "YYYY-MM-DDTHH:mm:ss"
  status: 'upcoming' | 'taken' | 'unconfirmed';
  takenAt?: string;
}

export interface TreatmentSchedule {
  id: string;
  medicineName: string;
  prescribedDose: string;
  route: string;
  frequency: string;
  doseTimes: string[]; // e.g. ["08:00", "20:00"]
  startDate: string; // "YYYY-MM-DD"
  durationDays: number;
  endDate: string; // "YYYY-MM-DD"
  notes?: string;
  createdAt: string;
  doses: ScheduledDose[];
}

const STORAGE_KEY = 'antibiotic_treatment_tracker_schedules';

export function loadSchedules(): TreatmentSchedule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load treatment schedules:', err);
    return [];
  }
}

export function saveSchedules(schedules: TreatmentSchedule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  } catch (err) {
    console.error('Failed to save treatment schedules:', err);
  }
}

/** Computes auto-status for a dose (unconfirmed if scheduled time has passed and not marked taken) */
export function getDoseStatus(dose: ScheduledDose, now = new Date()): 'upcoming' | 'taken' | 'unconfirmed' {
  if (dose.status === 'taken') return 'taken';
  const scheduled = new Date(dose.scheduledTime);
  if (now > scheduled) return 'unconfirmed';
  return 'upcoming';
}

/** Generates all doses for a schedule over durationDays */
export function generateScheduleDoses(
  scheduleId: string,
  startDateStr: string,
  doseTimes: string[],
  durationDays: number
): ScheduledDose[] {
  const doses: ScheduledDose[] = [];
  const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
  
  for (let day = 0; day < durationDays; day++) {
    const currentDate = new Date(startYear, startMonth - 1, startDay + day);
    const dateStr = currentDate.toISOString().split('T')[0];

    doseTimes.forEach((timeStr, idx) => {
      const scheduledIso = `${dateStr}T${timeStr}:00`;
      doses.push({
        id: `${scheduleId}-d${day + 1}-${idx + 1}`,
        scheduleId,
        dayNumber: day + 1,
        doseNumberInDay: idx + 1,
        scheduledTime: scheduledIso,
        status: 'upcoming',
      });
    });
  }

  return doses;
}
