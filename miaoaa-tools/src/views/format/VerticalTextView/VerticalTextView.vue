<template>
  <div class="vertical-text">
    <div class="input-area">
      <div class="card-header">
        <span>输入文本</span>
        <el-button v-if="inputText" link type="primary" @click="reset">重置</el-button>
      </div>
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="6"
        placeholder="请输入文本，例如：春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。"
      />
      <div class="options">
        <div class="option-item">
          <span class="option-label">每列字数</span>
          <el-input-number v-model="charsPerColumn" :min="1" :max="30" size="small" />
        </div>
        <div class="option-item">
          <span class="option-label">字号(px)</span>
          <el-input-number v-model="fontSize" :min="14" :max="64" size="small" />
        </div>
        <el-button type="primary" size="small" :disabled="!columns.length" @click="copyColumns">
          复制竖排文本
        </el-button>
      </div>
    </div>

    <div class="preview-area">
      <div class="card-header">
        <span>竖排预览</span>
        <span class="preview-tip">从右至左、自上而下阅读</span>
      </div>
      <div class="paper" v-if="columns.length">
        <div
          v-for="(column, index) in displayColumns"
          :key="index"
          class="paper-column"
          :style="{ fontSize: fontSize + 'px' }"
        >
          {{ column }}
        </div>
        <div class="paper-seal">竖排</div>
      </div>
      <el-empty v-else description="输入文本后预览竖排效果" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const inputText = ref('')
const charsPerColumn = ref(7)
const fontSize = ref(36)

// 将文本按字符拆分为多列
const columns = computed(() => {
  const chars = Array.from(inputText.value.trim())
  if (!chars.length) return []
  const list = []
  for (let i = 0; i < chars.length; i += charsPerColumn.value) {
    list.push(chars.slice(i, i + charsPerColumn.value).join(''))
  }
  return list
})

// 古诗词从右至左阅读，因此列顺序反转显示
const displayColumns = computed(() => [...columns.value].reverse())

function reset() {
  inputText.value = ''
}

async function copyColumns() {
  if (!columns.value.length) return
  try {
    await navigator.clipboard.writeText(columns.value.join('\n'))
    ElMessage.success('已复制竖排文本')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  }
}
</script>

<style scoped>
.vertical-text {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 12px;
}

.options {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-label {
  font-size: 14px;
  color: var(--content-text);
}

.preview-area {
  margin-top: 24px;
}

.preview-tip {
  font-size: 12px;
  font-weight: 400;
  color: var(--content-text-secondary, #909399);
}

.paper {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 14px;
  padding: 32px 40px 48px;
  background:
    linear-gradient(rgba(120, 90, 40, 0.06) 1px, transparent 1px),
    #f6efe0;
  background-size: 100% 28px;
  border: 1px solid #d9c8a4;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 280px;
  overflow-x: auto;
}

.paper-column {
  writing-mode: vertical-rl;
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  line-height: 1.6;
  color: #2b2b2b;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.paper-seal {
  position: absolute;
  left: 16px;
  bottom: 16px;
  writing-mode: vertical-rl;
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  font-size: 13px;
  color: #fff;
  background: #c23a2b;
  padding: 5px 3px;
  border-radius: 3px;
  opacity: 0.85;
}
</style>
