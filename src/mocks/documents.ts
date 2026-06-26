/** 文档解析状态 */
export type DocumentStatus = "success" | "pending" | "failed"

export interface Document {
  id: string
  /** 文件名 */
  name: string
  /** 文件扩展名，用于显示图标 */
  ext: string
  /** 文件大小（字节） */
  sizeBytes: number
  /** 上传时间 ISO */
  uploadedAt: string
  /** 分块数量 */
  chunkCount: number
  /** 解析方式标签（如 Q&A、通用） */
  parseMode: string
  /** 解析状态 */
  status: DocumentStatus
}

/** 给每个知识库 mock 一批文档 */
export const DOCUMENTS_BY_KB: Record<string, Document[]> = {
  hfut: [
    {
      id: "doc-1",
      name: "问答对导入模板（序列4）.xlsx",
      ext: "xlsx",
      sizeBytes: 123_960,
      uploadedAt: "2026-05-25T09:45:00",
      chunkCount: 450,
      parseMode: "Q&A",
      status: "success",
    },
    {
      id: "doc-2",
      name: "问答对导入模板（序列3）.xlsx",
      ext: "xlsx",
      sizeBytes: 110_080,
      uploadedAt: "2026-05-25T09:45:00",
      chunkCount: 496,
      parseMode: "Q&A",
      status: "success",
    },
    {
      id: "doc-3",
      name: "问答对导入模板（序列2）.xlsx",
      ext: "xlsx",
      sizeBytes: 209_960,
      uploadedAt: "2026-05-25T09:45:00",
      chunkCount: 497,
      parseMode: "Q&A",
      status: "success",
    },
    {
      id: "doc-4",
      name: "问答对导入模板（序列5）.xlsx",
      ext: "xlsx",
      sizeBytes: 98_510,
      uploadedAt: "2026-05-25T09:44:00",
      chunkCount: 311,
      parseMode: "Q&A",
      status: "success",
    },
    {
      id: "doc-5",
      name: "问答对导入模板（序列1）.xlsx",
      ext: "xlsx",
      sizeBytes: 307_220,
      uploadedAt: "2026-05-25T09:44:00",
      chunkCount: 993,
      parseMode: "Q&A",
      status: "success",
    },
    {
      id: "doc-6",
      name: "18.合肥工业大学（合肥校区）在期学生社团一览表.docx",
      ext: "docx",
      sizeBytes: 9_880,
      uploadedAt: "2026-05-25T09:31:00",
      chunkCount: 3,
      parseMode: "通用",
      status: "success",
    },
    {
      id: "doc-7",
      name: "2025-2026学年第一学期通识教育选修课程简介（线下类+慕课类+创新创业类）.docx",
      ext: "docx",
      sizeBytes: 1_220_000,
      uploadedAt: "2026-05-25T09:31:00",
      chunkCount: 74,
      parseMode: "通用",
      status: "success",
    },
    {
      id: "doc-8",
      name: "2025-8-21各学院大学生发展辅导中心主任名单及联系电话.docx",
      ext: "docx",
      sizeBytes: 8_930,
      uploadedAt: "2026-05-25T09:31:00",
      chunkCount: 3,
      parseMode: "通用",
      status: "success",
    },
  ],
  qw: [
    {
      id: "qw-doc-1",
      name: "示例文档.pdf",
      ext: "pdf",
      sizeBytes: 234_500,
      uploadedAt: "2026-05-29T15:20:00",
      chunkCount: 12,
      parseMode: "通用",
      status: "success",
    },
  ],
}
