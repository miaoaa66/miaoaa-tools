<template>
  <div class="case-convert">
    <div class="input-area">
      <div class="card-header">
        <span>输入文本</span>
        <el-button
          v-if="inputText"
          link
          type="primary"
          @click="reset"
        >
          重置
        </el-button>
      </div>
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="8"
        placeholder="请输入需要转换大小写的文本"
      />
    </div>

    <div class="actions">
      <el-button type="primary" @click="toUpperCase">转大写</el-button>
      <el-button type="primary" @click="toLowerCase">转小写</el-button>
    </div>

    <div class="output-area">
      <div class="card-header">
        <span>转换结果</span>
        <el-button
          v-if="outputText"
          :loading="copying"
          type="success"
          link
          @click="copyResult"
        >
          复制结果
        </el-button>
      </div>
      <el-input
        :model-value="outputText"
        type="textarea"
        :rows="8"
        readonly
        placeholder="转换结果"
        class="result-textarea"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const inputText = ref('')
const outputText = ref('')
const copying = ref(false)

function toUpperCase() {
  if (!inputText.value) {
    ElMessage.warning('请输入文本')
    return
  }
  outputText.value = inputText.value.toUpperCase()
}

function toLowerCase() {
  if (!inputText.value) {
    ElMessage.warning('请输入文本')
    return
  }
  outputText.value = inputText.value.toLowerCase()
}

function reset() {
  inputText.value = ''
  outputText.value = ''
}

async function copyResult() {
  if (!outputText.value) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(outputText.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  } finally {
    copying.value = false
  }
}
</script>

<style scoped>
.case-convert {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 12px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 16px 0;
}

.output-area {
  margin-top: 0;
}

.result-textarea :deep(.el-textarea__inner) {
  font-family: monospace;
}
</style>