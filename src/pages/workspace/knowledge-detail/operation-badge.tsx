import type { OperationType } from "@/mocks/reviews"
import { cn } from "@/lib/utils"

const OPERATION_CONFIG: Record<
  OperationType,
  { label: string; className: string }
> = {
  add: {
    label: "新增",
    className:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  },
  update: {
    label: "更新",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  },
  delete: {
    label: "删除",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  },
}

export function OperationBadge({ operation }: { operation: OperationType }) {
  const config = OPERATION_CONFIG[operation]
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
