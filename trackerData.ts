import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';
import { useAuth } from './authContext';

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

export const STORAGE_KEY = 'antibiotic_treatment_tracker_schedules';
const MIGRATED_LEGACY_SCHEDULES_PREFIX = 'aa_migrated_legacy_schedules_';
const SCHEDULES_EVENT = 'aa-tracker-schedules-updated';

export function getSchedulesStorageKey(uid?: string | null): string {
  return uid ? `${STORAGE_KEY}_${uid}` : STORAGE_KEY;
}

/** Strips undefined properties recursively so Firestore setDoc never throws on optional fields like takenAt */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSchedules(raw: any): TreatmentSchedule[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s !== null && typeof s === 'object')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => ({
      id: typeof s.id === 'string' && s.id ? s.id : `sch-${Date.now()}`,
      medicineName: typeof s.medicineName === 'string' ? s.medicineName : '',
      prescribedDose: typeof s.prescribedDose === 'string' ? s.prescribedDose : '',
      route: typeof s.route === 'string' ? s.route : 'oral',
      frequency: typeof s.frequency === 'string' ? s.frequency : 'twice_daily',
      doseTimes: Array.isArray(s.doseTimes) ? s.doseTimes.map(String) : ['08:00', '20:00'],
      startDate: typeof s.startDate === 'string' ? s.startDate : new Date().toISOString().split('T')[0],
      durationDays: typeof s.durationDays === 'number' ? s.durationDays : 7,
      endDate: typeof s.endDate === 'string' ? s.endDate : new Date().toISOString().split('T')[0],
      ...(typeof s.notes === 'string' ? { notes: s.notes } : {}),
      createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date().toISOString(),
      doses: Array.isArray(s.doses)
        ? s.doses
            .filter((d: unknown) => d !== null && typeof d === 'object')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((d: any) => ({
              id: typeof d.id === 'string' ? d.id : '',
              scheduleId: typeof d.scheduleId === 'string' ? d.scheduleId : s.id,
              dayNumber: typeof d.dayNumber === 'number' ? d.dayNumber : 1,
              doseNumberInDay: typeof d.doseNumberInDay === 'number' ? d.doseNumberInDay : 1,
              scheduledTime: typeof d.scheduledTime === 'string' ? d.scheduledTime : '',
              status: (['upcoming', 'taken', 'unconfirmed'].includes(d.status) ? d.status : 'upcoming') as
                | 'upcoming'
                | 'taken'
                | 'unconfirmed',
              ...(typeof d.takenAt === 'string' ? { takenAt: d.takenAt } : {}),
            }))
        : [],
    }));
}

/**
 * Non-destructively merges cloud schedules with local/guest schedules, preserving any
 * doses marked as 'taken' on either device.
 */
export function mergeSchedules(
  primary: TreatmentSchedule[],
  secondary: TreatmentSchedule[]
): TreatmentSchedule[] {
  const map = new Map<string, TreatmentSchedule>();
  for (const s of primary) {
    map.set(s.id, s);
  }
  for (const s of secondary) {
    const existing = map.get(s.id);
    if (!existing) {
      map.set(s.id, s);
    } else {
      // Merge dose taken statuses so a dose marked taken on either device stays taken
      const mergedDoses = existing.doses.map((ed) => {
        const match = s.doses.find(
          (sd) => sd.id === ed.id || (sd.dayNumber === ed.dayNumber && sd.doseNumberInDay === ed.doseNumberInDay)
        );
        if (ed.status !== 'taken' && match?.status === 'taken') {
          return match;
        }
        return ed;
      });
      map.set(s.id, { ...existing, doses: mergedDoses });
    }
  }
  return normalizeSchedules(Array.from(map.values()));
}

export function loadSchedules(uid?: string | null): TreatmentSchedule[] {
  if (typeof window === 'undefined') return [];
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const scopedRaw = localStorage.getItem(getSchedulesStorageKey(effectiveUid));
    if (scopedRaw) {
      return normalizeSchedules(JSON.parse(scopedRaw));
    }
    if (effectiveUid && !localStorage.getItem(`${MIGRATED_LEGACY_SCHEDULES_PREFIX}${effectiveUid}`)) {
      const legacyRaw = localStorage.getItem(STORAGE_KEY);
      if (legacyRaw) {
        return normalizeSchedules(JSON.parse(legacyRaw));
      }
    }
    return [];
  } catch (err) {
    console.error('Failed to load treatment schedules:', err);
    return [];
  }
}

export function saveSchedules(schedules: TreatmentSchedule[], uid?: string | null): void {
  if (typeof window === 'undefined') return;
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  const clean = stripUndefined(normalizeSchedules(schedules));
  try {
    localStorage.setItem(getSchedulesStorageKey(effectiveUid), JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent(SCHEDULES_EVENT, { detail: { uid: effectiveUid, schedules: clean } }));
  } catch (err) {
    console.error('Failed to save treatment schedules locally:', err);
  }
  if (effectiveUid && configured && db) {
    setDoc(
      doc(db, 'users', effectiveUid),
      {
        schedules: clean,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => {
      console.error('Failed to sync treatment schedules to Cloud Firestore:', err);
    });
  }
}

/**
 * Reactive hook that synchronizes the user's Treatment Schedules & Doses across devices
 * via Cloud Firestore (`users/{uid}`) when signed in, while preserving Guest Mode offline storage.
 */
export function useSyncedSchedules() {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;

  const [schedules, setSchedulesState] = useState<TreatmentSchedule[]>(() => loadSchedules(uid));
  const [syncing, setSyncing] = useState<boolean>(false);
  const hydratedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!uid) {
      hydratedUidRef.current = null;
      setSchedulesState(loadSchedules(null));
      setSyncing(false);
      return;
    }

    const cachedScopedRaw = localStorage.getItem(getSchedulesStorageKey(uid));
    const cachedScoped = cachedScopedRaw ? normalizeSchedules(JSON.parse(cachedScopedRaw)) : null;
    if (cachedScoped) {
      setSchedulesState(cachedScoped);
    }

    if (!configured || !db) {
      hydratedUidRef.current = uid;
      setSyncing(false);
      return;
    }

    let cancelled = false;
    setSyncing(true);
    const userDocRef = doc(db, 'users', uid);

    getDoc(userDocRef)
      .then(async (snap) => {
        if (cancelled) return;
        const cloudRaw = snap.exists() ? snap.data()?.schedules : undefined;
        const hasCloudSchedules = Array.isArray(cloudRaw);
        const cloudSchedules = hasCloudSchedules ? normalizeSchedules(cloudRaw) : [];

        const migrationKey = `${MIGRATED_LEGACY_SCHEDULES_PREFIX}${uid}`;
        const alreadyMigrated = localStorage.getItem(migrationKey) === '1';
        let legacySchedules: TreatmentSchedule[] = [];
        if (!alreadyMigrated) {
          try {
            const rawLegacy = localStorage.getItem(STORAGE_KEY);
            if (rawLegacy) {
              legacySchedules = normalizeSchedules(JSON.parse(rawLegacy));
            }
          } catch {}
        }

        const localCandidate = cachedScoped
          ? legacySchedules.length > 0 && !alreadyMigrated
            ? mergeSchedules(cachedScoped, legacySchedules)
            : cachedScoped
          : legacySchedules;

        let resolved: TreatmentSchedule[];
        let shouldWriteToCloud = false;

        if (hasCloudSchedules) {
          if (!alreadyMigrated && localCandidate.length > 0) {
            resolved = mergeSchedules(cloudSchedules, localCandidate);
            if (JSON.stringify(resolved) !== JSON.stringify(cloudSchedules)) {
              shouldWriteToCloud = true;
            }
          } else {
            resolved = cloudSchedules;
          }
        } else {
          resolved = localCandidate;
          if (resolved.length > 0) {
            shouldWriteToCloud = true;
          }
        }

        try {
          localStorage.setItem(getSchedulesStorageKey(uid), JSON.stringify(stripUndefined(resolved)));
          if (!alreadyMigrated && legacySchedules.length > 0) {
            localStorage.setItem(migrationKey, '1');
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {}

        hydratedUidRef.current = uid;
        setSchedulesState(resolved);
        setSyncing(false);

        if (shouldWriteToCloud) {
          await setDoc(
            userDocRef,
            {
              schedules: stripUndefined(resolved),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      })
      .catch((err) => {
        console.error('Error hydrating treatment schedules from Firestore:', err);
        if (!cancelled) {
          hydratedUidRef.current = uid;
          setSyncing(false);
        }
      });

    const unsubscribe = onSnapshot(
      userDocRef,
      (snap) => {
        if (cancelled || hydratedUidRef.current !== uid) return;
        if (snap.exists() && Array.isArray(snap.data()?.schedules)) {
          const remoteSchedules = normalizeSchedules(snap.data()?.schedules);
          try {
            localStorage.setItem(getSchedulesStorageKey(uid), JSON.stringify(stripUndefined(remoteSchedules)));
          } catch {}
          setSchedulesState((prev) =>
            JSON.stringify(prev) === JSON.stringify(remoteSchedules) ? prev : remoteSchedules
          );
        }
      },
      (err) => {
        console.warn('Firestore schedules listener warning:', err);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid, authLoading]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.uid === uid && Array.isArray(detail.schedules)) {
        setSchedulesState((prev) =>
          JSON.stringify(prev) === JSON.stringify(detail.schedules) ? prev : detail.schedules
        );
      }
    };
    window.addEventListener(SCHEDULES_EVENT, handler);
    return () => window.removeEventListener(SCHEDULES_EVENT, handler);
  }, [uid]);

  const updateSchedules = useCallback(
    (updater: TreatmentSchedule[] | ((prev: TreatmentSchedule[]) => TreatmentSchedule[])) => {
      setSchedulesState((prev) => {
        const nextRaw = typeof updater === 'function' ? updater(prev) : updater;
        const next = stripUndefined(normalizeSchedules(nextRaw));
        try {
          localStorage.setItem(getSchedulesStorageKey(uid), JSON.stringify(next));
          window.dispatchEvent(new CustomEvent(SCHEDULES_EVENT, { detail: { uid, schedules: next } }));
        } catch (err) {
          console.error('Failed to save schedules locally:', err);
        }
        if (uid && configured && db) {
          setDoc(
            doc(db, 'users', uid),
            {
              schedules: next,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch((err) => {
            console.error('Failed to save treatment schedules to Firestore:', err);
          });
        }
        return next;
      });
    },
    [uid]
  );

  return { schedules, setSchedules: updateSchedules, syncing, isAuthenticated: Boolean(uid) };
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
