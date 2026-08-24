<template>
  <div class="gif-split">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>GIF 拆分为 PNG</span>
          <el-button v-if="fileName" link type="primary" @click="reset">
            重置
          </el-button>
        </div>
      </template>

      <el-upload v-if="!fileName" drag accept=".gif,image/gif" :auto-upload="false" :show-file-list="false"
        :on-change="onFileChange" class="uploader">
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          拖拽 GIF 到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">支持 .gif 动图，将逐帧拆分为 PNG</div>
        </template>
      </el-upload>

      <div v-else class="content">
        <div class="meta-bar">
          <span>{{ fileName }} · {{ formatSize(fileSize) }}</span>
          <span v-if="frames.length">· {{ frames.length }} 帧 · {{ gifWidth }}×{{ gifHeight }}</span>
          <span v-if="totalDuration">· 时长 {{ (totalDuration / 1000).toFixed(2) }}s</span>
        </div>

        <div v-if="splitting" class="loading">
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          <span>正在拆分 {{ splitProgress }}/{{ frames.length }} ...</span>
        </div>

        <div v-else-if="pngBlobs.length" class="frame-grid">
          <div v-for="(item, i) in pngBlobs" :key="i" class="frame-card">
            <el-image :src="item.url" fit="contain" class="frame-img" :preview-src-list="[item.url]"
              preview-teleported hide-on-click-modal />
            <div class="frame-info">
              <span>#{{ i + 1 }}</span>
              <span>{{ item.delay }}ms</span>
              <span>{{ formatSize(item.size) }}</span>
            </div>
            <el-button size="small" type="primary" link @click="downloadOne(i)">
              下载
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <div v-if="pngBlobs.length" class="actions">
      <el-button type="success" @click="downloadAll">
        下载全部 ({{ pngBlobs.length }} 张)
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Loading } from '@element-plus/icons-vue'
import { parseGIF, decompressFrames } from 'gifuct-js'

const fileName = ref('')
const fileSize = ref(0)
const gifWidth = ref(0)
const gifHeight = ref(0)
const frames = ref([])
const pngBlobs = ref([])
const splitting = ref(false)
const splitProgress = ref(0)

const totalDuration = computed(() =>
  frames.value.reduce((sum, f) => sum + (f.delay || 0), 0)
)

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function reset() {
  for (const item of pngBlobs.value) URL.revokeObjectURL(item.url)
  fileName.value = ''
  fileSize.value = 0
  gifWidth.value = 0
  gifHeight.value = 0
  frames.value = []
  pngBlobs.value = []
  splitting.value = false
  splitProgress.value = 0
}

function onFileChange(uploadFile) {
  const raw = uploadFile?.raw ?? uploadFile
  pickFile(raw)
}

async function pickFile(file) {
  if (!file) return
  const isGif = file.type === 'image/gif' || /\.gif$/i.test(file.name)
  if (!isGif) {
    ElMessage.error('仅支持 .gif 格式')
    return
  }
  reset()
  fileName.value = file.name
  fileSize.value = file.size
  await splitGif(file)
}

// 将单帧 patch 绘制到临时 canvas，再 drawImage 到主画布以正确处理 alpha 混合
function drawPatchToTmp(frame) {
  const c = document.createElement('canvas')
  c.width = frame.dims.width
  c.height = frame.dims.height
  const ctx = c.getContext('2d')
  const imgData = new ImageData(
    frame.patch,
    frame.dims.width,
    frame.dims.height
  )
  ctx.putImageData(imgData, 0, 0)
  return c
}

async function splitGif(file) {
  splitting.value = true
  splitProgress.value = 0
  try {
    const buffer = await file.arrayBuffer()
    const gif = parseGIF(buffer)
    gifWidth.value = gif.lsd.width
    gifHeight.value = gif.lsd.height
    const parsed = decompressFrames(gif, true)
    frames.value = parsed

    const canvas = document.createElement('canvas')
    canvas.width = gif.lsd.width
    canvas.height = gif.lsd.height
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const result = []
    for (let i = 0; i < parsed.length; i++) {
      const frame = parsed[i]
      // disposalType 3：绘制前保存当前画面，便于本帧后恢复
      let snapshot = null
      if (frame.disposalType === 3) {
        snapshot = document.createElement('canvas')
        snapshot.width = canvas.width
        snapshot.height = canvas.height
        snapshot.getContext('2d').drawImage(canvas, 0, 0)
      }

      const tmp = drawPatchToTmp(frame)
      ctx.drawImage(tmp, frame.dims.left, frame.dims.top)

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('toBlob 返回空'))),
          'image/png'
        )
      })
      result.push({
        blob,
        url: URL.createObjectURL(blob),
        size: blob.size,
        delay: frame.delay || 0,
      })
      splitProgress.value = i + 1

      // 处理本帧结束后的 disposal
      if (frame.disposalType === 2) {
        ctx.clearRect(
          frame.dims.left,
          frame.dims.top,
          frame.dims.width,
          frame.dims.height
        )
      } else if (frame.disposalType === 3 && snapshot) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(snapshot, 0, 0)
      }
    }
    pngBlobs.value = result
    ElMessage.success(`拆分完成，共 ${result.length} 帧`)
  } catch (err) {
    ElMessage.error('拆分失败：' + (err?.message || '未知错误'))
  } finally {
    splitting.value = false
  }
}

function downloadOne(i) {
  const item = pngBlobs.value[i]
  if (!item) return
  const baseName = fileName.value.replace(/\.gif$/i, '') || 'frame'
  const a = document.createElement('a')
  a.href = item.url
  a.download = `${baseName}_${String(i + 1).padStart(3, '0')}.png`
  a.click()
}

async function downloadAll() {
  if (!pngBlobs.value.length) return
  ElMessage.info(`开始下载 ${pngBlobs.value.length} 张 PNG，请允许浏览器多文件下载`)
  for (let i = 0; i < pngBlobs.value.length; i++) {
    downloadOne(i)
    // 间隔触发，避免浏览器拦截
    await new Promise((r) => setTimeout(r, 200))
  }
}

onBeforeUnmount(() => {
  for (const item of pngBlobs.value) URL.revokeObjectURL(item.url)
})
</script>

<style scoped>
.gif-split {
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
  padding: 24px 0;
  color: var(--el-text-color-secondary);
}

.frame-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.frame-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.frame-img {
  width: 100%;
  height: 100px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.frame-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
