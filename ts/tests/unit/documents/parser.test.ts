/**
 * HTMLParser unit tests.
 */

import { describe, it, expect } from 'vitest';
import { HTMLParser, DocumentTooLargeError } from '../../../src/documents/parser.js';

describe('HTMLParser', () => {
  it('should parse basic HTML', () => {
    const html = '<html><body><h1>Test</h1><p>Content</p></body></html>';
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    expect(doc.root).toBeDefined();
    expect(doc.headings).toHaveLength(1);
    expect(doc.headings[0].content).toBe('Test');
  });

  it('should handle empty HTML', () => {
    const html = '';
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    expect(doc.isEmpty).toBe(true);
  });

  it('should handle whitespace-only HTML', () => {
    const html = '   \n\t  ';
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    expect(doc.isEmpty).toBe(true);
  });

  it('should extract text content', () => {
    const html = `
      <html>
      <body>
        <h1>Title</h1>
        <p>Paragraph one.</p>
        <p>Paragraph two.</p>
      </body>
      </html>
    `;
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    const text = doc.text();
    expect(text).toContain('Title');
    expect(text).toContain('Paragraph one');
    expect(text).toContain('Paragraph two');
  });

  it('should parse tables', () => {
    const html = `
      <html>
      <body>
        <table>
          <tr><th>Header 1</th><th>Header 2</th></tr>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      </body>
      </html>
    `;
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    expect(doc.tables).toHaveLength(1);
    expect(doc.tables[0].rows).toHaveLength(2);
    expect(doc.tables[0].rows[0].cells[0].isHeader).toBe(true);
  });

  it('should extract metadata from meta tags', () => {
    const html = `
      <html>
      <head>
        <meta name="company" content="APPLE INC">
        <meta name="filing-type" content="10-K">
        <meta name="cik" content="0000320193">
      </head>
      <body></body>
      </html>
    `;
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    expect(doc.metadata.company).toBe('APPLE INC');
    expect(doc.metadata.form).toBe('10-K');
    expect(doc.metadata.cik).toBe('0000320193');
  });

  it('should use form from config', () => {
    const html = '<html><body></body></html>';
    const parser = new HTMLParser({ form: '10-K' });
    const doc = parser.parse(html);

    expect(doc.metadata.form).toBe('10-K');
  });

  it('should handle malformed HTML', () => {
    const html = '<p>Unclosed paragraph<p>Another one';
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    expect(doc.root).toBeDefined();
  });

  it('should remove script and style tags', () => {
    const html = `
      <html>
      <head>
        <script>alert('hello');</script>
        <style>.foo { color: red; }</style>
      </head>
      <body>
        <p>Content</p>
      </body>
      </html>
    `;
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    const text = doc.text();
    expect(text).not.toContain('alert');
    expect(text).not.toContain('color');
    expect(text).toContain('Content');
  });

  it('should throw on null input', () => {
    const parser = new HTMLParser();
    expect(() => parser.parse(null as unknown as string)).toThrow(TypeError);
  });

  it('should parse nested headings', () => {
    const html = `
      <html>
      <body>
        <h1>Main Title</h1>
        <h2>Section 1</h2>
        <h3>Subsection 1.1</h3>
        <h2>Section 2</h2>
      </body>
      </html>
    `;
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    expect(doc.headings).toHaveLength(4);
    expect(doc.headings[0].level).toBe(1);
    expect(doc.headings[1].level).toBe(2);
    expect(doc.headings[2].level).toBe(3);
  });

  it('should parse links', () => {
    const html = `
      <html>
      <body>
        <a href="#section1">Section 1</a>
        <a href="https://example.com">External</a>
      </body>
      </html>
    `;
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    const links = doc.root.find(node => node.type === 'link');
    expect(links).toHaveLength(2);
  });

  it('should handle lists', () => {
    const html = `
      <html>
      <body>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <ol>
          <li>First</li>
          <li>Second</li>
        </ol>
      </body>
      </html>
    `;
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    const lists = doc.root.find(node => node.type === 'list');
    expect(lists).toHaveLength(2);
  });

  it('should record parse time', () => {
    const html = '<html><body><p>Test</p></body></html>';
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    expect(doc.metadata.parseTime).toBeGreaterThan(0);
  });

  it('should record document size', () => {
    const html = '<html><body><p>Test</p></body></html>';
    const parser = new HTMLParser();
    const doc = parser.parse(html);

    expect(doc.metadata.size).toBeGreaterThan(0);
  });
});
