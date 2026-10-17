import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Gaming Mode for Bacteria Hunter.
 *
 * - `enter()` must be called from a user gesture (tap/click) so the browser may grant native fullscreen.
 * - Native fullscreen is best-effort. If it is unsupported or rejected, the CSS "immersive" layout
 *   (`.bh-immersive`, applied by the caller via `active`) still fills the viewport.
 * - While active, `html` gets the `bh-gaming` class (hides the floating assistant/SOS widget and locks
 *   page scroll). The class and the `bh:gaming-mode` event are always cleaned up on exit/unmount.
 */

export const GAMING_CLASS = 'bh-gaming';
export const GAMING_EVENT = 'bh:gaming-mode';

type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

function fsElement(): Element | null {
  const d = document as FsDoc;
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function broadcast(active: boolean) {
  window.dispatchEvent(new CustomEvent(GAMING_EVENT, { detail: { active } }));
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
      /* exiting can fail (e.g. already left); the CSS state is cleaned up regardless */
    }
  }, []);

  const exit = useCallback(() => {
    activeRef.current = false;
    weEnteredNative.current = false;
    setActive(false);
    setNativeFullscreen(false);
    applyDom(false);
    void exitNative();
  }, [applyDom, exitNative]);

  const enter = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setActive(true);
    applyDom(true);
    const el = targetRef.current as FsEl | null;
    if (!el) return;
    try {
      const req = el.requestFullscreen
        ? el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions)
        : el.webkitRequestFullscreen
          ? el.webkitRequestFullscreen()
          : undefined;
      if (req && typeof (req as Promise<void>).then === 'function') {
        (req as Promise<void>)
          .then(() => { weEnteredNative.current = !!fsElement(); })
          .catch(() => { weEnteredNative.current = false; /* CSS immersive fallback stays in effect */ });
      } else if (req === undefined && !el.webkitRequestFullscreen) {
        weEnteredNative.current = false; // unsupported (e.g. iOS Safari): CSS fallback only
      }
    } catch {
      weEnteredNative.current = false;
    }
  }, [applyDom, targetRef]);

  // Keep UI state in sync with the real browser fullscreen state (Esc key, system gesture, etc.)
  useEffect(() => {
    const onChange = () => {
      const isFs = !!fsElement();
      setNativeFullscreen(isFs);
      if (isFs) {
        weEnteredNative.current = true;
      } else if (weEnteredNative.current && activeRef.current) {
        // Native fullscreen ended without the Exit button: pause the run but stay in the immersive layout
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

  // Always restore the website if the component unmounts (navigation, route change)
  useEffect(() => () => {
    if (activeRef.current) {
      activeRef.current = false;
      applyDom(false);
      void exitNative();
    }
  }, [applyDom, exitNative]);

  return { active, nativeFullscreen, enter, exit };
}
