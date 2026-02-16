import * as THREE from 'three';
import { DEFAULT_MAX_ACTIVE_FIREWORKS, DEFAULT_MAX_PARTICLES } from '../constants';
import type { FireworkEngineOptions, FireworkLaunchPayload } from '../types';
import { createCircularSpriteTexture } from '../utils/textureFactory';
import { createSeedParticles } from './emitters';
import { ParticlePool, type ParticleState } from './particlePool';
import { evaluateDegradePolicy } from './postfx';

interface Burst {
  id: string;
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  positions: Float32Array;
  colors: Float32Array;
  particles: ParticleState[];
}

interface FireworksEngineInit {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  options?: FireworkEngineOptions;
}

export class FireworksEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement;
  private readonly pool = new ParticlePool();
  private readonly bursts: Burst[] = [];
  private readonly maxParticles: number;
  private readonly maxActiveFireworks: number;
  private readonly onError?: (error: Error) => void;
  private readonly onFpsReport?: (fps: number) => void;

  private animationFrameId: number | null = null;
  private lastTick = 0;
  private fpsWindow = { frames: 0, elapsed: 0, fps: 60, particleScale: 1 };

  private resizeObserver: ResizeObserver | null = null;
  private spriteTexture: THREE.Texture;

  constructor(init: FireworksEngineInit) {
    this.canvas = init.canvas;
    this.container = init.container;
    this.maxParticles = init.options?.maxParticles ?? DEFAULT_MAX_PARTICLES;
    this.maxActiveFireworks = init.options?.maxActiveFireworks ?? DEFAULT_MAX_ACTIVE_FIREWORKS;
    this.onError = init.options?.onError;
    this.onFpsReport = init.options?.onFpsReport;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#060816');

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 45);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.spriteTexture = createCircularSpriteTexture();

    this.attachResizeObserver();
    this.resize();
  }

  start(): void {
    if (this.animationFrameId != null) {
      return;
    }
    this.lastTick = window.performance.now();
    this.loop();
  }

  stop(): void {
    if (this.animationFrameId != null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  async launch(payload: FireworkLaunchPayload): Promise<void> {
    try {
      this.enforceBurstCap();

      const particleBudget = Math.max(80, Math.floor(280 * this.fpsWindow.particleScale));
      const seeds = await createSeedParticles({
        kind: payload.kind,
        count: particleBudget,
        color: payload.color,
        avatarUrl: payload.avatarUrl,
      });

      if (seeds.length === 0) {
        return;
      }

      const launchPosition = payload.position ?? {
        x: (Math.random() - 0.5) * 18,
        y: -4 + Math.random() * 12,
        z: (Math.random() - 0.5) * 4,
      };

      const particles: ParticleState[] = [];
      const positions = new Float32Array(seeds.length * 3);
      const colors = new Float32Array(seeds.length * 3);

      const colorHelper = new THREE.Color();
      for (let i = 0; i < seeds.length; i += 1) {
        const seed = seeds[i];
        if (!seed) {
          continue;
        }
        const particle = this.pool.acquire();
        particle.x = launchPosition.x + seed.x;
        particle.y = launchPosition.y + seed.y;
        particle.z = launchPosition.z + seed.z;
        particle.vx = seed.vx;
        particle.vy = seed.vy;
        particle.vz = seed.vz;
        particle.life = seed.life;
        particle.maxLife = seed.life;

        colorHelper.set(seed.color);
        particle.r = colorHelper.r;
        particle.g = colorHelper.g;
        particle.b = colorHelper.b;

        particles.push(particle);

        const offset = i * 3;
        positions[offset] = particle.x;
        positions[offset + 1] = particle.y;
        positions[offset + 2] = particle.z;
        colors[offset] = particle.r;
        colors[offset + 1] = particle.g;
        colors[offset + 2] = particle.b;
      }

      if (this.totalParticleCount() + particles.length > this.maxParticles) {
        this.releaseParticles(particles);
        return;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: payload.kind === 'miku' ? 0.42 : 0.36,
        vertexColors: true,
        map: this.spriteTexture,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      this.scene.add(points);

      const burst: Burst = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        points,
        geometry,
        material,
        positions,
        colors,
        particles,
      };

      this.bursts.push(burst);
    } catch (error) {
      this.onError?.(error instanceof Error ? error : new Error('Failed to launch firework.'));
    }
  }

  dispose(): void {
    this.stop();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    for (const burst of this.bursts) {
      this.destroyBurst(burst);
    }
    this.bursts.length = 0;

    this.spriteTexture.dispose();
    this.renderer.dispose();
  }

  private loop = (): void => {
    const now = window.performance.now();
    const dt = Math.min((now - this.lastTick) / 1000, 0.05);
    this.lastTick = now;

    this.update(dt);
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = window.requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const gravity = -8.8;

    for (let b = this.bursts.length - 1; b >= 0; b -= 1) {
      const burst = this.bursts[b];
      if (!burst) {
        continue;
      }

      let alive = 0;
      for (let i = 0; i < burst.particles.length; i += 1) {
        const particle = burst.particles[i];
        if (!particle) {
          continue;
        }

        particle.life -= dt;
        if (particle.life <= 0) {
          continue;
        }

        particle.vx *= 0.992;
        particle.vy = particle.vy * 0.992 + gravity * dt;
        particle.vz *= 0.992;

        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.z += particle.vz * dt;

        const idx = i * 3;
        burst.positions[idx] = particle.x;
        burst.positions[idx + 1] = particle.y;
        burst.positions[idx + 2] = particle.z;

        const alpha = Math.max(particle.life / particle.maxLife, 0);
        burst.colors[idx] = particle.r * alpha;
        burst.colors[idx + 1] = particle.g * alpha;
        burst.colors[idx + 2] = particle.b * alpha;

        alive += 1;
      }

      const positionAttr = burst.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colorAttr = burst.geometry.getAttribute('color') as THREE.BufferAttribute;
      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      burst.material.opacity = Math.min(1, 0.22 + alive / Math.max(burst.particles.length, 1));

      if (alive === 0) {
        this.bursts.splice(b, 1);
        this.destroyBurst(burst);
      }
    }

    this.updateFpsStats(dt);
  }

  private updateFpsStats(dt: number): void {
    this.fpsWindow.frames += 1;
    this.fpsWindow.elapsed += dt;

    if (this.fpsWindow.elapsed < 0.6) {
      return;
    }

    const fps = this.fpsWindow.frames / this.fpsWindow.elapsed;
    this.fpsWindow.fps = fps;

    const policy = evaluateDegradePolicy(fps);
    this.fpsWindow.particleScale = policy.recommendedParticleScale;

    this.onFpsReport?.(Math.round(fps));

    this.fpsWindow.frames = 0;
    this.fpsWindow.elapsed = 0;
  }

  private totalParticleCount(): number {
    return this.bursts.reduce((sum, burst) => sum + burst.particles.length, 0);
  }

  private enforceBurstCap(): void {
    while (this.bursts.length >= this.maxActiveFireworks) {
      const burst = this.bursts.shift();
      if (!burst) {
        break;
      }
      this.destroyBurst(burst);
    }
  }

  private destroyBurst(burst: Burst): void {
    this.scene.remove(burst.points);
    burst.geometry.dispose();
    burst.material.dispose();
    this.releaseParticles(burst.particles);
  }

  private releaseParticles(particles: ParticleState[]): void {
    for (const particle of particles) {
      this.pool.release(particle);
    }
  }

  private attachResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}
