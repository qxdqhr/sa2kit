import React, { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { clsx } from 'clsx';

if (typeof window !== 'undefined') {
  (window as any).THREE = THREE;
}
import Script from 'next/script';


// @ts-ignore
import * as THREEx from '@ar-js-org/ar.js/three.js/build/ar-threex-location-only.js'

/**
 * ============================================================================
 * MMD AR PLAYER - 功能规格文档
 * ============================================================================
 *
 * 组件名称: MMDARPlayer
 * 描述: 基于实时摄像头的 MMD 增强现实播放器
 * 目标: 提供完整的 AR 体验，让用户能够在真实世界中放置和交互 MMD 模型
 *
 * ============================================================================
 * 工作流程 (4个主要阶段)
 * ============================================================================
 *
 * 阶段1: 初始化和摄像头启动
 * --------------------------
 * 1.1 初始化组件和状态管理
 * 1.2 加载默认资源 (模型/动作/音频)
 * 1.3 请求摄像头权限
 * 1.4 启动摄像头并开始视频流
 *
 * 阶段2: AR模型放置
 * ------------------
 * 2.1 使用Threejs和ar.js 初始化AR场景,并显示AR标记点
 * 2.2 显示AR标记点
 * 2.3 用户点击放置模型,并固定模型在世界坐标系中的Ar标记点
 * 2.4 模型固定在世界坐标系 (陀螺仪支持)
 *
 * 阶段3: 设置和资源管理
 * ----------------------
 * 3.1 设置弹窗UI结构
 * 3.2 资源切换功能 (下拉菜单)
 * 3.3 重新设置标记点功能
 *
 * 阶段4: 拍照和保存
 * ------------------
 * 4.1 拍照按钮UI
 * 4.2 截图合成功能 (相机+3D模型)
 * 4.3 保存到本地功能
 *
 * ============================================================================
 * 技术实现要点
 * ============================================================================
 */

interface ARPlayerState {
  isLoading: boolean;
  cameraReady: boolean;
  arReady: boolean;
  error: string | null;
  showSettings: boolean;
  modelPlaced: boolean;
  markerDetected: boolean;
  selectedModel: string;
  selectedMotion: string;
  selectedAudio: string;
  cameraFacing: 'environment' | 'user';
  markerType: 'barcode' | 'pattern';
  showWireframe: boolean;
  lightingEnabled: boolean;
  quality: 'low' | 'medium' | 'high';
}

interface ARPlayerProps {
  width?: number;
  height?: number;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export const MMDARPlayer = forwardRef<any, ARPlayerProps>(({
  width = 800,
  height = 600,
  onReady,
  onError
}, ref) => {
  // DOM 引用
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js 相关
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.Camera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const arToolkitSourceRef = useRef<any>();
  const arToolkitContextRef = useRef<any>();
  const markerRootRef = useRef<THREE.Group>();
  const markerControlsRef = useRef<any>();
  const modelRootRef = useRef<THREE.Group>();
  const modelRef = useRef<THREE.Object3D>();

  // 状态管理
  const [state, setState] = useState<ARPlayerState>({
    isLoading: true,
    cameraReady: false,
    arReady: false,
    error: null,
    showSettings: false,
    modelPlaced: false,
    markerDetected: false,
    selectedModel: 'sphere',
    selectedMotion: 'idle',
    selectedAudio: 'none',
    cameraFacing: 'environment',
    markerType: 'barcode',
    showWireframe: false,
    lightingEnabled: true,
    quality: 'medium',
  });

  // 陀螺仪数据
  const gyroDataRef = useRef({ alpha: 0, beta: 0, gamma: 0 });

  // 初始化 Three.js 场景
  const initializeThreeJS = useCallback(() => {
    try {
      // 创建场景
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 创建相机
      const camera = new THREE.Camera();
      cameraRef.current = camera;
      scene.add(camera);

      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        antialias: true,
        alpha: true
      });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;

      console.log('Three.js initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Three.js:', error);
      setState(prev => ({ ...prev, error: 'Three.js 初始化失败' }));
      return false;
    }
  }, [width, height]);

  // 请求摄像头权限
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Checking camera support...');

      // 检查是否支持 getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持摄像头访问');
      }

      console.log('Camera API supported, checking permissions...');

      // 检查权限状态 (如果支持) - 添加超时保护
      if (navigator.permissions) {
        try {
          console.log('Querying camera permission status...');
          const permissionPromise = navigator.permissions.query({ name: 'camera' as PermissionName });

          // 设置5秒超时
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Permission query timeout')), 5000);
          });

          const permissionStatus = await Promise.race([permissionPromise, timeoutPromise]) as PermissionStatus;

          console.log('Permission status:', permissionStatus.state);

          if (permissionStatus.state === 'denied') {
            throw new Error('摄像头权限已被拒绝，请在浏览器设置中允许访问摄像头');
          }
        } catch (permissionError) {
          console.warn('Permission query failed or timed out, proceeding with getUserMedia:', permissionError);
          // 如果权限查询失败，继续尝试直接获取摄像头
        }
      }

      console.log('Requesting camera access...');

      // 测试摄像头访问 - 添加超时保护
      const cameraPromise = navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'environment' // 优先使用后置摄像头
        }
      });

      // 设置10秒超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Camera access timeout - 请检查摄像头权限')), 10000);
      });

      const testStream = await Promise.race([cameraPromise, timeoutPromise]);

      console.log('Camera access granted, stopping test stream...');

      // 立即停止测试流
      testStream.getTracks().forEach(track => track.stop());

      console.log('Camera permission granted successfully');
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      const errorMessage = error instanceof Error ? error.message : '无法访问摄像头';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      onError?.(errorMessage);
      return false;
    }
  }, [width, height, onError]);

  // 创建3D模型
  const createModel = useCallback((modelType: string): THREE.Object3D => {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    let mesh: THREE.Object3D;

    switch (modelType) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        material = new THREE.MeshPhongMaterial({
          color: 0xff69b4,
          shininess: 100,
          specular: 0x111111
        });
        mesh = new THREE.Mesh(geometry, material);
        break;

      case 'cube':
        geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        material = new THREE.MeshPhongMaterial({
          color: 0x00ff7f,
          shininess: 100,
          specular: 0x111111
        });
        mesh = new THREE.Mesh(geometry, material);
        break;

      case 'torus':
        geometry = new THREE.TorusGeometry(0.4, 0.2, 16, 100);
        material = new THREE.MeshPhongMaterial({
          color: 0xffa500,
          shininess: 100,
          specular: 0x111111
        });
        mesh = new THREE.Mesh(geometry, material);
        break;

      default:
        // 默认使用球体
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        material = new THREE.MeshPhongMaterial({
          color: 0xff69b4,
          shininess: 100,
          specular: 0x111111
        });
        mesh = new THREE.Mesh(geometry, material);
    }

    // 添加旋转动画
    mesh.rotation.x = Math.PI / 4;
    mesh.rotation.y = Math.PI / 4;

    return mesh;
  }, []);

  // 放置模型
  const placeModel = useCallback(() => {
    if (!markerRootRef.current || !modelRootRef.current || !sceneRef.current) {
      console.error('Cannot place model: missing required references');
      return;
    }

    try {
      // 清除现有的模型
      if (modelRef.current) {
        modelRootRef.current.remove(modelRef.current);
      }

      // 创建新的模型
      const model = createModel(state.selectedModel);
      modelRef.current = model;

      // 将模型放置在标记的位置
      modelRootRef.current.position.copy(markerRootRef.current.position);
      modelRootRef.current.quaternion.copy(markerRootRef.current.quaternion);

      // 添加模型到场景
      modelRootRef.current.add(model);
      modelRootRef.current.visible = true;

      setState(prev => ({ ...prev, modelPlaced: true }));

      console.log('Model placed successfully at marker position');
    } catch (error) {
      console.error('Failed to place model:', error);
      setState(prev => ({ ...prev, error: '放置模型失败' }));
    }
  }, [state.selectedModel, createModel]);

  // 处理需要重启 AR 的设置变更
  const handleARSettingChange = useCallback((setting: string, value: any) => {
    setState(prev => ({ ...prev, [setting]: value }));

    // 如果是需要重启 AR 的设置，显示提示
    if (setting === 'cameraFacing' || setting === 'markerType' || setting === 'quality') {
      setTimeout(() => {
        alert('此设置变更需要重新启动 AR 系统。请刷新页面以应用新设置。');
      }, 100);
    }
  }, []);

  // 拍照功能
  const takePhoto = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
      console.error('Cannot take photo: missing required references');
      return;
    }

    try {
      // 创建一个离屏canvas用于渲染
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Cannot create canvas context');
      }

      // 设置canvas尺寸
      canvas.width = width;
      canvas.height = height;

      // 渲染场景到canvas
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      // 获取渲染器的canvas数据
      const rendererCanvas = rendererRef.current.domElement;
      context.drawImage(rendererCanvas, 0, 0, width, height);

      // 如果有摄像头视频流，也将其合成到图像中
      if (arToolkitSourceRef.current && arToolkitSourceRef.current.domElement) {
        const videoElement = arToolkitSourceRef.current.domElement;
        context.globalCompositeOperation = 'source-over';
        context.drawImage(videoElement, 0, 0, width, height);
      }

      // 将canvas转换为blob并下载
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'ar-photo-' + (Date.now()) + '.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          console.log('Photo saved successfully');
        }
      }, 'image/png');

    } catch (error) {
      console.error('Failed to take photo:', error);
      setState(prev => ({ ...prev, error: '拍照失败' }));
    }
  }, [width, height]);

  // 初始化 AR.js
  const initializeAR = useCallback(async () => {
    try {
      console.log('Starting AR initialization...');

      // 等待 AR.js 完全加载和初始化
      if (!(window as any).__arjs_ready) {
        console.log("Waiting for AR.js initialization...");
        await new Promise<void>((resolve, reject) => {
          const check = setInterval(() => {
            if ((window as any).__arjs_ready) {
              clearInterval(check);
              console.log('AR.js initialization complete!');
              resolve();
            }
          }, 50);

          // 超时保护
          setTimeout(() => {
            clearInterval(check);
            reject(new Error('AR.js initialization timeout'));
          }, 15000);
        });
      }

      console.log('Getting THREEx...');
      const THREEx = (window as any).THREEx;

      if (!THREEx) {
        console.error('THREEx not found, available window properties:', Object.keys(window).filter(key => key.toLowerCase().includes('ar') || key.toLowerCase().includes('three')));
        throw new Error('THREEx not found after AR.js loaded');
      }

      console.log('THREEx loaded successfully:', Object.keys(THREEx));

      console.log('THREEx loaded, requesting camera permission...');
      // 首先请求摄像头权限
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        console.log('Camera permission denied');
        return false;
      }

      console.log('Camera permission granted, initializing AR Toolkit Source...');

      // 初始化 AR Toolkit Source
      const arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
        sourceWidth: width,
        sourceHeight: height,
        // 使用用户选择的摄像头朝向
        ...(state.cameraFacing && { facingMode: state.cameraFacing }),
      } as any);
      arToolkitSourceRef.current = arToolkitSource;

      // 初始化 AR Toolkit Context
      const arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: 'data/camera_para.dat', // 使用内建相机参数
        detectionMode: 'mono',
        // 根据质量设置调整检测参数
        ...(state.quality && {
          maxDetectionRate: state.quality === 'high' ? 60 : state.quality === 'medium' ? 30 : 15
        }),
      } as any);
      arToolkitContextRef.current = arToolkitContext;

      // 设置 AR 上下文
      arToolkitContext.init(() => {
        cameraRef.current!.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());

        // 创建 AR 标记根对象
        const markerRoot = new THREE.Group();
        sceneRef.current!.add(markerRoot);
        markerRootRef.current = markerRoot;

        // 创建标记几何体 (一个简单的立方体表示标记点)
        const markerGeometry = new THREE.BoxGeometry(1, 1, 0.1);
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.7,
          wireframe: state.showWireframe // 根据设置显示线框
        });
        const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
        markerMesh.position.set(0, 0, 0);
        markerRoot.add(markerMesh);

        // 添加标记边框线条 (如果不显示线框材质)
        if (!state.showWireframe) {
          const edges = new THREE.EdgesGeometry(markerGeometry);
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
          const wireframe = new THREE.LineSegments(edges, lineMaterial);
          markerRoot.add(wireframe);
        }

        // 创建 AR 标记控制器 - 根据用户选择的标记类型
        const markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
          type: state.markerType,
          ...(state.markerType === 'barcode'
            ? { barcodeValue: 0 } // 使用条码值 0 作为默认标记
            : { patternUrl: 'data/patt.hiro' } // 使用 Hiro 图案作为默认
          ),
        });
        markerControlsRef.current = markerControls;

        // 添加光照 (如果启用)
        if (state.lightingEnabled) {
          const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
          sceneRef.current!.add(ambientLight);

          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
          directionalLight.position.set(1, 1, 1);
          sceneRef.current!.add(directionalLight);
        }

        // 创建模型根节点（用于放置实际的3D模型）
        const modelRoot = new THREE.Group();
        modelRoot.visible = false; // 默认隐藏，等待用户放置
        sceneRef.current!.add(modelRoot);
        modelRootRef.current = modelRoot;

        setState(prev => ({
          ...prev,
          arReady: true,
          isLoading: false
        }));

        onReady?.();
        console.log('AR.js and marker system initialized successfully');
      });

      // 启动摄像头
      arToolkitSource.init(() => {
        arToolkitSource.domElement.style.display = 'none'; // 隐藏原始视频元素
        setState(prev => ({ ...prev, cameraReady: true }));
        console.log('Camera initialized successfully');
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize AR.js:', error);
      const errorMessage = error instanceof Error ? error.message : 'AR.js 初始化失败';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      onError?.(errorMessage);
      return false;
    }
  }, [width, height, requestCameraPermission, onReady, onError]);

  // 渲染循环
  const render = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    requestAnimationFrame(render);

    if (arToolkitSourceRef.current && arToolkitSourceRef.current.ready) {
      arToolkitContextRef.current.update(arToolkitSourceRef.current.domElement);

      // 检查标记检测状态
      if (markerRootRef.current && markerRootRef.current.visible !== state.markerDetected) {
        setState(prev => ({ ...prev, markerDetected: markerRootRef.current!.visible }));
      }
    }

    // 动画更新
    if (modelRef.current && state.modelPlaced) {
      modelRef.current.rotation.y += 0.01; // 缓慢旋转
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [state.markerDetected]);

  // 初始化组件
  useEffect(() => {
    const initialize = async () => {
      try {
        // Phase 1.1: 初始化组件和状态管理
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Phase 1.3: 初始化 Three.js
        if (!initializeThreeJS()) return;

        // Phase 1.4: 初始化 AR.js (包含摄像头权限检查)
        await initializeAR();

        // 设置陀螺仪监听器 (如果支持)
        if (window.DeviceOrientationEvent) {
          const handleOrientation = (event: DeviceOrientationEvent) => {
            gyroDataRef.current = {
              alpha: event.alpha || 0,
              beta: event.beta || 0,
              gamma: event.gamma || 0,
            };

            // 如果模型已放置且启用了陀螺仪，可以根据方向调整模型
            if (state.modelPlaced && modelRef.current) {
              // 根据陀螺仪数据调整模型旋转 (可选功能)
              // modelRef.current.rotation.z = (gyroDataRef.current.gamma * Math.PI) / 180;
            }
          };

          window.addEventListener('deviceorientation', handleOrientation);

          // 存储清理函数
          const cleanupGyro = () => {
            window.removeEventListener('deviceorientation', handleOrientation);
          };

          // 保存清理函数供后续使用
          (window as any).__gyroCleanup = cleanupGyro;
        }

        // 启动渲染循环
        render();

      } catch (error) {
        console.error('Initialization failed:', error);
        setState(prev => ({
          ...prev,
          error: '组件初始化失败',
          isLoading: false
        }));
        onError?.('组件初始化失败');
      }
    };

    initialize();

    // 清理函数
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (arToolkitSourceRef.current) {
        // 停止所有媒体轨道
        if (arToolkitSourceRef.current.domElement?.srcObject) {
          const stream = arToolkitSourceRef.current.domElement.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        arToolkitSourceRef.current.domElement?.remove();
      }

      // 清理陀螺仪监听器
      if ((window as any).__gyroCleanup) {
        (window as any).__gyroCleanup();
      }
    };
  }, [initializeThreeJS, initializeAR, render, onError]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900 overflow-hidden">
      <Script
        src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("AR.js script loaded, checking THREEx...");

          // 等待 THREEx 初始化
          const checkTHREEx = () => {
            if ((window as any).THREEx) {
              console.log("THREEx found! Properties:", Object.keys((window as any).THREEx));
              (window as any).__arjs_ready = true;
              console.log("AR.js and THREEx ready!");
            } else {
              console.log("THREEx not ready yet, checking window object:", Object.keys(window).filter(key => key.includes('THREEx') || key.includes('AR')));
              // 继续等待
              setTimeout(checkTHREEx, 100);
            }
          };

          checkTHREEx();
        }}
        onError={(error) => {
          console.error("Failed to load AR.js:", error);
          setState(prev => ({
            ...prev,
            error: 'AR.js 加载失败',
            isLoading: false
          }));
        }}
      />
      {/* AR Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: state.arReady ? 'block' : 'none' }}
      />

      {/* Loading State */}
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>正在初始化 AR 环境...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 text-white">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold mb-4">初始化失败</h2>
            <p className="text-red-200 mb-4">{state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      )}

      {/* AR Ready State - Show UI */}
      {state.arReady && !state.error && (
        <>
          {/* AR Marker Instructions */}
          {!state.modelPlaced && (
            <div className="absolute top-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg">
              <h3 className="font-bold mb-2">AR 放置说明</h3>
              <p className="text-sm text-gray-300">
                1. 允许摄像头访问权限<br />
                2. 准备一个条码标记 (值: 0) 或 Hiro 标记图案<br />
                3. 将摄像头对准标记，绿色立方体将出现在标记位置<br />
                {state.markerDetected ? (
                  <span className="text-green-400 font-bold">✓ 标记已检测到！</span>
                ) : (
                  <span className="text-yellow-400">等待标记检测...</span>
                )}
                <br />
                4. 点击"放置模型"按钮固定模型位置
              </p>
            </div>
          )}

          {/* Settings Panel */}
          {state.showSettings && (
            <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg min-w-80 max-w-sm max-h-96 overflow-y-auto">
              <h3 className="font-bold mb-4 text-lg">⚙️ 设置面板</h3>

              <div className="space-y-4">
                {/* Camera Settings */}
                <div className="border-b border-gray-600 pb-3">
                  <h4 className="font-semibold mb-2 text-blue-300">📷 摄像头设置</h4>
                  <div>
                    <label className="block text-sm font-medium mb-1">摄像头朝向</label>
                    <select
                      value={state.cameraFacing}
                      onChange={(e) => handleARSettingChange('cameraFacing', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                    >
                      <option value="environment">后置摄像头</option>
                      <option value="user">前置摄像头</option>
                    </select>
                  </div>
                </div>

                {/* AR Detection Settings */}
                <div className="border-b border-gray-600 pb-3">
                  <h4 className="font-semibold mb-2 text-green-300">🎯 AR 检测设置</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">标记类型</label>
                      <select
                        value={state.markerType}
                        onChange={(e) => handleARSettingChange('markerType', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                      >
                        <option value="barcode">条码 (Barcode)</option>
                        <option value="pattern">图案 (Hiro)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">检测质量</label>
                      <select
                        value={state.quality}
                        onChange={(e) => handleARSettingChange('quality', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                      >
                        <option value="low">低质量 (15fps)</option>
                        <option value="medium">中等质量 (30fps)</option>
                        <option value="high">高质量 (60fps)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Visual Settings */}
                <div className="border-b border-gray-600 pb-3">
                  <h4 className="font-semibold mb-2 text-purple-300">👁️ 视觉设置</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.showWireframe}
                        onChange={(e) => setState(prev => ({ ...prev, showWireframe: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">显示线框</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.lightingEnabled}
                        onChange={(e) => setState(prev => ({ ...prev, lightingEnabled: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">启用光照</span>
                    </label>
                  </div>
                </div>

                {/* Model & Animation */}
                <div className="border-b border-gray-600 pb-3">
                  <h4 className="font-semibold mb-2 text-orange-300">🎭 模型与动画</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">模型选择</label>
                      <select
                        value={state.selectedModel}
                        onChange={(e) => setState(prev => ({ ...prev, selectedModel: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                      >
                        <option value="sphere">🌐 球体</option>
                        <option value="cube">⬜ 立方体</option>
                        <option value="torus">⭕ 圆环</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">动作选择</label>
                      <select
                        value={state.selectedMotion}
                        onChange={(e) => setState(prev => ({ ...prev, selectedMotion: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                      >
                        <option value="idle">🧘 待机</option>
                        <option value="dance">💃 舞蹈</option>
                        <option value="wave">👋 挥手</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">音乐选择</label>
                      <select
                        value={state.selectedAudio}
                        onChange={(e) => setState(prev => ({ ...prev, selectedAudio: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                      >
                        <option value="none">🔇 无音乐</option>
                        <option value="bgm1">🎵 背景音乐 1</option>
                        <option value="bgm2">🎶 背景音乐 2</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Control Actions */}
                <div>
                  <h4 className="font-semibold mb-2 text-red-300">🎮 控制操作</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (modelRootRef.current) {
                          modelRootRef.current.visible = false;
                        }
                        if (markerRootRef.current) {
                          markerRootRef.current.visible = true;
                        }
                        setState(prev => ({ ...prev, modelPlaced: false, markerDetected: false }));
                      }}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm"
                    >
                      🔄 重新设置标记点
                    </button>

                    <button
                      onClick={() => {
                        // 清除所有模型和标记
                        if (modelRootRef.current) {
                          modelRootRef.current.clear();
                          modelRootRef.current.visible = false;
                        }
                        if (markerRootRef.current) {
                          markerRootRef.current.visible = true;
                        }
                        setState(prev => ({
                          ...prev,
                          modelPlaced: false,
                          markerDetected: false,
                          selectedModel: 'sphere',
                          selectedMotion: 'idle',
                          selectedAudio: 'none'
                        }));
                      }}
                      className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors text-sm"
                    >
                      🗑️ 清除所有
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
            <button
              onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              ⚙️ 设置
            </button>

            {!state.modelPlaced && (
              <button
                onClick={placeModel}
                disabled={!state.markerDetected}
                className={clsx('px-6 py-2 rounded-lg transition-colors', state.markerDetected
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed')}
              >
                📍 放置模型
              </button>
            )}

            {state.modelPlaced && (
              <button
                onClick={takePhoto}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                📸 拍照
              </button>
            )}
          </div>

          {/* Status Indicator */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <div className={clsx('w-3 h-3 rounded-full', state.cameraReady ? 'bg-green-400' : 'bg-red-400')} title="摄像头"></div>
            <div className={clsx('w-3 h-3 rounded-full', state.arReady ? 'bg-green-400' : 'bg-red-400')} title="AR"></div>
            <div className={clsx('w-3 h-3 rounded-full', window.DeviceOrientationEvent ? 'bg-purple-400' : 'bg-gray-400')} title="陀螺仪"></div>
            <div className={clsx('w-3 h-3 rounded-full', state.markerDetected ? 'bg-blue-400' : 'bg-gray-400')} title="标记检测"></div>
            <div className={clsx('w-3 h-3 rounded-full', state.modelPlaced && modelRootRef.current?.visible ? 'bg-green-400' : 'bg-yellow-400')} title="模型"></div>
          </div>
        </>
      )}
    </div>
  );
});

MMDARPlayer.displayName = 'MMDARPlayer';

export default MMDARPlayer;