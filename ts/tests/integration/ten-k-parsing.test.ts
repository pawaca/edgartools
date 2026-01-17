/**
 * 10-K End-to-End Parsing integration tests.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { FilingSGML } from '../../src/sgml/filing-sgml.js';
import { HTMLParser } from '../../src/documents/parser.js';
import { TenK } from '../../src/reports/ten-k.js';

describe('10-K End-to-End Parsing', () => {
  let sampleSgml: string;
  let sgml: FilingSGML;
  let html: string | null;

  beforeAll(() => {
    const samplePath = join(__dirname, '../fixtures/sgml/sample-10k.txt');
    sampleSgml = readFileSync(samplePath, 'utf-8');
    sgml = FilingSGML.fromText(sampleSgml);
    html = sgml.html();
  });

  describe('SGML Parsing', () => {
    it('should parse SGML correctly', () => {
      expect(sgml).toBeInstanceOf(FilingSGML);
      expect(sgml.cik).toBe('320193');
      expect(sgml.form).toBe('10-K');
    });

    it('should extract HTML content', () => {
      expect(html).not.toBeNull();
      expect(html).toContain('<html');
    });

    it('should have correct accession number', () => {
      expect(sgml.accessionNumber).toBe('0000320193-23-000106');
    });

    it('should have attachments', () => {
      expect(sgml.attachments.length).toBeGreaterThan(0);
    });
  });

  describe('HTML Parsing', () => {
    it('should parse HTML into document', () => {
      const parser = new HTMLParser({ form: '10-K' });
      const doc = parser.parse(html!);

      expect(doc.root).toBeDefined();
      expect(doc.metadata.form).toBe('10-K');
    });

    it('should extract headings', () => {
      const parser = new HTMLParser({ form: '10-K' });
      const doc = parser.parse(html!);

      expect(doc.headings.length).toBeGreaterThan(5);
    });

    it('should extract tables', () => {
      const parser = new HTMLParser({ form: '10-K' });
      const doc = parser.parse(html!);

      expect(doc.tables.length).toBeGreaterThan(0);
    });

    it('should extract text', () => {
      const parser = new HTMLParser({ form: '10-K' });
      const doc = parser.parse(html!);

      const text = doc.text();
      expect(text).toContain('APPLE INC');
      expect(text).toContain('iPhone');
    });
  });

  describe('Section Detection', () => {
    it('should detect sections', () => {
      const parser = new HTMLParser({ form: '10-K' });
      const doc = parser.parse(html!);

      const sections = doc.sections;
      expect(sections.size).toBeGreaterThan(0);
    });

    it('should detect Item 1 Business', () => {
      const parser = new HTMLParser({ form: '10-K' });
      const doc = parser.parse(html!);

      const business = doc.getSection('item_1');
      expect(business).not.toBeNull();
      expect(business?.title).toContain('Business');
    });

    it('should detect Item 1A Risk Factors', () => {
      const parser = new HTMLParser({ form: '10-K' });
      const doc = parser.parse(html!);

      const riskFactors = doc.getSection('item_1a');
      expect(riskFactors).not.toBeNull();
      expect(riskFactors?.title).toContain('Risk');
    });

    it('should extract section text', () => {
      const parser = new HTMLParser({ form: '10-K' });
      const doc = parser.parse(html!);

      const business = doc.getSection('item_1');
      const text = business?.text();

      expect(text).toContain('Apple');
      expect(text).toContain('iPhone');
    });
  });

  describe('TenK Class', () => {
    it('should create from SGML text', () => {
      const tenk = TenK.fromSgmlText(sampleSgml);

      expect(tenk).toBeInstanceOf(TenK);
      expect(tenk.company).toContain('APPLE');
    });

    it('should provide section names', () => {
      const tenk = TenK.fromSgmlText(sampleSgml);

      const sectionNames = tenk.sectionNames;
      expect(sectionNames.length).toBeGreaterThan(0);
    });

    it('should provide business section', () => {
      const tenk = TenK.fromSgmlText(sampleSgml);

      const business = tenk.business;
      expect(business).not.toBeNull();
      expect(business).toContain('Apple');
    });

    it('should provide risk factors section', () => {
      const tenk = TenK.fromSgmlText(sampleSgml);

      const riskFactors = tenk.riskFactors;
      expect(riskFactors).not.toBeNull();
      // Check for content that's actually in the sample data
      expect(riskFactors?.toLowerCase()).toContain('financial condition');
    });

    it('should provide MD&A section', () => {
      const tenk = TenK.fromSgmlText(sampleSgml);

      const mda = tenk.mda;
      expect(mda).not.toBeNull();
      expect(mda).toContain('Fiscal');
    });

    it('should provide statistics', () => {
      const tenk = TenK.fromSgmlText(sampleSgml);

      const stats = tenk.stats;
      expect(stats.sectionCount).toBeGreaterThan(0);
      expect(stats.headingCount).toBeGreaterThan(0);
      expect(stats.tableCount).toBeGreaterThan(0);
      expect(stats.textLength).toBeGreaterThan(1000);
    });

    it('should provide full text', () => {
      const tenk = TenK.fromSgmlText(sampleSgml);

      const text = tenk.text;
      expect(text.length).toBeGreaterThan(1000);
      expect(text).toContain('APPLE');
    });

    it('should provide headings', () => {
      const tenk = TenK.fromSgmlText(sampleSgml);

      const headings = tenk.headings;
      expect(headings.length).toBeGreaterThan(5);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve section order', () => {
      const tenk = TenK.fromSgmlText(sampleSgml);
      const names = tenk.sectionNames;

      // Item 1 should come before Item 1A
      const idx1 = names.indexOf('item_1');
      const idx1a = names.indexOf('item_1a');

      if (idx1 !== -1 && idx1a !== -1) {
        expect(idx1).toBeLessThan(idx1a);
      }
    });

    it('should have reasonable section lengths', () => {
      const tenk = TenK.fromSgmlText(sampleSgml);

      const business = tenk.business;
      const riskFactors = tenk.riskFactors;

      // Business and Risk Factors should have substantial content
      if (business) {
        expect(business.length).toBeGreaterThan(100);
      }
      if (riskFactors) {
        expect(riskFactors.length).toBeGreaterThan(100);
      }
    });

    it('should extract table data correctly', () => {
      const parser = new HTMLParser({ form: '10-K' });
      const doc = parser.parse(html!);

      const tables = doc.tables;
      expect(tables.length).toBeGreaterThan(0);

      // Check first table structure
      const firstTable = tables[0];
      expect(firstTable.rows.length).toBeGreaterThan(0);
      expect(firstTable.rows[0].cells.length).toBeGreaterThan(0);
    });
  });
});
