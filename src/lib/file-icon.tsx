import { createElement } from "react"
import { FileText, FileSpreadsheet, FileImage, File } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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

function getFileIcon(ext: string): LucideIcon {
  return EXT_ICON_MAP[ext.toLowerCase()] ?? File
}

function getFileIconColor(ext: string): string {
  return EXT_COLOR_MAP[ext.toLowerCase()] ?? "text-gray-500"
}

interface FileIconProps {
  /** 文件扩展名（不含点，大小写不敏感） */
  ext: string
  /** 额外类名（尺寸等），会与扩展名对应的颜色合并 */
  className?: string
}

/**
 * 文件类型图标：根据扩展名渲染对应图标并套用配色。
 *
 * 统一封装「取图标 + 取颜色 + 渲染」，避免在各列表组件里重复
 * `const Icon = getFileIcon(...)` 的写法（会触发 react-hooks/static-components）。
 */
export function FileIcon({ ext, className }: FileIconProps) {
  // 用 createElement 而非 <Icon /> JSX：图标来自静态 map、引用稳定，
  // 大写变量的 JSX 写法会误触发 react-hooks/static-components。
  return createElement(getFileIcon(ext), {
    className: cn(getFileIconColor(ext), className),
  })
}
