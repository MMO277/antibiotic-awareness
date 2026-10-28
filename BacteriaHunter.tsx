import { useEffect, useRef, useState, useCallback } from 'react';
import { useLang } from './i18n';
import { Lang, tr } from './types';
import { useGamingMode } from './useGamingMode';

// ─── Types ───────────────────────────────────────────────────────────────────

type GameState = 'menu' | 'difficulty' | 'playing' | 'paused' | 'gameover' | 'victory' | 'boss_intro';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Vec2 { x: number; y: number; }

interface Player {
  x: number; y: number;
  radius: number;
  hp: number; maxHp: number;
  speed: number;
  invincible: number; // frames of invincibility
  shield: number;     // frames of shield
  rapidFire: number;  // frames
  speedBoost: number; // frames
  lastShot: number;
}

interface Bullet {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  id: number;
}

interface Enemy {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  hp: number; maxHp: number;
  type: 'small' | 'medium' | 'large' | 'zigzag' | 'boss';
  color: string;
  shootCd: number;
  id: number;
  angle: number;  // for zigzag
  phase: number;  // oscillation phase
}

interface EnemyBullet {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  id: number;
}

interface PowerUp {
  x: number; y: number;
  type: 'shield' | 'rapid' | 'speed' | 'burst';
  id: number;
  life: number; // frames remaining
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string;
  radius: number;
}

interface Achievement {
  id: string;
  labelAr: string;
  labelEn: string;
  earned: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EDU_MESSAGES_AR = [
  'المضادات الحيوية تُقاتل البكتيريا فقط، وليس الفيروسات كالإنفلونزا.',
  'المقاومة تحدث في البكتيريا وليس في جسمك. استخدام المضاد الحيوي بشكل صحيح يُبطئها.',
  'لا تستخدم مضادًا حيويًا دون وصفة طبيب. الاستخدام العشوائي يُضعف فاعليتها.',
  'لا تُشارك وصفتك مع أحد حتى لو كانت الأعراض متشابهة.',
  'أتمم جرعات المضاد الحيوي كاملة حتى لو شعرت بتحسن مبكرًا.',
  'المقاومة للمضادات الحيوية تُهدد البشرية. كن واعيًا في استخدامها.',
];

const EDU_MESSAGES_EN = [
  'Antibiotics fight bacteria only, not viruses like flu or colds.',
  'Resistance develops in bacteria, not in your body. Correct use slows it down.',
  'Never use an antibiotic without a prescription — random use reduces effectiveness.',
  "Don't share your prescription, even if symptoms look the same.",
  'Always complete your full antibiotic course, even if you feel better early.',
  'Antibiotic resistance is a global threat. Use antibiotics responsibly.',
];

const EDU_MESSAGES_DE = [
  'Antibiotika bekämpfen nur Bakterien, keine Viren wie Grippe oder Erkältungen.',
  'Resistenzen entstehen in Bakterien, nicht im Körper. Richtige Anwendung bremst sie.',
  'Nehmen Sie niemals Antibiotika ohne Rezept — unkontrollierte Einnahme senkt die Wirksamkeit.',
  'Teilen Sie Ihr Rezept nicht mit anderen, selbst bei ähnlichen Symptomen.',
  'Beenden Sie immer die volle Antibiotika-Therapie, auch wenn Sie sich früher besser fühlen.',
  'Antibiotikaresistenz ist eine globale Bedrohung. Nutzen Sie Antibiotika verantwortungsvoll.',
];

const ACHIEVEMENTS_INIT: Achievement[] = [
  { id: 'first_kill', labelAr: '🦠 الصياد الأول', labelEn: '🦠 First Hunter', earned: false },
  { id: 'wave1', labelAr: '🌊 ناجي الموجة', labelEn: '🌊 Wave Survivor', earned: false },
  { id: 'boss', labelAr: '👑 قاهر البوس', labelEn: '👑 Boss Slayer', earned: false },
  { id: 'no_damage', labelAr: '🛡️ لا أذى', labelEn: '🛡️ Untouched', earned: false },
  { id: 'resistance', labelAr: '💡 الوعي بالمقاومة', labelEn: '💡 Resistance Awareness', earned: false },
];

let idCounter = 0;
const nextId = () => ++idCounter;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dist(a: Vec2, b: Vec2) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function spawnEdge(W: number, H: number): Vec2 {
  const side = Math.floor(Math.random() * 4);
  switch (side) {
    case 0: return { x: randRange(0, W), y: -30 };
    case 1: return { x: W + 30, y: randRange(0, H) };
    case 2: return { x: randRange(0, W), y: H + 30 };
    default: return { x: -30, y: randRange(0, H) };
  }
}

function makeEnemy(type: Enemy['type'], W: number, H: number, wave: number, diff: Difficulty): Enemy {
  const pos = spawnEdge(W, H);
  const scale = 1 + wave * 0.08 + (diff === 'hard' ? 0.3 : diff === 'medium' ? 0.15 : 0);
  // Always point toward center initially so enemies enter the screen
  const cx = W / 2 + randRange(-60, 60);
  const cy = H / 2 + randRange(-60, 60);
  const dx = cx - pos.x;
  const dy = cy - pos.y;
  const dl = Math.sqrt(dx * dx + dy * dy) || 1;
  const configs: Record<Enemy['type'], Partial<Enemy> & { color: string }> = {
    small:  { radius: 12, hp: 2, maxHp: 2, color: '#FF6B6B', vx: (dx/dl) * 1.6 * scale, vy: (dy/dl) * 1.6 * scale },
    medium: { radius: 20, hp: 5, maxHp: 5, color: '#FF9F43', vx: (dx/dl) * 1.0 * scale, vy: (dy/dl) * 1.0 * scale },
    large:  { radius: 28, hp: 10, maxHp: 10, color: '#9B59B6', vx: (dx/dl) * 0.7 * scale, vy: (dy/dl) * 0.7 * scale },
    zigzag: { radius: 14, hp: 3, maxHp: 3, color: '#1DD1A1', vx: (dx/dl) * 1.4 * scale, vy: (dy/dl) * 1.4 * scale },
    boss:   { radius: 45, hp: 80 + wave * 10, maxHp: 80 + wave * 10, color: '#C0392B', vx: (dx/dl) * 0.8, vy: (dy/dl) * 0.8 },
  };
  const cfg = configs[type];
  return {
    x: pos.x, y: pos.y,
    vx: cfg.vx ?? 0, vy: cfg.vy ?? 0,
    radius: cfg.radius ?? 16,
    hp: cfg.hp ?? 3, maxHp: cfg.maxHp ?? 3,
    type, color: cfg.color,
    shootCd: type === 'large' || type === 'boss' ? 120 : 999,
    id: nextId(),
    angle: 0, phase: Math.random() * Math.PI * 2,
  };
}

// ─── Game Engine Hook ─────────────────────────────────────────────────────────

type CanvasMetrics = { w: number; h: number; dpr: number };

function useGameEngine(canvasRef: React.RefObject<HTMLCanvasElement>, isAr: boolean, lang: Lang, sizeRef: React.MutableRefObject<CanvasMetrics>) {
  const stateRef = useRef({
    gameState: 'menu' as GameState,
    difficulty: 'easy' as Difficulty,
    player: null as Player | null,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    enemyBullets: [] as EnemyBullet[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    score: 0,
    wave: 0,
    waveEnemiesLeft: 0,
    waveTimer: 0,
    frameCount: 0,
    totalKills: 0,
    wavesCompleted: 0,
    bossActive: false,
    showEdu: false,
    eduMsg: '',
    eduTimer: 0,
    achievements: ACHIEVEMENTS_INIT.map(a => ({ ...a })),
    highScore: parseInt(localStorage.getItem('bh_highscore') || '0'),
    damageTaken: false,
    lastAchievement: '',
    achievementTimer: 0,
    muted: false,
  });
  const S = stateRef.current;

  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<Vec2>({ x: 0, y: 0 });
  const mouseDownRef = useRef(false);
  const joyRef = useRef({ active: false, sx: 0, sy: 0, cx: 0, cy: 0 });
  const shootBtnRef = useRef(false);
  const rafRef = useRef<number>(0);
  const [uiTick, setUiTick] = useState(0);
  const tick = useCallback(() => setUiTick(t => t + 1), []);

  // ─── Init Player ───────────────────────────────────────────────────────────
  const initGame = useCallback((diff: Difficulty) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = sizeRef.current.w, H = sizeRef.current.h;
    S.difficulty = diff;
    S.player = {
      x: W / 2, y: H / 2,
      radius: 18,
      hp: diff === 'easy' ? 5 : diff === 'medium' ? 4 : 3,
      maxHp: diff === 'easy' ? 5 : diff === 'medium' ? 4 : 3,
      speed: diff === 'hard' ? 3.5 : 4,
      invincible: 0, shield: 0, rapidFire: 0, speedBoost: 0,
      lastShot: 0,
    };
    S.bullets = []; S.enemies = []; S.enemyBullets = [];
    S.powerUps = []; S.particles = [];
    S.score = 0; S.wave = 1; S.waveEnemiesLeft = -2; S.waveTimer = 90;
    S.frameCount = 0; S.totalKills = 0; S.wavesCompleted = 0;
    S.bossActive = false; S.showEdu = false;
    S.achievements = ACHIEVEMENTS_INIT.map(a => ({ ...a }));
    S.damageTaken = false;
    S.achievementTimer = 0; S.lastAchievement = '';
    S.gameState = 'playing';
    tick();
  }, [S, canvasRef, sizeRef, tick]);

  // ─── Spawn Wave ────────────────────────────────────────────────────────────
  const spawnWave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = sizeRef.current.w, H = sizeRef.current.h;
    const wave = S.wave;
    const isBossWave = wave > 0 && wave % 4 === 0;
    if (isBossWave) {
      S.bossActive = true;
      S.enemies.push(makeEnemy('boss', W, H, wave, S.difficulty));
      S.waveEnemiesLeft = 1;
      S.gameState = 'boss_intro';
      setTimeout(() => { if (S.gameState === 'boss_intro') S.gameState = 'playing'; tick(); }, 2500);
    } else {
      S.bossActive = false;
      const count = 2 + wave * 2 + (S.difficulty === 'hard' ? 3 : S.difficulty === 'medium' ? 1 : 0);
      for (let i = 0; i < count; i++) {
        const r = Math.random();
        let type: Enemy['type'] = 'small';
        if (wave >= 3 && r > 0.85) type = 'large';
        else if (wave >= 2 && r > 0.65) type = 'medium';
        else if (wave >= 2 && r > 0.45) type = 'zigzag';
        S.enemies.push(makeEnemy(type, W, H, wave, S.difficulty));
      }
      S.waveEnemiesLeft = count;
    }
    // Show edu message sometimes
    if (wave > 0 && wave % 2 === 0) {
      const msgs = isAr ? EDU_MESSAGES_AR : lang === 'de' ? EDU_MESSAGES_DE : EDU_MESSAGES_EN;
      S.eduMsg = msgs[Math.floor(Math.random() * msgs.length)];
      S.showEdu = true;
      S.eduTimer = 240;
    }
  }, [S, canvasRef, sizeRef, isAr, lang, tick]);

  // ─── Achievements helper ───────────────────────────────────────────────────
  const earn = useCallback((id: string, label: string) => {
    const a = S.achievements.find(x => x.id === id);
    if (!a || a.earned) return;
    a.earned = true;
    S.lastAchievement = label;
    S.achievementTimer = 200;
    tick();
  }, [S, tick]);

  // ─── Spawn particle burst ──────────────────────────────────────────────────
  const burst = useCallback((x: number, y: number, color: string, n = 8) => {
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const spd = randRange(1.5, 4);
      S.particles.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 40, maxLife: 40, color, radius: randRange(2, 5) });
    }
  }, [S]);

  // ─── Main Loop ─────────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = sizeRef.current.w, H = sizeRef.current.h;
    ctx.setTransform(sizeRef.current.dpr, 0, 0, sizeRef.current.dpr, 0, 0);
    const gs = S.gameState;
    S.frameCount++;

    if (gs === 'playing') {
      const p = S.player!;
      const speed = p.speed * (p.speedBoost > 0 ? 1.6 : 1);

      // ─ Movement (keyboard) ─
      let dx = 0, dy = 0;
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) dy -= 1;
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) dy += 1;
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) dx -= 1;
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) dx += 1;

      // ─ Joystick movement ─
      const joy = joyRef.current;
      if (joy.active) {
        const jdx = joy.cx - joy.sx;
        const jdy = joy.cy - joy.sy;
        const jdist = Math.sqrt(jdx * jdx + jdy * jdy);
        if (jdist > 8) {
          const norm = Math.min(jdist, 45) / 45;
          dx += (jdx / jdist) * norm;
          dy += (jdy / jdist) * norm;
        }
      }

      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        p.x = clamp(p.x + (dx / len) * speed, p.radius, W - p.radius);
        p.y = clamp(p.y + (dy / len) * speed, p.radius, H - p.radius);
      }

      // ─ Shooting ─
      const fireRate = p.rapidFire > 0 ? 8 : 18;
      const shouldShoot = keysRef.current.has(' ') || mouseDownRef.current || shootBtnRef.current;
      if (shouldShoot && S.frameCount - p.lastShot >= fireRate) {
        const tx = mouseDownRef.current ? mouseRef.current.x : p.x;
        const ty = mouseDownRef.current ? mouseRef.current.y : p.y - 1;
        const bx = tx - p.x, by = ty - p.y;
        const blen = Math.sqrt(bx * bx + by * by) || 1;
        const spd = 9;
        S.bullets.push({ x: p.x, y: p.y, vx: (bx / blen) * spd, vy: (by / blen) * spd, radius: 5, id: nextId() });
        p.lastShot = S.frameCount;
      }

      // ─ Move bullets ─
      S.bullets = S.bullets.filter(b => {
        b.x += b.vx; b.y += b.vy;
        return b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20;
      });

      // ─ Move & update enemies ─
      for (const e of S.enemies) {
        if (e.type === 'zigzag') {
          e.phase += 0.06;
          e.angle += 0.025;
          const tx2 = p.x - e.x, ty2 = p.y - e.y;
          const tl = Math.sqrt(tx2 * tx2 + ty2 * ty2) || 1;
          const spd = 1.5 + (S.wave * 0.05);
          e.vx = (tx2 / tl) * spd + Math.cos(e.phase) * 1.8;
          e.vy = (ty2 / tl) * spd + Math.sin(e.phase) * 1.8;
        } else if (e.type === 'boss') {
          // boss bounces around
          if (e.x <= e.radius || e.x >= W - e.radius) e.vx *= -1;
          if (e.y <= e.radius || e.y >= H - e.radius) e.vy *= -1;
          // Boss shoots in 4 directions
          e.shootCd--;
          if (e.shootCd <= 0) {
            for (let a = 0; a < 6; a++) {
              const angle = (Math.PI * 2 * a) / 6;
              S.enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 2.5, vy: Math.sin(angle) * 2.5, radius: 6, id: nextId() });
            }
            e.shootCd = S.difficulty === 'easy' ? 90 : S.difficulty === 'medium' ? 70 : 55;
          }
        } else if (e.type === 'large') {
          // large shoots at player
          const tx2 = p.x - e.x, ty2 = p.y - e.y;
          const tl = Math.sqrt(tx2 * tx2 + ty2 * ty2) || 1;
          e.vx = (tx2 / tl) * 0.7;
          e.vy = (ty2 / tl) * 0.7;
          e.shootCd--;
          if (e.shootCd <= 0) {
            S.enemyBullets.push({ x: e.x, y: e.y, vx: (tx2 / tl) * 2, vy: (ty2 / tl) * 2, radius: 5, id: nextId() });
            e.shootCd = S.difficulty === 'easy' ? 100 : 70;
          }
        } else {
          // small/medium home on player
          const tx2 = p.x - e.x, ty2 = p.y - e.y;
          const tl = Math.sqrt(tx2 * tx2 + ty2 * ty2) || 1;
          const spd = e.type === 'small' ? (1.5 + S.wave * 0.06) : 1.1;
          e.vx += ((tx2 / tl) * spd - e.vx) * 0.08;
          e.vy += ((ty2 / tl) * spd - e.vy) * 0.08;
        }
        e.x += e.vx; e.y += e.vy;
        if (e.type !== 'boss') {
          e.x = clamp(e.x, -80, W + 80);
          e.y = clamp(e.y, -80, H + 80);
        } else {
          e.x = clamp(e.x, e.radius, W - e.radius);
          e.y = clamp(e.y, e.radius, H - e.radius);
        }
      }

      // ─ Enemy bullet movement ─
      S.enemyBullets = S.enemyBullets.filter(b => {
        b.x += b.vx; b.y += b.vy;
        return b.x > -40 && b.x < W + 40 && b.y > -40 && b.y < H + 40;
      });

      // ─ Bullet-Enemy collision ─
      const toRemoveBullets = new Set<number>();
      for (const e of S.enemies) {
        for (const b of S.bullets) {
          if (toRemoveBullets.has(b.id)) continue;
          if (dist(b, e) < b.radius + e.radius) {
            e.hp--;
            toRemoveBullets.add(b.id);
            burst(b.x, b.y, e.color, 5);
            if (e.hp <= 0) {
              S.score += e.type === 'boss' ? 500 : e.type === 'large' ? 30 : e.type === 'medium' ? 15 : 10;
              S.totalKills++;
              S.waveEnemiesLeft--;
              burst(e.x, e.y, e.color, 14);
              if (S.totalKills === 1) earn('first_kill', tr(lang, '🦠 الصياد الأول', '🦠 First Hunter', '🦠 Premier Chasseur', '🦠 Primer Cazador', '🦠 Erster Jäger'));
              if (e.type === 'boss') {
                earn('boss', tr(lang, '👑 قاهر البوس', '👑 Boss Slayer', '👑 Tueur de Boss', '👑 Cazador de Jefes', '👑 Boss-Bezwinger'));
                earn('resistance', tr(lang, '💡 الوعي بالمقاومة', '💡 Resistance Awareness', '💡 Conscience AMR', '💡 Conciencia RAM', '💡 Resistenz-Bewusstsein'));
              }
              // Maybe drop power-up
              if (Math.random() < 0.2) {
                const types: PowerUp['type'][] = ['shield', 'rapid', 'speed', 'burst'];
                S.powerUps.push({ x: e.x, y: e.y, type: types[Math.floor(Math.random() * types.length)], id: nextId(), life: 300 });
              }
            }
          }
        }
      }
      S.bullets = S.bullets.filter(b => !toRemoveBullets.has(b.id));
      S.enemies = S.enemies.filter(e => e.hp > 0);

      // ─ Player-Enemy collision ─
      if (p.invincible <= 0) {
        for (const e of S.enemies) {
          if (dist(p, e) < p.radius + e.radius - 4) {
            if (p.shield > 0) {
              p.shield = 0;
              p.invincible = 60;
              burst(p.x, p.y, '#00D2FF', 10);
            } else {
              p.hp--;
              p.invincible = 80;
              S.damageTaken = true;
              burst(p.x, p.y, '#FF6B6B', 8);
              if (p.hp <= 0) { S.gameState = 'gameover'; tick(); return; }
            }
          }
        }
        // Enemy bullets
        for (const b of S.enemyBullets) {
          if (dist(p, b) < p.radius + b.radius) {
            if (p.shield > 0) {
              p.shield = 0;
              p.invincible = 60;
            } else {
              p.hp--;
              p.invincible = 60;
              S.damageTaken = true;
              burst(p.x, p.y, '#FF6B6B', 6);
              if (p.hp <= 0) { S.gameState = 'gameover'; tick(); return; }
            }
            S.enemyBullets = S.enemyBullets.filter(eb => eb.id !== b.id);
          }
        }
      } else { p.invincible--; }
      if (p.shield > 0) p.shield--;
      if (p.rapidFire > 0) p.rapidFire--;
      if (p.speedBoost > 0) p.speedBoost--;

      // ─ Power-up collection ─
      S.powerUps = S.powerUps.filter(pu => {
        pu.life--;
        if (pu.life <= 0) return false;
        if (dist(p, pu) < p.radius + 14) {
          switch (pu.type) {
            case 'shield':    p.shield = 300; break;
            case 'rapid':     p.rapidFire = 300; break;
            case 'speed':     p.speedBoost = 300; break;
            case 'burst':
              for (let a = 0; a < 12; a++) {
                const angle = (Math.PI * 2 * a) / 12;
                S.bullets.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8, radius: 5, id: nextId() });
              }
              break;
          }
          burst(pu.x, pu.y, '#FFD700', 12);
          return false;
        }
        return true;
      });

      // ─ Particles ─
      S.particles = S.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.life--; pt.vx *= 0.92; pt.vy *= 0.92; return pt.life > 0; });

      // ─ Wave completion ─
      if (S.waveEnemiesLeft === 0 && S.enemies.length === 0) {
        if (S.bossActive) {
          S.bossActive = false;
          if (S.wave >= 12) {
            S.gameState = 'victory';
            if (!S.damageTaken) earn('no_damage', tr(lang, '🛡️ لا أذى', '🛡️ Untouched', '🛡️ Intouchable', '🛡️ Intacto', '🛡️ Unversehrt'));
            tick();
            return;
          }
        }
        S.wavesCompleted++;
        earn('wave1', tr(lang, '🌊 ناجي الموجة', '🌊 Wave Survivor', '🌊 Survivant de Vague', '🌊 Superviviente de Ola', '🌊 Wellen-Überlebender'));
        S.wave++;
        S.waveTimer = 150;
        S.waveEnemiesLeft = -1;
      }

      // -2 = first wave countdown, -1 = between waves countdown
      if (S.waveEnemiesLeft === -2 || S.waveEnemiesLeft === -1) {
        S.waveTimer--;
        if (S.waveTimer <= 0) {
          spawnWave();
        }
      }

      // ─ Edu message countdown ─
      if (S.showEdu) { S.eduTimer--; if (S.eduTimer <= 0) S.showEdu = false; }
      if (S.achievementTimer > 0) S.achievementTimer--;

      // ─ Update high score ─
      if (S.score > S.highScore) {
        S.highScore = S.score;
        localStorage.setItem('bh_highscore', String(S.score));
      }
    }

    // ─── Draw ───────────────────────────────────────────────────────────────
    // Background
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#030d1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Grid pattern
    ctx.strokeStyle = 'rgba(0,200,255,0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let gx = 0; gx < W; gx += gridSize) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += gridSize) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    if (gs === 'playing' || gs === 'paused' || gs === 'boss_intro') {
      const p = S.player!;

      // ─ Draw power-ups ─
      for (const pu of S.powerUps) {
        const colors: Record<string, string> = { shield: '#00D2FF', rapid: '#FF6B6B', speed: '#FFD700', burst: '#A29BFE' };
        const icons: Record<string, string> = { shield: '🛡', rapid: '⚡', speed: '💨', burst: '💥' };
        const pulse = 0.8 + 0.2 * Math.sin(S.frameCount * 0.1);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = colors[pu.type] + '33';
        ctx.beginPath(); ctx.arc(pu.x, pu.y, 18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = colors[pu.type];
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.font = '16px serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(icons[pu.type], pu.x, pu.y);
        ctx.restore();
      }

      // ─ Draw enemy bullets ─
      for (const b of S.enemyBullets) {
        ctx.save();
        const ebGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        ebGrad.addColorStop(0, '#FF6B6B');
        ebGrad.addColorStop(1, '#C0392B');
        ctx.fillStyle = ebGrad;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // ─ Draw enemies ─
      for (const e of S.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        if (e.type === 'boss') {
          const pulse = 0.9 + 0.1 * Math.sin(S.frameCount * 0.08);
          ctx.scale(pulse, pulse);
        }

        // Body
        const eg = ctx.createRadialGradient(0, 0, 0, 0, 0, e.radius);
        eg.addColorStop(0, e.color + 'DD');
        eg.addColorStop(1, e.color + '66');
        ctx.fillStyle = eg;
        ctx.beginPath();
        if (e.type === 'large' || e.type === 'boss') {
          // Hexagon-ish for large/boss
          const sides = e.type === 'boss' ? 8 : 6;
          for (let i = 0; i < sides; i++) {
            const a = (Math.PI * 2 * i) / sides + S.frameCount * 0.01;
            const r2 = e.radius * (1 + 0.1 * Math.sin(S.frameCount * 0.05 + i));
            if (i === 0) ctx.moveTo(Math.cos(a) * r2, Math.sin(a) * r2);
            else ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
          }
          ctx.closePath();
        } else {
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Eyes
        const eyeX = e.type === 'zigzag' ? 4 : 5;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-eyeX, -3, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX, -3, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(-eyeX + 0.5, -2.5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX + 0.5, -2.5, 2, 0, Math.PI * 2); ctx.fill();

        // HP bar for boss/large
        if (e.type === 'boss' || e.type === 'large') {
          const bw = e.radius * 2;
          ctx.fillStyle = '#333'; ctx.fillRect(-e.radius, e.radius + 6, bw, 5);
          ctx.fillStyle = e.hp / e.maxHp > 0.4 ? '#2ECC71' : '#E74C3C';
          ctx.fillRect(-e.radius, e.radius + 6, bw * (e.hp / e.maxHp), 5);
        }
        ctx.restore();
      }

      // ─ Draw particles ─
      for (const pt of S.particles) {
        ctx.save();
        ctx.globalAlpha = pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // ─ Draw player bullets ─
      for (const b of S.bullets) {
        ctx.save();
        const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius + 3);
        bg.addColorStop(0, '#00FFFF');
        bg.addColorStop(1, 'rgba(0,150,255,0)');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius + 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // ─ Draw player ─
      const t2 = S.frameCount;
      const flash = p.invincible > 0 && Math.floor(p.invincible / 6) % 2 === 0;
      if (!flash) {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Shield visual
        if (p.shield > 0) {
          ctx.save();
          ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t2 * 0.1);
          ctx.strokeStyle = '#00D2FF';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, p.radius + 10, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }

        // Body glow
        const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius + 6);
        pg.addColorStop(0, 'rgba(0,210,255,0.25)');
        pg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2); ctx.fill();

        // Body
        const pb = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
        pb.addColorStop(0, '#00E5FF');
        pb.addColorStop(0.6, '#0097A7');
        pb.addColorStop(1, '#006064');
        ctx.fillStyle = pb; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();

        // Cross / plus shape
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.stroke();

        // Rotation ring
        ctx.strokeStyle = 'rgba(0,230,255,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, p.radius - 4, t2 * 0.04, t2 * 0.04 + Math.PI * 1.5); ctx.stroke();
        ctx.restore();
      }

      // ─ HUD ─
      // HP bar
      const hpW = Math.min(W * 0.35, 160);
      const hpH = 10;
      const hpX = 10, hpY = 10;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(hpX - 1, hpY - 1, hpW + 2, hpH + 2);
      ctx.fillStyle = '#333'; ctx.fillRect(hpX, hpY, hpW, hpH);
      const hpRatio = p.hp / p.maxHp;
      ctx.fillStyle = hpRatio > 0.5 ? '#2ECC71' : hpRatio > 0.25 ? '#F39C12' : '#E74C3C';
      ctx.fillRect(hpX, hpY, hpW * hpRatio, hpH);
      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`❤️ ${p.hp}/${p.maxHp}`, hpX, hpY + hpH + 13);

      // Score
      ctx.fillStyle = '#00D2FF'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(`${tr(lang, 'النقاط', 'Score', 'Score', 'Puntos', 'Punkte')}: ${S.score}`, W - 10, 22);
      ctx.fillStyle = '#7f8c8d'; ctx.font = '11px sans-serif';
      ctx.fillText(`${tr(lang, 'أعلى', 'Best', 'Record', 'Récord', 'Rekord')}: ${S.highScore}`, W - 10, 38);

      // Wave
      ctx.fillStyle = '#BDC3C7'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${tr(lang, 'الموجة', 'Wave', 'Vague', 'Ola', 'Welle')} ${S.wave}`, W / 2, 18);
      if (S.bossActive) {
        ctx.fillStyle = '#E74C3C'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText(tr(lang, '⚠️ موجة البوس!', '⚠️ BOSS WAVE!', '⚠️ VAGUE BOSS !', '⚠️ ¡OLA DE JEFE!', '⚠️ BOSS-WELLE!'), W / 2, 34);
      }

      // Active power-up indicators
      let puY = hpY + hpH + 28;
      ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      if (p.shield > 0) { ctx.fillStyle = '#00D2FF'; ctx.fillText(`🛡 ${Math.ceil(p.shield / 60)}s`, hpX, puY); puY += 16; }
      if (p.rapidFire > 0) { ctx.fillStyle = '#FF6B6B'; ctx.fillText(`⚡ ${Math.ceil(p.rapidFire / 60)}s`, hpX, puY); puY += 16; }
      if (p.speedBoost > 0) { ctx.fillStyle = '#FFD700'; ctx.fillText(`💨 ${Math.ceil(p.speedBoost / 60)}s`, hpX, puY); }

      // Edu message
      if (S.showEdu && S.eduTimer > 0) {
        const alpha = Math.min(1, S.eduTimer / 30);
        ctx.save();
        ctx.globalAlpha = alpha;
        const msgW = Math.min(W - 20, 340);
        const msgX = (W - msgW) / 2;
        const msgY = H - 75;
        ctx.fillStyle = 'rgba(0,20,40,0.88)';
        ctx.beginPath();
        ctx.roundRect(msgX, msgY, msgW, 52, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,200,255,0.4)'; ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#00D2FF'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(tr(lang, '💡 هل تعلم؟', '💡 Did you know?', '💡 Le saviez-vous ?', '💡 ¿Sabías que?', '💡 Wussten Sie schon?'), W / 2, msgY + 16);
        ctx.fillStyle = '#ECF0F1'; ctx.font = '11px sans-serif';
        // Word wrap
        const words = S.eduMsg.split(' ');
        let line = '', lineY = msgY + 32;
        for (const word of words) {
          const test = line ? line + ' ' + word : word;
          if (ctx.measureText(test).width > msgW - 16) {
            ctx.fillText(line, W / 2, lineY); line = word; lineY += 14;
          } else { line = test; }
        }
        ctx.fillText(line, W / 2, lineY);
        ctx.restore();
      }

      // Achievement pop
      if (S.achievementTimer > 0 && S.lastAchievement) {
        const alpha = Math.min(1, S.achievementTimer / 30);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,30,10,0.9)';
        ctx.beginPath(); ctx.roundRect(W / 2 - 120, 50, 240, 38, 8); ctx.fill();
        ctx.strokeStyle = '#2ECC71'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#2ECC71'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(isAr ? `🏆 إنجاز: ${S.lastAchievement}` : lang === 'de' ? `🏆 Erfolg: ${S.lastAchievement}` : `🏆 Achievement: ${S.lastAchievement}`, W / 2, 74);
        ctx.restore();
      }

      // ─ Boss intro overlay ─
      if (gs === 'boss_intro') {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#E74C3C'; ctx.font = `bold ${Math.min(W * 0.08, 36)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(tr(lang, '⚠️ تحذير: المقاومة تقترب!', '⚠️ WARNING: RESISTANCE INCOMING!', '⚠️ ALERTE : RÉSISTANCE EN APPROCHE !', '⚠️ ¡ALERTA: RESISTENCIA EN CAMINO!', '⚠️ WARNUNG: RESISTENZ IM ANMARSCH!'), W / 2, H / 2 - 20);
        ctx.fillStyle = '#BDC3C7'; ctx.font = `${Math.min(W * 0.035, 15)}px sans-serif`;
        ctx.fillText(tr(lang, 'بكتيريا مقاومة للمضادات الحيوية — الأصعب!', 'Antibiotic-Resistant Bacteria — Toughest foe!', 'Bactérie multirésistante — L’ennemi le plus coriace !', '¡Bacteria resistente — El enemigo más difícil!', 'Multiresistente Bakterien — Der härteste Gegner!'), W / 2, H / 2 + 20);
        ctx.restore();
      }

      // ─ Pause overlay ─
      if (gs === 'paused') {
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ECF0F1'; ctx.font = `bold ${Math.min(W * 0.08, 34)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(tr(lang, '⏸ إيقاف مؤقت', '⏸ PAUSED', '⏸ PAUSE', '⏸ PAUSA', '⏸ PAUSIERT'), W / 2, H / 2 - 10);
        ctx.fillStyle = '#BDC3C7'; ctx.font = `${Math.min(W * 0.035, 14)}px sans-serif`;
        ctx.fillText(tr(lang, 'اضغط Esc أو زر الإيقاف للمتابعة', 'Press Esc or tap Pause to continue', 'Appuyez sur Échap ou Pause pour continuer', 'Pulsa Esc o Pausa para continuar', 'Esc drücken oder Pause tippen zum Fortsetzen'), W / 2, H / 2 + 22);
        ctx.restore();
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [S, spawnWave, burst, earn, isAr, lang, tick]);

  // ─── Start/stop loop ──────────────────────────────────────────────────────
  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  // ─── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'Escape' || e.key === 'p') {
        if (S.gameState === 'playing') S.gameState = 'paused';
        else if (S.gameState === 'paused') S.gameState = 'playing';
        tick();
      }
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [S, tick]);

  // ─── Mouse ────────────────────────────────────────────────────────────────
  const bindMouse = useCallback((canvas: HTMLCanvasElement) => {
    const rect = () => canvas.getBoundingClientRect();
    const toCanvas = (cx: number, cy: number) => {
      const r = rect();
      return { x: (cx - r.left) * (sizeRef.current.w / r.width), y: (cy - r.top) * (sizeRef.current.h / r.height) };
    };
    const mm = (e: MouseEvent) => { const p = toCanvas(e.clientX, e.clientY); mouseRef.current = p; };
    const md = (e: MouseEvent) => { mouseDownRef.current = true; const p = toCanvas(e.clientX, e.clientY); mouseRef.current = p; };
    const mu = () => mouseDownRef.current = false;
    canvas.addEventListener('mousemove', mm);
    canvas.addEventListener('mousedown', md);
    window.addEventListener('mouseup', mu);
    return () => { canvas.removeEventListener('mousemove', mm); canvas.removeEventListener('mousedown', md); window.removeEventListener('mouseup', mu); };
  }, [sizeRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return bindMouse(canvas);
  }, [bindMouse, canvasRef]);

  return { S, keysRef, joyRef, shootBtnRef, initGame, uiTick, tick };
}

// ─── Joystick Component ───────────────────────────────────────────────────────

function Joystick({ joyRef, size = 90 }: { joyRef: React.MutableRefObject<{ active: boolean; sx: number; sy: number; cx: number; cy: number }>; size?: number }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number>(-1);

  const getCenter = () => {
    const el = baseRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  const onStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    activeId.current = t.identifier;
    const c = getCenter();
    joyRef.current = { active: true, sx: c.x, sy: c.y, cx: t.clientX, cy: t.clientY };
  };

  const onMove = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === activeId.current) {
        const j = joyRef.current;
        joyRef.current = { ...j, cx: t.clientX, cy: t.clientY };
      }
    }
  };

  const onEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeId.current) {
        joyRef.current = { active: false, sx: 0, sy: 0, cx: 0, cy: 0 };
        activeId.current = -1;
      }
    }
  };

  const joy = joyRef.current;
  let knobX = 0, knobY = 0;
  if (joy.active) {
    const dx = joy.cx - joy.sx, dy = joy.cy - joy.sy;
    const d = Math.sqrt(dx * dx + dy * dy);
    const max = size * 0.38;
    const clamped = Math.min(d, max);
    knobX = d > 0 ? (dx / d) * clamped : 0;
    knobY = d > 0 ? (dy / d) * clamped : 0;
  }

  return (
    <div ref={baseRef} className="bh-joystick-base"
      style={{ width: size, height: size, position: 'relative', borderRadius: '50%', background: 'rgba(0,200,255,0.12)', border: '2px solid rgba(0,200,255,0.3)', touchAction: 'none', flexShrink: 0 }}
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}>
      <div style={{ position: 'absolute', left: size / 2 - 18 + knobX, top: size / 2 - 18 + knobY, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,210,255,0.65)', border: '2px solid rgba(0,230,255,0.9)', pointerEvents: 'none' }} />
    </div>
  );
}

// Mobile-portrait layout reserves (CSS px): joystick/shoot row, and wrapper/page padding.
const BH_CONTROLS_RESERVE = 124;
const BH_CHROME_RESERVE = 40;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BacteriaHunter() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null);
  // Logical game size (CSS px) is kept separate from the canvas backing-store size (CSS px × dpr).
  const sizeRef = useRef<CanvasMetrics>({ w: 360, h: 560, dpr: 1 });
  const [canvasSize, setCanvasSize] = useState<CanvasMetrics>({ w: 360, h: 560, dpr: 1 });
  const { S, joyRef, shootBtnRef, initGame, uiTick, tick } = useGameEngine(canvasRef, isAr, lang, sizeRef);

  // ─── Gaming Mode (fullscreen / immersive layout) ───────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  // If native fullscreen ends without the Exit button (Esc / system gesture), pause the run safely.
  const onNativeFullscreenLost = useCallback(() => {
    if (S.gameState === 'playing') { S.gameState = 'paused'; tick(); }
  }, [S, tick]);
  const gaming = useGamingMode(wrapperRef, onNativeFullscreenLost);
  const gamingActive = gaming.active;

  // Resize canvas
  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const vv = window.visualViewport;
      const vw = window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      let w: number, h: number, dpr = 1;
      if (gamingActive) {
        // Gaming Mode: the container is a flex child that fills the whole viewport (see .bh-immersive),
        // so measure its real size. Logical size == displayed size => no stretching, touch/collision stay correct.
        el.style.height = '';
        w = Math.floor(el.clientWidth);
        h = Math.floor(el.clientHeight);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (w < 50 || h < 50) return; // layout not ready yet; ResizeObserver will call again
      } else if (vw <= 700 && window.innerHeight > vw) {
        // Mobile portrait menu screens: explicit height instead of collapsing to the canvas' default 360:560.
        const topBar = document.querySelector('header.top')?.getBoundingClientRect().height ?? 64;
        const avail = Math.floor(vh - topBar - BH_CONTROLS_RESERVE - BH_CHROME_RESERVE);
        el.style.height = `${Math.max(320, avail)}px`;
        w = Math.floor(el.clientWidth);
        h = Math.floor(el.clientHeight);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
      } else {
        el.style.height = '';
        const r = el.getBoundingClientRect();
        w = Math.floor(r.width);
        h = Math.floor(Math.min(r.height, window.innerHeight * 0.72));
      }
      const prev = sizeRef.current;
      if (prev.w === w && prev.h === h && prev.dpr === dpr) return;
      sizeRef.current = { w, h, dpr };
      // keep the player at the same relative spot inside the new play area
      const pl = S.player;
      if (pl) {
        if (prev.w > 0 && prev.h > 0) { pl.x = (pl.x / prev.w) * w; pl.y = (pl.y / prev.h) * h; }
        pl.x = Math.min(Math.max(pl.x, pl.radius), w - pl.radius);
        pl.y = Math.min(Math.max(pl.y, pl.radius), h - pl.radius);
      }
      setCanvasSize({ w, h, dpr });
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    const vv = window.visualViewport;
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    vv?.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      vv?.removeEventListener('resize', update);
    };
  }, [S, gamingActive]);

  // Prevent page scroll when touch is on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevent = (e: TouchEvent) => { if (S.gameState === 'playing') e.preventDefault(); };
    canvas.addEventListener('touchstart', prevent, { passive: false });
    canvas.addEventListener('touchmove', prevent, { passive: false });
    return () => { canvas.removeEventListener('touchstart', prevent); canvas.removeEventListener('touchmove', prevent); };
  }, [S]);

  void uiTick; // triggers re-render

  const gs = S.gameState;

  // ─── Overlays ─────────────────────────────────────────────────────────────
  const renderOverlay = () => {
    // Menu
    if (gs === 'menu') {
      return (
        <div className="bh-overlay">
          <div className="bh-card">
            <div className="bh-logo">🦠</div>
            <h1 className="bh-title">{isAr ? 'صائد البكتيريا' : 'Bacteria Hunter'}</h1>
            <p className="bh-subtitle">{isAr ? 'دافع عن المجهر ضد غزو البكتيريا!' : 'Defend the microscope against bacterial invasion!'}</p>
            <div className="bh-controls-hint">
              <p>{isAr ? '🖥 كيبورد: WASD للحركة • مسافة/فأرة للتصوير • Esc للإيقاف' : '🖥 Desktop: WASD move • Space/Mouse shoot • Esc pause'}</p>
              <p>{isAr ? '📱 موبايل: ستيك للحركة • زر 🔵 للتصوير' : '📱 Mobile: Stick to move • 🔵 button to shoot'}</p>
            </div>
            <button className="bh-btn bh-btn-primary" onClick={() => { S.gameState = 'difficulty'; tick(); }}>
              {isAr ? '▶ ابدأ اللعبة' : '▶ Start Game'}
            </button>
            <div className="bh-highscore">{isAr ? `🏆 أعلى نتيجة: ${S.highScore}` : `🏆 High Score: ${S.highScore}`}</div>
          </div>
        </div>
      );
    }

    // Difficulty select
    if (gs === 'difficulty') {
      return (
        <div className="bh-overlay">
          <div className="bh-card">
            <h2 className="bh-title" style={{ fontSize: '1.3rem' }}>{isAr ? 'اختر مستوى الصعوبة' : 'Select Difficulty'}</h2>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button key={d} className={`bh-btn bh-diff-btn bh-diff-${d}`} onClick={() => startGame(d)}>
                {d === 'easy' ? (isAr ? '🟢 سهل' : '🟢 Easy') : d === 'medium' ? (isAr ? '🟡 متوسط' : '🟡 Medium') : (isAr ? '🔴 صعب' : '🔴 Hard')}
              </button>
            ))}
            <button className="bh-btn bh-btn-ghost" onClick={() => { S.gameState = 'menu'; tick(); }}>{isAr ? '← رجوع' : '← Back'}</button>
          </div>
        </div>
      );
    }

    // Game Over
    if (gs === 'gameover') {
      return (
        <div className="bh-overlay">
          <div className="bh-card">
            <div className="bh-logo">💀</div>
            <h2 className="bh-title">{isAr ? 'انتهت اللعبة!' : 'Game Over!'}</h2>
            <div className="bh-result-stats">
              <div>{isAr ? 'النقاط' : 'Score'}: <b>{S.score}</b></div>
              <div>{isAr ? 'الموجات' : 'Waves'}: <b>{S.wavesCompleted}</b></div>
              <div>{isAr ? 'القتلى' : 'Kills'}: <b>{S.totalKills}</b></div>
            </div>
            {S.score >= S.highScore && S.score > 0 && <div className="bh-new-best">{isAr ? '🏆 نتيجة جديدة!' : '🏆 New High Score!'}</div>}
            <div className="bh-achievements-earned">
              {S.achievements.filter(a => a.earned).map(a => (
                <span key={a.id} className="bh-badge">{isAr ? a.labelAr : a.labelEn}</span>
              ))}
            </div>
            <div className="bh-edu-end">
              <p>💡 {isAr ? EDU_MESSAGES_AR[Math.floor(Math.random() * EDU_MESSAGES_AR.length)] : lang === 'de' ? EDU_MESSAGES_DE[Math.floor(Math.random() * EDU_MESSAGES_DE.length)] : EDU_MESSAGES_EN[Math.floor(Math.random() * EDU_MESSAGES_EN.length)]}</p>
            </div>
            <button className="bh-btn bh-btn-primary" onClick={() => startGame(S.difficulty)}>{isAr ? '🔄 العب مجددًا' : '🔄 Play Again'}</button>
            <button className="bh-btn bh-btn-ghost" onClick={doExit}>{isAr ? '🏠 القائمة' : '🏠 Menu'}</button>
          </div>
        </div>
      );
    }

    // Victory
    if (gs === 'victory') {
      return (
        <div className="bh-overlay">
          <div className="bh-card">
            <div className="bh-logo">🎉</div>
            <h2 className="bh-title" style={{ color: '#2ECC71' }}>{isAr ? 'انتصرت!' : 'Victory!'}</h2>
            <p style={{ color: '#aaa', marginBottom: '0.5rem' }}>{isAr ? 'أنهيت جميع الموجات!' : 'You completed all waves!'}</p>
            <div className="bh-result-stats">
              <div>{isAr ? 'النقاط النهائية' : 'Final Score'}: <b style={{ color: '#FFD700' }}>{S.score}</b></div>
              <div>{isAr ? 'الموجات' : 'Waves'}: <b>{S.wavesCompleted}</b></div>
              <div>{isAr ? 'القتلى' : 'Kills'}: <b>{S.totalKills}</b></div>
            </div>
            <div className="bh-achievements-earned">
              {S.achievements.filter(a => a.earned).map(a => (
                <span key={a.id} className="bh-badge">{isAr ? a.labelAr : a.labelEn}</span>
              ))}
            </div>
            <div className="bh-edu-end">
              <p>💡 {isAr ? 'بكتيريا المقاومة تحدٍّ حقيقي يواجه الطب الحديث. الاستخدام الرشيد للمضادات الحيوية هو خط دفاعنا الأول.' : 'Antibiotic resistance is a real modern challenge. Responsible use is our first line of defense.'}</p>
            </div>
            <button className="bh-btn bh-btn-primary" onClick={() => startGame(S.difficulty)}>{isAr ? '🔄 العب مجددًا' : '🔄 Play Again'}</button>
            <button className="bh-btn bh-btn-ghost" onClick={doExit}>{isAr ? '🏠 القائمة' : '🏠 Menu'}</button>
          </div>
        </div>
      );
    }
    return null;
  };

  const isInGame = gs === 'playing' || gs === 'paused' || gs === 'boss_intro';

  // ─── Start / exit helpers ──────────────────────────────────────────────────
  const startGame = (diff: Difficulty) => {
    gaming.enter();        // inside the tap handler so the browser may allow native fullscreen
    initGame(diff);
  };

  // Leave Gaming Mode for good: stop the run, release inputs, restore the website layout.
  const doExit = () => {
    setConfirmExit(false);
    joyRef.current = { active: false, sx: 0, sy: 0, cx: 0, cy: 0 };
    shootBtnRef.current = false;
    S.gameState = 'menu';
    gaming.exit();
    tick();
  };

  // Exit button: confirm only when an active (unpaused) run would be thrown away.
  const requestExit = () => {
    if (S.gameState === 'playing' || S.gameState === 'boss_intro') {
      S.gameState = 'paused';
      setConfirmExit(true);
      tick();
    } else {
      doExit(); // paused, game over, victory: nothing more to protect
    }
  };

  const resumeFromConfirm = () => {
    setConfirmExit(false);
    if (S.gameState === 'paused') S.gameState = 'playing';
    tick();
  };

  // If the run was resumed some other way (Esc / P), drop the confirmation dialog.
  useEffect(() => {
    if (confirmExit && gs === 'playing') setConfirmExit(false);
  }, [confirmExit, gs]);

  return (
    <main className="wrap narrow bh-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div
        ref={wrapperRef}
        dir={isAr ? 'rtl' : 'ltr'}
        className={`card bh-wrapper${isInGame ? ' bh-playing' : ''}${gamingActive ? ' bh-immersive' : ''}`}
      >
        {gamingActive && (
          <div className="bh-gamebar">
            <button type="button" className="bh-exit-btn" onClick={requestExit}>
              <span aria-hidden="true">✕</span> {isAr ? 'الخروج من اللعبة' : 'Exit Game'}
            </button>
            <span className="bh-gamebar-title" aria-hidden="true">🦠 {isAr ? 'صائد البكتيريا' : 'Bacteria Hunter'}</span>
          </div>
        )}
        <div className="bh-header">
          <h1 className="bh-page-title">🦠 {isAr ? 'صائد البكتيريا' : 'Bacteria Hunter'}</h1>
          <p className="bh-page-sub">{isAr ? 'لعبة أركيد تعليمية للوعي بالمضادات الحيوية' : 'Educational arcade game for antibiotic awareness'}</p>
        </div>

        <div ref={containerRef} className="bh-canvas-container" style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={Math.round(canvasSize.w * canvasSize.dpr)}
            height={Math.round(canvasSize.h * canvasSize.dpr)}
            className="bh-canvas"
          />
          {renderOverlay()}
        </div>

        {/* Mobile controls */}
        {isInGame && (
          <div className="bh-mobile-controls" dir="ltr">
            <Joystick joyRef={joyRef} size={100} />
            <div className="bh-mobile-right">
              <button
                className="bh-shoot-btn"
                onTouchStart={(e) => { e.preventDefault(); shootBtnRef.current = true; }}
                onTouchEnd={(e) => { e.preventDefault(); shootBtnRef.current = false; }}
                onMouseDown={() => shootBtnRef.current = true}
                onMouseUp={() => shootBtnRef.current = false}
              >🔵</button>
              <button
                className="bh-pause-btn"
                onClick={() => {
                  if (gs === 'playing') S.gameState = 'paused';
                  else if (gs === 'paused') S.gameState = 'playing';
                  tick();
                }}
              >{gs === 'paused' ? '▶' : '⏸'}</button>
            </div>
          </div>
        )}

        {/* Achievements list below game */}
        {!isInGame && gs !== 'menu' && gs !== 'difficulty' && (
          <div className="bh-all-achievements">
            <h3>{isAr ? 'الإنجازات' : 'Achievements'}</h3>
            <div className="bh-ach-grid">
              {ACHIEVEMENTS_INIT.map(a => (
                <div key={a.id} className={`bh-ach-item ${S.achievements.find(x => x.id === a.id)?.earned ? 'earned' : ''}`}>
                  {isAr ? a.labelAr : a.labelEn}
                </div>
              ))}
            </div>
          </div>
        )}

        {gamingActive && confirmExit && (
          <div className="bh-confirm" role="alertdialog" aria-modal="true" aria-labelledby="bh-confirm-title">
            <div className="bh-confirm-card">
              <h2 id="bh-confirm-title" className="bh-confirm-title">{isAr ? 'الخروج من اللعبة؟' : 'Exit the game?'}</h2>
              <p>{isAr ? 'سيتم فقدان تقدّمك في هذه الجولة.' : 'Your progress in this run will be lost.'}</p>
              <button type="button" className="bh-btn bh-btn-primary" onClick={resumeFromConfirm} autoFocus>
                {isAr ? 'متابعة اللعب' : 'Continue Playing'}
              </button>
              <button type="button" className="bh-btn bh-btn-danger" onClick={doExit}>
                {isAr ? 'الخروج من اللعبة' : 'Exit Game'}
              </button>
            </div>
          </div>
        )}

        <p className="bh-disclaimer">
          {isAr
            ? '⚠️ هذه لعبة تعليمية خيالية. لا تستشير اللعبة في الأمور الطبية. راجع طبيبك أو الصيدلاني دائمًا.'
            : '⚠️ This is a fictional educational game. Do not use it for medical decisions. Always consult a qualified healthcare professional.'}
        </p>
      </div>
    </main>
  );
}
