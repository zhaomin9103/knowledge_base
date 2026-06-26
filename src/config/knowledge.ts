export interface KnowledgeCategoryOption {
  value: string
  label: string
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategoryOption[] = [
  { value: "通用", label: "通用" },
  { value: "学术", label: "学术" },
  { value: "教学", label: "教学" },
  { value: "科研", label: "科研" },
  { value: "行政", label: "行政" },
]

export interface VectorModelOption {
  value: string
  label: string
}

export const VECTOR_MODELS: VectorModelOption[] = [
  { value: "bge-large-zh-v1.5", label: "BGE-Large-zh-v1.5" },
  { value: "bge-base-zh-v1.5", label: "BGE-Base-zh-v1.5" },
  { value: "text-embedding-3-large", label: "text-embedding-3-large" },
  { value: "text-embedding-3-small", label: "text-embedding-3-small" },
  { value: "m3e-base", label: "M3E-Base" },
]

export const KNOWLEDGE_NAME_MAX = 30
export const KNOWLEDGE_DESC_MAX = 500
