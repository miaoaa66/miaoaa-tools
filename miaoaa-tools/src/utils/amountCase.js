/**
 * 金额数字大小写互转工具
 * 阿拉伯数字金额 <-> 大写中文数字金额
 */

const CN_NUM = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const CN_UNIT = ['', '拾', '佰', '仟']
const CN_SECTION = ['', '万', '亿', '万亿']

/**
 * 阿拉伯数字金额 → 大写中文数字金额
 * @param {number|string} amount - 金额数字，如 12345.67
 * @returns {string} 大写中文金额，如 "壹万贰仟叁佰肆拾伍元陆角柒分"
 */
export function amountToChinese(amount) {
  if (amount === '' || amount === null || amount === undefined) return ''
  const num = parseFloat(amount)
  if (isNaN(num)) return ''
  if (num < 0) return '金额不能为负数'

  const formatted = num.toFixed(2)
  if (formatted === '0.00') return '零元整'

  const [intStr, decStr] = formatted.split('.')
  const intPart = parseInt(intStr)
  const jiao = parseInt(decStr[0])
  const fen = parseInt(decStr[1])

  let result = ''

  // 整数部分
  if (intPart > 0) {
    result += _convertInteger(intPart) + '元'
  }

  // 小数部分
  if (jiao === 0 && fen === 0) {
    result += '整'
  } else {
    if (jiao > 0) {
      result += CN_NUM[jiao] + '角'
    } else if (intPart > 0) {
      result += '零'
    }

    if (fen > 0) {
      result += CN_NUM[fen] + '分'
    }
  }

  return result
}

/**
 * 转换整数部分（4位一节）
 */
function _convertInteger(num) {
  if (num === 0) return ''

  const sections = []
  let n = num
  while (n > 0) {
    sections.push(n % 10000)
    n = Math.floor(n / 10000)
  }

  let result = ''
  let needZero = false

  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i] === 0) {
      needZero = true
      continue
    }

    if (needZero) {
      result += '零'
      needZero = false
    }

    result += _convertSection(sections[i]) + CN_SECTION[i]

    // 如果下一个节非零且小于 1000，中间需要补零
    if (i > 0 && sections[i - 1] > 0 && sections[i - 1] < 1000) {
      needZero = true
    }
  }

  return result
}

/**
 * 转换 0-9999 的数字为中文
 */
function _convertSection(num) {
  if (num === 0) return '零'

  const digits = []
  let n = num
  while (n > 0) {
    digits.push(n % 10)
    n = Math.floor(n / 10)
  }

  let result = ''
  let needZero = false

  for (let i = digits.length - 1; i >= 0; i--) {
    const d = digits[i]
    if (d === 0) {
      needZero = true
    } else {
      if (needZero) {
        result += '零'
        needZero = false
      }
      result += CN_NUM[d]
      if (i > 0) {
        result += CN_UNIT[i]
      }
    }
  }

  return result
}

/**
 * 大写中文数字金额 → 阿拉伯数字金额（字符串格式，保留两位小数）
 * @param {string} chinese - 大写中文金额，如 "壹万贰仟叁佰肆拾伍元陆角柒分"
 * @returns {string} 阿拉伯数字金额，如 "12345.67"
 */
export function chineseToAmount(chinese) {
  if (!chinese || typeof chinese !== 'string') return ''
  let text = chinese.replace(/\s+/g, '')
  if (!text) return ''

  const numMap = {
    '零': 0, '壹': 1, '贰': 2, '叁': 3, '肆': 4,
    '伍': 5, '陆': 6, '柒': 7, '捌': 8, '玖': 9,
  }

  // 处理"整"
  const hasZheng = text.endsWith('整')
  if (hasZheng) {
    text = text.slice(0, -1)
  }

  // 定位"元"或"圆"
  let yuanIdx = text.indexOf('元')
  if (yuanIdx === -1) yuanIdx = text.indexOf('圆')

  let intPart = 0
  let decPart = 0

  // 解析整数部分
  if (yuanIdx > 0) {
    intPart = _parseChineseInteger(text.substring(0, yuanIdx), numMap)
    text = text.substring(yuanIdx + 1)
  } else if (yuanIdx === 0) {
    text = text.substring(1)
  }

  // 解析小数部分（角、分）
  if (text.length > 0) {
    const jiaoIdx = text.indexOf('角')
    const fenIdx = text.indexOf('分')

    if (jiaoIdx > -1 && jiaoIdx > 0) {
      decPart += (numMap[text[jiaoIdx - 1]] || 0) * 0.1
    }
    if (fenIdx > -1 && fenIdx > 0) {
      decPart += (numMap[text[fenIdx - 1]] || 0) * 0.01
    }

    // 没有"元"标记且没有"整"的纯整数情况
    if (yuanIdx === -1 && !hasZheng && text.length > 0) {
      intPart = _parseChineseInteger(text, numMap)
    }
  }

  const total = intPart + decPart
  return total.toFixed(2)
}

/**
 * 解析中文数字字符串为整数
 */
function _parseChineseInteger(text, numMap) {
  const unitMap = { '拾': 10, '佰': 100, '仟': 1000 }
  const sectionMap = { '万': 10000, '亿': 100000000 }

  let result = 0
  let temp = 0
  let currentDigit = 0

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '零') continue

    if (numMap[char] !== undefined) {
      currentDigit = numMap[char]
      if (i === text.length - 1) {
        temp += currentDigit
      }
    } else if (unitMap[char] !== undefined) {
      temp += (currentDigit || 1) * unitMap[char]
      currentDigit = 0
    } else if (char === '万') {
      result += (temp + currentDigit) * 10000
      temp = 0
      currentDigit = 0
    } else if (char === '亿') {
      result += (temp + currentDigit) * 100000000
      temp = 0
      currentDigit = 0
    }
  }

  result += temp + currentDigit
  return result
}