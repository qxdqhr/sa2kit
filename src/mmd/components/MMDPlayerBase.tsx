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
    showAxes = false,
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
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null); // 坐标轴
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  // 状态 Refs
  const isReadyRef = useRef(false);
  const isPlayingRef = useRef(false);
  const initIdRef = useRef(0); // 初始化 ID 锁
  const durationRef = useRef(0); // 动画时长（秒）
  const animationClipRef = useRef<THREE.AnimationClip | null>(null); // 保存动画剪辑
  const loopRef = useRef(loop); // 循环状态 ref
  const audioRef = useRef<THREE.Audio | null>(null); // 音频对象引用

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    play: () => {
      if (!isReadyRef.current) return;
      isPlayingRef.current = true;
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
      onPause?.();
    },
    seek: (time: number) => {
      console.warn('Seek not fully implemented in MMDPlayerBase yet');
    },
    getCurrentTime: () => {
       const elapsed = clockRef.current.elapsedTime;
       const duration = durationRef.current;
       // 如果是循环播放，返回模除后的时间
       if (duration > 0 && loopRef.current) {
         return elapsed % duration;
       }
       return elapsed;
    }, 
    getDuration: () => durationRef.current,
    isPlaying: () => isPlayingRef.current,
    snapshot: () => {
      if (!rendererRef.current) return '';
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
      // 1. 生成当前初始化的唯一 ID
      const myId = ++initIdRef.current;
      
      // 辅助函数：检查当前初始化是否已过时或组件已卸载
      const checkCancelled = () => {
        return myId !== initIdRef.current || !containerRef.current;
      };

      // 2. 清空容器 (Double Check)
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      try {
        // 3. 物理引擎加载
        if (stage.enablePhysics !== false && !mobileOptimization.disablePhysics) {
          await loadAmmo(stage.physicsPath);
          if (checkCancelled()) return;
        }

        // 4. 场景初始化
        const container = containerRef.current!;
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 150;

        // Scene
        const scene = new THREE.Scene();
        if (stage.backgroundColor) {
          scene.background = new THREE.Color(stage.backgroundColor);
        }
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
        if (stage.cameraPosition) {
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
          preserveDrawingBuffer: true 
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(mobileOptimization.enabled ? mobileOptimization.pixelRatio || 1 : window.devicePixelRatio);
        
        // 5. 关键检查点：在操作 DOM 之前再次检查
        if (checkCancelled()) {
            renderer.dispose();
            return;
        }
        
        // 再次确保容器为空，防止并行执行导致的残留
        container.innerHTML = '';
        
        // 强制 Canvas 样式
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.outline = 'none';
        
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

        // Axes Helper (坐标轴辅助)
        if (showAxes) {
          const axesHelper = new THREE.AxesHelper(20);
          scene.add(axesHelper);
          axesHelperRef.current = axesHelper;
        }

        // Resize Observer
        const onResize = () => {
          if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          
          if (w === 0 || h === 0) return;

          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          
          rendererRef.current.setSize(w, h);
        };
        
        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(container);
        resizeObserverRef.current = resizeObserver;
        
        // 立即执行一次 Resize
        onResize();

        // 6. 资源加载
        console.log('[MMDPlayerBase] Start loading resources...', resources);
        const loader = new MMDLoader();
        const helper = new MMDAnimationHelper({
          afterglow: 2.0
        });
        helperRef.current = helper;

        // 6.1 加载模型和动作
        const loadModelPromise = new Promise<{ mesh: THREE.SkinnedMesh, animation?: THREE.AnimationClip }>((resolve, reject) => {
          if (resources.motionPath) {
            console.log('[MMDPlayerBase] Loading model with motion:', resources.motionPath);
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
            console.log('[MMDPlayerBase] Loading model only');
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
        
        // 关键检查点：资源加载耗时较长，再次检查是否已失效
        if (checkCancelled()) return;
        
        console.log('[MMDPlayerBase] Model loaded:', mesh);
        
        // 保存动画时长
        if (animation) {
          animationClipRef.current = animation;
          durationRef.current = animation.duration;
          console.log('[MMDPlayerBase] Animation duration:', animation.duration);
        }

        // 自动聚焦模型
        const box = new THREE.Box3().setFromObject(mesh);
        if (!box.isEmpty()) {
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            console.log('[MMDPlayerBase] Model bounds:', { center, size });

            if (!stage.cameraTarget) {
                // 对于人形模型，聚焦在胸部/头部之间的位置（center.y + 30-40% 高度）
                controls.target.set(center.x, center.y + size.y * 0.35, center.z);
                
                if (!stage.cameraPosition) {
                    // MMD 模型通常正面朝向 -Z 轴，相机应该在 +Z 方向
                    // 距离基于模型尺寸，确保能看到全身
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const dist = maxDim * 2.0; // 增加距离系数
                    
                    // 相机位置：在模型前方（+Z），稍微抬高（俯视角度）
                    camera.position.set(
                        center.x,                    // X: 水平对齐
                        center.y + size.y * 0.6,     // Y: 稍高于模型中心（眼睛平视或略俯视）
                        center.z + dist              // Z: 在模型正前方（+Z 方向）
                    );
                    console.log('[MMDPlayerBase] Auto camera position:', camera.position);
                }
                controls.update();
            }
        }
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const enablePhysics = stage.enablePhysics !== false && !mobileOptimization.disablePhysics;
        
        helper.add(mesh, {
          animation: animation,
          physics: enablePhysics
        });

        scene.add(mesh);

        // 6.3 加载相机动画
        if (resources.cameraPath) {
          loader.loadAnimation(
            resources.cameraPath,
            camera,
            (cameraAnimation) => {
              if (checkCancelled()) return; // Callback check
              helper.add(camera, {
                animation: cameraAnimation as THREE.AnimationClip
              });
            },
            undefined,
            (err) => console.error('Failed to load camera motion:', err)
          );
        }

        // 6.4 加载音频
        if (resources.audioPath) {
          const listener = new THREE.AudioListener();
          camera.add(listener);
          
          const sound = new THREE.Audio(listener);
          const audioLoader = new THREE.AudioLoader();
          
          audioLoader.load(
            resources.audioPath,
            (buffer) => {
              if (checkCancelled()) return; // Callback check
              sound.setBuffer(buffer);
              sound.setLoop(loopRef.current);
              sound.setVolume(volume);
              audioRef.current = sound; // 保存音频引用以便后续更新循环状态
              
              helper.add(sound, { 
                delay: 0.0, 
                duration: buffer.duration 
              } as any);
            },
            undefined,
            (err) => console.error('Failed to load audio:', err)
          );
        }

        // 6.5 加载舞台
        if (resources.stageModelPath) {
           loader.load(
             resources.stageModelPath, 
             (stageMesh) => {
               if (checkCancelled()) return; // Callback check
               stageMesh.castShadow = true;
               stageMesh.receiveShadow = true;
               scene.add(stageMesh);
             },
             undefined,
             (err) => console.error('Failed to load stage:', err)
           );
        }

        if (checkCancelled()) return;
        
        isReadyRef.current = true;
        onLoad?.();
        
        if (autoPlay) {
          setTimeout(() => {
             if (checkCancelled()) return;
             isPlayingRef.current = true;
             if (!clockRef.current.running) clockRef.current.start();
             onPlay?.();
          }, 100);
        }

        // 7. 开始渲染循环
        animate();

      } catch (error) {
        if (checkCancelled()) return; // 如果是因为取消导致的 error，忽略
        console.error('MMDPlayerBase initialization failed:', error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    init();

    return () => {
      // 清理逻辑
      
      // 增加 ID，立即使当前的 init 失效（如果还在跑）
      initIdRef.current++;
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      isPlayingRef.current = false;
      isReadyRef.current = false;
      
      resizeObserverRef.current?.disconnect();
      
      helperRef.current = null;
      audioRef.current = null;
      
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.SkinnedMesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((m: THREE.Material) => {
                    m.dispose();
                    // @ts-ignore
                    if (m.map) m.map.dispose();
                });
              } else {
                object.material.dispose();
                // @ts-ignore
                if (object.material.map) object.material.map.dispose();
              }
            }
          }
        });
        sceneRef.current.clear();
        sceneRef.current = null;
      }

      controlsRef.current?.dispose();
      controlsRef.current = null;

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        
        if (containerRef.current && rendererRef.current.domElement) {
            // 这里要小心，不要移除新 init 添加的 domElement
            // 但由于我们每次 init 前都清空了 container，这里主要是为了保险
             if (containerRef.current.contains(rendererRef.current.domElement)) {
                containerRef.current.removeChild(rendererRef.current.domElement);
             }
        }
        rendererRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources]); // 关键依赖：当 resources 变了（且没有 key 强制重刷时），执行这个 effect

  // 监听 showAxes 变化，动态添加/移除坐标轴
  useEffect(() => {
    if (!sceneRef.current) return;
    
    if (showAxes && !axesHelperRef.current) {
      const axesHelper = new THREE.AxesHelper(20);
      sceneRef.current.add(axesHelper);
      axesHelperRef.current = axesHelper;
    } else if (!showAxes && axesHelperRef.current) {
      sceneRef.current.remove(axesHelperRef.current);
      axesHelperRef.current.dispose();
      axesHelperRef.current = null;
    }
  }, [showAxes]);

  // 监听 loop 变化，更新循环状态
  useEffect(() => {
    loopRef.current = loop;
    
    // 同步更新音频的循环状态
    if (audioRef.current && audioRef.current.buffer) {
      audioRef.current.setLoop(loop);
    }
  }, [loop]);

  // 渲染循环
  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      if (isReadyRef.current && isPlayingRef.current && helperRef.current) {
        const delta = clockRef.current.getDelta();
        helperRef.current.update(delta);
        
        // 触发时间更新回调（使用模除后的时间）
        const elapsed = clockRef.current.elapsedTime;
        const duration = durationRef.current;
        const currentTime = duration > 0 && loopRef.current ? (elapsed % duration) : elapsed;
        onTimeUpdate?.(currentTime);
        
        // 简单的结束检测（非循环模式）
        if (!loopRef.current && duration > 0 && elapsed >= duration) {
          isPlayingRef.current = false;
          clockRef.current.stop();
          onEnded?.();
        }
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
