<template>
  <div class="">
    <h2>About</h2>
    <p>此项目基于以下库和其他库开发</p>
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="name" label="名称" width="180" />
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
  {
    name: 'vue',
    desc: '',
    url: 'https://vuejs.org/',
  },
  {
    name: 'element plus',
    desc: '',
    url: 'https://element-plus.org/',
  },
  {
    name: 'vite',
    desc: '',
    url: 'https://cn.vitejs.dev/',
  },
  {
    name: 'pinia',
    desc: '',
    url: 'https://pinia.vuejs.org/zh/introduction.html',
  },
  {
    name: 'vue-router',
    desc: '',
    url: 'https://router.vuejs.org/zh/',
  },
  {
    name: 'eslint',
    desc: '',
    url: 'https://eslint.org/',
  },
  {
    name: 'oxc',
    desc: '',
    url: 'https://oxc.rs/docs/guide/usage/linter',
  },
  {
    name: 'gifuct-js',
    desc: 'GIF 拆分 PNG',
    url: 'https://www.npmjs.com/package/gifuct-js',
  },
  {
    name: 'gifenc',
    desc: '多 PNG 合成 GIF',
    url: 'https://www.npmjs.com/package/gifenc',
  },
  {
    name: 'qrcode',
    desc: '字符串生成二维码',
    url: 'https://www.npmjs.com/package/qrcode',
  },
  {
    name: 'jsqr',
    desc: '二维码解码',
    url: 'https://www.npmjs.com/package/jsqr',
  },
  {
    name: 'jsbarcode',
    desc: '字符串生成条形码',
    url: 'https://www.npmjs.com/package/jsbarcode',
  },
  {
    name: '@zxing/library',
    desc: '条形码解码',
    url: 'https://www.npmjs.com/package/@zxing/library',
  },
  {
    name: 'mediabunny',
    desc: '音视频裁剪',
    url: 'https://www.npmjs.com/package/mediabunny',
  },
  {
    name: '',
    desc: '',
    url: '',
  },
  {
    name: '',
    desc: '',
    url: '',
  },
  {
    name: '',
    desc: '',
    url: '',
  },
  {
    name: '',
    desc: '',
    url: '',
  },
  {
    name: '',
    desc: '',
    url: '',
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
