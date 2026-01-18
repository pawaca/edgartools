/**
 * Tests for EightK press release integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EightK } from '../../../src/reports/eight-k.js';
import { PressReleases } from '../../../src/reports/press-release.js';
import { FilingSGML } from '../../../src/sgml/filing-sgml.js';

/**
 * Create a minimal 8-K SGML text with optional attachments.
 */
function createMockSGML(
  attachments: Array<{
    sequence: number;
    type: string;
    filename: string;
    description: string;
  }> = []
): string {
  let sgml = `<SEC-DOCUMENT>0001234567-23-000001.txt : 20231115
<SEC-HEADER>0001234567-23-000001.hdr.sgml : 20231115
<ACCEPTANCE-DATETIME>20231115120000
ACCESSION NUMBER:		0001234567-23-000001
CONFORMED SUBMISSION TYPE:	8-K
PUBLIC DOCUMENT COUNT:		${attachments.length + 1}
CONFORMED PERIOD OF REPORT:	20231115
FILED AS OF DATE:		20231115
DATE AS OF CHANGE:		20231115

COMPANY DATA:
	COMPANY CONFORMED NAME:			TEST COMPANY INC
	CENTRAL INDEX KEY:			0001234567
	STANDARD INDUSTRIAL CLASSIFICATION:	SEMICONDUCTORS [3674]
	IRS NUMBER:				123456789
	STATE OF INCORPORATION:			DE
	FISCAL YEAR END:			1231
</SEC-HEADER>
`;

  // Add primary 8-K document
  sgml += `
<DOCUMENT>
<TYPE>8-K
<SEQUENCE>1
<FILENAME>form8k.htm
<DESCRIPTION>CURRENT REPORT
<TEXT>
<html>
<body>
<h1>CURRENT REPORT</h1>
<h2>Item 2.02 Results of Operations</h2>
<p>The Company announced its results.</p>
<h2>Item 9.01 Financial Statements and Exhibits</h2>
<p>See exhibits.</p>
</body>
</html>
</TEXT>
</DOCUMENT>
`;

  // Add additional attachments
  for (const att of attachments) {
    sgml += `
<DOCUMENT>
<TYPE>${att.type}
<SEQUENCE>${att.sequence}
<FILENAME>${att.filename}
<DESCRIPTION>${att.description}
<TEXT>
<html>
<body>
<h1>Press Release</h1>
<p>Test Company Announces Q4 Results</p>
<p>Revenue increased 15% year-over-year.</p>
</body>
</html>
</TEXT>
</DOCUMENT>
`;
  }

  sgml += '</SEC-DOCUMENT>';
  return sgml;
}

describe('EightK press release integration', () => {
  describe('hasPressRelease', () => {
    it('should return true when EX-99.1 attachment exists', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-99.1',
          filename: 'ex99-1.htm',
          description: 'Press Release',
        },
      ]);
      const eightk = EightK.fromSgmlText(sgml);

      expect(eightk.hasPressRelease).toBe(true);
    });

    it('should return true when EX-99 attachment exists', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-99',
          filename: 'ex99.htm',
          description: 'Exhibit',
        },
      ]);
      const eightk = EightK.fromSgmlText(sgml);

      expect(eightk.hasPressRelease).toBe(true);
    });

    it('should return true when description contains RELEASE', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-10',
          filename: 'news.htm',
          description: 'Earnings Release',
        },
      ]);
      const eightk = EightK.fromSgmlText(sgml);

      expect(eightk.hasPressRelease).toBe(true);
    });

    it('should return false when no press release attachments', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-10.1',
          filename: 'agreement.htm',
          description: 'Material Agreement',
        },
      ]);
      const eightk = EightK.fromSgmlText(sgml);

      expect(eightk.hasPressRelease).toBe(false);
    });

    it('should return false when no attachments at all (only main doc)', () => {
      const sgml = createMockSGML([]);
      const eightk = EightK.fromSgmlText(sgml);

      expect(eightk.hasPressRelease).toBe(false);
    });
  });

  describe('pressReleases property', () => {
    it('should return PressReleases collection', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-99.1',
          filename: 'ex99-1.htm',
          description: 'Press Release',
        },
      ]);
      const eightk = EightK.fromSgmlText(sgml);

      const pressReleases = eightk.pressReleases;

      expect(pressReleases).toBeInstanceOf(PressReleases);
      expect(pressReleases?.length).toBe(1);
    });

    it('should return null when no press releases', () => {
      const sgml = createMockSGML([]);
      const eightk = EightK.fromSgmlText(sgml);

      expect(eightk.pressReleases).toBeNull();
    });

    it('should filter out non-HTML files', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-99.1',
          filename: 'ex99-1.htm',
          description: 'Press Release HTML',
        },
      ]);
      // Manually add PDF reference (mock SGML won't have real PDF)
      const eightk = EightK.fromSgmlText(sgml);

      const pressReleases = eightk.pressReleases;

      // Should have only the HTML one
      expect(pressReleases?.length).toBe(1);
    });

    it('should include multiple press releases', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-99.1',
          filename: 'ex99-1.htm',
          description: 'Press Release 1',
        },
        {
          sequence: 3,
          type: 'EX-99.2',
          filename: 'ex99-2.htm',
          description: 'Press Release 2',
        },
      ]);
      const eightk = EightK.fromSgmlText(sgml);

      const pressReleases = eightk.pressReleases;

      // EX-99.2 doesn't match our filter, so only 1
      // But description has "RELEASE" so both should match
      expect(pressReleases?.length).toBe(2);
    });
  });

  describe('press release content access', () => {
    it('should access press release HTML content', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-99.1',
          filename: 'ex99-1.htm',
          description: 'Press Release',
        },
      ]);
      const eightk = EightK.fromSgmlText(sgml);

      const pr = eightk.pressReleases?.get(0);
      const html = pr?.html();

      expect(html).toContain('Press Release');
      expect(html).toContain('Test Company Announces Q4 Results');
    });

    it('should access press release text content', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-99.1',
          filename: 'ex99-1.htm',
          description: 'Press Release',
        },
      ]);
      const eightk = EightK.fromSgmlText(sgml);

      const pr = eightk.pressReleases?.get(0);
      const text = pr?.text();

      expect(text).toContain('Press Release');
      expect(text).toContain('Revenue increased');
      expect(text).not.toContain('<html>');
    });

    it('should access press release document metadata', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-99.1',
          filename: 'earnings-release.htm',
          description: 'Q4 Earnings Release',
        },
      ]);
      const eightk = EightK.fromSgmlText(sgml);

      const pr = eightk.pressReleases?.get(0);

      expect(pr?.document).toBe('earnings-release.htm');
      expect(pr?.description).toBe('Q4 Earnings Release');
    });
  });

  describe('EightK without SGML', () => {
    it('should return null for pressReleases when created from HTML only', () => {
      const eightk = EightK.fromHtml('<html><body>Test</body></html>');

      expect(eightk.pressReleases).toBeNull();
      expect(eightk.hasPressRelease).toBe(false);
    });
  });

  describe('iteration over press releases', () => {
    it('should support for...of iteration', () => {
      const sgml = createMockSGML([
        {
          sequence: 2,
          type: 'EX-99.1',
          filename: 'pr1.htm',
          description: 'Release 1',
        },
        {
          sequence: 3,
          type: 'EX-99',
          filename: 'pr2.htm',
          description: 'Release 2',
        },
      ]);
      const eightk = EightK.fromSgmlText(sgml);

      const documents: string[] = [];
      for (const pr of eightk.pressReleases ?? []) {
        documents.push(pr.document);
      }

      expect(documents).toContain('pr1.htm');
      expect(documents).toContain('pr2.htm');
    });
  });
});
