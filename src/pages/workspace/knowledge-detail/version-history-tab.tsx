import { useMemo, useState } from "react"
import { GitCommitVertical, Sparkles, CheckCircle2, ChevronDown, ChevronRight, Archive } from "lucide-react"
import { getVersions, type KBVersion } from "@/mocks/versions"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"
import { formatUpdatedAt } from "@/lib/format"
import { getFileIcon, getFileIconColor } from "@/lib/file-icon"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OperationBadge } from "./operation-badge"
import { PageNotesDrawer } from "./page-notes-drawer"

interface VersionHistoryTabProps {
  kbId: string
}

const VERSION_HISTORY_NOTES = `【页面定位】
管理员 / 创建者查看知识库的版本演进历史。

【版本自动记录的触发条件】
1. 知识库初始化：创建知识库时自动生成 v1（初始版本），图标为 Sparkles
2. 文档审核通过：初审或复审通过后生成版本（标注提交人和审核人）

【按日期分组展示】（v4.1新增）
- 版本按日期分组，同一天的版本可折叠/展开
- 默认展开今天和昨天的版本，更早的默认折叠
- 仅显示最近 50 个版本，超出部分进入"历史归档"
- 点击"查看历史归档"可查看所有旧版本
`

// 按日期分组版本
interface VersionGroup {
  date: string // YYYY-MM-DD
  displayDate: string // 今天 / 昨天 / MM月DD日
  versions: KBVersion[]
}

function groupVersionsByDate(versions: KBVersion[]): VersionGroup[] {
  const groups = new Map<string, KBVersion[]>()

  versions.forEach((version) => {
    const date = version.createdAt.split("T")[0] // YYYY-MM-DD
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(version)
  })

  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  return Array.from(groups.entries())
    .map(([date, versions]) => {
      let displayDate: string
      if (date === today) {
        displayDate = "今天"
      } else if (date === yesterday) {
        displayDate = "昨天"
      } else {
        const [, month, day] = date.split("-")
        displayDate = `${parseInt(month)}月${parseInt(day)}日`
      }

      return {
        date,
        displayDate,
        versions: versions.sort((a, b) => b.version - a.version), // 同一天内倒序
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date)) // 日期倒序
}

export function VersionHistoryTab({ kbId }: VersionHistoryTabProps) {
  const kb = KNOWLEDGE_BASES.find((k) => k.id === kbId)
  const [showArchive, setShowArchive] = useState(false)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  const allVersions = useMemo(() => {
    const versions = getVersions(kbId)
    return versions.reverse() // 倒序：最新版本在前
  }, [kbId])

  // 最近50个版本（活跃版本）
  const activeVersions = useMemo(() => allVersions.slice(0, 50), [allVersions])

  // 归档版本（超过50个的旧版本）
  const archivedVersions = useMemo(() => allVersions.slice(50), [allVersions])

  // 显示的版本列表
  const displayVersions = showArchive ? allVersions : activeVersions

  // 按日期分组
  const versionGroups = useMemo(() => {
    return groupVersionsByDate(displayVersions)
  }, [displayVersions])

  // 初始化展开状态：展开今天和昨天
  useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
    setExpandedDates(new Set([today, yesterday]))
  }, [])

  const toggleDateExpand = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }

  if (!kb) return <div className="p-8 text-center text-muted-foreground">知识库不存在</div>

  const currentVersion = kb.currentVersion

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 页面说明 */}
      <PageNotesDrawer
        noteKey="version-history"
        title="版本记录"
        defaultContent={VERSION_HISTORY_NOTES}
      />

      {/* 统计信息 */}
      <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <GitCommitVertical className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">当前版本：</span>
          <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">
            v{currentVersion}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>总版本数：</span>
          <span className="font-semibold text-foreground">{allVersions.length}</span>
        </div>
        {archivedVersions.length > 0 && !showArchive && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Archive className="size-3.5" />
              <span>已归档：</span>
              <span className="font-semibold text-foreground">{archivedVersions.length}</span>
            </div>
          </>
        )}
      </div>

      {/* 版本列表 */}
      <div className="flex-1 overflow-auto rounded-lg border bg-card">
        <div className="divide-y">
          {versionGroups.map((group) => {
            const isExpanded = expandedDates.has(group.date)

            return (
              <div key={group.date}>
                {/* 日期分组头部 */}
                <button
                  onClick={() => toggleDateExpand(group.date)}
                  className="flex w-full items-center gap-2 bg-muted/50 px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <span>{group.displayDate}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({group.versions.length} 个版本)
                  </span>
                  {group.date === new Date().toISOString().split("T")[0] && (
                    <span className="ml-auto text-xs text-brand-600 dark:text-brand-400">
                      最新
                    </span>
                  )}
                </button>

                {/* 该日期的版本列表 */}
                {isExpanded && (
                  <div className="divide-y">
                    {group.versions.map((version) => (
                      <VersionItem
                        key={version.version}
                        version={version}
                        isCurrent={version.version === currentVersion}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 归档入口 */}
        {archivedVersions.length > 0 && (
          <div className="border-t bg-muted/30 p-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchive(!showArchive)}
            >
              <Archive className="mr-2 size-4" />
              {showArchive ? "隐藏历史归档" : `查看历史归档 (${archivedVersions.length} 个版本)`}
            </Button>
          </div>
        )}
      </div>

      {/* 回退确认弹窗 */}
      {rollbackVersion && (
        <RollbackDialog
          targetVersion={rollbackVersion.version}
          currentVersion={currentVersion}
          open={!!rollbackVersion}
          onOpenChange={(open) => !open && setRollbackVersion(null)}
          onConfirm={() => {
            alert(
              `已回退到 v${rollbackVersion.version}\n\n注意：这是演示功能，真实环境需要重新解析文档并更新知识库索引。`,
            )
            setRollbackVersion(null)
          }}
        />
      )}
    </div>
  )
}

interface VersionItemProps {
  version: KBVersion
  isCurrent: boolean
  canRollback: boolean
  onRollback: () => void
}

function VersionItem({ version, isCurrent, canRollback, onRollback }: VersionItemProps) {
  const isInit = version.operation === "init"
  const Icon = isInit ? Sparkles : GitCommitVertical
  const FileIcon = version.documentExt ? getFileIcon(version.documentExt) : null
  const fileIconColor = version.documentExt ? getFileIconColor(version.documentExt) : ""

  return (
    <div className={cn("group p-4 transition", isCurrent && "bg-brand-50/50 dark:bg-brand-950/20")}>
      <div className="flex items-start gap-4">
        {/* 版本号图标 */}
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full transition",
            isCurrent
              ? "bg-brand-500 text-white"
              : isInit
                ? "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
                : "bg-muted text-muted-foreground group-hover:bg-muted/80",
          )}
        >
          <Icon className="size-5" />
        </div>

        {/* 版本信息 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">v{version.version}</span>
            {isCurrent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-xs font-medium text-white">
                <CheckCircle2 className="size-3" />
                当前版本
              </span>
            )}
            {isInit && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                初始版本
              </span>
            )}
            {!isInit && version.operation !== "init" && (
              <OperationBadge operation={version.operation} />
            )}
          </div>

          {/* 文档名称 */}
          {version.documentName && (
            <div className="mt-1 flex items-center gap-2">
              {FileIcon && <FileIcon className={cn("size-4", fileIconColor)} />}
              <span className="truncate font-medium text-foreground">{version.documentName}</span>
            </div>
          )}

          {/* 变更说明 */}
          {version.changeDescription && (
            <div className="mt-1 text-sm text-muted-foreground">{version.changeDescription}</div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{formatUpdatedAt(version.createdAt)}</span>
            {version.submitterName && version.submitterId && (
              <span>提交：{version.submitterName}({version.submitterIdNo})</span>
            )}
            {version.reviewerName && version.reviewerId && (
              <span>审核：{version.reviewerName}({version.reviewerIdNo})</span>
            )}
          </div>
        </div>

        {canRollback && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRollback}
            className="shrink-0"
          >
            <RotateCcw className="mr-1 size-3.5" />
            回退到此版本
          </Button>
        )}
      </div>
    </div>
  )
}
