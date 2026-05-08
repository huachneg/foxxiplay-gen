# foxxiplay-gen

Codex skill for generating images and videos through the FoxxiPlay API relay.

## What it does

- Generates images with Doubao Seedream models.
- Creates and polls video generation tasks with Doubao Seedance models.
- Supports HappyHorse text-to-video, image-to-video, reference-to-video, and video-edit tasks.
- Uploads local reference media before sending generation requests.
- Provides helper commands for task lookup, task listing, task deletion, and model listing.

## Requirements

- Node.js 18 or later.
- A FoxxiPlay API key.

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

## Install as a Codex skill

Clone this repository into your Codex skills directory:

```bash
git clone https://github.com/huachneg/foxxiplay-gen.git ~/.codex/skills/foxxiplay-gen
```

Then restart Codex or refresh the skill list.

## Security notes

Do not commit `.env` files, generated media, API keys, or local account paths. The included `.gitignore` excludes common secret and output files.
