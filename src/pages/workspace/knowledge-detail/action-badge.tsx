import {
  Check,
  CheckCheck,
  Plus,
  Pencil,
  Trash2,
  X,
  UserPlus,
  UserMinus,
  UserCog,
  RotateCcw,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ActionType } from "@/mocks/operations"
import { cn } from "@/lib/utils"

const CONFIG: Record<
  ActionType,
  { label: string; className: string; Icon: LucideIcon }
> = {
  submit_add: {
    label: "提交新增",
    className:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    Icon: Plus,
  },
  submit_update: {
    label: "提交更新",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    Icon: Pencil,
  },
  submit_delete: {
    label: "提交删除",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    Icon: Trash2,
  },
  first_approve: {
    label: "初审通过",
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400",
    Icon: Check,
  },
  first_reject: {
    label: "初审驳回",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
    Icon: X,
  },
  second_approve: {
    label: "复审通过",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    Icon: CheckCheck,
  },
  second_reject: {
    label: "复审驳回",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
    Icon: X,
  },
  add_member: {
    label: "添加成员",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
    Icon: UserPlus,
  },
  remove_member: {
    label: "移除成员",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
    Icon: UserMinus,
  },
  change_role: {
    label: "变更角色",
    className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
    Icon: UserCog,
  },
  rollback: {
    label: "版本回退",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    Icon: RotateCcw,
  },
}

export function ActionBadge({ action }: { action: ActionType }) {
  const { label, className, Icon } = CONFIG[action]
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
