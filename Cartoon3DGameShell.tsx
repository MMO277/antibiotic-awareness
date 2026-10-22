import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { Bilingual, Lang, pick } from './types';
import { mapScreenDeltaToLandscape, useGamingMode } from './useGamingMode';
import Disclaimer from './Disclaimer';
import { ScenarioChoice, ScenarioSource } from './medicalSimulatorScenarios';
import {
  emptyProgress,
  hasExtraIds,
  mergeProgress,
  SimulatorProgress,
  unionIds,
} from './simulatorProgressModel';
import {
  CLOUD_LOAD_TIMEOUT_MS,
  CloudGameId,
  cloudProgressAvailable,
  isLocalMergeResolved,
  markLocalMergeResolved,
  readCloudProgress,
  readGuestProgress,
  readUidCache,
  withTimeout,
} from './simulatorProgressCloud';
import { useSimulatorProgressSync } from './useSimulatorProgressSync';
import {
  AstReportConfig,
  BoxObstacle,
  buildCustomWorldScene,
  CustomNpcDef,
  CustomPropDef,
  CustomSceneAssets,
  lerpAngle,
  MicroscopeMiniGameConfig,
  MysteryClueCardConfig,
  NursingChecklistConfig,
  TriageCardConfig,
  updateCustomSceneAnimations,
  WorldPreset,
} from './cartoon3DSceneBuilder';
import './MedicalSimulator.css';
import './Cartoon3DGameShell.css';

export interface CustomMissionNode {
  id: string;
  speaker: string;
  targetNpc: string;
  objectiveHint: Bilingual;
  dialogue: Bilingual;
  choices: ScenarioChoice[];
}

export interface CustomMissionLevel {
  id: string;
  missionIndex: number;
  requiredMissionId: string | null;
  unlockRequirementText: Bilingual;
  accentHex: number;
  gentleTimerSeconds?: number;
  title: Bilingual;
  subtitle: Bilingual;
  categoryBadge: Bilingual;
  badgeIcon: string;
  badgeTitle: Bilingual;
  primaryNpc: string;
  briefing: Bilingual;
  initialNodeId: string;
  requirePropsSolvedBeforeNodeId?: string;
  interactiveProps: CustomPropDef[];
  nodes: Record<string, CustomMissionNode>;
  safeActionDemonstrated: Bilingual;
  educationalTakeaway: Bilingual;
  escalationGuidance: Bilingual;
  sources: ScenarioSource[];
}

export interface Cartoon3DGameConfig {
  gameId: CloudGameId;
  route: string;
  worldPreset: WorldPreset;
  gameIcon: string;
  gameTitle: Bilingual;
  fictionalNoticeBadge: Bilingual;
  loadingTitle: Bilingual;
  loadingSubtitle: Bilingual;
  controlsHintTitle: Bilingual;
  controlsHintBody: Bilingual;
  npcs: Record<string, CustomNpcDef>;
  missions: CustomMissionLevel[];
  showInventoryBar?: boolean;
  enableEvidenceJournal?: boolean;
}

interface DecisionLogItem {
  nodeId: string;
  speaker: string;
  choice: ScenarioChoice;
}

const INTERACT_DISTANCE = 2.5;
const PROP_INTERACT_DISTANCE = 2.3;
const PLAYER_SPEED = 4.35;
const PLAYER_RADIUS = 0.42;

function detectDefaultLowGraphics(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number') {
    return navigator.hardwareConcurrency <= 4;
  }
  return false;
}

function detectPrefersReducedMotion(): boolean {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

/** Synthesizes gentle WebAudio UI feedback chimes with zero external network assets */
function playGameSoundEffect(type: 'clue' | 'optimal' | 'caution' | 'complete', muted: boolean) {
  if (muted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.05, now);

    if (type === 'optimal' || type === 'clue') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.09); // E5
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'complete') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.start(now);
      osc.stop(now + 0.44);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(349.23, now); // F4
      osc.frequency.setValueAtTime(311.13, now + 0.1); // D#4
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.25);
    }
    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 550);
  } catch {
    /* ignore audio context restrictions */
  }
}

function collidesWithObstacles(x: number, z: number, obstacles: BoxObstacle[]): boolean {
  for (let i = 0; i < obstacles.length; i++) {
    const ob = obstacles[i];
    if (
      x + PLAYER_RADIUS > ob.minX &&
      x - PLAYER_RADIUS < ob.maxX &&
      z + PLAYER_RADIUS > ob.minZ &&
      z - PLAYER_RADIUS < ob.maxZ
    ) {
      return true;
    }
  }
  return false;
}

function isMissionUnlocked(
  missionId: string,
  missions: CustomMissionLevel[],
  completedIds: string[]
): boolean {
  const m = missions.find((x) => x.id === missionId);
  if (!m || !m.requiredMissionId) return true;
  return completedIds.includes(m.requiredMissionId);
}

// ── Interactive Microscope Mini-Game Component (Bacteria Lab) ───────────────────────────────
function MicroscopeMiniGameWidget({
  config,
  lang,
}: {
  config: MicroscopeMiniGameConfig;
  lang: Lang;
}) {
  const isAr = lang === 'ar';
  const [mag, setMag] = useState<'10x' | '40x' | '100x'>('10x');
  const [focus, setFocus] = useState<number>(25);

  const [minF, maxF] = config.targetFocusRange;
  const focusDiff = focus < minF ? minF - focus : focus > maxF ? focus - maxF : 0;
  const magReady = mag === config.targetMagnification || mag === '100x';
  const isSharp = focusDiff === 0 && magReady;
  const blurPx = Math.min(6, focusDiff / 12 + (mag === '10x' ? 1.8 : 0));
  const scaleFactor = mag === '10x' ? 0.72 : mag === '40x' ? 1.0 : 1.28;

  return (
    <div className="c3d-microscope-box" role="region" aria-label={isAr ? 'لعبة المجهر التفاعلي' : 'Interactive Microscope Mini-Game'}>
      <div className="c3d-micro-header">
        <strong>🔬 {pick(config.specimenTitle, lang)}</strong>
        <span className="c3d-fictional-ribbon">
          {isAr ? 'عينة تعليمية خيالية' : 'Fictional Educational Sample'} ({config.specimenId})
        </span>
      </div>

      <div className="c3d-micro-viewport-wrap">
        <div className="c3d-micro-lens">
          <svg
            viewBox="0 0 160 160"
            className="c3d-micro-svg"
            style={{
              filter: `blur(${blurPx.toFixed(1)}px)`,
              transform: `scale(${scaleFactor})`,
            }}
          >
            <line x1="80" y1="10" x2="80" y2="150" stroke="rgba(15,23,42,0.18)" strokeDasharray="3 3" />
            <line x1="10" y1="80" x2="150" y2="80" stroke="rgba(15,23,42,0.18)" strokeDasharray="3 3" />

            {config.gramStainType === 'gram_pos_cocci' && (
              <g fill="#5b21b6" stroke="#3b0764" strokeWidth="1.2">
                <circle cx="64" cy="66" r="6" />
                <circle cx="74" cy="63" r="6" />
                <circle cx="69" cy="74" r="6" />
                <circle cx="79" cy="72" r="6" />
                <circle cx="58" cy="74" r="6" />
                <circle cx="98" cy="92" r="6" />
                <circle cx="106" cy="88" r="6" />
                <circle cx="103" cy="99" r="6" />
                <circle cx="48" cy="102" r="11" fill="rgba(219,39,119,0.35)" stroke="#be185d" />
              </g>
            )}

            {config.gramStainType === 'gram_neg_rods' && (
              <g fill="#e11d48" stroke="#881337" strokeWidth="1">
                <rect x="48" y="54" width="18" height="7" rx="3.5" transform="rotate(18 48 54)" />
                <rect x="78" y="62" width="19" height="7" rx="3.5" transform="rotate(-24 78 62)" />
                <rect x="62" y="88" width="18" height="7" rx="3.5" transform="rotate(12 62 88)" />
                <rect x="92" y="96" width="18" height="7" rx="3.5" transform="rotate(35 92 96)" />
                <rect x="52" y="108" width="17" height="7" rx="3.5" transform="rotate(-15 52 108)" />
                <circle cx="108" cy="58" r="12" fill="rgba(190,24,93,0.3)" stroke="#9d174d" />
                <circle cx="44" cy="82" r="12" fill="rgba(190,24,93,0.3)" stroke="#9d174d" />
              </g>
            )}

            {config.gramStainType === 'viral_no_bacteria' && (
              <g>
                <ellipse cx="62" cy="74" rx="22" ry="16" fill="rgba(147,197,253,0.45)" stroke="#2563eb" strokeWidth="1.2" />
                <circle cx="62" cy="74" r="5" fill="#1d4ed8" />
                <ellipse cx="102" cy="94" rx="20" ry="15" fill="rgba(147,197,253,0.45)" stroke="#2563eb" strokeWidth="1.2" />
                <circle cx="102" cy="94" r="5" fill="#1d4ed8" />
              </g>
            )}

            {config.gramStainType === 'skin_contaminant' && (
              <g>
                <polygon points="45,55 95,48 110,92 60,108" fill="rgba(253,224,71,0.28)" stroke="#ca8a04" strokeWidth="1.2" />
                <circle cx="74" cy="76" r="5" fill="#6d28d9" />
                <circle cx="82" cy="79" r="5" fill="#6d28d9" />
              </g>
            )}
          </svg>
        </div>

        <div className="c3d-micro-controls">
          <div className="c3d-mag-row">
            {(['10x', '40x', '100x'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`c3d-mag-btn ${mag === m ? 'active' : ''}`}
                onClick={() => setMag(m)}
              >
                🔍 {m} {m === '100x' ? (isAr ? '(عدسة زيتية)' : '(Oil)') : ''}
              </button>
            ))}
          </div>

          <label className="c3d-focus-row">
            <span>{isAr ? 'ضبط البؤرة (Focus):' : 'Fine Focus:'}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={focus}
              onChange={(e) => setFocus(Number(e.target.value))}
            />
            <span>{focus}%</span>
          </label>

          <div className={`c3d-focus-status ${isSharp ? 'sharp' : 'blurry'}`}>
            {isSharp ? (
              <span>✅ {pick(config.findingSummary, lang)}</span>
            ) : (
              <span>
                💡{' '}
                {isAr
                  ? `اختر العدسة (${config.targetMagnification} أو 100x) وحرّك شريط البؤرة بين ${minF}% و ${maxF}% لتوضيح الرؤية المجهرية.`
                  : `Select lens (${config.targetMagnification} or 100x) and adjust focus between ${minF}%–${maxF}% to sharpen the slide.`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fictional Culture & Antimicrobial Susceptibility Report (AST) Widget ────────────────────
function AstReportWidget({
  config,
  lang,
}: {
  config: AstReportConfig;
  lang: Lang;
}) {
  const isAr = lang === 'ar';
  return (
    <div className="c3d-ast-card" role="region" aria-label={isAr ? 'تقرير المزرعة والحساسية الخيالي' : 'Fictional Culture and Susceptibility Report'}>
      <div className="c3d-micro-header">
        <strong>📊 {isAr ? 'تقرير المزرعة والحساسية الدوائية (AST)' : 'Culture & Susceptibility Report (AST)'}</strong>
        <span className="c3d-fictional-ribbon">
          ⚠️ {isAr ? 'حالة خيالية للتعلم فقط — ليست للاستخدام السريري' : 'FICTIONAL CASE — EDUCATIONAL USE ONLY'}
        </span>
      </div>

      <div className="c3d-ast-meta">
        <div>
          <strong>{isAr ? 'رقم التقرير الخيالي:' : 'Fictional ID:'}</strong> {config.reportCode}
        </div>
        <div>
          <strong>{isAr ? 'الحالة:' : 'Case:'}</strong> {pick(config.fictionalPatientLabel, lang)}
        </div>
        <div>
          <strong>{isAr ? 'العينة:' : 'Specimen:'}</strong> {pick(config.specimenSource, lang)}
        </div>
        <div>
          <strong>{isAr ? 'الميكروب المعزول:' : 'Isolated Organism:'}</strong> {pick(config.organismName, lang)}
        </div>
        <div>
          <strong>{isAr ? 'كثافة النمو:' : 'Colony Count:'}</strong> {pick(config.colonyCount, lang)}
        </div>
      </div>

      <div className="c3d-ast-table-wrap">
        <table className="c3d-ast-table">
          <thead>
            <tr>
              <th>{isAr ? 'المضاد الحيوي (اختبار معملي)' : 'Tested Agent'}</th>
              <th>{isAr ? 'تصنيف WHO AWaRe' : 'WHO AWaRe'}</th>
              <th>MIC</th>
              <th>{isAr ? 'النتيجة (S/I/R)' : 'Result (S/I/R)'}</th>
              <th>{isAr ? 'ملاحظة تعليمية' : 'Educational Note'}</th>
            </tr>
          </thead>
          <tbody>
            {config.rows.map((r, i) => (
              <tr key={i}>
                <td><strong>{pick(r.antibiotic, lang)}</strong></td>
                <td>
                  <span className={`c3d-aware-pill ${r.awareCategory}`}>
                    {r.awareCategory}
                  </span>
                </td>
                <td><code>{r.mic}</code></td>
                <td>
                  <span className={`c3d-sir-pill ${r.result}`}>
                    {r.result}
                  </span>
                </td>
                <td>{pick(r.note, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="small" style={{ color: '#a7f3d0' }}>
        🛡️ <strong>{isAr ? 'مبدأ ترشيد المضادات (Stewardship):' : 'Stewardship Principle:'}</strong>{' '}
        {pick(config.stewardshipNote, lang)}
      </div>
    </div>
  );
}

// ── ER Triage & Vitals Monitor Widget (Emergency Shift & Nurse Academy) ─────────────────────
function TriageCardWidget({
  config,
  lang,
}: {
  config: TriageCardConfig;
  lang: Lang;
}) {
  const isAr = lang === 'ar';
  return (
    <div className="c3d-triage-card" role="region" aria-label={isAr ? 'بطاقة الفرز والعلامات الحيوية' : 'Triage and Vitals Monitor'}>
      <div className="c3d-micro-header">
        <strong>📟 {pick(config.fictionalCaseName, lang)} ({config.patientCode})</strong>
        <span className="c3d-fictional-ribbon">
          {pick(config.ageGroup, lang)} • {isAr ? 'حالة تدريبية خيالية' : 'Fictional Training Case'}
        </span>
      </div>

      <div className="small" style={{ color: '#e2e8f0' }}>
        <strong>{isAr ? 'الشكوى الرئيسية:' : 'Chief Complaint:'}</strong> {pick(config.chiefComplaint, lang)}
      </div>

      <div className="c3d-vitals-grid">
        <div className="c3d-vital-cell">
          <small>{isAr ? 'الحرارة (Temp)' : 'Temp'}</small>
          <strong>{config.vitals.temp}</strong>
        </div>
        <div className="c3d-vital-cell">
          <small>{isAr ? 'النبض (HR)' : 'Heart Rate'}</small>
          <strong>{config.vitals.hr}</strong>
        </div>
        <div className="c3d-vital-cell">
          <small>{isAr ? 'التنفس (RR)' : 'Resp Rate'}</small>
          <strong>{config.vitals.rr}</strong>
        </div>
        <div className="c3d-vital-cell">
          <small>{isAr ? 'الأكسجين (SpO2)' : 'SpO2'}</small>
          <strong>{config.vitals.spo2}</strong>
        </div>
        <div className="c3d-vital-cell">
          <small>{isAr ? 'الضغط (BP)' : 'Blood Pressure'}</small>
          <strong>{config.vitals.bp}</strong>
        </div>
      </div>

      <div className="small" style={{ color: '#fde68a' }}>
        ⚠️ <strong>{isAr ? 'سجل الحساسية الدوائية:' : 'Allergy Record:'}</strong> {pick(config.allergyAlert, lang)}
      </div>

      {config.redFlags.length > 0 && (
        <div className="c3d-redflag-list">
          {config.redFlags.map((rf, idx) => (
            <span key={idx} className="c3d-redflag-chip">
              🚨 {pick(rf, lang)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Nursing Academy Protocol Checklist Widget ──────────────────────────────────────────────
function NursingChecklistWidget({
  config,
  lang,
}: {
  config: NursingChecklistConfig;
  lang: Lang;
}) {
  const isAr = lang === 'ar';
  return (
    <div className="c3d-nursing-card" role="region" aria-label={isAr ? 'قائمة الفحص التمريضي القياسي' : 'Standard Nursing Protocol Checklist'}>
      <div className="c3d-micro-header">
        <strong>📋 {pick(config.protocolTitle, lang)} ({config.protocolCode})</strong>
        <span className="c3d-fictional-ribbon">
          {isAr ? 'تدريب تمريضي خيالي آمن' : 'Fictional Nursing Simulation'}
        </span>
      </div>

      <div className="small" style={{ color: '#e0f2fe' }}>
        <strong>{isAr ? 'سياق الحالة التدريبية:' : 'Clinical Scenario Context:'}</strong>{' '}
        {pick(config.patientContext, lang)}
      </div>

      <div className="c3d-nursing-list">
        {config.checklistItems.map((item, idx) => (
          <div key={idx} className="c3d-nursing-item">
            <span className="c3d-nursing-item-icon" aria-hidden="true">{item.icon}</span>
            <div>
              <strong>{pick(item.label, lang)}</strong>
              <span>{pick(item.detail, lang)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="small" style={{ color: '#a7f3d0' }}>
        🛡️ <strong>{isAr ? 'القاعدة المهنية:' : 'Safety Standard:'}</strong>{' '}
        {pick(config.safetyPrinciple, lang)}
      </div>
    </div>
  );
}

// ── Medical Mystery Clue Card Widget ────────────────────────────────────────────────────────
function MysteryClueCardWidget({
  config,
  lang,
}: {
  config: MysteryClueCardConfig;
  lang: Lang;
}) {
  const isAr = lang === 'ar';
  return (
    <div className="c3d-mystery-clue-card" role="region" aria-label={isAr ? 'بطاقة دليل التحقيق الطبي' : 'Medical Investigation Clue Card'}>
      <div className="c3d-micro-header">
        <strong>🕵️ {pick(config.clueTitle, lang)} ({config.clueCode})</strong>
        <span className="c3d-fictional-ribbon">
          {isAr ? 'دليل تحقيق خيالي' : 'Fictional Case Evidence'}
        </span>
      </div>

      <div className="c3d-mystery-meta">
        <span>📍 <strong>{isAr ? 'المصدر:' : 'Location:'}</strong> {pick(config.sourceLocation, lang)}</span>
        <span>🕒 <strong>{isAr ? 'التوقيت:' : 'Timestamp:'}</strong> {pick(config.timestampLabel, lang)}</span>
      </div>

      <div className="c3d-mystery-evidence">
        {pick(config.evidenceSummary, lang)}
      </div>

      <div className="small" style={{ color: '#fde68a' }}>
        💡 <strong>{isAr ? 'مفتاح الاستنتاج:' : 'Deduction Key:'}</strong>{' '}
        {pick(config.deductionNote, lang)}
      </div>
    </div>
  );
}

interface InnerGameProps {
  config: Cartoon3DGameConfig;
  uid: string | null;
  initial: SimulatorProgress;
  remote: SimulatorProgress | null;
  localOffer: SimulatorProgress | null;
}

function Cartoon3DGameInner({ config, uid, initial, remote, localOffer }: InnerGameProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const navigate = useNavigate();

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneAssetsRef = useRef<CustomSceneAssets | null>(null);

  const [lowGraphics, setLowGraphics] = useState<boolean>(detectDefaultLowGraphics);
  const [reducedMotion] = useState<boolean>(detectPrefersReducedMotion);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const soundMutedRef = useRef<boolean>(soundMuted);
  soundMutedRef.current = soundMuted;

  const [sceneStatus, setSceneStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [webglErrorMsg, setWebglErrorMsg] = useState<string>('');
  const [paused, setPaused] = useState<boolean>(false);
  const [showControlsHint, setShowControlsHint] = useState<boolean>(true);
  const [showMissionDrawer, setShowMissionDrawer] = useState<boolean>(false);
  const [showEvidenceJournal, setShowEvidenceJournal] = useState<boolean>(false);
  const [lockedToastMsg, setLockedToastMsg] = useState<string>('');
  const [confirmExit, setConfirmExit] = useState<boolean>(false);

  // Skippable Cinematic Camera Fly-In State (0 -> 1 over ~2.2s at mission start)
  const [cinematicActive, setCinematicActive] = useState<boolean>(() => !detectPrefersReducedMotion());
  const cinematicProgressRef = useRef<number>(detectPrefersReducedMotion() ? 1 : 0);

  const [activeMissionId, setActiveMissionId] = useState<string>(() => {
    if (
      initial.lastPlayedId &&
      config.missions.some((m) => m.id === initial.lastPlayedId) &&
      isMissionUnlocked(initial.lastPlayedId, config.missions, initial.completedIds)
    ) {
      return initial.lastPlayedId;
    }
    return config.missions[0].id;
  });

  const activeMission: CustomMissionLevel = useMemo(() => {
    return config.missions.find((m) => m.id === activeMissionId) || config.missions[0];
  }, [config.missions, activeMissionId]);

  const [currentNodeId, setCurrentNodeId] = useState<string>(activeMission.initialNodeId);
  const [dialogueOpen, setDialogueOpen] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const activeSpeakerRef = useRef<string | null>(null);
  activeSpeakerRef.current = activeSpeaker;

  const [pendingFeedback, setPendingFeedback] = useState<{
    choice: ScenarioChoice;
    nextNodeId: string;
  } | null>(null);
  const npcReactionRef = useRef<'idle' | 'optimal' | 'caution'>('idle');
  npcReactionRef.current = pendingFeedback
    ? pendingFeedback.choice.quality === 'optimal'
      ? 'optimal'
      : 'caution'
    : 'idle';

  const [missionFinished, setMissionFinished] = useState<boolean>(false);
  const [decisionLog, setDecisionLog] = useState<DecisionLogItem[]>([]);
  const [completedMissions, setCompletedMissions] = useState<string[]>(initial.completedIds);
  const [earnedBadges, setEarnedBadges] = useState<string[]>(initial.earnedBadgeIds);

  const [solvedPropIds, setSolvedPropIds] = useState<string[]>([]);
  const solvedPropIdsRef = useRef<string[]>([]);
  solvedPropIdsRef.current = solvedPropIds;

  const [activePropModalId, setActivePropModalId] = useState<string | null>(null);
  const [propStepIndex, setPropStepIndex] = useState<number>(0);
  const [showStepHint, setShowStepHint] = useState<boolean>(false);
  const [propFeedback, setPropFeedback] = useState<{
    isCorrect: boolean;
    text: string;
  } | null>(null);

  const [gentleElapsedSec, setGentleElapsedSec] = useState<number>(0);

  const [nearestNpc, setNearestNpc] = useState<string | null>(null);
  const nearestNpcRef = useRef<string | null>(null);

  const [nearestPropId, setNearestPropId] = useState<string | null>(null);
  const nearestPropIdRef = useRef<string | null>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const joyVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joyKnob, setJoyKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joyTouchIdRef = useRef<number | null>(null);
  const joyBaseRef = useRef<HTMLDivElement | null>(null);

  const camYawRef = useRef<number>(0);
  const camPitchRef = useRef<number>(0.52);
  const orbitPointerIdRef = useRef<number | null>(null);
  const orbitLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const choiceLockRef = useRef<boolean>(false);

  const gaming = useGamingMode(wrapperRef, () => {
    setPaused(true);
  });
  const [immersiveMenuOpen, setImmersiveMenuOpen] = useState(false);

  const currentNode = useMemo(() => {
    if (missionFinished || !activeMission?.nodes) return null;
    return activeMission.nodes[currentNodeId] || Object.values(activeMission.nodes)[0] || null;
  }, [activeMission, currentNodeId, missionFinished]);

  const targetNpc: string | null = currentNode ? currentNode.targetNpc : null;
  const targetNpcRef = useRef<string | null>(targetNpc);
  targetNpcRef.current = targetNpc;

  const pausedRef = useRef<boolean>(paused);
  pausedRef.current = paused;

  const modalOpen = dialogueOpen || activePropModalId !== null || showEvidenceJournal;
  const modalOpenRef = useRef<boolean>(modalOpen);
  modalOpenRef.current = modalOpen;

  const levelInteractiveProps: CustomPropDef[] = useMemo(() => {
    return activeMission.interactiveProps || [];
  }, [activeMission]);

  const allLevelPropsSolved = useMemo(() => {
    if (levelInteractiveProps.length === 0) return true;
    return levelInteractiveProps.every((p) => solvedPropIds.includes(p.id));
  }, [levelInteractiveProps, solvedPropIds]);

  const activePropDef = useMemo(() => {
    if (!activePropModalId) return null;
    return levelInteractiveProps.find((p) => p.id === activePropModalId) || null;
  }, [activePropModalId, levelInteractiveProps]);

  const nearestPropDef = useMemo(() => {
    if (!nearestPropId) return null;
    return levelInteractiveProps.find((p) => p.id === nearestPropId) || null;
  }, [nearestPropId, levelInteractiveProps]);

  // Cloud sync
  const handleMergedProgress = useCallback((m: SimulatorProgress) => {
    setCompletedMissions((prev) => unionIds(prev, m.completedIds));
    setEarnedBadges((prev) => unionIds(prev, m.earnedBadgeIds));
  }, []);

  const {
    state: syncState,
    queue: queueProgress,
    flush: flushProgress,
  } = useSimulatorProgressSync({
    gameId: config.gameId,
    uid,
    remote,
    onMerged: handleMergedProgress,
  });

  const [mergeOffer, setMergeOffer] = useState<SimulatorProgress | null>(localOffer);
  const acceptMergeOffer = () => {
    if (mergeOffer) handleMergedProgress(mergeOffer);
    if (uid) markLocalMergeResolved(uid, config.gameId);
    setMergeOffer(null);
  };
  const dismissMergeOffer = () => {
    if (uid) markLocalMergeResolved(uid, config.gameId);
    setMergeOffer(null);
  };

  useEffect(() => {
    queueProgress({
      version: 1,
      completedIds: completedMissions,
      earnedBadgeIds: earnedBadges,
      lastPlayedId: activeMissionId,
    });
  }, [completedMissions, earnedBadges, activeMissionId, queueProgress]);

  useEffect(() => {
    gaming.enter({ native: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const assets = sceneAssetsRef.current;
    if (!assets) return;
    assets.configureMissionEnvironment(
      activeMission.accentHex,
      activeMission.interactiveProps,
      lowGraphics
    );
    assets.playerRig.root.position.set(0, 0, config.worldPreset === 'escape_lab' ? 5.2 : 1.5);
    assets.playerRig.root.rotation.y = Math.PI;
    if (!reducedMotion) {
      cinematicProgressRef.current = 0;
      setCinematicActive(true);
    }
  }, [activeMission, lowGraphics, config.worldPreset, reducedMotion]);

  useEffect(() => {
    if (!activeMission.gentleTimerSeconds || missionFinished || paused || modalOpen) return;
    const interval = window.setInterval(() => {
      setGentleElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeMission.gentleTimerSeconds, missionFinished, paused, modalOpen]);

  const startMission = useCallback(
    (missionId: string, overrideUnlocked = false) => {
      const found = config.missions.find((m) => m.id === missionId);
      if (!found) return;

      const unlocked =
        overrideUnlocked || isMissionUnlocked(found.id, config.missions, completedMissions);
      if (!unlocked) {
        const reqText = pick(found.unlockRequirementText, lang);
        setLockedToastMsg(`🔒 ${reqText}`);
        window.setTimeout(() => setLockedToastMsg(''), 3800);
        return;
      }

      choiceLockRef.current = false;
      setLockedToastMsg('');
      setActiveMissionId(found.id);
      setCurrentNodeId(found.initialNodeId);
      setPendingFeedback(null);
      setMissionFinished(false);
      setDecisionLog([]);
      setSolvedPropIds([]);
      setActivePropModalId(null);
      setPropStepIndex(0);
      setShowStepHint(false);
      setPropFeedback(null);
      setGentleElapsedSec(0);
      setDialogueOpen(false);
      setActiveSpeaker(null);
      setShowMissionDrawer(false);
      setShowEvidenceJournal(false);
    },
    [completedMissions, config.missions, lang]
  );

  const restartCurrentMission = useCallback(() => {
    startMission(activeMission.id, true);
  }, [activeMission.id, startMission]);

  const openPropModal = useCallback(
    (propId: string) => {
      const prop = levelInteractiveProps.find((p) => p.id === propId);
      if (prop?.requiresPropId && !solvedPropIdsRef.current.includes(prop.requiresPropId)) {
        const prereq = levelInteractiveProps.find((p) => p.id === prop.requiresPropId);
        const prereqName = prereq ? pick(prereq.name, lang) : '';
        setLockedToastMsg(
          isAr
            ? `🔒 سلسلة الأدلة: افحص أولاً «${prereqName}» لفك قفل هذا الدليل!`
            : `🔒 Clue Chain: Inspect "${prereqName}" first to unlock this evidence station!`
        );
        window.setTimeout(() => setLockedToastMsg(''), 3800);
        return;
      }
      setActivePropModalId(propId);
      setPropStepIndex(0);
      setShowStepHint(false);
      setPropFeedback(null);
      setDialogueOpen(false);
    },
    [isAr, lang, levelInteractiveProps]
  );

  const handleInteract = useCallback(() => {
    if (pausedRef.current || missionFinished) return;
    if (modalOpenRef.current) return;

    const propId = nearestPropIdRef.current;
    const npc = nearestNpcRef.current;

    if (propId && (!npc || !solvedPropIdsRef.current.includes(propId))) {
      openPropModal(propId);
      return;
    }

    if (npc) {
      setActiveSpeaker(npc);
      setDialogueOpen(true);
      return;
    }

    if (propId) {
      openPropModal(propId);
    }
  }, [openPropModal, missionFinished]);

  const interactFnRef = useRef(handleInteract);
  interactFnRef.current = handleInteract;

  const handleSelectPropOption = (opt: {
    id: string;
    label: Bilingual;
    isCorrect: boolean;
    feedback: Bilingual;
  }) => {
    if (!activePropDef) return;
    playGameSoundEffect(opt.isCorrect ? 'clue' : 'caution', soundMutedRef.current);
    setPropFeedback({
      isCorrect: opt.isCorrect,
      text: pick(opt.feedback, lang),
    });
  };

  const handleAdvancePropStep = () => {
    if (!activePropDef || !propFeedback) return;
    if (!propFeedback.isCorrect) {
      setPropFeedback(null);
      return;
    }

    if (propStepIndex + 1 < activePropDef.puzzleSteps.length) {
      setPropStepIndex((i) => i + 1);
      setShowStepHint(false);
      setPropFeedback(null);
    } else {
      const finishedId = activePropDef.id;
      setSolvedPropIds((prev) => (prev.includes(finishedId) ? prev : [...prev, finishedId]));
      setPropFeedback(null);
      setActivePropModalId(null);
    }
  };

  const handleSelectChoice = (choice: ScenarioChoice) => {
    if (choiceLockRef.current || !currentNode || pendingFeedback) return;
    choiceLockRef.current = true;

    playGameSoundEffect(
      choice.quality === 'optimal' ? 'optimal' : 'caution',
      soundMutedRef.current
    );

    setDecisionLog((prev) => [
      ...prev,
      {
        nodeId: currentNode.id,
        speaker: currentNode.speaker,
        choice,
      },
    ]);

    setPendingFeedback({
      choice,
      nextNodeId: choice.nextNodeId,
    });

    window.setTimeout(() => {
      choiceLockRef.current = false;
    }, 180);
  };

  const handleContinueAfterFeedback = () => {
    if (!pendingFeedback) return;
    const nextId = pendingFeedback.nextNodeId;
    setPendingFeedback(null);

    if (nextId === 'END') {
      playGameSoundEffect('complete', soundMutedRef.current);
      setDialogueOpen(false);
      setMissionFinished(true);
      setCompletedMissions((prev) =>
        prev.includes(activeMission.id) ? prev : [...prev, activeMission.id]
      );
      if (decisionLog.some((d) => d.choice.quality === 'optimal') || decisionLog.length > 0) {
        setEarnedBadges((prev) =>
          prev.includes(activeMission.id) ? prev : [...prev, activeMission.id]
        );
      }
      return;
    }

    const nextNode = activeMission.nodes[nextId];
    setCurrentNodeId(nextId);
    if (nextNode) {
      if (
        nextNode.targetNpc === activeSpeaker &&
        activeMission.requirePropsSolvedBeforeNodeId !== nextId
      ) {
        setDialogueOpen(true);
      } else {
        setDialogueOpen(false);
        setActiveSpeaker(null);
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const code = e.code;
      if (
        code === 'KeyW' ||
        code === 'KeyA' ||
        code === 'KeyS' ||
        code === 'KeyD' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        keysRef.current[code] = true;
        if (!modalOpenRef.current) {
          e.preventDefault();
        }
      } else if (code === 'KeyE') {
        if (!modalOpenRef.current) {
          e.preventDefault();
          interactFnRef.current();
        }
      } else if (code === 'KeyP') {
        setPaused((p) => !p);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const onBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Main Three.js WebGL Initialization & Render Loop
  useEffect(() => {
    let mounted = true;
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;

    setSceneStatus('loading');
    setWebglErrorMsg('');

    let renderer: THREE.WebGLRenderer | null = null;
    let sceneAssets: CustomSceneAssets | null = null;
    let rafId: number | null = null;
    let isTabHidden = document.hidden;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !lowGraphics,
        powerPreference: lowGraphics ? 'low-power' : 'high-performance',
        alpha: false,
      });

      const dprCap = lowGraphics ? 1.25 : 2.0;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      renderer.setPixelRatio(dpr);

      const rect = viewport.getBoundingClientRect();
      const initW = Math.max(300, Math.floor(rect.width));
      const initH = Math.max(260, Math.floor(rect.height));
      renderer.setSize(initW, initH, false);

      sceneAssets = buildCustomWorldScene(
        config.worldPreset,
        Object.values(config.npcs),
        lowGraphics
      );
      sceneAssetsRef.current = sceneAssets;

      sceneAssets.configureMissionEnvironment(
        activeMission.accentHex,
        activeMission.interactiveProps,
        lowGraphics
      );
      sceneAssets.playerRig.root.position.set(
        0,
        0,
        config.worldPreset === 'escape_lab' ? 5.2 : 1.5
      );

      sceneAssets.camera.aspect = initW / initH;
      sceneAssets.camera.updateProjectionMatrix();

      if (mounted) {
        setSceneStatus('ready');
      }
    } catch (err) {
      if (mounted) {
        setSceneStatus('error');
        setWebglErrorMsg(
          err instanceof Error
            ? err.message
            : 'WebGL renderer could not be initialized on this device.'
        );
      }
      return;
    }

    const onContextLost = (e: Event) => {
      e.preventDefault();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (mounted) {
        setSceneStatus('error');
        setWebglErrorMsg(
          isAr
            ? 'تم فقدان سياق الرسوميات ثلاثية الأبعاد (WebGL Context Lost). يمكنك إعادة المحاولة أو تفعيل وضع الرسوميات المنخفضة.'
            : 'WebGL 3D context was lost. Click Retry or enable Low Graphics mode.'
        );
      }
    };

    canvas.addEventListener('webglcontextlost', onContextLost, false);

    let orientTimer: number | undefined;
    const updateSize = () => {
      if (!renderer || !sceneAssets || !viewport) return;
      const r = viewport.getBoundingClientRect();
      const w = Math.floor(viewport.clientWidth || r.width);
      const h = Math.floor(viewport.clientHeight || r.height);
      if (w < 60 || h < 60) return;
      const dprCap = lowGraphics ? 1.25 : 2.0;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
      renderer.setSize(w, h, false);
      sceneAssets.camera.aspect = w / h;
      sceneAssets.camera.updateProjectionMatrix();
    };

    const onOrientationChange = () => {
      updateSize();
      window.clearTimeout(orientTimer);
      orientTimer = window.setTimeout(updateSize, 140);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateSize());
      resizeObserver.observe(viewport);
    }
    const vv = window.visualViewport;
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', onOrientationChange);
    vv?.addEventListener('resize', updateSize);

    const onVisibilityChange = () => {
      isTabHidden = document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let lastTime = performance.now();
    let elapsedTime = 0;

    const animate = (now: number) => {
      if (!mounted) return;
      rafId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isTabHidden || !renderer || !sceneAssets) return;

      const {
        scene,
        camera,
        playerRig,
        npcRigs,
        propRigs,
        doorRigs,
        ambientParticles,
        obstacles,
        worldBounds,
      } = sceneAssets;

      let isMoving = false;

      if (!pausedRef.current && !modalOpenRef.current) {
        elapsedTime += dt;

        // Advance skippable cinematic intro fly-in
        if (cinematicProgressRef.current < 1) {
          cinematicProgressRef.current = Math.min(1, cinematicProgressRef.current + dt * 0.48);
          if (cinematicProgressRef.current >= 1 && mounted) {
            setCinematicActive(false);
          }
        }

        const k = keysRef.current;
        let inputX = joyVecRef.current.x;
        let inputZ = joyVecRef.current.y;

        if (k['KeyW'] || k['ArrowUp']) inputZ -= 1;
        if (k['KeyS'] || k['ArrowDown']) inputZ += 1;
        if (k['KeyA'] || k['ArrowLeft']) inputX -= 1;
        if (k['KeyD'] || k['ArrowRight']) inputX += 1;

        const len = Math.hypot(inputX, inputZ);
        if (len > 0.08) {
          isMoving = true;
          if (cinematicProgressRef.current < 1) {
            cinematicProgressRef.current = 1;
            setCinematicActive(false);
          }
          const normX = inputX / Math.max(1, len);
          const normZ = inputZ / Math.max(1, len);

          const yaw = camYawRef.current;
          const cosY = Math.cos(yaw);
          const sinY = Math.sin(yaw);

          const worldDx = normX * cosY + normZ * sinY;
          const worldDz = -normX * sinY + normZ * cosY;

          const step = PLAYER_SPEED * dt;
          const curX = playerRig.root.position.x;
          const curZ = playerRig.root.position.z;

          const nextX = Math.max(
            worldBounds.minX,
            Math.min(worldBounds.maxX, curX + worldDx * step)
          );
          if (!collidesWithObstacles(nextX, curZ, obstacles)) {
            playerRig.root.position.x = nextX;
          }

          const nextZ = Math.max(
            worldBounds.minZ,
            Math.min(worldBounds.maxZ, curZ + worldDz * step)
          );
          if (!collidesWithObstacles(playerRig.root.position.x, nextZ, obstacles)) {
            playerRig.root.position.z = nextZ;
          }

          const targetAngle = Math.atan2(worldDx, worldDz);
          playerRig.root.rotation.y = lerpAngle(playerRig.root.rotation.y, targetAngle, 0.22);
        }
      } else {
        elapsedTime += dt * 0.5;
      }

      const px = playerRig.root.position.x;
      const pz = playerRig.root.position.z;
      let closestNpcId: string | null = null;
      let closestDist = INTERACT_DISTANCE;

      Object.keys(config.npcs).forEach((npcKey) => {
        const npcPos = config.npcs[npcKey].position;
        const d = Math.hypot(px - npcPos[0], pz - npcPos[2]);
        if (d < closestDist) {
          closestDist = d;
          closestNpcId = npcKey;
        }
      });

      if (closestNpcId !== nearestNpcRef.current) {
        nearestNpcRef.current = closestNpcId;
        setNearestNpc(closestNpcId);
      }

      let closestPropId: string | null = null;
      let closestPropDist = PROP_INTERACT_DISTANCE;
      Object.keys(propRigs).forEach((pid) => {
        const pr = propRigs[pid];
        const d = Math.hypot(px - pr.root.position.x, pz - pr.root.position.z);
        if (d < closestPropDist) {
          closestPropDist = d;
          closestPropId = pid;
        }
      });

      if (closestPropId !== nearestPropIdRef.current) {
        nearestPropIdRef.current = closestPropId;
        setNearestPropId(closestPropId);
      }

      updateCustomSceneAnimations(
        playerRig,
        npcRigs,
        propRigs,
        doorRigs,
        ambientParticles,
        solvedPropIdsRef.current,
        Object.keys(propRigs).length,
        targetNpcRef.current,
        closestNpcId,
        closestPropId,
        activeSpeakerRef.current,
        npcReactionRef.current,
        isMoving,
        reducedMotion,
        elapsedTime
      );

      // Camera: blend between cinematic overview and third-person follow camera
      const cProg = cinematicProgressRef.current;
      const camDist = 6.2 + (1 - cProg) * 3.2;
      const pitch = camPitchRef.current + (1 - cProg) * 0.25;
      const yaw = camYawRef.current + (1 - cProg) * 0.45;
      const desiredCamX = px + Math.sin(yaw) * Math.cos(pitch) * camDist;
      const desiredCamZ = pz + Math.cos(yaw) * Math.cos(pitch) * camDist;
      const desiredCamY = Math.max(2.2, 1.4 + Math.sin(pitch) * camDist);

      camera.position.lerp(new THREE.Vector3(desiredCamX, desiredCamY, desiredCamZ), 0.14);
      camera.lookAt(px, 1.25, pz);

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      mounted = false;
      sceneAssetsRef.current = null;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.clearTimeout(orientTimer);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', onOrientationChange);
      vv?.removeEventListener('resize', updateSize);
      if (sceneAssets) {
        sceneAssets.disposeAll();
      }
      if (renderer) {
        renderer.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowGraphics, isAr]);

  const handleViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, .ms-dialogue-modal, .ms-joystick-zone')) {
      return;
    }
    orbitPointerIdRef.current = e.pointerId;
    orbitLastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (orbitPointerIdRef.current !== e.pointerId) return;
    const rawDx = e.clientX - orbitLastPosRef.current.x;
    const rawDy = e.clientY - orbitLastPosRef.current.y;
    orbitLastPosRef.current = { x: e.clientX, y: e.clientY };
    const { dx, dy } = mapScreenDeltaToLandscape(rawDx, rawDy);

    camYawRef.current -= dx * 0.0075;
    camPitchRef.current = Math.max(0.28, Math.min(1.05, camPitchRef.current + dy * 0.0055));
  };

  const autoFullscreenTriedRef = useRef<boolean>(false);

  const tryAutoLandscapeFullscreenOnce = () => {
    if (!autoFullscreenTriedRef.current) {
      autoFullscreenTriedRef.current = true;
      if (gaming.nativeSupported && !gaming.nativeFullscreen) {
        gaming.toggleNative();
      } else {
        gaming.enter({ native: false });
      }
    }
  };

  const handleViewportPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (orbitPointerIdRef.current === e.pointerId) {
      orbitPointerIdRef.current = null;
    }
    if (
      e.type === 'pointerup' &&
      !(e.target as HTMLElement).closest('button, .ms-dialogue-modal, .ms-joystick-zone')
    ) {
      tryAutoLandscapeFullscreenOnce();
    }
  };

  const updateJoystickFromPoint = (clientX: number, clientY: number) => {
    const base = joyBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = Math.max(24, Math.min(rect.width, rect.height) * 0.38);

    const mapped = mapScreenDeltaToLandscape(clientX - cx, clientY - cy);
    let dx = mapped.dx;
    let dy = mapped.dy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    joyVecRef.current = { x: dx / maxR, y: dy / maxR };
  };

  const resetJoystick = () => {
    joyTouchIdRef.current = null;
    setJoyKnob({ x: 0, y: 0 });
    joyVecRef.current = { x: 0, y: 0 };
  };

  const getNextMission = (): CustomMissionLevel | null => {
    const next = config.missions.find(
      (m) => m.missionIndex === activeMission.missionIndex + 1
    );
    return next || null;
  };

  const completedCount = useMemo(
    () => config.missions.filter((m) => completedMissions.includes(m.id)).length,
    [config.missions, completedMissions]
  );

  const nodeBlockedByUnsolvedProp =
    currentNode &&
    activeMission.requirePropsSolvedBeforeNodeId === currentNode.id &&
    !allLevelPropsSolved;

  const handleRequestExit = () => {
    if ((decisionLog.length > 0 || solvedPropIds.length > 0) && !missionFinished) {
      setConfirmExit(true);
    } else {
      flushProgress();
      gaming.exit();
      navigate('/games');
    }
  };

  const handleConfirmExit = () => {
    setConfirmExit(false);
    flushProgress();
    gaming.exit();
    navigate('/games');
  };

  const totalMissions = config.missions.length;

  return (
    <main className="wrap ms-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div
        ref={wrapperRef}
        dir={isAr ? 'rtl' : 'ltr'}
        className={`card ms-wrapper ${gaming.active ? 'bh-immersive ms-immersive' : ''} ${immersiveMenuOpen ? 'ms-hud-expanded' : ''}`}
      >
        {gaming.active && (
          <button
            type="button"
            className="ms-immersive-menu-toggle"
            onClick={() => setImmersiveMenuOpen((open) => !open)}
            aria-expanded={immersiveMenuOpen}
            aria-label={immersiveMenuOpen ? (isAr ? 'إخفاء قائمة اللعبة' : 'Hide game menu') : (isAr ? 'فتح قائمة اللعبة' : 'Open game menu')}
            title={immersiveMenuOpen ? (isAr ? 'إخفاء القائمة' : 'Hide menu') : (isAr ? 'فتح القائمة' : 'Open menu')}
          >
            {immersiveMenuOpen ? '⌄' : '☰'}
          </button>
        )}
        {/* Top Control & Telemetry Bar */}
        <header className="ms-topbar">
          <div className="ms-topbar-left">
            <button
              type="button"
              className="ms-exit-btn"
              onClick={handleRequestExit}
              aria-label={isAr ? 'الخروج من اللعبة' : 'Exit Game'}
            >
              <span aria-hidden="true">✕</span>
              <span>{isAr ? 'الخروج من اللعبة' : 'Exit Game'}</span>
            </button>

            <div className="ms-title-block">
              <h1 className="ms-title">
                {config.gameIcon} {pick(config.gameTitle, lang)}
              </h1>
              <span className="ms-scenario-pill">
                {pick(activeMission.title, lang)}
              </span>
              <span className="c3d-fictional-ribbon">
                🛡️ {pick(config.fictionalNoticeBadge, lang)}
              </span>
            </div>
          </div>

          <div className="ms-topbar-actions">
            <span
              className={`ms-sync-chip ${syncState}`}
              role="status"
              title={
                syncState === 'local'
                  ? isAr
                    ? 'وضع الزائر: يُحفظ التقدم على هذا الجهاز فقط'
                    : 'Guest mode: progress is saved on this device only'
                  : syncState === 'saving'
                  ? isAr
                    ? 'جارٍ حفظ التقدم في حسابك...'
                    : 'Saving progress to your account...'
                  : syncState === 'error'
                  ? isAr
                    ? 'تعذّر الحفظ السحابي، سيُعاد المحاولة تلقائياً'
                    : 'Cloud save failed, will retry automatically'
                  : isAr
                  ? 'تم حفظ تقدمك في حسابك'
                  : 'Progress saved to your account'
              }
            >
              {syncState === 'local'
                ? '💾'
                : syncState === 'saving'
                ? '☁️…'
                : syncState === 'error'
                ? '⚠️'
                : '☁️✓'}
            </span>

            {config.enableEvidenceJournal && (
              <button
                type="button"
                className="ms-top-btn"
                onClick={() => setShowEvidenceJournal((j) => !j)}
                title={isAr ? 'فتح سجل الأدلة وسلسلة الاستنتاج' : 'Open Evidence Journal & Clue Chain'}
                aria-label={isAr ? 'سجل الأدلة' : 'Evidence Journal'}
              >
                📓{' '}
                <span className="ms-btn-label">
                  {isAr
                    ? `سجل الأدلة (${solvedPropIds.length}/${levelInteractiveProps.length})`
                    : `Journal (${solvedPropIds.length}/${levelInteractiveProps.length})`}
                </span>
                <span className="ms-btn-short">
                  {solvedPropIds.length}/{levelInteractiveProps.length}
                </span>
              </button>
            )}

            <button
              type="button"
              className="ms-top-btn active"
              onClick={() => setShowMissionDrawer((s) => !s)}
              aria-label={isAr ? 'قائمة المهام والمراحل' : 'Missions and stages'}
            >
              🗺️{' '}
              <span className="ms-btn-label">
                {isAr
                  ? `المهام (${completedCount}/${totalMissions})`
                  : `Missions (${completedCount}/${totalMissions})`}
              </span>
              <span className="ms-btn-short">
                {completedCount}/{totalMissions}
              </span>
            </button>

            <button
              type="button"
              className={`ms-top-btn ${soundMuted ? '' : 'active'}`}
              onClick={() => setSoundMuted((m) => !m)}
              aria-label={soundMuted ? (isAr ? 'تفعيل الصوت' : 'Unmute audio') : isAr ? 'كتم الصوت' : 'Mute audio'}
              title={soundMuted ? (isAr ? 'الصوت مكتوم' : 'Audio muted') : isAr ? 'المؤثرات الصوتية مفعلة' : 'Audio effects on'}
            >
              {soundMuted ? '🔇' : '🔊'}
            </button>

            <button
              type="button"
              className={`ms-top-btn ${lowGraphics ? 'active' : ''}`}
              onClick={() => setLowGraphics((lg) => !lg)}
              aria-label={isAr ? 'تبديل الرسوميات المنخفضة' : 'Toggle low graphics'}
            >
              ⚡{' '}
              <span className="ms-btn-label">
                {isAr
                  ? lowGraphics
                    ? 'رسوميات منخفضة: مفعّل'
                    : 'رسوميات قياسية'
                  : lowGraphics
                  ? 'Low Graphics: ON'
                  : 'Standard 3D'}
              </span>
            </button>

            <button
              type="button"
              className="ms-top-btn"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? (isAr ? 'استئناف' : 'Resume') : isAr ? 'إيقاف مؤقت' : 'Pause'}
            >
              {paused ? '▶' : '⏸'}{' '}
              <span className="ms-btn-label">
                {paused ? (isAr ? 'استئناف' : 'Resume') : isAr ? 'إيقاف مؤقت' : 'Pause'}
              </span>
            </button>

            {gaming.nativeSupported && (
              <button
                type="button"
                className="ms-top-btn"
                onClick={gaming.toggleNative}
                aria-label={
                  gaming.nativeFullscreen
                    ? isAr
                      ? 'الخروج من ملء الشاشة'
                      : 'Exit full screen'
                    : isAr
                    ? 'ملء الشاشة'
                    : 'Full screen'
                }
              >
                {gaming.nativeFullscreen ? '🗗' : '⛶'}{' '}
                <span className="ms-btn-label">
                  {gaming.nativeFullscreen
                    ? isAr
                      ? 'تصغير الشاشة'
                      : 'Exit Fullscreen'
                    : isAr
                    ? 'ملء الشاشة'
                    : 'Fullscreen'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Merge offer banner */}
        {mergeOffer && uid && (
          <div className="ms-sync-banner" role="status">
            <span>
              {isAr
                ? '💾 وجدنا تقدماً محفوظاً لهذه اللعبة على هذا الجهاز قبل تسجيل الدخول. هل تريد دمجه مع حسابك؟ (لن يُحذف أي تقدم)'
                : '💾 We found progress for this game saved on this device before sign-in. Merge it into your account?'}
            </span>
            <span className="ms-sync-banner-actions">
              <button type="button" className="ms-hint-dismiss" onClick={acceptMergeOffer}>
                {isAr ? 'دمج' : 'Merge'}
              </button>
              <button type="button" className="ms-cam-reset-btn" onClick={dismissMergeOffer}>
                {isAr ? 'لا، شكراً' : 'No thanks'}
              </button>
            </span>
          </div>
        )}

        {uid && syncState === 'error' && (
          <div className="ms-sync-banner error" role="alert">
            <span>
              {isAr
                ? '⚠️ تعذّر حفظ تقدمك في الحساب الآن. تقدمك محفوظ على هذا الجهاز وسنعيد المحاولة تلقائياً.'
                : '⚠️ Could not save to your account right now. Progress is kept locally and will retry automatically.'}
            </span>
            <button type="button" className="ms-cam-reset-btn" onClick={flushProgress}>
              {isAr ? 'إعادة المحاولة' : 'Retry now'}
            </button>
          </div>
        )}

        {lockedToastMsg && (
          <div className="ms-locked-toast" role="status">
            {lockedToastMsg}
          </div>
        )}

        {/* Mission Selector Drawer */}
        {showMissionDrawer && (
          <section
            className="ms-scenario-drawer"
            aria-label={isAr ? 'اختيار المهام والمراحل' : 'Mission Selector'}
          >
            <div className="ms-drawer-head">
              <strong>
                {config.gameIcon} {pick(config.gameTitle, lang)} —{' '}
                {isAr
                  ? `السيناريوهات والمهام المتدرجة (${completedCount}/${totalMissions})`
                  : `Progressive Scenarios & Cases (${completedCount}/${totalMissions})`}
              </strong>
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setShowMissionDrawer(false)}
              >
                {isAr ? 'إغلاق ✕' : 'Close ✕'}
              </button>
            </div>

            <p className="small muted" style={{ margin: 0, color: '#94a3b8' }}>
              {isAr
                ? `تُفتح المهمة ١ تلقائياً، وتُفتح كل مهمة تالية فور إتمام المهمة السابقة. ${
                    uid
                      ? 'يُحفظ تقدمك في حسابك سحابياً عبر أجهزتك.'
                      : 'يُحفظ تقدمك على هذا الجهاز — سجّل الدخول للمزامنة السحابية.'
                  }`
                : `Scenario 1 is unlocked by default; subsequent scenarios unlock progressively. ${
                    uid
                      ? 'Your progress syncs to your cloud account across devices.'
                      : 'Progress is saved locally on this device — sign in to sync across devices.'
                  }`}
            </p>

            <div className="ms-scenario-grid">
              {config.missions.map((m) => {
                const isDone = completedMissions.includes(m.id);
                const isUnlocked = isMissionUnlocked(m.id, config.missions, completedMissions);
                const isCurrent = m.id === activeMission.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`ms-scen-card ${isCurrent ? 'current' : ''} ${
                      isDone ? 'done' : ''
                    } ${!isUnlocked ? 'locked' : ''}`}
                    onClick={() => startMission(m.id)}
                  >
                    <div className="ms-scen-card-top">
                      <span className="ms-scen-num">
                        {isUnlocked ? `${m.badgeIcon} #${m.missionIndex}` : `🔒 #${m.missionIndex}`}
                      </span>
                      <span className="ms-scen-badge">{pick(m.categoryBadge, lang)}</span>
                      {isDone ? (
                        <span className="ms-done-check">✓ {isAr ? 'مكتمل' : 'Completed'}</span>
                      ) : !isUnlocked ? (
                        <span className="ms-lock-tag">🔒 {isAr ? 'مغلق' : 'Locked'}</span>
                      ) : (
                        <span className="ms-open-tag">{isAr ? 'متاح' : 'Unlocked'}</span>
                      )}
                    </div>
                    <strong>{pick(m.title, lang)}</strong>
                    <small>{pick(m.subtitle, lang)}</small>
                    {!isUnlocked && (
                      <div className="ms-unlock-req-hint">
                        🔒 {pick(m.unlockRequirementText, lang)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Current Objective & Station Clue Bar */}
        <div className="ms-objective-bar">
          <div className="ms-objective-text">
            <span className="ms-objective-label">
              🎯 {isAr ? 'المهمة الحالية:' : 'Current Objective:'}
            </span>
            <span>
              {missionFinished
                ? isAr
                  ? 'أكملت هذه المهمة بنجاح! راجع التقرير التعليمي أو انتقل للمهمة التالية.'
                  : 'Mission completed! Review the educational debrief or advance to the next mission.'
                : currentNode
                ? pick(currentNode.objectiveHint, lang)
                : pick(activeMission.briefing, lang)}
            </span>
          </div>

          <div className="ms-objective-chips">
            {activeMission.gentleTimerSeconds && !missionFinished && (
              <div className="ms-timer-chip">
                <span>⏱️</span>
                <span>
                  {isAr ? 'زمن الاستجابة:' : 'Elapsed:'} {gentleElapsedSec}s
                </span>
              </div>
            )}

            {levelInteractiveProps.map((prop) => {
              const solved = solvedPropIds.includes(prop.id);
              const lockedByChain =
                Boolean(prop.requiresPropId) && !solvedPropIds.includes(prop.requiresPropId!);
              return (
                <button
                  key={prop.id}
                  type="button"
                  className={`ms-prop-status-chip ${solved ? 'solved' : 'pending'}`}
                  onClick={() => openPropModal(prop.id)}
                >
                  <span>{lockedByChain ? '🔒' : prop.iconEmoji}</span>
                  <span>{pick(prop.stationLabel, lang)}</span>
                  <b>
                    {solved
                      ? '✓'
                      : lockedByChain
                      ? isAr
                        ? 'مرتبط بدليل سابق'
                        : 'Locked Clue'
                      : isAr
                      ? 'افحص المحطة'
                      : 'Inspect'}
                  </b>
                </button>
              );
            })}

            {targetNpc && config.npcs[targetNpc] && !missionFinished && (
              <div className="ms-target-chip">
                <span>{config.npcs[targetNpc].avatarEmoji}</span>
                <span>
                  {isAr ? 'الشخصية:' : 'NPC:'}{' '}
                  <b>{pick(config.npcs[targetNpc].stationLabel, lang)}</b>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Optional Inventory / Keycards / Evidence Chain Bar */}
        {config.showInventoryBar && (
          <div className="c3d-inventory-bar" role="status">
            <span className="c3d-inv-label">
              {config.enableEvidenceJournal
                ? isAr
                  ? '🕵️ سلسلة الأدلة المكتشفة:'
                  : '🕵️ Evidence Chain:'
                : isAr
                ? '🗝️ المقتنيات وبطاقات الأمان:'
                : '🗝️ Keycards & Safety Seals:'}
            </span>
            {levelInteractiveProps.map((p) => {
              if (!p.rewardItem) return null;
              const collected = solvedPropIds.includes(p.id);
              return (
                <span
                  key={p.rewardItem.id}
                  className={`c3d-inv-chip ${collected ? 'collected' : ''}`}
                >
                  <span>{collected ? p.rewardItem.icon : '🔒'}</span>
                  <span>{pick(p.rewardItem.label, lang)}</span>
                </span>
              );
            })}
            {config.enableEvidenceJournal && (
              <button
                type="button"
                className="c3d-journal-btn"
                onClick={() => setShowEvidenceJournal(true)}
              >
                📓 {isAr ? 'لوحة الأدلة' : 'Evidence Board'}
              </button>
            )}
          </div>
        )}

        {/* 3D WebGL Viewport Container */}
        <div
          ref={viewportRef}
          className="ms-viewport"
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={handleViewportPointerUp}
          onPointerCancel={handleViewportPointerUp}
        >
          <canvas ref={canvasRef} className="ms-canvas" />

          {/* Skippable Cinematic Camera Fly-In Indicator */}
          {cinematicActive && sceneStatus === 'ready' && !modalOpen && !missionFinished && (
            <div className="c3d-cinematic-banner">
              <span>
                🎥 {pick(activeMission.title, lang)}
              </span>
              <button
                type="button"
                className="ms-hint-dismiss"
                onClick={() => {
                  cinematicProgressRef.current = 1;
                  setCinematicActive(false);
                }}
              >
                ⏭️ {isAr ? 'تخطي المقدمة' : 'Skip Intro'}
              </button>
            </div>
          )}

          {sceneStatus === 'loading' && (
            <div className="ms-status-overlay">
              <div className="ms-status-card">
                <div className="ms-spinner" aria-hidden="true">
                  {config.gameIcon}
                </div>
                <h2>{pick(config.loadingTitle, lang)}</h2>
                <p>{pick(config.loadingSubtitle, lang)}</p>
              </div>
            </div>
          )}

          {sceneStatus === 'error' && (
            <div className="ms-status-overlay" role="alert">
              <div className="ms-status-card error">
                <h2>
                  ⚠️{' '}
                  {isAr
                    ? 'تعذّر تشغيل مسرّع الرسوميات ثلاثية الأبعاد (WebGL)'
                    : 'WebGL 3D Renderer Issue Detected'}
                </h2>
                <p>{webglErrorMsg}</p>
                <div className="ms-error-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setLowGraphics(true);
                      setSceneStatus('loading');
                    }}
                  >
                    {isAr
                      ? 'إعادة المحاولة بوضع الرسوميات المنخفضة'
                      : 'Retry with Low Graphics Mode'}
                  </button>
                  <Link to="/games" className="btn ghost">
                    {isAr ? 'العودة لمركز الألعاب' : 'Back to Game Center'}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {showControlsHint &&
            !cinematicActive &&
            sceneStatus === 'ready' &&
            !modalOpen &&
            !missionFinished &&
            !nearestPropDef &&
            !nearestNpc && (
              <div className="ms-controls-hint-banner">
                <div>
                  <strong>🎮 {pick(config.controlsHintTitle, lang)}</strong>
                  <span>{pick(config.controlsHintBody, lang)}</span>
                </div>
                <button
                  type="button"
                  className="ms-hint-dismiss"
                  onClick={() => setShowControlsHint(false)}
                >
                  {isAr ? 'فهمت ✓' : 'Got it ✓'}
                </button>
              </div>
            )}

          {/* Proximity Floating Prompt */}
          {(nearestPropDef || (nearestNpc && config.npcs[nearestNpc])) &&
            !modalOpen &&
            !missionFinished &&
            !paused && (
              <div className="ms-proximity-prompt">
                {nearestPropDef && (!nearestNpc || !solvedPropIds.includes(nearestPropDef.id)) ? (
                  <>
                    <span className="ms-prox-emoji">{nearestPropDef.iconEmoji}</span>
                    <div className="ms-prox-info">
                      <strong>{pick(nearestPropDef.name, lang)}</strong>
                      <small>
                        {solvedPropIds.includes(nearestPropDef.id)
                          ? isAr
                            ? '✓ تم حل هذه المحطة (اضغط للمراجعة)'
                            : '✓ Station Solved (Tap to review)'
                          : isAr
                          ? '✨ محطة تفاعلية 3D — افحصها الآن!'
                          : '✨ Interactive 3D Station — Inspect Now!'}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="ms-prox-btn prop"
                      onClick={() => openPropModal(nearestPropDef.id)}
                    >
                      🔍 {isAr ? 'افحص المحطة (E)' : 'Inspect Station (E)'}
                    </button>
                  </>
                ) : nearestNpc && config.npcs[nearestNpc] ? (
                  <>
                    <span className="ms-prox-emoji">{config.npcs[nearestNpc].avatarEmoji}</span>
                    <div className="ms-prox-info">
                      <strong>{pick(config.npcs[nearestNpc].name, lang)}</strong>
                      <small>{pick(config.npcs[nearestNpc].stationLabel, lang)}</small>
                    </div>
                    <button
                      type="button"
                      className="ms-prox-btn"
                      onClick={() => {
                        setActiveSpeaker(nearestNpc);
                        setDialogueOpen(true);
                      }}
                    >
                      💬 {isAr ? 'تحدّث الآن (E)' : 'Talk / Interact (E)'}
                    </button>
                  </>
                ) : null}
              </div>
            )}

          {/* Pause Overlay */}
          {paused && !modalOpen && !missionFinished && (
            <div className="ms-status-overlay">
              <div className="ms-status-card">
                <h2>⏸ {isAr ? 'اللعبة متوقفة مؤقتاً' : 'Game Paused'}</h2>
                <p>{pick(activeMission.briefing, lang)}</p>
                <div className="ms-error-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setPaused(false)}
                  >
                    ▶ {isAr ? 'استئناف اللعب' : 'Resume Game'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={restartCurrentMission}
                  >
                    🔄 {isAr ? 'إعادة المهمة من البداية' : 'Restart Mission'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Evidence Journal & Clue Chain Modal (Medical Mystery) */}
          {showEvidenceJournal && (
            <div className="ms-dialogue-backdrop" role="dialog" aria-modal="true">
              <div className="ms-dialogue-modal">
                <div className="ms-dialogue-header">
                  <div className="ms-speaker-badge">
                    <span className="ms-speaker-avatar" aria-hidden="true">📓</span>
                    <div>
                      <strong>
                        {isAr ? 'سجل الأدلة ولوحة التحقيق السريري' : 'Clinical Evidence Journal & Clue Board'}
                      </strong>
                      <small>{pick(activeMission.title, lang)}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ms-dialogue-close"
                    onClick={() => setShowEvidenceJournal(false)}
                    aria-label={isAr ? 'إغلاق سجل الأدلة' : 'Close Evidence Journal'}
                  >
                    ✕
                  </button>
                </div>

                <div className="ms-dialogue-body">
                  <p className="ms-dialogue-speech">{pick(activeMission.briefing, lang)}</p>

                  <div className="c3d-journal-chain">
                    {levelInteractiveProps.map((prop, idx) => {
                      const solved = solvedPropIds.includes(prop.id);
                      return (
                        <div
                          key={prop.id}
                          className={`c3d-journal-node ${solved ? 'unlocked' : 'locked'}`}
                        >
                          <div className="c3d-micro-header">
                            <strong>
                              {solved ? '✅' : '🔒'} {isAr ? `الدليل #${idx + 1}:` : `Clue #${idx + 1}:`}{' '}
                              {pick(prop.name, lang)}
                            </strong>
                            <button
                              type="button"
                              className="c3d-hint-btn"
                              onClick={() => {
                                setShowEvidenceJournal(false);
                                openPropModal(prop.id);
                              }}
                            >
                              {solved
                                ? isAr
                                  ? 'مراجعة الدليل'
                                  : 'Review Clue'
                                : isAr
                                ? 'افحص الآن'
                                : 'Inspect Now'}
                            </button>
                          </div>
                          <div className="small" style={{ color: solved ? '#bbf7d0' : '#94a3b8' }}>
                            {solved
                              ? pick(prop.completionClueSummary, lang)
                              : isAr
                              ? `توجه إلى «${pick(prop.stationLabel, lang)}» في الغرفة ثلاثية الأبعاد لفحص هذا الدليل.`
                              : `Walk to "${pick(prop.stationLabel, lang)}" in the 3D scene to inspect this clue.`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3D Interactive Station / Prop Modal */}
          {activePropDef && (
            <div className="ms-dialogue-backdrop" role="dialog" aria-modal="true">
              <div className="ms-dialogue-modal ms-prop-modal">
                <div className="ms-dialogue-header">
                  <div className="ms-speaker-badge">
                    <span className="ms-speaker-avatar" aria-hidden="true">
                      {activePropDef.iconEmoji}
                    </span>
                    <div>
                      <strong>{pick(activePropDef.name, lang)}</strong>
                      <small>
                        {pick(activePropDef.stationLabel, lang)} •{' '}
                        {isAr
                          ? `الخطوة ${propStepIndex + 1} من ${activePropDef.puzzleSteps.length}`
                          : `Step ${propStepIndex + 1} of ${activePropDef.puzzleSteps.length}`}
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ms-dialogue-close"
                    onClick={() => setActivePropModalId(null)}
                    aria-label={isAr ? 'إغلاق النافذة' : 'Close station modal'}
                  >
                    ✕
                  </button>
                </div>

                {(() => {
                  const step = activePropDef.puzzleSteps[propStepIndex];
                  if (!step) return null;
                  return (
                    <div className="ms-dialogue-body">
                      {activePropDef.microscopeConfig && (
                        <MicroscopeMiniGameWidget
                          config={activePropDef.microscopeConfig}
                          lang={lang}
                        />
                      )}

                      {activePropDef.astReportConfig && (
                        <AstReportWidget
                          config={activePropDef.astReportConfig}
                          lang={lang}
                        />
                      )}

                      {activePropDef.triageCardConfig && (
                        <TriageCardWidget
                          config={activePropDef.triageCardConfig}
                          lang={lang}
                        />
                      )}

                      {activePropDef.nursingChecklistConfig && (
                        <NursingChecklistWidget
                          config={activePropDef.nursingChecklistConfig}
                          lang={lang}
                        />
                      )}

                      {activePropDef.mysteryClueConfig && (
                        <MysteryClueCardWidget
                          config={activePropDef.mysteryClueConfig}
                          lang={lang}
                        />
                      )}

                      <p className="ms-dialogue-speech">{pick(step.prompt, lang)}</p>

                      {step.hint && (
                        <div className="c3d-hint-row">
                          <button
                            type="button"
                            className="c3d-hint-btn"
                            onClick={() => setShowStepHint((h) => !h)}
                          >
                            💡{' '}
                            {showStepHint
                              ? isAr
                                ? 'إخفاء التلميح'
                                : 'Hide Hint'
                              : isAr
                              ? 'طلب تلميح تعليمي'
                              : 'Need a Hint?'}
                          </button>
                          {showStepHint && (
                            <div className="c3d-hint-box">
                              {pick(step.hint, lang)}
                            </div>
                          )}
                        </div>
                      )}

                      {!propFeedback ? (
                        <div className="ms-choices-list">
                          <div className="ms-choices-prompt">
                            {isAr
                              ? 'حلل المعطيات واختر الإجراء العلمي الصحيح:'
                              : 'Analyze the evidence and select the correct action:'}
                          </div>
                          {step.options.map((opt, idx) => (
                            <button
                              key={opt.id}
                              type="button"
                              className="ms-choice-btn"
                              onClick={() => handleSelectPropOption(opt)}
                            >
                              <span className="ms-choice-index">{idx + 1}</span>
                              <span className="ms-choice-text">{pick(opt.label, lang)}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`ms-feedback-box ${
                            propFeedback.isCorrect ? 'optimal' : 'caution'
                          }`}
                        >
                          <div className="ms-feedback-title">
                            {propFeedback.isCorrect
                              ? isAr
                                ? '✅ استنتاج علمي سليم!'
                                : '✅ Correct Evidence Analysis!'
                              : isAr
                              ? '💡 إجابة غير دقيقة — راجع الدليل وحاول مجدداً'
                              : '💡 Not Quite — Review the Clue & Try Again'}
                          </div>
                          <p className="ms-feedback-text">{propFeedback.text}</p>
                          <button
                            type="button"
                            className="btn ms-continue-btn"
                            onClick={handleAdvancePropStep}
                          >
                            {propFeedback.isCorrect
                              ? propStepIndex + 1 < activePropDef.puzzleSteps.length
                                ? isAr
                                  ? 'الخطوة التالية في الفحص ←'
                                  : 'Next Step →'
                                : isAr
                                ? 'اعتماد النتيجة ومتابعة المهمة ✓'
                                : 'Save Clue & Continue Mission ✓'
                              : isAr
                              ? 'إعادة المحاولة'
                              : 'Try Again'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Branching NPC Dialogue Modal */}
          {dialogueOpen && activeSpeaker && config.npcs[activeSpeaker] && !activePropDef && (
            <div className="ms-dialogue-backdrop" role="dialog" aria-modal="true">
              <div className="ms-dialogue-modal">
                <div className="ms-dialogue-header">
                  <div className="ms-speaker-badge">
                    <span className="ms-speaker-avatar" aria-hidden="true">
                      {config.npcs[activeSpeaker].avatarEmoji}
                    </span>
                    <div>
                      <strong>{pick(config.npcs[activeSpeaker].name, lang)}</strong>
                      <small>{pick(config.npcs[activeSpeaker].title, lang)}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ms-dialogue-close"
                    onClick={() => setDialogueOpen(false)}
                    aria-label={isAr ? 'إغلاق الحوار' : 'Close dialogue'}
                  >
                    ✕
                  </button>
                </div>

                {currentNode &&
                currentNode.targetNpc === activeSpeaker &&
                nodeBlockedByUnsolvedProp ? (
                  <div className="ms-dialogue-body">
                    <div className="ms-redirect-hint">
                      <strong>
                        🔍{' '}
                        {isAr
                          ? 'يجب إتمام فحص المحطات والأدلة ثلاثية الأبعاد أولاً!'
                          : 'Complete the 3D Station Inspections First!'}
                      </strong>
                      <p>
                        {isAr
                          ? 'يرجى فحص المحطات التفاعلية التالية في الغرفة ثلاثية الأبعاد قبل إتمام هذه الخطوة:'
                          : 'Please inspect and solve the following 3D stations before finalizing this step:'}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {levelInteractiveProps
                          .filter((p) => !solvedPropIds.includes(p.id))
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="btn small"
                              onClick={() => openPropModal(p.id)}
                            >
                              {p.iconEmoji} {pick(p.name, lang)}
                            </button>
                          ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setDialogueOpen(false)}
                    >
                      {isAr ? 'العودة للمشهد ثلاثي الأبعاد' : 'Back to 3D Scene'}
                    </button>
                  </div>
                ) : currentNode && currentNode.targetNpc === activeSpeaker ? (
                  <div className="ms-dialogue-body">
                    <p className="ms-dialogue-speech">{pick(currentNode.dialogue, lang)}</p>

                    {!pendingFeedback ? (
                      <div className="ms-choices-list">
                        <div className="ms-choices-prompt">
                          {isAr ? 'اختر القرار المناسب:' : 'Select your response / decision:'}
                        </div>
                        {currentNode.choices.map((ch, idx) => (
                          <button
                            key={ch.id}
                            type="button"
                            className="ms-choice-btn"
                            onClick={() => handleSelectChoice(ch)}
                          >
                            <span className="ms-choice-index">{idx + 1}</span>
                            <span className="ms-choice-text">{pick(ch.label, lang)}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className={`ms-feedback-box ${pendingFeedback.choice.quality}`}>
                        <div className="ms-feedback-title">
                          {pendingFeedback.choice.quality === 'optimal'
                            ? isAr
                              ? '✅ قرار سليم ومبني على الدليل'
                              : '✅ Optimal Evidence-Based Decision'
                            : pendingFeedback.choice.quality === 'caution'
                            ? isAr
                              ? '⚠️ تنبيه — يحتاج لمراجعة أدق'
                              : '⚠️ Caution — Needs Refinement'
                            : isAr
                            ? '🚨 إجراء غير آمن — راجع السبب العلمي!'
                            : '🚨 Unsafe Action — Review Rationale Carefully'}
                        </div>
                        <p className="ms-feedback-text">
                          {pick(pendingFeedback.choice.immediateFeedback, lang)}
                        </p>
                        <p className="ms-feedback-rationale">
                          <strong>{isAr ? 'التفسير العلمي:' : 'Educational Rationale:'}</strong>{' '}
                          {pick(pendingFeedback.choice.rationale, lang)}
                        </p>
                        <button
                          type="button"
                          className="btn ms-continue-btn"
                          onClick={handleContinueAfterFeedback}
                        >
                          {pendingFeedback.nextNodeId === 'END'
                            ? isAr
                              ? 'عرض التقرير الختامي والنتيجة ←'
                              : 'View Final Debrief & Summary →'
                            : isAr
                            ? 'متابعة الخطوة التالية ←'
                            : 'Continue to Next Step →'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ms-dialogue-body">
                    <p className="ms-dialogue-speech">
                      {pick(config.npcs[activeSpeaker].defaultGreeting, lang)}
                    </p>
                    {currentNode && config.npcs[currentNode.targetNpc] && (
                      <div className="ms-redirect-hint">
                        <strong>🎯 {isAr ? 'توجيه المهمة الحالية:' : 'Current Step Guidance:'}</strong>
                        <p>{pick(currentNode.objectiveHint, lang)}</p>
                        <p className="small">
                          {isAr ? 'توجه في الغرفة ثلاثية الأبعاد إلى: ' : 'Walk in the 3D scene to: '}
                          <b>{pick(config.npcs[currentNode.targetNpc].name, lang)}</b> (
                          {pick(config.npcs[currentNode.targetNpc].stationLabel, lang)})
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setDialogueOpen(false)}
                    >
                      {isAr ? 'حسناً، سأتوجه إلى هناك' : 'Got it, walking there now'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* End-of-Mission Debrief & Progressive Unlock Modal */}
          {missionFinished && (
            <div className="ms-dialogue-backdrop" role="dialog" aria-modal="true">
              <div className="ms-dialogue-modal ms-summary-modal">
                <div className="ms-summary-header">
                  <span className="ms-summary-icon">{activeMission.badgeIcon}</span>
                  <div>
                    <span className="badge approved">
                      {isAr ? 'اكتملت المهمة بنجاح ✓' : 'Mission Completed Successfully ✓'}
                    </span>
                    <h2>{pick(activeMission.title, lang)}</h2>
                  </div>
                </div>

                <div className="ms-summary-content">
                  {levelInteractiveProps.length > 0 && (
                    <div className="ms-summary-section safe-action">
                      <strong>
                        🔍{' '}
                        {isAr
                          ? 'الأدلة والمحطات ثلاثية الأبعاد التي تم إتمامها:'
                          : '3D Stations & Evidence Completed:'}
                      </strong>
                      {levelInteractiveProps.map((p) => (
                        <p key={p.id} style={{ marginTop: '4px' }}>
                          {p.iconEmoji} {pick(p.completionClueSummary, lang)}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="ms-summary-section safe-action">
                    <strong>
                      🛡️ {isAr ? 'الممارسة الآمنة المطبقة:' : 'Safe Practice Demonstrated:'}
                    </strong>
                    <p>{pick(activeMission.safeActionDemonstrated, lang)}</p>
                  </div>

                  <div className="ms-summary-section takeaway">
                    <strong>
                      💡 {isAr ? 'الخلاصة التثقيفية:' : 'Key Educational Takeaway:'}
                    </strong>
                    <p>{pick(activeMission.educationalTakeaway, lang)}</p>
                  </div>

                  <div className="ms-summary-section escalation">
                    <strong>
                      🚑 {isAr ? 'حدود الأمان والتصعيد الطبي:' : 'Safety & Clinical Escalation:'}
                    </strong>
                    <p>{pick(activeMission.escalationGuidance, lang)}</p>
                  </div>

                  <div className="ms-decisions-review">
                    <strong>
                      📋 {isAr ? 'مراجعة قراراتك:' : 'Decision Debrief:'}
                    </strong>
                    <ul className="ms-decision-list">
                      {decisionLog.map((item, idx) => (
                        <li key={idx} className={`ms-decision-item ${item.choice.quality}`}>
                          <div className="ms-decision-top">
                            <span>
                              {item.choice.quality === 'optimal'
                                ? '✅'
                                : item.choice.quality === 'caution'
                                ? '⚠️'
                                : '🚨'}{' '}
                              <b>
                                {config.npcs[item.speaker]
                                  ? pick(config.npcs[item.speaker].name, lang)
                                  : item.speaker}
                                :
                              </b>
                            </span>
                          </div>
                          <div className="ms-decision-choice">{pick(item.choice.label, lang)}</div>
                          <div className="ms-decision-why">{pick(item.choice.rationale, lang)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="ms-sources-box">
                    <strong>📚 {isAr ? 'المصادر المرجعية:' : 'Evidence-Based References:'}</strong>
                    <ul>
                      {activeMission.sources.map((src, i) => (
                        <li key={i}>
                          <a href={src.url} target="_blank" rel="noopener noreferrer">
                            {src.title} ({src.publisher}) ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="ms-summary-actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={restartCurrentMission}
                  >
                    🔄 {isAr ? 'إعادة لعب هذه المهمة' : 'Replay Mission'}
                  </button>

                  {(() => {
                    const nextM = getNextMission();
                    if (nextM) {
                      return (
                        <button
                          type="button"
                          className="btn"
                          style={{ background: '#0284c7', borderColor: '#0284c7' }}
                          onClick={() => startMission(nextM.id, true)}
                        >
                          🔓{' '}
                          {isAr
                            ? `المهمة التالية: ${pick(nextM.title, lang)} ←`
                            : `Next Mission: ${pick(nextM.title, lang)} →`}
                        </button>
                      );
                    }
                    return (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setShowMissionDrawer(true)}
                      >
                        🗺️ {isAr ? 'استعراض قائمة المهام' : 'Open Mission Map'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Mobile & Touch HUD Controls (strictly physical LEFT for joystick in both AR & EN) */}
          <style>{`
          html body .ms-wrapper.ms-immersive .ms-viewport {
            flex: 1 1 0% !important;
            min-height: 0 !important;
            width: 100% !important;
            height: auto !important;
            position: relative !important;
            overflow: hidden !important;
          }
          html body .ms-wrapper .ms-viewport .ms-hud-controls,
          html.bh-gaming body .ms-wrapper.ms-immersive .ms-hud-controls {
            position: absolute !important;
            inset: 0 !important;
            inset-inline: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 100% !important;
            direction: ltr !important;
            display: block !important;
            pointer-events: none !important;
            z-index: 18 !important;
          }
          html body .ms-wrapper .ms-viewport .ms-hud-controls .ms-joystick-zone,
          html.bh-gaming body .ms-wrapper.ms-immersive .ms-joystick-zone {
            position: absolute !important;
            direction: ltr !important;
            inset-inline-start: max(14px, env(safe-area-inset-left, 0px)) !important;
            inset-inline-end: auto !important;
            left: max(14px, env(safe-area-inset-left, 0px)) !important;
            right: auto !important;
            bottom: max(14px, env(safe-area-inset-bottom, 0px)) !important;
            top: auto !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 5px !important;
            pointer-events: auto !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 19 !important;
          }
          html body .ms-wrapper .ms-viewport .ms-hud-controls .ms-action-zone,
          html.bh-gaming body .ms-wrapper.ms-immersive .ms-action-zone {
            position: absolute !important;
            direction: ltr !important;
            inset-inline-start: auto !important;
            inset-inline-end: max(14px, env(safe-area-inset-right, 0px)) !important;
            right: max(14px, env(safe-area-inset-right, 0px)) !important;
            left: auto !important;
            bottom: max(14px, env(safe-area-inset-bottom, 0px)) !important;
            top: auto !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            gap: 6px !important;
            pointer-events: auto !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 19 !important;
          }
        `}</style>
          <div
            className="ms-hud-controls"
            dir="ltr"
            style={{
              position: 'absolute',
              inset: 0,
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: '100%',
              direction: 'ltr',
              pointerEvents: 'none',
              zIndex: 18,
            }}
          >
            <div
              className="ms-joystick-zone"
              dir="ltr"
              style={{
                position: 'absolute',
                left: 'max(14px, env(safe-area-inset-left, 0px))',
                right: 'auto',
                bottom: 'max(14px, env(safe-area-inset-bottom, 0px))',
                top: 'auto',
                direction: 'ltr',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                pointerEvents: 'auto',
                zIndex: 19,
              }}
            >
              <div
                ref={joyBaseRef}
                className="ms-joystick-base"
                onPointerDown={(e) => {
                  tryAutoLandscapeFullscreenOnce();
                  joyTouchIdRef.current = e.pointerId;
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {}
                  updateJoystickFromPoint(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  if (joyTouchIdRef.current === e.pointerId) {
                    updateJoystickFromPoint(e.clientX, e.clientY);
                  }
                }}
                onPointerUp={(e) => {
                  if (joyTouchIdRef.current === e.pointerId) {
                    resetJoystick();
                  }
                }}
                onPointerCancel={resetJoystick}
                onLostPointerCapture={resetJoystick}
                onTouchStart={(e) => {
                  tryAutoLandscapeFullscreenOnce();
                  if (e.changedTouches.length > 0) {
                    const t = e.changedTouches[0];
                    joyTouchIdRef.current = t.identifier;
                    updateJoystickFromPoint(t.clientX, t.clientY);
                  }
                }}
                onTouchMove={(e) => {
                  for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    if (t.identifier === joyTouchIdRef.current) {
                      updateJoystickFromPoint(t.clientX, t.clientY);
                      break;
                    }
                  }
                }}
                onTouchEnd={resetJoystick}
                onTouchCancel={resetJoystick}
              >
                <div
                  className="ms-joystick-knob"
                  style={{
                    transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`,
                  }}
                />
              </div>
              <span className="ms-joy-caption">
                {isAr ? 'عصا التحرك 3D' : 'Move Avatar'}
              </span>
            </div>

            <div
              className="ms-action-zone"
              dir="ltr"
              style={{
                position: 'absolute',
                right: 'max(14px, env(safe-area-inset-right, 0px))',
                left: 'auto',
                bottom: 'max(14px, env(safe-area-inset-bottom, 0px))',
                top: 'auto',
                direction: 'ltr',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '6px',
                pointerEvents: 'auto',
                zIndex: 19,
              }}
            >
              <button
                type="button"
                className="ms-cam-reset-btn"
                onClick={() => {
                  camYawRef.current = 0;
                  camPitchRef.current = 0.52;
                }}
              >
                🎥 {isAr ? 'الكاميرا' : 'Reset Cam'}
              </button>

              <button
                type="button"
                className={`ms-interact-btn ${nearestNpc || nearestPropDef ? 'ready' : ''}`}
                disabled={(!nearestNpc && !nearestPropDef) || modalOpen || missionFinished}
                onClick={handleInteract}
              >
                <span className="ms-interact-icon">
                  {nearestPropDef && (!nearestNpc || !solvedPropIds.includes(nearestPropDef.id))
                    ? '🔍'
                    : '💬'}
                </span>
                <span>
                  {nearestPropDef && (!nearestNpc || !solvedPropIds.includes(nearestPropDef.id))
                    ? isAr
                      ? `افحص (${nearestPropDef.iconEmoji})`
                      : `Inspect (${nearestPropDef.iconEmoji})`
                    : nearestNpc && config.npcs[nearestNpc]
                    ? isAr
                      ? `تحدّث (${config.npcs[nearestNpc].avatarEmoji})`
                      : `Interact (${config.npcs[nearestNpc].avatarEmoji})`
                    : isAr
                    ? 'اقترب للتفاعل'
                    : 'Walk Near Station'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Badges & Educational Safety Notice */}
        <section className="ms-session-bar">
          <div className="ms-badges-row">
            <strong>
              🏅{' '}
              {isAr
                ? `أوسمة المهام (${completedCount}/${totalMissions}):`
                : `Mission Badges (${completedCount}/${totalMissions}):`}
            </strong>
            {config.missions.map((m) => {
              const earned = earnedBadges.includes(m.id) || completedMissions.includes(m.id);
              return (
                <span
                  key={m.id}
                  className={`ms-badge-chip ${earned ? 'earned' : ''}`}
                  title={pick(m.title, lang)}
                >
                  <span>{m.badgeIcon}</span>
                  <span>
                    #{m.missionIndex}: {pick(m.badgeTitle, lang)}
                  </span>
                </span>
              );
            })}
          </div>

          <p className="ms-medical-disclaimer">
            {isAr
              ? `⚠️ تنبيه تعليمي وطبي هام: جميع الحالات والمرضى ونتائج المزارع في هذه اللعبة خيالية تماماً ومصممة للتوعية فقط. لا تُستخدم هذه اللعبة للتشخيص أو وصف المضادات الحيوية أو تحديد الجرعات أو تأخير الرعاية الطبية الطارئة. ${
                  uid ? 'يُحفظ تقدمك سحابياً في حسابك' : 'يُحفظ تقدمك محلياً على هذا الجهاز'
                } دون أي بيانات صحية شخصية.`
              : `⚠️ Important Educational & Safety Notice: All patients, organisms, and laboratory reports in this 3D game are 100% fictional and for educational awareness only. Never use this game to diagnose, prescribe antibiotics, determine dosages, or delay emergency medical care. Progress is ${
                  uid ? 'synced to your cloud account' : 'stored locally on this device'
                } with zero personal health data.`}
          </p>
        </section>

        {confirmExit && (
          <div className="bh-confirm" role="alertdialog" aria-modal="true">
            <div className="bh-confirm-card">
              <h2 className="bh-confirm-title">
                {isAr ? 'الخروج من اللعبة؟' : 'Exit the 3D Game?'}
              </h2>
              <p>
                {isAr
                  ? 'المهام المكتملة محفوظة، ولكن التقدم داخل المهمة الحالية سيُعاد من بدايته عند الخروج الآن.'
                  : 'Completed missions remain saved, but progress inside the current mission will reset if you exit now.'}
              </p>
              <button
                type="button"
                className="bh-btn bh-btn-primary"
                onClick={() => setConfirmExit(false)}
              >
                {isAr ? 'متابعة اللعب' : 'Continue Playing'}
              </button>
              <button
                type="button"
                className="bh-btn bh-btn-danger"
                onClick={handleConfirmExit}
              >
                {isAr ? 'الخروج لمركز الألعاب' : 'Exit to Game Center'}
              </button>
            </div>
          </div>
        )}
      </div>

      {!gaming.active && (
        <div style={{ marginTop: '16px' }}>
          <Disclaimer compact />
        </div>
      )}
    </main>
  );
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// Cloud Progress Gate Wrapper (waits for Firestore progress before rendering lock states)
// ════════════════════════════════════════════════════════════════════════════════════════════

type GateState =
  | { status: 'loading' }
  | {
      status: 'ready';
      uid: string | null;
      initial: SimulatorProgress;
      remote: SimulatorProgress | null;
      localOffer: SimulatorProgress | null;
    }
  | { status: 'error'; uid: string; cache: SimulatorProgress | null };

export default function Cartoon3DGameShell({ config }: { config: Cartoon3DGameConfig }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user, loading: authLoading } = useAuth();
  const uid = cloudProgressAvailable() && user ? user.uid : null;

  const [gate, setGate] = useState<GateState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authLoading) {
      setGate({ status: 'loading' });
      return;
    }

    if (!uid) {
      setGate({
        status: 'ready',
        uid: null,
        initial: readGuestProgress(config.gameId),
        remote: null,
        localOffer: null,
      });
      return;
    }

    let cancelled = false;
    setGate({ status: 'loading' });
    const cache = readUidCache(uid, config.gameId);

    withTimeout(readCloudProgress(uid, config.gameId), CLOUD_LOAD_TIMEOUT_MS)
      .then((remote) => {
        if (cancelled) return;
        let initial = mergeProgress(
          remote ?? emptyProgress(),
          cache ? { ...cache, lastPlayedId: undefined } : emptyProgress()
        );
        if (!initial.lastPlayedId && cache?.lastPlayedId) {
          initial = { ...initial, lastPlayedId: cache.lastPlayedId };
        }
        const guestLocal = readGuestProgress(config.gameId);
        const localOffer =
          !isLocalMergeResolved(uid, config.gameId) && hasExtraIds(guestLocal, initial)
            ? guestLocal
            : null;
        setGate({ status: 'ready', uid, initial, remote, localOffer });
      })
      .catch(() => {
        if (!cancelled) setGate({ status: 'error', uid, cache });
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, uid, attempt, config.gameId]);

  if (gate.status === 'ready') {
    return (
      <Cartoon3DGameInner
        key={`${config.gameId}:${gate.uid ?? 'guest'}`}
        config={config}
        uid={gate.uid}
        initial={gate.initial}
        remote={gate.remote}
        localOffer={gate.localOffer}
      />
    );
  }

  return (
    <main className="wrap ms-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="card ms-wrapper ms-gate">
        {gate.status === 'loading' ? (
          <div className="ms-gate-card" role="status">
            <div className="ms-spinner" aria-hidden="true">
              {config.gameIcon}
            </div>
            <h2>{isAr ? 'جارٍ تحميل تقدمك السحابي...' : 'Loading your cloud progress...'}</h2>
          </div>
        ) : (
          <div className="ms-gate-card" role="alert">
            <h2>{isAr ? 'تعذّر تحميل تقدمك من الحساب' : "Couldn't load your saved progress"}</h2>
            <p>
              {isAr
                ? 'تأكد من اتصالك بالإنترنت ثم أعد المحاولة، أو تابع بالنسخة المحفوظة على هذا الجهاز دون فقدان أي بيانات.'
                : 'Check your connection and try again, or continue with the copy saved on this device without losing any progress.'}
            </p>
            <div className="ms-error-actions">
              <button type="button" className="btn" onClick={() => setAttempt((n) => n + 1)}>
                {isAr ? 'إعادة المحاولة' : 'Try again'}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  setGate({
                    status: 'ready',
                    uid: gate.uid,
                    initial: gate.cache ?? emptyProgress(),
                    remote: null,
                    localOffer: null,
                  })
                }
              >
                {isAr ? 'المتابعة بنسخة هذا الجهاز' : 'Continue with this device'}
              </button>
              <Link className="btn ghost" to="/games">
                {isAr ? 'العودة لمركز الألعاب' : 'Back to Game Center'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
