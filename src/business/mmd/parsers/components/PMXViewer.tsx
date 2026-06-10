/**
 * PMX模型信息查看器组件
 * 用于可视化展示PMX模型的纹理映射关系
 */

import React, { useState, useEffect } from 'react';
import { PMXParser } from '../PMXParser';
import type { PMXParseResult, MaterialTextureMapping } from '../types';
import { clsx } from 'clsx';

export interface PMXViewerProps {
  /** PMX模型文件URL */
  modelUrl: string;
  /** 基础路径（用于拼接纹理URL） */
  basePath?: string;
  /** 自定义样式类名 */
  className?: string;
  /** 解析完成回调 */
  onParsed?: (result: PMXParseResult) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

export const PMXViewer: React.FC<PMXViewerProps> = ({
  modelUrl,
  basePath,
  className = '',
  onParsed,
  onError,
}) => {
  const [result, setResult] = useState<PMXParseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'textures' | 'materials' | 'mappings'>('overview');

  useEffect(() => {
    const parse = async () => {
      try {
        setLoading(true);
        setError(null);

        const parser = new PMXParser();
        const parseResult = await parser.loadAndParse(modelUrl);
        
        setResult(parseResult);
        onParsed?.(parseResult);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '解析失败';
        setError(errorMsg);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        setLoading(false);
      }
    };

    parse();
  }, [modelUrl, onParsed, onError]);

  const getTextureUrl = (path: string): string => {
    if (!basePath) return path;
    // 处理路径分隔符
    const normalizedPath = path.replace(/\\/g, '/');
    return (basePath) + '/' + (normalizedPath);
  };

  if (loading) {
    return (
      <div className={clsx('pmx-viewer loading', className)}>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">正在解析PMX模型...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={clsx('pmx-viewer error', className)}>
        <div className="rounded-lg bg-red-50 p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">❌ 解析错误</h3>
          <p className="text-red-600">{error || '未知错误'}</p>
        </div>
      </div>
    );
  }

  const { header, modelInfo, textures, materials, materialTextureMappings, vertexCount, faceCount } = result;

  return (
    <div className={clsx('pmx-viewer', className)}>
      {/* 标签页导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4">
          {[
            { id: 'overview', label: '📊 概览' },
            { id: 'textures', label: '🖼️ 纹理列表' },
            { id: 'materials', label: '🎨 材质列表' },
            { id: 'mappings', label: '🔗 映射关系' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx('py-2 px-4 font-medium transition-colors', activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900')}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 概览标签 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">模型信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">模型名称</p>
                <p className="font-medium">{modelInfo.modelName || '未命名'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">英文名称</p>
                <p className="font-medium">{modelInfo.modelNameEnglish || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">PMX版本</p>
                <p className="font-medium">{header.version}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">编码格式</p>
                <p className="font-medium">
                  {header.globals.encoding === 0 ? 'UTF-16LE' : 'UTF-8'}
                </p>
              </div>
            </div>
            {modelInfo.comment && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">注释</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{modelInfo.comment}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">顶点数</p>
              <p className="text-2xl font-bold text-blue-900">{vertexCount.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">面数</p>
              <p className="text-2xl font-bold text-green-900">{faceCount.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 mb-1">纹理数</p>
              <p className="text-2xl font-bold text-purple-900">{textures.length}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 mb-1">材质数</p>
              <p className="text-2xl font-bold text-orange-900">{materials.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* 纹理列表标签 */}
      {activeTab === 'textures' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">纹理列表 ({textures.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {textures.map((texture) => (
              <div key={texture.index} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                    #{texture.index}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{texture.path}</p>
                    <p className="text-sm text-gray-500 mt-1">完整URL:</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1 overflow-x-auto">
                      {getTextureUrl(texture.path)}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 材质列表标签 */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">材质列表 ({materials.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {materials.map((material, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded border border-gray-300"
                    style={{
                      backgroundColor: 'rgba(' + (material.diffuse[0] * 255) + ', ' + (material.diffuse[1] * 255) + ', ' + (material.diffuse[2] * 255) + ', ' + (material.diffuse[3]) + ')',
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{material.name || '材质 #' + (index)}</p>
                    {material.nameEnglish && (
                      <p className="text-sm text-gray-600">{material.nameEnglish}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        面数: {material.surfaceCount / 3}
                      </span>
                      {material.textureIndex >= 0 && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                          纹理: #{material.textureIndex}
                        </span>
                      )}
                      {material.sphereTextureIndex >= 0 && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          Sphere: #{material.sphereTextureIndex}
                        </span>
                      )}
                      {material.toonTextureIndex >= 0 && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          Toon: {material.isSharedToon ? '共享#' + (material.toonTextureIndex) : '#' + (material.toonTextureIndex)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 映射关系标签 */}
      {activeTab === 'mappings' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">材质-纹理映射关系 ({materialTextureMappings.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {materialTextureMappings.map((mapping) => (
              <div key={mapping.materialIndex} className="p-4 hover:bg-gray-50">
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900">
                    材质 #{mapping.materialIndex}: {mapping.materialName}
                  </h4>
                  {mapping.materialNameEnglish && (
                    <p className="text-sm text-gray-600">{mapping.materialNameEnglish}</p>
                  )}
                </div>
                
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  {mapping.mainTexture && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">🖼️ 主纹理</p>
                      <p className="text-sm text-gray-900">{mapping.mainTexture.path}</p>
                      <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded block mt-1">
                        {getTextureUrl(mapping.mainTexture.path)}
                      </code>
                    </div>
                  )}
                  
                  {mapping.sphereTexture && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        ✨ Sphere纹理 ({mapping.sphereTexture.mode})
                      </p>
                      <p className="text-sm text-gray-900">{mapping.sphereTexture.path}</p>
                      <code className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded block mt-1">
                        {getTextureUrl(mapping.sphereTexture.path)}
                      </code>
                    </div>
                  )}
                  
                  {mapping.toonTexture && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        🎨 Toon纹理 {mapping.toonTexture.isShared && '(共享)'}
                      </p>
                      <p className="text-sm text-gray-900">{mapping.toonTexture.path}</p>
                      {!mapping.toonTexture.isShared && (
                        <code className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded block mt-1">
                          {getTextureUrl(mapping.toonTexture.path)}
                        </code>
                      )}
                    </div>
                  )}
                  
                  {!mapping.mainTexture && !mapping.sphereTexture && !mapping.toonTexture && (
                    <p className="text-sm text-gray-500 italic">无纹理绑定</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};





