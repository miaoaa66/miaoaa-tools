# 图片 & Base64 互转

图片与 Base64 字符串双向转换。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 左侧上传图片，自动生成 Base64（可复制）。
2. 右侧粘贴 Base64 字符串。
3. 点击「解析预览」还原图片。
4. 可下载还原的图片。

## 参数 / 选项

- 复选框「仅 Base64（不含 data 前缀）」

## 技术实现

- **依赖库**：无第三方库
- **浏览器能力**：`FileReader.readAsDataURL`、`navigator.clipboard`、`fetch`、`URL.createObjectURL`
- Base64 无前缀时按头部特征自动识别 MIME（jpeg / png / gif / webp / bmp）

## 运行截图

![图片 & Base64 互转](/screenshots/convert-image-base64.png)

## 相关工具

- [图片 & SVG 互转](/tools/convert/image-svg)
- [图片转 ICO](/tools/convert/image-to-ico)
