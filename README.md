# miaoaa-tools

本地离线开发工具集合（约 36 个工具），提供两种形态：

- **Web 应用**（`miaoaa-tools/`）：Vue 3 + Vite + Element Plus 纯前端工具集，浏览器直接使用
- **VSCode 插件**（`miaoaa-tools-vscode/`）：把同一个工具集嵌入 VSCode，可在底部面板 / 主侧边栏 / 辅助侧边栏使用

所有工具均在本地运行，数据不上传，保护隐私。

## 目录结构

```
miaoaa-tools/
├── miaoaa-tools/         # Web 应用（Vue 3 + Vite + Element Plus）
├── miaoaa-tools-vscode/  # VSCode 插件（扩展外壳 + Webview 内嵌）
├── LICENSE
└── README.md
```

## 快速开始

### Web 应用

```bash
cd miaoaa-tools
npm install
npm run dev       # 开发
npm run build     # 构建生产版本
```

### VSCode 插件

```bash
cd miaoaa-tools-vscode
npm install
npm run package   # 构建 webview 并打包成 .vsix
```

打包产物为 `miaoaa-tools-vscode/miaoaa-tools-vscode-<version>.vsix`，在 VSCode 扩展面板「从 VSIX 安装」即可。

## 技术栈

- **Web 应用**：Vue 3.5 / Vite 8 / Pinia / Element Plus / Vue Router
- **VSCode 插件**：TypeScript + esbuild（扩展端）/ @vscode/vsce（打包）

## 许可证

[MIT](LICENSE)
