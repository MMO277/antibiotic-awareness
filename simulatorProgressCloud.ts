import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, configured } from './firebase';
import {
  emptyProgress,
  mergeProgress,
  normalizeProgress,
  sameProgress,
  SimulatorProgress,
} from './simulatorProgressModel';

/**
 * Cloud persistence for 3D educational games in Game Center.
 *
 * Firestore document (one per signed-in user per gameId):
 *   users/{uid}/gameProgress/{gameId}
 *   where gameId is one of:
 *     - 'medicalSimulator' (existing Medical Life Simulator)
 *     - 'nurseAcademy'     (Nurse Academy 3D — 10 Scenarios)
 *     - 'medicalMystery'   (Medical Mystery 3D — 10 Investigation Cases)
 *     - 'bacteriaLab'      (Bacteria Lab 3D)
 *     - 'emergencyShift'   (Emergency Shift 3D)
 *     - 'escapeTheLab'     (Escape the Lab 3D)
 *
 *   Schema:
 *   {
 *     schemaVersion: 1,
 *     gameId:         string,
 *     completedIds:   string[],   // stable level/mission/scenario/case IDs
 *     earnedBadgeIds: string[],
 *     lastPlayedId:   string | null,
 *     updatedAt:      serverTimestamp
 *   }
 *
 * This path is covered by the existing owner-only rule in firestore.rules:
 *   match /users/{uid} { match /{subcollection=**} { allow read, write: if isSignedIn() && request.auth.uid == uid } }
 * so no breaking security-rule change is required.
 */

export const CLOUD_PROGRESS_COLLECTION = 'gameProgress';
export const CLOUD_PROGRESS_DOC_ID = 'medicalSimulator';
export const CLOUD_LOAD_TIMEOUT_MS = 10000;

export function withTimeout<T>(promise: Promise<T>, ms: number = CLOUD_LOAD_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export type CloudGameId =
  | 'medicalSimulator'
  | 'nurseAcademy'
  | 'medicalMystery'
  | 'bacteriaLab'
  | 'emergencyShift'
  | 'escapeTheLab';

export function cloudProgressAvailable(): boolean {
  return Boolean(configured && db);
}

function progressRef(uid: string, gameId: string = CLOUD_PROGRESS_DOC_ID) {
  return doc(db, 'users', uid, CLOUD_PROGRESS_COLLECTION, gameId);
}

/** Reads the signed-in user's progress for a specific game. Returns null when the document does not exist yet. */
export async function readCloudProgress(
  uid: string,
  gameId: string = CLOUD_PROGRESS_DOC_ID
): Promise<SimulatorProgress | null> {
  const snap = await getDoc(progressRef(uid, gameId));
  return snap.exists() ? normalizeProgress(snap.data()) : null;
}

/**
 * Safely writes progress with a transaction: reads the current cloud document, UNION-merges the
 * local progress into it, and writes only if something actually changed. A stale or empty device
 * can therefore never overwrite newer progress. Resolves to the merged result.
 */
export async function writeCloudProgress(
  uid: string,
  local: SimulatorProgress,
  gameId: string = CLOUD_PROGRESS_DOC_ID
): Promise<SimulatorProgress> {
  const ref = progressRef(uid, gameId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const remote = snap.exists() ? normalizeProgress(snap.data()) : null;
    const merged = mergeProgress(remote ?? emptyProgress(), local);
    if (remote && sameProgress(remote, merged)) return merged;
    tx.set(ref, {
      schemaVersion: 1,
      gameId,
      completedIds: merged.completedIds,
      earnedBadgeIds: merged.earnedBadgeIds,
      lastPlayedId: merged.lastPlayedId ?? null,
      updatedAt: serverTimestamp(),
    });
    return merged;
  });
}

// ── Per-account local cache (offline fallback ONLY — never the source of truth) ──────────────
const cacheKey = (uid: string, gameId: string = CLOUD_PROGRESS_DOC_ID) =>
  gameId === CLOUD_PROGRESS_DOC_ID
    ? `aa_medsim_progress_v1:uid:${uid}`
    : `aa_game_progress_v1:${gameId}:uid:${uid}`;

export function readUidCache(
  uid: string,
  gameId: string = CLOUD_PROGRESS_DOC_ID
): SimulatorProgress | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid, gameId));
    return raw ? normalizeProgress(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeUidCache(
  uid: string,
  progress: SimulatorProgress,
  gameId: string = CLOUD_PROGRESS_DOC_ID
): void {
  try {
    localStorage.setItem(cacheKey(uid, gameId), JSON.stringify(progress));
  } catch {
    /* storage unavailable / full: ignore */
  }
}

// ── Guest (unauthenticated) local storage per game ──────────────────────────────────────────
const guestKey = (gameId: string = CLOUD_PROGRESS_DOC_ID) =>
  gameId === CLOUD_PROGRESS_DOC_ID
    ? 'aa_medsim_progress_v1'
    : `aa_game_progress_v1:${gameId}`;

export function readGuestProgress(gameId: string = CLOUD_PROGRESS_DOC_ID): SimulatorProgress {
  try {
    const raw = localStorage.getItem(guestKey(gameId));
    return raw ? normalizeProgress(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function writeGuestProgress(
  progress: SimulatorProgress,
  gameId: string = CLOUD_PROGRESS_DOC_ID
): void {
  try {
    localStorage.setItem(guestKey(gameId), JSON.stringify(progress));
  } catch {
    /* ignore */
  }
}

// ── "Merge progress saved on this device before sign-in" prompt bookkeeping ─────────────────
const mergeDismissKey = (uid: string, gameId: string = CLOUD_PROGRESS_DOC_ID) =>
  gameId === CLOUD_PROGRESS_DOC_ID
    ? `aa_medsim_local_merge_done:${uid}`
    : `aa_game_local_merge_done:${gameId}:${uid}`;

export function isLocalMergeResolved(
  uid: string,
  gameId: string = CLOUD_PROGRESS_DOC_ID
): boolean {
  try {
    return localStorage.getItem(mergeDismissKey(uid, gameId)) === '1';
  } catch {
    return false;
  }
}

export function markLocalMergeResolved(
  uid: string,
  gameId: string = CLOUD_PROGRESS_DOC_ID
): void {
  try {
    localStorage.setItem(mergeDismissKey(uid, gameId), '1');
  } catch {
    /* ignore */
  }
}
