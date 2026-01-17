/**
 * DocumentBuilder - Converts HTML tree into document node tree.
 */

import type { CheerioAPI, Cheerio } from 'cheerio';
import type { Element, Text as DomText, AnyNode } from 'domhandler';
import type { ParserConfig } from '../../types/document.js';
import type { INode, Style } from '../../types/nodes.js';
import {
  DocumentNode,
  TextNode,
  HeadingNode,
  ParagraphNode,
  ContainerNode,
  TableNode,
  RowNode,
  CellNode,
  ListNode,
  ListItemNode,
  LinkNode,
  ImageNode,
  SectionNode,
} from '../nodes/index.js';

// Element classifications
const BLOCK_ELEMENTS = new Set([
  'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'hr',
  'table', 'form', 'fieldset', 'address', 'section',
  'article', 'aside', 'nav', 'header', 'footer', 'main',
]);

const INLINE_ELEMENTS = new Set([
  'span', 'a', 'em', 'strong', 'b', 'i', 'u', 's',
  'small', 'mark', 'del', 'ins', 'sub', 'sup',
  'code', 'kbd', 'var', 'samp', 'abbr', 'cite',
  'q', 'time', 'font',
  // IXBRL inline elements
  'ix:nonfraction', 'ix:footnote', 'ix:fraction',
]);

const SKIP_ELEMENTS = new Set([
  'script', 'style', 'meta', 'link', 'noscript',
  'ix:exclude',
]);

export class DocumentBuilder {
  private config: ParserConfig;
  private $: CheerioAPI;

  constructor(config: ParserConfig) {
    this.config = config;
    this.$ = null as unknown as CheerioAPI;
  }

  /**
   * Build document from parsed HTML.
   */
  build($: CheerioAPI): DocumentNode {
    this.$ = $;
    const root = new DocumentNode();

    // Find body or use root
    const body = $('body').first();
    const startElement = body.length > 0 ? body : $.root();

    // Process children
    this.processChildren(startElement, root);

    // Merge adjacent text nodes if configured
    if (this.config.mergeAdjacentNodes) {
      this.mergeAdjacentTextNodes(root);
    }

    return root;
  }

  /**
   * Process all children of an element.
   */
  private processChildren(element: Cheerio<AnyNode>, parent: INode): void {
    const children = element.contents();

    children.each((_, child) => {
      if (child.type === 'text') {
        this.processTextNode(child as DomText, parent);
      } else if (child.type === 'tag') {
        this.processElement(this.$(child as Element), parent);
      }
    });
  }

  /**
   * Process a text node.
   */
  private processTextNode(node: DomText, parent: INode): void {
    const text = node.data || '';

    if (this.config.preserveWhitespace) {
      if (text) {
        parent.addChild(new TextNode(text));
      }
    } else {
      const trimmed = text.trim();
      if (trimmed) {
        parent.addChild(new TextNode(trimmed));
      }
    }
  }

  /**
   * Process an HTML element.
   */
  private processElement(element: Cheerio<Element>, parent: INode): void {
    const tagName = element.prop('tagName')?.toLowerCase() || '';

    // Skip certain elements
    if (SKIP_ELEMENTS.has(tagName)) {
      return;
    }

    // Skip page number containers
    if (this.isPageNumberContainer(element)) {
      return;
    }

    // Extract style
    const style = this.extractStyle(element);

    // Create appropriate node
    const node = this.createNodeForElement(element, tagName, style);

    if (node) {
      parent.addChild(node);

      // Process children for container-like nodes
      if (this.shouldProcessChildren(tagName, node)) {
        this.processChildren(element, node);
      }
    } else {
      // No node created - process children with same parent
      this.processChildren(element, parent);
    }
  }

  /**
   * Create appropriate node for an HTML element.
   */
  private createNodeForElement(
    element: Cheerio<Element>,
    tagName: string,
    style: Style
  ): INode | null {
    // Headings
    if (/^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName[1], 10);
      const text = this.getElementText(element);
      if (text) {
        return new HeadingNode(text, level, style);
      }
      return null;
    }

    switch (tagName) {
      case 'p':
        return new ParagraphNode(style);

      case 'table':
        return this.processTable(element, style);

      case 'ul':
        return new ListNode(false, style);

      case 'ol':
        return new ListNode(true, style);

      case 'li':
        return new ListItemNode(style);

      case 'a': {
        const href = element.attr('href') || '';
        const title = element.attr('title');
        const text = this.getElementText(element);
        return new LinkNode(text, href, title, style);
      }

      case 'img': {
        const src = element.attr('src');
        const alt = element.attr('alt');
        const width = this.parseDimension(element.attr('width'));
        const height = this.parseDimension(element.attr('height'));
        return new ImageNode({ src, alt, width, height, style });
      }

      case 'br':
        return new TextNode('\n');

      case 'section':
      case 'article':
        return new SectionNode(undefined, style);

      case 'div':
        // Check if it's an inline element by style
        if (style.display === 'inline' || style.display === 'inline-block') {
          const text = this.getElementText(element);
          if (text) {
            return new TextNode(text, style);
          }
        }
        // Check if it contains only inline content
        if (this.isTextOnlyContainer(element)) {
          return new ParagraphNode(style);
        }
        return new ContainerNode(tagName, style);

      default:
        // Inline elements
        if (INLINE_ELEMENTS.has(tagName)) {
          const text = this.getElementText(element);
          if (text) {
            return new TextNode(text, style);
          }
          return null;
        }

        // Block elements
        if (BLOCK_ELEMENTS.has(tagName)) {
          return new ContainerNode(tagName, style);
        }

        // Unknown elements - treat as container
        return new ContainerNode(tagName, style);
    }
  }

  /**
   * Process a table element.
   */
  private processTable(element: Cheerio<Element>, style: Style): TableNode {
    const table = new TableNode(style);

    // Find all rows (in thead, tbody, tfoot, or directly in table)
    const rows = element.find('tr');

    rows.each((_, rowEl) => {
      const row = new RowNode();

      // Find cells in this row
      const cells = this.$(rowEl).find('td, th');

      cells.each((__, cellEl) => {
        const $cell = this.$(cellEl);
        const isHeader = cellEl.tagName.toLowerCase() === 'th';
        const colspan = parseInt($cell.attr('colspan') || '1', 10);
        const rowspan = parseInt($cell.attr('rowspan') || '1', 10);
        const content = $cell.text().trim();
        const cellStyle = this.extractStyle($cell);

        const cell = new CellNode(content, {
          isHeader,
          colspan,
          rowspan,
          style: cellStyle,
        });

        row.addCell(cell);
      });

      if (row.cells.length > 0) {
        table.addRow(row);
      }
    });

    return table;
  }

  /**
   * Extract style from element.
   */
  private extractStyle(element: Cheerio<Element>): Style {
    const style: Style = {};

    // Get inline style
    const inlineStyle = element.attr('style') || '';

    // Parse common style properties
    const fontWeight = this.extractStyleProperty(inlineStyle, 'font-weight');
    if (fontWeight) style.fontWeight = fontWeight;

    const fontSize = this.extractStyleProperty(inlineStyle, 'font-size');
    if (fontSize) style.fontSize = fontSize;

    const textAlign = this.extractStyleProperty(inlineStyle, 'text-align');
    if (textAlign) style.textAlign = textAlign;

    const display = this.extractStyleProperty(inlineStyle, 'display');
    if (display) style.display = display;

    const textTransform = this.extractStyleProperty(inlineStyle, 'text-transform');
    if (textTransform) style.textTransform = textTransform;

    return style;
  }

  /**
   * Extract a single style property.
   */
  private extractStyleProperty(style: string, property: string): string | undefined {
    const regex = new RegExp(`${property}\\s*:\\s*([^;]+)`, 'i');
    const match = style.match(regex);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Get text content of an element.
   */
  private getElementText(element: Cheerio<Element>): string {
    return element.text().trim();
  }

  /**
   * Check if we should process children for a node.
   */
  private shouldProcessChildren(tagName: string, node: INode): boolean {
    // These nodes handle their own content
    const selfContained = ['a', 'img'];
    if (selfContained.includes(tagName)) {
      return false;
    }

    // Headings don't need children processed (text already extracted)
    if (/^h[1-6]$/.test(tagName)) {
      return false;
    }

    // Tables handle their own structure
    if (tagName === 'table') {
      return false;
    }

    // Inline text nodes don't need children
    if (node.type === 'text') {
      return false;
    }

    return true;
  }

  /**
   * Check if element is a page number container.
   */
  private isPageNumberContainer(element: Cheerio<Element>): boolean {
    const text = element.text().trim();

    // Page numbers are short
    if (text.length > 8 || text.length === 0) {
      return false;
    }

    // Check if it's a number or roman numeral
    if (/^\d+$/.test(text)) {
      // Check for page-number-like styling/context
      const style = element.attr('style') || '';
      if (style.includes('text-align') && (style.includes('center') || style.includes('right'))) {
        return true;
      }
    }

    // Roman numerals
    if (/^[ivxlcdm]+$/i.test(text)) {
      return true;
    }

    return false;
  }

  /**
   * Check if element contains only inline content.
   */
  private isTextOnlyContainer(element: Cheerio<Element>): boolean {
    const children = element.children();
    const childArray = children.toArray();

    for (const child of childArray) {
      const tag = (child as Element).tagName?.toLowerCase();
      if (tag && !INLINE_ELEMENTS.has(tag) && tag !== 'br') {
        return false;
      }
    }

    return true;
  }

  /**
   * Parse a dimension value (e.g., "100", "100px").
   */
  private parseDimension(value?: string): number | undefined {
    if (!value) return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Merge adjacent text nodes.
   */
  private mergeAdjacentTextNodes(node: INode): void {
    const merged: INode[] = [];
    let currentText = '';

    for (const child of node.children) {
      if (child.type === 'text') {
        currentText += (child as TextNode).content;
      } else {
        if (currentText) {
          merged.push(new TextNode(currentText));
          currentText = '';
        }
        // Recursively merge in children
        this.mergeAdjacentTextNodes(child);
        merged.push(child);
      }
    }

    if (currentText) {
      merged.push(new TextNode(currentText));
    }

    node.children = merged;
  }
}
