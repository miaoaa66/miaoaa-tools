# 语音转文字

通过麦克风录音并将语音识别为文字显示。

::: tip 所属分类
**音频工具**
:::

## 使用步骤

1. 点击「语音识别」开始。
2. 说话。
3. 再次点击或识别结束显示文字。

## 参数 / 选项

- 无参数；识别语言写死 zh-CN

## 技术实现

- **依赖库**：无第三方库
- **浏览器能力**：`SpeechRecognition` / `webkitSpeechRecognition`
- 需 Chrome / Edge 最新版；需授权麦克风；仅取第一个结果 `transcript`，不连续识别

## 运行截图

![语音转文字](/screenshots/audio-audio-to-word.png)

## 相关工具

- [文本转语音](/tools/audio/word-to-audio)
- [文本转语音（跟读变色）](/tools/audio/word-to-audio-v2)
