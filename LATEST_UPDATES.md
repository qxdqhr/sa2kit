# 最新更新 - 图片网格裁剪工具模块

## 📅 更新日期: 2025-12-11

## ✨ 新增功能

### 1. 图片网格裁剪工具模块 (`imageCrop`)

全新独立模块，提供专业的网格式图片裁剪功能。

#### 核心特性

- ✅ **网格化裁剪**: 自定义行列数，灵活设置网格布局
- ✅ **尺寸可调**: 独立设置每个单元格的宽度和高度
- ✅ **位置调整**: 精确控制每个网格的 X/Y 轴偏移
- ✅ **选择性导出**: 自由选择需要导出的单元格
- ✅ **批量下载**: 一键打包所有裁剪结果为 ZIP
- ✅ **实时预览**: Canvas 实时渲染网格划分效果
- ✅ **暗色模式**: 完整支持明暗主题切换
- ✅ **响应式**: 适配各种屏幕尺寸

#### 模块结构

```
src/imageCrop/
├── index.ts                    # 模块入口
├── types.ts                    # TypeScript 类型
├── README.md                   # 模块文档
├── components/
│   ├── ImageGridCropper.tsx   # 主组件
│   └── GridControls.tsx       # 控制组件
└── utils/
    ├── cropUtils.ts           # 裁剪工具
    └── downloadUtils.ts       # 下载工具
```

#### 使用示例

```tsx
import { ImageGridCropper } from 'sa2kit/imageCrop';

<ImageGridCropper
  config={{
    defaultRows: 3,
    defaultColumns: 3,
    defaultCellWidth: 256,
    defaultCellHeight: 256,
  }}
  onExportSuccess={(results) => console.log('成功!', results)}
  onExportError={(error) => console.error('失败:', error)}
/>
```

#### 应用场景

- 🎮 **游戏开发**: 精灵图裁剪、动画帧拆分
- 🎨 **图片编辑**: 批量裁剪、快速生成缩略图
- 📱 **图标生成**: 多尺寸图标制作
- 🗺️ **瓦片地图**: 地图切片、GIS 数据处理

---

### 2. Next.js 示例项目 (`examples/`)

#### 新增内容

- ✅ **Next.js 16**: 使用最新 App Router 架构
- ✅ **TypeScript**: 完整类型支持
- ✅ **Tailwind CSS 4**: 现代化样式系统
- ✅ **Workspace 配置**: pnpm workspace 本地开发

#### 项目结构

```
examples/
├── app/
│   ├── page.tsx              # 首页 - 组件导航
│   ├── image-crop/
│   │   └── page.tsx          # 图片裁剪示例页面
│   ├── layout.tsx            # 根布局
│   └── globals.css           # 全局样式
├── public/                   # 静态资源
├── package.json              # 项目配置
└── README.md                 # 示例文档
```

#### 运行方式

```bash
cd examples
pnpm dev
# 访问 http://localhost:3000
```

#### 可用路由

- `/` - 首页，组件导航
- `/image-crop` - 图片网格裁剪工具示例

---

## 📦 构建配置更新

### tsup.config.ts

新增入口点：

```typescript
entry: {
  // ...其他入口
  'imageCrop/index': 'src/imageCrop/index.ts',
}
```

### package.json

新增导出路径：

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

### pnpm-workspace.yaml

新增 workspace 配置：

```yaml
packages:
  - 'examples'
```

---

## 🔧 发布配置

### .npmignore

已配置排除示例项目：

```
examples/      # 不发布到 npm
docs/          # 文档不发布
tests/         # 测试不发布
```

### Git 配置

- ✅ `examples/` **会被** git 跟踪
- ✅ `examples/` **不会被** npm 发布
- ✅ 完美隔离开发环境和发布包

---

## 📊 构建结果

### 成功构建

```bash
✓ ESM Build success
✓ CJS Build success  
✓ DTS Build success

输出:
- dist/imageCrop/index.mjs      # ESM 格式
- dist/imageCrop/index.js       # CJS 格式
- dist/imageCrop/index.d.ts     # TypeScript 类型
```

### 包大小

- ESM: ~24.20 KB
- CJS: ~26.19 KB
- DTS: ~4.64 KB

---

## 🧪 测试环境

### 开发服务器

```bash
cd examples
pnpm dev
```

访问：
- 首页: http://localhost:3000
- 图片裁剪: http://localhost:3000/image-crop

### 本地包测试

通过 `workspace:*` 引用，可以实时测试本地修改。

---

## 📚 文档更新

### 新增文档

1. **IMAGE_CROP_MODULE_GUIDE.md**
   - 完整的模块指南
   - API 文档
   - 使用示例
   - 最佳实践

2. **src/imageCrop/README.md**
   - 模块说明
   - 快速开始
   - 类型定义
   - 工具函数

3. **examples/README.md**
   - 示例项目说明
   - 开发指南
   - 运行说明

---

## 🔄 版本信息

- **当前版本**: 1.2.2
- **Node 版本**: >=18.0.0
- **pnpm 版本**: 9.15.2

---

## 📝 依赖更新

### 新增依赖

```json
{
  "jszip": "^3.10.1"           # ZIP 压缩
}
```

### Peer Dependencies

```json
{
  "lucide-react": "^0.553.0",  # 图标组件
  "react": ">=18.0.0"
}
```

---

## 🎯 下一步计划

### 短期

- [ ] 添加更多裁剪选项（旋转、翻转）
- [ ] 支持拖拽调整网格位置
- [ ] 添加快捷键支持

### 中期

- [ ] 添加预设模板
- [ ] 支持批量图片处理
- [ ] 添加滤镜效果

### 长期

- [ ] AI 智能裁剪建议
- [ ] 云端处理支持
- [ ] 导出更多格式

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

- GitHub: https://github.com/sa2kit/sa2kit
- Issues: https://github.com/sa2kit/sa2kit/issues

---

## 📄 许可证

MIT License

---

## 👨‍💻 作者

qxdqhr

---

**更新完成！✨**



