# 金额大小写互转

数字金额与中文大写金额互转。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 输入金额。
2. 点击「数字转大写」或「大写转数字」。
3. 复制结果。

## 参数 / 选项

无。

## 技术实现

- **依赖库**：无第三方库；引用内部工具 `@/utils/amountCase`（`amountToChinese` / `chineseToAmount`）
- 输入无效时提示并返回

## 运行截图

![金额大小写互转](/screenshots/convert-amount-case.png)

## 相关工具

- [字母大小写互转](/tools/convert/case-convert)
- [时间戳转换](/tools/convert/timestamp)
