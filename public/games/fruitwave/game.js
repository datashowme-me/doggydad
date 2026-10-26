/* FruitWave · 浏览器版游戏逻辑
 * 规则对齐 tvOS 版 fruitWave：90 秒 / 每果 10 分 / 0.8 秒生成 / 同屏最多 6 个 / 12 种水果
 * 输入：① 摄像头手势（MediaPipe Hand Landmarker，本地推理，画面与坐标不出浏览器）
 *       ② 鼠标 / 触控板 / 触摸（无摄像头或未授权时自动回退）
 */
(() => {
'use strict';

/* ---------------- DOM ---------------- */
const $ = (id) => document.getElementById(id);
const canvas = $('game-canvas');
const ctx = canvas.getContext('2d');
const video = $('cam-video');
const camOverlay = $('cam-overlay');
const octx = camOverlay.getContext('2d');
const cameraStack = $('camera-stack');
const camPicker = $('cam-picker');
const toastEl = $('toast');
const overlay = $('overlay');
const panelMenu = $('panel-menu');
const panelLoading = $('panel-loading');
const loadingText = $('loading-text');
const panelPause = $('panel-pause');
const panelGameover = $('panel-gameover');
const hudEl = $('hud');
const hudTime = $('hud-time');
const hudScore = $('hud-score');
const hudCombo = $('hud-combo');
const hudComboChip = $('hud-combo-chip');
const hudBest = $('hud-best');
const hudMode = $('hud-mode');
const hudButtons = $('hud-buttons');
const btnPause = $('btn-pause');
const btnSound = $('btn-sound');
const bestMenu = $('best-menu');
const goScore = $('go-score');
const goBest = $('go-best');
const goNewRecord = $('go-new-record');

/* ---------------- 常量（对齐 fruitWave 规格） ---------------- */
const ROUND_MS = 90000;          // 90 秒一局
const SCORE_PER_FRUIT = 10;      // 每个水果 10 分
const SPAWN_MS = 800;            // 0.8 秒生成一个
const MAX_FRUITS = 6;            // 同屏最多 6 个
const COMBO_WINDOW = 0.9;        // 连击窗口（秒）
const TRAIL_MS = 140;            // 刀光轨迹时长（ms）
const MAX_JUMP_FACTOR = 0.3;     // 刀光跳点保护（相对画布高度）
const G_FACTOR = 1.9;            // 重力（相对画布高度 / 秒²）
const SCRIPT_BASE = new URL('./', document.currentScript ? document.currentScript.src : window.location.href);
const HAND_BUNDLE = new URL('vendor/vision_bundle.mjs', SCRIPT_BASE).href;
const HAND_WASM = new URL('vendor/wasm', SCRIPT_BASE).href;
const HAND_MODEL = new URL('vendor/models/hand_landmarker.task', SCRIPT_BASE).href;
const CAMERA_TIMEOUT_MS = 10000;
const MODEL_TIMEOUT_MS = 20000;

const FRUITS = [
  { name: '西瓜',   emoji: '🍉', color: '#22c55e', flesh: '#ff2d55', rind: '#15803d', seeds: true,  juice: ['#ff2a5f', '#ff477e', '#ffe4e6', '#22c55e'] },
  { name: '草莓',   emoji: '🍓', color: '#f43f5e', flesh: '#ff244a', rind: '#be123c', seeds: false, juice: ['#ff2247', '#ff6b8b', '#fff1f2', '#facc15'] },
  { name: '菠萝',   emoji: '🍍', color: '#eab308', flesh: '#facc15', rind: '#a16207', seeds: false, juice: ['#facc15', '#fde047', '#fef9c3', '#ca8a04'] },
  { name: '苹果',   emoji: '🍎', color: '#ef4444', flesh: '#fef08a', rind: '#b91c1c', seeds: true,  juice: ['#ef4444', '#fef08a', '#fee2e2', '#ffffff'] },
  { name: '橙子',   emoji: '🍊', color: '#f97316', flesh: '#fb923c', rind: '#ea580c', seeds: false, juice: ['#fb923c', '#ffedd5', '#fed7aa', '#f97316'] },
  { name: '香蕉',   emoji: '🍌', color: '#facc15', flesh: '#fef9c3', rind: '#ca8a04', seeds: false, juice: ['#fef08a', '#fef9c3', '#ffffff', '#eab308'] },
  { name: '猕猴桃', emoji: '🥝', color: '#84cc16', flesh: '#a3e635', rind: '#78350f', seeds: true,  juice: ['#84cc16', '#bef264', '#1c1917', '#ffffff'] },
  { name: '桃子',   emoji: '🍑', color: '#fb7185', flesh: '#fecdd3', rind: '#e11d48', seeds: true,  juice: ['#fb7185', '#fda4af', '#fff1f2', '#f43f5e'] },
  { name: '芒果',   emoji: '🥭', color: '#f59e0b', flesh: '#fbbf24', rind: '#d97706', seeds: false, juice: ['#fbbf24', '#fde68a', '#fffbeb', '#f59e0b'] },
  { name: '柠檬',   emoji: '🍋', color: '#fde047', flesh: '#fef08a', rind: '#eab308', seeds: false, juice: ['#fde047', '#fef08a', '#ffffff', '#ca8a04'] },
  { name: '葡萄',   emoji: '🍇', color: '#a855f7', flesh: '#d8b4fe', rind: '#7e22ce', seeds: false, juice: ['#c084fc', '#e9d5ff', '#faf5ff', '#9333ea'] },
  { name: '火龙果', emoji: '',    color: '#ec4899', flesh: '#ffffff', rind: '#db2777', seeds: true,  juice: ['#ec4899', '#f472b6', '#0f172a', '#ffffff'] },
];

/* ---------------- 状态 ---------------- */
let state = 'menu';            // menu | playing | paused | gameover
let mode = null;               // hand | pointer
let W = 0, H = 0, dpr = 1;
let score = 0, combo = 0, comboTimer = 0;
let remaining = ROUND_MS, spawnAcc = 0, ambientAcc = 0;
let best = 0, soundOn = true;
let pointerActive = false;
let handPresent = false, lastHandT = 0, lastDetect = 0, lastVideoTime = -1, detectErrors = 0;
let camStream = null, handLandmarker = null;
let camDevices = []; // 可用摄像头列表（授权后可见 label）
let camEpoch = 0;    // teardown 时递增，用于丢弃「迟到的」授权流
let cameraRequestSeq = 0;
const candidateStreams = new Set();
let savedCamId = '';
try { savedCamId = localStorage.getItem('fruitwave-cam') || ''; } catch (e) { /* 忽略 */ }

const fruits = [];       // 完整水果（有界：同屏最多 MAX_FRUITS）
const halves = [];       // 切开的果瓣（有界对象池，最多 40）
const particles = [];    // 果汁粒子（有界对象池，最多 120）
const splats = [];       // 果汁扩散冲击波（最多 20）
const flashes = [];      // 刀锋切割光芒（最多 12）
const pops = [];         // 得分飘字（有界对象池，最多 24）
const trail = [];        // 刀光轨迹点

const blade = { x: 0, y: 0, px: 0, py: 0, tx: 0, ty: 0, targetSet: false, active: false, hasPrev: false };
const oex = new OneEuroFilter(1.2, 0.05, 1);
const oey = new OneEuroFilter(1.2, 0.05, 1);

/* ---------------- One Euro 滤波（平滑手部抖动） ---------------- */
function OneEuroFilter(minCutoff, beta, dCutoff) {
  this.minCutoff = minCutoff; this.beta = beta; this.dCutoff = dCutoff;
  this.x = null; this.dx = 0; this.lastT = 0; this.first = true;
}
OneEuroFilter.prototype.reset = function () {
  this.x = null; this.dx = 0; this.first = true;
};
OneEuroFilter.prototype.filter = function (x, t) {
  if (this.first) { this.first = false; this.x = x; this.dx = 0; this.lastT = t; return x; }
  let dt = (t - this.lastT) / 1000;
  this.lastT = t;
  if (dt <= 0) return this.x;
  if (dt > 0.25) dt = 0.25;
  const dx = (x - this.x) / dt;
  const aD = 1 / (1 + 1 / (2 * Math.PI * this.dCutoff * dt));
  this.dx = this.dx + aD * (dx - this.dx);
  const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
  const a = 1 / (1 + 1 / (2 * Math.PI * cutoff * dt));
  this.x = this.x + a * (x - this.x);
  return this.x;
};

/* ---------------- 颜色工具 ---------------- */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hexToRgba(hex, alpha = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
function shade(hex, k) { // k>0 变亮
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.round(Math.max(0, Math.min(255, v + (255 - v) * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function shadeRgba(hex, k, alpha = 1) {
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.round(Math.max(0, Math.min(255, v + (255 - v) * k)));
  return `rgba(${f(r)},${f(g)},${f(b)},${alpha})`;
}
function shadeDark(hex, k) { // k>0 变暗
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.round(Math.max(0, Math.min(255, v * (1 - k))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/* ---------------- 水果贴图预渲染（渐变立体 + 旋转动画） ---------------- */
const SPRITE_S = 320;
const SPRITE_R = 118;
const SPRITE_SCALE = SPRITE_S / (2 * SPRITE_R);
const sprites = FRUITS.map(makeSprite);

function makeSprite(f) {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE_S;
  const g = c.getContext('2d');
  const cx = SPRITE_S / 2, cy = SPRITE_S / 2;

  // 1. 柔和环境光晕（透出多汁果色，不生硬遮挡）
  const glow = g.createRadialGradient(cx, cy, SPRITE_R * 0.25, cx, cy, SPRITE_R * 0.95);
  glow.addColorStop(0, shadeRgba(f.color, 0.4, 0.25));
  glow.addColorStop(0.6, hexToRgba(f.color, 0.14));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = glow;
  g.beginPath(); g.arc(cx, cy, SPRITE_R, 0, Math.PI * 2); g.fill();

  if (f.emoji) {
    // 2. 水果主体投影（增强立体感与悬浮感）
    g.save();
    g.shadowColor = 'rgba(0, 0, 0, 0.38)';
    g.shadowBlur = 18;
    g.shadowOffsetY = 10;
    g.font = `${Math.round(SPRITE_R * 1.58)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(f.emoji, cx, cy + SPRITE_R * 0.03);
    g.restore();

    // 3. 顶部微光弧高光（饱满多汁反光）
    const gleam = g.createRadialGradient(cx - SPRITE_R * 0.28, cy - SPRITE_R * 0.32, 2, cx - SPRITE_R * 0.25, cy - SPRITE_R * 0.28, SPRITE_R * 0.42);
    gleam.addColorStop(0, 'rgba(255,255,255,0.42)');
    gleam.addColorStop(0.6, 'rgba(255,255,255,0.12)');
    gleam.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gleam;
    g.beginPath();
    g.arc(cx - SPRITE_R * 0.25, cy - SPRITE_R * 0.25, SPRITE_R * 0.45, 0, Math.PI * 2);
    g.fill();
  } else {
    drawDragonfruit(g, cx, cy, SPRITE_R);
  }
  return c;
}

// 火龙果手绘：艳粉果身 + 翠绿鳞尖 + 珍珠白果肉与黑芝麻籽
function drawDragonfruit(g, cx, cy, r) {
  g.save();
  g.translate(cx, cy);

  // 投影
  g.shadowColor = 'rgba(0, 0, 0, 0.4)';
  g.shadowBlur = 16;
  g.shadowOffsetY = 10;

  // 绿色鳞叶
  for (let i = 0; i < 10; i++) {
    g.save();
    g.rotate((i / 10) * Math.PI * 2);
    g.translate(0, -r * 0.85);
    const lg = g.createLinearGradient(0, -r * 0.3, 0, 0);
    lg.addColorStop(0, '#4ade80');
    lg.addColorStop(0.7, '#22c55e');
    lg.addColorStop(1, '#db2777');
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(-r * 0.16, 0);
    g.quadraticCurveTo(0, -r * 0.42, r * 0.16, 0);
    g.closePath();
    g.fill();
    g.restore();
  }
  g.shadowColor = 'transparent';

  // 饱满玫红果体
  const grad = g.createRadialGradient(-r * 0.32, -r * 0.35, r * 0.05, 0, 0, r);
  grad.addColorStop(0, '#f472b6');
  grad.addColorStop(0.45, '#ec4899');
  grad.addColorStop(1, '#be185d');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, r * 0.94, 0, Math.PI * 2);
  g.fill();

  // 表面鳞瓣纹理
  g.strokeStyle = '#fbcfe8';
  g.lineWidth = 2.5;
  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2 + 0.3;
    g.beginPath();
    g.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.22, 0, Math.PI);
    g.stroke();
  }

  // 顶部弧面高光
  const hl = g.createRadialGradient(-r * 0.35, -r * 0.4, 0, -r * 0.35, -r * 0.4, r * 0.55);
  hl.addColorStop(0, 'rgba(255,255,255,0.6)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hl;
  g.beginPath();
  g.arc(-r * 0.2, -r * 0.25, r * 0.45, 0, Math.PI * 2);
  g.fill();

  g.restore();
}

/* ---------------- 音效（WebAudio 本地合成，不请求麦克风） ---------------- */
let audioCtx = null;
function ensureAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* 忽略 */ }
}
function playSlice(fi, comboCount) {
  if (!soundOn || !audioCtx) return;
  const t = audioCtx.currentTime;
  const base = 520 + fi * 70 + Math.random() * 80;                 // 不同水果起音不同
  const freq = base * Math.pow(2, Math.min(comboCount, 12) / 12);  // 音调随连击升高
  // 切割噪声
  const dur = 0.09;
  const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * dur), audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  const src = audioCtx.createBufferSource(); src.buffer = buf;
  const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq * 2; bp.Q.value = 1.2;
  const g = audioCtx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(bp); bp.connect(g); g.connect(audioCtx.destination); src.start(t);
  // 短促音头
  const o = audioCtx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.08);
  const og = audioCtx.createGain(); og.gain.setValueAtTime(0.12, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  o.connect(og); og.connect(audioCtx.destination); o.start(t); o.stop(t + 0.1);
}
function playGameOver() {
  if (!soundOn || !audioCtx) return;
  const t = audioCtx.currentTime;
  [660, 520, 392].forEach((f, i) => {
    const o = audioCtx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const g = audioCtx.createGain();
    const t0 = t + i * 0.13;
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
    o.connect(g); g.connect(audioCtx.destination); o.start(t0); o.stop(t0 + 0.25);
  });
}

/* ---------------- 几何 / 生成 / 碰撞 ---------------- */
function fruitRadius() { return Math.max(26, Math.min(64, H * 0.055)); }

function spawnFruit() {
  const fi = (Math.random() * FRUITS.length) | 0;
  const r = fruitRadius();
  fruits.push({
    fi,
    x: W * (0.15 + 0.7 * Math.random()),
    y: H + r * 1.4,
    vx: W * (Math.random() - 0.5) * 0.3,
    vy: -H * (1.05 + 0.55 * Math.random()),
    r,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 7,
  });
}

// 线段（刀光上一帧→当前帧）与水果圆的相交检测，保证重复命中不重复计分
function segCircle(x0, y0, x1, y1, cx, cy, r) {
  const dx = x1 - x0, dy = y1 - y0;
  const l2 = dx * dx + dy * dy;
  if (l2 < 1e-6) return Math.hypot(cx - x0, cy - y0) <= r;
  let t = ((cx - x0) * dx + (cy - y0) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const px = x0 + t * dx, py = y0 + t * dy;
  return Math.hypot(cx - px, cy - py) <= r;
}

function applyCut(x0, y0, x1, y1) {
  for (let i = fruits.length - 1; i >= 0; i--) {
    if (segCircle(x0, y0, x1, y1, fruits[i].x, fruits[i].y, fruits[i].r)) sliceFruit(i);
  }
}

function sliceFruit(i) {
  const f = fruits[i];
  fruits.splice(i, 1);
  const fruitMeta = FRUITS[f.fi] || FRUITS[0];

  for (const side of [-1, 1]) {
    halves.push({
      x: f.x, y: f.y,
      vx: f.vx + side * W * 0.1,
      vy: f.vy - H * 0.05,
      r: f.r, rot: f.rot,
      vr: f.vr + side * 4,
      fi: f.fi,
      side,
    });
  }

  // 1. 多汁高频果汁粒子（带重力与速度拉伸水滴）
  spawnParticles(f.x, f.y, f.fi);

  // 2. 果肉破裂冲击波涟漪
  splats.push({
    x: f.x, y: f.y,
    r: f.r * 0.25,
    maxR: f.r * 2.3,
    color: fruitMeta.flesh,
    life: 0.32,
    t: 0,
  });

  // 3. 刀芒切割受击瞬间闪光
  if (blade.hasPrev) {
    flashes.push({
      x0: blade.px, y0: blade.py,
      x1: blade.x, y1: blade.y,
      glow: fruitMeta.color,
      life: 0.14,
      t: 0,
    });
  }

  pops.push({ x: f.x, y: f.y, t: 0 });
  if (pops.length > 24) pops.shift();
  score += SCORE_PER_FRUIT;
  combo++;
  comboTimer = COMBO_WINDOW;
  playSlice(f.fi, combo);
}

function spawnParticles(x, y, fi) {
  const f = FRUITS[fi] || FRUITS[0];
  const count = 28;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = W * (0.04 + 0.18 * Math.random());
    const col = f.juice[i % f.juice.length];
    particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - H * (0.06 + 0.16 * Math.random()),
      t: 0,
      life: 0.42 + 0.38 * Math.random(),
      r: 2.2 + 3.8 * Math.random(),
      color: col,
    });
  }
}

/* ---------------- 更新 ---------------- */
function updateFruits(dt) {
  const g = G_FACTOR * H;
  for (let i = fruits.length - 1; i >= 0; i--) {
    const f = fruits[i];
    f.vy += g * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
    if (f.y - f.r > H + f.r * 2 && f.vy > 0) {
      fruits.splice(i, 1);
      if (state === 'playing') combo = 0; // 漏掉水果，连击中断
    }
  }
}

function updateHalves(dt) {
  const g = G_FACTOR * H;
  for (let i = halves.length - 1; i >= 0; i--) {
    const h = halves[i];
    h.vy += g * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt;
    if (h.y - h.r > H + h.r * 2) halves.splice(i, 1);
  }
  while (halves.length > 40) halves.shift();
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt;
    if (p.t >= p.life) { particles.splice(i, 1); continue; }
    p.vy += G_FACTOR * H * 0.65 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  while (particles.length > 120) particles.shift();
}

function updateSplats(dt) {
  for (let i = splats.length - 1; i >= 0; i--) {
    splats[i].t += dt;
    if (splats[i].t >= splats[i].life) splats.splice(i, 1);
  }
  while (splats.length > 20) splats.shift();
}

function updateFlashes(dt) {
  for (let i = flashes.length - 1; i >= 0; i--) {
    flashes[i].t += dt;
    if (flashes[i].t >= flashes[i].life) flashes.splice(i, 1);
  }
  while (flashes.length > 16) flashes.shift();
}

function updatePops(dt) {
  for (let i = pops.length - 1; i >= 0; i--) {
    pops[i].t += dt;
    if (pops[i].t > 0.9) pops.splice(i, 1);
  }
}

function updateBlade(now) {
  if (!blade.targetSet) return;
  const sx = oex.filter(blade.tx, now);
  const sy = oey.filter(blade.ty, now);
  blade.x = sx; blade.y = sy;
  if (!blade.active) { blade.hasPrev = false; return; }
  if (!blade.hasPrev) {
    blade.px = sx; blade.py = sy; blade.hasPrev = true;
    return;
  }
  const d = Math.hypot(sx - blade.px, sy - blade.py);
  const maxJump = MAX_JUMP_FACTOR * H;
  if (d > maxJump) { // 跳点保护：断点不判定
    blade.px = sx; blade.py = sy;
    return;
  }
  if (d > 0.01) {
    applyCut(blade.px, blade.py, sx, sy);
    if (d > 1.5) trail.push({ x: sx, y: sy, t: now });
    blade.px = sx; blade.py = sy;
  }
}

function updateGame(dt, now) {
  remaining -= dt * 1000;
  if (remaining <= 0) { remaining = 0; endGame(); return; }
  spawnAcc += dt * 1000;
  if (spawnAcc >= SPAWN_MS) { spawnAcc = 0; if (fruits.length < MAX_FRUITS) spawnFruit(); }
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) combo = 0;
  }
  updateBlade(now);
  updateFruits(dt);
  updateHalves(dt);
  updateParticles(dt);
  updateSplats(dt);
  updateFlashes(dt);
  updatePops(dt);
  updateHud();
}

function updateAmbient(dt) { // 菜单背景：水果缓缓飞出
  ambientAcc += dt * 1000;
  if (ambientAcc >= 550) { ambientAcc = 0; if (fruits.length < 7) spawnFruit(); }
  updateFruits(dt);
  updateHalves(dt);
  updateParticles(dt);
  updateSplats(dt);
  updateFlashes(dt);
  updatePops(dt);
}

/* ---------------- 绘制 ---------------- */
function draw(now) {
  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#101b33'); bg.addColorStop(0.55, '#0c1426'); bg.addColorStop(1, '#080d1a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(255,255,255,0.05)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

  // 1. 完整水果
  for (const f of fruits) {
    const s = f.r * SPRITE_SCALE;
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
    ctx.drawImage(sprites[f.fi], -s, -s, s * 2, s * 2);
    ctx.restore();
  }

  // 2. 切开的果瓣（含真实剖面果肉与籽细节）
  for (const h of halves) drawHalf(h);

  // 3. 果汁飞溅冲击圈
  for (const s of splats) {
    const k = s.t / s.life;
    const currentR = s.r + (s.maxR - s.r) * Math.sin((k * Math.PI) / 2);
    ctx.globalAlpha = (1 - k) * 0.8;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3.2 * (1 - k);
    ctx.beginPath();
    ctx.arc(s.x, s.y, currentR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. 果汁粒子（动态拉伸水滴）
  for (const p of particles) {
    const lifeRatio = p.t / p.life;
    ctx.globalAlpha = Math.max(0, 1 - lifeRatio);
    ctx.fillStyle = p.color;
    const speed = Math.hypot(p.vx, p.vy);
    const angle = Math.atan2(p.vy, p.vx);
    const stretch = Math.min(3.2, 1 + speed / (H * 0.4));
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r * stretch, p.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // 5. 刀锋切割受击高光闪芒
  for (const fl of flashes) {
    const k = fl.t / fl.life;
    ctx.globalAlpha = (1 - k);
    ctx.strokeStyle = fl.glow;
    ctx.lineWidth = 14 * (1 - k);
    ctx.beginPath(); ctx.moveTo(fl.x0, fl.y0); ctx.lineTo(fl.x1, fl.y1); ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4 * (1 - k);
    ctx.beginPath(); ctx.moveTo(fl.x0, fl.y0); ctx.lineTo(fl.x1, fl.y1); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 6. 绚丽刀光轨迹
  drawTrail(now);

  // 手势空闲指示（检测到手但未伸食指）
  if (mode === 'hand' && handPresent && !blade.active && blade.targetSet) {
    const pulse = 1 + 0.15 * Math.sin(now / 180);
    ctx.strokeStyle = 'rgba(255,225,77,0.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(blade.x, blade.y, 13 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,225,77,0.9)';
    ctx.beginPath(); ctx.arc(blade.x, blade.y, 4, 0, Math.PI * 2); ctx.fill();
  }

  // 7. 得分飘字（带缩放弹性与柔光）
  for (const p of pops) {
    const k = p.t / 0.9;
    ctx.globalAlpha = Math.max(0, 1 - k);
    const scale = 1 + 0.28 * Math.sin(Math.min(1, k * 3) * Math.PI);
    ctx.font = `800 ${Math.round(19 * scale)}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 4;
    ctx.strokeText(`+${SCORE_PER_FRUIT}`, p.x, p.y - p.t * 50);
    ctx.fillStyle = '#ffe14d';
    ctx.fillText(`+${SCORE_PER_FRUIT}`, p.x, p.y - p.t * 50);
  }
  ctx.globalAlpha = 1;
  while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
}

function drawHalf(h) {
  const f = FRUITS[h.fi] || FRUITS[0];
  const r = h.r, s = r * SPRITE_SCALE;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.rot);

  // 接近底部时优雅淡出
  const alpha = Math.max(0, Math.min(1, (H + r * 1.5 - h.y) / (H * 0.4)));
  ctx.globalAlpha = alpha;

  // ① 裁剪绘制水果外表半边
  ctx.save();
  ctx.beginPath();
  if (h.side < 0) ctx.rect(-r * 1.3, -r * 1.3, r * 1.3, r * 2.6);
  else ctx.rect(0, -r * 1.3, r * 1.3, r * 2.6);
  ctx.clip();
  ctx.drawImage(sprites[h.fi], -s, -s, s * 2, s * 2);
  ctx.restore();

  // ② 真实果肉切面与果核细节
  ctx.save();
  const cutW = r * 0.40;
  const cutH = r * 0.92;

  // 果皮边缘轮廓
  ctx.fillStyle = f.rind;
  ctx.beginPath();
  ctx.ellipse(0, 0, cutW + 3, cutH + 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 内部果肉渐变
  const fleshGrad = ctx.createRadialGradient(-cutW * 0.2, -cutH * 0.2, cutW * 0.1, 0, 0, cutH);
  fleshGrad.addColorStop(0, shade(f.flesh, 0.25));
  fleshGrad.addColorStop(0.72, f.flesh);
  fleshGrad.addColorStop(1, shadeDark(f.flesh, 0.22));
  ctx.fillStyle = fleshGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, cutW, cutH, 0, 0, Math.PI * 2);
  ctx.fill();

  // 水果特色内部构造
  if (f.name === '西瓜') {
    // 西瓜黑籽
    ctx.fillStyle = '#1c1917';
    const seeds = [
      [-cutW * 0.35, -cutH * 0.45],
      [cutW * 0.28, -cutH * 0.18],
      [-cutW * 0.25, cutH * 0.22],
      [cutW * 0.3, cutH * 0.48]
    ];
    for (const [sx, sy] of seeds) {
      ctx.beginPath();
      ctx.ellipse(sx, sy, 2.4, 4.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (f.name === '猕猴桃') {
    // 奇异果淡黄芯 + 黑籽圈
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(0, 0, cutW * 0.3, cutH * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#18181b';
    for (let k = 0; k < 9; k++) {
      const ka = (k / 9) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(ka) * cutW * 0.52, Math.sin(ka) * cutH * 0.58, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (f.name === '橙子' || f.name === '柠檬') {
    // 柑橘瓣线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.3;
    for (let s = 0; s < 6; s++) {
      const sa = (s / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sa) * cutW * 0.85, Math.sin(sa) * cutH * 0.85);
      ctx.stroke();
    }
  } else if (f.name === '火龙果') {
    // 火龙果黑芝麻点
    ctx.fillStyle = '#0f172a';
    for (let s = 0; s < 10; s++) {
      const ka = (s * 137.5 * Math.PI) / 180;
      const kr = Math.sqrt(s / 10) * cutW * 0.72;
      ctx.beginPath();
      ctx.arc(Math.cos(ka) * kr, Math.sin(ka) * kr * (cutH / cutW), 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (f.seeds) {
    // 苹果/桃子果核
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, 0, cutW * 0.22, cutH * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 果肉切面水润高光
  const shineGrad = ctx.createLinearGradient(-cutW, -cutH, cutW, cutH);
  shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
  shineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)');
  shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = shineGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, cutW * 0.9, cutH * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function drawTrail(now) {
  const n = trail.length;
  if (n < 2) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // 外层翡翠柔光
  for (let i = 1; i < n; i++) {
    const p0 = trail[i - 1], p1 = trail[i];
    const a = Math.max(0, 1 - (now - p1.t) / TRAIL_MS);
    if (a <= 0) continue;
    ctx.strokeStyle = `rgba(52, 211, 153, ${(0.42 * a).toFixed(3)})`;
    ctx.lineWidth = 18 * a;
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  }
  // 中层电光碧青
  for (let i = 1; i < n; i++) {
    const p0 = trail[i - 1], p1 = trail[i];
    const a = Math.max(0, 1 - (now - p1.t) / TRAIL_MS);
    if (a <= 0) continue;
    ctx.strokeStyle = `rgba(167, 243, 208, ${(0.82 * a).toFixed(3)})`;
    ctx.lineWidth = 7.5 * a;
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  }
  // 核心白刃刀芒
  for (let i = 1; i < n; i++) {
    const p0 = trail[i - 1], p1 = trail[i];
    const a = Math.max(0, 1 - (now - p1.t) / TRAIL_MS);
    if (a <= 0) continue;
    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.96 * a).toFixed(3)})`;
    ctx.lineWidth = 3.2 * a;
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  }
}

/* ---------------- HUD / 面板 ---------------- */
let lastHudScore = -1, lastHudTime = -1, lastHudCombo = -1;
function updateHud() {
  const t = Math.ceil(remaining / 1000);
  if (t !== lastHudTime) {
    lastHudTime = t;
    hudTime.textContent = t;
    hudTime.classList.toggle('low', t <= 10);
  }
  if (score !== lastHudScore) {
    lastHudScore = score;
    hudScore.textContent = score;
  }
  if (combo !== lastHudCombo) {
    lastHudCombo = combo;
    hudCombo.textContent = combo;
    hudComboChip.hidden = combo < 2;
  }
}
function updateBest() {
  bestMenu.textContent = best;
  hudBest.textContent = best;
}

function showPanel(p) {
  for (const el of [panelMenu, panelLoading, panelPause, panelGameover]) el.hidden = el !== p;
  overlay.hidden = false;
}
function hideOverlay() { overlay.hidden = true; }

let toastTimer = 0, lastToastT = 0;
function toast(msg, ms = 3000) {
  lastToastT = performance.now();
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

/* ---------------- 状态机 ---------------- */
function startGame() {
  score = 0; combo = 0; comboTimer = 0;
  remaining = ROUND_MS; spawnAcc = 0; ambientAcc = 0;
  fruits.length = 0; halves.length = 0; particles.length = 0; splats.length = 0; flashes.length = 0; pops.length = 0; trail.length = 0;
  blade.hasPrev = false; blade.active = false; pointerActive = false; lastHandT = 0;
  state = 'playing';
  btnPause.textContent = '⏸️';
  hideOverlay();
  hudEl.hidden = false;
  hudButtons.hidden = false;
  hudMode.textContent = mode === 'hand' ? '🎥 手势' : '🖱️ 鼠标';
  updateHud();
  updateBest();
}

function endGame() {
  state = 'gameover';
  if (score > best) {
    best = score;
    localStorage.setItem('fruitwave-best', String(best));
    goNewRecord.hidden = false;
  } else {
    goNewRecord.hidden = true;
  }
  goScore.textContent = score;
  goBest.textContent = best;
  updateBest();
  showPanel(panelGameover);
  playGameOver();
}

function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    btnPause.textContent = '▶️';
    showPanel(panelPause);
  } else if (state === 'paused') {
    state = 'playing';
    btnPause.textContent = '⏸️';
    hideOverlay();
  }
}

function quitToMenu() {
  teardownCamera();
  state = 'menu';
  hudEl.hidden = true;
  hudButtons.hidden = true;
  showPanel(panelMenu);
  updateBest();
}

function restartRound() {
  hideOverlay();
  startGame();
  if (mode === 'hand') toast('伸出食指在空中挥砍，握拳停止');
  else toast('移动鼠标 / 触控板 / 手指来切水果');
}

/* ---------------- 摄像头 + 手势识别（MediaPipe） ---------------- */
function teardownCamera() {
  camEpoch++;
  cameraRequestSeq++;
  stopStream(camStream);
  camStream = null;
  for (const stream of candidateStreams) stopStream(stream);
  candidateStreams.clear();
  try { video.pause(); } catch (e) { /* 忽略 */ }
  video.srcObject = null;
  cameraStack.hidden = true;
  camPicker.hidden = true;
  camPicker.textContent = '';
  camDevices = [];
  handPresent = false;
  blade.active = false;
  blade.hasPrev = false;
  blade.targetSet = false;
  octx.clearRect(0, 0, camOverlay.width, camOverlay.height);
  if (handLandmarker) { try { handLandmarker.close(); } catch (e) { /* 忽略 */ } handLandmarker = null; }
}

async function loadLandmarker() {
  const epoch = camEpoch;
  const mod = await withTimeout(import(HAND_BUNDLE), MODEL_TIMEOUT_MS, 'model module timeout');
  if (epoch !== camEpoch) throw abortError();
  const fileset = await withTimeout(
    mod.FilesetResolver.forVisionTasks(HAND_WASM),
    MODEL_TIMEOUT_MS,
    'model wasm timeout',
  );
  if (epoch !== camEpoch) throw abortError();
  const opts = {
    baseOptions: { modelAssetPath: HAND_MODEL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
  try {
    handLandmarker = await createLandmarker(mod, fileset, opts, epoch);
  } catch (e) {
    if (e && (e.name === 'TimeoutError' || e.name === 'AbortError')) throw e;
    opts.baseOptions.delegate = 'CPU'; // 部分设备不支持 GPU 代理
    handLandmarker = await createLandmarker(mod, fileset, opts, epoch);
  }
}

async function createLandmarker(mod, fileset, opts, epoch) {
  let abandoned = false;
  const pending = mod.HandLandmarker.createFromOptions(fileset, opts);
  pending.then((instance) => {
    if (abandoned || epoch !== camEpoch) {
      try { instance.close(); } catch (e) { /* 忽略 */ }
    }
  }, () => {});
  try {
    const instance = await withTimeout(pending, MODEL_TIMEOUT_MS, 'model init timeout');
    if (epoch !== camEpoch) {
      try { instance.close(); } catch (e) { /* 忽略 */ }
      throw abortError();
    }
    return instance;
  } catch (e) {
    abandoned = true;
    throw e;
  }
}

// 给 getUserMedia 加上超时：macOS 系统授权弹窗被忽略时，请求会永远挂起
function withTimeout(promise, ms, name) {
  let timer;
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(() => {
      const e = new Error(name || 'timeout');
      e.name = 'TimeoutError';
      rej(e);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function abortError() {
  const e = new Error('camera operation superseded');
  e.name = 'AbortError';
  return e;
}

function stopStream(stream) {
  if (!stream) return;
  try { stream.getTracks().forEach((track) => track.stop()); } catch (e) { /* 忽略 */ }
}

// getUserMedia 本身不可取消。超时后仍监听原始 Promise，迟到的流会被立即关闭。
async function requestCameraStream(constraints, requestId, epoch, timeoutMs = CAMERA_TIMEOUT_MS) {
  let abandoned = false;
  const pending = navigator.mediaDevices.getUserMedia(constraints);
  pending.then((stream) => {
    if (abandoned || requestId !== cameraRequestSeq || epoch !== camEpoch) stopStream(stream);
  }, () => {});
  try {
    const stream = await withTimeout(pending, timeoutMs, 'camera timeout');
    if (requestId !== cameraRequestSeq || epoch !== camEpoch) {
      stopStream(stream);
      throw abortError();
    }
    candidateStreams.add(stream);
    return stream;
  } catch (e) {
    abandoned = true;
    throw e;
  }
}

async function validateCameraStream(stream, timeoutMs = CAMERA_TIMEOUT_MS) {
  const probe = document.createElement('video');
  probe.muted = true;
  probe.autoplay = true;
  probe.playsInline = true;
  probe.srcObject = stream;
  try {
    await withTimeout(probe.play(), timeoutMs, 'video play timeout');
    if (probe.readyState < 2 || !probe.videoWidth) throw new Error('camera produced no frame');
  } finally {
    try { probe.pause(); } catch (e) { /* 忽略 */ }
    probe.srcObject = null;
  }
}

// 授权成功后枚举摄像头，多于 1 个时显示切换器
async function initCamPicker() {
  try {
    const list = await navigator.mediaDevices.enumerateDevices();
    camDevices = list.filter((d) => d.kind === 'videoinput' && d.deviceId);
  } catch (e) {
    camDevices = [];
  }
  camPicker.hidden = camDevices.length < 2;
  if (camPicker.hidden) return;
  camPicker.textContent = '';
  camDevices.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `摄像头 ${i + 1}`;
    camPicker.appendChild(opt);
  });
  const activeId = camStream && camStream.getVideoTracks()[0]
    ? camStream.getVideoTracks()[0].getSettings().deviceId
    : '';
  const selectedId = activeId || savedCamId;
  if (selectedId) {
    camPicker.value = selectedId;
    if (camPicker.value !== selectedId && selectedId === savedCamId) savedCamId = ''; // 已拔掉
  } else {
    camPicker.selectedIndex = 0;
  }
}

function usePointerFallback(message) {
  teardownCamera();
  mode = 'pointer';
  oex.reset(); oey.reset();
  blade.targetSet = false;
  if (state === 'playing' || state === 'paused') hudMode.textContent = '🖱️ 鼠标';
  toast(message);
}

function watchActiveCamera(stream) {
  const track = stream && stream.getVideoTracks()[0];
  if (!track) return;
  track.addEventListener('ended', () => {
    if (camStream === stream && mode === 'hand') usePointerFallback('摄像头已断开，已切换为鼠标模式');
  }, { once: true });
}

async function handleDeviceChange() {
  if (!camStream || mode !== 'hand') return;
  await initCamPicker();
  const track = camStream.getVideoTracks()[0];
  const activeId = track && track.getSettings().deviceId;
  if (!track || track.readyState === 'ended' || (activeId && camDevices.length && !camDevices.some((d) => d.deviceId === activeId))) {
    usePointerFallback('当前摄像头已移除，已切换为鼠标模式');
  }
}

// 切换摄像头：先开新流，成功后再停旧流，避免切换失败导致画面黑屏
async function switchCamera(id) {
  const requestId = ++cameraRequestSeq;
  const epoch = camEpoch;
  const old = camStream;
  let stream = null;
  try {
    stream = await requestCameraStream(
      {
        audio: false,
        video: { deviceId: { exact: id }, width: { ideal: 640 }, height: { ideal: 480 } },
      },
      requestId,
      epoch,
    );
    await validateCameraStream(stream);
    if (requestId !== cameraRequestSeq || epoch !== camEpoch) throw abortError();
    camStream = stream;
    candidateStreams.delete(stream);
    video.srcObject = stream;
    await withTimeout(video.play(), CAMERA_TIMEOUT_MS, 'camera switch play timeout');
    stopStream(old);
    watchActiveCamera(stream);
    lastVideoTime = -1;
    savedCamId = id;
    try { localStorage.setItem('fruitwave-cam', id); } catch (e) { /* 忽略 */ }
    toast('已切换摄像头');
  } catch (err) {
    if (stream && stream !== camStream) {
      candidateStreams.delete(stream);
      stopStream(stream);
    }
    if (camStream === stream) {
      stopStream(stream);
      camStream = old;
      video.srcObject = old;
      if (old) { try { await video.play(); } catch (e) { /* 忽略 */ } }
    }
    if (err && err.name === 'AbortError') return;
    console.warn('[FruitWave] 切换摄像头失败：', err);
    toast('切换摄像头失败，请重试');
  }
}

// 打开摄像头：默认设备 10s 内拿不到流就逐个尝试其他设备。
// 手机联动/虚拟摄像头（如 Continuity Camera）未就绪时 getUserMedia 会一直挂起，必须能换设备自救。
async function openCamera() {
  const requestId = ++cameraRequestSeq;
  const epoch = camEpoch;
  let sawDenied = false;   // 任一尝试被系统拒绝（TCC 曾点过「不允许」）
  let allTimedOut = true;  // 所有尝试都只是超时（授权弹窗没人点 / 设备不吐帧）
  // 验收标准：拿到流 + play() 能出画面。手机联动摄像头（Continuity Camera 等）
  // 会授权成功但永远不吐帧，play() 等到第一帧才 resolve，必须限时并换设备。
  const accept = async (constraints, ms, tag) => {
    const ep = camEpoch;
    let s = null;
    try {
      s = await requestCameraStream(constraints, requestId, ep, ms);
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) sawDenied = true;
      if (!e || e.name !== 'TimeoutError') allTimedOut = false;
      return null;
    }
    try {
      await validateCameraStream(s, ms);
    } catch (e) {
      console.warn('[FruitWave] 摄像头无画面，跳过设备：', tag);
      candidateStreams.delete(s);
      stopStream(s);
      return null;
    }
    if (requestId !== cameraRequestSeq || epoch !== camEpoch) {
      candidateStreams.delete(s);
      stopStream(s);
      throw abortError();
    }
    candidateStreams.delete(s);
    return s;
  };

  // 先枚举（此刻没有挂起的 getUserMedia，枚举不会排队阻塞）
  let ids = [];
  try {
    const list = await navigator.mediaDevices.enumerateDevices();
    ids = list.filter((d) => d.kind === 'videoinput' && d.deviceId).map((d) => d.deviceId);
  } catch (e) { /* 忽略 */ }

  // 尝试顺序：上次用过的设备 → 默认设备 → 其余设备（最多共 4 次）
  const tries = [];
  if (savedCamId) {
    tries.push({ video: { deviceId: { exact: savedCamId }, width: { ideal: 640 }, height: { ideal: 480 } }, tag: 'saved' });
  }
  tries.push({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, tag: 'default' });
  for (const id of ids.slice(0, 3)) {
    if (id !== savedCamId) {
      tries.push({ video: { deviceId: { exact: id }, width: { ideal: 640 }, height: { ideal: 480 } }, tag: id.slice(0, 8) });
    }
  }

  for (const t of tries.slice(0, 4)) {
    const s = await accept({ audio: false, video: t.video }, 10000, t.tag);
    if (s) {
      if (t.video.deviceId) {
        savedCamId = t.video.deviceId.exact;
      }
      const actualId = s.getVideoTracks()[0] && s.getVideoTracks()[0].getSettings().deviceId;
      if (actualId) savedCamId = actualId;
      try { localStorage.setItem('fruitwave-cam', savedCamId); } catch (e) { /* 忽略 */ }
      return s;
    }
  }
  const err = new Error('no camera stream');
  err.name = sawDenied ? 'NotAllowedError' : allTimedOut ? 'TimeoutError' : 'NotFoundError';
  throw err;
}

async function startHandMode() {
  ensureAudio();
  showPanel(panelLoading);
  loadingText.textContent = '正在请求摄像头权限…';
  // 权限请求可能挂起（如 macOS 系统弹窗未被处理）：先给用户提示，超时后自动回退
  const permHint = setTimeout(() => {
    if (loadingText.textContent.includes('摄像头权限')) {
      loadingText.textContent = '若系统弹出摄像头授权询问，请点击「允许」；等待中…';
    }
  }, 6000);
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no camera api');
    if (!camStream) camStream = await openCamera();
    video.srcObject = camStream;
    await withTimeout(video.play(), CAMERA_TIMEOUT_MS, 'video play timeout');
    clearTimeout(permHint);
    cameraStack.hidden = false;
    loadingText.textContent = '正在加载手势识别模型（约 8MB，首次较慢）…';
    if (!handLandmarker) await loadLandmarker();
    await initCamPicker();
    mode = 'hand';
    watchActiveCamera(camStream);
    oex.reset(); oey.reset();
    blade.targetSet = false;
    startGame();
    toast('伸出食指在空中挥砍，握拳停止');
  } catch (err) {
    clearTimeout(permHint);
    console.warn('[FruitWave] 摄像头模式启动失败：', err);
    teardownCamera();
    mode = 'pointer';
    oex.reset(); oey.reset();
    blade.targetSet = false;
    startGame();
    if (err && err.name === 'TimeoutError') {
      toast('摄像头无响应（授权未确认或设备未就绪），本局先用鼠标');
    } else if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
      toast('摄像头未授权，已切换为鼠标 / 触控模式');
    } else {
      toast('未检测到摄像头或启动失败，已切换为鼠标 / 触控模式');
    }
  }
}

// 节流到约 30fps 的本地手势推理
function detectHand(now) {
  if (mode !== 'hand' || !handLandmarker || video.readyState < 2) return;
  if (video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;
  if (now - lastDetect < 33) return;
  lastDetect = now;
  let res;
  try {
    res = handLandmarker.detectForVideo(video, now);
    detectErrors = 0;
  } catch (e) {
    if (++detectErrors > 10) {
      usePointerFallback('手势识别异常，已切换为鼠标模式');
    }
    return;
  }
  const lm = res.landmarks && res.landmarks[0];
  if (lm) {
    handPresent = true;
    lastHandT = now;
    // 食指伸直判定：PIP(5)→指尖(8) 与 PIP(5)→DIP(6) 方向一致，且指尖离手腕足够远
    const p0 = lm[0], p5 = lm[5], p6 = lm[6], p8 = lm[8];
    const v1 = [p6.x - p5.x, p6.y - p5.y];
    const v2 = [p8.x - p5.x, p8.y - p5.y];
    const l1 = Math.hypot(v1[0], v1[1]), l2 = Math.hypot(v2[0], v2[1]);
    const cos = l1 && l2 ? (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2) : 0;
    const wristDist = Math.hypot(p8.x - p0.x, p8.y - p0.y);
    blade.active = cos > 0.85 && wristDist > 0.15;
    // 原始帧镜像后即为用户视角：x 取 1 - x
    blade.tx = (1 - p8.x) * W;
    blade.ty = p8.y * H;
    blade.targetSet = true;
    drawSkeleton(lm);
  } else {
    handPresent = false;
    blade.active = false;
    blade.hasPrev = false;
    octx.clearRect(0, 0, camOverlay.width, camOverlay.height);
    if (state === 'playing' && lastHandT > 0 && now - lastHandT > 2500 && now - lastToastT > 4000) {
      toast('未检测到手部，请把手伸到摄像头前');
    }
  }
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

// 在小窗预览上绘制手部骨架（随外层 CSS 水平镜像）
function drawSkeleton(lm) {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw) return;
  if (camOverlay.width !== vw) { camOverlay.width = vw; camOverlay.height = vh; }
  octx.clearRect(0, 0, vw, vh);
  octx.strokeStyle = 'rgba(80,230,160,0.9)';
  octx.lineWidth = vw * 0.008;
  octx.lineCap = 'round';
  for (const [a, b] of HAND_CONNECTIONS) {
    const A = lm[a], B = lm[b];
    octx.beginPath();
    octx.moveTo(A.x * vw, A.y * vh);
    octx.lineTo(B.x * vw, B.y * vh);
    octx.stroke();
  }
  octx.fillStyle = 'rgba(255,255,255,0.95)';
  for (const p of lm) {
    octx.beginPath(); octx.arc(p.x * vw, p.y * vh, vw * 0.012, 0, Math.PI * 2); octx.fill();
  }
  const t = lm[8];
  octx.fillStyle = '#ffe14d';
  octx.beginPath(); octx.arc(t.x * vw, t.y * vh, vw * 0.02, 0, Math.PI * 2); octx.fill();
}

/* ---------------- 主循环 ---------------- */
let lastT = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;
  detectHand(now);
  if (state === 'playing') updateGame(dt, now);
  else if (state === 'menu') updateAmbient(dt);
  draw(now);
}

/* ---------------- 画布尺寸 ---------------- */
function resize() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = rect.width; H = rect.height;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* ---------------- 事件绑定 ---------------- */
function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
function setPointerTarget(e) {
  if (mode !== 'pointer') return;
  pointerActive = true;
  blade.active = true;
  const p = canvasPos(e);
  blade.tx = p.x; blade.ty = p.y;
  blade.targetSet = true;
}

function bindEvents() {
  window.addEventListener('resize', resize);

  canvas.addEventListener('pointerdown', setPointerTarget);
  canvas.addEventListener('pointermove', setPointerTarget);
  canvas.addEventListener('pointerup', () => { pointerActive = false; blade.active = false; blade.hasPrev = false; });
  canvas.addEventListener('pointercancel', () => { pointerActive = false; blade.active = false; blade.hasPrev = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (state === 'playing' || state === 'paused') togglePause();
    } else if (e.code === 'KeyM') {
      toggleSound();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') togglePause();
  });

  $('btn-camera-mode').addEventListener('click', startHandMode);
  camPicker.addEventListener('change', () => { if (camPicker.value) switchCamera(camPicker.value); });
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
  }
  $('btn-pointer-mode').addEventListener('click', () => {
    ensureAudio();
    mode = 'pointer';
    oex.reset(); oey.reset();
    blade.targetSet = false;
    startGame();
    toast('移动鼠标 / 触控板 / 手指来切水果');
  });
  btnPause.addEventListener('click', togglePause);
  $('btn-quit').addEventListener('click', quitToMenu);
  $('pause-resume').addEventListener('click', togglePause);
  $('pause-restart').addEventListener('click', restartRound);
  $('pause-quit').addEventListener('click', quitToMenu);
  $('go-restart').addEventListener('click', restartRound);
  $('go-menu').addEventListener('click', quitToMenu);
  btnSound.addEventListener('click', toggleSound);
}

function toggleSound() {
  soundOn = !soundOn;
  localStorage.setItem('fruitwave-sound', soundOn ? 'on' : 'off');
  btnSound.textContent = soundOn ? '🔊' : '🔇';
  if (soundOn) ensureAudio();
}

/* ---------------- 初始化 ---------------- */
function init() {
  resize();
  bindEvents();
  best = parseInt(localStorage.getItem('fruitwave-best') || '0', 10) || 0;
  soundOn = localStorage.getItem('fruitwave-sound') !== 'off';
  btnSound.textContent = soundOn ? '🔊' : '🔇';
  updateBest();
  requestAnimationFrame(loop);
}
init();

})();
