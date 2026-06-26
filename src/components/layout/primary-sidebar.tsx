import { NavLink } from "react-router-dom"
import { Bell, ChevronsLeft, Plus, Sparkles, Sun, Moon } from "lucide-react"
import { PRIMARY_MENU } from "@/config/menu"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

interface PrimarySidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function PrimarySidebar({
  collapsed,
  onToggleCollapse,
}: PrimarySidebarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="flex h-full w-[88px] shrink-0 flex-col items-center border-r bg-sidebar-bg py-4">
      {/* Logo */}
      <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-300 to-brand-600 text-base font-bold text-white shadow">
        <Sparkles className="size-5" />
      </div>

      {/* 创建按钮 */}
      <button
        type="button"
        className="mt-4 flex size-12 items-center justify-center rounded-xl border bg-card text-muted-foreground transition hover:border-brand-400 hover:text-brand-500"
        title="创建"
      >
        <Plus className="size-5" />
      </button>

      {/* 一级菜单 */}
      <nav className="mt-4 flex flex-1 flex-col items-center gap-1 self-stretch px-2">
        {PRIMARY_MENU.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex w-full flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs transition-colors",
                  isActive
                    ? "bg-sidebar-active-bg text-sidebar-active-fg"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )
              }
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* 底部工具区 */}
      <div className="flex flex-col items-center gap-3 pb-1">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          title="通知"
        >
          <Bell className="size-5" />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          title="切换主题"
        >
          {theme === "light" ? (
            <Moon className="size-5" />
          ) : (
            <Sun className="size-5" />
          )}
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          title={collapsed ? "展开二级菜单" : "折叠二级菜单"}
        >
          <ChevronsLeft
            className={cn(
              "size-5 transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>
    </aside>
  )
}
