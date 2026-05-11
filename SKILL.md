---
name: foxxiplay-gen
description: FoxxiPlay AI 图片与视频生成 Skill。封装 FoxxiPlay API 中转服务（OpenAI 兼容）的 Doubao Seedream / Seedance 与 HappyHorse 模型，提供图片生成（同步）与视频生成（异步任务）能力。当用户提到 FoxxiPlay、Seedream、Seedance、HappyHorse、快乐马、豆包图片、豆包视频，或需求落在文生图、海报生成、电商主视觉、文生视频（T2V）、首帧图生视频（I2V）、参考图生视频（R2V）、5/10/15 秒视频、9:16 / 16:9 视频生成时，使用此 Skill。
---

# FoxxiPlay 图片与视频生成

统一调用 FoxxiPlay API 中转服务（OpenAI 兼容协议）的图像与视频生成能力。

## 适用场景

当用户的请求落在以下场景时，使用本 Skill：

- 图像生成：文生图、海报、电商主视觉、视觉探索、稳定风格出图
- 视频生成：文生视频、图生视频、视频输入编辑（如换背景），5 / 10 / 15 秒视频，9:16 / 16:9 / 1:1 比例
- 异步任务：查询、列表、删除任务

## 模型映射（默认）

| 类型 | 默认模型 | 备选 |
|------|---------|------|
| 图片 `image` | `doubao-seedream-5.0` | `doubao-seedream-4.5` |
| 视频 `video` | `doubao-seedance-2.0` | `doubao-seedance-2.0-fast`, `doubao-seedance-1.5-pro`, `happyhorse-1.0-t2v`, `happyhorse-1.0-i2v`, `happyhorse-1.0-r2v`, `happyhorse-1.0-video-edit` |

仅 `doubao-seedance-2.0` 支持显式 `generate_audio: true` 参数。Seedance 2.0 也支持视频输入编辑和参考音频引导，可通过 `--video <url/path>`、`--audio <url/path>` 传入公网 URL 或本地文件。

### Seedream 图片尺寸规则

使用 `doubao-seedream-4.5` 或 `doubao-seedream-5.0-lite` 生成图片时，`--size` 支持两种写法，**不可混用**：

1. **分辨率模式**：指定该模型支持的 `2K` / `3K` / `4K` 这类分辨率值，同时在 prompt 中用自然语言说明宽高比、图片形状或用途，例如“竖版 9:16 海报”“方形头像”“横版 16:9 电商主视觉”。最终像素由模型判断。
2. **像素模式**：`--size <宽>x<高>`，例如 `2048x2048`。默认值为 `2048x2048`。

分辨率模式的可选值按模型区分：

| 模型 | 可选分辨率值 |
|------|------|
| `doubao-seedream-4.5` | `2K`, `4K` |
| `doubao-seedream-5.0-lite` | `2K`, `3K`, `4K` |

像素模式必须同时满足：

- 总像素范围：`2560x1440=3686400` 到 `4096x4096=16777216`。
- 宽高比范围：`1/16` 到 `16`。
- 总像素限制是宽度和高度的乘积限制，不是对单边宽度或高度的限制。

示例：

- 有效：`3750x1250`，总像素 `4687500`，宽高比 `3`。
- 无效：`1500x1500`，总像素 `2250000`，低于最低总像素要求。

`doubao-seedream-4.5` 推荐像素值：

| 分辨率 | 宽高比 | 宽高像素值 |
|------|------|------|
| 2K | 1:1 | `2048x2048` |
| 2K | 4:3 | `2304x1728` |
| 2K | 3:4 | `1728x2304` |
| 2K | 16:9 | `2848x1600` |
| 2K | 9:16 | `1600x2848` |
| 2K | 3:2 | `2496x1664` |
| 2K | 2:3 | `1664x2496` |
| 2K | 21:9 | `3136x1344` |
| 4K | 1:1 | `4096x4096` |
| 4K | 3:4 | `3520x4704` |
| 4K | 4:3 | `4704x3520` |
| 4K | 16:9 | `5504x3040` |
| 4K | 9:16 | `3040x5504` |
| 4K | 2:3 | `3328x4992` |
| 4K | 3:2 | `4992x3328` |
| 4K | 21:9 | `6240x2656` |

`doubao-seedream-5.0-lite` 推荐像素值：

| 分辨率 | 宽高比 | 宽高像素值 |
|------|------|------|
| 2K | 1:1 | `2048x2048` |
| 2K | 4:3 | `2304x1728` |
| 2K | 3:4 | `1728x2304` |
| 2K | 16:9 | `2848x1600` |
| 2K | 9:16 | `1600x2848` |
| 2K | 3:2 | `2496x1664` |
| 2K | 2:3 | `1664x2496` |
| 2K | 21:9 | `3136x1344` |
| 3K | 1:1 | `3072x3072` |
| 3K | 4:3 | `3456x2592` |
| 3K | 3:4 | `2592x3456` |
| 3K | 16:9 | `4096x2304` |
| 3K | 9:16 | `2304x4096` |
| 3K | 2:3 | `2496x3744` |
| 3K | 3:2 | `3744x2496` |
| 3K | 21:9 | `4704x2016` |
| 4K | 1:1 | `4096x4096` |
| 4K | 3:4 | `3520x4704` |
| 4K | 4:3 | `4704x3520` |
| 4K | 16:9 | `5504x3040` |
| 4K | 9:16 | `3040x5504` |
| 4K | 2:3 | `3328x4992` |
| 4K | 3:2 | `4992x3328` |
| 4K | 21:9 | `6240x2656` |

### HappyHorse 1.0 视频模型

同样走 `/v1/contents/generations/tasks` 异步任务接口，`content` 数组结构与 Seedance 一致。

| 模型 | 模式 | 必填参数 | 适用场景 |
|------|------|---------|---------|
| `happyhorse-1.0-t2v` | 文生视频 | `content` (text), `ratio`, `resolution`, `duration` | 创意短片、镜头预览、纯文本驱动的动态画面 |
| `happyhorse-1.0-i2v` | 首帧图生视频 | `content` (text + image_url), `resolution`, `duration` | 让指定首帧自然动起来；比例由首帧图决定，**不传 `ratio`** |
| `happyhorse-1.0-r2v` | 参考图生视频 | `content` (text + image_url), `ratio`, `resolution`, `duration` | 角色 / 产品 / 场景一致性视频 |
| `happyhorse-1.0-video-edit` | 视频编辑 | `input` (prompt + video + 可选 reference_image), `parameters` | 自然语言指令编辑视频，可参考最多 5 张图片局部或全局编辑视频元素 |

HappyHorse 系列不支持上传 `--audio` 参考音频；但生成结果可能默认带音轨。`--generate-audio` 对 HappyHorse 不需要显式传入，脚本会将其视为兼容参数并忽略。

## 接口约定

| 能力 | HTTP | 路径 | 同步/异步 |
|------|------|------|-----------|
| 图片生成 | POST | `/v1/images/generations` | 同步 |
| 视频/3D 任务创建 | POST | `/v1/contents/generations/tasks` | 异步 |
| 任务列表 | GET  | `/v1/contents/generations/tasks` | — |
| 任务详情 | GET  | `/v1/contents/generations/tasks/{task_id}` | — |
| 任务删除 | DELETE | `/v1/contents/generations/tasks/{task_id}` | — |
| 模型列表 | GET  | `/v1/models?type=image\|video\|text\|three_d` | — |

所有接口使用 `Authorization: Bearer ${FOXXIPLAY_API_KEY}` 鉴权。

## 环境变量

```
FOXXIPLAY_API_KEY     必填，控制台复制的 API Key
FOXXIPLAY_BASE_URL    可选，默认 http://47.111.187.160
FOXXIPLAY_UPLOAD_URL  可选，本地图片/视频自动上传端点，默认 https://uguu.se/upload.php
```

兼容旧配置：脚本仍会读取 `FOXICOIN_API_KEY` / `FOXICOIN_BASE_URL` / `FOXICOIN_UPLOAD_URL` 作为 fallback。

## 快速开始

```bash
export FOXXIPLAY_API_KEY="sk-xxxxxxxx"

# 1. 文生图（同步，立即返回 URL）
node <skills-dir>/foxxiplay-gen/scripts/main.mjs image \
  --prompt "未来感中式茶室，竹影、浅色石材、漂浮的全息菜单" \
  --size 2048x2048 \
  --output ./tea-room.png

# 2. 文生视频（异步，提交后自动轮询直到完成）
node <skills-dir>/foxxiplay-gen/scripts/main.mjs video \
  --prompt "赛博朋克雨夜城市，少女听到声音后慢慢回头，电影感" \
  --ratio 9:16 \
  --resolution 720p \
  --duration 15 \
  --generate-audio \
  --output ./scene.mp4

# 2a. HappyHorse 文生视频（T2V）
node <skills-dir>/foxxiplay-gen/scripts/main.mjs video \
  --model happyhorse-1.0-t2v \
  --prompt "清晨森林里一束阳光穿过树叶，镜头缓慢前移，电影感" \
  --ratio 16:9 --resolution 720p --duration 5 \
  --output ./forest.mp4

# 2b. HappyHorse 首帧图生视频（I2V，比例由首帧图决定，无需 --ratio）
node <skills-dir>/foxxiplay-gen/scripts/main.mjs video \
  --model happyhorse-1.0-i2v \
  --prompt "让首帧中的人物自然抬头微笑，背景光线轻微变化" \
  --image https://example.com/first-frame.png \
  --resolution 720p --duration 5 \
  --output ./i2v.mp4

# 2c. HappyHorse 参考图生视频（R2V）
node <skills-dir>/foxxiplay-gen/scripts/main.mjs video \
  --model happyhorse-1.0-r2v \
  --prompt "根据参考图生成一段镜头稳定的产品展示视频，柔和灯光，画面干净" \
  --image https://example.com/reference.png \
  --ratio 16:9 --resolution 720p --duration 5 \
  --output ./r2v.mp4

# 2c2. Seedance 首尾帧生成（第一张作为首帧，第二张作为尾帧）
node <skills-dir>/foxxiplay-gen/scripts/main.mjs video \
  --model doubao-seedance-2.0 \
  --prompt "人物快速转身，雾气遮住镜头，雾散后换成尾帧服装" \
  --first-frame ./start.png \
  --last-frame ./end.png \
  --resolution 720p --duration 5 \
  --output ./start-to-end.mp4

# 2d. Seedance 视频输入编辑（例如换背景）
node <skills-dir>/foxxiplay-gen/scripts/main.mjs video \
  --model doubao-seedance-2.0 \
  --prompt "保留输入视频中的人物、动作和镜头，将背景替换为温暖古风室内场景" \
  --video ./input.mp4 \
  --ratio 9:16 --resolution 1080p --duration 15 \
  --output ./indoor.mp4

# 2e. Seedance 参考音频生成（例如说话口型 / 语音引导）
node <skills-dir>/foxxiplay-gen/scripts/main.mjs video \
  --model doubao-seedance-2.0 \
  --prompt "参考图中的人物开心地面向镜头说话，口型尽量匹配参考音频" \
  --image ./character.jpg \
  --audio ./voice.mp3 \
  --ratio 9:16 --resolution 1080p --duration 10 \
  --generate-audio \
  --output ./talking.mp4

# 2f. HappyHorse 视频编辑（自然语言指令 + 输入视频 + 最多 5 张参考图）
node <skills-dir>/foxxiplay-gen/scripts/main.mjs video \
  --model happyhorse-1.0-video-edit \
  --prompt "保留原视频人物动作和镜头，把服装替换为参考图风格，背景改为雨夜街道" \
  --video ./source.mp4 \
  --image ./style-reference.png \
  --image ./outfit-reference.png \
  --ratio 9:16 --resolution 720p --duration 5 \
  --output ./edited.mp4

# 3. 仅创建任务（不轮询）
node <skills-dir>/foxxiplay-gen/scripts/main.mjs video \
  --prompt "城市夜景双人交手" \
  --no-wait

# 4. 查询任务结果
node <skills-dir>/foxxiplay-gen/scripts/main.mjs task <task_id>

# 5. 任务列表
node <skills-dir>/foxxiplay-gen/scripts/main.mjs tasks --limit 20

# 6. 删除任务
node <skills-dir>/foxxiplay-gen/scripts/main.mjs task-delete <task_id>

# 7. 模型列表
node <skills-dir>/foxxiplay-gen/scripts/main.mjs models --type video
```

## 子命令

### `image` — 图片生成（同步）

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `--prompt`, `-p` | string | 必填 | 画面描述 |
| `--model`, `-m` | string | `doubao-seedream-5.0` | 模型 ID |
| `--size`, `-s` | string | `2048x2048` | 输出尺寸。`doubao-seedream-4.5` 可用 `2K` / `4K`；`doubao-seedream-5.0-lite` 可用 `2K` / `3K` / `4K`；也可用合法像素值如 `2048x2048`、`2848x1600`、`1600x2848`；两种写法不可混用 |
| `--negative-prompt` | string | — | 负向提示词 |
| `--count`, `-n` | int 1–4 | 1 | 生成数量 |
| `--seed` | int | — | 随机种子 |
| `--guidance-scale` | float | — | 提示词遵循强度 |
| `--watermark` | bool | — | 是否添加水印 |
| `--response-format` | enum | `url` | `url` 或 `b64_json` |
| `--reference` | url/path | — | 参考图 URL 或本地路径（可重复，用于图生图）；本地路径会先自动上传 |
| `--output`, `-o` | path | — | 下载到本地路径 |
| `--json` | flag | — | 直接输出原始 JSON |

### `video` — 视频任务（异步）

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `--prompt`, `-p` | string | 必填 | 视频描述 |
| `--model`, `-m` | string | `doubao-seedance-2.0` | 模型 ID（支持 `happyhorse-1.0-t2v / -i2v / -r2v / -video-edit`） |
| `--ratio`, `-r` | string | `16:9` | 比例：`16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9`；使用 `--first-frame` 或 `happyhorse-1.0-i2v` 时，未显式传入会自动省略，由首帧图决定 |
| `--resolution` | string | `720p` | 清晰度：`480p`, `720p`, `1080p` |
| `--duration`, `-d` | int | 5 | 时长：`5` / `10` / `15` |
| `--generate-audio` | flag | false | 是否显式请求生成音频（仅 `doubao-seedance-2.0` 使用；HappyHorse 可能默认带音轨，此参数会被忽略） |
| `--seed` | int | — | 随机种子 |
| `--watermark` | bool | — | 水印 |
| `--image` | url/path | — | 参考图（可多次：首帧、尾帧等）。`happyhorse-1.0-i2v` / `-r2v` 必须至少传一张；本地路径会先自动上传 |
| `--first-frame` | url/path | — | 首帧图片（可多次，通常传 1 张）。会排在所有 `--image` 参考图之前；本地路径会先自动上传 |
| `--last-frame` | url/path | — | 尾帧图片（可多次，通常传 1 张）。会排在所有 `--image` 参考图之后；本地路径会先自动上传 |
| `--video` | url/path | — | 输入/参考视频（可多次）。用于 Seedance 视频输入编辑，或 `happyhorse-1.0-video-edit` 的源视频；本地路径会先自动上传 |
| `--audio` | url/path | — | 参考音频（可多次）。用于 Seedance 语音/口型引导；HappyHorse 不支持上传参考音频；本地路径会先自动上传 |
| `--upload-url` | url | `FOXXIPLAY_UPLOAD_URL` 或 Uguu | 本地媒体自动上传端点。默认使用临时托管服务；长期复用建议配置自己的 OSS / S3 / R2 / COS 上传入口 |
| `--output`, `-o` | path | — | 完成后下载到本地路径 |
| `--no-wait` | flag | — | 仅创建任务，不轮询 |
| `--poll-interval` | seconds | 5 | 轮询间隔 |
| `--timeout` | seconds | 600 | 总超时时间 |
| `--json` | flag | — | 直接输出原始 JSON |

### `task <task_id>` — 查询任务详情

返回 `status` / `task_id` / `result` / `assets` / `_relay_billing`。
状态：`queued` / `running` / `succeeded` / `failed` / `canceled`。脚本会兼容服务端返回的大写状态（如 `RUNNING` / `SUCCEEDED`）。

### `tasks` — 任务列表

| 参数 | 说明 |
|------|------|
| `--limit` | 返回条数（如服务端支持） |
| `--json` | 原始 JSON |

### `task-delete <task_id>` — 删除任务

### `models` — 模型列表

| 参数 | 说明 |
|------|------|
| `--type` | `text` / `image` / `video` / `three_d` |

返回包含 `pricing.summary`、`pricing.short_summary`、`pricing.details`。

## 行为约定

1. **图片生成**：默认 `--response-format=url`，若提供 `--output` 会自动下载到本地。使用 `doubao-seedream-4.5` 或 `doubao-seedream-5.0-lite` 时，脚本会在请求前校验 `--size` 是否符合官方的分辨率模式或像素模式规则。
2. **本地媒体**：`--reference` / `--image` / `--first-frame` / `--last-frame` / `--video` / `--audio` 可传公网 URL 或本地路径；本地路径会先上传到 `--upload-url` / `FOXXIPLAY_UPLOAD_URL` / 默认 Uguu，再写入请求。
3. **视频生成**：默认会自动轮询任务，完成后若提供 `--output` 自动下载主资源；用 `--no-wait` 跳过轮询。轮询时会兼容 `status`、`data.status`、`output.task_status`，下载时会识别 `output.video_url` 等常见结果字段。
4. **HappyHorse 结构**：HappyHorse 系列会按 API 文档发送 `input.prompt` / `input.media` / `parameters` 结构；`happyhorse-1.0-video-edit` 需要至少一个 `--video`，并支持最多 5 张 `--image` / `--first-frame` / `--last-frame` 作为 `reference_image`。
5. **错误码**：
   - `401` API Key 无效；
   - `402/403` 余额或权限不足；
   - `429` 并发或频率超限；
   - `5xx` 服务侧异常。
6. **计费**：所有调用按当前 API Key 余额扣费，可在 `/v1/models` 查看每个模型 `pricing.summary`。

## 何时不要用本 Skill

- 文本对话（用 `/v1/chat/completions`，本 skill 未封装）
- 3D 资产生成（同样走 `/v1/contents/generations/tasks`，但本 skill 未实现 3D 子命令）
- 需要长期保存或私有访问的本地媒体上传 → 默认临时托管链接可能过期，请配置自己的 `FOXXIPLAY_UPLOAD_URL` 或先上传到 OSS / S3 / R2 / COS
