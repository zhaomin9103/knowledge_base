export interface KnowledgeBase {
  id: string
  name: string
  /** 分类标签，如「通用」 */
  category: string
  /** 文件数量 */
  fileCount: number
  /** 总大小（单位 MB） */
  sizeMB: number
  /** 创建人 */
  creator: string
  /** 封面图，可选；为空时使用文档图标占位 */
  cover?: string
  /** 更新时间 ISO 字符串 */
  updatedAt: string

  /** 权限相关 */
  ownerId: string             // 创建者
  firstReviewerIds: string[]  // 初审人列表
  secondReviewerIds: string[] // 复审人列表（原「管理员」角色）
  maintainerIds: string[]     // 维护人员列表
  currentVersion: number      // 当前版本号
}

export const KNOWLEDGE_BASES: KnowledgeBase[] = [
  {
    id: "qw",
    name: "qw",
    category: "通用",
    fileCount: 7,
    sizeMB: 3.7,
    creator: "admin",
    cover:
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=400&fit=crop",
    updatedAt: "2026-05-29T16:09:00",
    ownerId: "u-admin-001",
    firstReviewerIds: ["u-teacher-003"],
    secondReviewerIds: ["u-teacher-001"],
    maintainerIds: ["u-teacher-002"],
    currentVersion: 1,
  },
  {
    id: "hfut",
    name: "合工大",
    category: "通用",
    fileCount: 8,
    sizeMB: 2.1,
    creator: "admin",
    updatedAt: "2026-05-25T10:52:00",
    ownerId: "u-admin-001",
    firstReviewerIds: ["u-teacher-003"],
    secondReviewerIds: ["u-teacher-001"],
    maintainerIds: ["u-teacher-002", "u-teacher-004"],
    currentVersion: 3,
  },
]
