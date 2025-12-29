/**
 * FX效果Three.js预览组件
 * 展示如何将FX解析结果应用到Three.js渲染中
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { FXToThreeAdapter } from '../FXToThreeAdapter';
import type { FXEffect } from '../types';

export interface FXThreePreviewProps {
  /** FX效果 */
  effect: FXEffect;
  /** 纹理基础路径 */
  texturePath?: string;
  /** 预览对象类型 */
  objectType?: 'sphere' | 'box' | 'torus' | 'plane';
  /** 自定义样式 */
  className?: string;
  /** 是否显示信息面板 */
  showInfo?: boolean;
}

export const FXThreePreview: React.FC<FXThreePreviewProps> = ({
  effect,
  texturePath = '',
  objectType = 'sphere',
  className = '',
  showInfo = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adapterInfo, setAdapterInfo] = useState<{
    materialParams: string[];
    textures: string[];
    renderFeatures: string[];
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const container = containerRef.current!;
        const width = container.clientWidth || 600;
        const height = container.clientHeight || 400;

        // 创建场景
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        sceneRef.current = scene;

        // 创建相机
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 2, 5);
        cameraRef.current = camera;

        // 创建渲染器
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 创建控制器
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controlsRef.current = controls;

        // 创建适配器
        const adapter = new FXToThreeAdapter(effect, texturePath);

        // 加载纹理
        console.log('Loading textures...');
        await adapter.loadTextures();

        // 配置场景（添加光源等）
        adapter.configureScene(scene, renderer);

        // 创建几何体
        let geometry: THREE.BufferGeometry;
        switch (objectType) {
          case 'box':
            geometry = new THREE.BoxGeometry(2, 2, 2);
            break;
          case 'torus':
            geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
            break;
          case 'plane':
            geometry = new THREE.PlaneGeometry(3, 3);
            break;
          default:
            geometry = new THREE.SphereGeometry(1.5, 32, 32);
        }

        // 创建材质
        const material = adapter.createMaterial();
        
        // 创建网格
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        meshRef.current = mesh;

        // 添加地面（用于阴影）
        const renderConfig = adapter.extractRenderConfig();
        if (renderConfig.enableShadow) {
          const groundGeometry = new THREE.PlaneGeometry(10, 10);
          const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3e });
          const ground = new THREE.Mesh(groundGeometry, groundMaterial);
          ground.rotation.x = -Math.PI / 2;
          ground.position.y = -2;
          ground.receiveShadow = true;
          scene.add(ground);
        }

        // 获取适配器信息
        setAdapterInfo(adapter.getSummary());

        // 渲染循环
        const animate = () => {
          animationIdRef.current = requestAnimationFrame(animate);

          if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
          }

          if (controlsRef.current) {
            controlsRef.current.update();
          }

          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        };

        animate();
        setLoading(false);

      } catch (err) {
        console.error('FX Preview initialization error:', err);
        setError(err instanceof Error ? err.message : '初始化失败');
        setLoading(false);
      }
    };

    init();

    // 清理
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [effect, texturePath, objectType]);

  if (loading) {
    return (
      <div className={`fx-three-preview loading ${className}`}>
        <div className="preview-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`fx-three-preview error ${className}`}>
        <div className="preview-error">
          <h3>❌ 渲染失败</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fx-three-preview ${className}`}>
      <div 
        ref={containerRef} 
        className="preview-container"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          position: 'relative',
        }}
      />
      
      {showInfo && adapterInfo && (
        <div className="preview-info">
          <div className="info-section">
            <h4>🎨 应用的FX参数</h4>
            <div className="info-badges">
              <span className="badge">{adapterInfo.materialParams.length} 个材质参数</span>
              <span className="badge">{adapterInfo.textures.length} 个纹理</span>
              <span className="badge">{adapterInfo.renderFeatures.length} 个渲染特性</span>
            </div>
          </div>

          {adapterInfo.renderFeatures.length > 0 && (
            <div className="info-section">
              <h5>启用的特性:</h5>
              <div className="feature-list">
                {adapterInfo.renderFeatures.map((feature, idx) => (
                  <span key={idx} className="feature-tag">{feature}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .fx-three-preview {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .fx-three-preview.loading,
        .fx-three-preview.error {
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .preview-loading {
          font-size: 1.1rem;
          color: #666;
        }

        .preview-error {
          text-align: center;
          color: #d32f2f;
          padding: 2rem;
        }

        .preview-error h3 {
          margin: 0 0 1rem;
        }

        .preview-container {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .preview-info {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .info-section {
          margin-bottom: 1rem;
        }

        .info-section:last-child {
          margin-bottom: 0;
        }

        .info-section h4 {
          margin: 0 0 0.75rem;
          font-size: 1rem;
          color: #333;
        }

        .info-section h5 {
          margin: 0 0 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }

        .info-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .badge {
          display: inline-block;
          padding: 0.4rem 0.8rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .feature-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .feature-tag {
          display: inline-block;
          padding: 0.3rem 0.7rem;
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

FXThreePreview.displayName = 'FXThreePreview';

