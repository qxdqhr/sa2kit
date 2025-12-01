import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MMDLoader, MMDAnimationHelper, OutlineEffect } from 'three-stdlib';
import { MMDPlayerBaseProps } from '../types';
import { loadAmmo } from '../utils/ammo-loader';

export const MMDPlayerBase: React.FC<MMDPlayerBaseProps> = ({
  modelUrl,
  vmdUrl,
  cameraUrl,
  audioUrl,
  physics = true,
  width = '100%',
  height = '100%',
  onLoad,
  onProgress,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      let scene: THREE.Scene;
      let camera: THREE.PerspectiveCamera;
      let renderer: THREE.WebGLRenderer;
      let effect: OutlineEffect;
      let helper: MMDAnimationHelper;
      let clock: THREE.Clock;
      let animationId: number;

      try {
        setLoading(true);
        setError(null);

        if (physics) {
          await loadAmmo({
            scriptPath: '/mikutalking/libs/ammo.wasm.js',
            wasmBasePath: '/mikutalking/libs/',
          });
        }

        const container = containerRef.current!;
        const w = container.clientWidth;
        const h = container.clientHeight;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        camera = new THREE.PerspectiveCamera(45, w / h, 1, 2000);
        camera.position.z = 30;

        const ambient = new THREE.AmbientLight(0x666666);
        scene.add(ambient);

        const directionalLight = new THREE.DirectionalLight(0x887766);
        directionalLight.position.set(-1, 1, 1).normalize();
        scene.add(directionalLight);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
        container.appendChild(renderer.domElement);

        effect = new OutlineEffect(renderer);

        helper = new MMDAnimationHelper({ afterglow: 2.0 });

        const loader = new MMDLoader();

        const mesh = await new Promise<THREE.Object3D>((resolve, reject) => {
          loader.load(modelUrl, resolve, onProgress, reject);
        });
        scene.add(mesh);

        const isSkinnedMeshWithSkeleton = (object: THREE.Object3D): object is THREE.SkinnedMesh => {
          return (object as THREE.SkinnedMesh).isSkinnedMesh === true && (object as THREE.SkinnedMesh).skeleton !== undefined && (object as THREE.SkinnedMesh).skeleton !== null;
        };

        if (isSkinnedMeshWithSkeleton(mesh)) {
          // Load VMD (Model Motion)
          if (vmdUrl) {
            const vmdObject = await new Promise<THREE.AnimationClip>((resolve, reject) => {
              loader.loadAnimation(vmdUrl, mesh, (anim) => resolve(anim as THREE.AnimationClip), onProgress, reject);
            });
            helper.add(mesh, { animation: vmdObject, physics });
          } else {
            helper.add(mesh, { physics });
          }
        } else {
          console.warn('MMDPlayerBase: Loaded mesh is not a SkinnedMesh or does not have a skeleton. Skipping animation and physics for this mesh.');
        }

        // Load Camera Motion
        if (cameraUrl) {
          const cameraVmdObject = await new Promise<THREE.AnimationClip>((resolve, reject) => {
            loader.loadAnimation(cameraUrl, camera, (anim) => resolve(anim as THREE.AnimationClip), onProgress, reject);
          });
          helper.add(camera, { animation: cameraVmdObject });
        }

        if (audioUrl) {
          const buffer = await new Promise<AudioBuffer>((resolve, reject) => {
            new THREE.AudioLoader().load(audioUrl, resolve, undefined, reject);
          });
          const listener = new THREE.AudioListener();
          camera.add(listener);
          const audio = new THREE.Audio(listener);
          audio.setBuffer(buffer);
          helper.add(audio as any);
        }

        clock = new THREE.Clock();

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          helper.update(clock.getDelta());
          effect.render(scene, camera);
        };

        animate();

        const handleResize = () => {
          if (!container) return;
          const w = container.clientWidth;
          const h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          effect.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);

        if (onLoad) onLoad();
        setLoading(false);

        cleanup = () => {
          console.log('🧹 [MMDPlayer] Cleaning up resources...');
          cancelAnimationFrame(animationId);
          window.removeEventListener('resize', handleResize);

          if (helper) (helper as any).dispose();
          
          if (scene) {
            scene.traverse(object => {
              if (object instanceof THREE.Mesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                  if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                  } else {
                    object.material.dispose();
                  }
                }
              }
            });
          }

          if (renderer) {
            renderer.dispose();
            const domElement = renderer.domElement;
            if (domElement && domElement.parentNode) {
              domElement.parentNode.removeChild(domElement);
            }
          }
           console.log('✅ [MMDPlayer] Cleanup complete.');
        };

      } catch (e: any) {
        console.error('Error during MMD initialization:', e);
        setError(e.message || 'Initialization error');
        setLoading(false);
        if (onError) onError(e);
      }
    };

    init();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [modelUrl, vmdUrl, cameraUrl, audioUrl, physics, onLoad, onProgress, onError]);

  return (
    <div 
      ref={containerRef} 
      style={{ width, height, position: 'relative', overflow: 'hidden' }}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f0f0f0',
          color: '#666',
          zIndex: 1
        }}>
          Loading MMD...
        </div>
      )}
      {error && (
         <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#ffeeee',
            color: '#cc0000',
            zIndex: 2
          }}>
            {error}
          </div>
      )}
    </div>
  );
};
