import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ReviewResult = "approved" | "rejected"

const CONFIG: Record<
  ReviewResult,
  { label: string; className: string; Icon: typeof Check }
> = {
  approved: {
    label: "通过",
    className:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    Icon: Check,
  },
  rejected: {
    label: "驳回",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    Icon: X,
  },
}

export function ReviewResultBadge({ result }: { result: ReviewResult }) {
  const { label, className, Icon } = CONFIG[result]
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
