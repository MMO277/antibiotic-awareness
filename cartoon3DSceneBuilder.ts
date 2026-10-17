import * as THREE from 'three';
import { Bilingual } from './types';

export type WorldPreset = 'bacteria_lab' | 'emergency_shift' | 'escape_lab';

export type CustomPropShape =
  | 'microscope_station'
  | 'agar_incubator'
  | 'ast_analyzer'
  | 'biosafety_hood'
  | 'sample_log'
  | 'triage_board'
  | 'er_vitals_monitor'
  | 'allergy_scanner'
  | 'hand_hygiene_station'
  | 'pediatric_airway_monitor'
  | 'uv_hand_scanner'
  | 'ppe_locker'
  | 'keypad_lock'
  | 'specimen_capsule'
  | 'spill_kit'
  | 'waste_sorter'
  | 'exit_vault_console';

export interface BoxObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CustomNpcDef {
  id: string;
  name: Bilingual;
  title: Bilingual;
  stationLabel: Bilingual;
  position: [number, number, number];
  rotationY: number;
  outfitColor: number;
  accentColor: number;
  skinColor: number;
  hatType: 'lab_goggles' | 'doctor_hair' | 'nurse_cap' | 'pharmacist_glasses' | 'patient_band' | 'safety_helmet';
  avatarEmoji: string;
  defaultGreeting: Bilingual;
}

export interface MicroscopeMiniGameConfig {
  specimenId: string;
  specimenTitle: Bilingual;
  gramStainType: 'gram_pos_cocci' | 'gram_neg_rods' | 'viral_no_bacteria' | 'skin_contaminant';
  targetMagnification: '40x' | '100x';
  targetFocusRange: [number, number]; // e.g., [60, 85]
  findingSummary: Bilingual;
}

export interface AstSusceptibilityRow {
  antibiotic: Bilingual;
  awareCategory: 'Access' | 'Watch' | 'Reserve';
  mic: string;
  result: 'S' | 'I' | 'R';
  note: Bilingual;
}

export interface AstReportConfig {
  reportCode: string;
  fictionalPatientLabel: Bilingual;
  specimenSource: Bilingual;
  organismName: Bilingual;
  colonyCount: Bilingual;
  rows: AstSusceptibilityRow[];
  stewardshipNote: Bilingual;
}

export interface TriageCardConfig {
  patientCode: string;
  fictionalCaseName: Bilingual;
  ageGroup: Bilingual;
  chiefComplaint: Bilingual;
  vitals: {
    temp: string;
    hr: string;
    rr: string;
    spo2: string;
    bp: string;
  };
  allergyAlert: Bilingual;
  redFlags: Bilingual[];
}

export interface CustomPropStep {
  id: string;
  prompt: Bilingual;
  hint?: Bilingual;
  options: {
    id: string;
    label: Bilingual;
    isCorrect: boolean;
    feedback: Bilingual;
  }[];
}

export interface CustomPropDef {
  id: string;
  name: Bilingual;
  stationLabel: Bilingual;
  position: [number, number, number];
  color: number;
  accentColor: number;
  iconEmoji: string;
  shape: CustomPropShape;
  puzzleSteps: CustomPropStep[];
  completionClueSummary: Bilingual;
  /** Optional inventory item / keycard awarded when solved (used in Escape the Lab & Lab clues) */
  rewardItem?: {
    id: string;
    icon: string;
    label: Bilingual;
  };
  /** Optional interactive microscope mini-game shown inside this station modal */
  microscopeConfig?: MicroscopeMiniGameConfig;
  /** Optional fictional culture & susceptibility (AST) table shown inside this station modal */
  astReportConfig?: AstReportConfig;
  /** Optional ER triage & vitals card shown inside this station modal */
  triageCardConfig?: TriageCardConfig;
}

export interface AvatarRig {
  root: THREE.Group;
  headGroup: THREE.Group;
  torso: THREE.Mesh;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  highlightRing?: THREE.Mesh;
  questBeacon?: THREE.Mesh;
}

export interface PropRig {
  id: string;
  root: THREE.Group;
  floatingPart: THREE.Object3D;
  ring: THREE.Mesh;
  beacon: THREE.Mesh;
}

export interface SecurityDoorRig {
  doorGroup: THREE.Group;
  leftPanel: THREE.Mesh;
  rightPanel: THREE.Mesh;
  laserBar: THREE.Mesh;
  statusLight: THREE.Mesh;
}

export interface CustomSceneAssets {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  playerRig: AvatarRig;
  npcRigs: Record<string, AvatarRig>;
  propRigs: Record<string, PropRig>;
  doorRigs: SecurityDoorRig[];
  obstacles: BoxObstacle[];
  worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  configureMissionEnvironment: (
    accentHex: number,
    props: CustomPropDef[],
    lowGraphics: boolean
  ) => void;
  disposeAll: () => void;
}

function createSignTexture(
  titleAr: string,
  titleEn: string,
  bgColor: string,
  borderColor: string,
  iconText: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 32px "IBM Plex Sans Arabic", system-ui, sans-serif';
    ctx.fillText(`${iconText} ${titleAr}`, canvas.width / 2, 66);

    ctx.fillStyle = '#bae6fd';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText(titleEn, canvas.width / 2, 130);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createCartoonCharacter(
  outfitColor: number,
  accentColor: number,
  skinColor: number,
  hatType: CustomNpcDef['hatType'] | 'player',
  lowGraphics: boolean
): AvatarRig {
  const seg = lowGraphics ? 8 : 14;
  const root = new THREE.Group();

  const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
  const outfitMat = new THREE.MeshLambertMaterial({ color: outfitColor });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });

  const ringGeo = new THREE.RingGeometry(0.45, 0.62, lowGraphics ? 16 : 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: hatType === 'player' ? 0x38bdf8 : 0x22d3ee,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: hatType === 'player' ? 0.55 : 0.28,
  });
  const highlightRing = new THREE.Mesh(ringGeo, ringMat);
  highlightRing.position.y = 0.02;
  root.add(highlightRing);

  const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.62, seg);
  const shoeGeo = new THREE.BoxGeometry(0.22, 0.12, 0.32);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.16, 0.65, 0);
  const leftLeg = new THREE.Mesh(legGeo, darkMat);
  leftLeg.position.y = -0.31;
  const leftShoe = new THREE.Mesh(shoeGeo, accentMat);
  leftShoe.position.set(0, -0.58, 0.05);
  leftLegPivot.add(leftLeg, leftShoe);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.16, 0.65, 0);
  const rightLeg = new THREE.Mesh(legGeo, darkMat);
  rightLeg.position.y = -0.31;
  const rightShoe = new THREE.Mesh(shoeGeo, accentMat);
  rightShoe.position.set(0, -0.58, 0.05);
  rightLegPivot.add(rightLeg, rightShoe);

  root.add(leftLegPivot, rightLegPivot);

  const torsoGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.78, seg);
  const torso = new THREE.Mesh(torsoGeo, outfitMat);
  torso.position.y = 1.02;
  root.add(torso);

  const collarGeo = new THREE.BoxGeometry(0.32, 0.22, 0.44);
  const collar = new THREE.Mesh(collarGeo, accentMat);
  collar.position.set(0, 1.28, 0.03);
  root.add(collar);

  const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.56, seg);
  const handGeo = new THREE.SphereGeometry(0.09, seg, seg);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.38, 1.32, 0);
  const leftArm = new THREE.Mesh(armGeo, outfitMat);
  leftArm.position.y = -0.26;
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.y = -0.54;
  leftArmPivot.add(leftArm, leftHand);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.38, 1.32, 0);
  const rightArm = new THREE.Mesh(armGeo, outfitMat);
  rightArm.position.y = -0.26;
  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.y = -0.54;
  rightArmPivot.add(rightArm, rightHand);

  root.add(leftArmPivot, rightArmPivot);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.66, 0);

  const headGeo = new THREE.SphereGeometry(0.28, seg, seg);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headGroup.add(headMesh);

  const eyeGeo = new THREE.SphereGeometry(0.038, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.position.set(-0.09, 0.04, 0.25);
  const rightEye = new THREE.Mesh(eyeGeo, darkMat);
  rightEye.position.set(0.09, 0.04, 0.25);
  headGroup.add(leftEye, rightEye);

  if (hatType === 'nurse_cap') {
    const capGeo = new THREE.BoxGeometry(0.36, 0.14, 0.26);
    const cap = new THREE.Mesh(capGeo, accentMat);
    cap.position.set(0, 0.28, 0.02);
    headGroup.add(cap);
  } else if (hatType === 'doctor_hair') {
    const hairGeo = new THREE.SphereGeometry(0.29, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, darkMat);
    hair.position.y = 0.03;
    headGroup.add(hair);

    const stethoGeo = new THREE.TorusGeometry(0.24, 0.025, 8, 16);
    const stetho = new THREE.Mesh(stethoGeo, darkMat);
    stetho.rotation.x = Math.PI / 2;
    stetho.position.set(0, -0.28, 0.05);
    headGroup.add(stetho);
  } else if (hatType === 'lab_goggles' || hatType === 'pharmacist_glasses') {
    const goggleFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.1, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
    );
    goggleFrame.position.set(0, 0.05, 0.25);
    headGroup.add(goggleFrame);

    const hairGeo = new THREE.SphereGeometry(0.29, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, new THREE.MeshLambertMaterial({ color: 0x334155 }));
    hair.position.y = 0.03;
    headGroup.add(hair);
  } else if (hatType === 'patient_band') {
    const allergyBandGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.07, 10);
    const allergyBandMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const allergyBand = new THREE.Mesh(allergyBandGeo, allergyBandMat);
    allergyBand.position.y = -0.44;
    rightArmPivot.add(allergyBand);
  } else if (hatType === 'safety_helmet') {
    const helmetGeo = new THREE.SphereGeometry(0.31, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const helmet = new THREE.Mesh(helmetGeo, new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    helmet.position.y = 0.05;
    headGroup.add(helmet);
  } else {
    const capGeo = new THREE.CylinderGeometry(0.27, 0.29, 0.14, seg);
    const capMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.22;
    headGroup.add(cap);
  }

  root.add(headGroup);

  let questBeacon: THREE.Mesh | undefined;
  if (hatType !== 'player') {
    const beaconGeo = new THREE.OctahedronGeometry(0.18, 0);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    questBeacon = new THREE.Mesh(beaconGeo, beaconMat);
    questBeacon.position.set(0, 2.35, 0);
    root.add(questBeacon);
  }

  return {
    root,
    headGroup,
    torso,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    highlightRing,
    questBeacon,
  };
}

function createInteractivePropRig(propDef: CustomPropDef, lowGraphics: boolean): PropRig {
  const seg = lowGraphics ? 8 : 14;
  const root = new THREE.Group();
  root.position.set(propDef.position[0], propDef.position[1], propDef.position[2]);

  const primaryMat = new THREE.MeshLambertMaterial({ color: propDef.color });
  const accentMat = new THREE.MeshLambertMaterial({ color: propDef.accentColor });
  const pedMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });

  // Glowing ground ring
  const ringGeo = new THREE.RingGeometry(0.58, 0.82, lowGraphics ? 16 : 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: propDef.color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.68,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.025;
  root.add(ring);

  // Base pedestal
  const basePed = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.52, 0.85, seg), pedMat);
  basePed.position.y = 0.425;
  root.add(basePed);

  const floatingPart = new THREE.Group();
  floatingPart.position.y = 1.26;

  switch (propDef.shape) {
    case 'microscope_station': {
      // Stylized 3D Binocular Microscope
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.45), whiteMat);
      base.position.y = -0.25;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.16), primaryMat);
      arm.position.set(0, 0.02, -0.12);
      const stage = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.36), pedMat);
      stage.position.set(0, -0.02, 0.05);
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.12), accentMat);
      slide.position.set(0, 0.02, 0.05);
      const tube1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.32, seg), accentMat);
      tube1.position.set(-0.07, 0.32, 0.04);
      tube1.rotation.x = 0.45;
      const tube2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.32, seg), accentMat);
      tube2.position.set(0.07, 0.32, 0.04);
      tube2.rotation.x = 0.45;
      floatingPart.add(base, arm, stage, slide, tube1, tube2);
      break;
    }
    case 'agar_incubator': {
      // Stylized 3D Petri Dish with Antibiotic Susceptibility Disks
      const dishOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, seg), primaryMat);
      dishOuter.rotation.x = 0.55;
      const agar = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.14, seg), accentMat);
      agar.rotation.x = 0.55;
      const diskGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.16, 10);
      const d1 = new THREE.Mesh(diskGeo, whiteMat);
      d1.rotation.x = 0.55;
      d1.position.set(-0.15, 0.06, 0.04);
      const d2 = new THREE.Mesh(diskGeo, whiteMat);
      d2.rotation.x = 0.55;
      d2.position.set(0.15, -0.04, -0.03);
      floatingPart.add(dishOuter, agar, d1, d2);
      break;
    }
    case 'ast_analyzer':
    case 'triage_board':
    case 'er_vitals_monitor':
    case 'pediatric_airway_monitor': {
      const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.64, 0.14), primaryMat);
      const screenFace = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.52, 0.16), accentMat);
      const pulseBar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.18), whiteMat);
      floatingPart.add(screenFrame, screenFace, pulseBar);
      break;
    }
    case 'biosafety_hood':
    case 'ppe_locker': {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.88, 0.44), primaryMat);
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.48, 0.46), accentMat);
      shield.position.y = 0.08;
      floatingPart.add(cab, shield);
      break;
    }
    case 'uv_hand_scanner':
    case 'hand_hygiene_station': {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.64, seg), primaryMat);
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.36), accentMat);
      pump.position.set(0, 0.38, 0.06);
      const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.11, seg, seg), whiteMat);
      droplet.position.set(0, 0.55, 0.18);
      floatingPart.add(bottle, pump, droplet);
      break;
    }
    case 'waste_sorter': {
      // Three mini color-coded bins
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.48, seg), new THREE.MeshLambertMaterial({ color: 0xeab308 }));
      b1.position.x = -0.28;
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.48, 0.24), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
      const b3 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.48, seg), new THREE.MeshLambertMaterial({ color: 0x38bdf8 }));
      b3.position.x = 0.28;
      floatingPart.add(b1, b2, b3);
      break;
    }
    case 'keypad_lock':
    case 'exit_vault_console': {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.78, 0.18), primaryMat);
      const lockRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 18), accentMat);
      lockRing.position.z = 0.11;
      floatingPart.add(panel, lockRing);
      break;
    }
    default: {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.25, 0.45), primaryMat);
      const tube1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.56, seg), accentMat);
      tube1.position.set(-0.18, 0.22, 0);
      const tube2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.56, seg), whiteMat);
      tube2.position.set(0.18, 0.22, 0);
      floatingPart.add(rack, tube1, tube2);
      break;
    }
  }

  root.add(floatingPart);

  const beaconGeo = new THREE.OctahedronGeometry(0.21, 0);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 2.18, 0);
  root.add(beacon);

  return {
    id: propDef.id,
    root,
    floatingPart,
    ring,
    beacon,
  };
}

export function buildCustomWorldScene(
  preset: WorldPreset,
  npcs: CustomNpcDef[],
  lowGraphics: boolean
): CustomSceneAssets {
  const scene = new THREE.Scene();
  const bgHex =
    preset === 'bacteria_lab'
      ? 0x071a2c
      : preset === 'emergency_shift'
      ? 0x1a0b12
      : 0x091d24;

  scene.background = new THREE.Color(bgHex);
  if (!lowGraphics) {
    scene.fog = new THREE.Fog(bgHex, 19, 36);
  }

  const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 60);
  camera.position.set(0, 4.8, 5.8);

  const disposableGeometries: THREE.BufferGeometry[] = [];
  const disposableMaterials: THREE.Material[] = [];
  const disposableTextures: THREE.Texture[] = [];

  const ambientLight = new THREE.AmbientLight(0xe0f2fe, 0.74);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.55);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.78);
  dirLight.position.set(6, 12, 8);
  scene.add(dirLight);

  const worldBounds = { minX: -8.8, maxX: 8.8, minZ: -6.8, maxZ: 6.8 };
  const baseObstacles: BoxObstacle[] = [];
  const obstacles: BoxObstacle[] = [];
  const doorRigs: SecurityDoorRig[] = [];

  // Floor & Grid
  const floorGeo = new THREE.PlaneGeometry(20, 16);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshLambertMaterial({
    color:
      preset === 'bacteria_lab'
        ? 0xe0f2fe
        : preset === 'emergency_shift'
        ? 0xfef2f2
        : 0xecfeff,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  scene.add(floorMesh);

  const gridHelper = new THREE.GridHelper(20, 20, 0x94a3b8, 0xcbd5e1);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  const addFloorZone = (x: number, z: number, w: number, d: number, color: number) => {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, 0.015, z);
    scene.add(mesh);
  };

  // Perimeter Walls
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
  const trimMat = new THREE.MeshLambertMaterial({
    color:
      preset === 'bacteria_lab'
        ? 0x0284c7
        : preset === 'emergency_shift'
        ? 0xdc2626
        : 0x0d9488,
  });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 4.2, 0.4), wallMat);
  backWall.position.set(0, 2.1, -8);
  scene.add(backWall);

  const backTrim = new THREE.Mesh(new THREE.BoxGeometry(20, 0.35, 0.44), trimMat);
  backTrim.position.set(0, 1.1, -7.98);
  scene.add(backTrim);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 16), wallMat);
  leftWall.position.set(-10, 2.1, 0);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 16), wallMat);
  rightWall.position.set(10, 2.1, 0);
  scene.add(rightWall);

  const addStationSign = (
    x: number,
    y: number,
    z: number,
    rotY: number,
    ar: string,
    en: string,
    bg: string,
    border: string,
    icon: string
  ) => {
    const tex = createSignTexture(ar, en, bg, border, icon);
    disposableTextures.push(tex);
    const signGeo = new THREE.BoxGeometry(3.3, 1.1, 0.12);
    const signMat = new THREE.MeshBasicMaterial({ map: tex });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(x, y, z);
    signMesh.rotation.y = rotY;
    scene.add(signMesh);
  };

  if (preset === 'bacteria_lab') {
    // ── GAME 1: BACTERIA LAB 3D ENVIRONMENT ────────────────────────────────────
    addFloorZone(-4.6, -3.2, 5.2, 3.8, 0xbae6fd);
    addFloorZone(4.6, -3.2, 5.2, 3.8, 0xccfbf1);
    addFloorZone(-5.2, 3.2, 5.2, 4.2, 0xe0e7ff);
    addFloorZone(5.2, 3.2, 5.2, 4.2, 0xd1fae5);

    addStationSign(-4.5, 3.1, -7.7, 0, 'محطة المجهر وصبغة جرام', 'Microscope & Gram Stain', '#0369a1', '#38bdf8', '🔬');
    addStationSign(4.5, 3.1, -7.7, 0, 'الحاضنة ومزارع البكتيريا', 'Incubator & Agar Cultures', '#0f766e', '#2dd4bf', '🧫');
    addStationSign(-9.7, 3.1, 3.2, Math.PI / 2, 'استقبال العينات والسلامة الحيوية', 'Sample Reception & Biosafety', '#3730a3', '#818cf8', '🧪');
    addStationSign(9.7, 3.1, 3.2, -Math.PI / 2, 'تقارير الحساسية الدوائية AST', 'AST Susceptibility & Stewardship', '#065f46', '#34d399', '📊');

    // Bench 1: Optical Microscope Bench (Top-Left)
    const microBench = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.95, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x0284c7 })
    );
    microBench.position.set(-4.5, 0.475, -4.2);
    const microTop = new THREE.Mesh(
      new THREE.BoxGeometry(3.35, 0.1, 1.32),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    microTop.position.set(-4.5, 1.0, -4.2);
    scene.add(microBench, microTop);
    baseObstacles.push({ minX: -6.3, maxX: -2.7, minZ: -4.9, maxZ: -3.5 });

    // Bench 2: Incubator & Culture Reader (Top-Right)
    const incCabinet = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.3, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x0f766e })
    );
    incCabinet.position.set(5.4, 1.15, -4.3);
    const incGlass = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.4, 1.24),
      new THREE.MeshLambertMaterial({ color: 0x5eead4 })
    );
    incGlass.position.set(5.4, 1.3, -4.3);
    const cultureDesk = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.95, 1.1),
      new THREE.MeshLambertMaterial({ color: 0x115e59 })
    );
    cultureDesk.position.set(3.5, 0.475, -4.2);
    scene.add(incCabinet, incGlass, cultureDesk);
    baseObstacles.push({ minX: 2.5, maxX: 6.3, minZ: -5.0, maxZ: -3.5 });

    // Bench 3: Class II Biosafety Cabinet & Sample Reception (Bottom-Left)
    const hoodBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.2, 2.8),
      new THREE.MeshLambertMaterial({ color: 0x312e81 })
    );
    hoodBase.position.set(-7.6, 1.1, 3.2);
    const hoodSash = new THREE.Mesh(
      new THREE.BoxGeometry(1.46, 0.9, 2.4),
      new THREE.MeshLambertMaterial({ color: 0x93c5fd })
    );
    hoodSash.position.set(-7.6, 1.35, 3.2);
    scene.add(hoodBase, hoodSash);
    baseObstacles.push({ minX: -8.5, maxX: -6.7, minZ: 1.7, maxZ: 4.7 });

    // Bench 4: AST Susceptibility & Stewardship Terminal (Bottom-Right)
    const astDesk = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.0, 3.0),
      new THREE.MeshLambertMaterial({ color: 0x047857 })
    );
    astDesk.position.set(7.2, 0.5, 3.2);
    const astMonitor1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.55, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x0f172a })
    );
    astMonitor1.position.set(7.2, 1.3, 2.6);
    const astMonitor2 = astMonitor1.clone();
    astMonitor2.position.set(7.2, 1.3, 3.7);
    scene.add(astDesk, astMonitor1, astMonitor2);
    baseObstacles.push({ minX: 6.3, maxX: 8.1, minZ: 1.6, maxZ: 4.8 });
  } else if (preset === 'emergency_shift') {
    // ── GAME 2: EMERGENCY SHIFT 3D ENVIRONMENT ─────────────────────────────────
    addFloorZone(-4.5, -3.2, 5.2, 3.8, 0xfee2e2);
    addFloorZone(4.5, -3.2, 5.2, 3.8, 0xdbeafe);
    addFloorZone(-5.4, 3.2, 5.2, 4.4, 0xffedd5);
    addFloorZone(5.4, 3.2, 5.2, 4.4, 0xd1fae5);

    addStationSign(-4.5, 3.1, -7.7, 0, 'فرز الطوارئ وعلامات الإنذار', 'ED Triage & Red Flags', '#991b1b', '#f87171', '🚨');
    addStationSign(4.5, 3.1, -7.7, 0, 'استشارة أخصائي الطوارئ', 'ER Attending Consult', '#1e3a8a', '#60a5fa', '👨‍⚕️');
    addStationSign(-9.7, 3.1, 3.2, Math.PI / 2, 'عنبر الطوارئ وأسرّة الملاحظة', 'ER Patient Bays 1 & 2', '#9a3412', '#fb923c', '🛌');
    addStationSign(9.7, 3.1, 3.2, -Math.PI / 2, 'سلامة الحساسية ومكافحة العدوى', 'Allergy & IPC Safety Hub', '#065f46', '#34d399', '🛡️');

    // Triage Reception Counter (Top-Left)
    const triageDesk = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 1.05, 1.2),
      new THREE.MeshLambertMaterial({ color: 0xb91c1c })
    );
    triageDesk.position.set(-4.5, 0.525, -4.0);
    const triageTop = new THREE.Mesh(
      new THREE.BoxGeometry(3.15, 0.12, 1.32),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    triageTop.position.set(-4.5, 1.1, -4.0);
    scene.add(triageDesk, triageTop);
    baseObstacles.push({ minX: -6.2, maxX: -2.8, minZ: -4.8, maxZ: -3.2 });

    // Attending Physician Command Desk (Top-Right)
    const erDocDesk = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.98, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x1e40af })
    );
    erDocDesk.position.set(4.5, 0.49, -4.0);
    scene.add(erDocDesk);
    baseObstacles.push({ minX: 2.9, maxX: 6.1, minZ: -4.8, maxZ: -3.2 });

    // ER Stretcher Beds 1 & 2 + Red Crash Cart (Bottom-Left)
    const buildStretcher = (zPos: number, blanketHex: number) => {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.58, 1.35),
        new THREE.MeshLambertMaterial({ color: 0x64748b })
      );
      frame.position.set(-7.0, 0.29, zPos);
      const mat = new THREE.Mesh(
        new THREE.BoxGeometry(2.35, 0.26, 1.25),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      mat.position.set(-7.0, 0.68, zPos);
      const bl = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.28, 1.27),
        new THREE.MeshLambertMaterial({ color: blanketHex })
      );
      bl.position.set(-6.6, 0.7, zPos);
      scene.add(frame, mat, bl);
      baseObstacles.push({ minX: -8.4, maxX: -5.6, minZ: zPos - 0.8, maxZ: zPos + 0.8 });
    };
    buildStretcher(2.2, 0xf97316);
    buildStretcher(5.0, 0x38bdf8);

    const crashCart = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.15, 0.65),
      new THREE.MeshLambertMaterial({ color: 0xdc2626 })
    );
    crashCart.position.set(-7.4, 0.575, 3.6);
    scene.add(crashCart);

    // Allergy & IPC Pharmacy Safety Station (Bottom-Right)
    const safetyCounter = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 1.05, 3.1),
      new THREE.MeshLambertMaterial({ color: 0x059669 })
    );
    safetyCounter.position.set(7.0, 0.525, 3.3);
    scene.add(safetyCounter);
    baseObstacles.push({ minX: 6.1, maxX: 7.9, minZ: 1.6, maxZ: 5.0 });
  } else {
    // ── GAME 3: ESCAPE THE LAB 3D MULTI-ROOM ENVIRONMENT ───────────────────────
    // Zone 1 (South/Front: Airlock & PPE), Zone 2 (Middle: Specimen & Containment), Zone 3 (North/Back: Waste & Exit Vault)
    addFloorZone(0, 4.4, 17.5, 4.0, 0xcffafe); // Room 1: Airlock & PPE
    addFloorZone(0, 0.0, 17.5, 4.2, 0xe0e7ff); // Room 2: Specimen & Spill Containment
    addFloorZone(0, -4.6, 17.5, 4.2, 0xd1fae5); // Room 3: Waste Segregation & Master Exit

    addStationSign(-4.6, 3.1, -7.7, 0, 'غرفة ٣: فرز النفايات وبوابة الخروج', 'Room 3: Waste & Exit Vault', '#065f46', '#34d399', '🚪');
    addStationSign(4.6, 3.1, -7.7, 0, 'بروتوكول أمان المختبر النهائي', 'Master Safety Protocol', '#0f766e', '#2dd4bf', '🔐');
    addStationSign(-9.7, 3.1, 0.0, Math.PI / 2, 'غرفة ٢: فحص العينات والاحتواء', 'Room 2: Specimen & Containment', '#3730a3', '#818cf8', '🧪');
    addStationSign(9.7, 3.1, 4.4, -Math.PI / 2, 'غرفة ١: غرفة التعقيم ومعدات الوقاية', 'Room 1: Hygiene & PPE Airlock', '#0369a1', '#38bdf8', '🧤');

    // Interior Divider Partition Rows with 3D Security Laser Gates (walkable central doorway)
    const buildPartitionWithLaserGate = (zCoord: number) => {
      const partMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
      const leftWallSeg = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.6, 0.32), partMat);
      leftWallSeg.position.set(-6.6, 1.3, zCoord);
      const rightWallSeg = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.6, 0.32), partMat);
      rightWallSeg.position.set(6.6, 1.3, zCoord);
      scene.add(leftWallSeg, rightWallSeg);

      baseObstacles.push({ minX: -9.8, maxX: -3.3, minZ: zCoord - 0.3, maxZ: zCoord + 0.3 });
      baseObstacles.push({ minX: 3.3, maxX: 9.8, minZ: zCoord - 0.3, maxZ: zCoord + 0.3 });

      // Archway Frame over the central passage (-3.3 to +3.3)
      const archTop = new THREE.Mesh(
        new THREE.BoxGeometry(6.8, 0.45, 0.42),
        new THREE.MeshLambertMaterial({ color: 0x0f172a })
      );
      archTop.position.set(0, 2.8, zCoord);
      scene.add(archTop);

      const doorGroup = new THREE.Group();
      const glassMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.28,
      });
      const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.12), glassMat);
      leftPanel.position.set(-2.2, 1.2, zCoord);
      const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.12), glassMat);
      rightPanel.position.set(2.2, 1.2, zCoord);

      const laserBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 6.4, 8),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      laserBar.rotation.z = Math.PI / 2;
      laserBar.position.set(0, 2.45, zCoord);

      const statusLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      statusLight.position.set(0, 3.1, zCoord);

      doorGroup.add(leftPanel, rightPanel, laserBar, statusLight);
      scene.add(doorGroup);
      doorRigs.push({ doorGroup, leftPanel, rightPanel, laserBar, statusLight });
    };

    buildPartitionWithLaserGate(2.2);
    buildPartitionWithLaserGate(-2.3);

    // Master Exit Vault Door on Back Wall (x=0, z=-7.85)
    const vaultFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 3.3, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x064e3b })
    );
    vaultFrame.position.set(0, 1.65, -7.88);
    const vaultDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.9, 0.56),
      new THREE.MeshLambertMaterial({ color: 0x10b981 })
    );
    vaultDoor.position.set(0, 1.5, -7.84);
    scene.add(vaultFrame, vaultDoor);
  }

  // Create Player Avatar
  const playerRig = createCartoonCharacter(0x0284c7, 0xffffff, 0xf6d0b1, 'player', lowGraphics);
  playerRig.root.position.set(0, 0, 4.6);
  playerRig.root.rotation.y = Math.PI;
  scene.add(playerRig.root);

  // Create NPCs
  const npcRigs: Record<string, AvatarRig> = {};
  npcs.forEach((def) => {
    const rig = createCartoonCharacter(
      def.outfitColor,
      def.accentColor,
      def.skinColor,
      def.hatType,
      lowGraphics
    );
    rig.root.position.set(def.position[0], def.position[1], def.position[2]);
    rig.root.rotation.y = def.rotationY;
    scene.add(rig.root);
    npcRigs[def.id] = rig;

    baseObstacles.push({
      minX: def.position[0] - 0.55,
      maxX: def.position[0] + 0.55,
      minZ: def.position[2] - 0.55,
      maxZ: def.position[2] + 0.55,
    });
  });

  const dynamicLevelGroup = new THREE.Group();
  scene.add(dynamicLevelGroup);
  const propRigs: Record<string, PropRig> = {};

  const clearDynamicGroup = () => {
    dynamicLevelGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });
    dynamicLevelGroup.clear();
    Object.keys(propRigs).forEach((k) => delete propRigs[k]);
  };

  const configureMissionEnvironment = (
    accentHex: number,
    props: CustomPropDef[],
    isLowGfx: boolean
  ) => {
    clearDynamicGroup();
    obstacles.length = 0;
    baseObstacles.forEach((ob) => obstacles.push({ ...ob }));
    trimMat.color.setHex(accentHex);

    props.forEach((propDef) => {
      const pRig = createInteractivePropRig(propDef, isLowGfx);
      dynamicLevelGroup.add(pRig.root);
      propRigs[propDef.id] = pRig;

      obstacles.push({
        minX: propDef.position[0] - 0.48,
        maxX: propDef.position[0] + 0.48,
        minZ: propDef.position[2] - 0.48,
        maxZ: propDef.position[2] + 0.48,
      });
    });
  };

  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
      if (obj.geometry) disposableGeometries.push(obj.geometry);
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => disposableMaterials.push(m));
      } else if (obj.material) {
        disposableMaterials.push(obj.material);
      }
    }
  });

  const disposeAll = () => {
    clearDynamicGroup();
    disposableGeometries.forEach((g) => g.dispose());
    disposableMaterials.forEach((m) => m.dispose());
    disposableTextures.forEach((t) => t.dispose());
    scene.clear();
  };

  return {
    scene,
    camera,
    playerRig,
    npcRigs,
    propRigs,
    doorRigs,
    obstacles,
    worldBounds,
    configureMissionEnvironment,
    disposeAll,
  };
}

export function updateCustomSceneAnimations(
  playerRig: AvatarRig,
  npcRigs: Record<string, AvatarRig>,
  propRigs: Record<string, PropRig>,
  doorRigs: SecurityDoorRig[],
  solvedPropIds: string[],
  totalPropsCount: number,
  targetNpcId: string | null,
  nearestNpcId: string | null,
  nearestPropId: string | null,
  isPlayerMoving: boolean,
  elapsedTime: number
): void {
  if (isPlayerMoving) {
    const swing = Math.sin(elapsedTime * 10) * 0.55;
    playerRig.leftLegPivot.rotation.x = swing;
    playerRig.rightLegPivot.rotation.x = -swing;
    playerRig.leftArmPivot.rotation.x = -swing * 0.8;
    playerRig.rightArmPivot.rotation.x = swing * 0.8;
    playerRig.headGroup.position.y = 1.66 + Math.abs(Math.sin(elapsedTime * 10)) * 0.04;
  } else {
    playerRig.leftLegPivot.rotation.x *= 0.85;
    playerRig.rightLegPivot.rotation.x *= 0.85;
    playerRig.leftArmPivot.rotation.x = Math.sin(elapsedTime * 2) * 0.05;
    playerRig.rightArmPivot.rotation.x = -Math.sin(elapsedTime * 2) * 0.05;
    playerRig.headGroup.position.y = 1.66 + Math.sin(elapsedTime * 2.5) * 0.015;
  }

  Object.keys(npcRigs).forEach((npcId, idx) => {
    const rig = npcRigs[npcId];
    const phase = elapsedTime * 2.2 + idx * 1.3;
    rig.headGroup.position.y = 1.66 + Math.sin(phase) * 0.02;
    rig.headGroup.rotation.y = Math.sin(phase * 0.7) * 0.15;

    const isTarget = targetNpcId === npcId;
    const isNear = nearestNpcId === npcId;

    if (isNear || isTarget) {
      rig.rightArmPivot.rotation.z = -0.35 - Math.sin(elapsedTime * 5) * 0.2;
      rig.rightArmPivot.rotation.x = -0.45;
    } else {
      rig.rightArmPivot.rotation.z = 0;
      rig.rightArmPivot.rotation.x = Math.sin(phase) * 0.06;
    }

    if (rig.questBeacon) {
      rig.questBeacon.visible = isTarget || isNear;
      rig.questBeacon.rotation.y = elapsedTime * 2.5;
      rig.questBeacon.position.y = 2.35 + Math.sin(elapsedTime * 4) * 0.08;
      const mat = rig.questBeacon.material as THREE.MeshBasicMaterial;
      mat.color.setHex(isNear ? 0x22c55e : 0x38bdf8);
    }

    if (rig.highlightRing) {
      const ringMat = rig.highlightRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = isNear ? 0.85 : isTarget ? 0.55 : 0.22;
      ringMat.color.setHex(isNear ? 0x22c55e : 0x38bdf8);
    }
  });

  Object.keys(propRigs).forEach((propId, idx) => {
    const pRig = propRigs[propId];
    const isSolved = solvedPropIds.includes(propId);
    const isNear = nearestPropId === propId;

    pRig.floatingPart.rotation.y = elapsedTime * 1.2 + idx;
    pRig.floatingPart.position.y = 1.26 + Math.sin(elapsedTime * 3 + idx) * 0.06;

    pRig.beacon.rotation.y = -elapsedTime * 2.8;
    pRig.beacon.position.y = 2.18 + Math.sin(elapsedTime * 4.5) * 0.08;

    const beaconMat = pRig.beacon.material as THREE.MeshBasicMaterial;
    beaconMat.color.setHex(isSolved ? 0x22c55e : isNear ? 0x38bdf8 : 0xfacc15);

    const ringMat = pRig.ring.material as THREE.MeshBasicMaterial;
    ringMat.color.setHex(isSolved ? 0x22c55e : isNear ? 0x38bdf8 : 0xfacc15);
    ringMat.opacity = isNear ? 0.9 : isSolved ? 0.45 : 0.68;
  });

  // Animate security laser doors in Escape the Lab as clues get solved
  doorRigs.forEach((dRig, idx) => {
    const unlocked = solvedPropIds.length > idx || (totalPropsCount > 0 && solvedPropIds.length >= totalPropsCount);
    const lightMat = dRig.statusLight.material as THREE.MeshBasicMaterial;
    const barMat = dRig.laserBar.material as THREE.MeshBasicMaterial;
    lightMat.color.setHex(unlocked ? 0x22c55e : 0xfacc15);
    barMat.color.setHex(unlocked ? 0x22c55e : 0xef4444);

    // Slide panels outward smoothly when unlocked
    const targetOffset = unlocked ? 2.75 : 2.1;
    dRig.leftPanel.position.x += (-targetOffset - dRig.leftPanel.position.x) * 0.1;
    dRig.rightPanel.position.x += (targetOffset - dRig.rightPanel.position.x) * 0.1;
  });
}
