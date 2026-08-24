# miaoaa-tools

本地离线开发工具集合（约 36 个工具），提供四种形态：

- **Web 应用**（`miaoaa-tools/`）：Vue 3 + Vite + Element Plus 纯前端工具集，浏览器直接使用
- **浏览器插件**（`miaoaa-tools-browser/`）：Chrome / Edge 扩展，点击工具栏图标在新标签页打开工具集
- **VSCode 插件**（`miaoaa-tools-vscode/`）：把同一个工具集嵌入 VSCode，可在底部面板 / 主侧边栏 / 辅助侧边栏使用
- **uTools 插件**（`miaoaa-tools-utools/`）：在 uTools 搜索框输入关键词唤起，窗口内打开工具集

所有工具均在本地运行，数据不上传，保护隐私。

## 目录结构

```
miaoaa-tools/
├── miaoaa-tools/         # Web 应用（Vue 3 + Vite + Element Plus）
├── miaoaa-tools-browser/ # 浏览器插件（Chrome / Edge，MV3）
├── miaoaa-tools-vscode/  # VSCode 插件（扩展外壳 + Webview 内嵌）
├── miaoaa-tools-utools/  # uTools 插件（plugin.json + Web 嵌入）
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

### 浏览器插件

```bash
cd miaoaa-tools-browser
npm install
npm run package   # 构建 webview 并打包成 .zip
```

产物为 `miaoaa-tools-browser/dist/`（可加载目录）与 `miaoaa-tools-browser/miaoaa-tools-browser-<version>.zip`（分发包）。安装方式：`chrome://extensions` 打开「开发者模式」→「加载已解压的扩展程序」→ 选择 `dist/`。

### VSCode 插件

```bash
cd miaoaa-tools-vscode
npm install
npm run package   # 构建 webview 并打包成 .vsix
```

打包产物为 `miaoaa-tools-vscode/miaoaa-tools-vscode-<version>.vsix`，在 VSCode 扩展面板「从 VSIX 安装」即可。

### uTools 插件

```bash
cd miaoaa-tools-utools
npm install
npm run package   # 构建 web 并组装 dist/（不再产 .upx）
```

产物为 `miaoaa-tools-utools/dist/`（核心交付物）。**uTools v5.0+ 安装包已升级为 `.upxs`（加密 + 开发者签名）**，普通 zip 改名的 `.upx` 在 v7.x **不被识别**（只会被当作普通文件名匹配出「批量重命名 / 复制路径」等文件操作应用）。必须用「uTools 开发者工具」导入 `dist/plugin.json`，点「打包 UPXS」生成 `.upxs`，再长按 `.upxs` 右键 → 超级面板「安装插件应用」安装。

## 技术栈

- **Web 应用**：Vue 3.5 / Vite 8 / Pinia / Element Plus / Vue Router
- **浏览器插件**：Chromium MV3（manifest v3 + service worker）
- **VSCode 插件**：TypeScript + esbuild（扩展端）/ @vscode/vsce（打包）
- **uTools 插件**：plugin.json（uTools 清单）+ uTools 开发者工具（v5.0+ 打包为加密签名的 `.upxs`，无 CLI/SDK）

## 许可证

[MIT](LICENSE)
