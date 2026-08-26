# JSON 导出 Excel

JSON 数组 / 对象导出为 xlsx 文件。

::: tip 所属分类
**转换工具**
:::

## 使用步骤

1. 粘贴或上传 JSON。
2. 点击「解析」。
3. 配置列（排序 / 是否导出 / 列名）。
4. 设置文件名和 Sheet 名，点击「导出 .xlsx」。

## 参数 / 选项

- 列排序值、是否导出、自定义列名
- 文件名、Sheet 名

## 技术实现

- **依赖库**：`xlsx`（`XLSX.utils.aoa_to_sheet` / `writeFile`）
- **浏览器能力**：`FileReader.readAsText`
- 仅保留 string / number / boolean / null 标量字段；单对象会包装为数组

## 运行截图

![JSON 导出 Excel](/screenshots/convert-json-to-excel.png)

## 相关工具

- [JSON 格式化](/tools/format/json)
- [Mock 数据生成器](/tools/mock/generator)
