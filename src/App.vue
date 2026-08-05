<template>
  <div class="layout">
    <aside class="layout-sider">
      <div class="logo" @click="handleLogoClick">
        <img alt="logo" src="@/assets/imgs/logo.png" width="32" height="32" />
        <span class="logo-text">Miaoaa Tools</span>
        <button
          class="theme-toggle"
          :title="isDark ? '切换到亮色主题' : '切换到暗色主题'"
          @click.stop="toggleTheme"
        >
          <el-icon :size="18">
            <Sunny v-if="isDark" />
            <Moon v-else />
          </el-icon>
        </button>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="side-menu"
        :background-color="'var(--sidebar-bg)'"
        :text-color="'var(--sidebar-text)'"
        :active-text-color="'var(--sidebar-text-active)'"
      >
        <template v-for="item in menuList" :key="item.key">
          <el-sub-menu v-if="item.children" :index="item.key">
            <template #title>
              <el-icon v-if="item.icon">
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.label }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.key" :index="child.key">
              {{ child.label }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="item.key">
            <el-icon v-if="item.icon">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </aside>
    <main class="layout-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { Sunny, Moon } from '@element-plus/icons-vue'
import { menuList } from '@/menu'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

const isDark = computed(() => themeStore.isDark)
const toggleTheme = () => themeStore.toggleTheme()

const activeMenu = computed(() => route.path)

const handleLogoClick = () => {
  router.push('/')
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.layout-sider {
  width: 260px;
  background-color: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 20px;
  color: var(--sidebar-logo-text);
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid var(--sidebar-logo-border);
  cursor: pointer;
}

.logo-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background-color: var(--toggle-bg);
  color: var(--sidebar-logo-text);
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 0;
}

.theme-toggle:hover {
  background-color: var(--toggle-bg-hover);
}

.side-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}

.side-menu:not(.el-menu--collapse) {
  /* width: 220px; */
}

/* 二级菜单文本与一级菜单（图标后）文本左对齐：20(padding) + 24(icon) + 5(gap) = 49px */
.side-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 49px !important;
}

.side-menu :deep(.el-menu-item.is-active) {
  background-color: var(--menu-active-bg) !important;
  color: #ffffff !important;
}

.side-menu :deep(.el-menu-item.is-active:hover) {
  background-color: var(--menu-active-bg) !important;
  color: #ffffff !important;
}

.layout-content {
  flex: 1;
  padding: 20px;
  background-color: var(--content-bg);
  color: var(--content-text);
  overflow-y: auto;
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
