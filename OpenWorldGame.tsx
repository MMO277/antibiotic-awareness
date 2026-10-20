import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { useLang } from './i18n';
import { useAuth } from './authContext';
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import './OpenWorldGame.css';

type Place = { name: string; ar: string; en: string; x: number; z: number; color: number; icon: string; fact: string; factEn: string };
const PLACES: Place[] = [
  { name: 'hospital', ar: 'المستشفى', en: 'Hospital', x: 0, z: -17, color: 0xf2f7ff, icon: '✚', fact: 'في المستشفى، اسأل الفريق الطبي عن سبب وصف المضاد الحيوي وكيفية استخدامه بأمان.', factEn: 'At the hospital, ask your care team why an antibiotic was prescribed and how to use it safely.' },
  { name: 'pharmacy', ar: 'الصيدلية', en: 'Pharmacy', x: 15, z: -2, color: 0xd1fae5, icon: '+', fact: 'الصيدلي يساعدك على فهم الجرعة الموصوفة، والتداخلات، وطريقة حفظ الدواء.', factEn: 'A pharmacist can explain your prescribed dose, interactions, and medicine storage.' },
  { name: 'learning', ar: 'مركز التعلّم', en: 'Learning Center', x: -15, z: -3, color: 0xdbeafe, icon: '★', fact: 'المضادات الحيوية تعالج بعض العدوى البكتيرية، ولا تعالج نزلات البرد والإنفلونزا الفيروسية.', factEn: 'Antibiotics treat some bacterial infections, not viral colds or flu.' },
  { name: 'community', ar: 'المركز المجتمعي', en: 'Community Hub', x: 0, z: 16, color: 0xf3e8ff, icon: '♥', fact: 'لا تشارك المضاد الحيوي مع الآخرين، ولا تستخدم بقايا وصفة قديمة.', factEn: 'Never share antibiotics or use leftover medicine from an old prescription.' },
  { name: 'radiology', ar: 'مركز الأشعة', en: 'Radiology Center', x: -27, z: -18, color: 0xd9f0f8, icon: '✳', fact: 'الأشعة تساعد الفريق الطبي على تقييم بعض الحالات، ويشرح لك المختص سبب الفحص وكيفية الاستعداد له.', factEn: 'Imaging helps clinicians assess some conditions; staff can explain why a scan is needed and how to prepare.' },
  { name: 'laboratory', ar: 'المعمل المركزي', en: 'Central Laboratory', x: 27, z: -18, color: 0xe0f2e8, icon: '⚗', fact: 'قد تساعد نتائج الفحوصات المناسبة على اختيار العلاج الصحيح، ولا تُفسّر النتائج بمعزل عن الطبيب.', factEn: 'Appropriate test results can help guide treatment; results should be interpreted with a clinician.' },
  { name: 'emergency', ar: 'الطوارئ', en: 'Emergency Department', x: 27, z: 17, color: 0xffe3dc, icon: '✚', fact: 'في الحالات الطارئة اطلب المساعدة الطبية فورًا، ولا تعتمد على نصائح اللعبة لاتخاذ قرارات علاجية.', factEn: 'Seek urgent medical help in emergencies; never use game guidance to make treatment decisions.' },
];

function makeLabelTexture(titleAr: string, titleEn: string, accent: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 768; canvas.height = 220;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#10243a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = accent; ctx.lineWidth = 12; ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 58px system-ui, sans-serif'; ctx.fillText(titleAr, canvas.width / 2, 78);
    ctx.fillStyle = '#bae6fd'; ctx.font = '600 34px system-ui, sans-serif'; ctx.fillText(titleEn, canvas.width / 2, 155);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function makeBuilding(scene: THREE.Scene, p: Place) {
  const group = new THREE.Group(); group.position.set(p.x, 0, p.z);
  const accent = p.name === 'hospital' || p.name === 'emergency' ? '#ef4444' : p.name === 'pharmacy' || p.name === 'laboratory' ? '#10b981' : p.name === 'learning' || p.name === 'radiology' ? '#3b82f6' : '#a855f7';
  const wallMat = new THREE.MeshStandardMaterial({ color: p.color, roughness: .92 });
  const innerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: .96 });
  const trimMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accent), roughness: .72 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9bdcf5, roughness: .18, metalness: .08, emissive: 0x164e63, emissiveIntensity: .12 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(9.6, .18, 8.2), new THREE.MeshStandardMaterial({ color: 0xe4e9ed, roughness: 1 })); floor.position.y = .08; floor.receiveShadow = true; group.add(floor);
  // A walk-in shell: split front wall leaves a real doorway; low roof wings frame the facade without hiding the interior from the game camera.
  const addWall = (w:number,h:number,d:number,x:number,y:number,z:number,mat=wallMat) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; group.add(mesh); };
  addWall(.28,4.4,8.2,-4.8,2.2,0); addWall(.28,4.4,8.2,4.8,2.2,0); addWall(9.6,4.4,.28,0,2.2,-4.1);
  addWall(3.15,4.4,.28,-3.2,2.2,4.1); addWall(3.15,4.4,.28,3.2,2.2,4.1);
  // Roof strips create a visible building silhouette while preserving a clear view into the rooms.
  addWall(9.8,.28,1.1,0,4.45,-3.65,trimMat); addWall(2.8,.28,1.1,-3.45,4.45,3.65,trimMat); addWall(2.8,.28,1.1,3.45,4.45,3.65,trimMat);
  // Entrance frame, glass panels, and room divider make this read as a building rather than a single box.
  addWall(.18,2.5,.18,-1.1,1.25,4.12,trimMat); addWall(.18,2.5,.18,1.1,1.25,4.12,trimMat); addWall(2.2,.15,.18,0,2.52,4.12,trimMat);
  addWall(3.3,2.4,.12,-2.65,2.15,-.25,innerMat); addWall(3.3,2.4,.12,2.65,2.15,-.25,innerMat);
  // Simple recognizable room furniture; all pieces are inside the open building footprint.
  const bedMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: .85 });
  const furniture = (w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material) => { const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; group.add(m); };
  if (p.name === 'hospital') {
    furniture(1.9,.35,2.4,-2.5,.55,-2.35,bedMat); furniture(1.9,.18,1.15,-2.5,.82,-2.35,new THREE.MeshStandardMaterial({color:0xffffff}));
    furniture(1.1,.95,.7,2.5,.55,-2.6,new THREE.MeshStandardMaterial({color:0x94a3b8})); furniture(.9,1.35,.12,2.4,2.05,-2.95,new THREE.MeshStandardMaterial({color:0x0f766e,emissive:0x064e3b,emissiveIntensity:.12}));
  } else if (p.name === 'pharmacy') {
    for(let i=0;i<4;i++){ furniture(2.3,.22,.55,0,.8+i*.72,-2.8,new THREE.MeshStandardMaterial({color:0x9ca3af})); for(let j=0;j<4;j++) furniture(.28,.34,.28,-.8+j*.55,1.05+i*.72,-2.75,new THREE.MeshStandardMaterial({color:[0x38bdf8,0x34d399,0xfbbf24,0xf87171][(i+j)%4]})); }
    furniture(2.2,1,.8,2.4,.6,-2.5,new THREE.MeshStandardMaterial({color:0x0f766e}));
  } else if (p.name === 'learning') {
    for(let i=0;i<3;i++){ furniture(2.3,.18,.7,0,.8,-2.8+i*1.2,new THREE.MeshStandardMaterial({color:0x9ca3af})); for(let j=0;j<2;j++) furniture(.22,.7,.22,-.55+j*1.1,.35,-2.8+i*1.2,new THREE.MeshStandardMaterial({color:0x334155})); }
    furniture(2.5,1.4,.12,0,2.4,-3.85,new THREE.MeshStandardMaterial({color:0x2563eb,emissive:0x1d4ed8,emissiveIntensity:.18}));
  } else if (p.name === 'radiology') {
    furniture(2.6,.28,1.15,-1.7,.8,-2.5,new THREE.MeshStandardMaterial({color:0xe2e8f0,metalness:.22,roughness:.45})); furniture(1.05,1.5,1.1,-1.7,1.65,-3.2,new THREE.MeshStandardMaterial({color:0x94a3b8,metalness:.32,roughness:.4})); furniture(2.1,1.7,.18,2.35,1.7,-3.55,new THREE.MeshStandardMaterial({color:0x0f766e,emissive:0x064e3b,emissiveIntensity:.22}));
  } else if (p.name === 'laboratory') {
    for(let i=0;i<3;i++){ furniture(1.7,.95,.7,-2.4+i*2.4,.55,-2.8,new THREE.MeshStandardMaterial({color:0xe2e8f0,roughness:.45})); furniture(1.75,.12,.74,-2.4+i*2.4,1.08,-2.8,new THREE.MeshStandardMaterial({color:0x9bdcf5,metalness:.15,roughness:.25})); }
    for(let i=0;i<5;i++) furniture(.16,.42,.16,-2.7+i*.36,1.35,-2.75,new THREE.MeshStandardMaterial({color:[0x38bdf8,0x34d399,0xfbbf24,0xf87171,0xa78bfa][i],roughness:.22,metalness:.05}));
  } else if (p.name === 'emergency') {
    furniture(2.0,.34,2.3,-2.2,.55,-2.6,new THREE.MeshStandardMaterial({color:0xe2e8f0})); furniture(1.2,1.0,.75,2.2,.6,-2.6,new THREE.MeshStandardMaterial({color:0x0f766e})); furniture(.18,1.8,.18,2.2,2.0,-3.0,new THREE.MeshStandardMaterial({color:0xef4444,emissive:0x7f1d1d,emissiveIntensity:.3}));
  } else {
    furniture(2.4,.8,.8,-2.2,.5,-2.6,new THREE.MeshStandardMaterial({color:0xa78bfa})); furniture(2.4,.8,.8,2.2,.5,-2.6,new THREE.MeshStandardMaterial({color:0xc4b5fd})); furniture(1.4,.65,1.1,0,.42,-1.1,new THREE.MeshStandardMaterial({color:0x8b5e3c}));
  }
  // Exterior windows on the side walls and an illuminated room nameplate.
  for(let i=0;i<3;i++){ const win=new THREE.Mesh(new THREE.BoxGeometry(.08,1.15,1.05),glassMat); win.position.set(-4.66,2.8,-2.3+i*2.1); group.add(win); }
  const label = new THREE.Mesh(new THREE.PlaneGeometry(5.5,1.25), new THREE.MeshBasicMaterial({ map: makeLabelTexture(p.ar,p.en,accent) })); label.position.set(0,5.45,4.35); group.add(label);
  // Smaller labels identify rooms inside each building.
  const rooms = p.name === 'hospital' ? [['الاستقبال','RECEPTION'],['غرفة المريض','PATIENT ROOM']] : p.name === 'pharmacy' ? [['صرف الدواء','DISPENSARY'],['استشارات دوائية','COUNSELLING']] : p.name === 'learning' ? [['قاعة التعلّم','LEARNING'],['مكتبة التوعية','LIBRARY']] : p.name === 'radiology' ? [['الأشعة المقطعية','CT SCAN'],['الأشعة العادية','X-RAY']] : p.name === 'laboratory' ? [['سحب العينات','SAMPLE COLLECTION'],['تحليل العينات','LAB ANALYSIS']] : p.name === 'emergency' ? [['الفرز الطبي','TRIAGE'],['غرفة الإنعاش','RESUSCITATION']] : [['الأنشطة','COMMUNITY'],['التوعية الصحية','HEALTH INFO']];
  rooms.forEach((room,i)=>{ const tex=makeLabelTexture(room[0],room[1],accent); const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.72),new THREE.MeshBasicMaterial({map:tex})); sign.position.set(i===0?-2.65:2.65,3.35,-.05); sign.rotation.y = i===0 ? 0 : 0; group.add(sign); });
  // Front door stays open so the avatar can walk into the interior.
  scene.add(group);
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,1.7,8), new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: .25 })); beacon.position.set(p.x,5.15,p.z); scene.add(beacon);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.25,14,10), new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: .8 })); orb.position.set(p.x,6.15,p.z); scene.add(orb);
}

export default function OpenWorldGame() {
  const { lang } = useLang(); const isAr = lang === 'ar';
  const { user } = useAuth();
  const mountRef = useRef<HTMLDivElement>(null); const inspectRef = useRef<(() => void) | null>(null); const keys = useRef<Record<string, boolean>>({}); const playerPos = useRef(new THREE.Vector3(0,0,5)); const playerRigRef = useRef<THREE.Group | null>(null);
  const [ready,setReady] = useState(false); const [xp,setXp] = useState(0); const [dialog,setDialog] = useState<Place|null>(null); const [isFullscreen,setIsFullscreen] = useState(false); const [showGameMenu,setShowGameMenu] = useState(false); const [landscapeNotice,setLandscapeNotice] = useState(false);
  const [visited,setVisited] = useState<string[]>([]); const visitedRef = useRef<string[]>([]); const [progressLoaded,setProgressLoaded] = useState(false);
  const [loadedUserKey,setLoadedUserKey] = useState<string | null | undefined>(undefined);
  const progressKey = user?.uid ? `aa_open_world_progress_v1_${user.uid}` : 'aa_open_world_progress_v1';
  const activeUserKey = user?.uid ?? null;
  useEffect(() => {
    let cancelled = false; setProgressLoaded(false); setLoadedUserKey(undefined);
    const uid = user?.uid ?? null;
    const apply = (data: any) => { if (cancelled || !data) return; setXp(Number.isFinite(data.xp) ? Math.max(0, data.xp) : 0); const nextVisited = Array.isArray(data.visited) ? data.visited.filter((id: unknown) => typeof id === 'string' && PLACES.some(p => p.name === id)) : []; visitedRef.current = nextVisited; setVisited(nextVisited); const saved = data.position; if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z)) { playerPos.current.set(THREE.MathUtils.clamp(saved.x, -43, 43), 0, THREE.MathUtils.clamp(saved.z, -43, 43)); if (playerRigRef.current) playerRigRef.current.position.copy(playerPos.current); } };
    (async () => {
      try {
        if (uid && db) { const snap = await getDoc(doc(db, 'users', uid, 'gameProgress', 'openWorld')); if (snap.exists()) apply(snap.data()); else { const raw = localStorage.getItem(progressKey); if (raw) apply(JSON.parse(raw)); } }
        else { const raw = localStorage.getItem(progressKey); if (raw) apply(JSON.parse(raw)); }
      } catch (error) { console.warn('Could not load open-world progress:', error); try { const raw = localStorage.getItem(progressKey); if (raw) apply(JSON.parse(raw)); } catch {} }
      finally { if (!cancelled) { setLoadedUserKey(uid); setProgressLoaded(true); } }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);
  useEffect(() => {
    if (!progressLoaded || loadedUserKey !== activeUserKey) return;
    const data = { xp, visited, position: { x: playerPos.current.x, z: playerPos.current.z }, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(progressKey, JSON.stringify(data)); } catch {}
    if (user && db) {
      const timer = window.setTimeout(() => { void setDoc(doc(db, 'users', user.uid, 'gameProgress', 'openWorld'), { xp, visited, position: { x: playerPos.current.x, z: playerPos.current.z }, updatedAt: serverTimestamp() }, { merge: true }).catch(error => console.warn('Could not sync open-world progress to cloud:', error)); }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [xp, visited, user?.uid, progressLoaded, loadedUserKey, activeUserKey, progressKey]);
  // Save the player's exploration position periodically so the same account can resume on another device.
  useEffect(() => {
    if (!progressLoaded || loadedUserKey !== activeUserKey || !ready) return;
    const persistPosition = () => {
      const data = { xp, visited, position: { x: playerPos.current.x, z: playerPos.current.z }, updatedAt: new Date().toISOString() };
      try { localStorage.setItem(progressKey, JSON.stringify(data)); } catch {}
      if (user && db) void setDoc(doc(db, 'users', user.uid, 'gameProgress', 'openWorld'), { xp, visited, position: data.position, updatedAt: serverTimestamp() }, { merge: true }).catch(error => console.warn('Could not sync open-world position:', error));
    };
    const timer = window.setInterval(persistPosition, 5000);
    window.addEventListener('pagehide', persistPosition);
    return () => { window.clearInterval(timer); window.removeEventListener('pagehide', persistPosition); };
  }, [ready, progressLoaded, loadedUserKey, activeUserKey, xp, visited, user?.uid, progressKey]);
  const visitPlace = (place: Place) => { setDialog(place); if (visitedRef.current.includes(place.name)) return; const nextVisited = [...visitedRef.current, place.name]; visitedRef.current = nextVisited; setVisited(nextVisited); setXp(old => old + 20); };
  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); } catch { setReady(false); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6)); renderer.setSize(mount.clientWidth, mount.clientHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8ed5ff); scene.fog = new THREE.Fog(0x8ed5ff,38,105);
    const camera = new THREE.PerspectiveCamera(62, mount.clientWidth/mount.clientHeight,.1,180);
    let cameraYaw = 0; let cameraPitch = 0.22; let draggingCamera = false; let lastPointerX = 0; let lastPointerY = 0;
    scene.add(new THREE.HemisphereLight(0xeaf7ff,0x68846a,2.2)); const sun = new THREE.DirectionalLight(0xfff0d1,3); sun.position.set(-18,30,12); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(130,130),new THREE.MeshStandardMaterial({color:0x6ebf79,roughness:1})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
    // Central plaza paths
    const pathMat = new THREE.MeshStandardMaterial({color:0xe7d7b7,roughness:1});
    const path1 = new THREE.Mesh(new THREE.BoxGeometry(7,.08,100),pathMat); path1.position.y=.04; scene.add(path1);
    const path2 = new THREE.Mesh(new THREE.BoxGeometry(100,.08,7),pathMat); path2.position.y=.045; scene.add(path2);
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(5.5,5.5,.18,48),new THREE.MeshStandardMaterial({color:0xd9e8df,roughness:.78})); plaza.position.set(0,.1,0); plaza.receiveShadow=true; scene.add(plaza);
    // A more convincing campus street system: asphalt lanes, pale curbs, lane paint, zebra crossings and marked parking bays.
    const asphaltMat = new THREE.MeshStandardMaterial({color:0x394956,roughness:.98});
    const curbMat = new THREE.MeshStandardMaterial({color:0xcbd5dc,roughness:.9});
    const paintMat = new THREE.MeshStandardMaterial({color:0xf8fafc,roughness:.85});
    const roadV = new THREE.Mesh(new THREE.BoxGeometry(10,.045,112),asphaltMat); roadV.position.set(0,.025,0); roadV.receiveShadow=true; scene.add(roadV);
    const roadH = new THREE.Mesh(new THREE.BoxGeometry(112,.045,10),asphaltMat); roadH.position.set(0,.026,0); roadH.receiveShadow=true; scene.add(roadH);
    for(const side of [-1,1]) { const curbV=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,112),curbMat); curbV.position.set(side*5.15,.08,0); scene.add(curbV); const curbH=new THREE.Mesh(new THREE.BoxGeometry(112,.16,.28),curbMat); curbH.position.set(0,.08,side*5.15); scene.add(curbH); }
    for(let z=-48;z<=48;z+=5){const dash=new THREE.Mesh(new THREE.BoxGeometry(.13,.025,2.3),paintMat);dash.position.set(0,.064,z);scene.add(dash);}
    for(let x=-48;x<=48;x+=5){const dash=new THREE.Mesh(new THREE.BoxGeometry(2.3,.025,.13),paintMat);dash.position.set(x,.065,0);scene.add(dash);}
    for(const cross of [{x:7,z:-7,rot:0},{x:-7,z:7,rot:0},{x:7,z:7,rot:Math.PI/2},{x:-7,z:-7,rot:Math.PI/2}]){for(let i=0;i<7;i++){const stripe=new THREE.Mesh(new THREE.BoxGeometry(cross.rot?2.8:.42,.035,cross.rot?.42:2.8),paintMat);stripe.position.set(cross.x+(cross.rot?0:(i-3)*.68),.075,cross.z+(cross.rot?(i-3)*.68:0));scene.add(stripe);}}
    // Sidewalk pads connect the crosswalks to the building entrances.
    for(const p of PLACES){const walk=new THREE.Mesh(new THREE.BoxGeometry(3.4,.07,4.8),new THREE.MeshStandardMaterial({color:0xd4dce1,roughness:.95}));walk.position.set(p.x,.04,p.z+(p.z<0?6.3:-6.3));walk.receiveShadow=true;scene.add(walk);}
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.1,.22,32),new THREE.MeshStandardMaterial({color:0x38bdf8,metalness:.15,roughness:.22})); water.position.set(0,.24,0); scene.add(water);
    const fountain = new THREE.Mesh(new THREE.CylinderGeometry(.28,.4,1.3,16),new THREE.MeshStandardMaterial({color:0xf8fafc,roughness:.28,metalness:.08})); fountain.position.set(0,.9,0); fountain.castShadow=true; scene.add(fountain);
    const fountainLip=new THREE.Mesh(new THREE.TorusGeometry(2.12,.12,10,48),new THREE.MeshStandardMaterial({color:0xe2e8f0,roughness:.3,metalness:.12}));fountainLip.rotation.x=Math.PI/2;fountainLip.position.y=.28;scene.add(fountainLip);
    PLACES.forEach(p=>makeBuilding(scene,p));
    // Streetlights with warm emissive heads create depth around the campus without expensive real-time point shadows.
    for(let i=0;i<16;i++){const a=i*Math.PI/8;const x=Math.cos(a)*20,z=Math.sin(a)*20;const pole=new THREE.Mesh(new THREE.CylinderGeometry(.075,.11,4.4,8),new THREE.MeshStandardMaterial({color:0x34495a,metalness:.65,roughness:.38}));pole.position.set(x,2.2,z);pole.castShadow=true;scene.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(.72,.09,.09),new THREE.MeshStandardMaterial({color:0x34495a,metalness:.55,roughness:.4}));arm.position.set(x+(x>0?-.3:.3),4.25,z);scene.add(arm);const lamp=new THREE.Mesh(new THREE.BoxGeometry(.42,.13,.28),new THREE.MeshStandardMaterial({color:0xfff7d6,emissive:0xffd27a,emissiveIntensity:.85,roughness:.25}));lamp.position.set(x+(x>0?-.56:.56),4.17,z);scene.add(lamp);}
    // Seating and waste bins give the plaza scale and believable everyday details.
    for(const b of [{x:-8,z:12},{x:8,z:-12},{x:-12,z:-8},{x:12,z:8}]){const seat=new THREE.Mesh(new THREE.BoxGeometry(1.8,.14,.48),new THREE.MeshStandardMaterial({color:0x8b5e3c,roughness:.72}));seat.position.set(b.x,.62,b.z);seat.castShadow=true;scene.add(seat);for(const dx of [-.68,.68]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.12,.58,.36),new THREE.MeshStandardMaterial({color:0x334155,metalness:.45,roughness:.5}));leg.position.set(b.x+dx,.32,b.z);scene.add(leg);}}
    // A parked ambulance with roof beacons makes the emergency entrance legible from a distance.
    const pedestrians: {group:THREE.Group; phase:number; radius:number; speed:number; centerX:number; centerZ:number; outfit:THREE.Mesh}[] = [];
    const ambulance=new THREE.Group();ambulance.position.set(21,0,10);ambulance.rotation.y=-Math.PI/2;const vanBody=new THREE.Mesh(new THREE.BoxGeometry(2.05,1.25,4.2),new THREE.MeshStandardMaterial({color:0xf8fafc,roughness:.48,metalness:.05}));vanBody.position.y=.9;vanBody.castShadow=true;ambulance.add(vanBody);const vanCab=new THREE.Mesh(new THREE.BoxGeometry(1.9,1.0,1.25),new THREE.MeshStandardMaterial({color:0xeaf6fb,roughness:.35}));vanCab.position.set(0,1.0,1.28);ambulance.add(vanCab);const redStripe=new THREE.Mesh(new THREE.BoxGeometry(2.08,.22,3.7),new THREE.MeshStandardMaterial({color:0xdc2626,roughness:.5}));redStripe.position.set(0,1.02,-.15);ambulance.add(redStripe);const crossMark=new THREE.Mesh(new THREE.BoxGeometry(.12,.65,.12),new THREE.MeshStandardMaterial({color:0xffffff}));crossMark.position.set(0,1.05,-.12);ambulance.add(crossMark);const crossBar=new THREE.Mesh(new THREE.BoxGeometry(.42,.12,.12),new THREE.MeshStandardMaterial({color:0xffffff}));crossBar.position.set(0,1.05,-.12);ambulance.add(crossBar);for(const x of [-.9,.9])for(const z of [-1.35,1.35]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.18,16),new THREE.MeshStandardMaterial({color:0x1f2937,roughness:.9}));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.43,z);ambulance.add(wheel);}const beaconRed=new THREE.Mesh(new THREE.BoxGeometry(.42,.14,.18),new THREE.MeshStandardMaterial({color:0xef4444,emissive:0xef4444,emissiveIntensity:1.2}));beaconRed.position.set(-.32,1.62,1.0);ambulance.add(beaconRed);const beaconBlue=beaconRed.clone();beaconBlue.material=new THREE.MeshStandardMaterial({color:0x38bdf8,emissive:0x38bdf8,emissiveIntensity:1.2});beaconBlue.position.x=.32;ambulance.add(beaconBlue);scene.add(ambulance);
    // Small animated staff and visitors add life to the plaza; they follow short, deterministic walking loops.
    for(let i=0;i<5;i++){const npc=new THREE.Group();const coat=new THREE.MeshStandardMaterial({color:[0xf8fafc,0x0f766e,0x93c5fd,0xf1f5f9,0x64748b][i],roughness:.84});const skinNpc=new THREE.MeshStandardMaterial({color:[0xc98f70,0xe0ac88,0x9a684f,0xf0c5a2,0xb87958][i],roughness:.8});const body=new THREE.Mesh(new THREE.CapsuleGeometry(.23,.38,4,8),coat);body.position.y=1.18;body.castShadow=true;npc.add(body);const headNpc=new THREE.Mesh(new THREE.SphereGeometry(.18,14,10),skinNpc);headNpc.position.y=1.68;headNpc.castShadow=true;npc.add(headNpc);const hairNpc=new THREE.Mesh(new THREE.SphereGeometry(.185,12,8,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:[0x2b2524,0x3c2b25,0x1f2937,0x6b4f3f,0x35251f][i],roughness:.95}));hairNpc.position.y=1.77;npc.add(hairNpc);for(const side of [-1,1]){const legNpc=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.28,3,6),new THREE.MeshStandardMaterial({color:0x334155,roughness:.9}));legNpc.position.set(side*.105,.55,0);npc.add(legNpc);const armNpc=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.3,3,6),coat);armNpc.position.set(side*.29,1.18,0);armNpc.rotation.z=side*.15;npc.add(armNpc);}const phase=i*1.27;const radius=9+(i%3)*1.4;const centerX=i%2===0?0:2;const centerZ=i%2===0?0:-1;npc.position.set(centerX+Math.cos(phase)*radius,0,centerZ+Math.sin(phase)*radius);scene.add(npc);pedestrians.push({group:npc,phase,radius,speed:.12+(i%3)*.025,centerX,centerZ,outfit:body});}
    // Trees, lamps, benches and small town buildings create a lively walkable environment.
    for(let i=0;i<58;i++){ const x=((i*17)%74)-37, z=((i*29)%74)-37; if(Math.abs(x)<9||Math.abs(z)<9||PLACES.some(p=>Math.abs(x-p.x)<6&&Math.abs(z-p.z)<6)) continue; const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.15,.22,1.25,7),new THREE.MeshStandardMaterial({color:0x855433})); trunk.position.set(x,.62,z); trunk.castShadow=true; scene.add(trunk); const crown=new THREE.Mesh(new THREE.SphereGeometry(.85+(i%3)*.15,9,7),new THREE.MeshStandardMaterial({color:[0x2f855a,0x3c995e,0x69ad58][i%3],roughness:1})); crown.position.set(x,1.8,z); crown.castShadow=true; scene.add(crown); }
    for(let i=0;i<20;i++){ const x=(i%2?1:-1)*(10+(i%4)*4), z=-36+i*3.7; if(PLACES.some(p=>Math.abs(x-p.x)<7&&Math.abs(z-p.z)<7)) continue; const b=new THREE.Mesh(new THREE.BoxGeometry(3.5,5+(i%4)*2,3.5),new THREE.MeshStandardMaterial({color:[0x9fb8cb,0xc8d7df,0xe6c9a8][i%3]})); b.position.set(x,(b.geometry.parameters.height||5)/2,z); b.castShadow=true; scene.add(b); }
    // More readable nurse avatar: softened capsule limbs, white clinical tunic, teal trim, ID badge and stethoscope.
    const player = new THREE.Group(); const skin=new THREE.MeshStandardMaterial({color:0xc98f70,roughness:.78}); const shirt=new THREE.MeshStandardMaterial({color:0xf4f8fb,roughness:.82}); const teal=new THREE.MeshStandardMaterial({color:0x0f766e,roughness:.55}); const pants=new THREE.MeshStandardMaterial({color:0x23384b,roughness:.92}); const hair=new THREE.MeshStandardMaterial({color:0x2b2524,roughness:.95});
    const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.31,.48,5,10),shirt); torso.position.y=1.35; torso.castShadow=true; player.add(torso);
    const collar=new THREE.Mesh(new THREE.BoxGeometry(.27,.09,.08),teal);collar.position.set(0,1.68,.17);player.add(collar);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.255,22,16),skin); head.position.y=2.03; head.castShadow=true; player.add(head);
    const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.265,20,12,0,Math.PI*2,0,Math.PI*.52),hair); hairCap.position.set(0,2.16,-.015); player.add(hairCap);
    const pack=new THREE.Mesh(new THREE.BoxGeometry(.43,.56,.19),teal); pack.position.set(0,1.38,-.29); player.add(pack);
    const badge=new THREE.Mesh(new THREE.BoxGeometry(.19,.24,.035),new THREE.MeshStandardMaterial({color:0x7dd3fc,metalness:.12,roughness:.3}));badge.position.set(.15,1.42,.285);player.add(badge);
    const stethoscope=new THREE.Mesh(new THREE.TorusGeometry(.105,.025,7,16,Math.PI),new THREE.MeshStandardMaterial({color:0x334155,metalness:.5,roughness:.35}));stethoscope.position.set(-.07,1.53,.205);stethoscope.rotation.z=Math.PI;player.add(stethoscope);
    const limbs:THREE.Mesh[]=[]; const shoes:THREE.Mesh[]=[]; for(const side of [-1,1]){ const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.42,4,8),shirt); arm.position.set(side*.43,1.36,0); arm.rotation.z=side*-.13; arm.castShadow=true; player.add(arm); limbs.push(arm); const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.38,4,8),pants); leg.position.set(side*.19,.55,0); leg.castShadow=true; player.add(leg); limbs.push(leg); const shoe=new THREE.Mesh(new THREE.BoxGeometry(.28,.13,.4),new THREE.MeshStandardMaterial({color:0xf8fafc,roughness:.45})); shoe.position.set(side*.19,.16,.07); shoe.castShadow=true; player.add(shoe); shoes.push(shoe); }
    player.position.copy(playerPos.current); playerRigRef.current = player; scene.add(player);
    const pressed:Record<string,boolean>={}; const down=(e:KeyboardEvent)=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); pressed[e.key.toLowerCase()]=true; keys.current[e.key.toLowerCase()]=true; if(e.key.toLowerCase()==='e') inspectRef.current?.();}; const up=(e:KeyboardEvent)=>{pressed[e.key.toLowerCase()]=false; keys.current[e.key.toLowerCase()]=false;}; window.addEventListener('keydown',down); window.addEventListener('keyup',up);
    const canvas = renderer.domElement; canvas.style.touchAction = 'none';
    const pointerDown = (e: PointerEvent) => { if (e.pointerType === 'mouse' && e.button !== 0) return; draggingCamera = true; lastPointerX = e.clientX; lastPointerY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch {} };
    const pointerMove = (e: PointerEvent) => { if (!draggingCamera) return; const dx = e.clientX-lastPointerX; const dy = e.clientY-lastPointerY; lastPointerX=e.clientX; lastPointerY=e.clientY; cameraYaw -= dx*0.006; cameraPitch = THREE.MathUtils.clamp(cameraPitch + dy*0.004, -0.08, 0.72); };
    const pointerUp = () => { draggingCamera = false; };
    canvas.addEventListener('pointerdown',pointerDown); canvas.addEventListener('pointermove',pointerMove); canvas.addEventListener('pointerup',pointerUp); canvas.addEventListener('pointercancel',pointerUp);
    let frame=0, alive=true, last=performance.now(); const resize=()=>{if(!mount) return; renderer.setSize(mount.clientWidth,mount.clientHeight); camera.aspect=mount.clientWidth/mount.clientHeight; camera.updateProjectionMatrix();}; window.addEventListener('resize',resize);
    const blocked = (x:number,z:number) => PLACES.some(p => {
      const lx=x-p.x, lz=z-p.z; const insideX=Math.abs(lx)<4.98, insideZ=Math.abs(lz)<4.28;
      if (Math.abs(Math.abs(lx)-4.8)<.32 && insideZ) return true;
      if (Math.abs(lz+4.1)<.32 && insideX) return true;
      if (Math.abs(lz-4.1)<.32 && insideX && Math.abs(lx)>1.72) return true;
      if (Math.abs(lz+.25)<.24 && Math.abs(lx)>1.85 && Math.abs(lx)<4.7) return true;
      return false;
    });
    const animate=(now:number)=>{if(!alive)return; frame=requestAnimationFrame(animate); const dt=Math.min((now-last)/1000,.04); last=now; const k=keys.current; let inputX=(k['d']||k['arrowright']?1:0)-(k['a']||k['arrowleft']?1:0); let inputZ=(k['s']||k['arrowdown']?1:0)-(k['w']||k['arrowup']?1:0); if((window as any).__owMove){inputX+=(window as any).__owMove.x||0;inputZ+=(window as any).__owMove.z||0;} let dx=inputX*Math.cos(cameraYaw)+inputZ*Math.sin(cameraYaw); let dz=-inputX*Math.sin(cameraYaw)+inputZ*Math.cos(cameraYaw); playerPos.current.copy(player.position); const moving=Math.abs(dx)>.04||Math.abs(dz)>.04; if(moving){const len=Math.hypot(dx,dz)||1; dx/=Math.max(1,len);dz/=Math.max(1,len); const nextX=THREE.MathUtils.clamp(player.position.x+dx*dt*5,-43,43); const nextZ=THREE.MathUtils.clamp(player.position.z+dz*dt*5,-43,43); if(!blocked(nextX,player.position.z)) player.position.x=nextX; if(!blocked(player.position.x,nextZ)) player.position.z=nextZ; player.rotation.y=Math.atan2(dx,dz); torso.position.y=1.35+Math.sin(now*.014)*.035; limbs[0].rotation.x=Math.sin(now*.009)*.38;limbs[1].rotation.x=-Math.sin(now*.009)*.38;limbs[2].rotation.x=-Math.sin(now*.009)*.48;limbs[3].rotation.x=Math.sin(now*.009)*.48;shoes.forEach((shoe,i)=>{shoe.position.y=.16+Math.max(0,Math.sin(now*.009+(i?Math.PI:0)))*.045;});}else{limbs.forEach(l=>l.rotation.x=THREE.MathUtils.damp(l.rotation.x,0,8,dt)); torso.position.y=THREE.MathUtils.damp(torso.position.y,1.35,8,dt);}
      pedestrians.forEach((npc,i)=>{const a=npc.phase+now*.001*npc.speed;npc.group.position.x=npc.centerX+Math.cos(a)*npc.radius;npc.group.position.z=npc.centerZ+Math.sin(a)*npc.radius;npc.group.rotation.y=-a+Math.PI/2;npc.outfit.position.y=1.18+Math.sin(now*.006+i)*.025;}); beaconRed.material.emissiveIntensity=.7+Math.abs(Math.sin(now*.008))*1.2; beaconBlue.material.emissiveIntensity=.7+Math.abs(Math.cos(now*.008))*1.2; const target=new THREE.Vector3(player.position.x,1.45,player.position.z); const cameraDistance=10.5; const horizontal=Math.cos(cameraPitch)*cameraDistance; const desired=new THREE.Vector3(player.position.x+Math.sin(cameraYaw)*horizontal, player.position.y+2.7+Math.sin(cameraPitch)*cameraDistance, player.position.z+Math.cos(cameraYaw)*horizontal); camera.position.lerp(desired,1-Math.exp(-5*dt)); camera.lookAt(target); renderer.render(scene,camera); };
    frame=requestAnimationFrame(animate); setReady(true);
    return()=>{alive=false;playerRigRef.current=null;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);renderer.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});if(renderer.domElement.parentNode===mount)mount.removeChild(renderer.domElement);};
  },[]);
  const startMove=(x:number,z:number)=>{(window as any).__owMove={x,z};}; const stopMove=()=>{(window as any).__owMove={x:0,z:0};};
  const toggleFullscreen = async () => { const target = document.querySelector('.ow-page') as HTMLElement | null; if (!target) return; try { if (!document.fullscreenElement) { await target.requestFullscreen(); setIsFullscreen(true); setShowGameMenu(false); setLandscapeNotice(true); const orientation = (screen as any).orientation; if (orientation?.lock) { try { await orientation.lock('landscape'); } catch { /* Orientation lock is not supported in every browser. */ } } } else { await document.exitFullscreen(); setIsFullscreen(false); setShowGameMenu(false); setLandscapeNotice(false); const orientation = (screen as any).orientation; if (orientation?.unlock) orientation.unlock(); } } catch (error) { console.warn('Fullscreen is unavailable in this browser:', error); } };
  useEffect(()=>{const onFullscreen=()=>{setIsFullscreen(Boolean(document.fullscreenElement)); if(!document.fullscreenElement){setShowGameMenu(false); setLandscapeNotice(false); const orientation=(screen as any).orientation; if(orientation?.unlock) orientation.unlock();}}; document.addEventListener('fullscreenchange',onFullscreen); return()=>document.removeEventListener('fullscreenchange',onFullscreen);},[]);
  const inspect=()=>{const pos=playerPos.current; const place=PLACES.map(p=>({...p,d:Math.hypot(pos.x-p.x,pos.z-p.z)})).sort((a,b)=>a.d-b.d)[0]; if(place && place.d<10){visitPlace(place);}else{setDialog({name:'hint',ar:'اقترب من أحد المباني',en:'Get closer to a landmark',x:0,z:0,color:0xffffff,icon:'!',fact:'اقترب من أي مبنى أو قسم في المدينة، ثم اضغط تفاعل.',factEn:'Walk closer to any building or department, then press Interact.'});}};
  inspectRef.current=inspect;
  return <main className="ow-page" dir={isAr?'rtl':'ltr'}><header className="ow-header"><Link to="/games" className="ow-back">← {isAr?'مركز الألعاب':'Game Center'}</Link><div><strong>🌎 {isAr?'المدينة الصحية المفتوحة':'Open Health World'}</strong><span>{isAr?'استكشف • تعلّم • اجمع النقاط':'Explore • Learn • Earn XP'}</span></div><div className="ow-xp">⭐ {xp} XP <small>{user ? (isAr?'مزامنة سحابية':'Cloud sync') : (isAr?'حفظ على هذا الجهاز':'Saved on this device')}</small></div><button className="ow-fullscreen" onClick={toggleFullscreen} aria-label={isFullscreen?(isAr?'إنهاء ملء الشاشة':'Exit fullscreen'):(isAr?'ملء الشاشة':'Fullscreen')}>{isFullscreen?'⤢':'⛶'} <span>{isFullscreen?(isAr?'إنهاء':'Exit'):(isAr?'ملء الشاشة':'Fullscreen')}</span></button></header>
    <section className="ow-layout"><div className="ow-stage"><div className="ow-scene" ref={mountRef}/><button type="button" className="ow-menu-toggle" onClick={()=>setShowGameMenu(v=>!v)} aria-label={showGameMenu?(isAr?"إخفاء القائمة":"Hide game menu"):(isAr?"فتح القائمة":"Open game menu")}>{showGameMenu ? (isAr ? "›" : "‹") : (isAr ? "☰" : "☰")}</button><div className="ow-camera-hint">{isAr?'اسحب الشاشة لتدوير الكاميرا':'Drag the scene to rotate camera'}</div>{landscapeNotice&&<div className="ow-landscape-hint">{isAr?'لأفضل تجربة، أدر الهاتف للعرض':'For the best experience, rotate your phone to landscape'}<button onClick={()=>setLandscapeNotice(false)}>×</button></div>}<div className={`ow-hud ${isFullscreen ? "ow-hud-immersive" : ""}`}><div className="ow-avatar">🧑🏻‍🎓</div><div className="ow-progress"><b>{isAr?'مهمة المدينة':'City Mission'}</b><span>{isAr?`زرت ${visited.length} من ${PLACES.length} أماكن`:`Visited ${visited.length} of ${PLACES.length} landmarks`}</span><div className="ow-bar"><i style={{width:`${Math.min(100,xp/(PLACES.length*20)*100)}%`}}/></div></div><div className="ow-map"><span>🧭</span><small>{isAr?'المدينة':'CITY'}</small>{PLACES.map((p,i)=><i key={p.name} className={`ow-map-dot ow-map-dot-${i}`} style={{left:`${50+(p.x/43)*36}%`,top:`${50+(p.z/43)*36}%`}}/>)}</div></div>{!ready&&<div className="ow-loading">{isAr?'جارٍ تجهيز العالم ثلاثي الأبعاد…':'Preparing 3D world…'}<small>{isAr?'إذا لم يدعم جهازك WebGL، جرّب متصفحًا حديثًا.':'If WebGL is unavailable, try a modern browser.'}</small></div>}
      {dialog&&<div className="ow-dialog"><button className="ow-close" onClick={()=>setDialog(null)}>×</button><b>{dialog.icon} {isAr?dialog.ar:dialog.en}</b><p>{isAr?dialog.fact:dialog.factEn}</p><button className="ow-primary" onClick={()=>setDialog(null)}>{isAr?'متابعة الاستكشاف':'Keep exploring'}</button></div>}
      <div className="ow-controls"><div className="ow-joystick" role="group" aria-label={isAr?'عصا الحركة':'Movement joystick'} onPointerDown={(e)=>{const el=e.currentTarget; el.setPointerCapture(e.pointerId); const r=el.getBoundingClientRect(); const update=(ev:PointerEvent)=>{const dx=(ev.clientX-(r.left+r.width/2))/(r.width*.34); const dy=(ev.clientY-(r.top+r.height/2))/(r.height*.34); const len=Math.hypot(dx,dy)||1; (window as any).__owMove={x:Math.max(-1,Math.min(1,dx/Math.max(1,len))),z:Math.max(-1,Math.min(1,dy/Math.max(1,len)))}; const knob=el.querySelector('.ow-joystick-knob') as HTMLElement|null; if(knob){knob.style.transform=`translate(${Math.max(-28,Math.min(28,dx*28))}px, ${Math.max(-28,Math.min(28,dy*28))}px)`;}}; (el as any).__owUpdate=update; update(e.nativeEvent as PointerEvent);}} onPointerMove={(e)=>{const el=e.currentTarget as any; if(e.buttons===0 && e.pointerType!=='touch')return; el.__owUpdate?.(e.nativeEvent);}} onPointerUp={(e)=>{stopMove(); const knob=e.currentTarget.querySelector('.ow-joystick-knob') as HTMLElement|null; if(knob)knob.style.transform='translate(0,0)';}} onPointerCancel={stopMove} onLostPointerCapture={stopMove}><span className="ow-joystick-ring">✥</span><span className="ow-joystick-knob"/></div><div className="ow-action-stack"><button className="ow-interact" onClick={inspect}>✋<span>{isAr?'تفاعل':'Interact'} (E)</span></button><span className="ow-camera-tip">{isAr?'اسحب بإصبعك لتدوير الكاميرا':'Drag to look around'}</span></div></div></div>
      <aside className={`ow-sidebar ${isFullscreen && showGameMenu ? "ow-sidebar-open" : ""}`} aria-hidden={isFullscreen && !showGameMenu}><span className="ow-kicker">OPEN WORLD • 3D</span><h1>{isAr?'مدينة صحية… عالم من المغامرات':'A healthier world starts with you'}</h1><p>{isAr?'تحرك بحرية بمنظور الشخص الثالث، واكتشف سبعة مبانٍ، وتفاعل مع الأقسام لتتعلم الاستخدام المسؤول للمضادات الحيوية.':'Move freely in third person, explore seven walk-in buildings, and interact with departments to learn responsible antibiotic use.'}</p><div className="ow-place-list">{PLACES.map((p,i)=><button key={p.name} onClick={()=>visitPlace(p)}><span className="ow-place-icon">{p.icon}</span><span><b>{isAr?p.ar:p.en}</b><small>{isAr?'اكتشف معلومة واكسب 20 نقطة':'Discover a fact • +20 XP'}</small></span><span>›</span></button>)}</div><div className="ow-help"><b>🎮 {isAr?'التحكم':'Controls'}</b><p>{isAr?'الكمبيوتر: WASD أو الأسهم للحركة، و E للتفاعل. الهاتف: استخدم عصا الاتجاهات وزر التفاعل.':'Desktop: WASD / arrows to move, E to interact. Mobile: use the direction pad and Interact.'}</p></div><button className="ow-primary ow-reset" onClick={()=>{setXp(0);visitedRef.current=[];setVisited([]);setDialog(null);playerPos.current.set(0,0,5);if(playerRigRef.current)playerRigRef.current.position.copy(playerPos.current);(window as any).__owMove={x:0,z:0};try{localStorage.setItem(progressKey,JSON.stringify({xp:0,visited:[],position:{x:0,z:5},updatedAt:new Date().toISOString()}));}catch{} if(user&&db) void setDoc(doc(db,'users',user.uid,'gameProgress','openWorld'),{xp:0,visited:[],position:{x:0,z:5},updatedAt:serverTimestamp()},{merge:true}).catch(error=>console.warn('Could not reset cloud progress:',error));}}>{isAr?'إعادة بدء الجولة':'Restart adventure'}</button></aside></section>
    <footer className="ow-footer">{isAr?'محتوى توعوي تعليمي — لا تستبدل اللعبة نصيحة الطبيب أو الصيدلي.':'Educational awareness game — not a substitute for advice from a clinician or pharmacist.'}</footer></main>;
}
