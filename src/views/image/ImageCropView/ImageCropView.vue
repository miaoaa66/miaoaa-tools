<template>
  <div class="image-crop">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>图片裁剪</span>
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

      <div v-else class="crop-area">
        <div class="crop-stage" ref="stageRef">
          <img ref="imgRef" :src="imageUrl" class="crop-img" @load="onImgLoad" />
          <div class="crop-box" :class="{ circle: shape === 'circle' }" :style="boxStyle" @mousedown="startMove">
            <div class="resize-handle" @mousedown.stop="startResize"></div>
          </div>
        </div>

        <div class="controls">
          <el-form label-width="84px" size="default">
            <el-form-item label="裁剪形状">
              <el-radio-group v-model="shape" @change="onShapeChange">
                <el-radio-button value="rect">方形</el-radio-button>
                <el-radio-button value="circle">圆形</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="尺寸模式">
              <el-radio-group v-model="sizeMode">
                <el-radio-button value="ratio">宽高比例</el-radio-button>
                <el-radio-button value="pixel">像素大小</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="sizeMode === 'ratio'" label="裁剪比例">
              <el-select v-model="ratio" style="width: 160px" @change="applyRatio">
                <el-option label="自由" value="free" />
                <el-option label="1:1" value="1:1" />
                <el-option label="4:3" value="4:3" />
                <el-option label="3:4" value="3:4" />
                <el-option label="16:9" value="16:9" />
                <el-option label="9:16" value="9:16" />
              </el-select>
            </el-form-item>

            <el-form-item v-else label="输出像素">
              <el-input-number v-model="pixelW" :min="1" :step="1" controls-position="right" style="width: 120px"
                @change="applyPixel" />
              <span class="x-sep">×</span>
              <el-input-number v-model="pixelH" :min="1" :step="1" controls-position="right" style="width: 120px"
                @change="applyPixel" />
            </el-form-item>

            <el-form-item label="原图尺寸">
              <span class="meta">{{ naturalW }} × {{ naturalH }} px</span>
            </el-form-item>

            <el-form-item label="当前裁剪">
              <span class="meta">{{ currentCropText }}</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="downloading" @click="download">
                下载裁剪图片
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

// ============ 文件状态 ============
const fileName = ref('')
const imageUrl = ref('')

// ============ 图片尺寸 ============
const naturalW = ref(0) // 原图宽
const naturalH = ref(0) // 原图高
const displayW = ref(0) // 页面显示宽
const displayH = ref(0) // 页面显示高

const stageRef = ref(null)
const imgRef = ref(null)

// ============ 裁剪框（基于图片显示坐标系，单位 px） ============
const crop = reactive({ x: 0, y: 0, w: 0, h: 0 })

// ============ 配置项 ============
const shape = ref('rect') // 'rect' | 'circle'
const sizeMode = ref('ratio') // 'ratio' | 'pixel'
const ratio = ref('1:1') // 'free' | '1:1' | '4:3' | ...
const pixelW = ref(200)
const pixelH = ref(200)

const downloading = ref(false)
const dragOver = ref(false)
const MIN_SIZE = 20

let dragState = null

const boxStyle = computed(() => ({
  left: crop.x + 'px',
  top: crop.y + 'px',
  width: crop.w + 'px',
  height: crop.h + 'px',
}))

const currentCropText = computed(() => {
  if (!naturalW.value || !displayW.value) return '—'
  const sx = naturalW.value / displayW.value
  const sy = naturalH.value / displayH.value
  const w = Math.round(crop.w * sx)
  const h = Math.round(crop.h * sy)
  return `${w} × ${h} px`
})

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function reset() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  fileName.value = ''
  imageUrl.value = ''
  naturalW.value = 0
  naturalH.value = 0
  displayW.value = 0
  displayH.value = 0
  crop.x = 0
  crop.y = 0
  crop.w = 0
  crop.h = 0
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

function onImgLoad() {
  const img = imgRef.value
  if (!img) return
  naturalW.value = img.naturalWidth
  naturalH.value = img.naturalHeight
  measureDisplay()
  initCrop()
}

function measureDisplay() {
  const img = imgRef.value
  if (!img) return
  const rect = img.getBoundingClientRect()
  displayW.value = rect.width
  displayH.value = rect.height
}

function initCrop() {
  const dw = displayW.value
  const dh = displayH.value
  if (!dw || !dh) return
  let w = dw * 0.8
  let h = dh * 0.8
  const r = getLockRatio()
  if (r !== null) {
    if (w / h > r) w = h * r
    else h = w / r
  }
  crop.w = w
  crop.h = h
  crop.x = (dw - w) / 2
  crop.y = (dh - h) / 2
}

// 计算当前应锁定的宽高比（圆形 → 1；比例模式且非自由 → 比例值；否则 null）
function getLockRatio() {
  if (shape.value === 'circle') return 1
  if (sizeMode.value === 'ratio' && ratio.value !== 'free') {
    const [rw, rh] = ratio.value.split(':').map(Number)
    return rw / rh
  }
  return null
}

function onShapeChange() {
  if (shape.value === 'circle') {
    const s = Math.min(crop.w, crop.h)
    crop.w = s
    crop.h = s
    crop.x = clamp(crop.x, 0, displayW.value - crop.w)
    crop.y = clamp(crop.y, 0, displayH.value - crop.h)
    // 同步像素值
    if (sizeMode.value === 'pixel') {
      const p = Math.min(pixelW.value, pixelH.value)
      pixelW.value = p
      pixelH.value = p
    }
  }
}

function applyRatio() {
  if (sizeMode.value !== 'ratio') return
  const r = getLockRatio()
  if (r === null) return
  let w = crop.w
  let h = w / r
  if (h > displayH.value) {
    h = displayH.value
    w = h * r
  }
  if (w > displayW.value) {
    w = displayW.value
    h = w / r
  }
  if (shape.value === 'circle') {
    const s = Math.min(w, h)
    w = s
    h = s
  }
  crop.w = w
  crop.h = h
  crop.x = clamp(crop.x, 0, displayW.value - crop.w)
  crop.y = clamp(crop.y, 0, displayH.value - crop.h)
}

function applyPixel() {
  if (sizeMode.value !== 'pixel') return
  if (!naturalW.value || !displayW.value) return
  // 圆形时强制正方形像素
  if (shape.value === 'circle' && pixelW.value !== pixelH.value) {
    const p = Math.min(pixelW.value, pixelH.value)
    pixelW.value = p
    pixelH.value = p
  }
  const sx = displayW.value / naturalW.value
  let w = pixelW.value * sx
  let h = pixelH.value * sx
  if (w > displayW.value) w = displayW.value
  if (h > displayH.value) h = displayH.value
  if (shape.value === 'circle') {
    const s = Math.min(w, h)
    w = s
    h = s
  }
  crop.w = w
  crop.h = h
  crop.x = clamp(crop.x, 0, displayW.value - crop.w)
  crop.y = clamp(crop.y, 0, displayH.value - crop.h)
}

// 切换到像素模式时，按当前裁剪框反推像素值
watch(sizeMode, (val) => {
  if (val === 'pixel' && naturalW.value && displayW.value) {
    const sx = naturalW.value / displayW.value
    pixelW.value = Math.max(1, Math.round(crop.w * sx))
    pixelH.value = Math.max(1, Math.round(crop.h * sx))
    if (shape.value === 'circle') {
      const p = Math.min(pixelW.value, pixelH.value)
      pixelW.value = p
      pixelH.value = p
    }
  }
})

function startMove(e) {
  e.preventDefault()
  e.stopPropagation()
  dragState = {
    type: 'move',
    startX: e.clientX,
    startY: e.clientY,
    origX: crop.x,
    origY: crop.y,
  }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', endDrag)
}

function startResize(e) {
  e.preventDefault()
  e.stopPropagation()
  dragState = {
    type: 'resize',
    startX: e.clientX,
    startY: e.clientY,
    origW: crop.w,
    origH: crop.h,
  }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', endDrag)
}

function onDragMove(e) {
  if (!dragState) return
  const dx = e.clientX - dragState.startX
  const dy = e.clientY - dragState.startY
  const dw = displayW.value
  const dh = displayH.value

  if (dragState.type === 'move') {
    crop.x = clamp(dragState.origX + dx, 0, dw - crop.w)
    crop.y = clamp(dragState.origY + dy, 0, dh - crop.h)
  } else if (dragState.type === 'resize') {
    let newW = Math.max(MIN_SIZE, dragState.origW + dx)
    let newH = Math.max(MIN_SIZE, dragState.origH + dy)

    const r = getLockRatio()
    if (r !== null) {
      // 取变化量较大的方向作为基准，保持比例
      if (Math.abs(dx) >= Math.abs(dy)) {
        newH = newW / r
      } else {
        newW = newH * r
      }
    }

    // 限制不超过图片显示边界 - 当前位置
    const maxW = dw - crop.x
    const maxH = dh - crop.y
    if (newW > maxW) {
      newW = maxW
      if (r !== null) newH = newW / r
    }
    if (newH > maxH) {
      newH = maxH
      if (r !== null) newW = newH * r
    }
    if (newW < MIN_SIZE) newW = MIN_SIZE
    if (newH < MIN_SIZE) newH = MIN_SIZE

    crop.w = newW
    crop.h = newH

    // 像素模式下回填像素值
    if (sizeMode.value === 'pixel' && naturalW.value && displayW.value) {
      const sx = naturalW.value / displayW.value
      const sy = naturalH.value / displayH.value
      pixelW.value = Math.max(1, Math.round(crop.w * sx))
      pixelH.value = Math.max(1, Math.round(crop.h * sy))
    }
  }
}

function endDrag() {
  dragState = null
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', endDrag)
}

async function download() {
  if (!imgRef.value || !naturalW.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  downloading.value = true
  try {
    const sx = naturalW.value / displayW.value
    const sy = naturalH.value / displayH.value

    // 原图裁剪区域
    const srcX = crop.x * sx
    const srcY = crop.y * sy
    const srcW = crop.w * sx
    const srcH = crop.h * sy

    // 输出尺寸
    let outW, outH
    if (sizeMode.value === 'pixel') {
      outW = Math.max(1, pixelW.value)
      outH = Math.max(1, pixelH.value)
    } else {
      outW = Math.max(1, Math.round(srcW))
      outH = Math.max(1, Math.round(srcH))
    }

    // 圆形：输出正方形画布，按较小的边
    if (shape.value === 'circle') {
      const s = Math.min(outW, outH)
      outW = s
      outH = s
    }

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')

    if (shape.value === 'circle') {
      ctx.save()
      ctx.beginPath()
      ctx.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2)
      ctx.clip()
    }

    ctx.drawImage(imgRef.value, srcX, srcY, srcW, srcH, 0, 0, outW, outH)

    if (shape.value === 'circle') {
      ctx.restore()
    }

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob 返回空'))),
        'image/png',
      )
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const baseName = fileName.value.replace(/\.[^.]+$/, '') || 'image'
    a.download = `${baseName}_crop${shape.value === 'circle' ? '_circle' : ''}.png`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (err) {
    ElMessage.error('下载失败：' + (err?.message || '未知错误'))
  } finally {
    downloading.value = false
  }
}

// 窗口尺寸变化时，按比例调整裁剪框
function onWindowResize() {
  if (!imgRef.value || !naturalW.value) return
  const oldDw = displayW.value
  const oldDh = displayH.value
  measureDisplay()
  const newDw = displayW.value
  const newDh = displayH.value
  if (!oldDw || !oldDh) return
  const rx = newDw / oldDw
  const ry = newDh / oldDh
  crop.x *= rx
  crop.y *= ry
  crop.w *= rx
  crop.h *= ry
}

onMounted(() => {
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', endDrag)
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
})
</script>

<style scoped>
.image-crop {
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

.crop-area {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  align-items: start;
}

.crop-stage {
  position: relative;
  display: inline-block;
  max-width: 100%;
  user-select: none;
  line-height: 0;
  background: var(--stage-bg);
  border-radius: 4px;
  padding: 0;
  overflow: hidden;
}

.crop-img {
  display: block;
  max-width: 100%;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.crop-box {
  position: absolute;
  border: 2px solid #409eff;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.22);
  cursor: move;
  box-sizing: border-box;
}

.crop-box.circle {
  border-radius: 50%;
}

.resize-handle {
  position: absolute;
  right: -7px;
  bottom: -7px;
  width: 14px;
  height: 14px;
  background: #fff;
  border: 1px solid #409eff;
  border-radius: 2px;
  cursor: nwse-resize;
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

.x-sep {
  margin: 0 8px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 860px) {
  .crop-area {
    grid-template-columns: 1fr;
  }
}
</style>
