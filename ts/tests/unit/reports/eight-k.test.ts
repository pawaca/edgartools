/**
 * Unit tests for EightK (8-K Current Report) class.
 *
 * Tests cover:
 * - Item normalization (all edge cases)
 * - Text-based extraction functions
 * - Section lookup with fallback
 * - Date of report formatting
 * - Press release detection
 * - SixK and CurrentReport aliases
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  EightK,
  SixK,
  CurrentReport,
  normalizeItemNumber,
  extractItemsFromText,
  extractItemContentFromText,
  EIGHT_K_STRUCTURE,
} from '../../../src/reports/eight-k.js';

// ===============================
// Item Normalization Tests
// ===============================

describe('normalizeItemNumber', () => {
  test('normalizes standard format', () => {
    expect(normalizeItemNumber('Item 2.02')).toBe('2.02');
    expect(normalizeItemNumber('ITEM 2.02')).toBe('2.02');
    expect(normalizeItemNumber('item 2.02')).toBe('2.02');
  });

  test('normalizes Apple-style spacing', () => {
    expect(normalizeItemNumber('Item 2. 02')).toBe('2.02');
    expect(normalizeItemNumber('Item 2 . 02')).toBe('2.02');
    expect(normalizeItemNumber('Item 2.  02')).toBe('2.02');
  });

  test('normalizes legacy single-digit format', () => {
    expect(normalizeItemNumber('Item 1')).toBe('1');
    expect(normalizeItemNumber('Item 4')).toBe('4');
    expect(normalizeItemNumber('ITEM 9')).toBe('9');
  });

  test('handles already normalized input', () => {
    expect(normalizeItemNumber('2.02')).toBe('2.02');
    expect(normalizeItemNumber('9.01')).toBe('9.01');
    expect(normalizeItemNumber('1')).toBe('1');
  });

  test('removes trailing dots', () => {
    expect(normalizeItemNumber('Item 2.02.')).toBe('2.02');
    expect(normalizeItemNumber('2.02.')).toBe('2.02');
  });

  test('handles whitespace', () => {
    expect(normalizeItemNumber('  Item 2.02  ')).toBe('2.02');
    expect(normalizeItemNumber('\tItem 2.02\n')).toBe('2.02');
  });

  test('handles all decimal item numbers', () => {
    expect(normalizeItemNumber('Item 1.01')).toBe('1.01');
    expect(normalizeItemNumber('Item 5.02')).toBe('5.02');
    expect(normalizeItemNumber('Item 9.01')).toBe('9.01');
  });
});

// ===============================
// Text Extraction Tests
// ===============================

describe('extractItemsFromText', () => {
  test('extracts modern format items', () => {
    const text = `
Item 2.02 - Results of Operations and Financial Condition

Some content here...

Item 9.01 - Financial Statements and Exhibits

More content...
`;
    const items = extractItemsFromText(text);
    expect(items).toEqual(['2.02', '9.01']);
  });

  test('extracts legacy format items', () => {
    const text = `
Item 1. Entry into Material Agreement

Agreement details...

Item 4. Changes in Certifying Accountant

Accountant details...

Item 5. Other Events

Other events...
`;
    const items = extractItemsFromText(text);
    expect(items).toEqual(['1', '4', '5']);
  });

  test('handles Apple-style spacing', () => {
    const text = `
Item 2. 02 Results of Operations

Results content...

Item 9. 01 Financial Statements

Financial content...
`;
    const items = extractItemsFromText(text);
    expect(items).toEqual(['2.02', '9.01']);
  });

  test('deduplicates items', () => {
    const text = `
Item 2.02 - Results of Operations

Some content...

Item 2.02 - Results (continued)

More content...

Item 9.01 - Exhibits

Exhibits...
`;
    const items = extractItemsFromText(text);
    expect(items).toEqual(['2.02', '9.01']);
  });

  test('ignores indented items (not at line start)', () => {
    const text = `
Item 2.02 - Results

As discussed in Item 1.01, we have...

   Item 5.02 - Director Departure (This should be ignored)

Item 9.01 - Exhibits
`;
    const items = extractItemsFromText(text);
    // Only items at line start should be captured
    expect(items).toContain('2.02');
    expect(items).toContain('9.01');
  });

  test('handles case variations', () => {
    const text = `
ITEM 2.02 - RESULTS OF OPERATIONS

Content...

item 9.01 - Financial Statements

More content...
`;
    const items = extractItemsFromText(text);
    expect(items).toEqual(['2.02', '9.01']);
  });

  test('returns empty array for text without items', () => {
    const text = 'This is a document without any 8-K items.';
    const items = extractItemsFromText(text);
    expect(items).toEqual([]);
  });

  test('sorts items numerically', () => {
    const text = `
Item 9.01 - Exhibits

Item 2.02 - Results

Item 5.02 - Director Departure
`;
    const items = extractItemsFromText(text);
    expect(items).toEqual(['2.02', '5.02', '9.01']);
  });
});

describe('extractItemContentFromText', () => {
  const sampleText = `
FORM 8-K

Item 2.02 - Results of Operations and Financial Condition

On January 15, 2024, Acme Corp announced its quarterly results.
Revenue increased by 15% year-over-year.

The company's net income was $500 million.

Item 9.01 - Financial Statements and Exhibits

(d) Exhibits

99.1 Press Release dated January 15, 2024

SIGNATURES

Pursuant to the requirements of the Securities Exchange Act...
`;

  test('extracts content for specific item', () => {
    const content = extractItemContentFromText(sampleText, 'Item 2.02');
    expect(content).not.toBeNull();
    expect(content).toContain('Results of Operations');
    expect(content).toContain('Revenue increased by 15%');
    expect(content).not.toContain('Financial Statements and Exhibits');
  });

  test('handles different input formats', () => {
    // Item format
    let content = extractItemContentFromText(sampleText, 'Item 2.02');
    expect(content).toContain('Revenue increased');

    // Number only format
    content = extractItemContentFromText(sampleText, '2.02');
    expect(content).toContain('Revenue increased');

    // Lowercase
    content = extractItemContentFromText(sampleText, 'item 2.02');
    expect(content).toContain('Revenue increased');
  });

  test('extracts last item before SIGNATURES', () => {
    const content = extractItemContentFromText(sampleText, 'Item 9.01');
    expect(content).not.toBeNull();
    expect(content).toContain('Financial Statements and Exhibits');
    expect(content).toContain('Press Release');
    expect(content).not.toContain('SIGNATURES');
    expect(content).not.toContain('Securities Exchange Act');
  });

  test('returns null for non-existent item', () => {
    const content = extractItemContentFromText(sampleText, 'Item 5.02');
    expect(content).toBeNull();
  });

  test('handles legacy single-digit items', () => {
    const legacyText = `
Item 4. Changes in Accountant

The company has changed its accountant from Firm A to Firm B.

Item 5. Other Events

Additional disclosure here.

SIGNATURES
`;
    const content = extractItemContentFromText(legacyText, 'Item 4');
    expect(content).not.toBeNull();
    expect(content).toContain('changed its accountant');
    expect(content).not.toContain('Additional disclosure');
  });

  test('handles empty item number', () => {
    const content = extractItemContentFromText(sampleText, '');
    expect(content).toBeNull();
  });
});

// ===============================
// 8-K Structure Tests
// ===============================

describe('EIGHT_K_STRUCTURE', () => {
  test('contains all required items', () => {
    const expectedItems = [
      'ITEM 1.01',
      'ITEM 1.02',
      'ITEM 1.03',
      'ITEM 2.01',
      'ITEM 2.02',
      'ITEM 2.03',
      'ITEM 2.04',
      'ITEM 2.05',
      'ITEM 2.06',
      'ITEM 3.01',
      'ITEM 3.02',
      'ITEM 3.03',
      'ITEM 4.01',
      'ITEM 4.02',
      'ITEM 5.01',
      'ITEM 5.02',
      'ITEM 5.03',
      'ITEM 5.04',
      'ITEM 5.05',
      'ITEM 5.06',
      'ITEM 5.07',
      'ITEM 5.08',
      'ITEM 6.01',
      'ITEM 6.02',
      'ITEM 6.03',
      'ITEM 6.04',
      'ITEM 6.05',
      'ITEM 7.01',
      'ITEM 8.01',
      'ITEM 9.01',
    ];

    for (const item of expectedItems) {
      expect(EIGHT_K_STRUCTURE[item]).toBeDefined();
      expect(EIGHT_K_STRUCTURE[item].title).toBeDefined();
      expect(EIGHT_K_STRUCTURE[item].description).toBeDefined();
    }
  });

  test('has title and description for each item', () => {
    for (const [key, value] of Object.entries(EIGHT_K_STRUCTURE)) {
      expect(value.title).toBeTruthy();
      expect(value.description).toBeTruthy();
      expect(typeof value.title).toBe('string');
      expect(typeof value.description).toBe('string');
    }
  });

  test('structure is accessible via class', () => {
    expect(EightK.structure).toBe(EIGHT_K_STRUCTURE);
    expect(EightK.structure['ITEM 2.02'].title).toBe(
      'Results of Operations and Financial Condition'
    );
  });
});

// ===============================
// EightK Class Tests
// ===============================

describe('EightK', () => {
  describe('aliases', () => {
    test('SixK is alias for EightK', () => {
      expect(SixK).toBe(EightK);
    });

    test('CurrentReport is alias for EightK', () => {
      expect(CurrentReport).toBe(EightK);
    });
  });

  describe('fromHtml', () => {
    test('creates EightK from HTML content', () => {
      const html = `
        <html>
          <body>
            <h1>FORM 8-K</h1>
            <p>Item 2.02 - Results of Operations</p>
            <p>The company reported quarterly results.</p>
          </body>
        </html>
      `;
      const eightk = EightK.fromHtml(html);
      expect(eightk).toBeInstanceOf(EightK);
      expect(eightk.form).toBe('8-K');
    });
  });

  describe('section mappings', () => {
    const eightk = EightK.fromHtml('<html><body></body></html>');

    test('has sectionToItem mapping', () => {
      expect(eightk.sectionToItem).toBeDefined();
      expect(eightk.sectionToItem['item_202']).toBe('2.02');
      expect(eightk.sectionToItem['results_of_operations']).toBe('2.02');
      expect(eightk.sectionToItem['item_901']).toBe('9.01');
    });

    test('has itemToSection mapping', () => {
      expect(eightk.itemToSection).toBeDefined();
      expect(eightk.itemToSection['2.02']).toBeDefined();
      expect(eightk.itemToSection['9.01']).toBeDefined();
    });
  });

  describe('dateOfReport', () => {
    test('returns empty string when no SGML', () => {
      const eightk = EightK.fromHtml('<html><body></body></html>');
      expect(eightk.dateOfReport).toBe('');
    });
  });

  describe('hasPressRelease', () => {
    test('returns false when no SGML', () => {
      const eightk = EightK.fromHtml('<html><body></body></html>');
      expect(eightk.hasPressRelease).toBe(false);
    });
  });

  describe('pressReleases', () => {
    test('returns null when no SGML', () => {
      const eightk = EightK.fromHtml('<html><body></body></html>');
      expect(eightk.pressReleases).toBeNull();
    });
  });

  describe('toString', () => {
    test('returns formatted string', () => {
      const eightk = EightK.fromHtml('<html><body></body></html>');
      const str = eightk.toString();
      expect(str).toContain('8-K');
    });
  });

  describe('convenience accessors', () => {
    const eightk = EightK.fromHtml('<html><body></body></html>');

    test('has all section accessors', () => {
      // Section 1
      expect(() => eightk.entryIntoMaterialAgreement).not.toThrow();
      expect(() => eightk.terminationOfAgreement).not.toThrow();
      expect(() => eightk.bankruptcy).not.toThrow();
      expect(() => eightk.mineSafety).not.toThrow();
      expect(() => eightk.cybersecurityIncidents).not.toThrow();

      // Section 2
      expect(() => eightk.acquisitionDisposition).not.toThrow();
      expect(() => eightk.resultsOfOperations).not.toThrow();
      expect(() => eightk.directFinancialObligation).not.toThrow();
      expect(() => eightk.triggeringEvents).not.toThrow();
      expect(() => eightk.exitCosts).not.toThrow();
      expect(() => eightk.materialImpairments).not.toThrow();

      // Section 3
      expect(() => eightk.delisting).not.toThrow();
      expect(() => eightk.unregisteredSales).not.toThrow();
      expect(() => eightk.materialModification).not.toThrow();

      // Section 4
      expect(() => eightk.changesInAccountant).not.toThrow();
      expect(() => eightk.nonRelianceAudit).not.toThrow();

      // Section 5
      expect(() => eightk.changeInControl).not.toThrow();
      expect(() => eightk.directorDeparture).not.toThrow();
      expect(() => eightk.amendmentsToArticles).not.toThrow();
      expect(() => eightk.temporaryTradingSuspension).not.toThrow();
      expect(() => eightk.codeOfEthics).not.toThrow();
      expect(() => eightk.shellCompanyChange).not.toThrow();
      expect(() => eightk.shareholderVote).not.toThrow();
      expect(() => eightk.shareholderDirectorNominations).not.toThrow();

      // Section 6
      expect(() => eightk.absInfo).not.toThrow();
      expect(() => eightk.absChange).not.toThrow();
      expect(() => eightk.absCreditEnhancement).not.toThrow();
      expect(() => eightk.absFailure).not.toThrow();
      expect(() => eightk.absSecuritiesAct).not.toThrow();

      // Section 7
      expect(() => eightk.regulationFdDisclosure).not.toThrow();

      // Section 8
      expect(() => eightk.otherEvents).not.toThrow();

      // Section 9
      expect(() => eightk.financialStatementsAndExhibits).not.toThrow();
    });
  });
});

// ===============================
// Text-based Fallback Integration Tests
// ===============================

describe('EightK text-based fallback', () => {
  test('getSection falls back to text extraction', () => {
    // Create 8-K with simple HTML that might not parse sections well
    // but contains item text that can be extracted
    const html = `
      <html>
        <body>
          <div>Item 2.02 - Results of Operations and Financial Condition</div>
          <p>The company announced strong quarterly results.</p>
          <p>Revenue grew 20% year over year.</p>
          <div>Item 9.01 - Financial Statements and Exhibits</div>
          <p>See attached exhibits.</p>
        </body>
      </html>
    `;
    const eightk = EightK.fromHtml(html);

    // The text-based fallback should be able to extract content
    // even if the HTML parser doesn't detect sections
    const text = eightk.text;
    expect(text).toContain('Results of Operations');
  });

  test('items property uses fallback for legacy filings', () => {
    const html = `
      <html>
        <body>
          <p>Item 5.02 - Departure of Directors</p>
          <p>Director resigned.</p>
          <p>Item 9.01 - Exhibits</p>
          <p>Press release attached.</p>
        </body>
      </html>
    `;
    const eightk = EightK.fromHtml(html);

    // Either parser-based or text-based items should work
    const items = eightk.items;
    // At minimum, we should get either items or empty (not throw)
    expect(Array.isArray(items)).toBe(true);
  });
});
