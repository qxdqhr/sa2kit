# 发布指南 (Publishing Guide)

本文档介绍如何将 React Utils Kit 发布到 npm。

## 前提条件

1. **npm 账户**
   - 如果没有，访问 [npmjs.com](https://www.npmjs.com) 注册
   - 验证邮箱地址

2. **登录 npm**
   ```bash
   npm login
   ```
   输入用户名、密码和邮箱

3. **检查包名可用性**
   ```bash
   npm search @react-utils-kit/core
   ```

   如果名称已被占用，需要修改 `package.json` 中的 `name` 字段。

## 发布步骤

### 方式 1: 手动发布 (推荐首次发布)

#### 1. 确保所有测试通过
```bash
cd /Users/qihongrui/Desktop/react-utils-kit
pnpm test
```

#### 2. 构建项目
```bash
pnpm build
```

#### 3. 检查构建产物
```bash
ls -la dist/
```
确认以下文件存在：
- ESM 模块 (`.mjs` 文件)
- CJS 模块 (`.js` 文件)
- TypeScript 类型定义 (`.d.ts` 文件)

#### 4. 发布 Beta 版本
```bash
# 首次发布建议使用 beta 标签
npm publish --tag beta --access public
```

> **注意**: `--access public` 是必需的，因为包名包含 scope (@react-utils-kit)

#### 5. 验证发布
访问: https://www.npmjs.com/package/@react-utils-kit/core

或在另一个项目中测试安装:
```bash
npm install @react-utils-kit/core@beta
```

#### 6. 发布正式版本
当 beta 测试稳定后：
```bash
# 更新版本号
npm version 0.1.0 --no-git-tag-version

# 发布正式版
npm publish --access public
```

### 方式 2: 使用 GitHub Actions (自动发布)

#### 1. 设置 npm Token

1. 在 npm 官网生成 token:
   - 访问 https://www.npmjs.com/settings/[your-username]/tokens
   - 点击 "Generate New Token"
   - 选择 "Automation" 类型
   - 复制生成的 token

2. 在 GitHub 仓库添加 Secret:
   - 进入仓库 Settings → Secrets and variables → Actions
   - 点击 "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: 粘贴你的 npm token

#### 2. 推送到 GitHub
```bash
git add .
git commit -m "chore: initial release preparation"
git branch -M main
git remote add origin https://github.com/your-username/react-utils-kit.git
git push -u origin main
```

#### 3. 创建 Release
在 GitHub 上：
1. 进入 "Releases" → "Create a new release"
2. 标签名: `v0.1.0-beta.0`
3. Release title: `Release v0.1.0-beta.0`
4. 描述: 简要说明此版本的功能
5. 勾选 "Set as a pre-release" (如果是 beta 版)
6. 点击 "Publish release"

GitHub Actions 会自动:
- 运行测试
- 构建项目
- 发布到 npm

## 版本管理

遵循 [语义化版本规范](https://semver.org/lang/zh-CN/):

- **0.1.0-beta.0**: 首个 beta 测试版
- **0.1.0-beta.1**: Beta 修复版
- **0.1.0**: 首个正式版
- **0.1.1**: 补丁版本（bug 修复）
- **0.2.0**: 次要版本（新功能，向后兼容）
- **1.0.0**: 主要版本（重大更新或破坏性变更）

### 版本更新命令
```bash
# 补丁版本 (0.1.0 -> 0.1.1)
npm version patch

# 次要版本 (0.1.0 -> 0.2.0)
npm version minor

# 主要版本 (0.1.0 -> 1.0.0)
npm version major

# 预发布版本
npm version prerelease --preid=beta
```

## 发布检查清单

在发布前确认：

- [ ] 所有测试通过 (`pnpm test`)
- [ ] 构建成功 (`pnpm build`)
- [ ] 代码已格式化 (`pnpm format`)
- [ ] Lint 无错误 (`pnpm lint`)
- [ ] CHANGELOG.md 已更新
- [ ] README.md 完整准确
- [ ] package.json 版本号正确
- [ ] .npmignore 配置正确（不发布源码）
- [ ] LICENSE 文件存在
- [ ] 示例代码可运行

## 发布后操作

1. **测试安装**
   ```bash
   # 在另一个项目中
   npm install @react-utils-kit/core
   ```

2. **更新文档**
   - 在 README 中添加 npm 版本徽章
   - 更新安装说明

3. **发布公告**
   - 在 GitHub Discussions 发布
   - 社交媒体分享
   - 相关社区通知

4. **标记 Git 标签**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

## 常见问题

### Q: 发布失败，提示权限错误？
A: 确保已执行 `npm login` 并且账户有发布权限。

### Q: 包名已被占用？
A: 修改 package.json 中的 name 字段为其他名称，或使用你自己的 scope。

### Q: 如何撤销已发布的版本？
A:
```bash
# 72小时内可以撤销
npm unpublish @react-utils-kit/core@0.1.0

# 或废弃某个版本
npm deprecate @react-utils-kit/core@0.1.0 "This version is deprecated"
```

### Q: 如何更新已发布的包？
A: 不能修改已发布的版本，只能发布新版本。

### Q: Beta 版本如何升级到正式版？
A:
```bash
# 移除 beta 后缀
npm version 0.1.0 --no-git-tag-version

# 发布为 latest
npm publish --access public
```

## 下一步

发布完成后，你可以：

1. 创建 GitHub Release 附上详细的 CHANGELOG
2. 在 npm 页面添加 README 和徽章
3. 设置 GitHub Pages 用于文档站点
4. 添加 CI/CD 自动化测试
5. 收集用户反馈并持续改进

## 紧急情况

如果发布的版本有严重 bug：

1. 立即发布修复版本
2. 废弃问题版本：
   ```bash
   npm deprecate @react-utils-kit/core@0.1.0 "Critical bug, please upgrade to 0.1.1"
   ```
3. 在 GitHub 发布公告
4. 更新文档说明

---

**祝发布顺利！** 🎉

如有问题，请查看 [npm 官方文档](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)。

