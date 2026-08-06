<template>
  <div class="image-watermark">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>图片加水印</span>
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
          <div class="preview-container">
            <div class="image-wrapper">
              <img v-if="previewUrl" :src="previewUrl" />
            </div>
          </div>
        </div>

        <div class="controls">
          <el-form label-width="84px" size="default">
            <el-form-item label="水印文字">
              <el-input v-model="watermarkText" placeholder="请输入水印文字" clearable maxlength="50" />
            </el-form-item>

            <el-form-item label="字体大小">
              <el-slider v-model="fontSize" :min="12" :max="200" :step="1"
                :format-tooltip="val => `${val}px`" />
            </el-form-item>

            <el-form-item label="字体颜色">
              <el-color-picker v-model="textColor" />
            </el-form-item>

            <el-form-item label="透明度">
              <el-slider v-model="opacity" :min="0.05" :max="1" :step="0.05"
                :format-tooltip="val => `${Math.round(val * 100)}%`" />
            </el-form-item>

            <el-form-item label="旋转角度">
              <el-slider v-model="rotate" :min="-90" :max="90" :step="1"
                :format-tooltip="val => `${val}°`" />
            </el-form-item>

            <el-form-item label="平铺水印">
              <el-switch v-model="tiled" active-text="开启" inactive-text="关闭" />
            </el-form-item>

            <el-form-item v-if="tiled" label="水平间距">
              <el-slider v-model="tileGapX" :min="0" :max="300" :step="10"
                :format-tooltip="val => `${val}px`" />
            </el-form-item>

            <el-form-item v-if="tiled" label="垂直间距">
              <el-slider v-model="tileGapY" :min="0" :max="300" :step="10"
                :format-tooltip="val => `${val}px`" />
            </el-form-item>

            <el-form-item v-if="!tiled" label="水印位置">
              <el-radio-group v-model="position">
                <el-radio-button v-for="pos in positions" :key="pos.value" :value="pos.value">
                  {{ pos.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="原图尺寸">
              <span class="meta">{{ naturalW }} × {{ naturalH }} px</span>
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
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const fileName = ref('')
const imageUrl = ref('')
const previewUrl = ref('')
const downloading = ref(false)
const dragOver = ref(false)

const naturalW = ref(0)
const naturalH = ref(0)

const watermarkText = ref('Miaoaa Tools')
const fontSize = ref(40)
const textColor = ref('#ffffff')
const opacity = ref(0.6)
const rotate = ref(-30)
const tiled = ref(false)
const tileGapX = ref(60)
const tileGapY = ref(120)
const position = ref('center')

const positions = [
  { value: 'top-left', label: '左上' },
  { value: 'top-right', label: '右上' },
  { value: 'center', label: '居中' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-right', label: '右下' },
]

let imgElement = null
let renderTimer = null

function reset() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  clearTimeout(renderTimer)
  fileName.value = ''
  imageUrl.value = ''
  previewUrl.value = ''
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
    renderWatermark()
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

// 参数变化时（防抖）重绘预览
watch([watermarkText, fontSize, textColor, opacity, rotate, tiled, tileGapX, tileGapY, position], () => {
  renderWatermark()
})

function renderWatermark() {
  if (!imgElement || !naturalW.value) return
  clearTimeout(renderTimer)
  renderTimer = setTimeout(() => {
    const canvas = generateCanvas()
    if (canvas) previewUrl.value = canvas.toDataURL('image/png')
  }, 80)
}

// 按原图尺寸生成带水印的画布
function generateCanvas() {
  if (!imgElement || !naturalW.value) return null
  const canvas = document.createElement('canvas')
  canvas.width = naturalW.value
  canvas.height = naturalH.value
  const ctx = canvas.getContext('2d')
  ctx.drawImage(imgElement, 0, 0)
  drawWatermark(ctx, naturalW.value, naturalH.value)
  return canvas
}

function drawWatermark(ctx, w, h) {
  const text = watermarkText.value.trim()
  if (!text) return
  const size = fontSize.value
  const rot = (rotate.value * Math.PI) / 180
  const font = `bold ${size}px "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif`

  ctx.save()
  ctx.globalAlpha = opacity.value
  ctx.fillStyle = textColor.value
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (tiled.value) {
    // 平铺模式：旋转坐标系后按网格铺满整张图，间距可调
    const diag = Math.hypot(w, h)
    const textW = ctx.measureText(text).width
    const stepX = textW + tileGapX.value
    const stepY = size + tileGapY.value
    const cols = Math.ceil(diag / stepX) + 2
    const rows = Math.ceil(diag / stepY) + 2

    ctx.translate(w / 2, h / 2)
    ctx.rotate(rot)
    for (let i = -cols; i <= cols; i++) {
      for (let j = -rows; j <= rows; j++) {
        ctx.fillText(text, i * stepX, j * stepY)
      }
    }
  } else {
    // 单点水印：按位置放置后再旋转
    const textW = ctx.measureText(text).width
    const margin = 40
    let x = w / 2
    let y = h / 2

    if (position.value.startsWith('top')) y = margin + size / 2
    if (position.value.startsWith('bottom')) y = h - margin - size / 2
    if (position.value.endsWith('left')) x = margin + textW / 2
    if (position.value.endsWith('right')) x = w - margin - textW / 2

    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.fillText(text, 0, 0)
  }

  ctx.restore()
}

async function download() {
  if (!imgElement || !naturalW.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  if (!watermarkText.value.trim()) {
    ElMessage.warning('请输入水印文字')
    return
  }
  downloading.value = true
  try {
    const canvas = generateCanvas()
    if (!canvas) throw new Error('生成图片失败')

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
    a.download = `${baseName}_watermark.png`
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
.image-watermark {
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

.image-wrapper {
  line-height: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 100%;
}

.image-wrapper img {
  display: block;
  max-width: 100%;
  height: auto;
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
