export type UpdateStatus = {
  state?: string;
  message?: string;
  updatedAt?: string;
};

const RUNNING_STATES = new Set(["queued", "updating"]);
const STATUS_TIMEOUT_MS = 60 * 60 * 1000;

export function resolveUpdateStatus(
  status: UpdateStatus | null,
  current: string,
  latest: string | null,
  now = Date.now(),
) {
  if (!status || !RUNNING_STATES.has(status.state || "")) return status;

  if (current !== "unknown" && latest && current === latest) {
    return { ...status, state: "success", message: "更新完成，当前已是最新版本" };
  }

  const updatedAt = status.updatedAt ? Date.parse(status.updatedAt) : Number.NaN;
  if (Number.isFinite(updatedAt) && now - updatedAt > STATUS_TIMEOUT_MS) {
    return { ...status, state: "failed", message: "更新状态已超时，请检查服务日志后重试" };
  }

  return status;
}
