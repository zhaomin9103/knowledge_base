import { useMemo, useState } from "react"
import { GitBranch, Inbox } from "lucide-react"
import {
  REVIEW_REQUESTS,
  getRejectedDecision,
  type ReviewRequest,
} from "@/mocks/reviews"
import { useAuth } from "@/hooks/use-auth"
import { useKBRole } from "@/hooks/use-kb-role"
import { formatUpdatedAt, formatSizeBytes } from "@/lib/format"
import { FileIcon } from "@/lib/file-icon"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OperationBadge } from "./operation-badge"
import { SubmissionStatusBadge } from "./submission-status-badge"
import { DocumentPreviewDialog } from "./document-preview-dialog"
import { ApprovalFlowDialog } from "./approval-flow-dialog"

interface MySubmissionsTabProps {
  kbId: string
}

type StatusFilter = "all" | "pending" | "rejected"

export function MySubmissionsTab({ kbId }: MySubmissionsTabProps) {
  const { currentUser } = useAuth()
  const { isSecondReviewer, isOwner } = useKBRole(kbId)
  // 仅「纯复审人」提交直接生效，无需审核状态/详情列；
  // 创建者虽具备复审能力，但按初审人角色对待（提交仍走审核流程展示）
  const isPureSecondReviewer = isSecondReviewer && !isOwner
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

  // 筛选后的列表
  // 所有角色：显示所有提交记录（包括已生效的）
  const filtered = useMemo(() => {
    const baseList = mySubmissions

    if (statusFilter === "all") return baseList
    if (statusFilter === "pending") return baseList.filter(isPending)
    return baseList.filter((r) => r.status === "rejected")
  }, [mySubmissions, statusFilter])

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 状态筛选器 - 纯复审人不显示 */}
      {!isPureSecondReviewer && (
        <div className="flex items-center gap-2">
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
      )}

      {/* 列表 */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border bg-card">
          <div className="text-center text-muted-foreground">
            <Inbox className="mx-auto mb-2 size-12 opacity-20" />
            <p>暂无提交记录</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-lg border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <Th>提交时间</Th>
                <Th>提交类型</Th>
                <Th>提交内容</Th>
                <Th>变更说明</Th>
                {/* 纯复审人提交直接生效，无需审核状态与审核详情列 */}
                {!isPureSecondReviewer && (
                  <>
                    <Th>审核状态</Th>
                    <Th className="text-center">审核详情</Th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((review) => (
                <SubmissionRow
                  key={review.id}
                  review={review}
                  hideReviewColumns={isPureSecondReviewer}
                  onPreviewDocument={() => setPreviewReview(review)}
                  onViewFlow={() => setFlowReview(review)}
                />
              ))}
            </tbody>
          </table>
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

function Th({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  )
}

interface FilterButtonProps {
  active: boolean
  onClick: () => void
  count: number
  variant?: "default" | "warning" | "success" | "danger"
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
    default: active ? "bg-brand-500 text-white" : "",
    warning: active
      ? "bg-amber-500 text-white dark:bg-amber-600"
      : "hover:bg-amber-50 dark:hover:bg-amber-950/30",
    success: active
      ? "bg-green-500 text-white dark:bg-green-600"
      : "hover:bg-green-50 dark:hover:bg-green-950/30",
    danger: active
      ? "bg-red-500 text-white dark:bg-red-600"
      : "hover:bg-red-50 dark:hover:bg-red-950/30",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-transparent shadow-sm"
          : "border-input bg-background hover:bg-secondary",
        variantClasses[variant],
      )}
    >
      {children}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-xs",
          active ? "bg-white/20" : "bg-muted",
        )}
      >
        {count}
      </span>
    </button>
  )
}

interface SubmissionRowProps {
  review: ReviewRequest
  hideReviewColumns?: boolean
  onPreviewDocument: () => void
  onViewFlow: () => void
}

function SubmissionRow({
  review,
  hideReviewColumns = false,
  onPreviewDocument,
  onViewFlow,
}: SubmissionRowProps) {
  const rejectedReason = getRejectedDecision(review)?.reason

  return (
    <tr className="group border-b transition hover:bg-muted/30">
      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {formatUpdatedAt(review.createdAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <OperationBadge operation={review.operation} />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onPreviewDocument}
          className="flex max-w-sm items-center gap-2 text-left transition hover:text-brand-600 dark:hover:text-brand-400"
        >
          <FileIcon ext={review.documentExt} className="size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-foreground">{review.documentName}</div>
            {review.fileSizeBytes && (
              <div className="text-xs text-muted-foreground">
                {formatSizeBytes(review.fileSizeBytes)}
              </div>
            )}
          </div>
        </button>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <div className="max-w-xs truncate" title={review.changeDescription}>
          {review.changeDescription}
        </div>
      </td>
      {!hideReviewColumns && (
        <>
          <td className="whitespace-nowrap px-4 py-3">
            <SubmissionStatusBadge status={review.status} />
            {review.status === "rejected" && rejectedReason && (
              <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                {rejectedReason}
              </div>
            )}
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-center">
              <Button size="sm" variant="outline" onClick={onViewFlow}>
                <GitBranch className="mr-1 size-3.5" />
                查看审批流
              </Button>
            </div>
          </td>
        </>
      )}
    </tr>
  )
}
