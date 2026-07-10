import { useMemo, useState } from "react"
import { Check, Clock, X } from "lucide-react"
import {
  REVIEW_REQUESTS,
  applyFirstApprovalFinal,
  applyFirstApprovalForward,
  type ReviewRequest,
} from "@/mocks/reviews"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"
import { useAuth } from "@/hooks/use-auth"
import { formatUpdatedAt, formatSizeBytes } from "@/lib/format"
import { FileIcon } from "@/lib/file-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { OperationBadge } from "./operation-badge"
import { ReviewDetailDialog } from "./review-detail-dialog"
import { RejectReasonDialog } from "./reject-reason-dialog"
import { DocumentPreviewDialog } from "./document-preview-dialog"

interface PendingFirstReviewTabProps {
  kbId: string
}

export function PendingFirstReviewTab({ kbId }: PendingFirstReviewTabProps) {
  const { currentUser } = useAuth()

  const [reviews, setReviews] = useState<ReviewRequest[]>(() =>
    REVIEW_REQUESTS.filter(
      (r) => r.kbId === kbId && r.status === "pending_first",
    ),
  )
  const [detailReview, setDetailReview] = useState<ReviewRequest | null>(null)
  const [previewReview, setPreviewReview] = useState<ReviewRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ReviewRequest | null>(null)
  const [approvalMode, setApprovalMode] = useState<"final" | "forward" | null>(null)
  const [finalReason, setFinalReason] = useState("")

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

  // 初审通过并生效
  const handleApproveFinal = (review: ReviewRequest, reason?: string) => {
    const updated = applyFirstApprovalFinal(
      review,
      buildDecision("approved", reason),
      nextVersion,
    )
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setDetailReview(null)
    setApprovalMode(null)
    setFinalReason("")
    alert(`初审通过并生效，已生成 v${updated.appliedVersion}：${review.documentName}`)
  }

  // 初审通过并提交复审
  const handleApproveForward = (review: ReviewRequest) => {
    applyFirstApprovalForward(review, buildDecision("approved"))
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setDetailReview(null)
    alert(`初审通过，已转交复审：${review.documentName}`)
  }

  // 初审驳回
  const handleReject = (review: ReviewRequest, reason: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setRejectTarget(null)
    setDetailReview(null)
    alert(`已初审驳回：${review.documentName}\n原因：${reason}`)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {reviews.length} 条待初审
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border bg-card">
          <div className="text-center text-muted-foreground">
            <Clock className="mx-auto mb-2 size-12 opacity-20" />
            <p>暂无待初审记录</p>
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
          onOpenChange={(open) => {
            if (!open) {
              setDetailReview(null)
              setApprovalMode(null)
            }
          }}
          customActions={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setDetailReview(null)
                  setApprovalMode(null)
                }}
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
                onClick={() => handleApproveForward(detailReview)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Check className="size-4 mr-1" />
                提交复审
              </Button>
              <Button
                variant="default"
                onClick={() => setApprovalMode("final")}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="size-4 mr-1" />
                通过并生效
              </Button>
            </>
          }
        />
      )}

      {/* 初审决策弹窗（通过并生效时填写可选理由） */}
      <Dialog open={approvalMode === "final"} onOpenChange={(open) => {
        if (!open) {
          setApprovalMode(null)
          setFinalReason("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>初审通过并直接生效</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              该变更将跳过复审环节，直接生成新版本并生效。你可以选择填写不提交复审的理由（可选）。
            </p>
            <textarea
              placeholder="不提交复审的理由（可选，最多 200 字）"
              maxLength={200}
              value={finalReason}
              onChange={(e) => setFinalReason(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalMode(null)
                setFinalReason("")
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                if (detailReview) {
                  handleApproveFinal(detailReview, finalReason || undefined)
                }
              }}
            >
              确认生效
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
