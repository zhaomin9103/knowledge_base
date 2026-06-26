import type { User } from "./users"

/** 审核记录状态（简化版） */
export type ReviewStatus =
  | "pending"    // 待审核
  | "approved"   // 已通过
  | "rejected"   // 已拒绝

/** 操作类型 */
export type OperationType = "add" | "update" | "delete"

/** 审核意见 */
export interface ReviewDecision {
  reviewerId: string
  reviewerName: string
  reviewerIdNo?: string
  result: "approved" | "rejected"
  reason?: string // 拒绝原因（必填）
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

  /** 变更说明（维护人员提交时填写） */
  changeDescription: string

  /** 审核状态 */
  status: ReviewStatus

  /** 审核意见（通过/拒绝后填充） */
  review?: ReviewDecision

  /** 生效的版本号（approved 后填） */
  appliedVersion?: number

  createdAt: string
}

/** Mock 审核记录 */
export const REVIEW_REQUESTS: ReviewRequest[] = [
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
    status: "pending",
    createdAt: "2026-06-11T09:30:00",
  },
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
    status: "pending",
    createdAt: "2026-06-11T08:45:00",
  },
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
    review: {
      reviewerId: "u-admin-001",
      reviewerName: "admin",
      reviewerIdNo: "A20180001",
      result: "approved",
      reviewedAt: "2026-06-10T15:00:00",
    },
    appliedVersion: 3,
    createdAt: "2026-06-10T13:50:00",
  },
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
    review: {
      reviewerId: "u-teacher-001",
      reviewerName: "李明",
      reviewerIdNo: "T20190101",
      result: "rejected",
      reason: "文档格式不符合要求，请转为 docx 后重新提交",
      reviewedAt: "2026-06-09T16:30:00",
    },
    createdAt: "2026-06-09T14:20:00",
  },
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
    review: {
      reviewerId: "u-teacher-001",
      reviewerName: "李明",
      reviewerIdNo: "T20190101",
      result: "approved",
      reviewedAt: "2026-06-08T11:20:00",
    },
    appliedVersion: 2,
    createdAt: "2026-06-08T09:10:00",
  },
  {
    id: "rr-006",
    kbId: "hfut",
    submitter: {
      id: "u-teacher-004",
      name: "刘洋",
      organization: "教务处",
      idNo: "T20210808",
    },
    operation: "add",
    documentName: "心理健康中心咨询预约流程.md",
    documentExt: "md",
    fileSizeBytes: 8_400,
    changeDescription: "新增心理咨询预约指引",
    status: "approved",
    review: {
      reviewerId: "u-admin-001",
      reviewerName: "admin",
      reviewerIdNo: "A20180001",
      result: "approved",
      reviewedAt: "2026-06-07T14:05:00",
    },
    appliedVersion: 1,
    createdAt: "2026-06-07T10:30:00",
  },
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
    review: {
      reviewerId: "u-admin-001",
      reviewerName: "admin",
      reviewerIdNo: "A20180001",
      result: "rejected",
      reason: "该文档仍有归档价值，建议保留，仅做下架处理",
      reviewedAt: "2026-06-06T16:45:00",
    },
    createdAt: "2026-06-06T15:00:00",
  },
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
    status: "pending",
    createdAt: "2026-06-11T16:20:00",
  },
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
    status: "pending",
    createdAt: "2026-06-11T14:50:00",
  },
]
