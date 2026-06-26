import { FileText, FileSpreadsheet, FileImage, File } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const EXT_ICON_MAP: Record<string, LucideIcon> = {
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  docx: FileText,
  doc: FileText,
  pdf: FileText,
  txt: FileText,
  md: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  svg: FileImage,
}

const EXT_COLOR_MAP: Record<string, string> = {
  xlsx: "text-green-600 dark:text-green-400",
  xls: "text-green-600 dark:text-green-400",
  csv: "text-green-600 dark:text-green-400",
  docx: "text-blue-600 dark:text-blue-400",
  doc: "text-blue-600 dark:text-blue-400",
  pdf: "text-red-600 dark:text-red-400",
  txt: "text-gray-600 dark:text-gray-400",
  md: "text-purple-600 dark:text-purple-400",
  png: "text-pink-600 dark:text-pink-400",
  jpg: "text-pink-600 dark:text-pink-400",
  jpeg: "text-pink-600 dark:text-pink-400",
  gif: "text-pink-600 dark:text-pink-400",
  svg: "text-orange-600 dark:text-orange-400",
}

export function getFileIcon(ext: string): LucideIcon {
  return EXT_ICON_MAP[ext.toLowerCase()] ?? File
}

export function getFileIconColor(ext: string): string {
  return EXT_COLOR_MAP[ext.toLowerCase()] ?? "text-gray-500"
}
