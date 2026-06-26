import { AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface RemoveMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberName: string
  memberRole: string
  onConfirm: () => void
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  memberName,
  memberRole,
  onConfirm,
}: RemoveMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            移除成员
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm">
          <p>
            确定将
            <span className="mx-1 font-medium text-foreground">
              {memberName}
            </span>
            （{memberRole}）从该知识库移除？
          </p>
          <p className="mt-2 text-muted-foreground">
            移除后，该成员将无法继续访问此知识库及相关操作。已生效的提交记录会保留。
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            确认移除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
