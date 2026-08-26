# Mock 数据生成器

按字段定义批量生成模拟数据，支持多种格式导出。

::: tip 所属分类
**Mock 工具**
:::

## 使用步骤

1. 选模板（用户 / 订单 / 文章 / 课程 / 通知 / 日志）或「添加字段」。
2. 为每个字段选类型并配置规则。
3. 选输出类型、条数、导出格式。
4. 点击「生成数据」，可复制 / 下载。

## 参数 / 选项

- 输出类型：对象数组 / 单对象
- 生成条数：1–10000（仅数组时）
- 导出格式：JSON / JSON Array / CSV / SQL INSERT

**数据类型**：自增 ID、字符串、数字、布尔值、日期、邮箱、手机号、姓名、地址、URL、IP、UUID、枚举、长文本、标题、订单号、标签、模块。

**规则**：数字（min / max / 小数位）、字符串 / 长文本（最小 / 最大长度）、日期（格式，如 `YYYY-MM-DD`）、枚举（逗号分隔选项）。

## 技术实现

- **依赖库**：Element Plus；数据生成逻辑为本地模块 `templates.js`、`generators.js`，纯前端无第三方库
- CSV / SQL 导出时数组值用 `|` 连接，含逗号 / 换行字符串自动加引号

## 运行截图

![Mock 数据生成器](/screenshots/mock-generator.png)

## 相关工具

- [JSON 导出 Excel](/tools/convert/json-to-excel)
- [JSON 格式化](/tools/format/json)
