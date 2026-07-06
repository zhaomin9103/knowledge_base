import { Crown, Shield, ShieldCheck, Wrench } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { KBRole } from "@/hooks/use-kb-role"
import { cn } from "@/lib/utils"

const CONFIG: Record<
  Exclude<KBRole, null>,
  { label: string; className: string; Icon: LucideIcon }
> = {
  owner: {
    label: "创建者",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    Icon: Crown,
  },
  second_reviewer: {
    label: "复审人",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    Icon: ShieldCheck,
  },
  first_reviewer: {
    label: "初审人",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
    Icon: Shield,
  },
  maintainer: {
    label: "维护人员",
    className:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    Icon: Wrench,
  },
}

export function RoleBadge({ role }: { role: Exclude<KBRole, null> }) {
  const { label, className, Icon } = CONFIG[role]
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
