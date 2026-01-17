/**
 * HTML Preprocessor for SEC filings.
 *
 * Cleans and normalizes HTML before parsing:
 * - Removes scripts, styles, comments
 * - Fixes common HTML issues in SEC filings
 * - Normalizes whitespace and entities
 */

import type { ParserConfig } from '../types/document.js';

export class HTMLPreprocessor {
  private config: ParserConfig;

  constructor(config: ParserConfig) {
    this.config = config;
  }

  /**
   * Process HTML content.
   */
  process(html: string): string {
    // Remove BOM
    if (html.charCodeAt(0) === 0xfeff) {
      html = html.substring(1);
    }

    // Remove XML declaration
    html = this.removeXmlDeclaration(html);

    // Fix encoding issues
    html = this.fixEncodingIssues(html);

    // Remove script and style elements
    html = this.removeScriptStyle(html);

    // Remove HTML comments
    html = this.removeComments(html);

    // Remove XBRL hidden elements
    html = this.removeXbrlHidden(html);

    // Normalize HTML entities
    html = this.normalizeEntities(html);

    // Fix malformed tags
    html = this.fixMalformedTags(html);

    // Normalize whitespace (if not preserving)
    if (!this.config.preserveWhitespace) {
      html = this.normalizeWhitespace(html);
    }

    // Remove empty tags
    html = this.removeEmptyTags(html);

    return html;
  }

  /**
   * Remove XML declaration.
   */
  private removeXmlDeclaration(html: string): string {
    return html.replace(/<\?xml[^>]*\?>/gi, '');
  }

  /**
   * Fix common encoding issues in SEC filings.
   */
  private fixEncodingIssues(html: string): string {
    // Windows-1252 characters often appear in SEC filings
    const replacements: Record<string, string> = {
      '\x91': "'", // Left single quote
      '\x92': "'", // Right single quote
      '\x93': '"', // Left double quote
      '\x94': '"', // Right double quote
      '\x95': '•', // Bullet
      '\x96': '–', // En dash
      '\x97': '—', // Em dash
      '\x99': '™', // Trademark
      '\xa0': ' ', // Non-breaking space
    };

    for (const [char, replacement] of Object.entries(replacements)) {
      html = html.replace(new RegExp(char, 'g'), replacement);
    }

    // Remove control characters (except newlines and tabs)
    html = html.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

    return html;
  }

  /**
   * Remove script and style elements.
   */
  private removeScriptStyle(html: string): string {
    // Remove script tags
    html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

    // Remove style tags
    html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove link tags
    html = html.replace(/<link\b[^>]*>/gi, '');

    // Remove noscript tags
    html = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');

    return html;
  }

  /**
   * Remove HTML comments.
   */
  private removeComments(html: string): string {
    return html.replace(/<!--[\s\S]*?-->/g, '');
  }

  /**
   * Remove XBRL hidden elements.
   */
  private removeXbrlHidden(html: string): string {
    // Remove ix:hidden elements (contain non-visible XBRL data)
    html = html.replace(/<ix:hidden\b[^>]*>[\s\S]*?<\/ix:hidden>/gi, '');

    // Remove ix:header elements
    html = html.replace(/<ix:header\b[^>]*>[\s\S]*?<\/ix:header>/gi, '');

    return html;
  }

  /**
   * Normalize HTML entities.
   */
  private normalizeEntities(html: string): string {
    // Common entity replacements
    const entities: Record<string, string> = {
      '&nbsp;': ' ',
      '&#160;': ' ',
      '&#xA0;': ' ',
      '&emsp;': '  ',
      '&ensp;': ' ',
      '&thinsp;': ' ',
      '&mdash;': '—',
      '&ndash;': '–',
      '&lsquo;': "'",
      '&rsquo;': "'",
      '&ldquo;': '"',
      '&rdquo;': '"',
      '&bull;': '•',
      '&middot;': '·',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
      '&amp;amp;': '&amp;', // Fix double encoding
    };

    for (const [entity, replacement] of Object.entries(entities)) {
      html = html.replace(new RegExp(entity, 'gi'), replacement);
    }

    return html;
  }

  /**
   * Fix malformed HTML tags.
   */
  private fixMalformedTags(html: string): string {
    // Fix self-closing tags that aren't properly closed
    html = html.replace(/<(br|hr|img|input|meta|link)([^>]*?)(?<!\/)>/gi, '<$1$2/>');

    // Fix nested paragraphs (common in SEC filings)
    html = html.replace(/<p([^>]*)>\s*<p/gi, '<p$1><span');
    html = html.replace(/<\/p>\s*<\/p>/gi, '</span></p>');

    return html;
  }

  /**
   * Normalize whitespace.
   */
  private normalizeWhitespace(html: string): string {
    // Collapse multiple spaces (but preserve single newlines)
    html = html.replace(/[ \t]+/g, ' ');

    // Collapse multiple newlines
    html = html.replace(/\n{3,}/g, '\n\n');

    // Remove spaces around newlines
    html = html.replace(/ *\n */g, '\n');

    return html;
  }

  /**
   * Remove empty tags.
   */
  private removeEmptyTags(html: string): string {
    // Tags to remove if empty
    const emptyTags = ['span', 'div', 'p', 'font', 'b', 'i', 'u', 'em', 'strong'];

    for (const tag of emptyTags) {
      // Remove empty tags (may need multiple passes)
      let prevHtml = '';
      while (prevHtml !== html) {
        prevHtml = html;
        html = html.replace(
          new RegExp(`<${tag}\\b[^>]*>\\s*<\\/${tag}>`, 'gi'),
          ''
        );
      }
    }

    return html;
  }
}
