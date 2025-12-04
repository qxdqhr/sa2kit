import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { loadAmmo } from '../utils/ammo-loader';
import { MMDPlayerBaseProps, MMDPlayerBaseRef } from '../types';

export const MMDPlayerBase = forwardRef<MMDPlayerBaseRef, MMDPlayerBaseProps>((props, ref) => {
  const {
    resources,
    stage = {},
    mobileOptimization = { enabled: true },
    autoPlay = false,
    loop = true,
    volume = 1.0,
    muted = false,
    onLoad,
    onLoadProgress,
    onError,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    className,
    style,
  } = props;

  // 容器 Ref
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js 对象 Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const helperRef = useRef<any>(null); // MMDAnimationHelper
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  // 状态 Refs
  const isReadyRef = useRef(false);
  const isPlayingRef = useRef(false);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    play: () => {
      if (!isReadyRef.current || isPlayingRef.current) return;
      isPlayingRef.current = true;
      onPlay?.();
    },
    pause: () => {
      if (!isPlayingRef.current) return;
      isPlayingRef.current = false;
      onPause?.();
    },
    stop: () => {
      isPlayingRef.current = false;
      // TODO: Reset logic
      onPause?.();
    },
    seek: (time: number) => {
      // TODO: Seek logic
    },
    getCurrentTime: () => 0, // TODO
    getDuration: () => 0, // TODO
    isPlaying: () => isPlayingRef.current,
    snapshot: () => {
      if (!rendererRef.current) return '';
      return rendererRef.current.domElement.toDataURL('image/png');
    }
  }));

  // 初始化 Effect
  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      try {
        // 1. 物理引擎加载
        if (stage.enablePhysics !== false && !mobileOptimization.disablePhysics) {
          await loadAmmo(stage.physicsPath);
        }

        // 2. 场景初始化
        const container = containerRef.current!;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        if (stage.backgroundColor) {
          scene.background = new THREE.Color(stage.backgroundColor);
        }
        // TODO: Support backgroundImage
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
        if (stage.cameraPosition) {
           // handle Vector3 or object
           const pos = stage.cameraPosition as any;
           camera.position.set(pos.x, pos.y, pos.z);
        } else {
           camera.position.set(0, 20, 30);
        }
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ 
          antialias: !mobileOptimization.enabled, 
          alpha: true,
          preserveDrawingBuffer: true // for snapshot
        });
        renderer.setSize(width, height);
        
        // Pixel Ratio
        const pixelRatio = mobileOptimization.enabled && mobileOptimization.pixelRatio 
          ? mobileOptimization.pixelRatio 
          : window.devicePixelRatio;
        renderer.setPixelRatio(pixelRatio);

        // Shadow
        if (stage.enableShadow !== false && !mobileOptimization.reduceShadowQuality) {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, stage.ambientLightIntensity ?? 0.5);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, stage.directionalLightIntensity ?? 0.8);
        dirLight.position.set(10, 20, 10);
        if (stage.enableShadow !== false) {
          dirLight.castShadow = true;
          dirLight.shadow.mapSize.width = mobileOptimization.enabled ? 1024 : 2048;
          dirLight.shadow.mapSize.height = mobileOptimization.enabled ? 1024 : 2048;
          dirLight.shadow.bias = -0.0001;
        }
        scene.add(dirLight);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 10;
        controls.maxDistance = 100;
        if (stage.cameraTarget) {
          const target = stage.cameraTarget as any;
          controls.target.set(target.x, target.y, target.z);
        } else {
          controls.target.set(0, 10, 0);
        }
        controls.update();
        controlsRef.current = controls;

        // Resize Observer
        const onResize = () => {
          if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          
          rendererRef.current.setSize(w, h);
        };
        
        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(container);
        resizeObserverRef.current = resizeObserver;

        // 3. 资源加载
        // TODO: Load Model, Motion, Audio

        isReadyRef.current = true;
        onLoad?.();
        
        if (autoPlay) {
          isPlayingRef.current = true;
          onPlay?.();
        }

        // 4. 开始渲染循环
        animate();

      } catch (error) {
        console.error('MMDPlayerBase initialization failed:', error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    init();

    return () => {
      // 清理逻辑
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      // 移除 ResizeObserver
      resizeObserverRef.current?.disconnect();
      
      // 移除 DOM
      if (rendererRef.current?.domElement && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // 释放 Controls
      controlsRef.current?.dispose();
      
      // 释放 Renderer
      rendererRef.current?.dispose();
      
      // 释放场景资源 (将在单独的任务中完善)
      // TODO: Dispose Three.js objects deeply
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在挂载时执行一次，资源变更通过另一个 useEffect 处理

  // 渲染循环
  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      if (isPlayingRef.current && helperRef.current) {
        const delta = clockRef.current.getDelta();
        // helperRef.current.update(delta);
      }
      
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        position: 'relative',
        backgroundColor: stage.backgroundColor || '#000',
        ...style 
      }}
    />
  );
});

MMDPlayerBase.displayName = 'MMDPlayerBase';

