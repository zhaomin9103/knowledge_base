import { useMemo, useState } from "react"
import { Inbox, Users } from "lucide-react"
import { OPERATION_LOGS, type OperationLog } from "@/mocks/operations"
import { REVIEW_REQUESTS, type ReviewRequest } from "@/mocks/reviews"
import { formatUpdatedAt } from "@/lib/format"
import { getFileIcon, getFileIconColor } from "@/lib/file-icon"
import { cn } from "@/lib/utils"
import { ActionBadge } from "./action-badge"
import { DocumentPreviewDialog } from "./document-preview-dialog"
import { PageNotesDrawer } from "./page-notes-drawer"

interface AuditLogTabProps {
  kbId: string
}

const AUDIT_LOG_NOTES = `【页面定位】
管理员 / 创建者查看本知识库的全量操作流水（审计日志），用于追溯"谁、在什么时间、做了什么"。仅作展示，不提供操作。

【数据来源】
操作日志由「审核流转 + 成员管理 + 版本回退」等事件派生，单一数据源（与待审核 / 审核记录同源 REVIEW_REQUESTS）。一次业务流程可能产生多条日志，例如：
· 维护人员提交一次新增 → 1 条"提交新增"日志（记在提交时间）
· 管理员审核通过 → 另 1 条"审核通过"日志（记在审核时间）
即"提交"与"审核"是两条独立日志，各自记录操作人与时间；被驳回的提交也会保留其"提交"日志，不会因驳回而消失。

【列表字段】
· 操作时间：该动作发生的时间（倒序，最新在最上）
· 操作人：姓名 + 工号 + 所属组织
· 操作类型：标签形式，包含
   - 提交新增 / 提交更新 / 提交删除（维护人员）
   - 审核通过 / 审核驳回（管理员）
   - 新增成员 / 移除成员 / 变更角色（创建者）
   - 版本回退（创建者）
· 操作对象：
   - 文档类对象 → 文件图标 + 文档名，若可关联到提交记录则可点击打开「文档预览弹窗」
   - 成员类对象 → 紫色 Users 图标 + 成员名（不可点击）
· 备注：
   - 审核驳回 → 显示驳回原因（红色）
   - 审核通过 → 显示"生效版本 v{n}"
   - 其他 → 显示"—"

【交互逻辑】
1. 表头吸顶，列表整体倒序。
2. 文档类操作对象（且能关联到 reviewRequestId）→ 点击弹出文档预览。
3. 成员类操作对象不可点击，仅展示。

【操作逻辑 / 权限】
· 管理员、创建者（canReview）可见本 Tab。
· 纯展示 / 审计追溯页，不可编辑或删除日志。

【待联动（演示说明）】
当前"成员管理（增删改角色）""版本回退"的操作在前端 state 已生效，但尚未回写到操作日志数据源。后续可补充派生逻辑，使这些动作也实时出现在本流水中。

【备注】
本说明用于记录页面预期逻辑，可手动编辑后保存（保存在本地浏览器）。`

export function AuditLogTabEnhanced({ kbId }: AuditLogTabProps) {
  const [previewReview, setPreviewReview] = useState<ReviewRequest | null>(null)

  const logs = useMemo(
    () => OPERATION_LOGS.filter((l) => l.kbId === kbId),
    [kbId],
  )

  const handlePreviewDocument = (log: OperationLog) => {
    if (!log.reviewRequestId) return
    const rr = REVIEW_REQUESTS.find((r) => r.id === log.reviewRequestId)
    if (rr) setPreviewReview(rr)
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* 顶部统计 */}
      <div className="flex items-center justify-between rounded-xl border border-[#E7E7E9] bg-white px-6 py-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#858890]">共</span>
          <span className="text-base font-medium text-[#0C1222]">
            {logs.length}
          </span>
          <span className="text-[#858890]">条操作记录</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-[#E7E7E9] bg-white">
          <div className="text-center">
            <Inbox className="mx-auto mb-3 size-16 text-[#BFBFBF]" />
            <p className="text-sm text-[#858890]">暂无操作记录</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-auto pb-4">
          {logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onPreviewDocument={() => handlePreviewDocument(log)}
            />
          ))}
        </div>
      )}

      {previewReview && (
        <DocumentPreviewDialog
          review={previewReview}
          open={!!previewReview}
          onOpenChange={(open) => !open && setPreviewReview(null)}
        />
      )}

      {/* 页面备注抽屉 */}
      <PageNotesDrawer
        noteKey={`audit-log:${kbId}`}
        title="操作记录 · 页面备注"
        defaultContent={AUDIT_LOG_NOTES}
      />
    </div>
  )
}

interface LogCardProps {
  log: OperationLog
  onPreviewDocument: () => void
}

function LogCard({ log, onPreviewDocument }: LogCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E7E7E9] bg-white transition-all hover:border-[#1947FF]/20 hover:shadow-sm">
      <div className="p-5">
        {/* 头部：操作类型 + 时间 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <ActionBadge action={log.action} />
          <span className="text-sm text-[#858890]">
            {formatUpdatedAt(log.timestamp)}
          </span>
        </div>

        {/* 操作人信息 */}
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-[#F5F7FA] px-4 py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#494AFF] to-[#006EFE] text-xs font-medium text-white">
            {log.actor.name.slice(0, 1)}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium text-[#0C1222]">{log.actor.name}</span>
            <span className="text-[#858890]">工号：{log.actor.idNo}</span>
            <span className="text-[#858890]">{log.actor.organization}</span>
          </div>
        </div>

        {/* 操作对象 */}
        <div className="mb-3">
          <span className="mb-2 block text-xs text-[#858890]">操作对象</span>
          <TargetCell log={log} onPreviewDocument={onPreviewDocument} />
        </div>

        {/* 备注 */}
        {(((log.action === "first_reject" || log.action === "second_reject") &&
          log.meta?.reason) ||
          (log.action === "second_approve" && log.meta?.version != null)) ? (
          <div className="border-t border-[#F0F0F0] pt-3">
            {(log.action === "first_reject" ||
              log.action === "second_reject") &&
            log.meta?.reason ? (
              <div className="rounded-lg bg-[#FFF1F0] px-3 py-2 text-sm text-[#E95141]">
                <span className="font-medium">驳回原因：</span>
                {log.meta.reason}
              </div>
            ) : log.action === "second_approve" && log.meta?.version != null ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF9E5] px-3 py-1.5 text-sm">
                <span className="text-[#858890]">生效版本：</span>
                <span className="font-medium text-[#74C041]">
                  v{log.meta.version}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function TargetCell({
  log,
  onPreviewDocument,
}: {
  log: OperationLog
  onPreviewDocument: () => void
}) {
  if (log.target.type === "member") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#E7E7E9] bg-white px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-purple-100">
          <Users className="size-4 text-purple-600" />
        </div>
        <span className="font-medium text-[#0C1222]">{log.target.name}</span>
      </div>
    )
  }

  // document：可点击预览
  const Icon = getFileIcon(log.target.ext ?? "")
  const iconColor = getFileIconColor(log.target.ext ?? "")
  const canPreview = !!log.reviewRequestId

  const content = (
    <>
      <div className="flex size-8 items-center justify-center rounded-lg bg-[#F3F4F7]">
        <Icon className={cn("size-5", iconColor)} />
      </div>
      <span className="truncate font-medium text-[#0C1222]">{log.target.name}</span>
    </>
  )

  if (canPreview) {
    return (
      <button
        type="button"
        onClick={onPreviewDocument}
        className="flex w-full items-center gap-3 rounded-lg border border-[#E7E7E9] bg-white px-4 py-3 text-left transition-all hover:border-[#1947FF] hover:text-[#1947FF]"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#E7E7E9] bg-white px-4 py-3">
      {content}
    </div>
  )
}
