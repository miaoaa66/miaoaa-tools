<template>
  <div class="json-to-excel">
    <el-card class="input-panel">
      <template #header>
        <div class="card-header">
          <span>输入 JSON 数据</span>
          <div class="header-actions">
            <el-button link type="primary" @click="handleUpload">上传 .json 文件</el-button>
            <el-button v-if="jsonText" link type="primary" @click="resetInput">重置</el-button>
          </div>
        </div>
      </template>
      <el-input
        v-model="jsonText"
        type="textarea"
        :rows="8"
        placeholder='粘贴 JSON 数据，例如：[{"name":"张三","age":25},{"name":"李四","age":30}]'
        class="json-textarea"
      />
      <div class="parse-actions">
        <el-button type="primary" @click="parseJson" :disabled="!jsonText">解析</el-button>
      </div>
    </el-card>

    <el-card v-if="parsedData.length > 0" class="preview-panel">
      <template #header>
        <div class="card-header">
          <span>数据预览（共 {{ parsedData.length }} 行）</span>
          <div class="header-actions">
            <el-button link type="primary" @click="selectAllColumns">全选列</el-button>
            <el-button link type="primary" @click="deselectAllColumns">取消全选</el-button>
          </div>
        </div>
      </template>

      <div class="column-selector">
        <div class="column-selector-title">选择要导出的列（点击列名可自定义）：</div>
        <div class="column-tags">
          <div
            v-for="col in columns"
            :key="col.key"
            class="column-tag-wrap"
          >
            <el-tag
              :type="col.visible ? '' : 'info'"
              @click="editColumnName(col)"
              class="column-tag"
              effect="plain"
            >
              {{ col.label }}
            </el-tag>
            <el-button
              :type="col.visible ? 'primary' : 'default'"
              size="small"
              link
              @click="toggleColumn(col.key)"
            >
              {{ col.visible ? '排除' : '包含' }}
            </el-button>
          </div>
        </div>
      </div>

      <el-table :data="parsedData" border style="width: 100%" max-height="400">
        <el-table-column
          v-for="col in visibleColumns"
          :key="col.key"
          :prop="col.key"
          :label="col.label"
          min-width="120"
        />
      </el-table>
    </el-card>

    <el-card v-if="parsedData.length > 0" class="export-panel">
      <template #header>
        <div class="card-header">
          <span>导出选项</span>
        </div>
      </template>
      <el-form label-width="100px">
        <el-form-item label="文件名">
          <el-input v-model="fileName" placeholder="export_YYYYMMDD_HHmmss.xlsx" />
        </el-form-item>
        <el-form-item label="Sheet 名称">
          <el-input v-model="sheetName" placeholder="Sheet1" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" @click="exportExcel">导出 .xlsx</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileChange"
    />

    <el-dialog v-model="editDialogVisible" title="编辑列名" width="400px">
      <el-form label-width="80px">
        <el-form-item label="原始 key">
          <el-input :model-value="editingColumn?.key" disabled />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="editingLabel" placeholder="输入自定义列名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEditColumnName">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

const jsonText = ref('')
const parsedData = ref([])
const columns = ref([])
const fileName = ref('')
const sheetName = ref('Sheet1')
const fileInput = ref(null)
const editDialogVisible = ref(false)
const editingColumn = ref(null)
const editingLabel = ref('')

const visibleColumns = computed(() => columns.value.filter(c => c.visible))

function handleUpload() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    jsonText.value = event.target.result
    parseJson()
  }
  reader.readAsText(file)
  if (fileInput.value) fileInput.value.value = ''
}

function parseJson() {
  if (!jsonText.value.trim()) {
    ElMessage.warning('请输入 JSON 数据')
    return
  }
  try {
    const data = JSON.parse(jsonText.value)
    let arr = []
    if (Array.isArray(data)) {
      arr = data
    } else if (typeof data === 'object' && data !== null) {
      arr = [data]
    } else {
      ElMessage.error('JSON 格式不支持，需要是数组或对象')
      return
    }

    if (arr.length === 0) {
      ElMessage.warning('数据为空')
      return
    }

    const filtered = arr.filter(item => typeof item === 'object' && item !== null && !Array.isArray(item))
    if (filtered.length === 0) {
      ElMessage.error('数组中没有有效的对象数据')
      return
    }

    const keySet = new Set()
    filtered.forEach(item => {
      Object.keys(item).forEach(k => {
        const v = item[k]
        if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          keySet.add(k)
        }
      })
    })

    columns.value = Array.from(keySet).map(k => ({ key: k, label: k, visible: true }))
    parsedData.value = filtered
    ElMessage.success(`解析成功，共 ${filtered.length} 条数据，${columns.value.length} 个字段`)
  } catch (err) {
    ElMessage.error('JSON 解析失败：' + err.message)
  }
}

function resetInput() {
  jsonText.value = ''
  parsedData.value = []
  columns.value = []
  fileName.value = ''
  sheetName.value = 'Sheet1'
}

function toggleColumn(key) {
  const col = columns.value.find(c => c.key === key)
  if (col) col.visible = !col.visible
}

function selectAllColumns() {
  columns.value.forEach(c => (c.visible = true))
}

function deselectAllColumns() {
  columns.value.forEach(c => (c.visible = false))
}

function editColumnName(col) {
  editingColumn.value = col
  editingLabel.value = col.label
  editDialogVisible.value = true
}

function confirmEditColumnName() {
  if (editingColumn.value) {
    editingColumn.value.label = editingLabel.value || editingColumn.value.key
  }
  editDialogVisible.value = false
}

function getDefaultFileName() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `export_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.xlsx`
}

function exportExcel() {
  if (visibleColumns.value.length === 0) {
    ElMessage.warning('请至少选择一列')
    return
  }

  const headers = visibleColumns.value.map(c => c.label)
  const rows = parsedData.value.map(row =>
    visibleColumns.value.map(c => {
      const v = row[c.key]
      return v === undefined || v === null ? '' : v
    })
  )

  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.value || 'Sheet1')

  const name = (fileName.value.trim() || getDefaultFileName())
  const finalName = name.endsWith('.xlsx') ? name : name + '.xlsx'
  XLSX.writeFile(wb, finalName)
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.json-to-excel {
  max-width: 1200px;
  margin: 0 auto;
}

.input-panel,
.preview-panel,
.export-panel {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.json-textarea :deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 13px;
}

.parse-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.column-selector {
  margin-bottom: 16px;
}

.column-selector-title {
  font-size: 14px;
  color: var(--content-text);
  margin-bottom: 8px;
}

.column-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.column-tag {
  cursor: pointer;
}

.column-tag-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
