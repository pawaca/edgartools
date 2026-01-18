# Task: Port Python Filing Structures to TypeScript

## Overview

Port the Python filing structure utilities from `edgar/company_reports/_structures.py` to TypeScript.

**IMPORTANT**: This is a PORT task. Study the Python implementation carefully and replicate its functionality in TypeScript. Do not create new features - faithfully reproduce Python behavior.

## Source Files to Port

| Python Source | TypeScript Target | Status |
|--------------|-------------------|--------|
| `edgar/company_reports/_structures.py` | `ts/src/reports/structures.ts` | Needs creation |

## Python Implementation Analysis

### FilingStructure Class

```python
# Python: lines 7-29
class FilingStructure:

    def __init__(self, structure: Dict):
        self.structure = structure

    def get_part(self, part: str):
        return self.structure.get(part.upper())

    def get_item(self, item: str, part: Optional[str] = None):
        item = item.upper()
        if part:
            part_dict = self.get_part(part)
            if part_dict:
                return part_dict.get(item)
        else:
            for _, items in self.structure.items():
                if item in items:
                    return items[item]
        return None

    def is_valid_item(self, item: str, part: Optional[str] = None):
        return self.get_item(item, part) is not None
```

### ItemOnlyFilingStructure Class

```python
# Python: lines 31-37
class ItemOnlyFilingStructure(FilingStructure):
    """For filings without parts (like 8-K)"""

    def get_part(self, part: str):
        return None

    def get_item(self, item: str, part: Optional[str] = None):
        return self.structure.get(item.upper())
```

### Helper Functions

```python
# Python: lines 40-51
def is_valid_item_for_filing(filing_structure: Dict, item: str, part: Optional[str] = None):
    """Return true if the item is valid"""
    item = item.upper()
    if part:
        part_dict = filing_structure.get(part.upper())
        if part_dict:
            return item in part_dict
    else:
        for _, items in filing_structure.items():
            if item in items:
                return True
    return False
```

```python
# Python: lines 54-88
def extract_items_from_sections(sections: Dict, item_pattern: Pattern[str]) -> List[str]:
    """
    Extract item numbers from filing sections using a regex pattern.

    This is a shared utility to eliminate code duplication between different
    filing types (8-K, 20-F, etc.) that have similar item extraction logic.
    """
    items = []
    for section in sections.values():
        title = section.title
        match = item_pattern.match(title)
        if match:
            items.append(match.group(1))
        else:
            if ' - ' in title:
                items.append(title.split(' - ')[0].strip())
            else:
                items.append(title)
    return items
```

## TypeScript Implementation Plan

Create `ts/src/reports/structures.ts`:

```typescript
/**
 * Filing structure definitions and validation utilities.
 * Port of edgar/company_reports/_structures.py
 */

/**
 * Item definition within a filing structure.
 */
export interface ItemDefinition {
  Title: string;
  Description: string;
}

/**
 * Part structure: mapping of item keys to item definitions.
 */
export type PartStructure = Record<string, ItemDefinition>;

/**
 * Full filing structure: mapping of part names to part structures.
 */
export type StructureDefinition = Record<string, PartStructure | ItemDefinition>;

/**
 * Filing structure for reports with parts (10-K, 10-Q, 20-F).
 */
export class FilingStructure {
  readonly structure: StructureDefinition;

  constructor(structure: StructureDefinition) {
    this.structure = structure;
  }

  /**
   * Get a part by name.
   */
  getPart(part: string): PartStructure | undefined {
    return this.structure[part.toUpperCase()] as PartStructure | undefined;
  }

  /**
   * Get an item definition by item key and optional part.
   * If part is not specified, searches all parts.
   */
  getItem(item: string, part?: string): ItemDefinition | undefined {
    const upperItem = item.toUpperCase();

    if (part) {
      const partDict = this.getPart(part);
      if (partDict) {
        return partDict[upperItem];
      }
    } else {
      // Search all parts
      for (const partItems of Object.values(this.structure)) {
        if (typeof partItems === 'object' && 'Title' in partItems) {
          // This is an ItemDefinition, not a PartStructure
          continue;
        }
        const items = partItems as PartStructure;
        if (upperItem in items) {
          return items[upperItem];
        }
      }
    }
    return undefined;
  }

  /**
   * Check if an item is valid for this filing structure.
   */
  isValidItem(item: string, part?: string): boolean {
    return this.getItem(item, part) !== undefined;
  }

  /**
   * Get all parts in the structure.
   */
  getParts(): string[] {
    return Object.keys(this.structure);
  }

  /**
   * Get all items in a part, or all items if no part specified.
   */
  getItems(part?: string): string[] {
    if (part) {
      const partDict = this.getPart(part);
      return partDict ? Object.keys(partDict) : [];
    }

    const allItems: string[] = [];
    for (const partItems of Object.values(this.structure)) {
      if (typeof partItems === 'object' && !('Title' in partItems)) {
        allItems.push(...Object.keys(partItems as PartStructure));
      }
    }
    return allItems;
  }
}

/**
 * Filing structure for reports without parts (like 8-K).
 * Items are at the top level, not nested under parts.
 */
export class ItemOnlyFilingStructure extends FilingStructure {
  override getPart(_part: string): PartStructure | undefined {
    return undefined;
  }

  override getItem(item: string, _part?: string): ItemDefinition | undefined {
    return this.structure[item.toUpperCase()] as ItemDefinition | undefined;
  }

  override getItems(_part?: string): string[] {
    return Object.keys(this.structure);
  }
}

/**
 * Check if an item is valid for a given filing structure.
 * Standalone function for cases where you have raw structure data.
 */
export function isValidItemForFiling(
  filingStructure: StructureDefinition,
  item: string,
  part?: string
): boolean {
  const upperItem = item.toUpperCase();

  if (part) {
    const partDict = filingStructure[part.toUpperCase()] as PartStructure;
    if (partDict) {
      return upperItem in partDict;
    }
  } else {
    for (const partItems of Object.values(filingStructure)) {
      if (typeof partItems === 'object' && !('Title' in partItems)) {
        if (upperItem in (partItems as PartStructure)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Extract item numbers from filing sections using a regex pattern.
 *
 * This is a shared utility to eliminate code duplication between different
 * filing types (8-K, 20-F, etc.) that have similar item extraction logic.
 *
 * @param sections - Map of section names to Section objects
 * @param itemPattern - Regex pattern to match item numbers in titles
 * @returns List of extracted item strings
 */
export function extractItemsFromSections(
  sections: Map<string, { title: string }>,
  itemPattern: RegExp
): string[] {
  const items: string[] = [];

  for (const section of sections.values()) {
    const { title } = section;
    const match = itemPattern.exec(title);

    if (match && match[1]) {
      items.push(match[1]);
    } else {
      // Fallback: use first part of title before " - " or full title
      if (title.includes(' - ')) {
        items.push(title.split(' - ')[0].trim());
      } else {
        items.push(title);
      }
    }
  }

  return items;
}

// ================================
// Pre-defined Filing Structures
// ================================

/**
 * 10-K filing structure.
 */
export const TEN_K_STRUCTURE = new FilingStructure({
  "PART I": {
    "ITEM 1": { Title: "Business", Description: "..." },
    "ITEM 1A": { Title: "Risk Factors", Description: "..." },
    "ITEM 1B": { Title: "Unresolved Staff Comments", Description: "..." },
    "ITEM 1C": { Title: "Cybersecurity", Description: "..." },
    "ITEM 2": { Title: "Properties", Description: "..." },
    "ITEM 3": { Title: "Legal Proceedings", Description: "..." },
    "ITEM 4": { Title: "Mine Safety Disclosures", Description: "..." },
  },
  "PART II": {
    "ITEM 5": { Title: "Market for Registrant's Common Equity", Description: "..." },
    "ITEM 6": { Title: "Selected Financial Data", Description: "..." },
    "ITEM 7": { Title: "Management's Discussion and Analysis (MD&A)", Description: "..." },
    "ITEM 7A": { Title: "Quantitative and Qualitative Disclosures About Market Risk", Description: "..." },
    "ITEM 8": { Title: "Financial Statements", Description: "..." },
    "ITEM 9": { Title: "Controls and Procedures", Description: "..." },
    "ITEM 9A": { Title: "Controls and Procedures", Description: "..." },
    "ITEM 9B": { Title: "Other Information", Description: "..." },
    "ITEM 9C": { Title: "Disclosure Regarding Foreign Jurisdictions", Description: "..." },
  },
  "PART III": {
    "ITEM 10": { Title: "Directors, Executive Officers, and Corporate Governance", Description: "..." },
    "ITEM 11": { Title: "Executive Compensation", Description: "..." },
    "ITEM 12": { Title: "Security Ownership", Description: "..." },
    "ITEM 13": { Title: "Certain Relationships and Related Transactions", Description: "..." },
    "ITEM 14": { Title: "Principal Accounting Fees and Services", Description: "..." },
  },
  "PART IV": {
    "ITEM 15": { Title: "Exhibits, Financial Statement Schedules", Description: "..." },
    "ITEM 16": { Title: "Form 10-K Summary", Description: "..." },
  },
});

// Add TEN_Q_STRUCTURE, TWENTY_F_STRUCTURE, EIGHT_K_STRUCTURE similarly
// (Port from Python source files)
```

## Testing Requirements

### Unit Tests

1. **FilingStructure**:
   - Test `getPart()` with valid/invalid parts
   - Test `getItem()` with/without part specification
   - Test `isValidItem()`
   - Test `getParts()` and `getItems()`
2. **ItemOnlyFilingStructure**:
   - Test that `getPart()` returns undefined
   - Test `getItem()` direct lookup
3. **Helper functions**:
   - Test `isValidItemForFiling()`
   - Test `extractItemsFromSections()` with various patterns
4. **Pre-defined structures**:
   - Test all items in TEN_K_STRUCTURE are valid
   - Test boundary conditions

## Development Steps

1. Read Python source file thoroughly
2. Create `ts/src/reports/structures.ts`:
   - Define interfaces for ItemDefinition, PartStructure, StructureDefinition
   - Implement FilingStructure class
   - Implement ItemOnlyFilingStructure class
   - Implement helper functions
   - Add pre-defined structures (10-K, 10-Q, 8-K, 20-F)
3. Update exports in `ts/src/reports/index.ts`
4. Update report classes to use FilingStructure
5. Write comprehensive tests
6. Run all tests: `npm test`

## Branch Information

Your branch will be auto-generated when the Claude Code remote session starts.
Commit and push to your assigned branch when work is complete.

## Dependencies

**No dependencies** - This is the base task that other tasks depend on.

**Required by**: All other tasks (TASK_10Q, TASK_8K, TASK_20F) depend on this task's completion.

## Success Criteria

- [ ] FilingStructure class fully implemented
- [ ] ItemOnlyFilingStructure class fully implemented
- [ ] Helper functions implemented
- [ ] Pre-defined structures for all report types
- [ ] All tests pass
- [ ] Code follows project conventions
