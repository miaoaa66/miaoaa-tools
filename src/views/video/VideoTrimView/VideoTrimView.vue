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

      <el-upload v-if="!fileName" drag accept="video/*" :auto-upload="false" :show-file-list="false"
        :on-change="onFileChange" class="uploader">
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          拖拽视频到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">支持 MP4 / WebM / MOV 等格式，浏览器支持时优先输出 MP4（H.264），否则回退 WebM</div>
        </template>
      </el-upload>

      <div v-else class="content">
        <video ref="videoRef" :src="videoUrl" :controls="!trimming" playsinline class="preview"
          @loadedmetadata="onLoadedMeta" @timeupdate="onTimeUpdate" @ended="onEnded"></video>

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
              <el-input-number v-model="startTime" :min="0" :max="endTime" :step="0.1" :precision="1"
                controls-position="right" style="width: 140px" />
              <el-button size="small" @click="setStartFromCurrent">设为当前</el-button>
            </el-form-item>
            <el-form-item label="结束时间">
              <el-input-number v-model="endTime" :min="startTime" :max="duration" :step="0.1" :precision="1"
                controls-position="right" style="width: 140px" />
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
            正在裁剪 {{ formatTime(progressSec) }} / {{ formatTime(trimDuration) }} ...
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

const fileName = ref('')
const fileSize = ref(0)
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
const progressSec = ref(0)

let trimCancelled = false
let recorder = null

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
  stopTrimming()
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  fileName.value = ''
  fileSize.value = 0
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
  if (trimming.value) {
    progressSec.value = Math.min(trimDuration.value, v.currentTime - startTime.value)
  }
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

// 选择浏览器支持的录制格式，优先 MP4（H.264），不支持时回退 WebM
function pickMime() {
  const candidates = [
    { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ]
  return candidates.find((c) => MediaRecorder.isTypeSupported(c.mime)) || null
}

// 跳转到指定时间并等待跳转完成（录制前保证从正确位置开始）
function seekToWait(v, t) {
  return new Promise((resolve) => {
    const target = Math.min(Math.max(t, 0), v.duration || 0)
    const doSeek = () => {
      if (Math.abs(v.currentTime - target) < 0.05) {
        resolve()
        return
      }
      const onSeeked = () => {
        v.removeEventListener('seeked', onSeeked)
        resolve()
      }
      v.addEventListener('seeked', onSeeked)
      v.currentTime = target
      // 兜底：seek 事件异常时避免卡死
      setTimeout(() => {
        v.removeEventListener('seeked', onSeeked)
        resolve()
      }, 3000)
    }
    if (v.readyState < 1) {
      // 元数据尚未就绪时先等待 loadedmetadata
      const onLoaded = () => {
        v.removeEventListener('loadedmetadata', onLoaded)
        doSeek()
      }
      v.addEventListener('loadedmetadata', onLoaded)
      setTimeout(() => {
        v.removeEventListener('loadedmetadata', onLoaded)
        doSeek()
      }, 3000)
    } else {
      doSeek()
    }
  })
}

// 等待播放位置真正开始推进，确保画面已输出后再录制，避免开头黑帧/静止帧
function waitForPlayback(v, from) {
  return new Promise((resolve, reject) => {
    const start = performance.now()
    const tick = () => {
      if (v.ended || v.currentTime > from + 0.1) {
        resolve()
        return
      }
      if (performance.now() - start > 8000) {
        reject(new Error('视频播放启动超时'))
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

// 循环检测播放位置到达结束时间（或视频自然播完），到达后停止录制
function waitForEnd(v, end) {
  return new Promise((resolve) => {
    let rafId = 0
    const cleanup = () => {
      cancelAnimationFrame(rafId)
      v.removeEventListener('ended', onEnded)
    }
    const finish = () => {
      cleanup()
      resolve()
    }
    const onEnded = () => finish()
    const tick = () => {
      if (!trimming.value) {
        finish()
        return
      }
      progressSec.value = Math.min(
        trimDuration.value,
        Math.max(0, v.currentTime - startTime.value),
      )
      if (v.ended || v.currentTime >= end - 0.05) {
        finish()
        return
      }
      rafId = requestAnimationFrame(tick)
    }
    v.addEventListener('ended', onEnded)
    rafId = requestAnimationFrame(tick)
  })
}

function getStream(v) {
  if (typeof v.captureStream === 'function') return v.captureStream()
  if (typeof v.mozCaptureStream === 'function') return v.mozCaptureStream()
  return null
}

function stopRecorder() {
  if (recorder && recorder.state !== 'inactive') {
    try {
      recorder.stop()
    } catch {
      // 忽略停止异常
    }
  }
}

function stopTrimming() {
  trimCancelled = true
  stopRecorder()
  recorder = null
  trimming.value = false
  if (videoRef.value) videoRef.value.pause()
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

async function startTrim() {
  const v = videoRef.value
  if (!v) return
  if (trimDuration.value < 0.1) {
    ElMessage.warning('请先设置有效的裁剪区间')
    return
  }
  const stream = getStream(v)
  if (!stream) {
    ElMessage.error('当前浏览器不支持视频流捕获，请使用最新版 Chrome / Edge / Firefox')
    return
  }
  if (typeof MediaRecorder === 'undefined') {
    ElMessage.error('当前浏览器不支持 MediaRecorder')
    return
  }
  const format = pickMime()
  if (!format) {
    ElMessage.error('当前浏览器不支持视频录制')
    return
  }

  trimming.value = true
  progressSec.value = 0
  trimCancelled = false
  try {
    // 1. 暂停并跳转到开始时间，等待跳转完成
    v.pause()
    await seekToWait(v, startTime.value)
    if (trimCancelled) return

    // 2. 开始播放，等待画面真正输出后再录制，避免开头黑帧
    await v.play()
    await waitForPlayback(v, startTime.value)
    if (trimCancelled) return

    // 3. 开始录制
    recorder = new MediaRecorder(stream, { mimeType: format.mime })
    const chunks = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data)
    }
    const done = new Promise((resolve, reject) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }))
      }
      recorder.onerror = () => reject(new Error('录制过程中发生错误'))
    })
    recorder.start(1000)

    // 4. 实时检测播放位置到达结束时间后停止录制
    await waitForEnd(v, endTime.value)
    if (trimCancelled) return
    stopRecorder()
    v.pause()

    const blob = await done
    if (trimCancelled) return
    downloadBlob(blob, format.ext)
    ElMessage.success(`裁剪完成，已导出 ${format.ext.toUpperCase()} 格式`)
  } catch (err) {
    stopRecorder()
    ElMessage.error('裁剪失败：' + (err?.message || '未知错误'))
  } finally {
    trimming.value = false
    progressSec.value = 0
  }
}

onBeforeUnmount(() => {
  stopTrimming()
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
