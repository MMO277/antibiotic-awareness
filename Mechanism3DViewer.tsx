import React, { useEffect, useState } from 'react';
import { useLang } from './i18n';
import { tr } from './types';

export type MoaCategory = 'cell-wall' | 'dna-gyrase' | 'ribosome' | 'viral-zero';

interface Mechanism3DViewerProps {
  medicineId?: string;
  medicineTitle?: string;
  scientificName?: string;
}

export function detectMoaCategory(id = '', sci = ''): MoaCategory {
  const s = `${id} ${sci}`.toLowerCase();
  if (
    s.includes('ciprofloxacin') ||
    s.includes('levofloxacin') ||
    s.includes('moxifloxacin') ||
    s.includes('ofloxacin') ||
    s.includes('norfloxacin') ||
    s.includes('metronidazole') ||
    s.includes('nitrofurantoin') ||
    s.includes('trimethoprim')
  ) {
    return 'dna-gyrase';
  }
  if (
    s.includes('azithromycin') ||
    s.includes('clarithromycin') ||
    s.includes('erythromycin') ||
    s.includes('doxycycline') ||
    s.includes('tetracycline') ||
    s.includes('clindamycin') ||
    s.includes('gentamicin') ||
    s.includes('amikacin') ||
    s.includes('linezolid') ||
    s.includes('fusidic')
  ) {
    return 'ribosome';
  }
  return 'cell-wall';
}

export default function Mechanism3DViewer({
  medicineId = '',
  medicineTitle = '',
  scientificName = '',
}: Mechanism3DViewerProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const defaultCat = detectMoaCategory(medicineId, scientificName);
  const [activeTab, setActiveTab] = useState<MoaCategory>(defaultCat);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.25>(1);
  const [showSlice, setShowSlice] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setActiveTab(detectMoaCategory(medicineId, scientificName));
  }, [medicineId, scientificName]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setTick((t) => (t + 1) % 100);
    }, 60);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const tabs: {
    id: MoaCategory;
    titleAr: string;
    titleEn: string;
    subAr: string;
    subEn: string;
    color: string;
    efficacy: string;
    effectTypeAr: string;
    effectTypeEn: string;
    targetAr: string;
    targetEn: string;
    descAr: string;
    descEn: string;
  }[] = [
    {
      id: 'cell-wall',
      titleAr: 'تفجير الجدار الخلوي (Cell Wall Lysis)',
      titleEn: 'Cell Wall Lysis (Beta-Lactams)',
      subAr: 'البنسلينات • السيفالوسبورينات • الكاربابينيم • الفانكومايسين',
      subEn: 'Penicillins • Cephalosporins • Carbapenems • Glycopeptides',
      color: '#14b8a6',
      efficacy: '96%',
      effectTypeAr: 'قاتل للبكتيريا (Bactericidal - Time > MIC)',
      effectTypeEn: 'Bactericidal (Time-Dependent %T > MIC)',
      targetAr: 'إنزيمات ربط البنسلين (PBPs) وشبكة الببتيدوجلايكان',
      targetEn: 'Penicillin-Binding Proteins (PBPs) & Peptidoglycan Wall',
      descAr:
        'ترتبط جزيئات المضاد الحيوي بإنزيمات (PBPs) فتمنع تشابك شبكة الببتيدوجلايكان في جدار البكتيريا؛ ومع الضغط الأسموزي الداخلي ينفجر الجدار الخلوي وتتحلل الخلية البكتيرية بالكامل.',
      descEn:
        'Antibiotic molecules bind to Penicillin-Binding Proteins (PBPs), blocking peptidoglycan cross-linking. High internal osmotic pressure ruptures the weakened bacterial cell wall.',
    },
    {
      id: 'dna-gyrase',
      titleAr: 'تعطيل استنساخ الـ DNA (DNA Gyrase Block)',
      titleEn: 'DNA Gyrase Block (Quinolones & Nitroimidazoles)',
      subAr: 'الفلوروكينولونات (سيبرو/تافانيك) • الميترونيدازول • النيتروفورانتوين',
      subEn: 'Fluoroquinolones (Cipro/Levo) • Metronidazole • Nitrofurantoin',
      color: '#38bdf8',
      efficacy: '94%',
      effectTypeAr: 'قاتل سريع للبكتيريا (Bactericidal - AUC24/MIC)',
      effectTypeEn: 'Rapidly Bactericidal (Concentration AUC24/MIC)',
      targetAr: 'إنزيم DNA Gyrase و Topoisomerase IV والحلزون المزدوج',
      targetEn: 'Bacterial DNA Gyrase, Topoisomerase IV & DNA Strands',
      descAr:
        'تخترق جزيئات الدواء غشاء البكتيريا وتقفل إنزيم (DNA Gyrase) المسؤول عن فك التفاف الحمض النووي، مما يسبب تكسر خيوط الـ DNA وتوقف انقسام البكتيريا فوراً.',
      descEn:
        'Molecules penetrate the bacterial cell and trap DNA Gyrase and Topoisomerase IV complexes, inducing lethal double-stranded DNA breaks and halting replication.',
    },
    {
      id: 'ribosome',
      titleAr: 'إيقاف مصنع البروتين (Ribosome 50S/30S Stop)',
      titleEn: 'Ribosome 50S/30S Stop (Macrolides & Tetracyclines)',
      subAr: 'الماكروليد (زيثروماكس) • التتراسيكلين • الكليندامايسين • الأمينوجليكوزيد',
      subEn: 'Macrolides (Azithro) • Tetracyclines • Clindamycin • Linezolid',
      color: '#a855f7',
      efficacy: '91%',
      effectTypeAr: 'مثبط لتكاثر البكتيريا (Bacteriostatic / AUC-Driven)',
      effectTypeEn: 'Bacteriostatic / Protein Synthesis Arrest',
      targetAr: 'تحت الوحدة الريبوسومية 50S أو 30S البكتيرية',
      targetEn: 'Bacterial 50S or 30S Ribosomal Subunits (mRNA Translation)',
      descAr:
        'يرتبط الدواء بالريبوسوم البكتيري (50S أو 30S) فيمنع ترجمة شريط (mRNA) وتصنيع البروتينات الحيوية، مما يشل قدرة البكتيريا على النمو وإفراز السموم حتى يقضي عليها الجهاز المناعي.',
      descEn:
        'Binds selectively to bacterial 50S or 30S ribosomal subunits, freezing peptide chain elongation so bacteria cannot synthesize structural proteins or toxins.',
    },
    {
      id: 'viral-zero',
      titleAr: 'لماذا لا تتأثر الفيروسات؟ (0% أثر على البرد)',
      titleEn: 'Why Viruses Are Unaffected (0% Viral Effect)',
      subAr: 'فيروسات الإنفلونزا • نزلات البرد (Rhinovirus) • كورونا',
      subEn: 'Influenza • Common Cold Rhinovirus • RSV • Coronaviruses',
      color: '#f59e0b',
      efficacy: '0%',
      effectTypeAr: 'عديم الفاعلية تماماً ضد الفيروسات (0% Antiviral Activity)',
      effectTypeEn: 'Zero Antiviral Efficacy (No Target Structures Present)',
      targetAr: 'لا يوجد جدار ببتيدوجلايكان ولا ريبوسوم بكتيري في الفيروس!',
      targetEn: 'Viruses Lack Peptidoglycan Walls & Bacterial Ribosomes',
      descAr:
        'الفيروس كائن غير خلوي يتكون من غلاف بروتيني (Capsid) ومادة وراثية فقط، ولا يمتلك جداراً خلوياً بكتيرياً ولا ريبوسومات؛ لذلك ترتد جزيئات المضاد الحيوي عنه بنسبة فاعلية 0% بينما تقتل البكتيريا النافعة في أمعائك!',
      descEn:
        'Viruses are acellular particles lacking peptidoglycan cell walls, PBPs, and 50S/30S ribosomes. Antibiotic molecules bounce off with 0% efficacy while harming beneficial gut flora.',
    },
  ];

  const current = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section
      className="card"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: 'linear-gradient(145deg, #09111f 0%, #0f172a 60%, #111c33 100%)',
        color: '#f8fafc',
        border: `1.5px solid ${current.color}55`,
        borderRadius: '20px',
        padding: '22px',
        boxShadow: '0 20px 45px rgba(15, 23, 42, 0.35)',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                background: `${current.color}22`,
                color: current.color,
                border: `1px solid ${current.color}66`,
                padding: '4px 12px',
                borderRadius: '99px',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.4px',
              }}
            >
              🧬 {tr(lang, 'المحاكي البصري ثلاثي الأبعاد لآلية العمل (MOA 3D Viewer)', 'INTERACTIVE 3D MECHANISM OF ACTION (MOA)')}
            </span>
            {medicineTitle && (
              <span
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {medicineTitle}
              </span>
            )}
          </div>
          <h2 style={{ margin: '8px 0 2px', color: '#fff', fontSize: '1.35rem' }}>
            {isAr ? current.titleAr : current.titleEn}
          </h2>
          <p className="small" style={{ margin: 0, color: '#94a3b8' }}>
            {isAr ? current.subAr : current.subEn}
          </p>
        </div>

        {/* Viewport Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              background: isPlaying ? current.color : '#1e293b',
              color: isPlaying ? '#09111f' : '#e2e8f0',
              border: `1px solid ${current.color}`,
              borderRadius: '10px',
              padding: '7px 14px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            {isPlaying
              ? tr(lang, '⏸ إيقاف مؤقت', '⏸ Pause')
              : tr(lang, '▶ تشغيل المحاكاة', '▶ Play')}
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => (z === 1 ? 1.25 : 1))}
            style={{
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '7px 12px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            🔍 {zoomLevel === 1 ? tr(lang, 'تكبير الجزيئات 1.25x', 'Zoom 1.25x') : tr(lang, 'الحجم القياسي 1x', 'Reset 1x')}
          </button>
          <button
            type="button"
            onClick={() => setShowSlice((s) => !s)}
            style={{
              background: showSlice ? 'rgba(56, 189, 248, 0.18)' : '#1e293b',
              color: showSlice ? '#38bdf8' : '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '7px 12px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            🔬 {tr(lang, 'مقطع عرضي للخلية', 'Cross-Section Slice')}
          </button>
        </div>
      </div>

      {/* Main 3D Viewport + Telemetry Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginTop: '16px',
          alignItems: 'stretch',
        }}
      >
        {/* Interactive Biomedical SVG Viewport */}
        <div
          style={{
            gridColumn: 'span 2',
            background: 'radial-gradient(circle at 50% 50%, #0f293a 0%, #070d19 100%)',
            borderRadius: '16px',
            border: `1px solid ${current.color}44`,
            position: 'relative',
            minHeight: '310px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '12px',
          }}
        >
          {/* HUD Grid Lines */}
          <svg
            viewBox="0 0 680 320"
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '320px',
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.35s ease',
            }}
          >
            <defs>
              <radialGradient id="cellGlow" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={current.color} stopOpacity="0.35" />
                <stop offset="70%" stopColor={current.color} stopOpacity="0.08" />
                <stop offset="100%" stopColor="#070d19" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="capsuleShell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={current.color} stopOpacity="0.65" />
                <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
              </linearGradient>
            </defs>

            {/* Subtle HUD Grid */}
            <g stroke="rgba(148,163,184,0.08)" strokeWidth="1">
              {[60, 120, 180, 240, 300, 360, 420, 480, 540, 600].map((x) => (
                <line key={`vx-${x}`} x1={x} y1={0} x2={x} y2={320} />
              ))}
              {[60, 120, 180, 240].map((y) => (
                <line key={`hy-${y}`} x1={0} y1={y} x2={680} y2={y} />
              ))}
            </g>

            {/* Center Glow */}
            <circle cx="340" cy="160" r="145" fill="url(#cellGlow)" />

            {activeTab !== 'viral-zero' ? (
              <g>
                {/* Outer Peptidoglycan / Bacterial Capsule */}
                <rect
                  x="150"
                  y="75"
                  width="360"
                  height="170"
                  rx="85"
                  ry="85"
                  fill="url(#capsuleShell)"
                  stroke={current.color}
                  strokeWidth={activeTab === 'cell-wall' ? '3.5' : '2.5'}
                  strokeDasharray={activeTab === 'cell-wall' ? '14 8 6 8' : 'none'}
                />

                {/* Inner Cytoplasmic Membrane */}
                {showSlice && (
                  <rect
                    x="172"
                    y="95"
                    width="316"
                    height="130"
                    rx="65"
                    ry="65"
                    fill="rgba(7, 13, 25, 0.78)"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                )}

                {/* Peptidoglycan Mesh Grid (Highlighted in Cell-Wall Mode) */}
                {activeTab === 'cell-wall' && (
                  <g stroke="#5eead4" strokeWidth="1.2" opacity="0.65">
                    {[190, 230, 270, 310, 350, 390, 430].map((x) => (
                      <line key={`m-${x}`} x1={x} y1="82" x2={x - 18} y2="238" />
                    ))}
                    {/* Ruptured Wall Fragments on Right Side */}
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const shift = (tick % 50) * 0.8;
                      return (
                        <circle
                          key={`frag-${i}`}
                          cx={495 + i * 12 + shift}
                          cy={105 + i * 22 + (i % 2 === 0 ? -shift * 0.3 : shift * 0.3)}
                          r={5 + (i % 3) * 2}
                          fill="#2dd4bf"
                          opacity={Math.max(0.2, 1 - shift / 45)}
                        />
                      );
                    })}
                  </g>
                )}

                {/* Bacterial Nucleoid / DNA Supercoil (Highlighted in DNA Gyrase Mode) */}
                <path
                  d="M 215 160 Q 245 115, 275 160 T 335 160 T 395 160 T 445 160"
                  fill="none"
                  stroke={activeTab === 'dna-gyrase' ? '#38bdf8' : 'rgba(148,163,184,0.35)'}
                  strokeWidth={activeTab === 'dna-gyrase' ? '4' : '2'}
                  strokeDasharray={activeTab === 'dna-gyrase' ? '10 6' : 'none'}
                />
                <path
                  d="M 215 160 Q 245 205, 275 160 T 335 160 T 395 160 T 445 160"
                  fill="none"
                  stroke={activeTab === 'dna-gyrase' ? '#f43f5e' : 'rgba(148,163,184,0.25)'}
                  strokeWidth={activeTab === 'dna-gyrase' ? '3.5' : '1.5'}
                />

                {/* Ribosomes 50S / 30S (Highlighted in Ribosome Mode) */}
                {[
                  { x: 230, y: 125 },
                  { x: 290, y: 195 },
                  { x: 355, y: 122 },
                  { x: 410, y: 190 },
                  { x: 325, y: 158 },
                ].map((pos, idx) => (
                  <g key={`ribo-${idx}`} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle
                      r={activeTab === 'ribosome' ? 12 : 6}
                      fill={activeTab === 'ribosome' ? '#a855f7' : '#475569'}
                      opacity={activeTab === 'ribosome' ? 0.9 : 0.45}
                    />
                    {activeTab === 'ribosome' && (
                      <circle r="17" fill="none" stroke="#e9d5ff" strokeWidth="1.5" strokeDasharray="4 3" />
                    )}
                  </g>
                ))}

                {/* Animated Antibiotic Drug Molecules Attacking Target */}
                {[
                  { bx: 185, by: 95, tx: 250, ty: 82 },
                  { bx: 140, by: 160, tx: 230, ty: 125 },
                  { bx: 210, by: 245, tx: 335, ty: 160 },
                  { bx: 465, by: 88, tx: 485, ty: 135 },
                  { bx: 475, by: 230, tx: 410, ty: 190 },
                ].map((mol, i) => {
                  const p = ((tick + i * 20) % 100) / 100;
                  const cx = mol.bx + (mol.tx - mol.bx) * p;
                  const cy = mol.by + (mol.ty - mol.by) * p;
                  return (
                    <g key={`mol-${i}`}>
                      <line
                        x1={mol.bx}
                        y1={mol.by}
                        x2={cx}
                        y2={cy}
                        stroke={current.color}
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.5"
                      />
                      <circle cx={cx} cy={cy} r="8" fill={current.color} stroke="#fff" strokeWidth="2" />
                    </g>
                  );
                })}

                {/* Callout Annotations inside SVG */}
                <g fontFamily="sans-serif" fontSize="11.5" fontWeight="bold" fill="#e2e8f0">
                  <line x1="250" y1="82" x2="195" y2="42" stroke={current.color} strokeWidth="1.5" />
                  <rect x="45" y="22" width="165" height="26" rx="6" fill="rgba(15,23,42,0.88)" stroke={current.color} />
                  <text x="127" y="39" textAnchor="middle" fill="#5eead4">
                    {isAr ? 'جزيئات المضاد الحيوي' : 'Antibiotic Molecules'}
                  </text>

                  <line x1="485" y1="155" x2="545" y2="55" stroke="#38bdf8" strokeWidth="1.5" />
                  <rect x="465" y="25" width="190" height="26" rx="6" fill="rgba(15,23,42,0.88)" stroke="#38bdf8" />
                  <text x="560" y="42" textAnchor="middle" fill="#bae6fd">
                    {activeTab === 'cell-wall'
                      ? isAr
                        ? 'تحلل وانفجار الجدار الخلوي'
                        : 'Cell Wall Rupture / Lysis'
                      : activeTab === 'dna-gyrase'
                      ? isAr
                        ? 'إيقاف إنزيم DNA Gyrase'
                        : 'DNA Gyrase Blockade'
                      : isAr
                      ? 'قفل الريبوسوم 50S / 30S'
                      : '50S/30S Ribosome Lock'}
                  </text>
                </g>
              </g>
            ) : (
              /* Viral Particle Comparison View (0% Effect) */
              <g>
                {/* Icosahedral Viral Capsid */}
                <polygon
                  points="340,70 415,112 415,198 340,240 265,198 265,112"
                  fill="rgba(245, 158, 11, 0.18)"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                />
                {/* Viral Spike Proteins */}
                {[
                  [340, 70, 340, 42],
                  [415, 112, 442, 95],
                  [415, 198, 442, 215],
                  [340, 240, 340, 268],
                  [265, 198, 238, 215],
                  [265, 112, 238, 95],
                ].map(([x1, y1, x2, y2], idx) => (
                  <g key={`spike-${idx}`}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth="3" />
                    <circle cx={x2} cy={y2} r="6" fill="#f59e0b" />
                  </g>
                ))}
                {/* Viral RNA inside */}
                <path
                  d="M 295 155 Q 318 120, 340 155 T 385 155"
                  fill="none"
                  stroke="#fde68a"
                  strokeWidth="3.5"
                />
                {/* Antibiotic molecules bouncing off */}
                <path d="M 120 110 L 225 130 L 145 195" fill="none" stroke="#14b8a6" strokeWidth="2" strokeDasharray="5 4" />
                <circle cx="145" cy="195" r="8" fill="#14b8a6" stroke="#fff" strokeWidth="2" />
                <rect x="175" y="272" width="330" height="30" rx="8" fill="rgba(127,29,29,0.9)" stroke="#f87171" />
                <text x="340" y="292" textAnchor="middle" fill="#fef2f2" fontSize="12.5" fontWeight="bold">
                  {isAr
                    ? '⚠️ لا يوجد جدار بكتيري أو ريبوسوم — فاعلية المضاد الحيوي = 0%'
                    : '⚠️ No Peptidoglycan Wall or Ribosome — Antibiotic Efficacy = 0%'}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Right Telemetry Panel */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="small" style={{ color: '#94a3b8', fontWeight: 700 }}>
                {tr(lang, 'الفاعلية ضد الهدف الجزيئي', 'Target Binding Efficacy')}
              </span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: current.color }}>{current.efficacy}</span>
            </div>
            <div
              style={{
                height: '10px',
                background: '#1e293b',
                borderRadius: '99px',
                overflow: 'hidden',
                marginTop: '6px',
              }}
            >
              <div
                style={{
                  width: current.efficacy,
                  height: '100%',
                  background: current.color,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              borderRadius: '12px',
              padding: '12px',
              borderRight: isAr ? `4px solid ${current.color}` : 'none',
              borderLeft: !isAr ? `4px solid ${current.color}` : 'none',
            }}
          >
            <div className="small" style={{ color: '#94a3b8', fontWeight: 700 }}>
              {tr(lang, 'الهدف الجزيئي الدقيق:', 'Molecular Target:')}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {isAr ? current.targetAr : current.targetEn}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              borderRadius: '12px',
              padding: '12px',
            }}
          >
            <div className="small" style={{ color: '#94a3b8', fontWeight: 700 }}>
              {tr(lang, 'طبيعة التأثير الفارماكولوجي:', 'Pharmacodynamic Driver:')}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: current.color, marginTop: '4px' }}>
              {isAr ? current.effectTypeAr : current.effectTypeEn}
            </div>
          </div>

          <p className="small" style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6 }}>
            {isAr ? current.descAr : current.descEn}
          </p>
        </div>
      </div>

      {/* Bottom Mode Switcher Tabs (Matching Mockup 3) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          marginTop: '16px',
        }}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: isAr ? 'right' : 'left',
                padding: '12px 14px',
                borderRadius: '14px',
                background: active ? `${tab.color}22` : 'rgba(30, 41, 59, 0.65)',
                border: active ? `2px solid ${tab.color}` : '1px solid rgba(148, 163, 184, 0.2)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: active ? tab.color : 'transparent',
                  border: `2px solid ${tab.color}`,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: active ? '#fff' : '#cbd5e1' }}>
                  {isAr ? tab.titleAr : tab.titleEn}
                </div>
                <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>
                  {tab.efficacy} {tr(lang, 'فاعلية مستهدفة', 'Target Efficacy')}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
