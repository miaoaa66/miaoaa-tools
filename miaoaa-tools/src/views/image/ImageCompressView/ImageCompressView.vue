<template>
  <div class="image-compress">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>图片压缩</span>
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
          <div class="el-upload__tip">支持 PNG / JPG / WebP / BMP 等格式</div>
        </template>
      </el-upload>

      <div v-else class="compress-area">
        <div class="preview-wrap">
          <div class="preview-col">
            <div class="preview-title">原图</div>
            <div class="preview-box">
              <img :src="imageUrl" class="preview-img" />
            </div>
            <div class="meta">{{ fileName }}</div>
            <div class="meta">{{ originalSizeText }} · {{ originalFmt }}</div>
          </div>
          <div class="preview-col">
            <div class="preview-title">压缩后</div>
            <div class="preview-box">
              <img v-if="compressedUrl" :src="compressedUrl" class="preview-img" />
              <el-empty v-else description="尚未压缩" :image-size="80" />
            </div>
            <div v-if="compressedUrl" class="meta">
              {{ compressedName }} · {{ compressedSizeText }}
            </div>
            <div v-if="compressedSize" class="meta" :class="savedClass">
              节省 {{ savedPercent }}%（{{ savedSizeText }}）
            </div>
          </div>
        </div>

        <div class="controls">
          <el-form label-width="84px" size="default">
            <el-form-item label="输出格式">
              <span class="meta">{{ formatLabel }}（保持原图格式）</span>
            </el-form-item>

            <el-form-item label="质量">
              <el-slider v-model="quality" :min="0.1" :max="1" :step="0.05" show-input style="padding-right: 8px" />
              <div class="hint">{{ qualityHint }}</div>
            </el-form-item>

            <el-form-item label="原图尺寸">
              <span class="meta">{{ naturalW }} × {{ naturalH }} px</span>
            </el-form-item>

            <el-form-item label="原图大小">
              <span class="meta">{{ originalSizeText }}</span>
            </el-form-item>

            <el-form-item label="压缩大小">
              <span class="meta">{{ compressedSizeText || '—' }}</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="compressing" @click="doCompress">
                {{ compressing ? '压缩中...' : '开始压缩' }}
              </el-button>
              <el-button v-if="compressedUrl" type="success" @click="download">
                下载
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// ============ 文件状态 ============
const fileName = ref('')
const imageUrl = ref('')
const originalSize = ref(0)
const originalFmt = ref('')

const naturalW = ref(0)
const naturalH = ref(0)

// ============ 压缩配置 ============
const format = computed(() => {
  const fmt = (originalFmt.value || '').toLowerCase()
  if (['jpeg', 'png', 'webp'].includes(fmt)) return fmt
  return 'jpeg'
})
const formatLabel = computed(() => {
  const map = { jpeg: 'JPEG', png: 'PNG', webp: 'WebP' }
  return map[format.value] || format.value.toUpperCase()
})
const quality = ref(0.75)
const qualityHint = computed(() => {
  if (format.value === 'png') return 'PNG 为无损格式，质量参数仅影响二次压缩效果'
  return `质量 ${Math.round(quality.value * 100)}%，数值越低体积越小，画质越低`
})

// ============ 压缩结果 ============
const compressing = ref(false)
const compressedUrl = ref('')
const compressedSize = ref(0)
const compressedName = ref('')

// ============ 显示文本 ============
function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const originalSizeText = computed(() => formatSize(originalSize.value))
const compressedSizeText = computed(() => formatSize(compressedSize.value))
const savedPercent = computed(() => {
  if (!originalSize.value || !compressedSize.value) return '0'
  return Math.max(0, Math.round((1 - compressedSize.value / originalSize.value) * 100))
})
const savedSizeText = computed(() => formatSize(Math.max(0, originalSize.value - compressedSize.value)))
const savedClass = computed(() => (compressedSize.value < originalSize.value ? 'good' : 'bad'))

// ============ 文件读取 ============
function reset() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)
  fileName.value = ''
  imageUrl.value = ''
  originalSize.value = 0
  originalFmt.value = ''
  naturalW.value = 0
  naturalH.value = 0
  compressedUrl.value = ''
  compressedSize.value = 0
  compressedName.value = ''
}

function pickFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  reset()
  fileName.value = file.name
  originalSize.value = file.size
  originalFmt.value = (file.type.split('/')[1] || '').toUpperCase()
  imageUrl.value = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    naturalW.value = img.naturalWidth
    naturalH.value = img.naturalHeight
  }
  img.src = imageUrl.value
}

function onFileChange(uploadFile) {
  pickFile(uploadFile?.raw ?? uploadFile)
}

// ============ 压缩：Canvas toBlob ============
async function doCompress() {
  if (!imageUrl.value || !fileName.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  compressing.value = true
  try {
    const img = new Image()
    img.src = imageUrl.value
    await img.decode()

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)

    const mime = format.value === 'jpeg' ? 'image/jpeg' : `image/${format.value}`
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob 返回空'))),
        mime,
        quality.value,
      )
    })

    if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)
    compressedUrl.value = URL.createObjectURL(blob)
    compressedSize.value = blob.size
    const ext = format.value === 'jpeg' ? 'jpg' : format.value
    const baseName = fileName.value.replace(/\.[^.]+$/, '') || 'image'
    compressedName.value = `${baseName}_compressed.${ext}`

    ElMessage.success('压缩完成')
  } catch (err) {
    ElMessage.error('压缩失败：' + (err?.message || '未知错误'))
  } finally {
    compressing.value = false
  }
}

function download() {
  if (!compressedUrl.value) return
  const a = document.createElement('a')
  a.href = compressedUrl.value
  a.download = compressedName.value
  a.click()
  ElMessage.success('下载成功')
}
</script>

<style scoped>
.image-compress {
  max-width: 1200px;
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

.compress-area {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  align-items: start;
}

.preview-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.preview-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.preview-box {
  background: var(--stage-bg);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  overflow: hidden;
}

.preview-img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.controls {
  background: var(--panel-bg);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.meta {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  word-break: break-all;
}

.meta.good {
  color: var(--el-color-success);
}

.meta.bad {
  color: var(--el-color-danger);
}

.hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 860px) {
  .compress-area {
    grid-template-columns: 1fr;
  }
}
</style>
