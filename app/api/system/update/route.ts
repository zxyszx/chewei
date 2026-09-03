import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestFile = process.env.UPDATE_REQUEST_FILE || "";
const statusFile = process.env.UPDATE_STATUS_FILE || "";
const repository = process.env.UPDATE_REPOSITORY || "zxyszx/chewei";
const branch = process.env.UPDATE_BRANCH || "main";

async function readStatus() {
  if (!statusFile) return null;
  try { return JSON.parse(await readFile(statusFile, "utf8")); } catch { return null; }
}

async function latestCommit() {
  const response = await fetch(`https://api.github.com/repos/${repository}/commits/${encodeURIComponent(branch)}`, { cache: "no-store", headers: { Accept: "application/vnd.github+json", "User-Agent": "parking-space-manager" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("无法读取 GitHub 版本");
  const value = await response.json() as { sha: string; commit?: { message?: string; committer?: { date?: string } } };
  return { sha: value.sha, message: value.commit?.message?.split("\n")[0] || "", date: value.commit?.committer?.date || null };
}

export async function GET() {
  await requireAdmin();
  const current = process.env.APP_COMMIT_SHA || "unknown";
  try {
    const latest = await latestCommit();
    return Response.json({ enabled: process.env.WEB_UPDATE_ENABLED === "true" && Boolean(requestFile), current, latest, updateAvailable: current !== "unknown" && current !== latest.sha, status: await readStatus() });
  } catch (error) {
    return Response.json({ enabled: process.env.WEB_UPDATE_ENABLED === "true" && Boolean(requestFile), current, latest: null, updateAvailable: false, status: await readStatus(), error: error instanceof Error ? error.message : "检查失败" });
  }
}

export async function POST(request: Request) {
  await requireAdmin();
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
  if (origin && (!host || new URL(origin).host !== host)) return Response.json({ error: "请求来源无效" }, { status: 403 });
  if (process.env.WEB_UPDATE_ENABLED !== "true" || !requestFile) return Response.json({ error: "当前环境未启用网页更新服务" }, { status: 409 });
  await mkdir(path.dirname(requestFile), { recursive: true });
  const temporary = `${requestFile}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify({ requestedAt: new Date().toISOString() }), { mode: 0o600 });
  await rename(temporary, requestFile);
  return Response.json({ ok: true });
}
