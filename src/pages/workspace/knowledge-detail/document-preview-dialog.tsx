import { FileText } from "lucide-react"
import type { ReviewRequest } from "@/mocks/reviews"
import { DOCUMENT_CONTENTS } from "@/mocks/document-contents"
import { formatSizeBytes } from "@/lib/format"
import { FileIcon } from "@/lib/file-icon"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DocumentPreviewDialogProps {
  review: ReviewRequest
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** 根据操作类型解析要预览的文档内容 */
function resolvePreviewContent(review: ReviewRequest): string {
  if (review.operation === "add") {
    return DOCUMENT_CONTENTS[`${review.id}-new`] ?? ""
  }
  if (review.operation === "delete") {
    return DOCUMENT_CONTENTS[`${review.documentId}-old`] ?? ""
  }
  // update：预览变更后的内容
  return (
    DOCUMENT_CONTENTS[`${review.documentId}-new`] ??
    DOCUMENT_CONTENTS[`${review.documentId}-old`] ??
    ""
  )
}

export function DocumentPreviewDialog({
  review,
  open,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  const content = resolvePreviewContent(review)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileIcon ext={review.documentExt} className="size-5" />
            <span className="truncate">{review.documentName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="uppercase">{review.documentExt}</span>
          {review.fileSizeBytes && (
            <span>{formatSizeBytes(review.fileSizeBytes)}</span>
          )}
        </div>

        <div className="flex-1 overflow-auto rounded-lg border bg-card">
          {content ? (
            <pre className="whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-foreground">
              {content}
            </pre>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
              <FileText className="mb-2 size-10 opacity-20" />
              <p className="text-sm">文档内容预览暂不可用</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
