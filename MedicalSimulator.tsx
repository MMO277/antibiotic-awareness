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

const INTERACT_DISTANCE = 2.45;
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

  // Configurable graphics & UI states
  const [lowGraphics, setLowGraphics] = useState<boolean>(detectDefaultLowGraphics);
  const [sceneStatus, setSceneStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [webglErrorMsg, setWebglErrorMsg] = useState<string>('');
  const [paused, setPaused] = useState<boolean>(false);
  const [showControlsHint, setShowControlsHint] = useState<boolean>(true);
  const [showScenarioDrawer, setShowScenarioDrawer] = useState<boolean>(false);
  const [confirmExit, setConfirmExit] = useState<boolean>(false);

  // Active Scenario & Branching Dialogue State Machine (in-memory session only — nothing persisted to Firebase)
  const [activeScenarioId, setActiveScenarioId] = useState<string>(MEDICAL_SIMULATOR_SCENARIOS[0].id);
  const [currentNodeId, setCurrentNodeId] = useState<string>(MEDICAL_SIMULATOR_SCENARIOS[0].initialNodeId);
  const [dialogueOpen, setDialogueOpen] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<NpcRole | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<{
    choice: ScenarioChoice;
    nextNodeId: string;
  } | null>(null);
  const [scenarioFinished, setScenarioFinished] = useState<boolean>(false);
  const [decisionLog, setDecisionLog] = useState<DecisionLogItem[]>([]);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  // Nearby NPC state for HUD prompt & Interact button
  const [nearestNpc, setNearestNpc] = useState<NpcRole | null>(null);
  const nearestNpcRef = useRef<NpcRole | null>(null);

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

  // Fullscreen / Immersive Gaming Mode hook (reuses existing safe utility)
  const gaming = useGamingMode(wrapperRef, () => {
    setPaused(true);
  });

  const activeScenario: MedicalScenario = useMemo(() => {
    return (
      MEDICAL_SIMULATOR_SCENARIOS.find((s) => s.id === activeScenarioId) ||
      MEDICAL_SIMULATOR_SCENARIOS[0]
    );
  }, [activeScenarioId]);

  const currentNode = useMemo(() => {
    if (scenarioFinished) return null;
    return activeScenario.nodes[currentNodeId] || null;
  }, [activeScenario, currentNodeId, scenarioFinished]);

  const targetNpc: NpcRole | null = currentNode ? currentNode.targetNpc : null;
  const targetNpcRef = useRef<NpcRole | null>(targetNpc);
  targetNpcRef.current = targetNpc;

  const pausedRef = useRef<boolean>(paused);
  pausedRef.current = paused;

  const dialogueOpenRef = useRef<boolean>(dialogueOpen);
  dialogueOpenRef.current = dialogueOpen;

  // Start or switch to a scenario cleanly
  const startScenario = useCallback((scenarioId: string) => {
    const found =
      MEDICAL_SIMULATOR_SCENARIOS.find((s) => s.id === scenarioId) ||
      MEDICAL_SIMULATOR_SCENARIOS[0];
    choiceLockRef.current = false;
    setActiveScenarioId(found.id);
    setCurrentNodeId(found.initialNodeId);
    setPendingFeedback(null);
    setScenarioFinished(false);
    setDecisionLog([]);
    setDialogueOpen(false);
    setActiveSpeaker(null);
    setShowScenarioDrawer(false);
  }, []);

  // Restart current scenario
  const restartCurrentScenario = useCallback(() => {
    startScenario(activeScenario.id);
  }, [activeScenario.id, startScenario]);

  // Trigger interaction with nearby NPC (or open current dialogue if matching)
  const handleInteract = useCallback(() => {
    if (pausedRef.current || scenarioFinished) return;
    if (dialogueOpenRef.current) return;

    const npc = nearestNpcRef.current;
    if (!npc) return;

    setActiveSpeaker(npc);
    setDialogueOpen(true);
  }, [scenarioFinished]);

  // Keep a ref to handleInteract for keyboard 'E' listener
  const interactFnRef = useRef(handleInteract);
  interactFnRef.current = handleInteract;

  // Handle selecting a dialogue choice
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
      // Award scenario badge if at least one optimal choice was made
      const allOptimal = decisionLog.every((d) => d.choice.quality === 'optimal');
      if (allOptimal || decisionLog.some((d) => d.choice.quality === 'optimal')) {
        setEarnedBadges((prev) =>
          prev.includes(activeScenario.id) ? prev : [...prev, activeScenario.id]
        );
      }
      return;
    }

    const nextNode = activeScenario.nodes[nextId];
    setCurrentNodeId(nextId);
    if (nextNode) {
      // If the next node is with the same NPC, keep dialogue open; otherwise close so player walks to the next NPC in 3D!
      if (nextNode.targetNpc === activeSpeaker) {
        setDialogueOpen(true);
      } else {
        setDialogueOpen(false);
        setActiveSpeaker(null);
      }
    }
  };

  // Keyboard Listeners (WASD / Arrows + E to interact + Esc/P to pause)
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
        if (!dialogueOpenRef.current) {
          e.preventDefault();
        }
      } else if (code === 'KeyE') {
        if (!dialogueOpenRef.current) {
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

    // Handle WebGL Context Loss & Restoration Gracefully
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

    // Responsive Canvas Resizing via ResizeObserver
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

    // Pause / Throttle when browser tab is hidden
    const onVisibilityChange = () => {
      isTabHidden = document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Delta-time Animation Loop
    let lastTime = performance.now();
    let elapsedTime = 0;

    const animate = (now: number) => {
      if (!mounted) return;
      rafId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isTabHidden || !renderer || !wardAssets) return;

      const { scene, camera, playerRig, npcRigs, obstacles, wardBounds } = wardAssets;

      let isMoving = false;

      if (!pausedRef.current && !dialogueOpenRef.current) {
        elapsedTime += dt;

        // Read Keyboard + Virtual Joystick inputs
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

          // Transform movement relative to camera yaw angle
          const yaw = camYawRef.current;
          const cosY = Math.cos(yaw);
          const sinY = Math.sin(yaw);

          const worldDx = normX * cosY + normZ * sinY;
          const worldDz = -normX * sinY + normZ * cosY;

          const step = PLAYER_SPEED * dt;
          const curX = playerRig.root.position.x;
          const curZ = playerRig.root.position.z;

          // Sliding collision check along X then Z
          const nextX = Math.max(wardBounds.minX, Math.min(wardBounds.maxX, curX + worldDx * step));
          if (!collidesWithObstacles(nextX, curZ, obstacles)) {
            playerRig.root.position.x = nextX;
          }

          const nextZ = Math.max(wardBounds.minZ, Math.min(wardBounds.maxZ, curZ + worldDz * step));
          if (!collidesWithObstacles(playerRig.root.position.x, nextZ, obstacles)) {
            playerRig.root.position.z = nextZ;
          }

          // Smoothly rotate avatar toward movement heading
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

      // Update Procedural Character Animations
      updateCharacterAnimations(
        playerRig,
        npcRigs,
        targetNpcRef.current,
        closestRole,
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

  // Exit Game Handler
  const handleRequestExit = () => {
    if (decisionLog.length > 0 && !scenarioFinished) {
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
              className="ms-top-btn"
              onClick={() => setShowScenarioDrawer((s) => !s)}
              title={isAr ? 'تغيير السيناريو التدريبي' : 'Switch Training Scenario'}
            >
              📋 {isAr ? `السيناريوهات (${completedScenarios.length}/5)` : `Scenarios (${completedScenarios.length}/5)`}
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
              ⚡ {isAr ? (lowGraphics ? 'رسوميات منخفضة: مفعّل' : 'رسوميات قياسية') : lowGraphics ? 'Low Graphics: ON' : 'Standard 3D'}
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

        {/* Scenario Selector Drawer */}
        {showScenarioDrawer && (
          <section className="ms-scenario-drawer" aria-label={isAr ? 'قائمة السيناريوهات الخمسة' : 'Five Clinical Scenarios'}>
            <div className="ms-drawer-head">
              <strong>
                {isAr
                  ? 'اختر أحد السيناريوهات السريرية الخمسة:'
                  : 'Select one of the 5 Clinical Stewardship Scenarios:'}
              </strong>
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setShowScenarioDrawer(false)}
              >
                {isAr ? 'إغلاق ✕' : 'Close ✕'}
              </button>
            </div>
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
                      {isDone && <span className="ms-done-check">✓ {isAr ? 'مكتمل' : 'Completed'}</span>}
                    </div>
                    <strong>{pick(scen.title, lang)}</strong>
                    <small>{pick(scen.subtitle, lang)}</small>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Current Objective Banner */}
        <div className="ms-objective-bar">
          <div className="ms-objective-text">
            <span className="ms-objective-label">
              🎯 {isAr ? 'المهمة الحالية:' : 'Current Objective:'}
            </span>
            <span>
              {scenarioFinished
                ? isAr
                  ? 'أكملت هذا السيناريو بنجاح! راجع الملخص التعليمي أو اختر سيناريو آخر.'
                  : 'Scenario completed! Review the clinical summary below or choose another scenario.'
                : currentNode
                ? pick(currentNode.objectiveHint, lang)
                : pick(activeScenario.briefing, lang)}
            </span>
          </div>

          {targetNpc && !scenarioFinished && (
            <div className="ms-target-chip">
              <span>{SIMULATOR_NPCS[targetNpc].avatarEmoji}</span>
              <span>
                {isAr ? 'الشخصية المستهدفة:' : 'Target NPC:'}{' '}
                <b>{pick(SIMULATOR_NPCS[targetNpc].stationLabel, lang)}</b>
              </span>
            </div>
          )}
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
                    ? 'يتم تجهيز الإضاءة والشخصيات الكرتونية ونظام التصادم.'
                    : 'Initializing 3D cartoon geometry, lighting, and collision bounds.'}
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
          {showControlsHint && sceneStatus === 'ready' && !dialogueOpen && !scenarioFinished && (
            <div className="ms-controls-hint-banner">
              <div>
                <strong>🎮 {isAr ? 'طريقة التحرك والتفاعل:' : 'How to Move & Interact:'}</strong>
                <span>
                  {isAr
                    ? 'استخدم عصا التحكم الافتراضية (أو مفاتيح WASD / الأسهم) للتحرك نحو الممرضة أو المريض أو الطبيب أو الصيدلي، واسحب الشاشة لتدوير الكاميرا، ثم اضغط زر «تحدّث / E» عند الاقتراب.'
                    : 'Use the virtual joystick (or WASD / Arrow keys) to walk up to the Nurse, Patient, Doctor, or Pharmacist. Drag the screen to rotate the 3D camera, and press "Interact / E" when nearby.'}
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

          {/* Proximity Floating Prompt when near an NPC */}
          {nearestNpc && !dialogueOpen && !scenarioFinished && !paused && (
            <div className="ms-proximity-prompt">
              <span className="ms-prox-emoji">{SIMULATOR_NPCS[nearestNpc].avatarEmoji}</span>
              <div className="ms-prox-info">
                <strong>{pick(SIMULATOR_NPCS[nearestNpc].name, lang)}</strong>
                <small>{pick(SIMULATOR_NPCS[nearestNpc].stationLabel, lang)}</small>
              </div>
              <button
                type="button"
                className="ms-prox-btn"
                onClick={handleInteract}
              >
                💬 {isAr ? 'تحدّث الآن (E)' : 'Talk / Interact (E)'}
              </button>
            </div>
          )}

          {/* Pause Overlay */}
          {paused && !dialogueOpen && !scenarioFinished && (
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
                    🔄 {isAr ? 'إعادة السيناريو من البداية' : 'Restart Scenario'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Branching Dialogue Overlay Modal */}
          {dialogueOpen && activeSpeaker && (
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

                {/* Check if the approached NPC is the active target for the current scenario node */}
                {currentNode && currentNode.targetNpc === activeSpeaker ? (
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
                              : 'View Scenario Summary & Takeaway →'
                            : isAr
                            ? 'متابعة الخطوة التالية ←'
                            : 'Continue to Next Step →'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Player talked to an NPC who isn't the current step's target */
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

          {/* End-of-Scenario Educational Summary & Replay Overlay */}
          {scenarioFinished && (
            <div className="ms-dialogue-backdrop" role="dialog" aria-modal="true">
              <div className="ms-dialogue-modal ms-summary-modal">
                <div className="ms-summary-header">
                  <span className="ms-summary-icon">{activeScenario.badgeIcon}</span>
                  <div>
                    <span className="badge approved">
                      {isAr ? 'اكتمل السيناريو التعليمي' : 'Educational Scenario Completed'}
                    </span>
                    <h2>{pick(activeScenario.title, lang)}</h2>
                  </div>
                </div>

                <div className="ms-summary-content">
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
                      📋 {isAr ? 'مراجعة قراراتك في هذا السيناريو:' : 'Review of Your Decisions & Why They Mattered:'}
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
                    className="btn"
                    onClick={restartCurrentScenario}
                  >
                    🔄 {isAr ? 'إعادة لعب هذا السيناريو' : 'Replay This Scenario'}
                  </button>

                  {activeScenario.number < MEDICAL_SIMULATOR_SCENARIOS.length ? (
                    <button
                      type="button"
                      className="btn"
                      style={{ background: '#0284c7', borderColor: '#0284c7' }}
                      onClick={() => {
                        const nextScen =
                          MEDICAL_SIMULATOR_SCENARIOS[activeScenario.number] ||
                          MEDICAL_SIMULATOR_SCENARIOS[0];
                        startScenario(nextScen.id);
                      }}
                    >
                      {isAr
                        ? `الانتقال للسيناريو التالي (#${activeScenario.number + 1}) ←`
                        : `Next Scenario (#${activeScenario.number + 1}) →`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setShowScenarioDrawer(true)}
                    >
                      📋 {isAr ? 'استعراض كل السيناريوهات' : 'Browse All Scenarios'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mobile & Touch HUD Controls (Virtual Joystick + Directional Pad + Large Interact Button) */}
          <div className="ms-hud-controls">
            {/* Virtual Touch Joystick */}
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

            {/* Right-hand Action Cluster: Camera Reset + Prominent Interact Button */}
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
                className={`ms-interact-btn ${nearestNpc ? 'ready' : ''}`}
                disabled={!nearestNpc || dialogueOpen || scenarioFinished}
                onClick={handleInteract}
              >
                <span className="ms-interact-icon">💬</span>
                <span>
                  {nearestNpc
                    ? isAr
                      ? `تحدّث (${SIMULATOR_NPCS[nearestNpc].avatarEmoji})`
                      : `Interact (${SIMULATOR_NPCS[nearestNpc].avatarEmoji})`
                    : isAr
                    ? 'اقترب للتحدث'
                    : 'Walk Near NPC'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Session Progress & Non-Clinical Educational Badges Footer */}
        <section className="ms-session-bar">
          <div className="ms-badges-row">
            <strong>🏅 {isAr ? 'شارات الجلسة التعليمية:' : 'Session Educational Badges:'}</strong>
            {MEDICAL_SIMULATOR_SCENARIOS.map((scen) => {
              const earned = earnedBadges.includes(scen.id);
              return (
                <span
                  key={scen.id}
                  className={`ms-badge-chip ${earned ? 'earned' : ''}`}
                  title={pick(scen.title, lang)}
                >
                  <span>{scen.badgeIcon}</span>
                  <span>{pick(scen.badgeTitle, lang)}</span>
                </span>
              );
            })}
          </div>

          <p className="ms-medical-disclaimer">
            {isAr
              ? '⚠️ تنبيه طبي وتعليمي: هذه المحاكاة ثلاثية الأبعاد تستخدم حالات خيالية للتدريب والتوعية فقط، ولا تقدم تشخيصاً طبياً أو وصفات علاجية أو جرعات دوائية، ولا تغني عن مراجعة الطبيب أو الصيدلي المؤهل. لا يتم حفظ أي بيانات صحية.'
              : '⚠️ Educational Medical Notice: This 3D simulation uses fictional cases for educational stewardship training only. It does not diagnose, prescribe, provide dosages, or replace a licensed clinician. No personal health data is collected.'}
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
                  ? 'لديك سيناريو قيد التقدم في هذه الجلسة. هل ترغب في المتابعة أم الخروج لمركز الألعاب؟'
                  : 'You have an active scenario in progress. Continue playing or exit to the Game Center?'}
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
