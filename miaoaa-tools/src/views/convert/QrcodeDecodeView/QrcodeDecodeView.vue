<template>
  <div class="qrcode-decode">
    <div class="panels">
      <!-- 上传图片 -->
      <el-card class="panel">
        <template #header>
          <div class="card-header">
            <span>上传二维码图片</span>
            <el-button v-if="imageUrl" link type="primary" @click="reset">
              重置
            </el-button>
          </div>
        </template>

        <el-upload
          v-if="!imageUrl"
          drag
          accept="image/*"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onFileChange"
          class="uploader"
        >
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">
            拖拽二维码图片到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">支持 PNG / JPG / GIF / WebP / BMP 等格式</div>
          </template>
        </el-upload>

        <div v-else class="img-area">
          <el-image :src="imageUrl" fit="contain" class="preview-img" />
          <div class="preview-meta">{{ fileName }} · {{ formatSize(fileSize) }}</div>
        </div>

        <div class="extra-actions">
          <el-button type="primary" :disabled="!imageUrl" :loading="decoding" @click="decode">
            重新解码
          </el-button>
        </div>
      </el-card>

      <!-- 解码结果 -->
      <el-card class="panel">
        <template #header>
          <div class="card-header">
            <span>解码结果</span>
            <el-button
              v-if="result !== null"
              type="success"
              link
              :loading="copying"
              @click="copyResult"
            >
              复制结果
            </el-button>
          </div>
        </template>

        <el-input
          v-if="result !== null"
          :model-value="result"
          type="textarea"
          :rows="6"
          readonly
          placeholder="解码结果"
          class="result-textarea"
        />
        <el-empty v-else description="上传二维码图片后自动解码" />

        <div v-if="errorTip" class="error-tip">{{ errorTip }}</div>

        <div v-if="result !== null" class="result-meta">
          <span>格式：{{ format || '-' }}</span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import jsQR from 'jsqr'

const imageUrl = ref('')
const fileName = ref('')
const fileSize = ref(0)
const result = ref(null)
const format = ref('')
const errorTip = ref('')
const decoding = ref(false)
const copying = ref(false)

function formatSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function onFileChange(file) {
  const raw = file.raw
  if (!raw) return
  fileName.value = raw.name
  fileSize.value = raw.size
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  imageUrl.value = URL.createObjectURL(raw)
  errorTip.value = ''
  result.value = null
  decode()
}

async function decode() {
  if (!imageUrl.value) return
  decoding.value = true
  errorTip.value = ''
  try {
    const img = await loadImage(imageUrl.value)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })
    if (code && code.data) {
      result.value = code.data
      format.value = code.binaryData ? 'binary' : 'text'
    } else {
      result.value = ''
      errorTip.value = '未识别到二维码，请确保图片清晰且包含完整二维码'
    }
  } catch (err) {
    result.value = ''
    errorTip.value = '解码失败：' + (err?.message || '未知错误')
  } finally {
    decoding.value = false
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

function reset() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  imageUrl.value = ''
  fileName.value = ''
  fileSize.value = 0
  result.value = null
  format.value = ''
  errorTip.value = ''
}

async function copyResult() {
  if (result.value === null) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(result.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  } finally {
    copying.value = false
  }
}
</script>

<style scoped>
.qrcode-decode {
  max-width: 1200px;
  margin: 0 auto;
}

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.img-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-img {
  max-width: 100%;
  max-height: 320px;
  border-radius: 4px;
}

.preview-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.extra-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.result-textarea :deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 13px;
}

.result-meta {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.error-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-danger);
}

@media (max-width: 860px) {
  .panels {
    grid-template-columns: 1fr;
  }
}
</style>
