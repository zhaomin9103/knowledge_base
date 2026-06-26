/** 格式化更新时间：YYYY-MM-DD HH:mm */
export function formatUpdatedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

/** 格式化文件大小（已是 MB 数值） */
export function formatSizeMB(sizeMB: number): string {
  if (sizeMB >= 1024) return `${(sizeMB / 1024).toFixed(1)}GB`
  if (sizeMB >= 1) return `${sizeMB.toFixed(1)}MB`
  return `${(sizeMB * 1024).toFixed(0)}KB`
}

/** 格式化文件大小（字节） */
export function formatSizeBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)}KB`
  return `${bytes}B`
}
