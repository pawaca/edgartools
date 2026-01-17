/**
 * TenK - 10-K Annual Report class.
 */

import type { Document } from '../types/document.js';
import type { Sections } from '../types/section.js';
import { FilingSGML } from '../sgml/filing-sgml.js';
import { HTMLParser } from '../documents/parser.js';

export interface TenKOptions {
  sgml?: FilingSGML;
  html?: string;
}

/**
 * 10-K Annual Report.
 *
 * Provides convenient access to 10-K specific sections and data.
 */
export class TenK {
  private sgml?: FilingSGML;
  private html?: string;
  private _document?: Document;

  constructor(options: TenKOptions) {
    this.sgml = options.sgml;
    this.html = options.html;
  }

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

  /**
   * Get company name.
   */
  get company(): string {
    return this.sgml?.header.company || this.document?.metadata.company || '';
  }

  /**
   * Get CIK.
   */
  get cik(): string {
    return this.sgml?.cik || this.document?.metadata.cik || '';
  }

  /**
   * Get filing date.
   */
  get filingDate(): string {
    return this.sgml?.filingDate || this.document?.metadata.filingDate || '';
  }

  /**
   * Get accession number.
   */
  get accessionNumber(): string {
    return this.sgml?.accessionNumber || this.document?.metadata.accessionNumber || '';
  }

  /**
   * Get the parsed document.
   */
  get document(): Document | undefined {
    if (!this._document) {
      this._document = this.parseDocument();
    }
    return this._document;
  }

  /**
   * Parse the document.
   */
  private parseDocument(): Document | undefined {
    let htmlContent = this.html;

    if (!htmlContent && this.sgml) {
      htmlContent = this.sgml.html() || undefined;
    }

    if (!htmlContent) {
      return undefined;
    }

    const parser = new HTMLParser({ form: '10-K' });
    return parser.parse(htmlContent);
  }

  /**
   * Get all detected sections.
   */
  get sections(): Sections {
    return this.document?.sections || new Map();
  }

  /**
   * Get section names.
   */
  get sectionNames(): string[] {
    return Array.from(this.sections.keys());
  }

  /**
   * Get a specific section by name.
   */
  getSection(name: string): string | null {
    const section = this.sections.get(name);
    return section?.text() || null;
  }

  // ===============================
  // Convenience section accessors
  // ===============================

  /**
   * Item 1 - Business.
   */
  get business(): string | null {
    return this.getSection('item_1');
  }

  /**
   * Item 1A - Risk Factors.
   */
  get riskFactors(): string | null {
    return this.getSection('item_1a');
  }

  /**
   * Item 1B - Unresolved Staff Comments.
   */
  get unresolvedStaffComments(): string | null {
    return this.getSection('item_1b');
  }

  /**
   * Item 1C - Cybersecurity.
   */
  get cybersecurity(): string | null {
    return this.getSection('item_1c');
  }

  /**
   * Item 2 - Properties.
   */
  get properties(): string | null {
    return this.getSection('item_2');
  }

  /**
   * Item 3 - Legal Proceedings.
   */
  get legalProceedings(): string | null {
    return this.getSection('item_3');
  }

  /**
   * Item 7 - Management's Discussion and Analysis.
   */
  get mda(): string | null {
    return this.getSection('item_7');
  }

  /**
   * Item 7A - Quantitative and Qualitative Disclosures About Market Risk.
   */
  get marketRisk(): string | null {
    return this.getSection('item_7a');
  }

  /**
   * Item 8 - Financial Statements.
   */
  get financialStatements(): string | null {
    return this.getSection('item_8');
  }

  /**
   * Item 9A - Controls and Procedures.
   */
  get controlsAndProcedures(): string | null {
    return this.getSection('item_9a');
  }

  /**
   * Item 10 - Directors and Executive Officers.
   */
  get directors(): string | null {
    return this.getSection('item_10');
  }

  /**
   * Item 11 - Executive Compensation.
   */
  get executiveCompensation(): string | null {
    return this.getSection('item_11');
  }

  /**
   * Get full text of the document.
   */
  get text(): string {
    return this.document?.text() || '';
  }

  /**
   * Get all headings in the document.
   */
  get headings(): string[] {
    return this.document?.headings.map(h => h.text()) || [];
  }

  /**
   * Get document statistics.
   */
  get stats(): {
    sectionCount: number;
    headingCount: number;
    tableCount: number;
    textLength: number;
  } {
    const doc = this.document;
    return {
      sectionCount: this.sections.size,
      headingCount: doc?.headings.length || 0,
      tableCount: doc?.tables.length || 0,
      textLength: this.text.length,
    };
  }
}
