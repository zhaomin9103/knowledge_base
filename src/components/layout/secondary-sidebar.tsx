import { NavLink, useLocation } from "react-router-dom"
import type { SubMenuItem } from "@/config/menu"
import { cn } from "@/lib/utils"

interface SecondarySidebarProps {
  items: SubMenuItem[]
}

export function SecondarySidebar({ items }: SecondarySidebarProps) {
  const { pathname } = useLocation()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-1 border-r bg-card px-3 py-6">
      {items.map((item) => {
        const Icon = item.icon
        // 前缀匹配：进入详情页（如 /workspace/knowledge/123）时父菜单依旧高亮
        const isActive =
          pathname === item.path || pathname.startsWith(`${item.path}/`)
        return (
          <NavLink
            key={item.key}
            to={item.path}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-sidebar-active-bg font-medium text-sidebar-active-fg"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </aside>
  )
}
