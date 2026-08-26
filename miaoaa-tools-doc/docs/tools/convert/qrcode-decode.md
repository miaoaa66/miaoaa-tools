# 二维码解码

从图片识别二维码内容。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 上传包含二维码的图片。
2. 自动解码。
3. 查看 / 复制结果。

## 参数 / 选项

无。

## 技术实现

- **依赖库**：`jsqr`
- **浏览器能力**：`Canvas`、`getImageData`、`URL.createObjectURL`
- 开启 `willReadFrequently`；`inversionAttempts: attemptBoth` 支持反色码

## 运行截图

![二维码解码](/screenshots/convert-qrcode-decode.png)

## 相关工具

- [字符串生成二维码](/tools/convert/qrcode-gen)
- [条形码解码](/tools/convert/barcode-decode)
