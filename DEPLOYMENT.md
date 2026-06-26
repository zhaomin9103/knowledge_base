# Netlify 部署指南

## 项目已推送到 GitHub
- 仓库地址: https://github.com/zhaomin9103/knowledge_base.git
- 分支: main

## Netlify 部署步骤

### 方式一：通过 Netlify Web 界面（推荐）

1. **登录 Netlify**
   - 访问 https://app.netlify.com/
   - 使用 GitHub 账号登录（邮箱: 1010125573@qq.com）

2. **导入项目**
   - 点击 "Add new site" > "Import an existing project"
   - 选择 "Deploy with GitHub"
   - 授权 Netlify 访问你的 GitHub 账号
   - 在仓库列表中选择 `zhaomin9103/knowledge_base`

3. **配置构建设置**
   
   Netlify 会自动检测到 `netlify.toml` 配置，但请确认以下设置：
   
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   
   这些设置已在 `netlify.toml` 中配置好。

4. **部署**
   - 点击 "Deploy site"
   - 等待构建完成（首次部署约需 2-3 分钟）
   - 部署成功后，你会获得一个 Netlify 子域名（如 `your-site-name.netlify.app`）

5. **自定义域名（可选）**
   - 在 Netlify 项目设置中，点击 "Domain management"
   - 可以添加自定义域名或修改 Netlify 子域名

### 方式二：通过 Netlify CLI

如果你想通过命令行部署：

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 初始化站点
netlify init

# 部署
netlify deploy --prod
```

## 配置文件说明

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- **command**: 构建命令（运行 Vite 构建）
- **publish**: 构建输出目录
- **redirects**: SPA 路由重定向配置（所有路由都返回 index.html）

## 环境变量配置

如果项目需要环境变量：

1. 在 Netlify 项目设置中，找到 "Environment variables"
2. 添加需要的环境变量（如 API URL）
3. 变量名必须以 `VITE_` 开头才能在前端访问

示例：
```
VITE_API_URL=https://api.example.com
```

## 自动部署

配置完成后：
- 每次推送到 `main` 分支，Netlify 会自动触发构建和部署
- 可在 Netlify 仪表板查看部署状态和日志

## 常见问题

### 1. 构建失败
- 检查 `package.json` 中的 Node 版本要求
- 查看 Netlify 构建日志获取详细错误信息

### 2. 页面刷新 404
- 确保 `netlify.toml` 中的 redirects 规则正确配置

### 3. 静态资源加载失败
- 检查 `vite.config.ts` 中的 base 路径配置

## 资源链接

- Netlify 文档: https://docs.netlify.com/
- Vite 部署指南: https://vitejs.dev/guide/static-deploy.html
- GitHub 仓库: https://github.com/zhaomin9103/knowledge_base

