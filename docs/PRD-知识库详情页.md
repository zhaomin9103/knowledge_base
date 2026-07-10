# PRD - 知识库详情页

**版本**: 1.0
**产品**: 合工大 AI 辅导员 - 知识库管理
**范围**: 知识库详情页（`/workspace/knowledge/:id`）

---

## 产品概述

知识库详情页是知识库管理系统的核心页面，实现基于多级审核机制的文档管理功能。系统采用四角色分级审核模型，支持文档的增删改操作审核、版本管理、成员管理等完整功能。

**核心特性**：
- 四角色分级权限体系（创建者、复审人、初审人、维护人员）
- 多级审核流程，初审人拥有终点决策权
- 文档审核中锁定机制，防止审核基准变动
- 乐观锁并发控制，防止多人同时操作冲突
- 版本记录按日期分组显示，智能归档历史版本
- 完整的操作日志追溯

---

## 1. 角色与权限

系统采用**多级审核链**，初审人拥有**终点决策权**。共 **4 个独立角色**，按审核层级从低到高排列：

| 角色 | 标识 | 审核层级 | 核心权限 | 自身提交的生效路径 | 文档操作提交方式 |
|------|------|---------|---------|-------------------|-----------------|
| 创建者 | `owner` | 初审级 + 管理权 | 成员管理 + 初审 | 需复审后生效（或初审直接生效） | 弹窗确认，走审核流 |
| 复审人 | `secondReviewer`（原 `admin`）| 复审级（最高） | 复审 | 直接生效 | **直接生效，无弹窗** |
| 初审人 | `firstReviewer`（新增）| 初审级 | 初审（**含终点决策权**） | 需复审后生效（或初审直接生效） | 弹窗确认，走审核流 |
| 维护人员 | `maintainer` | 提交级（最低）| 提交增删改 | 需初审（初审人决定是否需复审） | 弹窗确认，走审核流 |

**审核层级模型**（第一性原理）：
- 每个角色对应一个**审核层级** `reviewLevel`：维护人员 `1` < 初审人 `2` = 创建者 `2` < 复审人 `3`。
- 维护人员的提交需经初审人审核，**初审人审核通过时自主决定**：
  - 「通过并生效」：直接生效，生成版本，无需复审
  - 「通过并提交复审」：转入待复审环节，由复审人最终决定
- 初审人/创建者自己的提交需经复审人审核后生效（避免自审自批）。
- 复审人的提交无需审核，直接生效。

**流程降级规则**（角色配置不完整时）：
- **没有复审人**（`secondReviewerIds.length === 0`）：
  - 维护人员提交 → 初审人审核 → **只能选择「通过并生效」**（隐藏「提交复审」按钮）
  - 初审人/创建者提交 → **直接生效**（跳过复审环节）
  - UI 提示：提交确认弹窗显示"您的提交将直接生效（当前知识库未配置复审人）"
- **只有创建者**（最极端情况）：
  - 创建者提交 → **直接生效**（无需审核）
  - 维护人员提交 → 创建者初审 → 直接生效

**权限判定逻辑**（`useKBRole`）：
- 创建者：`kb.ownerId === userId`
- 复审人：`kb.secondReviewerIds.includes(userId)`（原 `adminIds`）
- 初审人：`kb.firstReviewerIds.includes(userId)`
- 维护人员：`kb.maintainerIds.includes(userId)`
- 优先级（权限继承）：复审人 > 创建者 = 初审人 > 维护人员
- **创建者拥有初审权 + 成员管理权**：创建者可以执行初审操作，同时独有「成员管理」能力（`canManageMembers`）
- **所有成员对文档享有平等操作权**：任何成员均可删改知识库内的任何文档，但操作需按角色走相应审核流程。

**可见 Tab**：

| 角色 | 可见 Tab |
|------|----------|
| 创建者 | 文件 · 我的提交 · 待初审 · 版本记录 · 审核记录 · 操作记录 · 成员管理 |
| 复审人 | 文件 · 我的提交 · 待复审 · 版本记录 · 审核记录 · 操作记录 |
| 初审人 | 文件 · 我的提交 · 待初审 · 版本记录 · 审核记录 · 操作记录 |
| 维护人员 | 文件 · 我的提交 |

> **说明**：初审人、复审人、创建者自身也可提交增删改，故均可见「我的提交」用于追踪自身提交的流转状态。

---

## 2. 页面结构

### 2.1 页面头部

**元素**：
- 返回按钮：跳转到 `/workspace/knowledge`
- 知识库图标 + 名称
- 当前角色标签：创建者 / 复审人 / 初审人 / 维护人员
- 操作按钮（根据角色显示）：
  - 创建者：**设置** + **导入文件**
  - 复审人 / 初审人 / 维护人员：**导入文件**

### 2.2 Tab 导航

动态构建，根据角色显示对应 Tab。每个 Tab 可带角标（badge）显示未处理数量：
- 「待初审」角标：`status === "pending_first_review"` 的数量（初审人可见）
- 「待复审」角标：`status === "pending_second_review"` 的数量（复审人 / 创建者可见）

**维护人员 Tab 提示**：
- 在维护人员角色的 Tab 导航行最右侧显示灰色提示文字："增删改操作需经审核后才会生效"
- 文字颜色：`#666666`
- 仅维护人员角色显示此提示

---

## 3. 功能模块

### 3.1 文件（所有角色可见）

**数据源**: `DOCUMENTS_BY_KB[kbId]`

**功能**：
- 搜索：按文件名过滤（前端搜索）
- 统计：显示文件总数 + 总大小
- 列表字段：
  - 文件：图标 + 名称 + 大小
  - 上传时间
  - 分块数量：`chunkCount`
  - 解析方式：`parseMode`
  - 解析状态：`success`（成功）/ `pending`（解析中）/ `failed`（失败）
  - **审核状态**：显示该文档是否在审核中（见下方"审核中锁定"）
  - 操作：更多菜单
    - 重新解析
    - 重命名（**审核中置灰**）
    - 下载
    - 删除（二次确认 + **审核中置灰** + **提交需经审核提示**，详见 6.2）

**文件扩展名 → 图标映射**：
- `docx` / `doc`: `FileText` + 蓝色
- `pdf`: `FileText` + 红色
- `xlsx` / `xls`: `FileText` + 绿色
- `md`: `FileText` + 灰色
- 其他: `File` + 灰色

**审核中锁定**：
- **锁定规则**：文档存在 `status in (pending_first_review, pending_second_review)` 的 `ReviewRequest` 时，视为"审核中"。**审批流程中的文档不支持编辑、删除操作。**
- **双重判断时机**：编辑 / 删除操作在**两个时机**均需校验文档是否处于审批中：
  1. **点击「编辑」/「删除」按钮时**：若文档审批中，拦截操作，不进入编辑态
  2. **编辑后点击「提交保存」时**：再次校验（防止用户长时间停留在编辑态期间该文档进入审批流程），若审批中则拦截保存
- **问答对文件的分段操作同样受限**：问答对（QA）文件中针对**单个分段（chunk）的增 / 删 / 改**操作，同样需走审批中判断——文档处于审批流程时，其分段的增删改一并被拦截
- **Toast 提示**：命中拦截时提示【当前文档正在审批流程中，不支持编辑/删除】
- **UI 表现**：
  - 操作菜单中的「重命名」「删除」按钮置灰或隐藏
  - hover 提示："该文档正在审核中，暂不支持修改"
  - 审核状态列显示橙色「审核中」标签
- **提交校验**：用户尝试提交删改操作时，前端检查 + 后端二次校验，若文档已有 pending 记录，则拒绝并提示"该文档已有待审核的变更申请，请等待审核完成后再操作"
- **唯一性约束**：一个文档同时只能有一个 pending 状态的 `ReviewRequest`（数据库唯一索引或业务层校验）
- **驳回后可重新提交**：文档的 `ReviewRequest` 状态变为 `rejected` 后，视为审核结束，允许立即重新提交新的变更申请

> **增删改操作的审核入口**：文件 Tab 内的「导入 / 重命名 / 删除」等增删改操作提交时，均按提交者的审核层级进入审核链（见 5.1）。提交前须弹出「提交需经审核」提示（见 6.2 与 6.5）。

---

### 3.2 我的提交（所有可提交角色可见）

**数据源**: `REVIEW_REQUESTS` 筛选条件 `kbId === kbId && submitter.id === currentUserId`

> 维护人员、初审人、复审人、创建者均可提交增删改，故都可见此 Tab。

**角色差异化展示**：

#### 纯复审人（`isSecondReviewer && !isOwner`）
- **不显示筛选器**：复审人提交直接生效，无需审核流程
- **列表字段**：
  - 提交时间：`createdAt`
  - 提交类型：新增 / 更新 / 删除（徽章）
  - 提交内容：文件图标 + 名称 + 大小（点击预览文档）
  - 变更说明：`changeDescription`
  - **不显示"审核状态"列**
  - **不显示"审核详情"列**
- **显示所有记录**：包括已生效的记录

#### 其他角色（创建者、初审人、维护人员）
创建者虽具备复审能力，但在"我的提交"Tab中按初审人角色对待，显示完整审核流程。

- **显示筛选器**（包含已生效记录）：
  - 全部：所有提交记录总数（含 `approved`）
  - 待审核：`status === "pending_first"` 或 `"pending_second"`
  - 审核驳回：`status === "rejected"`

- **列表字段**：
  - 提交时间：`createdAt`
  - 提交类型：新增 / 更新 / 删除（徽章）
  - 提交内容：文件图标 + 名称 + 大小（点击预览文档）
  - 变更说明：`changeDescription`
  - **审核状态**：
    - 待初审：橙色"待初审"徽章
    - 待复审：黄色"待复审"徽章
    - 审核通过：绿色"审核通过"徽章
    - 已驳回：红色"审核驳回"徽章 + 显示驳回原因
  - **审核详情**：按钮「查看审批流」

- **显示所有记录**：包括已生效的记录

**交互**：
- 点击文件名 → 打开「文档预览弹窗」
- 点击「查看审批流」 → 打开「审批流弹窗」（显示提交 → 初审 → 复审的多节点流转，见 6.1）

**数据说明**：
初审人和创建者的提交记录包括：
- 待复审的记录（`skipFirstReview: true, status: "pending_second"`）
- 初审直接生效的记录（`firstReview.skipSecondReview: true, status: "approved"`）
- 经复审通过的记录（`secondReview.result: "approved", status: "approved"`）

---

### 3.3 待初审（初审人 / 创建者可见）

**数据源**: `REVIEW_REQUESTS` 筛选条件 `kbId === kbId && status === "pending_first_review"`

> 仅展示需要初审的提交（提交者为维护人员）。初审人自身的提交不会出现在此（其流程直接进入待复审）。

**列表字段**：
- 提交人：姓名 + 工号
- 提交时间
- 操作类型：新增 / 更新 / 删除
- 文档名称：图标 + 名称 + 大小（点击预览）
- 变更说明
- 操作：
  - **详情**：打开「审核详情弹窗」
    - 更新操作：左右对比（原文档 vs 变更后），显示 +N/-M 行变化
    - 新增 / 删除：单侧内容展示
    - 弹窗内可执行「通过并生效」「通过并提交复审」「驳回」
  - **通过并生效**：初审直接通过，生成版本，无需复审
  - **通过并提交复审**：转入待复审环节，由复审人最终决定
  - **初审驳回**：打开「驳回原因弹窗」，原因必填

**初审通过并生效逻辑（终点决策权）**：
1. 记录从待初审列表移除
2. 状态变更为 `approved`（直接生效）
3. **生成新版本**（`currentVersion + 1`）
4. 写入版本记录（`appliedVersion`，仅记录初审人，无复审人）
5. 写入初审记录（`firstReview.result = "approved"`, `firstReview.skipSecondReview = true`）
6. 写入操作日志（`action = "first_approve_final"`，可选填不提交复审的原因）

**初审通过并提交复审逻辑**：
1. 记录从待初审列表移除
2. 状态变更为 `pending_second_review`（进入待复审）
3. 写入初审记录（`firstReview.result = "approved"`, `firstReview.skipSecondReview = false`）
4. 写入操作日志（`action = "first_approve_forward"`）
5. **不生成版本**（版本仅在复审通过后生成）

**初审驳回逻辑**：
1. 记录从待初审列表移除
2. 状态变更为 `rejected`
3. 驳回原因写入 `firstReview.reason`（必填）
4. 标记驳回环节 `rejectedStage = "first"`
5. 写入初审记录（`firstReview.result = "rejected"`）
6. 写入操作日志（`action = "first_reject"`）

---

### 3.4 待复审（复审人 / 创建者可见）

**数据源**: `REVIEW_REQUESTS` 筛选条件 `kbId === kbId && status === "pending_second_review"`

> 展示两类提交：① 已通过初审的维护人员提交；② 初审人直接提交（初审人的提交跳过初审、直接进入待复审）。可通过 `firstReview` 是否存在区分二者。

**列表字段**：
- 提交人：姓名 + 工号
- 提交时间
- 操作类型：新增 / 更新 / 删除
- 文档名称：图标 + 名称 + 大小（点击预览）
- 变更说明
- 初审信息（若有）：初审人姓名 + 初审通过时间；初审人直接提交则标注「初审人提交，免初审」
- 操作：
  - **详情**：打开「审核详情弹窗」
    - 更新操作：左右对比（原文档 vs 变更后），显示 +N/-M 行变化
    - 新增 / 删除：单侧内容展示
    - **弹窗底部展示审批流时间线**，已完成节点显示操作人姓名 + 工号
    - 弹窗内可执行 复审通过 / 复审驳回
  - **复审通过**：直接审核通过并生效
  - **复审驳回**：打开「驳回原因弹窗」，原因必填

**复审通过逻辑（生效）**：
1. 记录从待复审列表移除
2. 状态变更为 `approved`
3. 生成新版本（`currentVersion + 1`）
4. 写入版本记录（`appliedVersion`，同时记录初审人 + 复审人）
5. 写入复审记录（`secondReview.result = "approved"`）
6. 写入操作日志（`action = "second_approve"`）

**复审驳回逻辑**：
1. 记录从待复审列表移除
2. 状态变更为 `rejected`
3. 驳回原因写入 `secondReview.reason`（必填）
4. 写入复审记录（`secondReview.result = "rejected"`）
5. 写入操作日志（`action = "second_reject"`）

---

### 3.5 版本记录（初审人 / 复审人 / 创建者可见）

**数据源**: `deriveVersions(kbId)` - 从生效记录派生

#### 按日期分组显示

**分组规则**：
- 版本按生效日期分组（`YYYY-MM-DD`）
- 同一天的版本可折叠/展开
- 日期显示规则：
  - 今天：显示"今天"
  - 昨天：显示"昨天"
  - 更早：显示"M月D日"（如"6月12日"）

**默认展开状态**：
- 今天和昨天的版本默认展开
- 更早的日期默认折叠

**日期分组头部**：
```
[▼] 今天 (3个版本)               [最新]
[▶] 昨天 (2个版本)
[▶] 6月12日 (4个版本)
```

**同一天内排序**：版本号倒序（最新的在上）

#### 智能归档

**归档策略**：
- 默认仅显示最近 **50 个版本**（活跃版本）
- 超过 50 个的旧版本自动进入"历史归档"
- 归档版本不影响数据完整性，可随时查看

**归档入口**：
- 在版本列表底部显示：`[归档图标] 查看历史归档 (35个版本)`
- 点击后展开显示所有历史版本
- 再次点击：`[归档图标] 隐藏历史归档`

**统计信息栏**：
```
[图标] 当前版本: v16  │  总版本数: 52  │  📦 已归档: 2
```

#### 版本列表字段

**版本卡片显示**：
- 版本号：v1, v2, v3...（递增）
- 操作类型徽章：
  - `init`：知识库初始化（紫色"初始版本"标签）
  - `add`：新增（绿色徽章）
  - `update`：更新（蓝色徽章）
  - `delete`：删除（红色徽章）
- 当前版本标识：绿色"当前版本"徽章
- 文档名称：文件图标 + 名称
- 变更说明：`changeDescription`
- 生效时间：精确到分钟
- 提交人：姓名（工号）
- 审核人：姓名（工号）- 终审/通过人
- 操作按钮：「回退到此版本」（仅创建者可见，当前版本不可回退）

**版本生成规则**：
- v1 固定为知识库初始化（`operation = "init"`）
- v2+ 由以下情况生成：
  - **初审直接通过**（`status === "approved" && firstReview.skipSecondReview === true`）
  - **复审通过**（`status === "approved" && secondReview.result === "approved"`）
  - **复审人直接提交**（`skipFirstReview === true && status === "approved"`）
- 初审通过但转入复审的记录不生成版本（仅 `pending_second_review` 状态）

**交互**：
- 点击日期分组头部 → 展开/折叠该日期的版本列表
- 点击「回退到此版本」 → 打开回退确认弹窗
- 点击「查看历史归档」 → 显示所有版本（含归档）
- 点击「隐藏历史归档」 → 仅显示最近 50 个版本

---

### 3.6 审核记录（初审人 / 复审人 / 创建者可见）

**数据源**: `REVIEW_REQUESTS` 筛选条件 `kbId === kbId`

> 显示所有提交记录，包括审核中状态、已通过、已驳回。

**筛选器**：
- 全部：所有提交记录（含审核中、已通过、已驳回）
- 已通过：`status === "approved"`
- 已驳回：`status === "rejected"`（含初审驳回与复审驳回）

**列表字段**：
- **提交时间**：已审结显示审结时间，审核中显示提交时间
- **审核状态**：
  - 审核通过：绿色"审核通过"徽章
  - 审核驳回：红色"审核驳回"徽章
  - 审核中：黄色"审核中"徽章（带时钟图标）
- **审核人**：
  - 已审结：显示实际审核人姓名（工号）
  - 审核中：显示当前应审核人的真实姓名（工号）
    - `pending_first` → 从知识库配置的 `firstReviewerIds` 查询
    - `pending_second` → 从知识库配置的 `secondReviewerIds` 查询
- 操作类型：新增 / 更新 / 删除（徽章）
- 文档名称：图标 + 名称 + 大小（点击预览）
- 提交人：姓名 + 工号
- 变更说明：`changeDescription`
- **驳回原因 / 生效版本**：
  - 已驳回：显示驳回原因（红色文字）
  - 已通过：显示生效版本号（如 v13）
  - 审核中：显示"—"

**操作列**：
- 查看详情：打开详情弹窗（含审批流时间线，**已完成节点显示操作人姓名 + 工号**）
- 预览文档：打开文档预览弹窗

**交互**：
- 点击「查看详情」 → 打开「审核详情弹窗」，底部显示完整审批流时间线

---

### 3.7 操作记录（初审人 / 复审人 / 创建者可见）

**数据源**: `OPERATION_LOGS` 筛选条件 `kbId === kbId`

**数据来源**：
- 从审核记录派生（每条记录按其实际流转生成多条日志：提交日志 + 初审日志 + 复审日志）
- 成员管理操作（`add_member`, `remove_member`, `change_role`）

**列表字段**：
- 操作时间：`timestamp`
- 操作人：姓名 + 工号 + 组织
- 操作类型：
  - `submit_add` / `submit_update` / `submit_delete`：提交新增 / 更新 / 删除
  - `first_approve_final`：初审通过并生效（跳过复审）
  - `first_approve_forward`：初审通过并提交复审
  - `first_reject`：初审驳回
  - `second_approve`：复审通过
  - `second_reject`：复审驳回
  - `add_member` / `remove_member` / `change_role`：成员操作
- 操作对象：
  - 文档：图标 + 名称
  - 成员：姓名 + 角色
- 备注：
  - 初审/复审通过：显示生效版本号（若有）
  - 初审直接通过：显示「初审直接生效」+ 可选原因
  - 初审/复审驳回：显示驳回原因

**排序**：按时间倒序

---

### 3.8 成员管理（仅创建者可见）

**数据源**:
- 创建者：`kb.ownerId`
- 复审人列表：`kb.secondReviewerIds[]`
- 初审人列表：`kb.firstReviewerIds[]`
- 维护人员列表：`kb.maintainerIds[]`

**统计**：
- 总成员数 = 创建者数 + 复审人数 + 初审人数 + 维护人员数
- 分角色统计（不同颜色区分）

**搜索**：按姓名 / 工号 / 组织过滤（前端搜索）

**列表字段**：
- 成员：头像（首字母） + 姓名 + 「我」标签（当前用户）
- 工号：`idNo`
- 所属组织：`organization`
- 角色：
  - 创建者：红色徽章，不可变更
  - 复审人：蓝色徽章，可变更
  - 初审人：紫色徽章，可变更
  - 维护人员：绿色徽章，可变更
- 加入时间：`joinedAt`
- 操作：
  - 移除：按钮（创建者不可移除）

**角色编辑**：
- 鼠标悬停在角色徽章上 → 显示下拉选择器
- 可在复审人 / 初审人 / 维护人员间切换
- 创建者角色不可变更

**新增成员**：
- 按钮「新增成员」 → 打开「添加成员弹窗」
- 多选用户（排除已在成员列表中的用户）
- 选择角色：复审人 / 初审人 / 维护人员
- 确认后批量添加

**移除成员**：
- 点击移除按钮 → 打开二次确认弹窗
- 显示成员姓名 + 角色
- 确认后从对应角色列表移除
- 创建者不可移除
- **待处理审核限制（仅复审人受限）**：
  - **复审人**：若其名下存在 `pending_second`（待复审）记录，则**不可移除**。弹窗显示提示「当前有待复审任务，请等待复审完成或添加新的复审人员后再尝试」，仅保留「知道了」按钮
  - **初审人不受此限制**：即使存在待初审任务也可直接移除。原因：创建者本身具备初审权限，移除某个初审人后，待初审任务仍可由创建者或其他初审人处理，不会卡死流程；而复审权限仅复审人持有（创建者不作纯复审），移除最后的复审人会导致待复审任务无人处理
  - 维护人员：无审核任务，正常移除

---

## 4. 数据模型

### 4.1 知识库（KnowledgeBase）

```typescript
{
  id: string
  name: string
  category: string
  fileCount: number
  sizeMB: number
  creator: string
  cover?: string
  updatedAt: string
  ownerId: string                 // 创建者
  secondReviewerIds: string[]     // 复审人列表
  firstReviewerIds: string[]      // 初审人列表
  maintainerIds: string[]         // 维护人员列表
  currentVersion: number          // 当前版本号
}
```

### 4.2 审核记录（ReviewRequest）

```typescript
{
  id: string
  kbId: string
  submitter: {
    id: string
    name: string
    organization: string
    idNo: string
  }
  submitterRole: "maintainer" | "firstReviewer" | "secondReviewer" | "owner"  // 决定审核链路
  operation: "add" | "update" | "delete"
  documentId?: string           // update/delete 时填
  documentName: string
  documentExt: string
  fileSizeBytes?: number
  changeDescription: string     // 变更说明（必填）
  status:
    | "pending_first_review"    // 待初审（维护人员提交后）
    | "pending_second_review"   // 待复审（初审通过并转入复审，或初审人直接提交）
    | "approved"                // 已生效（初审直接通过，或复审通过）
    | "rejected"                // 已驳回（初审或复审任一环节驳回）
  firstReview?: {               // 初审结果（免初审时为 undefined）
    reviewerId: string
    reviewerName: string
    reviewerIdNo?: string
    result: "approved" | "rejected"
    skipSecondReview?: boolean  // 初审人选择直接生效时为 true，转入复审时为 false
    reason?: string             // 初审驳回原因（驳回时必填）；或初审直接通过的可选说明
    reviewedAt: string
  }
  secondReview?: {              // 复审结果
    reviewerId: string
    reviewerName: string
    reviewerIdNo?: string
    result: "approved" | "rejected"
    reason?: string             // 复审驳回原因
    reviewedAt: string
  }
  rejectedStage?: "first" | "second"  // status 为 rejected 时，标记驳回环节
  appliedVersion?: number       // 生效后的版本号（初审直接通过或复审通过时填入）
  version: number               // 乐观锁版本号，每次更新递增，防止并发冲突
  createdAt: string
  updatedAt: string             // 最后更新时间，配合 version 实现乐观锁
}
```

**状态与链路对照**：

| 提交者角色 | 初始 status | 链路 |
|-----------|-------------|------|
| 维护人员 | `pending_first_review` | 初审（可能直接生效或转复审）→ 复审（若转入）→ 生效 |
| 初审人 | `pending_second_review` | 复审 → 生效（免初审） |
| 复审人 / 创建者 | `approved`（直接生效） | 无需审核 |

**并发控制说明**：
- 审核操作提交时，需携带当前 `version` 值
- 后端校验：若数据库中的 `version` 已变更（其他审核人已处理），则拒绝操作并提示"该记录已被他人处理，请刷新后重试"
- 每次更新操作（初审通过/驳回、复审通过/驳回）后，`version` 递增 1，`updatedAt` 更新为当前时间

### 4.3 文档（Document）

```typescript
{
  id: string
  name: string
  ext: string
  sizeBytes: number
  uploadedAt: string
  chunkCount: number
  parseMode: string
  status: "success" | "pending" | "failed"
}
```

### 4.4 版本记录（KBVersion）

```typescript
{
  version: number
  kbId: string
  operation: "init" | "add" | "update" | "delete"
  documentName?: string
  documentExt?: string
  changeDescription?: string
  submitterId?: string
  submitterName?: string
  submitterIdNo?: string
  firstReviewerId?: string      // 初审人（免初审或初审直接通过则可能为空）
  firstReviewerName?: string
  firstReviewerIdNo?: string
  secondReviewerId?: string     // 复审人（初审直接通过则为空）
  secondReviewerName?: string
  secondReviewerIdNo?: string
  approvedBy: "first" | "second" | "direct"  // 生效方式：初审直接生效 / 复审生效 / 直接提交生效
  createdAt: string
  reviewRequestId?: string
}
```

**生效方式说明**：
- `approvedBy = "first"`：初审人直接通过并生效（`skipSecondReview = true`），此时 `secondReviewerId` 为空
- `approvedBy = "second"`：复审人通过生效，`firstReviewerId` 和 `secondReviewerId` 均有值
- `approvedBy = "direct"`：复审人/创建者直接提交生效，`firstReviewerId` 和 `secondReviewerId` 均为空

### 4.5 操作日志（OperationLog）

```typescript
{
  id: string
  kbId: string
  timestamp: string
  actor: {
    id: string
    name: string
    idNo: string
    organization: string
  }
  action: "submit_add" | "submit_update" | "submit_delete"
        | "first_approve_final"   // 初审通过并生效
        | "first_approve_forward" // 初审通过并提交复审
        | "first_reject"
        | "second_approve"
        | "second_reject"
        | "add_member" | "remove_member" | "change_role"
  target: {
    type: "document" | "member" | "version"
    name: string
    ext?: string
  }
  reviewRequestId?: string
  meta?: {
    reason?: string    // 驳回原因 / 初审直接通过的可选说明
    version?: number   // 生效版本号
    stage?: "first" | "second"  // 审核环节
    skipSecondReview?: boolean  // 初审是否跳过复审
  }
}
```

---

## 5. 状态流转

### 5.1 多级审核流程（含初审终点决策权）

```
【维护人员提交】
    ↓
[pending_first_review] 待初审
    ↓ 初审人审核
    ├─ 初审通过并生效 → [approved] + 生成新版本 + 写版本记录(仅含初审人) + 写操作日志
    ├─ 初审通过并提交复审 → [pending_second_review] 待复审
    │       ↓ 复审人复审
    │       ├─ 复审通过 → [approved] + 生成新版本 + 写版本记录(含初审人+复审人) + 写操作日志
    │       └─ 复审驳回 → [rejected](rejectedStage=second) + 驳回原因 + 写操作日志
    └─ 初审驳回 → [rejected](rejectedStage=first) + 驳回原因 + 写操作日志

【初审人/创建者提交】（免初审）
    ↓
[pending_second_review] 待复审
    ↓ 复审人复审
    ├─ 复审通过 → [approved] + 生成新版本 + 写版本记录(仅含复审人) + 写操作日志
    └─ 复审驳回 → [rejected](rejectedStage=second) + 驳回原因 + 写操作日志

【复审人提交】（免审）
    ↓
[approved] 直接生效 + 生成新版本 + 写版本记录(无审核人) + 写操作日志
```

**核心规则（第一性原理）**：
- 维护人员的提交必须经过初审，初审人决定是否需要复审。
- 初审人拥有**终点决策权**：可选择「通过并生效」（跳过复审）或「通过并提交复审」。
- 初审人/创建者自己的提交需经复审（避免自审自批）。
- 复审人的提交无需审核，直接生效。
- 任一环节驳回即终止（`rejected`），驳回后可立即重新提交。

**流程降级规则**（角色配置不完整时）：
- **没有复审人时**（`secondReviewerIds.length === 0`）：
  - 维护人员提交 → 初审 → **只能选择「通过并生效」**（自动隐藏「提交复审」按钮）
  - 初审人/创建者提交 → **直接生效**（自动跳过复审环节，状态直接变为 `approved`）
  - 版本记录标记：`approvedBy = "first"` 或 `approvedBy = "direct"`
- **只有创建者时**（极端情况）：
  - 创建者提交 → **直接生效**（无需审核）
  - 维护人员提交 → 创建者初审 → 直接生效

### 5.2 版本生成规则

- v1：知识库初始化（固定）
- v2+：以下任一情况生成新版本
  - **初审直接通过**（`status === "approved" && firstReview.skipSecondReview === true`）
  - **复审通过**（`status === "approved" && secondReview.result === "approved"`）
  - **复审人直接提交**（`status === "approved" && firstReview === undefined && secondReview === undefined`）
  - **降级场景**（无复审人时，初审人/创建者直接提交 → 直接生效）
- 版本号递增，不可回退
- 每个版本记录标记 `approvedBy` 字段，追溯生效方式

### 5.3 并发控制规则

- **乐观锁**：每条 `ReviewRequest` 包含 `version` 字段，初始值为 1
- **审核操作流程**：
  1. 前端读取记录时获取当前 `version`
  2. 用户提交审核操作时，携带该 `version`
  3. 后端更新前校验：`WHERE id = ? AND version = ?`
  4. 若 `version` 不匹配，返回错误："该记录已被他人处理，请刷新后重试"
  5. 更新成功后，`version` 递增 1，`updatedAt` 更新
- **文档唯一 pending 约束**：提交新的变更申请时，检查该 `documentId` 是否已有 `status in (pending_first_review, pending_second_review)` 的记录，若有则拒绝并提示"该文档已有待审核的变更申请"

---

## 6. 交互规则

### 6.1 弹窗

1. **文档预览弹窗**：
   - 触发：点击文件名
   - 内容：
     - 新增：预览新增的文档
     - 删除：预览待删除的原文档
     - 更新：预览变更后的文档

2. **审核详情弹窗**：
   - 触发：点击「详情」按钮
   - 内容：
     - 更新操作：左右对比（原文档 | 变更后），标注 +N/-M 行
     - 新增 / 删除：单侧展示
     - **底部审批流时间线（所有进入方式均显示，不再限于只读模式）**：显示完整的提交 → 初审 → 复审流程
       - **已完成 / 已驳回节点显示操作人的姓名 + 工号**（提交人取 `submitter.idNo`，初审人取 `firstReview.reviewerIdNo`，复审人取 `secondReview.reviewerIdNo`）
       - 等待中节点（"等待初审 / 等待复审"）为占位文案，无操作人，不显示工号
   - 操作（根据进入入口不同）：
     - 在「待初审」Tab 进入时：显示三个按钮「通过并生效」「通过并提交复审」「驳回」，**弹窗底部同时展示审批流时间线**
     - 在「待复审」Tab 进入时（复审人处理弹窗）：显示两个按钮「复审通过」「复审驳回」，**弹窗底部同时展示审批流时间线，已完成节点含操作人姓名 + 工号**
     - 在「审核记录」或「我的提交」只读模式进入时：不显示审核按钮，展示审批流（已完成节点含操作人姓名 + 工号）

3. **初审决策弹窗**：
   - 触发：初审人点击「通过并生效」按钮
   - 内容：
     - 标题：「初审通过并直接生效」
     - 说明：「该变更将跳过复审环节，直接生成新版本并生效。你可以选择填写不提交复审的理由（可选）。」
     - 输入框：「不提交复审的理由（可选）」，最多 200 字
     - 按钮：「取消」/「确认生效」
   - 确认后：状态变更为 `approved`，`firstReview.skipSecondReview = true`，生成版本
   - **降级场景**：当 `secondReviewerIds.length === 0` 时，此弹窗仍然显示，但提示文案改为"当前知识库未配置复审人，通过后将直接生效"

4. **驳回原因弹窗**：
   - 触发：点击「驳回」或「复审驳回」按钮
   - 必填：驳回原因（不填不可提交）
   - 确认后：状态变更为 `rejected`，并记录 `rejectedStage`

5. **审批流弹窗**：
   - 触发：点击「查看审批流」
   - 内容：完整链路的节点流转图，**节点根据实际流转动态显示**：
     - **提交节点**（始终显示）
     - **初审节点**：
       - 跳过初审（`skipFirstReview: true`）：显示"初审（免审）"置灰节点
       - 已初审：显示初审人姓名 + 结果（通过/驳回）
       - 待初审（`status === "pending_first"`）：显示"等待初审"高亮节点
     - **复审节点**（条件显示）：
       - **仅当满足以下条件之一时才显示复审节点**：
         1. 已有复审记录（`secondReview` 存在）
         2. 当前状态是 `pending_second`（实际进入复审环节）
       - **不在以下情况显示复审节点**：
         1. 还在初审环节（`pending_first`）
         2. 初审驳回（`firstReview.result === "rejected"`）
         3. 初审直接生效（`firstReview.skipSecondReview === true` 且 `status === "approved"`）
     - 节点显示内容：
       - 处理人姓名 + 工号
       - 时间戳（已处理）或"—"（待处理）
       - 结果标识（通过/驳回/待处理）
       - 初审直接生效时，标题显示"初审通过（直接生效）"并附带生效版本号
   - 每个节点状态可视化：
     - 已完成：绿色勾选图标
     - 当前进行：黄色时钟图标（动画）
     - 已驳回：红色叉号图标 + 显示驳回原因
     - 待处理：灰色时钟图标
   - 节点间连接线根据状态着色（成功绿色、驳回红色、待处理灰色）

6. **添加成员弹窗**：
   - 触发：点击「新增成员」按钮
   - 列表默认为空，引导用户主动搜索
   - 支持按姓名/工号搜索
   - 标题栏显示"已选 X 人"实时反馈
   - 操作：
     - 多选用户（排除已加入的成员）
     - 选择角色：复审人 / 初审人 / 维护人员
     - 确认后批量添加

7. **移除成员确认弹窗**：
   - 触发：点击「移除」按钮
   - 显示：成员姓名 + 角色
   - 确认后：从对应列表移除

### 6.2 二次确认场景

- 删除文档（+ 审核中锁定检查 + 提交需经审核提示）
- 移除成员
- 初审驳回 / 复审驳回（必填原因）
- 初审直接通过（可选填理由）

### 6.3 Toast 提示

- 提交成功（维护人员）：「已提交，等待初审」
- 提交成功（初审人）：「已提交，等待复审」
- 提交成功（复审人 / 创建者）：「已提交并生效，已生成 vX 版本」
- 初审通过并生效：「初审通过并生效，已生成 vX 版本」
- 初审通过并提交复审：「初审通过，已转交复审」
- 初审驳回：「已初审驳回：{文档名} | 原因：{reason}」
- 复审通过：「复审通过，已生成 vX 版本」
- 复审驳回：「已复审驳回：{文档名} | 原因：{reason}」
- 文档审核中：「该文档正在审核中，暂不支持修改」
- 并发冲突：「该记录已被他人处理，请刷新后重试」
- 文档已有 pending：「该文档已有待审核的变更申请，请等待审核完成后再操作」
- 添加成员：「已添加 N 位成员」
- 移除成员：「已移除成员：{姓名}」

### 6.4 审核中锁定提示

**场景**：用户尝试删改一个正在审核中（pending 状态）的文档。

**UI 表现**：
- 文件列表：该文档的「重命名」「删除」按钮置灰
- Hover 提示：「该文档正在审核中，暂不支持修改」
- 审核状态列：显示橙色「审核中」标签

**提交拦截**：
- 前端：检查是否有 pending 记录，若有则禁用提交按钮
- 后端：二次校验，拒绝并返回错误提示

### 6.5 提交审核弹窗

**触发场景**：
- **复审人（纯）**：导入、更新、删除操作**不弹出弹窗**，直接生效并提示"已导入文件并直接生效"
- **创建者**：
  - 配置了复审人时，执行增删改弹出确认弹窗（与初审人一致，可选直接生效 / 提交复审）
  - **未配置复审人时不弹窗，操作直接生效**（因创建者具备最高审核权限，无复审环节可走）
- **初审人**：执行增删改时弹出确认弹窗
- **维护人员**：执行增删改时弹出确认弹窗（需经审核后生效）

**弹窗标题**：统一为「提交{新增/更新/删除}」（复审人为「确认{新增/更新/删除}」），不含"申请"字样；弹窗内**不展示操作对象文件名**（操作类型已在标题体现）。

**强制交互模式**：
- 移除右上角关闭按钮（X 图标）
- 禁用点击遮罩层关闭
- 禁用 ESC 键关闭
- 点击"取消"按钮时强制二次确认："退出提交审核流程将不保存当前信息"
- 防止用户误操作丢失已填写的审核信息

**弹窗内容（根据角色动态）**：

#### 维护人员提交
- 标题：「提交{新增/更新/删除}」
- 说明文案（**不带标题字样，直接展示正文**）：「您的本次操作将在审核通过后生效」
- 变更说明输入框（`changeDescription`，**必填**）
- 操作按钮：「取消」/「提交」

#### 初审人/创建者提交
- 标题：「提交{新增/更新/删除}」
- 说明文案（**不带标题字样，直接展示正文**）：
  - 有复审人：「您可选择本次操作直接生效或提交复审人进行审核」
    - **双按钮模式**：
      - 按钮1：「提交复审」（蓝色，提交给复审人审核）
      - 按钮2：「确定生效」（绿色，初审直接生效，`skipSecondReview: true`）
  - 无复审人：
    - **初审人**：仍弹窗，文案「您的本次操作将直接生效（当前知识库未配置复审人）。」，单「提交」按钮
    - **创建者**：**不弹窗**，操作直接生效（创建者是知识库最高权限，无需再走确认）
- 变更说明输入框（`changeDescription`，**选填**；标签显示"(选填)"，占位符结尾为"（选填）"）
- 操作按钮：有复审人时「取消」/「提交复审」/「确定生效」；无复审人（初审人）时「取消」/「提交」

#### 复审人提交
**不弹出弹窗**，直接执行操作并提示：
- 导入文件：「已导入文件并直接生效。」
- 更新文件：直接执行
- 删除文件：二次确认弹窗「确定删除该文档？」

**提交成功后的 Toast 提示**：
- 维护人员：「已提交，等待初审」
- 初审人选择「确定生效」：「已生效，已生成 vX 版本」
- 初审人选择「提交复审」：「已提交，等待复审」
- 创建者选择「确定生效」：「已生效，已生成 vX 版本」
- 创建者选择「提交复审」：「已提交，等待复审」

---

## 7. 权限校验

| 操作 | 权限要求 | 校验点 |
|------|---------|--------|
| 查看文件 | 无限制 | - |
| 导入文件 | `canSubmit`（所有成员均可） | 按钮显示 |
| 删改文档 | `canSubmit`（所有成员均可） | 操作按钮显示 + 审核中锁定检查 |
| 提交变更申请 | `canSubmit` | 提交入口 + 审核链路按 `submitterRole` 决定 |
| 初审通过（直接生效 / 提交复审）| `canFirstReview`（初审人 / 创建者）| 「待初审」Tab 可见性 + 按钮显示 |
| 初审驳回 | `canFirstReview` | 「待初审」Tab 可见性 + 按钮显示 |
| 复审通过 / 驳回 | `canSecondReview`（复审人 / 创建者）| 「待复审」Tab 可见性 + 按钮显示 |
| 查看版本记录 | `canFirstReview` 或 `canSecondReview` | Tab 可见性 |
| 查看审核记录 | `canFirstReview` 或 `canSecondReview` | Tab 可见性 |
| 查看操作记录 | `canFirstReview` 或 `canSecondReview` | Tab 可见性 |
| 管理成员 | `canManageMembers`（仅创建者）| Tab 可见性 |
| 添加成员 | `isOwner` | 按钮显示 |
| 变更角色 | `isOwner` | 鼠标悬停触发 |
| 移除成员 | `isOwner` | 按钮显示（创建者不可移除） |

---

## 8. 技术实现要点

### 8.1 权限系统

- Hook: `useKBRole(kbId)`
- 返回值: `{ role, isOwner, isSecondReviewer, isFirstReviewer, isMaintainer, canManageMembers, canFirstReview, canSecondReview, canSubmit }`
  - `role`: `"owner" | "secondReviewer" | "firstReviewer" | "maintainer" | null`
  - `isOwner`: `kb.ownerId === userId`
  - `isSecondReviewer`: `kb.secondReviewerIds.includes(userId)`
  - `isFirstReviewer`: `kb.firstReviewerIds.includes(userId)`
  - `isMaintainer`: `kb.maintainerIds.includes(userId)`
  - `canFirstReview`: 初审人及以上（`isFirstReviewer || isSecondReviewer || isOwner`）
  - `canSecondReview`: 复审人 / 创建者（`isSecondReviewer || isOwner`）
  - `canSubmit`: 所有成员角色均可提交（`isMaintainer || isFirstReviewer || isSecondReviewer || isOwner`）
  - `canManageMembers`: 仅创建者（`isOwner`）
- 用于：
  - Tab 列表动态构建
  - 按钮显示 / 隐藏
  - 提交时按 `submitterRole` 决定初始 `status` 与链路

> **说明**：
> - 四个角色完全独立，通过各自的 ID 数组判断（`ownerId`、`secondReviewerIds`、`firstReviewerIds`、`maintainerIds`）
> - 创建者不会同时出现在其他角色数组中
> - 权限能力通过层级继承实现（如 `canFirstReview` 包含初审人+复审人+创建者）

### 8.2 提交时的链路计算

提交时根据 `submitterRole` 计算初始状态：

```typescript
function getInitialStatus(submitterRole: KBRole): ReviewStatus {
  if (submitterRole === "maintainer") {
    return "pending_first_review"  // 维护人员 → 待初审
  } else if (submitterRole === "firstReviewer") {
    return "pending_second_review"  // 初审人 → 待复审（免初审）
  } else {
    // secondReviewer / owner
    return "approved"  // 复审人/创建者 → 直接生效，立即生成版本
  }
}
```

### 8.3 数据派生

- **版本记录**：从生效记录派生（`deriveVersions(kbId)`）
  - 初审直接通过：`status === "approved" && firstReview.skipSecondReview === true`
  - 复审通过：`status === "approved" && secondReview.result === "approved"`
  - 直接提交：`status === "approved" && firstReview === undefined`
- **操作日志**：从审核记录派生（按实际流转产出多条日志）+ 成员操作日志
- 不直接编辑派生数据，只写入审核记录，让派生逻辑自动生成

### 8.4 审核中锁定检查

```typescript
function isDocumentUnderReview(documentId: string, kbId: string): boolean {
  const pendingReview = REVIEW_REQUESTS.find(
    r => r.kbId === kbId 
      && r.documentId === documentId 
      && (r.status === "pending_first_review" || r.status === "pending_second_review")
  )
  return !!pendingReview
}
```

- 提交前检查：若返回 `true`，禁用提交并提示"该文档已有待审核的变更申请"
- 文件列表：置灰删改按钮 + 显示「审核中」标签
- **两处调用 `isDocumentUnderReview`**：
  1. 点击「编辑」/「删除」按钮的处理函数入口——命中则 `return` 并 `toast("当前文档正在审批流程中，不支持编辑/删除")`
  2. 「提交保存」的处理函数入口——再次校验，命中则拦截保存并弹出同一 toast
- **问答对分段操作**：QA 文件内对单个分段（chunk）的增 / 删 / 改，其处理函数同样先调用 `isDocumentUnderReview`（按所属文档 `documentId` 判断），命中则拦截并 toast

### 8.5 并发控制（乐观锁）

```typescript
// 前端：提交审核操作时携带 version
async function approveReview(reviewId: string, currentVersion: number) {
  const response = await api.put(`/reviews/${reviewId}/first-approve`, {
    version: currentVersion,
    skipSecondReview: true,
    reason: "常规变更"
  })
  
  if (response.error === "VERSION_CONFLICT") {
    toast.error("该记录已被他人处理，请刷新后重试")
    return
  }
  // 成功处理...
}

// 后端：更新时校验 version
UPDATE review_requests 
SET status = 'approved', version = version + 1, updated_at = NOW()
WHERE id = ? AND version = ?
-- 若 affected_rows = 0，返回 VERSION_CONFLICT 错误
```

### 8.6 前端搜索 / 筛选

所有搜索和筛选均在前端实现：
- 文档列表：`keyword.toLowerCase().includes(...)`
- 成员列表：按姓名 / 工号 / 组织过滤
- 审核记录：按状态筛选（全部 / 已通过 / 已驳回）
- 我的提交：按状态筛选（全部 / 待初审 / 待复审 / 审核驳回）

### 8.7 文件图标 / 颜色映射

统一封装在 `src/lib/file-icon.tsx`：
- `<FileIcon ext={ext} className={...} />`：展示组件，内部完成"取图标 + 取颜色 + 渲染"，各列表 / 弹窗统一使用，避免重复 `const Icon = getFileIcon(...)` 写法（该写法会触发 `react-hooks/static-components`）
- 内部使用 `React.createElement` 渲染 Lucide 图标（图标引用稳定，来自静态映射表）
- `getFileIcon(ext)` / `getFileIconColor(ext)` 为模块内部私有函数，不对外导出

---

## 9. 演示功能（需移除）

- **RoleSwitcher**: 角色切换器，用于演示不同角色视角，生产环境需移除
- 位置：`knowledge-detail.tsx` 头部右上角
- 功能：切换当前用户身份，模拟四种角色（创建者 / 复审人 / 初审人 / 维护人员）的权限与审核链路

---

## 10. 待后端对接

当前所有数据均为 Mock：
- `KNOWLEDGE_BASES`: 知识库列表（含 `firstReviewerIds` / `secondReviewerIds`）
- `REVIEW_REQUESTS`: 审核记录（含 `firstReview.skipSecondReview` / `secondReview` / 四态 `status` / `version`）
- `DOCUMENTS_BY_KB`: 文档列表
- `MOCK_USERS`: 用户池
- `OPERATION_LOGS`: 操作日志（派生）
- `getVersions(kbId)`: 版本记录（派生）

**后端 API 需求**：

### 基础资源
- `GET /kb/:id` - 获取知识库详情
- `GET /kb/:id/documents` - 获取文档列表
- `GET /kb/:id/documents/:docId/pending-check` - 检查文档是否有 pending 记录（用于审核中锁定）

### 审核流程
- `POST /kb/:id/reviews` - 提交审核申请（后端按提交者角色决定初始状态 + 检查文档唯一 pending 约束）
- `GET /kb/:id/reviews` - 获取审核记录
- `GET /kb/:id/reviews/:reviewId` - 获取单条审核详情

### 初审操作
- `PUT /kb/:id/reviews/:reviewId/first-approve-final` - 初审通过并生效
  - Body: `{ version: number, reason?: string }`（可选填不提交复审的理由）
  - 返回：生成的版本号 + 更新后的 `version`
  - 失败：`VERSION_CONFLICT` / `ALREADY_PROCESSED`
- `PUT /kb/:id/reviews/:reviewId/first-approve-forward` - 初审通过并提交复审
  - Body: `{ version: number }`
  - 返回：更新后的 `version`
- `PUT /kb/:id/reviews/:reviewId/first-reject` - 初审驳回
  - Body: `{ version: number, reason: string }`（必填）

### 复审操作
- `PUT /kb/:id/reviews/:reviewId/second-approve` - 复审通过（生效）
  - Body: `{ version: number }`
  - 返回：生成的版本号 + 更新后的 `version`
- `PUT /kb/:id/reviews/:reviewId/second-reject` - 复审驳回
  - Body: `{ version: number, reason: string }`（必填）

### 版本与日志
- `GET /kb/:id/versions` - 获取版本记录（派生）
- `GET /kb/:id/operations` - 获取操作日志（派生）

### 成员管理
- `GET /kb/:id/members` - 获取成员列表
- `POST /kb/:id/members` - 添加成员
- `DELETE /kb/:id/members/:userId` - 移除成员
- `PUT /kb/:id/members/:userId/role` - 变更角色

### 文档操作
- `POST /kb/:id/documents` - 导入文档（进入审核链 or 直接生效，取决于提交者角色）
- `PUT /kb/:id/documents/:docId` - 更新文档（需提交审核）
- `DELETE /kb/:id/documents/:docId` - 删除文档（需提交审核）

**关键后端逻辑**：
1. **乐观锁校验**：所有审核操作需校验 `version`，不匹配则返回 `VERSION_CONFLICT`
2. **唯一 pending 约束**：提交新审核时，检查 `(kbId, documentId, status IN ('pending_first_review', 'pending_second_review'))` 唯一索引
3. **四个独立角色**：权限判断基于 `ownerId`、`secondReviewerIds`、`firstReviewerIds`、`maintainerIds` 四个独立字段，不存在角色合并或自动赋权
4. **驳回后可立即重新提交**：`rejected` 状态不占用 pending 约束






