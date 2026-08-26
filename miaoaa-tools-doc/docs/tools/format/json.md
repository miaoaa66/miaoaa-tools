# JSON 格式化

将 JSON 文本格式化（美化缩进）或压缩为单行。

::: tip 所属分类
**格式化工具**
:::

## 使用步骤

1. 在输入框粘贴 JSON 文本。
2. 选择缩进方式。
3. 点击「格式化」或「压缩」。
4. 点击「复制结果」。

## 参数 / 选项

- 缩进：2 空格 / 4 空格 / Tab
- 重置按钮

## 技术实现

- **依赖库**：Element Plus（`ElMessage`）
- 基于原生 `JSON.parse` / `stringify`，非法 JSON 会提示解析失败

## 运行截图

![JSON 格式化](/screenshots/format-json.png)

## 相关工具

- [SQL 格式化](/tools/format/sql)
- [JSON 导出 Excel](/tools/convert/json-to-excel)
