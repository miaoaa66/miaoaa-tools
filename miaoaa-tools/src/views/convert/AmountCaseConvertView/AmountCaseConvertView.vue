<template>
  <div class="amount-case-convert">
    <div class="input-area">
      <div class="card-header">
        <span>输入内容</span>
        <el-button v-if="inputText" link type="primary" @click="reset">重置</el-button>
      </div>
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="8"
        placeholder="请输入阿拉伯数字金额（如 12345.67）或大写中文金额（如 壹万贰仟叁佰肆拾伍元陆角柒分）"
      />
    </div>

    <div class="actions">
      <el-button type="primary" @click="toChinese">数字转大写</el-button>
      <el-button type="primary" @click="toArabic">大写转数字</el-button>
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
import { amountToChinese, chineseToAmount } from '@/utils/amountCase'

const inputText = ref('')
const outputText = ref('')
const copying = ref(false)

function toChinese() {
  if (!inputText.value) {
    ElMessage.warning('请输入内容')
    return
  }
  const result = amountToChinese(inputText.value.trim())
  if (!result) {
    ElMessage.warning('请输入有效的阿拉伯数字金额')
    return
  }
  outputText.value = result
}

function toArabic() {
  if (!inputText.value) {
    ElMessage.warning('请输入内容')
    return
  }
  const result = chineseToAmount(inputText.value.trim())
  if (!result) {
    ElMessage.warning('请输入有效的大写中文金额')
    return
  }
  outputText.value = result
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
.amount-case-convert {
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