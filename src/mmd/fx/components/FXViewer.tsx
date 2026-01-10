/**
 * FX文件查看器组件
 * 用于可视化展示FX文件的解析结果
 */

import React, { useState, useEffect } from 'react';
import { FXParser } from '../FXParser';
import type { FXEffect, FXSummary } from '../types';
import { getConfigSummaryText, validateFXEffect } from '../utils';
import { clsx } from 'clsx';

export interface FXViewerProps {
  /** FX文件URL或内容 */
  source: string;
  /** 是否是文件内容（true）还是URL（false） */
  isContent?: boolean;
  /** 文件名 */
  fileName?: string;
  /** 解析完成回调 */
  onParsed?: (effect: FXEffect) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 自定义样式 */
  className?: string;
}

export const FXViewer: React.FC<FXViewerProps> = ({
  source,
  isContent = false,
  fileName = 'effect.fx',
  onParsed,
  onError,
  className = '',
}) => {
  const [effect, setEffect] = useState<FXEffect | null>(null);
  const [summary, setSummary] = useState<FXSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'defines' | 'textures' | 'parameters' | 'validation'>('summary');

  useEffect(() => {
    const parse = async () => {
      try {
        setLoading(true);
        setError(null);

        const parser = new FXParser();
        let parsedEffect: FXEffect;

        if (isContent) {
          parsedEffect = parser.parse(source, fileName);
        } else {
          parsedEffect = await parser.loadAndParse(source);
        }

        setEffect(parsedEffect);
        setSummary(parser.generateSummary(parsedEffect));
        onParsed?.(parsedEffect);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '解析失败';
        setError(errorMsg);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        setLoading(false);
      }
    };

    parse();
  }, [source, isContent, fileName, onParsed, onError]);

  if (loading) {
    return (
      <div className={clsx('font-sans bg-white border border-gray-300 rounded-lg overflow-hidden p-8 text-center', className)}>
        <div className="text-xl text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error || !effect || !summary) {
    return (
      <div className={clsx('font-sans bg-white border border-gray-300 rounded-lg overflow-hidden p-8 text-center', className)}>
        <div className="text-red-700">
          <h3 className="m-0 mb-4 text-2xl">❌ 解析错误</h3>
          <p>{error || '未知错误'}</p>
        </div>
      </div>
    );
  }

  const validation = validateFXEffect(effect);

  return (
    <div className={clsx('font-sans bg-white border border-gray-300 rounded-lg overflow-hidden', className)}>
      <div className="p-4 md:p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <h2 className="m-0 mb-2 text-xl md:text-2xl font-semibold">{effect.fileName}</h2>
        <p className="m-0 text-sm opacity-90">{getConfigSummaryText(effect)}</p>
      </div>

      <div className="flex bg-gray-100 border-b border-gray-300 overflow-x-auto">
        <button
          className={clsx('flex-1 min-w-[80px] md:min-w-[100px] px-3 md:px-4 py-2 md:py-3 border-none bg-transparent text-gray-600 text-xs md:text-sm cursor-pointer transition-all border-b-2', activeTab === 'summary'
              ? 'bg-white text-indigo-500 border-b-indigo-500 font-semibold'
              : 'border-b-transparent hover:bg-gray-200 hover:text-gray-800')}
          onClick={() => setActiveTab('summary')}
        >
          摘要
        </button>
        <button
          className={clsx('flex-1 min-w-[80px] md:min-w-[100px] px-3 md:px-4 py-2 md:py-3 border-none bg-transparent text-gray-600 text-xs md:text-sm cursor-pointer transition-all border-b-2', activeTab === 'defines'
              ? 'bg-white text-indigo-500 border-b-indigo-500 font-semibold'
              : 'border-b-transparent hover:bg-gray-200 hover:text-gray-800')}
          onClick={() => setActiveTab('defines')}
        >
          宏定义 ({summary.defineCount})
        </button>
        <button
          className={clsx('flex-1 min-w-[80px] md:min-w-[100px] px-3 md:px-4 py-2 md:py-3 border-none bg-transparent text-gray-600 text-xs md:text-sm cursor-pointer transition-all border-b-2', activeTab === 'textures'
              ? 'bg-white text-indigo-500 border-b-indigo-500 font-semibold'
              : 'border-b-transparent hover:bg-gray-200 hover:text-gray-800')}
          onClick={() => setActiveTab('textures')}
        >
          纹理 ({summary.textureCount})
        </button>
        <button
          className={clsx('flex-1 min-w-[80px] md:min-w-[100px] px-3 md:px-4 py-2 md:py-3 border-none bg-transparent text-gray-600 text-xs md:text-sm cursor-pointer transition-all border-b-2', activeTab === 'parameters'
              ? 'bg-white text-indigo-500 border-b-indigo-500 font-semibold'
              : 'border-b-transparent hover:bg-gray-200 hover:text-gray-800')}
          onClick={() => setActiveTab('parameters')}
        >
          参数 ({summary.parameterCount})
        </button>
        <button
          className={clsx('flex-1 min-w-[80px] md:min-w-[100px] px-3 md:px-4 py-2 md:py-3 border-none bg-transparent text-gray-600 text-xs md:text-sm cursor-pointer transition-all border-b-2', activeTab === 'validation'
              ? 'bg-white text-indigo-500 border-b-indigo-500 font-semibold'
              : 'border-b-transparent hover:bg-gray-200 hover:text-gray-800')}
          onClick={() => setActiveTab('validation')}
        >
          验证
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[500px] md:max-h-[600px] overflow-y-auto">
        {activeTab === 'summary' && (
          <SummaryTab summary={summary} effect={effect} />
        )}
        {activeTab === 'defines' && (
          <DefinesTab effect={effect} />
        )}
        {activeTab === 'textures' && (
          <TexturesTab effect={effect} />
        )}
        {activeTab === 'parameters' && (
          <ParametersTab effect={effect} />
        )}
        {activeTab === 'validation' && (
          <ValidationTab validation={validation} />
        )}
      </div>
    </div>
  );
};

const SummaryTab: React.FC<{ summary: FXSummary; effect: FXEffect }> = ({ summary, effect }) => (
  <div>
    <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 mb-8">
      <div className="p-6 bg-gradient-to-br from-gray-100 to-blue-100 rounded-lg text-center">
        <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">宏定义</div>
        <div className="text-3xl font-bold text-gray-800">{summary.defineCount}</div>
      </div>
      <div className="p-6 bg-gradient-to-br from-gray-100 to-blue-100 rounded-lg text-center">
        <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">参数</div>
        <div className="text-3xl font-bold text-gray-800">{summary.parameterCount}</div>
      </div>
      <div className="p-6 bg-gradient-to-br from-gray-100 to-blue-100 rounded-lg text-center">
        <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">纹理</div>
        <div className="text-3xl font-bold text-gray-800">{summary.textureCount}</div>
      </div>
      <div className="p-6 bg-gradient-to-br from-gray-100 to-blue-100 rounded-lg text-center">
        <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Technique</div>
        <div className="text-3xl font-bold text-gray-800">{summary.techniqueCount}</div>
      </div>
    </div>

    <div className="mt-8">
      <h3 className="text-lg m-0 mb-4 text-gray-800 border-b-2 border-indigo-500 pb-2">功能特性</h3>
      <div className="flex flex-wrap gap-3">
        <div className={clsx('px-4 py-2 rounded-full text-sm font-medium', summary.hasLocalShadow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
          {summary.hasLocalShadow ? '✓' : '✗'} LocalShadow
        </div>
        <div className={clsx('px-4 py-2 rounded-full text-sm font-medium', summary.hasExcellentShadow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
          {summary.hasExcellentShadow ? '✓' : '✗'} ExcellentShadow
        </div>
        <div className={clsx('px-4 py-2 rounded-full text-sm font-medium', summary.hasHgShadow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
          {summary.hasHgShadow ? '✓' : '✗'} HgShadow
        </div>
      </div>
    </div>

    {effect.includes.length > 0 && (
      <div className="mt-8">
        <h3 className="text-lg m-0 mb-4 text-gray-800 border-b-2 border-indigo-500 pb-2">包含文件</h3>
        <ul className="list-none p-0 m-0">
          {effect.includes.map((inc, idx) => (
            <li key={idx} className="py-2 border-b border-gray-200 last:border-b-0">
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{inc}</code>
            </li>
          ))}
        </ul>
      </div>
    )}

    {effect.controllers.length > 0 && (
      <div className="mt-8">
        <h3 className="text-lg m-0 mb-4 text-gray-800 border-b-2 border-indigo-500 pb-2">控制器</h3>
        <ul className="list-none p-0 m-0">
          {effect.controllers.map((ctrl, idx) => (
            <li key={idx} className="py-2 border-b border-gray-200 last:border-b-0">
              <strong>{ctrl.name}</strong>: {ctrl.objectName} / {ctrl.itemName}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const DefinesTab: React.FC<{ effect: FXEffect }> = ({ effect }) => (
  <div>
    <table className="w-full border-collapse text-xs md:text-sm">
      <thead className="bg-gray-100 border-b-2 border-gray-300">
        <tr>
          <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">名称</th>
          <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">值</th>
          <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">状态</th>
          <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">行号</th>
        </tr>
      </thead>
      <tbody>
        {effect.defines.map((define, idx) => (
          <tr key={idx} className={clsx('hover:bg-gray-50', define.isCommented ? 'opacity-50' : '')}>
            <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{define.name}</code>
            </td>
            <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">{define.value || '-'}</td>
            <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">
              <span className={clsx('inline-block px-3 py-1 rounded-xl text-xs font-medium', define.isCommented ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                {define.isCommented ? '禁用' : '启用'}
              </span>
            </td>
            <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">{define.lineNumber}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TexturesTab: React.FC<{ effect: FXEffect }> = ({ effect }) => (
  <div>
    {effect.textures.length === 0 ? (
      <p className="text-center text-gray-500 py-8 italic">未找到纹理定义</p>
    ) : (
      <table className="w-full border-collapse text-xs md:text-sm">
        <thead className="bg-gray-100 border-b-2 border-gray-300">
          <tr>
            <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">名称</th>
            <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">路径</th>
            <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">尺寸</th>
            <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">用途</th>
          </tr>
        </thead>
        <tbody>
          {effect.textures.map((texture, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{texture.name}</code>
              </td>
              <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">{texture.path}</td>
              <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">
                {texture.width && texture.height ? (texture.width) + '×' + (texture.height) : '-'}
              </td>
              <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">{texture.purpose || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const ParametersTab: React.FC<{ effect: FXEffect }> = ({ effect }) => (
  <div>
    <table className="w-full border-collapse text-xs md:text-sm">
      <thead className="bg-gray-100 border-b-2 border-gray-300">
        <tr>
          <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">名称</th>
          <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">类型</th>
          <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">语义</th>
          <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">默认值</th>
          <th className="px-2 md:px-3 py-2 md:py-3 text-left font-semibold text-gray-800">行号</th>
        </tr>
      </thead>
      <tbody>
        {effect.parameters.map((param, idx) => (
          <tr key={idx} className="hover:bg-gray-50">
            <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{param.name}</code>
            </td>
            <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{param.type}</code>
            </td>
            <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">{param.semantic || '-'}</td>
            <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">{param.defaultValue || '-'}</td>
            <td className="px-2 md:px-3 py-2 md:py-3 border-b border-gray-200">{param.lineNumber}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ValidationTab: React.FC<{ validation: ReturnType<typeof validateFXEffect> }> = ({ validation }) => (
  <div>
    <div className={clsx('p-6 rounded-lg mb-6 text-center', validation.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
      <h3 className="m-0 text-xl">{validation.isValid ? '✓ 验证通过' : '✗ 验证失败'}</h3>
    </div>

    {validation.errors.length > 0 && (
      <div className="mb-6">
        <h4 className="m-0 mb-3 text-base text-gray-800">错误 ({validation.errors.length})</h4>
        <ul className="list-none p-0 m-0">
          {validation.errors.map((error, idx) => (
            <li key={idx} className="p-3 mb-2 bg-red-100 text-red-800 rounded border-l-4 border-red-800">
              {error}
            </li>
          ))}
        </ul>
      </div>
    )}

    {validation.warnings.length > 0 && (
      <div className="mb-6">
        <h4 className="m-0 mb-3 text-base text-gray-800">警告 ({validation.warnings.length})</h4>
        <ul className="list-none p-0 m-0">
          {validation.warnings.map((warning, idx) => (
            <li key={idx} className="p-3 mb-2 bg-orange-100 text-orange-700 rounded border-l-4 border-orange-700">
              {warning}
            </li>
          ))}
        </ul>
      </div>
    )}

    {validation.isValid && validation.warnings.length === 0 && (
      <p className="text-center text-green-800 py-8 text-lg">FX文件结构完整，没有发现问题。</p>
    )}
  </div>
);

FXViewer.displayName = 'FXViewer';


