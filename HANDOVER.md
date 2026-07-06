# 知识库详情页 v4.0 - 快速交接指南

## 🎯 核心变更（5分钟速览）

### 1️⃣ 复审人操作直接生效
- **导入/更新/删除** → 不弹审核弹窗，直接生效
- 文件：`knowledge-detail.tsx`, `documents-tab.tsx`

### 2️⃣ 创建者 ≠ 复审人（在"我的提交"中）
- 创建者按**初审人**展示（显示完整审核状态）
- 用 `isPureSecondReviewer = isSecondReviewer && !isOwner` 区分
- 文件：`my-submissions-tab.tsx`

### 3️⃣ "我的提交"显示所有记录
- 旧版：隐藏已生效（`approved`）
- 新版：显示所有（含已生效）
- 文件：`my-submissions-tab.tsx`

### 4️⃣ 审核记录显示真实审核人
- 审核中状态：显示 `张强(T20180520)` 而非"待初审人审核"
- 从知识库配置查询 `firstReviewerIds` / `secondReviewerIds`
- 文件：`review-records-tab.tsx`

### 5️⃣ 审批流动态显示节点
- 待初审时：不显示复审节点
- 初审直接生效：显示"初审通过（直接生效）"
- 文件：`approval-timeline.tsx` (新增), `approval-flow-dialog.tsx` (重构)

### 6️⃣ 详情弹窗底部加审批流
- 文件：`review-detail-dialog.tsx`

---

## 📂 关键文件

### 新增
- `src/pages/workspace/knowledge-detail/approval-timeline.tsx` - 可复用审批流组件
- `docs/CHANGELOG-v4.0.md` - 详细更新日志
- `docs/DELIVERY-SUMMARY.md` - 完整交付总结

### 重要修改
- `my-submissions-tab.tsx` - 差异化展示逻辑
- `review-records-tab.tsx` - 审核人查询逻辑
- `documents-tab.tsx` - 复审人直接生效
- `knowledge-detail.tsx` - 导入按钮逻辑
- `approval-flow-dialog.tsx` - 使用共享组件
- `review-detail-dialog.tsx` - 底部审批流

### Mock 数据
- `src/mocks/reviews.ts` - 新增4条初审直接生效记录（rr-024 至 rr-027）

---

## 🔍 核心代码片段

### 1. 判定"纯复审人"
```typescript
// my-submissions-tab.tsx, documents-tab.tsx, knowledge-detail.tsx
const isPureSecondReviewer = isSecondReviewer && !isOwner
```

### 2. 审核人查询
```typescript
// review-records-tab.tsx
function getPendingReviewerText(record: ReviewRequest): string {
  const kb = KNOWLEDGE_BASES.find((k) => k.id === record.kbId)
  if (!kb) return "—"
  if (record.status === "pending_first") {
    return formatReviewers(kb.firstReviewerIds)
  }
  if (record.status === "pending_second") {
    return formatReviewers(kb.secondReviewerIds)
  }
  return "—"
}
```

### 3. 审批流节点判断
```typescript
// approval-timeline.tsx
const firstRejected = review.firstReview?.result === "rejected"
const shouldShowSecondReview = 
  !firstRejected && 
  (review.secondReview || review.status === "pending_second")
```

---

## 🧪 快速测试

```bash
# 1. 安装依赖
npm install

# 2. 构建验证
npm run build

# 3. 开发模式
npm run dev
```

### 测试场景
1. **复审人李明** → 导入文件 → 应该直接生效，不弹窗
2. **创建者 admin** → "我的提交"Tab → 应显示筛选器和审核状态列
3. **初审人张强** → "我的提交"Tab → 应看到 rr-024、rr-025（已生效）
4. **审核记录** → 找到审核中记录 → 应显示"张强(T20180520)"而非占位文字
5. **审批流** → 待初审记录 → 不应显示"等待复审"节点

---

## 📚 完整文档

- **PRD**: `docs/PRD-知识库详情页.md` (v4.0)
- **更新日志**: `docs/CHANGELOG-v4.0.md`
- **交付总结**: `docs/DELIVERY-SUMMARY.md`

---

## ⚠️ 注意事项

### 向后兼容
- ✅ 完全兼容 v3.0 数据结构
- ✅ 无需数据迁移

### 已知限制
- Bundle 大小 571.89 kB（建议后续优化代码分割）
- 审核人列表当前为静态配置（未来可改为动态分配）

### 扩展点
- `ApprovalTimeline` 组件可复用到其他需要展示审批流的场景
- `isPureSecondReviewer` 判定逻辑可抽取为 hook

---

## 🚀 部署

### Netlify 配置
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
```

### 手动部署
```bash
npm run build
# 将 dist/ 目录部署到服务器
```

---

## 🆘 故障排查

### 问题1：复审人仍然弹窗
**检查**: `isSecondReviewer` 和 `isOwner` 的值  
**位置**: `knowledge-detail.tsx:127`, `documents-tab.tsx:39`

### 问题2：创建者看不到审核状态
**检查**: `isPureSecondReviewer` 是否正确计算  
**位置**: `my-submissions-tab.tsx:29`

### 问题3：审批流显示多余节点
**检查**: `shouldShowSecondReview` 逻辑  
**位置**: `approval-timeline.tsx:68`

---

**版本**: v4.0  
**状态**: ✅ 已完成并通过测试  
**交接日期**: 2026-06-14
