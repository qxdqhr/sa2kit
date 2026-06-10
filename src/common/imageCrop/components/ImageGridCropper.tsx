/**
 * 图片网格裁剪器主组件
 * Image Grid Cropper Main Component
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import {
  Download,
  Scissors,
  CheckCircle2,
  XCircle,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Move,
} from 'lucide-react';

import type {
  GridConfig,
  GridCell,
  ImageInfo,
  CropResult,
  ExportOptions,
  ImageGridCropperConfig,
} from '../types';
import {
  loadImageFromFile,
  cropMultipleCells,
  constrainOffset,
  validateCropArea,
} from '../utils/cropUtils';
import { downloadAsZip, formatFileSize, calculateTotalSize } from '../utils/downloadUtils';
import { GridControls } from './GridControls';

// ============= 主组件属性 =============

export interface ImageGridCropperProps {
  /** 初始配置 */
  config?: ImageGridCropperConfig;
  /** 导出成功回调 */
  onExportSuccess?: (results: CropResult[]) => void;
  /** 导出失败回调 */
  onExportError?: (error: string) => void;
  /** 自定义样式类名 */
  className?: string;
}

// ============= 主组件 =============

export const ImageGridCropper: React.FC<ImageGridCropperProps> = ({
  config = {},
  onExportSuccess,
  onExportError,
  className = '',
}) => {
  // ============= 配置 =============
  const {
    defaultRows = 3,
    defaultColumns = 3,
    defaultCellWidth = 256,
    defaultCellHeight = 256,
    maxRows = 20,
    maxColumns = 20,
    maxCellSize = 2000,
    minCellSize = 10,
  } = config;

  // ============= 状态管理 =============
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: defaultRows,
    columns: defaultColumns,
    cellWidth: defaultCellWidth,
    cellHeight: defaultCellHeight,
  });
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============= 生成网格单元格 =============
  const generateGridCells = useCallback(() => {
    const cells: GridCell[] = [];
    const { rows, columns, cellWidth, cellHeight } = gridConfig;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const offsetX = col * cellWidth;
        const offsetY = row * cellHeight;

        cells.push({
          id: 'cell_' + (row) + '_' + (col),
          row,
          column: col,
          x: offsetX,
          y: offsetY,
          offsetX,
          offsetY,
          width: cellWidth,
          height: cellHeight,
          selected: true, // 默认全选
        });
      }
    }

    setGridCells(cells);
  }, [gridConfig]);

  // ============= 图片加载 =============
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);

      const info = await loadImageFromFile(file);
      setImageInfo(info);
      generateGridCells();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '图片加载失败';
      setError(errorMsg);
      onExportError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }

    // 清空input以允许重复选择同一文件
    event.target.value = '';
  };

  // ============= 绘制预览 =============
  const drawPreview = useCallback(() => {
    if (!imageInfo || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸
    const maxWidth = 800;
    const maxHeight = 600;
    const scale = Math.min(
      maxWidth / imageInfo.width,
      maxHeight / imageInfo.height,
      1
    );

    canvas.width = imageInfo.width * scale;
    canvas.height = imageInfo.height * scale;

    if (!imageInfo.image) return;

    // 绘制图片
    ctx.drawImage(imageInfo.image, 0, 0, canvas.width, canvas.height);

    // 绘制网格线
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; // 蓝色
    ctx.lineWidth = 2;

    const { cellWidth, cellHeight } = gridConfig;

    gridCells.forEach((cell) => {
      const x = cell.offsetX * scale;
      const y = cell.offsetY * scale;
      const w = cellWidth * scale;
      const h = cellHeight * scale;

      // 绘制边框
      if (cell.selected) {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)'; // 绿色表示选中
      } else {
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)'; // 灰色表示未选中
      }
      
      ctx.strokeRect(x, y, w, h);

      // 绘制单元格编号
      ctx.fillStyle = cell.selected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(156, 163, 175, 0.7)';
      ctx.font = '12px sans-serif';
      ctx.fillText('R' + (cell.row) + 'C' + (cell.column), x + 5, y + 15);
    });
  }, [imageInfo, gridConfig, gridCells]);

  // ============= 单元格选择切换 =============
  const toggleCellSelection = (cellId: string) => {
    setGridCells((prev) =>
      prev.map((cell) =>
        cell.id === cellId ? { ...cell, selected: !cell.selected } : cell
      )
    );
  };

  // ============= 全选/取消全选 =============
  const toggleSelectAll = () => {
    const allSelected = gridCells.every((cell) => cell.selected);
    setGridCells((prev) =>
      prev.map((cell) => ({ ...cell, selected: !allSelected }))
    );
  };

  // ============= 调整单元格偏移 =============
  const adjustCellOffset = (cellId: string, deltaX: number, deltaY: number) => {
    if (!imageInfo) return;

    setGridCells((prev) =>
      prev.map((cell) => {
        if (cell.id !== cellId) return cell;

        const newOffsetX = cell.offsetX + deltaX;
        const newOffsetY = cell.offsetY + deltaY;

        const constrained = constrainOffset(
          imageInfo.width,
          imageInfo.height,
          newOffsetX,
          newOffsetY,
          gridConfig.cellWidth,
          gridConfig.cellHeight
        );

        return {
          ...cell,
          offsetX: constrained.offsetX,
          offsetY: constrained.offsetY,
        };
      })
    );
  };

  // ============= 导出裁剪图片 =============
  const handleExport = async (options: ExportOptions = {}) => {
    if (!imageInfo) {
      setError('请先上传图片');
      return;
    }

    const selectedCells = gridCells.filter((cell) => cell.selected);
    if (selectedCells.length === 0) {
      setError('请至少选择一个单元格');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      setProgress({ current: 0, total: selectedCells.length });

      const results = await cropMultipleCells(
        imageInfo,
        selectedCells,
        gridConfig.cellWidth,
        gridConfig.cellHeight,
        options.cropOptions,
        (current, total) => setProgress({ current, total })
      );

      if (results.length === 0) {
        throw new Error('没有成功裁剪的图片');
      }

      // 下载为ZIP
      const zipFilename = options.zipFilename || 'cropped_' + (Date.now()) + '.zip';
      await downloadAsZip(results, zipFilename);

      onExportSuccess?.(results);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '导出失败';
      setError(errorMsg);
      onExportError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // ============= 重置配置 =============
  const handleReset = () => {
    setGridConfig({
      rows: defaultRows,
      columns: defaultColumns,
      cellWidth: defaultCellWidth,
      cellHeight: defaultCellHeight,
    });
  };

  // ============= 效果 =============
  useEffect(() => {
    if (imageInfo) {
      generateGridCells();
    }
  }, [imageInfo, generateGridCells]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // ============= 渲染 =============
  const selectedCount = gridCells.filter((cell) => cell.selected).length;

  return (
    <div className={clsx('w-full space-y-6', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scissors className="w-7 h-7 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              网格式图片裁剪工具
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              上传图片，设置网格，裁剪并导出
            </p>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 上传区域 */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          上传图片
        </label>
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            点击选择图片或拖拽文件到这里
          </p>
          <p className="text-sm text-gray-500">支持 PNG, JPG, WEBP 等格式</p>
          {imageInfo && imageInfo.file && (
            <p className="mt-4 text-sm text-green-600 dark:text-green-400">
              ✓ 已上传: {imageInfo.file.name} ({imageInfo.width} × {imageInfo.height})
            </p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 网格配置 */}
      {imageInfo && (
        <GridControls
          config={gridConfig}
          onChange={setGridConfig}
          disabled={isProcessing}
          maxRows={maxRows}
          maxColumns={maxColumns}
          maxCellSize={maxCellSize}
          minCellSize={minCellSize}
          onReset={handleReset}
        />
      )}

      {/* 预览区域 */}
      {imageInfo && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              预览与调整
            </h3>
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            >
              {gridCells.every((cell) => cell.selected) ? '取消全选' : '全选'}
            </button>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full mx-auto border border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* 单元格列表 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              单元格列表 ({selectedCount}/{gridCells.length} 已选中)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {gridCells.map((cell) => (
                <div
                  key={cell.id}
                  className={clsx('p-3 rounded border', cell.selected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800', 'cursor-pointer transition-colors')}
                  onClick={() => toggleCellSelection(cell.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      R{cell.row} C{cell.column}
                    </span>
                    {cell.selected ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>X: {cell.offsetX}px</p>
                    <p>Y: {cell.offsetY}px</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 导出按钮 */}
      {imageInfo && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium">准备导出 {selectedCount} 个裁剪图片</p>
            {isProcessing && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                进度: {progress.current}/{progress.total}
              </p>
            )}
          </div>
          <button
            onClick={() => handleExport()}
            disabled={isProcessing || selectedCount === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                导出为 ZIP
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageGridCropper;






