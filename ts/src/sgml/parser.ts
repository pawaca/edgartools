/**
 * SGML Parser for SEC filing format.
 *
 * SEC filings use a custom SGML format with two main variants:
 * 1. <SUBMISSION> format (newer)
 * 2. <SEC-DOCUMENT> format (older)
 *
 * Key quirks:
 * - Tags may not have closing tags (e.g., <CIK>0000320193)
 * - Content can be UU-encoded
 * - Documents are wrapped in <DOCUMENT>...</DOCUMENT>
 */

export interface SGMLTag {
  name: string;
  content: string;
  children: SGMLTag[];
}

export interface SGMLDocument {
  sequence: number;
  type: string;
  filename: string;
  description: string;
  content: string;
}

export interface ParsedSGML {
  header: Record<string, string>;
  documents: SGMLDocument[];
  format: 'SUBMISSION' | 'SEC-DOCUMENT' | 'UNKNOWN';
}

export class SGMLParser {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  /**
   * Parse the SGML content.
   */
  parse(): ParsedSGML {
    const result: ParsedSGML = {
      header: {},
      documents: [],
      format: 'UNKNOWN',
    };

    // Detect format
    if (this.content.includes('<SUBMISSION>')) {
      result.format = 'SUBMISSION';
    } else if (this.content.includes('<SEC-DOCUMENT>')) {
      result.format = 'SEC-DOCUMENT';
    }

    // Parse header tags
    this.parseHeader(result.header);

    // Parse documents
    result.documents = this.parseDocuments();

    return result;
  }

  /**
   * Parse header tags (key-value pairs at the top of the filing).
   */
  private parseHeader(header: Record<string, string>): void {
    // Common header tags to look for
    const headerTags = [
      'ACCESSION-NUMBER',
      'CONFORMED-SUBMISSION-TYPE',
      'PUBLIC-DOCUMENT-COUNT',
      'CONFORMED-PERIOD-OF-REPORT',
      'FILED-AS-OF-DATE',
      'DATE-AS-OF-CHANGE',
      'EFFECTIVENESS-DATE',
      'CIK',
      'COMPANY-NAME',
      'COMPANY-CONFORMED-NAME',
      'STATE-OF-INCORPORATION',
      'FISCAL-YEAR-END',
      'FORM-TYPE',
      'SEC-ACT',
      'SEC-FILE-NUMBER',
      'FILM-NUMBER',
      'BUSINESS-ADDRESS',
      'MAIL-ADDRESS',
      'STANDARD-INDUSTRIAL-CLASSIFICATION',
      'IRS-NUMBER',
    ];

    for (const tag of headerTags) {
      const value = this.extractTagValue(tag);
      if (value) {
        header[tag] = value;
      }
    }

    // Also try extracting from SEC-HEADER section
    const secHeaderMatch = this.content.match(
      /<SEC-HEADER>([\s\S]*?)<\/SEC-HEADER>/i
    );
    if (secHeaderMatch) {
      this.parseSecHeader(secHeaderMatch[1], header);
    }
  }

  /**
   * Parse SEC-HEADER section with key:value format.
   */
  private parseSecHeader(
    headerContent: string,
    header: Record<string, string>
  ): void {
    const lines = headerContent.split('\n');

    for (const line of lines) {
      // Match patterns like "ACCESSION NUMBER:		0000320193-24-000123"
      // Allow leading whitespace (tabs/spaces)
      const match = line.match(/^\s*([A-Z][A-Z0-9\s-]+?):\s*(.+)$/);
      if (match) {
        const key = match[1].trim().replace(/\s+/g, '-').toUpperCase();
        const value = match[2].trim();
        if (value && !header[key]) {
          header[key] = value;
        }
      }

      // Match patterns like "<ACCEPTANCE-DATETIME>20240101120000"
      const tagMatch = line.match(/<([A-Z][A-Z0-9-]+)>(.+)/);
      if (tagMatch) {
        const key = tagMatch[1].toUpperCase();
        const value = tagMatch[2].trim();
        if (value && !header[key]) {
          header[key] = value;
        }
      }
    }
  }

  /**
   * Extract value for a specific tag.
   * Handles both <TAG>value</TAG> and <TAG>value (no closing tag) formats.
   */
  private extractTagValue(tagName: string): string | null {
    // Try with closing tag first
    const closedPattern = new RegExp(
      `<${tagName}>([\\s\\S]*?)<\\/${tagName}>`,
      'i'
    );
    const closedMatch = this.content.match(closedPattern);
    if (closedMatch) {
      return closedMatch[1].trim();
    }

    // Try without closing tag (value ends at newline or next tag)
    const unclosedPattern = new RegExp(`<${tagName}>([^<\\n]+)`, 'i');
    const unclosedMatch = this.content.match(unclosedPattern);
    if (unclosedMatch) {
      return unclosedMatch[1].trim();
    }

    return null;
  }

  /**
   * Parse all <DOCUMENT> blocks.
   */
  private parseDocuments(): SGMLDocument[] {
    const documents: SGMLDocument[] = [];
    const documentPattern = /<DOCUMENT>([\s\S]*?)<\/DOCUMENT>/gi;

    let match;
    while ((match = documentPattern.exec(this.content)) !== null) {
      const docContent = match[1];
      const doc = this.parseDocument(docContent);
      if (doc) {
        documents.push(doc);
      }
    }

    return documents;
  }

  /**
   * Parse a single <DOCUMENT> block.
   */
  private parseDocument(docContent: string): SGMLDocument | null {
    // Extract document metadata
    const sequence = this.extractDocumentTag(docContent, 'SEQUENCE');
    const type = this.extractDocumentTag(docContent, 'TYPE');
    const filename = this.extractDocumentTag(docContent, 'FILENAME');
    const description = this.extractDocumentTag(docContent, 'DESCRIPTION');

    // Extract the actual content (between <TEXT> tags)
    const textMatch = docContent.match(/<TEXT>([\s\S]*?)(<\/TEXT>|$)/i);
    let content = textMatch ? textMatch[1] : '';

    // Check for UU-encoding and decode if necessary
    if (this.isUUEncoded(content)) {
      content = this.decodeUU(content);
    }

    // Remove leading/trailing whitespace but preserve internal structure
    content = content.trim();

    return {
      sequence: sequence ? parseInt(sequence, 10) : 0,
      type: type || '',
      filename: filename || '',
      description: description || '',
      content,
    };
  }

  /**
   * Extract a tag value from document content.
   */
  private extractDocumentTag(
    docContent: string,
    tagName: string
  ): string | null {
    const pattern = new RegExp(`<${tagName}>([^<\\n]+)`, 'i');
    const match = docContent.match(pattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Check if content is UU-encoded.
   */
  private isUUEncoded(content: string): boolean {
    // UU-encoded content starts with "begin" line
    return /^begin\s+\d{3}\s+\S+/m.test(content);
  }

  /**
   * Decode UU-encoded content.
   */
  private decodeUU(content: string): string {
    const lines = content.split('\n');
    const decodedBytes: number[] = [];

    let inBody = false;
    for (const line of lines) {
      if (line.match(/^begin\s+\d{3}\s+/)) {
        inBody = true;
        continue;
      }
      if (line.trim() === 'end' || line.trim() === '`') {
        break;
      }
      if (!inBody) continue;

      // Decode UU line
      const decoded = this.decodeUULine(line);
      decodedBytes.push(...decoded);
    }

    // Convert bytes to string
    return new TextDecoder('utf-8', { fatal: false }).decode(
      new Uint8Array(decodedBytes)
    );
  }

  /**
   * Decode a single UU-encoded line.
   */
  private decodeUULine(line: string): number[] {
    if (!line || line.length === 0) return [];

    const bytes: number[] = [];
    const length = (line.charCodeAt(0) - 32) & 0x3f;

    for (let i = 1; i < line.length - 1; i += 4) {
      const c1 = (line.charCodeAt(i) - 32) & 0x3f;
      const c2 = (line.charCodeAt(i + 1) - 32) & 0x3f;
      const c3 = (line.charCodeAt(i + 2) - 32) & 0x3f;
      const c4 = (line.charCodeAt(i + 3) - 32) & 0x3f;

      bytes.push((c1 << 2) | (c2 >> 4));
      bytes.push(((c2 & 0x0f) << 4) | (c3 >> 2));
      bytes.push(((c3 & 0x03) << 6) | c4);
    }

    return bytes.slice(0, length);
  }
}
