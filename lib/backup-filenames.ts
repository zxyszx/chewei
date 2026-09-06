export function backupFilename(date = new Date()) {
  const stamp = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `chewei-backup-${stamp}.json`;
}

export function validBackupFilename(name: string) {
  return /^chewei-backup-\d{8}T\d{6}Z\.json$/.test(name);
}
