import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';

export const ONBOARDING_COMPLETED_KEY = 'aa_onboarding_tour_completed_v1';
export const OPEN_ONBOARDING_EVENT = 'aa-open-onboarding-tour';

export function triggerOnboardingTourManually(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_ONBOARDING_EVENT));
}

interface TourStep {
  icon: string;
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  highlightTipAr: string;
  highlightTipEn: string;
  targetPath: string;
  targetLabelAr: string;
  targetLabelEn: string;
  accentColor: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: '⚡',
    badgeAr: 'مرحباً بك في منصتك الطبية الذكية',
    badgeEn: 'Welcome to Your Smart Medical Platform',
    titleAr: 'الفحص الشامل للروشتة ورادار الأدوية',
    titleEn: 'One-Click Prescription Checkup & Drug Radar',
    descAr:
      'صوّر روشتتك بالكاميرا أو اكتب اسم المضاد الحيوي، والتطبيق هيفحص فوراً لو فيه أي تعارض خطر مع أدويتك أو حساسيتك.',
    descEn:
      'Snap a photo of your prescription or type the antibiotic name to instantly check for dangerous interactions or allergies.',
    highlightTipAr: '💡 يعرض لك كمان البديل المصري المرخص الأرخص بنفس المادة الفعالة والتركيز بالظبط (توفير حتى 60%).',
    highlightTipEn: '💡 Also shows identical EDA-licensed generic alternatives to save up to 60%.',
    targetPath: '/complete-checkup',
    targetLabelAr: 'جرّب الفحص الشامل',
    targetLabelEn: 'Try One-Click Checkup',
    accentColor: '#14b8a6',
  },
  {
    icon: '⏰',
    badgeAr: 'وداعاً لنسيان مواعيد الدواء',
    badgeEn: 'Never Miss a Dose Again',
    titleAr: 'منبه الموبايل الذكي ومتابعة الكورس (7 أيام)',
    titleEn: 'Hardware Phone Alarm & 7-Day Course Tracker',
    descAr:
      'اضبط مواعيد جرعاتك والموبايل هيرن بصوت منبه عالي في ميعاد الجرعة حتى لو التطبيق مقفول أو الشاشة مطفية.',
    descEn:
      'Set your dose times and your phone will ring loudly like a real alarm clock even when the app is closed.',
    highlightTipAr: '💡 تقدر تأجل المنبه 10 دقائق أو تضغط «تم أخذ الجرعة» ليتحدث شريط التزامك بالكورس تلقائياً.',
    highlightTipEn: '💡 Snooze or tap "Dose Taken" directly from the full-screen alarm.',
    targetPath: '/tracker',
    targetLabelAr: 'افتح منبه الجرعات',
    targetLabelEn: 'Open Dose Alarm',
    accentColor: '#0ea5e9',
  },
  {
    icon: '🤖',
    badgeAr: 'دكتور صيدلي ذكي معاك 24 ساعة',
    badgeEn: '24/7 AI Clinical Pharmacist',
    titleAr: 'المساعد الطبي الذكي (بالعامية المصرية)',
    titleEn: 'Smart Conversational AI Health Assistant',
    descAr:
      'اسأله بطبيعتك عن أي مضاد حيوي، مرهم، قطرة، أعراض جانبية، أو ابعتله صورة تحليلك أو روشتتك وهيشرحهالك فوراً.',
    descEn:
      'Ask naturally about any antibiotic, ointment, eye drops, side effects, or upload lab results for instant guidance.',
    highlightTipAr: '💡 تقدر تقوله «سجل إن عندي حساسية بنسلين» أو «اضبطلي منبه أوجمنتين» وهينفذ طلبك فوراً!',
    highlightTipEn: '💡 Ask it to log allergies or set medication alarms and it executes them for you!',
    targetPath: '/assistant',
    targetLabelAr: 'كلم المساعد الذكي',
    targetLabelEn: 'Chat with AI Assistant',
    accentColor: '#8b5cf6',
  },
  {
    icon: '👶',
    badgeAr: 'أمان كامل للأطفال والمرضى',
    badgeEn: 'Pediatric & Allergy Safety',
    titleAr: 'حاسبة جرعات الأطفال وفحص الحساسية',
    titleEn: 'Pediatric Syrup Calculator & Allergy Checker',
    descAr:
      'احسب جرعة الشراب المظبوطة لطفلك بالسنتي (مل) حسب وزنه الدقيق، وتأكد من عدم وجود حساسية متقاطعة مع البنسلين.',
    descEn:
      'Calculate exact pediatric suspension doses in mL by weight and verify penicillin cross-reactivity safety.',
    highlightTipAr: '💡 ينبهك فوراً لو الدواء ممنوع في الحمل أو يحتاج تعديل لمرضى الكلى.',
    highlightTipEn: '💡 Automatically flags pregnancy contraindications and renal dose adjustments.',
    targetPath: '/pediatric-helper',
    targetLabelAr: 'حاسبة جرعات الأطفال',
    targetLabelEn: 'Pediatric Calculator',
    accentColor: '#f59e0b',
  },
  {
    icon: '⚡',
    badgeAr: 'جاهز في الطوارئ وبدون إنترنت',
    badgeEn: 'Works 100% Offline Anywhere',
    titleAr: 'شغال أوفلاين بسرعة البرق + محاكيات 3D',
    titleEn: 'Instant Offline Mode & 3D Medical Simulators',
    descAr:
      'جميع الأدوات وقاعدة الـ 206 دواء المصري والمنبهات بتشتغل معاك بكامل سرعتها حتى لو مفيش إنترنت خالص على موبايلك.',
    descEn:
      'All 206 Egyptian medicines, clinical calculators, and alarms work at full speed even with zero internet connection.',
    highlightTipAr: '💡 تقدر في أي وقت تعيد فتح الجولة دي من القائمة الجانبية (☰).',
    highlightTipEn: '💡 You can replay this quick tour anytime from the side menu (☰).',
    targetPath: '/medicines',
    targetLabelAr: 'تصفح دليل الأدوية (206)',
    targetLabelEn: 'Browse 206 Medicines',
    accentColor: '#10b981',
  },
];

export default function OnboardingTour() {
  const { lang } = useLang();
  const { modalOpen } = useAuth();
  const nav = useNavigate();
  const isAr = lang === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  // Do not auto-block first-time visitors; tour remains available anytime from the side menu (☰)
  useEffect(() => {
    if (modalOpen) setIsOpen(false);
  }, [modalOpen]);

  // Listen for manual replay trigger from Side Drawer
  useEffect(() => {
    const onManualOpen = () => {
      setStepIdx(0);
      setIsOpen(true);
    };
    window.addEventListener(OPEN_ONBOARDING_EVENT, onManualOpen);
    return () => window.removeEventListener(OPEN_ONBOARDING_EVENT, onManualOpen);
  }, []);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[stepIdx] || TOUR_STEPS[0];
  const isLastStep = stepIdx === TOUR_STEPS.length - 1;

  const completeAndClose = () => {
    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, '1');
    } catch {
      /* ignore */
    }
    setIsOpen(false);
  };

  const handleNext = () => {
    if (isLastStep) {
      completeAndClose();
    } else {
      setStepIdx((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setStepIdx((prev) => Math.max(0, prev - 1));
  };

  const handleTryToolNow = () => {
    completeAndClose();
    nav(currentStep.targetPath);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'جولة تعريفية سريعة بالتطبيق' : 'Quick App Onboarding Tour'}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'rgba(6, 15, 28, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) completeAndClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          color: '#f8fafc',
          borderRadius: '24px',
          border: `2px solid ${currentStep.accentColor}`,
          boxShadow: `0 24px 60px rgba(0, 0, 0, 0.65), 0 0 35px ${currentStep.accentColor}33`,
          padding: '22px 20px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Row: Step Counter + Skip Button */}
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
              background: `${currentStep.accentColor}26`,
              color: '#5eead4',
              border: `1px solid ${currentStep.accentColor}66`,
              borderRadius: '99px',
              padding: '4px 12px',
              fontSize: '0.78rem',
              fontWeight: 800,
            }}
          >
            {isAr
              ? `خطوة ${stepIdx + 1} من ${TOUR_STEPS.length}`
              : `Step ${stepIdx + 1} of ${TOUR_STEPS.length}`}
          </span>

          <button
            type="button"
            onClick={completeAndClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '99px',
              padding: '5px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {isAr ? 'تخطي ✕' : 'Skip ✕'}
          </button>
        </div>

        {/* Step Progress Dots */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '18px',
          }}
        >
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStepIdx(idx)}
              aria-label={isAr ? `الانتقال للخطوة ${idx + 1}` : `Go to step ${idx + 1}`}
              style={{
                flex: idx === stepIdx ? 2.2 : 1,
                height: '6px',
                borderRadius: '99px',
                border: 'none',
                background: idx <= stepIdx ? currentStep.accentColor : 'rgba(148, 163, 184, 0.25)',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Hero Icon & Badge */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '22px',
              margin: '0 auto 10px',
              background: `radial-gradient(circle, ${currentStep.accentColor}38 0%, rgba(15,23,42,0.9) 80%)`,
              border: `2px solid ${currentStep.accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              boxShadow: `0 10px 25px ${currentStep.accentColor}33`,
            }}
          >
            {currentStep.icon}
          </div>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#38bdf8',
              marginBottom: '4px',
            }}
          >
            {isAr ? currentStep.badgeAr : currentStep.badgeEn}
          </div>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '1.28rem',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.35,
            }}
          >
            {isAr ? currentStep.titleAr : currentStep.titleEn}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.94rem',
              color: '#cbd5e1',
              lineHeight: 1.65,
            }}
          >
            {isAr ? currentStep.descAr : currentStep.descEn}
          </p>
        </div>

        {/* Highlight Tip Box */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.72)',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            borderRadius: '14px',
            padding: '12px 14px',
            fontSize: '0.84rem',
            color: '#e2e8f0',
            lineHeight: 1.55,
            marginBottom: '14px',
          }}
        >
          {isAr ? currentStep.highlightTipAr : currentStep.highlightTipEn}
        </div>

        {/* Optional Quick-Jump Pill to Try This Feature Immediately */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={handleTryToolNow}
            style={{
              background: 'transparent',
              color: '#5eead4',
              border: '1px dashed rgba(94, 234, 212, 0.45)',
              borderRadius: '99px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ✨ {isAr ? `${currentStep.targetLabelAr} ←` : `${currentStep.targetLabelEn} →`}
          </button>
        </div>

        {/* Bottom Navigation Buttons: Previous & Next / Finish */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          {stepIdx > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '14px',
                padding: '12px 14px',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isAr ? '→ السابق' : '← Back'}
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            style={{
              flex: 2,
              background: `linear-gradient(90deg, ${currentStep.accentColor} 0%, #0d9488 100%)`,
              color: '#0f172a',
              border: 'none',
              borderRadius: '14px',
              padding: '12px 18px',
              fontSize: '0.96rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: `0 8px 20px ${currentStep.accentColor}44`,
            }}
          >
            {isLastStep
              ? isAr
                ? '🚀 ابدأ استخدام التطبيق الآن'
                : '🚀 Start Using the App'
              : isAr
              ? 'التالي ←'
              : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
