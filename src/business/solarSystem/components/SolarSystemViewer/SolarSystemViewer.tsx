'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SUN, PLANETS } from '../../utils/planetData';
import { calculatePlanetPosition, generateOrbitPath } from '../../utils/astronomyUtils';
import type { 
  SolarSystemViewerProps, 
  SolarSystemConfig, 
  TimeControlState,
  CelestialObject3D,
  Planet 
} from '../../types';

// 默认配置
const DEFAULT_CONFIG: SolarSystemConfig = {
  scale: {
    distance: 15, // 距离缩放（实际太阳系太大，需要压缩）
    size: 10, // 大小缩放（让行星可见）
    time: 365, // 时间缩放（1天=1年）
  },
  display: {
    showOrbits: true,
    showLabels: true,
    showStars: true,
    showGrid: false,
  },
  quality: {
    planetSegments: 32,
    orbitSegments: 128,
    enableShadows: false,
    enableBloom: false,
  },
};

export const SolarSystemViewer: React.FC<SolarSystemViewerProps> = ({
  className,
  width = '100%',
  height = '600px',
  config = {},
  onPlanetClick,
  onTimeChange,
  onError,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
  
  const celestialObjectsRef = useRef<Map<string, CelestialObject3D>>(new Map());
  const [timeState, setTimeState] = useState<TimeControlState>({
    currentTime: new Date(),
    timeScale: DEFAULT_CONFIG.scale.time,
    isPlaying: true,
    startTime: new Date(),
    maxTimeScale: 3650, // 10年/天
    minTimeScale: 1, // 实时
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 错误处理
  const handleError = useCallback((err: Error) => {
    console.error('太阳系组件错误:', err);
    setError(err);
    onError?.(err);
  }, [onError]);

  // 创建星空背景
  const createStarField = useCallback((scene: THREE.Scene) => {
    if (!finalConfig.display.showStars) return;

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 2000;
      starPositions[i + 1] = (Math.random() - 0.5) * 2000;
      starPositions[i + 2] = (Math.random() - 0.5) * 2000;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: false,
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  }, [finalConfig.display.showStars]);

  // 创建太阳
  const createSun = useCallback((scene: THREE.Scene) => {
    const sunGeometry = new THREE.SphereGeometry(
      SUN.radius * finalConfig.scale.size * 0.05, // 缩小太阳以适合显示
      finalConfig.quality.planetSegments,
      finalConfig.quality.planetSegments
    );
    
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: SUN.color,
    });
    
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);
    
    // 添加太阳光照
    const sunLight = new THREE.PointLight(0xffffff, 1, 0);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambientLight);
    
    const sunObject: CelestialObject3D = {
      id: SUN.id,
      mesh: sunMesh,
      data: SUN,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
    };
    
    celestialObjectsRef.current.set(SUN.id, sunObject);
  }, [finalConfig.scale.size, finalConfig.quality.planetSegments]);

  // 创建行星
  const createPlanet = useCallback((planet: Planet, scene: THREE.Scene) => {
    // 行星几何体
    const planetRadius = planet.radius * finalConfig.scale.size;
    console.log(`创建行星 ${planet.name}, 半径: ${planetRadius}`);
    
    const planetGeometry = new THREE.SphereGeometry(
      planetRadius,
      finalConfig.quality.planetSegments,
      finalConfig.quality.planetSegments
    );
    
    const planetMaterial = new THREE.MeshLambertMaterial({
      color: planet.color,
    });
    
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planetMesh);
    
    // 轨道路径
    let orbitLine: THREE.Line | undefined;
    if (finalConfig.display.showOrbits) {
      const orbitPoints = generateOrbitPath(
        planet.orbitalElements,
        finalConfig.quality.orbitSegments,
        finalConfig.scale.distance
      ).map((p) => new THREE.Vector3(p.x, p.y, p.z));
      
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: planet.color,
        opacity: 0.3,
        transparent: true,
      });
      
      orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbitLine);
    }
    
    // 行星标签（如果需要）
    let label: THREE.Sprite | undefined;
    if (finalConfig.display.showLabels) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 128;
      canvas.height = 32;
      
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, 128, 32);
      context.fillStyle = 'white';
      context.font = '16px Arial';
      context.textAlign = 'center';
      context.fillText(planet.name, 64, 20);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      label = new THREE.Sprite(spriteMaterial);
      label.scale.set(10, 2.5, 1);
      scene.add(label);
    }
    
    const planetObject: CelestialObject3D = {
      id: planet.id,
      mesh: planetMesh,
      data: planet,
      orbit: orbitLine,
      label,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
    };
    
    celestialObjectsRef.current.set(planet.id, planetObject);
  }, [finalConfig.scale, finalConfig.quality, finalConfig.display]);

  // 更新行星位置
  const updatePlanetPositions = useCallback((currentTime: Date) => {
    let planetCount = 0;
    celestialObjectsRef.current.forEach((obj, id) => {
      if (id === 'sun') return;
      
      const planet = obj.data as Planet;
      const position = calculatePlanetPosition(planet, currentTime, finalConfig.scale.distance);
      
      // 只对第一个行星打印调试信息，避免日志过多
      if (planetCount === 0) {
        console.log(`更新 ${planet.name} 位置:`, position.x.toFixed(2), position.y.toFixed(2), position.z.toFixed(2));
      }
      planetCount++;
      
      obj.mesh.position.set(position.x, position.y, position.z);
      obj.position.set(position.x, position.y, position.z);

      // 更新标签位置
      if (obj.label) {
        obj.label.position.set(
          position.x,
          position.y + planet.radius * finalConfig.scale.size + 5,
          position.z,
        );
      }
    });
  }, [finalConfig.scale]);

  // 动画循环
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    
    // 更新时间
    if (timeState.isPlaying) {
      const newTime = new Date(
        timeState.currentTime.getTime() + 
        (timeState.timeScale * 24 * 60 * 60 * 1000) / 60 // 每秒增加的毫秒数
      );
      
      setTimeState((prev: TimeControlState) => ({ ...prev, currentTime: newTime }));
      updatePlanetPositions(newTime);
      onTimeChange?.(newTime);
    }
    
    // 更新控制器
    controlsRef.current?.update();
    
    // 渲染场景
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    
    animationIdRef.current = requestAnimationFrame(animate);
  }, [timeState, updatePlanetPositions, onTimeChange]);

  // 处理点击事件
  const handleClick = useCallback((event: MouseEvent) => {
    if (!cameraRef.current || !rendererRef.current || !mountRef.current) return;
    
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    const meshes = Array.from(celestialObjectsRef.current.values()).map(obj => obj.mesh);
    const intersects = raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object as THREE.Mesh;
      const celestialObject = Array.from(celestialObjectsRef.current.values())
        .find(obj => obj.mesh === intersectedMesh);
      
      if (celestialObject && celestialObject.data.type === 'planet') {
        onPlanetClick?.(celestialObject.data as Planet);
      }
    }
  }, [onPlanetClick]);

  // 初始化场景
  useEffect(() => {
    if (!mountRef.current) return;

    try {
      setIsLoading(true);
      
      // 创建场景
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      
      // 创建相机
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        10000
      );
      camera.position.set(0, 80, 150);
      cameraRef.current = camera;
      
      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setClearColor(0x000011);
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // 创建控制器
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxDistance = 2000;
      controls.minDistance = 5;
      controlsRef.current = controls;
      
      // 添加网格（如果需要）
      if (finalConfig.display.showGrid) {
        const gridHelper = new THREE.GridHelper(200, 50, 0x404040, 0x404040);
        scene.add(gridHelper);
      }
      
      // 创建天体
      createStarField(scene);
      createSun(scene);
      
      PLANETS.forEach(planet => {
        createPlanet(planet, scene);
      });
      
      // 初始位置更新
      updatePlanetPositions(timeState.currentTime);
      
      // 添加点击事件
      renderer.domElement.addEventListener('click', handleClick);
      
      // 开始动画
      animate();
      
      setIsLoading(false);
    } catch (err) {
      handleError(err as Error);
    }

    // 清理函数
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      controlsRef.current?.dispose();
      
      // 清理几何体和材质
      celestialObjectsRef.current.forEach(obj => {
        obj.mesh.geometry.dispose();
        if (Array.isArray(obj.mesh.material)) {
          obj.mesh.material.forEach((material: THREE.Material) => material.dispose());
        } else {
          (obj.mesh.material as THREE.Material).dispose();
        }
      });
      
      celestialObjectsRef.current.clear();
    };
  }, []); // 只在组件挂载时初始化

  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} 
           style={{ width, height }}>
        <div className="text-center text-red-500">
          <div className="text-lg font-semibold mb-2">太阳系加载失败</div>
          <div className="text-sm">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <div ref={mountRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <div className="mb-2">🌌</div>
            <div>正在加载太阳系...</div>
          </div>
        </div>
      )}
      
      {/* 时间显示 */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
        <div className="text-sm">
          {timeState.currentTime.toLocaleDateString('zh-CN')}
        </div>
        <div className="text-xs opacity-75">
          时间倍率: {timeState.timeScale}x
        </div>
        <div className="text-xs opacity-75">
          天体数量: {celestialObjectsRef.current.size}
        </div>
      </div>
      
      {/* 控制提示 */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-xs">
        <div>鼠标拖拽: 旋转视角</div>
        <div>滚轮: 缩放</div>
        <div>点击行星: 查看详情</div>
      </div>
    </div>
  );
};

export default SolarSystemViewer; 