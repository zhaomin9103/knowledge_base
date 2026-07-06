import { useMemo, useState } from "react"
import { Check, Clock, FileText, X } from "lucide-react"
import {
  REVIEW_REQUESTS,
  applyDecision,
  pendingStage,
  type ReviewRequest,
  type ReviewStage,
} from "@/mocks/reviews"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"
import { useAuth } from "@/hooks/use-auth"
import { useKBRole } from "@/hooks/use-kb-role"
import { formatUpdatedAt, formatSizeBytes } from "@/lib/format"
import { getFileIcon, getFileIconColor } from "@/lib/file-icon"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OperationBadge } from "./operation-badge"
import { ReviewDetailDialog } from "./review-detail-dialog"
import { RejectReasonDialog } from "./reject-reason-dialog"
import { DocumentPreviewDialog } from "./document-preview-dialog"
import { PageNotesDrawer } from "./page-notes-drawer"

interface PendingReviewTabProps {
  kbId: string
}

const PENDING_REVIEW_NOTES = `【页面定位】
初审人 / 复审人 / 创建者的待审核工作台，集中处理需要本人审核的文档变更申请。

【多级审核机制】
维护人员提交的增 / 删 / 改，需依次经过「初审 → 复审」两级：
· 初审人先审 → 通过后进入待复审；
· 复审人再审 → 通过后操作才正式生效并生成新版本。
· 任一级驳回，流程即终止，记录进入「审核记录」，提交人可在「我的提交」看到驳回原因。
· 若提交人本身具备初审及以上权限，其提交自动免初审，直接进入待复审。

【数据范围】
· 初审人：仅看到「待初审」且需自己初审的记录。
· 复审人：仅看到「待复审」的记录。
· 创建者：两级都可审，看到全部待审记录。
· 审核（通过 / 驳回）后，该记录立即从本列表移除并流转到下一环节或「审核记录」。

【列表字段】
· 提交人 / 提交时间 / 操作类型 / 文档名称 / 变更说明 / 当前环节
· 操作：详情 / 通过 / 驳回

【交互逻辑】
1. 点击「文档名称」→ 文档预览。
2. 点击「详情」→ 审核详情弹窗（含内容对比、已完成环节的意见），可在弹窗内通过 / 驳回。
3. 点击「通过」：
   · 初审通过 → 记录进入「待复审」；
   · 复审通过 → 生成知识库新版本（版本号 +1），操作正式生效。
4. 点击「驳回」→ 填写驳回原因（必填）后确认，流程终止。

【操作逻辑 / 权限】
· 仅具备审核权限（初审 / 复审 / 创建者）可见本 Tab。
· 维护人员无审核权限，其提交进度在「我的提交」中查看。

【备注】
本说明用于记录页面预期逻辑，可手动编辑后保存（保存在本地浏览器）。`

export function PendingReviewTab({ kbId }: PendingReviewTabProps) {
  const { currentUser } = useAuth()
  const { canFirstReview, canSecondReview } = useKBRole(kbId)

  // 仅保留当前用户「有权处理」的待审记录
  const canHandle = (r: ReviewRequest): boolean => {
    const stage = pendingStage(r)
    if (stage === "first") return canFirstReview
    if (stage === "second") return canSecondReview
    return false
  }

  const [reviews, setReviews] = useState<ReviewRequest[]>(() =>
    REVIEW_REQUESTS.filter(
      (r) =>
        r.kbId === kbId &&
        (r.status === "pending_first" || r.status === "pending_second") &&
        canHandle(r),
    ),
  )
  const [detailReview, setDetailReview] = useState<ReviewRequest | null>(null)
  const [previewReview, setPreviewReview] = useState<ReviewRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ReviewRequest | null>(null)

  const nextVersion = useMemo(() => {
    const kb = KNOWLEDGE_BASES.find((k) => k.id === kbId)
    return (kb?.currentVersion ?? 0) + 1
  }, [kbId])

  const buildDecision = (result: "approved" | "rejected", reason?: string) => ({
    reviewerId: currentUser.id,
    reviewerName: currentUser.name,
    reviewerIdNo: currentUser.idNo,
    result,
    reason,
    reviewedAt: new Date().toISOString(),
  })

  const stageLabel = (stage: ReviewStage) =>
    stage === "first" ? "初审" : "复审"

  const handleApprove = (review: ReviewRequest) => {
    const stage = pendingStage(review)
    if (!stage) return
    const updated = applyDecision(
      review,
      stage,
      buildDecision("approved"),
      stage === "second" ? nextVersion : undefined,
    )
    // 演示：处理后从本人待办列表移除（初审通过会流转到复审人处）
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setDetailReview(null)
    const hint =
      stage === "first"
        ? "初审通过，已流转至复审环节"
        : `复审通过，已生效（版本 v${updated.appliedVersion}）`
    alert(`${hint}：${review.documentName}`)
  }

  const handleReject = (review: ReviewRequest, reason: string) => {
    const stage = pendingStage(review)
    if (!stage) return
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setRejectTarget(null)
    setDetailReview(null)
    alert(`已${stageLabel(stage)}驳回：${review.documentName}\n原因：${reason}`)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {reviews.length} 条待审核
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border bg-card">
          <div className="text-center text-muted-foreground">
            <Clock className="mx-auto mb-2 size-12 opacity-20" />
            <p>暂无待审核记录</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-lg border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  提交人
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  提交时间
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  操作类型
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  文档名称
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  变更说明
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  当前环节
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  onViewDetail={() => setDetailReview(review)}
                  onPreviewDocument={() => setPreviewReview(review)}
                  onApprove={() => handleApprove(review)}
                  onReject={() => setRejectTarget(review)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 详情弹窗 */}
      {detailReview && (
        <ReviewDetailDialog
          review={detailReview}
          open={!!detailReview}
          onOpenChange={(open) => !open && setDetailReview(null)}
          onApprove={() => handleApprove(detailReview)}
          onReject={() => setRejectTarget(detailReview)}
        />
      )}

      {/* 文档预览弹窗 */}
      {previewReview && (
        <DocumentPreviewDialog
          review={previewReview}
          open={!!previewReview}
          onOpenChange={(open) => !open && setPreviewReview(null)}
        />
      )}

      {/* 驳回原因弹窗 */}
      {rejectTarget && (
        <RejectReasonDialog
          open={!!rejectTarget}
          onOpenChange={(open) => !open && setRejectTarget(null)}
          documentName={rejectTarget.documentName}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
        />
      )}

      {/* 页面备注抽屉 */}
      <PageNotesDrawer
        noteKey={`pending-review:${kbId}`}
        title="待审核 · 页面备注"
        defaultContent={PENDING_REVIEW_NOTES}
      />
    </div>
  )
}

interface ReviewRowProps {
  review: ReviewRequest
  onViewDetail: () => void
  onPreviewDocument: () => void
  onApprove: () => void
  onReject: () => void
}

function ReviewRow({
  review,
  onViewDetail,
  onPreviewDocument,
  onApprove,
  onReject,
}: ReviewRowProps) {
  const Icon = getFileIcon(review.documentExt)
  const iconColor = getFileIconColor(review.documentExt)
  const stage = pendingStage(review)

  return (
    <tr className="group border-b transition hover:bg-muted/30">
      <td className="px-4 py-3">
        <span className="font-medium text-foreground">
          {review.submitter.name}({review.submitter.idNo})
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {formatUpdatedAt(review.createdAt)}
      </td>
      <td className="px-4 py-3">
        <OperationBadge operation={review.operation} />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onPreviewDocument}
          className="flex items-center gap-2 text-left transition hover:text-brand-600 dark:hover:text-brand-400"
        >
          <Icon className={cn("size-4 shrink-0", iconColor)} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-foreground">
              {review.documentName}
            </div>
            {review.fileSizeBytes && (
              <div className="text-xs text-muted-foreground">
                {formatSizeBytes(review.fileSizeBytes)}
              </div>
            )}
          </div>
        </button>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <div className="max-w-xs truncate">{review.changeDescription}</div>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
            stage === "first"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
              : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
          )}
        >
          {stage === "first" ? "待初审" : "待复审"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={onViewDetail}>
            <FileText className="mr-1 size-3.5" />
            详情
          </Button>
          <Button size="sm" onClick={onApprove}>
            <Check className="mr-1 size-3.5" />
            {stage === "first" ? "初审通过" : "复审通过"}
          </Button>
          <Button size="sm" variant="destructive" onClick={onReject}>
            <X className="mr-1 size-3.5" />
            驳回
          </Button>
        </div>
      </td>
    </tr>
  )
}
