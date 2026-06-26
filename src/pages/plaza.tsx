import { useState } from "react"
import { ChevronDown, Heart, Search } from "lucide-react"
import { PLAZA_TABS } from "@/config/menu"
import { cn } from "@/lib/utils"

export default function PlazaPage() {
  const [activeTab, setActiveTab] = useState<(typeof PLAZA_TABS)[number]["key"]>(
    "agent",
  )

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Banner */}
      <div className="relative h-44 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-100 via-brand-50 to-brand-100 ring-1 ring-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/40 via-transparent to-transparent" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {PLAZA_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-md px-5 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-9 min-w-32 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm">
          <span>全部</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
        <div className="flex h-9 min-w-36 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm">
          <span>全部发布方</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
        <div className="flex h-9 min-w-72 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
          <Search className="size-4" />
          <span>搜索</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          按热度
          <ChevronDown className="size-4" />
        </div>
      </div>

      {/* 卡片占位 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <PlazaCardPlaceholder key={i} />
        ))}
      </div>
    </div>
  )
}

function PlazaCardPlaceholder() {
  return (
    <div className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="size-16 shrink-0 rounded-lg bg-gradient-to-br from-brand-300 to-brand-500" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            通用
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>—</span>
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3.5" /> 0
        </span>
      </div>
    </div>
  )
}
