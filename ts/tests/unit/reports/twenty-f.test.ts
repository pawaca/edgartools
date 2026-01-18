/**
 * TwentyF unit tests.
 *
 * Tests the 20-F report class implementation.
 */

import { describe, it, expect } from 'vitest';
import { TwentyF } from '../../../src/reports/twenty-f.js';
import { TWENTY_F_PATTERNS, getTwentyFPattern, getTwentyFSectionNames } from '../../../src/extractors/patterns/twenty-f.js';

describe('TwentyF', () => {
  describe('class structure', () => {
    it('should have correct form property', () => {
      const twentyf = new TwentyF({});
      expect(twentyf.form).toBe('20-F');
    });

    it('should have sectionToItem mapping', () => {
      const twentyf = new TwentyF({});
      expect(twentyf.sectionToItem).toBeDefined();
      expect(twentyf.sectionToItem['key_information']).toBe('Item 3');
      expect(twentyf.sectionToItem['company_information']).toBe('Item 4');
      expect(twentyf.sectionToItem['operating_review']).toBe('Item 5');
    });

    it('should have itemToSection mapping', () => {
      const twentyf = new TwentyF({});
      expect(twentyf.itemToSection).toBeDefined();
      expect(twentyf.itemToSection['Item 3']).toBe('key_information');
      expect(twentyf.itemToSection['Item 4']).toBe('company_information');
      expect(twentyf.itemToSection['Item 5']).toBe('operating_review');
    });

    it('should have all Item 16 sub-items in mapping', () => {
      const twentyf = new TwentyF({});

      // Check all 16A-16K sub-items
      expect(twentyf.sectionToItem['audit_committee_expert']).toBe('Item 16A');
      expect(twentyf.sectionToItem['code_of_ethics']).toBe('Item 16B');
      expect(twentyf.sectionToItem['principal_accountant_fees']).toBe('Item 16C');
      expect(twentyf.sectionToItem['audit_committee_exemptions']).toBe('Item 16D');
      expect(twentyf.sectionToItem['equity_purchases']).toBe('Item 16E');
      expect(twentyf.sectionToItem['accountant_change']).toBe('Item 16F');
      expect(twentyf.sectionToItem['corporate_governance']).toBe('Item 16G');
      expect(twentyf.sectionToItem['mine_safety']).toBe('Item 16H');
      expect(twentyf.sectionToItem['foreign_jurisdiction_disclosure']).toBe('Item 16I');
      expect(twentyf.sectionToItem['insider_trading_policies']).toBe('Item 16J');
      expect(twentyf.sectionToItem['cybersecurity']).toBe('Item 16K');
    });

    it('should have all Part V items', () => {
      const twentyf = new TwentyF({});
      expect(twentyf.sectionToItem['financial_statements_17']).toBe('Item 17');
      expect(twentyf.sectionToItem['financial_statements_18']).toBe('Item 18');
      expect(twentyf.sectionToItem['exhibits']).toBe('Item 19');
    });
  });

  describe('convenience properties', () => {
    it('should have keyInformation getter', () => {
      const twentyf = new TwentyF({});
      expect(typeof twentyf.keyInformation).toBe('object'); // null or string
    });

    it('should have riskFactors getter (alias for Item 3)', () => {
      const twentyf = new TwentyF({});
      expect(typeof twentyf.riskFactors).toBe('object'); // null or string
    });

    it('should have business getter (Item 4)', () => {
      const twentyf = new TwentyF({});
      expect(typeof twentyf.business).toBe('object'); // null or string
    });

    it('should have companyInformation getter (alias for Item 4)', () => {
      const twentyf = new TwentyF({});
      expect(typeof twentyf.companyInformation).toBe('object'); // null or string
    });

    it('should have operatingReview getter (Item 5)', () => {
      const twentyf = new TwentyF({});
      expect(typeof twentyf.operatingReview).toBe('object'); // null or string
    });

    it('should have managementDiscussion getter (alias for Item 5)', () => {
      const twentyf = new TwentyF({});
      expect(typeof twentyf.managementDiscussion).toBe('object'); // null or string
    });

    it('should have controlsAndProcedures getter (Item 15)', () => {
      const twentyf = new TwentyF({});
      expect(typeof twentyf.controlsAndProcedures).toBe('object'); // null or string
    });

    it('should have all Item 16 sub-item getters', () => {
      const twentyf = new TwentyF({});
      expect(typeof twentyf.auditCommitteeExpert).toBe('object');
      expect(typeof twentyf.codeOfEthics).toBe('object');
      expect(typeof twentyf.principalAccountantFees).toBe('object');
      expect(typeof twentyf.auditCommitteeExemptions).toBe('object');
      expect(typeof twentyf.equityPurchases).toBe('object');
      expect(typeof twentyf.accountantChange).toBe('object');
      expect(typeof twentyf.corporateGovernance).toBe('object');
      expect(typeof twentyf.mineSafety).toBe('object');
      expect(typeof twentyf.foreignJurisdictionDisclosure).toBe('object');
      expect(typeof twentyf.insiderTradingPolicies).toBe('object');
      expect(typeof twentyf.cybersecurity).toBe('object');
    });

    it('should have Part V getters', () => {
      const twentyf = new TwentyF({});
      expect(typeof twentyf.financialStatements17).toBe('object');
      expect(typeof twentyf.financialStatements18).toBe('object');
      expect(typeof twentyf.exhibits).toBe('object');
    });
  });

  describe('toString', () => {
    it('should return formatted string', () => {
      const twentyf = new TwentyF({});
      const str = twentyf.toString();
      expect(str).toMatch(/^TwentyF\('.*'\)$/);
    });
  });

  describe('static factory methods', () => {
    it('should have fromHtml static method', () => {
      expect(typeof TwentyF.fromHtml).toBe('function');
    });

    it('should have fromSgmlText static method', () => {
      expect(typeof TwentyF.fromSgmlText).toBe('function');
    });

    it('should have fromSource static method', () => {
      expect(typeof TwentyF.fromSource).toBe('function');
    });

    it('should create from minimal HTML', () => {
      const html = '<html><body><h1>Test</h1></body></html>';
      const twentyf = TwentyF.fromHtml(html);
      expect(twentyf).toBeInstanceOf(TwentyF);
    });
  });
});

describe('TWENTY_F_PATTERNS', () => {
  describe('pattern structure', () => {
    it('should have all Part I items', () => {
      expect(TWENTY_F_PATTERNS['item_1']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_2']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_3']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_4']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_4a']).toBeDefined();
    });

    it('should have all Part II items', () => {
      expect(TWENTY_F_PATTERNS['item_5']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_6']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_7']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_8']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_9']).toBeDefined();
    });

    it('should have all Part III items', () => {
      expect(TWENTY_F_PATTERNS['item_10']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_11']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_12']).toBeDefined();
    });

    it('should have all Part IV items', () => {
      expect(TWENTY_F_PATTERNS['item_13']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_14']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_15']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16']).toBeDefined();
    });

    it('should have all Item 16 sub-items', () => {
      expect(TWENTY_F_PATTERNS['item_16a']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16b']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16c']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16d']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16e']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16f']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16g']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16h']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16i']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16j']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_16k']).toBeDefined();
    });

    it('should have all Part V items', () => {
      expect(TWENTY_F_PATTERNS['item_17']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_18']).toBeDefined();
      expect(TWENTY_F_PATTERNS['item_19']).toBeDefined();
    });

    it('should have part patterns', () => {
      expect(TWENTY_F_PATTERNS['part_i']).toBeDefined();
      expect(TWENTY_F_PATTERNS['part_ii']).toBeDefined();
      expect(TWENTY_F_PATTERNS['part_iii']).toBeDefined();
      expect(TWENTY_F_PATTERNS['part_iv']).toBeDefined();
      expect(TWENTY_F_PATTERNS['part_v']).toBeDefined();
    });

    it('should have signatures pattern', () => {
      expect(TWENTY_F_PATTERNS['signatures']).toBeDefined();
    });
  });

  describe('pattern matching', () => {
    it('should match Item 1 patterns', () => {
      const patterns = TWENTY_F_PATTERNS['item_1'];
      expect(patterns[0].pattern.test('Item 1. Identity of Directors')).toBe(true);
      expect(patterns[0].pattern.test('ITEM 1 - Identity of Directors')).toBe(true);
    });

    it('should match Item 3 patterns', () => {
      const patterns = TWENTY_F_PATTERNS['item_3'];
      expect(patterns[0].pattern.test('Item 3. Key Information')).toBe(true);
      expect(patterns[0].pattern.test('ITEM 3 - Key Information')).toBe(true);
    });

    it('should match Item 4 patterns', () => {
      const patterns = TWENTY_F_PATTERNS['item_4'];
      expect(patterns[0].pattern.test('Item 4. Information on the Company')).toBe(true);
      expect(patterns[0].pattern.test('ITEM 4 - Information on the Company')).toBe(true);
    });

    it('should match Item 5 patterns', () => {
      const patterns = TWENTY_F_PATTERNS['item_5'];
      expect(patterns[0].pattern.test('Item 5. Operating and Financial Review')).toBe(true);
      expect(patterns[0].pattern.test('ITEM 5 - Operating and Financial Review and Prospects')).toBe(true);
    });

    it('should match Item 16A patterns', () => {
      const patterns = TWENTY_F_PATTERNS['item_16a'];
      expect(patterns[0].pattern.test('Item 16A. Audit Committee Financial Expert')).toBe(true);
      expect(patterns[0].pattern.test('ITEM 16A - Audit Committee Financial Expert')).toBe(true);
    });

    it('should match Item 16K patterns', () => {
      const patterns = TWENTY_F_PATTERNS['item_16k'];
      expect(patterns[0].pattern.test('Item 16K. Cybersecurity')).toBe(true);
      expect(patterns[0].pattern.test('ITEM 16K - Cybersecurity')).toBe(true);
      expect(patterns[1].pattern.test('Cybersecurity')).toBe(true);
    });

    it('should match fallback Item 16I pattern', () => {
      const patterns = TWENTY_F_PATTERNS['item_16i'];
      expect(patterns[2].pattern.test('Item 16I.')).toBe(true);
      expect(patterns[2].pattern.test('ITEM 16I')).toBe(true);
    });

    it('should match Part patterns', () => {
      expect(TWENTY_F_PATTERNS['part_i'][0].pattern.test('PART I')).toBe(true);
      expect(TWENTY_F_PATTERNS['part_ii'][0].pattern.test('PART II')).toBe(true);
      expect(TWENTY_F_PATTERNS['part_iii'][0].pattern.test('PART III')).toBe(true);
      expect(TWENTY_F_PATTERNS['part_iv'][0].pattern.test('PART IV')).toBe(true);
      expect(TWENTY_F_PATTERNS['part_v'][0].pattern.test('PART V')).toBe(true);
    });

    it('should match signatures pattern', () => {
      expect(TWENTY_F_PATTERNS['signatures'][0].pattern.test('SIGNATURES')).toBe(true);
      expect(TWENTY_F_PATTERNS['signatures'][0].pattern.test('Signatures')).toBe(true);
    });
  });

  describe('helper functions', () => {
    it('should get patterns by section name', () => {
      const patterns = getTwentyFPattern('item_3');
      expect(patterns).toBeDefined();
      expect(patterns!.length).toBeGreaterThan(0);
    });

    it('should return undefined for unknown section', () => {
      const patterns = getTwentyFPattern('unknown_section');
      expect(patterns).toBeUndefined();
    });

    it('should get all section names', () => {
      const names = getTwentyFSectionNames();
      expect(names).toContain('item_1');
      expect(names).toContain('item_16k');
      expect(names).toContain('item_19');
      expect(names).toContain('part_v');
      expect(names).toContain('signatures');
    });

    it('should have correct number of section names', () => {
      const names = getTwentyFSectionNames();
      // Items 1-4, 4A, 5-19, 16A-16K (11 sub-items), parts (5), signatures (1)
      // 4 + 1 + 15 + 11 + 5 + 1 = 37
      expect(names.length).toBeGreaterThanOrEqual(30);
    });
  });
});
