# Miaoaa Tools

把 `miaoaa-tools` 离线工具集合（Vue 3 + Vite + Element Plus）嵌入到 VSCode 中，约 **36 个**本地工具，**所有处理在本地完成，数据不上传**。

## 功能

按类别分组（侧边栏菜单顺序）：

- **图片工具**：裁剪、压缩、九宫格切图、加圆角、加背景、加水印、旋转、翻转；图片 ↔ Base64、图片 ↔ SVG、图片转 ICO、GIF 拆分/合并、AVIF/WebP → PNG
- **转换工具**：二维码生成与解码、条形码生成与解码、URL 编码/解码、变量格式转换、大小写互转、金额大小写、时间戳、JSON → Excel
- **格式化工具**：JSON 格式化、SQL 格式化、文字竖排
- **代码工具**：代码对比、正则测试、Mock 数据生成器
- **视频工具**：视频时长裁剪、视频&GIF互转
- **音频工具**：音频时长裁剪、文本转语音、文本转语音（跟读变色）

## 使用方式

安装后默认显示在 **底部面板**（与「输出/终端/问题」同一栏，多出一个「Miaoaa Tools」标签），点击即可打开。

也可以把视图**拖到主侧边栏**或**辅助侧边栏**（VSCode 1.85+）使用：

- 在面板 tab 上右键 → **Move to** → Primary Side Bar / Secondary Side Bar
- 或直接拖动 tab

命令面板：`Miaoaa Tools: 打开`

## 开发与打包

```bash
npm install        # 安装依赖
npm run package    # 构建 miaoaa-tools 并打包成 .vsix
npm run sync       # 仅重新构建 / 拷贝 webview 产物（不打包）
npm run build      # 仅重新打包扩展端 TS
```

打包产物为 `miaoaa-tools-vscode-<version>.vsix`，在 VSCode 扩展面板「从 VSIX 安装」即可。

开发调试：用 VSCode 打开本目录，按 **F5** 启动 Extension Development Host（已配好 `.vscode/launch.json`）。

## 系统要求

- VSCode **1.85** 及以上（辅助侧边栏从该版本开始支持）
- 无运行时依赖，所有资源打包在扩展内

## 已知限制

由于 VSCode Webview 的沙箱限制，部分浏览器能力不可用，扩展做了如下适配：

| 功能 | 状态 | 说明 |
|---|---|---|
| 文件下载（导出图片/JSON/二维码等） | ✅ 桥接 | 通过系统保存对话框，扩展端写入文件 |
| 文件上传 / 拖拽 | ✅ 桥接 | 通过系统打开对话框，扩展端读取后回传 |
| 剪贴板 | ✅ 桥接 | 走扩展端 `env.clipboard` |
| Canvas 图像处理、格式化、代码、路由、主题 | ✅ 完全可用 | 无需改动 |
| 文本转语音 / 音频裁剪 | ⚠️ 待实测 | Webview 内可能可用，建议实测 |

## 与原版差异

本扩展版相对原项目 `miaoaa-tools` 移除了以下功能（因 VSCode Webview 沙箱限制，不可用）：

- **语音转文字**：`webkitSpeechRecognition` 在 Electron Webview 中未提供
- **全屏按钮**：各视图右上角的全屏按钮

保留但建议实测（仅标 ⚠️ 待实测，未移除）：

- 音频时长裁剪、文本转语音（含跟读变色）

## 相关项目

- 原项目（纯前端工具集，Webview 内容来源）：`../miaoaa-tools`
- 本扩展工程：`miaoaa-tools-vscode/`

## 许可证

MIT

## 反馈

遇到问题或有建议，欢迎在项目仓库提交 Issue。
