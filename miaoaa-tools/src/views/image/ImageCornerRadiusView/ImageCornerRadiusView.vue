<template>
  <div class="image-corner-radius">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>图片裁剪圆角</span>
          <el-button v-if="fileName" link type="primary" @click="reset">
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

      <div v-else class="content-area">
        <div class="preview-area">
          <div class="preview-title">预览</div>
          <div class="preview-container" :style="{ backgroundColor: bgColor }">
            <div class="image-wrapper" :style="wrapperStyle">
              <img :src="imageUrl" :style="imageStyle" />
            </div>
          </div>
        </div>

        <div class="controls">
          <el-form label-width="84px" size="default">
            <el-form-item label="圆角大小">
              <el-slider v-model="radius" :min="0" :max="maxRadius" :step="1" :show-tooltip="true"
                :format-tooltip="val => `${val}px`" />
              <el-input-number v-model="radius" :min="0" :max="maxRadius" :step="1" controls-position="right"
                style="width: 120px; margin-top: 8px" />
            </el-form-item>

            <el-form-item label="背景颜色">
              <el-color-picker v-model="bgColor" show-alpha />
              <span class="tip-text">圆角区域透明时的背景填充色</span>
            </el-form-item>

            <el-form-item label="原图尺寸">
              <span class="meta">{{ naturalW }} × {{ naturalH }} px</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="downloading" @click="download">
                下载圆角图片
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
import { UploadFilled } from '@element-plus/icons-vue'

const fileName = ref('')
const imageUrl = ref('')
const radius = ref(16)
const bgColor = ref('rgba(0, 0, 0, 0)')
const downloading = ref(false)
const dragOver = ref(false)

const naturalW = ref(0)
const naturalH = ref(0)

let imgElement = null

function reset() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  fileName.value = ''
  imageUrl.value = ''
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
    naturalW.value = imgElement.naturalWidth
    naturalH.value = imgElement.naturalHeight
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

const maxRadius = computed(() => {
  if (!naturalW.value || !naturalH.value) return 200
  return Math.floor(Math.min(naturalW.value, naturalH.value) / 2)
})

const wrapperStyle = computed(() => {
  if (!naturalW.value) return {}
  return {
    borderRadius: `${radius.value}px`,
    overflow: 'hidden',
  }
})

const imageStyle = computed(() => ({
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
}))

async function download() {
  if (!imgElement || !naturalW.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  downloading.value = true
  try {
    const outW = naturalW.value
    const outH = naturalH.value

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')

    // 填充背景色
    ctx.fillStyle = bgColor.value
    ctx.fillRect(0, 0, outW, outH)

    // 裁剪圆角并绘制图片
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(0, 0, outW, outH, Math.min(radius.value, maxRadius.value))
    ctx.clip()
    ctx.drawImage(imgElement, 0, 0, outW, outH)
    ctx.restore()

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('生成图片失败'))),
        'image/png',
      )
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const baseName = fileName.value.replace(/\.[^.]+$/, '') || 'image'
    a.download = `${baseName}_rounded.png`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (err) {
    ElMessage.error('下载失败：' + (err?.message || '未知错误'))
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.image-corner-radius {
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
  grid-template-columns: minmax(0, 1fr) 400px;
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

.image-wrapper {
  line-height: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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

.tip-text {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 860px) {
  .content-area {
    grid-template-columns: 1fr;
  }
}
</style>
