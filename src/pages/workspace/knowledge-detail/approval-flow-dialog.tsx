import { Check, Clock, X, Send, FileText } from "lucide-react"
import type { ReviewRequest } from "@/mocks/reviews"
import { formatUpdatedAt } from "@/lib/format"
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

interface ApprovalFlowDialogProps {
  review: ReviewRequest
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TimelineNode {
  key: string
  title: string
  actor: string
  organization?: string
  timestamp: string
  state: "done" | "current" | "rejected"
  description?: string
}

function buildTimeline(review: ReviewRequest): TimelineNode[] {
  const nodes: TimelineNode[] = [
    {
      key: "submit",
      title: "提交申请",
      actor: review.submitter.name,
      organization: review.submitter.organization,
      timestamp: review.createdAt,
      state: "done",
      description: review.changeDescription,
    },
  ]

  if (review.status === "pending") {
    nodes.push({
      key: "pending",
      title: "等待审核",
      actor: "管理员",
      timestamp: "—",
      state: "current",
    })
  } else if (review.review) {
    if (review.review.result === "approved") {
      nodes.push({
        key: "approved",
        title: "审核通过",
        actor: review.review.reviewerName,
        timestamp: review.review.reviewedAt,
        state: "done",
        description:
          review.appliedVersion != null
            ? `生效版本：v${review.appliedVersion}`
            : undefined,
      })
    } else {
      nodes.push({
        key: "rejected",
        title: "审核驳回",
        actor: review.review.reviewerName,
        timestamp: review.review.reviewedAt,
        state: "rejected",
        description: review.review.reason,
      })
    }
  }

  return nodes
}

export function ApprovalFlowDialog({
  review,
  open,
  onOpenChange,
}: ApprovalFlowDialogProps) {
  const nodes = buildTimeline(review)

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
        <div className="relative pl-2">
          {nodes.map((node, index) => (
            <TimelineItem
              key={node.key}
              node={node}
              isLast={index === nodes.length - 1}
            />
          ))}
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

function TimelineItem({
  node,
  isLast,
}: {
  node: TimelineNode
  isLast: boolean
}) {
  const dotConfig = {
    done: {
      bg: "bg-green-500",
      Icon: Check,
      lineColor: "bg-green-500/30",
    },
    current: {
      bg: "bg-amber-500 animate-pulse",
      Icon: Clock,
      lineColor: "bg-border",
    },
    rejected: {
      bg: "bg-red-500",
      Icon: X,
      lineColor: "bg-red-500/30",
    },
  }[node.state]

  const Icon = node.key === "submit" ? Send : dotConfig.Icon

  return (
    <div className="flex gap-3 pb-5 last:pb-0">
      {/* 圆点 + 竖线 */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex size-7 items-center justify-center rounded-full text-white",
            dotConfig.bg,
          )}
        >
          <Icon className="size-3.5" />
        </div>
        {!isLast && (
          <div className={cn("absolute top-7 h-full w-0.5", dotConfig.lineColor)} />
        )}
      </div>

      {/* 内容 */}
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">{node.title}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {node.timestamp === "—" ? "—" : formatUpdatedAt(node.timestamp)}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {node.actor}
          {node.organization && (
            <>
              <span className="mx-1 opacity-60">·</span>
              {node.organization}
            </>
          )}
        </div>
        {node.description && (
          <div
            className={cn(
              "mt-2 rounded-md px-2.5 py-1.5 text-xs",
              node.state === "rejected"
                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                : "bg-muted/50 text-foreground",
            )}
          >
            {node.description}
          </div>
        )}
      </div>
    </div>
  )
}
