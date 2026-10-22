import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { pick } from './types';
import { mapScreenDeltaToLandscape, useGamingMode } from './useGamingMode';
import Disclaimer from './Disclaimer';
import {
  MEDICAL_SIMULATOR_SCENARIOS,
  MedicalScenario,
  NpcRole,
  ScenarioChoice,
  SIMULATOR_NPCS,
} from './medicalSimulatorScenarios';
import {
  CAMPAIGN_TEN_LEVELS,
  CampaignLevel,
  EnvironmentTheme,
  InteractivePropDefinition,
  isExperienceUnlocked,
  loadSimulatorProgress,
} from './medicalSimulatorLevels';
import {
  emptyProgress,
  hasExtraIds,
  mergeProgress,
  normalizeProgress,
  SimulatorProgress,
  unionIds,
} from './simulatorProgressModel';
import {
  CLOUD_LOAD_TIMEOUT_MS,
  cloudProgressAvailable,
  isLocalMergeResolved,
  markLocalMergeResolved,
  readCloudProgress,
  readUidCache,
  withTimeout,
} from './simulatorProgressCloud';
import { useSimulatorProgressSync } from './useSimulatorProgressSync';
import {
  BoxObstacle,
  buildHospitalWardScene,
  updateCharacterAnimations,
  WardSceneAssets,
} from './medicalSimulatorScene';
import './MedicalSimulator.css';

interface DecisionLogItem {
  nodeId: string;
  speaker: NpcRole;
  choice: ScenarioChoice;
}

type PlayableExperience = MedicalScenario & {
  isCampaignLevel?: boolean;
  campaignIndex?: number;
  requiredLevelId?: string | null;
  unlockRequirementText?: { ar: string; en: string };
  environmentTheme?: EnvironmentTheme;
  gentleTimerSeconds?: number;
  interactiveProps?: InteractivePropDefinition[];
  requirePropsSolvedBeforeNodeId?: string;
};

const ALL_EXPERIENCES: PlayableExperience[] = [
  ...CAMPAIGN_TEN_LEVELS,
  ...MEDICAL_SIMULATOR_SCENARIOS,
];

const INTERACT_DISTANCE = 2.45;
const PROP_INTERACT_DISTANCE = 2.25;
const PLAYER_SPEED = 4.2; // World units per second
const PLAYER_RADIUS = 0.42;

function detectDefaultLowGraphics(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number') {
    return navigator.hardwareConcurrency <= 4;
  }
  return false;
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

interface SimulatorGameProps {
  /** Firebase UID when progress is account-based; null = guest / local-only. */
  uid: string | null;
  /** Progress already loaded (cloud + per-account cache merged, or local for guests). */
  initial: SimulatorProgress;
  /** Last known cloud document (null if none / guest). */
  remote: SimulatorProgress | null;
  /** Progress found on this device from before sign-in that the user may merge into the account. */
  localOffer: SimulatorProgress | null;
}

function MedicalSimulatorGame({ uid, initial, remote, localOffer }: SimulatorGameProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const navigate = useNavigate();

  // References for DOM and 3D state
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wardAssetsRef = useRef<WardSceneAssets | null>(null);

  // Progress is loaded BEFORE this component mounts (see MedicalSimulator gate below), so levels never
  // flash as locked while cloud data is still loading.
  const initialSaved = initial;

  // Configurable graphics & UI states
  const [lowGraphics, setLowGraphics] = useState<boolean>(detectDefaultLowGraphics);
  const [sceneStatus, setSceneStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [webglErrorMsg, setWebglErrorMsg] = useState<string>('');
  const [paused, setPaused] = useState<boolean>(false);
  const [showControlsHint, setShowControlsHint] = useState<boolean>(true);
  const [showScenarioDrawer, setShowScenarioDrawer] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'campaign10' | 'original5'>('campaign10');
  const [lockedToastMsg, setLockedToastMsg] = useState<string>('');
  const [confirmExit, setConfirmExit] = useState<boolean>(false);

  // Active Experience & Branching Dialogue / Prop Puzzle State Machine
  const [activeScenarioId, setActiveScenarioId] = useState<string>(() => {
    if (
      initialSaved.lastPlayedId &&
      ALL_EXPERIENCES.some((e) => e.id === initialSaved.lastPlayedId) &&
      isExperienceUnlocked(initialSaved.lastPlayedId, initialSaved.completedIds)
    ) {
      return initialSaved.lastPlayedId;
    }
    return CAMPAIGN_TEN_LEVELS[0].id;
  });

  const activeScenario: PlayableExperience = useMemo(() => {
    return (
      ALL_EXPERIENCES.find((s) => s.id === activeScenarioId) ||
      CAMPAIGN_TEN_LEVELS[0]
    );
  }, [activeScenarioId]);

  const [currentNodeId, setCurrentNodeId] = useState<string>(activeScenario.initialNodeId);
  const [dialogueOpen, setDialogueOpen] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<NpcRole | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<{
    choice: ScenarioChoice;
    nextNodeId: string;
  } | null>(null);
  const [scenarioFinished, setScenarioFinished] = useState<boolean>(false);
  const [decisionLog, setDecisionLog] = useState<DecisionLogItem[]>([]);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>(initialSaved.completedIds);
  const [earnedBadges, setEarnedBadges] = useState<string[]>(initialSaved.earnedBadgeIds);

  // Interactive 3D Prop / Clue Puzzle State
  const [solvedPropIds, setSolvedPropIds] = useState<string[]>([]);
  const solvedPropIdsRef = useRef<string[]>([]);
  solvedPropIdsRef.current = solvedPropIds;

  const [activePropModalId, setActivePropModalId] = useState<string | null>(null);
  const [propStepIndex, setPropStepIndex] = useState<number>(0);
  const [propFeedback, setPropFeedback] = useState<{
    isCorrect: boolean;
    text: string;
  } | null>(null);

  // Gentle ER Response Pacing Timer (for Level 1)
  const [gentleElapsedSec, setGentleElapsedSec] = useState<number>(0);

  // Nearby NPC & Nearby 3D Prop states for HUD prompt & Interact button
  const [nearestNpc, setNearestNpc] = useState<NpcRole | null>(null);
  const nearestNpcRef = useRef<NpcRole | null>(null);

  const [nearestPropId, setNearestPropId] = useState<string | null>(null);
  const nearestPropIdRef = useRef<string | null>(null);

  // Input references (Keyboard + Virtual Joystick + Camera Touch Orbit)
  const keysRef = useRef<Record<string, boolean>>({});
  const joyVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joyKnob, setJoyKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joyTouchIdRef = useRef<number | null>(null);
  const joyBaseRef = useRef<HTMLDivElement | null>(null);

  const camYawRef = useRef<number>(0);
  const camPitchRef = useRef<number>(0.52);
  const orbitPointerIdRef = useRef<number | null>(null);
  const orbitLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Prevent repeated rapid choice clicks
  const choiceLockRef = useRef<boolean>(false);

  // Fullscreen / Immersive Gaming Mode hook
  const gaming = useGamingMode(wrapperRef, () => {
    setPaused(true);
  });
  const [immersiveMenuOpen, setImmersiveMenuOpen] = useState(false);

  const currentNode = useMemo(() => {
    if (scenarioFinished) return null;
    return activeScenario.nodes[currentNodeId] || null;
  }, [activeScenario, currentNodeId, scenarioFinished]);

  const targetNpc: NpcRole | null = currentNode ? currentNode.targetNpc : null;
  const targetNpcRef = useRef<NpcRole | null>(targetNpc);
  targetNpcRef.current = targetNpc;

  const pausedRef = useRef<boolean>(paused);
  pausedRef.current = paused;

  const modalOpen = dialogueOpen || activePropModalId !== null;
  const modalOpenRef = useRef<boolean>(modalOpen);
  modalOpenRef.current = modalOpen;

  const levelInteractiveProps: InteractivePropDefinition[] = useMemo(() => {
    return activeScenario.interactiveProps || [];
  }, [activeScenario]);

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

  // Cloud sync (signed-in) or local-only save (guest). Another device's progress discovered during a
  // save is merged into state (IDs are only ever added, never removed).
  const handleMergedProgress = useCallback((m: SimulatorProgress) => {
    setCompletedScenarios((prev) => unionIds(prev, m.completedIds));
    setEarnedBadges((prev) => unionIds(prev, m.earnedBadgeIds));
  }, []);
  const {
    state: syncState,
    queue: queueProgress,
    flush: flushProgress,
  } = useSimulatorProgressSync({ uid, remote, onMerged: handleMergedProgress });

  // Offer to merge progress that was saved on this device before sign-in
  const [mergeOffer, setMergeOffer] = useState<SimulatorProgress | null>(localOffer);
  const acceptMergeOffer = () => {
    if (mergeOffer) handleMergedProgress(mergeOffer);
    if (uid) markLocalMergeResolved(uid);
    setMergeOffer(null);
  };
  const dismissMergeOffer = () => {
    if (uid) markLocalMergeResolved(uid);
    setMergeOffer(null);
  };

  useEffect(() => {
    queueProgress({
      version: 1,
      completedIds: completedScenarios,
      earnedBadgeIds: earnedBadges,
      lastPlayedId: activeScenarioId,
    });
  }, [completedScenarios, earnedBadges, activeScenarioId, queueProgress]);

  // The simulator is an immersive game screen from the moment it opens (like Bacteria Hunter).
  // Native browser fullscreen needs a user gesture, so it is requested on the first tap in the scene
  // or via the Full Screen button; the CSS immersive layout works everywhere (incl. iPhone Safari).
  useEffect(() => {
    gaming.enter({ native: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconfigure the 3D scene's dynamic theme & interactive clue props when switching levels
  useEffect(() => {
    const assets = wardAssetsRef.current;
    if (!assets) return;
    const theme: EnvironmentTheme = activeScenario.environmentTheme || 'ward';
    const props = activeScenario.interactiveProps || [];
    assets.configureLevelEnvironment(theme, props, lowGraphics);
    // Reset player avatar to center entrance when starting a new level
    assets.playerRig.root.position.set(0, 0, 1.2);
    assets.playerRig.root.rotation.y = Math.PI;
  }, [activeScenario, lowGraphics]);

  // Gentle pacing timer for levels that specify gentleTimerSeconds (e.g. Level 1 ER)
  useEffect(() => {
    if (!activeScenario.gentleTimerSeconds || scenarioFinished || paused || modalOpen) return;
    const interval = window.setInterval(() => {
      setGentleElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeScenario.gentleTimerSeconds, scenarioFinished, paused, modalOpen]);

  // Start or switch to a scenario/level (enforcing progressive unlocking)
  const startScenario = useCallback(
    (scenarioId: string, overrideUnlocked = false) => {
      const found = ALL_EXPERIENCES.find((s) => s.id === scenarioId);
      if (!found) return;

      const unlocked =
        overrideUnlocked || isExperienceUnlocked(found.id, completedScenarios);
      if (!unlocked) {
        const reqText = found.unlockRequirementText
          ? pick(found.unlockRequirementText, lang)
          : isAr
          ? 'أكمل المستوى السابق أولاً لفتح هذا المستوى.'
          : 'Complete the previous level first to unlock this level.';
        setLockedToastMsg(`🔒 ${reqText}`);
        window.setTimeout(() => setLockedToastMsg(''), 3800);
        return;
      }

      choiceLockRef.current = false;
      setLockedToastMsg('');
      setActiveScenarioId(found.id);
      setCurrentNodeId(found.initialNodeId);
      setPendingFeedback(null);
      setScenarioFinished(false);
      setDecisionLog([]);
      setSolvedPropIds([]);
      setActivePropModalId(null);
      setPropStepIndex(0);
      setPropFeedback(null);
      setGentleElapsedSec(0);
      setDialogueOpen(false);
      setActiveSpeaker(null);
      setShowScenarioDrawer(false);
    },
    [completedScenarios, isAr, lang]
  );

  // Restart current scenario/level
  const restartCurrentScenario = useCallback(() => {
    startScenario(activeScenario.id, true);
  }, [activeScenario.id, startScenario]);

  // Open 3D Prop Clue/Puzzle Modal
  const openPropModal = useCallback((propId: string) => {
    setActivePropModalId(propId);
    setPropStepIndex(0);
    setPropFeedback(null);
    setDialogueOpen(false);
  }, []);

  // Trigger interaction with nearby 3D Prop OR nearby NPC
  const handleInteract = useCallback(() => {
    if (pausedRef.current || scenarioFinished) return;
    if (modalOpenRef.current) return;

    // Prioritize nearby unsolved 3D interactive clue/prop if within range, or any nearby prop
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
  }, [openPropModal, scenarioFinished]);

  const interactFnRef = useRef(handleInteract);
  interactFnRef.current = handleInteract;

  // Handle selecting an option inside a 3D Prop Puzzle Modal
  const handleSelectPropOption = (opt: {
    id: string;
    label: { ar: string; en: string };
    isCorrect: boolean;
    feedback: { ar: string; en: string };
  }) => {
    if (!activePropDef) return;
    setPropFeedback({
      isCorrect: opt.isCorrect,
      text: pick(opt.feedback, lang),
    });
  };

  const handleAdvancePropStep = () => {
    if (!activePropDef || !propFeedback) return;
    if (!propFeedback.isCorrect) {
      // Let the player try again without shaming
      setPropFeedback(null);
      return;
    }

    if (propStepIndex + 1 < activePropDef.puzzleSteps.length) {
      setPropStepIndex((i) => i + 1);
      setPropFeedback(null);
    } else {
      // Prop puzzle completed!
      const finishedId = activePropDef.id;
      setSolvedPropIds((prev) => (prev.includes(finishedId) ? prev : [...prev, finishedId]));
      setPropFeedback(null);
      setActivePropModalId(null);
    }
  };

  // Handle selecting a dialogue choice with an NPC
  const handleSelectChoice = (choice: ScenarioChoice) => {
    if (choiceLockRef.current || !currentNode || pendingFeedback) return;
    choiceLockRef.current = true;

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

  // Advance after reading immediate feedback
  const handleContinueAfterFeedback = () => {
    if (!pendingFeedback) return;
    const nextId = pendingFeedback.nextNodeId;
    setPendingFeedback(null);

    if (nextId === 'END') {
      setDialogueOpen(false);
      setScenarioFinished(true);
      setCompletedScenarios((prev) =>
        prev.includes(activeScenario.id) ? prev : [...prev, activeScenario.id]
      );
      if (decisionLog.some((d) => d.choice.quality === 'optimal') || decisionLog.length > 0) {
        setEarnedBadges((prev) =>
          prev.includes(activeScenario.id) ? prev : [...prev, activeScenario.id]
        );
      }
      return;
    }

    const nextNode = activeScenario.nodes[nextId];
    setCurrentNodeId(nextId);
    if (nextNode) {
      if (
        nextNode.targetNpc === activeSpeaker &&
        activeScenario.requirePropsSolvedBeforeNodeId !== nextId
      ) {
        setDialogueOpen(true);
      } else {
        setDialogueOpen(false);
        setActiveSpeaker(null);
      }
    }
  };

  // Keyboard Listeners (WASD / Arrows + E to interact + P to pause)
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

  // Main Three.js WebGL Initialization, Render Loop, ResizeObserver & Cleanup
  useEffect(() => {
    let mounted = true;
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;

    setSceneStatus('loading');
    setWebglErrorMsg('');

    let renderer: THREE.WebGLRenderer | null = null;
    let wardAssets: WardSceneAssets | null = null;
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

      wardAssets = buildHospitalWardScene(lowGraphics);
      wardAssetsRef.current = wardAssets;

      // Configure initial level theme and 3D props
      wardAssets.configureLevelEnvironment(
        activeScenario.environmentTheme || 'ward',
        activeScenario.interactiveProps || [],
        lowGraphics
      );

      wardAssets.camera.aspect = initW / initH;
      wardAssets.camera.updateProjectionMatrix();

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
      if (!renderer || !wardAssets || !viewport) return;
      const r = viewport.getBoundingClientRect();
      const w = Math.floor(viewport.clientWidth || r.width);
      const h = Math.floor(viewport.clientHeight || r.height);
      if (w < 60 || h < 60) return;
      const dprCap = lowGraphics ? 1.25 : 2.0;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
      renderer.setSize(w, h, false);
      wardAssets.camera.aspect = w / h;
      wardAssets.camera.updateProjectionMatrix();
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

      if (isTabHidden || !renderer || !wardAssets) return;

      const { scene, camera, playerRig, npcRigs, propRigs, obstacles, wardBounds } = wardAssets;

      let isMoving = false;

      if (!pausedRef.current && !modalOpenRef.current) {
        elapsedTime += dt;

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

          const nextX = Math.max(wardBounds.minX, Math.min(wardBounds.maxX, curX + worldDx * step));
          if (!collidesWithObstacles(nextX, curZ, obstacles)) {
            playerRig.root.position.x = nextX;
          }

          const nextZ = Math.max(wardBounds.minZ, Math.min(wardBounds.maxZ, curZ + worldDz * step));
          if (!collidesWithObstacles(playerRig.root.position.x, nextZ, obstacles)) {
            playerRig.root.position.z = nextZ;
          }

          const targetAngle = Math.atan2(worldDx, worldDz);
          playerRig.root.rotation.y = targetAngle;
        }
      } else {
        elapsedTime += dt * 0.5;
      }

      // Check proximity to NPCs
      const px = playerRig.root.position.x;
      const pz = playerRig.root.position.z;
      let closestRole: NpcRole | null = null;
      let closestDist = INTERACT_DISTANCE;

      (Object.keys(SIMULATOR_NPCS) as NpcRole[]).forEach((roleKey) => {
        const npcPos = SIMULATOR_NPCS[roleKey].position;
        const d = Math.hypot(px - npcPos[0], pz - npcPos[2]);
        if (d < closestDist) {
          closestDist = d;
          closestRole = roleKey;
        }
      });

      if (closestRole !== nearestNpcRef.current) {
        nearestNpcRef.current = closestRole;
        setNearestNpc(closestRole);
      }

      // Check proximity to 3D Interactive Clue/Puzzle Props
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

      // Update Procedural Character & Prop Animations
      updateCharacterAnimations(
        playerRig,
        npcRigs,
        propRigs,
        solvedPropIdsRef.current,
        targetNpcRef.current,
        closestRole,
        closestPropId,
        isMoving,
        elapsedTime
      );

      // Update Smooth Follow Camera with Orbit Yaw/Pitch
      const camDist = 6.2;
      const pitch = camPitchRef.current;
      const yaw = camYawRef.current;
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
      wardAssetsRef.current = null;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearTimeout(orientTimer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', onOrientationChange);
      vv?.removeEventListener('resize', updateSize);
      if (wardAssets) {
        wardAssets.disposeAll();
      }
      if (renderer) {
        renderer.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowGraphics, isAr]);

  // Touch / Mouse Camera Orbit Drag on the 3D Viewport
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

  // Mobile Virtual Joystick Handlers
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

  // Find next sequential experience for "Next Level" button
  const getNextExperience = (): PlayableExperience | null => {
    if (activeScenario.isCampaignLevel && activeScenario.campaignIndex) {
      const nextCampaign = CAMPAIGN_TEN_LEVELS.find(
        (l) => l.campaignIndex === activeScenario.campaignIndex! + 1
      );
      return nextCampaign || null;
    }
    const idx = MEDICAL_SIMULATOR_SCENARIOS.findIndex((s) => s.id === activeScenario.id);
    if (idx >= 0 && idx + 1 < MEDICAL_SIMULATOR_SCENARIOS.length) {
      return MEDICAL_SIMULATOR_SCENARIOS[idx + 1];
    }
    return null;
  };

  const completedCampaignCount = useMemo(
    () => CAMPAIGN_TEN_LEVELS.filter((l) => completedScenarios.includes(l.id)).length,
    [completedScenarios]
  );

  const completedOriginalCount = useMemo(
    () => MEDICAL_SIMULATOR_SCENARIOS.filter((s) => completedScenarios.includes(s.id)).length,
    [completedScenarios]
  );

  // Check if current dialogue node requires 3D prop clues to be solved first
  const nodeBlockedByUnsolvedProp =
    currentNode &&
    activeScenario.requirePropsSolvedBeforeNodeId === currentNode.id &&
    !allLevelPropsSolved;

  // Exit Game Handler
  const handleRequestExit = () => {
    if ((decisionLog.length > 0 || solvedPropIds.length > 0) && !scenarioFinished) {
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
                🏥 {isAr ? 'محاكي الحياة الطبية 3D' : 'Medical Life Simulator 3D'}
              </h1>
              <span className="ms-scenario-pill">
                {pick(activeScenario.title, lang)}
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
              {syncState === 'local' ? '💾' : syncState === 'saving' ? '☁️…' : syncState === 'error' ? '⚠️' : '☁️✓'}
            </span>

            <button
              type="button"
              className="ms-top-btn active"
              onClick={() => setShowScenarioDrawer((s) => !s)}
              title={isAr ? 'فتح قائمة المستويات الـ 10 والسيناريوهات الـ 5' : 'Open 10 Campaign Levels & 5 Original Scenarios'}
              aria-label={isAr ? 'قائمة المستويات والسيناريوهات' : 'Levels and scenarios'}
            >
              🗺️{' '}
              <span className="ms-btn-label">
                {isAr
                  ? `المستويات (${completedCampaignCount}/10) • السيناريوهات (${completedOriginalCount}/5)`
                  : `Levels (${completedCampaignCount}/10) • Scenarios (${completedOriginalCount}/5)`}
              </span>
              <span className="ms-btn-short">{completedCampaignCount}/10</span>
            </button>

            <button
              type="button"
              className={`ms-top-btn ${lowGraphics ? 'active' : ''}`}
              onClick={() => setLowGraphics((lg) => !lg)}
              aria-label={isAr ? 'تبديل الرسوميات المنخفضة' : 'Toggle low graphics'}
              title={
                isAr
                  ? 'وضع الرسوميات المنخفضة للأجهزة الضعيفة'
                  : 'Toggle Low Graphics Mode for weaker devices'
              }
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
                    ? isAr ? 'الخروج من ملء الشاشة' : 'Exit full screen'
                    : isAr ? 'ملء الشاشة' : 'Full screen'
                }
              >
                {gaming.nativeFullscreen ? '🗗' : '⛶'}{' '}
                <span className="ms-btn-label">
                  {gaming.nativeFullscreen
                    ? isAr ? 'تصغير الشاشة' : 'Exit Fullscreen'
                    : isAr ? 'ملء الشاشة' : 'Fullscreen'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Merge offer: progress saved on this device before signing in */}
        {mergeOffer && uid && (
          <div className="ms-sync-banner" role="status">
            <span>
              {isAr
                ? '💾 وجدنا تقدماً محفوظاً على هذا الجهاز قبل تسجيل الدخول. هل تريد دمجه مع حسابك؟ (لن يُحذف أي تقدم)'
                : '💾 We found progress saved on this device from before you signed in. Merge it into your account? (Nothing will be removed.)'}
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

        {/* Cloud save problem (progress stays safe on this device and retries automatically) */}
        {uid && syncState === 'error' && (
          <div className="ms-sync-banner error" role="alert">
            <span>
              {isAr
                ? '⚠️ تعذّر حفظ تقدمك في الحساب الآن. تقدمك محفوظ على هذا الجهاز وسنعيد المحاولة تلقائياً.'
                : '⚠️ Could not save to your account right now. Your progress is kept on this device and will retry automatically.'}
            </span>
            <button type="button" className="ms-cam-reset-btn" onClick={flushProgress}>
              {isAr ? 'إعادة المحاولة' : 'Retry now'}
            </button>
          </div>
        )}

        {/* Locked Level Notification Banner */}
        {lockedToastMsg && (
          <div className="ms-locked-toast" role="status">
            {lockedToastMsg}
          </div>
        )}

        {/* Progressive Level & Scenario Selector Drawer */}
        {showScenarioDrawer && (
          <section
            className="ms-scenario-drawer"
            aria-label={isAr ? 'اختيار المستويات والسيناريوهات' : 'Level & Scenario Selector'}
          >
            <div className="ms-drawer-head">
              <div className="ms-drawer-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={drawerTab === 'campaign10'}
                  className={`ms-tab-btn ${drawerTab === 'campaign10' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('campaign10')}
                >
                  🏆{' '}
                  {isAr
                    ? `حملة المستويات العشرة المتدرجة (${completedCampaignCount}/10)`
                    : `10 Progressive Campaign Levels (${completedCampaignCount}/10)`}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={drawerTab === 'original5'}
                  className={`ms-tab-btn ${drawerTab === 'original5' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('original5')}
                >
                  🩺{' '}
                  {isAr
                    ? `السيناريوهات الأساسية الخمسة (${completedOriginalCount}/5)`
                    : `5 Core Clinical Scenarios (${completedOriginalCount}/5)`}
                </button>
              </div>
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setShowScenarioDrawer(false)}
              >
                {isAr ? 'إغلاق ✕' : 'Close ✕'}
              </button>
            </div>

            {drawerTab === 'campaign10' ? (
              <>
                <p className="small muted" style={{ margin: 0, color: '#94a3b8' }}>
                  {isAr
                    ? `يُفتح المستوى ١ تلقائياً، ويتم فتح كل مستوى تالٍ تدريجياً فور إتمام المستوى الذي يسبقه. ${
                        uid
                          ? 'يُحفظ تقدمك في حسابك ويتزامن عبر أجهزتك.'
                          : 'يُحفظ تقدمك على هذا الجهاز فقط — سجّل الدخول لحفظه في حسابك.'
                      }`
                    : `Level 1 is unlocked by default; each subsequent level unlocks progressively after completing the previous level. ${
                        uid
                          ? 'Progress is saved to your account and syncs across your devices.'
                          : 'Progress is saved on this device only — sign in to save it to your account.'
                      }`}
                </p>
                <div className="ms-scenario-grid">
                  {CAMPAIGN_TEN_LEVELS.map((lvl: CampaignLevel) => {
                    const isDone = completedScenarios.includes(lvl.id);
                    const isUnlocked = isExperienceUnlocked(lvl.id, completedScenarios);
                    const isCurrent = lvl.id === activeScenario.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        className={`ms-scen-card ${isCurrent ? 'current' : ''} ${
                          isDone ? 'done' : ''
                        } ${!isUnlocked ? 'locked' : ''}`}
                        onClick={() => startScenario(lvl.id)}
                      >
                        <div className="ms-scen-card-top">
                          <span className="ms-scen-num">
                            {isUnlocked ? `${lvl.badgeIcon} L${lvl.campaignIndex}` : `🔒 L${lvl.campaignIndex}`}
                          </span>
                          <span className="ms-scen-badge">{pick(lvl.categoryBadge, lang)}</span>
                          {isDone ? (
                            <span className="ms-done-check">✓ {isAr ? 'مكتمل' : 'Completed'}</span>
                          ) : !isUnlocked ? (
                            <span className="ms-lock-tag">🔒 {isAr ? 'مغلق' : 'Locked'}</span>
                          ) : (
                            <span className="ms-open-tag">{isAr ? 'متاح' : 'Unlocked'}</span>
                          )}
                        </div>
                        <strong>{pick(lvl.title, lang)}</strong>
                        <small>{pick(lvl.subtitle, lang)}</small>
                        {!isUnlocked && (
                          <div className="ms-unlock-req-hint">
                            🔒 {pick(lvl.unlockRequirementText, lang)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="small muted" style={{ margin: 0, color: '#94a3b8' }}>
                  {isAr
                    ? 'السيناريوهات التدريبية الخمسة الأصلية متاحة دائماً للعب والمراجعة في أي وقت:'
                    : 'All 5 original clinical scenarios remain permanently unlocked for open practice:'}
                </p>
                <div className="ms-scenario-grid">
                  {MEDICAL_SIMULATOR_SCENARIOS.map((scen) => {
                    const isDone = completedScenarios.includes(scen.id);
                    const isCurrent = scen.id === activeScenario.id;
                    return (
                      <button
                        key={scen.id}
                        type="button"
                        className={`ms-scen-card ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}
                        onClick={() => startScenario(scen.id)}
                      >
                        <div className="ms-scen-card-top">
                          <span className="ms-scen-num">#{scen.number}</span>
                          <span className="ms-scen-badge">{pick(scen.categoryBadge, lang)}</span>
                          {isDone && (
                            <span className="ms-done-check">✓ {isAr ? 'مكتمل' : 'Completed'}</span>
                          )}
                        </div>
                        <strong>{pick(scen.title, lang)}</strong>
                        <small>{pick(scen.subtitle, lang)}</small>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* Current Objective & Interactive Clue Checklist Bar */}
        <div className="ms-objective-bar">
          <div className="ms-objective-text">
            <span className="ms-objective-label">
              🎯 {isAr ? 'المهمة الحالية:' : 'Current Objective:'}
            </span>
            <span>
              {scenarioFinished
                ? isAr
                  ? 'أكملت هذا المستوى بنجاح! راجع الملخص التعليمي أو انتقل للمستوى التالي.'
                  : 'Level completed! Review the clinical summary below or advance to the next level.'
                : currentNode
                ? pick(currentNode.objectiveHint, lang)
                : pick(activeScenario.briefing, lang)}
            </span>
          </div>

          <div className="ms-objective-chips">
            {/* Gentle Pacing Timer Chip (Level 1 ER) */}
            {activeScenario.gentleTimerSeconds && !scenarioFinished && (
              <div className="ms-timer-chip" title={isAr ? 'مؤقت تدريبي هادئ للاستجابة المنظمة' : 'Gentle training response timer'}>
                <span>⏱️</span>
                <span>
                  {isAr ? 'زمن الاستجابة التدريبي:' : 'Response Time:'} {gentleElapsedSec}s
                </span>
              </div>
            )}

            {/* 3D Interactive Prop Clue Status Chips */}
            {levelInteractiveProps.map((prop) => {
              const solved = solvedPropIds.includes(prop.id);
              return (
                <button
                  key={prop.id}
                  type="button"
                  className={`ms-prop-status-chip ${solved ? 'solved' : 'pending'}`}
                  onClick={() => openPropModal(prop.id)}
                  title={
                    isAr
                      ? 'اقترب من المجسم في الغرفة 3D أو اضغط هنا لفحص الدليل'
                      : 'Walk up to the 3D station in the room or click to inspect clue'
                  }
                >
                  <span>{prop.iconEmoji}</span>
                  <span>{pick(prop.stationLabel, lang)}</span>
                  <b>{solved ? '✓' : isAr ? 'افحص الدليل' : 'Inspect'}</b>
                </button>
              );
            })}

            {targetNpc && !scenarioFinished && (
              <div className="ms-target-chip">
                <span>{SIMULATOR_NPCS[targetNpc].avatarEmoji}</span>
                <span>
                  {isAr ? 'الشخصية:' : 'NPC:'}{' '}
                  <b>{pick(SIMULATOR_NPCS[targetNpc].stationLabel, lang)}</b>
                </span>
              </div>
            )}
          </div>
        </div>

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

          {/* Loading State Overlay */}
          {sceneStatus === 'loading' && (
            <div className="ms-status-overlay">
              <div className="ms-status-card">
                <div className="ms-spinner" aria-hidden="true">🏥</div>
                <h2>
                  {isAr
                    ? 'جارٍ بناء مشهد المستشفى ثلاثي الأبعاد (WebGL)...'
                    : 'Building 3D WebGL Hospital Ward...'}
                </h2>
                <p>
                  {isAr
                    ? 'يتم تجهيز الإضاءة والشخصيات الكرتونية ومحطات الألغاز ونظام التصادم.'
                    : 'Initializing 3D cartoon geometry, lighting, interactive clue stations, and collision bounds.'}
                </p>
              </div>
            </div>
          )}

          {/* Recoverable WebGL Error State Overlay */}
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

          {/* First-time Controls Hint Banner */}
          {showControlsHint && sceneStatus === 'ready' && !modalOpen && !scenarioFinished && !nearestPropDef && !nearestNpc && (
            <div className="ms-controls-hint-banner">
              <div>
                <strong>🎮 {isAr ? 'طريقة التحرك وحل الأدلة 3D:' : 'How to Explore, Solve 3D Clues & Interact:'}</strong>
                <span>
                  {isAr
                    ? 'تحرك بعصا التحكم (أو WASD/الأسهم) نحو الشخصيات أو نحو «منصات الأدلة والألغاز ثلاثية الأبعاد المضيئة»، واسحب الشاشة لتدوير الكاميرا، ثم اضغط زر «تفاعل / E» عند الاقتراب.'
                    : 'Use the virtual joystick (or WASD/Arrows) to walk to NPCs or glowing 3D Clue/Puzzle Pedestals. Drag to rotate the 3D camera, and press "Interact / E" when nearby.'}
                </span>
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

          {/* Proximity Floating Prompt when near a 3D Clue Prop OR an NPC */}
          {(nearestPropDef || nearestNpc) && !modalOpen && !scenarioFinished && !paused && (
            <div className="ms-proximity-prompt">
              {nearestPropDef && (!nearestNpc || !solvedPropIds.includes(nearestPropDef.id)) ? (
                <>
                  <span className="ms-prox-emoji">{nearestPropDef.iconEmoji}</span>
                  <div className="ms-prox-info">
                    <strong>{pick(nearestPropDef.name, lang)}</strong>
                    <small>
                      {solvedPropIds.includes(nearestPropDef.id)
                        ? isAr
                          ? '✓ تم فحص هذا الدليل (اضغط للمراجعة)'
                          : '✓ Clue Solved (Tap to review)'
                        : isAr
                        ? '✨ محطة دليل/لغز 3D — افحصها الآن!'
                        : '✨ 3D Clue / Puzzle Station — Inspect Now!'}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="ms-prox-btn prop"
                    onClick={() => openPropModal(nearestPropDef.id)}
                  >
                    🔍 {isAr ? 'افحص الدليل (E)' : 'Inspect Clue (E)'}
                  </button>
                </>
              ) : nearestNpc ? (
                <>
                  <span className="ms-prox-emoji">{SIMULATOR_NPCS[nearestNpc].avatarEmoji}</span>
                  <div className="ms-prox-info">
                    <strong>{pick(SIMULATOR_NPCS[nearestNpc].name, lang)}</strong>
                    <small>{pick(SIMULATOR_NPCS[nearestNpc].stationLabel, lang)}</small>
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
          {paused && !modalOpen && !scenarioFinished && (
            <div className="ms-status-overlay">
              <div className="ms-status-card">
                <h2>⏸ {isAr ? 'المحاكاة متوقفة مؤقتاً' : 'Simulation Paused'}</h2>
                <p>{pick(activeScenario.briefing, lang)}</p>
                <div className="ms-error-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setPaused(false)}
                  >
                    ▶ {isAr ? 'استئناف اللعب' : 'Resume Simulation'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={restartCurrentScenario}
                  >
                    🔄 {isAr ? 'إعادة المستوى من البداية' : 'Restart Level'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3D Interactive Clue / Puzzle Modal */}
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
                    aria-label={isAr ? 'إغلاق نافذة الدليل' : 'Close clue modal'}
                  >
                    ✕
                  </button>
                </div>

                {(() => {
                  const step = activePropDef.puzzleSteps[propStepIndex];
                  if (!step) return null;
                  return (
                    <div className="ms-dialogue-body">
                      <p className="ms-dialogue-speech">{pick(step.prompt, lang)}</p>

                      {!propFeedback ? (
                        <div className="ms-choices-list">
                          <div className="ms-choices-prompt">
                            {isAr
                              ? 'حلل الدليل واختر الإجراء الصحيح:'
                              : 'Analyze the clue and select the safe clinical answer:'}
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
                                ? '✅ تحليل صحيح للدليل!'
                                : '✅ Correct Clue Analysis!'
                              : isAr
                              ? '💡 راجع الدليل مرة أخرى بهدوء'
                              : '💡 Let’s Review That Clue Together'}
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
                                  ? 'الخطوة التالية في الدليل ←'
                                  : 'Next Puzzle Step →'
                                : isAr
                                ? 'اعتماد الدليل ومتابعة المهمة ✓'
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

          {/* Branching NPC Dialogue Overlay Modal */}
          {dialogueOpen && activeSpeaker && !activePropDef && (
            <div className="ms-dialogue-backdrop" role="dialog" aria-modal="true">
              <div className="ms-dialogue-modal">
                <div className="ms-dialogue-header">
                  <div className="ms-speaker-badge">
                    <span className="ms-speaker-avatar" aria-hidden="true">
                      {SIMULATOR_NPCS[activeSpeaker].avatarEmoji}
                    </span>
                    <div>
                      <strong>{pick(SIMULATOR_NPCS[activeSpeaker].name, lang)}</strong>
                      <small>{pick(SIMULATOR_NPCS[activeSpeaker].title, lang)}</small>
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

                {/* If this step requires solving the 3D interactive prop clues first, prompt the player */}
                {currentNode && currentNode.targetNpc === activeSpeaker && nodeBlockedByUnsolvedProp ? (
                  <div className="ms-dialogue-body">
                    <div className="ms-redirect-hint">
                      <strong>
                        🔍{' '}
                        {isAr
                          ? 'مطلوب فحص الدليل/اللغز ثلاثي الأبعاد أولاً قبل إتمام هذه الخطوة!'
                          : 'Inspect the 3D Clue / Puzzle Station First!'}
                      </strong>
                      <p>
                        {isAr
                          ? 'يرجى التوجه إلى محطة الدليل المضيئة في الغرفة ثلاثية الأبعاد وإتمام فحص الأدلة التالية قبل تسليم التقرير:'
                          : 'Please walk to the glowing 3D station in the room (or click below) to complete the required clue inspection before finalizing this step:'}
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
                      {isAr ? 'العودة للغرفة ثلاثية الأبعاد' : 'Back to 3D Room'}
                    </button>
                  </div>
                ) : currentNode && currentNode.targetNpc === activeSpeaker ? (
                  <div className="ms-dialogue-body">
                    <p className="ms-dialogue-speech">{pick(currentNode.dialogue, lang)}</p>

                    {!pendingFeedback ? (
                      <div className="ms-choices-list">
                        <div className="ms-choices-prompt">
                          {isAr ? 'اختر القرار السريري الأنسب:' : 'Select the safest clinical decision:'}
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
                              ? '✅ قرار سريري آمن وسليم'
                              : '✅ Optimal Safe Clinical Decision'
                            : pendingFeedback.choice.quality === 'caution'
                            ? isAr
                              ? '⚠️ تنبيه سريري يحتاج لمراجعة'
                              : '⚠️ Clinical Caution — Needs Improvement'
                            : isAr
                            ? '🚨 ممارسة غير آمنة — انتبه!'
                            : '🚨 Unsafe Clinical Action — Review Carefully'}
                        </div>
                        <p className="ms-feedback-text">
                          {pick(pendingFeedback.choice.immediateFeedback, lang)}
                        </p>
                        <p className="ms-feedback-rationale">
                          <strong>{isAr ? 'السبب العلمي:' : 'Clinical Rationale:'}</strong>{' '}
                          {pick(pendingFeedback.choice.rationale, lang)}
                        </p>
                        <button
                          type="button"
                          className="btn ms-continue-btn"
                          onClick={handleContinueAfterFeedback}
                        >
                          {pendingFeedback.nextNodeId === 'END'
                            ? isAr
                              ? 'عرض النتيجة والملخص التعليمي ←'
                              : 'View Level Summary & Takeaway →'
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
                      {pick(SIMULATOR_NPCS[activeSpeaker].defaultGreeting, lang)}
                    </p>
                    {currentNode && (
                      <div className="ms-redirect-hint">
                        <strong>🎯 {isAr ? 'توجيه المهمة الحالية:' : 'Current Step Guidance:'}</strong>
                        <p>{pick(currentNode.objectiveHint, lang)}</p>
                        <p className="small">
                          {isAr ? 'توجه في الغرفة ثلاثية الأبعاد إلى: ' : 'Walk in the 3D ward to: '}
                          <b>{pick(SIMULATOR_NPCS[currentNode.targetNpc].name, lang)}</b> (
                          {pick(SIMULATOR_NPCS[currentNode.targetNpc].stationLabel, lang)})
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

          {/* End-of-Level Educational Summary & Progressive Unlock Overlay */}
          {scenarioFinished && (
            <div className="ms-dialogue-backdrop" role="dialog" aria-modal="true">
              <div className="ms-dialogue-modal ms-summary-modal">
                <div className="ms-summary-header">
                  <span className="ms-summary-icon">{activeScenario.badgeIcon}</span>
                  <div>
                    <span className="badge approved">
                      {isAr ? 'اكتمل المستوى التعليمي بنجاح' : 'Educational Level Completed'}
                    </span>
                    <h2>{pick(activeScenario.title, lang)}</h2>
                  </div>
                </div>

                <div className="ms-summary-content">
                  {/* Show Clues Collected in 3D */}
                  {levelInteractiveProps.length > 0 && (
                    <div className="ms-summary-section safe-action">
                      <strong>
                        🔍 {isAr ? 'الأدلة والألغاز ثلاثية الأبعاد التي تم حلها:' : '3D Clues & Puzzles Solved:'}
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
                      🛡️ {isAr ? 'الممارسة الآمنة التي تم تطبيقها:' : 'Safe Clinical Action Demonstrated:'}
                    </strong>
                    <p>{pick(activeScenario.safeActionDemonstrated, lang)}</p>
                  </div>

                  <div className="ms-summary-section takeaway">
                    <strong>
                      💡 {isAr ? 'الرسالة التثقيفية الأساسية:' : 'Key Educational Takeaway:'}
                    </strong>
                    <p>{pick(activeScenario.educationalTakeaway, lang)}</p>
                  </div>

                  <div className="ms-summary-section escalation">
                    <strong>
                      🚑 {isAr ? 'إرشادات التصعيد الطبي والطوارئ:' : 'Escalation & Safety Guidance:'}
                    </strong>
                    <p>{pick(activeScenario.escalationGuidance, lang)}</p>
                  </div>

                  {/* Review of Choices Made */}
                  <div className="ms-decisions-review">
                    <strong>
                      📋 {isAr ? 'مراجعة قراراتك في هذا المستوى:' : 'Review of Your Decisions & Why They Mattered:'}
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
                              <b>{pick(SIMULATOR_NPCS[item.speaker].name, lang)}:</b>
                            </span>
                          </div>
                          <div className="ms-decision-choice">{pick(item.choice.label, lang)}</div>
                          <div className="ms-decision-why">{pick(item.choice.rationale, lang)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Verified Clinical Sources */}
                  <div className="ms-sources-box">
                    <strong>📚 {isAr ? 'المصادر الطبية المعتمدة:' : 'Evidence-Based Clinical Sources:'}</strong>
                    <ul>
                      {activeScenario.sources.map((src, i) => (
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
                    onClick={restartCurrentScenario}
                  >
                    🔄 {isAr ? 'إعادة لعب هذا المستوى' : 'Replay This Level'}
                  </button>

                  {(() => {
                    const nextExp = getNextExperience();
                    if (nextExp) {
                      return (
                        <button
                          type="button"
                          className="btn"
                          style={{ background: '#0284c7', borderColor: '#0284c7' }}
                          onClick={() => startScenario(nextExp.id, true)}
                        >
                          🔓{' '}
                          {isAr
                            ? `الانتقال للمستوى التالي: ${pick(nextExp.title, lang)} ←`
                            : `Play Unlocked Next Level: ${pick(nextExp.title, lang)} →`}
                        </button>
                      );
                    }
                    return (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setShowScenarioDrawer(true)}
                      >
                        🗺️ {isAr ? 'استعراض خريطة المستويات والسيناريوهات' : 'Open Level & Scenario Map'}
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
                title={isAr ? 'إعادة ضبط زاوية الكاميرا' : 'Reset 3D Camera Angle'}
              >
                🎥 {isAr ? 'الكاميرا' : 'Reset Cam'}
              </button>

              <button
                type="button"
                className={`ms-interact-btn ${nearestNpc || nearestPropDef ? 'ready' : ''}`}
                disabled={(!nearestNpc && !nearestPropDef) || modalOpen || scenarioFinished}
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
                    : nearestNpc
                    ? isAr
                      ? `تحدّث (${SIMULATOR_NPCS[nearestNpc].avatarEmoji})`
                      : `Interact (${SIMULATOR_NPCS[nearestNpc].avatarEmoji})`
                    : isAr
                    ? 'اقترب للتفاعل'
                    : 'Walk Near Station'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Session & Campaign Progress Footer */}
        <section className="ms-session-bar">
          <div className="ms-badges-row">
            <strong>
              🏅{' '}
              {isAr
                ? `أوسمة الحملة التعليمية (${completedCampaignCount}/10 مستويات + ${completedOriginalCount}/5 سيناريوهات):`
                : `Educational Badges (${completedCampaignCount}/10 Campaign Levels + ${completedOriginalCount}/5 Core Scenarios):`}
            </strong>
            {CAMPAIGN_TEN_LEVELS.map((lvl) => {
              const earned = earnedBadges.includes(lvl.id) || completedScenarios.includes(lvl.id);
              return (
                <span
                  key={lvl.id}
                  className={`ms-badge-chip ${earned ? 'earned' : ''}`}
                  title={pick(lvl.title, lang)}
                >
                  <span>{lvl.badgeIcon}</span>
                  <span>L{lvl.campaignIndex}: {pick(lvl.badgeTitle, lang)}</span>
                </span>
              );
            })}
          </div>

          <p className="ms-medical-disclaimer">
            {isAr
              ? `⚠️ تنبيه طبي وتعليمي: هذه المحاكاة ثلاثية الأبعاد تستخدم حالات خيالية للتدريب والتوعية فقط، ولا تقدم تشخيصاً طبياً أو وصفات علاجية أو جرعات دوائية، ولا تغني عن مراجعة الطبيب أو الصيدلي المؤهل، ولا تُعد شهادة كفاءة سريرية. ${uid ? 'يُحفظ تقدم المراحل في حسابك' : 'يُحفظ تقدم المراحل محلياً على هذا الجهاز'} دون أي بيانات صحية.`
              : `⚠️ Educational Medical Notice: This 3D simulation uses fictional cases for educational stewardship training only. It does not diagnose, prescribe, provide dosages, certify clinical competence, or replace a licensed clinician. Level progression is ${uid ? 'saved to your account' : 'stored locally on this device'} with zero personal health data.`}
          </p>
        </section>

        {/* Exit Confirmation Modal */}
        {confirmExit && (
          <div className="bh-confirm" role="alertdialog" aria-modal="true">
            <div className="bh-confirm-card">
              <h2 className="bh-confirm-title">
                {isAr ? 'الخروج من المحاكاة؟' : 'Exit the 3D Simulator?'}
              </h2>
              <p>
                {isAr
                  ? 'لديك مستوى قيد التقدم حالياً. المستويات التي أكملتها محفوظة، ولكن التقدم داخل المستوى الحالي سيُعاد من بدايته عند العودة.'
                  : 'You have an active level in progress. Completed levels remain saved, but current step progress will reset if you exit now.'}
              </p>
              <button
                type="button"
                className="bh-btn bh-btn-primary"
                onClick={() => setConfirmExit(false)}
              >
                {isAr ? 'متابعة المحاكاة' : 'Continue Simulation'}
              </button>
              <button
                type="button"
                className="bh-btn bh-btn-danger"
                onClick={handleConfirmExit}
              >
                {isAr ? 'الخروج من اللعبة' : 'Exit Game'}
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
// Progress gate: loads the signed-in user's cloud progress BEFORE the game mounts, so levels never
// appear locked while cloud data is still loading. Guests use the existing local-only progress.
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

export default function MedicalSimulator() {
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

    // Guest (or Firebase not configured): existing local-only progress, kept separate from any account.
    if (!uid) {
      setGate({
        status: 'ready',
        uid: null,
        initial: normalizeProgress(loadSimulatorProgress()),
        remote: null,
        localOffer: null,
      });
      return;
    }

    let cancelled = false;
    setGate({ status: 'loading' });
    const cache = readUidCache(uid);

    withTimeout(readCloudProgress(uid), CLOUD_LOAD_TIMEOUT_MS)
      .then((remote) => {
        if (cancelled) return;
        // Cloud is the source of truth; the per-account cache only ADDS progress that never reached the cloud.
        let initial = mergeProgress(remote ?? emptyProgress(), cache ? { ...cache, lastPlayedId: undefined } : emptyProgress());
        if (!initial.lastPlayedId && cache?.lastPlayedId) {
          initial = { ...initial, lastPlayedId: cache.lastPlayedId };
        }
        // Progress saved on this device before sign-in (legacy/guest key): offer a safe merge, once.
        const legacy = normalizeProgress(loadSimulatorProgress());
        const localOffer = !isLocalMergeResolved(uid) && hasExtraIds(legacy, initial) ? legacy : null;
        setGate({ status: 'ready', uid, initial, remote, localOffer });
      })
      .catch(() => {
        if (!cancelled) setGate({ status: 'error', uid, cache });
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, uid, attempt]);

  if (gate.status === 'ready') {
    return (
      <MedicalSimulatorGame
        key={gate.uid ?? 'guest'}
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
            <div className="ms-spinner" aria-hidden="true">🏥</div>
            <h2>{isAr ? 'جارٍ تحميل تقدمك...' : 'Loading your progress...'}</h2>
          </div>
        ) : (
          <div className="ms-gate-card" role="alert">
            <h2>{isAr ? 'تعذّر تحميل تقدمك من الحساب' : "Couldn't load your saved progress"}</h2>
            <p>
              {isAr
                ? 'تأكد من اتصالك بالإنترنت ثم أعد المحاولة. يمكنك أيضاً المتابعة بالنسخة المحفوظة على هذا الجهاز؛ لن يُحذف أي تقدم وسيُدمج مع حسابك عند عودة الاتصال.'
                : 'Check your connection and try again. You can also continue with the copy saved on this device; no progress will be lost and it will merge into your account once you are back online.'}
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
