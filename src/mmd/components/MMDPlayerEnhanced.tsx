'use client';

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls, MMDLoader, MMDAnimationHelper } from 'three-stdlib';
import type { MMDPlayerEnhancedProps } from '../types';
import { loadAmmo } from '../utils/ammo-loader';

export const MMDPlayerEnhanced = forwardRef<any, MMDPlayerEnhancedProps>(({
  resources,
  stage,
  autoPlay = false,
  loop = false,
  className = '',
  style,
  onLoad,
  onError,
  onAudioEnded,
  onAnimationEnded,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const objectURLs = useRef<string[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container) return;
    
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;

    const init = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000);
        camera.position.z = 30;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        
        const manager = new THREE.LoadingManager();
        const modelPath = resources?.modelPath;
        if (typeof modelPath === 'string') {
            const basePath = modelPath.substring(0, modelPath.lastIndexOf('/') + 1);
            manager.setURLModifier((url) => (url.startsWith('data:') ? url : basePath + url));
        }

        const loader = new MMDLoader(manager);
        const parser = (loader as any)._getParser();
        const helper = new MMDAnimationHelper();

        const mesh = await new Promise<THREE.SkinnedMesh>((resolve, reject) => {
          if (typeof modelPath === 'string') {
            loader.load(modelPath, resolve, undefined, reject);
          } else if (modelPath instanceof ArrayBuffer) {
            resolve(parser.parse(modelPath, ''));
          } else {
            reject(new Error('Invalid model resource'));
          }
        });
        scene.add(mesh);

        const { motionPath, cameraPath, audioPath } = resources || {};
        if (motionPath) {
          const vmd = await new Promise<any>((resolve, reject) => {
            if (typeof motionPath === 'string') {
              loader.loadAnimation(motionPath, mesh, resolve, undefined, reject);
            } else if (motionPath instanceof ArrayBuffer) {
              resolve(parser.parseVmd(motionPath, true));
            }
          });
          helper.add(mesh, { animation: vmd, physics: true });
        }

        if (cameraPath) {
            const cameraVmd = await new Promise<any>((resolve, reject) => {
              if (typeof cameraPath === 'string') {
                loader.loadAnimation(cameraPath, camera, resolve, undefined, reject);
              } else if (cameraPath instanceof ArrayBuffer) {
                resolve(parser.parseVmd(cameraPath, true));
              }
            });
            helper.add(camera, { animation: cameraVmd });
        }
        
        let audio: HTMLAudioElement | null = null;
        if (audioPath) {
            let audioUrl: string;
            if (typeof audioPath === 'string') {
                audioUrl = audioPath;
            } else if (audioPath instanceof ArrayBuffer) {
                const blob = new Blob([audioPath], { type: 'audio/mpeg' });
                audioUrl = URL.createObjectURL(blob);
                objectURLs.current.push(audioUrl);
            } else {
                audioUrl = '';
            }
            audio = new Audio(audioUrl);
            audio.onended = () => onAudioEnded?.();
        }

        if (isMounted) {
          setLoading(false);
          onLoad?.();
          if (autoPlay) {
            audio?.play();
          }
        }
        
        const clock = new THREE.Clock();
        const animate = () => {
          if (!isMounted) return;
          animationIdRef.current = requestAnimationFrame(animate);
          helper.update(clock.getDelta());
          renderer.render(scene, camera);
        };
        animate();

      } catch (err: any) {
        if (isMounted) onError?.(err);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (renderer) renderer.dispose();
      objectURLs.current.forEach(URL.revokeObjectURL);
    };
  }, [resources, stage, autoPlay, loop, onLoad, onError, onAudioEnded, onAnimationEnded]);

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`} style={style}>
      {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"><div className="text-white">Loading...</div></div>}
    </div>
  );
});

MMDPlayerEnhanced.displayName = 'MMDPlayerEnhanced';