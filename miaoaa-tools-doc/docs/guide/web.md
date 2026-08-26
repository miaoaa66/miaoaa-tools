# Web 应用

`miaoaa-tools/` 是 Miaoaa Tools 的**核心形态**：一个纯前端、本地离线可用的工具集，浏览器打开即用。

## 特性

- 完全本地运行，安装后无需网络连接，数据不上传
- 支持多种图片、文本、音视频、格式化与代码工具
- 基于 Vue 3 + Vite，响应快速
- 开源免费，持续更新

## 技术栈

- **前端框架**：Vue 3.5
- **构建工具**：Vite 8
- **状态管理**：Pinia
- **UI 组件**：Element Plus
- **路由**：Vue Router（hash 路由）

## 环境要求

- Node.js ≥ 22.18.0 或 ≥ 24.12.0

## 快速开始

```bash
cd miaoaa-tools
npm install        # 安装依赖
npm run dev        # 启动开发服务器（端口 7011）
npm run build      # 构建生产版本
npm run preview    # 预览生产版本
npm run lint       # 代码检查并自动修复
```

## 项目结构

```
src/
├── components/       # 公共组件
├── views/           # 页面视图
│   ├── convert/     # 转换工具（编码 / 二维码 / 条形码等）
│   ├── image/       # 图片处理工具
│   ├── format/      # 格式化工具
│   ├── code/        # 代码工具
│   ├── mock/        # Mock 数据生成器
│   ├── video/       # 视频工具
│   └── audio/       # 音频工具
├── router/          # 路由配置
├── stores/          # 状态管理
├── vscode/          # VSCode Webview 适配层（能力桥接）
└── assets/          # 静态资源
```

## 相关项目

本项目同时是 [VSCode 插件](./vscode)、[浏览器插件](./browser)、[uTools 插件](./utools) 的 Webview 内容来源，构建产物会被打包进这些插件。
