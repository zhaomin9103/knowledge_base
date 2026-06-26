import { useMemo, useState } from "react"
import { Search, UserPlus, Trash2 } from "lucide-react"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"
import { MOCK_USERS, type User } from "@/mocks/users"
import { getMemberJoinedAt } from "@/mocks/kb-members"
import { useAuth } from "@/hooks/use-auth"
import type { KBRole } from "@/hooks/use-kb-role"
import { formatUpdatedAt } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RoleBadge } from "./role-badge"
import { AddMemberDialog, type AddRole } from "./add-member-dialog"
import { RemoveMemberDialog } from "./remove-member-dialog"

interface MembersTabProps {
  kbId: string
}

interface MemberItem {
  user: User
  role: Exclude<KBRole, null>
  joinedAt?: string
}

export function MembersTab({ kbId }: MembersTabProps) {
  const { currentUser } = useAuth()
  const [keyword, setKeyword] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<MemberItem | null>(null)

  // 演示用：使用 state 持有 admin/maintainer 列表，方便交互模拟
  const initialKb = KNOWLEDGE_BASES.find((k) => k.id === kbId)
  const [adminIds, setAdminIds] = useState<string[]>(initialKb?.adminIds ?? [])
  const [maintainerIds, setMaintainerIds] = useState<string[]>(
    initialKb?.maintainerIds ?? [],
  )
  const ownerId = initialKb?.ownerId ?? ""

  // 组装成员列表
  const members = useMemo<MemberItem[]>(() => {
    const items: MemberItem[] = []

    const ownerUser = MOCK_USERS.find((u) => u.id === ownerId)
    if (ownerUser) {
      items.push({
        user: ownerUser,
        role: "owner",
        joinedAt: getMemberJoinedAt(kbId, ownerId),
      })
    }

    adminIds.forEach((id) => {
      const u = MOCK_USERS.find((x) => x.id === id)
      if (u)
        items.push({ user: u, role: "admin", joinedAt: getMemberJoinedAt(kbId, id) })
    })

    maintainerIds.forEach((id) => {
      const u = MOCK_USERS.find((x) => x.id === id)
      if (u)
        items.push({
          user: u,
          role: "maintainer",
          joinedAt: getMemberJoinedAt(kbId, id),
        })
    })

    return items
  }, [kbId, ownerId, adminIds, maintainerIds])

  // 统计
  const counts = useMemo(
    () => ({
      owner: members.filter((m) => m.role === "owner").length,
      admin: members.filter((m) => m.role === "admin").length,
      maintainer: members.filter((m) => m.role === "maintainer").length,
    }),
    [members],
  )

  // 搜索过滤
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return members
    return members.filter(
      (m) =>
        m.user.name.toLowerCase().includes(kw) ||
        m.user.idNo.toLowerCase().includes(kw) ||
        m.user.organization.toLowerCase().includes(kw),
    )
  }, [members, keyword])

  const existingMemberIds = useMemo(
    () => [ownerId, ...adminIds, ...maintainerIds].filter(Boolean),
    [ownerId, adminIds, maintainerIds],
  )

  const handleAddMembers = (userIds: string[], role: AddRole) => {
    if (role === "admin") {
      setAdminIds((prev) => Array.from(new Set([...prev, ...userIds])))
    } else {
      setMaintainerIds((prev) => Array.from(new Set([...prev, ...userIds])))
    }
  }

  const handleChangeRole = (
    userId: string,
    from: "admin" | "maintainer",
    to: "admin" | "maintainer",
  ) => {
    if (from === to) return
    if (from === "admin") {
      setAdminIds((prev) => prev.filter((id) => id !== userId))
      setMaintainerIds((prev) => Array.from(new Set([...prev, userId])))
    } else {
      setMaintainerIds((prev) => prev.filter((id) => id !== userId))
      setAdminIds((prev) => Array.from(new Set([...prev, userId])))
    }
  }

  const handleRemove = (member: MemberItem) => {
    if (member.role === "admin") {
      setAdminIds((prev) => prev.filter((id) => id !== member.user.id))
    } else if (member.role === "maintainer") {
      setMaintainerIds((prev) => prev.filter((id) => id !== member.user.id))
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 顶部统计 + 操作 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>共 {members.length} 位成员</span>
          <span className="mx-1 opacity-60">·</span>
          <span className="text-red-600 dark:text-red-400">
            {counts.owner} 超管
          </span>
          <span className="mx-1 opacity-60">·</span>
          <span className="text-blue-600 dark:text-blue-400">
            {counts.admin} 管理员
          </span>
          <span className="mx-1 opacity-60">·</span>
          <span className="text-green-600 dark:text-green-400">
            {counts.maintainer} 维护人员
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex h-9 w-64 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索姓名/工号/组织"
              className="h-full flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="mr-1 size-4" />
            新增成员
          </Button>
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-auto rounded-lg border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                成员
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                工号
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                所属组织
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                角色
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                加入时间
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  {keyword ? "无匹配成员" : "暂无成员"}
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <MemberRow
                  key={member.user.id}
                  member={member}
                  isCurrentUser={member.user.id === currentUser.id}
                  onChangeRole={(to) =>
                    handleChangeRole(
                      member.user.id,
                      member.role as "admin" | "maintainer",
                      to,
                    )
                  }
                  onRemove={() => setRemoveTarget(member)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 添加成员弹窗 */}
      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existingMemberIds={existingMemberIds}
        onConfirm={handleAddMembers}
      />

      {/* 移除确认 */}
      {removeTarget && (
        <RemoveMemberDialog
          open={!!removeTarget}
          onOpenChange={(open) => !open && setRemoveTarget(null)}
          memberName={removeTarget.user.name}
          memberRole={
            removeTarget.role === "admin" ? "管理员" : "维护人员"
          }
          onConfirm={() => handleRemove(removeTarget)}
        />
      )}
    </div>
  )
}

/**
 * 角色编辑器：默认仅展示角色徽章，鼠标悬停时显示编辑下拉框，
 * 退出编辑态（鼠标移出且下拉关闭）后重新隐藏为徽章。
 */
function RoleEditor({
  role,
  onChangeRole,
}: {
  role: "admin" | "maintainer"
  onChangeRole: (to: "admin" | "maintainer") => void
}) {
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)

  // 处于编辑态：鼠标悬停 或 下拉框处于打开状态
  const editing = hovered || open

  return (
    <div
      className="inline-flex h-8 min-w-32 items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {editing ? (
        <Select
          value={role}
          open={open}
          onOpenChange={setOpen}
          onValueChange={(v) => onChangeRole(v as "admin" | "maintainer")}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">
              <RoleBadge role="admin" />
            </SelectItem>
            <SelectItem value="maintainer">
              <RoleBadge role="maintainer" />
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <RoleBadge role={role} />
      )}
    </div>
  )
}

interface MemberRowProps {
  member: MemberItem
  isCurrentUser: boolean
  onChangeRole: (to: "admin" | "maintainer") => void
  onRemove: () => void
}

function MemberRow({
  member,
  isCurrentUser,
  onChangeRole,
  onRemove,
}: MemberRowProps) {
  const isOwner = member.role === "owner"

  return (
    <tr className="group border-b transition hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-medium text-white">
            {member.user.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {member.user.name}
              </span>
              {isCurrentUser && (
                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-xs text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  我
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {member.user.idNo}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {member.user.organization}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {isOwner ? (
          // 超管角色不可变更
          <RoleBadge role="owner" />
        ) : (
          <RoleEditor
            role={member.role as "admin" | "maintainer"}
            onChangeRole={onChangeRole}
          />
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {member.joinedAt ? formatUpdatedAt(member.joinedAt) : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="ghost"
            disabled={isOwner}
            onClick={onRemove}
            className={cn(
              "text-destructive hover:bg-destructive/10 hover:text-destructive",
              isOwner && "cursor-not-allowed opacity-40",
            )}
            title={isOwner ? "创建者不可移除" : "移除成员"}
          >
            <Trash2 className="mr-1 size-3.5" />
            移除
          </Button>
        </div>
      </td>
    </tr>
  )
}
