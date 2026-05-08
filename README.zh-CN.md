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

## 作为 Agent Skill 安装

将仓库克隆到你的 agent 使用的 skills 目录：

```bash
git clone https://github.com/huachneg/foxxiplay-gen.git <your-agent-skills-dir>/foxxiplay-gen
```

示例：

```bash
# Codex
git clone https://github.com/huachneg/foxxiplay-gen.git ~/.codex/skills/foxxiplay-gen

# Claude Code 或其他 agent
# 使用该 agent 配置的 skill / plugin 目录。
```

然后重启或刷新你的 agent，让它发现新的 skill。

## 安全提示

不要提交 `.env` 文件、生成素材、API Key 或本地账号路径。本仓库的 `.gitignore` 已排除常见密钥和输出文件。
