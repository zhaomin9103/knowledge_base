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
  state: "done" | "current" | "rejected" | "waiting"
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

  // 初审环节
  if (review.skipFirstReview) {
    nodes.push({
      key: "first-skip",
      title: "初审（免审）",
      actor: "提交人具备初审权限，自动免初审",
      timestamp: "—",
      state: "done",
    })
  } else if (review.firstReview) {
    const fr = review.firstReview
    nodes.push({
      key: "first",
      title: fr.result === "approved" ? "初审通过" : "初审驳回",
      actor: fr.reviewerName,
      timestamp: fr.reviewedAt,
      state: fr.result === "approved" ? "done" : "rejected",
      description: fr.reason,
    })
  } else {
    // 尚未初审
    nodes.push({
      key: "first-pending",
      title: "等待初审",
      actor: "初审人",
      timestamp: "—",
      state: review.status === "pending_first" ? "current" : "waiting",
    })
  }

  // 复审环节：仅当初审已通过 / 免审时才进入
  const firstPassed = review.skipFirstReview || review.firstReview?.result === "approved"
  const firstRejected = review.firstReview?.result === "rejected"

  if (!firstRejected) {
    if (review.secondReview) {
      const sr = review.secondReview
      nodes.push({
        key: "second",
        title: sr.result === "approved" ? "复审通过" : "复审驳回",
        actor: sr.reviewerName,
        timestamp: sr.reviewedAt,
        state: sr.result === "approved" ? "done" : "rejected",
        description:
          sr.result === "approved"
            ? review.appliedVersion != null
              ? `生效版本：v${review.appliedVersion}`
              : undefined
            : sr.reason,
      })
    } else {
      nodes.push({
        key: "second-pending",
        title: "等待复审",
        actor: "复审人",
        timestamp: "—",
        state:
          firstPassed && review.status === "pending_second"
            ? "current"
            : "waiting",
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
    waiting: {
      bg: "bg-muted-foreground/40",
      Icon: Clock,
      lineColor: "bg-border",
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
