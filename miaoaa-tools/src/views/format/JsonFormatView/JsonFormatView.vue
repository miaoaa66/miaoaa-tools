<template>
  <div class="json-format">
    <div class="mode-bar">
      <span class="mode-label">缩进：</span>
      <el-radio-group v-model="indentMode" size="small">
        <el-radio-button value="2">2 空格</el-radio-button>
        <el-radio-button value="4">4 空格</el-radio-button>
        <el-radio-button value="tab">Tab</el-radio-button>
      </el-radio-group>
    </div>

    <el-card class="panel">
      <template #header>
        <div class="card-header">
          <span>JSON 格式化</span>
          <el-button
            v-if="input || output !== null"
            link
            type="primary"
            @click="reset"
          >
            重置
          </el-button>
        </div>
      </template>

      <el-input
        v-model="input"
        type="textarea"
        :rows="10"
        placeholder="输入需要格式化的 JSON 文本"
      />

      <div class="actions">
        <div class="action-left">
          <el-button type="primary" @click="doFormat">格式化</el-button>
          <el-button @click="doMinify">压缩</el-button>
        </div>
        <el-button
          :disabled="!output"
          :loading="copying"
          type="success"
          link
          @click="copy"
        >
          复制结果
        </el-button>
      </div>

      <el-input
        v-if="output !== null"
        :model-value="output"
        type="textarea"
        :rows="12"
        readonly
        placeholder="格式化结果"
        class="result-textarea"
      />
      <div v-if="error" class="error-tip">{{ error }}</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const indentMode = ref('2')
const indent = computed(() =>
  indentMode.value === 'tab' ? '\t' : Number(indentMode.value)
)
const input = ref('')
const output = ref(null)
const error = ref('')
const copying = ref(false)

function parseInput() {
  const text = input.value.trim()
  if (!text) {
    ElMessage.warning('请输入需要格式化的 JSON 文本')
    return null
  }
  try {
    return JSON.parse(text)
  } catch (err) {
    error.value = '解析失败：' + (err?.message || '不是合法的 JSON')
    output.value = ''
    return null
  }
}

function doFormat() {
  error.value = ''
  const obj = parseInput()
  if (obj === null) return
  try {
    output.value = JSON.stringify(obj, null, indent.value)
  } catch (err) {
    output.value = ''
    error.value = '格式化失败：' + (err?.message || '未知错误')
  }
}

function doMinify() {
  error.value = ''
  const obj = parseInput()
  if (obj === null) return
  try {
    output.value = JSON.stringify(obj)
  } catch (err) {
    output.value = ''
    error.value = '压缩失败：' + (err?.message || '未知错误')
  }
}

function reset() {
  input.value = ''
  output.value = null
  error.value = ''
}

async function copy() {
  if (!output.value) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(output.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  } finally {
    copying.value = false
  }
}
</script>

<style scoped>
.json-format {
  max-width: 1200px;
  margin: 0 auto;
}

.mode-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.mode-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-left {
  display: flex;
  gap: 8px;
}

.result-textarea {
  margin-top: 12px;
}

.result-textarea :deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 12px;
}

.error-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-danger);
}
</style>
