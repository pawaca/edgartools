/**
 * Attachment class for filing documents.
 */

export interface Attachment {
  sequence: number;
  documentType: string;
  document: string;
  description: string;
  content: string;
  readonly isEmpty: boolean;
  readonly url: string;
  readonly size: number;
  isBinary(): boolean;
}

export interface AttachmentOptions {
  sequence: number;
  documentType: string;
  document: string;
  description: string;
  content: string;
  baseUrl?: string;
}

const BINARY_EXTENSIONS = new Set([
  '.pdf',
  '.zip',
  '.gif',
  '.jpg',
  '.jpeg',
  '.png',
  '.xlsx',
  '.xls',
  '.doc',
  '.docx',
]);

export class AttachmentImpl implements Attachment {
  sequence: number;
  documentType: string;
  document: string;
  description: string;
  content: string;
  private baseUrl?: string;

  constructor(options: AttachmentOptions) {
    this.sequence = options.sequence;
    this.documentType = options.documentType;
    this.document = options.document;
    this.description = options.description;
    this.content = options.content;
    this.baseUrl = options.baseUrl;
  }

  /**
   * Check if attachment is empty.
   */
  get isEmpty(): boolean {
    return !this.content || this.content.trim().length === 0;
  }

  /**
   * Get content size in bytes.
   */
  get size(): number {
    return new TextEncoder().encode(this.content).length;
  }

  /**
   * Get URL to this attachment (if base URL is set).
   */
  get url(): string {
    if (!this.baseUrl) {
      return '';
    }
    return `${this.baseUrl}/${this.document}`;
  }

  /**
   * Check if this is a binary file based on extension.
   */
  isBinary(): boolean {
    const ext = this.getExtension();
    return BINARY_EXTENSIONS.has(ext);
  }

  /**
   * Get file extension.
   */
  private getExtension(): string {
    const lastDot = this.document.lastIndexOf('.');
    if (lastDot === -1) return '';
    return this.document.substring(lastDot).toLowerCase();
  }

  /**
   * Check if this is an HTML document.
   */
  isHtml(): boolean {
    const ext = this.getExtension();
    return ext === '.htm' || ext === '.html';
  }

  /**
   * Check if this is an XML document.
   */
  isXml(): boolean {
    const ext = this.getExtension();
    return ext === '.xml';
  }

  /**
   * Check if this is an exhibit.
   */
  isExhibit(): boolean {
    return this.documentType.toUpperCase().startsWith('EX-');
  }
}
