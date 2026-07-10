import { useState } from "react"
import { Info, ShieldCheck, AlertTriangle } from "lucide-react"
import type { OperationType } from "@/mocks/reviews"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface SubmitConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: OperationType
  /**
   * 提交人角色类型
   * - second-reviewer: 复审人（直接生效，只需备注）
   * - first-reviewer: 初审人/创建者（需选择：提交复审或直接生效）
   * - maintainer: 维护人员（需经初审）
   */
  submitterRole: "second-reviewer" | "first-reviewer" | "maintainer"
  /**
   * 是否有复审人配置
   */
  hasSecondReviewer?: boolean
  /**
   * 确认回调
   * @param changeDescription 变更说明
   * @param directApprove 是否直接生效（仅初审人/创建者有效）
   */
  onConfirm: (changeDescription: string, directApprove?: boolean) => void
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
  submitterRole,
  hasSecondReviewer = true,
  onConfirm,
}: SubmitConfirmDialogProps) {
  const [description, setDescription] = useState("")
  const [error, setError] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // 创建者/初审人的变更说明为选填，其余角色必填
  const isDescriptionRequired = submitterRole !== "first-reviewer"

  const handleConfirm = (directApprove?: boolean) => {
    if (isDescriptionRequired && !description.trim()) {
      setError(true)
      return
    }
    onConfirm(description.trim(), directApprove)
    setDescription("")
    setError(false)
  }

  const handleCancel = () => {
    // 无论是否填写内容，点击取消都显示二次确认
    setShowCancelConfirm(true)
  }

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false)
    handleClose()
  }

  const handleClose = () => {
    setDescription("")
    setError(false)
    onOpenChange(false)
  }

  // 根据角色和配置生成提示文案
  const getPromptText = () => {
    if (submitterRole === "second-reviewer") {
      return "您的本次操作将直接生效并生成新版本。"
    }

    if (submitterRole === "first-reviewer") {
      if (!hasSecondReviewer) {
        return "您的本次操作将直接生效（当前知识库未配置复审人）。"
      }
      return "您可选择本次操作直接生效或提交复审人进行审核"
    }

    // maintainer
    return "您的本次操作将在审核通过后生效"
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // 阻止通过 ESC 键或点击遮罩关闭
          if (!next) return
          onOpenChange(next)
        }}
      >
        <DialogContent
          className="max-w-md"
          showClose={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand-600 dark:text-brand-400" />
            {submitterRole === "second-reviewer"
              ? `确认${OPERATION_VERB[operation]}`
              : `提交${OPERATION_VERB[operation]}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 审核提示 */}
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            <Info className="mt-0.5 size-4 shrink-0" />
            <div>
              {submitterRole === "second-reviewer" && (
                <p className="font-medium">操作说明</p>
              )}
              <p
                className={
                  submitterRole === "second-reviewer"
                    ? "mt-1 text-xs leading-relaxed"
                    : "text-sm leading-relaxed"
                }
              >
                {getPromptText()}
              </p>
            </div>
          </div>

          {/* 变更说明输入 */}
          <div className="space-y-2">
            <Label htmlFor="change-desc" className="text-sm font-medium">
              变更说明{" "}
              {isDescriptionRequired ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="text-xs font-normal text-muted-foreground">
                  (选填)
                </span>
              )}
            </Label>
            <Textarea
              id="change-desc"
              placeholder={`请简要说明本次${OPERATION_VERB[operation]}的原因或内容（${
                isDescriptionRequired ? "必填" : "选填"
              }）`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (error) setError(false)
              }}
              className={error ? "border-destructive" : ""}
              rows={3}
            />
            {error && (
              <p className="text-xs text-destructive">变更说明不能为空</p>
            )}
          </div>
        </div>

        <DialogFooter>
          {submitterRole === "first-reviewer" && hasSecondReviewer ? (
            // 初审人/创建者：两个按钮（提交复审、确定生效）
            <>
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button
                variant="default"
                onClick={() => handleConfirm(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                提交复审
              </Button>
              <Button
                variant="default"
                onClick={() => handleConfirm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                确定生效
              </Button>
            </>
          ) : (
            // 复审人、维护人员、降级场景：单按钮
            <>
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button onClick={() => handleConfirm()}>
                {submitterRole === "second-reviewer" ? "确定" : "提交"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 取消确认对话框 */}
    <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            确认退出
          </AlertDialogTitle>
          <AlertDialogDescription>
            退出提交审核流程将不保存当前信息，确定要退出吗？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowCancelConfirm(false)}>
            继续编辑
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmCancel}
            className="bg-destructive hover:bg-destructive/90"
          >
            确认退出
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}
