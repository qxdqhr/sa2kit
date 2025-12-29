/**
 * FX文件查看器组件
 * 用于可视化展示FX文件的解析结果
 */

import React, { useState, useEffect } from 'react';
import { FXParser } from '../FXParser';
import type { FXEffect, FXSummary } from '../types';
import { getConfigSummaryText, validateFXEffect } from '../utils';

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
      <div className={`fx-viewer loading ${className}`}>
        <div className="fx-viewer-spinner">加载中...</div>
      </div>
    );
  }

  if (error || !effect || !summary) {
    return (
      <div className={`fx-viewer error ${className}`}>
        <div className="fx-viewer-error">
          <h3>❌ 解析错误</h3>
          <p>{error || '未知错误'}</p>
        </div>
      </div>
    );
  }

  const validation = validateFXEffect(effect);

  return (
    <div className={`fx-viewer ${className}`}>
      <div className="fx-viewer-header">
        <h2>{effect.fileName}</h2>
        <p className="fx-viewer-config-summary">{getConfigSummaryText(effect)}</p>
      </div>

      <div className="fx-viewer-tabs">
        <button
          className={activeTab === 'summary' ? 'active' : ''}
          onClick={() => setActiveTab('summary')}
        >
          摘要
        </button>
        <button
          className={activeTab === 'defines' ? 'active' : ''}
          onClick={() => setActiveTab('defines')}
        >
          宏定义 ({summary.defineCount})
        </button>
        <button
          className={activeTab === 'textures' ? 'active' : ''}
          onClick={() => setActiveTab('textures')}
        >
          纹理 ({summary.textureCount})
        </button>
        <button
          className={activeTab === 'parameters' ? 'active' : ''}
          onClick={() => setActiveTab('parameters')}
        >
          参数 ({summary.parameterCount})
        </button>
        <button
          className={activeTab === 'validation' ? 'active' : ''}
          onClick={() => setActiveTab('validation')}
        >
          验证
        </button>
      </div>

      <div className="fx-viewer-content">
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
  <div className="fx-tab-summary">
    <div className="fx-stats-grid">
      <div className="fx-stat-card">
        <div className="fx-stat-label">宏定义</div>
        <div className="fx-stat-value">{summary.defineCount}</div>
      </div>
      <div className="fx-stat-card">
        <div className="fx-stat-label">参数</div>
        <div className="fx-stat-value">{summary.parameterCount}</div>
      </div>
      <div className="fx-stat-card">
        <div className="fx-stat-label">纹理</div>
        <div className="fx-stat-value">{summary.textureCount}</div>
      </div>
      <div className="fx-stat-card">
        <div className="fx-stat-label">Technique</div>
        <div className="fx-stat-value">{summary.techniqueCount}</div>
      </div>
    </div>

    <div className="fx-features">
      <h3>功能特性</h3>
      <div className="fx-feature-list">
        <div className={`fx-feature ${summary.hasLocalShadow ? 'enabled' : 'disabled'}`}>
          {summary.hasLocalShadow ? '✓' : '✗'} LocalShadow
        </div>
        <div className={`fx-feature ${summary.hasExcellentShadow ? 'enabled' : 'disabled'}`}>
          {summary.hasExcellentShadow ? '✓' : '✗'} ExcellentShadow
        </div>
        <div className={`fx-feature ${summary.hasHgShadow ? 'enabled' : 'disabled'}`}>
          {summary.hasHgShadow ? '✓' : '✗'} HgShadow
        </div>
      </div>
    </div>

    {effect.includes.length > 0 && (
      <div className="fx-includes">
        <h3>包含文件</h3>
        <ul>
          {effect.includes.map((inc, idx) => (
            <li key={idx}><code>{inc}</code></li>
          ))}
        </ul>
      </div>
    )}

    {effect.controllers.length > 0 && (
      <div className="fx-controllers">
        <h3>控制器</h3>
        <ul>
          {effect.controllers.map((ctrl, idx) => (
            <li key={idx}>
              <strong>{ctrl.name}</strong>: {ctrl.objectName} / {ctrl.itemName}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const DefinesTab: React.FC<{ effect: FXEffect }> = ({ effect }) => (
  <div className="fx-tab-defines">
    <table className="fx-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>值</th>
          <th>状态</th>
          <th>行号</th>
        </tr>
      </thead>
      <tbody>
        {effect.defines.map((define, idx) => (
          <tr key={idx} className={define.isCommented ? 'disabled' : 'enabled'}>
            <td><code>{define.name}</code></td>
            <td>{define.value || '-'}</td>
            <td>
              <span className={`status-badge ${define.isCommented ? 'disabled' : 'enabled'}`}>
                {define.isCommented ? '禁用' : '启用'}
              </span>
            </td>
            <td>{define.lineNumber}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TexturesTab: React.FC<{ effect: FXEffect }> = ({ effect }) => (
  <div className="fx-tab-textures">
    {effect.textures.length === 0 ? (
      <p className="fx-empty-message">未找到纹理定义</p>
    ) : (
      <table className="fx-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>路径</th>
            <th>尺寸</th>
            <th>用途</th>
          </tr>
        </thead>
        <tbody>
          {effect.textures.map((texture, idx) => (
            <tr key={idx}>
              <td><code>{texture.name}</code></td>
              <td>{texture.path}</td>
              <td>{texture.width && texture.height ? `${texture.width}×${texture.height}` : '-'}</td>
              <td>{texture.purpose || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const ParametersTab: React.FC<{ effect: FXEffect }> = ({ effect }) => (
  <div className="fx-tab-parameters">
    <table className="fx-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>类型</th>
          <th>语义</th>
          <th>默认值</th>
          <th>行号</th>
        </tr>
      </thead>
      <tbody>
        {effect.parameters.map((param, idx) => (
          <tr key={idx}>
            <td><code>{param.name}</code></td>
            <td><code>{param.type}</code></td>
            <td>{param.semantic || '-'}</td>
            <td>{param.defaultValue || '-'}</td>
            <td>{param.lineNumber}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ValidationTab: React.FC<{ validation: ReturnType<typeof validateFXEffect> }> = ({ validation }) => (
  <div className="fx-tab-validation">
    <div className={`fx-validation-status ${validation.isValid ? 'valid' : 'invalid'}`}>
      <h3>{validation.isValid ? '✓ 验证通过' : '✗ 验证失败'}</h3>
    </div>

    {validation.errors.length > 0 && (
      <div className="fx-validation-section fx-errors">
        <h4>错误 ({validation.errors.length})</h4>
        <ul>
          {validation.errors.map((error, idx) => (
            <li key={idx} className="fx-error-item">{error}</li>
          ))}
        </ul>
      </div>
    )}

    {validation.warnings.length > 0 && (
      <div className="fx-validation-section fx-warnings">
        <h4>警告 ({validation.warnings.length})</h4>
        <ul>
          {validation.warnings.map((warning, idx) => (
            <li key={idx} className="fx-warning-item">{warning}</li>
          ))}
        </ul>
      </div>
    )}

    {validation.isValid && validation.warnings.length === 0 && (
      <p className="fx-success-message">FX文件结构完整，没有发现问题。</p>
    )}
  </div>
);

FXViewer.displayName = 'FXViewer';

