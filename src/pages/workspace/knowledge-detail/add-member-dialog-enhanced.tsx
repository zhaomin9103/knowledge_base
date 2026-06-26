import { useMemo, useState } from "react"
import { Search, UserPlus, X, Users, Briefcase } from "lucide-react"
import { MOCK_USERS, type User } from "@/mocks/users"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog-enhanced"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type AddRole = "admin" | "maintainer"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingMemberIds: string[]
  onConfirm: (userIds: string[], role: AddRole) => void
}

export function AddMemberDialogEnhanced({
  open,
  onOpenChange,
  existingMemberIds,
  onConfirm,
}: AddMemberDialogProps) {
  const [keyword, setKeyword] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [role, setRole] = useState<AddRole>("maintainer")

  const candidates = useMemo(
    () =>
      MOCK_USERS.filter(
        (u) => u.type !== "student" && !existingMemberIds.includes(u.id),
      ),
    [existingMemberIds],
  )

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return candidates
    return candidates.filter(
      (u) =>
        u.name.toLowerCase().includes(kw) ||
        u.idNo.toLowerCase().includes(kw) ||
        u.organization.toLowerCase().includes(kw),
    )
  }, [candidates, keyword])

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    if (selectedIds.size === 0) {
      alert("请至少选择一位成员")
      return
    }
    onConfirm(Array.from(selectedIds), role)
    handleOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setKeyword("")
      setSelectedIds(new Set())
      setRole("maintainer")
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-500/20">
              <UserPlus className="size-5" />
            </div>
            <span>添加成员</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-hidden">
          {/* Role Selection Card */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              分配角色
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as AddRole)}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/60 bg-card/50 shadow-sm transition-all focus:border-brand-400 focus:shadow-md focus:shadow-brand-500/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                      <Briefcase className="size-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">管理员</div>
                      <div className="text-xs text-muted-foreground">
                        可审核维护人员的提交
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="maintainer">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      <Users className="size-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">维护人员</div>
                      <div className="text-xs text-muted-foreground">
                        可提交文档变更，需审核后生效
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              选择成员
            </Label>
            <div className="relative flex h-11 items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 shadow-sm transition-all focus-within:border-brand-400 focus-within:shadow-md focus-within:shadow-brand-500/10">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索姓名 / 工号 / 组织"
                className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              {keyword && (
                <button
                  onClick={() => setKeyword("")}
                  className="text-muted-foreground/60 transition-colors hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Selected Chips */}
          {selectedIds.size > 0 && (
            <div className="rounded-xl border border-brand-200/40 bg-brand-50/30 p-4 dark:border-brand-800/30 dark:bg-brand-950/20">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                已选择 {selectedIds.size} 人
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedIds).map((id) => {
                  const u = MOCK_USERS.find((x) => x.id === id)
                  if (!u) return null
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 rounded-lg border border-brand-300/50 bg-gradient-to-r from-brand-100 to-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 shadow-sm transition-all hover:shadow-md dark:border-brand-700/50 dark:from-brand-950 dark:to-brand-900 dark:text-brand-300"
                    >
                      {u.name}
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        className="flex size-4 items-center justify-center rounded-full transition-colors hover:bg-brand-200 dark:hover:bg-brand-800"
                        aria-label="移除"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Candidates List */}
          <div className="flex-1 overflow-hidden rounded-xl border border-border/60 bg-card/50 shadow-sm">
            <div className="flex h-full flex-col">
              {filtered.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-12 text-center">
                  <div>
                    <Users className="mx-auto mb-3 size-12 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">
                      {keyword ? "未找到匹配人员" : "暂无可添加成员"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  {filtered.map((user) => {
                    const checked = selectedIds.has(user.id)
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggle(user.id)}
                        className={cn(
                          "flex w-full items-center gap-3 border-b border-border/30 px-4 py-3 text-left transition-all last:border-b-0 hover:bg-muted/40",
                          checked &&
                            "bg-gradient-to-r from-brand-50/60 to-transparent dark:from-brand-950/30",
                        )}
                      >
                        <EnhancedCheckbox checked={checked} />
                        <UserAvatar user={user} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {user.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>工号：{user.idNo}</span>
                            <span>•</span>
                            <span className="truncate">{user.organization}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            size="lg"
          >
            取消
          </Button>
          <Button onClick={handleConfirm} size="lg">
            <UserPlus className="mr-2 size-4" />
            确认添加
            {selectedIds.size > 0 && ` (${selectedIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EnhancedCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all",
        checked
          ? "border-brand-500 bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30"
          : "border-border/60 bg-background shadow-sm",
      )}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
        </svg>
      )}
    </span>
  )
}

function UserAvatar({ user }: { user: User }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 font-serif text-sm font-bold text-white shadow-lg shadow-brand-500/20">
      {user.name.slice(0, 1)}
    </div>
  )
}
