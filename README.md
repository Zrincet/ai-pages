# AI HTML Generator

基于 Vue3 + Vite + Tailwind CSS 的大模型 Agent HTML 生成器，通过自然语言描述生成优雅的单页应用，并通过阿里云 ESA 边缘存储发布。

## ✨ 功能特性

- 🤖 **AI 驱动生成**：使用 OpenAI 标准 API，通过自然语言描述生成完整的 HTML 页面
- 💬 **流式对话**：实时流式对话，边生成边预览
- 👁️ **实时预览**：iframe 沙箱模式实时预览生成的 HTML
- 🚀 **边缘发布**：基于阿里云 ESA 边缘存储，全球 CDN 加速访问
- 📝 **历史记录**：本地保存历史生成记录，随时查看和管理
- 🎨 **优雅 UI**：极简主义设计，柔和渐变配色，精致微交互

## 🛠️ 技术栈

- **前端框架**：Vue 3 + Vite
- **样式方案**：Tailwind CSS
- **路由管理**：Vue Router
- **AI 集成**：OpenAI Compatible API (支持 OpenAI、Deepseek 等)
- **流式处理**：@microsoft/fetch-event-source
- **边缘存储**：阿里云 ESA EdgeKV
- **图标库**：Heroicons
- **Markdown**：Marked.js

## 📦 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd SimpleHtml
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 阿里云 ESA 边缘函数域名
VITE_ESA_DOMAIN=https://your-esa-domain.com
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 5. 配置大模型

首次使用时，点击右上角设置图标，配置：
- API 地址（如 https://api.openai.com/v1）
- API Key
- 模型名称（如 gpt-4o）

支持的预设：
- OpenAI GPT-4 / GPT-3.5
- Deepseek
- OpenAI Compatible (如 Ollama 本地模型)

## 📚 部署指南

详细部署步骤请参考：

- **[阿里云 ESA 部署文档](docs/DEPLOYMENT.md)** - 完整的边缘函数部署指南
- **[ESA 初始化配置](docs/ESA_SETUP.md)** - ESA 服务初始化配置

## 🏗️ 项目结构

```
SimpleHtml/
├── src/
│   ├── components/          # Vue 组件
│   ├── views/               # 页面视图
│   ├── services/            # 服务层
│   ├── utils/               # 工具函数
│   ├── router/              # 路由配置
│   └── style.css            # 全局样式
├── edge-functions/          # 边缘函数
├── docs/                    # 文档
├── scripts/                 # 脚本
└── package.json             # 项目配置
```

## 🎯 使用流程

1. **首页输入**：在首页输入框中描述您想要的页面
2. **AI 生成**：点击生成按钮，进入设计页面开始对话
3. **实时预览**：左侧对话，右侧实时预览生成的 HTML
4. **迭代优化**：继续对话，描述修改需求，AI 会优化页面
5. **发布上线**：满意后点击发布，获得可访问的链接
6. **历史管理**：在历史记录中查看和管理已发布的页面

## 🔧 开发指南

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 📄 许可证

MIT License
