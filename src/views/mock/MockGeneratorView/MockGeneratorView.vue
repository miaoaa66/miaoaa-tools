<template>
  <div class="mock-generator">
    <h2>Mock 数据生成器</h2>

    <div class="card">
      <h3>选择模板</h3>
      <div class="template-list">
        <button
          v-for="tpl in templates"
          :key="tpl.name"
          :class="['template-btn', { active: activeTemplate === tpl.name }]"
          @click="applyTemplate(tpl)"
        >
          {{ tpl.name }}
        </button>
      </div>
    </div>

    <div class="card">
      <h3>生成配置</h3>
      <el-form inline>
        <el-form-item label="输出类型">
          <el-radio-group v-model="outputType">
            <el-radio label="array">对象数组</el-radio>
            <el-radio label="object">单对象</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生成条数" v-if="outputType === 'array'">
          <el-input-number
            v-model="count"
            :min="1"
            :max="10000"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="导出格式">
          <el-select v-model="exportFormat" style="width: 120px">
            <el-option label="JSON" value="json" />
            <el-option label="JSON Array" value="json-array" />
            <el-option label="CSV" value="csv" />
            <el-option label="SQL INSERT" value="sql" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="generate">生成数据</el-button>
          <el-button @click="addField">添加字段</el-button>
          <el-button @click="clearFields" plain>清空</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card">
      <h3>字段定义 ({{ fields.length }})</h3>
      <el-table :data="fields" border style="width: 100%">
        <el-table-column prop="name" label="字段名" width="150">
          <template #default="{ row }">
            <el-input v-model="row.name" placeholder="字段名" />
          </template>
        </el-table-column>
        <el-table-column prop="type" label="数据类型" width="120">
          <template #default="{ row }">
            <el-select v-model="row.type" @change="onTypeChange(row)" style="width: 110px">
              <el-option
                v-for="(cfg, key) in typeConfig"
                :key="key"
                :value="key"
                :label="cfg.label"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="rules" label="规则" label-align="left">
          <template #default="{ row }">
            <div class="rules-panel">
              <!-- options for enum -->
              <template v-if="row.type === 'enum'">
                <div class="rule-line">
                  <span class="label">选项（逗号分隔）</span>
                  <el-input
                    v-model="row.rules.optionsText"
                    placeholder="选项1,选项2,选项3"
                    size="small"
                    @input="onEnumOptionsChange(row)"
                  />
                </div>
              </template>
              <!-- number -->
              <template v-if="row.type === 'number'">
                <div class="rule-line">
                  <span class="label">最小值</span>
                  <el-input-number v-model="row.rules.min" :min="0" size="small" />
                </div>
                <div class="rule-line">
                  <span class="label">最大值</span>
                  <el-input-number v-model="row.rules.max" :min="0" size="small" />
                </div>
                <div class="rule-line">
                  <span class="label">小数位</span>
                  <el-input-number v-model="row.rules.decimal" :min="0" :max="10" size="small" />
                </div>
              </template>
              <!-- string/text -->
              <template v-if="['string', 'text'].includes(row.type)">
                <div class="rule-line">
                  <span class="label">最小长度</span>
                  <el-input-number v-model="row.rules.minLength" :min="1" size="small" />
                </div>
                <div class="rule-line">
                  <span class="label">最大长度</span>
                  <el-input-number v-model="row.rules.maxLength" :min="1" size="small" />
                </div>
              </template>
              <!-- date -->
              <template v-if="row.type === 'date'">
                <div class="rule-line">
                  <span class="label">格式</span>
                  <el-input v-model="row.rules.format" placeholder="YYYY-MM-DD" size="small" />
                </div>
              </template>
              <span v-if="!hasRules(row.type)" class="no-rules">无规则</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" size="small" text @click="removeField($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="generatedData && generatedData.length > 0" class="card result-card">
      <div class="result-header">
        <h3>生成结果 ({{ generatedData.length }} 条)</h3>
        <div class="result-actions">
          <el-button size="small" @click="copyResult">复制</el-button>
          <el-button size="small" @click="downloadResult">下载</el-button>
        </div>
      </div>
      <div v-if="['json', 'json-array'].includes(exportFormat)" class="json-preview">
        <pre>{{ formattedResult }}</pre>
      </div>
      <div v-else-if="exportFormat === 'csv'" class="text-preview">
        <pre>{{ formattedResult }}</pre>
      </div>
      <div v-else-if="exportFormat === 'sql'" class="text-preview">
        <pre>{{ formattedResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { templates } from './templates'
import { generateRecord, typeConfig } from './generators'

const activeTemplate = ref('')
const fields = ref([])
const outputType = ref('array')
const count = ref(10)
const exportFormat = ref('json')
const generatedData = ref(null)
const formattedResult = computed(() => {
  if (!generatedData.value) return ''
  return formatResult(generatedData.value, exportFormat.value)
})

function hasRules(type) {
  return typeConfig[type]?.hasRules
}

function onEnumOptionsChange(row) {
  if (!row.rules) row.rules = {}
  row.rules.options = (row.rules.optionsText || '').split(',').map(s => s.trim()).filter(Boolean)
}

function applyTemplate(tpl) {
  activeTemplate.value = tpl.name
  fields.value = tpl.fields.map(f => {
    const field = { ...f }
    if (field.type === 'enum' && field.rules?.options) {
      field.rules.optionsText = field.rules.options.join(',')
    }
    return field
  })
}

function addField() {
  const newField = {
    name: '',
    type: 'string',
    rules: { minLength: 2, maxLength: 10 },
  }
  fields.value.push(newField)
}

function removeField(index) {
  fields.value.splice(index, 1)
}

function clearFields() {
  fields.value = []
  activeTemplate.value = ''
  generatedData.value = null
}

function generate() {
  if (fields.value.length === 0) {
    ElMessage.warning('请至少添加一个字段')
    return
  }
  // 检查必填
  for (const f of fields.value) {
    if (!f.name) {
      ElMessage.warning('存在未填写字段名的字段')
      return
    }
  }

  const total = outputType.value === 'array' ? count.value : 1
  const result = []
  const idCounter = { value: 0 }

  for (let i = 0; i < total; i++) {
    const record = generateRecord(fields.value, idCounter)
    result.push(record)
  }

  generatedData.value = result
  ElMessage.success(`已生成 ${result.length} 条数据`)
}

function formatResult(data, format) {
  switch (format) {
    case 'json':
      return JSON.stringify(outputType.value === 'array' ? data : data[0], null, 2)
    case 'json-array':
      return JSON.stringify(data, null, 2)
    case 'csv':
      return formatToCsv(data)
    case 'sql':
      return formatToSql(data)
    default:
      return JSON.stringify(data, null, 2)
  }
}

function formatToCsv(data) {
  if (data.length === 0) return ''
  const keys = Object.keys(data[0])
  const header = keys.join(',')
  const rows = data.map(row => {
    return keys.map(key => {
      let val = row[key]
      if (Array.isArray(val)) val = val.join('|')
      if (typeof val === 'string' && (val.includes(',') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return String(val)
    }).join(',')
  })
  return [header, ...rows].join('\n')
}

function formatToSql(data) {
  if (data.length === 0) return ''
  const tableName = 'mock_data'
  const keys = Object.keys(data[0])
  const cols = keys.join(', ')
  const lines = data.map(row => {
    const values = keys.map(key => {
      const val = row[key]
      if (val === null || val === undefined) return 'NULL'
      if (typeof val === 'number' || typeof val === 'boolean') return String(val)
      if (Array.isArray(val)) return `'${JSON.stringify(val).replace(/'/g, "\\'")}'`
      return `'${String(val).replace(/'/g, "\\'")}'`
    })
    return `  (${values.join(', ')})`
  })
  return `INSERT INTO ${tableName} (${cols})\nVALUES\n${lines.join(',\n')};`
}

async function copyResult() {
  if (!formattedResult.value) return
  try {
    await navigator.clipboard.writeText(formattedResult.value)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败，请手动复制')
  }
}

function downloadResult() {
  const extensions = {
    json: 'json',
    'json-array': 'json',
    csv: 'csv',
    sql: 'sql',
  }
  const ext = extensions[exportFormat.value] || 'txt'
  const blob = new Blob([formattedResult.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mock.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function onTypeChange(row) {
  if (row.type === 'number') {
    row.rules = row.rules || {}
    if (row.rules.min === undefined) row.rules.min = 0
    if (row.rules.max === undefined) row.rules.max = 100
  } else if (['string', 'text'].includes(row.type)) {
    row.rules = row.rules || {}
    if (row.rules.minLength === undefined) row.rules.minLength = 2
    if (row.rules.maxLength === undefined) row.rules.maxLength = 20
  } else if (row.type === 'date') {
    row.rules = row.rules || {}
    if (!row.rules.format) row.rules.format = 'YYYY-MM-DD'
  } else if (row.type === 'enum') {
    row.rules = row.rules || {}
    if (!row.rules.optionsText) row.rules.optionsText = row.rules.options ? row.rules.options.join(',') : ''
    onEnumOptionsChange(row)
  } else {
    row.rules = {}
  }
}

</script>

<style scoped>
.mock-generator {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: var(--content-text);
}

h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--content-text);
}

.card {
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
}

.template-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--content-text);
}

.template-btn:hover {
  border-color: var(--theme-color);
  color: var(--theme-color);
}

.template-btn.active {
  background-color: var(--theme-color);
  border-color: var(--theme-color);
  color: #fff;
}

.rules-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 32px;
}

.rule-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rule-line .label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.no-rules {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-header h3 {
  margin: 0;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.json-preview,
.text-preview {
  max-height: 500px;
  overflow: auto;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  padding: 12px;
}

.json-preview pre,
.text-preview pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--content-text);
  font-size: 13px;
}
</style>
