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
import { Input } from "@/components/ui/input"

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
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [role, setRole] = useState<AddRole>("maintainer")
  const [searchKeyword, setSearchKeyword] = useState("")

  // 搜索结果：根据姓名或工号搜索，排除已是成员的用户
  const searchResults = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    // 如果没有输入搜索关键词，返回空数组
    if (!keyword) {
      return []
    }

    return MOCK_USERS.filter((user) => {
      // 排除已是成员的用户
      if (existingMemberIds.includes(user.id)) {
        return false
      }

      // 按姓名或工号搜索
      const nameMatch = user.name.toLowerCase().includes(keyword)
      const idNoMatch = user.idNo.toLowerCase().includes(keyword)

      return nameMatch || idNoMatch
    })
  }, [searchKeyword, existingMemberIds])

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const handleConfirm = () => {
    if (selectedUserIds.size === 0) {
      alert("请至少选择一位成员")
      return
    }
    onConfirm(Array.from(selectedUserIds), role)
    // 重置状态
    setSelectedUserIds(new Set())
    setRole("maintainer")
    setSearchKeyword("")
  }

  const handleCancel = () => {
    // 重置状态
    setSelectedUserIds(new Set())
    setRole("maintainer")
    setSearchKeyword("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserPlus className="size-5" />
              添加成员
            </span>
            {selectedUserIds.size > 0 && (
              <span className="text-sm font-normal text-brand-600 dark:text-brand-400">
                已选 {selectedUserIds.size} 人
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="space-y-2">
            <Label>搜索成员</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="输入姓名或工号搜索（如：张三、T20200301）"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* 搜索结果列表 */}
          <div className="space-y-2">
            <Label>选择成员</Label>
            <div className="max-h-[320px] min-h-[200px] overflow-y-auto rounded-lg border bg-muted/30">
              {!searchKeyword ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                  <div className="text-center">
                    <Search className="mx-auto mb-2 size-8 opacity-30" />
                    <p>请输入姓名或工号搜索成员</p>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                  <div className="text-center">
                    <p>未找到匹配的成员</p>
                    <p className="mt-1 text-xs">请尝试其他关键词</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {searchResults.map((user) => {
                    const isSelected = selectedUserIds.has(user.id)
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleUser(user.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/50",
                          isSelected && "bg-brand-50/50 dark:bg-brand-950/20",
                        )}
                      >
                        <Checkbox checked={isSelected} />
                        <UserAvatar user={user} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {user.idNo}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.organization}
                          </div>
                        </div>
                        {user.type === "teacher" && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            教师
                          </span>
                        )}
                        {user.type === "student" && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                            学生
                          </span>
                        )}
                        {user.type === "admin" && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            管理员
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 角色选择 */}
          <div className="space-y-2">
            <Label>分配角色</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AddRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintainer">维护人员</SelectItem>
                <SelectItem value="first_reviewer">初审人</SelectItem>
                <SelectItem value="second_reviewer">复审人</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              所有选中的成员将被分配相同的角色
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedUserIds.size === 0}
          >
            <UserPlus className="mr-2 size-4" />
            确认添加 {selectedUserIds.size > 0 && `(${selectedUserIds.size})`}
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
