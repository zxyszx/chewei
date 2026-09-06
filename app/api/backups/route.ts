import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { backupDirectory, backupFilename, createBackupBody, validBackupFilename } from "@/lib/backup-data";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  if (!host || new URL(origin).host !== host) throw new Error("请求来源无效");
}

async function backupPath(name: string) {
  if (!validBackupFilename(name)) throw new Error("备份文件名无效");
  await mkdir(backupDirectory, { recursive: true });
  return path.join(backupDirectory, name);
}

async function listBackups() {
  await mkdir(backupDirectory, { recursive: true });
  const names = (await readdir(backupDirectory)).filter(validBackupFilename);
  const items = await Promise.all(names.map(async (name) => {
    const info = await stat(path.join(backupDirectory, name));
    return { name, size: info.size, createdAt: info.mtime.toISOString() };
  }));
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
}

export async function GET(request: Request) {
  await requireAdmin();
  const name = new URL(request.url).searchParams.get("name");
  if (!name) return Response.json({ backups: await listBackups() });
  try {
    const body = await readFile(await backupPath(name));
    return new Response(body, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="${name}"`, "cache-control": "private, no-store" } });
  } catch {
    return Response.json({ error: "备份文件不存在" }, { status: 404 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const name = backupFilename();
    const body = await createBackupBody();
    await writeFile(await backupPath(name), body, { encoding: "utf8", flag: "wx", mode: 0o600 });
    const info = await stat(path.join(backupDirectory, name));
    return Response.json({ ok: true, backup: { name, size: info.size, createdAt: info.mtime.toISOString() } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "创建备份失败" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const name = new URL(request.url).searchParams.get("name");
    if (!name) throw new Error("请选择备份文件");
    await unlink(await backupPath(name));
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error && error.message === "请求来源无效" ? error.message : "删除失败，备份文件可能已不存在";
    return Response.json({ error: message }, { status: 400 });
  }
}
