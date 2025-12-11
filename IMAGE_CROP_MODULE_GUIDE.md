# 图片网格裁剪工具模块 - 完整指南

## 📋 模块概览

图片网格裁剪工具 (Image Grid Cropper) 是 SA2Kit 的新增独立模块，提供强大的网格式图片裁剪功能。

### 特性

✅ **网格化裁剪**: 支持设置任意行列数  
✅ **灵活尺寸**: 自定义每个单元格的宽度和高度  
✅ **位置调整**: 可调整每个网格的轴位置偏移  
✅ **选择性导出**: 可以选择需要导出的网格单元  
✅ **批量下载**: 自动打包为 ZIP 压缩包  
✅ **实时预览**: 实时显示网格划分效果  
✅ **暗色模式**: 完整支持暗色主题  
✅ **响应式设计**: 适配各种屏幕尺寸  

## 📁 模块结构

```
src/imageCrop/
├── index.ts                    # 模块主入口
├── types.ts                    # TypeScript 类型定义
├── README.md                   # 模块文档
├── components/
│   ├── index.ts               # 组件导出
│   ├── ImageGridCropper.tsx   # 主裁剪组件
│   └── GridControls.tsx       # 网格控制组件
└── utils/
    ├── index.ts               # 工具函数导出
    ├── cropUtils.ts           # 裁剪相关工具
    └── downloadUtils.ts       # 下载相关工具
```

## 🚀 快速开始

### 安装

```bash
npm install sa2kit
# 或
pnpm add sa2kit
```

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

## 📖 核心组件

### 1. ImageGridCropper (主组件)

完整的图片网格裁剪界面，包含上传、配置、预览和导出功能。

**Props:**

```typescript
interface ImageGridCropperProps {
  config?: ImageGridCropperConfig;
  onExportSuccess?: (results: CropResult[]) => void;
  onExportError?: (error: string) => void;
  className?: string;
}
```

### 2. GridControls (网格控制)

网格参数配置组件，可独立使用。

**Props:**

```typescript
interface GridControlsProps {
  config: GridConfig;
  onChange: (config: GridConfig) => void;
  disabled?: boolean;
  maxRows?: number;
  maxColumns?: number;
  maxCellSize?: number;
  minCellSize?: number;
  showReset?: boolean;
  onReset?: () => void;
}
```

## 🔧 工具函数

### 裁剪工具 (cropUtils.ts)

```typescript
// 加载图片
loadImageFromFile(file: File): Promise<ImageInfo>

// 裁剪单个单元格
cropGridCell(imageInfo, cell, cellWidth, cellHeight, options): Promise<CropResult>

// 批量裁剪
cropMultipleCells(imageInfo, cells, cellWidth, cellHeight, options, onProgress): Promise<CropResult[]>

// 生成预览
generateCellPreview(imageInfo, cell, cellWidth, cellHeight, previewSize): Promise<string>

// 验证裁剪区域
validateCropArea(imageWidth, imageHeight, offsetX, offsetY, cropWidth, cropHeight): boolean

// 约束偏移量
constrainOffset(imageWidth, imageHeight, offsetX, offsetY, cropWidth, cropHeight): {offsetX, offsetY}
```

### 下载工具 (downloadUtils.ts)

```typescript
// 打包为 ZIP 并下载
downloadAsZip(results: CropResult[], zipFilename: string): Promise<void>

// 下载单个 Blob
downloadBlob(blob: Blob, filename: string): void

// 批量下载文件
downloadMultipleFiles(results: CropResult[], delay: number): Promise<void>

// 计算总大小
calculateTotalSize(results: CropResult[]): number

// 格式化文件大小
formatFileSize(bytes: number): string
```

## 📝 类型定义

### GridConfig

```typescript
interface GridConfig {
  rows: number;          // 行数
  columns: number;       // 列数
  cellWidth: number;     // 单元格宽度
  cellHeight: number;    // 单元格高度
}
```

### GridCell

```typescript
interface GridCell {
  id: string;           // 单元格ID
  row: number;          // 行索引
  column: number;       // 列索引
  offsetX: number;      // X轴偏移量
  offsetY: number;      // Y轴偏移量
  selected: boolean;    // 是否选中
  previewUrl?: string;  // 预览图片URL
}
```

### CropResult

```typescript
interface CropResult {
  cell: GridCell;      // 单元格信息
  blob: Blob;          // 裁剪后的图片
  filename: string;    // 文件名
}
```

## 🎯 应用场景

### 1. 游戏开发 🎮
- 精灵图 (Sprite Sheet) 裁剪
- 动画帧拆分
- 纹理图集处理

### 2. 图片编辑 🎨
- 批量裁剪固定尺寸
- 图片网格化处理
- 快速生成缩略图

### 3. 图标生成 📱
- 从大图生成多尺寸图标
- App 图标处理
- 素材库管理

### 4. 瓦片地图 🗺️
- 地图切片
- 瓦片图生成
- GIS 数据处理

## 🧪 测试

### 开发环境测试

```bash
cd examples
pnpm dev
```

访问 http://localhost:3000/image-crop

### 单元测试

```bash
pnpm test src/imageCrop
```

## 📦 构建配置

### tsup.config.ts

```typescript
entry: {
  // ... 其他入口
  'imageCrop/index': 'src/imageCrop/index.ts',
}
```

### package.json

```json
{
  "exports": {
    "./imageCrop": {
      "types": "./dist/imageCrop/index.d.ts",
      "import": "./dist/imageCrop/index.mjs",
      "require": "./dist/imageCrop/index.js"
    }
  }
}
```

## 🔗 与现有模块的关系

### 独立模块
- ❌ **不依赖** MMD 模块
- ❌ **不依赖** 音频检测模块
- ✅ **可独立使用**

### 共享依赖
- `lucide-react` - 图标组件
- `jszip` - ZIP 压缩
- React - UI 框架

### 可选集成
- 可与 `universalFile` 模块配合使用上传功能
- 可集成到后台管理系统

## 🚨 注意事项

1. **内存管理**: 裁剪大量图片时注意内存占用
2. **浏览器限制**: ZIP 文件大小建议不超过 100MB
3. **图片尺寸**: 单元格尺寸不应超过原图尺寸
4. **浏览器兼容**: 需要支持 Canvas API、FileReader API、Blob API

## 📄 发布配置

### .npmignore

```
examples/      # 示例项目不发布
docs/          # 文档不发布
tests/         # 测试文件不发布
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'examples'  # 示例项目作为 workspace
```

## 🔄 版本历史

### v1.2.2 (当前)
- ✨ 新增图片网格裁剪工具模块
- 📝 完善文档和示例
- 🧪 添加 Next.js 测试环境

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建特性分支
3. 提交代码
4. 运行测试
5. 提交 PR

## 📚 相关文档

- [SA2Kit 主文档](./README.md)
- [模块详细文档](./src/imageCrop/README.md)
- [示例项目](./examples/README.md)

## 📧 联系方式

- GitHub: https://github.com/sa2kit/sa2kit
- Issues: https://github.com/sa2kit/sa2kit/issues

---

**License**: MIT



