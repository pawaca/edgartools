/**
 * SGML parsing module for SEC filings.
 */

export { SGMLParser, type ParsedSGML, type SGMLDocument, type SGMLTag } from './parser.js';
export { FilingSGML } from './filing-sgml.js';
export {
  parseFilingHeader,
  type FilingHeader,
  type Address,
  type CompanyInformation,
  type Filer,
} from './header.js';
export { AttachmentImpl, type Attachment, type AttachmentOptions } from './attachment.js';
