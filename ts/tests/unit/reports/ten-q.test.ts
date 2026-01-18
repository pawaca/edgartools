/**
 * Unit tests for TenQ class.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenQ } from '../../../src/reports/ten-q.js';
import { TEN_Q_STRUCTURE } from '../../../src/reports/structures.js';

describe('TenQ', () => {
  describe('constructor validation', () => {
    it('should throw error for non-10-Q form type', () => {
      // Create SGML with wrong form type
      const sgmlText = `
<SEC-DOCUMENT>
<ACCESSION-NUMBER>0000320193-23-000106
<CONFORMED-SUBMISSION-TYPE>10-K
</SEC-DOCUMENT>`;

      expect(() => TenQ.fromSgmlText(sgmlText)).toThrow('Expected 10-Q form but got 10-K');
    });

    it('should accept 10-Q form type', () => {
      const sgmlText = `
<SEC-DOCUMENT>
<ACCESSION-NUMBER>0000320193-23-000106
<CONFORMED-SUBMISSION-TYPE>10-Q
</SEC-DOCUMENT>`;

      expect(() => TenQ.fromSgmlText(sgmlText)).not.toThrow();
    });

    it('should accept 10-Q/A form type (amended)', () => {
      const sgmlText = `
<SEC-DOCUMENT>
<ACCESSION-NUMBER>0000320193-23-000106
<CONFORMED-SUBMISSION-TYPE>10-Q/A
</SEC-DOCUMENT>`;

      expect(() => TenQ.fromSgmlText(sgmlText)).not.toThrow();
    });

    it('should allow HTML-only construction (no form validation)', () => {
      const html = '<html><body><h1>Item 1</h1></body></html>';
      expect(() => TenQ.fromHtml(html)).not.toThrow();
    });
  });

  describe('static structure', () => {
    it('should have static structure property', () => {
      expect(TenQ.structure).toBe(TEN_Q_STRUCTURE);
    });

    it('should have correct part count', () => {
      expect(TenQ.structure.getParts()).toHaveLength(2);
    });
  });

  describe('section lookup formats', () => {
    // Create a mock TenQ with known sections
    let tenQ: TenQ;

    beforeEach(() => {
      tenQ = TenQ.fromHtml('<html></html>');
      // Manually add sections for testing lookups
      const mockSections = new Map([
        ['part_i_item_1', { name: 'part_i_item_1', title: 'Part I, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Financial Statements content' }],
        ['part_i_item_2', { name: 'part_i_item_2', title: 'Part I, Item 2', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'MD&A content' }],
        ['part_ii_item_1', { name: 'part_ii_item_1', title: 'Part II, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Legal Proceedings content' }],
        ['part_ii_item_1a', { name: 'part_ii_item_1a', title: 'Part II, Item 1A', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Risk Factors content' }],
      ]);
      // @ts-expect-error - accessing private property for testing
      tenQ._document = {
        sections: mockSections,
        text: () => '',
        headings: [],
        tables: [],
        metadata: {},
      };
    });

    it('should lookup by direct key (part_i_item_1)', () => {
      const result = tenQ.getSection('part_i_item_1');
      expect(result).toContain('Financial Statements');
    });

    it('should lookup by Part I, Item X format', () => {
      const result = tenQ.getSection('Part I, Item 1');
      expect(result).toContain('Financial Statements');
    });

    it('should lookup by Part II, Item X format', () => {
      const result = tenQ.getSection('Part II, Item 1');
      expect(result).toContain('Legal Proceedings');
    });

    it('should prefer Part I when using Item X format (backward compat)', () => {
      const result = tenQ.getSection('Item 1');
      // Should return Part I Item 1 (Financial Statements), not Part II Item 1 (Legal Proceedings)
      expect(result).toContain('Financial Statements');
    });

    it('should handle part number variations', () => {
      // Test with different part formats
      const result1 = tenQ.getSection('part i, item 1');
      const result2 = tenQ.getSection('Part 1, Item 1');
      expect(result1).toContain('Financial Statements');
      expect(result2).toContain('Financial Statements');
    });
  });

  describe('convenience accessors', () => {
    let tenQ: TenQ;

    beforeEach(() => {
      tenQ = TenQ.fromHtml('<html></html>');
      const mockSections = new Map([
        ['part_i_item_1', { name: 'part_i_item_1', title: 'Part I, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Financial Statements' }],
        ['part_i_item_2', { name: 'part_i_item_2', title: 'Part I, Item 2', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'MD&A content' }],
        ['part_i_item_3', { name: 'part_i_item_3', title: 'Part I, Item 3', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Market Risk' }],
        ['part_i_item_4', { name: 'part_i_item_4', title: 'Part I, Item 4', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Controls' }],
        ['part_ii_item_1', { name: 'part_ii_item_1', title: 'Part II, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Legal' }],
        ['part_ii_item_1a', { name: 'part_ii_item_1a', title: 'Part II, Item 1A', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Risk Factors' }],
        ['part_ii_item_6', { name: 'part_ii_item_6', title: 'Part II, Item 6', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Exhibits' }],
      ]);
      // @ts-expect-error - accessing private property for testing
      tenQ._document = {
        sections: mockSections,
        text: () => '',
        headings: [],
        tables: [],
        metadata: {},
      };
    });

    it('should access financialStatements (Part I, Item 1)', () => {
      expect(tenQ.financialStatements).toContain('Financial Statements');
    });

    it('should access mda (Part I, Item 2)', () => {
      expect(tenQ.mda).toContain('MD&A');
    });

    it('should access marketRisk (Part I, Item 3)', () => {
      expect(tenQ.marketRisk).toContain('Market Risk');
    });

    it('should access controlsAndProcedures (Part I, Item 4)', () => {
      expect(tenQ.controlsAndProcedures).toContain('Controls');
    });

    it('should access legalProceedings (Part II, Item 1)', () => {
      expect(tenQ.legalProceedings).toContain('Legal');
    });

    it('should access riskFactors (Part II, Item 1A)', () => {
      expect(tenQ.riskFactors).toContain('Risk Factors');
    });

    it('should access exhibits (Part II, Item 6)', () => {
      expect(tenQ.exhibits).toContain('Exhibits');
    });
  });

  describe('getItemWithPart()', () => {
    let tenQ: TenQ;

    beforeEach(() => {
      tenQ = TenQ.fromHtml('<html></html>');
      const mockSections = new Map([
        ['part_i_item_1', { name: 'part_i_item_1', title: 'Part I, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Financial Statements' }],
        ['part_ii_item_1', { name: 'part_ii_item_1', title: 'Part II, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Legal Proceedings' }],
      ]);
      // @ts-expect-error - accessing private property for testing
      tenQ._document = {
        sections: mockSections,
        text: () => '',
        headings: [],
        tables: [],
        metadata: {},
      };
    });

    it('should get Part I Item 1 with Part I specification', () => {
      const result = tenQ.getItemWithPart('Part I', 'Item 1');
      expect(result).toContain('Financial Statements');
    });

    it('should get Part II Item 1 with Part II specification', () => {
      const result = tenQ.getItemWithPart('Part II', 'Item 1');
      expect(result).toContain('Legal Proceedings');
    });

    it('should work with short part format (I)', () => {
      const result = tenQ.getItemWithPart('I', '1');
      expect(result).toContain('Financial Statements');
    });

    it('should work with short part format (II)', () => {
      const result = tenQ.getItemWithPart('II', '1');
      expect(result).toContain('Legal Proceedings');
    });

    it('should work with numeric part format (1)', () => {
      const result = tenQ.getItemWithPart('1', '1');
      expect(result).toContain('Financial Statements');
    });

    it('should work with numeric part format (2)', () => {
      const result = tenQ.getItemWithPart('2', '1');
      expect(result).toContain('Legal Proceedings');
    });

    it('should return null for non-existent item', () => {
      const result = tenQ.getItemWithPart('Part I', 'Item 99');
      expect(result).toBeNull();
    });
  });

  describe('getItemFromPart()', () => {
    let tenQ: TenQ;

    beforeEach(() => {
      tenQ = TenQ.fromHtml('<html></html>');
      const mockSections = new Map([
        ['part_i_item_1', { name: 'part_i_item_1', title: 'Part I, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Financial Statements' }],
        ['part_ii_item_1', { name: 'part_ii_item_1', title: 'Part II, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => 'Legal Proceedings' }],
      ]);
      // @ts-expect-error - accessing private property for testing
      tenQ._document = {
        sections: mockSections,
        text: () => '',
        headings: [],
        tables: [],
        metadata: {},
      };
    });

    it('should get item from Part I', () => {
      const result = tenQ.getItemFromPart('1', 'I');
      expect(result).toContain('Financial Statements');
    });

    it('should get item from Part II', () => {
      const result = tenQ.getItemFromPart('1', 'II');
      expect(result).toContain('Legal Proceedings');
    });

    it('should handle Item prefix in itemNum', () => {
      const result = tenQ.getItemFromPart('Item 1', 'I');
      expect(result).toContain('Financial Statements');
    });
  });

  describe('items property', () => {
    let tenQ: TenQ;

    beforeEach(() => {
      tenQ = TenQ.fromHtml('<html></html>');
      const mockSections = new Map([
        ['part_i_item_1', { name: 'part_i_item_1', title: 'Part I, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => '' }],
        ['part_i_item_2', { name: 'part_i_item_2', title: 'Part I, Item 2', confidence: 1, detectionMethod: 'pattern' as const, text: () => '' }],
        ['part_ii_item_1', { name: 'part_ii_item_1', title: 'Part II, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => '' }],
        ['part_ii_item_1a', { name: 'part_ii_item_1a', title: 'Part II, Item 1A', confidence: 1, detectionMethod: 'pattern' as const, text: () => '' }],
      ]);
      // @ts-expect-error - accessing private property for testing
      tenQ._document = {
        sections: mockSections,
        text: () => '',
        headings: [],
        tables: [],
        metadata: {},
      };
    });

    it('should return part-qualified item names', () => {
      const items = tenQ.items;
      expect(items).toContain('Part I, Item 1');
      expect(items).toContain('Part I, Item 2');
      expect(items).toContain('Part II, Item 1');
      expect(items).toContain('Part II, Item 1A');
    });

    it('should distinguish same item numbers in different parts', () => {
      const items = tenQ.items;
      // Both Item 1 should be present, qualified by part
      const partIItem1 = items.filter((i) => i === 'Part I, Item 1');
      const partIIItem1 = items.filter((i) => i === 'Part II, Item 1');
      expect(partIItem1).toHaveLength(1);
      expect(partIIItem1).toHaveLength(1);
    });
  });

  describe('getStructure()', () => {
    let tenQ: TenQ;

    beforeEach(() => {
      tenQ = TenQ.fromHtml('<html></html>');
      const mockSections = new Map([
        ['part_i_item_1', { name: 'part_i_item_1', title: 'Part I, Item 1', confidence: 1, detectionMethod: 'pattern' as const, text: () => '' }],
        ['part_i_item_2', { name: 'part_i_item_2', title: 'Part I, Item 2', confidence: 1, detectionMethod: 'pattern' as const, text: () => '' }],
        ['part_ii_item_1a', { name: 'part_ii_item_1a', title: 'Part II, Item 1A', confidence: 1, detectionMethod: 'pattern' as const, text: () => '' }],
      ]);
      // @ts-expect-error - accessing private property for testing
      tenQ._document = {
        sections: mockSections,
        text: () => '',
        headings: [],
        tables: [],
        metadata: {},
      };
    });

    it('should return structure with two parts', () => {
      const structure = tenQ.getStructure();
      expect(structure.parts).toHaveLength(2);
      expect(structure.parts[0].name).toBe('PART I');
      expect(structure.parts[1].name).toBe('PART II');
    });

    it('should mark existing items as exists=true', () => {
      const structure = tenQ.getStructure();
      const partI = structure.parts[0];

      const item1 = partI.items.find((i) => i.itemNum === '1');
      const item2 = partI.items.find((i) => i.itemNum === '2');

      expect(item1?.exists).toBe(true);
      expect(item2?.exists).toBe(true);
    });

    it('should mark missing items as exists=false', () => {
      const structure = tenQ.getStructure();
      const partI = structure.parts[0];
      const partII = structure.parts[1];

      // Part I Item 3 and 4 should not exist
      const item3 = partI.items.find((i) => i.itemNum === '3');
      const item4 = partI.items.find((i) => i.itemNum === '4');
      expect(item3?.exists).toBe(false);
      expect(item4?.exists).toBe(false);

      // Part II Item 1 should not exist (only 1A exists)
      const partIIItem1 = partII.items.find((i) => i.itemNum === '1');
      expect(partIIItem1?.exists).toBe(false);
    });

    it('should include item titles from structure', () => {
      const structure = tenQ.getStructure();
      const partI = structure.parts[0];

      const item1 = partI.items.find((i) => i.itemNum === '1');
      expect(item1?.title).toBe('Financial Statements');
    });
  });

  describe('form property', () => {
    it('should return 10-Q', () => {
      const tenQ = TenQ.fromHtml('<html></html>');
      expect(tenQ.form).toBe('10-Q');
    });
  });
});
