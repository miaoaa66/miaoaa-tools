# 文本转语音

将输入文本用浏览器语音合成朗读出来。

::: tip 所属分类
**音频工具**
:::

## 使用步骤

1. 输入文本。
2. 点击「转为语音」。
3. 用暂停 / 继续 / 取消控制播放。

## 参数 / 选项

- 文本输入（≤300 字）
- 语速 / 音量 / 音高等写死在代码中，无 UI 可调

## 技术实现

- **依赖库**：无第三方库
- **浏览器能力**：`SpeechSynthesis` API（`SpeechSynthesisUtterance`、`speak` / `pause` / `resume` / `cancel`）
- 不支持时提示用 Chrome / Edge / Safari；音色固定为 Microsoft Huihui

## 运行截图

![文本转语音](/screenshots/audio-word-to-audio.png)

## 相关工具

- [文本转语音（跟读变色）](/tools/audio/word-to-audio-v2)
- [语音转文字](/tools/audio/audio-to-word)
