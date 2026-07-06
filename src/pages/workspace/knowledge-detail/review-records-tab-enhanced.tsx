import { useMemo, useState } from "react"
import { Inbox } from "lucide-react"
import {
  REVIEW_REQUESTS,
  isSettled,
  getRejectedDecision,
  type ReviewRequest,
} from "@/mocks/reviews"
import { formatUpdatedAt, formatSizeBytes } from "@/lib/format"
import { getFileIcon, getFileIconColor } from "@/lib/file-icon"
import { cn } from "@/lib/utils"
import { OperationBadge } from "./operation-badge"
import { ReviewResultBadge } from "./review-result-badge"
import { ReviewDetailDialog } from "./review-detail-dialog"
import { DocumentPreviewDialog } from "./document-preview-dialog"
import { PageNotesDrawer } from "./page-notes-drawer"

interface ReviewRecordsTabProps {
  kbId: string
}

/** 审结记录的终态信息 */
function settledInfo(record: ReviewRequest) {
  if (record.status === "approved") {
    return {
      decision: record.secondReview,
      settledAt: record.secondReview?.reviewedAt ?? record.createdAt,
    }
  }
  const rejected = getRejectedDecision(record)
  return {
    decision: rejected,
    settledAt: rejected?.reviewedAt ?? record.createdAt,
  }
}

const REVIEW_RECORDS_NOTES = `【页面定位】
管理员 / 创建者查看本知识库所有已审结的提交记录（审核通过 + 审核驳回）。仅作展示与追溯，不提供任何审核 / 修改操作。

【数据范围】
· 仅展示 status ≠ 待审核 且已有审核结论（review）的记录。
· 待审核中的提交不在此列表，在「待审核」Tab 处理。
· 按"审核时间"倒序排列（最新审结的在最上）。

【列表字段（横向可滚动）】
· 审核时间：管理员做出通过 / 驳回决定的时间
· 审核结果：通过（绿）/ 驳回（红）标签
· 审核人：做出审核决定的管理员
· 操作类型：新增 / 更新 / 删除标签
· 文档名称：文件图标 + 名称 + 大小，点击打开「文档预览弹窗」
· 提交人：姓名 + 所属组织
· 提交时间：维护人员提交申请的时间
· 变更说明：提交人填写的变更描述（过长截断，悬停看全文）
· 驳回原因 / 生效版本（同一列复用）：
   - 驳回记录 → 显示驳回原因（红色）
   - 通过记录 → 显示生效版本号 v{n}（即审核通过后生成的版本）
   - 其他 → 显示「—」
· 操作（固定在右侧，不随横向滚动）：查看详情

【交互逻辑】
1. 表格中间列横向滚动；表头吸顶；"操作"列 sticky 固定在右侧。
2. 点击「文档名称」→ 弹出文档预览：
   · 新增 → 预览新增内容；删除 → 预览原文档内容；更新 → 预览变更后内容。
3. 点击「查看详情」→ 弹出审核详情弹窗（只读模式）：
   · 更新操作：左右两栏内容对比（左=原文档，右=变更后）+ 行级 +N/-M 统计。
   · 新增 / 删除操作：不做内容对比，仅展示单侧内容。
   · 只读模式展示审核结论块：结果、审核人、审核时间、驳回原因（若驳回）、生效版本（若通过），仅有「关闭」按钮，无通过 / 驳回操作。

【操作逻辑 / 权限】
· 管理员、创建者（canReview）可见本 Tab。
· 本页为纯展示 / 追溯页，不可对已审结记录再操作。
· 与「待审核」是同一批数据的两个阶段：待审核 → 审结后流转到本页。

【备注】
本说明用于记录页面预期逻辑，可手动编辑后保存（保存在本地浏览器）。`

export function ReviewRecordsTabEnhanced({ kbId }: ReviewRecordsTabProps) {
  const [detailReview, setDetailReview] = useState<ReviewRequest | null>(null)
  const [previewReview, setPreviewReview] = useState<ReviewRequest | null>(null)

  // 筛选当前知识库的已审结记录，按审结时间倒序
  const records = useMemo(
    () =>
      REVIEW_REQUESTS.filter((r) => r.kbId === kbId && isSettled(r)).sort(
        (a, b) =>
          settledInfo(b).settledAt.localeCompare(settledInfo(a).settledAt),
      ),
    [kbId],
  )

  return (
    <div className="flex h-full flex-col gap-6">
      {/* 顶部统计 */}
      <div className="flex items-center justify-between rounded-xl border border-[#E7E7E9] bg-white px-6 py-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#858890]">共</span>
          <span className="text-base font-medium text-[#0C1222]">
            {records.length}
          </span>
          <span className="text-[#858890]">条审核记录</span>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-[#E7E7E9] bg-white">
          <div className="text-center">
            <Inbox className="mx-auto mb-3 size-16 text-[#BFBFBF]" />
            <p className="text-sm text-[#858890]">暂无审核记录</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-auto pb-4">
          {records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onViewDetail={() => setDetailReview(record)}
              onPreviewDocument={() => setPreviewReview(record)}
            />
          ))}
        </div>
      )}

      {detailReview && (
        <ReviewDetailDialog
          review={detailReview}
          open={!!detailReview}
          onOpenChange={(open) => !open && setDetailReview(null)}
        />
      )}

      {previewReview && (
        <DocumentPreviewDialog
          review={previewReview}
          open={!!previewReview}
          onOpenChange={(open) => !open && setPreviewReview(null)}
        />
      )}

      {/* 页面备注抽屉 */}
      <PageNotesDrawer
        noteKey={`review-records:${kbId}`}
        title="审核记录 · 页面备注"
        defaultContent={REVIEW_RECORDS_NOTES}
      />
    </div>
  )
}

interface RecordCardProps {
  record: ReviewRequest
  onViewDetail: () => void
  onPreviewDocument: () => void
}

function RecordCard({ record, onViewDetail, onPreviewDocument }: RecordCardProps) {
  const Icon = getFileIcon(record.documentExt)
  const iconColor = getFileIconColor(record.documentExt)
  const { decision, settledAt } = settledInfo(record)
  const result = record.status === "approved" ? "approved" : "rejected"
  const stage = decision?.stage ?? "second"
  const stageLabel = stage === "first" ? "初审" : "复审"

  return (
    <div className="group overflow-hidden rounded-xl border border-[#E7E7E9] bg-white transition-all hover:border-[#1947FF]/20 hover:shadow-md">
      <div className="p-6">
        {/* 头部：审核结果 + 时间 + 审核人 */}
        <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-[#F0F0F0] pb-4">
          <ReviewResultBadge result={result} />
          <span className="inline-flex items-center rounded bg-[#EEF0FF] px-2 py-0.5 text-xs font-medium text-[#494AFF]">
            {stageLabel}环节
          </span>
          <div className="flex items-center gap-2 text-sm text-[#858890]">
            <span>审结时间：</span>
            <span className="text-[#0B111E]">{formatUpdatedAt(settledAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#858890]">
            <span>审核人：</span>
            <span className="text-[#0B111E]">
              {decision?.reviewerName ?? "—"}
              {decision?.reviewerIdNo && `(${decision.reviewerIdNo})`}
            </span>
          </div>
        </div>

        {/* 主体：文件信息 + 操作类型 */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={onPreviewDocument}
            className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:text-[#1947FF]"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F7]">
              <Icon className={cn("size-6", iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-medium text-[#0C1222]">
                {record.documentName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#858890]">
                {record.fileSizeBytes && (
                  <span>{formatSizeBytes(record.fileSizeBytes)}</span>
                )}
              </div>
            </div>
          </button>
          <OperationBadge operation={record.operation} />
        </div>

        {/* 提交信息 */}
        <div className="mb-4 rounded-lg bg-[#F5F7FA] px-4 py-3">
          <div className="mb-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#858890]">提交人：</span>
              <span className="font-medium text-[#0B111E]">
                {record.submitter.name}({record.submitter.idNo})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#858890]">提交时间：</span>
              <span className="text-[#0B111E]">
                {formatUpdatedAt(record.createdAt)}
              </span>
            </div>
          </div>
          <div className="text-sm">
            <span className="text-[#858890]">变更说明：</span>
            <span className="text-[#666666]">{record.changeDescription}</span>
          </div>
        </div>

        {/* 底部：驳回原因 / 生效版本 + 操作按钮 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {result === "rejected" && decision?.reason ? (
              <div className="rounded-lg bg-[#FFF1F0] px-3 py-2 text-sm text-[#E95141]">
                <span className="font-medium">驳回原因：</span>
                {decision.reason}
              </div>
            ) : record.appliedVersion != null ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF9E5] px-3 py-1.5 text-sm">
                <span className="text-[#858890]">生效版本：</span>
                <span className="font-medium text-[#74C041]">
                  v{record.appliedVersion}
                </span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onViewDetail}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7E7E9] bg-white px-4 py-2 text-sm text-[#0B111E] transition-all hover:border-[#1947FF] hover:text-[#1947FF]"
          >
            查看详情
          </button>
        </div>
      </div>
    </div>
  )
}
