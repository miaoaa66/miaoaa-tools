<template>
  <div class="barcode-gen">
    <div class="panels">
      <!-- 输入与配置 -->
      <el-card class="panel">
        <template #header>
          <div class="card-header">
            <span>输入与配置</span>
            <el-button v-if="text || hasOptionChanged" link type="primary" @click="reset">
              重置
            </el-button>
          </div>
        </template>

        <el-input
          v-model="text"
          type="textarea"
          :rows="4"
          :placeholder="placeholder"
        />

        <div class="options">
          <div class="option-item">
            <span class="option-label">条码类型</span>
            <el-select v-model="format" size="small" style="width: 180px">
              <el-option
                v-for="item in formatList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="option-row">
            <div class="option-item">
              <span class="option-label">宽度</span>
              <el-input-number
                v-model="width"
                :min="1"
                :max="6"
                :step="1"
                size="small"
                controls-position="right"
              />
            </div>
            <div class="option-item">
              <span class="option-label">高度 (px)</span>
              <el-input-number
                v-model="height"
                :min="20"
                :max="200"
                :step="10"
                size="small"
                controls-position="right"
              />
            </div>
          </div>

          <div class="option-row">
            <div class="option-item">
              <span class="option-label">前景色</span>
              <el-color-picker v-model="lineColor" size="small" />
            </div>
            <div class="option-item">
              <span class="option-label">背景色</span>
              <el-color-picker v-model="background" size="small" />
            </div>
            <div class="option-item">
              <el-checkbox v-model="displayValue">显示文本</el-checkbox>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 预览 -->
      <el-card class="panel">
        <template #header>
          <div class="card-header">
            <span>预览</span>
            <div class="header-actions">
              <el-button type="success" link :disabled="!dataUrl" @click="copyImage">
                复制图片
              </el-button>
              <el-button type="primary" link :disabled="!dataUrl" @click="download">
                下载 PNG
              </el-button>
            </div>
          </div>
        </template>

        <div class="preview-area">
          <svg v-show="dataUrl" ref="svgRef" class="barcode-svg" />
          <el-empty v-show="!dataUrl" description="输入文本后自动生成条形码" />
          <div v-if="errorTip" class="error-tip">{{ errorTip }}</div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import JsBarcode from 'jsbarcode'

const formatList = [
  { value: 'CODE128', label: 'CODE128（通用）' },
  { value: 'CODE39', label: 'CODE39' },
  { value: 'EAN13', label: 'EAN-13（13位数字）' },
  { value: 'EAN8', label: 'EAN-8（8位数字）' },
  { value: 'UPC', label: 'UPC-A（11/12位数字）' },
  { value: 'ITF14', label: 'ITF-14（14位数字）' },
  { value: 'MSI', label: 'MSI' },
  { value: 'pharmacode', label: 'Pharmacode' },
  { value: 'codabar', label: 'Codabar' },
]

const defaultPlaceholder = '输入需要生成条形码的文本'
const formatPlaceholderMap = {
  EAN13: '请输入 12 或 13 位数字',
  EAN8: '请输入 7 或 8 位数字',
  UPC: '请输入 11 或 12 位数字',
  ITF14: '请输入 13 或 14 位数字',
  pharmacode: '请输入 3 到 131070 之间的整数',
}

const text = ref('')
const format = ref('CODE128')
const width = ref(2)
const height = ref(100)
const lineColor = ref('#000000')
const background = ref('#ffffff')
const displayValue = ref(true)

const svgRef = ref(null)
const dataUrl = ref('')
const errorTip = ref('')

const placeholder = computed(() => formatPlaceholderMap[format.value] || defaultPlaceholder)

const hasOptionChanged = computed(() =>
  format.value !== 'CODE128' ||
  width.value !== 2 ||
  height.value !== 100 ||
  lineColor.value !== '#000000' ||
  background.value !== '#ffffff' ||
  !displayValue.value
)

async function generate() {
  const content = text.value
  if (!content) {
    dataUrl.value = ''
    errorTip.value = ''
    return
  }
  errorTip.value = ''
  try {
    await nextTick()
    const svg = svgRef.value
    if (!svg) return
    JsBarcode(svg, content, {
      format: format.value,
      width: width.value,
      height: height.value,
      lineColor: lineColor.value,
      background: background.value,
      displayValue: displayValue.value,
      fontSize: 14,
      margin: 10,
    })
    dataUrl.value = svgToPngDataUrl(svg)
  } catch (err) {
    dataUrl.value = ''
    errorTip.value = '生成失败：' + (err?.message || '文本不符合所选条码格式要求')
  }
}

function svgToPngDataUrl(svg) {
  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(svg)
  // 预览与复制使用 svg dataURL；下载 PNG 时再单独转换
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)
}

watch([text, format, width, height, lineColor, background, displayValue], generate)

function reset() {
  text.value = ''
  format.value = 'CODE128'
  width.value = 2
  height.value = 100
  lineColor.value = '#000000'
  background.value = '#ffffff'
  displayValue.value = true
  dataUrl.value = ''
  errorTip.value = ''
}

async function copyImage() {
  if (!dataUrl.value) return
  try {
    const res = await fetch(dataUrl.value)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    ElMessage.success('已复制图片到剪贴板')
  } catch {
    ElMessage.error('复制失败，请改用下载按钮')
  }
}

async function download() {
  if (!svgRef.value) return
  try {
    const pngUrl = await renderSvgToPng(svgRef.value)
    const a = document.createElement('a')
    a.href = pngUrl
    a.download = `barcode-${Date.now()}.png`
    a.click()
  } catch {
    ElMessage.error('下载失败')
  }
}

function renderSvgToPng(svg) {
  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const bbox = svg.getBoundingClientRect()
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.ceil(bbox.width)) * scale
      canvas.height = Math.max(1, Math.ceil(bbox.height)) * scale
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片转换失败'))
    }
    img.src = url
  })
}
</script>

<style scoped>
.barcode-gen {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.options {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-label {
  font-size: 13px;
  color: var(--el-text-color-primary);
  min-width: 64px;
}

.preview-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.barcode-svg {
  max-width: 100%;
  height: auto;
}

.error-tip {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-color-danger);
}

@media (max-width: 860px) {
  .panels {
    grid-template-columns: 1fr;
  }
}
</style>
