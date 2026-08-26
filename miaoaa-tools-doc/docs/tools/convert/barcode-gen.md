# 字符串生成条形码

文本生成条形码 PNG 图片。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 输入文本。
2. 自动生成条形码。
3. 复制图片或下载 PNG。

## 参数 / 选项

- 条码类型：CODE128 / CODE39 / EAN13 / EAN8 / UPC / ITF14 / MSI / Pharmacode / Codabar
- 宽度、高度
- 前景 / 背景色
- 「显示文本」开关

## 技术实现

- **依赖库**：`jsbarcode`
- **浏览器能力**：`XMLSerializer`、`Canvas`、`URL.createObjectURL`
- 按条码类型给出数字位数占位提示

## 运行截图

![字符串生成条形码](/screenshots/convert-barcode-gen.png)

## 相关工具

- [条形码解码](/tools/convert/barcode-decode)
- [字符串生成二维码](/tools/convert/qrcode-gen)
