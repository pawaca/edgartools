/**
 * FilingSGML unit tests.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { FilingSGML } from '../../../src/sgml/filing-sgml.js';

describe('FilingSGML', () => {
  const samplePath = join(__dirname, '../../fixtures/sgml/sample-10k.txt');

  it('should create from text', () => {
    const text = readFileSync(samplePath, 'utf-8');
    const sgml = FilingSGML.fromText(text);

    expect(sgml).toBeInstanceOf(FilingSGML);
  });

  it('should parse header correctly', () => {
    const text = readFileSync(samplePath, 'utf-8');
    const sgml = FilingSGML.fromText(text);

    expect(sgml.cik).toBe('320193');
    expect(sgml.form).toBe('10-K');
    expect(sgml.accessionNumber).toBe('0000320193-23-000106');
  });

  it('should extract HTML content', () => {
    const text = readFileSync(samplePath, 'utf-8');
    const sgml = FilingSGML.fromText(text);

    const html = sgml.html();

    expect(html).not.toBeNull();
    expect(html).toContain('<html');
    expect(html).toContain('APPLE INC');
    expect(html).toContain('Item 1. Business');
  });

  it('should have attachments', () => {
    const text = readFileSync(samplePath, 'utf-8');
    const sgml = FilingSGML.fromText(text);

    const attachments = sgml.attachments;

    expect(attachments.length).toBeGreaterThan(0);
    expect(attachments[0].documentType).toBe('10-K');
    expect(attachments[0].document).toBe('aapl-20230930.htm');
  });

  it('should get document by sequence', () => {
    const text = readFileSync(samplePath, 'utf-8');
    const sgml = FilingSGML.fromText(text);

    const doc = sgml.getDocumentBySequence(1);

    expect(doc).not.toBeUndefined();
    expect(doc?.type).toBe('10-K');
  });

  it('should get document by name', () => {
    const text = readFileSync(samplePath, 'utf-8');
    const sgml = FilingSGML.fromText(text);

    const doc = sgml.getDocumentByName('aapl-20230930.htm');

    expect(doc).not.toBeUndefined();
    expect(doc?.type).toBe('10-K');
  });

  it('should return document count', () => {
    const text = readFileSync(samplePath, 'utf-8');
    const sgml = FilingSGML.fromText(text);

    expect(sgml.documentCount).toBe(1);
  });

  it('should detect SEC-DOCUMENT format', () => {
    const text = readFileSync(samplePath, 'utf-8');
    const sgml = FilingSGML.fromText(text);

    expect(sgml.format).toBe('SEC-DOCUMENT');
  });
});
