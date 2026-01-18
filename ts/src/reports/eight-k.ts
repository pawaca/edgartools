/**
 * EightK - 8-K Current Report class.
 *
 * Key difference from 10-K: Uses decimal item numbering (1.01, 2.02, etc.)
 * and requires normalization for Apple-style spacing ("Item 2. 02" -> "2.02").
 */

import type { Section } from '../types/section.js';
import { FilingSGML } from '../sgml/filing-sgml.js';
import { BaseReport, type SectionNameMapping } from './base.js';

/**
 * Normalize 8-K item number.
 * Handles:
 * - "Item 2.02" -> "2.02"
 * - "Item 2. 02" -> "2.02" (Apple-style spacing)
 * - "ITEM 2.02" -> "2.02" (case variation)
 */
export function normalizeItemNumber(itemStr: string): string {
  let cleaned = itemStr.toLowerCase().trim();

  // Remove "item" prefix
  cleaned = cleaned.replace(/^item\s+/i, '');

  // Normalize spacing around decimal point: "2. 02" -> "2.02"
  cleaned = cleaned.replace(/\s*\.\s*/g, '.');

  // Remove trailing period
  cleaned = cleaned.replace(/\.$/, '');

  return cleaned;
}

/**
 * Convert decimal item to key format: "2.02" -> "item_202"
 */
function itemToKey(itemNum: string): string {
  const normalized = normalizeItemNumber(itemNum);
  return `item_${normalized.replace('.', '')}`;
}

/**
 * 8-K Section to Item mapping.
 */
const SECTION_TO_ITEM: SectionNameMapping = {
  // Section 1 - Registrant's Business and Operations
  item_101: '1.01',
  entry_into_material_agreement: '1.01',
  item_102: '1.02',
  termination_of_agreement: '1.02',
  item_103: '1.03',
  bankruptcy: '1.03',
  item_104: '1.04',
  mine_safety: '1.04',

  // Section 2 - Financial Information
  item_201: '2.01',
  acquisition_disposition: '2.01',
  item_202: '2.02',
  results_of_operations: '2.02',
  item_203: '2.03',
  direct_financial_obligation: '2.03',
  item_204: '2.04',
  triggering_events: '2.04',
  item_205: '2.05',
  exit_costs: '2.05',
  item_206: '2.06',
  material_impairments: '2.06',

  // Section 3 - Securities and Trading Markets
  item_301: '3.01',
  delisting: '3.01',
  item_302: '3.02',
  unregistered_sales: '3.02',
  item_303: '3.03',
  material_modification: '3.03',

  // Section 4 - Matters Related to Accountants
  item_401: '4.01',
  changes_in_accountant: '4.01',
  item_402: '4.02',
  non_reliance_audit: '4.02',

  // Section 5 - Corporate Governance
  item_501: '5.01',
  change_in_control: '5.01',
  item_502: '5.02',
  director_departure: '5.02',
  item_503: '5.03',
  amendments_to_articles: '5.03',
  item_504: '5.04',
  temporary_trading_suspension: '5.04',
  item_505: '5.05',
  code_of_ethics: '5.05',
  item_506: '5.06',
  shell_company_transactions: '5.06',
  item_507: '5.07',
  shareholder_vote: '5.07',
  item_508: '5.08',
  shareholder_director_nominations: '5.08',

  // Section 6 - Asset-Backed Securities
  item_601: '6.01',
  abs_info: '6.01',
  item_602: '6.02',
  abs_change: '6.02',
  item_603: '6.03',
  abs_other_info: '6.03',
  item_604: '6.04',
  abs_failure: '6.04',
  item_605: '6.05',
  abs_material_change: '6.05',

  // Section 7 - Regulation FD
  item_701: '7.01',
  regulation_fd_disclosure: '7.01',

  // Section 8 - Other Events
  item_801: '8.01',
  other_events: '8.01',

  // Section 9 - Financial Statements and Exhibits
  item_901: '9.01',
  financial_statements_and_exhibits: '9.01',
};

/**
 * 8-K Item to Section mapping (reverse).
 */
const ITEM_TO_SECTION: SectionNameMapping = Object.fromEntries(
  Object.entries(SECTION_TO_ITEM).map(([k, v]) => [v, k])
);

/**
 * 8-K Current Report.
 *
 * Usage:
 * ```typescript
 * const eightk = EightK.fromSgmlText(sgmlContent);
 *
 * // Access by decimal format
 * console.log(eightk.getSection('2.02'));  // Results of Operations
 * console.log(eightk.getSection('8.01'));  // Other Events
 *
 * // Access by Item format (handles spacing variations)
 * console.log(eightk.getSection('Item 2.02'));
 * console.log(eightk.getSection('Item 2. 02'));  // Apple-style
 *
 * // Convenience accessors
 * console.log(eightk.resultsOfOperations);
 * console.log(eightk.otherEvents);
 * ```
 */
export class EightK extends BaseReport {
  readonly form = '8-K';
  readonly sectionToItem = SECTION_TO_ITEM;
  readonly itemToSection = ITEM_TO_SECTION;

  /**
   * Create EightK from SGML text.
   */
  static fromSgmlText(text: string): EightK {
    const sgml = FilingSGML.fromText(text);
    return new EightK({ sgml });
  }

  /**
   * Create EightK from SGML file or URL.
   */
  static async fromSource(source: string): Promise<EightK> {
    const sgml = await FilingSGML.fromSource(source);
    return new EightK({ sgml });
  }

  /**
   * Create EightK from HTML content.
   */
  static fromHtml(html: string): EightK {
    return new EightK({ html });
  }

  /**
   * Override findSection for 8-K decimal normalization.
   */
  protected override findSection(key: string): Section | undefined {
    // First try base class lookup
    const baseResult = super.findSection(key);
    if (baseResult) return baseResult;

    // Try with normalization (handles "Item 2. 02" -> "item_202")
    const normalized = normalizeItemNumber(key);

    // Try as key format
    const keyFormat = itemToKey(key);
    if (this.sections.has(keyFormat)) {
      return this.sections.get(keyFormat);
    }

    // Try decimal format directly
    for (const [sectionKey, section] of this.sections) {
      if (section.item === normalized) {
        return section;
      }
    }

    return undefined;
  }

  // ===============================
  // Section 1 - Business Operations
  // ===============================

  /** Item 1.01 - Entry into a Material Definitive Agreement */
  get entryIntoMaterialAgreement(): string | null {
    return this.getSection('item_101');
  }

  /** Item 1.02 - Termination of a Material Definitive Agreement */
  get terminationOfAgreement(): string | null {
    return this.getSection('item_102');
  }

  /** Item 1.03 - Bankruptcy or Receivership */
  get bankruptcy(): string | null {
    return this.getSection('item_103');
  }

  // ===============================
  // Section 2 - Financial Information
  // ===============================

  /** Item 2.01 - Completion of Acquisition or Disposition of Assets */
  get acquisitionDisposition(): string | null {
    return this.getSection('item_201');
  }

  /** Item 2.02 - Results of Operations and Financial Condition */
  get resultsOfOperations(): string | null {
    return this.getSection('item_202');
  }

  /** Item 2.03 - Creation of Direct Financial Obligation */
  get directFinancialObligation(): string | null {
    return this.getSection('item_203');
  }

  /** Item 2.05 - Costs Associated with Exit or Disposal Activities */
  get exitCosts(): string | null {
    return this.getSection('item_205');
  }

  /** Item 2.06 - Material Impairments */
  get materialImpairments(): string | null {
    return this.getSection('item_206');
  }

  // ===============================
  // Section 5 - Corporate Governance
  // ===============================

  /** Item 5.01 - Changes in Control */
  get changeInControl(): string | null {
    return this.getSection('item_501');
  }

  /** Item 5.02 - Departure of Directors or Officers */
  get directorDeparture(): string | null {
    return this.getSection('item_502');
  }

  /** Item 5.03 - Amendments to Articles */
  get amendmentsToArticles(): string | null {
    return this.getSection('item_503');
  }

  /** Item 5.07 - Submission of Matters to a Vote of Security Holders */
  get shareholderVote(): string | null {
    return this.getSection('item_507');
  }

  // ===============================
  // Section 7 - Regulation FD
  // ===============================

  /** Item 7.01 - Regulation FD Disclosure */
  get regulationFdDisclosure(): string | null {
    return this.getSection('item_701');
  }

  // ===============================
  // Section 8 - Other Events
  // ===============================

  /** Item 8.01 - Other Events */
  get otherEvents(): string | null {
    return this.getSection('item_801');
  }

  // ===============================
  // Section 9 - Financial Statements
  // ===============================

  /** Item 9.01 - Financial Statements and Exhibits */
  get financialStatementsAndExhibits(): string | null {
    return this.getSection('item_901');
  }
}
