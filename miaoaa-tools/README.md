# miaoaa-tools

本地离线可用的开发工具集合，无需联网，保护隐私，开箱即用。

## 特性

- 完全本地运行，安装后无需网络连接，数据不上传
- 支持多种图片、文本、音视频、格式化与代码工具
- 基于 Vue 3 + Vite，响应快速
- 开源免费，持续更新

## 功能列表

- **图片工具**：裁剪、压缩、九宫格切图、加圆角、加背景、加水印、旋转、水平/垂直翻转
- **图片互转**：图片 ↔ Base64、图片 ↔ SVG、图片转 ICO、GIF 拆分 PNG、多 PNG 合成 GIF、AVIF/WebP → PNG
- **转换工具**：URL 编码/解码、变量格式转换、字母大小写互转、金额大小写互转、时间戳转换、JSON → Excel
- **二维码 / 条形码**：生成与解码
- **格式化工具**：JSON 格式化、SQL 格式化、文字竖排
- **代码工具**：代码对比、正则表达式测试、Mock 数据生成器
- **视频工具**：视频时长裁剪、视频&GIF互转
- **音频工具**：音频时长裁剪、文本转语音、语音转文字

> 待实现：PDF 和图片互转

## 技术栈

- **前端框架**: Vue 3.5
- **构建工具**: Vite 8
- **状态管理**: Pinia
- **UI 组件**: Element Plus
- **路由**: Vue Router

## 环境要求

- Node.js >= 22.18.0 或 >= 24.12.0

## 快速开始

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器
npm run build     # 构建生产版本
npm run preview   # 预览生产版本
npm run lint      # 代码检查并自动修复
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

本项目同时是 VSCode 插件 [Miaoaa Tools](../miaoaa-tools-vscode) 的 Webview 内容来源，构建产物会被打包进插件。

## 贡献

欢迎提交 Issue 或 Pull Request 来添加新功能或修复问题。

## 许可证

[MIT](../LICENSE)
