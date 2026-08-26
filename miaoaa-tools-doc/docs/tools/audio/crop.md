# 音频时长裁剪

上传音频后选取起止区间裁剪导出，流复制无重编码损失。

::: tip 所属分类
**音频工具**
:::

## 使用步骤

1. 上传音频。
2. 用滑块 / 输入框确定起止时间。
3. 点击「试听区间」预览。
4. 点击「裁剪并下载」。

## 参数 / 选项

- 开始 / 结束时间滑块与输入框（步进 0.1s）

## 技术实现

- **依赖库**：`mediabunny`、`@mediabunny/mp3-encoder`
- **浏览器能力**：Web Audio（`AudioContext`、`decodeAudioData`、`createBufferSource`）
- 支持 mp3 / wav / ogg / m4a / flac；输出保持原格式，不支持时降级 WAV；试听依赖 `AudioContext`

## 运行截图

![音频时长裁剪](/screenshots/audio-crop.png)

## 相关工具

- [视频时长裁剪](/tools/video/trim)
- [文本转语音](/tools/audio/word-to-audio)
