<template>
  <div class="audio-crop">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>音频时长裁剪</span>
          <el-button v-if="fileName" link type="primary" @click="reset">
            重置
          </el-button>
        </div>
      </template>

      <el-upload
        v-if="!audioLoaded"
        drag
        accept="audio/*"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="onFileChange"
        class="uploader"
      >
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          拖拽音频到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 mp3 / wav / ogg / m4a / flac 等格式，裁剪后保持原格式，直接流复制，无重编码损失
          </div>
        </template>
      </el-upload>

      <div v-else class="content">
        <div class="meta-bar">
          <span>{{ fileName }} · {{ formatSize(fileSize) }}</span>
          <span v-if="duration">· 总时长 {{ formatTime(duration) }}</span>
          <span v-if="sampleRate">· {{ (sampleRate / 1000).toFixed(1) }} kHz{{ channelCount ? ' · ' + channelCount + ' 声道' : '' }}</span>
        </div>

        <div v-if="loadingMeta" class="loading">
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          <span>正在读取音频信息...</span>
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
              <el-slider
                v-model="startTime"
                :min="0"
                :max="duration"
                :step="0.1"
                size="small"
                :format-tooltip="(v) => v.toFixed(1) + 's'"
                @input="syncRange"
              />
            </div>
            <div class="slider-row">
              <span class="slider-label">结束</span>
              <el-slider
                v-model="endTime"
                :min="0"
                :max="duration"
                :step="0.1"
                size="small"
                :format-tooltip="(v) => v.toFixed(1) + 's'"
                @input="syncRange"
              />
            </div>

            <div class="input-row">
              <div class="input-item">
                <span class="slider-label">开始（秒）</span>
                <el-input-number
                  v-model="startTime"
                  :min="0"
                  :max="duration"
                  :step="0.1"
                  :precision="1"
                  size="small"
                  controls-position="right"
                  @change="syncRange"
                />
              </div>
              <div class="input-item">
                <span class="slider-label">结束（秒）</span>
                <el-input-number
                  v-model="endTime"
                  :min="0"
                  :max="duration"
                  :step="0.1"
                  :precision="1"
                  size="small"
                  controls-position="right"
                  @change="syncRange"
                />
              </div>
            </div>
          </div>

          <div class="actions">
            <el-button
              :type="playing ? 'warning' : 'primary'"
              :icon="playing ? VideoPause : VideoPlay"
              :disabled="cropping"
              @click="togglePreview"
            >
              {{ playing ? '停止试听' : '试听区间' }}
            </el-button>
            <el-button type="success" :icon="Download" :loading="cropping" @click="cropAndDownload">
              裁剪并下载
            </el-button>
          </div>

          <div v-if="cropping" class="loading">
            <el-icon class="is-loading">
              <Loading />
            </el-icon>
            <span>正在裁剪，请稍候...</span>
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
import {
  Input,
  Output,
  Conversion,
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Mp3OutputFormat,
  WavOutputFormat,
  FlacOutputFormat,
  OggOutputFormat,
} from 'mediabunny'
import { registerMp3Encoder } from '@mediabunny/mp3-encoder'

registerMp3Encoder()

const fileName = ref('')
const fileSize = ref(0)
const rawFile = ref(null)
const audioLoaded = ref(false)
const loadingMeta = ref(false)

const duration = ref(0)
const sampleRate = ref(0)
const channelCount = ref(0)

const startTime = ref(0)
const endTime = ref(0)
const playing = ref(false)
const cropping = ref(false)

let audioCtx = null
let sourceNode = null

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

function syncRange() {
  const s = Math.min(startTime.value, endTime.value)
  const e = Math.max(startTime.value, endTime.value)
  startTime.value = s
  endTime.value = e
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

async function onFileChange(uploadFile) {
  const raw = uploadFile?.raw ?? uploadFile
  await pickFile(raw)
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
  loadingMeta.value = true
  try {
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    })

    duration.value = await input.computeDuration()
    const audioTrack = await input.getPrimaryAudioTrack()
    if (audioTrack) {
      sampleRate.value = await audioTrack.getSampleRate()
      channelCount.value = await audioTrack.getNumberOfChannels()
    }
    startTime.value = 0
    endTime.value = duration.value
    audioLoaded.value = true
    ElMessage.success('读取成功')
  } catch (err) {
    ElMessage.error('读取失败：' + (err?.message || '无法识别的音频格式'))
    reset()
  } finally {
    loadingMeta.value = false
  }
}

function togglePreview() {
  if (playing.value) {
    stopPreview()
    return
  }
  if (!rawFile.value || cropDuration.value <= 0) {
    ElMessage.warning('裁剪区间为空')
    return
  }
  playPreview()
}

async function playPreview() {
  stopPreview()
  try {
    const arrayBuffer = await rawFile.value.arrayBuffer()
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') await ctx.resume()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    sourceNode = ctx.createBufferSource()
    sourceNode.buffer = audioBuffer
    sourceNode.connect(ctx.destination)
    sourceNode.onended = () => {
      sourceNode = null
      playing.value = false
    }
    sourceNode.start(0, startTime.value, cropDuration.value)
    playing.value = true
  } catch (err) {
    ElMessage.error('试听失败：' + (err?.message || '未知错误'))
    playing.value = false
  }
}

function stopPreview() {
  if (sourceNode) {
    try {
      sourceNode.stop()
    } catch {
      // already stopped
    }
    sourceNode.disconnect()
    sourceNode = null
  }
  playing.value = false
}

function getOutputFormat(fileName) {
  const ext = (fileName.match(/\.([^.]+)$/)?.[1] || '').toLowerCase()
  switch (ext) {
    case 'mp3':
      return { format: new Mp3OutputFormat(), ext: 'mp3', mime: 'audio/mpeg' }
    case 'wav':
    case 'wave':
      return { format: new WavOutputFormat(), ext: 'wav', mime: 'audio/wav' }
    case 'flac':
      return { format: new FlacOutputFormat(), ext: 'flac', mime: 'audio/flac' }
    case 'ogg':
      return { format: new OggOutputFormat(), ext: 'ogg', mime: 'audio/ogg' }
    default:
      return { format: new Mp3OutputFormat(), ext: 'mp3', mime: 'audio/mpeg' }
  }
}

function sanitizeTrim(trim) {
  const start = Math.max(0, trim.start)
  const end = Math.max(start + 0.05, trim.end)
  return { start, end }
}

async function tryCrop(file, output, trim) {
  const sanitized = sanitizeTrim(trim)
  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  })

  const conversion = await Conversion.init({ input, output, trim: sanitized })

  if (!conversion.isValid) {
    return { success: false, conversion }
  }

  conversion.onProgress = () => {}

  await conversion.execute()
  return { success: true, conversion }
}

async function cropAndDownload() {
  if (!rawFile.value) return
  if (cropDuration.value <= 0) {
    ElMessage.warning('裁剪区间为空')
    return
  }

  cropping.value = true
  stopPreview()
  try {
    const trim = {
      start: startTime.value,
      end: endTime.value,
    }

    const { format: outputFormat, ext, mime } = getOutputFormat(fileName.value)

    const output = new Output({
      format: outputFormat,
      target: new BufferTarget(),
    })

    const result = await tryCrop(rawFile.value, output, trim)

    if (result.success) {
      const blob = new Blob([output.target.buffer], { type: mime })
      downloadBlob(blob, ext)
      ElMessage.success(`裁剪完成，已下载 ${ext.toUpperCase()} 格式`)
    } else {
      ElMessage.warning(`当前环境不支持导出 ${ext.toUpperCase()}，已自动降级为 WAV 格式`)

      const wavOutput = new Output({
        format: new WavOutputFormat(),
        target: new BufferTarget(),
      })

      const wavResult = await tryCrop(rawFile.value, wavOutput, trim)

      if (wavResult.success) {
        const blob = new Blob([wavOutput.target.buffer], { type: 'audio/wav' })
        downloadBlob(blob, 'wav')
        ElMessage.success('裁剪完成，已下载 WAV 格式')
      } else {
        ElMessage.error('裁剪失败：当前浏览器不支持所需的音频编码')
      }
    }
  } catch (err) {
    ElMessage.error('裁剪失败：' + (err?.message || '未知错误'))
  } finally {
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
  audioLoaded.value = false
  duration.value = 0
  sampleRate.value = 0
  channelCount.value = 0
  loadingMeta.value = false
  startTime.value = 0
  endTime.value = 0
  cropping.value = false
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
