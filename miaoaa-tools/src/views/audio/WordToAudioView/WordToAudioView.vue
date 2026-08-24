<template>
  <div class="word-to-audio">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文字转语音</span>
          <el-tag v-if="isSpeaking" type="success" size="small">播放中</el-tag>
          <el-tag v-else-if="isPaused" type="warning" size="small">已暂停</el-tag>
          <el-tag v-else type="info" size="small">就绪</el-tag>
        </div>
      </template>

      <div v-if="!supported" class="unsupported">
        <el-alert type="error" :closable="false">
          当前浏览器不支持 Web Speech API，请使用 Chrome、Edge 或 Safari 最新版本
        </el-alert>
      </div>

      <div v-else class="content">
        <el-input
          v-model="word"
          type="textarea"
          placeholder="请输入文本"
          maxlength="300"
          rows="4"
          show-word-limit
        />

        <div class="actions">
          <el-button type="primary" :disabled="!word.trim()" @click="changeToAudio">转为语音</el-button>
        </div>

        <div class="actions">
          <el-button type="warning" :disabled="!isSpeaking || isPaused" @click="pause">暂停</el-button>
          <el-button type="success" :disabled="!isPaused" @click="resume">继续</el-button>
          <el-button type="info" :disabled="!isSpeaking && !isPaused" @click="cancel">取消</el-button>
        </div>

        <div class="actions">
          <el-button type="primary" plain @click="getvoice">获取语音合成数据(F12)</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const word = ref('')
const isPaused = ref(false)
const isSpeaking = ref(false)

const supported = ref(typeof window !== 'undefined' && 'speechSynthesis' in window)

function changeToAudio() {
  if (!word.value) {
    ElMessage.warning('请输入文本')
    return
  }

  if (isPaused.value) {
    ElMessage.warning('当前语音已暂停，请点击继续!')
    return
  } else if (window.speechSynthesis.speaking) {
    ElMessage.warning('当前已有正在播放的语音!')
    return
  }

  // 为了防止在暂停状态下转语音，调用前设置继续播放
  window.speechSynthesis.resume()

  const speech = new SpeechSynthesisUtterance()
  speech.text = word.value // 内容
  speech.lang = 'zh-cn' // 语言
  speech.voiceURI = 'Microsoft Huihui - Chinese (Simplified, PRC)' // 声音和服务
  speech.volume = 0.7 // 音量 0~1
  speech.rate = 1 // 语速 0.1~10
  speech.pitch = 1 // 音高 0~2

  speech.onstart = () => {
    isSpeaking.value = true
    isPaused.value = false
  }
  speech.onend = () => {
    isSpeaking.value = false
    isPaused.value = false
  }
  speech.onerror = () => {
    isSpeaking.value = false
    isPaused.value = false
  }

  window.speechSynthesis.speak(speech)
}

// 暂停
function pause() {
  isPaused.value = true
  window.speechSynthesis.pause()
}

// 继续
function resume() {
  isPaused.value = false
  window.speechSynthesis.resume()
}

// 取消
function cancel() {
  isPaused.value = false
  isSpeaking.value = false
  window.speechSynthesis.cancel()
}

function getvoice() {
  console.log(window.speechSynthesis.getVoices())
}
</script>

<style scoped>
.word-to-audio {
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
