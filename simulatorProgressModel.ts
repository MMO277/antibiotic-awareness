/**
 * Pure (storage-free, Firebase-free) model for Medical Life Simulator progress.
 *
 * Everything here is deterministic so it can be unit-tested without a browser.
 * Progress is always keyed by STABLE level IDs (e.g. 'level-1-er-first-response'),
 * never by array position or translated names.
 *
 * Merge rule (the heart of safe multi-device sync): completed / badge ID sets only ever GROW.
 * An older or empty device can therefore never erase progress that another device saved.
 */

export interface SimulatorProgress {
  version: 1;
  completedIds: string[];
  earnedBadgeIds: string[];
  lastPlayedId?: string;
}

/** Sanity limits so a corrupted/hostile document can never bloat memory or Firestore. */
export const MAX_PROGRESS_IDS = 300;
export const MAX_ID_LENGTH = 80;

export function emptyProgress(): SimulatorProgress {
  return { version: 1, completedIds: [], earnedBadgeIds: [] };
}

function cleanIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const id = item.trim();
    if (!id || id.length > MAX_ID_LENGTH || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_PROGRESS_IDS) break;
  }
  return out;
}

/** Appends IDs from `extra` that `base` lacks; returns the SAME array reference when nothing is new (avoids re-render loops). */
export function unionIds(base: string[], extra: string[]): string[] {
  const have = new Set(base);
  const add = extra.filter((x) => !have.has(x));
  return add.length ? [...base, ...add] : base;
}

/** Turns any unknown value (Firestore data, localStorage JSON) into a valid progress object. */
export function normalizeProgress(raw: unknown): SimulatorProgress {
  if (!raw || typeof raw !== 'object') return emptyProgress();
  const r = raw as Record<string, unknown>;
  const last =
    typeof r.lastPlayedId === 'string' && r.lastPlayedId.trim() && r.lastPlayedId.length <= MAX_ID_LENGTH
      ? r.lastPlayedId.trim()
      : undefined;
  const out: SimulatorProgress = {
    version: 1,
    completedIds: cleanIds(r.completedIds),
    earnedBadgeIds: cleanIds(r.earnedBadgeIds),
  };
  if (last) out.lastPlayedId = last;
  return out;
}

function union(a: string[], b: string[]): string[] {
  return cleanIds([...a, ...b]);
}

/**
 * Union-merge two progress objects. IDs are never removed.
 * `lastPlayedId` comes from `incoming` when it has one (the device the person is playing on),
 * otherwise from `base`.
 */
export function mergeProgress(base: SimulatorProgress, incoming: SimulatorProgress): SimulatorProgress {
  const out: SimulatorProgress = {
    version: 1,
    completedIds: union(base.completedIds, incoming.completedIds),
    earnedBadgeIds: union(base.earnedBadgeIds, incoming.earnedBadgeIds),
  };
  const last = incoming.lastPlayedId ?? base.lastPlayedId;
  if (last) out.lastPlayedId = last;
  return out;
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

/** True when both ID sets (completed + badges) are identical, ignoring order and lastPlayedId. */
export function sameSets(a: SimulatorProgress, b: SimulatorProgress): boolean {
  return sameSet(a.completedIds, b.completedIds) && sameSet(a.earnedBadgeIds, b.earnedBadgeIds);
}

/** True when sets AND lastPlayedId are identical (i.e. nothing worth writing). */
export function sameProgress(a: SimulatorProgress, b: SimulatorProgress): boolean {
  return sameSets(a, b) && (a.lastPlayedId ?? null) === (b.lastPlayedId ?? null);
}

/** True when `candidate` contains at least one completed/badge ID that `reference` lacks. */
export function hasExtraIds(candidate: SimulatorProgress, reference: SimulatorProgress): boolean {
  const c = new Set(reference.completedIds);
  const b = new Set(reference.earnedBadgeIds);
  return (
    candidate.completedIds.some((id) => !c.has(id)) ||
    candidate.earnedBadgeIds.some((id) => !b.has(id))
  );
}

/** True when there is no real progress (no completed levels and no badges). */
export function isBlankProgress(p: SimulatorProgress): boolean {
  return p.completedIds.length === 0 && p.earnedBadgeIds.length === 0;
}
