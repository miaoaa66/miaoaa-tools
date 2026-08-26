<template>
  <div class="home">
    <!-- Miaoaa Tools 项目介绍 -->
    <section class="intro">
      <h2>Miaoaa Tools</h2>
      <p class="subtitle">轻量开发工具集 · 纯前端 · 本地离线可用 · 易搭建易部署</p>
      <p class="desc">
        一站式在线开发工具集，覆盖图片、音视频、文本编码、代码格式化、数据处理等常用开发场景：图片支持
        AVIF / WebP / PNG 格式互转、压缩裁剪、九宫格切图、转 ICO、Base64 / SVG 转换、旋转翻转、圆角加水印、GIF
        拆分与合成；开发辅助提供 URL 编解码、二维码 / 条形码生成解析、时间戳与日期互转、字母大小写互转、金额大小写互转、
        变量格式转换、JSON 导出 Excel、Mock 数据生成、代码对比、正则表达式测试、文本转语音等实用功能。
      </p>
      <div class="tags">
        <el-tag v-for="t in tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
      </div>
      <p class="repo">
        仓库：
        <el-link type="primary" href="https://gitee.com/miaoaa66/miaoaa-tools" target="_blank">
          https://gitee.com/miaoaa66/miaoaa-tools
        </el-link>
      </p>
    </section>

    <!-- 其他开源项目 -->
    <h2 class="section-title">其他开源项目</h2>
    <p class="section-sub">Gitee 上除 miaoaa-tools 外的自研项目（不含 fork），按 Star 数排序</p>
    <div class="projects-grid">
      <el-card
        v-for="item in projects"
        :key="item.name"
        class="project-card"
        shadow="hover"
      >
        <div class="card-head">
          <el-link type="primary" :href="item.url" target="_blank" class="name">
            {{ item.name }}
          </el-link>
          <el-tag v-if="item.lang" size="small" effect="plain">{{ item.lang }}</el-tag>
        </div>
        <el-tooltip
          :content="item.desc"
          placement="top"
          :show-after="150"
          :disabled="!item.desc || item.desc.length <= 30"
        >
          <p class="card-desc">{{ item.desc }}</p>
        </el-tooltip>
        <div class="card-foot">
          <span class="star">★ {{ item.stars }}</span>
          <span class="category">{{ item.category }}</span>
          <el-link type="primary" :href="item.url" target="_blank">查看</el-link>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const tags = ['纯前端', '本地离线', '易搭建', '易部署', '功能全']

const projects = ref([
  {
    name: 'uniapp-login-template',
    desc: 'uni-app 登录模板 / 页面模板，开箱即用，可快速搭建登录页与常用页面。',
    url: 'https://gitee.com/miaoaa66/uniapp-login-template',
    lang: 'uni-app',
    stars: 19,
    category: '模板',
  },
  {
    name: 'typora-theme',
    desc: 'Typora 主题（Markdown 编辑器），美化写作界面。',
    url: 'https://gitee.com/miaoaa66/typora-theme',
    lang: 'CSS',
    stars: 6,
    category: '主题',
  },
  {
    name: 'perler-beads-helper',
    desc: '拼豆工具：输入豆板大小，上传图片即可获取像素点坐标图。',
    url: 'https://gitee.com/miaoaa66/perler-beads-helper',
    lang: '',
    stars: 3,
    category: '工具',
  },
  {
    name: 'cool-web',
    desc: '炫酷网站汇总，收录各类网页动效与创意灵感站点。',
    url: 'https://gitee.com/miaoaa66/cool-web',
    lang: '',
    stars: 1,
    category: '灵感收集',
  },
  {
    name: 'periodic-table',
    desc: '元素周期表，基于 HTML + Vue 2 实现。',
    url: 'https://gitee.com/miaoaa66/periodic-table',
    lang: '',
    stars: 1,
    category: '网页应用',
  },
  {
    name: 'restaurant-vue-html-template',
    desc: '餐厅网页模板，配置信息即可实现，基于 HTML + Vue 2。',
    url: 'https://gitee.com/miaoaa66/restaurant-vue-html-template',
    lang: '',
    stars: 1,
    category: '模板',
  },
  {
    name: 'ai-pets',
    desc: 'Codex、Claude Code、DeepSeek Harness、Hermes、OpenCode、Gemini CLI 等 AI 编程工具的宠物。',
    url: 'https://gitee.com/miaoaa66/ai-pets',
    lang: '',
    stars: 1,
    category: '趣味项目',
  },
  {
    name: 'avif-or-webp-to-png',
    desc: 'AVIF / WebP 图片一键转 PNG。',
    url: 'https://gitee.com/miaoaa66/avif-or-webp-to-png',
    lang: '',
    stars: 1,
    category: '工具',
  },
  {
    name: 'ranking-from-ramming-to-pulling',
    desc: '从夯到拉排行：上传图片并拖拽到对应排行位置。',
    url: 'https://gitee.com/miaoaa66/ranking-from-ramming-to-pulling',
    lang: '',
    stars: 1,
    category: '工具',
  },
  {
    name: 'material-length-and-consumption-calculation',
    desc: '材料长度与消耗计算：上传 Excel 或手动输入，设置误差等参数计算材料用量。',
    url: 'https://gitee.com/miaoaa66/material-length-and-consumption-calculation',
    lang: '',
    stars: 1,
    category: '工具',
  },
  {
    name: 'keyboard',
    desc: '常用键盘汇总：电脑键盘、钢琴键盘等。',
    url: 'https://gitee.com/miaoaa66/keyboard',
    lang: 'HTML',
    stars: 0,
    category: '网页应用',
  },
  {
    name: 'cnblogs-theme',
    desc: '博客园主题，博客主题美化。',
    url: 'https://gitee.com/miaoaa66/cnblogs-theme',
    lang: '',
    stars: 0,
    category: '主题',
  },
])
</script>

<style scoped>
.intro {
  margin-bottom: 32px;
}

.intro h2 {
  margin-bottom: 8px;
}

.subtitle {
  color: var(--el-color-primary);
  font-weight: 600;
  margin-bottom: 12px;
}

.desc {
  line-height: 1.8;
  margin-bottom: 12px;
  color: var(--content-text);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.repo {
  margin-bottom: 0;
  word-break: break-all;
}

.section-title {
  margin-bottom: 8px;
}

.section-sub {
  color: #909399;
  font-size: 13px;
  margin-bottom: 20px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

:deep(.project-card) {
  /* grid item 默认 stretch，卡片自动等高；间距由 .projects-grid gap 接管 */
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.card-head .name {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.6;
  height: calc(1.6em * 2);
  color: #606266;
  margin-bottom: 12px;
  word-break: break-word;
}

.card-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.star {
  color: #e6a23c;
  font-weight: 600;
}

.category {
  color: #909399;
  flex: 1;
}
</style>
