/**
 * 8-K Section patterns.
 *
 * Key difference: Uses decimal item numbering (1.01, 2.02, etc.)
 * Pattern must handle Apple-style spacing: "Item 2. 02" = "Item 2.02"
 */

import type { SectionPatterns } from '../../types/section.js';

export const EIGHT_K_PATTERNS: SectionPatterns = {
  // ===============================
  // Section 1 - Business Operations
  // ===============================

  item_101: [
    { pattern: /^(Item|ITEM)\s+1\.\s*01\.?\s*[-–—.:]?\s*Entry/i, title: 'Item 1.01 - Entry into Material Agreement' },
    { pattern: /^Entry\s+into\s+a\s+Material\s+Definitive\s+Agreement/i, title: 'Entry into Material Agreement' },
  ],

  item_102: [
    { pattern: /^(Item|ITEM)\s+1\.\s*02\.?\s*[-–—.:]?\s*Termination/i, title: 'Item 1.02 - Termination of Agreement' },
    { pattern: /^Termination\s+of\s+a\s+Material\s+Definitive\s+Agreement/i, title: 'Termination of Agreement' },
  ],

  item_103: [
    { pattern: /^(Item|ITEM)\s+1\.\s*03\.?\s*[-–—.:]?\s*Bankruptcy/i, title: 'Item 1.03 - Bankruptcy' },
    { pattern: /^Bankruptcy\s+or\s+Receivership/i, title: 'Bankruptcy or Receivership' },
  ],

  item_104: [
    { pattern: /^(Item|ITEM)\s+1\.\s*04\.?\s*[-–—.:]?\s*Mine\s+Safety/i, title: 'Item 1.04 - Mine Safety' },
    { pattern: /^Mine\s+Safety/i, title: 'Mine Safety' },
  ],

  // ===============================
  // Section 2 - Financial Information
  // ===============================

  item_201: [
    { pattern: /^(Item|ITEM)\s+2\.\s*01\.?\s*[-–—.:]?\s*Completion/i, title: 'Item 2.01 - Acquisition/Disposition' },
    { pattern: /^Completion\s+of\s+Acquisition\s+or\s+Disposition/i, title: 'Completion of Acquisition or Disposition' },
  ],

  item_202: [
    { pattern: /^(Item|ITEM)\s+2\.\s*02\.?\s*[-–—.:]?\s*Results/i, title: 'Item 2.02 - Results of Operations' },
    { pattern: /^Results\s+of\s+Operations\s+and\s+Financial\s+Condition/i, title: 'Results of Operations' },
  ],

  item_203: [
    { pattern: /^(Item|ITEM)\s+2\.\s*03\.?\s*[-–—.:]?\s*Creation/i, title: 'Item 2.03 - Direct Financial Obligation' },
    { pattern: /^Creation\s+of\s+a\s+Direct\s+Financial\s+Obligation/i, title: 'Direct Financial Obligation' },
  ],

  item_204: [
    { pattern: /^(Item|ITEM)\s+2\.\s*04\.?\s*[-–—.:]?\s*Triggering/i, title: 'Item 2.04 - Triggering Events' },
    { pattern: /^Triggering\s+Events/i, title: 'Triggering Events' },
  ],

  item_205: [
    { pattern: /^(Item|ITEM)\s+2\.\s*05\.?\s*[-–—.:]?\s*Costs/i, title: 'Item 2.05 - Exit Costs' },
    { pattern: /^Costs\s+Associated\s+with\s+Exit/i, title: 'Exit Costs' },
  ],

  item_206: [
    { pattern: /^(Item|ITEM)\s+2\.\s*06\.?\s*[-–—.:]?\s*Material\s+Impairments/i, title: 'Item 2.06 - Material Impairments' },
    { pattern: /^Material\s+Impairments/i, title: 'Material Impairments' },
  ],

  // ===============================
  // Section 3 - Securities
  // ===============================

  item_301: [
    { pattern: /^(Item|ITEM)\s+3\.\s*01\.?\s*[-–—.:]?\s*Notice/i, title: 'Item 3.01 - Delisting Notice' },
    { pattern: /^Notice\s+of\s+Delisting/i, title: 'Delisting Notice' },
  ],

  item_302: [
    { pattern: /^(Item|ITEM)\s+3\.\s*02\.?\s*[-–—.:]?\s*Unregistered/i, title: 'Item 3.02 - Unregistered Sales' },
    { pattern: /^Unregistered\s+Sales\s+of\s+Equity\s+Securities/i, title: 'Unregistered Sales' },
  ],

  item_303: [
    { pattern: /^(Item|ITEM)\s+3\.\s*03\.?\s*[-–—.:]?\s*Material\s+Modification/i, title: 'Item 3.03 - Material Modification' },
    { pattern: /^Material\s+Modification\s+to\s+Rights/i, title: 'Material Modification to Rights' },
  ],

  // ===============================
  // Section 4 - Accountants
  // ===============================

  item_401: [
    { pattern: /^(Item|ITEM)\s+4\.\s*01\.?\s*[-–—.:]?\s*Changes/i, title: 'Item 4.01 - Changes in Accountant' },
    { pattern: /^Changes\s+in\s+Registrant['']?s?\s+Certifying\s+Accountant/i, title: 'Changes in Accountant' },
  ],

  item_402: [
    { pattern: /^(Item|ITEM)\s+4\.\s*02\.?\s*[-–—.:]?\s*Non-Reliance/i, title: 'Item 4.02 - Non-Reliance on Audit' },
    { pattern: /^Non-Reliance\s+on\s+Previously\s+Issued\s+Financial\s+Statements/i, title: 'Non-Reliance on Audit' },
  ],

  // ===============================
  // Section 5 - Corporate Governance
  // ===============================

  item_501: [
    { pattern: /^(Item|ITEM)\s+5\.\s*01\.?\s*[-–—.:]?\s*Changes?\s+in\s+Control/i, title: 'Item 5.01 - Changes in Control' },
    { pattern: /^Changes?\s+in\s+Control\s+of\s+Registrant/i, title: 'Changes in Control' },
  ],

  item_502: [
    { pattern: /^(Item|ITEM)\s+5\.\s*02\.?\s*[-–—.:]?\s*Departure/i, title: 'Item 5.02 - Director/Officer Departure' },
    { pattern: /^Departure\s+of\s+Directors\s+or\s+(Certain\s+)?Officers/i, title: 'Director/Officer Departure' },
  ],

  item_503: [
    { pattern: /^(Item|ITEM)\s+5\.\s*03\.?\s*[-–—.:]?\s*Amendments/i, title: 'Item 5.03 - Amendments to Articles' },
    { pattern: /^Amendments\s+to\s+Articles\s+of\s+Incorporation/i, title: 'Amendments to Articles' },
  ],

  item_504: [
    { pattern: /^(Item|ITEM)\s+5\.\s*04\.?\s*[-–—.:]?\s*Temporary\s+Suspension/i, title: 'Item 5.04 - Trading Suspension' },
    { pattern: /^Temporary\s+Suspension\s+of\s+Trading/i, title: 'Temporary Trading Suspension' },
  ],

  item_505: [
    { pattern: /^(Item|ITEM)\s+5\.\s*05\.?\s*[-–—.:]?\s*Amendments?\s+to.*Code/i, title: 'Item 5.05 - Code of Ethics' },
    { pattern: /^Amendments?\s+to.*Code\s+of\s+Ethics/i, title: 'Code of Ethics Amendment' },
  ],

  item_506: [
    { pattern: /^(Item|ITEM)\s+5\.\s*06\.?\s*[-–—.:]?\s*Change\s+in\s+Shell/i, title: 'Item 5.06 - Shell Company Change' },
    { pattern: /^Change\s+in\s+Shell\s+Company\s+Status/i, title: 'Shell Company Status Change' },
  ],

  item_507: [
    { pattern: /^(Item|ITEM)\s+5\.\s*07\.?\s*[-–—.:]?\s*Submission/i, title: 'Item 5.07 - Shareholder Vote' },
    { pattern: /^Submission\s+of\s+Matters\s+to\s+a\s+Vote/i, title: 'Shareholder Vote' },
  ],

  item_508: [
    { pattern: /^(Item|ITEM)\s+5\.\s*08\.?\s*[-–—.:]?\s*Shareholder.*Director/i, title: 'Item 5.08 - Director Nominations' },
    { pattern: /^Shareholder.*Director\s+Nominations/i, title: 'Shareholder Director Nominations' },
  ],

  // ===============================
  // Section 6 - ABS
  // ===============================

  item_601: [
    { pattern: /^(Item|ITEM)\s+6\.\s*01/i, title: 'Item 6.01 - ABS Information' },
  ],

  item_602: [
    { pattern: /^(Item|ITEM)\s+6\.\s*02/i, title: 'Item 6.02 - ABS Change' },
  ],

  item_603: [
    { pattern: /^(Item|ITEM)\s+6\.\s*03/i, title: 'Item 6.03 - ABS Other Info' },
  ],

  item_604: [
    { pattern: /^(Item|ITEM)\s+6\.\s*04/i, title: 'Item 6.04 - ABS Failure' },
  ],

  item_605: [
    { pattern: /^(Item|ITEM)\s+6\.\s*05/i, title: 'Item 6.05 - ABS Material Change' },
  ],

  // ===============================
  // Section 7 - Regulation FD
  // ===============================

  item_701: [
    { pattern: /^(Item|ITEM)\s+7\.\s*01\.?\s*[-–—.:]?\s*Regulation\s+FD/i, title: 'Item 7.01 - Regulation FD Disclosure' },
    { pattern: /^Regulation\s+FD\s+Disclosure/i, title: 'Regulation FD Disclosure' },
  ],

  // ===============================
  // Section 8 - Other Events
  // ===============================

  item_801: [
    { pattern: /^(Item|ITEM)\s+8\.\s*01\.?\s*[-–—.:]?\s*Other\s+Events/i, title: 'Item 8.01 - Other Events' },
    { pattern: /^Other\s+Events\s*$/i, title: 'Other Events' },
  ],

  // ===============================
  // Section 9 - Financial Statements
  // ===============================

  item_901: [
    { pattern: /^(Item|ITEM)\s+9\.\s*01\.?\s*[-–—.:]?\s*Financial\s+Statements/i, title: 'Item 9.01 - Financial Statements and Exhibits' },
    { pattern: /^Financial\s+Statements\s+and\s+Exhibits/i, title: 'Financial Statements and Exhibits' },
    { pattern: /^Exhibits?\s*$/i, title: 'Exhibits' },
  ],
};
