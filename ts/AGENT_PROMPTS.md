# Agent Prompt Templates

可直接复制用于启动并行 Agent 的 prompt。

---

## Agent A: 10-Q Prompt

```
## 任务：完善 TypeScript 10-Q 报告解析

### 背景
TypeScript SEC filing 解析项目已完成基础架构。10-Q 骨架类已存在，需要添加测试和验证。

### 你的分支
基于 `origin/claude/filing-parsing-analysis-SSJC5` 创建 `claude/ts-tenq-{SESSION_ID}`

### 需要创建的文件
1. `ts/tests/unit/reports/ten-q.test.ts` - TenQ 类单元测试
2. `ts/tests/unit/extractors/ten-q-patterns.test.ts` - 模式匹配测试
3. `ts/tests/integration/ten-q-parsing.test.ts` - 集成测试
4. `ts/tests/fixtures/sgml/sample-10q.txt` - 测试数据（从 SEC 下载真实 10-Q）

### 10-Q 关键特性
- 分区命名：`part_i_item_1`, `part_ii_item_1`（Part I 和 Part II 有相同的 Item 编号）
- 查找支持：`Part I, Item 1`, `part_i_item_1`, `Item 1`（默认 Part I）
- `getItemFromPart('1', 'I')` vs `getItemFromPart('1', 'II')` 返回不同内容

### 测试用例必须覆盖
1. 分区歧义消除
2. 多格式查找
3. 便捷访问器（mda, riskFactors, etc.）
4. 真实 10-Q 数据解析

### 完成标准
1. 所有测试通过（原有 62 个 + 新增）
2. `npx tsc --noEmit` 无错误
3. 代码已提交并推送
```

---

## Agent B: 8-K Prompt

```
## 任务：完善 TypeScript 8-K 报告解析

### 背景
TypeScript SEC filing 解析项目已完成基础架构。8-K 骨架类已存在，需要添加测试和验证。

### 你的分支
基于 `origin/claude/filing-parsing-analysis-SSJC5` 创建 `claude/ts-eightk-{SESSION_ID}`

### 需要创建的文件
1. `ts/tests/unit/reports/eight-k.test.ts` - EightK 类单元测试
2. `ts/tests/unit/extractors/eight-k-patterns.test.ts` - 模式匹配测试
3. `ts/tests/integration/eight-k-parsing.test.ts` - 集成测试
4. `ts/tests/fixtures/sgml/sample-8k.txt` - 测试数据（从 SEC 下载真实 8-K）

### 8-K 关键特性
- 小数 Item 编号：1.01, 2.02, 7.01, 8.01, 9.01
- 规范化函数 `normalizeItemNumber()`：处理 `Item 2. 02` -> `2.02`
- 支持查找：`2.02`, `Item 2.02`, `Item 2. 02`, `item_202`

### 测试用例必须覆盖
1. `normalizeItemNumber()` 各种变体
2. 多格式查找等价性
3. 常见 8-K 项目（2.02 业绩, 7.01 Reg FD, 8.01 其他）
4. 真实 8-K 数据解析

### 完成标准
1. 所有测试通过（原有 62 个 + 新增）
2. `npx tsc --noEmit` 无错误
3. 代码已提交并推送
```

---

## Agent C: 20-F Prompt

```
## 任务：创建 TypeScript 20-F 报告解析

### 背景
TypeScript SEC filing 解析项目已完成基础架构。需要从头创建 20-F 外国公司年报支持。

### 你的分支
基于 `origin/claude/filing-parsing-analysis-SSJC5` 创建 `claude/ts-twentyf-{SESSION_ID}`

### 需要创建的文件
1. `ts/src/reports/twenty-f.ts` - TwentyF 类（继承 BaseReport）
2. `ts/src/extractors/patterns/twenty-f.ts` - 20-F 章节模式
3. `ts/tests/unit/reports/twenty-f.test.ts` - 单元测试
4. `ts/tests/unit/extractors/twenty-f-patterns.test.ts` - 模式测试
5. `ts/tests/integration/twenty-f-parsing.test.ts` - 集成测试
6. `ts/tests/fixtures/sgml/sample-20f.txt` - 测试数据

### 20-F 章节结构
Part I: Items 1-5 (公司信息, 风险因素, 运营回顾)
Part II: Items 6-12 (管理层, 股东, 财务)
Part III: Items 17-19 (财务报表, 附件)

### 参考
- 查看 `ts/src/reports/ten-k.ts` 了解类结构
- 查看 `ts/src/extractors/patterns/ten-k.ts` 了解模式格式
- 参考 Python: `edgar/documents/extractors/pattern_section_extractor.py`

### 完成标准
1. 所有测试通过（原有 62 个 + 新增）
2. `npx tsc --noEmit` 无错误
3. 更新 `ts/src/reports/index.ts` 导出 TwentyF
4. 更新 `ts/src/extractors/patterns/index.ts` 导出 TWENTY_F_PATTERNS
5. 代码已提交并推送
```

---

## Agent D: DEF 14A Prompt

```
## 任务：创建 TypeScript DEF 14A 报告解析

### 背景
TypeScript SEC filing 解析项目已完成基础架构。需要从头创建 DEF 14A 代理声明支持。

### 你的分支
基于 `origin/claude/filing-parsing-analysis-SSJC5` 创建 `claude/ts-def14a-{SESSION_ID}`

### 需要创建的文件
1. `ts/src/reports/def-14a.ts` - Def14A 类（继承 BaseReport）
2. `ts/src/extractors/patterns/def-14a.ts` - DEF 14A 章节模式
3. `ts/tests/unit/reports/def-14a.test.ts` - 单元测试
4. `ts/tests/unit/extractors/def-14a-patterns.test.ts` - 模式测试
5. `ts/tests/integration/def-14a-parsing.test.ts` - 集成测试
6. `ts/tests/fixtures/sgml/sample-def14a.txt` - 测试数据

### DEF 14A 章节结构
- Notice of Annual Meeting
- Proxy Statement Summary
- Proposal 1: Election of Directors
- Proposal 2+: Other Proposals
- Executive Compensation (CD&A, Summary Comp Table)
- Security Ownership
- Related Party Transactions

### 参考
- 查看 `ts/src/reports/ten-k.ts` 了解类结构
- 查看 `ts/src/extractors/patterns/ten-k.ts` 了解模式格式
- SEC Form DEF 14A 指南

### 完成标准
1. 所有测试通过（原有 62 个 + 新增）
2. `npx tsc --noEmit` 无错误
3. 更新 `ts/src/reports/index.ts` 导出 Def14A
4. 更新 `ts/src/extractors/patterns/index.ts` 导出 DEF_14A_PATTERNS
5. 代码已提交并推送
```

---

## 使用方法

1. 复制对应 Agent 的 prompt
2. 替换 `{SESSION_ID}` 为实际 session ID
3. 启动新的 Claude Agent 会话
4. 粘贴 prompt 开始工作
