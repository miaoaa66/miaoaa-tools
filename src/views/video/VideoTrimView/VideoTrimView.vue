<template>
  <div class="video-trim">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>视频时长裁剪</span>
          <el-button v-if="fileName" link type="primary" @click="reset">
            重置
          </el-button>
        </div>
      </template>

      <el-upload
        v-if="!fileName"
        drag
        accept="video/*"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="onFileChange"
        class="uploader"
      >
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          拖拽视频到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 MP4 / WebM / MOV / MKV 等格式，直接流复制裁剪，速度快无质量损失
          </div>
        </template>
      </el-upload>

      <div v-else class="content">
        <video
          ref="videoRef"
          :src="videoUrl"
          :controls="!trimming"
          playsinline
          class="preview"
          @loadedmetadata="onLoadedMeta"
          @timeupdate="onTimeUpdate"
          @ended="onEnded"
        ></video>

        <div class="meta-bar">
          <span>{{ fileName }} · {{ formatSize(fileSize) }}</span>
          <span v-if="duration">· 总时长 {{ formatTime(duration) }}</span>
          <span v-if="videoWidth">· {{ videoWidth }}×{{ videoHeight }}</span>
        </div>

        <div class="trim-panel">
          <div ref="barRef" class="timeline" @click="onBarClick">
            <div class="timeline-range" :style="rangeStyle"></div>
            <div class="timeline-head" :style="headStyle"></div>
          </div>
          <div class="timeline-scale">
            <span>开始 {{ formatTime(startTime) }}</span>
            <span>预览 {{ formatTime(currentTime) }}</span>
            <span>结束 {{ formatTime(endTime) }}</span>
          </div>

          <el-form label-width="84px" inline class="trim-form">
            <el-form-item label="开始时间">
              <el-input-number
                v-model="startTime"
                :min="0"
                :max="endTime"
                :step="0.1"
                :precision="1"
                controls-position="right"
                style="width: 140px"
              />
              <el-button size="small" @click="setStartFromCurrent">设为当前</el-button>
            </el-form-item>
            <el-form-item label="结束时间">
              <el-input-number
                v-model="endTime"
                :min="startTime"
                :max="duration"
                :step="0.1"
                :precision="1"
                controls-position="right"
                style="width: 140px"
              />
              <el-button size="small" @click="setEndFromCurrent">设为当前</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="actions">
          <el-button type="primary" :loading="trimming" :disabled="trimming" @click="startTrim">
            裁剪并下载
          </el-button>
          <span v-if="trimming" class="trim-progress">
            <el-icon class="is-loading">
              <Loading />
            </el-icon>
            正在裁剪...
          </span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Loading } from '@element-plus/icons-vue'
import {
  Input,
  Output,
  Conversion,
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Mp4OutputFormat,
  WebMOutputFormat,
  MovOutputFormat,
  MkvOutputFormat,
} from 'mediabunny'
import { registerMp3Encoder } from '@mediabunny/mp3-encoder'

registerMp3Encoder()

const fileName = ref('')
const fileSize = ref(0)
const rawFile = ref(null)
const videoUrl = ref('')
const videoRef = ref(null)
const barRef = ref(null)

const duration = ref(0)
const videoWidth = ref(0)
const videoHeight = ref(0)

const startTime = ref(0)
const endTime = ref(0)
const currentTime = ref(0)

const trimming = ref(false)

const trimDuration = computed(() => Math.max(0, endTime.value - startTime.value))

const startPct = computed(() => (duration.value ? (startTime.value / duration.value) * 100 : 0))
const endPct = computed(() => (duration.value ? (endTime.value / duration.value) * 100 : 100))
const playPct = computed(() => (duration.value ? (currentTime.value / duration.value) * 100 : 0))
const rangeStyle = computed(() => ({
  left: startPct.value + '%',
  width: Math.max(0, endPct.value - startPct.value) + '%',
}))
const headStyle = computed(() => ({ left: playPct.value + '%' }))

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '00:00'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function reset() {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  fileName.value = ''
  fileSize.value = 0
  rawFile.value = null
  videoUrl.value = ''
  duration.value = 0
  videoWidth.value = 0
  videoHeight.value = 0
  startTime.value = 0
  endTime.value = 0
  currentTime.value = 0
}

function onFileChange(uploadFile) {
  const raw = uploadFile?.raw ?? uploadFile
  pickFile(raw)
}

function pickFile(file) {
  if (!file) return
  if (!file.type.startsWith('video/')) {
    ElMessage.error('请选择视频文件')
    return
  }
  reset()
  fileName.value = file.name
  fileSize.value = file.size
  rawFile.value = file
  videoUrl.value = URL.createObjectURL(file)
}

function onLoadedMeta() {
  const v = videoRef.value
  if (!v) return
  duration.value = v.duration || 0
  videoWidth.value = v.videoWidth
  videoHeight.value = v.videoHeight
  endTime.value = duration.value
}

function onTimeUpdate() {
  const v = videoRef.value
  if (!v) return
  currentTime.value = v.currentTime
}

function onEnded() {
  currentTime.value = duration.value
}

function onBarClick(e) {
  const bar = barRef.value
  if (!bar || !duration.value) return
  const rect = bar.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  const t = Math.min(duration.value, Math.max(0, ratio * duration.value))
  seekTo(t)
}

function seekTo(t) {
  const v = videoRef.value
  if (!v) return
  v.currentTime = Math.min(duration.value, Math.max(0, t))
}

function setStartFromCurrent() {
  if (currentTime.value >= endTime.value) {
    ElMessage.warning('开始时间需早于结束时间')
    return
  }
  startTime.value = currentTime.value
}

function setEndFromCurrent() {
  if (currentTime.value <= startTime.value) {
    ElMessage.warning('结束时间需晚于开始时间')
    return
  }
  endTime.value = currentTime.value
}

function downloadBlob(blob, ext) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const base = fileName.value.replace(/\.[^.]+$/, '') || 'video'
  const st = Math.round(startTime.value)
  const et = Math.round(endTime.value)
  a.download = `${base}_${pad(st)}-${pad(et)}s.${ext}`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function getOutputFormat(fileName) {
  const ext = (fileName.match(/\.([^.]+)$/)?.[1] || '').toLowerCase()
  switch (ext) {
    case 'mp4':
    case 'm4v':
      return { format: new Mp4OutputFormat(), ext: 'mp4', mime: 'video/mp4' }
    case 'webm':
      return { format: new WebMOutputFormat(), ext: 'webm', mime: 'video/webm' }
    case 'mov':
      return { format: new MovOutputFormat(), ext: 'mov', mime: 'video/quicktime' }
    case 'mkv':
      return { format: new MkvOutputFormat(), ext: 'mkv', mime: 'video/x-matroska' }
    default:
      return { format: new Mp4OutputFormat(), ext: 'mp4', mime: 'video/mp4' }
  }
}

function sanitizeTrim(trim) {
  const start = Math.max(0, trim.start)
  const end = Math.max(start + 0.05, trim.end)
  return { start, end }
}

async function tryTrim(file, output, trim) {
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

async function startTrim() {
  if (!rawFile.value) return
  if (trimDuration.value < 0.1) {
    ElMessage.warning('请先设置有效的裁剪区间')
    return
  }

  trimming.value = true
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

    const result = await tryTrim(rawFile.value, output, trim)

    if (result.success) {
      const blob = new Blob([output.target.buffer], { type: mime })
      downloadBlob(blob, ext)
      ElMessage.success(`裁剪完成，已导出 ${ext.toUpperCase()} 格式`)
    } else {
      ElMessage.warning(`当前环境不支持导出 ${ext.toUpperCase()}，已自动降级为 MP4 格式`)

      const mp4Output = new Output({
        format: new Mp4OutputFormat(),
        target: new BufferTarget(),
      })

      const mp4Result = await tryTrim(rawFile.value, mp4Output, trim)

      if (mp4Result.success) {
        const blob = new Blob([mp4Output.target.buffer], { type: 'video/mp4' })
        downloadBlob(blob, 'mp4')
        ElMessage.success('裁剪完成，已下载 MP4 格式')
      } else {
        ElMessage.error('裁剪失败：当前浏览器不支持所需的视频编码')
      }
    }
  } catch (err) {
    ElMessage.error('裁剪失败：' + (err?.message || '未知错误'))
  } finally {
    trimming.value = false
  }
}

onBeforeUnmount(() => {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
})
</script>

<style scoped>
.video-trim {
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

.preview {
  width: 100%;
  max-height: 420px;
  background: #000;
  border-radius: 6px;
}

.meta-bar {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.trim-panel {
  background: var(--panel-bg);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline {
  position: relative;
  height: 24px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
}

.timeline-range {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(64, 158, 255, 0.3);
  border-left: 2px solid var(--el-color-primary);
  border-right: 2px solid var(--el-color-primary);
}

.timeline-head {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: #ffffff;
  border: 1px solid var(--el-color-primary);
  border-radius: 1px;
  pointer-events: none;
}

.timeline-scale {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.trim-form {
  margin-top: 4px;
}

.trim-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 24px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trim-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
