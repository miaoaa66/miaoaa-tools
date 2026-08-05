<template>
  <div class="qrcode-gen">
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
          :rows="5"
          placeholder="输入需要生成二维码的文本（支持 URL、纯文本等）"
        />

        <div class="options">
          <div class="option-item">
            <span class="option-label">纠错等级</span>
            <el-radio-group v-model="errorLevel" size="small">
              <el-radio-button value="L">L (7%)</el-radio-button>
              <el-radio-button value="M">M (15%)</el-radio-button>
              <el-radio-button value="Q">Q (25%)</el-radio-button>
              <el-radio-button value="H">H (30%)</el-radio-button>
            </el-radio-group>
          </div>

          <div class="option-row">
            <div class="option-item">
              <span class="option-label">尺寸 (px)</span>
              <el-input-number
                v-model="size"
                :min="64"
                :max="1024"
                :step="16"
                size="small"
                controls-position="right"
              />
            </div>
            <div class="option-item">
              <span class="option-label">边距</span>
              <el-input-number
                v-model="margin"
                :min="0"
                :max="10"
                :step="1"
                size="small"
                controls-position="right"
              />
            </div>
          </div>

          <div class="option-row">
            <div class="option-item">
              <span class="option-label">前景色</span>
              <el-color-picker v-model="darkColor" size="small" />
            </div>
            <div class="option-item">
              <span class="option-label">背景色</span>
              <el-color-picker v-model="lightColor" size="small" />
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
              <el-button
                type="success"
                link
                :disabled="!dataUrl"
                @click="copyImage"
              >
                复制图片
              </el-button>
              <el-button
                type="primary"
                link
                :disabled="!dataUrl"
                @click="download"
              >
                下载 PNG
              </el-button>
            </div>
          </div>
        </template>

        <div class="preview-area">
          <canvas v-show="dataUrl" ref="canvasRef" class="qrcode-canvas" />
          <el-empty v-show="!dataUrl" description="输入文本后自动生成二维码" />
          <div v-if="errorTip" class="error-tip">{{ errorTip }}</div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'

const text = ref('')
const errorLevel = ref('M')
const size = ref(256)
const margin = ref(2)
const darkColor = ref('#000000')
const lightColor = ref('#ffffff')

const canvasRef = ref(null)
const dataUrl = ref('')
const errorTip = ref('')

const hasOptionChanged = computed(() =>
  errorLevel.value !== 'M' ||
  size.value !== 256 ||
  margin.value !== 2 ||
  darkColor.value !== '#000000' ||
  lightColor.value !== '#ffffff'
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
    const canvas = canvasRef.value
    if (!canvas) return
    await QRCode.toCanvas(canvas, content, {
      errorCorrectionLevel: errorLevel.value,
      width: size.value,
      margin: margin.value,
      color: {
        dark: darkColor.value,
        light: lightColor.value,
      },
    })
    dataUrl.value = canvas.toDataURL('image/png')
  } catch (err) {
    dataUrl.value = ''
    errorTip.value = '生成失败：' + (err?.message || '文本过长或参数异常')
  }
}

watch([text, errorLevel, size, margin, darkColor, lightColor], generate)

function reset() {
  text.value = ''
  errorLevel.value = 'M'
  size.value = 256
  margin.value = 2
  darkColor.value = '#000000'
  lightColor.value = '#ffffff'
  dataUrl.value = ''
  errorTip.value = ''
}

async function copyImage() {
  if (!dataUrl.value) return
  try {
    const res = await fetch(dataUrl.value)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    ElMessage.success('已复制图片到剪贴板')
  } catch {
    ElMessage.error('复制失败，请改用下载按钮')
  }
}

function download() {
  if (!dataUrl.value) return
  const a = document.createElement('a')
  a.href = dataUrl.value
  a.download = `qrcode-${Date.now()}.png`
  a.click()
}
</script>

<style scoped>
.qrcode-gen {
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
  min-height: 320px;
}

.qrcode-canvas {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
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
