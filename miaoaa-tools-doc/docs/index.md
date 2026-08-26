---
layout: home

hero:
  name: "Miaoaa Tools"
  text: "本地离线开发工具集"
  tagline: 轻量开发工具集 · 纯前端 · 本地离线可用 · 易搭建易部署
  image:
    src: /logo.png
    alt: Miaoaa Tools
  actions:
    - theme: brand
      text: 开始使用
      link: /guide/overview
    - theme: alt
      text: 查看全部工具
      link: /tools/

features:
  - title: 纯前端 · 本地离线
    details: 所有处理在本地浏览器完成，数据不上传，保护隐私，开箱即用。
  - title: 36 个实用工具
    details: 覆盖图片、音视频、文本编码、代码格式化、数据处理等常用开发场景。
  - title: 4 种使用形态
    details: Web 应用、浏览器插件、VSCode 插件、uTools 插件，同一套工具集随处可用。
  - title: 易搭建易部署
    details: 基于 Vue 3 + Vite，构建产物为纯静态文件，可托管到任意静态站点。
---

## 这是什么？

**Miaoaa Tools** 是一站式在线开发工具集，覆盖图片、音视频、文本编码、代码格式化、数据处理等常用开发场景：

- **图片**：AVIF / WebP / PNG 格式互转、压缩裁剪、九宫格切图、转 ICO、Base64 / SVG 转换、旋转翻转、圆角加水印、GIF 拆分与合成
- **开发辅助**：URL 编解码、二维码 / 条形码生成解析、时间戳与日期互转、字母大小写互转、金额大小写互转、变量格式转换、JSON 导出 Excel
- **代码与数据**：Mock 数据生成、代码对比、正则表达式测试
- **音视频**：音频 / 视频时长裁剪、视频&GIF互转、文本转语音、语音转文字

## 快速开始

```bash
# Web 应用
cd miaoaa-tools
npm install
npm run dev        # 开发
npm run build      # 构建生产版本
```

::: tip 仓库地址
<https://gitee.com/miaoaa66/miaoaa-tools>
:::

## 目录导航

- [项目总览](/guide/overview)：了解 4 种使用形态
- [工具索引](/tools/)：按分类浏览全部 36 个工具
- [外部项目](/external/)：作者的其他开源项目
