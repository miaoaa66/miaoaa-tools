<template>
  <div class="avif-webp-to-png">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>AVIF / WebP 转 PNG</span>
          <el-button v-if="fileName" link type="primary" @click="reset">
            重置
          </el-button>
        </div>
      </template>

      <el-upload v-if="!fileName" drag :accept="ACCEPT_TYPES.join(',')" :auto-upload="false" :show-file-list="false"
        :on-change="onFileChange" class="uploader" @drop="onDrop" @dragover="onDragOver" @dragleave="onDragLeave"
        @dragenter="onDragEnter">
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          拖拽 avif/webp 图片到此处，或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">支持 .avif / .webp 格式</div>
        </template>
      </el-upload>

      <div v-else class="preview-area">
        <div class="preview-item">
          <div class="preview-label">原始图片</div>
          <div class="preview-meta">
            {{ fileName }} · {{ formatSize(inputSize) }}
          </div>
          <el-image :src="inputUrl" fit="contain" class="preview-img" />
        </div>

        <div class="preview-item">
          <div class="preview-label">PNG 结果</div>
          <div class="preview-meta">
            <template v-if="resultUrl">
              {{ formatSize(resultSize) }}
            </template>
            <template v-else>尚未转换</template>
          </div>
          <el-image v-if="resultUrl" :src="resultUrl" fit="contain" class="preview-img" />
          <el-empty v-else description="尚未转换" :image-size="80" />
        </div>
      </div>
    </el-card>

    <div v-if="fileName" class="actions">
      <el-button type="primary" :loading="converting" :disabled="!inputUrl" @click="convertToPng">
        {{ converting ? '转换中...' : '转换为 PNG' }}
      </el-button>
      <el-button type="success" :disabled="!resultUrl" @click="download">
        下载 PNG
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 支持的输入格式
const ACCEPT_TYPES = ['.avif', '.webp', 'image/avif', 'image/webp']

// 输入文件状态
const fileName = ref('')
const inputUrl = ref('')
const inputSize = ref(0)

// 转换结果状态
const resultUrl = ref('')
const resultSize = ref(0)
const converting = ref(false)

// 拖拽悬浮态
const dragOver = ref(false)

function reset() {
  if (inputUrl.value) URL.revokeObjectURL(inputUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  fileName.value = ''
  inputUrl.value = ''
  inputSize.value = 0
  resultUrl.value = ''
  resultSize.value = 0
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function pickFile(file) {
  if (!file) return
  const isAvif =
    file.type === 'image/avif' ||
    /\.avif$/i.test(file.name)
  const isWebp =
    file.type === 'image/webp' ||
    /\.webp$/i.test(file.name)
  if (!isAvif && !isWebp) {
    ElMessage.error('仅支持 avif 或 webp 格式图片')
    return
  }
  reset()
  fileName.value = file.name
  inputSize.value = file.size
  inputUrl.value = URL.createObjectURL(file)
}

function onFileChange(uploadFile) {
  const raw = uploadFile?.raw ?? uploadFile
  pickFile(raw)
}

function onDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  pickFile(file)
}

function onDragOver() {
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

async function convertToPng() {
  if (!inputUrl.value) {
    ElMessage.warning('请先选择 avif/webp 图片')
    return
  }
  converting.value = true
  try {
    const img = new Image()
    img.src = inputUrl.value
    await img.decode()

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob 返回空'))),
        'image/png',
      )
    })

    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = URL.createObjectURL(blob)
    resultSize.value = blob.size
    ElMessage.success('转换成功')
  } catch (err) {
    ElMessage.error('转换失败：' + (err?.message || '未知错误'))
  } finally {
    converting.value = false
  }
}

function download() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = (fileName.value.replace(/\.(avif|webp)$/i, '') || 'image') + '.png'
  a.click()
}

function onDragEnter(e) {
  e.preventDefault()
}
</script>

<style scoped>
.avif-webp-to-png {
  max-width: 960px;
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

.preview-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.preview-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.preview-img {
  width: 100%;
  height: 280px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

@media (max-width: 720px) {
  .preview-area {
    grid-template-columns: 1fr;
  }
}
</style>
