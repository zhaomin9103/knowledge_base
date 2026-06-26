import { useState } from "react"
import { FileText, ImagePlus } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  KNOWLEDGE_CATEGORIES,
  VECTOR_MODELS,
  KNOWLEDGE_NAME_MAX,
  KNOWLEDGE_DESC_MAX,
} from "@/config/knowledge"

export interface CreateKnowledgeValues {
  name: string
  category: string
  description: string
  vectorModel: string
  cover?: string
}

interface CreateKnowledgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (values: CreateKnowledgeValues) => void
}

const INITIAL: CreateKnowledgeValues = {
  name: "",
  category: KNOWLEDGE_CATEGORIES[0].value,
  description: "",
  vectorModel: "",
}

export function CreateKnowledgeDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateKnowledgeDialogProps) {
  const [values, setValues] = useState<CreateKnowledgeValues>(INITIAL)
  const [error, setError] = useState<string | null>(null)

  const update = <K extends keyof CreateKnowledgeValues>(
    key: K,
    value: CreateKnowledgeValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }))

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setValues(INITIAL)
      setError(null)
    }
    onOpenChange(next)
  }

  const handleSubmit = () => {
    const name = values.name.trim()
    if (!name) {
      setError("请输入知识库名称")
      return
    }
    if (!values.vectorModel) {
      setError("请选择向量模型")
      return
    }
    setError(null)
    onSubmit?.({ ...values, name })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建知识库</DialogTitle>
        </DialogHeader>

        {/* 顶部居中封面 */}
        <div className="mb-4 flex justify-center">
          <CoverPicker />
        </div>

        <div className="flex flex-col gap-5">
          {/* 名称 / 分类 双列 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="kb-name" required>
                知识库名称
              </Label>
              <div className="relative">
                <Input
                  id="kb-name"
                  value={values.name}
                  maxLength={KNOWLEDGE_NAME_MAX}
                  placeholder="请输入"
                  onChange={(e) => {
                    update("name", e.target.value)
                    if (error) setError(null)
                  }}
                  className="pr-14"
                  aria-invalid={!!error && !values.name.trim()}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {values.name.length}/{KNOWLEDGE_NAME_MAX}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label required>知识库分类</Label>
              <Select
                value={values.category}
                onValueChange={(v) => update("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_CATEGORIES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 向量模型 */}
          <div className="flex flex-col gap-2">
            <Label required>向量模型</Label>
            <Select
              value={values.vectorModel}
              onValueChange={(v) => {
                update("vectorModel", v)
                if (error) setError(null)
              }}
            >
              <SelectTrigger
                aria-invalid={!!error && !values.vectorModel}
              >
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                {VECTOR_MODELS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 描述 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="kb-desc">描述</Label>
            <div className="relative">
              <Textarea
                id="kb-desc"
                value={values.description}
                maxLength={KNOWLEDGE_DESC_MAX}
                placeholder="请输入内容描述"
                onChange={(e) => update("description", e.target.value)}
                rows={5}
                className="pb-7"
              />
              <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
                {values.description.length}/{KNOWLEDGE_DESC_MAX}
              </span>
            </div>
          </div>

          {error ? (
            <p className="-mt-2 text-xs text-destructive">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 顶部居中的封面占位（暂时仅 UI，不真正接受上传） */
function CoverPicker() {
  return (
    <button
      type="button"
      className="group relative flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-sm transition hover:shadow-md"
      aria-label="选择封面"
    >
      <FileText className="size-10" />
      <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-card text-muted-foreground shadow ring-1 ring-border transition group-hover:text-brand-500">
        <ImagePlus className="size-3.5" />
      </span>
    </button>
  )
}
