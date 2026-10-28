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
function getScriptBase() {
  const scriptTag = document.getElementById('fruitwave-script') ||
                    document.querySelector('script[src*="fruitwave/game.js"]');
  if (scriptTag) {
    if (scriptTag.dataset && scriptTag.dataset.gameDir) {
      return new URL(scriptTag.dataset.gameDir, window.location.origin).href;
    }
    if (scriptTag.src) {
      return new URL('./', scriptTag.src).href;
    }
  }
  if (document.currentScript && document.currentScript.src) {
    return new URL('./', document.currentScript.src).href;
  }
  const path = window.location.pathname;
  const match = path.match(/^(.*\/games\/fruitwave)(\/.*)?$/);
  if (match) {
    return new URL(match[1] + '/', window.location.origin).href;
  }
  return new URL('/games/fruitwave/', window.location.origin).href;
}

const SCRIPT_BASE = getScriptBase();
const HAND_BUNDLE = new URL('vendor/vision_bundle.mjs', SCRIPT_BASE).href;
const HAND_WASM = new URL('vendor/wasm', SCRIPT_BASE).href.replace(/\/$/, '');
const HAND_MODEL = new URL('vendor/models/hand_landmarker.task', SCRIPT_BASE).href;

// 备用公共 CDN（在本地文件缺失或被 CSP 限制时作为第二层保障）
const CDN_BUNDLE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const CDN_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const CAMERA_TIMEOUT_MS = 10000;
const MODEL_STEP_TIMEOUT_MS = 8000;

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
/* ---------------- 刀芒状态（支持单手/双手双刀，每只手独立滤波与轨迹） ---------------- */
function createBlade(id, color) {
  return {
    id,
    color,
    x: 0, y: 0, px: 0, py: 0, tx: 0, ty: 0,
    targetSet: false, active: false, hasPrev: false,
    oex: new OneEuroFilter(1.2, 0.05, 1),
    oey: new OneEuroFilter(1.2, 0.05, 1),
    trail: [],
  };
}
let blades = [];

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

blades = [
  createBlade(0, 'emerald'),
  createBlade(1, 'amber'),
];

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

/* ---------------- 高保真 WebAudio 本地合成音效引擎（媲美《水果忍者》） ---------------- */
let audioCtx = null;
let lastWhooshT = 0;
let lastTossT = 0;

function ensureAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* 忽略 */ }
}

// 1. 刀锋空中破空呼啸声 (Whoosh / Swoosh)
function playWhoosh(speed = 800) {
  if (!soundOn || !audioCtx) return;
  const now = performance.now();
  if (now - lastWhooshT < 100) return;
  lastWhooshT = now;
  const t = audioCtx.currentTime;
  const dur = 0.12;
  const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * dur), audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const k = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.sin(k * Math.PI);
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 2.4;
  const baseFreq = 500 + Math.min(speed, 2000) * 0.45;
  bp.frequency.setValueAtTime(baseFreq * 0.7, t);
  bp.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, t + 0.04);
  bp.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t + dur);

  const g = audioCtx.createGain();
  const vol = Math.min(0.28, 0.12 + (speed / 2400) * 0.16);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);

  src.connect(bp);
  bp.connect(g);
  g.connect(audioCtx.destination);
  src.start(t);
  src.stop(t + dur);
}

// 2. 多汁爆裂切碎复合音 (Sharp Metallic Cut + Juicy Squish Burst + Visceral Body Thud)
function playJuicySlice(fi, comboCount) {
  if (!soundOn || !audioCtx) return;
  const t = audioCtx.currentTime;

  // ① 极快金属刀刃切入咔嚓声 (Crisp metallic sheen, 0.035s)
  const oEdge = audioCtx.createOscillator();
  const gEdge = audioCtx.createGain();
  oEdge.type = 'triangle';
  const edgeBase = 2200 + (fi % 4) * 240;
  oEdge.frequency.setValueAtTime(edgeBase, t);
  oEdge.frequency.exponentialRampToValueAtTime(500, t + 0.035);
  gEdge.gain.setValueAtTime(0.22, t);
  gEdge.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  oEdge.connect(gEdge);
  gEdge.connect(audioCtx.destination);
  oEdge.start(t);
  oEdge.stop(t + 0.04);

  // ② 多汁肉质挤压爆浆声 (Wet pulp squirt & burst)
  const squishDur = 0.13;
  const sBuf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * squishDur), audioCtx.sampleRate);
  const sData = sBuf.getChannelData(0);
  for (let i = 0; i < sData.length; i++) {
    const k = i / sData.length;
    sData[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 1.6);
  }
  const sSrc = audioCtx.createBufferSource();
  sSrc.buffer = sBuf;
  const sFilter = audioCtx.createBiquadFilter();
  sFilter.type = 'bandpass';
  const centerF = 750 + fi * 60;
  sFilter.frequency.setValueAtTime(centerF * 1.5, t);
  sFilter.frequency.exponentialRampToValueAtTime(centerF * 0.6, t + squishDur);
  sFilter.Q.value = 1.8;

  const sGain = audioCtx.createGain();
  sGain.gain.setValueAtTime(0.5, t);
  sGain.gain.exponentialRampToValueAtTime(0.001, t + squishDur);
  sSrc.connect(sFilter);
  sFilter.connect(sGain);
  sGain.connect(audioCtx.destination);
  sSrc.start(t);
  sSrc.stop(t + squishDur);

  // ③ 低频肉质冲击破裂 (Visceral flesh thud)
  const oThud = audioCtx.createOscillator();
  const gThud = audioCtx.createGain();
  oThud.type = 'sine';
  oThud.frequency.setValueAtTime(145, t);
  oThud.frequency.exponentialRampToValueAtTime(42, t + 0.08);
  gThud.gain.setValueAtTime(0.35, t);
  gThud.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  oThud.connect(gThud);
  gThud.connect(audioCtx.destination);
  oThud.start(t);
  oThud.stop(t + 0.09);

  // ④ 连击音调鸣响（阶梯升调，连击越高音色越清亮）
  if (comboCount > 1) {
    const oCombo = audioCtx.createOscillator();
    const gCombo = audioCtx.createGain();
    const cFreq = (520 + (comboCount % 8) * 80) * Math.pow(2, Math.min(comboCount, 10) / 14);
    oCombo.type = 'sine';
    oCombo.frequency.setValueAtTime(cFreq, t + 0.02);
    oCombo.frequency.exponentialRampToValueAtTime(cFreq * 1.25, t + 0.12);
    gCombo.gain.setValueAtTime(0.001, t);
    gCombo.gain.linearRampToValueAtTime(0.18, t + 0.03);
    gCombo.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    oCombo.connect(gCombo);
    gCombo.connect(audioCtx.destination);
    oCombo.start(t);
    oCombo.stop(t + 0.18);
  }
}

// 3. 水果出场抛物升空音 (Fruit Launch Whoosh)
function playFruitToss() {
  if (!soundOn || !audioCtx) return;
  const now = performance.now();
  if (now - lastTossT < 220) return;
  lastTossT = now;
  const t = audioCtx.currentTime;
  const dur = 0.15;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(75, t + dur);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.15, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur);
}

// 4. 连击太鼓重击与和风庆贺声 (Taiko Drum Strike & Chime Fanfare)
function playComboFanfare(comboCount) {
  if (!soundOn || !audioCtx) return;
  const t = audioCtx.currentTime;

  // 太鼓重击 (Taiko Deep Bass Strike)
  const oDrum = audioCtx.createOscillator();
  const gDrum = audioCtx.createGain();
  oDrum.type = 'sine';
  oDrum.frequency.setValueAtTime(110, t);
  oDrum.frequency.exponentialRampToValueAtTime(36, t + 0.32);
  gDrum.gain.setValueAtTime(0.55, t);
  gDrum.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  oDrum.connect(gDrum);
  gDrum.connect(audioCtx.destination);
  oDrum.start(t);
  oDrum.stop(t + 0.36);

  // 和风铜锣 / 五声音阶鸣响
  const notes = comboCount >= 5 ? [523, 659, 784, 1046] : [587, 880];
  notes.forEach((freq, idx) => {
    const oBell = audioCtx.createOscillator();
    const gBell = audioCtx.createGain();
    const t0 = t + idx * 0.07;
    oBell.type = 'triangle';
    oBell.frequency.setValueAtTime(freq, t0);
    gBell.gain.setValueAtTime(0.001, t0);
    gBell.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
    gBell.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
    oBell.connect(gBell);
    gBell.connect(audioCtx.destination);
    oBell.start(t0);
    oBell.stop(t0 + 0.46);
  });
}

// 5. 倒计时警报滴答声 (Countdown Tick)
function playTick(urgent = false) {
  if (!soundOn || !audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(urgent ? 1050 : 780, t);
  o.frequency.exponentialRampToValueAtTime(200, t + 0.035);
  g.gain.setValueAtTime(urgent ? 0.22 : 0.14, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + 0.04);
}

// 6. 游戏结束铜锣鸣响 (Authentic Gong)
function playGameOverGong() {
  if (!soundOn || !audioCtx) return;
  const t = audioCtx.currentTime;
  const gongFreqs = [110, 175, 260, 395, 580];
  gongFreqs.forEach((freq, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = i === 0 ? 'sine' : 'triangle';
    o.frequency.setValueAtTime(freq, t);
    const initialVol = 0.35 / (i + 1);
    g.gain.setValueAtTime(initialVol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + 2.3);
  });
}

/* ---------------- 背景果汁喷溅与流淌系统（Fruit Ninja 灵魂木墙水渍） ---------------- */
function addWallSplat(x, y, fi) {
  const f = FRUITS[fi] || FRUITS[0];
  const color = f.flesh || f.color;
  const baseR = fruitRadius() * (1.1 + Math.random() * 0.45);
  const drips = [];
  const dripCount = (Math.random() * 3 + 1) | 0;
  for (let d = 0; d < dripCount; d++) {
    drips.push({
      x: x + (Math.random() - 0.5) * baseR * 0.7,
      y: y + Math.random() * baseR * 0.25,
      len: 0,
      maxLen: baseR * (0.8 + Math.random() * 1.6),
      speed: H * (0.045 + Math.random() * 0.08),
      r: 2.2 + Math.random() * 2.5,
    });
  }
  const spots = [];
  const spotCount = 6 + ((Math.random() * 6) | 0);
  for (let s = 0; s < spotCount; s++) {
    const a = Math.random() * Math.PI * 2;
    const dist = baseR * (0.6 + Math.random() * 0.85);
    spots.push({
      x: x + Math.cos(a) * dist,
      y: y + Math.sin(a) * dist,
      r: baseR * (0.12 + Math.random() * 0.18),
    });
  }

  wallSplats.push({
    x, y,
    r: baseR,
    color,
    drips,
    spots,
    t: 0,
    life: 12.0,
  });

  if (wallSplats.length > 25) wallSplats.shift();
}

function updateWallSplats(dt) {
  for (let i = wallSplats.length - 1; i >= 0; i--) {
    const s = wallSplats[i];
    s.t += dt;
    if (s.t >= s.life) {
      wallSplats.splice(i, 1);
      continue;
    }
    for (const d of s.drips) {
      if (d.len < d.maxLen) d.len = Math.min(d.maxLen, d.len + d.speed * dt);
    }
  }
}

function drawWallSplats() {
  for (const s of wallSplats) {
    const remainRatio = 1 - s.t / s.life;
    const alpha = Math.min(0.52, remainRatio * 0.52);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color;

    // 核心泼溅斑块（多点融合柔化果汁浆液）
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 0.75, 0, Math.PI * 2);
    ctx.arc(s.x + s.r * 0.2, s.y - s.r * 0.15, s.r * 0.55, 0, Math.PI * 2);
    ctx.arc(s.x - s.r * 0.18, s.y + s.r * 0.2, s.r * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 周围散溅水珠
    for (const sp of s.spots) {
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 沿墙面向下滴淌的液滴
    ctx.strokeStyle = s.color;
    ctx.lineCap = 'round';
    for (const d of s.drips) {
      if (d.len > 0.5) {
        ctx.lineWidth = d.r * 1.5;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y + d.len);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(d.x, d.y + d.len, d.r * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

/* ---------------- 刀光火花星芒系统 ---------------- */
function spawnSparks(x, y, count, color = '#ffe14d', speedScale = 1) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = W * (0.06 + 0.18 * Math.random()) * speedScale;
    sparks.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - H * (0.02 + 0.08 * Math.random()),
      color,
      r: 1.6 + Math.random() * 2.4,
      t: 0,
      life: 0.25 + Math.random() * 0.22,
    });
  }
  while (sparks.length > 70) sparks.shift();
}

function updateSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const sp = sparks[i];
    sp.t += dt;
    if (sp.t >= sp.life) {
      sparks.splice(i, 1);
      continue;
    }
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    sp.vy += G_FACTOR * H * 0.3 * dt;
    sp.vx *= 0.93;
  }
}

function drawSparks() {
  for (const sp of sparks) {
    const k = sp.t / sp.life;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = sp.color;
    ctx.shadowColor = sp.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r * (1 - k * 0.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ---------------- 打击感屏幕微震 ---------------- */
function triggerScreenShake(intensity = 4, duration = 0.12) {
  screenShake.intensity = Math.max(screenShake.intensity, intensity);
  screenShake.duration = duration;
  screenShake.t = 0;
}

function updateScreenShake(dt) {
  if (screenShake.t < screenShake.duration) {
    screenShake.t += dt;
    const progress = screenShake.t / screenShake.duration;
    const cur = screenShake.intensity * (1 - progress);
    const a = Math.random() * Math.PI * 2;
    screenShake.x = Math.cos(a) * cur;
    screenShake.y = Math.sin(a) * cur;
  } else {
    screenShake.x = 0;
    screenShake.y = 0;
    screenShake.intensity = 0;
  }
}

/* ---------------- 连击荣耀爆破大横幅 ---------------- */
function spawnComboBanner(count, x, y) {
  let title = `💥 ${count} 连击!`;
  let sub = `+${count * 10} 分`;
  let col = '#fbbf24';
  if (count >= 5) {
    title = `⚡ 超神 ${count} 连击!`;
    sub = `UNBELIEVABLE COMBO!`;
    col = '#f43f5e';
  } else if (count >= 4) {
    title = `🔥 ${count} 连击狂暴!`;
    sub = `GREAT COMBO!`;
    col = '#f97316';
  }
  comboBanners.push({
    text: title,
    subText: sub,
    x: Math.max(W * 0.25, Math.min(W * 0.75, x)),
    y: Math.max(H * 0.25, Math.min(H * 0.6, y)),
    color: col,
    t: 0,
    life: 1.1,
  });
  while (comboBanners.length > 4) comboBanners.shift();
}

function updateComboBanners(dt) {
  for (let i = comboBanners.length - 1; i >= 0; i--) {
    const cb = comboBanners[i];
    cb.t += dt;
    if (cb.t >= cb.life) {
      comboBanners.splice(i, 1);
      continue;
    }
    cb.y -= 28 * dt;
  }
}

function drawComboBanners(now) {
  for (const cb of comboBanners) {
    const k = cb.t / cb.life;
    const alpha = Math.max(0, 1 - Math.pow(k, 2));
    const scale = k < 0.2 ? (k / 0.2) * 1.25 : 1.25 - 0.25 * ((k - 0.2) / 0.8);
    ctx.save();
    ctx.translate(cb.x, cb.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // 旋转星芒光晕
    ctx.save();
    ctx.rotate((now / 1000) * 1.5);
    ctx.strokeStyle = cb.color;
    ctx.lineWidth = 2;
    for (let r = 0; r < 8; r++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const ra = (r / 8) * Math.PI * 2;
      ctx.lineTo(Math.cos(ra) * 55, Math.sin(ra) * 55);
      ctx.stroke();
    }
    ctx.restore();

    // 徽章背景
    ctx.shadowColor = cb.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = cb.color;
    ctx.lineWidth = 2.5;
    const bw = 180, bh = 54;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 27);
    ctx.fill();
    ctx.stroke();

    // 文字
    ctx.font = '800 20px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(cb.text, 0, -4);

    ctx.font = '700 13px Inter, -apple-system, sans-serif';
    ctx.fillStyle = cb.color;
    ctx.fillText(cb.subText, 0, 15);

    ctx.restore();
  }
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
  if (state === 'playing') playFruitToss();
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

function applyCut(x0, y0, x1, y1, cutter) {
  for (let i = fruits.length - 1; i >= 0; i--) {
    if (segCircle(x0, y0, x1, y1, fruits[i].x, fruits[i].y, fruits[i].r)) sliceFruit(i, cutter);
  }
}

function sliceFruit(i, cutter) {
  const f = fruits[i];
  fruits.splice(i, 1);
  const fruitMeta = FRUITS[f.fi] || FRUITS[0];

  const c = cutter || blades[0];
  const cdx = (c && c.hasPrev) ? (c.x - c.px) : (f.vx || 1);
  const cdy = (c && c.hasPrev) ? (c.y - c.py) : (f.vy || 0);
  const clen = Math.hypot(cdx, cdy) || 1;
  const cutAngle = Math.atan2(cdy, cdx);
  // 法向矢量（垂直于切割刀线分离）
  const nx = -cdy / clen;
  const ny = cdx / clen;
  const pushSpeed = W * (0.09 + Math.random() * 0.05);

  // 严格沿切割刀线法向垂直蹦出，带真实剖切角度
  for (const side of [-1, 1]) {
    halves.push({
      x: f.x, y: f.y,
      vx: f.vx * 0.35 + side * nx * pushSpeed,
      vy: f.vy * 0.35 + side * ny * pushSpeed - H * 0.03,
      r: f.r, rot: cutAngle,
      vr: side * (Math.random() * 4 + 3.5),
      fi: f.fi,
      side,
    });
  }

  // 1. 多汁高频果汁粒子（带重力与速度拉伸水滴）
  spawnParticles(f.x, f.y, f.fi);

  // 2. 背景木墙果汁流淌印迹（Fruit Ninja 灵魂水渍）
  addWallSplat(f.x, f.y, f.fi);

  // 3. 刀光切割碰撞星芒火花
  spawnSparks(f.x, f.y, 14, fruitMeta.color, 1.2);

  // 4. 果肉破裂冲击波涟漪
  splats.push({
    x: f.x, y: f.y,
    r: f.r * 0.25,
    maxR: f.r * 2.3,
    color: fruitMeta.flesh,
    life: 0.32,
    t: 0,
  });

  // 5. 刀芒切割受击瞬间闪光
  if (c && c.hasPrev) {
    flashes.push({
      x0: c.px, y0: c.py,
      x1: c.x, y1: c.y,
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

  // 真实爆浆切割复合音
  playJuicySlice(f.fi, combo);

  // 连击达成：太鼓重击 + 庆贺横幅 + 强震屏
  if (combo >= 3) {
    playComboFanfare(combo);
    spawnComboBanner(combo, f.x, f.y);
    triggerScreenShake(combo >= 5 ? 8 : 4.8, 0.22);
  } else {
    triggerScreenShake(2.2, 0.08);
  }
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

function updateBlade(b, now, dt) {
  if (!b.targetSet) {
    b.hasPrev = false;
    return;
  }
  const sx = b.oex.filter(b.tx, now);
  const sy = b.oey.filter(b.ty, now);
  b.x = sx; b.y = sy;
  if (!b.active) { b.hasPrev = false; return; }
  if (!b.hasPrev) {
    b.px = sx; b.py = sy; b.hasPrev = true;
    return;
  }
  const d = Math.hypot(sx - b.px, sy - b.py);
  const maxJump = MAX_JUMP_FACTOR * H;
  if (d > maxJump) { // 跳点保护：断点不判定
    b.px = sx; b.py = sy;
    return;
  }
  if (d > 0.01) {
    applyCut(b.px, b.py, sx, sy, b);
    if (d > 1.5) b.trail.push({ x: sx, y: sy, t: now });

    // 水果忍者经典高速破空呼啸声与刀尖电火花
    const speed = dt > 0 ? d / dt : 0;
    if (speed > W * 0.65) {
      if (!b.lastWhooshT || now - b.lastWhooshT > 120) {
        b.lastWhooshT = now;
        playWhoosh(speed);
      }
      if (Math.random() < 0.45) {
        spawnSparks(sx, sy, b.color === 'emerald' ? '#34d399' : '#fbbf24', 2);
      }
    }

    b.px = sx; b.py = sy;
  }
}

function updateGame(dt, now) {
  remaining -= dt * 1000;
  if (remaining <= 0) { remaining = 0; endGame(); return; }

  // 倒计时最后 10 秒紧张滴答声
  const sec = Math.ceil(remaining / 1000);
  if (sec <= 10 && sec > 0 && sec !== lastTickSec) {
    lastTickSec = sec;
    playTick(sec <= 5);
  }

  spawnAcc += dt * 1000;
  if (spawnAcc >= SPAWN_MS) { spawnAcc = 0; if (fruits.length < MAX_FRUITS) spawnFruit(); }
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) combo = 0;
  }
  for (const b of blades) updateBlade(b, now, dt);
  updateFruits(dt);
  updateHalves(dt);
  updateParticles(dt);
  updateSplats(dt);
  updateWallSplats(dt);
  updateSparks(dt);
  updateComboBanners(dt);
  updateScreenShake(dt);
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
  updateWallSplats(dt);
  updateSparks(dt);
  updateComboBanners(dt);
  updateFlashes(dt);
  updatePops(dt);
}

/* ---------------- 绘制 ---------------- */
function draw(now) {
  ctx.save();
  if (screenShake.timer > 0) {
    ctx.translate(screenShake.x, screenShake.y);
  }

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#101b33'); bg.addColorStop(0.55, '#0c1426'); bg.addColorStop(1, '#080d1a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(255,255,255,0.05)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

  // 木质背景墙果汁浸染印痕与流淌泪滴（水果忍者经典木墙污渍）
  drawWallSplats();

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

  // 刀锋划痕与火花星芒
  drawSparks();

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

  // 6. 绚丽刀光轨迹（支持双手双刀独立轨迹）
  drawTrails(now);

  // 手势空闲指示（检测到手但握拳或未挥砍）
  if (mode === 'hand' && handPresent) {
    for (const b of blades) {
      if (b.targetSet && !b.active) {
        const pulse = 1 + 0.15 * Math.sin(now / 180);
        const col = b.color === 'emerald' ? 'rgba(52, 211, 153, 0.85)' : 'rgba(251, 191, 36, 0.85)';
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, 13 * pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
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
  // 连击暴击大横幅与星芒爆炸
  drawComboBanners(now);

  while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
  ctx.restore();
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

function drawTrails(now) {
  for (const b of blades) {
    const tr = b.trail;
    const n = tr.length;
    if (n < 2) continue;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const isEmerald = b.color === 'emerald';
    const cOuter = isEmerald ? '52, 211, 153' : '251, 191, 36';
    const cMid = isEmerald ? '167, 243, 208' : '254, 240, 138';

    // 外层柔光
    for (let i = 1; i < n; i++) {
      const p0 = tr[i - 1], p1 = tr[i];
      const a = Math.max(0, 1 - (now - p1.t) / TRAIL_MS);
      if (a <= 0) continue;
      ctx.strokeStyle = `rgba(${cOuter}, ${(0.42 * a).toFixed(3)})`;
      ctx.lineWidth = 18 * a;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    // 中层电光
    for (let i = 1; i < n; i++) {
      const p0 = tr[i - 1], p1 = tr[i];
      const a = Math.max(0, 1 - (now - p1.t) / TRAIL_MS);
      if (a <= 0) continue;
      ctx.strokeStyle = `rgba(${cMid}, ${(0.82 * a).toFixed(3)})`;
      ctx.lineWidth = 7.5 * a;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    // 核心白刃刀芒
    for (let i = 1; i < n; i++) {
      const p0 = tr[i - 1], p1 = tr[i];
      const a = Math.max(0, 1 - (now - p1.t) / TRAIL_MS);
      if (a <= 0) continue;
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.96 * a).toFixed(3)})`;
      ctx.lineWidth = 3.2 * a;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    while (tr.length && now - tr[0].t > TRAIL_MS) tr.shift();
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
function resetBlades() {
  for (const b of blades) {
    b.hasPrev = false;
    b.active = false;
    b.targetSet = false;
    b.trail.length = 0;
    b.oex.reset();
    b.oey.reset();
    b.lastWhooshT = 0;
  }
}

function startGame() {
  score = 0; combo = 0; comboTimer = 0;
  remaining = ROUND_MS; spawnAcc = 0; ambientAcc = 0;
  fruits.length = 0; halves.length = 0; particles.length = 0; splats.length = 0; flashes.length = 0; pops.length = 0;
  wallSplats.length = 0; sparks.length = 0; comboBanners.length = 0; screenShake.timer = 0; lastTickSec = -1;
  resetBlades();
  pointerActive = false; lastHandT = 0;
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
  playGameOverGong();
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
  resetBlades();
  octx.clearRect(0, 0, camOverlay.width, camOverlay.height);
  if (handLandmarker) { try { handLandmarker.close(); } catch (e) { /* 忽略 */ } handLandmarker = null; }
}

async function loadLandmarker() {
  const epoch = camEpoch;

  const setStatus = (title, sub = '') => {
    if (loadingText) loadingText.textContent = title;
    const subEl = $('loading-subtext');
    if (subEl) {
      subEl.textContent = sub;
      subEl.hidden = !sub;
    }
  };

  let mod = null;
  let fileset = null;
  let usingCdn = false;

  // 阶段 1：加载 JS 模块与 WASM 引擎（优先本地，超时 8 秒自动无缝切换备用 CDN）
  setStatus('正在初始化手势识别组件…', '正在加载计算核心 (WASM)');
  try {
    mod = await withTimeout(import(HAND_BUNDLE), MODEL_STEP_TIMEOUT_MS, 'local bundle timeout');
    if (epoch !== camEpoch) throw abortError();

    fileset = await withTimeout(
      mod.FilesetResolver.forVisionTasks(HAND_WASM),
      MODEL_STEP_TIMEOUT_MS,
      'local wasm timeout'
    );
  } catch (errLocal) {
    if (errLocal && errLocal.name === 'AbortError') throw errLocal;
    console.warn('[FruitWave] 本地手势核心加载受阻，正在启用备用 CDN 通道：', errLocal);
    usingCdn = true;
    setStatus('正在切换备用通道加载手势模型…', '正在连接 CDN 加速网络');

    mod = await withTimeout(import(CDN_BUNDLE), MODEL_STEP_TIMEOUT_MS, 'cdn bundle timeout');
    if (epoch !== camEpoch) throw abortError();

    fileset = await withTimeout(
      mod.FilesetResolver.forVisionTasks(CDN_WASM),
      MODEL_STEP_TIMEOUT_MS,
      'cdn wasm timeout'
    );
  }

  if (epoch !== camEpoch) throw abortError();

  // 阶段 2：加载手部姿态识别模型权重
  setStatus('正在载入手势识别模型（约 8MB）…', '首次载入耗时数秒，已启用本地持久缓存');
  const modelPath = usingCdn ? CDN_MODEL : HAND_MODEL;

  const baseOpts = {
    baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numHands: 2, // 允许同时追踪双手（支持左手/右手单手及双手双刀）
    minHandDetectionConfidence: 0.45,
    minHandPresenceConfidence: 0.45,
    minTrackingConfidence: 0.45,
  };

  try {
    handLandmarker = await createLandmarker(mod, fileset, baseOpts, epoch, MODEL_STEP_TIMEOUT_MS);
  } catch (errGpu) {
    if (errGpu && errGpu.name === 'AbortError') throw errGpu;
    console.warn('[FruitWave] GPU 模式初始化失败，切换为 CPU 模式：', errGpu);
    baseOpts.baseOptions.delegate = 'CPU';
    handLandmarker = await createLandmarker(mod, fileset, baseOpts, epoch, MODEL_STEP_TIMEOUT_MS);
  }

  setStatus('手势识别已就绪！');
}

async function createLandmarker(mod, fileset, opts, epoch, timeoutMs = MODEL_STEP_TIMEOUT_MS) {
  let abandoned = false;
  const pending = mod.HandLandmarker.createFromOptions(fileset, opts);
  pending.then((instance) => {
    if (abandoned || epoch !== camEpoch) {
      try { instance.close(); } catch (e) { /* 忽略 */ }
    }
  }, () => {});
  try {
    const instance = await withTimeout(pending, timeoutMs, 'model init timeout');
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
  const track = stream && stream.getVideoTracks()[0];
  if (!track || track.readyState !== 'live') {
    throw new Error('camera track not live');
  }
  const probe = document.createElement('video');
  probe.muted = true;
  probe.autoplay = true;
  probe.playsInline = true;
  probe.srcObject = stream;
  try {
    await withTimeout(
      new Promise((resolve, reject) => {
        if (probe.videoWidth > 0 && probe.readyState >= 2) return resolve();
        const onReady = () => { cleanup(); resolve(); };
        const onError = (e) => { cleanup(); reject(e); };
        const cleanup = () => {
          probe.removeEventListener('loadedmetadata', onReady);
          probe.removeEventListener('loadeddata', onReady);
          probe.removeEventListener('canplay', onReady);
          probe.removeEventListener('error', onError);
        };
        probe.addEventListener('loadedmetadata', onReady, { once: true });
        probe.addEventListener('loadeddata', onReady, { once: true });
        probe.addEventListener('canplay', onReady, { once: true });
        probe.addEventListener('error', onError, { once: true });
        probe.play().catch((err) => {
          if (track && track.readyState === 'live') resolve();
          else reject(err);
        });
      }),
      timeoutMs,
      'video play timeout'
    );
  } catch (err) {
    if (track && track.readyState === 'live') {
      return;
    }
    throw err;
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
  resetBlades();
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

  // 尝试顺序：上次用过的设备 → 默认设备（带 facingMode: user）→ 其余设备（最多共 4 次）
  const tries = [];
  if (savedCamId) {
    tries.push({ video: { deviceId: { ideal: savedCamId }, width: { ideal: 640 }, height: { ideal: 480 } }, tag: 'saved' });
  }
  tries.push({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, tag: 'default' });
  for (const id of ids.slice(0, 3)) {
    if (id !== savedCamId) {
      tries.push({ video: { deviceId: { ideal: id }, width: { ideal: 640 }, height: { ideal: 480 } }, tag: id.slice(0, 8) });
    }
  }

  for (const t of tries.slice(0, 4)) {
    const s = await accept({ audio: false, video: t.video }, 10000, t.tag);
    if (s) {
      const actualId = s.getVideoTracks()[0] && s.getVideoTracks()[0].getSettings().deviceId;
      if (actualId) {
        savedCamId = actualId;
        try { localStorage.setItem('fruitwave-cam', savedCamId); } catch (e) { /* 忽略 */ }
      }
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
  const camHint = $('cam-status-hint');
  if (camHint) camHint.hidden = true;
  // 权限请求可能挂起（如 macOS 系统弹窗未被处理）：先给用户提示，超时后自动回退
  const permHint = setTimeout(() => {
    if (loadingText.textContent.includes('摄像头权限')) {
      loadingText.textContent = '若浏览器或系统弹出授权提示，请点击「允许」…';
    }
  }, 4000);
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no camera api');
    if (!camStream) camStream = await openCamera();
    video.srcObject = camStream;
    await withTimeout(video.play(), CAMERA_TIMEOUT_MS, 'video play timeout');
    clearTimeout(permHint);
    cameraStack.hidden = false;
    if (!handLandmarker) await loadLandmarker();
    await initCamPicker();
    mode = 'hand';
    watchActiveCamera(camStream);
    resetBlades();
    startGame();
    toast('左手、右手或双手挥砍均可（食指或手刀），握拳停止');
  } catch (err) {
    clearTimeout(permHint);
    console.warn('[FruitWave] 摄像头或手势模型启动失败：', err);
    teardownCamera();
    mode = 'pointer';
    resetBlades();
    startGame();
    if (err && err.name === 'TimeoutError') {
      toast('手势加载超时，已自动为您开启鼠标模式！', 4000);
      if (camHint) {
        camHint.textContent = '⚠️ 模型或摄像头响应超时，已为您开启鼠标模式体验。';
        camHint.hidden = false;
      }
    } else if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
      toast('摄像头未获授权，已切换鼠标模式。请在浏览器地址栏 🔒 允许权限');
      if (camHint) {
        camHint.textContent = '⚠️ 摄像头权限未开启：请点击浏览器地址栏 🔒 图标允许访问，或在新标签页打开。';
        camHint.hidden = false;
      }
    } else {
      toast('未能启动手势摄像头，已为您开启鼠标模式！', 4000);
      if (camHint) {
        camHint.textContent = '⚠️ 未能启动手势识别，已为您开启鼠标模式体验。';
        camHint.hidden = false;
      }
    }
  }
}

function analyzeHand(lm) {
  const p0 = lm[0]; // 手腕
  // 食指关节与指尖
  const p5 = lm[5]; // 食指根部 MCP
  const p6 = lm[6]; // 食指第一关节 PIP
  const p8 = lm[8]; // 食指尖 TIP
  // 中指关节与指尖
  const p9 = lm[9]; // 中指根部 MCP
  const p10 = lm[10]; // 中指第一关节 PIP
  const p12 = lm[12]; // 中指尖 TIP
  // 无名指与小指
  const p13 = lm[13], p16 = lm[16];
  const p17 = lm[17], p20 = lm[20];

  // 计算指尖相对手腕距离（无视俯仰角，鲁棒性极高）
  const dIndexTip = Math.hypot(p8.x - p0.x, p8.y - p0.y);
  const dIndexPip = Math.hypot(p6.x - p0.x, p6.y - p0.y);
  const dIndexMcp = Math.hypot(p5.x - p0.x, p5.y - p0.y);

  const dMidTip = Math.hypot(p12.x - p0.x, p12.y - p0.y);
  const dMidPip = Math.hypot(p10.x - p0.x, p10.y - p0.y);

  const dRingTip = Math.hypot(p16.x - p0.x, p16.y - p0.y);
  const dRingMcp = Math.hypot(p13.x - p0.x, p13.y - p0.y);

  const dPinkyTip = Math.hypot(p20.x - p0.x, p20.y - p0.y);
  const dPinkyMcp = Math.hypot(p17.x - p0.x, p17.y - p0.y);

  // 食指或中指伸直判定（左右手、食指指点、双指剑指、手掌手刀均可触发）
  const indexExtended = dIndexTip > dIndexPip * 1.05 && dIndexTip > 0.12;
  const midExtended = dMidTip > dMidPip * 1.05 && dMidTip > 0.12;

  // 握拳检测：四指全部紧缩回掌部
  const isFist = (dIndexTip < dIndexPip * 0.98 || dIndexTip < 0.11) &&
                 (dMidTip < dMidPip * 0.98 || dMidTip < 0.11) &&
                 (dRingTip < dRingMcp * 1.1) &&
                 (dPinkyTip < dPinkyMcp * 1.1);

  // 挥砍有效：非握拳，并且食指、中指或整个手掌伸展
  const active = !isFist && (indexExtended || midExtended || (dIndexTip > dIndexMcp * 1.12));

  // 刀刃点：优先食指尖，若中指更伸出则取中指尖
  let tip = p8;
  if (!indexExtended && midExtended) tip = p12;

  // 镜像到用户视角（摄像头自拍视角，横坐标翻转）
  const tx = (1 - tip.x) * W;
  const ty = tip.y * H;

  return { active, tx, ty, tip, isFist, lm };
}

// 节流到约 30fps 的本地手势推理（支持单手/双手同屏识别）
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

  const landmarks = res.landmarks || [];
  if (landmarks.length > 0) {
    handPresent = true;
    lastHandT = now;

    // 分析所有检测到的手部（支持左手、右手、双手）
    const analyzedHands = landmarks.map((lm) => analyzeHand(lm));

    if (analyzedHands.length === 1) {
      // 只有一只手（无论是左手还是右手），都稳定分配给第 1 把刀
      const h0 = analyzedHands[0];
      blades[0].active = h0.active;
      blades[0].tx = h0.tx;
      blades[0].ty = h0.ty;
      blades[0].targetSet = true;

      // 第 2 把刀收起
      blades[1].active = false;
      blades[1].targetSet = false;
      blades[1].hasPrev = false;
    } else {
      // 双手同屏：按屏幕横向位置排序，左侧给 blade 0，右侧给 blade 1，稳定不跳手
      analyzedHands.sort((a, b) => a.tx - b.tx);
      for (let i = 0; i < 2; i++) {
        const h = analyzedHands[i];
        blades[i].active = h.active;
        blades[i].tx = h.tx;
        blades[i].ty = h.ty;
        blades[i].targetSet = true;
      }
    }

    drawSkeletons(analyzedHands);
  } else {
    handPresent = false;
    for (const b of blades) {
      b.active = false;
      b.hasPrev = false;
      b.targetSet = false;
    }
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

// 在小窗预览上绘制手部骨架（随外层 CSS 水平镜像，双手分色展示）
function drawSkeletons(analyzedHands) {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw) return;
  if (camOverlay.width !== vw) { camOverlay.width = vw; camOverlay.height = vh; }
  octx.clearRect(0, 0, vw, vh);

  analyzedHands.forEach((h, idx) => {
    const lm = h.lm;
    const isEmerald = idx === 0;
    octx.strokeStyle = isEmerald ? 'rgba(80, 230, 160, 0.95)' : 'rgba(251, 191, 36, 0.95)';
    octx.lineWidth = vw * 0.009;
    octx.lineCap = 'round';
    for (const [a, b] of HAND_CONNECTIONS) {
      const A = lm[a], B = lm[b];
      octx.beginPath();
      octx.moveTo(A.x * vw, A.y * vh);
      octx.lineTo(B.x * vw, B.y * vh);
      octx.stroke();
    }
    octx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    for (const p of lm) {
      octx.beginPath(); octx.arc(p.x * vw, p.y * vh, vw * 0.012, 0, Math.PI * 2); octx.fill();
    }
    const t = h.tip;
    octx.fillStyle = h.active ? (isEmerald ? '#34d399' : '#fbbf24') : '#94a3b8';
    octx.beginPath(); octx.arc(t.x * vw, t.y * vh, vw * 0.024, 0, Math.PI * 2); octx.fill();
  });
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
  blades[0].active = true;
  const p = canvasPos(e);
  blades[0].tx = p.x; blades[0].ty = p.y;
  blades[0].targetSet = true;
}

function bindEvents() {
  window.addEventListener('resize', resize);

  canvas.addEventListener('pointerdown', setPointerTarget);
  canvas.addEventListener('pointermove', setPointerTarget);
  canvas.addEventListener('pointerup', () => { pointerActive = false; blades[0].active = false; blades[0].hasPrev = false; });
  canvas.addEventListener('pointercancel', () => { pointerActive = false; blades[0].active = false; blades[0].hasPrev = false; });
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
  const btnCancel = $('btn-cancel-loading');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      teardownCamera();
      showPanel(panelMenu);
    });
  }
  const btnSkip = $('btn-skip-loading');
  if (btnSkip) {
    btnSkip.addEventListener('click', () => {
      teardownCamera();
      ensureAudio();
      mode = 'pointer';
      resetBlades();
      startGame();
      toast('已切换为鼠标 / 触控板划屏模式，尽情切水果！');
    });
  }
  camPicker.addEventListener('change', () => { if (camPicker.value) switchCamera(camPicker.value); });
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
  }

  const btnCamPos = $('btn-cam-pos');
  if (btnCamPos) {
    btnCamPos.addEventListener('click', (e) => {
      e.stopPropagation();
      const isTop = cameraStack.classList.contains('pos-top-right');
      if (isTop) {
        cameraStack.classList.remove('pos-top-right');
        cameraStack.classList.add('pos-bottom-right');
        toast('摄像头小窗已移至右下角');
      } else {
        cameraStack.classList.remove('pos-bottom-right');
        cameraStack.classList.add('pos-top-right');
        toast('摄像头小窗已移至右上角');
      }
    });
  }

  const btnCamToggle = $('btn-cam-toggle');
  if (btnCamToggle) {
    btnCamToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = cameraStack.classList.toggle('is-collapsed');
      btnCamToggle.textContent = isCollapsed ? '👁️ 展开' : '👁️ 收起';
      const badge = $('cam-badge');
      if (badge) badge.textContent = isCollapsed ? '🎥 运行中' : '🎥 摄像头识别中';
      toast(isCollapsed ? '摄像头小窗已折叠收起' : '摄像头小窗已展开');
    });
  }

  $('btn-pointer-mode').addEventListener('click', () => {
    ensureAudio();
    mode = 'pointer';
    resetBlades();
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

/* ---------------- 资源静默预热 ---------------- */
function preloadVisionAssets() {
  if (handLandmarker) return;
  try {
    import(HAND_BUNDLE).then((mod) => {
      if (mod && mod.FilesetResolver) {
        mod.FilesetResolver.forVisionTasks(HAND_WASM).catch(() => {});
      }
    }).catch(() => {});
    fetch(HAND_MODEL, { mode: 'cors', cache: 'force-cache' }).catch(() => {});
  } catch (e) { /* 忽略 */ }
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

  // 页面空闲时静默预加载手势模型，点击按钮时秒开
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preloadVisionAssets, { timeout: 3500 });
  } else {
    setTimeout(preloadVisionAssets, 1500);
  }
}
init();

})();
