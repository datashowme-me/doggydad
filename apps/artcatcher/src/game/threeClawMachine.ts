import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CameraAngle, GameState, PrizeMetadata } from '../types';
import { PRIZES } from '../utils/artData';
import { getMarqueeTexture } from '../utils/artTextures';
import { sound } from '../utils/audio';
import { createFigurine, FigurineInstance } from './figurineBuilder';
import { SpatialAudioManager } from './spatialAudio';

export interface ClawMachineCallbacks {
  onStateChange: (state: GameState) => void;
  onPrizeWon: (prize: PrizeMetadata) => void;
  onDropMiss: () => void;
  onCoinConsumed?: () => void;
  onTargetLockChange?: (prize: PrizeMetadata | null) => void;
  onCameraAngleChange?: (angle: CameraAngle) => void;
  onClawPositionChange?: (coords: { x: number; z: number; normX: number; normZ: number }) => void;
}

export class ClawMachineGame {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animFrameId: number | null = null;
  private isDestroyed = false;

  // Game state
  public state: GameState = 'IDLE';
  private callbacks: ClawMachineCallbacks;
  public currentCameraAngle: CameraAngle = 'FRONT';
  private isAnimatingCamera = false;

  // Claw Gantry Position & Range
  // Rails are at Y=3.75, resting claw hangs at Y=3.05 (clearly visible in the upper glass)
  private gantryPos = new THREE.Vector3(0, 3.75, 0);
  private clawY = 3.05;
  private readonly X_MIN = -1.25;
  private readonly X_MAX = 1.25;
  private readonly Z_MIN = -0.98;
  private readonly Z_MAX = 1.12;
  private readonly CLAW_TOP_Y = 3.05; // Ascend stops here
  private readonly CLAW_BOTTOM_LIMIT = 0.52;
  private readonly CHUTE_DROP_X = -0.98;
  private readonly CHUTE_DROP_Z = 0.95;

  // Joystick Input Vector
  public inputVector = { x: 0, z: 0 };

  // 3D Scene Components
  private clawGroup = new THREE.Group();
  private gantryCarriage = new THREE.Group();
  private cableMesh!: THREE.Mesh;
  private clawFingers: { armUpper: THREE.Mesh; armLower: THREE.Mesh; baseAngle: number; pivot: THREE.Group }[] = [];
  private clawOpenness = 0; // 0 (closed) to 1 (wide open)
  private targetClawOpenness = 0;

  // 3D Visual Guidance & Targeting Beam
  private laserBeamMesh!: THREE.Mesh;
  private aimingReticleGroup = new THREE.Group();
  private reticleOuterRing!: THREE.Mesh;
  private reticleCrosshair!: THREE.Group;
  private clawSpotLight!: THREE.SpotLight;
  private clawSpotLightTarget = new THREE.Object3D();
  private spotlightConeMesh!: THREE.Mesh;
  private clawLensMesh!: THREE.Mesh;
  private gantryFollowSpot!: THREE.SpotLight;
  private gantryFollowSpotTarget = new THREE.Object3D();
  private lockedPrize: PrizeMetadata | null = null;
  private spatialAudio: SpatialAudioManager;

  // Figurines
  private figurines: FigurineInstance[] = [];
  private grippedFigurine: FigurineInstance | null = null;

  // Camera Target Interpolation
  private targetCamPos = new THREE.Vector3(0, 2.3, 5.1);
  private targetCamLookAt = new THREE.Vector3(0, 1.85, 0);

  // Time tracking
  private lastTime = performance.now();

  constructor(container: HTMLElement, callbacks: ClawMachineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.04);

    // 2. Camera: pulled back slightly and looking at center so resting claw and gantry are 100% visible!
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 50);
    this.camera.position.set(0, 2.3, 5.1);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls for interactive 360 drag rotation
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 1.85, 0);
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 6.8;
    this.controls.minPolarAngle = 0.15; // Avoid going under ceiling/floor
    this.controls.maxPolarAngle = Math.PI * 0.48; // Avoid looking from underground

    this.controls.addEventListener('start', () => {
      if (this.currentCameraAngle !== 'FREE') {
        this.currentCameraAngle = 'FREE';
        this.callbacks.onCameraAngleChange?.('FREE');
      }
      this.isAnimatingCamera = false;
    });

    // 5. Lights
    this.setupLighting();

    // 6. Arcade Machine Structure
    this.buildArcadeCabinet();

    // 7. Gantry Crane & Claw Assembly (with trolley carriage, laser beam, and surface reticle)
    this.buildClawAssembly();

    // 8. 3D Spatial Audio System (binds HRTF audio to camera, moving claw, and prize chute exit)
    this.spatialAudio = new SpatialAudioManager(this.camera, this.scene, this.clawGroup, this.gantryCarriage);

    // 9. Spawn Figurines (meticulously distributed across 3-tier mountain heap)
    this.spawnFigurines();

    // 9. Event Listeners
    window.addEventListener('resize', this.onResize);

    // 10. Start loop
    this.lastTime = performance.now();
    this.animate();
  }

  private setupLighting() {
    // 1. Cabinet Interior Ambient Lighting (Warm Showcase Light + Soft Floor Bounce)
    // Enhances plush toy colors, textures, and depth inside the cabinet
    const interiorHemi = new THREE.HemisphereLight(0xfffbf0, 0x1e293b, 1.45);
    this.scene.add(interiorHemi);

    // Subtle global ambient fill
    const ambientFill = new THREE.AmbientLight(0xfff7ed, 0.45);
    this.scene.add(ambientFill);

    // Front soft directional fill to highlight outer marquee and front glass
    const frontFill = new THREE.DirectionalLight(0xe0f2fe, 1.1);
    frontFill.position.set(0, 3, 5);
    this.scene.add(frontFill);

    // 2. Ceiling Corner Showcase Spotlights (4 recessed warm arcade downlights)
    // Angled from cabinet top corners inwards towards the prize pit bed
    const cornerLightSpecs = [
      { x: -1.25, z: 1.1, tx: -0.3, tz: 0.2 },
      { x: 1.25, z: 1.1, tx: 0.3, tz: 0.2 },
      { x: -1.25, z: -1.1, tx: -0.3, tz: -0.2 },
      { x: 1.25, z: -1.1, tx: 0.3, tz: -0.2 },
    ];

    cornerLightSpecs.forEach((spec) => {
      const downlight = new THREE.SpotLight(0xfffae0, 2.2, 5.5, Math.PI / 3.4, 0.65, 1.1);
      downlight.position.set(spec.x, 3.82, spec.z);

      const targetObj = new THREE.Object3D();
      targetObj.position.set(spec.tx, 0.2, spec.tz);
      this.scene.add(targetObj);
      downlight.target = targetObj;
      this.scene.add(downlight);

      // Recessed bezel fixture on ceiling
      const bezelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
      const bezelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.8 });
      const bezel = new THREE.Mesh(bezelGeo, bezelMat);
      bezel.position.set(spec.x, 3.88, spec.z);
      this.scene.add(bezel);

      const lensGeo = new THREE.CircleGeometry(0.06, 16);
      const lensMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(spec.x, 3.87, spec.z);
      this.scene.add(lens);
    });

    // 3. Central Inner Ceiling Soft Downlight
    const centerCeilingDown = new THREE.PointLight(0xfff7ed, 2.0, 5.5, 1.2);
    centerCeilingDown.position.set(0, 3.82, 0);
    this.scene.add(centerCeilingDown);

    // 4. Arcade Glowing LED Neon Perimeter Strips (Around Inner Ceiling)
    // Front Strip (Warm Gold)
    this.createNeonCeilingStrip(new THREE.Vector3(0, 3.85, 1.3), 2.8, 0.04, 0.04, 0xf59e0b);
    // Back Strip (Ice Blue)
    this.createNeonCeilingStrip(new THREE.Vector3(0, 3.85, -1.25), 2.8, 0.04, 0.04, 0x38bdf8);
    // Left Strip (Neon Pink)
    this.createNeonCeilingStrip(new THREE.Vector3(-1.45, 3.85, 0.02), 0.04, 0.04, 2.55, 0xf43f5e);
    // Right Strip (Cyan)
    this.createNeonCeilingStrip(new THREE.Vector3(1.45, 3.85, 0.02), 0.04, 0.04, 2.55, 0x06b6d4);

    // 5. Prize Drop Chute Internal Neon Glow
    const chuteLight = new THREE.PointLight(0x10b981, 2.2, 2.0, 1.2);
    chuteLight.position.set(this.CHUTE_DROP_X, 0.25, this.CHUTE_DROP_Z);
    this.scene.add(chuteLight);

    const chuteRingNeonGeo = new THREE.TorusGeometry(0.24, 0.015, 8, 24);
    const chuteRingNeonMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const chuteRingNeon = new THREE.Mesh(chuteRingNeonGeo, chuteRingNeonMat);
    chuteRingNeon.rotation.x = Math.PI / 2;
    chuteRingNeon.position.set(this.CHUTE_DROP_X, 0.34, this.CHUTE_DROP_Z);
    this.scene.add(chuteRingNeon);

    // 6. Overhead Gantry Follow Spotlight (lights the claw from the carriage ceiling)
    this.gantryFollowSpot = new THREE.SpotLight(0xfffae0, 3.2, 5.0, Math.PI / 5.5, 0.5, 1.2);
    this.gantryFollowSpot.target = this.gantryFollowSpotTarget;
    this.scene.add(this.gantryFollowSpot);
    this.scene.add(this.gantryFollowSpotTarget);
  }

  private createNeonCeilingStrip(
    pos: THREE.Vector3,
    width: number,
    height: number,
    depth: number,
    colorHex: number
  ) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    const light = new THREE.PointLight(colorHex, 1.4, 3.0, 1.8);
    light.position.copy(pos);
    light.position.y -= 0.05;
    this.scene.add(light);
  }

  private buildArcadeCabinet() {
    // Materials
    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.4,
      metalness: 0.8,
    });
    const goldTrim = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.88,
      ior: 1.5,
    });
    const machineBottom = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.7,
    });

    // Pit Floor (top surface at y = 0.0)
    const floorGeo = new THREE.BoxGeometry(3.1, 0.2, 2.7);
    const floorMesh = new THREE.Mesh(floorGeo, machineBottom);
    floorMesh.position.y = -0.1;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // Outer Room Floor
    const roomFloorGeo = new THREE.PlaneGeometry(18, 18);
    const roomFloorMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.8,
    });
    const roomFloor = new THREE.Mesh(roomFloorGeo, roomFloorMat);
    roomFloor.rotation.x = -Math.PI / 2;
    roomFloor.position.y = -1.2;
    roomFloor.receiveShadow = true;
    this.scene.add(roomFloor);

    // Cabinet Lower Base Box
    const baseGeo = new THREE.BoxGeometry(3.3, 1.2, 2.9);
    const baseMesh = new THREE.Mesh(baseGeo, darkMetal);
    baseMesh.position.y = -0.7;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.scene.add(baseMesh);

    // Cabinet Roof Marquee
    const roofGeo = new THREE.BoxGeometry(3.3, 0.7, 2.9);
    const roofMesh = new THREE.Mesh(roofGeo, darkMetal);
    roofMesh.position.y = 4.25;
    roofMesh.castShadow = true;
    this.scene.add(roofMesh);

    // Marquee Signboard on Top Front
    const marqueeGeo = new THREE.PlaneGeometry(3.1, 0.55);
    const marqueeMat = new THREE.MeshBasicMaterial({
      map: getMarqueeTexture(),
    });
    const marqueeMesh = new THREE.Mesh(marqueeGeo, marqueeMat);
    marqueeMesh.position.set(0, 4.25, 1.46);
    this.scene.add(marqueeMesh);

    // Corner Pillars
    const pillarPositions = [
      [-1.55, 1.4],
      [1.55, 1.4],
      [-1.55, -1.35],
      [1.55, -1.35],
    ];
    const pillarGeo = new THREE.BoxGeometry(0.12, 4.3, 0.12);
    pillarPositions.forEach(([x, z]) => {
      const pillar = new THREE.Mesh(pillarGeo, goldTrim);
      pillar.position.set(x, 2.05, z);
      pillar.castShadow = true;
      this.scene.add(pillar);
    });

    // Glass Panels
    // Front Glass
    const frontGlassGeo = new THREE.PlaneGeometry(3.0, 3.8);
    const frontGlass = new THREE.Mesh(frontGlassGeo, glassMaterial);
    frontGlass.position.set(0, 1.9, 1.4);
    this.scene.add(frontGlass);

    // Left Glass
    const sideGlassGeo = new THREE.PlaneGeometry(2.7, 3.8);
    const leftGlass = new THREE.Mesh(sideGlassGeo, glassMaterial);
    leftGlass.rotation.y = Math.PI / 2;
    leftGlass.position.set(-1.55, 1.9, 0.025);
    this.scene.add(leftGlass);

    // Right Glass
    const rightGlass = new THREE.Mesh(sideGlassGeo, glassMaterial);
    rightGlass.rotation.y = -Math.PI / 2;
    rightGlass.position.set(1.55, 1.9, 0.025);
    this.scene.add(rightGlass);

    // Back Panel (Mirror surface)
    const backPanelGeo = new THREE.PlaneGeometry(3.0, 3.8);
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.1,
    });
    const backPanel = new THREE.Mesh(backPanelGeo, backMat);
    backPanel.position.set(0, 1.9, -1.35);
    this.scene.add(backPanel);

    // Prize Drop Chute (Bottom Left Corner: X = -0.98, Z = 0.95)
    const chuteWallMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      metalness: 0.4,
    });
    const chuteRingGeo = new THREE.BoxGeometry(0.7, 0.35, 0.7);
    const chuteRing = new THREE.Mesh(chuteRingGeo, chuteWallMat);
    chuteRing.position.set(this.CHUTE_DROP_X, 0.15, this.CHUTE_DROP_Z);
    this.scene.add(chuteRing);

    // Chute Hole (Dark Hole)
    const holeGeo = new THREE.BoxGeometry(0.55, 0.36, 0.55);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    holeMesh.position.set(this.CHUTE_DROP_X, 0.16, this.CHUTE_DROP_Z);
    this.scene.add(holeMesh);

    // Acrylic Chute Deflector Fence
    const fenceGeo = new THREE.BoxGeometry(0.04, 0.45, 0.7);
    const fenceMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    const fenceMesh = new THREE.Mesh(fenceGeo, fenceMat);
    fenceMesh.position.set(this.CHUTE_DROP_X + 0.35, 0.35, this.CHUTE_DROP_Z);
    this.scene.add(fenceMesh);
  }

  private buildClawAssembly() {
    // 1. Motorized Gantry Carriage / Trolley on Ceiling Rails
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x52525b,
      roughness: 0.4,
      metalness: 0.7,
    });

    // Longitudinal Rails along X
    const railXGeo = new THREE.CylinderGeometry(0.025, 0.025, 3.0, 8);
    const railX1 = new THREE.Mesh(railXGeo, railMat);
    railX1.rotation.z = Math.PI / 2;
    railX1.position.set(0, 3.75, 0.25);
    const railX2 = railX1.clone();
    railX2.position.set(0, 3.75, -0.25);
    this.scene.add(railX1, railX2);

    // Traveling Carriage Box (moves with gantryPos.x, gantryPos.z)
    const carriageMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      metalness: 0.8,
      roughness: 0.25,
    });
    const carriageGeo = new THREE.BoxGeometry(0.36, 0.14, 0.36);
    const carriageBody = new THREE.Mesh(carriageGeo, carriageMat);
    carriageBody.castShadow = true;
    this.gantryCarriage.add(carriageBody);

    // Cyan Pilot LED on Carriage
    const pilotMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const pilotLightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), pilotMat);
    pilotLightMesh.position.set(0, -0.06, 0.16);
    this.gantryCarriage.add(pilotLightMesh);

    // Cable Spool Drum
    const spoolGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.14, 12);
    const spoolMesh = new THREE.Mesh(spoolGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 }));
    spoolMesh.rotation.z = Math.PI / 2;
    spoolMesh.position.set(0, -0.04, 0);
    this.gantryCarriage.add(spoolMesh);

    this.gantryCarriage.position.set(this.gantryPos.x, 3.75, this.gantryPos.z);
    this.scene.add(this.gantryCarriage);

    // 2. Dynamic Cable Cylinder (stretches from carriage down to claw hub)
    const cableGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 8);
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      roughness: 0.6,
      metalness: 0.5,
    });
    this.cableMesh = new THREE.Mesh(cableGeo, cableMat);
    this.cableMesh.position.set(0, 3.4, 0);
    this.scene.add(this.cableMesh);

    // 3. Claw Hub (Gold housing with glowing LED ring and downward spotlight)
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.9,
    });
    const hubGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.18, 16);
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.castShadow = true;
    this.clawGroup.add(hubMesh);

    // LED ring on claw hub
    const ledRingGeo = new THREE.TorusGeometry(0.14, 0.02, 8, 24);
    const ledRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ledRing = new THREE.Mesh(ledRingGeo, ledRingMat);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.y = -0.05;
    this.clawGroup.add(ledRing);

    // Glowing optical emitter lens on bottom of hub
    const lensGeo = new THREE.CircleGeometry(0.1, 16);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.clawLensMesh = new THREE.Mesh(lensGeo, lensMat);
    this.clawLensMesh.rotation.x = Math.PI / 2;
    this.clawLensMesh.position.set(0, -0.09, 0);
    this.clawGroup.add(this.clawLensMesh);

    // Claw Spotlight pointing down to illuminate target doll
    this.clawSpotLight = new THREE.SpotLight(0x38bdf8, 6.0, 6.5, Math.PI / 4.2, 0.45, 1.0);
    this.clawSpotLight.position.set(0, -0.08, 0);
    this.clawSpotLight.castShadow = true;
    this.clawSpotLight.shadow.mapSize.width = 1024;
    this.clawSpotLight.shadow.mapSize.height = 1024;
    this.clawSpotLight.shadow.bias = -0.0001;
    this.clawSpotLight.shadow.camera.near = 0.1;
    this.clawSpotLight.shadow.camera.far = 4.5;
    this.clawSpotLight.target = this.clawSpotLightTarget;
    this.clawGroup.add(this.clawSpotLight);
    this.scene.add(this.clawSpotLightTarget);

    // 4. Three Articulated Curved Chrome Claw Arms
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      roughness: 0.2,
      metalness: 0.95,
    });

    const fingerAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
    fingerAngles.forEach((baseAngle) => {
      const pivot = new THREE.Group();
      pivot.position.set(Math.cos(baseAngle) * 0.12, -0.05, Math.sin(baseAngle) * 0.12);
      pivot.rotation.y = -baseAngle;

      // Upper arm
      const upperGeo = new THREE.BoxGeometry(0.03, 0.24, 0.04);
      const armUpper = new THREE.Mesh(upperGeo, chromeMat);
      armUpper.position.set(0, -0.11, 0);
      armUpper.castShadow = true;
      pivot.add(armUpper);

      // Lower hooked curved tip
      const lowerGeo = new THREE.BoxGeometry(0.025, 0.18, 0.04);
      const armLower = new THREE.Mesh(lowerGeo, chromeMat);
      armLower.position.set(0.04, -0.2, 0);
      armLower.rotation.z = -0.55;
      armLower.castShadow = true;
      pivot.add(armLower);

      this.clawGroup.add(pivot);
      this.clawFingers.push({ armUpper, armLower, baseAngle, pivot });
    });

    this.clawGroup.position.set(this.gantryPos.x, this.clawY, this.gantryPos.z);
    this.scene.add(this.clawGroup);

    // 5. Vertical Laser Aiming Beam (stretches from claw down to ground/doll surface)
    const laserGeo = new THREE.CylinderGeometry(0.008, 0.008, 1, 12);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    this.laserBeamMesh = new THREE.Mesh(laserGeo, laserMat);
    this.laserBeamMesh.position.set(this.gantryPos.x, 1.5, this.gantryPos.z);
    this.scene.add(this.laserBeamMesh);

    // 3D Volumetric Spotlight Cone Beam (stretches from claw down to dolls)
    const coneGeo = new THREE.CylinderGeometry(0.14, 0.48, 1, 24, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.spotlightConeMesh = new THREE.Mesh(coneGeo, coneMat);
    this.spotlightConeMesh.position.set(this.gantryPos.x, 1.5, this.gantryPos.z);
    this.scene.add(this.spotlightConeMesh);

    // 6. 3D High-Tech Aiming Reticle (outer ring + crosshair brackets)
    const ringGeo = new THREE.RingGeometry(0.22, 0.28, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    this.reticleOuterRing = new THREE.Mesh(ringGeo, ringMat);
    this.reticleOuterRing.rotation.x = -Math.PI / 2;
    this.aimingReticleGroup.add(this.reticleOuterRing);

    // Inner crosshair
    this.reticleCrosshair = new THREE.Group();
    const crossGeo = new THREE.BoxGeometry(0.02, 0.005, 0.32);
    const crossMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
    const crossZ = new THREE.Mesh(crossGeo, crossMat);
    const crossX = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.005, 0.02), crossMat);
    const centerDot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), crossMat);
    this.reticleCrosshair.add(crossZ, crossX, centerDot);
    this.aimingReticleGroup.add(this.reticleCrosshair);

    this.aimingReticleGroup.position.set(this.gantryPos.x, 0.02, this.gantryPos.z);
    this.scene.add(this.aimingReticleGroup);
  }

  private spawnFigurines() {
    this.figurines = [];

    // High-Density 3-Tier Mountain Heap Arcade Prize Pit (50 Dolls):
    // Tier 1: 30 base dolls in a staggered hexagonal dense lattice across the floor (Y = 0.0)
    // Tier 2: 14 mid dolls settled in the natural saddles/valleys of the base layer (Y = 0.42 - 0.48)
    // Tier 3: 6 summit dolls crowning the peak of the mountain heap (Y = 0.78 - 0.84)
    // Chute zone (X < -0.55 && Z > 0.45) is kept completely clear.
    const spawnPositions: { x: number; y: number; z: number; r: number }[] = [
      // === TIER 1: BASE FLOOR LAYER (Y = 0.0) - 30 Dolls ===
      // Row 1: Back row (Z = -0.85) - 6 dolls
      { x: -1.02, y: 0.0, z: -0.85, r: 0.20 },
      { x: -0.62, y: 0.0, z: -0.85, r: -0.30 },
      { x: -0.21, y: 0.0, z: -0.85, r: 0.40 },
      { x: 0.20,  y: 0.0, z: -0.85, r: -0.20 },
      { x: 0.61,  y: 0.0, z: -0.85, r: 0.30 },
      { x: 1.02,  y: 0.0, z: -0.85, r: -0.40 },

      // Row 2: Mid-back row (Z = -0.56) - 5 dolls
      { x: -0.82, y: 0.0, z: -0.56, r: 0.50 },
      { x: -0.41, y: 0.0, z: -0.56, r: -0.40 },
      { x: 0.00,  y: 0.0, z: -0.56, r: 0.20 },
      { x: 0.41,  y: 0.0, z: -0.56, r: -0.50 },
      { x: 0.82,  y: 0.0, z: -0.56, r: 0.10 },

      // Row 3: Center row (Z = -0.27) - 6 dolls
      { x: -1.01, y: 0.0, z: -0.27, r: -0.30 },
      { x: -0.61, y: 0.0, z: -0.27, r: 0.40 },
      { x: -0.20, y: 0.0, z: -0.27, r: -0.20 },
      { x: 0.20,  y: 0.0, z: -0.27, r: 0.50 },
      { x: 0.61,  y: 0.0, z: -0.27, r: -0.40 },
      { x: 1.01,  y: 0.0, z: -0.27, r: 0.30 },

      // Row 4: Mid-front row (Z = 0.02) - 5 dolls
      { x: -0.80, y: 0.0, z: 0.02,  r: 0.30 },
      { x: -0.40, y: 0.0, z: 0.02,  r: -0.30 },
      { x: 0.01,  y: 0.0, z: 0.02,  r: 0.40 },
      { x: 0.41,  y: 0.0, z: 0.02,  r: -0.20 },
      { x: 0.82,  y: 0.0, z: 0.02,  r: 0.40 },

      // Row 5: Front-center/right row (Z = 0.32) - 4 dolls (clear of chute)
      { x: -0.40, y: 0.0, z: 0.32,  r: 0.20 },
      { x: 0.02,  y: 0.0, z: 0.32,  r: -0.40 },
      { x: 0.44,  y: 0.0, z: 0.32,  r: 0.30 },
      { x: 0.86,  y: 0.0, z: 0.32,  r: -0.30 },

      // Row 6: Front-right row (Z = 0.62) - 3 dolls (clear of chute)
      { x: 0.05,  y: 0.0, z: 0.62,  r: 0.40 },
      { x: 0.48,  y: 0.0, z: 0.62,  r: -0.20 },
      { x: 0.90,  y: 0.0, z: 0.62,  r: 0.30 },

      // Row 7: Front-most right corner (Z = 0.92) - 1 doll
      { x: 0.65,  y: 0.0, z: 0.92,  r: -0.30 },

      // === TIER 2: MID-MOUNTAIN TIER (Y = 0.42 - 0.48) - 14 Dolls ===
      // Resting naturally in the saddle depressions between lower dolls
      { x: -0.82, y: 0.43, z: -0.71, r: 0.30 },
      { x: -0.41, y: 0.45, z: -0.71, r: -0.40 },
      { x: 0.00,  y: 0.44, z: -0.71, r: 0.20 },
      { x: 0.41,  y: 0.45, z: -0.71, r: -0.30 },
      { x: 0.82,  y: 0.43, z: -0.71, r: 0.40 },

      { x: -0.61, y: 0.45, z: -0.42, r: 0.50 },
      { x: -0.20, y: 0.46, z: -0.42, r: -0.20 },
      { x: 0.21,  y: 0.47, z: -0.42, r: 0.40 },
      { x: 0.62,  y: 0.45, z: -0.42, r: -0.50 },

      { x: -0.40, y: 0.46, z: -0.13, r: 0.20 },
      { x: 0.01,  y: 0.48, z: -0.13, r: -0.40 },
      { x: 0.42,  y: 0.46, z: -0.13, r: 0.30 },

      { x: 0.02,  y: 0.45, z: 0.18,  r: 0.40 },
      { x: 0.45,  y: 0.43, z: 0.18,  r: -0.30 },

      // === TIER 3: SUMMIT PEAK TIER (Y = 0.78 - 0.84) - 6 Dolls ===
      // Crowning peak of the heap, prominent under the overhead spotlights
      { x: -0.41, y: 0.80, z: -0.56, r: 0.35 },
      { x: 0.00,  y: 0.84, z: -0.56, r: -0.25 },
      { x: 0.41,  y: 0.80, z: -0.56, r: 0.40 },
      { x: -0.20, y: 0.82, z: -0.28, r: -0.35 },
      { x: 0.21,  y: 0.83, z: -0.28, r: 0.25 },
      { x: 0.01,  y: 0.79, z: 0.02,  r: -0.40 },
    ];

    spawnPositions.forEach((posData, idx) => {
      const meta = PRIZES[idx % PRIZES.length];
      const mesh = createFigurine(meta);
      const pos = new THREE.Vector3(posData.x, posData.y, posData.z);

      mesh.position.copy(pos);
      mesh.rotation.y = posData.r;
      // Slight natural organic tilt for casual arcade plush feel
      mesh.rotation.z = (Math.random() - 0.5) * 0.08;
      this.scene.add(mesh);

      this.figurines.push({
        id: `${meta.id}_${idx}`,
        metadata: meta,
        mesh,
        initialPos: pos.clone(),
        position: pos.clone(),
        rotation: mesh.rotation.clone(),
        velocity: new THREE.Vector3(),
        radius: 0.36,
        isGripped: false,
        isWon: false,
      });
    });
  }

  // --- Controls & Gameplay State Machine ---

  public setInput(x: number, z: number) {
    this.inputVector.x = Math.max(-1, Math.min(1, x));
    this.inputVector.z = Math.max(-1, Math.min(1, z));
  }


  public dropClaw(): boolean {
    if (this.state !== 'IDLE' && this.state !== 'MOVING') {
      return false;
    }
    this.state = 'DROPPING';
    this.callbacks.onStateChange(this.state);
    sound.playDrop();
    this.spatialAudio.playClawDrop();
    return true;
  }

  public setCameraAngle(angle: CameraAngle) {
    this.currentCameraAngle = angle;
    this.callbacks.onCameraAngleChange?.(angle);

    if (angle === 'FREE') {
      this.isAnimatingCamera = false;
      return;
    }

    this.isAnimatingCamera = true;
    switch (angle) {
      case 'FRONT':
        // Front view comfortably frames entire cabinet from bottom floor to gantry & resting claw
        this.targetCamPos.set(0, 2.3, 5.1);
        this.targetCamLookAt.set(0, 1.85, 0);
        break;
      case 'ISOMETRIC':
        // 45 degree isometric perspective gives immediate, crystal-clear 3D depth perception!
        this.targetCamPos.set(2.7, 3.1, 3.7);
        this.targetCamLookAt.set(0, 1.7, 0);
        break;
      case 'TOP_DOWN':
        // Top-down overhead view for precise (X, Z) coordinate alignment
        this.targetCamPos.set(0, 5.5, 0.3);
        this.targetCamLookAt.set(0, 1.0, 0);
        break;
      case 'SIDE':
        // Side glass view for inspecting front-to-back depth
        this.targetCamPos.set(4.6, 2.4, 0.0);
        this.targetCamLookAt.set(0, 1.8, 0);
        break;
      case 'CLOSE_UP':
        // Close-up follow camera focused right on the claw
        this.targetCamPos.set(this.gantryPos.x + 0.6, this.clawY + 0.5, this.gantryPos.z + 1.6);
        this.targetCamLookAt.set(this.gantryPos.x, this.clawY - 0.2, this.gantryPos.z);
        break;
    }
  }

  // --- Animation and Physics Update ---

  private animate = () => {
    if (this.isDestroyed) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.updateGameLogic(dt);
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private updateGameLogic(dt: number) {
    const moveSpeed = 1.35;

    // 1. Moving state
    if (this.state === 'IDLE' || this.state === 'MOVING') {
      const isMoving = Math.abs(this.inputVector.x) > 0.05 || Math.abs(this.inputVector.z) > 0.05;
      if (isMoving) {
        this.gantryPos.x += this.inputVector.x * moveSpeed * dt;
        this.gantryPos.z += this.inputVector.z * moveSpeed * dt;

        // Clamp to limits
        this.gantryPos.x = THREE.MathUtils.clamp(this.gantryPos.x, this.X_MIN, this.X_MAX);
        this.gantryPos.z = THREE.MathUtils.clamp(this.gantryPos.z, this.Z_MIN, this.Z_MAX);

        this.callbacks.onClawPositionChange?.(this.getClawNormalizedCoords());

        if (this.state === 'IDLE') {
          this.state = 'MOVING';
          this.callbacks.onStateChange(this.state);
        }
        if (Math.random() < 0.2) {
          sound.playMove();
        }
      } else if (this.state === 'MOVING') {
        this.state = 'IDLE';
        this.callbacks.onStateChange(this.state);
      }
      this.targetClawOpenness = 0.2; // slightly loose resting claw
    }

    // 2. Dropping state
    else if (this.state === 'DROPPING') {
      this.targetClawOpenness = 1.0; // wide open while descending
      const dropSpeed = 1.7;
      this.clawY -= dropSpeed * dt;

      // Check collision with floor or figurine tops
      let reachedBottom = this.clawY <= this.CLAW_BOTTOM_LIMIT;
      for (const fig of this.figurines) {
        if (fig.isWon) continue;
        const dx = this.gantryPos.x - fig.position.x;
        const dz = this.gantryPos.z - fig.position.z;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        if (distXZ < fig.radius * 0.95 && this.clawY <= fig.position.y + 0.65) {
          reachedBottom = true;
          break;
        }
      }

      if (reachedBottom) {
        this.state = 'GRABBING';
        this.callbacks.onStateChange(this.state);
        sound.playClamp();
        this.spatialAudio.playClawGrab();
      }
    }

    // 3. Grabbing state
    else if (this.state === 'GRABBING') {
      this.targetClawOpenness = 0.0; // clamp shut
      if (this.clawOpenness < 0.15) {
        // Evaluate prize grip
        this.evaluateGrip();
        this.state = 'ASCENDING';
        this.callbacks.onStateChange(this.state);
        sound.playMotorAscend();
        this.spatialAudio.playClawAscend();
      }
    }

    // 4. Ascending state
    else if (this.state === 'ASCENDING') {
      const ascendSpeed = 1.4;
      this.clawY += ascendSpeed * dt;

      // Update gripped prize position
      if (this.grippedFigurine) {
        this.grippedFigurine.position.set(this.gantryPos.x, this.clawY - 0.35, this.gantryPos.z);
        this.grippedFigurine.mesh.position.copy(this.grippedFigurine.position);

        // Small wobble slippage chance if off-center
        const dx = this.gantryPos.x - this.grippedFigurine.initialPos.x;
        const dz = this.gantryPos.z - this.grippedFigurine.initialPos.z;
        const offset = Math.sqrt(dx * dx + dz * dz);
        if (offset > 0.28 && Math.random() < 0.006 && this.clawY < 2.5) {
          // Slip off!
          this.grippedFigurine.isGripped = false;
          this.grippedFigurine = null;
          sound.playMiss();
          this.spatialAudio.playClawSlip();
        }
      }

      if (this.clawY >= this.CLAW_TOP_Y) {
        this.clawY = this.CLAW_TOP_Y;
        this.state = 'RETURNING';
        this.callbacks.onStateChange(this.state);
      }
    }

    // 5. Returning to Chute
    else if (this.state === 'RETURNING') {
      const returnSpeed = 1.3;
      const dx = this.CHUTE_DROP_X - this.gantryPos.x;
      const dz = this.CHUTE_DROP_Z - this.gantryPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.03) {
        this.gantryPos.x += (dx / dist) * returnSpeed * dt;
        this.gantryPos.z += (dz / dist) * returnSpeed * dt;
        if (this.grippedFigurine) {
          this.grippedFigurine.position.set(this.gantryPos.x, this.clawY - 0.35, this.gantryPos.z);
          this.grippedFigurine.mesh.position.copy(this.grippedFigurine.position);
        }
      } else {
        this.gantryPos.x = this.CHUTE_DROP_X;
        this.gantryPos.z = this.CHUTE_DROP_Z;
        this.state = 'RELEASING';
        this.callbacks.onStateChange(this.state);
        sound.playRelease();
        this.spatialAudio.playClawRelease();
      }
    }

    // 6. Releasing
    else if (this.state === 'RELEASING') {
      this.targetClawOpenness = 1.0; // Open claw to release
      if (this.clawOpenness > 0.7) {
        if (this.grippedFigurine) {
          // Prize drops down into chute!
          const wonPrize = this.grippedFigurine;
          wonPrize.isGripped = false;
          wonPrize.isWon = true;
          this.grippedFigurine = null;

          // Animate falling down chute
          this.animatePrizeDrop(wonPrize);

          this.state = 'WIN';
          this.callbacks.onStateChange(this.state);
          this.callbacks.onPrizeWon(wonPrize.metadata);
          sound.playWin();
          this.spatialAudio.playPrizeWonAndChuteDrop();

          // After short celebration drop animation, return to IDLE so the player can continue playing immediately!
          setTimeout(() => {
            if (!this.isDestroyed) {
              this.state = 'IDLE';
              this.callbacks.onStateChange(this.state);
            }
          }, 1500);
        } else {
          // Missed
          this.state = 'IDLE';
          this.callbacks.onStateChange(this.state);
          this.callbacks.onDropMiss();
          sound.playMiss();
        }
      }
    }

    // Update claw fingers rotation
    this.clawOpenness += (this.targetClawOpenness - this.clawOpenness) * Math.min(dt * 8, 1);
    this.clawFingers.forEach((finger) => {
      const rot = (this.clawOpenness - 0.5) * 0.75;
      finger.pivot.rotation.z = rot;
    });

    // Update Gantry Carriage, Claw position, and dynamic cable
    this.gantryCarriage.position.set(this.gantryPos.x, 3.75, this.gantryPos.z);
    this.clawGroup.position.set(this.gantryPos.x, this.clawY, this.gantryPos.z);

    const cableLength = 3.75 - this.clawY;
    this.cableMesh.scale.y = Math.max(0.01, cableLength);
    this.cableMesh.position.set(this.gantryPos.x, 3.75 - cableLength / 2, this.gantryPos.z);

    // Update 3D Aiming Laser Beam & Surface Reticle with Dynamic Surface Snapping
    this.updateAimingGuidance(dt);

    // Animate idle un-gripped figurines
    this.updateFigurinePhysics(dt);
  }

  private updateAimingGuidance(dt: number) {
    // 1. Detect target surface under the claw (floor vs doll top)
    let closestFig: FigurineInstance | null = null;
    let closestDist = 0.42;

    for (const fig of this.figurines) {
      if (fig.isWon || fig.isGripped) continue;
      const dx = this.gantryPos.x - fig.position.x;
      const dz = this.gantryPos.z - fig.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.42) {
        // Prioritize higher-elevation dolls if multiple dolls are within aiming radius
        if (
          !closestFig ||
          fig.position.y > closestFig.position.y + 0.15 ||
          (Math.abs(fig.position.y - closestFig.position.y) <= 0.15 && dist < closestDist)
        ) {
          closestDist = dist;
          closestFig = fig;
        }
      }
    }

    // Target surface height
    const targetSurfaceY = closestFig ? closestFig.position.y + 0.62 : 0.02;

    // Laser beam stretches from claw hub down to target surface
    const laserLength = Math.max(0.05, this.clawY - 0.15 - targetSurfaceY);
    this.laserBeamMesh.scale.y = laserLength;
    this.laserBeamMesh.position.set(
      this.gantryPos.x,
      targetSurfaceY + laserLength / 2,
      this.gantryPos.z
    );

    // 3D Volumetric Spotlight Cone follows claw descent and stretches down to target dolls
    const coneLength = Math.max(0.05, this.clawY - 0.1 - targetSurfaceY);
    this.spotlightConeMesh.scale.set(1, coneLength, 1);
    this.spotlightConeMesh.position.set(
      this.gantryPos.x,
      targetSurfaceY + coneLength / 2,
      this.gantryPos.z
    );

    // Reticle position on top of the surface
    this.aimingReticleGroup.position.set(this.gantryPos.x, targetSurfaceY + 0.01, this.gantryPos.z);

    // Animated reticle rotation
    this.reticleOuterRing.rotation.z += dt * 1.2;
    this.reticleCrosshair.rotation.y -= dt * 0.8;

    // Reticle visual cue: Bright Green if locked on, Cyan if seeking, Gold on Win/Gripped
    const isLocked = !!closestFig;
    let targetColor = isLocked ? 0x22c55e : 0x38bdf8;
    if (this.state === 'WIN' || this.grippedFigurine) {
      targetColor = 0xfbbf24;
    }

    (this.reticleOuterRing.material as THREE.MeshBasicMaterial).color.setHex(targetColor);
    (this.laserBeamMesh.material as THREE.MeshBasicMaterial).color.setHex(targetColor);
    (this.spotlightConeMesh.material as THREE.MeshBasicMaterial).color.setHex(targetColor);
    (this.clawLensMesh.material as THREE.MeshBasicMaterial).color.setHex(targetColor);
    this.clawSpotLight.color.setHex(targetColor);

    // Dynamic Spotlight Target & Intensity tracking Claw Descent
    this.clawSpotLightTarget.position.set(this.gantryPos.x, targetSurfaceY, this.gantryPos.z);
    this.clawSpotLightTarget.updateMatrixWorld();

    // Overhead gantry follow spotlight: follows carriage horizontally and tracks claw vertically
    this.gantryFollowSpot.position.set(this.gantryPos.x, 3.82, this.gantryPos.z);
    this.gantryFollowSpotTarget.position.set(this.gantryPos.x, this.clawY, this.gantryPos.z);
    this.gantryFollowSpotTarget.updateMatrixWorld();

    // Spotlight beam dynamic focus & intensity during descent
    const coneMat = this.spotlightConeMesh.material as THREE.MeshBasicMaterial;
    if (this.state === 'DROPPING') {
      this.clawSpotLight.intensity = 8.5;
      this.clawSpotLight.angle = Math.PI / 4.6;
      coneMat.opacity = 0.28;
    } else if (this.state === 'GRABBING') {
      this.clawSpotLight.intensity = 9.5;
      this.clawSpotLight.angle = Math.PI / 5.0;
      coneMat.opacity = 0.35;
    } else {
      this.clawSpotLight.intensity = 6.0;
      this.clawSpotLight.angle = Math.PI / 4.2;
      coneMat.opacity = 0.18;
    }

    // Notify lock change if status changed
    const newLockedMeta = closestFig ? closestFig.metadata : null;
    if (this.lockedPrize?.id !== newLockedMeta?.id) {
      this.lockedPrize = newLockedMeta;
      this.callbacks.onTargetLockChange?.(newLockedMeta);
    }
  }

  private evaluateGrip() {
    let bestCandidate: FigurineInstance | null = null;
    let minDistance = 0.44; // Catch radius tolerance

    for (const fig of this.figurines) {
      if (fig.isWon) continue;
      const dx = this.gantryPos.x - fig.position.x;
      const dz = this.gantryPos.z - fig.position.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);

      // The doll's body center is around fig.position.y + 0.28m,
      // and the closed claw fingers grip at this.clawY - 0.35m.
      const dollCenterY = fig.position.y + 0.28;
      const clawCenterY = this.clawY - 0.35;
      const dy = Math.abs(clawCenterY - dollCenterY);
      const dist3D = Math.sqrt(dx * dx + dy * dy * 0.7 + dz * dz);

      // Higher-tier dolls (Y > 0.4) on the surface of the heap are naturally more accessible to claw fingers
      const heightBonus = (fig.position.y / 0.84) * 0.05;
      const effectiveDist = dist3D - heightBonus;

      if (distXZ < 0.44 && effectiveDist < minDistance) {
        minDistance = effectiveDist;
        bestCandidate = fig;
      }
    }

    if (bestCandidate) {
      this.grippedFigurine = bestCandidate;
      bestCandidate.isGripped = true;
    }
  }

  private animatePrizeDrop(fig: FigurineInstance) {
    let t = 0;
    const dropAnim = () => {
      t += 0.04;
      fig.position.y -= 0.08;
      fig.mesh.position.copy(fig.position);
      fig.mesh.rotation.x += 0.1;
      fig.mesh.rotation.y += 0.08;

      if (fig.position.y > -0.6) {
        requestAnimationFrame(dropAnim);
      } else {
        // Prize retrieved - hide or respawn back into pit
        fig.mesh.visible = false;
        setTimeout(() => {
          this.respawnFigurine(fig);
        }, 2500);
      }
    };
    dropAnim();
  }

  private respawnFigurine(fig: FigurineInstance) {
    fig.isWon = false;
    // Seamlessly restore figurine back to its clean 3-tier mountain position
    fig.position.copy(fig.initialPos);
    fig.mesh.position.copy(fig.position);
    fig.mesh.rotation.copy(fig.rotation);
    fig.mesh.visible = true;
  }

  private updateFigurinePhysics(dt: number) {
    for (const fig of this.figurines) {
      if (fig.isGripped || fig.isWon) continue;
      const targetBaseY = fig.initialPos.y;
      if (fig.position.y > targetBaseY + 0.01) {
        fig.velocity.y -= 9.8 * dt;
        fig.position.y += fig.velocity.y * dt;
        if (fig.position.y <= targetBaseY) {
          fig.position.y = targetBaseY;
          fig.velocity.y = 0;
        }
        fig.mesh.position.copy(fig.position);
      }
    }
  }

  private updateCamera(dt: number) {
    if (this.currentCameraAngle === 'CLOSE_UP') {
      this.targetCamPos.set(this.gantryPos.x + 0.5, this.clawY + 0.5, this.gantryPos.z + 1.6);
      this.targetCamLookAt.set(this.gantryPos.x, this.clawY - 0.2, this.gantryPos.z);
      this.camera.position.lerp(this.targetCamPos, Math.min(dt * 5, 1));
      this.controls.target.lerp(this.targetCamLookAt, Math.min(dt * 5, 1));
      this.controls.update();
      return;
    }

    if (this.isAnimatingCamera && this.currentCameraAngle !== 'FREE') {
      this.camera.position.lerp(this.targetCamPos, Math.min(dt * 4.5, 1));
      this.controls.target.lerp(this.targetCamLookAt, Math.min(dt * 4.5, 1));
      if (this.camera.position.distanceTo(this.targetCamPos) < 0.05) {
        this.isAnimatingCamera = false;
      }
    }

    this.controls.update();
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public resetToIdle() {
    this.state = 'IDLE';
    this.callbacks.onStateChange(this.state);
  }

  // --- Coordinate & Radar Helpers for HUD ---

  public getClawNormalizedCoords() {
    // Maps X from [X_MIN, X_MAX] to [-1, 1], Z from [Z_MIN, Z_MAX] to [-1, 1]
    const normX = ((this.gantryPos.x - this.X_MIN) / (this.X_MAX - this.X_MIN)) * 2 - 1;
    const normZ = ((this.gantryPos.z - this.Z_MIN) / (this.Z_MAX - this.Z_MIN)) * 2 - 1;
    return {
      x: this.gantryPos.x,
      z: this.gantryPos.z,
      normX,
      normZ,
    };
  }

  public getFigurinesSummary() {
    return this.figurines.map((f) => {
      const normX = ((f.position.x - this.X_MIN) / (this.X_MAX - this.X_MIN)) * 2 - 1;
      const normZ = ((f.position.z - this.Z_MIN) / (this.Z_MAX - this.Z_MIN)) * 2 - 1;
      return {
        id: f.id,
        name: f.metadata.name,
        color: f.metadata.accentColor,
        x: f.position.x,
        z: f.position.z,
        normX,
        normZ,
        isWon: f.isWon,
      };
    });
  }

  public getLockedPrize(): PrizeMetadata | null {
    return this.lockedPrize;
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.spatialAudio.destroy();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
