export function formatCredentialBundle({
  accountEmail,
  password,
  verificationUrl,
}: {
  accountEmail: string;
  password: string;
  verificationUrl: string;
}) {
  return `账号：${accountEmail}\n密码：${password}\n验证码链接：${verificationUrl}`;
}
