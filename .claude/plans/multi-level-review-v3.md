# 多级审核 v3.0 实施计划

## 核心变更概述

根据 PRD v3.0，需要实现：
1. **初审人终点决策权**：初审通过时可选择「直接生效」或「提交复审」
2. **文档审核中锁定**：pending 状态文档禁止其他增删改操作
3. **四个独立角色**：创建者、复审人、初审人、维护人员（无自动权限合并）
4. **乐观锁并发控制**：防止多人同时审核同一记录

## 现状分析

### 已有基础（部分符合 v3.0）
- ✅ 四个独立角色定义（`use-kb-role.ts` 中已正确实现）
- ✅ 基础审核流程（`reviews.ts` 已有 `pending_first`/`pending_second`/`approved`/`rejected`）
- ✅ Tab 动态显示逻辑
- ⚠️  审核操作只有「通过」按钮，无初审分支决策

### 需要新增
- ❌ 初审决策分支 UI（通过并生效 / 通过并提交复审）
- ❌ 初审直接通过的数据结构（`firstReview.skipSecondReview`）
- ❌ 文档审核中锁定检查逻辑
- ❌ 乐观锁 `version` 字段
- ❌ 待初审、待复审两个独立 Tab（当前只有一个「待审核」Tab）

## 实施步骤

### 第一阶段：数据模型升级

#### 1.1 更新 `reviews.ts` 数据模型
- [ ] `ReviewDecision` 新增 `skipSecondReview?: boolean` 字段
- [ ] `ReviewDecision` 的 `reason` 字段用途扩展：驳回原因 / 初审直接通过的可选说明
- [ ] `ReviewRequest` 新增 `version: number` 字段（乐观锁）
- [ ] `ReviewRequest` 新增 `updatedAt: string` 字段
- [ ] 更新 `applyDecision` 函数，支持初审直接生效逻辑
- [ ] 新增 `applyFirstApprovalFinal` 函数：初审通过并生效
- [ ] 新增 `applyFirstApprovalForward` 函数：初审通过并提交复审
- [ ] 更新 Mock 数据：添加初审直接通过的示例记录

#### 1.2 更新 `versions.ts` 数据模型
- [ ] `KBVersion` 新增 `approvedBy: "first" | "second" | "direct"` 字段
- [ ] 更新版本派生逻辑，支持初审直接通过生成版本

#### 1.3 更新 `operations.ts` 操作日志
- [ ] 新增 action 类型：`first_approve_final` / `first_approve_forward`
- [ ] 更新日志派生逻辑

### 第二阶段：权限系统确认

#### 2.1 确认 `use-kb-role.ts`
- [x] 已正确实现四个独立角色（无需修改）
- [ ] 更新 `canSubmit` 逻辑：所有成员均可提交（包括复审人/创建者）
- [ ] 确认 `canFirstReview` / `canSecondReview` 逻辑正确

### 第三阶段：UI 组件改造

#### 3.1 拆分「待审核」Tab 为两个独立 Tab

**当前**: `pending-review-tab.tsx` 显示所有 pending 记录  
**目标**: 
- `pending-first-review-tab.tsx` - 待初审（仅初审人可见）
- `pending-second-review-tab.tsx` - 待复审（仅复审人/创建者可见）

**改造要点**:
- 待初审 Tab：
  - 数据源：`status === "pending_first"`
  - 权限：`canFirstReview && !canSecondReview`（初审人独占）
  - 操作：「通过并生效」「通过并提交复审」「驳回」
- 待复审 Tab：
  - 数据源：`status === "pending_second"`
  - 权限：`canSecondReview`
  - 操作：「复审通过」「复审驳回」

#### 3.2 新增「初审决策弹窗」组件

**文件**: `first-review-decision-dialog.tsx`

**触发时机**: 初审人点击「通过并生效」按钮

**弹窗内容**:
- 标题：「初审通过并直接生效」
- 说明：「该变更将跳过复审环节，直接生成新版本并生效。你可以选择填写不提交复审的理由（可选）。」
- 输入框：「不提交复审的理由（可选）」，最多 200 字
- 按钮：「取消」/「确认生效」

**数据流**:
```typescript
{
  result: "approved",
  skipSecondReview: true,
  reason?: string, // 可选填的理由
  reviewedAt: string
}
```

#### 3.3 更新「审核详情弹窗」

**文件**: `review-detail-dialog.tsx` / `review-detail-dialog-enhanced.tsx`

**改造要点**:
- 在「待初审」进入时，显示三个按钮：「通过并生效」「通过并提交复审」「驳回」
- 在「待复审」进入时，显示两个按钮：「复审通过」「复审驳回」
- 点击「通过并生效」→ 打开初审决策弹窗

#### 3.4 文档审核中锁定

**改造文件**: `documents-tab.tsx` / `documents-tab-enhanced.tsx`

**新增逻辑**:
```typescript
// 检查文档是否在审核中
function isDocumentUnderReview(documentId: string, kbId: string): boolean {
  return REVIEW_REQUESTS.some(
    r => r.kbId === kbId 
      && r.documentId === documentId 
      && (r.status === "pending_first" || r.status === "pending_second")
  )
}
```

**UI 变更**:
- 文件列表新增「审核状态」列，显示「审核中」橙色标签
- 审核中文档的「重命名」「删除」按钮置灰
- Hover 提示：「该文档正在审核中，暂不支持修改」
- 提交新操作时检查：若已有 pending 记录，拒绝并提示"该文档已有待审核的变更申请"

#### 3.5 更新「审批流弹窗」

**文件**: `approval-flow-dialog.tsx`

**改造要点**:
- 支持分支展示（初审直接通过 vs 转复审）
- 维护人员提交：
  - 初审直接通过：`提交 → 初审（通过并生效）`（2 节点，标注「跳过复审」）
  - 初审转复审：`提交 → 初审（通过并提交复审）→ 复审`（3 节点）
- 初审节点若选择「通过并生效」，显示可选填的理由

#### 3.6 更新主页面 Tab 构建逻辑

**文件**: `knowledge-detail.tsx`

**改造要点**:
```typescript
// 待初审 Tab（仅初审人独占，复审人/创建者不可见）
...(canFirstReview && !canSecondReview
  ? [{ key: "pending-first-review", label: "待初审", badge: 0 }]
  : []),
// 待复审 Tab（复审人/创建者可见）
...(canSecondReview
  ? [{ key: "pending-second-review", label: "待复审", badge: 0 }]
  : []),
```

**注意**: 创建者可见「待复审」，不可见「待初审」（因为创建者是独立角色，不自动拥有初审权）

#### 3.7 更新「我的提交」Tab

**文件**: `my-submissions-tab.tsx` / `my-submissions-tab-enhanced.tsx`

**改造要点**:
- 筛选器新增：「待初审」「待复审」
- 审核状态显示：
  - 待初审：橙色
  - 待复审：黄色
  - 已驳回：显示驳回环节（初审 / 复审）
- 「查看审批流」弹窗调用更新后的 `approval-flow-dialog.tsx`

#### 3.8 更新「版本记录」Tab

**文件**: `version-history-tab.tsx` / `version-history-tab-enhanced.tsx`

**改造要点**:
- 列表新增「生效方式」列：「初审直接生效」/「复审生效」/「直接提交」
- 初审人列为「—」时标注说明
- 复审人为「—」时标注「初审直接生效」

#### 3.9 更新「审核记录」Tab

**文件**: `review-records-tab.tsx` / `review-records-tab-enhanced.tsx`

**改造要点**:
- 审核状态显示：生效方式（初审直接生效 / 复审生效）
- 初审决策列：若初审直接通过，显示「通过并生效」+ 可选原因
- 已驳回记录显示驳回环节

#### 3.10 更新「操作记录」Tab

**文件**: `audit-log-tab.tsx` / `audit-log-tab-enhanced.tsx`

**改造要点**:
- 操作类型新增：`first_approve_final` / `first_approve_forward`
- 备注显示：初审直接通过显示「初审直接生效」+ 可选原因

### 第四阶段：乐观锁并发控制（前端模拟）

#### 4.1 前端模拟乐观锁

**实现方式**:
```typescript
// 审核操作时携带 version
function handleApprove(review: ReviewRequest, currentVersion: number) {
  // 模拟后端校验
  const latestReview = REVIEW_REQUESTS.find(r => r.id === review.id)
  if (latestReview?.version !== currentVersion) {
    alert("该记录已被他人处理，请刷新后重试")
    return
  }
  
  // 更新时 version + 1
  const updated = {
    ...review,
    version: currentVersion + 1,
    updatedAt: new Date().toISOString()
  }
  // ... 后续处理
}
```

#### 4.2 Toast 提示完善

**新增提示**:
- 初审通过并生效：「初审通过并生效，已生成 vX 版本」
- 初审通过并提交复审：「初审通过，已转交复审」
- 文档审核中：「该文档正在审核中，暂不支持修改」
- 并发冲突：「该记录已被他人处理，请刷新后重试」
- 文档已有 pending：「该文档已有待审核的变更申请，请等待审核完成后再操作」

### 第五阶段：Submit 提示更新

#### 5.1 更新「提交确认弹窗」

**文件**: `submit-confirm-dialog.tsx`

**改造要点**:
- 根据角色动态生成正文：
  - 维护人员：「你的本次{新增 / 删除 / 更新}操作将提交审核，需经**初审人审核**（初审人可选择直接生效或提交复审），审核通过后才会正式生效。」
  - 初审人：「你的本次{新增 / 删除 / 更新}操作将提交审核，需经**复审人审核**，审核通过后才会正式生效。」
  - 复审人/创建者：「你的本次{新增 / 删除 / 更新}操作将直接生效并生成新版本。」

## 文件清单

### 需要修改的文件
1. `src/mocks/reviews.ts` - 数据模型 + Mock 数据
2. `src/mocks/versions.ts` - 版本派生逻辑
3. `src/mocks/operations.ts` - 操作日志派生
4. `src/hooks/use-kb-role.ts` - 权限逻辑微调
5. `src/pages/workspace/knowledge-detail.tsx` - Tab 构建逻辑
6. `src/pages/workspace/knowledge-detail/documents-tab.tsx` - 审核中锁定
7. `src/pages/workspace/knowledge-detail/documents-tab-enhanced.tsx` - 审核中锁定
8. `src/pages/workspace/knowledge-detail/my-submissions-tab.tsx` - 筛选器更新
9. `src/pages/workspace/knowledge-detail/my-submissions-tab-enhanced.tsx` - 筛选器更新
10. `src/pages/workspace/knowledge-detail/version-history-tab.tsx` - 生效方式显示
11. `src/pages/workspace/knowledge-detail/version-history-tab-enhanced.tsx` - 生效方式显示
12. `src/pages/workspace/knowledge-detail/review-records-tab.tsx` - 初审决策显示
13. `src/pages/workspace/knowledge-detail/review-records-tab-enhanced.tsx` - 初审决策显示
14. `src/pages/workspace/knowledge-detail/audit-log-tab.tsx` - 新操作类型
15. `src/pages/workspace/knowledge-detail/audit-log-tab-enhanced.tsx` - 新操作类型
16. `src/pages/workspace/knowledge-detail/review-detail-dialog.tsx` - 初审决策按钮
17. `src/pages/workspace/knowledge-detail/review-detail-dialog-enhanced.tsx` - 初审决策按钮
18. `src/pages/workspace/knowledge-detail/approval-flow-dialog.tsx` - 分支展示
19. `src/pages/workspace/knowledge-detail/submit-confirm-dialog.tsx` - 提示文案

### 需要新建的文件
1. `src/pages/workspace/knowledge-detail/pending-first-review-tab.tsx` - 待初审 Tab
2. `src/pages/workspace/knowledge-detail/pending-second-review-tab.tsx` - 待复审 Tab
3. `src/pages/workspace/knowledge-detail/first-review-decision-dialog.tsx` - 初审决策弹窗

### 需要删除的文件
1. `src/pages/workspace/knowledge-detail/pending-review-tab.tsx` - 替换为两个独立 Tab

## 风险点与注意事项

### 1. 角色判断逻辑
- ⚠️ **关键**: 创建者是独立角色，不自动拥有初审权
- 待初审 Tab 可见性：`canFirstReview && !canSecondReview`（排除复审人/创建者）
- 待复审 Tab 可见性：`canSecondReview`（复审人/创建者）

### 2. 数据一致性
- 初审直接通过时：`firstReview.skipSecondReview = true`, `secondReview = undefined`
- 初审转复审时：`firstReview.skipSecondReview = false`, 后续填充 `secondReview`
- 版本号生成：初审直接通过 / 复审通过 / 直接提交 三种情况都要生成

### 3. 向后兼容
- 现有 Mock 数据中未设置 `version` 字段的记录，默认为 `1`
- 现有未设置 `skipSecondReview` 的 `firstReview`，默认为 `false`

### 4. UI 一致性
- enhanced 版本和普通版本需要同步改造
- 弹窗组件共用性：初审决策弹窗可被 enhanced 版本复用

## 实施顺序建议

**第一批**: 数据层（不影响 UI）
- reviews.ts / versions.ts / operations.ts

**第二批**: 权限与 Tab 结构
- use-kb-role.ts / knowledge-detail.tsx

**第三批**: 核心审核流程
- pending-first-review-tab.tsx / pending-second-review-tab.tsx / first-review-decision-dialog.tsx

**第四批**: 周边功能
- 文档锁定 / 审批流 / 我的提交 / 版本记录 / 审核记录 / 操作记录

**第五批**: UI 优化
- enhanced 版本同步 / Toast 提示 / 提交确认弹窗
