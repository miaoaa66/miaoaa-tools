<template>
  <div class="audio-crop">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>音频时长裁剪</span>
          <el-button v-if="audioBuffer" link type="primary" @click="reset">
            重置
          </el-button>
        </div>
      </template>

      <el-upload v-if="!audioBuffer" drag accept="audio/*" :auto-upload="false" :show-file-list="false"
        :on-change="onFileChange" class="uploader">
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          拖拽音频到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 mp3 / wav / ogg / m4a / flac 等格式，裁剪后保持原格式，全程在本地处理
          </div>
        </template>
      </el-upload>

      <div v-else class="content">
        <div class="meta-bar">
          <span>{{ fileName }} · {{ formatSize(fileSize) }}</span>
          <span>· 总时长 {{ formatTime(duration) }}</span>
          <span>· {{ (sampleRate / 1000).toFixed(1) }} kHz · {{ channelCount }} 声道</span>
        </div>

        <div v-if="decoding" class="loading">
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          <span>正在解码音频...</span>
        </div>

        <template v-else>
          <div class="crop-section">
            <div class="crop-header">
              <span>裁剪区间</span>
              <span class="crop-hint">
                {{ formatTime(startTime) }} ~ {{ formatTime(endTime) }}（共 {{ formatTime(cropDuration) }}）
              </span>
            </div>

            <div class="slider-row">
              <span class="slider-label">开始</span>
              <el-slider v-model="startTime" :min="0" :max="duration" :step="0.1" size="small"
                :format-tooltip="(v) => v.toFixed(1) + 's'" @input="syncRange" />
            </div>
            <div class="slider-row">
              <span class="slider-label">结束</span>
              <el-slider v-model="endTime" :min="0" :max="duration" :step="0.1" size="small"
                :format-tooltip="(v) => v.toFixed(1) + 's'" @input="syncRange" />
            </div>

            <div class="input-row">
              <div class="input-item">
                <span class="slider-label">开始（秒）</span>
                <el-input-number v-model="startTime" :min="0" :max="duration" :step="0.1" :precision="1"
                  size="small" controls-position="right" @change="syncRange" />
              </div>
              <div class="input-item">
                <span class="slider-label">结束（秒）</span>
                <el-input-number v-model="endTime" :min="0" :max="duration" :step="0.1" :precision="1"
                  size="small" controls-position="right" @change="syncRange" />
              </div>
            </div>
          </div>

          <div class="actions">
            <el-button :type="playing ? 'warning' : 'primary'" :icon="playing ? VideoPause : VideoPlay"
              :disabled="engineLoading || cropping" @click="togglePreview">
              {{ playing ? '停止试听' : '试听区间' }}
            </el-button>
            <el-button type="success" :icon="Download" :loading="engineLoading || cropping"
              @click="cropAndDownload">
              {{ engineLoading ? '正在加载处理引擎...' : '裁剪并下载' }}
            </el-button>
          </div>

          <div v-if="engineLoading || cropping" class="loading">
            <el-icon class="is-loading">
              <Loading />
            </el-icon>
            <span>
              {{ engineLoading ? '首次使用需加载音频处理引擎（约 30MB），请稍候...' : '正在裁剪，请稍候...' }}
            </span>
          </div>

          <p class="output-hint">
            输出保持原格式（如 mp3 裁剪后仍为 mp3），采用流复制模式，无重编码损失
          </p>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Loading, VideoPlay, VideoPause, Download } from '@element-plus/icons-vue'
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'

const fileName = ref('')
const fileSize = ref(0)
const rawFile = ref(null)
const audioBuffer = ref(null)
const sampleRate = ref(0)
const channelCount = ref(0)
const decoding = ref(false)
const startTime = ref(0)
const endTime = ref(0)
const playing = ref(false)
const engineLoading = ref(false)
const cropping = ref(false)

let audioCtx = null
let sourceNode = null
let ffmpegPromise = null

const duration = computed(() => audioBuffer.value?.duration || 0)
const cropDuration = computed(() => Math.max(0, endTime.value - startTime.value))

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = sec - m * 60
  const mm = String(m).padStart(2, '0')
  const ss = String(Math.floor(s)).padStart(2, '0')
  const ds = Math.floor((s - Math.floor(s)) * 10)
  return `${mm}:${ss}.${ds}`
}

// 保持 开始 ≤ 结束，区间始终非空
function syncRange() {
  const s = Math.min(startTime.value, endTime.value)
  const e = Math.max(startTime.value, endTime.value)
  startTime.value = s
  endTime.value = e
}

function onFileChange(uploadFile) {
  const raw = uploadFile?.raw ?? uploadFile
  pickFile(raw)
}

async function pickFile(file) {
  if (!file) return
  const isAudio = file.type.startsWith('audio/')
  if (!isAudio) {
    ElMessage.error('请选择音频文件')
    return
  }
  reset()
  fileName.value = file.name
  fileSize.value = file.size
  rawFile.value = file
  decoding.value = true
  try {
    const arrayBuffer = await file.arrayBuffer()
    const ctx = getAudioContext()
    const buffer = await ctx.decodeAudioData(arrayBuffer)
    audioBuffer.value = buffer
    sampleRate.value = buffer.sampleRate
    channelCount.value = buffer.numberOfChannels
    startTime.value = 0
    endTime.value = buffer.duration
    ElMessage.success('解码成功')
  } catch (err) {
    ElMessage.error('解码失败：' + (err?.message || '无法识别的音频格式'))
    reset()
  } finally {
    decoding.value = false
  }
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function togglePreview() {
  if (playing.value) {
    stopPreview()
    return
  }
  if (!audioBuffer.value || cropDuration.value <= 0) {
    ElMessage.warning('裁剪区间为空')
    return
  }
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  stopPreview()
  sourceNode = ctx.createBufferSource()
  sourceNode.buffer = audioBuffer.value
  sourceNode.connect(ctx.destination)
  sourceNode.onended = () => {
    sourceNode = null
    playing.value = false
  }
  sourceNode.start(0, startTime.value, cropDuration.value)
  playing.value = true
}

function stopPreview() {
  if (sourceNode) {
    try {
      sourceNode.stop()
    } catch {
      // 已停止时忽略
    }
    sourceNode.disconnect()
    sourceNode = null
  }
  playing.value = false
}

// 懒加载 ffmpeg：首次调用时下载并初始化 wasm 引擎，之后复用
function loadFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({ coreURL, wasmURL })
      return ffmpeg
    })()
  }
  return ffmpegPromise
}

async function cropAndDownload() {
  if (!rawFile.value) return
  if (cropDuration.value <= 0) {
    ElMessage.warning('裁剪区间为空')
    return
  }
  engineLoading.value = true
  cropping.value = true
  stopPreview()
  try {
    const ffmpeg = await loadFFmpeg()
    engineLoading.value = false

    const m = fileName.value.match(/\.([^.]+)$/)
    const ext = (m && m[1] ? m[1] : 'mp3').toLowerCase()
    const inputName = `input.${ext}`
    const outputName = `output.${ext}`
    const base = fileName.value.replace(/\.[^.]+$/, '') || 'audio'
    const downloadName = `${base}_${startTime.value.toFixed(1)}s-${endTime.value.toFixed(1)}s.${ext}`

    const data = new Uint8Array(await rawFile.value.arrayBuffer())
    await ffmpeg.writeFile(inputName, data)
    const code = await ffmpeg.exec([
      '-i', inputName,
      '-ss', String(startTime.value),
      '-to', String(endTime.value),
      '-c', 'copy',
      outputName,
    ])
    if (code !== 0) throw new Error(`ffmpeg 返回错误码 ${code}`)

    const output = await ffmpeg.readFile(outputName)
    const blob = new Blob([output], { type: rawFile.value.type })
    downloadBlob(blob, downloadName)
    ElMessage.success('裁剪完成，已下载（保持原格式）')
  } catch (err) {
    ElMessage.error('裁剪失败：' + (err?.message || '未知错误'))
  } finally {
    engineLoading.value = false
    cropping.value = false
  }
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function reset() {
  stopPreview()
  if (audioCtx) {
    audioCtx.close().catch(() => {})
    audioCtx = null
  }
  fileName.value = ''
  fileSize.value = 0
  rawFile.value = null
  audioBuffer.value = null
  sampleRate.value = 0
  channelCount.value = 0
  decoding.value = false
  startTime.value = 0
  endTime.value = 0
  cropping.value = false
  engineLoading.value = false
}

onBeforeUnmount(() => {
  stopPreview()
  if (audioCtx) {
    audioCtx.close().catch(() => {})
    audioCtx = null
  }
})
</script>

<style scoped>
.audio-crop {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.uploader {
  width: 100%;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meta-bar {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  color: var(--el-text-color-secondary);
}

.crop-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.crop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.crop-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-row .el-slider {
  flex: 1;
}

.slider-label {
  width: 34px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.input-row {
  display: flex;
  gap: 24px;
  margin-top: 4px;
}

.input-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-item .slider-label {
  width: auto;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.output-hint {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
