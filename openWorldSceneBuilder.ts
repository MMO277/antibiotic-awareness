import * as THREE from 'three';
import {
  EquipmentId,
  HOSPITAL_DEPARTMENTS,
  HOSPITAL_EQUIPMENT_ITEMS,
  HOSPITAL_PATIENTS,
  HOSPITAL_STAFF_NPCS,
  HOSPITAL_WORKSTATIONS,
  PatientDef,
  PatientSimState,
} from './openWorldHospitalData';

export interface BoxObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface PatientVisualRig {
  def: PatientDef;
  group: THREE.Group;
  marker: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  torso: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  head: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
}

export interface EquipmentVisualRig {
  id: EquipmentId;
  mesh: THREE.Group;
  homePos: THREE.Vector3;
  worldPos: THREE.Vector3;
  holder: 'world' | 'player' | 'placed';
}

export interface WalkingPedestrian {
  group: THREE.Group;
  outfit: THREE.Mesh;
  centerX: number;
  centerZ: number;
  radius: number;
  speed: number;
  phase: number;
}

export interface OpenWorldSceneRuntime {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  playerGroup: THREE.Group;
  playerCarryAnchor: THREE.Group;
  playerTorso: THREE.Mesh;
  playerLimbs: THREE.Mesh[];
  playerShoes: THREE.Mesh[];
  waypointGroup: THREE.Group;
  waypointRing: THREE.Mesh;
  compassArrow: THREE.Group;
  patientRigs: Record<string, PatientVisualRig>;
  equipmentRigs: Record<string, EquipmentVisualRig>;
  pedestrians: WalkingPedestrian[];
  ambulanceBeaconRed: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  ambulanceBeaconBlue: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  obstacles: BoxObstacle[];
  checkBlocked: (x: number, z: number) => boolean;
  syncEquipmentAttachments: (
    carriedItemId: EquipmentId | null,
    placedItems: Record<string, EquipmentId[]>,
    droppedPositions: Record<string, { x: number; z: number }>,
  ) => void;
  syncPatientVisuals: (patientStates: Record<string, PatientSimState>) => void;
  dispose: () => void;
}

function createSignCanvasTexture(
  titleAr: string,
  titleEn: string,
  badgeIcon: string,
  accentHex: string,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 160);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 148);

    ctx.fillStyle = accentHex;
    ctx.fillRect(14, 14, 88, 132);

    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badgeIcon, 58, 80);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(titleAr.slice(0, 34), 118, 56);

    ctx.fillStyle = '#93c5fd';
    ctx.font = '600 22px sans-serif';
    ctx.fillText(titleEn.slice(0, 38), 118, 108);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function buildOpenWorldHospitalScene(
  width: number,
  height: number,
): OpenWorldSceneRuntime {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdbeafe);
  scene.fog = new THREE.FogExp2(0xdbeafe, 0.0085);

  const camera = new THREE.PerspectiveCamera(56, width / height, 0.1, 220);
  camera.position.set(0, 8.5, 5);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x334155, 1.08);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfffbeb, 1.15);
  sun.position.set(22, 36, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 110;
  const d = 48;
  sun.shadow.camera.left = -d;
  sun.shadow.camera.right = d;
  sun.shadow.camera.top = d;
  sun.shadow.camera.bottom = -d;
  scene.add(sun);

  const obstacles: BoxObstacle[] = [];
  const texturesToDispose: THREE.Texture[] = [];

  // Campus Ground & Hospital Courtyard
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(116, 116),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.92 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Green landscaped hospital park border
  const lawn = new THREE.Mesh(
    new THREE.PlaneGeometry(104, 104),
    new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.94 }),
  );
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0.01;
  lawn.receiveShadow = true;
  scene.add(lawn);

  // Paved Hospital Walkways & Medical Corridors
  const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
  const laneMarkMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.25,
  });

  const mainCorridorNS = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.05, 76), walkwayMat);
  mainCorridorNS.position.set(0, 0.025, 0);
  mainCorridorNS.receiveShadow = true;
  scene.add(mainCorridorNS);

  const crossCorridorNorth = new THREE.Mesh(new THREE.BoxGeometry(56, 0.05, 6.8), walkwayMat);
  crossCorridorNorth.position.set(0, 0.025, -4);
  crossCorridorNorth.receiveShadow = true;
  scene.add(crossCorridorNorth);

  const crossCorridorSouth = new THREE.Mesh(new THREE.BoxGeometry(56, 0.05, 6.8), walkwayMat);
  crossCorridorSouth.position.set(0, 0.025, 19);
  crossCorridorSouth.receiveShadow = true;
  scene.add(crossCorridorSouth);

  // Guided medical floor strips connecting departments
  const stripNS = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 68), laneMarkMat);
  stripNS.position.set(0, 0.03, -1);
  scene.add(stripNS);

  const stripEW1 = new THREE.Mesh(new THREE.BoxGeometry(46, 0.06, 0.35), laneMarkMat);
  stripEW1.position.set(0, 0.03, -4);
  scene.add(stripEW1);

  const stripEW2 = new THREE.Mesh(new THREE.BoxGeometry(46, 0.06, 0.35), laneMarkMat);
  stripEW2.position.set(0, 0.03, 19);
  scene.add(stripEW2);

  // Build Enterable Walkable Hospital Buildings with Real Doorways, Interior Floors, Partition Walls, Signage, and Lighting
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.32,
    roughness: 0.2,
    metalness: 0.3,
  });

  for (const dept of HOSPITAL_DEPARTMENTS) {
    if (!dept.isBuildingShell) continue;

    const bGroup = new THREE.Group();
    bGroup.position.set(dept.x, 0, dept.z);
    scene.add(bGroup);

    const wallThick = 0.45;
    const doorWidth = 5.4;
    const doorHeight = 3.6;
    const halfW = dept.w / 2;
    const halfD = dept.d / 2;

    // Interior clinical tile floor
    const floorTile = new THREE.Mesh(
      new THREE.BoxGeometry(dept.w - 0.2, 0.08, dept.d - 0.2),
      new THREE.MeshStandardMaterial({ color: dept.color, roughness: 0.65 }),
    );
    floorTile.position.set(0, 0.04, 0);
    floorTile.receiveShadow = true;
    bGroup.add(floorTile);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: dept.roofColor,
      roughness: 0.4,
    });

    const addWallSegment = (
      lx: number,
      ly: number,
      lz: number,
      sw: number,
      sh: number,
      sd: number,
      addCollider = true,
      mat: THREE.Material = wallMat,
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), mat);
      m.position.set(lx, ly, lz);
      m.castShadow = true;
      m.receiveShadow = true;
      bGroup.add(m);
      if (addCollider) {
        obstacles.push({
          minX: dept.x + lx - sw / 2 - 0.45,
          maxX: dept.x + lx + sw / 2 + 0.45,
          minZ: dept.z + lz - sd / 2 - 0.45,
          maxZ: dept.z + lz + sd / 2 + 0.45,
        });
      }
    };

    // North Wall (z = -halfD)
    if (dept.doorSide === 'north') {
      const segW = (dept.w - doorWidth) / 2;
      addWallSegment(-halfW + segW / 2, dept.h / 2, -halfD, segW, dept.h, wallThick);
      addWallSegment(halfW - segW / 2, dept.h / 2, -halfD, segW, dept.h, wallThick);
      addWallSegment(0, doorHeight + (dept.h - doorHeight) / 2, -halfD, doorWidth, dept.h - doorHeight, wallThick, false, accentMat);
    } else {
      addWallSegment(0, dept.h / 2, -halfD, dept.w, dept.h, wallThick);
    }

    // South Wall (z = +halfD)
    if (dept.doorSide === 'south') {
      const segW = (dept.w - doorWidth) / 2;
      addWallSegment(-halfW + segW / 2, dept.h / 2, halfD, segW, dept.h, wallThick);
      addWallSegment(halfW - segW / 2, dept.h / 2, halfD, segW, dept.h, wallThick);
      addWallSegment(0, doorHeight + (dept.h - doorHeight) / 2, halfD, doorWidth, dept.h - doorHeight, wallThick, false, accentMat);
    } else {
      addWallSegment(0, dept.h / 2, halfD, dept.w, dept.h, wallThick);
    }

    // West Wall (x = -halfW)
    if (dept.doorSide === 'west') {
      const segD = (dept.d - doorWidth) / 2;
      addWallSegment(-halfW, dept.h / 2, -halfD + segD / 2, wallThick, dept.h, segD);
      addWallSegment(-halfW, dept.h / 2, halfD - segD / 2, wallThick, dept.h, segD);
      addWallSegment(-halfW, doorHeight + (dept.h - doorHeight) / 2, 0, wallThick, dept.h - doorHeight, doorWidth, false, accentMat);
    } else {
      addWallSegment(-halfW, dept.h / 2, 0, wallThick, dept.h, dept.d);
    }

    // East Wall (x = +halfW)
    if (dept.doorSide === 'east') {
      const segD = (dept.d - doorWidth) / 2;
      addWallSegment(halfW, dept.h / 2, -halfD + segD / 2, wallThick, dept.h, segD);
      addWallSegment(halfW, dept.h / 2, halfD - segD / 2, wallThick, dept.h, segD);
      addWallSegment(halfW, doorHeight + (dept.h - doorHeight) / 2, 0, wallThick, dept.h - doorHeight, doorWidth, false, accentMat);
    } else {
      addWallSegment(halfW, dept.h / 2, 0, wallThick, dept.h, dept.d);
    }

    // Open-top roof cornice frame so third-person camera can see clearly inside rooms while preserving architectural realism
    const corniceH = 0.55;
    addWallSegment(0, dept.h + corniceH / 2, -halfD, dept.w + 0.4, corniceH, 0.7, false, accentMat);
    addWallSegment(0, dept.h + corniceH / 2, halfD, dept.w + 0.4, corniceH, 0.7, false, accentMat);
    addWallSegment(-halfW, dept.h + corniceH / 2, 0, 0.7, corniceH, dept.d + 0.4, false, accentMat);
    addWallSegment(halfW, dept.h + corniceH / 2, 0, 0.7, corniceH, dept.d + 0.4, false, accentMat);

    // Translucent glass sliding door wings (pushed open to sides so player walks right in)
    const doorPane1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, doorHeight - 0.2, 0.12), glassMat);
    const doorPane2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, doorHeight - 0.2, 0.12), glassMat);
    if (dept.doorSide === 'south' || dept.doorSide === 'north') {
      const dz = dept.doorSide === 'south' ? halfD : -halfD;
      doorPane1.position.set(-doorWidth / 2 - 0.5, doorHeight / 2, dz + 0.18);
      doorPane2.position.set(doorWidth / 2 + 0.5, doorHeight / 2, dz + 0.18);
    } else {
      const dx = dept.doorSide === 'east' ? halfW : -halfW;
      doorPane1.rotation.y = Math.PI / 2;
      doorPane2.rotation.y = Math.PI / 2;
      doorPane1.position.set(dx + 0.18, doorHeight / 2, -doorWidth / 2 - 0.5);
      doorPane2.position.set(dx + 0.18, doorHeight / 2, doorWidth / 2 + 0.5);
    }
    bGroup.add(doorPane1, doorPane2);

    // Illuminated Overhead Bilingual Hospital Signboard above entrance
    const hexStr = '#' + dept.roofColor.toString(16).padStart(6, '0');
    const signTex = createSignCanvasTexture(dept.ar, dept.en, dept.icon, hexStr);
    texturesToDispose.push(signTex);
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 1.9, 0.22),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3 }),
    );
    if (dept.doorSide === 'south') {
      signBoard.position.set(0, dept.h - 0.9, halfD + 0.32);
    } else if (dept.doorSide === 'north') {
      signBoard.position.set(0, dept.h - 0.9, -halfD - 0.32);
      signBoard.rotation.y = Math.PI;
    } else if (dept.doorSide === 'east') {
      signBoard.position.set(halfW + 0.32, dept.h - 0.9, 0);
      signBoard.rotation.y = Math.PI / 2;
    } else {
      signBoard.position.set(-halfW - 0.32, dept.h - 0.9, 0);
      signBoard.rotation.y = -Math.PI / 2;
    }
    bGroup.add(signBoard);
  }

  // Interior Partition Walls for Patient Wards 101, 102, 103 inside Main Hospital
  const dividerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
  for (const xDiv of [-4.8, 4.8]) {
    const divWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.2, 6.2), dividerMat);
    divWall.position.set(xDiv, 1.6, -28.2);
    divWall.castShadow = true;
    scene.add(divWall);
    obstacles.push({
      minX: xDiv - 0.45,
      maxX: xDiv + 0.45,
      minZ: -31.5,
      maxZ: -25.0,
    });
  }

  // Build Workstations & Recognizable Department Equipment (Nursing Station, X-Ray Scanner, Lab Analyzer, Pharmacy Counter, Exam Table, Supply Shelf)
  for (const ws of HOSPITAL_WORKSTATIONS) {
    const wsGroup = new THREE.Group();
    wsGroup.position.set(ws.x, 0, ws.z);
    scene.add(wsGroup);

    if (ws.kind === 'nursing_station') {
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 1.08, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 }),
      );
      counter.position.y = 0.54;
      counter.castShadow = true;
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.12, 1.65),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }),
      );
      top.position.y = 1.12;
      const monitor = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.55, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x38bdf8, emissiveIntensity: 0.45 }),
      );
      monitor.position.set(-0.9, 1.48, 0);
      wsGroup.add(counter, top, monitor);
      obstacles.push({ minX: ws.x - 2.5, maxX: ws.x + 2.5, minZ: ws.z - 0.9, maxZ: ws.z + 0.9 });
    } else if (ws.kind === 'xray_console') {
      // X-Ray Gantry Table + Lead Shielded Console
      const scannerTable = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.85, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }),
      );
      scannerTable.position.set(-1.5, 0.42, -1.6);
      const xrayArch = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.18, 12, 28, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.3, roughness: 0.35 }),
      );
      xrayArch.position.set(-1.5, 0.85, -1.6);
      const consoleDesk = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.05, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 }),
      );
      consoleDesk.position.set(0, 0.52, 0);
      const lightbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.75, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x38bdf8, emissiveIntensity: 0.85 }),
      );
      lightbox.position.set(0, 1.45, 0);
      wsGroup.add(scannerTable, xrayArch, consoleDesk, lightbox);
      obstacles.push({ minX: ws.x - 1.1, maxX: ws.x + 1.1, minZ: ws.z - 0.7, maxZ: ws.z + 0.7 });
    } else if (ws.kind === 'lab_analyzer') {
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.98, 1.25),
        new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.45 }),
      );
      bench.position.y = 0.49;
      const centrifuge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.38, 0.48, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.25 }),
      );
      centrifuge.position.set(-0.7, 1.22, 0);
      const microscope = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.62, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 }),
      );
      microscope.position.set(0.65, 1.28, 0);
      wsGroup.add(bench, centrifuge, microscope);
      obstacles.push({ minX: ws.x - 1.7, maxX: ws.x + 1.7, minZ: ws.z - 0.8, maxZ: ws.z + 0.8 });
    } else if (ws.kind === 'pharmacy_counter') {
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 1.05, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.45 }),
      );
      counter.position.y = 0.52;
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 2.2, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xecfdf5, roughness: 0.6 }),
      );
      shelf.position.set(0, 1.1, 1.4);
      wsGroup.add(counter, shelf);
      obstacles.push({ minX: ws.x - 1.8, maxX: ws.x + 1.8, minZ: ws.z - 0.75, maxZ: ws.z + 0.75 });
    } else {
      const table = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.92, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }),
      );
      table.position.y = 0.46;
      wsGroup.add(table);
      obstacles.push({ minX: ws.x - 1.15, maxX: ws.x + 1.15, minZ: ws.z - 0.65, maxZ: ws.z + 0.65 });
    }
  }

  // Emergency Ambulance Parked at ER Entrance (-14.5, -9.5)
  const ambGroup = new THREE.Group();
  ambGroup.position.set(-14.2, 0, -9.8);
  ambGroup.rotation.y = Math.PI / 6;
  const ambBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.85, 4.6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
  );
  ambBody.position.y = 1.15;
  ambBody.castShadow = true;
  const ambStripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.54, 0.36, 4.62),
    new THREE.MeshStandardMaterial({ color: 0xef4444 }),
  );
  ambStripe.position.y = 1.12;
  const ambulanceBeaconRed = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.1 }),
  );
  ambulanceBeaconRed.position.set(-0.55, 2.18, 1.4);
  const ambulanceBeaconBlue = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 1.1 }),
  );
  ambulanceBeaconBlue.position.set(0.55, 2.18, 1.4);
  ambGroup.add(ambBody, ambStripe, ambulanceBeaconRed, ambulanceBeaconBlue);
  scene.add(ambGroup);
  obstacles.push({ minX: -16.2, maxX: -12.2, minZ: -12.2, maxZ: -7.4 });

  // Build Interactive Patients with Hospital Beds, IV Poles, Headboards, and Status Beacons
  const patientRigs: Record<string, PatientVisualRig> = {};
  const bedFrameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4, roughness: 0.5 });
  const mattressMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
  const blanketMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.75 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.65 });

  for (const pt of HOSPITAL_PATIENTS) {
    const pGroup = new THREE.Group();
    pGroup.position.set(pt.x, 0, pt.z);
    scene.add(pGroup);

    if (pt.inBed) {
      const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 2.5), bedFrameMat);
      bedFrame.position.y = 0.25;
      bedFrame.castShadow = true;
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 2.35), mattressMat);
      mattress.position.y = 0.56;
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.24, 1.45), blanketMat);
      blanket.position.set(0, 0.58, 0.35);
      const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.52, 1.05, 0.16), bedFrameMat);
      headboard.position.set(0, 0.62, -1.2);
      // IV Stand next to bed
      const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 8), bedFrameMat);
      ivPole.position.set(0.95, 0.95, -0.8);
      const ivBag = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.09, 0.22, 6, 10),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 }),
      );
      ivBag.position.set(0.95, 1.72, -0.8);
      pGroup.add(bedFrame, mattress, blanket, headboard, ivPole, ivBag);
      obstacles.push({ minX: pt.x - 0.9, maxX: pt.x + 0.9, minZ: pt.z - 1.35, maxZ: pt.z + 1.35 });
    } else {
      // Exam chair
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.55, 0.95), bedFrameMat);
      chair.position.y = 0.28;
      pGroup.add(chair);
      obstacles.push({ minX: pt.x - 0.65, maxX: pt.x + 0.65, minZ: pt.z - 0.65, maxZ: pt.z + 0.65 });
    }

    const torsoMat = new THREE.MeshStandardMaterial({ color: pt.outfitColor, roughness: 0.6 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.52, 8, 14), torsoMat);
    torso.position.set(0, pt.inBed ? 0.88 : 1.02, pt.inBed ? -0.25 : 0);
    if (pt.inBed) torso.rotation.x = -Math.PI / 3.2;
    torso.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), skinMat);
    head.position.set(0, pt.inBed ? 1.12 : 1.56, pt.inBed ? -0.68 : 0);
    head.castShadow = true;

    const markerMat = new THREE.MeshStandardMaterial({
      color: pt.initialVisualState === 'distress' ? 0xef4444 : 0xf59e0b,
      emissive: pt.initialVisualState === 'distress' ? 0xef4444 : 0xd97706,
      emissiveIntensity: 0.95,
    });
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), markerMat);
    marker.position.set(0, 2.25, 0);

    pGroup.add(torso, head, marker);
    patientRigs[pt.id] = { def: pt, group: pGroup, marker, torso, head };
  }

  // Build Hospital Staff NPCs
  for (const st of HOSPITAL_STAFF_NPCS) {
    const sGroup = new THREE.Group();
    sGroup.position.set(st.x, 0, st.z);
    const coat = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.78, 8, 14),
      new THREE.MeshStandardMaterial({ color: st.color, roughness: 0.5 }),
    );
    coat.position.y = 1.05;
    coat.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), skinMat);
    head.position.y = 1.72;
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.12, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 }),
    );
    badge.position.set(0.14, 1.25, 0.28);
    sGroup.add(coat, head, badge);
    scene.add(sGroup);
  }

  // Build Pickable & Carryable 3D Medical Equipment Items
  const equipmentRigs: Record<string, EquipmentVisualRig> = {};
  for (const eq of HOSPITAL_EQUIPMENT_ITEMS) {
    const eqGroup = new THREE.Group();
    const baseBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.32, 0.36),
      new THREE.MeshStandardMaterial({
        color: eq.color,
        roughness: 0.35,
        metalness: 0.2,
      }),
    );
    baseBox.position.y = 0.22;
    baseBox.castShadow = true;

    const handleCross = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.08, 0.38),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: eq.color, emissiveIntensity: 0.35 }),
    );
    handleCross.position.y = 0.41;

    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.36, 20),
      new THREE.MeshBasicMaterial({ color: eq.color, side: THREE.DoubleSide }),
    );
    beaconRing.rotation.x = -Math.PI / 2;
    beaconRing.position.y = 0.05;

    eqGroup.add(baseBox, handleCross, beaconRing);

    const homePos = new THREE.Vector3(eq.spawnX, 0.85, eq.spawnZ);
    eqGroup.position.copy(homePos);
    if (eq.id === 'eq-collected-specimen') {
      eqGroup.visible = false;
    }
    scene.add(eqGroup);

    equipmentRigs[eq.id] = {
      id: eq.id,
      mesh: eqGroup,
      homePos,
      worldPos: homePos.clone(),
      holder: 'world',
    };
  }

  // Build Nurse Player Avatar with Carry Anchor & Stethoscope
  const playerGroup = new THREE.Group();
  playerGroup.position.set(0, 0, -8);

  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 24),
    new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.28 }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.03;

  const scrubMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.55 });
  const coatTrimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const trouserMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

  const playerTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.56, 8, 16), scrubMat);
  playerTorso.position.y = 1.35;
  playerTorso.castShadow = true;

  const nurseBadge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), coatTrimMat);
  nurseBadge.position.set(0.15, 1.5, 0.31);

  const playerHead = new THREE.Mesh(new THREE.SphereGeometry(0.29, 20, 20), skinMat);
  playerHead.position.y = 2.05;
  playerHead.castShadow = true;

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat,
  );
  hairCap.position.y = 2.09;

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.44, 6, 10), scrubMat);
  leftArm.position.set(-0.44, 1.34, 0);
  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.44, 6, 10), scrubMat);
  rightArm.position.set(0.44, 1.34, 0);

  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.48, 6, 10), trouserMat);
  leftLeg.position.set(-0.17, 0.56, 0);
  const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.48, 6, 10), trouserMat);
  rightLeg.position.set(0.17, 0.56, 0);

  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.38), shoeMat);
  leftShoe.position.set(-0.17, 0.16, 0.06);
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.38), shoeMat);
  rightShoe.position.set(0.17, 0.16, 0.06);

  // Anchor point in front of nurse hands for visibly carrying medical equipment
  const playerCarryAnchor = new THREE.Group();
  playerCarryAnchor.position.set(0, 1.26, 0.52);

  playerGroup.add(
    shadowDisc,
    playerTorso,
    nurseBadge,
    playerHead,
    hairCap,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftShoe,
    rightShoe,
    playerCarryAnchor,
  );
  scene.add(playerGroup);

  // Active Mission 3D Waypoint Beacon & Overhead Direction Arrow
  const waypointGroup = new THREE.Group();
  const waypointRing = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 1.15, 28),
    new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    }),
  );
  waypointRing.rotation.x = -Math.PI / 2;
  waypointRing.position.y = 0.08;

  const waypointPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.55, 3.8, 18, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
    }),
  );
  waypointPillar.position.y = 1.9;
  waypointGroup.add(waypointRing, waypointPillar);
  scene.add(waypointGroup);

  // Floating directional compass arrow above player pointing to active objective
  const compassArrow = new THREE.Group();
  const arrowCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.46, 12),
    new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
    }),
  );
  arrowCone.rotation.x = Math.PI / 2;
  compassArrow.add(arrowCone);
  scene.add(compassArrow);

  // Courtyard Trees & Benches + Walking Hospital Visitors
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
  const treeCoords: Array<[number, number]> = [
    [-11, -11],
    [11, -11],
    [-11, 8],
    [11, 8],
    [-36, -18],
    [36, -18],
    [-36, 10],
    [36, 10],
  ];
  for (const [tx, tz] of treeCoords) {
    const tGroup = new THREE.Group();
    tGroup.position.set(tx, 0, tz);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.5, 8), trunkMat);
    trunk.position.y = 0.75;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 12), leafMat);
    crown.position.y = 2.1;
    tGroup.add(trunk, crown);
    scene.add(tGroup);
    obstacles.push({ minX: tx - 0.55, maxX: tx + 0.55, minZ: tz - 0.55, maxZ: tz + 0.55 });
  }

  const pedestrians: WalkingPedestrian[] = [];
  const pedPresets = [
    { x: -5.5, z: 6.5, r: 2.2, s: 0.65, c: 0x0ea5e9 },
    { x: 5.5, z: 6.5, r: 2.2, s: 0.58, c: 0x14b8a6 },
  ];
  pedPresets.forEach((p, i) => {
    const g = new THREE.Group();
    const outfit = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.24, 0.55, 6, 10),
      new THREE.MeshStandardMaterial({ color: p.c, roughness: 0.6 }),
    );
    outfit.position.y = 1.05;
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 12), skinMat);
    h.position.y = 1.65;
    g.add(outfit, h);
    scene.add(g);
    pedestrians.push({
      group: g,
      outfit,
      centerX: p.x,
      centerZ: p.z,
      radius: p.r,
      speed: p.s,
      phase: i * 2.1,
    });
  });

  const checkBlocked = (x: number, z: number): boolean => {
    if (x < -45 || x > 45 || z < -45 || z > 45) return true;
    for (const b of obstacles) {
      if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) {
        return true;
      }
    }
    return false;
  };

  const syncEquipmentAttachments = (
    carriedItemId: EquipmentId | null,
    placedItems: Record<string, EquipmentId[]>,
    droppedPositions: Record<string, { x: number; z: number }>,
  ) => {
    for (const eq of HOSPITAL_EQUIPMENT_ITEMS) {
      const rig = equipmentRigs[eq.id];
      if (!rig) continue;

      if (carriedItemId === eq.id) {
        if (rig.mesh.parent !== playerCarryAnchor) {
          playerCarryAnchor.add(rig.mesh);
        }
        rig.mesh.visible = true;
        rig.mesh.position.set(0, 0, 0);
        rig.mesh.rotation.set(0, 0, 0);
        rig.holder = 'player';
        rig.worldPos.copy(playerGroup.position);
        continue;
      }

      if (rig.mesh.parent !== scene) {
        scene.add(rig.mesh);
      }

      // Check if placed at a workstation
      let placedWsId: string | null = null;
      for (const [wsId, list] of Object.entries(placedItems)) {
        if (Array.isArray(list) && list.includes(eq.id)) {
          placedWsId = wsId;
          break;
        }
      }

      if (placedWsId) {
        const ws = HOSPITAL_WORKSTATIONS.find((w) => w.id === placedWsId);
        if (ws) {
          rig.mesh.visible = true;
          rig.mesh.position.set(ws.x + 0.45, 1.08, ws.z);
          rig.worldPos.set(ws.x + 0.45, 1.08, ws.z);
          rig.holder = 'placed';
          continue;
        }
      }

      // Check if dropped on the floor by the player
      const dropped = droppedPositions[eq.id];
      if (dropped) {
        rig.mesh.visible = true;
        rig.mesh.position.set(dropped.x, 0.15, dropped.z);
        rig.worldPos.set(dropped.x, 0.15, dropped.z);
        rig.holder = 'world';
        continue;
      }

      // Default spawn position
      if (eq.id === 'eq-collected-specimen') {
        rig.mesh.visible = false;
      } else {
        rig.mesh.visible = true;
      }
      rig.mesh.position.copy(rig.homePos);
      rig.worldPos.copy(rig.homePos);
      rig.holder = 'world';
    }
  };

  const syncPatientVisuals = (patientStates: Record<string, PatientSimState>) => {
    for (const [ptId, rig] of Object.entries(patientRigs)) {
      const st = patientStates[ptId];
      if (!st) continue;
      if (st.visualState === 'stabilized' || st.chartRecorded || st.medicationAdministered) {
        rig.marker.material.color.setHex(0x10b981);
        rig.marker.material.emissive.setHex(0x059669);
      } else if (st.visualState === 'distress') {
        rig.marker.material.color.setHex(0xef4444);
        rig.marker.material.emissive.setHex(0xdc2626);
      } else {
        rig.marker.material.color.setHex(0xf59e0b);
        rig.marker.material.emissive.setHex(0xd97706);
      }
    }
  };

  const dispose = () => {
    texturesToDispose.forEach((t) => t.dispose());
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  };

  return {
    scene,
    camera,
    playerGroup,
    playerCarryAnchor,
    playerTorso,
    playerLimbs: [leftArm, rightArm, leftLeg, rightLeg],
    playerShoes: [leftShoe, rightShoe],
    waypointGroup,
    waypointRing,
    compassArrow,
    patientRigs,
    equipmentRigs,
    pedestrians,
    ambulanceBeaconRed,
    ambulanceBeaconBlue,
    obstacles,
    checkBlocked,
    syncEquipmentAttachments,
    syncPatientVisuals,
    dispose,
  };
}
