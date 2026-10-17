import * as THREE from 'three';
import { NpcDefinition, NpcRole, SIMULATOR_NPCS } from './medicalSimulatorScenarios';
import { EnvironmentTheme, InteractivePropDefinition } from './medicalSimulatorLevels';

export interface BoxObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
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

export interface WardSceneAssets {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  playerRig: AvatarRig;
  npcRigs: Record<NpcRole, AvatarRig>;
  propRigs: Record<string, PropRig>;
  obstacles: BoxObstacle[];
  wardBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  configureLevelEnvironment: (
    theme: EnvironmentTheme,
    props: InteractivePropDefinition[],
    lowGraphics: boolean
  ) => void;
  disposeAll: () => void;
}

/**
 * Helper to create a procedural canvas texture for 3D hospital signs (Arabic & English)
 */
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

    ctx.font = 'bold 34px "IBM Plex Sans Arabic", system-ui, sans-serif';
    ctx.fillText(`${iconText} ${titleAr}`, canvas.width / 2, 68);

    ctx.fillStyle = '#bae6fd';
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.fillText(titleEn, canvas.width / 2, 130);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a stylized low-poly cartoon humanoid character with pivoted limbs for procedural animation.
 */
function createCartoonCharacter(
  outfitColor: number,
  accentColor: number,
  skinColor: number,
  role: NpcRole | 'player',
  lowGraphics: boolean
): AvatarRig {
  const seg = lowGraphics ? 8 : 14;
  const root = new THREE.Group();

  const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
  const outfitMat = new THREE.MeshLambertMaterial({ color: outfitColor });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });

  // Ground shadow / proximity ring
  const ringGeo = new THREE.RingGeometry(0.45, 0.62, lowGraphics ? 16 : 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: role === 'player' ? 0x38bdf8 : 0x22d3ee,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: role === 'player' ? 0.55 : 0.28,
  });
  const highlightRing = new THREE.Mesh(ringGeo, ringMat);
  highlightRing.position.y = 0.02;
  root.add(highlightRing);

  // Legs with hip pivots
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

  // Torso (tunic / coat)
  const torsoGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.78, seg);
  const torso = new THREE.Mesh(torsoGeo, outfitMat);
  torso.position.y = 1.02;
  root.add(torso);

  // Collar / Stethoscope / Role detail
  const collarGeo = new THREE.BoxGeometry(0.32, 0.22, 0.44);
  const collar = new THREE.Mesh(collarGeo, accentMat);
  collar.position.set(0, 1.28, 0.03);
  root.add(collar);

  // Arms with shoulder pivots
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

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.66, 0);

  const headGeo = new THREE.SphereGeometry(0.28, seg, seg);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headGroup.add(headMesh);

  // Eyes (facing +Z)
  const eyeGeo = new THREE.SphereGeometry(0.038, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.position.set(-0.09, 0.04, 0.25);
  const rightEye = new THREE.Mesh(eyeGeo, darkMat);
  rightEye.position.set(0.09, 0.04, 0.25);
  headGroup.add(leftEye, rightEye);

  // Role-specific headgear / accessories
  if (role === 'nurse') {
    const capGeo = new THREE.BoxGeometry(0.36, 0.14, 0.26);
    const cap = new THREE.Mesh(capGeo, accentMat);
    cap.position.set(0, 0.28, 0.02);
    headGroup.add(cap);
  } else if (role === 'doctor') {
    const hairGeo = new THREE.SphereGeometry(0.29, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, darkMat);
    hair.position.y = 0.03;
    headGroup.add(hair);

    const stethoGeo = new THREE.TorusGeometry(0.24, 0.025, 8, 16);
    const stetho = new THREE.Mesh(stethoGeo, darkMat);
    stetho.rotation.x = Math.PI / 2;
    stetho.position.set(0, -0.28, 0.05);
    headGroup.add(stetho);
  } else if (role === 'pharmacist') {
    const glassGeo = new THREE.BoxGeometry(0.34, 0.07, 0.06);
    const glasses = new THREE.Mesh(glassGeo, darkMat);
    glasses.position.set(0, 0.04, 0.26);
    headGroup.add(glasses);

    const hairGeo = new THREE.SphereGeometry(0.29, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, new THREE.MeshLambertMaterial({ color: 0x3b2f2f }));
    hair.position.y = 0.03;
    headGroup.add(hair);
  } else if (role === 'patient') {
    const allergyBandGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.07, 10);
    const allergyBandMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const allergyBand = new THREE.Mesh(allergyBandGeo, allergyBandMat);
    allergyBand.position.y = -0.44;
    rightArmPivot.add(allergyBand);

    const idBandMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const idBand = new THREE.Mesh(allergyBandGeo, idBandMat);
    idBand.position.y = -0.44;
    leftArmPivot.add(idBand);
  } else {
    const capGeo = new THREE.CylinderGeometry(0.27, 0.29, 0.14, seg);
    const capMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.22;
    headGroup.add(cap);
  }

  root.add(headGroup);

  // Quest / Interaction floating diamond beacon for NPCs
  let questBeacon: THREE.Mesh | undefined;
  if (role !== 'player') {
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

/**
 * Builds a 3D interactive clue/puzzle station mesh according to the prop's visual shape.
 */
function createInteractivePropRig(
  propDef: InteractivePropDefinition,
  lowGraphics: boolean
): PropRig {
  const seg = lowGraphics ? 8 : 14;
  const root = new THREE.Group();
  root.position.set(propDef.position[0], propDef.position[1], propDef.position[2]);

  const primaryMat = new THREE.MeshLambertMaterial({ color: propDef.color });
  const accentMat = new THREE.MeshLambertMaterial({ color: propDef.accentColor });
  const pedMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });

  // Glowing ground ring
  const ringGeo = new THREE.RingGeometry(0.55, 0.78, lowGraphics ? 16 : 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: propDef.color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.025;
  root.add(ring);

  // Base pedestal
  const basePed = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.85, seg), pedMat);
  basePed.position.y = 0.425;
  root.add(basePed);

  const floatingPart = new THREE.Group();
  floatingPart.position.y = 1.25;

  if (propDef.shape === 'monitor' || propDef.shape === 'vitals_board') {
    const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.62, 0.14), primaryMat);
    const screenFace = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.5, 0.16), accentMat);
    floatingPart.add(screenFrame, screenFace);
  } else if (propDef.shape === 'medicine_cabinet') {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.9, 0.42), primaryMat);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.45), accentMat);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.45), accentMat);
    floatingPart.add(cab, crossV, crossH);
  } else if (propDef.shape === 'lab_specimen') {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.25, 0.45), primaryMat);
    const tube1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, seg), accentMat);
    tube1.position.set(-0.18, 0.22, 0);
    const tube2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, seg), accentMat);
    tube2.position.set(0.18, 0.22, 0);
    floatingPart.add(rack, tube1, tube2);
  } else if (propDef.shape === 'microbe_scanner') {
    // Stylized 3D Virus icosahedron vs Rod Bacterium capsule
    const virusMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), primaryMat);
    virusMesh.position.set(-0.28, 0.12, 0);
    const bacteriaMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.52, seg), accentMat);
    bacteriaMesh.rotation.z = Math.PI / 4;
    bacteriaMesh.position.set(0.28, 0.12, 0);
    floatingPart.add(virusMesh, bacteriaMesh);
  } else if (propDef.shape === 'sanitizer_ppe') {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.62, seg), primaryMat);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.35), accentMat);
    pump.position.set(0, 0.36, 0.06);
    floatingPart.add(bottle, pump);
  } else {
    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.56, 0.16), primaryMat);
    tablet.rotation.x = -0.35;
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.38, 0.18), accentMat);
    badge.rotation.x = -0.35;
    floatingPart.add(tablet, badge);
  }

  root.add(floatingPart);

  // Floating golden star/octahedron beacon above the clue prop
  const beaconGeo = new THREE.OctahedronGeometry(0.2, 0);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 2.15, 0);
  root.add(beacon);

  return {
    id: propDef.id,
    root,
    floatingPart,
    ring,
    beacon,
  };
}

/**
 * Builds the complete 3D cartoon hospital ward & clinical pharmacy environment,
 * with support for dynamic level themes and interactive 3D props without recreating the WebGLRenderer.
 */
export function buildHospitalWardScene(lowGraphics: boolean): WardSceneAssets {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b192c);
  if (!lowGraphics) {
    scene.fog = new THREE.Fog(0x0b192c, 18, 34);
  }

  const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 60);
  camera.position.set(0, 4.8, 5.5);

  const disposableGeometries: THREE.BufferGeometry[] = [];
  const disposableMaterials: THREE.Material[] = [];
  const disposableTextures: THREE.Texture[] = [];

  const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.72);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.55);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
  dirLight.position.set(6, 12, 8);
  scene.add(dirLight);

  const wardBounds = { minX: -8.8, maxX: 8.8, minZ: -6.8, maxZ: 6.8 };
  const baseObstacles: BoxObstacle[] = [];
  const obstacles: BoxObstacle[] = [];

  // 1. Hospital Floor with Clinical Tile Grid
  const floorGeo = new THREE.PlaneGeometry(20, 16);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
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
  addFloorZone(-4.2, -2.8, 4.6, 3.6, 0xccfbf1);
  addFloorZone(4.5, -2.8, 4.6, 3.6, 0xdbeafe);
  addFloorZone(-5.2, 3.2, 5.2, 4.4, 0xe0f2fe);
  addFloorZone(5.2, 3.4, 4.8, 4.2, 0xd1fae5);

  // 2. Perimeter Walls
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x0e9aa7 });

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

  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3.1, 0.48),
    new THREE.MeshLambertMaterial({ color: 0x0b3c5d })
  );
  doorFrame.position.set(0, 1.55, -7.95);
  scene.add(doorFrame);

  const doorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 2.85, 0.52),
    new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
  );
  doorPanel.position.set(0, 1.45, -7.93);
  scene.add(doorPanel);

  // 3. 3D Department Signs Above Stations
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
    const signGeo = new THREE.BoxGeometry(3.2, 1.1, 0.12);
    const signMat = new THREE.MeshBasicMaterial({ map: tex });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(x, y, z);
    signMesh.rotation.y = rotY;
    scene.add(signMesh);
  };

  addStationSign(-4.2, 3.1, -7.7, 0, 'محطة التمريض', 'Nursing Station', '#0f766e', '#2dd4bf', '👩‍⚕️');
  addStationSign(4.5, 3.1, -7.7, 0, 'مكتب الطبيب الاستشاري', 'Physician Consult', '#1e3a8a', '#60a5fa', '👨‍⚕️');
  addStationSign(-9.7, 3.1, 3.2, Math.PI / 2, 'جناح المرضى - سرير ١', 'Patient Ward - Bed 1', '#0369a1', '#38bdf8', '🛌');
  addStationSign(9.7, 3.1, 3.4, -Math.PI / 2, 'الصيدلية والمختبر', 'Pharmacy & Lab', '#065f46', '#34d399', '💊');

  // 4. Station 1: Nursing Station Desk
  const nurseDesk = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.0, 1.1),
    new THREE.MeshLambertMaterial({ color: 0x0d9488 })
  );
  nurseDesk.position.set(-4.2, 0.5, -3.7);
  scene.add(nurseDesk);
  baseObstacles.push({ minX: -5.8, maxX: -2.6, minZ: -4.4, maxZ: -3.0 });

  const nurseCounterTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.95, 0.1, 1.25),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  nurseCounterTop.position.set(-4.2, 1.05, -3.7);
  scene.add(nurseCounterTop);

  const chartStand = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.4, 0.4),
    new THREE.MeshLambertMaterial({ color: 0xf59e0b })
  );
  chartStand.position.set(-3.4, 1.25, -3.5);
  scene.add(chartStand);

  // 5. Station 2: Doctor Consultation Desk
  const docDesk = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.95, 1.2),
    new THREE.MeshLambertMaterial({ color: 0x1e40af })
  );
  docDesk.position.set(4.5, 0.475, -3.7);
  scene.add(docDesk);
  baseObstacles.push({ minX: 3.0, maxX: 6.0, minZ: -4.5, maxZ: -2.9 });

  const docMonitor = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.5, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x0f172a })
  );
  docMonitor.position.set(4.5, 1.25, -3.9);
  scene.add(docMonitor);

  // 6. Station 3: Patient Hospital Bed
  const bedFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.55, 1.4),
    new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
  );
  bedFrame.position.set(-6.8, 0.275, 3.2);
  scene.add(bedFrame);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 0.28, 1.3),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  mattress.position.set(-6.8, 0.65, 3.2);
  scene.add(mattress);

  const blanket = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.3, 1.32),
    new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
  );
  blanket.position.set(-6.4, 0.66, 3.2);
  scene.add(blanket);

  const headboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 1.25, 1.44),
    new THREE.MeshLambertMaterial({ color: 0x0284c7 })
  );
  headboard.position.set(-8.0, 0.625, 3.2);
  scene.add(headboard);
  baseObstacles.push({ minX: -8.3, maxX: -5.9, minZ: 2.3, maxZ: 4.1 });

  const bed2 = bedFrame.clone();
  bed2.position.set(-6.8, 0.275, 5.5);
  const mat2 = mattress.clone();
  mat2.position.set(-6.8, 0.65, 5.5);
  scene.add(bed2, mat2);
  baseObstacles.push({ minX: -8.3, maxX: -5.4, minZ: 4.7, maxZ: 6.3 });

  // 7. Station 4: Clinical Pharmacy Counter & Shelves
  const pharmCounter = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 1.05, 3.2),
    new THREE.MeshLambertMaterial({ color: 0x059669 })
  );
  pharmCounter.position.set(6.5, 0.525, 3.4);
  scene.add(pharmCounter);
  baseObstacles.push({ minX: 5.7, maxX: 7.4, minZ: 1.6, maxZ: 5.2 });

  const pharmShelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 2.6, 3.0),
    new THREE.MeshLambertMaterial({ color: 0x064e3b })
  );
  pharmShelf.position.set(8.6, 1.3, 3.4);
  scene.add(pharmShelf);
  baseObstacles.push({ minX: 8.0, maxX: 9.2, minZ: 1.7, maxZ: 5.1 });

  const medColors = [0x22c55e, 0xf59e0b, 0xef4444, 0x38bdf8];
  for (let i = 0; i < 4; i++) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.28, 0.45),
      new THREE.MeshLambertMaterial({ color: medColors[i] })
    );
    box.position.set(8.3, 1.1 + (i % 2) * 0.65, 2.5 + i * 0.55);
    scene.add(box);
  }

  // 8. Create Player Avatar & 4 Interactive NPCs
  const playerRig = createCartoonCharacter(0x0284c7, 0xffffff, 0xf6d0b1, 'player', lowGraphics);
  playerRig.root.position.set(0, 0, 1.2);
  playerRig.root.rotation.y = Math.PI;
  scene.add(playerRig.root);

  const npcRigs = {} as Record<NpcRole, AvatarRig>;
  (Object.keys(SIMULATOR_NPCS) as NpcRole[]).forEach((roleKey) => {
    const def: NpcDefinition = SIMULATOR_NPCS[roleKey];
    const rig = createCartoonCharacter(
      def.outfitColor,
      def.accentColor,
      def.skinColor,
      roleKey,
      lowGraphics
    );
    rig.root.position.set(def.position[0], def.position[1], def.position[2]);
    rig.root.rotation.y = def.rotationY;
    scene.add(rig.root);
    npcRigs[roleKey] = rig;

    baseObstacles.push({
      minX: def.position[0] - 0.55,
      maxX: def.position[0] + 0.55,
      minZ: def.position[2] - 0.55,
      maxZ: def.position[2] + 0.55,
    });
  });

  // Dynamic Group for Level-Specific Interactive Props & Atmosphere Decor
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

  const configureLevelEnvironment = (
    theme: EnvironmentTheme,
    props: InteractivePropDefinition[],
    isLowGfx: boolean
  ) => {
    clearDynamicGroup();
    obstacles.length = 0;
    baseObstacles.forEach((ob) => obstacles.push({ ...ob }));

    // Adjust atmosphere lighting, floor, trim & background per level theme
    const themePalettes: Record<
      EnvironmentTheme,
      { bg: number; floor: number; trim: number; wall: number }
    > = {
      ward: { bg: 0x0b192c, floor: 0xe2e8f0, trim: 0x0e9aa7, wall: 0xf1f5f9 },
      er: { bg: 0x1f0a14, floor: 0xfef2f2, trim: 0xdc2626, wall: 0xfff1f2 },
      allergy_clinic: { bg: 0x1c1408, floor: 0xfffbeb, trim: 0xd97706, wall: 0xfef3c7 },
      pharmacy_hub: { bg: 0x062019, floor: 0xecfdf5, trim: 0x059669, wall: 0xd1fae5 },
      home_mystery: { bg: 0x18122b, floor: 0xf5f3ff, trim: 0x7c3aed, wall: 0xede9fe },
      nursing_station: { bg: 0x082026, floor: 0xf0fdfa, trim: 0x0d9488, wall: 0xccfbf1 },
      med_lab: { bg: 0x061a2e, floor: 0xe0f2fe, trim: 0x0284c7, wall: 0xf0f9ff },
      ward_round: { bg: 0x0b192c, floor: 0xe2e8f0, trim: 0x2563eb, wall: 0xf1f5f9 },
      infection_puzzle: { bg: 0x052022, floor: 0xccfbf1, trim: 0x14b8a6, wall: 0xf0fdfa },
      microscopic_3d: { bg: 0x1a0826, floor: 0x2e1065, trim: 0xec4899, wall: 0x3b0764 },
      capstone_mission: { bg: 0x0c192c, floor: 0xfefce8, trim: 0xeab308, wall: 0xf8fafc },
    };

    const pal = themePalettes[theme] || themePalettes.ward;
    scene.background = new THREE.Color(pal.bg);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.setHex(pal.bg);
    }
    floorMat.color.setHex(pal.floor);
    trimMat.color.setHex(pal.trim);
    wallMat.color.setHex(pal.wall);

    // If Microscopic 3D arena (Level 9), add stylized floating 3D microbe spheres in the upper air
    if (theme === 'microscopic_3d') {
      const seg = isLowGfx ? 8 : 12;
      const bGeo = new THREE.IcosahedronGeometry(0.32, 0);
      const bMat1 = new THREE.MeshLambertMaterial({ color: 0xf43f5e });
      const bMat2 = new THREE.MeshLambertMaterial({ color: 0xa855f7 });
      const coords = [
        [-3, 2.8, -1],
        [3, 3.0, -1],
        [-2.5, 2.9, 2.5],
        [2.5, 2.7, 2.5],
      ];
      coords.forEach((c, idx) => {
        const m = new THREE.Mesh(bGeo, idx % 2 === 0 ? bMat1 : bMat2);
        m.position.set(c[0], c[1], c[2]);
        dynamicLevelGroup.add(m);
      });
      void seg;
    }

    // Build 3D interactive props for the current level
    props.forEach((propDef) => {
      const pRig = createInteractivePropRig(propDef, isLowGfx);
      dynamicLevelGroup.add(pRig.root);
      propRigs[propDef.id] = pRig;

      // Small obstacle footprint around the pedestal
      obstacles.push({
        minX: propDef.position[0] - 0.48,
        maxX: propDef.position[0] + 0.48,
        minZ: propDef.position[2] - 0.48,
        maxZ: propDef.position[2] + 0.48,
      });
    });
  };

  // Collect static scene geometries and materials for clean disposal on component unmount
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
    obstacles,
    wardBounds,
    configureLevelEnvironment,
    disposeAll,
  };
}

/**
 * Animates character limb swings, NPC idle gestures, and 3D interactive clue props.
 */
export function updateCharacterAnimations(
  playerRig: AvatarRig,
  npcRigs: Record<NpcRole, AvatarRig>,
  propRigs: Record<string, PropRig>,
  solvedPropIds: string[],
  targetNpc: NpcRole | null,
  nearestNpc: NpcRole | null,
  nearestPropId: string | null,
  isPlayerMoving: boolean,
  elapsedTime: number
): void {
  // Player walk / idle animation
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

  // NPC idle / gesture animations + target beacon pulse
  (Object.keys(npcRigs) as NpcRole[]).forEach((roleKey, idx) => {
    const rig = npcRigs[roleKey];
    const phase = elapsedTime * 2.2 + idx * 1.3;
    rig.headGroup.position.y = 1.66 + Math.sin(phase) * 0.02;
    rig.headGroup.rotation.y = Math.sin(phase * 0.7) * 0.15;

    const isTarget = targetNpc === roleKey;
    const isNear = nearestNpc === roleKey;

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

  // Animate 3D Interactive Clue / Puzzle Props
  Object.keys(propRigs).forEach((propId, idx) => {
    const pRig = propRigs[propId];
    const isSolved = solvedPropIds.includes(propId);
    const isNear = nearestPropId === propId;

    pRig.floatingPart.rotation.y = elapsedTime * 1.2 + idx;
    pRig.floatingPart.position.y = 1.25 + Math.sin(elapsedTime * 3 + idx) * 0.06;

    pRig.beacon.rotation.y = -elapsedTime * 2.8;
    pRig.beacon.position.y = 2.15 + Math.sin(elapsedTime * 4.5) * 0.08;

    const beaconMat = pRig.beacon.material as THREE.MeshBasicMaterial;
    beaconMat.color.setHex(isSolved ? 0x22c55e : isNear ? 0x38bdf8 : 0xfacc15);

    const ringMat = pRig.ring.material as THREE.MeshBasicMaterial;
    ringMat.color.setHex(isSolved ? 0x22c55e : isNear ? 0x38bdf8 : 0xfacc15);
    ringMat.opacity = isNear ? 0.9 : isSolved ? 0.45 : 0.65;
  });
}
