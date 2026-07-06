import { useState } from "react"
import { Check, Clock, FileText, X, User, Calendar, Package, Sparkles } from "lucide-react"
import { REVIEW_REQUESTS, type ReviewRequest } from "@/mocks/reviews"
import { formatUpdatedAt, formatSizeBytes } from "@/lib/format"
import { getFileIcon, getFileIconColor } from "@/lib/file-icon"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OperationBadge } from "./operation-badge"
import { ReviewDetailDialogEnhanced } from "./review-detail-dialog-enhanced"
import { RejectReasonDialog } from "./reject-reason-dialog"
import { DocumentPreviewDialog } from "./document-preview-dialog"
import { PageNotesDrawer } from "./page-notes-drawer"

interface PendingReviewTabProps {
  kbId: string
}

const PENDING_REVIEW_NOTES = `【页面定位】
管理员 / 创建者的待审核工作台，集中处理维护人员提交的文档变更申请。

【数据范围】
仅展示当前知识库中状态为「待审核」的提交记录。审核通过或驳回后,该记录立即从本列表移除，并流转到「审核记录」中。

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

export function PendingReviewTabEnhanced({ kbId }: PendingReviewTabProps) {
  const [reviews, setReviews] = useState<ReviewRequest[]>(() =>
    REVIEW_REQUESTS.filter(
      (r) =>
        r.kbId === kbId &&
        (r.status === "pending_first" || r.status === "pending_second"),
    ),
  )
  const [detailReview, setDetailReview] = useState<ReviewRequest | null>(null)
  const [previewReview, setPreviewReview] = useState<ReviewRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ReviewRequest | null>(null)

  const handleApprove = (review: ReviewRequest) => {
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setDetailReview(null)
  }

  const handleReject = (review: ReviewRequest, reason: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== review.id))
    setRejectTarget(null)
    setDetailReview(null)
    alert(`已驳回：${review.documentName}\n原因：${reason}`)
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20">
            <Clock className="size-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground">
              待审核列表
            </h2>
            <p className="text-sm text-muted-foreground">
              共 <span className="font-semibold text-foreground">{reviews.length}</span> 条待处理
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      {reviews.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30">
          <div className="text-center">
            <Clock className="mx-auto mb-3 size-16 text-muted-foreground/15" />
            <p className="font-serif text-lg font-semibold text-muted-foreground">
              暂无待审核记录
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              所有提交都已处理完成
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="grid gap-4 pb-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onViewDetail={() => setDetailReview(review)}
                onPreviewDocument={() => setPreviewReview(review)}
                onApprove={() => handleApprove(review)}
                onReject={() => setRejectTarget(review)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {detailReview && (
        <ReviewDetailDialogEnhanced
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

interface ReviewCardProps {
  review: ReviewRequest
  onViewDetail: () => void
  onPreviewDocument: () => void
  onApprove: () => void
  onReject: () => void
}

function ReviewCard({
  review,
  onViewDetail,
  onPreviewDocument,
  onApprove,
  onReject,
}: ReviewCardProps) {
  const Icon = getFileIcon(review.documentExt)
  const iconColor = getFileIconColor(review.documentExt)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-sm transition-all duration-300 hover:border-amber-300/40 hover:shadow-lg hover:shadow-amber-500/5">
      {/* Decorative gradient accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Left: File Icon + Document Info */}
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {/* File Icon */}
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm ring-1 ring-border/30 transition-transform duration-300 group-hover:scale-105">
              <Icon className={cn("size-7 transition-transform duration-300 group-hover:scale-110", iconColor)} />
            </div>

            {/* Document & Submitter Info */}
            <div className="min-w-0 flex-1 space-y-3">
              {/* Document Name - Clickable */}
              <button
                type="button"
                onClick={onPreviewDocument}
                className="block w-full text-left transition-colors"
              >
                <h3 className="truncate font-serif text-base font-semibold text-foreground transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  {review.documentName}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Package className="size-3" />
                    {review.fileSizeBytes ? formatSizeBytes(review.fileSizeBytes) : "未知大小"}
                  </span>
                  <span>•</span>
                  <span className="uppercase">{review.documentExt}</span>
                </div>
              </button>

              {/* Meta Info Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Submitter */}
                <div className="flex items-start gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-100/50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400">
                    <User className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      提交人
                    </div>
                    <div className="truncate text-sm font-semibold text-foreground">
                      {review.submitter.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {review.submitter.idNo}
                    </div>
                  </div>
                </div>

                {/* Submit Time */}
                <div className="flex items-start gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100/50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                    <Calendar className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      提交时间
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {formatUpdatedAt(review.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Operation Type */}
                <div className="flex items-start gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-100/50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      操作类型
                    </div>
                    <div className="mt-1">
                      <OperationBadge operation={review.operation} />
                    </div>
                  </div>
                </div>

                {/* Change Description */}
                <div className="flex items-start gap-2 sm:col-span-1">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-100/50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      变更说明
                    </div>
                    <div className="line-clamp-2 text-sm text-foreground">
                      {review.changeDescription}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex shrink-0 flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onViewDetail}
              className="w-24 shadow-sm"
            >
              <FileText className="mr-1.5 size-3.5" />
              详情
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              className="w-24 bg-gradient-to-r from-green-600 to-emerald-600 shadow-md shadow-green-500/20 transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/30"
            >
              <Check className="mr-1.5 size-3.5" />
              通过
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onReject}
              className="w-24 shadow-md shadow-red-500/20 transition-all hover:shadow-lg hover:shadow-red-500/30"
            >
              <X className="mr-1.5 size-3.5" />
              驳回
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
