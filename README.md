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

### Image generation

```bash
node scripts/main.mjs image \
  --prompt "futuristic Chinese tea room, bamboo shadows, pale stone, floating holographic menu" \
  --size 2048x2048 \
  --output ./tea-room.png
```

Common options:

- `--model`: defaults to `doubao-seedream-5.0`; alternatives include `doubao-seedream-4.5` and `doubao-seedream-5.0-lite`.
- `--size`: output size, defaults to `2048x2048`.
- `--reference`: reference image URL or local path; repeatable. Local paths are uploaded automatically.
- `--count`: number of images, usually 1 to 4.

Seedream size rules at a glance:

| Format | Models | Notes |
|---|---|---|
| `2K` | `doubao-seedream-4.5`, `doubao-seedream-5.0-lite` | Describe the desired ratio or use case in the prompt, such as "vertical 9:16 poster" or "square avatar". |
| `3K` | `doubao-seedream-5.0-lite` | Same behavior; the model decides the final pixel size from the prompt. |
| `4K` | `doubao-seedream-4.5`, `doubao-seedream-5.0-lite` | Same behavior. |
| `<width>x<height>` | `doubao-seedream-4.5`, `doubao-seedream-5.0-lite` | Total pixels must be `3,686,400` to `16,777,216`; aspect ratio must be `1:16` to `16:1`. |

Useful pixel sizes: `2048x2048`, `2304x1728`, `1728x2304`, `2848x1600`, `1600x2848`, `2496x1664`, `1664x2496`, and `3136x1344`. For `doubao-seedream-5.0-lite`, 3K options such as `3072x3072`, `4096x2304`, and `2304x4096` are also available.

### Video generation

Video generation is asynchronous: the script creates a task, polls it by default, prints the final video URL, and downloads the result when `--output` is provided.

Doubao Seedance text-to-video:

```bash
node scripts/main.mjs video \
  --model doubao-seedance-2.0 \
  --prompt "cyberpunk rainy city at night, a girl slowly turns back after hearing a sound, cinematic" \
  --ratio 9:16 \
  --resolution 720p \
  --duration 15 \
  --generate-audio \
  --output ./scene.mp4
```

First-frame / last-frame image-to-video:

```bash
node scripts/main.mjs video \
  --model doubao-seedance-2.0 \
  --prompt "the character turns quickly, fog covers the lens, then clears to reveal the ending outfit" \
  --first-frame ./start.png \
  --last-frame ./end.png \
  --resolution 720p \
  --duration 5 \
  --output ./start-to-end.mp4
```

Video input editing, such as replacing a background while keeping motion:

```bash
node scripts/main.mjs video \
  --model doubao-seedance-2.0 \
  --prompt "keep the person, motion, and camera movement; replace the background with a warm ancient-style interior" \
  --video ./input.mp4 \
  --ratio 9:16 \
  --resolution 1080p \
  --duration 15 \
  --output ./edited.mp4
```

HappyHorse modes:

| Model | Best for | Key inputs |
|---|---|---|
| `happyhorse-1.0-t2v` | Text-to-video | `--prompt`, `--ratio`, `--duration` |
| `happyhorse-1.0-i2v` | Animating a first-frame image | `--prompt`, `--image` or `--first-frame` |
| `happyhorse-1.0-r2v` | Keeping character, product, or scene consistency from references | `--prompt`, `--image`, `--ratio` |
| `happyhorse-1.0-video-edit` | Natural-language video editing with optional image references | `--prompt`, `--video`, optional repeated `--image` |

HappyHorse reference-to-video example:

```bash
node scripts/main.mjs video \
  --model happyhorse-1.0-r2v \
  --prompt "create a stable product showcase video from the reference image, soft lighting, clean frame" \
  --image ./reference.png \
  --ratio 16:9 \
  --resolution 720p \
  --duration 5 \
  --output ./r2v.mp4
```

Common video options:

- `--ratio`: `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9`, etc.
- `--resolution`: `480p`, `720p`, or `1080p`.
- `--duration`: usually `5`, `10`, or `15` seconds.
- `--no-wait`: create the task without waiting for the result.
- `--poll-interval` / `--timeout`: control polling interval and total wait time.

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
