/**
 * TenK - 10-K Annual Report class.
 *
 * Provides convenient access to 10-K specific sections and data.
 * Mirrors Python's edgar/company_reports/ten_k.py implementation.
 */

import { FilingSGML } from '../sgml/filing-sgml.js';
import { BaseReport, type SectionNameMapping } from './base.js';

/**
 * 10-K Section to Item mapping.
 */
const SECTION_TO_ITEM: SectionNameMapping = {
  business: 'Item 1',
  risk_factors: 'Item 1A',
  unresolved_staff_comments: 'Item 1B',
  cybersecurity: 'Item 1C',
  properties: 'Item 2',
  legal_proceedings: 'Item 3',
  mine_safety: 'Item 4',
  mda: 'Item 7',
  market_risk: 'Item 7A',
  financial_statements: 'Item 8',
  changes_in_accountants: 'Item 9',
  controls_and_procedures: 'Item 9A',
  other_information: 'Item 9B',
  directors: 'Item 10',
  executive_compensation: 'Item 11',
  security_ownership: 'Item 12',
  related_party_transactions: 'Item 13',
  principal_accountant: 'Item 14',
  exhibits: 'Item 15',
  form_10k_summary: 'Item 16',
};

/**
 * 10-K Item to Section mapping (reverse).
 */
const ITEM_TO_SECTION: SectionNameMapping = Object.fromEntries(
  Object.entries(SECTION_TO_ITEM).map(([k, v]) => [v, k])
);

/**
 * 10-K Annual Report.
 *
 * Usage:
 * ```typescript
 * const tenk = TenK.fromSgmlText(sgmlContent);
 * console.log(tenk.business);        // Item 1 - Business
 * console.log(tenk.riskFactors);     // Item 1A - Risk Factors
 * console.log(tenk['Item 1']);       // Also works
 * console.log(tenk['1']);            // Short format
 * ```
 */
export class TenK extends BaseReport {
  readonly form = '10-K';
  readonly sectionToItem = SECTION_TO_ITEM;
  readonly itemToSection = ITEM_TO_SECTION;

  /**
   * Create TenK from SGML text.
   */
  static fromSgmlText(text: string): TenK {
    const sgml = FilingSGML.fromText(text);
    return new TenK({ sgml });
  }

  /**
   * Create TenK from SGML file or URL.
   */
  static async fromSource(source: string): Promise<TenK> {
    const sgml = await FilingSGML.fromSource(source);
    return new TenK({ sgml });
  }

  /**
   * Create TenK from HTML content.
   */
  static fromHtml(html: string): TenK {
    return new TenK({ html });
  }

  // ===============================
  // Part I Sections
  // ===============================

  /** Item 1 - Business */
  get business(): string | null {
    return this.getSection('business') || this.getSection('item_1');
  }

  /** Item 1A - Risk Factors */
  get riskFactors(): string | null {
    return this.getSection('risk_factors') || this.getSection('item_1a');
  }

  /** Item 1B - Unresolved Staff Comments */
  get unresolvedStaffComments(): string | null {
    return this.getSection('unresolved_staff_comments') || this.getSection('item_1b');
  }

  /** Item 1C - Cybersecurity */
  get cybersecurity(): string | null {
    return this.getSection('cybersecurity') || this.getSection('item_1c');
  }

  /** Item 2 - Properties */
  get properties(): string | null {
    return this.getSection('properties') || this.getSection('item_2');
  }

  /** Item 3 - Legal Proceedings */
  get legalProceedings(): string | null {
    return this.getSection('legal_proceedings') || this.getSection('item_3');
  }

  /** Item 4 - Mine Safety Disclosures */
  get mineSafety(): string | null {
    return this.getSection('mine_safety') || this.getSection('item_4');
  }

  // ===============================
  // Part II Sections
  // ===============================

  /** Item 7 - Management's Discussion and Analysis */
  get mda(): string | null {
    return this.getSection('mda') || this.getSection('item_7');
  }

  /** Item 7A - Market Risk Disclosures */
  get marketRisk(): string | null {
    return this.getSection('market_risk') || this.getSection('item_7a');
  }

  /** Item 8 - Financial Statements */
  get financialStatements(): string | null {
    return this.getSection('financial_statements') || this.getSection('item_8');
  }

  /** Item 9A - Controls and Procedures */
  get controlsAndProcedures(): string | null {
    return this.getSection('controls_and_procedures') || this.getSection('item_9a');
  }

  // ===============================
  // Part III Sections
  // ===============================

  /** Item 10 - Directors and Executive Officers */
  get directors(): string | null {
    return this.getSection('directors') || this.getSection('item_10');
  }

  /** Item 11 - Executive Compensation */
  get executiveCompensation(): string | null {
    return this.getSection('executive_compensation') || this.getSection('item_11');
  }

  /** Item 12 - Security Ownership */
  get securityOwnership(): string | null {
    return this.getSection('security_ownership') || this.getSection('item_12');
  }

  /** Item 13 - Related Party Transactions */
  get relatedPartyTransactions(): string | null {
    return this.getSection('related_party_transactions') || this.getSection('item_13');
  }

  /** Item 14 - Principal Accountant Fees */
  get principalAccountant(): string | null {
    return this.getSection('principal_accountant') || this.getSection('item_14');
  }

  // ===============================
  // Part IV Sections
  // ===============================

  /** Item 15 - Exhibits and Financial Statement Schedules */
  get exhibits(): string | null {
    return this.getSection('exhibits') || this.getSection('item_15');
  }

  /** Item 16 - Form 10-K Summary */
  get form10kSummary(): string | null {
    return this.getSection('form_10k_summary') || this.getSection('item_16');
  }
}
