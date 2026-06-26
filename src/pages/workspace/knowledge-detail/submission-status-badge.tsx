import { Check, Clock, X } from "lucide-react"
import type { ReviewStatus } from "@/mocks/reviews"
import { cn } from "@/lib/utils"

const CONFIG: Record<
  ReviewStatus,
  { label: string; className: string; Icon: typeof Check }
> = {
  pending: {
    label: "待审核",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    Icon: Clock,
  },
  approved: {
    label: "审核通过",
    className:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    Icon: Check,
  },
  rejected: {
    label: "审核驳回",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    Icon: X,
  },
}

export function SubmissionStatusBadge({ status }: { status: ReviewStatus }) {
  const { label, className, Icon } = CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  )
}
