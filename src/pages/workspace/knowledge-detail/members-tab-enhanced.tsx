import { useMemo, useState } from "react"
import { Search, UserPlus, Trash2 } from "lucide-react"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"
import { MOCK_USERS, type User } from "@/mocks/users"
import { getMemberJoinedAt } from "@/mocks/kb-members"
import { useAuth } from "@/hooks/use-auth"
import type { KBRole } from "@/hooks/use-kb-role"
import { formatUpdatedAt } from "@/lib/format"
import { cn } from "@/lib/utils"
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

type AssignableRole = "first_reviewer" | "second_reviewer" | "maintainer"

const ASSIGNABLE_ROLE_LABEL: Record<AssignableRole, string> = {
  first_reviewer: "初审人",
  second_reviewer: "复审人",
  maintainer: "维护人员",
}

export function MembersTabEnhanced({ kbId }: MembersTabProps) {
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

  // 组装成员列表（创建者 → 复审人 → 初审人 → 维护人员）
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
      [
        ownerId,
        ...firstReviewerIds,
        ...secondReviewerIds,
        ...maintainerIds,
      ].filter(Boolean),
    [ownerId, firstReviewerIds, secondReviewerIds, maintainerIds],
  )

  const setterForRole = (role: AssignableRole) =>
    role === "first_reviewer"
      ? setFirstReviewerIds
      : role === "second_reviewer"
        ? setSecondReviewerIds
        : setMaintainerIds

  const handleAddMembers = (userIds: string[], role: AddRole) => {
    setterForRole(role)((prev) => Array.from(new Set([...prev, ...userIds])))
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
    <div className="flex h-full flex-col gap-6">
      {/* 顶部统计 + 搜索 + 操作 */}
      <div className="rounded-xl border border-[#E7E7E9] bg-white px-6 py-4">
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#858890]">共</span>
            <span className="text-base font-medium text-[#0C1222]">
              {members.length}
            </span>
            <span className="text-[#858890]">位成员</span>
          </div>
          <span className="text-[#E7E7E9]">·</span>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="inline-flex h-5 items-center rounded-full bg-gradient-to-r from-[#E95141] to-[#F16B5C] px-2 text-xs font-medium text-white">
              {counts.owner}
            </span>
            <span className="text-[#858890]">创建者</span>
          </div>
          <span className="text-[#E7E7E9]">·</span>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="inline-flex h-5 items-center rounded-full bg-gradient-to-r from-[#494AFF] to-[#006EFE] px-2 text-xs font-medium text-white">
              {counts.secondReviewer}
            </span>
            <span className="text-[#858890]">复审人</span>
          </div>
          <span className="text-[#E7E7E9]">·</span>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="inline-flex h-5 items-center rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] px-2 text-xs font-medium text-white">
              {counts.firstReviewer}
            </span>
            <span className="text-[#858890]">初审人</span>
          </div>
          <span className="text-[#E7E7E9]">·</span>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="inline-flex h-5 items-center rounded-full bg-gradient-to-r from-[#74C041] to-[#8CD657] px-2 text-xs font-medium text-white">
              {counts.maintainer}
            </span>
            <span className="text-[#858890]">维护人员</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative flex h-10 flex-1 max-w-md items-center gap-3 rounded-lg border border-[#E7E7E9] bg-white px-4 transition-all focus-within:border-[#1947FF] focus-within:shadow-sm">
            <Search className="size-4 text-[#858890]" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索姓名/工号/组织"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#BFBFBF]"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="text-[#858890] transition-colors hover:text-[#0B111E]"
              >
                ×
              </button>
            )}
          </div>

          {/* 新增成员按钮 */}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-transparent bg-gradient-to-r from-[#494AFF] to-[#006EFE] px-4 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
          >
            <UserPlus className="size-4" />
            新增成员
          </button>
        </div>
      </div>

      {/* 成员卡片列表 */}
      <div className="flex-1 space-y-3 overflow-auto pb-4">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-[#E7E7E9] bg-white">
            <p className="text-sm text-[#858890]">
              {keyword ? "无匹配成员" : "暂无成员"}
            </p>
          </div>
        ) : (
          filtered.map((member) => (
            <MemberCard
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
    </div>
  )
}

interface MemberCardProps {
  member: MemberItem
  isCurrentUser: boolean
  onChangeRole: (to: AssignableRole) => void
  onRemove: () => void
}

function MemberCard({
  member,
  isCurrentUser,
  onChangeRole,
  onRemove,
}: MemberCardProps) {
  const isOwner = member.role === "owner"
  const [hovered, setHovered] = useState(false)
  const [selectOpen, setSelectOpen] = useState(false)
  const editing = hovered || selectOpen

  return (
    <div className="group overflow-hidden rounded-xl border border-[#E7E7E9] bg-white transition-all hover:border-[#1947FF]/20 hover:shadow-md">
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* 头像 + 信息 */}
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#494AFF] to-[#006EFE] text-base font-medium text-white shadow-md">
            {member.user.name.slice(0, 1)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-base font-medium text-[#0C1222]">
                {member.user.name}
              </h3>
              {isCurrentUser && (
                <span className="rounded-full bg-gradient-to-r from-[#494AFF] to-[#006EFE] px-2 py-0.5 text-xs font-medium text-white">
                  我
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#858890]">
              <span>工号：{member.user.idNo}</span>
              <span>·</span>
              <span>{member.user.organization}</span>
              {member.joinedAt && (
                <>
                  <span>·</span>
                  <span>加入时间：{formatUpdatedAt(member.joinedAt)}</span>
                </>
              )}
            </div>
          </div>

          {/* 角色 + 操作 */}
          <div className="flex shrink-0 items-center gap-3">
            {isOwner ? (
              <RoleBadge role="owner" />
            ) : (
              <div
                className="inline-flex h-9 min-w-32 items-center"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                {editing ? (
                  <Select
                    value={member.role}
                    open={selectOpen}
                    onOpenChange={setSelectOpen}
                    onValueChange={(v) => onChangeRole(v as AssignableRole)}
                  >
                    <SelectTrigger className="h-9 w-32 border-[#E7E7E9]">
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
                  <RoleBadge role={member.role as AssignableRole} />
                )}
              </div>
            )}

            <button
              type="button"
              disabled={isOwner}
              onClick={onRemove}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all",
                isOwner
                  ? "cursor-not-allowed border-[#E7E7E9] bg-[#F3F4F7] text-[#BFBFBF]"
                  : "border-[#E7E7E9] bg-white text-[#E95141] hover:border-[#E95141] hover:bg-[#FFF1F0]",
              )}
              title={isOwner ? "创建者不可移除" : "移除成员"}
            >
              <Trash2 className="size-4" />
              移除
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
