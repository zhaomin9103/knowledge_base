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
import { PageNotesDrawer } from "./page-notes-drawer"

interface MembersTabProps {
  kbId: string
}

const MEMBERS_NOTES = `【页面定位】
创建者（超管）管理本知识库成员的页面。集中查看成员及其角色，并进行新增 / 变更角色 / 移除操作。

【数据范围】
· 成员来源于三类角色：创建者（owner）、管理员（admin）、维护人员（maintainer）。
· 列表顺序：创建者在最前，其后依次为管理员、维护人员。
· 顶部统计：总成员数，并按角色分别计数（超管 / 管理员 / 维护人员）。

【列表字段】
· 成员：头像（姓名首字） + 姓名；当前登录用户额外标注「我」。
· 工号：成员工号（idNo）。
· 所属组织：成员所在组织 / 学院。
· 角色：创建者（红）/ 管理员（蓝）/ 维护人员（绿）标签。
· 加入时间：成员加入本知识库的时间，无记录显示「—」。
· 操作：移除成员。

【交互逻辑】
1. 搜索：按姓名 / 工号 / 组织实时过滤（前端过滤，无匹配显示空态）。
2. 新增成员 → 弹出「添加成员弹窗」：
   · 可多选用户，已在成员列表中的用户不可重复添加。
   · 选择目标角色（管理员 / 维护人员），确认后批量加入。
3. 变更角色（仅管理员 / 维护人员可变更）：
   · 鼠标悬停角色标签 → 展开角色下拉选择器。
   · 可在「管理员 ⇄ 维护人员」之间切换；移出且下拉关闭后恢复为标签。
   · 创建者角色固定，不可变更。
4. 移除成员 → 弹出二次确认弹窗：
   · 确认后从对应角色列表移除。
   · 创建者不可移除（按钮禁用）。

【操作逻辑 / 权限】
· 仅创建者（canManageMembers / isOwner）可见本 Tab 及全部操作。
· 管理员、维护人员无成员管理权限。
· 成员的增删改会写入「操作记录」（add_member / remove_member / change_role）。

【备注】
本说明用于记录页面预期逻辑，可手动编辑后保存（保存在本地浏览器）。`

interface MemberItem {
  user: User
  role: Exclude<KBRole, null>
  joinedAt?: string
}

/** 可分配 / 可切换的非创建者角色 */
type AssignableRole = "first_reviewer" | "second_reviewer" | "maintainer"

const ASSIGNABLE_ROLE_LABEL: Record<AssignableRole, string> = {
  first_reviewer: "初审人",
  second_reviewer: "复审人",
  maintainer: "维护人员",
}

export function MembersTab({ kbId }: MembersTabProps) {
  const { currentUser } = useAuth()
  const [keyword, setKeyword] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<MemberItem | null>(null)

  // 演示用：使用 state 持有各角色列表，方便交互模拟
  const initialKb = KNOWLEDGE_BASES.find((k) => k.id === kbId)
  const [firstReviewerIds, setFirstReviewerIds] = useState<string[]>(
    initialKb?.firstReviewerIds ?? [],
  )
  const [secondReviewerIds, setSecondReviewerIds] = useState<string[]>(
    initialKb?.secondReviewerIds ?? [],
  )
  const [maintainerIds, setMaintainerIds] = useState<string[]>(
    initialKb?.maintainerIds ?? [],
  )
  const ownerId = initialKb?.ownerId ?? ""

  // 组装成员列表（顺序：创建者 → 复审人 → 初审人 → 维护人员）
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

    secondReviewerIds.forEach((id) => {
      const u = MOCK_USERS.find((x) => x.id === id)
      if (u)
        items.push({
          user: u,
          role: "second_reviewer",
          joinedAt: getMemberJoinedAt(kbId, id),
        })
    })

    firstReviewerIds.forEach((id) => {
      const u = MOCK_USERS.find((x) => x.id === id)
      if (u)
        items.push({
          user: u,
          role: "first_reviewer",
          joinedAt: getMemberJoinedAt(kbId, id),
        })
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
  }, [kbId, ownerId, firstReviewerIds, secondReviewerIds, maintainerIds])

  // 统计
  const counts = useMemo(
    () => ({
      owner: members.filter((m) => m.role === "owner").length,
      secondReviewer: members.filter((m) => m.role === "second_reviewer").length,
      firstReviewer: members.filter((m) => m.role === "first_reviewer").length,
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
    () =>
      [ownerId, ...firstReviewerIds, ...secondReviewerIds, ...maintainerIds].filter(
        Boolean,
      ),
    [ownerId, firstReviewerIds, secondReviewerIds, maintainerIds],
  )

  const setterForRole = (role: AssignableRole) =>
    role === "first_reviewer"
      ? setFirstReviewerIds
      : role === "second_reviewer"
        ? setSecondReviewerIds
        : setMaintainerIds

  const handleAddMembers = (userIds: string[], role: AddRole) => {
    setterForRole(role)((prev) =>
      Array.from(new Set([...prev, ...userIds])),
    )
  }

  const handleChangeRole = (
    userId: string,
    from: AssignableRole,
    to: AssignableRole,
  ) => {
    if (from === to) return
    setterForRole(from)((prev) => prev.filter((id) => id !== userId))
    setterForRole(to)((prev) => Array.from(new Set([...prev, userId])))
  }

  const handleRemove = (member: MemberItem) => {
    if (member.role === "owner") return
    setterForRole(member.role as AssignableRole)((prev) =>
      prev.filter((id) => id !== member.user.id),
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 顶部统计 + 操作 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>共 {members.length} 位成员</span>
          <span className="mx-1 opacity-60">·</span>
          <span className="text-red-600 dark:text-red-400">
            {counts.owner} 创建者
          </span>
          <span className="mx-1 opacity-60">·</span>
          <span className="text-blue-600 dark:text-blue-400">
            {counts.secondReviewer} 复审人
          </span>
          <span className="mx-1 opacity-60">·</span>
          <span className="text-indigo-600 dark:text-indigo-400">
            {counts.firstReviewer} 初审人
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
                      member.role as AssignableRole,
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
            ASSIGNABLE_ROLE_LABEL[removeTarget.role as AssignableRole]
          }
          onConfirm={() => handleRemove(removeTarget)}
        />
      )}

      {/* 页面备注抽屉 */}
      <PageNotesDrawer
        noteKey={`members:${kbId}`}
        title="成员管理 · 页面备注"
        defaultContent={MEMBERS_NOTES}
      />
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
  role: AssignableRole
  onChangeRole: (to: AssignableRole) => void
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
          onValueChange={(v) => onChangeRole(v as AssignableRole)}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="second_reviewer">
              <RoleBadge role="second_reviewer" />
            </SelectItem>
            <SelectItem value="first_reviewer">
              <RoleBadge role="first_reviewer" />
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
  onChangeRole: (to: AssignableRole) => void
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
          // 创建者角色不可变更
          <RoleBadge role="owner" />
        ) : (
          <RoleEditor
            role={member.role as AssignableRole}
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
