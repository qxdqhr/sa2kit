/**
 * PMX模型编辑器组件
 * 提供可视化的材质纹理绑定编辑功能
 */

import React, { useState, useEffect } from 'react';
import { PMXParser } from '../parser/PMXParser';
import { PMXEditor as PMXEditorCore } from '../editor/PMXEditor';
import { PMXExporter } from '../editor/PMXExporter';
import type { PMXParseResult, PMXMaterial, PMXTexture, MaterialTextureMapping } from '../types';

export interface PMXEditorProps {
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

export const PMXEditor: React.FC<PMXEditorProps> = ({
  modelUrl,
  basePath,
  className = '',
  onParsed,
  onError,
}) => {
  const [editor, setEditor] = useState<PMXEditorCore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'textures' | 'history'>('materials');
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [selectedTexture, setSelectedTexture] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const parser = new PMXParser();
        const parseResult = await parser.loadAndParse(modelUrl);

        const editorInstance = new PMXEditorCore(parseResult);
        setEditor(editorInstance);
        onParsed?.(parseResult);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '初始化失败';
        setError(errorMsg);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [modelUrl, onParsed, onError]);

  const handleExport = () => {
    if (!editor) return;

    const data = editor.getData();
    const exporter = new PMXExporter(data);
    exporter.exportAndDownload(`${data.modelInfo.modelName || 'model'}_edited.pmx`);
  };

  const handleMaterialTextureChange = (
    materialIndex: number,
    textureType: 'main' | 'sphere' | 'toon',
    textureIndex: number
  ) => {
    if (!editor) return;

    try {
      switch (textureType) {
        case 'main':
          editor.setMaterialMainTexture(materialIndex, textureIndex);
          break;
        case 'sphere':
          editor.setMaterialSphereTexture(materialIndex, textureIndex);
          break;
        case 'toon':
          editor.setMaterialToonTexture(materialIndex, textureIndex, false);
          break;
      }
      setRefresh(r => r + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleAddTexture = () => {
    if (!editor) return;

    const path = prompt('请输入纹理路径:');
    if (!path) return;

    try {
      const index = editor.addTexture(path);
      setRefresh(r => r + 1);
      alert(`成功添加纹理 #${index}: ${path}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '添加失败');
    }
  };

  const handleDeleteTexture = (index: number) => {
    if (!editor) return;

    if (!confirm(`确定要删除纹理 #${index} 吗？`)) return;

    try {
      editor.deleteTexture(index);
      setRefresh(r => r + 1);
      alert('删除成功');
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  if (loading) {
    return (
      <div className={`pmx-editor loading ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">正在加载模型...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !editor) {
    return (
      <div className={`pmx-editor error ${className}`}>
        <div className="rounded-lg bg-red-50 p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">❌ 加载错误</h3>
          <p className="text-red-600">{error || '未知错误'}</p>
        </div>
      </div>
    );
  }

  const data = editor.getData();
  const stats = editor.getStats();
  const history = editor.getHistory();
  const unusedTextures = editor.getUnusedTextures();

  return (
    <div className={`pmx-editor ${className}`}>
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{data.modelInfo.modelName}</h2>
            <p className="text-sm text-gray-600">
              {stats.materials} 材质 | {stats.textures} 纹理 | {stats.editHistory} 次编辑
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              💾 导出PMX
            </button>
            {stats.unusedTextures > 0 && (
              <span className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                ⚠️ {stats.unusedTextures} 个未使用纹理
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 px-4">
          {[
            { id: 'materials', label: '🎨 材质编辑' },
            { id: 'textures', label: '🖼️ 纹理管理' },
            { id: 'history', label: '📜 编辑历史' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 font-medium transition-colors ${activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* 材质编辑标签 */}
        {activeTab === 'materials' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 材质列表 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">材质列表 ({data.materials.length})</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {data.materialTextureMappings.map((mapping) => (
                  <div
                    key={mapping.materialIndex}
                    onClick={() => setSelectedMaterial(mapping.materialIndex)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedMaterial === mapping.materialIndex ? 'bg-blue-50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded border"
                        style={{
                          backgroundColor: `rgba(${data.materials[mapping.materialIndex]?.diffuse[0]! * 255}, ${data.materials[mapping.materialIndex]?.diffuse[1]! * 255}, ${data.materials[mapping.materialIndex]?.diffuse[2]! * 255}, 1)`,
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">#{mapping.materialIndex}: {mapping.materialName}</p>
                        <p className="text-xs text-gray-500">
                          {mapping.mainTexture && '🖼️ '}
                          {mapping.sphereTexture && '✨ '}
                          {mapping.toonTexture && '🎨 '}
                          {!mapping.mainTexture && !mapping.sphereTexture && !mapping.toonTexture && '⚪ 无纹理'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 材质详情/编辑器 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  {selectedMaterial !== null ? `编辑材质 #${selectedMaterial}` : '请选择材质'}
                </h3>
              </div>
              {selectedMaterial !== null && (
                <div className="p-4 space-y-4">
                  {/* 主纹理 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🖼️ 主纹理
                    </label>
                    <select
                      value={data.materials[selectedMaterial]!.textureIndex}
                      onChange={(e) => handleMaterialTextureChange(selectedMaterial, 'main', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value={-1}>（无）</option>
                      {data.textures.map((tex) => (
                        <option key={tex.index} value={tex.index}>
                          #{tex.index}: {tex.path}
                        </option>
                      ))}
                    </select>
                    {data.materialTextureMappings[selectedMaterial]?.mainTexture && (
                      <p className="mt-1 text-xs text-gray-500">
                        当前: {data.materialTextureMappings[selectedMaterial]!.mainTexture!.path}
                      </p>
                    )}
                  </div>

                  {/* Sphere纹理 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ✨ Sphere纹理
                    </label>
                    <select
                      value={data.materials[selectedMaterial]!.sphereTextureIndex}
                      onChange={(e) => handleMaterialTextureChange(selectedMaterial, 'sphere', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value={-1}>（无）</option>
                      {data.textures.map((tex) => (
                        <option key={tex.index} value={tex.index}>
                          #{tex.index}: {tex.path}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Toon纹理 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎨 Toon纹理
                    </label>
                    <select
                      value={data.materials[selectedMaterial]!.toonTextureIndex}
                      onChange={(e) => handleMaterialTextureChange(selectedMaterial, 'toon', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={data.materials[selectedMaterial]!.isSharedToon}
                    >
                      <option value={-1}>（无）</option>
                      {data.textures.map((tex) => (
                        <option key={tex.index} value={tex.index}>
                          #{tex.index}: {tex.path}
                        </option>
                      ))}
                    </select>
                    {data.materials[selectedMaterial]!.isSharedToon && (
                      <p className="mt-1 text-xs text-yellow-600">
                        此材质使用共享Toon纹理
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 纹理管理标签 */}
        {activeTab === 'textures' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">纹理管理</h3>
              <button
                onClick={handleAddTexture}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                ➕ 添加纹理
              </button>
            </div>

            {unusedTextures.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  ⚠️ 发现 {unusedTextures.length} 个未使用的纹理
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow divide-y">
              {data.textures.map((texture) => {
                const isUnused = unusedTextures.some(t => t.index === texture.index);
                return (
                  <div key={texture.index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          #{texture.index}: {texture.path}
                          {isUnused && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                              未使用
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {isUnused && (
                          <button
                            onClick={() => handleDeleteTexture(texture.index)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 编辑历史标签 */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">编辑历史 ({history.length})</h3>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  暂无编辑记录
                </div>
              ) : (
                history.map((item, index) => (
                  <div key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {item.operation.type} · {item.operation.action}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

