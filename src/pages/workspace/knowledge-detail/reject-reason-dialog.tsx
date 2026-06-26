import { useState } from "react"
import { X } from "lucide-react"
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

interface RejectReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentName: string
  onConfirm: (reason: string) => void
}

export function RejectReasonDialog({
  open,
  onOpenChange,
  documentName,
  onConfirm,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState(false)

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(true)
      return
    }
    onConfirm(reason.trim())
    setReason("")
    setError(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason("")
      setError(false)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="size-5 text-destructive" />
            驳回审核
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            正在驳回：
            <span className="font-medium text-foreground">{documentName}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="reject-reason" required>
              驳回原因
            </Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError(false)
              }}
              placeholder="请说明驳回的具体原因，将反馈给提交人..."
              rows={4}
              aria-invalid={error}
            />
            {error && (
              <p className="text-xs text-destructive">请填写驳回原因</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            确认驳回
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
