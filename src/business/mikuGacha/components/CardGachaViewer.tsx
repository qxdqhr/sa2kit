'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CardDef, CardGachaViewerProps, GachaPhase } from '../types';
import { easeInOutCubic } from '../utils/ease';
import { loadTexture } from '../utils/loadTexture';

const CARD_W = 2;
const CARD_H = 3;
const TOTAL_TURNS = 2.5;
const DURATION_MS = 1800;

type SceneBundle = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cardGroup: THREE.Group;
  frontMat: THREE.MeshStandardMaterial;
  backMat: THREE.MeshStandardMaterial;
  rafId: number | null;
};

export const CardGachaViewer: React.FC<CardGachaViewerProps> = ({
  className,
  backUrl,
  targetCard,
  flipToken,
  onFlipComplete,
  onLoadError,
  onPhaseChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const bundleRef = useRef<SceneBundle | null>(null);
  const callbacksRef = useRef({ onFlipComplete, onLoadError, onPhaseChange });
  const animRef = useRef<{
    playing: boolean;
    startMs: number;
    startAngle: number;
    card: CardDef | null;
  }>({ playing: false, startMs: 0, startAngle: 0, card: null });
  const lastFlipTokenRef = useRef(0);

  useEffect(() => {
    callbacksRef.current = { onFlipComplete, onLoadError, onPhaseChange };
  }, [onFlipComplete, onLoadError, onPhaseChange]);

  const emitPhase = (phase: GachaPhase) => {
    callbacksRef.current.onPhaseChange?.(phase);
  };

  // Init Three scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2, 3, 4);
    scene.add(ambient, key);

    const cardGroup = new THREE.Group();
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H);

    const backMat = new THREE.MeshStandardMaterial({
      color: 0x222233,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.FrontSide,
    });
    const frontMat = new THREE.MeshStandardMaterial({
      color: 0x334455,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.FrontSide,
    });

    // Back faces +Z (camera). Front sits on -Z side, rotated so its front faces -Z at rest.
    const backMesh = new THREE.Mesh(geo, backMat);
    backMesh.position.z = 0.01;
    const frontMesh = new THREE.Mesh(geo.clone(), frontMat);
    frontMesh.rotation.y = Math.PI;
    frontMesh.position.z = -0.01;

    cardGroup.add(backMesh, frontMesh);
    scene.add(cardGroup);

    const bundle: SceneBundle = {
      renderer,
      scene,
      camera,
      cardGroup,
      frontMat,
      backMat,
      rafId: null,
    };
    bundleRef.current = bundle;

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const tick = () => {
      const anim = animRef.current;
      if (anim.playing) {
        const t = Math.min(1, (performance.now() - anim.startMs) / DURATION_MS);
        const eased = easeInOutCubic(t);
        cardGroup.rotation.y = anim.startAngle + TOTAL_TURNS * Math.PI * 2 * eased;
        if (t >= 1) {
          anim.playing = false;
          cardGroup.rotation.y = anim.startAngle + TOTAL_TURNS * Math.PI * 2;
          emitPhase('revealed');
          if (anim.card) {
            callbacksRef.current.onFlipComplete?.(anim.card);
          }
        }
      }
      renderer.render(scene, camera);
      bundle.rafId = requestAnimationFrame(tick);
    };
    bundle.rafId = requestAnimationFrame(tick);

    // Preload card back
    void loadTexture(backUrl)
      .then((tex) => {
        backMat.map = tex;
        backMat.color.set(0xffffff);
        backMat.needsUpdate = true;
      })
      .catch((err) => {
        callbacksRef.current.onLoadError?.(
          err instanceof Error ? err : new Error(String(err)),
        );
      });

    return () => {
      ro.disconnect();
      if (bundle.rafId != null) cancelAnimationFrame(bundle.rafId);
      geo.dispose();
      frontMat.dispose();
      backMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
      bundleRef.current = null;
    };
    // backUrl only for initial preload; token changes handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to idle (back facing) when target cleared
  useEffect(() => {
    const bundle = bundleRef.current;
    if (!bundle) return;
    if (targetCard == null) {
      animRef.current.playing = false;
      animRef.current.card = null;
      bundle.cardGroup.rotation.y = 0;
      emitPhase('idle');
    }
  }, [targetCard]);

  // Start flip when flipToken bumps with a target card
  useEffect(() => {
    if (!targetCard || flipToken === 0 || flipToken === lastFlipTokenRef.current) {
      return;
    }
    lastFlipTokenRef.current = flipToken;
    const bundle = bundleRef.current;
    if (!bundle || animRef.current.playing) return;

    let cancelled = false;
    emitPhase('loadingFace');

    void (async () => {
      try {
        const tex = await loadTexture(targetCard.faceUrl);
        if (cancelled || !bundleRef.current) return;
        bundle.frontMat.map = tex;
        bundle.frontMat.color.set(0xffffff);
        bundle.frontMat.needsUpdate = true;

        // Snap to back-facing before spin so each draw starts clean
        bundle.cardGroup.rotation.y = 0;
        animRef.current = {
          playing: true,
          startMs: performance.now(),
          startAngle: 0,
          card: targetCard,
        };
        emitPhase('flipping');
      } catch (err) {
        if (cancelled) return;
        emitPhase('idle');
        callbacksRef.current.onLoadError?.(
          err instanceof Error ? err : new Error(String(err)),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [flipToken, targetCard]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: '100%', height: '100%', minHeight: 280 }}
    />
  );
};

export default CardGachaViewer;
