import { useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"

export type KBRole = "owner" | "first_reviewer" | "second_reviewer" | "maintainer"

interface UseKBRoleResult {
  role: KBRole | null
  isOwner: boolean
  isFirstReviewer: boolean
  isSecondReviewer: boolean
  isMaintainer: boolean
  canManageMembers: boolean
  /** 可执行初审（初审人 / 创建者） */
  canFirstReview: boolean
  /** 可执行复审（复审人 / 创建者） */
  canSecondReview: boolean
  /** 具备任一级审核能力（用于 Tab 显隐等粗粒度判断） */
  canReview: boolean
  /** 可提交文档变更（维护人员 / 初审人；均需审核后生效） */
  canSubmit: boolean
  /** 提交人自身是否为初审人及以上（其提交可跳过初审） */
  skipsFirstReview: boolean
}

const EMPTY: UseKBRoleResult = {
  role: null,
  isOwner: false,
  isFirstReviewer: false,
  isSecondReviewer: false,
  isMaintainer: false,
  canManageMembers: false,
  canFirstReview: false,
  canSecondReview: false,
  canReview: false,
  canSubmit: false,
  skipsFirstReview: false,
}

/**
 * 判断当前用户在某知识库中的角色（多级审核）
 *
 * 角色优先级：创建者 > 复审人 > 初审人 > 维护人员
 * 审核能力：
 * - 初审：初审人、创建者
 * - 复审：复审人、创建者
 */
export function useKBRole(kbId: string | undefined): UseKBRoleResult {
  const { currentUser } = useAuth()

  return useMemo(() => {
    if (!kbId) return EMPTY

    const kb = KNOWLEDGE_BASES.find((k) => k.id === kbId)
    if (!kb) return EMPTY

    const userId = currentUser.id
    const isOwner = kb.ownerId === userId
    const isSecondReviewer = kb.secondReviewerIds.includes(userId)
    const isFirstReviewer = kb.firstReviewerIds.includes(userId)
    const isMaintainer = kb.maintainerIds.includes(userId)

    let role: KBRole | null = null
    if (isOwner) role = "owner"
    else if (isSecondReviewer) role = "second_reviewer"
    else if (isFirstReviewer) role = "first_reviewer"
    else if (isMaintainer) role = "maintainer"

    const canFirstReview = isOwner || isFirstReviewer
    const canSecondReview = isOwner || isSecondReviewer

    return {
      role,
      isOwner,
      isFirstReviewer,
      isSecondReviewer,
      isMaintainer,
      // 创建者管理成员
      canManageMembers: isOwner,
      canFirstReview,
      canSecondReview,
      canReview: canFirstReview || canSecondReview,
      // 所有成员均可提交变更（操作需按角色走审核流程）
      canSubmit: isMaintainer || isFirstReviewer || isSecondReviewer || isOwner,
      // 初审人及以上提交时跳过初审
      skipsFirstReview: isFirstReviewer || isSecondReviewer || isOwner,
    }
  }, [kbId, currentUser.id])
}
