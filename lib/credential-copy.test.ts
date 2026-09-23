import { describe, expect, it } from "vitest";
import { formatCredentialBundle } from "./credential-copy";

describe("formatCredentialBundle", () => {
  it("formats account credentials as three paste-friendly lines", () => {
    expect(formatCredentialBundle({
      accountEmail: "member@example.com",
      password: "secret-123",
      verificationUrl: "https://example.com/code",
    })).toBe("账号：member@example.com\n密码：secret-123\n验证码链接：https://example.com/code");
  });
});
