# miaoaa-tools

本地离线可用的开发工具集合，无需联网，保护隐私，开箱即用。

## 特性

- 联网安装包之后。完全本地运行，无需网络连接
- 支持多种图片和文本处理工具
- 基于 Vue 3 + Vite，响应快速
- 开源免费，持续更新

## 功能列表

- avif/webp 转 png
- 图片裁剪
- 图片压缩
- 图片九宫格切图
- 图片转 ico
- 图片 & Base64 互转
- 图片 & SVG 互转
- URL 编码/解码
- 字符串生成二维码
- 二维码解码
- 字符串生成条形码
- 条形码解码
- GIF 拆分 PNG
- 多 PNG 合成 GIF
- 变量格式转换
- JSON 格式化
- SQL 格式化
- 代码对比

## 技术栈

- **前端框架**: Vue 3.5
- **构建工具**: Vite 8
- **状态管理**: Pinia
- **UI 组件**: Element Plus
- **路由**: Vue Router

## 环境要求

- Node.js >= 22.18.0 或 >= 24.12.0
- 推荐使用 Node.js 22.16.0（已验证稳定运行）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查并自动修复
npm run lint
```

## 项目结构

```
src/
├── components/       # 公共组件
├── views/           # 页面视图
│   ├── convert/     # 编码转换工具
│   ├── image/       # 图片处理工具
│   ├── code/        # 代码工具
│   └── format/      # 格式化工具
├── router/          # 路由配置
├── stores/          # 状态管理
└── assets/          # 静态资源
```

## 贡献

欢迎提交 Issue 或 Pull Request 来添加新功能或修复问题。

## 许可证

[MIT](LICENSE)
