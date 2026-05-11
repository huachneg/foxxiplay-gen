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

生成图片：

```bash
node scripts/main.mjs image \
  --prompt "未来感中式茶室，竹影、浅色石材、漂浮的全息菜单" \
  --size 2048x2048 \
  --output ./tea-room.png
```

### Seedream 图片尺寸说明

使用 `doubao-seedream-4.5` 或 `doubao-seedream-5.0-lite` 时，`--size` 支持两种写法，且不可混用：

- 分辨率模式：`doubao-seedream-4.5` 支持 `2K` / `4K`；`doubao-seedream-5.0-lite` 支持 `2K` / `3K` / `4K`。同时在 prompt 中说明宽高比、图片形状或用途，例如“竖版 9:16 海报”“方形头像”。
- 像素模式：`<宽>x<高>`，默认 `2048x2048`。总像素必须在 `3,686,400` 到 `16,777,216` 之间，宽高比必须在 `1:16` 到 `16:1` 之间。

`doubao-seedream-4.5` 推荐像素值：

| 分辨率 | 宽高比 | 尺寸 |
|---|---|---|
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

| 分辨率 | 宽高比 | 尺寸 |
|---|---|---|
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

生成视频：

```bash
node scripts/main.mjs video \
  --prompt "赛博朋克雨夜城市，少女听到声音后慢慢回头，电影感" \
  --ratio 9:16 \
  --resolution 720p \
  --duration 15 \
  --generate-audio \
  --output ./scene.mp4
```

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
