import { HomeFilled, InfoFilled, Switch, Picture, VideoCamera, Document, Files, Headset } from '@element-plus/icons-vue'

/**
 * 侧边栏菜单配置
 * - 顶层项：{ key, label, icon }
 * - 含子菜单：{ key, label, icon, children: [{ key, label }] }
 * key 同时作为路由路径
 */
export const menuList = [
  {
    key: '/',
    label: '首页',
    icon: HomeFilled,
  },
  {
    key: '/about',
    label: '关于',
    icon: InfoFilled,
  },
  {
    key: '/convert',
    label: '转换工具',
    icon: Switch,
    children: [
      {
        key: '/convert/avif-webp-to-png',
        label: 'avif/webp转png',
      },
      {
        key: '/convert/image-base64',
        label: '图片&Base64互转',
      },
      {
        key: '/convert/image-svg',
        label: '图片&SVG互转',
      },
      {
        key: '/convert/image-to-ico',
        label: '图片转ico',
      },
      {
        key: '/convert/gif-split',
        label: 'GIF拆分PNG',
      },
      {
        key: '/convert/gif-merge',
        label: '多PNG合成GIF',
      },
      {
        key: '/convert/url-encode',
        label: 'URL编码/解码',
      },
      {
        key: '/convert/qrcode-gen',
        label: '字符串生成二维码',
      },
      {
        key: '/convert/qrcode-decode',
        label: '二维码解码',
      },
      {
        key: '/convert/barcode-gen',
        label: '字符串生成条形码',
      },
      {
        key: '/convert/barcode-decode',
        label: '条形码解码',
      },
      {
        key: '/convert/variable',
        label: '变量格式转换',
      },
      {
        key: '/convert/case-convert',
        label: '字母大小写互转',
      },
      {
        key: '/convert/amount-case',
        label: '金额大小写互转',
      },
      {
        key: '/convert/timestamp',
        label: '时间戳转换',
      },
      {
        key: '/convert/json-to-excel',
        label: 'JSON导出Excel',
      },
    ],
  },
  {
    key: '/image',
    label: '图片工具',
    icon: Picture,
    children: [
      {
        key: '/image/crop',
        label: '图片裁剪',
      },
      {
        key: '/image/compress',
        label: '图片压缩',
      },
      {
        key: '/image/grid9',
        label: '图片九宫格切图',
      },
      {
        key: '/image/corner-radius',
        label: '图片裁剪圆角',
      },
      {
        key: '/image/add-bg',
        label: '透明图片加背景',
      },
      {
        key: '/image/watermark',
        label: '图片加水印',
      },
      {
        key: '/image/rotate',
        label: '图片旋转',
      },
      {
        key: '/image/flip',
        label: '图片水平/垂直翻转',
      },
    ],
  },
  {
    key: '/format',
    label: '格式化工具',
    icon: Document,
    children: [
      {
        key: '/format/json',
        label: 'JSON格式化',
      },
      {
        key: '/format/sql',
        label: 'SQL格式化',
      },
      {
        key: '/format/vertical-text',
        label: '文字竖排',
      },
    ],
  },
  {
    key: '/code',
    label: '代码工具',
    icon: Files,
    children: [
      {
        key: '/code/diff',
        label: '代码对比',
      },
      {
        key: '/mock/generator',
        label: 'Mock数据生成器',
      },
      {
        key: '/code/regex',
        label: '正则表达式测试',
      },
    ],
  },
  {
    key: '/video',
    label: '视频工具',
    icon: VideoCamera,
    children: [
      {
        key: '/video/trim',
        label: '视频时长裁剪',
      },
    ],
  },
  {
    key: '/audio',
    label: '音频工具',
    icon: Headset,
    children: [
      {
        key: '/audio/crop',
        label: '音频时长裁剪',
      },
    ],
  },
]
