import {
  Bot,
  Database,
  GitBranch,
  Boxes,
  BookOpen,
  Puzzle,
  Wrench,
  Compass,
  FolderHeart,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface SubMenuItem {
  key: string
  label: string
  path: string
  icon: LucideIcon
}

export interface PrimaryMenuItem {
  key: string
  label: string
  path: string
  icon: LucideIcon
  children?: SubMenuItem[]
}

/** 一级菜单 */
export const PRIMARY_MENU: PrimaryMenuItem[] = [
  {
    key: "plaza",
    label: "广场",
    path: "/plaza",
    icon: Compass,
  },
  {
    key: "workspace",
    label: "我的空间",
    path: "/workspace",
    icon: FolderHeart,
    children: [
      { key: "agents", label: "智能体", path: "/workspace/agents", icon: Bot },
      { key: "workflows", label: "工作流", path: "/workspace/workflows", icon: GitBranch },
      { key: "plugins", label: "插件", path: "/workspace/plugins", icon: Puzzle },
      { key: "knowledge", label: "知识库", path: "/workspace/knowledge", icon: BookOpen },
      { key: "skills", label: "技能", path: "/workspace/skills", icon: Wrench },
      { key: "database", label: "数据库", path: "/workspace/database", icon: Database },
      { key: "models", label: "模型管理", path: "/workspace/models", icon: Boxes },
    ],
  },
]

/** 广场页右侧 Tab */
export const PLAZA_TABS = [
  { key: "agent", label: "智能体" },
  { key: "plugin", label: "插件" },
  { key: "skill", label: "技能" },
] as const
