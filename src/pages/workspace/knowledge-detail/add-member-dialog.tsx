import { useMemo, useState } from "react"
import { Search, UserPlus, X } from "lucide-react"
import { MOCK_USERS, type User } from "@/mocks/users"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type AddRole = "first_reviewer" | "second_reviewer" | "maintainer"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 已是成员的 user id（创建者 + 现有 admin/maintainer），用于过滤 */
  existingMemberIds: string[]
  onConfirm: (userIds: string[], role: AddRole) => void
}

export function AddMemberDialog({
  open,
  onOpenChange,
  existingMemberIds,
  onConfirm,
}: AddMemberDialogProps) {
  const [keyword, setKeyword] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [role, setRole] = useState<AddRole>("maintainer")

  // 候选人：除已是成员外的所有非学生用户（学生不能成为知识库成员）
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
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            添加成员
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* 角色选择 */}
          <div className="space-y-2">
            <Label required>分配角色</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as AddRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_reviewer">
                  初审人（对维护人员的提交进行初审）
                </SelectItem>
                <SelectItem value="second_reviewer">
                  复审人（对初审通过的提交进行复审，通过后生效）
                </SelectItem>
                <SelectItem value="maintainer">
                  维护人员（可提交文档变更，需两级审核后生效）
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 搜索 */}
          <div className="space-y-2">
            <Label>选择成员</Label>
            <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索姓名 / 工号 / 组织"
                className="h-full flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* 已选 chips */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selectedIds).map((id) => {
                const u = MOCK_USERS.find((x) => x.id === id)
                if (!u) return null
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  >
                    {u.name}
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      className="hover:opacity-70"
                      aria-label="移除"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          {/* 候选人列表 */}
          <div className="flex-1 overflow-auto rounded-md border">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {keyword ? "无匹配人员" : "暂无可添加成员"}
              </div>
            ) : (
              filtered.map((user) => {
                const checked = selectedIds.has(user.id)
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggle(user.id)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b px-3 py-2 text-left transition last:border-b-0 hover:bg-muted/50",
                      checked && "bg-brand-50 dark:bg-brand-950/30",
                    )}
                  >
                    <Checkbox checked={checked} />
                    <UserAvatar user={user} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {user.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        工号：{user.idNo} · {user.organization}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>
            确认添加
            {selectedIds.size > 0 && ` (${selectedIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded border transition",
        checked
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-input bg-background",
      )}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="size-3" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
        </svg>
      )}
    </span>
  )
}

function UserAvatar({ user }: { user: User }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-medium text-white">
      {user.name.slice(0, 1)}
    </div>
  )
}
