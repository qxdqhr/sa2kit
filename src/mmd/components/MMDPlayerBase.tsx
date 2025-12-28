import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { 
  OrbitControls, 
  MMDLoader, 
  MMDAnimationHelper, 
  OutlineEffect,
  EffectComposer,
  RenderPass,
  UnrealBloomPass
} from 'three-stdlib';

// 🚀 开启 Three.js 全局缓存，确保 CDN 资源在被浏览器缓存后，能直接从内存读取
if (typeof window !== 'undefined') {
  THREE.Cache.enabled = true;
}

import { loadAmmo } from '../utils/ammo-loader';
import { MMDPlayerBaseProps, MMDPlayerBaseRef } from '../types';

/**
 * 等待模型的所有材质和纹理加载完成
 * 确保渲染时不会有逐个子模型显示的效果
 */
async function waitForMaterialsReady(
  object: THREE.Object3D, 
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): Promise<void> {
  const textures: THREE.Texture[] = [];
  let meshCount = 0;
  
  // 遍历对象及其所有子对象，收集所有纹理和网格
  object.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
      meshCount++;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      
      materials.forEach((material) => {
        if (material instanceof THREE.Material) {
          // 收集所有可能的纹理属性
          const textureProps = [
            'map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap',
            'envMap', 'alphaMap', 'emissiveMap', 'displacementMap',
            'roughnessMap', 'metalnessMap', 'aoMap',
            // MMD 特有纹理
            'gradientMap', 'toonMap', 'sphereMap', 'matcap'
          ];
          
          textureProps.forEach((prop) => {
            const texture = (material as any)[prop];
            if (texture instanceof THREE.Texture && !textures.includes(texture)) {
              textures.push(texture);
            }
          });
        }
      });
    }
  });
  
  console.log(`[MMDPlayerBase] Found ${meshCount} meshes and ${textures.length} unique textures`);
  
  // 等待所有纹理的图像数据加载完成
  const texturePromises = textures.map((texture, index) => {
    return new Promise<void>((resolve) => {
      const image = texture.image;
      
      // 检查是否已经加载完成
      if (!image) {
        console.log(`[MMDPlayerBase]   Texture ${index + 1}/${textures.length}: No image`);
        resolve();
        return;
      }
      
      if (image instanceof HTMLImageElement) {
        if (image.complete && image.naturalWidth > 0) {
          console.log(`[MMDPlayerBase]   Texture ${index + 1}/${textures.length}: Already loaded`);
          resolve();
        } else {
          // 等待图像加载
          const onLoad = () => {
            console.log(`[MMDPlayerBase]   Texture ${index + 1}/${textures.length}: Loaded`);
            image.removeEventListener('load', onLoad);
            image.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (e: any) => {
            console.warn(`[MMDPlayerBase]   Texture ${index + 1}/${textures.length}: Failed to load`, e);
            image.removeEventListener('load', onLoad);
            image.removeEventListener('error', onError);
            resolve();
          };
          
          image.addEventListener('load', onLoad);
          image.addEventListener('error', onError);
          
          // 超时保护
          setTimeout(() => {
            image.removeEventListener('load', onLoad);
            image.removeEventListener('error', onError);
            console.warn(`[MMDPlayerBase]   Texture ${index + 1}/${textures.length}: Timeout`);
            resolve();
          }, 5000);
        }
      } else {
        console.log(`[MMDPlayerBase]   Texture ${index + 1}/${textures.length}: Non-image type`);
        resolve();
      }
    });
  });
  
  await Promise.all(texturePromises);
  console.log('[MMDPlayerBase] All texture images loaded');
  
  // 强制更新所有材质的纹理需要更新标志
  textures.forEach((texture) => {
    texture.needsUpdate = true;
  });
  
        // 执行几次渲染循环，确保所有纹理都上传到 GPU
        console.log('[MMDPlayerBase] Warming up renderer...');
        for (let i = 0; i < 3; i++) {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              try {
                // 🎯 核心修复：深度清理无效的变形目标数据，防止 Shader 编译错误 (MORPHTARGETS_COUNT undeclared)
                object.traverse((obj) => {
                  if ((obj as any).isMesh) {
                    const mesh = obj as THREE.Mesh;
                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                    
                    // 检查几何体是否真的有变形数据
                    const hasMorphAttributes = mesh.geometry.morphAttributes && 
                                              Object.keys(mesh.geometry.morphAttributes).length > 0;

                    materials.forEach(m => {
                      // 针对特定的没有实际变形数据的材质
                      if (!hasMorphAttributes) {
                        // 1. 强制材质关闭变形
                        (m as any).morphTargets = false;
                        
                        // 2. 彻底移除几何体中的变形属性引用
                        if (mesh.geometry.morphAttributes) {
                          mesh.geometry.morphAttributes = {};
                        }
                        
                        // 3. 重置 Mesh 的变形影响状态
                        if ((mesh as any).morphTargetInfluences) {
                          (mesh as any).morphTargetInfluences = [];
                        }
                        if ((mesh as any).morphTargetDictionary) {
                          (mesh as any).morphTargetDictionary = {};
                        }
                        m.needsUpdate = true;
                      }
                    });

                    if ((mesh as any).updateMorphTargets) {
                      (mesh as any).updateMorphTargets();
                    }
                  }
                });

                renderer.render(scene, camera);
                console.log(`[MMDPlayerBase]   Warmup render ${i + 1}/3`);
              } catch (renderError) {
                console.warn('[MMDPlayerBase] Warmup render failed (shader error?), skipping...', renderError);
              }
              resolve();
            });
          });
        }
  
  console.log('[MMDPlayerBase] All materials and textures fully ready');
}

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
    onCameraChange,
    className,
    style,
  } = props;

  // 合并渲染配置（优先使用 props，其次使用 stage）
  const renderEffect = props.renderEffect || stage.renderEffect || 'default';
  const outlineOptions = { ...stage.outlineOptions, ...props.outlineOptions };
  const bloomOptions = { ...stage.bloomOptions, ...props.bloomOptions };
  const toonOptions = { ...stage.toonOptions, ...props.toonOptions };

  // 容器 Ref
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js 对象 Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const outlineEffectRef = useRef<OutlineEffect | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
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
  const audioListenerRef = useRef<THREE.AudioListener | null>(null); // 音频监听器引用
  const audioLoaderRef = useRef<THREE.AudioLoader>(new THREE.AudioLoader());

  // 🚀 解决回调函数在渲染循环中的闭包过时问题
  const latestCallbacks = useRef({ onPlay, onPause, onEnded, onTimeUpdate });
  useEffect(() => {
    latestCallbacks.current = { onPlay, onPause, onEnded, onTimeUpdate };
  }, [onPlay, onPause, onEnded, onTimeUpdate]);
  
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
      latestCallbacks.current.onPlay?.();
    },
    pause: () => {
      if (!isPlayingRef.current) return;
      isPlayingRef.current = false;
      clockRef.current.stop();
      latestCallbacks.current.onPause?.();
    },
    stop: () => {
      isPlayingRef.current = false;
      clockRef.current.stop();
      latestCallbacks.current.onPause?.();
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
    },
    resetCamera: () => {
      if (!cameraRef.current || !controlsRef.current) return;
      
      const { cameraPosition, cameraTarget } = stage;
      
      if (cameraPosition) {
        const pos = cameraPosition as any;
        cameraRef.current.position.set(pos.x, pos.y, pos.z);
      } else {
        cameraRef.current.position.set(0, 20, 30);
      }
      
      if (cameraTarget) {
        const target = cameraTarget as any;
        controlsRef.current.target.set(target.x, target.y, target.z);
      } else {
        controlsRef.current.target.set(0, 10, 0);
      }
      
      controlsRef.current.update();
      onCameraChange?.(false); // 重置后标记为非手动
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
        if (stage.backgroundColor && stage.backgroundColor !== 'transparent') {
          scene.background = new THREE.Color(stage.backgroundColor);
        } else if (stage.backgroundImage) {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(stage.backgroundImage, (texture) => {
            scene.background = texture;
          });
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

        // 音频监听器
        const listener = new THREE.AudioListener();
        camera.add(listener);
        audioListenerRef.current = listener;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ 
          antialias: !mobileOptimization.enabled, 
          alpha: true, 
          preserveDrawingBuffer: true 
        });
        renderer.setSize(width, height);
        // 使用更高的像素比例以获得更清晰的渲染效果
        const pixelRatio = mobileOptimization.enabled 
          ? (mobileOptimization.pixelRatio || Math.min(window.devicePixelRatio, 2))
          : window.devicePixelRatio;
        renderer.setPixelRatio(pixelRatio);
        console.log('[MMDPlayerBase] Pixel ratio set to:', pixelRatio);
        
        // 🎯 三渲二优化：关闭色调映射，使色彩更接近 2D 原色
        if (renderEffect.includes('outline') || toonOptions.enabled) {
          renderer.toneMapping = THREE.NoToneMapping;
        } else {
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
        }
        
        // 5. 关键检查点：在操作 DOM 之前再次检查
        if (checkCancelled()) {
            renderer.dispose();
            return;
        }
        
        // 再次确保容器为空，防止并行执行导致的残留
        container.innerHTML = '';
        
        // 强制 Canvas 样式 - 确保 canvas 在最底层
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.outline = 'none';
        renderer.domElement.style.position = 'relative';
        
        // Shadow
        if (stage.enableShadow !== false && !mobileOptimization.reduceShadowQuality) {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 🎯 初始化渲染特效
        // 1. Outline Effect
        const effect = new OutlineEffect(renderer, {
          defaultThickness: outlineOptions.thickness ?? 0.003,
          defaultColor: new THREE.Color(outlineOptions.color ?? '#000000').toArray(),
          defaultAlpha: 1,
          defaultKeepAlive: true
        });
        outlineEffectRef.current = effect;

        // 2. Effect Composer (for Bloom)
        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(width, height),
          bloomOptions.strength ?? 1.0,
          bloomOptions.radius ?? 0.4,
          bloomOptions.threshold ?? 0.8
        );
        composer.addPass(bloomPass);
        composerRef.current = composer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, stage.ambientLightIntensity ?? 0.5);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, stage.directionalLightIntensity ?? 0.8);
        dirLight.position.set(0, 10, 0);
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

        // 🎯 监听手动相机操作
        controls.addEventListener('start', () => {
          onCameraChange?.(true);
        });

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
          if (composerRef.current) {
            composerRef.current.setSize(w, h);
          }
        };
        
        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(container);
        resizeObserverRef.current = resizeObserver;
        
        // 立即执行一次 Resize
        onResize();
        
        // 🎯 提前启动渲染循环（但不播放动画）
        // 这样可以在加载过程中显示场景，但动画要等完全准备好才开始
        console.log('[MMDPlayerBase] Starting render loop (animation paused)');
        animate();

        // 6. 资源加载
        console.log('[MMDPlayerBase] Start loading resources...', {
          model: resources.modelPath,
          stage: resources.stageModelPath,
          motion: resources.motionPath
        });
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

        // 设置模型基础属性
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // 🎯 关键优化：先等待所有材质和纹理加载完成，再添加到场景
        // 这样可以避免用户看到"逐个子模型显示"的过程
        console.log('[MMDPlayerBase] Waiting for all materials and textures to load...');
        
        // 创建一个临时场景来等待纹理加载（不影响主场景）
        const tempScene = new THREE.Scene();
        tempScene.add(mesh);
        await waitForMaterialsReady(mesh, renderer, tempScene, camera);
        
        if (checkCancelled()) return;
        console.log('[MMDPlayerBase] ✅ All materials and textures loaded');
        
        // 从临时场景移除
        tempScene.remove(mesh);

        // 计算模型边界并自动聚焦
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
        
        // 🎯 现在所有纹理都已加载完成，添加到场景和 helper
        const enablePhysics = stage.enablePhysics !== false && !mobileOptimization.disablePhysics;
        
        // 🎯 应用描边设置到模型材质
        // MMD 模型通常在材质的 userData.outlineParameters 中带有来自 PMX 的描边参数
        // 我们需要覆盖它们以使 props.outlineOptions 生效
        mesh.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach((m) => {
              if (!m.userData) m.userData = {};
              if (!m.userData.outlineParameters) {
                m.userData.outlineParameters = {
                  thickness: outlineOptions.thickness ?? 0.003,
                  color: new THREE.Color(outlineOptions.color ?? '#000000').toArray(),
                  alpha: 1,
                  visible: true,
                  keepAlive: true
                };
              } else {
                // 覆盖来自模型的默认值
                if (outlineOptions.thickness !== undefined) {
                  m.userData.outlineParameters.thickness = outlineOptions.thickness;
                }
                if (outlineOptions.color !== undefined) {
                  m.userData.outlineParameters.color = new THREE.Color(outlineOptions.color).toArray();
                }
              }

              // 🎯 应用三渲二(Toon)优化
              if (m instanceof THREE.MeshPhongMaterial) {
                if (toonOptions.enabled !== false && (toonOptions.enabled || renderEffect.includes('outline'))) {
                  // 1. 降低光泽度，使表面更平整，避免塑料感
                  m.shininess = toonOptions.shininess ?? 0;
                  m.specular.setScalar(0); // 移除物理高光

                  // 2. 强制硬色阶 (如果是 Toon 材质)
                  if (toonOptions.forceHardShading && (m as any).toonMap) {
                    (m as any).toonMap.magFilter = THREE.NearestFilter;
                    (m as any).toonMap.minFilter = THREE.NearestFilter;
                    (m as any).toonMap.needsUpdate = true;
                  }
                }
              }
            });
          }
        });

        helper.add(mesh, {
          animation: animation,
          physics: enablePhysics
        });

        scene.add(mesh);
        console.log('[MMDPlayerBase] ✅ Model added to scene (fully loaded)');

        // 🎯 自动降级系统 - 针对移动设备优化
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                               (window.innerWidth <= 768);
        
        if (isMobileDevice) {
          console.log('[MMDPlayerBase] 📱 Mobile device detected, applying optimizations...');
          
          // 方案 A: 使用骨骼纹理（如果支持）
          if (renderer.capabilities.vertexTextures) {
            console.log('[MMDPlayerBase]   ✅ Vertex textures supported');
          } else {
            console.log('[MMDPlayerBase]   ⚠️ Vertex textures NOT supported');
          }
          
          // 方案 B: 简化材质
          let simplifiedMaterialCount = 0;
          mesh.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((material, idx) => {
                if (material instanceof THREE.MeshPhongMaterial || 
                    material instanceof THREE.MeshStandardMaterial) {
                  // 保存原始材质的颜色
                  const originalColor = material.color?.clone();
                  const originalMap = material.map;
                  
                  // 创建简化的 MeshBasicMaterial
                  const basicMaterial = new THREE.MeshBasicMaterial({
                    color: originalColor || 0xffffff,
                    map: originalMap,
                    transparent: material.transparent,
                    opacity: material.opacity,
                    side: material.side,
                    alphaTest: material.alphaTest
                  });
                  
                  // 替换材质
                  if (Array.isArray(child.material)) {
                    child.material[idx] = basicMaterial;
                  } else {
                    child.material = basicMaterial;
                  }
                  
                  // 清理旧材质
                  material.dispose();
                  simplifiedMaterialCount++;
                }
              });
            }
          });
          
          if (simplifiedMaterialCount > 0) {
            console.log(`[MMDPlayerBase]   ✅ Simplified ${simplifiedMaterialCount} materials to MeshBasicMaterial`);
          }
          
          // 方案 C: 限制骨骼数量（检查并警告）
          const MAX_BONES = 64;
          if (mesh.skeleton) {
            const boneCount = mesh.skeleton.bones.length;
            if (boneCount > MAX_BONES) {
              console.warn(`[MMDPlayerBase]   ⚠️ Model has ${boneCount} bones (max recommended: ${MAX_BONES})`);
              console.warn(`[MMDPlayerBase]   This may cause performance issues on mobile devices`);
            } else {
              console.log(`[MMDPlayerBase]   ✅ Bone count: ${boneCount} (within limit)`);
            }
          }
          
          console.log('[MMDPlayerBase] 📱 Mobile optimizations applied');
        }

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

        // 6.5 加载舞台
        const stagePaths = Array.isArray(resources.stageModelPath) 
          ? resources.stageModelPath 
          : (resources.stageModelPath ? [resources.stageModelPath] : []);

        for (const stagePath of stagePaths) {
          try {
            console.log(`[MMDPlayerBase] Loading stage from: ${stagePath}`);
            const stageMesh = await new Promise<THREE.Object3D>((resolve, reject) => {
              loader.load(
                stagePath,
                (mesh) => resolve(mesh),
                (xhr) => {
                  if (xhr.lengthComputable) {
                    const percent = (xhr.loaded / xhr.total) * 100;
                    if (Math.round(percent) % 20 === 0) console.log(`[MMDPlayerBase] Stage loading: ${percent.toFixed(1)}%`);
                  }
                },
                (err) => reject(err)
              );
            });
            
            if (checkCancelled()) return;
            
            console.log(`[MMDPlayerBase] Stage model loaded: ${stagePath}`, stageMesh);
            
            // 🎯 核心修复：深度清理无效的变形目标数据，防止 Shader 编译错误
            stageMesh.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                const mesh = child as THREE.Mesh;
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                
                materials.forEach((m, idx) => {
                   // 对于普通舞台材质，也确保关闭没用的 morphTargets
                   if ((m as any).morphTargets) {
                    (m as any).morphTargets = false;
                    m.needsUpdate = true;
                  }
                });

                // 3. 彻底移除几何体中的变形属性引用
                if (mesh.geometry.morphAttributes) {
                  mesh.geometry.morphAttributes = {};
                }
                if ((mesh as any).morphTargetInfluences) {
                  (mesh as any).morphTargetInfluences = [];
                }

                // 4. 🎯 应用描边设置到舞台材质
                materials.forEach((m) => {
                  if (!m.userData) m.userData = {};
                  // 舞台通常没有预设描边，我们手动为其添加
                  m.userData.outlineParameters = {
                    thickness: outlineOptions.thickness ?? 0.003,
                    color: new THREE.Color(outlineOptions.color ?? '#000000').toArray(),
                    alpha: 1,
                    visible: true,
                    keepAlive: true
                  };

                  // 🎯 应用三渲二(Toon)优化 (舞台也可能需要)
                  if (m instanceof THREE.MeshPhongMaterial) {
                    if (toonOptions.enabled !== false && (toonOptions.enabled || renderEffect.includes('outline'))) {
                      m.shininess = toonOptions.shininess ?? 0;
                      m.specular.setScalar(0);
                    }
                  }
                });
              }
            });

            // 🎯 材质预热
            try {
              await waitForMaterialsReady(stageMesh, renderer, scene, camera);
            } catch (e) {
              console.warn(`[MMDPlayerBase] Warmup error for stage ${stagePath}:`, e);
            }
            
            if (checkCancelled()) return;
            
            // 添加到场景
            scene.add(stageMesh);
            
            // 🎯 自动调整比例和位置
            const stageBox = new THREE.Box3().setFromObject(stageMesh);
            const stageSize = stageBox.getSize(new THREE.Vector3());
            
            if (stageSize.length() < 1) {
              stageMesh.scale.multiplyScalar(100);
            } else if (stageSize.y < 5) {
              stageMesh.scale.multiplyScalar(10);
            }
            
            // 确保底部对齐 Y=0 (可选)
            // stageMesh.position.set(0, 0, 0); 

            console.log(`[MMDPlayerBase] ✅ Stage added: ${stagePath}`);

            // 绑定动作
            if (resources.stageMotionPath) {
              (loader as any).loadAnimation(resources.stageMotionPath, stageMesh, (anim: any) => {
                if (!checkCancelled()) helper.add(stageMesh as any, { animation: anim });
              });
            }
          } catch (err) {
            console.error(`Failed to load stage ${stagePath}:`, err);
          }
        }

        if (checkCancelled()) return;
        
        // 🎯 所有资源完全加载完成，模型已完全显示，现在可以触发回调并开始播放动画
        isReadyRef.current = true;
        console.log('[MMDPlayerBase] 🎉 All resources fully loaded and ready!');
        console.log('[MMDPlayerBase] 📊 Summary:');
        console.log(`[MMDPlayerBase]   - Model: ✅ Fully loaded with all textures`);
        if (resources.stageModelPath) {
          console.log(`[MMDPlayerBase]   - Stage: ✅ Fully loaded with all textures`);
        }
        if (animation) {
          console.log(`[MMDPlayerBase]   - Animation: ✅ Ready (${animation.duration.toFixed(2)}s)`);
        }
        console.log('[MMDPlayerBase] 🔔 Triggering onLoad callback');
        onLoad?.();
        
        if (autoPlay) {
          // 给一点时间让渲染系统稳定，然后开始播放动画
          setTimeout(() => {
             if (checkCancelled()) return;
             console.log('[MMDPlayerBase] 🎬 Starting animation playback (after materials fully loaded)');
             isPlayingRef.current = true;
             if (!clockRef.current.running) clockRef.current.start();
             onPlay?.();
          }, 100);
        }

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
          // 清理 Composer
          if (composerRef.current) {
            composerRef.current.passes.forEach(pass => {
              if ((pass as any).dispose) (pass as any).dispose();
            });
            composerRef.current = null;
          }
          
          // 清理 OutlineEffect
          outlineEffectRef.current = null;

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
  }, [resources.modelPath, resources.motionPath, resources.stageModelPath, stage.enablePhysics, stage.physicsPath]); // 🎯 优化：音频路径变化不再触发完整重载

  // 🎯 独立处理音频加载，支持在不重载模型的情况下切换歌曲
  useEffect(() => {
    if (!audioListenerRef.current || !helperRef.current || !resources.audioPath) return;

    const listener = audioListenerRef.current;
    const helper = helperRef.current;
    
    // 1. 如果已有音频，先清理
    if (audioRef.current) {
      const oldSound = audioRef.current;
      if (oldSound.isPlaying) oldSound.stop();
      if (oldSound.parent) oldSound.parent.remove(oldSound);
      audioRef.current = null;
    }

    // 2. 加载新音频
    console.log('[MMDPlayerBase] Loading new audio track:', resources.audioPath);
    audioLoaderRef.current.load(
      resources.audioPath,
      (buffer) => {
        if (!audioListenerRef.current) return;
        
        const sound = new THREE.Audio(listener);
        sound.setBuffer(buffer);
        sound.setLoop(loopRef.current);
        sound.setVolume(volume);
        audioRef.current = sound;

        helper.add(sound, { 
          delay: 0.0, 
          duration: buffer.duration 
        } as any);
        
        console.log('[MMDPlayerBase] Audio track loaded successfully');
        
        if (isPlayingRef.current) {
          sound.play();
        }
      },
      undefined,
      (err) => console.error('[MMDPlayerBase] Failed to load audio track:', err)
    );
  }, [resources.audioPath, volume]);

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

  // 监听渲染特效配置变化
  useEffect(() => {
    if (outlineEffectRef.current) {
      // @ts-ignore
      outlineEffectRef.current.defaultThickness = outlineOptions.thickness ?? 0.003;
      // @ts-ignore
      outlineEffectRef.current.defaultColor = new THREE.Color(outlineOptions.color ?? '#000000').toArray();

      // 同步更新场景中所有现有材质的描边参数
      if (sceneRef.current) {
        sceneRef.current.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach((m) => {
              if (m.userData && m.userData.outlineParameters) {
                if (outlineOptions.thickness !== undefined) {
                  m.userData.outlineParameters.thickness = outlineOptions.thickness;
                }
                if (outlineOptions.color !== undefined) {
                  m.userData.outlineParameters.color = new THREE.Color(outlineOptions.color).toArray();
                }
              }
            });
          }
        });
      }
    }
    
    if (composerRef.current) {
      const bloomPass = composerRef.current.passes.find(p => p instanceof UnrealBloomPass) as UnrealBloomPass;
      if (bloomPass) {
        bloomPass.strength = bloomOptions.strength ?? 1.0;
        bloomPass.radius = bloomOptions.radius ?? 0.4;
        bloomPass.threshold = bloomOptions.threshold ?? 0.8;
      }
    }
  }, [outlineOptions.thickness, outlineOptions.color, bloomOptions.strength, bloomOptions.radius, bloomOptions.threshold]);

  // 监听三渲二(Toon)配置变化
  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m) => {
          if (m instanceof THREE.MeshPhongMaterial) {
            if (toonOptions.enabled !== false && (toonOptions.enabled || renderEffect.includes('outline'))) {
              m.shininess = toonOptions.shininess ?? 0;
              m.specular.setScalar(0);
              
              if (toonOptions.forceHardShading && (m as any).toonMap) {
                (m as any).toonMap.magFilter = THREE.NearestFilter;
                (m as any).toonMap.minFilter = THREE.NearestFilter;
                (m as any).toonMap.needsUpdate = true;
              }
            }
          }
        });
      }
    });
  }, [toonOptions.enabled, toonOptions.shininess, toonOptions.forceHardShading, renderEffect]);

  // 监听 stage 变化，动态更新场景属性（不触发完整重载）
  useEffect(() => {
    if (!isReadyRef.current) return;

    // 更新背景
    if (sceneRef.current) {
      if (stage.backgroundColor) {
        if (stage.backgroundColor === 'transparent') {
          sceneRef.current.background = null;
        } else {
          sceneRef.current.background = new THREE.Color(stage.backgroundColor);
        }
      } else if (stage.backgroundImage) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(stage.backgroundImage, (texture) => {
          if (sceneRef.current) sceneRef.current.background = texture;
        });
      }
    }

    // 更新灯光强度
    if (sceneRef.current) {
      sceneRef.current.traverse((obj) => {
        if (obj instanceof THREE.AmbientLight && stage.ambientLightIntensity !== undefined) {
          obj.intensity = stage.ambientLightIntensity;
        }
        if (obj instanceof THREE.DirectionalLight && stage.directionalLightIntensity !== undefined) {
          obj.intensity = stage.directionalLightIntensity;
        }
      });
    }

    // 更新相机和目标
    if (cameraRef.current && stage.cameraPosition) {
      const pos = stage.cameraPosition as any;
      cameraRef.current.position.set(pos.x, pos.y, pos.z);
    }
    if (controlsRef.current && stage.cameraTarget) {
      const target = stage.cameraTarget as any;
      controlsRef.current.target.set(target.x, target.y, target.z);
      controlsRef.current.update();
    }
  }, [stage.backgroundColor, stage.backgroundImage, stage.ambientLightIntensity, stage.directionalLightIntensity, stage.cameraPosition, stage.cameraTarget]);

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
        latestCallbacks.current.onTimeUpdate?.(currentTime);
        
        // 简单的结束检测（非循环模式）
        if (!loopRef.current && duration > 0 && elapsed >= duration) {
          isPlayingRef.current = false;
          clockRef.current.stop();
          latestCallbacks.current.onEnded?.();
        }
      }
      
      // 使用选定的渲染方式
      const useOutline = renderEffect === 'outline' || renderEffect === 'outline+bloom';
      const useBloom = renderEffect === 'bloom' || renderEffect === 'outline+bloom';

      if (useBloom && composerRef.current) {
        composerRef.current.render();
      } else if (useOutline && outlineEffectRef.current) {
        outlineEffectRef.current.render(sceneRef.current, cameraRef.current);
      } else {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
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
        position: 'relative', // 恢复 relative，作为 canvas 的定位容器
        backgroundColor: stage.backgroundColor === 'transparent' ? 'transparent' : (stage.backgroundColor || '#000'),
        ...style 
      }}
    />
  );
});

MMDPlayerBase.displayName = 'MMDPlayerBase';
