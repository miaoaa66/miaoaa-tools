<template>
  <div class="url-encode">
    <div class="mode-bar">
      <span class="mode-label">编码方式：</span>
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="encodeURI">encodeURI / decodeURI</el-radio-button>
        <el-radio-button value="encodeURIComponent">encodeURIComponent / decodeURIComponent</el-radio-button>
      </el-radio-group>
    </div>

    <div class="panels">
      <!-- 编码 -->
      <el-card class="panel">
        <template #header>
          <div class="card-header">
            <span>编码（原文 → URL）</span>
            <el-button
              v-if="encodeInput || encodeOutput"
              link
              type="primary"
              @click="resetEncode"
            >
              重置
            </el-button>
          </div>
        </template>

        <el-input
          v-model="encodeInput"
          type="textarea"
          :rows="6"
          placeholder="输入需要编码的文本"
        />
        <div class="actions">
          <el-button type="primary" @click="doEncode">编码</el-button>
          <el-button
            :disabled="!encodeOutput"
            :loading="copyingEncode"
            type="success"
            link
            @click="copyEncode"
          >
            复制结果
          </el-button>
        </div>
        <el-input
          v-if="encodeOutput !== null"
          :model-value="encodeOutput"
          type="textarea"
          :rows="6"
          readonly
          placeholder="编码结果"
          class="result-textarea"
        />
        <div v-if="encodeError" class="error-tip">{{ encodeError }}</div>
      </el-card>

      <!-- 解码 -->
      <el-card class="panel">
        <template #header>
          <div class="card-header">
            <span>解码（URL → 原文）</span>
            <el-button
              v-if="decodeInput || decodeOutput"
              link
              type="primary"
              @click="resetDecode"
            >
              重置
            </el-button>
          </div>
        </template>

        <el-input
          v-model="decodeInput"
          type="textarea"
          :rows="6"
          placeholder="输入需要解码的 URL 编码字符串"
        />
        <div class="actions">
          <el-button type="primary" @click="doDecode">解码</el-button>
          <el-button
            :disabled="!decodeOutput"
            :loading="copyingDecode"
            type="success"
            link
            @click="copyDecode"
          >
            复制结果
          </el-button>
        </div>
        <el-input
          v-if="decodeOutput !== null"
          :model-value="decodeOutput"
          type="textarea"
          :rows="6"
          readonly
          placeholder="解码结果"
          class="result-textarea"
        />
        <div v-if="decodeError" class="error-tip">{{ decodeError }}</div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const mode = ref('encodeURI')

// ============ 编码 ============
const encodeInput = ref('')
const encodeOutput = ref(null)
const encodeError = ref('')
const copyingEncode = ref(false)

function doEncode() {
  const text = encodeInput.value
  if (!text) {
    ElMessage.warning('请输入需要编码的文本')
    return
  }
  encodeError.value = ''
  try {
    encodeOutput.value =
      mode.value === 'encodeURI' ? encodeURI(text) : encodeURIComponent(text)
  } catch (err) {
    encodeOutput.value = ''
    encodeError.value = '编码失败：' + (err?.message || '未知错误')
  }
}

function resetEncode() {
  encodeInput.value = ''
  encodeOutput.value = null
  encodeError.value = ''
}

async function copyEncode() {
  if (!encodeOutput.value) return
  copyingEncode.value = true
  try {
    await navigator.clipboard.writeText(encodeOutput.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  } finally {
    copyingEncode.value = false
  }
}

// ============ 解码 ============
const decodeInput = ref('')
const decodeOutput = ref(null)
const decodeError = ref('')
const copyingDecode = ref(false)

function doDecode() {
  const text = decodeInput.value.trim()
  if (!text) {
    ElMessage.warning('请输入需要解码的字符串')
    return
  }
  decodeError.value = ''
  try {
    decodeOutput.value =
      mode.value === 'encodeURI' ? decodeURI(text) : decodeURIComponent(text)
  } catch (err) {
    decodeOutput.value = ''
    decodeError.value = '解码失败：字符串可能不是合法的 URL 编码'
  }
}

function resetDecode() {
  decodeInput.value = ''
  decodeOutput.value = null
  decodeError.value = ''
}

async function copyDecode() {
  if (!decodeOutput.value) return
  copyingDecode.value = true
  try {
    await navigator.clipboard.writeText(decodeOutput.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  } finally {
    copyingDecode.value = false
  }
}
</script>

<style scoped>
.url-encode {
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

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

@media (max-width: 860px) {
  .panels {
    grid-template-columns: 1fr;
  }
}
</style>
