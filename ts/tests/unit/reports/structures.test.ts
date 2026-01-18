/**
 * Unit tests for FilingStructure classes.
 */

import { describe, it, expect } from 'vitest';
import {
  FilingStructure,
  ItemOnlyFilingStructure,
  isValidItemForFiling,
  extractItemsFromSections,
  TEN_K_STRUCTURE,
  TEN_Q_STRUCTURE,
} from '../../../src/reports/structures.js';

describe('FilingStructure', () => {
  const testStructure = new FilingStructure({
    'PART I': {
      'ITEM 1': { Title: 'Business', Description: 'Business description' },
      'ITEM 1A': { Title: 'Risk Factors', Description: 'Risk factors description' },
      'ITEM 2': { Title: 'Properties', Description: 'Properties description' },
    },
    'PART II': {
      'ITEM 5': { Title: 'Market Info', Description: 'Market information' },
      'ITEM 7': { Title: 'MD&A', Description: 'Management discussion' },
    },
  });

  describe('getPart()', () => {
    it('should get part by uppercase name', () => {
      const part = testStructure.getPart('PART I');
      expect(part).toBeDefined();
      expect(part!['ITEM 1']).toBeDefined();
    });

    it('should get part by lowercase name (normalized)', () => {
      const part = testStructure.getPart('part i');
      expect(part).toBeDefined();
      expect(part!['ITEM 1']).toBeDefined();
    });

    it('should return undefined for non-existent part', () => {
      const part = testStructure.getPart('PART III');
      expect(part).toBeUndefined();
    });
  });

  describe('getItem()', () => {
    it('should get item with part specified', () => {
      const item = testStructure.getItem('ITEM 1', 'PART I');
      expect(item).toBeDefined();
      expect(item!.Title).toBe('Business');
    });

    it('should get item without part specified (searches all)', () => {
      const item = testStructure.getItem('ITEM 7');
      expect(item).toBeDefined();
      expect(item!.Title).toBe('MD&A');
    });

    it('should normalize item case', () => {
      const item = testStructure.getItem('item 1', 'part i');
      expect(item).toBeDefined();
      expect(item!.Title).toBe('Business');
    });

    it('should return undefined for non-existent item', () => {
      const item = testStructure.getItem('ITEM 99', 'PART I');
      expect(item).toBeUndefined();
    });

    it('should return undefined for item in wrong part', () => {
      const item = testStructure.getItem('ITEM 7', 'PART I');
      expect(item).toBeUndefined();
    });
  });

  describe('isValidItem()', () => {
    it('should return true for valid item with part', () => {
      expect(testStructure.isValidItem('ITEM 1', 'PART I')).toBe(true);
    });

    it('should return true for valid item without part', () => {
      expect(testStructure.isValidItem('ITEM 7')).toBe(true);
    });

    it('should return false for invalid item', () => {
      expect(testStructure.isValidItem('ITEM 99')).toBe(false);
    });

    it('should return false for item in wrong part', () => {
      expect(testStructure.isValidItem('ITEM 7', 'PART I')).toBe(false);
    });
  });

  describe('getParts()', () => {
    it('should return all part names', () => {
      const parts = testStructure.getParts();
      expect(parts).toContain('PART I');
      expect(parts).toContain('PART II');
      expect(parts).toHaveLength(2);
    });
  });

  describe('getItems()', () => {
    it('should return items for specific part', () => {
      const items = testStructure.getItems('PART I');
      expect(items).toContain('ITEM 1');
      expect(items).toContain('ITEM 1A');
      expect(items).toContain('ITEM 2');
      expect(items).not.toContain('ITEM 7');
    });

    it('should return all items without part specified', () => {
      const items = testStructure.getItems();
      expect(items).toContain('ITEM 1');
      expect(items).toContain('ITEM 7');
    });

    it('should return empty array for non-existent part', () => {
      const items = testStructure.getItems('PART III');
      expect(items).toEqual([]);
    });
  });
});

describe('ItemOnlyFilingStructure', () => {
  const testStructure = new ItemOnlyFilingStructure({
    'ITEM 2.02': { Title: 'Results of Operations', Description: 'Financial results' },
    'ITEM 8.01': { Title: 'Other Events', Description: 'Other events' },
    'ITEM 9.01': { Title: 'Exhibits', Description: 'Financial exhibits' },
  });

  describe('getPart()', () => {
    it('should always return undefined', () => {
      expect(testStructure.getPart('PART I')).toBeUndefined();
      expect(testStructure.getPart('anything')).toBeUndefined();
    });
  });

  describe('getItem()', () => {
    it('should get item directly by key', () => {
      const item = testStructure.getItem('ITEM 2.02');
      expect(item).toBeDefined();
      expect(item!.Title).toBe('Results of Operations');
    });

    it('should ignore part parameter', () => {
      const item = testStructure.getItem('ITEM 8.01', 'PART I');
      expect(item).toBeDefined();
      expect(item!.Title).toBe('Other Events');
    });

    it('should normalize case', () => {
      const item = testStructure.getItem('item 9.01');
      expect(item).toBeDefined();
      expect(item!.Title).toBe('Exhibits');
    });
  });

  describe('getItems()', () => {
    it('should return all items ignoring part', () => {
      const items = testStructure.getItems();
      expect(items).toContain('ITEM 2.02');
      expect(items).toContain('ITEM 8.01');
      expect(items).toContain('ITEM 9.01');
    });

    it('should ignore part parameter', () => {
      const items = testStructure.getItems('PART I');
      expect(items).toContain('ITEM 2.02');
    });
  });
});

describe('isValidItemForFiling()', () => {
  const structure = {
    'PART I': {
      'ITEM 1': { Title: 'Business', Description: '' },
      'ITEM 2': { Title: 'Properties', Description: '' },
    },
    'PART II': {
      'ITEM 5': { Title: 'Market', Description: '' },
    },
  };

  it('should return true for valid item with part', () => {
    expect(isValidItemForFiling(structure, 'ITEM 1', 'PART I')).toBe(true);
  });

  it('should return true for valid item without part', () => {
    expect(isValidItemForFiling(structure, 'ITEM 5')).toBe(true);
  });

  it('should return false for invalid item', () => {
    expect(isValidItemForFiling(structure, 'ITEM 99')).toBe(false);
  });

  it('should normalize case', () => {
    expect(isValidItemForFiling(structure, 'item 1', 'part i')).toBe(true);
  });
});

describe('extractItemsFromSections()', () => {
  it('should extract items using regex pattern', () => {
    const sections = new Map([
      ['item_1', { title: 'Item 1 - Business Description' }],
      ['item_2', { title: 'Item 2 - Properties' }],
    ]);

    const pattern = /^(Item\s+\d+)/i;
    const items = extractItemsFromSections(sections, pattern);

    expect(items).toEqual(['Item 1', 'Item 2']);
  });

  it('should use fallback for non-matching titles', () => {
    const sections = new Map([['section1', { title: 'Some Section - Details Here' }]]);

    const pattern = /^(Item\s+\d+)/i;
    const items = extractItemsFromSections(sections, pattern);

    expect(items).toEqual(['Some Section']);
  });

  it('should use full title if no dash separator', () => {
    const sections = new Map([['section1', { title: 'Full Section Title' }]]);

    const pattern = /^(Item\s+\d+)/i;
    const items = extractItemsFromSections(sections, pattern);

    expect(items).toEqual(['Full Section Title']);
  });

  it('should handle empty sections', () => {
    const sections = new Map();
    const pattern = /^(Item\s+\d+)/i;
    const items = extractItemsFromSections(sections, pattern);

    expect(items).toEqual([]);
  });
});

describe('TEN_K_STRUCTURE', () => {
  it('should have all four parts', () => {
    const parts = TEN_K_STRUCTURE.getParts();
    expect(parts).toContain('PART I');
    expect(parts).toContain('PART II');
    expect(parts).toContain('PART III');
    expect(parts).toContain('PART IV');
  });

  it('should have Item 1 (Business) in Part I', () => {
    const item = TEN_K_STRUCTURE.getItem('ITEM 1', 'PART I');
    expect(item).toBeDefined();
    expect(item!.Title).toBe('Business');
  });

  it('should have Item 7 (MD&A) in Part II', () => {
    const item = TEN_K_STRUCTURE.getItem('ITEM 7', 'PART II');
    expect(item).toBeDefined();
    expect(item!.Title).toContain('MD&A');
  });

  it('should have Item 10 (Directors) in Part III', () => {
    const item = TEN_K_STRUCTURE.getItem('ITEM 10', 'PART III');
    expect(item).toBeDefined();
    expect(item!.Title).toContain('Directors');
  });

  it('should have Item 15 (Exhibits) in Part IV', () => {
    const item = TEN_K_STRUCTURE.getItem('ITEM 15', 'PART IV');
    expect(item).toBeDefined();
    expect(item!.Title).toContain('Exhibits');
  });
});

describe('TEN_Q_STRUCTURE', () => {
  it('should have two parts', () => {
    const parts = TEN_Q_STRUCTURE.getParts();
    expect(parts).toContain('PART I');
    expect(parts).toContain('PART II');
    expect(parts).toHaveLength(2);
  });

  it('should have Item 1 (Financial Statements) in Part I', () => {
    const item = TEN_Q_STRUCTURE.getItem('ITEM 1', 'PART I');
    expect(item).toBeDefined();
    expect(item!.Title).toBe('Financial Statements');
  });

  it('should have Item 1 (Legal Proceedings) in Part II', () => {
    const item = TEN_Q_STRUCTURE.getItem('ITEM 1', 'PART II');
    expect(item).toBeDefined();
    expect(item!.Title).toBe('Legal Proceedings');
  });

  it('should have Item 1A (Risk Factors) in Part II', () => {
    const item = TEN_Q_STRUCTURE.getItem('ITEM 1A', 'PART II');
    expect(item).toBeDefined();
    expect(item!.Title).toBe('Risk Factors');
  });

  it('should have Part I items 1-4', () => {
    const items = TEN_Q_STRUCTURE.getItems('PART I');
    expect(items).toContain('ITEM 1');
    expect(items).toContain('ITEM 2');
    expect(items).toContain('ITEM 3');
    expect(items).toContain('ITEM 4');
    expect(items).toHaveLength(4);
  });

  it('should have Part II items 1, 1A, 2-6', () => {
    const items = TEN_Q_STRUCTURE.getItems('PART II');
    expect(items).toContain('ITEM 1');
    expect(items).toContain('ITEM 1A');
    expect(items).toContain('ITEM 2');
    expect(items).toContain('ITEM 3');
    expect(items).toContain('ITEM 4');
    expect(items).toContain('ITEM 5');
    expect(items).toContain('ITEM 6');
    expect(items).toHaveLength(7);
  });

  it('should distinguish between same items in different parts', () => {
    // Item 1 exists in both Part I and Part II with different titles
    const partIItem1 = TEN_Q_STRUCTURE.getItem('ITEM 1', 'PART I');
    const partIIItem1 = TEN_Q_STRUCTURE.getItem('ITEM 1', 'PART II');

    expect(partIItem1!.Title).toBe('Financial Statements');
    expect(partIIItem1!.Title).toBe('Legal Proceedings');
  });
});
