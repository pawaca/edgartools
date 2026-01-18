/**
 * BaseReport - Abstract base class for SEC filing reports.
 *
 * Implements lazy evaluation pattern matching Python's @cached_property behavior.
 */

import type { Document } from '../types/document.js';
import type { Section, Sections } from '../types/section.js';
import { FilingSGML } from '../sgml/filing-sgml.js';
import { HTMLParser } from '../documents/parser.js';

/**
 * Mapping from friendly names to Item numbers.
 */
export interface SectionNameMapping {
  [friendlyName: string]: string; // e.g., 'business' -> 'Item 1'
}

/**
 * Options for creating a report.
 */
export interface ReportOptions {
  sgml?: FilingSGML;
  html?: string;
}

/**
 * Abstract base class for all SEC filing report types.
 *
 * Implements:
 * - Lazy document parsing (parse on first access)
 * - Multi-format section lookup
 * - Fallback mechanisms
 */
export abstract class BaseReport {
  protected _sgml?: FilingSGML;
  protected _html?: string;
  protected _document?: Document;
  protected _parsingFailed: boolean = false;

  /** Form type (e.g., '10-K', '10-Q', '8-K') */
  abstract readonly form: string;

  /** Mapping from friendly names to Item format */
  abstract readonly sectionToItem: SectionNameMapping;

  /** Mapping from Item format to friendly names */
  abstract readonly itemToSection: SectionNameMapping;

  constructor(options: ReportOptions) {
    this._sgml = options.sgml;
    this._html = options.html;
  }

  // ===============================
  // Metadata accessors
  // ===============================

  /**
   * Get company name.
   */
  get company(): string {
    return this._sgml?.header.company || this.document?.metadata.company || '';
  }

  /**
   * Get CIK.
   */
  get cik(): string {
    return this._sgml?.cik || this.document?.metadata.cik || '';
  }

  /**
   * Get filing date.
   */
  get filingDate(): string {
    return this._sgml?.filingDate || this.document?.metadata.filingDate || '';
  }

  /**
   * Get accession number.
   */
  get accessionNumber(): string {
    return this._sgml?.accessionNumber || this.document?.metadata.accessionNumber || '';
  }

  // ===============================
  // Lazy document parsing
  // ===============================

  /**
   * Get the parsed document (lazy loaded).
   * Implements Python's @cached_property pattern.
   */
  get document(): Document | undefined {
    if (!this._document && !this._parsingFailed) {
      try {
        this._document = this.parseDocument();
      } catch (error) {
        console.warn(`HTMLParser failed for ${this.form}: ${error}`);
        this._parsingFailed = true;
      }
    }
    return this._document;
  }

  /**
   * Parse the document. Override for custom parsing behavior.
   */
  protected parseDocument(): Document | undefined {
    let htmlContent = this._html;

    if (!htmlContent && this._sgml) {
      htmlContent = this._sgml.html() || undefined;
    }

    if (!htmlContent) {
      return undefined;
    }

    const parser = new HTMLParser({ form: this.form });
    return parser.parse(htmlContent);
  }

  // ===============================
  // Section access
  // ===============================

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
   * Get list of items in standard format.
   * Override in subclasses for form-specific behavior.
   */
  get items(): string[] {
    const items: string[] = [];

    for (const [key, section] of this.sections) {
      if (section.item) {
        items.push(`Item ${section.item}`);
      } else if (key in this.sectionToItem) {
        items.push(this.sectionToItem[key]);
      }
    }

    return items;
  }

  /**
   * Get a section using multi-format lookup.
   *
   * Supports:
   * - Direct key: 'item_1', 'item_1a', 'part_i_item_1'
   * - Friendly name: 'business', 'risk_factors', 'mda'
   * - Item format: 'Item 1', 'Item 1A', 'Item 7'
   * - Short format: '1', '1A', '7'
   *
   * @param key The section identifier
   * @returns The section text, or null if not found
   */
  getSection(key: string): string | null {
    const section = this.findSection(key);
    if (section) {
      return this.cleanBoundaryArtifacts(section.text());
    }
    return null;
  }

  /**
   * Find a section by key using multi-format lookup.
   */
  protected findSection(key: string): Section | undefined {
    const normalized = key.trim().toLowerCase();

    // PRIORITY 1: Direct key lookup
    if (this.sections.has(key)) {
      return this.sections.get(key);
    }

    // PRIORITY 2: Lowercase normalized key
    if (this.sections.has(normalized)) {
      return this.sections.get(normalized);
    }

    // PRIORITY 3: Underscore format (item_1, item_1a)
    const underscoreKey = normalized.replace(/\s+/g, '_').replace(/-/g, '_');
    if (this.sections.has(underscoreKey)) {
      return this.sections.get(underscoreKey);
    }

    // PRIORITY 4: Friendly name -> Item mapping
    if (normalized in this.sectionToItem) {
      const itemKey = this.sectionToItem[normalized];
      const sectionKey = itemKey.toLowerCase().replace(/\s+/g, '_');
      if (this.sections.has(sectionKey)) {
        return this.sections.get(sectionKey);
      }
    }

    // PRIORITY 5: Item format ('Item 1', 'Item 1A')
    const itemMatch = normalized.match(/^item\s+(\d+[a-z]?)$/i);
    if (itemMatch) {
      const itemNum = itemMatch[1].toLowerCase();
      const sectionKey = `item_${itemNum}`;
      if (this.sections.has(sectionKey)) {
        return this.sections.get(sectionKey);
      }

      // Try friendly name
      const itemFormat = `Item ${itemNum.toUpperCase()}`;
      if (itemFormat in this.itemToSection) {
        const friendlyKey = this.itemToSection[itemFormat];
        if (this.sections.has(friendlyKey)) {
          return this.sections.get(friendlyKey);
        }
      }
    }

    // PRIORITY 6: Short format ('1', '1A', '7')
    if (/^\d+[a-z]?$/i.test(normalized)) {
      const itemNum = normalized.toLowerCase();
      const sectionKey = `item_${itemNum}`;
      if (this.sections.has(sectionKey)) {
        return this.sections.get(sectionKey);
      }

      // Try with part prefix (for 10-Q)
      for (const part of ['i', 'ii', 'iii', 'iv']) {
        const partKey = `part_${part}_item_${itemNum}`;
        if (this.sections.has(partKey)) {
          return this.sections.get(partKey);
        }
      }
    }

    return undefined;
  }

  /**
   * Clean boundary artifacts from section text.
   * Removes page numbers, headers, footers, trailing item markers.
   */
  protected cleanBoundaryArtifacts(text: string): string {
    // 1. Remove interior page headers (page + PART + Item)
    text = text.replace(/\n\s*\d{1,3}\s*\n\s*PART\s+[IVX]+\s*\n\s*Item\s+\d+/gi, '\n\n');

    // 2. Remove trailing page footer
    text = text.replace(/\n\s*\d{1,3}\s*\n\s*PART\s+[IVX]+\s*\n\s*Item\s+\d+\s*$/gi, '');

    // 3. Remove trailing Item headers
    text = text.replace(/\n\s*Item\s+\d+[A-Za-z]?\.?\s*$/gi, '');

    // 4. Remove trailing page numbers
    text = text.replace(/\n\s*\d{1,3}\s*$/g, '');

    return text.trim();
  }

  // ===============================
  // Document accessors
  // ===============================

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
