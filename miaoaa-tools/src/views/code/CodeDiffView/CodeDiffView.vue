<template>
  <div class="code-diff">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-group">
        <span class="toolbar-label">栏数：</span>
        <el-radio-group v-model="columnCount" size="small">
          <el-radio-button :value="2">两栏</el-radio-button>
          <el-radio-button :value="3">三栏</el-radio-button>
          <el-radio-button :value="4">四栏</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="hasResult" class="toolbar-group stats">
        <el-tag type="success" size="small">+{{ stats.added }}</el-tag>
        <el-tag type="danger" size="small">-{{ stats.removed }}</el-tag>
        <el-tag type="warning" size="small">共 {{ stats.diffRows }} 处差异</el-tag>
      </div>
      <div v-if="hasResult && stats.diffRows > 0" class="toolbar-group nav">
        <el-button-group>
          <el-button size="small" :disabled="currentDiffIndex === 0" @click="goFirst">首个</el-button>
          <el-button size="small" :disabled="currentDiffIndex <= 0" @click="goPrev">上一个</el-button>
          <el-button
            size="small"
            :disabled="currentDiffIndex >= stats.diffRows - 1"
            @click="goNext"
          >下一个</el-button>
          <el-button
            size="small"
            :disabled="currentDiffIndex === stats.diffRows - 1"
            @click="goLast"
          >末个</el-button>
        </el-button-group>
        <span class="nav-pos">{{ currentDiffIndex + 1 }} / {{ stats.diffRows }}</span>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="inputs" :style="{ '--col-count': columnCount }">
      <div v-for="idx in columnCount" :key="'input-' + idx" class="input-col">
        <div class="input-header">
          <span class="input-title">{{ idx === 1 ? '基准' : `版本 ${idx}` }}</span>
          <div class="input-actions">
            <el-button size="small" link @click="triggerFileInput(idx - 1)">上传文件</el-button>
            <el-button size="small" link @click="clearInput(idx - 1)">清空</el-button>
          </div>
        </div>
        <div class="input-body">
          <div class="line-no-col line-no-spacer"></div>
          <el-input
            :ref="(el) => setTextareaRef(el, idx - 1)"
            v-model="inputs[idx - 1]"
            type="textarea"
            :rows="8"
            :placeholder="`输入第 ${idx} 个版本的文本`"
            class="input-textarea"
            resize="none"
          />
        </div>
        <div class="resize-handle" @mousedown="startResize"></div>
      </div>
    </div>

    <!-- 隐藏的文件选择 -->
    <input ref="fileInputRef" type="file" style="display: none" @change="onFileUpload" />

    <!-- 操作按钮 -->
    <div class="actions">
      <el-button type="primary" @click="doCompare">对比</el-button>
      <el-button @click="resetAll">重置</el-button>
    </div>

    <!-- 对比结果 -->
    <div v-if="hasResult" ref="resultRef" class="diff-result">
      <div v-if="displayRows.length === 0" class="diff-empty">无内容可对比</div>
      <div v-else class="diff-grid" :style="{ '--col-count': columnCount }">
        <!-- 表头 -->
        <div class="diff-row diff-header">
          <div v-for="idx in columnCount" :key="'h' + idx" class="diff-cell">
            <div class="line-no-col">行</div>
            <div class="diff-line-content">{{ idx === 1 ? '基准' : `版本 ${idx}` }}</div>
          </div>
        </div>
        <!-- 数据行 -->
        <div
          v-for="(row, rIdx) in displayRows"
          :key="rIdx"
          class="diff-row"
          :class="{
            'is-diff': row.isDiffRow,
            'is-current': diffRowIndices[currentDiffIndex] === rIdx,
          }"
          :ref="(el) => setRowRef(el, rIdx)"
        >
          <div v-for="(cell, cIdx) in row.cells" :key="rIdx + '-' + cIdx" class="diff-cell">
            <div class="line-no-col" :class="'cell-' + cell.type">
              {{ cell.lineNum ?? '' }}
            </div>
            <div class="diff-line-content" :class="'cell-' + cell.type">
              <template v-if="cell.type === 'modified' && cell.charDiff">
                <span
                  v-for="(seg, sIdx) in cell.charDiff"
                  :key="sIdx"
                  :class="'char-' + seg.type"
                >{{ seg.text }}</span>
              </template>
              <template v-else>{{ cell.text }}</template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// ============ diff 算法（原生实现，无第三方依赖） ============

/** 按行分割文本，统一换行符 */
function splitLines(text) {
  if (!text) return []
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
}

/**
 * 行级 LCS diff
 * @param {string[]} baseline - 基准行数组
 * @param {string[]} target - 目标行数组
 * @returns {Array} ops: { type, baselineLine, targetLine, baselineIdx, targetIdx }
 *   type: 'equal' | 'added' | 'removed' | 'modified'
 */
function diffLines(baseline, target) {
  const a = baseline
  const b = target
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ops = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      ops.push({ type: 'equal', baselineLine: a[i], targetLine: b[j], baselineIdx: i, targetIdx: j })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'removed', baselineLine: a[i], targetLine: null, baselineIdx: i, targetIdx: null })
      i++
    } else {
      ops.push({ type: 'added', baselineLine: null, targetLine: b[j], baselineIdx: null, targetIdx: j })
      j++
    }
  }
  while (i < m) {
    ops.push({ type: 'removed', baselineLine: a[i], targetLine: null, baselineIdx: i, targetIdx: null })
    i++
  }
  while (j < n) {
    ops.push({ type: 'added', baselineLine: null, targetLine: b[j], baselineIdx: null, targetIdx: j })
    j++
  }
  // 合并相邻的 removed+added 为 modified（1:1 配对，剩余保留原样）
  const merged = []
  let k = 0
  while (k < ops.length) {
    if (ops[k].type === 'removed') {
      const removedGroup = []
      while (k < ops.length && ops[k].type === 'removed') {
        removedGroup.push(ops[k])
        k++
      }
      const addedGroup = []
      while (k < ops.length && ops[k].type === 'added') {
        addedGroup.push(ops[k])
        k++
      }
      const pairs = Math.min(removedGroup.length, addedGroup.length)
      for (let p = 0; p < pairs; p++) {
        merged.push({
          type: 'modified',
          baselineLine: removedGroup[p].baselineLine,
          targetLine: addedGroup[p].targetLine,
          baselineIdx: removedGroup[p].baselineIdx,
          targetIdx: addedGroup[p].targetIdx,
        })
      }
      for (let p = pairs; p < removedGroup.length; p++) merged.push(removedGroup[p])
      for (let p = pairs; p < addedGroup.length; p++) merged.push(addedGroup[p])
    } else {
      merged.push(ops[k])
      k++
    }
  }
  return merged
}

/**
 * 字符级 LCS diff（用于行内高亮）
 * @returns {Array} { text, type: 'equal' | 'added' | 'removed' }
 */
function diffChars(s1, s2) {
  const a = Array.from(s1 || '')
  const b = Array.from(s2 || '')
  const m = a.length
  const n = b.length
  if (m === 0) return n ? [{ text: b.join(''), type: 'added' }] : []
  if (n === 0) return m ? [{ text: a.join(''), type: 'removed' }] : []
  const dp = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const result = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      result.push({ text: a[i], type: 'equal' })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ text: a[i], type: 'removed' })
      i++
    } else {
      result.push({ text: b[j], type: 'added' })
      j++
    }
  }
  while (i < m) {
    result.push({ text: a[i], type: 'removed' })
    i++
  }
  while (j < n) {
    result.push({ text: b[j], type: 'added' })
    j++
  }
  // 合并相邻同类型片段
  const merged = []
  for (const r of result) {
    if (merged.length && merged[merged.length - 1].type === r.type) {
      merged[merged.length - 1].text += r.text
    } else {
      merged.push({ text: r.text, type: r.type })
    }
  }
  return merged
}

/**
 * 构建多版本对比的展示行
 * 以第一栏（基准）为脊柱，其他栏分别与基准做 diff，按基准行序对齐
 * @param {string[]} baselineLines
 * @param {string[][]} otherColumnsLines
 * @returns {Array} displayRows: { isInsertion, cells, isDiffRow }
 *   cells: { text, type, lineNum, charDiff? }[]
 *   type: 'equal' | 'added' | 'removed' | 'modified' | 'empty'
 */
function buildDisplayRows(baselineLines, otherColumnsLines) {
  const otherDiffs = otherColumnsLines.map((col) => diffLines(baselineLines, col))
  const numCols = 1 + otherDiffs.length
  const displayRows = []
  const otherPtr = Array.from({ length: otherDiffs.length }, () => 0)

  const makeEmptyCell = () => ({ text: '', type: 'empty', lineNum: null })

  for (let bi = 0; bi < baselineLines.length; bi++) {
    // 先发射其他列中位于此基准行之前的 added（插入行）
    for (let c = 0; c < otherDiffs.length; c++) {
      const diff = otherDiffs[c]
      while (otherPtr[c] < diff.length && diff[otherPtr[c]].type === 'added') {
        const op = diff[otherPtr[c]]
        const cells = Array.from({ length: numCols })
        cells[0] = makeEmptyCell()
        for (let c2 = 0; c2 < otherDiffs.length; c2++) {
          cells[c2 + 1] =
            c2 === c
              ? { text: op.targetLine, type: 'added', lineNum: op.targetIdx + 1 }
              : makeEmptyCell()
        }
        displayRows.push({ isInsertion: true, cells, isDiffRow: true })
        otherPtr[c]++
      }
    }
    // 发射基准行
    const cells = Array.from({ length: numCols })
    cells[0] = { text: baselineLines[bi], type: 'equal', lineNum: bi + 1 }
    let isDiffRow = false
    for (let c = 0; c < otherDiffs.length; c++) {
      const diff = otherDiffs[c]
      const op = diff[otherPtr[c]]
      if (op && op.baselineIdx === bi) {
        if (op.type === 'equal') {
          cells[c + 1] = { text: op.targetLine, type: 'equal', lineNum: op.targetIdx + 1 }
        } else if (op.type === 'modified') {
          cells[c + 1] = {
            text: op.targetLine,
            type: 'modified',
            lineNum: op.targetIdx + 1,
            charDiff: diffChars(op.baselineLine, op.targetLine),
          }
          isDiffRow = true
        } else if (op.type === 'removed') {
          cells[c + 1] = { text: '', type: 'removed', lineNum: null }
          isDiffRow = true
        } else {
          cells[c + 1] = { text: op.targetLine, type: 'added', lineNum: op.targetIdx + 1 }
          isDiffRow = true
        }
        otherPtr[c]++
      } else {
        cells[c + 1] = makeEmptyCell()
      }
    }
    displayRows.push({ isInsertion: false, cells, isDiffRow })
  }

  // 基准行结束后，发射剩余的 added
  for (let c = 0; c < otherDiffs.length; c++) {
    const diff = otherDiffs[c]
    while (otherPtr[c] < diff.length) {
      const op = diff[otherPtr[c]]
      if (op.type === 'added') {
        const cells = Array.from({ length: numCols })
        cells[0] = makeEmptyCell()
        for (let c2 = 0; c2 < otherDiffs.length; c2++) {
          cells[c2 + 1] =
            c2 === c
              ? { text: op.targetLine, type: 'added', lineNum: op.targetIdx + 1 }
              : makeEmptyCell()
        }
        displayRows.push({ isInsertion: true, cells, isDiffRow: true })
      }
      otherPtr[c]++
    }
  }

  return displayRows
}

// ============ Vue 组件逻辑 ============

const columnCount = ref(2)
const inputs = ref(['', ''])
const displayRows = ref([])
const hasResult = ref(false)
const currentDiffIndex = ref(0)
const fileInputRef = ref(null)
const resultRef = ref(null)
const rowRefs = []
const pendingFileColumn = ref(-1)

// 输入框高度联动
const textareaComps = ref([])
const textareaHeight = ref(null) // null=默认 rows；数字=像素高度

// 栏数变化时扩展 inputs（不截断，保留已输入的数据）
watch(columnCount, (newCount) => {
  if (newCount > inputs.value.length) {
    inputs.value = [...inputs.value, ...Array(newCount - inputs.value.length).fill('')]
  }
  hasResult.value = false
  displayRows.value = []
  nextTick(() => applyTextareaHeight())
})

const stats = computed(() => {
  let added = 0
  let removed = 0
  let diffRows = 0
  for (const row of displayRows.value) {
    if (!row.isDiffRow) continue
    diffRows++
    for (const cell of row.cells) {
      if (cell.type === 'added') added++
      else if (cell.type === 'removed') removed++
      else if (cell.type === 'modified') {
        added++
        removed++
      }
    }
  }
  return { added, removed, diffRows }
})

const diffRowIndices = computed(() => {
  const indices = []
  displayRows.value.forEach((row, idx) => {
    if (row.isDiffRow) indices.push(idx)
  })
  return indices
})

function setRowRef(el, idx) {
  if (el) rowRefs[idx] = el
}

function setTextareaRef(comp, idx) {
  if (comp) textareaComps.value[idx] = comp
}

// 把共享高度应用到所有 textarea
function applyTextareaHeight() {
  const h = textareaHeight.value
  if (h == null) return
  textareaComps.value.forEach((comp) => {
    const ta = comp?.$el?.querySelector('textarea')
    if (ta) ta.style.height = h + 'px'
  })
}

// 自定义拖拽手柄：拖动一个，同步所有
function startResize(e) {
  e.preventDefault()
  const startY = e.clientY
  const firstTa = textareaComps.value[0]?.$el?.querySelector('textarea')
  const startHeight = firstTa?.offsetHeight || 160
  const onMove = (ev) => {
    const delta = ev.clientY - startY
    textareaHeight.value = Math.max(80, Math.round(startHeight + delta))
    applyTextareaHeight()
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function triggerFileInput(idx) {
  pendingFileColumn.value = idx
  fileInputRef.value?.click()
}

function onFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    if (pendingFileColumn.value >= 0) {
      inputs.value[pendingFileColumn.value] = e.target.result
      pendingFileColumn.value = -1
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

function clearInput(idx) {
  inputs.value[idx] = ''
}

function doCompare() {
  const baseline = inputs.value[0]
  if (!baseline) {
    ElMessage.warning('请输入第一栏（基准）文本')
    return
  }
  const baselineLines = splitLines(baseline)
  const otherColumnsLines = inputs.value.slice(1, columnCount.value).map(splitLines)
  rowRefs.length = 0
  displayRows.value = buildDisplayRows(baselineLines, otherColumnsLines)
  hasResult.value = true
  currentDiffIndex.value = 0
  if (stats.value.diffRows > 0) {
    nextTick(() => scrollToCurrentDiff())
  }
}

function resetAll() {
  inputs.value = Array(columnCount.value).fill('')
  displayRows.value = []
  hasResult.value = false
  currentDiffIndex.value = 0
  // 重置高度
  textareaHeight.value = null
  textareaComps.value.forEach((comp) => {
    const ta = comp?.$el?.querySelector('textarea')
    if (ta) ta.style.height = ''
  })
}

function scrollToCurrentDiff() {
  const rowIdx = diffRowIndices.value[currentDiffIndex.value]
  if (rowIdx === undefined) return
  rowRefs[rowIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function goFirst() {
  currentDiffIndex.value = 0
  nextTick(() => scrollToCurrentDiff())
}

function goPrev() {
  if (currentDiffIndex.value > 0) {
    currentDiffIndex.value--
    nextTick(() => scrollToCurrentDiff())
  }
}

function goNext() {
  if (currentDiffIndex.value < stats.value.diffRows - 1) {
    currentDiffIndex.value++
    nextTick(() => scrollToCurrentDiff())
  }
}

function goLast() {
  currentDiffIndex.value = Math.max(0, stats.value.diffRows - 1)
  nextTick(() => scrollToCurrentDiff())
}
</script>

<style scoped>
.code-diff {
  max-width: 1400px;
  margin: 0 auto;

  /* diff 配色 - 亮色 */
  --diff-added-bg: #e6ffec;
  --diff-added-text: #22863a;
  --diff-removed-bg: #ffebe9;
  --diff-removed-text: #cb2431;
  --diff-modified-bg: #fff8c5;
  --diff-char-added-bg: #acf2bd;
  --diff-char-removed-bg: #fdb8c0;
  --diff-empty-bg: #f6f8fa;

  /* 统一的等宽字体与文本度量，输入框与对比框共用，保证同位置换行 */
  --mono-font: 'Cascadia Code', Consolas, 'Courier New', monospace;
  --mono-size: 12px;
  --mono-line-height: 1.5;
  --line-no-width: 45px;
}

html.dark .code-diff {
  /* diff 配色 - 暗色 */
  --diff-added-bg: rgba(46, 160, 67, 0.18);
  --diff-added-text: #7ee787;
  --diff-removed-bg: rgba(248, 81, 73, 0.18);
  --diff-removed-text: #ff7b72;
  --diff-modified-bg: rgba(187, 128, 9, 0.18);
  --diff-char-added-bg: rgba(46, 160, 67, 0.45);
  --diff-char-removed-bg: rgba(248, 81, 73, 0.45);
  --diff-empty-bg: rgba(255, 255, 255, 0.04);
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  font-size: 14px;
  color: var(--content-text);
}

.stats {
  gap: 6px;
}

.nav {
  margin-left: auto;
}

.nav-pos {
  font-size: 13px;
  color: var(--content-text-secondary);
  min-width: 60px;
  text-align: right;
}

/* ===== 输入区 ===== */
.inputs {
  display: grid;
  grid-template-columns: repeat(var(--col-count), minmax(0, 1fr));
  gap: 0;
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--panel-bg);
}

.input-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid var(--el-border-color-lighter);
}

.input-col:last-child {
  border-right: none;
}

.input-col:focus-within {
  /* focus 反馈放到外层，避免 textarea 自身 border 被移除后无反馈 */
  box-shadow: inset 0 0 0 1px var(--el-color-primary);
}

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-light);
}

.input-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--content-text);
}

.input-actions {
  display: flex;
  gap: 4px;
}

.input-body {
  display: flex;
  align-items: stretch;
  min-width: 0;
  flex: 1;
}

/* 行号占位列（输入区无行号，但占等宽空间以对齐对比区） */
.line-no-col {
  width: var(--line-no-width);
  flex-shrink: 0;
  padding: 4px 6px;
  font-family: var(--mono-font);
  font-size: var(--mono-size);
  line-height: var(--mono-line-height);
  color: var(--content-text-secondary);
  text-align: right;
  user-select: none;
  border-right: 1px solid var(--el-border-color-lighter);
  background-color: var(--diff-empty-bg);
  white-space: nowrap;
  overflow: hidden;
}

.line-no-spacer {
  /* 占位用，无文字 */
}

.input-textarea {
  flex: 1;
  min-width: 0;
}

/* textarea 内部样式：与对比框内容区完全一致的字体/padding/换行规则 */
.input-textarea :deep(.el-textarea__inner) {
  font-family: var(--mono-font);
  font-size: var(--mono-size);
  line-height: var(--mono-line-height);
  padding: 4px 8px;
  border: none;
  box-shadow: none;
  border-radius: 0;
  resize: none;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
}

/* 自定义拖拽手柄 */
.resize-handle {
  height: 6px;
  flex-shrink: 0;
  cursor: ns-resize;
  background-color: var(--el-fill-color-light);
  border-top: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.15s ease;
}

.resize-handle:hover,
.resize-handle:active {
  background-color: var(--el-color-primary-light-5);
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

/* ===== 对比结果 ===== */
.diff-result {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 70vh;
  background-color: var(--panel-bg);
}

.diff-empty {
  padding: 32px;
  text-align: center;
  color: var(--content-text-secondary);
  font-size: 14px;
}

.diff-grid {
  min-width: 0;
}

.diff-row {
  display: grid;
  grid-template-columns: repeat(var(--col-count), minmax(0, 1fr));
  border-bottom: 1px solid var(--el-border-color-lighter);
  min-width: 0;
}

.diff-row:last-child {
  border-bottom: none;
}

.diff-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: var(--el-fill-color-light);
  font-weight: 600;
  font-size: 13px;
}

/* 每栏一个 cell，内部 flex = 行号 + 内容，与输入区结构对齐 */
.diff-cell {
  display: flex;
  align-items: stretch;
  min-width: 0;
  border-right: 1px solid var(--el-border-color-lighter);
}

.diff-cell:last-child {
  border-right: none;
}

.diff-line-content {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  font-family: var(--mono-font);
  font-size: var(--mono-size);
  line-height: var(--mono-line-height);
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
}

/* cell 类型样式 */
.cell-equal {
  /* 无特殊样式 */
}

.cell-empty {
  background-color: var(--diff-empty-bg);
}

.cell-added {
  background-color: var(--diff-added-bg);
  color: var(--diff-added-text);
}

.cell-removed {
  background-color: var(--diff-removed-bg);
  color: var(--diff-removed-text);
}

.cell-modified {
  background-color: var(--diff-modified-bg);
}

/* 行号列的 cell 配色（只改背景，文字保持次要色） */
.line-no-col.cell-added {
  background-color: var(--diff-added-bg);
}

.line-no-col.cell-removed {
  background-color: var(--diff-removed-bg);
}

.line-no-col.cell-modified {
  background-color: var(--diff-modified-bg);
}

/* 行内字符高亮 */
.char-added {
  background-color: var(--diff-char-added-bg);
  color: var(--diff-added-text);
}

.char-removed {
  background-color: var(--diff-char-removed-bg);
  color: var(--diff-removed-text);
  text-decoration: line-through;
}

/* 当前差异高亮 */
.diff-row.is-current {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
  position: relative;
  z-index: 1;
}
</style>
