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
 * Cloud persistence for Medical Life Simulator progress.
 *
 * Firestore document (one per signed-in user):
 *   users/{uid}/gameProgress/medicalSimulator
 *   {
 *     schemaVersion: 1,
 *     completedIds:   string[],   // stable level/scenario IDs
 *     earnedBadgeIds: string[],
 *     lastPlayedId:   string | null,
 *     updatedAt:      serverTimestamp
 *   }
 *
 * This path is already covered by the existing owner-only rule
 *   match /users/{uid} { match /{subcollection=**} { allow read, write: if request.auth.uid == uid } }
 * so no security-rule change is required.
 */

export const CLOUD_PROGRESS_COLLECTION = 'gameProgress';
export const CLOUD_PROGRESS_DOC_ID = 'medicalSimulator';

export function cloudProgressAvailable(): boolean {
  return Boolean(configured && db);
}

function progressRef(uid: string) {
  return doc(db, 'users', uid, CLOUD_PROGRESS_COLLECTION, CLOUD_PROGRESS_DOC_ID);
}

/** Reads the signed-in user's progress. Returns null when the document does not exist yet. */
export async function readCloudProgress(uid: string): Promise<SimulatorProgress | null> {
  const snap = await getDoc(progressRef(uid));
  return snap.exists() ? normalizeProgress(snap.data()) : null;
}

/**
 * Safely writes progress with a transaction: reads the current cloud document, UNION-merges the
 * local progress into it, and writes only if something actually changed. A stale or empty device
 * can therefore never overwrite newer progress. Resolves to the merged result.
 */
export async function writeCloudProgress(uid: string, local: SimulatorProgress): Promise<SimulatorProgress> {
  const ref = progressRef(uid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const remote = snap.exists() ? normalizeProgress(snap.data()) : null;
    const merged = mergeProgress(remote ?? emptyProgress(), local);
    if (remote && sameProgress(remote, merged)) return merged;
    tx.set(ref, {
      schemaVersion: 1,
      completedIds: merged.completedIds,
      earnedBadgeIds: merged.earnedBadgeIds,
      lastPlayedId: merged.lastPlayedId ?? null,
      updatedAt: serverTimestamp(),
    });
    return merged;
  });
}

// ── Per-account local cache (offline fallback ONLY — never the source of truth) ──────────────
const cacheKey = (uid: string) => `aa_medsim_progress_v1:uid:${uid}`;

export function readUidCache(uid: string): SimulatorProgress | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    return raw ? normalizeProgress(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeUidCache(uid: string, progress: SimulatorProgress): void {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(progress));
  } catch {
    /* storage unavailable / full: ignore */
  }
}

// ── "Merge progress saved on this device before sign-in" prompt bookkeeping ─────────────────
const mergeDismissKey = (uid: string) => `aa_medsim_local_merge_done:${uid}`;

export function isLocalMergeResolved(uid: string): boolean {
  try {
    return localStorage.getItem(mergeDismissKey(uid)) === '1';
  } catch {
    return false;
  }
}

export function markLocalMergeResolved(uid: string): void {
  try {
    localStorage.setItem(mergeDismissKey(uid), '1');
  } catch {
    /* ignore */
  }
}
