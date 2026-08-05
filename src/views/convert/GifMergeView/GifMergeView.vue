<template>
  <div class="gif-merge">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>多张 PNG 合成 GIF</span>
          <el-button v-if="items.length" link type="primary" @click="reset">
            重置
          </el-button>
        </div>
      </template>

      <el-upload v-if="!items.length" drag accept="image/png,image/jpeg,image/webp,image/bmp" multiple
        :auto-upload="false" :show-file-list="false" :on-change="onFileChange" class="uploader">
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          拖拽多张图片到此处，或 <em>点击上传（可多选）</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">支持 PNG / JPG / WebP / BMP，按顺序合成 GIF 动图</div>
        </template>
      </el-upload>

      <div v-else class="content">
        <div class="meta-bar">
          共 {{ items.length }} 张 · 画布 {{ canvasW }}×{{ canvasH }}
          <el-button link type="primary" @click="addMore">追加图片</el-button>
        </div>

        <div class="frame-list">
          <div v-for="(item, i) in items" :key="item.id" class="frame-row">
            <span class="frame-no">{{ i + 1 }}</span>
            <el-image :src="item.url" fit="contain" class="frame-thumb" />
            <span class="frame-name" :title="item.name">{{ item.name }}</span>
            <span class="frame-size">{{ item.w }}×{{ item.h }}</span>
            <div class="frame-ops">
              <el-button size="small" link :disabled="i === 0" @click="moveUp(i)">
                上移
              </el-button>
              <el-button size="small" link :disabled="i === items.length - 1" @click="moveDown(i)">
                下移
              </el-button>
              <el-button size="small" link type="danger" @click="removeAt(i)">
                移除
              </el-button>
            </div>
          </div>
        </div>

        <div class="options">
          <div class="option-row">
            <span class="option-label">每帧延迟（毫秒）</span>
            <el-input-number v-model="delayMs" :min="20" :max="5000" :step="20" />
          </div>
          <div class="option-row">
            <span class="option-label">循环次数（0 = 无限循环）</span>
            <el-input-number v-model="loopCount" :min="0" :max="100" :step="1" />
          </div>
        </div>

        <div class="actions">
          <el-button type="primary" :loading="merging" @click="merge">
            {{ merging ? '合成中...' : '合成 GIF' }}
          </el-button>
          <el-button v-if="resultUrl" type="success" @click="download">
            下载 GIF
          </el-button>
        </div>

        <div v-if="resultUrl" class="result">
          <div class="result-meta">
            {{ formatSize(resultSize) }} · {{ resultFrames }} 帧 · {{ canvasW }}×{{ canvasH }}
          </div>
          <el-image :src="resultUrl" fit="contain" class="result-img" />
        </div>
      </div>
    </el-card>

    <input ref="appendInput" type="file" accept="image/png,image/jpeg,image/webp,image/bmp"
      multiple class="hidden-input" @change="onAppendChange">
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'

let uid = 0
const items = ref([])
const delayMs = ref(100)
const loopCount = ref(0)
const merging = ref(false)
const resultUrl = ref('')
const resultSize = ref(0)
const resultFrames = ref(0)
const appendInput = ref(null)

const canvasW = computed(() => items.value.reduce((m, x) => Math.max(m, x.w), 0))
const canvasH = computed(() => items.value.reduce((m, x) => Math.max(m, x.h), 0))

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function reset() {
  for (const item of items.value) URL.revokeObjectURL(item.url)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  items.value = []
  resultUrl.value = ''
  resultSize.value = 0
  resultFrames.value = 0
}

// 读取图片尺寸（用 createImageBitmap，避免 HTMLImage 跨域污染 canvas）
async function loadBitmap(file) {
  const bitmap = await createImageBitmap(file)
  return { bitmap, w: bitmap.width, h: bitmap.height }
}

async function addFiles(fileList) {
  const files = Array.from(fileList || [])
  if (!files.length) return
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      ElMessage.warning(`已跳过非图片文件：${file.name}`)
      continue
    }
    try {
      const { bitmap, w, h } = await loadBitmap(file)
      bitmap.close?.()
      items.value.push({
        id: ++uid,
        file,
        name: file.name,
        url: URL.createObjectURL(file),
        w,
        h,
      })
    } catch {
      ElMessage.error(`加载失败：${file.name}`)
    }
  }
}

function onFileChange(uploadFile) {
  // el-upload 多选时，change 会逐个触发，取 uploadFile.raw
  const raw = uploadFile?.raw
  if (raw) addFiles([raw])
}

function addMore() {
  appendInput.value?.click()
}

function onAppendChange(e) {
  addFiles(e.target.files)
  e.target.value = ''
}

function moveUp(i) {
  if (i <= 0) return
  const arr = items.value
  ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
}

function moveDown(i) {
  const arr = items.value
  if (i >= arr.length - 1) return
  ;[arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]
}

function removeAt(i) {
  const [removed] = items.value.splice(i, 1)
  if (removed) URL.revokeObjectURL(removed.url)
}

// 将图片绘制到统一画布尺寸，返回 ImageData（用于 gifenc 量化）
async function fileToImageData(file, w, h) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, w, h)
  // 等比缩放居中
  const ratio = Math.min(w / bitmap.width, h / bitmap.height)
  const dw = Math.max(1, Math.round(bitmap.width * ratio))
  const dh = Math.max(1, Math.round(bitmap.height * ratio))
  const dx = Math.round((w - dw) / 2)
  const dy = Math.round((h - dh) / 2)
  ctx.drawImage(bitmap, dx, dy, dw, dh)
  bitmap.close?.()
  return ctx.getImageData(0, 0, w, h)
}

async function merge() {
  if (items.value.length < 2) {
    ElMessage.warning('请至少添加 2 张图片')
    return
  }
  merging.value = true
  try {
    const w = canvasW.value
    const h = canvasH.value
    const gif = GIFEncoder()

    for (let i = 0; i < items.value.length; i++) {
      const { file } = items.value[i]
      const imgData = await fileToImageData(file, w, h)
      const palette = quantize(imgData.data, 256)
      const index = applyPalette(imgData.data, palette)
      gif.writeFrame(index, w, h, {
        palette,
        delay: delayMs.value,
        repeat: i === 0 ? loopCount.value : 0,
        first: i === 0,
      })
    }
    gif.finish()
    const bytes = gif.bytes()
    const blob = new Blob([bytes], { type: 'image/gif' })
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = URL.createObjectURL(blob)
    resultSize.value = blob.size
    resultFrames.value = items.value.length
    ElMessage.success('合成成功')
  } catch (err) {
    ElMessage.error('合成失败：' + (err?.message || '未知错误'))
  } finally {
    merging.value = false
  }
}

function download() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `merged_${Date.now()}.gif`
  a.click()
}

onBeforeUnmount(() => {
  for (const item of items.value) URL.revokeObjectURL(item.url)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})
</script>

<style scoped>
.gif-merge {
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
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.frame-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.frame-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.frame-no {
  width: 24px;
  text-align: center;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.frame-thumb {
  width: 48px;
  height: 48px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  flex-shrink: 0;
}

.frame-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.frame-size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.frame-ops {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.options {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.option-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
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
  max-width: 320px;
  height: 240px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.hidden-input {
  display: none;
}
</style>
