import { useMemo, useState } from "react"
import { FileText, Inbox } from "lucide-react"
import { REVIEW_REQUESTS, type ReviewRequest } from "@/mocks/reviews"
import { formatUpdatedAt, formatSizeBytes } from "@/lib/format"
import { getFileIcon, getFileIconColor } from "@/lib/file-icon"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OperationBadge } from "./operation-badge"
import { ReviewResultBadge } from "./review-result-badge"
import { ReviewDetailDialog } from "./review-detail-dialog"
import { DocumentPreviewDialog } from "./document-preview-dialog"
import { PageNotesDrawer } from "./page-notes-drawer"

interface ReviewRecordsTabProps {
  kbId: string
}

const REVIEW_RECORDS_NOTES = `【页面定位】
管理员 / 创建者查看本知识库所有已审结的提交记录（审核通过 + 审核驳回）。仅作展示与追溯，不提供任何审核 / 修改操作。

【数据范围】
· 仅展示 status ≠ 待审核 且已有审核结论（review）的记录。
· 待审核中的提交不在此列表，在「待审核」Tab 处理。
· 按”审核时间”倒序排列（最新审结的在最上）。

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
1. 表格中间列横向滚动；表头吸顶；”操作”列 sticky 固定在右侧。
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

export function ReviewRecordsTab({ kbId }: ReviewRecordsTabProps) {
  const [detailReview, setDetailReview] = useState<ReviewRequest | null>(null)
  const [previewReview, setPreviewReview] = useState<ReviewRequest | null>(null)

  // 筛选当前知识库的已审核记录，按审核时间倒序
  const records = useMemo(
    () =>
      REVIEW_REQUESTS.filter(
        (r) => r.kbId === kbId && r.status !== "pending" && r.review,
      ).sort((a, b) => {
        const timeA = a.review?.reviewedAt ?? a.createdAt
        const timeB = b.review?.reviewedAt ?? b.createdAt
        return timeB.localeCompare(timeA)
      }),
    [kbId],
  )

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {records.length} 条审核记录
        </p>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border bg-card">
          <div className="text-center text-muted-foreground">
            <Inbox className="mx-auto mb-2 size-12 opacity-20" />
            <p>暂无审核记录</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-lg border bg-card">
          {/* 横向滚动容器 */}
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <Th>审核时间</Th>
                <Th>审核结果</Th>
                <Th>审核人</Th>
                <Th>操作类型</Th>
                <Th>文档名称</Th>
                <Th>提交人</Th>
                <Th>提交时间</Th>
                <Th>变更说明</Th>
                <Th>驳回原因 / 生效版本</Th>
                {/* 操作列：sticky right */}
                <th className="sticky right-0 z-10 border-l bg-muted/80 px-4 py-3 text-center font-medium text-muted-foreground backdrop-blur">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  onViewDetail={() => setDetailReview(record)}
                  onPreviewDocument={() => setPreviewReview(record)}
                />
              ))}
            </tbody>
          </table>
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
      {children}
    </th>
  )
}

interface RecordRowProps {
  record: ReviewRequest
  onViewDetail: () => void
  onPreviewDocument: () => void
}

function RecordRow({ record, onViewDetail, onPreviewDocument }: RecordRowProps) {
  const Icon = getFileIcon(record.documentExt)
  const iconColor = getFileIconColor(record.documentExt)
  const review = record.review!

  return (
    <tr className="group border-b transition hover:bg-muted/30">
      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {formatUpdatedAt(review.reviewedAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <ReviewResultBadge result={review.result} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-foreground">
        {review.reviewerName}
        {review.reviewerIdNo && `(${review.reviewerIdNo})`}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <OperationBadge operation={record.operation} />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onPreviewDocument}
          className="flex max-w-xs items-center gap-2 text-left transition hover:text-brand-600 dark:hover:text-brand-400"
        >
          <Icon className={cn("size-4 shrink-0", iconColor)} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-foreground">
              {record.documentName}
            </div>
            {record.fileSizeBytes && (
              <div className="text-xs text-muted-foreground">
                {formatSizeBytes(record.fileSizeBytes)}
              </div>
            )}
          </div>
        </button>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="font-medium text-foreground">
          {record.submitter.name}({record.submitter.idNo})
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {formatUpdatedAt(record.createdAt)}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <div className="max-w-xs truncate" title={record.changeDescription}>
          {record.changeDescription}
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {review.result === "rejected" && review.reason ? (
          <div
            className="max-w-xs truncate text-red-600 dark:text-red-400"
            title={review.reason}
          >
            {review.reason}
          </div>
        ) : record.appliedVersion != null ? (
          <span className="rounded bg-secondary px-2 py-0.5 text-xs">
            v{record.appliedVersion}
          </span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </td>
      {/* 操作列：sticky right */}
      <td className="sticky right-0 border-l bg-card px-4 py-3 transition group-hover:bg-muted/30">
        <div className="flex justify-center">
          <Button size="sm" variant="outline" onClick={onViewDetail}>
            <FileText className="mr-1 size-3.5" />
            查看详情
          </Button>
        </div>
      </td>
    </tr>
  )
}
