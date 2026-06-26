import { useMemo, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { PrimarySidebar } from "./primary-sidebar"
import { SecondarySidebar } from "./secondary-sidebar"
import { PRIMARY_MENU } from "@/config/menu"
import { cn } from "@/lib/utils"

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const activePrimary = useMemo(
    () =>
      PRIMARY_MENU.find((item) => location.pathname.startsWith(item.path)) ??
      PRIMARY_MENU[0],
    [location.pathname],
  )

  const showSecondary = !!activePrimary?.children?.length && !collapsed

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <PrimarySidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      {showSecondary && activePrimary.children ? (
        <SecondarySidebar items={activePrimary.children} />
      ) : null}

      <main
        className={cn(
          "relative flex-1 overflow-auto",
          "bg-[linear-gradient(135deg,var(--content-gradient-from),var(--content-gradient-to))]",
        )}
      >
        <div className="mx-auto h-full max-w-[1440px] px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
