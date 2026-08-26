# GIF 拆分 PNG

将 GIF 动图逐帧拆分为 PNG 图片。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 上传 GIF 动图。
2. 自动拆分，网格预览每一帧。
3. 单帧下载或「下载全部」。

## 参数 / 选项

无。

## 技术实现

- **依赖库**：`gifuct-js`（`parseGIF` / `decompressFrames`）
- **浏览器能力**：`Canvas`、`ImageData`、`URL.createObjectURL`
- 正确处理 disposal 方式 2 / 3 以还原每帧；「下载全部」逐张间隔 200ms 触发

## 运行截图

![GIF 拆分 PNG](/screenshots/convert-gif-split.png)

## 相关工具

- [多 PNG 合成 GIF](/tools/convert/gif-merge)
