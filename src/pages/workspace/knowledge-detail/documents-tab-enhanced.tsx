import { useState } from "react"
import {
  MoreHorizontal,
  RefreshCw,
  Search,
  Download,
  Trash2,
  Edit3,
  FileText,
  Calendar,
  Database,
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

export function DocumentsTabEnhanced({ kbId }: DocumentsTabProps) {
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
    <div className="flex h-full flex-col gap-6">
      {/* Enhanced Search & Stats Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex h-11 flex-1 max-w-md items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-4 shadow-sm backdrop-blur-sm transition-all focus-within:border-brand-400 focus-within:shadow-md focus-within:shadow-brand-500/10">
          <Search className="size-4.5 text-muted-foreground transition-colors" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索文档名称..."
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          {keyword && (
            <button
              onClick={() => setKeyword("")}
              className="text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-5 rounded-xl border border-border/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 px-5 py-2.5 dark:from-amber-950/20 dark:to-orange-950/10">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-foreground">
              {docs.length}
            </span>
            <span className="text-xs text-muted-foreground">个文件</span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <Database className="size-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-foreground">
              {formatSizeBytes(totalSize)}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Document Grid */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30">
            <div className="text-center">
              <FileText className="mx-auto mb-3 size-12 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {keyword ? "未找到匹配的文档" : "暂无文档"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 pb-4 sm:grid-cols-1">
            {filtered.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onDelete={() => handleDelete(doc.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface DocumentCardProps {
  doc: Document
  onDelete: () => void
}

function DocumentCard({ doc, onDelete }: DocumentCardProps) {
  const Icon = getFileIcon(doc.ext)
  const iconColor = getFileIconColor(doc.ext)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-sm transition-all duration-300 hover:border-brand-300/40 hover:shadow-lg hover:shadow-brand-500/5">
      {/* Decorative gradient accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-amber-400 to-orange-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-center gap-4 p-5">
        {/* File Icon */}
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm ring-1 ring-border/30 transition-transform duration-300 group-hover:scale-105">
          <Icon className={cn("size-7 transition-transform duration-300 group-hover:scale-110", iconColor)} />
        </div>

        {/* File Info */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-serif text-base font-semibold text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {doc.name}
              </h3>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Database className="size-3" />
                  {formatSizeBytes(doc.sizeBytes)}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatUpdatedAt(doc.uploadedAt)}
                </span>
              </div>
            </div>

            {/* Actions - Always Visible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-lg border border-border/40 bg-background/60 text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 hover:shadow-md dark:hover:bg-brand-950/50 dark:hover:text-brand-400"
                  aria-label="更多操作"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
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

          {/* Meta Row */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">分块数量</span>
              <span className="rounded-md bg-muted/50 px-2 py-0.5 font-mono font-medium text-foreground">
                {doc.chunkCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">解析方式</span>
              <span className="rounded-md bg-muted/50 px-2 py-0.5 font-medium text-foreground">
                {doc.parseMode}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">状态</span>
              <StatusBadge status={doc.status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Document["status"] }) {
  const config = {
    success: {
      label: "解析成功",
      className:
        "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 ring-1 ring-green-200/50 dark:from-green-950/50 dark:to-emerald-950/50 dark:text-green-400 dark:ring-green-800/30",
    },
    pending: {
      label: "解析中",
      className:
        "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 ring-1 ring-amber-200/50 dark:from-amber-950/50 dark:to-yellow-950/50 dark:text-amber-400 dark:ring-amber-800/30",
    },
    failed: {
      label: "解析失败",
      className:
        "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 ring-1 ring-red-200/50 dark:from-red-950/50 dark:to-rose-950/50 dark:text-red-400 dark:ring-red-800/30",
    },
  }[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
