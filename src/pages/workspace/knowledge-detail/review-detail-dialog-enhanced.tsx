import * as diff from "diff"
import { Check, X, AlertCircle, FileText, User, Calendar, Package } from "lucide-react"
import type { ReviewRequest } from "@/mocks/reviews"
import { DOCUMENT_CONTENTS } from "@/mocks/document-contents"
import { formatUpdatedAt, formatSizeBytes } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog-enhanced"
import { Button } from "@/components/ui/button"
import { OperationBadge } from "./operation-badge"

interface ReviewDetailDialogProps {
  review: ReviewRequest
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 不传则为只读模式（审核记录查看），不显示通过/驳回按钮 */
  onApprove?: () => void
  onReject?: () => void
}

export function ReviewDetailDialogEnhanced({
  review,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ReviewDetailDialogProps) {
  const readOnly = !onApprove && !onReject

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-500/20">
              <FileText className="size-5" />
            </div>
            <span>审核详情</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-auto">
          {/* Enhanced Info Card */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-muted/30 via-muted/20 to-transparent shadow-sm">
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <InfoItem
                icon={User}
                label="提交人"
                value={`${review.submitter.name}(${review.submitter.idNo})`}
              />
              <InfoItem
                icon={Calendar}
                label="提交时间"
                value={formatUpdatedAt(review.createdAt)}
              />
              <InfoItem
                icon={Package}
                label="操作类型"
                value={<OperationBadge operation={review.operation} />}
              />
              <InfoItem
                icon={FileText}
                label="文档名称"
                value={review.documentName}
                valueClassName="font-semibold"
              />
              {review.fileSizeBytes && (
                <InfoItem
                  icon={Package}
                  label="文件大小"
                  value={formatSizeBytes(review.fileSizeBytes)}
                />
              )}
            </div>

            <div className="border-t border-border/30 bg-muted/20 p-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertCircle className="size-4" />
                变更说明
              </div>
              <div className="text-sm leading-relaxed text-foreground">
                {review.changeDescription}
              </div>
            </div>
          </div>

          {/* Enhanced Content Compare */}
          {review.operation === "update" && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                <div className="size-1.5 rounded-full bg-brand-500" />
                内容对比
              </h3>
              <ContentCompareEnhanced review={review} />
            </div>
          )}

          {/* Enhanced Review Result */}
          {readOnly && review.review && (
            <div
              className={cn(
                "overflow-hidden rounded-2xl border shadow-sm",
                review.review.result === "approved"
                  ? "border-green-300/50 bg-gradient-to-br from-green-50/80 to-emerald-50/50 dark:border-green-800/30 dark:from-green-950/30 dark:to-emerald-950/20"
                  : "border-red-300/50 bg-gradient-to-br from-red-50/80 to-rose-50/50 dark:border-red-800/30 dark:from-red-950/30 dark:to-rose-950/20",
              )}
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl shadow-sm",
                      review.review.result === "approved"
                        ? "bg-green-600 text-white dark:bg-green-500"
                        : "bg-red-600 text-white dark:bg-red-500",
                    )}
                  >
                    {review.review.result === "approved" ? (
                      <Check className="size-5" />
                    ) : (
                      <X className="size-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base font-semibold">
                        {review.review.result === "approved" ? "审核通过" : "审核驳回"}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {review.review.reviewerName} · {formatUpdatedAt(review.review.reviewedAt)}
                    </div>
                  </div>
                </div>
                {review.appliedVersion != null && (
                  <div className="rounded-lg bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                    版本 v{review.appliedVersion}
                  </div>
                )}
              </div>
              {review.review.reason && (
                <div className="border-t border-border/30 bg-background/30 p-5">
                  <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                    驳回原因
                  </div>
                  <div className="text-sm leading-relaxed">
                    {review.review.reason}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {readOnly ? (
            <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
              关闭
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
                取消
              </Button>
              <Button variant="destructive" onClick={onReject} size="lg">
                <X className="mr-2 size-4" />
                驳回
              </Button>
              <Button onClick={onApprove} size="lg">
                <Check className="mr-2 size-4" />
                通过
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
  sublabel,
  valueClassName,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  sublabel?: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100/50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {label}
        </div>
        <div className={cn("text-sm text-foreground", valueClassName)}>
          {value}
        </div>
        {sublabel && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}

function ContentCompareEnhanced({ review }: { review: ReviewRequest }) {
  const oldContent = DOCUMENT_CONTENTS[`${review.documentId}-old`] ?? ""
  const newContent =
    DOCUMENT_CONTENTS[`${review.id}-new`] ??
    DOCUMENT_CONTENTS[`${review.documentId}-new`] ??
    ""

  const hasBoth = oldContent && newContent
  const changes = hasBoth ? diff.diffLines(oldContent, newContent) : []

  let addedLines = 0
  let removedLines = 0
  changes.forEach((part) => {
    if (part.added) addedLines += part.count ?? 0
    if (part.removed) removedLines += part.count ?? 0
  })

  const renderPane = (
    content: string,
    highlights: typeof changes,
    type: "old" | "new",
  ) => {
    if (!content)
      return <EmptyPane text={type === "old" ? "原始内容不可用" : "变更内容不可用"} />

    if (review.operation === "add" && type === "old")
      return <EmptyPane text="新增文档，无原始内容" />
    if (review.operation === "delete" && type === "new")
      return <EmptyPane text="删除后该文档不再存在" />

    if (review.operation !== "update") {
      return (
        <pre className="whitespace-pre-wrap p-4 font-mono text-xs leading-loose text-foreground">
          {content}
        </pre>
      )
    }

    return (
      <pre className="whitespace-pre-wrap p-4 font-mono text-xs leading-loose">
        {highlights
          .filter((p) => (type === "old" ? !p.added : !p.removed))
          .map((part, i) => (
            <span
              key={i}
              className={cn(
                type === "old" &&
                  part.removed &&
                  "bg-red-100/80 text-red-900 dark:bg-red-950/60 dark:text-red-200",
                type === "new" &&
                  part.added &&
                  "bg-green-100/80 text-green-900 dark:bg-green-950/60 dark:text-green-200",
              )}
            >
              {part.value}
            </span>
          ))}
      </pre>
    )
  }

  return (
    <div className="space-y-3">
      {review.operation === "update" && hasBoth && (
        <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-muted/30 px-4 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
            <span className="size-2 rounded-full bg-green-500" />
            +{addedLines} 行
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
            <span className="size-2 rounded-full bg-red-500" />
            -{removedLines} 行
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <DiffPane
          title="原文档"
          color="red"
          content={renderPane(oldContent, changes, "old")}
        />
        <DiffPane
          title="变更后"
          color="green"
          content={renderPane(newContent, changes, "new")}
        />
      </div>
    </div>
  )
}

function DiffPane({
  title,
  color,
  content,
}: {
  title: string
  color: "red" | "green"
  content: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm">
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border/30 px-4 py-2.5",
          color === "red" && "bg-red-50/50 dark:bg-red-950/20",
          color === "green" && "bg-green-50/50 dark:bg-green-950/20",
        )}
      >
        <div
          className={cn(
            "size-2 rounded-full",
            color === "red" && "bg-red-500",
            color === "green" && "bg-green-500",
          )}
        />
        <span className="text-xs font-semibold text-foreground">{title}</span>
      </div>
      <div className="max-h-[500px] overflow-auto bg-card">{content}</div>
    </div>
  )
}

function EmptyPane({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
