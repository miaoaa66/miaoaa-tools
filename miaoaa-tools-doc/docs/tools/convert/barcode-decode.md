# 条形码解码

从图片识别条形码内容。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 上传包含条形码的图片。
2. 自动解码。
3. 查看 / 复制结果。

## 参数 / 选项

无。

## 技术实现

- **依赖库**：`@zxing/library`（`BrowserMultiFormatReader`）
- **浏览器能力**：`URL.createObjectURL`
- 单例复用 reader；`NotFound` 异常特殊提示

## 运行截图

![条形码解码](/screenshots/convert-barcode-decode.png)

## 相关工具

- [字符串生成条形码](/tools/convert/barcode-gen)
- [二维码解码](/tools/convert/qrcode-decode)
