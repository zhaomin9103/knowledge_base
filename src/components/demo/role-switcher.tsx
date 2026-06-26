import { UserCog } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface RoleSwitcherProps {
  /** 当前知识库 ID，用于显示每个用户在该库中的角色 */
  kbId?: string
}

/**
 * 演示专用角色切换器 —— 真实环境删除即可。
 * 列出所有 mock 用户，标注每个人对当前知识库的角色，点击切换登录身份。
 */
export function RoleSwitcher({ kbId }: RoleSwitcherProps) {
  const { currentUser, setCurrentUserId, allUsers } = useAuth()
  const kb = kbId ? KNOWLEDGE_BASES.find((k) => k.id === kbId) : undefined

  const getRoleLabel = (userId: string): string => {
    if (!kb) return ""
    if (kb.ownerId === userId) return "创建者"
    if (kb.adminIds.includes(userId)) return "管理员"
    if (kb.maintainerIds.includes(userId)) return "维护人员"
    return "无权限"
  }

  const getRoleColor = (userId: string): string => {
    if (!kb) return "text-muted-foreground"
    if (kb.ownerId === userId) return "text-red-600 dark:text-red-400"
    if (kb.adminIds.includes(userId)) return "text-blue-600 dark:text-blue-400"
    if (kb.maintainerIds.includes(userId))
      return "text-green-600 dark:text-green-400"
    return "text-gray-400"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-dashed border-amber-400 bg-amber-50 px-3 text-sm text-amber-700 transition hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400"
          title="演示用：切换登录身份"
        >
          <UserCog className="size-4" />
          <span className="font-medium">{currentUser.name}</span>
          {kb ? (
            <span className={cn("text-xs", getRoleColor(currentUser.id))}>
              ({getRoleLabel(currentUser.id)})
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          🎭 演示：切换登录身份
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allUsers.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onSelect={() => setCurrentUserId(user.id)}
            className={cn(
              "flex items-center justify-between gap-2",
              currentUser.id === user.id && "bg-accent",
            )}
          >
            <div className="flex flex-col">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">
                {user.organization}
              </span>
            </div>
            {kb ? (
              <span className={cn("text-xs", getRoleColor(user.id))}>
                {getRoleLabel(user.id)}
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
