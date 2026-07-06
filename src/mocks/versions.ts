import { REVIEW_REQUESTS, type OperationType } from "./reviews"
import { MOCK_USERS } from "./users"

/** 知识库版本快照 */
export interface KBVersion {
  /** 版本号，从 1 递增 */
  version: number
  kbId: string
  /** 触发该版本的操作类型 */
  operation: OperationType | "init"
  /** 变更的文档名（init 时为空） */
  documentName?: string
  documentExt?: string
  /** 变更说明 */
  changeDescription?: string
  /** 提交人 */
  submitterId?: string
  submitterName?: string
  submitterIdNo?: string
  /** 审核人（终审/通过人） */
  reviewerId?: string
  reviewerName?: string
  reviewerIdNo?: string
  /** 该版本生效时间（审核通过时间） */
  createdAt: string
  /** 关联审核记录 ID */
  reviewRequestId?: string
}

/**
 * 从"审核通过"的记录派生版本历史。
 * - 每条 approved 且带 appliedVersion 的记录 = 一个版本
 * - 额外补一个 v1 初始版本
 */
function deriveVersions(kbId: string): KBVersion[] {
  const versions: KBVersion[] = []

  // v1：知识库初始化（演示用，固定）
  versions.push({
    version: 1,
    kbId,
    operation: "init",
    changeDescription: "知识库初始化",
    reviewerName: "admin",
    createdAt: "2026-05-25T10:00:00",
  })

  REVIEW_REQUESTS.filter(
    (r) =>
      r.kbId === kbId &&
      r.status === "approved" &&
      r.appliedVersion != null &&
      r.appliedVersion > 1,
  ).forEach((r) => {
    const submitter = MOCK_USERS.find((u) => u.id === r.submitter.id)
    // 终审人 = 复审意见的审核人
    const finalReview = r.secondReview
    const reviewer = MOCK_USERS.find((u) => u.id === finalReview?.reviewerId)
    versions.push({
      version: r.appliedVersion!,
      kbId,
      operation: r.operation,
      documentName: r.documentName,
      documentExt: r.documentExt,
      changeDescription: r.changeDescription,
      submitterId: submitter?.id,
      submitterName: submitter?.name ?? r.submitter.name,
      submitterIdNo: submitter?.idNo ?? r.submitter.idNo,
      reviewerId: reviewer?.id,
      reviewerName: finalReview?.reviewerName,
      reviewerIdNo: reviewer?.idNo,
      createdAt: finalReview?.reviewedAt ?? r.createdAt,
      reviewRequestId: r.id,
    })
  })

  // 按版本号升序
  return versions.sort((a, b) => a.version - b.version)
}

/** 获取某知识库的版本历史（升序） */
export function getVersions(kbId: string): KBVersion[] {
  return deriveVersions(kbId)
}
