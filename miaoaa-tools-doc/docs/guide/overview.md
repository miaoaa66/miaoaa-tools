# 项目总览

**Miaoaa Tools** 是一套本地离线可用的开发工具集合（**35 个工具**），所有处理都在本地完成，数据不上传，保护隐私。同一套工具集以四种形态交付，覆盖不同使用场景。

## 四种形态对比

| 形态 | 目录 | 运行环境 | 打包产物 | 安装方式 |
| --- | --- | --- | --- | --- |
| Web 应用 | `miaoaa-tools/` | 浏览器 | `dist/`（静态文件） | 直接访问 / 部署到静态托管 |
| 浏览器插件 | `miaoaa-tools-browser/` | Chrome / Edge（MV3） | `dist/` + `.zip` | `chrome://extensions` 加载已解压 |
| VSCode 插件 | `miaoaa-tools-vscode/` | VSCode ≥ 1.85 | `.vsix` | 扩展面板「从 VSIX 安装」 |
| uTools 插件 | `miaoaa-tools-utools/` | uTools ≥ 5.0 | `dist/` → `.upxs` | 开发者工具打包后安装 |

## 技术栈

| 形态 | 技术栈 |
| --- | --- |
| Web 应用 | Vue 3.5 / Vite 8 / Pinia / Element Plus / Vue Router |
| 浏览器插件 | Chromium MV3（manifest v3 + service worker） |
| VSCode 插件 | TypeScript + esbuild（扩展端）/ @vscode/vsce（打包） |
| uTools 插件 | plugin.json（uTools 清单）+ uTools 开发者工具 |

## 工具分类

共 **35 个工具**，分为 7 大类：

| 分类 | 数量 | 内容 |
| --- | --- | --- |
| 转换工具 | 16 | 格式互转、编码、二维码/条形码、时间戳、金额等 |
| 图片工具 | 8 | 裁剪、压缩、九宫格、圆角、水印、旋转翻转等 |
| 格式化工具 | 3 | JSON、SQL、文字竖排 |
| 代码工具 | 2 | 代码对比、正则测试 |
| Mock 工具 | 1 | Mock 数据生成器 |
| 视频工具 | 1 | 视频时长裁剪 |
| 音频工具 | 4 | 音频裁剪、文本转语音、语音转文字 |

> 待实现：PDF 和图片互转（源码中 `convert/PdfImageView/` 为占位目录）。

完整清单见 [工具索引](/tools/)。

## 目录结构

```
miaoaa-tools/
├── miaoaa-tools/          # Web 应用（Vue 3 + Vite + Element Plus）
├── miaoaa-tools-browser/  # 浏览器插件（Chrome / Edge，MV3）
├── miaoaa-tools-vscode/   # VSCode 插件（扩展外壳 + Webview 内嵌）
├── miaoaa-tools-utools/   # uTools 插件（plugin.json + Web 嵌入）
├── LICENSE
└── README.md
```

## 许可证

[MIT](https://gitee.com/miaoaa66/miaoaa-tools/blob/master/LICENSE)，开源免费，持续更新。
