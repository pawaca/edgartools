/**
 * FilingSGML - Container for parsed SEC filing SGML data.
 */

import { SGMLParser, type ParsedSGML, type SGMLDocument } from './parser.js';
import { FilingHeader, parseFilingHeader } from './header.js';
import { Attachment, AttachmentImpl } from './attachment.js';

export class FilingSGML {
  private parsed: ParsedSGML;
  private _header: FilingHeader;
  private documentsBySequence: Map<number, SGMLDocument>;
  private documentsByName: Map<string, SGMLDocument>;
  private _attachments?: Attachment[];

  constructor(parsed: ParsedSGML) {
    this.parsed = parsed;
    this._header = parseFilingHeader(parsed.header);

    // Index documents by sequence and filename
    this.documentsBySequence = new Map();
    this.documentsByName = new Map();

    for (const doc of parsed.documents) {
      this.documentsBySequence.set(doc.sequence, doc);
      if (doc.filename) {
        this.documentsByName.set(doc.filename.toLowerCase(), doc);
      }
    }
  }

  /**
   * Create FilingSGML from raw text content.
   */
  static fromText(text: string): FilingSGML {
    const parser = new SGMLParser(text);
    const parsed = parser.parse();
    return new FilingSGML(parsed);
  }

  /**
   * Create FilingSGML from a URL or file path.
   */
  static async fromSource(source: string): Promise<FilingSGML> {
    let content: string;

    if (source.startsWith('http://') || source.startsWith('https://')) {
      // Fetch from URL
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${source}: ${response.statusText}`);
      }
      content = await response.text();
    } else {
      // Read from file
      const fs = await import('fs/promises');
      content = await fs.readFile(source, 'utf-8');
    }

    return FilingSGML.fromText(content);
  }

  /**
   * Get the filing header with metadata.
   */
  get header(): FilingHeader {
    return this._header;
  }

  /**
   * Get CIK number.
   */
  get cik(): string {
    return this._header.cik || '';
  }

  /**
   * Get accession number.
   */
  get accessionNumber(): string {
    return this._header.accessionNumber || '';
  }

  /**
   * Get form type.
   */
  get form(): string {
    return this._header.form || '';
  }

  /**
   * Get filing date.
   */
  get filingDate(): string {
    return this._header.filingDate || '';
  }

  /**
   * Get period of report.
   */
  get periodOfReport(): string {
    return this._header.periodOfReport || '';
  }

  /**
   * Get all attachments.
   */
  get attachments(): Attachment[] {
    if (!this._attachments) {
      this._attachments = this.buildAttachments();
    }
    return this._attachments;
  }

  /**
   * Build attachment objects from parsed documents.
   */
  private buildAttachments(): Attachment[] {
    const attachments: Attachment[] = [];

    // Sort documents by sequence
    const sortedDocs = [...this.documentsBySequence.entries()].sort(
      ([a], [b]) => a - b
    );

    for (const [, doc] of sortedDocs) {
      attachments.push(
        new AttachmentImpl({
          sequence: doc.sequence,
          documentType: doc.type,
          document: doc.filename,
          description: doc.description,
          content: doc.content,
        })
      );
    }

    return attachments;
  }

  /**
   * Get document by sequence number.
   */
  getDocumentBySequence(sequence: number): SGMLDocument | undefined {
    return this.documentsBySequence.get(sequence);
  }

  /**
   * Get document by filename.
   */
  getDocumentByName(filename: string): SGMLDocument | undefined {
    return this.documentsByName.get(filename.toLowerCase());
  }

  /**
   * Get the primary HTML document content.
   */
  html(): string | null {
    // Find the primary document (usually sequence 1 or first HTML file)
    const primaryDoc = this.findPrimaryDocument('html');
    return primaryDoc?.content || null;
  }

  /**
   * Get the primary XML document content.
   */
  xml(): string | null {
    const primaryDoc = this.findPrimaryDocument('xml');
    return primaryDoc?.content || null;
  }

  /**
   * Find the primary document of a given type.
   */
  private findPrimaryDocument(
    contentType: 'html' | 'xml'
  ): SGMLDocument | undefined {
    const extension = contentType === 'html' ? '.htm' : '.xml';

    // First try sequence 1
    const doc1 = this.documentsBySequence.get(1);
    if (
      doc1 &&
      (doc1.filename.toLowerCase().endsWith(extension) ||
        doc1.filename.toLowerCase().endsWith(extension + 'l'))
    ) {
      return doc1;
    }

    // Look for primary document by type
    for (const [, doc] of this.documentsBySequence) {
      const filename = doc.filename.toLowerCase();
      if (
        filename.endsWith(extension) ||
        filename.endsWith(extension + 'l')
      ) {
        // Check if it's likely the primary document
        if (
          doc.type === this.form ||
          doc.type === '10-K' ||
          doc.type === '10-Q' ||
          doc.type === '8-K' ||
          filename.includes(this.form.toLowerCase().replace('-', ''))
        ) {
          return doc;
        }
      }
    }

    // Fallback: first document of the type
    for (const [, doc] of this.documentsBySequence) {
      const filename = doc.filename.toLowerCase();
      if (
        filename.endsWith(extension) ||
        filename.endsWith(extension + 'l')
      ) {
        return doc;
      }
    }

    // Last resort: check content
    if (contentType === 'html') {
      for (const [, doc] of this.documentsBySequence) {
        if (
          doc.content.includes('<html') ||
          doc.content.includes('<HTML') ||
          doc.content.includes('<!DOCTYPE html')
        ) {
          return doc;
        }
      }
    }

    return undefined;
  }

  /**
   * Get document count.
   */
  get documentCount(): number {
    return this.parsed.documents.length;
  }

  /**
   * Get the SGML format type.
   */
  get format(): 'SUBMISSION' | 'SEC-DOCUMENT' | 'UNKNOWN' {
    return this.parsed.format;
  }
}
