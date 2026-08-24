<template>
  <div class="image-rotate">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>图片旋转</span>
          <el-button v-if="fileName" link type="primary" @click="reset">重置</el-button>
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

      <div v-else class="content-area">
        <div class="preview-area">
          <div class="preview-title">预览</div>
          <div class="preview-container">
            <div class="image-wrapper" :style="wrapperStyle">
              <img :src="imageUrl" :style="imageStyle" />
            </div>
          </div>
        </div>

        <div class="controls">
          <el-form label-width="84px" size="default">
            <el-form-item label="快捷旋转">
              <el-button-group>
                <el-button :disabled="!fileName" @click="rotate(-90)">左转90°</el-button>
                <el-button :disabled="!fileName" @click="rotate(90)">右转90°</el-button>
                <el-button :disabled="!fileName" @click="rotate(180)">旋转180°</el-button>
              </el-button-group>
            </el-form-item>

            <el-form-item label="任意角度">
              <el-slider v-model="angle" :min="-360" :max="360" :step="1" />
              <el-input-number v-model="angle" :min="-360" :max="360" :step="1" controls-position="right"
                style="width: 120px; margin-top: 8px" @change="onAngleChange" />
            </el-form-item>

            <el-form-item label="原图尺寸">
              <span class="meta">{{ naturalW }} × {{ naturalH }} px</span>
            </el-form-item>

            <el-form-item label="旋转后尺寸">
              <span class="meta">{{ outW }} × {{ outH }} px</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="downloading" @click="download">保存到本地</el-button>
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
import { UploadFilled } from '@element-plus/icons-vue'

const fileName = ref('')
const imageUrl = ref('')
const angle = ref(0)
const downloading = ref(false)
const dragOver = ref(false)

const naturalW = ref(0)
const naturalH = ref(0)

let imgElement = null

function reset() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  fileName.value = ''
  imageUrl.value = ''
  angle.value = 0
  naturalW.value = 0
  naturalH.value = 0
  imgElement = null
}

function pickFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  reset()
  fileName.value = file.name
  imageUrl.value = URL.createObjectURL(file)

  imgElement = new Image()
  imgElement.onload = () => {
    naturalW.value = imgElement.width
    naturalH.value = imgElement.height
  }
  imgElement.src = imageUrl.value
}

function onFileChange(uploadFile) {
  pickFile(uploadFile?.raw ?? uploadFile)
}
function onDrop(e) {
  dragOver.value = false
  pickFile(e.dataTransfer?.files?.[0])
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

function normalizeAngle(deg) {
  // 归一到 [0, 360)
  return ((deg % 360) + 360) % 360
}

function rotate(deg) {
  angle.value = normalizeAngle(angle.value + deg)
}

function onAngleChange(val) {
  angle.value = normalizeAngle(val ?? 0)
}

// 旋转后外接矩形尺寸
const outW = computed(() => {
  if (!naturalW.value) return 0
  const rad = (normalizeAngle(angle.value) * Math.PI) / 180
  return Math.round(
    Math.abs(naturalW.value * Math.cos(rad)) + Math.abs(naturalH.value * Math.sin(rad)),
  )
})

const outH = computed(() => {
  if (!naturalH.value) return 0
  const rad = (normalizeAngle(angle.value) * Math.PI) / 180
  return Math.round(
    Math.abs(naturalW.value * Math.sin(rad)) + Math.abs(naturalH.value * Math.cos(rad)),
  )
})

const wrapperStyle = computed(() => ({
  lineHeight: 0,
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
}))

const imageStyle = computed(() => ({
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
  transform: `rotate(${angle.value}deg)`,
  transition: 'transform 0.3s ease',
}))

function getOutputMime() {
  if (!fileName.value) return 'image/png'
  const ext = fileName.value.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  return 'image/png'
}

async function download() {
  if (!imgElement || !naturalW.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  downloading.value = true
  try {
    const w = outW.value
    const h = outH.value
    const rad = (normalizeAngle(angle.value) * Math.PI) / 180
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    // 以画布中心为原点旋转绘制（背景透明）
    ctx.translate(w / 2, h / 2)
    ctx.rotate(rad)
    ctx.drawImage(imgElement, -naturalW.value / 2, -naturalH.value / 2)

    const mime = getOutputMime()
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('生成图片失败'))),
        mime,
      )
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const baseName = fileName.value.replace(/\.[^.]+$/, '') || 'image'
    const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'
    a.download = `${baseName}_rotate_${angle.value}°.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error('保存失败：' + (err?.message || '未知错误'))
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.image-rotate {
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

.content-area {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  align-items: start;
}

.preview-area {
  background: var(--panel-bg);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border-radius: 4px;
  min-height: 200px;
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
}

@media (max-width: 860px) {
  .content-area {
    grid-template-columns: 1fr;
  }
}
</style>
