import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import * as THREE from 'three';
import {
  OrbitControls,
  MMDLoader,
  MMDAnimationHelper,
  OutlineEffect,
} from 'three-stdlib';

// 🚀 开启 Three.js 全局缓存，确保 CDN 资源在被浏览器缓存后，能直接从内存读取
if (typeof window !== 'undefined') {
  THREE.Cache.enabled = true;
}

import { loadAmmo } from '../utils/ammo-loader';
import { MMDPlayerBaseProps, MMDPlayerBaseRef } from '../types';
import { FXParser } from '../fx/FXParser';
import { FXToThreeAdapter } from '../fx/FXToThreeAdapter';
import { MultiFXAdapter } from '../fx/MultiFXAdapter';
import type { FXEffect } from '../fx/types';
import { configureMaterialsForMMD } from '../utils/mmd-loader-config';

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

  // 等待所有纹理的图像数据加载完成
  const texturePromises = textures.map((texture, index) => {
    return new Promise<void>((resolve) => {
      const image = texture.image;

      // 检查是否已经加载完成
      if (!image) {
        resolve();
        return;
      }

      if (image instanceof HTMLImageElement) {
        if (image.complete && image.naturalWidth > 0) {
          resolve();
        } else {
          // 等待图像加载
          const onLoad = () => {
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
        resolve();
      }
    });
  });

  await Promise.all(texturePromises);

  // 强制更新所有材质的纹理需要更新标志
  textures.forEach((texture) => {
    texture.needsUpdate = true;
  });

  // 执行一次渲染循环，确保所有纹理都上传到 GPU
  // 优化：从 3 次减少到 1 次，大部分情况下这就足够了
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
      } catch (renderError) {
        console.warn('[MMDPlayerBase] Warmup render failed (shader error?), skipping...', renderError);
      }
      resolve();
    });
  });
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
  const fxPath = props.fxPath || stage.fxPath;
  const fxTexturePath = props.fxTexturePath || stage.fxTexturePath;
  const fxConfigs = props.fxConfigs || stage.fxConfigs;

  // 容器 Ref
  const containerRef = useRef<HTMLDivElement>(null);

  // Three.js 对象 Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const outlineEffectRef = useRef<OutlineEffect | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const helperRef = useRef<any>(null); // MMDAnimationHelper
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null); // 坐标轴
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // 🎨 光源 Refs（用于调试面板）
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const sideLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemisphereLightRef = useRef<THREE.HemisphereLight | null>(null);
  const mmdMeshRef = useRef<THREE.SkinnedMesh | null>(null);

  // FX 相关 Refs
  const fxEffectRef = useRef<FXEffect | null>(null);
  const fxAdapterRef = useRef<FXToThreeAdapter | null>(null);
  const multiFXAdapterRef = useRef<MultiFXAdapter | null>(null); // 多FX适配器

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

  // 🎯 新增：存储原始 Ammo 构造函数，以便在清理时恢复
  // 防止无限递归 Monkey-patch
  const originalAmmoMethodsRef = useRef<{
    btDefaultCollisionConfiguration?: any;
    btCollisionDispatcher?: any;
    btDbvtBroadphase?: any;
    btSequentialImpulseConstraintSolver?: any;
    btDiscreteDynamicsWorld?: any;
  }>({});

  // 🕐 运行时间追踪 - 用于 OOM 错误报告
  const startTimeRef = useRef<number>(Date.now());
  const modelSwitchCountRef = useRef<number>(0);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    play: () => {
      if (!isReadyRef.current) return;
      console.log('[MMDPlayerBase] play() called, audioRef:', !!audioRef.current, 'isPlaying:', audioRef.current?.isPlaying);
      isPlayingRef.current = true;
      if (!clockRef.current.running) clockRef.current.start();

      // 🎵 如果音频已加载但未播放，触发播放
      if (audioRef.current && !audioRef.current.isPlaying) {
        console.log('[MMDPlayerBase] Starting audio playback from play()');
        audioRef.current.play();
      }

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
      } else {
        // 模型切换
        modelSwitchCountRef.current++;
      }

      try {
        // 4. 物理引擎加载
        if (stage.enablePhysics !== false && !mobileOptimization.disablePhysics) {
          await loadAmmo(stage.physicsPath);
          if (checkCancelled()) return;

          // 🎯 关键修复：Hook MMDPhysics._createWorld 以捕获物理引擎组件
          // 这样我们可以在清理时正确销毁它们，防止 WASM 内存泄漏
          const Ammo = (window as any).Ammo;
          if (Ammo) {
            // 🔒 1. 备份原始构造函数 (如果还没有备份)
            // 注意：我们必须检查 current 是否为空，以防多次 init 覆盖了原始备份
            if (!originalAmmoMethodsRef.current.btDefaultCollisionConfiguration) {
              originalAmmoMethodsRef.current = {
                btDefaultCollisionConfiguration: Ammo.btDefaultCollisionConfiguration,
                btCollisionDispatcher: Ammo.btCollisionDispatcher,
                btDbvtBroadphase: Ammo.btDbvtBroadphase,
                btSequentialImpulseConstraintSolver: Ammo.btSequentialImpulseConstraintSolver,
                btDiscreteDynamicsWorld: Ammo.btDiscreteDynamicsWorld
              };
            }

            // 获取原始引用 (优先从备份中获取，确保我们使用的是"干净"的版本)
            const originals = originalAmmoMethodsRef.current;

            // ⚠️ 关键修改：使用数组来保存所有对象
            const componentsRef = physicsComponentsRef.current;

            // 🔒 2. 应用 Monkey Patch
            // 每次创建对象时，将其添加到我们的追踪数组中

            Ammo.btDefaultCollisionConfiguration = function (...args: any[]) {
              // @ts-ignore
              const obj = new originals.btDefaultCollisionConfiguration(...args);
              componentsRef.configs.push(obj);
              return obj;
            };

            Ammo.btCollisionDispatcher = function (...args: any[]) {
              // @ts-ignore
              const obj = new originals.btCollisionDispatcher(...args);
              componentsRef.dispatchers.push(obj);
              return obj;
            };

            Ammo.btDbvtBroadphase = function (...args: any[]) {
              // @ts-ignore
              const obj = new originals.btDbvtBroadphase(...args);
              componentsRef.caches.push(obj);
              return obj;
            };

            Ammo.btSequentialImpulseConstraintSolver = function (...args: any[]) {
              // @ts-ignore
              const obj = new originals.btSequentialImpulseConstraintSolver(...args);
              componentsRef.solvers.push(obj);
              return obj;
            };

            Ammo.btDiscreteDynamicsWorld = function (...args: any[]) {
              // @ts-ignore
              const obj = new originals.btDiscreteDynamicsWorld(...args);
              componentsRef.worlds.push(obj);
              return obj;
            };
          }
        }

        // 5. 场景初始化
        const container = containerRef.current!;
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 150;

        // 创建场景
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

        // 🎨 渲染器色调映射和颜色空间设置（使用 NoToneMapping 保持原始颜色）
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.NoToneMapping;  // 使用 NoToneMapping 保持原始颜色
        renderer.toneMappingExposure = 1.4;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

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

        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 音频监听器
        const listener = new THREE.AudioListener();
        camera.add(listener);
        audioListenerRef.current = listener;
        // 🎯 注释掉 OutlineEffect（简化渲染，与 demo 保持一致）
        const effect = new OutlineEffect(renderer, {
          defaultThickness: outlineOptions.thickness ?? 0.003,
          defaultColor: new THREE.Color(outlineOptions.color ?? '#000000').toArray(),
          defaultAlpha: 1,
          defaultKeepAlive: true
        });
        outlineEffectRef.current = effect;

        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);

        // 主方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.0001;
        scene.add(directionalLight);

        // 侧面补光
        const sideLight = new THREE.DirectionalLight(0xffffff, 0.5);
        sideLight.position.set(-3, 8, 8);
        scene.add(sideLight);

        // 半球光
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 0.6);
        scene.add(hemisphereLight);

        // Controls（与 demo 保持一致的配置）
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 5;  // 与 demo 一致
        controls.maxDistance = 50;  // 与 demo 一致
        if (stage.cameraTarget) {
          const target = stage.cameraTarget as any;
          controls.target.set(target.x, target.y, target.z);
        } else {
          controls.target.set(0, 10, 0);  // 与 demo 一致
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
        };

        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(container);
        resizeObserverRef.current = resizeObserver;

        // 立即执行一次 Resize
        onResize();

        // 🎯 提前启动渲染循环（但不播放动画）
        // 这样可以在加载过程中显示场景，但动画要等完全准备好才开始
        animate();

        // 6. 资源加载
        const loader = new MMDLoader();
        const helper = new MMDAnimationHelper({
          afterglow: 2.0
        });
        helperRef.current = helper;

        // 6.1 加载模型和动作
        const loadModelPromise = new Promise<{ mesh: THREE.SkinnedMesh, animation?: THREE.AnimationClip }>((resolve, reject) => {
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
        //关键修改:加载好mmd mesh 后直接设置属性并优化材质,可以解决光照过强的问题
        // 设置模型基础属性（与 demo 一致）
        mesh.castShadow = true;      // 模型投射阴影
        mesh.receiveShadow = stage.modelReceiveShadow ?? true;  // 模型接收阴影（默认 true，与 demo 一致）

        // 🎨 应用MMD材质优化（添加渐变贴图等）
        configureMaterialsForMMD(mesh, {
          enableGradientMap: true,
          shininess: 50,
          specularColor: 0x888888,
        });

        // 关键检查点：资源加载耗时较长，再次检查是否已失效
        if (checkCancelled()) return;

        // 保存模型引用供调试面板使用
        mmdMeshRef.current = mesh;

        // 保存动画时长
        if (animation) {
          animationClipRef.current = animation;
          durationRef.current = animation.duration;
        }

        // 创建一个临时场景来等待纹理加载（不影响主场景）
        const tempScene = new THREE.Scene();
        tempScene.add(mesh);
        await waitForMaterialsReady(mesh, renderer, tempScene, camera);

        if (checkCancelled()) return;

        // 从临时场景移除
        tempScene.remove(mesh);

        // 🎯 现在所有纹理都已加载完成，添加到场景和 helper
        const enablePhysics = stage.enablePhysics !== false && !mobileOptimization.disablePhysics;
        scene.add(mesh);
        helper.add(mesh, {
          animation: animation,
          physics: enablePhysics
        });


        // 🎯 自动降级系统 - 针对移动设备优化
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          (window.innerWidth <= 768);

        if (isMobileDevice) {
          console.log('[MMDPlayerBase] 📱 Mobile device detected, applying optimizations...');

          // 方案 A: 使用骨骼纹理（如果支持）
          if (!renderer.capabilities.vertexTextures) {
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

          // 方案 C: 限制骨骼数量（检查并警告）
          const MAX_BONES = 64;
          if (mesh.skeleton) {
            const boneCount = mesh.skeleton.bones.length;
            if (boneCount > MAX_BONES) {
              console.warn(`[MMDPlayerBase]   ⚠️ Model has ${boneCount} bones (max recommended: ${MAX_BONES})`);
              console.warn(`[MMDPlayerBase]   This may cause performance issues on mobile devices`);
            }
          }
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
            console.log('[MMDPlayerBase] 🎨 Traversing stage mesh to apply FX, multiFX:', !!multiFXAdapterRef.current, 'singleFX:', !!fxAdapterRef.current);
            let stageMaterialCount = 0;
            stageMesh.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = false;     // 🎯 舞台不投射阴影
                child.receiveShadow = true;   // 舞台接收阴影（模型投射到地面的阴影）

                const mesh = child as THREE.Mesh;
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                stageMaterialCount += materials.length;

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

                  // 🎨 应用FX材质配置到舞台（如果有）
                  // 支持MeshPhongMaterial和MeshToonMaterial（MMD常用）
                  if (m instanceof THREE.MeshPhongMaterial || m instanceof THREE.MeshToonMaterial) {
                    console.log('[MMDPlayerBase] 🎨 Applying FX to stage material (type:', m.type, '), multiFX:', !!multiFXAdapterRef.current, 'singleFX:', !!fxAdapterRef.current);
                    // // 优先使用多FX适配器
                    // if (multiFXAdapterRef.current) {
                    //   console.log('[MMDPlayerBase] Using MultiFXAdapter for stage');
                    //   multiFXAdapterRef.current.applyToMaterial(m, 'stage');
                    // } else if (fxAdapterRef.current) {
                    //   console.log('[MMDPlayerBase] Using single FXAdapter for stage');
                    //   // 回退到单FX适配器
                    //   const materialConfig = fxAdapterRef.current.extractMaterialConfig();

                    //   // 🔍 调试：打印提取的配置
                    //   console.log('[MMDPlayerBase] Extracted material config for stage:');
                    //   console.log('  - color:', materialConfig.color);
                    //   console.log('  - emissive:', materialConfig.emissive);
                    //   console.log('  - specular:', materialConfig.specular);
                    //   console.log('  - shininess:', materialConfig.shininess);

                    //   // 🎯 应用颜色（跳过纯黑色，避免覆盖原有材质）
                    //   if (materialConfig.color) {
                    //     const isBlack = materialConfig.color.r === 0 && materialConfig.color.g === 0 && materialConfig.color.b === 0;
                    //     if (!isBlack) {
                    //       m.color.copy(materialConfig.color);
                    //       console.log('[MMDPlayerBase] Applied color to stage:', materialConfig.color);
                    //     } else {
                    //       console.log('[MMDPlayerBase] Skipping black color (0,0,0) for stage to preserve original material');
                    //     }
                    //   }

                    //   // // 🎯 应用发光颜色（跳过纯黑色）
                    //   // if (materialConfig.emissive) {
                    //   //   const isBlack = materialConfig.emissive.r === 0 && materialConfig.emissive.g === 0 && materialConfig.emissive.b === 0;
                    //   //   if (!isBlack) {
                    //   //     m.emissive.copy(materialConfig.emissive);
                    //   //     console.log('[MMDPlayerBase] Applied emissive to stage:', materialConfig.emissive);
                    //   //   }
                    //   // }

                    //   // // 应用高光
                    //   // if (materialConfig.specular && (m as any).specular) {
                    //   //   (m as any).specular.copy(materialConfig.specular);
                    //   //   console.log('[MMDPlayerBase] Applied specular to stage:', materialConfig.specular);
                    //   // }

                    //   // // 应用光泽度
                    //   // if (materialConfig.shininess !== undefined && (m as any).shininess !== undefined) {
                    //   //   console.log('[MMDPlayerBase] Applying shininess to stage:', materialConfig.shininess);
                    //   //   (m as any).shininess = materialConfig.shininess;
                    //   // }
                    // }
                  } else {
                    console.log('[MMDPlayerBase] Stage material type not supported for FX:', m.type);
                  }
                });
              }
            });
            console.log('[MMDPlayerBase] 🎨 Stage traverse complete, processed materials:', stageMaterialCount);

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
        onLoad?.();

        if (autoPlay) {
          // 给一点时间让渲染系统稳定，然后开始播放动画
          setTimeout(() => {
            if (checkCancelled()) return;
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
              // 🎯 关键修复：从 WeakMap 中获取真正的 meshData
              let meshData: any = null;

              if (helperObjects instanceof WeakMap) {
                meshData = helperObjects.get(mesh);
              }

              // 如果没有从 WeakMap 获取到，使用 mesh 本身作为 fallback
              if (!meshData) {
                meshData = mesh;
              }

              // 清理物理系统 - 从 meshData 中获取
              const physics = meshData?.physics;

              if (physics) {
                try {
                  // 优先使用 MMDPhysics.dispose() 方法（three-stdlib 提供的标准清理方法）
                  if (typeof physics.dispose === 'function') {
                    physics.dispose();
                  } else {
                    // 手动清理物理组件
                    const Ammo = (window as any).Ammo;
                    if (!Ammo || !Ammo.destroy) {
                      console.warn('[MMDPlayerBase]   ⚠️ Ammo.destroy not available');
                    } else {
                      // 清理刚体
                      if (physics.world && Array.isArray(physics.bodies) && physics.bodies.length > 0) {
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
                      }

                      // 清理约束
                      if (physics.world && Array.isArray(physics.constraints) && physics.constraints.length > 0) {
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
                      }

                      // 注意：不在这里销毁 world，因为它会在后面统一清理
                    }
                  }

                  // 清除引用
                  meshData.physics = null;
                } catch (physicsError) {
                  console.error('[MMDPlayerBase] ❌ Error cleaning up physics:', physicsError);
                  console.error('[MMDPlayerBase] Physics error stack:', (physicsError as Error).stack);
                }
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
          const Ammo = (window as any).Ammo;
          if (Ammo && Ammo.destroy) {
            const components = physicsComponentsRef.current;

            // 按照正确的顺序销毁 Ammo 对象（与创建顺序相反）
            // 创建顺序：config -> dispatcher -> cache -> solver -> world
            // 销毁顺序：world -> solver -> cache -> dispatcher -> config

            // 销毁所有 worlds
            if (components.worlds.length > 0) {
              for (let i = components.worlds.length - 1; i >= 0; i--) {
                try {
                  Ammo.destroy(components.worlds[i]);
                } catch (e) {
                  console.error(`[MMDPlayerBase]   ❌ Error destroying world #${i}:`, e);
                }
              }
              components.worlds.length = 0;
            }

            // 销毁所有 solvers
            if (components.solvers.length > 0) {
              for (let i = components.solvers.length - 1; i >= 0; i--) {
                try {
                  Ammo.destroy(components.solvers[i]);
                } catch (e) {
                  console.error(`[MMDPlayerBase]   ❌ Error destroying solver #${i}:`, e);
                }
              }
              components.solvers.length = 0;
            }

            // 销毁所有 caches
            if (components.caches.length > 0) {
              for (let i = components.caches.length - 1; i >= 0; i--) {
                try {
                  Ammo.destroy(components.caches[i]);
                } catch (e) {
                  console.error(`[MMDPlayerBase]   ❌ Error destroying cache #${i}:`, e);
                }
              }
              components.caches.length = 0;
            }

            // 销毁所有 dispatchers
            if (components.dispatchers.length > 0) {
              for (let i = components.dispatchers.length - 1; i >= 0; i--) {
                try {
                  Ammo.destroy(components.dispatchers[i]);
                } catch (e) {
                  console.error(`[MMDPlayerBase]   ❌ Error destroying dispatcher #${i}:`, e);
                }
              }
              components.dispatchers.length = 0;
            }

            // 销毁所有 configs
            if (components.configs.length > 0) {
              for (let i = components.configs.length - 1; i >= 0; i--) {
                try {
                  Ammo.destroy(components.configs[i]);
                } catch (e) {
                  console.error(`[MMDPlayerBase]   ❌ Error destroying config #${i}:`, e);
                }
              }
              components.configs.length = 0;
            }
          } else {
            console.warn('[MMDPlayerBase] ⚠️ Ammo.destroy not available, skipping physics cleanup');
          }

          // 清理 sharedPhysics 和 masterPhysics（如果存在）
          if ((helperRef.current as any).sharedPhysics) {
            (helperRef.current as any).sharedPhysics = null;
          }
          if ((helperRef.current as any).masterPhysics) {
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
          // 清理 OutlineEffect
          outlineEffectRef.current = null;

          // 清理 FX 资源
          if (multiFXAdapterRef.current) {
            multiFXAdapterRef.current.clear();
            multiFXAdapterRef.current = null;
          }
          fxEffectRef.current = null;
          fxAdapterRef.current = null;

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

      // 🎯 关键修复：还原全局 Ammo 对象，防止内存泄漏和性能下降
      const Ammo = (window as any).Ammo;
      if (Ammo && originalAmmoMethodsRef.current.btDefaultCollisionConfiguration) {
        console.log('[MMDPlayerBase] Restoring original Ammo methods');
        const originals = originalAmmoMethodsRef.current;

        if (originals.btDefaultCollisionConfiguration) Ammo.btDefaultCollisionConfiguration = originals.btDefaultCollisionConfiguration;
        if (originals.btCollisionDispatcher) Ammo.btCollisionDispatcher = originals.btCollisionDispatcher;
        if (originals.btDbvtBroadphase) Ammo.btDbvtBroadphase = originals.btDbvtBroadphase;
        if (originals.btSequentialImpulseConstraintSolver) Ammo.btSequentialImpulseConstraintSolver = originals.btSequentialImpulseConstraintSolver;
        if (originals.btDiscreteDynamicsWorld) Ammo.btDiscreteDynamicsWorld = originals.btDiscreteDynamicsWorld;

        // 清空备份引用
        originalAmmoMethodsRef.current = {};
      }

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

        if (isPlayingRef.current) {
          sound.play();
        }
      },
      undefined,
      (err) => console.error('[MMDPlayerBase] Failed to load audio track:', err)
    );
  }, [resources.audioPath, volume]);

  // 监听 showAxes 变化，动态添加/移除坐标轴
  // 坐标轴动态切换
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
  }, [outlineOptions.thickness, outlineOptions.color]);

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
      // sceneRef.current.traverse((obj) => {
      //   if (obj instanceof THREE.AmbientLight && stage.ambientLightIntensity !== undefined) {
      //     obj.intensity = stage.ambientLightIntensity;
      //   }
      //   if (obj instanceof THREE.DirectionalLight) {
      //     if (stage.directionalLightIntensity !== undefined) {
      //       obj.intensity = stage.directionalLightIntensity;
      //     }
      //     // 更新方向光位置
      //     if (stage.directionalLightPosition) {
      //       const pos = stage.directionalLightPosition as any;
      //       obj.position.set(pos.x, pos.y, pos.z);
      //     }
      //   }
      //   if (obj instanceof THREE.HemisphereLight && stage.hemisphereLightIntensity !== undefined) {
      //     obj.intensity = stage.hemisphereLightIntensity;
      //     // 更新半球光颜色
      //     if (stage.hemisphereLightSkyColor !== undefined) {
      //       obj.color.set(stage.hemisphereLightSkyColor as any);
      //     }
      //     if (stage.hemisphereLightGroundColor !== undefined) {
      //       obj.groundColor.set(stage.hemisphereLightGroundColor as any);
      //     }
      //   }
      // });
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
  }, [
    stage.backgroundColor,
    stage.backgroundImage,
    stage.ambientLightIntensity,
    stage.directionalLightIntensity,
    stage.directionalLightPosition,
    stage.hemisphereLightIntensity,
    stage.hemisphereLightSkyColor,
    stage.hemisphereLightGroundColor,
    stage.cameraPosition,
    stage.cameraTarget
  ]);

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

      // 简化渲染（与 demo 一致，不使用 OutlineEffect）
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
        backgroundColor: stage.backgroundColor === 'transparent' ? 'transparent' : (stage.backgroundColor || '#000'),
        ...style
      }}
    />
  );
});

MMDPlayerBase.displayName = 'MMDPlayerBase';
