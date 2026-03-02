'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface FestivalCard3DProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const createSnow = (count: number) => {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 16;
    positions[i3 + 1] = Math.random() * 10 + 1;
    positions[i3 + 2] = (Math.random() - 0.5) * 16;
    speeds[i] = 0.004 + Math.random() * 0.01;
  }

  return { positions, speeds };
};

export const FestivalCard3D: React.FC<FestivalCard3DProps> = ({
  title = 'Happy Holidays',
  subtitle = 'Wishing you joy and peace',
  className,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x081226, 12, 28);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 2.6, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x8ab4ff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(2, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x7ad7ff, 0.9, 24);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(12, 48),
      new THREE.MeshStandardMaterial({ color: 0x10203a, roughness: 0.95, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    scene.add(floor);

    const giftGroup = new THREE.Group();
    scene.add(giftGroup);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.6, 2),
      new THREE.MeshStandardMaterial({ color: 0xd94165, roughness: 0.55, metalness: 0.2 })
    );
    giftGroup.add(box);

    const ribbonMaterial = new THREE.MeshStandardMaterial({ color: 0xffd97a, roughness: 0.3, metalness: 0.5 });
    const verticalRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.7, 2.02), ribbonMaterial);
    const horizontalRibbon = new THREE.Mesh(new THREE.BoxGeometry(2.02, 1.7, 0.24), ribbonMaterial);
    giftGroup.add(verticalRibbon);
    giftGroup.add(horizontalRibbon);

    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.34, 2.15),
      new THREE.MeshStandardMaterial({ color: 0xcd3456, roughness: 0.52, metalness: 0.2 })
    );
    lid.position.y = 0.98;
    giftGroup.add(lid);

    const bowLeft = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.08, 12, 32), ribbonMaterial);
    bowLeft.rotation.set(Math.PI / 2, Math.PI / 6, 0);
    bowLeft.position.set(-0.22, 1.14, 0);
    const bowRight = bowLeft.clone();
    bowRight.rotation.y = -Math.PI / 6;
    bowRight.position.x = 0.22;
    giftGroup.add(bowLeft, bowRight);

    giftGroup.position.y = -0.15;

    const { positions, speeds } = createSnow(260);
    const snowGeometry = new THREE.BufferGeometry();
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const snow = new THREE.Points(
      snowGeometry,
      new THREE.PointsMaterial({
        color: 0xe8f4ff,
        size: 0.08,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      })
    );
    scene.add(snow);

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const pos = snowGeometry.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < pos.count; i++) {
        const speed = speeds[i] ?? 0.01;
        const y = pos.getY(i) - speed;
        pos.setY(i, y < -1.1 ? 10 + Math.random() * 2 : y);
        pos.setX(i, pos.getX(i) + Math.sin(elapsed + i * 0.04) * 0.0016);
      }
      pos.needsUpdate = true;

      giftGroup.rotation.y = elapsed * 0.35;
      giftGroup.position.y = -0.15 + Math.sin(elapsed * 1.4) * 0.08;
      lid.position.y = 0.98 + Math.sin(elapsed * 2.2) * 0.08;

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!mount) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });

      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 420,
        borderRadius: 20,
        overflow: 'hidden',
        background: 'radial-gradient(circle at 20% 20%, #244d8c 0%, #0c1a34 45%, #060d1f 100%)',
      }}
    >
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 35%, rgba(4,8,20,0.36) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 20,
          zIndex: 2,
          padding: '16px 18px',
          borderRadius: 14,
          backgroundColor: 'rgba(8, 16, 35, 0.66)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          color: '#f8fafc',
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
        <div style={{ marginTop: 6, fontSize: 15, opacity: 0.92 }}>{subtitle}</div>
      </div>
    </div>
  );
};
