import { useMemo, useState } from "react"
import { GitBranch, Inbox } from "lucide-react"
import {
  REVIEW_REQUESTS,
  getRejectedDecision,
  type ReviewRequest,
} from "@/mocks/reviews"
import { useAuth } from "@/hooks/use-auth"
import { formatUpdatedAt, formatSizeBytes } from "@/lib/format"
import { getFileIcon, getFileIconColor } from "@/lib/file-icon"
import { cn } from "@/lib/utils"
import { OperationBadge } from "./operation-badge"
import { SubmissionStatusBadge } from "./submission-status-badge"
import { DocumentPreviewDialog } from "./document-preview-dialog"
import { ApprovalFlowDialog } from "./approval-flow-dialog"

interface MySubmissionsTabProps {
  kbId: string
}

type StatusFilter = "all" | "pending" | "rejected"

export function MySubmissionsTabEnhanced({ kbId }: MySubmissionsTabProps) {
  const { currentUser } = useAuth()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [previewReview, setPreviewReview] = useState<ReviewRequest | null>(null)
  const [flowReview, setFlowReview] = useState<ReviewRequest | null>(null)

  // 当前用户在该知识库的所有提交
  const mySubmissions = useMemo(
    () =>
      REVIEW_REQUESTS.filter(
        (r) => r.kbId === kbId && r.submitter.id === currentUser.id,
      ).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [kbId, currentUser.id],
  )

  // 待审核 = 待初审 + 待复审
  const isPending = (r: ReviewRequest) =>
    r.status === "pending_first" || r.status === "pending_second"

  // 分状态统计（不包括已通过）
  const counts = useMemo(() => {
    const pending = mySubmissions.filter(isPending).length
    const rejected = mySubmissions.filter((r) => r.status === "rejected").length
    const all = pending + rejected
    return { all, pending, rejected }
  }, [mySubmissions])

  // 筛选后的列表（排除已通过）
  const filtered = useMemo(() => {
    const notApproved = mySubmissions.filter((r) => r.status !== "approved")
    if (statusFilter === "all") return notApproved
    if (statusFilter === "pending") return notApproved.filter(isPending)
    return notApproved.filter((r) => r.status === "rejected")
  }, [mySubmissions, statusFilter])

  return (
    <div className="flex h-full flex-col gap-6">
      {/* 状态筛选器 - 使用设计规范的圆角和颜色 */}
      <div className="flex items-center gap-3">
        <FilterButton
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
          count={counts.all}
        >
          全部
        </FilterButton>
        <FilterButton
          active={statusFilter === "pending"}
          onClick={() => setStatusFilter("pending")}
          count={counts.pending}
          variant="warning"
        >
          待审核
        </FilterButton>
        <FilterButton
          active={statusFilter === "rejected"}
          onClick={() => setStatusFilter("rejected")}
          count={counts.rejected}
          variant="danger"
        >
          审核驳回
        </FilterButton>
      </div>

      {/* 卡片列表 */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl bg-white">
          <div className="text-center">
            <Inbox className="mx-auto mb-3 size-16 text-[#BFBFBF]" />
            <p className="text-sm text-[#858890]">暂无提交记录</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-auto pb-4">
          {filtered.map((review) => (
            <SubmissionCard
              key={review.id}
              review={review}
              onPreviewDocument={() => setPreviewReview(review)}
              onViewFlow={() => setFlowReview(review)}
            />
          ))}
        </div>
      )}

      {/* 文档预览弹窗 */}
      {previewReview && (
        <DocumentPreviewDialog
          review={previewReview}
          open={!!previewReview}
          onOpenChange={(open) => !open && setPreviewReview(null)}
        />
      )}

      {/* 审批流弹窗 */}
      {flowReview && (
        <ApprovalFlowDialog
          review={flowReview}
          open={!!flowReview}
          onOpenChange={(open) => !open && setFlowReview(null)}
        />
      )}
    </div>
  )
}

interface FilterButtonProps {
  active: boolean
  onClick: () => void
  count: number
  variant?: "default" | "warning" | "danger"
  children: React.ReactNode
}

function FilterButton({
  active,
  onClick,
  count,
  variant = "default",
  children,
}: FilterButtonProps) {
  const variantClasses = {
    default: active
      ? "bg-gradient-to-r from-[#494AFF] to-[#006EFE] text-white shadow-md"
      : "bg-white text-[#0B111E] hover:bg-[#F3F4F7]",
    warning: active
      ? "bg-gradient-to-r from-[#FF9F43] to-[#FFA94D] text-white shadow-md"
      : "bg-white text-[#0B111E] hover:bg-[#FEF3E2]",
    danger: active
      ? "bg-gradient-to-r from-[#E95141] to-[#F16B5C] text-white shadow-md"
      : "bg-white text-[#0B111E] hover:bg-[#FFF1F0]",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
        active ? "border-transparent" : "border-[#E7E7E9]",
        variantClasses[variant],
      )}
    >
      {children}
      <span
        className={cn(
          "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium",
          active ? "bg-white/20 text-white" : "bg-[#F3F4F7] text-[#858890]",
        )}
      >
        {count}
      </span>
    </button>
  )
}

interface SubmissionCardProps {
  review: ReviewRequest
  onPreviewDocument: () => void
  onViewFlow: () => void
}

function SubmissionCard({
  review,
  onPreviewDocument,
  onViewFlow,
}: SubmissionCardProps) {
  const Icon = getFileIcon(review.documentExt)
  const iconColor = getFileIconColor(review.documentExt)
  const rejectedReason = getRejectedDecision(review)?.reason

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#E7E7E9] bg-white transition-all hover:border-[#1947FF]/20 hover:shadow-lg">
      {/* 顶部装饰线 */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#494AFF] to-[#006EFE] opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="p-6">
        {/* 头部：文件信息 + 操作类型 */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={onPreviewDocument}
            className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:text-[#1947FF]"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F7]">
              <Icon className={cn("size-6", iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-medium text-[#0C1222]">
                {review.documentName}
              </h3>
              {review.fileSizeBytes && (
                <p className="text-xs text-[#858890]">
                  {formatSizeBytes(review.fileSizeBytes)}
                </p>
              )}
            </div>
          </button>
          <OperationBadge operation={review.operation} />
        </div>

        {/* 变更说明 */}
        <div className="mb-4">
          <p className="text-sm text-[#666666] line-clamp-2">
            {review.changeDescription}
          </p>
        </div>

        {/* 底部：状态 + 时间 + 操作 */}
        <div className="flex items-center justify-between gap-4 border-t border-[#F0F0F0] pt-4">
          <div className="flex items-center gap-3">
            <SubmissionStatusBadge status={review.status} />
            <span className="text-xs text-[#858890]">
              {formatUpdatedAt(review.createdAt)}
            </span>
          </div>

          <button
            type="button"
            onClick={onViewFlow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7E7E9] bg-white px-3 py-1.5 text-sm text-[#0B111E] transition-all hover:border-[#1947FF] hover:text-[#1947FF]"
          >
            <GitBranch className="size-3.5" />
            查看审批流
          </button>
        </div>

        {/* 驳回原因（如果有） */}
        {review.status === "rejected" && rejectedReason && (
          <div className="mt-3 rounded-lg bg-[#FFF1F0] px-3 py-2 text-sm text-[#E95141]">
            驳回原因：{rejectedReason}
          </div>
        )}
      </div>
    </div>
  )
}
