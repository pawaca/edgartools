/**
 * EightK - 8-K Current Report class.
 *
 * Key difference from 10-K: Uses decimal item numbering (1.01, 2.02, etc.)
 * and requires normalization for Apple-style spacing ("Item 2. 02" -> "2.02").
 *
 * Ported from Python: edgar/company_reports/current_report.py
 */

import type { Section } from '../types/section.js';
import { FilingSGML } from '../sgml/filing-sgml.js';
import { BaseReport, type SectionNameMapping, type ReportOptions } from './base.js';

// ===============================
// Item Normalization Functions
// ===============================

/**
 * Normalize 8-K item number.
 * Handles:
 * - "Item 2.02" -> "2.02"
 * - "Item 2. 02" -> "2.02" (Apple-style spacing)
 * - "ITEM 2.02" -> "2.02" (case variation)
 * - "Item 2" -> "2" (legacy single-digit)
 *
 * Ported from Python: _normalize_item_number()
 */
export function normalizeItemNumber(itemStr: string): string {
  // Remove "Item" prefix (case insensitive)
  let cleaned = itemStr.toLowerCase().trim().replace(/^item\s+/i, '');

  // Remove spaces around dots: "2. 02" -> "2.02"
  cleaned = cleaned.replace(/\s*\.\s*/g, '.');

  // Remove trailing dots: "2.02." -> "2.02"
  cleaned = cleaned.replace(/\.$/, '');

  return cleaned;
}

/**
 * Format normalized item number for display (e.g., '2.02' -> 'Item 2.02').
 *
 * Ported from Python: _format_item_for_display()
 */
function formatItemForDisplay(itemNum: string): string {
  return `Item ${itemNum}`;
}

/**
 * Extract 8-K item numbers from filing text using pattern matching.
 *
 * This is a fallback extraction method for legacy SGML filings (1999-2001)
 * where SEC metadata is incomplete. Research validated 100% accuracy across
 * all filing eras on filing.text().
 *
 * Pattern matches:
 * - Modern: "Item 2.02", "ITEM 2.02", "Item 2. 02"
 * - Legacy: "Item 1", "Item 4"
 * - Case insensitive, handles line breaks
 *
 * Handles range notation (e.g., "Item 1-Item 4") by only including items
 * that have actual standalone headers.
 *
 * Ported from Python: _extract_items_from_text()
 */
export function extractItemsFromText(text: string): string[] {
  // Pattern matches "Item X" or "Item X.XX" at start of line
  // This will match:
  // - "Item 1" (standalone)
  // - "Item 1-Item 4" (only Item 1, since it's at line start)
  // - "Item 2.02" (modern format)
  //
  // This will NOT match:
  // - "  Item 1" (indented, not at line start)
  // - "Item 1-Item 4" (Item 4, not at line start)
  // - Mid-sentence references to items
  const pattern = /^Item\s+(\d+\.?\s*\d*)/gim;
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1]);
  }

  // Normalize and deduplicate
  const items: string[] = [];
  const seen = new Set<string>();

  for (const rawMatch of matches) {
    const normalized = normalizeItemNumber(rawMatch);
    if (normalized && !seen.has(normalized)) {
      items.push(normalized);
      seen.add(normalized);
    }
  }

  // Sort items
  return items.sort((a, b) => {
    const numA = parseFloat(a) || parseInt(a, 10);
    const numB = parseFloat(b) || parseInt(b, 10);
    return numA - numB;
  });
}

/**
 * Extract content for a specific item from legacy SGML filing text.
 *
 * This is a fallback extraction method for legacy SGML filings (1999-2001)
 * where HTML is unavailable but text content exists.
 *
 * Handles:
 * - Input normalization: "Item 9", "9", "item 9" -> "Item 9"
 * - Flexible item headers: "Item 9", "Item 9.", "Item 9:", etc.
 * - End detection: next item or SIGNATURES section
 *
 * Ported from Python: _extract_item_content_from_text()
 */
export function extractItemContentFromText(
  filingText: string,
  itemName: string
): string | null {
  // Step 1: Normalize input to extract item number
  const itemNum = normalizeItemNumber(itemName);
  if (!itemNum) {
    return null;
  }

  // Step 2: Find item header in text
  // Pattern matches: "Item 9", "Item 9.", "Item 9:", "Item 9.02", etc.
  // Must be at start of line (^) to avoid false positives
  const escapedItemNum = itemNum.replace(/\./g, '\\.');
  const itemPattern = new RegExp(
    `^(Item\\s+${escapedItemNum}[\\s\\.:\\-]*)`,
    'im'
  );

  const match = itemPattern.exec(filingText);
  if (!match) {
    return null;
  }

  const startPos = match.index;

  // Step 3: Find end position
  // Look for next "Item X" pattern
  const nextItemPattern = /^Item\s+\d+\.?\s*\d*[\s\.:\-]/gim;
  nextItemPattern.lastIndex = startPos + match[0].length;
  const nextMatch = nextItemPattern.exec(filingText);

  let endPos: number;
  if (nextMatch) {
    endPos = nextMatch.index;
  } else {
    // Look for SIGNATURES section
    const sigPattern = /\n\s*SIGNATURES?\s*\n/i;
    const sigMatch = sigPattern.exec(filingText.slice(startPos));
    if (sigMatch) {
      endPos = startPos + sigMatch.index;
    } else {
      endPos = filingText.length;
    }
  }

  // Step 4: Extract and clean content
  const content = filingText.slice(startPos, endPos).trim();
  return content || null;
}

/**
 * Convert decimal item to key format: "2.02" -> "item_202"
 */
function itemToKey(itemNum: string): string {
  const normalized = normalizeItemNumber(itemNum);
  return `item_${normalized.replace('.', '')}`;
}

// ===============================
// 8-K Structure Definition
// ===============================

/**
 * Full 8-K filing structure with all 33 items.
 * Ported from Python: CurrentReport.structure
 */
export const EIGHT_K_STRUCTURE: Record<
  string,
  { title: string; description: string }
> = {
  'ITEM 1.01': {
    title: 'Entry into a Material Definitive Agreement',
    description:
      'Reports any material agreement not made in the ordinary course of business.',
  },
  'ITEM 1.02': {
    title: 'Termination of a Material Definitive Agreement',
    description: 'Reports the termination of any material agreement.',
  },
  'ITEM 1.03': {
    title: 'Bankruptcy or Receivership',
    description: 'Reports any bankruptcy or receivership.',
  },
  'ITEM 1.04': {
    title: 'Mine Safety - Reporting of Shutdowns and Patterns of Violations',
    description: 'Reports mine safety violations and shutdowns.',
  },
  'ITEM 1.05': {
    title: 'Material Cybersecurity Incidents',
    description: 'Reports material cybersecurity incidents.',
  },
  'ITEM 2.01': {
    title: 'Completion of Acquisition or Disposition of Assets',
    description:
      'Reports the completion of an acquisition or disposition of a significant amount of assets.',
  },
  'ITEM 2.02': {
    title: 'Results of Operations and Financial Condition',
    description:
      "Reports on the company's results of operations and financial condition.",
  },
  'ITEM 2.03': {
    title:
      'Creation of a Direct Financial Obligation or an Obligation under an Off-Balance Sheet Arrangement of a Registrant',
    description: 'Reports the creation of a direct financial obligation.',
  },
  'ITEM 2.04': {
    title:
      'Triggering Events That Accelerate or Increase a Direct Financial Obligation or an Obligation under an Off-Balance Sheet Arrangement',
    description: 'Reports any triggering events.',
  },
  'ITEM 2.05': {
    title: 'Costs Associated with Exit or Disposal Activities',
    description: 'Reports costs related to exit or disposal activities.',
  },
  'ITEM 2.06': {
    title: 'Material Impairments',
    description: 'Reports on any material impairments.',
  },
  'ITEM 3.01': {
    title:
      'Notice of Delisting or Failure to Satisfy a Continued Listing Rule or Standard; Transfer of Listing',
    description: 'Reports on delisting or failure to satisfy listing rules.',
  },
  'ITEM 3.02': {
    title: 'Unregistered Sales of Equity Securities',
    description: 'Reports on the sale of unregistered equity securities.',
  },
  'ITEM 3.03': {
    title: 'Material Modification to Rights of Security Holders',
    description:
      'Reports on any modifications to the rights of security holders.',
  },
  'ITEM 4.01': {
    title: "Changes in Registrant's Certifying Accountant",
    description: "Reports any change in the company's accountant.",
  },
  'ITEM 4.02': {
    title:
      'Non-Reliance on Previously Issued Financial Statements or a Related Audit Report or Completed Interim Review',
    description:
      'Reports on non-reliance on previously issued financial statements.',
  },
  'ITEM 5.01': {
    title: 'Changes in Control of Registrant',
    description: 'Reports changes in control of the company.',
  },
  'ITEM 5.02': {
    title:
      'Departure of Directors or Certain Officers; Election of Directors; Appointment of Certain Officers',
    description:
      "Compensatory Arrangements of Certain Officers: Reports any changes in the company's directors or certain officers.",
  },
  'ITEM 5.03': {
    title:
      'Amendments to Articles of Incorporation or Bylaws; Change in Fiscal Year',
    description:
      'Reports on amendments to articles of incorporation or bylaws.',
  },
  'ITEM 5.04': {
    title:
      "Temporary Suspension of Trading Under Registrant's Employee Benefit Plans",
    description:
      "Reports on the temporary suspension of trading under the company's employee benefit plans.",
  },
  'ITEM 5.05': {
    title:
      "Amendment to the Registrant's Code of Ethics, or Waiver of a Provision of the Code of Ethics",
    description: 'Reports on amendments or waivers to the code of ethics.',
  },
  'ITEM 5.06': {
    title: 'Change in Shell Company Status',
    description: "Reports a change in the company's shell company status.",
  },
  'ITEM 5.07': {
    title: 'Submission of Matters to a Vote of Security Holders',
    description: 'Reports on matters submitted to a vote of security holders.',
  },
  'ITEM 5.08': {
    title: 'Shareholder Director Nominations',
    description: 'Reports on shareholder director nominations.',
  },
  'ITEM 6.01': {
    title: 'ABS Informational and Computational Material',
    description: 'Reports ABS informational and computational material.',
  },
  'ITEM 6.02': {
    title: 'Change of Servicer or Trustee',
    description: 'Reports on the change of servicer or trustee.',
  },
  'ITEM 6.03': {
    title: 'Change in Credit Enhancement or Other External Support',
    description:
      'Reports on changes in credit enhancement or external support.',
  },
  'ITEM 6.04': {
    title: 'Failure to Make a Required Distribution',
    description: 'Reports on the failure to make a required distribution.',
  },
  'ITEM 6.05': {
    title: 'Securities Act Updating Disclosure',
    description: 'Reports on Securities Act updating disclosure.',
  },
  'ITEM 7.01': {
    title: 'Regulation FD Disclosure',
    description: 'Reports information under Regulation FD.',
  },
  'ITEM 8.01': {
    title: 'Other Events',
    description:
      'Reports other events that the registrant deems of importance to security holders.',
  },
  'ITEM 9.01': {
    title: 'Financial Statements and Exhibits',
    description:
      'Reports financial statements and other exhibits related to the events reported in the 8-K.',
  },
};

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
  item_105: '1.05',
  cybersecurity_incidents: '1.05',

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
 * Also known as CurrentReport in Python. Handles both 8-K and 6-K filings.
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
 *
 * // Multi-tier fallback for items list
 * console.log(eightk.items);  // ['Item 2.02', 'Item 9.01']
 *
 * // Date of report
 * console.log(eightk.dateOfReport);  // "January 15, 2024"
 * ```
 *
 * Ported from Python: edgar/company_reports/current_report.py
 */
export class EightK extends BaseReport {
  readonly form: string;
  readonly sectionToItem = SECTION_TO_ITEM;
  readonly itemToSection = ITEM_TO_SECTION;

  /** Full 8-K structure with all items */
  static readonly structure = EIGHT_K_STRUCTURE;

  /** Cached filing text for performance */
  private _cachedFilingText: string | null = null;

  constructor(options: ReportOptions) {
    super(options);

    // Support 8-K, 8-K/A, 6-K, 6-K/A forms
    const form = this._sgml?.form || '8-K';
    if (!['8-K', '8-K/A', '6-K', '6-K/A'].includes(form)) {
      console.warn(`Unexpected form type for EightK: ${form}`);
    }
    this.form = form;
  }

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

  // ===============================
  // Text Caching
  // ===============================

  /**
   * Get filing text with caching to avoid redundant extraction.
   * Ported from Python: _get_filing_text()
   */
  private getFilingText(): string | null {
    if (this._cachedFilingText === null) {
      try {
        // Try to get text from document or SGML
        if (this.document) {
          this._cachedFilingText = this.document.text();
        } else if (this._sgml) {
          const html = this._sgml.html();
          if (html) {
            // Strip HTML tags for basic text extraction
            this._cachedFilingText = html
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          }
        }
      } catch {
        return null;
      }
    }
    return this._cachedFilingText;
  }

  // ===============================
  // Multi-tier Fallback Strategy
  // ===============================

  /**
   * Override findSection for 8-K decimal normalization with text-based fallback.
   *
   * Uses multi-tier fallback strategy:
   * 1. New parser's section detection (95% accuracy for modern filings)
   * 2. Text-based pattern extraction (100% accuracy, all eras including SGML)
   *
   * Ported from Python: __getitem__()
   */
  protected override findSection(key: string): Section | undefined {
    // Strategy 1: Try base class lookup and normalization
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
    for (const [, section] of this.sections) {
      if (section.item === normalized) {
        return section;
      }
    }

    return undefined;
  }

  /**
   * Get section/item text by name or number with text-based fallback.
   *
   * Supports multiple lookup formats:
   * - Section key: 'item_502'
   * - Item number: 'Item 5.02', '5.02'
   * - Natural language: 'Item 5.02 - Departure of Directors'
   *
   * Falls back to text-based extraction for legacy SGML filings.
   *
   * @override
   */
  override getSection(key: string): string | null {
    // Strategy 1: Try document-based lookup
    const result = super.getSection(key);
    if (result !== null) {
      return result;
    }

    // Strategy 2: Text-based fallback for legacy SGML filings
    const filingText = this.getFilingText();
    if (filingText) {
      const content = extractItemContentFromText(filingText, key);
      if (content) {
        return content;
      }
    }

    return null;
  }

  /**
   * List of detected item names.
   *
   * Uses multi-tier fallback strategy:
   * 1. New parser's section detection (95% accuracy for modern filings)
   * 2. Text-based pattern extraction (100% accuracy, all eras including SGML)
   *
   * Ported from Python: items property
   *
   * @override
   */
  override get items(): string[] {
    // Strategy 1: Try document parser first (95% detection rate)
    if (this.sections.size > 0) {
      const itemPattern = /Item\s+\d+\.\s*\d+/i;
      const items: string[] = [];

      for (const [, section] of this.sections) {
        const match = itemPattern.exec(section.title);
        if (match) {
          items.push(match[0]);
        } else if (section.item) {
          items.push(formatItemForDisplay(section.item));
        }
      }

      if (items.length > 0) {
        return items;
      }
    }

    // Strategy 2: Text-based fallback for legacy SGML filings
    const filingText = this.getFilingText();
    if (filingText) {
      const extractedItems = extractItemsFromText(filingText);
      if (extractedItems.length > 0) {
        return extractedItems.map(formatItemForDisplay);
      }
    }

    return [];
  }

  // ===============================
  // Date of Report
  // ===============================

  /**
   * Return the period of report for this filing.
   * Formats the date as "Month DD, YYYY" (e.g., "January 15, 2024").
   *
   * Ported from Python: date_of_report property
   */
  get dateOfReport(): string {
    const periodOfReport = this._sgml?.periodOfReport;
    if (periodOfReport) {
      try {
        // Parse YYYY-MM-DD format
        const date = new Date(periodOfReport);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
      } catch {
        // Ignore parsing errors
      }
    }
    return '';
  }

  // ===============================
  // Press Release Detection
  // ===============================

  /**
   * Check if this filing has press releases attached.
   *
   * Note: This is a stub implementation. Full press release parsing
   * will be implemented in TASK_PRESS_RELEASE.
   *
   * Ported from Python: has_press_release property
   */
  get hasPressRelease(): boolean {
    return this.pressReleases !== null;
  }

  /**
   * Get press release attachments.
   *
   * Returns attachments that match press release criteria:
   * - HTML documents
   * - Named as "RELEASE" in description
   * - Document type EX-99, EX-99.1, or EX-99.01
   *
   * Note: Returns raw attachment info. Full PressReleases class
   * will be implemented in TASK_PRESS_RELEASE.
   *
   * Ported from Python: press_releases property
   */
  get pressReleases(): { document: string; type: string; description: string }[] | null {
    if (!this._sgml) {
      return null;
    }

    const attachments = this._sgml.attachments;
    const releaseAttachments: { document: string; type: string; description: string }[] = [];

    for (const attachment of attachments) {
      const document = attachment.document?.toLowerCase() || '';
      const docType = attachment.documentType || '';
      const description = attachment.description?.toUpperCase() || '';

      // Check criteria:
      // 1. HTML document
      // 2. Named release OR type is EX-99.x
      const isHtml = document.endsWith('.htm') || document.endsWith('.html');
      const isNamedRelease = description.includes('RELEASE');
      const isEx99 = ['EX-99.1', 'EX-99', 'EX-99.01'].includes(docType);

      if (isHtml && (isNamedRelease || isEx99)) {
        releaseAttachments.push({
          document: attachment.document || '',
          type: docType,
          description: attachment.description || '',
        });
      }
    }

    return releaseAttachments.length > 0 ? releaseAttachments : null;
  }

  // ===============================
  // Text Content
  // ===============================

  /**
   * Get the text of the EightK filing including exhibits.
   *
   * Ported from Python: text() method
   *
   * Note: This is a simplified implementation. Full exhibit content
   * rendering with Rich formatting is not ported (Python-specific).
   *
   * @override
   */
  override get text(): string {
    const parts: string[] = [];

    // Add main document text (using document directly instead of super.text)
    const mainText = this.document?.text() || '';
    if (mainText) {
      parts.push(mainText);
    }

    // Add exhibit content
    if (this._sgml) {
      for (const attachment of this._sgml.attachments) {
        // Skip the main document and binary files
        if (attachment.sequence === 1) continue;
        const doc = attachment.document?.toLowerCase() || '';
        if (
          doc.endsWith('.jpg') ||
          doc.endsWith('.png') ||
          doc.endsWith('.gif') ||
          doc.endsWith('.pdf')
        ) {
          continue;
        }

        const content = attachment.content;
        if (content) {
          parts.push(`\n\n--- Exhibit ${attachment.documentType} ---\n`);
          // Strip HTML if present
          const textContent = content
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          parts.push(textContent);
        }
      }
    }

    return parts.join('\n');
  }

  // ===============================
  // String Representation
  // ===============================

  /**
   * String representation of the filing.
   */
  toString(): string {
    return `${this.company} ${this.form} ${this.dateOfReport}`;
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

  /** Item 1.04 - Mine Safety */
  get mineSafety(): string | null {
    return this.getSection('item_104');
  }

  /** Item 1.05 - Material Cybersecurity Incidents */
  get cybersecurityIncidents(): string | null {
    return this.getSection('item_105');
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

  /** Item 2.04 - Triggering Events */
  get triggeringEvents(): string | null {
    return this.getSection('item_204');
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
  // Section 3 - Securities
  // ===============================

  /** Item 3.01 - Notice of Delisting */
  get delisting(): string | null {
    return this.getSection('item_301');
  }

  /** Item 3.02 - Unregistered Sales of Equity Securities */
  get unregisteredSales(): string | null {
    return this.getSection('item_302');
  }

  /** Item 3.03 - Material Modification to Rights of Security Holders */
  get materialModification(): string | null {
    return this.getSection('item_303');
  }

  // ===============================
  // Section 4 - Accountants
  // ===============================

  /** Item 4.01 - Changes in Registrant's Certifying Accountant */
  get changesInAccountant(): string | null {
    return this.getSection('item_401');
  }

  /** Item 4.02 - Non-Reliance on Previously Issued Financial Statements */
  get nonRelianceAudit(): string | null {
    return this.getSection('item_402');
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

  /** Item 5.04 - Temporary Suspension of Trading */
  get temporaryTradingSuspension(): string | null {
    return this.getSection('item_504');
  }

  /** Item 5.05 - Code of Ethics Amendment */
  get codeOfEthics(): string | null {
    return this.getSection('item_505');
  }

  /** Item 5.06 - Change in Shell Company Status */
  get shellCompanyChange(): string | null {
    return this.getSection('item_506');
  }

  /** Item 5.07 - Submission of Matters to a Vote of Security Holders */
  get shareholderVote(): string | null {
    return this.getSection('item_507');
  }

  /** Item 5.08 - Shareholder Director Nominations */
  get shareholderDirectorNominations(): string | null {
    return this.getSection('item_508');
  }

  // ===============================
  // Section 6 - ABS
  // ===============================

  /** Item 6.01 - ABS Informational and Computational Material */
  get absInfo(): string | null {
    return this.getSection('item_601');
  }

  /** Item 6.02 - Change of Servicer or Trustee */
  get absChange(): string | null {
    return this.getSection('item_602');
  }

  /** Item 6.03 - Change in Credit Enhancement */
  get absCreditEnhancement(): string | null {
    return this.getSection('item_603');
  }

  /** Item 6.04 - Failure to Make a Required Distribution */
  get absFailure(): string | null {
    return this.getSection('item_604');
  }

  /** Item 6.05 - Securities Act Updating Disclosure */
  get absSecuritiesAct(): string | null {
    return this.getSection('item_605');
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

/**
 * SixK is an alias for EightK (CurrentReport).
 * Both 6-K and 8-K filings use the same structure and parsing logic.
 *
 * Ported from Python: SixK = CurrentReport
 */
export { EightK as SixK };

/**
 * CurrentReport is an alias for EightK.
 * This matches the Python naming convention.
 */
export { EightK as CurrentReport };
