# 🚀 Netlify 部署快速清单

## ✅ 已完成

- [x] 初始化 Git 仓库
- [x] 配置 Git 用户信息（邮箱: 1010125573@qq.com）
- [x] 连接到 GitHub 远程仓库
- [x] 创建 `netlify.toml` 配置文件
- [x] 创建 `.env.example` 环境变量模板
- [x] 提交并推送所有文件到 GitHub
- [x] 创建部署文档（DEPLOYMENT.md）
- [x] 更新项目 README

## 📋 下一步操作（需要你手动完成）

### 1. 登录 Netlify
访问：https://app.netlify.com/

使用你的 GitHub 账号（1010125573@qq.com）登录

### 2. 导入项目
1. 点击 **"Add new site"** 
2. 选择 **"Import an existing project"**
3. 选择 **"Deploy with GitHub"**
4. 如果首次使用，需要授权 Netlify 访问你的 GitHub
5. 在仓库列表中搜索并选择 **`knowledge_base`**

### 3. 确认构建设置
Netlify 会自动检测 `netlify.toml` 配置，确认以下内容：

- **Branch to deploy**: `main` ✓
- **Build command**: `npm run build` ✓
- **Publish directory**: `dist` ✓

### 4. 开始部署
点击 **"Deploy site"** 按钮

### 5. 等待部署完成
- 首次部署大约需要 2-3 分钟
- 可以在 Netlify 控制台查看实时构建日志
- 部署成功后会自动生成一个 URL（格式：`your-site-name.netlify.app`）

## 🎯 部署后

### 访问你的网站
部署成功后，你会获得：
- 一个 Netlify 子域名（如：`happy-panda-123456.netlify.app`）
- 可以在 Netlify 控制台自定义域名

### 自动部署
配置完成后，每次你推送代码到 GitHub 的 `main` 分支，Netlify 会自动：
1. 检测到更新
2. 拉取最新代码
3. 运行构建命令
4. 部署新版本

## 📝 GitHub 仓库信息

- **仓库地址**: https://github.com/zhaomin9103/knowledge_base
- **分支**: main
- **最新提交**: docs: add deployment guide and update README

## 🔧 故障排查

如果部署失败，请检查：
1. Netlify 构建日志中的错误信息
2. `package.json` 中的依赖是否正确
3. Node.js 版本是否兼容（项目使用最新版本）

详细故障排查指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📚 相关文档

- [完整部署指南](./DEPLOYMENT.md)
- [项目 README](./README.md)
- [Netlify 官方文档](https://docs.netlify.com/)

---

**提示**：如果你想通过命令行部署，可以安装 Netlify CLI：
```bash
npm install -g netlify-cli
netlify login
netlify init
```
