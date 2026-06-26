import { AlertTriangle, RotateCcw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface RollbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetVersion: number
  currentVersion: number
  onConfirm: () => void
}

export function RollbackDialog({
  open,
  onOpenChange,
  targetVersion,
  currentVersion,
  onConfirm,
}: RollbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-5 text-amber-500" />
            回退版本
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p>
            确定将知识库从
            <span className="mx-1 font-medium text-foreground">
              v{currentVersion}
            </span>
            回退到
            <span className="mx-1 font-medium text-brand-600 dark:text-brand-400">
              v{targetVersion}
            </span>
            ？
          </p>

          <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertTriangle className="size-4 shrink-0" />
            <div className="space-y-1">
              <p>回退后，AI 问答将立即使用 v{targetVersion} 的知识内容。</p>
              <p>
                v{targetVersion} 之后的版本（v{targetVersion + 1} ~ v
                {currentVersion}）仍保留在历史中，可随时重新切回。
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <RotateCcw className="mr-1 size-4" />
            确认回退
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
