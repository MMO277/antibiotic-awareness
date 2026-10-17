import { CSSProperties, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import Disclaimer from './Disclaimer';
import './GameCenter.css';

export interface GameRegistryItem {
  id: string;
  route: string;
  badgeAr: string;
  badgeEn: string;
  modeAr: string;
  modeEn: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  featuresAr: string[];
  featuresEn: string[];
  controlsAr: string;
  controlsEn: string;
  ctaAr: string;
  ctaEn: string;
  accentColor: string;
  secondaryColor: string;
  visualType: 'simulator3d' | 'arcade2d';
  category: 'all' | '3d-simulation' | '2d-arcade';
}

export const GAME_CENTER_REGISTRY: GameRegistryItem[] = [
  {
    id: 'medical-life-simulator',
    route: '/medical-simulator',
    badgeAr: 'محدّث • 10 مستويات متدرجة + 5 سيناريوهات 3D',
    badgeEn: 'UPDATED • 10 Campaign Levels + 5 Scenarios 3D',
    modeAr: 'محاكاة سريرية ثلاثية الأبعاد (WebGL 3D)',
    modeEn: '3D Clinical Roleplay & Puzzle Simulation',
    titleAr: 'محاكي الحياة الطبية (Medical Life Simulator 3D)',
    titleEn: 'Medical Life Simulator 3D',
    subtitleAr: 'تجول داخل المستشفى والمختبر والبيئة المجهرية 3D عبر 10 مستويات متدرجة و5 سيناريوهات سريرية',
    subtitleEn: 'Explore the 3D ward, ER, lab, and microscopic arena across 10 progressive levels & 5 clinical scenarios',
    descriptionAr:
      'عالم ثلاثي الأبعاد بالكامل (WebGL 3D) بأسلوب كرتوني منخفض المضلعات. تحكّم بشخصيتك في منظور الشخص الثالث، افحص منصات الأدلة والألغاز ثلاثية الأبعاد، وتفاعل مع الممرضة والطبيب والمريض والصيدلي عبر 10 مستويات متدرجة (تُفتح تباعاً) بالإضافة إلى الـ 5 سيناريوهات الأساسية.',
    descriptionEn:
      'A genuine 3D cartoon medical world built with WebGL perspective rendering. Control your third-person avatar, inspect 3D clue/puzzle stations, interact with 4 NPCs, and progress through 10 unlockable campaign levels (ER, Allergy Clue, Pharmacy, Home Mystery, Nursing Checklist, Lab, Ward Round, IPC Escape, AMR Microscopic Arena, and Final Mission) plus the 5 core scenarios.',
    featuresAr: [
      '10 مستويات حملة متدرجة القفل (Progressive Unlocking) + 5 سيناريوهات سريرية مفتوحة دائماً',
      'ألغاز وأدلة ثلاثية الأبعاد تفاعلية: شاشة الطوارئ، سجل الحساسية، خزانة المنزل، المختبر، والبيئة المجهرية',
      'تحكم كامل للهاتف (عصا تحكم افتراضية + زر فحص/تفاعل + تدوير الكاميرا باللمس) وللكمبيوتر (WASD + E)',
      'حفظ تلقائي لتقدم المستويات والأوسمة محلياً على جهازك دون جمع أي بيانات صحية أو المساس بـ Firebase',
    ],
    featuresEn: [
      '10 progressive campaign levels with automatic unlock persistence + 5 permanently unlocked core scenarios',
      'Interactive 3D clue & workflow puzzles: ER vitals monitor, allergy chart, home cabinet, lab matching, IPC, & 3D microbe scanner',
      'Mobile-first virtual joystick, touch camera orbit, & desktop WASD + E controls with Low Graphics mode',
      'Safe local progress saving with zero personal health data collection and zero Firebase changes',
    ],
    controlsAr: 'الموبايل: عصا التحكم الافتراضية + زر التفاعل/الفحص | الكمبيوتر: WASD أو الأسهم + مفتاح E',
    controlsEn: 'Mobile: Virtual Joystick + Interact/Inspect Button | Desktop: WASD / Arrows + E Key',
    ctaAr: 'ابدأ المحاكاة والمستويات العشرة 🏥',
    ctaEn: 'Launch 3D Simulator (10 Levels + 5 Scenarios) 🏥',
    accentColor: '#0e9aa7',
    secondaryColor: '#0284c7',
    visualType: 'simulator3d',
    category: '3d-simulation',
  },
  {
    id: 'bacteria-hunter',
    route: '/game',
    badgeAr: 'كلاسيكي • Canvas 2D',
    badgeEn: 'CLASSIC • Canvas 2D Arcade',
    modeAr: 'لعبة أركيد سريعة 2D',
    modeEn: '2D Action Arcade Game',
    titleAr: 'صائد البكتيريا (Bacteria Hunter)',
    titleEn: 'Bacteria Hunter',
    subtitleAr: 'احمِ الجسم من البكتيريا الضارة وتجنب استهداف الفيروسات أو البكتيريا النافعة',
    subtitleEn: 'Defend the body against harmful bacteria while sparing viruses and beneficial flora',
    descriptionAr:
      'لعبة أركيد تفاعلية ثنائية الأبعاد تختبر سرعة بديهتك ومعرفتك الدقيقة بالمضادات الحيوية: متى تطلق المضاد الحيوي على العدوى البكتيرية، ومتى تمتنع عن إطلاقه أمام الفيروسات والميكروبيوم النافع لتجنب مقاومة الميكروبات (AMR).',
    descriptionEn:
      'Fast-paced 2D Canvas arcade challenge teaching selective antibiotic targeting: eliminate pathogenic bacteria, avoid shooting viral infections or beneficial gut flora, and defeat multidrug-resistant superbug bosses.',
    featuresAr: [
      'موجات متدرجة الصعوبة ومعارك زعماء البكتيريا المقاومة (Superbugs)',
      'تمييز بصري وتعليمي بين البكتيريا الممرضة، البكتيريا النافعة، والفيروسات',
      'نظام إنجازات متكامل ووضع ملء الشاشة التلقائي للهواتف والكمبيوتر',
      'يعمل على نفس المسار الأصلي (/game) للحفاظ على جميع الروابط المرجعية',
    ],
    featuresEn: [
      'Progressive waves and multidrug-resistant Superbug boss encounters',
      'Visual & clinical distinction between pathogenic bacteria, commensal flora, and viruses',
      'Built-in achievement badges and fullscreen gaming mode',
      'Preserved at the original /game route for full backward compatibility',
    ],
    controlsAr: 'الموبايل: عصا التحكم + زر الإطلاق 🔵 | الكمبيوتر: WASD أو الأسهم + المسافة (Space)',
    controlsEn: 'Mobile: Touch Joystick + Fire Button 🔵 | Desktop: WASD / Arrows + Spacebar',
    ctaAr: 'العب صائد البكتيريا 🦠',
    ctaEn: 'Play Bacteria Hunter 🦠',
    accentColor: '#10b981',
    secondaryColor: '#059669',
    visualType: 'arcade2d',
    category: '2d-arcade',
  },
];

export default function GameCenter() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [filter, setFilter] = useState<'all' | '3d-simulation' | '2d-arcade'>('all');

  const visibleGames = useMemo(() => {
    if (filter === 'all') return GAME_CENTER_REGISTRY;
    return GAME_CENTER_REGISTRY.filter((g) => g.category === filter);
  }, [filter]);

  return (
    <main className="wrap gc-page" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero Banner */}
      <section className="gc-hero">
        <div className="gc-hero-badge">
          <span aria-hidden="true">🎮</span>
          <span>
            {isAr
              ? 'مركز الألعاب والمحاكاة السريرية التفاعلية'
              : 'Interactive Clinical Games & Simulation Hub'}
          </span>
        </div>

        <h1 className="gc-hero-title">
          {isAr
            ? 'تعلّم الاستخدام الآمن للمضادات الحيوية باللعب والمحاكاة'
            : 'Master Antibiotic Stewardship Through Play & 3D Simulation'}
        </h1>

        <p className="gc-hero-sub">
          {isAr
            ? 'اختر بين محاكي المستشفى الكرتوني ثلاثي الأبعاد (3D WebGL) المزود بـ 10 مستويات متدرجة القفل و5 سيناريوهات سريرية، أو لعبة الأركيد السريعة «صائد البكتيريا».'
            : 'Choose between our genuine 3D WebGL cartoon hospital simulator featuring 10 progressive campaign levels & 5 clinical scenarios, or the fast-paced 2D Bacteria Hunter arcade game.'}
        </p>

        {/* Filter Pills */}
        <div className="gc-filter-bar" role="tablist" aria-label={isAr ? 'تصنيف الألعاب' : 'Game categories'}>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={`gc-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {isAr ? `كل الألعاب (${GAME_CENTER_REGISTRY.length})` : `All Games (${GAME_CENTER_REGISTRY.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === '3d-simulation'}
            className={`gc-filter-btn ${filter === '3d-simulation' ? 'active' : ''}`}
            onClick={() => setFilter('3d-simulation')}
          >
            🏥 {isAr ? 'محاكاة 3D سريرية (10 مستويات)' : '3D Clinical Simulation (10 Levels)'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === '2d-arcade'}
            className={`gc-filter-btn ${filter === '2d-arcade' ? 'active' : ''}`}
            onClick={() => setFilter('2d-arcade')}
          >
            🦠 {isAr ? 'أركيد 2D تفاعلي' : '2D Action Arcade'}
          </button>
        </div>
      </section>

      {/* Game Cards Grid */}
      <section className="gc-grid" aria-label={isAr ? 'قائمة الألعاب المتاحة' : 'Available games'}>
        {visibleGames.map((game) => (
          <article
            key={game.id}
            className="gc-card"
            style={
              {
                '--gc-accent': game.accentColor,
                '--gc-secondary': game.secondaryColor,
              } as CSSProperties
            }
          >
            {/* Visual Banner */}
            <div className={`gc-card-visual ${game.visualType}`}>
              <div className="gc-visual-top-row">
                <span className="gc-badge-pill">{isAr ? game.badgeAr : game.badgeEn}</span>
                <span className="gc-mode-tag">{isAr ? game.modeAr : game.modeEn}</span>
              </div>

              {game.visualType === 'simulator3d' ? (
                <div className="gc-art-3d" aria-hidden="true">
                  <svg viewBox="0 0 360 150" className="gc-svg-illustration">
                    <defs>
                      <linearGradient id="gcFloorGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0f2942" />
                        <stop offset="100%" stopColor="#091929" />
                      </linearGradient>
                      <linearGradient id="gcCrossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                    </defs>
                    <polygon points="180,15 330,75 180,138 30,75" fill="url(#gcFloorGrad)" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.45" />
                    <line x1="105" y1="45" x2="255" y2="106" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="1" />
                    <line x1="255" y1="45" x2="105" y2="106" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="1" />
                    <g transform="translate(88, 46)">
                      <polygon points="0,24 38,8 62,18 24,34" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.2" />
                      <polygon points="0,24 24,34 24,46 0,36" fill="#0369a1" />
                      <polygon points="24,34 62,18 62,30 24,46" fill="#0284c7" />
                      <rect x="6" y="10" width="14" height="14" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
                    </g>
                    <g transform="translate(208, 52)">
                      <polygon points="0,18 34,4 58,14 24,28" fill="#5eead4" stroke="#0f766e" strokeWidth="1.2" />
                      <polygon points="0,18 24,28 24,44 0,34" fill="#0f766e" />
                      <polygon points="24,28 58,14 58,30 24,44" fill="#14b8a6" />
                    </g>
                    <g transform="translate(166, 48)">
                      <ellipse cx="14" cy="52" rx="14" ry="6" fill="rgba(14,165,233,0.35)" />
                      <rect x="7" y="24" width="14" height="22" rx="5" fill="#38bdf8" stroke="#fff" strokeWidth="1.2" />
                      <circle cx="14" cy="14" r="9" fill="#fde68a" stroke="#fff" strokeWidth="1.2" />
                      <rect x="8" y="3" width="12" height="5" rx="2" fill="#0284c7" />
                    </g>
                    <g transform="translate(165, 8)">
                      <rect x="11" y="0" width="8" height="22" rx="2" fill="url(#gcCrossGrad)" />
                      <rect x="4" y="7" width="22" height="8" rx="2" fill="url(#gcCrossGrad)" />
                    </g>
                  </svg>
                  <div className="gc-visual-floating-chips">
                    <span>🚑 {isAr ? 'طوارئ ومختبر' : 'ER & Lab'}</span>
                    <span>🔍 {isAr ? 'ألغاز وأدلة 3D' : '3D Clues'}</span>
                    <span>🦠 {isAr ? 'تحقيق مجهري' : 'Micro-AMR'}</span>
                    <span>🏆 {isAr ? '10 مستويات' : '10 Levels'}</span>
                  </div>
                </div>
              ) : (
                <div className="gc-art-2d" aria-hidden="true">
                  <svg viewBox="0 0 360 150" className="gc-svg-illustration">
                    <circle cx="90" cy="68" r="24" fill="rgba(239,68,68,0.22)" stroke="#ef4444" strokeWidth="2" />
                    <circle cx="83" cy="63" r="4" fill="#fca5a5" />
                    <circle cx="98" cy="63" r="4" fill="#fca5a5" />
                    <path d="M 80 77 Q 90 70 100 77" stroke="#fca5a5" strokeWidth="2.5" fill="none" />
                    <g transform="translate(155, 58)">
                      <rect x="0" y="0" width="38" height="16" rx="8" fill="#ffffff" stroke="#22d3ee" strokeWidth="2" />
                      <rect x="19" y="0" width="19" height="16" rx="8" fill="#06b6d4" />
                      <line x1="-22" y1="8" x2="-6" y2="8" stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="4 3" />
                    </g>
                    <g transform="translate(248, 45)">
                      <polygon points="0,22 36,6 28,22 36,38" fill="#10b981" stroke="#a7f3d0" strokeWidth="1.8" />
                    </g>
                  </svg>
                  <div className="gc-visual-floating-chips">
                    <span>🦠 {isAr ? 'بكتيريا ضارة' : 'Pathogens'}</span>
                    <span>🛡️ {isAr ? 'ميكروبيوم نافع' : 'Good Flora'}</span>
                    <span>⚡ {isAr ? 'حركة سريعة' : 'Arcade Action'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="gc-card-body">
              <h2 className="gc-card-title">{isAr ? game.titleAr : game.titleEn}</h2>
              <p className="gc-card-subtitle">{isAr ? game.subtitleAr : game.subtitleEn}</p>
              <p className="gc-card-desc">{isAr ? game.descriptionAr : game.descriptionEn}</p>

              <ul className="gc-feature-list">
                {(isAr ? game.featuresAr : game.featuresEn).map((feat, idx) => (
                  <li key={idx}>
                    <span className="gc-check-icon" aria-hidden="true">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="gc-controls-box">
                <strong>🎮 {isAr ? 'طريقة التحكم:' : 'Controls:'}</strong>
                <span>{isAr ? game.controlsAr : game.controlsEn}</span>
              </div>

              <div className="gc-card-actions">
                <Link to={game.route} className="gc-play-btn">
                  <span>{isAr ? game.ctaAr : game.ctaEn}</span>
                  <span aria-hidden="true">{isAr ? '←' : '→'}</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Educational Framing & Stewardship Note */}
      <section className="card gc-stewardship-banner">
        <div className="gc-stewardship-grid">
          <div>
            <h2>
              🛡️{' '}
              {isAr
                ? 'لماذا نتعلم ترشيد المضادات الحيوية عبر المحاكاة؟'
                : 'Why Learn Antibiotic Stewardship Through Simulation?'}
            </h2>
            <p className="small muted" style={{ marginBottom: '10px' }}>
              {isAr
                ? 'توصي منظمة الصحة العالمية (WHO) والمراكز الأمريكية لمكافحة الأمراض (CDC) وهيئة الدواء المصرية (EDA) بالتدريب التفاعلي المبني على السيناريوهات لتقليل صرف المضادات الحيوية للعدوى الفيروسية ومنع الأخطاء الدوائية وحوادث الحساسية المتصالبة.'
                : 'WHO, CDC, and the Egyptian Drug Authority (EDA) emphasize scenario-based active learning to reduce unnecessary antibiotic use in viral infections, verify drug allergies, and uphold nursing medication safety checks.'}
            </p>
            <div className="gc-pill-row">
              <span className="badge approved">
                {isAr ? '✓ حالات تعليمية خيالية آمنة' : '✓ Safe Fictional Educational Cases'}
              </span>
              <span className="badge approved">
                {isAr ? '✓ لا يتم جمع أي بيانات صحية أو شخصية' : '✓ Zero Personal or Health Data Collected'}
              </span>
              <span className="badge approved">
                {isAr ? '✓ متوافق مع الهواتف والكمبيوتر' : '✓ Mobile & Desktop Ready'}
              </span>
            </div>
          </div>
          <div className="gc-quick-links">
            <Link to="/allergy-checker" className="btn ghost small">
              🛡️ {isAr ? 'فاحص الحساسية الذكي' : 'Allergy Checker'}
            </Link>
            <Link to="/green-prescription" className="btn ghost small">
              🌿 {isAr ? 'الروشتة الخضرا' : 'Green Prescription'}
            </Link>
            <Link to="/quiz" className="btn ghost small">
              📝 {isAr ? 'الاختبار التوعوي' : 'Stewardship Quiz'}
            </Link>
          </div>
        </div>
      </section>

      <div style={{ marginTop: '20px' }}>
        <Disclaimer />
      </div>
    </main>
  );
}
