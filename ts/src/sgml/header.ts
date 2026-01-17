/**
 * Filing header parsing utilities.
 */

export interface Address {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

export interface CompanyInformation {
  name?: string;
  cik?: string;
  sic?: string;
  stateOfIncorporation?: string;
  fiscalYearEnd?: string;
}

export interface Filer {
  cik?: string;
  companyInformation?: CompanyInformation;
}

export interface FilingHeader {
  cik?: string;
  accessionNumber?: string;
  form?: string;
  filingDate?: string;
  acceptanceDate?: string;
  periodOfReport?: string;
  company?: string;
  stateOfIncorporation?: string;
  fiscalYearEnd?: string;
  sic?: string;
  irsNumber?: string;
  businessAddress?: Address;
  mailingAddress?: Address;
  filers?: Filer[];
}

/**
 * Parse filing header from raw header data.
 */
export function parseFilingHeader(raw: Record<string, string>): FilingHeader {
  const header: FilingHeader = {};

  // Map raw keys to header fields
  const mappings: Record<string, keyof FilingHeader> = {
    CIK: 'cik',
    'CENTRAL-INDEX-KEY': 'cik',
    'ACCESSION-NUMBER': 'accessionNumber',
    'CONFORMED-SUBMISSION-TYPE': 'form',
    'FORM-TYPE': 'form',
    'FILED-AS-OF-DATE': 'filingDate',
    'DATE-AS-OF-CHANGE': 'filingDate',
    'ACCEPTANCE-DATETIME': 'acceptanceDate',
    'CONFORMED-PERIOD-OF-REPORT': 'periodOfReport',
    'COMPANY-NAME': 'company',
    'COMPANY-CONFORMED-NAME': 'company',
    'STATE-OF-INCORPORATION': 'stateOfIncorporation',
    'STATE': 'stateOfIncorporation',
    'FISCAL-YEAR-END': 'fiscalYearEnd',
    'STANDARD-INDUSTRIAL-CLASSIFICATION': 'sic',
    SIC: 'sic',
    'IRS-NUMBER': 'irsNumber',
  };

  for (const [rawKey, value] of Object.entries(raw)) {
    const headerKey = mappings[rawKey.toUpperCase()];
    if (headerKey && !header[headerKey]) {
      (header as Record<string, string>)[headerKey] = value;
    }
  }

  // Normalize CIK (remove leading zeros for consistency)
  if (header.cik) {
    header.cik = header.cik.replace(/^0+/, '') || '0';
  }

  // Normalize accession number
  if (header.accessionNumber) {
    // Format: 0000320193-24-000123
    header.accessionNumber = header.accessionNumber.trim();
  }

  // Parse filing date if in YYYYMMDD format
  if (header.filingDate && header.filingDate.length === 8) {
    const year = header.filingDate.substring(0, 4);
    const month = header.filingDate.substring(4, 6);
    const day = header.filingDate.substring(6, 8);
    header.filingDate = `${year}-${month}-${day}`;
  }

  // Parse acceptance datetime
  if (header.acceptanceDate && header.acceptanceDate.length >= 8) {
    const year = header.acceptanceDate.substring(0, 4);
    const month = header.acceptanceDate.substring(4, 6);
    const day = header.acceptanceDate.substring(6, 8);
    header.acceptanceDate = `${year}-${month}-${day}`;
  }

  return header;
}
