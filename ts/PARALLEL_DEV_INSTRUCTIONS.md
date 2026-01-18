# Phase 2 并行开发指令

## 概述

TypeScript SEC filing 解析项目已完成 Phase 1 基础架构重构。现在可以并行实现各报告类型。

**分支**: 基于 `claude/filing-parsing-analysis-SSJC5` 创建你的分支

**架构文档**: `/home/user/edgartools/typescript-architecture-analysis.md`

---

## Agent 任务分配

| Agent | 报告类型 | 分支命名 |
|-------|---------|---------|
| A | 10-Q 完善和测试 | `claude/ts-tenq-{SESSION_ID}` |
| B | 8-K 完善和测试 | `claude/ts-eightk-{SESSION_ID}` |
| C | 20-F 外国公司年报 | `claude/ts-twentyf-{SESSION_ID}` |
| D | DEF 14A 代理声明 | `claude/ts-def14a-{SESSION_ID}` |

---

## 通用指令模板

### 前置条件

```bash
cd /home/user/edgartools/ts
git fetch origin claude/filing-parsing-analysis-SSJC5
git checkout -b claude/ts-{form-type}-{SESSION_ID} origin/claude/filing-parsing-analysis-SSJC5
npm install
npm test  # 确认 62 个测试通过
```

### 文件命名约定

| 类型 | 路径模式 |
|------|---------|
| 报告类 | `src/reports/{form-type}.ts` |
| 模式文件 | `src/extractors/patterns/{form-type}.ts` |
| 单元测试 | `tests/unit/reports/{form-type}.test.ts` |
| 模式测试 | `tests/unit/extractors/{form-type}-patterns.test.ts` |
| 集成测试 | `tests/integration/{form-type}-parsing.test.ts` |
| 测试数据 | `tests/fixtures/sgml/sample-{form-type}.txt` |

### 完成标准

1. ✅ 所有现有测试通过 (62+)
2. ✅ 新增单元测试覆盖报告类
3. ✅ 新增模式匹配测试
4. ✅ 集成测试使用真实 SEC 数据
5. ✅ TypeScript 编译无错误 (`npx tsc --noEmit`)
6. ✅ 代码已提交并推送

---

## Agent A: 10-Q 完善指令

### 任务描述

10-Q 骨架类已存在，需要完善测试和验证。

### 需要修改/创建的文件

```
ts/
├── src/reports/ten-q.ts           # 已存在，可能需要调整
├── src/extractors/patterns/ten-q.ts  # 已存在，可能需要调整
├── tests/
│   ├── unit/reports/ten-q.test.ts           # 新建
│   ├── unit/extractors/ten-q-patterns.test.ts  # 新建
│   ├── integration/ten-q-parsing.test.ts    # 新建
│   └── fixtures/sgml/sample-10q.txt         # 新建
```

### 10-Q 特有逻辑

**分区命名** - 必须使用 `part_i_item_1`, `part_ii_item_1` 格式：
```typescript
// Part I 和 Part II 有重复的 Item 编号
tenq.getSection('Part I, Item 1');   // 财务报表
tenq.getSection('Part II, Item 1');  // 法律诉讼
tenq.getSection('part_i_item_1');    // 同上
tenq.getSection('part_ii_item_1');   // 同上
```

### 测试要点

1. 验证分区歧义消除：`tenq['Part I, Item 1'] !== tenq['Part II, Item 1']`
2. 验证 `items` 属性返回 `['Part I, Item 1', 'Part II, Item 1', ...]`
3. 验证 `getItemFromPart('1', 'I')` 和 `getItemFromPart('1', 'II')` 返回不同内容

### 参考 Python 实现

- `edgar/company_reports/ten_q.py:172-267` - `__getitem__` 方法
- `edgar/documents/extractors/pattern_section_extractor.py` - 10-Q 模式

---

## Agent B: 8-K 完善指令

### 任务描述

8-K 骨架类已存在，需要完善测试和验证小数规范化。

### 需要修改/创建的文件

```
ts/
├── src/reports/eight-k.ts           # 已存在，可能需要调整
├── src/extractors/patterns/eight-k.ts  # 已存在，可能需要调整
├── tests/
│   ├── unit/reports/eight-k.test.ts           # 新建
│   ├── unit/extractors/eight-k-patterns.test.ts  # 新建
│   ├── integration/eight-k-parsing.test.ts    # 新建
│   └── fixtures/sgml/sample-8k.txt            # 新建
```

### 8-K 特有逻辑

**小数规范化** - 处理各种输入格式：
```typescript
normalizeItemNumber('Item 2.02');    // -> '2.02'
normalizeItemNumber('Item 2. 02');   // -> '2.02' (Apple 风格)
normalizeItemNumber('ITEM 2.02');    // -> '2.02'
normalizeItemNumber('2.02');         // -> '2.02'
```

### 测试要点

1. 验证 `normalizeItemNumber()` 处理所有变体
2. 验证 `getSection('2.02')` == `getSection('Item 2.02')` == `getSection('Item 2. 02')`
3. 验证常见 8-K 项目：2.02 (业绩), 7.01 (Reg FD), 8.01 (其他)

### 参考 Python 实现

- `edgar/company_reports/current_report.py:23-48` - `_normalize_item_number`
- SEC 8-K 表单指南

---

## Agent C: 20-F 创建指令

### 任务描述

从头创建 20-F 外国公司年报支持。

### 需要创建的文件

```
ts/
├── src/reports/twenty-f.ts                    # 新建
├── src/extractors/patterns/twenty-f.ts        # 新建
├── tests/
│   ├── unit/reports/twenty-f.test.ts          # 新建
│   ├── unit/extractors/twenty-f-patterns.test.ts  # 新建
│   ├── integration/twenty-f-parsing.test.ts   # 新建
│   └── fixtures/sgml/sample-20f.txt           # 新建
```

### 20-F 章节结构

```
Part I
├── Item 1. Identity of Directors, Senior Management and Advisers
├── Item 2. Offer Statistics and Expected Timetable
├── Item 3. Key Information (包含 Risk Factors)
├── Item 4. Information on the Company
├── Item 4A. Unresolved Staff Comments
├── Item 5. Operating and Financial Review

Part II
├── Item 6. Directors, Senior Management and Employees
├── Item 7. Major Shareholders and Related Party Transactions
├── Item 8. Financial Information
├── Item 9. The Offer and Listing
├── Item 10. Additional Information
├── Item 11. Quantitative and Qualitative Disclosures
├── Item 12. Description of Securities

Part III
├── Item 17. Financial Statements (按 US GAAP)
├── Item 18. Financial Statements (按 IFRS)
├── Item 19. Exhibits
```

### 实现步骤

1. 创建 `TwentyF` 类继承 `BaseReport`
2. 定义 `SECTION_TO_ITEM` 和 `ITEM_TO_SECTION` 映射
3. 添加便捷访问器 (riskFactors, operatingReview, etc.)
4. 创建 `TWENTY_F_PATTERNS`
5. 下载真实 20-F 数据用于测试

### 参考

- SEC 20-F 表单: https://www.sec.gov/files/form20-f.pdf
- Python: `edgar/documents/extractors/pattern_section_extractor.py` 中的 20-F 模式

---

## Agent D: DEF 14A 创建指令

### 任务描述

从头创建 DEF 14A 代理声明支持。

### 需要创建的文件

```
ts/
├── src/reports/def-14a.ts                     # 新建
├── src/extractors/patterns/def-14a.ts         # 新建
├── tests/
│   ├── unit/reports/def-14a.test.ts           # 新建
│   ├── unit/extractors/def-14a-patterns.test.ts  # 新建
│   ├── integration/def-14a-parsing.test.ts    # 新建
│   └── fixtures/sgml/sample-def14a.txt        # 新建
```

### DEF 14A 章节结构

```
├── Notice of Annual Meeting
├── Proxy Statement Summary
├── Proposal 1: Election of Directors
│   ├── Director Nominees
│   ├── Board Composition
│   └── Director Compensation
├── Proposal 2: Ratification of Auditors
├── Proposal 3+: Other Proposals (Say on Pay, etc.)
├── Executive Compensation
│   ├── Compensation Discussion and Analysis (CD&A)
│   ├── Summary Compensation Table
│   ├── Grants of Plan-Based Awards
│   └── Outstanding Equity Awards
├── Security Ownership
├── Related Party Transactions
├── Other Information
```

### 实现步骤

1. 创建 `Def14A` 类继承 `BaseReport`
2. 定义章节映射 (proposal-based + standard sections)
3. 添加便捷访问器 (executiveCompensation, directorNominees, etc.)
4. 创建 `DEF_14A_PATTERNS`
5. 下载真实 DEF 14A 数据用于测试

### 参考

- SEC Schedule 14A: https://www.sec.gov/about/forms/formdef14a.pdf
- Python 实现（如果存在）

---

## 合并策略

完成后：

1. 确保所有测试通过
2. 推送到你的分支
3. 创建 PR 到 `claude/filing-parsing-analysis-SSJC5`
4. PR 标题格式: `feat(ts): Add {Form Type} report parsing`

合并顺序建议：10-Q → 8-K → 20-F → DEF 14A
