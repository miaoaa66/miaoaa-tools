<template>
  <div class="sql-format">
    <div class="mode-bar">
      <span class="mode-label">缩进：</span>
      <el-radio-group v-model="indentSize" size="small">
        <el-radio-button :value="2">2 空格</el-radio-button>
        <el-radio-button :value="4">4 空格</el-radio-button>
      </el-radio-group>
    </div>

    <el-card class="panel">
      <template #header>
        <div class="card-header">
          <span>SQL 格式化</span>
          <el-button
            v-if="input || output !== null"
            link
            type="primary"
            @click="reset"
          >
            重置
          </el-button>
        </div>
      </template>

      <el-input
        v-model="input"
        type="textarea"
        :rows="10"
        placeholder="输入需要格式化的 SQL 语句"
      />

      <div class="actions">
        <el-button type="primary" @click="doFormat">格式化</el-button>
        <el-button
          :disabled="!output"
          :loading="copying"
          type="success"
          link
          @click="copy"
        >
          复制结果
        </el-button>
      </div>

      <el-input
        v-if="output !== null"
        :model-value="output"
        type="textarea"
        :rows="12"
        readonly
        placeholder="格式化结果"
        class="result-textarea"
      />
      <div v-if="error" class="error-tip">{{ error }}</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const indentSize = ref(2)
const input = ref('')
const output = ref(null)
const error = ref('')
const copying = ref(false)

// ============ SQL 关键字集合 ============
const KEYWORDS = new Set(
  (
    'DISTINCT ALL AS IN IS NULL NOT LIKE BETWEEN EXISTS CASE WHEN THEN ELSE END ASC DESC ' +
    'AND OR ON USING WITH RECURSIVE BY RETURNING SOME ANY DEFAULT PRIMARY FOREIGN REFERENCES ' +
    'CONSTRAINT UNIQUE CHECK CREATE TABLE INDEX VIEW DROP ALTER ADD COLUMN INSERT UPDATE DELETE ' +
    'SELECT FROM WHERE GROUP ORDER HAVING LIMIT OFFSET UNION INTERSECT EXCEPT VALUES SET JOIN ' +
    'INNER LEFT RIGHT FULL OUTER CROSS NATURAL CAST CONVERT TRUE FALSE UNKNOWN INTO IF REPLACE ' +
    'TEMPORARY TEMP TRUNCATE GRANT REVOKE EXPLAIN ANALYZE BEGIN COMMIT ROLLBACK TRANSACTION'
  ).split(' ')
)
const TYPES = new Set(
  'INT INTEGER SMALLINT BIGINT DECIMAL NUMERIC REAL FLOAT DOUBLE PRECISION CHAR VARCHAR TEXT BLOB BOOLEAN BOOL DATE TIME TIMESTAMP INTERVAL SERIAL BIGSERIAL UUID JSON JSONB'.split(
    ' '
  )
)
const FUNCS = new Set(
  'COUNT SUM AVG MIN MAX COALESCE NULLIF GREATEST LEAST NOW CURRENT_DATE CURRENT_TIME CURRENT_TIMESTAMP EXTRACT DATE_TRUNC LENGTH LOWER UPPER TRIM CONCAT SUBSTRING POSITION ROUND FLOOR CEIL CEILING ABS POWER MOD RANDOM'.split(
    ' '
  )
)

// 子句关键字：换行
const CLAUSE_SINGLE = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'UNION',
  'INTERSECT',
  'EXCEPT',
  'VALUES',
  'SET',
  'ON',
  'USING',
  'RETURNING',
  'JOIN',
])
const JOIN_PREFIX = new Set(['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'NATURAL'])

// ============ 词法分析 ============
function tokenizeSql(sql) {
  const tokens = []
  const n = sql.length
  let i = 0
  const isWord = (c) => /[A-Za-z0-9_]/.test(c)
  while (i < n) {
    const c = sql[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    // 行注释
    if (c === '-' && sql[i + 1] === '-') {
      let j = i + 2
      while (j < n && sql[j] !== '\n') j++
      tokens.push({ type: 'comment', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 块注释
    if (c === '/' && sql[i + 1] === '*') {
      let j = i + 2
      while (j < n && !(sql[j] === '*' && sql[j + 1] === '/')) j++
      j = Math.min(n, j + 2)
      tokens.push({ type: 'comment', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 单引号字符串
    if (c === "'") {
      let j = i + 1
      while (j < n) {
        if (sql[j] === "'" && sql[j + 1] === "'") {
          j += 2
          continue
        }
        if (sql[j] === "'") {
          j++
          break
        }
        j++
      }
      tokens.push({ type: 'string', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 双引号 / 反引号标识符
    if (c === '"' || c === '`') {
      const q = c
      let j = i + 1
      while (j < n && sql[j] !== q) j++
      j = Math.min(n, j + 1)
      tokens.push({ type: 'quoted', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 数字
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(sql[i + 1]))) {
      let j = i
      while (j < n && /[0-9.eE+-]/.test(sql[j])) {
        if ((sql[j] === '+' || sql[j] === '-') && !/[eE]/.test(sql[j - 1])) break
        j++
      }
      tokens.push({ type: 'number', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 标识符 / 关键字
    if (isWord(c)) {
      let j = i
      while (j < n && isWord(sql[j])) j++
      tokens.push({ type: 'word', value: sql.slice(i, j) })
      i = j
      continue
    }
    // 多字符操作符
    const two = sql.slice(i, i + 2)
    if (['<=', '>=', '<>', '!=', '||', ':='].includes(two)) {
      tokens.push({ type: 'op', value: two })
      i += 2
      continue
    }
    tokens.push({ type: 'punct', value: c })
    i++
  }
  return tokens
}

// 合并多词子句，识别子句/AND/OR/关键字
function mergeClauses(tokens) {
  const out = []
  let k = 0
  const isWord = (t) => t && t.type === 'word'
  const up = (t) => (t ? t.value.toUpperCase() : '')
  while (k < tokens.length) {
    const t = tokens[k]
    if (!isWord(t)) {
      out.push(t)
      k++
      continue
    }
    const u = up(t)
    // GROUP BY / ORDER BY
    if ((u === 'GROUP' || u === 'ORDER') && up(tokens[k + 1]) === 'BY') {
      out.push({ type: 'clause', value: u + ' BY' })
      k += 2
      continue
    }
    // UNION ALL
    if (u === 'UNION' && up(tokens[k + 1]) === 'ALL') {
      out.push({ type: 'clause', value: 'UNION ALL' })
      k += 2
      continue
    }
    // INSERT INTO / DELETE FROM
    if (u === 'INSERT' && up(tokens[k + 1]) === 'INTO') {
      out.push({ type: 'clause', value: 'INSERT INTO' })
      k += 2
      continue
    }
    if (u === 'DELETE' && up(tokens[k + 1]) === 'FROM') {
      out.push({ type: 'clause', value: 'DELETE FROM' })
      k += 2
      continue
    }
    // [prefix] [OUTER] JOIN
    if (JOIN_PREFIX.has(u)) {
      let m = 1
      const parts = [u]
      if (up(tokens[k + m]) === 'OUTER') {
        parts.push('OUTER')
        m++
      }
      if (up(tokens[k + m]) === 'JOIN') {
        parts.push('JOIN')
        out.push({ type: 'clause', value: parts.join(' ') })
        k += m + 1
        continue
      }
    }
    if (CLAUSE_SINGLE.has(u)) {
      out.push({ type: 'clause', value: u })
      k++
      continue
    }
    if (u === 'AND' || u === 'OR') {
      out.push({ type: 'andor', value: u })
      k++
      continue
    }
    // 关键字大写，其余保持原样
    if (KEYWORDS.has(u) || TYPES.has(u) || FUNCS.has(u)) {
      out.push({ type: 'word', value: u })
    } else {
      out.push({ type: 'word', value: t.value })
    }
    k++
  }
  return out
}

function formatSql(sql, indentSize = 2) {
  const tokens = mergeClauses(tokenizeSql(sql))
  if (tokens.length === 0) return ''
  const unit = ' '.repeat(indentSize)
  const indent = (d) => unit.repeat(Math.max(0, d))

  let out = ''
  let depth = 0
  const parenStack = [] // true = 子查询括号
  let atLineStart = true

  const startLine = (d) => {
    if (!atLineStart) out += '\n'
    out += indent(d)
    atLineStart = false
  }
  const emitRaw = (s) => {
    out += s
    atLineStart = false
  }
  const needSpaceBeforeWord = () => {
    const last = out[out.length - 1]
    return /[\w)]/.test(last) || last === "'" || last === '"' || last === '`'
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const next = tokens[i + 1]

    if (t.type === 'clause') {
      startLine(depth)
      emitRaw(t.value)
      continue
    }
    if (t.type === 'andor') {
      // 换行并在子句基础上再缩进一级
      if (!atLineStart) out += '\n'
      out += indent(depth + 1)
      emitRaw(t.value)
      continue
    }
    if (t.type === 'comment') {
      startLine(depth)
      emitRaw(t.value)
      out += '\n'
      atLineStart = true
      continue
    }
    if (t.type === 'punct') {
      if (t.value === '(') {
        const isSub = next && next.type === 'clause' && next.value === 'SELECT'
        if (isSub) {
          if (atLineStart) {
            out += indent(depth)
            atLineStart = false
          }
          out += '('
          parenStack.push(true)
          depth++
          out += '\n'
          atLineStart = true
        } else {
          if (atLineStart) {
            out += indent(depth)
            atLineStart = false
          }
          out += '('
          parenStack.push(false)
        }
        continue
      }
      if (t.value === ')') {
        const wasSub = parenStack.pop()
        if (wasSub) {
          depth--
          startLine(depth)
          emitRaw(')')
        } else {
          if (atLineStart) {
            out += indent(depth)
            atLineStart = false
          }
          out += ')'
        }
        continue
      }
      if (t.value === ',') {
        if (parenStack.length === 0) {
          // 顶层（如 SELECT 字段列表）：换行 + 缩进一级
          out += ','
          startLine(depth + 1)
        } else {
          out += ', '
        }
        continue
      }
      if (t.value === ';') {
        if (atLineStart) {
          out += indent(depth)
          atLineStart = false
        }
        out += ';'
        out += '\n'
        atLineStart = true
        continue
      }
      if (t.value === '.') {
        out += '.'
        continue
      }
      if (t.value === '*') {
        const last = out[out.length - 1]
        if (last === '(') out += '*'
        else {
          if (atLineStart) {
            out += indent(depth)
            atLineStart = false
          }
          out += ' * '
        }
        continue
      }
      // 其它单字符操作符 (< > = + - / % 等)
      if (atLineStart) {
        out += indent(depth)
        atLineStart = false
      }
      out += ' ' + t.value + ' '
      continue
    }
    if (t.type === 'op') {
      if (atLineStart) {
        out += indent(depth)
        atLineStart = false
      }
      out += ' ' + t.value + ' '
      continue
    }
    // word / number / string / quoted
    if (atLineStart) {
      out += indent(depth) + t.value
      atLineStart = false
    } else {
      if (needSpaceBeforeWord()) out += ' '
      out += t.value
    }
  }

  // 清理每行尾部空格与多余空行
  return out
    .split('\n')
    .map((l) => l.replace(/\s+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function doFormat() {
  error.value = ''
  const text = input.value.trim()
  if (!text) {
    ElMessage.warning('请输入需要格式化的 SQL 语句')
    return
  }
  try {
    output.value = formatSql(text, indentSize.value)
  } catch (err) {
    output.value = ''
    error.value = '格式化失败：' + (err?.message || '未知错误')
  }
}

function reset() {
  input.value = ''
  output.value = null
  error.value = ''
}

async function copy() {
  if (!output.value) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(output.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  } finally {
    copying.value = false
  }
}
</script>

<style scoped>
.sql-format {
  max-width: 1200px;
  margin: 0 auto;
}

.mode-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.mode-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.result-textarea {
  margin-top: 12px;
}

.result-textarea :deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 12px;
}

.error-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-danger);
}
</style>
