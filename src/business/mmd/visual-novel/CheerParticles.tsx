import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { clsx } from 'clsx';

/**
 * 3D粒子彩花效果组件
 * 
 * 功能：
 * - 点击应援按钮触发粒子爆炸效果
 * - 彩色粒子从中心向外扩散
 * - 粒子受重力影响下落
 * - 自动清理完成的粒子
 */

export interface CheerParticlesRef {
  /** 触发一次粒子效果 */
  trigger: () => void;
  /** 清理所有粒子 */
  clear: () => void;
}

export interface CheerParticlesProps {
  /** 容器样式类名 */
  className?: string;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  initialScale: number;
}

export const CheerParticles = forwardRef<CheerParticlesRef, CheerParticlesProps>(
  ({ className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    // 初始化Three.js场景
    useEffect(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // 创建场景
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 创建正交相机（2D视角）
      const camera = new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        1,
        1000
      );
      camera.position.z = 100;
      cameraRef.current = camera;

      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 动画循环
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        updateParticles();
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();

      // 窗口大小调整
      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;

        cameraRef.current.left = -newWidth / 2;
        cameraRef.current.right = newWidth / 2;
        cameraRef.current.top = newHeight / 2;
        cameraRef.current.bottom = -newHeight / 2;
        cameraRef.current.updateProjectionMatrix();

        rendererRef.current.setSize(newWidth, newHeight);
      };
      window.addEventListener('resize', handleResize);

      // 清理
      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (rendererRef.current) {
          container.removeChild(rendererRef.current.domElement);
          rendererRef.current.dispose();
        }
        clearParticles();
      };
    }, []);

    // 创建单个粒子
    const createParticle = (
      position: THREE.Vector3,
      velocity: THREE.Vector3,
      color: number
    ): Particle => {
      // 创建粒子几何体 - 使用多种形状
      const shapes = [
        new THREE.SphereGeometry(8, 8, 8),
        new THREE.BoxGeometry(10, 10, 10),
        new THREE.ConeGeometry(5, 15, 6),
      ];
      const geometry = shapes[Math.floor(Math.random() * shapes.length)];
      
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);

      const initialScale = 1 + Math.random() * 0.5;
      mesh.scale.set(initialScale, initialScale, initialScale);

      return {
        mesh,
        velocity: velocity.clone(),
        acceleration: new THREE.Vector3(0, -500, 0), // 重力
        lifetime: 0,
        maxLifetime: 2 + Math.random() * 1, // 2-3秒
        initialScale,
      };
    };

    // 触发粒子爆炸
    const triggerParticles = () => {
      if (!sceneRef.current || !containerRef.current) return;

      const scene = sceneRef.current;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // 彩色方案
      const colors = [
        0xff69b4, // 粉红
        0xffd700, // 金黄
        0x00ffff, // 青色
        0xff1493, // 深粉
        0x9370db, // 紫色
        0xff6347, // 番茄红
        0x7fffd4, // 青绿色
        0xffa500, // 橙色
      ];

      // 创建100个粒子
      const particleCount = 100;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 200 + Math.random() * 300;
        const spreadZ = (Math.random() - 0.5) * 200;

        const velocity = new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed + Math.random() * 200,
          spreadZ
        );

        const color = colors[Math.floor(Math.random() * colors.length)] ?? 0xff69b4;
        const position = new THREE.Vector3(0, -height / 4, 0);

        const particle = createParticle(position, velocity, color);
        scene.add(particle.mesh);
        particlesRef.current.push(particle);
      }
    };

    // 更新粒子
    const updateParticles = () => {
      const deltaTime = 1 / 60; // 假设60fps
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        if (!particle) continue;
        
        // 更新生命周期
        particle.lifetime += deltaTime;
        
        // 移除过期粒子
        if (particle.lifetime >= particle.maxLifetime) {
          if (sceneRef.current) {
            sceneRef.current.remove(particle.mesh);
          }
          particle.mesh.geometry.dispose();
          (particle.mesh.material as THREE.Material).dispose();
          particles.splice(i, 1);
          continue;
        }

        // 更新速度和位置
        particle.velocity.add(
          particle.acceleration.clone().multiplyScalar(deltaTime)
        );
        particle.mesh.position.add(
          particle.velocity.clone().multiplyScalar(deltaTime)
        );

        // 添加旋转
        particle.mesh.rotation.x += deltaTime * 2;
        particle.mesh.rotation.y += deltaTime * 3;

        // 渐隐效果
        const progress = particle.lifetime / particle.maxLifetime;
        const opacity = Math.max(0, 1 - progress);
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;

        // 缩放效果
        const scale = particle.initialScale * (1 - progress * 0.5);
        particle.mesh.scale.set(scale, scale, scale);
      }
    };

    // 清理所有粒子
    const clearParticles = () => {
      const particles = particlesRef.current;
      particles.forEach((particle) => {
        if (sceneRef.current) {
          sceneRef.current.remove(particle.mesh);
        }
        particle.mesh.geometry.dispose();
        (particle.mesh.material as THREE.Material).dispose();
      });
      particlesRef.current = [];
    };

    // 暴露方法
    useImperativeHandle(ref, () => ({
      trigger: triggerParticles,
      clear: clearParticles,
    }));

    return (
      <div
        ref={containerRef}
        className={clsx('pointer-events-none absolute inset-0', className)}
        style={{ zIndex: 999998 }}
      />
    );
  }
);

CheerParticles.displayName = 'CheerParticles';

export default CheerParticles;

