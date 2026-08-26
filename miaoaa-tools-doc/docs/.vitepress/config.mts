import { defineConfig } from 'vitepress'

// 图片工具侧边栏项
const imageTools = [
  { text: '图片裁剪', link: '/tools/image/crop' },
  { text: '图片压缩', link: '/tools/image/compress' },
  { text: '图片九宫格切图', link: '/tools/image/grid9' },
  { text: '图片裁剪圆角', link: '/tools/image/corner-radius' },
  { text: '透明图片加背景', link: '/tools/image/add-bg' },
  { text: '图片加水印', link: '/tools/image/watermark' },
  { text: '图片旋转', link: '/tools/image/rotate' },
  { text: '图片水平/垂直翻转', link: '/tools/image/flip' },
]

const convertTools = [
  { text: 'avif/webp 转 png', link: '/tools/convert/avif-webp-to-png' },
  { text: '图片 & Base64 互转', link: '/tools/convert/image-base64' },
  { text: '图片 & SVG 互转', link: '/tools/convert/image-svg' },
  { text: '图片转 ICO', link: '/tools/convert/image-to-ico' },
  { text: 'GIF 拆分 PNG', link: '/tools/convert/gif-split' },
  { text: '多 PNG 合成 GIF', link: '/tools/convert/gif-merge' },
  { text: '字母大小写互转', link: '/tools/convert/case-convert' },
  { text: 'URL 编码/解码', link: '/tools/convert/url-encode' },
  { text: '变量格式转换', link: '/tools/convert/variable' },
  { text: '字符串生成二维码', link: '/tools/convert/qrcode-gen' },
  { text: '二维码解码', link: '/tools/convert/qrcode-decode' },
  { text: '字符串生成条形码', link: '/tools/convert/barcode-gen' },
  { text: '条形码解码', link: '/tools/convert/barcode-decode' },
  { text: '金额大小写互转', link: '/tools/convert/amount-case' },
  { text: '时间戳转换', link: '/tools/convert/timestamp' },
  { text: 'JSON 导出 Excel', link: '/tools/convert/json-to-excel' },
]

const formatTools = [
  { text: 'JSON 格式化', link: '/tools/format/json' },
  { text: 'SQL 格式化', link: '/tools/format/sql' },
  { text: '文字竖排', link: '/tools/format/vertical-text' },
]

const codeTools = [
  { text: '代码对比', link: '/tools/code/diff' },
  { text: '正则表达式测试', link: '/tools/code/regex' },
]

const mockTools = [{ text: 'Mock 数据生成器', link: '/tools/mock/generator' }]

const videoTools = [
  { text: '视频时长裁剪', link: '/tools/video/trim' },
  { text: '视频&GIF互转', link: '/tools/video/gif-convert' },
]

const audioTools = [
  { text: '音频时长裁剪', link: '/tools/audio/crop' },
  { text: '文本转语音', link: '/tools/audio/word-to-audio' },
  { text: '文本转语音（跟读变色）', link: '/tools/audio/word-to-audio-v2' },
  { text: '语音转文字', link: '/tools/audio/audio-to-word' },
]

const externalProjects = [
  { text: 'uniapp-login-template', link: '/external/uniapp-login-template' },
  { text: 'typora-theme', link: '/external/typora-theme' },
  { text: 'perler-beads-helper', link: '/external/perler-beads-helper' },
  { text: 'cool-web', link: '/external/cool-web' },
  { text: 'periodic-table', link: '/external/periodic-table' },
  { text: 'restaurant-vue-html-template', link: '/external/restaurant-vue-html-template' },
  { text: 'ai-pets', link: '/external/ai-pets' },
  { text: 'avif-or-webp-to-png', link: '/external/avif-or-webp-to-png' },
  { text: 'ranking-from-ramming-to-pulling', link: '/external/ranking-from-ramming-to-pulling' },
  { text: 'material-length-and-consumption-calculation', link: '/external/material-length-and-consumption-calculation' },
  { text: 'keyboard', link: '/external/keyboard' },
  { text: 'cnblogs-theme', link: '/external/cnblogs-theme' },
]

export default defineConfig({
  lang: 'zh-CN',
  title: 'Miaoaa Tools 文档',
  description: '本地离线开发工具集合（36 个工具 × 4 种形态）的完整使用文档',
  head: [['link', { rel: 'icon', href: '/logo.png' }]],
  cleanUrls: true,
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: '首页', link: '/' },
      { text: '项目总览', link: '/guide/overview' },
      { text: '工具', link: '/tools/' },
      { text: '外部项目', link: '/external/' },
    ],
    sidebar: [
      {
        text: '项目总览',
        items: [
          { text: '项目总览', link: '/guide/overview' },
          { text: 'Web 应用', link: '/guide/web' },
          { text: '浏览器插件', link: '/guide/browser' },
          { text: 'VSCode 插件', link: '/guide/vscode' },
          { text: 'uTools 插件', link: '/guide/utools' },
        ],
      },
      { text: '工具索引', link: '/tools/' },
      { text: '图片工具', collapsed: false, items: imageTools },
      { text: '转换工具', collapsed: true, items: convertTools },
      { text: '格式化工具', collapsed: true, items: formatTools },
      { text: '代码工具', collapsed: true, items: codeTools },
      { text: 'Mock 工具', collapsed: true, items: mockTools },
      { text: '视频工具', collapsed: true, items: videoTools },
      { text: '音频工具', collapsed: true, items: audioTools },
      {
        text: '外部项目',
        collapsed: true,
        items: [{ text: '外部项目总览', link: '/external/' }, ...externalProjects],
      },
    ],
    search: {
      provider: 'local',
    },
    outline: {
      label: '本页目录',
      level: [2, 3],
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    lastUpdated: {
      text: '最后更新于',
    },
    socialLinks: [
      { icon: 'github', link: 'https://gitee.com/miaoaa66/miaoaa-tools' },
    ],
  },
})
