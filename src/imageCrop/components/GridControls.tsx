/**
 * 网格控制组件
 * Grid Controls Component
 */

'use client';

import React from 'react';
import { Grid, Maximize2, RefreshCw } from 'lucide-react';
import type { GridConfig } from '../types';

export interface GridControlsProps {
  /** 网格配置 */
  config: GridConfig;
  /** 配置变更回调 */
  onChange: (config: GridConfig) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最大行列数 */
  maxRows?: number;
  maxColumns?: number;
  /** 最大最小单元格尺寸 */
  maxCellSize?: number;
  minCellSize?: number;
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 重置回调 */
  onReset?: () => void;
}

export const GridControls: React.FC<GridControlsProps> = ({
  config,
  onChange,
  disabled = false,
  maxRows = 20,
  maxColumns = 20,
  maxCellSize = 2000,
  minCellSize = 10,
  showReset = true,
  onReset,
}) => {
  const handleChange = (field: keyof GridConfig, value: number) => {
    // 确保值在有效范围内
    let constrainedValue = value;
    
    if (field === 'rows') {
      constrainedValue = Math.max(1, Math.min(maxRows, value));
    } else if (field === 'columns') {
      constrainedValue = Math.max(1, Math.min(maxColumns, value));
    } else if (field === 'cellWidth' || field === 'cellHeight') {
      constrainedValue = Math.max(minCellSize, Math.min(maxCellSize, value));
    }
    
    onChange({
      ...config,
      [field]: constrainedValue,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            网格设置
          </h3>
        </div>
        
        {showReset && (
          <button
            onClick={onReset}
            disabled={disabled}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="重置为默认值"
          >
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
        )}
      </div>

      {/* 网格行列控制 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 行数 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            行数
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={maxRows}
              value={config.rows}
              onChange={(e) => handleChange('rows', parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <input
              type="range"
              min={1}
              max={maxRows}
              value={config.rows}
              onChange={(e) => handleChange('rows', parseInt(e.target.value))}
              disabled={disabled}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* 列数 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            列数
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={maxColumns}
              value={config.columns}
              onChange={(e) => handleChange('columns', parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <input
              type="range"
              min={1}
              max={maxColumns}
              value={config.columns}
              onChange={(e) => handleChange('columns', parseInt(e.target.value))}
              disabled={disabled}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 单元格尺寸控制 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 单元格宽度 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Maximize2 className="w-4 h-4" />
            单元格宽度 (px)
          </label>
          <input
            type="number"
            min={minCellSize}
            max={maxCellSize}
            value={config.cellWidth}
            onChange={(e) => handleChange('cellWidth', parseInt(e.target.value) || minCellSize)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* 单元格高度 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Maximize2 className="w-4 h-4" />
            单元格高度 (px)
          </label>
          <input
            type="number"
            min={minCellSize}
            max={maxCellSize}
            value={config.cellHeight}
            onChange={(e) => handleChange('cellHeight', parseInt(e.target.value) || minCellSize)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* 统计信息 */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>总单元格数:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {config.rows * config.columns}
            </span>
          </div>
          <div className="flex justify-between">
            <span>总尺寸:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {config.cellWidth * config.columns} × {config.cellHeight * config.rows}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridControls;



