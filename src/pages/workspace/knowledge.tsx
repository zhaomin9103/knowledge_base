import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronDown,
  FileText,
  MoreHorizontal,
  Search,
  Send,
  UserCircle2,
} from "lucide-react"
import { KNOWLEDGE_BASES, type KnowledgeBase } from "@/mocks/knowledge"
import { formatSizeMB, formatUpdatedAt } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  CreateKnowledgeDialog,
  type CreateKnowledgeValues,
} from "./create-knowledge-dialog"

export default function KnowledgePage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [items, setItems] = useState<KnowledgeBase[]>(KNOWLEDGE_BASES)

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return items
    return items.filter((it) => it.name.toLowerCase().includes(kw))
  }, [keyword, items])

  const handleCreate = (values: CreateKnowledgeValues) => {
    const newItem: KnowledgeBase = {
      id: `kb-${items.length + 1}-${values.name}`,
      name: values.name,
      category: values.category,
      fileCount: 0,
      sizeMB: 0,
      creator: "admin",
      cover: values.cover,
      updatedAt: new Date().toISOString(),
      // 新建知识库：当前用户为超管，无管理员/维护人员
      ownerId: "u-admin-001",
      adminIds: [],
      maintainerIds: [],
      currentVersion: 1,
    }
    setItems((prev) => [newItem, ...prev])
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* 顶部 */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">知识库</h1>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex h-9 min-w-32 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm">
            <span>全部</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
          <div className="flex h-9 w-64 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="请输入"
              className="h-full flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-500 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600"
          >
            <Send className="size-4" />
            创建
          </button>
        </div>
      </div>

      {/* 卡片列表 */}
      {filtered.length === 0 ? (
        <EmptyState keyword={keyword} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((kb) => (
            <KnowledgeCard
              key={kb.id}
              kb={kb}
              onClick={() => navigate(`/workspace/knowledge/${kb.id}`)}
            />
          ))}
        </div>
      )}

      <CreateKnowledgeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
    </div>
  )
}

interface KnowledgeCardProps {
  kb: KnowledgeBase
  onClick: () => void
}

function KnowledgeCard({ kb, onClick }: KnowledgeCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "group cursor-pointer rounded-xl border bg-card p-4 transition-all",
        "hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {/* 上半部分：图标 + 名称 + 文件数 */}
      <div className="flex items-start gap-3">
        <KnowledgeIcon kb={kb} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-medium text-foreground">
              {kb.name}
            </h3>
            <span className="shrink-0 text-xs text-muted-foreground">
              {kb.fileCount}个文件 | {formatSizeMB(kb.sizeMB)}
            </span>
          </div>
          <span className="mt-2 inline-block rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {kb.category}
          </span>
        </div>
      </div>

      {/* 下半部分：创建人 + 时间 + 操作 */}
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <UserCircle2 className="size-4 text-brand-500" />
          <span>{kb.creator}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{formatUpdatedAt(kb.updatedAt)} 更新</span>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="更多操作"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function KnowledgeIcon({ kb }: { kb: KnowledgeBase }) {
  if (kb.cover) {
    return (
      <img
        src={kb.cover}
        alt={kb.name}
        className="size-16 shrink-0 rounded-lg object-cover"
      />
    )
  }
  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-orange-400 text-white">
      <FileText className="size-8" />
    </div>
  )
}

function EmptyState({ keyword }: { keyword: string }) {
  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      {keyword ? `没有匹配 "${keyword}" 的知识库` : "暂无知识库"}
    </div>
  )
}
