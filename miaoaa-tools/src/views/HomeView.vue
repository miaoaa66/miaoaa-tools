<template>
  <div class="">
    <h2>Miaoaa Tools</h2>
    <p>本地离线可用的，常用开发工具</p>
    <p>仓库：
      <el-link type="primary" :href="'https://gitee.com/miaoaa66/miaoaa-tools'"
        target="_blank">https://gitee.com/miaoaa66/miaoaa-tools</el-link>
    </p>
    <h2>其他工具</h2>
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="name" label="工具名称" width="180" />
      <el-table-column prop="desc" label="工具描述" />
      <el-table-column prop="url" label="工具地址">
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
    name: '拼豆工具',
    desc: '上传图片获取图片像素点图',
    url: 'https://gitee.com/miaoaa66/perler-beads-helper',
  },
  {
    name: 'uni-app登录模板',
    desc: 'uni-app登录模板页面',
    url: 'https://gitee.com/miaoaa66/uniapp-login-template',
  },
  {
    name: '从夯到拉排名工具',
    desc: '上传图片拖拽图片到对应排行',
    url: 'https://gitee.com/miaoaa66/ranking-from-ramming-to-pulling',
  },
  {
    name: '材料长度和消耗计算工具',
    desc: '上传excel或者输入，设置误差等参数，计算已有材料和消耗材料的使用',
    url: 'https://gitee.com/miaoaa66/material-length-and-consumption-calculation',
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