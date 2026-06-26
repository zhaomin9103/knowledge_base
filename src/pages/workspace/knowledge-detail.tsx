import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  FileText,
  Settings,
  Upload,
} from "lucide-react"
import { KNOWLEDGE_BASES } from "@/mocks/knowledge"
import { useKBRole } from "@/hooks/use-kb-role"
import { cn } from "@/lib/utils"
import { RoleSwitcher } from "@/components/demo/role-switcher"
import { DocumentsTab } from "./knowledge-detail/documents-tab"
import { MySubmissionsTab } from "./knowledge-detail/my-submissions-tab"
import { PendingReviewTab } from "./knowledge-detail/pending-review-tab"
import { VersionHistoryTab } from "./knowledge-detail/version-history-tab"
import { ReviewRecordsTab } from "./knowledge-detail/review-records-tab"
import { AuditLogTab } from "./knowledge-detail/audit-log-tab"
import { MembersTab } from "./knowledge-detail/members-tab"

type TabKey =
  | "documents"
  | "my-submissions"
  | "pending-review"
  | "versions"
  | "review-records"
  | "audit"
  | "members"

interface TabItem {
  key: TabKey
  label: string
  badge?: number
}

export default function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const kb = KNOWLEDGE_BASES.find((it) => it.id === id)
  const { role, isOwner, canReview, canSubmit } = useKBRole(id)
  const [activeTab, setActiveTab] = useState<TabKey>("documents")

  // 根据角色动态构建 Tab 列表
  const tabs: TabItem[] = [
    { key: "documents", label: "文件" },
    ...(canSubmit
      ? [{ key: "my-submissions" as TabKey, label: "我的提交", badge: 0 }]
      : []),
    ...(canReview
      ? [
          { key: "pending-review" as TabKey, label: "待审核", badge: 0 },
          { key: "versions" as TabKey, label: "版本记录" },
          { key: "review-records" as TabKey, label: "审核记录" },
          { key: "audit" as TabKey, label: "操作记录" },
        ]
      : []),
    ...(isOwner
      ? [{ key: "members" as TabKey, label: "成员管理" }]
      : []),
  ]

  const roleLabel =
    role === "owner"
      ? "创建者"
      : role === "admin"
        ? "管理员"
        : role === "maintainer"
          ? "维护人员"
          : "无权限"

  return (
    <div className="flex h-full flex-col">
      {/* 顶部：返回 + 知识库信息 + 操作 */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/workspace/knowledge")}
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label="返回"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 text-white">
          <FileText className="size-7" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {kb?.name ?? "知识库详情"}
          </h1>
          <p className="text-sm text-muted-foreground">
            当前角色：{roleLabel}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <RoleSwitcher kbId={id} />
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("members")}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-4 text-sm transition hover:bg-secondary"
              >
                <Settings className="size-4" />
                设置
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-4 text-sm transition hover:bg-secondary"
              >
                <Upload className="size-4" />
                导入文件
              </button>
            </>
          )}
          {canSubmit && (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-500 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600"
            >
              <Upload className="size-4" />
              导入文件
            </button>
          )}
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="mb-4 flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "text-brand-600 dark:text-brand-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 ? (
              <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                {tab.badge}
              </span>
            ) : null}
            {activeTab === tab.key ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400" />
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 overflow-auto">
        {activeTab === "documents" && <DocumentsTab kbId={id!} />}
        {activeTab === "my-submissions" && <MySubmissionsTab kbId={id!} />}
        {activeTab === "pending-review" && <PendingReviewTab kbId={id!} />}
        {activeTab === "versions" && <VersionHistoryTab kbId={id!} />}
        {activeTab === "review-records" && <ReviewRecordsTab kbId={id!} />}
        {activeTab === "audit" && <AuditLogTab kbId={id!} />}
        {activeTab === "members" && <MembersTab kbId={id!} />}
      </div>
    </div>
  )
}
