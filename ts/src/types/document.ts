/**
 * Document types for parsed filing documents.
 */

import type { IDocumentNode, IHeadingNode, ITableNode } from './nodes.js';
import type { Section, Sections } from './section.js';

export interface DocumentMetadata {
  company?: string;
  form?: string;
  cik?: string;
  filingDate?: string;
  accessionNumber?: string;
  size: number;
  parseTime: number;
  parserVersion: string;
  originalHtml?: string;
  preserveWhitespace?: boolean;
  xbrlData?: {
    facts?: unknown[];
  };
}

export interface TextExtractionOptions {
  clean?: boolean;
  includeTables?: boolean;
  includeMetadata?: boolean;
  maxLength?: number;
  tableMaxColWidth?: number;
}

export interface Document {
  /** Root node of the parsed document tree */
  root: IDocumentNode;

  /** Document metadata */
  metadata: DocumentMetadata;

  /** Detected sections (lazy-loaded) */
  readonly sections: Sections;

  /** All tables in the document */
  readonly tables: ITableNode[];

  /** All headings in the document */
  readonly headings: IHeadingNode[];

  /** Check if document is empty */
  readonly isEmpty: boolean;

  /**
   * Extract text from document.
   * @param options Extraction options
   */
  text(options?: TextExtractionOptions): string;

  /**
   * Get section by name.
   * @param name Section name (e.g., 'item_1', 'item_1a')
   * @param part Optional part for 10-Q (e.g., 'I', 'II')
   */
  getSection(name: string, part?: string): Section | null;

  /**
   * Extract text from a specific section.
   * @param sectionName Section name
   */
  extractSectionText(sectionName: string): string | null;

  /**
   * Search document content.
   * @param query Search query
   * @param topK Maximum results
   */
  search(query: string, topK?: number): SearchResult[];
}

export interface SearchResult {
  content: string;
  score: number;
  node?: INode;
}

export interface ParserConfig {
  form?: string;
  maxDocumentSize: number;
  streamingThreshold: number;
  detectSections: boolean;
  tableExtraction: boolean;
  extractXbrl: boolean;
  preserveWhitespace: boolean;
  headerDetectionThreshold: number;
  mergeAdjacentNodes: boolean;
}

export const DEFAULT_PARSER_CONFIG: ParserConfig = {
  maxDocumentSize: 100 * 1024 * 1024, // 100MB
  streamingThreshold: 10 * 1024 * 1024, // 10MB
  detectSections: true,
  tableExtraction: true,
  extractXbrl: false,
  preserveWhitespace: false,
  headerDetectionThreshold: 0.7,
  mergeAdjacentNodes: true,
};

import type { INode } from './nodes.js';
