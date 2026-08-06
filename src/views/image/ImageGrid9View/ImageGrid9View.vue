<template>
  <div class="image-grid9">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>图片九宫格切图</span>
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
          <div class="el-upload__tip">支持 PNG / JPG / GIF / WebP / BMP 等格式，将按 3 × 3 切分为 9 块</div>
        </template>
      </el-upload>

      <div v-else class="grid-area">
        <div class="stage-wrap">
          <div class="stage">
            <img ref="imgRef" :src="imageUrl" class="stage-img" @load="onImgLoad" />
            <div class="grid-overlay">
              <div v-for="i in 9" :key="i" class="grid-cell"
                :class="{ active: hoverIndex === i - 1 }"
                @mouseenter="hoverIndex = i - 1"
                @mouseleave="hoverIndex = -1">
                <span class="cell-index">{{ i }}</span>
              </div>
            </div>
          </div>
          <div class="stage-meta">
            <span class="meta">原图：{{ naturalW }} × {{ naturalH }} px</span>
            <span v-if="cutMode === 'square'" class="meta">
              正方形裁剪：{{ squareSize }} × {{ squareSize }} px（居中）
            </span>
            <span class="meta">单块：{{ cellW }} × {{ cellH }} px</span>
          </div>
        </div>

        <div class="controls">
          <el-form label-width="84px" size="default">
            <el-form-item label="切分模式">
              <el-radio-group v-model="cutMode">
                <el-radio-button value="equal">原图等分</el-radio-button>
                <el-radio-button value="square">正方形居中</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="输出格式">
              <el-radio-group v-model="outFormat">
                <el-radio-button value="png">PNG</el-radio-button>
                <el-radio-button value="jpeg">JPEG</el-radio-button>
                <el-radio-button value="webp">WebP</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="outFormat === 'jpeg'" label="JPEG质量">
              <el-slider v-model="quality" :min="0.1" :max="1" :step="0.05" show-input style="padding-right: 8px" />
            </el-form-item>

            <el-form-item label="原图尺寸">
              <span class="meta">{{ naturalW }} × {{ naturalH }} px</span>
            </el-form-item>

            <el-form-item label="单块尺寸">
              <span class="meta">{{ cellW }} × {{ cellH }} px</span>
            </el-form-item>

            <el-form-item label="文件命名">
              <span class="meta">{{ filePrefix }}_1.{{ outExt }} ~ {{ filePrefix }}_9.{{ outExt }}</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="generating" @click="generateAll">
                {{ slices.length ? '重新生成' : '生成切片' }}
              </el-button>
              <el-button v-if="slices.length" type="success" :loading="downloadingAll" @click="downloadAll">
                全部下载
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div v-if="slices.length" class="slices-wrap">
        <div class="slices-title">切片预览（点击可单独下载）</div>
        <div class="slices-grid">
          <div v-for="(s, i) in slices" :key="i" class="slice-item"
            :class="{ active: hoverIndex === i }"
            @mouseenter="hoverIndex = i"
            @mouseleave="hoverIndex = -1"
            @click="downloadOne(i)">
            <img :src="s.url" class="slice-img" />
            <div class="slice-mask">
              <el-icon :size="20"><Download /></el-icon>
              <span>{{ s.w }}×{{ s.h }}</span>
            </div>
            <div class="slice-no">{{ i + 1 }}</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

// ============ 文件状态 ============
const fileName = ref('')
const imageUrl = ref('')
const naturalW = ref(0)
const naturalH = ref(0)
const imgRef = ref(null)

// ============ 配置项 ============
const cutMode = ref('equal') // 'equal' | 'square'
const outFormat = ref('png') // 'png' | 'jpeg' | 'webp'
const quality = ref(0.9)
const hoverIndex = ref(-1)

// ============ 生成结果 ============
const generating = ref(false)
const downloadingAll = ref(false)
const slices = ref([]) // [{ url, blob, w, h, name }]

// ============ 计算属性 ============
const squareSize = computed(() => {
  if (!naturalW.value || !naturalH.value) return 0
  return Math.min(naturalW.value, naturalH.value)
})

const cellW = computed(() => {
  if (!naturalW.value) return 0
  if (cutMode.value === 'square') return Math.floor(squareSize.value / 3)
  return Math.floor(naturalW.value / 3)
})

const cellH = computed(() => {
  if (!naturalH.value) return 0
  if (cutMode.value === 'square') return Math.floor(squareSize.value / 3)
  return Math.floor(naturalH.value / 3)
})

const outExt = computed(() => (outFormat.value === 'jpeg' ? 'jpg' : outFormat.value))
const filePrefix = computed(() => fileName.value.replace(/\.[^.]+$/, '') || 'image')
const mime = computed(() => `image/${outFormat.value}`)

// ============ 文件读取 ============
function reset() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  clearSlices()
  fileName.value = ''
  imageUrl.value = ''
  naturalW.value = 0
  naturalH.value = 0
}

function clearSlices() {
  slices.value.forEach((s) => s.url && URL.revokeObjectURL(s.url))
  slices.value = []
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

function onImgLoad() {
  const img = imgRef.value
  if (!img) return
  naturalW.value = img.naturalWidth
  naturalH.value = img.naturalHeight
}

// 切分模式或输出格式变化时，旧切片已失效，清空让用户重新生成
watch([cutMode, outFormat, quality], () => {
  if (slices.value.length) clearSlices()
})

// ============ 切图：Canvas drawImage ============
async function generateAll() {
  if (!imgRef.value || !naturalW.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  generating.value = true
  try {
    clearSlices()

    // 计算源图裁剪区域
    let srcX, srcY, srcW, srcH
    if (cutMode.value === 'square') {
      const s = squareSize.value
      srcW = s
      srcH = s
      srcX = Math.floor((naturalW.value - s) / 2)
      srcY = Math.floor((naturalH.value - s) / 2)
    } else {
      srcX = 0
      srcY = 0
      srcW = naturalW.value
      srcH = naturalH.value
    }

    const cw = Math.floor(srcW / 3)
    const ch = Math.floor(srcH / 3)
    if (cw < 1 || ch < 1) {
      ElMessage.error('图片过小，无法切分')
      return
    }

    const img = imgRef.value
    const q = outFormat.value === 'jpeg' ? quality.value : undefined
    const results = []
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const canvas = document.createElement('canvas')
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext('2d')
        const sx = srcX + col * cw
        const sy = srcY + row * ch
        ctx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch)
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('toBlob 返回空'))),
            mime.value,
            q,
          )
        })
        results.push({
          url: URL.createObjectURL(blob),
          blob,
          w: cw,
          h: ch,
          name: `${filePrefix.value}_${row * 3 + col + 1}.${outExt.value}`,
        })
      }
    }
    slices.value = results
    ElMessage.success('已生成 9 个切片')
  } catch (err) {
    ElMessage.error('生成失败：' + (err?.message || '未知错误'))
  } finally {
    generating.value = false
  }
}

function downloadOne(i) {
  const s = slices.value[i]
  if (!s) return
  const a = document.createElement('a')
  a.href = s.url
  a.download = s.name
  a.click()
}

async function downloadAll() {
  if (!slices.value.length) return
  downloadingAll.value = true
  try {
    for (let i = 0; i < slices.value.length; i++) {
      downloadOne(i)
      // 间隔触发，避免浏览器拦截多文件下载
      await new Promise((r) => setTimeout(r, 300))
    }
    ElMessage.success('已开始下载全部 9 个切片')
  } finally {
    downloadingAll.value = false
  }
}

onBeforeUnmount(() => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  clearSlices()
})
</script>

<style scoped>
.image-grid9 {
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

.grid-area {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  align-items: start;
}

.stage-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stage {
  position: relative;
  display: inline-block;
  max-width: 100%;
  line-height: 0;
  background: var(--stage-bg);
  border-radius: 4px;
  overflow: hidden;
  user-select: none;
}

.stage-img {
  display: block;
  max-width: 100%;
  height: auto;
  -webkit-user-drag: none;
  pointer-events: none;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.grid-cell {
  /* 双色边框：白主线 + 黑内阴影，确保在任意背景下都可见 */
  border-right: 1px solid rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: inset -1px -1px 0 rgba(0, 0, 0, 0.35);
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 4px 6px;
  transition: background-color 0.15s ease;
}

.grid-cell:nth-child(3n) {
  border-right: none;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.35);
}

.grid-cell:nth-child(n + 7) {
  border-bottom: none;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.35);
}

.grid-cell:nth-child(3n):nth-child(n + 7) {
  box-shadow: none;
}

.grid-cell.active {
  background-color: rgba(64, 158, 255, 0.55);
}

.cell-index {
  font-size: 12px;
  color: #fff;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.9), 0 1px 2px rgba(0, 0, 0, 0.9);
  line-height: 1;
}

.stage-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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

.slices-wrap {
  margin-top: 20px;
}

.slices-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.slices-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 600px;
}

.slice-item {
  position: relative;
  background: var(--stage-bg);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.slice-item.active {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
}

.slice-img {
  width: 100%;
  height: auto;
  display: block;
}

.slice-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.15s ease;
  font-size: 12px;
}

.slice-item:hover .slice-mask {
  opacity: 1;
}

.slice-no {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 12px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
  line-height: 1;
}

@media (max-width: 860px) {
  .grid-area {
    grid-template-columns: 1fr;
  }
}
</style>
