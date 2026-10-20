import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Gaming Mode & Automatic Landscape Orientation Controller for 3D Simulations & Bacteria Hunter.
 *
 * - `enter()` activates the immersive viewport layout immediately and, when called from a user gesture
 *   (or when `opts.native !== false`), requests browser fullscreen first and then attempts
 *   `screen.orientation.lock('landscape')`.
 * - If native fullscreen or native orientation lock is rejected or unsupported (e.g. iOS Safari or
 *   restricted mobile WebViews), the CSS auto-landscape viewport fallback rotates the game interface
 *   cleanly without blocking gameplay behind a "rotate your phone" dead-end screen.
 * - While active, `html` gets the `bh-gaming` class (hides the floating assistant/SOS widget and locks
 *   page scroll). Both fullscreen, orientation lock, and DOM classes are restored on exit/unmount.
 */

export const GAMING_CLASS = 'bh-gaming';
export const GAMING_EVENT = 'bh:gaming-mode';

type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

function fsElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const d = document as FsDoc;
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function broadcast(active: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(GAMING_EVENT, { detail: { active } }));
}

/**
 * Request landscape orientation lock when supported.
 * Some browsers require fullscreen before locking orientation; callers should request fullscreen first
 * and then invoke `lockLandscape()`.
 */
export async function lockLandscape(): Promise<boolean> {
  if (typeof screen === 'undefined') return false;
  try {
    const orientation = (
      screen as Screen & {
        orientation?: ScreenOrientation & { lock?: (mode: string) => Promise<void> };
      }
    ).orientation;
    if (orientation?.lock) {
      await orientation.lock('landscape');
      return true;
    }
  } catch {
    // Orientation lock is permission- and browser-dependent; CSS landscape fallback remains active.
  }
  return false;
}

export function unlockOrientation(): void {
  if (typeof screen === 'undefined') return;
  try {
    const orientation = (
      screen as Screen & {
        orientation?: ScreenOrientation & { unlock?: () => void };
      }
    ).orientation;
    orientation?.unlock?.();
  } catch {
    /* best-effort cleanup */
  }
}

/**
 * Detects whether the CSS portrait-to-landscape 90-degree clockwise rotation fallback is currently
 * active on a coarse-pointer mobile viewport (`@media (orientation: portrait) and (max-width: 900px) and (pointer: coarse)`).
 * When true, pointer/touch deltas (clientX, clientY) should be transformed into the rotated container's local axes.
 */
export function isCssPortraitRotatedFallback(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(orientation: portrait) and (max-width: 900px) and (pointer: coarse)').matches;
}

/**
 * Maps screen-space delta `(rawDx, rawDy)` into the game container's local coordinate axes,
 * accounting for the 90-degree clockwise CSS rotation fallback when the physical device is in portrait.
 */
export function mapScreenDeltaToLandscape(rawDx: number, rawDy: number): { dx: number; dy: number } {
  if (isCssPortraitRotatedFallback()) {
    return { dx: rawDy, dy: -rawDx };
  }
  return { dx: rawDx, dy: rawDy };
}

export function useGamingMode(
  targetRef: React.RefObject<HTMLElement | null>,
  onNativeFullscreenLost: () => void,
) {
  const [active, setActive] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const activeRef = useRef(false);
  const weEnteredNative = useRef(false);
  const lostCb = useRef(onNativeFullscreenLost);
  lostCb.current = onNativeFullscreenLost;

  const applyDom = useCallback((on: boolean) => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle(GAMING_CLASS, on);
    broadcast(on);
  }, []);

  const exitNative = useCallback(async () => {
    if (!fsElement()) return;
    try {
      const d = document as FsDoc;
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
    } catch {
      /* exiting can fail (e.g. already left); CSS state is cleaned up regardless */
    }
  }, []);

  const requestNativeAndLandscape = useCallback(async (el: FsEl | null): Promise<boolean> => {
    if (!el) {
      await lockLandscape();
      return false;
    }
    try {
      if (fsElement()) {
        weEnteredNative.current = true;
        setNativeFullscreen(true);
        await lockLandscape();
        return true;
      }
      const req = el.requestFullscreen
        ? el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions)
        : el.webkitRequestFullscreen
          ? el.webkitRequestFullscreen()
          : undefined;
      if (req && typeof (req as Promise<void>).then === 'function') {
        await (req as Promise<void>);
        const isFs = !!fsElement();
        weEnteredNative.current = isFs;
        setNativeFullscreen(isFs);
        await lockLandscape();
        return isFs;
      }
    } catch {
      weEnteredNative.current = false;
    }
    // Even if fullscreen was blocked or unsupported, attempt orientation lock best-effort
    await lockLandscape();
    return false;
  }, []);

  const exit = useCallback(() => {
    activeRef.current = false;
    weEnteredNative.current = false;
    setActive(false);
    setNativeFullscreen(false);
    applyDom(false);
    unlockOrientation();
    void exitNative();
  }, [applyDom, exitNative]);

  const enter = useCallback(
    (opts?: { native?: boolean }) => {
      if (!activeRef.current) {
        activeRef.current = true;
        setActive(true);
        applyDom(true);
      }
      if (opts && opts.native === false) {
        // Attempt non-throwing orientation lock if browser allows it without fullscreen
        void lockLandscape();
        return;
      }
      const el = targetRef.current as FsEl | null;
      void requestNativeAndLandscape(el);
    },
    [applyDom, requestNativeAndLandscape, targetRef],
  );

  /** True when the browser exposes a usable Fullscreen API (false on e.g. iPhone Safari). */
  const nativeSupported =
    typeof document !== 'undefined' &&
    Boolean(
      document.fullscreenEnabled ||
        (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled,
    );

  /**
   * Toggle native browser fullscreen + landscape orientation lock from a user gesture.
   */
  const toggleNative = useCallback(() => {
    if (fsElement()) {
      weEnteredNative.current = false;
      unlockOrientation();
      void exitNative();
      return;
    }
    const el = targetRef.current as FsEl | null;
    void requestNativeAndLandscape(el);
  }, [exitNative, requestNativeAndLandscape, targetRef]);

  // Keep UI state in sync with real browser fullscreen state (Esc key, system gesture, etc.)
  useEffect(() => {
    const onChange = () => {
      const isFs = !!fsElement();
      setNativeFullscreen(isFs);
      if (isFs) {
        weEnteredNative.current = true;
        void lockLandscape();
      } else if (weEnteredNative.current && activeRef.current) {
        unlockOrientation();
        weEnteredNative.current = false;
        lostCb.current();
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // Always restore the website layout when the component unmounts (navigation, route change)
  useEffect(
    () => () => {
      if (activeRef.current) {
        activeRef.current = false;
        applyDom(false);
        unlockOrientation();
        void exitNative();
      }
    },
    [applyDom, exitNative],
  );

  return { active, nativeFullscreen, nativeSupported, enter, exit, toggleNative };
}
