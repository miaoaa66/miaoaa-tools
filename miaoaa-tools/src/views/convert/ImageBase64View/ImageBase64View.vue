<template>
  <div class="image-base64">
    <div class="panels">
      <!-- 图片 -> Base64 -->
      <el-card class="panel">
        <template #header>
          <div class="card-header">
            <span>图片转 Base64</span>
            <el-button v-if="fileName" link type="primary" @click="resetImage">
              重置
            </el-button>
          </div>
        </template>

        <el-upload v-if="!fileName" drag accept="image/*" :auto-upload="false" :show-file-list="false"
          :on-change="onFileChange" class="uploader" @drop="onDrop" @dragover="onDragOver" @dragleave="onDragLeave"
          @dragenter="onDragEnter">
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

        <div v-else class="img-area">
          <el-image :src="inputUrl" fit="contain" class="preview-img" />
          <div class="preview-meta">
            {{ fileName }} · {{ formatSize(inputSize) }}
          </div>
        </div>

        <div v-if="base64Text" class="base64-area">
          <div class="base64-head">
            <el-checkbox v-model="base64Only">仅 Base64（不含 data 前缀）</el-checkbox>
            <el-button type="primary" link :loading="copying" @click="copyBase64">
              复制
            </el-button>
          </div>
          <el-input :model-value="base64Output" type="textarea" :rows="8" readonly class="base64-textarea" />
        </div>
      </el-card>

      <!-- Base64 -> 图片 -->
      <el-card class="panel">
        <template #header>
          <div class="card-header">
            <span>Base64 转图片</span>
            <el-button v-if="decodedUrl" link type="primary" @click="resetDecoded">
              重置
            </el-button>
          </div>
        </template>

        <el-input v-model="base64Input" type="textarea" :rows="6"
          placeholder="粘贴 data:image/...;base64,... 或纯 Base64 字符串" />
        <div class="decode-actions">
          <el-button type="primary" @click="decodeBase64">解析预览</el-button>
        </div>

        <div v-if="decodedUrl" class="img-area">
          <el-image :src="decodedUrl" fit="contain" class="preview-img" @error="onDecodeError" />
          <div class="preview-meta">{{ decodedName }}</div>
          <el-button type="success" @click="downloadImage">下载图片</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// ============ 图片 -> Base64 ============
const fileName = ref('')
const inputSize = ref(0)
const inputUrl = ref('')
const base64Text = ref('') // FileReader 读取的完整 data URL
const base64Only = ref(false)
const dragOver = ref(false)
const copying = ref(false)

// 输出内容：根据开关决定是否剥离 data 前缀
const base64Output = computed(() => {
  if (!base64Text.value) return ''
  if (base64Only.value) {
    const idx = base64Text.value.indexOf(',')
    return idx >= 0 ? base64Text.value.slice(idx + 1) : base64Text.value
  }
  return base64Text.value
})

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function resetImage() {
  if (inputUrl.value) URL.revokeObjectURL(inputUrl.value)
  fileName.value = ''
  inputSize.value = 0
  inputUrl.value = ''
  base64Text.value = ''
}

function pickFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  resetImage()
  fileName.value = file.name
  inputSize.value = file.size
  inputUrl.value = URL.createObjectURL(file)
  const reader = new FileReader()
  reader.onload = () => {
    base64Text.value = reader.result
  }
  reader.onerror = () => ElMessage.error('读取失败')
  reader.readAsDataURL(file)
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
function onDragEnter(e) {
  e.preventDefault()
}

async function copyBase64() {
  if (!base64Output.value) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(base64Output.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  } finally {
    copying.value = false
  }
}

// ============ Base64 -> 图片 ============
const base64Input = ref('')
const decodedUrl = ref('')
const decodedName = ref('')

// 通过 base64 头部特征检测图片 mime
function detectMime(b64) {
  const head = b64.slice(0, 24)
  if (head.startsWith('/9j/')) return 'image/jpeg'
  if (head.startsWith('iVBORw0KGgo')) return 'image/png'
  if (head.startsWith('R0lGOD')) return 'image/gif'
  if (head.startsWith('UklGR')) return 'image/webp'
  if (head.startsWith('Qk')) return 'image/bmp'
  return 'image/png'
}

function extFromMime(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
  }
  return map[mime] || 'png'
}

function decodeBase64() {
  const raw = base64Input.value.trim()
  if (!raw) {
    ElMessage.warning('请输入 Base64 字符串')
    return
  }
  // 去除空白字符（粘贴时常带换行）
  const cleaned = raw.replace(/\s+/g, '')
  let dataUrl, mime
  if (cleaned.startsWith('data:')) {
    dataUrl = cleaned
    const mimeMatch = cleaned.match(/^data:([^;,]+)(?:;[^,]*)?,/)
    mime = mimeMatch ? mimeMatch[1] : 'image/png'
  } else {
    mime = detectMime(cleaned)
    dataUrl = 'data:' + mime + ';base64,' + cleaned
  }
  decodedUrl.value = dataUrl
  decodedName.value = 'image.' + extFromMime(mime)
  ElMessage.success('解析成功，若图片未显示请检查字符串是否完整')
}

function resetDecoded() {
  decodedUrl.value = ''
  decodedName.value = ''
}

function onDecodeError() {
  ElMessage.error('Base64 无法解析为图片')
  resetDecoded()
}

async function downloadImage() {
  if (!decodedUrl.value) return
  try {
    const res = await fetch(decodedUrl.value)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = decodedName.value
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    ElMessage.error('下载失败：' + (err?.message || '未知错误'))
  }
}
</script>

<style scoped>
.image-base64 {
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

.base64-area {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.base64-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.base64-textarea :deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 12px;
}

.decode-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

@media (max-width: 860px) {
  .panels {
    grid-template-columns: 1fr;
  }
}
</style>
