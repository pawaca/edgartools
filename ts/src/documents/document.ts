/**
 * Document implementation.
 */

import type {
  Document,
  DocumentMetadata,
  TextExtractionOptions,
  SearchResult,
  ParserConfig,
} from '../types/document.js';
import type {
  Section,
  Sections,
  DetectionMethod,
} from '../types/section.js';
import type { IDocumentNode, IHeadingNode, ITableNode, INode } from '../types/nodes.js';

/**
 * Section implementation.
 */
class SectionImpl implements Section {
  name: string;
  title: string;
  startNode?: INode;
  endNode?: INode;
  confidence: number;
  detectionMethod: DetectionMethod;
  private _text?: string;
  private _textFn?: () => string;

  constructor(options: {
    name: string;
    title: string;
    startNode?: INode;
    endNode?: INode;
    confidence: number;
    detectionMethod: DetectionMethod;
    textFn?: () => string;
  }) {
    this.name = options.name;
    this.title = options.title;
    this.startNode = options.startNode;
    this.endNode = options.endNode;
    this.confidence = options.confidence;
    this.detectionMethod = options.detectionMethod;
    this._textFn = options.textFn;
  }

  text(): string {
    if (this._text !== undefined) {
      return this._text;
    }

    if (this._textFn) {
      this._text = this._textFn();
      return this._text;
    }

    if (this.startNode) {
      this._text = this.startNode.text();
      return this._text;
    }

    return '';
  }
}

/**
 * Document implementation.
 */
export class DocumentImpl implements Document {
  root: IDocumentNode;
  metadata: DocumentMetadata;

  private _sections?: Sections;
  private _tables?: ITableNode[];
  private _headings?: IHeadingNode[];
  private _textCache?: string;

  // Internal reference to parser config
  _config?: ParserConfig;

  constructor(root: IDocumentNode, metadata: DocumentMetadata) {
    this.root = root;
    this.metadata = metadata;
  }

  /**
   * Get detected sections.
   */
  get sections(): Sections {
    if (!this._sections) {
      this._sections = this.detectSections();
    }
    return this._sections;
  }

  /**
   * Get all tables in document.
   */
  get tables(): ITableNode[] {
    if (!this._tables) {
      this._tables = this.root.find((node) => node.type === 'table') as ITableNode[];
    }
    return this._tables;
  }

  /**
   * Get all headings in document.
   */
  get headings(): IHeadingNode[] {
    if (!this._headings) {
      this._headings = this.root.find((node) => node.type === 'heading') as IHeadingNode[];
    }
    return this._headings;
  }

  /**
   * Check if document is empty.
   */
  get isEmpty(): boolean {
    return this.root.children.length === 0;
  }

  /**
   * Extract text from document.
   */
  text(options: TextExtractionOptions = {}): string {
    const { clean = true, includeTables = true, maxLength } = options;

    // Use cache for default options
    if (clean && includeTables && !maxLength && this._textCache) {
      return this._textCache;
    }

    let text = this.extractText(this.root, includeTables);

    if (clean) {
      text = this.cleanText(text);
    }

    if (maxLength && text.length > maxLength) {
      text = text.substring(0, maxLength);
    }

    // Cache default extraction
    if (clean && includeTables && !maxLength) {
      this._textCache = text;
    }

    return text;
  }

  /**
   * Get section by name.
   */
  getSection(name: string, part?: string): Section | null {
    // Handle part specification for 10-Q
    if (part) {
      const partNorm = part.toUpperCase();
      const itemName = name.replace(/^item_/i, '');
      const fullName = `part_${partNorm.toLowerCase()}_item_${itemName.toLowerCase()}`;
      return this.sections.get(fullName) || null;
    }

    // Direct lookup
    const section = this.sections.get(name);
    if (section) {
      return section;
    }

    // Try normalized name
    const normalized = name.toLowerCase().replace(/\s+/g, '_').replace(/[.-]/g, '_');
    return this.sections.get(normalized) || null;
  }

  /**
   * Extract text from a specific section.
   */
  extractSectionText(sectionName: string): string | null {
    const section = this.getSection(sectionName);
    return section?.text() || null;
  }

  /**
   * Search document content.
   */
  search(query: string, topK: number = 10): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    // Simple search through headings and text
    for (const heading of this.headings) {
      const content = heading.text();
      if (content.toLowerCase().includes(queryLower)) {
        results.push({
          content,
          score: 1.0,
          node: heading,
        });
      }
    }

    // Limit results
    return results.slice(0, topK);
  }

  /**
   * Detect sections in the document.
   */
  private detectSections(): Sections {
    const sections: Sections = new Map();

    // Get form type
    const form = this._config?.form || this.metadata.form;

    // Skip section detection for non-supported forms
    const baseForm = form?.replace('/A', '');
    if (!baseForm || !['10-K', '10-Q', '8-K', '20-F'].includes(baseForm)) {
      return sections;
    }

    // Use pattern-based detection
    const patterns = this.getSectionPatterns(baseForm);

    for (const heading of this.headings) {
      const text = heading.text();

      for (const [sectionName, pattern] of Object.entries(patterns)) {
        if (pattern.regex.test(text)) {
          sections.set(sectionName, new SectionImpl({
            name: sectionName,
            title: text,
            startNode: heading,
            confidence: 0.7,
            detectionMethod: 'pattern',
            textFn: () => this.extractSectionContent(heading),
          }));
          break;
        }
      }
    }

    return sections;
  }

  /**
   * Get section patterns for a form type.
   */
  private getSectionPatterns(form: string): Record<string, { regex: RegExp; title: string }> {
    const patterns: Record<string, { regex: RegExp; title: string }> = {};

    if (form === '10-K') {
      patterns['item_1'] = { regex: /^(Item|ITEM)\s+1\.?\s*[-–—.]?\s*Business/i, title: 'Item 1 - Business' };
      patterns['item_1a'] = { regex: /^(Item|ITEM)\s+1A\.?\s*[-–—.]?\s*Risk\s*Factors/i, title: 'Item 1A - Risk Factors' };
      patterns['item_1b'] = { regex: /^(Item|ITEM)\s+1B\.?\s*[-–—.]?\s*Unresolved/i, title: 'Item 1B - Unresolved Staff Comments' };
      patterns['item_2'] = { regex: /^(Item|ITEM)\s+2\.?\s*[-–—.]?\s*Properties/i, title: 'Item 2 - Properties' };
      patterns['item_3'] = { regex: /^(Item|ITEM)\s+3\.?\s*[-–—.]?\s*Legal/i, title: 'Item 3 - Legal Proceedings' };
      patterns['item_4'] = { regex: /^(Item|ITEM)\s+4\.?\s*[-–—.]?\s*Mine/i, title: 'Item 4 - Mine Safety' };
      patterns['item_5'] = { regex: /^(Item|ITEM)\s+5\.?\s*[-–—.]?\s*Market/i, title: 'Item 5 - Market for Common Equity' };
      patterns['item_6'] = { regex: /^(Item|ITEM)\s+6\.?\s*[-–—.]?\s*(Reserved|\[Reserved\])/i, title: 'Item 6 - [Reserved]' };
      patterns['item_7'] = { regex: /^(Item|ITEM)\s+7\.?\s*[-–—.]?\s*Management/i, title: 'Item 7 - MD&A' };
      patterns['item_7a'] = { regex: /^(Item|ITEM)\s+7A\.?\s*[-–—.]?\s*Quantitative/i, title: 'Item 7A - Market Risk' };
      patterns['item_8'] = { regex: /^(Item|ITEM)\s+8\.?\s*[-–—.]?\s*Financial\s*Statements/i, title: 'Item 8 - Financial Statements' };
      patterns['item_9'] = { regex: /^(Item|ITEM)\s+9\.?\s*[-–—.]?\s*Changes/i, title: 'Item 9 - Changes in Accountants' };
      patterns['item_9a'] = { regex: /^(Item|ITEM)\s+9A\.?\s*[-–—.]?\s*Controls/i, title: 'Item 9A - Controls and Procedures' };
      patterns['item_9b'] = { regex: /^(Item|ITEM)\s+9B\.?\s*[-–—.]?\s*Other/i, title: 'Item 9B - Other Information' };
      patterns['item_10'] = { regex: /^(Item|ITEM)\s+10\.?\s*[-–—.]?\s*Directors/i, title: 'Item 10 - Directors' };
      patterns['item_11'] = { regex: /^(Item|ITEM)\s+11\.?\s*[-–—.]?\s*Executive\s*Compensation/i, title: 'Item 11 - Executive Compensation' };
      patterns['item_12'] = { regex: /^(Item|ITEM)\s+12\.?\s*[-–—.]?\s*Security/i, title: 'Item 12 - Security Ownership' };
      patterns['item_13'] = { regex: /^(Item|ITEM)\s+13\.?\s*[-–—.]?\s*Certain\s*Relationships/i, title: 'Item 13 - Related Transactions' };
      patterns['item_14'] = { regex: /^(Item|ITEM)\s+14\.?\s*[-–—.]?\s*Principal/i, title: 'Item 14 - Principal Accountant Fees' };
      patterns['item_15'] = { regex: /^(Item|ITEM)\s+15\.?\s*[-–—.]?\s*Exhibits/i, title: 'Item 15 - Exhibits' };
    }

    return patterns;
  }

  /**
   * Extract content for a section starting at a heading.
   */
  private extractSectionContent(startHeading: INode): string {
    const parts: string[] = [];
    let started = false;
    let depth = 0;

    const collect = (node: INode): boolean => {
      if (node === startHeading) {
        started = true;
        depth = (node as IHeadingNode).level || 1;
        return true;
      }

      if (!started) return true;

      // Stop at next heading of same or higher level
      if (node.type === 'heading') {
        const level = (node as IHeadingNode).level || 1;
        if (level <= depth) {
          return false;
        }
      }

      const text = node.text().trim();
      if (text) {
        parts.push(text);
      }

      return true;
    };

    // Traverse document
    const traverse = (node: INode): boolean => {
      if (!collect(node)) return false;
      for (const child of node.children) {
        if (!traverse(child)) return false;
      }
      return true;
    };

    traverse(this.root);

    return parts.join('\n\n');
  }

  /**
   * Extract text from node tree.
   */
  private extractText(node: INode, includeTables: boolean): string {
    if (!includeTables && node.type === 'table') {
      return '';
    }

    return node.text();
  }

  /**
   * Clean extracted text.
   */
  private cleanText(text: string): string {
    // Collapse multiple spaces
    text = text.replace(/[ \t]+/g, ' ');

    // Collapse multiple newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    // Trim lines
    text = text
      .split('\n')
      .map((line) => line.trim())
      .join('\n');

    return text.trim();
  }
}

export { SectionImpl };
