# Agent Platform - 知识库管理系统

基于 React + TypeScript + Vite 构建的现代化知识库管理平台。

## 功能特性

- 📚 知识库管理
- 👥 成员权限管理
- 📝 文档版本控制
- ✅ 审核流程管理
- 🔍 操作日志追踪

## 技术栈

- **前端框架**: React 19 + TypeScript 6
- **构建工具**: Vite 8
- **UI 组件**: Radix UI + Tailwind CSS 4
- **路由**: React Router v7
- **图标**: Lucide React

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

项目将在 `http://localhost:5173` 启动。

### 构建生产版本

```bash
npm run build
```

构建输出目录：`dist/`

### 代码检查

```bash
npm run lint
```

## 部署

### Netlify 部署（推荐）

详细部署步骤请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

快速步骤：
1. 登录 [Netlify](https://app.netlify.com/)
2. 导入 GitHub 仓库：`zhaomin9103/knowledge_base`
3. Netlify 会自动检测 `netlify.toml` 配置并开始部署

项目已配置自动部署：推送到 `main` 分支会自动触发构建。

### 其他平台

项目也支持部署到：
- Vercel
- GitHub Pages
- 其他支持静态站点的平台

## 项目结构

```
agent-platform/
├── src/
│   ├── components/      # UI 组件
│   │   ├── layout/      # 布局组件
│   │   └── ui/          # 基础 UI 组件
│   ├── config/          # 配置文件
│   ├── hooks/           # React Hooks
│   ├── lib/             # 工具函数
│   ├── mocks/           # 模拟数据
│   ├── pages/           # 页面组件
│   └── router.tsx       # 路由配置
├── public/              # 静态资源
├── docs/                # 文档
├── netlify.toml         # Netlify 配置
└── vite.config.ts       # Vite 配置
```

## 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
# API 地址（可选）
VITE_API_URL=https://api.example.com
```

## 开发指南

### 添加新页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/router.tsx` 添加路由配置
3. 在 `src/config/menu.ts` 更新菜单配置

### 使用 UI 组件

项目使用 Radix UI + Tailwind CSS，所有 UI 组件位于 `src/components/ui/`。

示例：
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">点击我</Button>
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可

MIT License

