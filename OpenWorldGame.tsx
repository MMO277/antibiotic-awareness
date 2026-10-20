import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { pick } from './types';
import {
  GAMING_CLASS,
  lockLandscape,
  mapScreenDeltaToLandscape,
  unlockOrientation,
} from './useGamingMode';
import {
  createInitialPatientStates,
  EquipmentId,
  EquipmentItemDef,
  HOSPITAL_DEPARTMENTS,
  HOSPITAL_EQUIPMENT_ITEMS,
  HOSPITAL_PATIENTS,
  HOSPITAL_STAFF_NPCS,
  HOSPITAL_WORKSTATIONS,
  HospitalDepartment,
  NURSING_SHIFT_MISSIONS,
  NursingMissionDef,
  PatientDef,
  StaffNpcDef,
  WorkstationDef,
} from './openWorldHospitalData';
import {
  computeNurseLevel,
  createDefaultOpenWorldState,
  loadOpenWorldProgressForUser,
  OpenWorldSavedState,
  saveOpenWorldProgressToCloud,
  writeLocalOpenWorldState,
} from './openWorldCloudPersistence';
import {
  buildOpenWorldHospitalScene,
  OpenWorldSceneRuntime,
} from './openWorldSceneBuilder';
import {
  OpenWorldPatientModal,
  OpenWorldStaffModal,
  OpenWorldWorkstationModal,
} from './OpenWorldClinicalModals';
import './OpenWorldGame.css';

type NearbyTarget =
  | { kind: 'patient'; item: PatientDef; dist: number }
  | { kind: 'workstation'; item: WorkstationDef; dist: number }
  | { kind: 'equipment'; item: EquipmentItemDef; dist: number }
  | { kind: 'staff'; item: StaffNpcDef; dist: number }
  | { kind: 'department'; item: HospitalDepartment; dist: number }
  | null;

export default function OpenWorldGame() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { user, loading: authLoading } = useAuth();
  const activeUid = user?.uid ?? null;

  const pageRef = useRef<HTMLElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<OpenWorldSceneRuntime | null>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const joyVecRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, -8));
  const playerRotYRef = useRef<number>(Math.PI);

  const [ready, setReady] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [loadedUserKey, setLoadedUserKey] = useState<string | null | undefined>(undefined);
  const [syncStatus, setSyncStatus] = useState<'loading' | 'saved' | 'saving' | 'guest'>('loading');

  const [gameState, setGameState] = useState<OpenWorldSavedState>(createDefaultOpenWorldState);
  const gameStateRef = useRef<OpenWorldSavedState>(gameState);
  gameStateRef.current = gameState;

  const [droppedPositions, setDroppedPositions] = useState<Record<string, { x: number; z: number }>>({});
  const droppedPosRef = useRef<Record<string, { x: number; z: number }>>(droppedPositions);
  droppedPosRef.current = droppedPositions;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [toastBanner, setToastBanner] = useState<string>('');

  const [nearby, setNearby] = useState<NearbyTarget>(null);
  const nearbyRef = useRef<NearbyTarget>(null);

  const [activePatientModalId, setActivePatientModalId] = useState<string | null>(null);
  const [activeWorkstationModalId, setActiveWorkstationModalId] = useState<string | null>(null);
  const [activeStaffModalId, setActiveStaffModalId] = useState<string | null>(null);
  const [activeDeptDialog, setActiveDeptDialog] = useState<HospitalDepartment | null>(null);

  const autoLandscapeTriedRef = useRef(false);

  const showToast = useCallback((msgAr: string, msgEn: string) => {
    setToastBanner(isAr ? msgAr : msgEn);
    window.setTimeout(() => {
      setToastBanner((prev) => (prev === (isAr ? msgAr : msgEn) ? '' : prev));
    }, 4200);
  }, [isAr]);

  // Apply gaming mode class to html and attempt landscape lock on mount, restoring cleanly on unmount
  useEffect(() => {
    document.documentElement.classList.add(GAMING_CLASS);
    void lockLandscape();
    return () => {
      document.documentElement.classList.remove(GAMING_CLASS);
      unlockOrientation();
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const tryEnterLandscapeFullscreen = useCallback(async () => {
    const target = pageRef.current;
    if (!target) return;
    try {
      if (!document.fullscreenElement && target.requestFullscreen) {
        await target.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
        setIsFullscreen(true);
      }
    } catch {
      /* Fullscreen may be restricted; CSS landscape fallback remains active */
    }
    await lockLandscape();
  }, []);

  const toggleFullscreen = async () => {
    const target = pageRef.current;
    if (!target) return;
    try {
      if (!document.fullscreenElement) {
        await tryEnterLandscapeFullscreen();
        setShowGameMenu(false);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setShowGameMenu(false);
        unlockOrientation();
      }
    } catch (error) {
      console.warn('Fullscreen toggle note:', error);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      if (fs) {
        void lockLandscape();
      } else {
        setShowGameMenu(false);
        unlockOrientation();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // 1. Load Authenticated User or Guest State BEFORE allowing saves
  useEffect(() => {
    if (authLoading) {
      setProgressLoaded(false);
      setSyncStatus('loading');
      return;
    }

    let cancelled = false;
    setProgressLoaded(false);
    setLoadedUserKey(undefined);
    setSyncStatus(activeUid ? 'loading' : 'guest');

    (async () => {
      const { state } = await loadOpenWorldProgressForUser(activeUid);
      if (cancelled) return;
      setGameState(state);
      playerPosRef.current.set(state.position.x, 0, state.position.z);
      playerRotYRef.current = state.rotationY;
      if (runtimeRef.current) {
        runtimeRef.current.playerGroup.position.copy(playerPosRef.current);
        runtimeRef.current.playerGroup.rotation.y = playerRotYRef.current;
      }
      setLoadedUserKey(activeUid);
      setProgressLoaded(true);
      setSyncStatus(activeUid ? 'saved' : 'guest');
    })();

    return () => {
      cancelled = true;
    };
  }, [activeUid, authLoading]);

  // 2. Evaluate Mission Objectives & Automatic Progression
  useEffect(() => {
    if (!progressLoaded) return;

    setGameState((prev) => {
      const nextProgress: Record<string, string[]> = { ...prev.missionProgress };
      const nextCompletedMissions = new Set<string>(prev.completedMissions);
      const nextCompletedTasks = new Set<string>(prev.completedTasks);
      const nextRewarded = new Set<string>(prev.rewardedEvents);
      let addedXp = 0;
      let changed = false;

      const hasEq = (id: EquipmentId) =>
        prev.carriedItemId === id || prev.inventory.includes(id);

      const checkObjectiveDone = (objId: string): boolean => {
        const pt1 = prev.patientStates['patient-triage'];
        const pt2 = prev.patientStates['patient-radiology'];
        const pt3 = prev.patientStates['patient-lab'];
        const pt4 = prev.patientStates['patient-fatigue'];
        const pt5 = prev.patientStates['patient-treatment'];
        const pt6 = prev.patientStates['patient-deterioration'];

        switch (objId) {
          // Mission 1
          case 'm1-obj1-pickup-kit':
            return hasEq('eq-vitals-kit') || Boolean(pt1?.vitalsMeasured);
          case 'm1-obj2-confirm-id':
            return Boolean(pt1?.identityConfirmed && pt1?.symptomsAsked);
          case 'm1-obj3-measure-vitals':
            return Boolean(pt1?.vitalsMeasured && pt1?.chartRecorded);
          // Mission 2
          case 'm2-obj1-patient-prep':
            return Boolean(
              pt2?.identityConfirmed &&
                (hasEq('eq-xray-request-chart') || prev.workflowFlags.xrayStudyReady),
            );
          case 'm2-obj2-run-xray':
            return prev.workflowFlags.xrayStudyReady;
          case 'm2-obj3-report-clinician':
            return prev.workflowFlags.xrayReportedToClinician;
          // Mission 3
          case 'm3-obj1-get-container':
            return (
              hasEq('eq-specimen-container') ||
              hasEq('eq-collected-specimen') ||
              Boolean(pt3?.specimenCollected)
            );
          case 'm3-obj2-collect-sample':
            return Boolean(pt3?.specimenCollected);
          case 'm3-obj3-submit-lab':
            return prev.workflowFlags.labResultReviewed;
          // Mission 4
          case 'm4-obj1-pickup-initial-med':
            return (
              hasEq('eq-med-amoxicillin-pkg') ||
              prev.workflowFlags.allergyDiscrepancyBlocked
            );
          case 'm4-obj2-detect-allergy-block':
            return prev.workflowFlags.allergyDiscrepancyBlocked;
          case 'm4-obj3-administer-safe-alt':
            return Boolean(pt4?.medicationAdministered);
          // Mission 5
          case 'm5-obj1-pickup-tray':
            return (
              hasEq('eq-sterile-dressing-kit') ||
              prev.workflowFlags.treatmentAreaDisinfected
            );
          case 'm5-obj2-prep-table':
            return prev.workflowFlags.treatmentAreaDisinfected;
          case 'm5-obj3-care-patient':
            return Boolean(
              pt5?.identityConfirmed && pt5?.vitalsMeasured && pt5?.comfortProvided,
            );
          // Mission 6
          case 'm6-obj1-pickup-box':
            return hasEq('eq-supply-box') || prev.workflowFlags.erSuppliesRestocked;
          case 'm6-obj2-deliver-er':
            return prev.workflowFlags.erSuppliesRestocked;
          case 'm6-obj3-log-station':
            return prev.workflowFlags.restockLoggedAtStation;
          // Mission 7
          case 'm7-obj1-assess-critical':
            return Boolean(pt6?.identityConfirmed && pt6?.vitalsMeasured);
          case 'm7-obj2-comfort-and-escalate':
            return Boolean(pt6?.comfortProvided && pt6?.escalatedToTeam);
          case 'm7-obj3-brief-er-doc':
            return prev.workflowFlags.deteriorationAlertedAtStation;
          // Mission 8
          case 'm8-obj1-pickup-binder':
            return (
              hasEq('eq-sbar-handover-binder') ||
              prev.workflowFlags.sbarHandoverCompleted
            );
          case 'm8-obj2-complete-sbar':
            return prev.workflowFlags.sbarHandoverCompleted;
          default:
            return false;
        }
      };

      for (const mission of NURSING_SHIFT_MISSIONS) {
        const currentDone = new Set<string>(nextProgress[mission.id] || []);
        for (const obj of mission.objectives) {
          if (!currentDone.has(obj.id) && checkObjectiveDone(obj.id)) {
            currentDone.add(obj.id);
            changed = true;
            const objRewardKey = `obj:${obj.id}`;
            if (!nextRewarded.has(objRewardKey)) {
              nextRewarded.add(objRewardKey);
              addedXp += 25;
            }
          }
        }
        nextProgress[mission.id] = Array.from(currentDone);

        const allDone = mission.objectives.every((o) => currentDone.has(o.id));
        if (allDone && !nextCompletedMissions.has(mission.id)) {
          nextCompletedMissions.add(mission.id);
          if (mission.patientId) nextCompletedTasks.add(mission.patientId);
          changed = true;
          const mRewardKey = `mission:${mission.id}`;
          if (!nextRewarded.has(mRewardKey)) {
            nextRewarded.add(mRewardKey);
            addedXp += mission.xpReward;
          }
        }
      }

      if (!changed) return prev;

      let nextActiveMissionId = prev.activeMissionId;
      if (nextCompletedMissions.has(nextActiveMissionId)) {
        const nextUnfinished = NURSING_SHIFT_MISSIONS.find(
          (m) => !nextCompletedMissions.has(m.id),
        );
        if (nextUnfinished) {
          nextActiveMissionId = nextUnfinished.id;
        }
      }

      const newXp = prev.xp + addedXp;
      return {
        ...prev,
        xp: newXp,
        level: computeNurseLevel(newXp),
        completedMissions: Array.from(nextCompletedMissions),
        completedTasks: Array.from(nextCompletedTasks),
        missionProgress: nextProgress,
        activeMissionId: nextActiveMissionId,
        rewardedEvents: Array.from(nextRewarded),
        updatedAt: new Date().toISOString(),
      };
    });
  }, [
    progressLoaded,
    gameState.carriedItemId,
    gameState.inventory,
    gameState.patientStates,
    gameState.workflowFlags,
  ]);

  // 3. Persist State Changes to LocalStorage & Cloud Firestore
  useEffect(() => {
    if (!progressLoaded || loadedUserKey !== activeUid) return;
    const snapshot: OpenWorldSavedState = {
      ...gameState,
      position: { x: playerPosRef.current.x, z: playerPosRef.current.z },
      rotationY: playerRotYRef.current,
      updatedAt: new Date().toISOString(),
    };
    writeLocalOpenWorldState(activeUid, snapshot);

    if (activeUid) {
      setSyncStatus('saving');
      const timer = window.setTimeout(() => {
        void saveOpenWorldProgressToCloud(activeUid, snapshot).then((ok) => {
          setSyncStatus(ok ? 'saved' : 'saved');
        });
      }, 450);
      return () => window.clearTimeout(timer);
    }
  }, [gameState, progressLoaded, loadedUserKey, activeUid]);

  // Periodic 5-second position sync & pagehide flush for cross-device continuity
  useEffect(() => {
    if (!progressLoaded || loadedUserKey !== activeUid || !ready) return;
    const persistPosition = () => {
      const snapshot: OpenWorldSavedState = {
        ...gameStateRef.current,
        position: { x: playerPosRef.current.x, z: playerPosRef.current.z },
        rotationY: playerRotYRef.current,
        updatedAt: new Date().toISOString(),
      };
      writeLocalOpenWorldState(activeUid, snapshot);
      if (activeUid) {
        void saveOpenWorldProgressToCloud(activeUid, snapshot);
      }
    };
    const interval = window.setInterval(persistPosition, 5000);
    window.addEventListener('pagehide', persistPosition);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('pagehide', persistPosition);
    };
  }, [ready, progressLoaded, loadedUserKey, activeUid]);

  // Sync 3D equipment attachments and patient visual markers whenever state changes
  useEffect(() => {
    const rt = runtimeRef.current;
    if (!rt) return;
    rt.syncEquipmentAttachments(
      gameState.carriedItemId,
      gameState.placedItems,
      droppedPositions,
    );
    rt.syncPatientVisuals(gameState.patientStates);
  }, [
    gameState.carriedItemId,
    gameState.placedItems,
    gameState.patientStates,
    droppedPositions,
    ready,
  ]);

  const activeMission: NursingMissionDef = useMemo(() => {
    return (
      NURSING_SHIFT_MISSIONS.find((m) => m.id === gameState.activeMissionId) ||
      NURSING_SHIFT_MISSIONS[0]
    );
  }, [gameState.activeMissionId]);

  const activeObjective = useMemo(() => {
    const doneIds = gameState.missionProgress[activeMission.id] || [];
    return (
      activeMission.objectives.find((o) => !doneIds.includes(o.id)) ||
      activeMission.objectives[activeMission.objectives.length - 1]
    );
  }, [activeMission, gameState.missionProgress]);

  const activeObjectiveRef = useRef(activeObjective);
  activeObjectiveRef.current = activeObjective;

  // Equipment & Clinical Actions
  const handlePickUpEquipment = useCallback(
    (eqId: EquipmentId) => {
      const def = HOSPITAL_EQUIPMENT_ITEMS.find((e) => e.id === eqId);
      if (!def) return;
      setDroppedPositions((prev) => {
        const next = { ...prev };
        delete next[eqId];
        return next;
      });
      setGameState((prev) => {
        const nextInv = prev.inventory.includes(eqId)
          ? prev.inventory
          : [...prev.inventory, eqId];
        const nextPlaced: Record<string, EquipmentId[]> = {};
        for (const [k, list] of Object.entries(prev.placedItems)) {
          nextPlaced[k] = list.filter((x) => x !== eqId);
        }
        const rewardKey = `pickup:${eqId}`;
        const isNewReward = !prev.rewardedEvents.includes(rewardKey);
        const nextXp = prev.xp + (isNewReward ? 15 : 0);
        return {
          ...prev,
          xp: nextXp,
          level: computeNurseLevel(nextXp),
          inventory: nextInv,
          carriedItemId: eqId,
          placedItems: nextPlaced,
          rewardedEvents: isNewReward
            ? [...prev.rewardedEvents, rewardKey]
            : prev.rewardedEvents,
        };
      });
      showToast(
        `🤲 تحمل الآن: ${def.shortLabel.ar}`,
        `🤲 Now carrying: ${def.shortLabel.en}`,
      );
    },
    [showToast],
  );

  const handleDropCarriedEquipment = useCallback(() => {
    const carried = gameStateRef.current.carriedItemId;
    if (!carried) return;
    const def = HOSPITAL_EQUIPMENT_ITEMS.find((e) => e.id === carried);
    const px = playerPosRef.current.x + Math.sin(playerRotYRef.current) * 0.9;
    const pz = playerPosRef.current.z + Math.cos(playerRotYRef.current) * 0.9;
    setDroppedPositions((prev) => ({
      ...prev,
      [carried]: { x: px, z: pz },
    }));
    setGameState((prev) => ({
      ...prev,
      carriedItemId: null,
    }));
    if (def) {
      showToast(
        `📥 تم وضع «${def.shortLabel.ar}» في موقعك الحالي.`,
        `📥 Dropped "${def.shortLabel.en}" at your current position.`,
      );
    }
  }, [showToast]);

  const handlePlaceCarriedAtWorkstation = useCallback((workstationId: string) => {
    setGameState((prev) => {
      if (!prev.carriedItemId) return prev;
      const item = prev.carriedItemId;
      const existing = prev.placedItems[workstationId] || [];
      return {
        ...prev,
        carriedItemId: null,
        placedItems: {
          ...prev.placedItems,
          [workstationId]: existing.includes(item) ? existing : [...existing, item],
        },
      };
    });
  }, []);

  const handleDiscoverDepartment = useCallback(
    (dept: HospitalDepartment) => {
      setActiveDeptDialog(dept);
      setGameState((prev) => {
        if (prev.visited.includes(dept.name)) return prev;
        const nextVisited = [...prev.visited, dept.name];
        const rewardKey = `visit:${dept.name}`;
        const isNew = !prev.rewardedEvents.includes(rewardKey);
        const nextXp = prev.xp + (isNew ? 20 : 0);
        return {
          ...prev,
          xp: nextXp,
          level: computeNurseLevel(nextXp),
          visited: nextVisited,
          rewardedEvents: isNew ? [...prev.rewardedEvents, rewardKey] : prev.rewardedEvents,
        };
      });
    },
    [],
  );

  const handlePatientAction = useCallback(
    (
      patientId: string,
      action:
        | 'confirm_id'
        | 'ask_symptoms'
        | 'measure_vitals'
        | 'record_chart'
        | 'provide_comfort'
        | 'escalate_team'
        | 'pickup_xray_order'
        | 'collect_specimen'
        | 'block_allergy_med'
        | 'administer_safe_med',
    ) => {
      setGameState((prev) => {
        const curPt = prev.patientStates[patientId] || createInitialPatientStates()[patientId];
        if (!curPt) return prev;

        const updatedPt = { ...curPt };
        const nextFlags = { ...prev.workflowFlags };
        let nextCarried = prev.carriedItemId;
        let nextInv = [...prev.inventory];
        const nextTasks = new Set(prev.completedTasks);

        if (action === 'confirm_id') {
          updatedPt.identityConfirmed = true;
          updatedPt.statusNoteAr = 'تم التحقق من الهوية والسوار';
          updatedPt.statusNoteEn = 'Identity & wristband verified';
        } else if (action === 'ask_symptoms') {
          updatedPt.symptomsAsked = true;
          updatedPt.statusNoteAr = 'تم أخذ القصة المرضية والأعراض';
          updatedPt.statusNoteEn = 'Symptom history collected';
        } else if (action === 'measure_vitals') {
          updatedPt.vitalsMeasured = true;
          updatedPt.statusNoteAr = 'تم قياس العلامات الحيوية الخمس';
          updatedPt.statusNoteEn = '5 Vital signs measured';
        } else if (action === 'record_chart') {
          updatedPt.chartRecorded = true;
          updatedPt.visualState = 'stabilized';
          updatedPt.statusNoteAr = 'تم توثيق التقييم بالملف التمريضي ✓';
          updatedPt.statusNoteEn = 'Assessment documented in chart ✓';
          nextTasks.add(patientId);
        } else if (action === 'provide_comfort') {
          updatedPt.comfortProvided = true;
          updatedPt.statusNoteAr = 'تم تقديم الرعاية والوضعية المريحة';
          updatedPt.statusNoteEn = 'Comfort & positioning provided';
        } else if (action === 'escalate_team') {
          updatedPt.escalatedToTeam = true;
          updatedPt.visualState = 'stabilized';
          updatedPt.statusNoteAr = 'تم إبلاغ الفريق الطبي وتصعيد الحالة ✓';
          updatedPt.statusNoteEn = 'Clinical team notified & escalated ✓';
          nextTasks.add(patientId);
        } else if (action === 'pickup_xray_order') {
          nextCarried = 'eq-xray-request-chart';
          if (!nextInv.includes('eq-xray-request-chart')) {
            nextInv.push('eq-xray-request-chart');
          }
          updatedPt.statusNoteAr = 'تم استلام طلب الأشعة #XR-204';
          updatedPt.statusNoteEn = 'X-Ray order #XR-204 collected';
        } else if (action === 'collect_specimen') {
          updatedPt.specimenCollected = true;
          updatedPt.visualState = 'stabilized';
          updatedPt.statusNoteAr = 'تم سحب العينة المعقمة #LB-309';
          updatedPt.statusNoteEn = 'Sterile specimen #LB-309 collected';
          nextCarried = 'eq-collected-specimen';
          if (!nextInv.includes('eq-collected-specimen')) {
            nextInv.push('eq-collected-specimen');
          }
        } else if (action === 'block_allergy_med') {
          updatedPt.allergyFlagged = true;
          nextFlags.allergyDiscrepancyBlocked = true;
          nextFlags.allergyEscalatedToTeam = true;
          updatedPt.statusNoteAr = '🚨 تم إيقاف البنسلين وتصعيد الحساسية!';
          updatedPt.statusNoteEn = '🚨 Penicillin blocked & allergy escalated!';
        } else if (action === 'administer_safe_med') {
          updatedPt.medicationAdministered = true;
          updatedPt.visualState = 'stabilized';
          nextFlags.safeMedAdministered = true;
          updatedPt.statusNoteAr = 'تم إعطاء وتوثيق الدواء البديل الآمن ✓';
          updatedPt.statusNoteEn = 'Safe alternative medication administered ✓';
          nextTasks.add(patientId);
        }

        const rewardKey = `pt:${patientId}:${action}`;
        const isNew = !prev.rewardedEvents.includes(rewardKey);
        const nextXp = prev.xp + (isNew ? 20 : 0);

        return {
          ...prev,
          xp: nextXp,
          level: computeNurseLevel(nextXp),
          carriedItemId: nextCarried,
          inventory: nextInv,
          completedTasks: Array.from(nextTasks),
          workflowFlags: nextFlags,
          patientStates: {
            ...prev.patientStates,
            [patientId]: updatedPt,
          },
          rewardedEvents: isNew ? [...prev.rewardedEvents, rewardKey] : prev.rewardedEvents,
        };
      });
    },
    [],
  );

  const handleWorkstationAction = useCallback(
    (
      action:
        | 'run_xray_study'
        | 'report_xray_at_station'
        | 'submit_lab_specimen'
        | 'prep_treatment_area'
        | 'restock_er_supplies'
        | 'log_restock_at_station'
        | 'alert_deterioration_er'
        | 'complete_sbar_handover',
    ) => {
      setGameState((prev) => {
        const nextFlags = { ...prev.workflowFlags };
        const nextPts = { ...prev.patientStates };
        const nextTasks = new Set(prev.completedTasks);

        if (action === 'run_xray_study') {
          nextFlags.xrayStudyReady = true;
          if (nextPts['patient-radiology']) {
            nextPts['patient-radiology'] = {
              ...nextPts['patient-radiology'],
              xrayCompleted: true,
              visualState: 'stabilized',
              statusNoteAr: 'أُجريت أشعة الصدر #XR-204 ✓',
              statusNoteEn: 'Chest X-Ray #XR-204 completed ✓',
            };
          }
        } else if (action === 'report_xray_at_station') {
          nextFlags.xrayReportedToClinician = true;
          nextTasks.add('patient-radiology');
        } else if (action === 'submit_lab_specimen') {
          nextFlags.labSpecimenSubmitted = true;
          nextFlags.labResultReviewed = true;
          nextTasks.add('patient-lab');
          if (nextPts['patient-lab']) {
            nextPts['patient-lab'] = {
              ...nextPts['patient-lab'],
              chartRecorded: true,
              visualState: 'stabilized',
              statusNoteAr: 'ظهرت نتيجة المزرعة AST ✓',
              statusNoteEn: 'AST lab result verified ✓',
            };
          }
        } else if (action === 'prep_treatment_area') {
          nextFlags.treatmentAreaDisinfected = true;
        } else if (action === 'restock_er_supplies') {
          nextFlags.erSuppliesRestocked = true;
        } else if (action === 'log_restock_at_station') {
          nextFlags.restockLoggedAtStation = true;
        } else if (action === 'alert_deterioration_er') {
          nextFlags.deteriorationAlertedAtStation = true;
          nextTasks.add('patient-deterioration');
          if (nextPts['patient-deterioration']) {
            nextPts['patient-deterioration'] = {
              ...nextPts['patient-deterioration'],
              escalatedToTeam: true,
              visualState: 'stabilized',
              statusNoteAr: 'تم إنقاذ واستقرار الحالة الحرجة ✓',
              statusNoteEn: 'Critical patient stabilized ✓',
            };
          }
        } else if (action === 'complete_sbar_handover') {
          nextFlags.sbarHandoverCompleted = true;
        }

        const rewardKey = `ws:${action}`;
        const isNew = !prev.rewardedEvents.includes(rewardKey);
        const nextXp = prev.xp + (isNew ? 30 : 0);

        return {
          ...prev,
          xp: nextXp,
          level: computeNurseLevel(nextXp),
          completedTasks: Array.from(nextTasks),
          workflowFlags: nextFlags,
          patientStates: nextPts,
          rewardedEvents: isNew ? [...prev.rewardedEvents, rewardKey] : prev.rewardedEvents,
        };
      });
    },
    [],
  );

  // Contextual Primary Interaction Handler (Key E or Interact Button)
  const triggerInteract = useCallback(() => {
    const target = nearbyRef.current;
    if (!target) {
      showToast(
        '💡 اقترب من مريض، أو معدة طبية، أو محطة عمل، ثم اضغط تفاعل (E).',
        '💡 Approach a patient, medical equipment, or workstation, then press Interact (E).',
      );
      return;
    }

    if (target.kind === 'equipment') {
      handlePickUpEquipment(target.item.id);
    } else if (target.kind === 'patient') {
      setActivePatientModalId(target.item.id);
    } else if (target.kind === 'workstation') {
      setActiveWorkstationModalId(target.item.id);
    } else if (target.kind === 'staff') {
      setActiveStaffModalId(target.item.id);
    } else if (target.kind === 'department') {
      handleDiscoverDepartment(target.item);
    }
  }, [handleDiscoverDepartment, handlePickUpEquipment, showToast]);

  const interactRef = useRef(triggerInteract);
  interactRef.current = triggerInteract;

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      setReady(false);
      return;
    }

    const w = Math.max(300, mount.clientWidth);
    const h = Math.max(240, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const rt = buildOpenWorldHospitalScene(w, h);
    runtimeRef.current = rt;
    rt.playerGroup.position.copy(playerPosRef.current);
    rt.playerGroup.rotation.y = playerRotYRef.current;
    rt.syncEquipmentAttachments(
      gameStateRef.current.carriedItemId,
      gameStateRef.current.placedItems,
      droppedPosRef.current,
    );
    rt.syncPatientVisuals(gameStateRef.current.patientStates);

    let cameraYaw = 0;
    let cameraPitch = 0.26;
    let draggingCamera = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (k === 'e') {
        interactRef.current();
      } else if (k === 'g') {
        handleDropCarriedEquipment();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const canvas = renderer.domElement;
    canvas.style.touchAction = 'none';

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!autoLandscapeTriedRef.current && e.pointerType !== 'mouse') {
        autoLandscapeTriedRef.current = true;
        void tryEnterLandscapeFullscreen();
      }
      draggingCamera = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingCamera) return;
      const rawDx = e.clientX - lastPointerX;
      const rawDy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      const { dx, dy } = mapScreenDeltaToLandscape(rawDx, rawDy);
      cameraYaw -= dx * 0.0065;
      cameraPitch = THREE.MathUtils.clamp(cameraPitch + dy * 0.0045, -0.05, 0.78);
    };

    const onPointerUp = () => {
      draggingCamera = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    const onResize = () => {
      if (!mount) return;
      const nw = Math.max(240, mount.clientWidth);
      const nh = Math.max(200, mount.clientHeight);
      renderer.setSize(nw, nh);
      rt.camera.aspect = nw / nh;
      rt.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    let alive = true;
    let lastTime = performance.now();

    const animate = (now: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.045);
      lastTime = now;

      const k = keysRef.current;
      let inputX = (k['d'] || k['arrowright'] ? 1 : 0) - (k['a'] || k['arrowleft'] ? 1 : 0) + joyVecRef.current.x;
      let inputZ = (k['s'] || k['arrowdown'] ? 1 : 0) - (k['w'] || k['arrowup'] ? 1 : 0) + joyVecRef.current.z;

      const dxWorld = inputX * Math.cos(cameraYaw) + inputZ * Math.sin(cameraYaw);
      const dzWorld = -inputX * Math.sin(cameraYaw) + inputZ * Math.cos(cameraYaw);
      const moving = Math.abs(dxWorld) > 0.04 || Math.abs(dzWorld) > 0.04;

      if (moving) {
        const len = Math.hypot(dxWorld, dzWorld) || 1;
        const nx = dxWorld / Math.max(1, len);
        const nz = dzWorld / Math.max(1, len);
        const speed = 5.4;
        const candX = THREE.MathUtils.clamp(rt.playerGroup.position.x + nx * dt * speed, -44, 44);
        const candZ = THREE.MathUtils.clamp(rt.playerGroup.position.z + nz * dt * speed, -44, 44);

        if (!rt.checkBlocked(candX, rt.playerGroup.position.z)) {
          rt.playerGroup.position.x = candX;
        }
        if (!rt.checkBlocked(rt.playerGroup.position.x, candZ)) {
          rt.playerGroup.position.z = candZ;
        }

        const targetRot = Math.atan2(nx, nz);
        rt.playerGroup.rotation.y = targetRot;
        playerRotYRef.current = targetRot;

        rt.playerTorso.position.y = 1.35 + Math.sin(now * 0.014) * 0.035;
        rt.playerLimbs[0].rotation.x = Math.sin(now * 0.009) * 0.38;
        rt.playerLimbs[1].rotation.x = -Math.sin(now * 0.009) * 0.38;
        rt.playerLimbs[2].rotation.x = -Math.sin(now * 0.009) * 0.48;
        rt.playerLimbs[3].rotation.x = Math.sin(now * 0.009) * 0.48;
        rt.playerShoes.forEach((shoe, idx) => {
          shoe.position.y = 0.16 + Math.max(0, Math.sin(now * 0.009 + (idx ? Math.PI : 0))) * 0.045;
        });
      } else {
        rt.playerLimbs.forEach((l) => {
          l.rotation.x = THREE.MathUtils.damp(l.rotation.x, 0, 8, dt);
        });
        rt.playerTorso.position.y = THREE.MathUtils.damp(rt.playerTorso.position.y, 1.35, 8, dt);
      }

      playerPosRef.current.copy(rt.playerGroup.position);
      const px = playerPosRef.current.x;
      const pz = playerPosRef.current.z;

      // Update 3D Waypoint & Player Compass Arrow toward active mission objective
      const obj = activeObjectiveRef.current;
      if (obj) {
        rt.waypointGroup.position.set(obj.targetX, 0, obj.targetZ);
        rt.waypointRing.scale.setScalar(1 + Math.sin(now * 0.005) * 0.1);
        rt.compassArrow.position.set(px, 2.55 + Math.sin(now * 0.006) * 0.05, pz);
        const angleToTarget = Math.atan2(obj.targetX - px, obj.targetZ - pz);
        rt.compassArrow.rotation.y = angleToTarget;
      }

      // Animate pedestrians, patients, and ambulance lights
      rt.pedestrians.forEach((npc, i) => {
        const a = npc.phase + now * 0.001 * npc.speed;
        npc.group.position.x = npc.centerX + Math.cos(a) * npc.radius;
        npc.group.position.z = npc.centerZ + Math.sin(a) * npc.radius;
        npc.group.rotation.y = -a + Math.PI / 2;
        npc.outfit.position.y = 1.15 + Math.sin(now * 0.006 + i) * 0.025;
      });

      Object.values(rt.patientRigs).forEach((pr, idx) => {
        pr.marker.position.y = 2.22 + Math.sin(now * 0.0045 + idx) * 0.09;
        pr.marker.material.emissiveIntensity = 0.65 + Math.abs(Math.sin(now * 0.005 + idx)) * 1.1;
        pr.torso.position.y =
          (pr.def.inBed ? 0.88 : 1.02) + Math.sin(now * 0.003 + idx) * 0.015;
      });

      rt.ambulanceBeaconRed.material.emissiveIntensity = 0.6 + Math.abs(Math.sin(now * 0.009)) * 1.3;
      rt.ambulanceBeaconBlue.material.emissiveIntensity = 0.6 + Math.abs(Math.cos(now * 0.009)) * 1.3;

      // Proximity Detection for Patients, Workstations, Equipment, Staff & Departments
      let bestTarget: NearbyTarget = null;

      for (const pt of HOSPITAL_PATIENTS) {
        const d = Math.hypot(px - pt.x, pz - pt.z);
        if (d < 3.4 && (!bestTarget || d < bestTarget.dist)) {
          bestTarget = { kind: 'patient', item: pt, dist: d };
        }
      }

      for (const ws of HOSPITAL_WORKSTATIONS) {
        const d = Math.hypot(px - ws.x, pz - ws.z);
        if (d < 3.1 && (!bestTarget || d < bestTarget.dist)) {
          bestTarget = { kind: 'workstation', item: ws, dist: d };
        }
      }

      for (const eq of HOSPITAL_EQUIPMENT_ITEMS) {
        if (eq.id === 'eq-collected-specimen') continue;
        const rig = rt.equipmentRigs[eq.id];
        if (!rig || rig.holder === 'player') continue;
        const d = Math.hypot(px - rig.worldPos.x, pz - rig.worldPos.z);
        if (d < 2.5 && (!bestTarget || d < bestTarget.dist)) {
          bestTarget = { kind: 'equipment', item: eq, dist: d };
        }
      }

      if (!bestTarget) {
        for (const st of HOSPITAL_STAFF_NPCS) {
          const d = Math.hypot(px - st.x, pz - st.z);
          if (d < 3.0 && (!bestTarget || d < bestTarget.dist)) {
            bestTarget = { kind: 'staff', item: st, dist: d };
          }
        }
      }

      if (!bestTarget) {
        for (const dept of HOSPITAL_DEPARTMENTS) {
          const d = Math.hypot(px - dept.x, pz - dept.z);
          if (d < 6.8 && (!bestTarget || d < bestTarget.dist)) {
            bestTarget = { kind: 'department', item: dept, dist: d };
          }
        }
      }

      const prevT = nearbyRef.current;
      const changedTarget =
        (prevT === null && bestTarget !== null) ||
        (prevT !== null && bestTarget === null) ||
        (prevT && bestTarget && (prevT.kind !== bestTarget.kind || prevT.item.id !== bestTarget.item.id));

      if (changedTarget) {
        nearbyRef.current = bestTarget;
        setNearby(bestTarget);
      }

      // Smooth 3rd-person camera follow
      const lookTarget = new THREE.Vector3(px, 1.48, pz);
      const camDist = 9.8;
      const horiz = Math.cos(cameraPitch) * camDist;
      const desiredCam = new THREE.Vector3(
        px + Math.sin(cameraYaw) * horiz,
        rt.playerGroup.position.y + 2.55 + Math.sin(cameraPitch) * camDist,
        pz + Math.cos(cameraYaw) * horiz,
      );
      rt.camera.position.lerp(desiredCam, 1 - Math.exp(-6 * dt));
      rt.camera.lookAt(lookTarget);

      renderer.render(rt.scene, rt.camera);
    };

    raf = requestAnimationFrame(animate);
    setReady(true);

    return () => {
      alive = false;
      runtimeRef.current = null;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      rt.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [handleDropCarriedEquipment, tryEnterLandscapeFullscreen]);

  // Joystick Pointer Handlers with automatic CSS-portrait-to-landscape delta mapping
  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const maxR = Math.max(24, Math.min(r.width, r.height) * 0.36);

    const mapped = mapScreenDeltaToLandscape(clientX - cx, clientY - cy);
    const nx = mapped.dx / maxR;
    const ny = mapped.dy / maxR;
    const len = Math.hypot(nx, ny) || 1;
    const clampedX = Math.max(-1, Math.min(1, nx / Math.max(1, len)));
    const clampedZ = Math.max(-1, Math.min(1, ny / Math.max(1, len)));

    joyVecRef.current = { x: clampedX, z: clampedZ };
    const knob = el.querySelector('.ow-joystick-knob') as HTMLElement | null;
    if (knob) {
      knob.style.transform = `translate(${clampedX * 28}px, ${clampedZ * 28}px)`;
    }
  };

  const stopJoystick = () => {
    joyVecRef.current = { x: 0, z: 0 };
    const el = joyBaseRef.current;
    const knob = el?.querySelector('.ow-joystick-knob') as HTMLElement | null;
    if (knob) knob.style.transform = 'translate(0, 0)';
  };

  const activePatientModal = useMemo(
    () => HOSPITAL_PATIENTS.find((p) => p.id === activePatientModalId) || null,
    [activePatientModalId],
  );

  const activeWorkstationModal = useMemo(
    () => HOSPITAL_WORKSTATIONS.find((w) => w.id === activeWorkstationModalId) || null,
    [activeWorkstationModalId],
  );

  const activeStaffModal = useMemo(
    () => HOSPITAL_STAFF_NPCS.find((s) => s.id === activeStaffModalId) || null,
    [activeStaffModalId],
  );

  const carriedEquipmentDef = useMemo(
    () => HOSPITAL_EQUIPMENT_ITEMS.find((e) => e.id === gameState.carriedItemId) || null,
    [gameState.carriedItemId],
  );

  const handleResetSimulation = () => {
    const fresh = createDefaultOpenWorldState();
    setGameState(fresh);
    setDroppedPositions({});
    playerPosRef.current.set(fresh.position.x, 0, fresh.position.z);
    playerRotYRef.current = fresh.rotationY;
    if (runtimeRef.current) {
      runtimeRef.current.playerGroup.position.copy(playerPosRef.current);
      runtimeRef.current.playerGroup.rotation.y = playerRotYRef.current;
    }
    writeLocalOpenWorldState(activeUid, fresh);
    if (activeUid) {
      void saveOpenWorldProgressToCloud(activeUid, fresh, true);
    }
    showToast(
      '🔄 تمت إعادة ضبط مناوبة المستشفى من البداية.',
      '🔄 Hospital nursing shift reset to the beginning.',
    );
  };

  return (
    <main ref={pageRef} className="ow-page" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ow-header">
        <Link to="/games" className="ow-back">
          ← {isAr ? 'مركز الألعاب' : 'Game Center'}
        </Link>
        <div>
          <strong>
            🏥 {isAr ? 'محاكاة مستشفى التمريض المفتوح 3D' : 'Open-World Nursing Hospital 3D'}
          </strong>
          <span>
            {isAr
              ? `المستوى ${gameState.level} • المهام ${gameState.completedMissions.length}/${NURSING_SHIFT_MISSIONS.length} • المرضى ${gameState.completedTasks.length}/${HOSPITAL_PATIENTS.length}`
              : `Lv.${gameState.level} Nurse • Missions ${gameState.completedMissions.length}/${NURSING_SHIFT_MISSIONS.length} • Patients ${gameState.completedTasks.length}/${HOSPITAL_PATIENTS.length}`}
          </span>
        </div>
        <div className="ow-xp">
          ⭐ {gameState.xp} XP{' '}
          <small>
            {syncStatus === 'loading'
              ? isAr
                ? 'جارٍ التحميل…'
                : 'Loading…'
              : activeUid
                ? isAr
                  ? '☁️ مزامنة سحابية'
                  : '☁️ Cloud Synced'
                : isAr
                  ? '💾 حفظ محلي'
                  : '💾 Local Save'}
          </small>
        </div>
        <button
          type="button"
          className="ow-fullscreen"
          onClick={toggleFullscreen}
          aria-label={
            isFullscreen
              ? isAr
                ? 'إنهاء ملء الشاشة'
                : 'Exit fullscreen'
              : isAr
                ? 'ملء الشاشة والوضع الأفقي'
                : 'Fullscreen Landscape'
          }
        >
          {isFullscreen ? '⤢' : '⛶'}{' '}
          <span>
            {isFullscreen
              ? isAr
                ? 'إنهاء'
                : 'Exit'
              : isAr
                ? 'شاشة كاملة'
                : 'Fullscreen'}
          </span>
        </button>
      </header>

      <section className="ow-layout">
        <div className="ow-stage">
          <div className="ow-scene" ref={mountRef} />

          {/* Top-Left Collapsible Menu & HUD Toggle Buttons */}
          <div className="ow-top-floating-btns">
            <button
              type="button"
              className="ow-menu-toggle"
              onClick={() => setShowGameMenu((v) => !v)}
              aria-label={
                showGameMenu
                  ? isAr
                    ? 'إخفاء قائمة المهام'
                    : 'Hide mission drawer'
                  : isAr
                    ? 'فتح قائمة المهام والأقسام'
                    : 'Open mission & hospital drawer'
              }
            >
              {showGameMenu ? '✕' : '☰'}
            </button>
            <button
              type="button"
              className="ow-hud-collapse-btn"
              onClick={() => setHudCollapsed((v) => !v)}
              title={
                hudCollapsed
                  ? isAr
                    ? 'إظهار شريط المهمة'
                    : 'Show HUD Panel'
                  : isAr
                    ? 'إخفاء شريط المهمة'
                    : 'Hide HUD Panel'
              }
            >
              {hudCollapsed ? (isAr ? '▼ إظهار المهام' : '▼ Show HUD') : isAr ? '▲ إخفاء' : '▲ Hide HUD'}
            </button>
          </div>

          {/* Compact Collapsible In-Game HUD (Mission Objective + Minimap + Carried Inventory) */}
          {!hudCollapsed && (
            <div className="ow-hud">
              <div className="ow-avatar" title={`Level ${gameState.level} Nurse`}>
                👩‍⚕️
                <small>L{gameState.level}</small>
              </div>

              <div className="ow-progress">
                <div className="ow-progress-top">
                  <b>
                    {activeMission.icon} {pick(activeMission.title, lang)}
                  </b>
                  <span className="ow-mission-step-pill">
                    {isAr
                      ? `المهام ${gameState.completedMissions.length}/${NURSING_SHIFT_MISSIONS.length}`
                      : `${gameState.completedMissions.length}/${NURSING_SHIFT_MISSIONS.length} Done`}
                  </span>
                </div>
                <span className="ow-objective-line">
                  🎯 {activeObjective ? pick(activeObjective.title, lang) : pick(activeMission.shortScenario, lang)}
                </span>
                <div className="ow-bar">
                  <i
                    style={{
                      width: `${Math.min(
                        100,
                        ((gameState.completedMissions.length + 0.35) / NURSING_SHIFT_MISSIONS.length) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Compact Radar Minimap showing departments & active objective pulse */}
              <div className="ow-map" aria-hidden="true">
                <span>🧭</span>
                <small>{isAr ? 'المستشفى' : 'RADAR'}</small>
                {HOSPITAL_DEPARTMENTS.slice(0, 7).map((p, i) => (
                  <i
                    key={p.id}
                    className={`ow-map-dot ow-map-dot-${i}`}
                    style={{
                      left: `${50 + (p.x / 44) * 38}%`,
                      top: `${50 + (p.z / 44) * 38}%`,
                    }}
                  />
                ))}
                {activeObjective && (
                  <i
                    className="ow-map-target-pulse"
                    style={{
                      left: `${50 + (activeObjective.targetX / 44) * 38}%`,
                      top: `${50 + (activeObjective.targetZ / 44) * 38}%`,
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Carried Equipment & Quick Inventory Strip */}
          <div className="ow-inventory-hud">
            <div className="ow-carried-chip">
              <span>🤲 {isAr ? 'في يدك:' : 'Carrying:'}</span>
              {carriedEquipmentDef ? (
                <>
                  <b>
                    {carriedEquipmentDef.icon} {pick(carriedEquipmentDef.shortLabel, lang)}
                  </b>
                  <button
                    type="button"
                    className="ow-drop-mini-btn"
                    onClick={handleDropCarriedEquipment}
                  >
                    {isAr ? 'ترك (G)' : 'Drop (G)'}
                  </button>
                </>
              ) : (
                <small>{isAr ? 'لا شيء (اقترب من معدة للتقاطها)' : 'Empty hands'}</small>
              )}
            </div>

            {gameState.inventory.length > 0 && (
              <div className="ow-bag-chips">
                {gameState.inventory.map((eqId) => {
                  const def = HOSPITAL_EQUIPMENT_ITEMS.find((e) => e.id === eqId);
                  if (!def) return null;
                  const active = gameState.carriedItemId === eqId;
                  return (
                    <button
                      key={eqId}
                      type="button"
                      className={`ow-bag-item ${active ? 'active' : ''}`}
                      onClick={() => handlePickUpEquipment(eqId)}
                      title={pick(def.name, lang)}
                    >
                      <span>{def.icon}</span>
                      <span>{pick(def.shortLabel, lang)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toast Notification Banner */}
          {toastBanner && (
            <div className="ow-toast-banner" role="status">
              {toastBanner}
            </div>
          )}

          {/* Contextual Proximity Interaction Prompt */}
          {nearby &&
            !activePatientModal &&
            !activeWorkstationModal &&
            !activeStaffModal &&
            !activeDeptDialog && (
              <div className="ow-proximity-bar">
                <div className="ow-prox-text">
                  {nearby.kind === 'patient' && (
                    <>
                      <b>
                        🛏️ {pick(nearby.item.name, lang)} ({nearby.item.patientCode})
                      </b>
                      <small>{pick(nearby.item.roomLabel, lang)}</small>
                    </>
                  )}
                  {nearby.kind === 'workstation' && (
                    <>
                      <b>
                        {nearby.item.icon} {pick(nearby.item.name, lang)}
                      </b>
                      <small>{pick(nearby.item.promptLabel, lang)}</small>
                    </>
                  )}
                  {nearby.kind === 'equipment' && (
                    <>
                      <b>
                        {nearby.item.icon} {pick(nearby.item.name, lang)}
                      </b>
                      <small>{isAr ? 'معدة طبية قابلة للالتقاط والحمل' : 'Pickable medical equipment'}</small>
                    </>
                  )}
                  {nearby.kind === 'staff' && (
                    <>
                      <b>
                        {nearby.item.icon} {pick(nearby.item.name, lang)}
                      </b>
                      <small>{pick(nearby.item.roleTitle, lang)}</small>
                    </>
                  )}
                  {nearby.kind === 'department' && (
                    <>
                      <b>
                        {nearby.item.icon} {isAr ? nearby.item.ar : nearby.item.en}
                      </b>
                      <small>{isAr ? nearby.item.subtitleAr : nearby.item.subtitleEn}</small>
                    </>
                  )}
                </div>
                <button type="button" className="ow-prox-action-btn" onClick={triggerInteract}>
                  {nearby.kind === 'equipment'
                    ? isAr
                      ? '🤲 التقاط وحمل (E)'
                      : '🤲 Pick Up (E)'
                    : nearby.kind === 'patient'
                      ? isAr
                        ? '🩺 فحص ورعاية المريض (E)'
                        : '🩺 Assess Patient (E)'
                      : isAr
                        ? '✋ تفاعل الآن (E)'
                        : '✋ Interact (E)'}
                </button>
              </div>
            )}

          {!ready && (
            <div className="ow-loading">
              {isAr ? 'جارٍ تجهيز مستشفى التمريض ثلاثي الأبعاد…' : 'Preparing 3D Nursing Hospital…'}
              <small>
                {isAr
                  ? 'إذا لم يدعم جهازك WebGL، جرّب متصفحًا حديثًا.'
                  : 'If WebGL is unavailable, try a modern browser.'}
              </small>
            </div>
          )}

          {/* Department Info Dialog */}
          {activeDeptDialog && (
            <div className="ow-dialog">
              <button className="ow-close" onClick={() => setActiveDeptDialog(null)}>
                ×
              </button>
              <b>
                {activeDeptDialog.icon} {isAr ? activeDeptDialog.ar : activeDeptDialog.en}
              </b>
              <p>{isAr ? activeDeptDialog.fact : activeDeptDialog.factEn}</p>
              <button className="ow-primary" onClick={() => setActiveDeptDialog(null)}>
                {isAr ? 'متابعة المناوبة التمريضية' : 'Continue Shift'}
              </button>
            </div>
          )}

          {/* Interactive Clinical Modals (Patient, Workstation, Staff) */}
          {activePatientModal && (
            <OpenWorldPatientModal
              lang={lang}
              patient={activePatientModal}
              patientState={
                gameState.patientStates[activePatientModal.id] ||
                createInitialPatientStates()[activePatientModal.id]
              }
              carriedItemId={gameState.carriedItemId}
              inventory={gameState.inventory}
              workflowFlags={gameState.workflowFlags}
              onClose={() => setActivePatientModalId(null)}
              onPatientAction={handlePatientAction}
            />
          )}

          {activeWorkstationModal && (
            <OpenWorldWorkstationModal
              lang={lang}
              workstation={activeWorkstationModal}
              carriedItemId={gameState.carriedItemId}
              inventory={gameState.inventory}
              placedItems={gameState.placedItems}
              patientStates={gameState.patientStates}
              workflowFlags={gameState.workflowFlags}
              onClose={() => setActiveWorkstationModalId(null)}
              onPickUpEquipment={handlePickUpEquipment}
              onPlaceCarriedItem={handlePlaceCarriedAtWorkstation}
              onCompleteWorkstationAction={handleWorkstationAction}
            />
          )}

          {activeStaffModal && (
            <OpenWorldStaffModal
              lang={lang}
              staff={activeStaffModal}
              onClose={() => setActiveStaffModalId(null)}
            />
          )}

          {/* Bottom Controls: Physical LEFT Virtual Joystick + Physical RIGHT Action Buttons */}
          <div className="ow-controls" dir="ltr">
            <div
              ref={joyBaseRef}
              className="ow-joystick"
              role="group"
              aria-label={isAr ? 'عصا الحركة' : 'Movement joystick'}
              onPointerDown={(e) => {
                if (!autoLandscapeTriedRef.current && e.pointerType !== 'mouse') {
                  autoLandscapeTriedRef.current = true;
                  void tryEnterLandscapeFullscreen();
                }
                const el = e.currentTarget;
                try {
                  el.setPointerCapture(e.pointerId);
                } catch {}
                updateJoystick(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (e.buttons === 0 && e.pointerType === 'mouse') return;
                updateJoystick(e.clientX, e.clientY);
              }}
              onPointerUp={stopJoystick}
              onPointerCancel={stopJoystick}
              onLostPointerCapture={stopJoystick}
              onTouchStart={(e) => {
                if (e.changedTouches.length > 0) {
                  const t = e.changedTouches[0];
                  updateJoystick(t.clientX, t.clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.changedTouches.length > 0) {
                  const t = e.changedTouches[0];
                  updateJoystick(t.clientX, t.clientY);
                }
              }}
              onTouchEnd={stopJoystick}
              onTouchCancel={stopJoystick}
            >
              <span className="ow-joystick-ring">✥</span>
              <span className="ow-joystick-knob" />
            </div>

            <div className="ow-action-stack">
              {gameState.carriedItemId && (
                <button
                  type="button"
                  className="ow-drop-btn"
                  onClick={handleDropCarriedEquipment}
                >
                  📥 <span>{isAr ? 'ترك المعدة' : 'Drop Item'}</span>
                </button>
              )}
              <button type="button" className="ow-interact" onClick={triggerInteract}>
                ✋{' '}
                <span>
                  {nearby?.kind === 'equipment'
                    ? isAr
                      ? 'التقاط (E)'
                      : 'Pick Up (E)'
                    : nearby?.kind === 'patient'
                      ? isAr
                        ? 'فحص المريض (E)'
                        : 'Patient Care (E)'
                      : isAr
                        ? 'تفاعل (E)'
                        : 'Interact (E)'}
                </span>
              </button>
              <span className="ow-camera-tip">
                {isAr ? 'اسحب الشاشة لتدوير الكاميرا' : 'Drag scene to look around'}
              </span>
            </div>
          </div>
        </div>

        {/* Slide-Out / Side Panel: 8 Playable Missions, Patients Status & Hospital Navigation */}
        <aside
          className={`ow-sidebar ${showGameMenu ? 'ow-sidebar-open' : ''}`}
          aria-hidden={!showGameMenu && isFullscreen}
        >
          <span className="ow-kicker">3D NURSING SIMULATION • 8 MISSIONS</span>
          <h1>
            {isAr
              ? 'مناوبة التمريض التفاعلية في المستشفى'
              : 'Interactive Hospital Nursing Shift'}
          </h1>
          <p>
            {isAr
              ? 'العب دور الممرضة: استلم المهام، التقط المعدات الطبية، افحص المرضى وقِس علاماتهم الحيوية، شغّل أشعة الصدر، سلّم عينات المعمل، وتحقق من الحساسية الدوائية.'
              : 'Play the role of a hospital nurse: receive assignments, carry medical equipment, measure patient vitals, run X-rays, submit lab specimens, and verify medication safety.'}
          </p>

          <div className="ow-mission-list">
            <h2>
              🎯 {isAr ? 'المهام التمريضية الثماني (اضغط لاختيار مهمة):' : '8 Nursing Shift Missions (Tap to select):'}
            </h2>
            {NURSING_SHIFT_MISSIONS.map((m) => {
              const isDone = gameState.completedMissions.includes(m.id);
              const isCurrent = gameState.activeMissionId === m.id;
              const doneObjs = gameState.missionProgress[m.id] || [];
              return (
                <button
                  type="button"
                  key={m.id}
                  className={`ow-mission-card ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`}
                  onClick={() => {
                    setGameState((prev) => ({ ...prev, activeMissionId: m.id }));
                    setShowGameMenu(false);
                  }}
                >
                  <span>{isDone ? '✅' : m.icon}</span>
                  <div>
                    <b>{pick(m.title, lang)}</b>
                    <small>{pick(m.shortScenario, lang)}</small>
                    <small className="ow-obj-counter">
                      {isDone
                        ? isAr
                          ? `مكتملة ✓ (+${m.xpReward} XP)`
                          : `Completed ✓ (+${m.xpReward} XP)`
                        : isAr
                          ? `الخطوات المنجزة: ${doneObjs.length}/${m.objectives.length} • المكافأة +${m.xpReward} XP`
                          : `Objectives: ${doneObjs.length}/${m.objectives.length} • Reward +${m.xpReward} XP`}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="ow-place-list">
            {HOSPITAL_DEPARTMENTS.filter((d) => d.isBuildingShell).map((p) => (
              <button key={p.id} type="button" onClick={() => handleDiscoverDepartment(p)}>
                <span className="ow-place-icon">{p.icon}</span>
                <span>
                  <b>{isAr ? p.ar : p.en}</b>
                  <small>{isAr ? p.subtitleAr : p.subtitleEn}</small>
                </span>
                <span>{gameState.visited.includes(p.name) ? '✓' : '›'}</span>
              </button>
            ))}
          </div>

          <div className="ow-help">
            <b>🎮 {isAr ? 'إرشادات التحكم واللعب' : 'Controls & Gameplay'}</b>
            <p>
              {isAr
                ? 'الكمبيوتر: WASD أو الأسهم للحركة، E للتفاعل/الالتقاط، G لترك المعدة. الهاتف: عصا الحركة على اليسار، سحب الشاشة للكاميرا، وزر التفاعل على اليمين.'
                : 'Desktop: WASD/Arrows to move, E to interact/pick up, G to drop item. Mobile: Left joystick to move, drag screen to look, right buttons to interact.'}
            </p>
          </div>

          <button type="button" className="ow-primary ow-reset" onClick={handleResetSimulation}>
            🔄 {isAr ? 'إعادة بدء المناوبة التمريضية' : 'Restart Nursing Shift'}
          </button>
        </aside>
      </section>

      <footer className="ow-footer">
        {isAr
          ? '⚠️ محاكاة تدريبية وتوعوية خيالية بالكامل — جميع بيانات المرضى والأشعة والتحاليل والأدوية افتراضية للتعلم فقط ولا تُستخدم للتشخيص أو العلاج الواقعي.'
          : '⚠️ Fictional educational simulation — all patient data, X-rays, lab reports, and medication orders are simulated training data and not for real clinical diagnosis.'}
      </footer>
    </main>
  );
}
