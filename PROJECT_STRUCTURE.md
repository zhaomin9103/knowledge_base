# 知识库管理系统 - 项目结构

## 📁 项目目录结构

\\\
knowledge-base/
├── docs/                           # 📄 项目文档
│   ├── PRD-知识库详情页.md          # ⭐ 主产品需求文档
│   ├── CHANGELOG-v4.0.md           # 版本更新日志
│   ├── ADD-MEMBER-SEARCH-OPTIMIZATION.md  # 成员添加功能说明
│   ├── VERSION-HISTORY-OPTIMIZATION.md    # 版本历史功能说明
│   └── knowledge-review-flow.html  # 审核流程可视化图表
│
├── src/                            # 💻 源代码
│   ├── components/                 # UI 组件
│   ├── hooks/                      # React Hooks
│   ├── mocks/                      # Mock 数据（前端演示用）
│   ├── pages/                      # 页面组件
│   └── lib/                        # 工具函数
│
├── public/                         # 静态资源
├── dist/                           # 构建输出（自动生成）
│
├── package.json                    # 依赖配置
├── vite.config.ts                  # Vite 构建配置
├── tsconfig.json                   # TypeScript 配置
├── eslint.config.js                # ESLint 配置
├── netlify.toml                    # Netlify 部署配置
├── CLAUDE.md                       # 项目开发指引
├── README.md                       # 项目说明
└── .env.example                    # 环境变量示例

\\\

## 📋 核心文档说明

| 文档 | 用途 | 优先级 |
|------|------|--------|
| **docs/PRD-知识库详情页.md** | 完整的产品需求文档，包含角色权限、功能模块、数据模型、交互规则等 | ⭐⭐⭐ 必读 |
| **CLAUDE.md** | 项目架构说明、代码规范、技术栈介绍 | ⭐⭐ 推荐 |
| **README.md** | 项目概览、快速启动指南 | ⭐⭐ 推荐 |
| **docs/CHANGELOG-v4.0.md** | v4.0 版本详细变更记录 | ⭐ 参考 |

## 🚀 快速开始

\\\ash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
\\\

## 📦 技术栈

- **React 19** - UI 框架
- **TypeScript 6** - 类型系统
- **Vite 8** - 构建工具
- **Tailwind CSS 4** - 样式框架
- **Radix UI** - 无障碍 UI 组件
- **React Router 7** - 路由管理

## 🎯 核心功能

1. **四角色分级权限体系**：创建者、复审人、初审人、维护人员
2. **多级审核流程**：初审人拥有终点决策权
3. **文档审核中锁定**：防止审核基准变动
4. **版本管理**：按日期分组，智能归档
5. **成员管理**：搜索式添加成员

## 📝 注意事项

- 当前为**前端演示版本**，所有数据在 \src/mocks/\ 中
- 需要后端对接，API 需求详见 PRD 第 10 章
- 生产环境需移除 RoleSwitcher 演示组件

