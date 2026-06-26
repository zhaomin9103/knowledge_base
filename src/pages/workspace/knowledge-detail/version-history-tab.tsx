import { useMemo, useState } from "react"
import { GitCommitVertical, RotateCcw, Sparkles, CheckCircle2 } from "lucide-react"
import { getVersions, type KBVersion } from "@/mocks/versions"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"
import { useKBRole } from "@/hooks/use-kb-role"
import { formatUpdatedAt } from "@/lib/format"
import { getFileIcon, getFileIconColor } from "@/lib/file-icon"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OperationBadge } from "./operation-badge"
import { RollbackDialog } from "./rollback-dialog"
import { PageNotesDrawer } from "./page-notes-drawer"

interface VersionHistoryTabProps {
  kbId: string
}

const VERSION_HISTORY_NOTES = `【页面定位】
管理员 / 创建者查看知识库的版本演进历史，并由创建者执行版本回退。

【版本自动记录的触发条件】
1. 知识库初始化：创建知识库时自动生成 v1（初始版本），图标为 ✨，无操作类型标签。
2. 审核通过：维护人员提交的「新增 / 更新 / 删除」经管理员审核通过后，自动生成一个新版本（版本号 +1）。
   · 驳回的提交不生成版本。
   · 一次通过 = 一个版本，版本与审核记录一一对应。
3. 回退「不」生成新版本（见下）。

【列表展示】
竖向时间线，最新版本在顶部（版本号倒序）。每个版本卡片包含：
· v{版本号}
· 「当前生效」徽标（仅当前指针指向的版本）
· 「最新」徽标（版本号最大且非当前生效时）
· 操作类型标签：新增 / 更新 / 删除（初始化版本不显示）
· 文档名称（带文件图标）
· 变更说明
· 元信息：生成时间 / 提交人 / 审核人

【回退逻辑（方案A：指针移动）】
· 仅创建者（isOwner）可见「回退到此版本」按钮，且仅对”非当前生效”的版本显示。
· 点击后弹出回退确认弹窗（amber 警告），说明回退影响。
· 回退「不」生成新版本，只是把”当前生效”指针移动到目标版本。
· 回退目标之后的版本仍然保留，可再次切换回去（前进 / 后退自由）。
· AI 始终使用”当前生效”版本对应的知识库内容作答。

【交互逻辑】
1. 顶部汇总：共 N 个版本 · 当前生效 v{x}。
2. 当前生效版本卡片高亮（brand 底色 + 实心节点）。
3. 点击「回退到此版本」→ 确认弹窗 → 确认后当前生效指针更新，徽标随之刷新。

【操作逻辑 / 权限】
· 管理员、创建者（canReview）可查看本 Tab。
· 仅创建者可执行回退；管理员只读。
· 维护人员无本 Tab。

【备注】
本说明用于记录页面预期逻辑，可手动编辑后保存（保存在本地浏览器）。`

export function VersionHistoryTab({ kbId }: VersionHistoryTabProps) {
  const { isOwner } = useKBRole(kbId)
  const kb = KNOWLEDGE_BASES.find((k) => k.id === kbId)

  const [currentVersion, setCurrentVersion] = useState<number>(
    kb?.currentVersion ?? 1,
  )
  const [rollbackTarget, setRollbackTarget] = useState<number | null>(null)

  const versions = useMemo(
    () => getVersions(kbId).sort((a, b) => b.version - a.version),
    [kbId],
  )

  const maxVersion = useMemo(
    () => versions.reduce((max, v) => Math.max(max, v.version), 1),
    [versions],
  )

  const handleRollback = (target: number) => {
    setCurrentVersion(target)
    setRollbackTarget(null)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {versions.length} 个版本 · 当前生效
          <span className="mx-1 font-medium text-brand-600 dark:text-brand-400">
            v{currentVersion}
          </span>
        </p>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border bg-card p-6">
        <div className="relative">
          {versions.map((version, index) => (
            <VersionNode
              key={version.version}
              version={version}
              isLatest={version.version === maxVersion}
              isCurrent={version.version === currentVersion}
              isLast={index === versions.length - 1}
              canRollback={isOwner && version.version !== currentVersion}
              onRollback={() => setRollbackTarget(version.version)}
            />
          ))}
        </div>
      </div>

      {rollbackTarget != null && (
        <RollbackDialog
          open={rollbackTarget != null}
          onOpenChange={(open) => !open && setRollbackTarget(null)}
          targetVersion={rollbackTarget}
          currentVersion={currentVersion}
          onConfirm={() => handleRollback(rollbackTarget)}
        />
      )}

      {/* 页面备注抽屉 */}
      <PageNotesDrawer
        noteKey={`version-history:${kbId}`}
        title="版本记录 · 页面备注"
        defaultContent={VERSION_HISTORY_NOTES}
      />
    </div>
  )
}

interface VersionNodeProps {
  version: KBVersion
  isLatest: boolean
  isCurrent: boolean
  isLast: boolean
  canRollback: boolean
  onRollback: () => void
}

function VersionNode({
  version,
  isLatest,
  isCurrent,
  isLast,
  canRollback,
  onRollback,
}: VersionNodeProps) {
  const isInit = version.operation === "init"
  const FileIcon = version.documentExt ? getFileIcon(version.documentExt) : null
  const fileIconColor = version.documentExt
    ? getFileIconColor(version.documentExt)
    : ""

  return (
    <div className="flex gap-4 pb-6 last:pb-0">
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex size-9 items-center justify-center rounded-full border-2 transition",
            isCurrent
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-border bg-card text-muted-foreground",
          )}
        >
          {isInit ? (
            <Sparkles className="size-4" />
          ) : (
            <GitCommitVertical className="size-4" />
          )}
        </div>
        {!isLast && <div className="absolute top-9 h-full w-0.5 bg-border" />}
      </div>

      <div
        className={cn(
          "mb-1 flex-1 rounded-lg border p-4 transition",
          isCurrent
            ? "border-brand-300 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/20"
            : "bg-card",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-foreground">
                v{version.version}
              </span>
              {isCurrent && (
                <span className="inline-flex items-center gap-1 rounded bg-brand-500 px-2 py-0.5 text-xs font-medium text-white">
                  <CheckCircle2 className="size-3" />
                  当前生效
                </span>
              )}
              {isLatest && !isCurrent && (
                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  最新
                </span>
              )}
              {version.operation !== "init" && (
                <OperationBadge operation={version.operation} />
              )}
            </div>

            {isInit ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {version.changeDescription}
              </p>
            ) : (
              <div className="mt-2 space-y-1">
                {version.documentName && (
                  <div className="flex items-center gap-1.5 text-sm">
                    {FileIcon && (
                      <FileIcon
                        className={cn("size-4 shrink-0", fileIconColor)}
                      />
                    )}
                    <span className="text-foreground">
                      {version.documentName}
                    </span>
                  </div>
                )}
                {version.changeDescription && (
                  <p className="text-sm text-muted-foreground">
                    {version.changeDescription}
                  </p>
                )}
              </div>
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
    </div>
  )
}
