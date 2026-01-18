# Task: Port Python Press Release Implementation to TypeScript

## Overview

Port the Python `PressRelease` and `PressReleases` classes from `edgar/company_reports/press_release.py` to TypeScript.

**IMPORTANT**: This is a PORT task. Study the Python implementation carefully and replicate its functionality in TypeScript. Do not create new features - faithfully reproduce Python behavior.

## Source Files to Port

| Python Source | TypeScript Target | Status |
|--------------|-------------------|--------|
| `edgar/company_reports/press_release.py` | `ts/src/reports/press-release.ts` | Needs creation |

## Python Implementation Analysis

### PressReleases Class (Collection)

```python
# Python: lines 13-33
class PressReleases:
    """Represent the attachment on an 8-K filing that could be press releases"""

    def __init__(self, attachments: Attachments):
        self.attachments: Attachments = attachments

    def __len__(self):
        return len(self.attachments)

    def __getitem__(self, item):
        attachment = self.attachments.get_by_index(item)
        if attachment:
            return PressRelease(attachment)
```

### PressRelease Class (Single Item)

```python
# Python: lines 36-86
class PressRelease:
    """Represents a press release attachment from an 8-K filing with Type EX-99.1"""

    def __init__(self, attachment: Attachment):
        self.attachment: Attachment = attachment

    def url(self):
        return self.attachment.url

    @property
    def document(self) -> str:
        return self.attachment.document

    @property
    def description(self) -> str:
        return self.attachment.description

    @lru_cache(maxsize=1)
    def html(self) -> Optional[str]:
        content = self.attachment.download()
        if content is None:
            return None
        if isinstance(content, bytes):
            return content.decode('utf-8', errors='replace')
        return content

    def text(self) -> Optional[str]:
        html = self.html()
        if html:
            return HtmlDocument.from_html(html, extract_data=False).text
        return None

    def open(self):
        self.attachment.open()

    def view(self):
        return self.to_markdown().view()

    def to_markdown(self):
        html = self.html()
        markdown_content = MarkdownContent.from_html(html, title="8-K Press Release")
        return markdown_content
```

### Integration with CurrentReport (8-K)

```python
# From current_report.py lines 344-361
@property
def has_press_release(self):
    return self.press_releases is not None

@property
def press_releases(self):
    from edgar.company_reports.press_release import PressReleases

    attachments: Attachments = self._filing.attachments
    html_document = "document.endswith('.htm')"
    named_release = "re.match('.*RELEASE', description)"
    type_ex_99 = "document_type in ['EX-99.1', 'EX-99', 'EX-99.01']"
    press_release_query = f"{html_document} and ({named_release} or {type_ex_99})"
    press_release_results = attachments.query(press_release_query)
    if press_release_results:
        return PressReleases(press_release_results)
```

## TypeScript Implementation Plan

### 1. Create Attachment Types (if not existing)

First, ensure attachment types exist in `ts/src/sgml/attachment.ts`:

```typescript
export interface Attachment {
  document: string;
  documentType: string;
  description: string;
  sequenceNumber: string;
  url?: string;
  download(): Promise<string | Buffer | null>;
  open(): void;
}

export interface Attachments {
  items: Attachment[];
  query(queryStr: string): Attachment[];
  getByIndex(index: number): Attachment | undefined;
}
```

### 2. Create Press Release Classes

Create `ts/src/reports/press-release.ts`:

```typescript
import type { Attachment, Attachments } from '../sgml/attachment.js';

/**
 * Collection of press release attachments from an 8-K filing.
 */
export class PressReleases {
  readonly attachments: Attachment[];

  constructor(attachments: Attachments | Attachment[]) {
    this.attachments = Array.isArray(attachments)
      ? attachments
      : attachments.items;
  }

  get length(): number {
    return this.attachments.length;
  }

  get(index: number): PressRelease | undefined {
    const attachment = this.attachments[index];
    return attachment ? new PressRelease(attachment) : undefined;
  }

  [Symbol.iterator](): Iterator<PressRelease> {
    let index = 0;
    const attachments = this.attachments;
    return {
      next(): IteratorResult<PressRelease> {
        if (index < attachments.length) {
          return { value: new PressRelease(attachments[index++]), done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }
}

/**
 * Single press release attachment from an 8-K filing.
 * Typically has document type EX-99.1.
 */
export class PressRelease {
  private _htmlCache: string | null = null;
  private _htmlCached = false;

  constructor(readonly attachment: Attachment) {}

  get url(): string {
    return this.attachment.url || '';
  }

  get document(): string {
    return this.attachment.document;
  }

  get description(): string {
    return this.attachment.description;
  }

  /**
   * Get HTML content (cached).
   * Mirrors Python's @lru_cache behavior.
   */
  async html(): Promise<string | null> {
    if (this._htmlCached) {
      return this._htmlCache;
    }

    const content = await this.attachment.download();
    if (content === null) {
      this._htmlCached = true;
      return null;
    }

    if (content instanceof Buffer) {
      this._htmlCache = content.toString('utf-8');
    } else {
      this._htmlCache = content;
    }
    this._htmlCached = true;
    return this._htmlCache;
  }

  /**
   * Get plain text content.
   */
  async text(): Promise<string | null> {
    const htmlContent = await this.html();
    if (!htmlContent) {
      return null;
    }
    // Use HTMLParser to extract text
    // Note: May need to import and use document parser
    return extractTextFromHtml(htmlContent);
  }

  /**
   * Open the press release in browser.
   */
  open(): void {
    this.attachment.open();
  }

  /**
   * Convert to markdown.
   */
  async toMarkdown(): Promise<string> {
    const htmlContent = await this.html();
    if (!htmlContent) {
      return '';
    }
    return convertHtmlToMarkdown(htmlContent, '8-K Press Release');
  }
}

// Helper functions
function extractTextFromHtml(html: string): string {
  // Simple text extraction - can be enhanced
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function convertHtmlToMarkdown(html: string, title: string): string {
  // Basic HTML to Markdown conversion
  // Can be enhanced with a proper library like turndown
  let md = `# ${title}\n\n`;
  md += extractTextFromHtml(html);
  return md;
}
```

### 3. Update EightK Class

Add press release detection to `ts/src/reports/eight-k.ts`:

```typescript
import { PressReleases } from './press-release.js';

export class EightK extends BaseReport {
  // ... existing code ...

  /**
   * Check if filing has press releases.
   */
  get hasPressRelease(): boolean {
    return this.pressReleases !== null;
  }

  /**
   * Get press release attachments.
   * Queries for EX-99.1, EX-99, EX-99.01 attachments.
   */
  get pressReleases(): PressReleases | null {
    if (!this._sgml) {
      return null;
    }

    const attachments = this._sgml.attachments;
    const pressReleaseAttachments = attachments.filter(att => {
      const doc = att.document.toLowerCase();
      const desc = att.description.toUpperCase();
      const type = att.documentType;

      const isHtml = doc.endsWith('.htm') || doc.endsWith('.html');
      const isNamedRelease = /RELEASE/i.test(desc);
      const isEx99 = ['EX-99.1', 'EX-99', 'EX-99.01'].includes(type);

      return isHtml && (isNamedRelease || isEx99);
    });

    if (pressReleaseAttachments.length > 0) {
      return new PressReleases(pressReleaseAttachments);
    }
    return null;
  }
}
```

## Testing Requirements

### Unit Tests

1. **PressReleases collection**:
   - Test `length` property
   - Test `get()` method
   - Test iterator
2. **PressRelease single item**:
   - Test `url`, `document`, `description` properties
   - Test `html()` caching behavior
   - Test `text()` extraction
3. **EightK integration**:
   - Test `hasPressRelease` property
   - Test `pressReleases` filtering logic

### Integration Tests

Test with real 8-K filings that have press releases:
- Earnings announcements
- Major corporate events
- Product launches

## Development Steps

1. Read Python source file thoroughly
2. Verify/create attachment types in `ts/src/sgml/attachment.ts`
3. Create `ts/src/reports/press-release.ts`:
   - Implement `PressReleases` class
   - Implement `PressRelease` class
   - Add helper functions for text/markdown extraction
4. Update `ts/src/reports/eight-k.ts`:
   - Add `hasPressRelease` property
   - Add `pressReleases` property with filtering logic
5. Update exports in `ts/src/reports/index.ts`
6. Write comprehensive tests
7. Run all tests: `npm test`

## Branch Information

Work on branch: `claude/ts-pressrelease-impl-SSJC5`

## Success Criteria

- [ ] `PressReleases` collection class implemented
- [ ] `PressRelease` single item class implemented
- [ ] HTML caching works correctly
- [ ] Text extraction works
- [ ] EightK integration with filtering logic
- [ ] All tests pass
- [ ] Code follows project conventions
