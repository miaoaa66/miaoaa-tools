# 字符串生成二维码

文本生成二维码 PNG 图片。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 输入文本。
2. 自动生成二维码。
3. 复制图片或下载 PNG。

## 参数 / 选项

- 纠错等级：L / M / Q / H
- 尺寸：64–1024 px
- 边距：0–10
- 前景 / 背景色

## 技术实现

- **依赖库**：`qrcode`
- **浏览器能力**：`Canvas`、`navigator.clipboard` + `ClipboardItem`
- 文本过长时提示错误

## 运行截图

![字符串生成二维码](/screenshots/convert-qrcode-gen.png)

## 相关工具

- [二维码解码](/tools/convert/qrcode-decode)
- [字符串生成条形码](/tools/convert/barcode-gen)
