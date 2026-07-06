import { FileText } from "lucide-react"
import type { ReviewRequest } from "@/mocks/reviews"
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

interface ApprovalFlowDialogProps {
  review: ReviewRequest
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApprovalFlowDialog({
  review,
  open,
  onOpenChange,
}: ApprovalFlowDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>审批流详情</DialogTitle>
        </DialogHeader>

        {/* 文档信息 */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-muted-foreground" />
            <span className="truncate font-medium">{review.documentName}</span>
            <OperationBadge operation={review.operation} />
          </div>
        </div>

        {/* 时间线 */}
        <ApprovalTimeline review={review} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
