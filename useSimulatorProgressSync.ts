import { useCallback, useEffect, useRef, useState } from 'react';
import { saveSimulatorProgress } from './medicalSimulatorLevels';
import {
  hasExtraIds,
  isBlankProgress,
  sameProgress,
  sameSets,
  SimulatorProgress,
} from './simulatorProgressModel';
import {
  CLOUD_PROGRESS_DOC_ID,
  writeCloudProgress,
  writeGuestProgress,
  writeUidCache,
} from './simulatorProgressCloud';

export type ProgressSyncState = 'local' | 'saved' | 'saving' | 'error';

interface Options {
  /** Stable game identifier (defaults to 'medicalSimulator' for backward compatibility). */
  gameId?: string;
  /** Firebase UID of the signed-in user, or null for guest / unconfigured Firebase (local only). */
  uid: string | null;
  /** Last progress known to be in the cloud (null = no document yet / guest). */
  remote: SimulatorProgress | null;
  /** Called when a save discovered extra progress from another device (merged result). */
  onMerged: (merged: SimulatorProgress) => void;
}

const DEBOUNCE_MS = 1500;

/**
 * Saves simulator / 3D game progress.
 *  - Guest: game-specific local key only (unchanged legacy key for medicalSimulator).
 *  - Signed in: per-account local cache immediately + debounced, transaction-based Firestore write.
 *    Changes to completed/badge sets are written right away; `lastPlayedId`-only changes are debounced
 *    to avoid excessive writes. Failed writes keep progress cached and are retried on reconnect / next change.
 */
export function useSimulatorProgressSync({
  gameId = CLOUD_PROGRESS_DOC_ID,
  uid,
  remote,
  onMerged,
}: Options) {
  const [state, setState] = useState<ProgressSyncState>(uid ? 'saved' : 'local');
  const lastSynced = useRef<SimulatorProgress | null>(remote);
  const latest = useRef<SimulatorProgress | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const running = useRef(false);
  const rerun = useRef(false);
  const onMergedRef = useRef(onMerged);
  onMergedRef.current = onMerged;

  const needsWrite = (p: SimulatorProgress): boolean => {
    const prev = lastSynced.current;
    if (prev) return !sameProgress(prev, p);
    return !isBlankProgress(p); // never create an empty cloud document just from opening the game
  };

  const doFlush = useCallback(async () => {
    if (!uid || !latest.current) return;
    if (running.current) {
      rerun.current = true;
      return;
    }
    running.current = true;
    try {
      do {
        rerun.current = false;
        const snapshot = latest.current;
        if (!snapshot || !needsWrite(snapshot)) break;
        setState('saving');
        const merged = await writeCloudProgress(uid, snapshot, gameId);
        lastSynced.current = merged;
        if (hasExtraIds(merged, snapshot)) onMergedRef.current(merged);
      } while (rerun.current);
      setState('saved');
    } catch {
      setState('error'); // progress stays in the per-account cache and is retried later
    } finally {
      running.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, gameId]);

  const flushNow = useCallback(() => {
    window.clearTimeout(timer.current);
    void doFlush();
  }, [doFlush]);

  const queue = useCallback(
    (p: SimulatorProgress) => {
      latest.current = p;
      if (!uid) {
        if (gameId === CLOUD_PROGRESS_DOC_ID) {
          saveSimulatorProgress(p); // guest: existing local-only behaviour
        } else {
          writeGuestProgress(p, gameId);
        }
        return;
      }
      writeUidCache(uid, p, gameId);
      if (!needsWrite(p)) return;
      const prev = lastSynced.current;
      const setsChanged = !prev || !sameSets(prev, p);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void doFlush(), setsChanged ? 0 : DEBOUNCE_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, gameId, doFlush]
  );

  useEffect(() => {
    if (!uid) return;
    const onOnline = () => flushNow();
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushNow();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushNow);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushNow);
      flushNow(); // leaving the game: push anything still pending
    };
  }, [uid, flushNow]);

  return { state, queue, flush: flushNow };
}
