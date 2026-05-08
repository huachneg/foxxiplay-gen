#!/usr/bin/env node
// FoxxiPlay AI 图片 / 视频生成 CLI
// Usage: node main.mjs <command> [options]
//   image | video | task <id> | tasks | task-delete <id> | models

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import process from "node:process";

const DEFAULT_BASE_URL = "http://47.111.187.160";

const ENDPOINTS = {
  images: "/v1/images/generations",
  tasks: "/v1/contents/generations/tasks",
  task: (id) => `/v1/contents/generations/tasks/${encodeURIComponent(id)}`,
  models: "/v1/models",
};

const DEFAULTS = {
  imageModel: "doubao-seedream-5.0",
  imageSize: "2048x2048",
  videoModel: "doubao-seedance-2.0",
  videoRatio: "16:9",
  videoResolution: "720p",
  videoDuration: 5,
  pollIntervalSec: 5,
  timeoutSec: 600,
};

const API_KEY_ERROR = "FOXXIPLAY_API_KEY not set (legacy FOXICOIN_API_KEY also supported)";

const HELP = `FoxxiPlay gen — image & video generation CLI

Commands:
  image                    Generate image (sync)
  video                    Create video task (async, auto-poll by default)
  task <task_id>           Get task detail
  tasks                    List tasks
  task-delete <task_id>    Delete task
  models                   List models

Image options:
  -p, --prompt <text>            Required
  -m, --model <id>               Default doubao-seedream-5.0 (alt: doubao-seedream-4.5)
  -s, --size <WxH>               Default 2048x2048 (e.g. 1024x1024, 1792x2304)
      --negative-prompt <text>   Negative prompt
  -n, --count <1-4>              Number of images, default 1
      --seed <int>               Random seed
      --guidance-scale <float>   Guidance scale
      --watermark <bool>         true|false
      --response-format <fmt>    url (default) | b64_json
      --reference <url/path>     Reference image URL/path, can repeat
  -o, --output <path>            Download saved file (only for url format, count=1 saves directly,
                                 count>1 appends index)
      --json                     Print raw JSON response

Video options:
  -p, --prompt <text>            Required
  -m, --model <id>               Default doubao-seedance-2.0.
                                 HappyHorse alts: happyhorse-1.0-t2v (text→video),
                                 happyhorse-1.0-i2v (first-frame→video, requires --image,
                                 ratio derived from image — --ratio is dropped unless explicit),
                                 happyhorse-1.0-r2v (reference→video, requires --image),
                                 happyhorse-1.0-video-edit (video edit, requires --video,
                                 accepts up to 5 reference images)
  -r, --ratio <r>                Default 16:9 (9:16, 1:1, 4:3, 3:4, 21:9, ...)
      --resolution <res>         480p | 720p (default) | 1080p
  -d, --duration <sec>           5 | 10 | 15, default 5
      --generate-audio           Request generated audio (Seedance only; ignored for HappyHorse,
                                 which may return audio by default)
      --seed <int>               Random seed
      --watermark <bool>         true|false
      --image <url/path>         Reference image URL/path, can repeat (first/last frame).
                                 Required for happyhorse-1.0-i2v / -r2v
      --first-frame <url/path>   First frame image URL/path. Placed before --image references.
      --last-frame <url/path>    Last frame image URL/path. Placed after --image references.
      --video <url/path>         Input/reference video URL/path, can repeat. Use for video-to-video
                                 edits such as background replacement.
      --audio <url/path>         Reference audio URL/path, can repeat. Use for speech/lip-sync
                                 guidance (Seedance only).
  -o, --output <path>            Download finished video to this path
      --no-wait                  Don't poll, return task_id immediately
      --poll-interval <sec>      Default 5
      --timeout <sec>            Default 600
      --json                     Print raw JSON response

Common options:
  --base-url <url>               Override FOXXIPLAY_BASE_URL
  --upload-url <url>             Override FOXXIPLAY_UPLOAD_URL for local media uploads
  --api-key <key>                Override FOXXIPLAY_API_KEY
  -h, --help                     Show this help

Environment:
  FOXXIPLAY_API_KEY     (required; legacy FOXICOIN_API_KEY is also supported)
  FOXXIPLAY_BASE_URL    default ${DEFAULT_BASE_URL}
  FOXXIPLAY_UPLOAD_URL  optional local media upload endpoint, default https://uguu.se/upload.php
`;

// ---------- argv parsing ----------

function parseArgs(argv) {
  const out = { command: null, positional: [], opts: {}, flags: new Set(), repeats: {} };
  const repeatable = new Set(["reference", "image", "first-frame", "last-frame", "video", "audio"]);
  const flags = new Set(["help", "h", "json", "no-wait", "generate-audio"]);
  const aliases = {
    p: "prompt", m: "model", s: "size", n: "count", r: "ratio",
    d: "duration", o: "output", h: "help",
  };

  let i = 0;
  if (argv[i] && !argv[i].startsWith("-")) {
    out.command = argv[i++];
  }

  while (i < argv.length) {
    const tok = argv[i];
    if (tok === "--") { out.positional.push(...argv.slice(i + 1)); break; }
    if (tok.startsWith("--")) {
      const key = tok.slice(2);
      if (flags.has(key)) { out.flags.add(key); i++; continue; }
      const val = argv[i + 1];
      if (val === undefined || val.startsWith("--")) {
        // allow --flag style for booleans without value
        out.flags.add(key); i++; continue;
      }
      if (repeatable.has(key)) {
        (out.repeats[key] ||= []).push(val);
      } else {
        out.opts[key] = val;
      }
      i += 2;
    } else if (tok.startsWith("-") && tok.length === 2) {
      const k = aliases[tok.slice(1)] || tok.slice(1);
      if (flags.has(k)) { out.flags.add(k); i++; continue; }
      out.opts[k] = argv[i + 1];
      i += 2;
    } else {
      out.positional.push(tok);
      i++;
    }
  }
  return out;
}

function getEnv(name, fallback) {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

function getEnvAny(names, fallback) {
  for (const name of names) {
    const value = getEnv(name);
    if (value !== undefined) return value;
  }
  return fallback;
}

function getApiKey(opts) {
  return opts["api-key"] || getEnvAny(["FOXXIPLAY_API_KEY", "FOXICOIN_API_KEY"]);
}

function getBaseUrl(opts) {
  return (opts["base-url"] || getEnvAny(["FOXXIPLAY_BASE_URL", "FOXICOIN_BASE_URL"], DEFAULT_BASE_URL)).replace(/\/+$/, "");
}

function parseBool(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (["1", "true", "yes", "y"].includes(s)) return true;
  if (["0", "false", "no", "n"].includes(s)) return false;
  return undefined;
}

function die(msg, code = 1) {
  console.error(`Error: ${msg}`);
  process.exit(code);
}

// ---------- HTTP ----------

async function request(method, url, { apiKey, body, expectJson = true } = {}) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };
  let bodyInit;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    bodyInit = JSON.stringify(body);
  }
  const resp = await fetch(url, { method, headers, body: bodyInit });
  const text = await resp.text();
  if (!resp.ok) {
    let detail = text;
    try { detail = JSON.stringify(JSON.parse(text), null, 2); } catch {}
    throw new Error(`HTTP ${resp.status} ${resp.statusText} on ${method} ${url}\n${detail}`);
  }
  if (!expectJson) return text;
  if (!text) return null;
  try { return JSON.parse(text); }
  catch { return text; }
}

async function downloadTo(url, outPath) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download failed ${resp.status} ${resp.statusText}: ${url}`);
  await mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
  const file = createWriteStream(outPath);
  await pipeline(Readable.fromWeb(resp.body), file);
  return outPath;
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

async function uploadLocalFile(filePath, { uploadUrl } = {}) {
  const resolved = path.resolve(filePath);
  const data = await readFile(resolved);
  const form = new FormData();
  form.append("files[]", new Blob([data]), path.basename(resolved));
  const target = uploadUrl || getEnvAny(["FOXXIPLAY_UPLOAD_URL", "FOXICOIN_UPLOAD_URL"], "https://uguu.se/upload.php");
  const resp = await fetch(target, { method: "POST", body: form });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Upload failed ${resp.status} ${resp.statusText}: ${text}`);
  let json;
  try { json = JSON.parse(text); } catch {
    const url = text.trim();
    if (isHttpUrl(url)) return url;
    throw new Error(`Upload response did not contain JSON or URL: ${text}`);
  }
  const url = json?.files?.[0]?.url || json?.data?.files?.[0]?.url || json?.url || json?.data?.url;
  if (!url) throw new Error(`Upload response did not contain a file URL: ${JSON.stringify(json)}`);
  return String(url).replace(/\\\//g, "/");
}

async function resolveMediaUrls(values = [], opts = {}) {
  const urls = [];
  for (const value of values) {
    if (isHttpUrl(value)) {
      urls.push(value);
      continue;
    }
    const url = await uploadLocalFile(value, { uploadUrl: opts["upload-url"] });
    console.log(`  uploaded ${value} → ${url}`);
    urls.push(url);
  }
  return urls;
}

// ---------- commands ----------

async function cmdImage({ opts, flags, repeats }) {
  const apiKey = getApiKey(opts);
  if (!apiKey) die(API_KEY_ERROR);
  const prompt = opts.prompt;
  if (!prompt) die("--prompt is required");

  const body = {
    model: opts.model || DEFAULTS.imageModel,
    prompt,
    size: opts.size || DEFAULTS.imageSize,
    response_format: opts["response-format"] || "url",
  };
  if (opts["negative-prompt"]) body.negative_prompt = opts["negative-prompt"];
  if (opts.count) body.count = Number(opts.count);
  if (opts.seed !== undefined) body.seed = Number(opts.seed);
  if (opts["guidance-scale"] !== undefined) body.guidance_scale = Number(opts["guidance-scale"]);
  const wm = parseBool(opts.watermark);
  if (wm !== undefined) body.watermark = wm;
  const refs = await resolveMediaUrls(repeats.reference || [], opts);
  if (refs.length) body.images = refs;

  const baseUrl = getBaseUrl(opts);
  const data = await request("POST", baseUrl + ENDPOINTS.images, { apiKey, body });

  if (flags.has("json")) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const items = data?.data || [];
  console.log(`✓ Generated ${items.length} image(s)`);
  const out = opts.output;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const url = it.url || it.image_url;
    const b64 = it.b64_json;
    if (url) console.log(`  [${i}] ${url}`);
    if (out) {
      const target = items.length === 1
        ? out
        : path.join(path.dirname(out), `${path.basename(out, path.extname(out))}_${i}${path.extname(out) || ".png"}`);
      if (url) {
        await downloadTo(url, target);
        console.log(`  saved → ${target}`);
      } else if (b64) {
        await mkdir(path.dirname(path.resolve(target)), { recursive: true });
        await writeFile(target, Buffer.from(b64, "base64"));
        console.log(`  saved → ${target}`);
      }
    }
  }
  if (data?._relay_billing) {
    console.log(`  billing: ${JSON.stringify(data._relay_billing)}`);
  }
}

function buildVideoContent(prompt, imageUrls = [], videoUrls = [], audioUrls = []) {
  const content = [{ type: "text", text: prompt }];
  for (const url of imageUrls) {
    content.push({ type: "image_url", image_url: { url } });
  }
  for (const url of videoUrls) {
    content.push({ type: "video_url", video_url: { url } });
  }
  for (const url of audioUrls) {
    content.push({ type: "audio_url", audio_url: { url } });
  }
  return content;
}

function isHappyHorseModel(model) {
  return String(model || "").startsWith("happyhorse-1.0-");
}

function normalizeHappyHorseResolution(resolution) {
  return String(resolution || DEFAULTS.videoResolution).toUpperCase();
}

function buildHappyHorseBody({ model, prompt, opts, imageUrls, videoUrls }) {
  const parameters = {
    resolution: normalizeHappyHorseResolution(opts.resolution),
    duration: Number(opts.duration || DEFAULTS.videoDuration),
  };
  if (model !== "happyhorse-1.0-i2v") {
    parameters.ratio = opts.ratio || DEFAULTS.videoRatio;
  } else if (opts.ratio) {
    parameters.ratio = opts.ratio;
  }

  const media = [];
  if (model === "happyhorse-1.0-i2v") {
    if (imageUrls.length === 0) die(`${model} requires at least one --image or --first-frame <url/path>`);
    media.push({ type: "first_frame", url: imageUrls[0] });
  } else if (model === "happyhorse-1.0-r2v") {
    if (imageUrls.length === 0) die(`${model} requires at least one --image <url/path>`);
    for (const url of imageUrls) media.push({ type: "reference_image", url });
  } else if (model === "happyhorse-1.0-video-edit") {
    if (videoUrls.length === 0) die(`${model} requires at least one --video <url/path>`);
    if (imageUrls.length > 5) die(`${model} supports at most 5 reference images`);
    for (const url of videoUrls) media.push({ type: "video", url });
    for (const url of imageUrls) media.push({ type: "reference_image", url });
  }

  const input = { prompt };
  if (media.length) input.media = media;
  return { model, input, parameters };
}

async function cmdVideo({ opts, flags, repeats }) {
  const apiKey = getApiKey(opts);
  if (!apiKey) die(API_KEY_ERROR);
  const prompt = opts.prompt;
  if (!prompt) die("--prompt is required");

  const model = opts.model || DEFAULTS.videoModel;
  const firstFrames = await resolveMediaUrls(repeats["first-frame"] || [], opts);
  const referenceImages = await resolveMediaUrls(repeats.image || [], opts);
  const lastFrames = await resolveMediaUrls(repeats["last-frame"] || [], opts);
  const images = [...firstFrames, ...referenceImages, ...lastFrames];
  const videos = await resolveMediaUrls(repeats.video || [], opts);
  const audios = await resolveMediaUrls(repeats.audio || [], opts);

  if (isHappyHorseModel(model) && audios.length > 0) {
    die(`${model} does not support --audio reference input`);
  }

  let body;
  if (isHappyHorseModel(model)) {
    body = buildHappyHorseBody({ model, prompt, opts, imageUrls: images, videoUrls: videos });
  } else {
    body = {
      model,
      content: buildVideoContent(prompt, images, videos, audios),
      resolution: opts.resolution || DEFAULTS.videoResolution,
      duration: Number(opts.duration || DEFAULTS.videoDuration),
    };
    // First-frame jobs derive aspect ratio from the first frame; only send ratio if explicit.
    if (firstFrames.length > 0) {
      if (opts.ratio) body.ratio = opts.ratio;
    } else {
      body.ratio = opts.ratio || DEFAULTS.videoRatio;
    }
    if (flags.has("generate-audio")) body.generate_audio = true;
    if (opts.seed !== undefined) body.seed = Number(opts.seed);
    const wm = parseBool(opts.watermark);
    if (wm !== undefined) body.watermark = wm;
  }

  const baseUrl = getBaseUrl(opts);
  const created = await request("POST", baseUrl + ENDPOINTS.tasks, { apiKey, body });

  if (flags.has("json") && flags.has("no-wait")) {
    console.log(JSON.stringify(created, null, 2));
    return;
  }
  const taskId = created?.id || created?.task_id || created?.data?.id;
  if (!taskId) {
    console.log(JSON.stringify(created, null, 2));
    die("Task created but no task_id in response");
  }
  console.log(`✓ task created: ${taskId}`);

  if (flags.has("no-wait")) {
    if (flags.has("json")) console.log(JSON.stringify(created, null, 2));
    return;
  }

  const intervalMs = Number(opts["poll-interval"] || DEFAULTS.pollIntervalSec) * 1000;
  const timeoutMs = Number(opts.timeout || DEFAULTS.timeoutSec) * 1000;
  const start = Date.now();
  let last;

  while (true) {
    if (Date.now() - start > timeoutMs) {
      die(`timeout after ${timeoutMs / 1000}s waiting for task ${taskId}`);
    }
    last = await request("GET", baseUrl + ENDPOINTS.task(taskId), { apiKey });
    const status = normalizeTaskStatus(last);
    process.stdout.write(`  status: ${status || "unknown"}\r`);
    if (status === "succeeded" || status === "failed" || status === "canceled") {
      process.stdout.write("\n");
      break;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  if (flags.has("json")) {
    console.log(JSON.stringify(last, null, 2));
  }

  const status = normalizeTaskStatus(last);
  if (status !== "succeeded") {
    die(`task ${status}: ${JSON.stringify(last?.error || last)}`);
  }

  const videoUrl = extractVideoUrl(last);
  if (videoUrl) {
    console.log(`✓ video URL: ${videoUrl}`);
    if (opts.output) {
      await downloadTo(videoUrl, opts.output);
      console.log(`  saved → ${opts.output}`);
    }
  } else {
    console.log("⚠ task succeeded but no video URL found in result; raw response:");
    console.log(JSON.stringify(last, null, 2));
  }
  if (last?._relay_billing) console.log(`  billing: ${JSON.stringify(last._relay_billing)}`);
}

function normalizeTaskStatus(task) {
  const status = task?.status || task?.data?.status || task?.output?.task_status;
  return typeof status === "string" ? status.toLowerCase() : status;
}

function extractVideoUrl(task) {
  const candidates = [
    task?.output?.video_url,
    task?.output?.url,
    task?.result?.video_url,
    task?.result?.url,
    task?.assets?.video_url,
    task?.assets?.[0]?.url,
    task?.data?.result?.video_url,
    task?.data?.video_url,
    task?.content?.video_url,
    task?.content?.url,
  ];
  for (const c of candidates) if (typeof c === "string" && c) return c;
  // search recursively for first .mp4 url
  const seen = new Set();
  function walk(v) {
    if (!v || typeof v !== "object" || seen.has(v)) return null;
    seen.add(v);
    for (const k of Object.keys(v)) {
      const x = v[k];
      if (typeof x === "string" && /^https?:\/\/.+\.(mp4|mov|webm)(\?|$)/i.test(x)) return x;
      const sub = walk(x);
      if (sub) return sub;
    }
    return null;
  }
  return walk(task);
}

async function cmdTask({ opts, positional, flags }) {
  const apiKey = getApiKey(opts);
  if (!apiKey) die(API_KEY_ERROR);
  const taskId = positional[0];
  if (!taskId) die("task_id is required: foxxiplay-gen task <task_id>");
  const baseUrl = getBaseUrl(opts);
  const data = await request("GET", baseUrl + ENDPOINTS.task(taskId), { apiKey });
  console.log(JSON.stringify(data, null, 2));
}

async function cmdTasks({ opts }) {
  const apiKey = getApiKey(opts);
  if (!apiKey) die(API_KEY_ERROR);
  const baseUrl = getBaseUrl(opts);
  const url = new URL(baseUrl + ENDPOINTS.tasks);
  if (opts.limit) url.searchParams.set("limit", opts.limit);
  const data = await request("GET", url.toString(), { apiKey });
  console.log(JSON.stringify(data, null, 2));
}

async function cmdTaskDelete({ opts, positional }) {
  const apiKey = getApiKey(opts);
  if (!apiKey) die(API_KEY_ERROR);
  const taskId = positional[0];
  if (!taskId) die("task_id is required: foxxiplay-gen task-delete <task_id>");
  const baseUrl = getBaseUrl(opts);
  const data = await request("DELETE", baseUrl + ENDPOINTS.task(taskId), { apiKey });
  console.log(JSON.stringify(data ?? { ok: true }, null, 2));
}

async function cmdModels({ opts }) {
  const apiKey = getApiKey(opts);
  if (!apiKey) die(API_KEY_ERROR);
  const baseUrl = getBaseUrl(opts);
  const url = new URL(baseUrl + ENDPOINTS.models);
  if (opts.type) url.searchParams.set("type", opts.type);
  const data = await request("GET", url.toString(), { apiKey });
  console.log(JSON.stringify(data, null, 2));
}

// ---------- main ----------

async function loadEnvFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

async function loadEnv() {
  const home = homedir();
  const cwd = process.cwd();
  const dedicated = await loadEnvFile(path.join(home, ".zhc-skills", "foxxiplay-gen.env"));
  const legacyDedicated = await loadEnvFile(path.join(home, ".zhc-skills", "foxicoin-gen.env"));
  const shared = await loadEnvFile(path.join(home, ".zhc-skills", ".env"));
  const project = await loadEnvFile(path.join(cwd, ".env"));
  for (const source of [dedicated, legacyDedicated, shared, project]) {
    for (const [key, value] of Object.entries(source)) {
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function main() {
  await loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const wantsHelp = args.flags.has("help") || args.flags.has("h");
  if (wantsHelp || !args.command) {
    console.log(HELP);
    process.exit(wantsHelp ? 0 : 1);
  }
  const ctx = { opts: args.opts, flags: args.flags, repeats: args.repeats, positional: args.positional };
  switch (args.command) {
    case "image": return cmdImage(ctx);
    case "video": return cmdVideo(ctx);
    case "task": return cmdTask(ctx);
    case "tasks": return cmdTasks(ctx);
    case "task-delete": return cmdTaskDelete(ctx);
    case "models": return cmdModels(ctx);
    default: die(`unknown command: ${args.command}\n\n${HELP}`);
  }
}

main().catch((err) => {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
});
