import { useState } from "react"
import {
  HelpCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Download,
  Trash2,
  Edit3,
} from "lucide-react"
import { DOCUMENTS_BY_KB, type Document } from "@/mocks/documents"
import { formatSizeBytes, formatUpdatedAt } from "@/lib/format"
import { getFileIcon, getFileIconColor } from "@/lib/file-icon"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DocumentsTabProps {
  kbId: string
}

export function DocumentsTab({ kbId }: DocumentsTabProps) {
  const [docs, setDocs] = useState<Document[]>(DOCUMENTS_BY_KB[kbId] ?? [])
  const [keyword, setKeyword] = useState("")

  const filtered = keyword.trim()
    ? docs.filter((d) => d.name.toLowerCase().includes(keyword.toLowerCase()))
    : docs

  const totalSize = docs.reduce((sum, d) => sum + d.sizeBytes, 0)

  const handleDelete = (docId: string) => {
    if (confirm("确定删除该文档？")) {
      setDocs((prev) => prev.filter((d) => d.id !== docId))
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 搜索栏 + 统计 */}
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-80 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="请输入"
            className="h-full flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {docs.length}个文件，共{formatSizeBytes(totalSize)}
        </span>
      </div>

      {/* 文档表格 */}
      <div className="flex-1 overflow-auto rounded-lg border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur">
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                文件
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                上传时间
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                分块数量
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  解析方式
                  <HelpCircle className="size-3.5" />
                </span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                解析状态
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  {keyword ? "无匹配文件" : "暂无文档"}
                </td>
              </tr>
            ) : (
              filtered.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  onDelete={() => handleDelete(doc.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface DocumentRowProps {
  doc: Document
  onDelete: () => void
}

function DocumentRow({ doc, onDelete }: DocumentRowProps) {
  const Icon = getFileIcon(doc.ext)
  const iconColor = getFileIconColor(doc.ext)

  return (
    <tr className="group border-b transition hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon className={cn("size-5 shrink-0", iconColor)} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-foreground">
              {doc.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatSizeBytes(doc.sizeBytes)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {formatUpdatedAt(doc.uploadedAt)}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{doc.chunkCount}</td>
      <td className="px-4 py-3 text-muted-foreground">{doc.parseMode}</td>
      <td className="px-4 py-3">
        <StatusBadge status={doc.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="更多操作"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => alert(`重新解析: ${doc.name}`)}
              >
                <RefreshCw className="mr-2 size-4" />
                重新解析
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => alert(`重命名: ${doc.name}`)}>
                <Edit3 className="mr-2 size-4" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => alert(`下载: ${doc.name}`)}>
                <Download className="mr-2 size-4" />
                下载
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onDelete}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}

function StatusBadge({ status }: { status: Document["status"] }) {
  const config = {
    success: {
      label: "成功",
      className:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    },
    pending: {
      label: "解析中",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    },
    failed: {
      label: "失败",
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    },
  }[status]

  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
