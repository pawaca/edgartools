/**
 * Section patterns for 20-F annual reports (foreign private issuers).
 *
 * Ported from Python: edgar/documents/extractors/pattern_section_extractor.py
 */

import type { SectionPattern, SectionPatterns } from '../../types/section.js';

export const TWENTY_F_PATTERNS: SectionPatterns = {
  // PART I
  item_1: [
    { pattern: /^(Item|ITEM)\s+1\.?\s*[-–—.]?\s*Identity.*Directors/i, title: 'Item 1 - Identity of Directors, Senior Management and Advisers' },
    { pattern: /^Identity.*Directors.*Senior\s+Management/i, title: 'Identity of Directors' },
  ],
  item_2: [
    { pattern: /^(Item|ITEM)\s+2\.?\s*[-–—.]?\s*Offer\s+Statistics/i, title: 'Item 2 - Offer Statistics and Expected Timetable' },
    { pattern: /^Offer\s+Statistics.*Timetable/i, title: 'Offer Statistics' },
  ],
  item_3: [
    { pattern: /^(Item|ITEM)\s+3\.?\s*[-–—.]?\s*Key\s+Information/i, title: 'Item 3 - Key Information' },
    { pattern: /^Key\s+Information/i, title: 'Key Information' },
    { pattern: /^Risk\s+Factors/i, title: 'Risk Factors' },
  ],
  item_4: [
    { pattern: /^(Item|ITEM)\s+4\.?\s*[-–—.]?\s*Information\s+on\s+the\s+Company/i, title: 'Item 4 - Information on the Company' },
    { pattern: /^Information\s+on\s+the\s+Company/i, title: 'Information on the Company' },
    { pattern: /^Business\s+Overview/i, title: 'Business Overview' },
  ],
  item_4a: [
    { pattern: /^(Item|ITEM)\s+4A\.?\s*[-–—.]?\s*Unresolved\s+Staff/i, title: 'Item 4A - Unresolved Staff Comments' },
    { pattern: /^Unresolved\s+Staff\s+Comments/i, title: 'Unresolved Staff Comments' },
  ],

  // PART II
  item_5: [
    { pattern: /^(Item|ITEM)\s+5\.?\s*[-–—.]?\s*Operating.*Financial\s+Review/i, title: 'Item 5 - Operating and Financial Review and Prospects' },
    { pattern: /^Operating.*Financial\s+Review/i, title: 'Operating and Financial Review' },
    { pattern: /^Management.*Discussion.*Analysis/i, title: 'MD&A' },
  ],
  item_6: [
    { pattern: /^(Item|ITEM)\s+6\.?\s*[-–—.]?\s*Directors.*Senior\s+Management.*Employees/i, title: 'Item 6 - Directors, Senior Management and Employees' },
    { pattern: /^Directors.*Senior\s+Management.*Employees/i, title: 'Directors and Employees' },
  ],
  item_7: [
    { pattern: /^(Item|ITEM)\s+7\.?\s*[-–—.]?\s*Major\s+Shareholders/i, title: 'Item 7 - Major Shareholders and Related Party Transactions' },
    { pattern: /^Major\s+Shareholders.*Related\s+Party/i, title: 'Major Shareholders' },
  ],
  item_8: [
    { pattern: /^(Item|ITEM)\s+8\.?\s*[-–—.]?\s*Financial\s+Information/i, title: 'Item 8 - Financial Information' },
    { pattern: /^Financial\s+Information/i, title: 'Financial Information' },
  ],
  item_9: [
    { pattern: /^(Item|ITEM)\s+9\.?\s*[-–—.]?\s*The\s+Offer\s+and\s+Listing/i, title: 'Item 9 - The Offer and Listing' },
    { pattern: /^The\s+Offer\s+and\s+Listing/i, title: 'Offer and Listing' },
  ],

  // PART III
  item_10: [
    { pattern: /^(Item|ITEM)\s+10\.?\s*[-–—.]?\s*Additional\s+Information/i, title: 'Item 10 - Additional Information' },
    { pattern: /^Additional\s+Information/i, title: 'Additional Information' },
  ],
  item_11: [
    { pattern: /^(Item|ITEM)\s+11\.?\s*[-–—.]?\s*Quantitative.*Qualitative.*Market\s+Risk/i, title: 'Item 11 - Quantitative and Qualitative Disclosures About Market Risk' },
    { pattern: /^Quantitative.*Qualitative.*Market\s+Risk/i, title: 'Market Risk Disclosures' },
  ],
  item_12: [
    { pattern: /^(Item|ITEM)\s+12\.?\s*[-–—.]?\s*Description.*Securities/i, title: 'Item 12 - Description of Securities Other Than Equity Securities' },
    { pattern: /^Description.*Securities.*Equity/i, title: 'Securities Description' },
  ],

  // PART IV
  item_13: [
    { pattern: /^(Item|ITEM)\s+13\.?\s*[-–—.]?\s*Defaults/i, title: 'Item 13 - Defaults, Dividend Arrearages and Delinquencies' },
    { pattern: /^Defaults.*Dividend.*Arrearages/i, title: 'Defaults and Arrearages' },
  ],
  item_14: [
    { pattern: /^(Item|ITEM)\s+14\.?\s*[-–—.]?\s*Material\s+Modifications/i, title: 'Item 14 - Material Modifications to the Rights of Security Holders' },
    { pattern: /^Material\s+Modifications.*Rights/i, title: 'Material Modifications' },
  ],
  item_15: [
    { pattern: /^(Item|ITEM)\s+15\.?\s*[-–—.]?\s*Controls.*Procedures/i, title: 'Item 15 - Controls and Procedures' },
    { pattern: /^Controls.*Procedures/i, title: 'Controls and Procedures' },
  ],
  item_16: [
    { pattern: /^(Item|ITEM)\s+16\.?\s*[-–—.]?\s*\[?Reserved\]?/i, title: 'Item 16 - [Reserved]' },
  ],

  // Item 16 sub-items (A through K)
  item_16a: [
    { pattern: /^(Item|ITEM)\s+16A\.?\s*[-–—.]?\s*Audit\s+Committee/i, title: 'Item 16A - Audit Committee Financial Expert' },
    { pattern: /^Audit\s+Committee\s+Financial\s+Expert/i, title: 'Audit Committee Expert' },
  ],
  item_16b: [
    { pattern: /^(Item|ITEM)\s+16B\.?\s*[-–—.]?\s*Code\s+of\s+Ethics/i, title: 'Item 16B - Code of Ethics' },
    { pattern: /^Code\s+of\s+Ethics/i, title: 'Code of Ethics' },
  ],
  item_16c: [
    { pattern: /^(Item|ITEM)\s+16C\.?\s*[-–—.]?\s*Principal\s+Accountant/i, title: 'Item 16C - Principal Accountant Fees and Services' },
    { pattern: /^Principal\s+Accountant\s+Fees/i, title: 'Accountant Fees' },
  ],
  item_16d: [
    { pattern: /^(Item|ITEM)\s+16D\.?\s*[-–—.]?\s*Exemptions.*Audit\s+Committees/i, title: 'Item 16D - Exemptions from the Listing Standards for Audit Committees' },
    { pattern: /^Exemptions.*Listing\s+Standards/i, title: 'Audit Committee Exemptions' },
  ],
  item_16e: [
    { pattern: /^(Item|ITEM)\s+16E\.?\s*[-–—.]?\s*Purchases.*Equity\s+Securities/i, title: 'Item 16E - Purchases of Equity Securities by the Issuer' },
    { pattern: /^Purchases.*Equity\s+Securities.*Issuer/i, title: 'Equity Purchases' },
  ],
  item_16f: [
    { pattern: /^(Item|ITEM)\s+16F\.?\s*[-–—.]?\s*Change.*Certifying\s+Accountant/i, title: 'Item 16F - Change in Registrant\'s Certifying Accountant' },
    { pattern: /^Change.*Certifying\s+Accountant/i, title: 'Accountant Change' },
  ],
  item_16g: [
    { pattern: /^(Item|ITEM)\s+16G\.?\s*[-–—.]?\s*Corporate\s+Governance/i, title: 'Item 16G - Corporate Governance' },
    { pattern: /^Corporate\s+Governance/i, title: 'Corporate Governance' },
  ],
  item_16h: [
    { pattern: /^(Item|ITEM)\s+16H\.?\s*[-–—.]?\s*Mine\s+Safety/i, title: 'Item 16H - Mine Safety Disclosure' },
    { pattern: /^Mine\s+Safety\s+Disclosure/i, title: 'Mine Safety' },
  ],
  item_16i: [
    { pattern: /^(Item|ITEM)\s+16I\.?\s*[-–—.]?\s*Disclosure.*Foreign\s+Jurisdictions/i, title: 'Item 16I - Disclosure Regarding Foreign Jurisdictions That Prevent Inspections' },
    { pattern: /^Disclosure.*Foreign\s+Jurisdictions.*Inspections/i, title: 'Foreign Jurisdiction Disclosure' },
    { pattern: /^(Item|ITEM)\s+16I\.?\s*$/i, title: 'Item 16I' },
  ],
  item_16j: [
    { pattern: /^(Item|ITEM)\s+16J\.?\s*[-–—.]?\s*Insider\s+Trading/i, title: 'Item 16J - Insider Trading Policies' },
    { pattern: /^Insider\s+Trading\s+Policies/i, title: 'Insider Trading Policies' },
    { pattern: /^(Item|ITEM)\s+16J\.?\s*$/i, title: 'Item 16J' },
  ],
  item_16k: [
    { pattern: /^(Item|ITEM)\s+16K\.?\s*[-–—.]?\s*Cybersecurity/i, title: 'Item 16K - Cybersecurity' },
    { pattern: /^Cybersecurity/i, title: 'Cybersecurity' },
    { pattern: /^(Item|ITEM)\s+16K\.?\s*$/i, title: 'Item 16K' },
  ],

  // PART V
  item_17: [
    { pattern: /^(Item|ITEM)\s+17\.?\s*[-–—.]?\s*Financial\s+Statements/i, title: 'Item 17 - Financial Statements' },
  ],
  item_18: [
    { pattern: /^(Item|ITEM)\s+18\.?\s*[-–—.]?\s*Financial\s+Statements/i, title: 'Item 18 - Financial Statements' },
  ],
  item_19: [
    { pattern: /^(Item|ITEM)\s+19\.?\s*[-–—.]?\s*Exhibits/i, title: 'Item 19 - Exhibits' },
    { pattern: /^Exhibits/i, title: 'Exhibits' },
  ],

  // PARTS
  part_i: [
    { pattern: /^PART\s+I\s*$/i, title: 'Part I' },
  ],
  part_ii: [
    { pattern: /^PART\s+II\s*$/i, title: 'Part II' },
  ],
  part_iii: [
    { pattern: /^PART\s+III\s*$/i, title: 'Part III' },
  ],
  part_iv: [
    { pattern: /^PART\s+IV\s*$/i, title: 'Part IV' },
  ],
  part_v: [
    { pattern: /^PART\s+V\s*$/i, title: 'Part V' },
  ],
  signatures: [
    { pattern: /^SIGNATURES?\s*$/i, title: 'Signatures' },
  ],
};

/**
 * Get pattern for a specific section.
 */
export function getTwentyFPattern(sectionName: string): SectionPattern[] | undefined {
  return TWENTY_F_PATTERNS[sectionName];
}

/**
 * Get all 20-F section names.
 */
export function getTwentyFSectionNames(): string[] {
  return Object.keys(TWENTY_F_PATTERNS);
}
