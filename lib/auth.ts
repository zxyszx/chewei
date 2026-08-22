import { compare } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/crypto";

const COOKIE_NAME = "parking_session";
const SESSION_DAYS = 7;
const SESSION_CACHE_MS = 30_000;

type CachedSessionUser = {
  expiresAt: number;
  user: Awaited<ReturnType<typeof loadSessionUser>>;
};

const globalForAuth = globalThis as unknown as {
  parkingSessionCache?: Map<string, CachedSessionUser>;
};
const sessionCache = globalForAuth.parkingSessionCache ?? new Map<string, CachedSessionUser>();

if (process.env.NODE_ENV !== "production") globalForAuth.parkingSessionCache = sessionCache;

async function loadSessionUser(tokenHash: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE") return null;
  return session.user;
}

async function shouldUseSecureCookie() {
  const configured = process.env.SESSION_COOKIE_SECURE;
  if (configured === "true") return true;
  if (configured === "false") return false;

  const requestHeaders = await headers();
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProtocol) return forwardedProtocol === "https";

  const origin = requestHeaders.get("origin");
  if (origin) return origin.startsWith("https://");
  return process.env.NODE_ENV === "production";
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const cached = sessionCache.get(tokenHash);
  if (cached && cached.expiresAt > Date.now()) return cached.user;

  const user = await loadSessionUser(tokenHash);
  sessionCache.set(tokenHash, { expiresAt: Date.now() + SESSION_CACHE_MS, user });
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("仅管理员可以执行此操作");
  return user;
}

export async function createSession(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  const localPreviewLogin = process.env.NODE_ENV !== "production"
    && username === (process.env.ADMIN_USERNAME || "admin")
    && password === process.env.ADMIN_PASSWORD;
  if (!user || user.status !== "ACTIVE" || (!localPreviewLogin && !(await compare(password, user.passwordHash)))) return false;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt } });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await shouldUseSecureCookie(),
    path: "/",
    expires: expiresAt,
  });
  return true;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    sessionCache.delete(tokenHash);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  store.delete(COOKIE_NAME);
}
