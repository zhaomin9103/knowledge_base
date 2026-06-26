import { useState } from "react"
import { Check, Clock, FileText, X } from "lucide-react"
import { REVIEW_REQUESTS, type ReviewRequest } from "@/mocks/reviews"
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
管理员 / 创建者的待审核工作台，集中处理维护人员提交的文档变更申请。

【数据范围】
仅展示当前知识库中状态为「待审核」的提交记录。审核通过或驳回后，该记录立即从本列表移除，并流转到「审核记录」中。

【列表字段】
· 提交人：姓名 + 所属组织
· 提交时间：提交申请的时间
· 操作类型：新增 / 更新 / 删除（标签形式，颜色与详情弹窗一致）
· 文档名称：文件图标 + 名称 + 大小，点击打开「文档预览弹窗」
· 变更说明：提交人填写的变更描述
· 操作：详情 / 通过 / 驳回

【交互逻辑】
1. 点击「文档名称」→ 弹出文档预览：
   · 新增 → 预览新增的文档内容
   · 删除 → 预览待删除的原文档内容
   · 更新 → 预览变更后的文档内容
2. 点击「详情」→ 弹出审核详情弹窗：
   · 更新操作：左右两栏对比（左=原文档，右=变更后），并标注 +N/-M 行变化
   · 新增 / 删除操作：不做内容对比，仅展示单侧内容
   · 弹窗内同样可执行「通过 / 驳回」
3. 点击「通过」→ 审核通过：
   · 该提交从待审核列表移除
   · 生成知识库新版本（版本号 +1，记入「版本记录」）
   · 写入一条审核操作日志（记入「操作记录」）
4. 点击「驳回」→ 先弹出「驳回原因」弹窗：
   · 驳回原因为必填，未填写不可提交
   · 确认后该提交移除，状态变更为已驳回，原因随记录留存

【操作逻辑 / 权限】
· 仅 canReview（管理员、创建者）可见本 Tab 及操作按钮
· 维护人员无审核权限，其提交进度在「我的提交」中查看
· 审核为单级审核：一名管理员通过 / 驳回即终态

【备注】
本说明用于记录页面预期逻辑，可手动编辑后保存（保存在本地浏览器）。`

export function PendingReviewTab({ kbId }: PendingReviewTabProps) {
  const [reviews, setReviews] = useState<ReviewRequest[]>(() =>
    REVIEW_REQUESTS.filter((r) => r.kbId === kbId && r.status === "pending"),
  )
  const [detailReview, setDetailReview] = useState<ReviewRequest | null>(null)
  const [previewReview, setPreviewReview] = useState<ReviewRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ReviewRequest | null>(null)

  const handleApprove = (review: ReviewRequest) => {
    // 演示：通过后从待审核列表移除
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setDetailReview(null)
  }

  const handleReject = (review: ReviewRequest, reason: string) => {
    // 演示：驳回后从待审核列表移除
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setRejectTarget(null)
    setDetailReview(null)
    alert(`已驳回：${review.documentName}\n原因：${reason}`)
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
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={onViewDetail}>
            <FileText className="mr-1 size-3.5" />
            详情
          </Button>
          <Button size="sm" onClick={onApprove}>
            <Check className="mr-1 size-3.5" />
            通过
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
