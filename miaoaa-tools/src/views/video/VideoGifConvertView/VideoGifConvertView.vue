<template>
  <div class="video-gif-convert">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>视频 &amp; GIF 互转</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- ============ 视频 → GIF ============ -->
        <el-tab-pane label="视频转 GIF" name="video2gif">
          <el-upload
            v-if="!vFileName"
            drag
            accept="video/*"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="onVideoChange"
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
                支持 MP4 / WebM / MOV 等格式，逐帧抽帧编码为 GIF 动图
              </div>
            </template>
          </el-upload>

          <div v-else class="content">
            <video
              ref="vVideoRef"
              :src="vVideoUrl"
              :controls="!vConverting"
              playsinline
              class="preview"
              @loadedmetadata="onVideoLoadedMeta"
            ></video>

            <div class="meta-bar">
              <span>{{ vFileName }} · {{ formatSize(vFileSize) }}</span>
              <span v-if="vDuration">· 总时长 {{ formatTime(vDuration) }}</span>
              <span v-if="vVideoWidth">· {{ vVideoWidth }}×{{ vVideoHeight }}</span>
            </div>

            <div class="options">
              <el-form label-width="96px" inline>
                <el-form-item label="帧率 (fps)">
                  <el-input-number v-model="vFps" :min="1" :max="30" :step="1" />
                </el-form-item>
                <el-form-item label="最大宽度">
                  <el-input-number v-model="vMaxWidth" :min="0" :max="4096" :step="16" />
                </el-form-item>
                <el-form-item label="起始时间(s)">
                  <el-input-number
                    v-model="vStartTime"
                    :min="0"
                    :max="vEndTime"
                    :step="0.1"
                    :precision="1"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="结束时间(s)">
                  <el-input-number
                    v-model="vEndTime"
                    :min="vStartTime"
                    :max="vDuration"
                    :step="0.1"
                    :precision="1"
                    controls-position="right"
                  />
                </el-form-item>
              </el-form>
              <div class="option-tip">
                最大宽度 0 表示保持原始尺寸；帧率越高 GIF 越大、转换越慢
              </div>
            </div>

            <div class="actions">
              <el-button type="primary" :loading="vConverting" :disabled="vConverting" @click="videoToGif">
                {{ vConverting ? '转换中...' : '转换为 GIF' }}
              </el-button>
              <el-button link type="primary" @click="resetVideo">重置</el-button>
            </div>

            <el-progress v-if="vConverting" :percentage="vProgress" :stroke-width="14" />

            <div v-if="vResultUrl" class="result">
              <div class="result-meta">
                {{ formatSize(vResultSize) }} · {{ vOutWidth }}×{{ vOutHeight }} · {{ vFrameCount }} 帧
              </div>
              <el-image :src="vResultUrl" fit="contain" class="result-img" />
            </div>

            <div v-if="vResultUrl" class="download-bar">
              <el-button type="success" @click="downloadVideoGif">下载 GIF</el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- ============ GIF → 视频 ============ -->
        <el-tab-pane label="GIF 转视频" name="gif2video">
          <el-upload
            v-if="!gFileName"
            drag
            accept=".gif,image/gif"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="onGifChange"
            class="uploader"
          >
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
            <div class="el-upload__text">
              拖拽 GIF 到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .gif 动图，将逐帧编码为 MP4 视频
              </div>
            </template>
          </el-upload>

          <div v-else class="content">
            <div class="meta-bar">
              <span>{{ gFileName }} · {{ formatSize(gFileSize) }}</span>
              <span v-if="gFrames.length">· {{ gFrames.length }} 帧 · {{ gGifWidth }}×{{ gGifHeight }}</span>
              <span v-if="gTotalDuration">· 时长 {{ (gTotalDuration / 1000).toFixed(2) }}s</span>
            </div>

            <img :src="gGifUrl" class="preview-gif" alt="GIF 预览" />

            <div class="actions">
              <el-button type="primary" :loading="gConverting" :disabled="gConverting" @click="gifToVideo">
                {{ gConverting ? '转换中...' : '转换为 MP4' }}
              </el-button>
              <el-button link type="primary" @click="resetGif">重置</el-button>
            </div>

            <el-progress v-if="gConverting" :percentage="gProgress" :stroke-width="14" />

            <div v-if="gResultUrl" class="result">
              <div class="result-meta">{{ formatSize(gResultSize) }}</div>
              <video :src="gResultUrl" controls playsinline class="preview"></video>
            </div>

            <div v-if="gResultUrl" class="download-bar">
              <el-button type="success" @click="downloadGifVideo">
                下载 {{ gResultExt.toUpperCase() }}
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import { parseGIF, decompressFrames } from 'gifuct-js'
import {
  Input,
  Output,
  CanvasSink,
  CanvasSource,
  Quality,
  BufferTarget,
  Mp4OutputFormat,
  WebMOutputFormat,
  BlobSource,
  ALL_FORMATS,
} from 'mediabunny'

const activeTab = ref('video2gif')

// ================= 通用工具 =================
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

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

// ================= 视频 → GIF =================
const vFileName = ref('')
const vFileSize = ref(0)
const vRawFile = ref(null)
const vVideoUrl = ref('')
const vVideoRef = ref(null)
const vDuration = ref(0)
const vVideoWidth = ref(0)
const vVideoHeight = ref(0)
const vStartTime = ref(0)
const vEndTime = ref(0)
const vFps = ref(10)
const vMaxWidth = ref(480)
const vConverting = ref(false)
const vProgress = ref(0)
const vResultUrl = ref('')
const vResultSize = ref(0)
const vOutWidth = ref(0)
const vOutHeight = ref(0)
const vFrameCount = ref(0)

function resetVideo() {
  if (vVideoUrl.value) URL.revokeObjectURL(vVideoUrl.value)
  if (vResultUrl.value) URL.revokeObjectURL(vResultUrl.value)
  vFileName.value = ''
  vFileSize.value = 0
  vRawFile.value = null
  vVideoUrl.value = ''
  vDuration.value = 0
  vVideoWidth.value = 0
  vVideoHeight.value = 0
  vStartTime.value = 0
  vEndTime.value = 0
  vConverting.value = false
  vProgress.value = 0
  vResultUrl.value = ''
  vResultSize.value = 0
  vOutWidth.value = 0
  vOutHeight.value = 0
  vFrameCount.value = 0
}

function onVideoChange(uploadFile) {
  const raw = uploadFile?.raw ?? uploadFile
  if (!raw) return
  if (!raw.type.startsWith('video/')) {
    ElMessage.error('请选择视频文件')
    return
  }
  resetVideo()
  vFileName.value = raw.name
  vFileSize.value = raw.size
  vRawFile.value = raw
  vVideoUrl.value = URL.createObjectURL(raw)
}

function onVideoLoadedMeta() {
  const v = vVideoRef.value
  if (!v) return
  vDuration.value = v.duration || 0
  vVideoWidth.value = v.videoWidth
  vVideoHeight.value = v.videoHeight
  vEndTime.value = v.duration || 0
}

async function videoToGif() {
  const rawFile = vRawFile.value
  if (!rawFile || !vDuration.value) return
  const start = Math.max(0, vStartTime.value)
  const end = Math.min(vDuration.value, vEndTime.value)
  if (end - start < 0.05) {
    ElMessage.warning('请先设置有效的起止时间区间')
    return
  }

  const fps = vFps.value
  const step = 1 / fps
  const times = []
  for (let t = start; t <= end + step / 2; t += step) {
    times.push(Math.min(t, vDuration.value))
  }
  if (!times.length) {
    ElMessage.warning('时间区间内没有可抽帧的时间点')
    return
  }
  const maxFrames = 500
  if (times.length > maxFrames) {
    ElMessage.warning(`将生成 ${times.length} 帧，超过上限 ${maxFrames}，请降低帧率或缩短区间`)
    return
  }

  let outW = vVideoWidth.value
  let outH = vVideoHeight.value
  if (vMaxWidth.value > 0 && vMaxWidth.value < outW) {
    outW = vMaxWidth.value
    outH = Math.max(1, Math.round(outH * (outW / vVideoWidth.value)))
  }

  vConverting.value = true
  vProgress.value = 0
  try {
    // 用 WebCodecs 全速顺序解码抽帧，替代 <video> 逐帧 seek
    const input = new Input({ source: new BlobSource(rawFile), formats: ALL_FORMATS })
    const [videoTrack] = await input.getVideoTracks()
    if (!videoTrack) throw new Error('未找到视频轨道')

    const sink = new CanvasSink(videoTrack, { width: outW })
    const gif = GIFEncoder()
    const delay = Math.round(1000 / fps)

    let i = 0
    let actualW = outW
    let actualH = outH
    for await (const wc of sink.canvasesAtTimestamps(times)) {
      if (!wc) continue
      const ctx = wc.canvas.getContext('2d')
      actualW = wc.canvas.width
      actualH = wc.canvas.height
      const imgData = ctx.getImageData(0, 0, actualW, actualH)
      const palette = quantize(imgData.data, 256)
      const index = applyPalette(imgData.data, palette)
      gif.writeFrame(index, actualW, actualH, {
        palette,
        delay,
        repeat: 0,
        first: i === 0,
      })
      i++
      vProgress.value = Math.round((i / times.length) * 100)
    }
    if (i === 0) throw new Error('未能解码出任何帧')

    gif.finish()
    const bytes = gif.bytes()
    const blob = new Blob([bytes], { type: 'image/gif' })
    if (vResultUrl.value) URL.revokeObjectURL(vResultUrl.value)
    vResultUrl.value = URL.createObjectURL(blob)
    vResultSize.value = blob.size
    vOutWidth.value = actualW
    vOutHeight.value = actualH
    vFrameCount.value = i
    ElMessage.success('转换成功')
  } catch (err) {
    ElMessage.error('转换失败：' + (err?.message || '未知错误'))
  } finally {
    vConverting.value = false
  }
}

function downloadVideoGif() {
  if (!vResultUrl.value) return
  const base = vFileName.value.replace(/\.[^.]+$/, '') || 'video'
  const a = document.createElement('a')
  a.href = vResultUrl.value
  a.download = `${base}.gif`
  a.click()
}

// ================= GIF → 视频 =================
const gFileName = ref('')
const gFileSize = ref(0)
const gGifUrl = ref('')
const gFrames = ref([])
const gGifWidth = ref(0)
const gGifHeight = ref(0)
const gConverting = ref(false)
const gProgress = ref(0)
const gResultUrl = ref('')
const gResultSize = ref(0)
const gResultExt = ref('mp4')

const gTotalDuration = computed(() =>
  gFrames.value.reduce((sum, f) => sum + (f.delay || 100), 0)
)

function resetGif() {
  if (gGifUrl.value) URL.revokeObjectURL(gGifUrl.value)
  if (gResultUrl.value) URL.revokeObjectURL(gResultUrl.value)
  gFileName.value = ''
  gFileSize.value = 0
  gGifUrl.value = ''
  gFrames.value = []
  gGifWidth.value = 0
  gGifHeight.value = 0
  gConverting.value = false
  gProgress.value = 0
  gResultUrl.value = ''
  gResultSize.value = 0
  gResultExt.value = 'mp4'
}

function onGifChange(uploadFile) {
  const raw = uploadFile?.raw ?? uploadFile
  if (!raw) return
  const isGif = raw.type === 'image/gif' || /\.gif$/i.test(raw.name)
  if (!isGif) {
    ElMessage.error('仅支持 .gif 格式')
    return
  }
  resetGif()
  gFileName.value = raw.name
  gFileSize.value = raw.size
  gGifUrl.value = URL.createObjectURL(raw)
  decodeGif(raw)
}

async function decodeGif(file) {
  try {
    const buffer = await file.arrayBuffer()
    const gif = parseGIF(buffer)
    gGifWidth.value = gif.lsd.width
    gGifHeight.value = gif.lsd.height
    gFrames.value = decompressFrames(gif, true)
  } catch (err) {
    ElMessage.error('解析 GIF 失败：' + (err?.message || '未知错误'))
  }
}

function drawPatchToTmp(frame) {
  const c = document.createElement('canvas')
  c.width = frame.dims.width
  c.height = frame.dims.height
  const ctx = c.getContext('2d')
  const imgData = new ImageData(frame.patch, frame.dims.width, frame.dims.height)
  ctx.putImageData(imgData, 0, 0)
  return c
}

// 将 GIF 所有帧按顺序逐帧编码（含 disposal 处理），返回 { blob, mime, ext }
async function encodeFrames(frames, codec, outputFormat, mime, ext, onProgress) {
  const canvas = document.createElement('canvas')
  canvas.width = gGifWidth.value
  canvas.height = gGifHeight.value
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const output = new Output({ format: outputFormat, target: new BufferTarget() })
  const canvasSource = new CanvasSource(canvas, { codec, quality: new Quality('high') })
  output.addVideoTrack(canvasSource)
  await output.start()

  let ts = 0
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    let snapshot = null
    if (frame.disposalType === 3) {
      snapshot = document.createElement('canvas')
      snapshot.width = canvas.width
      snapshot.height = canvas.height
      snapshot.getContext('2d').drawImage(canvas, 0, 0)
    }

    const tmp = drawPatchToTmp(frame)
    ctx.drawImage(tmp, frame.dims.left, frame.dims.top)

    const delay = frame.delay || 100
    await canvasSource.add(ts, delay / 1000)
    ts += delay / 1000

    if (frame.disposalType === 2) {
      ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height)
    } else if (frame.disposalType === 3 && snapshot) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(snapshot, 0, 0)
    }
    onProgress?.(i + 1)
  }

  await output.finalize()
  const buffer = output.target.buffer
  const blob = new Blob([buffer], { type: mime })
  return { blob, mime, ext }
}

async function gifToVideo() {
  const frames = gFrames.value
  if (!frames.length) {
    ElMessage.warning('请先上传有效的 GIF')
    return
  }
  gConverting.value = true
  gProgress.value = 0
  try {
    const onProgress = (n) => {
      gProgress.value = Math.round((n / frames.length) * 100)
    }

    let result
    try {
      result = await encodeFrames(frames, 'avc', new Mp4OutputFormat(), 'video/mp4', 'mp4', onProgress)
    } catch (err) {
      ElMessage.warning('当前环境不支持 H.264/MP4，已降级为 WebM 格式')
      gProgress.value = 0
      result = await encodeFrames(frames, 'vp9', new WebMOutputFormat(), 'video/webm', 'webm', onProgress)
    }

    if (gResultUrl.value) URL.revokeObjectURL(gResultUrl.value)
    gResultUrl.value = URL.createObjectURL(result.blob)
    gResultSize.value = result.blob.size
    gResultExt.value = result.ext
    ElMessage.success('转换成功')
  } catch (err) {
    ElMessage.error('转换失败：' + (err?.message || '未知错误'))
  } finally {
    gConverting.value = false
  }
}

function downloadGifVideo() {
  if (!gResultUrl.value) return
  const base = gFileName.value.replace(/\.gif$/i, '') || 'gif'
  const a = document.createElement('a')
  a.href = gResultUrl.value
  a.download = `${base}.${gResultExt.value}`
  a.click()
}

onBeforeUnmount(() => {
  resetVideo()
  resetGif()
})
</script>

<style scoped>
.video-gif-convert {
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

.preview-gif {
  display: block;
  max-width: 100%;
  max-height: 320px;
  margin: 0 auto;
  object-fit: contain;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.meta-bar {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.options :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 24px;
}

.option-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.result-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.result-img {
  width: 100%;
  max-width: 360px;
  height: 240px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.download-bar {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}
</style>
