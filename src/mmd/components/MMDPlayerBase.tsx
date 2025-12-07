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
  
  // 🎯 新增：物理引擎组件引用 - 用于正确清理 Ammo 对象
  // 改用数组来追踪所有创建的对象（每个模型会创建多个物理世界和刚体）
  const physicsComponentsRef = useRef<{
    configs: any[];
    dispatchers: any[];
    caches: any[];
    solvers: any[];
    worlds: any[];
  }>({
    configs: [],
    dispatchers: [],
    caches: [],
    solvers: [],
    worlds: []
  });
  
  // 🕐 运行时间追踪 - 用于 OOM 错误报告
  const startTimeRef = useRef<number>(Date.now());
  const modelSwitchCountRef = useRef<number>(0);

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
      
      // 3. 重置物理引擎组件引用
      physicsComponentsRef.current = {
        configs: [],
        dispatchers: [],
        caches: [],
        solvers: [],
        worlds: []
      };
      
      // 🕐 记录开始时间和切换计数
      if (modelSwitchCountRef.current === 0) {
        // 首次加载，记录开始时间
        startTimeRef.current = Date.now();
        modelSwitchCountRef.current = 1;
        console.log('[MMDPlayerBase] 🕐 系统启动时间:', new Date(startTimeRef.current).toLocaleString());
      } else {
        // 模型切换
        modelSwitchCountRef.current++;
        const runningTime = Date.now() - startTimeRef.current;
        const minutes = Math.floor(runningTime / 60000);
        const seconds = Math.floor((runningTime % 60000) / 1000);
        console.log(`[MMDPlayerBase] 🔄 模型切换 #${modelSwitchCountRef.current} (运行时间: ${minutes}分${seconds}秒)`);
      }

      try {
        // 4. 物理引擎加载
        if (stage.enablePhysics !== false && !mobileOptimization.disablePhysics) {
          console.log('[MMDPlayerBase] Loading Ammo.js physics engine...');
          await loadAmmo(stage.physicsPath);
          if (checkCancelled()) return;
          console.log('[MMDPlayerBase] Ammo.js loaded successfully');
          
          // 🎯 关键修复：Hook MMDPhysics._createWorld 以捕获物理引擎组件
          // 这样我们可以在清理时正确销毁它们，防止 WASM 内存泄漏
          const Ammo = (window as any).Ammo;
          if (Ammo) {
            console.log('[MMDPlayerBase] Setting up physics component tracking...');
            
            // 保存原始的 Ammo 构造函数，以便在 _createWorld 中使用
            const originalBtDefaultCollisionConfiguration = Ammo.btDefaultCollisionConfiguration;
            const originalBtCollisionDispatcher = Ammo.btCollisionDispatcher;
            const originalBtDbvtBroadphase = Ammo.btDbvtBroadphase;
            const originalBtSequentialImpulseConstraintSolver = Ammo.btSequentialImpulseConstraintSolver;
            const originalBtDiscreteDynamicsWorld = Ammo.btDiscreteDynamicsWorld;
            
            // Monkey patch Ammo 构造函数来拦截创建过程
            // ⚠️ 关键修改：使用数组来保存所有对象，而不是只保存最后一个
            const componentsRef = physicsComponentsRef.current;
            
            Ammo.btDefaultCollisionConfiguration = function(...args: any[]) {
              const obj = new originalBtDefaultCollisionConfiguration(...args);
              componentsRef.configs.push(obj);  // 🎯 添加到数组而不是覆盖
              console.log(`[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #${componentsRef.configs.length}`);
              return obj;
            };
            
            Ammo.btCollisionDispatcher = function(...args: any[]) {
              const obj = new originalBtCollisionDispatcher(...args);
              componentsRef.dispatchers.push(obj);
              console.log(`[MMDPlayerBase] 🔍 Captured btCollisionDispatcher #${componentsRef.dispatchers.length}`);
              return obj;
            };
            
            Ammo.btDbvtBroadphase = function(...args: any[]) {
              const obj = new originalBtDbvtBroadphase(...args);
              componentsRef.caches.push(obj);
              console.log(`[MMDPlayerBase] 🔍 Captured btDbvtBroadphase #${componentsRef.caches.length}`);
              return obj;
            };
            
            Ammo.btSequentialImpulseConstraintSolver = function(...args: any[]) {
              const obj = new originalBtSequentialImpulseConstraintSolver(...args);
              componentsRef.solvers.push(obj);
              console.log(`[MMDPlayerBase] 🔍 Captured btSequentialImpulseConstraintSolver #${componentsRef.solvers.length}`);
              return obj;
            };
            
            Ammo.btDiscreteDynamicsWorld = function(...args: any[]) {
              const obj = new originalBtDiscreteDynamicsWorld(...args);
              componentsRef.worlds.push(obj);
              console.log(`[MMDPlayerBase] 🔍 Captured btDiscreteDynamicsWorld #${componentsRef.worlds.length}`);
              return obj;
            };
            
            console.log('[MMDPlayerBase] ✅ Physics component tracking setup complete');
          }
        } else {
          console.log('[MMDPlayerBase] Physics disabled');
        }

        // 5. 场景初始化
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
        
        // 检测 OOM 错误并弹出警告
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('OOM') || errorMessage.includes('out of memory')) {
          // 计算运行时间
          const runningTime = Date.now() - startTimeRef.current;
          const hours = Math.floor(runningTime / 3600000);
          const minutes = Math.floor((runningTime % 3600000) / 60000);
          const seconds = Math.floor((runningTime % 60000) / 1000);
          
          const timeString = hours > 0 
            ? `${hours}小时${minutes}分${seconds}秒` 
            : minutes > 0
              ? `${minutes}分${seconds}秒`
              : `${seconds}秒`;
          
          alert(`⚠️ 内存溢出错误 (OOM)

📊 系统运行统计：
• 运行时间: ${timeString}
• 模型切换次数: ${modelSwitchCountRef.current}
• 启动时间: ${new Date(startTimeRef.current).toLocaleString()}
• 错误时间: ${new Date().toLocaleString()}

❌ 问题：物理引擎内存不足！
这通常意味着之前的物理世界没有正确清理。

🔍 错误详情：
${errorMessage}

💡 建议：请刷新页面或联系开发者`);
        }
        
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    init();

    return () => {
      // 清理逻辑 - 彻底清理所有 Three.js 资源以防止内存泄漏
      console.log('[MMDPlayerBase] Cleanup started');
      
      // 增加 ID，立即使当前的 init 失效（如果还在跑）
      initIdRef.current++;
      
      // 停止动画循环
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      
      isPlayingRef.current = false;
      isReadyRef.current = false;
      
      // 清理 ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      // 清理音频资源
      if (audioRef.current) {
        try {
          if (audioRef.current.isPlaying) {
            audioRef.current.stop();
          }
          if (audioRef.current.source) {
            audioRef.current.disconnect();
          }
          // 清理音频缓冲区引用
          if (audioRef.current.buffer) {
            audioRef.current.buffer = null as any;
          }
          audioRef.current = null;
        } catch (e) {
          console.warn('[MMDPlayerBase] Error cleaning up audio:', e);
        }
      }
      
      // 清理 AnimationHelper - 包含物理引擎清理  
      if (helperRef.current) {
        try {
          console.log('[MMDPlayerBase] Cleaning up AnimationHelper');
          
          const helperObjects = (helperRef.current as any).objects;
          const meshes = (helperRef.current as any).meshes || [];
          
          console.log('[MMDPlayerBase] Found meshes count:', meshes.length);
          
          if (meshes && Array.isArray(meshes) && meshes.length > 0) {
            meshes.forEach((mesh: any, idx: number) => {
              console.log(`[MMDPlayerBase] Cleaning mesh ${idx}:`, mesh.uuid);
              
              // 🎯 关键修复：从 WeakMap 中获取真正的 meshData
              let meshData: any = null;
              
              if (helperObjects instanceof WeakMap) {
                console.log('[MMDPlayerBase]   Accessing WeakMap with mesh as key...');
                meshData = helperObjects.get(mesh);
                
                if (meshData) {
                  const meshDataKeys = Object.keys(meshData);
                  console.log(`[MMDPlayerBase]   ✅ Got meshData from WeakMap, keys (${meshDataKeys.length}):`, meshDataKeys);
                  
                  // 打印物理相关的属性
                  const physicsRelatedKeys = meshDataKeys.filter(k => k.toLowerCase().includes('phys'));
                  if (physicsRelatedKeys.length > 0) {
                    console.log(`[MMDPlayerBase]   Physics-related keys:`, physicsRelatedKeys);
                    physicsRelatedKeys.forEach(key => {
                      const value = meshData[key];
                      console.log(`[MMDPlayerBase]     ${key}:`, typeof value, value?.constructor?.name || value);
                    });
                  }
                } else {
                  console.log('[MMDPlayerBase]   ⚠️ No meshData found in WeakMap for this mesh');
                }
              }
              
              // 如果没有从 WeakMap 获取到，使用 mesh 本身作为 fallback
              if (!meshData) {
                console.log('[MMDPlayerBase]   Using mesh itself as meshData');
                meshData = mesh;
              }
              
              // 清理物理系统 - 从 meshData 中获取
              const physics = meshData?.physics;
              
              if (physics) {
                try {
                  console.log('[MMDPlayerBase] 🎯 Starting physics cleanup for mesh', idx);
                  console.log('[MMDPlayerBase]   Debug: physics object keys:', Object.keys(physics));
                  
                  // 优先使用 MMDPhysics.dispose() 方法（three-stdlib 提供的标准清理方法）
                  if (typeof physics.dispose === 'function') {
                    console.log('[MMDPlayerBase]   Calling MMDPhysics.dispose()...');
                    physics.dispose();
                    console.log('[MMDPlayerBase]   ✅ MMDPhysics.dispose() completed');
                  } else {
                    // 手动清理物理组件
                    console.log('[MMDPlayerBase]   No dispose method, manually cleaning physics components...');
                    
                    const Ammo = (window as any).Ammo;
                    if (!Ammo || !Ammo.destroy) {
                      console.warn('[MMDPlayerBase]   ⚠️ Ammo.destroy not available');
                    } else {
                      // 清理刚体
                      if (physics.world && Array.isArray(physics.bodies) && physics.bodies.length > 0) {
                        console.log(`[MMDPlayerBase]   Cleaning ${physics.bodies.length} rigid bodies...`);
                        for (let i = physics.bodies.length - 1; i >= 0; i--) {
                          try {
                            const body = physics.bodies[i];
                            if (body && body.body) {
                              physics.world.removeRigidBody(body.body);
                            }
                          } catch (e) {
                            console.warn(`[MMDPlayerBase]     Error removing body ${i}:`, e);
                          }
                        }
                        physics.bodies.length = 0;
                        console.log('[MMDPlayerBase]   ✅ All rigid bodies removed');
                      }
                      
                      // 清理约束
                      if (physics.world && Array.isArray(physics.constraints) && physics.constraints.length > 0) {
                        console.log(`[MMDPlayerBase]   Cleaning ${physics.constraints.length} constraints...`);
                        for (let i = physics.constraints.length - 1; i >= 0; i--) {
                          try {
                            const constraint = physics.constraints[i];
                            if (constraint) {
                              physics.world.removeConstraint(constraint);
                            }
                          } catch (e) {
                            console.warn(`[MMDPlayerBase]     Error removing constraint ${i}:`, e);
                          }
                        }
                        physics.constraints.length = 0;
                        console.log('[MMDPlayerBase]   ✅ All constraints removed');
                      }
                      
                      // 注意：不在这里销毁 world，因为它会在后面统一清理
                    }
                  }
                  
                  // 清除引用
                  meshData.physics = null;
                  
                  console.log('[MMDPlayerBase] ✅ Physics cleanup completed for mesh', idx);
                } catch (physicsError) {
                  console.error('[MMDPlayerBase] ❌ Error cleaning up physics:', physicsError);
                  console.error('[MMDPlayerBase] Physics error stack:', (physicsError as Error).stack);
                }
              } else {
                console.log('[MMDPlayerBase] ⚠️ No physics object found for mesh', idx);
              }
              
              // 清理 AnimationMixer (从 meshData 中获取)
              if (meshData?.mixer) {
                meshData.mixer.stopAllAction();
                meshData.mixer.uncacheRoot(meshData.mesh || mesh);
                // 清理所有 clips 的引用
                const clips = meshData.mixer._actions || [];
                clips.forEach((action: any) => {
                  if (action._clip) {
                    action._clip = null;
                  }
                });
                meshData.mixer = null;
              }
              
              // 清理 audio 引用 (从 meshData 中获取)
              if (meshData?.audio) {
                if (meshData.audio.isPlaying) {
                  meshData.audio.stop();
                }
                if (meshData.audio.source) {
                  meshData.audio.disconnect();
                }
                if (meshData.audio.buffer) {
                  meshData.audio.buffer = null;
                }
                meshData.audio = null;
              }
            });
            // 清空数组
            meshes.length = 0;
          }
          
          // 🎯 核心修复：使用捕获的物理引擎组件引用进行清理
          console.log('[MMDPlayerBase] 🔥 Starting CRITICAL physics components cleanup...');
          const Ammo = (window as any).Ammo;
          if (Ammo && Ammo.destroy) {
            const components = physicsComponentsRef.current;
            
            console.log(`[MMDPlayerBase] 📊 Physics components count:`, {
              worlds: components.worlds.length,
              solvers: components.solvers.length,
              caches: components.caches.length,
              dispatchers: components.dispatchers.length,
              configs: components.configs.length
            });
            
            // 按照正确的顺序销毁 Ammo 对象（与创建顺序相反）
            // 创建顺序：config -> dispatcher -> cache -> solver -> world
            // 销毁顺序：world -> solver -> cache -> dispatcher -> config
            
            // 销毁所有 worlds
            if (components.worlds.length > 0) {
              console.log(`[MMDPlayerBase]   🗑️ Destroying ${components.worlds.length} btDiscreteDynamicsWorld(s)...`);
              for (let i = components.worlds.length - 1; i >= 0; i--) {
                try {
                  Ammo.destroy(components.worlds[i]);
                } catch (e) {
                  console.error(`[MMDPlayerBase]   ❌ Error destroying world #${i}:`, e);
                }
              }
              components.worlds.length = 0;
              console.log('[MMDPlayerBase]   ✅ All btDiscreteDynamicsWorld destroyed');
            }
            
            // 销毁所有 solvers
            if (components.solvers.length > 0) {
              console.log(`[MMDPlayerBase]   🗑️ Destroying ${components.solvers.length} btSequentialImpulseConstraintSolver(s)...`);
              for (let i = components.solvers.length - 1; i >= 0; i--) {
                try {
                  Ammo.destroy(components.solvers[i]);
                } catch (e) {
                  console.error(`[MMDPlayerBase]   ❌ Error destroying solver #${i}:`, e);
                }
              }
              components.solvers.length = 0;
              console.log('[MMDPlayerBase]   ✅ All btSequentialImpulseConstraintSolver destroyed');
            }
            
            // 销毁所有 caches
            if (components.caches.length > 0) {
              console.log(`[MMDPlayerBase]   🗑️ Destroying ${components.caches.length} btDbvtBroadphase(s)...`);
              for (let i = components.caches.length - 1; i >= 0; i--) {
                try {
                  Ammo.destroy(components.caches[i]);
                } catch (e) {
                  console.error(`[MMDPlayerBase]   ❌ Error destroying cache #${i}:`, e);
                }
              }
              components.caches.length = 0;
              console.log('[MMDPlayerBase]   ✅ All btDbvtBroadphase destroyed');
            }
            
            // 销毁所有 dispatchers
            if (components.dispatchers.length > 0) {
              console.log(`[MMDPlayerBase]   🗑️ Destroying ${components.dispatchers.length} btCollisionDispatcher(s)...`);
              for (let i = components.dispatchers.length - 1; i >= 0; i--) {
                try {
                  Ammo.destroy(components.dispatchers[i]);
                } catch (e) {
                  console.error(`[MMDPlayerBase]   ❌ Error destroying dispatcher #${i}:`, e);
                }
              }
              components.dispatchers.length = 0;
              console.log('[MMDPlayerBase]   ✅ All btCollisionDispatcher destroyed');
            }
            
            // 销毁所有 configs
            if (components.configs.length > 0) {
              console.log(`[MMDPlayerBase]   🗑️ Destroying ${components.configs.length} btDefaultCollisionConfiguration(s)...`);
              for (let i = components.configs.length - 1; i >= 0; i--) {
                try {
                  Ammo.destroy(components.configs[i]);
                } catch (e) {
                  console.error(`[MMDPlayerBase]   ❌ Error destroying config #${i}:`, e);
                }
              }
              components.configs.length = 0;
              console.log('[MMDPlayerBase]   ✅ All btDefaultCollisionConfiguration destroyed');
            }
            
            console.log('[MMDPlayerBase] 🎉 Physics components cleanup completed!');
          } else {
            console.warn('[MMDPlayerBase] ⚠️ Ammo.destroy not available, skipping physics cleanup');
          }
          
          // 清理 sharedPhysics 和 masterPhysics（如果存在）
          console.log('[MMDPlayerBase] Checking helper-level physics...');
          if ((helperRef.current as any).sharedPhysics) {
            console.log('[MMDPlayerBase] Clearing sharedPhysics reference...');
            (helperRef.current as any).sharedPhysics = null;
          }
          if ((helperRef.current as any).masterPhysics) {
            console.log('[MMDPlayerBase] Clearing masterPhysics reference...');
            (helperRef.current as any).masterPhysics = null;
          }
          
          // 清理 helper 自身
          if (helperRef.current.dispose) {
            helperRef.current.dispose();
          }
        } catch (e) {
          console.warn('[MMDPlayerBase] Error cleaning up AnimationHelper:', e);
        }
        helperRef.current = null;
      }
      
      // 清理 AnimationClip
      animationClipRef.current = null;
      
      // 清理坐标轴
      if (axesHelperRef.current) {
        if (sceneRef.current) {
          sceneRef.current.remove(axesHelperRef.current);
        }
        axesHelperRef.current.dispose();
        axesHelperRef.current = null;
      }
      
      // 清理场景中的所有对象 - 增强版
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          // 清理几何体和材质
          if (object instanceof THREE.Mesh || object instanceof THREE.SkinnedMesh) {
            // 清理骨骼相关（SkinnedMesh）
            if (object instanceof THREE.SkinnedMesh) {
              if (object.skeleton) {
                object.skeleton.dispose();
              }
              // 清理绑定矩阵
              if (object.bindMatrix) {
                object.bindMatrix = null as any;
              }
              if (object.bindMatrixInverse) {
                object.bindMatrixInverse = null as any;
              }
            }
            
            // 清理几何体
            if (object.geometry) {
              object.geometry.dispose();
              object.geometry = null as any;
            }
            
            // 清理材质和纹理
            if (object.material) {
              const disposeMaterial = (m: THREE.Material) => {
                // 清理所有可能的纹理类型（包括 MMD 特有的）
                const textureProps = [
                  'map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap', 
                  'envMap', 'alphaMap', 'emissiveMap', 'displacementMap',
                  'roughnessMap', 'metalnessMap', 'aoMap',
                  // MMD 特有纹理
                  'gradientMap', 'toonMap', 'sphereMap', 'matcap'
                ];
                
                textureProps.forEach(prop => {
                  // @ts-ignore
                  if (m[prop] && m[prop].dispose) {
                    // @ts-ignore
                    m[prop].dispose();
                    // @ts-ignore
                    m[prop] = null;
                  }
                });
                
                // 清理材质本身
                m.dispose();
              };
              
              if (Array.isArray(object.material)) {
                object.material.forEach(disposeMaterial);
              } else {
                disposeMaterial(object.material);
              }
              object.material = null as any;
            }
          }
          
          // 清理 AudioListener
          if (object instanceof THREE.AudioListener) {
            try {
              // @ts-ignore
              if (object.context && object.context.state !== 'closed') {
                // @ts-ignore
                object.context.close?.();
              }
            } catch (e) {
              console.warn('[MMDPlayerBase] Error closing AudioContext:', e);
            }
          }
          
          // 清理灯光的阴影贴图
          if (object instanceof THREE.Light) {
            if (object.shadow && object.shadow.map) {
              object.shadow.map.dispose();
              object.shadow.map = null as any;
            }
          }
        });
        
        // 清空场景
        sceneRef.current.clear();
        sceneRef.current = null;
      }

      // 清理 Controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
      controlsRef.current = null;
      }

      // 清理 Renderer - 增强版
      if (rendererRef.current) {
        try {
          // 清理所有渲染目标
          const renderer = rendererRef.current;
          
          // 清理渲染列表
          if (renderer.renderLists) {
            renderer.renderLists.dispose();
          }
          
          // 清理渲染器信息
          if (renderer.info && renderer.info.programs) {
            renderer.info.programs.forEach((program: any) => {
              if (program && program.destroy) {
                program.destroy();
              }
            });
          }
          
          // 清理 WebGL 程序
          if (renderer.getContext) {
            const gl = renderer.getContext();
            const numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
            for (let unit = 0; unit < numTextureUnits; ++unit) {
              gl.activeTexture(gl.TEXTURE0 + unit);
              gl.bindTexture(gl.TEXTURE_2D, null);
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
            }
          }
          
          // Dispose 渲染器
          renderer.dispose();
          
          // 强制失去 WebGL 上下文
          renderer.forceContextLoss();
          
          // 从 DOM 中移除 canvas
          if (containerRef.current && renderer.domElement) {
            if (containerRef.current.contains(renderer.domElement)) {
              containerRef.current.removeChild(renderer.domElement);
            }
          }
          
          // 清空 canvas 引用
          if (renderer.domElement) {
            renderer.domElement.width = 1;
            renderer.domElement.height = 1;
          }
          
        } catch (e) {
          console.warn('[MMDPlayerBase] Error cleaning up renderer:', e);
        }
        rendererRef.current = null;
      }
      
      // 重置 Camera
      cameraRef.current = null;
      
      // 重置 Clock
      clockRef.current = new THREE.Clock();
      
      // 重置时长
      durationRef.current = 0;
      
      console.log('[MMDPlayerBase] Cleanup completed');
      
      // 提示浏览器可以进行垃圾回收（只在开发环境）
      if (typeof window !== 'undefined' && 'gc' in window) {
        try {
          // @ts-ignore
          window.gc();
        } catch (e) {
          // gc 不可用时忽略
        }
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
