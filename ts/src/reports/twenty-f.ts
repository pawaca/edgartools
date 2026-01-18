/**
 * TwentyF - 20-F Annual Report class for foreign private issuers.
 *
 * Provides convenient access to 20-F specific sections and data.
 * Mirrors Python's edgar/company_reports/twenty_f.py implementation.
 */

import type { Section } from '../types/section.js';
import { FilingSGML } from '../sgml/filing-sgml.js';
import { BaseReport, type ReportOptions, type SectionNameMapping } from './base.js';

/**
 * 20-F Section to Item mapping.
 */
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
  principal_accountant_fees: 'Item 16C',
  audit_committee_exemptions: 'Item 16D',
  equity_purchases: 'Item 16E',
  accountant_change: 'Item 16F',
  corporate_governance: 'Item 16G',
  mine_safety: 'Item 16H',
  foreign_jurisdiction_disclosure: 'Item 16I',
  insider_trading_policies: 'Item 16J',
  cybersecurity: 'Item 16K',
  // Part V
  financial_statements_17: 'Item 17',
  financial_statements_18: 'Item 18',
  exhibits: 'Item 19',
};

/**
 * 20-F Item to Section mapping (reverse).
 */
const ITEM_TO_SECTION: SectionNameMapping = Object.fromEntries(
  Object.entries(SECTION_TO_ITEM).map(([k, v]) => [v, k])
);

/**
 * 20-F Annual Report for Foreign Private Issuers.
 *
 * 20-F filings have 5 parts (I-V) with Items 1-19, plus sub-items 16A-16K.
 *
 * Usage:
 * ```typescript
 * const twentyf = TwentyF.fromSgmlText(sgmlContent);
 * console.log(twentyf.keyInformation);      // Item 3 - Key Information
 * console.log(twentyf.business);            // Item 4 - Information on the Company
 * console.log(twentyf.operatingReview);     // Item 5 - Operating and Financial Review
 * console.log(twentyf['Item 3']);           // Also works
 * console.log(twentyf['3']);                // Short format
 * ```
 */
export class TwentyF extends BaseReport {
  readonly form = '20-F';
  readonly sectionToItem = SECTION_TO_ITEM;
  readonly itemToSection = ITEM_TO_SECTION;

  constructor(options: ReportOptions) {
    super(options);
    // Validate form type
    const form = this._sgml?.form || '';
    if (form && !['20-F', '20-F/A'].includes(form)) {
      throw new Error(`Expected 20-F form but got ${form}`);
    }
  }

  /**
   * Create TwentyF from SGML text.
   */
  static fromSgmlText(text: string): TwentyF {
    const sgml = FilingSGML.fromText(text);
    return new TwentyF({ sgml });
  }

  /**
   * Create TwentyF from SGML file or URL.
   */
  static async fromSource(source: string): Promise<TwentyF> {
    const sgml = await FilingSGML.fromSource(source);
    return new TwentyF({ sgml });
  }

  /**
   * Create TwentyF from HTML content.
   */
  static fromHtml(html: string): TwentyF {
    return new TwentyF({ html });
  }

  /**
   * Override findSection to support 5-part lookup for 20-F.
   *
   * 20-F items are distributed across 5 parts:
   * - Part I: Items 1-4A
   * - Part II: Items 5-9
   * - Part III: Items 10-12
   * - Part IV: Items 13-16 (including 16A-16K)
   * - Part V: Items 17-19
   */
  protected override findSection(key: string): Section | undefined {
    // First try the parent class implementation
    const parentResult = super.findSection(key);
    if (parentResult) {
      return parentResult;
    }

    // Extract item number from key
    const normalized = key.trim().toLowerCase();
    const itemMatch = normalized.match(/^(?:item\s*)?(\d+[a-k]?)$/i);

    if (itemMatch) {
      const itemNum = itemMatch[1].toLowerCase();

      // Try part-prefixed keys (TOC-based detection uses these)
      // 20-F has Parts I-V
      for (const part of ['i', 'ii', 'iii', 'iv', 'v']) {
        const partKey = `part_${part}_item_${itemNum}`;
        if (this.sections.has(partKey)) {
          return this.sections.get(partKey);
        }
      }

      // Try with "Item X" format (uppercase friendly key)
      const friendlyKey = `Item ${itemNum.toUpperCase()}`;
      if (this.sections.has(friendlyKey)) {
        return this.sections.get(friendlyKey);
      }
    }

    return undefined;
  }

  // ===============================
  // String representation
  // ===============================

  toString(): string {
    return `TwentyF('${this.company}')`;
  }

  // ===============================
  // Part I Sections
  // ===============================

  /** Item 1 - Identity of Directors, Senior Management and Advisers */
  get identityOfDirectors(): string | null {
    return this.getSection('Item 1');
  }

  /** Item 2 - Offer Statistics and Expected Timetable */
  get offerStatistics(): string | null {
    return this.getSection('Item 2');
  }

  /** Item 3 - Key Information (includes risk factors and selected financial data) */
  get keyInformation(): string | null {
    return this.getSection('Item 3');
  }

  /** Item 3 - Key Information (alias for keyInformation, contains risk factors) */
  get riskFactors(): string | null {
    return this.getSection('Item 3');
  }

  /** Item 4 - Information on the Company (business overview, operations, properties) */
  get business(): string | null {
    return this.getSection('Item 4');
  }

  /** Item 4 - Information on the Company (alias for business) */
  get companyInformation(): string | null {
    return this.getSection('Item 4');
  }

  /** Item 4A - Unresolved Staff Comments */
  get unresolvedStaffComments(): string | null {
    return this.getSection('Item 4A');
  }

  // ===============================
  // Part II Sections
  // ===============================

  /** Item 5 - Operating and Financial Review and Prospects (similar to MD&A) */
  get operatingReview(): string | null {
    return this.getSection('Item 5');
  }

  /** Item 5 - Operating and Financial Review (alias for operatingReview) */
  get managementDiscussion(): string | null {
    return this.getSection('Item 5');
  }

  /** Item 6 - Directors, Senior Management and Employees */
  get directorsAndEmployees(): string | null {
    return this.getSection('Item 6');
  }

  /** Item 7 - Major Shareholders and Related Party Transactions */
  get majorShareholders(): string | null {
    return this.getSection('Item 7');
  }

  /** Item 8 - Financial Information */
  get financialInformation(): string | null {
    return this.getSection('Item 8');
  }

  /** Item 9 - The Offer and Listing */
  get offerAndListing(): string | null {
    return this.getSection('Item 9');
  }

  // ===============================
  // Part III Sections
  // ===============================

  /** Item 10 - Additional Information */
  get additionalInformation(): string | null {
    return this.getSection('Item 10');
  }

  /** Item 11 - Quantitative and Qualitative Disclosures About Market Risk */
  get marketRisk(): string | null {
    return this.getSection('Item 11');
  }

  /** Item 12 - Description of Securities Other Than Equity Securities */
  get securitiesDescription(): string | null {
    return this.getSection('Item 12');
  }

  // ===============================
  // Part IV Sections
  // ===============================

  /** Item 13 - Defaults, Dividend Arrearages and Delinquencies */
  get defaults(): string | null {
    return this.getSection('Item 13');
  }

  /** Item 14 - Material Modifications to the Rights of Security Holders */
  get materialModifications(): string | null {
    return this.getSection('Item 14');
  }

  /** Item 15 - Controls and Procedures */
  get controlsAndProcedures(): string | null {
    return this.getSection('Item 15');
  }

  /** Item 16 - [Reserved] or Various Disclosures */
  get variousDisclosures(): string | null {
    return this.getSection('Item 16');
  }

  // ===============================
  // Item 16 Sub-items (A through K)
  // ===============================

  /** Item 16A - Audit Committee Financial Expert */
  get auditCommitteeExpert(): string | null {
    return this.getSection('Item 16A');
  }

  /** Item 16B - Code of Ethics */
  get codeOfEthics(): string | null {
    return this.getSection('Item 16B');
  }

  /** Item 16C - Principal Accountant Fees and Services */
  get principalAccountantFees(): string | null {
    return this.getSection('Item 16C');
  }

  /** Item 16D - Exemptions from the Listing Standards for Audit Committees */
  get auditCommitteeExemptions(): string | null {
    return this.getSection('Item 16D');
  }

  /** Item 16E - Purchases of Equity Securities by the Issuer */
  get equityPurchases(): string | null {
    return this.getSection('Item 16E');
  }

  /** Item 16F - Change in Registrant's Certifying Accountant */
  get accountantChange(): string | null {
    return this.getSection('Item 16F');
  }

  /** Item 16G - Corporate Governance */
  get corporateGovernance(): string | null {
    return this.getSection('Item 16G');
  }

  /** Item 16H - Mine Safety Disclosure */
  get mineSafety(): string | null {
    return this.getSection('Item 16H');
  }

  /** Item 16I - Disclosure Regarding Foreign Jurisdictions That Prevent Inspections */
  get foreignJurisdictionDisclosure(): string | null {
    return this.getSection('Item 16I');
  }

  /** Item 16J - Insider Trading Policies */
  get insiderTradingPolicies(): string | null {
    return this.getSection('Item 16J');
  }

  /** Item 16K - Cybersecurity */
  get cybersecurity(): string | null {
    return this.getSection('Item 16K');
  }

  // ===============================
  // Part V Sections
  // ===============================

  /** Item 17 - Financial Statements */
  get financialStatements17(): string | null {
    return this.getSection('Item 17');
  }

  /** Item 18 - Financial Statements */
  get financialStatements18(): string | null {
    return this.getSection('Item 18');
  }

  /** Item 19 - Exhibits */
  get exhibits(): string | null {
    return this.getSection('Item 19');
  }
}
