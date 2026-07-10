import * as diff from "diff"
import { Check, X, AlertCircle, FileText, Clock } from "lucide-react"
import type { ReviewRequest, ReviewDecision, ReviewStage } from "@/mocks/reviews"
import { DOCUMENT_CONTENTS } from "@/mocks/document-contents"
import { formatUpdatedAt, formatSizeBytes } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { OperationBadge } from "./operation-badge"
import { ApprovalTimeline } from "./approval-timeline"

interface ReviewDetailDialogProps {
  review: ReviewRequest
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 不传则为只读模式（审核记录查看），不显示通过/驳回按钮 */
  onApprove?: () => void
  onReject?: () => void
  /** 自定义底部按钮（用于初审三按钮场景） */
  customActions?: React.ReactNode
}

export function ReviewDetailDialog({
  review,
  open,
  onOpenChange,
  onApprove,
  onReject,
  customActions,
}: ReviewDetailDialogProps) {
  // 只读模式：没有传入审核回调（用于审核记录查看）
  const readOnly = !onApprove && !onReject && !customActions
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            审核详情
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-auto">
          {/* 基本信息 */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">提交人：</span>
                <span className="font-medium">{review.submitter.name}({review.submitter.idNo})</span>
              </div>
              <div>
                <span className="text-muted-foreground">提交时间：</span>
                <span>{formatUpdatedAt(review.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">操作类型：</span>
                <OperationBadge operation={review.operation} />
              </div>
              <div>
                <span className="text-muted-foreground">文档名称：</span>
                <span className="font-medium">{review.documentName}</span>
              </div>
              {review.fileSizeBytes && (
                <div>
                  <span className="text-muted-foreground">文件大小：</span>
                  <span>{formatSizeBytes(review.fileSizeBytes)}</span>
                </div>
              )}
            </div>
            <div className="mt-3 border-t pt-3">
              <div className="mb-1 text-sm text-muted-foreground">
                变更说明：
              </div>
              <div className="text-sm">{review.changeDescription}</div>
            </div>
          </div>

          {/* 内容对比 - 仅更新操作显示 */}
          {review.operation === "update" && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="size-4" />
                内容对比
              </h3>
              <ContentCompare review={review} />
            </div>
          )}

          {/* 只读模式：展示两级审核意见 */}
          {readOnly && (review.firstReview || review.secondReview || review.skipFirstReview) && (
            <div className="space-y-3">
              {review.skipFirstReview ? (
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  提交人具备初审权限，本提交自动免初审，直接进入复审。
                </div>
              ) : (
                <ReviewDecisionBlock stage="first" decision={review.firstReview} />
              )}
              {(review.secondReview || review.status === "pending_second") && (
                <ReviewDecisionBlock
                  stage="second"
                  decision={review.secondReview}
                  appliedVersion={review.appliedVersion}
                />
              )}
            </div>
          )}

          {/* 审批流时间线（弹窗底部展示，只读与操作模式均显示，已完成节点含操作人姓名+工号） */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Clock className="size-4" />
              审批流
            </h3>
            <ApprovalTimeline review={review} />
          </div>
        </div>

        <DialogFooter>
          {readOnly ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          ) : customActions ? (
            // 自定义按钮（用于初审三按钮场景）
            customActions
          ) : (
            // 默认两按钮（复审场景）
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={onReject}>
                <X className="mr-1 size-4" />
                驳回
              </Button>
              <Button onClick={onApprove}>
                <Check className="mr-1 size-4" />
                通过
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 左右两列内容对比 */
function ContentCompare({ review }: { review: ReviewRequest }) {
  const oldContent =
    DOCUMENT_CONTENTS[`${review.documentId}-old`] ?? ""
  // 新增用 rr-xxx-new，更新用 docId-new
  const newContent =
    DOCUMENT_CONTENTS[`${review.id}-new`] ??
    DOCUMENT_CONTENTS[`${review.documentId}-new`] ??
    ""

  // 计算行级 diff（用于高亮）
  const hasBoth = oldContent && newContent
  const changes = hasBoth ? diff.diffLines(oldContent, newContent) : []

  let addedLines = 0
  let removedLines = 0
  changes.forEach((part) => {
    if (part.added) addedLines += part.count ?? 0
    if (part.removed) removedLines += part.count ?? 0
  })

  // 左列：原文档（标记删除行）；右列：新文档（标记新增行）
  const renderLeft = () => {
    if (review.operation === "add") {
      return (
        <EmptyPane text="新增文档，无原始内容" />
      )
    }
    if (!oldContent) return <EmptyPane text="原始内容不可用" />

    if (review.operation === "delete") {
      return (
        <pre className="whitespace-pre-wrap p-3 text-xs font-mono leading-relaxed text-foreground">
          {oldContent}
        </pre>
      )
    }

    // update：高亮被删除/修改的行
    return (
      <pre className="whitespace-pre-wrap p-3 text-xs font-mono leading-relaxed">
        {changes
          .filter((p) => !p.added)
          .map((part, i) => (
            <span
              key={i}
              className={cn(
                part.removed &&
                  "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200",
              )}
            >
              {part.value}
            </span>
          ))}
      </pre>
    )
  }

  const renderRight = () => {
    if (review.operation === "delete") {
      return <EmptyPane text="删除后该文档不再存在" />
    }
    if (!newContent) return <EmptyPane text="变更内容不可用" />

    if (review.operation === "add") {
      return (
        <pre className="whitespace-pre-wrap p-3 text-xs font-mono leading-relaxed text-foreground">
          {newContent}
        </pre>
      )
    }

    // update：高亮新增的行
    return (
      <pre className="whitespace-pre-wrap p-3 text-xs font-mono leading-relaxed">
        {changes
          .filter((p) => !p.removed)
          .map((part, i) => (
            <span
              key={i}
              className={cn(
                part.added &&
                  "bg-green-100 text-green-900 dark:bg-green-950/60 dark:text-green-200",
              )}
            >
              {part.value}
            </span>
          ))}
      </pre>
    )
  }

  return (
    <div className="space-y-2">
      {review.operation === "update" && hasBoth && (
        <div className="flex items-center gap-3 text-xs">
          <span className="text-green-600 dark:text-green-400">
            +{addedLines} 行
          </span>
          <span className="text-red-600 dark:text-red-400">
            -{removedLines} 行
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {/* 左列：原文档 */}
        <div className="overflow-hidden rounded-lg border">
          <div className="border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            原文档
          </div>
          <div className="max-h-96 overflow-auto bg-card">{renderLeft()}</div>
        </div>
        {/* 右列：变更后 */}
        <div className="overflow-hidden rounded-lg border">
          <div className="border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            变更后
          </div>
          <div className="max-h-96 overflow-auto bg-card">{renderRight()}</div>
        </div>
      </div>
    </div>
  )
}

function EmptyPane({ text }: { text: string }) {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

/** 单个审核环节的意见块（初审 / 复审） */
function ReviewDecisionBlock({
  stage,
  decision,
  appliedVersion,
}: {
  stage: ReviewStage
  decision?: ReviewDecision
  appliedVersion?: number
}) {
  const stageLabel = stage === "first" ? "初审" : "复审"

  // 尚未进入该环节
  if (!decision) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        <Clock className="size-4" />
        {stageLabel}：待处理
      </div>
    )
  }

  const approved = decision.result === "approved"
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        approved
          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
          : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">{stageLabel}</span>
        <span className="text-muted-foreground">·</span>
        {approved ? (
          <span className="inline-flex items-center gap-1 font-medium text-green-700 dark:text-green-400">
            <Check className="size-4" /> 通过
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-medium text-red-700 dark:text-red-400">
            <X className="size-4" /> 驳回
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {decision.reviewerName}
          {decision.reviewerIdNo && `(${decision.reviewerIdNo})`} ·{" "}
          {formatUpdatedAt(decision.reviewedAt)}
        </span>
      </div>
      {decision.reason && (
        <div className="mt-2 border-t pt-2 text-sm">
          <span className="text-muted-foreground">驳回原因：</span>
          {decision.reason}
        </div>
      )}
      {stage === "second" && approved && appliedVersion != null && (
        <div className="mt-2 border-t pt-2 text-sm text-muted-foreground">
          生效版本：v{appliedVersion}
        </div>
      )}
    </div>
  )
}
