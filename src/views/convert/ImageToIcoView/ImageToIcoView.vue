<template>
  <div class="image-to-ico">
    <el-card class="panel">
      <template #header>
        <div class="card-header">
          <span>普通图片转 ICO</span>
          <el-button v-if="fileName" link type="primary" @click="reset">
            重置
          </el-button>
        </div>
      </template>

      <el-upload v-if="!fileName" drag accept="image/*" :auto-upload="false" :show-file-list="false"
        :on-change="onFileChange" class="uploader">
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          拖拽图片到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">支持 PNG / JPG / GIF / WebP / BMP 等格式</div>
        </template>
      </el-upload>

      <div v-else class="content">
        <div class="preview">
          <el-image :src="previewUrl" fit="contain" class="preview-img" />
          <div class="preview-meta">
            {{ fileName }} · {{ formatSize(fileSize) }}
          </div>
        </div>

        <div class="options">
          <div class="option-row">
            <span class="option-label">输出尺寸（可多选）</span>
            <el-checkbox-group v-model="selectedSizes">
              <el-checkbox v-for="s in sizeOptions" :key="s" :value="s" :label="s">
                {{ s === 256 ? '256 (0)' : s }} px
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <div class="actions">
            <el-button type="primary" :loading="converting" :disabled="!selectedSizes.length"
              @click="convert">
              生成 ICO
            </el-button>
            <el-button v-if="icoUrl" type="success" @click="download">
              下载 .ico
            </el-button>
          </div>

          <div v-if="icoUrl" class="result">
            <div class="result-meta">
              已生成 · {{ formatSize(icoSize) }} · 尺寸 {{ selectedSizes.join(', ') }}
            </div>
            <el-image :src="icoUrl" fit="contain" class="result-img" />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

const sizeOptions = [16, 24, 32, 48, 64, 128, 256]
const selectedSizes = ref([16, 32, 48])

const fileName = ref('')
const fileSize = ref(0)
const previewUrl = ref('')
const imageEl = ref(null)

const converting = ref(false)
const icoUrl = ref('')
const icoSize = ref(0)

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function reset() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (icoUrl.value) URL.revokeObjectURL(icoUrl.value)
  fileName.value = ''
  fileSize.value = 0
  previewUrl.value = ''
  imageEl.value = null
  icoUrl.value = ''
  icoSize.value = 0
}

function pickFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  reset()
  fileName.value = file.name
  fileSize.value = file.size
  previewUrl.value = URL.createObjectURL(file)

  const img = new Image()
  img.onload = () => {
    imageEl.value = img
  }
  img.onerror = () => {
    ElMessage.error('图片加载失败')
  }
  img.src = previewUrl.value
}

function onFileChange(uploadFile) {
  const raw = uploadFile?.raw ?? uploadFile
  pickFile(raw)
}

// 加载图片为 HTMLImageElement（用于在 canvas 中绘制，避免跨域）
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// 将图片绘制为指定尺寸的 PNG Blob
async function renderPngBlob(img, size) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  // 透明背景（ICO 中 0 表示 256）
  ctx.clearRect(0, 0, size, size)
  // 等比缩放居中
  const ratio = Math.min(size / img.width, size / img.height)
  const w = Math.max(1, Math.round(img.width * ratio))
  const h = Math.max(1, Math.round(img.height * ratio))
  const x = Math.round((size - w) / 2)
  const y = Math.round((size - h) / 2)
  ctx.drawImage(img, x, y, w, h)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob 失败'))
    }, 'image/png')
  })
}

// 将多个 PNG 封装为 ICO 文件
async function buildIco(pngBlobs) {
  const count = pngBlobs.length
  const headerSize = 6 + 16 * count
  const buffers = []
  let offset = headerSize

  // ICONDIR
  const header = new Uint8Array(6)
  const dv = new DataView(header.buffer)
  dv.setUint16(0, 0, true) // reserved
  dv.setUint16(2, 1, true) // type = 1 (icon)
  dv.setUint16(4, count, true)
  buffers.push(header)

  const pngParts = []
  for (const { size, blob } of pngBlobs) {
    const entry = new Uint8Array(16)
    const edv = new DataView(entry.buffer)
    edv.setUint8(0, size >= 256 ? 0 : size)  // width
    edv.setUint8(1, size >= 256 ? 0 : size)  // height
    edv.setUint8(2, 0)                         // colorCount
    edv.setUint8(3, 0)                         // reserved
    edv.setUint16(4, 1, true)                  // planes
    edv.setUint16(6, 32, true)                 // bitCount
    edv.setUint32(8, blob.size, true)          // bytesInRes
    edv.setUint32(12, offset, true)            // imageOffset
    buffers.push(entry)
    offset += blob.size
    pngParts.push(blob)
  }

  for (const blob of pngParts) {
    buffers.push(new Uint8Array(await blob.arrayBuffer()))
  }

  return new Blob(buffers, { type: 'image/x-icon' })
}

async function convert() {
  if (!selectedSizes.value.length) {
    ElMessage.warning('请至少选择一个输出尺寸')
    return
  }
  let img = imageEl.value
  if (!img) {
    if (!previewUrl.value) {
      ElMessage.error('请先上传图片')
      return
    }
    try {
      img = await loadImage(previewUrl.value)
      imageEl.value = img
    } catch {
      ElMessage.error('图片加载失败')
      return
    }
  }

  converting.value = true
  try {
    const sorted = [...selectedSizes.value].sort((a, b) => a - b)
    const pngBlobs = []
    for (const size of sorted) {
      const blob = await renderPngBlob(img, size)
      pngBlobs.push({ size, blob })
    }
    const icoBlob = await buildIco(pngBlobs)
    if (icoUrl.value) URL.revokeObjectURL(icoUrl.value)
    icoUrl.value = URL.createObjectURL(icoBlob)
    icoSize.value = icoBlob.size
    ElMessage.success('ICO 生成成功')
  } catch (err) {
    ElMessage.error('生成失败：' + (err?.message || '未知错误'))
  } finally {
    converting.value = false
  }
}

function download() {
  if (!icoUrl.value) return
  const baseName = fileName.value.replace(/\.[^.]+$/, '') || 'image'
  const a = document.createElement('a')
  a.href = icoUrl.value
  a.download = baseName + '.ico'
  a.click()
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (icoUrl.value) URL.revokeObjectURL(icoUrl.value)
})
</script>

<style scoped>
.image-to-ico {
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
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.preview-img {
  width: 100%;
  height: 240px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.preview-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.actions {
  display: flex;
  gap: 12px;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.result-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.result-img {
  width: 128px;
  height: 128px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

@media (max-width: 860px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
