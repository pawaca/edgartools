/**
 * TenQ - 10-Q Quarterly Report class.
 *
 * Key difference from 10-K: Uses part-qualified section names
 * because Part I and Part II have overlapping item numbers.
 *
 * Section naming: 'part_i_item_1', 'part_ii_item_1' (not just 'item_1')
 */

import type { Section } from '../types/section.js';
import { FilingSGML } from '../sgml/filing-sgml.js';
import { BaseReport, type SectionNameMapping } from './base.js';

/**
 * 10-Q Section to Item mapping.
 * Uses part-qualified names to avoid collisions.
 */
const SECTION_TO_ITEM: SectionNameMapping = {
  // Part I - Financial Information
  part_i_item_1: 'Part I, Item 1',
  financial_statements: 'Part I, Item 1',
  part_i_item_2: 'Part I, Item 2',
  mda: 'Part I, Item 2',
  part_i_item_3: 'Part I, Item 3',
  market_risk: 'Part I, Item 3',
  part_i_item_4: 'Part I, Item 4',
  controls_and_procedures: 'Part I, Item 4',

  // Part II - Other Information
  part_ii_item_1: 'Part II, Item 1',
  legal_proceedings: 'Part II, Item 1',
  part_ii_item_1a: 'Part II, Item 1A',
  risk_factors: 'Part II, Item 1A',
  part_ii_item_2: 'Part II, Item 2',
  unregistered_sales: 'Part II, Item 2',
  part_ii_item_3: 'Part II, Item 3',
  defaults: 'Part II, Item 3',
  part_ii_item_4: 'Part II, Item 4',
  mine_safety: 'Part II, Item 4',
  part_ii_item_5: 'Part II, Item 5',
  other_information: 'Part II, Item 5',
  part_ii_item_6: 'Part II, Item 6',
  exhibits: 'Part II, Item 6',
};

/**
 * 10-Q Item to Section mapping (reverse).
 */
const ITEM_TO_SECTION: SectionNameMapping = Object.fromEntries(
  Object.entries(SECTION_TO_ITEM).map(([k, v]) => [v, k])
);

/**
 * 10-Q Quarterly Report.
 *
 * Usage:
 * ```typescript
 * const tenq = TenQ.fromSgmlText(sgmlContent);
 *
 * // Access by part-qualified key
 * console.log(tenq.getSection('part_i_item_1'));  // Part I - Financial Statements
 * console.log(tenq.getSection('part_ii_item_1')); // Part II - Legal Proceedings
 *
 * // Access by friendly format
 * console.log(tenq.getSection('Part I, Item 1'));
 * console.log(tenq.getSection('Part II, Item 1'));
 *
 * // Convenience accessors
 * console.log(tenq.financialStatements);  // Part I, Item 1
 * console.log(tenq.mda);                  // Part I, Item 2
 * console.log(tenq.riskFactors);          // Part II, Item 1A
 * ```
 */
export class TenQ extends BaseReport {
  readonly form = '10-Q';
  readonly sectionToItem = SECTION_TO_ITEM;
  readonly itemToSection = ITEM_TO_SECTION;

  /**
   * Create TenQ from SGML text.
   */
  static fromSgmlText(text: string): TenQ {
    const sgml = FilingSGML.fromText(text);
    return new TenQ({ sgml });
  }

  /**
   * Create TenQ from SGML file or URL.
   */
  static async fromSource(source: string): Promise<TenQ> {
    const sgml = await FilingSGML.fromSource(source);
    return new TenQ({ sgml });
  }

  /**
   * Create TenQ from HTML content.
   */
  static fromHtml(html: string): TenQ {
    return new TenQ({ html });
  }

  /**
   * Override items property to return part-qualified format.
   */
  override get items(): string[] {
    const items: string[] = [];

    for (const [key, section] of this.sections) {
      if (key.startsWith('part_')) {
        const partMatch = key.match(/^part_(i{1,2})_/i);
        const itemMatch = key.match(/item_(\d+[a-z]?)/i);

        if (partMatch && itemMatch) {
          const part = partMatch[1].toUpperCase() === 'II' ? 'Part II' : 'Part I';
          const itemNum = itemMatch[1].toUpperCase();
          items.push(`${part}, Item ${itemNum}`);
        }
      }
    }

    return items;
  }

  /**
   * Override findSection for part-qualified lookups.
   */
  protected override findSection(key: string): Section | undefined {
    // First try base class lookup
    const baseResult = super.findSection(key);
    if (baseResult) return baseResult;

    const normalized = key.trim().toLowerCase();

    // Try 'Part I, Item X' or 'Part II, Item X' format
    const partItemMatch = normalized.match(
      /part\s+(i{1,2}|1|2)\s*,?\s*item\s+(\d+[a-z]?)/i
    );
    if (partItemMatch) {
      const partNum = partItemMatch[1].toLowerCase();
      const itemNum = partItemMatch[2].toLowerCase();
      const partKey = partNum === 'ii' || partNum === '2' ? 'ii' : 'i';
      const sectionKey = `part_${partKey}_item_${itemNum}`;
      if (this.sections.has(sectionKey)) {
        return this.sections.get(sectionKey);
      }
    }

    // Try 'Item X' - defaults to Part I first, then Part II
    const itemMatch = normalized.match(/^item\s+(\d+[a-z]?)$/i);
    if (itemMatch) {
      const itemNum = itemMatch[1].toLowerCase();

      // Try Part I first
      let sectionKey = `part_i_item_${itemNum}`;
      if (this.sections.has(sectionKey)) {
        return this.sections.get(sectionKey);
      }

      // Fall back to Part II
      sectionKey = `part_ii_item_${itemNum}`;
      if (this.sections.has(sectionKey)) {
        return this.sections.get(sectionKey);
      }
    }

    return undefined;
  }

  // ===============================
  // Part I - Financial Information
  // ===============================

  /** Part I, Item 1 - Financial Statements */
  get financialStatements(): string | null {
    return this.getSection('part_i_item_1');
  }

  /** Part I, Item 2 - Management's Discussion and Analysis */
  get mda(): string | null {
    return this.getSection('part_i_item_2');
  }

  /** Part I, Item 3 - Quantitative and Qualitative Disclosures About Market Risk */
  get marketRisk(): string | null {
    return this.getSection('part_i_item_3');
  }

  /** Part I, Item 4 - Controls and Procedures */
  get controlsAndProcedures(): string | null {
    return this.getSection('part_i_item_4');
  }

  // ===============================
  // Part II - Other Information
  // ===============================

  /** Part II, Item 1 - Legal Proceedings */
  get legalProceedings(): string | null {
    return this.getSection('part_ii_item_1');
  }

  /** Part II, Item 1A - Risk Factors */
  get riskFactors(): string | null {
    return this.getSection('part_ii_item_1a');
  }

  /** Part II, Item 2 - Unregistered Sales of Equity Securities */
  get unregisteredSales(): string | null {
    return this.getSection('part_ii_item_2');
  }

  /** Part II, Item 3 - Defaults Upon Senior Securities */
  get defaults(): string | null {
    return this.getSection('part_ii_item_3');
  }

  /** Part II, Item 4 - Mine Safety Disclosures */
  get mineSafety(): string | null {
    return this.getSection('part_ii_item_4');
  }

  /** Part II, Item 5 - Other Information */
  get otherInformation(): string | null {
    return this.getSection('part_ii_item_5');
  }

  /** Part II, Item 6 - Exhibits */
  get exhibits(): string | null {
    return this.getSection('part_ii_item_6');
  }

  // ===============================
  // Disambiguation helpers
  // ===============================

  /**
   * Get section by item number and part.
   * Useful when you need to explicitly specify which part.
   */
  getItemFromPart(itemNum: string, part: 'I' | 'II'): string | null {
    const partKey = part === 'I' ? 'i' : 'ii';
    const normalized = itemNum.toLowerCase().replace(/^item\s*/i, '');
    return this.getSection(`part_${partKey}_item_${normalized}`);
  }
}
