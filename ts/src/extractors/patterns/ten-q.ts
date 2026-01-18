/**
 * 10-Q Section patterns.
 *
 * Key difference: Uses part-qualified section names (part_i_item_1, part_ii_item_1)
 * because Part I and Part II have overlapping item numbers.
 */

import type { SectionPatterns } from '../../types/section.js';

export const TEN_Q_PATTERNS: SectionPatterns = {
  // ===============================
  // Part I - Financial Information
  // ===============================

  part_i_item_1: [
    { pattern: /^(Item|ITEM)\s+1\.?\s*[-–—.:]?\s*Financial\s+Statements/i, title: 'Part I, Item 1 - Financial Statements' },
    { pattern: /^Financial\s+Statements\s*$/i, title: 'Financial Statements' },
    { pattern: /^Condensed\s+Consolidated\s+Financial\s+Statements/i, title: 'Condensed Consolidated Financial Statements' },
    { pattern: /^Unaudited\s+Condensed\s+Consolidated\s+Financial\s+Statements/i, title: 'Unaudited Condensed Financial Statements' },
  ],

  part_i_item_2: [
    { pattern: /^(Item|ITEM)\s+2\.?\s*[-–—.:]?\s*Management['']?s?\s+Discussion/i, title: 'Part I, Item 2 - MD&A' },
    { pattern: /^Management['']?s?\s+Discussion\s+and\s+Analysis/i, title: 'MD&A' },
    { pattern: /^MD&A/i, title: 'MD&A' },
  ],

  part_i_item_3: [
    { pattern: /^(Item|ITEM)\s+3\.?\s*[-–—.:]?\s*Quantitative\s+and\s+Qualitative/i, title: 'Part I, Item 3 - Market Risk' },
    { pattern: /^Quantitative\s+and\s+Qualitative\s+Disclosures\s+About\s+Market\s+Risk/i, title: 'Market Risk Disclosures' },
    { pattern: /^Market\s+Risk\s*$/i, title: 'Market Risk' },
  ],

  part_i_item_4: [
    { pattern: /^(Item|ITEM)\s+4\.?\s*[-–—.:]?\s*Controls\s+and\s+Procedures/i, title: 'Part I, Item 4 - Controls and Procedures' },
    { pattern: /^Controls\s+and\s+Procedures\s*$/i, title: 'Controls and Procedures' },
    { pattern: /^Disclosure\s+Controls\s+and\s+Procedures/i, title: 'Disclosure Controls and Procedures' },
  ],

  // ===============================
  // Part II - Other Information
  // ===============================

  part_ii_item_1: [
    { pattern: /^(Item|ITEM)\s+1\.?\s*[-–—.:]?\s*Legal\s+Proceedings/i, title: 'Part II, Item 1 - Legal Proceedings' },
    { pattern: /^Legal\s+Proceedings\s*$/i, title: 'Legal Proceedings' },
  ],

  part_ii_item_1a: [
    { pattern: /^(Item|ITEM)\s+1A\.?\s*[-–—.:]?\s*Risk\s+Factors/i, title: 'Part II, Item 1A - Risk Factors' },
    { pattern: /^Risk\s+Factors\s*$/i, title: 'Risk Factors' },
  ],

  part_ii_item_2: [
    { pattern: /^(Item|ITEM)\s+2\.?\s*[-–—.:]?\s*Unregistered\s+Sales/i, title: 'Part II, Item 2 - Unregistered Sales' },
    { pattern: /^Unregistered\s+Sales\s+of\s+Equity\s+Securities/i, title: 'Unregistered Sales of Equity Securities' },
  ],

  part_ii_item_3: [
    { pattern: /^(Item|ITEM)\s+3\.?\s*[-–—.:]?\s*Defaults\s+Upon\s+Senior\s+Securities/i, title: 'Part II, Item 3 - Defaults' },
    { pattern: /^Defaults\s+Upon\s+Senior\s+Securities/i, title: 'Defaults Upon Senior Securities' },
  ],

  part_ii_item_4: [
    { pattern: /^(Item|ITEM)\s+4\.?\s*[-–—.:]?\s*Mine\s+Safety/i, title: 'Part II, Item 4 - Mine Safety' },
    { pattern: /^Mine\s+Safety\s+Disclosures/i, title: 'Mine Safety Disclosures' },
  ],

  part_ii_item_5: [
    { pattern: /^(Item|ITEM)\s+5\.?\s*[-–—.:]?\s*Other\s+Information/i, title: 'Part II, Item 5 - Other Information' },
    { pattern: /^Other\s+Information\s*$/i, title: 'Other Information' },
  ],

  part_ii_item_6: [
    { pattern: /^(Item|ITEM)\s+6\.?\s*[-–—.:]?\s*Exhibits/i, title: 'Part II, Item 6 - Exhibits' },
    { pattern: /^Exhibits\s*$/i, title: 'Exhibits' },
    { pattern: /^Exhibit\s+Index/i, title: 'Exhibit Index' },
  ],
};
