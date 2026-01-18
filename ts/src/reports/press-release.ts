/**
 * Press release attachment classes for 8-K filings.
 *
 * Port of Python: edgar/company_reports/press_release.py
 */

import type { Attachment } from '../sgml/attachment.js';

/**
 * Collection of press release attachments from an 8-K filing.
 *
 * Provides array-like access to PressRelease objects.
 */
export class PressReleases {
  readonly attachments: Attachment[];

  constructor(attachments: Attachment[]) {
    this.attachments = attachments;
  }

  /**
   * Get the number of press releases.
   */
  get length(): number {
    return this.attachments.length;
  }

  /**
   * Get a press release by index.
   * Mirrors Python's __getitem__ behavior.
   */
  get(index: number): PressRelease | undefined {
    const attachment = this.attachments[index];
    if (attachment) {
      return new PressRelease(attachment);
    }
    return undefined;
  }

  /**
   * Get press release by index using bracket notation behavior.
   * Alias for get() to match Python's [] operator.
   */
  getByIndex(index: number): PressRelease | undefined {
    return this.get(index);
  }

  /**
   * Make iterable to support for...of loops.
   */
  [Symbol.iterator](): Iterator<PressRelease> {
    let index = 0;
    const attachments = this.attachments;
    return {
      next(): IteratorResult<PressRelease> {
        if (index < attachments.length) {
          return { value: new PressRelease(attachments[index++]), done: false };
        }
        return { value: undefined as unknown as PressRelease, done: true };
      },
    };
  }

  /**
   * Convert to array of PressRelease objects.
   */
  toArray(): PressRelease[] {
    return this.attachments.map((att) => new PressRelease(att));
  }
}

/**
 * Represents a press release attachment from an 8-K filing.
 *
 * Typically has document type EX-99.1, EX-99, or EX-99.01.
 * Provides access to the content in HTML, text, and markdown formats.
 */
export class PressRelease {
  private _htmlCache: string | null = null;
  private _htmlCached = false;

  readonly attachment: Attachment;

  constructor(attachment: Attachment) {
    this.attachment = attachment;
  }

  /**
   * Get the URL to the press release document.
   */
  get url(): string {
    return this.attachment.url;
  }

  /**
   * Get the document filename.
   */
  get document(): string {
    return this.attachment.document;
  }

  /**
   * Get the document description.
   */
  get description(): string {
    return this.attachment.description;
  }

  /**
   * Get HTML content.
   *
   * Implements caching behavior similar to Python's @lru_cache.
   * In TypeScript, since attachments have synchronous content access,
   * this returns the content directly.
   */
  html(): string | null {
    if (this._htmlCached) {
      return this._htmlCache;
    }

    const content = this.attachment.content;
    if (!content) {
      this._htmlCached = true;
      return null;
    }

    // Content is already a string in TypeScript implementation
    this._htmlCache = content;
    this._htmlCached = true;
    return this._htmlCache;
  }

  /**
   * Get plain text content by extracting text from HTML.
   *
   * Matches Python's behavior using HtmlDocument.from_html().text
   */
  text(): string | null {
    const htmlContent = this.html();
    if (!htmlContent) {
      return null;
    }
    return extractTextFromHtml(htmlContent);
  }

  /**
   * Open the press release URL in browser.
   * Note: Browser opening is platform-specific; this is a placeholder.
   */
  open(): void {
    // In a Node.js environment, this would need 'open' package
    // For now, log the URL - actual implementation depends on runtime
    console.log(`Opening: ${this.url}`);
  }

  /**
   * Convert to markdown format.
   */
  toMarkdown(): string {
    const htmlContent = this.html();
    if (!htmlContent) {
      return '';
    }
    return convertHtmlToMarkdown(htmlContent, '8-K Press Release');
  }
}

/**
 * Extract plain text from HTML content.
 *
 * Removes script and style tags, then strips all HTML tags
 * and normalizes whitespace.
 */
function extractTextFromHtml(html: string): string {
  // Remove script tags and their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove style tags and their content
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Replace common block elements with newlines for better structure
  text = text.replace(/<\/(p|div|br|h[1-6]|li|tr)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&apos;/gi, "'");

  // Normalize whitespace: multiple spaces to single, multiple newlines to double
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Convert HTML to basic markdown format.
 *
 * Provides a simple conversion matching Python's MarkdownContent.from_html behavior.
 */
function convertHtmlToMarkdown(html: string, title: string): string {
  let md = `# ${title}\n\n`;

  // Start with text extraction
  let content = html;

  // Convert headers
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n');
  content = content.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n\n');
  content = content.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n\n');

  // Convert bold and italic
  content = content.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  content = content.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');

  // Convert links
  content = content.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Convert list items
  content = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');

  // Remove remaining HTML and clean up
  content = extractTextFromHtml(content);

  md += content;
  return md;
}

/**
 * Filter attachments to find press releases.
 *
 * Matches the Python logic from current_report.py:
 * - HTML document (ends with .htm or .html)
 * - AND (description contains "RELEASE" OR document type is EX-99.1/EX-99/EX-99.01)
 */
export function filterPressReleaseAttachments(
  attachments: Attachment[]
): Attachment[] {
  return attachments.filter((att) => {
    const doc = att.document.toLowerCase();
    const desc = att.description.toUpperCase();
    const type = att.documentType;

    // Must be an HTML document
    const isHtml = doc.endsWith('.htm') || doc.endsWith('.html');

    // Check if named as release or has EX-99 document type
    const isNamedRelease = /RELEASE/i.test(desc);
    const isEx99 = ['EX-99.1', 'EX-99', 'EX-99.01'].includes(type);

    return isHtml && (isNamedRelease || isEx99);
  });
}
