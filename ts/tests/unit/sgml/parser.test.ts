/**
 * SGML Parser unit tests.
 */

import { describe, it, expect } from 'vitest';
import { SGMLParser } from '../../../src/sgml/parser.js';

describe('SGMLParser', () => {
  it('should parse basic SGML tags', () => {
    const sgml = `
<SEC-DOCUMENT>0000320193-23-000106.txt
<TYPE>10-K
<SEQUENCE>1
</SEC-DOCUMENT>`;

    const parser = new SGMLParser(sgml);
    const result = parser.parse();

    expect(result.format).toBe('SEC-DOCUMENT');
  });

  it('should parse header tags', () => {
    const sgml = `
<ACCESSION-NUMBER>0000320193-23-000106
<CONFORMED-SUBMISSION-TYPE>10-K
<CIK>0000320193
<COMPANY-CONFORMED-NAME>APPLE INC`;

    const parser = new SGMLParser(sgml);
    const result = parser.parse();

    expect(result.header['ACCESSION-NUMBER']).toBe('0000320193-23-000106');
    expect(result.header['CONFORMED-SUBMISSION-TYPE']).toBe('10-K');
    expect(result.header['CIK']).toBe('0000320193');
  });

  it('should handle unclosed tags', () => {
    const sgml = `<CIK>0000320193
<COMPANY>APPLE INC
<FORM-TYPE>10-K`;

    const parser = new SGMLParser(sgml);
    const result = parser.parse();

    expect(result.header['CIK']).toBe('0000320193');
  });

  it('should parse document blocks', () => {
    const sgml = `
<DOCUMENT>
<TYPE>10-K
<SEQUENCE>1
<FILENAME>aapl.htm
<DESCRIPTION>10-K Annual Report
<TEXT>
<html><body>Hello World</body></html>
</TEXT>
</DOCUMENT>`;

    const parser = new SGMLParser(sgml);
    const result = parser.parse();

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].type).toBe('10-K');
    expect(result.documents[0].sequence).toBe(1);
    expect(result.documents[0].filename).toBe('aapl.htm');
    expect(result.documents[0].content).toContain('Hello World');
  });

  it('should parse multiple documents', () => {
    const sgml = `
<DOCUMENT>
<TYPE>10-K
<SEQUENCE>1
<FILENAME>doc1.htm
<TEXT>Document 1</TEXT>
</DOCUMENT>
<DOCUMENT>
<TYPE>EX-21
<SEQUENCE>2
<FILENAME>doc2.htm
<TEXT>Document 2</TEXT>
</DOCUMENT>`;

    const parser = new SGMLParser(sgml);
    const result = parser.parse();

    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].sequence).toBe(1);
    expect(result.documents[1].sequence).toBe(2);
    expect(result.documents[1].type).toBe('EX-21');
  });

  it('should detect SUBMISSION format', () => {
    const sgml = `<SUBMISSION>
<ACCESSION-NUMBER>0000320193-23-000106
</SUBMISSION>`;

    const parser = new SGMLParser(sgml);
    const result = parser.parse();

    expect(result.format).toBe('SUBMISSION');
  });

  it('should parse SEC-HEADER section', () => {
    const sgml = `
<SEC-HEADER>
ACCESSION NUMBER:		0000320193-23-000106
CONFORMED SUBMISSION TYPE:	10-K
FILED AS OF DATE:		20231103
<CIK>0000320193
</SEC-HEADER>`;

    const parser = new SGMLParser(sgml);
    const result = parser.parse();

    expect(result.header['ACCESSION-NUMBER']).toBe('0000320193-23-000106');
    expect(result.header['CONFORMED-SUBMISSION-TYPE']).toBe('10-K');
    expect(result.header['FILED-AS-OF-DATE']).toBe('20231103');
  });
});
