import type { User } from "./users"

/**
 * 审核记录状态（多级审核）
 * 提交后先待初审，初审通过进入待复审，复审通过才生效。
 * 任一级驳回即终态 rejected。
 */
export type ReviewStatus =
  | "pending_first"  // 待初审
  | "pending_second" // 待复审（初审已通过）
  | "approved"       // 已通过（两级都通过后生效）
  | "rejected"       // 已驳回（任一级驳回）

/** 审核环节 */
export type ReviewStage = "first" | "second"

/** 操作类型 */
export type OperationType = "add" | "update" | "delete"

/** 单个环节的审核意见 */
export interface ReviewDecision {
  /** 该意见属于哪个环节 */
  stage: ReviewStage
  reviewerId: string
  reviewerName: string
  reviewerIdNo?: string
  result: "approved" | "rejected"
  /** 初审直接通过时为 true，转入复审时为 false（仅 stage=first 时有效） */
  skipSecondReview?: boolean
  /** 驳回原因（驳回时必填）/ 初审直接通过的可选说明 */
  reason?: string
  reviewedAt: string
}

/** 审核记录 */
export interface ReviewRequest {
  id: string
  kbId: string
  submitter: Pick<User, "id" | "name" | "organization" | "idNo">

  /** 操作类型 */
  operation: OperationType

  /** 文件相关 */
  documentId?: string // update/delete 时填
  documentName: string
  documentExt: string // 文件扩展名
  fileSizeBytes?: number

  /** 变更说明（提交时填写） */
  changeDescription: string

  /** 审核状态 */
  status: ReviewStatus

  /**
   * 是否跳过初审。
   * 当提交人本身就是初审人（或更高角色）时，其提交无需初审，
   * 直接进入复审环节。此时 firstReview 恒为空。
   */
  skipFirstReview?: boolean

  /** 初审意见（初审环节做出决定后填充） */
  firstReview?: ReviewDecision
  /** 复审意见（复审环节做出决定后填充） */
  secondReview?: ReviewDecision

  /** 生效的版本号（复审通过 approved 后填） */
  appliedVersion?: number

  /** 乐观锁版本号，每次更新递增，防止并发冲突 */
  version: number

  createdAt: string
  /** 最后更新时间，配合 version 实现乐观锁 */
  updatedAt: string
}

/** 该记录当前处于哪个待审环节；已终结返回 null */
export function pendingStage(review: ReviewRequest): ReviewStage | null {
  if (review.status === "pending_first") return "first"
  if (review.status === "pending_second") return "second"
  return null
}

/** 是否已审结（通过或驳回） */
export function isSettled(review: ReviewRequest): boolean {
  return review.status === "approved" || review.status === "rejected"
}

/** 驳回记录：取被驳回环节的意见 */
export function getRejectedDecision(
  review: ReviewRequest,
): ReviewDecision | undefined {
  if (review.status !== "rejected") return undefined
  if (review.firstReview?.result === "rejected") return review.firstReview
  if (review.secondReview?.result === "rejected") return review.secondReview
  return undefined
}

/** 终审（复审）意见：用于版本派生等只关心最终生效人的场景 */
export function getFinalDecision(
  review: ReviewRequest,
): ReviewDecision | undefined {
  return review.secondReview
}

/**
 * 对一条审核记录在某环节做出决定，返回更新后的新记录（不可变）。
 * - 初审通过 → 进入 pending_second
 * - 复审通过 → approved，并生成 appliedVersion
 * - 任一级驳回 → rejected
 */
export function applyDecision(
  review: ReviewRequest,
  stage: ReviewStage,
  decision: Omit<ReviewDecision, "stage">,
  nextVersion?: number,
): ReviewRequest {
  const fullDecision: ReviewDecision = { ...decision, stage }
  const now = new Date().toISOString()

  if (decision.result === "rejected") {
    return {
      ...review,
      status: "rejected",
      version: review.version + 1,
      updatedAt: now,
      ...(stage === "first"
        ? { firstReview: fullDecision }
        : { secondReview: fullDecision }),
    }
  }

  // 通过
  if (stage === "first") {
    return {
      ...review,
      status: "pending_second",
      version: review.version + 1,
      updatedAt: now,
      firstReview: fullDecision,
    }
  }

  // 复审通过 → 生效
  return {
    ...review,
    status: "approved",
    version: review.version + 1,
    updatedAt: now,
    secondReview: fullDecision,
    appliedVersion: nextVersion,
  }
}

/**
 * 初审通过并直接生效（跳过复审）
 * @param review 待初审的记录
 * @param decision 初审决策（必须包含 skipSecondReview: true）
 * @param nextVersion 生成的版本号
 */
export function applyFirstApprovalFinal(
  review: ReviewRequest,
  decision: Omit<ReviewDecision, "stage">,
  nextVersion: number,
): ReviewRequest {
  const now = new Date().toISOString()
  return {
    ...review,
    status: "approved",
    version: review.version + 1,
    updatedAt: now,
    firstReview: {
      ...decision,
      stage: "first",
      skipSecondReview: true,
    },
    appliedVersion: nextVersion,
  }
}

/**
 * 初审通过并提交复审
 * @param review 待初审的记录
 * @param decision 初审决策（skipSecondReview: false）
 */
export function applyFirstApprovalForward(
  review: ReviewRequest,
  decision: Omit<ReviewDecision, "stage">,
): ReviewRequest {
  const now = new Date().toISOString()
  return {
    ...review,
    status: "pending_second",
    version: review.version + 1,
    updatedAt: now,
    firstReview: {
      ...decision,
      stage: "first",
      skipSecondReview: false,
    },
  }
}

/** Mock 审核记录 */
export const REVIEW_REQUESTS: ReviewRequest[] = [
  // 维护人员提交，尚在待初审
  {
    id: "rr-001",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-002",
      name: "王芳",
      organization: "计算机与信息学院",
      idNo: "T20200215",
    },
    operation: "add",
    documentName: "2026年奖学金评定细则.docx",
    documentExt: "docx",
    fileSizeBytes: 45_600,
    changeDescription: "新增 2026 年奖学金评定政策文档",
    status: "pending_first",
    version: 1,
    createdAt: "2026-06-11T09:30:00",
    updatedAt: "2026-06-11T09:30:00",
  },
  // 维护人员提交，初审已通过，等待复审
  {
    id: "rr-002",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-004",
      name: "刘洋",
      organization: "教务处",
      idNo: "T20210808",
    },
    operation: "update",
    documentId: "doc-6",
    documentName: "18.合肥工业大学（合肥校区）在期学生社团一览表.docx",
    documentExt: "docx",
    fileSizeBytes: 12_300,
    changeDescription: "更新 2026 年最新社团名单",
    status: "pending_second",
    firstReview: {
      stage: "first",
      reviewerId: "u-teacher-003",
      reviewerName: "张强",
      reviewerIdNo: "T20180520",
      result: "approved",
      skipSecondReview: false,
      reviewedAt: "2026-06-11T10:15:00",
    },
    version: 2,
    createdAt: "2026-06-11T08:45:00",
    updatedAt: "2026-06-11T10:15:00",
  },
  // 两级都通过，已生效
  {
    id: "rr-003",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-002",
      name: "王芳",
      organization: "计算机与信息学院",
      idNo: "T20200215",
    },
    operation: "delete",
    documentId: "doc-8",
    documentName: "2025-8-21各学院大学生发展辅导中心主任名单及联系电话.docx",
    documentExt: "docx",
    changeDescription: "文档已过期，删除旧版联系方式",
    status: "approved",
    firstReview: {
      stage: "first",
      reviewerId: "u-teacher-003",
      reviewerName: "张强",
      reviewerIdNo: "T20180520",
      result: "approved",
      skipSecondReview: false,
      reviewedAt: "2026-06-10T14:20:00",
    },
    secondReview: {
      stage: "second",
      reviewerId: "u-admin-001",
      reviewerName: "admin",
      reviewerIdNo: "A20180001",
      result: "approved",
      reviewedAt: "2026-06-10T15:00:00",
    },
    appliedVersion: 3,
    version: 3,
    createdAt: "2026-06-10T13:50:00",
    updatedAt: "2026-06-10T15:00:00",
  },
  // 初审驳回（文件格式问题）
  {
    id: "rr-004",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-004",
      name: "刘洋",
      organization: "教务处",
      idNo: "T20210808",
    },
    operation: "add",
    documentName: "2026春季学期选课指南.pdf",
    documentExt: "pdf",
    fileSizeBytes: 890_000,
    changeDescription: "添加春季选课流程说明",
    status: "rejected",
    firstReview: {
      stage: "first",
      reviewerId: "u-teacher-003",
      reviewerName: "张强",
      reviewerIdNo: "T20180520",
      result: "rejected",
      reason: "文档格式不符合要求，请转为 docx 后重新提交",
      reviewedAt: "2026-06-09T16:30:00",
    },
    version: 2,
    createdAt: "2026-06-09T14:20:00",
    updatedAt: "2026-06-09T16:30:00",
  },
  // 两级都通过，已生效
  {
    id: "rr-005",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-002",
      name: "王芳",
      organization: "计算机与信息学院",
      idNo: "T20200215",
    },
    operation: "update",
    documentId: "doc-2",
    documentName: "2025-2026学年第一学期通识教育选修课程简介.docx",
    documentExt: "docx",
    fileSizeBytes: 1_280_000,
    changeDescription: "补充慕课类课程的开课时间与学分说明",
    status: "approved",
    firstReview: {
      stage: "first",
      reviewerId: "u-teacher-003",
      reviewerName: "张强",
      reviewerIdNo: "T20180520",
      result: "approved",
      skipSecondReview: false,
      reviewedAt: "2026-06-08T10:30:00",
    },
    secondReview: {
      stage: "second",
      reviewerId: "u-teacher-001",
      reviewerName: "李明",
      reviewerIdNo: "T20190101",
      result: "approved",
      reviewedAt: "2026-06-08T11:20:00",
    },
    appliedVersion: 2,
    version: 3,
    createdAt: "2026-06-08T09:10:00",
    updatedAt: "2026-06-08T11:20:00",
  },
  // 初审人（李明）本人提交，跳过初审，复审通过后生效
  {
    id: "rr-006",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-001",
      name: "李明",
      organization: "计算机与信息学院",
      idNo: "T20190101",
    },
    operation: "add",
    documentName: "心理健康中心咨询预约流程.md",
    documentExt: "md",
    fileSizeBytes: 8_400,
    changeDescription: "新增心理咨询预约指引",
    status: "approved",
    skipFirstReview: true,
    secondReview: {
      stage: "second",
      reviewerId: "u-admin-001",
      reviewerName: "admin",
      reviewerIdNo: "A20180001",
      result: "approved",
      reviewedAt: "2026-06-07T14:05:00",
    },
    appliedVersion: 1,
    version: 2,
    createdAt: "2026-06-07T10:30:00",
    updatedAt: "2026-06-07T14:05:00",
  },
  // 复审驳回（初审已通过，复审否决）
  {
    id: "rr-007",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-002",
      name: "王芳",
      organization: "计算机与信息学院",
      idNo: "T20200215",
    },
    operation: "delete",
    documentId: "doc-old-1",
    documentName: "2024年迎新工作安排（已废止）.docx",
    documentExt: "docx",
    fileSizeBytes: 30_000,
    changeDescription: "该文档已废止，申请删除",
    status: "rejected",
    firstReview: {
      stage: "first",
      reviewerId: "u-teacher-003",
      reviewerName: "张强",
      reviewerIdNo: "T20180520",
      result: "approved",
      skipSecondReview: false,
      reviewedAt: "2026-06-06T15:40:00",
    },
    secondReview: {
      stage: "second",
      reviewerId: "u-admin-001",
      reviewerName: "admin",
      reviewerIdNo: "A20180001",
      result: "rejected",
      reason: "该文档仍有归档价值，建议保留，仅做下架处理",
      reviewedAt: "2026-06-06T16:45:00",
    },
    version: 3,
    createdAt: "2026-06-06T15:00:00",
    updatedAt: "2026-06-06T16:45:00",
  },
  // 维护人员提交，尚在待初审
  {
    id: "rr-008",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-002",
      name: "王芳",
      organization: "计算机与信息学院",
      idNo: "T20200215",
    },
    operation: "add",
    documentName: "学生心理危机干预流程指南.pdf",
    documentExt: "pdf",
    fileSizeBytes: 520_000,
    changeDescription: "补充心理危机干预操作规范",
    status: "pending_first",
    version: 1,
    createdAt: "2026-06-11T16:20:00",
    updatedAt: "2026-06-11T16:20:00",
  },
  // 维护人员提交，初审已通过，等待复审
  {
    id: "rr-009",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-004",
      name: "刘洋",
      organization: "教务处",
      idNo: "T20210808",
    },
    operation: "update",
    documentId: "doc-3",
    documentName: "合肥工业大学（合肥校区）学生违纪处分条例.docx",
    documentExt: "docx",
    fileSizeBytes: 89_000,
    changeDescription: "根据2026年最新规定更新处分标准",
    status: "pending_second",
    firstReview: {
      stage: "first",
      reviewerId: "u-teacher-003",
      reviewerName: "张强",
      reviewerIdNo: "T20180520",
      result: "approved",
      skipSecondReview: false,
      reviewedAt: "2026-06-11T15:30:00",
    },
    version: 2,
    createdAt: "2026-06-11T14:50:00",
    updatedAt: "2026-06-11T15:30:00",
  },
  // 【新增】初审直接通过并生效的示例（v3.0 新增功能）
  {
    id: "rr-010",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-004",
      name: "刘洋",
      organization: "教务处",
      idNo: "T20210808",
    },
    operation: "add",
    documentName: "2026年图书馆开放时间调整通知.docx",
    documentExt: "docx",
    fileSizeBytes: 15_800,
    changeDescription: "图书馆延长开放时间通知",
    status: "approved",
    firstReview: {
      stage: "first",
      reviewerId: "u-teacher-003",
      reviewerName: "张强",
      reviewerIdNo: "T20180520",
      result: "approved",
      skipSecondReview: true,
      reason: "常规通知类文档，无需复审",
      reviewedAt: "2026-06-12T09:20:00",
    },
    appliedVersion: 4,
    version: 2,
    createdAt: "2026-06-12T09:00:00",
    updatedAt: "2026-06-12T09:20:00",
  },
  // 【新增】初审人（张强）本人提交的记录 - 待复审
  {
    id: "rr-011",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-003",
      name: "张强",
      organization: "学生工作处",
      idNo: "T20180520",
    },
    operation: "add",
    documentName: "2026年学生宿舍管理规定.docx",
    documentExt: "docx",
    fileSizeBytes: 52_000,
    changeDescription: "更新宿舍管理规定，增加安全条款",
    status: "pending_second",
    skipFirstReview: true,
    version: 1,
    createdAt: "2026-06-12T14:30:00",
    updatedAt: "2026-06-12T14:30:00",
  },
  // 【新增】初审人（张强）本人提交的记录 - 已通过
  {
    id: "rr-012",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-003",
      name: "张强",
      organization: "学生工作处",
      idNo: "T20180520",
    },
    operation: "update",
    documentId: "doc-7",
    documentName: "学生活动场地预约流程.md",
    documentExt: "md",
    fileSizeBytes: 8_900,
    changeDescription: "简化预约流程说明",
    status: "approved",
    skipFirstReview: true,
    secondReview: {
      stage: "second",
      reviewerId: "u-teacher-001",
      reviewerName: "李明",
      reviewerIdNo: "T20190101",
      result: "approved",
      reviewedAt: "2026-06-11T16:45:00",
    },
    appliedVersion: 5,
    version: 2,
    createdAt: "2026-06-11T15:00:00",
    updatedAt: "2026-06-11T16:45:00",
  },
  // 【新增】初审人（张强）提交 - 待复审
  {
    id: "rr-013",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-003",
      name: "张强",
      organization: "学生工作处",
      idNo: "T20180520",
    },
    operation: "add",
    documentName: "2026年寒假值班安排表.xlsx",
    documentExt: "xlsx",
    fileSizeBytes: 24_500,
    changeDescription: "新增寒假值班安排",
    status: "pending_second",
    skipFirstReview: true,
    version: 1,
    createdAt: "2026-06-13T09:15:00",
    updatedAt: "2026-06-13T09:15:00",
  },
  // 【新增】初审人（张强）提交 - 已驳回
  {
    id: "rr-014",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-003",
      name: "张强",
      organization: "学生工作处",
      idNo: "T20180520",
    },
    operation: "delete",
    documentId: "doc-old-2",
    documentName: "2024年运动会安排（已废止）.pdf",
    documentExt: "pdf",
    fileSizeBytes: 340_000,
    changeDescription: "删除过期文档",
    status: "rejected",
    skipFirstReview: true,
    secondReview: {
      stage: "second",
      reviewerId: "u-admin-001",
      reviewerName: "admin",
      reviewerIdNo: "A20180001",
      result: "rejected",
      reason: "该文档涉及历史活动记录，建议归档而非删除",
      reviewedAt: "2026-06-12T17:30:00",
    },
    version: 2,
    createdAt: "2026-06-12T16:50:00",
    updatedAt: "2026-06-12T17:30:00",
  },
  // 【新增】复审人（李明）本人提交 - 已生效
  {
    id: "rr-015",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-001",
      name: "李明",
      organization: "计算机与信息学院",
      idNo: "T20190101",
    },
    operation: "add",
    documentName: "AI辅导员使用手册v2.0.pdf",
    documentExt: "pdf",
    fileSizeBytes: 1_560_000,
    changeDescription: "更新AI辅导员操作手册",
    status: "approved",
    appliedVersion: 6,
    version: 1,
    createdAt: "2026-06-13T10:30:00",
    updatedAt: "2026-06-13T10:30:00",
  },
  // 【新增】复审人（李明）本人提交 - 已生效
  {
    id: "rr-016",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-001",
      name: "李明",
      organization: "计算机与信息学院",
      idNo: "T20190101",
    },
    operation: "update",
    documentId: "doc-4",
    documentName: "学生心理健康教育指南.docx",
    documentExt: "docx",
    fileSizeBytes: 780_000,
    changeDescription: "补充心理危机干预流程",
    status: "approved",
    appliedVersion: 7,
    version: 1,
    createdAt: "2026-06-12T14:00:00",
    updatedAt: "2026-06-12T14:00:00",
  },
  // 【新增】复审人（李明）本人提交 - 已生效
  {
    id: "rr-017",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-001",
      name: "李明",
      organization: "计算机与信息学院",
      idNo: "T20190101",
    },
    operation: "delete",
    documentId: "doc-old-3",
    documentName: "2023年迎新志愿者名单.xlsx",
    documentExt: "xlsx",
    fileSizeBytes: 45_000,
    changeDescription: "删除过期名单文件",
    status: "approved",
    appliedVersion: 8,
    version: 1,
    createdAt: "2026-06-11T11:20:00",
    updatedAt: "2026-06-11T11:20:00",
  },
  // 【新增】复审人（李明）本人提交 - 已生效
  {
    id: "rr-021",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-001",
      name: "李明",
      organization: "计算机与信息学院",
      idNo: "T20190101",
    },
    operation: "add",
    documentName: "毕业生就业指导手册.pdf",
    documentExt: "pdf",
    fileSizeBytes: 2_340_000,
    changeDescription: "新增就业指导相关文档",
    status: "approved",
    appliedVersion: 10,
    version: 1,
    createdAt: "2026-06-13T16:45:00",
    updatedAt: "2026-06-13T16:45:00",
  },
  // 【新增】复审人（李明）本人提交 - 已生效
  {
    id: "rr-022",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-001",
      name: "李明",
      organization: "计算机与信息学院",
      idNo: "T20190101",
    },
    operation: "update",
    documentId: "doc-6",
    documentName: "学生奖学金评定办法.docx",
    documentExt: "docx",
    fileSizeBytes: 450_000,
    changeDescription: "更新奖学金评定标准",
    status: "approved",
    appliedVersion: 11,
    version: 1,
    createdAt: "2026-06-12T08:30:00",
    updatedAt: "2026-06-12T08:30:00",
  },
  // 【新增】复审人（李明）本人提交 - 已生效
  {
    id: "rr-023",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-001",
      name: "李明",
      organization: "计算机与信息学院",
      idNo: "T20190101",
    },
    operation: "add",
    documentName: "新生入学须知2026.docx",
    documentExt: "docx",
    fileSizeBytes: 680_000,
    changeDescription: "发布2026级新生入学须知",
    status: "approved",
    appliedVersion: 12,
    version: 1,
    createdAt: "2026-06-10T14:20:00",
    updatedAt: "2026-06-10T14:20:00",
  },
  // 【新增】创建者（admin）本人提交 - 待复审
  {
    id: "rr-018",
    kbId: "hfut",
    submitter: {
      id: "u-admin-001",
      name: "admin",
      organization: "系统管理",
      idNo: "A20180001",
    },
    operation: "add",
    documentName: "知识库管理规范v3.0.docx",
    documentExt: "docx",
    fileSizeBytes: 125_000,
    changeDescription: "更新知识库管理规范，增加多级审核说明",
    status: "pending_second",
    skipFirstReview: true,
    version: 1,
    createdAt: "2026-06-13T13:45:00",
    updatedAt: "2026-06-13T13:45:00",
  },
  // 【新增】创建者（admin）本人提交 - 已通过
  {
    id: "rr-019",
    kbId: "hfut",
    submitter: {
      id: "u-admin-001",
      name: "admin",
      organization: "系统管理",
      idNo: "A20180001",
    },
    operation: "update",
    documentId: "doc-9",
    documentName: "系统使用说明.md",
    documentExt: "md",
    fileSizeBytes: 32_000,
    changeDescription: "更新系统登录和权限说明",
    status: "approved",
    skipFirstReview: true,
    secondReview: {
      stage: "second",
      reviewerId: "u-teacher-001",
      reviewerName: "李明",
      reviewerIdNo: "T20190101",
      result: "approved",
      reviewedAt: "2026-06-12T10:30:00",
    },
    appliedVersion: 9,
    version: 2,
    createdAt: "2026-06-12T09:45:00",
    updatedAt: "2026-06-12T10:30:00",
  },
  // 【新增】创建者（admin）本人提交 - 待复审
  {
    id: "rr-020",
    kbId: "hfut",
    submitter: {
      id: "u-admin-001",
      name: "admin",
      organization: "系统管理",
      idNo: "A20180001",
    },
    operation: "add",
    documentName: "数据备份与恢复流程.pdf",
    documentExt: "pdf",
    fileSizeBytes: 890_000,
    changeDescription: "新增数据备份规范文档",
    status: "pending_second",
    skipFirstReview: true,
    version: 1,
    createdAt: "2026-06-13T15:20:00",
    updatedAt: "2026-06-13T15:20:00",
  },
  // 【新增】初审人（张强）本人提交 - 初审直接生效（未走复审）
  {
    id: "rr-024",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-003",
      name: "张强",
      organization: "学生工作处",
      idNo: "T20180520",
    },
    operation: "add",
    documentName: "2026年春季学生资助政策通知.docx",
    documentExt: "docx",
    fileSizeBytes: 46_000,
    changeDescription: "发布春季学生资助政策，常规通知类文档",
    status: "approved",
    skipFirstReview: true,
    firstReview: {
      stage: "first",
      reviewerId: "u-teacher-003",
      reviewerName: "张强",
      reviewerIdNo: "T20180520",
      result: "approved",
      skipSecondReview: true,
      reason: "常规通知类文档，本人具备初审权限，直接生效",
      reviewedAt: "2026-06-14T09:10:00",
    },
    appliedVersion: 13,
    version: 1,
    createdAt: "2026-06-14T09:10:00",
    updatedAt: "2026-06-14T09:10:00",
  },
  // 【新增】初审人（张强）本人提交 - 初审直接生效（未走复审）
  {
    id: "rr-025",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-003",
      name: "张强",
      organization: "学生工作处",
      idNo: "T20180520",
    },
    operation: "update",
    documentId: "doc-11",
    documentName: "学生请假审批流程说明.md",
    documentExt: "md",
    fileSizeBytes: 11_200,
    changeDescription: "修正请假审批时限描述，小幅文字调整",
    status: "approved",
    skipFirstReview: true,
    firstReview: {
      stage: "first",
      reviewerId: "u-teacher-003",
      reviewerName: "张强",
      reviewerIdNo: "T20180520",
      result: "approved",
      skipSecondReview: true,
      reason: "小幅文字修正，直接生效",
      reviewedAt: "2026-06-14T11:25:00",
    },
    appliedVersion: 14,
    version: 2,
    createdAt: "2026-06-14T11:20:00",
    updatedAt: "2026-06-14T11:25:00",
  },
  // 【新增】创建者（admin）本人提交 - 初审直接生效（未走复审）
  {
    id: "rr-026",
    kbId: "hfut",
    submitter: {
      id: "u-admin-001",
      name: "admin",
      organization: "系统管理",
      idNo: "A20180001",
    },
    operation: "add",
    documentName: "知识库常见问题FAQ.md",
    documentExt: "md",
    fileSizeBytes: 18_600,
    changeDescription: "新增知识库使用常见问题解答",
    status: "approved",
    skipFirstReview: true,
    firstReview: {
      stage: "first",
      reviewerId: "u-admin-001",
      reviewerName: "admin",
      reviewerIdNo: "A20180001",
      result: "approved",
      skipSecondReview: true,
      reason: "创建者维护的说明文档，直接生效",
      reviewedAt: "2026-06-14T14:00:00",
    },
    appliedVersion: 15,
    version: 1,
    createdAt: "2026-06-14T14:00:00",
    updatedAt: "2026-06-14T14:00:00",
  },
  // 【新增】创建者（admin）本人提交 - 初审直接生效（未走复审）
  {
    id: "rr-027",
    kbId: "hfut",
    submitter: {
      id: "u-admin-001",
      name: "admin",
      organization: "系统管理",
      idNo: "A20180001",
    },
    operation: "update",
    documentId: "doc-9",
    documentName: "系统使用说明.md",
    documentExt: "md",
    fileSizeBytes: 33_500,
    changeDescription: "补充移动端登录说明",
    status: "approved",
    skipFirstReview: true,
    firstReview: {
      stage: "first",
      reviewerId: "u-admin-001",
      reviewerName: "admin",
      reviewerIdNo: "A20180001",
      result: "approved",
      skipSecondReview: true,
      reason: "创建者直接维护，直接生效",
      reviewedAt: "2026-06-14T16:30:00",
    },
    appliedVersion: 16,
    version: 3,
    createdAt: "2026-06-14T16:28:00",
    updatedAt: "2026-06-14T16:30:00",
  },
]
