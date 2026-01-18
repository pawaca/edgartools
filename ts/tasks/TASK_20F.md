# Task: Port Python 20-F Implementation to TypeScript

## Overview

Port the Python `TwentyF` class from `edgar/company_reports/twenty_f.py` to create a new TypeScript implementation at `ts/src/reports/twenty-f.ts`.

**IMPORTANT**: This is a PORT task. Study the Python implementation carefully and replicate its functionality in TypeScript. Do not create new features - faithfully reproduce Python behavior.

## Source Files to Port

| Python Source | TypeScript Target | Status |
|--------------|-------------------|--------|
| `edgar/company_reports/twenty_f.py` | `ts/src/reports/twenty-f.ts` | Needs creation |
| Pattern extractor 20-F section | `ts/src/extractors/patterns/twenty-f.ts` | Needs creation |

## Python Implementation Analysis

### Structure (5 Parts, 19+ Items)

```python
# Python: lines 14-108
structure = FilingStructure({
    "PART I": {
        "ITEM 1": {"Title": "Identity of Directors, Senior Management, and Advisers", ...},
        "ITEM 2": {"Title": "Offer Statistics and Expected Timetable", ...},
        "ITEM 3": {"Title": "Key Information", ...},
        "ITEM 4": {"Title": "Information on the Company", ...},
        "ITEM 4A": {"Title": "Unresolved Staff Comments", ...}
    },
    "PART II": {
        "ITEM 5": {"Title": "Operating and Financial Review and Prospects", ...},
        "ITEM 6": {"Title": "Directors, Senior Management, and Employees", ...},
        "ITEM 7": {"Title": "Major Shareholders and Related Party Transactions", ...},
        "ITEM 8": {"Title": "Financial Information", ...},
        "ITEM 9": {"Title": "The Offer and Listing", ...}
    },
    "PART III": {
        "ITEM 10": {"Title": "Additional Information", ...},
        "ITEM 11": {"Title": "Quantitative and Qualitative Disclosures About Market Risk", ...},
        "ITEM 12": {"Title": "Description of Securities Other Than Equity Securities", ...}
    },
    "PART IV": {
        "ITEM 13": {"Title": "Defaults, Dividend Arrearages, and Delinquencies", ...},
        "ITEM 14": {"Title": "Material Modifications to the Rights of Security Holders", ...},
        "ITEM 15": {"Title": "Controls and Procedures", ...},
        "ITEM 16": {"Title": "Various Disclosures", ...}
        # Note: Items 16A-16K exist in patterns but not structure
    },
    "PART V": {
        "ITEM 17": {"Title": "Financial Statements", ...},
        "ITEM 18": {"Title": "Financial Statements", ...},
        "ITEM 19": {"Title": "Exhibits", ...}
    }
})
```

### Convenience Properties

```python
# Python: lines 236-285
@property
def key_information(self):
    return self['Item 3']

@property
def risk_factors(self):
    return self['Item 3']

@property
def business(self):
    return self['Item 4']
# ... more properties
```

### Section Lookup with Part Prefix

```python
# Python: lines 176-230
def __getitem__(self, item_name: str):
    # Try part-prefixed keys (TOC-based detection)
    for part in ['i', 'ii', 'iii', 'iv', 'v']:
        key = f'part_{part}_item_{item_num}'
        if key in self.sections:
            return self.sections[key].text()
```

## TypeScript Implementation Plan

### 1. Create Pattern File

Create `ts/src/extractors/patterns/twenty-f.ts`:

```typescript
import type { SectionPatterns } from '../../types/section.js';

export const TWENTY_F_PATTERNS: SectionPatterns = {
  // Port all patterns from Python (lines 122-276 in pattern_section_extractor.py)
  item_1: [
    { pattern: /^(Item|ITEM)\s+1\.?\s*[-–—.]?\s*Identity.*Directors/i, title: 'Item 1 - Identity of Directors' },
    { pattern: /^Identity.*Directors.*Senior\s+Management/i, title: 'Identity of Directors' },
  ],
  // ... all items through item_19, plus item_16a through item_16k
};
```

### 2. Create Report Class

Create `ts/src/reports/twenty-f.ts`:

```typescript
import type { Section } from '../types/section.js';
import { FilingSGML } from '../sgml/filing-sgml.js';
import { BaseReport, type SectionNameMapping } from './base.js';

const SECTION_TO_ITEM: SectionNameMapping = {
  // Part I
  identity_of_directors: 'Item 1',
  offer_statistics: 'Item 2',
  key_information: 'Item 3',
  company_information: 'Item 4',
  unresolved_staff_comments: 'Item 4A',
  // Part II
  operating_review: 'Item 5',
  directors_and_employees: 'Item 6',
  major_shareholders: 'Item 7',
  financial_information: 'Item 8',
  offer_and_listing: 'Item 9',
  // Part III
  additional_information: 'Item 10',
  market_risk: 'Item 11',
  securities_description: 'Item 12',
  // Part IV
  defaults: 'Item 13',
  material_modifications: 'Item 14',
  controls_and_procedures: 'Item 15',
  various_disclosures: 'Item 16',
  // Item 16 sub-items
  audit_committee_expert: 'Item 16A',
  code_of_ethics: 'Item 16B',
  // ... through Item 16K
  // Part V
  financial_statements_17: 'Item 17',
  financial_statements_18: 'Item 18',
  exhibits: 'Item 19',
};

export class TwentyF extends BaseReport {
  readonly form = '20-F';
  readonly sectionToItem = SECTION_TO_ITEM;
  readonly itemToSection = /* reverse mapping */;

  constructor(options: ReportOptions) {
    super(options);
    const form = this._sgml?.form || '';
    if (!['20-F', '20-F/A'].includes(form)) {
      throw new Error(`Expected 20-F form but got ${form}`);
    }
  }

  // Override findSection for 5-part lookup
  protected override findSection(key: string): Section | undefined {
    // Try all 5 parts
    for (const part of ['i', 'ii', 'iii', 'iv', 'v']) {
      const partKey = `part_${part}_item_${itemNum}`;
      if (this.sections.has(partKey)) {
        return this.sections.get(partKey);
      }
    }
    return super.findSection(key);
  }

  // Convenience properties
  get keyInformation(): string | null {
    return this.getSection('Item 3');
  }

  get riskFactors(): string | null {
    return this.getSection('Item 3');
  }

  get business(): string | null {
    return this.getSection('Item 4');
  }

  // ... port all convenience properties
}
```

### 3. Update Exports

Update `ts/src/extractors/patterns/index.ts`:
```typescript
export { TWENTY_F_PATTERNS } from './twenty-f.js';
```

Update `ts/src/reports/index.ts`:
```typescript
export { TwentyF } from './twenty-f.js';
```

## Testing Requirements

### Unit Tests

1. **Constructor validation**: Test form type assertion
2. **Section lookup**: Test all lookup formats
   - Direct key: `'item_5'`
   - Part-qualified: `'part_ii_item_5'`
   - Friendly format: `'Item 5'`
   - Short format: `'5'`
3. **Item 16 sub-items**: Test 16A through 16K lookups
4. **Convenience properties**: Test all property accessors

### Integration Tests

Test with real 20-F filings:
- Alibaba (BABA)
- Toyota (TM)
- Sony (SONY)

## Development Steps

1. Read Python source file thoroughly
2. Create `ts/src/extractors/patterns/twenty-f.ts` with all patterns
3. Create `ts/src/reports/twenty-f.ts`:
   - Port FilingStructure definition
   - Implement constructor with form validation
   - Override `findSection()` for 5-part lookup
   - Add all convenience properties
4. Update export files
5. Write comprehensive tests
6. Run all tests: `npm test`

## Branch Information

Work on branch: `claude/ts-twentyf-impl-SSJC5`

## Success Criteria

- [ ] All Python `TwentyF` public methods have TypeScript equivalents
- [ ] Form validation matches Python behavior
- [ ] 5-part section lookup works correctly
- [ ] All Item 16 sub-items (16A-16K) are supported
- [ ] All convenience properties work
- [ ] All tests pass
- [ ] Code follows project conventions
