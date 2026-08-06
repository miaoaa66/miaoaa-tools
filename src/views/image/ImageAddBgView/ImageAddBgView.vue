<template>
  <div class="image-add-bg">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>透明图片加背景</span>
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
          <div class="el-upload__tip">支持 PNG / JPG / GIF / WebP / BMP 等格式，透明区域将被背景色填充</div>
        </template>
      </el-upload>

      <div v-else class="content-area">
        <div class="preview-area">
          <div class="preview-title">预览</div>
          <div class="preview-container">
            <div class="preview-stage">
                <div class="preview-bg" :style="bgStyle">
                  <img :src="imageUrl" class="preview-img" />
                </div>
              </div>
          </div>
        </div>

        <div class="controls">
          <el-form label-width="84px" size="default">
            <el-form-item label="背景颜色">
              <div class="color-row">
                <el-color-picker v-model="bgColor" />
                <span class="color-hex">{{ bgColor }}</span>
              </div>
            </el-form-item>

            <el-form-item label="常用色">
              <div class="preset-row">
                <div
                  v-for="color in presetColors"
                  :key="color"
                  class="preset-dot"
                  :class="{ active: bgColor === color }"
                  :style="{ backgroundColor: color }"
                  :title="color"
                  @click="bgColor = color"
                ></div>
              </div>
            </el-form-item>

            <el-form-item label="内边距">
              <div class="padding-grid">
                <div class="padding-item">
                  <span class="padding-label">上</span>
                  <el-input-number v-model="paddingTop" :min="0" :max="500" :step="1" controls-position="right"
                    size="small" style="width: 100%" />
                </div>
                <div class="padding-item">
                  <span class="padding-label">右</span>
                  <el-input-number v-model="paddingRight" :min="0" :max="500" :step="1" controls-position="right"
                    size="small" style="width: 100%" />
                </div>
                <div class="padding-item">
                  <span class="padding-label">下</span>
                  <el-input-number v-model="paddingBottom" :min="0" :max="500" :step="1" controls-position="right"
                    size="small" style="width: 100%" />
                </div>
                <div class="padding-item">
                  <span class="padding-label">左</span>
                  <el-input-number v-model="paddingLeft" :min="0" :max="500" :step="1" controls-position="right"
                    size="small" style="width: 100%" />
                </div>
              </div>
            </el-form-item>

            <el-form-item label="背景圆角">
              <el-slider v-model="borderRadius" :min="0" :max="200" :step="1" :show-tooltip="true"
                :format-tooltip="val => `${val}px`" />
              <el-input-number v-model="borderRadius" :min="0" :max="200" :step="1" controls-position="right"
                style="width: 120px; margin-top: 8px" />
            </el-form-item>

            <el-form-item label="原图尺寸">
              <span class="meta">{{ naturalW }} × {{ naturalH }} px</span>
            </el-form-item>

            <el-form-item label="输出尺寸">
              <span class="meta">{{ outW }} × {{ outH }} px</span>
            </el-form-item>

            <el-form-item label="输出格式">
              <el-radio-group v-model="outputFormat">
                <el-radio value="png">PNG</el-radio>
                <el-radio value="jpg">JPG</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="downloading" @click="download">
                保存到本地
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
const bgColor = ref('#ffffff')
const paddingTop = ref(0)
const paddingRight = ref(0)
const paddingBottom = ref(0)
const paddingLeft = ref(0)
const borderRadius = ref(0)
const outputFormat = ref('png')
const downloading = ref(false)
const dragOver = ref(false)

const naturalW = ref(0)
const naturalH = ref(0)

const outW = computed(() => naturalW.value + paddingLeft.value + paddingRight.value)
const outH = computed(() => naturalH.value + paddingTop.value + paddingBottom.value)

const bgStyle = computed(() => ({
  backgroundColor: bgColor.value,
  padding: `${paddingTop.value}px ${paddingRight.value}px ${paddingBottom.value}px ${paddingLeft.value}px`,
  borderRadius: borderRadius.value + 'px',
}))

const presetColors = ['#ffffff', '#000000', '#ff4d4f', '#ff7a45', '#faad14', '#52c41a', '#1677ff', '#722ed1', '#13c2c2', '#f0f0f0']

let imgElement = null

function reset() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  fileName.value = ''
  imageUrl.value = ''
  bgColor.value = '#ffffff'
  paddingTop.value = 0
  paddingRight.value = 0
  paddingBottom.value = 0
  paddingLeft.value = 0
  borderRadius.value = 0
  outputFormat.value = 'png'
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

async function download() {
  if (!imgElement || !naturalW.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  downloading.value = true
  try {
    const w = outW.value
    const h = outH.value
    const mime = outputFormat.value === 'jpg' ? 'image/jpeg' : 'image/png'
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    // 圆角背景（下层）：先铺满背景色，圆角外区域 PNG 保留透明、JPG 铺背景色避免黑色边角
    ctx.fillStyle = bgColor.value
    if (mime === 'image/jpeg') {
      ctx.fillRect(0, 0, w, h)
    }
    ctx.save()
    ctx.beginPath()
    roundRect(ctx, 0, 0, w, h, borderRadius.value)
    ctx.fill()
    ctx.clip()
    // 按四向内边距定位绘制原图（上层），透明区域及四周内边距由背景色填充
    ctx.drawImage(imgElement, paddingLeft.value, paddingTop.value, naturalW.value, naturalH.value)
    ctx.restore()

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('生成图片失败'))),
        mime,
        0.92,
      )
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const baseName = fileName.value.replace(/\.[^.]+$/, '') || 'image'
    a.download = `${baseName}_bg_${bgColor.value.replace('#', '')}.${outputFormat.value}`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error('保存失败：' + (err?.message || '未知错误'))
  } finally {
    downloading.value = false
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}
</script>

<style scoped>
.image-add-bg {
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
  /* 棋盘格背景便于观察透明区域 */
  background-image:
    linear-gradient(45deg, var(--checker-color) 25%, transparent 25%),
    linear-gradient(-45deg, var(--checker-color) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--checker-color) 75%),
    linear-gradient(-45deg, transparent 75%, var(--checker-color) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.preview-stage {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.preview-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.preview-img {
  display: block;
  max-width: 100%;
  max-height: 60vh;
  height: auto;
}

.controls {
  background: var(--panel-bg);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-hex {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.preset-dot:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.preset-dot.active {
  border: 2px solid var(--el-text-color-primary);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.meta {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.padding-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.padding-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.padding-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  width: 14px;
}

@media (max-width: 860px) {
  .content-area {
    grid-template-columns: 1fr;
  }
}
</style>
