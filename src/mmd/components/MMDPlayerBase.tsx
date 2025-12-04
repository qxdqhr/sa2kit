import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls, MMDLoader, MMDAnimationHelper } from 'three-stdlib';
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
      if (!isReadyRef.current) return;
      isPlayingRef.current = true;
      // 如果之前 paused，需要恢复 clock 吗？
      // Clock 只要运行着 getDelta 就会返回时间差。
      // 如果 paused 很久，getDelta 会很大？
      // 可以在 pause 时 stop clock，play 时 start。
      if (!clockRef.current.running) clockRef.current.start();
      onPlay?.();
    },
    pause: () => {
      if (!isPlayingRef.current) return;
      isPlayingRef.current = false;
      clockRef.current.stop();
      onPause?.();
    },
    stop: () => {
      isPlayingRef.current = false;
      clockRef.current.stop();
      // 重置逻辑比较复杂，暂时先不处理物理重置
      onPause?.();
    },
    seek: (time: number) => {
      // TODO: Implement robust seek
      // 目前 MMDAnimationHelper 不直接支持 seek，需要 hack
      console.warn('Seek not fully implemented in MMDPlayerBase yet');
    },
    getCurrentTime: () => {
       // 粗略返回
       return clockRef.current.elapsedTime;
    }, 
    getDuration: () => 0, // 需要从 animation clip 获取
    isPlaying: () => isPlayingRef.current,
    snapshot: () => {
      if (!rendererRef.current) return '';
      // 强制渲染一帧以确保画面最新
      if (sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
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
        const loader = new MMDLoader();
        const helper = new MMDAnimationHelper({
          afterglow: 2.0
        });
        helperRef.current = helper;

        // 3.1 加载模型和动作
        const loadModelPromise = new Promise<{ mesh: THREE.SkinnedMesh, animation?: THREE.AnimationClip }>((resolve, reject) => {
          // 如果有动作文件，使用 loadWithAnimation
          if (resources.motionPath) {
            loader.loadWithAnimation(
              resources.modelPath,
              resources.motionPath,
              (mmd) => {
                resolve({ mesh: mmd.mesh, animation: mmd.animation });
              },
              (xhr) => {
                if (xhr.lengthComputable) {
                  const percent = (xhr.loaded / xhr.total) * 100;
                  onLoadProgress?.(percent, 'model+motion');
                }
              },
              (err) => reject(err)
            );
          } else {
            // 仅加载模型
            loader.load(
              resources.modelPath,
              (mesh) => {
                resolve({ mesh: mesh as THREE.SkinnedMesh });
              },
              (xhr) => {
                if (xhr.lengthComputable) {
                  const percent = (xhr.loaded / xhr.total) * 100;
                  onLoadProgress?.(percent, 'model');
                }
              },
              (err) => reject(err)
            );
          }
        });

        const { mesh, animation } = await loadModelPromise;
        
        // 配置模型
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // 隐藏 SPH/SPA 贴图 (可选，看需求)
        // mesh.material.forEach(m => { if(m.envMap) m.envMap = null; });

        // 3.2 配置 Physics 和 Helper
        const enablePhysics = stage.enablePhysics !== false && !mobileOptimization.disablePhysics;
        
        helper.add(mesh, {
          animation: animation,
          physics: enablePhysics
        });

        scene.add(mesh);

        // 3.3 加载相机动画 (可选)
        if (resources.cameraPath) {
          loader.loadAnimation(
            resources.cameraPath,
            camera,
            (cameraAnimation) => {
              helper.add(camera, {
                animation: cameraAnimation as THREE.AnimationClip
              });
            },
            undefined,
            (err) => console.error('Failed to load camera motion:', err)
          );
        }

        // 3.4 加载音频 (可选)
        if (resources.audioPath) {
          const listener = new THREE.AudioListener();
          camera.add(listener);
          
          const sound = new THREE.Audio(listener);
          const audioLoader = new THREE.AudioLoader();
          
          audioLoader.load(
            resources.audioPath,
            (buffer) => {
              sound.setBuffer(buffer);
              sound.setLoop(loop);
              sound.setVolume(volume);
              
              helper.add(sound, { 
                delay: 0.0, 
                duration: buffer.duration 
              });
              
              // 音频加载完成后，如果已经是播放状态，可能需要同步一下
            },
            (xhr) => {
               // Audio progress
            },
            (err) => console.error('Failed to load audio:', err)
          );
        }

        // 3.5 加载舞台模型 (可选)
        if (resources.stageModelPath) {
           loader.load(
             resources.stageModelPath, 
             (stageMesh) => {
               stageMesh.castShadow = true;
               stageMesh.receiveShadow = true;
               scene.add(stageMesh);
               
               // 如果舞台也是 SkinnedMesh 且有 physics，也可以 add 到 helper
               // 但通常舞台是静态的 Object3D 或 Group
             },
             undefined,
             (err) => console.error('Failed to load stage:', err)
           );
        }

        isReadyRef.current = true;
        onLoad?.();
        
        if (autoPlay) {
          // 稍微延迟一下以确保所有资源就位 (特别是音频)
          setTimeout(() => {
             isPlayingRef.current = true;
             onPlay?.();
          }, 100);
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
      
      // 停止状态
      isPlayingRef.current = false;
      isReadyRef.current = false;
      
      // 移除 ResizeObserver
      resizeObserverRef.current?.disconnect();
      
      // 释放 Helper (如果存在)
      // MMDAnimationHelper 没有 dispose，但它可能引用了 Mesh
      helperRef.current = null;
      
      // 释放 Scene 中的对象
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.SkinnedMesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((m: THREE.Material) => {
                    m.dispose();
                    // @ts-ignore
                    if (m.map) m.map.dispose();
                    // @ts-ignore
                    if (m.emissiveMap) m.emissiveMap.dispose();
                    // @ts-ignore
                    if (m.gradientMap) m.gradientMap.dispose();
                });
              } else {
                object.material.dispose();
                // @ts-ignore
                if (object.material.map) object.material.map.dispose();
                // @ts-ignore
                if (object.material.emissiveMap) object.material.emissiveMap.dispose();
                // @ts-ignore
                if (object.material.gradientMap) object.material.gradientMap.dispose();
              }
            }
          }
        });
        sceneRef.current.clear();
        sceneRef.current = null;
      }

      // 释放 Controls
      controlsRef.current?.dispose();
      controlsRef.current = null;

      // 释放 Renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss(); // 强制丢失上下文
        
        if (containerRef.current && rendererRef.current.domElement) {
            containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在挂载时执行一次，资源变更通过另一个 useEffect 处理

  // 渲染循环
  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      if (isReadyRef.current && isPlayingRef.current && helperRef.current) {
        const delta = clockRef.current.getDelta();
        helperRef.current.update(delta);
        
        // 简单的结束检测 (如果使用了 Audio，Audio 结束会停止)
        // 这里可以扩展 onTimeUpdate
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

