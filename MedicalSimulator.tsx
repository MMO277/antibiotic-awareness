import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useLang } from './i18n';
import { pick } from './types';
import { useGamingMode } from './useGamingMode';
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
  saveSimulatorProgress,
} from './medicalSimulatorLevels';
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

export default function MedicalSimulator() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const navigate = useNavigate();

  // References for DOM and 3D state
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wardAssetsRef = useRef<WardSceneAssets | null>(null);

  // Load saved progress from localStorage safely (non-clinical level completion & badges)
  const initialSaved = useMemo(() => loadSimulatorProgress(), []);

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

  // Persist progress to localStorage whenever completedScenarios, earnedBadges, or activeScenarioId changes
  useEffect(() => {
    saveSimulatorProgress({
      version: 1,
      completedIds: completedScenarios,
      earnedBadgeIds: earnedBadges,
      lastPlayedId: activeScenarioId,
    });
  }, [completedScenarios, earnedBadges, activeScenarioId]);

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

    const updateSize = () => {
      if (!renderer || !wardAssets || !viewport) return;
      const r = viewport.getBoundingClientRect();
      const w = Math.max(280, Math.floor(r.width));
      const h = Math.max(240, Math.floor(r.height));
      const dprCap = lowGraphics ? 1.25 : 2.0;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
      renderer.setSize(w, h, false);
      wardAssets.camera.aspect = w / h;
      wardAssets.camera.updateProjectionMatrix();
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateSize());
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener('resize', updateSize);
    }

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
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateSize);
      }
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
    const dx = e.clientX - orbitLastPosRef.current.x;
    const dy = e.clientY - orbitLastPosRef.current.y;
    orbitLastPosRef.current = { x: e.clientX, y: e.clientY };

    camYawRef.current -= dx * 0.0075;
    camPitchRef.current = Math.max(0.28, Math.min(1.05, camPitchRef.current + dy * 0.0055));
  };

  const handleViewportPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (orbitPointerIdRef.current === e.pointerId) {
      orbitPointerIdRef.current = null;
    }
  };

  // Mobile Virtual Joystick Handlers
  const updateJoystickFromPoint = (clientX: number, clientY: number) => {
    const base = joyBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;

    let dx = clientX - cx;
    let dy = clientY - cy;
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
      gaming.exit();
      navigate('/games');
    }
  };

  const handleConfirmExit = () => {
    setConfirmExit(false);
    gaming.exit();
    navigate('/games');
  };

  return (
    <main className="wrap ms-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div
        ref={wrapperRef}
        dir={isAr ? 'rtl' : 'ltr'}
        className={`card ms-wrapper ${gaming.active ? 'bh-immersive ms-immersive' : ''}`}
      >
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
            <button
              type="button"
              className="ms-top-btn active"
              onClick={() => setShowScenarioDrawer((s) => !s)}
              title={isAr ? 'فتح قائمة المستويات الـ 10 والسيناريوهات الـ 5' : 'Open 10 Campaign Levels & 5 Original Scenarios'}
            >
              🗺️{' '}
              {isAr
                ? `المستويات (${completedCampaignCount}/10) • السيناريوهات (${completedOriginalCount}/5)`
                : `Levels (${completedCampaignCount}/10) • Scenarios (${completedOriginalCount}/5)`}
            </button>

            <button
              type="button"
              className={`ms-top-btn ${lowGraphics ? 'active' : ''}`}
              onClick={() => setLowGraphics((lg) => !lg)}
              title={
                isAr
                  ? 'وضع الرسوميات المنخفضة للأجهزة الضعيفة'
                  : 'Toggle Low Graphics Mode for weaker devices'
              }
            >
              ⚡{' '}
              {isAr
                ? lowGraphics
                  ? 'رسوميات منخفضة: مفعّل'
                  : 'رسوميات قياسية'
                : lowGraphics
                ? 'Low Graphics: ON'
                : 'Standard 3D'}
            </button>

            <button
              type="button"
              className="ms-top-btn"
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? (isAr ? '▶ استئناف' : '▶ Resume') : isAr ? '⏸ إيقاف مؤقت' : '⏸ Pause'}
            </button>

            <button
              type="button"
              className="ms-top-btn"
              onClick={() => (gaming.active ? gaming.exit() : gaming.enter())}
            >
              {gaming.active
                ? isAr
                  ? '🗗 تصغير الشاشة'
                  : '🗗 Exit Fullscreen'
                : isAr
                ? '⛶ ملء الشاشة'
                : '⛶ Fullscreen'}
            </button>
          </div>
        </header>

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
                    ? 'يُفتح المستوى ١ تلقائياً، ويتم فتح كل مستوى تالٍ تدريجياً فور إتمام المستوى الذي يسبقه. يُحفظ تقدمك محلياً على جهازك بأمان.'
                    : 'Level 1 is unlocked by default; each subsequent level unlocks progressively after completing the previous level. Progress is saved locally.'}
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
          {showControlsHint && sceneStatus === 'ready' && !modalOpen && !scenarioFinished && (
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

          {/* Mobile & Touch HUD Controls */}
          <div className="ms-hud-controls">
            <div className="ms-joystick-zone">
              <div
                ref={joyBaseRef}
                className="ms-joystick-base"
                onTouchStart={(e) => {
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

            <div className="ms-action-zone">
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
              ? '⚠️ تنبيه طبي وتعليمي: هذه المحاكاة ثلاثية الأبعاد تستخدم حالات خيالية للتدريب والتوعية فقط، ولا تقدم تشخيصاً طبياً أو وصفات علاجية أو جرعات دوائية، ولا تغني عن مراجعة الطبيب أو الصيدلي المؤهل، ولا تُعد شهادة كفاءة سريرية. يُحفظ تقدم المراحل محلياً فقط دون أي بيانات صحية.'
              : '⚠️ Educational Medical Notice: This 3D simulation uses fictional cases for educational stewardship training only. It does not diagnose, prescribe, provide dosages, certify clinical competence, or replace a licensed clinician. Level progression is stored locally with zero personal health data.'}
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
