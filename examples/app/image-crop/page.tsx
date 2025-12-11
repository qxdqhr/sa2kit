'use client';

import React from 'react';
import { ImageGridCropper } from 'sa2kit/imageCrop';
import type { CropResult } from 'sa2kit/imageCrop';

export default function ImageCropPage() {
  const handleExportSuccess = (results: CropResult[]) => {
    console.log('✅ 导出成功！共', results.length, '个文件');
    results.forEach((result, index) => {
      console.log(`文件 ${index + 1}:`, {
        filename: result.filename,
        size: `${(result.blob.size / 1024).toFixed(2)} KB`,
        cell: `R${result.cell.row}C${result.cell.column}`,
      });
    });
  };

  const handleExportError = (error: string) => {
    console.error('❌ 导出失败:', error);
    alert(`导出失败: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            图片网格裁剪工具
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            上传图片，设置网格，裁剪并导出为 ZIP 压缩包
          </p>
        </div>

        {/* 主组件 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <ImageGridCropper
            config={{
              defaultRows: 3,
              defaultColumns: 3,
              defaultCellWidth: 256,
              defaultCellHeight: 256,
              maxRows: 10,
              maxColumns: 10,
              maxCellSize: 2048,
              minCellSize: 32,
            }}
            onExportSuccess={handleExportSuccess}
            onExportError={handleExportError}
          />
        </div>

        {/* 使用说明 */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            使用说明
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>点击上传区域选择一张图片</li>
            <li>调整网格行数、列数和单元格尺寸</li>
            <li>在预览区域查看网格划分效果</li>
            <li>点击单元格可以切换选中状态</li>
            <li>点击"导出为 ZIP"下载选中的裁剪图片</li>
          </ol>
        </div>

        {/* 应用场景 */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-3xl mb-2">🎮</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">游戏开发</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">裁剪精灵图为帧</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">图片编辑</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">批量裁剪图片</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">图标生成</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">生成多尺寸图标</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-3xl mb-2">🗺️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">瓦片地图</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">地图切片处理</p>
          </div>
        </div>
      </div>
    </div>
  );
}



