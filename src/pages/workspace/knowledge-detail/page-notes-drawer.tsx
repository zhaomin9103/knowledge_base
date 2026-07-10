import { useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { NotebookPen, Pencil, RotateCcw, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const STORAGE_PREFIX = "kb-page-notes:"

/** 从 localStorage 读取已保存的备注，读取失败或无记录时回退到默认内容 */
function readStoredNote(storageKey: string, fallback: string): string {
  try {
    return localStorage.getItem(storageKey) ?? fallback
  } catch {
    // localStorage 不可用时忽略，使用默认内容
    return fallback
  }
}

interface PageNotesDrawerProps {
  /** 唯一存储键，区分不同 Tab 的备注 */
  noteKey: string
  /** 抽屉标题 */
  title: string
  /** 预写的默认备注内容（交互/操作逻辑说明） */
  defaultContent: string
}

/**
 * 页面备注侧抽屉。
 * - 右下角悬浮按钮触发
 * - 支持查看 / 编辑两态
 * - 编辑内容持久化到 localStorage（按 noteKey 区分）
 * - 支持恢复默认内容
 */
export function PageNotesDrawer({
  noteKey,
  title,
  defaultContent,
}: PageNotesDrawerProps) {
  const storageKey = STORAGE_PREFIX + noteKey

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  // 初始值直接从 localStorage 读取，避免挂载后再 setState 触发额外渲染
  const [content, setContent] = useState(() =>
    readStoredNote(storageKey, defaultContent),
  )
  const [draft, setDraft] = useState(content)

  const handleStartEdit = () => {
    setDraft(content)
    setEditing(true)
  }

  const handleSave = () => {
    setContent(draft)
    setEditing(false)
    try {
      localStorage.setItem(storageKey, draft)
    } catch {
      // 持久化失败时仅保留内存态
    }
  }

  const handleCancel = () => {
    setDraft(content)
    setEditing(false)
  }

  const handleReset = () => {
    setDraft(defaultContent)
    setContent(defaultContent)
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // 忽略
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* 右下角悬浮触发按钮 */}
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="页面备注"
          className={cn(
            "fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center",
            "rounded-full bg-brand-500 text-white shadow-lg transition",
            "hover:bg-brand-600 hover:shadow-xl",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2",
          )}
        >
          <NotebookPen className="size-5" />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          style={{ maxWidth: 800 }}
          className={cn(
            "fixed right-0 top-0 z-50 flex h-full w-full flex-col",
            "border-l bg-card shadow-xl duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          )}
        >
          {/* 头部 */}
          <div className="flex items-start justify-between gap-2 border-b px-5 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="flex items-center gap-2 text-base font-semibold text-foreground">
                <NotebookPen className="size-4 text-brand-500" />
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground">
                记录该页的交互逻辑与操作逻辑，可手动编辑保存
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="rounded-md p-1 text-muted-foreground opacity-70 transition hover:bg-secondary hover:text-foreground hover:opacity-100"
              aria-label="关闭"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-auto px-5 py-4">
            {editing ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className={cn(
                  "h-full min-h-[400px] w-full resize-none rounded-md border bg-background p-3",
                  "font-mono text-sm leading-relaxed text-foreground",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                )}
                placeholder="输入该页的交互逻辑、操作逻辑等说明…"
              />
            ) : (
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
                {content || (
                  <span className="text-muted-foreground">
                    暂无备注，点击「编辑」开始记录。
                  </span>
                )}
              </pre>
            )}
          </div>

          {/* 底部操作栏 */}
          <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="mr-1 size-3.5" />
                  恢复默认
                </Button>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    取消
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="mr-1 size-3.5" />
                    保存
                  </Button>
                </div>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">
                  内容保存在本地浏览器
                </span>
                <Button size="sm" onClick={handleStartEdit}>
                  <Pencil className="mr-1 size-3.5" />
                  编辑
                </Button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
