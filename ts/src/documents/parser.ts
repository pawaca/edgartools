/**
 * Main HTML Parser for SEC filings.
 */

import * as cheerio from 'cheerio';
import type { ParserConfig, DocumentMetadata } from '../types/document.js';
import { DEFAULT_PARSER_CONFIG } from '../types/document.js';
import { HTMLPreprocessor } from './preprocessor.js';
import { DocumentBuilder } from './strategies/document-builder.js';
import { DocumentImpl } from './document.js';
import { DocumentNode } from './nodes/document-node.js';

/**
 * Document parsing error.
 */
export class HTMLParsingError extends Error {
  context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'HTMLParsingError';
    this.context = context;
  }
}

/**
 * Document too large error.
 */
export class DocumentTooLargeError extends Error {
  size: number;
  maxSize: number;

  constructor(size: number, maxSize: number) {
    super(`Document size ${size} exceeds maximum ${maxSize}`);
    this.name = 'DocumentTooLargeError';
    this.size = size;
    this.maxSize = maxSize;
  }
}

/**
 * Main HTML Parser class.
 */
export class HTMLParser {
  private config: ParserConfig;
  private preprocessor: HTMLPreprocessor;

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = { ...DEFAULT_PARSER_CONFIG, ...config };
    this.preprocessor = new HTMLPreprocessor(this.config);
  }

  /**
   * Parse HTML into Document.
   */
  parse(html: string | Buffer): DocumentImpl {
    const startTime = performance.now();

    // Validate input
    if (html === null || html === undefined) {
      throw new TypeError('HTML input cannot be null or undefined');
    }

    // Convert Buffer to string
    if (Buffer.isBuffer(html)) {
      html = html.toString('utf-8');
    }

    if (typeof html !== 'string') {
      throw new TypeError(`HTML must be string or Buffer, got ${typeof html}`);
    }

    // Handle empty HTML
    if (!html.trim()) {
      const root = new DocumentNode();
      const metadata: DocumentMetadata = {
        size: 0,
        parseTime: performance.now() - startTime,
        parserVersion: '1.0.0',
      };
      return new DocumentImpl(root, metadata);
    }

    // Check document size
    const docSize = Buffer.byteLength(html, 'utf-8');
    if (docSize > this.config.maxDocumentSize) {
      throw new DocumentTooLargeError(docSize, this.config.maxDocumentSize);
    }

    try {
      // Store original HTML before preprocessing
      const originalHtml = html;

      // Preprocess HTML
      html = this.preprocessor.process(html);

      // Parse with cheerio
      const $ = cheerio.load(html, {
        xmlMode: false,
      });

      // Extract metadata
      const metadata = this.extractMetadata($, html);
      metadata.originalHtml = originalHtml;
      metadata.preserveWhitespace = this.config.preserveWhitespace;

      // Build document
      const builder = new DocumentBuilder(this.config);
      const root = builder.build($);

      // Create document
      const document = new DocumentImpl(root, metadata);
      document._config = this.config;

      // Record parse time
      document.metadata.parseTime = performance.now() - startTime;
      document.metadata.size = docSize;

      return document;
    } catch (error) {
      if (error instanceof DocumentTooLargeError || error instanceof HTMLParsingError) {
        throw error;
      }
      throw new HTMLParsingError(
        `Failed to parse HTML: ${(error as Error).message}`,
        { errorType: (error as Error).name }
      );
    }
  }

  /**
   * Extract metadata from parsed HTML.
   */
  private extractMetadata(
    $: cheerio.CheerioAPI,
    _html: string
  ): DocumentMetadata {
    const metadata: DocumentMetadata = {
      size: 0,
      parseTime: 0,
      parserVersion: '1.0.0',
    };

    // Use form from config if provided
    if (this.config.form) {
      metadata.form = this.config.form;
    }

    // Try to extract from meta tags
    $('meta').each((_, el) => {
      const name = $(el).attr('name')?.toLowerCase();
      const content = $(el).attr('content');

      if (!content) return;

      switch (name) {
        case 'company':
          metadata.company = content;
          break;
        case 'filing-type':
          if (!metadata.form) metadata.form = content;
          break;
        case 'cik':
          metadata.cik = content;
          break;
        case 'filing-date':
          metadata.filingDate = content;
          break;
        case 'accession-number':
          metadata.accessionNumber = content;
          break;
      }
    });

    // Try to extract from title
    const title = $('title').text().trim();
    if (title) {
      const parts = title.split(' - ');
      if (parts.length >= 2) {
        if (!metadata.company) metadata.company = parts[0].trim();
        if (!metadata.form) metadata.form = parts[1].trim();
      }
    }

    return metadata;
  }
}
