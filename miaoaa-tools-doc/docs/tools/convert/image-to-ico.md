# 图片转 ICO

将普通图片封装为多尺寸 ICO 图标文件。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 上传图片。
2. 勾选输出尺寸。
3. 点击「生成 ICO」。
4. 点击「下载 .ico」。

## 参数 / 选项

- 输出尺寸多选：16 / 24 / 32 / 48 / 64 / 128 / 256 px（默认 16 / 32 / 48）

## 技术实现

- **依赖库**：无第三方库
- **浏览器能力**：`Canvas`、`DataView`（手工构造 ICONDIR 二进制头）、`URL.createObjectURL`
- 256 尺寸按 0 存储

## 运行截图

![图片转 ICO](/screenshots/convert-image-to-ico.png)

## 相关工具

- [图片 & Base64 互转](/tools/convert/image-base64)
- [字符串生成二维码](/tools/convert/qrcode-gen)
