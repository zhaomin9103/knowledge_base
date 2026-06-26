import { useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"

export type KBRole = "owner" | "admin" | "maintainer"

interface UseKBRoleResult {
  role: KBRole | null
  isOwner: boolean
  isAdmin: boolean
  isMaintainer: boolean
  canManageMembers: boolean
  canReview: boolean
  canSubmit: boolean
}

/**
 * 判断当前用户在某知识库中的角色（简化版）
 */
export function useKBRole(kbId: string | undefined): UseKBRoleResult {
  const { currentUser } = useAuth()

  return useMemo(() => {
    if (!kbId) {
      return {
        role: null,
        isOwner: false,
        isAdmin: false,
        isMaintainer: false,
        canManageMembers: false,
        canReview: false,
        canSubmit: false,
      }
    }

    const kb = KNOWLEDGE_BASES.find((k) => k.id === kbId)
    if (!kb) {
      return {
        role: null,
        isOwner: false,
        isAdmin: false,
        isMaintainer: false,
        canManageMembers: false,
        canReview: false,
        canSubmit: false,
      }
    }

    const userId = currentUser.id
    const isOwner = kb.ownerId === userId
    const isAdmin = kb.adminIds.includes(userId)
    const isMaintainer = kb.maintainerIds.includes(userId)

    let role: KBRole | null = null
    if (isOwner) role = "owner"
    else if (isAdmin) role = "admin"
    else if (isMaintainer) role = "maintainer"

    return {
      role,
      isOwner,
      isAdmin,
      isMaintainer,
      // 超管可管理成员
      canManageMembers: isOwner,
      // 超管和管理员可审核
      canReview: isOwner || isAdmin,
      // 维护人员可提交
      canSubmit: isMaintainer,
    }
  }, [kbId, currentUser.id])
}
