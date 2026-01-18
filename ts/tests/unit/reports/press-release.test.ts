/**
 * Unit tests for PressRelease and PressReleases classes.
 */

import { describe, it, expect } from 'vitest';
import {
  PressRelease,
  PressReleases,
  filterPressReleaseAttachments,
} from '../../../src/reports/press-release.js';
import type { Attachment } from '../../../src/sgml/attachment.js';

/**
 * Create a mock attachment for testing.
 */
function createMockAttachment(options: Partial<Attachment> = {}): Attachment {
  return {
    sequence: options.sequence ?? 1,
    documentType: options.documentType ?? 'EX-99.1',
    document: options.document ?? 'ex99-1.htm',
    description: options.description ?? 'Press Release',
    content: options.content ?? '<html><body><h1>Press Release</h1><p>Content here.</p></body></html>',
    isEmpty: false,
    url: options.url ?? 'https://sec.gov/Archives/edgar/data/123456/ex99-1.htm',
    size: 1000,
    isBinary: () => false,
  };
}

describe('PressRelease', () => {
  describe('constructor and properties', () => {
    it('should create from attachment', () => {
      const attachment = createMockAttachment();
      const pr = new PressRelease(attachment);

      expect(pr.attachment).toBe(attachment);
    });

    it('should expose url property', () => {
      const attachment = createMockAttachment({
        url: 'https://example.com/pr.htm',
      });
      const pr = new PressRelease(attachment);

      expect(pr.url).toBe('https://example.com/pr.htm');
    });

    it('should expose document property', () => {
      const attachment = createMockAttachment({ document: 'my-release.htm' });
      const pr = new PressRelease(attachment);

      expect(pr.document).toBe('my-release.htm');
    });

    it('should expose description property', () => {
      const attachment = createMockAttachment({
        description: 'Earnings Release Q4 2023',
      });
      const pr = new PressRelease(attachment);

      expect(pr.description).toBe('Earnings Release Q4 2023');
    });
  });

  describe('html()', () => {
    it('should return HTML content', () => {
      const htmlContent = '<html><body>Test content</body></html>';
      const attachment = createMockAttachment({ content: htmlContent });
      const pr = new PressRelease(attachment);

      expect(pr.html()).toBe(htmlContent);
    });

    it('should return null for empty content', () => {
      const attachment = createMockAttachment({ content: '' });
      const pr = new PressRelease(attachment);

      expect(pr.html()).toBeNull();
    });

    it('should cache HTML content', () => {
      const attachment = createMockAttachment();
      const pr = new PressRelease(attachment);

      const first = pr.html();
      const second = pr.html();

      expect(first).toBe(second);
    });
  });

  describe('text()', () => {
    it('should extract text from HTML', () => {
      const attachment = createMockAttachment({
        content: '<html><body><h1>Title</h1><p>Paragraph text.</p></body></html>',
      });
      const pr = new PressRelease(attachment);

      const text = pr.text();

      expect(text).toContain('Title');
      expect(text).toContain('Paragraph text.');
      expect(text).not.toContain('<h1>');
      expect(text).not.toContain('<p>');
    });

    it('should remove script tags', () => {
      const attachment = createMockAttachment({
        content: '<html><body><script>alert("bad")</script><p>Safe content</p></body></html>',
      });
      const pr = new PressRelease(attachment);

      const text = pr.text();

      expect(text).not.toContain('alert');
      expect(text).toContain('Safe content');
    });

    it('should remove style tags', () => {
      const attachment = createMockAttachment({
        content: '<html><head><style>.class { color: red; }</style></head><body><p>Content</p></body></html>',
      });
      const pr = new PressRelease(attachment);

      const text = pr.text();

      expect(text).not.toContain('color: red');
      expect(text).toContain('Content');
    });

    it('should decode HTML entities', () => {
      const attachment = createMockAttachment({
        content: '<html><body><p>A &amp; B &lt; C &gt; D</p></body></html>',
      });
      const pr = new PressRelease(attachment);

      const text = pr.text();

      expect(text).toContain('A & B < C > D');
    });

    it('should return null for empty HTML', () => {
      const attachment = createMockAttachment({ content: '' });
      const pr = new PressRelease(attachment);

      expect(pr.text()).toBeNull();
    });
  });

  describe('toMarkdown()', () => {
    it('should create markdown with title', () => {
      const attachment = createMockAttachment({
        content: '<html><body><p>Some content</p></body></html>',
      });
      const pr = new PressRelease(attachment);

      const md = pr.toMarkdown();

      expect(md).toContain('# 8-K Press Release');
      expect(md).toContain('Some content');
    });

    it('should convert HTML headers to markdown', () => {
      const attachment = createMockAttachment({
        content: '<html><body><h2>Section</h2><p>Content</p></body></html>',
      });
      const pr = new PressRelease(attachment);

      const md = pr.toMarkdown();

      expect(md).toContain('## Section');
    });

    it('should return empty string for empty content', () => {
      const attachment = createMockAttachment({ content: '' });
      const pr = new PressRelease(attachment);

      expect(pr.toMarkdown()).toBe('');
    });
  });
});

describe('PressReleases', () => {
  describe('constructor and length', () => {
    it('should create from array of attachments', () => {
      const attachments = [
        createMockAttachment({ sequence: 1 }),
        createMockAttachment({ sequence: 2 }),
      ];
      const prs = new PressReleases(attachments);

      expect(prs.length).toBe(2);
    });

    it('should handle empty array', () => {
      const prs = new PressReleases([]);

      expect(prs.length).toBe(0);
    });
  });

  describe('get()', () => {
    it('should return PressRelease at index', () => {
      const attachments = [
        createMockAttachment({ document: 'pr1.htm' }),
        createMockAttachment({ document: 'pr2.htm' }),
      ];
      const prs = new PressReleases(attachments);

      const pr0 = prs.get(0);
      const pr1 = prs.get(1);

      expect(pr0).toBeInstanceOf(PressRelease);
      expect(pr0?.document).toBe('pr1.htm');
      expect(pr1).toBeInstanceOf(PressRelease);
      expect(pr1?.document).toBe('pr2.htm');
    });

    it('should return undefined for out of bounds index', () => {
      const prs = new PressReleases([createMockAttachment()]);

      expect(prs.get(5)).toBeUndefined();
      expect(prs.get(-1)).toBeUndefined();
    });
  });

  describe('getByIndex()', () => {
    it('should be an alias for get()', () => {
      const attachment = createMockAttachment({ document: 'test.htm' });
      const prs = new PressReleases([attachment]);

      const byGet = prs.get(0);
      const byGetByIndex = prs.getByIndex(0);

      expect(byGet?.document).toBe(byGetByIndex?.document);
    });
  });

  describe('iteration', () => {
    it('should support for...of loop', () => {
      const attachments = [
        createMockAttachment({ document: 'pr1.htm' }),
        createMockAttachment({ document: 'pr2.htm' }),
        createMockAttachment({ document: 'pr3.htm' }),
      ];
      const prs = new PressReleases(attachments);

      const documents: string[] = [];
      for (const pr of prs) {
        documents.push(pr.document);
      }

      expect(documents).toEqual(['pr1.htm', 'pr2.htm', 'pr3.htm']);
    });

    it('should support spread operator', () => {
      const attachments = [
        createMockAttachment({ document: 'a.htm' }),
        createMockAttachment({ document: 'b.htm' }),
      ];
      const prs = new PressReleases(attachments);

      const array = [...prs];

      expect(array.length).toBe(2);
      expect(array[0]).toBeInstanceOf(PressRelease);
    });
  });

  describe('toArray()', () => {
    it('should return array of PressRelease objects', () => {
      const attachments = [
        createMockAttachment({ document: 'pr1.htm' }),
        createMockAttachment({ document: 'pr2.htm' }),
      ];
      const prs = new PressReleases(attachments);

      const array = prs.toArray();

      expect(Array.isArray(array)).toBe(true);
      expect(array.length).toBe(2);
      expect(array.every((pr) => pr instanceof PressRelease)).toBe(true);
    });
  });
});

describe('filterPressReleaseAttachments', () => {
  describe('HTML file requirement', () => {
    it('should accept .htm files', () => {
      const attachments = [
        createMockAttachment({ document: 'press.htm', documentType: 'EX-99.1' }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(1);
    });

    it('should accept .html files', () => {
      const attachments = [
        createMockAttachment({ document: 'press.html', documentType: 'EX-99.1' }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(1);
    });

    it('should reject non-HTML files', () => {
      const attachments = [
        createMockAttachment({ document: 'press.pdf', documentType: 'EX-99.1' }),
        createMockAttachment({ document: 'press.xml', documentType: 'EX-99.1' }),
        createMockAttachment({ document: 'press.txt', documentType: 'EX-99.1' }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(0);
    });
  });

  describe('document type matching', () => {
    it('should match EX-99.1', () => {
      const attachments = [
        createMockAttachment({ document: 'ex.htm', documentType: 'EX-99.1' }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(1);
    });

    it('should match EX-99', () => {
      const attachments = [
        createMockAttachment({ document: 'ex.htm', documentType: 'EX-99' }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(1);
    });

    it('should match EX-99.01', () => {
      const attachments = [
        createMockAttachment({ document: 'ex.htm', documentType: 'EX-99.01' }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(1);
    });

    it('should not match other document types without RELEASE in description', () => {
      const attachments = [
        createMockAttachment({ document: 'ex.htm', documentType: 'EX-10.1', description: 'Agreement' }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(0);
    });
  });

  describe('description matching', () => {
    it('should match "Press Release" in description', () => {
      const attachments = [
        createMockAttachment({
          document: 'news.htm',
          documentType: 'EX-10',
          description: 'Press Release',
        }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(1);
    });

    it('should match "RELEASE" case-insensitively', () => {
      const attachments = [
        createMockAttachment({
          document: 'a.htm',
          documentType: 'OTHER',
          description: 'EARNINGS RELEASE',
        }),
        createMockAttachment({
          document: 'b.htm',
          documentType: 'OTHER',
          description: 'earnings release',
        }),
        createMockAttachment({
          document: 'c.htm',
          documentType: 'OTHER',
          description: 'Earnings Release Q4',
        }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(3);
    });

    it('should not match without RELEASE and non-EX-99 type', () => {
      const attachments = [
        createMockAttachment({
          document: 'news.htm',
          documentType: 'EX-10',
          description: 'Material Agreement',
        }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(0);
    });
  });

  describe('combined filtering', () => {
    it('should filter multiple attachments correctly', () => {
      const attachments = [
        // Should match: EX-99.1 + HTML
        createMockAttachment({
          document: 'ex99-1.htm',
          documentType: 'EX-99.1',
          description: 'Exhibit',
        }),
        // Should match: EX-99 + HTML
        createMockAttachment({
          document: 'ex99.htm',
          documentType: 'EX-99',
          description: 'Exhibit',
        }),
        // Should match: RELEASE in description + HTML
        createMockAttachment({
          document: 'news.htm',
          documentType: 'EX-10',
          description: 'Press Release',
        }),
        // Should NOT match: non-HTML
        createMockAttachment({
          document: 'ex99.pdf',
          documentType: 'EX-99.1',
          description: 'PDF Exhibit',
        }),
        // Should NOT match: no RELEASE and wrong type
        createMockAttachment({
          document: 'agreement.htm',
          documentType: 'EX-10.1',
          description: 'Agreement',
        }),
      ];

      const result = filterPressReleaseAttachments(attachments);

      expect(result.length).toBe(3);
      expect(result.map((a) => a.document)).toEqual([
        'ex99-1.htm',
        'ex99.htm',
        'news.htm',
      ]);
    });
  });
});
