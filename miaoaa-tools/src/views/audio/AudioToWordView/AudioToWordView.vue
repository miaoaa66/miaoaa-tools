<template>
  <div class="audio-to-word">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>语音转文字</span>
          <el-tag v-if="isListening" type="danger" size="small">识别中</el-tag>
          <el-tag v-else type="info" size="small">就绪</el-tag>
        </div>
      </template>

      <div v-if="!supported" class="unsupported">
        <el-alert type="error" :closable="false">
          当前浏览器不支持语音识别 API，请使用 Chrome 或 Edge 最新版本
        </el-alert>
      </div>

      <div v-else class="content">
        <el-input :model-value="word" type="textarea" :rows="6" placeholder="识别结果将显示在此处..." readonly />

        <div class="actions">
          <el-button type="primary" :icon="Microphone" :loading="isListening" @click="audioChangeWord">
            {{ isListening ? '语音识别中...' : '语音识别' }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Microphone } from '@element-plus/icons-vue'

const word = ref('')
const isListening = ref(false)
const supported = ref(true)

let recognition = null

function createRecognition() {
  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognitionImpl) {
    supported.value = false
    return null
  }
  return new SpeechRecognitionImpl()
}

function audioChangeWord() {
  // 正在识别时点击，先停止
  if (isListening.value) {
    stopRecognition()
    return
  }

  if (!recognition) {
    recognition = createRecognition()
    if (!recognition) return
  }

  word.value = ''
  recognition.lang = 'zh-CN'

  recognition.onresult = (event) => {
    const result = event.results[0][0].transcript
    word.value = result
  }

  recognition.onerror = (event) => {
    isListening.value = false
    ElMessage.error('监听语音失败：' + event.error)
  }

  recognition.onend = () => {
    isListening.value = false
  }

  try {
    recognition.start()
    isListening.value = true
  } catch (err) {
    ElMessage.error('无法启动语音识别：' + (err?.message || '未知错误'))
    isListening.value = false
  }
}

function stopRecognition() {
  if (recognition) {
    try {
      recognition.stop()
    } catch {
      // 可能已停止
    }
  }
  isListening.value = false
}

onBeforeUnmount(() => {
  stopRecognition()
})
</script>

<style scoped>
.audio-to-word {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.unsupported {
  padding: 20px 0;
}
</style>
