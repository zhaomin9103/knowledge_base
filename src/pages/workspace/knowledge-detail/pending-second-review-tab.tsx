import { useMemo, useState } from "react"
import { Check, Clock, X } from "lucide-react"
import {
  REVIEW_REQUESTS,
  applyDecision,
  type ReviewRequest,
} from "@/mocks/reviews"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"
import { useAuth } from "@/hooks/use-auth"
import { formatUpdatedAt, formatSizeBytes } from "@/lib/format"
import { FileIcon } from "@/lib/file-icon"
import { Button } from "@/components/ui/button"
import { OperationBadge } from "./operation-badge"
import { ReviewDetailDialog } from "./review-detail-dialog"
import { RejectReasonDialog } from "./reject-reason-dialog"
import { DocumentPreviewDialog } from "./document-preview-dialog"

interface PendingSecondReviewTabProps {
  kbId: string
}

export function PendingSecondReviewTab({ kbId }: PendingSecondReviewTabProps) {
  const { currentUser } = useAuth()

  const [reviews, setReviews] = useState<ReviewRequest[]>(() =>
    REVIEW_REQUESTS.filter(
      (r) => r.kbId === kbId && r.status === "pending_second",
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

  // 复审通过
  const handleApprove = (review: ReviewRequest) => {
    const updated = applyDecision(
      review,
      "second",
      buildDecision("approved"),
      nextVersion,
    )
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setDetailReview(null)
    alert(`复审通过，已生效（版本 v${updated.appliedVersion}）：${review.documentName}`)
  }

  // 复审驳回
  const handleReject = (review: ReviewRequest, reason: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setRejectTarget(null)
    setDetailReview(null)
    alert(`已复审驳回：${review.documentName}\n原因：${reason}`)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {reviews.length} 条待复审
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border bg-card">
          <div className="text-center text-muted-foreground">
            <Clock className="mx-auto mb-2 size-12 opacity-20" />
            <p>暂无待复审记录</p>
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
                  初审信息
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b transition hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {review.submitter.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {review.submitter.idNo}
                      </p>
                    </div>
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
                      onClick={() => setPreviewReview(review)}
                      className="flex items-center gap-2 text-left transition hover:text-brand-600"
                    >
                      <FileIcon
                        ext={review.documentExt}
                        className="size-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{review.documentName}</p>
                        {review.fileSizeBytes && (
                          <p className="text-xs text-muted-foreground">
                            {formatSizeBytes(review.fileSizeBytes)}
                          </p>
                        )}
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p className="line-clamp-2">{review.changeDescription}</p>
                  </td>
                  <td className="px-4 py-3">
                    {review.firstReview ? (
                      <div className="text-xs">
                        <p className="font-medium text-foreground">
                          {review.firstReview.reviewerName}
                        </p>
                        <p className="text-muted-foreground">
                          {formatUpdatedAt(review.firstReview.reviewedAt)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        初审人提交，免初审
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setDetailReview(review)}
                      >
                        处理
                      </Button>
                    </div>
                  </td>
                </tr>
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
          customActions={
            <>
              <Button
                variant="outline"
                onClick={() => setDetailReview(null)}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectTarget(detailReview)}
              >
                <X className="size-4 mr-1" />
                驳回
              </Button>
              <Button
                variant="default"
                onClick={() => handleApprove(detailReview)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="size-4 mr-1" />
                通过
              </Button>
            </>
          }
        />
      )}

      {/* 驳回原因弹窗 */}
      {rejectTarget && (
        <RejectReasonDialog
          documentName={rejectTarget.documentName}
          open={!!rejectTarget}
          onOpenChange={(open) => !open && setRejectTarget(null)}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
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
    </div>
  )
}
