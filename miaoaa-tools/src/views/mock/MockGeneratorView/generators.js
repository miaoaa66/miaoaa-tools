/**
 * Mock 数据生成器
 * 纯前端实现，不依赖第三方库
 */

// ─── 基础随机工具 ───────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimal = 2) {
  const val = Math.random() * (max - min) + min
  return Number(val.toFixed(decimal))
}

function randomPick(arr) {
  return arr[randomInt(0, arr.length - 1)]
}

function randomPickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// ─── 数据池 ─────────────────────────────────────────

const surnames =
  '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳丰鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅'

const givenNames = [
  '伟', '芳', '娜', '秀英', '敏', '静', '丽', '磊', '强', '洋',
  '勇', '艳', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚',
  '桂英', '文', '华', '建', '志强', '海', '杰', '军', '杰', '婷',
  '雪', '鑫', '浩', '宇', '轩', '子涵', '雨涵', '梓涵', '欣怡', '思琪',
  '俊杰', '浩宇', '子轩', '宇航', '浩然', '一鸣', '致远', '博文', '睿', '翰',
]

const cities = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京',
  '西安', '重庆', '天津', '苏州', '长沙', '郑州', '东莞', '青岛',
  '沈阳', '宁波', '昆明', '大连', '合肥', '福州', '厦门', '济南',
  '哈尔滨', '长春', '太原', '石家庄', '南宁', '兰州',
]

const districts = [
  '朝阳区', '海淀区', '浦东新区', '天河区', '南山区', '西湖区', '武侯区',
  '鼓楼区', '雁塔区', '渝中区', '和平区', '姑苏区', '岳麓区', '金水区',
  '长安区', '市南区', '沈河区', '鄞州区', '五华区', '中山区',
]

const roads = [
  '人民路', '建设路', '解放路', '中山路', '长安街', '南京路', '淮海路',
  '延安路', '和平路', '新华路', '科技路', '高新路', '创业路', '创新路',
  '滨江路', '学府路', '文化路', '花园路', '湖滨路', '望江路',
]

const emailDomains = [
  'qq.com', '163.com', 'gmail.com', 'outlook.com',
  '126.com', 'foxmail.com', 'sina.com', 'aliyun.com',
]

const modules = [
  '用户模块', '订单模块', '支付模块', '商品模块', '权限模块',
  '日志模块', '缓存模块', '数据库模块', '消息队列', '网关服务',
  '文件服务', '搜索服务',
]

const titlePrefixes = [
  '深入理解', '从零开始', '如何实现', '全面解析', '最佳实践',
  '快速上手', '进阶指南', '核心原理', '实战案例', '性能优化',
]

const titleSuffixes = [
  '的N种方式', '的设计思路', '在项目中的应用', '关键技术解析',
  '与性能优化', '的实现原理', '入门指南', '从入门到精通',
  '常见问题汇总', '踩坑记录',
]

const articleTags = [
  'JavaScript', 'Vue', 'React', 'Node.js', 'Python', 'TypeScript',
  'CSS', 'HTML', '前端', '后端', '数据库', 'Docker', 'Kubernetes',
  'DevOps', 'AI', '性能优化', '架构设计', '微服务', 'Git', 'Linux',
]

const urlDomains = [
  'example.com', 'api.example.com', 'blog.example.com',
  'docs.example.com', 'demo.com', 'test.com', 'app.dev',
]

const contentPhrases = [
  '系统', '数据', '服务', '接口', '模块', '功能', '配置', '部署',
  '测试', '监控', '安全', '性能', '架构', '缓存', '队列', '任务',
  '定时', '异步', '同步', '事务', '索引', '查询', '优化', '重构',
  '迁移', '升级', '扩展', '压缩', '加密', '认证', '授权', '日志',
  '报警', '统计', '分析', '计算', '存储', '网络', '协议',
]

// ─── 生成器函数 ─────────────────────────────────────

/** 生成随机字符串 */
function generateString(min = 2, max = 10) {
  const len = randomInt(min, max)
  // 混合中英文
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < len; i++) {
    if (Math.random() < 0.3) {
      // 中文
      result += String.fromCharCode(randomInt(0x4e00, 0x9fa5))
    } else {
      result += chars[randomInt(0, chars.length - 1)]
    }
  }
  return result
}

/** 生成随机数字 */
function generateNumber(rules = {}) {
  const { min = 0, max = 100, decimal } = rules
  if (decimal !== undefined && decimal > 0) {
    return randomFloat(min, max, decimal)
  }
  return randomInt(min, max)
}

/** 生成随机布尔值 */
function generateBoolean() {
  return Math.random() > 0.5
}

/** 生成随机日期字符串 */
function generateDate(rules = {}) {
  const { format = 'YYYY-MM-DD', start, end } = rules
  const startTs = start ? new Date(start).getTime() : new Date('2020-01-01').getTime()
  const endTs = end ? new Date(end).getTime() : Date.now()
  const ts = randomInt(startTs, endTs)
  const date = new Date(ts)

  const pad = (n) => String(n).padStart(2, '0')
  const map = {
    YYYY: date.getFullYear(),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  }
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m])
}

/** 生成随机邮箱 */
function generateEmail() {
  const name = generateString(4, 10).toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${name}@${randomPick(emailDomains)}`
}

/** 生成随机手机号（中国） */
function generatePhone() {
  const prefixes = ['13', '15', '17', '18', '19']
  const prefix = randomPick(prefixes)
  const suffix = String(randomInt(100000000, 999999999))
  return prefix + suffix
}

/** 生成随机中文姓名 */
function generateName() {
  const surname = randomPick(surnames.split(''))
  const given = randomPick(givenNames)
  return surname + given
}

/** 生成随机地址 */
function generateAddress() {
  const city = randomPick(cities)
  const district = randomPick(districts)
  const road = randomPick(roads)
  const num = randomInt(1, 999)
  return `${city}${district}${road}${num}号`
}

/** 生成随机URL */
function generateUrl() {
  const domain = randomPick(urlDomains)
  const path = generateString(3, 8).toLowerCase().replace(/[^a-z0-9/]/g, '/')
  return `https://${domain}/${path}`
}

/** 生成随机IP地址 */
function generateIp() {
  return Array.from({ length: 4 }, () => randomInt(0, 255)).join('.')
}

/** 生成随机UUID (v4) */
function generateUuid() {
  const hex = '0123456789abcdef'
  const s = (n) => {
    let str = ''
    for (let i = 0; i < n; i++) str += hex[randomInt(0, 15)]
    return str
  }
  return `${s(8)}-${s(4)}-4${s(3)}-${hex[randomInt(8, 11)]}${s(3)}-${s(12)}`
}

/** 从枚举列表中随机取值 */
function generateEnum(rules = {}) {
  const { options = [] } = rules
  if (options.length === 0) return ''
  return randomPick(options)
}

/** 生成长文本 */
function generateText(min = 20, max = 200) {
  const len = randomInt(min, max)
  let result = ''
  while (result.length < len) {
    const phrase = randomPick(contentPhrases)
    if (result.length + phrase.length <= len) {
      result += phrase
    }
  }
  return result
}

/** 生成标题 */
function generateTitle() {
  const prefix = randomPick(titlePrefixes)
  const suffix = randomPick(titleSuffixes)
  return prefix + randomPick(contentPhrases) + suffix
}

/** 生成订单号 */
function generateOrderNo() {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const rand = String(randomInt(100000, 999999))
  return `ORD${y}${m}${d}${rand}`
}

/** 生成标签数组 */
function generateTags() {
  const count = randomInt(1, 4)
  return randomPickN(articleTags, count)
}

/** 生成模块名 */
function generateModule() {
  return randomPick(modules)
}

// ─── 类型映射表 ─────────────────────────────────────

export const typeConfig = {
  id: { label: '自增ID', hasRules: false },
  string: { label: '字符串', hasRules: true, ruleFields: ['minLength', 'maxLength'] },
  number: { label: '数字', hasRules: true, ruleFields: ['min', 'max', 'decimal'] },
  boolean: { label: '布尔值', hasRules: false },
  date: { label: '日期', hasRules: true, ruleFields: ['format', 'start', 'end'] },
  email: { label: '邮箱', hasRules: false },
  phone: { label: '手机号', hasRules: false },
  name: { label: '姓名', hasRules: false },
  address: { label: '地址', hasRules: false },
  url: { label: 'URL', hasRules: false },
  ip: { label: 'IP地址', hasRules: false },
  uuid: { label: 'UUID', hasRules: false },
  enum: { label: '枚举', hasRules: true, ruleFields: ['options'] },
  text: { label: '长文本', hasRules: true, ruleFields: ['minLength', 'maxLength'] },
  title: { label: '标题', hasRules: false },
  orderNo: { label: '订单号', hasRules: false },
  tags: { label: '标签', hasRules: false },
  module: { label: '模块', hasRules: false },
}

/** 根据类型和规则生成单个字段值 */
export function generateFieldValue(type, rules = {}, idCounter = { value: 0 }) {
  switch (type) {
    case 'id':
      idCounter.value++
      return idCounter.value
    case 'string':
      return generateString(rules.minLength, rules.maxLength)
    case 'number':
      return generateNumber(rules)
    case 'boolean':
      return generateBoolean()
    case 'date':
      return generateDate(rules)
    case 'email':
      return generateEmail()
    case 'phone':
      return generatePhone()
    case 'name':
      return generateName()
    case 'address':
      return generateAddress()
    case 'url':
      return generateUrl()
    case 'ip':
      return generateIp()
    case 'uuid':
      return generateUuid()
    case 'enum':
      return generateEnum(rules)
    case 'text':
      return generateText(rules.minLength, rules.maxLength)
    case 'title':
      return generateTitle()
    case 'orderNo':
      return generateOrderNo()
    case 'tags':
      return generateTags()
    case 'module':
      return generateModule()
    default:
      return ''
  }
}

/** 根据字段定义列表生成一条完整记录 */
export function generateRecord(fields, idCounter) {
  const record = {}
  for (const field of fields) {
    record[field.name] = generateFieldValue(field.type, field.rules, idCounter)
  }
  return record
}