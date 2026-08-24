<template>
  <div class="timestamp-convert">
    <div class="card">
      <div class="card-header">
        <span>时间戳 → 日期时间</span>
      </div>
      <div class="form-row">
        <el-input v-model="tsInput" placeholder="请输入时间戳（秒或毫秒）" @input="onTsInput" />
        <el-button type="primary" @click="tsToDate">转换</el-button>
      </div>
      <div class="result-row" v-if="tsResult">
        <el-input :model-value="tsResult" readonly>
          <template #append>
            <el-button @click="copyText(tsResult)">复制</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span>日期时间 → 时间戳</span>
      </div>
      <div class="form-row">
        <el-date-picker
          v-model="dateValue"
          type="datetime"
          placeholder="选择日期时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          @change="onDateChange"
        />
        <el-button type="primary" @click="dateToTs">转换</el-button>
      </div>
      <div class="result-group" v-if="dateTsResult">
        <div class="result-item">
          <span class="result-label">秒时间戳</span>
          <el-input :model-value="dateTsResult.seconds" readonly>
            <template #append>
              <el-button @click="copyText(dateTsResult.seconds)">复制</el-button>
            </template>
          </el-input>
        </div>
        <div class="result-item">
          <span class="result-label">毫秒时间戳</span>
          <el-input :model-value="dateTsResult.milliseconds" readonly>
            <template #append>
              <el-button @click="copyText(dateTsResult.milliseconds)">复制</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span>当前时间</span>
      </div>
      <div class="now-row">
        <span class="now-label">日期时间</span>
        <span class="now-value">{{ now.datetime }}</span>
      </div>
      <div class="now-row">
        <span class="now-label">秒时间戳</span>
        <span class="now-value">{{ now.seconds }}</span>
      </div>
      <div class="now-row">
        <span class="now-label">毫秒时间戳</span>
        <span class="now-value">{{ now.milliseconds }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const tsInput = ref('')
const tsResult = ref('')
const dateValue = ref('')
const dateTsResult = ref(null)

const now = reactive({
  datetime: '',
  seconds: '',
  milliseconds: '',
})

let timer = null

function updateNow() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  now.datetime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  now.seconds = String(Math.floor(d.getTime() / 1000))
  now.milliseconds = String(d.getTime())
}

onMounted(() => {
  updateNow()
  timer = setInterval(updateNow, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

function onTsInput() {
  tsResult.value = ''
}

function tsToDate() {
  const raw = tsInput.value.trim()
  if (!raw) {
    ElMessage.warning('请输入时间戳')
    return
  }
  const num = Number(raw)
  if (!Number.isFinite(num)) {
    ElMessage.warning('请输入有效的时间戳数字')
    return
  }
  // 自动判断秒/毫秒：13位及以上按毫秒，否则按秒
  const ms = raw.length >= 13 ? num : num * 1000
  const d = new Date(ms)
  if (isNaN(d.getTime())) {
    ElMessage.warning('无效的时间戳')
    return
  }
  const pad = (n) => String(n).padStart(2, '0')
  tsResult.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function onDateChange() {
  dateTsResult.value = null
}

function dateToTs() {
  if (!dateValue.value) {
    ElMessage.warning('请选择日期时间')
    return
  }
  const ms = new Date(dateValue.value).getTime()
  if (isNaN(ms)) {
    ElMessage.warning('无效的日期时间')
    return
  }
  dateTsResult.value = {
    seconds: String(Math.floor(ms / 1000)),
    milliseconds: String(ms),
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
}
</script>

<style scoped>
.timestamp-convert {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
}

.card-header {
  font-weight: 600;
  margin-bottom: 14px;
  font-size: 15px;
}

.form-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.form-row .el-input {
  flex: 1;
}

.form-row .el-date-editor {
  flex: 1;
}

.result-row {
  margin-top: 12px;
}

.result-group {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-label {
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-secondary);
  width: 80px;
  flex-shrink: 0;
}

.result-item .el-input {
  flex: 1;
}

.now-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.now-label {
  font-size: 13px;
  color: var(--text-secondary);
  width: 80px;
  flex-shrink: 0;
}

.now-value {
  font-family: monospace;
  font-size: 14px;
}
</style>