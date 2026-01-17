/**
 * Filing types for SEC filing data.
 */

import type { Document } from './document.js';

export interface FilingMetadata {
  /** Central Index Key - company identifier */
  cik: number;

  /** Company name */
  company: string;

  /** Filing form type (e.g., '10-K', '10-Q', '8-K') */
  form: string;

  /** Filing date (YYYY-MM-DD) */
  filingDate: string;

  /** Accession number (unique filing identifier) */
  accessionNumber: string;
}

export interface Filing extends FilingMetadata {
  /** Get the SGML filing object */
  sgml(): Promise<FilingSGML>;

  /** Get the HTML content of the primary document */
  html(): Promise<string | null>;

  /** Get plain text content */
  text(): Promise<string>;

  /** Parse the filing into a structured Document */
  parse(): Promise<Document>;

  /** Get all attachments */
  readonly attachments: Attachment[];

  /** Get the filing homepage URL */
  readonly homepageUrl: string;

  /** Get the text URL */
  readonly textUrl: string;
}

export interface FilingSGML {
  /** Filing header with metadata */
  header: FilingHeader;

  /** All attachments in the filing */
  attachments: Attachment[];

  /** CIK number */
  cik: string;

  /** Accession number */
  accessionNumber: string;

  /** Form type */
  form: string;

  /** Filing date */
  filingDate: string;

  /** Get the primary HTML document content */
  html(): string | null;

  /** Get the primary XML document content */
  xml(): string | null;
}

export interface FilingHeader {
  cik?: string;
  accessionNumber?: string;
  form?: string;
  filingDate?: string;
  acceptanceDate?: string;
  company?: string;
  stateOfIncorporation?: string;
  fiscalYearEnd?: string;
  sic?: string;
  businessAddress?: Address;
  mailingAddress?: Address;
  filers?: Filer[];
}

export interface Address {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

export interface Filer {
  cik?: string;
  companyInformation?: CompanyInformation;
}

export interface CompanyInformation {
  name?: string;
  cik?: string;
  sic?: string;
  stateOfIncorporation?: string;
  fiscalYearEnd?: string;
}

export interface Attachment {
  /** Sequence number in filing */
  sequence: number;

  /** Document type (e.g., '10-K', 'EX-21.1') */
  documentType: string;

  /** Filename */
  document: string;

  /** Description */
  description: string;

  /** File size in bytes */
  size?: number;

  /** Document content */
  content: string;

  /** Whether this is a binary file */
  isBinary(): boolean;

  /** Whether this is empty */
  readonly isEmpty: boolean;

  /** URL to download this attachment */
  readonly url: string;
}

export interface SGMLDocument {
  /** Sequence number */
  sequence: number;

  /** Document type */
  type: string;

  /** Filename */
  filename: string;

  /** Description */
  description: string;

  /** Raw content */
  content: string;
}
