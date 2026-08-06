import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const SITE_TITLE = 'Miaoaa Tools'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: '首页' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { title: '关于' },
    },
    {
      path: '/convert/avif-webp-to-png',
      name: 'avif-webp-to-png',
      component: () => import('../views/convert/AvifWebpToPngView/AvifWebpToPngView.vue'),
      meta: { title: 'avif/webp转png' },
    },
    {
      path: '/convert/image-base64',
      name: 'image-base64',
      component: () => import('../views/convert/ImageBase64View/ImageBase64View.vue'),
      meta: { title: '图片&Base64互转' },
    },
    {
      path: '/convert/image-svg',
      name: 'image-svg',
      component: () => import('../views/convert/ImageSvgView/ImageSvgView.vue'),
      meta: { title: '图片&SVG互转' },
    },
    {
      path: '/convert/image-to-ico',
      name: 'image-to-ico',
      component: () => import('../views/convert/ImageToIcoView/ImageToIcoView.vue'),
      meta: { title: '图片转ico' },
    },
    {
      path: '/convert/gif-split',
      name: 'gif-split',
      component: () => import('../views/convert/GifSplitView/GifSplitView.vue'),
      meta: { title: 'GIF拆分PNG' },
    },
    {
      path: '/convert/gif-merge',
      name: 'gif-merge',
      component: () => import('../views/convert/GifMergeView/GifMergeView.vue'),
      meta: { title: '多PNG合成GIF' },
    },
    {
      path: '/convert/url-encode',
      name: 'url-encode',
      component: () => import('../views/convert/UrlEncodeView/UrlEncodeView.vue'),
      meta: { title: 'URL编码/解码' },
    },
    {
      path: '/convert/variable',
      name: 'variable-convert',
      component: () => import('../views/convert/VariableConvertView/VariableConvertView.vue'),
      meta: { title: '变量格式转换' },
    },
    {
      path: '/convert/qrcode-gen',
      name: 'qrcode-gen',
      component: () => import('../views/convert/QrcodeGenView/QrcodeGenView.vue'),
      meta: { title: '字符串生成二维码' },
    },
    {
      path: '/convert/qrcode-decode',
      name: 'qrcode-decode',
      component: () => import('../views/convert/QrcodeDecodeView/QrcodeDecodeView.vue'),
      meta: { title: '二维码解码' },
    },
    {
      path: '/convert/barcode-gen',
      name: 'barcode-gen',
      component: () => import('../views/convert/BarcodeGenView/BarcodeGenView.vue'),
      meta: { title: '字符串生成条形码' },
    },
    {
      path: '/convert/barcode-decode',
      name: 'barcode-decode',
      component: () => import('../views/convert/BarcodeDecodeView/BarcodeDecodeView.vue'),
      meta: { title: '条形码解码' },
    },
    {
      path: '/image/crop',
      name: 'image-crop',
      component: () => import('../views/image/ImageCropView/ImageCropView.vue'),
      meta: { title: '图片裁剪' },
    },
    {
      path: '/image/compress',
      name: 'image-compress',
      component: () => import('../views/image/ImageCompressView/ImageCompressView.vue'),
      meta: { title: '图片压缩' },
    },
    {
      path: '/image/grid9',
      name: 'image-grid9',
      component: () => import('../views/image/ImageGrid9View/ImageGrid9View.vue'),
      meta: { title: '图片九宫格切图' },
    },
    {
      path: '/format/json',
      name: 'format-json',
      component: () => import('../views/format/JsonFormatView/JsonFormatView.vue'),
      meta: { title: 'JSON格式化' },
    },
    {
      path: '/format/sql',
      name: 'format-sql',
      component: () => import('../views/format/SqlFormatView/SqlFormatView.vue'),
      meta: { title: 'SQL格式化' },
    },
    {
      path: '/code/diff',
      name: 'code-diff',
      component: () => import('../views/code/CodeDiffView/CodeDiffView.vue'),
      meta: { title: '代码对比' },
    },
  ],
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} - ${SITE_TITLE}` : SITE_TITLE
})

export default router
