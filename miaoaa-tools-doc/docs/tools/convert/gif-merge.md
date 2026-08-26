# 多 PNG 合成 GIF

多张图片按顺序合成 GIF 动图。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 上传多图（可多选）。
2. 调整顺序 / 移除不需要的帧。
3. 设置每帧延迟与循环次数。
4. 点击「合成 GIF」并下载。

## 参数 / 选项

- 每帧延迟：20–5000ms（默认 100）
- 循环次数：0 = 无限（默认 0）

## 技术实现

- **依赖库**：`gifenc`（`GIFEncoder` / `quantize` / `applyPalette`）
- **浏览器能力**：`createImageBitmap`、`Canvas`
- 画布取所有图片最大宽高；至少需 2 张图

## 运行截图

![多 PNG 合成 GIF](/screenshots/convert-gif-merge.png)

## 相关工具

- [GIF 拆分 PNG](/tools/convert/gif-split)
