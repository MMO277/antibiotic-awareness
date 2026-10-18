import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';
import { useAuth } from './authContext';

export type DoseStatus = 'upcoming' | 'taken' | 'missed' | 'unconfirmed';

export type CloudSyncStatus =
  | 'loading'
  | 'synced'
  | 'saving'
  | 'offline_pending'
  | 'local_only'
  | 'error';

export interface ScheduledDose {
  id: string;
  scheduleId: string;
  dayNumber: number;
  doseNumberInDay: number;
  scheduledTime: string; // Local ISO string "YYYY-MM-DDTHH:mm:ss"
  status: DoseStatus;
  takenAt?: string;
  missedAt?: string;
  statusUpdatedAt?: string;
  note?: string;
}

export interface TreatmentSchedule {
  id: string;
  antibioticId?: string;
  medicineName: string;
  prescribedDose: string;
  route: string;
  frequency: string;
  doseTimes: string[]; // e.g. ["08:00", "20:00"]
  startDate: string; // "YYYY-MM-DD"
  durationDays: number;
  endDate: string; // "YYYY-MM-DD"
  notes?: string;
  coMedications?: string[];
  coMedNotes?: string;
  createdAt: string;
  updatedAt: string;
  doses: ScheduledDose[];
}

export interface RadarWorkspaceState {
  selectedAbx: string;
  frequency: 'q12h' | 'q8h' | 'q24h';
  selectedCoMeds: string[];
  updatedAt: string;
}

export const STORAGE_KEY = 'antibiotic_treatment_tracker_schedules';
export const DELETED_SCHEDULES_KEY = 'antibiotic_treatment_tracker_deleted';
export const RADAR_WORKSPACE_KEY = 'aa_prescription_radar_workspace';
const MIGRATED_LEGACY_SCHEDULES_PREFIX = 'aa_migrated_legacy_schedules_';
const SCHEDULES_EVENT = 'aa-tracker-schedules-updated';

export const DEFAULT_RADAR_WORKSPACE: RadarWorkspaceState = {
  selectedAbx: 'ciprofloxacin',
  frequency: 'q12h',
  selectedCoMeds: ['calcium_dairy', 'iron_zinc', 'probiotics', 'paracetamol'],
  updatedAt: '1970-01-01T00:00:00.000Z',
};

export function formatLocalDateYYYYMMDD(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeEndDate(startDateStr: string, durationDays: number): string {
  const parts = startDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return formatLocalDateYYYYMMDD();
  }
  const [startYear, startMonth, startDay] = parts;
  const endObj = new Date(startYear, startMonth - 1, startDay + Math.max(1, durationDays) - 1);
  return formatLocalDateYYYYMMDD(endObj);
}

export function getSchedulesStorageKey(uid?: string | null): string {
  return uid ? `${STORAGE_KEY}_${uid}` : STORAGE_KEY;
}

export function getDeletedSchedulesStorageKey(uid?: string | null): string {
  return uid ? `${DELETED_SCHEDULES_KEY}_${uid}` : DELETED_SCHEDULES_KEY;
}

export function getRadarWorkspaceStorageKey(uid?: string | null): string {
  return uid ? `${RADAR_WORKSPACE_KEY}_${uid}` : RADAR_WORKSPACE_KEY;
}

/** Strips undefined properties recursively so Firestore setDoc never throws on optional fields */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripUndefined<T>(value: T): T {
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
export function normalizeRadarWorkspace(raw: any): RadarWorkspaceState {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_RADAR_WORKSPACE };
  }
  const selectedAbx =
    typeof raw.selectedAbx === 'string' && raw.selectedAbx.trim()
      ? raw.selectedAbx.trim()
      : DEFAULT_RADAR_WORKSPACE.selectedAbx;
  const frequency: 'q12h' | 'q8h' | 'q24h' = ['q12h', 'q8h', 'q24h'].includes(raw.frequency)
    ? raw.frequency
    : DEFAULT_RADAR_WORKSPACE.frequency;
  const selectedCoMeds = Array.isArray(raw.selectedCoMeds)
    ? raw.selectedCoMeds.filter((x: unknown): x is string => typeof x === 'string')
    : [...DEFAULT_RADAR_WORKSPACE.selectedCoMeds];
  const updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt
      ? raw.updatedAt
      : DEFAULT_RADAR_WORKSPACE.updatedAt;
  return { selectedAbx, frequency, selectedCoMeds, updatedAt };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeDeletedMap(raw: any): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k && typeof v === 'string' && v) {
      out[k] = v;
    }
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSchedules(raw: any): TreatmentSchedule[] {
  if (!Array.isArray(raw)) return [];
  const todayStr = formatLocalDateYYYYMMDD();
  return raw
    .filter((s) => s !== null && typeof s === 'object')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any, idx: number) => {
      const createdAt =
        typeof s.createdAt === 'string' && s.createdAt ? s.createdAt : new Date().toISOString();
      const updatedAt =
        typeof s.updatedAt === 'string' && s.updatedAt ? s.updatedAt : createdAt;
      const id =
        typeof s.id === 'string' && s.id.trim()
          ? s.id.trim()
          : `sch-${Date.parse(createdAt) || Date.now()}-${idx}`;
      const startDate =
        typeof s.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.startDate)
          ? s.startDate
          : todayStr;
      const durationDays =
        typeof s.durationDays === 'number' && s.durationDays >= 1 && s.durationDays <= 60
          ? Math.round(s.durationDays)
          : 7;
      const endDate =
        typeof s.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.endDate)
          ? s.endDate
          : computeEndDate(startDate, durationDays);
      const doseTimes =
        Array.isArray(s.doseTimes) && s.doseTimes.length > 0
          ? s.doseTimes.map(String)
          : ['08:00', '20:00'];

      const doses: ScheduledDose[] = Array.isArray(s.doses)
        ? s.doses
            .filter((d: unknown) => d !== null && typeof d === 'object')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((d: any, dIdx: number) => {
              const dayNumber = typeof d.dayNumber === 'number' && d.dayNumber >= 1 ? d.dayNumber : 1;
              const doseNumberInDay =
                typeof d.doseNumberInDay === 'number' && d.doseNumberInDay >= 1
                  ? d.doseNumberInDay
                  : dIdx + 1;
              const doseId =
                typeof d.id === 'string' && d.id.trim()
                  ? d.id.trim()
                  : `${id}-d${dayNumber}-${doseNumberInDay}`;
              const status: DoseStatus = ['upcoming', 'taken', 'missed', 'unconfirmed'].includes(d.status)
                ? d.status
                : 'upcoming';
              const takenAt = typeof d.takenAt === 'string' && d.takenAt ? d.takenAt : undefined;
              const missedAt = typeof d.missedAt === 'string' && d.missedAt ? d.missedAt : undefined;
              const statusUpdatedAt =
                typeof d.statusUpdatedAt === 'string' && d.statusUpdatedAt
                  ? d.statusUpdatedAt
                  : takenAt || missedAt || undefined;

              return {
                id: doseId,
                scheduleId: id,
                dayNumber,
                doseNumberInDay,
                scheduledTime: typeof d.scheduledTime === 'string' ? d.scheduledTime : '',
                status,
                ...(takenAt ? { takenAt } : {}),
                ...(missedAt ? { missedAt } : {}),
                ...(statusUpdatedAt ? { statusUpdatedAt } : {}),
                ...(typeof d.note === 'string' && d.note.trim() ? { note: d.note.trim() } : {}),
              };
            })
        : generateScheduleDoses(id, startDate, doseTimes, durationDays);

      return {
        id,
        ...(typeof s.antibioticId === 'string' && s.antibioticId.trim()
          ? { antibioticId: s.antibioticId.trim() }
          : {}),
        medicineName: typeof s.medicineName === 'string' ? s.medicineName.trim() : '',
        prescribedDose: typeof s.prescribedDose === 'string' ? s.prescribedDose.trim() : '',
        route: typeof s.route === 'string' && s.route ? s.route : 'oral',
        frequency: typeof s.frequency === 'string' && s.frequency ? s.frequency : 'twice_daily',
        doseTimes,
        startDate,
        durationDays,
        endDate,
        ...(typeof s.notes === 'string' && s.notes.trim() ? { notes: s.notes.trim() } : {}),
        ...(Array.isArray(s.coMedications)
          ? {
              coMedications: s.coMedications.filter(
                (c: unknown): c is string => typeof c === 'string' && Boolean(c)
              ),
            }
          : {}),
        ...(typeof s.coMedNotes === 'string' && s.coMedNotes.trim()
          ? { coMedNotes: s.coMedNotes.trim() }
          : {}),
        createdAt,
        updatedAt,
        doses,
      };
    });
}

/**
 * Computes a normalized content signature for deduplicating identical prescriptions
 * created during guest-to-account migration.
 */
export function getScheduleSignature(
  s: Pick<TreatmentSchedule, 'medicineName' | 'prescribedDose' | 'startDate' | 'frequency'>
): string {
  return [
    (s.medicineName || '').trim().toLowerCase(),
    (s.prescribedDose || '').trim().toLowerCase(),
    (s.startDate || '').trim(),
    (s.frequency || '').trim().toLowerCase(),
  ].join('|');
}

/**
 * Conflict-safe dose merge using `statusUpdatedAt` (and `takenAt`/`missedAt` fallback).
 * Ensures accidental dose status corrections (e.g., Undo back to upcoming or switching taken <-> missed)
 * and cross-device dose recordings always preserve the latest confirmed user action.
 */
export function mergeDoseRecords(primary: ScheduledDose, secondary: ScheduledDose): ScheduledDose {
  const pTime = primary.statusUpdatedAt || primary.takenAt || primary.missedAt || '';
  const sTime = secondary.statusUpdatedAt || secondary.takenAt || secondary.missedAt || '';

  if (pTime && sTime) {
    return sTime > pTime ? { ...secondary, id: primary.id, scheduleId: primary.scheduleId } : primary;
  }
  if (sTime && !pTime) {
    return { ...secondary, id: primary.id, scheduleId: primary.scheduleId };
  }
  if (pTime && !sTime) {
    return primary;
  }

  // Legacy fallback when neither dose has a timestamp: preserve explicit 'taken' or 'missed'
  const isExplicit = (st: DoseStatus) => st === 'taken' || st === 'missed';
  if (!isExplicit(primary.status) && isExplicit(secondary.status)) {
    return { ...secondary, id: primary.id, scheduleId: primary.scheduleId };
  }
  return primary;
}

export function mergeDeletedMaps(
  a?: Record<string, string>,
  b?: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = { ...(a || {}) };
  for (const [id, ts] of Object.entries(b || {})) {
    if (!out[id] || ts > out[id]) {
      out[id] = ts;
    }
  }
  return out;
}

/**
 * Non-destructively and deterministically merges two schedule lists while respecting tombstones
 * (`deletedMap`) and per-schedule / per-dose timestamps.
 */
export function mergeSchedules(
  primary: TreatmentSchedule[],
  secondary: TreatmentSchedule[],
  deletedMap: Record<string, string> = {}
): TreatmentSchedule[] {
  const isDeleted = (s: TreatmentSchedule) => {
    const delTs = deletedMap[s.id];
    if (!delTs) return false;
    const modTs = s.updatedAt || s.createdAt || '';
    return !modTs || delTs >= modTs;
  };

  const map = new Map<string, TreatmentSchedule>();
  for (const s of normalizeSchedules(primary)) {
    if (!isDeleted(s)) {
      map.set(s.id, s);
    }
  }

  for (const s of normalizeSchedules(secondary)) {
    if (isDeleted(s)) continue;
    const existing = map.get(s.id);
    if (!existing) {
      map.set(s.id, s);
    } else {
      const existingTs = existing.updatedAt || existing.createdAt || '';
      const incomingTs = s.updatedAt || s.createdAt || '';
      const base = incomingTs > existingTs ? s : existing;
      const other = incomingTs > existingTs ? existing : s;

      const mergedDoses = base.doses.map((bd) => {
        const match = other.doses.find(
          (od) =>
            od.id === bd.id ||
            (od.dayNumber === bd.dayNumber && od.doseNumberInDay === bd.doseNumberInDay)
        );
        return match ? mergeDoseRecords(bd, match) : bd;
      });

      const latestDoseTs = mergedDoses.reduce((acc, d) => {
        const t = d.statusUpdatedAt || d.takenAt || d.missedAt || '';
        return t > acc ? t : acc;
      }, '');
      const bestUpdatedAt = [existingTs, incomingTs, latestDoseTs].sort().pop() || base.updatedAt;

      map.set(s.id, {
        ...base,
        updatedAt: bestUpdatedAt,
        doses: mergedDoses,
      });
    }
  }

  return normalizeSchedules(Array.from(map.values())).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

/**
 * Safely merges local Guest records into an authenticated user's Cloud records on sign-in.
 * - Cloud records are ALWAYS the primary source of truth and are never overwritten by stale guest metadata.
 * - Avoids duplicate prescriptions by checking both `id` and `getScheduleSignature(s)`.
 * - Preserves all existing cloud records and only merges newer explicit dose confirmations or genuinely new guest schedules.
 */
export function safeMergeGuestIntoCloud(
  cloudSchedules: TreatmentSchedule[],
  guestSchedules: TreatmentSchedule[],
  cloudDeletedMap: Record<string, string> = {}
): { merged: TreatmentSchedule[]; changed: boolean } {
  const cleanCloud = normalizeSchedules(cloudSchedules).filter((s) => !cloudDeletedMap[s.id]);
  const cleanGuest = normalizeSchedules(guestSchedules).filter((s) => !cloudDeletedMap[s.id]);

  if (cleanGuest.length === 0) {
    return { merged: cleanCloud, changed: false };
  }

  const result = cleanCloud.map((c) => ({ ...c, doses: [...c.doses] }));
  let changed = false;

  for (const guestSch of cleanGuest) {
    const sig = getScheduleSignature(guestSch);
    const matchIdx = result.findIndex(
      (c) => c.id === guestSch.id || getScheduleSignature(c) === sig
    );

    if (matchIdx === -1) {
      result.push(guestSch);
      changed = true;
    } else {
      const cloudSch = result[matchIdx];
      let doseChanged = false;
      const mergedDoses = cloudSch.doses.map((cd) => {
        const gd = guestSch.doses.find(
          (d) =>
            d.id === cd.id ||
            (d.dayNumber === cd.dayNumber && d.doseNumberInDay === cd.doseNumberInDay)
        );
        if (!gd) return cd;
        // Cloud dose takes precedence if already confirmed; only adopt guest confirmation if cloud dose is still upcoming
        if (cd.status === 'upcoming' && (gd.status === 'taken' || gd.status === 'missed')) {
          doseChanged = true;
          return {
            ...cd,
            status: gd.status,
            ...(gd.takenAt ? { takenAt: gd.takenAt } : {}),
            ...(gd.missedAt ? { missedAt: gd.missedAt } : {}),
            statusUpdatedAt: gd.statusUpdatedAt || gd.takenAt || gd.missedAt || new Date().toISOString(),
          };
        }
        return cd;
      });

      if (doseChanged) {
        changed = true;
        result[matchIdx] = {
          ...cloudSch,
          updatedAt: new Date().toISOString(),
          doses: mergedDoses,
        };
      }
    }
  }

  const finalMerged = normalizeSchedules(result);
  return { merged: finalMerged, changed };
}

export function loadDeletedMap(uid?: string | null): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const raw = localStorage.getItem(getDeletedSchedulesStorageKey(effectiveUid));
    return raw ? normalizeDeletedMap(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function loadRadarWorkspace(uid?: string | null): RadarWorkspaceState {
  if (typeof window === 'undefined') return { ...DEFAULT_RADAR_WORKSPACE };
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const raw = localStorage.getItem(getRadarWorkspaceStorageKey(effectiveUid));
    if (raw) {
      return normalizeRadarWorkspace(JSON.parse(raw));
    }
    return { ...DEFAULT_RADAR_WORKSPACE };
  } catch {
    return { ...DEFAULT_RADAR_WORKSPACE };
  }
}

export function loadSchedules(uid?: string | null): TreatmentSchedule[] {
  if (typeof window === 'undefined') return [];
  const effectiveUid = uid !== undefined ? uid : auth?.currentUser?.uid ?? null;
  try {
    const scopedRaw = localStorage.getItem(getSchedulesStorageKey(effectiveUid));
    if (scopedRaw) {
      return normalizeSchedules(JSON.parse(scopedRaw));
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
    window.dispatchEvent(
      new CustomEvent(SCHEDULES_EVENT, { detail: { uid: effectiveUid, schedules: clean } })
    );
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
 * Reactive hook that synchronizes the user's Prescriptions, Treatment Schedules, Dose History,
 * and Radar Workspace across devices via Cloud Firestore (`users/{uid}`) when signed in,
 * while isolating accounts and providing safe guest-to-account migration and offline resilience.
 */
export function useSyncedSchedules() {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;

  const [schedules, setSchedulesState] = useState<TreatmentSchedule[]>(() => loadSchedules(uid));
  const [radarWorkspace, setRadarWorkspaceState] = useState<RadarWorkspaceState>(() =>
    loadRadarWorkspace(uid)
  );
  const [initialLoading, setInitialLoading] = useState<boolean>(() => Boolean(authLoading || uid));
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(() => {
    if (authLoading) return 'loading';
    if (!uid) return 'local_only';
    return 'loading';
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const hydratedUidRef = useRef<string | null>(null);
  const schedulesRef = useRef<TreatmentSchedule[]>(schedules);
  schedulesRef.current = schedules;
  const deletedMapRef = useRef<Record<string, string>>(loadDeletedMap(uid));
  const radarWorkspaceRef = useRef<RadarWorkspaceState>(radarWorkspace);
  radarWorkspaceRef.current = radarWorkspace;
  const hasPendingLocalWriteRef = useRef<boolean>(false);

  const pushStateToCloud = useCallback(
    async (
      targetUid: string,
      nextSchedules: TreatmentSchedule[],
      nextDeletedMap: Record<string, string>,
      nextRadarWorkspace?: RadarWorkspaceState
    ): Promise<boolean> => {
      if (!targetUid || !configured || !db) {
        setSyncStatus('local_only');
        return false;
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        hasPendingLocalWriteRef.current = true;
        setSyncStatus('offline_pending');
        return false;
      }

      setSyncStatus('saving');
      setSyncError(null);
      const userDocRef = doc(db, 'users', targetUid);

      try {
        let resolvedSchedules = nextSchedules;
        let resolvedDeleted = nextDeletedMap;
        let resolvedRadar = nextRadarWorkspace || radarWorkspaceRef.current;

        try {
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(userDocRef);
            const data = snap.exists() ? snap.data() : {};
            const remoteDeleted = normalizeDeletedMap(data?.deletedScheduleIds);
            resolvedDeleted = mergeDeletedMaps(remoteDeleted, nextDeletedMap);

            const remoteSchedules = Array.isArray(data?.schedules)
              ? normalizeSchedules(data?.schedules)
              : [];
            resolvedSchedules = mergeSchedules(nextSchedules, remoteSchedules, resolvedDeleted);

            if (data?.radarWorkspace) {
              const remoteRadar = normalizeRadarWorkspace(data.radarWorkspace);
              if (remoteRadar.updatedAt > resolvedRadar.updatedAt) {
                resolvedRadar = remoteRadar;
              }
            }

            tx.set(
              userDocRef,
              {
                schedules: stripUndefined(resolvedSchedules),
                deletedScheduleIds: stripUndefined(resolvedDeleted),
                radarWorkspace: stripUndefined(resolvedRadar),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          });
        } catch (txErr) {
          // If runTransaction fails due to offline cache state, fall back to setDoc with merge
          await setDoc(
            userDocRef,
            {
              schedules: stripUndefined(resolvedSchedules),
              deletedScheduleIds: stripUndefined(resolvedDeleted),
              radarWorkspace: stripUndefined(resolvedRadar),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            throw txErr;
          }
        }

        // Persist merged result to UID-scoped cache
        try {
          localStorage.setItem(
            getSchedulesStorageKey(targetUid),
            JSON.stringify(stripUndefined(resolvedSchedules))
          );
          localStorage.setItem(
            getDeletedSchedulesStorageKey(targetUid),
            JSON.stringify(stripUndefined(resolvedDeleted))
          );
          localStorage.setItem(
            getRadarWorkspaceStorageKey(targetUid),
            JSON.stringify(stripUndefined(resolvedRadar))
          );
        } catch {}

        deletedMapRef.current = resolvedDeleted;
        schedulesRef.current = resolvedSchedules;
        setSchedulesState((prev) =>
          JSON.stringify(prev) === JSON.stringify(resolvedSchedules) ? prev : resolvedSchedules
        );

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          hasPendingLocalWriteRef.current = true;
          setSyncStatus('offline_pending');
          return false;
        }

        hasPendingLocalWriteRef.current = false;
        const nowIso = new Date().toISOString();
        setLastSyncedAt(nowIso);
        setSyncStatus('synced');
        return true;
      } catch (err: unknown) {
        console.error('Failed to synchronize treatment schedules to Cloud Firestore:', err);
        hasPendingLocalWriteRef.current = true;
        const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        setSyncStatus(isOffline ? 'offline_pending' : 'error');
        setSyncError(
          err instanceof Error ? err.message : 'Cloud synchronization failed'
        );
        return false;
      }
    },
    []
  );

  useEffect(() => {
    if (authLoading) {
      setInitialLoading(true);
      setSyncStatus('loading');
      return;
    }

    // Signed-out / Guest mode: strictly load only guest storage, never expose any UID cache
    if (!uid) {
      hydratedUidRef.current = null;
      hasPendingLocalWriteRef.current = false;
      deletedMapRef.current = loadDeletedMap(null);
      const guestSchedules = loadSchedules(null);
      const guestRadar = loadRadarWorkspace(null);
      schedulesRef.current = guestSchedules;
      radarWorkspaceRef.current = guestRadar;
      setSchedulesState(guestSchedules);
      setRadarWorkspaceState(guestRadar);
      setInitialLoading(false);
      setSyncStatus('local_only');
      setSyncError(null);
      return;
    }

    // Signed-in user: load UID-scoped cache if present on this device, but keep loading=true
    // until Cloud Firestore hydration completes if no UID cache exists yet
    const cachedDeleted = loadDeletedMap(uid);
    deletedMapRef.current = cachedDeleted;

    let cachedScoped: TreatmentSchedule[] | null = null;
    try {
      const cachedScopedRaw = localStorage.getItem(getSchedulesStorageKey(uid));
      if (cachedScopedRaw !== null) {
        cachedScoped = normalizeSchedules(JSON.parse(cachedScopedRaw));
      }
    } catch {}

    const cachedRadar = loadRadarWorkspace(uid);
    radarWorkspaceRef.current = cachedRadar;
    setRadarWorkspaceState(cachedRadar);

    if (cachedScoped && cachedScoped.length > 0) {
      schedulesRef.current = cachedScoped;
      setSchedulesState(cachedScoped);
      setInitialLoading(false);
    } else {
      // Do not display an empty tracker as if the patient has no prescriptions while cloud data is still loading
      setInitialLoading(true);
    }

    if (!configured || !db) {
      hydratedUidRef.current = uid;
      setInitialLoading(false);
      setSyncStatus('local_only');
      return;
    }

    let cancelled = false;
    setSyncStatus('loading');
    setSyncError(null);
    const userDocRef = doc(db, 'users', uid);

    getDoc(userDocRef)
      .then(async (snap) => {
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : undefined;
        const cloudRaw = data?.schedules;
        const hasCloudSchedules = Array.isArray(cloudRaw);
        const cloudSchedules = hasCloudSchedules ? normalizeSchedules(cloudRaw) : [];
        const cloudDeleted = normalizeDeletedMap(data?.deletedScheduleIds);
        const mergedDeleted = mergeDeletedMaps(cloudDeleted, cachedDeleted);
        deletedMapRef.current = mergedDeleted;

        // Check if there is un-migrated guest data on this device
        const migrationKey = `${MIGRATED_LEGACY_SCHEDULES_PREFIX}${uid}`;
        const alreadyMigrated = localStorage.getItem(migrationKey) === '1';
        let guestSchedules: TreatmentSchedule[] = [];
        if (!alreadyMigrated) {
          try {
            const rawGuest = localStorage.getItem(STORAGE_KEY);
            if (rawGuest) {
              guestSchedules = normalizeSchedules(JSON.parse(rawGuest));
            }
          } catch {}
        }

        // First combine cloud schedules with any UID-scoped offline edits on this device
        const cloudPlusUidCache = cachedScoped
          ? mergeSchedules(cloudSchedules, cachedScoped, mergedDeleted)
          : cloudSchedules.filter((s) => !mergedDeleted[s.id]);

        // Next, safely merge any un-migrated guest schedules without overwriting or duplicating cloud records
        let resolved = cloudPlusUidCache;
        let shouldWriteToCloud = false;

        if (!alreadyMigrated && guestSchedules.length > 0) {
          const guestMerge = safeMergeGuestIntoCloud(cloudPlusUidCache, guestSchedules, mergedDeleted);
          resolved = guestMerge.merged;
          if (guestMerge.changed) {
            shouldWriteToCloud = true;
          }
        } else if (
          hasCloudSchedules &&
          JSON.stringify(cloudPlusUidCache) !== JSON.stringify(cloudSchedules)
        ) {
          shouldWriteToCloud = true;
        } else if (!hasCloudSchedules && resolved.length > 0) {
          shouldWriteToCloud = true;
        }

        // Hydrate Radar Workspace state from cloud if newer
        let resolvedRadar = cachedRadar;
        if (data?.radarWorkspace) {
          const cloudRadar = normalizeRadarWorkspace(data.radarWorkspace);
          if (cloudRadar.updatedAt >= cachedRadar.updatedAt) {
            resolvedRadar = cloudRadar;
          } else {
            shouldWriteToCloud = true;
          }
        }

        try {
          localStorage.setItem(
            getSchedulesStorageKey(uid),
            JSON.stringify(stripUndefined(resolved))
          );
          localStorage.setItem(
            getDeletedSchedulesStorageKey(uid),
            JSON.stringify(stripUndefined(mergedDeleted))
          );
          localStorage.setItem(
            getRadarWorkspaceStorageKey(uid),
            JSON.stringify(stripUndefined(resolvedRadar))
          );
          if (!alreadyMigrated && guestSchedules.length > 0) {
            localStorage.setItem(migrationKey, '1');
            // Clear un-scoped guest key after migration so another user on this device never sees it
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {}

        hydratedUidRef.current = uid;
        schedulesRef.current = resolved;
        radarWorkspaceRef.current = resolvedRadar;
        setSchedulesState(resolved);
        setRadarWorkspaceState(resolvedRadar);
        setInitialLoading(false);

        const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        if (shouldWriteToCloud) {
          await pushStateToCloud(uid, resolved, mergedDeleted, resolvedRadar);
        } else if (isOffline || snap.metadata.fromCache) {
          setSyncStatus(isOffline ? 'offline_pending' : 'synced');
          if (!isOffline) setLastSyncedAt(new Date().toISOString());
        } else {
          setSyncStatus('synced');
          setLastSyncedAt(new Date().toISOString());
        }
      })
      .catch((err) => {
        console.error('Error hydrating treatment schedules from Firestore:', err);
        if (!cancelled) {
          hydratedUidRef.current = uid;
          setInitialLoading(false);
          const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
          setSyncStatus(isOffline ? 'offline_pending' : 'error');
          setSyncError(
            err instanceof Error ? err.message : 'Unable to load cloud records'
          );
        }
      });

    // Real-time Firestore listener across devices
    const unsubscribe = onSnapshot(
      userDocRef,
      { includeMetadataChanges: true },
      (snap) => {
        if (cancelled || hydratedUidRef.current !== uid) return;
        if (!snap.exists()) return;
        const data = snap.data();

        const remoteDeleted = normalizeDeletedMap(data?.deletedScheduleIds);
        const mergedDeleted = mergeDeletedMaps(deletedMapRef.current, remoteDeleted);
        deletedMapRef.current = mergedDeleted;

        if (Array.isArray(data?.schedules)) {
          const remoteSchedules = normalizeSchedules(data?.schedules);
          const mergedSchedules = hasPendingLocalWriteRef.current
            ? mergeSchedules(schedulesRef.current, remoteSchedules, mergedDeleted)
            : mergeSchedules(remoteSchedules, schedulesRef.current, mergedDeleted);

          try {
            localStorage.setItem(
              getSchedulesStorageKey(uid),
              JSON.stringify(stripUndefined(mergedSchedules))
            );
            localStorage.setItem(
              getDeletedSchedulesStorageKey(uid),
              JSON.stringify(stripUndefined(mergedDeleted))
            );
          } catch {}

          schedulesRef.current = mergedSchedules;
          setSchedulesState((prev) =>
            JSON.stringify(prev) === JSON.stringify(mergedSchedules) ? prev : mergedSchedules
          );
        }

        if (data?.radarWorkspace) {
          const remoteRadar = normalizeRadarWorkspace(data.radarWorkspace);
          if (remoteRadar.updatedAt > radarWorkspaceRef.current.updatedAt) {
            radarWorkspaceRef.current = remoteRadar;
            try {
              localStorage.setItem(
                getRadarWorkspaceStorageKey(uid),
                JSON.stringify(stripUndefined(remoteRadar))
              );
            } catch {}
            setRadarWorkspaceState(remoteRadar);
          }
        }

        const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        if (snap.metadata.hasPendingWrites || isOffline) {
          setSyncStatus(isOffline ? 'offline_pending' : 'saving');
        } else if (!hasPendingLocalWriteRef.current) {
          setSyncStatus('synced');
          setSyncError(null);
          setLastSyncedAt(new Date().toISOString());
        }
      },
      (err) => {
        console.warn('Firestore schedules listener warning:', err);
        if (!cancelled) {
          const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
          setSyncStatus(isOffline ? 'offline_pending' : 'error');
          setSyncError(err.message);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid, authLoading, pushStateToCloud]);

  // Listen for online/offline transitions to keep syncStatus honest and flush pending writes
  useEffect(() => {
    if (typeof window === 'undefined' || !uid) return;
    const handleOnline = () => {
      if (hasPendingLocalWriteRef.current) {
        void pushStateToCloud(
          uid,
          schedulesRef.current,
          deletedMapRef.current,
          radarWorkspaceRef.current
        );
      } else {
        setSyncStatus('synced');
      }
    };
    const handleOffline = () => {
      setSyncStatus('offline_pending');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [uid, pushStateToCloud]);

  // Listen for same-tab updates across components (e.g., PrescriptionRadar <-> Tracker)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.uid !== uid) return;
      if (Array.isArray(detail.schedules)) {
        schedulesRef.current = detail.schedules;
        setSchedulesState((prev) =>
          JSON.stringify(prev) === JSON.stringify(detail.schedules) ? prev : detail.schedules
        );
      }
      if (detail.radarWorkspace) {
        radarWorkspaceRef.current = detail.radarWorkspace;
        setRadarWorkspaceState((prev) =>
          JSON.stringify(prev) === JSON.stringify(detail.radarWorkspace)
            ? prev
            : detail.radarWorkspace
        );
      }
    };
    window.addEventListener(SCHEDULES_EVENT, handler);
    return () => window.removeEventListener(SCHEDULES_EVENT, handler);
  }, [uid]);

  const updateSchedules = useCallback(
    (updater: TreatmentSchedule[] | ((prev: TreatmentSchedule[]) => TreatmentSchedule[])) => {
      const prev = schedulesRef.current;
      const nextRaw = typeof updater === 'function' ? updater(prev) : updater;
      const nowIso = new Date().toISOString();

      // Detect any removed schedule IDs so deletions sync across devices via tombstones
      const nextIds = new Set(nextRaw.map((s) => s.id));
      const updatedDeleted = { ...deletedMapRef.current };
      for (const oldSch of prev) {
        if (!nextIds.has(oldSch.id)) {
          updatedDeleted[oldSch.id] = nowIso;
        }
      }
      // If a schedule is present in nextRaw, ensure its updatedAt reflects modifications
      const stampedRaw = nextRaw.map((s) => {
        const oldMatch = prev.find((p) => p.id === s.id);
        if (!oldMatch || JSON.stringify(oldMatch) !== JSON.stringify(s)) {
          return { ...s, updatedAt: nowIso };
        }
        return s;
      });

      const next = stripUndefined(normalizeSchedules(stampedRaw));
      deletedMapRef.current = updatedDeleted;
      schedulesRef.current = next;
      setSchedulesState(next);

      try {
        localStorage.setItem(getSchedulesStorageKey(uid), JSON.stringify(next));
        localStorage.setItem(
          getDeletedSchedulesStorageKey(uid),
          JSON.stringify(stripUndefined(updatedDeleted))
        );
        window.dispatchEvent(
          new CustomEvent(SCHEDULES_EVENT, { detail: { uid, schedules: next } })
        );
      } catch (err) {
        console.error('Failed to save schedules locally:', err);
      }

      if (uid && configured && db) {
        void pushStateToCloud(uid, next, updatedDeleted, radarWorkspaceRef.current);
      } else {
        setSyncStatus('local_only');
      }
    },
    [uid, pushStateToCloud]
  );

  const deleteScheduleById = useCallback(
    (scheduleId: string) => {
      updateSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    },
    [updateSchedules]
  );

  const updateDoseStatus = useCallback(
    (scheduleId: string, doseId: string, newStatus: DoseStatus) => {
      const nowIso = new Date().toISOString();
      updateSchedules((prev) =>
        prev.map((sch) => {
          if (sch.id !== scheduleId) return sch;
          const updatedDoses = sch.doses.map((d) => {
            if (d.id !== doseId) return d;
            const { takenAt: _oldTaken, missedAt: _oldMissed, ...rest } = d;
            if (newStatus === 'taken') {
              return {
                ...rest,
                status: 'taken' as const,
                takenAt: nowIso,
                statusUpdatedAt: nowIso,
              };
            }
            if (newStatus === 'missed') {
              return {
                ...rest,
                status: 'missed' as const,
                missedAt: nowIso,
                statusUpdatedAt: nowIso,
              };
            }
            // Resetting / correcting accidental entry back to upcoming (or overdue-unconfirmed based on clock)
            return {
              ...rest,
              status: 'upcoming' as const,
              statusUpdatedAt: nowIso,
            };
          });
          return {
            ...sch,
            updatedAt: nowIso,
            doses: updatedDoses,
          };
        })
      );
    },
    [updateSchedules]
  );

  const updateRadarWorkspace = useCallback(
    (partial: Partial<Omit<RadarWorkspaceState, 'updatedAt'>>) => {
      const nowIso = new Date().toISOString();
      const next: RadarWorkspaceState = normalizeRadarWorkspace({
        ...radarWorkspaceRef.current,
        ...partial,
        updatedAt: nowIso,
      });
      radarWorkspaceRef.current = next;
      setRadarWorkspaceState(next);

      try {
        localStorage.setItem(getRadarWorkspaceStorageKey(uid), JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent(SCHEDULES_EVENT, { detail: { uid, radarWorkspace: next } })
        );
      } catch {}

      if (uid && configured && db) {
        void pushStateToCloud(uid, schedulesRef.current, deletedMapRef.current, next);
      }
    },
    [uid, pushStateToCloud]
  );

  const retrySync = useCallback(() => {
    if (!uid) return;
    void pushStateToCloud(
      uid,
      schedulesRef.current,
      deletedMapRef.current,
      radarWorkspaceRef.current
    );
  }, [uid, pushStateToCloud]);

  const syncing = syncStatus === 'loading' || syncStatus === 'saving';

  return {
    schedules,
    setSchedules: updateSchedules,
    deleteScheduleById,
    updateDoseStatus,
    radarWorkspace,
    updateRadarWorkspace,
    syncing,
    initialLoading,
    syncStatus,
    syncError,
    lastSyncedAt,
    retrySync,
    isAuthenticated: Boolean(uid),
  };
}

/**
 * Computes effective status for a dose:
 * - 'taken': explicitly marked taken by patient
 * - 'missed': explicitly marked missed by patient
 * - 'unconfirmed': scheduled time has passed, but not yet confirmed by patient (never automatically labeled 'missed')
 * - 'upcoming': scheduled time is in the future
 */
export function getDoseStatus(dose: ScheduledDose, now = new Date()): DoseStatus {
  if (dose.status === 'taken') return 'taken';
  if (dose.status === 'missed') return 'missed';
  const scheduled = new Date(dose.scheduledTime);
  if (!isNaN(scheduled.getTime()) && now > scheduled) return 'unconfirmed';
  return 'upcoming';
}

export function calculateScheduleProgress(sch: TreatmentSchedule, now = new Date()) {
  const totalDoses = sch.doses.length;
  let takenCount = 0;
  let missedCount = 0;
  let unconfirmedCount = 0;
  let upcomingCount = 0;

  for (const d of sch.doses) {
    const st = getDoseStatus(d, now);
    if (st === 'taken') takenCount++;
    else if (st === 'missed') missedCount++;
    else if (st === 'unconfirmed') unconfirmedCount++;
    else upcomingCount++;
  }

  const progressPercent = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 0;
  return {
    totalDoses,
    takenCount,
    missedCount,
    unconfirmedCount,
    upcomingCount,
    progressPercent,
  };
}

/**
 * Generates all doses for a schedule over durationDays using local calendar dates,
 * optionally preserving existing dose confirmations when editing a schedule.
 */
export function generateScheduleDoses(
  scheduleId: string,
  startDateStr: string,
  doseTimes: string[],
  durationDays: number,
  existingDoses?: ScheduledDose[]
): ScheduledDose[] {
  const doses: ScheduledDose[] = [];
  const parts = startDateStr.split('-').map(Number);
  const now = new Date();
  const [startYear, startMonth, startDay] =
    parts.length === 3 && !parts.some(isNaN)
      ? parts
      : [now.getFullYear(), now.getMonth() + 1, now.getDate()];

  for (let day = 0; day < durationDays; day++) {
    const currentDate = new Date(startYear, startMonth - 1, startDay + day);
    const dateStr = formatLocalDateYYYYMMDD(currentDate);

    doseTimes.forEach((timeStr, idx) => {
      const cleanTime = /^\d{2}:\d{2}$/.test(timeStr) ? timeStr : '08:00';
      const scheduledIso = `${dateStr}T${cleanTime}:00`;
      const dayNum = day + 1;
      const doseNum = idx + 1;
      const doseId = `${scheduleId}-d${dayNum}-${doseNum}`;

      const prevMatch = existingDoses?.find(
        (ed) =>
          ed.id === doseId ||
          (ed.dayNumber === dayNum && ed.doseNumberInDay === doseNum)
      );

      if (prevMatch && (prevMatch.status === 'taken' || prevMatch.status === 'missed')) {
        doses.push({
          ...prevMatch,
          id: doseId,
          scheduleId,
          dayNumber: dayNum,
          doseNumberInDay: doseNum,
          scheduledTime: scheduledIso,
        });
      } else {
        doses.push({
          id: doseId,
          scheduleId,
          dayNumber: dayNum,
          doseNumberInDay: doseNum,
          scheduledTime: scheduledIso,
          status: 'upcoming',
        });
      }
    });
  }

  return doses;
}
