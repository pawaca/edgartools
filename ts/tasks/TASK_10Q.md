# Task: Port Python 10-Q Implementation to TypeScript

## Overview

Port the Python `TenQ` class from `edgar/company_reports/ten_q.py` to complete the TypeScript implementation in `ts/src/reports/ten-q.ts`.

**IMPORTANT**: This is a PORT task. Study the Python implementation carefully and replicate its functionality in TypeScript. Do not create new features - faithfully reproduce Python behavior.

## Source Files to Port

| Python Source | TypeScript Target | Status |
|--------------|-------------------|--------|
| `edgar/company_reports/ten_q.py` | `ts/src/reports/ten-q.ts` | Skeleton exists |
| `edgar/company_reports/_base.py` | `ts/src/reports/base.ts` | Implemented |
| `edgar/company_reports/_structures.py` | `ts/src/reports/structures.ts` | Needs creation |

## Current TypeScript State

The TypeScript `TenQ` class already has:
- Basic class structure extending `BaseReport`
- Section name mappings (SECTION_TO_ITEM, ITEM_TO_SECTION)
- Part-qualified section lookup (`part_i_item_1`, `part_ii_item_1`)
- Convenience accessors for common sections

## Missing Features to Port

### 1. Filing Structure Definition

Port the `FilingStructure` class and 10-Q structure from Python:

```python
# Python: edgar/company_reports/ten_q.py lines 23-73
structure = FilingStructure({
    "PART I": {  # Financial Information
        "ITEM 1": {...},
        "ITEM 2": {...},
        ...
    },
    "PART II": {  # Other Information
        "ITEM 1": {...},
        "ITEM 1A": {...},
        ...
    }
})
```

Create TypeScript equivalent in `ts/src/reports/structures.ts`:
```typescript
export interface FilingStructure {
  structure: Record<string, Record<string, ItemDefinition>>;
  getItem(item: string, part?: string): ItemDefinition | undefined;
  isValidItem(item: string, part?: string): boolean;
}
```

### 2. Form Validation in Constructor

```python
# Python: lines 75-77
def __init__(self, filing):
    assert filing.form in ['10-Q', '10-Q/A'], f"This form should be a 10-Q but was {filing.form}"
    super().__init__(filing)
```

Add TypeScript validation:
```typescript
constructor(options: ReportOptions) {
  super(options);
  const form = this._sgml?.form || '';
  if (!['10-Q', '10-Q/A'].includes(form)) {
    throw new Error(`Expected 10-Q form but got ${form}`);
  }
}
```

### 3. `get_item_with_part()` Method

```python
# Python: lines 269-322
def get_item_with_part(self, part: str, item: str, markdown: bool = True) -> Optional[str]:
    """Get item text with explicit part specification."""
```

Port to TypeScript:
```typescript
getItemWithPart(part: 'I' | 'II', item: string): string | null {
  // Port Python logic
}
```

### 4. `get_structure()` Method for Rich Display

```python
# Python: lines 333-383
def get_structure(self):
    """Create tree display showing which items exist."""
```

Port display structure creation (can omit Rich-specific formatting, but preserve the logic):
```typescript
getStructure(): StructureInfo {
  // Return object with detected items and their status
}
```

### 5. ChunkedDocument Fallback

Python has multi-tier fallback:
1. New HTMLParser sections
2. ChunkedDocument (legacy)
3. id_parse_document fallback

Currently TypeScript only has tier 1. Add fallback mechanism if needed.

### 6. Pattern Section Extractor Updates

Verify `ts/src/extractors/patterns/ten-q.ts` has all patterns from Python's `edgar/documents/extractors/pattern_section_extractor.py` (lines 73-121 for 10-Q patterns).

## Testing Requirements

### Unit Tests to Create

1. **Constructor validation**: Test form type assertion
2. **Section lookup**: Test all lookup formats
   - `'part_i_item_1'` (direct key)
   - `'Part I, Item 1'` (friendly format)
   - `'Item 1'` (should prefer Part I)
   - `'1'` (short format)
3. **Part disambiguation**: Test that same item numbers in different parts are distinguished
4. **Structure validation**: Test `isValidItem()` method
5. **Edge cases**: Empty sections, missing items

### Integration Tests

Test with real 10-Q filings:
- Apple (AAPL) - high quality filings
- Tesla (TSLA) - varied formatting
- Peloton (PTON) - smaller company

## Development Steps

1. Read Python source files thoroughly
2. Create `ts/src/reports/structures.ts` for FilingStructure
3. Update `ts/src/reports/ten-q.ts`:
   - Add constructor validation
   - Add FilingStructure instance
   - Add `getItemWithPart()` method
   - Add `getStructure()` method
4. Verify/update patterns in `ts/src/extractors/patterns/ten-q.ts`
5. Write comprehensive tests
6. Run all tests: `npm test`

## Branch Information

Your branch will be auto-generated when the Claude Code remote session starts.
Commit and push to your assigned branch when work is complete.

## Dependencies

**Requires**: `TASK_STRUCTURES.md` must be completed first (FilingStructure class needed).

## Success Criteria

- [ ] All Python `TenQ` public methods have TypeScript equivalents
- [ ] Form validation matches Python behavior
- [ ] Section lookup returns identical results to Python
- [ ] Part-qualified lookups work correctly
- [ ] All tests pass
- [ ] Code follows project conventions (camelCase, explicit types)
