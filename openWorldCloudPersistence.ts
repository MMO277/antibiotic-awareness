import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  createInitialPatientStates,
  EquipmentId,
  NURSING_SHIFT_MISSIONS,
  PatientSimState,
} from './openWorldHospitalData';

export interface OpenWorldWorkflowFlags {
  xrayStudyReady: boolean;
  xrayReportedToClinician: boolean;
  labSpecimenSubmitted: boolean;
  labResultReviewed: boolean;
  allergyDiscrepancyBlocked: boolean;
  allergyEscalatedToTeam: boolean;
  safeMedAdministered: boolean;
  treatmentAreaDisinfected: boolean;
  erSuppliesRestocked: boolean;
  restockLoggedAtStation: boolean;
  deteriorationAlertedAtStation: boolean;
  sbarHandoverCompleted: boolean;
}

export interface OpenWorldSavedState {
  version: number;
  xp: number;
  level: number;
  visited: string[];
  completedTasks: string[];
  completedMissions: string[];
  activeMissionId: string;
  missionProgress: Record<string, string[]>;
  inventory: EquipmentId[];
  carriedItemId: EquipmentId | null;
  placedItems: Record<string, EquipmentId[]>;
  patientStates: Record<string, PatientSimState>;
  workflowFlags: OpenWorldWorkflowFlags;
  rewardedEvents: string[];
  position: { x: number; z: number };
  rotationY: number;
  updatedAt: string;
}

const LOCAL_STORAGE_PREFIX = 'aa_open_world_v3';

export function computeNurseLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.max(0, xp) / 120) + 1);
}

export function createDefaultOpenWorldState(): OpenWorldSavedState {
  const missionProgress: Record<string, string[]> = {};
  for (const m of NURSING_SHIFT_MISSIONS) {
    missionProgress[m.id] = [];
  }
  return {
    version: 3,
    xp: 0,
    level: 1,
    visited: [],
    completedTasks: [],
    completedMissions: [],
    activeMissionId: NURSING_SHIFT_MISSIONS[0].id,
    missionProgress,
    inventory: [],
    carriedItemId: null,
    placedItems: {},
    patientStates: createInitialPatientStates(),
    workflowFlags: {
      xrayStudyReady: false,
      xrayReportedToClinician: false,
      labSpecimenSubmitted: false,
      labResultReviewed: false,
      allergyDiscrepancyBlocked: false,
      allergyEscalatedToTeam: false,
      safeMedAdministered: false,
      treatmentAreaDisinfected: false,
      erSuppliesRestocked: false,
      restockLoggedAtStation: false,
      deteriorationAlertedAtStation: false,
      sbarHandoverCompleted: false,
    },
    rewardedEvents: [],
    position: { x: 0, z: -8 },
    rotationY: Math.PI,
    updatedAt: new Date(0).toISOString(),
  };
}

export function getOpenWorldStorageKey(uid?: string | null): string {
  return `${LOCAL_STORAGE_PREFIX}:${uid || 'guest'}`;
}

export function sanitizeOpenWorldState(raw: unknown): OpenWorldSavedState {
  const base = createDefaultOpenWorldState();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;

  const xp = typeof obj.xp === 'number' && Number.isFinite(obj.xp) ? Math.max(0, obj.xp) : base.xp;
  const visited = Array.isArray(obj.visited)
    ? Array.from(new Set(obj.visited.filter((v): v is string => typeof v === 'string')))
    : base.visited;
  const completedTasks = Array.isArray(obj.completedTasks)
    ? Array.from(new Set(obj.completedTasks.filter((v): v is string => typeof v === 'string')))
    : base.completedTasks;
  const completedMissions = Array.isArray(obj.completedMissions)
    ? Array.from(new Set(obj.completedMissions.filter((v): v is string => typeof v === 'string')))
    : base.completedMissions;

  const activeMissionId =
    typeof obj.activeMissionId === 'string' &&
    NURSING_SHIFT_MISSIONS.some((m) => m.id === obj.activeMissionId)
      ? obj.activeMissionId
      : base.activeMissionId;

  const missionProgress: Record<string, string[]> = { ...base.missionProgress };
  if (obj.missionProgress && typeof obj.missionProgress === 'object') {
    const mp = obj.missionProgress as Record<string, unknown>;
    for (const m of NURSING_SHIFT_MISSIONS) {
      if (Array.isArray(mp[m.id])) {
        missionProgress[m.id] = Array.from(
          new Set((mp[m.id] as unknown[]).filter((x): x is string => typeof x === 'string')),
        );
      }
    }
  }

  const inventory = Array.isArray(obj.inventory)
    ? Array.from(new Set(obj.inventory.filter((x): x is EquipmentId => typeof x === 'string')))
    : base.inventory;

  const carriedItemId =
    typeof obj.carriedItemId === 'string' ? (obj.carriedItemId as EquipmentId) : null;

  const placedItems: Record<string, EquipmentId[]> = {};
  if (obj.placedItems && typeof obj.placedItems === 'object') {
    for (const [k, v] of Object.entries(obj.placedItems as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        placedItems[k] = v.filter((x): x is EquipmentId => typeof x === 'string');
      }
    }
  }

  const patientStates: Record<string, PatientSimState> = { ...base.patientStates };
  if (obj.patientStates && typeof obj.patientStates === 'object') {
    const ps = obj.patientStates as Record<string, Record<string, unknown>>;
    for (const ptId of Object.keys(patientStates)) {
      const savedPt = ps[ptId];
      if (savedPt && typeof savedPt === 'object') {
        patientStates[ptId] = {
          ...patientStates[ptId],
          visualState:
            savedPt.visualState === 'resting' ||
            savedPt.visualState === 'sitting' ||
            savedPt.visualState === 'waiting' ||
            savedPt.visualState === 'distress' ||
            savedPt.visualState === 'stabilized'
              ? savedPt.visualState
              : patientStates[ptId].visualState,
          identityConfirmed: Boolean(savedPt.identityConfirmed),
          symptomsAsked: Boolean(savedPt.symptomsAsked),
          vitalsMeasured: Boolean(savedPt.vitalsMeasured),
          chartRecorded: Boolean(savedPt.chartRecorded),
          comfortProvided: Boolean(savedPt.comfortProvided),
          escalatedToTeam: Boolean(savedPt.escalatedToTeam),
          specimenCollected: Boolean(savedPt.specimenCollected),
          xrayCompleted: Boolean(savedPt.xrayCompleted),
          medicationVerified: Boolean(savedPt.medicationVerified),
          allergyFlagged: Boolean(savedPt.allergyFlagged),
          medicationAdministered: Boolean(savedPt.medicationAdministered),
          statusNoteAr:
            typeof savedPt.statusNoteAr === 'string'
              ? savedPt.statusNoteAr
              : patientStates[ptId].statusNoteAr,
          statusNoteEn:
            typeof savedPt.statusNoteEn === 'string'
              ? savedPt.statusNoteEn
              : patientStates[ptId].statusNoteEn,
        };
      }
    }
  }

  const workflowFlags: OpenWorldWorkflowFlags = { ...base.workflowFlags };
  if (obj.workflowFlags && typeof obj.workflowFlags === 'object') {
    const wf = obj.workflowFlags as Record<string, unknown>;
    (Object.keys(workflowFlags) as Array<keyof OpenWorldWorkflowFlags>).forEach((k) => {
      if (typeof wf[k] === 'boolean') {
        workflowFlags[k] = wf[k] as boolean;
      }
    });
  }

  const rewardedEvents = Array.isArray(obj.rewardedEvents)
    ? Array.from(new Set(obj.rewardedEvents.filter((x): x is string => typeof x === 'string')))
    : base.rewardedEvents;

  let posX = base.position.x;
  let posZ = base.position.z;
  if (obj.position && typeof obj.position === 'object') {
    const p = obj.position as Record<string, unknown>;
    if (typeof p.x === 'number' && Number.isFinite(p.x)) {
      posX = Math.max(-44, Math.min(44, p.x));
    }
    if (typeof p.z === 'number' && Number.isFinite(p.z)) {
      posZ = Math.max(-44, Math.min(44, p.z));
    }
  }

  const rotationY =
    typeof obj.rotationY === 'number' && Number.isFinite(obj.rotationY)
      ? obj.rotationY
      : base.rotationY;

  const updatedAt =
    typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString();

  return {
    version: 3,
    xp,
    level: computeNurseLevel(xp),
    visited,
    completedTasks,
    completedMissions,
    activeMissionId,
    missionProgress,
    inventory,
    carriedItemId,
    placedItems,
    patientStates,
    workflowFlags,
    rewardedEvents,
    position: { x: posX, z: posZ },
    rotationY,
    updatedAt,
  };
}

export function mergeOpenWorldStates(
  localState: OpenWorldSavedState,
  cloudState: OpenWorldSavedState,
): OpenWorldSavedState {
  const cloudNewer =
    Date.parse(cloudState.updatedAt || '1970-01-01') >=
    Date.parse(localState.updatedAt || '1970-01-01');
  const primary = cloudNewer ? cloudState : localState;
  const secondary = cloudNewer ? localState : cloudState;

  const mergedXp = Math.max(primary.xp, secondary.xp);
  const visited = Array.from(new Set([...primary.visited, ...secondary.visited]));
  const completedTasks = Array.from(
    new Set([...primary.completedTasks, ...secondary.completedTasks]),
  );
  const completedMissions = Array.from(
    new Set([...primary.completedMissions, ...secondary.completedMissions]),
  );
  const inventory = Array.from(new Set([...primary.inventory, ...secondary.inventory]));
  const rewardedEvents = Array.from(
    new Set([...primary.rewardedEvents, ...secondary.rewardedEvents]),
  );

  const missionProgress: Record<string, string[]> = {};
  for (const m of NURSING_SHIFT_MISSIONS) {
    missionProgress[m.id] = Array.from(
      new Set([
        ...(primary.missionProgress[m.id] || []),
        ...(secondary.missionProgress[m.id] || []),
      ]),
    );
  }

  const patientStates: Record<string, PatientSimState> = { ...primary.patientStates };
  for (const ptId of Object.keys(patientStates)) {
    const a = primary.patientStates[ptId];
    const b = secondary.patientStates[ptId];
    if (a && b) {
      patientStates[ptId] = {
        ...a,
        identityConfirmed: a.identityConfirmed || b.identityConfirmed,
        symptomsAsked: a.symptomsAsked || b.symptomsAsked,
        vitalsMeasured: a.vitalsMeasured || b.vitalsMeasured,
        chartRecorded: a.chartRecorded || b.chartRecorded,
        comfortProvided: a.comfortProvided || b.comfortProvided,
        escalatedToTeam: a.escalatedToTeam || b.escalatedToTeam,
        specimenCollected: a.specimenCollected || b.specimenCollected,
        xrayCompleted: a.xrayCompleted || b.xrayCompleted,
        medicationVerified: a.medicationVerified || b.medicationVerified,
        allergyFlagged: a.allergyFlagged || b.allergyFlagged,
        medicationAdministered: a.medicationAdministered || b.medicationAdministered,
        visualState:
          a.visualState === 'stabilized' || b.visualState === 'stabilized'
            ? 'stabilized'
            : a.visualState,
      };
    }
  }

  const workflowFlags: OpenWorldWorkflowFlags = {
    xrayStudyReady: primary.workflowFlags.xrayStudyReady || secondary.workflowFlags.xrayStudyReady,
    xrayReportedToClinician:
      primary.workflowFlags.xrayReportedToClinician ||
      secondary.workflowFlags.xrayReportedToClinician,
    labSpecimenSubmitted:
      primary.workflowFlags.labSpecimenSubmitted || secondary.workflowFlags.labSpecimenSubmitted,
    labResultReviewed:
      primary.workflowFlags.labResultReviewed || secondary.workflowFlags.labResultReviewed,
    allergyDiscrepancyBlocked:
      primary.workflowFlags.allergyDiscrepancyBlocked ||
      secondary.workflowFlags.allergyDiscrepancyBlocked,
    allergyEscalatedToTeam:
      primary.workflowFlags.allergyEscalatedToTeam ||
      secondary.workflowFlags.allergyEscalatedToTeam,
    safeMedAdministered:
      primary.workflowFlags.safeMedAdministered || secondary.workflowFlags.safeMedAdministered,
    treatmentAreaDisinfected:
      primary.workflowFlags.treatmentAreaDisinfected ||
      secondary.workflowFlags.treatmentAreaDisinfected,
    erSuppliesRestocked:
      primary.workflowFlags.erSuppliesRestocked || secondary.workflowFlags.erSuppliesRestocked,
    restockLoggedAtStation:
      primary.workflowFlags.restockLoggedAtStation ||
      secondary.workflowFlags.restockLoggedAtStation,
    deteriorationAlertedAtStation:
      primary.workflowFlags.deteriorationAlertedAtStation ||
      secondary.workflowFlags.deteriorationAlertedAtStation,
    sbarHandoverCompleted:
      primary.workflowFlags.sbarHandoverCompleted || secondary.workflowFlags.sbarHandoverCompleted,
  };

  return {
    version: 3,
    xp: mergedXp,
    level: computeNurseLevel(mergedXp),
    visited,
    completedTasks,
    completedMissions,
    activeMissionId: primary.activeMissionId,
    missionProgress,
    inventory,
    carriedItemId: primary.carriedItemId ?? secondary.carriedItemId,
    placedItems: { ...secondary.placedItems, ...primary.placedItems },
    patientStates,
    workflowFlags,
    rewardedEvents,
    position: primary.position,
    rotationY: primary.rotationY,
    updatedAt: primary.updatedAt,
  };
}

export function readLocalOpenWorldState(uid?: string | null): OpenWorldSavedState | null {
  try {
    const raw = localStorage.getItem(getOpenWorldStorageKey(uid));
    if (!raw) return null;
    return sanitizeOpenWorldState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeLocalOpenWorldState(uid: string | null | undefined, state: OpenWorldSavedState): void {
  try {
    localStorage.setItem(getOpenWorldStorageKey(uid), JSON.stringify(state));
  } catch {
    /* ignore storage quota errors */
  }
}

export async function loadOpenWorldProgressForUser(
  uid?: string | null,
): Promise<{ state: OpenWorldSavedState; fromCloud: boolean }> {
  const local = readLocalOpenWorldState(uid);
  if (!uid) {
    return { state: local ?? createDefaultOpenWorldState(), fromCloud: false };
  }

  try {
    const ref = doc(db, 'users', uid, 'gameProgress', 'openWorld');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const cloudState = sanitizeOpenWorldState(snap.data());
      const merged = local ? mergeOpenWorldStates(local, cloudState) : cloudState;
      writeLocalOpenWorldState(uid, merged);
      return { state: merged, fromCloud: true };
    }
  } catch (err) {
    console.warn('Cloud load fallback to local state:', err);
  }

  return { state: local ?? createDefaultOpenWorldState(), fromCloud: false };
}

export async function saveOpenWorldProgressToCloud(
  uid: string,
  state: OpenWorldSavedState,
  overwriteReset = false,
): Promise<boolean> {
  const payload = {
    ...state,
    level: computeNurseLevel(state.xp),
    updatedAt: new Date().toISOString(),
  };
  writeLocalOpenWorldState(uid, payload);

  try {
    const ref = doc(db, 'users', uid, 'gameProgress', 'openWorld');
    await setDoc(ref, payload, { merge: !overwriteReset });
    return true;
  } catch (err) {
    console.warn('Cloud save queued locally (offline or restricted):', err);
    return false;
  }
}
