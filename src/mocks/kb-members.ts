/**
 * 知识库成员附加信息：加入时间等
 * 主成员关系（owner/admin/maintainer）仍存在 KnowledgeBase 上
 */
export interface KBMember {
  kbId: string
  userId: string
  joinedAt: string
}

/** Mock 成员加入时间 */
export const KB_MEMBERS: KBMember[] = [
  // hfut
  { kbId: "hfut", userId: "u-admin-001", joinedAt: "2026-04-01T09:00:00" },
  { kbId: "hfut", userId: "u-teacher-001", joinedAt: "2026-04-15T14:30:00" },
  { kbId: "hfut", userId: "u-teacher-003", joinedAt: "2026-05-08T10:00:00" },
  { kbId: "hfut", userId: "u-teacher-002", joinedAt: "2026-04-20T16:00:00" },
  { kbId: "hfut", userId: "u-teacher-004", joinedAt: "2026-06-05T10:30:00" },
  // qw
  { kbId: "qw", userId: "u-admin-001", joinedAt: "2026-05-01T11:00:00" },
  { kbId: "qw", userId: "u-teacher-001", joinedAt: "2026-05-10T15:00:00" },
  { kbId: "qw", userId: "u-teacher-002", joinedAt: "2026-05-12T09:00:00" },
]

/** 查找加入时间 */
export function getMemberJoinedAt(
  kbId: string,
  userId: string,
): string | undefined {
  return KB_MEMBERS.find((m) => m.kbId === kbId && m.userId === userId)
    ?.joinedAt
}
