'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls, MMDLoader, MMDAnimationHelper } from 'three-stdlib';
import type { MMDPlayerEnhancedProps } from '../types';
import { loadAmmo } from '../utils/ammo-loader';

/**
 * 增强版 MMD 播放器组件
 * 支持通过 resources 和 stage 配置快速使用
 * 所有资源均从 public 目录加载，无需额外配置
 */
export const MMDPlayerEnhanced: React.FC<MMDPlayerEnhancedProps> = ({
  resources,
  resourcesList,
  defaultResourceId,
  stage,
  autoPlay = false,
  loop = false,
  className = '',
  style,
  onLoad,
  onError,
  onResourceChange,
}) => {
  console.log('🎨 [MMDPlayerEnhanced] 组件初始化')
  
  // 资源切换状态
  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    defaultResourceId || resourcesList?.[0]?.id || ''
  );
  const [showSettings, setShowSettings] = useState(false);

  // 计算当前使用的资源
  const currentResources = useMemo(() => {
    if (resourcesList && resourcesList.length > 0) {
      const selected = resourcesList.find(r => r.id === selectedResourceId);
      const resourceItem = selected || resourcesList[0];
      if (!resourceItem) {
        throw new Error('无法找到有效的资源配置');
      }
      return resourceItem.resources;
    }
    if (!resources) {
      throw new Error('必须提供 resources 或 resourcesList');
    }
    return resources;
  }, [resources, resourcesList, selectedResourceId]);

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

  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0); // 用于触发重新加载
  const [needReset, setNeedReset] = useState(false); // 标记是否需要重置（改用 state）

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
        helperRef.current.update(clockRef.current.getDelta());
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

  // 加载MMD资源
  useEffect(() => {
    console.log('📦 [MMDPlayerEnhanced] 资源加载 useEffect 触发')
    console.log('🔍 [MMDPlayerEnhanced] sceneRef.current:', sceneRef.current)
    console.log('🔍 [MMDPlayerEnhanced] cameraRef.current:', cameraRef.current)
    console.log('🔍 [MMDPlayerEnhanced] isLoadedRef.current:', isLoadedRef.current)
    
    if (!sceneRef.current || !cameraRef.current) {
      console.warn('⚠️ [MMDPlayerEnhanced] 场景或相机未初始化，跳过资源加载')
      return
    }

    // 防止重复加载 - 使用 ref 标记
    if (isLoadedRef.current) {
      console.log('⚠️ [MMDPlayerEnhanced] 资源已加载，跳过重复加载');
      return;
    }

    console.log('✅ [MMDPlayerEnhanced] 场景和相机已就绪，开始加载资源')
    
    // 标记为正在加载
    isLoadedRef.current = true;
    const loadMMD = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);

        // 如果启用物理，先加载 Ammo.js
        if (stage?.enablePhysics !== false) {
          const ammoScriptPath = stage?.ammoPath || '/mikutalking/libs/ammo.wasm.js';
          const ammoWasmPath = stage?.ammoWasmPath || '/mikutalking/libs/';
          
          console.log('🔧 [MMDPlayerEnhanced] 检测到启用物理，开始加载 Ammo.js');
          console.log('📂 [MMDPlayerEnhanced] Ammo 脚本路径:', ammoScriptPath);
          console.log('📂 [MMDPlayerEnhanced] Ammo WASM 路径:', ammoWasmPath);
          setLoadingProgress(5);
          
          await loadAmmo({
            scriptPath: ammoScriptPath,
            wasmBasePath: ammoWasmPath,
          });
          
          console.log('✅ [MMDPlayerEnhanced] Ammo.js 加载完成');
        }

        const loader = new MMDLoader();
        const helper = new MMDAnimationHelper();
        helperRef.current = helper;

        // 加载模型
        setLoadingProgress(20);
        console.log('🎭 开始加载模型:', currentResources.modelPath);

        const mesh = await new Promise<any>((resolve, reject) => {
          loader.load(
            currentResources.modelPath,
            (object: any) => {
              console.log('✅ 模型加载成功');
              resolve(object);
            },
            (progress: any) => {
              if (progress.total > 0) {
                const percent = (progress.loaded / progress.total) * 30 + 20;
                setLoadingProgress(Math.min(percent, 50));
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
          console.log('🏰 开始加载场景模型:', currentResources.stageModelPath);
          
          const stageMesh = await new Promise<any>((resolve, reject) => {
            loader.load(
              currentResources.stageModelPath!,
              (object: any) => {
                console.log('✅ 场景模型加载成功');
                resolve(object);
              },
              undefined,
              (error: any) => {
                console.error('❌ 场景模型加载失败:', error);
                reject(error);
              }
            );
          });

          // 场景模型通常不需要物理计算，直接添加即可
          // 注意：这里我们不把它加到 helper 中，除非它有动作
          // 确保场景在人物后面（通常不需要特殊处理，深度缓冲会处理）
          // 但我们可以调整一下渲染顺序或位置如果需要
          sceneRef.current.add(stageMesh);
        }

        // 加载背景图片
        if (currentResources.backgroundPath && sceneRef.current) {
          console.log('🖼️ 开始加载背景图片:', currentResources.backgroundPath);
          const textureLoader = new THREE.TextureLoader();
          
          const backgroundTexture = await new Promise<THREE.Texture>((resolve, reject) => {
            textureLoader.load(
              currentResources.backgroundPath!,
              (texture) => resolve(texture),
              undefined,
              (err) => reject(err)
            );
          });

          backgroundTexture.colorSpace = THREE.SRGBColorSpace;

          if (stage?.backgroundType === 'skybox') {
             backgroundTexture.mapping = THREE.EquirectangularReflectionMapping;
             sceneRef.current.background = backgroundTexture;
             sceneRef.current.environment = backgroundTexture;
          } else if (stage?.backgroundType === 'image') {
             sceneRef.current.background = backgroundTexture;
             // 对于固定背景图，不一定要设为 environment
          } else {
             // 默认 fallback 到 color 或保持原样
             sceneRef.current.background = backgroundTexture;
          }
          console.log('✅ 背景图片加载成功');
        }

        // 初始化动画数据存储
        let vmd: any = null;
        let cameraVmd: any = null;

        // 加载动作
        if (currentResources.motionPath) {
          setLoadingProgress(60);
          console.log('💃 开始加载动作:', currentResources.motionPath);

          vmd = await new Promise<any>((resolve, reject) => {
            loader.loadAnimation(
              currentResources.motionPath!,
              mesh,
              (vmdObject: any) => {
                console.log('✅ 动作加载成功');
                resolve(vmdObject);
              },
              (progress: any) => {
                if (progress.total > 0) {
                  const percent = (progress.loaded / progress.total) * 20 + 60;
                  setLoadingProgress(Math.min(percent, 80));
                }
              },
              (error: any) => {
                console.error('❌ 动作加载失败:', error);
                reject(error);
              }
            );
          });

          helper.add(mesh, {
            animation: vmd,
            physics: stage?.enablePhysics !== false,
          });
        } else {
          helper.add(mesh, { physics: stage?.enablePhysics !== false });
        }

        // 加载镜头动画
        if (currentResources.cameraPath && cameraRef.current) {
          setLoadingProgress(80);
          console.log('📷 开始加载镜头:', currentResources.cameraPath);

          cameraVmd = await new Promise<any>((resolve, reject) => {
            loader.loadAnimation(
              currentResources.cameraPath!,
              cameraRef.current!,
              (vmdObject: any) => {
                console.log('✅ 镜头加载成功');
                resolve(vmdObject);
              },
              undefined,
              (error: any) => {
                console.error('❌ 镜头加载失败:', error);
                reject(error);
              }
            );
          });

          helper.add(cameraRef.current, { animation: cameraVmd });
        }

        // 加载音频
        if (currentResources.audioPath) {
          setLoadingProgress(90);
          console.log('🎵 开始加载音频:', currentResources.audioPath);

          const audio = new Audio(currentResources.audioPath);
          audio.volume = 0.5;
          audio.loop = loop;
          audioRef.current = audio;

          // 监听音频结束事件
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
          };

          console.log('✅ 音频加载成功');
        }

        setLoadingProgress(100);
        setLoading(false);

        // 保存动画数据用于后续重置
        vmdDataRef.current = {
          mesh,
          vmd,
          cameraVmd,
        };

        console.log('🎉 所有资源加载完成！');

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
    console.log('🎬 [play] 函数被调用，needReset =', needReset);
    
    if (!helperRef.current) return;

    // 如果需要重置（从 stop 恢复），重新创建 helper 并重新添加现有模型和动画
    if (needReset && vmdDataRef.current && sceneRef.current && cameraRef.current) {
      console.log('🔄 检测到需要重置，重新初始化 helper（保留模型）');
      
      const { mesh, vmd, cameraVmd } = vmdDataRef.current;

      // 创建新的 helper 和 clock
      const newHelper = new MMDAnimationHelper();
      helperRef.current = newHelper;
      clockRef.current = new THREE.Clock();

      // 重新添加模型和动画（模型已经在场景中，不需要重新添加到场景）
      if (vmd) {
        newHelper.add(mesh, {
          animation: vmd,
          physics: stage?.enablePhysics !== false,
        });
      } else {
        newHelper.add(mesh, { physics: stage?.enablePhysics !== false });
      }

      // 重新添加相机动画
      if (cameraVmd) {
        newHelper.add(cameraRef.current, { animation: cameraVmd });
      }

      // 重置音频
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }

      setNeedReset(false);
      console.log('✅ Helper 重新初始化完成，准备从第一帧播放');
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

  // 资源切换处理
  const handleResourceChange = (resourceId: string) => {
    console.log('🔄 [MMDPlayerEnhanced] 切换资源:', resourceId);
    
    // 停止当前播放
    if (isPlaying) {
      stop();
    }

    // 更新选中的资源ID
    setSelectedResourceId(resourceId);
    
    // 标记需要重新加载
    setNeedReset(true);
    isLoadedRef.current = false;
    
    // 触发重新加载
    setReloadTrigger(prev => prev + 1);

    // 触发回调
    if (onResourceChange) {
      onResourceChange(resourceId);
    }

    // 关闭设置弹窗
    setShowSettings(false);
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

        {/* 设置按钮（仅在提供资源列表时显示） */}
        {resourcesList && resourcesList.length > 1 && (
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

      {/* 设置弹窗 */}
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
    </div>
  );
};

