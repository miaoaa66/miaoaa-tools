// 构建并拷贝 miaoaa-tools 的 dist 产物到本扩展的 media/webview 目录。
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SOURCE = path.resolve(__dirname, '..', '..', 'miaoaa-tools')
const DEST = path.resolve(__dirname, '..', 'media', 'webview')

function sleepSync(ms) {
  const sab = new SharedArrayBuffer(4)
  Atomics.wait(new Int32Array(sab), 0, 0, ms)
}

// 删除目录，若遇瞬时文件锁（Windows 下常见 EPERM）则短暂等待后重试
function removeDir(dir) {
  if (!fs.existsSync(dir)) return
  let lastErr
  for (let i = 0; i < 5; i++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
      return
    } catch (err) {
      lastErr = err
      sleepSync(800)
    }
  }
  throw lastErr
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

function main() {
  const shouldBuild = !process.argv.includes('--no-build')

  if (shouldBuild) {
    console.log('[sync-webview] 构建 miaoaa-tools ...')
    removeDir(path.join(SOURCE, 'dist'))
    execSync('npm run build', { cwd: SOURCE, stdio: 'inherit' })
  }

  console.log('[sync-webview] 拷贝 dist -> media/webview ...')
  removeDir(DEST)
  copyDir(path.join(SOURCE, 'dist'), DEST)

  // 同步插件图标 logo.png（从原项目 src/assets/imgs/logo.png 拷贝到本扩展 media/）
  const logoSrc = path.join(SOURCE, 'src', 'assets', 'imgs', 'logo.png')
  const logoDest = path.resolve(__dirname, '..', 'media', 'logo.png')
  if (fs.existsSync(logoSrc)) {
    fs.mkdirSync(path.dirname(logoDest), { recursive: true })
    fs.copyFileSync(logoSrc, logoDest)
    console.log('[sync-webview] 同步 logo.png -> media/logo.png')
  } else {
    console.warn('[sync-webview] 未找到 ' + logoSrc + '，跳过 logo 同步')
  }

  console.log('[sync-webview] 完成')
}

main()
