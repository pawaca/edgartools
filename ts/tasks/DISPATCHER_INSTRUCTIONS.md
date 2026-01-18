# Task Dispatcher Agent Instructions

## Overview

You are a task dispatcher agent that creates Claude Code remote sessions via web interface to parallelize TypeScript porting work.

## Repository Information

- **Repository**: `pawaca/edgartools`
- **Base Branch**: `claude/filing-parsing-analysis-SSJC5`
- **Task Directory**: `ts/tasks/`

## Task Dependency Graph

```
                    TASK_STRUCTURES.md (Phase 1 - Base)
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
    TASK_10Q.md      TASK_8K.md      TASK_20F.md
    (Phase 2)        (Phase 2)        (Phase 2)
                          │
                          ▼
                TASK_PRESS_RELEASE.md
                    (Phase 3)
                          │
                          ▼
                  TASK_MERGE.md
                (Manual - Phase 4)
```

## Execution Order

### Phase 1: Base Dependency (Sequential)

Create **ONE** session first and wait for completion:

| Task File | Description | Must Complete Before |
|-----------|-------------|---------------------|
| `TASK_STRUCTURES.md` | Filing structure utilities | All Phase 2 tasks |

**Session Creation Prompt**:
```
Port Python _structures.py to TypeScript following instructions in ts/tasks/TASK_STRUCTURES.md

Key requirements:
- Read the task file first
- Port from Python source: edgar/company_reports/_structures.py
- Create: ts/src/reports/structures.ts
- Run tests when complete
- Commit and push to your branch when done
```

### Phase 2: Report Types (Parallel)

After Phase 1 completes, create these sessions **in parallel**:

| Task File | Description |
|-----------|-------------|
| `TASK_10Q.md` | 10-Q Quarterly Report |
| `TASK_8K.md` | 8-K Current Report |
| `TASK_20F.md` | 20-F Foreign Issuer Report |

**Session Creation Prompts**:

For 10-Q:
```
Port Python 10-Q implementation to TypeScript following instructions in ts/tasks/TASK_10Q.md

Key requirements:
- Read the task file first
- Port from Python source: edgar/company_reports/ten_q.py
- Complete the skeleton in: ts/src/reports/ten-q.ts
- Handle part-qualified sections (Part I vs Part II items)
- Run tests when complete
- Commit and push to your branch when done
```

For 8-K:
```
Port Python 8-K implementation to TypeScript following instructions in ts/tasks/TASK_8K.md

Key requirements:
- Read the task file first
- Port from Python source: edgar/company_reports/current_report.py
- Complete the skeleton in: ts/src/reports/eight-k.ts
- Handle decimal item normalization (Item 2.02, etc.)
- Include 6-K alias (SixK = CurrentReport)
- Run tests when complete
- Commit and push to your branch when done
```

For 20-F:
```
Port Python 20-F implementation to TypeScript following instructions in ts/tasks/TASK_20F.md

Key requirements:
- Read the task file first
- Port from Python source: edgar/company_reports/twenty_f.py
- Create new file: ts/src/reports/twenty-f.ts
- Handle 5-part structure (Part I through Part V)
- Include Item 16A-16K sub-items
- Run tests when complete
- Commit and push to your branch when done
```

### Phase 3: Press Release (After 8-K)

Wait for **8-K task to complete**, then create:

| Task File | Description | Depends On |
|-----------|-------------|------------|
| `TASK_PRESS_RELEASE.md` | Press Release attachments | 8-K |

**Session Creation Prompt**:
```
Port Python press_release.py to TypeScript following instructions in ts/tasks/TASK_PRESS_RELEASE.md

Key requirements:
- Read the task file first
- Port from Python source: edgar/company_reports/press_release.py
- Create: ts/src/reports/press-release.ts
- This handles 8-K exhibit attachments
- Run tests when complete
- Commit and push to your branch when done
```

### Phase 4: Merge (Manual - Do Not Auto-Create)

**DO NOT** automatically create a merge session.

The merge task (`TASK_MERGE.md`) should only be executed manually after:
1. All Phase 1-3 sessions have completed successfully
2. Human has reviewed the branches
3. Human explicitly requests merge

## Session Creation Process

For each session:

1. **Navigate** to Claude Code web interface
2. **Create** new remote session for repository `pawaca/edgartools`
3. **Set** base branch to `claude/filing-parsing-analysis-SSJC5`
4. **Paste** the appropriate prompt from above
5. **Note** the auto-generated branch name for tracking
6. **Monitor** session progress

## Tracking Sessions

Keep track of created sessions:

| Phase | Task | Branch (auto-generated) | Status |
|-------|------|------------------------|--------|
| 1 | STRUCTURES | _______________ | ⏳ Pending |
| 2 | 10-Q | _______________ | ⏳ Pending |
| 2 | 8-K | _______________ | ⏳ Pending |
| 2 | 20-F | _______________ | ⏳ Pending |
| 3 | PRESS_RELEASE | _______________ | ⏳ Pending |

## Important Notes

1. **Branch names are auto-generated** - Claude Code remote sessions automatically create branch names, don't specify them manually

2. **Wait for dependencies** - Phase 2 tasks depend on Phase 1 (structures). Phase 3 depends on 8-K specifically.

3. **Parallel execution** - Phase 2 tasks (10-Q, 8-K, 20-F) can run simultaneously

4. **Don't start merge** - Leave TASK_MERGE.md for manual execution after all tasks complete

5. **Monitor for completion** - Each agent should commit and push when done. Check branch activity to confirm completion.

## Success Criteria

- [ ] Phase 1 session created and completed
- [ ] Phase 2 sessions created in parallel (after Phase 1)
- [ ] Phase 3 session created (after 8-K completes)
- [ ] All sessions have pushed their changes
- [ ] Human notified that merge task is ready for manual execution
