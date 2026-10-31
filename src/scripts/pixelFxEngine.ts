/**
 * PixelFX Engine for Retro Arcade & Math Practice
 * Powered by patch-gg/pixelfx (232 code-driven pixel art effects)
 */

import { createFrame, clearFrame, createFx, composite } from 'pixelfx';
import * as confettiMod from 'pixelfx/fx/ui/confetti';
import * as levelUpMod from 'pixelfx/fx/ui/level-up';
import * as comboCounterMod from 'pixelfx/fx/ui/combo-counter';
import * as critNumberMod from 'pixelfx/fx/ui/crit-number';
import * as achievementMod from 'pixelfx/fx/ui/achievement';
import * as collectBurstMod from 'pixelfx/fx/pickups/collect-burst';
import * as hitSparkMod from 'pixelfx/fx/impacts/hit-spark';
import * as shieldBlockMod from 'pixelfx/fx/impacts/shield-block';

export interface PixelFxInstance {
  mod: any;
  fx: any;
  frame: any;
  imgData: ImageData;
  offscreen: HTMLCanvasElement;
  offscreenCtx: CanvasRenderingContext2D;
  w: number;
  h: number;
  ox: number;
  oy: number;
  x: number;
  y: number;
  scale: number;
}

class PixelFxEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private instances: PixelFxInstance[] = [];
  private animId: number | null = null;
  private lastTime = 0;
  private isEnabled = true;

  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: false });
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
    console.log('[PixelFX] Initialized with 8 retro visual effects from patch-gg/pixelfx.');
  }

  public setEnabled(val: boolean) {
    this.isEnabled = val;
    if (!val) {
      this.clearAll();
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public resize() {
    if (!this.canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  public clearAll() {
    this.instances = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private createInstance(mod: any, opts: any = {}, x: number, y: number, scale = 2): PixelFxInstance | null {
    if (!this.isEnabled) return null;
    try {
      const [w, h] = mod.meta.size;
      const [ox, oy] = mod.meta.origin || [Math.floor(w / 2), Math.floor(h / 2)];
      const frame = createFrame(w, h);
      const fx = createFx(mod, { x: ox, y: oy, ...opts });
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const offscreenCtx = offscreen.getContext('2d');
      if (!offscreenCtx) return null;
      const imgData = offscreenCtx.createImageData(w, h);

      return {
        mod,
        fx,
        frame,
        imgData,
        offscreen,
        offscreenCtx,
        w,
        h,
        ox,
        oy,
        x,
        y,
        scale
      };
    } catch (err) {
      console.warn('[PixelFX] Failed to create instance:', err);
      return null;
    }
  }

  private ensureLoop() {
    if (this.animId !== null) return;
    this.lastTime = performance.now();
    this.animId = requestAnimationFrame(time => this.renderLoop(time));
  }

  private renderLoop(time: number) {
    if (!this.ctx || !this.canvas) {
      this.animId = null;
      return;
    }

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.imageSmoothingEnabled = false;

    for (let i = this.instances.length - 1; i >= 0; i--) {
      const inst = this.instances[i];
      inst.fx.update(dt);

      if (inst.fx.done()) {
        this.instances.splice(i, 1);
        continue;
      }

      clearFrame(inst.frame);
      inst.fx.draw(inst.frame);
      composite(inst.frame, inst.imgData.data, null);
      inst.offscreenCtx.putImageData(inst.imgData, 0, 0);

      const dx = Math.round(inst.x - inst.ox * inst.scale);
      const dy = Math.round(inst.y - inst.oy * inst.scale);
      const dw = Math.round(inst.w * inst.scale);
      const dh = Math.round(inst.h * inst.scale);

      this.ctx.drawImage(inst.offscreen, dx, dy, dw, dh);
    }

    if (this.instances.length > 0) {
      this.animId = requestAnimationFrame(t => this.renderLoop(t));
    } else {
      this.animId = null;
    }
  }

  /**
   * Helper to get target center coordinates
   */
  private getTargetCoords(target?: HTMLElement | null): { x: number; y: number } {
    if (target) {
      const rect = target.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  }

  /**
   * 触发答对特效：
   * - 基础：像素收集闪光 (collect-burst) 或 命中火花 (hit-spark)
   * - 极速/暴击：像素数字暴击 (crit-number)
   * - 连对 3+ / 5+：额外触发像素 Combo 连击火箭 (combo-counter)
   */
  public triggerCorrect(target?: HTMLElement | null, streak = 1, isFast = false) {
    if (!this.isEnabled) return;
    const { x, y } = this.getTargetCoords(target);

    // 基础答对：交替使用 collect-burst 与 hit-spark
    const isBurst = Math.random() > 0.45;
    const mod = isBurst ? collectBurstMod : hitSparkMod;
    const inst = this.createInstance(mod, {
      seed: Math.floor(Math.random() * 100),
      light: 1.3
    }, x, y, 2.2);

    if (inst) {
      this.instances.push(inst);
    }

    // 极速答题或连对>=3时，触发暴击数字特效
    if (isFast || streak >= 3) {
      const scoreText = streak >= 5 ? `+${10 + streak * 2}` : '+10';
      const labelText = isFast ? 'FAST' : (streak >= 5 ? 'STREAK' : 'GOOD');
      const crit = this.createInstance(critNumberMod, {
        text: scoreText,
        label: labelText,
        seed: streak * 5 + 3
      }, x + (Math.random() * 40 - 20), y - 60, 1.8);

      if (crit) this.instances.push(crit);
    }

    // 连对每逢 3 或 5 的倍数时，触发震撼像素 COMBO 横幅
    if (streak >= 3 && (streak % 3 === 0 || streak % 5 === 0)) {
      this.triggerCombo(streak, target);
    }

    this.ensureLoop();
  }

  /**
   * 触发连击特效 (combo-counter)
   */
  public triggerCombo(streak: number, target?: HTMLElement | null) {
    if (!this.isEnabled) return;
    const { x } = this.getTargetCoords(target);
    const y = Math.max(130, window.innerHeight * 0.28);

    const inst = this.createInstance(comboCounterMod, {
      count: streak,
      label: 'COMBO 连对',
      seed: streak + 12
    }, x, y, 2.1);

    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }
  }

  /**
   * 触发答错特效：
   * - 能量护盾格挡反弹 (shield-block) 碎裂红色像素
   * - 配合卡片震动反馈
   */
  public triggerWrong(target?: HTMLElement | null, stageEl?: HTMLElement | null) {
    if (!this.isEnabled) return;
    const { x, y } = this.getTargetCoords(target);

    const inst = this.createInstance(shieldBlockMod, {
      palette: ['#3b0811', '#6b1122', '#aa1936', '#e11d48', '#fb7185', '#fecdd3', '#ffffff'],
      sparks: ['#fecdd3', '#fda4af', '#f43f5e', '#e11d48'],
      seed: Math.floor(Math.random() * 100)
    }, x, y, 2.2);

    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }

    // 屏幕轻度红光像素颤抖反馈
    if (stageEl) {
      stageEl.animate([
        { transform: 'translate(0, 0)' },
        { transform: 'translate(-8px, 2px)' },
        { transform: 'translate(8px, -2px)' },
        { transform: 'translate(-5px, 0)' },
        { transform: 'translate(5px, 1px)' },
        { transform: 'translate(0, 0)' }
      ], {
        duration: 320,
        easing: 'cubic-bezier(.36,.07,.19,.97)'
      });
    }
  }

  /**
   * 触发晋级升级特效 (level-up)：
   * - 黄金圣光柱从地表升起、上升圆环、璀璨金星与 LEVEL UP! 扫光字样
   */
  public triggerLevelUp(text = 'LEVEL UP!') {
    if (!this.isEnabled) return;
    const x = window.innerWidth / 2;
    const y = window.innerHeight * 0.45;

    const inst = this.createInstance(levelUpMod, {
      text,
      palette: ['#2a1405', '#5c3008', '#9a5a0e', '#d48e18', '#f5b92c', '#ffde5e', '#fff4bc', '#ffffff'],
      seed: 8
    }, x, y, 2.4);

    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }
  }

  /**
   * 触发大通关 / 结题大狂欢 (confetti & achievement)：
   * - 双礼花筒爆发彩纸碎屑漫天飘落，金光闪烁
   */
  public triggerConfetti() {
    if (!this.isEnabled) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.55;

    // 左侧礼花筒
    const instLeft = this.createInstance(confettiMod, {
      seed: 11,
      palette: ['#ff4a5a', '#ff9a2a', '#ffe03c', '#5ad84a', '#3cc8ff', '#7a6cff', '#f53cd1']
    }, cx - 120, cy, 2.4);

    // 右侧礼花筒
    const instRight = this.createInstance(confettiMod, {
      seed: 42,
      palette: ['#ffe03c', '#ff9a2a', '#ff4a5a', '#3cc8ff', '#5ad84a', '#a855f7', '#ec4899']
    }, cx + 120, cy, 2.4);

    if (instLeft) this.instances.push(instLeft);
    if (instRight) this.instances.push(instRight);

    // 胜利成就横幅 (achievement)
    setTimeout(() => {
      const ach = this.createInstance(achievementMod, {
        title: 'VICTORY!',
        text: '速算大闯关通关',
        seed: 7
      }, cx, window.innerHeight * 0.22, 2.0);
      if (ach) {
        this.instances.push(ach);
        this.ensureLoop();
      }
    }, 450);

    this.ensureLoop();
  }
}

export const pixelFx = new PixelFxEngine();
