/**
 * PixelFX Engine for WordKey (learn.wordsmaster.app)
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
    console.log('[WordKey PixelFX] Initialized with 8 retro visual effects from patch-gg/pixelfx.');
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
        scale,
      };
    } catch (err) {
      console.warn('[PixelFX] Failed to create FX instance', err);
      return null;
    }
  }

  private loop = (time: number) => {
    if (!this.lastTime) this.lastTime = time;
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.instances.length - 1; i >= 0; i--) {
      const inst = this.instances[i];
      inst.fx.update(dt);

      if (inst.fx.done) {
        this.instances.splice(i, 1);
        continue;
      }

      clearFrame(inst.frame);
      inst.fx.draw(inst.frame);

      const len = inst.frame.data.length;
      const target = inst.imgData.data;
      for (let p = 0; p < len; p++) {
        target[p] = inst.frame.data[p];
      }
      inst.offscreenCtx.putImageData(inst.imgData, 0, 0);

      const renderW = inst.w * inst.scale;
      const renderH = inst.h * inst.scale;
      const drawX = Math.round(inst.x - inst.ox * inst.scale);
      const drawY = Math.round(inst.y - inst.oy * inst.scale);

      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(inst.offscreen, drawX, drawY, renderW, renderH);
    }

    if (this.instances.length > 0) {
      this.animId = requestAnimationFrame(this.loop);
    } else {
      this.animId = null;
      this.lastTime = 0;
    }
  };

  private ensureLoop() {
    if (this.animId === null && this.instances.length > 0) {
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this.loop);
    }
  }

  // 1. 正确按键或点击字母像素光芒 (Hit Spark)
  public triggerHitSpark(x: number, y: number, scale = 2.5) {
    const inst = this.createInstance(hitSparkMod, {}, x, y, scale);
    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }
  }

  // 2. 收集/单词拼对像素爆裂 (Collect Burst)
  public triggerCollectBurst(x: number, y: number, scale = 3.2) {
    const inst = this.createInstance(collectBurstMod, {}, x, y, scale);
    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }
  }

  // 3. 浮动像素飘字 (Crit Number: 如 "+10", "+50", "PERFECT!")
  public triggerCritNumber(x: number, y: number, text = '+10', scale = 2.4) {
    const inst = this.createInstance(critNumberMod, { text }, x, y, scale);
    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }
  }

  // 4. 连击数字特效 (Combo Counter)
  public triggerCombo(x: number, y: number, count: number, scale = 2.6) {
    const inst = this.createInstance(comboCounterMod, { combo: count }, x, y, scale);
    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }
  }

  // 5. 庆祝彩带纸屑 (Confetti)
  public triggerConfetti(scale = 2.5) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const inst = this.createInstance(confettiMod, {}, Math.floor(w / 2), Math.floor(h * 0.4), scale);
    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }
  }

  // 6. 任务通关/升级光环 (Level Up)
  public triggerLevelUp(scale = 2.8) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const inst = this.createInstance(levelUpMod, {}, Math.floor(w / 2), Math.floor(h * 0.42), scale);
    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }
  }

  // 7. 成就勋章徽章解锁 (Achievement)
  public triggerAchievement(scale = 2.8) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const inst = this.createInstance(achievementMod, {}, Math.floor(w / 2), Math.floor(h * 0.35), scale);
    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }
  }

  // 8. 错误按键防御/阻挡火花 (Shield Block)
  public triggerShieldBlock(x: number, y: number, scale = 2.2) {
    const inst = this.createInstance(shieldBlockMod, {}, x, y, scale);
    if (inst) {
      this.instances.push(inst);
      this.ensureLoop();
    }
  }

  // 9. 触觉振动反馈 (Haptic Feedback)
  public triggerHaptic(type: 'tap' | 'success' | 'combo' | 'error' = 'tap') {
    if (typeof window === 'undefined' || !navigator?.vibrate) return;
    try {
      if (type === 'tap') navigator.vibrate(12);
      else if (type === 'success') navigator.vibrate(35);
      else if (type === 'combo') navigator.vibrate([25, 40, 45]);
      else if (type === 'error') navigator.vibrate([50, 40, 50]);
    } catch (_) {}
  }
}

export const wordkeyPixelFx = new PixelFxEngine();
