# foxxiplay-gen

[中文说明](./README.zh-CN.md)

Agent skill for generating images and videos through the FoxxiPlay API relay.

## What it does

- Generates images with Doubao Seedream models.
- Creates and polls video generation tasks with Doubao Seedance models.
- Supports HappyHorse text-to-video, image-to-video, reference-to-video, and video-edit tasks.
- Uploads local reference media before sending generation requests.
- Provides helper commands for task lookup, task listing, task deletion, and model listing.

## Requirements

- Node.js 18 or later.
- A FoxxiPlay API key.

FoxxiPlay platform: http://47.111.187.160/chat

Set the API key before use:

```bash
export FOXXIPLAY_API_KEY="sk-xxxxxxxx"
```

On Windows PowerShell:

```powershell
$env:FOXXIPLAY_API_KEY = "sk-xxxxxxxx"
```

Optional environment variables:

```text
FOXXIPLAY_BASE_URL
FOXXIPLAY_UPLOAD_URL
```

Legacy `FOXICOIN_*` environment variables are still supported as fallbacks.

## Usage

Generate an image:

```bash
node scripts/main.mjs image \
  --prompt "未来感中式茶室，竹影、浅色石材、漂浮的全息菜单" \
  --size 2048x2048 \
  --output ./tea-room.png
```

### Image size notes for Seedream models

For `doubao-seedream-4.5` and `doubao-seedream-5.0-lite`, `--size` supports two modes, and they cannot be mixed:

- Resolution mode: `doubao-seedream-4.5` supports `2K` and `4K`; `doubao-seedream-5.0-lite` supports `2K`, `3K`, and `4K`. Describe the desired aspect ratio, shape, or use case in the prompt, such as "vertical 9:16 poster" or "square avatar".
- Pixel mode: `<width>x<height>`, default `2048x2048`. The total pixels must be from `3,686,400` to `16,777,216`, and the aspect ratio must be from `1:16` to `16:1`.

Recommended pixel sizes for `doubao-seedream-4.5`:

| Resolution | Ratio | Size |
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

Recommended pixel sizes for `doubao-seedream-5.0-lite`:

| Resolution | Ratio | Size |
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

Generate a video:

```bash
node scripts/main.mjs video \
  --prompt "赛博朋克雨夜城市，少女听到声音后慢慢回头，电影感" \
  --ratio 9:16 \
  --resolution 720p \
  --duration 15 \
  --generate-audio \
  --output ./scene.mp4
```

Show all commands:

```bash
node scripts/main.mjs --help
```

## Installation

### Option 1: One-line install (recommended)

```bash
npx skills add https://github.com/huachneg/foxxiplay-gen --skill foxxiplay-gen
```

### Option 2: Send this prompt to your AI agent

Copy the following prompt into Claude Code, Cursor, Codex, or any AI agent with shell access:

> Help me install the `foxxiplay-gen` agent skill. Please follow these steps:
>
> 1. Make sure `~/.claude/skills/` exists. Create it if needed.
> 2. Run `git clone https://github.com/huachneg/foxxiplay-gen.git ~/.claude/skills/foxxiplay-gen`
> 3. Verify that `~/.claude/skills/foxxiplay-gen/` contains `SKILL.md`, `README.md`, and `scripts/`.
> 4. Tell me the installation is complete. After that, requests such as "generate an image with FoxxiPlay" or "make a Seedance video" should trigger this skill.

For agents that use a different skills directory, replace `~/.claude/skills/` with that agent's configured skill/plugin directory.

### Option 3: Manual command line

```bash
git clone https://github.com/huachneg/foxxiplay-gen.git ~/.claude/skills/foxxiplay-gen
```

Then restart or refresh your agent so it can discover the new skill.

## Security notes

Do not commit `.env` files, generated media, API keys, or local account paths. The included `.gitignore` excludes common secret and output files.
