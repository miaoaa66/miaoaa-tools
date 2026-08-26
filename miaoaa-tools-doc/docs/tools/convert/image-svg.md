# 图片 & SVG 互转

图片转 SVG 与 SVG 转位图（PNG / JPEG）。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 上传图片自动生成 SVG（可复制 / 下载）。
2. 或上传 / 粘贴 SVG 代码。
3. SVG 自动转为 PNG / JPEG 并下载。

## 参数 / 选项

- 图片转 SVG：可选「内嵌位图 / 矢量化轮廓」，二值化阈值滑块
- SVG 转图：输出格式（PNG / JPEG）、JPEG 质量、缩放倍数（1–5）

## 技术实现

- **依赖库**：无第三方库
- **浏览器能力**：`FileReader`、`Canvas`、`DOMParser`、`URL.createObjectURL`
- 「矢量化轮廓」为自写灰度二值化 + 矩形扫描，非真正的矢量追踪

## 运行截图

![图片 & SVG 互转](/screenshots/convert-image-svg.png)

## 相关工具

- [图片 & Base64 互转](/tools/convert/image-base64)
- [avif/webp 转 png](/tools/convert/avif-webp-to-png)
