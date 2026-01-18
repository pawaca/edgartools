# 任务：合并所有报告类型分支

## 概述

你是**合并 Agent**。任务是将四个并行开发分支合并到主分支 `claude/filing-parsing-analysis-SSJC5`。

## 分支列表

| 分支 | 内容 |
|------|------|
| `claude/ts-tenq-impl-SSJC5` | 10-Q 季报测试和验证 |
| `claude/ts-eightk-impl-SSJC5` | 8-K 当前报告测试和验证 |
| `claude/ts-twentyf-impl-SSJC5` | 20-F 外国公司年报 |
| `claude/ts-def14a-impl-SSJC5` | DEF 14A 代理声明 |

## 开始前

```bash
cd /home/user/edgartools/ts
git fetch --all
npm install
npm test  # 确认基础 62 个测试通过
```

## 合并顺序

按以下顺序合并，每次合并后运行测试：

### 1. 合并 10-Q

```bash
git checkout claude/filing-parsing-analysis-SSJC5
git merge origin/claude/ts-tenq-impl-SSJC5 -m "Merge 10-Q implementation"

# 解决冲突（如果有）
# 主要检查：
# - src/reports/index.ts
# - src/extractors/patterns/index.ts

npm test
npx tsc --noEmit
```

### 2. 合并 8-K

```bash
git merge origin/claude/ts-eightk-impl-SSJC5 -m "Merge 8-K implementation"
npm test
npx tsc --noEmit
```

### 3. 合并 20-F

```bash
git merge origin/claude/ts-twentyf-impl-SSJC5 -m "Merge 20-F implementation"
npm test
npx tsc --noEmit
```

### 4. 合并 DEF 14A

```bash
git merge origin/claude/ts-def14a-impl-SSJC5 -m "Merge DEF 14A implementation"
npm test
npx tsc --noEmit
```

## 常见冲突及解决

### reports/index.ts 冲突

多个分支可能都添加了 export。正确的合并结果：

```typescript
export { BaseReport, type ReportOptions, type SectionNameMapping } from './base.js';
export { TenK } from './ten-k.js';
export { TenQ } from './ten-q.js';
export { EightK, normalizeItemNumber } from './eight-k.js';
export { TwentyF } from './twenty-f.js';
export { Def14A } from './def-14a.js';
```

### extractors/patterns/index.ts 冲突

```typescript
export { TEN_K_PATTERNS, getTenKPattern, getTenKSectionNames } from './ten-k.js';
export { TEN_Q_PATTERNS } from './ten-q.js';
export { EIGHT_K_PATTERNS } from './eight-k.js';
export { TWENTY_F_PATTERNS } from './twenty-f.js';
export { DEF_14A_PATTERNS } from './def-14a.js';
```

### TASK.md 冲突

删除所有分支的 TASK.md 文件：

```bash
git rm ts/TASK.md
```

## 合并后验证

```bash
# 1. 所有测试通过
npm test

# 2. TypeScript 编译无错误
npx tsc --noEmit

# 3. 检查导出
node -e "import('./dist/index.js').then(m => console.log(Object.keys(m)))"
```

## 清理

合并完成后，删除 TASK.md 相关文件：

```bash
rm -f ts/TASK.md ts/MERGE_TASK.md ts/PARALLEL_DEV_INSTRUCTIONS.md ts/AGENT_PROMPTS.md
git add -A
git commit -m "chore: Remove task instruction files after merge"
```

## 最终提交

```bash
git push origin claude/filing-parsing-analysis-SSJC5
```

## 预期最终测试数量

- 基础: 62 个
- 10-Q: ~15-20 个
- 8-K: ~15-20 个
- 20-F: ~15-20 个
- DEF 14A: ~15-20 个
- **总计**: ~120-140 个测试

## 故障排除

### 合并冲突无法解决

```bash
git merge --abort
# 手动检查分支差异
git diff claude/filing-parsing-analysis-SSJC5...origin/claude/ts-tenq-impl-SSJC5
```

### 测试失败

1. 检查是否有重复的 section key
2. 检查 pattern 正则是否有冲突
3. 确认 index.ts 导出完整

### TypeScript 编译错误

1. 检查类型导入是否完整
2. 检查是否有循环依赖
