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
];

function makeBuilding(scene: THREE.Scene, p: Place) {
  const group = new THREE.Group(); group.position.set(p.x, 0, p.z);
  const base = new THREE.Mesh(new THREE.BoxGeometry(7, 4.8, 5.5), new THREE.MeshStandardMaterial({ color: p.color, roughness: .88 })); base.position.y = 2.4; base.castShadow = true; base.receiveShadow = true; group.add(base);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(7.5, .35, 6), new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: .8 })); roof.position.y = 4.95; roof.castShadow = true; group.add(roof);
  for (let i=0;i<3;i++) for (let j=0;j<2;j++) { const win = new THREE.Mesh(new THREE.BoxGeometry(.8,.9,.08), new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x164e63, emissiveIntensity: .12 })); win.position.set(-2+i*2,2.9-j*1.45,2.79); group.add(win); }
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1,1.9,.12), new THREE.MeshStandardMaterial({ color: 0x334155 })); door.position.set(0,.95,2.82); group.add(door);
  const sign = new THREE.Group(); sign.position.set(0,5.9,0);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(5.5,.95,.18), new THREE.MeshStandardMaterial({ color: 0x0f2744, emissive: 0x0b2742, emissiveIntensity: .25 })); sign.add(panel);
  const mark = new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.22), new THREE.MeshStandardMaterial({ color: p.color === 0xf2f7ff ? 0xef4444 : p.color === 0xd1fae5 ? 0x10b981 : p.color === 0xdbeafe ? 0x3b82f6 : 0xa855f7, emissive: 0x1e293b, emissiveIntensity: .15 })); mark.position.x = -2.05; sign.add(mark); group.add(sign); scene.add(group);
  // A colored beacon makes destinations easy to spot from the third-person camera.
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2.8,8), new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: .25 })); beacon.position.set(p.x,6.7,p.z); scene.add(beacon);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.32,14,10), new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: .8 })); orb.position.set(p.x,8.2,p.z); scene.add(orb);
}

export default function OpenWorldGame() {
  const { lang } = useLang(); const isAr = lang === 'ar';
  const { user } = useAuth();
  const mountRef = useRef<HTMLDivElement>(null); const inspectRef = useRef<(() => void) | null>(null); const keys = useRef<Record<string, boolean>>({}); const playerPos = useRef(new THREE.Vector3(0,0,5));
  const [ready,setReady] = useState(false); const [xp,setXp] = useState(0); const [dialog,setDialog] = useState<Place|null>(null); const [isFullscreen,setIsFullscreen] = useState(false); const [landscapeNotice,setLandscapeNotice] = useState(false);
  const [visited,setVisited] = useState<string[]>([]); const [progressLoaded,setProgressLoaded] = useState(false);
  const progressKey = 'aa_open_world_progress_v1';
  useEffect(() => {
    let cancelled = false; setProgressLoaded(false);
    const apply = (data: any) => { if (cancelled || !data) return; setXp(Number.isFinite(data.xp) ? Math.max(0, data.xp) : 0); setVisited(Array.isArray(data.visited) ? data.visited.filter((id: unknown) => typeof id === 'string' && PLACES.some(p => p.name === id)) : []); };
    (async () => {
      try {
        if (user && db) { const snap = await getDoc(doc(db, 'users', user.uid, 'gameProgress', 'openWorld')); if (snap.exists()) apply(snap.data()); else { const raw = localStorage.getItem(progressKey); if (raw) apply(JSON.parse(raw)); } }
        else { const raw = localStorage.getItem(progressKey); if (raw) apply(JSON.parse(raw)); }
      } catch (error) { console.warn('Could not load open-world progress:', error); try { const raw = localStorage.getItem(progressKey); if (raw) apply(JSON.parse(raw)); } catch {} }
      finally { if (!cancelled) setProgressLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);
  useEffect(() => {
    if (!progressLoaded) return;
    const data = { xp, visited, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(progressKey, JSON.stringify(data)); } catch {}
    if (user && db) {
      const timer = window.setTimeout(() => { void setDoc(doc(db, 'users', user.uid, 'gameProgress', 'openWorld'), { xp, visited, updatedAt: serverTimestamp() }, { merge: true }).catch(error => console.warn('Could not sync open-world progress to cloud:', error)); }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [xp, visited, user?.uid, progressLoaded]);
  const visitPlace = (place: Place) => { setDialog(place); if (!visited.includes(place.name)) { setVisited(old => old.includes(place.name) ? old : [...old, place.name]); setXp(old => old + 20); } };
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
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(5.5,5.5,.18,32),new THREE.MeshStandardMaterial({color:0xd9e8df})); plaza.position.set(0,.1,0); scene.add(plaza);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.1,.22,32),new THREE.MeshStandardMaterial({color:0x38bdf8,metalness:.15,roughness:.22})); water.position.set(0,.24,0); scene.add(water);
    const fountain = new THREE.Mesh(new THREE.CylinderGeometry(.28,.4,1.3,12),new THREE.MeshStandardMaterial({color:0xf8fafc})); fountain.position.set(0,.9,0); scene.add(fountain);
    PLACES.forEach(p=>makeBuilding(scene,p));
    // Trees, lamps, benches and small town buildings create a lively walkable environment.
    for(let i=0;i<42;i++){ const x=((i*17)%58)-29, z=((i*29)%58)-29; if(Math.abs(x)<8||Math.abs(z)<8) continue; const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.15,.22,1.25,7),new THREE.MeshStandardMaterial({color:0x855433})); trunk.position.set(x,.62,z); trunk.castShadow=true; scene.add(trunk); const crown=new THREE.Mesh(new THREE.SphereGeometry(.85+(i%3)*.15,9,7),new THREE.MeshStandardMaterial({color:[0x2f855a,0x3c995e,0x69ad58][i%3],roughness:1})); crown.position.set(x,1.8,z); crown.castShadow=true; scene.add(crown); }
    for(let i=0;i<12;i++){ const x=(i%2?1:-1)*(9+(i%3)*3), z=-25+i*4.5; const b=new THREE.Mesh(new THREE.BoxGeometry(3.5,5+(i%4)*2,3.5),new THREE.MeshStandardMaterial({color:[0x9fb8cb,0xc8d7df,0xe6c9a8][i%3]})); b.position.set(x,(b.geometry.parameters.height||5)/2,z); b.castShadow=true; scene.add(b); }
    // Stylized avatar with visible head, hair, backpack, arms and legs.
    const player = new THREE.Group(); const skin=new THREE.MeshStandardMaterial({color:0xdba783}); const shirt=new THREE.MeshStandardMaterial({color:0x2563eb}); const pants=new THREE.MeshStandardMaterial({color:0x243b53}); const hair=new THREE.MeshStandardMaterial({color:0x35251f});
    const torso=new THREE.Mesh(new THREE.BoxGeometry(.7,.9,.38),shirt); torso.position.y=1.35; torso.castShadow=true; player.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.27,14,12),skin); head.position.y=2.03; head.castShadow=true; player.add(head);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8,0,Math.PI*2,0,Math.PI*.55),hair); cap.position.set(0,2.15,-.02); player.add(cap);
    const pack=new THREE.Mesh(new THREE.BoxGeometry(.48,.6,.2),new THREE.MeshStandardMaterial({color:0x0f3c64})); pack.position.set(0,1.38,-.29); player.add(pack);
    const limbs:THREE.Mesh[]=[]; for(const side of [-1,1]){ const arm=new THREE.Mesh(new THREE.BoxGeometry(.19,.65,.2),skin); arm.position.set(side*.47,1.36,0); arm.rotation.z=side*-.12; player.add(arm); limbs.push(arm); const leg=new THREE.Mesh(new THREE.BoxGeometry(.25,.65,.27),pants); leg.position.set(side*.2,.55,0); player.add(leg); limbs.push(leg); const shoe=new THREE.Mesh(new THREE.BoxGeometry(.29,.13,.42),new THREE.MeshStandardMaterial({color:0xf8fafc})); shoe.position.set(side*.2,.16,.06); player.add(shoe); }
    player.position.copy(playerPos.current); scene.add(player);
    const pressed:Record<string,boolean>={}; const down=(e:KeyboardEvent)=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); pressed[e.key.toLowerCase()]=true; keys.current[e.key.toLowerCase()]=true; if(e.key.toLowerCase()==='e') inspectRef.current?.();}; const up=(e:KeyboardEvent)=>{pressed[e.key.toLowerCase()]=false; keys.current[e.key.toLowerCase()]=false;}; window.addEventListener('keydown',down); window.addEventListener('keyup',up);
    const canvas = renderer.domElement; canvas.style.touchAction = 'none';
    const pointerDown = (e: PointerEvent) => { if (e.pointerType === 'mouse' && e.button !== 0) return; draggingCamera = true; lastPointerX = e.clientX; lastPointerY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch {} };
    const pointerMove = (e: PointerEvent) => { if (!draggingCamera) return; const dx = e.clientX-lastPointerX; const dy = e.clientY-lastPointerY; lastPointerX=e.clientX; lastPointerY=e.clientY; cameraYaw -= dx*0.006; cameraPitch = THREE.MathUtils.clamp(cameraPitch + dy*0.004, -0.08, 0.72); };
    const pointerUp = () => { draggingCamera = false; };
    canvas.addEventListener('pointerdown',pointerDown); canvas.addEventListener('pointermove',pointerMove); canvas.addEventListener('pointerup',pointerUp); canvas.addEventListener('pointercancel',pointerUp);
    let frame=0, alive=true, last=performance.now(); const resize=()=>{if(!mount) return; renderer.setSize(mount.clientWidth,mount.clientHeight); camera.aspect=mount.clientWidth/mount.clientHeight; camera.updateProjectionMatrix();}; window.addEventListener('resize',resize);
    const animate=(now:number)=>{if(!alive)return; frame=requestAnimationFrame(animate); const dt=Math.min((now-last)/1000,.04); last=now; const k=keys.current; let inputX=(k['d']||k['arrowright']?1:0)-(k['a']||k['arrowleft']?1:0); let inputZ=(k['s']||k['arrowdown']?1:0)-(k['w']||k['arrowup']?1:0); if((window as any).__owMove){inputX+=(window as any).__owMove.x||0;inputZ+=(window as any).__owMove.z||0;} let dx=inputX*Math.cos(cameraYaw)+inputZ*Math.sin(cameraYaw); let dz=-inputX*Math.sin(cameraYaw)+inputZ*Math.cos(cameraYaw); playerPos.current.copy(player.position); const moving=Math.abs(dx)>.04||Math.abs(dz)>.04; if(moving){const len=Math.hypot(dx,dz)||1; dx/=Math.max(1,len);dz/=Math.max(1,len); player.position.x=THREE.MathUtils.clamp(player.position.x+dx*dt*5,-43,43);player.position.z=THREE.MathUtils.clamp(player.position.z+dz*dt*5,-43,43); player.rotation.y=Math.atan2(dx,dz); torso.position.y=1.35+Math.sin(now*.014)*.035; limbs[0].rotation.x=Math.sin(now*.012)*.45;limbs[1].rotation.x=-Math.sin(now*.012)*.45;limbs[2].rotation.x=-Math.sin(now*.012)*.45;limbs[3].rotation.x=Math.sin(now*.012)*.45;}else{limbs.forEach(l=>l.rotation.x=THREE.MathUtils.damp(l.rotation.x,0,8,dt)); torso.position.y=THREE.MathUtils.damp(torso.position.y,1.35,8,dt);}
      const target=new THREE.Vector3(player.position.x,1.45,player.position.z); const cameraDistance=10.5; const horizontal=Math.cos(cameraPitch)*cameraDistance; const desired=new THREE.Vector3(player.position.x+Math.sin(cameraYaw)*horizontal, player.position.y+3.1+Math.sin(cameraPitch)*cameraDistance, player.position.z+Math.cos(cameraYaw)*horizontal); camera.position.lerp(desired,1-Math.exp(-5*dt)); camera.lookAt(target); renderer.render(scene,camera); };
    frame=requestAnimationFrame(animate); setReady(true);
    return()=>{alive=false;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);renderer.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});if(renderer.domElement.parentNode===mount)mount.removeChild(renderer.domElement);};
  },[]);
  useEffect(()=>{const p=playerPos.current; const id=window.setInterval(()=>{const p0=(document.querySelector('.ow-game') as HTMLElement); if(!p0)return; /* proximity is updated from the game camera's avatar via lightweight scene event below */},500);return()=>window.clearInterval(id);},[]);
  const startMove=(x:number,z:number)=>{(window as any).__owMove={x,z};}; const stopMove=()=>{(window as any).__owMove={x:0,z:0};};
  const toggleFullscreen = async () => { const target = document.querySelector('.ow-page') as HTMLElement | null; if (!target) return; try { if (!document.fullscreenElement) { await target.requestFullscreen(); setIsFullscreen(true); setLandscapeNotice(true); const orientation = (screen as any).orientation; if (orientation?.lock) { try { await orientation.lock('landscape'); } catch { /* Orientation lock is not supported in every browser. */ } } } else { await document.exitFullscreen(); setIsFullscreen(false); setLandscapeNotice(false); const orientation = (screen as any).orientation; if (orientation?.unlock) orientation.unlock(); } } catch (error) { console.warn('Fullscreen is unavailable in this browser:', error); } };
  useEffect(()=>{const onFullscreen=()=>{setIsFullscreen(Boolean(document.fullscreenElement)); if(!document.fullscreenElement){setLandscapeNotice(false); const orientation=(screen as any).orientation; if(orientation?.unlock) orientation.unlock();}}; document.addEventListener('fullscreenchange',onFullscreen); return()=>document.removeEventListener('fullscreenchange',onFullscreen);},[]);
  const inspect=()=>{const pos=playerPos.current; const place=PLACES.map(p=>({...p,d:Math.hypot(pos.x-p.x,pos.z-p.z)})).sort((a,b)=>a.d-b.d)[0]; if(place && place.d<13){visitPlace(place);}else{setDialog({name:'hint',ar:'اقترب من أحد المباني',en:'Get closer to a landmark',x:0,z:0,color:0xffffff,icon:'!',fact:'اقترب من المستشفى أو الصيدلية أو مركز التعلّم أو المركز المجتمعي، ثم اضغط تفاعل.',factEn:'Walk closer to the hospital, pharmacy, learning center, or community hub, then press Interact.'});}};
  inspectRef.current=inspect;
  return <main className="ow-page" dir={isAr?'rtl':'ltr'}><header className="ow-header"><Link to="/games" className="ow-back">← {isAr?'مركز الألعاب':'Game Center'}</Link><div><strong>🌎 {isAr?'المدينة الصحية المفتوحة':'Open Health World'}</strong><span>{isAr?'استكشف • تعلّم • اجمع النقاط':'Explore • Learn • Earn XP'}</span></div><div className="ow-xp">⭐ {xp} XP <small>{user ? (isAr?'مزامنة سحابية':'Cloud sync') : (isAr?'حفظ على هذا الجهاز':'Saved on this device')}</small></div><button className="ow-fullscreen" onClick={toggleFullscreen} aria-label={isFullscreen?(isAr?'إنهاء ملء الشاشة':'Exit fullscreen'):(isAr?'ملء الشاشة':'Fullscreen')}>{isFullscreen?'⤢':'⛶'} <span>{isFullscreen?(isAr?'إنهاء':'Exit'):(isAr?'ملء الشاشة':'Fullscreen')}</span></button></header>
    <section className="ow-layout"><div className="ow-stage"><div className="ow-scene" ref={mountRef}/><div className="ow-camera-hint">{isAr?'اسحب الشاشة لتدوير الكاميرا':'Drag the scene to rotate camera'}</div>{landscapeNotice&&<div className="ow-landscape-hint">{isAr?'لأفضل تجربة، أدر الهاتف للعرض':'For the best experience, rotate your phone to landscape'}<button onClick={()=>setLandscapeNotice(false)}>×</button></div>}<div className="ow-hud"><div className="ow-avatar">🧑🏻‍🎓</div><div className="ow-progress"><b>{isAr?'مهمة المدينة':'City Mission'}</b><span>{isAr?`زرت ${visited.length} من 4 أماكن`:`Visited ${visited.length} of 4 landmarks`}</span><div className="ow-bar"><i style={{width:`${Math.min(100,xp/80*100)}%`}}/></div></div><div className="ow-map"><span>🧭</span><small>{isAr?'المدينة':'CITY'}</small><i className="ow-map-dot dot1"/><i className="ow-map-dot dot2"/><i className="ow-map-dot dot3"/><i className="ow-map-dot dot4"/></div></div>{!ready&&<div className="ow-loading">{isAr?'جارٍ تجهيز العالم ثلاثي الأبعاد…':'Preparing 3D world…'}<small>{isAr?'إذا لم يدعم جهازك WebGL، جرّب متصفحًا حديثًا.':'If WebGL is unavailable, try a modern browser.'}</small></div>}
      {dialog&&<div className="ow-dialog"><button className="ow-close" onClick={()=>setDialog(null)}>×</button><b>{dialog.icon} {isAr?dialog.ar:dialog.en}</b><p>{isAr?dialog.fact:dialog.factEn}</p><button className="ow-primary" onClick={()=>setDialog(null)}>{isAr?'متابعة الاستكشاف':'Keep exploring'}</button></div>}
      <div className="ow-controls"><div className="ow-joystick" role="group" aria-label={isAr?'عصا الحركة':'Movement joystick'} onPointerDown={(e)=>{const el=e.currentTarget; el.setPointerCapture(e.pointerId); const r=el.getBoundingClientRect(); const update=(ev:PointerEvent)=>{const dx=(ev.clientX-(r.left+r.width/2))/(r.width*.34); const dy=(ev.clientY-(r.top+r.height/2))/(r.height*.34); const len=Math.hypot(dx,dy)||1; (window as any).__owMove={x:Math.max(-1,Math.min(1,dx/Math.max(1,len))),z:Math.max(-1,Math.min(1,dy/Math.max(1,len)))}; const knob=el.querySelector('.ow-joystick-knob') as HTMLElement|null; if(knob){knob.style.transform=`translate(${Math.max(-28,Math.min(28,dx*28))}px, ${Math.max(-28,Math.min(28,dy*28))}px)`;}}; (el as any).__owUpdate=update; update(e.nativeEvent as PointerEvent);}} onPointerMove={(e)=>{const el=e.currentTarget as any; if(e.buttons===0 && e.pointerType!=='touch')return; el.__owUpdate?.(e.nativeEvent);}} onPointerUp={(e)=>{stopMove(); const knob=e.currentTarget.querySelector('.ow-joystick-knob') as HTMLElement|null; if(knob)knob.style.transform='translate(0,0)';}} onPointerCancel={stopMove} onLostPointerCapture={stopMove}><span className="ow-joystick-ring">✥</span><span className="ow-joystick-knob"/></div><div className="ow-action-stack"><button className="ow-interact" onClick={inspect}>✋<span>{isAr?'تفاعل':'Interact'} (E)</span></button><span className="ow-camera-tip">{isAr?'اسحب بإصبعك لتدوير الكاميرا':'Drag to look around'}</span></div></div></div>
      <aside className="ow-sidebar"><span className="ow-kicker">OPEN WORLD • 3D</span><h1>{isAr?'مدينة صحية… عالم من المغامرات':'A healthier world starts with you'}</h1><p>{isAr?'تحرك بحرية بمنظور الشخص الثالث، واكتشف أربع مناطق، وتفاعل مع الأماكن لتتعلم الاستخدام المسؤول للمضادات الحيوية.':'Move freely in third person, explore four districts, and interact with landmarks to learn responsible antibiotic use.'}</p><div className="ow-place-list">{PLACES.map((p,i)=><button key={p.name} onClick={()=>visitPlace(p)}><span className="ow-place-icon">{p.icon}</span><span><b>{isAr?p.ar:p.en}</b><small>{isAr?'اكتشف معلومة واكسب 20 نقطة':'Discover a fact • +20 XP'}</small></span><span>›</span></button>)}</div><div className="ow-help"><b>🎮 {isAr?'التحكم':'Controls'}</b><p>{isAr?'الكمبيوتر: WASD أو الأسهم للحركة، و E للتفاعل. الهاتف: استخدم عصا الاتجاهات وزر التفاعل.':'Desktop: WASD / arrows to move, E to interact. Mobile: use the direction pad and Interact.'}</p></div><button className="ow-primary ow-reset" onClick={()=>{setXp(0);setVisited([]);setDialog(null);try{localStorage.removeItem(progressKey);}catch{} if(user&&db) void setDoc(doc(db,'users',user.uid,'gameProgress','openWorld'),{xp:0,visited:[],updatedAt:serverTimestamp()},{merge:true}).catch(error=>console.warn('Could not reset cloud progress:',error));}}>{isAr?'إعادة بدء الجولة':'Restart adventure'}</button></aside></section>
    <footer className="ow-footer">{isAr?'محتوى توعوي تعليمي — لا تستبدل اللعبة نصيحة الطبيب أو الصيدلي.':'Educational awareness game — not a substitute for advice from a clinician or pharmacist.'}</footer></main>;
}
