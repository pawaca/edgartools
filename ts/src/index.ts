/**
 * EdgarTools TypeScript - SEC Filing Parser
 *
 * TypeScript implementation of EdgarTools for parsing SEC filings.
 *
 * @example
 * ```typescript
 * import { TenK, FilingSGML } from '@edgartools/ts';
 *
 * // Parse a 10-K filing
 * const tenk = TenK.fromSgmlText(sgmlContent);
 *
 * // Access sections
 * console.log(tenk.business);
 * console.log(tenk.riskFactors);
 *
 * // Get all detected sections
 * for (const [name, section] of tenk.sections) {
 *   console.log(`${name}: ${section.title}`);
 * }
 * ```
 */

// Types
export type {
  // Node types
  INode,
  IDocumentNode,
  IHeadingNode,
  ITextNode,
  IParagraphNode,
  IContainerNode,
  ITableNode,
  IRowNode,
  ICellNode,
  ILinkNode,
  IImageNode,
  IListNode,
  IListItemNode,
  ISectionNode,
  NodeType,
  SemanticType,
  Style,
  NodeMetadata,
} from './types/nodes.js';

export type {
  Section,
  Sections,
  SectionPattern,
  SectionPatterns,
  DetectionMethod,
  DetectionThresholds,
} from './types/section.js';

export type {
  Document,
  DocumentMetadata,
  TextExtractionOptions,
  SearchResult,
  ParserConfig,
} from './types/document.js';

export type {
  Filing,
  FilingMetadata,
  FilingSGML as IFilingSGML,
  FilingHeader,
  Attachment as IAttachment,
  SGMLDocument,
  Address,
  Filer,
  CompanyInformation,
} from './types/filing.js';

// SGML parsing
export { SGMLParser, type ParsedSGML, type SGMLTag } from './sgml/parser.js';
export { FilingSGML } from './sgml/filing-sgml.js';
export { parseFilingHeader } from './sgml/header.js';
export { AttachmentImpl, type Attachment } from './sgml/attachment.js';

// Document parsing
export { HTMLParser, HTMLParsingError, DocumentTooLargeError } from './documents/parser.js';
export { HTMLPreprocessor } from './documents/preprocessor.js';
export { DocumentImpl } from './documents/document.js';
export { DocumentBuilder } from './documents/strategies/document-builder.js';

// Node types
export {
  Node,
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
} from './documents/nodes/index.js';

// Section extraction
export { PatternSectionExtractor } from './extractors/pattern-section-extractor.js';
export { TEN_K_PATTERNS, getTenKPattern, getTenKSectionNames } from './extractors/patterns/index.js';

// Reports
export { TenK, type TenKOptions } from './reports/ten-k.js';

// Config defaults
export { DEFAULT_PARSER_CONFIG } from './types/document.js';
export { DEFAULT_DETECTION_THRESHOLDS } from './types/section.js';
