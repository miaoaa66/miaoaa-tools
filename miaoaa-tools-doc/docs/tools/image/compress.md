# 图片压缩

压缩图片体积，并对比原图与压缩后的大小、节省比例。

::: tip 所属分类
**图片工具**
:::

## 使用步骤

1. 上传图片。
2. 调整质量滑块。
3. 点击「开始压缩」。
4. 点击「下载」保存。

## 参数 / 选项

- 质量滑块（0.1–1）
- 输出格式自动保持原图格式（JPEG / PNG / WebP）

## 技术实现

- **依赖库**：无第三方库
- **浏览器能力**：Canvas `toBlob`
- PNG 为无损，质量参数仅影响二次压缩；非 jpeg / png / webp 一律按 JPEG 输出

## 运行截图

![图片压缩](/screenshots/image-compress.png)

## 相关工具

- [图片裁剪](/tools/image/crop)
- [avif/webp 转 png](/tools/convert/avif-webp-to-png)
