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
 * For ItemOnlyFilingStructure, the values are ItemDefinitions directly.
 */
export type StructureDefinition = Record<string, PartStructure | ItemDefinition>;

/**
 * Filing structure for reports with parts (10-K, 10-Q, 20-F).
 *
 * This class provides methods to navigate and validate the hierarchical
 * structure of SEC filings that have Parts containing Items.
 */
export class FilingStructure {
  readonly structure: StructureDefinition;

  constructor(structure: StructureDefinition) {
    this.structure = structure;
  }

  /**
   * Get a part by name.
   *
   * @param part - Part name (e.g., 'PART I', 'PART II')
   * @returns The part structure or undefined if not found
   */
  getPart(part: string): PartStructure | undefined {
    return this.structure[part.toUpperCase()] as PartStructure | undefined;
  }

  /**
   * Get an item definition by item key and optional part.
   * If part is not specified, searches all parts.
   *
   * @param item - Item key (e.g., 'ITEM 1', 'ITEM 1A')
   * @param part - Optional part name to restrict search
   * @returns The item definition or undefined if not found
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
        // Check if this is a PartStructure (has nested items) or ItemDefinition
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
   *
   * @param item - Item key to validate
   * @param part - Optional part to restrict validation
   * @returns True if the item exists in the structure
   */
  isValidItem(item: string, part?: string): boolean {
    return this.getItem(item, part) !== undefined;
  }

  /**
   * Get all part names in the structure.
   *
   * @returns Array of part names
   */
  getParts(): string[] {
    return Object.keys(this.structure);
  }

  /**
   * Get all item keys in a part, or all items if no part specified.
   *
   * @param part - Optional part to get items from
   * @returns Array of item keys
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
 *
 * @param filingStructure - Raw structure data
 * @param item - Item key to validate
 * @param part - Optional part to restrict validation
 * @returns True if the item exists
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
 * @param sections - Map of section names to Section objects with title property
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
  'PART I': {
    'ITEM 1': {
      Title: 'Business',
      Description:
        'Description of the company\'s business, including its products and services.',
    },
    'ITEM 1A': {
      Title: 'Risk Factors',
      Description: 'Discussion of the most significant factors that make the investment risky.',
    },
    'ITEM 1B': {
      Title: 'Unresolved Staff Comments',
      Description: 'Comments from SEC staff that remain unresolved.',
    },
    'ITEM 1C': {
      Title: 'Cybersecurity',
      Description: 'Description of cybersecurity risk management and strategy.',
    },
    'ITEM 2': {
      Title: 'Properties',
      Description: 'Description of the company\'s physical properties.',
    },
    'ITEM 3': {
      Title: 'Legal Proceedings',
      Description: 'Description of pending legal proceedings.',
    },
    'ITEM 4': {
      Title: 'Mine Safety Disclosures',
      Description: 'Required for companies with mining operations.',
    },
  },
  'PART II': {
    'ITEM 5': {
      Title: "Market for Registrant's Common Equity",
      Description: 'Information about the company\'s stock.',
    },
    'ITEM 6': {
      Title: '[Reserved]',
      Description: 'Previously Selected Financial Data (now reserved).',
    },
    'ITEM 7': {
      Title: "Management's Discussion and Analysis (MD&A)",
      Description: 'Management\'s perspective on the financial condition and results.',
    },
    'ITEM 7A': {
      Title: 'Quantitative and Qualitative Disclosures About Market Risk',
      Description: 'Information on the company\'s exposure to market risk.',
    },
    'ITEM 8': {
      Title: 'Financial Statements',
      Description: 'Audited financial statements and supplementary data.',
    },
    'ITEM 9': {
      Title: 'Changes in and Disagreements with Accountants',
      Description: 'Disclosure of changes in accountants.',
    },
    'ITEM 9A': {
      Title: 'Controls and Procedures',
      Description: 'Evaluation of disclosure controls and procedures.',
    },
    'ITEM 9B': {
      Title: 'Other Information',
      Description: 'Other information required to be disclosed.',
    },
    'ITEM 9C': {
      Title: 'Disclosure Regarding Foreign Jurisdictions',
      Description: 'Disclosure about foreign jurisdictions that prevent inspections.',
    },
  },
  'PART III': {
    'ITEM 10': {
      Title: 'Directors, Executive Officers, and Corporate Governance',
      Description: 'Information about directors and executive officers.',
    },
    'ITEM 11': {
      Title: 'Executive Compensation',
      Description: 'Disclosure of executive compensation.',
    },
    'ITEM 12': {
      Title: 'Security Ownership',
      Description: 'Security ownership of certain beneficial owners and management.',
    },
    'ITEM 13': {
      Title: 'Certain Relationships and Related Transactions',
      Description: 'Transactions with related parties.',
    },
    'ITEM 14': {
      Title: 'Principal Accounting Fees and Services',
      Description: 'Fees paid to principal accountants.',
    },
  },
  'PART IV': {
    'ITEM 15': {
      Title: 'Exhibits, Financial Statement Schedules',
      Description: 'List of exhibits and financial statement schedules.',
    },
    'ITEM 16': {
      Title: 'Form 10-K Summary',
      Description: 'Optional summary of the 10-K.',
    },
  },
});

/**
 * 10-Q filing structure.
 */
export const TEN_Q_STRUCTURE = new FilingStructure({
  'PART I': {
    'ITEM 1': {
      Title: 'Financial Statements',
      Description:
        'Unaudited financial statements including balance sheets, income statements, and cash flow statements.',
    },
    'ITEM 2': {
      Title:
        "Management's Discussion and Analysis of Financial Condition and Results of Operations (MD&A)",
      Description: "Management's perspective on the financial condition and results of operations.",
    },
    'ITEM 3': {
      Title: 'Quantitative and Qualitative Disclosures About Market Risk',
      Description: "Information on the company's exposure to market risk.",
    },
    'ITEM 4': {
      Title: 'Controls and Procedures',
      Description: 'Evaluation of the effectiveness of disclosure controls and procedures.',
    },
  },
  'PART II': {
    'ITEM 1': {
      Title: 'Legal Proceedings',
      Description: 'Brief description of any significant pending legal proceedings.',
    },
    'ITEM 1A': {
      Title: 'Risk Factors',
      Description: 'An update on risk factors that may affect future results.',
    },
    'ITEM 2': {
      Title: 'Unregistered Sales of Equity Securities and Use of Proceeds',
      Description: 'Details of unregistered sales of equity securities.',
    },
    'ITEM 3': {
      Title: 'Defaults Upon Senior Securities',
      Description: 'Information regarding any defaults on senior securities.',
    },
    'ITEM 4': {
      Title: 'Mine Safety Disclosures',
      Description: 'Required for companies with mining operations.',
    },
    'ITEM 5': {
      Title: 'Other Information',
      Description: 'Any other information that should be disclosed to investors.',
    },
    'ITEM 6': {
      Title: 'Exhibits',
      Description: 'List of exhibits required by Item 601 of Regulation S-K.',
    },
  },
});
