# foxxiplay-gen

[English README](./README.md)

通过 FoxxiPlay API 中转服务生成图片和视频的 Agent skill。

## 功能

- 使用 Doubao Seedream 模型生成图片。
- 使用 Doubao Seedance 模型创建并轮询视频生成任务。
- 支持 HappyHorse 文生视频、图生视频、参考图生视频和视频编辑任务。
- 支持在发送生成请求前自动上传本地参考素材。
- 提供任务查询、任务列表、任务删除、模型列表等辅助命令。

## 使用要求

- Node.js 18 或更高版本。
- FoxxiPlay API Key。

FoxxiPlay 平台：http://47.111.187.160/chat

使用前设置 API Key：

```bash
export FOXXIPLAY_API_KEY="sk-xxxxxxxx"
```

Windows PowerShell：

```powershell
$env:FOXXIPLAY_API_KEY = "sk-xxxxxxxx"
```

可选环境变量：

```text
FOXXIPLAY_BASE_URL
FOXXIPLAY_UPLOAD_URL
```

脚本也兼容旧版 `FOXICOIN_*` 环境变量作为 fallback。

## 使用方式

### 图片生成

```bash
node scripts/main.mjs image \
  --prompt "未来感中式茶室，竹影、浅色石材、漂浮的全息菜单" \
  --size 2048x2048 \
  --output ./tea-room.png
```

常用参数：

- `--model`：默认 `doubao-seedream-5.0`，也可使用 `doubao-seedream-4.5`。
- `--size`：输出尺寸，默认 `2048x2048`。
- `--reference`：参考图 URL 或本地路径，可重复传入；本地路径会自动上传。
- `--count`：生成数量，通常为 1 到 4。

Seedream 尺寸规则简表：

| 写法 | 适用模型 | 说明 |
|---|---|---|
| `2K` | `doubao-seedream-4.5`、`doubao-seedream-5.0` | 在 prompt 中说明比例或用途，例如“竖版 9:16 海报”“方形头像”。 |
| `3K` | `doubao-seedream-5.0` | 同上，由模型根据语义决定最终像素。 |
| `4K` | `doubao-seedream-4.5`、`doubao-seedream-5.0` | 同上。 |
| `<宽>x<高>` | `doubao-seedream-4.5`、`doubao-seedream-5.0` | 总像素需在 `3,686,400` 到 `16,777,216` 之间，宽高比需在 `1:16` 到 `16:1` 之间。 |

推荐像素值可以直接使用：`2048x2048`、`2304x1728`、`1728x2304`、`2848x1600`、`1600x2848`、`2496x1664`、`1664x2496`、`3136x1344`。`doubao-seedream-5.0` 还可使用 3K 档，例如 `3072x3072`、`4096x2304`、`2304x4096`。

### 视频生成

视频生成是异步任务：脚本会先创建任务，然后默认自动轮询，任务成功后输出视频 URL；如果传入 `--output`，会下载到本地文件。

Doubao Seedance 文生视频：

```bash
node scripts/main.mjs video \
  --model doubao-seedance-2.0 \
  --prompt "赛博朋克雨夜城市，少女听到声音后慢慢回头，电影感" \
  --ratio 9:16 \
  --resolution 720p \
  --duration 15 \
  --generate-audio \
  --output ./scene.mp4
```

首帧/尾帧图生视频：

```bash
node scripts/main.mjs video \
  --model doubao-seedance-2.0 \
  --prompt "人物快速转身，雾气遮住镜头，雾散后换成尾帧服装" \
  --first-frame ./start.png \
  --last-frame ./end.png \
  --resolution 720p \
  --duration 5 \
  --output ./start-to-end.mp4
```

视频输入编辑，例如换背景或保留动作改场景：

```bash
node scripts/main.mjs video \
  --model doubao-seedance-2.0 \
  --prompt "保留输入视频中的人物、动作和镜头，将背景替换为温暖古风室内场景" \
  --video ./input.mp4 \
  --ratio 9:16 \
  --resolution 1080p \
  --duration 15 \
  --output ./edited.mp4
```

HappyHorse 常用模式：

| 模型 | 适合场景 | 关键输入 |
|---|---|---|
| `happyhorse-1.0-t2v` | 文本直接生成视频 | `--prompt`、`--ratio`、`--duration` |
| `happyhorse-1.0-i2v` | 让首帧图自然动起来 | `--prompt`、`--image` 或 `--first-frame` |
| `happyhorse-1.0-r2v` | 根据参考图保持角色、产品或场景一致性 | `--prompt`、`--image`、`--ratio` |
| `happyhorse-1.0-video-edit` | 用自然语言编辑视频，可参考图片 | `--prompt`、`--video`，可加多个 `--image` |

HappyHorse 参考图生视频示例：

```bash
node scripts/main.mjs video \
  --model happyhorse-1.0-r2v \
  --prompt "根据参考图生成一段镜头稳定的产品展示视频，柔和灯光，画面干净" \
  --image ./reference.png \
  --ratio 16:9 \
  --resolution 720p \
  --duration 5 \
  --output ./r2v.mp4
```

常用视频参数：

- `--ratio`：`16:9`、`9:16`、`1:1`、`4:3`、`3:4`、`21:9` 等。
- `--resolution`：`480p`、`720p`、`1080p`。
- `--duration`：通常为 `5`、`10`、`15` 秒。
- `--no-wait`：只创建任务，不等待结果。
- `--poll-interval` / `--timeout`：控制轮询间隔和总等待时间。

查看全部命令：

```bash
node scripts/main.mjs --help
```

## 安装

### 方式一：一行命令安装（推荐）

```bash
npx skills add https://github.com/huachneg/foxxiplay-gen --skill foxxiplay-gen
```

### 方式二：把下面这段话直接发给 AI

把下面这段话复制粘贴给 Claude Code / Cursor / Codex / 任何有 shell 权限的 AI Agent，它会自动完成安装：

> 帮我安装 `foxxiplay-gen` 这个 Agent skill。请按下面步骤做：
>
> 1. 确保 `~/.claude/skills/` 目录存在，不存在就创建。
> 2. 执行 `git clone https://github.com/huachneg/foxxiplay-gen.git ~/.claude/skills/foxxiplay-gen`
> 3. 验证：`ls ~/.claude/skills/foxxiplay-gen/` 应该看到 `SKILL.md`、`README.md`、`scripts/`。
> 4. 告诉我安装好了。之后我说“用 FoxxiPlay 生成一张图”或“做一个 Seedance 视频”之类的话，就会触发这个 skill。

如果你的 agent 使用的不是 `~/.claude/skills/`，把它替换成该 agent 配置的 skill / plugin 目录即可。

### 方式三：手动命令行

```bash
git clone https://github.com/huachneg/foxxiplay-gen.git ~/.claude/skills/foxxiplay-gen
```

然后重启或刷新你的 agent，让它发现新的 skill。

## 安全提示

不要提交 `.env` 文件、生成素材、API Key 或本地账号路径。本仓库的 `.gitignore` 已排除常见密钥和输出文件。
