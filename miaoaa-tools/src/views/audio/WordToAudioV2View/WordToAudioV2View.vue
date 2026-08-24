<template>
  <div class="word-to-audio-v2">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文字转语音（文本跟随朗读变色）</span>
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
          maxlength="400"
          rows="4"
          :readonly="inputReadonly"
          show-word-limit
          @input="inputWord"
        />

        <div class="highlight-panel">
          <div v-if="word === ''" class="empty-text">暂无文本</div>
          <div v-else>
            <div class="highlighted-text">{{ highlightedText }}</div>
            <div>{{ normalText }}</div>
          </div>
        </div>

        <div class="actions">
          <el-button type="primary" :disabled="!word.trim() || inputReadonly" @click="changeToAudio">转为语音</el-button>
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
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const word = ref('')
const isPaused = ref(false)
const isSpeaking = ref(false)
const speakIndex = ref(0) // 朗读了多少文本的下标
const highlightedText = ref('') // 需要变色的文本
const normalText = ref('') // 正常文本
const inputReadonly = ref(false)

const supported = ref(typeof window !== 'undefined' && 'speechSynthesis' in window)

// 监听朗读下标变化，更新变色文本
watch(speakIndex, (newValue) => {
  changeTextColorV2(newValue)
})

function inputWord() {
  cancel()
}

// 转为语音
function changeToAudio() {
  if (!word.value) {
    ElMessage.warning('请输入文本')
    return
  }
  if (isPaused.value) {
    if (window.speechSynthesis.speaking) {
      ElMessage.warning('当前语音已暂停，请点击继续!')
      return
    } else {
      isPaused.value = false
      cancel()
    }
  } else if (window.speechSynthesis.speaking) {
    ElMessage.warning('当前已有正在播放的语音!')
    return
  }

  // 初始化朗读下标
  speakIndex.value = 0
  // 为了防止在暂停状态下转语音，调用前设置继续播放
  window.speechSynthesis.resume()

  const speech = new SpeechSynthesisUtterance()
  speech.text = word.value // 内容
  speech.lang = 'zh-cn' // 语言
  speech.voiceURI = 'Microsoft Huihui - Chinese (Simplified, PRC)' // 声音和服务
  speech.volume = 0.7 // 音量 0~1
  speech.rate = 1 // 语速 0.1~10
  speech.pitch = 1 // 音高 0~2

  // 设置不可输入input
  inputReadonly.value = true

  speech.onstart = () => {
    isSpeaking.value = true
    isPaused.value = false
  }

  // 监听朗读边界事件，更新已朗读文本下标
  speech.onboundary = (event) => {
    speakIndex.value = event.charIndex
  }

  speech.onend = () => {
    isSpeaking.value = false
    isPaused.value = false
    inputReadonly.value = false
    highlightedText.value = word.value
    normalText.value = ''
  }

  speech.onerror = () => {
    isSpeaking.value = false
    isPaused.value = false
    inputReadonly.value = false
  }

  window.speechSynthesis.speak(speech)
}

// 暂停
function pause() {
  isPaused.value = true
  inputReadonly.value = false
  window.speechSynthesis.pause()
}

// 继续
function resume() {
  isPaused.value = false
  window.speechSynthesis.resume()
  if (window.speechSynthesis.speaking) {
    inputReadonly.value = true
  } else {
    inputReadonly.value = false
  }
}

// 取消
function cancel() {
  speakIndex.value = 0
  inputReadonly.value = false
  isPaused.value = false
  isSpeaking.value = false
  highlightedText.value = ''
  normalText.value = word.value
  window.speechSynthesis.cancel()
}

function getvoice() {
  console.log(window.speechSynthesis.getVoices())
}

// 通过拆分文本实现变色
function changeTextColorV2(index) {
  const text = word.value
  const highlighted = text.slice(0, index)
  const normal = text.slice(index)
  highlightedText.value = highlighted
  normalText.value = normal
}
</script>

<style scoped>
.word-to-audio-v2 {
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

.highlight-panel {
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.8;
  word-break: break-all;
}

.highlighted-text {
  color: coral;
  display: inline;
}

.empty-text {
  color: var(--el-text-color-secondary);
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
