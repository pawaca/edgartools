/**
 * Section patterns for 10-K annual reports.
 */

import type { SectionPattern, SectionPatterns } from '../../types/section.js';

export const TEN_K_PATTERNS: SectionPatterns = {
  // PART I
  item_1: [
    { pattern: /^(Item|ITEM)\s+1\.?\s*[-–—.:]?\s*Business/i, title: 'Item 1 - Business' },
    { pattern: /^Business\s*$/i, title: 'Business' },
    { pattern: /^Business\s+Overview/i, title: 'Business Overview' },
    { pattern: /^Our\s+Business/i, title: 'Our Business' },
    { pattern: /^Company\s+Overview/i, title: 'Company Overview' },
  ],
  item_1a: [
    { pattern: /^(Item|ITEM)\s+1A\.?\s*[-–—.:]?\s*Risk\s+Factors/i, title: 'Item 1A - Risk Factors' },
    { pattern: /^Risk\s+Factors/i, title: 'Risk Factors' },
    { pattern: /^Factors\s+That\s+May\s+Affect/i, title: 'Risk Factors' },
  ],
  item_1b: [
    { pattern: /^(Item|ITEM)\s+1B\.?\s*[-–—.]?\s*Unresolved\s+Staff\s+Comments/i, title: 'Item 1B - Unresolved Staff Comments' },
    { pattern: /^Unresolved\s+Staff\s+Comments/i, title: 'Unresolved Staff Comments' },
  ],
  item_1c: [
    { pattern: /^(Item|ITEM)\s+1C\.?\s*[-–—.]?\s*Cybersecurity/i, title: 'Item 1C - Cybersecurity' },
    { pattern: /^Cybersecurity/i, title: 'Cybersecurity' },
  ],
  item_2: [
    { pattern: /^(Item|ITEM)\s+2\.?\s*[-–—.]?\s*Properties/i, title: 'Item 2 - Properties' },
    { pattern: /^Properties/i, title: 'Properties' },
    { pattern: /^Real\s+Estate/i, title: 'Real Estate' },
  ],
  item_3: [
    { pattern: /^(Item|ITEM)\s+3\.?\s*[-–—.]?\s*Legal\s+Proceedings/i, title: 'Item 3 - Legal Proceedings' },
    { pattern: /^Legal\s+Proceedings/i, title: 'Legal Proceedings' },
    { pattern: /^Litigation/i, title: 'Litigation' },
  ],
  item_4: [
    { pattern: /^(Item|ITEM)\s+4\.?\s*[-–—.]?\s*Mine\s+Safety/i, title: 'Item 4 - Mine Safety Disclosures' },
    { pattern: /^Mine\s+Safety\s+Disclosures/i, title: 'Mine Safety Disclosures' },
  ],

  // PART II
  item_5: [
    { pattern: /^(Item|ITEM)\s+5\.?\s*[-–—.]?\s*Market\s+for/i, title: 'Item 5 - Market for Common Equity' },
    { pattern: /^Market\s+for\s+Registrant/i, title: 'Market for Common Equity' },
  ],
  item_6: [
    { pattern: /^(Item|ITEM)\s+6\.?\s*[-–—.]?\s*\[?Reserved\]?/i, title: 'Item 6 - [Reserved]' },
    { pattern: /^(Item|ITEM)\s+6\.?\s*[-–—.]?\s*Selected\s+Financial/i, title: 'Item 6 - Selected Financial Data' },
  ],
  item_7: [
    { pattern: /^(Item|ITEM)\s+7\.?\s*[-–—.]?\s*Management.*Discussion/i, title: 'Item 7 - MD&A' },
    { pattern: /^Management.*Discussion.*Analysis/i, title: 'MD&A' },
    { pattern: /^MD&A/i, title: 'MD&A' },
  ],
  item_7a: [
    { pattern: /^(Item|ITEM)\s+7A\.?\s*[-–—.]?\s*Quantitative.*Disclosures/i, title: 'Item 7A - Market Risk' },
    { pattern: /^Quantitative.*Qualitative.*Market\s+Risk/i, title: 'Market Risk' },
    { pattern: /^Market\s+Risk/i, title: 'Market Risk' },
  ],
  item_8: [
    { pattern: /^(Item|ITEM)\s+8\.?\s*[-–—.]?\s*Financial\s+Statements/i, title: 'Item 8 - Financial Statements' },
    { pattern: /^Financial\s+Statements/i, title: 'Financial Statements' },
    { pattern: /^Consolidated\s+Financial\s+Statements/i, title: 'Consolidated Financial Statements' },
  ],
  item_9: [
    { pattern: /^(Item|ITEM)\s+9\.?\s*[-–—.]?\s*Changes\s+in\s+and\s+Disagreements/i, title: 'Item 9 - Changes in Accountants' },
    { pattern: /^Changes\s+in\s+and\s+Disagreements/i, title: 'Changes in Accountants' },
  ],
  item_9a: [
    { pattern: /^(Item|ITEM)\s+9A\.?\s*[-–—.]?\s*Controls.*Procedures/i, title: 'Item 9A - Controls and Procedures' },
    { pattern: /^Controls.*Procedures/i, title: 'Controls and Procedures' },
    { pattern: /^Internal\s+Control/i, title: 'Internal Controls' },
  ],
  item_9b: [
    { pattern: /^(Item|ITEM)\s+9B\.?\s*[-–—.]?\s*Other\s+Information/i, title: 'Item 9B - Other Information' },
    { pattern: /^Other\s+Information/i, title: 'Other Information' },
  ],
  item_9c: [
    { pattern: /^(Item|ITEM)\s+9C\.?\s*[-–—.]?\s*Disclosure.*Foreign/i, title: 'Item 9C - Foreign Jurisdiction Disclosure' },
  ],

  // PART III
  item_10: [
    { pattern: /^(Item|ITEM)\s+10\.?\s*[-–—.]?\s*Directors.*Executive/i, title: 'Item 10 - Directors and Executive Officers' },
    { pattern: /^Directors.*Senior\s+Management/i, title: 'Directors and Executive Officers' },
  ],
  item_11: [
    { pattern: /^(Item|ITEM)\s+11\.?\s*[-–—.]?\s*Executive\s+Compensation/i, title: 'Item 11 - Executive Compensation' },
    { pattern: /^Executive\s+Compensation/i, title: 'Executive Compensation' },
  ],
  item_12: [
    { pattern: /^(Item|ITEM)\s+12\.?\s*[-–—.]?\s*Security\s+Ownership/i, title: 'Item 12 - Security Ownership' },
    { pattern: /^Security\s+Ownership/i, title: 'Security Ownership' },
  ],
  item_13: [
    { pattern: /^(Item|ITEM)\s+13\.?\s*[-–—.]?\s*Certain\s+Relationships/i, title: 'Item 13 - Certain Relationships' },
    { pattern: /^Certain\s+Relationships.*Related/i, title: 'Certain Relationships' },
    { pattern: /^Related\s+Party\s+Transactions/i, title: 'Related Party Transactions' },
  ],
  item_14: [
    { pattern: /^(Item|ITEM)\s+14\.?\s*[-–—.]?\s*Principal\s+Account/i, title: 'Item 14 - Principal Accountant Fees' },
    { pattern: /^Principal\s+Account.*Fees/i, title: 'Principal Accountant Fees' },
  ],

  // PART IV
  item_15: [
    { pattern: /^(Item|ITEM)\s+15\.?\s*[-–—.]?\s*Exhibits/i, title: 'Item 15 - Exhibits and Financial Statement Schedules' },
    { pattern: /^Exhibits.*Financial\s+Statement\s+Schedules/i, title: 'Exhibits and Financial Statement Schedules' },
  ],
  item_16: [
    { pattern: /^(Item|ITEM)\s+16\.?\s*[-–—.]?\s*Form\s+10-K\s+Summary/i, title: 'Item 16 - Form 10-K Summary' },
  ],
};

/**
 * Get pattern for a specific section.
 */
export function getTenKPattern(sectionName: string): SectionPattern[] | undefined {
  return TEN_K_PATTERNS[sectionName];
}

/**
 * Get all 10-K section names.
 */
export function getTenKSectionNames(): string[] {
  return Object.keys(TEN_K_PATTERNS);
}
