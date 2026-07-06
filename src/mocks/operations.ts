import {
  REVIEW_REQUESTS,
  type OperationType,
  type ReviewDecision,
} from "./reviews"
import { MOCK_USERS, type User } from "./users"

/** 操作类型 */
export type ActionType =
  | "submit_add" // 提交新增
  | "submit_update" // 提交更新
  | "submit_delete" // 提交删除
  | "first_approve" // 初审通过
  | "first_reject" // 初审驳回
  | "second_approve" // 复审通过
  | "second_reject" // 复审驳回
  // 预留扩展
  | "add_member"
  | "remove_member"
  | "change_role"
  | "rollback"

/** 操作日志 */
export interface OperationLog {
  id: string
  kbId: string
  /** 操作时间 */
  timestamp: string
  /** 操作人 */
  actor: Pick<User, "id" | "name" | "idNo" | "organization">
  /** 操作类型 */
  action: ActionType
  /** 操作对象 */
  target: {
    type: "document" | "member" | "version"
    name: string
    /** 文档扩展名（用于显示图标） */
    ext?: string
  }
  /** 关联的审核请求 ID（用于跳转查看） */
  reviewRequestId?: string
  /** 备注：驳回原因 / 生效版本号 */
  meta?: {
    reason?: string
    version?: number
  }
}

/** 审核操作 → ActionType 映射 */
const SUBMIT_ACTION_MAP: Record<OperationType, ActionType> = {
  add: "submit_add",
  update: "submit_update",
  delete: "submit_delete",
}

/**
 * 从审核请求派生操作日志
 * - 每条请求生成 1 条提交日志（提交时间 / 提交人）
 * - 初审有结论时生成 1 条初审日志
 * - 复审有结论时生成 1 条复审日志
 */
function deriveLogsFromReviews(): OperationLog[] {
  const logs: OperationLog[] = []

  REVIEW_REQUESTS.forEach((rr) => {
    const submitter = MOCK_USERS.find((u) => u.id === rr.submitter.id)
    if (!submitter) return

    // 1. 提交日志（每条请求都有）
    logs.push({
      id: `log-${rr.id}-submit`,
      kbId: rr.kbId,
      timestamp: rr.createdAt,
      actor: {
        id: submitter.id,
        name: submitter.name,
        idNo: submitter.idNo,
        organization: submitter.organization,
      },
      action: SUBMIT_ACTION_MAP[rr.operation],
      target: {
        type: "document",
        name: rr.documentName,
        ext: rr.documentExt,
      },
      reviewRequestId: rr.id,
    })

    // 2. 初审日志
    if (rr.firstReview) {
      pushReviewLog(logs, rr.id, rr.kbId, rr.documentName, rr.documentExt, {
        decision: rr.firstReview,
        approveAction: "first_approve",
        rejectAction: "first_reject",
        // 初审通过不生成版本，仅复审通过才落版本
        version: undefined,
      })
    }

    // 3. 复审日志
    if (rr.secondReview) {
      pushReviewLog(logs, rr.id, rr.kbId, rr.documentName, rr.documentExt, {
        decision: rr.secondReview,
        approveAction: "second_approve",
        rejectAction: "second_reject",
        version: rr.appliedVersion,
      })
    }
  })

  return logs
}

function pushReviewLog(
  logs: OperationLog[],
  reviewId: string,
  kbId: string,
  documentName: string,
  documentExt: string,
  opts: {
    decision: ReviewDecision
    approveAction: ActionType
    rejectAction: ActionType
    version?: number
  },
) {
  const { decision, approveAction, rejectAction, version } = opts
  const reviewer = MOCK_USERS.find((u) => u.id === decision.reviewerId)
  if (!reviewer) return

  const approved = decision.result === "approved"
  logs.push({
    id: `log-${reviewId}-${decision.stage}`,
    kbId,
    timestamp: decision.reviewedAt,
    actor: {
      id: reviewer.id,
      name: reviewer.name,
      idNo: reviewer.idNo,
      organization: reviewer.organization,
    },
    action: approved ? approveAction : rejectAction,
    target: {
      type: "document",
      name: documentName,
      ext: documentExt,
    },
    reviewRequestId: reviewId,
    meta: {
      reason: decision.reason,
      version: approved ? version : undefined,
    },
  })
}

/** 额外的非审核类操作日志（成员变更等，演示用） */
const EXTRA_LOGS: OperationLog[] = [
  {
    id: "log-member-001",
    kbId: "hfut",
    timestamp: "2026-06-05T10:30:00",
    actor: {
      id: "u-admin-001",
      name: "admin",
      idNo: "A20180001",
      organization: "信息化办公室",
    },
    action: "add_member",
    target: { type: "member", name: "刘洋（教务处）" },
  },
  {
    id: "log-member-002",
    kbId: "hfut",
    timestamp: "2026-06-04T14:15:00",
    actor: {
      id: "u-admin-001",
      name: "admin",
      idNo: "A20180001",
      organization: "信息化办公室",
    },
    action: "change_role",
    target: { type: "member", name: "李明（复审人）" },
  },
]

/** 完整的操作日志（按时间倒序） */
export const OPERATION_LOGS: OperationLog[] = [
  ...deriveLogsFromReviews(),
  ...EXTRA_LOGS,
].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
