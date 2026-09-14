'use client';

/**
 * MMD光照调试面板演示
 * 展示如何使用MMDLightingDebugPanel组件
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls, MMDLoader, MMDAnimationHelper } from 'three-stdlib';
import {
  MMDLightingDebugPanel,
  type MMDSceneRefs,
  type MMDLightingParams,
} from '../components/MMDLightingDebugPanel';
import { quickDiagnose } from '../utils/mmd-renderer-diagnostics';
import { configureMaterialsForMMD } from '../utils/mmd-loader-config';
import {
  fullSphereDiagnostic,
  addDefaultSphereTextures,
} from '../utils/sphere-texture-helper';

export default function MMDLightingDebugDemoPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingStatus, setLoadingStatus] = useState('准备加载...');
  const [fps, setFps] = useState(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelUrlRef = useRef('https://cdn.bigfile.qhr062.top/mmd/model/yagi39mikuNT1/yagi39mikuNT.pmx');

  // 场景引用
  const sceneRefs = useRef<MMDSceneRefs>({
    renderer: null,
    ambientLight: null,
    directionalLight: null,
    sideLight: null,
    hemisphereLight: null,
    mmdMesh: null,
  });

  // 参数变化回调
  const handleParamsChange = (params: MMDLightingParams) => {
    console.log('💡 光照参数已更新:', params);
  };

  // 运行完整诊断
  const handleDiagnose = async () => {
    if (sceneRef.current && sceneRefs.current.renderer && sceneRefs.current.mmdMesh) {
      console.log('\n🔍 开始完整诊断...\n');

      // 基础诊断
      quickDiagnose(sceneRef.current, sceneRefs.current.renderer);

      // Sphere纹理详细诊断
      await fullSphereDiagnostic(sceneRefs.current.mmdMesh, modelUrlRef.current);

      alert('完整诊断报告已输出到浏览器控制台！\n按 F12 查看详细信息。\n\n重点关注：\n- Toon纹理状态\n- Sphere纹理状态\n- 修复建议');
    } else {
      alert('场景尚未初始化，请等待模型加载完成。');
    }
  };

  // 添加默认Sphere纹理（临时修复）
  const handleAddSphereTextures = () => {
    if (sceneRefs.current.mmdMesh) {
      addDefaultSphereTextures(sceneRefs.current.mmdMesh);
      alert('✅ 已添加默认Sphere纹理！\n效果应该立即改善。\n\n提示：这是临时方案，最好使用模型自带的sphere纹理文件。');
    } else {
      alert('模型尚未加载，请等待加载完成。');
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // 场景设置
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    // 相机设置
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.set(0, 10, 20);

    // 渲染器设置
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NoToneMapping;  // 使用 NoToneMapping 保持原始颜色
    renderer.toneMappingExposure = 1.4;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    containerRef.current.appendChild(renderer.domElement);
    sceneRefs.current.renderer = renderer;

    // 轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.target.set(0, 10, 0);

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    sceneRefs.current.ambientLight = ambientLight;

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
    sceneRefs.current.directionalLight = directionalLight;

    // 侧面补光
    const sideLight = new THREE.DirectionalLight(0xffffff, 0.5);
    sideLight.position.set(-3, 8, 8);
    scene.add(sideLight);
    sceneRefs.current.sideLight = sideLight;

    // 半球光
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 0.6);
    scene.add(hemisphereLight);
    sceneRefs.current.hemisphereLight = hemisphereLight;

    // 地面
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      roughness: 0.8,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    ground.receiveShadow = true;
    scene.add(ground);

    // 网格辅助线
    const gridHelper = new THREE.GridHelper(100, 100, 0xcccccc, 0xe0e0e0);
    gridHelper.position.y = -9.99;
    scene.add(gridHelper);

    // MMD 加载器和动画助手
    const loader = new MMDLoader();

    // 🎯 配置MMDLoader的资源路径（如果API支持）
    if ('setResourcePath' in loader && typeof (loader as any).setResourcePath === 'function') {
      (loader as any).setResourcePath('https://cdn.bigfile.qhr062.top/mmd/model/yagi39mikuNT1/');
    }

    const helper = new MMDAnimationHelper();
    const clock = new THREE.Clock();

    // 加载 MMD 模型
    setLoadingStatus('正在加载模型...');
    loader.load(
      'https://cdn.bigfile.qhr062.top/mmd/model/yagi39mikuNT1/yagi39mikuNT.pmx',
      (mesh: THREE.SkinnedMesh) => {
        mesh.position.y = -10;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // 🎨 应用MMD材质优化（添加渐变贴图等）
        configureMaterialsForMMD(mesh, {
          enableGradientMap: true,
          shininess: 50,
          specularColor: 0x888888,
        });

        scene.add(mesh);
        sceneRefs.current.mmdMesh = mesh;

        helper.add(mesh, {
          animation: undefined,
          physics: false  // 关闭物理引擎避免错误
        });

        setLoadingStatus('✅ 模型加载成功！');
      },
      (xhr: ProgressEvent) => {
        const percent = (xhr.loaded / xhr.total * 100).toFixed(2);
        setLoadingStatus('加载中... ' + (percent) + '%');
      },
      (error: unknown) => {
        console.error('❌ 模型加载失败:', error);
        setLoadingStatus('❌ 模型加载失败！');

        // 加载失败时显示一个立方体
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.y = 0;
        cube.castShadow = true;
        scene.add(cube);
      }
    );

    // FPS 计数器
    let lastTime = performance.now();
    let frames = 0;

    // 动画循环
    function animate() {
      requestAnimationFrame(animate);

      frames++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (currentTime - lastTime)));
        frames = 0;
        lastTime = currentTime;
      }

      helper.update(clock.getDelta());
      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    // 窗口大小调整
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-white">
      {/* 顶部导航 */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-white/90 backdrop-blur-sm shadow-md">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            🎨 MMD光照调试面板演示
          </h1>
          <p className="text-sm text-gray-700">
            实时调整光照、渲染器和材质参数 | 右侧面板可拖拽调整
          </p>
          <div className="mt-3 flex gap-3 items-center flex-wrap">
            <a
              href="/examples/"
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded text-sm transition-colors"
            >
              ← 返回首页
            </a>
            <button
              onClick={handleDiagnose}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-sm transition-colors"
            >
              🔍 完整诊断
            </button>
            <button
              onClick={handleAddSphereTextures}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm transition-colors"
            >
              🔮 添加Sphere纹理
            </button>
            <span className="text-sm text-gray-600">
              FPS: <span className="font-mono text-blue-600">{fps}</span>
            </span>
            <span className="text-sm text-gray-600">
              {loadingStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 3D 容器 */}
      <div ref={containerRef} className="w-full h-full" />

    </div>
  );
}

