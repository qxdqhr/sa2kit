# 图片网格裁剪工具 (Image Grid Cropper)

一个功能强大的网格式图片裁剪工具，支持自定义行列数、单元格尺寸，可以将图片裁剪成多个固定大小的图块，并打包下载。

## 功能特点

- ✅ **网格化裁剪**: 支持设置任意行列数
- ✅ **灵活尺寸**: 自定义每个单元格的宽度和高度
- ✅ **位置调整**: 可调整每个网格的轴位置偏移
- ✅ **选择性导出**: 可以选择需要导出的网格单元
- ✅ **批量下载**: 自动打包为 ZIP 压缩包
- ✅ **实时预览**: 实时显示网格划分效果
- ✅ **暗色模式**: 完整支持暗色主题
- ✅ **响应式设计**: 适配各种屏幕尺寸

## 安装

```bash
npm install sa2kit
# 或
pnpm install sa2kit
```

## 使用方法

### 基础使用

```tsx
import { ImageGridCropper } from 'sa2kit/imageCrop';

function App() {
  return (
    <ImageGridCropper
      config={{
        defaultRows: 3,
        defaultColumns: 3,
        defaultCellWidth: 256,
        defaultCellHeight: 256,
      }}
      onExportSuccess={(results) => {
        console.log('导出成功！', results);
      }}
      onExportError={(error) => {
        console.error('导出失败:', error);
      }}
    />
  );
}
```

### 高级配置

```tsx
import { ImageGridCropper } from 'sa2kit/imageCrop';
import type { ImageGridCropperConfig } from 'sa2kit/imageCrop';

const config: ImageGridCropperConfig = {
  // 默认值
  defaultRows: 4,
  defaultColumns: 4,
  defaultCellWidth: 512,
  defaultCellHeight: 512,
  
  // 限制范围
  maxRows: 10,
  maxColumns: 10,
  maxCellSize: 2048,
  minCellSize: 16,
};

function AdvancedApp() {
  const handleExportSuccess = (results) => {
    console.log(`成功导出 ${results.length} 个图片`);
    results.forEach((result) => {
      console.log(`文件: ${result.filename}, 大小: ${result.blob.size} bytes`);
    });
  };

  return (
    <ImageGridCropper
      config={config}
      onExportSuccess={handleExportSuccess}
      onExportError={(error) => alert(`错误: ${error}`)}
    />
  );
}
```

### 使用工具函数

如果你想自定义 UI，可以直接使用工具函数：

```tsx
import {
  loadImageFromFile,
  cropGridCell,
  downloadAsZip,
  type GridCell,
} from 'sa2kit/imageCrop';

async function customCrop() {
  // 1. 加载图片
  const file = document.querySelector('input[type=file]').files[0];
  const imageInfo = await loadImageFromFile(file);
  
  // 2. 定义网格单元格
  const cell: GridCell = {
    id: 'cell_0_0',
    row: 0,
    column: 0,
    offsetX: 0,
    offsetY: 0,
    selected: true,
  };
  
  // 3. 裁剪
  const result = await cropGridCell(imageInfo, cell, 256, 256, {
    format: 'image/png',
    quality: 0.9,
    filenamePrefix: 'my_crop',
  });
  
  // 4. 下载
  await downloadAsZip([result], 'my_crops.zip');
}
```

## API 文档

### ImageGridCropper Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `config` | `ImageGridCropperConfig` | `{}` | 裁剪器配置 |
| `onExportSuccess` | `(results: CropResult[]) => void` | - | 导出成功回调 |
| `onExportError` | `(error: string) => void` | - | 导出失败回调 |
| `className` | `string` | `''` | 自定义样式类名 |

### ImageGridCropperConfig

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `defaultRows` | `number` | `3` | 默认行数 |
| `defaultColumns` | `number` | `3` | 默认列数 |
| `defaultCellWidth` | `number` | `256` | 默认单元格宽度 |
| `defaultCellHeight` | `number` | `256` | 默认单元格高度 |
| `maxRows` | `number` | `20` | 最大行数 |
| `maxColumns` | `number` | `20` | 最大列数 |
| `maxCellSize` | `number` | `2000` | 最大单元格尺寸 |
| `minCellSize` | `number` | `10` | 最小单元格尺寸 |

### 工具函数

#### loadImageFromFile(file: File): Promise<ImageInfo>
从文件加载图片信息。

#### cropGridCell(imageInfo, cell, cellWidth, cellHeight, options): Promise<CropResult>
裁剪单个网格单元格。

#### cropMultipleCells(imageInfo, cells, cellWidth, cellHeight, options, onProgress): Promise<CropResult[]>
批量裁剪多个单元格。

#### downloadAsZip(results, zipFilename): Promise<void>
将裁剪结果打包成 ZIP 并下载。

#### validateCropArea(imageWidth, imageHeight, offsetX, offsetY, cropWidth, cropHeight): boolean
验证裁剪区域是否在图片范围内。

#### constrainOffset(imageWidth, imageHeight, offsetX, offsetY, cropWidth, cropHeight): {offsetX, offsetY}
自动调整偏移量以保持在图片范围内。

## 类型定义

### GridConfig
```typescript
interface GridConfig {
  rows: number;
  columns: number;
  cellWidth: number;
  cellHeight: number;
}
```

### GridCell
```typescript
interface GridCell {
  id: string;
  row: number;
  column: number;
  offsetX: number;
  offsetY: number;
  selected: boolean;
  previewUrl?: string;
}
```

### CropResult
```typescript
interface CropResult {
  cell: GridCell;
  blob: Blob;
  filename: string;
}
```

## 使用场景

- 🎮 **游戏开发**: 将精灵图(Sprite Sheet)裁剪成单独的帧
- 🎨 **图片编辑**: 批量裁剪图片为固定尺寸
- 📱 **图标生成**: 从大图生成多个尺寸的图标
- 🖼️ **瓦片地图**: 将地图图片裁剪为瓦片
- 🎭 **表情包制作**: 批量裁剪表情图片

## 样式定制

组件使用 Tailwind CSS，你可以通过 `className` 属性添加自定义样式：

```tsx
<ImageGridCropper
  className="max-w-4xl mx-auto"
  config={config}
/>
```

## 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

需要支持：
- Canvas API
- FileReader API
- Blob API
- JSZip

## 注意事项

1. 裁剪大量图片可能占用较多内存，建议分批处理
2. 单元格尺寸不应超过原图尺寸
3. 导出的图片格式默认为 PNG，可以通过 `cropOptions` 修改
4. ZIP 文件大小受浏览器限制，建议单次导出不超过 100MB

## 开源协议

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！














