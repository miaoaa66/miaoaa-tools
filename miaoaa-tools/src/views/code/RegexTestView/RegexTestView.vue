<template>
  <div class="regex-test">
    <el-card class="panel">
      <template #header>
        <div class="card-header">正则表达式测试</div>
      </template>

      <div class="pattern-row">
        <div class="pattern-field">
          <label class="field-label">正则表达式</label>
          <div class="pattern-input-wrap">
            <span class="pattern-delimiter">/</span>
            <el-input
              v-model="pattern"
              placeholder="输入正则表达式"
              clearable
              @keyup.enter="doTest"
            />
            <span class="pattern-delimiter">/</span>
            <el-input
              v-model="flags"
              placeholder="flags"
              class="flags-input"
              clearable
              @keyup.enter="doTest"
            />
          </div>
          <div class="presets">
            <span class="presets-label">常用正则：</span>
            <el-button
              v-for="preset in presets"
              :key="preset.name"
              size="small"
              plain
              :type="pattern === preset.pattern ? 'primary' : ''"
              @click="applyPreset(preset)"
            >
              {{ preset.name }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="test-text-row">
        <label class="field-label">测试文本</label>
        <el-input
          v-model="testText"
          type="textarea"
          :rows="8"
          placeholder="输入要匹配的测试文本"
          @keydown.enter.exact.prevent="doTest"
        />
      </div>

      <div class="actions">
        <div class="action-left">
          <el-button type="primary" @click="doTest">测试匹配</el-button>
          <el-button @click="toggleReplace">替换</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card v-if="showReplace" class="panel">
      <template #header>
        <div class="card-header">替换文本</div>
      </template>
      <el-input
        v-model="replaceText"
        placeholder="替换为（留空则替换为 ($&)）"
        clearable
        @keyup.enter="doReplace"
      />
      <div class="actions">
        <el-button type="primary" @click="doReplace">执行替换</el-button>
      </div>
    </el-card>

    <el-card v-if="error" class="panel error-panel">
      <div class="error-tip">{{ error }}</div>
    </el-card>

    <el-card v-if="result !== null" class="panel result-panel">
      <template #header>
        <div class="card-header">
          <span>匹配结果</span>
          <el-tag type="info" size="small">{{ result.length }} 个匹配</el-tag>
        </div>
      </template>

      <div v-if="result.length === 0" class="no-match">无匹配结果</div>

      <div v-for="(match, idx) in result" :key="idx" class="match-item">
        <div class="match-header">
          <span class="match-index">#{{ idx + 1 }}</span>
          <el-tag size="small">索引: {{ match.index }}</el-tag>
          <el-tag size="small" type="success">长度: {{ match[0].length }}</el-tag>
        </div>
        <div class="match-value">
          <span class="match-label">匹配值：</span>
          <code class="match-code">{{ match[0] }}</code>
        </div>
        <div v-if="match.groups && Object.keys(match.groups).length" class="match-groups">
          <span class="match-label">命名分组：</span>
          <div class="groups-list">
            <el-tag
              v-for="(val, key) in match.groups"
              :key="key"
              size="small"
              type="warning"
            >
              {{ key }}: {{ val }}
            </el-tag>
          </div>
        </div>
        <div v-if="match.length > 1" class="match-captures">
          <span class="match-label">捕获组：</span>
          <div class="captures-list">
            <el-tag
              v-for="(capture, ci) in match.slice(1)"
              :key="ci"
              size="small"
              type="info"
            >
              [${{ ci + 1 }}] {{ capture ?? '(未捕获)' }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <el-card v-if="replaceResult !== null" class="panel result-panel">
      <template #header>
        <div class="card-header">替换结果</div>
      </template>
      <div class="replace-result">
        <el-input
          :model-value="replaceResult"
          type="textarea"
          :rows="6"
          readonly
        />
        <el-button
          class="copy-btn"
          size="small"
          @click="copyReplaceResult"
        >
          复制结果
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const pattern = ref('')
const flags = ref('g')
const testText = ref('')
const replaceText = ref('')
const showReplace = ref(false)
const result = ref(null)
const replaceResult = ref(null)
const error = ref('')

const presets = [
  // 联系方式
  { name: '邮箱', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
  { name: '手机号', pattern: '1[3-9]\\d{9}' },
  { name: '手机号(含区号)', pattern: '(\\+86)?1[3-9]\\d{9}' },
  { name: '固定电话', pattern: '0\\d{2,3}-\\d{7,8}' },
  { name: 'QQ号', pattern: '[1-9]\\d{4,10}' },
  { name: '微信号', pattern: '[a-zA-Z][-_a-zA-Z0-9]{5,19}' },
  // 身份信息
  { name: '身份证号', pattern: '\\d{17}[\\dXx]' },
  { name: '中文姓名', pattern: '[\\u4e00-\\u9fa5]{2,4}' },
  { name: '银行卡号', pattern: '\\d{16,19}' },
  { name: '统一社会信用代码', pattern: '[0-9A-HJ-NPQRTUWXY]{2}\\d{6}[0-9A-HJ-NPQRTUWXY]{10}' },
  { name: '护照号', pattern: '(P\\d{7}|G\\d{8}|S\\d{7,8}|D\\d+|E\\d{7,8})' },
  { name: '车牌号', pattern: '[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z][A-Z][A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]' },
  // 数字与金额
  { name: '数字', pattern: '\\d+' },
  { name: '整数', pattern: '-?\\d+' },
  { name: '正整数', pattern: '[1-9]\\d*' },
  { name: '负整数', pattern: '-[1-9]\\d*' },
  { name: '浮点数', pattern: '-?\\d+(\\.\\d+)?' },
  { name: '金额(两位小数)', pattern: '(0|[1-9]\\d*)(\\.\\d{2})?' },
  { name: '百分数', pattern: '\\d+(\\.\\d+)?%' },
  { name: '版本号', pattern: '\\d+\\.\\d+\\.\\d+' },
  // 日期时间
  { name: '日期(YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}' },
  { name: '日期(斜杠)', pattern: '\\d{4}/\\d{1,2}/\\d{1,2}' },
  { name: '日期(点)', pattern: '\\d{4}\\.\\d{1,2}\\.\\d{1,2}' },
  { name: '时间(HH:mm:ss)', pattern: '([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d' },
  { name: '日期时间', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}' },
  { name: '年份', pattern: '\\d{4}' },
  // 网络
  { name: 'URL', pattern: 'https?://[\\w-]+(\\.[\\w-]+)+([\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])?' },
  { name: 'IPv4', pattern: '(?:\\d{1,3}\\.){3}\\d{1,3}' },
  { name: 'IPv6', pattern: '([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}' },
  { name: '域名', pattern: '[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\\.?' },
  { name: '端口号', pattern: '([1-9]\\d{0,3}|[1-5]\\d{4}|6[0-4]\\d{3}|65[0-4]\\d{2}|655[0-2]\\d|6553[0-5])' },
  { name: 'MAC地址', pattern: '([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}' },
  { name: '邮编', pattern: '[1-9]\\d{5}' },
  // 文本字符
  { name: '中文', pattern: '[\\u4e00-\\u9fa5]+' },
  { name: '英文', pattern: '[a-zA-Z]+' },
  { name: '空白字符', pattern: '\\s+' },
  { name: '首尾空白', pattern: '^\\s+|\\s+$' },
  { name: '中文标点', pattern: '[，。！？；：“”‘’（）《》【】、·]' },
  // 账号密码
  { name: '账号(字母开头5-16位)', pattern: '^[a-zA-Z][a-zA-Z0-9_]{4,15}$' },
  { name: '密码(6-20位)', pattern: '^[a-zA-Z0-9]{6,20}$' },
  { name: '强密码(8位含大小写数字)', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$' },
  // 文件与颜色
  { name: '图片文件', pattern: '.*\\.(jpg|jpeg|png|gif|bmp|webp)$' },
  { name: '视频文件', pattern: '.*\\.(mp4|avi|mov|mkv|wmv|flv|webm)$' },
  { name: '音频文件', pattern: '.*\\.(mp3|wav|wma|ogg|flac|aac)$' },
  { name: '压缩文件', pattern: '.*\\.(zip|rar|7z|tar|gz|bz2)$' },
  { name: '文档文件', pattern: '.*\\.(doc|docx|pdf|ppt|pptx|xls|xlsx|txt)$' },
  { name: '十六进制颜色', pattern: '#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})' },
  { name: 'RGB颜色', pattern: 'rgb\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*\\)' },
  // HTML
  { name: 'HTML标签', pattern: '<[^>]+>' },
  { name: 'HTML注释', pattern: '<!--[\\s\\S]*?-->' },
]

function applyPreset(preset) {
  pattern.value = preset.pattern
}

function doTest() {
  error.value = ''
  result.value = null
  replaceResult.value = null

  if (!pattern.value) {
    ElMessage.warning('请输入正则表达式')
    return
  }
  if (!testText.value) {
    ElMessage.warning('请输入测试文本')
    return
  }

  try {
    const regex = new RegExp(pattern.value, flags.value)
    const matches = []
    let match

    if (regex.flags.includes('g')) {
      while ((match = regex.exec(testText.value)) !== null) {
        matches.push({ ...match })
        if (match.index === regex.lastIndex) regex.lastIndex++
      }
    } else {
      match = regex.exec(testText.value)
      if (match) matches.push({ ...match })
    }

    result.value = matches
  } catch (err) {
    error.value = '正则表达式错误：' + (err?.message || '未知错误')
  }
}

function doReplace() {
  error.value = ''
  result.value = null
  replaceResult.value = null

  if (!pattern.value) {
    ElMessage.warning('请输入正则表达式')
    return
  }
  if (!testText.value) {
    ElMessage.warning('请输入测试文本')
    return
  }

  try {
    const regex = new RegExp(pattern.value, flags.value)
    const replacement = replaceText.value || '($&)'
    replaceResult.value = testText.value.replace(regex, replacement)
  } catch (err) {
    error.value = '替换失败：' + (err?.message || '未知错误')
  }
}

function toggleReplace() {
  showReplace.value = !showReplace.value
  if (!showReplace.value) {
    replaceResult.value = null
  }
}

function reset() {
  pattern.value = ''
  flags.value = 'g'
  testText.value = ''
  replaceText.value = ''
  showReplace.value = false
  result.value = null
  replaceResult.value = null
  error.value = ''
}

async function copyReplaceResult() {
  if (!replaceResult.value) return
  try {
    await navigator.clipboard.writeText(replaceResult.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  }
}
</script>

<style scoped>
.regex-test {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.pattern-row {
  margin-bottom: 16px;
}

.pattern-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.pattern-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pattern-delimiter {
  font-family: monospace;
  font-size: 18px;
  color: var(--el-text-color-secondary);
  padding: 0 2px;
}

.flags-input {
  width: 100px;
  flex-shrink: 0;
}

.flags-input :deep(.el-input__inner) {
  font-family: monospace;
}

.presets {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.presets-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.presets :deep(.el-button + .el-button) {
  margin-left: 0;
}

.test-text-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-text-row :deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
}

.actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-left {
  display: flex;
  gap: 8px;
}

.error-panel {
  border-color: var(--el-color-danger);
}

.error-tip {
  font-size: 13px;
  color: var(--el-color-danger);
  line-height: 1.5;
}

.result-panel {
  margin-top: 0;
}

.no-match {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 24px 0;
  font-size: 14px;
}

.match-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  margin-bottom: 10px;
}

.match-item:last-child {
  margin-bottom: 0;
}

.match-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.match-index {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-color-primary);
}

.match-value,
.match-groups,
.match-captures {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 6px;
  font-size: 13px;
}

.match-label {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

.match-code {
  background-color: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
  color: var(--el-color-primary-dark-2);
  white-space: pre-wrap;
}

.groups-list,
.captures-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.replace-result {
  position: relative;
}

.copy-btn {
  margin-top: 8px;
}
</style>