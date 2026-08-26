# 文本转语音（跟读变色）

朗读文本时，已读部分同步变色高亮显示。

::: tip 所属分类
**音频工具**
:::

## 使用步骤

1. 输入文本。
2. 点击「转为语音」。
3. 朗读中已读文本变 coral 色。
4. 暂停 / 继续 / 取消控制播放。

## 参数 / 选项

- 文本输入（≤400 字），朗读时输入框锁定为只读

## 技术实现

- **依赖库**：无第三方库
- **浏览器能力**：`SpeechSynthesis`（`onboundary` 事件按 `charIndex` 拆分高亮）
- 依赖浏览器对 `onboundary` 事件的支持；音色固定 Microsoft Huihui

## 运行截图

![文本转语音（跟读变色）](/screenshots/audio-word-to-audio-v2.png)

## 相关工具

- [文本转语音](/tools/audio/word-to-audio)
- [语音转文字](/tools/audio/audio-to-word)
