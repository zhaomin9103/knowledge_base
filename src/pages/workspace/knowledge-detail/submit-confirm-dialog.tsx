import { useState } from "react"
import { Info, ShieldCheck } from "lucide-react"
import type { OperationType } from "@/mocks/reviews"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { OperationBadge } from "./operation-badge"

interface SubmitConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: OperationType
  documentName: string
  /**
   * 提交人是否跳过初审（初审人及以上）。
   * 影响提示文案：跳过初审时只需复审。
   */
  skipsFirstReview?: boolean
  onConfirm: (changeDescription: string) => void
}

const OPERATION_VERB: Record<OperationType, string> = {
  add: "新增",
  update: "更新",
  delete: "删除",
}

export function SubmitConfirmDialog({
  open,
  onOpenChange,
  operation,
  documentName,
  skipsFirstReview = false,
  onConfirm,
}: SubmitConfirmDialogProps) {
  const [description, setDescription] = useState("")
  const [error, setError] = useState(false)

  const handleConfirm = () => {
    if (!description.trim()) {
      setError(true)
      return
    }
    onConfirm(description.trim())
    setDescription("")
    setError(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDescription("")
      setError(false)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand-600 dark:text-brand-400" />
            提交{OPERATION_VERB[operation]}申请
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 审核提示 */}
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            <Info className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">该操作需经审核后才会生效</p>
              <p className="text-xs leading-relaxed">
                {skipsFirstReview ? (
                  <>
                    您的提交将进入
                    <span className="font-medium">复审</span>
                    环节，复审通过后正式生效。
                  </>
                ) : (
                  <>
                    您的提交将依次经过
                    <span className="font-medium">初审 → 复审</span>
                    两级审核，全部通过后才会正式生效并生成新版本；任一级驳回将退回给您。
                  </>
                )}
              </p>
            </div>
          </div>

          {/* 操作对象 */}
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
            <OperationBadge operation={operation} />
            <span className="truncate font-medium">{documentName}</span>
          </div>

          {/* 变更说明 */}
          <div className="space-y-2">
            <Label htmlFor="change-desc" required>
              变更说明
            </Label>
            <Textarea
              id="change-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (error) setError(false)
              }}
              placeholder="请说明本次变更的内容与原因，供审核人参考..."
              rows={4}
              aria-invalid={error}
            />
            {error && (
              <p className="text-xs text-destructive">请填写变更说明</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认提交审核</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
