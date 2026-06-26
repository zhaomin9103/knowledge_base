import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import PlazaPage from "@/pages/plaza"
import AgentsPage from "@/pages/workspace/agents"
import WorkflowsPage from "@/pages/workspace/workflows"
import PluginsPage from "@/pages/workspace/plugins"
import KnowledgePage from "@/pages/workspace/knowledge"
import KnowledgeDetailPage from "@/pages/workspace/knowledge-detail"
import SkillsPage from "@/pages/workspace/skills"
import DatabasePage from "@/pages/workspace/database"
import ModelsPage from "@/pages/workspace/models"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/plaza" replace /> },
      { path: "plaza", element: <PlazaPage /> },
      {
        path: "workspace",
        children: [
          { index: true, element: <Navigate to="/workspace/agents" replace /> },
          { path: "agents", element: <AgentsPage /> },
          { path: "workflows", element: <WorkflowsPage /> },
          { path: "plugins", element: <PluginsPage /> },
          { path: "knowledge", element: <KnowledgePage /> },
          { path: "knowledge/:id", element: <KnowledgeDetailPage /> },
          { path: "skills", element: <SkillsPage /> },
          { path: "database", element: <DatabasePage /> },
          { path: "models", element: <ModelsPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/plaza" replace /> },
    ],
  },
])
