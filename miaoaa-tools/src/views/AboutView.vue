<template>
  <div class="">
    <h2>About</h2>
    <p>本项目是一个本地离线可用的常用开发工具集，涵盖图片处理、音视频处理、格式转换等实用功能，所有处理均在浏览器本地完成，无需后端服务。</p>
    <p>以下为本项目使用到的三方库：</p>
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="name" label="名称" width="300" />
      <el-table-column prop="desc" label="描述" />
      <el-table-column prop="url" label="地址">
        <template #default="scope">
          <el-link type="primary" :href="scope.row.url" target="_blank">{{ scope.row.url }}</el-link>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const tableData = ref([
  // 核心框架
  {
    name: 'vue',
    desc: '核心框架，驱动项目 UI 与响应式数据',
    url: 'https://vuejs.org/',
  },
  {
    name: 'vue-router',
    desc: '官方路由，管理多页面切换与导航',
    url: 'https://router.vuejs.org/zh/',
  },
  {
    name: 'pinia',
    desc: '状态管理，集中管理应用共享状态',
    url: 'https://pinia.vuejs.org/zh/introduction.html',
  },
  // UI 组件
  {
    name: 'element-plus',
    desc: '桌面端 UI 组件库（表格、表单、弹窗等）',
    url: 'https://element-plus.org/',
  },
  {
    name: '@element-plus/icons-vue',
    desc: 'Element Plus 配套图标库',
    url: 'https://www.npmjs.com/package/@element-plus/icons-vue',
  },
  // 构建与质量
  {
    name: 'vite',
    desc: '构建工具与开发服务器',
    url: 'https://cn.vitejs.dev/',
  },
  {
    name: '@vitejs/plugin-vue',
    desc: 'Vite 的 Vue 单文件组件编译插件',
    url: 'https://www.npmjs.com/package/@vitejs/plugin-vue',
  },
  {
    name: 'eslint',
    desc: 'JS 代码规范检查与自动修复',
    url: 'https://eslint.org/',
  },
  {
    name: 'oxlint',
    desc: '基于 Rust 的高性能代码检查器',
    url: 'https://oxc.rs/docs/guide/usage/linter',
  },
  // 二维码 / 条形码
  {
    name: 'qrcode',
    desc: '字符串生成二维码',
    url: 'https://www.npmjs.com/package/qrcode',
  },
  {
    name: 'jsqr',
    desc: '二维码图片解码',
    url: 'https://www.npmjs.com/package/jsqr',
  },
  {
    name: 'jsbarcode',
    desc: '字符串生成条形码',
    url: 'https://www.npmjs.com/package/jsbarcode',
  },
  {
    name: '@zxing/library',
    desc: '条形码图片解码',
    url: 'https://www.npmjs.com/package/@zxing/library',
  },
  // GIF 处理
  {
    name: 'gifuct-js',
    desc: 'GIF 解析拆帧（转 PNG）',
    url: 'https://www.npmjs.com/package/gifuct-js',
  },
  {
    name: 'gifenc',
    desc: '多帧 PNG 合成 GIF',
    url: 'https://www.npmjs.com/package/gifenc',
  },
  // 音视频处理
  {
    name: 'mediabunny',
    desc: '音视频解析与裁剪处理',
    url: 'https://www.npmjs.com/package/mediabunny',
  },
  {
    name: '@mediabunny/mp3-encoder',
    desc: 'MP3 音频编码（mediabunny 配套）',
    url: 'https://www.npmjs.com/package/@mediabunny/mp3-encoder',
  },
  // 其他工具
  {
    name: 'pinyin-pro',
    desc: '中文转拼音，菜单搜索支持拼音/首字母匹配',
    url: 'https://www.npmjs.com/package/pinyin-pro',
  },
  {
    name: 'xlsx',
    desc: 'Excel 文件读写（JSON 转 Excel）',
    url: 'https://www.npmjs.com/package/xlsx',
  },
])
</script>

<style scoped>
h2 {
  margin-bottom: 20px;
}

p {
  margin-bottom: 20px;
}
</style>
