<template>
  <div class="image-svg">
    <div class="panels">
      <!-- 图片 -> SVG -->
      <el-card class="panel">
        <template #header>
          <div class="card-header">
            <span>图片转 SVG</span>
            <el-button v-if="imgFileName" link type="primary" @click="resetImg">
              重置
            </el-button>
          </div>
        </template>

        <el-upload
          v-if="!imgFileName"
          drag
          accept="image/*"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onImgFileChange"
          class="uploader"
          @drop="onImgDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @dragenter="onDragEnter"
        >
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">
            拖拽图片到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">支持 PNG / JPG / GIF / WebP 等格式</div>
          </template>
        </el-upload>

        <div v-else class="img-area">
          <el-image :src="imgUrl" fit="contain" class="preview-img" />
          <div class="preview-meta">
            {{ imgFileName }} · {{ formatSize(imgFileSize) }} · {{ imgWidth }}×{{ imgHeight }}
          </div>
        </div>

        <div v-if="imgFileName" class="options">
          <div class="option-row">
            <label>输出模式</label>
            <el-radio-group v-model="imgSvgMode" size="small">
              <el-radio-button value="embed">内嵌位图</el-radio-button>
              <el-radio-button value="trace">矢量化轮廓</el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="imgSvgMode === 'trace'" class="option-row">
            <label>二值化阈值</label>
            <el-slider
              v-model="traceThreshold"
              :min="0"
              :max="255"
              :show-tooltip="true"
            />
          </div>
        </div>

        <div v-if="imgSvgResult" class="result-area">
          <div class="result-head">
            <el-checkbox v-model="showSvgPreviewImg">预览 SVG 渲染结果</el-checkbox>
            <div class="actions">
              <el-button type="primary" link :loading="copyingSvg" @click="copyImgSvg">
                复制 SVG
              </el-button>
              <el-button type="success" link @click="downloadImgSvg">
                下载 SVG
              </el-button>
            </div>
          </div>
          <el-image
            v-if="showSvgPreviewImg"
            :src="'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(imgSvgResult)"
            fit="contain"
            class="svg-preview-img"
          />
          <el-input
            :model-value="imgSvgResult"
            type="textarea"
            :rows="8"
            readonly
            class="svg-textarea"
          />
        </div>
      </el-card>

      <!-- SVG -> 图片 -->
      <el-card class="panel">
        <template #header>
          <div class="card-header">
            <span>SVG 转图片</span>
            <el-button v-if="svgFileName || svgTextInput" link type="primary" @click="resetSvg">
              重置
            </el-button>
          </div>
        </template>

        <el-upload
          v-if="!svgFileName && !svgTextInput"
          drag
          accept=".svg,image/svg+xml"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onSvgFileChange"
          class="uploader"
          @drop="onSvgDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @dragenter="onDragEnter"
        >
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">
            拖拽 SVG 到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">支持 .svg 格式文件</div>
          </template>
        </el-upload>

        <div v-if="!svgFileName && !svgTextInput" class="svg-text-hint">
          或粘贴 SVG 代码：
        </div>
        <el-input
          v-model="svgTextInput"
          type="textarea"
          :rows="5"
          placeholder="粘贴 SVG 代码，以 <svg 开头..."
          @input="onSvgTextInput"
        />

        <div v-if="svgContent" class="options">
          <div class="option-row">
            <label>输出格式</label>
            <el-radio-group v-model="svgOutputFormat" size="small">
              <el-radio-button value="png">PNG</el-radio-button>
              <el-radio-button value="jpeg">JPEG</el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="svgOutputFormat === 'jpeg'" class="option-row">
            <label>质量</label>
            <el-slider v-model="svgJpegQuality" :min="0.1" :max="1" :step="0.05" />
          </div>
          <div class="option-row">
            <label>缩放倍数</label>
            <el-slider v-model="svgScale" :min="1" :max="5" :step="0.5" :show-tooltip="true" />
          </div>
        </div>

        <div v-if="svgImgResult" class="result-area">
          <div class="result-head">
            <span class="result-size">{{ svgImgWidth }}×{{ svgImgHeight }}</span>
            <el-button type="success" link @click="downloadSvgImg">
              下载图片
            </el-button>
          </div>
          <el-image :src="svgImgResult" fit="contain" class="preview-img" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

// ============ 公共工具 ============
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function onDragOver() {}
function onDragLeave() {}
function onDragEnter(e) {
  e.preventDefault()
}

// ============ 图片 -> SVG ============
const imgFileName = ref('')
const imgFileSize = ref(0)
const imgUrl = ref('')
const imgWidth = ref(0)
const imgHeight = ref(0)
const imgSvgMode = ref('embed')
const traceThreshold = ref(128)
const imgSvgResult = ref('')
const showSvgPreviewImg = ref(true)
const copyingSvg = ref(false)

const imgCanvasEl = ref(null)

watch([imgUrl, imgSvgMode, traceThreshold], () => {
  if (imgUrl.value && imgWidth.value && imgHeight.value) {
    generateImgSvg()
  }
})

function resetImg() {
  if (imgUrl.value) URL.revokeObjectURL(imgUrl.value)
  imgFileName.value = ''
  imgFileSize.value = 0
  imgUrl.value = ''
  imgWidth.value = 0
  imgHeight.value = 0
  imgSvgResult.value = ''
}

function pickImgFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  resetImg()
  imgFileName.value = file.name
  imgFileSize.value = file.size
  imgUrl.value = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    imgWidth.value = img.naturalWidth
    imgHeight.value = img.naturalHeight
  }
  img.onerror = () => ElMessage.error('图片加载失败')
  img.src = imgUrl.value
}

function onImgFileChange(uploadFile) {
  const raw = uploadFile?.raw ?? uploadFile
  pickImgFile(raw)
}

function onImgDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  pickImgFile(file)
}

async function generateImgSvg() {
  try {
    if (imgSvgMode.value === 'embed') {
      // 将图片转为 base64 并嵌入 SVG
      const res = await fetch(imgUrl.value)
      const blob = await res.blob()
      const reader = new FileReader()
      reader.onload = () => {
        const b64 = reader.result
        const mime = blob.type || 'image/png'
        const w = imgWidth.value
        const h = imgHeight.value
        imgSvgResult.value =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n` +
          `  <image width="${w}" height="${h}" xlink:href="${b64}" />\n` +
          `</svg>`
      }
      reader.onerror = () => ElMessage.error('读取失败')
      reader.readAsDataURL(blob)
    } else {
      // 矢量化轮廓：二值化 + 简单路径追踪
      const canvas = document.createElement('canvas')
      canvas.width = imgWidth.value
      canvas.height = imgHeight.value
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = data.data
        const w = canvas.width
        const h = canvas.height
        // 转灰度 + 二值化 (0 = 背景, 1 = 前景)
        const bw = new Uint8Array(w * h)
        for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3]
          const gray = 0.299 * r + 0.587 * g + 0.114 * b
          // alpha < 128 视为透明背景
          bw[p] = a < 128 ? 0 : gray < traceThreshold.value ? 1 : 0
        }
        // Marching Squares 简化版：按行扫描生成矩形路径
        const paths = []
        const visited = new Uint8Array(w * h)
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x
            if (bw[idx] === 1 && visited[idx] === 0) {
              // 找向右最大连续宽度
              let x2 = x
              while (x2 + 1 < w && bw[y * w + x2 + 1] === 1 && visited[y * w + x2 + 1] === 0) x2++
              // 找向下最大同宽高度
              let y2 = y
              let ok = true
              while (ok && y2 + 1 < h) {
                for (let k = x; k <= x2; k++) {
                  if (bw[(y2 + 1) * w + k] !== 1 || visited[(y2 + 1) * w + k] !== 0) {
                    ok = false
                    break
                  }
                }
                if (ok) y2++
              }
              // 标记访问
              for (let yy = y; yy <= y2; yy++) {
                for (let xx = x; xx <= x2; xx++) {
                  visited[yy * w + xx] = 1
                }
              }
              const rw = x2 - x + 1
              const rh = y2 - y + 1
              paths.push(`<rect x="${x}" y="${y}" width="${rw}" height="${rh}" />`)
            }
          }
        }
        imgSvgResult.value =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">\n` +
          `  <g fill="#000">\n` +
          (paths.length ? '    ' + paths.join('\n    ') + '\n' : '') +
          `  </g>\n` +
          `</svg>`
      }
      img.onerror = () => ElMessage.error('图片加载失败')
      img.src = imgUrl.value
    }
  } catch (e) {
    ElMessage.error('生成 SVG 失败：' + (e?.message || '未知错误'))
  }
}

async function copyImgSvg() {
  if (!imgSvgResult.value) return
  copyingSvg.value = true
  try {
    await navigator.clipboard.writeText(imgSvgResult.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  } finally {
    copyingSvg.value = false
  }
}

function downloadImgSvg() {
  if (!imgSvgResult.value) return
  const blob = new Blob([imgSvgResult.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const base = imgFileName.value.replace(/\.[^.]+$/, '') || 'image'
  a.download = `${base}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

// ============ SVG -> 图片 ============
const svgFileName = ref('')
const svgTextInput = ref('')
const svgContent = ref('')
const svgOutputFormat = ref('png')
const svgJpegQuality = ref(0.92)
const svgScale = ref(1)
const svgImgResult = ref('')
const svgImgWidth = ref(0)
const svgImgHeight = ref(0)

watch([svgContent, svgOutputFormat, svgJpegQuality, svgScale], () => {
  if (svgContent.value) {
    generateSvgImg()
  }
})

function resetSvg() {
  svgFileName.value = ''
  svgTextInput.value = ''
  svgContent.value = ''
  svgImgResult.value = ''
  svgImgWidth.value = 0
  svgImgHeight.value = 0
}

function readSvgFile(file) {
  if (!file) return
  if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) {
    ElMessage.error('请选择 SVG 文件')
    return
  }
  resetSvg()
  svgFileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || '')
    svgContent.value = text
    svgTextInput.value = text
  }
  reader.onerror = () => ElMessage.error('读取失败')
  reader.readAsText(file, 'utf-8')
}

function onSvgFileChange(uploadFile) {
  const raw = uploadFile?.raw ?? uploadFile
  readSvgFile(raw)
}

function onSvgDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  readSvgFile(file)
}

function onSvgTextInput(val) {
  const s = (val || '').trim()
  if (s.startsWith('<svg') || s.startsWith('<?xml')) {
    svgFileName.value = ''
    svgContent.value = val
  } else if (!s) {
    svgContent.value = ''
  }
}

function getSvgSize(svgText) {
  // 解析 width / height / viewBox
  const parser = new DOMParser()
  try {
    const doc = parser.parseFromString(svgText, 'image/svg+xml')
    const errNode = doc.querySelector('parsererror')
    if (errNode) return null
    const svg = doc.documentElement
    let w = parseFloat(svg.getAttribute('width'))
    let h = parseFloat(svg.getAttribute('height'))
    const vb = svg.getAttribute('viewBox')
    if ((!w || !h) && vb) {
      const parts = vb.split(/[\s,]+/).map(Number)
      if (parts.length === 4) {
        if (!w) w = parts[2]
        if (!h) h = parts[3]
      }
    }
    if (!w || !h) {
      w = 800
      h = 600
    }
    return { w, h, svgElement: svg, doc }
  } catch {
    return null
  }
}

async function generateSvgImg() {
  const info = getSvgSize(svgContent.value)
  if (!info) {
    ElMessage.warning('SVG 内容无效，无法解析')
    svgImgResult.value = ''
    return
  }
  const { w, h } = info
  const outW = Math.round(w * svgScale.value)
  const outH = Math.round(h * svgScale.value)
  svgImgWidth.value = outW
  svgImgHeight.value = outH
  try {
    // 将 svg 字符串作为 data URL
    const svgBlob = new Blob([svgContent.value], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (svgOutputFormat.value === 'jpeg') {
        // 白色背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, outW, outH)
      }
      ctx.drawImage(img, 0, 0, outW, outH)
      const mime = svgOutputFormat.value === 'jpeg' ? 'image/jpeg' : 'image/png'
      const quality = svgOutputFormat.value === 'jpeg' ? svgJpegQuality.value : undefined
      canvas.toBlob(
        (blob) => {
          if (svgImgResult.value) URL.revokeObjectURL(svgImgResult.value)
          const resultUrl = URL.createObjectURL(blob)
          svgImgResult.value = resultUrl
        },
        mime,
        quality,
      )
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      ElMessage.error('SVG 渲染失败')
      URL.revokeObjectURL(url)
    }
    img.src = url
  } catch (e) {
    ElMessage.error('生成图片失败：' + (e?.message || '未知错误'))
  }
}

function downloadSvgImg() {
  if (!svgImgResult.value) return
  const a = document.createElement('a')
  a.href = svgImgResult.value
  const base = svgFileName.value ? svgFileName.value.replace(/\.[^.]+$/, '') : 'svg'
  const ext = svgOutputFormat.value === 'jpeg' ? 'jpg' : 'png'
  a.download = `${base}.${ext}`
  a.click()
}
</script>

<style scoped>
.image-svg {
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

.svg-preview-img {
  width: 100%;
  max-height: 220px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  margin-bottom: 8px;
}

.preview-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.options {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.option-row {
  display: grid;
  grid-template-columns: 90px 1fr;
  align-items: center;
  gap: 12px;
}

.option-row > label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.svg-text-hint {
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.result-area {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.result-head .actions {
  display: flex;
  gap: 4px;
}

.result-size {
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.svg-textarea :deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 11px;
  white-space: pre;
  overflow-x: auto;
}

@media (max-width: 860px) {
  .panels {
    grid-template-columns: 1fr;
  }
}
</style>
