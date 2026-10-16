import * as THREE from 'three';
import { sound } from '../utils/audio';

/**
 * 3D Spatial Audio System for Claw Machine.
 * Uses Three.js AudioListener + PositionalAudio with HRTF panning and procedurally synthesized
 * high-fidelity arcade sound buffers.
 */
export class SpatialAudioManager {
  private listener: THREE.AudioListener;
  private camera: THREE.Camera;
  private scene: THREE.Scene;

  // Cached AudioBuffers
  private dropBuffer: AudioBuffer | null = null;
  private grabBuffer: AudioBuffer | null = null;
  private chuteWinBuffer: AudioBuffer | null = null;
  private ascendBuffer: AudioBuffer | null = null;
  private releaseBuffer: AudioBuffer | null = null;
  private slipBuffer: AudioBuffer | null = null;

  // Positional Audio Emitters
  private clawAudio: THREE.PositionalAudio;
  private chuteAudio: THREE.PositionalAudio;
  private gantryAudio: THREE.PositionalAudio;

  // Anchors in 3D scene
  private clawAnchor: THREE.Object3D;
  private chuteAnchor: THREE.Object3D;
  private gantryAnchor: THREE.Object3D;

  private isInitialized = false;

  constructor(camera: THREE.Camera, scene: THREE.Scene, clawGroup: THREE.Object3D, gantryCarriage: THREE.Object3D) {
    this.camera = camera;
    this.scene = scene;
    this.clawAnchor = clawGroup;
    this.gantryAnchor = gantryCarriage;

    // 1. Initialize AudioListener and bind to camera
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    // 2. Create Chute Exit spatial anchor in bottom-left payout drawer
    this.chuteAnchor = new THREE.Object3D();
    this.chuteAnchor.name = 'SpatialAudio_ChuteExit';
    // Chute center in cabinet is X=-0.98, Z=0.95, exit tray is at Y=-0.3
    this.chuteAnchor.position.set(-0.98, -0.3, 0.95);
    this.scene.add(this.chuteAnchor);

    // 3. Create PositionalAudio nodes with HRTF binaural panning
    this.clawAudio = this.createPositionalAudio(1.4, 18, 1.2);
    this.clawAnchor.add(this.clawAudio);

    this.chuteAudio = this.createPositionalAudio(1.5, 20, 1.0);
    this.chuteAnchor.add(this.chuteAudio);

    this.gantryAudio = this.createPositionalAudio(1.2, 16, 1.3);
    this.gantryAnchor.add(this.gantryAudio);

    // 4. Synthesize procedural 3D audio buffers
    this.synthesizeBuffers();

    // 5. User gesture resume hook
    this.setupGestureUnlock();
  }

  private createPositionalAudio(refDist: number, maxDist: number, rolloff: number): THREE.PositionalAudio {
    const audio = new THREE.PositionalAudio(this.listener);
    audio.setRefDistance(refDist);
    audio.setMaxDistance(maxDist);
    audio.setRolloffFactor(rolloff);
    audio.setDistanceModel('inverse');
    if (audio.panner) {
      audio.panner.panningModel = 'HRTF';
      audio.panner.coneInnerAngle = 360;
    }
    return audio;
  }

  private ensureContextReady() {
    const ctx = this.listener.context;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  private setupGestureUnlock() {
    const unlock = () => {
      this.ensureContextReady();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  /**
   * Synthesize arcade-grade procedural audio buffers.
   * Mono channel is required by Web Audio PannerNode for accurate 3D spatialization.
   */
  private synthesizeBuffers() {
    const ctx = this.listener.context;
    if (!ctx) return;
    const sampleRate = ctx.sampleRate || 44100;

    // A. Claw Drop Buffer (Descends in 3D: electric winch whine + air friction)
    {
      const duration = 1.35;
      const len = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, len, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < len; i++) {
        const t = i / sampleRate;
        const norm = t / duration;

        // Descending winch frequency 360Hz -> 130Hz
        const freq = 360 * Math.exp(-norm * 1.05) + 15 * Math.sin(t * 40);
        const phase = 2 * Math.PI * freq * t;

        // Rich gear motor harmonics
        const tone = 0.55 * Math.sin(phase) + 0.28 * Math.sin(phase * 2) + 0.12 * Math.sin(phase * 3);

        // Wind / cable friction noise
        const noise = (Math.random() * 2 - 1) * 0.18;

        // Amplitude envelope (smooth in, sustained, fade out)
        const env = Math.min(t / 0.08, 1) * Math.max(0, 1 - Math.pow(norm, 2.2));
        data[i] = (tone * 0.75 + noise * 0.25) * env * 0.7;
      }
      this.dropBuffer = buffer;
    }

    // B. Claw Grab / Clamp Buffer (Crisp mechanical solenoid snap + ratchet click + plush tension)
    {
      const duration = 0.45;
      const len = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, len, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < len; i++) {
        const t = i / sampleRate;

        // 1. Initial solenoid strike (t: 0 ~ 0.05s)
        let strike = 0;
        if (t < 0.06) {
          const strikeFreq = 480 * Math.exp(-t * 80);
          strike = Math.sin(2 * Math.PI * strikeFreq * t) * Math.exp(-t * 60) * 1.2;
        }

        // 2. Triple ratchet clicks (claw finger hinges locking)
        let ratchets = 0;
        const clickTimes = [0.03, 0.07, 0.11];
        clickTimes.forEach((ct) => {
          const dt = t - ct;
          if (dt >= 0 && dt < 0.02) {
            const clickFreq = 1200 * Math.exp(-dt * 200);
            ratchets += Math.sin(2 * Math.PI * clickFreq * dt) * Math.exp(-dt * 250) * 0.8;
          }
        });

        // 3. Plush doll body compression resonance (deep 95Hz damped thump)
        const plushThump = Math.sin(2 * Math.PI * 95 * t) * Math.exp(-t * 18) * 0.75;

        // 4. Metal spring ring / tension clack
        const ringFreq = 820;
        const metalRing = Math.sin(2 * Math.PI * ringFreq * t) * Math.exp(-t * 28) * 0.25;

        const combined = strike + ratchets + plushThump + metalRing;
        data[i] = Math.max(-1, Math.min(1, combined * 0.85));
      }
      this.grabBuffer = buffer;
    }

    // C. Chute Drop & Win Buffer (Spatialized at bottom-left chute exit:
    //    Plush slide down acrylic chute -> Trapdoor flap -> Soft landing -> Celebratory 3D chimes)
    {
      const duration = 2.1;
      const len = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, len, sampleRate);
      const data = buffer.getChannelData(0);

      // Chime notes for celebratory arcade fanfare: C5, E5, G5, B5, C6, E6
      const chimeFrequencies = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51, 1567.98];
      const noteStarts = [0.38, 0.52, 0.66, 0.80, 0.94, 1.10, 1.28];

      for (let i = 0; i < len; i++) {
        const t = i / sampleRate;
        let sample = 0;

        // Phase 1 (0 to 0.25s): Acrylic chute glide friction whoosh
        if (t < 0.28) {
          const slideEnv = Math.sin((t / 0.28) * Math.PI);
          const slideNoise = (Math.random() * 2 - 1) * 0.22;
          const slideTone = Math.sin(2 * Math.PI * 420 * t) * 0.15;
          sample += (slideNoise + slideTone) * slideEnv;
        }

        // Phase 2 (0.22 to 0.40s): Trapdoor flap clatter & plush soft bottom impact
        if (t >= 0.20 && t < 0.48) {
          const dt = t - 0.22;
          const flap = Math.sin(2 * Math.PI * 180 * dt) * Math.exp(-dt * 35) * 0.7;
          const thud = Math.sin(2 * Math.PI * 72 * dt) * Math.exp(-dt * 20) * 0.9;
          sample += flap + thud;
        }

        // Phase 3 (0.38 to 2.1s): Crystal celebratory arpeggio chimes radiating from payout tray
        for (let n = 0; n < noteStarts.length; n++) {
          const nStart = noteStarts[n];
          if (t >= nStart) {
            const dt = t - nStart;
            const f = chimeFrequencies[n];
            // Bell harmonic spectrum: fundamental + 2.76x + 5.4x overtones
            const bell =
              0.60 * Math.sin(2 * Math.PI * f * dt) +
              0.28 * Math.sin(2 * Math.PI * f * 2.76 * dt) +
              0.12 * Math.sin(2 * Math.PI * f * 5.4 * dt);
            const decay = Math.exp(-dt * (n === noteStarts.length - 1 ? 2.5 : 4.5));
            sample += bell * decay * 0.42;
          }
        }

        data[i] = Math.max(-1, Math.min(1, sample * 0.8));
      }
      this.chuteWinBuffer = buffer;
    }

    // D. Ascend Buffer (Motor winch pulling claw up)
    {
      const duration = 0.9;
      const len = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, len, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < len; i++) {
        const t = i / sampleRate;
        const norm = t / duration;
        // Rising frequency 140Hz -> 290Hz
        const freq = 140 + norm * 150 + Math.sin(t * 60) * 8;
        const phase = 2 * Math.PI * freq * t;
        const tone = 0.6 * Math.sin(phase) + 0.3 * Math.sin(phase * 2);
        const env = Math.min(t / 0.05, 1) * Math.max(0, 1 - norm * 0.85);
        data[i] = tone * env * 0.45;
      }
      this.ascendBuffer = buffer;
    }

    // E. Release Buffer (Claw opening at chute top)
    {
      const duration = 0.28;
      const len = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, len, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < len; i++) {
        const t = i / sampleRate;
        const click = Math.sin(2 * Math.PI * (520 - t * 800) * t) * Math.exp(-t * 30);
        const air = (Math.random() * 2 - 1) * Math.exp(-t * 22) * 0.3;
        data[i] = (click * 0.6 + air * 0.4) * 0.7;
      }
      this.releaseBuffer = buffer;
    }

    // F. Slip / Miss Buffer (Doll slipping out of claws)
    {
      const duration = 0.38;
      const len = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, len, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < len; i++) {
        const t = i / sampleRate;
        const chirp = Math.sin(2 * Math.PI * (340 - t * 400) * t) * Math.exp(-t * 14);
        const rub = (Math.random() * 2 - 1) * Math.exp(-t * 18) * 0.25;
        data[i] = (chirp + rub) * 0.6;
      }
      this.slipBuffer = buffer;
    }

    this.isInitialized = true;
  }

  // --- Public 3D Spatial Audio Triggers ---

  /**
   * 1. 爪子下落 (Claw Dropping / Descent)
   * Spatial source tracks the moving claw group in 3D as it plunges downward.
   */
  public playClawDrop() {
    if (sound.isMuted) return;
    this.ensureContextReady();
    if (!this.dropBuffer) return;

    if (this.clawAudio.isPlaying) {
      this.clawAudio.stop();
    }
    this.clawAudio.setBuffer(this.dropBuffer);
    this.clawAudio.setVolume(0.9);
    this.clawAudio.play();
  }

  /**
   * 2. 抓紧玩偶 (Gripping / Clamping the doll)
   * Sharp 3D tactile snap localized at the doll heap contact point.
   */
  public playClawGrab() {
    if (sound.isMuted) return;
    this.ensureContextReady();
    if (!this.grabBuffer) return;

    if (this.clawAudio.isPlaying) {
      this.clawAudio.stop();
    }
    this.clawAudio.setBuffer(this.grabBuffer);
    this.clawAudio.setVolume(1.0);
    this.clawAudio.play();
  }

  /**
   * 3. 成功抓取放入出口 (Successful catch dropping into chute exit)
   * Spatial source placed right at the front-left prize collection basin (X=-0.98, Y=-0.3, Z=0.95),
   * radiating physical tumble, trapdoor clink, and arcade victory chimes.
   */
  public playPrizeWonAndChuteDrop() {
    if (sound.isMuted) return;
    this.ensureContextReady();
    if (!this.chuteWinBuffer) return;

    if (this.chuteAudio.isPlaying) {
      this.chuteAudio.stop();
    }
    this.chuteAudio.setBuffer(this.chuteWinBuffer);
    this.chuteAudio.setVolume(1.1);
    this.chuteAudio.play();
  }

  /**
   * Claw Ascending with prize or empty
   */
  public playClawAscend() {
    if (sound.isMuted) return;
    this.ensureContextReady();
    if (!this.ascendBuffer) return;

    if (this.gantryAudio.isPlaying) {
      this.gantryAudio.stop();
    }
    this.gantryAudio.setBuffer(this.ascendBuffer);
    this.gantryAudio.setVolume(0.75);
    this.gantryAudio.play();
  }

  /**
   * Claw opening / releasing above the chute
   */
  public playClawRelease() {
    if (sound.isMuted) return;
    this.ensureContextReady();
    if (!this.releaseBuffer) return;

    this.clawAudio.setBuffer(this.releaseBuffer);
    this.clawAudio.setVolume(0.8);
    this.clawAudio.play();
  }

  /**
   * Toy slipping off claws
   */
  public playClawSlip() {
    if (sound.isMuted) return;
    this.ensureContextReady();
    if (!this.slipBuffer) return;

    this.clawAudio.setBuffer(this.slipBuffer);
    this.clawAudio.setVolume(0.85);
    this.clawAudio.play();
  }

  /**
   * Clean up audio nodes and listeners on unmount
   */
  public destroy() {
    try {
      if (this.clawAudio.isPlaying) this.clawAudio.stop();
      if (this.chuteAudio.isPlaying) this.chuteAudio.stop();
      if (this.gantryAudio.isPlaying) this.gantryAudio.stop();

      this.clawAnchor.remove(this.clawAudio);
      this.chuteAnchor.remove(this.chuteAudio);
      this.gantryAnchor.remove(this.gantryAudio);
      this.camera.remove(this.listener);

      if (this.scene && this.chuteAnchor.parent) {
        this.scene.remove(this.chuteAnchor);
      }
    } catch {
      // ignore disposal errors
    }
  }
}
