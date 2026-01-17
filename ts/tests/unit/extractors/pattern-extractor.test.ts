/**
 * Pattern Section Extractor unit tests.
 */

import { describe, it, expect } from 'vitest';
import { PatternSectionExtractor } from '../../../src/extractors/pattern-section-extractor.js';
import { TEN_K_PATTERNS } from '../../../src/extractors/patterns/ten-k.js';

describe('PatternSectionExtractor', () => {
  describe('Pattern matching', () => {
    it('should match Item 1 patterns', () => {
      const extractor = new PatternSectionExtractor('10-K');

      const variations = [
        'Item 1. Business',
        'ITEM 1 Business',
        'Item 1 - Business',
        'Item 1. BUSINESS',
      ];

      for (const text of variations) {
        const match = extractor.matchSection(text);
        expect(match?.name).toBe('item_1');
      }
    });

    it('should match Item 1A Risk Factors patterns', () => {
      const extractor = new PatternSectionExtractor('10-K');

      const variations = [
        'Item 1A. Risk Factors',
        'ITEM 1A - RISK FACTORS',
        'Item 1A: Risk Factors',
        'Item 1A Risk Factors',
      ];

      for (const text of variations) {
        const match = extractor.matchSection(text);
        expect(match?.name).toBe('item_1a');
      }
    });

    it('should match Item 7 MD&A patterns', () => {
      const extractor = new PatternSectionExtractor('10-K');

      const variations = [
        "Item 7. Management's Discussion and Analysis",
        'ITEM 7 Management Discussion and Analysis',
        "Item 7 - Management's Discussion",
      ];

      for (const text of variations) {
        const match = extractor.matchSection(text);
        expect(match?.name).toBe('item_7');
      }
    });

    it('should match Item 8 Financial Statements patterns', () => {
      const extractor = new PatternSectionExtractor('10-K');

      const variations = [
        'Item 8. Financial Statements and Supplementary Data',
        'ITEM 8 Financial Statements',
        'Item 8 - Financial Statements',
      ];

      for (const text of variations) {
        const match = extractor.matchSection(text);
        expect(match?.name).toBe('item_8');
      }
    });

    it('should not match unrelated text', () => {
      const extractor = new PatternSectionExtractor('10-K');

      const nonMatches = [
        'Introduction',
        'Summary',
        'Some random text',
        'Item without number',
      ];

      for (const text of nonMatches) {
        const match = extractor.matchSection(text);
        expect(match).toBeNull();
      }
    });

    it('should return confidence score', () => {
      const extractor = new PatternSectionExtractor('10-K');

      const match = extractor.matchSection('Item 1. Business');
      expect(match?.confidence).toBe(0.70);
    });

    it('should return section title', () => {
      const extractor = new PatternSectionExtractor('10-K');

      const match = extractor.matchSection('Item 1A. Risk Factors');
      expect(match?.title).toBe('Item 1A - Risk Factors');
    });
  });

  describe('TEN_K_PATTERNS', () => {
    it('should have patterns for all major sections', () => {
      const expectedSections = [
        'item_1',
        'item_1a',
        'item_1b',
        'item_2',
        'item_3',
        'item_7',
        'item_7a',
        'item_8',
        'item_9a',
        'item_10',
        'item_11',
        'item_12',
        'item_13',
        'item_14',
        'item_15',
      ];

      for (const section of expectedSections) {
        expect(TEN_K_PATTERNS[section]).toBeDefined();
        expect(TEN_K_PATTERNS[section].length).toBeGreaterThan(0);
      }
    });

    it('should have valid regex patterns', () => {
      for (const [, patterns] of Object.entries(TEN_K_PATTERNS)) {
        for (const pattern of patterns) {
          expect(pattern.pattern).toBeInstanceOf(RegExp);
          expect(typeof pattern.title).toBe('string');
          expect(pattern.title.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
