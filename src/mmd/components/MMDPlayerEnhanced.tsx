'use client';

import React, { useRef, useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls, MMDLoader, MMDAnimationHelper } from 'three-stdlib';
import type { MMDPlayerEnhancedProps } from '../types';
import { loadAmmo } from '../utils/ammo-loader';

/**
 * 增强版 MMD 播放器组件
 * 支持通过 resources 和 stage 配置快速使用
 * 所有资源均从 public 目录加载，无需额外配置
 */
export const MMDPlayerEnhanced = forwardRef<any, MMDPlayerEnhancedProps>(({
  resources,
  resourcesList,
  defaultResourceId,
  resourceOptions,
  defaultSelection,
  stage,
  autoPlay = false,
  loop = false,
  className = '',
  style,
  onLoad,
  onError,
  onResourceChange,
  onSelectionChange,
  onAudioEnded,
  onAnimationEnded,
}, ref) => {
  console.log('🎨 [MMDPlayerEnhanced] 组件初始化')
  
  // 资源切换状态（resourcesList 模式）
  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    defaultResourceId || resourcesList?.[0]?.id || ''
  );
  
  // 资源选择状态（resourceOptions 模式）
  const [selectedModelId, setSelectedModelId] = useState<string>(
    defaultSelection?.modelId || resourceOptions?.models?.[0]?.id || ''
  );
  const [selectedMotionId, setSelectedMotionId] = useState<string>(
    defaultSelection?.motionId || ''
  );
  const [selectedAudioId, setSelectedAudioId] = useState<string>(
    defaultSelection?.audioId || ''
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string>(
    defaultSelection?.cameraId || ''
  );
  const [selectedStageModelId, setSelectedStageModelId] = useState<string>(
    defaultSelection?.stageModelId || ''
  );
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>(
    defaultSelection?.backgroundId || ''
  );
  
  const [showSettings, setShowSettings] = useState(false);
  
  // 下拉菜单展开状态
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // 计算当前使用的资源
  const currentResources = useMemo(() => {
    // 模式1: resourceOptions（下拉框独立选择）
    if (resourceOptions) {
      const model = resourceOptions.models?.find(m => m.id === selectedModelId);
      const motion = resourceOptions.motions?.find(m => m.id === selectedMotionId);
      const audio = resourceOptions.audios?.find(a => a.id === selectedAudioId);
      const camera = resourceOptions.cameras?.find(c => c.id === selectedCameraId);
      const stageModel = resourceOptions.stageModels?.find(s => s.id === selectedStageModelId);
      const background = resourceOptions.backgrounds?.find(b => b.id === selectedBackgroundId);
      
      return {
        modelPath: model?.path || resourceOptions.models?.[0]?.path || '',
        motionPath: motion?.path,
        audioPath: audio?.path,
        cameraPath: camera?.path,
        stageModelPath: stageModel?.path,
        backgroundPath: background?.path,
      };
    }
    
    // 模式2: resourcesList（预设组合）
    if (resourcesList && resourcesList.length > 0) {
      const selected = resourcesList.find(r => r.id === selectedResourceId);
      const resourceItem = selected || resourcesList[0];
      if (!resourceItem) {
        throw new Error('无法找到有效的资源配置');
      }
      return resourceItem.resources;
    }
    
    // 模式3: resources（单资源）
    if (!resources) {
      throw new Error('必须提供 resources、resourcesList 或 resourceOptions');
    }
    return resources;
  }, [
    resources, 
    resourcesList, 
    selectedResourceId,
    resourceOptions,
    selectedModelId,
    selectedMotionId,
    selectedAudioId,
    selectedCameraId,
    selectedStageModelId,
    selectedBackgroundId,
  ]);

  console.log('📂 [MMDPlayerEnhanced] 当前资源配置:', currentResources)
  console.log('🎭 [MMDPlayerEnhanced] 舞台配置:', stage)
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const helperRef = useRef<MMDAnimationHelper | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false); // 用 ref 存储播放状态，避免闭包问题
  const isLoadedRef = useRef<boolean>(false); // 标记资源是否已加载
  const shouldAutoPlayAfterReloadRef = useRef<boolean>(false); // 标记重新加载后是否自动播放
  const vmdDataRef = useRef<{ mesh: any; vmd: any; cameraVmd: any } | null>(null); // 保存动画数据用于重置
  const animationDurationRef = useRef<number>(0); // 动画时长（秒）
  const hasAudioRef = useRef<boolean>(false); // 是否有音频
  const animationEndedFiredRef = useRef<boolean>(false); // 标记动画结束回调是否已触发
  const lastAnimationTimeRef = useRef<number>(0); // 上一帧的动画时间
  const animationStoppedCountRef = useRef<number>(0); // 动画停止的帧数计数

  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0); // 用于触发重新加载
  const [needReset, setNeedReset] = useState(false); // 标记是否需要重置（改用 state）

  // 暴露清理方法给父组件调用
  useImperativeHandle(ref, () => ({
    clearResources: () => {
      console.log('🧹 [MMDPlayerEnhanced] 外部触发资源清理');
      clearOldResources();
    },
    getIsPlaying: () => isPlayingRef.current,
    getIsLoaded: () => isLoadedRef.current,
    stopCompletely: () => {
      console.log('⏹️ [MMDPlayerEnhanced] 完全停止');
      stopCompletely();
    },
  }));

  // 完全停止方法（不清理资源，只停止运行）
  const stopCompletely = () => {
    // 1. 停止播放状态
    isPlayingRef.current = false;
    setIsPlaying(false);

    // 2. 停止音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 3. 停止物理引擎更新（关键）
    if (helperRef.current) {
      helperRef.current.enable('physics', false);
    }

    // 4. 重置动画状态
    animationEndedFiredRef.current = false;
    lastAnimationTimeRef.current = 0;
    animationStoppedCountRef.current = 0;

    console.log('✅ [MMDPlayerEnhanced] 完全停止完成');
  };

  // 监听来自父组件的清理和停止事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleCleanupResources = () => {
      console.log('🧹 [MMDPlayerEnhanced] 收到清理资源事件');
      // 只在非播放状态时清理资源
      if (!isPlayingRef.current) {
        clearOldResources();
      } else {
        console.warn('⚠️ [MMDPlayerEnhanced] 播放中，跳过资源清理');
      }
    };

    const handleStopCompletely = () => {
      console.log('⏹️ [MMDPlayerEnhanced] 收到完全停止事件');
      stopCompletely();
    };

    container.addEventListener('cleanupResources', handleCleanupResources);
    container.addEventListener('stopCompletely', handleStopCompletely);

    return () => {
      container.removeEventListener('cleanupResources', handleCleanupResources);
      container.removeEventListener('stopCompletely', handleStopCompletely);
    };
  }, []);

  // 初始化场景
  useEffect(() => {
    console.log('🏗️ [MMDPlayerEnhanced] 场景初始化 useEffect 触发')
    if (!containerRef.current) {
      console.warn('⚠️ [MMDPlayerEnhanced] containerRef.current 不存在')
      return
    }

    console.log('✅ [MMDPlayerEnhanced] 容器元素存在，开始初始化场景')
    const container = containerRef.current;
    
    // 防止重复初始化
    if (container.children.length > 0) {
      console.log('⚠️ [MMDPlayerEnhanced] 场景已经初始化，跳过')
      return
    }
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(stage?.backgroundColor || '#000000');
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    const camPos = stage?.cameraPosition || { x: 0, y: 10, z: 30 };
    camera.position.set(camPos.x, camPos.y, camPos.z);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 添加光源
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 添加网格（可选）
    if (stage?.showGrid !== false) {
      const gridHelper = new THREE.PolarGridHelper(30, 10);
      scene.add(gridHelper);
    }

    // 创建控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    const target = stage?.cameraTarget || { x: 0, y: 10, z: 0 };
    controls.target.set(target.x, target.y, target.z);
    controls.update();
    controlsRef.current = controls;

    // 处理窗口大小变化
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // 开始动画循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // 只在播放状态时更新动画
      if (helperRef.current && isPlayingRef.current) {
        const delta = clockRef.current.getDelta();
        
        // 防止物理更新时出现OOM
        try {
          helperRef.current.update(delta);
        } catch (error: any) {
          if (error.message && error.message.includes('OOM')) {
            console.error('❌ 物理引擎内存溢出，停止播放');
            isPlayingRef.current = false;
            setIsPlaying(false);
            onError?.(new Error('物理引擎内存溢出'));
            return;
          }
          throw error;
        }

        // 检测动画是否结束（仅在没有音频时）
        if (!hasAudioRef.current && !loop && !animationEndedFiredRef.current) {
          const currentTime = clockRef.current.getElapsedTime();
          
          // 方法1: 使用动画时长判定（如果有的话）
          if (animationDurationRef.current > 0) {
            if (currentTime >= animationDurationRef.current - 0.1) {
              console.log('🎬 [MMDPlayerEnhanced] 动画播放结束（时长判定）');
              animationEndedFiredRef.current = true;
              isPlayingRef.current = false;
              setIsPlaying(false);
              onAnimationEnded?.();
            }
          } 
          // 方法2: 检测动画是否停止变化（备用方案）
          else {
            // 检查动画时间是否停止增长
            if (Math.abs(currentTime - lastAnimationTimeRef.current) < 0.001) {
              animationStoppedCountRef.current++;
              // 连续30帧（约0.5秒）动画时间不变，认为动画已结束
              if (animationStoppedCountRef.current > 30) {
                console.log('🎬 [MMDPlayerEnhanced] 动画播放结束（停止检测）');
                animationEndedFiredRef.current = true;
                isPlayingRef.current = false;
                setIsPlaying(false);
                onAnimationEnded?.();
              }
            } else {
              animationStoppedCountRef.current = 0;
            }
            lastAnimationTimeRef.current = currentTime;
          }
        }
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    animate();
    
    // 标记场景已初始化
    setIsInitialized(true);
    console.log('✅ [MMDPlayerEnhanced] 场景初始化完成');

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          container.removeChild(renderer.domElement);
        }
      }
      if (controls) {
        controls.dispose();
      }
    };
  }, [stage]);

  // 清除旧资源（增强版：更彻底的内存清理）
  const clearOldResources = () => {
    if (!sceneRef.current) return;

    // 停止播放
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }

    // 停止并清理音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.src = ''; // 释放音频资源
      audioRef.current.load(); // 强制卸载
      audioRef.current = null;
    }

    // ⚠️ 关键修复：完全清除 helper 中的所有对象和物理系统
    if (helperRef.current) {
      try {
        // 1. 停用所有系统
        helperRef.current.enable('animation', false);
        helperRef.current.enable('ik', false);
        helperRef.current.enable('grant', false);
        helperRef.current.enable('physics', false);

        // 2. 深度清理物理系统（防止 OOM）
        const helperObjects = (helperRef.current as any).objects;
        if (helperObjects && Array.isArray(helperObjects)) {
          // 收集所有物理世界引用，用于最后销毁
          const physicsWorldsToDestroy = new Set<any>();
          
          helperObjects.forEach((obj: any) => {
            if (obj.physics) {
              try {
                const physics = obj.physics;
                
                // 记录物理世界，稍后统一销毁
                if (physics.world) {
                  physicsWorldsToDestroy.add(physics.world);
                }
                
                // 清理刚体
                if (physics.bodies && Array.isArray(physics.bodies)) {
                  physics.bodies.forEach((body: any) => {
                    if (physics.world && body) {
                      try {
                        physics.world.removeRigidBody(body);
                        // Ammo.js 对象需要手动销毁
                        if ((window as any).Ammo && body.destroy) {
                          body.destroy();
                        }
                      } catch (e) {}
                    }
                  });
                  physics.bodies.length = 0;
                  physics.bodies = null;
                }
                
                // 清理约束
                if (physics.constraints && Array.isArray(physics.constraints)) {
                  physics.constraints.forEach((constraint: any) => {
                    if (physics.world && constraint) {
                      try {
                        physics.world.removeConstraint(constraint);
                        if ((window as any).Ammo && constraint.destroy) {
                          constraint.destroy();
                        }
                      } catch (e) {}
                    }
                  });
                  physics.constraints.length = 0;
                  physics.constraints = null;
                }
                
                // 调用 reset 并销毁
                if (physics.reset) physics.reset();
                physics.world = null;
                obj.physics = null;
              } catch (e) {
                console.warn('清理物理系统失败:', e);
              }
            }
          });
          
          // 🔥 关键：销毁所有 Ammo.js 物理世界
          physicsWorldsToDestroy.forEach((world) => {
            try {
              // 移除所有剩余的碰撞对象
              while (world.getNumCollisionObjects() > 0) {
                const obj = world.getCollisionObjectArray().at(0);
                world.removeCollisionObject(obj);
                if (obj && obj.destroy) {
                  obj.destroy();
                }
              }
              
              // 销毁世界本身
              if (world.destroy) {
                world.destroy();
              }
            } catch (e) {
              console.warn('销毁物理世界失败:', e);
            }
          });
          
          // 清空对象数组
          helperObjects.length = 0;
        }
      } catch (error) {
        console.warn('清理 helper 失败:', error);
      }
      
      helperRef.current = null;
    }

    // 清除场景背景和环境贴图
    if (sceneRef.current.background && (sceneRef.current.background as any).isTexture) {
      (sceneRef.current.background as THREE.Texture).dispose();
      sceneRef.current.background = null;
    }
    if (sceneRef.current.environment && (sceneRef.current.environment as any).isTexture) {
      (sceneRef.current.environment as THREE.Texture).dispose();
      sceneRef.current.environment = null;
    }

    // 清除场景中的所有 MMD 对象
    const objectsToRemove: THREE.Object3D[] = [];
    sceneRef.current.traverse((child) => {
      if (child.type === 'SkinnedMesh' || (child as any).isSkinnedMesh) {
        objectsToRemove.push(child);
      }
      if (child.type === 'Mesh' && child !== sceneRef.current) {
        objectsToRemove.push(child);
      }
    });

    objectsToRemove.forEach((obj) => {
      if (obj.parent) obj.parent.remove(obj);

      // 清理 geometry
      if ((obj as any).geometry) {
        (obj as any).geometry.dispose();
      }

      // 清理 material 和所有贴图
      if ((obj as any).material) {
        const disposeMaterial = (m: any) => {
          ['map', 'emissiveMap', 'normalMap', 'bumpMap', 'specularMap', 
           'envMap', 'lightMap', 'aoMap', 'alphaMap'].forEach(prop => {
            if (m[prop]) m[prop].dispose();
          });
          m.dispose();
        };

        const material = (obj as any).material;
        if (Array.isArray(material)) {
          material.forEach(disposeMaterial);
        } else {
          disposeMaterial(material);
        }
      }

      // 清理骨骼
      if ((obj as any).skeleton) {
        (obj as any).skeleton = null;
      }
    });

    // 重置时钟和数据
    clockRef.current = new THREE.Clock();
    vmdDataRef.current = null;
    setNeedReset(false);

    // 强制垃圾回收提示（浏览器会在合适时机执行）
    if ((window as any).gc) {
      try {
        (window as any).gc();
      } catch (e) {
        // gc() 可能不可用
      }
    }

    console.log(`✅ 资源清理完成 (${objectsToRemove.length} 个对象)`);
  };

  // 加载MMD资源
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current) return;
    if (isLoadedRef.current) return;
    
    // 清除旧资源
    clearOldResources();
    
    // 标记为正在加载
    isLoadedRef.current = true;
    const loadMMD = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);

        // 重置动画相关标记
        animationDurationRef.current = 0;
        hasAudioRef.current = false;
        animationEndedFiredRef.current = false;
        lastAnimationTimeRef.current = 0;
        animationStoppedCountRef.current = 0;

        // 如果启用物理，先加载 Ammo.js
        if (stage?.enablePhysics !== false) {
          setLoadingProgress(5);
          await loadAmmo({
            scriptPath: stage?.ammoPath || '/mikutalking/libs/ammo.wasm.js',
            wasmBasePath: stage?.ammoWasmPath || '/mikutalking/libs/',
          });
        }

        // 创建 LoadingManager 来处理贴图路径
        const manager = new THREE.LoadingManager();
        const basePath = currentResources.modelPath.substring(0, currentResources.modelPath.lastIndexOf('/') + 1);
        
        manager.setURLModifier((url: string) => {
          if (url.startsWith('http://') || url.startsWith('https://')) return url;
          if (url.startsWith('/')) return url;
          return basePath + url;
        });

        const loader = new MMDLoader(manager);
        const helper = new MMDAnimationHelper();
        helperRef.current = helper;

        // 加载模型
        setLoadingProgress(20);
        const modelStartTime = performance.now();
        const mesh = await new Promise<any>((resolve, reject) => {
          loader.load(
            currentResources.modelPath,
            (object: any) => {
              const loadTime = ((performance.now() - modelStartTime) / 1000).toFixed(2);
              console.log(`✅ 模型加载完成 (${loadTime}s)`);
              resolve(object);
            },
            (progress: any) => {
              if (progress.total > 0) {
                setLoadingProgress(Math.min((progress.loaded / progress.total) * 30 + 20, 50));
              }
            },
            (error: any) => {
              console.error('❌ 模型加载失败:', error);
              reject(error);
            }
          );
        });

        if (!sceneRef.current) {
          throw new Error('场景未初始化');
        }

        sceneRef.current.add(mesh);

        // 加载场景模型
        if (currentResources.stageModelPath) {
          const stageMesh = await new Promise<any>((resolve, reject) => {
            loader.load(currentResources.stageModelPath!, resolve, undefined, reject);
          });
          sceneRef.current.add(stageMesh);
        }

        // 加载背景图片
        if (currentResources.backgroundPath && sceneRef.current) {
          const textureLoader = new THREE.TextureLoader();
          const backgroundTexture = await new Promise<THREE.Texture>((resolve, reject) => {
            textureLoader.load(currentResources.backgroundPath!, resolve, undefined, reject);
          });

          backgroundTexture.colorSpace = THREE.SRGBColorSpace;
          if (stage?.backgroundType === 'skybox') {
             backgroundTexture.mapping = THREE.EquirectangularReflectionMapping;
             sceneRef.current.background = backgroundTexture;
             sceneRef.current.environment = backgroundTexture;
          } else {
             sceneRef.current.background = backgroundTexture;
          }
        }

        // 初始化动画数据存储
        let vmd: any = null;
        let cameraVmd: any = null;

        // 加载动作
        if (currentResources.motionPath) {
          setLoadingProgress(60);
          vmd = await new Promise<any>((resolve, reject) => {
            loader.loadAnimation(
              currentResources.motionPath!,
              mesh,
              resolve,
              (progress: any) => {
                if (progress.total > 0) {
                  setLoadingProgress(Math.min((progress.loaded / progress.total) * 20 + 60, 80));
                }
              },
              reject
            );
          });

          helper.add(mesh, {
            animation: vmd,
            physics: stage?.enablePhysics !== false,
          });

          // 计算动画时长
          if (vmd) {
            let maxDuration = 0;
            if (vmd.duration !== undefined) {
              maxDuration = vmd.duration;
            } else if (Array.isArray(vmd) && vmd.length > 0 && vmd[0].duration !== undefined) {
              maxDuration = vmd[0].duration;
            } else if (vmd.clip && vmd.clip.duration !== undefined) {
              maxDuration = vmd.clip.duration;
            }
            if (maxDuration > 0) {
              animationDurationRef.current = maxDuration;
            }
          }
        } else {
          helper.add(mesh, { physics: stage?.enablePhysics !== false });
        }

        // 加载镜头动画
        if (currentResources.cameraPath && cameraRef.current) {
          setLoadingProgress(80);
          cameraVmd = await new Promise<any>((resolve, reject) => {
            loader.loadAnimation(currentResources.cameraPath!, cameraRef.current!, resolve, undefined, reject);
          });
          helper.add(cameraRef.current, { animation: cameraVmd });
        }

        // 加载音频
        if (currentResources.audioPath) {
          setLoadingProgress(90);
          const audio = new Audio(currentResources.audioPath);
          audio.volume = 0.5;
          audio.loop = loop;
          audioRef.current = audio;
          hasAudioRef.current = true;

          audio.onended = () => {
            if (!loop) {
              setIsPlaying(false);
              if (helperRef.current && sceneRef.current) {
                const mesh = sceneRef.current.children.find(
                  (child) => child.type === 'SkinnedMesh'
                );
                if (mesh) {
                  helperRef.current.pose(mesh as any, {});
                }
              }
            }
            onAudioEnded?.();
          };
        }

        setLoadingProgress(100);
        setLoading(false);

        // 保存动画数据用于后续重置
        vmdDataRef.current = { mesh, vmd, cameraVmd };

        // 如果是从 stop 后重新加载，则自动播放
        if (shouldAutoPlayAfterReloadRef.current) {
          shouldAutoPlayAfterReloadRef.current = false;
          setTimeout(() => play(), 500);
        } else if (autoPlay) {
          // 否则根据 autoPlay 配置决定是否播放
          setTimeout(() => play(), 500);
        }

        onLoad?.();
      } catch (err: any) {
        console.error('❌ MMD加载失败:', err);
        setError(err.message || '加载失败');
        setLoading(false);
        isLoadedRef.current = false; // 加载失败时重置标记，允许重试
        onError?.(err);
      }
    };

    loadMMD();
  }, [currentResources, stage?.enablePhysics, autoPlay, loop, onLoad, onError, reloadTrigger]);

  // 播放控制
  const play = () => {
    if (!helperRef.current && !needReset) return;

    // 如果需要重置（从 stop 恢复）
    if (needReset && vmdDataRef.current && sceneRef.current && cameraRef.current) {
      const { mesh, vmd, cameraVmd } = vmdDataRef.current;

      // 清空旧 helper
      if (helperRef.current) {
        try {
          const helperObjects = (helperRef.current as any).objects;
          if (helperObjects && Array.isArray(helperObjects)) {
            helperObjects.length = 0;
          }
        } catch (error) {}
      }

      const newHelper = new MMDAnimationHelper();
      helperRef.current = newHelper;
      clockRef.current = new THREE.Clock();

      // 重新添加模型和动画
      if (vmd && typeof vmd === 'object') {
        try {
          newHelper.add(mesh, {
            animation: vmd,
            physics: stage?.enablePhysics !== false,
          });
        } catch (error) {
          try {
            newHelper.add(mesh, { physics: stage?.enablePhysics !== false });
          } catch (innerError) {}
        }
      } else {
        try {
          newHelper.add(mesh, { physics: stage?.enablePhysics !== false });
        } catch (error) {}
      }

      // 重新添加相机动画
      if (cameraVmd && typeof cameraVmd === 'object') {
        try {
          newHelper.add(cameraRef.current, { animation: cameraVmd });
        } catch (error) {}
      }

      // 重置音频
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }

      setNeedReset(false);
    }

    if (!helperRef.current) {
      console.error('❌ [play] helper 不存在，无法播放');
      return;
    }

    // 正常播放流程
    // 播放音频
    if (audioRef.current) {
      audioRef.current.play();
    }

    // 启用动画和物理
    helperRef.current.enable('animation', true);
    helperRef.current.enable('ik', true);
    helperRef.current.enable('grant', true);
    helperRef.current.enable('physics', true);

    if (!isPlaying) {
      clockRef.current.start();
    }
    
    // 重置动画结束标记，允许再次触发
    animationEndedFiredRef.current = false;
    lastAnimationTimeRef.current = 0;
    animationStoppedCountRef.current = 0;
    
    isPlayingRef.current = true; // 更新 ref
    setIsPlaying(true);

    console.log('▶️ 开始播放（包括相机动画）');
  };

  const pause = () => {
    if (!helperRef.current) return;

    // 暂停音频
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // 停止时钟更新，这样 helper.update() 就不会推进动画时间
    clockRef.current.stop();

    isPlayingRef.current = false; // 更新 ref，停止动画循环中的更新
    setIsPlaying(false);
    console.log('⏸️ 暂停播放（包括相机动画）');
  };

  const stop = () => {
    if (!helperRef.current || !sceneRef.current) return;

    // 停止播放状态
    isPlayingRef.current = false;
    setIsPlaying(false);

    // 重置音频到开头
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 停止并重置时钟 - 这会让下次播放从头开始
    clockRef.current.stop();
    clockRef.current = new THREE.Clock();

    // 重置模型姿势到初始状态（T-pose）
    const mesh = sceneRef.current.children.find(
      (child) => child.type === 'SkinnedMesh' || (child as any).isSkinnedMesh
    );
    if (mesh && (mesh as any).skeleton) {
      // 使用 skeleton 的 pose() 方法重置骨骼到初始姿势
      (mesh as any).skeleton.pose();
    }

    // 重置相机到初始位置
    if (cameraRef.current) {
      const camPos = stage?.cameraPosition || { x: 0, y: 10, z: 30 };
      const camTarget = stage?.cameraTarget || { x: 0, y: 10, z: 0 };
      cameraRef.current.position.set(camPos.x, camPos.y, camPos.z);
      
      // 如果有 OrbitControls，也需要重置目标
      if (controlsRef.current) {
        controlsRef.current.target.set(camTarget.x, camTarget.y, camTarget.z);
        controlsRef.current.update();
      } else {
        cameraRef.current.lookAt(camTarget.x, camTarget.y, camTarget.z);
      }
    }

    // 标记需要在下次播放时重置动画
    setNeedReset(true);

    console.log('⏹️ 停止播放并重置到初始状态，needReset = true');
  };

  // 资源切换处理（resourcesList 模式）
  const handleResourceChange = (resourceId: string) => {
    console.log('🔄 [MMDPlayerEnhanced] 切换资源:', resourceId);
    
    // 停止当前播放
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }

    // 停止音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 更新选中的资源ID
    setSelectedResourceId(resourceId);
    
    // 标记需要重新加载（不使用 needReset，那是给 stop 按钮用的）
    isLoadedRef.current = false;
    setNeedReset(false); // 确保 needReset 为 false
    
    // 触发重新加载
    setReloadTrigger(prev => prev + 1);

    // 触发回调
    if (onResourceChange) {
      onResourceChange(resourceId);
    }

    // 关闭设置弹窗
    setShowSettings(false);
  };

  // 资源选择处理（resourceOptions 模式）
  const handleSelectionChange = (type: 'model' | 'motion' | 'audio' | 'camera' | 'stageModel' | 'background', id: string) => {
    console.log(`🔄 [MMDPlayerEnhanced] 选择${type}:`, id);
    
    // 记录当前是否在播放，用于重新加载后恢复播放状态
    const wasPlaying = isPlayingRef.current;
    
    // 停止当前播放
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }

    // 停止音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 更新选中的资源
    if (type === 'model') setSelectedModelId(id);
    if (type === 'motion') setSelectedMotionId(id);
    if (type === 'audio') setSelectedAudioId(id);
    if (type === 'camera') setSelectedCameraId(id);
    if (type === 'stageModel') setSelectedStageModelId(id);
    if (type === 'background') setSelectedBackgroundId(id);
    
    // 标记需要重新加载（不使用 needReset，那是给 stop 按钮用的）
    isLoadedRef.current = false;
    setNeedReset(false); // 确保 needReset 为 false
    
    // 如果之前在播放，或者 autoPlay 为 true，则重新加载后自动播放
    if (wasPlaying || autoPlay) {
      shouldAutoPlayAfterReloadRef.current = true;
    }
    
    // 触发重新加载
    setReloadTrigger(prev => prev + 1);

    // 触发回调
    if (onSelectionChange) {
      const newSelection = {
        modelId: type === 'model' ? id : selectedModelId,
        motionId: type === 'motion' ? id : selectedMotionId,
        audioId: type === 'audio' ? id : selectedAudioId,
        cameraId: type === 'camera' ? id : selectedCameraId,
        stageModelId: type === 'stageModel' ? id : selectedStageModelId,
        backgroundId: type === 'background' ? id : selectedBackgroundId,
      };
      onSelectionChange(newSelection);
    }
  };

  // 移除了这部分代码，改为使用覆盖层

  return (
    <div className={`relative h-full w-full ${className}`} style={style}>
      <div ref={containerRef} className="h-full w-full" />

      {/* 加载状态覆盖层 */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
          <div className="mb-4 text-2xl">🎭 加载MMD资源中...</div>
          <div className="h-4 w-3/4 max-w-md overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-400">{Math.round(loadingProgress)}%</div>
        </div>
      )}

      {/* 错误状态覆盖层 */}
      {/* {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 text-white">
          <div className="text-center">
            <div className="mb-4 text-4xl">❌</div>
            <div className="text-xl">加载失败</div>
            <div className="mt-2 text-sm text-gray-300">{error}</div>
          </div>
        </div>
      )} */}

      {/* 播放控制按钮 */}
      {isInitialized && !loading && !error && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/50 px-4 py-2 backdrop-blur-md">
        {!isPlaying ? (
          <button
            onClick={play}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-xl text-white transition-colors hover:bg-green-600"
            title="播放"
          >
            ▶️
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 text-xl text-white transition-colors hover:bg-yellow-600"
            title="暂停"
          >
            ⏸️
          </button>
        )}

        <button
          onClick={stop}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-xl text-white transition-colors hover:bg-red-600"
          title="停止"
        >
          ⏹️
        </button>

        {/* 设置按钮（仅在提供资源列表或资源选项时显示） */}
        {((resourcesList && resourcesList.length > 1) || resourceOptions) && (
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-xl text-white transition-colors hover:bg-purple-600"
            title="设置"
          >
            ⚙️
          </button>
        )}
      </div>
      )}

      {/* 设置弹窗 - resourcesList 模式 */}
      {showSettings && resourcesList && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black shadow-2xl">
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-xl font-bold text-white">选择资源</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-2xl text-white/60 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* 资源列表 */}
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {resourcesList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleResourceChange(item.id)}
                  className={`mb-3 w-full rounded-xl p-4 text-left transition-all ${
                    selectedResourceId === item.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{item.name}</h4>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/60">
                        {item.resources.modelPath && (
                          <span className="rounded bg-white/10 px-2 py-1">模型</span>
                        )}
                        {item.resources.motionPath && (
                          <span className="rounded bg-white/10 px-2 py-1">动作</span>
                        )}
                        {item.resources.cameraPath && (
                          <span className="rounded bg-white/10 px-2 py-1">相机</span>
                        )}
                        {item.resources.audioPath && (
                          <span className="rounded bg-white/10 px-2 py-1">音频</span>
                        )}
                      </div>
                    </div>
                    {selectedResourceId === item.id && (
                      <div className="ml-4 text-2xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 设置弹窗 - resourceOptions 模式（自定义下拉选择） */}
      {showSettings && resourceOptions && (
        <div className="absolute top-4 right-4 z-50 w-80 rounded-xl bg-black/90 backdrop-blur-md shadow-2xl border border-white/10">
          {/* 标题栏 */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-bold text-white">资源设置</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-lg text-white/60 transition-colors hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* 选择区域 */}
          <div className="max-h-[70vh] overflow-y-auto p-4 space-y-2">
            {/* 模型选择 */}
            {resourceOptions.models && resourceOptions.models.length > 0 && (
              <div className="rounded-lg bg-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'model' ? null : 'model')}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/70">模型</span>
                    <span className="text-sm text-white font-medium">
                      {resourceOptions.models.find(m => m.id === selectedModelId)?.name || '未选择'}
                    </span>
                  </div>
                  <span className={`text-white/60 transition-transform ${expandedSection === 'model' ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedSection === 'model' && (
                  <div className="border-t border-white/10 p-2 space-y-1 max-h-60 overflow-y-auto">
                    {resourceOptions.models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          handleSelectionChange('model', model.id);
                          setExpandedSection(null);
                        }}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                          selectedModelId === model.id
                            ? 'bg-purple-600 text-white font-medium'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 动作选择 */}
            {resourceOptions.motions && resourceOptions.motions.length > 0 && (
              <div className="rounded-lg bg-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'motion' ? null : 'motion')}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/70">动作</span>
                    <span className="text-sm text-white font-medium">
                      {selectedMotionId ? resourceOptions.motions.find(m => m.id === selectedMotionId)?.name : '无'}
                    </span>
                  </div>
                  <span className={`text-white/60 transition-transform ${expandedSection === 'motion' ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedSection === 'motion' && (
                  <div className="border-t border-white/10 p-2 space-y-1 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        handleSelectionChange('motion', '');
                        setExpandedSection(null);
                      }}
                      className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                        selectedMotionId === ''
                          ? 'bg-purple-600 text-white font-medium'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      无
                    </button>
                    {resourceOptions.motions.map((motion) => (
                      <button
                        key={motion.id}
                        onClick={() => {
                          handleSelectionChange('motion', motion.id);
                          setExpandedSection(null);
                        }}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                          selectedMotionId === motion.id
                            ? 'bg-purple-600 text-white font-medium'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {motion.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 音乐选择 */}
            {resourceOptions.audios && resourceOptions.audios.length > 0 && (
              <div className="rounded-lg bg-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'audio' ? null : 'audio')}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/70">音乐</span>
                    <span className="text-sm text-white font-medium">
                      {selectedAudioId ? resourceOptions.audios.find(a => a.id === selectedAudioId)?.name : '无'}
                    </span>
                  </div>
                  <span className={`text-white/60 transition-transform ${expandedSection === 'audio' ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedSection === 'audio' && (
                  <div className="border-t border-white/10 p-2 space-y-1 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        handleSelectionChange('audio', '');
                        setExpandedSection(null);
                      }}
                      className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                        selectedAudioId === ''
                          ? 'bg-purple-600 text-white font-medium'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      无
                    </button>
                    {resourceOptions.audios.map((audio) => (
                      <button
                        key={audio.id}
                        onClick={() => {
                          handleSelectionChange('audio', audio.id);
                          setExpandedSection(null);
                        }}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                          selectedAudioId === audio.id
                            ? 'bg-purple-600 text-white font-medium'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {audio.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 相机选择 */}
            {resourceOptions.cameras && resourceOptions.cameras.length > 0 && (
              <div className="rounded-lg bg-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'camera' ? null : 'camera')}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/70">相机</span>
                    <span className="text-sm text-white font-medium">
                      {selectedCameraId ? resourceOptions.cameras.find(c => c.id === selectedCameraId)?.name : '无'}
                    </span>
                  </div>
                  <span className={`text-white/60 transition-transform ${expandedSection === 'camera' ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedSection === 'camera' && (
                  <div className="border-t border-white/10 p-2 space-y-1 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        handleSelectionChange('camera', '');
                        setExpandedSection(null);
                      }}
                      className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                        selectedCameraId === ''
                          ? 'bg-purple-600 text-white font-medium'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      无
                    </button>
                    {resourceOptions.cameras.map((camera) => (
                      <button
                        key={camera.id}
                        onClick={() => {
                          handleSelectionChange('camera', camera.id);
                          setExpandedSection(null);
                        }}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                          selectedCameraId === camera.id
                            ? 'bg-purple-600 text-white font-medium'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {camera.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 场景选择 */}
            {resourceOptions.stageModels && resourceOptions.stageModels.length > 0 && (
              <div className="rounded-lg bg-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'stageModel' ? null : 'stageModel')}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/70">场景</span>
                    <span className="text-sm text-white font-medium">
                      {selectedStageModelId ? resourceOptions.stageModels.find(s => s.id === selectedStageModelId)?.name : '无'}
                    </span>
                  </div>
                  <span className={`text-white/60 transition-transform ${expandedSection === 'stageModel' ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedSection === 'stageModel' && (
                  <div className="border-t border-white/10 p-2 space-y-1 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        handleSelectionChange('stageModel', '');
                        setExpandedSection(null);
                      }}
                      className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                        selectedStageModelId === ''
                          ? 'bg-purple-600 text-white font-medium'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      无
                    </button>
                    {resourceOptions.stageModels.map((stageModel) => (
                      <button
                        key={stageModel.id}
                        onClick={() => {
                          handleSelectionChange('stageModel', stageModel.id);
                          setExpandedSection(null);
                        }}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                          selectedStageModelId === stageModel.id
                            ? 'bg-purple-600 text-white font-medium'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {stageModel.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 背景选择 */}
            {resourceOptions.backgrounds && resourceOptions.backgrounds.length > 0 && (
              <div className="rounded-lg bg-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'background' ? null : 'background')}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/70">背景</span>
                    <span className="text-sm text-white font-medium">
                      {selectedBackgroundId ? resourceOptions.backgrounds.find(b => b.id === selectedBackgroundId)?.name : '无'}
                    </span>
                  </div>
                  <span className={`text-white/60 transition-transform ${expandedSection === 'background' ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedSection === 'background' && (
                  <div className="border-t border-white/10 p-2 space-y-1 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        handleSelectionChange('background', '');
                        setExpandedSection(null);
                      }}
                      className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                        selectedBackgroundId === ''
                          ? 'bg-purple-600 text-white font-medium'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      无
                    </button>
                    {resourceOptions.backgrounds.map((background) => (
                      <button
                        key={background.id}
                        onClick={() => {
                          handleSelectionChange('background', background.id);
                          setExpandedSection(null);
                        }}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                          selectedBackgroundId === background.id
                            ? 'bg-purple-600 text-white font-medium'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {background.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// 添加 displayName 以便调试
MMDPlayerEnhanced.displayName = 'MMDPlayerEnhanced';

