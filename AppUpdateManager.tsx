import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, configured } from './firebase';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { APK_DIRECT_DOWNLOAD_URL } from './InstallPrompt';

export interface AppVersionManifest {
  buildId: string;
  version: string;
  mandatory: boolean;
  requiresNewApk?: boolean;
  titleAr: string;
  titleEn: string;
  notesAr: string[];
  notesEn: string[];
  publishedAt: string;
}

const INSTALLED_BUILD_KEY = 'aa_installed_build_id_v1';
const INSTALLED_VERSION_KEY = 'aa_installed_version_str_v1';
const DISMISSED_BUILD_KEY = 'aa_dismissed_optional_build_id_v1';
const UPDATE_SUCCESS_TOAST_KEY = 'aa_just_updated_version_v1';
export const OPEN_UPDATE_CHECKER_EVENT = 'aa-open-update-checker';

export const DEFAULT_CURRENT_VERSION = '2.5.0';

const DEFAULT_MANIFEST: AppVersionManifest = {
  buildId: 'build-v2.5.0',
  version: '2.5.0',
  mandatory: false,
  requiresNewApk: false,
  titleAr: 'تحديث شامل لمنصة التوعية بالمضادات الحيوية (v2.5.0)',
  titleEn: 'Comprehensive Platform Update (v2.5.0)',
  notesAr: [
    '⚡ تشغيل فوري 100% أوفلاين لجميع الأدوات وقاعدة الأدوية (206 دواء مصري).',
    '🔐 تسجيل دخول سريع بحساب Google بضغطة واحدة بدون الحاجة لكتابة كلمة مرور.',
    '⏰ منبه جرعات ذكي يرن بصوت عالي في مواعيد الأدوية حتى والتطبيق مغلق.',
    '🤖 تطوير المساعد الصيدلي الذكي بـ Gemini 1.5 Flash للرد الفوري بالعامية المصرية.',
  ],
  notesEn: [
    '⚡ Instant 100% offline execution across all clinical tools and 206 Egyptian medicines.',
    '🔐 1-Tap Google Account sign-in without typing passwords.',
    '⏰ Hardware phone alarm clock that rings even when the app is closed.',
    '🤖 Upgraded Gemini 1.5 Flash AI Pharmacist with natural Egyptian Arabic conversation.',
  ],
  publishedAt: '2026-11-05',
};

export function triggerUpdateCheckerManually(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_UPDATE_CHECKER_EVENT));
}

export default function AppUpdateManager() {
  const { lang } = useLang();
  const { role, modalOpen } = useAuth();
  const isAr = lang === 'ar';
  const isAdmin = role === 'owner' || role === 'admin';

  const [remoteManifest, setRemoteManifest] = useState<AppVersionManifest | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStepText, setUpdateStepText] = useState('');
  const [justUpdatedToast, setJustUpdatedToast] = useState<string | null>(null);
  const [showAdminSimControls, setShowAdminSimControls] = useState(false);

  // Check if we just finished an update before reload
  useEffect(() => {
    try {
      const justUp = sessionStorage.getItem(UPDATE_SUCCESS_TOAST_KEY);
      if (justUp) {
        sessionStorage.removeItem(UPDATE_SUCCESS_TOAST_KEY);
        setJustUpdatedToast(justUp);
        const t = window.setTimeout(() => setJustUpdatedToast(null), 5000);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // 1. Fetch ./app-version.json (bypassing cache) to detect new GitHub deployments
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkServerManifest = async () => {
      try {
        const res = await fetch(`./app-version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data: AppVersionManifest = await res.json();
        if (!data || !data.buildId) return;

        const installedBuildId = localStorage.getItem(INSTALLED_BUILD_KEY);
        const dismissedBuildId = sessionStorage.getItem(DISMISSED_BUILD_KEY);

        // First-ever visit on this device: record current buildId as installed baseline
        if (!installedBuildId) {
          localStorage.setItem(INSTALLED_BUILD_KEY, data.buildId);
          localStorage.setItem(INSTALLED_VERSION_KEY, data.version || DEFAULT_CURRENT_VERSION);
          setRemoteManifest(data);
          return;
        }

        // If server buildId differs from installedBuildId -> A NEW UPDATE IS AVAILABLE!
        if (installedBuildId !== data.buildId) {
          setRemoteManifest(data);
          if (data.mandatory || dismissedBuildId !== data.buildId) {
            setUpdateModalOpen(true);
          }
        } else {
          setRemoteManifest(data);
        }
      } catch {
        /* Offline — skip remote check silently */
      }
    };

    const timer = window.setTimeout(checkServerManifest, 2200);
    // Also re-check when device comes back online or app returns to foreground
    const onOnline = () => void checkServerManifest();
    window.addEventListener('online', onOnline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // 2. Also listen to Firestore live update config (system_config/app_update) if configured
  useEffect(() => {
    if (!configured || !db) return;
    try {
      const unsub = onSnapshot(
        doc(db, 'system_config', 'app_update'),
        (snap) => {
          if (!snap.exists()) return;
          const d = snap.data() as Partial<AppVersionManifest>;
          if (!d.buildId) return;
          const merged: AppVersionManifest = {
            ...DEFAULT_MANIFEST,
            ...d,
            notesAr: Array.isArray(d.notesAr) ? d.notesAr : DEFAULT_MANIFEST.notesAr,
            notesEn: Array.isArray(d.notesEn) ? d.notesEn : DEFAULT_MANIFEST.notesEn,
          };
          setRemoteManifest(merged);
          const installedBuildId = localStorage.getItem(INSTALLED_BUILD_KEY);
          const dismissedBuildId = sessionStorage.getItem(DISMISSED_BUILD_KEY);
          if (installedBuildId && installedBuildId !== merged.buildId) {
            if (merged.mandatory || dismissedBuildId !== merged.buildId) {
              setUpdateModalOpen(true);
            }
          }
        },
        () => {
          /* ignore permission or offline errors */
        }
      );
      return () => unsub();
    } catch {
      /* ignore */
    }
  }, []);

  // 3. Listen for manual "Check for Updates" button from Side Drawer
  useEffect(() => {
    const onOpenManual = () => {
      if (!remoteManifest) {
        setRemoteManifest(DEFAULT_MANIFEST);
      }
      setUpdateModalOpen(true);
    };
    window.addEventListener(OPEN_UPDATE_CHECKER_EVENT, onOpenManual);
    return () => window.removeEventListener(OPEN_UPDATE_CHECKER_EVENT, onOpenManual);
  }, [remoteManifest]);

  const activeManifest = remoteManifest || DEFAULT_MANIFEST;
  const installedBuildId =
    typeof window !== 'undefined' ? localStorage.getItem(INSTALLED_BUILD_KEY) : null;
  const hasPendingUpdate =
    Boolean(installedBuildId && activeManifest.buildId && installedBuildId !== activeManifest.buildId);

  const handleDismissOptional = () => {
    if (activeManifest.mandatory) return;
    try {
      sessionStorage.setItem(DISMISSED_BUILD_KEY, activeManifest.buildId);
    } catch {
      /* ignore */
    }
    setUpdateModalOpen(false);
  };

  const handlePerformInAppUpdate = async () => {
    setIsUpdating(true);
    setUpdateProgress(12);
    setUpdateStepText(
      isAr ? 'جاري الاتصال بخادم التحديثات وفحص الحزمة...' : 'Connecting to update server...'
    );

    await new Promise((r) => setTimeout(r, 450));
    setUpdateProgress(38);
    setUpdateStepText(
      isAr
        ? 'جاري تحميل الملفات الطبية المحدثة وقاعدة الأدوية...'
        : 'Downloading updated clinical modules & drug database...'
    );

    // Clear old Service Worker caches and warm up new assets
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.update().catch(() => {});
        }
      }
    } catch {
      /* ignore */
    }

    await new Promise((r) => setTimeout(r, 550));
    setUpdateProgress(76);
    setUpdateStepText(
      isAr
        ? 'جاري تثبيت التحديث وتجهيز نسخة الأوفلاين السريعة...'
        : 'Installing update & warming offline cache...'
    );

    try {
      const manifestRes = await fetch(`./precache-manifest.json?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (manifestRes.ok) {
        const m = await manifestRes.json();
        const core: string[] = Array.isArray(m.coreAssets) ? m.coreAssets : [];
        const cache = await caches.open('aa-speed-cache-static-v3');
        await Promise.allSettled(
          core.slice(0, 18).map((u) => fetch(u, { cache: 'reload' }).then((res) => cache.put(u, res)))
        );
      }
    } catch {
      /* ignore */
    }

    await new Promise((r) => setTimeout(r, 450));
    setUpdateProgress(100);
    setUpdateStepText(
      isAr ? '✅ اكتمل التحديث بنجاح! جاري إعادة تشغيل التطبيق...' : '✅ Update complete! Restarting app...'
    );

    try {
      localStorage.setItem(INSTALLED_BUILD_KEY, activeManifest.buildId);
      localStorage.setItem(INSTALLED_VERSION_KEY, activeManifest.version);
      sessionStorage.setItem(UPDATE_SUCCESS_TOAST_KEY, activeManifest.version);
    } catch {
      /* ignore */
    }

    // If the update explicitly requires downloading a new native APK binary, trigger APK download too
    if (activeManifest.requiresNewApk) {
      window.open(APK_DIRECT_DOWNLOAD_URL, '_blank');
    }

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const simulateUpdateMode = (mandatory: boolean) => {
    const simulated: AppVersionManifest = {
      ...activeManifest,
      buildId: 'sim-build-' + Date.now(),
      version: '2.6.0',
      mandatory,
      titleAr: mandatory
        ? '⚠️ تحديث هام وإجباري لمنصة المضادات الحيوية (v2.6.0)'
        : '🚀 تحديث جديد متاح للتطبيق (v2.6.0)',
      titleEn: mandatory
        ? '⚠️ Critical Mandatory App Update (v2.6.0)'
        : '🚀 New App Update Available (v2.6.0)',
    };
    setRemoteManifest(simulated);
    try {
      localStorage.setItem(INSTALLED_BUILD_KEY, 'old-build-v2.4.0');
    } catch {
      /* ignore */
    }
    setUpdateModalOpen(true);
  };

  const broadcastCloudUpdate = async (mandatory: boolean) => {
    if (!db || !configured) return;
    const nextManifest: AppVersionManifest = {
      ...DEFAULT_MANIFEST,
      buildId: 'cloud-build-' + Date.now(),
      version: '2.6.0',
      mandatory,
      publishedAt: new Date().toISOString().slice(0, 10),
    };
    try {
      await setDoc(doc(db, 'system_config', 'app_update'), {
        ...nextManifest,
        updatedAt: serverTimestamp(),
      });
      setRemoteManifest(nextManifest);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {/* Celebratory Toast after an In-App Update completes */}
      {justUpdatedToast && (
        <div
          role="status"
          dir={isAr ? 'rtl' : 'ltr'}
          style={{
            position: 'fixed',
            top: '18px',
            insetInline: '16px',
            maxWidth: '460px',
            marginInline: 'auto',
            zIndex: 10090,
            background: 'linear-gradient(90deg, #059669 0%, #0d9488 100%)',
            color: '#fff',
            borderRadius: '16px',
            padding: '14px 18px',
            boxShadow: '0 16px 40px rgba(5, 150, 105, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontWeight: 800,
            fontSize: '0.9rem',
          }}
        >
          <span>
            🎉{' '}
            {isAr
              ? `تم تحديث التطبيق بنجاح إلى الإصدار v${justUpdatedToast} بكامل المميزات الجديدة!`
              : `App successfully updated to v${justUpdatedToast}!`}
          </span>
          <button
            type="button"
            onClick={() => setJustUpdatedToast(null)}
            style={{
              background: 'transparent',
              color: '#fff',
              border: 'none',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* In-App Update Modal (Supports Optional & Mandatory Modes) */}
      {updateModalOpen && !modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isAr ? 'تحديث التطبيق' : 'App Update'}
          dir={isAr ? 'rtl' : 'ltr'}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10080,
            background: 'rgba(6, 15, 28, 0.86)',
            backdropFilter: 'blur(9px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (!activeManifest.mandatory && !isUpdating && e.target === e.currentTarget) {
              handleDismissOptional();
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
              color: '#f8fafc',
              borderRadius: '24px',
              border: activeManifest.mandatory
                ? '2px solid #f59e0b'
                : '2px solid #14b8a6',
              boxShadow: activeManifest.mandatory
                ? '0 24px 60px rgba(0,0,0,0.7), 0 0 35px rgba(245, 158, 11, 0.3)'
                : '0 24px 60px rgba(0,0,0,0.7), 0 0 35px rgba(20, 184, 166, 0.3)',
              padding: '22px 20px',
              position: 'relative',
            }}
          >
            {/* Top Status Badge + Close button (hidden if mandatory!) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <span
                style={{
                  background: activeManifest.mandatory
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(20, 184, 166, 0.2)',
                  color: activeManifest.mandatory ? '#fbbf24' : '#5eead4',
                  border: activeManifest.mandatory
                    ? '1px solid rgba(245, 158, 11, 0.5)'
                    : '1px solid rgba(20, 184, 166, 0.5)',
                  borderRadius: '99px',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                }}
              >
                {activeManifest.mandatory
                  ? isAr
                    ? '⚠️ تحديث إجباري هام'
                    : '⚠️ Critical Mandatory Update'
                  : hasPendingUpdate
                  ? isAr
                    ? '🚀 تحديث جديد متاح'
                    : '🚀 New Update Available'
                  : isAr
                  ? `✓ أحدث إصدار (v${activeManifest.version})`
                  : `✓ Latest Version (v${activeManifest.version})`}
              </span>

              {!activeManifest.mandatory && !isUpdating && (
                <button
                  type="button"
                  onClick={handleDismissOptional}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.16)',
                    borderRadius: '99px',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isAr ? 'لاحقاً ✕' : 'Later ✕'}
                </button>
              )}
            </div>

            {/* Header Icon & Title */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  margin: '0 auto 10px',
                  background: activeManifest.mandatory
                    ? 'rgba(245, 158, 11, 0.18)'
                    : 'rgba(20, 184, 166, 0.18)',
                  border: activeManifest.mandatory
                    ? '2px solid #f59e0b'
                    : '2px solid #14b8a6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.1rem',
                }}
              >
                {activeManifest.mandatory ? '🛡️' : '🔄'}
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.22rem', fontWeight: 900, color: '#fff' }}>
                {isAr ? activeManifest.titleAr : activeManifest.titleEn}
              </h2>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {activeManifest.mandatory
                  ? isAr
                    ? 'هذا التحديث ضروري لضمان دقة الجرعات الدوائية وأمان استخدام التطبيق. يُرجى التحديث الآن للمتابعة.'
                    : 'This update is required for medication safety and core functionality. Please update now to continue.'
                  : isAr
                  ? 'نزل تحديث جديد للتطبيق! تقدر تحدثه دلوقتي من جوه التطبيق في ثواني من غير ما تفقد أي بيانات.'
                  : 'A new update is ready! Install it right inside the app in seconds without losing any data.'}
              </p>
            </div>

            {/* Release Notes List */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#38bdf8',
                  marginBottom: '8px',
                }}
              >
                ✨ {isAr ? 'إيه الجديد في التحديث ده؟' : "What's new in this update:"}
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingInlineStart: '18px',
                  fontSize: '0.84rem',
                  color: '#e2e8f0',
                  lineHeight: 1.65,
                }}
              >
                {(isAr ? activeManifest.notesAr : activeManifest.notesEn).map((note, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* Live Progress Bar while Updating */}
            {isUpdating ? (
              <div style={{ marginBottom: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#5eead4',
                    marginBottom: '6px',
                  }}
                >
                  <span>{updateStepText}</span>
                  <span>{updateProgress}%</span>
                </div>
                <div
                  style={{
                    height: '12px',
                    background: '#0f172a',
                    borderRadius: '99px',
                    overflow: 'hidden',
                    border: '1px solid #334155',
                  }}
                >
                  <div
                    style={{
                      width: `${updateProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #14b8a6 0%, #0284c7 100%)',
                      transition: 'width 0.35s ease',
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Action Buttons */
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {!activeManifest.mandatory && (
                  <button
                    type="button"
                    onClick={handleDismissOptional}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '14px',
                      padding: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? 'لاحقاً' : 'Later'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePerformInAppUpdate}
                  style={{
                    flex: 2,
                    background: activeManifest.mandatory
                      ? 'linear-gradient(90deg, #f59e0b 0%, #ea580c 100%)'
                      : 'linear-gradient(90deg, #14b8a6 0%, #0284c7 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 8px 22px rgba(20, 184, 166, 0.35)',
                  }}
                >
                  {isAr ? '🚀 تحديث التطبيق الآن' : '🚀 Update App Now'}
                </button>
              </div>
            )}

            {/* Demo / Presentation Mode Switcher (lets student/admin demonstrate Optional vs Mandatory Update!) */}
            {!isUpdating && (
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                  textAlign: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAdminSimControls((s) => !s)}
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                    border: 'none',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  ⚙️{' '}
                  {isAr
                    ? 'خيارات معاينة نوع التحديث (اختياري / إجباري)'
                    : 'Preview Update Mode (Optional / Mandatory)'}
                </button>

                {showAdminSimControls && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      marginTop: '8px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => simulateUpdateMode(false)}
                      style={{
                        background: 'rgba(20, 184, 166, 0.16)',
                        color: '#5eead4',
                        border: '1px solid rgba(20, 184, 166, 0.4)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      🔔 {isAr ? 'معاينة كتحديث اختياري' : 'Preview Optional'}
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateUpdateMode(true)}
                      style={{
                        background: 'rgba(245, 158, 11, 0.16)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      ⚠️ {isAr ? 'معاينة كتحديث إجباري' : 'Preview Mandatory'}
                    </button>
                    {isAdmin && configured && (
                      <button
                        type="button"
                        onClick={() => broadcastCloudUpdate(true)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.18)',
                          color: '#fca5a5',
                          border: '1px solid rgba(239, 68, 68, 0.45)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        📡 {isAr ? 'إرسال تحديث إجباري لكل المستخدمين' : 'Push Mandatory to All Users'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
